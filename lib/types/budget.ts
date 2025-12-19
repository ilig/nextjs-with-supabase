// Types for Payment & Budget Management Feature

// ============================================
// Database Table Types
// ============================================

export type PaymentRound = {
  id: string;
  class_id: string;
  name: string;  // e.g., "תשלום שנתי", "גיוס לטיול"
  amount_per_child: number;
  due_date: string | null;
  created_at: string;
  updated_at: string;
};

export type Expense = {
  id: string;
  class_id: string;
  event_id: string | null;
  description: string;
  amount: number;
  expense_date: string;
  receipt_url: string | null;
  created_at: string;
  updated_at: string;
};

export type PaymentStatus = "paid" | "unpaid";

export type Payment = {
  id: string;
  class_id: string;
  parent_id: string | null;  // Legacy - kept for backwards compatibility
  child_id: string | null;
  payment_round_id: string | null;
  amount: number;
  payment_date: string;
  status: PaymentStatus;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

// ============================================
// View Types (for aggregated data)
// ============================================

export type PaymentRoundSummary = {
  payment_round_id: string;
  class_id: string;
  name: string;
  amount_per_child: number;
  due_date: string | null;
  total_children: number;
  paid_children: number;
  total_collected: number;
  expected_total: number;
};

export type ClassBudgetSummary = {
  class_id: string;
  total_collected: number;
  total_spent: number;
  balance: number;
};

// ============================================
// UI Component Types
// ============================================

export type Child = {
  id: string;
  name: string;
  class_id: string;
  address: string | null;
  birthday: string | null;
};

export type ChildWithParents = Child & {
  parents: {
    id: string;
    name: string;
    phone: string | null;
  }[];
};

export type ChildPaymentStatus = {
  child: ChildWithParents;
  status: PaymentStatus;
  payment_id: string | null;
  paid_at: string | null;
};

export type PaymentRoundWithPayments = PaymentRound & {
  payments: ChildPaymentStatus[];
  summary: {
    total_children: number;
    paid_count: number;
    unpaid_count: number;
    total_collected: number;
    expected_total: number;
    progress_percentage: number;
  };
};

export type ExpenseWithEvent = Expense & {
  event?: {
    id: string;
    name: string;
    event_type: string;
    icon: string | null;
  } | null;
};

// ============================================
// Form Types
// ============================================

export type CreatePaymentRoundInput = {
  name: string;
  amount_per_child: number;
  due_date?: string;
};

export type CreateExpenseInput = {
  description: string;
  amount: number;
  expense_date: string;
  event_id?: string;
  receipt_url?: string;
};

export type UpdatePaymentInput = {
  payment_id: string;
  status: PaymentStatus;
};

export type BulkUpdatePaymentsInput = {
  payment_round_id: string;
  child_ids: string[];
  status: PaymentStatus;
};

// ============================================
// Export Types
// ============================================

export type ExportFormat = "excel" | "csv";

export type UnpaidChildForExport = {
  childName: string;
  parentNames: string[];
  parentPhones: string[];
  amount: number;
};

// ============================================
// Budget Hub Tab Types
// ============================================

export type BudgetHubTab = "summary" | "collection" | "allocations" | "expenses";

export type BudgetHubProps = {
  classId: string;
  initialTab?: BudgetHubTab;
};
