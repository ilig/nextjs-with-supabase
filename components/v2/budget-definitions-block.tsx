"use client";

import { useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import {
  Wallet,
  Users,
  UserCog,
  ChevronDown,
  Loader2,
  AlertCircle,
  Check,
  X,
} from "lucide-react";
import { updateClassBudgetSettings } from "@/app/actions/budget";

type BudgetDefinitionsBlockProps = {
  classId: string;
  amountPerChild: number;
  estimatedChildren: number;
  estimatedStaff: number;
  totalBudget: number;
  allocatedBudget: number;
  onBudgetChange?: () => void;
};

export function BudgetDefinitionsBlock({
  classId,
  amountPerChild: initialAmountPerChild,
  estimatedChildren: initialEstimatedChildren,
  estimatedStaff: initialEstimatedStaff,
  totalBudget,
  allocatedBudget,
  onBudgetChange,
}: BudgetDefinitionsBlockProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isExpanded, setIsExpanded] = useState(false);

  // Form state
  const [amountPerChild, setAmountPerChild] = useState(initialAmountPerChild);
  const [estimatedChildren, setEstimatedChildren] = useState(initialEstimatedChildren);
  const [estimatedStaff, setEstimatedStaff] = useState(initialEstimatedStaff);

  // Validation state
  const [validationError, setValidationError] = useState<string | null>(null);

  // Reset form when props change (e.g., after save)
  useEffect(() => {
    if (!isExpanded) {
      setAmountPerChild(initialAmountPerChild);
      setEstimatedChildren(initialEstimatedChildren);
      setEstimatedStaff(initialEstimatedStaff);
      setValidationError(null);
    }
  }, [initialAmountPerChild, initialEstimatedChildren, initialEstimatedStaff, isExpanded]);

  // Calculate new total based on form values
  const newTotalBudget = amountPerChild * estimatedChildren;
  const hasChanges =
    amountPerChild !== initialAmountPerChild ||
    estimatedChildren !== initialEstimatedChildren ||
    estimatedStaff !== initialEstimatedStaff;

  // Check if new budget would be less than allocated
  const wouldBeUnderAllocated = newTotalBudget < allocatedBudget;

  // Handle expand/collapse
  const handleToggle = () => {
    if (isExpanded) {
      // Reset form when closing without saving
      setAmountPerChild(initialAmountPerChild);
      setEstimatedChildren(initialEstimatedChildren);
      setEstimatedStaff(initialEstimatedStaff);
      setValidationError(null);
    }
    setIsExpanded(!isExpanded);
  };

  // Handle save
  const handleSave = () => {
    // Validate: new budget must be >= allocated budget
    if (newTotalBudget < allocatedBudget) {
      setValidationError(
        `לא ניתן לשמור - סכום ההקצאות לאירועים (₪${allocatedBudget.toLocaleString()}) גבוה מהתקציב החדש (₪${newTotalBudget.toLocaleString()})`
      );
      return;
    }

    setValidationError(null);

    startTransition(async () => {
      await updateClassBudgetSettings({
        classId,
        amountPerChild,
        estimatedChildren,
        estimatedStaff,
        totalBudget: newTotalBudget,
      });

      router.refresh();
      onBudgetChange?.();
      setIsExpanded(false);
    });
  };

  // Handle cancel
  const handleCancel = () => {
    setAmountPerChild(initialAmountPerChild);
    setEstimatedChildren(initialEstimatedChildren);
    setEstimatedStaff(initialEstimatedStaff);
    setValidationError(null);
    setIsExpanded(false);
  };

  return (
    <div
      className={cn(
        "bg-card rounded-2xl border-2 shadow-sm transition-all overflow-hidden",
        isExpanded ? "border-brand" : "border-border hover:border-brand/50"
      )}
    >
      {/* Collapsed Header - Always visible */}
      <button
        onClick={handleToggle}
        className="w-full p-4 flex items-center justify-between text-right"
        disabled={isPending}
      >
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-brand/10">
            <Wallet className="h-5 w-5 text-brand" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">הגדרות תקציב</h3>
            <p className="text-sm text-muted-foreground">
              {initialEstimatedChildren} ילדים · {initialEstimatedStaff} צוות · ₪{initialAmountPerChild} לילד
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-left">
            <p className="text-xs text-muted-foreground">תקציב כולל</p>
            <p className="text-lg font-bold text-foreground">₪{totalBudget.toLocaleString()}</p>
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
          {/* Input Fields */}
          <div className="grid grid-cols-3 gap-3">
            {/* Amount per child */}
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground flex items-center gap-1">
                <Wallet className="h-3 w-3" />
                סכום לילד (₪)
              </Label>
              <Input
                type="number"
                min="0"
                value={amountPerChild || ""}
                onChange={(e) => {
                  setAmountPerChild(parseInt(e.target.value) || 0);
                  setValidationError(null);
                }}
                className="h-10 rounded-lg text-center"
                disabled={isPending}
              />
            </div>

            {/* Estimated children */}
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground flex items-center gap-1">
                <Users className="h-3 w-3" />
                מספר ילדים
              </Label>
              <Input
                type="number"
                min="1"
                value={estimatedChildren || ""}
                onChange={(e) => {
                  setEstimatedChildren(parseInt(e.target.value) || 0);
                  setValidationError(null);
                }}
                className="h-10 rounded-lg text-center"
                disabled={isPending}
              />
            </div>

            {/* Estimated staff */}
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground flex items-center gap-1">
                <UserCog className="h-3 w-3" />
                מספר צוות
              </Label>
              <Input
                type="number"
                min="0"
                value={estimatedStaff || ""}
                onChange={(e) => {
                  setEstimatedStaff(parseInt(e.target.value) || 0);
                  setValidationError(null);
                }}
                className="h-10 rounded-lg text-center"
                disabled={isPending}
              />
            </div>
          </div>

          {/* Live Preview */}
          <div className="bg-muted/50 rounded-xl p-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">תקציב חדש:</span>
              <span className="text-lg font-bold text-foreground">
                ₪{newTotalBudget.toLocaleString()}
              </span>
            </div>

            {/* Show warning if under-allocated */}
            {wouldBeUnderAllocated && (
              <div className="flex items-center gap-2 text-sm text-destructive">
                <AlertCircle className="h-4 w-4" />
                <span>מוקצה כרגע: ₪{allocatedBudget.toLocaleString()}</span>
              </div>
            )}

            {/* Calculation breakdown */}
            <p className="text-xs text-muted-foreground">
              ₪{amountPerChild} × {estimatedChildren} ילדים = ₪{newTotalBudget.toLocaleString()}
            </p>
          </div>

          {/* Validation Error */}
          {validationError && (
            <div className="flex items-start gap-2 p-3 bg-destructive/10 rounded-xl border border-destructive/20">
              <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
              <p className="text-sm text-destructive">{validationError}</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            <Button
              variant="outline"
              onClick={handleCancel}
              className="flex-1 rounded-xl"
              disabled={isPending}
            >
              <X className="h-4 w-4 ml-2" />
              ביטול
            </Button>
            <Button
              onClick={handleSave}
              className="flex-1 rounded-xl bg-brand hover:bg-brand/90 gap-2"
              disabled={isPending || !hasChanges}
            >
              {isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Check className="h-4 w-4" />
              )}
              שמור
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
