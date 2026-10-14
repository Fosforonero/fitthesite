# Collaborare al sito FitMesh

Punto d'ingresso tecnico per chi lavora sul repository. Questo documento non
autorizza rilasci e non certifica funzionalita, sicurezza o conformita legale.

- Sito: https://github.com/Fosforonero/fitthesite (repository pubblico).
- App: https://github.com/Fosforonero/fitmeshsync (repository privato separato).
- Stato fissato: [STATE-2026-10-14.md](STATE-2026-10-14.md).
- Registro dell'allineamento Git (SHA, PR, prove, residui): [HANDOFF-GIT-01-2026-10-14.md](HANDOFF-GIT-01-2026-10-14.md).
- Inventario leggibile da strumenti: [branches.json](branches.json).

## Da dove iniziare

Per sviluppo sito ordinario partire da `origin/main`, dopo averne riconfermato
lo SHA. Al checkpoint del 14 ottobre la testa e
`c011056b0c2091b9282b530799fdf96972476695`.
Questo e lo stato integrato; i candidati dashboard, SEO e social sono lavori
separati, non gia presenti in `main`.

Leggere `AGENTS.md` e le istruzioni pertinenti prima di modificare codice.
Creare un ramo e un worktree propri. Non usare worktree occupati da altri,
non inglobare modifiche non committate e non riscrivere rami condivisi.
Per una corsia esistente chiedere all'integratore lo SHA e l'assegnazione dei
file: non ricostruire l'integrazione dal nome di una branch.

## Ambiente locale

Il sito usa Next.js, React, TypeScript e il lockfile del repository.
Seguire `README.md` per l'avvio; verificare prima la versione Node richiesta
dalla CI. I risultati prodotti con una versione diversa non provano la CI.
Provisionare configurazioni di sviluppo tramite il responsabile, fuori da
Git, senza copiare credenziali di produzione o sessioni di altri utenti.
Un file `.env.example` non dimostra che un ambiente sia isolato.

Comandi presenti in `package.json` al checkpoint:

```sh
npm test
npm run suite:perimetro-check
npm run governance:check
npx tsc --noEmit
npm run build
```

Questi comandi non garantiscono un ambiente senza rete: leggere prima script,
dipendenze e configurazione. La suite release PG17 va eseguita soltanto sul
banco effimero previsto, mai cambiando il target verso un database condiviso.
Coordinare build e banco PG17 con le altre corsie; non avviare o fermare
Colima senza verificare l'effetto sui container condivisi.

## Confini operativi

- Un push di branch non equivale a merge o autorizzazione alla produzione.
- Il merge su `main` avvia il deployment del sito: serve un GO separato sullo
  SHA candidato e controlli verdi pertinenti.
- `vercel.json` al checkpoint abilita deployment Git per `main` e disabilita
  gli altri rami. Non prova le impostazioni del pannello o altre integrazioni.
- La migration dashboard non va applicata implicitamente. Verificare prima
  l'integrazione GitHub/Supabase; nessun permesso deriva da una CI verde.
- Non pubblicare chiavi, dati salute, sessioni, dump, screenshot di account
  reali o referti privati. Revisionare anche i commit antenati che un push
  renderebbe raggiungibili, non soltanto il diff finale.

## Come consegnare un lavoro

Riportare base e HEAD completi, branch, diff, stato pulito o WIP, comandi ed
exit code. Separare prove proprie, prove acquisite, limiti e decisioni aperte.
I contatori della suite si misurano sul codice combinato, non si sommano.
Un test saltato o un rosso preesistente si dichiara, non si elimina per
presentare il lotto come verde.

Aggiornare il registro con un commit documentale quando cambia lo stato.
Non sovrascrivere un vecchio referto per attribuirgli prove su un nuovo SHA.
