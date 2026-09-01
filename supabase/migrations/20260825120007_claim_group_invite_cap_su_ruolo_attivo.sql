-- Forward-only: il tetto di 8 membri del gruppo famiglia spetta solo a un
-- ruolo pro/admin ATTIVO.
--
-- NON APPLICATA IN PRODUZIONE. Nessuna mutazione remota.
-- Esercitata localmente: gira nel reset completo su Postgres 17 usa-e-getta.
--
-- ============================================================================
-- IL DIFETTO
-- ============================================================================
-- public.claim_group_invite decide il tetto del gruppo famiglia cosi':
--
--   SELECT EXISTS(
--     SELECT 1 FROM public.b2c_subscriptions
--     WHERE user_id = v_owner_id AND state IN ('active','grace','on_hold')
--   ) OR EXISTS(
--     SELECT 1 FROM public.user_roles
--     WHERE user_id = v_owner_id AND role IN ('pro','admin')
--   ) INTO v_is_pro;
--   v_cap := CASE WHEN v_is_pro THEN 8 ELSE 3 END;
--
-- Il secondo EXISTS non guarda `expires_at`. Il proprietario di un gruppo con
-- un Pro SCADUTO conserva il tetto di 8 invece di scendere a 3: un beneficio
-- che sopravvive al diritto che lo giustificava.
--
-- Trovato il 25/08/2026 chiudendo l'inventario dei consumatori di user_roles.
-- La prima sonda l'aveva mancato perche' la funzione nomina `expires_at`...
-- dell'INVITO, non del ruolo (`IF v_invite.expires_at < now()`).
--
-- ============================================================================
-- COSA NON CAMBIA
-- ============================================================================
-- Il primo EXISTS, quello su b2c_subscriptions, resta IDENTICO. La semantica
-- degli abbonamenti non si tocca: 'active', 'grace' e 'on_hold' restano tutti
-- e tre stati paganti, e `grace` e `on_hold` continuano a dare il tetto pieno
-- anche se il pagamento e' in sofferenza. E' voluto: un pagamento in ritardo
-- non e' un diritto scaduto. Il blocco di verifica sotto lo ASSERISCE, cosi'
-- che una modifica futura a questa migration non possa toccarlo di sbieco.
--
-- Nessuna espulsione. La funzione non ha, e continua a non avere, alcuna
-- logica che rimuova membri: se un gruppo ha gia' 5 membri e il tetto scende
-- a 3, i cinque restano e il sesto non entra, perche' il controllo e'
-- `IF v_member_count >= v_cap`. Il diritto che scade chiude la porta, non
-- svuota la stanza.
--
-- ============================================================================
-- PERCHE' SI MODIFICA IL CORPO VIVO INVECE DI RISCRIVERLO
-- ============================================================================
-- Si legge la definizione viva con pg_get_functiondef, si pretende che
-- l'ancora compaia ESATTAMENTE UNA VOLTA, si sostituisce e si riesegue. E' lo
-- stesso idioma di 20260817073706 su questa base di codice.
--
-- Riscrivere la funzione per intero significherebbe incollare qui il corpo
-- che sta nel repository, e su questo progetto il corpo nel repository e
-- quello vivo hanno gia' divergito piu' volte senza che nessuna migration lo
-- registrasse. Se il corpo vivo e' diverso da quello che ci si aspetta,
-- l'ancora non torna e questa migration si rifiuta di applicarsi, invece di
-- sovrascrivere alla cieca.
-- ============================================================================

do $fix$
declare
  v_def       text;
  v_nuovo     text;
  v_occorrenze integer;
  v_b2c_prima  integer;
  v_b2c_dopo   integer;
  v_ancora constant text :=
E'        SELECT 1 FROM public.user_roles\n        WHERE user_id = v_owner_id AND role IN (''pro'',''admin'')\n      ) INTO v_is_pro;';
  v_sostituto constant text :=
E'        SELECT 1 FROM public.user_roles\n        WHERE user_id = v_owner_id AND role IN (''pro'',''admin'')\n          AND (expires_at IS NULL OR expires_at > now())\n      ) INTO v_is_pro;';
  v_b2c constant text := E'WHERE user_id = v_owner_id AND state IN (''active'',''grace'',''on_hold'')';
begin
  select pg_get_functiondef(p.oid) into v_def
  from pg_proc p join pg_namespace n on n.oid = p.pronamespace
  where n.nspname = 'public' and p.proname = 'claim_group_invite'
  limit 1;

  if v_def is null then
    raise exception 'claim_group_invite: la funzione non esiste. Fermarsi.';
  end if;

  -- L'ancora deve comparire esattamente una volta. Zero: il corpo vivo non e'
  -- quello atteso. Piu' di una: non si sa quale si sta cambiando.
  v_occorrenze := (length(v_def) - length(replace(v_def, v_ancora, ''))) / length(v_ancora);
  if v_occorrenze <> 1 then
    raise exception
      'claim_group_invite: ancora del tetto trovata % volte invece di 1. Il '
      'corpo vivo e'' diverso da quello per cui questa migration e'' stata '
      'scritta: fermarsi e riverificare, non sovrascrivere alla cieca.',
      v_occorrenze;
  end if;

  -- Se e' gia' corretta, non si fa niente: idempotente.
  if position(E'AND (expires_at IS NULL OR expires_at > now())' in v_def) > 0 then
    raise notice 'claim_group_invite: il tetto guarda gia'' la scadenza, niente da fare.';
    return;
  end if;

  v_b2c_prima := (length(v_def) - length(replace(v_def, v_b2c, ''))) / length(v_b2c);

  v_nuovo := replace(v_def, v_ancora, v_sostituto);

  v_b2c_dopo := (length(v_nuovo) - length(replace(v_nuovo, v_b2c, ''))) / length(v_b2c);
  if v_b2c_dopo <> v_b2c_prima then
    raise exception
      'claim_group_invite: la sostituzione ha toccato il ramo b2c_subscriptions '
      '(% occorrenze prima, % dopo). La semantica degli abbonamenti deve restare '
      'invariata.', v_b2c_prima, v_b2c_dopo;
  end if;

  execute v_nuovo;
  raise notice 'claim_group_invite: il tetto 8 ora richiede un ruolo pro/admin attivo.';
end
$fix$;

-- ============================================================================
-- CONTROLLO DOPO
-- ============================================================================
do $dopo$
declare
  v_def text;
begin
  select pg_get_functiondef(p.oid) into v_def
  from pg_proc p join pg_namespace n on n.oid = p.pronamespace
  where n.nspname = 'public' and p.proname = 'claim_group_invite';

  if position(E'AND (expires_at IS NULL OR expires_at > now())' in v_def) = 0 then
    raise exception
      'claim_group_invite: il ramo user_roles non filtra la scadenza. Un Pro '
      'scaduto conserverebbe il tetto di 8.';
  end if;
  if position(E'state IN (''active'',''grace'',''on_hold'')' in v_def) = 0 then
    raise exception
      'claim_group_invite: il ramo b2c_subscriptions e'' cambiato. Doveva restare '
      'identico.';
  end if;
  if position('v_cap := CASE WHEN v_is_pro THEN 8 ELSE 3 END' in v_def) = 0 then
    raise exception 'claim_group_invite: i due tetti 8 e 3 non ci sono piu''.';
  end if;

  raise notice
    'claim_group_invite: tetto su ruolo attivo, ramo abbonamenti invariato, '
    'tetti 8 e 3 al loro posto.';
end
$dopo$;
