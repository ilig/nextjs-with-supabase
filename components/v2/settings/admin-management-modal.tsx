"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Users, Trash2, Plus, Shield, Mail, Copy, Check, MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";

type Admin = {
  id: string;
  user_id: string;
  email: string;
  is_owner: boolean;
};

type PendingInvitation = {
  id: string;
  email: string;
  created_at: string;
};

type AdminManagementModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  admins: Admin[];
  pendingInvitations?: PendingInvitation[];
  currentUserId: string;
  inviteCode?: string;
  className?: string;
  onAddAdmin: (email: string) => Promise<void>;
  onRemoveAdmin: (adminId: string) => Promise<void>;
  onCancelInvitation?: (invitationId: string) => Promise<void>;
};

export function AdminManagementModal({
  open,
  onOpenChange,
  admins,
  pendingInvitations = [],
  currentUserId,
  inviteCode,
  className: classDisplayName,
  onAddAdmin,
  onRemoveAdmin,
  onCancelInvitation,
}: AdminManagementModalProps) {
  const [newEmail, setNewEmail] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [cancelingId, setCancelingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [linkCopied, setLinkCopied] = useState(false);

  // Generate invite link
  const inviteLink = inviteCode
    ? `${typeof window !== 'undefined' ? window.location.origin : ''}/join?code=${inviteCode}`
    : null;

  // WhatsApp message for sharing
  const whatsappMessage = classDisplayName && inviteLink
    ? `היי! אני מזמין/ה אותך להצטרף כמנהל/ת בכיתה "${classDisplayName}" באפליקציית ועד הורים.\n\nלחץ/י על הקישור להרשמה:\n${inviteLink}`
    : null;

  const handleCopyLink = async () => {
    if (!inviteLink) return;
    try {
      await navigator.clipboard.writeText(inviteLink);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy link:", err);
    }
  };

  const handleWhatsAppShare = () => {
    if (!whatsappMessage) return;
    const encodedMessage = encodeURIComponent(whatsappMessage);
    window.open(`https://wa.me/?text=${encodedMessage}`, '_blank');
  };

  const handleAddAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const email = newEmail.trim().toLowerCase();

    if (!email) {
      setError("נא להזין כתובת אימייל");
      return;
    }

    // Basic email validation
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("כתובת אימייל לא תקינה");
      return;
    }

    // Check if already an admin
    if (admins.some(a => a.email.toLowerCase() === email)) {
      setError("משתמש זה כבר מנהל בכיתה");
      return;
    }

    setIsAdding(true);
    try {
      await onAddAdmin(email);
      setNewEmail("");
      setSuccess("הזמנה נשלחה בהצלחה");
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "אירעה שגיאה בהוספת המנהל";
      setError(errorMessage);
      console.error("Failed to add admin:", err);
    } finally {
      setIsAdding(false);
    }
  };

  const handleRemoveAdmin = async (adminId: string) => {
    setError(null);
    setSuccess(null);
    setRemovingId(adminId);

    try {
      await onRemoveAdmin(adminId);
      setSuccess("המנהל הוסר בהצלחה");
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "אירעה שגיאה בהסרת המנהל";
      setError(errorMessage);
      console.error("Failed to remove admin:", err);
    } finally {
      setRemovingId(null);
    }
  };

  const handleCancelInvitation = async (invitationId: string) => {
    if (!onCancelInvitation) return;
    setError(null);
    setSuccess(null);
    setCancelingId(invitationId);

    try {
      await onCancelInvitation(invitationId);
      setSuccess("ההזמנה בוטלה");
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "אירעה שגיאה בביטול ההזמנה";
      setError(errorMessage);
      console.error("Failed to cancel invitation:", err);
    } finally {
      setCancelingId(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md" dir="rtl">
        <DialogHeader>
          <DialogTitle className="text-right flex items-center gap-2">
            <Users className="h-5 w-5 text-brand" />
            ניהול מנהלים
          </DialogTitle>
        </DialogHeader>

        {/* Explanatory Copy */}
        <p className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-xl">
          מנהלים יכולים לערוך את פרטי הכיתה, להוסיף ילדים וצוות, לנהל אירועים ותקציב, ולצפות בכל המידע של הכיתה.
        </p>

        <div className="space-y-4">
          {/* Current Admins List */}
          <div className="space-y-2">
            <Label>מנהלים נוכחיים</Label>
            <div className="space-y-2">
              {admins.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  אין מנהלים
                </p>
              ) : (
                admins.map((admin) => (
                  <div
                    key={admin.id}
                    className={cn(
                      "flex items-center justify-between p-3 rounded-xl border-2 border-border",
                      admin.user_id === currentUserId && "bg-brand/5 border-brand/30"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-xl bg-muted">
                        <Shield className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">
                          {admin.email}
                        </p>
                        {admin.is_owner && (
                          <span className="text-xs text-brand">מנהל/ת ראשי/ת</span>
                        )}
                        {admin.user_id === currentUserId && !admin.is_owner && (
                          <span className="text-xs text-muted-foreground">את/ה</span>
                        )}
                      </div>
                    </div>
                    {!admin.is_owner && admin.user_id !== currentUserId && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() => handleRemoveAdmin(admin.id)}
                        disabled={removingId === admin.id}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Pending Invitations */}
          {pendingInvitations.length > 0 && (
            <div className="space-y-2">
              <Label>הזמנות ממתינות</Label>
              <div className="space-y-2">
                {pendingInvitations.map((invitation) => (
                  <div
                    key={invitation.id}
                    className="flex items-center justify-between p-3 rounded-xl border-2 border-dashed border-warning/50 bg-warning/10"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-xl bg-warning/20">
                        <Mail className="h-4 w-4 text-warning" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">
                          {invitation.email}
                        </p>
                        <span className="text-xs text-warning">ממתין/ה להרשמה</span>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => handleCancelInvitation(invitation.id)}
                      disabled={cancelingId === invitation.id}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Invite New Admin */}
          <div className="space-y-3">
            <Label>הזמן מנהל/ת חדש/ה</Label>

            {/* Invite via Link */}
            {inviteLink && (
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">
                  שלח קישור הזמנה למנהל/ת חדש/ה דרך וואטסאפ או העתק את הקישור:
                </p>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1 gap-2 bg-success/10 border-success/30 text-success hover:bg-success/20"
                    onClick={handleWhatsAppShare}
                  >
                    <MessageCircle className="h-4 w-4" />
                    שלח בוואטסאפ
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="gap-2"
                    onClick={handleCopyLink}
                  >
                    {linkCopied ? (
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
                </div>
              </div>
            )}

            {/* Divider */}
            <div className="relative py-2">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-background px-2 text-muted-foreground">או</span>
              </div>
            </div>

            {/* Add by Email (existing user) */}
            <form onSubmit={handleAddAdmin} className="space-y-2">
              <p className="text-xs text-muted-foreground">
                הוסף משתמש קיים לפי כתובת אימייל:
              </p>
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <Mail className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder="כתובת אימייל"
                    className="pr-10 text-right"
                    dir="ltr"
                  />
                </div>
                <Button type="submit" disabled={isAdding} className="gap-2">
                  <Plus className="h-4 w-4" />
                  {isAdding ? "מוסיף..." : "הוסף"}
                </Button>
              </div>
            </form>
          </div>

          {/* Messages */}
          {error && (
            <p className="text-sm text-destructive bg-destructive/10 p-3 rounded-xl">
              {error}
            </p>
          )}
          {success && (
            <p className="text-sm text-success bg-success/10 p-3 rounded-xl">
              {success}
            </p>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            סגור
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
