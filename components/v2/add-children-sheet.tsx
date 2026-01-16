"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ChevronDown, Lightbulb, Info, Check } from "lucide-react";
import { addChild } from "@/app/actions/manage-directory";

type Child = {
  id: string;
  name: string;
  parent1Name: string;
  parent1Phone: string;
  parent2Name?: string;
  parent2Phone?: string;
  address?: string;
  birthday?: string;
};

type AddChildrenSheetProps = {
  classId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
};

export function AddChildrenSheet({
  classId,
  open,
  onOpenChange,
  onSuccess,
}: AddChildrenSheetProps) {
  const router = useRouter();
  const [children, setChildren] = useState<Child[]>(() => createInitialChildren(5));
  const [isSaving, setIsSaving] = useState(false);
  const [expandedChildId, setExpandedChildId] = useState<string | null>(null);
  const inputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});

  // Create initial empty children
  function createInitialChildren(count: number): Child[] {
    return Array.from({ length: count }, (_, i) => ({
      id: `child-${Date.now()}-${i}`,
      name: "",
      parent1Name: "",
      parent1Phone: "",
      parent2Name: "",
      parent2Phone: "",
      address: "",
      birthday: "",
    }));
  }

  // Reset state when dialog opens
  const handleOpenChange = (isOpen: boolean) => {
    if (isOpen) {
      setChildren(createInitialChildren(5));
      setExpandedChildId(null);
    }
    onOpenChange(isOpen);
  };

  // Add multiple empty children rows
  const addMultipleChildren = (count: number) => {
    const newChildren = Array.from({ length: count }, (_, i) => ({
      id: `child-${Date.now()}-${i}`,
      name: "",
      parent1Name: "",
      parent1Phone: "",
      parent2Name: "",
      parent2Phone: "",
      address: "",
      birthday: "",
    }));
    setChildren([...children, ...newChildren]);
  };

  // Add single empty child and focus
  const addEmptyChild = () => {
    const newChild = {
      id: `child-${Date.now()}`,
      name: "",
      parent1Name: "",
      parent1Phone: "",
      parent2Name: "",
      parent2Phone: "",
      address: "",
      birthday: "",
    };
    setChildren([...children, newChild]);
    setTimeout(() => {
      inputRefs.current[newChild.id]?.focus();
    }, 0);
  };

  // Handle Enter key to move to next row
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const nextIndex = index + 1;
      if (nextIndex < children.length) {
        inputRefs.current[children[nextIndex].id]?.focus();
      } else {
        addEmptyChild();
      }
    }
  };

  // Update child field
  const updateChild = (id: string, field: keyof Child, value: string) => {
    let validatedValue = value;

    // Validate phone fields - only numbers, max 10 digits
    if (field === "parent1Phone" || field === "parent2Phone") {
      validatedValue = value.replace(/[^0-9]/g, "").slice(0, 10);
    }

    // Validate name fields - only Hebrew/English letters and spaces
    if (field === "name" || field === "parent1Name" || field === "parent2Name") {
      validatedValue = value.replace(/[^a-zA-Zא-ת\s'-]/g, "");
    }

    setChildren(
      children.map((child) =>
        child.id === id ? { ...child, [field]: validatedValue } : child
      )
    );
  };

  // Save all children with names
  const handleSave = async () => {
    const childrenToSave = children.filter((c) => c.name.trim());

    if (childrenToSave.length === 0) {
      return;
    }

    setIsSaving(true);
    try {
      for (const child of childrenToSave) {
        const result = await addChild({
          classId,
          name: child.name,
          address: child.address,
          birthday: child.birthday,
          parent1_name: child.parent1Name,
          parent1_phone: child.parent1Phone,
          parent2_name: child.parent2Name,
          parent2_phone: child.parent2Phone,
        });

        if (!result.success) {
          throw new Error(result.error || "Failed to add child");
        }
      }

      onSuccess();
      router.refresh();
      handleOpenChange(false);
    } catch (error) {
      console.error("Error saving children:", error);
      alert("שגיאה בשמירת הילדים. אנא נסה שוב.");
    } finally {
      setIsSaving(false);
    }
  };

  // Count filled children
  const filledChildrenCount = children.filter((c) => c.name.trim()).length;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-hidden flex flex-col" dir="rtl">
        <DialogHeader className="text-right pb-2">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-bold">הזנת שמות ילדים</DialogTitle>
            <span className="text-sm text-muted-foreground">
              {filledChildrenCount} מתוך {children.length} שורות
            </span>
          </div>
        </DialogHeader>

        <div className="space-y-3 flex-1 overflow-hidden flex flex-col">
          {/* Instructions */}
          <div className="bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-lg p-2 flex items-center gap-2">
            <Lightbulb className="h-4 w-4 text-amber-500 flex-shrink-0" />
            <p className="text-xs text-amber-800 dark:text-amber-200">
              הקלידו שמות ולחצו Enter למעבר לשורה הבאה. לחצו על{" "}
              <ChevronDown className="inline h-3 w-3" /> להוספת פרטים נוספים
              (הורים, יום הולדת).
            </p>
          </div>

          {/* Children list */}
          <div className="flex-1 overflow-y-auto border border-border rounded-lg min-h-0">
            {children.map((child, index) => {
              const isExpanded = expandedChildId === child.id;

              return (
                <div
                  key={child.id}
                  className="border-b border-border last:border-b-0"
                >
                  {/* Main row - name input */}
                  <div className="flex items-center gap-2 p-3 min-h-[60px] hover:bg-accent">
                    <span className="text-sm text-muted-foreground w-6">
                      {index + 1}
                    </span>

                    <Input
                      ref={(el) => {
                        inputRefs.current[child.id] = el;
                      }}
                      value={child.name}
                      onChange={(e) => updateChild(child.id, "name", e.target.value)}
                      onKeyDown={(e) => handleKeyDown(e, index)}
                      placeholder="שם הילד"
                      className="flex-1 border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 text-right"
                    />

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        setExpandedChildId(isExpanded ? null : child.id)
                      }
                      className="p-1 h-8 w-8"
                    >
                      <ChevronDown
                        className={`h-4 w-4 text-muted-foreground transition-transform ${
                          isExpanded ? "rotate-180" : ""
                        }`}
                      />
                    </Button>
                  </div>

                  {/* Expanded details */}
                  {isExpanded && (
                    <div className="px-3 pb-4 pt-2 bg-muted/50 space-y-3">
                      <div className="grid grid-cols-2 gap-2">
                        {/* Row 1: Birthday (right) | Address (left) */}
                        <div>
                          <Label className="text-xs text-muted-foreground">
                            תאריך לידה
                          </Label>
                          <Input
                            type="date"
                            value={child.birthday || ""}
                            onChange={(e) =>
                              updateChild(child.id, "birthday", e.target.value)
                            }
                            className="px-2"
                          />
                        </div>
                        <div>
                          <Label className="text-xs text-muted-foreground">
                            כתובת
                          </Label>
                          <Input
                            value={child.address || ""}
                            onChange={(e) =>
                              updateChild(child.id, "address", e.target.value)
                            }
                            placeholder="אופציונלי"
                            className="text-right"
                          />
                        </div>
                        {/* Row 2: Name 1 (right) | Phone 1 (left) */}
                        <div>
                          <Label className="text-xs text-muted-foreground">
                            שם הורה 1
                          </Label>
                          <Input
                            value={child.parent1Name}
                            onChange={(e) =>
                              updateChild(child.id, "parent1Name", e.target.value)
                            }
                            placeholder="שם מלא"
                            className="text-right"
                          />
                        </div>
                        <div>
                          <Label className="text-xs text-muted-foreground">
                            טלפון הורה 1
                          </Label>
                          <Input
                            type="tel"
                            inputMode="numeric"
                            value={child.parent1Phone}
                            onChange={(e) =>
                              updateChild(child.id, "parent1Phone", e.target.value)
                            }
                            placeholder="05XXXXXXXX"
                            dir="ltr"
                          />
                        </div>
                        {/* Row 3: Name 2 (right) | Phone 2 (left) */}
                        <div>
                          <Label className="text-xs text-muted-foreground">
                            שם הורה 2
                          </Label>
                          <Input
                            value={child.parent2Name || ""}
                            onChange={(e) =>
                              updateChild(child.id, "parent2Name", e.target.value)
                            }
                            placeholder="אופציונלי"
                            className="text-right"
                          />
                        </div>
                        <div>
                          <Label className="text-xs text-muted-foreground">
                            טלפון הורה 2
                          </Label>
                          <Input
                            type="tel"
                            inputMode="numeric"
                            value={child.parent2Phone || ""}
                            onChange={(e) =>
                              updateChild(child.id, "parent2Phone", e.target.value)
                            }
                            placeholder="אופציונלי"
                            dir="ltr"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Footer section */}
          <div className="space-y-3 pt-3 border-t border-border flex-shrink-0">
            {/* Add more rows button */}
            <Button
              onClick={() => addMultipleChildren(5)}
              variant="outline"
              className="w-full border-dashed border-2 hover:border-solid"
            >
              + הוסף עוד 5 שורות
            </Button>

            {/* Info note */}
            <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-2 flex items-center gap-2">
              <Info className="h-4 w-4 text-blue-500 flex-shrink-0" />
              <p className="text-xs text-blue-800 dark:text-blue-200">
                אפשר להשלים פרטי הורים, כתובת וימי הולדת גם אחר כך דרך עריכת הילד
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
                disabled={isSaving || filledChildrenCount === 0}
                className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                <Check className="h-4 w-4 ml-2" />
                {isSaving ? "שומר..." : `אישור ושמירה`}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
