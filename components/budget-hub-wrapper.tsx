"use client";

import { useCallback } from "react";
import { BudgetHubCard } from "./budget-hub-card";
import {
  createPaymentRound,
  updatePaymentStatus,
  bulkUpdatePayments,
  createExpense,
  deleteExpense,
  updateEventBudget,
} from "@/app/actions/budget";
import type { PaymentRoundWithPayments, ExpenseWithEvent, PaymentStatus } from "@/lib/types/budget";

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

type BudgetHubWrapperProps = {
  classId: string;
  budgetMetrics: BudgetMetrics;
  events: Event[];
  children: Child[];
  paymentRounds: PaymentRoundWithPayments[];
  expenses: ExpenseWithEvent[];
  className?: string;
};

export function BudgetHubWrapper({
  classId,
  budgetMetrics,
  events,
  children,
  paymentRounds,
  expenses,
  className,
}: BudgetHubWrapperProps) {
  const handleCreatePaymentRound = useCallback(
    async (data: { name: string; amount_per_child: number; due_date?: string }) => {
      await createPaymentRound({ classId, ...data });
    },
    [classId]
  );

  const handleUpdatePaymentStatus = useCallback(
    async (paymentRoundId: string, childId: string, status: PaymentStatus) => {
      await updatePaymentStatus(paymentRoundId, childId, status);
    },
    []
  );

  const handleBulkUpdatePayments = useCallback(
    async (paymentRoundId: string, childIds: string[], status: PaymentStatus) => {
      await bulkUpdatePayments(paymentRoundId, childIds, status);
    },
    []
  );

  const handleCreateExpense = useCallback(
    async (data: { description: string; amount: number; expense_date: string; event_id?: string }) => {
      await createExpense({ classId, ...data });
    },
    [classId]
  );

  const handleDeleteExpense = useCallback(async (expenseId: string) => {
    await deleteExpense(expenseId);
  }, []);

  const handleUpdateEventBudget = useCallback(async (eventId: string, budget: number) => {
    await updateEventBudget(eventId, budget);
  }, []);

  return (
    <BudgetHubCard
      classId={classId}
      budgetMetrics={budgetMetrics}
      events={events}
      children={children}
      paymentRounds={paymentRounds}
      expenses={expenses}
      className={className}
      onCreatePaymentRound={handleCreatePaymentRound}
      onUpdatePaymentStatus={handleUpdatePaymentStatus}
      onBulkUpdatePayments={handleBulkUpdatePayments}
      onCreateExpense={handleCreateExpense}
      onDeleteExpense={handleDeleteExpense}
      onUpdateEventBudget={handleUpdateEventBudget}
    />
  );
}
