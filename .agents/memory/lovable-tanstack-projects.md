---
name: Lovable-imported TanStack Start projects
description: Setup quirks for projects imported from Lovable using @lovable.dev/vite-tanstack-config + Supabase.
---

- These projects ship both `bun.lock` and `package-lock.json`; `bunfig.toml` marks bun as canonical. Prefer `bun install` over `npm install`.
- `vite.config.ts` wraps `@lovable.dev/vite-tanstack-config`, which already bundles TanStack Start/devtools, React, Tailwind, tsconfig-paths, nitro, and sandbox port/host detection. Don't add those plugins manually or duplicate-plugin errors occur.
- Supabase auth/DB has no first-class Replit integration/connector — credentials (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`) must be requested from the user via `requestSecrets` and the project's own `supabase/*.sql` files run manually in the user's Supabase SQL Editor.
- A hydration-mismatch console warning about `data-tsd-source` attribute values differing is from Lovable's own dev tooling (tsd-source markers) — benign, dev-only, not an app bug.
- The `business` table (not `businesses`) stores the business record; `owner_id` references `auth.users.id`. RLS on inventory tables checks `exists (select 1 from public.business where id = business_id and owner_id = auth.uid())`.
- Pre-existing TypeScript errors in `CustomersTab.tsx`, `supabase.ts`, and `dashboard.tsx` — do not introduce new ones, but these three are safe to ignore.
- Service layer pattern: `src/services/<entity>.ts` holds DB types + CRUD; `src/hooks/use<Entity>Query.ts` holds React Query hooks. Components import hooks, not supabase directly.
- Inventory `products` table stores extended UI fields (`mrp`, `cost_price`, `hsn_code`, `brand_id`, `unit_id`, etc.) beyond the spec minimum so the existing form works without redesign. Brands and units remain static mock data (not in DB).
