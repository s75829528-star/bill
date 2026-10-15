import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "../lib/supabase";
import { Logo } from "../components/Logo";
import { Mail, Loader2, CheckCircle2, ArrowLeft } from "lucide-react";

type VerifyEmailSearch = { email?: string };

export const Route = createFileRoute("/verify-email")({
  validateSearch: (search: Record<string, unknown>): VerifyEmailSearch => ({
    email: typeof search.email === "string" ? search.email : undefined,
  }),
  component: VerifyEmailPage,
});

function VerifyEmailPage() {
  const { email } = Route.useSearch();
  const [resending, setResending] = useState(false);
  const [resent, setResent] = useState(false);
  const [error, setError] = useState("");

  const handleResend = async () => {
    if (!email) return;
    setResending(true);
    setError("");

    const { error: err } = await supabase.auth.resend({
      type: "signup",
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (err) {
      setError(err.message);
    } else {
      setResent(true);
      setTimeout(() => setResent(false), 5000);
    }

    setResending(false);
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <div className="pointer-events-none fixed inset-0 bg-hero-glow opacity-40" />

      <header className="relative z-10 flex h-16 items-center px-6 sm:px-10">
        <Logo />
      </header>

      <main className="relative z-10 flex flex-1 items-center justify-center px-4 py-12">
        <div className="w-full max-w-[420px]">
          <div className="rounded-2xl border border-border bg-card shadow-[var(--shadow-card)] p-8 text-center">
            {/* Icon */}
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 ring-8 ring-primary/5">
              <Mail className="h-7 w-7 text-primary" />
            </div>

            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Verify your email
            </h1>
            <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
              We've sent a verification link to{" "}
              {email ? (
                <span className="font-medium text-foreground">{email}</span>
              ) : (
                "your email address"
              )}
              . Click the link to activate your account.
            </p>

            {/* Steps */}
            <div className="mt-6 rounded-xl border border-border bg-muted/40 px-5 py-4 text-left space-y-3">
              {[
                "Open your email inbox",
                'Click "Confirm your email" in the Nexora email',
                "You'll be taken to your new dashboard",
              ].map((step, i) => (
                <div key={step} className="flex items-start gap-3">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[11px] font-bold text-primary">
                    {i + 1}
                  </span>
                  <span className="text-sm text-muted-foreground">{step}</span>
                </div>
              ))}
            </div>

            {/* Resend */}
            <div className="mt-6">
              {resent ? (
                <div className="flex items-center justify-center gap-2 text-sm text-emerald-600">
                  <CheckCircle2 className="h-4 w-4" />
                  Email resent successfully
                </div>
              ) : (
                <>
                  <p className="text-sm text-muted-foreground">
                    Didn't receive it? Check spam or{" "}
                  </p>
                  <button
                    type="button"
                    onClick={handleResend}
                    disabled={resending || !email}
                    className="mt-1 inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:text-primary/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {resending ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        Resending…
                      </>
                    ) : (
                      "resend verification email"
                    )}
                  </button>
                  {error && <p className="mt-2 text-xs text-destructive">{error}</p>}
                </>
              )}
            </div>

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
        </div>
      </main>
    </div>
  );
}
