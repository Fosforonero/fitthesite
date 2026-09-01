-- Bug 42P17 "infinite recursion in policy for relation group_members":
-- la vecchia policy faceva EXISTS su group_members stessa, attivando
-- recursivamente la stessa policy. Fix: SECURITY DEFINER function che
-- bypassa RLS (esegue come postgres role).

CREATE OR REPLACE FUNCTION private.is_active_group_member(p_group_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.group_members
    WHERE group_id = p_group_id
      AND user_id = auth.uid()
      AND left_at IS NULL
  );
$$;

GRANT EXECUTE ON FUNCTION private.is_active_group_member(uuid) TO authenticated;

-- Rebuild policies che usavano EXISTS su group_members
DROP POLICY IF EXISTS members_select ON public.group_members;
CREATE POLICY members_select ON public.group_members FOR SELECT
USING (private.is_active_group_member(group_id));

DROP POLICY IF EXISTS events_select ON public.group_events;
CREATE POLICY events_select ON public.group_events FOR SELECT
USING (private.is_active_group_member(group_id));

DROP POLICY IF EXISTS groups_select ON public.groups;
CREATE POLICY groups_select ON public.groups FOR SELECT
USING (
  deleted_at IS NULL AND (
    owner_id = auth.uid()
    OR private.is_active_group_member(id)
  )
);