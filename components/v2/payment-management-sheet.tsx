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
import { Switch } from "@/components/ui/switch";
import {
  Check,
  Send,
  Copy,
  MessageCircle,
  UserPlus,
  PartyPopper,
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
  amountPerChild: number;
  payboxLink?: string;
  inviteCode?: string;
  classDisplayName?: string;
  schoolName?: string;
  onSendReminder?: (childIds: string[]) => void;
  onMarkAsPaid?: (childId: string) => void;
  hideUnpaidList?: boolean;
  forceInviteMode?: boolean;
};

export function PaymentManagementSheet({
  open,
  onOpenChange,
  children,
  estimatedChildren,
  collected,
  total,
  amountPerChild,
  payboxLink,
  inviteCode,
  classDisplayName,
  schoolName,
  onMarkAsPaid,
  hideUnpaidList = false,
  forceInviteMode = false,
}: PaymentManagementSheetProps) {
  const [copiedMessage, setCopiedMessage] = useState(false);
  const [showInviteCard, setShowInviteCard] = useState(false);
  const [copiedInviteLink, setCopiedInviteLink] = useState(false);

  // Generate invite link
  const inviteLink = inviteCode
    ? `${typeof window !== "undefined" ? window.location.origin : ""}/join/${inviteCode}`
    : "";

  const unpaidChildren = children.filter((c) => c.payment_status === "unpaid");
  const registeredCount = children.length;
  const notRegisteredCount = Math.max(0, estimatedChildren - registeredCount);

  // Generate the reminder message
  const signature = classDisplayName && schoolName
    ? `ועד הורים ${classDisplayName} - ${schoolName}`
    : classDisplayName
      ? `ועד הורים ${classDisplayName}`
      : "ועד הורים";

  const reminderMessage = `היי! 👋

תזכורת ידידותית לתשלום דמי ועד כיתה.

💰 סכום: ₪${amountPerChild.toLocaleString()}
${payboxLink ? `🔗 לתשלום: ${payboxLink}` : ""}

🙏 תודה רבה!

${signature}`;

  const copyMessage = async () => {
    await navigator.clipboard.writeText(reminderMessage);
    setCopiedMessage(true);
    setTimeout(() => setCopiedMessage(false), 2000);
  };

  const shareViaWhatsApp = () => {
    window.open(`https://wa.me/?text=${encodeURIComponent(reminderMessage)}`, "_blank");
  };

  const copyInviteLink = async () => {
    if (inviteLink) {
      await navigator.clipboard.writeText(inviteLink);
      setCopiedInviteLink(true);
      setTimeout(() => setCopiedInviteLink(false), 2000);
    }
  };

  // Generate the invite message for parents who haven't registered
  const inviteMessage = `היי! 👋

אנא הירשמו ומלאו את פרטי ילדכם בקישור הבא, ולאחר מכן המשיכו לתשלום דמי ועד כיתה.

💰 סכום: ₪${amountPerChild.toLocaleString()}
🔗 להרשמה ותשלום: ${inviteLink}

🙏 תודה רבה!

${signature}`;

  const shareInviteViaWhatsApp = () => {
    window.open(`https://wa.me/?text=${encodeURIComponent(inviteMessage)}`, "_blank");
  };

  const copyInviteMessage = async () => {
    await navigator.clipboard.writeText(inviteMessage);
    setCopiedInviteLink(true);
    setTimeout(() => setCopiedInviteLink(false), 2000);
  };

  // Determine dialog mode
  const isFullyCollected = collected >= total && !forceInviteMode;
  const isAllRegisteredPaid = (unpaidChildren.length === 0 && !isFullyCollected) || forceInviteMode;
  const hasUnpaid = unpaidChildren.length > 0 && !forceInviteMode;

  // Dynamic header based on mode
  const getHeaderContent = () => {
    if (isFullyCollected) {
      return {
        icon: <PartyPopper className="h-5 w-5 text-success" />,
        title: "איסוף הושלם בהצלחה!",
        description: `נאספו ₪${collected.toLocaleString()} מתוך ₪${total.toLocaleString()}`,
      };
    }
    if (isAllRegisteredPaid) {
      return {
        icon: <UserPlus className="h-5 w-5 text-brand" />,
        title: "חסרים פרטים ותשלומים",
        description: `${notRegisteredCount} הורים טרם מילאו את פרטי ילדיהם ושילמו`,
      };
    }
    return {
      icon: <Send className="h-5 w-5 text-warning" />,
      title: "שליחת תזכורת תשלום",
      description: `שלחו תזכורת ל-${unpaidChildren.length} הורים שטרם שילמו`,
    };
  };

  const headerContent = getHeaderContent();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto" dir="rtl">
        <DialogHeader>
          <DialogTitle className="text-xl flex items-center gap-2">
            {headerContent.icon}
            {headerContent.title}
          </DialogTitle>
          <DialogDescription>
            {headerContent.description}
          </DialogDescription>
        </DialogHeader>

        {/* MODE: Full Collection Success */}
        {isFullyCollected && (
          <div className="text-center py-8 space-y-3">
            <div className="w-20 h-20 rounded-full bg-success/20 dark:bg-success/30 flex items-center justify-center mx-auto">
              <Check className="h-10 w-10 text-success" />
            </div>
            <p className="text-xl font-semibold text-foreground">כל ההורים שילמו! 🎉</p>
            <p className="text-sm text-muted-foreground">
              {registeredCount} ילדים נרשמו ושילמו
            </p>
          </div>
        )}

        {/* MODE: All Registered Paid - Focus on Inviting More */}
        {isAllRegisteredPaid && (
          <div className="space-y-4">
            {/* Progress indicator */}
            <div className="p-4 bg-brand/10 dark:bg-brand/20 rounded-xl border border-brand/20 dark:border-brand/30">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-foreground">התקדמות האיסוף</span>
                <span className="text-sm font-bold text-brand">
                  ₪{total.toLocaleString()} / ₪{collected.toLocaleString()} ({total > 0 ? Math.round((collected / total) * 100) : 0}%)
                </span>
              </div>
              <div className="w-full bg-brand/30 dark:bg-brand/40 rounded-full h-2.5">
                <div
                  className="bg-brand h-2.5 rounded-full transition-all"
                  style={{ width: `${Math.min(100, (collected / total) * 100)}%` }}
                />
              </div>
            </div>

            {/* Invite section - now the primary focus */}
            {inviteCode ? (
              <div className="space-y-3">
                <p className="text-sm font-medium text-foreground">
                  שלחו להורים קישור למילוי פרטים ותשלום:
                </p>
                <div className="bg-muted/50 rounded-xl p-4 border border-border">
                  <pre className="text-sm whitespace-pre-wrap font-sans text-foreground leading-relaxed">
                    {inviteMessage}
                  </pre>
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={shareInviteViaWhatsApp}
                    className="flex-1 gap-2 bg-success hover:bg-success/90 text-white"
                  >
                    <MessageCircle className="h-4 w-4" />
                    שלחו בוואטסאפ
                  </Button>
                  <Button
                    variant="outline"
                    onClick={copyInviteMessage}
                    className="gap-2"
                  >
                    {copiedInviteLink ? (
                      <>
                        <Check className="h-4 w-4 text-success" />
                        הועתק!
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4" />
                        העתיקו
                      </>
                    )}
                  </Button>
                </div>
              </div>
            ) : (
              <p className="text-sm text-center text-muted-foreground">
                ממתינים שהורים ימלאו פרטי ילדיהם
              </p>
            )}
          </div>
        )}

        {/* MODE: Has Unpaid Children - Payment Reminder */}
        {hasUnpaid && (
          <>
            {/* Message Preview */}
            <div className="space-y-3">
              <p className="text-sm font-medium text-foreground">תצוגה מקדימה של ההודעה:</p>
              <div className="bg-muted/50 rounded-xl p-4 border border-border">
                <pre className="text-sm whitespace-pre-wrap font-sans text-foreground leading-relaxed">
                  {reminderMessage}
                </pre>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
              <Button
                onClick={shareViaWhatsApp}
                className="flex-1 gap-2 bg-success hover:bg-success/90 text-white"
              >
                <MessageCircle className="h-4 w-4" />
                שלחו בוואטסאפ
              </Button>
              <Button
                variant="outline"
                onClick={copyMessage}
                className="gap-2"
              >
                {copiedMessage ? (
                  <>
                    <Check className="h-4 w-4 text-success" />
                    הועתק!
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4" />
                    העתיקו
                  </>
                )}
              </Button>
            </div>

            {/* Unpaid Parents List with Payment Toggle */}
            {!hideUnpaidList && (
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">
                  ממתינים לתשלום ({unpaidChildren.length}):
                </p>
                <div className="space-y-1.5 max-h-48 overflow-y-auto">
                  {unpaidChildren.map((child) => (
                    <div
                      key={child.id}
                      className="flex items-center py-2 px-3 rounded-xl bg-muted/30 border border-border"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground">{child.name}</p>
                        {child.parent_name && (
                          <p className="text-xs text-muted-foreground">
                            {child.parent_name}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mr-3">
                        <span className="text-xs text-muted-foreground">לא שולם</span>
                        <Switch
                          checked={false}
                          onCheckedChange={() => onMarkAsPaid?.(child.id)}
                          className="data-[state=checked]:bg-success"
                        />
                        <span className="text-xs text-success font-medium">שולם</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
