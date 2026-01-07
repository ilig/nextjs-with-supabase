"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Check, Copy, MessageCircle, Mail } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface InviteParentsTaskProps {
  classId: string;
  className: string;
  onComplete: () => void;
  onCancel: () => void;
}

export function InviteParentsTask({
  classId,
  className,
  onComplete,
  onCancel,
}: InviteParentsTaskProps) {
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

  const inviteUrl = `${window.location.origin}/join/${inviteCode}`;

  const inviteMessage = `היי! 👋

הצטרפו לניהול ועד ההורים של ${className} דרך הלינק:

${inviteUrl}

כך תוכלו:
✓ לקבל עדכונים בזמן אמת
✓ לעזור בניהול הועד
✓ לעקוב אחרי תשלומים

מחכים לכם! 🎉`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(inviteUrl);
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
    const subject = encodeURIComponent(`הזמנה להצטרפות לועד ההורים - ${className}`);
    const body = encodeURIComponent(inviteMessage);
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  };

  const handleComplete = async () => {
    try {
      // Update setup progress
      const storedProgress = localStorage.getItem(`setup_progress_${classId}`);
      const progress = storedProgress ? JSON.parse(storedProgress) : {};
      progress.completedTasks = progress.completedTasks || [];

      if (!progress.completedTasks.includes("invite_parents")) {
        progress.completedTasks.push("invite_parents");
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
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p className="text-sm text-muted-foreground mt-2">טוען...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 p-4" dir="rtl">
      <div className="text-center space-y-2">
        <h3 className="text-lg font-semibold">קישור ההזמנה שלכם</h3>
        <p className="text-sm text-muted-foreground">
          שלחו את הקישור הזה להורים המעוניינים להצטרף לועד
        </p>
      </div>

      {/* Invite URL Card */}
      <Card className="p-4 bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
        <div className="space-y-3">
          <div className="bg-card rounded p-3 border border-blue-300 dark:border-blue-700 font-mono text-sm break-all">
            {inviteUrl}
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
                📋 העתק קישור
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
            <MessageCircle className="h-5 w-5 text-green-600" />
            <span className="text-xs">WhatsApp</span>
          </Button>

          <Button
            onClick={handleEmailShare}
            variant="outline"
            className="flex flex-col h-auto py-3 gap-1"
          >
            <Mail className="h-5 w-5 text-blue-600" />
            <span className="text-xs">Email</span>
          </Button>
        </div>
      </div>

      {/* Message template */}
      <Card className="p-4 bg-muted">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-foreground">💡 טיפ: העתיקו את הטקסט הזה:</p>
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
      <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
        <p className="text-xs text-blue-700 dark:text-blue-300">
          💡 תוכלו לחזור לכאן בכל עת מלוח הבקרה
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
