# Far comprare App Review — la procedura, e perché è fatta così

## Il problema in una riga

TestFlight e App Review comprano in **Sandbox** contro il backend di
**produzione**. Un backend che rifiuta ogni transazione Sandbox fa completare
l'acquisto al revisore di Apple e poi gli mostra un paywall. Con quel
comportamento iOS non è rilasciabile, indipendentemente da tutto il resto.

## Perché non si accende `APPLE_ALLOW_SANDBOX` in produzione

Perché una transazione Sandbox è **gratuita** per chiunque abbia un Apple ID di
test. Aprire l'ambiente significa regalare il Pro a vita a chiunque sappia
chiederlo, e non c'è nessun modo di distinguere a posteriori chi ha pagato da
chi no.

C'è anche una rete già in piedi: `sandboxTransactionsAllowed()` si spegne da
sola quando `NEXT_PUBLIC_SUPABASE_URL` punta al progetto di produzione, proprio
per l'errore più facile da fare — accendere la variabile su un ambiente di
prova che però scrive sul database vero.

## Come funziona invece

L'apertura è **della persona**, non dell'ambiente, e la decide il server.

`private.billing_sandbox_reviewers` elenca gli account autorizzati. Il client
non la legge e non la scrive: sta in `private`, PostgREST non la espone, e
l'unica porta è `public.is_sandbox_reviewer(uuid)`, concessa al solo
`service_role`.

Quando arriva una transazione Sandbox, il backend la respinge come sempre; poi,
**solo a quel punto**, chiede se quell'account è autorizzato. Se lo è, rifà la
verifica accettando l'ambiente Sandbox. Un utente di produzione non paga nessuna
interrogazione in più, e il percorso normale resta quello di prima.

Le quattro condizioni devono valere **tutte**:

1. l'account è nell'elenco e non è scaduto;
2. il JWS verifica per intero — firma, bundle id, prodotto, tipo. Questo apre
   una porta, non abbassa un controllo;
3. il JWS porta `appAccountToken` e coincide con l'utente autenticato. Qui è
   **obbligatorio**, mentre in produzione può mancare (le transazioni comprate
   da build che non lo impostavano non ce l'hanno). Senza, un account
   autorizzato potrebbe presentare la transazione Sandbox di chiunque altro;
4. la proprietà entra nel registro con la chiave in uno spazio suo —
   `sandbox:<originalTransactionId>` — e `environment = 'sandbox'`. Sandbox e
   produzione numerano gli identificativi in modo indipendente e **possono
   coincidere**: senza separazione una transazione di prova potrebbe
   rivendicare la proprietà di un acquisto vero.

In dubbio si risponde **no**. Un guasto della tabella o della funzione costa un
revisore che non riesce a comprare — spiacevole e recuperabile — invece di un
Pro a vita regalato.

## La procedura, prima di sottomettere

Serve l'`user_id` dell'account che il revisore userà. È l'account demo indicato
ad Apple nelle note di revisione (`appreview.demo@fitmesh.fit` alla build 190).

```sql
-- 1. trovare l'id
select id, email from auth.users where email = 'appreview.demo@fitmesh.fit';

-- 2. autorizzarlo, con una nota che si capisca fra sei mesi e una scadenza
--    che copra la revisione con margine
insert into private.billing_sandbox_reviewers (user_id, note, expires_at)
values (
  '<id del passo 1>',
  'revisione Apple build 190',
  now() + interval '30 days'
)
on conflict (user_id) do update
  set note = excluded.note,
      created_at = now(),
      expires_at = excluded.expires_at;

-- 3. controllare che il backend lo veda
select public.is_sandbox_reviewer('<id del passo 1>');  -- deve dare true
```

Il massimo consentito è **90 giorni**, e il vincolo lo impone il database. Non è
una scomodità: un permesso senza scadenza sopravvive alla revisione che lo ha
chiesto e nessuno si ricorda di toglierlo. È così che un accesso temporaneo
diventa una porta aperta.

## Dopo l'approvazione

```sql
delete from private.billing_sandbox_reviewers where user_id = '<id>';
```

Non è obbligatorio — scade da solo — ma toglierlo subito è la cosa giusta:
l'elenco deve contenere solo permessi che servono adesso.

## Cosa NON fare

- **Non** aggiungere l'account di un cliente vero. Riceverebbe il Pro da una
  transazione gratuita, e la cosa resterebbe scritta nel registro come acquisto
  Sandbox: un giorno qualcuno dovrà spiegarla.
- **Non** allungare la scadenza "così non ci pensiamo più". È esattamente il
  modo in cui questa difesa smette di difendere.
- **Non** accendere `APPLE_ALLOW_SANDBOX` in produzione per fare prima. Vedi
  sopra: apre a tutti.

## Come si verifica che regga

`supabase/tests/billing_claims_p0/88-sandbox-revisori.sql` copre gli otto modi
in cui questa difesa potrebbe cedere: elenco vuoto, permesso che tracima su un
altro account, permesso scaduto, permesso eterno, nota vuota, permesso
sopravvissuto alla cancellazione dell'account, e raggiungibilità dal client
(funzione e tabella).

Il percorso completo — rifiuto, domanda, seconda verifica, chiave separata — sta
in `app/api/v1/billing/validate-purchase/route.test.ts`, gruppo "isolamento
produzione / sandbox al livello del route", incluso il caso in cui un guasto
della tabella **non** apre la Sandbox.

## Vale anche su StoreKit 1

FitMesh supporta ancora iOS 14, dove il plugin ricade su StoreKit 1 e manda una
ricevuta invece di un JWS. Il percorso è lo stesso e con le stesse condizioni:
Apple risponde `21007` ("questa ricevuta è Sandbox"), il backend chiede se
quell'account è autorizzato e solo allora ripete la verifica accettando
l'ambiente Sandbox. La chiave finisce nello stesso spazio separato.

Dimenticarlo avrebbe lasciato fuori proprio un revisore su un dispositivo
vecchio, cioè il caso meno prevedibile e più difficile da diagnosticare a
distanza.

## Quello che questi test non provano

Che il giro completo funzioni su un dispositivo reale con un Apple ID Sandbox
vero. Nessun test automatico può firmare un JWS Sandbox autentico. Prima della
sottomissione va fatto **a mano**, da TestFlight, con l'account demo
autorizzato: comprare, e vedere il Pro comparire.
