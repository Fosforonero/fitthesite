-- ============================================================================
-- IL PERCORSO SANDBOX PER APP REVIEW
--
-- Il problema, e perche' non e' un dettaglio di QA: TestFlight e App Review
-- comprano in SANDBOX contro il backend di PRODUZIONE. Fino a qui il backend
-- rifiutava ogni transazione Sandbox (`jws_sandbox_not_allowed`), quindi il
-- revisore di Apple poteva completare l'acquisto e non ricevere il Pro. Con
-- quel comportamento iOS resta NO-GO a prescindere da tutto il resto: la
-- schermata che il revisore vede dopo aver pagato e' un paywall.
--
-- La soluzione sbagliata sarebbe accendere `APPLE_ALLOW_SANDBOX` in
-- produzione. Una transazione Sandbox e' GRATUITA per chiunque abbia un Apple
-- ID di test: aprirla globalmente significa regalare il Pro a vita a chiunque
-- sappia chiederlo.
--
-- Quindi: l'apertura non e' dell'ambiente, e' della PERSONA. Un elenco
-- server-side di account autorizzati, che il client non puo' ne' leggere ne'
-- influenzare, e per i quali il backend accetta un JWS Sandbox — sempre
-- verificato crittograficamente, mai creduto sulla parola.
--
-- ── LE QUATTRO CONDIZIONI, TUTTE INSIEME ───────────────────────────────────
--
--   1  l'account e' in questo elenco, e non e' scaduto;
--   2  il JWS verifica del tutto (firma, bundle id, prodotto, tipo) col
--      verificatore Sandbox;
--   3  il JWS porta `appAccountToken` e coincide con l'utente autenticato —
--      obbligatorio qui, mentre in produzione puo' mancare per le transazioni
--      vecchie. Senza, un revisore autorizzato potrebbe presentare la
--      transazione Sandbox di un altro;
--   4  la proprieta' entra nel registro con la chiave in uno SPAZIO SUO
--      (`sandbox:<originalTransactionId>`) e `environment = 'sandbox'`. Gli
--      identificativi Sandbox e produzione vivono in numerazioni diverse e
--      possono coincidere: senza separazione, una transazione di prova
--      potrebbe rivendicare la proprieta' di un acquisto vero.
--
-- ── LA SCADENZA NON E' OPZIONALE ───────────────────────────────────────────
--
-- Ogni riga scade. Un permesso senza scadenza sopravvive alla revisione che lo
-- ha richiesto, e nessuno si ricorda di toglierlo: e' cosi' che un accesso
-- temporaneo diventa una porta aperta. Rinnovarlo e' una UPDATE deliberata.
-- ============================================================================

create table if not exists private.billing_sandbox_reviewers (
  user_id      uuid primary key references auth.users(id) on delete cascade,
  -- A cosa serve questa riga, in parole: "revisione Apple build 190",
  -- "QA interna iOS". Serve a chi la trovera' fra sei mesi e dovra' decidere
  -- se toglierla.
  note         text not null check (length(btrim(note)) between 3 and 200),
  created_at   timestamptz not null default now(),
  expires_at   timestamptz not null,
  constraint billing_sandbox_reviewers_scadenza_futura
    check (expires_at > created_at),
  -- Un permesso lungo mesi non e' un permesso per una revisione: e' una porta.
  constraint billing_sandbox_reviewers_scadenza_breve
    check (expires_at <= created_at + interval '90 days')
);

comment on table private.billing_sandbox_reviewers is
  'Account per cui il backend accetta transazioni Apple SANDBOX in produzione. '
  'Sta in private: il client non lo legge e non lo scrive. Ogni riga scade, e '
  'l''apertura non e'' mai dell''ambiente ma della singola persona.';

revoke all on private.billing_sandbox_reviewers from public, anon, authenticated;

-- ── L'unico modo di interrogarlo dal backend ───────────────────────────────
--
-- PostgREST espone solo lo schema `public`, quindi la tabella non e'
-- raggiungibile nemmeno col service_role. Questa funzione e' la sola porta, e
-- risponde a UNA domanda sola: "questo utente, adesso, e' autorizzato?".
--
-- Non restituisce la nota ne' la scadenza: al backend non servono, e un
-- elenco di chi sta revisionando non ha motivo di uscire da qui.
create or replace function public.is_sandbox_reviewer(p_user_id uuid)
returns boolean
language sql
security definer
stable
set search_path to ''
as $$
  select exists (
    select 1
    from private.billing_sandbox_reviewers r
    where r.user_id = p_user_id
      and r.expires_at > pg_catalog.now()
  );
$$;

revoke all on function public.is_sandbox_reviewer(uuid)
  from public, anon, authenticated;
grant execute on function public.is_sandbox_reviewer(uuid) to service_role;

comment on function public.is_sandbox_reviewer(uuid) is
  'Vero se quell''account e'' oggi autorizzato a presentare transazioni Apple '
  'Sandbox. Solo service_role: la domanda la fa il backend, mai il client.';

-- ── La chiave di proprieta' Sandbox vive in uno spazio suo ─────────────────
--
-- Il vincolo di forma del registro accetta chiavi fino a 64 caratteri. Il
-- prefisso ne consuma 8, e un originalTransactionId Apple ne ha una ventina:
-- ci sta, ma il controllo va scritto perche' se un domani non ci stesse piu'
-- il fallimento deve essere immediato e non silenzioso.
do $$
begin
  if length('sandbox:') + 40 > 64 then
    raise exception 'il prefisso sandbox non lascia spazio a un originalTransactionId';
  end if;
end $$;
