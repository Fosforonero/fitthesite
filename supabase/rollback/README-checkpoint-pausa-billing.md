# Billing in pausa — checkpoint dell'11/08/2026

Il P0 sonno passa davanti perché la corruzione è **attiva** nel merge server live,
mentre il registro acquisti non è ancora applicato da nessuna parte. Questo file
esiste perché il lavoro B′ non venga né integrato né perso mentre è fermo.

## Dove vive il lavoro

| | |
|---|---|
| Backend | repo `fitthesite`, branch `p0/apple-jws-verifier`, worktree `.claude/worktrees/p0-apple-jws` |
| HEAD backend | `feec947980c13b995818e6adc06e5b8d76f35f4e` |
| Client | repo app, branch `p0/apple-client-recovery`, worktree `.claude/worktrees/p0-apple-client` |
| HEAD client | `648ccea3807ce5bb439add3cbde5e8372bfb22c3` |
| Stato di entrambi | working tree **pulito**, niente in staging, niente stash |
| Rispetto a `origin/main` (backend) | 24 avanti, 4 indietro — **non** integrato, ed è voluto |

## La catena dei commit, in ordine

Backend:

```
be66d4d  B' — la proiezione smette di essere l'ultima scrittura
a379e71  la route non scrive piu' b2c_subscriptions, passa dal registro
f8ef79d  guardia sulla proiezione, e la finestra di rollout chiusa
d77e391  il backend dichiara la disposizione, versionata
f26343d  le dieci finestre di crash, e i due stati proibiti
feec947  le quattro righe Google verificate in sola lettura prima del backfill
```

Client: `648ccea3` (lettura diffidente della disposizione dichiarata), sopra i sei
commit di recupero acquisti già presenti nella linea 190.

## Come si riprende

```
cd fitthesite/.claude/worktrees/p0-apple-jws && git status      # deve essere pulito
supabase db reset                                               # ricostruisce da zero
supabase/tests/billing_claims_p0/run-suite.sh                   # exit 0 atteso
```

Il `db reset` **è** la prova di migrazione su database vuoto: le migration del
registro sono le ultime della cartella e girano in ordine di nome.

## Nessun apply, e perché

Niente è stato applicato in produzione: le quattro migration del registro
(`20260808211929`, `20260810090000`, `20260810120000`, `20260810140000`) esistono
solo come file. La sequenza di rollout è in `README-rollout-registro.md`, e il suo
passo 1 non è stato eseguito.

## Il cancello di ripresa: nove punti, nessuno dei quali ha ancora un RED→GREEN

B′ è l'architettura giusta, ma non è pre-apply. Prima di applicare qualunque cosa,
ognuno di questi deve avere un test che fallisce prima e passa dopo, più una
review indipendente:

1. il backfill crea i claim ma **non** `billing_purchase_states` — le righe
   coperte restano senza stato, e il ricalcolo non le vede;
2. `strict` controlla utente + sorgente, non la `ownership_key` esatta: una riga
   con la chiave sbagliata passa lo stesso;
3. fra il conteggio delle righe scoperte e il passaggio `compatibility → strict`
   c'è una corsa: una scrittura che arriva in mezzo entra scoperta;
4. in `compatibility` una scrittura commerciale può ancora sovrascrivere un
   Founder — la difesa `billing_source <> 'founder_grant'` vive nella RPC, non
   nel percorso di compatibilità;
5. il trigger si aggira cambiando `billing_source`, e non copre `DELETE` né
   `TRUNCATE`;
6. la freschezza in `compatibility` e le date Apple confrontano orologi non
   equivalenti (`signedDate` vs `request_date_ms` vs il nostro `now()`);
7. una revoca può ricevere risposta terminale anche quando la persistenza
   fallisce: il rifiuto viene restituito prima di sapere se è stato registrato;
8. backend e client non concordano su **tutti** i codici, solo su quelli
   esercitati;
9. delle dieci finestre di crash ne sono davvero esercitate cinque; le altre
   cinque sono argomentate.

I punti 1, 3, 4 e 7 sono quelli che possono produrre un danno commerciale reale:
gli altri sono difese incomplete, non buchi aperti.
