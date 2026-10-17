export function ModuleTabFallback() {
  return (
    <div role="status" aria-label="Loading section" aria-busy="true" className="space-y-4">
      <div className="h-8 w-1/3 animate-pulse rounded-md bg-primary/10" />
      <div className="h-32 w-full animate-pulse rounded-2xl bg-primary/10" />
      <div className="h-48 w-full animate-pulse rounded-2xl bg-primary/10" />
    </div>
  );
}
