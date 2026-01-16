"use client";

import { useState, useCallback } from "react";
import { Calendar as CalendarIcon, ArrowRight } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  HebrewCalendar,
  EventDetailModal,
  type CalendarEvent,
  type CalendarDayData,
} from "@/components/v2/calendar";

// ============================================
// Types
// ============================================

type ClassData = {
  id: string;
  name: string;
  school_name: string;
  city: string;
};

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

type PublicCalendarViewProps = {
  classData: ClassData;
  events: CalendarEvent[];
  children: Child[];
  staff: Staff[];
};

// ============================================
// Component
// ============================================

export function PublicCalendarView({
  classData,
  events,
  children,
  staff,
}: PublicCalendarViewProps) {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [selectedDayData, setSelectedDayData] = useState<CalendarDayData | undefined>();
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | undefined>();
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);

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

    if (dayData.events.length === 1) {
      setSelectedEvent(dayData.events[0]);
      setIsEventModalOpen(true);
    } else if (dayData.events.length > 1) {
      setSelectedEvent(dayData.events[0]);
      setIsEventModalOpen(true);
    } else if (dayData.holidays.length > 0 || dayData.schoolBreak || dayData.birthdays.length > 0) {
      setSelectedEvent(undefined);
      setIsEventModalOpen(true);
    }
  }, []);

  const handleEventClick = useCallback((event: CalendarEvent) => {
    setSelectedEvent(event);
    setIsEventModalOpen(true);
  }, []);

  return (
    <div dir="rtl" className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-gradient-to-br from-pink-500 to-rose-600">
                <CalendarIcon className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-foreground">
                  {classData.name}
                </h1>
                <p className="text-sm text-muted-foreground">
                  {classData.school_name} • {classData.city}
                </p>
              </div>
            </div>
            <Link href="/">
              <Button variant="ghost" size="sm" className="gap-2">
                לאתר הראשי
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Page title */}
        <div className="text-center">
          <h2 className="text-2xl font-bold text-foreground">לוח שנה</h2>
          <p className="text-muted-foreground">
            אירועים, חגים וימי הולדת
          </p>
        </div>

        {/* Calendar */}
        <div className="bg-card rounded-2xl p-4 md:p-6 border-2 border-border shadow-sm">
          <HebrewCalendar
            events={events}
            kidBirthdays={kidBirthdays}
            staffBirthdays={staffBirthdays}
            onDateClick={handleDateClick}
            onEventClick={handleEventClick}
            selectedDate={selectedDate}
          />
        </div>

        {/* Upcoming events */}
        {events.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-lg font-bold text-foreground">אירועים קרובים</h3>
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
                      <span className="text-xl">{getEventIcon(event.event_type)}</span>
                      <div>
                        <h4 className="font-medium text-foreground">{event.name}</h4>
                        {event.event_date && (
                          <p className="text-sm text-muted-foreground">
                            {formatEventDate(event.event_date)}
                          </p>
                        )}
                      </div>
                    </div>
                    {event.allocated_budget && event.allocated_budget > 0 && (
                      <span className="text-sm font-medium text-brand">
                        ₪{event.allocated_budget.toLocaleString()}
                      </span>
                    )}
                  </button>
                ))}
            </div>
          </div>
        )}

        {/* Info note */}
        <div className="bg-muted/50 rounded-xl p-4 text-center text-sm text-muted-foreground">
          <p>
            זהו לוח שנה לצפייה בלבד. לעריכה, יש להתחבר כמנהל/ת הכיתה.
          </p>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border mt-8">
        <div className="max-w-4xl mx-auto px-4 py-6 text-center">
          <p className="text-sm text-muted-foreground">
            ClassEase - ניהול כיתות בקלות
          </p>
        </div>
      </footer>

      {/* Event Detail Modal (view only - no admin) */}
      <EventDetailModal
        open={isEventModalOpen}
        onOpenChange={setIsEventModalOpen}
        event={selectedEvent}
        dayData={selectedDayData}
        isAdmin={false}
      />
    </div>
  );
}

// ============================================
// Helper Functions
// ============================================

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
  return iconMap[eventType] || "🎉";
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
