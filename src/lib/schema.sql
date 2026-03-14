-- ============================================================
-- Velora Dropshipping — Database Schema
-- Run this in your Supabase SQL Editor to create all tables.
-- ============================================================

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─── Products ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cj_product_id TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    image_url TEXT,
    category TEXT,
    warehouse TEXT DEFAULT 'CN',          -- CJ warehouse country code (e.g. 'US', 'CN')
    base_cost DECIMAL(10,2) DEFAULT 0,    -- Raw CJ sell price (our cost from CJ)
    sell_price DECIMAL(10,2) DEFAULT 0,   -- Marked-up sell price shown to customers
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_products_cj_id ON products(cj_product_id);
CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_products_active ON products(is_active);

-- ─── Product Variants ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS product_variants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    cj_variant_id TEXT UNIQUE NOT NULL,
    name TEXT,
    image_url TEXT,
    base_cost DECIMAL(10,2) DEFAULT 0,  -- Raw CJ variant cost
    sell_price DECIMAL(10,2) DEFAULT 0, -- Marked-up variant price
    stock INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_variants_product ON product_variants(product_id);
CREATE INDEX idx_variants_cj_id ON product_variants(cj_variant_id);

-- ─── Customers ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS customers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE NOT NULL,
    first_name TEXT,
    last_name TEXT,
    phone TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_customers_email ON customers(email);

-- ─── Orders ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_number TEXT UNIQUE NOT NULL,
    customer_id UUID REFERENCES customers(id),
    cj_order_id TEXT,
    status TEXT DEFAULT 'pending',
    shipping_name TEXT,
    shipping_address TEXT,
    shipping_city TEXT,
    shipping_state TEXT,
    shipping_zip TEXT,
    shipping_country TEXT DEFAULT 'US',
    shipping_phone TEXT,
    tracking_number TEXT,
    courier TEXT,                  -- shipping carrier name (e.g. CJPacket Ordinary)
    tracking_updated_at TIMESTAMPTZ, -- last time tracking was polled from CJ
    cj_logistic TEXT,              -- shipping method used (e.g. CJPacket Ordinary)
    cj_error TEXT,                 -- last CJ submission error message
    total DECIMAL(10,2) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_orders_customer ON orders(customer_id);
CREATE INDEX idx_orders_cj_id ON orders(cj_order_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_number ON orders(order_number);

-- ─── Order Items ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id),
    variant_id UUID REFERENCES product_variants(id),
    cj_vid TEXT,               -- CJ variant ID (stored for retry submission)
    product_title TEXT,
    variant_name TEXT,
    image_url TEXT,
    quantity INTEGER DEFAULT 1,
    unit_price DECIMAL(10,2) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_order_items_order ON order_items(order_id);

-- ─── Sync Logs ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS sync_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    type TEXT NOT NULL,  -- 'product_import', 'price_update', 'tracking_update'
    status TEXT DEFAULT 'started',  -- 'started', 'completed', 'failed'
    products_synced INTEGER DEFAULT 0,
    details JSONB,
    error_message TEXT,
    started_at TIMESTAMPTZ DEFAULT now(),
    completed_at TIMESTAMPTZ
);

CREATE INDEX idx_sync_logs_type ON sync_logs(type);
CREATE INDEX idx_sync_logs_status ON sync_logs(status);

-- ─── Updated_at Trigger ──────────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER products_updated_at
    BEFORE UPDATE ON products
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER product_variants_updated_at
    BEFORE UPDATE ON product_variants
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER customers_updated_at
    BEFORE UPDATE ON customers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER orders_updated_at
    BEFORE UPDATE ON orders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ─── Migration (run if upgrading existing DB) ────────────────
-- Run these ALTER statements if the tables already exist.
-- They are safe to run multiple times (IF NOT EXISTS / ADD COLUMN).

ALTER TABLE products
    ADD COLUMN IF NOT EXISTS base_cost DECIMAL(10,2) DEFAULT 0,
    ADD COLUMN IF NOT EXISTS warehouse TEXT DEFAULT 'CN';

ALTER TABLE product_variants
    ADD COLUMN IF NOT EXISTS base_cost DECIMAL(10,2) DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_products_warehouse ON products(warehouse);

ALTER TABLE orders
    ADD COLUMN IF NOT EXISTS cj_logistic TEXT,
    ADD COLUMN IF NOT EXISTS cj_error TEXT,
    ADD COLUMN IF NOT EXISTS courier TEXT,
    ADD COLUMN IF NOT EXISTS tracking_updated_at TIMESTAMPTZ;

ALTER TABLE order_items
    ADD COLUMN IF NOT EXISTS cj_vid TEXT;

-- Recalculate sell_price from base_cost for any existing rows
-- (After running migration, re-sync prices from Admin → Sync Prices)

