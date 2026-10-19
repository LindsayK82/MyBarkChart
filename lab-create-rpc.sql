-- MyBarkChart: create a lab record and all its measurements atomically.
-- Run this entire script in the Supabase SQL Editor before deploying records.html.
-- Existing lab edit/delete functions remain unchanged.
CREATE OR REPLACE FUNCTION public.mbc_create_lab_record(
  p_pet_id uuid,
  p_recorded_on date,
  p_provider text,
  p_notes text,
  p_values jsonb
) RETURNS uuid
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
DECLARE
  v_user uuid := (SELECT auth.uid());
  v_record_id uuid;
  v_item jsonb;
  v_test text;
  v_result text;
  v_numeric numeric;
BEGIN
  IF v_user IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;
  IF p_pet_id IS NULL OR NOT EXISTS (
    SELECT 1 FROM public.pets p WHERE p.id = p_pet_id AND p.user_id = v_user
  ) THEN
    RAISE EXCEPTION 'Pet not found or access denied';
  END IF;
  IF p_recorded_on IS NULL THEN
    RAISE EXCEPTION 'A lab date is required';
  END IF;
  IF p_values IS NULL OR jsonb_typeof(p_values) <> 'array'
     OR jsonb_array_length(p_values) = 0 THEN
    RAISE EXCEPTION 'At least one lab measurement is required';
  END IF;

  INSERT INTO public.pet_records
    (pet_id, user_id, record_type, title, recorded_on, provider, notes, details)
  VALUES
    (p_pet_id, v_user, 'lab', 'Lab Results', p_recorded_on,
     NULLIF(btrim(p_provider), ''), NULLIF(btrim(p_notes), ''), '{"fields":[]}'::jsonb)
  RETURNING id INTO v_record_id;

  FOR v_item IN SELECT value FROM jsonb_array_elements(p_values) LOOP
    IF jsonb_typeof(v_item) <> 'object' THEN
      RAISE EXCEPTION 'Invalid lab measurement format';
    END IF;
    v_test := NULLIF(btrim(v_item->>'test'), '');
    v_result := NULLIF(btrim(v_item->>'result'), '');
    IF v_test IS NULL OR v_result IS NULL THEN
      RAISE EXCEPTION 'Each lab measurement needs a test and result';
    END IF;
    v_numeric := CASE
      WHEN replace(v_result, ',', '') ~ '^[-+]?([0-9]+(\.[0-9]*)?|\.[0-9]+)$'
      THEN replace(v_result, ',', '')::numeric
      ELSE NULL
    END;
    INSERT INTO public.pet_lab_results
      (pet_id, user_id, record_id, test_name, result_text,
       numeric_value, unit, reference_range, measured_on)
    VALUES
      (p_pet_id, v_user, v_record_id, v_test, v_result,
       v_numeric, NULLIF(v_item->>'unit', ''),
       NULLIF(v_item->>'range', ''), p_recorded_on);
  END LOOP;

  RETURN v_record_id;
END;
$$;

REVOKE ALL ON FUNCTION public.mbc_create_lab_record(uuid,date,text,text,jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.mbc_create_lab_record(uuid,date,text,text,jsonb) TO authenticated;
