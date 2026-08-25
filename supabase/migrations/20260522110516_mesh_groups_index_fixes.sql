-- Follow-up to 20260522120001_mesh_groups_schema.sql
-- Code review fixes: FK-covering indexes + harden search_path on trigger fn.

-- 1) FK-covering indexes (cascade & join performance)
CREATE INDEX IF NOT EXISTS idx_invites_group ON public.group_invites(group_id);
CREATE INDEX IF NOT EXISTS idx_invites_created_by ON public.group_invites(created_by);
CREATE INDEX IF NOT EXISTS idx_events_user ON public.group_events(user_id);

-- 2) Harden updated_at trigger function (set explicit search_path)
CREATE OR REPLACE FUNCTION public.touch_updated_at() RETURNS TRIGGER
LANGUAGE plpgsql SET search_path = public
AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END $$;