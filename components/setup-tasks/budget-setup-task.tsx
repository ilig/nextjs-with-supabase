"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Check, Users, Wallet } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type EventTemplate = {
  id: string;
  name: string;
  icon: string;
  headcountType: "children" | "staff"; // determines which count to use for calculation
};

// Events in chronological order (school year), birthdays at the end
const EVENT_TEMPLATES: EventTemplate[] = [
  { id: "rosh-hashanah", name: "ראש השנה", icon: "🍎", headcountType: "children" },
  { id: "hanukkah", name: "חנוכה", icon: "🕎", headcountType: "children" },
  { id: "tu-bishvat", name: "ט\"ו בשבט", icon: "🌳", headcountType: "children" },
  { id: "purim", name: "פורים", icon: "🎭", headcountType: "children" },
  { id: "pesach", name: "פסח", icon: "🍷", headcountType: "children" },
  { id: "yom-hamechanech", name: "יום המחנך", icon: "👩‍🏫", headcountType: "staff" },
  { id: "yom-haatzmaut", name: "יום העצמאות", icon: "🇮🇱", headcountType: "children" },
  { id: "end-of-year", name: "מתנות סוף שנה", icon: "🎓", headcountType: "children" },
  { id: "birthdays-kids", name: "ימי הולדת ילדים", icon: "🎂", headcountType: "children" },
  { id: "birthdays-staff", name: "ימי הולדת צוות", icon: "🎁", headcountType: "staff" },
];

interface BudgetSetupTaskProps {
  classId: string;
  estimatedChildren: number;
  onComplete: () => void;
  onCancel: () => void;
}

export function BudgetSetupTask({
  classId,
  estimatedChildren,
  onComplete,
  onCancel,
}: BudgetSetupTaskProps) {
  const [step, setStep] = useState<1 | 2>(1);
  const [amountPerChild, setAmountPerChild] = useState<number>(200);
  const [childrenCount, setChildrenCount] = useState<number>(estimatedChildren);
  const [selectedEvents, setSelectedEvents] = useState<Set<string>>(new Set());
  const [eventPerUnitCost, setEventPerUnitCost] = useState<Record<string, number>>({});
  const [eventHeadcount, setEventHeadcount] = useState<Record<string, number>>({});
  const [customEventName, setCustomEventName] = useState("");
  const [customEvents, setCustomEvents] = useState<EventTemplate[]>([]);
  const [loading, setLoading] = useState(false);

  // Calculate total budget based on children count
  const totalBudget = amountPerChild * childrenCount;

  // Get headcount for an event - use custom value if set, otherwise use default based on type
  const getHeadcount = (event: EventTemplate) => {
    if (eventHeadcount[event.id] !== undefined) {
      return eventHeadcount[event.id];
    }
    // Default: children count for most events, 2 for staff events
    return event.headcountType === "staff" ? 2 : childrenCount;
  };

  const updateEventHeadcount = (eventId: string, count: number) => {
    setEventHeadcount({
      ...eventHeadcount,
      [eventId]: Math.max(0, count),
    });
  };

  // Calculate allocated amount for an event
  const getEventAllocatedAmount = (eventId: string) => {
    const event = [...EVENT_TEMPLATES, ...customEvents].find(e => e.id === eventId);
    if (!event || !selectedEvents.has(eventId)) return 0;
    const perUnit = eventPerUnitCost[eventId] || 0;
    return perUnit * getHeadcount(event);
  };

  const toggleEvent = (eventId: string) => {
    const newSelected = new Set(selectedEvents);
    if (newSelected.has(eventId)) {
      newSelected.delete(eventId);
    } else {
      newSelected.add(eventId);
    }
    setSelectedEvents(newSelected);
  };

  const updatePerUnitCost = (eventId: string, amount: number) => {
    setEventPerUnitCost({
      ...eventPerUnitCost,
      [eventId]: Math.max(0, amount),
    });
  };

  const addCustomEvent = () => {
    if (!customEventName.trim()) {
      alert("אנא הזינו שם לאירוע");
      return;
    }

    const newEvent: EventTemplate = {
      id: `custom-${Date.now()}`,
      name: customEventName,
      icon: "✨",
      headcountType: "children",
    };

    setCustomEvents([...customEvents, newEvent]);
    setSelectedEvents(new Set([...selectedEvents, newEvent.id]));
    setCustomEventName("");
  };

  const allocatedBudget = Array.from(selectedEvents).reduce((sum, eventId) => {
    return sum + getEventAllocatedAmount(eventId);
  }, 0);

  const remainingBudget = totalBudget - allocatedBudget;

  const handleStep1Next = () => {
    if (amountPerChild <= 0) {
      alert("אנא הזינו סכום תקציב תקין");
      return;
    }
    setStep(2);
  };

  const handleSave = async () => {
    if (selectedEvents.size === 0) {
      alert("אנא בחרו לפחות אירוע אחד");
      return;
    }

    setLoading(true);

    try {
      const supabase = createClient();

      // Update class with budget info
      const { error: classError } = await supabase
        .from("classes")
        .update({
          total_budget: totalBudget,
          budget_type: "per-child",
          budget_amount: amountPerChild,
        })
        .eq("id", classId);

      if (classError) throw classError;

      // Create events
      const allEvents = [...EVENT_TEMPLATES, ...customEvents];
      const eventsToInsert = Array.from(selectedEvents).map((eventId) => {
        const event = allEvents.find((e) => e.id === eventId);
        const allocatedAmount = getEventAllocatedAmount(eventId);
        return {
          class_id: classId,
          name: event!.name,
          icon: event!.icon,
          allocated_budget: allocatedAmount,
          spent_amount: 0,
          event_type: eventId.includes("birthday") ? "birthday" : "holiday",
        };
      });

      const { error: eventsError } = await supabase
        .from("events")
        .insert(eventsToInsert);

      if (eventsError) throw eventsError;

      // Update setup progress
      const storedProgress = localStorage.getItem(`setup_progress_${classId}`);
      const progress = storedProgress ? JSON.parse(storedProgress) : {};
      progress.completedTasks = progress.completedTasks || [];

      if (!progress.completedTasks.includes("setup_budget")) {
        progress.completedTasks.push("setup_budget");
      }

      localStorage.setItem(`setup_progress_${classId}`, JSON.stringify(progress));

      onComplete();
    } catch (error: any) {
      console.error("Error saving budget:", error?.message || error?.code || JSON.stringify(error));
      alert("שגיאה בשמירת הנתונים. אנא נסו שוב.");
    } finally {
      setLoading(false);
    }
  };

  // Step 1: Budget amount per child
  if (step === 1) {
    return (
      <div className="space-y-4 p-4" dir="rtl">
        <h3 className="text-lg font-semibold text-center">איזה סכום תרצו לגבות?</h3>

        <Card className="p-4 border-brand bg-brand-muted">
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-foreground">
              <Users className="h-4 w-4 text-brand flex-shrink-0" />
              <span>מספר ילדים בכיתה:</span>
              <Input
                type="number"
                value={childrenCount}
                onChange={(e) => setChildrenCount(parseInt(e.target.value) || 0)}
                className="w-16 h-8 text-center font-medium"
              />
            </div>

            <div className="flex items-center gap-2 text-foreground">
              <Wallet className="h-4 w-4 text-brand flex-shrink-0" />
              <span>סכום לכל ילד (₪):</span>
              <Input
                type="number"
                value={amountPerChild}
                onChange={(e) => setAmountPerChild(parseInt(e.target.value) || 0)}
                placeholder="200"
                className="w-20 h-8 text-center font-bold"
              />
            </div>

            <div className="text-center bg-card rounded-xl p-3 border border-border">
              <p className="text-muted-foreground">
                {childrenCount} ילדים × ₪{amountPerChild} = <span className="font-semibold text-brand text-lg">₪{totalBudget.toLocaleString()}</span>
              </p>
            </div>
          </div>
        </Card>

        <div className="flex gap-2 pt-4 border-t">
          <Button variant="ghost" onClick={onCancel} className="flex-1">
            ביטול
          </Button>
          <Button onClick={handleStep1Next} className="flex-1">
            המשך לבחירת אירועים ←
          </Button>
        </div>
      </div>
    );
  }

  // Step 2: Event selection and allocation
  return (
    <div className="space-y-4 p-4" dir="rtl">
      <div>
        <h3 className="text-lg font-semibold">איזה אירועים רלוונטיים עבורכם?</h3>
        <div className="flex items-center justify-between mt-2 p-3 bg-brand-muted rounded-xl border border-brand/20">
          <div>
            <p className="text-sm font-semibold">תקציב כולל</p>
            <p className="text-2xl font-bold text-brand">
              ₪{totalBudget.toLocaleString()}
            </p>
          </div>
          <div className="text-left">
            <p className="text-sm">מוקצה: ₪{allocatedBudget.toLocaleString()}</p>
            <p className={`text-sm font-semibold ${remainingBudget < 0 ? "text-destructive" : "text-success"}`}>
              נותר: ₪{remainingBudget.toLocaleString()}
            </p>
          </div>
        </div>
      </div>

      {/* Column Headers */}
      <div className="flex items-center gap-3 px-3 text-xs text-muted-foreground font-medium">
        <div className="w-5"></div>{/* Checkbox space */}
        <div className="w-7"></div>{/* Icon space */}
        <div className="flex-1"></div>{/* Event name space */}
        <div className="flex items-center gap-2 ml-3">
          <span className="w-[88px] text-center block">סכום</span>
          <span className="w-4 text-center">×</span>
          <span className="w-[72px] text-center block">כמות</span>
          <span className="w-[90px] text-center block">סה"כ</span>
        </div>
      </div>

      <div className="max-h-96 overflow-y-auto space-y-2">
        {/* All events */}
        {EVENT_TEMPLATES.map((event) => {
          const isSelected = selectedEvents.has(event.id);
          const headcount = getHeadcount(event);
          const perUnit = eventPerUnitCost[event.id] || 0;
          const totalForEvent = perUnit * headcount;

          return (
            <Card
              key={event.id}
              className={`p-3 cursor-pointer transition-all ${
                isSelected ? "border-brand bg-brand-muted" : "border-border"
              }`}
              onClick={() => toggleEvent(event.id)}
            >
              <div className="flex items-center gap-3">
                <Checkbox checked={isSelected} />
                <span className="text-lg">{event.icon}</span>
                <div className="flex-1">
                  <p className="font-medium">{event.name}</p>
                </div>
                {isSelected && (
                  <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                    <div className="relative">
                      <Input
                        type="number"
                        value={perUnit || ""}
                        onChange={(e) =>
                          updatePerUnitCost(event.id, parseInt(e.target.value) || 0)
                        }
                        placeholder="0"
                        className="w-[88px] h-8 text-sm text-center pr-6"
                      />
                      <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">₪</span>
                    </div>
                    <span className="text-xs text-muted-foreground">×</span>
                    <Input
                      type="number"
                      value={headcount || ""}
                      onChange={(e) =>
                        updateEventHeadcount(event.id, parseInt(e.target.value) || 0)
                      }
                      placeholder="0"
                      className="w-[72px] h-8 text-sm text-center"
                    />
                    <span className="text-sm font-medium text-brand w-[90px] text-center">
                      = ₪{totalForEvent.toLocaleString()}
                    </span>
                  </div>
                )}
              </div>
            </Card>
          );
        })}

        {/* Custom events */}
        {customEvents.map((event) => {
          const isSelected = selectedEvents.has(event.id);
          const headcount = getHeadcount(event);
          const perUnit = eventPerUnitCost[event.id] || 0;
          const totalForEvent = perUnit * headcount;

          return (
            <Card
              key={event.id}
              className={`p-3 cursor-pointer transition-all ${
                isSelected ? "border-brand bg-brand-muted" : "border-border"
              }`}
              onClick={() => toggleEvent(event.id)}
            >
              <div className="flex items-center gap-3">
                <Checkbox checked={isSelected} />
                <span className="text-lg">{event.icon}</span>
                <div className="flex-1">
                  <p className="font-medium">{event.name}</p>
                </div>
                {isSelected && (
                  <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                    <div className="relative">
                      <Input
                        type="number"
                        value={perUnit || ""}
                        onChange={(e) =>
                          updatePerUnitCost(event.id, parseInt(e.target.value) || 0)
                        }
                        placeholder="0"
                        className="w-[88px] h-8 text-sm text-center pr-6"
                      />
                      <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">₪</span>
                    </div>
                    <span className="text-xs text-muted-foreground">×</span>
                    <Input
                      type="number"
                      value={headcount || ""}
                      onChange={(e) =>
                        updateEventHeadcount(event.id, parseInt(e.target.value) || 0)
                      }
                      placeholder="0"
                      className="w-[72px] h-8 text-sm text-center"
                    />
                    <span className="text-sm font-medium text-brand w-[90px] text-center">
                      = ₪{totalForEvent.toLocaleString()}
                    </span>
                  </div>
                )}
              </div>
            </Card>
          );
        })}

        {/* Add custom event */}
        <Card className="p-3 bg-muted">
          <div className="flex items-center gap-2">
            <Input
              value={customEventName}
              onChange={(e) => setCustomEventName(e.target.value)}
              placeholder="הוסף אירוע מותאם אישית"
              className="flex-1"
              onKeyDown={(e) => {
                if (e.key === "Enter") addCustomEvent();
              }}
            />
            <Button size="sm" onClick={addCustomEvent}>
              + הוסף
            </Button>
          </div>
        </Card>
      </div>

      {remainingBudget < 0 && (
        <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-3">
          <p className="text-sm text-destructive font-semibold">
            ⚠️ עברתם את התקציב ב-₪{Math.abs(remainingBudget).toLocaleString()}
          </p>
          <p className="text-xs text-destructive">אנא הפחיתו את ההקצאות או הגדילו את התקציב</p>
        </div>
      )}

      <div className="flex gap-2 pt-4 border-t">
        <Button variant="ghost" onClick={() => setStep(1)} className="flex-1" disabled={loading}>
          → חזרה
        </Button>
        <Button
          onClick={handleSave}
          className="flex-1"
          disabled={loading || remainingBudget < 0}
        >
          {loading ? (
            "שומר..."
          ) : (
            <>
              <Check className="h-4 w-4 ml-2" />
              אישור ושמירה
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
