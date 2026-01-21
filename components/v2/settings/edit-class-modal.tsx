"use client";

import { useState, useEffect, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Building2, MapPin } from "lucide-react";
import { filterSettlements } from "@/lib/data/settlements";
import { cn } from "@/lib/utils";

type EditClassModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  classData: {
    id: string;
    name: string;
    school_name: string;
    city: string;
  };
  onSave: (data: { name: string; school_name: string; city: string }) => Promise<void>;
};

export function EditClassModal({
  open,
  onOpenChange,
  classData,
  onSave,
}: EditClassModalProps) {
  const [name, setName] = useState(classData.name);
  const [schoolName, setSchoolName] = useState(classData.school_name);
  const [city, setCity] = useState(classData.city);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Settlement autocomplete state
  const [settlementSuggestions, setSettlementSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const suggestionRef = useRef<HTMLDivElement>(null);

  // Reset form when modal opens
  useEffect(() => {
    if (open) {
      setName(classData.name);
      setSchoolName(classData.school_name);
      setCity(classData.city);
      setError(null);
      setShowSuggestions(false);
    }
  }, [open, classData]);

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

  // Handle settlement search
  const handleSettlementChange = (value: string) => {
    setCity(value);
    const suggestions = filterSettlements(value);
    setSettlementSuggestions(suggestions);
    setShowSuggestions(suggestions.length > 0);
  };

  // Select a settlement from suggestions
  const selectSettlement = (settlement: string) => {
    setCity(settlement);
    setShowSuggestions(false);
    setSettlementSuggestions([]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError("נא להזין שם כיתה");
      return;
    }
    if (!schoolName.trim()) {
      setError("נא להזין שם מוסד");
      return;
    }
    if (!city.trim()) {
      setError("נא לבחור יישוב");
      return;
    }

    setIsSubmitting(true);
    try {
      await onSave({
        name: name.trim(),
        school_name: schoolName.trim(),
        city: city.trim(),
      });
      onOpenChange(false);
    } catch (err) {
      setError("אירעה שגיאה בשמירת הפרטים");
      console.error("Failed to save class details:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md" dir="rtl">
        <DialogHeader>
          <DialogTitle className="text-right flex items-center gap-2">
            <Building2 className="h-5 w-5 text-brand" />
            עריכת פרטי הכיתה
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Class Name */}
          <div className="space-y-2">
            <Label htmlFor="class-name">שם הכיתה</Label>
            <Input
              id="class-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="לדוגמה: כיתה א׳2"
              className="text-right"
            />
          </div>

          {/* Institution Name */}
          <div className="space-y-2">
            <Label htmlFor="school-name">שם המוסד</Label>
            <Input
              id="school-name"
              value={schoolName}
              onChange={(e) => setSchoolName(e.target.value)}
              placeholder="לדוגמה: גן השקמים"
              className="text-right"
            />
          </div>

          {/* Settlement with Autocomplete */}
          <div className="space-y-2 relative" ref={suggestionRef}>
            <Label htmlFor="city" className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              יישוב
            </Label>
            <Input
              id="city"
              type="text"
              placeholder="התחילו להקליד שם יישוב..."
              value={city}
              onChange={(e) => handleSettlementChange(e.target.value)}
              onFocus={() => {
                if (settlementSuggestions.length > 0) {
                  setShowSuggestions(true);
                }
              }}
              autoComplete="off"
              className="text-right"
            />

            {/* Suggestions Dropdown */}
            {showSuggestions && settlementSuggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-card border-2 border-border rounded-xl shadow-lg z-50 overflow-hidden max-h-48 overflow-y-auto">
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

          {/* Error message */}
          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              ביטול
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "שומר..." : "שמור שינויים"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
