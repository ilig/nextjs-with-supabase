"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Eye, Phone, MapPin, Calendar } from "lucide-react";

type DirectorySettings = {
  show_phone: boolean;
  show_address: boolean;
  show_birthday: boolean;
  is_public: boolean;
};

type DirectorySettingsModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  settings: DirectorySettings;
  onSave: (settings: DirectorySettings) => Promise<void>;
};

export function DirectorySettingsModal({
  open,
  onOpenChange,
  settings,
  onSave,
}: DirectorySettingsModalProps) {
  const [localSettings, setLocalSettings] = useState<DirectorySettings>(settings);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset form when modal opens
  useEffect(() => {
    if (open) {
      setLocalSettings(settings);
      setError(null);
    }
  }, [open, settings]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    setIsSubmitting(true);
    try {
      await onSave(localSettings);
      onOpenChange(false);
    } catch (err) {
      setError("אירעה שגיאה בשמירת ההגדרות");
      console.error("Failed to save directory settings:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateSetting = (key: keyof DirectorySettings, value: boolean) => {
    setLocalSettings(prev => ({ ...prev, [key]: value }));
  };

  const settingItems = [
    {
      key: "is_public" as const,
      icon: Eye,
      title: "דף קשר ציבורי",
      description: "אפשר לכל מי שיש לו את הקישור לצפות בדף הקשר",
    },
    {
      key: "show_phone" as const,
      icon: Phone,
      title: "הצג מספרי טלפון",
      description: "הצג את מספרי הטלפון של ההורים בדף הקשר הציבורי",
    },
    {
      key: "show_address" as const,
      icon: MapPin,
      title: "הצג כתובות",
      description: "הצג את כתובות המגורים בדף הקשר הציבורי",
    },
    {
      key: "show_birthday" as const,
      icon: Calendar,
      title: "הצג תאריכי לידה",
      description: "הצג את תאריכי הלידה של הילדים בדף הקשר הציבורי",
    },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md" dir="rtl">
        <DialogHeader>
          <DialogTitle className="text-right flex items-center gap-2">
            <Eye className="h-5 w-5" />
            הגדרות דף קשר
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Info */}
          <div className="bg-muted/50 rounded-lg p-3 text-sm text-muted-foreground">
            <p>
              קבע אילו פרטים יהיו גלויים בדף הקשר הציבורי שמשותף עם ההורים.
            </p>
          </div>

          {/* Settings List */}
          <div className="space-y-3">
            {settingItems.map((item) => {
              const Icon = item.icon;
              const isDisabled = item.key !== "is_public" && !localSettings.is_public;

              return (
                <div
                  key={item.key}
                  className={`flex items-center justify-between p-3 rounded-xl border-2 border-border ${
                    isDisabled ? "opacity-50" : ""
                  }`}
                >
                  <div className="flex items-center gap-3 flex-1">
                    <div className="p-2 rounded-lg bg-muted">
                      <Icon className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-foreground cursor-pointer">
                        {item.title}
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        {item.description}
                      </p>
                    </div>
                  </div>
                  <Switch
                    checked={localSettings[item.key]}
                    onCheckedChange={(checked) => updateSetting(item.key, checked)}
                    disabled={isDisabled}
                  />
                </div>
              );
            })}
          </div>

          {/* Warning when public is disabled */}
          {!localSettings.is_public && (
            <div className="bg-warning/10 border border-warning/30 rounded-lg p-3 text-sm text-warning">
              <p>
                דף הקשר מוסתר. רק מנהלים יכולים לצפות בפרטים.
              </p>
            </div>
          )}

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
              {isSubmitting ? "שומר..." : "שמור"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
