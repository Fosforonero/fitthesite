# Truth Ledger — P0.27 Verità Editoriale (`guida-sync-wearable-2026`, `colmi-ring-fitmesh`, `huawei-health-health-connect-sincronizzazione`)

**Sprint**: MICRO-GATE P0.27-A-B  
**Data verifica**: 2026-09-25  
**Stato PR #86**: STRICT STOP prima del merge  

---

## 1. Elenco Brand con Supporto Health Connect su Android

Fonti primarie, piattaforma e prerequisiti documentati per i brand citati nella guida:

| Brand | Piattaforma | Supporto Health Connect | Prerequisiti documentati | Fonte primaria / Riferimento ufficiale |
|---|---|---|---|---|
| **Samsung** | Android | Scrittura e lettura | App Samsung Health installata; account Samsung; attivazione in Impostazioni → Health Connect. Watch scrive su app telefono, app telefono scrive su Health Connect. | [Samsung Developers — Health Connect FAQ](https://developer.samsung.com/health/health-connect-faq.html) / [Accessing Samsung Health Data](https://developer.samsung.com/health/blog/en/accessing-samsung-health-data-through-health-connect) |
| **Fitbit (Google Health)** | Android | Scrittura e lettura | App Fitbit (Google Health) per Android; account Google; attivazione in Impostazioni account → Health Connect. | [Google Help / Fitbit — Connect Fitbit with Health Connect](https://support.google.com/fitbit/answer/13028245) |
| **Garmin** | Android | Scrittura e lettura | App Garmin Connect per Android (v4.65+); account Garmin Connect; attivazione in Impostazioni → App collegate → Health Connect. | [Garmin Support — Garmin Connect App: Health Connect Integration](https://support.garmin.com/en-US/?faq=lzpXb07uEw2kXv1A5pC5H8) |
| **Polar** | Android | Scrittura (e lettura limitata) | App Polar Flow per Android (v6.10+); account Polar Flow; attivazione in Impostazioni generali → Connessioni → Health Connect. | [Polar Support — Health Connect integration in Polar Flow app](https://support.polar.com/en/health-connect-polar-flow) |
| **Withings** | Android | Scrittura e lettura | App Withings (Withings Health Mate) per Android; account Withings; attivazione in Profilo → Health Connect. | [Withings Support — Withings App and Health Connect](https://support.withings.com/hc/en-us/articles/9355799732753-Withings-App-Health-Connect) |
| **Oura** | Android | Scrittura (sonno, FC a riposo, HRV, passi, calorie, SpO2) | App Oura per Android; anello accoppiato; attivazione in Impostazioni → Health Connect. **Prerequisiti di account/modello**: Oura Ring Gen2 non richiede abbonamento; Oura Ring Gen3 e Oura Ring 4 richiedono membership attiva per sincronizzare e visualizzare i dati nell'app. FitMesh legge i dati tramite Health Connect (nessuna integrazione diretta FitMesh con l'API Oura). | [Oura Help Center — How to Use Health Connect with Oura Ring](https://support.ouraring.com/hc/en-us/articles/10452668388499-Health-Connect-by-Android) |
| **Huawei** | Android / HMS | **Nessun percorso ufficiale documentato** | Nessun percorso ufficiale Huawei Health → Health Connect documentato nel ledger di compatibilità né da documentazione ufficiale Huawei per Health Connect; integrazione diretta FitMesh non disponibile; eventuali app bridge di terze parti o export manuali da valutare caso per caso. | Compatibilità ledger FitMesh; assenza di documentazione ufficiale Huawei Health Connect |

---

## 2. Tabella Claim → Fonte → Formulazione Finale

| Claim originale / Ambiguo | Fonte / Evidenza | Formulazione finale verificata |
|---|---|---|
| *"Huawei Health non supporta la scrittura diretta su Health Connect"* (assoluto categorico) | Assenza di documentazione ufficiale Huawei verso Health Connect nel compatibility ledger e nelle guide sviluppatori | *"Nel ledger di compatibilità non è documentato alcun percorso ufficiale tra Huawei Health e Health Connect. Inoltre, FitMesh non dispone di un'integrazione diretta con i servizi Huawei."* |
| *"L'unica soluzione conosciuta finora è un'app bridge..."* / *"L'unico modo per trasferire i dati..."* | Esistenza sia di tool di bridging terzi sia di procedure di esportazione dati manuale | *"Per trasferire i dati è necessario valutare caso per caso eventuali app bridge di terze parti o procedure di esportazione manuale, con le relative limitazioni di permessi e affidabilità."* |
| *"I primi 1.000 account... hanno ottenuto il Pro a vita"* | Regola storica SSOT (`lib/founder/historical-note.ts`), priva di verifica sul numero esatto di riscatti effettivi | *"FitMesh Sync è disponibile per Android e iOS. L'idoneità Founder era riservata a un massimo di 1.000 account registrati entro il 31 luglio 2026 con prima sincronizzazione reale entro 14 giorni dalla registrazione."* |
| *"Evita i conflitti di configurazione più comuni"* (guida sync) | Nessuna evidenza o metrica che garantisca l'assoluta eliminazione di conflitti utente | Rimosso il claim; rimando neutrale alla matrice completa delle compatibilità su `/fitness-data-sync`. |
| Tabella comparativa Huawei: *"Supporto nativo FitMesh: Pianificato / Sì"* | FitMesh non ha integrazioni Huawei dirette in produzione né API proprietarie attive | Intestazione: *"Integrazione diretta FitMesh"* — Valori: *"Non supportata direttamente"*. |
| Oura Ring trattato genericamente come *"richiede abbonamento"* o associato a FitMesh via API diretta | Policy Oura: Gen2 free lifetime, Gen3/Ring 4 membership; FitMesh legge via Health Connect su Android | *"Oura Ring (Gen2 senza abbonamento; Gen3 e Ring 4 con membership attiva)"*; precisato che l'API Cloud v2 è esterna e non integrata direttamente in FitMesh. |

---

## 3. Stato Piattaforme Web / Browser per la Fase 2

- **Oura on the Web**: Portale web per la visualizzazione dei dati attivo oggi, con chiusura definitiva della dashboard annunciata da Oura per il 5 ottobre 2026. L'export documentato dei dati dell'account resta disponibile tramite il portale Oura (Membership Hub / portale account per il download dell'archivio storico).
- **FitMesh**: Architettura locale on-device (Health Connect su Android, Apple Health su iOS). Nessun backend centralizzato di aggregazione né bridge proprietario cloud attivo per Huawei o Oura.
- **Health Sync**: Piattaforma di sincronizzazione terza cloud/device specializzata; classificata secondo la documentazione ufficiale del proprio sviluppatore (App ID, gestione token e percorsi supportati dichiarati).
