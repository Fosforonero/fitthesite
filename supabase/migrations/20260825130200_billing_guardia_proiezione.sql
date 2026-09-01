-- ============================================================================
-- F3 — LA GUARDIA SULLA PROIEZIONE, IN MODALITA' COMPATIBILITA'
-- ============================================================================
-- Aggancia a `public.b2c_subscriptions` i due trigger che la difendono. Le
-- funzioni `_b2c_projection_guard` e `set_billing_projection_guard_mode` sono
-- gia' arrivate con F2; `_b2c_no_truncate` arriva qui perche' e' sfuggita al
-- filtro con cui avevo raccolto gli oggetti — il suo nome non contiene
-- «billing», e l'elenco era scritto a mano.
--
-- L'ho trovata facendo la differenza fra TUTTE le funzioni del filone e tutte
-- quelle della ricostruzione, invece di fidarmi del filtro. Le differenze
-- erano due: questa, e `user_shares_metric_with_caller`, che non e' un buco —
-- la riconciliazione del 25/08 l'ha spostata in `rls_internal`, ed e' gia'
-- registrata fra le differenze attese.
--
-- COSA FA LA GUARDIA, E PERCHE' NON IN `strict`
-- ---------------------------------------------
-- In `strict` una scrittura su una riga di sorgente store che non venga dal
-- proiettore viene RIFIUTATA. In `compatibility` passa, e viene registrata
-- all'indietro nel registro dei claim.
--
-- La 190 nasce in `compatibility` di proposito: fra questa migration e il
-- deploy della route che passa dal registro c'e' una finestra in cui la route
-- viva scrive ancora direttamente. In `strict` quella finestra sarebbe un
-- rifiuto di ogni acquisto reale.
--
-- Il passaggio a `strict` e' un'operazione separata, dopo il deploy, con GO
-- esplicito. E non e' una dichiarazione: `set_billing_projection_guard_mode`
-- si RIFIUTA di passare a strict finche' esistono righe che la guardia
-- boccerebbe.
--
-- COSA LA GUARDIA NON FA
-- ----------------------
-- Non decide chi ha diritto. `private.entitlement_core` resta l'unica scala
-- dei diritti e continua a leggere questa tabella senza sapere che esiste una
-- guardia. La guardia decide CHI PUO' SCRIVERE la riga, non cosa la riga
-- significa.
-- ============================================================================

CREATE OR REPLACE FUNCTION private._b2c_no_truncate()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
begin
  raise exception
    'public.b2c_subscriptions: TRUNCATE vietata. Svuotare la proiezione toglierebbe il diritto a ogni cliente pagante in una sola istruzione, e nessun trigger di riga se ne accorgerebbe.'
    using errcode = '42501';
end;
$function$
;

comment on function private._b2c_no_truncate() is
  'Vieta TRUNCATE su public.b2c_subscriptions. I trigger di riga non vedono TRUNCATE: senza questo, una sola istruzione toglierebbe il diritto a ogni cliente pagante senza che nessuna guardia se ne accorga.';

revoke all on function private._b2c_no_truncate() from public, anon, authenticated;

-- ── I due trigger ───────────────────────────────────────────────────────────
CREATE TRIGGER b2c_projection_guard BEFORE INSERT OR DELETE OR UPDATE ON public.b2c_subscriptions FOR EACH ROW EXECUTE FUNCTION private._b2c_projection_guard();
CREATE TRIGGER trg_b2c_no_truncate BEFORE TRUNCATE ON public.b2c_subscriptions FOR EACH STATEMENT EXECUTE FUNCTION private._b2c_no_truncate();

-- ── Postcondizione ──────────────────────────────────────────────────────────
-- I trigger si ESERCITANO, non si contano. Un trigger agganciato a una
-- funzione che non solleva e' indistinguibile da nessun trigger.
do $$
declare
  v_trigger int;
  v_modo text;
  v_truncate_rifiutata boolean := false;
  v_founder_passa boolean := false;
  v_errore text;
begin
  select count(*) into v_trigger
  from pg_trigger t join pg_class c on c.oid = t.tgrelid
  where not t.tgisinternal and c.relname = 'b2c_subscriptions'
    and t.tgname in ('b2c_projection_guard','trg_b2c_no_truncate');
  if v_trigger <> 2 then
    raise exception 'F3: attesi 2 trigger sulla proiezione, trovati %', v_trigger;
  end if;

  select mode into v_modo from private.billing_projection_guard_mode where singleton;
  if v_modo is distinct from 'compatibility' then
    raise exception 'F3: la guardia deve restare in compatibility, trovata %', coalesce(v_modo,'<nessuna riga>');
  end if;

  -- TRUNCATE deve essere rifiutata. Non serve nessuna fixture: la tabella puo'
  -- essere vuota, il trigger e' BEFORE TRUNCATE FOR EACH STATEMENT.
  begin
    truncate table public.b2c_subscriptions;
    v_truncate_rifiutata := false;
  exception when others then
    v_truncate_rifiutata := true;
  end;
  if not v_truncate_rifiutata then
    raise exception 'F3: TRUNCATE sulla proiezione NON e'' stata rifiutata. La guardia e'' inerte.';
  end if;

  -- Controllo positivo: la guardia non deve dire no a tutto. Una riga di
  -- sorgente NON store (founder_grant) deve passare. Senza questo, una guardia
  -- che rifiuta ogni scrittura sembrerebbe corretta.
  --
  -- L'errore vero si porta dietro: al primo giro questo blocco e' diventato
  -- rosso per `profiles.email NOT NULL`, non per la guardia, e il messaggio
  -- diceva «la guardia rifiuta tutto». Un rosso che accusa la cosa sbagliata
  -- e' peggio di nessun rosso.
  begin
    insert into auth.users (id, email) values
      ('f3000000-0000-0000-0000-000000000001'::uuid, 'f3-postcondizione@esempio.invalid')
    on conflict (id) do nothing;
    insert into public.profiles (id, email) values
      ('f3000000-0000-0000-0000-000000000001'::uuid, 'f3-postcondizione@esempio.invalid')
    on conflict (id) do nothing;
    insert into public.b2c_subscriptions
      (user_id, billing_source, external_product_id, external_subscription_id,
       active_until, auto_renewing, state)
    values ('f3000000-0000-0000-0000-000000000001'::uuid, 'founder_grant', 'fitmesh_pro_lifetime',
            'f3-postcondizione', '9999-12-31T00:00:00Z'::timestamptz, false, 'active');
    v_founder_passa := true;
  exception when others then
    v_founder_passa := false;
    v_errore := sqlerrm;
  end;
  if not v_founder_passa then
    raise exception 'F3: una riga founder_grant non passa. Causa riportata dal database: %', v_errore;
  end if;

  -- La fixture non resta. L'ordine conta: prima la riga di proiezione, poi il
  -- profilo — la guardia sul DELETE lascia passare una riga orfana, e lasciare
  -- il profilo per ultimo evita di dipendere da quel ramo.
  delete from public.b2c_subscriptions where user_id = 'f3000000-0000-0000-0000-000000000001'::uuid;
  delete from public.profiles           where id      = 'f3000000-0000-0000-0000-000000000001'::uuid;
  delete from auth.users                where id      = 'f3000000-0000-0000-0000-000000000001'::uuid;

  raise notice 'F3: 2 trigger, compatibility, TRUNCATE rifiutata, founder_grant passa.';
end $$;
