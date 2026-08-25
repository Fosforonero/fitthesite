-- Controlli su public.get_dashboard_snapshot() dopo la forward-only
-- 20260825120006.
--
-- Classe: REPORTING. Un errore qui non apre un accesso, fa dire un numero
-- sbagliato. Il che basta, perche' su quei numeri si decide se una leva di
-- crescita ha funzionato.
--
-- LE ATTESE SI CALCOLANO DAI DATI, NON SI SCRIVONO A MANO.
-- La prima stesura di questo file si aspettava total_pro = 2 e falliva se
-- eseguita dopo gli altri test, che lasciano le proprie righe 'pro'. Un test
-- che dipende dall'ordine di esecuzione e' un test che un giorno mente: qui
-- l'atteso viene interrogato dalla tabella con la stessa definizione di
-- «attivo» che deve avere la funzione, e il confronto e' fra due misure.

\set ON_ERROR_STOP on

delete from public.user_roles where user_id in (
  'c1111111-1111-1111-1111-111111111111','c2222222-2222-2222-2222-222222222222',
  'c3333333-3333-3333-3333-333333333333','c4444444-4444-4444-4444-444444444444');
delete from auth.users where id in (
  'c1111111-1111-1111-1111-111111111111','c2222222-2222-2222-2222-222222222222',
  'c3333333-3333-3333-3333-333333333333','c4444444-4444-4444-4444-444444444444');

insert into auth.users (id, email) values
  ('c1111111-1111-1111-1111-111111111111','c1@prova.invalid'),
  ('c2222222-2222-2222-2222-222222222222','c2@prova.invalid'),
  ('c3333333-3333-3333-3333-333333333333','c3@prova.invalid'),
  ('c4444444-4444-4444-4444-444444444444','c4@prova.invalid');

insert into public.user_roles (user_id, role, expires_at, note) values
  ('c1111111-1111-1111-1111-111111111111','pro', null,                      'founder-launch'),
  ('c2222222-2222-2222-2222-222222222222','pro', now() - interval '1 day',  'founder-launch'),
  ('c3333333-3333-3333-3333-333333333333','pro', null,                      'concessione manuale'),
  ('c4444444-4444-4444-4444-444444444444','pro', now() - interval '1 day',  'concessione manuale');

do $t$
declare
  s jsonb;
  -- misurate dalla funzione
  f_total_pro         integer;
  f_total_pro_scaduti integer;
  f_founder           integer;
  f_founder_scaduti   integer;
  f_altri_pro         integer;
  -- attese, interrogate dalla tabella
  a_total_pro         integer;
  a_total_pro_scaduti integer;
  a_founder           integer;
  a_founder_scaduti   integer;
  a_altri_pro         integer;
  a_righe_pro         integer;
begin
  select
    count(*) filter (where expires_at is null or expires_at > now()),
    count(*) filter (where expires_at is not null and expires_at <= now()),
    count(*) filter (where note = 'founder-launch' and (expires_at is null or expires_at > now())),
    count(*) filter (where note = 'founder-launch' and expires_at is not null and expires_at <= now()),
    count(*)
    into a_total_pro, a_total_pro_scaduti, a_founder, a_founder_scaduti, a_righe_pro
  from public.user_roles where role = 'pro';

  -- «altri pro» e' per UTENTE, non per riga: chi ha un pro attivo non
  -- founder-launch e non ha anche un founder-launch attivo.
  select count(*) into a_altri_pro
  from auth.users u
  where exists (select 1 from public.user_roles ur
                where ur.user_id = u.id and ur.role = 'pro'
                  and (ur.note is distinct from 'founder-launch' or ur.note is null)
                  and (ur.expires_at is null or ur.expires_at > now()))
    and not exists (select 1 from public.user_roles ur
                where ur.user_id = u.id and ur.role = 'pro' and ur.note = 'founder-launch'
                  and (ur.expires_at is null or ur.expires_at > now()));

  -- Il test non ha senso se non ci sono righe scadute da escludere.
  if a_total_pro_scaduti = 0 then
    raise exception
      '0 FALLISCE  zero righe pro scadute: non c''e'' niente da escludere e '
      'qualunque verde sotto sarebbe vacuo. La fixture non ha funzionato.';
  end if;
  raise notice '0 PASSA  la fixture ha % righe pro, di cui % scadute: c''e'' qualcosa da escludere',
    a_righe_pro, a_total_pro_scaduti;

  s := public.get_dashboard_snapshot();
  f_total_pro         := (s->'totals'->>'total_pro')::int;
  f_total_pro_scaduti := (s->'totals'->>'total_pro_scaduti_storico')::int;
  f_founder           := (s->'totals'->>'founder_grants')::int;
  f_founder_scaduti   := (s->'totals'->>'founder_grants_scaduti_storico')::int;
  f_altri_pro         := (s->'totals'->>'other_pro_grants')::int;

  -- 1. total_pro conta SOLO gli attivi
  if f_total_pro = a_total_pro then
    raise notice '1 PASSA  total_pro = % : solo i Pro attivi', f_total_pro;
  else
    raise exception
      '1 FALLISCE  total_pro = %, atteso %. Le righe pro sono %, di cui % scadute: '
      'se il conteggio le include sta gonfiando i Pro attivi.',
      f_total_pro, a_total_pro, a_righe_pro, a_total_pro_scaduti;
  end if;

  -- 2. gli scaduti non spariscono: chiave dichiarata storica
  if f_total_pro_scaduti = a_total_pro_scaduti then
    raise notice '2 PASSA  total_pro_scaduti_storico = % : etichettati, non persi', f_total_pro_scaduti;
  else
    raise exception '2 FALLISCE  total_pro_scaduti_storico = %, atteso %',
      f_total_pro_scaduti, a_total_pro_scaduti;
  end if;

  -- 3. attivi + scaduti = righe totali: nessuna riga persa per strada
  if f_total_pro + f_total_pro_scaduti = a_righe_pro then
    raise notice '3 PASSA  attivi (%) + scaduti (%) = righe pro (%)',
      f_total_pro, f_total_pro_scaduti, a_righe_pro;
  else
    raise exception
      '3 FALLISCE  attivi (%) + scaduti (%) <> righe pro (%): qualche riga non e'' '
      'ne'' contata ne'' etichettata.', f_total_pro, f_total_pro_scaduti, a_righe_pro;
  end if;

  -- 4. founder_grants separa attivi e scaduti
  if f_founder = a_founder and f_founder_scaduti = a_founder_scaduti then
    raise notice '4 PASSA  founder_grants = % attivi, % scaduti separati', f_founder, f_founder_scaduti;
  else
    raise exception '4 FALLISCE  founder_grants = % (atteso %), scaduti = % (atteso %)',
      f_founder, a_founder, f_founder_scaduti, a_founder_scaduti;
  end if;

  -- 5. other_pro_grants deriva da is_other_pro, che ora rispetta la scadenza
  if f_altri_pro = a_altri_pro then
    raise notice '5 PASSA  other_pro_grants = % : si corregge attraverso is_other_pro', f_altri_pro;
  else
    raise exception
      '5 FALLISCE  other_pro_grants = %, atteso %. Deriva da activity_base.'
      'is_other_pro: se e'' sbagliato, la exists di entitlement_flags non guarda '
      'la scadenza.', f_altri_pro, a_altri_pro;
  end if;

  -- 6. CONTROLLO POSITIVO: il conteggio grezzo, quello di prima, sarebbe
  --    diverso. Se coincidesse, i verdi sopra non proverebbero niente.
  if a_righe_pro = f_total_pro then
    raise exception
      '6 CONTROLLO POSITIVO FALLISCE: il conteggio grezzo delle righe (%) e '
      'quello della funzione (%) coincidono. Il verde del controllo 1 non '
      'dipende dall''esclusione degli scaduti.', a_righe_pro, f_total_pro;
  end if;
  raise notice
    '6 PASSA  controllo positivo: il conteggio grezzo darebbe %, la funzione da'' %. '
    'La differenza sono le % righe scadute.', a_righe_pro, f_total_pro, a_total_pro_scaduti;

  raise notice '--- get_dashboard_snapshot: sette controlli, tutti verdi ---';
end
$t$;

\echo 'get_dashboard_snapshot: sette controlli, tutti verdi.'
