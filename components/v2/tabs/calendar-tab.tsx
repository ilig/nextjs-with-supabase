"use client";

import React, { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Calendar as CalendarIcon, Plus, Share2, Copy, Check, Cake, Gift, Star, Sparkles, TreeDeciduous, PartyPopper, Sun, Heart, Flag, GraduationCap } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import {
  HebrewCalendar,
  EventDetailModal,
  AddEventModal,
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
  className,
}: CalendarTabProps) {
  const router = useRouter();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [selectedDayData, setSelectedDayData] = useState<CalendarDayData | undefined>();
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | undefined>();
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
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

    // If there's exactly one event on this day, open it directly
    if (dayData.events.length === 1) {
      setSelectedEvent(dayData.events[0]);
      setIsEventModalOpen(true);
    } else if (dayData.events.length > 1) {
      // Multiple events - could show a picker, for now just show the first
      setSelectedEvent(dayData.events[0]);
      setIsEventModalOpen(true);
    } else if (dayData.holidays.length > 0 || dayData.schoolBreak || dayData.birthdays.length > 0) {
      // Show holiday/birthday info
      setSelectedEvent(undefined);
      setIsEventModalOpen(true);
    } else if (isAdmin) {
      // Empty day - open add modal for admins
      setIsAddModalOpen(true);
    }
  }, [isAdmin]);

  const handleEventClick = useCallback((event: CalendarEvent) => {
    setSelectedEvent(event);
    setIsEventModalOpen(true);
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
              <span>הוסף אירוע</span>
            </Button>
          </div>
        )}
      </div>

      {/* Calendar */}
      <div className="bg-card rounded-2xl p-4 md:p-6 border-2 border-border shadow-sm">
        <HebrewCalendar
          events={calendarEvents}
          kidBirthdays={kidBirthdays}
          staffBirthdays={staffBirthdays}
          onDateClick={handleDateClick}
          onEventClick={handleEventClick}
          selectedDate={selectedDate}
        />
      </div>

      {/* Upcoming events list */}
      {events.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-foreground">אירועים קרובים</h2>
          <div className="space-y-2">
            {events
              .filter((e) => e.event_date && new Date(e.event_date) >= new Date())
              .sort((a, b) => new Date(a.event_date!).getTime() - new Date(b.event_date!).getTime())
              .slice(0, 5)
              .map((event) => (
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
              ))}
          </div>
        </div>
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
            <DialogTitle className="text-right flex items-center gap-2">
              <Share2 className="h-5 w-5 text-brand" />
              שיתוף לוח שנה
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              שתפו את הקישור הזה עם ההורים כדי שיוכלו לצפות בלוח השנה של הכיתה.
              הקישור הוא לצפייה בלבד - אין אפשרות לערוך.
            </p>

            {inviteCode ? (
              <div className="flex gap-2">
                <div className="flex-1 bg-muted rounded-xl p-3 text-sm font-mono break-all">
                  {shareUrl}
                </div>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleCopyShareLink}
                  className="shrink-0"
                >
                  {copied ? (
                    <Check className="h-4 w-4 text-success" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
            ) : (
              <p className="text-sm text-destructive">
                לא נמצא קוד הזמנה לכיתה. נא לבדוק את הגדרות הכיתה.
              </p>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsShareModalOpen(false)}>
              סגור
            </Button>
          </DialogFooter>
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
