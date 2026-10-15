import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { supabase } from "../lib/supabase";
import { Logo } from "../components/Logo";
import { Loader2, AlertCircle, Mail, ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/forgot-password")({
  component: ForgotPasswordPage,
});

const schema = z.object({
  email: z.string().email("Enter a valid email address"),
});

function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const [formError, setFormError] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const validate = () => {
    const result = schema.safeParse({ email });
    if (!result.success) {
      setEmailError(result.error.errors[0].message);
      return false;
    }
    setEmailError("");
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    setFormError("");

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (error) {
      setFormError(error.message);
      setLoading(false);
      return;
    }

    setSent(true);
    setLoading(false);
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

            {sent ? (
              /* Success state */
              <div className="text-center">
                <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 ring-8 ring-emerald-50/50">
                  <Mail className="h-6 w-6 text-emerald-600" />
                </div>
                <h1 className="text-xl font-bold tracking-tight text-foreground">
                  Check your inbox
                </h1>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                  We've sent a password reset link to{" "}
                  <span className="font-medium text-foreground">{email}</span>.
                  The link expires in 24 hours.
                </p>
                <p className="mt-4 text-sm text-muted-foreground">
                  Didn't receive it? Check spam or{" "}
                  <button
                    type="button"
                    onClick={() => setSent(false)}
                    className="font-medium text-primary hover:text-primary/80 transition-colors"
                  >
                    try a different email
                  </button>
                  .
                </p>
                <div className="mt-6 border-t border-border pt-5">
                  <Link
                    to="/login"
                    className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <ArrowLeft className="h-3.5 w-3.5" />
                    Back to sign in
                  </Link>
                </div>
              </div>
            ) : (
              /* Form state */
              <>
                <div className="mb-8">
                  <Link
                    to="/login"
                    className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <ArrowLeft className="h-3.5 w-3.5" />
                    Back to sign in
                  </Link>
                  <h1 className="text-2xl font-bold tracking-tight text-foreground">
                    Forgot your password?
                  </h1>
                  <p className="mt-1.5 text-sm text-muted-foreground">
                    Enter your email and we'll send you a reset link.
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
                    <label htmlFor="email" className="text-sm font-medium text-foreground">
                      Email address
                    </label>
                    <input
                      id="email"
                      type="email"
                      autoComplete="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@company.com"
                      className={`flex h-10 w-full rounded-lg border bg-background px-3.5 text-sm text-foreground placeholder:text-muted-foreground/60 outline-none transition-colors focus:border-ring focus:ring-2 focus:ring-ring/20 ${
                        emailError ? "border-destructive focus:border-destructive focus:ring-destructive/20" : "border-input"
                      }`}
                    />
                    {emailError && (
                      <p className="text-xs text-destructive">{emailError}</p>
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
                        Sending…
                      </>
                    ) : (
                      "Send reset link"
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
