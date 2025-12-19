import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { DashboardWithSetup } from "@/components/dashboard-with-setup";
import { getPaymentRoundsWithPayments, getExpensesWithEvents } from "@/app/actions/budget";

export default async function DashboardPage() {
  const supabase = await createClient();

  const { data, error } = await supabase.auth.getClaims();
  if (error || !data?.claims) {
    redirect("/auth/login");
  }

  // Get authenticated user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  // Fetch user's classes
  const { data: classes } = await supabase
    .from("classes")
    .select("*")
    .eq("created_by", user.id)
    .order("created_at", { ascending: false });

  // If no classes, redirect to class creation
  if (!classes || classes.length === 0) {
    redirect("/create-class");
  }

  // Get the first class (or we can add class selection later)
  const currentClass = classes[0];

  // Fetch children first (including birthday)
  const { data: children } = await supabase
    .from("children")
    .select("*")
    .eq("class_id", currentClass.id)
    .order("name", { ascending: true });

  // Get all parent IDs from child_parents relationship
  const { data: childParentsRelations } = await supabase
    .from("child_parents")
    .select("parent_id")
    .in("child_id", (children || []).map((c: any) => c.id));

  const parentIds = [...new Set((childParentsRelations || []).map((cp: any) => cp.parent_id))];

  // Fetch all related data for the class
  const [
    { data: staff },
    { data: events },
    { data: childParents },
    { data: classMembers },
    { data: parents },
    { data: payments },
  ] = await Promise.all([
    supabase
      .from("staff")
      .select("*")
      .eq("class_id", currentClass.id)
      .order("role", { ascending: true }),
    supabase
      .from("events")
      .select("*")
      .eq("class_id", currentClass.id)
      .order("event_date", { ascending: true }),
    supabase
      .from("child_parents")
      .select(`
        *,
        children (name),
        parents (name, phone)
      `)
      .in("child_id", (children || []).map((c: any) => c.id)),
    supabase
      .from("class_members")
      .select(`
        *,
        user_id
      `)
      .eq("class_id", currentClass.id),
    supabase
      .from("parents")
      .select("*")
      .in("id", parentIds.length > 0 ? parentIds : ["00000000-0000-0000-0000-000000000000"]),
    supabase
      .from("payments")
      .select("*")
      .eq("class_id", currentClass.id)
      .order("payment_date", { ascending: false }),
  ]);

  // Fetch payment rounds and expenses for the budget hub
  const [paymentRoundsResult, expensesResult] = await Promise.all([
    getPaymentRoundsWithPayments(currentClass.id),
    getExpensesWithEvents(currentClass.id),
  ]);

  const paymentRounds = paymentRoundsResult.data || [];
  const expenses = expensesResult.data || [];

  // Calculate budget metrics
  const totalBudget = currentClass.total_budget || 0;
  const allocatedBudget = events?.reduce((sum, event) => sum + (event.allocated_budget || 0), 0) || 0;
  const spentBudget = expenses.reduce((sum, exp) => sum + (exp.amount || 0), 0);
  const remainingBudget = totalBudget - allocatedBudget;

  return (
    <div dir="rtl" className="min-h-screen bg-[#FFF9F0] flex flex-col">
      <Header />

      <DashboardWithSetup
        classData={currentClass}
        classes={classes}
        children={children || []}
        staff={staff || []}
        events={events || []}
        childParents={childParents || []}
        classMembers={classMembers || []}
        parents={parents || []}
        payments={payments || []}
        budgetMetrics={{
          total: totalBudget,
          allocated: allocatedBudget,
          spent: spentBudget,
          remaining: remainingBudget,
        }}
        paymentRounds={paymentRounds}
        expenses={expenses}
      />

      <Footer />
    </div>
  );
}
