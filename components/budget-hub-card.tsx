"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from "@/components/ui/dialog";
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  Calendar,
  Plus,
  Copy,
  Download,
  Receipt,
  PiggyBank,
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Pencil,
  Trash2
} from "lucide-react";
import type {
  BudgetHubTab,
  PaymentRound,
  PaymentRoundWithPayments,
  ExpenseWithEvent,
  ChildPaymentStatus,
  PaymentStatus
} from "@/lib/types/budget";

// ============================================
// Type Definitions
// ============================================

type Event = {
  id: string;
  name: string;
  event_type: string;
  icon: string | null;
  allocated_budget: number;
  spent_amount: number;
  event_date: string | null;
};

type Child = {
  id: string;
  name: string;
  parents?: { name: string; phone: string | null }[];
};

type BudgetMetrics = {
  total: number;
  allocated: number;
  spent: number;
  remaining: number;
};

type BudgetHubCardProps = {
  classId: string;
  budgetMetrics: BudgetMetrics;
  events: Event[];
  children: Child[];
  paymentRounds: PaymentRoundWithPayments[];
  expenses: ExpenseWithEvent[];
  className?: string;
  onCreatePaymentRound?: (data: { name: string; amount_per_child: number; due_date?: string }) => Promise<void>;
  onUpdatePaymentStatus?: (paymentRoundId: string, childId: string, status: PaymentStatus) => Promise<void>;
  onBulkUpdatePayments?: (paymentRoundId: string, childIds: string[], status: PaymentStatus) => Promise<void>;
  onCreateExpense?: (data: { description: string; amount: number; expense_date: string; event_id?: string }) => Promise<void>;
  onDeleteExpense?: (expenseId: string) => Promise<void>;
  onUpdateEventBudget?: (eventId: string, budget: number) => Promise<void>;
};

// ============================================
// Helper Components
// ============================================

function StatCard({
  icon: Icon,
  label,
  value,
  subValue,
  colorClass
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  subValue?: string;
  colorClass: string;
}) {
  return (
    <div className={`${colorClass} rounded-xl p-4`}>
      <div className="flex items-center gap-2 mb-2">
        <Icon className="h-4 w-4" />
        <span className="text-sm font-medium">{label}</span>
      </div>
      <div className="text-2xl font-bold">{value}</div>
      {subValue && <div className="text-xs mt-1 opacity-80">{subValue}</div>}
    </div>
  );
}

// ============================================
// Collection Tab Component (גבייה)
// ============================================

function CollectionTab({
  paymentRounds,
  children,
  onCreatePaymentRound,
  onUpdatePaymentStatus,
  onBulkUpdatePayments,
}: {
  paymentRounds: PaymentRoundWithPayments[];
  children: Child[];
  onCreatePaymentRound?: (data: { name: string; amount_per_child: number; due_date?: string }) => Promise<void>;
  onUpdatePaymentStatus?: (paymentRoundId: string, childId: string, status: PaymentStatus) => Promise<void>;
  onBulkUpdatePayments?: (paymentRoundId: string, childIds: string[], status: PaymentStatus) => Promise<void>;
}) {
  const [expandedRound, setExpandedRound] = useState<string | null>(null);
  const [selectedChildren, setSelectedChildren] = useState<Set<string>>(new Set());
  const [newRoundName, setNewRoundName] = useState("");
  const [newRoundAmount, setNewRoundAmount] = useState("");
  const [newRoundDueDate, setNewRoundDueDate] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const handleCreateRound = async () => {
    if (!onCreatePaymentRound || !newRoundName || !newRoundAmount) return;
    setIsCreating(true);
    try {
      await onCreatePaymentRound({
        name: newRoundName,
        amount_per_child: parseFloat(newRoundAmount),
        due_date: newRoundDueDate || undefined,
      });
      setNewRoundName("");
      setNewRoundAmount("");
      setNewRoundDueDate("");
    } finally {
      setIsCreating(false);
    }
  };

  const handleBulkMarkPaid = async (roundId: string) => {
    if (!onBulkUpdatePayments || selectedChildren.size === 0) return;
    await onBulkUpdatePayments(roundId, Array.from(selectedChildren), "paid");
    setSelectedChildren(new Set());
  };

  const copyUnpaidToClipboard = (round: PaymentRoundWithPayments) => {
    const unpaidList = round.payments
      .filter(p => p.status === "unpaid")
      .map(p => {
        const parentNames = p.child.parents?.map(par => par.name).join(", ") || "";
        return `${p.child.name} (${parentNames})`;
      })
      .join("\n");

    const message = `שלום,\nתזכורת לתשלום "${round.name}" - ₪${round.amount_per_child}\n\nטרם שילמו:\n${unpaidList}`;
    navigator.clipboard.writeText(message);
  };

  const toggleChildSelection = (childId: string) => {
    const newSelection = new Set(selectedChildren);
    if (newSelection.has(childId)) {
      newSelection.delete(childId);
    } else {
      newSelection.add(childId);
    }
    setSelectedChildren(newSelection);
  };

  const selectAllUnpaid = (round: PaymentRoundWithPayments) => {
    const unpaidIds = round.payments
      .filter(p => p.status === "unpaid")
      .map(p => p.child.id);
    setSelectedChildren(new Set(unpaidIds));
  };

  if (paymentRounds.length === 0 && children.length === 0) {
    return (
      <div className="text-center py-12">
        <PiggyBank className="h-16 w-16 mx-auto text-gray-300 mb-4" />
        <p className="text-gray-500 mb-2">אין עדיין ילדים בכיתה</p>
        <p className="text-sm text-gray-400">הוסיפו ילדים לכיתה כדי להתחיל לנהל גביות</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Create New Payment Round */}
      <Dialog>
        <DialogTrigger asChild>
          <Button className="w-full bg-[#A78BFA] hover:bg-[#9333EA] rounded-xl">
            <Plus className="ml-2 h-4 w-4" />
            גיוס חדש
          </Button>
        </DialogTrigger>
        <DialogContent dir="rtl">
          <DialogHeader>
            <DialogTitle>יצירת גיוס חדש</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="round-name">שם הגיוס</Label>
              <Input
                id="round-name"
                placeholder='לדוגמה: "תשלום שנתי" או "גיוס לטיול"'
                value={newRoundName}
                onChange={(e) => setNewRoundName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="round-amount">סכום לילד (₪)</Label>
              <Input
                id="round-amount"
                type="number"
                placeholder="0"
                value={newRoundAmount}
                onChange={(e) => setNewRoundAmount(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="round-date">תאריך יעד (אופציונלי)</Label>
              <Input
                id="round-date"
                type="date"
                value={newRoundDueDate}
                onChange={(e) => setNewRoundDueDate(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">ביטול</Button>
            </DialogClose>
            <Button
              onClick={handleCreateRound}
              disabled={isCreating || !newRoundName || !newRoundAmount}
              className="bg-[#A78BFA] hover:bg-[#9333EA]"
            >
              {isCreating ? "יוצר..." : "צור גיוס"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Payment Rounds List */}
      {paymentRounds.length === 0 ? (
        <div className="text-center py-8">
          <PiggyBank className="h-12 w-12 mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500">טרם נוצרו גיוסים</p>
          <p className="text-sm text-gray-400">לחצו על &quot;גיוס חדש&quot; כדי להתחיל</p>
        </div>
      ) : (
        <div className="space-y-4">
          {paymentRounds.map((round) => {
            const isExpanded = expandedRound === round.id;
            const progressPercent = round.summary.progress_percentage;

            return (
              <div
                key={round.id}
                className="border-2 border-gray-100 rounded-2xl overflow-hidden"
              >
                {/* Round Header */}
                <div
                  className="p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                  onClick={() => setExpandedRound(isExpanded ? null : round.id)}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500 to-blue-600">
                        <PiggyBank className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <h4 className="font-bold text-lg text-[#222222]">{round.name}</h4>
                        <p className="text-sm text-gray-500">
                          ₪{round.amount_per_child} לילד
                          {round.due_date && ` • עד ${new Date(round.due_date).toLocaleDateString('he-IL')}`}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-left">
                        <p className="text-lg font-bold text-[#A78BFA]">
                          {round.summary.paid_count}/{round.summary.total_children}
                        </p>
                        <p className="text-xs text-gray-500">שילמו</p>
                      </div>
                      {isExpanded ? (
                        <ChevronUp className="h-5 w-5 text-gray-400" />
                      ) : (
                        <ChevronDown className="h-5 w-5 text-gray-400" />
                      )}
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="space-y-1">
                    <Progress value={progressPercent} className="h-2" />
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>₪{round.summary.total_collected.toLocaleString()} נאסף</span>
                      <span>₪{round.summary.expected_total.toLocaleString()} צפוי</span>
                    </div>
                  </div>
                </div>

                {/* Expanded Content */}
                {isExpanded && (
                  <div className="border-t-2 border-gray-100 p-4 bg-gray-50">
                    {/* Action Buttons */}
                    <div className="flex gap-2 mb-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyUnpaidToClipboard(round)}
                        className="rounded-xl"
                      >
                        <Copy className="ml-2 h-4 w-4" />
                        העתק רשימה לוואטסאפ
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="rounded-xl"
                      >
                        <Download className="ml-2 h-4 w-4" />
                        ייצוא לאקסל
                      </Button>
                      {selectedChildren.size > 0 && (
                        <Button
                          size="sm"
                          className="bg-green-600 hover:bg-green-700 rounded-xl mr-auto"
                          onClick={() => handleBulkMarkPaid(round.id)}
                        >
                          <CheckCircle2 className="ml-2 h-4 w-4" />
                          סמן {selectedChildren.size} כשילמו
                        </Button>
                      )}
                    </div>

                    {/* Select All Unpaid */}
                    {round.summary.unpaid_count > 0 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => selectAllUnpaid(round)}
                        className="mb-3 text-sm"
                      >
                        בחר את כל מי שלא שילם ({round.summary.unpaid_count})
                      </Button>
                    )}

                    {/* Children List */}
                    <div className="space-y-2 max-h-80 overflow-y-auto">
                      {round.payments.map((payment) => (
                        <div
                          key={payment.child.id}
                          className={`flex items-center justify-between p-3 rounded-xl ${
                            payment.status === "paid"
                              ? "bg-green-50 border border-green-200"
                              : "bg-white border border-gray-200"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            {payment.status === "unpaid" && (
                              <Checkbox
                                checked={selectedChildren.has(payment.child.id)}
                                onCheckedChange={() => toggleChildSelection(payment.child.id)}
                              />
                            )}
                            <div>
                              <p className="font-medium text-[#222222]">{payment.child.name}</p>
                              {payment.child.parents && payment.child.parents.length > 0 && (
                                <p className="text-xs text-gray-500">
                                  {payment.child.parents.map(p => p.name).join(", ")}
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {payment.status === "paid" ? (
                              <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                                <CheckCircle2 className="ml-1 h-3 w-3" />
                                שולם
                              </Badge>
                            ) : (
                              <>
                                <Badge variant="outline" className="text-gray-600">
                                  לא שולם
                                </Badge>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => onUpdatePaymentStatus?.(round.id, payment.child.id, "paid")}
                                  className="text-green-600 hover:text-green-700 hover:bg-green-50"
                                >
                                  <CheckCircle2 className="h-4 w-4" />
                                </Button>
                              </>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ============================================
// Expenses Tab Component (הוצאות)
// ============================================

function ExpensesTab({
  expenses,
  events,
  totalSpent,
  onCreateExpense,
  onDeleteExpense,
}: {
  expenses: ExpenseWithEvent[];
  events: Event[];
  totalSpent: number;
  onCreateExpense?: (data: { description: string; amount: number; expense_date: string; event_id?: string }) => Promise<void>;
  onDeleteExpense?: (expenseId: string) => Promise<void>;
}) {
  const [newDescription, setNewDescription] = useState("");
  const [newAmount, setNewAmount] = useState("");
  const [newDate, setNewDate] = useState(new Date().toISOString().split('T')[0]);
  const [newEventId, setNewEventId] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const handleCreateExpense = async () => {
    if (!onCreateExpense || !newDescription || !newAmount) return;
    setIsCreating(true);
    try {
      await onCreateExpense({
        description: newDescription,
        amount: parseFloat(newAmount),
        expense_date: newDate,
        event_id: newEventId || undefined,
      });
      setNewDescription("");
      setNewAmount("");
      setNewEventId("");
    } finally {
      setIsCreating(false);
    }
  };

  // Calculate running balance
  const expensesWithBalance = expenses
    .sort((a, b) => new Date(b.expense_date).getTime() - new Date(a.expense_date).getTime())
    .reduce<(ExpenseWithEvent & { runningBalance: number })[]>((acc, expense, index) => {
      const previousBalance = index === 0 ? totalSpent : acc[index - 1].runningBalance - acc[index - 1].amount;
      acc.push({ ...expense, runningBalance: previousBalance });
      return acc;
    }, []);

  return (
    <div className="space-y-6">
      {/* Add Expense Form */}
      <Dialog>
        <DialogTrigger asChild>
          <Button className="w-full bg-[#A78BFA] hover:bg-[#9333EA] rounded-xl">
            <Plus className="ml-2 h-4 w-4" />
            הוצאה חדשה
          </Button>
        </DialogTrigger>
        <DialogContent dir="rtl">
          <DialogHeader>
            <DialogTitle>הוספת הוצאה</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="expense-desc">תיאור</Label>
              <Input
                id="expense-desc"
                placeholder="לדוגמה: רכישת מתנות לימי הולדת"
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="expense-amount">סכום (₪)</Label>
              <Input
                id="expense-amount"
                type="number"
                placeholder="0"
                value={newAmount}
                onChange={(e) => setNewAmount(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="expense-date">תאריך</Label>
              <Input
                id="expense-date"
                type="date"
                value={newDate}
                onChange={(e) => setNewDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="expense-event">קישור לאירוע (אופציונלי)</Label>
              <select
                id="expense-event"
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={newEventId}
                onChange={(e) => setNewEventId(e.target.value)}
              >
                <option value="">ללא קישור</option>
                {events.map((event) => (
                  <option key={event.id} value={event.id}>
                    {event.icon} {event.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">ביטול</Button>
            </DialogClose>
            <Button
              onClick={handleCreateExpense}
              disabled={isCreating || !newDescription || !newAmount}
              className="bg-[#A78BFA] hover:bg-[#9333EA]"
            >
              {isCreating ? "שומר..." : "שמור הוצאה"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Total Spent Summary */}
      <div className="bg-gradient-to-br from-red-50 to-orange-50 rounded-xl p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Receipt className="h-5 w-5 text-red-600" />
            <span className="font-medium text-red-700">סה&quot;כ הוצאות</span>
          </div>
          <span className="text-2xl font-bold text-red-900">₪{totalSpent.toLocaleString()}</span>
        </div>
      </div>

      {/* Expenses List */}
      {expenses.length === 0 ? (
        <div className="text-center py-8">
          <Receipt className="h-12 w-12 mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500">טרם נרשמו הוצאות</p>
        </div>
      ) : (
        <div className="space-y-3">
          {expensesWithBalance.map((expense) => (
            <div
              key={expense.id}
              className="border-2 border-gray-100 rounded-xl p-4 hover:border-gray-200 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-medium text-[#222222]">{expense.description}</h4>
                    {expense.event && (
                      <Badge variant="outline" className="text-xs">
                        {expense.event.icon} {expense.event.name}
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-gray-500">
                    {new Date(expense.expense_date).toLocaleDateString('he-IL')}
                  </p>
                </div>
                <div className="text-left">
                  <p className="text-lg font-bold text-red-600">-₪{expense.amount.toLocaleString()}</p>
                  <p className="text-xs text-gray-500">
                    יתרה: ₪{expense.runningBalance.toLocaleString()}
                  </p>
                </div>
                {onDeleteExpense && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="mr-2 text-gray-400 hover:text-red-600"
                    onClick={() => onDeleteExpense(expense.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================
// Allocations Tab Component (הקצאות)
// ============================================

function AllocationsTab({
  events,
  totalBudget,
  totalAllocated,
  onUpdateEventBudget,
}: {
  events: Event[];
  totalBudget: number;
  totalAllocated: number;
  onUpdateEventBudget?: (eventId: string, budget: number) => Promise<void>;
}) {
  const [editingEvent, setEditingEvent] = useState<string | null>(null);
  const [editBudget, setEditBudget] = useState("");

  const handleSaveBudget = async (eventId: string) => {
    if (!onUpdateEventBudget) return;
    await onUpdateEventBudget(eventId, parseFloat(editBudget) || 0);
    setEditingEvent(null);
    setEditBudget("");
  };

  const unallocated = totalBudget - totalAllocated;
  const isOverAllocated = unallocated < 0;

  return (
    <div className="space-y-6">
      {/* Budget Summary */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-3 text-center">
          <p className="text-xs text-purple-700">תקציב כולל</p>
          <p className="text-lg font-bold text-purple-900">₪{totalBudget.toLocaleString()}</p>
        </div>
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-3 text-center">
          <p className="text-xs text-blue-700">מוקצה</p>
          <p className="text-lg font-bold text-blue-900">₪{totalAllocated.toLocaleString()}</p>
        </div>
        <div className={`rounded-xl p-3 text-center ${
          isOverAllocated
            ? "bg-gradient-to-br from-red-50 to-red-100"
            : "bg-gradient-to-br from-green-50 to-green-100"
        }`}>
          <p className={`text-xs ${isOverAllocated ? "text-red-700" : "text-green-700"}`}>
            {isOverAllocated ? "חריגה" : "פנוי"}
          </p>
          <p className={`text-lg font-bold ${isOverAllocated ? "text-red-900" : "text-green-900"}`}>
            ₪{Math.abs(unallocated).toLocaleString()}
          </p>
        </div>
      </div>

      {/* Events Allocation List */}
      {events.length === 0 ? (
        <div className="text-center py-12">
          <Calendar className="h-16 w-16 mx-auto text-gray-300 mb-4" />
          <p className="text-gray-500 mb-4">טרם נוספו אירועים</p>
          <Button className="bg-[#A78BFA] hover:bg-[#9333EA] rounded-2xl">
            <Plus className="ml-2 h-4 w-4" />
            הוסף אירוע ראשון
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {events.map((event) => {
            const spentPercentage = event.allocated_budget > 0
              ? (event.spent_amount / event.allocated_budget) * 100
              : 0;
            const isOverspent = event.spent_amount > event.allocated_budget;
            const isEditing = editingEvent === event.id;

            return (
              <div
                key={event.id}
                className="border-2 border-gray-100 rounded-2xl p-4 hover:border-[#A78BFA] transition-colors"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="text-3xl">{event.icon || "📅"}</div>
                    <div>
                      <h4 className="font-bold text-lg text-[#222222]">{event.name}</h4>
                      {event.event_date && (
                        <p className="text-sm text-gray-500">
                          {new Date(event.event_date).toLocaleDateString('he-IL', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {isEditing ? (
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          className="w-24 text-left"
                          value={editBudget}
                          onChange={(e) => setEditBudget(e.target.value)}
                          placeholder="₪"
                        />
                        <Button
                          size="sm"
                          onClick={() => handleSaveBudget(event.id)}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          שמור
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setEditingEvent(null)}
                        >
                          ביטול
                        </Button>
                      </div>
                    ) : (
                      <>
                        <div className="text-left">
                          <p className="text-sm text-gray-600">הוקצה</p>
                          <p className={`text-lg font-bold ${isOverspent ? 'text-red-600' : 'text-[#A78BFA]'}`}>
                            ₪{event.allocated_budget.toLocaleString()}
                          </p>
                        </div>
                        {onUpdateEventBudget && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setEditingEvent(event.id);
                              setEditBudget(event.allocated_budget.toString());
                            }}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                        )}
                      </>
                    )}
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="space-y-1">
                  <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        isOverspent ? 'bg-red-500' : 'bg-gradient-to-r from-[#A78BFA] to-[#60A5FA]'
                      }`}
                      style={{ width: `${Math.min(spentPercentage, 100)}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>{spentPercentage.toFixed(0)}% נוצל</span>
                    <span>₪{event.spent_amount.toLocaleString()} מתוך ₪{event.allocated_budget.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ============================================
// Summary Tab Component (סיכום)
// ============================================

function SummaryTab({
  budgetMetrics,
  paymentRounds,
  totalCollected,
  unpaidCount,
}: {
  budgetMetrics: BudgetMetrics;
  paymentRounds: PaymentRoundWithPayments[];
  totalCollected: number;
  unpaidCount: number;
}) {
  const balance = totalCollected - budgetMetrics.spent;
  const isNegativeBalance = balance < 0;

  return (
    <div className="space-y-6">
      {/* Main Balance Card */}
      <div className={`rounded-2xl p-6 ${
        isNegativeBalance
          ? "bg-gradient-to-br from-red-500 to-orange-600"
          : "bg-gradient-to-br from-green-500 to-emerald-600"
      }`}>
        <div className="text-center text-white">
          <p className="text-sm opacity-80 mb-1">יתרת קופה</p>
          <p className="text-4xl font-bold">
            {isNegativeBalance ? "-" : ""}₪{Math.abs(balance).toLocaleString()}
          </p>
          {isNegativeBalance && (
            <p className="text-sm mt-2 opacity-90">
              <AlertCircle className="inline h-4 w-4 ml-1" />
              הקופה בגירעון
            </p>
          )}
        </div>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-2 gap-4">
        <StatCard
          icon={TrendingUp}
          label="נאסף"
          value={`₪${totalCollected.toLocaleString()}`}
          colorClass="bg-gradient-to-br from-green-50 to-green-100 text-green-700"
        />
        <StatCard
          icon={TrendingDown}
          label="הוצא"
          value={`₪${budgetMetrics.spent.toLocaleString()}`}
          colorClass="bg-gradient-to-br from-red-50 to-red-100 text-red-700"
        />
        <StatCard
          icon={DollarSign}
          label="תקציב מוקצה"
          value={`₪${budgetMetrics.allocated.toLocaleString()}`}
          colorClass="bg-gradient-to-br from-blue-50 to-blue-100 text-blue-700"
        />
        <StatCard
          icon={Wallet}
          label="תקציב כולל"
          value={`₪${budgetMetrics.total.toLocaleString()}`}
          colorClass="bg-gradient-to-br from-purple-50 to-purple-100 text-purple-700"
        />
      </div>

      {/* Unpaid Alert */}
      {unpaidCount > 0 && (
        <div className="bg-yellow-50 border-2 border-yellow-200 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-yellow-600" />
            <div>
              <p className="font-semibold text-yellow-800">
                {unpaidCount} ילדים טרם שילמו
              </p>
              <p className="text-sm text-yellow-700">
                עברו ללשונית &quot;גבייה&quot; לצפייה ברשימה המלאה
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Collection Progress by Round */}
      {paymentRounds.length > 0 && (
        <div className="space-y-3">
          <h4 className="font-semibold text-[#222222]">התקדמות גביות</h4>
          {paymentRounds.map((round) => (
            <div key={round.id} className="flex items-center gap-4">
              <div className="flex-1">
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-medium">{round.name}</span>
                  <span className="text-gray-500">
                    {round.summary.paid_count}/{round.summary.total_children}
                  </span>
                </div>
                <Progress value={round.summary.progress_percentage} className="h-2" />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================
// Main Budget Hub Component
// ============================================

export function BudgetHubCard({
  classId,
  budgetMetrics,
  events,
  children,
  paymentRounds = [],
  expenses = [],
  className,
  onCreatePaymentRound,
  onUpdatePaymentStatus,
  onBulkUpdatePayments,
  onCreateExpense,
  onDeleteExpense,
  onUpdateEventBudget,
}: BudgetHubCardProps) {
  const [activeTab, setActiveTab] = useState<BudgetHubTab>("summary");

  // Calculate totals
  const totalCollected = paymentRounds.reduce(
    (sum, round) => sum + round.summary.total_collected,
    0
  );
  const totalUnpaid = paymentRounds.reduce(
    (sum, round) => sum + round.summary.unpaid_count,
    0
  );
  const totalSpent = expenses.reduce((sum, exp) => sum + exp.amount, 0);

  return (
    <Card className={`shadow-xl rounded-3xl border-2 border-gray-100 ${className}`} dir="rtl">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500 to-blue-600">
            <Wallet className="h-6 w-6 text-white" />
          </div>
          <div>
            <CardTitle className="text-2xl font-extrabold text-[#222222]">מרכז התקציב</CardTitle>
            <CardDescription className="text-base">ניהול תקציב, גביות והוצאות</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as BudgetHubTab)} className="w-full" dir="rtl">
          <TabsList className="grid w-full grid-cols-4 mb-6">
            <TabsTrigger value="summary">סיכום</TabsTrigger>
            <TabsTrigger value="collection">גבייה</TabsTrigger>
            <TabsTrigger value="allocations">הקצאות</TabsTrigger>
            <TabsTrigger value="expenses">הוצאות</TabsTrigger>
          </TabsList>

          <TabsContent value="summary">
            <SummaryTab
              budgetMetrics={budgetMetrics}
              paymentRounds={paymentRounds}
              totalCollected={totalCollected}
              unpaidCount={totalUnpaid}
            />
          </TabsContent>

          <TabsContent value="collection">
            <CollectionTab
              paymentRounds={paymentRounds}
              children={children}
              onCreatePaymentRound={onCreatePaymentRound}
              onUpdatePaymentStatus={onUpdatePaymentStatus}
              onBulkUpdatePayments={onBulkUpdatePayments}
            />
          </TabsContent>

          <TabsContent value="allocations">
            <AllocationsTab
              events={events}
              totalBudget={budgetMetrics.total}
              totalAllocated={budgetMetrics.allocated}
              onUpdateEventBudget={onUpdateEventBudget}
            />
          </TabsContent>

          <TabsContent value="expenses">
            <ExpensesTab
              expenses={expenses}
              events={events}
              totalSpent={totalSpent}
              onCreateExpense={onCreateExpense}
              onDeleteExpense={onDeleteExpense}
            />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
