"use client";

import React, { useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Calendar as CalendarIcon, Plus, Share2, Copy, Check, Cake, Gift, Star, Sparkles, TreeDeciduous, PartyPopper, Sun, Heart, Flag, GraduationCap } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import {
  HebrewCalendar,
  EventDetailModal,
  AddEventModal,
  DaySummarySheet,
  type CalendarEvent,
  type CalendarDayData,
  type NewEventData,
} from "../calendar";

// ============================================
// Types
// ============================================

type Child = {
  id: string;
  name: string;
  birthday?: string;
};

type Staff = {
  id: string;
  name: string;
  birthday?: string;
};

type CalendarTabProps = {
  classId: string;
  inviteCode?: string;
  events?: CalendarEvent[];
  children?: Child[];
  staff?: Staff[];
  isAdmin?: boolean;
  /** Callback to navigate to budget tab with optional event type to highlight */
  onNavigateToBudget?: (eventType?: string) => void;
  className?: string;
};

// ============================================
// Component
// ============================================

export function CalendarTab({
  classId,
  inviteCode,
  events = [],
  children = [],
  staff = [],
  isAdmin = true, // Default to admin for dashboard
  onNavigateToBudget,
  className,
}: CalendarTabProps) {
  const router = useRouter();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [selectedDayData, setSelectedDayData] = useState<CalendarDayData | undefined>();
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | undefined>();
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [isDaySummaryOpen, setIsDaySummaryOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  // Transform events to CalendarEvent format
  const calendarEvents: CalendarEvent[] = events.map((e) => ({
    id: e.id,
    name: e.name,
    event_type: e.event_type,
    event_date: e.event_date,
    allocated_budget: e.allocated_budget,
    amount_per_kid: e.amount_per_kid,
    amount_per_staff: e.amount_per_staff,
    is_paid: e.is_paid,
  }));

  // Build a map of event types to their budgets (for holidays without specific dates)
  const budgetedEventTypes = useMemo(() => {
    const map = new Map<string, number>();
    calendarEvents.forEach((event) => {
      const budget = event.allocated_budget || 0;
      if (budget > 0 && event.event_type) {
        map.set(event.event_type, budget);
      }
    });
    return map;
  }, [calendarEvents]);

  // Transform birthdays
  const kidBirthdays = children
    .filter((c) => c.birthday)
    .map((c) => ({ name: c.name, birthday: c.birthday! }));

  const staffBirthdays = staff
    .filter((s) => s.birthday)
    .map((s) => ({ name: s.name, birthday: s.birthday! }));

  // Handlers
  const handleDateClick = useCallback((date: Date, dayData: CalendarDayData) => {
    setSelectedDate(date);
    setSelectedDayData(dayData);

    // Check if day has any content (events, holidays, birthdays, school break)
    const hasContent =
      dayData.events.length > 0 ||
      dayData.holidays.length > 0 ||
      dayData.birthdays.length > 0 ||
      dayData.schoolBreak;

    if (hasContent) {
      // Open day summary sheet to show all content with add/edit/delete options
      setIsDaySummaryOpen(true);
    } else if (isAdmin) {
      // Empty day - open add modal directly for admins
      setIsAddModalOpen(true);
    }
  }, [isAdmin]);

  const handleEventClick = useCallback((event: CalendarEvent) => {
    setSelectedEvent(event);
    setIsEventModalOpen(true);
  }, []);

  // Handler for editing event from day summary sheet
  const handleEditEventFromSummary = useCallback((event: CalendarEvent) => {
    setSelectedEvent(event);
    setIsDaySummaryOpen(false);
    setIsEventModalOpen(true);
  }, []);

  // Handler for adding event from day summary sheet
  const handleAddEventFromSummary = useCallback(() => {
    setIsDaySummaryOpen(false);
    setIsAddModalOpen(true);
  }, []);

  const handleAddEvent = useCallback(async (eventData: NewEventData) => {
    const supabase = createClient();

    const { error } = await supabase.from("events").insert({
      class_id: classId,
      name: eventData.name,
      event_type: eventData.event_type,
      event_date: eventData.event_date,
    });

    if (error) {
      console.error("Failed to add event:", error);
      throw error;
    }

    // Refresh the page to get updated data
    router.refresh();
  }, [classId, router]);

  const handleSaveEvent = useCallback(async (event: CalendarEvent) => {
    const supabase = createClient();

    const { error } = await supabase
      .from("events")
      .update({
        name: event.name,
        event_date: event.event_date,
      })
      .eq("id", event.id);

    if (error) {
      console.error("Failed to update event:", error);
      throw error;
    }

    router.refresh();
  }, [router]);

  const handleDeleteEvent = useCallback(async (eventId: string) => {
    const supabase = createClient();

    const { error } = await supabase.from("events").delete().eq("id", eventId);

    if (error) {
      console.error("Failed to delete event:", error);
      throw error;
    }

    router.refresh();
  }, [router]);

  const handleNavigateToBudget = useCallback(() => {
    // This would typically change the active tab in the parent
    // For now, we'll just close the modal
    setIsEventModalOpen(false);
  }, []);

  const handleCopyShareLink = useCallback(async () => {
    if (!inviteCode) return;

    const shareUrl = `${window.location.origin}/calendar/${inviteCode}`;
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [inviteCode]);

  const shareUrl = inviteCode ? `${typeof window !== "undefined" ? window.location.origin : ""}/calendar/${inviteCode}` : "";

  return (
    <div className={cn("p-4 md:p-6 space-y-6", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-brand">
            <CalendarIcon className="h-6 w-6 text-brand-foreground" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">לוח שנה</h1>
            <p className="text-sm text-muted-foreground">אירועים, חגים וימי חופש</p>
          </div>
        </div>

        {/* Action buttons */}
        {isAdmin && (
          <div className="flex flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsShareModalOpen(true)}
              className="gap-2"
            >
              <Share2 className="h-4 w-4" />
              <span>שיתוף לוח שנה</span>
            </Button>
            <Button
              
              size="sm"
              onClick={() => {
                setSelectedDate(new Date());
                setIsAddModalOpen(true);
              }}
              className="gap-2"
            >
              <Plus className="h-4 w-4" />
              <span>הוספת אירוע</span>
            </Button>
          </div>
        )}
      </div>

      {/* Calendar */}
      <div className="bg-card rounded-2xl p-4 md:p-6 border-2 border-border shadow-sm">
        <HebrewCalendar
          events={calendarEvents}
          allEvents={calendarEvents}
          kidBirthdays={kidBirthdays}
          staffBirthdays={staffBirthdays}
          onDateClick={handleDateClick}
          onEventClick={handleEventClick}
          selectedDate={selectedDate}
        />
      </div>

      {/* Upcoming budgeted events list */}
      <div className="space-y-3">
        <h3 className="text-base font-semibold text-foreground">אירועים מתוקצבים קרובים (ב-30 יום הבאים)</h3>
        <div className="space-y-2">
          {(() => {
            const now = new Date();
            const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
            const upcomingBudgetedEvents = events
              .filter((e) => {
                if (!e.event_date || !e.allocated_budget) return false;
                const eventDate = new Date(e.event_date);
                return eventDate >= now && eventDate <= thirtyDaysFromNow;
              })
              .sort((a, b) => new Date(a.event_date!).getTime() - new Date(b.event_date!).getTime())
              .slice(0, 5);

            if (upcomingBudgetedEvents.length === 0) {
              return (
                <div className="bg-muted/50 rounded-xl p-6 text-center">
                  <CalendarIcon className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">
                    אין אירועים מתוקצבים ב-30 הימים הקרובים
                  </p>
                </div>
              );
            }

            return upcomingBudgetedEvents.map((event) => (
              <button
                key={event.id}
                onClick={() => handleEventClick(event)}
                className="w-full bg-card rounded-xl p-4 border-2 border-border shadow-sm flex items-center justify-between hover:bg-accent transition-colors text-right"
              >
                <div className="flex items-center gap-3">
                  {(() => {
                    const Icon = getEventIcon(event.event_type);
                    return <Icon className="h-5 w-5 text-brand flex-shrink-0" />;
                  })()}
                  <div>
                    <h3 className="font-medium text-foreground">{event.name}</h3>
                    {event.event_date && (
                      <p className="text-sm text-muted-foreground">
                        {formatEventDate(event.event_date)}
                      </p>
                    )}
                  </div>
                </div>
                {event.allocated_budget && (
                  <span className="text-sm font-medium text-brand">
                    ₪{event.allocated_budget.toLocaleString()}
                  </span>
                )}
              </button>
            ));
          })()}
        </div>
      </div>

      {/* Day Summary Sheet - shows all content for a day with actions */}
      {selectedDayData && (
        <DaySummarySheet
          open={isDaySummaryOpen}
          onOpenChange={setIsDaySummaryOpen}
          dayData={selectedDayData}
          isAdmin={isAdmin}
          budgetedEventTypes={budgetedEventTypes}
          onAddEvent={handleAddEventFromSummary}
          onEditEvent={handleEditEventFromSummary}
          onDeleteEvent={handleDeleteEvent}
          onNavigateToBudget={onNavigateToBudget ? (eventType) => {
            setIsDaySummaryOpen(false);
            onNavigateToBudget(eventType);
          } : undefined}
        />
      )}

      {/* Event Detail Modal */}
      <EventDetailModal
        open={isEventModalOpen}
        onOpenChange={setIsEventModalOpen}
        event={selectedEvent}
        dayData={selectedDayData}
        isAdmin={isAdmin}
        onSave={handleSaveEvent}
        onDelete={handleDeleteEvent}
        onNavigateToBudget={handleNavigateToBudget}
      />

      {/* Add Event Modal */}
      <AddEventModal
        open={isAddModalOpen}
        onOpenChange={setIsAddModalOpen}
        selectedDate={selectedDate}
        onAdd={handleAddEvent}
      />

      {/* Share Modal */}
      <Dialog open={isShareModalOpen} onOpenChange={setIsShareModalOpen}>
        <DialogContent className="max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-right flex items-center gap-3">
              <div className="p-2 rounded-xl bg-muted">
                <Share2 className="h-5 w-5 text-brand" />
              </div>
              שיתוף לוח שנה
            </DialogTitle>
            <DialogDescription className="text-right">
              שתפו את הקישור הזה עם ההורים כדי שיוכלו לצפות בלוח השנה של הכיתה.
              הקישור הוא לצפייה בלבד - אין אפשרות לערוך.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {inviteCode ? (
              <>
                <div className="p-4 bg-muted rounded-xl">
                  <p className="text-sm text-muted-foreground mb-2">
                    קישור לצפייה:
                  </p>
                  <p className="text-sm font-mono break-all text-foreground">
                    {shareUrl}
                  </p>
                </div>

                <Button
                  onClick={handleCopyShareLink}
                  className={cn(
                    "w-full rounded-xl gap-2",
                    copied ? "" : "bg-brand hover:bg-brand/90 text-brand-foreground"
                  )}
                  variant={copied ? "outline" : "default"}
                >
                  {copied ? (
                    <>
                      <Check className="h-4 w-4 text-success" />
                      הועתק!
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4" />
                      העתקת קישור
                    </>
                  )}
                </Button>
              </>
            ) : (
              <div className="p-4 bg-warning-muted rounded-xl border border-warning/30">
                <p className="text-sm text-warning-muted-foreground">
                  לא נמצא קוד הזמנה לכיתה. נא לבדוק את הגדרות הכיתה.
                </p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ============================================
// Helper Functions
// ============================================

function getEventIcon(eventType: string): React.ComponentType<{ className?: string }> {
  const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
    birthday_kids: Cake,
    birthday_staff: Gift,
    hanukkah: Sparkles,
    purim: PartyPopper,
    passover: Sun,
    rosh_hashana: Star,
    sukkot: TreeDeciduous,
    shavuot: Sun,
    tu_bishvat: TreeDeciduous,
    independence_day: Flag,
    end_of_year: GraduationCap,
    custom: CalendarIcon,
  };
  return iconMap[eventType] || CalendarIcon;
}

function formatEventDate(dateStr: string): string {
  const date = new Date(dateStr);
  const day = date.getDate();
  const months = [
    "ינואר", "פברואר", "מרץ", "אפריל", "מאי", "יוני",
    "יולי", "אוגוסט", "ספטמבר", "אוקטובר", "נובמבר", "דצמבר"
  ];
  const month = months[date.getMonth()];
  return `${day} ב${month}`;
}
