"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { z } from "zod";

// Zod schema for validation
const onboardingSchema = z.object({
  question1: z
    .string()
    .refine(
      (val) => val !== "" && ["productivity", "learning", "collaboration", "other"].includes(val),
      "Please select your primary goal"
    ),
  question2: z
    .string()
    .refine(
      (val) => val !== "" && ["search", "social", "friend", "ad", "other"].includes(val),
      "Please tell us how you heard about us"
    ),
  question3: z
    .string()
    .refine(
      (val) => val !== "" && ["beginner", "intermediate", "advanced", "expert"].includes(val),
      "Please select your experience level"
    ),
});

// Infer TypeScript type from Zod schema
type OnboardingResponses = z.infer<typeof onboardingSchema>;

export function OnboardingForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [responses, setResponses] = useState({
    question1: "",
    question2: "",
    question3: "",
  });
  const [errors, setErrors] = useState<{
    question1?: string;
    question2?: string;
    question3?: string;
  }>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrors({}); // Clear previous errors

    try {
      // Validate form data with Zod
      const validatedData = onboardingSchema.parse(responses);

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
            responses: validatedData,
            completed_at: new Date().toISOString(),
          },
          {
            onConflict: "user_id",
          }
        );

      if (error) throw error;

      // Redirect to class creation wizard after successful completion
      router.push("/create-class");
      router.refresh();
    } catch (error) {
      // Handle Zod validation errors
      if (error instanceof z.ZodError) {
        const fieldErrors: Record<string, string> = {};
        error.issues.forEach((issue) => {
          if (issue.path[0]) {
            fieldErrors[issue.path[0] as string] = issue.message;
          }
        });
        setErrors(fieldErrors);
      } else {
        console.error("Error saving onboarding:", error);
        alert("Failed to save responses. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="bg-card text-card-foreground rounded-xl border p-8 shadow-sm">
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
              value={responses.question1}
              onChange={(e) => {
                setResponses({ ...responses, question1: e.target.value });
                // Clear error when user makes a selection
                if (errors.question1) {
                  setErrors({ ...errors, question1: undefined });
                }
              }}
              className={`w-full px-3 py-2 border bg-background rounded-md focus:outline-none focus:ring-2 focus:ring-ring ${
                errors.question1 ? "border-red-500" : "border-input"
              }`}
            >
              <option value="">Select an option</option>
              <option value="productivity">Increase productivity</option>
              <option value="learning">Learn new skills</option>
              <option value="collaboration">Team collaboration</option>
              <option value="other">Other</option>
            </select>
            {errors.question1 && (
              <p className="text-sm text-red-500">{errors.question1}</p>
            )}
          </div>

          {/* Question 2 */}
          <div className="space-y-2">
            <Label htmlFor="q2">2. How did you hear about us?</Label>
            <select
              id="q2"
              value={responses.question2}
              onChange={(e) => {
                setResponses({ ...responses, question2: e.target.value });
                // Clear error when user makes a selection
                if (errors.question2) {
                  setErrors({ ...errors, question2: undefined });
                }
              }}
              className={`w-full px-3 py-2 border bg-background rounded-md focus:outline-none focus:ring-2 focus:ring-ring ${
                errors.question2 ? "border-red-500" : "border-input"
              }`}
            >
              <option value="">Select an option</option>
              <option value="search">Search engine</option>
              <option value="social">Social media</option>
              <option value="friend">Friend/colleague</option>
              <option value="ad">Advertisement</option>
              <option value="other">Other</option>
            </select>
            {errors.question2 && (
              <p className="text-sm text-red-500">{errors.question2}</p>
            )}
          </div>

          {/* Question 3 */}
          <div className="space-y-2">
            <Label htmlFor="q3">3. What&apos;s your experience level?</Label>
            <select
              id="q3"
              value={responses.question3}
              onChange={(e) => {
                setResponses({ ...responses, question3: e.target.value });
                // Clear error when user makes a selection
                if (errors.question3) {
                  setErrors({ ...errors, question3: undefined });
                }
              }}
              className={`w-full px-3 py-2 border bg-background rounded-md focus:outline-none focus:ring-2 focus:ring-ring ${
                errors.question3 ? "border-red-500" : "border-input"
              }`}
            >
              <option value="">Select an option</option>
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
              <option value="expert">Expert</option>
            </select>
            {errors.question3 && (
              <p className="text-sm text-red-500">{errors.question3}</p>
            )}
          </div>

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? "Saving..." : "Complete Onboarding"}
          </Button>
        </form>
      </div>
    </div>
  );
}
