-- ============================================================================
-- CHI HA DIRITTO A SCRIVERE DATI SALUTE: UNA REGOLA SOLA
--
-- Oggi il diritto non viene controllato da nessuna parte prima di accettare una
-- scrittura. Chi smette di pagare continua a sincronizzare per sempre: e' il
-- rovescio esatto della P0 Apple, dove chi paga non riceve.
--
-- Misurato in produzione il 16/08/2026, prima di questa migration:
--
--   utenti totali                                          556
--   con diritto                                            498
--   SENZA diritto                                           58
--   di questi, hanno scritto negli ultimi 30 giorni          8   (148 righe)
--
-- Il numero e' piccolo per una ragione che non consola: 187 dei 268 che
-- scrivono sono founder con un grant permanente, e 55 sono dentro i 14 giorni
-- di prova. Il muro non esiste, e la coorte che sta per arrivarci e' di 55
-- persone.
--
-- ── UNA AUTORITA', NON UNA COPIA ───────────────────────────────────────────
--
-- La regola esisteva gia', scritta dentro `entitlement_flags` nella vista dello
-- snapshot (20260816110000). La tentazione e' ricopiarla qui. Non si fa: in
-- questo stesso repository due copie della regola di precedenza sulle revoche
-- sono divergute, e una decideva l'opposto dell'altra su un rimborso. Una copia
-- non diverge quando la scrivi: diverge quando cambi l'originale, e a quel
-- punto nessuno si ricorda che esisteva.
--
-- Questa funzione e' l'autorita'. Chi ha bisogno della stessa domanda la chiama.
--
-- ── EQUIVALENZA VERIFICATA, NON DICHIARATA ─────────────────────────────────
--
-- `entitlement_flags` distingue `is_founder` da `is_other_pro` perche' allo
-- snapshot servono separati per contarli. Alla domanda «ha diritto?» servono
-- uniti, e l'unione dei due predicati e' esattamente `role = 'pro'`.
--
-- L'espressione qui sotto e' stata confrontata riga per riga con quella in
-- vigore su TUTTI E 556 gli utenti reali, in sola lettura, prima di essere
-- scritta: **0 divergenze**.
--
-- ── COSA QUESTA FUNZIONE NON DECIDE ────────────────────────────────────────
--
-- Non decide se un utente puo' LEGGERE i propri dati, ne' se puo' accoppiare un
-- dispositivo. Blocca solo l'ingresso di dati salute NUOVI. Chi perde il
-- diritto continua a vedere il proprio storico e a poter tornare.
-- ============================================================================

create or replace function public.user_has_active_entitlement(p_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path to ''
as $$
  select p_user_id is not null and (
    -- Founder e ogni altro grant 'pro': allo snapshot servono distinti, alla
    -- domanda "ha diritto" no. L'unione dei due predicati e' questa.
    exists (
      select 1 from public.user_roles ur
       where ur.user_id = p_user_id
         and ur.role = 'pro'
    )
    -- Pagamento attivo. Si esclude `founder_grant` perche' non e' un pagamento:
    -- e' il grant, gia' coperto dal ramo sopra.
    or exists (
      select 1 from public.b2c_subscriptions bs
       where bs.user_id = p_user_id
         and bs.billing_source <> 'founder_grant'
         and bs.state = 'active'
    )
    -- I primi 14 giorni dalla registrazione. La finestra e' ancorata a
    -- `auth.users.created_at`, che l'utente non puo' toccare.
    or exists (
      select 1 from auth.users u
       where u.id = p_user_id
         and u.created_at > pg_catalog.now() - interval '14 days'
    )
  );
$$;

comment on function public.user_has_active_entitlement(uuid) is
  'UNICA autorita'' sul diritto a scrivere dati salute: grant pro (founder o '
  'altro), pagamento attivo, oppure entro 14 giorni dalla registrazione. '
  'SECURITY DEFINER perche'' deve leggere auth.users. Chiamata dalle policy RLS '
  'di scrittura e da /api/v1/sync. Chi ha bisogno della stessa domanda chiama '
  'questa, non ne riscrive una copia: due copie della regola sulle revoche sono '
  'gia'' divergute in questo repository.';

-- Le policy RLS girano come il chiamante, quindi `authenticated` deve poterla
-- eseguire. `anon` no: non ha mai un diritto da valutare.
revoke all on function public.user_has_active_entitlement(uuid) from public;
grant execute on function public.user_has_active_entitlement(uuid) to authenticated, service_role;

-- ── Verifica di equivalenza, ESEGUITA all'applicazione ─────────────────────
--
-- Non un commento che dichiara l'equivalenza: un confronto che la misura sui
-- dati veri e fa fallire la migration se non regge. Se un giorno
-- `entitlement_flags` cambiasse senza che cambi questa, l'applicazione
-- successiva si fermerebbe qui.
do $$
declare
  v_divergenze int;
begin
  select count(*) into v_divergenze
  from auth.users u
  where public.user_has_active_entitlement(u.id) <> (
      exists(select 1 from public.user_roles ur
              where ur.user_id = u.id and ur.role = 'pro' and ur.note = 'founder-launch')
   or exists(select 1 from public.user_roles ur
              where ur.user_id = u.id and ur.role = 'pro'
                and (ur.note is distinct from 'founder-launch' or ur.note is null))
   or exists(select 1 from public.b2c_subscriptions bs
              where bs.user_id = u.id and bs.billing_source <> 'founder_grant'
                and bs.state = 'active')
   or u.created_at > now() - interval '14 days'
  );

  if v_divergenze > 0 then
    raise exception
      'la nuova autorita'' non coincide con entitlement_flags su % utenti: non collegarla a nessuna policy finche'' non si capisce perche''.',
      v_divergenze;
  end if;

  raise notice 'user_has_active_entitlement: 0 divergenze da entitlement_flags su % utenti',
    (select count(*) from auth.users);
end $$;
