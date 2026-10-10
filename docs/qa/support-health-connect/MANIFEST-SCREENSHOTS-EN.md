# Manifest Screenshot Tecnico Privato - Guida Android Health Connect (English Screenshots)

**Ambiente di conservazione**: Privato interno (non distribuito in `public/`)  
**Data acquisizione**: 2026-10-10  
**Ambiente di acquisizione**: Emulatore Android ufficiale locale (`emulator-5554`)  
**Hardware simulato**: Google Pixel 6  
**Risoluzione display**: 1080 x 2400 px  
**Sistema Operativo**: Android 14 (API level 34, `UPSIDE_DOWN_CAKE`, arch arm64-v8a)  
**Locale di sistema**: `en-US` (`persist.sys.locale=en-US`)  
**Controller di sistema Health Connect**: `com.google.android.healthconnect.controller` v`14-10541443`  
**Applicazione testata**: FitMesh Sync v3.9.9+190 (`com.fitmeshsync.app`, APK release 190)  
**Account test**: `qa-demo@internal.invalid` (fixture QA sintetica, nessun dato personale reale)

---

## Matrice di Verifica Schermate Inglesi

| N. | Passaggio / File WebP | Stato di Verifica a Runtime | Note Tecniche |
|---|---|---|---|
| 01 | `en-01-settings-health-connect.webp` | **VERIFICATO** | Schermata Impostazioni Android 14 (*Security & privacy > Privacy > Health Connect*) |
| 02 | `en-02-health-connect-app-permissions.webp` | **VERIFICATO** | Schermata Health Connect (*App permissions*) |
| 03 | `en-03-health-connect-data-categories.webp` | **VERIFICATO** | Schermata autentica Health Connect (*Browse data / Categories*) con stato «No data» per tutte le categorie prima del collegamento sorgente |
| 04 | `en-04-health-connect-fitmesh-app.webp` | **VERIFICATO** | Schermata Health Connect con FitMesh Sync sotto la sezione «Not allowed access» |
| 05 | `en-05-fitmesh-read-permissions.webp` | **VERIFICATO** | Schermata permessi FitMesh Sync in Health Connect con «Allow all» e permessi di lettura attivi sotto «Allowed to read» |
| 06 | `en-06-dashboard-sync-now.webp` | **VERIFICATO (stato demo/configurazione)** | Dashboard FitMesh Sync con card Synchronization («Setup required», pulsante attivo «Sync now» e pulsante «Diagnostics»). I dati mostrati (7,450 passi) provengono dalla fixture sintetica demo dell'account QA locale |
| 07 | `en-07-sync-center-diagnostics.webp` | **VERIFICATO (stato configurazione iniziale)** | Schermata Sync Center: «Never synced» e «No source · tap to enable» per ciascuna metrica riflettono lo stato iniziale noto all'app (nessuna lettura valida registrata da Health Connect) |
| 08 | `en-08-battery-settings-background.webp` | **VERIFICATO** | Impostazioni Android (*App battery usage*) per FitMesh Sync con l'opzione «Unrestricted» selezionata |

---

## Tabella Asset WebP (Distribuiti in `public/support/health-connect/`)

Tutti gli asset WebP sono compressi con `cwebp -q 85` a partire dagli screenshot raw 1080x2400.

| N. | File WebP | Dimensioni | Peso | SHA-256 |
|---|---|---|---|---|
| 01 | `en-01-settings-health-connect.webp` | 1080x2400 | 76.312 byte | `27c794ddb1288c7616504531202dc4d3206dc6586c69307c769f8e43a89785af` |
| 02 | `en-02-health-connect-app-permissions.webp` | 1080x2400 | 44.520 byte | `856a6974ce687621295de3a6ec9f7190c8db1524bf5005e3db1a949ab250c296` |
| 03 | `en-03-health-connect-data-categories.webp` | 1080x2400 | 27.556 byte | `71eec946ec960947b434bc3ad86891333e791ae38924c4e29057c98d01e25009` |
| 04 | `en-04-health-connect-fitmesh-app.webp` | 1080x2400 | 56.058 byte | `8ac0acc327e79b395bf50ff8f66eb26f827bbbd9b53b7e01c304d7020c5c6498` |
| 05 | `en-05-fitmesh-read-permissions.webp` | 1080x2400 | 51.862 byte | `369c99310f8cf04096783ca86c6da79a7c124ec2e61b0b332441df07e545e2bc` |
| 06 | `en-06-dashboard-sync-now.webp` | 1080x2400 | 70.634 byte | `a23b5595be9b19d71d2857dce8946fbbcdde53729cfc386e861e097b25eeced4` |
| 07 | `en-07-sync-center-diagnostics.webp` | 1080x2400 | 87.360 byte | `598d43eb1e51faecf284ed5109c096787251617a97a0b0d9e16388787b22bdc2` |
| 08 | `en-08-battery-settings-background.webp` | 1080x2400 | 79.318 byte | `cf1924a3191411e6ac2bd30460ee2c13a8243214eacb50f1c2916a396ba44caa` |

---

## Tabella Originali PNG Raw (Archivio Privato `docs/qa/support-health-connect/raw-en/`)

| N. | File PNG Raw | Dimensioni | Peso | SHA-256 |
|---|---|---|---|---|
| 01 | `01-settings-health-connect.png` | 1080x2400 | 168.658 byte | `517e5c319d18a28ddb90e5beda5dfd5454244430758c0a4bbf242a1987641100` |
| 02 | `02-health-connect-app-permissions.png` | 1080x2400 | 109.328 byte | `29d2a3b9c543249989ef4ca7ec7488c088554c07cb65e8da657c1d96579152d4` |
| 03 | `03-health-connect-data-categories.png` | 1080x2400 | 96.127 byte | `f0a545249a70a759748a973d500c3f642a0b2537025572b5756e4880cb154ec1` |
| 04 | `04-health-connect-fitmesh-app.png` | 1080x2400 | 155.119 byte | `b2eeec82e79ffc5b18fc3878a9fa5fa9a34882b1309dcd74c454934d558738d3` |
| 05 | `05-fitmesh-read-permissions.png` | 1080x2400 | 159.434 byte | `c9cd213aa5fc6a984bd493708c7e0a35170af028f79323b04aa9c838250413bb` |
| 06 | `06-dashboard-sync-now.png` | 1080x2400 | 207.141 byte | `88406930eff475668015f7d78dcee315d6563379f472ade8476809dcffd35658` |
| 07 | `07-sync-center-diagnostics.png` | 1080x2400 | 207.529 byte | `0e729f9e70e5bac9d5940a78c42e30a890b9c13a91a3d938c0f6dc41a3873bfa` |
| 08 | `08-battery-settings-background.png` | 1080x2400 | 213.022 byte | `43baf55289ee0280c50e3895506b34b3f75b8e089f6371088647ad390918cd27` |
