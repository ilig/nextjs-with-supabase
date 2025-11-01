import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { OnboardingForm } from "@/components/onboarding-form";

export default async function OnboardingPage() {
  const supabase = await createClient();

  // Check if user is authenticated
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  // Check if user already completed onboarding
  const { data: onboarding } = await supabase
    .from("user_onboarding")
    .select("*")
    .eq("user_id", user.id)
    .single();

  // If already completed, redirect to dashboard
  if (onboarding) {
    redirect("/dashboard");
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <OnboardingForm />
    </div>
  );
}
