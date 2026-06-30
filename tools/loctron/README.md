# loctron — motore di traduzione modulare (Weglot-like, nostro)

Pipeline di traduzione riusabile su più progetti. Niente canone, niente lock-in.
Pattern: **estrai → traduci (waterfall di motori) → memoria/glossario → revisione → inject**.

Nome in codice: `loctron` (rinominabile).

## Idea
- **Memoria di traduzione (TM)**: una stringa tradotta una volta non si ritraduce mai
  più; le correzioni umane sono "appiccicose" (`reviewed`/`locked`).
- **Glossario + DNT (do-not-translate)**: termini con resa fissa per lingua, e token
  protetti (brand, `${...}`, URL, email) mascherati prima della traduzione e
  ripristinati dopo.
- **Waterfall di motori**: per ogni segmento → TM hit → **DeepL** (finché c'è budget
  gratuito mensile) → **Ollama** (locale, qwen3) → coda di revisione.
- **Stato per segmento**: `machine` → `reviewed` (Claude/umano) → `locked`.

## Uso (via Docker, niente runtime locale)
Dalla root di `fitthesite`:
```
docker run --rm --network host -e DEEPL_API_KEY -v "$PWD":/app -w /app node:22 \
  node --experimental-strip-types tools/loctron/cli.ts <comando>
```
Comandi:
- `engines`   quali motori sono disponibili (DeepL key? Ollama up?)
- `usage`     stato crediti DeepL (count/limit/residuo)
- `demo`      traduce 3 stringhe campione via waterfall (prova end-to-end)
- `dict <lang>`  traduce `lib/dictionaries/en.json` → `tools/loctron/.preview/<lang>.json`
- `tm-stats`  statistiche della memoria di traduzione

`--network host` serve per raggiungere Ollama su `localhost:11434`.
`DEEPL_API_KEY`: se assente, il waterfall usa solo Ollama.

## Portare su un altro progetto
1. Copia `tools/loctron/`.
2. Adatta `config.ts` (lingue, percorsi, ordine motori).
3. Scrivi/riusa un **adapter** sorgente (`adapters/`): l'interfaccia è
   `extract(): Segment[]` + un `build/inject`. Già pronto: `jsonDict` (dizionari JSON).
   Per altri formati (Markdown, CMS, oggetti TS `Localized`) si aggiunge un adapter.
4. Il core (TM, glossario, motori, pipeline) resta identico.

## Stato (F0)
Scaffold + waterfall funzionante (DeepL adapter pronto, Ollama testato). F1: estrazione
contenuti del sito (articoli + provider/modelli) + inject + rimozione noindex per pagina.
