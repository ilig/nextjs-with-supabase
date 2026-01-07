"use client";

import { Wallet, Users, Calendar, Gift } from "lucide-react";

export type NavigationSection = "budget" | "directory" | "events" | "gifts" | null;

type ClassNavigationBarProps = {
  className?: string;
  activeSection: NavigationSection;
  onSectionChange: (section: NavigationSection) => void;
};

export function ClassNavigationBar({
  className = "",
  activeSection,
  onSectionChange,
}: ClassNavigationBarProps) {
  const sections = [
    {
      id: "budget" as const,
      icon: Wallet,
      label: "ניהול התקציב",
      description: "מעקב אחר איסופים, תשלומים והוצאות",
      gradient: "from-purple-500 to-blue-600",
    },
    {
      id: "directory" as const,
      icon: Users,
      label: "ניהול הכיתה",
      description: "ילדים, הורים וצוות",
      gradient: "from-orange-500 to-amber-600",
    },
    {
      id: "events" as const,
      icon: Calendar,
      label: "לוח שנה",
      description: "אירועים, חגים וימי חופש",
      gradient: "from-pink-500 to-rose-600",
    },
    {
      id: "gifts" as const,
      icon: Gift,
      label: "קטלוג מתנות",
      description: "שותפויות עם ספקים ובחירת מתנות",
      gradient: "from-green-500 to-emerald-600",
      badge: "בקרוב",
    },
  ];

  return (
    <div className={`bg-gradient-to-br from-muted/50 to-muted rounded-2xl p-6 border-2 border-border shadow-lg ${className}`}>
      <div className="flex items-center justify-between gap-8">
        {sections.map((section, index) => {
          const isActive = activeSection === section.id;
          const Icon = section.icon;

          return (
            <div key={section.id} className="flex items-center gap-3 flex-1">
              {index > 0 && <div className="h-12 w-px bg-border -ml-4"></div>}

              <button
                onClick={() => onSectionChange(section.id)}
                className={`flex items-center gap-3 w-full transition-all duration-300 rounded-xl p-3 ${
                  isActive
                    ? "bg-card shadow-md scale-105 ring-2 ring-brand"
                    : "hover:bg-card/50 hover:scale-102"
                }`}
              >
                <div className={`p-3 rounded-xl bg-gradient-to-br ${section.gradient} transition-transform ${
                  isActive ? "scale-110" : ""
                }`}>
                  <Icon className="h-6 w-6 text-white" />
                </div>
                <div className="text-right flex-1">
                  <p className={`text-base font-bold transition-colors ${
                    isActive ? "text-foreground" : "text-foreground"
                  }`}>
                    {section.label}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">{section.description}</p>
                  {section.badge && (
                    <p className="text-xs text-muted-foreground mt-0.5 italic">{section.badge}</p>
                  )}
                  {isActive && (
                    <div className="h-1 bg-brand rounded-full mt-1 animate-expand"></div>
                  )}
                </div>
              </button>
            </div>
          );
        })}
      </div>

      <style jsx>{`
        @keyframes expand {
          from {
            width: 0;
          }
          to {
            width: 100%;
          }
        }
        .animate-expand {
          animation: expand 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}
