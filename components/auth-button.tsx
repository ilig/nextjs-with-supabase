import Link from "next/link";
import { Button } from "./ui/button";
import { createClient } from "@/lib/supabase/server";
import { LogoutButton } from "./logout-button";
import { LayoutDashboard } from "lucide-react";

export async function AuthButton() {
  const supabase = await createClient();

  // You can also use getUser() which will be slower.
  const { data } = await supabase.auth.getClaims();

  const user = data?.claims;

  // Check if user has classes to determine dashboard link
  let hasClasses = false;
  if (user) {
    const { data: classes } = await supabase
      .from("classes")
      .select("id")
      .eq("created_by", user.sub)
      .limit(1);
    hasClasses = classes ? classes.length > 0 : false;
  }

  const dashboardLink = hasClasses ? "/dashboard-v2" : "/onboarding-v2";

  return user ? (
    <div className="flex items-center justify-between md:justify-start gap-2 md:gap-3 w-full md:w-auto" dir="rtl">
      <span className="text-sm font-semibold text-foreground">שלום, {user.email?.split('@')[0]}!</span>
      {/* Dashboard button - hidden on mobile since we have the sticky footer CTA */}
      <Button asChild size="sm" className="hidden md:flex bg-brand hover:bg-brand-hover text-white rounded-xl shadow-md hover:shadow-lg transition-all font-bold items-center gap-2 px-4 py-2">
        <Link href={dashboardLink}>
          <LayoutDashboard className="h-4 w-4" />
          <span>לדשבורד שלי</span>
        </Link>
      </Button>
      <LogoutButton />
    </div>
  ) : (
    <div className="flex gap-3 w-full md:w-auto">
      <Button asChild size="default" variant={"outline"} className="flex-1 md:flex-none rounded-2xl border-2 border-brand text-brand hover:bg-brand hover:text-brand-foreground font-bold">
        <Link href="/auth/login">התחברות</Link>
      </Button>
      <Button asChild size="default" className="flex-1 md:flex-none rounded-2xl bg-brand hover:bg-brand-hover text-brand-foreground font-bold shadow-md">
        <Link href="/auth/sign-up">הרשמה</Link>
      </Button>
    </div>
  );
}
