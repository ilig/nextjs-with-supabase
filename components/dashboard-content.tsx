"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import {
  TrendingUp,
  TrendingDown,
  Users,
  Calendar,
  Wallet,
  Scale,
  Coins,
  UserCheck,
  Copy,
  Download,
  Plus,
  Mail,
  Phone
} from "lucide-react";
import { PaymentTrackingCard } from "@/components/payment-tracking-card";
import { EventsCalendarCard } from "@/components/events-calendar-card";
import { ClassDirectoryCard } from "@/components/class-directory-card";

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
};

export function DashboardContent({
  classData,
  classes,
  children,
  staff,
  events,
  childParents,
  classMembers,
  parents,
  payments,
  budgetMetrics,
}: DashboardContentProps) {
  const [copiedInvite, setCopiedInvite] = useState(false);

  const copyInviteLink = () => {
    const inviteLink = `${window.location.origin}/join/${classData.invite_code}`;
    navigator.clipboard.writeText(inviteLink);
    setCopiedInvite(true);
    setTimeout(() => setCopiedInvite(false), 2000);
  };

  // Convert children birthdays into event objects
  const birthdayEvents: Event[] = children
    .filter((child) => child.birthday)
    .map((child) => {
      const birthday = new Date(child.birthday!);
      const currentYear = new Date().getFullYear();
      const nextBirthday = new Date(currentYear, birthday.getMonth(), birthday.getDate());

      // If birthday already passed this year, use next year
      if (nextBirthday < new Date()) {
        nextBirthday.setFullYear(currentYear + 1);
      }

      // Calculate age
      const age = currentYear - birthday.getFullYear();
      const displayAge = nextBirthday.getFullYear() - birthday.getFullYear();

      return {
        id: `birthday-${child.id}`,
        class_id: classData.id,
        name: `${child.name} (גיל ${displayAge})`,
        event_type: "birthday",
        icon: "🎂",
        allocated_budget: 0,
        spent_amount: 0,
        event_date: nextBirthday.toISOString(),
        created_at: child.created_at,
      };
    });

  // Merge birthday events with regular events
  const allEvents = [...events, ...birthdayEvents];

  // Calculate upcoming events (within next 30 days) - including birthdays
  const upcomingEvents = allEvents.filter((event) => {
    if (!event.event_date) return false;
    const eventDate = new Date(event.event_date);
    const today = new Date();
    const thirtyDaysFromNow = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);
    return eventDate >= today && eventDate <= thirtyDaysFromNow;
  });

  // Calculate budget health
  const budgetHealthPercentage = (budgetMetrics.allocated / budgetMetrics.total) * 100;
  const isOverBudget = budgetMetrics.remaining < 0;


  return (
    <div className="flex-1 w-full mx-auto px-4 py-8">
      {/* Header Section */}
      <div className="max-w-7xl mx-auto mb-8">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h1 className="text-4xl font-extrabold text-[#222222] mb-2">
              {classData.name}
            </h1>
            <p className="text-lg text-gray-600">
              {classData.school_name} • {classData.city} • שנת {classData.year}
            </p>
          </div>
        </div>

        {/* Budget Warning */}
        {isOverBudget && (
          <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-4 mb-6">
            <p className="text-red-700 font-semibold flex items-center gap-2">
              <TrendingDown className="h-5 w-5" />
              שים לב! התקציב המוקצה חורג מהתקציב הכולל ב-₪{Math.abs(budgetMetrics.remaining).toLocaleString()}
            </p>
          </div>
        )}
      </div>

      {/* Quick Stats Cards */}
      <div className="max-w-7xl mx-auto mb-8">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {/* Budget Used / Total */}
          <Card className="bg-gradient-to-br from-[#E9D5FF] to-[#DDD6FE] border-0 shadow-lg">
            <CardHeader className="pb-2">
              <CardDescription className="text-gray-700 font-medium">תקציב</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Wallet className="h-5 w-5 text-[#A78BFA]" />
                <p className="text-2xl font-extrabold text-[#222222]" dir="ltr">
                  ₪{budgetMetrics.spent.toLocaleString()} / ₪{budgetMetrics.total.toLocaleString()}
                </p>
              </div>
              <p className="text-xs text-gray-600 mt-1">
                {((budgetMetrics.spent / budgetMetrics.total) * 100).toFixed(0)}% נוצל
              </p>
            </CardContent>
          </Card>

          {/* Children Count */}
          <Card className="bg-gradient-to-br from-[#FED7AA] to-[#FDBA74] border-0 shadow-lg">
            <CardHeader className="pb-2">
              <CardDescription className="text-gray-700 font-medium">ילדים</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-orange-600" />
                <p className="text-2xl font-extrabold text-[#222222]">
                  {children.length}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Staff Count */}
          <Card className="bg-gradient-to-br from-[#FDE68A] to-[#FCD34D] border-0 shadow-lg">
            <CardHeader className="pb-2">
              <CardDescription className="text-gray-700 font-medium">צוות</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <UserCheck className="h-5 w-5 text-yellow-600" />
                <p className="text-2xl font-extrabold text-[#222222]">
                  {staff.length}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Upcoming Events */}
          <Card className="bg-gradient-to-br from-[#FBE4FF] to-[#F5D0FE] border-0 shadow-lg">
            <CardHeader className="pb-2">
              <CardDescription className="text-gray-700 font-medium">אירועים קרובים</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-fuchsia-600" />
                <p className="text-2xl font-extrabold text-[#222222]">
                  {upcomingEvents.length}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Main Content - Two Column Layout */}
      <div className="max-w-7xl mx-auto grid lg:grid-cols-3 gap-6">
        {/* Left Column - Primary Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Collapsible Payment Tracking */}
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="payments" className="border-0">
              <Card className="shadow-xl rounded-3xl border-2 border-gray-100">
                <AccordionTrigger className="hover:no-underline px-6 pt-6 pb-6">
                  <CardHeader className="p-0 w-full">
                    <div className="flex items-center gap-2">
                      <div className="p-2 rounded-lg bg-gradient-to-br from-green-500 to-emerald-600">
                        <Coins className="h-5 w-5 text-white" />
                      </div>
                      <div className="text-right">
                        <CardTitle className="text-lg">מעקב תשלומים</CardTitle>
                        <CardDescription>מצב תשלומים והורים</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                </AccordionTrigger>
                <AccordionContent>
                  <CardContent className="pt-0">
                    <PaymentTrackingCard
                      payments={payments}
                      parents={parents}
                      expectedPaymentPerParent={classData.expected_payment_per_parent || classData.budget_amount || 0}
                    />
                  </CardContent>
                </AccordionContent>
              </Card>
            </AccordionItem>
          </Accordion>

          {/* Collapsible Events Calendar */}
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="events" className="border-0">
              <Card className="shadow-xl rounded-3xl border-2 border-gray-100">
                <AccordionTrigger className="hover:no-underline px-6 pt-6 pb-6">
                  <CardHeader className="p-0 w-full">
                    <div className="flex items-center gap-2">
                      <div className="p-2 rounded-lg bg-gradient-to-br from-pink-500 to-rose-600">
                        <Calendar className="h-5 w-5 text-white" />
                      </div>
                      <div className="text-right">
                        <CardTitle className="text-lg">אירועים קרובים</CardTitle>
                        <CardDescription>{upcomingEvents.length} אירועים בחודשיים הקרובים</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                </AccordionTrigger>
                <AccordionContent>
                  <CardContent className="pt-0">
                    <EventsCalendarCard events={allEvents} hideHeader={true} />
                  </CardContent>
                </AccordionContent>
              </Card>
            </AccordionItem>
          </Accordion>

          {/* Collapsible Class Directory */}
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="directory" className="border-0">
              <Card className="shadow-xl rounded-3xl border-2 border-gray-100">
                <AccordionTrigger className="hover:no-underline px-6 pt-6 pb-6">
                  <CardHeader className="p-0 w-full">
                    <div className="flex items-center gap-2">
                      <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-600">
                        <Users className="h-5 w-5 text-white" />
                      </div>
                      <div className="text-right">
                        <CardTitle className="text-lg">מדריך הכיתה</CardTitle>
                        <CardDescription>ילדים, הורים וצוות</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                </AccordionTrigger>
                <AccordionContent>
                  <CardContent className="pt-0">
                    <ClassDirectoryCard
                      classId={classData.id}
                      children={children}
                      parents={parents}
                      staff={staff}
                      childParents={childParents}
                      isAdmin={true}
                    />
                  </CardContent>
                </AccordionContent>
              </Card>
            </AccordionItem>
          </Accordion>

          {/* Collapsible Budget Breakdown */}
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="budget" className="border-0">
              <Card className="shadow-xl rounded-3xl border-2 border-gray-100">
                <AccordionTrigger className="hover:no-underline px-6 pt-6 pb-6">
                  <CardHeader className="p-0 w-full">
                    <div className="flex items-center gap-2">
                      <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500 to-blue-600">
                        <Wallet className="h-5 w-5 text-white" />
                      </div>
                      <div className="text-right">
                        <CardTitle className="text-lg">חלוקת תקציב לפי אירועים</CardTitle>
                        <CardDescription>התקציב המוקצה והמנוצל לכל אירוע</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                </AccordionTrigger>
                <AccordionContent>
                  <CardContent className="pt-4">
                    {events.length === 0 ? (
                      <div className="text-center py-12">
                        <Calendar className="h-16 w-16 mx-auto text-gray-300 mb-4" />
                        <p className="text-gray-500 mb-4">טרם נוספו אירועים</p>
                        <Button className="bg-[#A78BFA] hover:bg-[#9333EA] rounded-2xl">
                          <Plus className="ml-2 h-4 w-4" />
                          הוסף אירוע ראשון
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {events.map((event) => {
                          const spentPercentage = event.allocated_budget > 0
                            ? (event.spent_amount / event.allocated_budget) * 100
                            : 0;
                          const isOverspent = event.spent_amount > event.allocated_budget;

                          return (
                            <div key={event.id} className="border-2 border-gray-100 rounded-2xl p-4 hover:border-[#A78BFA] transition-colors">
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
                                <div className="text-left">
                                  <p className="text-sm text-gray-600">מנוצל</p>
                                  <p className={`text-lg font-bold ${isOverspent ? 'text-red-600' : 'text-[#A78BFA]'}`}>
                                    ₪{event.spent_amount.toLocaleString()}
                                  </p>
                                  <p className="text-xs text-gray-500">
                                    מתוך ₪{event.allocated_budget.toLocaleString()}
                                  </p>
                                </div>
                              </div>

                              {/* Progress Bar */}
                              <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                                <div
                                  className={`h-full rounded-full transition-all ${
                                    isOverspent ? 'bg-red-500' : 'bg-gradient-to-r from-[#A78BFA] to-[#60A5FA]'
                                  }`}
                                  style={{ width: `${Math.min(spentPercentage, 100)}%` }}
                                />
                              </div>
                              <p className="text-xs text-gray-500 mt-1">
                                {spentPercentage.toFixed(0)}% נוצל
                              </p>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </CardContent>
                </AccordionContent>
              </Card>
            </AccordionItem>
          </Accordion>
        </div>

        {/* Right Column - Quick Access */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <Card className="shadow-xl rounded-3xl border-2 border-gray-100">
            <CardHeader>
              <CardTitle className="text-xl font-extrabold text-[#222222]">
                פעולות מהירות
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button
                onClick={copyInviteLink}
                className="w-full bg-[#A78BFA] hover:bg-[#9333EA] rounded-2xl justify-start"
              >
                {copiedInvite ? (
                  <>
                    <Mail className="ml-2 h-4 w-4" />
                    הקישור הועתק!
                  </>
                ) : (
                  <>
                    <Copy className="ml-2 h-4 w-4" />
                    העתק קישור הזמנה
                  </>
                )}
              </Button>

              <Button
                variant="outline"
                className="w-full rounded-2xl justify-start border-2"
              >
                <Plus className="ml-2 h-4 w-4" />
                הוסף ילד חדש
              </Button>

              <Button
                variant="outline"
                className="w-full rounded-2xl justify-start border-2"
              >
                <Plus className="ml-2 h-4 w-4" />
                הוסף הוצאה
              </Button>

              <Button
                variant="outline"
                className="w-full rounded-2xl justify-start border-2"
              >
                <Download className="ml-2 h-4 w-4" />
                הורד רשימת ילדים
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
