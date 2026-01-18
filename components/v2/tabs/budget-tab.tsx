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
  CreditCard,
  Settings,
  Search,
  XCircle,
  Send,
  Info,
  UserPlus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { createExpense, deleteExpense } from "@/app/actions/budget";
import { getJewishHolidays } from "@/lib/jewish-holidays";
import { BudgetEditorModal } from "@/components/v2/budget-editor-modal";

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
  spent_amount?: number;
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
  onOpenPaymentSheet?: () => void;
  onOpenPaymentSheetWithoutList?: () => void;
  onMarkChildPaid?: (childId: string) => void;
  onMarkChildUnpaid?: (childId: string) => void;
};

type SelectedBlock = "budget" | "expenses" | "balance" | null;

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

function getEventIcon(event: Event): React.ComponentType<{ className?: string }> {
  if (event.event_type && EVENT_ICONS[event.event_type]) {
    return EVENT_ICONS[event.event_type];
  }
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

function formatHebrewDate(dateStr?: string): string {
  if (!dateStr) return "לא נקבע";
  const date = new Date(dateStr);
  const day = date.getDate();
  const month = HEBREW_MONTHS[date.getMonth()];
  return `${day} ${month}`;
}

// Map event_type to Jewish holiday Hebrew name
const EVENT_TYPE_TO_HOLIDAY: Record<string, string> = {
  "rosh-hashana": "ראש השנה",
  "hanukkah": "חנוכה",
  "tu-bishvat": "ט״ו בשבט",
  "purim": "פורים",
  "passover": "פסח",
  "independence-day": "יום העצמאות",
  "shavuot": "שבועות",
};

function getEventDateString(event: Event): string | null {
  if (event.event_date) return event.event_date;
  const holidayName = EVENT_TYPE_TO_HOLIDAY[event.event_type];
  if (holidayName) {
    const holidays = getJewishHolidays();
    const matchingHoliday = holidays.find(h => h.hebrewName === holidayName || h.hebrewName.startsWith(holidayName));
    if (matchingHoliday) return matchingHoliday.dateString;
  }
  return null;
}

function sortEventsByDate(events: Event[]): Event[] {
  return [...events].sort((a, b) => {
    const dateA = getEventDateString(a);
    const dateB = getEventDateString(b);
    if (!dateA) return 1;
    if (!dateB) return -1;
    return new Date(dateA).getTime() - new Date(dateB).getTime();
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
  onOpenPaymentSheet,
  onOpenPaymentSheetWithoutList,
  onMarkChildPaid,
  onMarkChildUnpaid,
}: BudgetTabProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [selectedBlock, setSelectedBlock] = useState<SelectedBlock>(null);

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

  // Budget editor modal state
  const [budgetEditorOpen, setBudgetEditorOpen] = useState(false);

  // Event detail modal state
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const selectedEvent = selectedEventId ? events.find(e => e.id === selectedEventId) : null;

  // Collapsible sections in Budget block
  const [expandedSection, setExpandedSection] = useState<"budget-edit" | "collection" | null>(null);

  // Children list modal state
  const [childrenListModal, setChildrenListModal] = useState<{ open: boolean; type: "paid" | "unpaid" | null }>({
    open: false,
    type: null,
  });
  const [childrenSearchQuery, setChildrenSearchQuery] = useState("");

  const {
    total = 0,
    allocated = 0,
    spent = 0,
    remaining = 0,
    amountPerChild = 0,
    collected = 0,
  } = budgetMetrics || {};

  // Calculate actual balance (collected - spent)
  const actualBalance = collected - spent;

  // Calculate unallocated budget
  const unallocated = total - allocated;

  // Calculate allocations breakdown
  const allocatedAndSpent = Math.min(spent, allocated);
  const allocatedAndUnspent = Math.max(0, allocated - spent);

  // Collection tracking
  const paidChildren = children.filter(c => c.payment_status === "paid");
  const unpaidChildren = children.filter(c => c.payment_status === "unpaid");
  const registeredCount = children.length;
  const notRegisteredCount = Math.max(0, estimatedChildren - registeredCount);
  const collectionPercentage = total > 0 ? Math.round((collected / total) * 100) : 0;

  // Pie chart data - Budget Utilization (spent vs remaining from collected)
  const budgetUtilizationPieData = [
    { name: "הוצאו", value: spent, color: "#f97316" },
    { name: "נותרו", value: Math.max(0, collected - spent), color: "#22c55e" },
  ].filter(item => item.value > 0);

  // Calculate kids vs staff allocation totals
  const totalKidsAllocation = events.reduce((sum, e) => sum + (e.allocated_for_kids || 0), 0);
  const totalStaffAllocation = events.reduce((sum, e) => sum + (e.allocated_for_staff || 0), 0);

  // Pie chart data - Kids vs Staff Distribution
  const kidsStaffPieData = [
    { name: "ילדים", value: totalKidsAllocation, color: "#3b82f6" },
    { name: "צוות", value: totalStaffAllocation, color: "#8b5cf6" },
  ].filter(item => item.value > 0);

  // Get budgeted events for timeline
  const budgetedEvents = sortEventsByDate(events)
    .filter((e) => e.allocated_budget && e.allocated_budget > 0);

  const maxBudget = Math.max(...budgetedEvents.map(e => e.allocated_budget || 0), 1);

  const handleBlockClick = (block: SelectedBlock) => {
    setSelectedBlock(prev => prev === block ? null : block);
    setExpandedSection(null);
  };

  const toggleSection = (section: "budget-edit" | "collection") => {
    setExpandedSection(prev => prev === section ? null : section);
  };

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

      {/* Collection Banner - Only show when collection is not complete */}
      {collectionPercentage < 100 && (
        <div className={cn(
          "rounded-xl px-4 py-3 border",
          unpaidChildren.length > 0
            ? "bg-gradient-to-r from-amber-500/15 to-orange-500/15 border-amber-500/30"
            : "bg-gradient-to-r from-rose-500/15 to-pink-500/15 border-rose-500/30"
        )}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Info className={cn(
                "h-5 w-5",
                unpaidChildren.length > 0
                  ? "text-amber-600 dark:text-amber-400"
                  : "text-rose-600 dark:text-rose-400"
              )} />
              <span className="font-semibold text-foreground">
                {unpaidChildren.length > 0
                  ? `${unpaidChildren.length} ילדים נרשמו אך טרם שילמו`
                  : `${notRegisteredCount} ילדים טרם נרשמו ושילמו`}
              </span>
            </div>
            {/* CTA button based on state */}
            {unpaidChildren.length > 0 ? (
              <Button
                onClick={onOpenPaymentSheetWithoutList}
                size="sm"
                className="gap-2 rounded-lg bg-amber-600 hover:bg-amber-700 text-white"
              >
                <Send className="h-4 w-4" />
                שלחו תזכורת לתשלום
              </Button>
            ) : (
              <Button
                onClick={onOpenPaymentSheet}
                size="sm"
                className="gap-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white"
              >
                <UserPlus className="h-4 w-4" />
                שלחו קישור הרשמה ותשלום
              </Button>
            )}
          </div>
        </div>
      )}

      {/* 3 Clickable Metric Blocks */}
      <div className="grid grid-cols-3 gap-3">
        {/* Block 1: Budget (shows collected / target) */}
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
            <span className="text-xs font-medium text-muted-foreground">תקציב</span>
          </div>
          <p className="text-xl md:text-2xl font-bold text-foreground">
            ₪{collected.toLocaleString()}
          </p>
          <p className="text-xs text-muted-foreground">
            מתוך ₪{total.toLocaleString()}
          </p>
          {/* Mini progress bar */}
          <div className="h-1 bg-muted rounded-full overflow-hidden mt-2">
            <div
              className="h-full bg-brand rounded-full transition-all duration-500"
              style={{ width: `${collectionPercentage}%` }}
            />
          </div>
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

        {/* Block 3: Balance */}
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
          <p className={cn(
            "text-xl md:text-2xl font-bold",
            actualBalance >= 0 ? "text-foreground" : "text-destructive"
          )}>
            ₪{actualBalance.toLocaleString()}
          </p>
        </button>
      </div>

      {/* Content Area - Changes based on selected block */}
      {selectedBlock === null ? (
        /* Default View: Two Pie Charts */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Budget Utilization Pie Chart */}
          <div className="bg-card rounded-2xl p-4 border-2 border-border shadow-sm">
            <h3 className="text-sm font-bold text-foreground mb-2">ניצול תקציב</h3>
            {budgetUtilizationPieData.length > 0 && collected > 0 ? (
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={budgetUtilizationPieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={70}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {budgetUtilizationPieData.map((entry, index) => (
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
                        const item = budgetUtilizationPieData.find(d => d.name === value);
                        const total = budgetUtilizationPieData.reduce((sum, d) => sum + d.value, 0);
                        const percentage = total > 0 ? Math.round((item?.value || 0) / total * 100) : 0;
                        return <span style={{ marginRight: '8px' }}>{`${value}: ₪${item?.value.toLocaleString() || 0} (${percentage}%)`}</span>;
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-56 flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <PiggyBank className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>אין הכנסות עדיין</p>
                </div>
              </div>
            )}
          </div>

          {/* Kids vs Staff Distribution Pie Chart */}
          <div className="bg-card rounded-2xl p-4 border-2 border-border shadow-sm">
            <h3 className="text-sm font-bold text-foreground mb-2">חלוקת תקציב: ילדים מול צוות</h3>
            {kidsStaffPieData.length > 0 ? (
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={kidsStaffPieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={70}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {kidsStaffPieData.map((entry, index) => (
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
                        const item = kidsStaffPieData.find(d => d.name === value);
                        const total = kidsStaffPieData.reduce((sum, d) => sum + d.value, 0);
                        const percentage = total > 0 ? Math.round((item?.value || 0) / total * 100) : 0;
                        return <span style={{ marginRight: '8px' }}>{`${value}: ₪${item?.value.toLocaleString() || 0} (${percentage}%)`}</span>;
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-56 flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>אין הקצאות לאירועים עדיין</p>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : selectedBlock === "budget" ? (
        /* Block 1: Budget Details - 3 Collapsible Sections */
        <div className="bg-card rounded-2xl border-2 border-border shadow-sm overflow-hidden">
          {/* Header with close button */}
          <div className="flex items-center justify-between p-4 border-b border-border">
            <h3 className="font-bold text-foreground">תקציב</h3>
            <button
              onClick={() => setSelectedBlock(null)}
              className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <span>סגור</span>
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="divide-y divide-border">
            {/* Section 1: Budget Edit - Combined budget + allocations */}
            <div>
              <button
                onClick={() => toggleSection("budget-edit")}
                className="w-full flex items-center justify-between p-4 hover:bg-muted/30 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Wallet className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium text-foreground">עריכת תקציב</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">
                    ₪{total.toLocaleString()} תקציב · ₪{allocated.toLocaleString()} מוקצה ({total > 0 ? Math.round((allocated / total) * 100) : 0}%)
                  </span>
                  <ChevronDown className={cn(
                    "h-4 w-4 text-muted-foreground transition-transform",
                    expandedSection === "budget-edit" && "rotate-180"
                  )} />
                </div>
              </button>

              {expandedSection === "budget-edit" && (
                <div className="px-4 pb-4 space-y-4">
                  {/* Budget Summary Card */}
                  <div className="p-4 bg-muted/50 rounded-xl space-y-3">
                    {/* Budget total */}
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">תקציב כולל</p>
                        <p className="text-xl font-bold text-foreground">₪{total.toLocaleString()}</p>
                        <p className="text-xs text-muted-foreground">
                          ₪{amountPerChild} × {estimatedChildren} ילדים
                        </p>
                      </div>
                      <Button
                        onClick={() => setBudgetEditorOpen(true)}
                        className="gap-2 rounded-lg bg-brand hover:bg-brand/90"
                      >
                        <Pencil className="h-4 w-4" />
                        ערוך תקציב
                      </Button>
                    </div>

                    {/* Allocation bar */}
                    <div>
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span className="text-muted-foreground">מוקצה לאירועים</span>
                        <span className="font-medium">₪{allocated.toLocaleString()} ({total > 0 ? Math.round((allocated / total) * 100) : 0}%)</span>
                      </div>
                      <div className="h-2 bg-background rounded-full overflow-hidden">
                        <div
                          className="h-full bg-brand rounded-full transition-all duration-500"
                          style={{ width: `${total > 0 ? Math.min((allocated / total) * 100, 100) : 0}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-xs text-muted-foreground mt-1">
                        <span>נותר להקצאה: ₪{Math.max(0, total - allocated).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>

                  {/* Allocated events list */}
                  {budgetedEvents.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-foreground">אירועים מוקצים:</p>
                      <div className="space-y-1.5">
                        {sortEventsByDate(events)
                          .filter(e => (e.allocated_budget || 0) > 0)
                          .map(event => {
                            const Icon = getEventIcon(event);
                            return (
                              <div
                                key={event.id}
                                className="flex items-center justify-between p-2 bg-background rounded-lg"
                              >
                                <div className="flex items-center gap-2">
                                  <Icon className="h-4 w-4 text-muted-foreground" />
                                  <span className="text-sm text-foreground">{event.name}</span>
                                </div>
                                <span className="text-sm font-medium text-brand">
                                  ₪{(event.allocated_budget || 0).toLocaleString()}
                                </span>
                              </div>
                            );
                          })}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Section 2: Collection Status - Collapsible */}
            <div>
              <button
                onClick={() => toggleSection("collection")}
                className="w-full flex items-center justify-between p-4 hover:bg-muted/30 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium text-foreground">מצב גבייה</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">
                    {paidChildren.length}/{estimatedChildren} שילמו ({collectionPercentage}%)
                  </span>
                  <ChevronDown className={cn(
                    "h-4 w-4 text-muted-foreground transition-transform",
                    expandedSection === "collection" && "rotate-180"
                  )} />
                </div>
              </button>

              {expandedSection === "collection" && (
                <div className="px-4 pb-4 space-y-4">
                  {/* Progress bar */}
                  <div>
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

                  {/* 3 Status Blocks - Side by Side */}
                  <div className="grid grid-cols-3 gap-2">
                    {/* Paid Block - Clickable */}
                    <div
                      className={cn(
                        "p-3 bg-success/10 rounded-xl border border-success/20 text-center transition-all flex flex-col",
                        paidChildren.length > 0 && "hover:bg-success/20 hover:border-success/40"
                      )}
                    >
                      <button
                        onClick={() => {
                          setChildrenSearchQuery("");
                          setChildrenListModal({ open: true, type: "paid" });
                        }}
                        disabled={paidChildren.length === 0}
                        className={cn(
                          "flex-1",
                          paidChildren.length > 0 && "cursor-pointer"
                        )}
                      >
                        <Check className="h-5 w-5 text-success mx-auto mb-1" />
                        <p className="text-2xl font-bold text-success">{paidChildren.length}</p>
                        <p className="text-xs text-success/80">שילמו</p>
                      </button>
                    </div>

                    {/* Unpaid Block - Clickable */}
                    <button
                      onClick={() => {
                        setChildrenSearchQuery("");
                        setChildrenListModal({ open: true, type: "unpaid" });
                      }}
                      disabled={unpaidChildren.length === 0}
                      className={cn(
                        "p-3 bg-orange-500/10 rounded-xl border border-orange-500/20 text-center transition-all",
                        unpaidChildren.length > 0 && "hover:bg-orange-500/20 hover:border-orange-500/40 cursor-pointer"
                      )}
                    >
                      <XCircle className="h-5 w-5 text-orange-500 mx-auto mb-1" />
                      <p className="text-2xl font-bold text-orange-500">{unpaidChildren.length}</p>
                      <p className="text-xs text-orange-500/80">נרשמו ולא שילמו</p>
                    </button>

                    {/* Not Registered Block - Clickable */}
                    <button
                      onClick={() => onOpenPaymentSheetWithoutList?.()}
                      disabled={notRegisteredCount === 0}
                      className={cn(
                        "p-3 bg-rose-500/10 rounded-xl border border-rose-500/20 text-center transition-all",
                        notRegisteredCount > 0 && "hover:bg-rose-500/20 hover:border-rose-500/40 cursor-pointer"
                      )}
                    >
                      <UserPlus className="h-5 w-5 text-rose-500 mx-auto mb-1" />
                      <p className="text-2xl font-bold text-rose-500">{notRegisteredCount}</p>
                      <p className="text-xs text-rose-500/80">לא נרשמו ולא שילמו</p>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : selectedBlock === "expenses" ? (
        /* Block 2: Expenses Details */
        <div className="bg-card rounded-2xl border-2 border-border shadow-sm overflow-hidden">
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
        /* Block 3: Balance Details - Hierarchy */
        <div className="bg-card rounded-2xl border-2 border-border shadow-sm overflow-hidden">
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
                  <span className={cn(
                    "font-bold flex items-center gap-1",
                    actualBalance >= 0 ? "text-success" : "text-destructive"
                  )}>
                    ₪{actualBalance.toLocaleString()}
                    {actualBalance >= 0 && <Check className="h-4 w-4" />}
                  </span>
                </div>
              </div>
            </div>

            {/* Allocation status - from the balance */}
            <div>
              <p className="text-sm text-muted-foreground mb-2">📊 מצב הקצאות (מתוך היתרה)</p>
              <div className="bg-muted/50 rounded-xl p-4 space-y-3">
                {actualBalance > 0 ? (
                  <>
                    {/* How much of balance is allocated vs unallocated */}
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">מוקצה לאירועים</span>
                        <span className="font-medium text-brand">
                          ₪{Math.min(allocatedAndUnspent, actualBalance).toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">טרם הוקצה</span>
                        <span className="font-medium text-success">
                          ₪{Math.max(0, actualBalance - allocatedAndUnspent).toLocaleString()}
                        </span>
                      </div>
                    </div>

                    {/* Visual bar */}
                    <div className="h-3 bg-background rounded-full overflow-hidden flex">
                      <div
                        className="h-full bg-brand transition-all duration-300"
                        style={{
                          width: actualBalance > 0
                            ? `${Math.min((allocatedAndUnspent / actualBalance) * 100, 100)}%`
                            : "0%"
                        }}
                      />
                      <div
                        className="h-full bg-success transition-all duration-300"
                        style={{
                          width: actualBalance > 0
                            ? `${Math.max(0, ((actualBalance - allocatedAndUnspent) / actualBalance) * 100)}%`
                            : "0%"
                        }}
                      />
                    </div>

                    <div className="flex gap-4 text-xs">
                      <div className="flex items-center gap-1">
                        <div className="w-3 h-3 rounded bg-brand" />
                        <span>מוקצה</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <div className="w-3 h-3 rounded bg-success" />
                        <span>פנוי</span>
                      </div>
                    </div>
                  </>
                ) : (
                  <p className="text-sm text-destructive text-center py-2">
                    אין יתרה להקצאה
                  </p>
                )}
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
          </div>
        </div>
      )}

      {/* Timeline: Budgeted Events */}
      <div className="bg-card rounded-2xl p-4 border-2 border-border shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <Calendar className="h-5 w-5 text-brand" />
          <h3 className="text-sm font-bold text-foreground">אירועים שתוקצבו</h3>
        </div>
        {budgetedEvents.length > 0 ? (
          <div className="overflow-x-auto pb-2">
            <div className="flex items-end gap-4 min-w-max px-2">
              {budgetedEvents.map((event) => {
                const Icon = getEventIcon(event);
                const budget = event.allocated_budget || 0;
                const eventExpenses = expenses.filter(exp => exp.event_id === event.id);
                const totalSpent = eventExpenses.reduce((sum, exp) => sum + exp.amount, 0);
                const spentPercentage = budget > 0 ? Math.min((totalSpent / budget) * 100, 100) : 0;
                const isOverBudget = totalSpent > budget;
                const overage = isOverBudget ? totalSpent - budget : 0;
                const minHeight = 80;
                const maxHeight = 200;
                const barHeight = Math.max(
                  minHeight,
                  Math.min(maxHeight, (budget / maxBudget) * maxHeight)
                );
                const eventDateStr = getEventDateString(event);
                const formattedDate = eventDateStr
                  ? `${new Date(eventDateStr).getDate().toString().padStart(2, '0')}.${(new Date(eventDateStr).getMonth() + 1).toString().padStart(2, '0')}`
                  : "—";

                return (
                  <div key={event.id} className="flex flex-col items-center gap-2">
                    {isOverBudget && (
                      <span className="text-[10px] font-bold text-destructive bg-destructive/10 px-1.5 py-0.5 rounded-full whitespace-nowrap">
                        +₪{overage.toLocaleString()}
                      </span>
                    )}
                    {!isOverBudget && (
                      <span className="text-xs font-bold text-foreground whitespace-nowrap">
                        ₪{budget.toLocaleString()}
                      </span>
                    )}

                    <button
                      onClick={() => setSelectedEventId(event.id)}
                      className="w-14 rounded-lg border-2 border-border bg-muted relative overflow-hidden cursor-pointer hover:border-brand/50 transition-colors"
                      style={{ height: `${barHeight}px` }}
                      title={`${event.name}: ₪${totalSpent.toLocaleString()} / ₪${budget.toLocaleString()}`}
                    >
                      <div
                        className={cn(
                          "absolute bottom-0 left-0 right-0 transition-all duration-300",
                          isOverBudget ? "bg-destructive/40" : "bg-success/40"
                        )}
                        style={{ height: `${spentPercentage}%` }}
                      />
                      <div className="absolute inset-0 flex flex-col items-center justify-start pt-2 pb-3 gap-1">
                        <Icon className={cn(
                          "h-5 w-5 flex-shrink-0 relative z-10",
                          isOverBudget ? "text-destructive" : totalSpent > 0 ? "text-success" : "text-muted-foreground"
                        )} />
                        <div
                          className="flex-1 flex items-center justify-center overflow-hidden"
                          style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}
                        >
                          <span className={cn(
                            "text-xs font-medium whitespace-nowrap relative z-10",
                            isOverBudget ? "text-destructive" : totalSpent > 0 ? "text-success" : "text-foreground"
                          )}>
                            {event.name}
                          </span>
                        </div>
                      </div>
                    </button>

                    <span className="text-xs text-muted-foreground">
                      {formattedDate}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <p className="text-center text-muted-foreground py-4">
            אין אירועים עם תקציב מוקצה
          </p>
        )}
      </div>

      {/* Budget Editor Modal */}
      {classId && (
        <BudgetEditorModal
          open={budgetEditorOpen}
          onOpenChange={setBudgetEditorOpen}
          classId={classId}
          currentAmountPerChild={amountPerChild}
          currentEstimatedChildren={estimatedChildren}
          currentEstimatedStaff={estimatedStaff}
          events={events}
        />
      )}

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

      {/* Event Detail Modal */}
      <Dialog open={!!selectedEventId} onOpenChange={(open) => !open && setSelectedEventId(null)}>
        <DialogContent className="max-w-md" dir="rtl">
          {selectedEvent && (() => {
            const eventExpensesList = expenses.filter(exp => exp.event_id === selectedEvent.id);
            const eventTotalSpent = eventExpensesList.reduce((sum, exp) => sum + exp.amount, 0);
            const eventBudget = selectedEvent.allocated_budget || 0;
            const eventIsOverBudget = eventTotalSpent > eventBudget;
            const EventIcon = getEventIcon(selectedEvent);
            const eventDateStr = getEventDateString(selectedEvent);

            return (
              <>
                <DialogHeader>
                  <DialogTitle className="text-right flex items-center gap-2">
                    <EventIcon className="h-5 w-5 text-brand" />
                    {selectedEvent.name}
                  </DialogTitle>
                  <DialogDescription className="text-right">
                    {eventDateStr ? formatHebrewDate(eventDateStr) : "תאריך לא נקבע"}
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                  <div className="bg-muted/50 rounded-xl p-3 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">תקציב מוקצה</span>
                      <span className="font-medium">₪{eventBudget.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">סה״כ הוצאות</span>
                      <span className={cn(
                        "font-medium",
                        eventIsOverBudget ? "text-destructive" : "text-success"
                      )}>
                        ₪{eventTotalSpent.toLocaleString()}
                      </span>
                    </div>
                    <div className="h-2 bg-background rounded-full overflow-hidden">
                      <div
                        className={cn(
                          "h-full rounded-full transition-all duration-300",
                          eventIsOverBudget ? "bg-destructive" : "bg-success"
                        )}
                        style={{ width: `${Math.min((eventTotalSpent / eventBudget) * 100, 100)}%` }}
                      />
                    </div>
                    {eventIsOverBudget && (
                      <p className="text-xs text-destructive flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        חריגה של ₪{(eventTotalSpent - eventBudget).toLocaleString()}
                      </p>
                    )}
                  </div>

                  <div>
                    <h4 className="text-sm font-medium text-foreground mb-2">הוצאות ({eventExpensesList.length})</h4>
                    {eventExpensesList.length > 0 ? (
                      <div className="space-y-2 max-h-48 overflow-y-auto">
                        {eventExpensesList.map((expense) => (
                          <div
                            key={expense.id}
                            className="flex items-center justify-between p-2 bg-muted/30 rounded-lg text-sm"
                          >
                            <div>
                              <p className="font-medium text-foreground">{expense.description}</p>
                              <p className="text-xs text-muted-foreground">
                                {formatHebrewDate(expense.expense_date)}
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold">₪{expense.amount.toLocaleString()}</span>
                              <button
                                onClick={() => {
                                  setSelectedEventId(null);
                                  setDeleteExpenseId(expense.id);
                                }}
                                className="p-1 rounded hover:bg-destructive/10 transition-colors"
                              >
                                <Trash2 className="h-3.5 w-3.5 text-destructive" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        אין הוצאות לאירוע זה
                      </p>
                    )}
                  </div>
                </div>

                <DialogFooter className="gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setSelectedEventId(null)}
                    className="rounded-xl"
                  >
                    סגור
                  </Button>
                  <Button
                    onClick={() => {
                      setSelectedEventId(null);
                      setExpenseForm({
                        ...expenseForm,
                        event_id: selectedEvent.id,
                      });
                      setExpenseModalOpen(true);
                    }}
                    className="rounded-xl gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    הוסף הוצאה
                  </Button>
                </DialogFooter>
              </>
            );
          })()}
        </DialogContent>
      </Dialog>

      {/* Children List Modal (Paid/Unpaid) */}
      <Dialog
        open={childrenListModal.open}
        onOpenChange={(open) => {
          if (!open) {
            setChildrenListModal({ open: false, type: null });
            setChildrenSearchQuery("");
          }
        }}
      >
        <DialogContent className="max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-right flex items-center gap-2">
              {childrenListModal.type === "paid" ? (
                <>
                  <Check className="h-5 w-5 text-success" />
                  ילדים ששילמו ({paidChildren.length})
                </>
              ) : (
                <>
                  <XCircle className="h-5 w-5 text-orange-500" />
                  ילדים שלא שילמו ({unpaidChildren.length})
                </>
              )}
            </DialogTitle>
            <DialogDescription className="text-right">
              {childrenListModal.type === "paid"
                ? "רשימת כל הילדים ששילמו את דמי הוועד"
                : "רשימת הילדים שעדיין לא שילמו"}
            </DialogDescription>
          </DialogHeader>

          {/* Search Input */}
          <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="חיפוש לפי שם..."
              value={childrenSearchQuery}
              onChange={(e) => setChildrenSearchQuery(e.target.value)}
              className="pr-10 rounded-xl"
            />
            {childrenSearchQuery && (
              <button
                onClick={() => setChildrenSearchQuery("")}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Children List */}
          <div className="max-h-[300px] overflow-y-auto space-y-2">
            {(() => {
              const listToShow = childrenListModal.type === "paid" ? paidChildren : unpaidChildren;
              const filteredList = listToShow.filter((child) =>
                child.name.toLowerCase().includes(childrenSearchQuery.toLowerCase())
              );

              if (filteredList.length === 0) {
                return (
                  <div className="text-center py-8 text-muted-foreground">
                    <Search className="h-10 w-10 mx-auto mb-2 opacity-50" />
                    <p>לא נמצאו תוצאות</p>
                  </div>
                );
              }

              return filteredList.map((child) => (
                <div
                  key={child.id}
                  className={cn(
                    "flex items-center justify-between p-3 rounded-xl border",
                    childrenListModal.type === "paid"
                      ? "bg-success/5 border-success/20"
                      : "bg-orange-500/5 border-orange-500/20"
                  )}
                >
                  <span className="font-medium text-foreground">{child.name}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">לא שולם</span>
                    <Switch
                      checked={childrenListModal.type === "paid"}
                      onCheckedChange={(checked) => {
                        if (checked && onMarkChildPaid) {
                          onMarkChildPaid(child.id);
                        } else if (!checked && onMarkChildUnpaid) {
                          onMarkChildUnpaid(child.id);
                        }
                      }}
                      className="data-[state=checked]:bg-green-600"
                    />
                    <span className="text-xs text-green-600 font-medium">שולם</span>
                  </div>
                </div>
              ));
            })()}
          </div>

          <DialogFooter className="flex-row-reverse justify-between sm:justify-between gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setChildrenListModal({ open: false, type: null });
                setChildrenSearchQuery("");
              }}
              className="rounded-xl"
            >
              סגור
            </Button>
            {childrenListModal.type === "unpaid" && unpaidChildren.length > 0 && (
              <Button
                onClick={() => {
                  setChildrenListModal({ open: false, type: null });
                  setChildrenSearchQuery("");
                  onOpenPaymentSheetWithoutList?.();
                }}
                className="rounded-xl gap-1 bg-orange-600 hover:bg-orange-700 text-white"
              >
                <Send className="h-4 w-4" />
                שלחו תזכורת
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
