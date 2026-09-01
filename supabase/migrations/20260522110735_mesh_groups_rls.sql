-- RLS: groups visibile a owner + membri attivi
ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;

CREATE POLICY groups_select ON public.groups FOR SELECT
USING (
  deleted_at IS NULL AND (
    owner_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.group_members gm
      WHERE gm.group_id = groups.id
        AND gm.user_id = auth.uid()
        AND gm.left_at IS NULL
    )
  )
);

-- INSERT/UPDATE/DELETE solo via RPC SECURITY DEFINER. Niente policy permissive.

-- RLS: group_members visibile a tutti i membri attivi dello stesso gruppo
ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY members_select ON public.group_members FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.group_members gm2
    WHERE gm2.group_id = group_members.group_id
      AND gm2.user_id = auth.uid()
      AND gm2.left_at IS NULL
  )
);

-- RLS: group_invites — solo creator (gli altri claim via RPC)
ALTER TABLE public.group_invites ENABLE ROW LEVEL SECURITY;

CREATE POLICY invites_select ON public.group_invites FOR SELECT
USING (created_by = auth.uid());

-- RLS: group_events visibile a membri attivi
ALTER TABLE public.group_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY events_select ON public.group_events FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.group_members gm
    WHERE gm.group_id = group_events.group_id
      AND gm.user_id = auth.uid()
      AND gm.left_at IS NULL
  )
);

-- Grant access alle role anon/authenticated (necessario per esporre via Data API)
GRANT SELECT ON public.groups TO authenticated;
GRANT SELECT ON public.group_members TO authenticated;
GRANT SELECT ON public.group_invites TO authenticated;
GRANT SELECT ON public.group_events TO authenticated;
