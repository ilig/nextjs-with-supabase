"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

interface OnboardingResponses {
  question1: string;
  question2: string;
  question3: string;
}

export function OnboardingForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [responses, setResponses] = useState<OnboardingResponses>({
    question1: "",
    question2: "",
    question3: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        throw new Error("Not authenticated");
      }

      // Upsert: Insert if new, update if exists
      const { error } = await supabase
        .from("user_onboarding")
        .upsert(
          {
            user_id: user.id,
            responses: responses,
            completed_at: new Date().toISOString(),
          },
          {
            onConflict: "user_id",
          }
        );

      if (error) throw error;

      // Redirect to dashboard after successful completion
      router.push("/dashboard");
      router.refresh();
    } catch (error) {
      console.error("Error saving onboarding:", error);
      alert("Failed to save responses. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="bg-card text-card-foreground rounded-lg border p-8 shadow-sm">
        <h2 className="text-2xl font-bold mb-2">
          Welcome! Let&apos;s personalize your experience
        </h2>
        <p className="text-muted-foreground mb-6">
          Answer these 3 quick questions to help us customize your dashboard.
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Question 1 */}
          <div className="space-y-2">
            <Label htmlFor="q1">
              1. What&apos;s your primary goal with our product?
            </Label>
            <select
              id="q1"
              required
              value={responses.question1}
              onChange={(e) =>
                setResponses({ ...responses, question1: e.target.value })
              }
              className="w-full px-3 py-2 border border-input bg-background rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="">Select an option</option>
              <option value="productivity">Increase productivity</option>
              <option value="learning">Learn new skills</option>
              <option value="collaboration">Team collaboration</option>
              <option value="other">Other</option>
            </select>
          </div>

          {/* Question 2 */}
          <div className="space-y-2">
            <Label htmlFor="q2">2. How did you hear about us?</Label>
            <select
              id="q2"
              required
              value={responses.question2}
              onChange={(e) =>
                setResponses({ ...responses, question2: e.target.value })
              }
              className="w-full px-3 py-2 border border-input bg-background rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="">Select an option</option>
              <option value="search">Search engine</option>
              <option value="social">Social media</option>
              <option value="friend">Friend/colleague</option>
              <option value="ad">Advertisement</option>
              <option value="other">Other</option>
            </select>
          </div>

          {/* Question 3 */}
          <div className="space-y-2">
            <Label htmlFor="q3">3. What&apos;s your experience level?</Label>
            <select
              id="q3"
              required
              value={responses.question3}
              onChange={(e) =>
                setResponses({ ...responses, question3: e.target.value })
              }
              className="w-full px-3 py-2 border border-input bg-background rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="">Select an option</option>
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
              <option value="expert">Expert</option>
            </select>
          </div>

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? "Saving..." : "Complete Onboarding"}
          </Button>
        </form>
      </div>
    </div>
  );
}
