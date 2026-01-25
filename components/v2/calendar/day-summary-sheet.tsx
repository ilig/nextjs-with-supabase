"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Calendar,
  Plus,
  Pencil,
  Trash2,
  Cake,
  Gift,
  ChevronLeft,
  Coins,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { CalendarEvent, CalendarDayData } from "./hebrew-calendar";
import type { JewishHoliday, SchoolBreak } from "@/lib/jewish-holidays";

// ============================================
// Types
// ============================================

type DaySummarySheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  dayData: CalendarDayData;
  isAdmin?: boolean;
  onAddEvent?: () => void;
  onEditEvent?: (event: CalendarEvent) => void;
  onDeleteEvent?: (eventId: string) => Promise<void>;
};

// ============================================
// Helper Functions
// ============================================

function formatDate(date: Date): string {
  const days = ["יום ראשון", "יום שני", "יום שלישי", "יום רביעי", "יום חמישי", "יום שישי", "שבת"];
  const day = days[date.getDay()];
  const dayNum = date.getDate();
  const months = [
    "ינואר", "פברואר", "מרץ", "אפריל", "מאי", "יוני",
    "יולי", "אוגוסט", "ספטמבר", "אוקטובר", "נובמבר", "דצמבר"
  ];
  const month = months[date.getMonth()];
  return `${day}, ${dayNum} ב${month}`;
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

function getEventIcon(eventType: string): string {
  const iconMap: Record<string, string> = {
    birthday_kids: "🎂",
    birthday_staff: "🎁",
    hanukkah: "🕎",
    purim: "🎭",
    passover: "🍷",
    rosh_hashana: "🍎",
    sukkot: "🌿",
    shavuot: "🌾",
    tu_bishvat: "🌳",
    independence_day: "🇮🇱",
    end_of_year: "🎉",
    custom: "📅",
  };
  return iconMap[eventType] || "📅";
}

// ============================================
// Component
// ============================================

export function DaySummarySheet({
  open,
  onOpenChange,
  dayData,
  isAdmin = false,
  onAddEvent,
  onEditEvent,
  onDeleteEvent,
}: DaySummarySheetProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (event: CalendarEvent) => {
    if (!onDeleteEvent) return;

    const hasBudget = event.allocated_budget && event.allocated_budget > 0;
    const confirmMessage = hasBudget
      ? `לאירוע "${event.name}" מוקצה תקציב של ₪${event.allocated_budget?.toLocaleString()}. למחוק?`
      : `האם למחוק את האירוע "${event.name}"?`;

    if (!confirm(confirmMessage)) return;

    setDeletingId(event.id);
    try {
      await onDeleteEvent(event.id);
    } finally {
      setDeletingId(null);
    }
  };

  const handleClose = () => {
    onOpenChange(false);
  };

  const hasContent =
    dayData.events.length > 0 ||
    dayData.holidays.length > 0 ||
    dayData.birthdays.length > 0 ||
    dayData.schoolBreak;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md max-h-[85vh] flex flex-col" dir="rtl">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="text-right flex items-center gap-3">
            <div className="p-2 rounded-xl bg-brand/10">
              <Calendar className="h-5 w-5 text-brand" />
            </div>
            <span>{formatDate(dayData.date)}</span>
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-4 py-2 min-h-0">
          {/* School Break */}
          {dayData.schoolBreak && (
            <SchoolBreakItem schoolBreak={dayData.schoolBreak} />
          )}

          {/* Holidays */}
          {dayData.holidays.map((holiday) => (
            <HolidayItem key={holiday.id} holiday={holiday} />
          ))}

          {/* Birthdays */}
          {dayData.birthdays.length > 0 && (
            <div className="bg-pink-50 dark:bg-pink-950/30 rounded-xl p-4 border border-pink-200 dark:border-pink-800">
              <h4 className="font-medium mb-3 flex items-center gap-2 text-pink-700 dark:text-pink-300">
                <Cake className="h-4 w-4" />
                ימי הולדת ({dayData.birthdays.length})
              </h4>
              <div className="space-y-2">
                {dayData.birthdays.map((b, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-2 text-sm bg-white dark:bg-pink-950/50 rounded-lg px-3 py-2"
                  >
                    {b.type === "kid" ? (
                      <span className="text-lg">🎂</span>
                    ) : (
                      <span className="text-lg">🎁</span>
                    )}
                    <span className="flex-1 font-medium">{b.name}</span>
                    <Badge variant="secondary" className="text-xs">
                      {b.type === "kid" ? "ילד/ה" : "צוות"}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Events */}
          {dayData.events.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-medium text-sm text-muted-foreground px-1">
                אירועים ({dayData.events.length})
              </h4>
              {dayData.events.map((event) => (
                <EventItem
                  key={event.id}
                  event={event}
                  isAdmin={isAdmin}
                  isDeleting={deletingId === event.id}
                  onEdit={() => onEditEvent?.(event)}
                  onDelete={() => handleDelete(event)}
                />
              ))}
            </div>
          )}

          {/* Empty state */}
          {!hasContent && (
            <div className="text-center py-8 text-muted-foreground">
              <Calendar className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p>אין אירועים ביום זה</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex-shrink-0 pt-4 border-t border-border flex gap-2">
          {isAdmin && (
            <Button
              onClick={() => {
                handleClose();
                onAddEvent?.();
              }}
              className="flex-1 gap-2"
            >
              <Plus className="h-4 w-4" />
              הוספת אירוע
            </Button>
          )}
          <Button variant="outline" onClick={handleClose} className={isAdmin ? "" : "flex-1"}>
            סגירה
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ============================================
// Sub-components
// ============================================

function HolidayItem({ holiday }: { holiday: JewishHoliday }) {
  return (
    <div className="bg-amber-50 dark:bg-amber-950/30 rounded-xl p-4 border border-amber-200 dark:border-amber-800">
      <div className="flex items-center gap-3">
        <span className="text-2xl">{holiday.icon}</span>
        <div className="flex-1">
          <h4 className="font-medium text-amber-800 dark:text-amber-200">{holiday.hebrewName}</h4>
          <div className="flex gap-2 mt-1">
            <Badge
              variant={holiday.isSchoolOff ? "default" : "secondary"}
              className={cn(
                "text-xs",
                holiday.isSchoolOff && "bg-amber-500 hover:bg-amber-500"
              )}
            >
              {holiday.isSchoolOff ? "יום חופש" : "יום רגיל"}
            </Badge>
          </div>
        </div>
      </div>
    </div>
  );
}

function SchoolBreakItem({ schoolBreak }: { schoolBreak: SchoolBreak }) {
  return (
    <div className="bg-blue-50 dark:bg-blue-950/30 rounded-xl p-4 border border-blue-200 dark:border-blue-800">
      <div className="flex items-center gap-3">
        <span className="text-2xl">{schoolBreak.icon}</span>
        <div className="flex-1">
          <h4 className="font-medium text-blue-800 dark:text-blue-200">{schoolBreak.name}</h4>
          <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">חופשה</p>
        </div>
      </div>
    </div>
  );
}

function EventItem({
  event,
  isAdmin,
  isDeleting,
  onEdit,
  onDelete
}: {
  event: CalendarEvent;
  isAdmin: boolean;
  isDeleting: boolean;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const hasBudget = event.allocated_budget && event.allocated_budget > 0;

  return (
    <div className="bg-card rounded-xl p-4 border-2 border-border hover:border-brand/30 transition-colors">
      <div className="flex items-start gap-3">
        <span className="text-2xl">{getEventIcon(event.event_type)}</span>
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-foreground truncate">{event.name}</h4>
          <div className="flex items-center gap-2 mt-1">
            <Badge variant="secondary" className="text-xs">
              {getEventTypeLabel(event.event_type)}
            </Badge>
            {hasBudget && (
              <span className="text-xs text-brand font-medium flex items-center gap-1">
                <Coins className="h-3 w-3" />
                ₪{event.allocated_budget?.toLocaleString()}
              </span>
            )}
          </div>
        </div>

        {isAdmin && (
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-foreground"
              onClick={onEdit}
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-destructive"
              onClick={onDelete}
              disabled={isDeleting}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
