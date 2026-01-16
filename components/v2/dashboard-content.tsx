"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { MobileBottomNav, type DashboardTab } from "./mobile-bottom-nav";
import { DesktopTopNav } from "./desktop-top-nav";
import { BudgetTab, ContactsTab, CalendarTab, GiftsTab, SettingsTab } from "./tabs";
import { cn } from "@/lib/utils";
import { PaymentManagementSheet } from "./payment-management-sheet";
import { SetupBanners } from "./setup-banners";

type Child = {
  id: string;
  name: string;
  address?: string;
  birthday?: string;
  payment_status?: "paid" | "unpaid";
  payment_date?: string;
};

type Staff = {
  id: string;
  name: string;
  role: string;
  birthday?: string;
};

type Event = {
  id: string;
  name: string;
  event_type: string;
  event_date?: string;
  allocated_budget?: number;
};

type ChildParent = {
  child_id: string;
  parent_id: string;
  relationship: string;
  children?: { name: string };
  parents?: { name: string; phone: string };
};

type Admin = {
  id: string;
  user_id: string;
  email: string;
  is_owner: boolean;
};

type PendingInvitation = {
  id: string;
  email: string;
  created_at: string;
};

type ClassData = {
  id: string;
  name: string;
  school_name: string;
  city: string;
  invite_code?: string;
  paybox_link?: string;
  total_budget?: number;
  budget_amount?: number;
  estimated_children?: number;
  estimated_staff?: number;
  annual_amount_per_child?: number;
};

type DashboardContentProps = {
  classData: ClassData;
  children?: Child[];
  staff?: Staff[];
  events?: Event[];
  childParents?: ChildParent[];
  admins?: Admin[];
  pendingInvitations?: PendingInvitation[];
  currentUserId?: string;
  budgetMetrics?: {
    total: number;
    allocated: number;
    spent: number;
    remaining: number;
    amountPerChild?: number;
    collected?: number;
  };
  className?: string;
};

export function DashboardContent({
  classData,
  children = [],
  staff = [],
  events = [],
  childParents = [],
  admins = [],
  pendingInvitations = [],
  currentUserId = "",
  budgetMetrics,
  className,
}: DashboardContentProps) {
  const [activeTab, setActiveTab] = useState<DashboardTab>("budget");
  const [paymentSheetOpen, setPaymentSheetOpen] = useState(false);
  const [openStaffModal, setOpenStaffModal] = useState(false);
  const [openKidsModal, setOpenKidsModal] = useState(false);
  const [paymentLinkSent, setPaymentLinkSent] = useState(false);
  const router = useRouter();

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
  };

  // Handle marking a child as paid
  const handleMarkAsPaid = async (childId: string) => {
    const supabase = createClient();
    const { error } = await supabase
      .from("children")
      .update({
        payment_status: "paid",
        payment_date: new Date().toISOString()
      })
      .eq("id", childId);

    if (!error) {
      // Refresh the page to get updated data
      router.refresh();
    }
  };

  // Handle sending reminders (placeholder - would integrate with messaging service)
  const handleSendReminder = async (childIds: string[]) => {
    // For now, just show an alert. In production, this would:
    // 1. Get parent contact info for selected children
    // 2. Send WhatsApp/SMS/Email reminders
    // 3. Log the reminder in the database
    const selectedNames = children
      .filter(c => childIds.includes(c.id))
      .map(c => c.name)
      .join(", ");

    alert(`תזכורת תישלח להורים של: ${selectedNames}\n\nהתכונה תהיה זמינה בקרוב!`);
  };

  const classDisplayName = `${classData.name} - ${classData.school_name}`;

  // Setup banner handlers - save paybox link to database
  const handleSavePayboxLink = useCallback(async (link: string): Promise<boolean> => {
    const supabase = createClient();
    const { error } = await supabase
      .from("classes")
      .update({ paybox_link: link })
      .eq("id", classData.id);

    if (!error) {
      router.refresh();
      return true;
    }
    return false;
  }, [classData.id, router]);

  const handleAddStaff = useCallback(() => {
    setOpenStaffModal(true);
    setActiveTab("contacts");
  }, []);

  // Handler for marking payment link as sent
  const handlePaymentLinkSent = useCallback(async (): Promise<boolean> => {
    // For now, just set local state. In production, this could be persisted to database
    setPaymentLinkSent(true);
    return true;
  }, []);

  // Handler for navigating to contacts management and opening kids modal
  const handleManageContacts = useCallback(() => {
    setOpenKidsModal(true);
    setActiveTab("contacts");
  }, []);

  // Reset modals when leaving contacts tab
  useEffect(() => {
    if (activeTab !== "contacts") {
      setOpenStaffModal(false);
      setOpenKidsModal(false);
    }
  }, [activeTab]);

  // Callback to reset modal state after it's been opened
  const handleStaffModalOpened = useCallback(() => {
    setOpenStaffModal(false);
  }, []);

  const handleKidsModalOpened = useCallback(() => {
    setOpenKidsModal(false);
  }, []);

  // Get collected amount from budgetMetrics or calculate from paid children
  const collected = budgetMetrics?.collected ||
    children.filter(c => c.payment_status === "paid").length * (classData.annual_amount_per_child || 0);

  // Prepare children data with parent info from childParents
  const childrenWithParentInfo = children.map(c => {
    const parentRelation = childParents.find(cp => cp.child_id === c.id);
    return {
      id: c.id,
      name: c.name,
      payment_status: (c.payment_status || "unpaid") as "paid" | "unpaid",
      payment_date: c.payment_date,
      parent_name: parentRelation?.parents?.name,
      parent_phone: parentRelation?.parents?.phone,
    };
  });

  const renderTabContent = () => {
    switch (activeTab) {
      case "budget":
        return (
          <BudgetTab
            budgetMetrics={{
              total: budgetMetrics?.total ?? 0,
              allocated: budgetMetrics?.allocated ?? 0,
              spent: budgetMetrics?.spent ?? 0,
              remaining: budgetMetrics?.remaining ?? 0,
              amountPerChild: budgetMetrics?.amountPerChild,
              collected,
            }}
            events={events}
            children={childrenWithParentInfo}
            estimatedChildren={classData.estimated_children}
            estimatedStaff={classData.estimated_staff}
            onBannerClick={() => setPaymentSheetOpen(true)}
          />
        );
      case "contacts":
        return (
          <ContactsTab
            classId={classData.id}
            inviteCode={classData.invite_code}
            children={children}
            staff={staff}
            childParents={childParents}
            openStaffModalOnMount={openStaffModal}
            openKidsModalOnMount={openKidsModal}
            onStaffModalOpened={handleStaffModalOpened}
            onKidsModalOpened={handleKidsModalOpened}
            expectedStaff={classData.estimated_staff ?? 2}
          />
        );
      case "calendar":
        return (
          <CalendarTab
            classId={classData.id}
            inviteCode={classData.invite_code}
            events={events}
            children={children}
            staff={staff}
            isAdmin={true}
          />
        );
      case "gifts":
        return <GiftsTab />;
      case "settings":
        return (
          <SettingsTab
            classData={classData}
            admins={admins}
            pendingInvitations={pendingInvitations}
            currentUserId={currentUserId}
            onLogout={handleLogout}
          />
        );
      default:
        return (
          <BudgetTab
            budgetMetrics={{
              total: budgetMetrics?.total ?? 0,
              allocated: budgetMetrics?.allocated ?? 0,
              spent: budgetMetrics?.spent ?? 0,
              remaining: budgetMetrics?.remaining ?? 0,
              amountPerChild: budgetMetrics?.amountPerChild,
              collected,
            }}
            events={events}
            children={childrenWithParentInfo}
            estimatedChildren={classData.estimated_children}
            estimatedStaff={classData.estimated_staff}
            onBannerClick={() => setPaymentSheetOpen(true)}
          />
        );
    }
  };

  return (
    <div dir="rtl" className={cn("min-h-screen bg-background flex flex-col", className)}>
      {/* Desktop navigation */}
      <DesktopTopNav
        activeTab={activeTab}
        onTabChange={setActiveTab}
        classDisplayName={classDisplayName}
      />

      {/* Main content */}
      <main className="flex-1 overflow-auto pb-20 md:pb-0">
        {/* Setup notification banners */}
        <SetupBanners
          payboxLink={classData.paybox_link}
          inviteCode={classData.invite_code}
          childrenCount={children.length}
          staffCount={staff.length}
          expectedChildren={classData.estimated_children ?? 30}
          expectedStaff={classData.estimated_staff ?? 2}
          paymentLinkSent={paymentLinkSent}
          onSavePayboxLink={handleSavePayboxLink}
          onPaymentLinkSent={handlePaymentLinkSent}
          onManageContacts={handleManageContacts}
          onAddStaff={handleAddStaff}
          classDisplayName={classData.name}
          schoolName={classData.school_name}
          className="p-4 md:p-6 pb-0 md:pb-0"
        />

        {renderTabContent()}
      </main>

      {/* Mobile navigation */}
      <MobileBottomNav activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Payment Management Sheet */}
      <PaymentManagementSheet
        open={paymentSheetOpen}
        onOpenChange={setPaymentSheetOpen}
        children={childrenWithParentInfo}
        estimatedChildren={classData.estimated_children || 0}
        collected={collected}
        total={budgetMetrics?.total || 0}
        payboxLink={classData.paybox_link}
        inviteCode={classData.invite_code}
        classDisplayName={classData.name}
        schoolName={classData.school_name}
        onMarkAsPaid={handleMarkAsPaid}
        onSendReminder={handleSendReminder}
      />
    </div>
  );
}
