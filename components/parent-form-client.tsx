"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CheckCircle, Loader2, AlertCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";

interface ParentFormClientProps {
  token: string;
}

interface FormData {
  name: string;
  birthday: string;
  address: string;
  parent1Name: string;
  parent1Phone: string;
  parent2Name: string;
  parent2Phone: string;
}

export function ParentFormClient({ token }: ParentFormClientProps) {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [className, setClassName] = useState("");
  const [schoolName, setSchoolName] = useState("");
  const [city, setCity] = useState("");
  const [classId, setClassId] = useState<string | null>(null);
  const [submittedChildName, setSubmittedChildName] = useState("");
  const [payboxLink, setPayboxLink] = useState<string | null>(null);

  const [formData, setFormData] = useState<FormData>({
    name: "",
    birthday: "",
    address: "",
    parent1Name: "",
    parent1Phone: "",
    parent2Name: "",
    parent2Phone: "",
  });

  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});

  useEffect(() => {
    loadClassData();
  }, [token]);

  const loadClassData = async () => {
    try {
      const supabase = createClient();

      // Get class by invite code
      const { data: classData, error: classError } = await supabase
        .from("classes")
        .select("id, name, school_name, city, paybox_link")
        .eq("invite_code", token)
        .single();

      if (classError || !classData) {
        setError("קישור לא תקין");
        setLoading(false);
        return;
      }

      setClassId(classData.id);
      setClassName(classData.name);
      setSchoolName(classData.school_name || "");
      setCity(classData.city || "");
      setPayboxLink(classData.paybox_link || null);
      setLoading(false);
    } catch (err) {
      console.error("Error loading class data:", err);
      setError("שגיאה בטעינת הנתונים");
      setLoading(false);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof FormData, string>> = {};

    if (!formData.name.trim()) {
      newErrors.name = "שם מלא הוא שדה חובה";
    }

    if (!formData.birthday) {
      newErrors.birthday = "תאריך לידה הוא שדה חובה";
    }

    if (!formData.parent1Name.trim()) {
      newErrors.parent1Name = "שם הורה 1 הוא שדה חובה";
    }

    if (!formData.parent1Phone.trim()) {
      newErrors.parent1Phone = "טלפון הורה 1 הוא שדה חובה";
    } else if (!/^0[0-9]{8,9}$/.test(formData.parent1Phone.replace(/[-\s]/g, ""))) {
      newErrors.parent1Phone = "מספר טלפון לא תקין";
    }

    if (formData.parent2Name.trim() && formData.parent2Phone.trim()) {
      if (!/^0[0-9]{8,9}$/.test(formData.parent2Phone.replace(/[-\s]/g, ""))) {
        newErrors.parent2Phone = "מספר טלפון לא תקין";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm() || !classId) {
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const supabase = createClient();
      const childName = formData.name.trim();
      let childId: string;

      // Check if child with this name already exists in the class
      const { data: existingChild } = await supabase
        .from("children")
        .select("id")
        .eq("class_id", classId)
        .ilike("name", childName)
        .single();

      if (existingChild) {
        // Update existing child
        childId = existingChild.id;
        const { error: updateError } = await supabase
          .from("children")
          .update({
            name: childName,
            birthday: formData.birthday || null,
            address: formData.address || null,
            updated_at: new Date().toISOString(),
          })
          .eq("id", childId);

        if (updateError) {
          console.error("Error updating child:", updateError);
          setError("שגיאה בשמירת הנתונים");
          setSubmitting(false);
          return;
        }
      } else {
        // Create new child
        const { data: newChild, error: insertError } = await supabase
          .from("children")
          .insert({
            class_id: classId,
            name: childName,
            birthday: formData.birthday || null,
            address: formData.address || null,
          })
          .select("id")
          .single();

        if (insertError || !newChild) {
          console.error("Error creating child:", insertError);
          setError("שגיאה בשמירת הנתונים");
          setSubmitting(false);
          return;
        }
        childId = newChild.id;
      }

      // Get existing parent links for this child
      const { data: existingLinks } = await supabase
        .from("child_parents")
        .select("id, parent_id, relationship")
        .eq("child_id", childId);

      // Handle Parent 1
      const existingParent1Link = existingLinks?.find(l => l.relationship === "parent1");
      const phone1Clean = formData.parent1Phone.replace(/[-\s]/g, "");

      if (formData.parent1Name && phone1Clean) {
        if (existingParent1Link) {
          await supabase
            .from("parents")
            .update({
              name: formData.parent1Name,
              phone: phone1Clean,
              updated_at: new Date().toISOString(),
            })
            .eq("id", existingParent1Link.parent_id);
        } else {
          const { data: newParent } = await supabase
            .from("parents")
            .insert({
              name: formData.parent1Name,
              phone: phone1Clean,
              class_id: classId,
            })
            .select("id")
            .single();

          if (newParent) {
            await supabase
              .from("child_parents")
              .insert({
                child_id: childId,
                parent_id: newParent.id,
                relationship: "parent1",
              });
          }
        }
      }

      // Handle Parent 2
      const existingParent2Link = existingLinks?.find(l => l.relationship === "parent2");
      const phone2Clean = formData.parent2Phone?.replace(/[-\s]/g, "") || "";

      if (formData.parent2Name && phone2Clean) {
        if (existingParent2Link) {
          await supabase
            .from("parents")
            .update({
              name: formData.parent2Name,
              phone: phone2Clean,
              updated_at: new Date().toISOString(),
            })
            .eq("id", existingParent2Link.parent_id);
        } else {
          const { data: newParent } = await supabase
            .from("parents")
            .insert({
              name: formData.parent2Name,
              phone: phone2Clean,
              class_id: classId,
            })
            .select("id")
            .single();

          if (newParent) {
            await supabase
              .from("child_parents")
              .insert({
                child_id: childId,
                parent_id: newParent.id,
                relationship: "parent2",
              });
          }
        }
      }

      setSubmittedChildName(childName);
      setSubmitted(true);
    } catch (err) {
      console.error("Error submitting form:", err);
      setError("שגיאה בשמירת הנתונים");
    } finally {
      setSubmitting(false);
    }
  };

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const handleFillAnother = () => {
    setSubmitted(false);
    setSubmittedChildName("");
    setFormData({
      name: "",
      birthday: "",
      address: "",
      parent1Name: "",
      parent1Phone: "",
      parent2Name: "",
      parent2Phone: "",
    });
    setErrors({});
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-surface">
        <SimpleHeader />
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="text-center space-y-4">
            <Loader2 className="h-12 w-12 animate-spin mx-auto text-brand" />
            <p className="text-muted-foreground">טוען...</p>
          </div>
        </div>
        <SimpleFooter />
      </div>
    );
  }

  // Error state (invalid token)
  if (error && !classId) {
    return (
      <div className="min-h-screen flex flex-col bg-surface">
        <SimpleHeader />
        <div className="flex-1 flex items-center justify-center p-6">
          <Card className="max-w-md w-full">
            <CardContent className="pt-6 text-center space-y-4">
              <AlertCircle className="h-16 w-16 text-red-500 mx-auto" />
              <h2 className="text-xl font-bold text-foreground">{error}</h2>
              <p className="text-muted-foreground">
                אנא פנו לנציג ועד ההורים לקבלת קישור חדש
              </p>
            </CardContent>
          </Card>
        </div>
        <SimpleFooter />
      </div>
    );
  }

  // Success state
  if (submitted) {
    return (
      <div className="min-h-screen flex flex-col bg-surface">
        <SimpleHeader />
        <div className="flex-1 flex items-center justify-center p-6">
          <Card className="max-w-md w-full">
            <CardContent className="pt-6 text-center space-y-4" dir="rtl">
              <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle className="h-12 w-12 text-green-600 dark:text-green-400" />
              </div>
              <h2 className="text-2xl font-bold text-foreground">תודה רבה!</h2>
              <p className="text-muted-foreground">
                הפרטים של {submittedChildName} נשמרו בהצלחה.
              </p>
              {payboxLink && (
                <p className="text-sm text-foreground font-medium">
                  כעת ניתן להמשיך לתשלום דמי ועד כיתה 👇
                </p>
              )}
              <div className="pt-4 space-y-3">
                {/* Paybox payment button - primary action */}
                {payboxLink && (
                  <Button
                    asChild
                    className="w-full bg-[#00B4E5] hover:bg-[#00A3D1] text-white py-6 text-lg"
                  >
                    <a href={payboxLink} target="_blank" rel="noopener noreferrer">
                      המשיכו לתשלום ב-PayBox
                    </a>
                  </Button>
                )}

                {/* Fill another child button - secondary action */}
                <Button
                  onClick={handleFillAnother}
                  variant={payboxLink ? "outline" : "default"}
                  className={payboxLink ? "w-full" : "w-full bg-brand hover:bg-brand-hover"}
                >
                  מילוי פרטים לילד/ה נוסף/ת
                </Button>

                <p className="text-xs text-muted-foreground">
                  *תוכלו לחזור לקישור זה בכל עת כדי לעדכן את הפרטים
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
        <SimpleFooter />
      </div>
    );
  }

  // Form state
  return (
    <div className="min-h-screen flex flex-col bg-surface">
      <SimpleHeader />
      <div className="flex-1 flex items-center justify-center p-4 md:p-6">
        <Card className="max-w-lg w-full">
          <CardHeader className="text-center" dir="rtl">
            <CardTitle className="text-2xl font-bold">
              מילוי פרטי ילד/ה
            </CardTitle>
            {className && (
              <p className="text-muted-foreground mt-2">
                כיתה: <span className="font-semibold">{className}</span>
                {schoolName && ` - ${schoolName}`}
                {city && `, ${city}`}
              </p>
            )}
          </CardHeader>

          <CardContent dir="rtl">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Child Details Section */}
              <div className="space-y-4">
                <h3 className="font-semibold text-lg border-b pb-2">פרטי הילד/ה</h3>

                <div className="space-y-2">
                  <Label htmlFor="name">שם מלא *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleInputChange("name", e.target.value)}
                    placeholder="הזינו שם מלא"
                    className={errors.name ? "border-red-500" : ""}
                  />
                  {errors.name && (
                    <p className="text-sm text-red-500">{errors.name}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="birthday">תאריך לידה *</Label>
                  <Input
                    id="birthday"
                    type="date"
                    value={formData.birthday}
                    onChange={(e) => handleInputChange("birthday", e.target.value)}
                    className={errors.birthday ? "border-red-500" : ""}
                  />
                  {errors.birthday && (
                    <p className="text-sm text-red-500">{errors.birthday}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address">כתובת</Label>
                  <Input
                    id="address"
                    value={formData.address}
                    onChange={(e) => handleInputChange("address", e.target.value)}
                    placeholder="רחוב, מספר, עיר"
                  />
                </div>
              </div>

              {/* Parent 1 Section */}
              <div className="space-y-4">
                <h3 className="font-semibold text-lg border-b pb-2">הורה 1 *</h3>

                <div className="space-y-2">
                  <Label htmlFor="parent1Name">שם מלא *</Label>
                  <Input
                    id="parent1Name"
                    value={formData.parent1Name}
                    onChange={(e) => handleInputChange("parent1Name", e.target.value)}
                    placeholder="שם ההורה"
                    className={errors.parent1Name ? "border-red-500" : ""}
                  />
                  {errors.parent1Name && (
                    <p className="text-sm text-red-500">{errors.parent1Name}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="parent1Phone">מספר טלפון *</Label>
                  <Input
                    id="parent1Phone"
                    type="tel"
                    value={formData.parent1Phone}
                    onChange={(e) => handleInputChange("parent1Phone", e.target.value)}
                    placeholder="050-1234567"
                    className={errors.parent1Phone ? "border-red-500" : ""}
                    dir="ltr"
                  />
                  {errors.parent1Phone && (
                    <p className="text-sm text-red-500">{errors.parent1Phone}</p>
                  )}
                </div>
              </div>

              {/* Parent 2 Section */}
              <div className="space-y-4">
                <h3 className="font-semibold text-lg border-b pb-2 text-muted-foreground">
                  הורה 2 (אופציונלי)
                </h3>

                <div className="space-y-2">
                  <Label htmlFor="parent2Name">שם מלא</Label>
                  <Input
                    id="parent2Name"
                    value={formData.parent2Name}
                    onChange={(e) => handleInputChange("parent2Name", e.target.value)}
                    placeholder="שם ההורה"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="parent2Phone">מספר טלפון</Label>
                  <Input
                    id="parent2Phone"
                    type="tel"
                    value={formData.parent2Phone}
                    onChange={(e) => handleInputChange("parent2Phone", e.target.value)}
                    placeholder="050-1234567"
                    className={errors.parent2Phone ? "border-red-500" : ""}
                    dir="ltr"
                  />
                  {errors.parent2Phone && (
                    <p className="text-sm text-red-500">{errors.parent2Phone}</p>
                  )}
                </div>
              </div>

              {/* Error message */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              )}

              {/* Submit button */}
              <Button
                type="submit"
                disabled={submitting}
                className="w-full bg-brand hover:bg-brand-hover text-white py-6 text-lg"
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin ml-2" />
                    שומר...
                  </>
                ) : (
                  "שמירת פרטים"
                )}
              </Button>

              <p className="text-xs text-muted-foreground text-center">
                * שדות חובה
              </p>
            </form>
          </CardContent>
        </Card>
      </div>
      <SimpleFooter />
    </div>
  );
}

// Simple header without auth button for public pages
function SimpleHeader() {
  return (
    <nav dir="rtl" className="w-full flex justify-center border-b-2 border-border bg-background/90 backdrop-blur-lg sticky top-0 z-50 shadow-sm">
      <div className="w-full max-w-7xl flex justify-center items-center py-4 px-4 md:px-6">
        <Link href="/" className="flex items-center gap-2 md:gap-3 group">
          <div className="relative">
            <div className="w-10 h-10 md:w-11 md:h-11 rounded-2xl bg-gradient-to-br from-[#A78BFA] to-[#60A5FA] flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform">
              <span className="text-xl md:text-2xl">✨</span>
            </div>
            <div className="absolute -bottom-1 -right-1 w-3 h-3 md:w-4 md:h-4 bg-accent-yellow rounded-full border-2 border-white"></div>
          </div>
          <div className="flex flex-col leading-tight">
            <span className="text-xl md:text-2xl font-extrabold text-foreground group-hover:text-brand transition-colors">ClassEase</span>
            <span className="text-xs font-semibold text-muted-foreground">ניהול ועד הורים חכם</span>
          </div>
        </Link>
      </div>
    </nav>
  );
}

function SimpleFooter() {
  return (
    <footer dir="rtl" className="py-6 px-4 text-center text-sm text-muted-foreground bg-background border-t-2 border-border">
      <p>ClassEase © 2025</p>
    </footer>
  );
}
