# Monitor del sonno — denominatori, query esatte, popolazione

Due misure diverse hanno risposto alla stessa domanda con numeri incompatibili
(«88,7% di duplicazione» contro «4,3%»). Non erano in contraddizione: contavano
popolazioni diverse. Questo file fissa quale popolazione risponde a quale
domanda, in modo che il gate della 190 non venga letto contro il denominatore
sbagliato.

Tutte le misure che seguono sono **sola lettura** sul progetto di produzione
`xcdyhkuyxukaifhhtadr`, eseguite via MCP Supabase. Nessun `user_id`, nessun
nome di dispositivo, nessun valore sanitario e nessun timestamp sanitario
compare nell'output: si aggrega per sorgente e si contano righe e segmenti.
`received_at` non e' un dato sanitario, e' l'istante di ingestione.

## Le due domande

| Domanda | Popolazione | Chi la usa |
|---|---|---|
| «Quanto sono sporchi i dati che abbiamo?» | tutto lo storico | decide se e quando serve la riparazione storica (S7) |
| «La 190 sta ancora scrivendo copie?» | solo `received_at >= <deploy_at>` | **e' il gate di rollout**, l'unico che puo' dare GO |

Il gate di rollout **non** deve mai essere calcolato sullo storico: le righe
scritte prima del deploy contengono per costruzione i difetti che il deploy
corregge, quindi lo storico non scendera' mai a zero e un gate definito su di
esso non puo' passare. Il gate guarda solo cio' che e' stato scritto **dopo**.

## Misura A — storico (fotografia, non gate)

Eseguita il **2026-08-15**. Popolazione: tutte le righe di
`public.fitness_metrics` con `sleep_stages is not null`, dall'inizio della
tabella. Nessun filtro temporale, nessun campionamento.

```sql
with righe as (
  select id, source, received_at,
         case when jsonb_typeof(sleep_stages) = 'array'
              then sleep_stages else '[]'::jsonb end as st
  from public.fitness_metrics
  where sleep_stages is not null
),
chiavi as (
  select r.id, r.source,
         (s.value->>'sessionIdx') as sess,
         (s.value->>'startMs')    as inizio,
         (s.value->>'endMs')      as fine,
         lower(btrim(s.value->>'stage')) as stadio
  from righe r, lateral jsonb_array_elements(r.st) s
),
copie as (
  select id, source, count(*) as n
  from chiavi
  group by id, source, sess, inizio, fine, stadio
  having count(*) > 1
)
select r.source,
       count(distinct r.id)                              as righe,
       count(distinct c.id)                              as righe_con_copie_esatte,
       round(100.0 * count(distinct c.id)
             / nullif(count(distinct r.id), 0), 1)       as pct,
       coalesce(sum(c.n - 1), 0)                         as copie_eccedenti
from righe r left join copie c on c.id = r.id
group by r.source order by 1;
```

Risultato al 2026-08-15:

| sorgente | righe | righe con copie esatte | % | copie eccedenti |
|---|---|---|---|---|
| health_connect | 34.588 | 1.498 | 4,3% | 76.718 |
| healthkit | 5.277 | 197 | 3,7% | 8.501 |
| colmi_ble | 583 | 60 | 10,3% | 1.177 |
| apple_health | 14 | 0 | 0% | 0 |

**Il denominatore e' la riga, non l'osservazione.** Una riga con 300 segmenti e
una con 3 pesano uguale. Le righe dello stesso utente non sono indipendenti:
un utente con Health Connect e sync frequente contribuisce migliaia di righe.
Qualunque percentuale qui dentro descrive le RIGHE, non gli utenti e non le
notti — e non va usata per stimare «quanti utenti sono colpiti».

Se il numero da confrontare e' invece «giorni-utente distinti» o una finestra
recente, va detto quale: sono domande diverse e danno numeri diversi
legittimamente.

## Misura B — gate di rollout

Da eseguire **dopo** il deploy, sostituendo `<deploy_at>` con l'istante reale
del deploy in UTC. Stessa query della Misura A con una riga in piu':

```sql
  from public.fitness_metrics
  where sleep_stages is not null
    and received_at >= timestamptz '<deploy_at>'   -- <-- SOLO il post-deploy
```

**Criterio di GO:** `copie_eccedenti = 0` **su tutte le sorgenti**, per piu'
cicli reali consecutivi (non una sola lettura). Zero, non «poche»: la copia
esatta e' deterministica, se ne resta anche una il difetto non e' chiuso.

Il monitor va corredato del conteggio delle righe osservate: `copie = 0` su
zero righe non e' un PASS, e' un'assenza di misura.

## Segmenti invalidi

Classificazione al 2026-08-15, **senza `coalesce` a zero**: chiavi mancanti e
valori non numerici restano in una categoria propria e non possono trasformarsi
in un falso `endMs <= startMs`.

```sql
case
  when not (v ? 'startMs') or not (v ? 'endMs')            then 'chiave mancante'
  when jsonb_typeof(v->'startMs') = 'null'
    or jsonb_typeof(v->'endMs')   = 'null'                 then 'valore null'
  when not (jsonb_typeof(v->'startMs') = 'number'
            or (jsonb_typeof(v->'startMs') = 'string'
                and v->>'startMs' ~ '^-?[0-9]+$'))
    or not (jsonb_typeof(v->'endMs') = 'number'
            or (jsonb_typeof(v->'endMs') = 'string'
                and v->>'endMs' ~ '^-?[0-9]+$'))            then 'non numerico'
  when (v->>'endMs')::numeric < (v->>'startMs')::numeric   then 'endMs < startMs'
  when (v->>'endMs')::numeric = (v->>'startMs')::numeric   then 'endMs = startMs'
  else                                                          'valido'
end
```

Esito: **nessuna chiave mancante, nessun valore null, nessun valore non
numerico, su nessuna sorgente.** Tutti i `startMs` sono epoch in millisecondi
a 13 cifre. L'unica classe invalida e' `endMs < startMs`, e sta tutta in
`apple_health`: 14 segmenti su 84 (16,7%), distribuiti su tutte e 14 le righe
della sorgente.

**Attenzione all'unita' di misura.** «14 righe, 100%» e «14 segmenti, 16,7%»
sono due frasi vere sullo stesso fatto: il 100% e' la quota di RIGHE che
contengono almeno un segmento invalido, il 16,7% e' la quota di SEGMENTI
invalidi. La coincidenza fra il numero di righe della sorgente (14) e il numero
di segmenti invalidi (14) rende lo scambio particolarmente facile da fare.

### `apple_health` non e' l'export verso Salute

| sorgente | prima ingestione | ultima ingestione | righe | con `sessionIdx` |
|---|---|---|---|---|
| apple_health | 2026-06-10 | **2026-06-23** | 14 | 0% |
| healthkit | 2026-07-01 | in corso | 5.569 | 100% |

Nessuna scrittura su `apple_health` dal 23 giugno; `healthkit` comincia il
1 luglio. E' un alias legacy sostituito da una migrazione, non una sorgente
viva, e nessun writer corrente lo produce — anche un read-back finirebbe come
`healthkit`. Le 14 righe vanno trattate come dato storico da riparare (S7),
non come sintomo di un percorso attivo.

Indipendentemente dall'origine, la canonicalizzazione della 190 deve scartare
i segmenti invalidi **per qualunque sorgente**. Il candidato lo fa
(`internal._canonicalize_sleep_stages_jsonb` richiede `endMs > startMs`), ma la
suite non ha fixture ne' per la forma legacy `apple_health` (senza
`sessionIdx`, con un segmento invertito) ne' per la forma corrente `healthkit`:
vanno aggiunte, altrimenti la proprieta' e' affermata e non provata.

## «Fuori finestra» non e' un segnale di difetto

Ricalcolato **per sessione** e spaccato per stadio (sessionIdx = 0):

| stadio | segmenti | fuori finestra | % |
|---|---|---|---|
| light | 967.629 | 263 | 0,0% |
| rem | 305.893 | 79 | 0,0% |
| deep | 268.614 | 62 | 0,0% |
| asleep | 3.626 | 0 | 0,0% |
| **awake** | **618.616** | **32.353** | **5,2%** |

Lo sforamento e' quasi tutto risvegli ai bordi: mediana 3,0 minuti su Health
Connect, 7,5 su HealthKit, contro una finestra media di 7,65 ore. Lo stadio
`in_bed` non compare nei dati.

La metrica aggregata «4% fuori finestra» va quindi **tolta dal gate**: misura
la definizione di finestra, non un difetto. Cio' che resta e' il sonno vero
fuori dalla principale — 404 segmenti su 1.545.762, lo 0,03% — che e' un
finding separato e non e' stato ancora indagato.

Il difetto vicino a questa misura e' un altro e ha il suo caso in
`60-finestra-awake.sql`: gli awake ai bordi **allargano** la finestra
calcolata dal server.
