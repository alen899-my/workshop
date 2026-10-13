BEGIN;
ALTER TABLE repairs ADD COLUMN IF NOT EXISTS version INTEGER NOT NULL DEFAULT 1;
ALTER TABLE repairs ADD COLUMN IF NOT EXISTS request_id VARCHAR(100);
ALTER TABLE repairs ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;
CREATE UNIQUE INDEX IF NOT EXISTS repairs_request_identity ON repairs(shop_id, request_id) WHERE request_id IS NOT NULL;
ALTER TABLE repair_bills ADD COLUMN IF NOT EXISTS inventory_revision INTEGER NOT NULL DEFAULT 0;
ALTER TABLE repair_bills ADD COLUMN IF NOT EXISTS payment_method VARCHAR(50);
CREATE INDEX IF NOT EXISTS repairs_shop_progress ON repairs(shop_id, status, created_at) WHERE deleted_at IS NULL;
COMMIT;
