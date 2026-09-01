# Copie congelate di `validate-purchase/route.ts`

Due autorita' distinte, e non e' una sottigliezza: fino al 26/08/2026 ce n'era
una sola, si confrontava con `main`, e `main` locale era rimasto indietro di
194 commit. Il confronto passava perche' la copia e il testimone erano vecchi
allo stesso modo. Contro `origin/main` il file era **+34 righe**.

| file | cosa e' | decide il rilascio |
|---|---|---|
| `route-189-at-release.vendored.ts` | il route quando usci' la 189. **Immutabile.** | no, e' diagnostica |
| `route-live-pre190.vendored.ts` | il route che gira DAVVERO adesso | **si'** |

## Le regole

1. **L'autorita' e' il commit completo.** Mai un branch, mai `HEAD`, mai un tag
   mobile. Un ref che si muove non puo' fare da testimone.
2. **I valori stanno in `manifesto.json`, una volta sola.** Repository,
   percorso, commit, impronta SHA-256, deployment Vercel, scopo. Un numero
   scritto due volte prima o poi diverge, quindi qui non si ripete: si legge.
3. **«Distribuito» si verifica, non si deduce.** Il commit live si ricava
   risolvendo l'alias di produzione e leggendo il deployment che serve, non
   assumendo che `origin/main` sia la produzione. Capita che coincidano; e' un
   fatto misurato, non una regola.
4. **La copia storica non si aggiorna mai.** Se il route cambia, cambia l'altra.
   Una copia storica che insegue la produzione non e' piu' la copia di niente.
5. **Congelato e' solo il file del route.** I moduli che importa sono quelli di
   oggi; nelle suite che le usano i tre che contano sono mockati.

## Come si aggiorna la copia viva

1. Risolvi l'alias di produzione, prendi il deployment e il suo commit.
2. Scrivi commit, impronta e deployment in `manifesto.json`.
3. `bash tools/rigenera-fixture-billing.sh` — rigenera dai commit dichiarati e
   **si rifiuta di scrivere** se l'impronta prodotta non e' quella registrata.
4. La suite di compatibilita' e' quella che decide: se diventa rossa, la
   produzione e' cambiata in un modo che riguarda i clienti fermi alla 189.

## Chi le usa

- `app/api/v1/billing/validate-purchase/route.storica.db.test.ts` —
  DIAGNOSTICA, solo la copia at-release.
- `app/api/v1/billing/validate-purchase/route.db.test.ts` — **blocca il
  rilascio**: client letterale 189 contro il live pre-190 e contro la
  candidata 190, piu' il client 190 contro la candidata.
- `manifesto.test.ts` — impronta, provenienza dal commit, e il guardrail che
  vieta a QUALUNQUE test del repository di prendere un branch per testimone.
