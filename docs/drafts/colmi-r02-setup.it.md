---
title: "Colmi R02: come configurarlo e leggerne i dati"
metaDescription: "Colmi R02: come indossarlo, caricarlo e collegarlo a FitMesh per vedere tutti i dati in un'unica dashboard. Guida pratica passo-passo."
slug: "colmi-r02-setup"
keywords_target:
  - colmi r02 come funziona
  - colmi r02 configurazione
  - colmi r02 istruzioni
  - colmi r02 setup
  - colmi r02 come si usa
  - colmi r02 guida italiano
faq_json_ld: true
publish_note: "BOZZA — pubblicare al rilascio feature anello in FitMesh Sync. Non aggiungere a lib/blog/data.ts né a sitemap prima del go-live."
pillar_slug: "colmi-ring-fitmesh"
internal_links:
  - /blog/colmi-ring-fitmesh (guida tecnica completa BLE e dashboard — approfondisci qui)
  - /blog/tracciare-sonno-anello (come usare l'anello per il sonno)
  - /blog/migliori-anelli-economici (confronto anelli economici 2026)
  - /integrations (dispositivi supportati)
  - /beta (iscrizione beta, offerta founder)
---

# Colmi R02: come configurarlo e leggerne i dati

Hai appena ricevuto il Colmi R02 e vuoi capire come funziona, come indossarlo correttamente, e soprattutto come far confluire i dati in FitMesh insieme al tuo smartwatch. Questa guida copre tutto il necessario dal momento in cui apri la scatola fino alla prima dashboard unificata.

## Cosa trovi nella scatola del Colmi R02

La confezione del Colmi R02 è essenziale. All'interno trovi:

- **L'anello** nelle dimensioni che hai ordinato
- **Il caricatore magnetico**: un dischetto con magnete che si attacca al lato piatto dell'anello
- **Cavo USB-A** (alcuni bundle includono anche il cavo USB-C, ma l'alimentatore non è incluso — va bene qualsiasi caricatore USB standard)
- **Manualino di istruzioni** in più lingue (il contenuto è essenziale: per tutti i dettagli rimanda all'app)
- Eventualmente un **kit di taglie di prova** (sizing kit) se hai ordinato l'anello con il kit per trovare la misura giusta

Se hai ordinato il kit di taglie di misura e non sai ancora che taglia usare, prova le taglie di prova per 10–15 minuti per assicurarti che l'anello non sia né troppo stretto (lascia segno sulla pelle dopo pochi minuti) né troppo largo (ruota o cade).

## Come indossare il Colmi R02 correttamente

**Quale dito**: il Colmi R02 funziona meglio sull'**anulare** o sul **medio** della mano non dominante. Questi diti hanno un flusso sanguigno regolare e sono meno esposti a movimenti bruschi durante la giornata. Evita l'indice (troppo movimento) e il mignolo (circolazione spesso meno regolare).

**Orientamento**: il lato con il sensore ottico (la parte piatta o leggermente convessa all'interno dell'anello) deve stare sulla parte **inferiore del dito**, quella rivolta verso il palmo della mano. Questo assicura il contatto diretto tra il sensore e la pelle. Se l'anello ha un piccolo punto o una scanalatura indicatrice, questo va posizionato sul lato inferiore.

**Adattamento alla mano**: le dita cambiano leggermente di diametro durante la giornata — si gonfiano con il caldo o dopo l'attività fisica, si restringono al freddo o al mattino appena svegli. Se l'anello ti sembra leggermente diverso a orari diversi, è normale. L'importante è che sia abbastanza stretto da non ruotare liberamente, ma non così stretto da lasciare segni.

**Un test rapido**: dopo 5 minuti di usura, guarda se ci sono segni rossi sulla pelle — se sì, la misura è troppo piccola. Se l'anello ruota o scivola facilmente, considera una taglia più piccola.

## Ricarica: quanto dura e come capire quando è carico

**Durata della batteria**: con il monitoraggio continuo attivo (battito cardiaco, SpO2 notturno, passi), il Colmi R02 dura tipicamente **5–7 giorni**. Con il monitoraggio SpO2 continuo notturno attivo in modo più aggressivo, può scendere a 3–4 giorni.

**Come caricare**: aggancia il caricatore magnetico al lato piatto dell'anello — il magnete lo mantiene in posizione. Collega il cavo a qualsiasi alimentatore USB standard (5V/1A è più che sufficiente). Non serve un caricatore rapido.

**Come sapere che sta caricando**: la maggior parte dei modelli R02 mostra un LED che lampeggia durante la carica. Quando il LED si spegne o smette di lampeggiare, la carica è completa.

**Tempo di ricarica completa**: circa 1–2 ore da vuoto.

**Routine consigliata**: caricalo ogni 4–5 giorni, la mattina durante la doccia o la colazione. Così non rischi di restare senza batteria di notte — il momento in cui i dati sono più preziosi.

## Prima sincronizzazione con FitMesh: passo-passo

FitMesh Sync si connette al Colmi R02 via **Bluetooth diretto** (BLE), senza passare dall'app OEM del produttore. Non ti serve scaricare l'app companion Colmi/QRing per usare FitMesh — anche se puoi tenerla installata se lo preferisci.

**Passo 1 — Installa FitMesh Sync**: se non l'hai già fatto, scaricala dal Google Play Store. La versione beta è accessibile tramite link di invito dalla pagina [/beta](/beta).

**Passo 2 — Apri FitMesh e vai su "Dispositivi"**: nella schermata principale, seleziona il menu dispositivi o tap sul tasto "+" per aggiungere un nuovo device.

**Passo 3 — Seleziona "Anello smart" e poi "Colmi R02/R03"**: FitMesh avvia la scansione BLE. Assicurati che il Bluetooth del telefono sia attivo e che l'anello sia vicino (entro 50 cm).

**Passo 4 — Abbina l'anello**: quando il Colmi R02 appare nella lista dei dispositivi rilevati, selezionalo. L'abbinamento richiede pochi secondi. Non ti viene chiesto nessun PIN.

**Passo 5 — Prima sincronizzazione dati**: dopo l'abbinamento, FitMesh scarica automaticamente i dati storici presenti nella memoria dell'anello (tipicamente gli ultimi 7 giorni). Questa prima sincronizzazione può richiedere da 30 secondi a qualche minuto.

**Passo 6 — Sincronizzazioni successive**: le sincronizzazioni seguenti avvengono in automatico ogni volta che l'anello è in range del telefono. Non devi fare nulla manualmente.

Per i dettagli tecnici completi su come funziona la connessione BLE, cosa succede esattamente durante la sincronizzazione, e come avviene la fusione dei dati con il tuo smartwatch, leggi la [guida tecnica completa all'integrazione Colmi R02/R03 su FitMesh](/blog/colmi-ring-fitmesh).

## Capire i dati nella dashboard FitMesh

Una volta sincronizzato, nella dashboard FitMesh trovi le metriche dell'anello organizzate per tipologia:

**Dati giornalieri**:
- Passi e distanza
- Calorie stimate
- Minuti attivi
- Frequenza cardiaca media e FC a riposo

**Dati notturni** (disponibili ogni mattina dopo la prima sincronizzazione):
- Ore di sonno totali
- Distribuzione delle fasi (sonno leggero, profondo, REM, veglia)
- HRV notturno (variabilità cardiaca stimata)
- SpO2 notturno (saturazione stimata)
- FC minima notturna (battito a riposo)

**Vista unificata con il watch**:
Se hai già collegato un smartwatch a FitMesh (Galaxy Watch, Pixel Watch, Garmin, Amazfit ecc.), i dati dell'anello si integrano automaticamente con quelli del watch sulla stessa timeline. Di notte le metriche vengono dall'anello; le sessioni di allenamento e le metriche diurne dal watch. Non ci sono doppi conteggi.

**Trend e storico**:
FitMesh mostra grafici su 7, 30 e 90 giorni per tutte le metriche principali. Il valore dei dati aumenta settimana dopo settimana — un mese di dati ti dà correlazioni e pattern che una singola lettura non può mostrare.

## Domande frequenti sul Colmi R02

**Il Colmi R02 è impermeabile?**
Sì, il Colmi R02 ha una certificazione IP68 — resiste all'immersione fino a 50 metri in acqua dolce secondo le specifiche del produttore. Puoi tenerlo durante la doccia e il lavaggio delle mani. Evita comunque immersioni prolungate in acqua salata o clorata, che possono deteriorare i materiali nel tempo.

**Devo tenere installata l'app QRing o Colmi per usare FitMesh?**
No. FitMesh si connette direttamente via BLE e non richiede l'app companion. Puoi disinstallare l'app OEM se non la usi. Se preferisci tenerla per confronto, non crea conflitti — i due sistemi operano in modo indipendente.

**L'anello funziona con iPhone?**
FitMesh Sync è attualmente disponibile solo su Android. Il Colmi R02 supporta tecnicamente sia Android che iOS tramite l'app OEM, ma l'integrazione FitMesh richiede Android.

**Quanti dati storici vengono scaricati al primo abbinamento?**
FitMesh scarica tipicamente gli ultimi 7 giorni di dati dalla memoria dell'anello. I dati più vecchi potrebbero non essere disponibili perché la memoria interna dell'anello ha capacità limitata e sovrascrive i dati più vecchi.

**Cosa succede se l'anello si scarica di notte?**
I dati raccolt prima che la batteria si esaurisca vengono salvati nella memoria dell'anello e sincronizzati con FitMesh al successivo abbinamento. I dati del periodo in cui la batteria era scarica non sono recuperabili.

---

FitMesh Sync è in beta privata. I primi 1000 utenti ottengono 1 anno di Pro gratis. Iscriviti alla beta su [fitmesh.fit/beta](/beta).
