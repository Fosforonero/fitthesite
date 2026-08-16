-- ============================================================================
-- IL MURO: SENZA DIRITTO NON ENTRANO DATI SALUTE NUOVI
--
-- Difesa PRIMARIA, non aggirabile da nessun client: sta nelle policy RLS, e
-- `/api/v1/sync` scrive con un client legato al JWT dell'utente (chiave anon +
-- Bearer), non con la service role. Verificato leggendo `requireUser` in
-- lib/api/auth-helpers.ts: se avesse usato la chiave di servizio, un
-- `with_check` qui sarebbe stato un no-op proprio dove serve.
--
-- Il controllo nella route (403) arriva subito dopo e serve a dare all'utente
-- una risposta comprensibile invece di un errore di permesso. Non e' la difesa:
-- e' la cortesia. Un endpoint nuovo scritto fra sei mesi resta bloccato lo
-- stesso.
--
-- ── PERCHE' ANCHE L'UPDATE, E NON SOLO L'INSERT ────────────────────────────
--
-- La scrittura vera passa da `upsert_fitness_metrics_v189`, che e' un UPSERT:
-- per un utente che risincronizza un giorno gia' presente la scrittura e' un
-- UPDATE, non un INSERT. Gatare il solo INSERT avrebbe lasciato aperto il
-- percorso piu' frequente — cioe' quasi tutti.
--
-- Il predicato si aggiunge al `with_check`, non allo `using`: con `using` la
-- riga sarebbe invisibile e l'UPDATE toccherebbe zero righe in silenzio, che e'
-- il modo peggiore di negare. Con `with_check` l'errore e' esplicito.
--
-- ── COSA NON VIENE TOCCATO, E PERCHE' ──────────────────────────────────────
--
-- `devices` in INSERT: le righe device nascono al PAIRING (/api/v1/pair:93), e
-- il pairing usa lo stesso client user-bound. Un `with_check` li' bloccherebbe
-- l'accoppiamento, cioe' proprio chi ha ripreso a pagare e collega un telefono
-- nuovo. La sync legge quella tabella e aggiorna `last_seen_at`, non ci
-- inserisce.
--
-- `workouts` in UPDATE: quella policy serve a modificare le NOTE di un
-- allenamento gia' esistente. Non fa entrare dati salute nuovi, e bloccarla
-- impedirebbe a chi ha perso il diritto di annotare cio' che possiede gia'.
--
-- Tutte le SELECT: chi perde il diritto continua a vedere il proprio storico.
-- Si blocca l'ingresso, non l'accesso.
--
-- ── RISCHIO GESTITO ────────────────────────────────────────────────────────
--
-- Un predicato sbagliato qui ferma la sincronizzazione a TUTTI, che e' un danno
-- peggiore del difetto che chiude. Per questo la funzione e' stata creata prima
-- in una migration separata (20260816140000) e validata contro tutti i 556
-- utenti reali mentre non gateava ancora niente:
--
--   pro rifiutati per errore        0
--   paganti rifiutati per errore    0
--   scrittori senza diritto visti   8
--
-- Il predicato aggiunto e' una CONGIUNZIONE con quello esistente: puo' solo
-- togliere permessi a chi la funzione dichiara senza diritto, mai darne.
-- ============================================================================

-- ── fitness_metrics: INSERT ────────────────────────────────────────────────
drop policy if exists "users insert own metrics" on public.fitness_metrics;
create policy "users insert own metrics"
  on public.fitness_metrics
  for insert
  with check (
    user_id = (select auth.uid())
    and public.user_has_active_entitlement(user_id)
  );

-- ── fitness_metrics: UPDATE (il percorso dell'UPSERT) ──────────────────────
drop policy if exists "users update own metrics" on public.fitness_metrics;
create policy "users update own metrics"
  on public.fitness_metrics
  for update
  using (
    user_id = (select auth.uid())
    and local_day_key is not null
  )
  with check (
    user_id = (select auth.uid())
    and local_day_key is not null
    and public.user_has_active_entitlement(user_id)
  );

-- ── workouts: INSERT ───────────────────────────────────────────────────────
drop policy if exists "users insert own workouts" on public.workouts;
create policy "users insert own workouts"
  on public.workouts
  for insert
  with check (
    user_id = (select auth.uid())
    and public.user_has_active_entitlement(user_id)
  );

-- ── Controllo strutturale: le tre policy chiamano davvero l'autorita' ──────
--
-- Qui NON si scrive niente. La prova di comportamento — impersonare un utente
-- con diritto e uno senza, e provare a inserire — vive fuori da questa
-- migration, in supabase/tests/entitlement_gate/10-muro.sql, dentro una
-- transazione che si annulla: farla qui significherebbe committare righe di
-- prova in produzione insieme alla migration.
do $$
declare
  v_mancanti text[] := '{}';
  r record;
begin
  for r in
    select * from (values
      ('fitness_metrics', 'users insert own metrics'),
      ('fitness_metrics', 'users update own metrics'),
      ('workouts',        'users insert own workouts')
    ) as t(tabella, policy)
  loop
    if not exists (
      select 1 from pg_policies p
       where p.schemaname = 'public'
         and p.tablename = r.tabella
         and p.policyname = r.policy
         and p.with_check like '%user_has_active_entitlement%'
    ) then
      v_mancanti := array_append(v_mancanti, r.tabella || ' / ' || r.policy);
    end if;
  end loop;

  if array_length(v_mancanti, 1) > 0 then
    raise exception
      'il muro non e'' completo: % policy non chiamano l''autorita'': %',
      array_length(v_mancanti, 1), array_to_string(v_mancanti, ', ');
  end if;

  raise notice 'muro montato: le 3 policy di scrittura chiamano user_has_active_entitlement';
end $$;
