# INFRA-2 — dove si riprende

Sospeso il 26/08/2026 a meta' del terzo passo. Niente e' rotto, niente e' a
meta' in modo ambiguo: il gate e' rosso e dice perche'.

## Stato

| pezzo | stato |
|---|---|
| manifesto 3B derivato (`17-manifesto-rollback.sh`) | fatto, **rosso** finche' i rollback non sono esercitati |
| manifesto insieme pending 16 (`19-insieme-pending.sh`) | fatto, verde, autocontrollo verde |
| scansione SECURITY DEFINER (`20-secdef-senza-controllo.sh`) | fatto, verde, nessun blocker |
| impronta strutturale completa | fatta, 981 righe, schema `auth` compreso |
| rollback F1, F3, F5, F6 | scritti |
| rollback F4 | scritto, con ripristino per sostituzione inversa |
| rollback F2 | **scritto ma ROTTO**, vedi sotto |
| `18-rollback-due-modalita.sh` | scritto e funzionante, esce 1 correttamente |

## L'unica cosa da correggere per proseguire

`20260825130100_billing_autorita_canonica_rollback.sql` **indovina le firme**
delle funzioni. `drop function if exists` con una firma sbagliata non e' un
errore: e' un NOTICE e un no-op. Quindi tre funzioni sopravvivono e la
postcondizione del rollback fallisce, giustamente.

Le firme vere, lette dal catalogo:

```
public.claim_store_purchase(p_billing_source text, p_ownership_key text,
  p_owner_user_id uuid, p_external_product_id text, p_purchase_kind text,
  p_environment text, p_state text, p_active_until timestamptz,
  p_auto_renewing boolean, p_store_event_at timestamptz,
  p_store_event_source text, p_external_transaction_id text,
  p_app_account_token uuid)
public.is_sandbox_reviewer(p_user_id uuid)
public.record_store_purchase_revocation(p_billing_source text,
  p_ownership_key text, p_external_product_id text, p_purchase_kind text,
  p_store_event_at timestamptz, p_store_event_source text,
  p_revocation_at timestamptz)
```

**Non ricopiarle a mano**: e' lo stesso errore in una forma nuova. Il rollback
deve generare i `drop` dal catalogo dentro un blocco DO, prendendo la firma da
`pg_get_function_identity_arguments`, e poi verificare che non sia sopravvissuto
niente.

## Un difetto minore nello stesso file

`18-rollback-due-modalita.sh` stampa «5. secondo giro completato:
apply/rollback deterministico» **anche quando il ciclo si e' interrotto prima**.
Il verdetto finale e' corretto e l'uscita e' 1, ma quella riga afferma una cosa
falsa. Va spostata dentro il ramo che ha davvero completato due giri.

## Il delta, derivato e non indovinato

Applicando le sei una per volta su un PG17 ricostruito e guardando l'impronta:

| | crea |
|---|---|
| F1 | 5 tabelle |
| F2 | **18 funzioni**, 5 trigger |
| F3 | 1 funzione, 2 trigger |
| F4 | 1 trigger su `auth.users`, **modifica** `gdpr_process_deletions` |
| F5 | 2 funzioni, 1 tabella |
| F6 | **modifica** `entitlement_core` |

Totale: +133 righe d'impronta, 2 oggetti modificati. Contando per nome avevo
detto prima 17 e poi 18 funzioni: due risposte diverse alla stessa domanda.

Trovato per strada: l'impronta non guardava lo schema `auth`, quindi non vedeva
il trigger di F4. Corretto.

## Quello che resta dopo la correzione di F2

1. far passare `18-rollback-due-modalita.sh` in **entrambe** le modalita';
2. F6 ha ancora `begin;`/`rollback;` nudi: in modalita' transazione esterna il
   suo corpo viene scartato. La forma corretta e' gia' provata (sotto-blocco
   PL/pgSQL con `EXCEPTION`, che e' un savepoint implicito), vedi
   `F6-ROLLBACK-PROVATO.md` nello scratchpad;
3. correggere F6 ne cambia lo `sha256`, quindi il manifesto pending va
   ricongelato: il gate `19` diventera' rosso e dovra' tornare verde con il
   valore nuovo. E' il comportamento voluto;
4. solo allora `17-manifesto-rollback.sh` puo' diventare verde.

## Vincoli che restano in piedi

Nessun deploy, nessun artefatto, nessun bump. Gli SHA della review restano
`4a94eb62` (backend, oggetto della review) e `13400671` (app).
