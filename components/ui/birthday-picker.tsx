"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface BirthdayPickerProps {
  value?: string; // DD/MM format
  onSelect: (value: string) => void;
  className?: string;
}

export function BirthdayPicker({ value, onSelect, className }: BirthdayPickerProps) {
  const [currentMonth, setCurrentMonth] = React.useState(() => {
    if (value) {
      const parts = value.split("/");
      if (parts.length === 2) {
        return parseInt(parts[1]) - 1; // 0-indexed
      }
    }
    return new Date().getMonth();
  });

  const monthNames = [
    "ינואר", "פברואר", "מרץ", "אפריל", "מאי", "יוני",
    "יולי", "אוגוסט", "ספטמבר", "אוקטובר", "נובמבר", "דצמבר"
  ];

  const daysInMonth = new Date(2024, currentMonth + 1, 0).getDate();
  const firstDayOfMonth = new Date(2024, currentMonth, 1).getDay();

  const selectedDay = React.useMemo(() => {
    if (value) {
      const parts = value.split("/");
      if (parts.length === 2) {
        const day = parseInt(parts[0]);
        const month = parseInt(parts[1]) - 1;
        if (month === currentMonth) {
          return day;
        }
      }
    }
    return null;
  }, [value, currentMonth]);

  const handleDayClick = (day: number) => {
    const formatted = `${day.toString().padStart(2, "0")}/${(currentMonth + 1).toString().padStart(2, "0")}`;
    onSelect(formatted);
  };

  const prevMonth = () => {
    setCurrentMonth((prev) => (prev === 0 ? 11 : prev - 1));
  };

  const nextMonth = () => {
    setCurrentMonth((prev) => (prev === 11 ? 0 : prev + 1));
  };

  const days = [];
  // Add empty cells for days before the first day of the month
  for (let i = 0; i < firstDayOfMonth; i++) {
    days.push(<div key={`empty-${i}`} className="h-9 w-9" />);
  }
  // Add cells for each day of the month
  for (let day = 1; day <= daysInMonth; day++) {
    const isSelected = selectedDay === day;
    days.push(
      <button
        key={day}
        type="button"
        onClick={() => handleDayClick(day)}
        className={cn(
          "h-9 w-9 rounded-md text-sm font-normal hover:bg-accent hover:text-accent-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
          isSelected && "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground"
        )}
      >
        {day}
      </button>
    );
  }

  return (
    <div className={cn("p-3 bg-white border rounded-lg shadow-lg", className)} dir="rtl">
      <div className="flex items-center justify-between mb-2">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={nextMonth}
          className="h-7 w-7 p-0"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
        <div className="font-semibold">{monthNames[currentMonth]}</div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={prevMonth}
          className="h-7 w-7 p-0"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
      </div>
      <div className="grid grid-cols-7 gap-1 mb-2">
        {["א׳", "ב׳", "ג׳", "ד׳", "ה׳", "ו׳", "ש׳"].map((day) => (
          <div key={day} className="h-9 w-9 text-center text-xs font-medium text-muted-foreground flex items-center justify-center">
            {day}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {days}
      </div>
    </div>
  );
}
