# Reddit package (prepared, NOT published)

Preparato per P1.3M. Nessuna azione esterna eseguita in questo sprint:
nessun account, nessun post inviato, nessuna verifica delle regole del
subreddit specifico (da fare al momento della futura pubblicazione, non ora).
Contenuto in inglese nativo, tono tecnico/personale, non promozionale.

**Subreddit target suggerito** (da confermare prima della pubblicazione,
verificando le regole di auto-promozione di ciascuno): r/galaxywatch,
r/AndroidQuestions, o r/homeautomation-adjacent quantified-self communities.
Non deciso qui: nessuna azione esterna in questo sprint.

---

## Titolo proposto

Where does your Galaxy Watch data actually go? I mapped Samsung Health vs Health Connect vs Google Health from the official docs (and the code of the app I'm building)

## Corpo del post

Disclosure up front: I'm building FitMesh, a small third-party dashboard
that reads wearable data via Health Connect. So take the source with a grain
of salt, but everything below is sourced from Samsung's and Google's own
developer docs, not from my own app's marketing.

I kept running into the same confusion (my own, at first) about where
Galaxy Watch health data actually ends up, so I mapped it out properly
against the primary sources instead of guessing:

```
Galaxy Watch
     |
     v
Samsung Health
     |----------------> [my app] via Samsung Health Data SDK (direct, read-only)
     |
     v
Health Connect
     |----------------> [my app]
     |----------------> Google Health app
```

Separately: the Google Health API is a distinct cloud API (the evolution of
the old Fitbit Web API). It's not the same thing as the Google Health app,
and it's not automatically wired to Galaxy Watch data per Google's own docs.

Small table, the part most people get wrong:

| Data | Samsung Health | Google Health (via Health Connect) |
|---|---|---|
| Steps, heart rate, sleep, SpO2 | Yes | Yes (per Google's own read/write table) |
| Skin temperature, resting HR, HRV, respiratory rate | Yes | Also yes, actually (I originally assumed these weren't shared, that assumption was wrong) |
| Floors climbed, VO2 max | Yes | Yes |
| GPS routes/lap splits, ECG | Not documented either way | Not documented either way |
| Heart Health Score, Fitness Index, Daily Cardio Load | Yes, proprietary score | No, not a Health Connect data type at all |

Main thing I got wrong before checking the primary source: I assumed Google
Health didn't get skin temperature, resting heart rate, HRV, or respiratory
rate. Google's own support page lists all four as things it can read via
Health Connect. I was wrong, corrected it once I actually read the table
instead of assuming.

Limits: this only covers what's documented, not what's actually guaranteed
to sync for every model/region/app version. Samsung doesn't publish which
exact fields the newest watches write to Health Connect. And this table
describes Google Health's own integration, not a universal rule, other apps
(including mine) implement different subsets.

Question for the sub: has anyone actually verified which of these fields
show up empty vs populated on a recent Galaxy Watch, in Health Connect's own
per-type source list? I'd like real-device data points, not just the docs.

Full writeup with the sources and the complete data-type matrix if useful:
[LINK]

## Cosa NON fare (promemoria per la pubblicazione futura)

- Nessun account fake, nessun cross-post identico su più subreddit lo stesso
  giorno.
- Nessuna richiesta di upvote/voto, nessun link shortener.
- Nessuna auto-pubblicazione: revisione umana prima di ogni invio.
- Nessuna affermazione tipo "we solved everything" o tono da comunicato
  stampa.
- Verificare le regole di self-promotion del subreddit scelto prima di
  postare (molti richiedono un rapporto 9:1 contenuto/auto-promozione).
