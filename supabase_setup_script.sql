
-- Run these commands in your Supabase SQL Editor.
-- Best to run them section by section.

-- Section 1: Create Enums (PostgreSQL Custom Types)
-- Ensure these match your Prisma schema. Run only if they don't exist.

DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'AdminRole') THEN CREATE TYPE "AdminRole" AS ENUM ('MANUAL_ORDER_TAKER', 'ORDER_PROCESSOR', 'BUSINESS_MANAGER'); END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ItemCategory') THEN CREATE TYPE "ItemCategory" AS ENUM ('COFFEE', 'SHAKES'); END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ItemServingType') THEN CREATE TYPE "ItemServingType" AS ENUM ('Cone', 'Cup'); END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'CustomizationType') THEN CREATE TYPE "CustomizationType" AS ENUM ('normal', 'sweet', 'bitter'); END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'PaymentMethod') THEN CREATE TYPE "PaymentMethod" AS ENUM ('Cash', 'UPI', 'Razorpay'); END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'OrderStatus') THEN CREATE TYPE "OrderStatus" AS ENUM ('AWAITING_PAYMENT_CONFIRMATION', 'PENDING_PREPARATION', 'PREPARING', 'READY_FOR_PICKUP', 'COMPLETED', 'CANCELLED'); END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'PaymentStatus') THEN CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'PAID', 'FAILED', 'REFUNDED'); END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'OrderSource') THEN CREATE TYPE "OrderSource" AS ENUM ('CUSTOMER_ONLINE', 'STAFF_MANUAL'); END IF; END $$;

-- Section 2: Drop Tables (in reverse order of dependency to avoid FK errors)
-- This is to ensure a clean slate if tables exist with incompatible schemas.
DROP TABLE IF EXISTS "OrderItem" CASCADE;
DROP TABLE IF EXISTS "MenuItem" CASCADE;
DROP TABLE IF EXISTS "Order" CASCADE;
DROP TABLE IF EXISTS "Product" CASCADE;
DROP TABLE IF EXISTS "AdminUser" CASCADE;
-- Also drop the _prisma_migrations table if you want a completely fresh start for Prisma
-- DROP TABLE IF EXISTS "_prisma_migrations" CASCADE;

-- Section 3: Create Tables
-- All 'id' fields that are CUIDs in Prisma are defined as TEXT here.

-- AdminUser Table
CREATE TABLE "AdminUser" (
    "id" TEXT NOT NULL PRIMARY KEY, -- Prisma CUID maps to TEXT
    "email" TEXT NOT NULL UNIQUE,
    "passwordHash" TEXT NOT NULL,
    "role" "AdminRole" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Product Table
CREATE TABLE "Product" (
    "id" TEXT NOT NULL PRIMARY KEY, -- Prisma CUID maps to TEXT
    "name" TEXT NOT NULL,
    "category" "ItemCategory" NOT NULL,
    "imageHint" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- MenuItem Table
CREATE TABLE "MenuItem" (
    "id" TEXT NOT NULL PRIMARY KEY, -- Prisma CUID maps to TEXT
    "productId" TEXT NOT NULL,      -- References Product.id (TEXT)
    "servingType" "ItemServingType" NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "MenuItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "MenuItem_productId_servingType_key" UNIQUE ("productId", "servingType")
);
CREATE INDEX "MenuItem_productId_idx" ON "MenuItem"("productId");

-- Order Table
CREATE TABLE "Order" (
    "id" TEXT NOT NULL PRIMARY KEY, -- Prisma CUID maps to TEXT
    "customerName" TEXT,
    "customerPhone" TEXT,
    "customerEmail" TEXT,
    "totalAmount" DOUBLE PRECISION NOT NULL,
    "paymentMethod" "PaymentMethod" NOT NULL,
    "paymentStatus" "PaymentStatus" NOT NULL,
    "status" "OrderStatus" NOT NULL,
    "orderSource" "OrderSource" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processedById" TEXT, -- References AdminUser.id (TEXT)
    "takenById" TEXT,     -- References AdminUser.id (TEXT)
    CONSTRAINT "Order_processedById_fkey" FOREIGN KEY ("processedById") REFERENCES "AdminUser"("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Order_takenById_fkey" FOREIGN KEY ("takenById") REFERENCES "AdminUser"("id") ON DELETE SET NULL ON UPDATE CASCADE
);
CREATE INDEX "Order_processedById_idx" ON "Order"("processedById");
CREATE INDEX "Order_takenById_idx" ON "Order"("takenById");

-- OrderItem Table
CREATE TABLE "OrderItem" (
    "id" TEXT NOT NULL PRIMARY KEY, -- Prisma CUID maps to TEXT
    "orderId" TEXT NOT NULL,        -- References Order.id (TEXT)
    "productId" TEXT NOT NULL,      -- References Product.id (TEXT)
    "productName" TEXT NOT NULL,
    "category" "ItemCategory" NOT NULL,
    "servingType" "ItemServingType" NOT NULL,
    "quantity" INTEGER NOT NULL,
    "priceAtPurchase" DOUBLE PRECISION NOT NULL,
    "customization" "CustomizationType" NOT NULL DEFAULT 'normal',
    CONSTRAINT "OrderItem_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "OrderItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE INDEX "OrderItem_orderId_idx" ON "OrderItem"("orderId");
CREATE INDEX "OrderItem_productId_idx" ON "OrderItem"("productId");


-- Section 4: Seed Initial Data
-- (Same seed data as before)

-- Seed AdminUsers (using emails as IDs to match current app logic for takenById/processedById)
INSERT INTO "AdminUser" ("id", "email", "passwordHash", "role", "updatedAt")
VALUES
('manualorder@caffico.com', 'manualorder@caffico.com', 'hashed_manual_pass', 'MANUAL_ORDER_TAKER', CURRENT_TIMESTAMP),
('processor@caffico.com', 'processor@caffico.com', 'hashed_processor_pass', 'ORDER_PROCESSOR', CURRENT_TIMESTAMP),
('manager@caffico.com', 'manager@caffico.com', 'hashed_manager_pass', 'BUSINESS_MANAGER', CURRENT_TIMESTAMP)
ON CONFLICT ("id") DO NOTHING;

-- Seed Products (based on src/lib/constants.ts)
INSERT INTO "Product" ("id", "name", "category", "imageHint", "updatedAt")
VALUES
('prod_cff_van', 'Vanilla', 'COFFEE', 'vanilla coffee', CURRENT_TIMESTAMP),
('prod_cff_org', 'Original', 'COFFEE', 'coffee', CURRENT_TIMESTAMP),
('prod_cff_hzn', 'Hazelnut', 'COFFEE', 'hazelnut coffee', CURRENT_TIMESTAMP),
('prod_cff_moc', 'Mocha', 'COFFEE', 'mocha coffee', CURRENT_TIMESTAMP),
('prod_cff_crm', 'Caramel', 'COFFEE', 'caramel coffee', CURRENT_TIMESTAMP),
('prod_cff_cho', 'Chocolate Coffee', 'COFFEE', 'chocolate coffee', CURRENT_TIMESTAMP),
('prod_shk_cho', 'Chocolate Shake', 'SHAKES', 'chocolate shake', CURRENT_TIMESTAMP),
('prod_shk_kit', 'KitKat', 'SHAKES', 'kitkat shake', CURRENT_TIMESTAMP),
('prod_shk_oro', 'Oreo', 'SHAKES', 'oreo shake', CURRENT_TIMESTAMP),
('prod_shk_str', 'Strawberry', 'SHAKES', 'strawberry shake', CURRENT_TIMESTAMP),
('prod_shk_ocf', 'Oreo Coffee Shake', 'SHAKES', 'oreo coffee shake', CURRENT_TIMESTAMP)
ON CONFLICT ("id") DO NOTHING;

-- Seed MenuItems (Prices for Product Serving Types)
INSERT INTO "MenuItem" ("id", "productId", "servingType", "price", "updatedAt")
VALUES
('menu_cff_van_cone', 'prod_cff_van', 'Cone', 130, CURRENT_TIMESTAMP),
('menu_cff_van_cup',  'prod_cff_van', 'Cup',  150, CURRENT_TIMESTAMP),
('menu_cff_org_cone', 'prod_cff_org', 'Cone', 130, CURRENT_TIMESTAMP),
('menu_cff_org_cup',  'prod_cff_org', 'Cup',  150, CURRENT_TIMESTAMP),
('menu_cff_hzn_cone', 'prod_cff_hzn', 'Cone', 130, CURRENT_TIMESTAMP),
('menu_cff_hzn_cup',  'prod_cff_hzn', 'Cup',  150, CURRENT_TIMESTAMP),
('menu_cff_moc_cone', 'prod_cff_moc', 'Cone', 130, CURRENT_TIMESTAMP),
('menu_cff_moc_cup',  'prod_cff_moc', 'Cup',  150, CURRENT_TIMESTAMP),
('menu_cff_crm_cone', 'prod_cff_crm', 'Cone', 130, CURRENT_TIMESTAMP),
('menu_cff_crm_cup',  'prod_cff_crm', 'Cup',  150, CURRENT_TIMESTAMP),
('menu_cff_cho_cone', 'prod_cff_cho', 'Cone', 130, CURRENT_TIMESTAMP),
('menu_cff_cho_cup',  'prod_cff_cho', 'Cup',  150, CURRENT_TIMESTAMP),
('menu_shk_cho_cone', 'prod_shk_cho', 'Cone', 180, CURRENT_TIMESTAMP),
('menu_shk_cho_cup',  'prod_shk_cho', 'Cup',  200, CURRENT_TIMESTAMP),
('menu_shk_kit_cone', 'prod_shk_kit', 'Cone', 180, CURRENT_TIMESTAMP),
('menu_shk_kit_cup',  'prod_shk_kit', 'Cup',  200, CURRENT_TIMESTAMP),
('menu_shk_oro_cone', 'prod_shk_oro', 'Cone', 180, CURRENT_TIMESTAMP),
('menu_shk_oro_cup',  'prod_shk_oro', 'Cup',  200, CURRENT_TIMESTAMP),
('menu_shk_str_cone', 'prod_shk_str', 'Cone', 180, CURRENT_TIMESTAMP),
('menu_shk_str_cup',  'prod_shk_str', 'Cup',  200, CURRENT_TIMESTAMP),
('menu_shk_ocf_cone', 'prod_shk_ocf', 'Cone', 180, CURRENT_TIMESTAMP),
('menu_shk_ocf_cup',  'prod_shk_ocf', 'Cup',  200, CURRENT_TIMESTAMP)
ON CONFLICT ("id") DO NOTHING;

    