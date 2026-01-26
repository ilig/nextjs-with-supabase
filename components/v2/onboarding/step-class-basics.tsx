"use client";

import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { filterSettlements } from "@/lib/data/settlements";
import { cn } from "@/lib/utils";
import { School, MapPin, Users, UserCog, Info } from "lucide-react";

export type ClassBasicsData = {
  className: string;
  institutionName: string;
  settlement: string;
  estimatedChildren: number;
  estimatedStaff: number;
};

type StepClassBasicsProps = {
  data: ClassBasicsData;
  onChange: (data: ClassBasicsData) => void;
  onNext: () => void;
};

export function StepClassBasics({ data, onChange, onNext }: StepClassBasicsProps) {
  const [settlementSuggestions, setSettlementSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof ClassBasicsData, string>>>({});
  const suggestionRef = useRef<HTMLDivElement>(null);

  // Handle settlement search
  const handleSettlementChange = (value: string) => {
    onChange({ ...data, settlement: value });
    const suggestions = filterSettlements(value);
    setSettlementSuggestions(suggestions);
    setShowSuggestions(suggestions.length > 0);
  };

  // Select a settlement from suggestions
  const selectSettlement = (settlement: string) => {
    onChange({ ...data, settlement });
    setShowSuggestions(false);
    setSettlementSuggestions([]);
  };

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (suggestionRef.current && !suggestionRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Validate and proceed
  const handleNext = () => {
    const newErrors: Partial<Record<keyof ClassBasicsData, string>> = {};

    if (!data.className.trim()) {
      newErrors.className = "נא להזין שם כיתה";
    }
    if (!data.institutionName.trim()) {
      newErrors.institutionName = "נא להזין שם מוסד";
    }
    if (!data.settlement.trim()) {
      newErrors.settlement = "נא לבחור יישוב";
    }
    if (!data.estimatedChildren || data.estimatedChildren < 1) {
      newErrors.estimatedChildren = "נא להזין מספר ילדים";
    }
    if (!data.estimatedStaff || data.estimatedStaff < 1) {
      newErrors.estimatedStaff = "נא להזין מספר אנשי צוות";
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length === 0) {
      onNext();
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="bg-brand-muted rounded-full p-4 w-fit mx-auto mb-4">
          <School className="h-5 w-5 text-brand flex-shrink-0" />
        </div>
        <h1 className="text-2xl font-bold text-foreground">פרטי הכיתה</h1>
        <p className="text-sm text-muted-foreground mt-2">ספרו לנו על הכיתה שלכם</p>
        <div className="flex items-center justify-center gap-1.5 mt-3 bg-muted/50 px-3 py-1.5 rounded-full w-fit mx-auto">
          <Info className="h-3.5 w-3.5 text-muted-foreground" />
          <p className="text-xs text-muted-foreground">לא בטוחים? אפשר להוסיף ולשנות הכל אח"כ</p>
        </div>
      </div>

      {/* Form Fields */}
      <div className="space-y-5">
        {/* Class Name */}
        <div className="space-y-2">
          <Label htmlFor="className" className="text-sm font-semibold text-foreground">
            שם הכיתה
          </Label>
          <Input
            id="className"
            type="text"
            placeholder="לדוגמה: כיתה א׳2"
            value={data.className}
            onChange={(e) => onChange({ ...data, className: e.target.value })}
            className={cn(
              "h-12 rounded-xl border-2 transition-colors",
              errors.className ? "border-destructive" : "border-border focus:border-brand"
            )}
          />
          {errors.className && (
            <p className="text-sm text-destructive">{errors.className}</p>
          )}
        </div>

        {/* Institution Name */}
        <div className="space-y-2">
          <Label htmlFor="institutionName" className="text-sm font-semibold text-foreground">
            שם המוסד
          </Label>
          <Input
            id="institutionName"
            type="text"
            placeholder="לדוגמה: בית ספר שדות"
            value={data.institutionName}
            onChange={(e) => onChange({ ...data, institutionName: e.target.value })}
            className={cn(
              "h-12 rounded-xl border-2 transition-colors",
              errors.institutionName ? "border-destructive" : "border-border focus:border-brand"
            )}
          />
          {errors.institutionName && (
            <p className="text-sm text-destructive">{errors.institutionName}</p>
          )}
        </div>

        {/* Settlement with Autocomplete */}
        <div className="space-y-2 relative" ref={suggestionRef}>
          <Label htmlFor="settlement" className="text-sm font-semibold text-foreground flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            יישוב
          </Label>
          <Input
            id="settlement"
            type="text"
            placeholder="התחילו להקליד שם יישוב..."
            value={data.settlement}
            onChange={(e) => handleSettlementChange(e.target.value)}
            onFocus={() => {
              if (settlementSuggestions.length > 0) {
                setShowSuggestions(true);
              }
            }}
            autoComplete="off"
            className={cn(
              "h-12 rounded-xl border-2 transition-colors",
              errors.settlement ? "border-destructive" : "border-border focus:border-brand"
            )}
          />
          {errors.settlement && (
            <p className="text-sm text-destructive">{errors.settlement}</p>
          )}

          {/* Suggestions Dropdown */}
          {showSuggestions && settlementSuggestions.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-card border-2 border-border rounded-xl shadow-lg z-50 overflow-hidden">
              {settlementSuggestions.map((settlement, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => selectSettlement(settlement)}
                  className="w-full px-4 py-3 text-right hover:bg-muted transition-colors text-foreground"
                >
                  {settlement}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Kids and Staff Count - Side by Side */}
        <div className="grid grid-cols-2 gap-4">
          {/* Number of Kids */}
          <div className="space-y-2">
            <Label htmlFor="estimatedChildren" className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Users className="h-4 w-4" />
              מספר ילדים
            </Label>
            <Input
              id="estimatedChildren"
              type="number"
              min="1"
              placeholder="לדוגמה: 30"
              value={data.estimatedChildren || ""}
              onChange={(e) => onChange({ ...data, estimatedChildren: parseInt(e.target.value) || 0 })}
              className={cn(
                "h-12 rounded-xl border-2 transition-colors",
                errors.estimatedChildren ? "border-destructive" : "border-border focus:border-brand"
              )}
            />
            {errors.estimatedChildren && (
              <p className="text-sm text-destructive">{errors.estimatedChildren}</p>
            )}
          </div>

          {/* Number of Staff */}
          <div className="space-y-2">
            <Label htmlFor="estimatedStaff" className="text-sm font-semibold text-foreground flex items-center gap-2">
              <UserCog className="h-4 w-4" />
              אנשי צוות
            </Label>
            <Input
              id="estimatedStaff"
              type="number"
              min="1"
              placeholder="לדוגמה: 3"
              value={data.estimatedStaff || ""}
              onChange={(e) => onChange({ ...data, estimatedStaff: parseInt(e.target.value) || 0 })}
              className={cn(
                "h-12 rounded-xl border-2 transition-colors",
                errors.estimatedStaff ? "border-destructive" : "border-border focus:border-brand"
              )}
            />
            {errors.estimatedStaff && (
              <p className="text-sm text-destructive">{errors.estimatedStaff}</p>
            )}
          </div>
        </div>
      </div>

      {/* Next Button */}
      <Button
        onClick={handleNext}
        className="w-full h-12 rounded-xl bg-brand hover:bg-brand-hover text-brand-foreground font-bold shadow-lg transition-all"
      >
        המשיכו
      </Button>
    </div>
  );
}
