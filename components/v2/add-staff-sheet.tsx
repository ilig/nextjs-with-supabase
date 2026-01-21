"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Trash2, Lightbulb, Check } from "lucide-react";
import { addStaff } from "@/app/actions/manage-directory";

type StaffMember = {
  id: string;
  name: string;
  role: "teacher" | "assistant";
  birthday: string;
};

type AddStaffSheetProps = {
  classId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  initialCount?: number;
};

// Helper to create initial staff members array
const createInitialStaffMembers = (count: number): StaffMember[] => {
  const members: StaffMember[] = [];
  for (let i = 0; i < count; i++) {
    members.push({
      id: `staff-${Date.now()}-${i}`,
      name: "",
      role: i === 0 ? "teacher" : "assistant",
      birthday: "",
    });
  }
  return members;
};

export function AddStaffSheet({
  classId,
  open,
  onOpenChange,
  onSuccess,
  initialCount = 1,
}: AddStaffSheetProps) {
  const router = useRouter();
  const [staffMembers, setStaffMembers] = useState<StaffMember[]>(() =>
    createInitialStaffMembers(initialCount)
  );
  const [isSaving, setIsSaving] = useState(false);

  // Reset state when dialog opens
  const handleOpenChange = (isOpen: boolean) => {
    if (isOpen) {
      setStaffMembers(createInitialStaffMembers(initialCount));
    }
    onOpenChange(isOpen);
  };

  // Add new staff member
  const addStaffMember = () => {
    setStaffMembers([
      ...staffMembers,
      { id: `staff-${Date.now()}`, name: "", role: "assistant", birthday: "" },
    ]);
  };

  // Update staff member
  const updateStaffMember = (
    id: string,
    field: keyof StaffMember,
    value: string
  ) => {
    let validatedValue = value;

    // Validate name field - only Hebrew/English letters and spaces
    if (field === "name") {
      validatedValue = value.replace(/[^a-zA-Zא-ת\s'-]/g, "");
    }

    // Format birthday as DD/MM
    if (field === "birthday") {
      const cleaned = value.replace(/[^0-9/]/g, "");
      const numeric = cleaned.replace(/\//g, "");
      if (numeric.length <= 2) {
        validatedValue = numeric;
      } else if (numeric.length <= 4) {
        validatedValue = `${numeric.slice(0, 2)}/${numeric.slice(2)}`;
      }
    }

    setStaffMembers(
      staffMembers.map((member) =>
        member.id === id ? { ...member, [field]: validatedValue } : member
      )
    );
  };

  // Remove staff member
  const removeStaffMember = (id: string) => {
    if (staffMembers.length === 1) {
      // Don't remove the last one, just clear it
      setStaffMembers([
        { id: `staff-${Date.now()}`, name: "", role: "teacher", birthday: "" },
      ]);
      return;
    }
    setStaffMembers(staffMembers.filter((member) => member.id !== id));
  };

  // Save all staff members
  const handleSave = async () => {
    const validStaff = staffMembers.filter((s) => s.name.trim());

    if (validStaff.length === 0) {
      return;
    }

    setIsSaving(true);
    try {
      for (const member of validStaff) {
        const result = await addStaff({
          classId,
          name: member.name,
          role: member.role,
          birthday: member.birthday,
        });

        if (!result.success) {
          throw new Error(result.error || "Failed to add staff member");
        }
      }

      onSuccess();
      router.refresh();
      handleOpenChange(false);
    } catch (error) {
      console.error("Error saving staff:", error);
      alert("שגיאה בשמירת אנשי הצוות. אנא נסה שוב.");
    } finally {
      setIsSaving(false);
    }
  };

  // Count valid staff members
  const validStaffCount = staffMembers.filter((s) => s.name.trim()).length;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-hidden flex flex-col" dir="rtl">
        <DialogHeader className="text-right pb-2">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-bold">
              הוסיפו את אנשי הצוות
            </DialogTitle>
            <span className="text-sm text-muted-foreground">
              {validStaffCount} אנשי צוות
            </span>
          </div>
        </DialogHeader>

        <div className="space-y-3 flex-1 overflow-hidden flex flex-col">
          {/* Staff members list - scrolls when content exceeds max height */}
          <div className="flex-1 overflow-y-auto space-y-3 min-h-0">
            {staffMembers.map((member, index) => (
              <Card key={member.id} className="p-3 border rounded-xl relative">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeStaffMember(member.id)}
                  className="absolute top-2 left-2 h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10 dark:hover:bg-destructive/20"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>

                <h3 className="font-semibold text-foreground mb-2 text-sm">
                  איש צוות #{index + 1}
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                  <div>
                    <Label className="text-xs">שם מלא *</Label>
                    <Input
                      value={member.name}
                      onChange={(e) =>
                        updateStaffMember(member.id, "name", e.target.value)
                      }
                      placeholder="לדוגמה: רחל כהן"
                      className="text-right"
                    />
                  </div>

                  <div>
                    <Label className="text-xs">תפקיד *</Label>
                    <select
                      value={member.role}
                      onChange={(e) =>
                        updateStaffMember(
                          member.id,
                          "role",
                          e.target.value as "teacher" | "assistant"
                        )
                      }
                      className="flex h-10 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm text-right ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    >
                      <option value="teacher">מורה</option>
                      <option value="kindergarten_teacher">גננת</option>
                      <option value="assistant">סייע/ת</option>
                    </select>
                  </div>

                  <div>
                    <Label className="text-xs">יום הולדת (DD/MM)</Label>
                    <Input
                      value={member.birthday}
                      onChange={(e) =>
                        updateStaffMember(member.id, "birthday", e.target.value)
                      }
                      placeholder="15/03"
                      maxLength={5}
                      className="text-right"
                    />
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {/* Footer section */}
          <div className="space-y-3 pt-3 border-t border-border flex-shrink-0">
            {/* Add staff button */}
            <Button
              onClick={addStaffMember}
              variant="outline"
              className="w-full border-dashed border-2 hover:border-solid"
            >
              + הוסף איש צוות נוסף
            </Button>

            {/* Info note */}
            <div className="bg-warning/10 dark:bg-warning/20 border border-warning/20 dark:border-warning/30 rounded-xl p-2 flex items-center gap-2">
              <Lightbulb className="h-4 w-4 text-warning flex-shrink-0" />
              <p className="text-xs text-warning-foreground dark:text-warning">
                יום ההולדת אינו חובה, אך יעזור לכם לקבל תזכורות למתנות
              </p>
            </div>

            {/* Footer buttons */}
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => handleOpenChange(false)}
                className="flex-1"
              >
                ביטול
              </Button>
              <Button
                onClick={handleSave}
                disabled={isSaving || validStaffCount === 0}
                className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                {isSaving ? (
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
        </div>
      </DialogContent>
    </Dialog>
  );
}
