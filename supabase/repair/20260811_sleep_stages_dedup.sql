-- ============================================================================
-- RIPARAZIONE STORICA — deduplica di sleep_stages
--
-- PREPARATO, NON APPLICATO. Questo file crea soltanto gli oggetti; nessuna
-- funzione viene invocata da qui. Serve un GO esplicito.
--
-- Dipende da 20260811120000_sleep_merge_idempotent.sql: senza, si ripara uno
-- storico che il merge tornerebbe a gonfiare al primo sync successivo.
-- ============================================================================

create schema if not exists repair;
revoke all on schema repair from public;
-- Nessun grant ad anon/authenticated: la tabella di lavoro contiene stadi del
-- sonno, cioe' dati sanitari. Deve restare invisibile a PostgREST, che espone
-- soltanto gli schemi elencati in Settings > API (per default il solo
-- `public`). Se un giorno `repair` finisse in quella lista, questa tabella
-- diventerebbe un endpoint HTTP.

-- ── La chiave di duplicato, definita UNA volta ─────────────────────────────
-- Identica a quella di internal._canonicalize_sleep_stages_jsonb. Non e' una
-- seconda definizione di "duplicato": e' la stessa, e 30-riparazione.sql lo
-- verifica riga per riga sui dati veri invece di darlo per buono.
create or replace function repair._chiave_segmento(seg jsonb)
returns text language sql immutable as $$
  select coalesce(seg->>'sessionIdx','0') || '|' || (seg->>'startMs') || '|' ||
         (seg->>'endMs') || '|' || lower(btrim(coalesce(seg->>'stage','')));
$$;

-- ── Deduplica MINIMA: conserva l'oggetto e l'ordine originali ──────────────
-- Volutamente diversa da internal._canonicalize_sleep_stages_jsonb, che
-- riscrive startMs/endMs/sessionIdx come interi normalizzati. Qui la
-- normalizzazione non serve e farebbe danno: una riparazione deve cambiare il
-- minimo indispensabile, cosi' il diff e' leggibile e il rollback e' esatto.
-- Il primo di ogni gruppo di duplicati sopravvive, nella posizione che aveva.
create or replace function repair._dedup_conservativo(stages jsonb)
returns jsonb language sql immutable as $$
  with e as (
    select s.value as seg, s.ord
    from jsonb_array_elements(stages) with ordinality as s(value, ord)
  ),
  primi as (
    select distinct on (repair._chiave_segmento(seg)) seg, ord
    from e order by repair._chiave_segmento(seg), ord
  )
  select coalesce(jsonb_agg(seg order by ord), '[]'::jsonb) from primi;
$$;

-- ── Il registro della riparazione: e' anche il backup ──────────────────────
create table if not exists repair.sleep_stages_lavori (
  id              bigint primary key,
  user_id         uuid        not null,
  vecchio         jsonb       not null,
  vecchio_md5     text        not null,
  nuovo           jsonb       not null,
  nuovo_md5       text        not null,
  elementi_prima  int         not null,
  elementi_dopo   int         not null,
  -- Diagnostica su sleep_minutes: CALCOLATA e basta. Nessuna riparazione
  -- automatica di quel campo, e' un contratto separato e non e' rotto.
  minuti_dichiarati int,
  minuti_finestra   int,
  esclusione      text,       -- null = riparabile
  preparato_at    timestamptz not null default now(),
  applicato_at    timestamptz,
  esito           text
);
create index if not exists sleep_stages_lavori_da_fare_idx
  on repair.sleep_stages_lavori (id) where applicato_at is null and esclusione is null;

comment on table repair.sleep_stages_lavori is
  'Registro e backup della deduplica di sleep_stages. Contiene dati sanitari: non esporre lo schema repair a PostgREST, e cancellare la tabella quando la riparazione e'' chiusa e verificata.';

-- ── 1. PREPARA — batch, ripartibile dal cursore, nessuna scrittura sui dati ─
-- Ritorna il numero di righe esaminate e l'ultimo id visto, da ripassare come
-- p_dopo_id al giro successivo. Ripetere finche' `esaminate` = 0.
create or replace function repair.prepara_sleep_stages(
  p_lotto int default 500, p_dopo_id bigint default 0)
returns table (esaminate int, candidate int, ultimo_id bigint)
language plpgsql as $$
declare v_ultimo bigint := p_dopo_id; v_esaminate int := 0; v_candidate int := 0;
begin
  with lotto as (
    select id, user_id, sleep_stages, sleep_minutes, sleep_start_ms, sleep_end_ms
    from public.fitness_metrics
    where id > p_dopo_id
      and jsonb_typeof(sleep_stages) = 'array'
      and case when jsonb_typeof(sleep_stages) = 'array'
               then jsonb_array_length(sleep_stages) else 0 end > 0
    order by id limit p_lotto
  ),
  analisi as (
    select l.*,
      repair._dedup_conservativo(l.sleep_stages) as nuovo,
      -- Array misto: qualunque elemento che non sia un oggetto.
      exists (select 1 from jsonb_array_elements(l.sleep_stages) s(v)
               where jsonb_typeof(s.v) <> 'object') as misto,
      -- Numerici non interpretabili: la stessa soglia del server.
      exists (select 1 from jsonb_array_elements(l.sleep_stages) s(v)
               where jsonb_typeof(s.v) = 'object'
                 and not ((s.v->>'startMs') ~ '^-?[0-9]{1,15}$'
                      and (s.v->>'endMs')   ~ '^-?[0-9]{1,15}$')) as numerici_rotti
    from lotto l
  ),
  -- Sovrapposizione non risolvibile: dopo la deduplica la somma dei segmenti
  -- di UNA sessione supera ancora la finestra di QUELLA sessione. I pisolini
  -- non vengono mai confrontati con la finestra della notte principale.
  ambigue as (
    select a.id from analisi a
    cross join lateral (
      select coalesce(s.v->>'sessionIdx','0') as sess,
             (s.v->>'startMs')::bigint as s0, (s.v->>'endMs')::bigint as s1
      from jsonb_array_elements(a.nuovo) s(v)
      where jsonb_typeof(s.v) = 'object' and not a.misto and not a.numerici_rotti
        and (s.v->>'endMs')::bigint > (s.v->>'startMs')::bigint
    ) g
    group by a.id, g.sess
    having sum(g.s1 - g.s0) > max(g.s1) - min(g.s0)
  ),
  scritte as (
    insert into repair.sleep_stages_lavori (
      id, user_id, vecchio, vecchio_md5, nuovo, nuovo_md5,
      elementi_prima, elementi_dopo, minuti_dichiarati, minuti_finestra, esclusione)
    select a.id, a.user_id, a.sleep_stages, md5(a.sleep_stages::text),
           a.nuovo, md5(a.nuovo::text),
           jsonb_array_length(a.sleep_stages), jsonb_array_length(a.nuovo),
           a.sleep_minutes,
           case when a.sleep_end_ms > a.sleep_start_ms
                then ((a.sleep_end_ms - a.sleep_start_ms) / 60000)::int end,
           case when a.misto then 'array_misto'
                when a.numerici_rotti then 'numerici_non_validi'
                when exists (select 1 from ambigue x where x.id = a.id) then 'overlap_irrisolvibile'
           end
    from analisi a
    -- Solo cio' che cambia davvero: una riga gia' pulita non e' un lavoro.
    where jsonb_array_length(a.nuovo) < jsonb_array_length(a.sleep_stages)
    on conflict (id) do nothing
    returning 1
  )
  select (select count(*) from lotto), (select count(*) from scritte), (select max(id) from lotto)
  into v_esaminate, v_candidate, v_ultimo;

  return query select v_esaminate, v_candidate, coalesce(v_ultimo, p_dopo_id);
end $$;

-- ── 2. DRY-RUN — il conto di cosa succederebbe, senza che succeda ──────────
create or replace function repair.report_sleep_stages()
returns table (voce text, righe bigint, utenti bigint, elementi_rimossi bigint)
language sql as $$
  select coalesce(esclusione, 'RIPARABILE'), count(*), count(distinct user_id),
         sum(elementi_prima - elementi_dopo)
  from repair.sleep_stages_lavori
  where applicato_at is null
  group by 1
  union all
  select 'GIA'' APPLICATE (' || coalesce(esito,'?') || ')', count(*), count(distinct user_id), 0
  from repair.sleep_stages_lavori where applicato_at is not null
  group by esito;
$$;

-- ── 3. APPLICA — batch, ripartibile, con precondizione CAS ─────────────────
-- p_tocca_received_at: vedi README-riparazione-sonno.md. La cache locale del
-- client fa un pull incrementale con watermark su received_at: se non lo si
-- sposta, una riga riparata non viene mai richiesta di nuovo e l'utente
-- continua a vedere il numero vecchio. Non c'e' un default sicuro, quindi non
-- c'e' un default: la scelta e' di chi esegue.
create or replace function repair.applica_sleep_stages(
  p_lotto int, p_tocca_received_at boolean)
returns table (aggiornate int, saltate_cas int)
language plpgsql as $$
declare v_agg int := 0; v_salt int := 0;
begin
  with da_fare as (
    select id, vecchio_md5, nuovo from repair.sleep_stages_lavori
    where applicato_at is null and esclusione is null
    order by id limit p_lotto for update
  ),
  fatte as (
    update public.fitness_metrics f
       set sleep_stages = d.nuovo,
           received_at = case when p_tocca_received_at then now() else f.received_at end
      from da_fare d
     -- CAS: se qualcuno ha toccato la riga dopo la preparazione, non e' piu'
     -- la riga che avevamo analizzato e la si lascia stare. Postgres rilegge
     -- la versione aggiornata sotto lock e ricontrolla questa condizione.
     where f.id = d.id and md5(f.sleep_stages::text) = d.vecchio_md5
    returning f.id
  ),
  marca as (
    update repair.sleep_stages_lavori l
       set applicato_at = now(),
           esito = case when f.id is null then 'saltato_cas' else 'applicato' end
      from da_fare d left join fatte f on f.id = d.id
     where l.id = d.id
    returning l.esito
  )
  select count(*) filter (where esito = 'applicato'),
         count(*) filter (where esito = 'saltato_cas')
    into v_agg, v_salt from marca;
  return query select coalesce(v_agg,0), coalesce(v_salt,0);
end $$;

-- ── 4. ROLLBACK — la stessa cosa al contrario, con la stessa precondizione ─
create or replace function repair.rollback_sleep_stages(p_lotto int)
returns table (ripristinate int, saltate_cas int)
language plpgsql as $$
declare v_ok int := 0; v_salt int := 0;
begin
  with da_disfare as (
    select id, nuovo_md5, vecchio from repair.sleep_stages_lavori
    where esito = 'applicato' order by id limit p_lotto for update
  ),
  fatte as (
    update public.fitness_metrics f set sleep_stages = d.vecchio
      from da_disfare d
     where f.id = d.id and md5(f.sleep_stages::text) = d.nuovo_md5
    returning f.id
  ),
  marca as (
    update repair.sleep_stages_lavori l
       set esito = case when f.id is null then 'rollback_saltato_cas' else 'ripristinato' end,
           applicato_at = null
      from da_disfare d left join fatte f on f.id = d.id
     where l.id = d.id
    returning l.esito
  )
  select count(*) filter (where esito = 'ripristinato'),
         count(*) filter (where esito = 'rollback_saltato_cas')
    into v_ok, v_salt from marca;
  return query select coalesce(v_ok,0), coalesce(v_salt,0);
end $$;
