"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { StepClassBasics, type ClassBasicsData } from "./step-class-basics";
import { StepAnnualAmount, type AnnualAmountData } from "./step-annual-amount";
import { StepBudgetAllocation, type BudgetAllocationData } from "./step-budget-allocation";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

type OnboardingStep = 1 | 2 | 3;

const STEP_TITLES = {
  1: "פרטי הכיתה",
  2: "סכום שנתי",
  3: "הקצאת תקציב",
};

export function OnboardingWizard() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<OnboardingStep>(1);
  const [highestVisitedStep, setHighestVisitedStep] = useState<OnboardingStep>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form data state
  const [classBasics, setClassBasics] = useState<ClassBasicsData>({
    className: "",
    institutionName: "",
    settlement: "",
    estimatedChildren: 0,
    estimatedStaff: 0,
  });

  const [annualAmount, setAnnualAmount] = useState<AnnualAmountData>({
    amountPerChild: 0,
  });

  const [budgetAllocation, setBudgetAllocation] = useState<BudgetAllocationData>({
    events: [],
  });

  // Calculate total budget
  const totalBudget = annualAmount.amountPerChild * classBasics.estimatedChildren;

  // Navigation handlers
  const goToStep = (step: OnboardingStep) => {
    // Only allow navigation to visited steps
    if (step <= highestVisitedStep) {
      setCurrentStep(step);
    }
  };

  const advanceToStep = (step: OnboardingStep) => {
    setCurrentStep(step);
    if (step > highestVisitedStep) {
      setHighestVisitedStep(step);
    }
  };

  // Submit all data
  const handleComplete = async () => {
    setIsSubmitting(true);
    setError(null);

    try {
      const supabase = createClient();

      // Get current user
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        throw new Error("לא מחובר למערכת");
      }

      // Create the class
      const { data: newClass, error: classError } = await supabase
        .from("classes")
        .insert({
          name: classBasics.className,
          school_name: classBasics.institutionName,
          city: classBasics.settlement,
          year: new Date().getFullYear().toString(),
          created_by: user.id,
          total_budget: totalBudget,
          budget_type: "per-child",
          budget_amount: annualAmount.amountPerChild,
          // V2 columns
          settlement: classBasics.settlement,
          institution_name: classBasics.institutionName,
          annual_amount_per_child: annualAmount.amountPerChild,
          estimated_children: classBasics.estimatedChildren,
          estimated_staff: classBasics.estimatedStaff,
          setup_complete: true,
        })
        .select()
        .single();

      if (classError) throw classError;

      // Add user as admin member
      const { error: memberError } = await supabase.from("class_members").insert({
        class_id: newClass.id,
        user_id: user.id,
        role: "admin",
      });

      if (memberError) throw memberError;

      // Create events from budget allocation
      const eventsToCreate = budgetAllocation.events
        .filter((e) => e.enabled)
        .map((event, index) => ({
          class_id: newClass.id,
          name: event.name,
          event_type: event.isCustom ? "custom" : event.eventId,
          allocated_budget:
            event.amountPerKid * classBasics.estimatedChildren +
            event.amountPerStaff * classBasics.estimatedStaff,
          // V2 columns
          amount_per_kid: event.amountPerKid,
          amount_per_staff: event.amountPerStaff,
          allocated_for_kids: event.amountPerKid * classBasics.estimatedChildren,
          allocated_for_staff: event.amountPerStaff * classBasics.estimatedStaff,
          kids_count: classBasics.estimatedChildren,
          staff_count: classBasics.estimatedStaff,
          sort_order: index + 1,
        }));

      if (eventsToCreate.length > 0) {
        const { error: eventsError } = await supabase
          .from("events")
          .insert(eventsToCreate);

        if (eventsError) throw eventsError;
      }

      // Redirect to dashboard - don't set isSubmitting to false on success
      // since we're navigating away
      router.push("/dashboard-v2");
      router.refresh();
    } catch (err: unknown) {
      // Supabase errors have message, code, details, hint properties
      const errorMessage =
        (err as { message?: string })?.message ||
        (err as Error)?.message ||
        JSON.stringify(err) ||
        "אירעה שגיאה, נסו שוב";
      console.error("Onboarding error:", errorMessage, err);
      setError(errorMessage);
      // Only reset submitting state on error
      setIsSubmitting(false);
    }
  };

  return (
    <div dir="rtl" className="h-screen bg-background flex flex-col overflow-hidden">
      {/* Progress Steps - Fixed at top */}
      <div className="flex-shrink-0 bg-card border-b-2 border-border px-4 py-4">
        <div className="max-w-md mx-auto">
          <div className="flex items-start">
            {[1, 2, 3].map((step) => {
              const isVisited = step <= highestVisitedStep;
              const isCurrent = step === currentStep;
              const hasConnector = step < 3;
              return (
                <div key={step} className={cn("flex items-center", hasConnector && "flex-1")}>
                  {/* Step column with circle and label */}
                  <div className="flex flex-col items-center">
                    <button
                      onClick={() => goToStep(step as OnboardingStep)}
                      disabled={!isVisited}
                      className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all",
                        isCurrent
                          ? "bg-brand text-brand-foreground"
                          : isVisited
                            ? "bg-brand/70 text-brand-foreground hover:bg-brand-hover cursor-pointer active:scale-95"
                            : "bg-muted text-muted-foreground cursor-not-allowed"
                      )}
                    >
                      {step}
                    </button>
                    <button
                      onClick={() => goToStep(step as OnboardingStep)}
                      disabled={!isVisited}
                      className={cn(
                        "text-xs mt-2 transition-colors whitespace-nowrap",
                        isCurrent
                          ? "text-brand font-medium"
                          : isVisited
                            ? "text-muted-foreground hover:text-brand cursor-pointer"
                            : "text-muted-foreground/50 cursor-not-allowed"
                      )}
                    >
                      {STEP_TITLES[step as OnboardingStep]}
                    </button>
                  </div>
                  {/* Connector line between steps */}
                  {hasConnector && (
                    <div
                      className={cn(
                        "flex-1 h-1 mx-2 rounded-full transition-colors self-start mt-3.5",
                        step < highestVisitedStep ? "bg-brand" : "bg-muted"
                      )}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Step Content - Scrollable area */}
      <div className="flex-1 overflow-auto flex flex-col">
        <div className="flex-1">
          {/* Steps 1 & 2 with padding */}
          {(currentStep === 1 || currentStep === 2 || isSubmitting || error) && (
            <div className="max-w-md mx-auto px-4 py-6">
              {error && (
                <div className="mb-4 p-4 bg-destructive/10 border-2 border-destructive/20 rounded-xl text-destructive text-center">
                  {error}
                </div>
              )}

              {isSubmitting ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <Loader2 className="h-12 w-12 text-brand animate-spin mb-4" />
                  <p className="text-lg font-semibold text-foreground">יוצרים את הכיתה...</p>
                  <p className="text-sm text-muted-foreground">רק עוד רגע</p>
                </div>
              ) : (
                <>
                  {currentStep === 1 && (
                    <StepClassBasics
                      data={classBasics}
                      onChange={setClassBasics}
                      onNext={() => advanceToStep(2)}
                    />
                  )}

                  {currentStep === 2 && (
                    <StepAnnualAmount
                      data={annualAmount}
                      estimatedChildren={classBasics.estimatedChildren}
                      onChange={setAnnualAmount}
                      onNext={() => advanceToStep(3)}
                      onBack={() => goToStep(1)}
                    />
                  )}
                </>
              )}
            </div>
          )}

          {/* Step 3 - inside scroll container for sticky to work */}
          {currentStep === 3 && !isSubmitting && (
            <StepBudgetAllocation
              data={budgetAllocation}
              estimatedChildren={classBasics.estimatedChildren}
              estimatedStaff={classBasics.estimatedStaff}
              totalBudget={totalBudget}
              onChange={setBudgetAllocation}
              onNext={handleComplete}
              onBack={() => goToStep(2)}
            />
          )}
        </div>

        {/* Footer */}
        <footer className="py-6 px-4 text-center text-xs text-muted-foreground border-t border-border mt-auto">
          <p>ClassEase © 2025 | נוצר על ידי הורים, בשביל הורים</p>
        </footer>
      </div>
    </div>
  );
}
