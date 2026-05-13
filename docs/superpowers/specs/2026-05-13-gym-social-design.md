# FitMesh Gym-Social — Design Spec

**Data**: 2026-05-13
**Stato**: Draft approvato in brainstorming, pre-implementation
**Owner**: Matteo Pizzi
**Repo target**: [fitthesite](https://github.com/Fosforonero/fitthesite) (web) + [fitmeshsync](https://github.com/Fosforonero/fitmeshsync) (Android)

---

## TL;DR

FitMesh pivota da app fitness personale a **social network B2B2C centrato sulle palestre**.
Le palestre sono clienti SaaS che pagano un abbonamento mensile (3 tier + 1 custom),
attivano i loro membri tramite codice o email, e creano sfide/leaderboard per
engagement. I membri usano l'app gratis finché sono attivi in una palestra pagante.
I membri non in palestra possono sottoscrivere un abbonamento simbolico (modello
HealthSync: 0,99€/6mesi rinnovabile **oppure** 3,99€ lifetime una tantum) via
Google Play / Apple IAP per sbloccare le funzioni avanzate.

Privacy resta strict: la palestra **non** vede metriche personali per default —
solo identità del membro. La condivisione avviene solo per partecipazione esplicita
a singole challenge.

Il **caregiver mode** (family + RSA + medici) viene parcheggiato per una fase
successiva — lo schema attuale (`caregiver_links`) viene mantenuto.

---

## 1. Personas e user stories

### Personas

- **Gym Owner / Trainer** — vuole engagement, retention, marketing. Paga
  abbonamento mensile. Persona target: titolare palestra di quartiere, studio
  CrossFit, personal trainer indipendente con clienti propri.
- **Gym-covered Member** — membro attivo di una palestra pagante. Usa l'app
  gratis con tier premium. Non si occupa di billing.
- **B2C Self-pay Member** — non in palestra. Due opzioni: 0,99€ ogni 6 mesi
  (renewable) o 3,99€ lifetime una tantum. Sblocca challenge pubbliche e
  dashboard avanzata.
- **B2C Free Member** — non in palestra, no abbonamento. Solo sync + dashboard
  base. Non partecipa a challenge.
- **FitMesh Admin** — supporto/operations interno. Non vede mai dati fitness
  (RLS lo esclude).

### User stories MVP

1. **Owner registra palestra** → trial 30gg auto → genera codice 6-digit →
   crea challenge passi 7gg → vede leaderboard live aggiornata via Supabase Realtime.
2. **Owner attiva membri via email** → carica indirizzi dalla dashboard →
   email automatica con invito + magic link → al signup auto-link a palestra.
3. **Member entra in palestra con codice** → vede challenge attive nella sua
   palestra → opt-in con device picker → push notification quando challenge inizia/finisce.
4. **Owner Stripe Checkout** → upgrade da Base a Advanced → tier features
   sbloccate immediatamente.
5. **B2C member non in palestra sceglie tra Premium 6 mesi (0,99€) o Lifetime
   (3,99€) via Google Play** → verifica receipt server-side → accesso premium
   + partecipazione challenge pubbliche.
6. **Palestra non paga rinnovo** → grace 7gg → status='lapsed' → membri ricevono
   push "la tua palestra non è più attiva" → opzioni: self-pay o restare free.

---

## 2. Entità e relazioni

```
profiles (existing)
  │
  ├── gym_memberships (history, 1 sola attiva per user)
  │     └── gyms ── gym_tiers (base/advanced/premium/custom)
  │           └── gym_subscriptions (Stripe)
  │
  ├── devices (existing)
  │
  ├── challenge_participants ── device_id_used (1 device/challenge)
  │     ├── challenge_scores
  │     └── challenges ── gym_id (nullable: B2C/inter-gym)
  │
  └── b2c_subscriptions (Google Play / Apple IAP / Stripe)

gyms ── gym_email_invites (email-based onboarding)
challenges ── disqualifications (trainer override)
metric_caps (global o per-gym anti-cheat)
```

**Regole cardine**:
- 1 sola `gym_membership` attiva per user (`left_at IS NULL`) — vincolo unique parziale.
- Storico migrazione preservato (mai DELETE su memberships).
- `challenge.gym_id IS NULL` → challenge B2C pubblica o inter-gym (multi-palestra in tabella separata).
- `challenge_participants.device_id_used` impone una sola "fonte" per challenge.

---

## 3. Data model

Migrations da creare:

- `20XXXXXXX_init_gym_core.sql` — `gym_tiers`, `gyms`, `gym_memberships`, `gym_email_invites`, `gym_subscriptions`
- `20XXXXXXX_init_challenges.sql` — `challenges`, `challenge_participants`, `challenge_scores`, `challenge_gym_scores`
- `20XXXXXXX_init_anti_cheat.sql` — `metric_caps`, `disqualifications`
- `20XXXXXXX_init_b2c_subs.sql` — `b2c_subscriptions`
- `20XXXXXXX_gym_rls_policies.sql` — RLS + funzioni `is_gym_owner`, `active_gym_id`, `has_premium_access`
- `20XXXXXXX_gym_functions.sql` — SECURITY DEFINER gateway: `redeem_invite_code`, `accept_email_invite`, `join_challenge`, `disqualify_participant`, `rotate_invite_code`
- `20XXXXXXX_gym_cron_jobs.sql` — refresh leaderboard, archive ended, cleanup expired subs, mark lapsed gyms

### Tabelle chiave (snippet)

```sql
create table public.gyms (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references public.profiles(id) on delete restrict,
  name text not null,
  slug text unique not null,
  invite_code text unique not null,
  tier_id text not null references public.gym_tiers(id) default 'base',
  status text not null default 'trial'
    check (status in ('trial','active','lapsed','suspended')),
  trial_ends_at timestamptz,
  stripe_customer_id text,
  city text, country text,
  logo_url text, brand_color text,
  created_at timestamptz not null default now()
);

create table public.gym_memberships (
  id bigserial primary key,
  user_id uuid not null references public.profiles(id) on delete cascade,
  gym_id uuid not null references public.gyms(id) on delete cascade,
  joined_at timestamptz not null default now(),
  left_at timestamptz,
  role text not null default 'member'
    check (role in ('member','trainer','owner'))
);
create unique index gym_memberships_one_active_idx
  on public.gym_memberships (user_id) where left_at is null;

create table public.challenges (
  id uuid primary key default gen_random_uuid(),
  gym_id uuid references public.gyms(id) on delete cascade,
  name text not null,
  metric text not null check (metric in (
    'steps','distance_m','active_minutes','calories_kcal','workouts_count'
  )),
  -- activity_filter: optional restrizioni sul tipo di workout che conta nella
  -- challenge (ispirato a Health Sync). Shape JSON:
  -- {"activity_types": ["running","cycling"],
  --  "min_duration_min": 10,
  --  "min_distance_m": 100}
  -- Default '{}'::jsonb = nessun filtro, ogni workout valido conta.
  activity_filter jsonb not null default '{}'::jsonb,
  participant_type text not null check (participant_type in (
    'individual','team','gym_vs_gym'
  )),
  recurrence text not null default 'one_shot'
    check (recurrence in ('one_shot','weekly','monthly')),
  period_start timestamptz not null,
  period_end timestamptz not null,
  status text not null default 'draft'
    check (status in ('draft','active','ended','archived')),
  created_by uuid not null references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  check (period_end > period_start)
);

create table public.b2c_subscriptions (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  billing_source text not null
    check (billing_source in ('google_play','apple_iap','stripe','trial')),
  external_product_id text not null,
  external_subscription_id text not null,
  active_until timestamptz not null,
  auto_renewing boolean not null default true,
  state text not null default 'active'
    check (state in ('active','grace','on_hold','paused','expired','cancelled')),
  last_notification_at timestamptz,
  raw_payload jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (billing_source, external_subscription_id)
);
```

### Helper functions

```sql
create or replace function public.is_gym_owner(check_gym_id uuid)
returns boolean language sql security definer stable
set search_path = public as $$
  select exists(
    select 1 from public.gyms
    where id = check_gym_id and owner_user_id = auth.uid()
  );
$$;

create or replace function public.active_gym_id(check_user_id uuid)
returns uuid language sql security definer stable
set search_path = public as $$
  select gym_id from public.gym_memberships
   where user_id = check_user_id and left_at is null
   limit 1;
$$;

create or replace function public.has_premium_access(check_user_id uuid)
returns boolean language sql security definer stable
set search_path = public as $$
  select exists(
    select 1 from public.gym_memberships m
    join public.gyms g on g.id = m.gym_id
    where m.user_id = check_user_id and m.left_at is null
      and g.status in ('trial','active')
  ) or exists(
    select 1 from public.b2c_subscriptions
    where user_id = check_user_id and active_until > now()
      and state in ('active','grace')
  );
$$;
```

---

## 4. RLS + Privacy

**Pattern**: deny by default + grant esplicito. Tutti gli INSERT su tabelle
sensibili passano da funzioni `SECURITY DEFINER` con validazione completa.

**Funzioni gateway**:
- `redeem_invite_code(code text)` — join palestra via codice 6-digit
- `accept_email_invite(invite_id uuid)` — accetta invito email
- `join_challenge(challenge_id uuid, device_id uuid)` — opt-in con device picker
- `leave_challenge(challenge_id uuid)` — abbandono
- `disqualify_participant(challenge_id, user_id, reason)` — owner only
- `rotate_invite_code(gym_id uuid)` — owner only
- `grant_b2c_trial()` — idempotente, attiva trial 7gg per il caller se mai consumato

**Policies chiave**:

```sql
-- Owner gestisce sua palestra
create policy "owner manage gym" on public.gyms for all to authenticated
  using (owner_user_id = auth.uid())
  with check (owner_user_id = auth.uid());

-- Member vede sua palestra
create policy "members select own gym" on public.gyms for select to authenticated
  using (id = public.active_gym_id(auth.uid()));

-- Co-partecipanti si vedono nella leaderboard
create policy "co-participants visibility"
  on public.challenge_participants for select to authenticated
  using (exists(
    select 1 from public.challenge_participants cp
    where cp.challenge_id = challenge_participants.challenge_id
      and cp.user_id = auth.uid()
  ));

-- Owner vede tutti i suoi membri
create policy "gym owner select members"
  on public.gym_memberships for select to authenticated
  using (public.is_gym_owner(gym_id));
```

**View pubbliche per leaderboard**:

`public.challenge_leaderboard_v` — JOIN `challenge_scores` con `profiles.display_name`
(NON email, NON metriche raw). Display name nullable → mostra "Ex-member" se
`left_at` non null, "Account eliminato" se profile cancellato.

**Display name privacy**:
- Default = `profiles.display_name` (può essere nome reale)
- Opzionale: `profiles.display_name_public` (pseudonimo per challenge pubbliche)
- Quando il membro abbandona palestra → display_name visibile come "Ex-member"

**Privacy gym owner**:
- Owner vede lista membri (display_name) e i loro score sulle SUE challenge
- Owner NON vede metriche fitness raw del membro fuori contesto challenge
- Owner NON vede sonno, HR, peso

**Conseguenze per `fitness_metrics` esistenti**:
- RLS policy "users select own metrics" resta invariata
- NESSUNA nuova policy che concede al gym owner di leggere `fitness_metrics`
- Le challenge leggono `fitness_metrics` via SECURITY DEFINER (cron `refresh_challenge_scores`) e producono solo aggregato in `challenge_scores`

---

## 5. Tier features + billing

### Tier palestra (prezzi rivedibili dopo feedback primi clienti)

| Feature                                  | Base 29€/m | Advanced 59€/m | Premium 129€/m | Custom |
|------------------------------------------|------------|----------------|----------------|--------|
| Membri unlimited                          | ✅          | ✅              | ✅              | ✅      |
| Challenge attive contemporanee            | 1          | 3              | unlimited      | unlimited |
| Tipi: individual + monthly leaderboard    | ✅          | ✅              | ✅              | ✅      |
| Tipo: 1v1                                 | ❌          | ✅              | ✅              | ✅      |
| Tipo: inter-gym                           | ❌          | ✅              | ✅              | ✅      |
| Analytics dashboard                       | ❌          | ✅              | ✅              | ✅      |
| Trainer override (squalifica)             | ✅          | ✅              | ✅              | ✅      |
| Branded (logo, colore)                    | ❌          | ❌              | ✅              | ✅      |
| White-label app                           | ❌          | ❌              | ❌              | ✅      |
| API access                                | ❌          | ❌              | ✅              | ✅      |
| Priority support                          | ❌          | ❌              | ✅              | dedicato |
| Trial 30gg                                | ✅          | ✅              | ✅              | n/a    |

### Tier B2C (modello HealthSync: 2 opzioni acquisto)

| Feature                              | Free | Premium 6mo (0,99€) | Premium Lifetime (3,99€) |
|--------------------------------------|------|---------------------|--------------------------|
| Sync HC / Samsung Health             | ✅    | ✅                   | ✅                        |
| Dashboard personale base             | ✅    | ✅                   | ✅                        |
| Storico 7gg                          | ✅    | ✅                   | ✅                        |
| Storico illimitato                   | ❌    | ✅                   | ✅                        |
| Dashboard avanzata                   | ❌    | ✅                   | ✅                        |
| Challenge pubbliche B2C              | ❌    | ✅                   | ✅                        |
| Crea 1 challenge personale           | ❌    | ✅                   | ✅                        |
| Iscriversi a palestra (premium incl.) | ✅    | ✅                   | ✅                        |
| Rinnovo                              | n/a  | ogni 6 mesi auto    | mai (lifetime)            |

**Google Play product mapping**:
- Subscription product `fitmesh_b2c_semi_annual` (0,99€/6 mesi, auto-renewing)
- One-time non-consumable `fitmesh_b2c_lifetime` (3,99€)

**Schema `b2c_subscriptions` per Lifetime**:
- `billing_source='google_play'`, `external_product_id='fitmesh_b2c_lifetime'`
- `auto_renewing=false`, `state='active'`
- `active_until = '9999-12-31 23:59:59+00'::timestamptz` (sentinel "mai scade")
- L'app può rilevare lifetime via `active_until > now() + interval '100 years'`

### Billing flow palestra (Stripe)

```
1. Owner → fitmesh.fit/gym/signup (email + password)
2. Crea palestra → fitmesh.fit/[locale]/gym/owner/setup
3. Trial 30gg auto (status='trial', tier='base')
4. Email "trial ends in 7d"
5. Owner sceglie tier → Stripe Checkout (subscription mode)
6. Webhook app/api/stripe/webhook handle events:
   - checkout.session.completed → gym_subscriptions insert, status='active'
   - invoice.payment_failed → grace 7gg, poi status='lapsed'
   - customer.subscription.deleted → status='lapsed', members lose premium
7. Stripe Customer Portal per gestione (cambio tier, fatture, cancel)
```

### Billing flow membro B2C (Google Play)

```
1. Member tap "Sblocca premium" nell'app → bottom sheet con 2 opzioni:
   "0,99€ ogni 6 mesi" oppure "3,99€ una tantum, mai più"
2. BillingClient.launchBillingFlow con SKU scelto:
   - 'fitmesh_b2c_semi_annual' (subscription)
   - 'fitmesh_b2c_lifetime' (in-app product non-consumable)
3. Purchase ricevuto → POST /api/billing/google-play/verify
4. Backend verifica con Google Play Developer API (verifica diversa per
   subscription product vs in-app product)
5. Insert/update b2c_subscriptions:
   - Subscription: active_until = expiryTimeMillis, auto_renewing dal flag Google
   - Lifetime: active_until = '9999-12-31', auto_renewing=false, state='active'
6. RTDN Pub/Sub → webhook /api/billing/google-play/rtdn
   - Solo per subscription: SUBSCRIPTION_RENEWED / CANCELED / ON_HOLD / etc
   - Lifetime non riceve RTDN (è purchase one-shot)
7. Daily cron mark expired SOLO se NON è lifetime:
   delete from where active_until < now() and active_until < '9999-01-01'
```

**Stato palestra → effetto membri**:

| Stato palestra | Membri |
|----------------|--------|
| trial          | premium |
| active         | premium |
| lapsed         | free (push notification) |
| suspended      | read-only, no join |

**Compliance store policies**:
- App **non** può linkare a payment esterno per B2C upgrade — solo Play Billing.
- App **può** linkare al sito per upgrade palestre — pagatore è terzo (owner), B2B SaaS, no policy violation.

---

## 6. Roadmap fasata

Stima developer singolo, 9-10 settimane lavoro effettivo, ~3 mesi calendario.

### Sprint 0 — Foundation (1 settimana)
- Migrations 008-013 (schema + RLS + functions + cron)
- Seed `gym_tiers`
- Tipi TypeScript generati da `supabase gen types`

### Sprint 1 — Gym owner dashboard MVP (1,5 settimane)
- Routes `app/[locale]/gym/owner/*`: signup, setup, dashboard, members, invite
- Branded display minimo (logo + colore primario)
- Email invite via Resend

### Sprint 2 — Member experience web + Challenge engine (2 settimane)
- Routes `app/[locale]/app/gym/*`: join, challenges list/detail, opt-in
- Cron `refresh_challenge_scores` ogni 5 min (aggrega `fitness_metrics`, applica caps, esclude disqualified, calcola rank)
- Cron `archive_ended_challenges` (daily)
- Supabase Realtime channel su `challenge_scores` per leaderboard live
- Anti-cheat: cap enforcement nel cron, disqualify UI nel gym dashboard

### Sprint 3 — Stripe billing palestra (1 settimana)
- `/api/stripe/checkout`, `/api/stripe/webhook`
- Customer Portal redirect
- Stati trial → active → lapsed flow
- Email transazionali

### Sprint 4 — Android app: join + challenge view + Play Billing (1,5 settimane)
- Repo `fitmeshsync`: nuovo screen "Palestra" (insert code)
- Screen "Sfide" (list + leaderboard + opt-in)
- `BillingClient` integration
- Backend `/api/billing/google-play/verify` + `/api/billing/google-play/rtdn`
- Push notifications FCM (challenge start/end, top 3)

### Sprint 5 — Inter-gym + 1v1 + analytics owner (1,5 settimane)
- `participant_type='gym_vs_gym'` + `challenge_gym_scores`
- UI inter-gym: discovery, invito sfida, accept/decline
- 1v1: invite tra membri
- Analytics dashboard Advanced+ tier
- Branded leaderboard (Premium tier)

### Sprint 6 — Polish + go-live (1 settimana)
- E2E test critical flows
- Onboarding tooltips
- Help center base
- Landing page `/gym` marketing
- Monitoring (Sentry, Vercel analytics)
- Production deploy

### Parked (non MVP)

- **Caregiver mode** (family monitoring + RSA + medici) — schema esistente
  preservato (`caregiver_links`, `is_caregiver()`), brainstorming dedicato dopo
  validation gym MVP.
- **iOS app + Apple IAP** — quando ci sarà l'app iOS.
- **Multi-gym membership** — utenti che frequentano più palestre.
- **Search/directory pubblica palestre** — discovery via città/sport.
- **Custom branding completo / white-label app** — solo tier Custom, su richiesta.
- **Anti-cheat avanzato** — HR correlation, GPS validation per running, cadence check.
- **Social feed** — commenti, like, post tra membri. Apre vaso di Pandora moderazione.
- **Onboarding palestre via CSV import** — se serve scala.

---

## 7. Architettura e deploy

**Approccio scelto**: A + tocco di C (Supabase Realtime per leaderboard live),
strutturato per estrazione futura in microservizio (B) se la scala lo richiede.

**Regole architetturali per future-proofing**:
- Tutta la business logic gym in `lib/gym/*` come moduli puri (no logica nei route handler).
- Route handler = solo parsing input + chiamata a `lib/gym/*` + serializzazione output.
- Migrations gym in file separati (008-013) per chiarezza di rollback/migration export.
- Eventuale estrazione futura: `lib/gym/*` + `supabase/migrations/008+` → nuovo repo.

**Stack**:
- Web: Next.js 15 (App Router) + React 19 + TypeScript strict + Tailwind 3
- DB + Auth + Realtime + Cron: Supabase (Postgres 15 + pg_cron)
- Billing: Stripe (B2B) + Google Play Billing (B2C Android) + Apple IAP (B2C iOS futuro)
- Email: Resend (transactional)
- Push notifications: FCM (Android)
- Hosting: Vercel (Next.js) + Supabase (DB)

---

## 8. Privacy commitments aggiornati

L'aggiunta del gym-social NON cambia i commitment privacy esistenti, ma estende
i canali di consenso:

1. **I dati di salute non sono mai condivisi** senza consenso esplicito.
2. **Non sono trattati per scopi medici** e non costituiscono parere medico.
3. **La palestra vede solo identità del membro** (display_name) + score
   aggregati delle challenge a cui il membro ha esplicitamente fatto opt-in.
4. **Il membro può abbandonare una challenge** in qualsiasi momento — i suoi
   score vengono congelati/rimossi a sua scelta.
5. **Il membro può abbandonare una palestra** → `left_at = now()`, perde
   accesso challenge future, display_name diventa "Ex-member" nelle leaderboard
   storiche.
6. **Diritto all'oblio** (GDPR Art. 17) preservato: cancellazione account →
   cascade su tutte le tabelle gym, leaderboard storiche mostrano "Account eliminato".

Da aggiungere alla pagina privacy:
- Sezione "Partecipazione a challenge palestra"
- Cosa la palestra vede, quanto a lungo, come revocare
- Distinzione tra dati personali (mai condivisi) e score aggregati di challenge (condivisi solo per quella challenge)

---

## 8bis. Feature ispirate a Health Sync

Decisioni di design influenzate dal benchmark Health Sync (concorrente
indiretto sul sync layer, da cui prendiamo le scelte migliori):

### Activity filter per challenge

Le challenge supportano filtri opzionali sul tipo di workout che conta.
Esempio: "Challenge corsa 100km in 7 giorni" filtra solo `running`, esclude
`walking` e `cycling`. Inoltre l'owner può richiedere durata minima (es. solo
sessioni > 10 min) e distanza minima (es. solo > 1km) per evitare gaming
con micro-sessioni.

Schema: `challenges.activity_filter jsonb not null default '{}'::jsonb` con
shape:

```json
{
  "activity_types": ["running", "cycling"],
  "min_duration_min": 10,
  "min_distance_m": 100
}
```

Default `'{}'::jsonb` = nessun filtro applicato.

Il cron `refresh_challenge_scores` (Sprint 2) leggerà il filter e applicherà
sui `workouts`/`fitness_metrics` prima dell'aggregazione. Combinato con i
`metric_caps` globali/per-gym, questa è la stack anti-cheat MVP.

### B2C trial 7 giorni (one-time per device)

Al primo install dell'app FitMesh, l'utente B2C riceve **7 giorni di premium
gratuiti** per provare challenge pubbliche + dashboard avanzata + storico
illimitato. Allo scadere ritorna free, può comprare 0,99€/6mo o 3,99€ lifetime.

**Implementazione**:
- Tabella `b2c_subscriptions` supporta `billing_source='trial'`
- Gateway function `grant_b2c_trial()` (in migration 012) crea la row al primo
  install se l'utente NON ha già un sub e NON ha già consumato un trial
- `external_subscription_id = 'trial-<user_id>'` (unique)
- `active_until = now() + interval '7 days'`, `state='active'`, `auto_renewing=false`
- La funzione `has_premium_access()` la rispetta automaticamente (è una row
  valida in `b2c_subscriptions`)
- Quando il trial scade, il daily cron marca `state='expired'` come per qualsiasi
  sub (la riga resta — questo blocca un secondo trial sullo stesso user)
- Anti-abuso secondario: client passa `installation_id` (Android Installations
  API o hash device) al backend per evitare multi-account farming. Deferred a Sprint 4.

### Sync storico al join di una challenge — DEFERRED v2

Quando un membro joina una challenge in corso, opzionalmente il backend può
sincronizzare gli ultimi N giorni della sua attività per "tornare in pari" con
chi era dentro dall'inizio. Vantaggio: less FOMO, più engagement. Rischio:
back-fill gaming. **Non in MVP** — valutiamo dopo i primi feedback palestre.

### Multi-source (Garmin / Polar / Fitbit) — DEFERRED v2

Health Sync vive di multi-source. Noi partiamo solo Health Connect + Samsung
Health SDK perché coprono ~85% del mercato Android e sono già integrati nell'app
mobile. Aggiungere Garmin/Polar/Fitbit è uno sprint dedicato per ciascuno
(integrazione OAuth + API quotas + mapping campi). **Roadmap v2**.

---

## 9. Rischi e mitigazioni

| Rischio | Livello | Mitigazione |
|---------|---------|-------------|
| Gym owner abusa accesso membri (es. shaming "non sincronizzi") | Medio | Owner non vede sync history individuale per default; solo score challenge. UI palestra non espone "ultimo sync" dei membri. |
| Cheating leaderboard mina trust | Alto | Cap giornaliero + disqualify trainer + 1 device/challenge + validator pluggabile per metriche future. |
| Google Play receipt validation fragile | Medio | Server-side verification con service account + RTDN webhook + grace state. Test integration accurato in sprint 4. |
| Stripe webhook missed/duplicate | Medio | Idempotency key + replay via Stripe Dashboard + cron daily reconciliation. |
| Realtime leaderboard non scala oltre N concurrent | Basso | MVP: piccole palestre. Se serve scala → fallback a polling + cache. |
| GDPR cancellation rompe leaderboard storiche | Basso | Conserva score con label "Account eliminato" — niente PII residue. |
| Membro entra in più palestre tentando di duplicare seat | Basso | Vincolo unique parziale `gym_memberships` su `left_at IS NULL`. |
| Tier 'Custom' senza prezzo automatico = sales required | Basso | Atteso: tier Custom è inbound enterprise, no self-serve. CTA "Contattaci". |
| Caregiver feature in roadmap genera confusione UX | Basso | Schema preservato ma UI non esposta. Decisione esplicita in roadmap. |

---

## 10. Open questions (decidere prima di Sprint 0)

1. **Hosting region Supabase**: già EU? (Conferma per GDPR data residency).
2. **Resend già configurato o serve setup?** (Email transactional palestra + member).
3. **FCM project già esistente o serve creazione?**
4. **Google Play Developer Account già attivo?** (Necessario per Play Billing).
5. **Stripe account già configurato?** (Italia, IVA, fattura elettronica?).
6. **Brand colors / logo per landing /gym** — abbiamo già design system?
7. **i18n**: per gym dashboard solo IT inizialmente o anche EN?
8. **Trial 30gg richiede carta upfront o no?** (Senza carta = più conversion ma più churn).

---

## 11. Success criteria

L'MVP è considerato di successo se entro **6 mesi dal go-live**:

- ≥ 10 palestre attive (tier non-trial)
- ≥ 200 membri totali distribuiti
- ≥ 5 challenge create al mese in media per palestra attiva
- ≥ 40% partecipation rate membri per challenge attiva
- Churn palestre mensile < 10%
- Zero incidenti privacy gravi (leak metriche raw a palestra)
- NPS palestre ≥ 30

---

## Next steps

1. **User review** di questo spec
2. Risolvere **open questions** (sezione 10) per sbloccare Sprint 0
3. Brainstorming → **writing-plans skill** per generare il piano d'implementazione
   dettagliato dello Sprint 0 (migrations + tipi + funzioni gateway + RLS)
4. Implementazione iterativa per sprint, con review utente a fine di ogni sprint
