"use client";

import { Wallet, UserCheck, Users, Calendar } from "lucide-react";

type ClassStatsSummaryProps = {
  className?: string;
  budgetTotal: number;
  budgetSpent: number;
  parentsPaidCount: number;
  totalParents: number;
  childrenCount: number;
  staffCount: number;
  upcomingEventsCount: number;
};

export function ClassStatsSummary({
  className = "",
  budgetTotal,
  budgetSpent,
  parentsPaidCount,
  totalParents,
  childrenCount,
  staffCount,
  upcomingEventsCount,
}: ClassStatsSummaryProps) {
  const budgetPercentage = budgetTotal > 0 ? ((budgetSpent / budgetTotal) * 100).toFixed(0) : "0";

  return (
    <div className={`bg-gradient-to-br from-muted to-muted/50 rounded-2xl p-6 border-2 border-border shadow-lg ${className}`}>
      <div className="flex items-center justify-between gap-8">
        {/* Budget Snapshot */}
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500 to-blue-600">
            <Wallet className="h-6 w-6 text-white" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">תקציב</p>
            <p className="text-2xl font-bold text-foreground">₪{budgetTotal.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">{budgetPercentage}% נוצל</p>
          </div>
        </div>

        {/* Divider */}
        <div className="h-12 w-px bg-border"></div>

        {/* Payments Snapshot */}
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600">
            <UserCheck className="h-6 w-6 text-white" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">תשלומים</p>
            <p className="text-2xl font-bold text-foreground">{parentsPaidCount}/{totalParents}</p>
            <p className="text-xs text-muted-foreground">הורים שילמו</p>
          </div>
        </div>

        {/* Divider */}
        <div className="h-12 w-px bg-border"></div>

        {/* Children Snapshot */}
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-gradient-to-br from-orange-500 to-amber-600">
            <Users className="h-6 w-6 text-white" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">כיתה</p>
            <p className="text-2xl font-bold text-foreground">{childrenCount}</p>
            <p className="text-xs text-muted-foreground">ילדים • {staffCount} צוות</p>
          </div>
        </div>

        {/* Divider */}
        <div className="h-12 w-px bg-border"></div>

        {/* Events Snapshot */}
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-gradient-to-br from-pink-500 to-rose-600">
            <Calendar className="h-6 w-6 text-white" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">אירועים</p>
            <p className="text-2xl font-bold text-foreground">{upcomingEventsCount}</p>
            <p className="text-xs text-muted-foreground">בחודש הקרוב</p>
          </div>
        </div>
      </div>
    </div>
  );
}
