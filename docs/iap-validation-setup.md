# Setup validazione IAP server-side (Google Play)

Questa guida descrive **una sola volta** la configurazione necessaria a far
funzionare `POST /api/v1/billing/validate-purchase`. Senza questa configurazione
la route risponde `503 google_play_not_configured` (graceful degradation: l'app
Flutter in modalità dev cade su grant in-memory; in production l'utente vede
"Validazione acquisto fallita").

## 1. Creare un service account su Google Cloud Console

1. Vai su https://console.cloud.google.com/iam-admin/serviceaccounts
2. Seleziona il progetto Firebase/GCP collegato a FitMesh Sync (lo stesso usato
   per Google Sign-In, vedi `CURRENT_HANDOFF.md` per l'ID progetto).
3. Click su **CREATE SERVICE ACCOUNT**.
4. Nome: `fitmesh-iap-validator`. Description: `Server-side IAP validation`.
5. Skip "Grant this service account access to project" (lo facciamo dopo).
6. Salva. Apri il service account creato.
7. Tab **KEYS** → **ADD KEY** → **Create new key** → **JSON** → Download.
8. Conserva il file `.json` scaricato — contiene `private_key`, non
   committarlo da nessuna parte.

## 2. Abilitare la Google Play Android Developer API

1. https://console.cloud.google.com/apis/library/androidpublisher.googleapis.com
2. Assicurati di essere nel progetto giusto.
3. Click **ENABLE**.

## 3. Concedere accesso al service account in Play Console

Il service account deve poter leggere i purchase dell'app `com.fitmeshsync.app`.

1. https://play.google.com/console → seleziona organizzazione.
2. Menu sinistro → **Users and permissions** → **Invite new users**.
3. Email: l'email del service account (campo `client_email` del JSON,
   tipicamente `fitmesh-iap-validator@<project>.iam.gserviceaccount.com`).
4. **App permissions** → seleziona FitMesh Sync.
5. Permessi minimi richiesti:
   - `View app information and download bulk reports`
   - `View financial data, orders, and cancellation survey responses`
   - `Manage orders and subscriptions`
6. Click **Invite user**. La propagazione richiede **fino a 24h**, ma di solito
   è immediata.

## 4. Configurare la env var su Vercel

1. https://vercel.com/<team>/fitthesite/settings/environment-variables
2. Add new:
   - **Name**: `GOOGLE_PLAY_SERVICE_ACCOUNT_JSON`
   - **Value**: incolla il **contenuto intero** del file `.json` scaricato al
     punto 1.7 (NON il path, il JSON inline come stringa). Devono restare gli
     `\n` nel campo `private_key` (sia letterali `\\n` che newline reali sono
     accettati: il backend normalizza).
   - **Environments**: Production + Preview (NON Development, per safety).
3. Trigger redeploy: Settings → Deployments → tre puntini → Redeploy.

Verifica: dopo il redeploy, prova la route con un purchase token reale
(vedi sezione successiva). La risposta deve essere 200 e `state: 'active'`.

## 5. Testare con curl

Prendi un JWT Supabase valido (dall'app in debug, oppure dal Supabase Auth
Dashboard → Authentication → Users → genera link magic). Poi:

```bash
curl -X POST https://www.fitmesh.fit/api/v1/billing/validate-purchase \
  -H "Authorization: Bearer <SUPABASE_JWT>" \
  -H "Content-Type: application/json" \
  -d '{
    "product_id": "fitmesh_pro_lifetime",
    "purchase_token": "<token_da_app>",
    "package_name": "com.fitmeshsync.app"
  }'
```

Risposte attese:
- **200**: `{"state":"active","active_until":"9999-12-31T23:59:59Z","source":"google_play","auto_renewing":false}` per lifetime, oppure expiry reale per subscription.
- **502 google_validation_failed**: il purchase token è scaduto, sbagliato, o il
  service account non ha permessi sufficienti. Vedi i log del runtime per il
  body Google.
- **503 google_play_not_configured**: env var non settata.

Per testare lo scenario **expired**, riusa un purchase token vecchio: Google
risponderà 410 e noi UPSERT con `state='expired'`.

## 6. Monitorare il validation rate via Supabase

Tutte le validation di successo creano/aggiornano una row in
`public.b2c_subscriptions` con `last_notification_at = now()`. Query utili:

```sql
-- validazioni ultime 24h
select state, count(*)
from b2c_subscriptions
where last_notification_at > now() - interval '24 hours'
  and billing_source = 'google_play'
group by state;

-- subs in scadenza nei prossimi 7 giorni
select user_id, external_product_id, active_until, auto_renewing
from b2c_subscriptions
where billing_source = 'google_play'
  and state = 'active'
  and active_until between now() and now() + interval '7 days'
  and active_until < '9000-01-01'
order by active_until;

-- lifetime active
select count(*) from b2c_subscriptions
where billing_source = 'google_play'
  and active_until > '9000-01-01'
  and state = 'active';
```

I log della route (`[Billing] ...`) sono visibili in Vercel Runtime Logs:
filtra per "Billing" per vedere warning/error.

## Sicurezza — checklist

- [ ] Il file JSON del service account NON è committato (è in `.gitignore`
      anche se non lo fosse — niente file `.json` con `private_key`).
- [ ] La env var `GOOGLE_PLAY_SERVICE_ACCOUNT_JSON` è settata SOLO su
      Production + Preview, mai esposta client-side.
- [ ] Il service account ha SOLO il permesso minimo (no admin, no app release).
- [ ] La RLS su `b2c_subscriptions` consente SELECT solo a `user_id = auth.uid()`
      (verificato 2026-05-21, vedi commento nelle migration `init_b2c_subs`).
- [ ] Il client Flutter usa `verificationData.serverVerificationData` come
      purchase_token (NON `localVerificationData`, che è il payload firmato
      lato dispositivo e non riconosciuto da Google API).

## Troubleshooting

**502 "The current user has insufficient permissions"**: il service account è
stato invitato ma la propagazione non è completa, oppure non ha il permesso
"View financial data". Aspetta 1h o ricontrolla i permessi.

**502 "The package name (...) is invalid"**: stai usando un package che il
service account non vede. Verifica che FitMesh Sync sia tra le app autorizzate
in Play Console → Users and permissions.

**JWT exchange error** in log: il `private_key` del JSON è malformato. Verifica
che gli `\n` siano correttamente esposti (in Vercel l'editor preserva i newline
letterali; se incolli da CLI con `vercel env add`, usa `--sensitive` e passa il
file con `< file.json`).
