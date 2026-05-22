-- Monitoring view: KPI activation / conversion / retention per Mesh Famiglia.
-- Eseguire da Supabase Dashboard SQL editor: SELECT * FROM private.mesh_famiglia_metrics;
-- Target: activation 15%, invite conversion >40%, member retention 30gg >70%.

CREATE OR REPLACE VIEW private.mesh_famiglia_metrics AS
SELECT
  (SELECT count(*) FROM public.groups WHERE type='family' AND deleted_at IS NULL) AS families_total,
  (SELECT count(*) FROM public.group_members gm
    JOIN public.groups g ON g.id=gm.group_id
    WHERE g.type='family' AND gm.left_at IS NULL) AS members_total,
  (SELECT count(*) FROM public.group_invites
    WHERE created_at > now() - interval '7 days') AS invites_last_7d,
  (SELECT count(*) FROM public.group_invites
    WHERE uses_count >= max_uses
      AND created_at > now() - interval '7 days') AS invites_claimed_last_7d,
  (SELECT round(100.0 *
    (SELECT count(*) FROM public.group_invites
     WHERE uses_count >= max_uses AND created_at > now() - interval '7 days') /
    nullif((SELECT count(*) FROM public.group_invites WHERE created_at > now() - interval '7 days'), 0)
  , 1)) AS invite_conversion_pct_7d;
