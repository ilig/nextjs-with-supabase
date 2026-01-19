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
  X,
  UserPlus
} from "lucide-react";
import { ChildrenUploadTask } from "@/components/setup-tasks/children-upload-task";
import type {
  PaymentRoundWithPayments,
  ExpenseWithEvent,
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
  amountPerChild?: number;
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
  onAddChild?: (name: string) => Promise<void>;
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
// Collection Tab Component (איסוף)
// ============================================

function CollectionTab({
  classId,
  paymentRounds,
  children,
  amountPerChild,
  estimatedChildren,
  onCreatePaymentRound,
  onUpdatePaymentStatus,
  onBulkUpdatePayments,
  onAddChild,
  onChildrenAdded,
}: {
  classId: string;
  paymentRounds: PaymentRoundWithPayments[];
  children: Child[];
  amountPerChild?: number;
  estimatedChildren?: number;
  onCreatePaymentRound?: (data: { name: string; amount_per_child: number; due_date?: string }) => Promise<void>;
  onUpdatePaymentStatus?: (paymentRoundId: string, childId: string, status: PaymentStatus) => Promise<void>;
  onBulkUpdatePayments?: (paymentRoundId: string, childIds: string[], status: PaymentStatus) => Promise<void>;
  onAddChild?: (name: string) => Promise<void>;
  onChildrenAdded?: () => void;
}) {
  const [selectedChildren, setSelectedChildren] = useState<Set<string>>(new Set());
  const [copiedRoundId, setCopiedRoundId] = useState<string | null>(null);
  const [showAddChildDialog, setShowAddChildDialog] = useState(false);

  // Quick add children state (inline manual entry)
  // Initialize with 5 empty rows for new entries
  const [quickAddNames, setQuickAddNames] = useState<string[]>(["", "", "", "", ""]);
  const [isSavingQuickAdd, setIsSavingQuickAdd] = useState(false);

  // Track payment status for newly added children (before payment round exists)
  const [localPaidStatus, setLocalPaidStatus] = useState<Record<string, boolean>>({});

  // Selected payment round state
  const [selectedRoundId, setSelectedRoundId] = useState<string | null>(null);

  // Create new round dialog state
  const [showCreateRoundDialog, setShowCreateRoundDialog] = useState(false);
  const [newRoundName, setNewRoundName] = useState("");
  const [newRoundAmount, setNewRoundAmount] = useState("");
  const [isCreatingRound, setIsCreatingRound] = useState(false);

  // Find the selected round, or default to "תשלום שנתי" or first round
  const yearlyRound = paymentRounds.find(r => r.name === "תשלום שנתי") || paymentRounds[0];
  const selectedRound = selectedRoundId
    ? paymentRounds.find(r => r.id === selectedRoundId) || yearlyRound
    : yearlyRound;

  // Use estimatedChildren if larger than actual children count (common during setup)
  const targetChildrenCount = estimatedChildren || 30;
  const paidCount = selectedRound?.summary?.paid_count || 0;
  const totalExpected = selectedRound ? selectedRound.amount_per_child * targetChildrenCount : (amountPerChild ? amountPerChild * targetChildrenCount : 0);
  const totalCollected = selectedRound?.summary?.total_collected || 0;
  const progressPercent = targetChildrenCount > 0 ? (paidCount / targetChildrenCount) * 100 : 0;

  // Handle creating a new payment round
  const handleCreateRound = async () => {
    if (!onCreatePaymentRound || !newRoundName.trim() || !newRoundAmount) return;

    setIsCreatingRound(true);
    try {
      await onCreatePaymentRound({
        name: newRoundName.trim(),
        amount_per_child: parseFloat(newRoundAmount),
      });
      setNewRoundName("");
      setNewRoundAmount("");
      setShowCreateRoundDialog(false);
    } finally {
      setIsCreatingRound(false);
    }
  };

  const handleBulkMarkPaid = async (roundId: string) => {
    if (!onBulkUpdatePayments || selectedChildren.size === 0) return;
    await onBulkUpdatePayments(roundId, Array.from(selectedChildren), "paid");
    setSelectedChildren(new Set());
  };

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
        "שם הילד/ה": p.child.name,
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

    const allUnpaidSelected = unpaidIds.every(id => selectedChildren.has(id));

    if (allUnpaidSelected) {
      setSelectedChildren(new Set());
    } else {
      setSelectedChildren(new Set(unpaidIds));
    }
  };

  // Quick add name handlers
  const updateQuickAddName = (index: number, value: string) => {
    const newNames = [...quickAddNames];
    newNames[index] = value;
    setQuickAddNames(newNames);
  };

  const handleQuickAddKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === "Enter") {
      e.preventDefault();
      // Focus next input or add more rows if at the end
      if (index === quickAddNames.length - 1) {
        // Add more rows
        setQuickAddNames([...quickAddNames, "", "", "", "", ""]);
        setTimeout(() => {
          const nextInput = document.getElementById(`quick-add-${index + 1}`);
          nextInput?.focus();
        }, 50);
      } else {
        const nextInput = document.getElementById(`quick-add-${index + 1}`);
        nextInput?.focus();
      }
    }
  };

  const saveQuickAddNames = async () => {
    const namesToAdd = quickAddNames.filter(name => name.trim() !== "");
    if (namesToAdd.length === 0) return;

    setIsSavingQuickAdd(true);
    try {
      // Use the ChildrenUploadTask's save logic by opening the dialog with pre-filled data
      // For now, we'll save directly using supabase
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();

      // Check for existing children to prevent duplicates
      const { data: existingChildren } = await supabase
        .from("children")
        .select("name")
        .eq("class_id", classId);

      const existingNames = new Set(
        existingChildren?.map(c => c.name.trim().toLowerCase()) || []
      );

      const uniqueNames = namesToAdd.filter(
        name => !existingNames.has(name.trim().toLowerCase())
      );

      if (uniqueNames.length === 0) {
        alert("כל השמות שהזנתם כבר קיימים במערכת");
        setIsSavingQuickAdd(false);
        return;
      }

      // Insert children
      const childrenData = uniqueNames.map(name => ({
        class_id: classId,
        name: name.trim(),
      }));

      const { error } = await supabase.from("children").insert(childrenData);

      if (error) {
        console.error("Error saving children:", error);
        alert("שגיאה בשמירת הילדים");
      } else {
        setQuickAddNames(["", "", "", "", ""]);
        onChildrenAdded?.();
      }
    } finally {
      setIsSavingQuickAdd(false);
    }
  };

  const filledQuickAddCount = quickAddNames.filter(n => n.trim() !== "").length;

  // Render progress header - focused on selected round (default: תשלום שנתי)
  const renderProgressHeader = () => (
    <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl p-4 border border-brand/30">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500 to-blue-600">
            <PiggyBank className="h-5 w-5 text-white" />
          </div>
          <div>
            {/* Round selector dropdown if multiple rounds exist */}
            {paymentRounds.length > 1 ? (
              <select
                value={selectedRound?.id || ""}
                onChange={(e) => setSelectedRoundId(e.target.value)}
                className="font-bold text-lg text-foreground bg-transparent border-none cursor-pointer focus:outline-none focus:ring-0 pr-1"
              >
                {paymentRounds.map((round) => (
                  <option key={round.id} value={round.id}>
                    {round.name} ({round.summary.paid_count}/{round.summary.total_children || targetChildrenCount})
                  </option>
                ))}
              </select>
            ) : (
              <h4 className="font-bold text-lg text-foreground">
                {selectedRound?.name || "תשלום שנתי"}
              </h4>
            )}
            <p className="text-sm text-muted-foreground">₪{selectedRound?.amount_per_child || amountPerChild || 0} לילד</p>
          </div>
        </div>
        <div className="text-left">
          <p className="text-2xl font-bold text-brand">
            {paidCount}/{targetChildrenCount}
          </p>
          <p className="text-xs text-muted-foreground">שילמו</p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="space-y-1">
        <Progress value={progressPercent} className="h-2" />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>₪{totalCollected.toLocaleString()} נאסף</span>
          <span>₪{totalExpected.toLocaleString()} צפוי</span>
        </div>
      </div>

      {/* Add new round link - subtle */}
      <div className="mt-3 pt-2 border-t border-brand/30/50">
        <button
          onClick={() => setShowCreateRoundDialog(true)}
          className="text-xs text-brand hover:text-brand-hover hover:underline flex items-center gap-1"
        >
          <Plus className="h-3 w-3" />
          הוספת סכום חדש לאיסוף
        </button>
      </div>

      {/* Create Round Dialog */}
      <Dialog open={showCreateRoundDialog} onOpenChange={setShowCreateRoundDialog}>
        <DialogContent dir="rtl" className="max-w-md">
          <DialogHeader>
            <DialogTitle>איסוף חדש</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="round-name">שם האיסוף</Label>
              <Input
                id="round-name"
                value={newRoundName}
                onChange={(e) => setNewRoundName(e.target.value)}
                placeholder="לדוגמה: טיול שנתי, מתנה לגננת"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="round-amount">סכום לילד (₪)</Label>
              <Input
                id="round-amount"
                type="number"
                value={newRoundAmount}
                onChange={(e) => setNewRoundAmount(e.target.value)}
                placeholder="50"
              />
            </div>
            {newRoundAmount && (
              <div className="bg-brand-muted rounded-lg p-3 text-sm">
                <p className="text-brand-muted-foreground">
                  סה״כ צפוי לאיסוף: <span className="font-bold">₪{(parseFloat(newRoundAmount) * targetChildrenCount).toLocaleString()}</span>
                </p>
                <p className="text-brand text-xs">({targetChildrenCount} ילדים × ₪{newRoundAmount})</p>
              </div>
            )}
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">ביטול</Button>
            </DialogClose>
            <Button
              onClick={handleCreateRound}
              disabled={isCreatingRound || !newRoundName.trim() || !newRoundAmount}
              className="bg-brand hover:bg-brand-hover"
            >
              {isCreatingRound ? "יוצר..." : "צור איסוף"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );

  // Unified view: Show existing children (if any) + quick add form
  // This works whether or not a payment round exists

  // If no payment round OR no children - show the unified inline entry view
  if (!selectedRound || children.length === 0) {
    return (
      <div className="space-y-4">
        {renderProgressHeader()}

        {/* Inline Children List with Quick Add */}
        <div className="bg-card rounded-xl border-2 border-brand/30 dark:border-purple-800 p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-brand" />
              <h4 className="font-semibold text-foreground">רשימת ילדים</h4>
            </div>
            <span className="text-sm text-muted-foreground">
              {children.length}/{targetChildrenCount} ילדים
            </span>
          </div>

          <p className="text-sm text-muted-foreground mb-3">
            הקלידו שמות ולחצו Enter למעבר לשורה הבאה. סמנו מי שילם.
          </p>

          <div className="space-y-2 max-h-80 overflow-y-auto">
            {/* Existing children first */}
            {children.map((child, index) => (
              <div
                key={child.id}
                className={`flex items-center gap-2 p-2 rounded-lg transition-colors ${
                  localPaidStatus[child.id] ? "bg-success-muted border border-success/30" : "bg-muted border border-border"
                }`}
              >
                <span className="text-xs text-muted-foreground w-6 text-center">{index + 1}</span>
                <div className="flex-1">
                  <span className="font-medium text-foreground">{child.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={localPaidStatus[child.id] || false}
                    onCheckedChange={(checked) => {
                      setLocalPaidStatus(prev => ({ ...prev, [child.id]: checked }));
                    }}
                  />
                  <span className={`text-sm min-w-[60px] text-left ${localPaidStatus[child.id] ? "text-success dark:text-green-400 font-medium" : "text-muted-foreground"}`}>
                    {localPaidStatus[child.id] ? "שולם ✓" : "לא שולם"}
                  </span>
                </div>
              </div>
            ))}

            {/* Divider if there are existing children */}
            {children.length > 0 && quickAddNames.some(n => n.trim() || true) && (
              <div className="border-t border-dashed border-brand/30 my-3 pt-3">
                <p className="text-xs text-brand mb-2">הוספת ילדים נוספים:</p>
              </div>
            )}

            {/* Quick add rows for new children */}
            {quickAddNames.map((name, index) => (
              <div key={`new-${index}`} className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground w-6 text-center">{children.length + index + 1}</span>
                <Input
                  id={`quick-add-${index}`}
                  value={name}
                  onChange={(e) => updateQuickAddName(index, e.target.value)}
                  onKeyDown={(e) => handleQuickAddKeyDown(e, index)}
                  placeholder="שם הילד/ה"
                  className={`flex-1 h-9 ${name.trim() ? "border-success/40 bg-success-muted/50" : ""}`}
                />
                {/* Empty space to align with payment toggle above */}
                <div className="w-[140px]"></div>
              </div>
            ))}
          </div>

          <div className="flex gap-2 mt-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setQuickAddNames([...quickAddNames, "", "", "", "", ""])}
              className="flex-1"
            >
              <Plus className="h-4 w-4 ml-1" />
              עוד 5 שורות
            </Button>
            <Button
              size="sm"
              onClick={saveQuickAddNames}
              disabled={isSavingQuickAdd || filledQuickAddCount === 0}
              className="flex-1 bg-brand hover:bg-brand-hover"
            >
              {isSavingQuickAdd ? "שומר..." : `שמור ${filledQuickAddCount} ילדים`}
            </Button>
          </div>

          {/* Option to use full upload dialog */}
          <div className="mt-3 pt-3 border-t border-border text-center">
            <Dialog open={showAddChildDialog} onOpenChange={setShowAddChildDialog}>
              <DialogTrigger asChild>
                <button className="text-sm text-brand hover:text-brand-hover hover:underline">
                  או העלו מקובץ אקסל →
                </button>
              </DialogTrigger>
              <DialogContent dir="rtl" className="max-w-3xl max-h-[90vh] overflow-y-auto">
                <DialogHeader className="sr-only">
                  <DialogTitle>העלאת רשימת ילדים והורים</DialogTitle>
                </DialogHeader>
                <ChildrenUploadTask
                  classId={classId}
                  estimatedChildren={estimatedChildren || 25}
                  onComplete={() => {
                    setShowAddChildDialog(false);
                    onChildrenAdded?.();
                  }}
                  onCancel={() => setShowAddChildDialog(false)}
                  initialMethod="excel"
                />
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Use shared progress header */}
      {renderProgressHeader()}

      {/* Quick Actions */}
      <div className="flex gap-2 flex-wrap">
        <Button
          variant="outline"
          size="sm"
          onClick={() => copyUnpaidToClipboard(selectedRound)}
          className={`rounded-xl transition-all ${copiedRoundId === selectedRound.id ? "bg-green-100 border-green-500 text-success" : ""}`}
        >
          {copiedRoundId === selectedRound.id ? (
            <>
              <CheckCircle2 className="ml-2 h-4 w-4" />
              הועתק!
            </>
          ) : (
            <>
              <Copy className="ml-2 h-4 w-4" />
              העתק לוואטסאפ
            </>
          )}
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => exportToExcel(selectedRound)}
          className="rounded-xl"
        >
          <Download className="ml-2 h-4 w-4" />
          אקסל
        </Button>
        <Dialog open={showAddChildDialog} onOpenChange={setShowAddChildDialog}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm" className="rounded-xl mr-auto">
              <Plus className="ml-2 h-4 w-4" />
              הוסף ילדים
            </Button>
          </DialogTrigger>
          <DialogContent dir="rtl" className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader className="sr-only">
              <DialogTitle>העלאת רשימת ילדים והורים</DialogTitle>
            </DialogHeader>
            <ChildrenUploadTask
              classId={classId}
              estimatedChildren={estimatedChildren || 25}
              onComplete={() => {
                setShowAddChildDialog(false);
                onChildrenAdded?.();
              }}
              onCancel={() => setShowAddChildDialog(false)}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Bulk Actions (when children selected) */}
      {selectedChildren.size > 0 && (
        <div className="flex gap-2 p-3 bg-info-muted rounded-xl border border-info/30">
          <Button
            size="sm"
            className="bg-success hover:bg-success/90 rounded-xl"
            onClick={() => handleBulkMarkPaid(selectedRound.id)}
          >
            <CheckCircle2 className="ml-2 h-4 w-4" />
            סמן {selectedChildren.size} כשילמו
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="rounded-xl"
            onClick={() => {
              onBulkUpdatePayments?.(selectedRound.id, Array.from(selectedChildren), "unpaid");
              setSelectedChildren(new Set());
            }}
          >
            סמן כלא שילמו
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="rounded-xl mr-auto"
            onClick={() => setSelectedChildren(new Set())}
          >
            בטל בחירה
          </Button>
        </div>
      )}

      {/* Select All Unpaid */}
      {selectedRound.summary.unpaid_count > 0 && selectedChildren.size === 0 && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => toggleSelectAllUnpaid(selectedRound)}
          className="w-full text-sm border-dashed border-amber-400 bg-amber-50 hover:bg-amber-100 text-amber-700 hover:text-amber-800 rounded-xl"
        >
          <Users className="ml-2 h-4 w-4" />
          בחר את כל מי שלא שילם ({selectedRound.summary.unpaid_count})
        </Button>
      )}

      {/* Children List - Simple and Clean */}
      <div className="space-y-2">
        {selectedRound.payments.map((payment) => (
          <div
            key={payment.child.id}
            className={`flex items-center justify-between p-3 rounded-xl transition-colors ${
              payment.status === "paid"
                ? "bg-success-muted border border-success/30"
                : "bg-card border border-border hover:border-muted-foreground"
            }`}
          >
            <div className="flex items-center gap-3">
              <Checkbox
                checked={selectedChildren.has(payment.child.id)}
                onCheckedChange={() => toggleChildSelection(payment.child.id)}
              />
              <div>
                <p className="font-medium text-foreground">{payment.child.name}</p>
                {payment.child.parents && payment.child.parents.length > 0 && (
                  <p className="text-xs text-muted-foreground">
                    {payment.child.parents.map(p => p.name).filter(Boolean).join(", ")}
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={payment.status === "paid"}
                onCheckedChange={(checked) => onUpdatePaymentStatus?.(selectedRound.id, payment.child.id, checked ? "paid" : "unpaid")}
              />
              <span className={`text-sm min-w-[60px] text-left ${payment.status === "paid" ? "text-success dark:text-green-400 font-medium" : "text-muted-foreground"}`}>
                {payment.status === "paid" ? "שולם ✓" : "לא שולם"}
              </span>
            </div>
          </div>
        ))}
      </div>
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
          <Button className="w-full bg-brand hover:bg-brand-hover rounded-xl">
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
                <div className="border-2 border-dashed border-success/40 bg-success-muted rounded-lg p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {receiptPreviewUrl ? (
                        <img
                          src={receiptPreviewUrl}
                          alt="Preview"
                          className="h-12 w-12 object-cover rounded"
                        />
                      ) : (
                        <FileText className="h-8 w-8 text-success" />
                      )}
                      <div>
                        <p className="text-sm font-medium text-success-muted-foreground truncate max-w-[180px]">
                          {receiptFile.name}
                        </p>
                        <p className="text-xs text-success">
                          {(receiptFile.size / 1024).toFixed(1)} KB
                        </p>
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={clearReceipt}
                      className="text-success hover:text-destructive hover:bg-destructive/10"
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
                      ? "border-brand bg-brand-muted scale-[1.02]"
                      : "border-border hover:border-brand hover:bg-brand-muted"
                  }`}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                >
                  <Upload className={`h-8 w-8 ${isDragging ? "text-brand" : "text-muted-foreground"}`} />
                  <span className={`text-sm ${isDragging ? "text-brand font-medium" : "text-muted-foreground"}`}>
                    {isDragging ? "שחרר כאן" : "גרור קובץ או לחץ להעלאה"}
                  </span>
                  <span className="text-xs text-muted-foreground">תמונה או PDF</span>
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
              className="bg-brand hover:bg-brand-hover"
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
            <Receipt className="h-5 w-5 text-destructive" />
            <span className="font-medium text-destructive">סה&quot;כ הוצאות</span>
          </div>
          <span className="text-2xl font-bold text-destructive">₪{totalSpent.toLocaleString()}</span>
        </div>
      </div>

      {/* Expenses List */}
      {expenses.length === 0 ? (
        <div className="text-center py-8">
          <Receipt className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
          <p className="text-muted-foreground">טרם נרשמו הוצאות</p>
        </div>
      ) : (
        <div className="space-y-3">
          {expensesWithBalance.map((expense) => (
            <div
              key={expense.id}
              className="border-2 border-border rounded-xl p-4 hover:border-border transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-medium text-foreground">{expense.description}</h4>
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
                          className="inline-flex items-center gap-1 text-xs text-brand hover:text-brand-hover bg-brand-muted hover:bg-brand-muted px-2 py-1 rounded-r-full transition-colors"
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
                          className="inline-flex items-center gap-1 text-xs text-brand hover:text-brand-hover bg-brand-muted hover:bg-brand-muted px-2 py-1 rounded-l-full transition-colors border-r border-brand/30"
                          title="הורד חשבונית"
                        >
                          <Download className="h-3 w-3" />
                          {loadingReceipts.has(`dl-${expense.id}`) ? "טוען..." : "הורד חשבונית"}
                        </button>
                      </div>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {new Date(expense.expense_date).toLocaleDateString('he-IL')}
                  </p>
                </div>
                <div className="text-left">
                  <p className="text-lg font-bold text-destructive">-₪{expense.amount.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">
                    יתרה: ₪{expense.runningBalance.toLocaleString()}
                  </p>
                </div>
                {onDeleteExpense && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="mr-2 text-muted-foreground hover:text-destructive"
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
          <p className="text-xs text-brand-muted-foreground">תקציב כולל</p>
          <p className="text-lg font-bold text-brand">₪{totalBudget.toLocaleString()}</p>
        </div>
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-3 text-center">
          <p className="text-xs text-info">מוקצה</p>
          <p className="text-lg font-bold text-info">₪{totalAllocated.toLocaleString()}</p>
        </div>
        <div className={`rounded-xl p-3 text-center ${
          isOverAllocated
            ? "bg-gradient-to-br from-red-50 to-red-100"
            : "bg-gradient-to-br from-green-50 to-green-100"
        }`}>
          <p className={`text-xs ${isOverAllocated ? "text-destructive" : "text-success"}`}>
            {isOverAllocated ? "חריגה" : "פנוי"}
          </p>
          <p className={`text-lg font-bold ${isOverAllocated ? "text-destructive" : "text-success"}`}>
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
          <div className="flex items-center justify-between p-3 bg-brand-muted rounded-lg border border-brand/30">
            <div>
              <p className="text-sm font-semibold">תקציב כולל</p>
              <p className="text-xl font-bold text-brand">₪{totalBudget.toLocaleString()}</p>
            </div>
            <div className="text-left">
              <p className="text-sm">מוקצה קיים: ₪{totalAllocated.toLocaleString()}</p>
              <p className="text-sm">נבחר כעת: ₪{dialogAllocatedBudget.toLocaleString()}</p>
              <p className={`text-sm font-semibold ${(totalBudget - totalAllocated - dialogAllocatedBudget) < 0 ? "text-destructive" : "text-success"}`}>
                נותר: ₪{(totalBudget - totalAllocated - dialogAllocatedBudget).toLocaleString()}
              </p>
            </div>
          </div>

          {/* Column Headers */}
          <div className="flex items-center gap-3 px-3 text-xs text-muted-foreground font-medium">
            <div className="w-5"></div>
            <div className="w-7"></div>
            <div className="flex-1"></div>
            <div className="flex items-center gap-2">
              <span className="w-[88px] text-center block">סכום</span>
              <span className="w-4 text-center">×</span>
              <span className="w-[72px] text-center block">כמות</span>
              <span className="w-[90px] text-center block">סה״כ</span>
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
                    isSelected ? "border-brand/40 bg-brand-muted" : "border-border hover:border-border"
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
                            className="w-[88px] h-8 text-sm text-center pr-6"
                          />
                          <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">₪</span>
                        </div>
                        <span className="text-xs text-muted-foreground">×</span>
                        <Input
                          type="number"
                          value={headcount || ""}
                          onChange={(e) => updateEventHeadcount(template.id, parseInt(e.target.value) || 0)}
                          placeholder="0"
                          className="w-[72px] h-8 text-sm text-center"
                        />
                        <span className="text-sm font-medium text-brand w-[90px] text-center">
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
                    isSelected ? "border-brand/40 bg-brand-muted" : "border-border hover:border-border"
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
                            className="w-[88px] h-8 text-sm text-center pr-6"
                          />
                          <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">₪</span>
                        </div>
                        <span className="text-xs text-muted-foreground">×</span>
                        <Input
                          type="number"
                          value={headcount || ""}
                          onChange={(e) => updateEventHeadcount(event.id, parseInt(e.target.value) || 0)}
                          placeholder="0"
                          className="w-[72px] h-8 text-sm text-center"
                        />
                        <span className="text-sm font-medium text-brand w-[90px] text-center">
                          = ₪{totalForEvent.toLocaleString()}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Add Custom Event */}
            <div className="p-3 bg-muted rounded-lg border-2 border-dashed border-border">
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
            <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-3">
              <p className="text-sm text-destructive font-semibold">
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
              className="bg-brand hover:bg-brand-hover"
            >
              {isCreating ? "מוסיף..." : `הוסף ${selectedEvents.size} אירועים`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Events Allocation List */}
      {events.length === 0 ? (
        <div className="text-center py-12">
          <Calendar className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground mb-4">טרם נוספו אירועים</p>
          <Button
            className="bg-brand hover:bg-brand-hover rounded-2xl"
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
                className="border-2 border-border rounded-2xl p-4 hover:border-brand transition-colors"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="text-3xl">{event.icon || "📅"}</div>
                    <div>
                      <h4 className="font-bold text-lg text-foreground">{event.name}</h4>
                      {event.event_date && (
                        <p className="text-sm text-muted-foreground">
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
                          className="bg-success hover:bg-success/90"
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
                          <p className="text-sm text-muted-foreground">הוקצה</p>
                          <p className={`text-lg font-bold ${isOverspent ? 'text-destructive' : 'text-brand'}`}>
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
                  <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        isOverspent ? 'bg-destructive/100' : 'bg-gradient-to-r from-[#A78BFA] to-[#60A5FA]'
                      }`}
                      style={{ width: `${Math.min(spentPercentage, 100)}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground">
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
              className="w-full mt-4 border-2 border-brand bg-brand-muted text-brand-muted-foreground hover:bg-brand-muted hover:border-brand-hover font-medium shadow-sm"
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
          colorClass="bg-gradient-to-br from-green-50 to-green-100 text-success"
        />
        <StatCard
          icon={TrendingDown}
          label="הוצא"
          value={`₪${budgetMetrics.spent.toLocaleString()}`}
          colorClass="bg-gradient-to-br from-red-50 to-red-100 text-destructive"
        />
        <StatCard
          icon={DollarSign}
          label="תקציב מוקצה"
          value={`₪${budgetMetrics.allocated.toLocaleString()}`}
          colorClass="bg-gradient-to-br from-blue-50 to-blue-100 text-info"
        />
        <StatCard
          icon={Wallet}
          label="תקציב כולל"
          value={`₪${budgetMetrics.total.toLocaleString()}`}
          colorClass="bg-gradient-to-br from-purple-50 to-purple-100 text-brand-muted-foreground"
        />
      </div>

      {/* Unpaid Alert */}
      {unpaidCount > 0 && (
        <div className="bg-warning-muted border-2 border-warning/30 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-warning-muted-foreground" />
            <div>
              <p className="font-semibold text-warning-muted-foreground">
                {unpaidCount} ילדים טרם שילמו
              </p>
              <p className="text-sm text-warning-muted-foreground">
                עברו ללשונית &quot;איסוף&quot; לצפייה ברשימה המלאה
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Collection Progress by Round */}
      {paymentRounds.length > 0 && (
        <div className="space-y-3">
          <h4 className="font-semibold text-foreground">התקדמות גביות</h4>
          {paymentRounds.map((round) => (
            <div key={round.id} className="flex items-center gap-4">
              <div className="flex-1">
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-medium">{round.name}</span>
                  <span className="text-muted-foreground">
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
// Clickable Metric Card Component
// ============================================

function ClickableMetricCard({
  icon: Icon,
  label,
  value,
  subValue,
  colorClass,
  onClick,
  isActive,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  subValue?: string;
  colorClass: string;
  onClick?: () => void;
  isActive?: boolean;
}) {
  return (
    <div
      className={`${colorClass} rounded-xl p-4 cursor-pointer transition-all duration-200 hover:scale-[1.02] hover:shadow-lg ${
        isActive ? "ring-2 ring-offset-2 ring-purple-500" : ""
      }`}
      onClick={onClick}
    >
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
// Detail View Type
// ============================================

type DetailView = "collection" | "expenses" | "allocations" | null;

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
  onAddChild,
}: BudgetHubCardProps) {
  const [activeView, setActiveView] = useState<DetailView>(null);

  // Calculate totals
  // Use estimated children from budget (total / amountPerChild) as the target count
  const estimatedChildrenCount = budgetMetrics.amountPerChild
    ? Math.round(budgetMetrics.total / budgetMetrics.amountPerChild)
    : children.length;
  const targetChildrenCount = Math.max(estimatedChildrenCount, children.length);

  const totalCollected = paymentRounds.reduce(
    (sum, round) => sum + round.summary.total_collected,
    0
  );
  const paidChildrenCount = paymentRounds.reduce(
    (sum, round) => sum + round.summary.paid_count,
    0
  );
  // Unpaid = target count - paid (not just those in system)
  const totalUnpaid = targetChildrenCount - paidChildrenCount;
  const totalSpent = expenses.reduce((sum, exp) => sum + exp.amount, 0);
  const balance = totalCollected - totalSpent;
  const isNegativeBalance = balance < 0;

  // Handle card clicks
  const handleCardClick = (view: DetailView) => {
    setActiveView(activeView === view ? null : view);
  };

  // Render the main hub view (summary cards)
  const renderHubView = () => (
    <div className="space-y-4">
      {/* Compact Top Summary - One liner */}
      <div className={`flex items-center justify-between rounded-xl px-4 py-3 ${
        isNegativeBalance
          ? "bg-gradient-to-r from-red-50 to-orange-50 border border-destructive/30"
          : "bg-gradient-to-r from-purple-50 to-blue-50 border border-brand/30"
      }`}>
        <div className="flex items-center gap-2">
          <Wallet className={`h-4 w-4 ${isNegativeBalance ? "text-destructive" : "text-brand"}`} />
          <span className="text-sm font-medium text-foreground">יתרת קופה</span>
        </div>
        <div className="flex items-center gap-3">
          <span className={`text-lg font-bold ${isNegativeBalance ? "text-destructive" : "text-success"}`}>
            {isNegativeBalance ? "-" : ""}₪{Math.abs(balance).toLocaleString()}
          </span>
          <span className="text-muted-foreground">/</span>
          <span className="text-sm text-muted-foreground">
            ₪{budgetMetrics.total.toLocaleString()} תקציב
          </span>
          {isNegativeBalance && (
            <AlertCircle className="h-4 w-4 text-destructive" />
          )}
        </div>
      </div>

      {/* Clickable Metric Cards */}
      <div className="grid grid-cols-3 gap-4">
        {/* נאסף - Opens Collection/איסוף */}
        <ClickableMetricCard
          icon={TrendingUp}
          label="נאסף"
          value={`₪${totalCollected.toLocaleString()}`}
          subValue={totalUnpaid > 0 ? `${totalUnpaid} טרם שילמו` : "כולם שילמו"}
          colorClass="bg-gradient-to-br from-green-50 to-green-100 text-success"
          onClick={() => handleCardClick("collection")}
          isActive={activeView === "collection"}
        />

        {/* הוצא - Opens Expenses/הוצאות */}
        <ClickableMetricCard
          icon={TrendingDown}
          label="הוצא"
          value={`₪${totalSpent.toLocaleString()}`}
          subValue={`${expenses.length} הוצאות`}
          colorClass="bg-gradient-to-br from-red-50 to-red-100 text-destructive"
          onClick={() => handleCardClick("expenses")}
          isActive={activeView === "expenses"}
        />

        {/* תקציב מוקצה - Opens Allocations/הקצאות */}
        <ClickableMetricCard
          icon={DollarSign}
          label="תקציב מוקצה"
          value={`₪${budgetMetrics.allocated.toLocaleString()}`}
          subValue={`${events.length} אירועים`}
          colorClass="bg-gradient-to-br from-blue-50 to-blue-100 text-info"
          onClick={() => handleCardClick("allocations")}
          isActive={activeView === "allocations"}
        />
      </div>

      {/* Unpaid Alert */}
      {totalUnpaid > 0 && activeView === null && (
        <div
          className="bg-warning-muted border-2 border-warning/30 rounded-xl p-4 cursor-pointer hover:bg-warning-muted transition-colors"
          onClick={() => handleCardClick("collection")}
        >
          <div className="flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-warning-muted-foreground" />
            <div className="flex-1">
              <p className="font-semibold text-warning-muted-foreground">
                {totalUnpaid} ילדים טרם שילמו
              </p>
              <p className="text-sm text-warning-muted-foreground">
                לחצו לצפייה ברשימה המלאה
              </p>
            </div>
            <ChevronDown className="h-5 w-5 text-warning-muted-foreground" />
          </div>
        </div>
      )}

      {/* Collection Progress by Round (only when no detail view is open) */}
      {paymentRounds.length > 0 && activeView === null && (
        <div className="space-y-3">
          <h4 className="font-semibold text-foreground">התקדמות איסוף</h4>
          {paymentRounds.map((round) => {
            // Calculate progress based on target children count, not just those in system
            const progressPercent = targetChildrenCount > 0
              ? (round.summary.paid_count / targetChildrenCount) * 100
              : 0;
            return (
              <div
                key={round.id}
                className="flex items-center gap-4 p-3 bg-muted rounded-xl cursor-pointer hover:bg-muted transition-colors"
                onClick={() => handleCardClick("collection")}
              >
                <div className="flex-1">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium">{round.name}</span>
                    <span className="text-muted-foreground">
                      {round.summary.paid_count}/{targetChildrenCount}
                    </span>
                  </div>
                  <Progress value={progressPercent} className="h-2" />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );

  // Render the detail view based on activeView
  const renderDetailView = () => {
    if (activeView === null) return null;

    const viewTitles: Record<DetailView & string, string> = {
      collection: "איסוף",
      expenses: "הוצאות",
      allocations: "הקצאות",
    };

    return (
      <div className="mt-6 border-t-2 border-border pt-6">
        {/* Back button and title */}
        <div className="flex items-center gap-3 mb-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setActiveView(null)}
            className="rounded-xl"
          >
            <ChevronUp className="h-4 w-4 ml-1" />
            חזרה
          </Button>
          <h3 className="font-bold text-lg text-foreground">{viewTitles[activeView]}</h3>
        </div>

        {/* Detail content */}
        {activeView === "collection" && (
          <CollectionTab
            classId={classId}
            paymentRounds={paymentRounds}
            children={children}
            amountPerChild={budgetMetrics.amountPerChild}
            estimatedChildren={budgetMetrics.amountPerChild ? Math.round(budgetMetrics.total / budgetMetrics.amountPerChild) : undefined}
            onCreatePaymentRound={onCreatePaymentRound}
            onUpdatePaymentStatus={onUpdatePaymentStatus}
            onBulkUpdatePayments={onBulkUpdatePayments}
            onAddChild={onAddChild}
            onChildrenAdded={() => window.location.reload()}
          />
        )}

        {activeView === "expenses" && (
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
        )}

        {activeView === "allocations" && (
          <AllocationsTab
            events={events}
            totalBudget={budgetMetrics.total}
            totalAllocated={budgetMetrics.allocated}
            childrenCount={children.length}
            onUpdateEventBudget={onUpdateEventBudget}
            onCreateEvent={onCreateEvent}
          />
        )}
      </div>
    );
  };

  return (
    <Card className={`shadow-xl rounded-3xl border-2 border-border ${className}`} dir="rtl">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500 to-blue-600">
            <Wallet className="h-6 w-6 text-white" />
          </div>
          <div>
            <CardTitle className="text-2xl font-extrabold text-foreground">ניהול התקציב</CardTitle>
            <CardDescription className="text-base">מעקב אחר איסופים, תשלומים והוצאות</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {renderHubView()}
        {renderDetailView()}
      </CardContent>
    </Card>
  );
}
