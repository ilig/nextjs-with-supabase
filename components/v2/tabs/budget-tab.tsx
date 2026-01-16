"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Wallet,
  TrendingDown,
  PiggyBank,
  Calendar,
  Check,
  X,
  ChevronLeft,
  ChevronDown,
  Pencil,
  Users,
  AlertCircle,
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
  Plus,
  Receipt,
  Trash2,
  Eye,
  Loader2,
  Tag,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createExpense, deleteExpense } from "@/app/actions/budget";

type Event = {
  id: string;
  name: string;
  event_type: string;
  event_date?: string;
  allocated_budget?: number;
  amount_per_kid?: number;
  amount_per_staff?: number;
  allocated_for_kids?: number;
  allocated_for_staff?: number;
  is_paid?: boolean;
  kids_count?: number;
  staff_count?: number;
};

type Child = {
  id: string;
  name: string;
  payment_status: "paid" | "unpaid";
  payment_date?: string;
};

type Expense = {
  id: string;
  description: string;
  amount: number;
  expense_date: string;
  receipt_url?: string;
  event_id?: string;
  events?: {
    id: string;
    name: string;
    event_type: string;
  };
};

type BudgetTabProps = {
  budgetMetrics?: {
    total: number;
    allocated: number;
    spent: number;
    remaining: number;
    amountPerChild?: number;
    collected?: number;
  };
  events?: Event[];
  expenses?: Expense[];
  children?: Child[];
  estimatedChildren?: number;
  estimatedStaff?: number;
  className?: string;
  classId?: string;
  onEditBudget?: () => void;
  onSendRegistrationLink?: () => void;
  onMarkEventPaid?: (eventId: string) => void;
  onEditAllocation?: (eventId: string) => void;
  onUpdateEventAllocation?: (eventId: string, amountPerKid: number, amountPerStaff: number) => void;
  onToggleEventEnabled?: (eventId: string, enabled: boolean) => void;
  onBannerClick?: () => void;
  onAddCustomEvent?: (name: string) => void;
  onAddExpense?: (expense: { description: string; amount: number; expense_date: string; event_id?: string }) => void;
  onDeleteExpense?: (expenseId: string) => void;
};

type SelectedBlock = "budget" | "expenses" | "balance" | null;

// Event icons mapping (matching onboarding step)
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

// Get icon for event based on event_type or name
function getEventIcon(event: Event): React.ComponentType<{ className?: string }> {
  // Try to match by event_type first
  if (event.event_type && EVENT_ICONS[event.event_type]) {
    return EVENT_ICONS[event.event_type];
  }
  // Try to match by common Hebrew names
  const name = event.name.toLowerCase();
  if (name.includes("ראש השנה")) return Star;
  if (name.includes("חנוכה")) return Sparkles;
  if (name.includes("שבט") || name.includes("tu-bishvat")) return TreeDeciduous;
  if (name.includes("פורים")) return PartyPopper;
  if (name.includes("פסח")) return Sun;
  if (name.includes("מחנך") || name.includes("מורה")) return Heart;
  if (name.includes("עצמאות")) return Flag;
  if (name.includes("סוף שנה") || name.includes("סיום")) return GraduationCap;
  if (name.includes("הולדת ילד") || name.includes("ימי הולדת ילדים")) return Cake;
  if (name.includes("הולדת צוות") || name.includes("ימי הולדת צוות")) return Gift;
  return Calendar;
}

// Hebrew month names
const HEBREW_MONTHS = [
  "ינואר", "פברואר", "מרץ", "אפריל", "מאי", "יוני",
  "יולי", "אוגוסט", "ספטמבר", "אוקטובר", "נובמבר", "דצמבר"
];

// Format date to Hebrew
function formatHebrewDate(dateStr?: string): string {
  if (!dateStr) return "לא נקבע";
  const date = new Date(dateStr);
  const day = date.getDate();
  const month = HEBREW_MONTHS[date.getMonth()];
  return `${day} ${month}`;
}

// Sort events by date
function sortEventsByDate(events: Event[]): Event[] {
  return [...events].sort((a, b) => {
    if (!a.event_date) return 1;
    if (!b.event_date) return -1;
    return new Date(a.event_date).getTime() - new Date(b.event_date).getTime();
  });
}

// Filter to only future events
function filterFutureEvents(events: Event[]): Event[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return events.filter(e => {
    if (!e.event_date) return true;
    return new Date(e.event_date) >= today;
  });
}

export function BudgetTab({
  budgetMetrics,
  events = [],
  expenses = [],
  children = [],
  estimatedChildren = 0,
  estimatedStaff = 0,
  className,
  classId,
  onEditBudget,
  onSendRegistrationLink,
  onMarkEventPaid,
  onEditAllocation,
  onUpdateEventAllocation,
  onToggleEventEnabled,
  onBannerClick,
  onAddCustomEvent,
  onAddExpense,
  onDeleteExpense,
}: BudgetTabProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [selectedBlock, setSelectedBlock] = useState<SelectedBlock>(null);
  const [expandedEventId, setExpandedEventId] = useState<string | null>(null);
  const [showCustomEventInput, setShowCustomEventInput] = useState(false);
  const [customEventName, setCustomEventName] = useState("");

  // Expense modal state
  const [expenseModalOpen, setExpenseModalOpen] = useState(false);
  const [deleteExpenseId, setDeleteExpenseId] = useState<string | null>(null);
  const [expenseForm, setExpenseForm] = useState({
    description: "",
    amount: "",
    expense_date: new Date().toISOString().split("T")[0],
    event_id: "",
  });
  const [expenseFilter, setExpenseFilter] = useState<string>("all");

  const {
    total = 0,
    allocated = 0,
    spent = 0,
    remaining = 0,
    amountPerChild = 0,
    collected = 0,
  } = budgetMetrics || {};

  // Calculate kids vs staff allocation
  const kidsAllocation = events.reduce((sum, e) => sum + (e.allocated_for_kids || 0), 0);
  const staffAllocation = events.reduce((sum, e) => sum + (e.allocated_for_staff || 0), 0);

  // Collection tracking
  const paidChildren = children.filter(c => c.payment_status === "paid");
  const unpaidChildren = children.filter(c => c.payment_status === "unpaid");
  const registeredCount = children.length;
  const notRegisteredCount = Math.max(0, estimatedChildren - registeredCount);
  const collectionPercentage = total > 0 ? Math.round((collected / total) * 100) : 0;

  // Pie chart data - spent vs remaining (budget utilization)
  const budgetPieData = [
    { name: "נוצלו", value: spent, color: "#f97316" },
    { name: "נותרו", value: remaining, color: "#22c55e" },
  ].filter(item => item.value > 0);

  // Pie chart data - kids vs staff (expense distribution)
  const allocationPieData = [
    { name: "ילדים", value: kidsAllocation, color: "#8b5cf6" },
    { name: "צוות", value: staffAllocation, color: "#3b82f6" },
  ].filter(item => item.value > 0);

  // Get budgeted events for the horizontal timeline bar chart (future only)
  const budgetedEvents = sortEventsByDate(filterFutureEvents(events))
    .filter((e) => e.allocated_budget && e.allocated_budget > 0);

  // Calculate max budget for bar width scaling
  const maxBudget = Math.max(...budgetedEvents.map(e => e.allocated_budget || 0), 1);

  // Handle block click - toggle if same block clicked
  const handleBlockClick = (block: SelectedBlock) => {
    setSelectedBlock(prev => prev === block ? null : block);
  };

  // Unpaid events for Block 3
  const unpaidEvents = events.filter(e => !e.is_paid && e.allocated_budget && e.allocated_budget > 0);

  return (
    <div className={cn("p-4 md:p-6 space-y-6", className)}>
      {/* Budget Header */}
      <div className="flex items-center gap-3">
        <div className="p-3 rounded-2xl bg-gradient-to-br from-purple-500 to-blue-600">
          <Wallet className="h-6 w-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">תקציב הכיתה</h1>
          <p className="text-sm text-muted-foreground">מעקב אחר הכנסות והוצאות</p>
        </div>
      </div>

      {/* Collection Banner - shown when collection < 100% */}
      {collectionPercentage < 100 && total > 0 && (
        <button
          onClick={onBannerClick}
          className="w-full text-right bg-gradient-to-r from-sky-500/15 to-blue-500/15 rounded-xl px-3 py-2.5 border border-sky-500/30 hover:border-sky-500/50 transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-2 mb-1.5">
            <PiggyBank className="h-4 w-4 text-sky-600 dark:text-sky-400 flex-shrink-0" />
            <span className="font-semibold text-sm text-foreground flex-1">
              נאספו ₪{collected.toLocaleString()} מתוך ₪{total.toLocaleString()} ({collectionPercentage}%)
            </span>
            <span className="text-xs text-muted-foreground">{paidChildren.length}/{estimatedChildren || "?"} שילמו</span>
            <ChevronLeft className="h-4 w-4 text-sky-600 dark:text-sky-400 flex-shrink-0" />
          </div>
          {/* Progress bar */}
          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-sky-500 rounded-full transition-all duration-500"
              style={{ width: `${collectionPercentage}%` }}
            />
          </div>
        </button>
      )}

      {/* 3 Clickable Metric Blocks */}
      <div className="grid grid-cols-3 gap-3">
        {/* Block 1: Total Budget */}
        <button
          onClick={() => handleBlockClick("budget")}
          className={cn(
            "bg-card rounded-2xl p-4 border-2 shadow-sm transition-all text-right",
            selectedBlock === "budget"
              ? "border-brand ring-2 ring-brand/20"
              : "border-border hover:border-brand/50"
          )}
        >
          <div className="flex items-center gap-2 mb-2">
            <PiggyBank className="h-4 w-4 text-brand" />
            <span className="text-xs font-medium text-muted-foreground">תקציב כולל</span>
          </div>
          <p className="text-xl md:text-2xl font-bold text-foreground">
            ₪{total.toLocaleString()}
          </p>
        </button>

        {/* Block 2: Expenses */}
        <button
          onClick={() => handleBlockClick("expenses")}
          className={cn(
            "bg-card rounded-2xl p-4 border-2 shadow-sm transition-all text-right",
            selectedBlock === "expenses"
              ? "border-destructive ring-2 ring-destructive/20"
              : "border-border hover:border-destructive/50"
          )}
        >
          <div className="flex items-center gap-2 mb-2">
            <TrendingDown className="h-4 w-4 text-destructive" />
            <span className="text-xs font-medium text-muted-foreground">הוצאות</span>
          </div>
          <p className="text-xl md:text-2xl font-bold text-foreground">
            ₪{spent.toLocaleString()}
          </p>
        </button>

        {/* Block 3: Remaining */}
        <button
          onClick={() => handleBlockClick("balance")}
          className={cn(
            "bg-card rounded-2xl p-4 border-2 shadow-sm transition-all text-right",
            selectedBlock === "balance"
              ? "border-success ring-2 ring-success/20"
              : "border-border hover:border-success/50"
          )}
        >
          <div className="flex items-center gap-2 mb-2">
            <Wallet className="h-4 w-4 text-success" />
            <span className="text-xs font-medium text-muted-foreground">יתרה</span>
          </div>
          <p className="text-xl md:text-2xl font-bold text-foreground">
            ₪{remaining.toLocaleString()}
          </p>
        </button>
      </div>

      {/* Content Area - Changes based on selected block */}
      {selectedBlock === null ? (
        /* Default View: Pie Charts */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Budget Utilization Pie Chart */}
          <div className="bg-card rounded-2xl p-4 border-2 border-border shadow-sm">
            <h3 className="text-sm font-bold text-foreground mb-2">ניצול התקציב</h3>
            {budgetPieData.length > 0 ? (
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={budgetPieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={70}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {budgetPieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value) => `₪${(value as number).toLocaleString()}`}
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                      }}
                    />
                    <Legend
                      verticalAlign="bottom"
                      height={36}
                      formatter={(value) => {
                        const item = budgetPieData.find(d => d.name === value);
                        const chartTotal = spent + remaining;
                        const percentage = chartTotal > 0 ? Math.round((item?.value || 0) / chartTotal * 100) : 0;
                        return <span style={{ marginRight: '8px' }}>{`${value}: ₪${item?.value.toLocaleString() || 0} (${percentage}%)`}</span>;
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-56 flex items-center justify-center text-muted-foreground">
                אין נתונים להצגה
              </div>
            )}
          </div>

          {/* Expense Distribution Pie Chart */}
          <div className="bg-card rounded-2xl p-4 border-2 border-border shadow-sm">
            <h3 className="text-sm font-bold text-foreground mb-2">התפלגות ההוצאות</h3>
            {allocationPieData.length > 0 ? (
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={allocationPieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={70}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {allocationPieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value) => `₪${(value as number).toLocaleString()}`}
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                      }}
                    />
                    <Legend
                      verticalAlign="bottom"
                      height={36}
                      formatter={(value) => {
                        const item = allocationPieData.find(d => d.name === value);
                        const chartTotal = kidsAllocation + staffAllocation;
                        const percentage = chartTotal > 0 ? Math.round((item?.value || 0) / chartTotal * 100) : 0;
                        return <span style={{ marginRight: '8px' }}>{`${value}: ₪${item?.value.toLocaleString() || 0} (${percentage}%)`}</span>;
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-56 flex items-center justify-center text-muted-foreground">
                אין נתונים להצגה
              </div>
            )}
          </div>
        </div>
      ) : selectedBlock === "budget" ? (
        /* Block 1: Budget Details */
        <div className="bg-card rounded-2xl border-2 border-border shadow-sm overflow-hidden">
          {/* Header with close button */}
          <div className="flex items-center justify-between p-4 border-b border-border">
            <h3 className="font-bold text-foreground">תקציב כולל</h3>
            <button
              onClick={() => setSelectedBlock(null)}
              className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <span>סגור</span>
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="p-4 space-y-6">
            {/* Section 1: Budget Settings */}
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-3">הגדרות תקציב</h4>
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-xl">
                <div>
                  <p className="font-bold text-foreground">₪{total.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">
                    ₪{amountPerChild.toLocaleString()} × {estimatedChildren} ילדים
                  </p>
                </div>
                {onEditBudget && (
                  <button
                    onClick={onEditBudget}
                    className="p-2 hover:bg-muted rounded-lg transition-colors"
                  >
                    <Pencil className="h-4 w-4 text-muted-foreground" />
                  </button>
                )}
              </div>
            </div>

            {/* Section 2: Collection Status */}
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-3">מצב גבייה</h4>

              {/* Progress */}
              <div className="mb-4">
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-muted-foreground">התקדמות גבייה</span>
                  <span className="font-medium">{collectionPercentage}%</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-brand rounded-full transition-all duration-500"
                    style={{ width: `${collectionPercentage}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  נאספו ₪{collected.toLocaleString()} מתוך ₪{total.toLocaleString()}
                </p>
              </div>

              {/* Children status */}
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  מצב רישום (מתוך {estimatedChildren} ילדים צפויים)
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {/* Paid */}
                  <div className="p-3 bg-success/10 rounded-xl border border-success/20">
                    <div className="flex items-center gap-2 mb-2">
                      <Check className="h-4 w-4 text-success" />
                      <span className="text-sm font-medium text-success">שילמו ({paidChildren.length})</span>
                    </div>
                    {paidChildren.length > 0 ? (
                      <div className="space-y-1">
                        {paidChildren.slice(0, 5).map(child => (
                          <p key={child.id} className="text-sm text-foreground">{child.name}</p>
                        ))}
                        {paidChildren.length > 5 && (
                          <p className="text-xs text-muted-foreground">+{paidChildren.length - 5} נוספים</p>
                        )}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">אין עדיין</p>
                    )}
                  </div>

                  {/* Registered but unpaid */}
                  <div className="p-3 bg-warning/10 rounded-xl border border-warning/20">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertCircle className="h-4 w-4 text-warning" />
                      <span className="text-sm font-medium text-warning">נרשמו, לא שילמו ({unpaidChildren.length})</span>
                    </div>
                    {unpaidChildren.length > 0 ? (
                      <div className="space-y-1">
                        {unpaidChildren.slice(0, 5).map(child => (
                          <p key={child.id} className="text-sm text-foreground">{child.name}</p>
                        ))}
                        {unpaidChildren.length > 5 && (
                          <p className="text-xs text-muted-foreground">+{unpaidChildren.length - 5} נוספים</p>
                        )}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">אין</p>
                    )}
                  </div>
                </div>

                {/* Not registered */}
                {notRegisteredCount > 0 && (
                  <div className="p-3 bg-muted/50 rounded-xl border border-border">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">❓</span>
                      <span className="text-sm text-muted-foreground">
                        טרם נרשמו ({notRegisteredCount}) - {notRegisteredCount} ילדים מתוך {estimatedChildren} עדיין לא מילאו את טופס ההרשמה
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Registration link button */}
              {onSendRegistrationLink && (
                <div className="mt-4">
                  <button
                    onClick={onSendRegistrationLink}
                    className="w-full bg-brand text-white rounded-xl py-2.5 px-4 font-medium hover:bg-brand/90 transition-colors"
                  >
                    עדכון פרטי ילדכם ותשלום בקבוצת הפייבוקס
                  </button>
                  <p className="text-xs text-muted-foreground text-center mt-2">
                    לסימון תשלום בודד → עבור לדף קשר
                  </p>
                </div>
              )}
            </div>

            {/* Section 3: Event Allocation - with sticky summary */}
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-3">הקצאת תקציב לאירועים</h4>

              {/* Sticky allocation summary */}
              <div className="sticky top-0 z-10 bg-muted/80 backdrop-blur rounded-xl p-3 mb-3 border border-border">
                <div className="flex items-center justify-between text-sm mb-1">
                  <div className="flex items-center gap-4">
                    <span>💰 תקציב: ₪{total.toLocaleString()}</span>
                    <span>מוקצה: ₪{allocated.toLocaleString()}</span>
                    <span>נותר: ₪{(total - allocated).toLocaleString()}</span>
                  </div>
                </div>
                <div className="h-2 bg-background rounded-full overflow-hidden">
                  <div
                    className="h-full bg-brand rounded-full transition-all duration-500"
                    style={{ width: `${total > 0 ? (allocated / total) * 100 : 0}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground text-left mt-1">
                  {total > 0 ? Math.round((allocated / total) * 100) : 0}%
                </p>
              </div>

              {/* Event list - interactive like onboarding */}
              <div className="space-y-3">
                {sortEventsByDate(events).map(event => {
                  const Icon = getEventIcon(event);
                  const isEnabled = event.allocated_budget && event.allocated_budget > 0;
                  const isExpanded = expandedEventId === event.id;
                  const eventKidsTotal = (event.amount_per_kid || 0) * (event.kids_count || estimatedChildren);
                  const eventStaffTotal = (event.amount_per_staff || 0) * (event.staff_count || estimatedStaff);
                  const eventTotal = event.allocated_budget || (eventKidsTotal + eventStaffTotal);

                  return (
                    <div
                      key={event.id}
                      className={cn(
                        "bg-card rounded-2xl border-2 transition-all",
                        isEnabled ? "border-border" : "border-border/50 opacity-60"
                      )}
                    >
                      {/* Event Header - Clickable */}
                      <div
                        onClick={() => {
                          if (onToggleEventEnabled) {
                            onToggleEventEnabled(event.id, !isEnabled);
                          }
                          // Toggle expansion for editing
                          setExpandedEventId(isExpanded ? null : event.id);
                        }}
                        className="w-full p-4 flex items-center gap-3 cursor-pointer hover:bg-muted/30 transition-colors rounded-t-2xl"
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            setExpandedEventId(isExpanded ? null : event.id);
                          }
                        }}
                      >
                        <div
                          className={cn(
                            "w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-colors",
                            isEnabled
                              ? "bg-brand border-brand"
                              : "border-border"
                          )}
                        >
                          {isEnabled && <Check className="h-4 w-4 text-white" />}
                        </div>
                        <Icon className="h-5 w-5 text-muted-foreground" />
                        <span className="font-medium text-foreground flex-1 text-right">
                          {event.name}
                        </span>
                        {isEnabled && (
                          <span className="text-sm font-bold text-brand">
                            ₪{eventTotal.toLocaleString()}
                          </span>
                        )}
                        <ChevronDown className={cn(
                          "h-4 w-4 text-muted-foreground transition-transform",
                          isExpanded && "rotate-180"
                        )} />
                      </div>

                      {/* Allocation Inputs - Expandable */}
                      {isExpanded && (
                        <div className="px-4 pb-4 space-y-3 border-t border-border pt-3">
                          {/* Kids allocation */}
                          <div className="flex items-center gap-3">
                            <span className="text-sm text-muted-foreground w-16">ילדים:</span>
                            <div className="flex items-center gap-2 flex-1">
                              <Input
                                type="number"
                                min="0"
                                value={event.amount_per_kid || ""}
                                onChange={(e) => {
                                  if (onUpdateEventAllocation) {
                                    onUpdateEventAllocation(
                                      event.id,
                                      parseInt(e.target.value) || 0,
                                      event.amount_per_staff || 0
                                    );
                                  }
                                }}
                                className="h-9 w-20 rounded-lg border text-center"
                                placeholder="0"
                              />
                              <span className="text-sm text-muted-foreground">₪</span>
                              <span className="text-sm text-muted-foreground">×</span>
                              <span className="text-sm font-medium">{event.kids_count || estimatedChildren}</span>
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
                                value={event.amount_per_staff || ""}
                                onChange={(e) => {
                                  if (onUpdateEventAllocation) {
                                    onUpdateEventAllocation(
                                      event.id,
                                      event.amount_per_kid || 0,
                                      parseInt(e.target.value) || 0
                                    );
                                  }
                                }}
                                className="h-9 w-20 rounded-lg border text-center"
                                placeholder="0"
                              />
                              <span className="text-sm text-muted-foreground">₪</span>
                              <span className="text-sm text-muted-foreground">×</span>
                              <span className="text-sm font-medium">{event.staff_count || estimatedStaff}</span>
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
              </div>

              {/* Add Custom Event */}
              {showCustomEventInput ? (
                <div className="bg-card rounded-2xl border-2 border-dashed border-brand/50 p-4">
                  <div className="flex gap-2">
                    <Input
                      type="text"
                      placeholder="שם האירוע..."
                      value={customEventName}
                      onChange={(e) => setCustomEventName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && customEventName.trim()) {
                          onAddCustomEvent?.(customEventName.trim());
                          setCustomEventName("");
                          setShowCustomEventInput(false);
                        }
                      }}
                      className="h-10 rounded-xl border-2"
                      autoFocus
                    />
                    <Button
                      onClick={() => {
                        if (customEventName.trim()) {
                          onAddCustomEvent?.(customEventName.trim());
                          setCustomEventName("");
                          setShowCustomEventInput(false);
                        }
                      }}
                      size="sm"
                      className="rounded-xl bg-brand hover:bg-brand/90"
                    >
                      הוסף
                    </Button>
                    <Button
                      onClick={() => {
                        setShowCustomEventInput(false);
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
                  onClick={() => setShowCustomEventInput(true)}
                  className="w-full p-4 bg-card rounded-2xl border-2 border-dashed border-border hover:border-brand/50 transition-colors flex items-center justify-center gap-2 text-muted-foreground hover:text-foreground"
                >
                  <Plus className="h-5 w-5" />
                  <span>הוסף אירוע מותאם אישית</span>
                </button>
              )}
            </div>
          </div>
        </div>
      ) : selectedBlock === "expenses" ? (
        /* Block 2: Expenses Details */
        <div className="bg-card rounded-2xl border-2 border-border shadow-sm overflow-hidden">
          {/* Header with close button */}
          <div className="flex items-center justify-between p-4 border-b border-border">
            <h3 className="font-bold text-foreground">הוצאות</h3>
            <button
              onClick={() => setSelectedBlock(null)}
              className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <span>סגור</span>
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="p-4">
            <div className="flex items-center justify-between mb-4">
              <p className="text-lg font-bold text-foreground">
                סה״כ הוצאות: ₪{spent.toLocaleString()}
              </p>
              <button
                onClick={() => setExpenseModalOpen(true)}
                className="bg-brand text-white rounded-lg py-2 px-4 text-sm font-medium hover:bg-brand/90 transition-colors flex items-center gap-1"
              >
                <Plus className="h-4 w-4" />
                הוסף
              </button>
            </div>

            {/* Filter by event */}
            {events.length > 0 && (
              <div className="mb-4">
                <Select value={expenseFilter} onValueChange={setExpenseFilter}>
                  <SelectTrigger className="w-full md:w-64 rounded-xl">
                    <SelectValue placeholder="סינון לפי אירוע" />
                  </SelectTrigger>
                  <SelectContent dir="rtl">
                    <SelectItem value="all">כל האירועים</SelectItem>
                    <SelectItem value="general">כללי (ללא אירוע)</SelectItem>
                    {events.map((event) => (
                      <SelectItem key={event.id} value={event.id}>
                        {event.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Expenses list */}
            {expenses.length > 0 ? (
              <div className="space-y-3 max-h-[400px] overflow-y-auto">
                {expenses
                  .filter((expense) => {
                    if (expenseFilter === "all") return true;
                    if (expenseFilter === "general") return !expense.event_id;
                    return expense.event_id === expenseFilter;
                  })
                  .map((expense) => (
                    <div
                      key={expense.id}
                      className="p-3 bg-muted/30 rounded-xl border border-border"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="text-xs text-muted-foreground mb-1">
                            {formatHebrewDate(expense.expense_date)}
                          </p>
                          <p className="font-medium text-foreground">
                            {expense.description}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            {expense.events ? (
                              <span className="inline-flex items-center gap-1 text-xs bg-brand/10 text-brand px-2 py-0.5 rounded-full">
                                <Tag className="h-3 w-3" />
                                {expense.events.name}
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full">
                                <Tag className="h-3 w-3" />
                                כללי
                              </span>
                            )}
                            {expense.receipt_url && (
                              <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                                <Receipt className="h-3 w-3" />
                                קבלה
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-foreground">
                            ₪{expense.amount.toLocaleString()}
                          </span>
                          <div className="flex gap-1">
                            {expense.receipt_url && (
                              <button
                                className="p-1.5 rounded-lg hover:bg-muted transition-colors"
                                title="צפה בקבלה"
                              >
                                <Eye className="h-4 w-4 text-muted-foreground" />
                              </button>
                            )}
                            <button
                              onClick={() => setDeleteExpenseId(expense.id)}
                              className="p-1.5 rounded-lg hover:bg-destructive/10 transition-colors"
                              title="מחק"
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <TrendingDown className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>אין הוצאות עדיין</p>
                <p className="text-xs mt-1">הוסף הוצאות עם קבלות לצורך מעקב</p>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Block 3: Balance Details */
        <div className="bg-card rounded-2xl border-2 border-border shadow-sm overflow-hidden">
          {/* Header with close button */}
          <div className="flex items-center justify-between p-4 border-b border-border">
            <h3 className="font-bold text-foreground">יתרה</h3>
            <button
              onClick={() => setSelectedBlock(null)}
              className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <span>סגור</span>
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="p-4 space-y-6">
            {/* Actual balance calculation */}
            <div>
              <p className="text-sm text-muted-foreground mb-2">💵 יתרה בפועל</p>
              <div className="bg-muted/50 rounded-xl p-4 space-y-2">
                <div className="flex justify-between">
                  <span className="text-foreground">נאספו</span>
                  <span className="font-medium">₪{collected.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-destructive">
                  <span>- הוצאות</span>
                  <span className="font-medium">₪{spent.toLocaleString()}</span>
                </div>
                <div className="border-t border-border pt-2 flex justify-between">
                  <span className="font-bold">= יתרה</span>
                  <span className="font-bold text-success flex items-center gap-1">
                    ₪{remaining.toLocaleString()}
                    <Check className="h-4 w-4" />
                  </span>
                </div>
              </div>
            </div>

            {/* Allocation status */}
            <div>
              <p className="text-sm text-muted-foreground mb-2">📊 מצב הקצאות</p>
              <div className="bg-muted/50 rounded-xl p-4">
                <div className="flex justify-between mb-2">
                  <span>תקציב כולל</span>
                  <span className="font-medium">₪{total.toLocaleString()}</span>
                </div>
                <div className="flex justify-between mb-2">
                  <span>הוקצה לאירועים</span>
                  <span className="font-medium">
                    ₪{allocated.toLocaleString()} ({total > 0 ? Math.round((allocated / total) * 100) : 0}%)
                  </span>
                </div>
                <div className="h-2 bg-background rounded-full overflow-hidden mb-2">
                  <div
                    className="h-full bg-brand rounded-full transition-all duration-500"
                    style={{ width: `${total > 0 ? (allocated / total) * 100 : 0}%` }}
                  />
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>טרם הוקצה</span>
                  <span>₪{(total - allocated).toLocaleString()} ({total > 0 ? Math.round(((total - allocated) / total) * 100) : 0}%)</span>
                </div>
              </div>
            </div>

            {/* Warning if collection incomplete */}
            {collected < total && (
              <div className="flex items-start gap-2 p-3 bg-warning/10 rounded-xl border border-warning/20">
                <AlertCircle className="h-5 w-5 text-warning flex-shrink-0 mt-0.5" />
                <p className="text-sm text-foreground">
                  שים לב: עדיין לא נאסף מלוא התקציב (₪{(total - collected).toLocaleString()} חסרים)
                </p>
              </div>
            )}

            {/* Unpaid allocated events */}
            {unpaidEvents.length > 0 && (
              <div>
                <p className="text-sm text-muted-foreground mb-2">📅 אירועים שהוקצאו וטרם שולמו</p>
                <div className="space-y-2">
                  {unpaidEvents.map(event => (
                    <div
                      key={event.id}
                      className="flex items-center justify-between p-3 bg-muted/30 rounded-xl"
                    >
                      <span className="text-foreground">{event.name}</span>
                      <span className="text-brand font-medium">
                        ₪{(event.allocated_budget || 0).toLocaleString()} מוקצה
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Timeline: Budgeted Events (always visible) */}
      <div className="bg-card rounded-2xl p-4 border-2 border-border shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <Calendar className="h-5 w-5 text-brand" />
          <h3 className="text-sm font-bold text-foreground">אירועים שתוקצבו</h3>
        </div>
        {budgetedEvents.length > 0 ? (
          <div className="space-y-3">
            {budgetedEvents.map((event) => {
              const barWidthPercent = Math.max(((event.allocated_budget || 0) / maxBudget) * 100, 20);
              return (
                <button
                  key={event.id}
                  onClick={() => onMarkEventPaid?.(event.id)}
                  className="w-full text-right group"
                >
                  {/* Date and payment status row */}
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-muted-foreground">
                      {formatHebrewDate(event.event_date)}
                    </span>
                    {/* Payment status badge */}
                    <div className={cn(
                      "flex items-center gap-1 text-xs px-2 py-0.5 rounded-full",
                      event.is_paid
                        ? "bg-success/20 text-success"
                        : "bg-destructive/20 text-destructive"
                    )}>
                      {event.is_paid ? (
                        <>
                          <Check className="h-3 w-3" />
                          <span>שולם</span>
                        </>
                      ) : (
                        <>
                          <X className="h-3 w-3" />
                          <span>לא שולם</span>
                        </>
                      )}
                    </div>
                  </div>
                  {/* Bar with event name and budget inside */}
                  <div
                    className={cn(
                      "h-10 rounded-lg flex items-center justify-between px-3 transition-all",
                      event.is_paid
                        ? "bg-success/30 border border-success/50"
                        : "bg-brand/30 border border-brand/50 group-hover:bg-brand/40"
                    )}
                    style={{ width: `${barWidthPercent}%`, minWidth: "180px" }}
                  >
                    <span className="font-medium text-sm text-foreground truncate">
                      {event.name}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-brand">
                        ₪{(event.allocated_budget || 0).toLocaleString()}
                      </span>
                      <ChevronLeft className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        ) : (
          <p className="text-center text-muted-foreground py-4">
            אין אירועים עם תקציב מוקצה
          </p>
        )}
      </div>

      {/* Add Expense Modal */}
      <Dialog open={expenseModalOpen} onOpenChange={setExpenseModalOpen}>
        <DialogContent className="max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-right">הוספת הוצאה</DialogTitle>
            <DialogDescription className="text-right">
              הזן את פרטי ההוצאה
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="expenseDescription">תיאור *</Label>
              <Input
                id="expenseDescription"
                value={expenseForm.description}
                onChange={(e) =>
                  setExpenseForm({ ...expenseForm, description: e.target.value })
                }
                placeholder="לדוגמה: קישוטים לחנוכה"
                className="rounded-xl"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="expenseAmount">סכום (₪) *</Label>
              <Input
                id="expenseAmount"
                type="number"
                min="0"
                value={expenseForm.amount}
                onChange={(e) =>
                  setExpenseForm({ ...expenseForm, amount: e.target.value })
                }
                placeholder="0"
                className="rounded-xl"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="expenseDate">תאריך *</Label>
              <Input
                id="expenseDate"
                type="date"
                value={expenseForm.expense_date}
                onChange={(e) =>
                  setExpenseForm({ ...expenseForm, expense_date: e.target.value })
                }
                className="rounded-xl"
              />
            </div>

            <div className="space-y-2">
              <Label>אירוע (אופציונלי)</Label>
              <Select
                value={expenseForm.event_id}
                onValueChange={(value) =>
                  setExpenseForm({ ...expenseForm, event_id: value === "none" ? "" : value })
                }
              >
                <SelectTrigger className="rounded-xl">
                  <SelectValue placeholder="בחר אירוע" />
                </SelectTrigger>
                <SelectContent dir="rtl">
                  <SelectItem value="none">כללי (ללא אירוע)</SelectItem>
                  {events.map((event) => (
                    <SelectItem key={event.id} value={event.id}>
                      {event.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setExpenseModalOpen(false);
                setExpenseForm({
                  description: "",
                  amount: "",
                  expense_date: new Date().toISOString().split("T")[0],
                  event_id: "",
                });
              }}
              className="rounded-xl"
            >
              ביטול
            </Button>
            <Button
              onClick={() => {
                if (!classId || !expenseForm.description || !expenseForm.amount) return;
                startTransition(async () => {
                  await createExpense({
                    classId,
                    description: expenseForm.description,
                    amount: parseFloat(expenseForm.amount),
                    expense_date: expenseForm.expense_date,
                    event_id: expenseForm.event_id || undefined,
                  });
                  setExpenseModalOpen(false);
                  setExpenseForm({
                    description: "",
                    amount: "",
                    expense_date: new Date().toISOString().split("T")[0],
                    event_id: "",
                  });
                  router.refresh();
                });
              }}
              disabled={!expenseForm.description || !expenseForm.amount || isPending}
              className="rounded-xl gap-2"
            >
              {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              הוסף הוצאה
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Expense Confirmation Modal */}
      <Dialog open={!!deleteExpenseId} onOpenChange={(open) => !open && setDeleteExpenseId(null)}>
        <DialogContent className="max-w-sm" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-right">אישור מחיקה</DialogTitle>
            <DialogDescription className="text-right">
              האם אתה בטוח שברצונך למחוק הוצאה זו?
              <br />
              פעולה זו אינה ניתנת לביטול.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setDeleteExpenseId(null)}
              className="rounded-xl"
            >
              ביטול
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (!deleteExpenseId) return;
                startTransition(async () => {
                  await deleteExpense(deleteExpenseId);
                  setDeleteExpenseId(null);
                  router.refresh();
                });
              }}
              disabled={isPending}
              className="rounded-xl gap-2"
            >
              {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              מחק
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
