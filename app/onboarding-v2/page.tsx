import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { OnboardingWizard } from "@/components/v2/onboarding";

export default async function OnboardingV2Page() {
  const supabase = await createClient();

  // Check if user is authenticated
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  // Check if user already has a class with setup_complete
  const { data: classes } = await supabase
    .from("classes")
    .select("id, setup_complete")
    .eq("created_by", user.id)
    .limit(1);

  // If user already has a completed class, redirect to dashboard
  if (classes && classes.length > 0 && classes[0].setup_complete) {
    redirect("/dashboard-v2");
  }

  return <OnboardingWizard />;
}
