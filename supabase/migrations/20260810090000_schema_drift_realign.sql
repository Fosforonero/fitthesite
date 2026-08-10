-- ============================================================================
-- Riallineamento del repository allo schema di PRODUZIONE
--
-- Non introduce niente di nuovo. Ricostruisce tre oggetti che in produzione
-- esistono da tempo e che nessuna migration di questo repository crea, quindi
-- una ricostruzione da zero non li aveva.
--
-- Come sono stati ricavati: leggendo i cataloghi live in sola lettura
-- (information_schema.columns, pg_constraint, col_description) il 2026-08-10,
-- non a memoria e non dedotti dall'uso.
--
--   public.fitness_metrics.hr_source_name      text, nullable, con commento
--   public.fitness_metrics.hr_source_quality   text, nullable, con commento
--                                              + CHECK sui quattro valori
--   public.b2c_subscriptions_billing_source_check
--                                              deve ammettere 'founder_grant'
--
-- Perche' il drift non si era visto: `supabase db reset` applica tutte le
-- migration con exit 0 e zero errori. Postgres non valida i corpi plpgsql alla
-- creazione, quindi `public.upsert_fitness_metrics_v189` veniva creata anche
-- referenziando due colonne inesistenti, e falliva soltanto se qualcuno la
-- chiamava. Un reset verde non dimostra che lo schema sia quello giusto.
--
-- SU PRODUZIONE E' UN NO-OP. Ogni passo controlla prima se l'oggetto c'e' gia'
-- ed esce senza toccare niente. Non elimina dati, non riscrive righe, non
-- cambia una definizione esistente in qualcosa di diverso.
--
-- Dettaglio in supabase/backfill/README-drift-schema.md.
-- ============================================================================

-- ── 1. Le due colonne ───────────────────────────────────────────────────────
-- `if not exists` le rende no-op dove esistono gia'. Restano nullable e senza
-- default, come in produzione: un default riscriverebbe righe esistenti, ed e'
-- esattamente cio' che questa migration non deve fare.
alter table public.fitness_metrics
  add column if not exists hr_source_name text;

alter table public.fitness_metrics
  add column if not exists hr_source_quality text;

comment on column public.fitness_metrics.hr_source_name is
  'Package name della sorgente HR vincente (es. fi.polar.beat, '
  'com.samsung.android.shealth). Null = legacy/single-source.';

comment on column public.fitness_metrics.hr_source_quality is
  'Tier qualita HR: premium (chest strap), standard (smartwatch), '
  'basic (fitness band/phone), unknown.';

-- ── 2. Il vincolo sul tier di qualita' ──────────────────────────────────────
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.fitness_metrics'::regclass
      and conname = 'fitness_metrics_hr_source_quality_check'
  ) then
    alter table public.fitness_metrics
      add constraint fitness_metrics_hr_source_quality_check
      check (
        hr_source_quality is null
        or hr_source_quality in ('premium', 'standard', 'basic', 'unknown')
      );
    raise notice 'drift: aggiunto fitness_metrics_hr_source_quality_check';
  else
    raise notice 'drift: fitness_metrics_hr_source_quality_check gia presente, nessuna modifica';
  end if;
end $$;

-- ── 3. founder_grant fra le sorgenti ammesse ────────────────────────────────
-- In produzione il vincolo lo ammette e ci sono 18 righe che lo usano; nella
-- ricostruzione locale no, quindi quelle righe non erano nemmeno creabili.
--
-- Sostituire un vincolo richiede drop + add, che in Postgres sono transazionali
-- e quindi atomici: non esiste un istante in cui la tabella resta senza. Si fa
-- SOLO se la definizione corrente non ammette gia' il valore, cosi' su
-- produzione non viene toccato niente.
do $$
declare
  v_def text;
begin
  select pg_get_constraintdef(oid) into v_def
  from pg_constraint
  where conrelid = 'public.b2c_subscriptions'::regclass
    and conname = 'b2c_subscriptions_billing_source_check';

  if v_def is null then
    alter table public.b2c_subscriptions
      add constraint b2c_subscriptions_billing_source_check
      check (billing_source in
        ('google_play', 'apple_iap', 'stripe', 'trial', 'founder_grant'));
    raise notice 'drift: creato b2c_subscriptions_billing_source_check';

  elsif position('founder_grant' in v_def) = 0 then
    alter table public.b2c_subscriptions
      drop constraint b2c_subscriptions_billing_source_check;
    alter table public.b2c_subscriptions
      add constraint b2c_subscriptions_billing_source_check
      check (billing_source in
        ('google_play', 'apple_iap', 'stripe', 'trial', 'founder_grant'));
    raise notice 'drift: b2c_subscriptions_billing_source_check ora ammette founder_grant';

  else
    raise notice 'drift: b2c_subscriptions_billing_source_check gia allineato, nessuna modifica';
  end if;
end $$;

-- ── 4. Verifica finale ──────────────────────────────────────────────────────
-- Se dopo questa migration lo schema non e' quello atteso, e' meglio saperlo
-- adesso che alla prima chiamata di upsert_fitness_metrics_v189.
do $$
declare
  v_mancanti int;
begin
  select count(*) into v_mancanti
  from (values ('hr_source_name'), ('hr_source_quality')) as c(nome)
  where not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'fitness_metrics'
      and column_name = c.nome
  );
  if v_mancanti > 0 then
    raise exception 'drift non riallineato: % colonne hr_source_* ancora assenti', v_mancanti;
  end if;

  if position('founder_grant' in (
    select pg_get_constraintdef(oid) from pg_constraint
    where conrelid = 'public.b2c_subscriptions'::regclass
      and conname = 'b2c_subscriptions_billing_source_check'
  )) = 0 then
    raise exception 'drift non riallineato: billing_source non ammette founder_grant';
  end if;

  raise notice 'drift: schema allineato alla produzione';
end $$;
