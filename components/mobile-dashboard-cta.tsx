"use client";

import Link from "next/link";
import { Button } from "./ui/button";
import { LayoutDashboard } from "lucide-react";

interface MobileDashboardCtaProps {
  href: string;
}

export function MobileDashboardCta({ href }: MobileDashboardCtaProps) {
  return (
    <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-background via-background to-transparent md:hidden z-50">
      <Button
        asChild
        className="w-full bg-brand hover:bg-brand-hover text-white text-lg py-6 rounded-2xl shadow-xl hover:shadow-2xl transition-all font-bold flex items-center justify-center gap-3"
      >
        <Link href={href}>
          <LayoutDashboard className="h-5 w-5" />
          <span>לדשבורד שלי</span>
        </Link>
      </Button>
    </div>
  );
}
