-- Genera invite code univoco. Solo membri del gruppo possono generare.
CREATE OR REPLACE FUNCTION public.create_group_invite(
  p_group_id uuid,
  p_max_uses int DEFAULT 1,
  p_ttl_days int DEFAULT 7
) RETURNS text
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
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

  -- Generate code MESH-XXXX, retry on collision (probabilità ~0 con 36^4 spazio)
  LOOP
    v_code := 'MESH-' || upper(substring(encode(gen_random_bytes(3), 'base32') from 1 for 4));
    BEGIN
      INSERT INTO public.group_invites (group_id, code, created_by, max_uses, expires_at)
      VALUES (p_group_id, v_code, v_uid, p_max_uses, now() + (p_ttl_days || ' days')::interval);
      RETURN v_code;
    EXCEPTION WHEN unique_violation THEN
      v_attempts := v_attempts + 1;
      IF v_attempts > 5 THEN RAISE EXCEPTION 'code_generation_failed'; END IF;
    END;
  END LOOP;
END $$;

GRANT EXECUTE ON FUNCTION public.create_group_invite(uuid, int, int) TO authenticated;

-- Reclama invite. Atomico: FOR UPDATE su row, incrementa uses_count.
-- Restituisce JSONB con esito.
-- NOTE: b2c_subscriptions uses column `state` (not `status`) with values:
--   active, grace, on_hold, paused, expired, cancelled
-- Active-paying states treated as Pro: active, grace, on_hold
CREATE OR REPLACE FUNCTION public.claim_group_invite(
  p_code text,
  p_share_preset text DEFAULT 'base',
  p_display_name text DEFAULT NULL
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_invite record;
  v_group_type text;
  v_existing_family_id uuid;
BEGIN
  IF v_uid IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'auth_required');
  END IF;
  IF p_share_preset NOT IN ('activity','base','full') THEN
    RETURN jsonb_build_object('ok', false, 'error', 'invalid_preset');
  END IF;

  -- Lock dell'invite row per evitare race su max_uses
  SELECT * INTO v_invite FROM public.group_invites
    WHERE code = p_code FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'error', 'invite_not_found');
  END IF;
  IF v_invite.expires_at < now() THEN
    RETURN jsonb_build_object('ok', false, 'error', 'invite_expired');
  END IF;
  IF v_invite.uses_count >= v_invite.max_uses THEN
    RETURN jsonb_build_object('ok', false, 'error', 'invite_exhausted');
  END IF;

  -- Già membro?
  IF EXISTS (
    SELECT 1 FROM public.group_members
    WHERE group_id = v_invite.group_id AND user_id = v_uid AND left_at IS NULL
  ) THEN
    RETURN jsonb_build_object(
      'ok', false, 'error', 'already_member',
      'group_id', v_invite.group_id
    );
  END IF;

  -- Per family: max 1 famiglia per user
  SELECT type INTO v_group_type FROM public.groups WHERE id = v_invite.group_id;
  IF v_group_type = 'family' THEN
    SELECT g.id INTO v_existing_family_id
    FROM public.group_members gm
    JOIN public.groups g ON g.id = gm.group_id
    WHERE gm.user_id = v_uid AND gm.left_at IS NULL
      AND g.type = 'family' AND g.deleted_at IS NULL;
    IF v_existing_family_id IS NOT NULL THEN
      RETURN jsonb_build_object(
        'ok', false, 'error', 'already_in_family',
        'existing_group_id', v_existing_family_id
      );
    END IF;
  END IF;

  -- Pricing gate per family: max 3 free / 8 Pro
  -- b2c_subscriptions: column is `state` (NOT `status`); active-paying states: active, grace, on_hold
  IF v_group_type = 'family' THEN
    DECLARE
      v_owner_id uuid;
      v_is_pro boolean;
      v_member_count int;
      v_cap int;
    BEGIN
      SELECT owner_id INTO v_owner_id FROM public.groups WHERE id = v_invite.group_id;
      SELECT EXISTS(
        SELECT 1 FROM public.b2c_subscriptions
        WHERE user_id = v_owner_id AND state IN ('active','grace','on_hold')
      ) OR EXISTS(
        SELECT 1 FROM public.user_roles
        WHERE user_id = v_owner_id AND role IN ('pro','admin')
      ) INTO v_is_pro;
      v_cap := CASE WHEN v_is_pro THEN 8 ELSE 3 END;
      SELECT count(*) INTO v_member_count FROM public.group_members
        WHERE group_id = v_invite.group_id AND left_at IS NULL;
      IF v_member_count >= v_cap THEN
        RETURN jsonb_build_object(
          'ok', false, 'error', 'family_full',
          'cap', v_cap, 'is_owner_pro', v_is_pro
        );
      END IF;
    END;
  END IF;

  -- Inserisce membership
  INSERT INTO public.group_members (group_id, user_id, role, share_settings, display_name)
  VALUES (
    v_invite.group_id, v_uid, 'member',
    jsonb_build_object('preset', p_share_preset),
    p_display_name
  );
  UPDATE public.group_invites SET uses_count = uses_count + 1 WHERE id = v_invite.id;

  -- Welcome event
  INSERT INTO public.group_events (group_id, user_id, event_type, payload)
  VALUES (v_invite.group_id, v_uid, 'welcome',
    jsonb_build_object('display_name', coalesce(p_display_name, '')));

  RETURN jsonb_build_object(
    'ok', true,
    'group_id', v_invite.group_id,
    'role', 'member'
  );
END $$;

GRANT EXECUTE ON FUNCTION public.claim_group_invite(text, text, text) TO authenticated;
