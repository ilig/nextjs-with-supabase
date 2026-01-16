"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Check,
  AlertCircle,
  Send,
  Copy,
  ExternalLink,
  Users,
  Phone,
  MessageCircle,
} from "lucide-react";

type Child = {
  id: string;
  name: string;
  payment_status: "paid" | "unpaid";
  payment_date?: string;
  parent_phone?: string;
  parent_name?: string;
};

type PaymentManagementSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: Child[];
  estimatedChildren: number;
  collected: number;
  total: number;
  payboxLink?: string;
  inviteCode?: string;
  classDisplayName?: string;
  schoolName?: string;
  onSendReminder?: (childIds: string[]) => void;
  onMarkAsPaid?: (childId: string) => void;
};

export function PaymentManagementSheet({
  open,
  onOpenChange,
  children,
  estimatedChildren,
  collected,
  total,
  payboxLink,
  inviteCode,
  classDisplayName,
  schoolName,
  onSendReminder,
  onMarkAsPaid,
}: PaymentManagementSheetProps) {
  const [selectedChildren, setSelectedChildren] = useState<string[]>([]);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedRegistrationLink, setCopiedRegistrationLink] = useState(false);

  // Generate registration link from invite code
  const registrationLink = inviteCode
    ? `${typeof window !== "undefined" ? window.location.origin : ""}/join/${inviteCode}`
    : "";

  const paidChildren = children.filter((c) => c.payment_status === "paid");
  const unpaidChildren = children.filter((c) => c.payment_status === "unpaid");
  const notRegisteredCount = Math.max(0, estimatedChildren - children.length);
  const collectionPercentage = total > 0 ? Math.round((collected / total) * 100) : 0;

  const toggleChildSelection = (childId: string) => {
    setSelectedChildren((prev) =>
      prev.includes(childId)
        ? prev.filter((id) => id !== childId)
        : [...prev, childId]
    );
  };

  const selectAllUnpaid = () => {
    setSelectedChildren(unpaidChildren.map((c) => c.id));
  };

  const handleSendReminders = () => {
    if (onSendReminder && selectedChildren.length > 0) {
      onSendReminder(selectedChildren);
      setSelectedChildren([]);
    }
  };

  const copyPayboxLink = async () => {
    if (payboxLink) {
      await navigator.clipboard.writeText(payboxLink);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  const copyRegistrationLink = async () => {
    if (registrationLink) {
      await navigator.clipboard.writeText(registrationLink);
      setCopiedRegistrationLink(true);
      setTimeout(() => setCopiedRegistrationLink(false), 2000);
    }
  };

  const shareViaWhatsApp = () => {
    if (registrationLink) {
      const signature = classDisplayName && schoolName
        ? `ועד הורים ${classDisplayName} - ${schoolName}`
        : classDisplayName
          ? `ועד הורים ${classDisplayName}`
          : "ועד הורים";

      let message = `היי! 👋

אנחנו מעדכנים את פרטי הילדים בכיתה.

אנא מלאו את הפרטים של ילדכם בקישור הבא:
${registrationLink}

הטופס כולל:
✓ פרטי הילד/ה (שם, תאריך לידה, כתובת)
✓ פרטי ההורים (שם וטלפון)`;

      if (payboxLink) {
        message += `
✓ תשלום דמי כיתה`;
      }

      message += `

🙏 תודה רבה!

${signature}`;

      window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, "_blank");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto" dir="rtl">
        <DialogHeader>
          <DialogTitle className="text-xl">ניהול תשלומים</DialogTitle>
          <DialogDescription>
            צפייה במצב התשלומים ושליחת תזכורות להורים
          </DialogDescription>
        </DialogHeader>

        {/* Collection Progress */}
        <div className="bg-muted/50 rounded-xl p-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">התקדמות גבייה</span>
            <span className="font-bold">{collectionPercentage}%</span>
          </div>
          <div className="h-2 bg-background rounded-full overflow-hidden">
            <div
              className="h-full bg-brand rounded-full transition-all duration-500"
              style={{ width: `${collectionPercentage}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>נאספו ₪{collected.toLocaleString()}</span>
            <span>מתוך ₪{total.toLocaleString()}</span>
          </div>
        </div>

        {/* Paybox Link Section */}
        {payboxLink && (
          <div className="bg-brand/10 rounded-xl p-4 space-y-3">
            <p className="text-sm font-medium text-foreground">קישור לתשלום בפייבוקס</p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="flex-1 gap-2"
                onClick={copyPayboxLink}
              >
                {copiedLink ? (
                  <>
                    <Check className="h-4 w-4 text-success" />
                    הועתק!
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4" />
                    העתק קישור
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={() => window.open(payboxLink, "_blank")}
              >
                <ExternalLink className="h-4 w-4" />
                פתח
              </Button>
            </div>
          </div>
        )}

        {/* Status Summary */}
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="bg-success/10 rounded-lg p-2 border border-success/20">
            <p className="text-lg font-bold text-success">{paidChildren.length}</p>
            <p className="text-xs text-muted-foreground">שילמו</p>
          </div>
          <div className="bg-warning/10 rounded-lg p-2 border border-warning/20">
            <p className="text-lg font-bold text-warning">{unpaidChildren.length}</p>
            <p className="text-xs text-muted-foreground">לא שילמו</p>
          </div>
          <div className="bg-muted rounded-lg p-2 border border-border">
            <p className="text-lg font-bold text-muted-foreground">{notRegisteredCount}</p>
            <p className="text-xs text-muted-foreground">לא נרשמו</p>
          </div>
        </div>

        {/* Unpaid Children List */}
        {unpaidChildren.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-foreground flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-warning" />
                ממתינים לתשלום ({unpaidChildren.length})
              </h4>
              <Button
                variant="ghost"
                size="sm"
                onClick={selectAllUnpaid}
                className="text-xs"
              >
                בחר הכל
              </Button>
            </div>

            <div className="space-y-2 max-h-40 overflow-y-auto">
              {unpaidChildren.map((child) => (
                <div
                  key={child.id}
                  onClick={() => toggleChildSelection(child.id)}
                  className={cn(
                    "flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-colors",
                    selectedChildren.includes(child.id)
                      ? "bg-brand/10 border-brand/30"
                      : "bg-muted/30 border-border hover:bg-muted/50"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        "w-5 h-5 rounded border-2 flex items-center justify-center transition-colors",
                        selectedChildren.includes(child.id)
                          ? "bg-brand border-brand"
                          : "border-muted-foreground"
                      )}
                    >
                      {selectedChildren.includes(child.id) && (
                        <Check className="h-3 w-3 text-white" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{child.name}</p>
                      {child.parent_name && (
                        <p className="text-xs text-muted-foreground">
                          הורה: {child.parent_name}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {child.parent_phone && (
                      <a
                        href={`tel:${child.parent_phone}`}
                        onClick={(e) => e.stopPropagation()}
                        className="p-1.5 hover:bg-muted rounded-lg transition-colors"
                      >
                        <Phone className="h-4 w-4 text-muted-foreground" />
                      </a>
                    )}
                    {onMarkAsPaid && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          onMarkAsPaid(child.id);
                        }}
                        className="text-xs text-success hover:text-success"
                      >
                        סמן כשולם
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Send Reminder Button */}
            {selectedChildren.length > 0 && onSendReminder && (
              <Button
                onClick={handleSendReminders}
                className="w-full gap-2 bg-brand hover:bg-brand/90"
              >
                <Send className="h-4 w-4" />
                שלח תזכורת ל-{selectedChildren.length} הורים
              </Button>
            )}
          </div>
        )}

        {/* Paid Children List */}
        {paidChildren.length > 0 && (
          <div className="space-y-3">
            <h4 className="font-medium text-foreground flex items-center gap-2">
              <Check className="h-4 w-4 text-success" />
              שילמו ({paidChildren.length})
            </h4>

            <div className="space-y-2 max-h-32 overflow-y-auto">
              {paidChildren.map((child) => (
                <div
                  key={child.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-success/5 border border-success/20"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded bg-success border-2 border-success flex items-center justify-center">
                      <Check className="h-3 w-3 text-white" />
                    </div>
                    <p className="font-medium text-foreground">{child.name}</p>
                  </div>
                  {child.payment_date && (
                    <p className="text-xs text-muted-foreground">
                      {new Date(child.payment_date).toLocaleDateString("he-IL")}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Not Registered Notice */}
        {notRegisteredCount > 0 && (
          <div className="flex items-start gap-2 p-3 bg-muted/50 rounded-xl border border-border">
            <Users className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-foreground">
                {notRegisteredCount} ילדים טרם נרשמו
              </p>
              <p className="text-xs text-muted-foreground">
                שתף את קישור ההרשמה עם ההורים שטרם מילאו את הטופס
              </p>
              {registrationLink && (
                <div className="flex gap-2 mt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2"
                    onClick={copyRegistrationLink}
                  >
                    {copiedRegistrationLink ? (
                      <>
                        <Check className="h-4 w-4 text-success" />
                        הועתק!
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4" />
                        העתק קישור
                      </>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2"
                    onClick={shareViaWhatsApp}
                  >
                    <MessageCircle className="h-4 w-4" />
                    WhatsApp
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
