"use client";

import { useState, useEffect, useMemo } from "react";
import { DashboardContent } from "./dashboard-content";
import { SetupChecklist } from "./setup-checklist";
import { ClassNavigationBar, type NavigationSection } from "./class-navigation-bar";
import { EventsCalendarCard } from "./events-calendar-card";
import { ClassDirectoryCard } from "./class-directory-card";
import { BudgetHubWrapper } from "./budget-hub-wrapper";
import { GiftCatalogCard } from "./gift-catalog-card";
import { ChildrenUploadTask } from "./setup-tasks/children-upload-task";
import { StaffAdditionTask } from "./setup-tasks/staff-addition-task";
import { BudgetSetupTask } from "./setup-tasks/budget-setup-task";
import { InviteParentsTask } from "./setup-tasks/invite-parents-task";
import { PaymentRequestTask } from "./setup-tasks/payment-request-task";
import { ParentFormLinksTask } from "./setup-tasks/parent-form-links-task";
import { Dialog, DialogContent, DialogTitle } from "./ui/dialog";
import { Button } from "./ui/button";
import { X, CheckCircle } from "lucide-react";

interface DashboardWithSetupProps {
  classData: any;
  classes: any[];
  children: any[];
  staff: any[];
  events: any[];
  childParents: any[];
  classMembers: any[];
  parents: any[];
  payments: any[];
  budgetMetrics: {
    total: number;
    allocated: number;
    spent: number;
    remaining: number;
    amountPerChild?: number;
  };
  paymentRounds: any[];
  expenses: any[];
}

export function DashboardWithSetup(props: DashboardWithSetupProps) {
  const { classData, children, staff, events, parents, budgetMetrics, childParents, paymentRounds, expenses } = props;

  const [activeTask, setActiveTask] = useState<string | null>(null);
  const [selectedMethod, setSelectedMethod] = useState<string | undefined>(undefined);
  const [activeSection, setActiveSection] = useState<NavigationSection>(null);

  // Check setup completion status
  const hasChildren = children.length > 0;
  const hasStaff = staff.length > 0;
  const hasBudget = classData.total_budget > 0;
  const hasEvents = events.length > 0;
  const isSetupComplete = hasChildren && hasStaff && hasBudget && hasEvents;

  // Debug logging
  console.log("Setup status:", {
    hasChildren,
    hasStaff,
    hasBudget,
    hasEvents,
    isSetupComplete,
    setup_completed: classData.setup_completed,
    total_budget: classData.total_budget,
    childrenCount: children.length,
    staffCount: staff.length,
    eventsCount: events.length,
  });

  // Initialize with server-safe defaults, then update on client
  const [showSetup, setShowSetup] = useState(() => {
    // Server-safe check: use only props data, no localStorage
    if (classData.setup_completed) return false;
    const complete = children.length > 0 && staff.length > 0 && classData.total_budget > 0 && events.length > 0;
    return !complete;
  });

  const [showSuccessMessage, setShowSuccessMessage] = useState(false);

  // Check localStorage on client mount for more accurate state
  useEffect(() => {
    const storedProgress = localStorage.getItem(`setup_progress_${classData.id}`);
    const completedTasks: string[] = storedProgress ? JSON.parse(storedProgress).completedTasks || [] : [];
    const requiredTasks = ['upload_children', 'parent_form_links', 'add_staff', 'setup_budget', 'invite_parents', 'request_payment'];
    const allTasksCompleted = requiredTasks.every(task => completedTasks.includes(task));
    const hasData = children.length > 0 && staff.length > 0 && classData.total_budget > 0 && events.length > 0;

    // Update showSetup based on localStorage
    if (classData.setup_completed) {
      setShowSetup(false);
    } else if (!allTasksCompleted) {
      setShowSetup(true);
    } else {
      setShowSetup(!hasData);
    }

    // Show success message if all tasks completed and has data but not marked as complete
    const shouldShowSuccess = allTasksCompleted && hasData && !classData.setup_completed;
    console.log("showSuccessMessage check:", { completedTasks, allTasksCompleted, hasData, setup_completed: classData.setup_completed, shouldShowSuccess });
    setShowSuccessMessage(shouldShowSuccess);
  }, [classData.id, classData.setup_completed, classData.total_budget, children.length, staff.length, events.length]);

  const estimatedChildren = classData.number_of_children || 24;
  const estimatedStaff = classData.number_of_staff || 2;

  const handleTaskComplete = () => {
    setActiveTask(null);
    // Refresh the page to show updated data
    window.location.reload();
  };

  const handleSkipSetup = () => {
    setShowSetup(false);
  };

  const handleTaskAction = (taskId: string, method?: string) => {
    setActiveTask(taskId);
    setSelectedMethod(method);
  };

  // Calculate all events including birthdays for the events section
  // Memoize to prevent hydration mismatch from Date calculations
  const allEventsWithBirthdays = useMemo(() => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const result = [...events];

    // Add children birthdays
    children.forEach((child: any) => {
      if (child.birthday) {
        const birthday = new Date(child.birthday);
        const nextBirthday = new Date(currentYear, birthday.getMonth(), birthday.getDate());
        if (nextBirthday < now) {
          nextBirthday.setFullYear(currentYear + 1);
        }
        const displayAge = nextBirthday.getFullYear() - birthday.getFullYear();
        result.push({
          id: `birthday-${child.id}`,
          class_id: classData.id,
          name: `${child.name} (גיל ${displayAge})`,
          event_type: "birthday",
          icon: "🎂",
          allocated_budget: 0,
          spent_amount: 0,
          event_date: nextBirthday.toISOString(),
          created_at: child.created_at,
        });
      }
    });

    // Add staff birthdays
    staff.forEach((member: any) => {
      if (member.birthday) {
        // Parse the birthday (stored as YYYY-MM-DD or 2000-MM-DD)
        const [, month, day] = member.birthday.split("-").map(Number);
        const roleLabel = member.role === "teacher" ? "גננת" : "סייעת";

        // Create birthdays for this year and next year using date strings (avoids timezone issues)
        const thisYearDateStr = `${currentYear}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
        const nextYearDateStr = `${currentYear + 1}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

        // Add this year's birthday (even if passed, for display)
        result.push({
          id: `staff-birthday-${member.id}-${currentYear}`,
          class_id: classData.id,
          name: `${member.name} (${roleLabel})`,
          event_type: "staff-birthday",
          icon: "🎂",
          allocated_budget: 0,
          spent_amount: 0,
          event_date: thisYearDateStr,
          created_at: member.created_at,
        });

        // Add next year's birthday
        result.push({
          id: `staff-birthday-${member.id}-${currentYear + 1}`,
          class_id: classData.id,
          name: `${member.name} (${roleLabel})`,
          event_type: "staff-birthday",
          icon: "🎂",
          allocated_budget: 0,
          spent_amount: 0,
          event_date: nextYearDateStr,
          created_at: member.created_at,
        });
      }
    });

    return result;
  }, [events, children, staff, classData.id]);

  // If setup is complete or skipped, show regular dashboard (but still show success message if needed)
  if (!showSetup) {
    return (
      <>
        <DashboardContent {...props} />
        {/* Setup Complete Success Dialog */}
        <Dialog open={showSuccessMessage} onOpenChange={setShowSuccessMessage}>
          <DialogContent className="max-w-md text-center" dir="rtl">
            <DialogTitle className="sr-only">ההגדרות הושלמו בהצלחה</DialogTitle>
            <div className="py-6 space-y-4">
              <div className="flex justify-center">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-12 h-12 text-green-600" />
                </div>
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl font-bold text-gray-900">מעולה! ההגדרות הושלמו</h2>
                <p className="text-gray-600">
                  סיימתם להגדיר את הכיתה בהצלחה. עכשיו אפשר להתחיל לעבוד עם לוח הבקרה!
                </p>
              </div>
              <div className="pt-4">
                <Button
                  onClick={() => setShowSuccessMessage(false)}
                  className="w-full bg-green-600 hover:bg-green-700"
                >
                  יאללה, בואו נתחיל!
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </>
    );
  }

  // Show dashboard with setup checklist
  return (
    <>
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto p-4 md:p-6 lg:p-8 space-y-6" dir="rtl">
          {/* Class Header */}
          <div className="mb-4">
            <h1 className="text-4xl font-extrabold text-[#222222] mb-2">
              {classData.name}
            </h1>
            <p className="text-lg text-gray-600">
              {classData.school_name} • {classData.city} • שנת {classData.year}
            </p>
          </div>

          {/* Navigation Bar */}
          <ClassNavigationBar
            activeSection={activeSection}
            onSectionChange={setActiveSection}
          />

          {/* Active Section Content - Shows BELOW the navigation bar */}
          {activeSection && (
            <div className="bg-white rounded-2xl border-2 border-blue-300 shadow-xl p-6 relative animate-slide-down">
              {/* Close Button */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setActiveSection(null)}
                className="absolute top-4 left-4 rounded-full z-10"
              >
                <X className="h-5 w-5" />
              </Button>

              {/* Section Content */}
              <div>
                {activeSection === "budget" && (
                  <BudgetHubWrapper
                    classId={classData.id}
                    budgetMetrics={budgetMetrics}
                    events={events}
                    children={children.map((c: any) => ({
                      id: c.id,
                      name: c.name,
                      parents: childParents
                        .filter((cp: any) => cp.child_id === c.id)
                        .map((cp: any) => ({
                          name: cp.parents?.name || "",
                          phone: cp.parents?.phone || null
                        }))
                    }))}
                    paymentRounds={paymentRounds}
                    expenses={expenses}
                    className="border-0 shadow-none"
                  />
                )}

                {activeSection === "directory" && (
                  <ClassDirectoryCard
                    classId={classData.id}
                    children={children}
                    parents={parents}
                    staff={staff}
                    childParents={childParents}
                    isAdmin={true}
                    className="border-0 shadow-none"
                    onInviteParents={() => setActiveTask("invite_parents")}
                  />
                )}

                {activeSection === "events" && (
                  <EventsCalendarCard events={allEventsWithBirthdays} hideHeader={true} />
                )}

                {activeSection === "gifts" && (
                  <GiftCatalogCard className="border-0 shadow-none" />
                )}
              </div>
            </div>
          )}

          {/* Setup Checklist */}
          <div className="mb-8">
            <SetupChecklist
              classId={classData.id}
              estimatedChildren={estimatedChildren}
              estimatedStaff={estimatedStaff}
              currentStaffCount={staff.length}
              onTaskComplete={handleTaskComplete}
              onTaskAction={handleTaskAction}
              onSkip={handleSkipSetup}
            />
          </div>
        </div>
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

      {/* Task Modals */}
      <Dialog open={activeTask === "upload_children"} onOpenChange={() => setActiveTask(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogTitle className="sr-only">העלאת רשימת ילדים והורים</DialogTitle>
          <ChildrenUploadTask
            classId={classData.id}
            estimatedChildren={estimatedChildren}
            onComplete={handleTaskComplete}
            onCancel={() => setActiveTask(null)}
            initialMethod={selectedMethod as "excel" | "manual" | undefined}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={activeTask === "add_staff"} onOpenChange={() => setActiveTask(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogTitle className="sr-only">הוספת פרטי צוות</DialogTitle>
          <StaffAdditionTask
            classId={classData.id}
            estimatedStaff={estimatedStaff}
            existingStaff={staff}
            onComplete={handleTaskComplete}
            onCancel={() => setActiveTask(null)}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={activeTask === "setup_budget"} onOpenChange={() => setActiveTask(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogTitle className="sr-only">הגדרת תקציב ואירועים</DialogTitle>
          <BudgetSetupTask
            classId={classData.id}
            estimatedChildren={estimatedChildren}
            onComplete={handleTaskComplete}
            onCancel={() => setActiveTask(null)}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={activeTask === "parent_form_links"} onOpenChange={() => setActiveTask(null)}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogTitle className="sr-only">שליחת קישורים להורים למילוי פרטים</DialogTitle>
          <ParentFormLinksTask
            classId={classData.id}
            className={classData.name}
            onComplete={handleTaskComplete}
            onCancel={() => setActiveTask(null)}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={activeTask === "invite_parents"} onOpenChange={() => setActiveTask(null)}>
        <DialogContent className="max-w-xl">
          <DialogTitle className="sr-only">הזמנת הורים לועד</DialogTitle>
          <InviteParentsTask
            classId={classData.id}
            className={classData.name}
            onComplete={handleTaskComplete}
            onCancel={() => setActiveTask(null)}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={activeTask === "request_payment"} onOpenChange={() => setActiveTask(null)}>
        <DialogContent className="max-w-xl">
          <DialogTitle className="sr-only">שליחת בקשת תשלום</DialogTitle>
          <PaymentRequestTask
            classId={classData.id}
            className={classData.name}
            amountPerChild={classData.budget_amount || 200}
            onComplete={handleTaskComplete}
            onCancel={() => setActiveTask(null)}
          />
        </DialogContent>
      </Dialog>

      {/* Setup Complete Success Dialog */}
      <Dialog open={showSuccessMessage} onOpenChange={setShowSuccessMessage}>
        <DialogContent className="max-w-md text-center" dir="rtl">
          <DialogTitle className="sr-only">ההגדרות הושלמו בהצלחה</DialogTitle>
          <div className="py-6 space-y-4">
            <div className="flex justify-center">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="w-12 h-12 text-green-600" />
              </div>
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-gray-900">מעולה! ההגדרות הושלמו</h2>
              <p className="text-gray-600">
                סיימתם להגדיר את הכיתה בהצלחה. עכשיו אפשר להתחיל לעבוד עם לוח הבקרה!
              </p>
            </div>
            <div className="pt-4">
              <Button
                onClick={() => setShowSuccessMessage(false)}
                className="w-full bg-green-600 hover:bg-green-700"
              >
                יאללה, בואו נתחיל!
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
