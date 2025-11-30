import { ClassOnboardingFlow } from "@/components/class-onboarding-flow";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function CreateClassPage() {
  const supabase = await createClient();

  // Get authenticated user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // If user is logged in, check if they already have classes
  if (user) {
    const { data: classes } = await supabase
      .from("classes")
      .select("id")
      .eq("created_by", user.id)
      .limit(1);

    // If they have at least one class, redirect to dashboard
    if (classes && classes.length > 0) {
      redirect("/dashboard");
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <div className="flex-1">
        <ClassOnboardingFlow />
      </div>
      <Footer />
    </div>
  );
}
