# SITE-HELP-01 – Guide primo sync – IT + EN
Autrice: Pauline Copy, 10/10/2026. Bozza, nessun commit.
URL: IT `/it/support/primo-sync/{slug}`, EN `/en/support/first-sync/{slug-en}` (gli slug sono indicati in ogni guida). Marcatori: [SCREENSHOT JARVIS] = serve una schermata; [DA VERIFICARE JARVIS] = percorso di menu da controllare sul dispositivo reale, non inventato.
Tono: manca un passaggio di configurazione, non è colpa del dispositivo né tua.

---

## 1. /support/primo-sync/health-connect-permessi
URL: IT `/it/support/primo-sync/health-connect-permessi` · EN `/en/support/first-sync/health-connect-permissions`

### IT
**Titolo:** Dai a FitMesh il permesso di leggere Health Connect
**Meta (≤155):** FitMesh non vede dati su Android? Consenti a FitMesh di leggere da Health Connect: la guida passo passo per Android 14 e versioni precedenti.
**Intro:** Su Android, FitMesh legge i dati da Health Connect. Se non ha il permesso di farlo, non vede nulla, anche se il tuo dispositivo registra tutto correttamente. Bastano un paio di minuti.

**Android 14 e successivi** (Health Connect è integrato nelle impostazioni)
1. Apri **Impostazioni** del telefono. [SCREENSHOT JARVIS]
2. Tocca **Sicurezza e privacy** > **Controlli della privacy** > **Health Connect**. [FONTE: https://support.google.com/android/answer/12201227?hl=en] [DA VERIFICARE JARVIS: etichette IT sul telefono] [SCREENSHOT JARVIS]
3. Apri **[DA CONFERMARE SU TELEFONO — Jarvis]** (in inglese «Permissions and data»), poi **Autorizzazioni app** e **FitMesh**. [SCREENSHOT JARVIS]
4. Attiva i dati che vuoi vedere (passi, sonno, battito, HRV…) oppure **Consenti tutto**. [SCREENSHOT JARVIS]
5. Se c'è l'opzione **Accesso in background** o **Leggi dati in background**, attivala: serve per sincronizzare anche quando l'app è chiusa. [DA VERIFICARE JARVIS: nome dell'opzione] [SCREENSHOT JARVIS]
6. Torna in FitMesh e tocca **Sincronizza ora**.

**Android 13 e precedenti** (Health Connect è un'app separata) [FONTE: https://support.google.com/android/answer/12201227?hl=en]
1. Controlla di avere l'app **Health Connect** installata dal Play Store e aggiornata. [SCREENSHOT JARVIS]
2. Apri **Impostazioni** > **App** > **Tutte le app** > **Health Connect** > **Apri**. [DA VERIFICARE JARVIS: etichette IT] [SCREENSHOT JARVIS]
3. Apri **[DA CONFERMARE SU TELEFONO — Jarvis]** («Permissions and data») > **Autorizzazioni app** > **FitMesh**. [SCREENSHOT JARVIS]
4. Attiva i dati che vuoi vedere, poi torna in FitMesh e tocca **Sincronizza ora**.

**Domande frequenti (FAQPage)**
- **D: Ho dato il permesso ma FitMesh non vede ancora dati. Perché?**
  R: Probabilmente l'app del tuo dispositivo non scrive ancora in Health Connect. Segui la guida [L'app del produttore non condivide i dati](./app-produttore-non-condivide).
- **D: Come controllo se in Health Connect ci sono dati?**
  R: Apri Health Connect > **[DA CONFERMARE SU TELEFONO — Jarvis]** (in inglese «Permissions and data») e cerca dati recenti, per esempio i passi di oggi. Se non ci sono, il passaggio mancante è nell'app del produttore.
- **D: Quanto tempo ci vuole perché compaiano i primi dati?**
  R: Di solito bastano pochi minuti; su Android a volte qualche ora. Se dopo un giorno non vedi ancora dati, ricontrolla i passaggi di questa guida e, se serve, scrivici dal supporto.
- **D: La sincronizzazione si ferma quando chiudo l'app. Cosa posso fare?**
  R: Attiva l'accesso in background in Health Connect e, se l'hai fatto per altre app, disattiva l'ottimizzazione batteria anche per FitMesh. [DA VERIFICARE JARVIS]

**Torna all'app:** [Apri FitMesh]

### EN
**Title:** Let FitMesh read Health Connect
**Meta (≤155):** FitMesh shows no data on Android? Allow FitMesh to read from Health Connect: a step-by-step guide for Android 14 and earlier versions.
**Intro:** On Android, FitMesh reads your data from Health Connect. Without permission to do so it sees nothing, even if your device is recording everything correctly. It takes a couple of minutes.

**Android 14 and later** (Health Connect is built into Settings)
1. Open your phone's **Settings**. [SCREENSHOT JARVIS]
2. Tap **Security and privacy** > **Privacy controls** > **Health Connect**. [FONTE: https://support.google.com/android/answer/12201227?hl=en] [SCREENSHOT JARVIS]
3. Open **Permissions and data**, then **App permissions** and **FitMesh**. [SCREENSHOT JARVIS]
4. Turn on the data you want to see (steps, sleep, heart rate, HRV…) or **Allow all**. [SCREENSHOT JARVIS]
5. If you see **Background access** or **Read data in the background**, turn it on so FitMesh can sync while the app is closed. [DA VERIFICARE JARVIS] [SCREENSHOT JARVIS]
6. Go back to FitMesh and tap **Sync now**.

**Android 13 and earlier** (Health Connect is a separate app) [FONTE: https://support.google.com/android/answer/12201227?hl=en]
1. Make sure the **Health Connect** app is installed from the Play Store and up to date. [SCREENSHOT JARVIS]
2. Open **Settings** > **Apps** > **All apps** > **Health Connect** > **Open**. [SCREENSHOT JARVIS]
3. Open **Permissions and data** > **App permissions** > **FitMesh**. [SCREENSHOT JARVIS]
4. Turn on the data you want to see, then go back to FitMesh and tap **Sync now**.

**Frequently asked questions (FAQPage)**
- **Q: I granted permission but FitMesh still shows no data. Why?**
  A: Your device's app is probably not writing to Health Connect yet. Follow [Your device's app isn't sharing data](./manufacturer-app-not-sharing).
- **Q: How do I check whether Health Connect has data?**
  A: Open Health Connect > **Permissions and data** and look for recent data, such as today's steps. If there's none, the missing step is in the manufacturer's app.
- **Q: How long until the first data appears?**
  A: It usually takes a few minutes; on Android it can sometimes take a few hours. If you still see no data after a day, go through the steps in this guide again and, if needed, contact support.
- **Q: Syncing stops when I close the app. What can I do?**
  A: Turn on background access in Health Connect and, if you've done it for other apps, turn off battery optimisation for FitMesh too. [DA VERIFICARE JARVIS]

**Back to the app:** [Open FitMesh]

---

## 2. /support/primo-sync/apple-salute-permessi
URL: IT `/it/support/primo-sync/apple-salute-permessi` · EN `/en/support/first-sync/apple-health-permissions`

### IT
**Titolo:** Dai a FitMesh il permesso di leggere Salute su iPhone
**Meta (≤155):** FitMesh non vede dati su iPhone? Ecco come consentire a FitMesh di leggere dall'app Salute, in pochi passaggi.
**Intro:** Su iPhone, FitMesh legge i dati dall'app Salute. iOS ti chiede il permesso la prima volta; se allora non hai attivato tutto, puoi farlo ora.

1. Apri l'app **Salute**. [SCREENSHOT JARVIS]
2. Tocca **Riepilogo** in basso. [FONTE: https://support.apple.com/guide/iphone/share-your-health-data-iph5ede58c3d/26/ios/26] [SCREENSHOT JARVIS]
3. Tocca la **foto del profilo** in alto a destra. [SCREENSHOT JARVIS]
4. Sotto **Privacy**, tocca **App** > **FitMesh**. [DA VERIFICARE JARVIS: etichette IT su iOS 26] [SCREENSHOT JARVIS]
5. Attiva i dati che vuoi vedere oppure **Attiva tutto**. [SCREENSHOT JARVIS]
6. Torna in FitMesh e tocca **Sincronizza ora**.

**Domande frequenti (FAQPage)**
- **D: Ho dato il permesso ma FitMesh non vede ancora dati. Perché?**
  R: In Salute apri **Sfoglia** e controlla se ci sono dati recenti. Se non ci sono, l'app del tuo dispositivo non scrive ancora in Salute: vedi [L'app del produttore non condivide i dati](./app-produttore-non-condivide).
- **D: Perché a volte i dati arrivano in ritardo?**
  R: Salute non permette di leggere i dati mentre l'iPhone è bloccato: sbloccalo e sincronizza di nuovo. Aiuta anche aprire FitMesh almeno una volta al giorno.
- **D: Quanto tempo ci vuole perché compaiano i primi dati?**
  R: Di solito bastano pochi minuti. Se dopo un giorno non vedi ancora dati, ricontrolla i passaggi di questa guida e, se serve, scrivici dal supporto.

**Torna all'app:** [Apri FitMesh]

### EN
**Title:** Let FitMesh read Apple Health on iPhone
**Meta (≤155):** FitMesh shows no data on iPhone? Here's how to allow FitMesh to read from the Health app in a few steps.
**Intro:** On iPhone, FitMesh reads your data from the Health app. iOS asks for permission the first time; if you didn't turn everything on then, you can do it now.

1. Open the **Health** app. [SCREENSHOT JARVIS]
2. Tap **Summary**. [FONTE: https://support.apple.com/guide/iphone/share-your-health-data-iph5ede58c3d/26/ios/26] [SCREENSHOT JARVIS]
3. Tap your **profile picture** at the top right. [SCREENSHOT JARVIS]
4. Under **Privacy**, tap **Apps** > **FitMesh**. [SCREENSHOT JARVIS]
5. Turn on the data you want to see or **Turn On All**. [SCREENSHOT JARVIS]
6. Go back to FitMesh and tap **Sync now**.

**Frequently asked questions (FAQPage)**
- **Q: I granted permission but FitMesh still shows no data. Why?**
  A: In Health open **Browse** and check for recent data. If there's none, your device's app isn't writing to Health yet: see [Your device's app isn't sharing data](./manufacturer-app-not-sharing).
- **Q: Why does data sometimes arrive late?**
  A: Health doesn't allow any app to read data while your iPhone is locked: unlock it and sync again. Opening FitMesh at least once a day also helps.
- **Q: How long until the first data appears?**
  A: It usually takes a few minutes. If you still see no data after a day, go through the steps in this guide again and, if needed, contact support.

**Back to the app:** [Open FitMesh]

---

## 3. /support/primo-sync/app-produttore-non-condivide
URL: IT `/it/support/primo-sync/app-produttore-non-condivide` · EN `/en/support/first-sync/manufacturer-app-not-sharing`

### IT
**Titolo:** L'app del tuo dispositivo non condivide ancora i dati
**Meta (≤155):** Il tuo smartwatch o anello registra, ma FitMesh non vede dati? Attiva la condivisione con Health Connect o Salute nell'app del produttore.
**Intro:** FitMesh non legge direttamente dal tuo orologio o anello: legge da Health Connect (Android) o da Salute (iPhone). L'app del produttore deve quindi scrivere lì i dati, e spesso questa opzione è spenta finché non la attivi. Il dispositivo funziona: manca solo questo collegamento.

**Su Android (tramite Health Connect)** – Samsung Health, Garmin Connect, Oura, Zepp (Amazfit), Fitbit (ora Google Health app), Polar Flow, Withings, RingConn, Xiaomi Mi Fitness, Ultrahuman, Wahoo.
1. Apri l'app del produttore. [FONTE: guida ufficiale del produttore]
2. Vai nelle **impostazioni** dell'app e cerca **Health Connect** (il percorso esatto cambia per ogni marchio: vedi la tabella sotto). [FONTE: guida ufficiale del produttore]
3. Attiva la condivisione con Health Connect e consenti la **scrittura** dei dati che vuoi vedere in FitMesh. [FONTE: guida ufficiale del produttore]
4. Fai una sincronizzazione nell'app del produttore, poi apri FitMesh e tocca **Sincronizza ora**.

**Su iPhone (tramite Salute)** – Garmin Connect, Oura, Polar Flow, Zepp, Withings, RingConn, Xiaomi Mi Fitness.
1. Apri l'app del produttore. [FONTE: guida ufficiale del produttore]
2. Vai nelle **impostazioni** e cerca **Apple Salute** / **Salute** (vedi la tabella sotto). [FONTE: guida ufficiale del produttore]
3. Attiva la condivisione con Salute; iOS ti chiederà quali dati l'app può scrivere: attiva quelli che vuoi vedere. [FONTE: guida ufficiale del produttore]
4. Fai una sincronizzazione nell'app del produttore, poi apri FitMesh e tocca **Sincronizza ora**.

**FitMesh legge questi dati da Health Connect o Apple Salute, non direttamente dall'app del produttore.**

| Brand | Android (Health Connect) | iPhone (Salute) | Fonte ufficiale |
|---|---|---|---|
| Samsung Health | controlla nelle impostazioni dell'app del produttore la condivisione con Health Connect. Se i dati hanno smesso di sincronizzarsi dopo l'aggiornamento a Samsung Health 7.0: apri Samsung Health > tre puntini > Impostazioni > Privacy e attiva il consenso al trattamento dei dati di salute e benessere [NOMI MENU IT DA SCHERMATE MATTEO]. | – (Samsung Health non esiste su iPhone) | Consenso 7.0: https://www.samsung.com/us/support/troubleshoot/TSG10013213/ (pagina in inglese) · percorso Health Connect: [IN VERIFICA SU TELEFONO SAMSUNG — JARVIS] |
| Garmin Connect | controlla nelle impostazioni dell'app del produttore la condivisione con Health Connect | controlla nelle impostazioni dell'app del produttore la condivisione con Apple Salute | [PERCORSO IN VERIFICA SU DISPOSITIVO — JARVIS] |
| Oura | Menu in alto a sinistra > Settings > Data Sharing > Health Connect (Gen2; Gen3 o successivi con abbonamento attivo) | Menu in alto a sinistra > Settings > Data sharing > Apple Health > Connect to Health | Android: https://support.ouraring.com/hc/en-us/articles/10786105824531-Health-Connect-by-Android-Integration · iPhone: https://support.ouraring.com/hc/en-us/articles/360025438734-Apple-Health-Integration |
| Zepp (Amazfit) | controlla nelle impostazioni dell'app del produttore la condivisione con Health Connect | controlla nelle impostazioni dell'app del produttore la condivisione con Apple Salute | – |
| Fitbit (ora Google Health app) | Google Health app > Connections > Partner apps > Set up > Accept > dati > Continue > Allow | [DA VERIFICARE JARVIS] | Android: https://support.google.com/fitbit/answer/14506680?hl=en |
| Polar Flow | Flow app > General settings > Health Connect > dati > Allow | Polar Flow > More > General settings > Apple Health > categorie > Allow (battito continuo non sincronizzato) | Android: https://support.polar.com/en/flow-app-health-connect · iPhone: https://support.polar.com/en/support/connecting_polar_flow_with_apple_health |
| Withings | Profile > Settings > Export health data to Health Connect > Next > Edit Permissions > Withings > dati > Allow > Done | Profile > Settings > Export health data to Apple Health > Next > Next > dati > Allow > Done | Android: https://support.withings.com/hc/en-us/articles/27322856325905-Partner-Apps-Health-Connect-Exporting-Withings-data-into-Health-Connect · iPhone: https://support.withings.com/hc/en-us/articles/46746224229777-Partner-Apps-Apple-Health-Exporting-Withings-data-into-Apple-Health |
| RingConn | controlla nelle impostazioni dell'app del produttore la condivisione con Health Connect. RingConn dichiara di non inviare l'HRV a Health Connect. | controlla nelle impostazioni dell'app del produttore la condivisione con Apple Salute | – |
| Xiaomi Mi Fitness | Profile > Settings > Sync with the cloud; poi Profile > Third-party data > Health > dati [DA VERIFICARE JARVIS: la FAQ non nomina Health Connect] | Profile > Third-party data > Health > dati | Android: https://www.mi.com/uk/support/faq/details/KA-230357/ · iPhone: https://www.mi.com/global/support/faq/details/KA-243012/ |
| Ultrahuman | controlla nelle impostazioni dell'app del produttore la condivisione con Health Connect | controlla nelle impostazioni dell'app del produttore la condivisione con Apple Salute | – |
| Wahoo | controlla nelle impostazioni dell'app del produttore la condivisione con Health Connect | controlla nelle impostazioni dell'app del produttore la condivisione con Apple Salute | – |

Le voci di menu dei produttori sono riportate in inglese, come nelle guide ufficiali; le etichette italiane vanno confermate sul dispositivo [DA VERIFICARE JARVIS].

Nota: i passaggi nelle app dei produttori **non hanno screenshot nostri**. Ogni percorso va citato dalla guida ufficiale del produttore (colonna «Fonte ufficiale»); i passi generici sopra non vanno illustrati con schermate di app di terzi.

**Domande frequenti (FAQPage)**
- **D: Ho attivato la condivisione ma FitMesh non vede ancora dati. Perché?**
  R: Controlla che anche FitMesh abbia il permesso di leggere: [Health Connect](./health-connect-permessi) · [Salute su iPhone](./apple-salute-permessi). Alcune app scrivono i dati solo dopo la propria sincronizzazione: aprila e aspetta che finisca.
- **D: Vedo alcuni dati ma ne manca uno, per esempio l'HRV o le fasi del sonno. Perché?**
  R: Non tutte le app dei produttori condividono tutti i tipi di dato. Se manca solo una metrica, dipende da cosa condivide l'app del produttore: controlla nella sua guida ufficiale quali dati invia.
- **D: Perché non vedo lo storico dei mesi scorsi?**
  R: L'app del produttore può condividere solo i dati registrati dopo che hai attivato la condivisione.
- **D: Uso Samsung Health e i dati non arrivano più dopo l'aggiornamento: cosa faccio?**
  R: Dalla versione 7.0 Samsung Health sincronizza i dati solo se hai dato il consenso al trattamento dei dati di salute e benessere. Apri Samsung Health > tre puntini > Impostazioni > Privacy e attiva il consenso [NOMI MENU IT DA SCHERMATE MATTEO]. Fonte: guida Samsung (https://www.samsung.com/us/support/troubleshoot/TSG10013213/).
- **D: Ho seguito tutti i passaggi e non vedo ancora nulla. Cosa faccio?**
  R: Scrivici dal supporto indicando brand e modello del dispositivo.

**Torna all'app:** [Apri FitMesh]

### EN
**Title:** Your device's app isn't sharing data yet
**Meta (≤155):** Your watch or ring is recording but FitMesh shows no data? Turn on sharing with Health Connect or Apple Health in the manufacturer's app.
**Intro:** FitMesh doesn't read directly from your watch or ring: it reads from Health Connect (Android) or Apple Health (iPhone). The manufacturer's app needs to write your data there, and this option is often off until you turn it on. Your device is working: only this link is missing.

**On Android (via Health Connect)** – Samsung Health, Garmin Connect, Oura, Zepp (Amazfit), Fitbit (now Google Health app), Polar Flow, Withings, RingConn, Xiaomi Mi Fitness, Ultrahuman, Wahoo.
1. Open the manufacturer's app. [FONTE: guida ufficiale del produttore]
2. Go to the app's **settings** and look for **Health Connect** (the exact path differs by brand: see the table below). [FONTE: guida ufficiale del produttore]
3. Turn on sharing with Health Connect and allow it to **write** the data you want to see in FitMesh. [FONTE: guida ufficiale del produttore]
4. Sync in the manufacturer's app, then open FitMesh and tap **Sync now**.

**On iPhone (via Apple Health)** – Garmin Connect, Oura, Polar Flow, Zepp, Withings, RingConn, Xiaomi Mi Fitness.
1. Open the manufacturer's app. [FONTE: guida ufficiale del produttore]
2. Go to **settings** and look for **Apple Health** / **Health** (see the table below). [FONTE: guida ufficiale del produttore]
3. Turn on sharing with Health; iOS will ask which data the app may write: turn on what you want to see. [FONTE: guida ufficiale del produttore]
4. Sync in the manufacturer's app, then open FitMesh and tap **Sync now**.

**FitMesh reads this data from Health Connect or Apple Health, not directly from the manufacturer's app.**

| Brand | Android (Health Connect) | iPhone (Apple Health) | Official source |
|---|---|---|---|
| Samsung Health | check the sharing with Health Connect in the manufacturer's app settings. If your data stopped syncing after the Samsung Health 7.0 update: open Samsung Health > three dots > Settings > Privacy and turn on consent to process health and wellness data. | – (Samsung Health isn't available on iPhone) | 7.0 consent: https://www.samsung.com/us/support/troubleshoot/TSG10013213/ · Health Connect path: [BEING CHECKED ON A SAMSUNG PHONE — JARVIS] |
| Garmin Connect | check the sharing with Health Connect in the manufacturer's app settings | check the sharing with Apple Health in the manufacturer's app settings | [PATH BEING CHECKED ON DEVICE — JARVIS] |
| Oura | Top-left menu > Settings > Data Sharing > Health Connect (Gen2; Gen3 or later with an active membership) | Top-left menu > Settings > Data sharing > Apple Health > Connect to Health | Android: https://support.ouraring.com/hc/en-us/articles/10786105824531-Health-Connect-by-Android-Integration · iPhone: https://support.ouraring.com/hc/en-us/articles/360025438734-Apple-Health-Integration |
| Zepp (Amazfit) | check the sharing with Health Connect in the manufacturer's app settings | check the sharing with Apple Health in the manufacturer's app settings | – |
| Fitbit (now Google Health app) | Google Health app > Connections > Partner apps > Set up > Accept > data > Continue > Allow | [DA VERIFICARE JARVIS] | Android: https://support.google.com/fitbit/answer/14506680?hl=en |
| Polar Flow | Flow app > General settings > Health Connect > data > Allow | Polar Flow > More > General settings > Apple Health > categories > Allow (continuous heart rate not synced) | Android: https://support.polar.com/en/flow-app-health-connect · iPhone: https://support.polar.com/en/support/connecting_polar_flow_with_apple_health |
| Withings | Profile > Settings > Export health data to Health Connect > Next > Edit Permissions > Withings > data > Allow > Done | Profile > Settings > Export health data to Apple Health > Next > Next > data > Allow > Done | Android: https://support.withings.com/hc/en-us/articles/27322856325905-Partner-Apps-Health-Connect-Exporting-Withings-data-into-Health-Connect · iPhone: https://support.withings.com/hc/en-us/articles/46746224229777-Partner-Apps-Apple-Health-Exporting-Withings-data-into-Apple-Health |
| RingConn | check the sharing with Health Connect in the manufacturer's app settings. RingConn states it doesn't send HRV to Health Connect. | check the sharing with Apple Health in the manufacturer's app settings | – |
| Xiaomi Mi Fitness | Profile > Settings > Sync with the cloud; then Profile > Third-party data > Health > data [DA VERIFICARE JARVIS: the FAQ doesn't name Health Connect] | Profile > Third-party data > Health > data | Android: https://www.mi.com/uk/support/faq/details/KA-230357/ · iPhone: https://www.mi.com/global/support/faq/details/KA-243012/ |
| Ultrahuman | check the sharing with Health Connect in the manufacturer's app settings | check the sharing with Apple Health in the manufacturer's app settings | – |
| Wahoo | check the sharing with Health Connect in the manufacturer's app settings | check the sharing with Apple Health in the manufacturer's app settings | – |

Manufacturer steps have no screenshots of ours: cite the official guide.

**Frequently asked questions (FAQPage)**
- **Q: I turned on sharing but FitMesh still shows no data. Why?**
  A: Check that FitMesh can read too: [Health Connect](./health-connect-permissions) · [Health on iPhone](./apple-health-permissions). Some apps write data only after their own sync: open the app and let it finish.
- **Q: I see some data but one metric is missing, such as HRV or sleep stages. Why?**
  A: Not every manufacturer app shares every data type. If only one metric is missing, it depends on what the manufacturer's app shares: check its official guide for which data it sends.
- **Q: Why can't I see my history from previous months?**
  A: The manufacturer's app may only share data recorded after you turned sharing on.
- **Q: I use Samsung Health and my data stopped arriving after the update. What should I do?**
  A: Since version 7.0, Samsung Health only syncs data if you've given consent to process health and wellness data. Open Samsung Health > three dots > Settings > Privacy and turn on the consent. Source: Samsung guide (https://www.samsung.com/us/support/troubleshoot/TSG10013213/).
- **Q: I've followed every step and still see nothing. What should I do?**
  A: Contact support with your device's brand and model.

**Back to the app:** [Open FitMesh]

## Changelog
- v5 (10/10/2026, 18:30): riga in testa alla tabella brand IT/EN «FitMesh legge questi dati da Health Connect o Apple Salute, non direttamente dall'app del produttore» (Oura, Polar, Withings, Fitbit solo tramite HC/Salute); Samsung: frase generica mantenuta + riga consenso Samsung Health 7.0 con link ufficiale https://www.samsung.com/us/support/troubleshoot/TSG10013213/, etichette IT [NOMI MENU IT DA SCHERMATE MATTEO], nuova FAQ IT/EN basata solo su quella pagina, percorso Health Connect ancora assente (verifica Jarvis); Apple Salute: tolto [DA VERIFICARE RIRI] (confermato da Riri), «non condivide» → «non permette di leggere i dati» (EN adeguato). Backup v4: `guide-primo-sync-it-en.v4.bak.md`.
- v4 (10/10/2026, 18:20): applicate le fonti ufficiali di Jarvis (`jarvis-fonti-ufficiali-produttori.md`). Health Connect Android 14+: aggiunto «Controlli della privacy» (EN «Privacy controls»); Android ≤13: Impostazioni > App > Tutte le app > Health Connect > Apri; sezione «Dati e accesso» sostituita con EN «Permissions and data» / IT [DA CONFERMARE SU TELEFONO — Jarvis]; Apple Salute: aggiunto il passaggio «Riepilogo» (Summary); Fitbit → «Fitbit (ora Google Health app)»; tabella brand compilata anche in EN con URL ufficiali per Oura, Fitbit (Android), Polar, Withings, Xiaomi, Google e Apple; Samsung (consenso dati salute e benessere 7.0), RingConn (niente HRV a Health Connect), Zepp/Amazfit, Ultrahuman, Wahoo e Garmin (in verifica su dispositivo) solo con frase generica, senza passo passo e fuori dalle risposte FAQPage. Nessun percorso inventato.
- v3 (10/10/2026, 18:02): sostituito [TEMPO MEDIANO PRIMO SYNC — DATO RIRI] con la frase approvata (fonte `tempo-primo-sync.md`), adattata per guida: la guida iPhone omette la parte su Android.
- v2 (10/10/2026, 18:01): tolto il segnaposto «15 minuti», sostituito con [TEMPO MEDIANO PRIMO SYNC — DATO RIRI] per Android e iPhone; sezioni «Ancora nessun dato?» riscritte come domande e risposte per FAQPage; aggiunti slug EN `/en/support/first-sync/…` (IT invariati); colonna «Fonte ufficiale» nella tabella brand; passi nelle app dei produttori senza screenshot, citati dalle guide ufficiali.
- v1 (10/10/2026, 18:00): prima stesura.
