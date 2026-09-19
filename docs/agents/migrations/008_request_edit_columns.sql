-- Phase 17B: persist Request Edit payload and approval audit fields.
-- Run manually in Supabase SQL Editor after migration 007.

ALTER TABLE public.audit_request_edits
  ADD COLUMN IF NOT EXISTS changes JSONB NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES public.profiles(id),
  ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS notes TEXT;

CREATE OR REPLACE FUNCTION public.approve_request_edit(request_edit_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  request_row public.audit_request_edits%ROWTYPE;
  closing_row public.daily_closings%ROWTYPE;
  change_item JSONB;
  item_id UUID;
  opening_stock INT;
  ending_stock INT;
  sold_quantity INT;
  selling_price NUMERIC;
  new_total_omzet NUMERIC := 0;
  new_cash_physical NUMERIC;
  discrepancy NUMERIC;
BEGIN
  IF NOT public.is_owner() THEN
    RAISE EXCEPTION 'Only owner can approve request edits';
  END IF;

  SELECT * INTO request_row
  FROM public.audit_request_edits
  WHERE id = request_edit_id
  FOR UPDATE;

  IF NOT FOUND OR request_row.status <> 'PENDING' THEN
    RAISE EXCEPTION 'Request edit tidak ditemukan atau sudah diproses';
  END IF;

  SELECT * INTO closing_row
  FROM public.daily_closings
  WHERE id = request_row.target_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Closing tidak ditemukan';
  END IF;

  new_cash_physical := COALESCE((request_row.changes->>'cash_physical')::NUMERIC, 0);

  FOR change_item IN
    SELECT value FROM jsonb_array_elements(
      COALESCE(request_row.changes->'items', '[]'::jsonb)
    )
  LOOP
    item_id := (change_item->>'item_id')::UUID;
    opening_stock := COALESCE((change_item->>'stok_awal')::INT, (change_item->>'initial_stock')::INT, 0);
    ending_stock := COALESCE((change_item->>'stok_akhir')::INT, (change_item->>'remaining_stock')::INT, 0);
    sold_quantity := COALESCE((change_item->>'terjual')::INT, (change_item->>'sold_quantity')::INT, opening_stock - ending_stock);

    SELECT mi.selling_price INTO selling_price
    FROM public.master_items mi
    WHERE mi.id = item_id;

    IF selling_price IS NULL THEN
      RAISE EXCEPTION 'Item closing tidak ditemukan: %', item_id;
    END IF;

    UPDATE public.daily_closing_items
    SET initial_stock = opening_stock,
        remaining_stock = ending_stock
    WHERE closing_id = closing_row.id
      AND daily_closing_items.item_id = item_id;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Item tidak terdaftar pada closing: %', item_id;
    END IF;

    new_total_omzet := new_total_omzet + (sold_quantity * selling_price);
  END LOOP;

  discrepancy := new_total_omzet - (
    (new_cash_physical - closing_row.cash_initial + closing_row.expenses_cash_snapshot)
    + (closing_row.qris_physical + closing_row.expenses_qris_snapshot)
  );

  UPDATE public.daily_closings
  SET total_system_omzet = new_total_omzet,
      cash_physical = new_cash_physical,
      cash_discrepancy = discrepancy,
      discrepancy_status = CASE WHEN ABS(discrepancy) > 5000 THEN 'open' ELSE NULL END,
      discrepancy_resolution = NULL,
      updated_at = NOW()
  WHERE id = closing_row.id;

  UPDATE public.audit_request_edits
  SET status = 'APPROVED',
      approved_by = auth.uid(),
      approved_at = NOW()
  WHERE id = request_row.id;
END;
$$;

REVOKE ALL ON FUNCTION public.approve_request_edit(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.approve_request_edit(UUID) TO authenticated;
