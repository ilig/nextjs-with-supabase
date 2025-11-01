import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function DashboardPage() {
  const supabase = await createClient();

  const { data, error } = await supabase.auth.getClaims();
  if (error || !data?.claims) {
    redirect("/auth/login");
  }

  // Check if user completed onboarding
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    const { data: onboarding } = await supabase
      .from("user_onboarding")
      .select("responses")
      .eq("user_id", user.id)
      .single();

    // If no onboarding data, redirect to onboarding page
    if (!onboarding) {
      redirect("/onboarding");
    }

    // You can access their responses here for personalization
    const goal = onboarding.responses.question1;
    const experienceLevel = onboarding.responses.question3;

    return (
      <div className="flex-1 w-full flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4">
            Welcome to Ilan&apos;s New Project!
          </h1>
          <p className="text-muted-foreground mb-2">
            You&apos;re successfully authenticated.
          </p>
          <p className="text-sm text-muted-foreground">
            Your goal: {goal} | Experience: {experienceLevel}
          </p>
        </div>
      </div>
    );
  }

  return null;
}
