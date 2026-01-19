"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Upload, FileSpreadsheet, Plus, Trash2, Check, ChevronDown, ChevronUp } from "lucide-react";
import * as XLSX from "xlsx";
import { createClient } from "@/lib/supabase/client";

type Child = {
  id: string;
  name: string;
  birthday?: string;
  parent1Name: string;
  parent1Phone: string;
  parent2Name?: string;
  parent2Phone?: string;
  address?: string;
};

interface ChildrenUploadTaskProps {
  classId: string;
  estimatedChildren: number;
  onComplete: () => void;
  onCancel: () => void;
  initialMethod?: "excel" | "manual";
}

export function ChildrenUploadTask({
  classId,
  estimatedChildren,
  onComplete,
  onCancel,
  initialMethod,
}: ChildrenUploadTaskProps) {
  const [uploadMethod, setUploadMethod] = useState<"excel" | "manual" | null>(initialMethod || null);
  const [children, setChildren] = useState<Child[]>([]);
  const [expandedChildId, setExpandedChildId] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const inputRefs = useRef<Map<string, HTMLInputElement>>(new Map());

  // Initialize with pre-populated rows for manual mode
  useEffect(() => {
    if (uploadMethod === "manual" && children.length === 0) {
      const initialChildren: Child[] = Array.from({ length: estimatedChildren }, (_, index) => ({
        id: `child-${Date.now()}-${index}`,
        name: "",
        parent1Name: "",
        parent1Phone: "",
        parent2Name: "",
        parent2Phone: "",
        address: "",
      }));
      setChildren(initialChildren);
    }
  }, [uploadMethod, estimatedChildren, children.length]);

  // Focus first input when entering manual mode
  useEffect(() => {
    if (uploadMethod === "manual" && children.length > 0) {
      const firstInput = inputRefs.current.get(children[0].id);
      if (firstInput) {
        setTimeout(() => firstInput.focus(), 100);
      }
    }
  }, [uploadMethod, children.length]);

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processExcelFile(file);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processExcelFile(file);
  };

  const processExcelFile = (file: File) => {
    const reader = new FileReader();

    reader.onload = (event) => {
      try {
        const data = new Uint8Array(event.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array" });
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(worksheet) as any[];

        const parsedChildren: Child[] = jsonData.map((row, index) => {
          // Parse birthday - handle various formats
          let birthday = "";
          const rawBirthday = row["תאריך לידה"] || row["Birthday"] || row["Date of Birth"] || "";
          if (rawBirthday) {
            // If it's an Excel serial number (number), convert it
            if (typeof rawBirthday === "number") {
              const date = XLSX.SSF.parse_date_code(rawBirthday);
              birthday = `${date.y}-${String(date.m).padStart(2, "0")}-${String(date.d).padStart(2, "0")}`;
            } else {
              // Try to parse string date (DD/MM/YYYY or similar)
              const dateStr = rawBirthday.toString();
              const ddmmyyyy = dateStr.match(/^(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{4})$/);
              if (ddmmyyyy) {
                birthday = `${ddmmyyyy[3]}-${ddmmyyyy[2].padStart(2, "0")}-${ddmmyyyy[1].padStart(2, "0")}`;
              } else {
                // Try YYYY-MM-DD format
                const yyyymmdd = dateStr.match(/^(\d{4})[\/\-\.](\d{1,2})[\/\-\.](\d{1,2})$/);
                if (yyyymmdd) {
                  birthday = `${yyyymmdd[1]}-${yyyymmdd[2].padStart(2, "0")}-${yyyymmdd[3].padStart(2, "0")}`;
                }
              }
            }
          }

          return {
            id: `child-${Date.now()}-${index}`,
            name: row["שם הילד/ה"] || row["שם הילד"] || row["Child Name"] || "",
            birthday,
            parent1Name: row["שם הורה 1"] || row["Parent 1 Name"] || "",
            parent1Phone: (row["טלפון הורה 1"] || row["Parent 1 Phone"] || "").toString(),
            parent2Name: row["שם הורה 2"] || row["Parent 2 Name"] || "",
            parent2Phone: (row["טלפון הורה 2"] || row["Parent 2 Phone"] || "").toString(),
            address: row["כתובת"] || row["Address"] || "",
          };
        });

        setChildren(parsedChildren);
        setShowPreview(true);
      } catch (error) {
        console.error("Error parsing Excel file:", error);
        alert("שגיאה בקריאת הקובץ. אנא בדקו שהפורמט תקין.");
      }
    };

    reader.readAsArrayBuffer(file);
  };

  const downloadTemplate = () => {
    const template = [
      {
        "שם הילד/ה": "דוגמה - ישראל ישראלי",
        "תאריך לידה": "15/03/2018",
        "שם הורה 1": "דוד ישראלי",
        "טלפון הורה 1": "0501234567",
        "שם הורה 2": "רחל ישראלי",
        "טלפון הורה 2": "0507654321",
        "כתובת": "רחוב הרצל 1, תל אביב",
      },
    ];

    const worksheet = XLSX.utils.json_to_sheet(template);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "רשימת ילדים");
    XLSX.writeFile(workbook, "template_children.xlsx");
  };

  const addMoreRows = (count: number = 5) => {
    const newChildren: Child[] = Array.from({ length: count }, (_, index) => ({
      id: `child-${Date.now()}-${children.length + index}`,
      name: "",
      parent1Name: "",
      parent1Phone: "",
      parent2Name: "",
      parent2Phone: "",
      address: "",
    }));
    setChildren([...children, ...newChildren]);
  };

  const updateChild = (id: string, field: keyof Child, value: string) => {
    setChildren(
      children.map((child) =>
        child.id === id ? { ...child, [field]: value } : child
      )
    );
  };

  const removeChild = (id: string) => {
    setChildren(children.filter((child) => child.id !== id));
    if (expandedChildId === id) {
      setExpandedChildId(null);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, childId: string, index: number) => {
    if (e.key === "Enter") {
      e.preventDefault();
      // Find next child's input and focus it
      const nextChild = children[index + 1];
      if (nextChild) {
        const nextInput = inputRefs.current.get(nextChild.id);
        if (nextInput) {
          nextInput.focus();
        }
      }
    }
  };

  const toggleExpand = (childId: string) => {
    setExpandedChildId(expandedChildId === childId ? null : childId);
  };

  const handleSave = async () => {
    // Filter only children with names (ignore empty rows)
    const childrenWithNames = children.filter((c) => c.name.trim() !== "");

    if (childrenWithNames.length === 0) {
      alert("אנא הזינו לפחות שם אחד");
      return;
    }

    setLoading(true);

    try {
      const supabase = createClient();

      // Check for existing children to prevent duplicates
      const { data: existingChildren } = await supabase
        .from("children")
        .select("id, name")
        .eq("class_id", classId);

      // Filter out duplicates by name (case-insensitive)
      const existingNames = new Set(
        existingChildren?.map((c) => c.name.trim().toLowerCase()) || []
      );

      const seenInBatch = new Set<string>();
      const childrenToInsert = childrenWithNames.filter((child) => {
        const normalizedName = child.name.trim().toLowerCase();

        // Check against existing in DB
        if (existingNames.has(normalizedName)) {
          return false;
        }

        // Check for duplicates within batch
        if (seenInBatch.has(normalizedName)) {
          return false;
        }

        seenInBatch.add(normalizedName);
        return true;
      });

      if (childrenToInsert.length === 0) {
        alert("כל הילדים שניסיתם להוסיף כבר קיימים במערכת");
        setLoading(false);
        return;
      }

      if (childrenToInsert.length < childrenWithNames.length) {
        const skippedCount = childrenWithNames.length - childrenToInsert.length;
        alert(`שימו לב: ${skippedCount} ילדים דומים כבר קיימים ולא יתווספו`);
      }

      // Prepare children data for insertion
      const childrenData = childrenToInsert.map((child) => ({
        class_id: classId,
        name: child.name.trim(),
        birthday: child.birthday || null,
        address: child.address || null,
      }));

      const { data: insertedChildren, error: childrenError } = await supabase
        .from("children")
        .insert(childrenData)
        .select();

      if (childrenError) {
        console.error("Error inserting children:", childrenError);
        throw childrenError;
      }

      // Create parents and link them (only for children with parent info)
      const childParentLinks: any[] = [];

      for (let i = 0; i < childrenToInsert.length; i++) {
        const child = childrenToInsert[i];
        const insertedChild = insertedChildren[i];

        // Parent 1 (only if provided)
        if (child.parent1Name && child.parent1Phone) {
          const parent1Data = {
            name: child.parent1Name,
            phone: child.parent1Phone,
            class_id: classId,
            user_id: null,
          };

          const { data: parent1, error: parent1Error } = await supabase
            .from("parents")
            .insert(parent1Data)
            .select()
            .single();

          if (parent1Error) {
            console.error("Error inserting parent 1:", parent1Error);
            // Continue without throwing - child is saved, parent failed
          } else {
            childParentLinks.push({
              child_id: insertedChild.id,
              parent_id: parent1.id,
              relationship: "parent1",
            });
          }
        }

        // Parent 2 (only if provided)
        if (child.parent2Name && child.parent2Phone) {
          const parent2Data = {
            name: child.parent2Name,
            phone: child.parent2Phone,
            class_id: classId,
            user_id: null,
          };

          const { data: parent2, error: parent2Error } = await supabase
            .from("parents")
            .insert(parent2Data)
            .select()
            .single();

          if (parent2Error) {
            console.error("Error inserting parent 2:", parent2Error);
          } else {
            childParentLinks.push({
              child_id: insertedChild.id,
              parent_id: parent2.id,
              relationship: "parent2",
            });
          }
        }
      }

      // Insert child-parent links
      if (childParentLinks.length > 0) {
        const { error: linksError } = await supabase
          .from("child_parents")
          .insert(childParentLinks);

        if (linksError) {
          console.error("Error inserting child-parent links:", linksError);
        }
      }

      // Update setup progress
      const storedProgress = localStorage.getItem(`setup_progress_${classId}`);
      const progress = storedProgress ? JSON.parse(storedProgress) : {};
      progress.completedTasks = progress.completedTasks || [];

      // Get total children count from database
      const { count: totalChildren } = await supabase
        .from("children")
        .select("*", { count: "exact", head: true })
        .eq("class_id", classId);

      progress.childrenCount = totalChildren || 0;

      if (!progress.completedTasks.includes("upload_children")) {
        progress.completedTasks.push("upload_children");
      }

      localStorage.setItem(`setup_progress_${classId}`, JSON.stringify(progress));

      onComplete();
    } catch (error) {
      console.error("Error saving children:", error);
      alert("שגיאה בשמירת הנתונים. אנא נסו שוב.");
    } finally {
      setLoading(false);
    }
  };

  // Count filled names
  const filledCount = children.filter((c) => c.name.trim() !== "").length;

  // Method selection screen
  if (!uploadMethod) {
    return (
      <div className="space-y-4 p-4" dir="rtl">
        <h3 className="text-lg font-semibold text-center mb-4">
          איך תרצו להוסיף את רשימת הילדים?
        </h3>

        <div className="grid md:grid-cols-2 gap-4">
          <Card
            className="p-6 cursor-pointer hover:border-blue-500 hover:shadow-lg transition-all"
            onClick={() => setUploadMethod("excel")}
          >
            <div className="text-center space-y-3">
              <FileSpreadsheet className="h-12 w-12 mx-auto text-green-600" />
              <h4 className="font-semibold text-lg">העלאה מאקסל</h4>
              <p className="text-sm text-muted-foreground">
                אם יש לכם קובץ עם כל הפרטים
              </p>
              <Button className="w-full">בחר באפשרות זו</Button>
            </div>
          </Card>

          <Card
            className="p-6 cursor-pointer hover:border-blue-500 hover:shadow-lg transition-all"
            onClick={() => setUploadMethod("manual")}
          >
            <div className="text-center space-y-3">
              <Plus className="h-12 w-12 mx-auto text-blue-600" />
              <h4 className="font-semibold text-lg">הזנה מהירה</h4>
              <p className="text-sm text-muted-foreground">
                הקלידו שמות במהירות, השלימו פרטים אחר כך
              </p>
              <Button className="w-full">בחר באפשרות זו</Button>
            </div>
          </Card>
        </div>

        <Button variant="ghost" onClick={onCancel} className="w-full">
          ביטול
        </Button>
      </div>
    );
  }

  // Excel upload screen
  if (uploadMethod === "excel" && !showPreview) {
    return (
      <div className="space-y-4 p-4" dir="rtl">
        <div className="text-center space-y-2">
          <h3 className="text-lg font-semibold">העלאת קובץ אקסל</h3>
          <p className="text-sm text-muted-foreground">
            גררו קובץ אקסל או לחצו להעלאה
          </p>
        </div>

        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-all ${
            isDragging
              ? "border-blue-500 bg-blue-500/10"
              : "border-border hover:border-muted-foreground"
          }`}
        >
          <Upload className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-sm text-muted-foreground mb-4">
            גררו קובץ לכאן או לחצו לבחירה
          </p>
          <input
            type="file"
            accept=".xlsx,.xls"
            onChange={handleFileSelect}
            className="hidden"
            id="file-upload"
          />
          <label htmlFor="file-upload">
            <Button type="button" asChild>
              <span>בחר קובץ</span>
            </Button>
          </label>
        </div>

        <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
          <p className="text-sm font-semibold mb-2">💡 אין לכם קובץ מוכן?</p>
          <p className="text-sm text-foreground mb-3">
            הורידו את התבנית שלנו, מלאו אותה, והעלו בחזרה
          </p>
          <Button
            variant="outline"
            onClick={downloadTemplate}
            className="w-full"
            size="sm"
          >
            <FileSpreadsheet className="h-4 w-4 ml-2" />
            הורד תבנית אקסל
          </Button>
        </div>

        <div className="flex gap-2">
          <Button variant="ghost" onClick={() => setUploadMethod(null)} className="flex-1">
            ← חזרה
          </Button>
          <Button variant="outline" onClick={() => setUploadMethod("manual")} className="flex-1">
            עבור להזנה מהירה
          </Button>
        </div>
      </div>
    );
  }

  // Excel preview screen (with full editing)
  if (uploadMethod === "excel" && showPreview) {
    return (
      <div className="space-y-4 p-4" dir="rtl">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">בדקו את הרשימה</h3>
          <span className="text-sm text-muted-foreground">
            {children.length} ילדים
          </span>
        </div>

        <div className="max-h-96 overflow-y-auto space-y-3">
          {children.map((child, index) => (
            <Card key={child.id} className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-foreground">ילד #{index + 1}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeChild(child.id)}
                >
                  <Trash2 className="h-4 w-4 text-red-500" />
                </Button>
              </div>

              <div className="grid md:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">שם הילד/ה *</Label>
                  <Input
                    value={child.name}
                    onChange={(e) => updateChild(child.id, "name", e.target.value)}
                    placeholder="שם מלא"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs">תאריך לידה</Label>
                  <Input
                    type="date"
                    value={child.birthday || ""}
                    onChange={(e) => updateChild(child.id, "birthday", e.target.value)}
                    onFocus={(e) => e.target.showPicker?.()}
                    className="cursor-pointer"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs">כתובת</Label>
                  <Input
                    value={child.address || ""}
                    onChange={(e) => updateChild(child.id, "address", e.target.value)}
                    placeholder="אופציונלי"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs">שם הורה 1</Label>
                  <Input
                    value={child.parent1Name}
                    onChange={(e) => updateChild(child.id, "parent1Name", e.target.value)}
                    placeholder="שם מלא"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs">טלפון הורה 1</Label>
                  <Input
                    value={child.parent1Phone}
                    onChange={(e) => updateChild(child.id, "parent1Phone", e.target.value)}
                    placeholder="05XXXXXXXX"
                    type="tel"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs">שם הורה 2</Label>
                  <Input
                    value={child.parent2Name || ""}
                    onChange={(e) => updateChild(child.id, "parent2Name", e.target.value)}
                    placeholder="אופציונלי"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs">טלפון הורה 2</Label>
                  <Input
                    value={child.parent2Phone || ""}
                    onChange={(e) => updateChild(child.id, "parent2Phone", e.target.value)}
                    placeholder="אופציונלי"
                    type="tel"
                  />
                </div>
              </div>
            </Card>
          ))}
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

  // Quick entry manual mode
  return (
    <div className="space-y-4 p-4" dir="rtl">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">הזנת שמות ילדים</h3>
        <span className="text-sm text-muted-foreground">
          {filledCount} מתוך {children.length} שורות
        </span>
      </div>

      <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3 text-sm">
        <p className="text-blue-700 dark:text-blue-300">
          💡 הקלידו שמות ולחצו Enter למעבר לשורה הבאה.
          לחצו על ▼ להוספת פרטים נוספים (הורים, יום הולדת).
        </p>
      </div>

      <div className="max-h-80 overflow-y-auto space-y-2">
        {children.map((child, index) => {
          const isExpanded = expandedChildId === child.id;
          const hasName = child.name.trim() !== "";

          return (
            <div
              key={child.id}
              className={`border rounded-lg transition-all ${
                hasName ? "border-green-500/30 bg-green-500/10" : "border-border"
              }`}
            >
              {/* Compact row */}
              <div className="flex items-center gap-2 p-2">
                <span className="text-xs text-muted-foreground w-6 text-center">{index + 1}</span>
                <Input
                  ref={(el) => {
                    if (el) inputRefs.current.set(child.id, el);
                  }}
                  value={child.name}
                  onChange={(e) => updateChild(child.id, "name", e.target.value)}
                  onKeyDown={(e) => handleKeyDown(e, child.id, index)}
                  placeholder="שם הילד/ה"
                  className="flex-1 h-9"
                />
                <button
                  onClick={() => toggleExpand(child.id)}
                  className="p-1 hover:bg-muted rounded transition-colors"
                  title="הוסף פרטים נוספים"
                >
                  {isExpanded ? (
                    <ChevronUp className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  )}
                </button>
                {hasName && (
                  <button
                    onClick={() => removeChild(child.id)}
                    className="p-1 hover:bg-red-500/20 rounded transition-colors"
                    title="מחק"
                  >
                    <Trash2 className="h-4 w-4 text-red-400" />
                  </button>
                )}
              </div>

              {/* Expanded details */}
              {isExpanded && (
                <div className="px-4 pb-4 pt-2 border-t space-y-3 bg-muted/50">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs">תאריך לידה</Label>
                      <Input
                        type="date"
                        value={child.birthday || ""}
                        onChange={(e) => updateChild(child.id, "birthday", e.target.value)}
                        onFocus={(e) => e.target.showPicker?.()}
                        className="cursor-pointer h-9"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">כתובת</Label>
                      <Input
                        value={child.address || ""}
                        onChange={(e) => updateChild(child.id, "address", e.target.value)}
                        placeholder="אופציונלי"
                        className="h-9"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs">שם הורה 1</Label>
                      <Input
                        value={child.parent1Name}
                        onChange={(e) => updateChild(child.id, "parent1Name", e.target.value)}
                        placeholder="שם מלא"
                        className="h-9"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">טלפון הורה 1</Label>
                      <Input
                        value={child.parent1Phone}
                        onChange={(e) => updateChild(child.id, "parent1Phone", e.target.value)}
                        placeholder="05XXXXXXXX"
                        type="tel"
                        className="h-9"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs">שם הורה 2</Label>
                      <Input
                        value={child.parent2Name || ""}
                        onChange={(e) => updateChild(child.id, "parent2Name", e.target.value)}
                        placeholder="אופציונלי"
                        className="h-9"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">טלפון הורה 2</Label>
                      <Input
                        value={child.parent2Phone || ""}
                        onChange={(e) => updateChild(child.id, "parent2Phone", e.target.value)}
                        placeholder="אופציונלי"
                        type="tel"
                        className="h-9"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <Button
        variant="outline"
        onClick={() => addMoreRows(5)}
        className="w-full"
        size="sm"
      >
        <Plus className="h-4 w-4 ml-2" />
        הוסף עוד 5 שורות
      </Button>

      <div className="bg-muted/50 border rounded-lg p-3 text-sm text-muted-foreground">
        <p>
          ℹ️ אפשר להשלים פרטי הורים, כתובת וימי הולדת גם אחר כך דרך ניהול הכיתה
        </p>
      </div>

      <div className="flex gap-2 pt-4 border-t">
        <Button variant="ghost" onClick={() => setUploadMethod(null)} className="flex-1" disabled={loading}>
          ← חזרה
        </Button>
        <Button
          onClick={handleSave}
          className="flex-1"
          disabled={loading || filledCount === 0}
        >
          {loading ? (
            "שומר..."
          ) : (
            <>
              <Check className="h-4 w-4 ml-2" />
              שמור {filledCount} ילדים
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
