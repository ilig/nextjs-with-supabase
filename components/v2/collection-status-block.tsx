"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import {
  ChevronDown,
  Check,
  XCircle,
  UserPlus,
  CircleDollarSign,
} from "lucide-react";

type Child = {
  id: string;
  name: string;
  payment_status: "paid" | "unpaid";
  payment_date?: string;
};

type CollectionStatusBlockProps = {
  totalBudget: number;
  collected: number;
  estimatedChildren: number;
  paidChildren: Child[];
  unpaidChildren: Child[];
  onOpenPaidChildrenList?: () => void;
  onOpenUnpaidChildrenList?: () => void;
  onOpenPaymentSheetInviteMode?: () => void;
};

export function CollectionStatusBlock({
  totalBudget,
  collected,
  estimatedChildren,
  paidChildren,
  unpaidChildren,
  onOpenPaidChildrenList,
  onOpenUnpaidChildrenList,
  onOpenPaymentSheetInviteMode,
}: CollectionStatusBlockProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Calculate metrics
  const registeredCount = paidChildren.length + unpaidChildren.length;
  const notRegisteredCount = Math.max(0, estimatedChildren - registeredCount);
  const collectionPercentage = totalBudget > 0 ? Math.round((collected / totalBudget) * 100) : 0;

  return (
    <div
      className={cn(
        "bg-card rounded-2xl border-2 shadow-sm transition-all overflow-hidden",
        isExpanded ? "border-brand" : "border-border hover:border-brand/50"
      )}
    >
      {/* Collapsed Header - Always visible */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-4 flex items-center justify-between text-right"
      >
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-brand/10">
            <CircleDollarSign className="h-5 w-5 text-brand" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">מצב גבייה</h3>
            <p className="text-sm text-muted-foreground">
              {paidChildren.length}/{estimatedChildren} שילמו
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-left">
            <p className="text-xs text-muted-foreground">נאספו</p>
            <p className="text-lg font-bold text-brand">
              ₪{collected.toLocaleString()}
              <span className="text-sm font-normal text-muted-foreground mr-1">
                ({collectionPercentage}%)
              </span>
            </p>
          </div>
          <ChevronDown
            className={cn(
              "h-5 w-5 text-muted-foreground transition-transform",
              isExpanded && "rotate-180"
            )}
          />
        </div>
      </button>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="px-4 pb-4 space-y-4 border-t border-border pt-4">
          {/* Progress bar */}
          <div className="bg-muted/50 rounded-xl p-3 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">התקדמות גבייה</span>
              <span className="font-medium">{collectionPercentage}%</span>
            </div>
            <div className="h-1.5 bg-background rounded-full overflow-hidden">
              <div
                className="h-full bg-brand rounded-full transition-all duration-500"
                style={{ width: `${collectionPercentage}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground text-center">
              נאספו ₪{collected.toLocaleString()} מתוך ₪{totalBudget.toLocaleString()}
            </p>
          </div>

          {/* 3 Status Blocks - Side by Side */}
          <div className="grid grid-cols-3 gap-2">
            {/* Paid Block - Clickable */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onOpenPaidChildrenList?.();
              }}
              disabled={paidChildren.length === 0}
              className={cn(
                "p-3 bg-success/10 rounded-xl border border-success/20 text-center transition-all",
                paidChildren.length > 0 && "hover:bg-success/20 hover:border-success/40 cursor-pointer"
              )}
            >
              <Check className="h-5 w-5 text-success mx-auto mb-1" />
              <p className="text-2xl font-bold text-success">{paidChildren.length}</p>
              <p className="text-xs text-success/80">שילמו</p>
            </button>

            {/* Unpaid Block - Clickable */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onOpenUnpaidChildrenList?.();
              }}
              disabled={unpaidChildren.length === 0}
              className={cn(
                "p-3 bg-orange-500/10 rounded-xl border border-orange-500/20 text-center transition-all",
                unpaidChildren.length > 0 && "hover:bg-orange-500/20 hover:border-orange-500/40 cursor-pointer"
              )}
            >
              <XCircle className="h-5 w-5 text-orange-500 mx-auto mb-1" />
              <p className="text-2xl font-bold text-orange-500">{unpaidChildren.length}</p>
              <p className="text-xs text-orange-500/80">נרשמו ולא שילמו</p>
            </button>

            {/* Not Registered Block - Clickable */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onOpenPaymentSheetInviteMode?.();
              }}
              disabled={notRegisteredCount === 0}
              className={cn(
                "p-3 bg-rose-500/10 rounded-xl border border-rose-500/20 text-center transition-all",
                notRegisteredCount > 0 && "hover:bg-rose-500/20 hover:border-rose-500/40 cursor-pointer"
              )}
            >
              <UserPlus className="h-5 w-5 text-rose-500 mx-auto mb-1" />
              <p className="text-2xl font-bold text-rose-500">{notRegisteredCount}</p>
              <p className="text-xs text-rose-500/80">לא נרשמו ולא שילמו</p>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
