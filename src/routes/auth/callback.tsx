import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { Logo } from "../../components/Logo";
import { Loader2, AlertCircle, CheckCircle2 } from "lucide-react";
import { Link } from "@tanstack/react-router";

export const Route = createFileRoute("/auth/callback")({
  component: AuthCallbackPage,
});

type Status = "loading" | "success" | "expired" | "error";

function AuthCallbackPage() {
  const navigate = useNavigate();
  const [status, setStatus] = useState<Status>("loading");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    async function handleCallback() {
      // Check for error in the URL hash (e.g. #error=access_denied&error_code=otp_expired)
      const hash = window.location.hash;
      const hashParams = new URLSearchParams(hash.replace("#", ""));
      const hashError = hashParams.get("error");
      const hashErrorCode = hashParams.get("error_code");

      if (hashError) {
        if (hashErrorCode === "otp_expired") {
          setStatus("expired");
        } else {
          setStatus("error");
          setErrorMsg(hashParams.get("error_description") ?? hashError);
        }
        return;
      }

      // Check for PKCE code in query string (?code=XXXX)
      const searchParams = new URLSearchParams(window.location.search);
      const code = searchParams.get("code");

      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (error) {
          if (error.message.toLowerCase().includes("expired")) {
            setStatus("expired");
          } else {
            setStatus("error");
            setErrorMsg(error.message);
          }
          return;
        }
        setStatus("success");
        setTimeout(() => navigate({ to: "/dashboard" }), 1500);
        return;
      }

      // No code and no error — check if already signed in (implicit flow token in hash)
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        setStatus("success");
        setTimeout(() => navigate({ to: "/dashboard" }), 1500);
      } else {
        setStatus("error");
        setErrorMsg("No authentication token found. Please try signing in again.");
      }
    }

    handleCallback();
  }, [navigate]);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <div className="pointer-events-none fixed inset-0 bg-hero-glow opacity-40" />

      <header className="relative z-10 flex h-16 items-center px-6 sm:px-10">
        <Logo />
      </header>

      <main className="relative z-10 flex flex-1 items-center justify-center px-4 py-12">
        <div className="w-full max-w-[400px]">
          <div className="rounded-2xl border border-border bg-card shadow-[var(--shadow-card)] p-8 text-center">

            {status === "loading" && (
              <>
                <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 ring-8 ring-primary/5">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
                <h1 className="text-xl font-bold tracking-tight text-foreground">
                  Verifying your email…
                </h1>
                <p className="mt-2 text-sm text-muted-foreground">
                  Just a moment while we confirm your account.
                </p>
              </>
            )}

            {status === "success" && (
              <>
                <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 ring-8 ring-emerald-50/50">
                  <CheckCircle2 className="h-6 w-6 text-emerald-600" />
                </div>
                <h1 className="text-xl font-bold tracking-tight text-foreground">
                  Email verified!
                </h1>
                <p className="mt-2 text-sm text-muted-foreground">
                  Taking you to your dashboard…
                </p>
              </>
            )}

            {status === "expired" && (
              <>
                <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-amber-50 ring-8 ring-amber-50/50">
                  <AlertCircle className="h-6 w-6 text-amber-600" />
                </div>
                <h1 className="text-xl font-bold tracking-tight text-foreground">
                  Link expired
                </h1>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                  This verification link has expired. Request a new one and click it within 24 hours.
                </p>
                <div className="mt-6 flex flex-col gap-3">
                  <Link
                    to="/verify-email"
                    className="flex h-10 items-center justify-center rounded-lg bg-[image:var(--gradient-brand)] px-4 text-sm font-semibold text-white shadow-[var(--shadow-elegant)] hover:opacity-90 transition-opacity"
                  >
                    Resend verification email
                  </Link>
                  <Link
                    to="/signup"
                    className="flex h-10 items-center justify-center rounded-lg border border-input bg-background px-4 text-sm font-medium text-foreground hover:bg-muted transition-colors"
                  >
                    Back to sign up
                  </Link>
                </div>
              </>
            )}

            {status === "error" && (
              <>
                <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10 ring-8 ring-destructive/5">
                  <AlertCircle className="h-6 w-6 text-destructive" />
                </div>
                <h1 className="text-xl font-bold tracking-tight text-foreground">
                  Verification failed
                </h1>
                {errorMsg && (
                  <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                    {errorMsg}
                  </p>
                )}
                <div className="mt-6 flex flex-col gap-3">
                  <Link
                    to="/signup"
                    className="flex h-10 items-center justify-center rounded-lg bg-[image:var(--gradient-brand)] px-4 text-sm font-semibold text-white shadow-[var(--shadow-elegant)] hover:opacity-90 transition-opacity"
                  >
                    Try signing up again
                  </Link>
                  <Link
                    to="/login"
                    className="flex h-10 items-center justify-center rounded-lg border border-input bg-background px-4 text-sm font-medium text-foreground hover:bg-muted transition-colors"
                  >
                    Sign in instead
                  </Link>
                </div>
              </>
            )}

          </div>
        </div>
      </main>
    </div>
  );
}
