-- ============================================================================
-- OGNI TENTATIVO DI ACQUISTO LASCIA UNA TRACCIA, ANCHE QUANDO FALLISCE
--
-- `validate-purchase` ha quattordici punti di ritorno, e almeno cinque possono
-- lasciare l'utente pagato e non servito: lo store che risponde 502, la
-- ricevuta che non contiene l'acquisto, la configurazione mancante, e
-- soprattutto `upsert_failed` — lo store ha confermato e noi non siamo
-- riusciti a scrivere.
--
-- In nessuno di quei casi restava traccia sul server: solo una riga di log su
-- Vercel, che scade. E' gia' costato un cliente, l'unico che ha pagato su
-- Apple.
--
-- ── LA TRACCIA SI SCRIVE PRIMA DELLA VALIDAZIONE ──────────────────────────
--
-- Non dopo. Scriverla dopo perderebbe esattamente i casi che deve catturare.
--
-- ── NESSUNA COLONNA "ESITO", ED E' DELIBERATO ─────────────────────────────
--
-- Aggiornare un esito avrebbe voluto dire toccare quattordici punti di ritorno
-- dentro il percorso dei pagamenti, che e' il codice piu' pericoloso del
-- prodotto. Chi non e' stato servito si ricava con una QUERY (in fondo), non
-- con altro codice li' dentro.
--
-- ── PRIVACY ───────────────────────────────────────────────────────────────
--
-- Niente ricevute, niente transaction id, niente purchase token, niente email.
-- Solo: chi, da quale piattaforma, per quale prodotto, quando. Il prodotto e'
-- uno SKU.
-- ============================================================================

create table if not exists private.billing_tentativi_acquisto (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  piattaforma text not null check (piattaforma in ('ios', 'android')),
  external_product_id text not null,
  ricevuto_at timestamptz not null default now()
);

comment on table private.billing_tentativi_acquisto is
  'Traccia di OGNI tentativo di acquisto, scritta PRIMA della validazione, '
  'cosi'' un pagamento non servito non si perde. Nessuna ricevuta, nessun '
  'token, nessun transaction id.';

create index if not exists billing_tentativi_acquisto_user_idx
  on private.billing_tentativi_acquisto (user_id, ricevuto_at desc);
create index if not exists billing_tentativi_acquisto_recenti_idx
  on private.billing_tentativi_acquisto (ricevuto_at desc);

revoke all on private.billing_tentativi_acquisto from public, authenticated, anon;

-- La tabella sta in `private`, che non e' esposto all'API: si passa da qui.
-- L'utente arriva come parametro e non da auth.uid() perche' il chiamante e' il
-- backend con la service role, che non ha una sessione utente. Concessa SOLO a
-- service_role: nessun client puo' scrivere tentativi a nome di altri.
create or replace function public.registra_tentativo_acquisto(
  p_user_id uuid,
  p_piattaforma text,
  p_product_id text
) returns void
language plpgsql
security definer
set search_path to ''
as $$
begin
  insert into private.billing_tentativi_acquisto
    (user_id, piattaforma, external_product_id)
  values (p_user_id, p_piattaforma, p_product_id);
exception when others then
  -- La traccia non deve MAI essere il motivo per cui un pagamento fallisce.
  -- Meglio un pagamento servito senza traccia che uno rifiutato per un difetto
  -- della traccia. La route ha la stessa rete, questa e' la seconda.
  raise warning 'registra_tentativo_acquisto fallita: %', sqlstate;
end;
$$;

comment on function public.registra_tentativo_acquisto(uuid, text, text) is
  'Scrive la traccia di un tentativo di acquisto. Chiamata dal backend PRIMA '
  'della validazione dello store. Non solleva mai. Solo service_role.';

revoke all on function public.registra_tentativo_acquisto(uuid, text, text) from public, authenticated, anon;
grant execute on function public.registra_tentativo_acquisto(uuid, text, text) to service_role;

-- ── CHI HA PAGATO E NON E' STATO SERVITO ───────────────────────────────────
--
-- Un tentativo piu' vecchio di 15 minuti senza un diritto corrispondente. I 15
-- minuti sono il margine perche' un ritentativo del client faccia il suo corso
-- senza comparire come guasto.
--
--   select t.user_id, t.piattaforma, t.external_product_id, t.ricevuto_at
--   from private.billing_tentativi_acquisto t
--   where t.ricevuto_at < now() - interval '15 minutes'
--     and not exists (
--       select 1 from public.b2c_subscriptions b
--        where b.user_id = t.user_id
--          and b.external_product_id = t.external_product_id
--          and b.state in ('active', 'grace'))
--     and not exists (
--       select 1 from private.billing_pagamenti_segnalati s
--        where s.user_id = t.user_id and s.revocato_at is null)
--   order by t.ricevuto_at desc;
--
-- Un tentativo NON e' una prova di pagamento: il client chiama questa route
-- anche per un ripristino o per un acquisto che l'utente annulla. La query dice
-- "da guardare", non "da rimborsare".
