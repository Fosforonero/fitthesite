-- Mesh Groups: astrazione generica per Famiglia/Challenge/Palestre/Caregiver.
-- type discrimina il comportamento; lo schema è unico per tutti i verticali.

CREATE TABLE IF NOT EXISTS public.groups (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type        TEXT NOT NULL CHECK (type IN ('family','challenge','gym','caregiver')),
  name        TEXT NOT NULL CHECK (length(name) BETWEEN 1 AND 80),
  owner_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  settings    JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at  TIMESTAMPTZ
);
CREATE INDEX idx_groups_owner ON public.groups(owner_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_groups_type ON public.groups(type) WHERE deleted_at IS NULL;

CREATE TABLE IF NOT EXISTS public.group_members (
  group_id       UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  user_id        UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role           TEXT NOT NULL CHECK (role IN ('owner','admin','member','watched')),
  share_settings JSONB NOT NULL DEFAULT '{"preset":"base"}'::jsonb,
  display_name   TEXT CHECK (display_name IS NULL OR length(display_name) BETWEEN 1 AND 40),
  joined_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  left_at        TIMESTAMPTZ,
  PRIMARY KEY (group_id, user_id)
);
CREATE INDEX idx_members_user_active ON public.group_members(user_id) WHERE left_at IS NULL;
CREATE INDEX idx_members_group_active ON public.group_members(group_id) WHERE left_at IS NULL;

CREATE TABLE IF NOT EXISTS public.group_invites (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id    UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  code        TEXT NOT NULL UNIQUE CHECK (code ~ '^MESH-[A-Z0-9]{4}$'),
  created_by  UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  expires_at  TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '7 days'),
  max_uses    INT NOT NULL DEFAULT 1 CHECK (max_uses BETWEEN 1 AND 20),
  uses_count  INT NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_invites_code_active ON public.group_invites(code)
  WHERE uses_count < max_uses;

CREATE TABLE IF NOT EXISTS public.group_events (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id    UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  user_id     UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  event_type  TEXT NOT NULL CHECK (event_type IN (
    'milestone','achievement','streak','welcome','member_left',
    'weekly_digest','system'
  )),
  payload     JSONB NOT NULL DEFAULT '{}'::jsonb,
  read_by     UUID[] NOT NULL DEFAULT ARRAY[]::UUID[],
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_events_group_time ON public.group_events(group_id, created_at DESC);

-- updated_at trigger
CREATE OR REPLACE FUNCTION public.touch_updated_at() RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END $$ LANGUAGE plpgsql;

CREATE TRIGGER trg_groups_touch BEFORE UPDATE ON public.groups
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
