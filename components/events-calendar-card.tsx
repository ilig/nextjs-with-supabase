"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, ChevronLeft, ChevronRight, Clock, PartyPopper, X } from "lucide-react";
import { cn } from "@/lib/utils";

type Event = {
  id: string;
  name: string;
  event_type: string;
  icon: string | null;
  event_date: string | null;
  allocated_budget: number;
  spent_amount: number;
};

type EventsCalendarCardProps = {
  events: Event[];
  className?: string;
  onEventClick?: (event: Event) => void;
  hideHeader?: boolean;
};

export function EventsCalendarCard({ events, className, onEventClick, hideHeader }: EventsCalendarCardProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<"list" | "calendar">("list");
  const [selectedDay, setSelectedDay] = useState<{ day: number; events: Event[] } | null>(null);

  // Calendar helpers
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    return new Date(year, month, 1).getDay();
  };

  const monthNames = [
    "ינואר",
    "פברואר",
    "מרץ",
    "אפריל",
    "מאי",
    "יוני",
    "יולי",
    "אוגוסט",
    "ספטמבר",
    "אוקטובר",
    "נובמבר",
    "דצמבר",
  ];

  const previousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
  };

  const isToday = (day: number) => {
    const today = new Date();
    return (
      day === today.getDate() &&
      currentDate.getMonth() === today.getMonth() &&
      currentDate.getFullYear() === today.getFullYear()
    );
  };

  const isPastDay = (day: number) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const checkDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    return checkDate < today;
  };

  // Helper to parse date string without timezone issues
  // Handles both YYYY-MM-DD (date strings) and ISO format (from DB events)
  const parseEventDate = (dateStr: string): { year: number; month: number; day: number } => {
    // Check if it's a simple YYYY-MM-DD format (no time component)
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      const [year, month, day] = dateStr.split("-").map(Number);
      return { year, month: month - 1, day }; // month is 0-indexed
    }
    // For ISO format or other formats, parse as Date but extract local components
    const date = new Date(dateStr);
    return { year: date.getFullYear(), month: date.getMonth(), day: date.getDate() };
  };

  const getEventsForDay = (day: number) => {
    return events.filter((event) => {
      if (!event.event_date) return false;
      const { year, month, day: eventDay } = parseEventDate(event.event_date);
      return eventDay === day &&
        month === currentDate.getMonth() &&
        year === currentDate.getFullYear();
    });
  };

  // Filter upcoming events (today + next 30 days)
  const upcomingEvents = events
    .filter((event) => {
      if (!event.event_date) return false;
      const { year, month, day } = parseEventDate(event.event_date);
      const eventDate = new Date(year, month, day);
      const today = new Date();
      today.setHours(0, 0, 0, 0); // Start of today
      const thirtyDaysFromNow = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);
      return eventDate >= today && eventDate <= thirtyDaysFromNow;
    })
    .sort((a, b) => {
      const aDate = parseEventDate(a.event_date!);
      const bDate = parseEventDate(b.event_date!);
      return new Date(aDate.year, aDate.month, aDate.day).getTime() -
             new Date(bDate.year, bDate.month, bDate.day).getTime();
    });

  const getDaysUntilEvent = (eventDate: string) => {
    const { year, month, day } = parseEventDate(eventDate);
    const event = new Date(year, month, day);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diffTime = event.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  // Render calendar grid
  const renderCalendar = () => {
    const daysInMonth = getDaysInMonth(currentDate);
    const firstDay = getFirstDayOfMonth(currentDate);
    const days = [];

    // Empty cells for days before month starts
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="p-2" />);
    }

    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const dayEvents = getEventsForDay(day);
      const hasEvents = dayEvents.length > 0;
      const isPast = isPastDay(day);

      days.push(
        <div
          key={day}
          className={cn(
            "p-2 min-h-[80px] border border-gray-100 relative cursor-pointer hover:bg-gray-50 transition-colors",
            isToday(day) && "bg-purple-50 border-purple-300",
            isPast && !isToday(day) && "bg-gray-50",
            hasEvents && "hover:border-pink-300"
          )}
          onClick={() => {
            if (hasEvents) {
              setSelectedDay({ day, events: dayEvents });
            }
          }}
        >
          <div
            className={cn(
              "text-sm font-medium mb-1",
              isToday(day) ? "text-purple-700" : isPast ? "text-gray-400" : "text-gray-700"
            )}
          >
            {day}
          </div>
          <div className="space-y-1">
            {dayEvents.slice(0, 2).map((event) => (
              <div
                key={event.id}
                className={cn(
                  "text-xs rounded px-1 py-0.5 truncate",
                  isPast ? "bg-gray-200 text-gray-600" : "bg-pink-100 text-pink-800"
                )}
              >
                {event.icon} {event.name}
              </div>
            ))}
            {dayEvents.length > 2 && (
              <div className="text-xs text-gray-500">+{dayEvents.length - 2} נוספים</div>
            )}
          </div>
        </div>
      );
    }

    return days;
  };

  return (
    <div className={className}>
      {hideHeader ? (
        <div>
          {/* Main Header - always shown when hideHeader is true */}
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 rounded-xl bg-gradient-to-br from-pink-500 to-rose-600">
              <Calendar className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-extrabold text-[#222222]">אירועים וחגים</h2>
              <p className="text-base text-gray-600">לוח שנה, ימי חופש ואירועים</p>
            </div>
          </div>

          {/* View Mode Toggle */}
          <div className="flex gap-2 mb-6">
            <Button
              variant={viewMode === "list" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewMode("list")}
            >
              רשימה
            </Button>
            <Button
              variant={viewMode === "calendar" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewMode("calendar")}
            >
              לוח שנה
            </Button>
          </div>
        </div>
      ) : (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-gradient-to-br from-pink-500 to-rose-600">
                  <Calendar className="h-5 w-5 text-white" />
                </div>
                <div>
                  <CardTitle className="text-lg">אירועים קרובים</CardTitle>
                  <CardDescription>{upcomingEvents.length} אירועים ב-30 הימים הקרובים</CardDescription>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  variant={viewMode === "list" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setViewMode("list")}
                >
                  רשימה
                </Button>
                <Button
                  variant={viewMode === "calendar" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setViewMode("calendar")}
                >
                  לוח שנה
                </Button>
              </div>
            </div>
          </CardHeader>
        </Card>
      )}

      <div>
        {viewMode === "list" ? (
          <div className="space-y-3">
            {/* List view header showing the date range */}
            <div className="text-sm text-muted-foreground mb-4">
              מציג אירועים מהיום ועד 30 יום קדימה ({upcomingEvents.length} אירועים)
            </div>
            {upcomingEvents.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <PartyPopper className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>אין אירועים קרובים</p>
              </div>
            ) : (
              upcomingEvents.map((event) => {
                const daysUntil = getDaysUntilEvent(event.event_date!);
                const { year, month, day } = parseEventDate(event.event_date!);
                const eventDate = new Date(year, month, day);

                return (
                  <div
                    key={event.id}
                    className="flex items-center justify-between p-4 rounded-lg border border-gray-200 hover:border-pink-300 hover:bg-pink-50 transition-colors cursor-pointer"
                    onClick={() => onEventClick?.(event)}
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <div className="text-3xl">{event.icon || "📅"}</div>
                      <div className="flex-1">
                        <div className="font-semibold text-foreground">{event.name}</div>
                        <div className="text-sm text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {eventDate.toLocaleDateString("he-IL", {
                            weekday: "long",
                            day: "numeric",
                            month: "long",
                          })}
                        </div>
                      </div>
                    </div>
                    <div className="text-left">
                      <Badge
                        variant={daysUntil <= 7 ? "destructive" : "secondary"}
                        className="whitespace-nowrap"
                      >
                        {daysUntil === 0 ? "היום!" : daysUntil === 1 ? "מחר" : `בעוד ${daysUntil} ימים`}
                      </Badge>
                      {event.allocated_budget > 0 && event.event_type !== "birthday" && event.event_type !== "staff-birthday" && (
                        <div className="text-xs text-muted-foreground mt-1">
                          תקציב: ₪{event.allocated_budget.toLocaleString()}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {/* Calendar Header */}
            <div className="flex items-center justify-between">
              <Button variant="outline" size="sm" onClick={previousMonth}>
                <ChevronRight className="h-4 w-4" />
              </Button>
              <div className="text-lg font-semibold">
                {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
              </div>
              <Button variant="outline" size="sm" onClick={nextMonth}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
            </div>

            {/* Day Names */}
            <div className="grid grid-cols-7 gap-1 text-center text-sm font-medium text-gray-600 mb-2">
              <div>ראשון</div>
              <div>שני</div>
              <div>שלישי</div>
              <div>רביעי</div>
              <div>חמישי</div>
              <div>שישי</div>
              <div>שבת</div>
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-1">{renderCalendar()}</div>

            {/* Legend */}
            <div className="flex items-center gap-4 text-xs text-muted-foreground pt-2 border-t flex-wrap">
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-purple-50 border border-purple-300 rounded"></div>
                <span>היום</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-pink-100 rounded"></div>
                <span>אירוע קרוב</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-gray-200 rounded"></div>
                <span>אירוע שעבר</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Day Events Modal */}
      {selectedDay && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedDay(null)}
        >
          <div
            className="bg-white rounded-3xl shadow-2xl max-w-lg w-full max-h-[80vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-gray-900">
                  אירועים ב-{selectedDay.day} ב{monthNames[currentDate.getMonth()]}
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                  {selectedDay.events.length} {selectedDay.events.length === 1 ? "אירוע" : "אירועים"}
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedDay(null)}
                className="rounded-full h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[calc(80vh-100px)]">
              <div className="space-y-4">
                {selectedDay.events.map((event) => {
                  const { year, month, day } = parseEventDate(event.event_date!);
                  const eventDate = new Date(year, month, day);
                  const daysUntil = getDaysUntilEvent(event.event_date!);

                  return (
                    <div
                      key={event.id}
                      className="border-2 border-gray-100 rounded-2xl p-4 hover:border-pink-300 transition-colors"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="text-4xl">{event.icon || "📅"}</div>
                          <div>
                            <h4 className="font-bold text-lg text-gray-900">{event.name}</h4>
                            <div className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                              <Clock className="h-3 w-3" />
                              {eventDate.toLocaleDateString("he-IL", {
                                weekday: "long",
                                day: "numeric",
                                month: "long",
                              })}
                            </div>
                          </div>
                        </div>
                        <Badge
                          variant={daysUntil < 0 ? "outline" : daysUntil <= 7 ? "destructive" : "secondary"}
                          className="whitespace-nowrap"
                        >
                          {daysUntil < 0
                            ? `לפני ${Math.abs(daysUntil)} ימים`
                            : daysUntil === 0
                              ? "היום!"
                              : daysUntil === 1
                                ? "מחר"
                                : `בעוד ${daysUntil} ימים`}
                        </Badge>
                      </div>
                      {event.allocated_budget > 0 && event.event_type !== "birthday" && event.event_type !== "staff-birthday" && (
                        <div className="flex items-center justify-between bg-purple-50 rounded-lg p-3 mt-3">
                          <div>
                            <p className="text-xs text-gray-600">תקציב מוקצה</p>
                            <p className="text-lg font-bold text-purple-700">
                              ₪{event.allocated_budget.toLocaleString()}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-600">נוצל</p>
                            <p className="text-lg font-bold text-gray-900">
                              ₪{event.spent_amount.toLocaleString()}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-600">יתרה</p>
                            <p className={cn(
                              "text-lg font-bold",
                              event.spent_amount > event.allocated_budget ? "text-red-600" : "text-green-600"
                            )}>
                              ₪{(event.allocated_budget - event.spent_amount).toLocaleString()}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
