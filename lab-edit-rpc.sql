-- MyBarkChart lab editing: atomic, pet-scoped updates and deletions.
-- Run in Supabase SQL Editor before deploying the website changes.
CREATE OR REPLACE FUNCTION public.mbc_update_lab_record(
  p_record_id uuid,
  p_recorded_on date,
  p_provider text,
  p_notes text,
  p_values jsonb
) RETURNS void
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
DECLARE
  v_user uuid := (SELECT auth.uid());
  v_pet uuid;
  v_item jsonb;
  v_test text;
  v_result text;
  v_numeric numeric;
BEGIN
  IF v_user IS NULL THEN RAISE EXCEPTION 'Authentication required'; END IF;
  IF p_values IS NULL OR jsonb_typeof(p_values) <> 'array' OR jsonb_array_length(p_values) = 0 THEN
    RAISE EXCEPTION 'At least one lab measurement is required';
  END IF;
  SELECT r.pet_id INTO v_pet
  FROM public.pet_records r
  JOIN public.pets p ON p.id=r.pet_id AND p.user_id=v_user
  WHERE r.id=p_record_id AND r.user_id=v_user AND r.record_type='lab'
  FOR UPDATE OF r;
  IF v_pet IS NULL THEN RAISE EXCEPTION 'Lab record not found or access denied'; END IF;
  UPDATE public.pet_records SET recorded_on=p_recorded_on,provider=p_provider,notes=p_notes,updated_at=now()
  WHERE id=p_record_id AND user_id=v_user AND pet_id=v_pet;
  DELETE FROM public.pet_lab_results WHERE record_id=p_record_id AND user_id=v_user AND pet_id=v_pet;
  FOR v_item IN SELECT value FROM jsonb_array_elements(p_values) LOOP
    v_test := nullif(btrim(v_item->>'test'),'');
    v_result := nullif(btrim(v_item->>'result'),'');
    IF v_test IS NULL OR v_result IS NULL THEN RAISE EXCEPTION 'Each lab measurement needs a test and result'; END IF;
    v_numeric := CASE WHEN replace(v_result,',','') ~ '^[-+]?([0-9]+(\.[0-9]*)?|\.[0-9]+)$'
                      THEN replace(v_result,',','')::numeric ELSE NULL END;
    INSERT INTO public.pet_lab_results
      (pet_id,user_id,record_id,test_name,result_text,numeric_value,unit,reference_range,measured_on)
    VALUES (v_pet,v_user,p_record_id,v_test,v_result,v_numeric,
      nullif(v_item->>'unit',''),nullif(v_item->>'range',''),p_recorded_on);
  END LOOP;
END;
$$;

CREATE OR REPLACE FUNCTION public.mbc_delete_lab_record(p_record_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
DECLARE
  v_user uuid := (SELECT auth.uid());
  v_pet uuid;
BEGIN
  IF v_user IS NULL THEN RAISE EXCEPTION 'Authentication required'; END IF;
  SELECT r.pet_id INTO v_pet FROM public.pet_records r
  JOIN public.pets p ON p.id=r.pet_id AND p.user_id=v_user
  WHERE r.id=p_record_id AND r.user_id=v_user AND r.record_type='lab'
  FOR UPDATE OF r;
  IF v_pet IS NULL THEN RAISE EXCEPTION 'Lab record not found or access denied'; END IF;
  DELETE FROM public.pet_lab_results WHERE record_id=p_record_id AND pet_id=v_pet AND user_id=v_user;
  DELETE FROM public.pet_records WHERE id=p_record_id AND pet_id=v_pet AND user_id=v_user;
END;
$$;

REVOKE ALL ON FUNCTION public.mbc_update_lab_record(uuid,date,text,text,jsonb) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.mbc_delete_lab_record(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.mbc_update_lab_record(uuid,date,text,text,jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.mbc_delete_lab_record(uuid) TO authenticated;
