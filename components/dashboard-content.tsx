"use client";

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import {
  TrendingDown,
  X
} from "lucide-react";
import { EventsCalendarCard } from "@/components/events-calendar-card";
import { ClassDirectoryCard } from "@/components/class-directory-card";
import { BudgetHubWrapper } from "@/components/budget-hub-wrapper";
import { GiftCatalogCard } from "@/components/gift-catalog-card";
import { ClassNavigationBar, type NavigationSection } from "@/components/class-navigation-bar";
import { InviteParentsTask } from "@/components/setup-tasks/invite-parents-task";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import type { PaymentRoundWithPayments, ExpenseWithEvent } from "@/lib/types/budget";

type Class = {
  id: string;
  name: string;
  school_name: string;
  city: string;
  year: string;
  total_budget: number;
  budget_type: string;
  budget_amount: number;
  expected_payment_per_parent?: number;
  invite_code: string;
  created_at: string;
};

type Child = {
  id: string;
  class_id: string;
  name: string;
  address: string | null;
  birthday: string | null;
  created_at: string;
};

type Staff = {
  id: string;
  class_id: string;
  name: string;
  role: "teacher" | "assistant";
  birthday: string | null;
  created_at: string;
};

type Event = {
  id: string;
  class_id: string;
  name: string;
  event_type: string;
  icon: string | null;
  allocated_budget: number;
  spent_amount: number;
  event_date: string | null;
  created_at: string;
};

type ChildParent = {
  id: string;
  child_id: string;
  parent_id: string;
  relationship: "parent1" | "parent2";
  children?: { name: string };
  parents?: { name: string; phone: string | null };
};

type ClassMember = {
  id: string;
  class_id: string;
  user_id: string;
  role: string;
  joined_at: string;
};

type Parent = {
  id: string;
  name: string;
  phone: string | null;
  user_id: string | null;
};

type Payment = {
  id: string;
  class_id: string;
  parent_id: string;
  amount: number;
  payment_date: string;
  payment_method?: string;
  status: "pending" | "completed" | "failed" | "refunded";
  notes?: string;
};

type BudgetMetrics = {
  total: number;
  allocated: number;
  spent: number;
  remaining: number;
};

type DashboardContentProps = {
  classData: Class;
  classes: Class[];
  children: Child[];
  staff: Staff[];
  events: Event[];
  childParents: ChildParent[];
  classMembers: ClassMember[];
  parents: Parent[];
  payments: Payment[];
  budgetMetrics: BudgetMetrics;
  paymentRounds: PaymentRoundWithPayments[];
  expenses: ExpenseWithEvent[];
};

export function DashboardContent({
  classData,
  children,
  staff,
  events,
  childParents,
  parents,
  budgetMetrics,
  paymentRounds,
  expenses,
}: DashboardContentProps) {
  const [openSection, setOpenSection] = useState<NavigationSection>(null);
  const [showInviteDialog, setShowInviteDialog] = useState(false);

  // Memoize date calculations to prevent hydration mismatch
  // The empty dependency array ensures consistent values between server and client
  const { allEvents } = useMemo(() => {
    const now = new Date();
    const currentYear = now.getFullYear();

    // Convert children birthdays into event objects
    // Create both current year and next year birthdays for calendar display
    const childBirthdays: Event[] = children
      .filter((child) => child.birthday)
      .flatMap((child) => {
        // Parse birthday as local date (YYYY-MM-DD format from DB)
        // Split the date string to avoid timezone issues
        const [birthYear, month, day] = child.birthday!.split("-").map(Number);

        // Create birthday date strings (avoids timezone issues)
        const thisYearDateStr = `${currentYear}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
        const nextYearDateStr = `${currentYear + 1}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

        // For comparison, create a Date object
        const thisYearBirthday = new Date(currentYear, month - 1, day);

        // Calculate display ages
        const thisYearAge = currentYear - birthYear;
        const nextYearAge = currentYear + 1 - birthYear;

        const events: Event[] = [
          {
            id: `birthday-child-${child.id}-${currentYear}`,
            class_id: classData.id,
            name: `${child.name} (גיל ${thisYearAge})`,
            event_type: "birthday",
            icon: "🎂",
            allocated_budget: 0,
            spent_amount: 0,
            event_date: thisYearDateStr,
            created_at: child.created_at,
          },
        ];

        // Add next year's birthday if this year's has passed
        if (thisYearBirthday < now) {
          events.push({
            id: `birthday-child-${child.id}-${currentYear + 1}`,
            class_id: classData.id,
            name: `${child.name} (גיל ${nextYearAge})`,
            event_type: "birthday",
            icon: "🎂",
            allocated_budget: 0,
            spent_amount: 0,
            event_date: nextYearDateStr,
            created_at: child.created_at,
          });
        }

        return events;
      });

    // Convert staff birthdays into event objects
    // Create both current year and next year birthdays for calendar display
    const staffBirthdays: Event[] = staff
      .filter((member) => member.birthday)
      .flatMap((member) => {
        // Parse birthday as local date (YYYY-MM-DD format from DB)
        // Split the date string to avoid timezone issues
        const [, month, day] = member.birthday!.split("-").map(Number);
        const roleLabel = member.role === "teacher" ? "גננת" : "סייעת";

        // Create birthday for current year using date string (avoids timezone issues)
        const thisYearDateStr = `${currentYear}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
        // Create birthday for next year
        const nextYearDateStr = `${currentYear + 1}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

        // Check if this year's birthday has passed
        const thisYearBirthday = new Date(currentYear, month - 1, day);

        const events: Event[] = [
          {
            id: `birthday-staff-${member.id}-${currentYear}`,
            class_id: classData.id,
            name: `${member.name} (${roleLabel})`,
            event_type: "staff-birthday",
            icon: "🎉",
            allocated_budget: 0,
            spent_amount: 0,
            event_date: thisYearDateStr,
            created_at: member.created_at,
          },
        ];

        // Add next year's birthday if this year's has passed
        if (thisYearBirthday < now) {
          events.push({
            id: `birthday-staff-${member.id}-${currentYear + 1}`,
            class_id: classData.id,
            name: `${member.name} (${roleLabel})`,
            event_type: "staff-birthday",
            icon: "🎉",
            allocated_budget: 0,
            spent_amount: 0,
            event_date: nextYearDateStr,
            created_at: member.created_at,
          });
        }

        return events;
      });
    return { allEvents: [...events, ...childBirthdays, ...staffBirthdays] };
  }, [children, staff, classData.id, events]);

  // Calculate budget health
  const isOverBudget = budgetMetrics.remaining < 0;

  return (
    <div className="flex-1 w-full mx-auto px-4 py-8 relative" dir="rtl">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-6">
        <h1 className="text-4xl font-extrabold text-[#222222] mb-2">
          {classData.name}
        </h1>
        <p className="text-lg text-gray-600 mb-6">
          {classData.school_name} • {classData.city} • שנת {classData.year}
        </p>

        {/* Navigation Bar */}
        <ClassNavigationBar
          activeSection={openSection}
          onSectionChange={setOpenSection}
        />

        {/* Active Section Content - Shows BELOW the navigation bar */}
        {openSection && (
          <div className="bg-white rounded-2xl border-2 border-blue-300 shadow-xl p-6 relative animate-slide-down mt-6">
            {/* Close Button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setOpenSection(null)}
              className="absolute top-4 left-4 rounded-full z-10"
            >
              <X className="h-5 w-5" />
            </Button>

            {/* Section Content */}
            <div>
              {openSection === "budget" && (
                <BudgetHubWrapper
                  classId={classData.id}
                  budgetMetrics={budgetMetrics}
                  events={events}
                  children={children.map(c => ({
                    id: c.id,
                    name: c.name,
                    parents: childParents
                      .filter(cp => cp.child_id === c.id)
                      .map(cp => ({
                        name: cp.parents?.name || "",
                        phone: cp.parents?.phone || null
                      }))
                  }))}
                  paymentRounds={paymentRounds}
                  expenses={expenses}
                  className="border-0 shadow-none"
                />
              )}

              {openSection === "directory" && (
                <ClassDirectoryCard
                  classId={classData.id}
                  children={children}
                  parents={parents}
                  staff={staff}
                  childParents={childParents}
                  isAdmin={true}
                  className="border-0 shadow-none"
                  onInviteParents={() => setShowInviteDialog(true)}
                />
              )}

              {openSection === "events" && (
                <EventsCalendarCard events={allEvents} hideHeader={true} />
              )}

              {openSection === "gifts" && (
                <GiftCatalogCard className="border-0 shadow-none" />
              )}
            </div>
          </div>
        )}

        {/* Budget Warning */}
        {isOverBudget && (
          <div className="bg-red-50 border-2 border-red-200 rounded-xl p-3 mt-4">
            <p className="text-red-700 font-semibold flex items-center gap-2 text-sm">
              <TrendingDown className="h-4 w-4" />
              שים לב! התקציב המוקצה חורג מהתקציב הכולל ב-₪{Math.abs(budgetMetrics.remaining).toLocaleString()}
            </p>
          </div>
        )}
      </div>

      <style jsx global>{`
        @keyframes slide-down {
          from {
            opacity: 0;
            transform: translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-slide-down {
          animation: slide-down 0.3s ease-out;
        }
      `}</style>

      {/* Invite Parents Dialog */}
      <Dialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
        <DialogContent className="max-w-xl">
          <DialogTitle className="sr-only">הזמנת הורים לפלטפורמה</DialogTitle>
          <InviteParentsTask
            classId={classData.id}
            className={classData.name}
            onComplete={() => setShowInviteDialog(false)}
            onCancel={() => setShowInviteDialog(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
