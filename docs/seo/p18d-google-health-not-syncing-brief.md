# P1.8D brief — "Google Health non si sincronizza con Health Connect"

Stato: **brief soltanto**. Nessuna route, slug, metadata pubblico o entry blog creata da questo documento. Non scrivere/pubblicare l'articolo ora.

## Gate temporale

Rivalutare **14-28 giorni dopo il deploy di P1.8B**, usando dati GSC reali (non le ipotesi qui sotto). Autorizzato SOLO se almeno una condizione è vera:

- **A.** Il cluster troubleshooting raggiunge almeno 100 impression in 28 giorni.
- **B.** Le query hanno posizione media 5-15 ma CTR sotto la media del sito.
- **C.** Google associa stabilmente le query a una pagina con intento diverso (cannibalizzazione involontaria da controllare).
- **D.** Il pillar aggiornato (questo P1.8B) migliora sulle query comparative ma non su quelle troubleshooting.
- **E.** Esiste un insieme di problemi specifici Google Health che l'articolo generale Health Connect non può trattare correttamente.

## Query target del cluster (dal brief originale)

- google health not syncing with health connect
- google health not updating
- google health app synchronisiert nicht
- google health not writing to health connect
- garmin connect google health
- google health garmin

Queste sono già coperte, come richiesto, nella sezione troubleshooting compatta del pillar P1.8B aggiornato (sezione 12 + 3 FAQ nuove) — nessuna pagina separata creata ora.

## Audit di cannibalizzazione obbligatorio prima di autorizzare

Confrontare almeno:
- `google-health-google-fit` (P1.8B, aggiornato)
- `health-connect-not-syncing`
- `health-connect-vs-samsung-health`
- `come-funziona-health-connect`
- eventuali FAQ/landing Google Health esistenti al momento della rivalutazione

**NO-GO esplicito**: il nuovo URL è NO-GO se replica semplicemente i sette fix generici dell'articolo `health-connect-not-syncing` senza un angolo specifico a Google Health.

## Intento potenziale (solo se il gate è superato)

Titolo di lavoro: *"Google Health non si sincronizza con Health Connect: diagnosi per percorso e tipo di dato"*

Contenuto concentrato esclusivamente sul tratto app/dispositivo sorgente → Health Connect → Google Health, distinguendo:
- dato assente nell'app sorgente
- dato non scritto in Health Connect (permesso mancante)
- dato presente in Health Connect ma non letto da Google Health
- dato letto ma non usato nelle funzioni first-party (es. Sleep Score/Cardio Load, vedi ledger P1.8B)
- differenza di calcolo tra app
- ritardo dell'app del produttore
- duplicati
- provenienza della metrica
- storico non importato

Non deve diventare un duplicato dell'articolo generale Health Connect.

## Slug provvisori — NON implementare ora

Solo ipotesi, da verificare contro query/cannibalizzazione/routing reali al momento della decisione:

- IT: `/it/blog/google-health-non-sincronizza-health-connect`
- EN: `/en/blog/google-health-not-syncing-health-connect`

## Se il gate non è superato

Non creare l'articolo. Ampliare ulteriormente il pillar P1.8B invece.
