"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card } from "@/components/ui/card";
import { Eye, Phone, MapPin, Calendar, ChevronDown, Check, X, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

type DirectorySettings = {
  show_phone: boolean;
  show_address: boolean;
  show_birthday: boolean;
  is_public: boolean;
};

type DirectorySettingsBlockProps = {
  settings: DirectorySettings;
  onSave: (settings: DirectorySettings) => Promise<void>;
  className?: string;
};

export function DirectorySettingsBlock({
  settings,
  onSave,
  className,
}: DirectorySettingsBlockProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [localSettings, setLocalSettings] = useState<DirectorySettings>(settings);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasChanges, setHasChanges] = useState(false);

  // Sync with external settings changes
  useEffect(() => {
    setLocalSettings(settings);
    setHasChanges(false);
  }, [settings]);

  // Check if there are unsaved changes
  useEffect(() => {
    const changed =
      localSettings.is_public !== settings.is_public ||
      localSettings.show_phone !== settings.show_phone ||
      localSettings.show_address !== settings.show_address ||
      localSettings.show_birthday !== settings.show_birthday;
    setHasChanges(changed);
  }, [localSettings, settings]);

  const handleSave = async () => {
    setError(null);
    setIsSubmitting(true);
    try {
      await onSave(localSettings);
      setHasChanges(false);
    } catch (err) {
      setError("אירעה שגיאה בשמירת ההגדרות");
      console.error("Failed to save directory settings:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setLocalSettings(settings);
    setHasChanges(false);
    setError(null);
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
      description: "הצג את מספרי הטלפון של ההורים",
    },
    {
      key: "show_address" as const,
      icon: MapPin,
      title: "הצג כתובות",
      description: "הצג את כתובות המגורים",
    },
    {
      key: "show_birthday" as const,
      icon: Calendar,
      title: "הצג תאריכי לידה",
      description: "הצג את תאריכי הלידה של הילדים",
    },
  ];

  return (
    <Card className={cn("overflow-hidden", className)} dir="rtl">
      {/* Header - Always visible */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-4 hover:bg-accent/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-brand/10">
            <Eye className="h-5 w-5 text-brand" />
          </div>
          <div className="text-right">
            <h3 className="text-lg font-semibold text-foreground">הגדרות דף קשר</h3>
            <p className="text-sm text-muted-foreground">
              {settings.is_public ? "דף ציבורי" : "דף פרטי"}
            </p>
          </div>
        </div>
        <ChevronDown
          className={cn(
            "h-5 w-5 text-muted-foreground transition-transform duration-200",
            isExpanded && "rotate-180"
          )}
        />
      </button>

      {/* Expandable Content */}
      <div
        className={cn(
          "grid transition-all duration-200 ease-out",
          isExpanded ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
        )}
      >
        <div className="overflow-hidden">
          <div className="p-4 pt-0 space-y-4">
            {/* Info */}
            <div className="bg-muted/50 rounded-xl p-3 text-sm text-muted-foreground">
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
                    className={cn(
                      "flex items-center justify-between p-3 rounded-xl border-2 border-border",
                      isDisabled && "opacity-50"
                    )}
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <div className="p-2 rounded-xl bg-muted">
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
              <div className="bg-warning/10 border border-warning/30 rounded-xl p-3 text-sm text-warning">
                <p>
                  דף הקשר מוסתר. רק מנהלים יכולים לצפות בפרטים.
                </p>
              </div>
            )}

            {/* Error message */}
            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}

            {/* Action buttons - Only show when there are changes */}
            {hasChanges && (
              <div className="flex gap-2 pt-2 border-t border-border">
                <Button
                  variant="ghost"
                  onClick={handleCancel}
                  disabled={isSubmitting}
                  className="flex-1"
                >
                  <X className="h-4 w-4 ml-2" />
                  ביטול
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={isSubmitting}
                  className="flex-1"
                >
                  {isSubmitting ? (
                    <Loader2 className="h-4 w-4 ml-2 animate-spin" />
                  ) : (
                    <Check className="h-4 w-4 ml-2" />
                  )}
                  {isSubmitting ? "שומר..." : "שמור"}
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}
