-- Tax Settings Table
-- Stores per-shop tax configuration (globally flexible)
CREATE TABLE IF NOT EXISTS tax_settings (
  id SERIAL PRIMARY KEY,
  shop_id INTEGER REFERENCES shops(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,           -- e.g. "GST", "VAT", "Sales Tax", "HST"
  rate NUMERIC(5, 2) NOT NULL,          -- e.g. 18.00 for 18%
  description VARCHAR(255),            -- e.g. "Goods and Services Tax (India)"
  is_active BOOLEAN DEFAULT TRUE,       -- Can be toggled per tax rule
  is_inclusive BOOLEAN DEFAULT FALSE,   -- TRUE = tax is already included in price (UK/EU style), FALSE = added on top (US/India style)
  applies_to VARCHAR(50) DEFAULT 'all', -- 'all' | 'parts' | 'service'
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index for fast shop lookups
CREATE INDEX IF NOT EXISTS idx_tax_settings_shop_id ON tax_settings(shop_id);

-- Update repair_bills to store tax information per bill
ALTER TABLE repair_bills 
  ADD COLUMN IF NOT EXISTS tax_snapshot JSONB DEFAULT '[]', 
  ADD COLUMN IF NOT EXISTS tax_total NUMERIC(12,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS subtotal_before_tax NUMERIC(12,2) DEFAULT 0;
