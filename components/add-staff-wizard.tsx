"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Trash2, Lightbulb, Check } from "lucide-react";
import { addStaff } from "@/app/actions/manage-directory";

type StaffMember = {
  id: string;
  name: string;
  role: "teacher" | "assistant";
  birthday: string;
};

type AddStaffWizardProps = {
  classId: string;
  onClose: () => void;
  onSuccess: () => void;
};

export function AddStaffWizard({ classId, onClose, onSuccess }: AddStaffWizardProps) {
  const router = useRouter();
  const [staffMembers, setStaffMembers] = useState<StaffMember[]>([
    { id: `staff-${Date.now()}`, name: "", role: "teacher", birthday: "" },
  ]);
  const [isSaving, setIsSaving] = useState(false);

  // Add new staff member
  const addStaffMember = () => {
    setStaffMembers([
      ...staffMembers,
      { id: `staff-${Date.now()}`, name: "", role: "assistant", birthday: "" },
    ]);
  };

  // Update staff member
  const updateStaffMember = (id: string, field: keyof StaffMember, value: string) => {
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
    // Filter out empty entries
    const validStaff = staffMembers.filter(s => s.name.trim());

    if (validStaff.length === 0) {
      alert("אנא הזן לפחות איש צוות אחד");
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
      onClose();
    } catch (error) {
      console.error("Error saving staff:", error);
      alert("שגיאה בשמירת אנשי הצוות. אנא נסה שוב.");
    } finally {
      setIsSaving(false);
    }
  };

  // Count valid staff members
  const validStaffCount = staffMembers.filter(s => s.name.trim()).length;

  return (
    <div className="p-6" dir="rtl">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl md:text-2xl font-bold text-[#222222]">
            הוסיפו את אנשי הצוות
          </h2>
          <span className="text-sm text-gray-500">{validStaffCount} אנשי צוות</span>
        </div>

        <div className="space-y-4 max-h-[400px] overflow-y-auto">
          {staffMembers.map((member, index) => (
            <Card key={member.id} className="p-4 border rounded-xl relative">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => removeStaffMember(member.id)}
                className="absolute top-2 left-2 h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
              >
                <Trash2 className="h-4 w-4" />
              </Button>

              <h3 className="font-semibold text-gray-700 mb-3">איש צוות #{index + 1}</h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <Label className="text-xs">שם מלא *</Label>
                  <Input
                    value={member.name}
                    onChange={(e) => updateStaffMember(member.id, "name", e.target.value)}
                    placeholder="לדוגמה: רחל כהן"
                    className="text-right"
                  />
                </div>

                <div>
                  <Label className="text-xs">תפקיד *</Label>
                  <select
                    value={member.role}
                    onChange={(e) => updateStaffMember(member.id, "role", e.target.value as "teacher" | "assistant")}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-right ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  >
                    <option value="teacher">מורה</option>
                    <option value="assistant">סייע/ת</option>
                  </select>
                </div>

                <div>
                  <Label className="text-xs">יום הולדת (DD/MM)</Label>
                  <Input
                    value={member.birthday}
                    onChange={(e) => updateStaffMember(member.id, "birthday", e.target.value)}
                    placeholder="15/03"
                    maxLength={5}
                    className="text-right"
                  />
                </div>
              </div>
            </Card>
          ))}
        </div>

        <Button
          onClick={addStaffMember}
          variant="outline"
          className="w-full border-dashed border-2 hover:border-solid"
        >
          + הוסף איש צוות נוסף
        </Button>

        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-start gap-2">
          <Lightbulb className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-amber-800">
            יום ההולדת אינו חובה, אך יעזור לכם לקבל תזכורות למתנות
          </p>
        </div>

        <div className="flex gap-3 pt-4 border-t">
          <Button
            variant="outline"
            onClick={onClose}
            className="flex-1"
          >
            ביטול
          </Button>
          <Button
            onClick={handleSave}
            disabled={isSaving || validStaffCount === 0}
            className="flex-1 bg-black hover:bg-gray-800 text-white"
          >
            {isSaving ? "שומר..." : (
              <>
                <Check className="h-4 w-4 ml-2" />
                אישור ושמירה
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
