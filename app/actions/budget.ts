"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { PaymentStatus } from "@/lib/types/budget";

// ============================================
// Payment Round Actions
// ============================================

export async function createPaymentRound(data: {
  classId: string;
  name: string;
  amount_per_child: number;
  due_date?: string;
}) {
  const supabase = await createClient();

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    // Create the payment round
    const { data: paymentRound, error: roundError } = await supabase
      .from("payment_rounds")
      .insert({
        class_id: data.classId,
        name: data.name,
        amount_per_child: data.amount_per_child,
        due_date: data.due_date || null,
      })
      .select()
      .single();

    if (roundError) throw roundError;

    // Get all children in the class
    const { data: children, error: childrenError } = await supabase
      .from("children")
      .select("id")
      .eq("class_id", data.classId);

    if (childrenError) throw childrenError;

    // Create unpaid payment entries for all children
    if (children && children.length > 0) {
      const payments = children.map((child) => ({
        class_id: data.classId,
        payment_round_id: paymentRound.id,
        child_id: child.id,
        amount: data.amount_per_child,
        status: "unpaid" as const,
      }));

      const { error: paymentsError } = await supabase
        .from("payments")
        .insert(payments);

      if (paymentsError) throw paymentsError;
    }

    revalidatePath("/dashboard");
    return { success: true, paymentRound };
  } catch (error) {
    console.error("Error creating payment round:", error);
    return { success: false, error: String(error) };
  }
}

export async function deletePaymentRound(paymentRoundId: string) {
  const supabase = await createClient();

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    // Delete the payment round (cascade will delete related payments)
    const { error } = await supabase
      .from("payment_rounds")
      .delete()
      .eq("id", paymentRoundId);

    if (error) throw error;

    revalidatePath("/dashboard");
    return { success: true };
  } catch (error) {
    console.error("Error deleting payment round:", error);
    return { success: false, error: String(error) };
  }
}

// ============================================
// Payment Status Actions
// ============================================

export async function updatePaymentStatus(
  paymentRoundId: string,
  childId: string,
  status: PaymentStatus
) {
  const supabase = await createClient();

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    const { error } = await supabase
      .from("payments")
      .update({
        status,
        payment_date: status === "paid" ? new Date().toISOString() : null,
      })
      .eq("payment_round_id", paymentRoundId)
      .eq("child_id", childId);

    if (error) throw error;

    revalidatePath("/dashboard");
    return { success: true };
  } catch (error) {
    console.error("Error updating payment status:", error);
    return { success: false, error: String(error) };
  }
}

export async function bulkUpdatePayments(
  paymentRoundId: string,
  childIds: string[],
  status: PaymentStatus
) {
  const supabase = await createClient();

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    const { error } = await supabase
      .from("payments")
      .update({
        status,
        payment_date: status === "paid" ? new Date().toISOString() : null,
      })
      .eq("payment_round_id", paymentRoundId)
      .in("child_id", childIds);

    if (error) throw error;

    revalidatePath("/dashboard");
    return { success: true };
  } catch (error) {
    console.error("Error bulk updating payments:", error);
    return { success: false, error: String(error) };
  }
}

// ============================================
// Receipt Upload Actions
// ============================================

export async function uploadReceipt(formData: FormData) {
  const supabase = await createClient();

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    const file = formData.get("file") as File;
    const classId = formData.get("classId") as string;

    if (!file || !classId) {
      throw new Error("Missing file or classId");
    }

    // Generate unique filename
    const fileExt = file.name.split(".").pop();
    const fileName = `${classId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("receipts")
      .upload(fileName, file, {
        cacheControl: "3600",
        upsert: false,
      });

    if (uploadError) throw uploadError;

    // Return the path (not public URL) - we'll generate signed URLs when viewing
    return { success: true, url: uploadData.path, path: uploadData.path };
  } catch (error) {
    console.error("Error uploading receipt:", error);
    return { success: false, error: String(error) };
  }
}

export async function getReceiptUrl(path: string) {
  const supabase = await createClient();

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    const { data, error } = await supabase.storage
      .from("receipts")
      .createSignedUrl(path, 3600); // 1 hour expiry

    if (error) throw error;

    return { success: true, url: data.signedUrl };
  } catch (error) {
    console.error("Error getting receipt URL:", error);
    return { success: false, error: String(error) };
  }
}

// ============================================
// Expense Actions
// ============================================

export async function createExpense(data: {
  classId: string;
  description: string;
  amount: number;
  expense_date: string;
  event_id?: string;
  receipt_url?: string;
}) {
  const supabase = await createClient();

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    const { data: expense, error } = await supabase
      .from("expenses")
      .insert({
        class_id: data.classId,
        description: data.description,
        amount: data.amount,
        expense_date: data.expense_date,
        event_id: data.event_id || null,
        receipt_url: data.receipt_url || null,
      })
      .select()
      .single();

    if (error) throw error;

    // If linked to an event, update the event's spent_amount
    if (data.event_id) {
      const { data: event } = await supabase
        .from("events")
        .select("spent_amount")
        .eq("id", data.event_id)
        .single();

      if (event) {
        await supabase
          .from("events")
          .update({
            spent_amount: (event.spent_amount || 0) + data.amount,
          })
          .eq("id", data.event_id);
      }
    }

    revalidatePath("/dashboard");
    return { success: true, expense };
  } catch (error) {
    console.error("Error creating expense:", error);
    return { success: false, error: String(error) };
  }
}

export async function deleteExpense(expenseId: string) {
  const supabase = await createClient();

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    // Get the expense first to check if it has an event link
    const { data: expense } = await supabase
      .from("expenses")
      .select("event_id, amount")
      .eq("id", expenseId)
      .single();

    // Delete the expense
    const { error } = await supabase
      .from("expenses")
      .delete()
      .eq("id", expenseId);

    if (error) throw error;

    // If linked to an event, update the event's spent_amount
    if (expense?.event_id) {
      const { data: event } = await supabase
        .from("events")
        .select("spent_amount")
        .eq("id", expense.event_id)
        .single();

      if (event) {
        await supabase
          .from("events")
          .update({
            spent_amount: Math.max(0, (event.spent_amount || 0) - expense.amount),
          })
          .eq("id", expense.event_id);
      }
    }

    revalidatePath("/dashboard");
    return { success: true };
  } catch (error) {
    console.error("Error deleting expense:", error);
    return { success: false, error: String(error) };
  }
}

// ============================================
// Event Actions
// ============================================

export async function createEvent(data: {
  classId: string;
  name: string;
  icon: string;
  allocated_budget: number;
  event_type?: string;
}) {
  const supabase = await createClient();

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    const { data: event, error } = await supabase
      .from("events")
      .insert({
        class_id: data.classId,
        name: data.name,
        icon: data.icon,
        allocated_budget: data.allocated_budget,
        spent_amount: 0,
        event_type: data.event_type || "holiday",
      })
      .select()
      .single();

    if (error) throw error;

    revalidatePath("/dashboard");
    return { success: true, event };
  } catch (error) {
    console.error("Error creating event:", error);
    return { success: false, error: String(error) };
  }
}

export async function updateEventBudget(eventId: string, budget: number) {
  const supabase = await createClient();

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    const { error } = await supabase
      .from("events")
      .update({ allocated_budget: budget })
      .eq("id", eventId);

    if (error) throw error;

    revalidatePath("/dashboard");
    return { success: true };
  } catch (error) {
    console.error("Error updating event budget:", error);
    return { success: false, error: String(error) };
  }
}

// ============================================
// Class Budget Settings Actions
// ============================================

export async function updateClassBudgetSettings(data: {
  classId: string;
  amountPerChild: number;
  estimatedChildren: number;
  estimatedStaff: number;
  totalBudget: number;
}) {
  const supabase = await createClient();

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    const { error } = await supabase
      .from("classes")
      .update({
        annual_amount_per_child: data.amountPerChild,
        budget_amount: data.amountPerChild,
        estimated_children: data.estimatedChildren,
        estimated_staff: data.estimatedStaff,
        total_budget: data.totalBudget,
      })
      .eq("id", data.classId);

    if (error) throw error;

    revalidatePath("/dashboard");
    revalidatePath("/dashboard-v2");
    return { success: true };
  } catch (error) {
    console.error("Error updating class budget settings:", error);
    return { success: false, error: String(error) };
  }
}

export async function updateEventAllocations(data: {
  classId: string;
  events: Array<{
    id?: string;
    eventType: string;
    name: string;
    amountPerKid: number;
    amountPerStaff: number;
    allocatedBudget: number;
    allocatedForKids: number;
    allocatedForStaff: number;
    kidsCount: number;
    staffCount: number;
    isCustom?: boolean;
  }>;
  disabledEventIds: string[];
}) {
  const supabase = await createClient();

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    // Set allocated_budget to 0 for disabled events (don't delete, just zero out)
    if (data.disabledEventIds.length > 0) {
      const { error: disableError } = await supabase
        .from("events")
        .update({
          allocated_budget: 0,
          amount_per_kid: 0,
          amount_per_staff: 0,
          allocated_for_kids: 0,
          allocated_for_staff: 0,
        })
        .in("id", data.disabledEventIds);

      if (disableError) throw disableError;
    }

    // Update or create events
    for (const event of data.events) {
      if (event.id && !event.id.startsWith("new-")) {
        // Update existing event
        const { error: updateError } = await supabase
          .from("events")
          .update({
            name: event.name,
            allocated_budget: event.allocatedBudget,
            amount_per_kid: event.amountPerKid,
            amount_per_staff: event.amountPerStaff,
            allocated_for_kids: event.allocatedForKids,
            allocated_for_staff: event.allocatedForStaff,
            kids_count: event.kidsCount,
            staff_count: event.staffCount,
          })
          .eq("id", event.id);

        if (updateError) throw updateError;
      } else {
        // Create new event
        const { error: insertError } = await supabase
          .from("events")
          .insert({
            class_id: data.classId,
            name: event.name,
            event_type: event.eventType,
            allocated_budget: event.allocatedBudget,
            amount_per_kid: event.amountPerKid,
            amount_per_staff: event.amountPerStaff,
            allocated_for_kids: event.allocatedForKids,
            allocated_for_staff: event.allocatedForStaff,
            kids_count: event.kidsCount,
            staff_count: event.staffCount,
            spent_amount: 0,
          });

        if (insertError) throw insertError;
      }
    }

    revalidatePath("/dashboard");
    revalidatePath("/dashboard-v2");
    return { success: true };
  } catch (error) {
    console.error("Error updating event allocations:", error);
    return { success: false, error: String(error) };
  }
}

// ============================================
// Data Fetching Functions
// ============================================

export async function getPaymentRoundsWithPayments(classId: string) {
  const supabase = await createClient();

  try {
    // Get payment rounds
    const { data: rounds, error: roundsError } = await supabase
      .from("payment_rounds")
      .select("*")
      .eq("class_id", classId)
      .order("created_at", { ascending: false });

    if (roundsError) {
      console.error("Error fetching rounds:", roundsError);
      throw roundsError;
    }

    // Get children with parents
    const { data: children, error: childrenError } = await supabase
      .from("children")
      .select(`
        id,
        name,
        child_parents (
          parents (
            id,
            name,
            phone
          )
        )
      `)
      .eq("class_id", classId);

    if (childrenError) {
      console.error("Error fetching children:", childrenError);
      throw childrenError;
    }

    // Get all payments for these rounds (skip if no rounds exist)
    const roundIds = rounds?.map((r) => r.id) || [];
    let payments: any[] = [];

    if (roundIds.length > 0) {
      const { data: paymentsData, error: paymentsError } = await supabase
        .from("payments")
        .select("*")
        .in("payment_round_id", roundIds);

      if (paymentsError) {
        console.error("Error fetching payments in rounds:", paymentsError);
        throw paymentsError;
      }
      payments = paymentsData || [];
    }

    // Build the response with summary data
    const roundsWithPayments = rounds?.map((round) => {
      const roundPayments = payments?.filter((p) => p.payment_round_id === round.id) || [];

      const childPayments = children?.map((child) => {
        const payment = roundPayments.find((p) => p.child_id === child.id);
        return {
          child: {
            id: child.id,
            name: child.name,
            class_id: classId,
            address: null,
            birthday: null,
            parents: child.child_parents?.map((cp: any) => ({
              id: cp.parents?.id || "",
              name: cp.parents?.name || "",
              phone: cp.parents?.phone || null,
            })) || [],
          },
          status: (payment?.status || "unpaid") as PaymentStatus,
          payment_id: payment?.id || null,
          paid_at: payment?.payment_date || null,
        };
      }) || [];

      const paidCount = childPayments.filter((p) => p.status === "paid").length;
      const unpaidCount = childPayments.filter((p) => p.status === "unpaid").length;
      const totalChildren = childPayments.length;
      const totalCollected = paidCount * round.amount_per_child;
      const expectedTotal = totalChildren * round.amount_per_child;

      return {
        ...round,
        payments: childPayments,
        summary: {
          total_children: totalChildren,
          paid_count: paidCount,
          unpaid_count: unpaidCount,
          total_collected: totalCollected,
          expected_total: expectedTotal,
          progress_percentage: totalChildren > 0 ? (paidCount / totalChildren) * 100 : 0,
        },
      };
    }) || [];

    return { success: true, data: roundsWithPayments };
  } catch (error) {
    console.error("Error fetching payment rounds:", error);
    return { success: false, error: String(error), data: [] };
  }
}

export async function getExpensesWithEvents(classId: string) {
  const supabase = await createClient();

  try {
    const { data: expenses, error } = await supabase
      .from("expenses")
      .select(`
        *,
        events (
          id,
          name,
          event_type,
          icon
        )
      `)
      .eq("class_id", classId)
      .order("expense_date", { ascending: false });

    if (error) throw error;

    // Transform to match ExpenseWithEvent type
    const expensesWithEvents = expenses?.map((exp) => ({
      ...exp,
      event: exp.events || null,
    })) || [];

    return { success: true, data: expensesWithEvents };
  } catch (error) {
    console.error("Error fetching expenses:", error);
    return { success: false, error: String(error), data: [] };
  }
}
