BEGIN;

CREATE TABLE IF NOT EXISTS inventory_products (
  id SERIAL PRIMARY KEY,
  shop_id INTEGER NOT NULL REFERENCES shops(id),
  sku VARCHAR(80) NOT NULL,
  name VARCHAR(160) NOT NULL,
  category VARCHAR(80) NOT NULL DEFAULT '',
  unit VARCHAR(30) NOT NULL DEFAULT 'piece',
  location VARCHAR(120) NOT NULL DEFAULT '',
  cost_price NUMERIC(14,2) NOT NULL DEFAULT 0 CHECK (cost_price >= 0),
  selling_price NUMERIC(14,2) NOT NULL DEFAULT 0 CHECK (selling_price >= 0),
  stock NUMERIC(14,3) NOT NULL DEFAULT 0 CHECK (stock >= 0),
  reorder_level NUMERIC(14,3) NOT NULL DEFAULT 0 CHECK (reorder_level >= 0),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  version INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (shop_id, sku)
);

CREATE TABLE IF NOT EXISTS inventory_movements (
  id BIGSERIAL PRIMARY KEY,
  shop_id INTEGER NOT NULL REFERENCES shops(id),
  product_id INTEGER NOT NULL REFERENCES inventory_products(id),
  repair_id INTEGER REFERENCES repairs(id),
  actor_id INTEGER REFERENCES users(id),
  quantity NUMERIC(14,3) NOT NULL CHECK (quantity <> 0),
  balance_after NUMERIC(14,3) NOT NULL CHECK (balance_after >= 0),
  kind VARCHAR(30) NOT NULL CHECK (kind IN ('opening', 'receipt', 'adjustment', 'repair_issue', 'repair_return')),
  reason VARCHAR(300) NOT NULL,
  request_id VARCHAR(100),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (shop_id, request_id)
);
CREATE INDEX IF NOT EXISTS inventory_products_shop ON inventory_products(shop_id, is_active, name);
CREATE INDEX IF NOT EXISTS inventory_movements_product ON inventory_movements(product_id, id DESC);
ALTER TABLE repair_bills ADD COLUMN IF NOT EXISTS inventory_revision INTEGER NOT NULL DEFAULT 0;

INSERT INTO permissions (module_name, permission_name, slug, description)
VALUES ('Inventory', 'View inventory', 'view:inventory', 'View products, availability and stock history'),
       ('Inventory', 'Manage inventory', 'manage:inventory', 'Manage products and record stock changes')
ON CONFLICT (slug) DO NOTHING;

-- Current RBAC uses role_id/permission_id. Copy existing workshop settings access;
-- grant read access to roles that can edit repairs, without broadening stock write access.
INSERT INTO role_permissions (role_id, permission_id)
SELECT DISTINCT rp.role_id, target.id
FROM role_permissions rp JOIN permissions source ON source.id = rp.permission_id
CROSS JOIN permissions target
WHERE (source.slug = 'manage:settings' AND target.slug IN ('view:inventory', 'manage:inventory'))
   OR (source.slug = 'edit:repair' AND target.slug = 'view:inventory')
ON CONFLICT DO NOTHING;
COMMIT;
