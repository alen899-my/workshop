# Inventory and repair billing

The Expo app (native and Expo web) uses the existing workshop theme and billing editor.

## Use

- Open **Inventory** to create products with a workshop-specific SKU, unit, prices, opening stock, reorder level, category and shelf location. Product photos and the existing tax selector are supported.
- Use **Receive stock** for deliveries and **Adjustment** for signed corrections, with a reason/reference. Stock history records the user, quantity, resulting balance, time and related repair.
- Open a repair, choose **Parts & inventory**, then **Inventory** in the bill editor. Product name, SKU, unit, price and image enter the bill. Quantities can include up to three decimal places; prices support two.
- Save billing details to issue stock. Editing saved quantities issues or returns only the difference. Unsaved selections do not reserve stock.
- Low-stock and archived filters are available. Archiving a product hides it from new selections without erasing its history. Existing issued items can still be returned.

## Stock accounting

Bill saves and stock movements commit in the same database transaction. Repair and product locks serialize competing updates; products lock in ascending ID order. Insufficient stock or a failed bill write rolls back the whole transaction.

The bill's `inventory_revision` rejects stale edits. A save retried with an old revision must reload the bill; it cannot issue the same stock again. Stock receipt/adjustment requests retain a `request_id` across connection failures so a retry does not repeat the movement.

Under the existing archive behavior, archiving a bill returns its inventory quantities once. Replacing an archived bill uses the archived revision but starts with zero issued quantities, so replacement quantities are deducted again. Archive a bill only when those inventory quantities should be returned to stock.

The quick amount-only editor cannot overwrite a bill containing inventory items without its revision. Inventory bills use the full billing screen. The separate Next.js frontend does not yet expose the inventory management UI; legacy clients cannot silently overwrite inventory bills.

## Database and deployment

Run from `backend` with the intended database configuration:

```powershell
npm run migrate:inventory
```

The repeatable transaction creates the product and movement tables, adds the bill revision, and grants `view:inventory` to repair-editing roles. Roles that manage settings receive `view:inventory` and `manage:inventory`. Existing per-user permission exclusions still apply. Refresh permissions or sign in again after migration.

Deploy/restart the backend containing `/api/inventory`, then reload the Expo app. The migration requires the existing shops, users, repairs, repair_bills, tax_settings and current role-permission tables. No live database migration or deployment is performed by the automated checks.

## Verification

```powershell
node --test tests/inventory.test.js
```

These checks use the installed development dependency `@electric-sql/pglite` in memory, without loading `.env`. They cover repeatable migration, permissions, receipt retries, negative-stock rejection, bill quantity changes, stale versions, archive/recreate accounting, transaction rollback and workshop isolation. They do not simulate multi-connection PostgreSQL locking or replace a device/browser acceptance check.
