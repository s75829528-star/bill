import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { z } from "zod";
import { supabase } from "../lib/supabase";
import { Logo } from "../components/Logo";
import { Eye, EyeOff, Loader2, AlertCircle, CheckCircle2, Check, X as XIcon } from "lucide-react";

export const Route = createFileRoute("/reset-password")({
  component: ResetPasswordPage,
});

const schema = z
  .object({
    password: z
      .string()
      .min(8, "At least 8 characters")
      .regex(/[A-Z]/, "At least one uppercase letter")
      .regex(/[0-9]/, "At least one number"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

const passwordRules = [
  { label: "8+ characters", test: (p: string) => p.length >= 8 },
  { label: "Uppercase letter", test: (p: string) => /[A-Z]/.test(p) },
  { label: "Number", test: (p: string) => /[0-9]/.test(p) },
];

function ResetPasswordPage() {
  const navigate = useNavigate();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [sessionReady, setSessionReady] = useState(false);

  // Supabase sends a RECOVERY event when the reset link is clicked
  useEffect(() => {
    const { data: listener } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setSessionReady(true);
      }
    });

    // If already in a recovery session (page reload scenario)
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setSessionReady(true);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  const validate = () => {
    const result = schema.safeParse({ password, confirmPassword });
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach((e) => {
        if (e.path[0]) fieldErrors[e.path[0] as string] = e.message;
      });
      setErrors(fieldErrors);
      return false;
    }
    setErrors({});
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    setFormError("");

    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      setFormError(error.message);
      setLoading(false);
      return;
    }

    setDone(true);
    setTimeout(() => navigate({ to: "/login" }), 3000);
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <div className="pointer-events-none fixed inset-0 bg-hero-glow opacity-40" />

      <header className="relative z-10 flex h-16 items-center px-6 sm:px-10">
        <Logo />
      </header>

      <main className="relative z-10 flex flex-1 items-center justify-center px-4 py-12">
        <div className="w-full max-w-[400px]">
          <div className="rounded-2xl border border-border bg-card shadow-[var(--shadow-card)] p-8">

            {done ? (
              <div className="text-center">
                <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 ring-8 ring-emerald-50/50">
                  <CheckCircle2 className="h-6 w-6 text-emerald-600" />
                </div>
                <h1 className="text-xl font-bold tracking-tight text-foreground">
                  Password updated
                </h1>
                <p className="mt-2 text-sm text-muted-foreground">
                  Your password has been changed. Redirecting you to sign in…
                </p>
              </div>
            ) : !sessionReady ? (
              <div className="text-center">
                <h1 className="text-xl font-bold tracking-tight text-foreground">
                  Invalid or expired link
                </h1>
                <p className="mt-2 text-sm text-muted-foreground">
                  This password reset link is no longer valid.
                </p>
                <div className="mt-6">
                  <Link
                    to="/forgot-password"
                    className="inline-flex h-10 items-center justify-center rounded-lg bg-[image:var(--gradient-brand)] px-5 text-sm font-semibold text-white shadow-[var(--shadow-elegant)] hover:opacity-90 transition-opacity"
                  >
                    Request a new link
                  </Link>
                </div>
              </div>
            ) : (
              <>
                <div className="mb-8">
                  <h1 className="text-2xl font-bold tracking-tight text-foreground">
                    Set new password
                  </h1>
                  <p className="mt-1.5 text-sm text-muted-foreground">
                    Choose a strong password for your account.
                  </p>
                </div>

                {formError && (
                  <div className="mb-5 flex items-start gap-3 rounded-lg border border-destructive/20 bg-destructive/8 px-4 py-3 text-sm text-destructive">
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                    <span>{formError}</span>
                  </div>
                )}

                <form onSubmit={handleSubmit} noValidate className="space-y-4">
                  <div className="space-y-1.5">
                    <label htmlFor="password" className="text-sm font-medium text-foreground">
                      New password
                    </label>
                    <div className="relative">
                      <input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        autoComplete="new-password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className={`flex h-10 w-full rounded-lg border bg-background px-3.5 pr-10 text-sm text-foreground placeholder:text-muted-foreground/60 outline-none transition-colors focus:border-ring focus:ring-2 focus:ring-ring/20 ${
                          errors.password ? "border-destructive focus:border-destructive focus:ring-destructive/20" : "border-input"
                        }`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                        aria-label={showPassword ? "Hide" : "Show"}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    {password.length > 0 && (
                      <div className="flex flex-wrap gap-x-4 gap-y-1 pt-0.5">
                        {passwordRules.map((rule) => {
                          const ok = rule.test(password);
                          return (
                            <span
                              key={rule.label}
                              className={`flex items-center gap-1 text-xs transition-colors ${ok ? "text-emerald-600" : "text-muted-foreground"}`}
                            >
                              {ok ? <Check className="h-3 w-3" /> : <XIcon className="h-3 w-3" />}
                              {rule.label}
                            </span>
                          );
                        })}
                      </div>
                    )}
                    {errors.password && (
                      <p className="text-xs text-destructive">{errors.password}</p>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="confirmPassword" className="text-sm font-medium text-foreground">
                      Confirm new password
                    </label>
                    <div className="relative">
                      <input
                        id="confirmPassword"
                        type={showConfirm ? "text" : "password"}
                        autoComplete="new-password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="••••••••"
                        className={`flex h-10 w-full rounded-lg border bg-background px-3.5 pr-10 text-sm text-foreground placeholder:text-muted-foreground/60 outline-none transition-colors focus:border-ring focus:ring-2 focus:ring-ring/20 ${
                          errors.confirmPassword ? "border-destructive focus:border-destructive focus:ring-destructive/20" : "border-input"
                        }`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirm(!showConfirm)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                        aria-label={showConfirm ? "Hide" : "Show"}
                      >
                        {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    {errors.confirmPassword && (
                      <p className="text-xs text-destructive">{errors.confirmPassword}</p>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-[image:var(--gradient-brand)] px-4 text-sm font-semibold text-white shadow-[var(--shadow-elegant)] transition-opacity hover:opacity-90 active:opacity-80 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Updating…
                      </>
                    ) : (
                      "Update password"
                    )}
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
