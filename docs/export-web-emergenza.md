# Export web: opzione di contenimento d'emergenza (PREPARATA, NON ATTIVA)

**Stato:** preparata in locale, mai attivata. Nessun GO all'attivazione. Decide solo Matteo.

## A cosa serve

Se l'export web («Esporta i miei dati», `/[locale]/app/export`) desse problemi dopo il rilascio, rendere
**temporaneamente indisponibile solo quella pagina**, senza tornare all'export non filtrato. Il rollback del codice
(revert o promozione del deployment precedente) **ripristina l'export insicuro** (`select('*')` senza filtro sul
titolare); questa opzione no: con l'interruttore acceso il componente non viene nemmeno montato, quindi non parte
nessuna lettura dalla pagina.

## PRECONDIZIONE: il codice dell'interruttore deve essere GIA' nel deployment di produzione

La variabile non fa nulla se il commit in produzione non contiene `lib/privacy/export-switch.ts`. Quindi:
- l'interruttore **utile in un'emergenza e' quello rilasciato insieme all'export corretto**; se si rilascia l'export
  senza di esso, la leva 1 e' inerte e resta solo il rollback (che ripristina l'export non filtrato) o un rilascio
  nuovo (leva 2);
- un **rollback o la promozione del deployment precedente toglie anche l'interruttore**: dopo un rollback la
  variabile non ha piu' effetto.

## Due leve

| Leva | Come | Tempo | Cosa serve |
|---|---|---|---|
| 1. Variabile d'ambiente | `FITMESH_EXPORT_UNAVAILABLE=1` nelle variabili di **Production** del progetto Vercel, poi **redeploy dello stesso commit** | ~3 minuti (un build; DEDOTTO dalla piattaforma, non misurato su questo progetto) | accesso al progetto Vercel; nessuna PR, nessun merge |
| 2. Costante nel codice | `FORZATO_DA_CODICE = true` in `lib/privacy/export-switch.ts` **e** nello stesso commit la riga di `lib/privacy/export-switch.test.ts` che oggi la fissa a `false` (test «la leva da codice e' SPENTA nel commit») **e** i test di pagina «disponibile» (4, in `page.test.tsx`: variabile assente/vuota/`0`/`false`), che con la costante accesa sono rossi per costruzione | PR + CI + merge + deploy (~10-15 minuti) | un commit che tocca 3 file; non e' «una riga» |

**Valori della variabile che spengono:** `1`, `true`, `yes`, `on` (maiuscole e spazi ignorati). **Non spengono:**
assente, vuoto, `0`, `false`, `no`, `off`, e anche varianti plausibili come `y`, `si`, `sì`, `enabled`, il valore fra
virgolette (`"1"`) o `1.0`. Per questo, dopo averla impostata, **si verifica sempre** che la pagina mostri il messaggio.
**Su Vercel una variabile cambiata vale solo per un nuovo deployment**: cambiare il valore senza rifare il deploy non
spegne nulla. Va impostata per l'ambiente **Production** (il deploy di `main` usa quello; le anteprime non esistono
per questo repository, ma una variabile impostata solo per Preview o Development non spegne nulla in produzione).

## Come si verifica dopo l'attivazione

La pagina e' dietro login: con una sessione di prova, `/<lingua>/app/export` mostra «Esportazione temporaneamente non
disponibile» e «Riprova piu' tardi» (nella lingua della pagina, 15 lingue) e **nessun pulsante**. Il testo non dice la
causa e non da' rassicurazioni, perche' in un'emergenza la causa e' sconosciuta. Senza sessione il redirect al login
e' identico a prima (non distingue). Un redeploy dello stesso commit ha **lo stesso SHA** del precedente: per
distinguere il deployment nuovo guardare l'ID e l'orario del deployment (`gh api repos/Fosforonero/fitthesite/deployments`),
non lo SHA.

## Come si disattiva

Leva 1: togliere la variabile (o impostare `0`) e rifare il deploy. Leva 2: ripristinare la costante a `false`, il test
e i quattro test di pagina con un commit.

## Limiti dichiarati

- Spegne **una superficie**: non chiude le letture dirette via REST che la RLS gia' permette (admin, membri di
  gruppo, ecc.), che restano un lotto separato.
- **Una scheda gia' aperta prima dell'attivazione conserva il codice del componente** e puo' ancora scaricare: il
  comportamento e' quello dell'export corretto (filtrato), non quello non filtrato.
- Non e' un interruttore istantaneo: servono un deployment (leva 1) o un rilascio (leva 2).
- Non esiste un'attivazione automatica: nessun segnale la attiva da solo.
- Il testo della pagina sospesa e' tradotto, ma non da un madrelingua. Non indica un canale alternativo: l'informativa
  privacy indica la pagina export per esercitare la portabilita'; se serve un contatto alternativo e' una decisione da
  prendere insieme a chi cura l'informativa.
- Il tempo della leva 1 e' una stima: dipende dalla piattaforma.
