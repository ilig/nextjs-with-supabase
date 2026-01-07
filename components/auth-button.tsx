import Link from "next/link";
import { Button } from "./ui/button";
import { createClient } from "@/lib/supabase/server";
import { LogoutButton } from "./logout-button";

export async function AuthButton() {
  const supabase = await createClient();

  // You can also use getUser() which will be slower.
  const { data } = await supabase.auth.getClaims();

  const user = data?.claims;

  return user ? (
    <div className="flex items-center justify-between md:justify-start gap-3 w-full md:w-auto" dir="rtl">
      <span className="text-sm font-semibold text-foreground">שלום, {user.email?.split('@')[0]}!</span>
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
