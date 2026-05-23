"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  Bot,
  CheckCircle2,
  Eye,
  EyeOff,
  Loader2,
  LockKeyhole,
  Mail,
  Moon,
  ShieldCheck,
  Sun,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/components/providers/theme-provider";
import { cn } from "@/lib/utils/cn";
import { loginWithPassword, refreshAccessToken } from "@/lib/auth/client";

const enterpriseRoles = [
  "Organization Admin",
  "Manager",
  "CFO",
  "Auditor",
  "Employee",
];

export function LoginScreen() {
  const router = useRouter();
  const { resolvedTheme, setTheme } = useTheme();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mfaCode, setMfaCode] = useState("");
  const [mfaRequired, setMfaRequired] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);

  useEffect(() => {
    let active = true;

    async function restoreSession() {
      const token = await refreshAccessToken();
      if (!active) return;
      if (token) {
        router.replace("/dashboard");
        router.refresh();
        return;
      }
      setCheckingSession(false);
    }

    restoreSession();
    return () => {
      active = false;
    };
  }, [router]);

  const canSubmit = useMemo(() => {
    if (!email.trim() || password.length < 8) return false;
    if (mfaRequired && mfaCode.trim().length < 6) return false;
    return true;
  }, [email, password, mfaCode, mfaRequired]);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canSubmit || loading || checkingSession) return;

    setLoading(true);
    setError(null);

    const response = await loginWithPassword({
      email,
      password,
      mfaCode: mfaRequired ? mfaCode : undefined,
    });

    setLoading(false);

    if (!response.success) {
      setError(response.error?.message ?? "Unable to sign in");
      return;
    }

    if (response.data?.requiresMfa) {
      setMfaRequired(true);
      setError("Enter your verification code to continue.");
      return;
    }

    if (!response.data?.accessToken) {
      setError("Authentication succeeded, but no access token was returned.");
      return;
    }

    router.replace("/dashboard");
    router.refresh();
  }

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="grid min-h-screen lg:grid-cols-[0.95fr_1.05fr]">
        <section className="relative hidden overflow-hidden bg-sidebar text-sidebar-foreground lg:flex">
          <div className="absolute inset-x-0 top-0 h-1 bg-[linear-gradient(90deg,#38bdf8,#22c55e,#f59e0b)]" />
          <div className="flex w-full flex-col justify-between px-12 py-10">
            <div>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
                  <Bot className="h-5 w-5 text-primary-foreground" />
                </div>
                <div>
                  <p className="text-lg font-semibold tracking-tight">AI ERP OS</p>
                  <p className="text-xs text-sidebar-muted">Enterprise identity gateway</p>
                </div>
              </div>

              <div className="mt-24 max-w-xl">
                <p className="text-sm font-medium uppercase tracking-[0.18em] text-sky-300">
                  Secure workspace access
                </p>
                <h1 className="mt-4 text-5xl font-semibold leading-tight tracking-tight">
                  Sign in to your operating layer for finance, workflows, and compliance.
                </h1>
                <p className="mt-5 max-w-lg text-base leading-7 text-sidebar-muted">
                  Built for multi-tenant teams operating in regulated environments.
                </p>
              </div>
            </div>

            <div className="space-y-5">
              <div className="grid grid-cols-2 gap-3">
                {enterpriseRoles.map((role) => (
                  <div
                    key={role}
                    className="flex items-center gap-2 rounded-lg border border-sidebar-border bg-sidebar-accent/70 px-3 py-2 text-sm"
                  >
                    <CheckCircle2 className="h-4 w-4 text-emerald-300" />
                    {role}
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-3 border-t border-sidebar-border pt-5 text-sm text-sidebar-muted">
                <ShieldCheck className="h-5 w-5 text-sky-300" />
                Enterprise security controls active.
              </div>
            </div>
          </div>
        </section>

        <section className="flex min-h-screen items-center justify-center px-4 py-8 sm:px-6 lg:px-10">
          <div className="w-full max-w-md">
            <div className="mb-8 flex items-center justify-between">
              <div className="flex items-center gap-3 lg:hidden">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
                  <Bot className="h-5 w-5 text-primary-foreground" />
                </div>
                <div>
                  <p className="text-base font-semibold tracking-tight">AI ERP OS</p>
                  <p className="text-xs text-muted-foreground">Enterprise access</p>
                </div>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="ml-auto"
                onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
                aria-label="Toggle theme"
              >
                {resolvedTheme === "dark" ? (
                  <Sun className="h-5 w-5" />
                ) : (
                  <Moon className="h-5 w-5" />
                )}
              </Button>
            </div>

            <div className="rounded-lg border border-border bg-card p-6 shadow-sm sm:p-8">
              <div className="mb-8">
                <p className="text-sm font-medium text-primary">Welcome back</p>
                <h2 className="mt-2 text-2xl font-semibold tracking-tight">
                  Sign in to AI ERP OS
                </h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  Use your enterprise credentials to continue.
                </p>
              </div>

              <form className="space-y-5" onSubmit={onSubmit}>
                <div className="space-y-2">
                  <label htmlFor="email" className="text-sm font-medium">
                    Email
                  </label>
                  <div className="relative">
                    <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <input
                      id="email"
                      type="email"
                      autoComplete="email"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      className="h-11 w-full rounded-lg border border-border bg-background pl-10 pr-3 text-sm outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/20"
                      placeholder="name@company.com"
                      disabled={loading}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label htmlFor="password" className="text-sm font-medium">
                    Password
                  </label>
                  <div className="relative">
                    <LockKeyhole className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      autoComplete="current-password"
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      className="h-11 w-full rounded-lg border border-border bg-background pl-10 pr-11 text-sm outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/20"
                      placeholder="Enter password"
                      disabled={loading}
                      minLength={8}
                      required
                    />
                    <button
                      type="button"
                      className="absolute right-2 top-1/2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground transition hover:bg-muted hover:text-foreground"
                      onClick={() => setShowPassword((value) => !value)}
                      aria-label={showPassword ? "Hide password" : "Show password"}
                      disabled={loading}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>

                {mfaRequired && (
                  <div className="space-y-2">
                    <label htmlFor="mfaCode" className="text-sm font-medium">
                      Verification code
                    </label>
                    <input
                      id="mfaCode"
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      value={mfaCode}
                      onChange={(event) => setMfaCode(event.target.value)}
                      className="h-11 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/20"
                      placeholder="6-digit code"
                      disabled={loading}
                      minLength={6}
                      required
                    />
                  </div>
                )}

                {error && (
                  <div
                    className={cn(
                      "flex gap-2 rounded-lg border px-3 py-2 text-sm",
                      mfaRequired && error.includes("verification")
                        ? "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300"
                        : "border-danger/30 bg-danger/10 text-danger",
                    )}
                    role="alert"
                    aria-live="polite"
                  >
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                <Button
                  type="submit"
                  size="lg"
                  className="w-full"
                  disabled={!canSubmit || loading || checkingSession}
                >
                  {loading || checkingSession ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <ShieldCheck className="h-4 w-4" />
                  )}
                  {checkingSession ? "Checking session" : loading ? "Signing in" : "Sign in"}
                </Button>
              </form>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
