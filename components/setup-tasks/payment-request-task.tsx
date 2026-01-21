"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Check, Copy, MessageCircle, Mail, Link2, Lightbulb, AlertTriangle } from "lucide-react";

interface PaymentRequestTaskProps {
  classId: string;
  className: string;
  amountPerChild: number;
  onComplete: () => void;
  onCancel: () => void;
}

export function PaymentRequestTask({
  classId,
  className,
  amountPerChild,
  onComplete,
  onCancel,
}: PaymentRequestTaskProps) {
  const [payboxLink, setPayboxLink] = useState<string>("");
  const [copied, setCopied] = useState(false);

  const paymentMessage = `שלום הורים יקרים! 👋

אנחנו אוספים את כספי ועד ההורים לשנת הלימודים של ${className}.

💰 סכום לתשלום: ₪${amountPerChild}

לתשלום נוח ומאובטח דרך PayBox:
${payboxLink || "[הדביקו כאן את הלינק לPayBox]"}

תודה רבה על שיתוף הפעולה! 🙏`;

  const handleCopyMessage = async () => {
    try {
      await navigator.clipboard.writeText(paymentMessage);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Error copying:", error);
      alert("שגיאה בהעתקה");
    }
  };

  const handleWhatsAppShare = () => {
    const encodedMessage = encodeURIComponent(paymentMessage);
    window.open(`https://wa.me/?text=${encodedMessage}`, "_blank");
  };

  const handleEmailShare = () => {
    const subject = encodeURIComponent(`בקשת תשלום ועד הורים - ${className}`);
    const body = encodeURIComponent(paymentMessage);
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  };

  const handleComplete = async () => {
    try {
      // Update setup progress
      const storedProgress = localStorage.getItem(`setup_progress_${classId}`);
      const progress = storedProgress ? JSON.parse(storedProgress) : {};
      progress.completedTasks = progress.completedTasks || [];

      if (!progress.completedTasks.includes("request_payment")) {
        progress.completedTasks.push("request_payment");
      }

      // Store the paybox link for future use
      if (payboxLink) {
        progress.payboxLink = payboxLink;
      }

      localStorage.setItem(`setup_progress_${classId}`, JSON.stringify(progress));

      onComplete();
    } catch (error) {
      console.error("Error completing task:", error);
    }
  };

  return (
    <div className="space-y-4 p-4" dir="rtl">
      <div className="text-center space-y-2">
        <h3 className="text-lg font-semibold">שליחת בקשת תשלום להורים</h3>
        <p className="text-sm text-muted-foreground">
          שלחו להורים בקשה להעביר את התשלום דרך PayBox
        </p>
      </div>

      {/* Amount Display */}
      <Card className="p-4 bg-success/10 border-success/20">
        <div className="text-center">
          <p className="text-sm text-muted-foreground">סכום לגבייה מכל הורה:</p>
          <p className="text-3xl font-bold text-success">₪{amountPerChild}</p>
        </div>
      </Card>

      {/* PayBox Link Input */}
      <Card className="p-4 bg-brand/10 border-brand/20">
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Link2 className="h-5 w-5 text-brand" />
            <label className="text-sm font-semibold text-foreground">
              קישור לקבוצת PayBox שלכם:
            </label>
          </div>
          <Input
            value={payboxLink}
            onChange={(e) => setPayboxLink(e.target.value)}
            placeholder="https://payboxapp.page.link/..."
            className="text-left"
            dir="ltr"
          />
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <Lightbulb className="h-3 w-3 text-warning" /> היכנסו לאפליקציית PayBox ← בחרו את הקבוצה ← שתפו קישור
          </p>
        </div>
      </Card>

      {/* Share options */}
      <div className="space-y-3">
        <p className="text-sm font-semibold text-foreground">שלחו את ההודעה:</p>

        <div className="grid grid-cols-2 gap-2">
          <Button
            onClick={handleWhatsAppShare}
            variant="outline"
            className="flex flex-col h-auto py-3 gap-1"
            disabled={!payboxLink}
          >
            <MessageCircle className="h-5 w-5 text-success" />
            <span className="text-xs">WhatsApp</span>
          </Button>

          <Button
            onClick={handleEmailShare}
            variant="outline"
            className="flex flex-col h-auto py-3 gap-1"
            disabled={!payboxLink}
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
            <p className="text-sm font-semibold text-foreground flex items-center gap-1"><Lightbulb className="h-4 w-4 text-warning" /> תצוגה מקדימה של ההודעה:</p>
            <Button
              size="sm"
              variant="ghost"
              onClick={handleCopyMessage}
              disabled={!payboxLink}
            >
              <Copy className="h-3 w-3 ml-1" />
              {copied ? "הועתק!" : "העתק"}
            </Button>
          </div>
          <div className="bg-card rounded p-3 border border-border text-sm whitespace-pre-wrap">
            {paymentMessage}
          </div>
        </div>
      </Card>

      {!payboxLink && (
        <div className="bg-warning/10 border border-warning/20 rounded-xl p-3">
          <p className="text-xs text-warning flex items-center gap-1">
            <AlertTriangle className="h-3 w-3" /> הזינו את הקישור ל-PayBox כדי לשלוח את ההודעה
          </p>
        </div>
      )}

      <div className="flex gap-2 pt-4 border-t">
        <Button variant="ghost" onClick={onCancel} className="flex-1">
          אחר כך
        </Button>
        <Button onClick={handleComplete} className="flex-1" disabled={!payboxLink}>
          <Check className="h-4 w-4 ml-2" />
          סיימתי לשלוח
        </Button>
      </div>
    </div>
  );
}
