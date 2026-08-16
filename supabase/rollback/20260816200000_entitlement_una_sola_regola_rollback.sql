-- ROLLBACK di 20260816200000_entitlement_una_sola_regola.sql
--
-- Da usare solo se l'unificazione va tolta. Nota preliminare: l'unificazione
-- e' stata verificata equivalente sui 558 utenti veri (nessun `kind` e nessuna
-- risposta del muro cambiata), quindi un rollback NON e' un rimedio a un
-- danno noto — serve solo a tornare indietro se emergesse qualcosa di ignoto.
--
-- Due passi, in quest'ordine:
--
--   1. questo file, che rimette il muro esattamente com'era il 16/08 e toglie
--      il nucleo;
--   2. `supabase/migrations/20260729161245_entitlement_status_contract.sql`,
--      rieseguito integralmente, che rimette il contratto alla versione 1.
--
-- Il passo 2 non e' ricopiato qui apposta: sarebbe una terza copia di 300
-- righe che potrebbe divergere dall'originale senza che nessuno se ne accorga.
-- Il file originale e' in repo, non modificato da questa migration.
--
-- Il blocco finale rifiuta di dichiarare completato il rollback finche' il
-- passo 2 non e' stato eseguito davvero.

-- Passo 1a — il muro torna a contenere la propria regola, verbatim dallo
-- stato di produzione precedente (catturato con pg_get_functiondef).

create or replace function public.user_has_active_entitlement(p_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path to ''
as $fn$
  select p_user_id is not null and (
    exists (select 1 from public.user_roles ur
             where ur.user_id = p_user_id and ur.role = 'pro'
               and (ur.expires_at is null or ur.expires_at > pg_catalog.now()))
    or exists (select 1 from public.user_roles ur
                where ur.user_id = p_user_id and ur.role = 'admin'
                  and (ur.expires_at is null or ur.expires_at > pg_catalog.now()))
    -- Pagamento verificato dallo store. `grace` e' incluso: e' il ritentativo
    -- di addebito, e get_entitlement_status() concede Pro li' dentro. Senza,
    -- un pagante con la carta in ritentativo avrebbe il Pro in app e la
    -- sincronizzazione bloccata.
    or exists (select 1 from public.b2c_subscriptions bs
                where bs.user_id = p_user_id
                  and bs.billing_source not in ('founder_grant', 'trial')
                  and bs.state in ('active', 'grace'))
    -- Pagamento SEGNALATO e non ancora verificabile, ponte per il P0.
    or exists (select 1 from private.billing_pagamenti_segnalati s
                where s.user_id = p_user_id
                  and s.revocato_at is null
                  and s.valido_fino > pg_catalog.now())
    -- Account demo per la review degli store. Costante accoppiata a
    -- lib/core/auth/admin.dart:23.
    or exists (select 1 from auth.users u
                where u.id = p_user_id and lower(u.email) = 'appreview.demo@fitmesh.fit')
    -- Primi 14 giorni dalla registrazione.
    or exists (select 1 from auth.users u
                where u.id = p_user_id
                  and u.created_at > pg_catalog.now() - interval '14 days')
  );
$fn$;

revoke all on function public.user_has_active_entitlement(uuid) from public;
grant execute on function public.user_has_active_entitlement(uuid) to authenticated, service_role;

-- Passo 1b — via il nucleo. Va fatto DOPO aver rimesso il muro sopra,
-- altrimenti per un istante il muro punterebbe a una funzione inesistente e
-- ogni scrittura di dati salute fallirebbe.

drop function if exists private.entitlement_core(uuid);

-- Passo 2 — eseguire ORA 20260729161245_entitlement_status_contract.sql.

do $verifica$
declare v_versione int;
begin
  if exists (
    select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
     where n.nspname = 'public' and p.proname = 'get_entitlement_status'
       and pg_get_functiondef(p.oid) like '%entitlement_core%'
  ) then
    raise exception
      'ROLLBACK INCOMPLETO: il contratto punta ancora al nucleo, che questo '
      'file ha appena eliminato. get_entitlement_status() e'' ROTTA finche'' '
      'non esegui 20260729161245_entitlement_status_contract.sql.';
  end if;
  raise notice 'rollback completo: muro autonomo, nucleo rimosso, contratto ripristinato';
end
$verifica$;
