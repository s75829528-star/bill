export function Logo({ className = "" }: { className?: string }) {
  return (
    <a href="/" className={"flex items-center gap-2.5 " + className}>
      <span className="relative grid h-8 w-8 place-items-center rounded-xl bg-[image:var(--gradient-brand)] shadow-[var(--shadow-elegant)]">
        <span className="absolute inset-0.5 rounded-[10px] bg-black/15" />
        <span className="relative text-sm font-black text-white tracking-tight">N</span>
      </span>
      <span className="text-[17px] font-bold tracking-tight text-foreground">Nexora</span>
    </a>
  );
}
