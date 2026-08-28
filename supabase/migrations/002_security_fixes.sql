-- Security & data-integrity fixes (run after 001_initial_schema.sql)

-- ---------------------------------------------------------------------------
-- 1. Profile escalation prevention
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.prevent_profile_escalation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF public.is_admin() THEN
    RETURN NEW;
  END IF;

  IF NEW.role IS DISTINCT FROM OLD.role THEN
    RAISE EXCEPTION 'Cannot change role';
  END IF;
  IF NEW.franchise_id IS DISTINCT FROM OLD.franchise_id THEN
    RAISE EXCEPTION 'Cannot change franchise';
  END IF;
  IF NEW.active IS DISTINCT FROM OLD.active THEN
    RAISE EXCEPTION 'Cannot change account status';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS profiles_prevent_escalation ON public.profiles;
CREATE TRIGGER profiles_prevent_escalation
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.prevent_profile_escalation();

-- New signups start inactive until admin links franchise
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS retailer_requires_franchise;
ALTER TABLE public.profiles ADD CONSTRAINT retailer_requires_franchise CHECK (
  role = 'admin' OR franchise_id IS NOT NULL OR active = false
);

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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

-- ---------------------------------------------------------------------------
-- 2. Retailer catalog — view runs as owner, not invoker (masks buying_price)
-- ---------------------------------------------------------------------------
DROP VIEW IF EXISTS public.catalog_stock;

CREATE VIEW public.catalog_stock
WITH (security_invoker = false)
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

GRANT SELECT ON public.catalog_stock TO authenticated;

-- ---------------------------------------------------------------------------
-- 3. Order lines — retailers read-only; writes via RPC only
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS order_lines_admin ON public.order_lines;

CREATE POLICY order_lines_admin_write ON public.order_lines
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY order_lines_retailer_read ON public.order_lines
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.orders o
      WHERE o.id = order_id AND o.franchise_id = public.current_franchise_id()
    )
  );

-- ---------------------------------------------------------------------------
-- 4. Stock integrity
-- ---------------------------------------------------------------------------
ALTER TABLE public.wholesaler_stock
  DROP CONSTRAINT IF EXISTS wholesaler_stock_qty_check;

ALTER TABLE public.wholesaler_stock
  ADD CONSTRAINT wholesaler_stock_qty_check
  CHECK (qty_available >= qty_reserved AND qty_reserved >= 0);

-- ---------------------------------------------------------------------------
-- 5. Safe order delete (releases reservations for pending orders)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.delete_order_safe(p_order_id UUID)
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

  IF ord.status = 'pending' THEN
    FOR ln IN SELECT * FROM public.order_lines WHERE order_id = p_order_id
    LOOP
      PERFORM public._release_reservation_fefo(ln.medicine_name, ln.quantity);
    END LOOP;
  ELSIF ord.status IN ('approved', 'dispatched') THEN
    RAISE EXCEPTION 'Cannot delete approved or dispatched orders';
  END IF;

  DELETE FROM public.orders WHERE id = p_order_id;

  INSERT INTO public.audit_log (actor_id, action, entity_type, entity_id, metadata)
  VALUES (auth.uid(), 'order_delete', 'orders', p_order_id, jsonb_build_object('status', ord.status));
END;
$$;

GRANT EXECUTE ON FUNCTION public.delete_order_safe TO authenticated;

-- ---------------------------------------------------------------------------
-- 6. Approve order — release old reservations before replacing lines
-- ---------------------------------------------------------------------------
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
  ln RECORD;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Forbidden: admin only';
  END IF;

  SELECT * INTO ord FROM public.orders WHERE id = p_order_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Order not found'; END IF;
  IF ord.status <> 'pending' THEN RAISE EXCEPTION 'Order is not pending'; END IF;

  FOR ln IN SELECT * FROM public.order_lines WHERE order_id = p_order_id
  LOOP
    PERFORM public._release_reservation_fefo(ln.medicine_name, ln.quantity);
  END LOOP;

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
