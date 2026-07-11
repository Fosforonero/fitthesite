# App Store Connect — Guida setup completo
## FitMesh Sync · App ID 6779751708 · Bundle ID com.fitmeshsync.app

> **Usa questo documento come script**: apri App Store Connect e copia-incolla direttamente da qui. Tutto il contenuto è pronto, dimensionato e corretto.

---

## 0. Prima di tutto: Apple Small Business Program

**Fallo subito** prima di impostare i prezzi. Riduce la commissione Apple dal 30% al **15%** (stesso di Google Play), eliminando qualsiasi perdita rispetto ad Android.

1. Vai su https://developer.apple.com/app-store/small-business-program/
2. Clicca **Enroll now** — è gratuito, non ci sono soglie di fatturato minimo
3. Requisito: meno di $1M ricevuti dall'App Store nell'anno precedente ✓ (sei nuovo)
4. Approvazione: in genere istantanea o entro 24h

**Senza il programma:** le commissioni Apple sarebbero 30% (prime iscrizioni) / 15% (dal secondo anno di abbonamento continuo) e 30% sugli acquisti una tantum. Con il programma: 15% fisso su tutto.

---

## 1. In-App Purchase — Abbonamento 6 mesi (Auto-Renewable Subscription)

### Percorso in App Store Connect
`App → In-App Purchases → Subscriptions → + Create Subscription Group`

### Gruppo abbonamenti
| Campo | Valore |
|---|---|
| **Subscription Group Reference Name** | FitMesh Pro |

### Abbonamento all'interno del gruppo
| Campo | Valore |
|---|---|
| **Reference Name** | FitMesh Pro — 6 mesi |
| **Product ID** | `fitmesh_pro_sub` |
| **Subscription Duration** | 6 Months |
| **Price** | EUR €1,19 di riferimento (vedi `lib/pricing.ts` → `PRICE_SUB_6M_RAW`, unica fonte). Il Tier ASC esatto va verificato in App Store Connect al momento della configurazione: non assumere che il tier più vicino corrisponda esattamente a questa cifra o che il prezzo mostrato in altre valute (USD, GBP, ecc.) sia una conversione 1:1. |

> **Calcolo commissioni (sul riferimento €1,19, da riverificare col Tier ASC reale):**
> - Android (Google, 15%): €1,19 × 0.85 = **€1,01 netto**
> - Apple con Small Business (15%): €1,19 × 0.85 = **€1,01 netto** ✓ pari
> - Apple senza Small Business, anno 1 (30%): €1,19 × 0.70 = €0,83 — per questo iscriviti al programma prima

### Subscription Display Name (per gli utenti)
| Lingua | Display Name |
|---|---|
| Italiano | FitMesh Pro |
| English | FitMesh Pro |

### Description — Italiano (max 255 caratteri)
```
Accesso completo a tutte le funzioni Pro di FitMesh Sync per 6 mesi: dashboard avanzata, cronologia illimitata, analisi HRV e sonno. Si rinnova automaticamente. Cancella quando vuoi.
```
*(185 caratteri)*

### Description — English (max 255 caratteri)
```
Full access to all FitMesh Sync Pro features for 6 months: advanced dashboard, unlimited history, HRV and sleep analysis. Renews automatically. Cancel anytime.
```
*(160 caratteri)*

---

## 2. In-App Purchase — Acquisto a vita (Non-Consumable)

### Percorso in App Store Connect
`App → In-App Purchases → In-App Purchases → + Non-Consumable`

| Campo | Valore |
|---|---|
| **Reference Name** | FitMesh Pro — Lifetime |
| **Product ID** | `fitmesh_pro_lifetime` |
| **Price** | EUR €4.99 (Tier 5) |

> **Calcolo commissioni:**
> - Android (Google, 15%): €3.99 × 0.85 = **€3.39 netto**
> - Apple con Small Business (15%): €4.99 × 0.85 = **€4.24 netto** ✓ meglio di Android
> - Apple senza Small Business (30%): €4.99 × 0.70 = **€3.49 netto** ✓ ancora meglio di Android
>
> Il prezzo lifetime su iOS è €1 in più rispetto ad Android (€3.99 → €4.99) perché Apple applica il 30% sui non-consumable anche con il Small Business Program (nota: il 15% del SBP vale solo per gli abbonamenti auto-renewable, non per i non-consumable). Con €4.99 sei coperto in entrambi i casi.

### Display Name — Italiano
```
FitMesh Pro — Accesso a vita
```

### Display Name — English
```
FitMesh Pro — Lifetime Access
```

### Description — Italiano (max 255 caratteri)
```
Accesso illimitato e permanente a tutte le funzioni Pro di FitMesh Sync. Dashboard avanzata, cronologia completa, analisi HRV e sonno. Pagamento unico, nessun abbonamento.
```
*(169 caratteri)*

### Description — English (max 255 caratteri)
```
Unlimited, permanent access to all FitMesh Sync Pro features. Advanced dashboard, full history, HRV and sleep analysis. One-time purchase, no subscription.
```
*(155 caratteri)*

---

## 3. App Metadata — Scheda App Store

### Percorso
`App → App Store → Italian (Primary) / English (United Kingdom)`

### Campi base
| Campo | Valore |
|---|---|
| **App Name** | FitMesh Sync |
| **Subtitle** | Tutti i tuoi wearable, un'app |
| **Category (Primary)** | Health & Fitness |
| **Category (Secondary)** | Utilities |
| **Age Rating** | 4+ |
| **Privacy Policy URL** | https://www.fitmesh.fit/it/privacy |
| **Support URL** | https://www.fitmesh.fit/it/support |
| **Marketing URL** | https://www.fitmesh.fit |

---

### Promotional Text — Italiano (max 170 caratteri, aggiornabile senza nuovo build)
```
Nuovo: connessione diretta agli anelli smart Colmi. Porta tutti i tuoi wearable in un'unica dashboard — niente doppioni, nessuna app in più.
```
*(138 caratteri)*

### Promotional Text — English (max 170 caratteri)
```
New: direct connection for Colmi smart rings. Bring all your wearables into one dashboard — no duplicate counts, no extra apps.
```
*(126 caratteri)*

---

### Description — Italiano (max 4000 caratteri)

```
FitMesh Sync raccoglie i dati di salute da tutti i tuoi wearable in un'unica dashboard. Apple Watch, anello smart, Garmin, Fitbit, fascia cardio: invece di saltare tra cinque app, hai tutto in un posto solo.

— COSA FA —

Collega tutti i tuoi dispositivi
Qualsiasi wearable compatibile con Apple HealthKit (Apple Watch, Fitbit, Garmin, Suunto e altri), e gli anelli smart Colmi R02/R03 tramite connessione Bluetooth diretta — senza bisogno dell'app companion del produttore.

Elimina i doppioni automaticamente
Se watch e anello misurano la stessa cosa nello stesso momento, FitMesh prende la fonte migliore, mai la somma. Niente passi duplicati, niente HRV doppio.

Completa le lacune tra un device e l'altro
L'anello copre sonno, recupero e HRV notturno quando il watch è in carica. Il watch raccoglie i passi durante il giorno. Il Garmin registra l'allenamento con GPS. Insieme completano una giornata intera — senza buchi.

Una linea del tempo continua
Vedi come si è svolta la giornata: dal sonno notturno all'allenamento, dai passi del pomeriggio al recupero serale. Tutto su un'unica timeline, indipendentemente da cosa indossavi in quel momento.

— METRICHE —
Battito cardiaco continuo · SpO2 · HRV · Sonno e fasi del sonno · Passi e distanza · Calorie · Livello di stress · Allenamenti · VO₂max · Saturazione ossigeno

— DISPOSITIVI COMPATIBILI —
Apple Watch · Fitbit · Garmin · Suunto · Anelli smart Colmi R02/R03 · Qualsiasi wearable compatibile con Apple HealthKit

— FITMESH PRO —
Con Pro hai accesso alla dashboard completa, alla cronologia senza limiti e alle analisi avanzate su HRV, sonno e recupero. Puoi scegliere tra l'abbonamento semestrale con rinnovo automatico o l'acquisto una tantum a vita — paghi una volta sola e hai tutto per sempre.

— PRIVACY —
I dati di salute vivono su server europei. Nessun tracker pubblicitario, nessun broker dati. I dati non vengono mai venduti né condivisi con terze parti. La cancellazione di account e dati avviene entro 48 ore su richiesta, come previsto dal GDPR.
```
*(1.993 caratteri — ben dentro i 4000)*

---

### Description — English (max 4000 caratteri)

```
FitMesh Sync brings all your health data from every wearable into one dashboard. Apple Watch, smart ring, Garmin, Fitbit, chest strap: instead of switching between five apps, you see everything in one place.

— WHAT IT DOES —

Connects all your devices
Any HealthKit-compatible wearable (Apple Watch, Fitbit, Garmin, Suunto and others), and Colmi R02/R03 smart rings via direct Bluetooth — no manufacturer companion app needed.

Eliminates duplicates automatically
If your watch and ring measure the same thing at the same time, FitMesh picks the best source — never the sum. No doubled step counts, no duplicate HRV.

Fills the gaps between devices
Your ring covers sleep, recovery and nighttime HRV when your watch is charging. Your watch tracks steps throughout the day. Your Garmin logs the workout with GPS. Together they complete a full day — no gaps.

One continuous timeline
See how your day unfolded: from overnight sleep through your workout, afternoon steps and evening recovery. Everything on a single timeline, regardless of what you were wearing at any given moment.

— METRICS —
Continuous heart rate · SpO2 · HRV · Sleep & sleep stages · Steps & distance · Calories · Stress level · Workouts · VO₂max · Blood oxygen saturation

— SUPPORTED DEVICES —
Apple Watch · Fitbit · Garmin · Suunto · Colmi R02/R03 smart rings · Any Apple HealthKit–compatible wearable

— FITMESH PRO —
With Pro you get the full dashboard, unlimited history and advanced analysis on HRV, sleep and recovery. Choose between a 6-month auto-renewing subscription or a one-time lifetime purchase — pay once and keep everything forever.

— PRIVACY —
Your health data lives on European servers. No ad trackers, no data brokers. Data is never sold or shared with third parties. Account and data deletion within 48 hours on request, as required by GDPR.
```
*(1.925 characters — well within 4000)*

---

### Keywords — Italiano (max 100 caratteri, separati da virgola senza spazi)
```
anello smart,wearable,salute,HRV,sonno,Garmin,smartwatch,Fitbit,dashboard,passi
```
*(79 caratteri)*

### Keywords — English (max 100 caratteri)
```
smart ring,wearable,health,HRV,sleep,Garmin,smartwatch,Fitbit,dashboard,steps
```
*(77 caratteri)*

---

## 4. What's New (Release Notes)

### Italiano
```
Prima versione su App Store. Collega Apple Watch, anello smart Colmi, Garmin e qualsiasi wearable HealthKit in un'unica dashboard — senza doppioni.
```

### English
```
First release on the App Store. Connect Apple Watch, Colmi smart ring, Garmin and any HealthKit wearable in one unified dashboard — no duplicate counts.
```

---

## 5. Checklist finale prima di Submit

- [ ] Small Business Program approvato (https://developer.apple.com/app-store/small-business-program/)
- [ ] Subscription Group "FitMesh Pro" creato
- [ ] IAP `fitmesh_pro_sub` — 6 mesi — €1,19 di riferimento (verifica il Tier ASC esatto) — stato **Ready to Submit**
- [ ] IAP `fitmesh_pro_lifetime` — Non-Consumable — €4.99 — stato **Ready to Submit**
- [ ] Screenshot caricati (iPhone 6.9", iPhone 6.5", iPad 12.9" se applicabile)
- [ ] App icon 1024×1024 caricata
- [ ] Privacy Policy URL impostato: https://www.fitmesh.fit/it/privacy
- [ ] Support URL impostato: https://www.fitmesh.fit/it/support
- [ ] Sezione "App Privacy" compilata (Data Types Used)
- [ ] Rating questionnaire completato
- [ ] Build selezionata (quella caricata via Transporter)
- [ ] Submit for Review

---

## 6. Sezione App Privacy (Data Types Used)

Apple chiede di dichiarare i dati che l'app raccoglie. Seleziona le seguenti voci:

| Tipo di dato | Raccolta | Collegato all'utente | Tracking |
|---|---|---|---|
| **Health & Fitness** | Sì | Sì | No |
| **Location** | No | — | — |
| **Contact Info** (email) | Sì | Sì | No |
| **Identifiers** (user ID) | Sì | Sì | No |
| **Usage Data** | Sì | Sì | No |

Per ogni tipo dichiarato Apple chiederà la finalità: seleziona **App Functionality** (non selezionare Analytics o Advertising).

---

## Note tecniche per il backend iOS

Una volta che gli IAP sono su App Store Connect e l'app è live, il backend `/api/v1/billing/validate-purchase` dovrà supportare anche i receipt Apple oltre a Google Play. Attualmente gestisce solo Google Play — vedi `iap-validation-setup.md` per il contesto. La validazione Apple richiede:
- `POST https://buy.itunes.apple.com/verifyReceipt` (production) con il receipt Base64 dell'app
- Oppure StoreKit 2 con `AppTransaction` e `Transaction.all` (approccio moderno, raccomandato)

Questo è un task separato da fare dopo il lancio iniziale.
