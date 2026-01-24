"use client";

import { useState, useCallback } from "react";
import {
  UserPlus,
  Copy,
  Share2,
  X,
  Link,
  ExternalLink,
  HelpCircle,
  CheckCircle2,
  Loader2,
  Mail,
  MessageCircle,
  ChevronDown,
  Users,
  Check,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

type SetupBannersProps = {
  payboxLink?: string;
  inviteCode?: string;
  childrenCount: number;
  staffCount: number;
  expectedChildren: number;
  expectedStaff: number;
  paymentLinkSent?: boolean;
  onSavePayboxLink?: (link: string) => Promise<boolean>;
  onPaymentLinkSent?: () => Promise<boolean>;
  onManageContacts?: () => void;
  onAddStaff?: () => void;
  className?: string;
  classDisplayName?: string;
  schoolName?: string;
};

type SectionType = "payment" | "contacts" | "staff";
type ShareMode = "info-only" | "with-payment";

export function SetupBanners({
  payboxLink,
  inviteCode,
  childrenCount,
  staffCount,
  expectedChildren,
  expectedStaff,
  paymentLinkSent = false,
  onSavePayboxLink,
  onPaymentLinkSent,
  onManageContacts,
  onAddStaff,
  className,
  classDisplayName,
  schoolName,
}: SetupBannersProps) {
  // Track dismissed sections
  const [dismissed, setDismissed] = useState<Set<SectionType>>(new Set());
  const [copiedLink, setCopiedLink] = useState(false);

  // Track expanded/collapsed state for accordion - null means none expanded
  const [expandedSection, setExpandedSection] = useState<SectionType | null>(null);

  // Paybox dialog state
  const [payboxDialogOpen, setPayboxDialogOpen] = useState(false);
  const [payboxInputValue, setPayboxInputValue] = useState("");
  const [payboxSaving, setPayboxSaving] = useState(false);
  const [payboxError, setPayboxError] = useState<string | null>(null);
  const [openShareAfterPaybox, setOpenShareAfterPaybox] = useState(false);

  // Share dialog state
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [shareMode, setShareMode] = useState<ShareMode>("info-only");
  const [copiedMessage, setCopiedMessage] = useState(false);

  const handleDismiss = useCallback((type: SectionType) => {
    setDismissed(prev => new Set(prev).add(type));
  }, []);

  // Section completion states
  const isPaymentComplete = paymentLinkSent;
  const isContactsComplete = childrenCount >= expectedChildren && expectedChildren > 0;
  const isStaffComplete = staffCount >= expectedStaff && expectedStaff > 0;

  // Generate registration link from invite code
  const registrationLink = inviteCode
    ? `${typeof window !== "undefined" ? window.location.origin : ""}/join/${inviteCode}`
    : "";

  // Generate suggested message for parents
  const getSuggestedMessage = useCallback((includePayment: boolean) => {
    const signature = classDisplayName && schoolName
      ? `ועד הורים ${classDisplayName} - ${schoolName}`
      : classDisplayName
        ? `ועד הורים ${classDisplayName}`
        : "ועד הורים";

    if (includePayment && payboxLink) {
      return `היי! 👋

אנחנו אוספים את דמי ועד ההורים לשנה זו.

אנא מלאו את הפרטים של ילדכם בקישור הבא:
${registrationLink}

הטופס כולל:
✓ פרטי הילד/ה (שם, תאריך לידה, כתובת)
✓ פרטי ההורים (שם וטלפון)
✓ תשלום דמי כיתה דרך PayBox

🙏 תודה רבה!

${signature}`;
    }

    return `היי! 👋

אנחנו מעדכנים את פרטי הילדים בכיתה.

אנא מלאו את הפרטים של ילדכם בקישור הבא:
${registrationLink}

הטופס כולל:
✓ פרטי הילד/ה (שם, תאריך לידה, כתובת)
✓ פרטי ההורים (שם וטלפון)

🙏 תודה רבה!

${signature}`;
  }, [registrationLink, payboxLink, classDisplayName, schoolName]);

  const handleCopyLink = useCallback(async () => {
    if (!registrationLink) return;

    try {
      await navigator.clipboard.writeText(registrationLink);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    } catch {
      // Fallback for older browsers
      const textArea = document.createElement("textarea");
      textArea.value = registrationLink;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  }, [registrationLink]);

  const handleCopyMessage = useCallback(async () => {
    const includePayment = shareMode === "with-payment";
    const message = getSuggestedMessage(includePayment);
    try {
      await navigator.clipboard.writeText(message);
      setCopiedMessage(true);
      setTimeout(() => setCopiedMessage(false), 2000);
    } catch {
      // Fallback for older browsers
      const textArea = document.createElement("textarea");
      textArea.value = message;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      setCopiedMessage(true);
      setTimeout(() => setCopiedMessage(false), 2000);
    }
  }, [getSuggestedMessage, shareMode]);

  const handleEmailShare = useCallback(() => {
    const includePayment = shareMode === "with-payment";
    const subject = encodeURIComponent("מילוי פרטי ילדים לכיתה");
    const body = encodeURIComponent(getSuggestedMessage(includePayment));
    window.open(`mailto:?subject=${subject}&body=${body}`, "_blank");
  }, [getSuggestedMessage, shareMode]);

  const handleWhatsAppShare = useCallback(() => {
    const includePayment = shareMode === "with-payment";
    const text = encodeURIComponent(getSuggestedMessage(includePayment));
    window.open(`https://wa.me/?text=${text}`, "_blank");
  }, [getSuggestedMessage, shareMode]);

  // Validate paybox link format
  const isValidPayboxLink = useCallback((url: string): boolean => {
    if (!url.trim()) return false;
    try {
      const parsed = new URL(url);
      // Accept payboxapp.com, paybox.co.il, or any URL (for flexibility)
      return parsed.protocol === "https:" || parsed.protocol === "http:";
    } catch {
      return false;
    }
  }, []);

  // Handle saving paybox link
  const handleSavePaybox = useCallback(async () => {
    const trimmedValue = payboxInputValue.trim();

    if (!trimmedValue) {
      setPayboxError("יש להזין קישור");
      return;
    }

    if (!isValidPayboxLink(trimmedValue)) {
      setPayboxError("הקישור אינו תקין. יש להזין כתובת URL מלאה");
      return;
    }

    setPayboxError(null);
    setPayboxSaving(true);

    try {
      const success = await onSavePayboxLink?.(trimmedValue);
      if (success) {
        setPayboxDialogOpen(false);
        setPayboxInputValue("");
        // If user came from "with payment" flow, open share dialog
        if (openShareAfterPaybox) {
          setOpenShareAfterPaybox(false);
          setShareDialogOpen(true);
        }
      } else {
        setPayboxError("שגיאה בשמירת הקישור. נסו שוב.");
      }
    } catch {
      setPayboxError("שגיאה בשמירת הקישור. נסו שוב.");
    } finally {
      setPayboxSaving(false);
    }
  }, [payboxInputValue, isValidPayboxLink, onSavePayboxLink, openShareAfterPaybox]);

  // Determine which sections to show (show unless dismissed AND completed)
  const showPaymentSection = !dismissed.has("payment") || !isPaymentComplete;
  const showContactsSection = !dismissed.has("contacts") || !isContactsComplete;
  const showStaffSection = !dismissed.has("staff") || !isStaffComplete;

  // Check if payment is set up for conditional messaging
  const hasPaymentSetup = !!payboxLink;

  // Calculate section numbers (always 1, 2, 3 in order)
  const getSectionNumber = (type: SectionType) => {
    if (type === "payment") return 1;
    if (type === "contacts") return 2;
    if (type === "staff") return 3;
    return 0;
  };

  // Count remaining incomplete sections
  const incompleteSections = [
    !isPaymentComplete && showPaymentSection,
    !isContactsComplete && showContactsSection,
    !isStaffComplete && showStaffSection,
  ].filter(Boolean).length;

  // No sections to show
  if (!showPaymentSection && !showContactsSection && !showStaffSection) {
    return null;
  }

  // Handle info-only share click (for contacts section)
  const handleInfoOnlyShare = () => {
    setShareMode("info-only");
    setShareDialogOpen(true);
  };

  // Handle with-payment share click (for payment section)
  const handleWithPaymentShare = () => {
    setShareMode("with-payment");
    if (hasPaymentSetup) {
      // Paybox already configured, go straight to share
      setShareDialogOpen(true);
    } else {
      // Need to set up paybox first
      setOpenShareAfterPaybox(true);
      setPayboxDialogOpen(true);
    }
  };

  // Handle marking payment link as sent
  const handlePaymentLinkSent = async () => {
    await onPaymentLinkSent?.();
    setShareDialogOpen(false);
  };

  return (
    <div className={cn("space-y-2", className)}>
      {/* Section Header */}
      <div className="flex items-center flex-wrap gap-2 mb-1">
        <h2 className="text-2xl font-bold text-foreground">השלימו את הגדרת הכיתה</h2>
        {incompleteSections > 0 && (
          <span className="text-sm text-muted-foreground whitespace-nowrap flex-shrink-0">({incompleteSections} שלבים נותרו)</span>
        )}
      </div>

      {/* Section 1: Payment Collection */}
      {showPaymentSection && (
        <div className={cn(
          "rounded-xl border overflow-hidden",
          isPaymentComplete
            ? "bg-success/10 dark:bg-success/20 border-success/30 dark:border-success/40"
            : "bg-brand/5 dark:bg-brand/10 border-brand/20 dark:border-brand/30"
        )}>
          {/* Collapsible Header */}
          <div className="flex items-center gap-3 p-4">
            {/* Clickable expand area */}
            <div
              role="button"
              tabIndex={0}
              onClick={() => setExpandedSection(expandedSection === "payment" ? null : "payment")}
              onKeyDown={(e) => e.key === "Enter" && setExpandedSection(expandedSection === "payment" ? null : "payment")}
              className={cn(
                "flex-1 flex items-center gap-3 cursor-pointer transition-colors rounded-xl -m-2 p-2",
                isPaymentComplete
                  ? "hover:bg-success/20 dark:hover:bg-success/30"
                  : "hover:bg-brand/10 dark:hover:bg-brand/20"
              )}
            >
              {/* Step number or checkmark */}
              <div className={cn(
                "w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0",
                isPaymentComplete
                  ? "bg-success/20 dark:bg-success/30"
                  : "bg-brand/20 dark:bg-brand/30"
              )}>
                {isPaymentComplete ? (
                  <Check className="h-3.5 w-3.5 text-success" />
                ) : (
                  <span className="text-xs font-bold text-brand">{getSectionNumber("payment")}</span>
                )}
              </div>

              <div className="flex-1 text-right">
                <h3 className={cn(
                  "font-semibold text-sm",
                  isPaymentComplete ? "text-muted-foreground" : "text-foreground"
                )}>
                  גביית תשלום מההורים
                </h3>
              </div>

              {/* Expand/Collapse indicator */}
              <ChevronDown
                className={cn(
                  "h-5 w-5 text-muted-foreground transition-transform duration-200",
                  expandedSection === "payment" && "rotate-180"
                )}
              />
            </div>

            {/* Dismiss button - outside the clickable area */}
            <button
              onClick={() => handleDismiss("payment")}
              className={cn(
                "p-1 rounded-xl transition-colors flex-shrink-0",
                isPaymentComplete
                  ? "hover:bg-success/30 dark:hover:bg-success/40"
                  : "hover:bg-brand/20 dark:hover:bg-brand/30"
              )}
              aria-label="סגור התראה"
            >
              <X className="h-4 w-4 text-muted-foreground" />
            </button>
          </div>

          {/* Collapsible Content */}
          <div
            className={cn(
              "grid transition-all duration-200 ease-in-out",
              expandedSection === "payment" ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
            )}
          >
            <div className="overflow-hidden">
              <div className="px-4 pb-4 pt-0">
                <p className="text-xs text-muted-foreground mb-3 mr-9">
                  שליחת קישור להורים למילוי פרטי ילדים ופרטי קשר, ולביצוע תשלום דרך PayBox
                </p>

                {/* PayBox setup card */}
                <div className="bg-card rounded-xl p-3 border border-border hover:border-brand/50 transition-colors flex flex-col mr-9">
                  {!hasPaymentSetup && (
                    <p className="text-xs text-brand mb-2 flex items-center gap-1">
                      <AlertCircle className="h-4 w-4 flex-shrink-0" />
                      <span>יש ליצור קבוצת PayBox ולהזין את הקישור לתשלום</span>
                    </p>
                  )}
                  <button
                    onClick={handleWithPaymentShare}
                    className="w-full inline-flex items-center justify-center gap-1.5 bg-brand text-white rounded-xl py-2.5 px-3 text-sm font-medium hover:bg-brand/90 transition-colors"
                  >
                    {hasPaymentSetup ? (
                      <>
                        <Share2 className="h-4 w-4" />
                        <span>שליחת קישור לתשלום</span>
                      </>
                    ) : (
                      <>
                        <Link className="h-4 w-4" />
                        <span>הגדרת קישור PayBox</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Section 2: Manage Kids & Parents */}
      {showContactsSection && (
        <div className={cn(
          "rounded-xl border overflow-hidden",
          isContactsComplete
            ? "bg-success/10 dark:bg-success/20 border-success/30 dark:border-success/40"
            : "bg-brand/5 dark:bg-brand/10 border-brand/20 dark:border-brand/30"
        )}>
          {/* Collapsible Header */}
          <div className="flex items-center gap-3 p-4">
            {/* Clickable expand area */}
            <div
              role="button"
              tabIndex={0}
              onClick={() => setExpandedSection(expandedSection === "contacts" ? null : "contacts")}
              onKeyDown={(e) => e.key === "Enter" && setExpandedSection(expandedSection === "contacts" ? null : "contacts")}
              className={cn(
                "flex-1 flex items-center gap-3 cursor-pointer transition-colors rounded-xl -m-2 p-2",
                isContactsComplete
                  ? "hover:bg-success/20 dark:hover:bg-success/30"
                  : "hover:bg-brand/10 dark:hover:bg-brand/20"
              )}
            >
              {/* Step number or checkmark */}
              <div className={cn(
                "w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0",
                isContactsComplete
                  ? "bg-success/20 dark:bg-success/30"
                  : "bg-brand/20 dark:bg-brand/30"
              )}>
                {isContactsComplete ? (
                  <Check className="h-3.5 w-3.5 text-success" />
                ) : (
                  <span className="text-xs font-bold text-brand">{getSectionNumber("contacts")}</span>
                )}
              </div>

              <div className="flex-1 text-right">
                <h3 className={cn(
                  "font-semibold text-sm",
                  isContactsComplete ? "text-muted-foreground" : "text-foreground"
                )}>
                  יצירת דף קשר
                </h3>
              </div>

              {/* Progress indicator */}
              {expectedChildren > 0 && (
                <span className={cn(
                  "text-xs",
                  isContactsComplete ? "text-success" : "text-muted-foreground"
                )}>
                  נוספו {childrenCount}/{expectedChildren}
                </span>
              )}

              {/* Expand/Collapse indicator */}
              <ChevronDown
                className={cn(
                  "h-5 w-5 text-muted-foreground transition-transform duration-200",
                  expandedSection === "contacts" && "rotate-180"
                )}
              />
            </div>

            {/* Dismiss button - outside the clickable area */}
            <button
              onClick={() => handleDismiss("contacts")}
              className={cn(
                "p-1 rounded-xl transition-colors flex-shrink-0",
                isContactsComplete
                  ? "hover:bg-success/30 dark:hover:bg-success/40"
                  : "hover:bg-brand/20 dark:hover:bg-brand/30"
              )}
              aria-label="סגור התראה"
            >
              <X className="h-4 w-4 text-muted-foreground" />
            </button>
          </div>

          {/* Collapsible Content */}
          <div
            className={cn(
              "grid transition-all duration-200 ease-in-out",
              expandedSection === "contacts" ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
            )}
          >
            <div className="overflow-hidden">
              <div className="px-4 pb-4 pt-0">
                <p className="text-xs text-muted-foreground mb-3 mr-9">
                  איסוף פרטי ילדים והורים באמצעות שליחת קישור להורים או הזנה ידנית, למעקב אחר תשלומים וימי הולדת
                </p>

                {/* Two option cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mr-9">
                  {/* Option 1: Send link (info only) */}
                  <div className="bg-card rounded-xl p-3 border border-border hover:border-brand/50 transition-colors flex flex-col">
                    <div className="flex items-center gap-2 mb-2">
                      <Share2 className="h-4 w-4 text-brand" />
                      <span className="font-medium text-sm">קישור להורים</span>
                    </div>
                    <p className="text-xs text-muted-foreground mb-2 flex-1">
                      שליחת קישור להורים למילוי פרטים (ללא בקשת תשלום)
                    </p>
                    <button
                      onClick={handleInfoOnlyShare}
                      className="w-full inline-flex items-center justify-center gap-1.5 bg-brand text-white rounded-xl py-2.5 px-3 text-sm font-medium hover:bg-brand/90 transition-colors mt-auto"
                    >
                      <Share2 className="h-4 w-4" />
                      <span>שליחת קישור</span>
                    </button>
                  </div>

                  {/* Option 2: Manual entry */}
                  <div className="bg-card rounded-xl p-3 border border-border hover:border-brand/50 transition-colors flex flex-col">
                    <div className="flex items-center gap-2 mb-2">
                      <UserPlus className="h-4 w-4 text-brand" />
                      <span className="font-medium text-sm">הוספה ידנית</span>
                    </div>
                    <p className="text-xs text-muted-foreground mb-2 flex-1">
                      הוספת פרטי ילדים והורים ישירות למערכת
                    </p>
                    <button
                      onClick={() => onManageContacts?.()}
                      className="w-full inline-flex items-center justify-center gap-1.5 bg-brand text-white rounded-xl py-2.5 px-3 text-sm font-medium hover:bg-brand/90 transition-colors mt-auto"
                    >
                      <UserPlus className="h-4 w-4" />
                      <span>הוספת פרטים</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Section 3: Add Staff */}
      {showStaffSection && (
        <div className={cn(
          "rounded-xl border overflow-hidden",
          isStaffComplete
            ? "bg-success/10 dark:bg-success/20 border-success/30 dark:border-success/40"
            : "bg-brand/5 dark:bg-brand/10 border-brand/20 dark:border-brand/30"
        )}>
          {/* Collapsible Header */}
          <div className="flex items-center gap-3 p-4">
            {/* Clickable expand area */}
            <div
              role="button"
              tabIndex={0}
              onClick={() => setExpandedSection(expandedSection === "staff" ? null : "staff")}
              onKeyDown={(e) => e.key === "Enter" && setExpandedSection(expandedSection === "staff" ? null : "staff")}
              className={cn(
                "flex-1 flex items-center gap-3 cursor-pointer transition-colors rounded-xl -m-2 p-2",
                isStaffComplete
                  ? "hover:bg-success/20 dark:hover:bg-success/30"
                  : "hover:bg-brand/10 dark:hover:bg-brand/20"
              )}
            >
              {/* Step number or checkmark */}
              <div className={cn(
                "w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0",
                isStaffComplete
                  ? "bg-success/20 dark:bg-success/30"
                  : "bg-brand/20 dark:bg-brand/30"
              )}>
                {isStaffComplete ? (
                  <Check className="h-3.5 w-3.5 text-success" />
                ) : (
                  <span className="text-xs font-bold text-brand">{getSectionNumber("staff")}</span>
                )}
              </div>

              <div className="flex-1 text-right">
                <h3 className={cn(
                  "font-semibold text-sm",
                  isStaffComplete ? "text-muted-foreground" : "text-foreground"
                )}>
                  הוספת אנשי צוות
                </h3>
              </div>

              {/* Progress indicator */}
              {expectedStaff > 0 && (
                <span className={cn(
                  "text-xs",
                  isStaffComplete ? "text-success" : "text-muted-foreground"
                )}>
                  נוספו {staffCount}/{expectedStaff}
                </span>
              )}

              {/* Expand/Collapse indicator */}
              <ChevronDown
                className={cn(
                  "h-5 w-5 text-muted-foreground transition-transform duration-200",
                  expandedSection === "staff" && "rotate-180"
                )}
              />
            </div>

            {/* Dismiss button - outside the clickable area */}
            <button
              onClick={() => handleDismiss("staff")}
              className={cn(
                "p-1 rounded-xl transition-colors flex-shrink-0",
                isStaffComplete
                  ? "hover:bg-success/30 dark:hover:bg-success/40"
                  : "hover:bg-brand/20 dark:hover:bg-brand/30"
              )}
              aria-label="סגור התראה"
            >
              <X className="h-4 w-4 text-muted-foreground" />
            </button>
          </div>

          {/* Collapsible Content */}
          <div
            className={cn(
              "grid transition-all duration-200 ease-in-out",
              expandedSection === "staff" ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
            )}
          >
            <div className="overflow-hidden">
              <div className="px-4 pb-4 pt-0">
                <p className="text-xs text-muted-foreground mb-3 mr-9">
                  הוספה ידנית של מורות / גננות ואנשי צוות דרך המערכת
                </p>

                {/* Single card for staff add */}
                <div className="bg-card rounded-xl p-3 border border-border hover:border-brand/50 transition-colors flex flex-col mr-9">
                  <button
                    onClick={() => onAddStaff?.()}
                    className="w-full inline-flex items-center justify-center gap-1.5 bg-brand text-white rounded-xl py-2.5 px-3 text-sm font-medium hover:bg-brand/90 transition-colors"
                  >
                    <UserPlus className="h-4 w-4" />
                    <span>הוספת אנשי צוות</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Paybox Link Dialog */}
      <Dialog open={payboxDialogOpen} onOpenChange={setPayboxDialogOpen}>
        <DialogContent className="sm:max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3 text-right">
              <div className="p-2 rounded-xl bg-muted">
                <Link className="h-5 w-5 text-brand" />
              </div>
              הגדרת קישור תשלום
            </DialogTitle>
            <DialogDescription className="text-right">
              הוסף קישור לתשלום כדי שהורים יוכלו לשלם בקלות
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Guidance section */}
            <div className="bg-muted/50 rounded-xl p-4 space-y-3">
              <div className="flex items-start gap-2">
                <HelpCircle className="h-5 w-5 text-brand flex-shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-foreground mb-2">איך להשיג קישור תשלום?</p>
                  <ol className="space-y-2 text-muted-foreground list-decimal list-inside">
                    <li>
                      היכנסו ל-
                      <a
                        href="https://www.payboxapp.com"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-brand hover:underline inline-flex items-center gap-1"
                      >
                        Paybox
                        <ExternalLink className="h-3 w-3" />
                      </a>
                      {" "}או אפליקציית תשלום אחרת
                    </li>
                    <li>צרו קישור לגביית תשלום עבור הכיתה</li>
                    <li>העתיקו את הקישור והדביקו אותו כאן</li>
                  </ol>
                </div>
              </div>
            </div>

            {/* Input field */}
            <div className="space-y-2">
              <label htmlFor="paybox-link" className="text-sm font-medium text-foreground">
                קישור לתשלום
              </label>
              <Input
                id="paybox-link"
                type="url"
                dir="ltr"
                placeholder="https://payboxapp.page.link/..."
                value={payboxInputValue}
                onChange={(e) => {
                  setPayboxInputValue(e.target.value);
                  setPayboxError(null);
                }}
                className={cn(
                  "text-left",
                  payboxError && "border-destructive focus-visible:ring-destructive"
                )}
              />
              {payboxError && (
                <p className="text-sm text-destructive">{payboxError}</p>
              )}
            </div>

            {/* Success indicator for valid link */}
            {payboxInputValue && isValidPayboxLink(payboxInputValue) && !payboxError && (
              <div className="flex items-center gap-2 text-sm text-success">
                <CheckCircle2 className="h-4 w-4" />
                <span>הקישור נראה תקין</span>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <Button
              onClick={handleSavePaybox}
              disabled={payboxSaving || !payboxInputValue.trim()}
              className="flex-1 bg-brand text-white hover:bg-brand/90"
            >
              {payboxSaving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin ml-2" />
                  שומר...
                </>
              ) : (
                "שמירת קישור"
              )}
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setPayboxDialogOpen(false);
                setPayboxInputValue("");
                setPayboxError(null);
              }}
            >
              ביטול
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Share Link Dialog */}
      <Dialog open={shareDialogOpen} onOpenChange={setShareDialogOpen}>
        <DialogContent className="sm:max-w-md max-h-[80vh] max-h-[80dvh] overflow-y-auto" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-right flex items-center gap-3">
              <div className="p-2 rounded-xl bg-muted">
                <Share2 className="h-5 w-5 text-brand" />
              </div>
              קישור למילוי פרטי ילדים
            </DialogTitle>
            <DialogDescription className="text-right">
              שלחו את הקישור הזה להורים כדי שימלאו את פרטי ילדיהם
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5 py-2">
            {/* Link display and copy */}
            <div className="space-y-2">
              <div className="bg-muted/50 rounded-xl p-3 border border-border">
                <p className="text-sm text-muted-foreground break-all text-left" dir="ltr">
                  {registrationLink}
                </p>
              </div>
              <button
                onClick={handleCopyLink}
                className={cn(
                  "w-full inline-flex items-center justify-center gap-2 rounded-xl py-2.5 px-4 text-sm font-medium transition-colors border",
                  copiedLink
                    ? "bg-success text-success-foreground border-success"
                    : "bg-card border-border hover:bg-muted"
                )}
              >
                <Copy className="h-4 w-4" />
                <span>{copiedLink ? "הקישור הועתק!" : "העתקת קישור"}</span>
              </button>
            </div>

            {/* Share options */}
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">או שלחו ישירות:</p>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={handleWhatsAppShare}
                  className="inline-flex items-center justify-center gap-2 rounded-xl py-3 px-4 text-sm font-medium border border-border bg-card hover:bg-muted transition-colors"
                >
                  <MessageCircle className="h-5 w-5" />
                  <span>WhatsApp</span>
                </button>
                <button
                  onClick={handleEmailShare}
                  className="inline-flex items-center justify-center gap-2 rounded-xl py-3 px-4 text-sm font-medium border border-border bg-card hover:bg-muted transition-colors"
                >
                  <Mail className="h-5 w-5" />
                  <span>Email</span>
                </button>
              </div>
            </div>

            {/* Suggested message */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-muted-foreground">טיפ: העתיקו את הטקסט הזה:</p>
                <button
                  onClick={handleCopyMessage}
                  className={cn(
                    "inline-flex items-center gap-1.5 text-xs font-medium px-2 py-1 rounded-xl transition-colors",
                    copiedMessage
                      ? "bg-success/20 text-success"
                      : "hover:bg-muted text-muted-foreground"
                  )}
                >
                  <Copy className="h-3 w-3" />
                  <span>{copiedMessage ? "הועתק!" : "העתקה"}</span>
                </button>
              </div>
              <div className="bg-brand/10 dark:bg-brand/20 rounded-xl p-4 border border-brand/20 dark:border-brand/30 max-h-32 overflow-y-auto">
                <p className="text-sm text-foreground whitespace-pre-line leading-relaxed">
                  {getSuggestedMessage(shareMode === "with-payment")}
                </p>
              </div>
            </div>

          </div>

          {/* Close button */}
          <div className="flex gap-3 pt-2">
            {shareMode === "with-payment" ? (
              <>
                <Button
                  onClick={handlePaymentLinkSent}
                  className="flex-1 bg-brand text-white hover:bg-brand/90"
                >
                  שלחתי את הקישור
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShareDialogOpen(false)}
                >
                  אחר כך
                </Button>
              </>
            ) : (
              <>
                <Button
                  onClick={() => setShareDialogOpen(false)}
                  className="flex-1 bg-brand text-white hover:bg-brand/90"
                >
                  סיימתי לשלוח
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShareDialogOpen(false)}
                >
                  אחר כך
                </Button>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
