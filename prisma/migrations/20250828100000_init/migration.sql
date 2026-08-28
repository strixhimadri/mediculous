-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- CreateEnum
CREATE TYPE "user_role" AS ENUM ('admin', 'retailer');
CREATE TYPE "order_status" AS ENUM ('pending', 'approved', 'dispatched', 'rejected');

-- CreateTable
CREATE TABLE "franchises" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL DEFAULT '',
    "whatsapp" TEXT NOT NULL DEFAULT '',
    "yearly_order" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "aov" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "month_potential" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "this_month" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "change_pct" DECIMAL(8,2) NOT NULL DEFAULT 0,
    "last_order" TIMESTAMPTZ,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "franchises_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "profiles" (
    "id" UUID NOT NULL,
    "role" "user_role" NOT NULL DEFAULT 'retailer',
    "franchise_id" UUID,
    "display_name" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "profiles_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "retailer_requires_franchise" CHECK (role = 'admin' OR franchise_id IS NOT NULL OR active = false)
);

CREATE TABLE "wholesaler_stock" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "brand" TEXT,
    "sku" TEXT NOT NULL DEFAULT '',
    "hsn" TEXT NOT NULL DEFAULT '',
    "gst" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "expiry" DATE NOT NULL,
    "buying_price" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "selling_price" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "pack_size" TEXT NOT NULL DEFAULT '',
    "batch" TEXT NOT NULL,
    "shelf" TEXT NOT NULL DEFAULT '',
    "purchased" INTEGER NOT NULL DEFAULT 0,
    "sold" INTEGER NOT NULL DEFAULT 0,
    "qty_available" INTEGER NOT NULL DEFAULT 0,
    "qty_reserved" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "wholesaler_stock_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "wholesaler_stock_qty_check" CHECK (qty_available >= qty_reserved AND qty_reserved >= 0)
);

CREATE TABLE "orders" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "franchise_id" UUID NOT NULL,
    "status" "order_status" NOT NULL DEFAULT 'pending',
    "bill_number" TEXT NOT NULL DEFAULT '',
    "bill_date" DATE,
    "invoice_note" TEXT,
    "remark" TEXT,
    "total_amount" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "approved_at" TIMESTAMPTZ,
    "dispatched_at" TIMESTAMPTZ,
    "rejected_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "orders_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "order_lines" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "order_id" UUID NOT NULL,
    "medicine_name" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "batch" TEXT NOT NULL DEFAULT '',
    "price_per_unit" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "gst" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "order_lines_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "order_lines_quantity_check" CHECK (quantity > 0)
);

CREATE TABLE "retailer_inventory" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "franchise_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "brand" TEXT,
    "batch" TEXT NOT NULL,
    "expiry" DATE NOT NULL,
    "hsn" TEXT NOT NULL DEFAULT '',
    "gst" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "pack_size" TEXT NOT NULL DEFAULT '',
    "shelf" TEXT NOT NULL DEFAULT '',
    "qty" INTEGER NOT NULL DEFAULT 0,
    "source_order_id" UUID,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "retailer_inventory_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "retailer_inventory_qty_check" CHECK (qty >= 0)
);

CREATE TABLE "audit_log" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "actor_id" UUID,
    "action" TEXT NOT NULL,
    "entity_type" TEXT NOT NULL,
    "entity_id" UUID,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "audit_log_pkey" PRIMARY KEY ("id")
);

-- Indexes
CREATE UNIQUE INDEX "wholesaler_stock_name_batch_key" ON "wholesaler_stock"("name", "batch");
CREATE INDEX "idx_wholesaler_stock_name" ON "wholesaler_stock"("name");
CREATE INDEX "idx_wholesaler_stock_expiry" ON "wholesaler_stock"("expiry");
CREATE INDEX "idx_orders_franchise" ON "orders"("franchise_id");
CREATE INDEX "idx_orders_status" ON "orders"("status");
CREATE INDEX "idx_order_lines_order" ON "order_lines"("order_id");
CREATE UNIQUE INDEX "retailer_inventory_franchise_id_name_batch_key" ON "retailer_inventory"("franchise_id", "name", "batch");
CREATE INDEX "idx_retailer_inventory_franchise" ON "retailer_inventory"("franchise_id");
CREATE INDEX "idx_profiles_franchise" ON "profiles"("franchise_id");

-- ForeignKeys
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_franchise_id_fkey" FOREIGN KEY ("franchise_id") REFERENCES "franchises"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "orders" ADD CONSTRAINT "orders_franchise_id_fkey" FOREIGN KEY ("franchise_id") REFERENCES "franchises"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "order_lines" ADD CONSTRAINT "order_lines_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "retailer_inventory" ADD CONSTRAINT "retailer_inventory_franchise_id_fkey" FOREIGN KEY ("franchise_id") REFERENCES "franchises"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "retailer_inventory" ADD CONSTRAINT "retailer_inventory_source_order_id_fkey" FOREIGN KEY ("source_order_id") REFERENCES "orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Auth trigger: auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, active)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)),
    false
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Profile escalation prevention
CREATE OR REPLACE FUNCTION public.prevent_profile_escalation()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF OLD.role = 'admin' THEN RETURN NEW; END IF;
  IF NEW.role IS DISTINCT FROM OLD.role THEN RAISE EXCEPTION 'Cannot change role'; END IF;
  IF NEW.franchise_id IS DISTINCT FROM OLD.franchise_id THEN RAISE EXCEPTION 'Cannot change franchise'; END IF;
  IF NEW.active IS DISTINCT FROM OLD.active THEN RAISE EXCEPTION 'Cannot change account status'; END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS profiles_prevent_escalation ON public.profiles;
CREATE TRIGGER profiles_prevent_escalation
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.prevent_profile_escalation();

-- updated_at trigger
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

CREATE TRIGGER wholesaler_stock_updated BEFORE UPDATE ON public.wholesaler_stock FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER franchises_updated BEFORE UPDATE ON public.franchises FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER orders_updated BEFORE UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER retailer_inventory_updated BEFORE UPDATE ON public.retailer_inventory FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER profiles_updated BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
