"use client";

import { useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  Calendar,
  ChevronDown,
  Loader2,
  Check,
  X,
  Plus,
  Star,
  Sparkles,
  TreeDeciduous,
  PartyPopper,
  Sun,
  Heart,
  Flag,
  GraduationCap,
  Cake,
  Gift,
} from "lucide-react";
import { updateEventAllocations } from "@/app/actions/budget";

// Default events matching onboarding
const DEFAULT_EVENTS = [
  { id: "rosh-hashana", name: "ראש השנה", icon: Star },
  { id: "hanukkah", name: "חנוכה", icon: Sparkles },
  { id: "tu-bishvat", name: 'ט"ו בשבט', icon: TreeDeciduous },
  { id: "purim", name: "פורים", icon: PartyPopper },
  { id: "passover", name: "פסח", icon: Sun },
  { id: "teacher-day", name: "יום המחנך", icon: Heart },
  { id: "independence-day", name: "יום העצמאות", icon: Flag },
  { id: "end-of-year", name: "מתנות סוף שנה", icon: GraduationCap },
  { id: "kids-birthdays", name: "ימי הולדת ילדים", icon: Cake },
  { id: "staff-birthdays", name: "ימי הולדת צוות", icon: Gift },
];

// Event icons mapping
const EVENT_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  "rosh-hashana": Star,
  "hanukkah": Sparkles,
  "tu-bishvat": TreeDeciduous,
  "purim": PartyPopper,
  "passover": Sun,
  "teacher-day": Heart,
  "independence-day": Flag,
  "end-of-year": GraduationCap,
  "kids-birthdays": Cake,
  "staff-birthdays": Gift,
};

type Event = {
  id: string;
  name: string;
  event_type: string;
  allocated_budget?: number;
  amount_per_kid?: number;
  amount_per_staff?: number;
  allocated_for_kids?: number;
  allocated_for_staff?: number;
  kids_count?: number;
  staff_count?: number;
};

type EventAllocationsBlockProps = {
  classId: string;
  events: Event[];
  totalBudget: number;
  estimatedChildren: number;
  estimatedStaff: number;
  onAllocationsChange?: () => void;
};

type EventAllocation = {
  id: string;
  eventType: string;
  name: string;
  enabled: boolean;
  amountPerKid: number;
  amountPerStaff: number;
  isNew?: boolean;
  isCustom?: boolean;
};

export function EventAllocationsBlock({
  classId,
  events,
  totalBudget,
  estimatedChildren,
  estimatedStaff,
  onAllocationsChange,
}: EventAllocationsBlockProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isExpanded, setIsExpanded] = useState(false);

  // Event allocations state
  const [allocations, setAllocations] = useState<EventAllocation[]>([]);

  // Custom event input
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [customEventName, setCustomEventName] = useState("");

  // Calculate current allocated amount from events prop
  const currentAllocatedBudget = events.reduce(
    (sum, e) => sum + (e.allocated_budget || 0),
    0
  );

  // Initialize allocations from events
  const initializeAllocations = () => {
    const allAllocations: EventAllocation[] = [];

    // Add default events (either from existing or as new disabled)
    DEFAULT_EVENTS.forEach((defaultEvent) => {
      const existingEvent = events.find((e) => e.event_type === defaultEvent.id);
      if (existingEvent) {
        allAllocations.push({
          id: existingEvent.id,
          eventType: existingEvent.event_type,
          name: existingEvent.name,
          enabled: (existingEvent.allocated_budget || 0) > 0,
          amountPerKid: existingEvent.amount_per_kid || 0,
          amountPerStaff: existingEvent.amount_per_staff || 0,
          isNew: false,
          isCustom: false,
        });
      } else {
        allAllocations.push({
          id: `new-${defaultEvent.id}`,
          eventType: defaultEvent.id,
          name: defaultEvent.name,
          enabled: false,
          amountPerKid: 0,
          amountPerStaff: 0,
          isNew: true,
          isCustom: false,
        });
      }
    });

    // Add custom events (events not in default list)
    events.forEach((event) => {
      const isDefault = DEFAULT_EVENTS.some((d) => d.id === event.event_type);
      if (!isDefault) {
        allAllocations.push({
          id: event.id,
          eventType: event.event_type,
          name: event.name,
          enabled: (event.allocated_budget || 0) > 0,
          amountPerKid: event.amount_per_kid || 0,
          amountPerStaff: event.amount_per_staff || 0,
          isNew: false,
          isCustom: true,
        });
      }
    });

    return allAllocations;
  };

  // Reset allocations when expanding or when events change
  useEffect(() => {
    if (isExpanded) {
      setAllocations(initializeAllocations());
    }
  }, [isExpanded, events]);

  // Calculate totals from current allocations
  const allocatedBudget = allocations.reduce((sum, alloc) => {
    if (!alloc.enabled) return sum;
    const kidsTotal = alloc.amountPerKid * estimatedChildren;
    const staffTotal = alloc.amountPerStaff * estimatedStaff;
    return sum + kidsTotal + staffTotal;
  }, 0);

  const remainingBudget = totalBudget - allocatedBudget;
  const percentageUsed = totalBudget > 0 ? Math.round((allocatedBudget / totalBudget) * 100) : 0;

  // Summary for collapsed view
  const currentPercentageUsed = totalBudget > 0
    ? Math.round((currentAllocatedBudget / totalBudget) * 100)
    : 0;

  // Get icon for event
  const getEventIcon = (eventType: string) => {
    return EVENT_ICONS[eventType] || Calendar;
  };

  // Toggle event enabled
  const toggleEvent = (eventType: string) => {
    setAllocations((prev) =>
      prev.map((a) =>
        a.eventType === eventType ? { ...a, enabled: !a.enabled } : a
      )
    );
  };

  // Update event allocation
  const updateAllocation = (
    eventType: string,
    field: "amountPerKid" | "amountPerStaff",
    value: number
  ) => {
    setAllocations((prev) =>
      prev.map((a) =>
        a.eventType === eventType ? { ...a, [field]: value } : a
      )
    );
  };

  // Add custom event
  const addCustomEvent = () => {
    if (!customEventName.trim()) return;

    const newAllocation: EventAllocation = {
      id: `new-custom-${Date.now()}`,
      eventType: `custom-${Date.now()}`,
      name: customEventName.trim(),
      enabled: true,
      amountPerKid: 0,
      amountPerStaff: 0,
      isNew: true,
      isCustom: true,
    };

    setAllocations((prev) => [...prev, newAllocation]);
    setCustomEventName("");
    setShowCustomInput(false);
  };

  // Remove custom event
  const removeCustomEvent = (eventType: string) => {
    setAllocations((prev) => prev.filter((a) => a.eventType !== eventType));
  };

  // Handle expand/collapse
  const handleToggle = () => {
    if (isExpanded) {
      // Reset when closing without saving
      setShowCustomInput(false);
      setCustomEventName("");
    }
    setIsExpanded(!isExpanded);
  };

  // Handle save
  const handleSave = () => {
    startTransition(async () => {
      // Update event allocations
      const eventUpdates = allocations
        .filter((a) => a.enabled)
        .map((a) => ({
          id: a.isNew ? undefined : a.id,
          eventType: a.eventType,
          name: a.name,
          amountPerKid: a.amountPerKid,
          amountPerStaff: a.amountPerStaff,
          allocatedBudget: a.amountPerKid * estimatedChildren + a.amountPerStaff * estimatedStaff,
          allocatedForKids: a.amountPerKid * estimatedChildren,
          allocatedForStaff: a.amountPerStaff * estimatedStaff,
          kidsCount: estimatedChildren,
          staffCount: estimatedStaff,
          isCustom: a.isCustom,
        }));

      // Get events to disable (were enabled before, now disabled)
      const disabledEventIds = allocations
        .filter((a) => !a.enabled && !a.isNew)
        .map((a) => a.id);

      await updateEventAllocations({
        classId,
        events: eventUpdates,
        disabledEventIds,
      });

      router.refresh();
      onAllocationsChange?.();
      setIsExpanded(false);
    });
  };

  // Handle cancel
  const handleCancel = () => {
    setShowCustomInput(false);
    setCustomEventName("");
    setIsExpanded(false);
  };

  // Count enabled events
  const enabledEventsCount = allocations.filter((a) => a.enabled).length;

  return (
    <div
      className={cn(
        "bg-card rounded-2xl border-2 shadow-sm transition-all overflow-hidden",
        isExpanded ? "border-brand" : "border-border hover:border-brand/50"
      )}
    >
      {/* Collapsed Header - Always visible */}
      <button
        onClick={handleToggle}
        className="w-full p-4 flex items-center justify-between text-right"
        disabled={isPending}
      >
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-brand/10">
            <Calendar className="h-5 w-5 text-brand" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">הקצאות לאירועים</h3>
            <p className="text-sm text-muted-foreground">
              {events.filter((e) => (e.allocated_budget || 0) > 0).length} אירועים פעילים
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-left">
            <p className="text-xs text-muted-foreground">מוקצה</p>
            <p className="text-lg font-semibold text-brand">
              ₪{currentAllocatedBudget.toLocaleString()}
              <span className="text-sm font-normal text-muted-foreground mr-1">
                ({currentPercentageUsed}%)
              </span>
            </p>
          </div>
          <ChevronDown
            className={cn(
              "h-5 w-5 text-muted-foreground transition-transform",
              isExpanded && "rotate-180"
            )}
          />
        </div>
      </button>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="px-4 pb-4 space-y-4 border-t border-border pt-4">
          {/* Budget Summary */}
          <div className="bg-muted/50 rounded-xl p-3 space-y-2">
            <div className="flex items-center justify-between text-sm">
              <div className="text-center">
                <p className="text-xs text-muted-foreground">תקציב</p>
                <p className="font-bold text-foreground">₪{totalBudget.toLocaleString()}</p>
              </div>
              <div className="h-6 w-px bg-border" />
              <div className="text-center">
                <p className="text-xs text-muted-foreground">מוקצה</p>
                <p className="font-bold text-brand">₪{allocatedBudget.toLocaleString()}</p>
              </div>
              <div className="h-6 w-px bg-border" />
              <div className="text-center">
                <p className="text-xs text-muted-foreground">נותר</p>
                <p
                  className={cn(
                    "font-bold",
                    remainingBudget >= 0 ? "text-success" : "text-destructive"
                  )}
                >
                  ₪{remainingBudget.toLocaleString()}
                </p>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="h-1.5 bg-background rounded-full overflow-hidden">
              <div
                className={cn(
                  "h-full rounded-full transition-all duration-300",
                  percentageUsed > 100 ? "bg-destructive" : "bg-brand"
                )}
                style={{ width: `${Math.min(percentageUsed, 100)}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground text-center">
              {percentageUsed}% מהתקציב מוקצה
            </p>
          </div>

          {/* Events List */}
          <div className="space-y-2 max-h-[400px] overflow-y-auto">
            {allocations.map((alloc) => {
              const Icon = getEventIcon(alloc.eventType);
              const eventKidsTotal = alloc.amountPerKid * estimatedChildren;
              const eventStaffTotal = alloc.amountPerStaff * estimatedStaff;
              const eventTotal = eventKidsTotal + eventStaffTotal;

              return (
                <div
                  key={alloc.eventType}
                  className={cn(
                    "bg-background rounded-xl border transition-all",
                    alloc.enabled ? "border-border" : "border-border/50 opacity-60"
                  )}
                >
                  {/* Event Header */}
                  <div
                    onClick={() => toggleEvent(alloc.eventType)}
                    className="w-full p-3 flex items-center gap-2 cursor-pointer"
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        toggleEvent(alloc.eventType);
                      }
                    }}
                  >
                    <div
                      className={cn(
                        "w-5 h-5 rounded flex items-center justify-center transition-colors",
                        alloc.enabled ? "bg-brand border-brand" : "border-2 border-border"
                      )}
                    >
                      {alloc.enabled && <Check className="h-3 w-3 text-white" />}
                    </div>
                    <Icon className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium text-sm text-foreground flex-1 text-right">
                      {alloc.name}
                    </span>
                    {alloc.enabled && (
                      <span className="text-xs font-bold text-brand">
                        ₪{eventTotal.toLocaleString()}
                      </span>
                    )}
                    {alloc.isCustom && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          removeCustomEvent(alloc.eventType);
                        }}
                        className="p-1 hover:bg-destructive/10 rounded"
                      >
                        <X className="h-3 w-3 text-destructive" />
                      </button>
                    )}
                  </div>

                  {/* Allocation Inputs */}
                  {alloc.enabled && (
                    <div className="px-3 pb-3 space-y-2 border-t border-border pt-2">
                      {/* Kids allocation */}
                      <div className="flex items-center gap-2 text-sm">
                        <span className="text-muted-foreground w-12">ילדים:</span>
                        <Input
                          type="number"
                          min="0"
                          value={alloc.amountPerKid || ""}
                          onChange={(e) =>
                            updateAllocation(
                              alloc.eventType,
                              "amountPerKid",
                              parseInt(e.target.value) || 0
                            )
                          }
                          onClick={(e) => e.stopPropagation()}
                          className="h-8 w-16 rounded text-center text-sm"
                          disabled={isPending}
                        />
                        <span className="text-muted-foreground">₪ ×</span>
                        <span className="font-medium">{estimatedChildren}</span>
                        <span className="text-muted-foreground">=</span>
                        <span className="font-bold">₪{eventKidsTotal.toLocaleString()}</span>
                      </div>

                      {/* Staff allocation */}
                      <div className="flex items-center gap-2 text-sm">
                        <span className="text-muted-foreground w-12">צוות:</span>
                        <Input
                          type="number"
                          min="0"
                          value={alloc.amountPerStaff || ""}
                          onChange={(e) =>
                            updateAllocation(
                              alloc.eventType,
                              "amountPerStaff",
                              parseInt(e.target.value) || 0
                            )
                          }
                          onClick={(e) => e.stopPropagation()}
                          className="h-8 w-16 rounded text-center text-sm"
                          disabled={isPending}
                        />
                        <span className="text-muted-foreground">₪ ×</span>
                        <span className="font-medium">{estimatedStaff}</span>
                        <span className="text-muted-foreground">=</span>
                        <span className="font-bold">₪{eventStaffTotal.toLocaleString()}</span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

            {/* Add Custom Event */}
            {showCustomInput ? (
              <div className="bg-background rounded-xl border-2 border-dashed border-brand/50 p-3">
                <div className="flex gap-2">
                  <Input
                    type="text"
                    placeholder="שם האירוע..."
                    value={customEventName}
                    onChange={(e) => setCustomEventName(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && addCustomEvent()}
                    className="h-9 rounded-xl"
                    autoFocus
                    disabled={isPending}
                  />
                  <Button
                    onClick={addCustomEvent}
                    size="sm"
                    className="rounded-xl bg-brand hover:bg-brand/90"
                    disabled={isPending}
                  >
                    הוספה
                  </Button>
                  <Button
                    onClick={() => {
                      setShowCustomInput(false);
                      setCustomEventName("");
                    }}
                    variant="outline"
                    size="sm"
                    className="rounded-xl"
                    disabled={isPending}
                  >
                    ביטול
                  </Button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setShowCustomInput(true)}
                className="w-full p-3 bg-background rounded-xl border-2 border-dashed border-border hover:border-brand/50 transition-colors flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-foreground"
                disabled={isPending}
              >
                <Plus className="h-4 w-4" />
                <span>הוספת אירוע מותאם אישית</span>
              </button>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            <Button
              variant="outline"
              onClick={handleCancel}
              className="flex-1 rounded-xl"
              disabled={isPending}
            >
              <X className="h-4 w-4 ml-2" />
              ביטול
            </Button>
            <Button
              onClick={handleSave}
              className="flex-1 rounded-xl bg-brand hover:bg-brand/90 gap-2"
              disabled={isPending}
            >
              {isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Check className="h-4 w-4" />
              )}
              שמירה
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
