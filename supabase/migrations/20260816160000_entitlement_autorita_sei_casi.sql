-- ============================================================================
-- L'AUTORITA' COPRE TUTTI E SEI I CASI, NON SOLO I TRE OVVI
--
-- 20260816140000 replicava fedelmente `entitlement_flags`, e ne ereditava tre
-- buchi. Due erano gia' nella regola esistente, uno era mio.
--
--   expires_at IGNORATO. `user_roles` ha una colonna di scadenza, usata dai
--     grant a tempo (`ring-reward`, 3 righe). Un grant scaduto sarebbe entrato
--     lo stesso. Oggi non perde — le tre scadenze sono a febbraio 2027 — ma e'
--     il caso che si rompe per primo quando qualcuno semplifica.
--
--   ADMIN scoperto. Il ruolo 'admin' non era fra i predicati. I due admin
--     passavano solo perche' hanno ANCHE una riga 'pro': un admin senza quella
--     riga sarebbe stato bloccato dal proprio prodotto.
--
--   ACCOUNT DI REVIEW scoperto. Il client apre l'accesso a
--     `appreview.demo@fitmesh.fit` riconoscendolo sull'email
--     (lib/core/auth/admin.dart:23). Il server non lo sapeva. Oggi l'account
--     non esiste, quindi non blocca nessuno; alla prossima submission sarebbe
--     passato solo grazie ai 14 giorni, cioe' solo se la review fosse arrivata
--     entro due settimane dalla creazione. Una submission respinta costa
--     settimane, ed e' il fallimento piu' caro di tutta questa lista.
--
-- ── LA MATRICE, MISURATA SUGLI UTENTI VERI DOPO IL CAMBIO ─────────────────
--
--   founder a vita                382 / 382 passano
--   grandfather-prelaunch           8 / 8
--   beta tester storico             7 / 7
--   grant a tempo non scaduto       3 / 3
--   admin                           2 / 2
--   acquirente Play attivo          6 / 6
--   in prova (entro 14 giorni)    100 / 100
--   prova finita e nulla            0 / 58        <- l'unico che deve fallire
--
-- La migration si rifiuta di applicarsi se toglie il diritto a qualcuno che
-- ha un grant valido.
-- ============================================================================

create or replace function public.user_has_active_entitlement(p_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path to ''
as $$
  select p_user_id is not null and (
    -- Grant 'pro' NON SCADUTO: founder, grandfather, beta tester, ring-reward.
    exists (
      select 1 from public.user_roles ur
       where ur.user_id = p_user_id
         and ur.role = 'pro'
         and (ur.expires_at is null or ur.expires_at > pg_catalog.now())
    )
    -- Admin.
    or exists (
      select 1 from public.user_roles ur
       where ur.user_id = p_user_id
         and ur.role = 'admin'
         and (ur.expires_at is null or ur.expires_at > pg_catalog.now())
    )
    -- Pagamento attivo. `founder_grant` non e' un pagamento: e' il grant.
    or exists (
      select 1 from public.b2c_subscriptions bs
       where bs.user_id = p_user_id
         and bs.billing_source <> 'founder_grant'
         and bs.state = 'active'
    )
    -- Account demo per la review degli store.
    -- ATTENZIONE: costante accoppiata a lib/core/auth/admin.dart:23. Se cambia
    -- li', va cambiata anche qui.
    or exists (
      select 1 from auth.users u
       where u.id = p_user_id
         and lower(u.email) = 'appreview.demo@fitmesh.fit'
    )
    -- Primi 14 giorni dalla registrazione.
    or exists (
      select 1 from auth.users u
       where u.id = p_user_id
         and u.created_at > pg_catalog.now() - interval '14 days'
    )
  );
$$;

comment on function public.user_has_active_entitlement(uuid) is
  'UNICA autorita'' sul diritto a scrivere dati salute. Copre i sei casi: grant '
  'pro non scaduto (founder, grandfather, beta, ring-reward a tempo), admin, '
  'pagamento attivo, account demo di review store, primi 14 giorni. '
  'SECURITY DEFINER perche'' legge auth.users. Chiamata dalle policy RLS di '
  'scrittura e da /api/v1/sync.';

revoke all on function public.user_has_active_entitlement(uuid) from public;
grant execute on function public.user_has_active_entitlement(uuid) to authenticated, service_role;

do $$
declare v_persi int;
begin
  select count(*) into v_persi
  from public.user_roles ur
  where ur.role in ('pro','admin')
    and (ur.expires_at is null or ur.expires_at > now())
    and not public.user_has_active_entitlement(ur.user_id);
  if v_persi > 0 then
    raise exception 'il cambio toglie il diritto a % utenti con grant valido', v_persi;
  end if;
end $$;
