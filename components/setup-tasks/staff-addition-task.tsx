"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { Plus, Trash2, Check } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { BirthdayPicker } from "@/components/ui/birthday-picker";

type Staff = {
  id: string;
  name: string;
  role: "teacher" | "kindergarten_teacher" | "assistant" | "other";
  birthday?: string; // Format: DD/MM
  showCalendar?: boolean; // Track if calendar is visible
  isExisting?: boolean; // Track if this is an existing DB record
};

interface ExistingStaffFromDB {
  id: string;
  name: string;
  role: "teacher" | "kindergarten_teacher" | "assistant" | "other";
  birthday?: string | null; // DB format: YYYY-MM-DD
}

interface StaffAdditionTaskProps {
  classId: string;
  estimatedStaff: number;
  existingStaff?: ExistingStaffFromDB[];
  onComplete: () => void;
  onCancel: () => void;
}

// Helper to convert DB date format (YYYY-MM-DD) to display format (DD/MM)
function formatBirthdayFromDB(dbDate: string | null | undefined): string {
  if (!dbDate) return "";
  const parts = dbDate.split("-");
  if (parts.length !== 3) return "";
  return `${parts[2]}/${parts[1]}`; // DD/MM from YYYY-MM-DD
}

export function StaffAdditionTask({
  classId,
  estimatedStaff,
  existingStaff,
  onComplete,
  onCancel,
}: StaffAdditionTaskProps) {
  const [staff, setStaff] = useState<Staff[]>(() => {
    const initialStaff: Staff[] = [];

    // First, load existing staff from database
    if (existingStaff && existingStaff.length > 0) {
      existingStaff.forEach((s) => {
        initialStaff.push({
          id: s.id, // Keep the real database ID
          name: s.name,
          role: s.role,
          birthday: formatBirthdayFromDB(s.birthday),
          showCalendar: false,
          isExisting: true, // Mark as existing record
        });
      });
    }

    // Then, add empty slots to reach estimated count (if needed)
    const slotsToAdd = Math.max(0, estimatedStaff - initialStaff.length);
    for (let i = 0; i < slotsToAdd; i++) {
      initialStaff.push({
        id: `staff-${Date.now()}-${i}`,
        name: "",
        role: initialStaff.length === 0 ? "teacher" : "assistant",
        birthday: "",
        showCalendar: false,
        isExisting: false,
      });
    }

    return initialStaff;
  });

  const [loading, setLoading] = useState(false);
  const calendarRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  const addStaff = () => {
    const newStaff: Staff = {
      id: `staff-${Date.now()}`,
      name: "",
      role: "teacher",
      birthday: "",
      showCalendar: false,
      isExisting: false,
    };
    setStaff([...staff, newStaff]);
  };

  const updateStaff = (id: string, field: keyof Staff, value: string | boolean) => {
    setStaff((prevStaff) =>
      prevStaff.map((s) =>
        s.id === id ? { ...s, [field]: value } : s
      )
    );
  };

  // Close calendar when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      setStaff((prevStaff) => {
        let updated = false;
        const newStaff = prevStaff.map((person) => {
          if (person.showCalendar) {
            const calendarEl = calendarRefs.current[person.id];
            if (calendarEl && !calendarEl.contains(event.target as Node)) {
              updated = true;
              return { ...person, showCalendar: false };
            }
          }
          return person;
        });
        return updated ? newStaff : prevStaff;
      });
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const removeStaff = (id: string) => {
    if (staff.length <= 1) {
      alert("חייב להיות לפחות איש צוות אחד");
      return;
    }
    setStaff(staff.filter((s) => s.id !== id));
  };

  const getRoleLabel = (role: Staff["role"]) => {
    const labels: Record<Staff["role"], string> = {
      teacher: "מורה",
      kindergarten_teacher: "גננת",
      assistant: "סייע/ת",
      other: "אחר",
    };
    return labels[role];
  };

  const formatBirthdayInput = (value: string) => {
    // Remove non-numeric characters
    const numeric = value.replace(/[^0-9]/g, "");

    // Format as DD/MM
    if (numeric.length <= 2) {
      return numeric;
    } else if (numeric.length <= 4) {
      return `${numeric.slice(0, 2)}/${numeric.slice(2)}`;
    }
    return `${numeric.slice(0, 2)}/${numeric.slice(2, 4)}`;
  };

  const validateBirthday = (birthday: string): boolean => {
    if (!birthday) return true; // Optional field

    const parts = birthday.split("/");
    if (parts.length !== 2) return false;

    const day = parseInt(parts[0]);
    const month = parseInt(parts[1]);

    return (
      day >= 1 &&
      day <= 31 &&
      month >= 1 &&
      month <= 12
    );
  };


  const handleSave = async () => {
    // Filter out empty staff entries (no name filled in)
    const staffWithData = staff.filter((s) => s.name.trim() !== "");

    // Validate non-empty staff have role
    const invalidStaff = staffWithData.filter((s) => !s.role);

    if (invalidStaff.length > 0) {
      alert("אנא מלאו תפקיד לכל אנשי הצוות");
      return;
    }

    // Validate birthdays
    const invalidBirthdays = staffWithData.filter(
      (s) => s.birthday && !validateBirthday(s.birthday)
    );

    if (invalidBirthdays.length > 0) {
      alert("תאריכי לידה לא תקינים. אנא השתמשו בפורמט DD/MM");
      return;
    }

    if (staffWithData.length === 0) {
      alert("אנא הוסיפו לפחות איש צוות אחד");
      return;
    }

    setLoading(true);

    try {
      const supabase = createClient();

      // Helper to convert birthday
      const convertBirthday = (birthday: string | undefined) => {
        if (!birthday) return null;
        const parts = birthday.split("/");
        if (parts.length !== 2) return null;
        const day = parts[0].padStart(2, "0");
        const month = parts[1].padStart(2, "0");
        return `2000-${month}-${day}`;
      };

      // Separate existing staff (to update) from new staff (to insert)
      const existingToUpdate = staffWithData.filter((s) => s.isExisting);
      const newToInsert = staffWithData.filter((s) => !s.isExisting);

      // Update existing staff members
      for (const s of existingToUpdate) {
        const { error } = await supabase
          .from("staff")
          .update({
            name: s.name,
            role: s.role,
            birthday: convertBirthday(s.birthday),
          })
          .eq("id", s.id);

        if (error) throw error;
      }

      // Insert new staff members
      if (newToInsert.length > 0) {
        const staffToInsert = newToInsert.map((s) => ({
          class_id: classId,
          name: s.name,
          role: s.role,
          birthday: convertBirthday(s.birthday),
        }));

        const { error } = await supabase.from("staff").insert(staffToInsert);
        if (error) throw error;
      }

      // Update setup progress
      const storedProgress = localStorage.getItem(`setup_progress_${classId}`);
      const progress = storedProgress ? JSON.parse(storedProgress) : {};
      progress.completedTasks = progress.completedTasks || [];

      if (!progress.completedTasks.includes("add_staff")) {
        progress.completedTasks.push("add_staff");
      }

      localStorage.setItem(`setup_progress_${classId}`, JSON.stringify(progress));

      onComplete();
    } catch (error: any) {
      console.error("Error saving staff:", error);
      console.error("Error details:", {
        message: error?.message,
        details: error?.details,
        hint: error?.hint,
        code: error?.code
      });
      alert(`שגיאה בשמירת הנתונים: ${error?.message || 'אנא נסו שוב'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4 p-4" dir="rtl">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">הוסיפו את אנשי הצוות</h3>
        <span className="text-sm text-muted-foreground">
          {staff.length} {staff.length === 1 ? "איש צוות" : "אנשי צוות"}
        </span>
      </div>

      <div className="max-h-96 overflow-y-auto space-y-3">
        {staff.map((person, index) => (
          <Card key={person.id} className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-foreground">
                איש צוות #{index + 1}
              </span>
              {staff.length > 1 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeStaff(person.id)}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              )}
            </div>

            <div className="grid md:grid-cols-3 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">שם מלא *</Label>
                <Input
                  value={person.name}
                  onChange={(e) => updateStaff(person.id, "name", e.target.value)}
                  placeholder="לדוגמה: רחל כהן"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs">תפקיד *</Label>
                <Select
                  value={person.role}
                  onValueChange={(value) =>
                    updateStaff(person.id, "role", value as Staff["role"])
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="teacher">{getRoleLabel("teacher")}</SelectItem>
                    <SelectItem value="kindergarten_teacher">{getRoleLabel("kindergarten_teacher")}</SelectItem>
                    <SelectItem value="assistant">{getRoleLabel("assistant")}</SelectItem>
                    <SelectItem value="other">{getRoleLabel("other")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1 relative">
                <Label className="text-xs">יום הולדת (DD/MM)</Label>
                <Input
                  value={person.birthday || ""}
                  onChange={(e) => {
                    const formatted = formatBirthdayInput(e.target.value);
                    updateStaff(person.id, "birthday", formatted);
                  }}
                  onFocus={() => updateStaff(person.id, "showCalendar", true)}
                  placeholder="15/03"
                  maxLength={5}
                />
                {person.showCalendar && (
                  <div
                    ref={(el) => { calendarRefs.current[person.id] = el; }}
                    className="absolute top-full left-0 right-0 z-50 mt-1"
                  >
                    <BirthdayPicker
                      value={person.birthday}
                      onSelect={(value) => {
                        updateStaff(person.id, "birthday", value);
                        updateStaff(person.id, "showCalendar", false);
                      }}
                    />
                  </div>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Button variant="outline" onClick={addStaff} className="w-full">
        <Plus className="h-4 w-4 ml-2" />
        הוסף איש צוות נוסף
      </Button>

      <div className="bg-brand/10 border border-brand/20 rounded-xl p-3">
        <p className="text-xs text-brand">
          יום ההולדת אינו חובה, אך יעזור לכם לקבל תזכורות למתנות
        </p>
      </div>

      <div className="flex gap-2 pt-4 border-t">
        <Button variant="ghost" onClick={onCancel} className="flex-1" disabled={loading}>
          ביטול
        </Button>
        <Button onClick={handleSave} className="flex-1" disabled={loading}>
          {loading ? (
            "שומר..."
          ) : (
            <>
              <Check className="h-4 w-4 ml-2" />
              אישור ושמירה
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
