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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar, Plus } from "lucide-react";

// ============================================
// Types
// ============================================

type AddEventModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedDate?: Date;
  onAdd: (event: NewEventData) => Promise<void>;
};

export type NewEventData = {
  name: string;
  event_type: string;
  event_date: string;
};

// ============================================
// Constants
// ============================================

const EVENT_TYPES = [
  { value: "custom", label: "אירוע מותאם אישית", icon: "📅" },
  { value: "birthday_kids", label: "יום הולדת לילדים", icon: "🎂" },
  { value: "birthday_staff", label: "יום הולדת לצוות", icon: "🎁" },
  { value: "hanukkah", label: "חנוכה", icon: "🕎" },
  { value: "purim", label: "פורים", icon: "🎭" },
  { value: "passover", label: "פסח", icon: "🍷" },
  { value: "rosh_hashana", label: "ראש השנה", icon: "🍎" },
  { value: "sukkot", label: "סוכות", icon: "🌿" },
  { value: "shavuot", label: "שבועות", icon: "🌾" },
  { value: "tu_bishvat", label: "ט״ו בשבט", icon: "🌳" },
  { value: "independence_day", label: "יום העצמאות", icon: "🇮🇱" },
  { value: "end_of_year", label: "סוף שנה", icon: "🎉" },
];

// ============================================
// Helper Functions
// ============================================

function formatDateForInput(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatDateDisplay(date: Date): string {
  const day = date.getDate();
  const months = [
    "ינואר", "פברואר", "מרץ", "אפריל", "מאי", "יוני",
    "יולי", "אוגוסט", "ספטמבר", "אוקטובר", "נובמבר", "דצמבר"
  ];
  const month = months[date.getMonth()];
  const year = date.getFullYear();
  return `${day} ב${month} ${year}`;
}

// ============================================
// Component
// ============================================

export function AddEventModal({
  open,
  onOpenChange,
  selectedDate,
  onAdd,
}: AddEventModalProps) {
  const [name, setName] = useState("");
  const [eventType, setEventType] = useState("custom");
  const [eventDate, setEventDate] = useState(
    selectedDate ? formatDateForInput(selectedDate) : ""
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Update date when selectedDate changes
  if (selectedDate && eventDate !== formatDateForInput(selectedDate)) {
    setEventDate(formatDateForInput(selectedDate));
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!name.trim()) {
      setError("נא להזין שם לאירוע");
      return;
    }
    if (!eventDate) {
      setError("נא לבחור תאריך");
      return;
    }

    setIsSubmitting(true);
    try {
      await onAdd({
        name: name.trim(),
        event_type: eventType,
        event_date: eventDate,
      });

      // Reset form
      setName("");
      setEventType("custom");
      setEventDate("");
      onOpenChange(false);
    } catch (err) {
      setError("אירעה שגיאה בשמירת האירוע");
      console.error("Failed to add event:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setName("");
    setEventType("custom");
    setError(null);
    onOpenChange(false);
  };

  // Auto-fill name based on event type
  const handleEventTypeChange = (value: string) => {
    setEventType(value);
    if (value !== "custom" && !name) {
      const typeInfo = EVENT_TYPES.find((t) => t.value === value);
      if (typeInfo) {
        setName(typeInfo.label);
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md" dir="rtl">
        <DialogHeader>
          <DialogTitle className="text-right flex items-center gap-2">
            <Plus className="h-5 w-5" />
            הוספת אירוע חדש
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Selected date display */}
          {selectedDate && (
            <div className="bg-muted/50 rounded-lg p-3 flex items-center gap-2">
              <Calendar className="h-5 w-5 text-muted-foreground" />
              <span className="text-foreground font-medium">
                {formatDateDisplay(selectedDate)}
              </span>
            </div>
          )}

          {/* Event type */}
          <div className="space-y-2">
            <Label htmlFor="event-type">סוג אירוע</Label>
            <Select value={eventType} onValueChange={handleEventTypeChange}>
              <SelectTrigger>
                <SelectValue placeholder="בחר סוג אירוע" />
              </SelectTrigger>
              <SelectContent dir="rtl">
                {EVENT_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value} className="text-right">
                    <span className="flex items-center gap-2">
                      <span>{type.icon}</span>
                      <span>{type.label}</span>
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Event name */}
          <div className="space-y-2">
            <Label htmlFor="event-name">שם האירוע</Label>
            <Input
              id="event-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="הזן שם לאירוע"
              className="text-right"
            />
          </div>

          {/* Date picker (only if no selectedDate) */}
          {!selectedDate && (
            <div className="space-y-2">
              <Label htmlFor="event-date">תאריך</Label>
              <Input
                id="event-date"
                type="date"
                value={eventDate}
                onChange={(e) => setEventDate(e.target.value)}
              />
            </div>
          )}

          {/* Error message */}
          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}

          {/* Info about budget */}
          <div className="bg-muted/30 rounded-lg p-3 text-sm text-muted-foreground">
            <p>
              💡 להקצאת תקציב לאירוע זה, עבור ללשונית <strong>תקציב</strong> לאחר השמירה.
            </p>
          </div>

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting}
            >
              ביטול
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "שומר..." : "הוסף אירוע"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
