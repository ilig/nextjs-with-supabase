"use client";

import { Wallet, Users, Calendar, Gift, Settings, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import type { DashboardTab } from "./mobile-bottom-nav";

type DesktopTopNavProps = {
  activeTab: DashboardTab;
  onTabChange: (tab: DashboardTab) => void;
  className?: string;
  classDisplayName?: string;
};

const tabs = [
  { id: "budget" as const, icon: Wallet, label: "תקציב" },
  { id: "contacts" as const, icon: Users, label: "דף קשר" },
  { id: "calendar" as const, icon: Calendar, label: "לוח שנה" },
  { id: "gifts" as const, icon: Gift, label: "קטלוג מתנות", badge: "בקרוב" },
  { id: "settings" as const, icon: Settings, label: "הגדרות" },
];

export function DesktopTopNav({
  activeTab,
  onTabChange,
  className,
  classDisplayName = "הכיתה שלי",
}: DesktopTopNavProps) {
  return (
    <nav
      className={cn(
        "hidden md:flex items-center justify-between relative",
        "bg-card border-b-2 border-border px-6 h-16",
        className
      )}
    >
      {/* Logo and class name */}
      <div className="flex items-center gap-4">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand to-info flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <span className="text-lg font-bold text-foreground group-hover:text-brand transition-colors">
            ClassEase
          </span>
        </Link>
        <div className="h-6 w-px bg-border" />
        <span className="text-sm font-semibold text-muted-foreground">
          {classDisplayName}
        </span>
      </div>

      {/* Navigation tabs - centered with absolute positioning */}
      <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-xl",
                "transition-all duration-200",
                "min-h-[44px]", // Touch-friendly
                isActive
                  ? "bg-brand text-brand-foreground shadow-md"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
              aria-current={isActive ? "page" : undefined}
            >
              <Icon className="h-4 w-4" />
              <span className="text-sm font-medium">{tab.label}</span>
              {tab.badge && (
                <span className="text-[10px] font-bold bg-accent-yellow text-accent-yellow-foreground px-1.5 py-0.5 rounded-full">
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

{/* Empty div to maintain layout spacing */}
      <div className="w-20" />
    </nav>
  );
}
