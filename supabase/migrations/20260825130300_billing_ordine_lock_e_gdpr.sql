-- ============================================================================
-- F4 — L'ORDINE UNICO DEI LOCK, E LA CANCELLAZIONE DELL'ACCOUNT
-- ============================================================================
-- Un solo trigger. La funzione `_billing_lock_prima_di_cancellare_utente` e'
-- gia' arrivata con F2: qui si aggancia a `auth.users`.
--
-- L'ORDINE, E PERCHE' E' QUESTO
-- -----------------------------
-- `claim_store_purchase` prende i lock in quest'ordine, sempre:
--
--   1. `auth.users`          for key share
--   2. `b2c_subscriptions`   for update
--   3. `pg_advisory_xact_lock(1, hashtext(owner))`
--
-- Una `delete from auth.users` prende da sola il lock sulla riga utente. Senza
-- questo trigger, la cancellazione toccherebbe `b2c_subscriptions` solo piu'
-- tardi, o non la toccherebbe affatto, e due transazioni concorrenti sullo
-- stesso utente potrebbero incrociarsi al contrario.
--
-- Il trigger prende il lock sulla PROIEZIONE, non sui claim. E' la scelta
-- giusta: `b2c_subscriptions` ha `PRIMARY KEY (user_id)` ed e' la riga che
-- tutti toccano, quindi bloccarla per prima ordina tutto il resto.
--
-- L'ALTRO TRIGGER SULLA STESSA TAVOLA
-- -----------------------------------
-- `auth.users` ha gia' `trg_anonymize_founder_seat_before_user_delete`.
-- Postgres esegue i BEFORE trigger in ordine di NOME, quindi `anonymize`
-- precede `billing`: l'ordine effettivo diventa
-- auth.users → founder_seats → b2c_subscriptions.
--
-- Verificato che non esista un ordine opposto da qualche altra parte: nessuna
-- funzione in `public` o `private` nomina sia `founder_seats` sia
-- `b2c_subscriptions`. Zero, misurato, non supposto. Se un domani ne comparisse
-- una, e' li' che nascerebbe il deadlock.
--
-- IL RISCHIO DI QUESTA MIGRATION
-- ------------------------------
-- Un trigger BEFORE DELETE su `auth.users` che sollevi ROMPE la cancellazione
-- dell'account, che e' un obbligo, non una funzione. La postcondizione qui
-- sotto cancella davvero un utente finto per dimostrare che non lo fa.
-- ============================================================================

CREATE TRIGGER trg_billing_lock_before_user_delete BEFORE DELETE ON auth.users FOR EACH ROW EXECUTE FUNCTION private._billing_lock_prima_di_cancellare_utente();

-- ── Postcondizione ──────────────────────────────────────────────────────────
do $$
declare
  v_trigger int;
  v_def text;
  v_pos_users int;
  v_pos_b2c int;
  v_pos_adv int;
  v_utente uuid := 'f4000000-0000-0000-0000-000000000001'::uuid;
  v_rimasti int;
  v_errore text;
begin
  select count(*) into v_trigger
  from pg_trigger t join pg_class c on c.oid = t.tgrelid
  join pg_namespace n on n.oid = c.relnamespace
  where not t.tgisinternal and n.nspname = 'auth'
    and t.tgname = 'trg_billing_lock_before_user_delete';
  if v_trigger <> 1 then
    raise exception 'F4: il trigger sul delete utente non e'' agganciato';
  end if;

  -- L'ordine dichiarato nel corpo dell'autorita'. E' un controllo strutturale,
  -- non di comportamento: la prova vera e' la corsa concorrente, che sta nella
  -- suite e non in una migration.
  select pg_get_functiondef(p.oid) into v_def
  from pg_proc p join pg_namespace n on n.oid = p.pronamespace
  where n.nspname = 'public' and p.proname = 'claim_store_purchase';
  v_pos_users := position('from auth.users u where u.id = p_owner_user_id for key share' in v_def);
  v_pos_b2c   := position('for update' in v_def);
  v_pos_adv   := position('pg_advisory_xact_lock' in v_def);
  if v_pos_users = 0 or v_pos_b2c = 0 or v_pos_adv = 0 then
    raise exception 'F4: nel corpo di claim_store_purchase manca uno dei tre lock (users=% b2c=% adv=%)',
      v_pos_users, v_pos_b2c, v_pos_adv;
  end if;
  if not (v_pos_users < v_pos_b2c and v_pos_b2c < v_pos_adv) then
    raise exception 'F4: ordine dei lock diverso da users<b2c<advisory (users=% b2c=% adv=%)',
      v_pos_users, v_pos_b2c, v_pos_adv;
  end if;

  -- LA PROVA CHE CONTA: cancellare un account deve continuare a funzionare.
  -- Un trigger BEFORE DELETE che sollevi rompe un obbligo, non una funzione.
  begin
    insert into auth.users (id, email) values (v_utente, 'f4-postcondizione@esempio.invalid')
      on conflict (id) do nothing;
    insert into public.profiles (id, email) values (v_utente, 'f4-postcondizione@esempio.invalid')
      on conflict (id) do nothing;
    delete from public.profiles where id = v_utente;
    delete from auth.users where id = v_utente;
  exception when others then
    v_errore := sqlerrm;
    raise exception 'F4: la cancellazione dell''account e'' rotta dal trigger. Causa riportata dal database: %', v_errore;
  end;

  select count(*) into v_rimasti from auth.users where id = v_utente;
  if v_rimasti <> 0 then
    raise exception 'F4: il trigger non ha sollevato ma l''utente e'' ancora li''. Il delete non e'' avvenuto.';
  end if;

  raise notice 'F4: trigger agganciato, ordine users<b2c<advisory, cancellazione account verde.';
end $$;
