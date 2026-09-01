CREATE OR REPLACE FUNCTION public.create_group_invite(p_group_id uuid, p_max_uses integer DEFAULT 1, p_ttl_days integer DEFAULT 7)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions'
AS $function$
DECLARE
  v_uid uuid := auth.uid();
  v_code text;
  v_attempts int := 0;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'auth_required' USING ERRCODE = 'P0001';
  END IF;
  IF p_max_uses NOT BETWEEN 1 AND 20 OR p_ttl_days NOT BETWEEN 1 AND 30 THEN
    RAISE EXCEPTION 'invalid_params' USING ERRCODE = 'P0001';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.group_members
    WHERE group_id = p_group_id AND user_id = v_uid AND left_at IS NULL
  ) THEN
    RAISE EXCEPTION 'not_a_member' USING ERRCODE = 'P0001';
  END IF;

  -- Generate code MESH-XXXX usando hex (base32 non e' supportato da Postgres standard).
  -- Spazio 16^4 = 65k; collisione gestita dal retry loop.
  LOOP
    v_code := 'MESH-' || upper(substring(encode(gen_random_bytes(3), 'hex') from 1 for 4));
    BEGIN
      INSERT INTO public.group_invites (group_id, code, created_by, max_uses, expires_at)
      VALUES (p_group_id, v_code, v_uid, p_max_uses, now() + (p_ttl_days || ' days')::interval);
      RETURN v_code;
    EXCEPTION WHEN unique_violation THEN
      v_attempts := v_attempts + 1;
      IF v_attempts > 5 THEN RAISE EXCEPTION 'code_generation_failed'; END IF;
    END;
  END LOOP;
END $function$;