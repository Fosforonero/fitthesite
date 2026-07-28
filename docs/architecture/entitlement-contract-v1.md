# Contratto entitlement server-authoritative v1 — consegna all'agente APP

**Stato: DEFINITO, NON ANCORA APPLICATO IN PRODUZIONE.** La migration esiste,
è testata su Postgres reale, ma richiede il `GO APPLY P0.10` esplicito di
Matteo. Finché non è applicata, la RPC **non esiste** sul progetto Supabase
di produzione: un client che la chiamasse oggi riceverebbe un errore
PostgREST `PGRST202` (function not found). Non fare wiring produzione prima
della conferma di apply.

## 1. Endpoint

RPC Supabase (PostgREST), non un endpoint REST custom:

```
POST /rest/v1/rpc/get_entitlement_status
Authorization: Bearer <supabase access token>
Content-Type: application/json
Body: {}          -- nessun parametro, la funzione non ne accetta
```

Da client Supabase: `supabase.rpc('get_entitlement_status')`.

- **Nessun parametro di input di alcun tipo.** Non è "il server ignora il
  timestamp del client": non esiste proprio un canale per inviarlo. La
  funzione legge esclusivamente `auth.uid()` e il proprio orologio.
- `SECURITY DEFINER`, `search_path` fisso (`pg_catalog, public`).
- ACL: `EXECUTE` concesso **solo** a `authenticated`. `anon` e `public`
  revocati esplicitamente. Una chiamata anonima fallisce a livello di
  permessi, non restituisce un default.
- Sola lettura: nessuna riga scritta, nessun side-effect. Chiamabile quante
  volte serve, idempotente per definizione.

## 2. Schema della risposta (JSON), con nullability

| Campo | Tipo | Nullable | Note |
|---|---|---|---|
| `contractVersion` | int | no | `1` in questa versione. Vedi §6. |
| `serverNow` | timestamptz ISO-8601 | no | Orologio del server al momento della valutazione. |
| `trialStartedAt` | timestamptz ISO-8601 | no | `auth.users.created_at`. Il trial parte dalla creazione account, sempre. |
| `trialEndsAt` | timestamptz ISO-8601 | no | `trialStartedAt + 14 giorni`. Valorizzato **sempre**, anche per utenti Founder/lifetime (è un dato derivato, non implica che il trial sia rilevante per quell'utente). |
| `trialStatus` | enum string | no | `active` \| `expired`. Deciso dal server confrontando `serverNow` con `trialEndsAt`. |
| `entitlementKind` | enum string | no | Vedi §3. Questo è il campo che decide l'accesso. |
| `entitlementExpiresAt` | timestamptz ISO-8601 | **sì** | `null` per entitlement permanenti (`founder`, `grandfather`, `lifetime`, `appReview`) e per `none`. Valorizzato per `trial` (= `trialEndsAt`) e per `subscription` (= scadenza reale). |
| `evaluationReason` | enum string | no | Vedi §4. Motivazione puntuale, più granulare di `entitlementKind`. |
| `founderEligibility` | enum string | no | Vedi §5. |
| `founderWindowClosed` | boolean | no | `true` = nessun nuovo grant Founder è più possibile per questo account. Vedi §5. |
| `offlineValidUntil` | timestamptz ISO-8601 | no | `min(trialEndsAt, serverNow + 24h)` quando il trial è ancora nel futuro, altrimenti `serverNow + 24h`. Vedi §7. |

Nessun campo contiene PII: nessuna email, nessun nome, nessun identificativo
device, nessuna metrica sanitaria. `auth.users.email` viene letta
internamente solo per il confronto con l'alias App Review e non compare mai
nella risposta.

## 3. `entitlementKind` — enum esatti e priorità

Valutati in quest'ordine; **il primo che matcha vince**, gli altri non
vengono nemmeno controllati:

| # | Valore | Condizione |
|---|---|---|
| 1 | `founder` | `user_roles(role='pro', note='founder-launch')` non scaduto |
| 2 | `grandfather` | `user_roles(role='pro', note ILIKE '%grandfather%')` non scaduto |
| 3 | `lifetime` | `user_roles(role='pro', expires_at IS NULL)` (permanente, es. beta tester) **oppure** riga `b2c_subscriptions` lifetime (`active_until` oltre l'anno 9000) con `state='active'` |
| 4 | `subscription` | `user_roles(role='pro')` con `expires_at` nel futuro (reward Play +1 anno, ring-reward +6 mesi) **oppure** `b2c_subscriptions` con `billing_source` reale (`google_play`/`apple_iap`/`stripe`, mai `trial`) e `state IN ('active','grace')` |
| 5 | `appReview` | email = `appreview.demo@fitmesh.fit` |
| 6 | `trial` | `serverNow < trialEndsAt` |
| 7 | `none` | nessuno dei precedenti |

**Conseguenza vincolante richiesta da Matteo**: una risposta fresca con
`founder`/`grandfather`/`lifetime`/`subscription`/`appReview` **prevale
sempre** su qualunque cache locale che dica "trial scaduto". La priorità è
già risolta server-side: il client non deve fare merge, deve sostituire lo
stato in blocco con l'ultima risposta fresca ricevuta. Testato
esplicitamente (Caso 18: utente con trial scaduto da 400 giorni + sub
attiva → `subscription`, mai `none`).

**`expires_at` è sempre filtrato.** Un reward a tempo scaduto (ring-reward,
reward Play) **non** vale come `lifetime`: cade in `none` se non c'è
altro. Questo era un bug reale trovato in review avversariale e corretto
prima della consegna (Casi 21/22/23).

## 4. `evaluationReason` — enum esatti

Uno per ciascun ramo, utile per telemetria/debug lato client. Non usarlo per
decidere l'accesso: quello è `entitlementKind`.

`founder_role` · `grandfather_role` · `lifetime_role` ·
`lifetime_subscription_row` · `timed_pro_role` · `active_subscription_row` ·
`app_review_email` · `trial_within_window` · `trial_expired_no_other_entitlement`

## 5. `founderEligibility` / `founderWindowClosed`

| `founderEligibility` | `founderWindowClosed` | Significato |
|---|---|---|
| `already_founder` | `true` | È già Founder. |
| `program_closed` | `true` | Account creato **al o dopo** il cutoff `2026-07-31T22:00:00Z`. Mai eleggibile. |
| `already_has_pro` | `true` | Creato prima del cutoff ma già `pro` per altra via: il motore Founder lo short-circuita, non riceverà mai un nuovo grant. |
| `pending_first_sync` | `false` | Creato prima del cutoff, nessun pro: un grant è ancora possibile, dipende dalla prima sync riuscita. |

**`founderWindowClosed=true` è un motivo di ineleggibilità a un NUOVO grant,
mai una revoca di un grant esistente.** Un Founder ha sempre
`entitlementKind='founder'` e `founderWindowClosed=true` insieme: il primo
dice cosa possiede, il secondo dice solo "non chiedere di nuovo".

Uso previsto lato client: smettere di richiamare
`claim_founder_grant_if_eligible()` ad ogni sign-in quando è `true`. È
un'ottimizzazione, **mai** una fonte di autorizzazione: `isFounder` resta
derivato da `user_roles.note` come oggi.

## 6. Versioning

`contractVersion` è `1`. Cambierà **solo** se la forma della risposta cambia
in modo incompatibile (campo rimosso, tipo cambiato, semantica di un enum
cambiata). Aggiunte puramente additive di campi nuovi non incrementano la
versione: un client v1 deve ignorare campi che non conosce.

**Requisito lato client (concordato)**: una `contractVersion` sconosciuta
(maggiore di quella supportata) deve degradare a `verificationRequired`,
**mai** concedere Pro. Il server non può imporlo, è responsabilità del
client.

## 7. `offlineValidUntil` e policy offline

`offlineValidUntil = min(trialEndsAt, serverNow + 24h)` se il trial non è
ancora scaduto, altrimenti `serverNow + 24h`.

Il cap su `trialEndsAt` esiste perché non ha senso autorizzare 24h di
fiducia offline se il trial scade prima: oltre quell'istante il client
**deve** riverificare. Per entitlement permanenti (`founder`/`lifetime`) il
cap non si applica (il loro `trialEndsAt` è nel passato e irrilevante) e
resta la normale finestra di 24h.

La soglia di 24h vive **solo qui**: il client non deve hardcodarla. Se un
domani cambia, cambia in un punto solo e i client la seguono.

Rilevamento clock rollback: confrontare l'orologio locale con `serverNow`.
Uno scarto negativo rispetto all'ultimo `serverNow` confermato è sospetto e
deve forzare una verifica online, mai un ricalcolo locale silenzioso.

**Una risposta con `trialStatus='expired'` non impedisce in alcun modo un
acquisto o un restore successivo.** Questa RPC è sola lettura e non tocca
mai lo stato di billing.

## 8. Errori e retry

| Situazione | Risposta | Comportamento client atteso |
|---|---|---|
| Nessun JWT / JWT non valido | Errore permessi PostgREST (401/403) | Non ritentare in loop. Trattare come "non autenticato", non come "trial scaduto". |
| `auth.uid()` null nonostante il token | `raise exception 'Not authenticated'` (SQLSTATE `42501`) | Come sopra. |
| Utente non trovato in `auth.users` | `raise exception 'User not found'` (SQLSTATE `P0002`) | Stato anomalo: forzare re-login, mai concedere Pro. |
| Rete/timeout/5xx | nessuna risposta | `TrialVerificationUnreachable`: applicare la policy offline (§7). **Mai** interpretare come "scaduto". |
| `PGRST202` (function not found) | errore PostgREST | Migration non ancora applicata. Degradare a `verificationRequired`, non concedere Pro. |

Retry: backoff esponenziale, mai bloccante per l'uso dell'app. La verifica
fallita non deve mai produrre un errore di acquisto visibile all'utente.

## 9. Fixture JSON (da test reali, non inventate)

Tutte generate dalla suite `supabase/tests/entitlement_p010e/` su Postgres
reale. Timestamp normalizzati per leggibilità.

```jsonc
// trial attivo, giorno 0 (Caso 1)
{
  "contractVersion": 1,
  "serverNow": "2026-07-28T18:11:04.661191+00:00",
  "trialStartedAt": "2026-07-28T18:11:04.660494+00:00",
  "trialEndsAt": "2026-08-11T18:11:04.660494+00:00",
  "trialStatus": "active",
  "entitlementKind": "trial",
  "entitlementExpiresAt": "2026-08-11T18:11:04.660494+00:00",
  "evaluationReason": "trial_within_window",
  "founderEligibility": "pending_first_sync",
  "founderWindowClosed": false,
  "offlineValidUntil": "2026-07-29T18:11:04.661191+00:00"
}

// Founder storico (Caso 5)
{
  "contractVersion": 1, "trialStatus": "expired",
  "entitlementKind": "founder", "entitlementExpiresAt": null,
  "evaluationReason": "founder_role",
  "founderEligibility": "already_founder", "founderWindowClosed": true
}

// grandfather (Caso 6)
{ "entitlementKind": "grandfather", "evaluationReason": "grandfather_role",
  "entitlementExpiresAt": null, "founderWindowClosed": true }

// lifetime da ruolo permanente, es. beta tester (Caso 7)
{ "entitlementKind": "lifetime", "evaluationReason": "lifetime_role",
  "entitlementExpiresAt": null }

// lifetime da acquisto (Caso 8)
{ "entitlementKind": "lifetime", "evaluationReason": "lifetime_subscription_row",
  "entitlementExpiresAt": null }

// subscription attiva (Caso 9)
{ "entitlementKind": "subscription", "evaluationReason": "active_subscription_row",
  "entitlementExpiresAt": "<active_until reale>" }

// pro a tempo ancora valido, es. ring-reward (Caso 22)
{ "entitlementKind": "subscription", "evaluationReason": "timed_pro_role",
  "entitlementExpiresAt": "<expires_at del ruolo>" }

// App Review (Caso 11)
{ "entitlementKind": "appReview", "evaluationReason": "app_review_email" }

// nessun titolo: trial scaduto, nient'altro (Caso 3)
{ "entitlementKind": "none", "entitlementExpiresAt": null,
  "evaluationReason": "trial_expired_no_other_entitlement" }

// account creato ESATTAMENTE al cutoff (Caso 12): trial regolare, Founder mai
{ "entitlementKind": "trial", "founderEligibility": "program_closed",
  "founderWindowClosed": true }
```

## 10. Test e security review

Suite: `supabase/tests/entitlement_p010e/run-suite.sh` — **25/25 casi verdi**
su immagine ufficiale `public.ecr.aws/supabase/postgres:15.8.1.085`
(`auth.users`/`auth.uid()`/ruoli reali, non stub).

Copertura: trial giorno 0 / poco prima / poco dopo la scadenza; assenza di
parametri di input; Founder; grandfather; lifetime da ruolo e da acquisto;
subscription attiva e cancellata; App Review; cutoff esatto e 1ms prima;
isolamento cross-user; chiamata senza JWT; ACL `grant_b2c_trial` post-
hardening; ACL `get_entitlement_status` (authenticated sì, anon no);
prevalenza risposta fresca su trial scaduto; cap `offlineValidUntil`;
`expires_at` scaduto/valido/anomalo su ramo founder; `founderWindowClosed`
per utenti pre-cutoff già pro e non.

Security review: eseguita in workflow avversariale multi-agente (4 reviewer
indipendenti + 4 verificatori). **Un difetto reale trovato e corretto**:
mancava il filtro su `user_roles.expires_at`, per cui un reward a tempo
scaduto sarebbe stato letto come `lifetime` permanente (accesso Pro perpetuo
gratuito). Corretto e coperto da 3 test di regressione dedicati.

Punto aperto noto, **non bloccante per l'app**: il match
`note ILIKE '%grandfather%'` non è mai stato verificato contro i valori
reali di `user_roles.note` in produzione (colonna senza CHECK constraint,
valori scritti a mano). Il preflight lo verifica prima dell'apply. Nel
peggiore dei casi un utente grandfather finisce nel bucket `lifetime`:
accesso identico (permanente, non-Founder), solo etichetta diversa.

## 11. SHA-256 dei file backend consegnati

```
bbefd851eef89db7ea3b22c9f7e0ec773a9a0132fcb6da5949807b97a6081ef8  supabase/migrations/20260728110000_entitlement_status_contract.sql
9a9c0a954702b273996d583c58d3797027b7209f43325ba24d1bcdacb0767522  supabase/migrations/20260728100000_harden_legacy_b2c_trial_acl.sql
3e79bc3d110fd2ca2d50d3c4d3383c8b5f4297e895129e6fabd84094f5885813  supabase/migrations/20260728090000_founder_launch_cutoff_and_window.sql
```

Gli SHA valgono per il contenuto attuale del branch `sprint/p10-founder-sunset`.
Se cambiano prima dell'apply, il contratto va riconfermato.
