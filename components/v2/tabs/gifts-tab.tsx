"use client";

import { Gift } from "lucide-react";
import { cn } from "@/lib/utils";

type GiftsTabProps = {
  className?: string;
};

export function GiftsTab({ className }: GiftsTabProps) {
  return (
    <div className={cn("p-4 md:p-6 space-y-6", className)}>
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-3 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600">
          <Gift className="h-6 w-6 text-white" />
        </div>
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold text-foreground">קטלוג מתנות</h1>
          <span className="text-xs font-bold bg-accent-yellow text-accent-yellow-foreground px-2 py-1 rounded-full">
            בקרוב
          </span>
        </div>
      </div>

      {/* Coming soon placeholder */}
      <div className="bg-card rounded-2xl p-8 border-2 border-border shadow-sm text-center min-h-[300px] flex flex-col items-center justify-center">
        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-green-500/20 to-emerald-600/20 flex items-center justify-center mb-4">
          <Gift className="h-10 w-10 text-success" />
        </div>
        <h2 className="text-xl font-bold text-foreground mb-2">בקרוב!</h2>
        <p className="text-muted-foreground max-w-md">
          קטלוג מתנות עם שותפויות לספקים מקומיים, רעיונות למתנות לפי תקציב, והזמנה ישירה.
        </p>
      </div>
    </div>
  );
}
