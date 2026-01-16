"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Cake,
  Gift,
  Sparkles,
  PartyPopper,
  Sun,
  GraduationCap,
  Plus,
  ArrowRight,
  Check,
  X,
  Star,
  TreeDeciduous,
  Flag,
  Heart,
} from "lucide-react";

// Default events in specified order - all unchecked by default with 0 amounts
const DEFAULT_EVENTS = [
  { id: "rosh-hashana", name: "ראש השנה", icon: Star },
  { id: "hanukkah", name: "חנוכה", icon: Sparkles },
  { id: "tu-bishvat", name: "ט\"ו בשבט", icon: TreeDeciduous },
  { id: "purim", name: "פורים", icon: PartyPopper },
  { id: "passover", name: "פסח", icon: Sun },
  { id: "teacher-day", name: "יום המחנך", icon: Heart },
  { id: "independence-day", name: "יום העצמאות", icon: Flag },
  { id: "end-of-year", name: "מתנות סוף שנה", icon: GraduationCap },
  { id: "kids-birthdays", name: "ימי הולדת ילדים", icon: Cake },
  { id: "staff-birthdays", name: "ימי הולדת צוות", icon: Gift },
];

export type EventAllocation = {
  eventId: string;
  name: string;
  enabled: boolean;
  amountPerKid: number;
  amountPerStaff: number;
  isCustom?: boolean;
};

export type BudgetAllocationData = {
  events: EventAllocation[];
};

type StepBudgetAllocationProps = {
  data: BudgetAllocationData;
  estimatedChildren: number;
  estimatedStaff: number;
  totalBudget: number;
  onChange: (data: BudgetAllocationData) => void;
  onNext: () => void;
  onBack: () => void;
};

export function StepBudgetAllocation({
  data,
  estimatedChildren,
  estimatedStaff,
  totalBudget,
  onChange,
  onNext,
  onBack,
}: StepBudgetAllocationProps) {
  const [customEventName, setCustomEventName] = useState("");
  const [showCustomInput, setShowCustomInput] = useState(false);

  // Initialize events if empty - all unchecked with 0 amounts by default
  const events: EventAllocation[] = data.events.length > 0
    ? data.events
    : DEFAULT_EVENTS.map((e) => ({
        eventId: e.id,
        name: e.name,
        enabled: false,
        amountPerKid: 0,
        amountPerStaff: 0,
        isCustom: false,
      }));

  // Calculate totals
  const allocatedBudget = events.reduce((sum, event) => {
    if (!event.enabled) return sum;
    const kidsTotal = event.amountPerKid * estimatedChildren;
    const staffTotal = event.amountPerStaff * estimatedStaff;
    return sum + kidsTotal + staffTotal;
  }, 0);

  const remainingBudget = totalBudget - allocatedBudget;
  const percentageUsed = totalBudget > 0 ? Math.round((allocatedBudget / totalBudget) * 100) : 0;

  // Update event
  const updateEvent = (eventId: string, updates: Partial<EventAllocation>) => {
    const updatedEvents = events.map((e) =>
      e.eventId === eventId ? { ...e, ...updates } : e
    );
    onChange({ events: updatedEvents });
  };

  // Toggle event enabled
  const toggleEvent = (eventId: string) => {
    updateEvent(eventId, {
      enabled: !events.find((e) => e.eventId === eventId)?.enabled,
    });
  };

  // Add custom event
  const addCustomEvent = () => {
    if (!customEventName.trim()) return;

    const newEvent: EventAllocation = {
      eventId: `custom-${Date.now()}`,
      name: customEventName.trim(),
      enabled: true,
      amountPerKid: 0,
      amountPerStaff: 0,
      isCustom: true,
    };

    onChange({ events: [...events, newEvent] });
    setCustomEventName("");
    setShowCustomInput(false);
  };

  // Remove custom event
  const removeCustomEvent = (eventId: string) => {
    onChange({ events: events.filter((e) => e.eventId !== eventId) });
  };

  // Get icon for event
  const getEventIcon = (eventId: string) => {
    const defaultEvent = DEFAULT_EVENTS.find((e) => e.id === eventId);
    return defaultEvent?.icon || Gift;
  };

  return (
    <>
      {/* Sticky Header + Budget Summary */}
      <div className="sticky top-0 z-10 bg-background pt-4 pb-4 px-4 border-b border-border">
        <div className="max-w-md mx-auto">
          {/* Header */}
          <div className="text-center mb-4">
            <h1 className="text-xl font-bold text-foreground">הקצאת תקציב לאירועים</h1>
            <p className="text-sm text-muted-foreground">הגדירו כמה להקצות לכל אירוע</p>
          </div>

          {/* Budget Summary */}
          <div className="bg-card rounded-2xl p-4 border-2 border-border shadow-lg">
            <div className="flex items-center justify-between text-sm mb-3">
              <div className="text-center">
                <p className="text-muted-foreground">תקציב</p>
                <p className="font-bold text-foreground">₪{totalBudget.toLocaleString()}</p>
              </div>
              <div className="h-8 w-px bg-border" />
              <div className="text-center">
                <p className="text-muted-foreground">מוקצה</p>
                <p className="font-bold text-brand">₪{allocatedBudget.toLocaleString()}</p>
              </div>
              <div className="h-8 w-px bg-border" />
              <div className="text-center">
                <p className="text-muted-foreground">נותר</p>
                <p className={cn(
                  "font-bold",
                  remainingBudget >= 0 ? "text-success" : "text-destructive"
                )}>
                  ₪{remainingBudget.toLocaleString()}
                </p>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div
                className={cn(
                  "h-full rounded-full transition-all duration-300",
                  percentageUsed > 100
                    ? "bg-destructive"
                    : "bg-gradient-to-r from-brand to-info"
                )}
                style={{ width: `${Math.min(percentageUsed, 100)}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground text-center mt-1">
              {percentageUsed}% מהתקציב מוקצה
            </p>
          </div>
        </div>
      </div>

      {/* Events List */}
      <div className="px-4 py-4">
        <div className="max-w-md mx-auto space-y-3">
        {events.map((event) => {
          const Icon = getEventIcon(event.eventId);
          const eventKidsTotal = event.amountPerKid * estimatedChildren;
          const eventStaffTotal = event.amountPerStaff * estimatedStaff;
          const eventTotal = eventKidsTotal + eventStaffTotal;

          return (
            <div
              key={event.eventId}
              className={cn(
                "bg-card rounded-2xl border-2 transition-all",
                event.enabled ? "border-border" : "border-border/50 opacity-60"
              )}
            >
              {/* Event Header */}
              <div
                onClick={() => toggleEvent(event.eventId)}
                className="w-full p-4 flex items-center gap-3 cursor-pointer"
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    toggleEvent(event.eventId);
                  }
                }}
              >
                <div
                  className={cn(
                    "w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-colors",
                    event.enabled
                      ? "bg-brand border-brand"
                      : "border-border"
                  )}
                >
                  {event.enabled && <Check className="h-4 w-4 text-white" />}
                </div>
                <Icon className="h-5 w-5 text-muted-foreground" />
                <span className="font-medium text-foreground flex-1 text-right">
                  {event.name}
                </span>
                {event.enabled && (
                  <span className="text-sm font-bold text-brand">
                    ₪{eventTotal.toLocaleString()}
                  </span>
                )}
                {event.isCustom && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeCustomEvent(event.eventId);
                    }}
                    className="p-1 hover:bg-destructive/10 rounded-lg"
                  >
                    <X className="h-4 w-4 text-destructive" />
                  </button>
                )}
              </div>

              {/* Allocation Inputs */}
              {event.enabled && (
                <div className="px-4 pb-4 space-y-3 border-t border-border pt-3">
                  {/* Kids allocation */}
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-muted-foreground w-16">ילדים:</span>
                    <div className="flex items-center gap-2 flex-1">
                      <Input
                        type="number"
                        min="0"
                        value={event.amountPerKid || ""}
                        onChange={(e) =>
                          updateEvent(event.eventId, {
                            amountPerKid: parseInt(e.target.value) || 0,
                          })
                        }
                        className="h-9 w-20 rounded-lg border text-center"
                      />
                      <span className="text-sm text-muted-foreground">₪</span>
                      <span className="text-sm text-muted-foreground">×</span>
                      <span className="text-sm font-medium">{estimatedChildren}</span>
                      <span className="text-sm text-muted-foreground">=</span>
                      <span className="text-sm font-bold text-foreground">
                        ₪{eventKidsTotal.toLocaleString()}
                      </span>
                    </div>
                  </div>

                  {/* Staff allocation */}
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-muted-foreground w-16">צוות:</span>
                    <div className="flex items-center gap-2 flex-1">
                      <Input
                        type="number"
                        min="0"
                        value={event.amountPerStaff || ""}
                        onChange={(e) =>
                          updateEvent(event.eventId, {
                            amountPerStaff: parseInt(e.target.value) || 0,
                          })
                        }
                        className="h-9 w-20 rounded-lg border text-center"
                      />
                      <span className="text-sm text-muted-foreground">₪</span>
                      <span className="text-sm text-muted-foreground">×</span>
                      <span className="text-sm font-medium">{estimatedStaff}</span>
                      <span className="text-sm text-muted-foreground">=</span>
                      <span className="text-sm font-bold text-foreground">
                        ₪{eventStaffTotal.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {/* Add Custom Event */}
        {showCustomInput ? (
          <div className="bg-card rounded-2xl border-2 border-dashed border-brand/50 p-4">
            <div className="flex gap-2">
              <Input
                type="text"
                placeholder="שם האירוע..."
                value={customEventName}
                onChange={(e) => setCustomEventName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addCustomEvent()}
                className="h-10 rounded-xl border-2"
                autoFocus
              />
              <Button
                onClick={addCustomEvent}
                size="sm"
                className="rounded-xl bg-brand hover:bg-brand-hover"
              >
                הוסף
              </Button>
              <Button
                onClick={() => {
                  setShowCustomInput(false);
                  setCustomEventName("");
                }}
                variant="outline"
                size="sm"
                className="rounded-xl"
              >
                ביטול
              </Button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setShowCustomInput(true)}
            className="w-full p-4 bg-card rounded-2xl border-2 border-dashed border-border hover:border-brand/50 transition-colors flex items-center justify-center gap-2 text-muted-foreground hover:text-foreground"
          >
            <Plus className="h-5 w-5" />
            <span>הוסף אירוע מותאם אישית</span>
          </button>
        )}

        {/* Navigation Buttons - inside scroll area with padding */}
        <div className="flex gap-3 pt-4 pb-4">
          <Button
            variant="outline"
            onClick={onBack}
            className="flex-1 h-12 rounded-xl border-2 gap-2"
          >
            <ArrowRight className="h-4 w-4" />
            חזרה
          </Button>
          <Button
            onClick={onNext}
            className="flex-1 h-12 rounded-xl bg-brand hover:bg-brand-hover text-brand-foreground font-bold shadow-lg transition-all"
          >
            סיום והמשך
          </Button>
        </div>
        </div>
      </div>
    </>
  );
}
