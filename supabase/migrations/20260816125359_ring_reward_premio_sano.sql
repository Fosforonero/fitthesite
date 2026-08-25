-- ============================================================================
-- IL PREMIO ANELLO RESTA, MA SMETTE DI ESSERE REGALABILE
--
-- `ring_reward_heartbeat()` concede 6 mesi di Pro dopo 7 giorni distinti di
-- anello attivo. E' una leva di acquisizione voluta e resta accesa: questa
-- migration non la spegne, la rende difendibile.
--
-- ── COSA NON ANDAVA ───────────────────────────────────────────────────────
--
-- 1. L'ANELLO NON ESISTEVA DAVVERO. L'unico controllo sul parametro era
--    `length(p_ring_hash) >= 32`. L'app manda lo SHA-256 del MAC, ma la
--    funzione e' chiamabile direttamente da qualunque client autenticato:
--    sette chiamate in sette giorni diversi con una stringa inventata
--    valevano sei mesi di Pro. `devices` non contiene l'anello (solo il
--    telefono), quindi l'hash non era confrontabile con niente.
--
-- 2. IL PREMIO SI ACCUMULAVA. Ogni nuovo hash sbloccato faceva
--    `greatest(scadenza, now()) + 6 mesi`. Sette giorni in piu', altri sei
--    mesi, senza tetto. Due utenti hanno gia' due anelli a testa registrati.
--
-- 3. IL PREMIO MATURATO ERA RUBABILE. `on conflict (ring_hash) do update set
--    user_id = v_uid` riassegnava la riga a chi chiamava per ultimo. Chi
--    conoscesse l'hash di un anello arrivato al sesto giorno incassava il
--    premio maturato da un altro.
--
-- ── LE TRE REGOLE NUOVE, E PERCHE' QUELLE SOGLIE ──────────────────────────
--
-- A. I GIORNI DEVONO AVER LASCIATO DATI VERI. Al momento dello sblocco si
--    contano i giorni distinti in cui `fitness_metrics` ha ricevuto righe con
--    `source = 'colmi_ble'` da quell'utente. E' la sola prova che il server
--    puo' verificare da solo: l'hash non prova niente, un dato caricato si'.
--
--    La soglia e' `giorni - 1`, non `giorni`, e la ragione e' misurata: il
--    client chiama l'heartbeat PRIMA che il sync carichi la riga (vedi
--    providers.dart, `_ringRewardHeartbeat` e' invocata dentro la raccolta
--    sorgenti). Sui 12 sblocchi reali, uno dei tre premi legittimi aveva 7
--    giorni dichiarati e 6 di dati caricati: con la soglia a 7 gli avremmo
--    tolto un premio guadagnato. Con la soglia a 6 passa, e viene invece
--    fermato il caso opposto trovato negli stessi dati — un utente con 17
--    giorni dichiarati e UN SOLO giorno di dati anello arrivati.
--
-- B. UN PREMIO PER UTENTE, A VITA. Nessuno sblocco se l'utente ha gia' un
--    altro claim sbloccato. Oggi non toglie niente a nessuno (nessuno e'
--    stato premiato due volte) ma chiude una porta gia' socchiusa.
--
-- C. SE L'ANELLO CAMBIA PADRONE, IL CONTATORE RIPARTE. E se quell'anello
--    aveva gia' premiato qualcuno, non premia di nuovo: `unlocked_at` resta
--    dov'e'. Un anello, un premio, una persona.
--
-- ── COSA NON CAMBIA ───────────────────────────────────────────────────────
--
-- I tre grant gia' concessi (scadenza 13, 15 e 16 febbraio 2027) restano
-- intatti: nessuna revoca retroattiva. La durata resta 6 mesi — e' una
-- decisione di prezzo, non di sicurezza, e va presa a parte.
-- ============================================================================

create or replace function public.ring_reward_heartbeat(p_ring_hash text)
returns table(live_days integer, unlocked boolean, just_unlocked boolean)
language plpgsql
security definer
set search_path to ''
as $fn$
declare
  v_uid          uuid := auth.uid();
  v_today        date := (pg_catalog.now() at time zone 'UTC')::date;
  v_row          public.ring_claims;
  v_just         boolean := false;
  v_giorni_veri  int;
  v_gia_premiato boolean;
begin
  if v_uid is null then
    raise exception 'auth required';
  end if;
  if p_ring_hash is null or length(p_ring_hash) < 32 then
    raise exception 'invalid ring hash';
  end if;

  insert into public.ring_claims as rc
    (ring_hash, user_id, first_live_date, last_live_date, live_days)
  values (p_ring_hash, v_uid, v_today, v_today, 1)
  on conflict (ring_hash) do update set
    user_id        = v_uid,
    last_live_date = v_today,
    -- Regola C: se la riga apparteneva a un altro account, il conteggio
    -- riparte da oggi. Senza questo, conoscere l'hash di un anello arrivato
    -- al sesto giorno bastava per incassare il premio maturato da un altro.
    first_live_date = case
                        when rc.user_id is not distinct from v_uid then rc.first_live_date
                        else v_today
                      end,
    live_days      = case
                       when rc.user_id is distinct from v_uid then 1
                       when rc.last_live_date < v_today then rc.live_days + 1
                       else rc.live_days
                     end,
    updated_at     = pg_catalog.now()
  returning * into v_row;

  update public.profiles set has_ring = true
  where id = v_uid and has_ring = false;

  if v_row.live_days >= 7 and v_row.unlocked_at is null then

    -- Regola B: un premio per utente, a vita.
    select exists (
      select 1 from public.ring_claims o
       where o.user_id = v_uid
         and o.unlocked_at is not null
         and o.ring_hash <> p_ring_hash
    ) into v_gia_premiato;

    -- Regola A: i giorni contati devono aver lasciato dati veri sul server.
    select count(distinct (m.received_at at time zone 'UTC')::date)
      into v_giorni_veri
      from public.fitness_metrics m
     where m.user_id = v_uid
       and m.source = 'colmi_ble';

    if not v_gia_premiato and v_giorni_veri >= v_row.live_days - 1 then
      update public.ring_claims set unlocked_at = pg_catalog.now()
       where ring_hash = p_ring_hash and unlocked_at is null
      returning * into v_row;

      if found then
        v_just := true;
        insert into public.user_roles (user_id, role, expires_at, note)
        values (v_uid, 'pro', pg_catalog.now() + interval '6 months', 'ring-reward')
        on conflict (user_id, role) do update set
          -- Niente accumulo: si prende la scadenza piu' lontana fra quella
          -- che c'e' gia' e sei mesi da adesso, non la somma delle due. Un
          -- grant permanente (expires_at null) resta permanente.
          expires_at = case
            when public.user_roles.expires_at is null then null
            else greatest(public.user_roles.expires_at,
                          pg_catalog.now() + interval '6 months')
          end,
          note = case
            when public.user_roles.note is null or public.user_roles.note = ''
            then 'ring-reward' else public.user_roles.note end;
      end if;
    end if;
  end if;

  return query select v_row.live_days, (v_row.unlocked_at is not null), v_just;
end;
$fn$;

comment on function public.ring_reward_heartbeat(text) is
  'Premio anello: 7 giorni distinti di anello attivo valgono 6 mesi di Pro. '
  'Lo sblocco richiede che i giorni abbiano lasciato dati veri (source '
  '''colmi_ble'') e vale una volta sola per utente. Concede diritto Pro: '
  'ogni modifica va trattata come codice di billing.';

-- Concedere Pro non e' un'operazione da utente non autenticato. La funzione
-- solleva gia' 'auth required', ma il permesso non deve nemmeno esistere: se
-- un domani qualcuno togliesse quel controllo, il permesso lo aspetterebbe.
revoke execute on function public.ring_reward_heartbeat(text) from anon;
