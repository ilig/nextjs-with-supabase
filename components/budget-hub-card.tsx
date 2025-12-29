"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
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
  Trash2,
  Upload,
  FileText,
  ExternalLink,
  X
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
  onCreateExpense?: (data: { description: string; amount: number; expense_date: string; event_id?: string; receipt_url?: string }) => Promise<void>;
  onDeleteExpense?: (expenseId: string) => Promise<void>;
  onUpdateEventBudget?: (eventId: string, budget: number) => Promise<void>;
  onCreateEvent?: (data: { name: string; icon: string; allocated_budget: number }) => Promise<void>;
  onUploadReceipt?: (formData: FormData) => Promise<{ success: boolean; url?: string; path?: string; error?: string }>;
  onGetReceiptUrl?: (path: string) => Promise<{ success: boolean; url?: string; error?: string }>;
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

  const [copiedRoundId, setCopiedRoundId] = useState<string | null>(null);

  const copyUnpaidToClipboard = async (round: PaymentRoundWithPayments) => {
    const unpaidPayments = round.payments.filter(p => p.status === "unpaid");

    const unpaidList = unpaidPayments
      .map((p, index) => {
        const parentNames = p.child.parents?.filter(par => par.name).map(par => par.name).join(" ו") || "";
        const parentInfo = parentNames ? ` (הורה: ${parentNames})` : "";
        return `${index + 1}. ${p.child.name}${parentInfo}`;
      })
      .join("\n");

    const message = `שלום רב 👋

תזכורת ידידותית לתשלום עבור *${round.name}*
💰 סכום: ₪${round.amount_per_child}

📋 טרם שילמו (${unpaidPayments.length}):
${unpaidList}

תודה רבה! 🙏`;

    await navigator.clipboard.writeText(message);
    setCopiedRoundId(round.id);
    setTimeout(() => setCopiedRoundId(null), 2000);
  };

  const exportToExcel = (round: PaymentRoundWithPayments) => {
    import("xlsx").then((XLSX) => {
      const data = round.payments.map(p => ({
        "שם הילד": p.child.name,
        "הורים": p.child.parents?.map(par => par.name).join(", ") || "",
        "טלפון": p.child.parents?.map(par => par.phone).filter(Boolean).join(", ") || "",
        "סכום": round.amount_per_child,
        "סטטוס": p.status === "paid" ? "שולם" : "לא שולם"
      }));

      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "תשלומים");
      XLSX.writeFile(wb, `${round.name}_payments.xlsx`);
    });
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

  const toggleSelectAllUnpaid = (round: PaymentRoundWithPayments) => {
    const unpaidIds = round.payments
      .filter(p => p.status === "unpaid")
      .map(p => p.child.id);

    // Check if all unpaid are already selected
    const allUnpaidSelected = unpaidIds.every(id => selectedChildren.has(id));

    if (allUnpaidSelected) {
      // Deselect all
      setSelectedChildren(new Set());
    } else {
      // Select all unpaid
      setSelectedChildren(new Set(unpaidIds));
    }
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
                        className={`rounded-xl transition-all ${copiedRoundId === round.id ? "bg-green-100 border-green-500 text-green-700" : ""}`}
                      >
                        {copiedRoundId === round.id ? (
                          <>
                            <CheckCircle2 className="ml-2 h-4 w-4" />
                            הועתק!
                          </>
                        ) : (
                          <>
                            <Copy className="ml-2 h-4 w-4" />
                            העתק רשימה לוואטסאפ
                          </>
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => exportToExcel(round)}
                        className="rounded-xl"
                      >
                        <Download className="ml-2 h-4 w-4" />
                        ייצוא לאקסל
                      </Button>
                      {selectedChildren.size > 0 && (
                        <div className="flex gap-2 mr-auto">
                          <Button
                            size="sm"
                            className="bg-green-600 hover:bg-green-700 rounded-xl"
                            onClick={() => handleBulkMarkPaid(round.id)}
                          >
                            <CheckCircle2 className="ml-2 h-4 w-4" />
                            סמן {selectedChildren.size} כשילמו
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="rounded-xl"
                            onClick={() => {
                              onBulkUpdatePayments?.(round.id, Array.from(selectedChildren), "unpaid");
                              setSelectedChildren(new Set());
                            }}
                          >
                            סמן {selectedChildren.size} כלא שילמו
                          </Button>
                        </div>
                      )}
                    </div>

                    {/* Select All Unpaid */}
                    {round.summary.unpaid_count > 0 && (() => {
                      const unpaidIds = round.payments.filter(p => p.status === "unpaid").map(p => p.child.id);
                      const allUnpaidSelected = unpaidIds.length > 0 && unpaidIds.every(id => selectedChildren.has(id));

                      return (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => toggleSelectAllUnpaid(round)}
                          className={`mb-3 text-sm border-dashed ${
                            allUnpaidSelected
                              ? "border-gray-400 bg-gray-100 hover:bg-gray-200 text-gray-600"
                              : "border-amber-400 bg-amber-50 hover:bg-amber-100 text-amber-700 hover:text-amber-800"
                          }`}
                        >
                          <Users className="ml-2 h-4 w-4" />
                          {allUnpaidSelected ? "בטל בחירה" : `בחר את כל מי שלא שילם (${round.summary.unpaid_count})`}
                        </Button>
                      );
                    })()}

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
                            <Checkbox
                              checked={selectedChildren.has(payment.child.id)}
                              onCheckedChange={() => toggleChildSelection(payment.child.id)}
                            />
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
                            <span className={`text-sm ${payment.status === "paid" ? "text-green-600 font-medium" : "text-gray-500"}`}>
                              {payment.status === "paid" ? "שולם" : "לא שולם"}
                            </span>
                            <Switch
                              checked={payment.status === "paid"}
                              onCheckedChange={(checked) => onUpdatePaymentStatus?.(round.id, payment.child.id, checked ? "paid" : "unpaid")}
                            />
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
  classId,
  expenses,
  events,
  totalSpent,
  onCreateExpense,
  onDeleteExpense,
  onUploadReceipt,
  onGetReceiptUrl,
}: {
  classId: string;
  expenses: ExpenseWithEvent[];
  events: Event[];
  totalSpent: number;
  onCreateExpense?: (data: { description: string; amount: number; expense_date: string; event_id?: string; receipt_url?: string }) => Promise<void>;
  onDeleteExpense?: (expenseId: string) => Promise<void>;
  onUploadReceipt?: (formData: FormData) => Promise<{ success: boolean; url?: string; path?: string; error?: string }>;
  onGetReceiptUrl?: (path: string) => Promise<{ success: boolean; url?: string; error?: string }>;
}) {
  const [newDescription, setNewDescription] = useState("");
  const [newAmount, setNewAmount] = useState("");
  const [newDate, setNewDate] = useState(new Date().toISOString().split('T')[0]);
  const [newEventId, setNewEventId] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [receiptPreviewUrl, setReceiptPreviewUrl] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [signedUrls, setSignedUrls] = useState<Record<string, string>>({});
  const [loadingReceipts, setLoadingReceipts] = useState<Set<string>>(new Set());

  // Fetch signed URL for a receipt
  const fetchSignedUrl = async (expenseId: string, receiptPath: string) => {
    if (!onGetReceiptUrl || signedUrls[expenseId] || loadingReceipts.has(expenseId)) return;

    setLoadingReceipts(prev => new Set([...prev, expenseId]));
    try {
      const result = await onGetReceiptUrl(receiptPath);
      if (result.success && result.url) {
        setSignedUrls(prev => ({ ...prev, [expenseId]: result.url! }));
      }
    } finally {
      setLoadingReceipts(prev => {
        const next = new Set(prev);
        next.delete(expenseId);
        return next;
      });
    }
  };

  const handleFile = (file: File) => {
    // Validate file type
    if (!file.type.startsWith("image/") && file.type !== "application/pdf") {
      return;
    }
    setReceiptFile(file);
    // Create preview URL for images
    if (file.type.startsWith("image/")) {
      setReceiptPreviewUrl(URL.createObjectURL(file));
    } else {
      setReceiptPreviewUrl(null);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFile(file);
    }
  };

  const clearReceipt = () => {
    setReceiptFile(null);
    if (receiptPreviewUrl) {
      URL.revokeObjectURL(receiptPreviewUrl);
      setReceiptPreviewUrl(null);
    }
  };

  const handleCreateExpense = async () => {
    if (!onCreateExpense || !newDescription || !newAmount) return;
    setIsCreating(true);

    try {
      let receiptUrl: string | undefined;

      // Upload receipt if provided
      if (receiptFile && onUploadReceipt) {
        setIsUploading(true);
        const formData = new FormData();
        formData.append("file", receiptFile);
        formData.append("classId", classId);

        const uploadResult = await onUploadReceipt(formData);
        if (uploadResult.success && uploadResult.url) {
          receiptUrl = uploadResult.url;
        }
        setIsUploading(false);
      }

      await onCreateExpense({
        description: newDescription,
        amount: parseFloat(newAmount),
        expense_date: newDate,
        event_id: newEventId || undefined,
        receipt_url: receiptUrl,
      });

      // Reset form and close dialog
      setNewDescription("");
      setNewAmount("");
      setNewEventId("");
      clearReceipt();
      setIsDialogOpen(false);
    } finally {
      setIsCreating(false);
      setIsUploading(false);
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
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
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
                dir="ltr"
                className="w-full text-right"
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

            {/* Receipt Upload */}
            <div className="space-y-2">
              <Label>צרף חשבונית / קבלה (אופציונלי)</Label>
              {receiptFile ? (
                <div className="border-2 border-dashed border-green-300 bg-green-50 rounded-lg p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {receiptPreviewUrl ? (
                        <img
                          src={receiptPreviewUrl}
                          alt="Preview"
                          className="h-12 w-12 object-cover rounded"
                        />
                      ) : (
                        <FileText className="h-8 w-8 text-green-600" />
                      )}
                      <div>
                        <p className="text-sm font-medium text-green-800 truncate max-w-[180px]">
                          {receiptFile.name}
                        </p>
                        <p className="text-xs text-green-600">
                          {(receiptFile.size / 1024).toFixed(1)} KB
                        </p>
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={clearReceipt}
                      className="text-green-700 hover:text-red-600 hover:bg-red-50"
                      title="הסר קובץ"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ) : (
                <label
                  className={`border-2 border-dashed rounded-lg p-4 flex flex-col items-center gap-2 cursor-pointer transition-colors ${
                    isDragging
                      ? "border-[#A78BFA] bg-purple-100 scale-[1.02]"
                      : "border-gray-300 hover:border-[#A78BFA] hover:bg-purple-50"
                  }`}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                >
                  <Upload className={`h-8 w-8 ${isDragging ? "text-[#A78BFA]" : "text-gray-400"}`} />
                  <span className={`text-sm ${isDragging ? "text-[#A78BFA] font-medium" : "text-gray-600"}`}>
                    {isDragging ? "שחרר כאן" : "גרור קובץ או לחץ להעלאה"}
                  </span>
                  <span className="text-xs text-gray-400">תמונה או PDF</span>
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </label>
              )}
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">ביטול</Button>
            </DialogClose>
            <Button
              onClick={handleCreateExpense}
              disabled={isCreating || isUploading || !newDescription || !newAmount}
              className="bg-[#A78BFA] hover:bg-[#9333EA]"
            >
              {isUploading ? "מעלה קובץ..." : isCreating ? "שומר..." : "שמור הוצאה"}
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
                    {expense.receipt_url && (
                      <div className="inline-flex items-center gap-1">
                        <button
                          onClick={async () => {
                            // Get signed URL and open in new tab
                            if (signedUrls[expense.id]) {
                              window.open(signedUrls[expense.id], '_blank');
                            } else if (onGetReceiptUrl) {
                              setLoadingReceipts(prev => new Set([...prev, expense.id]));
                              const result = await onGetReceiptUrl(expense.receipt_url!);
                              setLoadingReceipts(prev => {
                                const next = new Set(prev);
                                next.delete(expense.id);
                                return next;
                              });
                              if (result.success && result.url) {
                                setSignedUrls(prev => ({ ...prev, [expense.id]: result.url! }));
                                window.open(result.url, '_blank');
                              }
                            }
                          }}
                          disabled={loadingReceipts.has(expense.id)}
                          className="inline-flex items-center gap-1 text-xs text-purple-600 hover:text-purple-800 bg-purple-50 hover:bg-purple-100 px-2 py-1 rounded-r-full transition-colors"
                          title="צפה בחשבונית"
                        >
                          <ExternalLink className="h-3 w-3" />
                          {loadingReceipts.has(expense.id) ? "טוען..." : "צפה בחשבונית"}
                        </button>
                        <button
                          onClick={async () => {
                            // Get signed URL and trigger actual file download
                            let url = signedUrls[expense.id];
                            if (!url && onGetReceiptUrl) {
                              setLoadingReceipts(prev => new Set([...prev, `dl-${expense.id}`]));
                              const result = await onGetReceiptUrl(expense.receipt_url!);
                              setLoadingReceipts(prev => {
                                const next = new Set(prev);
                                next.delete(`dl-${expense.id}`);
                                return next;
                              });
                              if (result.success && result.url) {
                                setSignedUrls(prev => ({ ...prev, [expense.id]: result.url! }));
                                url = result.url;
                              }
                            }
                            if (url) {
                              // Fetch the file as blob and trigger download
                              try {
                                const response = await fetch(url);
                                const blob = await response.blob();
                                const blobUrl = window.URL.createObjectURL(blob);
                                const link = document.createElement('a');
                                link.href = blobUrl;
                                // Get file extension from receipt_url path
                                const ext = expense.receipt_url?.split('.').pop() || 'file';
                                link.download = `חשבונית-${expense.description}.${ext}`;
                                document.body.appendChild(link);
                                link.click();
                                document.body.removeChild(link);
                                window.URL.revokeObjectURL(blobUrl);
                              } catch (err) {
                                console.error('Download failed:', err);
                                // Fallback: open in new tab
                                window.open(url, '_blank');
                              }
                            }
                          }}
                          disabled={loadingReceipts.has(`dl-${expense.id}`)}
                          className="inline-flex items-center gap-1 text-xs text-purple-600 hover:text-purple-800 bg-purple-50 hover:bg-purple-100 px-2 py-1 rounded-l-full transition-colors border-r border-purple-200"
                          title="הורד חשבונית"
                        >
                          <Download className="h-3 w-3" />
                          {loadingReceipts.has(`dl-${expense.id}`) ? "טוען..." : "הורד חשבונית"}
                        </button>
                      </div>
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
                    onClick={() => {
                      if (window.confirm(`האם למחוק את ההוצאה "${expense.description}"?`)) {
                        onDeleteExpense(expense.id);
                      }
                    }}
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

// Event templates for adding new events
const EVENT_TEMPLATES = [
  { id: "rosh-hashanah", name: "ראש השנה", icon: "🍎" },
  { id: "hanukkah", name: "חנוכה", icon: "🕎" },
  { id: "tu-bishvat", name: 'ט"ו בשבט', icon: "🌳" },
  { id: "purim", name: "פורים", icon: "🎭" },
  { id: "pesach", name: "פסח", icon: "🍷" },
  { id: "yom-hamechanech", name: "יום המחנך", icon: "👩‍🏫" },
  { id: "yom-haatzmaut", name: "יום העצמאות", icon: "🇮🇱" },
  { id: "end-of-year", name: "מתנות סוף שנה", icon: "🎓" },
  { id: "birthdays-kids", name: "ימי הולדת ילדים", icon: "🎂" },
  { id: "birthdays-staff", name: "ימי הולדת צוות", icon: "🎁" },
];

function AllocationsTab({
  events,
  totalBudget,
  totalAllocated,
  childrenCount,
  onUpdateEventBudget,
  onCreateEvent,
}: {
  events: Event[];
  totalBudget: number;
  totalAllocated: number;
  childrenCount: number;
  onUpdateEventBudget?: (eventId: string, budget: number) => Promise<void>;
  onCreateEvent?: (data: { name: string; icon: string; allocated_budget: number }) => Promise<void>;
}) {
  const [editingEvent, setEditingEvent] = useState<string | null>(null);
  const [editBudget, setEditBudget] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  // Multi-select state (like wizard)
  const [selectedEvents, setSelectedEvents] = useState<Set<string>>(new Set());
  const [eventPerUnitCost, setEventPerUnitCost] = useState<Record<string, number>>({});
  const [eventHeadcount, setEventHeadcount] = useState<Record<string, number>>({});
  const [customEventName, setCustomEventName] = useState("");
  const [customEvents, setCustomEvents] = useState<{ id: string; name: string; icon: string }[]>([]);

  // Filter out templates that already exist as events
  const existingEventNames = events.map(e => e.name.toLowerCase());
  const availableTemplates = EVENT_TEMPLATES.filter(
    t => !existingEventNames.includes(t.name.toLowerCase())
  );

  // Get headcount for an event - use custom value if set, otherwise use children count
  const getHeadcount = (eventId: string) => {
    if (eventHeadcount[eventId] !== undefined) {
      return eventHeadcount[eventId];
    }
    // Default: 2 for staff events, childrenCount for others
    const isStaffEvent = eventId === "yom-hamechanech" || eventId === "birthdays-staff";
    return isStaffEvent ? 2 : childrenCount;
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

  const updateEventHeadcount = (eventId: string, count: number) => {
    setEventHeadcount({
      ...eventHeadcount,
      [eventId]: Math.max(0, count),
    });
  };

  const addCustomEvent = () => {
    if (!customEventName.trim()) return;
    const newEvent = {
      id: `custom-${Date.now()}`,
      name: customEventName,
      icon: "✨",
    };
    setCustomEvents([...customEvents, newEvent]);
    setSelectedEvents(new Set([...selectedEvents, newEvent.id]));
    setCustomEventName("");
  };

  // Calculate total allocated in dialog
  const dialogAllocatedBudget = Array.from(selectedEvents).reduce((sum, eventId) => {
    const perUnit = eventPerUnitCost[eventId] || 0;
    const headcount = getHeadcount(eventId);
    return sum + (perUnit * headcount);
  }, 0);

  const handleAddEvents = async () => {
    if (!onCreateEvent || selectedEvents.size === 0) return;

    setIsCreating(true);
    try {
      const allTemplates = [...availableTemplates, ...customEvents];
      for (const eventId of selectedEvents) {
        const template = allTemplates.find(t => t.id === eventId);
        if (template) {
          const perUnit = eventPerUnitCost[eventId] || 0;
          const headcount = getHeadcount(eventId);
          const budget = perUnit * headcount;
          await onCreateEvent({
            name: template.name,
            icon: template.icon,
            allocated_budget: budget,
          });
        }
      }
      // Reset dialog state
      setIsAddDialogOpen(false);
      setSelectedEvents(new Set());
      setEventPerUnitCost({});
      setEventHeadcount({});
      setCustomEvents([]);
    } finally {
      setIsCreating(false);
    }
  };

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

      {/* Add Event Dialog - Wizard Style */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-hidden flex flex-col" dir="rtl">
          <DialogHeader>
            <DialogTitle>הוסף אירועים</DialogTitle>
          </DialogHeader>

          {/* Budget Summary in Dialog */}
          <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg border border-purple-200">
            <div>
              <p className="text-sm font-semibold">תקציב כולל</p>
              <p className="text-xl font-bold text-purple-600">₪{totalBudget.toLocaleString()}</p>
            </div>
            <div className="text-left">
              <p className="text-sm">מוקצה קיים: ₪{totalAllocated.toLocaleString()}</p>
              <p className="text-sm">נבחר כעת: ₪{dialogAllocatedBudget.toLocaleString()}</p>
              <p className={`text-sm font-semibold ${(totalBudget - totalAllocated - dialogAllocatedBudget) < 0 ? "text-red-600" : "text-green-600"}`}>
                נותר: ₪{(totalBudget - totalAllocated - dialogAllocatedBudget).toLocaleString()}
              </p>
            </div>
          </div>

          {/* Column Headers */}
          <div className="flex items-center gap-3 px-3 text-xs text-gray-500 font-medium">
            <div className="w-5"></div>
            <div className="w-7"></div>
            <div className="flex-1"></div>
            <div className="flex items-center gap-2">
              <span className="w-[72px] text-center block">סכום</span>
              <span className="w-4 text-center">×</span>
              <span className="w-[60px] text-center block">כמות</span>
              <span className="w-[80px] text-center block">סה״כ</span>
            </div>
          </div>

          {/* Scrollable Event List */}
          <div className="flex-1 overflow-y-auto space-y-2 min-h-0">
            {/* Available Templates */}
            {availableTemplates.map((template) => {
              const isSelected = selectedEvents.has(template.id);
              const headcount = getHeadcount(template.id);
              const perUnit = eventPerUnitCost[template.id] || 0;
              const totalForEvent = perUnit * headcount;

              return (
                <div
                  key={template.id}
                  className={`p-3 rounded-lg cursor-pointer transition-all border-2 ${
                    isSelected ? "border-purple-300 bg-purple-50" : "border-gray-200 hover:border-gray-300"
                  }`}
                  onClick={() => toggleEvent(template.id)}
                >
                  <div className="flex items-center gap-3">
                    <Checkbox checked={isSelected} />
                    <span className="text-lg">{template.icon}</span>
                    <div className="flex-1">
                      <p className="font-medium">{template.name}</p>
                    </div>
                    {isSelected && (
                      <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                        <div className="relative">
                          <Input
                            type="number"
                            value={perUnit || ""}
                            onChange={(e) => updatePerUnitCost(template.id, parseInt(e.target.value) || 0)}
                            placeholder="0"
                            className="w-[72px] h-8 text-sm text-center pr-6"
                          />
                          <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-gray-500">₪</span>
                        </div>
                        <span className="text-xs text-gray-500">×</span>
                        <Input
                          type="number"
                          value={headcount || ""}
                          onChange={(e) => updateEventHeadcount(template.id, parseInt(e.target.value) || 0)}
                          placeholder="0"
                          className="w-[60px] h-8 text-sm text-center"
                        />
                        <span className="text-sm font-medium text-purple-600 w-[80px] text-center">
                          = ₪{totalForEvent.toLocaleString()}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Custom Events */}
            {customEvents.map((event) => {
              const isSelected = selectedEvents.has(event.id);
              const headcount = getHeadcount(event.id);
              const perUnit = eventPerUnitCost[event.id] || 0;
              const totalForEvent = perUnit * headcount;

              return (
                <div
                  key={event.id}
                  className={`p-3 rounded-lg cursor-pointer transition-all border-2 ${
                    isSelected ? "border-purple-300 bg-purple-50" : "border-gray-200 hover:border-gray-300"
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
                            onChange={(e) => updatePerUnitCost(event.id, parseInt(e.target.value) || 0)}
                            placeholder="0"
                            className="w-[72px] h-8 text-sm text-center pr-6"
                          />
                          <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-gray-500">₪</span>
                        </div>
                        <span className="text-xs text-gray-500">×</span>
                        <Input
                          type="number"
                          value={headcount || ""}
                          onChange={(e) => updateEventHeadcount(event.id, parseInt(e.target.value) || 0)}
                          placeholder="0"
                          className="w-[60px] h-8 text-sm text-center"
                        />
                        <span className="text-sm font-medium text-purple-600 w-[80px] text-center">
                          = ₪{totalForEvent.toLocaleString()}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Add Custom Event */}
            <div className="p-3 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
              <div className="flex items-center gap-2">
                <Input
                  value={customEventName}
                  onChange={(e) => setCustomEventName(e.target.value)}
                  placeholder="הוסף אירוע מותאם אישית"
                  className="flex-1"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") addCustomEvent();
                  }}
                  onClick={(e) => e.stopPropagation()}
                />
                <Button size="sm" onClick={addCustomEvent} disabled={!customEventName.trim()}>
                  + הוסף
                </Button>
              </div>
            </div>
          </div>

          {/* Warning if over budget */}
          {(totalBudget - totalAllocated - dialogAllocatedBudget) < 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-sm text-red-700 font-semibold">
                ⚠️ עברתם את התקציב ב-₪{Math.abs(totalBudget - totalAllocated - dialogAllocatedBudget).toLocaleString()}
              </p>
            </div>
          )}

          <DialogFooter className="gap-2 pt-4 border-t">
            <DialogClose asChild>
              <Button variant="outline">ביטול</Button>
            </DialogClose>
            <Button
              onClick={handleAddEvents}
              disabled={isCreating || selectedEvents.size === 0}
              className="bg-[#A78BFA] hover:bg-[#9333EA]"
            >
              {isCreating ? "מוסיף..." : `הוסף ${selectedEvents.size} אירועים`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Events Allocation List */}
      {events.length === 0 ? (
        <div className="text-center py-12">
          <Calendar className="h-16 w-16 mx-auto text-gray-300 mb-4" />
          <p className="text-gray-500 mb-4">טרם נוספו אירועים</p>
          <Button
            className="bg-[#A78BFA] hover:bg-[#9333EA] rounded-2xl"
            onClick={() => setIsAddDialogOpen(true)}
          >
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

          {/* Add Event Button */}
          {onCreateEvent && (
            <Button
              variant="outline"
              className="w-full mt-4 border-2 border-[#A78BFA] bg-purple-50 text-[#7C3AED] hover:bg-purple-100 hover:border-[#7C3AED] font-medium shadow-sm"
              onClick={() => setIsAddDialogOpen(true)}
            >
              <Plus className="ml-2 h-5 w-5" />
              הוסף אירוע
            </Button>
          )}
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
  onCreateEvent,
  onUploadReceipt,
  onGetReceiptUrl,
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
              childrenCount={children.length}
              onUpdateEventBudget={onUpdateEventBudget}
              onCreateEvent={onCreateEvent}
            />
          </TabsContent>

          <TabsContent value="expenses">
            <ExpensesTab
              classId={classId}
              expenses={expenses}
              events={events}
              totalSpent={totalSpent}
              onCreateExpense={onCreateExpense}
              onDeleteExpense={onDeleteExpense}
              onUploadReceipt={onUploadReceipt}
              onGetReceiptUrl={onGetReceiptUrl}
            />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
