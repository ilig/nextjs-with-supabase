"use client";

import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function SignUpForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [repeatPassword, setRepeatPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    const supabase = createClient();
    setIsLoading(true);
    setError(null);

    if (password !== repeatPassword) {
      setError("הסיסמאות לא תואמות");
      setIsLoading(false);
      return;
    }

    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/create-class`,
        },
      });
      if (error) throw error;
      router.push("/create-class");
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "אירעה שגיאה");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
    const supabase = createClient();
    setError(null);

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (error) throw error;
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "אירעה שגיאה");
    }
  };

  return (
    <div className={cn("flex flex-col gap-8", className)} {...props} dir="rtl">
      {/* Logo */}
      <Link href="/" className="flex items-center justify-center gap-3 group">
        <div className="relative">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#A78BFA] to-[#60A5FA] flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform">
            <span className="text-2xl">✨</span>
          </div>
          <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-[#FCD34D] rounded-full border-2 border-white"></div>
        </div>
        <div className="flex flex-col leading-tight">
          <span className="text-2xl font-extrabold text-[#222222] group-hover:text-[#A78BFA] transition-colors">ClassEase</span>
          <span className="text-xs font-semibold text-gray-500">ניהול ועד הורים חכם</span>
        </div>
      </Link>

      {/* Card */}
      <div className="bg-white rounded-3xl shadow-xl p-8 border-2 border-gray-100">
        <div className="mb-6 text-center">
          <h1 className="text-3xl font-extrabold text-[#222222] mb-2">הרשמה</h1>
          <p className="text-gray-600">צור חשבון חדש</p>
        </div>
        <div className="space-y-6">
          <Button
            type="button"
            variant="outline"
            className="w-full rounded-2xl border-2 border-gray-300 hover:bg-gray-50 font-semibold h-12"
            onClick={handleGoogleSignUp}
          >
            <svg className="ml-2 h-5 w-5" viewBox="0 0 24 24">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
            הירשם עם Google
          </Button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t-2 border-gray-200" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="bg-white px-4 text-gray-500 font-semibold">
                או המשך עם
              </span>
            </div>
          </div>

          <form onSubmit={handleSignUp} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-semibold text-gray-700">אימייל</Label>
              <Input
                id="email"
                type="email"
                placeholder="example@email.com"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-12 rounded-2xl border-2 border-gray-200 focus:border-[#A78BFA] transition-colors"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-semibold text-gray-700">סיסמה</Label>
              <Input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-12 rounded-2xl border-2 border-gray-200 focus:border-[#A78BFA] transition-colors"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="repeat-password" className="text-sm font-semibold text-gray-700">אמת סיסמה</Label>
              <Input
                id="repeat-password"
                type="password"
                required
                value={repeatPassword}
                onChange={(e) => setRepeatPassword(e.target.value)}
                className="h-12 rounded-2xl border-2 border-gray-200 focus:border-[#A78BFA] transition-colors"
              />
            </div>

            {error && (
              <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-3">
                <p className="text-sm text-red-600 font-semibold text-center">{error}</p>
              </div>
            )}

            <Button
              type="submit"
              className="w-full h-12 rounded-2xl bg-[#A78BFA] hover:bg-[#9333EA] text-white font-bold shadow-lg hover:shadow-xl transition-all"
              disabled={isLoading}
            >
              {isLoading ? "יוצר חשבון..." : "הירשם"}
            </Button>
          </form>

          <div className="text-center text-sm">
            <span className="text-gray-600">כבר יש לך חשבון?</span>{" "}
            <Link
              href="/auth/login"
              className="text-[#A78BFA] hover:text-[#9333EA] font-bold underline-offset-4 hover:underline transition-colors"
            >
              התחבר
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
