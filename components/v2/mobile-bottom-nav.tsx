"use client";

import { Wallet, Users, Calendar, Gift, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

export type DashboardTab = "budget" | "contacts" | "calendar" | "gifts" | "settings";

type MobileBottomNavProps = {
  activeTab: DashboardTab;
  onTabChange: (tab: DashboardTab) => void;
  className?: string;
};

const tabs = [
  { id: "budget" as const, icon: Wallet, label: "תקציב" },
  { id: "contacts" as const, icon: Users, label: "דף קשר" },
  { id: "calendar" as const, icon: Calendar, label: "לוח שנה" },
  { id: "gifts" as const, icon: Gift, label: "מתנות", badge: "בקרוב" },
  { id: "settings" as const, icon: Settings, label: "הגדרות" },
];

export function MobileBottomNav({
  activeTab,
  onTabChange,
  className,
}: MobileBottomNavProps) {
  return (
    <nav
      className={cn(
        "fixed bottom-0 left-0 right-0 z-50 bg-card border-t-2 border-border",
        "safe-area-bottom md:hidden",
        className
      )}
    >
      <div className="flex items-center justify-around h-16 px-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={cn(
                "flex flex-col items-center justify-center gap-1 flex-1 h-full",
                "min-w-[44px] min-h-[44px]", // Touch-friendly tap target
                "transition-colors duration-200",
                isActive
                  ? "text-brand"
                  : "text-muted-foreground hover:text-foreground"
              )}
              aria-label={tab.label}
              aria-current={isActive ? "page" : undefined}
            >
              <div className="relative">
                <Icon
                  className={cn(
                    "h-5 w-5 transition-transform",
                    isActive && "scale-110"
                  )}
                />
                {tab.badge && (
                  <span className="absolute -top-1 -right-2 text-[8px] font-bold bg-accent-yellow text-accent-yellow-foreground px-1 rounded-full">
                    {tab.badge}
                  </span>
                )}
              </div>
              <span
                className={cn(
                  "text-[10px] font-medium",
                  isActive && "font-bold"
                )}
              >
                {tab.label}
              </span>
              {isActive && (
                <div className="absolute bottom-1 w-8 h-1 bg-brand rounded-full" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
