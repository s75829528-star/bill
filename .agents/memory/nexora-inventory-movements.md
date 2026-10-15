---
name: Nexora Billing — inventory movements
description: Key design decisions for the stock management feature (inventory_movements table + service + hooks + tabs).
---

## DB trigger owns stock updates
`process_inventory_movement` is a BEFORE INSERT trigger on `inventory_movements`. It:
- Locks the product row
- Computes net change from `movement_type` + `adjustment_type`
- Stamps `previous_stock` / `new_stock` onto the movement row before it's written
- Updates `products.current_stock`
- Raises `errcode = 'insufficient_stock'` if stock would go negative

**Why:** Client code never directly touches `products.current_stock` — all stock changes flow through movements. This keeps the audit trail complete and stock always consistent.

## Service error handling
`inventoryMovementsService.create()` catches the Supabase error and re-throws with the original DB message when it contains "Insufficient stock" or "insufficient_stock". The UI then shows this string in a red banner.

## adjustment_type is always required for adjustment movements
The trigger branches on `adjustment_type` for adjustment movements. Without it, net_change = 0. The DB has no check constraint forcing it, but the UI always sends it.

## Pending approval pattern (StockAdjustmentsTab)
Pending adjustments live in local React state only. Stock is NOT updated until the user clicks "Approve" — at that point the movement is inserted into the DB and the trigger fires. Reject = just remove from local state, no DB write.

**Why:** Adjustments are higher-risk operations; they need a manager review step. Immediate DB insert would update stock before approval.

## React Query cache invalidation after any movement
Every mutation (stock in / out / adjustment) invalidates both:
- `movementKeys.byBusiness(businessId)` — the movements list
- `productKeys.byBusiness(businessId)` — products list (stock counts change)

## quantity is always positive in the DB
Direction is determined by `movement_type` + `adjustment_type`, not by sign.

## Dashboard InventoryOverview
`InventoryOverview` component in `dashboard.tsx` uses `useProducts` + `useInventoryMovements` to show: total products, inventory value (sum of current_stock × purchase_price), low-stock count, out-of-stock count, recent 6 movements.

## Schema must be re-applied after this feature
User must run the updated `supabase/schema.sql` in their Supabase SQL Editor. The new DDL is appended after the products trigger section.

## Pre-existing TS errors to ignore
- `src/components/crm/tabs/CustomersTab.tsx` — EmptyState `action` prop
- `src/lib/supabase.ts` — SupabaseClient type cast
- `src/routes/_authenticated/_app/dashboard.tsx:620` — recharts Tooltip payload type
