"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Upload, FileSpreadsheet, Plus, Trash2, Check } from "lucide-react";
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
  const [children, setChildren] = useState<Child[]>(() => {
    // If starting with manual mode, add first child template
    if (initialMethod === "manual") {
      return [{
        id: `child-${Date.now()}`,
        name: "",
        parent1Name: "",
        parent1Phone: "",
        parent2Name: "",
        parent2Phone: "",
        address: "",
      }];
    }
    return [];
  });
  const [isDragging, setIsDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

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
            name: row["שם הילד"] || row["Child Name"] || "",
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
        "שם הילד": "דוגמה - ישראל ישראלי",
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

  const addManualChild = () => {
    const newChild: Child = {
      id: `child-${Date.now()}`,
      name: "",
      parent1Name: "",
      parent1Phone: "",
      parent2Name: "",
      parent2Phone: "",
      address: "",
    };
    setChildren([...children, newChild]);
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
  };

  const handleSave = async () => {
    // Validate
    if (children.length === 0) {
      alert("אנא הוסיפו לפחות ילד אחד");
      return;
    }

    const invalidChildren = children.filter(
      (c) => !c.name || !c.birthday || !c.parent1Name || !c.parent1Phone
    );

    if (invalidChildren.length > 0) {
      alert("אנא מלאו את כל השדות החובה (שם ילד, תאריך לידה, שם הורה 1, טלפון הורה 1)");
      return;
    }

    setLoading(true);

    try {
      const supabase = createClient();

      // Check for existing children to prevent duplicates
      // First get all children in the class
      const { data: existingChildren } = await supabase
        .from("children")
        .select("id, name, address")
        .eq("class_id", classId);

      // Then get parent phone numbers for all these children
      const { data: childParentData } = await supabase
        .from("child_parents")
        .select(`
          child_id,
          parents!inner(phone)
        `)
        .in("child_id", existingChildren?.map(c => c.id) || []);

      // Build a map of child_id to parent phones
      const childPhoneMap = new Map<string, string[]>();
      childParentData?.forEach((cp: any) => {
        const phones = childPhoneMap.get(cp.child_id) || [];
        phones.push(cp.parents.phone);
        childPhoneMap.set(cp.child_id, phones);
      });

      // Filter out duplicates: both against DB and within the current batch
      const seenInBatch = new Set<string>();
      const childrenToInsert = children.filter((child) => {
        // Check for duplicates in the database
        const isDuplicateInDB = existingChildren?.some((existing) => {
          // Same name check
          if (existing.name.trim().toLowerCase() !== child.name.trim().toLowerCase()) {
            return false;
          }

          // Check if any parent phone matches
          const existingPhones = childPhoneMap.get(existing.id) || [];
          const newPhones = [child.parent1Phone, child.parent2Phone].filter(Boolean);

          // If name is same AND any phone number matches, it's a duplicate
          return existingPhones.some((existingPhone: string) =>
            newPhones.some((newPhone) =>
              existingPhone.replace(/\s/g, '') === newPhone?.replace(/\s/g, '')
            )
          );
        });

        if (isDuplicateInDB) {
          return false;
        }

        // Check for duplicates within the current batch
        const batchKey = `${child.name.trim().toLowerCase()}_${child.parent1Phone.replace(/\s/g, '')}`;
        if (seenInBatch.has(batchKey)) {
          return false; // Duplicate within batch
        }

        seenInBatch.add(batchKey);
        return true;
      });

      if (childrenToInsert.length === 0) {
        alert("כל הילדים שניסיתם להוסיף כבר קיימים במערכת");
        setLoading(false);
        return;
      }

      if (childrenToInsert.length < children.length) {
        const skippedCount = children.length - childrenToInsert.length;
        alert(`שימו לב: ${skippedCount} ילדים דומים כבר קיימים ולא יתווספו`);
      }

      // Prepare children data for insertion
      const childrenData = childrenToInsert.map((child) => ({
        class_id: classId,
        name: child.name,
        birthday: child.birthday || null,
        address: child.address || null,
      }));

      const { data: insertedChildren, error: childrenError } = await supabase
        .from("children")
        .insert(childrenData)
        .select();

      if (childrenError) {
        console.error("Error inserting children:", {
          message: childrenError.message,
          details: childrenError.details,
          hint: childrenError.hint,
          code: childrenError.code,
        });
        throw childrenError;
      }

      // Create parents and link them
      const parentsData: any[] = [];
      const childParentLinks: any[] = [];

      for (let i = 0; i < childrenToInsert.length; i++) {
        const child = childrenToInsert[i];
        const insertedChild = insertedChildren[i];

        // Parent 1
        const parent1Data = {
          name: child.parent1Name,
          phone: child.parent1Phone,
          class_id: classId,
          user_id: null, // Will be set when parent creates an account
        };

        console.log("Inserting parent 1:", parent1Data);

        const { data: parent1, error: parent1Error } = await supabase
          .from("parents")
          .insert(parent1Data)
          .select()
          .single();

        if (parent1Error) {
          console.error("Error inserting parent 1:", parent1Error);
          console.error("Parent 1 Error Details:", JSON.stringify(parent1Error, null, 2));
          throw new Error(`Failed to insert parent 1: ${parent1Error.message || JSON.stringify(parent1Error)}`);
        }

        childParentLinks.push({
          child_id: insertedChild.id,
          parent_id: parent1.id,
          relationship: "parent1",
        });

        // Parent 2 (if exists)
        if (child.parent2Name && child.parent2Phone) {
          const parent2Data = {
            name: child.parent2Name,
            phone: child.parent2Phone,
            class_id: classId,
            user_id: null, // Will be set when parent creates an account
          };

          const { data: parent2, error: parent2Error } = await supabase
            .from("parents")
            .insert(parent2Data)
            .select()
            .single();

          if (parent2Error) {
            console.error("Error inserting parent 2:", {
              message: parent2Error.message,
              details: parent2Error.details,
              hint: parent2Error.hint,
              code: parent2Error.code,
            });
            throw parent2Error;
          }

          childParentLinks.push({
            child_id: insertedChild.id,
            parent_id: parent2.id,
            relationship: "parent2",
          });
        }
      }

      // Insert child-parent links
      const { error: linksError } = await supabase
        .from("child_parents")
        .insert(childParentLinks);

      if (linksError) {
        console.error("Error inserting child-parent links:", {
          message: linksError.message,
          details: linksError.details,
          hint: linksError.hint,
          code: linksError.code,
        });
        throw linksError;
      }

      // Update setup progress with children count
      const storedProgress = localStorage.getItem(`setup_progress_${classId}`);
      const progress = storedProgress ? JSON.parse(storedProgress) : {};
      progress.completedTasks = progress.completedTasks || [];
      progress.childrenCount = progress.childrenCount || 0;

      // Get total children count from database
      const { count: totalChildren, error: countError } = await supabase
        .from("children")
        .select("*", { count: "exact", head: true })
        .eq("class_id", classId);

      if (countError) {
        console.error("Error counting children:", countError);
      }

      console.log(`Total children in database for class ${classId}:`, totalChildren);
      progress.childrenCount = totalChildren || 0;

      // Mark as completed only if we have all children (or close to it)
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
              <p className="text-sm text-gray-600">
                מהיר וקל - אידיאלי אם יש לכם רשימה קיימת
              </p>
              <Button className="w-full">בחר באפשרות זו</Button>
            </div>
          </Card>

          <Card
            className="p-6 cursor-pointer hover:border-blue-500 hover:shadow-lg transition-all"
            onClick={() => {
              setUploadMethod("manual");
              // Add first child template
              addManualChild();
            }}
          >
            <div className="text-center space-y-3">
              <Plus className="h-12 w-12 mx-auto text-blue-600" />
              <h4 className="font-semibold text-lg">הזנה ידנית</h4>
              <p className="text-sm text-gray-600">
                הזינו ילד אחד בכל פעם - טוב לכיתות קטנות
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
          <p className="text-sm text-gray-600">
            גררו קובץ אקסל או לחצו להעלאה
          </p>
        </div>

        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-all ${
            isDragging
              ? "border-blue-500 bg-blue-50"
              : "border-gray-300 hover:border-gray-400"
          }`}
        >
          <Upload className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <p className="text-sm text-gray-600 mb-4">
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

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm font-semibold mb-2">💡 אין לכם קובץ מוכן?</p>
          <p className="text-sm text-gray-700 mb-3">
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
            → חזרה
          </Button>
          <Button variant="outline" onClick={() => {
            setUploadMethod("manual");
            addManualChild();
          }} className="flex-1">
            עבור להזנה ידנית
          </Button>
        </div>
      </div>
    );
  }

  // Preview/Manual entry screen
  return (
    <div className="space-y-4 p-4" dir="rtl">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">
          {showPreview ? "בדקו את הרשימה" : "הוסיפו ילדים"}
        </h3>
        <span className="text-sm text-gray-600">
          {children.length} ילדים
        </span>
      </div>

      <div className="max-h-96 overflow-y-auto space-y-3">
        {children.map((child, index) => (
          <Card key={child.id} className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-gray-700">ילד #{index + 1}</span>
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
                <Label className="text-xs">שם הילד *</Label>
                <Input
                  value={child.name}
                  onChange={(e) => updateChild(child.id, "name", e.target.value)}
                  placeholder="שם מלא"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs">תאריך לידה *</Label>
                <Input
                  type="date"
                  value={child.birthday || ""}
                  onChange={(e) => updateChild(child.id, "birthday", e.target.value)}
                  required
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
                <Label className="text-xs">שם הורה 1 *</Label>
                <Input
                  value={child.parent1Name}
                  onChange={(e) => updateChild(child.id, "parent1Name", e.target.value)}
                  placeholder="שם מלא"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs">טלפון הורה 1 *</Label>
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

      {uploadMethod === "manual" && (
        <Button
          variant="outline"
          onClick={addManualChild}
          className="w-full"
        >
          <Plus className="h-4 w-4 ml-2" />
          הוסף ילד נוסף
        </Button>
      )}

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
