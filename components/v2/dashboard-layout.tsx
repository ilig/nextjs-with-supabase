"use client";

import { useState, ReactNode } from "react";
import { MobileBottomNav, type DashboardTab } from "./mobile-bottom-nav";
import { DesktopTopNav } from "./desktop-top-nav";
import { cn } from "@/lib/utils";

type DashboardLayoutProps = {
  children: ReactNode;
  classDisplayName?: string;
  defaultTab?: DashboardTab;
  onTabChange?: (tab: DashboardTab) => void;
};

export function DashboardLayout({
  children,
  classDisplayName,
  defaultTab = "budget",
  onTabChange,
}: DashboardLayoutProps) {
  const [activeTab, setActiveTab] = useState<DashboardTab>(defaultTab);

  const handleTabChange = (tab: DashboardTab) => {
    setActiveTab(tab);
    onTabChange?.(tab);
  };

  return (
    <div dir="rtl" className="min-h-screen bg-background flex flex-col">
      {/* Desktop navigation - hidden on mobile */}
      <DesktopTopNav
        activeTab={activeTab}
        onTabChange={handleTabChange}
        classDisplayName={classDisplayName}
      />

      {/* Main content area */}
      <main
        className={cn(
          "flex-1 overflow-auto",
          // Add padding for mobile bottom nav
          "pb-20 md:pb-0"
        )}
      >
        {children}
      </main>

      {/* Mobile navigation - hidden on desktop */}
      <MobileBottomNav activeTab={activeTab} onTabChange={handleTabChange} />
    </div>
  );
}

// Re-export types for convenience
export type { DashboardTab };
