"use client";

import { useState, useMemo } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  formatHebrewDate,
  formatGregorianHebrewDate,
  getHolidaysForMonth,
  getSchoolBreaksForMonth,
  isSchoolBreak,
  type JewishHoliday,
  type SchoolBreak,
} from "@/lib/jewish-holidays";

// ============================================
// Types
// ============================================

export type CalendarEvent = {
  id: string;
  name: string;
  event_type: string;
  event_date?: string;
  allocated_budget?: number;
  amount_per_kid?: number;
  amount_per_staff?: number;
  is_paid?: boolean;
  icon?: string;
};

export type CalendarDayData = {
  date: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
  isWeekend: boolean;
  events: CalendarEvent[];
  holidays: JewishHoliday[];
  schoolBreak: SchoolBreak | null;
  birthdays: { type: "kid" | "staff"; name: string }[];
};

type HebrewCalendarProps = {
  events?: CalendarEvent[];
  /** All events including those without dates - used to check if holidays have budgets */
  allEvents?: CalendarEvent[];
  kidBirthdays?: { name: string; birthday: string }[];
  staffBirthdays?: { name: string; birthday: string }[];
  onDateClick?: (date: Date, dayData: CalendarDayData) => void;
  onEventClick?: (event: CalendarEvent) => void;
  selectedDate?: Date;
  className?: string;
};

// ============================================
// Helper Functions
// ============================================

const HEBREW_DAY_NAMES = ["א׳", "ב׳", "ג׳", "ד׳", "ה׳", "ו׳", "ש׳"];

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number): number {
  return new Date(year, month, 1).getDay();
}

function isSameDay(date1: Date, date2: Date): boolean {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
}

function formatDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
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
  return iconMap[eventType] || "🎉";
}

// ============================================
// Component
// ============================================

export function HebrewCalendar({
  events = [],
  allEvents,
  kidBirthdays = [],
  staffBirthdays = [],
  onDateClick,
  onEventClick,
  selectedDate,
  className,
}: HebrewCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const today = new Date();

  // Build a map of events by date
  const eventsByDate = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();
    events.forEach((event) => {
      if (event.event_date) {
        const key = event.event_date.split("T")[0]; // Handle ISO format
        const existing = map.get(key) || [];
        existing.push(event);
        map.set(key, existing);
      }
    });
    return map;
  }, [events]);

  // Build a map of birthdays by month-day (ignoring year)
  const birthdaysByMonthDay = useMemo(() => {
    const map = new Map<string, { type: "kid" | "staff"; name: string }[]>();

    kidBirthdays.forEach(({ name, birthday }) => {
      if (birthday) {
        const date = new Date(birthday);
        const key = `${date.getMonth() + 1}-${date.getDate()}`;
        const existing = map.get(key) || [];
        existing.push({ type: "kid", name });
        map.set(key, existing);
      }
    });

    staffBirthdays.forEach(({ name, birthday }) => {
      if (birthday) {
        const date = new Date(birthday);
        const key = `${date.getMonth() + 1}-${date.getDate()}`;
        const existing = map.get(key) || [];
        existing.push({ type: "staff", name });
        map.set(key, existing);
      }
    });

    return map;
  }, [kidBirthdays, staffBirthdays]);

  // Build a map of event types to their budgets (for events without dates)
  // This is used to show budget indicator on holidays that have budgeted events
  const budgetedEventTypes = useMemo(() => {
    const eventsToCheck = allEvents || events;
    const map = new Map<string, number>();
    eventsToCheck.forEach((event) => {
      const budget = event.allocated_budget || 0;
      if (budget > 0 && event.event_type) {
        map.set(event.event_type, budget);
      }
    });
    return map;
  }, [allEvents, events]);

  // Get holidays and breaks for current month
  const monthHolidays = useMemo(
    () => getHolidaysForMonth(year, month),
    [year, month]
  );
  const monthBreaks = useMemo(
    () => getSchoolBreaksForMonth(year, month),
    [year, month]
  );

  // Generate calendar days
  const calendarDays = useMemo(() => {
    const days: CalendarDayData[] = [];
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);
    const daysInPrevMonth = getDaysInMonth(year, month - 1);

    // Previous month days
    for (let i = firstDay - 1; i >= 0; i--) {
      const day = daysInPrevMonth - i;
      const date = new Date(year, month - 1, day);
      days.push(createDayData(date, false));
    }

    // Current month days
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      days.push(createDayData(date, true));
    }

    // Next month days (fill to complete the grid)
    const remainingDays = 42 - days.length; // 6 rows × 7 days
    for (let day = 1; day <= remainingDays; day++) {
      const date = new Date(year, month + 1, day);
      days.push(createDayData(date, false));
    }

    return days;

    function createDayData(date: Date, isCurrentMonth: boolean): CalendarDayData {
      const dateKey = formatDateKey(date);
      const monthDayKey = `${date.getMonth() + 1}-${date.getDate()}`;
      const dayOfWeek = date.getDay();

      return {
        date,
        isCurrentMonth,
        isToday: isSameDay(date, today),
        isWeekend: dayOfWeek === 5 || dayOfWeek === 6, // Friday & Saturday
        events: eventsByDate.get(dateKey) || [],
        holidays: monthHolidays.filter((h) => isSameDay(h.date, date)),
        schoolBreak: isSchoolBreak(date),
        birthdays: birthdaysByMonthDay.get(monthDayKey) || [],
      };
    }
  }, [year, month, eventsByDate, monthHolidays, birthdaysByMonthDay, today]);

  // Navigation handlers
  const goToPrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  // Get date headers
  const gregorianHeader = formatGregorianHebrewDate(currentDate);
  const hebrewHeader = formatHebrewDate(currentDate);

  return (
    <div className={cn("w-full", className)}>
      {/* Header with navigation */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={goToPrevMonth}
            className="h-8 w-8"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={goToNextMonth}
            className="h-8 w-8"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
        </div>

        <div className="text-center">
          <h2 className="text-lg font-semibold text-foreground">{gregorianHeader}</h2>
          <p className="text-sm text-muted-foreground">{hebrewHeader}</p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={goToToday}
          className="border-brand text-brand hover:bg-brand hover:text-white font-medium"
        >
          היום
        </Button>
      </div>

      {/* Day names header */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {HEBREW_DAY_NAMES.map((day, index) => (
          <div
            key={day}
            className={cn(
              "text-center text-sm font-medium py-2",
              index === 5 || index === 6
                ? "text-muted-foreground"
                : "text-foreground"
            )}
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1">
        {calendarDays.map((dayData, index) => (
          <CalendarDay
            key={index}
            dayData={dayData}
            isSelected={selectedDate ? isSameDay(dayData.date, selectedDate) : false}
            onClick={() => onDateClick?.(dayData.date, dayData)}
            onEventClick={onEventClick}
            budgetedEventTypes={budgetedEventTypes}
          />
        ))}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 mt-4 text-xs text-muted-foreground justify-center">
        <span className="flex items-center gap-1">
          <span>🎂</span> יום הולדת
        </span>
        <span className="flex items-center gap-1">
          <span>🕎</span> חג
        </span>
        <span className="flex items-center gap-1">
          <span>🎉</span> אירוע
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-muted-foreground"></span> חופשה
        </span>
        <span className="flex items-center gap-1">
          <span className="font-bold text-brand">₪</span> תקציב מוקצה
        </span>
      </div>
    </div>
  );
}

// ============================================
// CalendarDay Component
// ============================================

type CalendarDayProps = {
  dayData: CalendarDayData;
  isSelected: boolean;
  onClick: () => void;
  onEventClick?: (event: CalendarEvent) => void;
  /** Map of event types to their budgets - used to show budget indicator on holidays */
  budgetedEventTypes?: Map<string, number>;
};

function CalendarDay({ dayData, isSelected, onClick, onEventClick, budgetedEventTypes }: CalendarDayProps) {
  const { date, isCurrentMonth, isToday, isWeekend, events, holidays, schoolBreak, birthdays } = dayData;

  const hasContent = events.length > 0 || holidays.length > 0 || birthdays.length > 0;
  const isSchoolBreakDay = !!schoolBreak;

  // Check if any event has a budget allocated
  const hasBudgetedEvent = events.some((e) => e.allocated_budget && e.allocated_budget > 0);

  // Check if any holiday on this day has a budgeted event type
  // This handles cases where budget is allocated to a holiday type but the event has no specific date
  const hasHolidayWithBudget = budgetedEventTypes && holidays.some((holiday) => {
    // Map Hebrew holiday names to event types (support both hyphen and underscore variants)
    // Note: holiday.name contains Hebrew text from jewish-holidays.ts (metadata.hebrewName)
    const holidayToEventType: Record<string, string[]> = {
      // Passover (פסח)
      "פסח": ["passover"],
      "פסח א׳": ["passover"],
      "פסח ב׳": ["passover"],
      "פסח ג׳ (חול המועד)": ["passover"],
      "פסח ד׳ (חול המועד)": ["passover"],
      "פסח ה׳ (חול המועד)": ["passover"],
      "פסח ו׳ (חול המועד)": ["passover"],
      "פסח ז׳": ["passover"],
      // Hanukkah (חנוכה)
      "חנוכה": ["hanukkah", "chanukah"],
      "חנוכה: נר א׳": ["hanukkah", "chanukah"],
      "חנוכה: נר ב׳": ["hanukkah", "chanukah"],
      "חנוכה: נר ג׳": ["hanukkah", "chanukah"],
      "חנוכה: נר ד׳": ["hanukkah", "chanukah"],
      "חנוכה: נר ה׳": ["hanukkah", "chanukah"],
      "חנוכה: נר ו׳": ["hanukkah", "chanukah"],
      "חנוכה: נר ז׳": ["hanukkah", "chanukah"],
      "חנוכה: נר ח׳": ["hanukkah", "chanukah"],
      "חנוכה: יום ח׳": ["hanukkah", "chanukah"],
      // Purim (פורים)
      "פורים": ["purim"],
      "שושן פורים": ["purim"],
      // Rosh Hashana (ראש השנה)
      "ראש השנה": ["rosh_hashana", "rosh-hashana"],
      "ראש השנה א׳": ["rosh_hashana", "rosh-hashana"],
      "ראש השנה ב׳": ["rosh_hashana", "rosh-hashana"],
      // Sukkot (סוכות)
      "סוכות": ["sukkot"],
      "סוכות א׳": ["sukkot"],
      "סוכות ב׳": ["sukkot"],
      "סוכות ג׳ (חול המועד)": ["sukkot"],
      "סוכות ד׳ (חול המועד)": ["sukkot"],
      "סוכות ה׳ (חול המועד)": ["sukkot"],
      "סוכות ו׳ (חול המועד)": ["sukkot"],
      "הושענא רבה": ["sukkot"],
      "שמיני עצרת": ["sukkot"],
      "שמחת תורה": ["sukkot"],
      // Shavuot (שבועות)
      "שבועות": ["shavuot"],
      // Tu BiShvat (ט״ו בשבט)
      "ט״ו בשבט": ["tu_bishvat", "tu-bishvat"],
      // Independence Day (יום העצמאות)
      "יום העצמאות": ["independence_day", "independence-day"],
      // Yom Kippur (יום כיפור)
      "יום כיפור": ["yom_kippur", "yom-kippur"],
      "ערב יום כיפור": ["yom_kippur", "yom-kippur"],
    };
    const eventTypes = holidayToEventType[holiday.name];
    return eventTypes && eventTypes.some(et => budgetedEventTypes.has(et));
  });

  const showBudgetIndicator = hasBudgetedEvent || hasHolidayWithBudget;

  // Collect all icons to show
  const icons: string[] = [];

  // Add birthday icons
  if (birthdays.some((b) => b.type === "kid")) {
    icons.push("🎂");
  }
  if (birthdays.some((b) => b.type === "staff")) {
    icons.push("🎁");
  }

  // Add holiday icons
  holidays.forEach((h) => {
    if (!icons.includes(h.icon)) {
      icons.push(h.icon);
    }
  });

  // Add event icons
  events.forEach((e) => {
    const icon = e.icon || getEventIcon(e.event_type);
    if (!icons.includes(icon)) {
      icons.push(icon);
    }
  });

  return (
    <button
      onClick={onClick}
      className={cn(
        "relative min-h-[48px] md:min-h-[64px] p-1 rounded-xl transition-colors",
        "flex flex-col items-center justify-start",
        "hover:bg-accent focus:outline-none focus:ring-2 focus:ring-ring",
        // Current month styling
        isCurrentMonth ? "bg-card" : "bg-muted/30",
        // Today styling
        isToday && "ring-2 ring-brand",
        // Selected styling
        isSelected && "bg-brand/20",
        // Weekend styling
        isWeekend && isCurrentMonth && "bg-muted/50",
        // School break styling
        isSchoolBreakDay && isCurrentMonth && "bg-muted"
      )}
    >
      {/* Date number */}
      <span
        className={cn(
          "text-sm font-medium",
          !isCurrentMonth && "text-muted-foreground/50",
          isToday && "text-brand font-bold",
          isWeekend && !isToday && "text-muted-foreground"
        )}
      >
        {date.getDate()}
      </span>

      {/* Icons */}
      {icons.length > 0 && (
        <div className="flex flex-wrap justify-center gap-0.5 mt-0.5">
          {icons.slice(0, 3).map((icon, idx) => (
            <span key={idx} className="text-xs">
              {icon}
            </span>
          ))}
          {icons.length > 3 && (
            <span className="text-[10px] text-muted-foreground">+{icons.length - 3}</span>
          )}
        </div>
      )}

      {/* Budget indicator */}
      {showBudgetIndicator && isCurrentMonth && (
        <div className="absolute top-0.5 left-0.5">
          <span className="text-[10px] font-bold text-brand">₪</span>
        </div>
      )}

      {/* School break indicator */}
      {isSchoolBreakDay && isCurrentMonth && (
        <div className="absolute bottom-0.5 left-1/2 -translate-x-1/2">
          <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground" />
        </div>
      )}
    </button>
  );
}
