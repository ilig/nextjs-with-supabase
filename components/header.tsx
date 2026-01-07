import { AuthButton } from "@/components/auth-button";
import Link from "next/link";

export function Header() {
  return (
    <nav dir="rtl" className="w-full flex justify-center border-b-2 border-border bg-background/90 backdrop-blur-lg sticky top-0 z-50 shadow-sm">
      <div className="w-full max-w-7xl flex md:flex-row md:justify-between items-center py-4 px-4 md:px-6">
        <div className="flex gap-3 items-center md:order-1">
          <Link href={"/"} className="flex items-center gap-2 md:gap-3 group">
            {/* Logo Icon */}
            <div className="relative">
              <div className="w-10 h-10 md:w-11 md:h-11 rounded-2xl bg-gradient-to-br from-brand to-info flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform">
                <span className="text-xl md:text-2xl">✨</span>
              </div>
              <div className="absolute -bottom-1 -right-1 w-3 h-3 md:w-4 md:h-4 bg-accent-yellow rounded-full border-2 border-background"></div>
            </div>
            {/* Logo Text */}
            <div className="flex flex-col leading-tight">
              <span className="text-xl md:text-2xl font-extrabold text-foreground group-hover:text-brand transition-colors">ClassEase</span>
              <span className="text-xs font-semibold text-muted-foreground">ניהול ועד הורים חכם</span>
            </div>
          </Link>
        </div>
        <div className="md:order-2 absolute left-4 md:static">
          <AuthButton />
        </div>
      </div>
    </nav>
  );
}
