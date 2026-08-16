-- ============================================================================
-- CHI HA PAGATO E NON HA LASCIATO TRACCIA, FINCHE' IL P0 NON E' CHIUSO
--
-- Il ramo Apple scrive gia' `billing_source='apple_iap'` in b2c_subscriptions
-- (validate-purchase/route.ts:192), e il muro accetta quella riga. Ma di righe
-- apple_iap non ne esiste NESSUNA: chi ha pagato su Apple e non e' stato
-- servito e' invisibile al server — e da quando esiste il muro sarebbe anche
-- bloccato in scrittura, cioe' un cliente che ha pagato due volte danneggiato.
--
-- Questa tabella non sostituisce la verifica dello store: la precede, e serve a
-- non perdere una persona mentre il percorso vero viene riparato. Scadenza
-- OBBLIGATORIA: un accesso concesso a mano non deve diventare perpetuo per
-- dimenticanza.
--
-- NIENTE RICEVUTE, NIENTE TRANSACTION ID, NIENTE EMAIL: solo un riferimento
-- opaco che l'operatore sceglie per ritrovare il caso nei propri appunti.
--
-- ── DUE ALTRE DIVERGENZE CHIUSE QUI ───────────────────────────────────────
--
--   `grace` ora vale. `get_entitlement_status()` concede Pro durante il
--     ritentativo di addebito; il muro accettava solo `active`. Un pagante con
--     la carta in ritentativo avrebbe avuto il Pro in app e la
--     sincronizzazione bloccata. Oggi zero righe in grace, quindi nessun danno
--     avvenuto — ma sarebbe arrivato al primo addebito fallito.
--
--   `billing_source` allineato a `not in ('founder_grant','trial')`, che e' la
--     forma usata da get_entitlement_status(), invece del solo esclude-founder.
--
-- Matrice dopo il cambio: founder 382/382, beta+grandfather+ring 19/19,
-- admin 2/2, paganti 6/6, in prova 100/100, prova finita e nulla 0/58.
-- ============================================================================

create table if not exists private.billing_pagamenti_segnalati (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  piattaforma text not null check (piattaforma in ('apple','google','altro')),
  riferimento_opaco text,
  nota text,
  segnalato_da text not null,
  segnalato_at timestamptz not null default now(),
  valido_fino timestamptz not null,
  revocato_at timestamptz
);

comment on table private.billing_pagamenti_segnalati is
  'Ponte temporaneo: chi ha pagato ma non ha una riga in b2c_subscriptions, '
  'finche'' il P0 dei pagamenti non e'' chiuso. Scadenza obbligatoria, nessun '
  'dato di ricevuta.';

create index if not exists billing_pagamenti_segnalati_user_idx
  on private.billing_pagamenti_segnalati (user_id)
  where revocato_at is null;

revoke all on private.billing_pagamenti_segnalati from public, authenticated, anon;

create or replace function public.user_has_active_entitlement(p_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path to ''
as $$
  select p_user_id is not null and (
    exists (select 1 from public.user_roles ur
             where ur.user_id = p_user_id and ur.role = 'pro'
               and (ur.expires_at is null or ur.expires_at > pg_catalog.now()))
    or exists (select 1 from public.user_roles ur
                where ur.user_id = p_user_id and ur.role = 'admin'
                  and (ur.expires_at is null or ur.expires_at > pg_catalog.now()))
    or exists (select 1 from public.b2c_subscriptions bs
                where bs.user_id = p_user_id
                  and bs.billing_source not in ('founder_grant', 'trial')
                  and bs.state in ('active', 'grace'))
    or exists (select 1 from private.billing_pagamenti_segnalati s
                where s.user_id = p_user_id
                  and s.revocato_at is null
                  and s.valido_fino > pg_catalog.now())
    or exists (select 1 from auth.users u
                where u.id = p_user_id and lower(u.email) = 'appreview.demo@fitmesh.fit')
    or exists (select 1 from auth.users u
                where u.id = p_user_id
                  and u.created_at > pg_catalog.now() - interval '14 days')
  );
$$;

revoke all on function public.user_has_active_entitlement(uuid) from public;
grant execute on function public.user_has_active_entitlement(uuid) to authenticated, service_role;

do $$
declare v_persi int;
begin
  select count(*) into v_persi from public.user_roles ur
  where ur.role in ('pro','admin') and (ur.expires_at is null or ur.expires_at > now())
    and not public.user_has_active_entitlement(ur.user_id);
  if v_persi > 0 then raise exception 'toglie il diritto a % utenti con grant valido', v_persi; end if;
  select count(*) into v_persi from public.b2c_subscriptions bs
  where bs.state in ('active','grace') and bs.billing_source not in ('founder_grant','trial')
    and not public.user_has_active_entitlement(bs.user_id);
  if v_persi > 0 then raise exception 'toglie il diritto a % paganti', v_persi; end if;
end $$;
