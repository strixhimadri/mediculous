-- Mediculoes wholesale platform — secure schema with RLS
-- Run in Supabase SQL Editor or via supabase db push

-- Extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Enums
CREATE TYPE public.user_role AS ENUM ('admin', 'retailer');
CREATE TYPE public.order_status AS ENUM ('pending', 'approved', 'dispatched', 'rejected');

-- Franchises (retailer partners)
CREATE TABLE public.franchises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  phone TEXT NOT NULL DEFAULT '',
  whatsapp TEXT NOT NULL DEFAULT '',
  yearly_order NUMERIC(14, 2) NOT NULL DEFAULT 0,
  aov NUMERIC(14, 2) NOT NULL DEFAULT 0,
  month_potential NUMERIC(14, 2) NOT NULL DEFAULT 0,
  this_month NUMERIC(14, 2) NOT NULL DEFAULT 0,
  change_pct NUMERIC(8, 2) NOT NULL DEFAULT 0,
  last_order TIMESTAMPTZ,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- User profiles (extends auth.users)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.user_role NOT NULL DEFAULT 'retailer',
  franchise_id UUID REFERENCES public.franchises(id) ON DELETE SET NULL,
  display_name TEXT,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT retailer_requires_franchise CHECK (
    role = 'admin' OR franchise_id IS NOT NULL
  )
);

-- Wholesaler master stock
CREATE TABLE public.wholesaler_stock (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  brand TEXT,
  sku TEXT NOT NULL DEFAULT '',
  hsn TEXT NOT NULL DEFAULT '',
  gst NUMERIC(5, 2) NOT NULL DEFAULT 0,
  expiry DATE NOT NULL,
  buying_price NUMERIC(12, 2) NOT NULL DEFAULT 0,
  selling_price NUMERIC(12, 2) NOT NULL DEFAULT 0,
  pack_size TEXT NOT NULL DEFAULT '',
  batch TEXT NOT NULL,
  shelf TEXT NOT NULL DEFAULT '',
  purchased INTEGER NOT NULL DEFAULT 0,
  sold INTEGER NOT NULL DEFAULT 0,
  qty_available INTEGER NOT NULL DEFAULT 0,
  qty_reserved INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (name, batch)
);

-- Orders
CREATE TABLE public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  franchise_id UUID NOT NULL REFERENCES public.franchises(id) ON DELETE RESTRICT,
  status public.order_status NOT NULL DEFAULT 'pending',
  bill_number TEXT NOT NULL DEFAULT '',
  bill_date DATE,
  invoice_note TEXT,
  remark TEXT,
  total_amount NUMERIC(14, 2) NOT NULL DEFAULT 0,
  approved_at TIMESTAMPTZ,
  dispatched_at TIMESTAMPTZ,
  rejected_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.order_lines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  medicine_name TEXT NOT NULL,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  batch TEXT NOT NULL DEFAULT '',
  price_per_unit NUMERIC(12, 2) NOT NULL DEFAULT 0,
  gst NUMERIC(5, 2) NOT NULL DEFAULT 0,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Retailer on-hand inventory (after dispatch)
CREATE TABLE public.retailer_inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  franchise_id UUID NOT NULL REFERENCES public.franchises(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  brand TEXT,
  batch TEXT NOT NULL,
  expiry DATE NOT NULL,
  hsn TEXT NOT NULL DEFAULT '',
  gst NUMERIC(5, 2) NOT NULL DEFAULT 0,
  pack_size TEXT NOT NULL DEFAULT '',
  shelf TEXT NOT NULL DEFAULT '',
  qty INTEGER NOT NULL DEFAULT 0 CHECK (qty >= 0),
  source_order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (franchise_id, name, batch)
);

-- Audit log for sensitive actions
CREATE TABLE public.audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_wholesaler_stock_name ON public.wholesaler_stock (name);
CREATE INDEX idx_wholesaler_stock_expiry ON public.wholesaler_stock (expiry);
CREATE INDEX idx_orders_franchise ON public.orders (franchise_id);
CREATE INDEX idx_orders_status ON public.orders (status);
CREATE INDEX idx_order_lines_order ON public.order_lines (order_id);
CREATE INDEX idx_retailer_inventory_franchise ON public.retailer_inventory (franchise_id);
CREATE INDEX idx_profiles_franchise ON public.profiles (franchise_id);

-- Retailer-safe catalog view (no buying price, no reserved internals)
CREATE VIEW public.catalog_stock
WITH (security_invoker = true)
AS
SELECT
  id,
  name,
  brand,
  sku,
  hsn,
  gst,
  expiry,
  selling_price,
  pack_size,
  batch,
  GREATEST(qty_available - qty_reserved, 0) AS qty_available
FROM public.wholesaler_stock
WHERE qty_available - qty_reserved > 0;

-- Security helper functions
CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS public.user_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid() AND active = true;
$$;

CREATE OR REPLACE FUNCTION public.current_franchise_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT franchise_id FROM public.profiles WHERE id = auth.uid() AND active = true;
$$;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin' AND active = true
  );
$$;

CREATE OR REPLACE FUNCTION public.is_active_retailer()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'retailer' AND active = true AND franchise_id IS NOT NULL
  );
$$;

-- Auto-create profile on signup (default retailer — admin must be set manually)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)));
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- updated_at trigger
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER wholesaler_stock_updated BEFORE UPDATE ON public.wholesaler_stock
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER franchises_updated BEFORE UPDATE ON public.franchises
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER orders_updated BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER retailer_inventory_updated BEFORE UPDATE ON public.retailer_inventory
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER profiles_updated BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- RLS
ALTER TABLE public.franchises ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wholesaler_stock ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.retailer_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY profiles_select_own ON public.profiles
  FOR SELECT TO authenticated
  USING (id = auth.uid() OR public.is_admin());

CREATE POLICY profiles_update_own ON public.profiles
  FOR UPDATE TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

CREATE POLICY profiles_admin_all ON public.profiles
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Franchises policies
CREATE POLICY franchises_admin_all ON public.franchises
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY franchises_retailer_read_own ON public.franchises
  FOR SELECT TO authenticated
  USING (id = public.current_franchise_id());

-- Wholesaler stock — admin full access only (retailers use catalog_stock view)
CREATE POLICY stock_admin_all ON public.wholesaler_stock
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Orders — admin all
CREATE POLICY orders_admin_all ON public.orders
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Orders — retailer own franchise
CREATE POLICY orders_retailer_own ON public.orders
  FOR SELECT TO authenticated
  USING (franchise_id = public.current_franchise_id());

CREATE POLICY orders_retailer_insert ON public.orders
  FOR INSERT TO authenticated
  WITH CHECK (
    public.is_active_retailer()
    AND franchise_id = public.current_franchise_id()
    AND status = 'pending'
  );

-- Order lines — admin via order ownership
CREATE POLICY order_lines_admin ON public.order_lines
  FOR ALL TO authenticated
  USING (
    public.is_admin()
    OR EXISTS (
      SELECT 1 FROM public.orders o
      WHERE o.id = order_id AND o.franchise_id = public.current_franchise_id()
    )
  )
  WITH CHECK (
    public.is_admin()
    OR EXISTS (
      SELECT 1 FROM public.orders o
      WHERE o.id = order_id
        AND o.franchise_id = public.current_franchise_id()
        AND o.status = 'pending'
    )
  );

-- Retailer inventory
CREATE POLICY retailer_inventory_admin ON public.retailer_inventory
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY retailer_inventory_own ON public.retailer_inventory
  FOR SELECT TO authenticated
  USING (franchise_id = public.current_franchise_id());

CREATE POLICY retailer_inventory_update_own ON public.retailer_inventory
  FOR UPDATE TO authenticated
  USING (franchise_id = public.current_franchise_id())
  WITH CHECK (franchise_id = public.current_franchise_id());

-- Audit log — admin read only; inserts via RPC
CREATE POLICY audit_admin_read ON public.audit_log
  FOR SELECT TO authenticated
  USING (public.is_admin());

-- Grant catalog view (retailer-safe; no buying_price)
GRANT SELECT ON public.catalog_stock TO authenticated;

-- Secure RPC: upsert stock batches (admin only)
CREATE OR REPLACE FUNCTION public.upsert_stock_batches(rows JSONB)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  row JSONB;
  upserted INTEGER := 0;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Forbidden: admin only';
  END IF;

  FOR row IN SELECT * FROM jsonb_array_elements(rows)
  LOOP
    INSERT INTO public.wholesaler_stock (
      name, brand, sku, hsn, gst, expiry,
      buying_price, selling_price, pack_size, batch, shelf,
      purchased, sold, qty_available
    ) VALUES (
      row->>'name',
      NULLIF(row->>'brand', ''),
      COALESCE(row->>'sku', ''),
      COALESCE(row->>'hsn', ''),
      COALESCE((row->>'gst')::NUMERIC, 0),
      (row->>'expiry')::DATE,
      COALESCE((row->>'buying_price')::NUMERIC, 0),
      COALESCE((row->>'selling_price')::NUMERIC, 0),
      COALESCE(row->>'pack_size', ''),
      row->>'batch',
      COALESCE(row->>'shelf', ''),
      COALESCE((row->>'purchased')::INTEGER, 0),
      COALESCE((row->>'sold')::INTEGER, 0),
      COALESCE((row->>'qty_available')::INTEGER, 0)
    )
    ON CONFLICT (name, batch) DO UPDATE SET
      brand = EXCLUDED.brand,
      sku = EXCLUDED.sku,
      hsn = EXCLUDED.hsn,
      gst = EXCLUDED.gst,
      expiry = EXCLUDED.expiry,
      buying_price = EXCLUDED.buying_price,
      selling_price = EXCLUDED.selling_price,
      pack_size = EXCLUDED.pack_size,
      shelf = EXCLUDED.shelf,
      purchased = EXCLUDED.purchased,
      sold = EXCLUDED.sold,
      qty_available = EXCLUDED.qty_available,
      updated_at = now();
    upserted := upserted + 1;
  END LOOP;

  INSERT INTO public.audit_log (actor_id, action, entity_type, metadata)
  VALUES (auth.uid(), 'stock_import', 'wholesaler_stock', jsonb_build_object('count', upserted));

  RETURN upserted;
END;
$$;

-- Secure RPC: submit retailer order with soft reservation
CREATE OR REPLACE FUNCTION public.submit_retailer_order(lines JSONB)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  franchise UUID;
  order_id UUID;
  line JSONB;
  med_name TEXT;
  qty INTEGER;
  sell_price NUMERIC;
  gst_rate NUMERIC;
  total NUMERIC := 0;
  available INTEGER;
  sort_idx INTEGER := 0;
BEGIN
  IF NOT public.is_active_retailer() THEN
    RAISE EXCEPTION 'Forbidden: active retailer only';
  END IF;

  franchise := public.current_franchise_id();

  IF jsonb_array_length(lines) = 0 THEN
    RAISE EXCEPTION 'Order must have at least one line';
  END IF;

  -- Validate availability and reserve
  FOR line IN SELECT * FROM jsonb_array_elements(lines)
  LOOP
    med_name := line->>'medicine_name';
    qty := (line->>'quantity')::INTEGER;
    IF qty <= 0 THEN
      RAISE EXCEPTION 'Invalid quantity for %', med_name;
    END IF;

    SELECT COALESCE(SUM(qty_available - qty_reserved), 0) INTO available
    FROM public.wholesaler_stock
    WHERE name = med_name AND qty_available - qty_reserved >= qty;

    IF available < qty THEN
      RAISE EXCEPTION 'Insufficient stock for %', med_name;
    END IF;
  END LOOP;

  INSERT INTO public.orders (franchise_id, status, total_amount)
  VALUES (franchise, 'pending', 0)
  RETURNING id INTO order_id;

  FOR line IN SELECT * FROM jsonb_array_elements(lines)
  LOOP
    med_name := line->>'medicine_name';
    qty := (line->>'quantity')::INTEGER;

    SELECT selling_price, gst INTO sell_price, gst_rate
    FROM public.wholesaler_stock
    WHERE name = med_name AND qty_available - qty_reserved > 0
    ORDER BY expiry ASC
    LIMIT 1;

    INSERT INTO public.order_lines (order_id, medicine_name, quantity, price_per_unit, gst, sort_order)
    VALUES (order_id, med_name, qty, COALESCE(sell_price, 0), COALESCE(gst_rate, 0), sort_idx);

    -- Reserve from earliest-expiry batches (FEFO)
    PERFORM public._reserve_stock_fefo(med_name, qty);

    total := total + qty * COALESCE(sell_price, 0) * (1 + COALESCE(gst_rate, 0) / 100);
    sort_idx := sort_idx + 1;
  END LOOP;

  UPDATE public.orders SET total_amount = total WHERE id = order_id;

  INSERT INTO public.audit_log (actor_id, action, entity_type, entity_id)
  VALUES (auth.uid(), 'order_submit', 'orders', order_id);

  RETURN order_id;
END;
$$;

-- Helper: FEFO reservation
CREATE OR REPLACE FUNCTION public._reserve_stock_fefo(med_name TEXT, qty_needed INTEGER)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  batch_row RECORD;
  take INTEGER;
  remaining INTEGER := qty_needed;
BEGIN
  FOR batch_row IN
    SELECT id, qty_available, qty_reserved
    FROM public.wholesaler_stock
    WHERE name = med_name AND qty_available - qty_reserved > 0
    ORDER BY expiry ASC
  LOOP
    EXIT WHEN remaining <= 0;
    take := LEAST(batch_row.qty_available - batch_row.qty_reserved, remaining);
    UPDATE public.wholesaler_stock
    SET qty_reserved = qty_reserved + take
    WHERE id = batch_row.id;
    remaining := remaining - take;
  END LOOP;

  IF remaining > 0 THEN
    RAISE EXCEPTION 'Could not reserve full quantity for %', med_name;
  END IF;
END;
$$;

-- Secure RPC: approve order (admin)
CREATE OR REPLACE FUNCTION public.approve_order(
  p_order_id UUID,
  p_lines JSONB,
  p_bill_number TEXT DEFAULT '',
  p_bill_date DATE DEFAULT CURRENT_DATE,
  p_invoice_note TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  line JSONB;
  total NUMERIC := 0;
  ord RECORD;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Forbidden: admin only';
  END IF;

  SELECT * INTO ord FROM public.orders WHERE id = p_order_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Order not found'; END IF;
  IF ord.status <> 'pending' THEN RAISE EXCEPTION 'Order is not pending'; END IF;

  DELETE FROM public.order_lines WHERE order_id = p_order_id;

  FOR line IN SELECT * FROM jsonb_array_elements(p_lines)
  LOOP
    INSERT INTO public.order_lines (
      order_id, medicine_name, quantity, batch, price_per_unit, gst, sort_order
    ) VALUES (
      p_order_id,
      line->>'medicine_name',
      (line->>'quantity')::INTEGER,
      COALESCE(line->>'batch', ''),
      COALESCE((line->>'price_per_unit')::NUMERIC, 0),
      COALESCE((line->>'gst')::NUMERIC, 0),
      COALESCE((line->>'sort_order')::INTEGER, 0)
    );
    total := total + (line->>'quantity')::INTEGER
      * COALESCE((line->>'price_per_unit')::NUMERIC, 0)
      * (1 + COALESCE((line->>'gst')::NUMERIC, 0) / 100);
  END LOOP;

  UPDATE public.orders SET
    status = 'approved',
    total_amount = total,
    bill_number = COALESCE(p_bill_number, ''),
    bill_date = p_bill_date,
    invoice_note = p_invoice_note,
    approved_at = now()
  WHERE id = p_order_id;

  INSERT INTO public.audit_log (actor_id, action, entity_type, entity_id)
  VALUES (auth.uid(), 'order_approve', 'orders', p_order_id);
END;
$$;

-- Secure RPC: dispatch order (admin) — deduct stock, seed retailer inventory
CREATE OR REPLACE FUNCTION public.dispatch_order(p_order_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  ord RECORD;
  ln RECORD;
  stock_row RECORD;
  remaining INTEGER;
  take INTEGER;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Forbidden: admin only';
  END IF;

  SELECT * INTO ord FROM public.orders WHERE id = p_order_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Order not found'; END IF;
  IF ord.status <> 'approved' THEN RAISE EXCEPTION 'Order must be approved first'; END IF;

  FOR ln IN SELECT * FROM public.order_lines WHERE order_id = p_order_id ORDER BY sort_order
  LOOP
    IF ln.batch = '' OR ln.batch IS NULL THEN
      RAISE EXCEPTION 'Assign a batch for % before dispatch', ln.medicine_name;
    END IF;

    SELECT * INTO stock_row FROM public.wholesaler_stock
    WHERE name = ln.medicine_name AND batch = ln.batch FOR UPDATE;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Batch % not found for %', ln.batch, ln.medicine_name;
    END IF;

    IF stock_row.qty_available < ln.quantity THEN
      RAISE EXCEPTION 'Insufficient qty for % batch %', ln.medicine_name, ln.batch;
    END IF;

    UPDATE public.wholesaler_stock SET
      qty_available = qty_available - ln.quantity,
      qty_reserved = GREATEST(qty_reserved - ln.quantity, 0),
      sold = sold + ln.quantity
    WHERE id = stock_row.id;

    INSERT INTO public.retailer_inventory (
      franchise_id, name, brand, batch, expiry, hsn, gst, pack_size, shelf, qty, source_order_id
    ) VALUES (
      ord.franchise_id,
      ln.medicine_name,
      stock_row.brand,
      ln.batch,
      stock_row.expiry,
      stock_row.hsn,
      ln.gst,
      stock_row.pack_size,
      stock_row.shelf,
      ln.quantity,
      p_order_id
    )
    ON CONFLICT (franchise_id, name, batch) DO UPDATE SET
      qty = public.retailer_inventory.qty + EXCLUDED.qty,
      updated_at = now();
  END LOOP;

  UPDATE public.orders SET status = 'dispatched', dispatched_at = now() WHERE id = p_order_id;

  INSERT INTO public.audit_log (actor_id, action, entity_type, entity_id)
  VALUES (auth.uid(), 'order_dispatch', 'orders', p_order_id);
END;
$$;

-- Secure RPC: reject order (admin) — release reservations
CREATE OR REPLACE FUNCTION public.reject_order(p_order_id UUID, p_reason TEXT DEFAULT NULL)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  ord RECORD;
  ln RECORD;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Forbidden: admin only';
  END IF;

  SELECT * INTO ord FROM public.orders WHERE id = p_order_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Order not found'; END IF;
  IF ord.status <> 'pending' THEN RAISE EXCEPTION 'Only pending orders can be rejected'; END IF;

  FOR ln IN SELECT * FROM public.order_lines WHERE order_id = p_order_id
  LOOP
    PERFORM public._release_reservation_fefo(ln.medicine_name, ln.quantity);
  END LOOP;

  UPDATE public.orders SET
    status = 'rejected',
    remark = COALESCE(p_reason, remark),
    rejected_at = now()
  WHERE id = p_order_id;

  INSERT INTO public.audit_log (actor_id, action, entity_type, entity_id, metadata)
  VALUES (auth.uid(), 'order_reject', 'orders', p_order_id, jsonb_build_object('reason', p_reason));
END;
$$;

CREATE OR REPLACE FUNCTION public._release_reservation_fefo(med_name TEXT, qty_release INTEGER)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  batch_row RECORD;
  release_amt INTEGER;
  remaining INTEGER := qty_release;
BEGIN
  FOR batch_row IN
    SELECT id, qty_reserved FROM public.wholesaler_stock
    WHERE name = med_name AND qty_reserved > 0
    ORDER BY expiry ASC
  LOOP
    EXIT WHEN remaining <= 0;
    release_amt := LEAST(batch_row.qty_reserved, remaining);
    UPDATE public.wholesaler_stock SET qty_reserved = qty_reserved - release_amt WHERE id = batch_row.id;
    remaining := remaining - release_amt;
  END LOOP;
END;
$$;

-- Restrict direct access to helper functions
REVOKE ALL ON FUNCTION public._reserve_stock_fefo FROM PUBLIC;
REVOKE ALL ON FUNCTION public._release_reservation_fefo FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.upsert_stock_batches TO authenticated;
GRANT EXECUTE ON FUNCTION public.submit_retailer_order TO authenticated;
GRANT EXECUTE ON FUNCTION public.approve_order TO authenticated;
GRANT EXECUTE ON FUNCTION public.dispatch_order TO authenticated;
GRANT EXECUTE ON FUNCTION public.reject_order TO authenticated;
