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
import { Badge } from "@/components/ui/badge";
import {
  Calendar,
  Coins,
  Users,
  UserCheck,
  Trash2,
  CheckCircle,
  AlertCircle,
  ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { CalendarEvent, CalendarDayData } from "./hebrew-calendar";
import type { JewishHoliday, SchoolBreak } from "@/lib/jewish-holidays";

// ============================================
// Types
// ============================================

type EventDetailModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  event?: CalendarEvent;
  dayData?: CalendarDayData;
  isAdmin?: boolean;
  onSave?: (event: CalendarEvent) => Promise<void>;
  onDelete?: (eventId: string) => Promise<void>;
  onNavigateToBudget?: () => void;
};

// ============================================
// Helper Functions
// ============================================

function formatDate(date: Date): string {
  const day = date.getDate();
  const months = [
    "ינואר", "פברואר", "מרץ", "אפריל", "מאי", "יוני",
    "יולי", "אוגוסט", "ספטמבר", "אוקטובר", "נובמבר", "דצמבר"
  ];
  const month = months[date.getMonth()];
  const year = date.getFullYear();
  return `${day} ב${month} ${year}`;
}

function formatDateForInput(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getEventTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    birthday_kids: "ימי הולדת לילדים",
    birthday_staff: "ימי הולדת לצוות",
    hanukkah: "חנוכה",
    purim: "פורים",
    passover: "פסח",
    rosh_hashana: "ראש השנה",
    sukkot: "סוכות",
    shavuot: "שבועות",
    tu_bishvat: "ט״ו בשבט",
    independence_day: "יום העצמאות",
    end_of_year: "סוף שנה",
    custom: "אירוע מותאם",
  };
  return labels[type] || type;
}

// ============================================
// Component
// ============================================

export function EventDetailModal({
  open,
  onOpenChange,
  event,
  dayData,
  isAdmin = false,
  onSave,
  onDelete,
  onNavigateToBudget,
}: EventDetailModalProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editedEvent, setEditedEvent] = useState<Partial<CalendarEvent>>({});

  // Determine what we're showing
  const isHolidayView = !event && dayData && (dayData.holidays.length > 0 || dayData.schoolBreak);
  const isBudgetedEvent = event && (event.allocated_budget || event.amount_per_kid || event.amount_per_staff);

  const handleEdit = () => {
    if (event) {
      setEditedEvent({
        name: event.name,
        event_date: event.event_date,
      });
      setIsEditing(true);
    }
  };

  const handleSave = async () => {
    if (!event || !onSave) return;

    setIsSaving(true);
    try {
      await onSave({
        ...event,
        ...editedEvent,
      });
      setIsEditing(false);
      onOpenChange(false);
    } catch (error) {
      console.error("Failed to save event:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!event || !onDelete) return;

    const hasBudget = event.allocated_budget && event.allocated_budget > 0;
    const confirmMessage = hasBudget
      ? `לאירוע זה מוקצה תקציב של ₪${event.allocated_budget?.toLocaleString()}. למחוק?`
      : "האם אתה בטוח שברצונך למחוק אירוע זה?";

    if (!confirm(confirmMessage)) return;

    setIsSaving(true);
    try {
      await onDelete(event.id);
      onOpenChange(false);
    } catch (error) {
      console.error("Failed to delete event:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleClose = () => {
    setIsEditing(false);
    setEditedEvent({});
    onOpenChange(false);
  };

  // Render holiday/school break view
  if (isHolidayView && dayData) {
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-right flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              {formatDate(dayData.date)}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Holidays */}
            {dayData.holidays.map((holiday) => (
              <HolidayCard key={holiday.id} holiday={holiday} />
            ))}

            {/* School break */}
            {dayData.schoolBreak && (
              <SchoolBreakCard schoolBreak={dayData.schoolBreak} />
            )}

            {/* Birthdays */}
            {dayData.birthdays.length > 0 && (
              <div className="bg-muted/50 rounded-lg p-4">
                <h4 className="font-medium mb-2 flex items-center gap-2">
                  🎂 ימי הולדת
                </h4>
                <ul className="space-y-1">
                  {dayData.birthdays.map((b, idx) => (
                    <li key={idx} className="text-sm text-muted-foreground">
                      {b.name} ({b.type === "kid" ? "ילד/ה" : "צוות"})
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={handleClose}>
              סגור
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  // Render event view
  if (!event) return null;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md" dir="rtl">
        <DialogHeader>
          <DialogTitle className="text-right flex items-center gap-2">
            <span className="text-xl">{event.icon || "🎉"}</span>
            {isEditing ? (
              <Input
                value={editedEvent.name || ""}
                onChange={(e) =>
                  setEditedEvent({ ...editedEvent, name: e.target.value })
                }
                className="text-lg font-bold"
              />
            ) : (
              <span>{event.name}</span>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Date */}
          <div className="flex items-center gap-3">
            <Calendar className="h-5 w-5 text-muted-foreground" />
            {isEditing ? (
              <Input
                type="date"
                value={editedEvent.event_date?.split("T")[0] || ""}
                onChange={(e) =>
                  setEditedEvent({ ...editedEvent, event_date: e.target.value })
                }
              />
            ) : (
              <span className="text-foreground">
                {event.event_date
                  ? formatDate(new Date(event.event_date))
                  : "לא נקבע תאריך"}
              </span>
            )}
          </div>

          {/* Event type badge */}
          <div className="flex items-center gap-2">
            <Badge variant="secondary">
              {getEventTypeLabel(event.event_type)}
            </Badge>
            {event.is_paid && (
              <Badge className="bg-success/20 text-success border-success/30">
                <CheckCircle className="h-3 w-3 ml-1" />
                שולם
              </Badge>
            )}
          </div>

          {/* Budget section (only for budgeted events) */}
          {isBudgetedEvent && (
            <div className="bg-muted/50 rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-medium flex items-center gap-2">
                  <Coins className="h-4 w-4" />
                  פרטי תקציב
                </h4>
                {isAdmin && !isEditing && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onNavigateToBudget}
                    className="text-brand"
                  >
                    <ExternalLink className="h-4 w-4 ml-1" />
                    ערוך בתקציב
                  </Button>
                )}
              </div>

              {/* Budget breakdown */}
              <div className="grid grid-cols-2 gap-3 text-sm">
                {event.amount_per_kid !== undefined && event.amount_per_kid > 0 && (
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span>ילדים: ₪{event.amount_per_kid}</span>
                  </div>
                )}
                {event.amount_per_staff !== undefined && event.amount_per_staff > 0 && (
                  <div className="flex items-center gap-2">
                    <UserCheck className="h-4 w-4 text-muted-foreground" />
                    <span>צוות: ₪{event.amount_per_staff}</span>
                  </div>
                )}
              </div>

              {/* Total allocated */}
              {event.allocated_budget && (
                <div className="pt-2 border-t border-border">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">סה״כ מוקצה:</span>
                    <span className="text-lg font-bold text-brand">
                      ₪{event.allocated_budget.toLocaleString()}
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Warning for non-budgeted events */}
          {!isBudgetedEvent && isAdmin && (
            <div className="bg-warning/10 text-warning rounded-lg p-3 flex items-start gap-2">
              <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium">אירוע ללא תקציב</p>
                <p className="text-warning/80">
                  לא הוקצה תקציב לאירוע זה. ניתן להוסיף הקצאה בלשונית התקציב.
                </p>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="flex gap-2">
          {isAdmin && (
            <>
              {isEditing ? (
                <>
                  <Button
                    variant="outline"
                    onClick={() => setIsEditing(false)}
                    disabled={isSaving}
                  >
                    ביטול
                  </Button>
                  <Button onClick={handleSave} disabled={isSaving}>
                    {isSaving ? "שומר..." : "שמור"}
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    variant="destructive"
                    size="icon"
                    onClick={handleDelete}
                    disabled={isSaving}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" onClick={handleEdit}>
                    ערוך
                  </Button>
                  <Button variant="outline" onClick={handleClose}>
                    סגור
                  </Button>
                </>
              )}
            </>
          )}
          {!isAdmin && (
            <Button variant="outline" onClick={handleClose}>
              סגור
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============================================
// Sub-components
// ============================================

function HolidayCard({ holiday }: { holiday: JewishHoliday }) {
  return (
    <div className="bg-muted/50 rounded-lg p-4">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-xl">{holiday.icon}</span>
        <h4 className="font-medium">{holiday.hebrewName}</h4>
      </div>
      <div className="flex gap-2">
        <Badge variant={holiday.isSchoolOff ? "default" : "secondary"}>
          {holiday.isSchoolOff ? "יום חופש" : "יום רגיל"}
        </Badge>
        <Badge variant="outline">{holiday.category === "religious" ? "חג דתי" : "חג לאומי"}</Badge>
      </div>
    </div>
  );
}

function SchoolBreakCard({ schoolBreak }: { schoolBreak: SchoolBreak }) {
  return (
    <div className="bg-blue-500/10 rounded-lg p-4">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-xl">{schoolBreak.icon}</span>
        <h4 className="font-medium">{schoolBreak.name}</h4>
      </div>
      <p className="text-sm text-muted-foreground">
        {formatDate(schoolBreak.startDate)} - {formatDate(schoolBreak.endDate)}
      </p>
    </div>
  );
}
