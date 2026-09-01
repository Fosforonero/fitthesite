# 191 — Continuità della proprietà negli upgrade di abbonamento Play

> **Nota di rollback (2026-08-10).** Se questo fail-closed dovesse bloccare
> acquisti legittimi, la risposta NON è un feature flag che riabilita le
> scritture dirette: vedi `supabase/rollback/README-rollback-applicativo.md`.
> Un flag che riporta all'upsert diretto su `b2c_subscriptions` (PK `user_id`,
> una riga per utente) fa sparire le transazioni precedenti in modo permanente.


Deciso il 2026-08-10, durante il P0 del registro di proprietà. **Non blocca la
190**, ma va chiuso prima di offrire più di un piano su Android.

## Il fatto

Quando un abbonamento Google Play cambia piano (upgrade, downgrade,
re-sottoscrizione dopo una cancellazione), Google **non** riusa il purchase
token: ne emette uno nuovo e mette il precedente in `linkedPurchaseToken`.

La chiave di proprietà per `google_play` è lo SHA-256 del purchase token. Token
nuovo significa quindi chiave nuova, e per il registro quello è un acquisto mai
visto prima: verrebbe assegnato a chiunque lo presenti. Se nel frattempo la
persona ha cambiato account FitMesh, la stessa catena di abbonamento
risulterebbe di proprietà di due account diversi, **senza che nessun conflitto
venga mai rilevato** — che è esattamente ciò contro cui il registro esiste.

## Cosa fa la 190

`lib/billing/ownership-key.ts` **rifiuta** quel percorso invece di creare in
silenzio una proprietà indipendente:
`google_subscription_upgrade_chain_unsupported`.

L'esito è classificato come **difetto nostro, non terminale**
(`clientContractError` in `purchase_disposition.dart`), quindi:

- la transazione **non** viene chiusa e su Android **non** viene fatto
  acknowledge, così Play può ancora rimborsare;
- l'acquisto resta **recuperabile**: soppressione con scadenza a 24 ore, che si
  riapre da sola, e subito se cambia la versione del contratto;
- l'utente legge il messaggio "difetto nostro", mai un silenzio.

## Perché è accettabile nella 190, e a quale condizione

Audit del client, 2026-08-10, sui tre branch che spediscono
(`hotfix/3.9.9+190`, `develop/post-189`, `release/3.9.7+188`): **zero**
occorrenze di `GooglePlayPurchaseParam`, `changeSubscriptionParam`,
`ProrationMode`, `replacementMode`, `oldPurchaseDetails`. Una sola chiamata
d'acquisto, con un `PurchaseParam` base. Il client **non può** avviare un
replacement.

**Residuo dichiarato:** se in Play Console la subscription `fitmesh_pro_sub`
avesse più base plan o offerte, una persona potrebbe cambiare piano dalla UI del
Play Store, fuori dall'app, e generare comunque un `linkedPurchaseToken`. Non è
verificabile dal codice: va controllato in Play Console. Finché il piano è uno
solo, il caso non si presenta.

## Cosa deve fare la 191

1. Risalire la catena: dato un `linkedPurchaseToken`, trovare la riga del
   registro di quel token e **riusarne il proprietario**, invece di creare una
   proprietà nuova.
2. Gestire catene lunghe (upgrade ripetuti) e il caso in cui l'anello
   precedente non sia nel registro, perché anteriore al backfill.
3. Decidere se la chiave diventa quella della **prima** transazione della catena
   (stabile per sempre, ma richiede una lettura in più) oppure se si aggiunge
   una tabella di collegamento. La prima opzione mantiene una sola riga di
   proprietà per catena; la seconda conserva la storia.
4. Test: upgrade con stesso account, upgrade dopo cambio account (deve dare
   conflitto, non una seconda proprietà), catena a tre anelli, anello mancante.
5. Solo dopo: togliere il fail-closed e configurare più piani in Play Console.

## Ordine

Il fail-closed va rimosso **prima** di pubblicare un secondo piano, non dopo.
Al contrario, un cliente che fa upgrade si vedrebbe rifiutare un acquisto
valido — che è il difetto che tutto questo sprint esiste per non ripetere.
