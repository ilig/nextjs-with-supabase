"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Check, Copy, MessageCircle, Mail, Lightbulb } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface ParentFormLinksTaskProps {
  classId: string;
  className: string;
  onComplete: () => void;
  onCancel: () => void;
}

export function ParentFormLinksTask({
  classId,
  className,
  onComplete,
  onCancel,
}: ParentFormLinksTaskProps) {
  const [inviteCode, setInviteCode] = useState<string>("");
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchInviteCode();
  }, [classId]);

  const fetchInviteCode = async () => {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("classes")
        .select("invite_code")
        .eq("id", classId)
        .single();

      if (error) throw error;

      setInviteCode(data.invite_code || "");
    } catch (error) {
      console.error("Error fetching invite code:", error);
      alert("שגיאה בטעינת קוד ההזמנה");
    } finally {
      setLoading(false);
    }
  };

  const formUrl = `${window.location.origin}/parent-form/${inviteCode}`;

  const inviteMessage = `היי! 👋

אנחנו מעדכנים את פרטי הילדים בכיתה ${className}.

אנא מלאו את הפרטים של ילדכם בקישור הבא:
${formUrl}

הטופס כולל:
✓ פרטי הילד/ה (שם, תאריך לידה, כתובת)
✓ פרטי ההורים (שם וטלפון)

תודה רבה! 🙏`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(formUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Error copying:", error);
      alert("שגיאה בהעתקה");
    }
  };

  const handleCopyMessage = async () => {
    try {
      await navigator.clipboard.writeText(inviteMessage);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Error copying:", error);
      alert("שגיאה בהעתקה");
    }
  };

  const handleWhatsAppShare = () => {
    const encodedMessage = encodeURIComponent(inviteMessage);
    window.open(`https://wa.me/?text=${encodedMessage}`, "_blank");
  };

  const handleEmailShare = () => {
    const subject = encodeURIComponent(`מילוי פרטי ילדים - ${className}`);
    const body = encodeURIComponent(inviteMessage);
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  };

  const handleComplete = async () => {
    try {
      const storedProgress = localStorage.getItem(`setup_progress_${classId}`);
      const progress = storedProgress ? JSON.parse(storedProgress) : {};
      progress.completedTasks = progress.completedTasks || [];

      if (!progress.completedTasks.includes("parent_form_links")) {
        progress.completedTasks.push("parent_form_links");
      }

      localStorage.setItem(`setup_progress_${classId}`, JSON.stringify(progress));

      onComplete();
    } catch (error) {
      console.error("Error completing task:", error);
    }
  };

  if (loading) {
    return (
      <div className="p-4 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand mx-auto"></div>
        <p className="text-sm text-muted-foreground mt-2">טוען...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 p-4" dir="rtl">
      <div className="text-center space-y-2">
        <h3 className="text-lg font-semibold">קישור למילוי פרטי ילדים</h3>
        <p className="text-sm text-muted-foreground">
          שלחו את הקישור הזה להורים כדי שימלאו את פרטי ילדיהם
        </p>
      </div>

      {/* Form URL Card */}
      <Card className="p-4 bg-brand/10 border-brand/20">
        <div className="space-y-3">
          <div className="bg-card rounded-xl p-3 border border-brand/30 font-mono text-sm break-all">
            {formUrl}
          </div>
          <Button
            onClick={handleCopy}
            variant={copied ? "default" : "outline"}
            className="w-full"
          >
            {copied ? (
              <>
                <Check className="h-4 w-4 ml-2" />
                הועתק!
              </>
            ) : (
              <>
                <Copy className="h-4 w-4 ml-2" />
                העתק קישור
              </>
            )}
          </Button>
        </div>
      </Card>

      {/* Share options */}
      <div className="space-y-3">
        <p className="text-sm font-semibold text-foreground">או שלח ישירות:</p>

        <div className="grid grid-cols-2 gap-2">
          <Button
            onClick={handleWhatsAppShare}
            variant="outline"
            className="flex flex-col h-auto py-3 gap-1"
          >
            <MessageCircle className="h-5 w-5 text-success" />
            <span className="text-xs">WhatsApp</span>
          </Button>

          <Button
            onClick={handleEmailShare}
            variant="outline"
            className="flex flex-col h-auto py-3 gap-1"
          >
            <Mail className="h-5 w-5 text-brand" />
            <span className="text-xs">Email</span>
          </Button>
        </div>
      </div>

      {/* Message template */}
      <Card className="p-4 bg-muted">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-foreground flex items-center gap-1"><Lightbulb className="h-4 w-4 text-warning" /> טיפ: העתיקו את הטקסט הזה:</p>
            <Button
              size="sm"
              variant="ghost"
              onClick={handleCopyMessage}
            >
              <Copy className="h-3 w-3 ml-1" />
              העתק
            </Button>
          </div>
          <div className="bg-card rounded p-3 border border-border text-sm whitespace-pre-wrap">
            {inviteMessage}
          </div>
        </div>
      </Card>

      {/* Info box */}
      <div className="bg-brand/10 border border-brand/20 rounded-xl p-3">
        <p className="text-xs text-brand flex items-center gap-1">
          <Lightbulb className="h-3 w-3" /> ההורים יבחרו את ילדם מהרשימה וימלאו את הפרטים. תוכלו לחזור לכאן בכל עת מלוח הבקרה.
        </p>
      </div>

      <div className="flex gap-2 pt-4 border-t">
        <Button variant="ghost" onClick={onCancel} className="flex-1">
          אחר כך
        </Button>
        <Button onClick={handleComplete} className="flex-1">
          <Check className="h-4 w-4 ml-2" />
          סיימתי לשלוח
        </Button>
      </div>
    </div>
  );
}
