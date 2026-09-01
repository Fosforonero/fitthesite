# Riparazione righe `colmi_ble` — NON AUTORIZZATA

**Preparata, mai eseguita.** Non fa parte della finestra di produzione della 190.
Va revisionata prima di essere autorizzata.

## Ordine

```bash
umask 077
export DB_URL='postgresql://...'            # mai su disco

psql "$DB_URL" -X -f 00-identifica.sql      # deve dare ESATTAMENTE 2 id
psql "$DB_URL" -X -f 01-impronta.sql        # impronta di ENTRAMBE le popolazioni
bash 02-backup.sh                           # psql | age, nessun file in chiaro

# prova su copia, PRIMA della produzione (§ sotto)
psql "$DB_URL" -X -f 03-riparazione.sql     # finisce in ROLLBACK
```

## Prova su copia, obbligatoria prima della produzione

1. PG17 usa-e-getta;
2. caricarci **tutte e sei** le righe dal backup cifrato — le due da riparare
   **e** le quattro di luglio: senza queste, «sono rimaste identiche» non e'
   dimostrabile;
3. `SET riparazione.impronta_luglio = '<md5 da 01>';`
4. eseguire `03-riparazione.sql` con `commit` al posto di `rollback`;
5. rieseguire `01-impronta.sql`: l'impronta della popolazione
   `luglio-INTOCCABILI` deve essere **identica**;
6. ripristinare dal backup e verificare che anche l'impronta delle due riparate
   torni identica a quella di partenza.

## Tre cose da non fraintendere

**Le quattro righe di luglio non si riparano.** Scarto 2,24–2,40 ore contro le
11,50–13,68 di INC-R10, `local_day_key` nullo, anello R09: e' un difetto
**diverso** e non diagnosticato. Entrano nel backup e nella prova solo per
dimostrare che restano ferme.

**`rm -P` non e' una garanzia di cancellazione.** Su APFS e su SSD con
wear-leveling la sovrascrittura logica non raggiunge i blocchi fisici. Per
questo qui non si crea **niente** in chiaro da dover cancellare: `psql` scrive
direttamente dentro `age`.

**Il file finisce in `rollback`, ed e' il valore predefinito**, non un
promemoria.
