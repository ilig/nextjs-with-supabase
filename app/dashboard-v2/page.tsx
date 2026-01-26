import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DashboardContent } from "@/components/v2";

export default async function DashboardV2Page() {
  const supabase = await createClient();

  // Check authentication
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

  // If no classes, redirect to onboarding
  if (!classes || classes.length === 0) {
    redirect("/onboarding");
  }

  // Get the first class
  const currentClass = classes[0];

  // Fetch children
  const { data: children } = await supabase
    .from("children")
    .select("*")
    .eq("class_id", currentClass.id)
    .order("name", { ascending: true });

  const childIds = (children || []).map((c: { id: string }) => c.id);

  // Fetch admins (class_members with admin role)
  const { data: adminMembers } = await supabase
    .from("class_members")
    .select("id, user_id, role")
    .eq("class_id", currentClass.id)
    .eq("role", "admin");

  // Get user emails for admins (we need to query auth.users separately or use a view)
  // For now, construct admin data with what we have
  const admins = (adminMembers || []).map((member: { id: string; user_id: string }) => ({
    id: member.id,
    user_id: member.user_id,
    email: member.user_id === user.id ? user.email || "" : "", // We only know current user's email
    is_owner: member.user_id === currentClass.created_by,
  }));

  // If current user is not in admins but is the owner, add them
  const isCurrentUserAdmin = admins.some((a: { user_id: string }) => a.user_id === user.id);
  if (!isCurrentUserAdmin && currentClass.created_by === user.id) {
    admins.unshift({
      id: "owner",
      user_id: user.id,
      email: user.email || "",
      is_owner: true,
    });
  }

  // Fetch pending admin invitations
  const { data: pendingInvitations } = await supabase
    .from("admin_invitations")
    .select("id, email, created_at")
    .eq("class_id", currentClass.id)
    .eq("status", "pending")
    .order("created_at", { ascending: false });

  // Fetch staff and events
  const [{ data: staff }, { data: events }] = await Promise.all([
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
  ]);

  // Fetch expenses separately (table may not exist in older deployments)
  let expenses: Array<{
    id: string;
    description: string;
    amount: number;
    expense_date: string;
    receipt_url?: string;
    event_id?: string;
    events?: { id: string; name: string; event_type: string };
  }> = [];
  const { data: expensesData, error: expensesError } = await supabase
    .from("expenses")
    .select(`
      *,
      events (
        id,
        name,
        event_type
      )
    `)
    .eq("class_id", currentClass.id)
    .order("expense_date", { ascending: false });

  if (!expensesError) {
    expenses = expensesData || [];
  }

  // Only fetch child_parents if we have children
  let childParents: Array<{
    child_id: string;
    parent_id: string;
    relationship: string;
    children?: { name: string };
    parents?: { name: string; phone: string };
  }> = [];

  if (childIds.length > 0) {
    const { data: childParentsData } = await supabase
      .from("child_parents")
      .select(`
        *,
        children (name),
        parents (name, phone)
      `)
      .in("child_id", childIds);

    childParents = childParentsData || [];
  }

  // Transform events to include allocated_budget from V2 fields
  const transformedEvents = (events || []).map((e: {
    id: string;
    allocated_budget?: number;
    allocated_for_kids?: number;
    allocated_for_staff?: number;
    [key: string]: unknown;
  }) => ({
    ...e,
    allocated_budget:
      e.allocated_budget ||
      (e.allocated_for_kids || 0) + (e.allocated_for_staff || 0),
  }));

  // Calculate budget metrics
  const totalBudget = currentClass.total_budget || 0;
  const allocatedBudget = transformedEvents.reduce((sum: number, event: { allocated_budget?: number }) =>
    sum + (event.allocated_budget || 0), 0) || 0;
  const spentBudget = expenses?.reduce((sum: number, expense: { amount?: number }) =>
    sum + (expense.amount || 0), 0) || 0;
  const remainingBudget = totalBudget - spentBudget;

  // Calculate collected amount (paid children × amount per child)
  const amountPerChild = currentClass.annual_amount_per_child || currentClass.budget_amount || 0;
  const paidChildrenCount = (children || []).filter(
    (c: { payment_status?: string }) => c.payment_status === "paid"
  ).length;
  const collectedAmount = paidChildrenCount * amountPerChild;

  return (
    <DashboardContent
      classData={{
        id: currentClass.id,
        name: currentClass.name,
        school_name: currentClass.school_name,
        city: currentClass.city,
        invite_code: currentClass.invite_code,
        paybox_link: currentClass.paybox_link,
        total_budget: currentClass.total_budget,
        budget_amount: currentClass.budget_amount,
        estimated_children: currentClass.estimated_children,
        estimated_staff: currentClass.estimated_staff,
        annual_amount_per_child: currentClass.annual_amount_per_child,
      }}
      children={children || []}
      staff={staff || []}
      events={transformedEvents}
      expenses={expenses || []}
      childParents={childParents || []}
      admins={admins}
      pendingInvitations={pendingInvitations || []}
      currentUserId={user.id}
      budgetMetrics={{
        total: totalBudget,
        allocated: allocatedBudget,
        spent: spentBudget,
        remaining: remainingBudget,
        amountPerChild: amountPerChild || undefined,
        collected: collectedAmount,
      }}
    />
  );
}
