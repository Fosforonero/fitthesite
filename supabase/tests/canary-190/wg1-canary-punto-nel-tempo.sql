-- WG1 — canary punto-nel-tempo.
--
-- Domanda: fra le scritture sanitarie di una finestra, ce n'e' qualcuna fatta
-- da un utente che in QUEL MOMENTO non aveva diritto?
--
-- Non «ha diritto adesso»: adesso non dice niente. Un utente che ha comprato
-- ieri risulterebbe a posto anche se ha scritto un mese fa senza diritto, e un
-- utente il cui abbonamento e' scaduto stanotte risulterebbe colpevole di
-- scritture perfettamente legittime. Il diritto va ricostruito all'istante
-- `received_at` di ogni riga.
--
-- SOLA LETTURA. Nessuna identita' in uscita: solo conteggi.
--
-- ── COSA QUESTO CANARY NON PUO' FARE ───────────────────────────────────────
-- `b2c_subscriptions` conserva lo stato CORRENTE, non la sua storia: non
-- esiste una colonna che dica quando la riga e' diventata `active`. Il ramo
-- abbonamento e' quindi ricostruito in modo GENEROSO — basta che la riga
-- esistesse (`created_at <= T`) e sia oggi in uno stato che concede. Cio'
-- significa:
--   * nessun falso allarme da questo ramo;
--   * ma una violazione vera che passasse solo da qui potrebbe sfuggire.
-- Detto altrimenti: un rosso qui e' quasi certamente vero, un verde qui e'
-- forte ma non totale. Chi legge questo numero deve saperlo, altrimenti il
-- canary diventa una rassicurazione invece che una misura.
--
-- I rami user_roles, registro manuale, appReview e prova sono invece esatti,
-- perche' quelle tabelle hanno la data di concessione.
\set giorni 7
with scritture as (
  select fm.user_id, fm.received_at as t
  from public.fitness_metrics fm
  where fm.received_at >= now() - (:'giorni' || ' days')::interval
  union all
  select w.user_id, w.created_at as t
  from public.workouts w
  where w.created_at >= now() - (:'giorni' || ' days')::interval
),
giudicate as (
  select
    s.user_id,
    s.t,
    (
      -- appReview: incondizionato, come nel ramo vivo di entitlement_core
      exists (select 1 from auth.users u
               where u.id = s.user_id
                 and lower(u.email) in ('review@fitmesh.fit','appreview.demo@fitmesh.fit'))
      -- ruolo pro/admin gia' concesso a T e non ancora scaduto a T  (esatto)
      or exists (select 1 from public.user_roles r
                  where r.user_id = s.user_id
                    and r.role in ('pro','admin')
                    and r.granted_at <= s.t
                    and (r.expires_at is null or r.expires_at > s.t))
      -- abbonamento  (approssimato, vedi nota sopra)
      or exists (select 1 from public.b2c_subscriptions b
                  where b.user_id = s.user_id
                    and b.created_at <= s.t
                    and b.billing_source not in ('trial','founder_grant')
                    and (b.state in ('active','grace')
                         or (b.active_until is not null and b.active_until > s.t)))
      -- pagamento constatato a mano  (esatto)
      or exists (select 1 from private.billing_pagamenti_segnalati p
                  where p.user_id = s.user_id
                    and p.segnalato_at <= s.t
                    and (p.revocato_at is null or p.revocato_at > s.t)
                    and p.valido_fino > s.t)
      -- prova di 14 giorni dalla creazione dell'account  (esatto)
      or exists (select 1 from auth.users u
                  where u.id = s.user_id
                    and s.t < u.created_at + interval '14 days')
    ) as aveva_diritto
  from scritture s
)
select
  :'giorni'                                            as finestra_giorni,
  count(*)                                             as scritture,
  count(distinct user_id)                              as utenti_distinti,
  count(*) filter (where not aveva_diritto)            as scritture_senza_diritto,
  count(distinct user_id) filter (where not aveva_diritto) as utenti_in_violazione
from giudicate;
