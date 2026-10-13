# Manifest Screenshot Tecnico Privato — Guida Android Connessione Salute (Health Connect)

**Ambiente di conservazione**: Privato interno (non distribuito in `public/`)  
**Data acquisizione**: 2026-10-09  
**Ambiente di acquisizione**: Emulatore Android ufficiale locale (`emulator-5554`)  
**Hardware simulato**: Google Pixel 6  
**Risoluzione display**: 1080 x 2400 px  
**Sistema Operativo**: Android 14 (API level 34, `UPSIDE_DOWN_CAKE`, arch arm64-v8a)  
**Controller di sistema Health Connect**: `com.google.android.healthconnect.controller` v`14-10541443`  
**Applicazione testata**: FitMesh Sync v3.9.9+190 (`com.fitmeshsync.app`, APK release 190)  
**Account test**: `qa-demo@internal.invalid` (fixture QA sintetica, nessun dato personale reale)

---

## Matrice di Verifica Schermate

| N. | Passaggio / File WebP | Stato di Verifica a Runtime | Note Tecniche |
|---|---|---|---|
| 01 | `01-impostazioni-connessione-salute.webp` | **VERIFICATO** | Schermata Impostazioni Android 14 (*Sicurezza e privacy > Privacy > Connessione Salute*) |
| 02 | `02-connessione-salute-autorizzazioni-app.webp` | **VERIFICATO** | Schermata Connessione Salute (*Autorizzazioni app*) |
| 03 | `03-connessione-salute-categorie-dati.webp` | **NON VERIFICATO a runtime** | Schermata autentica Connessione Salute (*Sfoglia i dati / Categorie*) che illustra l'assenza di dati prima del collegamento. I permessi di scrittura e le metriche scritte dipendono dall'applicazione del singolo produttore (Samsung Health, Garmin Connect, Zepp, Withings, Oura) e richiedono un dispositivo fisico e account di terze parti non configurabili su questo banco. |
| 04 | `04-elenco-app-fitmesh.webp` | **VERIFICATO** | Schermata Connessione Salute con FitMesh Sync sotto "Accesso non consentito" |
| 05 | `05-permessi-lettura-fitmesh.webp` | **VERIFICATO** | Schermata FitMesh Sync in Connessione Salute con autorizzazioni di lettura attive |
| 06 | `06-dashboard-sincronizza-ora.webp` | **VERIFICATO (stato demo/configurazione)** | Dashboard FitMesh Sync con avviso "Nessun wearable rilevato". I numeri visibili (es. 7.450 passi) provengono dal seed demo dell'account sintetico e NON da importazione Health Connect. |
| 07 | `07-centro-sincronizzazione-diagnostica.webp` | **VERIFICATO (stato configurazione incompleta)** | Centro Sincronizzazione: "Mai sincronizzato" e "Nessuna sorgente" indicano configurazione iniziale incompleta (nessun dato presente in Health Connect), non esito positivo. |
| 08 | `08-impostazioni-batteria-background.webp` | **VERIFICATO** | Impostazioni Android (*Utilizzo della batteria per l'app > Senza limitazioni*) |

---

## Tabella Asset WebP (Distribuiti in `public/support/health-connect/`)

Tutti gli asset WebP sono compressi con `cwebp -q 85` a partire dagli screenshot raw 1080x2400.

| N. | File WebP | Dimensioni | Peso | SHA-256 |
|---|---|---|---|---|
| 01 | `01-impostazioni-connessione-salute.webp` | 1080x2400 | 88.104 byte | `2d31de70fd1220751465d566f14f2fb7cf0489c6e0e0f1612cdaa347475ede7d` |
| 02 | `02-connessione-salute-autorizzazioni-app.webp` | 1080x2400 | 50.330 byte | `f0f742ff2c14d6517196c81bb3b4e66dce0668fd216c2474a9df699cd43fccbd` |
| 03 | `03-connessione-salute-categorie-dati.webp` | 1080x2400 | 32.438 byte | `f08d77d4977b0c1b703b59c62379dc0c097cf94c56fc5a4bf5abe81fc4309c57` |
| 04 | `04-elenco-app-fitmesh.webp` | 1080x2400 | 64.794 byte | `87666e6420a6d0522213b1b393ab1833a02a5c93c478272d82a993f5abaddef7` |
| 05 | `05-permessi-lettura-fitmesh.webp` | 1080x2400 | 60.558 byte | `f142eb0e1651f4b83c880dd960921065f5620b756b62c2cd99c708cdf64d472c` |
| 06 | `06-dashboard-sincronizza-ora.webp` | 1080x2400 | 73.522 byte | `ff6ebf71e9091a7b8e60502db712a13b0bc68019b2ebb6cd7811ef670a1b96b8` |
| 07 | `07-centro-sincronizzazione-diagnostica.webp` | 1080x2400 | 107.796 byte | `18b59add4eafd4dd1b90aaee5f8c009f5feffbcf704214b5d17d5be5642facdc` |
| 08 | `08-impostazioni-batteria-background.webp` | 1080x2400 | 86.308 byte | `08fed207fd9fb4463d62c90e323b55fd5ad8889f421a1f12105b22d9704ec0aa` |

---

## Tabella Originali PNG Raw (Archivio Privato `docs/qa/support-health-connect/raw/`)

| N. | File PNG Raw | Dimensioni | Peso | SHA-256 |
|---|---|---|---|---|
| 01 | `01-impostazioni-connessione-salute.png` | 1080x2400 | 169.551 byte | `47006cccecc7879e4c97d3fd348214e2b4d0516707c2eb96b66fab01aeaf8b50` |
| 02 | `02-connessione-salute-autorizzazioni-app.png` | 1080x2400 | 121.789 byte | `f2c87cd55347024a9752289510126d266d00cb851dca4ddc658b5555edbb68b4` |
| 03 | `03-connessione-salute-categorie-dati.png` | 1080x2400 | 107.905 byte | `e67d6f3a24564ad2173356cbe511e24960ab19384b522b4debf389070f0f25c6` |
| 04 | `04-elenco-app-fitmesh.png` | 1080x2400 | 164.932 byte | `ed89a0e470b488ef63326996141a67aa0b36ccb1d77575100f75c94168d48b14` |
| 05 | `05-permessi-lettura-fitmesh.png` | 1080x2400 | 172.853 byte | `b9759bc080de9b50848b25ba907d6e3e9bbafba63aac63a0c606af8423aa010c` |
| 06 | `06-dashboard-sincronizza-ora.png` | 1080x2400 | 209.621 byte | `74d1755f3fceb1aa5fb4e94a0f0785f2e907ee135372214ad8af0a33340baa8d` |
| 07 | `07-centro-sincronizzazione-diagnostica.png` | 1080x2400 | 232.802 byte | `a45738bbee19c43eee5f5041c2e8eb56246637dd3d1fd12f386b7989dcb5bc4c` |
| 08 | `08-impostazioni-batteria-background.png` | 1080x2400 | 212.823 byte | `4055b670e3aa542413396a7a45df77d762579a30a9ceccc7722a49322b42650c` |
