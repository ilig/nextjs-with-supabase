"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { z } from "zod";
import * as XLSX from "xlsx";
import { ChevronRight, ChevronLeft, Upload, Check, Users, Calendar, DollarSign, Send } from "lucide-react";
import { ExcelTemplateDownload } from "@/components/excel-template-download";
import { createClass } from "@/app/actions/create-class";

// Types
type Child = {
  id: string;
  name: string;
  parent1Name: string;
  parent1Phone: string;
  parent2Name?: string;
  parent2Phone?: string;
  address?: string;
};

type Staff = {
  name: string;
  role: "teacher" | "assistant";
  birthday?: string;
};

type EventTemplate = {
  id: string;
  name: string;
  icon: string;
  defaultBudget?: number;
};

type BudgetAllocation = {
  eventId: string;
  eventName: string;
  amount: number;
};

// Validation schemas
const classDetailsSchema = z.object({
  className: z.string().min(1, "שם הכיתה הוא שדה חובה"),
  schoolName: z.string().min(1, "שם בית הספר הוא שדה חובה"),
  city: z.string().min(1, "עיר היא שדה חובה"),
  year: z.string().min(4, "שנה חייבת להיות תקינה"),
});

type ClassDetails = z.infer<typeof classDetailsSchema>;

const EVENT_TEMPLATES: EventTemplate[] = [
  { id: "birthdays-kids", name: "ימי הולדת - ילדים", icon: "🎂", defaultBudget: 50 },
  { id: "birthdays-staff", name: "ימי הולדת - צוות", icon: "🎉", defaultBudget: 100 },
  { id: "rosh-hashana", name: "ראש השנה", icon: "🍎", defaultBudget: 150 },
  { id: "hanukkah", name: "חנוכה", icon: "🕎", defaultBudget: 150 },
  { id: "tu-bishvat", name: "ט״ו בשבט", icon: "🌳", defaultBudget: 80 },
  { id: "purim", name: "פורים", icon: "🎭", defaultBudget: 200 },
  { id: "pesach", name: "פסח", icon: "🍷", defaultBudget: 150 },
  { id: "independence-day", name: "יום העצמאות", icon: "🇮🇱", defaultBudget: 100 },
  { id: "end-year-gifts-kids", name: "מתנות סוף שנה - ילדים", icon: "🎁", defaultBudget: 150 },
  { id: "end-year-gifts-staff", name: "מתנות סוף שנה - צוות", icon: "💐", defaultBudget: 200 },
  { id: "trips", name: "טיולים", icon: "🚌", defaultBudget: 300 },
  { id: "shows", name: "הצגות", icon: "🎪", defaultBudget: 150 },
  { id: "other", name: "אחר", icon: "➕", defaultBudget: 100 },
];

export function ClassOnboardingFlow() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [redirectCountdown, setRedirectCountdown] = useState<number | null>(null);
  const stepIconsRef = useRef<HTMLDivElement>(null);

  // Form state
  const [classDetails, setClassDetails] = useState<ClassDetails>({
    className: "",
    schoolName: "",
    city: "",
    year: new Date().getFullYear().toString(),
  });
  const [children, setChildren] = useState<Child[]>([]);
  const [staff, setStaff] = useState<Staff[]>([
    { name: "", role: "teacher", birthday: "" },
  ]);
  const [selectedEvents, setSelectedEvents] = useState<string[]>([]);
  const [budgetType, setBudgetType] = useState<"per-child" | "total">("per-child");
  const [budgetAmount, setBudgetAmount] = useState<number>(0);
  const [budgetAllocations, setBudgetAllocations] = useState<BudgetAllocation[]>([]);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [uploadMethod, setUploadMethod] = useState<"excel" | "manual">("excel");
  const [inviteLink, setInviteLink] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [customEventName, setCustomEventName] = useState("");
  const [customEvents, setCustomEvents] = useState<Array<{ id: string; name: string }>>([]);

  // Scroll active step into view
  useEffect(() => {
    if (stepIconsRef.current) {
      const activeStepElement = stepIconsRef.current.children[step] as HTMLElement;
      if (activeStepElement) {
        activeStepElement.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest',
          inline: 'center'
        });
      }
    }
  }, [step]);

  // Step titles
  const steps = [
    { title: "ברוכים הבאים", icon: "👋" },
    { title: "פרטי הכיתה", icon: "📝" },
    { title: "ילדים והורים", icon: "👨‍👩‍👧‍👦" },
    { title: "צוות", icon: "👩‍🏫" },
    { title: "אירועים", icon: "📅" },
    { title: "תקציב", icon: "💰" },
    { title: "חלוקת תקציב", icon: "📊" },
    { title: "סיכום", icon: "✅" },
    { title: "הזמנת הורים", icon: "📧" },
  ];

  // Excel upload handler
  const processExcelFile = (file: File) => {
    if (!file) return;

    // Validate file type
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

        const parsedChildren: Child[] = jsonData.map((row, index) => ({
          id: `child-${index}`,
          name: row["שם הילד/ה"] || row["שם הילד"] || row["Child Name"] || "",
          parent1Name: row["שם הורה 1"] || row["Parent 1 Name"] || "",
          parent1Phone: row["טלפון הורה 1"] || row["Parent 1 Phone"] || "",
          parent2Name: row["שם הורה 2"] || row["Parent 2 Name"] || "",
          parent2Phone: row["טלפון הורה 2"] || row["Parent 2 Phone"] || "",
          address: row["כתובת"] || row["Address"] || "",
        }));

        setChildren(parsedChildren);
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

  // Add manual child
  const addChild = () => {
    setChildren([
      ...children,
      {
        id: `child-${Date.now()}`,
        name: "",
        parent1Name: "",
        parent1Phone: "",
        parent2Name: "",
        parent2Phone: "",
        address: "",
      },
    ]);
  };

  // Update child with validation
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

  // Remove child
  const removeChild = (id: string) => {
    setChildren(children.filter((child) => child.id !== id));
  };

  // Add staff member
  const addStaff = () => {
    setStaff([...staff, { name: "", role: "assistant", birthday: "" }]);
  };

  // Update staff with validation
  const updateStaff = (index: number, field: keyof Staff, value: any) => {
    let validatedValue = value;

    // Validate name field - only Hebrew/English letters and spaces
    if (field === "name" && typeof value === "string") {
      validatedValue = value.replace(/[^a-zA-Zא-ת\s'-]/g, "");
    }

    setStaff(
      staff.map((member, i) =>
        i === index ? { ...member, [field]: validatedValue } : member
      )
    );
  };

  // Toggle event selection
  const toggleEvent = (eventId: string) => {
    if (selectedEvents.includes(eventId)) {
      setSelectedEvents(selectedEvents.filter((id) => id !== eventId));
      // If unchecking "other", clear the custom event input
      if (eventId === "other") {
        setCustomEventName("");
      }
    } else {
      setSelectedEvents([...selectedEvents, eventId]);
    }
  };

  // Add custom event
  const addCustomEvent = () => {
    if (!customEventName.trim()) {
      alert("אנא הזן שם לאירוע");
      return;
    }

    const newEvent = {
      id: `custom-${Date.now()}`,
      name: customEventName.trim(),
    };

    setCustomEvents([...customEvents, newEvent]);
    setSelectedEvents([...selectedEvents, newEvent.id]);
    setCustomEventName("");
  };

  // Remove custom event
  const removeCustomEvent = (eventId: string) => {
    setCustomEvents(customEvents.filter((e) => e.id !== eventId));
    setSelectedEvents(selectedEvents.filter((id) => id !== eventId));
  };

  // Initialize budget allocations when moving to allocation step
  const initializeBudgetAllocations = () => {
    const allocations = selectedEvents.map((eventId) => {
      const template = EVENT_TEMPLATES.find((t) => t.id === eventId);
      const customEvent = customEvents.find((e) => e.id === eventId);
      return {
        eventId,
        eventName: customEvent?.name || template?.name || "",
        amount: template?.defaultBudget || 100,
      };
    });
    setBudgetAllocations(allocations);
  };

  // Update budget allocation
  const updateBudgetAllocation = (eventId: string, amount: number) => {
    setBudgetAllocations(
      budgetAllocations.map((allocation) =>
        allocation.eventId === eventId ? { ...allocation, amount } : allocation
      )
    );
  };

  // Calculate totals
  const totalBudget = budgetType === "per-child"
    ? budgetAmount * children.length
    : budgetAmount;

  const allocatedBudget = budgetAllocations.reduce(
    (sum, allocation) => sum + allocation.amount,
    0
  );

  const remainingBudget = totalBudget - allocatedBudget;

  // Navigation
  const nextStep = () => {
    // Validate current step
    if (step === 1) {
      try {
        classDetailsSchema.parse(classDetails);
        setErrors({});
      } catch (error) {
        if (error instanceof z.ZodError) {
          const fieldErrors: Record<string, string> = {};
          error.issues.forEach((issue) => {
            if (issue.path[0]) {
              fieldErrors[issue.path[0] as string] = issue.message;
            }
          });
          setErrors(fieldErrors);
          return;
        }
      }
    }

    if (step === 2 && children.length === 0) {
      alert("אנא הוסף לפחות ילד אחד");
      return;
    }

    if (step === 4 && selectedEvents.length === 0) {
      alert("אנא בחר לפחות אירוע אחד");
      return;
    }

    if (step === 5) {
      initializeBudgetAllocations();
    }

    setStep(step + 1);
  };

  const prevStep = () => {
    setStep(step - 1);
  };

  // Submit onboarding
  const handleSubmit = async () => {
    setLoading(true);
    try {
      const onboardingData = {
        classDetails,
        children,
        staff,
        selectedEvents,
        budgetType,
        budgetAmount,
        budgetAllocations,
      };

      // Save to Supabase using server action
      const result = await createClass(onboardingData);

      if (!result.success) {
        throw new Error(result.error || "Failed to create class");
      }

      // Generate invite link with real invite code
      const inviteLink = `${window.location.origin}/join/${result.inviteCode}`;
      setInviteLink(inviteLink);

      nextStep();

      // Start countdown for automatic redirect
      setRedirectCountdown(3);
      const countdownInterval = setInterval(() => {
        setRedirectCountdown((prev) => {
          if (prev === null || prev <= 1) {
            clearInterval(countdownInterval);
            router.push("/dashboard");
            return null;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (error) {
      console.error("Error submitting onboarding:", error);
      alert("שגיאה בשמירת הנתונים. אנא נסה שוב.");
    } finally {
      setLoading(false);
    }
  };

  // Render step content
  const renderStepContent = () => {
    switch (step) {
      case 0:
        // Welcome Screen
        return (
          <div className="text-center space-y-6">
            <div className="text-6xl mb-4">👋</div>
            <h2 className="text-3xl md:text-4xl font-extrabold text-foreground">
              ברוכים הבאים לועד הורים
            </h2>
            <p className="text-lg text-muted-foreground">
              נקים יחד את הכיתה שלכם תוך דקות
            </p>
            <div className="flex gap-4 justify-center pt-4">
              <Button
                onClick={nextStep}
                className="rounded-2xl bg-brand hover:bg-brand-hover text-white font-bold shadow-lg"
              >
                התחלת ההקמה
              </Button>
              <Button variant="outline" className="rounded-2xl border-2">
                סרטון הדרכה
              </Button>
            </div>
          </div>
        );

      case 1:
        // Class Details
        return (
          <div className="space-y-4">
            <h2 className="text-2xl md:text-3xl font-extrabold text-foreground mb-4">פרטי הכיתה</h2>

            <div className="space-y-2">
              <Label htmlFor="className">שם הכיתה *</Label>
              <Input
                id="className"
                placeholder="לדוגמה: גן חצב, כיתה ב'"
                value={classDetails.className}
                onChange={(e) =>
                  setClassDetails({ ...classDetails, className: e.target.value })
                }
                className={errors.className ? "border-red-500" : ""}
              />
              {errors.className && (
                <p className="text-sm text-red-500">{errors.className}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="schoolName">שם בית הספר / הגן *</Label>
              <Input
                id="schoolName"
                placeholder="שם המוסד החינוכי"
                value={classDetails.schoolName}
                onChange={(e) =>
                  setClassDetails({ ...classDetails, schoolName: e.target.value })
                }
                className={errors.schoolName ? "border-red-500" : ""}
              />
              {errors.schoolName && (
                <p className="text-sm text-red-500">{errors.schoolName}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="city">עיר *</Label>
              <Input
                id="city"
                placeholder="שם העיר"
                value={classDetails.city}
                onChange={(e) => {
                  // Only Hebrew/English letters and spaces
                  const value = e.target.value.replace(/[^a-zA-Zא-ת\s'-]/g, "");
                  setClassDetails({ ...classDetails, city: value });
                }}
                className={errors.city ? "border-red-500" : ""}
              />
              {errors.city && (
                <p className="text-sm text-red-500">{errors.city}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="year">שנת לימודים</Label>
              <Input
                id="year"
                type="number"
                value={classDetails.year}
                onChange={(e) => {
                  // Only 4 digits for year
                  const value = e.target.value.replace(/[^0-9]/g, "").slice(0, 4);
                  setClassDetails({ ...classDetails, year: value });
                }}
                maxLength={4}
              />
            </div>
          </div>
        );

      case 2:
        // Children & Parents
        return (
          <div className="space-y-4">
            <h2 className="text-2xl md:text-3xl font-extrabold text-foreground mb-4">ילדים והורים</h2>

            <div className="flex gap-2 mb-4">
              <Button
                variant={uploadMethod === "excel" ? "default" : "outline"}
                onClick={() => setUploadMethod("excel")}
                className="flex-1"
              >
                <Upload className="ml-2 h-4 w-4" />
                העלאת אקסל
              </Button>
              <Button
                variant={uploadMethod === "manual" ? "default" : "outline"}
                onClick={() => setUploadMethod("manual")}
                className="flex-1"
              >
                <Users className="ml-2 h-4 w-4" />
                הזנה ידנית
              </Button>
            </div>

            {uploadMethod === "excel" ? (
              <div
                onDragEnter={handleDragEnter}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all ${
                  isDragging
                    ? "border-purple-500 bg-purple-500/20 scale-105"
                    : "border-border hover:border-purple-500"
                }`}
              >
                <Upload className={`mx-auto h-12 w-12 mb-4 transition-colors ${
                  isDragging ? "text-purple-500" : "text-muted-foreground"
                }`} />
                <Label
                  htmlFor="excel-upload"
                  className="cursor-pointer text-purple-500 hover:text-purple-600 font-medium block"
                >
                  {isDragging ? "שחרר לכאן להעלאה" : "לחץ או גרור קובץ אקסל לכאן"}
                </Label>
                <Input
                  id="excel-upload"
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleExcelUpload}
                  className="hidden"
                />
                <p className="text-sm text-muted-foreground mt-2">
                  הקובץ חייב לכלול: שם ילד, שם הורה 1, טלפון הורה 1
                </p>
                <ExcelTemplateDownload />
              </div>
            ) : null}

            {children.length > 0 && (
              <div className="space-y-4 max-h-96 overflow-y-auto">
                <div className="flex justify-between items-center">
                  <p className="font-medium">{children.length} ילדים</p>
                  {uploadMethod === "manual" && (
                    <Button onClick={addChild} variant="outline" size="sm">
                      + הוסף ילד
                    </Button>
                  )}
                </div>

                {children.map((child, index) => (
                  <Card key={child.id} className="p-4">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="col-span-2">
                        <Label>שם הילד/ה</Label>
                        <Input
                          value={child.name}
                          onChange={(e) => updateChild(child.id, "name", e.target.value)}
                          placeholder="שם הילד/ה"
                        />
                      </div>
                      <div>
                        <Label>שם הורה 1</Label>
                        <Input
                          value={child.parent1Name}
                          onChange={(e) =>
                            updateChild(child.id, "parent1Name", e.target.value)
                          }
                        />
                      </div>
                      <div>
                        <Label>טלפון הורה 1</Label>
                        <Input
                          type="tel"
                          inputMode="numeric"
                          pattern="[0-9]*"
                          maxLength={10}
                          value={child.parent1Phone}
                          onChange={(e) =>
                            updateChild(child.id, "parent1Phone", e.target.value)
                          }
                          placeholder="05XXXXXXXX"
                          dir="ltr"
                        />
                      </div>
                      <div>
                        <Label>שם הורה 2 (אופציונלי)</Label>
                        <Input
                          value={child.parent2Name || ""}
                          onChange={(e) =>
                            updateChild(child.id, "parent2Name", e.target.value)
                          }
                        />
                      </div>
                      <div>
                        <Label>טלפון הורה 2 (אופציונלי)</Label>
                        <Input
                          type="tel"
                          inputMode="numeric"
                          pattern="[0-9]*"
                          maxLength={10}
                          value={child.parent2Phone || ""}
                          onChange={(e) =>
                            updateChild(child.id, "parent2Phone", e.target.value)
                          }
                          placeholder="05XXXXXXXX"
                          dir="ltr"
                        />
                      </div>
                      <div className="col-span-2">
                        <Label>כתובת (אופציונלי)</Label>
                        <Input
                          value={child.address || ""}
                          onChange={(e) =>
                            updateChild(child.id, "address", e.target.value)
                          }
                        />
                      </div>
                      {uploadMethod === "manual" && (
                        <div className="col-span-2">
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => removeChild(child.id)}
                          >
                            הסר
                          </Button>
                        </div>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            )}

            {uploadMethod === "manual" && children.length === 0 && (
              <div className="text-center py-8">
                <Button onClick={addChild} className="rounded-2xl bg-brand hover:bg-brand-hover text-white font-bold">
                  + הוסף את הילד הראשון
                </Button>
              </div>
            )}
          </div>
        );

      case 3:
        // Staff Setup
        return (
          <div className="space-y-4">
            <h2 className="text-2xl md:text-3xl font-extrabold text-foreground mb-4">צוות הכיתה</h2>

            {staff.map((member, index) => (
              <Card key={index} className="p-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2">
                    <Label>שם</Label>
                    <Input
                      value={member.name}
                      onChange={(e) => updateStaff(index, "name", e.target.value)}
                      placeholder={index === 0 ? "שם המורה/הגננת" : "שם עוזר/ת"}
                    />
                  </div>
                  <div>
                    <Label>תפקיד</Label>
                    <select
                      value={member.role}
                      onChange={(e) =>
                        updateStaff(index, "role", e.target.value as "teacher" | "assistant")
                      }
                      className="w-full px-3 py-2 border rounded-md"
                    >
                      <option value="teacher">מורה/גננת</option>
                      <option value="assistant">עוזר/ת</option>
                    </select>
                  </div>
                  <div>
                    <Label>תאריך לידה (DD/MM - אופציונלי)</Label>
                    <Input
                      value={member.birthday || ""}
                      onChange={(e) => updateStaff(index, "birthday", e.target.value)}
                      placeholder="DD/MM"
                      maxLength={5}
                    />
                  </div>
                </div>
              </Card>
            ))}

            <Button onClick={addStaff} variant="outline" className="w-full">
              + הוסף איש צוות
            </Button>
          </div>
        );

      case 4:
        // Events Template Selection
        return (
          <div className="space-y-4">
            <h2 className="text-2xl md:text-3xl font-extrabold text-foreground mb-4">
              אילו אירועים תרצו לתקצב?
            </h2>
            <p className="text-muted-foreground mb-4">בחרו את האירועים שתרצו להקצות להם תקציב</p>

            <div className="grid grid-cols-2 gap-3">
              {EVENT_TEMPLATES.filter((e) => e.id !== "other").map((event) => (
                <Card
                  key={event.id}
                  className={`p-3 cursor-pointer transition-all rounded-2xl ${
                    selectedEvents.includes(event.id)
                      ? "border-purple-500 border-2 bg-purple-500/20"
                      : "border-border hover:border-purple-500"
                  }`}
                  onClick={() => toggleEvent(event.id)}
                >
                  <div className="flex items-center gap-2">
                    <Checkbox
                      checked={selectedEvents.includes(event.id)}
                      onCheckedChange={() => toggleEvent(event.id)}
                    />
                    <div className="text-2xl">{event.icon}</div>
                    <div className="flex-1">
                      <p className="font-medium text-sm">{event.name}</p>
                    </div>
                  </div>
                </Card>
              ))}

              {/* Custom Events */}
              {customEvents.map((event) => (
                <Card
                  key={event.id}
                  className="p-3 border-purple-500 border-2 bg-purple-500/20 rounded-2xl relative"
                >
                  <div className="flex items-center gap-2">
                    <Checkbox checked={true} disabled />
                    <div className="text-2xl">✨</div>
                    <div className="flex-1">
                      <p className="font-medium text-sm">{event.name}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeCustomEvent(event.id)}
                      className="h-6 w-6 p-0 hover:bg-red-500/20"
                    >
                      ✕
                    </Button>
                  </div>
                </Card>
              ))}
            </div>

            {/* Add Custom Event Section */}
            <Card className="p-4 border-2 border-dashed border-border rounded-2xl">
              <div className="space-y-3">
                <Label htmlFor="custom-event" className="text-base font-semibold flex items-center gap-2">
                  <span className="text-2xl">➕</span>
                  הוסף אירוע מותאם אישית
                </Label>
                <div className="flex gap-2">
                  <Input
                    id="custom-event"
                    value={customEventName}
                    onChange={(e) => setCustomEventName(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === "Enter") {
                        addCustomEvent();
                      }
                    }}
                    placeholder='לדוגמה: "מסיבת סיום", "יום כיף"'
                    className="flex-1"
                  />
                  <Button
                    onClick={addCustomEvent}
                    className="rounded-xl bg-brand hover:bg-brand-hover text-white font-bold"
                  >
                    הוסף
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        );

      case 5:
        // Budget Setup
        return (
          <div className="space-y-4">
            <h2 className="text-2xl md:text-3xl font-extrabold text-foreground mb-4">הגדרת תקציב</h2>

            <div className="space-y-4">
              <div className="flex gap-4">
                <Card
                  className={`flex-1 p-4 cursor-pointer rounded-2xl ${
                    budgetType === "per-child"
                      ? "border-purple-500 border-2 bg-purple-500/20"
                      : "border-border"
                  }`}
                  onClick={() => setBudgetType("per-child")}
                >
                  <div className="text-center">
                    <div className="text-3xl mb-2">👶</div>
                    <p className="font-medium">תקציב לילד</p>
                    <p className="text-sm text-muted-foreground">הזן סכום לכל ילד</p>
                  </div>
                </Card>

                <Card
                  className={`flex-1 p-4 cursor-pointer rounded-2xl ${
                    budgetType === "total"
                      ? "border-purple-500 border-2 bg-purple-500/20"
                      : "border-border"
                  }`}
                  onClick={() => setBudgetType("total")}
                >
                  <div className="text-center">
                    <div className="text-3xl mb-2">💰</div>
                    <p className="font-medium">תקציב כולל</p>
                    <p className="text-sm text-muted-foreground">הזן סכום כולל</p>
                  </div>
                </Card>
              </div>

              <div className="space-y-2">
                <Label>
                  {budgetType === "per-child" ? "סכום לילד (₪)" : "תקציב כולל (₪)"}
                </Label>
                <Input
                  type="number"
                  min="0"
                  max="1000000"
                  step="1"
                  value={budgetAmount === 0 ? "" : budgetAmount}
                  onChange={(e) => {
                    const value = Number(e.target.value);
                    // Prevent negative numbers and cap at 1 million
                    if (value >= 0 && value <= 1000000) {
                      setBudgetAmount(Math.floor(value));
                    }
                  }}
                  onFocus={(e) => {
                    if (budgetAmount === 0) {
                      e.target.value = "";
                    }
                  }}
                  placeholder="0"
                  dir="ltr"
                />
              </div>

              {budgetAmount > 0 && (
                <Card className="p-4 bg-purple-500/20 rounded-2xl">
                  <p className="text-lg font-semibold text-purple-600 dark:text-purple-400">
                    תקציב כולל: ₪{totalBudget.toLocaleString()}
                  </p>
                  {budgetType === "per-child" && (
                    <p className="text-sm text-muted-foreground">
                      ({children.length} ילדים × ₪{budgetAmount})
                    </p>
                  )}
                  {budgetType === "total" && children.length > 0 && (
                    <p className="text-sm text-muted-foreground">
                      (₪{Math.round(totalBudget / children.length).toLocaleString()} לילד × {children.length} ילדים)
                    </p>
                  )}
                </Card>
              )}
            </div>
          </div>
        );

      case 6:
        // Budget Allocation
        return (
          <div className="space-y-4">
            <h2 className="text-2xl md:text-3xl font-extrabold text-foreground mb-4">חלוקת התקציב</h2>
            <p className="text-muted-foreground">הקצו תקציב לכל אירוע</p>

            <Card className="p-3 bg-purple-500/20 mb-4 rounded-2xl">
              <div className="flex justify-between items-center gap-2">
                <div className="flex-1">
                  <p className="text-xs text-muted-foreground">תקציב כולל</p>
                  <p className="text-lg md:text-xl font-bold">₪{totalBudget.toLocaleString()}</p>
                </div>
                <div className="flex-1 text-center">
                  <p className="text-xs text-muted-foreground">הוקצה</p>
                  <p className="text-lg md:text-xl font-bold text-purple-600 dark:text-purple-400">
                    ₪{allocatedBudget.toLocaleString()}
                  </p>
                </div>
                <div className="flex-1 text-left">
                  <p className="text-xs text-muted-foreground">נותר</p>
                  <p
                    className={`text-lg md:text-xl font-bold ${
                      remainingBudget < 0 ? "text-red-500" : "text-green-500"
                    }`}
                  >
                    ₪{remainingBudget.toLocaleString()}
                  </p>
                </div>
              </div>
            </Card>

            <div className="space-y-3">
              {budgetAllocations.map((allocation) => {
                const template = EVENT_TEMPLATES.find((t) => t.id === allocation.eventId);
                const customEvent = customEvents.find((e) => e.id === allocation.eventId);
                const icon = customEvent ? "✨" : template?.icon || "📅";
                return (
                  <Card key={allocation.eventId} className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="text-2xl">{icon}</div>
                      <div className="flex-1">
                        <p className="font-medium">{allocation.eventName}</p>
                      </div>
                      <div className="w-32">
                        <Input
                          type="number"
                          min="0"
                          max={totalBudget}
                          step="1"
                          value={allocation.amount === 0 ? "" : allocation.amount}
                          onChange={(e) => {
                            const value = Number(e.target.value);
                            // Prevent negative numbers and values exceeding total budget
                            if (value >= 0 && value <= totalBudget) {
                              updateBudgetAllocation(
                                allocation.eventId,
                                Math.floor(value)
                              );
                            }
                          }}
                          onFocus={(e) => {
                            if (allocation.amount === 0) {
                              e.target.value = "";
                            }
                          }}
                          dir="ltr"
                          placeholder="₪0"
                        />
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>
        );

      case 7:
        // Review & Confirm
        return (
          <div className="space-y-4">
            <h2 className="text-2xl md:text-3xl font-extrabold text-foreground mb-4">סיכום ואישור</h2>

            <Card className="p-4">
              <h3 className="font-bold mb-2">פרטי הכיתה</h3>
              <p>כיתה: {classDetails.className}</p>
              <p>בית ספר: {classDetails.schoolName}</p>
              <p>עיר: {classDetails.city}</p>
              <p>שנה: {classDetails.year}</p>
            </Card>

            <Card className="p-4">
              <h3 className="font-bold mb-2">ילדים</h3>
              <p>{children.length} ילדים רשומים</p>
            </Card>

            <Card className="p-4">
              <h3 className="font-bold mb-2">צוות</h3>
              {staff.filter((s) => s.name).map((member, i) => (
                <p key={i}>
                  {member.name} ({member.role === "teacher" ? "מורה" : "עוזר/ת"})
                </p>
              ))}
            </Card>

            <Card className="p-4 rounded-2xl">
              <h3 className="font-bold mb-2">תקציב</h3>
              <p className="text-xl font-bold text-purple-600 dark:text-purple-400">
                ₪{totalBudget.toLocaleString()}
              </p>
              <div className="mt-2 space-y-1">
                {budgetAllocations.map((allocation) => {
                  const displayName = allocation.eventId === "other" && customEventName
                    ? customEventName
                    : allocation.eventName;
                  return (
                    <div key={allocation.eventId} className="flex justify-between text-sm">
                      <span>{displayName}</span>
                      <span>₪{allocation.amount.toLocaleString()}</span>
                    </div>
                  );
                })}
              </div>
            </Card>

            <div className="flex gap-3 pt-4">
              <Button onClick={prevStep} variant="outline" className="flex-1 rounded-2xl border-2">
                חזרה לעריכה
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={loading}
                className="flex-1 rounded-2xl bg-brand hover:bg-brand-hover text-white font-bold shadow-lg"
              >
                {loading ? "שומר..." : "השק את הכיתה 🚀"}
              </Button>
            </div>
          </div>
        );

      case 8:
        // Invite Parents
        return (
          <div className="text-center space-y-6">
            <div className="text-6xl mb-4">🎉</div>
            <h2 className="text-3xl md:text-4xl font-extrabold text-foreground">
              הכיתה הוקמה בהצלחה!
            </h2>
            <p className="text-lg text-muted-foreground">
              עכשיו זה הזמן להזמין את ההורים
            </p>

            <Card className="p-6 bg-purple-500/20 rounded-2xl">
              <p className="font-medium mb-2">קישור ההזמנה:</p>
              <div className="flex gap-2">
                <Input
                  value={inviteLink}
                  readOnly
                  dir="ltr"
                  className="text-center"
                />
                <Button
                  onClick={() => {
                    navigator.clipboard.writeText(inviteLink);
                    alert("הקישור הועתק!");
                  }}
                  className="rounded-2xl bg-brand hover:bg-brand-hover text-white font-bold"
                >
                  העתק
                </Button>
              </div>
            </Card>

            <div className="bg-yellow-500/20 p-4 rounded-2xl border-2 border-yellow-500/30">
              <p className="text-sm text-foreground font-semibold">
                💡 שלחו את הקישור לקבוצת הווטסאפ של הכיתה
              </p>
            </div>

            <Button
              onClick={() => router.push("/dashboard")}
              className="rounded-2xl bg-brand hover:bg-brand-hover text-white font-bold shadow-lg"
            >
              {redirectCountdown !== null
                ? `מעבר אוטומטי בעוד ${redirectCountdown} שניות...`
                : "מעבר לדשבורד"}
            </Button>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div dir="rtl" className="min-h-screen bg-background p-4">
      <div className="max-w-3xl mx-auto py-8">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-muted-foreground">
              שלב {step + 1} מתוך {steps.length}
            </span>
            <span className="text-sm font-medium text-brand">
              {steps[step].title}
            </span>
          </div>
          <div className="w-full bg-muted rounded-full h-2">
            <div
              className="bg-purple-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${((step + 1) / steps.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Step Icons */}
        <div className="relative mb-8 min-h-[120px]">
          <div ref={stepIconsRef} className="flex gap-3 overflow-x-auto overflow-y-visible pb-6 pt-8 px-4 scroll-px-4 scroll-smooth">
            {steps.map((s, i) => (
              <div
                key={i}
                className={`flex flex-col items-center justify-start flex-shrink-0 transition-all ${
                  i === step
                    ? "opacity-100 w-20"
                    : i < step
                      ? "opacity-60 cursor-pointer hover:opacity-80 w-16"
                      : "opacity-30 w-16"
                }`}
                onClick={() => {
                  if (i < step) {
                    setStep(i);
                  }
                }}
              >
                <div
                  className={`mb-3 transition-all duration-300 flex items-center justify-center shrink-0 ${
                    i === step
                      ? "bg-brand rounded-full w-16 h-16 shadow-lg text-3xl leading-none"
                      : i < step
                        ? "text-2xl w-10 h-10 leading-none"
                        : "text-2xl w-10 h-10 opacity-70 leading-none"
                  }`}
                  style={i === step ? { lineHeight: '1' } : {}}
                >
                  {i < step ? "✅" : s.icon}
                </div>
                <p className={`text-xs text-center font-medium leading-tight w-full px-1 ${
                  i === step ? "text-brand" : "text-muted-foreground"
                }`}>
                  {s.title}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Main Content */}
        <Card className="p-6 md:p-8 shadow-xl rounded-3xl border-2 border-border">
          {renderStepContent()}

          {/* Navigation Buttons */}
          {step > 0 && step < 7 && (
            <div className="flex gap-3 mt-6 pt-6 border-t">
              <Button onClick={prevStep} variant="outline" className="flex-1 rounded-2xl border-2">
                <ChevronRight className="ml-2 h-4 w-4" />
                חזרה
              </Button>
              <Button
                onClick={nextStep}
                className="flex-1 rounded-2xl bg-brand hover:bg-brand-hover text-white font-bold shadow-lg hover:shadow-xl transition-all"
              >
                המשך
                <ChevronLeft className="mr-2 h-4 w-4" />
              </Button>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
