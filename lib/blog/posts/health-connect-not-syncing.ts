import type { BlogPost } from "../types";

export const post: BlogPost = {
  slug: "health-connect-not-syncing",
  category: "guides",
  publishedAt: "2026-05-30",
  updatedAt: "2026-05-30",
  readMinutes: 8,
  primaryKeyword: {
    it: "health connect non si sincronizza",
    en: "health connect not syncing",
  },
  secondaryKeywords: {
    it: [
      "health connect non funziona",
      "health connect dati mancanti",
      "samsung health non aggiorna health connect",
      "passi non sincronizzati health connect",
      "come risolvere health connect",
    ],
    en: [
      "health connect not working",
      "health connect missing data",
      "samsung health not syncing to health connect",
      "steps not showing in health connect",
      "health connect sync fix 2026",
      "google health connect troubleshooting",
    ],
  },
  metaDescription: {
    it: "Health Connect non si sincronizza? Ecco 7 soluzioni verificate: permessi, ottimizzazione batteria, cache, impostazioni Samsung Health. Guida completa 2026.",
    en: "Health Connect not syncing? Here are 7 verified fixes: permissions, battery optimization, cache, Samsung Health settings. Complete troubleshooting guide 2026.",
  },
  hero: {
    kicker: { it: "Risoluzione problemi", en: "Troubleshooting" },
    title: {
      it: "Health Connect non si sincronizza: 7 soluzioni che funzionano (2026)",
      en: "Health Connect not syncing: 7 fixes that work (2026)",
    },
    subtitle: {
      it: "Passi che spariscono, dati di sonno mancanti, frequenza cardiaca che non si aggiorna. Ecco come diagnosticare e risolvere i problemi più comuni di Health Connect.",
      en: "Disappearing steps, missing sleep data, heart rate not updating. Here's how to diagnose and fix the most common Health Connect problems.",
    },
  },
  body: [
    {
      type: "paragraph",
      text: {
        it: "Health Connect è la piattaforma salute di Google che unifica i dati di wearable e app fitness su Android. Quando funziona è invisibile — i dati fluiscono automaticamente. Quando non funziona, è frustrante perché il problema può stare in tre punti diversi: l'app che scrive i dati, Health Connect stesso, o l'app che li legge. Questa guida segue l'ordine giusto per trovare il colpevole.",
        en: "Health Connect is Google's health platform that unifies data from wearables and fitness apps on Android. When it works, it's invisible — data flows automatically. When it doesn't, it's frustrating because the problem can sit in three different places: the app writing data, Health Connect itself, or the app reading it. This guide follows the right order to find the culprit.",
      },
    },
    {
      type: "heading",
      level: 2,
      text: {
        it: "Prima cosa: identifica il sintomo esatto",
        en: "First: identify the exact symptom",
      },
    },
    {
      type: "list",
      items: {
        it: [
          "**Dati mai presenti**: l'app di lettura non ha mai ricevuto dati da Health Connect. Problema: permessi o source app non connessa.",
          "**Dati presenti ma in ritardo (ore/giorni)**: sync non in tempo reale. Problema: ottimizzazione batteria, background sync disabilitato.",
          "**Dati parziali**: alcune metriche sì, altre no. Problema: permessi granulari mancanti per specifici tipi di dati.",
          "**Dati duplicati**: stessa metrica appare due volte. Problema: source multipli che scrivono lo stesso tipo (es. Garmin + Samsung Health).",
          "**Buco storico**: dati mancanti per un periodo specifico. Problema: app non connessa in quel periodo, o crash.",
        ],
        en: [
          "**Data never present**: the reading app has never received data from Health Connect. Problem: permissions or source app not connected.",
          "**Data present but delayed (hours/days)**: sync not real-time. Problem: battery optimization, background sync disabled.",
          "**Partial data**: some metrics yes, others no. Problem: granular permissions missing for specific data types.",
          "**Duplicate data**: same metric appears twice. Problem: multiple sources writing the same type (e.g. Garmin + Samsung Health).",
          "**Historical gap**: data missing for a specific period. Problem: app not connected during that period, or crash.",
        ],
      },
    },
    {
      type: "heading",
      level: 2,
      text: {
        it: "Fix 1: Controlla i permessi in Health Connect",
        en: "Fix 1: Check permissions in Health Connect",
      },
    },
    {
      type: "list",
      ordered: true,
      items: {
        it: [
          "Apri **Health Connect** (cerca nell'app drawer o cerca 'Health Connect' nelle impostazioni).",
          "Vai su **Accesso alle app e dati**.",
          "Trova l'app che non si sincronizza (es. FitMesh Sync, Garmin Connect, Samsung Health).",
          "Tap sull'app → verifica che abbia i permessi di **lettura** e **scrittura** per tutti i tipi di dati che ti aspetti (Passi, Frequenza cardiaca, Sonno, Allenamenti).",
          "Se mancano dei permessi, abilita → concedi.",
        ],
        en: [
          "Open **Health Connect** (search in app drawer or search 'Health Connect' in settings).",
          "Go to **App permissions**.",
          "Find the app that's not syncing (e.g. FitMesh Sync, Garmin Connect, Samsung Health).",
          "Tap the app → verify it has **read** and **write** permissions for all data types you expect (Steps, Heart Rate, Sleep, Workouts).",
          "If permissions are missing, enable → grant.",
        ],
      },
    },
    {
      type: "heading",
      level: 2,
      text: {
        it: "Fix 2: Disabilita l'ottimizzazione batteria per le app coinvolte",
        en: "Fix 2: Disable battery optimization for the apps involved",
      },
    },
    {
      type: "paragraph",
      text: {
        it: "L'ottimizzazione batteria di Android è il killer silenzioso del background sync. Quando Android mette in deep sleep un'app, non può né leggere né scrivere su Health Connect. Il fix: escludi dall'ottimizzazione sia l'app sorgente (Samsung Health, Garmin Connect) sia l'app di lettura.",
        en: "Android's battery optimization is the silent killer of background sync. When Android puts an app into deep sleep, it can't read or write to Health Connect. The fix: exclude both the source app (Samsung Health, Garmin Connect) and the reading app from optimization.",
      },
    },
    {
      type: "list",
      ordered: true,
      items: {
        it: [
          "**Impostazioni** → **Batteria** → **Ottimizzazione batteria** (o 'Risparmio energia' su Samsung).",
          "Cerca l'app (Samsung Health, Garmin Connect, o qualsiasi altra app coinvolta).",
          "Seleziona **Non ottimizzare** (o su Samsung: tocca il nome app → 'Senza restrizioni').",
          "Ripeti per ogni app nella catena di sync.",
        ],
        en: [
          "**Settings** → **Battery** → **Battery optimization** (or 'Power saving' on Samsung).",
          "Search for the app (Samsung Health, Garmin Connect, or any other app involved).",
          "Select **Don't optimize** (or on Samsung: tap app name → 'Unrestricted').",
          "Repeat for every app in the sync chain.",
        ],
      },
    },
    {
      type: "heading",
      level: 2,
      text: {
        it: "Fix 3: Forza la sincronizzazione dall'app sorgente",
        en: "Fix 3: Force sync from the source app",
      },
    },
    {
      type: "paragraph",
      text: {
        it: "Molte app (Samsung Health, Garmin Connect, Fitbit) non scrivono su Health Connect in tempo reale — lo fanno a intervalli o quando vengono aperte. Aprire manualmente l'app e lasciare che aggiorni i dati è spesso sufficiente.",
        en: "Many apps (Samsung Health, Garmin Connect, Fitbit) don't write to Health Connect in real-time — they do it at intervals or when opened. Manually opening the app and letting it update is often enough.",
      },
    },
    {
      type: "list",
      items: {
        it: [
          "**Samsung Health**: apri l'app, vai alla schermata principale. Scorri verso il basso per aggiornare. Poi vai in Impostazioni → Health Connect → verifica che 'Sincronizza con Health Connect' sia attivo.",
          "**Garmin Connect**: apri l'app. Garmin scrive su HC dopo ogni sync con l'orologio. Verifica che Garmin Connect → Impostazioni → Health Connect → Health Connect attivo.",
          "**Fitbit**: apri l'app → aspetta che si sincronizzi con il dispositivo. Fitbit scrive su HC dopo ogni sync riuscita.",
        ],
        en: [
          "**Samsung Health**: open the app, go to the main screen. Pull down to refresh. Then go to Settings → Health Connect → verify 'Sync with Health Connect' is enabled.",
          "**Garmin Connect**: open the app. Garmin writes to HC after each watch sync. Check Garmin Connect → Settings → Health Connect → Health Connect enabled.",
          "**Fitbit**: open the app → wait for it to sync with the device. Fitbit writes to HC after each successful sync.",
        ],
      },
    },
    {
      type: "heading",
      level: 2,
      text: {
        it: "Fix 4: Svuota la cache di Health Connect",
        en: "Fix 4: Clear Health Connect cache",
      },
    },
    {
      type: "callout",
      variant: "warning",
      title: {
        it: "Svuotare cache ≠ cancellare dati",
        en: "Clearing cache ≠ deleting data",
      },
      body: {
        it: "La cache di Health Connect sono file temporanei — svuotarla non cancella i tuoi dati salute. I dati rimangono nel database interno. Se invece cancelli 'Archiviazione' completa (non cache), i dati vengono persi. Questa guida parla solo della cache.",
        en: "Health Connect cache is temporary files — clearing it does NOT delete your health data. Data stays in the internal database. If you clear full 'Storage' (not cache), data is lost. This guide covers cache only.",
      },
    },
    {
      type: "list",
      ordered: true,
      items: {
        it: [
          "**Impostazioni** → **App** → trova **Health Connect** (potrebbe essere sotto 'Tutte le app').",
          "Tap su **Archiviazione e cache**.",
          "Tap su **Svuota cache** (non 'Cancella dati').",
          "Riapri Health Connect e lascia che reinizializzi.",
        ],
        en: [
          "**Settings** → **Apps** → find **Health Connect** (may be under 'All apps').",
          "Tap **Storage & cache**.",
          "Tap **Clear cache** (NOT 'Clear data').",
          "Reopen Health Connect and let it reinitialize.",
        ],
      },
    },
    {
      type: "heading",
      level: 2,
      text: {
        it: "Fix 5 (Samsung): connessione diretta Samsung Health → Health Connect",
        en: "Fix 5 (Samsung): direct Samsung Health → Health Connect connection",
      },
    },
    {
      type: "paragraph",
      text: {
        it: "Su dispositivi Samsung, Samsung Health ha la sua pipeline dedicata verso Health Connect — separata dal normale background sync. Se questa pipeline è rotta, il fix è disconnettere e riconnettere:",
        en: "On Samsung devices, Samsung Health has its own dedicated pipeline to Health Connect — separate from normal background sync. If this pipeline is broken, the fix is to disconnect and reconnect:",
      },
    },
    {
      type: "list",
      ordered: true,
      items: {
        it: [
          "Apri **Samsung Health** → tap i tre puntini in alto a destra → **Impostazioni**.",
          "Scorri fino a **Health Connect** → tap.",
          "Disabilita la connessione → riabilita dopo 10 secondi.",
          "Verifica che tutti i tipi di dati siano selezionati (Passi, Frequenza cardiaca, Sonno, ecc.).",
          "Torna alla schermata principale di Samsung Health e aspetta 1-2 minuti.",
        ],
        en: [
          "Open **Samsung Health** → tap three dots top-right → **Settings**.",
          "Scroll to **Health Connect** → tap.",
          "Disable the connection → re-enable after 10 seconds.",
          "Verify all data types are selected (Steps, Heart Rate, Sleep, etc.).",
          "Go back to Samsung Health main screen and wait 1-2 minutes.",
        ],
      },
    },
    {
      type: "heading",
      level: 2,
      text: {
        it: "Fix 6: Aggiorna Health Connect all'ultima versione",
        en: "Fix 6: Update Health Connect to the latest version",
      },
    },
    {
      type: "paragraph",
      text: {
        it: "Health Connect si aggiorna tramite il Play Store come qualsiasi altra app. Le versioni più vecchie hanno bug di sync noti — in particolare con i dati intraday e i segmenti di sonno. Aggiornare risolve molti problemi silenziosamente.",
        en: "Health Connect updates via Play Store like any other app. Older versions have known sync bugs — particularly with intraday data and sleep segments. Updating silently fixes many issues.",
      },
    },
    {
      type: "list",
      ordered: true,
      items: {
        it: [
          "Apri **Play Store** → tap sulla tua icona profilo → **Gestisci app e dispositivo**.",
          "Cerca **Health Connect** e aggiorna se disponibile.",
          "Fai lo stesso per Samsung Health, Garmin Connect, o qualsiasi altra app nella tua catena di sync.",
        ],
        en: [
          "Open **Play Store** → tap your profile icon → **Manage apps & device**.",
          "Search for **Health Connect** and update if available.",
          "Do the same for Samsung Health, Garmin Connect, or any other app in your sync chain.",
        ],
      },
    },
    {
      type: "heading",
      level: 2,
      text: {
        it: "Fix 7: Revoca e riconcedi tutti i permessi (reset completo)",
        en: "Fix 7: Revoke and re-grant all permissions (full reset)",
      },
    },
    {
      type: "paragraph",
      text: {
        it: "Se nessuno degli altri fix ha funzionato, il problema potrebbe essere in uno stato di permesso corrotto. La soluzione è un reset completo della connessione:",
        en: "If none of the other fixes worked, the problem may be in a corrupted permission state. The solution is a full connection reset:",
      },
    },
    {
      type: "list",
      ordered: true,
      items: {
        it: [
          "In **Health Connect** → **Accesso alle app e dati** → trova l'app problematica.",
          "Tap sull'app → **Rimuovi accesso**.",
          "Riapri l'app problematica → cerca nelle impostazioni la sezione Health Connect.",
          "Tap su 'Connetti a Health Connect' o equivalente → concedi nuovamente tutti i permessi.",
          "Aspetta 5-10 minuti per il primo sync.",
        ],
        en: [
          "In **Health Connect** → **App permissions** → find the problematic app.",
          "Tap the app → **Remove access**.",
          "Reopen the problematic app → find the Health Connect section in settings.",
          "Tap 'Connect to Health Connect' or equivalent → grant all permissions again.",
          "Wait 5-10 minutes for the first sync.",
        ],
      },
    },
    {
      type: "heading",
      level: 2,
      text: {
        it: "Quando il problema non è sul tuo telefono",
        en: "When the problem isn't on your phone",
      },
    },
    {
      type: "paragraph",
      text: {
        it: "Se hai provato tutti i fix sopra e il problema persiste, potrebbe essere un'interruzione server-side dell'app sorgente (Samsung Health, Garmin Connect) o un bug nella versione specifica di Android che hai. In questo caso:",
        en: "If you've tried all the fixes above and the problem persists, it might be a server-side outage of the source app (Samsung Health, Garmin Connect) or a bug in your specific Android version. In that case:",
      },
    },
    {
      type: "list",
      items: {
        it: [
          "Cerca su Reddit (r/GalaxyWatch, r/AndroidHealth) se altri hanno lo stesso problema — spesso emerge un pattern.",
          "Controlla il status page dell'app sorgente se disponibile.",
          "Segnala il bug tramite il feedback dell'app.",
          "Come workaround temporaneo, i dati si accumulano localmente in Health Connect — non vengono persi, solo non sincronizzati verso il cloud.",
        ],
        en: [
          "Search Reddit (r/GalaxyWatch, r/AndroidHealth) if others have the same problem — a pattern often emerges.",
          "Check the source app's status page if available.",
          "Report the bug via app feedback.",
          "As a temporary workaround, data accumulates locally in Health Connect — it's not lost, just not synced to cloud.",
        ],
      },
    },
    {
      type: "cta",
      title: {
        it: "Vuoi un sync più resiliente?",
        en: "Want more resilient sync?",
      },
      body: {
        it: "FitMesh Sync è progettato per lavorare anche in condizioni non ideali: retry automatico, tolleranza ai buchi di connettività, e log visibile nell'app per capire cosa è stato sincronizzato e cosa no. Se i tuoi dati salute sono importanti, vale averli in un posto che non dipende da un singolo cloud.",
        en: "FitMesh Sync is designed to work even in non-ideal conditions: automatic retry, connectivity gap tolerance, and a visible in-app log to understand what was synced and what wasn't. If your health data matters, it's worth having it in a place that doesn't depend on a single cloud.",
      },
      ctaLabel: {
        it: "Scopri FitMesh Sync →",
        en: "Learn about FitMesh Sync →",
      },
      ctaHref: {
        it: "/it/integrations",
        en: "/en/integrations",
      },
    },
  ],
  faq: [
    {
      q: {
        it: "Perché Health Connect non mostra i dati del Galaxy Watch?",
        en: "Why doesn't Health Connect show Galaxy Watch data?",
      },
      a: {
        it: "Galaxy Watch non scrive direttamente su Health Connect — lo fa tramite Samsung Health. Se Samsung Health non ha i permessi di scrittura su Health Connect, i dati del Watch non arrivano. Verifica: Samsung Health → Impostazioni → Health Connect → assicurati che sia collegato e che tutti i tipi di dati siano abilitati.",
        en: "Galaxy Watch doesn't write directly to Health Connect — it does so through Samsung Health. If Samsung Health doesn't have write permissions on Health Connect, Watch data won't arrive. Check: Samsung Health → Settings → Health Connect → make sure it's connected and all data types are enabled.",
      },
    },
    {
      q: {
        it: "Health Connect è diverso da Google Fit?",
        en: "Is Health Connect different from Google Fit?",
      },
      a: {
        it: "Sì. Google Fit era la piattaforma salute precedente di Google (ora in dismissione). Health Connect è il nuovo standard Android unificato, lanciato nel 2022 e diventato parte nativa di Android 14. Google Fit e Health Connect sono sistemi separati — un'app può scrivere su uno, sull'altro, o su entrambi. Se hai problemi di sync, verifica quale dei due l'app sorgente utilizza.",
        en: "Yes. Google Fit was Google's previous health platform (now being deprecated). Health Connect is the new unified Android standard, launched in 2022 and now native to Android 14. Google Fit and Health Connect are separate systems — an app can write to one, the other, or both. If you have sync issues, check which one the source app uses.",
      },
    },
    {
      q: {
        it: "I dati mancanti in Health Connect possono essere recuperati?",
        en: "Can missing data in Health Connect be recovered?",
      },
      a: {
        it: "Dipende. Se l'app sorgente (Samsung Health, Garmin Connect) ha i dati nel suo database locale, molte app offrono un 'sync retroattivo' che riscrive i dati storici su Health Connect. In Samsung Health: Impostazioni → Health Connect → potrebbe esserci un'opzione 'Sincronizza dati storici'. In Garmin Connect: non è disponibile retroattivamente, ma i dati rimangono nel cloud Garmin anche se non sono in HC.",
        en: "It depends. If the source app (Samsung Health, Garmin Connect) has data in its local database, many apps offer 'retroactive sync' that rewrites historical data to Health Connect. In Samsung Health: Settings → Health Connect → there may be a 'Sync historical data' option. In Garmin Connect: not available retroactively, but data remains in Garmin's cloud even if not in HC.",
      },
    },
    {
      q: {
        it: "Più app che scrivono su Health Connect causano problemi?",
        en: "Do multiple apps writing to Health Connect cause problems?",
      },
      a: {
        it: "Possono causare duplicati. Se Garmin Connect e Samsung Health scrivono entrambi 'Passi' per lo stesso intervallo orario, Health Connect può contenere due record per lo stesso dato. La maggior parte delle app di lettura gestisce la deduplicazione, ma non tutte. Se vedi conteggi passi molto alti o dati duplicati, verifica quali app hanno permesso di scrittura e considera di disabilitare la scrittura dai duplicati.",
        en: "They can cause duplicates. If Garmin Connect and Samsung Health both write 'Steps' for the same hourly interval, Health Connect can contain two records for the same data. Most reading apps handle deduplication, but not all. If you see very high step counts or duplicate data, check which apps have write permission and consider disabling writing from the duplicates.",
      },
    },
  ],
  related: [
    "come-funziona-health-connect",
    "passi-non-si-sincronizzano-galaxy-watch",
    "health-connect-vs-samsung-health",
  ],
  brandsMentioned: ["Google", "Samsung", "Garmin", "Fitbit"],
  ldType: "BlogPosting",
};
