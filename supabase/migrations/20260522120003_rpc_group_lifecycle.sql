-- Crea un gruppo type='family'. Caller diventa owner + primo member.
-- Limita: 1 sola famiglia per user (enforced server-side).
CREATE OR REPLACE FUNCTION public.create_family_group(
  p_name text,
  p_initial_preset text DEFAULT 'base'
) RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_group_id uuid;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'auth_required' USING ERRCODE = 'P0001';
  END IF;
  IF p_initial_preset NOT IN ('activity','base','full') THEN
    RAISE EXCEPTION 'invalid_preset' USING ERRCODE = 'P0001';
  END IF;
  IF length(trim(p_name)) = 0 THEN
    RAISE EXCEPTION 'name_required' USING ERRCODE = 'P0001';
  END IF;

  -- Anti-abuse: max 5 gruppi creati nelle ultime 24h
  IF (SELECT count(*) FROM public.groups
      WHERE owner_id = v_uid AND created_at > now() - interval '24 hours') >= 5 THEN
    RAISE EXCEPTION 'rate_limit_exceeded' USING ERRCODE = 'P0001';
  END IF;

  -- Constraint: max 1 famiglia attiva per user
  IF EXISTS (
    SELECT 1 FROM public.group_members gm
    JOIN public.groups g ON g.id = gm.group_id
    WHERE gm.user_id = v_uid AND gm.left_at IS NULL
      AND g.type = 'family' AND g.deleted_at IS NULL
  ) THEN
    RAISE EXCEPTION 'already_in_family' USING ERRCODE = 'P0001';
  END IF;

  INSERT INTO public.groups (type, name, owner_id)
  VALUES ('family', trim(p_name), v_uid)
  RETURNING id INTO v_group_id;

  INSERT INTO public.group_members (group_id, user_id, role, share_settings)
  VALUES (v_group_id, v_uid, 'owner', jsonb_build_object('preset', p_initial_preset));

  RETURN v_group_id;
END $$;

GRANT EXECUTE ON FUNCTION public.create_family_group(text, text) TO authenticated;

-- Elimina gruppo (soft delete). Solo owner.
CREATE OR REPLACE FUNCTION public.delete_group(p_group_id uuid)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE v_uid uuid := auth.uid();
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'auth_required' USING ERRCODE = 'P0001';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM public.groups
    WHERE id = p_group_id AND owner_id = v_uid AND deleted_at IS NULL
  ) THEN
    RAISE EXCEPTION 'not_owner_or_not_found' USING ERRCODE = 'P0001';
  END IF;

  UPDATE public.groups SET deleted_at = now() WHERE id = p_group_id;
  UPDATE public.group_members SET left_at = now()
    WHERE group_id = p_group_id AND left_at IS NULL;
END $$;

GRANT EXECUTE ON FUNCTION public.delete_group(uuid) TO authenticated;
