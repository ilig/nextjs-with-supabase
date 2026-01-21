"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Trash2, Plus, Download, Upload } from "lucide-react";

interface Parent {
  name: string;
  phone: string;
}

interface Child {
  id: string;
  childName: string;
  parent1: Parent;
  parent2?: Parent;
  address?: string;
}

export default function ClassSetupPage() {
  const [children, setChildren] = useState<Child[]>([]);
  const [currentChild, setCurrentChild] = useState<Child>({
    id: crypto.randomUUID(),
    childName: "",
    parent1: { name: "", phone: "" },
    parent2: { name: "", phone: "" },
    address: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validatePhone = (phone: string): boolean => {
    // Israeli phone validation - should be 10 digits starting with 05
    const cleaned = phone.replace(/[-\s]/g, "");
    return /^05\d{8}$/.test(cleaned);
  };

  const validateChild = (child: Child): Record<string, string> => {
    const newErrors: Record<string, string> = {};

    if (!child.childName.trim()) {
      newErrors.childName = "שם הילד/ה חובה";
    }
    if (!child.parent1.name.trim()) {
      newErrors.parent1Name = "שם הורה 1 חובה";
    }
    if (!child.parent1.phone.trim()) {
      newErrors.parent1Phone = "מספר טלפון הורה 1 חובה";
    } else if (!validatePhone(child.parent1.phone)) {
      newErrors.parent1Phone = "מספר טלפון לא תקין (צריך להתחיל ב-05 ולהכיל 10 ספרות)";
    }

    // Validate parent 2 only if name or phone is provided
    if (child.parent2?.name || child.parent2?.phone) {
      if (child.parent2?.phone && !validatePhone(child.parent2.phone)) {
        newErrors.parent2Phone = "מספר טלפון לא תקין (צריך להתחיל ב-05 ולהכיל 10 ספרות)";
      }
    }

    return newErrors;
  };

  const addChild = () => {
    const validationErrors = validateChild(currentChild);

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setChildren([...children, currentChild]);
    setCurrentChild({
      id: crypto.randomUUID(),
      childName: "",
      parent1: { name: "", phone: "" },
      parent2: { name: "", phone: "" },
      address: "",
    });
    setErrors({});
  };

  const removeChild = (id: string) => {
    setChildren(children.filter((child) => child.id !== id));
  };

  const handleSubmit = async () => {
    if (children.length === 0) {
      alert("יש להוסיף לפחות ילד אחד");
      return;
    }

    // TODO: Save to Supabase
    console.log("Saving children:", children);
    // Redirect to dashboard or next step
  };

  const downloadTemplate = () => {
    // Create CSV template
    const headers = ["ילד", "הורה 1", "טלפון הורה 1", "הורה 2", "טלפון הורה 2", "כתובת"];
    const exampleRow = ["דוגמה: יוסי כהן", "שרה כהן", "0501234567", "דוד כהן", "0509876543", "רחוב הרצל 15, תל אביב"];

    const csvContent = [headers.join(","), exampleRow.join(",")].join("\n");
    const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "class-roster-template.csv";
    link.click();
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // TODO: Parse Excel/CSV file
    // This would require a library like xlsx or papaparse
    console.log("File uploaded:", file.name);
  };

  return (
    <main dir="rtl" className="min-h-screen bg-gradient-to-b from-[#FFE5F1] to-white p-6">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Header */}
        <div className="space-y-4">
          <h1 className="text-4xl font-bold text-[#FF4FA2]">הגדרת רשימת הכיתה</h1>
          <p className="text-lg text-[#222222]">
            כדי להתחיל, הזינו את רשימת הילדים וההורים בכיתה שלכם. תוכלו להקליד ידנית או להעלות קובץ אקסל.
          </p>
        </div>

        {/* Input Methods Tabs */}
        <Tabs defaultValue="manual" className="w-full" dir="rtl">
          <TabsList className="grid w-full grid-cols-2 bg-white">
            <TabsTrigger value="manual">הקלדה ידנית</TabsTrigger>
            <TabsTrigger value="upload">העלאת אקסל</TabsTrigger>
          </TabsList>

          {/* Manual Entry Tab */}
          <TabsContent value="manual" className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-[#DFFAF7] p-6 space-y-6">
              <h2 className="text-2xl font-semibold text-[#4CD6CB]">הוסף ילד חדש</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Child Name */}
                <div className="space-y-2">
                  <Label htmlFor="childName">שם הילד/ה *</Label>
                  <Input
                    id="childName"
                    value={currentChild.childName}
                    onChange={(e) => setCurrentChild({ ...currentChild, childName: e.target.value })}
                    className={errors.childName ? "border-red-500" : ""}
                    placeholder="לדוגמה: יוסי כהן"
                  />
                  {errors.childName && <p className="text-sm text-red-500">{errors.childName}</p>}
                </div>

                {/* Address */}
                <div className="space-y-2">
                  <Label htmlFor="address">כתובת (אופציונלי)</Label>
                  <Input
                    id="address"
                    value={currentChild.address}
                    onChange={(e) => setCurrentChild({ ...currentChild, address: e.target.value })}
                    placeholder="לדוגמה: רחוב הרצל 15, תל אביב"
                  />
                </div>
              </div>

              {/* Parent 1 Section */}
              <div className="border-t pt-4 space-y-4">
                <h3 className="text-lg font-semibold text-[#FF4FA2]">הורה 1 *</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="parent1Name">שם הורה 1 *</Label>
                    <Input
                      id="parent1Name"
                      value={currentChild.parent1.name}
                      onChange={(e) => setCurrentChild({
                        ...currentChild,
                        parent1: { ...currentChild.parent1, name: e.target.value }
                      })}
                      className={errors.parent1Name ? "border-red-500" : ""}
                      placeholder="לדוגמה: שרה כהן"
                    />
                    {errors.parent1Name && <p className="text-sm text-red-500">{errors.parent1Name}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="parent1Phone">טלפון הורה 1 *</Label>
                    <Input
                      id="parent1Phone"
                      value={currentChild.parent1.phone}
                      onChange={(e) => setCurrentChild({
                        ...currentChild,
                        parent1: { ...currentChild.parent1, phone: e.target.value }
                      })}
                      className={errors.parent1Phone ? "border-red-500" : ""}
                      placeholder="לדוגמה: 0501234567"
                      dir="ltr"
                    />
                    {errors.parent1Phone && <p className="text-sm text-red-500">{errors.parent1Phone}</p>}
                    <p className="text-xs text-gray-500">טלפון – רק ספרות, בלי רווחים</p>
                  </div>
                </div>
              </div>

              {/* Parent 2 Section */}
              <div className="border-t pt-4 space-y-4">
                <h3 className="text-lg font-semibold text-[#FF4FA2]">הורה 2 (אופציונלי)</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="parent2Name">שם הורה 2</Label>
                    <Input
                      id="parent2Name"
                      value={currentChild.parent2?.name || ""}
                      onChange={(e) => setCurrentChild({
                        ...currentChild,
                        parent2: { ...currentChild.parent2, name: e.target.value, phone: currentChild.parent2?.phone || "" }
                      })}
                      placeholder="לדוגמה: דוד כהן"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="parent2Phone">טלפון הורה 2</Label>
                    <Input
                      id="parent2Phone"
                      value={currentChild.parent2?.phone || ""}
                      onChange={(e) => setCurrentChild({
                        ...currentChild,
                        parent2: { name: currentChild.parent2?.name || "", phone: e.target.value }
                      })}
                      className={errors.parent2Phone ? "border-red-500" : ""}
                      placeholder="לדוגמה: 0509876543"
                      dir="ltr"
                    />
                    {errors.parent2Phone && <p className="text-sm text-red-500">{errors.parent2Phone}</p>}
                  </div>
                </div>
              </div>

              <Button
                onClick={addChild}
                className="bg-[#4CD6CB] hover:bg-[#3bb5aa] text-white w-full md:w-auto"
              >
                <Plus className="ml-2 h-4 w-4" />
                הוסף ילד לרשימה
              </Button>
            </div>

            {/* Children List */}
            {children.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm border border-[#DFFAF7] p-6 space-y-4">
                <h2 className="text-2xl font-semibold text-[#4CD6CB]">
                  ילדים שנוספו ({children.length})
                </h2>

                <div className="space-y-3">
                  {children.map((child) => (
                    <div
                      key={child.id}
                      className="flex items-start justify-between p-4 bg-[#DFFAF7] rounded-xl"
                    >
                      <div className="flex-1 space-y-1">
                        <p className="font-semibold text-[#FF4FA2]">{child.childName}</p>
                        <p className="text-sm">
                          <span className="font-medium">הורה 1:</span> {child.parent1.name} - {child.parent1.phone}
                        </p>
                        {child.parent2?.name && (
                          <p className="text-sm">
                            <span className="font-medium">הורה 2:</span> {child.parent2.name} - {child.parent2.phone}
                          </p>
                        )}
                        {child.address && (
                          <p className="text-sm text-gray-600">
                            <span className="font-medium">כתובת:</span> {child.address}
                          </p>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeChild(child.id)}
                        className="text-red-500 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </TabsContent>

          {/* Upload Tab */}
          <TabsContent value="upload" className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-[#DFFAF7] p-6 space-y-6">
              <h2 className="text-2xl font-semibold text-[#4CD6CB]">העלאת קובץ אקסל</h2>

              <div className="space-y-4">
                <p className="text-[#222222]">
                  העלו קובץ בפורמט הבא (או הורידו תבנית מוכנה):
                </p>

                <Button
                  variant="outline"
                  onClick={downloadTemplate}
                  className="border-[#4CD6CB] text-[#4CD6CB] hover:bg-[#DFFAF7]"
                >
                  <Download className="ml-2 h-4 w-4" />
                  הורד תבנית CSV
                </Button>

                <div className="border-2 border-dashed border-[#4CD6CB] rounded-xl p-8 text-center space-y-4">
                  <Upload className="h-12 w-12 mx-auto text-[#4CD6CB]" />
                  <div>
                    <Label
                      htmlFor="file-upload"
                      className="cursor-pointer text-[#4CD6CB] hover:text-[#3bb5aa] font-medium"
                    >
                      לחץ לבחירת קובץ
                    </Label>
                    <Input
                      id="file-upload"
                      type="file"
                      accept=".csv,.xlsx"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                    <p className="text-sm text-gray-500 mt-2">או גרור ושחרר קובץ כאן</p>
                    <p className="text-xs text-gray-400 mt-1">קבצים נתמכים: CSV, XLSX</p>
                  </div>
                </div>

                <div className="bg-[#FFE5F1] p-4 rounded-xl">
                  <p className="text-sm font-medium text-[#FF4FA2] mb-2">פורמט הקובץ:</p>
                  <table className="w-full text-sm border-collapse">
                    <thead>
                      <tr className="bg-white">
                        <th className="border border-[#DFFAF7] p-2">ילד</th>
                        <th className="border border-[#DFFAF7] p-2">הורה 1</th>
                        <th className="border border-[#DFFAF7] p-2">טלפון הורה 1</th>
                        <th className="border border-[#DFFAF7] p-2">הורה 2</th>
                        <th className="border border-[#DFFAF7] p-2">טלפון הורה 2</th>
                        <th className="border border-[#DFFAF7] p-2">כתובת</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="border border-[#DFFAF7] p-2 text-center">יוסי כהן</td>
                        <td className="border border-[#DFFAF7] p-2 text-center">שרה כהן</td>
                        <td className="border border-[#DFFAF7] p-2 text-center">0501234567</td>
                        <td className="border border-[#DFFAF7] p-2 text-center">דוד כהן</td>
                        <td className="border border-[#DFFAF7] p-2 text-center">0509876543</td>
                        <td className="border border-[#DFFAF7] p-2 text-center">רחוב הרצל 15</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* Privacy Notice */}
        <div className="bg-[#DFFAF7] p-4 rounded-xl border border-[#4CD6CB]">
          <p className="text-sm text-[#222222]">
            🔒 <span className="font-semibold">פרטיות ואבטחה:</span> הפרטים נשמרים רק לכם ולעוזרי הועד שאתם מוסיפים. לא נשתף עם אף אחד אחר.
          </p>
        </div>

        {/* Submit Section */}
        <div className="flex gap-4 justify-between items-center">
          <Button
            variant="outline"
            className="border-gray-300 text-gray-600"
          >
            חזור מאוחר יותר
          </Button>

          <Button
            onClick={handleSubmit}
            disabled={children.length === 0}
            className="bg-[#FF4FA2] hover:bg-[#ff3390] text-white px-8 py-3 text-lg"
          >
            שמור והמשך
          </Button>
        </div>
      </div>
    </main>
  );
}
