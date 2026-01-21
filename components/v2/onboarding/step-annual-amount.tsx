"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Wallet, Calculator, ArrowRight } from "lucide-react";

export type AnnualAmountData = {
  amountPerChild: number;
};

type StepAnnualAmountProps = {
  data: AnnualAmountData;
  estimatedChildren: number;
  onChange: (data: AnnualAmountData) => void;
  onNext: () => void;
  onBack: () => void;
};

export function StepAnnualAmount({
  data,
  estimatedChildren,
  onChange,
  onNext,
  onBack,
}: StepAnnualAmountProps) {
  const [error, setError] = useState<string | null>(null);

  const totalBudget = (data.amountPerChild || 0) * estimatedChildren;

  const handleNext = () => {
    if (!data.amountPerChild || data.amountPerChild < 1) {
      setError("נא להזין סכום לילד");
      return;
    }
    setError(null);
    onNext();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="w-16 h-16 rounded-2xl bg-brand mx-auto mb-4 flex items-center justify-center">
          <Wallet className="h-8 w-8 text-brand-foreground" />
        </div>
        <h1 className="text-2xl font-bold text-foreground">כמה לאסוף לילד לשנה?</h1>
        <p className="text-muted-foreground mt-2">קבעו את הסכום השנתי לכל ילד</p>
      </div>

      {/* Amount Input */}
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="amountPerChild" className="text-sm font-semibold text-foreground">
            סכום לילד (₪)
          </Label>
          <div className="relative">
            <Input
              id="amountPerChild"
              type="number"
              min="1"
              placeholder="לדוגמה: 200"
              value={data.amountPerChild || ""}
              onChange={(e) => {
                onChange({ amountPerChild: parseInt(e.target.value) || 0 });
                setError(null);
              }}
              className={cn(
                "h-14 rounded-xl border-2 text-lg font-bold text-center transition-colors",
                error ? "border-destructive" : "border-border focus:border-brand"
              )}
            />
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg font-bold text-muted-foreground">
              ₪
            </span>
          </div>
          {error && <p className="text-sm text-destructive text-center">{error}</p>}
        </div>

        {/* Budget Calculation Display */}
        <div className="bg-gradient-to-br from-brand/10 to-info/10 rounded-2xl p-6 border-2 border-brand/20">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Calculator className="h-5 w-5 text-brand" />
            <span className="text-sm font-semibold text-foreground">חישוב תקציב</span>
          </div>

          <div className="flex items-center justify-center gap-3 text-lg">
            <span className="font-bold text-foreground">₪{data.amountPerChild || 0}</span>
            <span className="text-muted-foreground">×</span>
            <span className="font-bold text-foreground">{estimatedChildren}</span>
            <span className="text-muted-foreground">ילדים</span>
            <span className="text-muted-foreground">=</span>
          </div>

          <div className="text-center mt-4">
            <span className="text-3xl font-bold text-brand">
              ₪{totalBudget.toLocaleString()}
            </span>
            <p className="text-sm text-muted-foreground mt-1">תקציב שנתי צפוי</p>
          </div>
        </div>

      </div>

      {/* Navigation Buttons */}
      <div className="flex gap-3">
        <Button
          variant="outline"
          onClick={onBack}
          className="flex-1 h-12 rounded-xl border-2 gap-2"
        >
          <ArrowRight className="h-4 w-4" />
          חזרה
        </Button>
        <Button
          onClick={handleNext}
          className="flex-1 h-12 rounded-xl bg-brand hover:bg-brand-hover text-brand-foreground font-bold shadow-lg transition-all"
        >
          המשך
        </Button>
      </div>
    </div>
  );
}
