-- Esci dal gruppo. Owner deve trasferire prima.
CREATE OR REPLACE FUNCTION public.leave_group(p_group_id uuid)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_role text;
BEGIN
  IF v_uid IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'auth_required');
  END IF;

  SELECT role INTO v_role FROM public.group_members
    WHERE group_id = p_group_id AND user_id = v_uid AND left_at IS NULL;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'error', 'not_a_member');
  END IF;
  IF v_role = 'owner' THEN
    RETURN jsonb_build_object('ok', false, 'error', 'owner_must_transfer_first');
  END IF;

  UPDATE public.group_members SET left_at = now()
    WHERE group_id = p_group_id AND user_id = v_uid;

  INSERT INTO public.group_events (group_id, user_id, event_type)
  VALUES (p_group_id, v_uid, 'member_left');

  RETURN jsonb_build_object('ok', true);
END $$;
GRANT EXECUTE ON FUNCTION public.leave_group(uuid) TO authenticated;

-- Owner rimuove un altro membro
CREATE OR REPLACE FUNCTION public.kick_member(
  p_group_id uuid,
  p_member_user_id uuid
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE v_uid uuid := auth.uid();
BEGIN
  IF v_uid IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'auth_required');
  END IF;
  IF v_uid = p_member_user_id THEN
    RETURN jsonb_build_object('ok', false, 'error', 'cannot_kick_self_use_leave');
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM public.groups
    WHERE id = p_group_id AND owner_id = v_uid AND deleted_at IS NULL
  ) THEN
    RETURN jsonb_build_object('ok', false, 'error', 'not_owner');
  END IF;

  UPDATE public.group_members SET left_at = now()
    WHERE group_id = p_group_id AND user_id = p_member_user_id AND left_at IS NULL;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'error', 'member_not_found');
  END IF;

  INSERT INTO public.group_events (group_id, user_id, event_type, payload)
  VALUES (p_group_id, p_member_user_id, 'member_left',
    jsonb_build_object('kicked_by', v_uid));

  RETURN jsonb_build_object('ok', true);
END $$;
GRANT EXECUTE ON FUNCTION public.kick_member(uuid, uuid) TO authenticated;

-- Trasferisci ownership
CREATE OR REPLACE FUNCTION public.transfer_ownership(
  p_group_id uuid,
  p_new_owner_id uuid
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE v_uid uuid := auth.uid();
BEGIN
  IF v_uid IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'auth_required');
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM public.groups
    WHERE id = p_group_id AND owner_id = v_uid AND deleted_at IS NULL
  ) THEN
    RETURN jsonb_build_object('ok', false, 'error', 'not_owner');
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM public.group_members
    WHERE group_id = p_group_id AND user_id = p_new_owner_id AND left_at IS NULL
  ) THEN
    RETURN jsonb_build_object('ok', false, 'error', 'new_owner_not_a_member');
  END IF;

  UPDATE public.groups SET owner_id = p_new_owner_id WHERE id = p_group_id;
  UPDATE public.group_members SET role = 'member'
    WHERE group_id = p_group_id AND user_id = v_uid;
  UPDATE public.group_members SET role = 'owner'
    WHERE group_id = p_group_id AND user_id = p_new_owner_id;

  RETURN jsonb_build_object('ok', true);
END $$;
GRANT EXECUTE ON FUNCTION public.transfer_ownership(uuid, uuid) TO authenticated;

-- Update proprie share_settings + display_name
CREATE OR REPLACE FUNCTION public.update_my_share_settings(
  p_group_id uuid,
  p_share_settings jsonb,
  p_display_name text DEFAULT NULL
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE v_uid uuid := auth.uid();
BEGIN
  IF v_uid IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'auth_required');
  END IF;

  IF (p_share_settings->>'preset') NOT IN ('activity','base','full','custom') THEN
    RETURN jsonb_build_object('ok', false, 'error', 'invalid_preset');
  END IF;

  UPDATE public.group_members
  SET share_settings = p_share_settings,
      display_name = coalesce(p_display_name, display_name)
  WHERE group_id = p_group_id AND user_id = v_uid AND left_at IS NULL;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'error', 'not_a_member');
  END IF;

  RETURN jsonb_build_object('ok', true);
END $$;
GRANT EXECUTE ON FUNCTION public.update_my_share_settings(uuid, jsonb, text) TO authenticated;
