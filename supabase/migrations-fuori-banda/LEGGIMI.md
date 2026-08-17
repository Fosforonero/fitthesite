# Migration fuori banda — preservate, non applicabili

Questi otto file sono stati salvati dal checkout principale il 18/08/2026.
Erano rimasti fuori da git per 34 giorni perche' `.git/index.lock` era fermo
dal 14/07: `git add` falliva, quindi nessuno poteva committarli.

Sono qui, e non in `supabase/migrations/`, per un motivo preciso: **nessuna
delle otto versioni e' nel registro delle migration applicate.** Lasciandole
in `supabase/migrations/` il prossimo che fa girare le migration da questo
ramo le applicherebbe tutte, credendo di applicare roba nuova.

Il nome coincide, la versione no. E' esattamente la trappola: cercare per
nome dice "gia' fatta", cercare per versione dice "mai fatta".

## Verificato il 18/08/2026 su `supabase_migrations.schema_migrations`

Registro interrogato con controllo positivo nei due sensi (una versione nota
risulta presente, una inventata risulta assente; 88 migration registrate).

### Gruppo A — sette gemelle: l'effetto e' gia' in produzione

Tutte e sette rimpiazzano la stessa funzione, `public.get_dashboard_snapshot`.
Ognuna ha in produzione una gemella con **lo stesso nome e versione diversa**:

| file salvato (NON registrato) | gemella applicata (registrata) |
|---|---|
| 20260718120000 dashboard_snapshot_rpc | 20260718073343 |
| 20260805120000 dashboard_snapshot_revenue | 20260805081803 |
| 20260807130000 dashboard_snapshot_fix_apple_billing_source | 20260807093327 |
| 20260808150000 dashboard_snapshot_leading_indicators | 20260808144749 |
| 20260815100000 dashboard_snapshot_real_sync | 20260815074409 |
| 20260816110000 dashboard_snapshot_founder_trial_split | 20260816092657 |
| 20260816120000 dashboard_snapshot_platform_fallback | 20260816093034 |

Il piu' recente dei sette, `20260816120000_dashboard_snapshot_platform_fallback`,
e' **identico byte per byte** al corpo che gira in produzione: 9905 caratteri,
md5 `cd58b5e2e19cc3981a81e1246d2c39b0` da entrambe le parti.

Quindi rigirarle non cambierebbe lo stato finale, perche' l'ultima vince ed e'
gia' quella giusta. Non e' pericoloso, e' rumoroso e bugiardo: il registro si
riempirebbe di versioni doppie per lo stesso lavoro.

Attenzione a cosa e' stato verificato e cosa no: e' provato che **lo stato
finale** coincide. Le sei intermedie sono versioni piu' vecchie della stessa
funzione e non sono state confrontate una per una, perche' sono superate.

### Gruppo B — una che non e' mai stata applicata

`20260714150000_health_consent_schema` non ha gemelle **sotto nessun nome e
nessuna versione**: controllato tutto luglio nel registro, non c'e'.

E l'assenza e' confermata dall'effetto, non solo dal registro: **nessuno dei
suoi oggetti esiste in produzione.** Zero delle quattro tabelle
(`consent_documents`, `health_consent_events`, `health_consent_state`,
`consent_enforcement_config`), zero delle sette funzioni. Verificato con
controllo positivo: la stessa query trova regolarmente `fitness_metrics`,
`user_roles` e `concedi_ponte_ios`.

Sono 510 righe che creano quattro tabelle con RLS, due trigger che bloccano
UPDATE e DELETE, sei funzioni fra cui `assert_health_sync_consent`, e una
tabella di configurazione dell'applicazione del consenso.

**Questa non e' una duplicata: e' lavoro mai entrato in produzione.** Le sue
quattro `create table` sono senza `if not exists`, quindi girerebbero senza
errori proprio perche' le tabelle non ci sono, e creerebbero un sottosistema
di consenso che nessuno ha rivisto.

Se ripartisse, non e' un no-op: e' una funzionalita' nuova in produzione.

## Cosa serve decidere, e non lo decide chi trova questa cartella

- **Gruppo A**: registrare le sette come applicate (una riga per versione in
  `supabase_migrations.schema_migrations`), oppure cancellare i file. Scrivere
  nel registro e' una scrittura in produzione: la fa Matteo, non un agente.
- **Gruppo B**: e' una decisione di prodotto, non di manutenzione. Il consenso
  sanitario o serve o non serve; in nessuno dei due casi deve arrivare in
  produzione perche' un file era rimasto in una cartella.

Fino ad allora stanno qui, dove nessuno strumento le raccoglie.
