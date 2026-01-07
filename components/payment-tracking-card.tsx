"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Wallet, TrendingUp, Users, DollarSign } from "lucide-react";

type Payment = {
  id: string;
  parent_id: string;
  amount: number;
  payment_date: string;
  status: "pending" | "completed" | "failed" | "refunded";
};

type Parent = {
  id: string;
  name: string;
  phone: string | null;
};

type PaymentTrackingCardProps = {
  payments: Payment[];
  parents: Parent[];
  expectedPaymentPerParent: number;
  className?: string;
};

export function PaymentTrackingCard({
  payments,
  parents,
  expectedPaymentPerParent,
  className,
}: PaymentTrackingCardProps) {
  // Calculate payment statistics
  const completedPayments = payments.filter((p) => p.status === "completed");
  const uniqueParentsWhoPaid = new Set(completedPayments.map((p) => p.parent_id));
  const parentsPaidCount = uniqueParentsWhoPaid.size;
  const totalParents = parents.length;
  const paymentPercentage = totalParents > 0 ? Math.round((parentsPaidCount / totalParents) * 100) : 0;

  const totalCollected = completedPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
  const expectedTotal = totalParents * expectedPaymentPerParent;
  const amountPercentage = expectedTotal > 0 ? Math.round((totalCollected / expectedTotal) * 100) : 0;

  // Determine color based on percentage
  const getProgressColor = (percentage: number) => {
    if (percentage >= 80) return "bg-green-500";
    if (percentage >= 50) return "bg-yellow-500";
    return "bg-red-500";
  };

  const getStatusBadge = (percentage: number) => {
    if (percentage >= 80) return { variant: "default" as const, text: "במצב טוב", color: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300" };
    if (percentage >= 50) return { variant: "secondary" as const, text: "דורש תשומת לב", color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300" };
    return { variant: "destructive" as const, text: "דורש מעקב", color: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300" };
  };

  const status = getStatusBadge(paymentPercentage);

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-gradient-to-br from-green-500 to-emerald-600">
              <Wallet className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-lg">מעקב תשלומים</CardTitle>
              <CardDescription>סטטוס תשלומי הורים</CardDescription>
            </div>
          </div>
          <Badge className={status.color}>{status.text}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Main Statistics Grid */}
        <div className="grid grid-cols-2 gap-4">
          {/* Parents Paid */}
          <div className="bg-gradient-to-br from-purple-500/10 to-purple-500/20 dark:from-purple-500/20 dark:to-purple-500/30 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Users className="h-4 w-4 text-purple-600 dark:text-purple-400" />
              <span className="text-sm text-purple-700 dark:text-purple-300">הורים ששילמו</span>
            </div>
            <div className="text-2xl font-bold text-purple-900 dark:text-purple-100">
              {parentsPaidCount}/{totalParents}
            </div>
            <div className="text-xs text-purple-600 dark:text-purple-400 mt-1">{paymentPercentage}% מהכיתה</div>
          </div>

          {/* Amount Collected */}
          <div className="bg-gradient-to-br from-green-500/10 to-green-500/20 dark:from-green-500/20 dark:to-green-500/30 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="h-4 w-4 text-green-600 dark:text-green-400" />
              <span className="text-sm text-green-700 dark:text-green-300">סכום שנאסף</span>
            </div>
            <div className="text-2xl font-bold text-green-900 dark:text-green-100">
              ₪{totalCollected.toLocaleString()}
            </div>
            <div className="text-xs text-green-600 dark:text-green-400 mt-1">
              מתוך ₪{expectedTotal.toLocaleString()} ({amountPercentage}%)
            </div>
          </div>
        </div>

        {/* Progress Bar - Parents Who Paid */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">התקדמות תשלומים</span>
            <span className="font-semibold">{paymentPercentage}%</span>
          </div>
          <div className="w-full bg-muted rounded-full h-3 overflow-hidden">
            <div
              className={`h-full transition-all duration-500 ${getProgressColor(paymentPercentage)}`}
              style={{ width: `${paymentPercentage}%` }}
            />
          </div>
        </div>

        {/* Amount Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">סכום שנאסף</span>
            <span className="font-semibold">{amountPercentage}%</span>
          </div>
          <div className="w-full bg-muted rounded-full h-3 overflow-hidden">
            <div
              className={`h-full transition-all duration-500 ${getProgressColor(amountPercentage)}`}
              style={{ width: `${amountPercentage}%` }}
            />
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-2 pt-2 border-t">
          <div className="text-center">
            <div className="text-xs text-muted-foreground">תשלום לכל הורה</div>
            <div className="text-lg font-bold text-foreground">₪{expectedPaymentPerParent}</div>
          </div>
          <div className="text-center border-x">
            <div className="text-xs text-muted-foreground">ממוצע ששולם</div>
            <div className="text-lg font-bold text-foreground">
              ₪{parentsPaidCount > 0 ? Math.round(totalCollected / parentsPaidCount) : 0}
            </div>
          </div>
          <div className="text-center">
            <div className="text-xs text-muted-foreground">נותר לאסוף</div>
            <div className="text-lg font-bold text-destructive">
              ₪{Math.max(0, expectedTotal - totalCollected).toLocaleString()}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
