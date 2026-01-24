"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link as LinkIcon, ExternalLink, HelpCircle, CheckCircle2, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

type PayboxLinkModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentLink?: string;
  onSave: (link: string | null) => Promise<void>;
};

export function PayboxLinkModal({
  open,
  onOpenChange,
  currentLink,
  onSave,
}: PayboxLinkModalProps) {
  const [link, setLink] = useState(currentLink || "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset form when modal opens
  useEffect(() => {
    if (open) {
      setLink(currentLink || "");
      setError(null);
    }
  }, [open, currentLink]);

  // Validate paybox link format
  const isValidPayboxLink = useCallback((url: string): boolean => {
    if (!url.trim()) return false;
    try {
      const parsed = new URL(url);
      return parsed.protocol === "https:" || parsed.protocol === "http:";
    } catch {
      return false;
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmedLink = link.trim();

    if (!trimmedLink) {
      setError("יש להזין קישור");
      return;
    }

    if (!isValidPayboxLink(trimmedLink)) {
      setError("הקישור אינו תקין. יש להזין כתובת URL מלאה");
      return;
    }

    setIsSubmitting(true);
    try {
      await onSave(trimmedLink);
      onOpenChange(false);
    } catch (err) {
      setError("אירעה שגיאה בשמירת הקישור");
      console.error("Failed to save paybox link:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md" dir="rtl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 text-right">
            <div className="p-2 rounded-xl bg-muted">
              <LinkIcon className="h-5 w-5 text-brand" />
            </div>
            הגדרת קישור תשלום
          </DialogTitle>
          <DialogDescription className="text-right">
            הוסף קישור לתשלום כדי שהורים יוכלו לשלם בקלות
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
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
              value={link}
              onChange={(e) => {
                setLink(e.target.value);
                setError(null);
              }}
              className={cn(
                "text-left",
                error && "border-destructive focus-visible:ring-destructive"
              )}
            />
            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}
          </div>

          {/* Success indicator for valid link */}
          {link && isValidPayboxLink(link) && !error && (
            <div className="flex items-center gap-2 text-sm text-success">
              <CheckCircle2 className="h-4 w-4" />
              <span>הקישור נראה תקין</span>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <Button
              type="submit"
              disabled={isSubmitting || !link.trim()}
              className="flex-1"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin ml-2" />
                  שומר...
                </>
              ) : (
                "שמירת קישור"
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              ביטול
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
