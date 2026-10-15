import { createFileRoute, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { BusinessProvider, useBusiness } from "../contexts/BusinessContext";

export const Route = createFileRoute("/_authenticated")({
  component: AuthenticatedLayout,
});

function Spinner() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Loading…</p>
      </div>
    </div>
  );
}

function AuthenticatedLayout() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate({ to: "/login" });
    }
  }, [user, loading, navigate]);

  if (loading) return <Spinner />;
  if (!user) return null;

  return (
    <BusinessProvider>
      <OnboardingGuard />
    </BusinessProvider>
  );
}

/**
 * Sits between the auth guard and the actual route outlet.
 * After the business record is loaded, redirects first-time users to /onboarding.
 * When the wizard sets onboardingCompleted → true in context, the effect re-runs
 * and the guard lets the user through to /dashboard.
 */
function OnboardingGuard() {
  const { businessLoading, onboardingCompleted } = useBusiness();
  const navigate = useNavigate();
  const { location } = useRouterState();
  const isOnOnboarding = location.pathname === "/onboarding";

  useEffect(() => {
    if (!businessLoading && !onboardingCompleted && !isOnOnboarding) {
      navigate({ to: "/onboarding" });
    }
  }, [businessLoading, onboardingCompleted, isOnOnboarding, navigate]);

  if (businessLoading) return <Spinner />;

  return <Outlet />;
}
