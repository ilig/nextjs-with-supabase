"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Upload, FileSpreadsheet, Edit3, ChevronRight, ChevronDown, Lightbulb, Info, ArrowRight, Check } from "lucide-react";
import * as XLSX from "xlsx";
import { ExcelTemplateDownload } from "@/components/excel-template-download";
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

type AddChildrenWizardProps = {
  classId: string;
  onClose: () => void;
  onSuccess: () => void;
};

type WizardStep = "method-selection" | "excel-upload" | "manual-entry";

export function AddChildrenWizard({ classId, onClose, onSuccess }: AddChildrenWizardProps) {
  const router = useRouter();
  const [step, setStep] = useState<WizardStep>("method-selection");
  const [children, setChildren] = useState<Child[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [expandedChildId, setExpandedChildId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const inputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});

  // Excel upload handler
  const processExcelFile = (file: File) => {
    if (!file) return;

    const validTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
    ];
    if (!validTypes.includes(file.type) && !file.name.match(/\.(xlsx|xls)$/)) {
      alert("אנא העלה קובץ Excel תקין (.xlsx או .xls)");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = new Uint8Array(event.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array" });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet) as any[];

        const parsedChildren: Child[] = jsonData.map((row, index) => {
          // Handle birthday - could be Excel date serial number or string
          // Convert to YYYY-MM-DD format for native date input
          let birthday = "";
          const rawBirthday = row["תאריך לידה"] || row["Birthday"] || "";
          if (rawBirthday) {
            if (typeof rawBirthday === "number") {
              // Excel date serial number
              const date = XLSX.SSF.parse_date_code(rawBirthday);
              if (date) {
                birthday = `${date.y}-${String(date.m).padStart(2, '0')}-${String(date.d).padStart(2, '0')}`;
              }
            } else if (typeof rawBirthday === "string") {
              // Try to parse DD/MM/YYYY format and convert to YYYY-MM-DD
              const parts = rawBirthday.split('/');
              if (parts.length === 3) {
                birthday = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
              } else {
                birthday = rawBirthday; // Keep as-is if format unknown
              }
            }
          }

          return {
            id: `child-${index}-${Date.now()}`,
            name: row["שם הילד/ה"] || row["שם הילד"] || row["Child Name"] || "",
            parent1Name: row["שם הורה 1"] || row["Parent 1 Name"] || "",
            parent1Phone: String(row["טלפון הורה 1"] || row["Parent 1 Phone"] || ""),
            parent2Name: row["שם הורה 2"] || row["Parent 2 Name"] || "",
            parent2Phone: String(row["טלפון הורה 2"] || row["Parent 2 Phone"] || ""),
            address: row["כתובת"] || row["Address"] || "",
            birthday,
          };
        });

        setChildren(parsedChildren);
        setStep("manual-entry"); // Move to review/edit step after upload
      } catch (error) {
        console.error("Error parsing Excel:", error);
        alert("שגיאה בקריאת הקובץ. אנא ודא שהפורמט תקין.");
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleExcelUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processExcelFile(file);
    }
  };

  // Drag and drop handlers
  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const file = e.dataTransfer.files?.[0];
    if (file) {
      processExcelFile(file);
    }
  };

  // Manual entry handlers
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
    // Focus the new input after render
    setTimeout(() => {
      inputRefs.current[newChild.id]?.focus();
    }, 0);
  };

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

  // Initialize with 5 empty rows when entering manual mode
  const initializeManualEntry = () => {
    if (children.length === 0) {
      const initialChildren = Array.from({ length: 5 }, (_, i) => ({
        id: `child-${Date.now()}-${i}`,
        name: "",
        parent1Name: "",
        parent1Phone: "",
        parent2Name: "",
        parent2Phone: "",
        address: "",
        birthday: "",
      }));
      setChildren(initialChildren);
    }
  };

  // Handle Enter key to move to next row
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const nextIndex = index + 1;
      if (nextIndex < children.length) {
        inputRefs.current[children[nextIndex].id]?.focus();
      } else {
        // Add a new row if we're at the last one
        addEmptyChild();
      }
    }
  };

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

    // Birthday uses native date input (YYYY-MM-DD format) - no transformation needed

    setChildren(
      children.map((child) =>
        child.id === id ? { ...child, [field]: validatedValue } : child
      )
    );
  };

  const removeChild = (id: string) => {
    setChildren(children.filter((child) => child.id !== id));
  };

  // Save all children (only those with names)
  const handleSave = async () => {
    const childrenToSave = children.filter(c => c.name.trim());

    if (childrenToSave.length === 0) {
      alert("אנא הזן לפחות שם ילד אחד");
      return;
    }

    setIsSaving(true);
    try {
      // Save each child with a name
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
      onClose();
    } catch (error) {
      console.error("Error saving children:", error);
      alert("שגיאה בשמירת הילדים. אנא נסה שוב.");
    } finally {
      setIsSaving(false);
    }
  };

  // Render method selection step
  const renderMethodSelection = () => (
    <div className="space-y-6">
      <h2 className="text-xl md:text-2xl font-bold text-center text-foreground">
        איך תרצו להוסיף את רשימת הילדים?
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Excel Upload Option */}
        <Card
          className="p-6 cursor-pointer hover:border-green-500 dark:hover:border-green-400 hover:bg-green-50 dark:hover:bg-green-950 transition-all border-2 rounded-2xl"
          onClick={() => setStep("excel-upload")}
        >
          <div className="flex flex-col items-center text-center space-y-4">
            <div className="p-4 bg-green-100 dark:bg-green-900 rounded-full">
              <FileSpreadsheet className="h-10 w-10 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-foreground">העלאה מאקסל</h3>
              <p className="text-sm text-muted-foreground mt-1">
                העלה קובץ אקסל עם רשימת הילדים
              </p>
            </div>
            <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg">
              בחר באפשרות זו
            </Button>
          </div>
        </Card>

        {/* Manual Entry Option */}
        <Card
          className="p-6 cursor-pointer hover:border-blue-500 dark:hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950 transition-all border-2 rounded-2xl"
          onClick={() => {
            initializeManualEntry();
            setStep("manual-entry");
          }}
        >
          <div className="flex flex-col items-center text-center space-y-4">
            <div className="p-4 bg-blue-100 dark:bg-blue-900 rounded-full">
              <Edit3 className="h-10 w-10 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-foreground">הזנה ידנית</h3>
              <p className="text-sm text-muted-foreground mt-1">
                הוסף ילדים אחד אחד באופן ידני
              </p>
            </div>
            <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg">
              בחר באפשרות זו
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );

  // Render excel upload step
  const renderExcelUpload = () => (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setStep("method-selection")}
          className="p-1"
        >
          <ChevronRight className="h-5 w-5" />
        </Button>
        <h2 className="text-xl md:text-2xl font-bold text-foreground">
          העלאה מאקסל
        </h2>
      </div>

      <div
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all ${
          isDragging
            ? "border-green-500 bg-green-50 dark:bg-green-950 scale-105"
            : "border-border hover:border-green-500"
        }`}
      >
        <Upload className={`mx-auto h-12 w-12 mb-4 transition-colors ${
          isDragging ? "text-green-500" : "text-muted-foreground"
        }`} />
        <Label
          htmlFor="excel-upload-wizard"
          className="cursor-pointer text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 font-medium block"
        >
          {isDragging ? "שחרר לכאן להעלאה" : "לחץ או גרור קובץ אקסל לכאן"}
        </Label>
        <Input
          id="excel-upload-wizard"
          ref={fileInputRef}
          type="file"
          accept=".xlsx,.xls"
          onChange={handleExcelUpload}
          className="hidden"
        />
        <p className="text-sm text-muted-foreground mt-2">
          הקובץ חייב לכלול: שם ילד, שם הורה 1, טלפון הורה 1
        </p>
        <div className="mt-4">
          <ExcelTemplateDownload />
        </div>
      </div>
    </div>
  );

  // Count children with names filled in
  const filledChildrenCount = children.filter(c => c.name.trim()).length;

  // Render manual entry step
  const renderManualEntry = () => (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl md:text-2xl font-bold text-foreground">
          הזנת שמות ילדים
        </h2>
        <span className="text-sm text-muted-foreground">{filledChildrenCount} מתוך {children.length} שורות</span>
      </div>

      {/* Instructions */}
      <div className="bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-lg p-3 flex items-start gap-2">
        <Lightbulb className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
        <p className="text-sm text-amber-800 dark:text-amber-200">
          הקלידו שמות ולחצו Enter למעבר לשורה הבאה. לחצו על <ChevronDown className="inline h-4 w-4" /> להוספת פרטים נוספים (הורים, יום הולדת).
        </p>
      </div>

      {/* Children list */}
      <div className="space-y-2 max-h-[350px] overflow-y-auto border border-border rounded-lg">
        {children.map((child, index) => {
          const isExpanded = expandedChildId === child.id;

          return (
            <div key={child.id} className="border-b border-border last:border-b-0">
              {/* Main row - name input */}
              <div className="flex items-center gap-2 p-2 hover:bg-accent">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setExpandedChildId(isExpanded ? null : child.id)}
                  className="p-1 h-8 w-8"
                >
                  <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                </Button>

                <Input
                  ref={(el) => { inputRefs.current[child.id] = el; }}
                  value={child.name}
                  onChange={(e) => updateChild(child.id, "name", e.target.value)}
                  onKeyDown={(e) => handleKeyDown(e, index)}
                  placeholder="שם הילד/ה"
                  className="flex-1 border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 text-right"
                />

                <span className="text-sm text-muted-foreground w-6">{index + 1}</span>
              </div>

              {/* Expanded details */}
              {isExpanded && (
                <div className="px-4 pb-4 pt-2 bg-muted/50 space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs text-muted-foreground">שם הורה 1</Label>
                      <Input
                        value={child.parent1Name}
                        onChange={(e) => updateChild(child.id, "parent1Name", e.target.value)}
                        placeholder="שם ההורה"
                        className="text-right"
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">טלפון הורה 1</Label>
                      <Input
                        type="tel"
                        inputMode="numeric"
                        value={child.parent1Phone}
                        onChange={(e) => updateChild(child.id, "parent1Phone", e.target.value)}
                        placeholder="05XXXXXXXX"
                        dir="ltr"
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">שם הורה 2 (אופציונלי)</Label>
                      <Input
                        value={child.parent2Name || ""}
                        onChange={(e) => updateChild(child.id, "parent2Name", e.target.value)}
                        placeholder="שם ההורה"
                        className="text-right"
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">טלפון הורה 2 (אופציונלי)</Label>
                      <Input
                        type="tel"
                        inputMode="numeric"
                        value={child.parent2Phone || ""}
                        onChange={(e) => updateChild(child.id, "parent2Phone", e.target.value)}
                        placeholder="05XXXXXXXX"
                        dir="ltr"
                      />
                    </div>
                    <div className="col-span-2">
                      <Label className="text-xs text-muted-foreground">כתובת (אופציונלי)</Label>
                      <Input
                        value={child.address || ""}
                        onChange={(e) => updateChild(child.id, "address", e.target.value)}
                        placeholder="כתובת מגורים"
                        className="text-right"
                      />
                    </div>
                    <div className="col-span-2">
                      <Label className="text-xs text-muted-foreground">תאריך לידה</Label>
                      <Input
                        type="date"
                        value={child.birthday || ""}
                        onChange={(e) => updateChild(child.id, "birthday", e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Add more rows button */}
      <Button
        onClick={() => addMultipleChildren(5)}
        variant="outline"
        className="w-full border-dashed border-2 hover:border-solid"
      >
        + הוסף עוד 5 שורות
      </Button>

      {/* Info note */}
      <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-3 flex items-start gap-2">
        <Info className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
        <p className="text-sm text-blue-800 dark:text-blue-200">
          אפשר להשלים פרטי הורים, כתובת וימי הולדת גם אחר כך דרך ניהול הכיתה
        </p>
      </div>

      {/* Footer buttons */}
      <div className="flex gap-3 pt-4 border-t border-border">
        <Button
          variant="outline"
          onClick={() => setStep("method-selection")}
          className="flex-1"
        >
          <ArrowRight className="h-4 w-4 ml-2" />
          חזרה
        </Button>
        <Button
          onClick={handleSave}
          disabled={isSaving || filledChildrenCount === 0}
          className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground"
        >
          <Check className="h-4 w-4 ml-2" />
          {isSaving ? "שומר..." : `שמור ${filledChildrenCount} ילדים`}
        </Button>
      </div>
    </div>
  );

  return (
    <div className="p-6" dir="rtl">
      {step === "method-selection" && renderMethodSelection()}
      {step === "excel-upload" && renderExcelUpload()}
      {step === "manual-entry" && renderManualEntry()}
    </div>
  );
}
