"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { z } from "zod";
import { createClient } from "@/lib/supabase/client";

// Validation schemas
const step1Schema = z.object({
  className: z.string().min(1, "שם הכיתה הוא שדה חובה"),
  schoolName: z.string().min(1, "שם בית הספר/גן הוא שדה חובה"),
  city: z.string().min(1, "עיר/יישוב הוא שדה חובה"),
});

const step2Schema = z.object({
  numberOfChildren: z.number().min(1, "חייב להיות לפחות ילד אחד").max(100, "מספר לא סביר"),
  numberOfStaff: z.number().min(1, "חייב להיות לפחות איש צוות אחד").max(20, "מספר לא סביר"),
});

type Step1Data = z.infer<typeof step1Schema>;
type Step2Data = z.infer<typeof step2Schema>;

export function SimplifiedClassWizard() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Step 1: Basic class info
  const [step1Data, setStep1Data] = useState<Step1Data>({
    className: "",
    schoolName: "",
    city: "",
  });

  // Step 2: Size estimation
  const [step2Data, setStep2Data] = useState<Step2Data>({
    numberOfChildren: 0,
    numberOfStaff: 0,
  });

  // Get current academic year
  const getCurrentAcademicYear = () => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1; // 1-12

    // If we're in Sep-Dec, academic year is currentYear/nextYear
    // If we're in Jan-Aug, academic year is prevYear/currentYear
    if (currentMonth >= 9) {
      return `${currentYear}/${currentYear + 1}`;
    } else {
      return `${currentYear - 1}/${currentYear}`;
    }
  };

  const handleStep1Next = () => {
    try {
      step1Schema.parse(step1Data);
      setErrors({});
      setCurrentStep(2);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldErrors: Record<string, string> = {};
        error.issues.forEach((issue) => {
          fieldErrors[issue.path[0] as string] = issue.message;
        });
        setErrors(fieldErrors);
      }
    }
  };

  const handleStep2Next = async () => {
    try {
      step2Schema.parse(step2Data);
      setErrors({});
      setLoading(true);

      // Create the class in the database with minimal data
      const supabase = createClient();

      // Refresh session to ensure we have the latest auth state
      const { data: { session } } = await supabase.auth.getSession();

      if (!session?.user) {
        throw new Error("User not authenticated");
      }

      const user = session.user;

      const academicYear = getCurrentAcademicYear();

      // Calculate estimated total budget (assuming 200 NIS per child as default)
      const estimatedBudgetPerChild = 200;
      const estimatedTotalBudget = estimatedBudgetPerChild * step2Data.numberOfChildren;

      const { data: classData, error: classError } = await supabase
        .from("classes")
        .insert({
          name: step1Data.className,
          school_name: step1Data.schoolName,
          city: step1Data.city,
          year: academicYear,
          created_by: user.id,
          total_budget: estimatedTotalBudget,
          budget_type: 'per-child',
          budget_amount: estimatedBudgetPerChild,
          number_of_children: step2Data.numberOfChildren,
          number_of_staff: step2Data.numberOfStaff,
        })
        .select()
        .single();

      if (classError) {
        console.error("Class creation error:", classError);
        throw classError;
      }

      // Generate invite code
      const inviteCode = Math.random().toString(36).substring(2, 10).toUpperCase();

      const { error: updateError } = await supabase
        .from("classes")
        .update({ invite_code: inviteCode })
        .eq("id", classData.id);

      if (updateError) {
        console.error("Invite code update error:", updateError);
        throw updateError;
      }

      // Add creator as admin member
      const { error: memberError } = await supabase.from("class_members").insert({
        class_id: classData.id,
        user_id: user.id,
        role: "admin",
      });

      if (memberError) {
        console.error("Class member insertion error:", memberError);
        throw memberError;
      }

      // Store setup progress in localStorage for the dashboard
      const setupProgress = {
        classId: classData.id,
        completedTasks: ["basic_info"], // First task is done
        estimatedChildren: step2Data.numberOfChildren,
        estimatedStaff: step2Data.numberOfStaff,
      };
      localStorage.setItem(`setup_progress_${classData.id}`, JSON.stringify(setupProgress));

      setCurrentStep(3);

      // Redirect to dashboard after 2 seconds
      setTimeout(() => {
        router.push(`/dashboard?classId=${classData.id}`);
      }, 2000);

    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldErrors: Record<string, string> = {};
        error.issues.forEach((issue) => {
          fieldErrors[issue.path[0] as string] = issue.message;
        });
        setErrors(fieldErrors);
      } else {
        console.error("Error creating class:", error);

        // Handle Supabase errors
        let errorMessage = "Unknown error";
        if (error && typeof error === 'object') {
          const supabaseError = error as any;
          if (supabaseError.message) {
            errorMessage = supabaseError.message;
          } else if (supabaseError.hint) {
            errorMessage = supabaseError.hint;
          } else {
            errorMessage = JSON.stringify(error);
          }
        } else if (error instanceof Error) {
          errorMessage = error.message;
        }

        console.error("Error details:", errorMessage);
        alert(`שגיאה ביצירת הכיתה: ${errorMessage}\nאנא נסו שוב.`);
      }
    } finally {
      setLoading(false);
    }
  };

  // Step 1: Welcome + Quick Start
  if (currentStep === 1) {
    return (
      <div className="bg-gradient-to-b from-blue-50 to-white dark:from-blue-950 dark:to-background flex items-center justify-center p-4 py-8" dir="rtl">
        <Card className="w-full max-w-2xl shadow-xl h-[650px] flex flex-col">
          <CardHeader className="text-center space-y-2">
            <div className="text-6xl mb-4">👋</div>
            <CardTitle className="text-3xl font-bold">ברוכים הבאים!</CardTitle>
            <CardDescription className="text-lg">
              בואו ניצור את הכיתה שלכם תוך 30 שניות
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col">
            <div className="space-y-3 flex-1">
              <div>
                <Label htmlFor="className" className="text-lg">
                  שם הכיתה <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="className"
                  placeholder="לדוגמא: כיתה א' 2"
                  value={step1Data.className}
                  onChange={(e) => {
                    setStep1Data({ ...step1Data, className: e.target.value });
                    if (errors.className) {
                      setErrors({ ...errors, className: "" });
                    }
                  }}
                  className="text-lg h-12 mt-2"
                />
                <div className="h-5 mt-1">
                  {errors.className && (
                    <p className="text-red-500 text-sm">{errors.className}</p>
                  )}
                </div>
              </div>

              <div>
                <Label htmlFor="schoolName" className="text-lg">
                  שם בית הספר/גן <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="schoolName"
                  placeholder="לדוגמה: בית ספר הגפן"
                  value={step1Data.schoolName}
                  onChange={(e) => {
                    setStep1Data({ ...step1Data, schoolName: e.target.value });
                    if (errors.schoolName) {
                      setErrors({ ...errors, schoolName: "" });
                    }
                  }}
                  className="text-lg h-12 mt-2"
                />
                <div className="h-5 mt-1">
                  {errors.schoolName && (
                    <p className="text-red-500 text-sm">{errors.schoolName}</p>
                  )}
                </div>
              </div>

              <div>
                <Label htmlFor="city" className="text-lg">
                  עיר/יישוב <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="city"
                  placeholder="לדוגמה: תל אביב"
                  value={step1Data.city}
                  onChange={(e) => {
                    setStep1Data({ ...step1Data, city: e.target.value });
                    if (errors.city) {
                      setErrors({ ...errors, city: "" });
                    }
                  }}
                  className="text-lg h-12 mt-2"
                />
                <div className="h-5 mt-1">
                  {errors.city && (
                    <p className="text-red-500 text-sm">{errors.city}</p>
                  )}
                </div>
              </div>
            </div>

            <div className="flex justify-between items-center pt-6 mt-auto">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                className="text-lg h-12 px-6"
              >
                <span className="flex items-center gap-2">
                  <span>→</span>
                  <span>חזרה</span>
                </span>
              </Button>
              <Button
                type="button"
                onClick={handleStep1Next}
                size="lg"
                className="text-lg h-12 px-8 bg-blue-600 hover:bg-blue-700"
              >
                <span className="flex items-center gap-2">
                  <span>המשך</span>
                  <span>←</span>
                </span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Step 2: Size Estimation
  if (currentStep === 2) {
    return (
      <div className="bg-gradient-to-b from-blue-50 to-white dark:from-blue-950 dark:to-background flex items-center justify-center p-4 py-8" dir="rtl">
        <Card className="w-full max-w-2xl shadow-xl h-[650px] flex flex-col">
          <CardHeader className="text-center space-y-2">
            <div className="text-6xl mb-4">📊</div>
            <CardTitle className="text-3xl font-bold">כמה ילדים והורים?</CardTitle>
            <CardDescription className="text-lg">
              נתונים בסיסיים לתכנון התקציב
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col">
            <div className="space-y-6 flex-1">
              <div>
                <Label htmlFor="numberOfChildren" className="text-lg">
                  מספר ילדים בכיתה
                </Label>
                <Input
                  id="numberOfChildren"
                  type="number"
                  min="1"
                  max="100"
                  value={step2Data.numberOfChildren || ""}
                  placeholder="0"
                  onChange={(e) => {
                    const value = parseInt(e.target.value) || 0;
                    setStep2Data({ ...step2Data, numberOfChildren: value });
                    if (errors.numberOfChildren) {
                      setErrors({ ...errors, numberOfChildren: "" });
                    }
                  }}
                  onFocus={(e) => {
                    if (step2Data.numberOfChildren === 0) {
                      e.target.select();
                    }
                  }}
                  className="text-lg h-12 text-center text-2xl font-bold placeholder:text-muted-foreground mt-2"
                />
                <div className="h-5 mt-1">
                  {errors.numberOfChildren && (
                    <p className="text-red-500 text-sm">{errors.numberOfChildren}</p>
                  )}
                </div>
              </div>

              <div>
                <Label htmlFor="numberOfStaff" className="text-lg">
                  מספר אנשי צוות (מורה, סייע/ת וכו')
                </Label>
                <Input
                  id="numberOfStaff"
                  type="number"
                  min="1"
                  max="20"
                  value={step2Data.numberOfStaff || ""}
                  placeholder="0"
                  onChange={(e) => {
                    const value = parseInt(e.target.value) || 0;
                    setStep2Data({ ...step2Data, numberOfStaff: value });
                    if (errors.numberOfStaff) {
                      setErrors({ ...errors, numberOfStaff: "" });
                    }
                  }}
                  onFocus={(e) => {
                    if (step2Data.numberOfStaff === 0) {
                      e.target.select();
                    }
                  }}
                  className="text-lg h-12 text-center text-2xl font-bold placeholder:text-muted-foreground mt-2"
                />
                <div className="h-5 mt-1">
                  {errors.numberOfStaff && (
                    <p className="text-red-500 text-sm">{errors.numberOfStaff}</p>
                  )}
                </div>
              </div>
            </div>

            <div className="flex justify-between items-center pt-6 mt-auto">
              <Button
                type="button"
                variant="outline"
                onClick={() => setCurrentStep(1)}
                className="text-lg h-12 px-6"
                disabled={loading}
              >
                <span className="flex items-center gap-2">
                  <span>→</span>
                  <span>חזרה</span>
                </span>
              </Button>
              <Button
                type="button"
                onClick={handleStep2Next}
                size="lg"
                className="text-lg h-12 px-8 bg-green-600 hover:bg-green-700"
                disabled={loading}
              >
                {loading ? "יוצר את הכיתה..." : "צור את הכיתה! 🚀"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Step 3: Success + Redirect
  return (
    <div className="bg-gradient-to-b from-green-50 to-white dark:from-green-950 dark:to-background flex items-center justify-center p-4 py-8" dir="rtl">
      <Card className="w-full max-w-2xl shadow-xl h-[650px] flex flex-col">
        <CardHeader className="text-center space-y-4">
          <div className="text-6xl mb-4">🎉</div>
          <CardTitle className="text-3xl font-bold">מעולה!</CardTitle>
          <CardDescription className="text-xl">
            הכיתה <span className="font-bold text-green-600 dark:text-green-400">{step1Data.className}</span> מוכנה
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 text-center flex-1 flex flex-col justify-center">
          <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-xl p-6">
            <p className="text-lg font-semibold mb-2 text-foreground">📋 עכשיו נעבור לדשבורד</p>
            <p className="text-sm text-muted-foreground">
              שם תוכלו להשלים את הגדרת הכיתה בכמה צעדים קצרים
            </p>
          </div>

          <div className="flex items-center justify-center gap-2 text-muted-foreground">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
            <span>מעביר אתכם לדשבורד...</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
