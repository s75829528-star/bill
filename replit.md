# Nexora Billing

AI-powered billing and business management landing page for modern Indian businesses.

## Stack

- **Framework**: TanStack Start (React 19 + SSR via Vite + Nitro)
- **Styling**: Tailwind CSS v4
- **UI components**: shadcn/ui (Radix primitives)
- **Auth**: Supabase Auth
- **Language**: TypeScript

## Running the app

```bash
npm run dev
```

Runs on **port 5000**. The workflow "Start application" handles this automatically.

## Environment variables

| Variable | Description |
|---|---|
| `VITE_SUPABASE_URL` | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Supabase anon/public key |

## Database setup

Run `supabase/schema.sql` in the Supabase SQL Editor to create:
- `profiles` table (auto-populated on signup via trigger)
- `categories` table — per-business inventory categories (RLS-protected)
- `suppliers` table — per-business supplier records (RLS-protected)
- `products` table — per-business product catalogue (RLS-protected)
- Row-level security policies (all inventory tables check `business.owner_id = auth.uid()`)
- `updated_at` auto-update trigger on all tables

### Inventory RLS
All three inventory tables (`categories`, `suppliers`, `products`) use:
```sql
exists (select 1 from public.business where id = business_id and owner_id = auth.uid())
```
so only the business owner sees their own data.

## Project structure

```
src/
  routes/
    index.tsx                   # Landing page (do not modify)
    __root.tsx                  # Root layout (AuthProvider lives here)
    login.tsx                   # /login
    signup.tsx                  # /signup
    forgot-password.tsx         # /forgot-password
    reset-password.tsx          # /reset-password
    verify-email.tsx            # /verify-email
    _authenticated.tsx          # Protected layout (redirects to /login if unauthed)
    _authenticated/
      onboarding.tsx            # Business setup wizard (protected, do not modify)
      _app.tsx                  # App shell (sidebar + topbar) for signed-in pages
      _app/
        dashboard.tsx           # /dashboard (protected, do not modify)
        billing.tsx             # /billing (protected) — Billing module, tab shell
        crm.tsx                 # /crm (protected) — CRM module, tab shell
        finance.tsx             # /finance (protected, "Coming soon" — do not modify)
        inventory.tsx           # /inventory (protected) — Inventory Management module, tab shell
        reports.tsx             # /reports (protected) — Reports & Analytics module, tab shell
  contexts/
    AuthContext.tsx             # AuthProvider, useAuth, useSession hooks
    BusinessContext.tsx         # BusinessProvider, useBusiness (business record + onboarding state)
  lib/
    supabase.ts                 # Lazy Supabase client (browser-only, SSR-safe)
    inventory-data.ts           # Mock data + types + helpers for the Inventory module (no backend)
    billing-data.ts             # Mock data + types + helpers for the Billing module (no backend)
    crm-data.ts                 # Mock data + types + helpers for the CRM module (no backend)
    reports-data.ts              # Mock data + types + helpers for the Reports & Analytics module (no backend)
  components/
    Logo.tsx                    # Shared Nexora logo component
    AppSidebar.tsx               # Sidebar nav for signed-in app
    ui/                         # shadcn/ui components
    inventory/
      shared.tsx                 # Shared UI primitives for Inventory tabs (SectionCard, StatTile, StatusPill, etc.)
      tabs/                       # One component per Inventory sub-section (Products, Categories, Suppliers, Purchase Orders, Stock In/Out/Adjustments, Low Stock, Barcode, Reports, Settings, ...)
    billing/
      shared.tsx                 # Shared UI primitives for Billing tabs (re-exports inventory shared.tsx atoms + BillingStatusPill, PaymentModeBadge, ModalShell, Checkbox)
      tabs/                       # One component per Billing sub-section (Overview, Invoices, InvoiceBuilder, InvoiceDetailView, Quotations, Credit Notes, Recurring, Payments, Templates, Settings)
    crm/
      shared.tsx                 # Shared UI primitives for CRM tabs (re-exports inventory shared.tsx atoms + CrmStatusPill, PriorityBadge, Checkbox, ModalShell, Avatar)
      tabs/                       # One component per CRM sub-section (Overview, Customers, CustomerProfile, Customer Groups, Leads, Follow Ups, Activities, Customer Reports, CRM Settings)
    reports/
      shared.tsx                 # Shared UI primitives for Reports tabs (SectionCard, KpiCard, ChartCard, TableWrapper/Th/Td, ExportBar, etc.)
      tabs/                       # One component per Reports sub-section (Executive Dashboard, Sales, Billing, Inventory, CRM, Finance, GST, Customer, Product Reports, Export Center, Report Settings)
  hooks/                        # React hooks
```

## Auth flow

```
Landing page (/)
  → Sign Up (/signup)
    → Verify Email (/verify-email)
  → Login (/login)
    → Dashboard (/dashboard)  ← protected
  → Forgot Password (/forgot-password)
    → Reset Password (/reset-password)
```

## Inventory Management module

`/inventory` is a self-contained, mock-data-only module (no backend, no Supabase calls) covering 15 sub-sections rendered as tabs within a single route: Overview, Products, Categories, Brands, Units, Suppliers, Purchase Orders, Purchase Bills, Stock In, Stock Out, Stock Adjustments, Low Stock, Barcode Management, Inventory Reports, Inventory Settings.

- All mock data (products, categories, brands, units, suppliers, purchase orders/bills, stock movements) and helpers live in `src/lib/inventory-data.ts`. Uses realistic Indian business data (₹ pricing, GST numbers, SKUs/barcodes).
- Shared UI primitives (cards, stat tiles, status pills, search/pagination, buttons) live in `src/components/inventory/shared.tsx`.
- Each tab is its own component under `src/components/inventory/tabs/`, wired together by the tab shell in `src/routes/_authenticated/_app/inventory.tsx`.
- All interactivity (create/edit/delete, search, filter, sort, pagination, CSV export) is client-side React state seeded from the mock data — nothing persists across a page reload, and there are no API/database calls.
- Follows the same design system as the rest of the app (rounded-2xl white cards, slate borders, brand gradient, recharts, framer-motion) — no new visual language was introduced.
- Landing page, Auth, Business Setup Wizard, Dashboard, and the Billing module were intentionally left untouched while building this.

## Billing module

`/billing` is a self-contained, mock-data-only module (no backend, no Supabase calls) covering GST invoicing for Indian businesses: Overview, Invoices (list + create/edit builder + view/PDF/thermal-receipt preview), Quotations (list + create + convert-to-invoice), Credit Notes, Recurring Invoices, Payments (history/pending/received/refunds/timeline), Invoice Templates, and Settings — rendered as tabs within a single route.

- All mock data (company profile, customers, invoices, quotations, credit notes, recurring invoices, payments, templates) and helpers (GST/CGST/SGST/IGST calculation, totals, formatting) live in `src/lib/billing-data.ts`. Line items reference the product catalog in `src/lib/inventory-data.ts` for consistency with Inventory. Uses realistic Indian business data (₹ pricing, GST numbers, HSN codes).
- Shared UI primitives live in `src/components/billing/shared.tsx`, re-exporting the Inventory module's atoms plus billing-specific ones (status pill, payment mode badge, modal shell).
- Each tab is its own component under `src/components/billing/tabs/`, wired together by the tab shell in `src/routes/_authenticated/_app/billing.tsx`.
- All interactivity (create/edit/delete, search, filter, sort, pagination, CSV/Excel export, print) is client-side React state seeded from the mock data — nothing persists across a page reload, and there are no API/database calls.
- Follows the same design system as the rest of the app — no new visual language was introduced.

## CRM module

`/crm` is a self-contained, mock-data-only module (no backend, no Supabase calls, no AI assistant, no WhatsApp/Email/SMS, no payment gateway, no automation workflows) covering customer relationship management for Indian businesses: Overview, Customers (list + full-profile detail view), Customer Groups (Retail/Wholesale/Corporate/VIP/Distributor/Dealer), Leads, Follow Ups, Activities, Customer Reports, and CRM Settings — rendered as tabs within a single route.

- All mock data (100 customers, 50 leads, follow-ups, activity feed, customer groups, settings) and helpers (formatting, stats, chart aggregations, lead funnel) live in `src/lib/crm-data.ts`, generated with a deterministic seeded PRNG so data is stable across reloads. Uses realistic Indian business data (₹ amounts, GSTIN, phone/email, city/state, outstanding balances, purchase/invoice history).
- Shared UI primitives live in `src/components/crm/shared.tsx`, re-exporting the Inventory module's atoms plus CRM-specific ones (status pill, priority badge, avatar, modal shell, checkbox).
- Each tab is its own component under `src/components/crm/tabs/`, wired together by the tab shell in `src/routes/_authenticated/_app/crm.tsx`. Selecting a customer from the Customers tab switches into a dedicated `CustomerProfile` detail view (Overview/Purchase History/Outstanding/Notes/Activity sub-tabs).
- All interactivity (create/edit/delete, search, filter, sort, pagination, CSV/Excel export) is client-side React state seeded from the mock data — nothing persists across a page reload, and there are no API/database calls.
- Follows the same design system as the rest of the app (rounded-2xl white cards, slate borders, brand gradient, recharts, framer-motion) — no new visual language was introduced.
- Landing page, Auth, Business Setup Wizard, Dashboard, Billing module, and Inventory module were intentionally left untouched while building this.

## Reports & Analytics module

`/reports` is a self-contained, mock-data-only module (no backend, no Supabase calls, no external API/AI) providing a Power BI/Tableau/Stripe-Dashboard-style analytics center covering 11 sub-sections rendered as tabs within a single route: Executive Dashboard, Sales Reports, Billing Reports, Inventory Reports, CRM Reports, Finance Reports, GST Reports, Customer Reports, Product Reports, Export Center, and Report Settings.

- All mock data (12-month trends for revenue/profit/cash flow/inventory/customer growth/GST, top customers/products/categories, sales by Daily/Weekly/Monthly/Quarterly/Yearly period, invoice/GST/finance/CRM breakdowns) and helpers live in `src/lib/reports-data.ts`, generated with a deterministic seeded PRNG so data is stable across reloads. Uses realistic Indian business data (₹ amounts, CGST/SGST/IGST, GSTIN-style reporting).
- The Executive Dashboard's global date-range filter (Today/This Week/This Month/.../Custom) and the Sales Reports period toggle (Daily/Weekly/Monthly/Quarterly/Yearly) are functionally wired to scale/select the underlying data, not just cosmetic.
- Shared UI primitives live in `src/components/reports/shared.tsx` (own set, following the same patterns as Inventory/Billing/CRM/Finance rather than importing across modules).
- Each tab is its own component under `src/components/reports/tabs/`, wired together by the tab shell in `src/routes/_authenticated/_app/reports.tsx`. Uses recharts for charts and framer-motion for KPI card entrance animation.
- Export Center and Report Settings are UI-only — export buttons show a mocked confirmation banner (no real file generation), and settings are local React state (not persisted).
- All interactivity is client-side React state seeded from the mock data — nothing persists across a page reload, and there are no API/database calls.
- Follows the same design system as the rest of the app (rounded-2xl white cards, slate borders, brand gradient, recharts, framer-motion) — no new visual language was introduced.
- Landing page, Auth, Business Setup Wizard, Dashboard, Billing, Inventory, CRM, and Finance modules were intentionally left untouched while building this.

## Notes

- The Supabase client uses a lazy Proxy to defer instantiation until the browser — safe for SSR with Node 20
- `_authenticated.tsx` is a pathless layout route; all routes inside `_authenticated/` are protected
- The landing page (`/`) and auth pages are public
- Vite config delegates to `@lovable.dev/vite-tanstack-config`; do not add duplicate plugins

## User preferences
