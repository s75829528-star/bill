---
name: Nexora Purchase Flow
description: Durable decisions for the Inventory purchase order, goods receipt, purchase bill, and supplier payable flow.
---

# Nexora Purchase Flow

## Rule
Purchase Orders, goods receipts, and Purchase Bills use dedicated Supabase tables and RPCs rather than client-only state. Goods receipt must create inventory movements in the same database transaction so the existing stock trigger remains the source of truth for `products.current_stock`.

**Why:** A receipt that updates the PO but not stock, or stock without a matching receipt, makes inventory and supplier records diverge.

**How to apply:** Keep receiving inside `receive_purchase_goods`; do not directly edit product stock in purchase-order UI code.

## Rule
Purchase bill creation and payment update supplier `outstanding_amount` in the same database operation and retain payment rows in `purchase_bill_payments`.

**Why:** Supplier payable totals must survive reloads and remain auditable.

**How to apply:** Use `create_purchase_bill` and `record_purchase_bill_payment`; the UI should invalidate both purchase bills and suppliers after mutations.

## Schema
Run `supabase/schema_purchase_flow.sql` after the base schema. It creates purchase order/item, goods received note/item, purchase bill, and purchase bill payment tables plus RLS policies, indexes, numbering sequences, and RPCs.