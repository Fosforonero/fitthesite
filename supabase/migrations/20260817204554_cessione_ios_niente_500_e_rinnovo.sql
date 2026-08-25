-- Due correzioni a public.concedi_ponte_ios, entrambe trovate prima
-- dell'innesto nella rotta di sync.
--
-- 1. NIENTE 500. `user_roles` ha PRIMARY KEY (user_id, role): un utente puo'
--    avere UNA sola riga con role='pro'. Un utente iOS con una riga pro
--    SCADUTA (per esempio un ring-reward finito) supera tutte e tre le
--    guardie, perche' entitlement_core ignora giustamente le righe scadute,
--    e poi l'insert viola la chiave primaria. L'eccezione risalirebbe fino
--    alla rotta di sync: 500 sull'endpoint che tiene in piedi il prodotto.
--    Non e' teorico: esistono tre ring-reward a tempo ancora validi, ed e'
--    una mina con una data sopra.
--
-- 2. IL PONTE SI RINNOVA finche' la causa esiste. La versione precedente
--    concedeva una volta sola per utente, per sempre: alla scadenza quegli
--    utenti sarebbero rimasti fuori di nuovo, senza poter avere un secondo
--    ponte, cioe' lo stesso problema con una miccia di sei mesi.
--
--    Il rinnovo NON diventa permanente da solo, e non serve un promemoria:
--    quando il percorso apple_iap funzionera', quell'utente avra' una riga
--    vera in b2c_subscriptions, quindi `hasFullAccess` sara' true e la PRIMA
--    guardia fermera' il rinnovo. Il ponte scade da solo quando smette di
--    servire. La condizione di uscita e' automatica, non umana.
--
-- Sparisce la terza guardia ("ha gia' un ponte"): un ponte ATTIVO non arriva
-- mai all'insert, perche' da' hasFullAccess e viene fermato sopra. Tenerla
-- avrebbe impedito proprio il rinnovo.
--
-- La clausola `on conflict` rinnova SOLO una cessione gia' scaduta. Qualunque
-- altra riga pro (founder, grandfather, ring-reward, beta) non viene toccata:
-- niente aggiornamento, niente eccezione, si ritorna false.
--
-- `granted_by` resta nullo: la chiave esterna punta a `profiles` e nessun
-- profilo corrisponde al sistema. NULLO QUI SIGNIFICA "concessione
-- automatica", non "dato mancante".

create or replace function public.concedi_ponte_ios(p_user_id uuid)
returns boolean
language plpgsql
security definer
set search_path to ''
as $fn$
declare
  v_ha_diritto boolean;
  v_e_ios boolean;
begin
  if p_user_id is null then
    return false;
  end if;

  -- Chi ha gia' diritto non ha bisogno di un ponte. Stessa funzione che
  -- decide tutto il resto: una regola sola. E' anche cio' che spegne il
  -- rinnovo il giorno in cui apple_iap comincia a scrivere davvero.
  select coalesce(
           (private.entitlement_core(p_user_id) ->> 'hasFullAccess')::boolean,
           false)
    into v_ha_diritto;
  if v_ha_diritto then
    return false;
  end if;

  -- Piattaforma verificata dai dati, mai dichiarata dal chiamante: "sono iOS"
  -- detto dal client sarebbe falsificabile e regalerebbe Pro a chiunque.
  select exists (
    select 1 from public.fitness_metrics
    where user_id = p_user_id and source = 'healthkit'
    limit 1
  ) into v_e_ios;
  if not v_e_ios then
    return false;
  end if;

  insert into public.user_roles (user_id, role, expires_at, note)
  values (
    p_user_id,
    'pro',
    pg_catalog.now() + interval '6 months',
    'cessione-ios-in-attesa-apple-iap'
  )
  on conflict (user_id, role) do update
    set expires_at = excluded.expires_at
  where public.user_roles.note like 'cessione-ios%'
    and public.user_roles.expires_at is not null
    and public.user_roles.expires_at <= pg_catalog.now();

  -- Nessuna riga toccata = c'era gia' una riga pro che non e' una cessione
  -- scaduta. Non si concede e, soprattutto, non si esplode.
  if not found then
    return false;
  end if;

  return true;
end
$fn$;

comment on function public.concedi_ponte_ios(uuid) is
  'Ponte temporaneo per utenti iOS senza diritto, finche non esiste un percorso che scrive apple_iap. Verifica la piattaforma dai dati, non dal chiamante. Si rinnova finche la causa esiste e si spegne da solo quando arriva una riga apple_iap vera (la prima guardia lo ferma). Non solleva mai eccezioni sulla chiave primaria (user_id, role). granted_by nullo significa concessione automatica, non dato mancante.';

revoke execute on function public.concedi_ponte_ios(uuid) from public;
revoke execute on function public.concedi_ponte_ios(uuid) from anon;
revoke execute on function public.concedi_ponte_ios(uuid) from authenticated;
