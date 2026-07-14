/**
 * Copy per /delete-account (pagina pubblica, non localizzata, richiesta da
 * Google Play e App Store: cancellazione account fuori dall'app, e
 * cancellazione dati senza cancellare l'account, dichiarata su Play Console
 * Data Safety).
 *
 * Solo EN (sorgente) + IT per ora: le altre 13 lingue del sito restano fuori
 * scope, la pagina serve inglese di default con l'italiano disponibile via
 * toggle.
 *
 * Sprint di completamento (2026-07-14) — fatti verificati, non inventati:
 *  - Cancellazione SOLO dati (non account): `deleteMetricsForRange()` in
 *    `AppFitmesh/flutter_app/lib/features/settings/data/data_export_service.dart`,
 *    invocata da Impostazioni -> Privacy & dati -> "Elimina dati
 *    sincronizzati..." (stringhe esatte verificate in app_en.arb/app_it.arb).
 *    Cancella solo `fitness_metrics` nel periodo scelto (7/30/90 giorni o
 *    intervallo personalizzato); account, impostazioni e device collegati
 *    non vengono toccati. Nessun equivalente sulla dashboard web ad oggi
 *    (verificato: solo cancellazione account completo in
 *    `app/(frontend)/[locale]/app/settings/DeleteAccountSection.tsx`).
 *  - 24 ore per la dashboard web: da
 *    supabase/migrations/20260616090000_gdpr_deletion_execution.sql
 *    (`gdpr_process_deletions`, job pg_cron interno a Postgres — non un cron
 *    Vercel, quindi non soggetto al limite "solo daily" di vercel.json/Hobby
 *    plan). Verificato 2026-07-14 via query dirette: il job esiste, è attivo,
 *    gira ogni 10 minuti, le ultime esecuzioni sono tutte "succeeded", e
 *    zero richieste pendenti hanno più di 24 ore. Il caso limite noto
 *    (proprietari di gruppo Mesh Famiglia/palestra possono far fallire
 *    silenziosamente la propria cancellazione) resta non corretto, spostato
 *    allo sprint separato P0.4E. Finche' non e' risolto, i percorsi
 *    presentati come affidabili sono SOLO: cancellazione immediata dall'app
 *    mobile, e richiesta manuale via privacy@fitmesh.fit (verificata da una
 *    persona). La dashboard web puo' essere menzionata SOLO con la frase
 *    esatta concordata (vedi `timelineBody`), senza garanzia di
 *    completamento automatico.
 *  - Cancellazione immediata da app mobile: da
 *    AppFitmesh/docs/account-deletion/delete_current_user.sql (`delete_current_user()`,
 *    nessuna grace, invocata direttamente da app Flutter — fuori scope, non modificata).
 *  - Dati anonimizzati non cancellati (audit_logs, admin_events): da
 *    supabase/migrations/20260513120005_init_consents_settings.sql
 *    (`anonymize_user_audit_on_delete`).
 *  - Backup: il progetto Supabase e' su piano Free (verificato via API
 *    2026-07-14), che NON ha point-in-time recovery ne' backup giornalieri
 *    garantiti (feature Pro+ secondo la documentazione ufficiale). Il claim
 *    precedente "rotazione 7 giorni" era quindi falso e non riverificabile:
 *    rimosso qui e nella Privacy Policy (6 lingue), sostituito con una
 *    frase onesta senza numero specifico, per decisione esplicita
 *    dell'utente.
 */

export type DeleteAccountCopy = {
  metaTitle: string;
  metaDescription: string;
  kicker: string;
  h1: string;
  lastUpdated: string;
  intro: string;
  toggleLabel: string;
  howTitle: string;
  howAppTitle: string;
  howAppBody: string;
  howEmailTitle: string;
  howEmailBody: string;
  emailButtonLabel: string;
  identityTitle: string;
  identityBody: string;
  dataOnlyTitle: string;
  dataOnlyBody: string;
  whatDeletedTitle: string;
  whatDeletedIntro: string;
  whatDeletedItems: string[];
  whatKeptTitle: string;
  whatKeptBody: string;
  backupsTitle: string;
  backupsBody: string;
  backupsLinkLabel: string;
  externalTitle: string;
  externalBody: string;
  purchasesTitle: string;
  purchasesBody: string;
  timelineTitle: string;
  timelineBody: string;
  faqTitle: string;
  faq: { q: string; a: string }[];
  privacyLinkLabel: string;
  supportLinkLabel: string;
};

export const DELETE_ACCOUNT_EMAIL_SUBJECT = "FitMesh account deletion request";

export const DELETE_ACCOUNT_COPY: { en: DeleteAccountCopy; it: DeleteAccountCopy } = {
  en: {
    metaTitle: "Delete your FitMesh account",
    metaDescription:
      "How to permanently delete your FitMesh account and data, from the app or by email. No login required to start.",
    kicker: "Account & data",
    h1: "Delete your FitMesh account",
    lastUpdated: "Last updated: July 14, 2026",
    intro:
      "FitMesh is an app published by Fosforonero (Fosforonero di Matteo Pizzi). This is the official account deletion page for FitMesh, reachable without installing or opening the app, as required by Google Play and the App Store.",
    toggleLabel: "Italiano",
    howTitle: "How to delete your account",
    howAppTitle: "From the mobile app (immediate)",
    howAppBody:
      "In the FitMesh mobile app, go to Settings and choose Delete my account. You'll be asked to type a confirmation phrase. This deletes your account and all its data immediately and cannot be undone.",
    howEmailTitle: "By email, without logging in",
    howEmailBody:
      "Email us from the address linked to your account and ask us to delete it. We verify it's really you, then delete your account and its data ourselves.",
    emailButtonLabel: "Email us to delete my account",
    identityTitle: "Verifying it's you",
    identityBody:
      "When you delete your account from inside the app, you're already signed in, so your session verifies your identity. When you ask by email, we check that the request comes from the email address on your account, and we may ask a follow-up question before processing it. We never delete an account based on an email alone if the sender address doesn't match the account.",
    dataOnlyTitle: "Delete your data without deleting your account",
    dataOnlyBody:
      "If you'd rather keep your account and just clear your synced health data, you can do that from the mobile app: go to Settings, then Privacy & data, then Delete synced data. Pick a period (the last 7, 30, or 90 days, or a custom date range) and type DELETE to confirm. This permanently removes your steps, heart rate, sleep, and every other synced metric for that period. Your account, your settings, and your connected devices are not touched. This isn't available yet from the web dashboard; email privacy@fitmesh.fit if you'd like it done that way instead.",
    whatDeletedTitle: "What gets deleted",
    whatDeletedIntro:
      "Deleting your account permanently removes your sign-in credentials and, with them, everything tied to your profile:",
    whatDeletedItems: [
      "Your profile and account settings",
      "Your health data history: steps, heart rate, sleep, SpO2, HRV, workouts and any other metric synced to FitMesh",
      "Devices and pairing codes connected to your account",
      "Any Mesh Family group you own, plus your membership in groups you belong to",
      "Your subscription record stored in our system (see Subscriptions and purchases below for what this does not affect)",
    ],
    whatKeptTitle: "What we keep, and why",
    whatKeptBody:
      "A small amount of technical information survives in anonymized form: security and error logs, and an internal record that a deletion took place. Both have your identity stripped out as part of the deletion itself, so neither can be traced back to you afterwards. We keep them briefly for troubleshooting and fraud prevention, as described in our Privacy Policy.",
    backupsTitle: "Backups",
    backupsBody:
      "We keep copies of our data for service continuity in case of a technical incident. We don't guarantee a fixed retention window for these copies, and they are never used to bring back an account you've asked us to delete. See the data retention section of our Privacy Policy for details.",
    backupsLinkLabel: "Read the retention section in our Privacy Policy",
    externalTitle: "Data held by other services",
    externalBody:
      "FitMesh reads data from services you choose to connect, such as Health Connect, Samsung Health, Garmin, Fitbit, Apple Health, or a Colmi smart ring's own app. Deleting your FitMesh account only deletes the copy stored inside FitMesh. It does not delete, change, or disconnect anything in those other services. If you also want your data removed there, you need to do that separately, directly with each provider.",
    purchasesTitle: "Subscriptions and purchases",
    purchasesBody:
      "If you subscribed or bought FitMesh Pro through Google Play or the App Store, deleting your FitMesh account does not cancel that subscription and does not issue a refund. Apple and Google handle billing on their own systems. To cancel a subscription or request a refund, use your Google Play or App Store account settings directly.",
    timelineTitle: "How long it takes",
    timelineBody:
      "These three paths take different amounts of time because each one verifies who you are differently. Deletion from the mobile app happens immediately, because you're already signed in on that device and there's nothing left to check. Deletion requested by email is carried out by us after we verify your identity, since anyone could otherwise write in claiming to be you. Requests made from the web dashboard enter a 24-hour grace period. If the deletion is not completed, contact privacy@fitmesh.fit.",
    faqTitle: "Frequently asked questions",
    faq: [
      {
        q: "Can I cancel a deletion request?",
        a: "Deletion started from the mobile app is immediate and cannot be cancelled. For anything else, contact privacy@fitmesh.fit.",
      },
      {
        q: "Does this delete my data in Health Connect, Garmin, Fitbit, or Apple Health?",
        a: "No. FitMesh only deletes its own copy of your data. Data stored by those services stays there; remove it directly through each provider if you want it gone too.",
      },
      {
        q: "Will deleting my FitMesh account cancel my Google Play or App Store subscription?",
        a: "No, and it won't refund a purchase either. Subscriptions and purchases are managed by Apple or Google, not by FitMesh. Cancel or request a refund from your Google Play or App Store account.",
      },
      {
        q: "I don't have the app installed anymore. Can I still get my account deleted?",
        a: "Yes. Email privacy@fitmesh.fit from the address linked to your account; you don't need the app or a login to start the process.",
      },
    ],
    privacyLinkLabel: "Privacy Policy",
    supportLinkLabel: "Support",
  },
  it: {
    metaTitle: "Elimina il tuo account FitMesh",
    metaDescription:
      "Come eliminare definitivamente il tuo account FitMesh e i tuoi dati, dall'app o via email. Nessun login richiesto per iniziare.",
    kicker: "Account e dati",
    h1: "Elimina il tuo account FitMesh",
    lastUpdated: "Ultimo aggiornamento: 14 luglio 2026",
    intro:
      "FitMesh e' un'app pubblicata da Fosforonero (Fosforonero di Matteo Pizzi). Questa e' la pagina ufficiale per la cancellazione dell'account FitMesh, raggiungibile senza installare o aprire l'app, come richiesto da Google Play e dall'App Store.",
    toggleLabel: "English",
    howTitle: "Come eliminare il tuo account",
    howAppTitle: "Dall'app mobile (immediata)",
    howAppBody:
      "Nell'app mobile FitMesh, vai in Impostazioni e scegli Elimina il mio account. Ti verra' chiesto di digitare una frase di conferma. Questo elimina immediatamente il tuo account e tutti i suoi dati; non puo' essere annullato.",
    howEmailTitle: "Via email, senza accedere",
    howEmailBody:
      "Scrivici dall'indirizzo collegato al tuo account e chiedici di eliminarlo. Verifichiamo che sia davvero tu, poi eliminiamo noi stessi il tuo account e i suoi dati.",
    emailButtonLabel: "Scrivici per eliminare il mio account",
    identityTitle: "Verifica della tua identita'",
    identityBody:
      "Quando elimini l'account dall'app, hai gia' effettuato l'accesso, quindi la tua sessione verifica la tua identita'. Quando lo chiedi via email, controlliamo che la richiesta arrivi dall'indirizzo email del tuo account e potremmo farti una domanda di verifica prima di procedere. Non eliminiamo mai un account solo sulla base di un'email se l'indirizzo del mittente non corrisponde a quello dell'account.",
    dataOnlyTitle: "Elimina i tuoi dati senza eliminare l'account",
    dataOnlyBody:
      "Se preferisci mantenere il tuo account e cancellare solo i dati di salute sincronizzati, puoi farlo dall'app mobile: vai in Impostazioni, poi Privacy e dati, poi Elimina dati sincronizzati. Scegli un periodo (gli ultimi 7, 30 o 90 giorni, oppure un intervallo di date personalizzato) e digita ELIMINA per confermare. Questo rimuove in modo permanente i tuoi passi, la frequenza cardiaca, il sonno e ogni altra metrica sincronizzata per quel periodo. Il tuo account, le tue impostazioni e i dispositivi collegati non vengono toccati. Questa opzione non e' ancora disponibile dalla dashboard web; scrivi a privacy@fitmesh.fit se preferisci che venga fatto in quel modo.",
    whatDeletedTitle: "Cosa viene eliminato",
    whatDeletedIntro:
      "Eliminare il tuo account rimuove in modo permanente le tue credenziali di accesso e, con esse, tutto cio' che e' legato al tuo profilo:",
    whatDeletedItems: [
      "Il tuo profilo e le impostazioni dell'account",
      "Lo storico dei tuoi dati di salute: passi, frequenza cardiaca, sonno, SpO2, HRV, allenamenti e ogni altra metrica sincronizzata con FitMesh",
      "I dispositivi e i codici di abbinamento collegati al tuo account",
      "Ogni gruppo Mesh Famiglia di cui sei proprietario, oltre alla tua appartenenza ai gruppi di cui fai parte",
      "Il record del tuo abbonamento memorizzato nel nostro sistema (vedi piu' sotto Abbonamenti e acquisti per cosa questo non riguarda)",
    ],
    whatKeptTitle: "Cosa conserviamo, e perche'",
    whatKeptBody:
      "Una piccola quantita' di informazioni tecniche sopravvive in forma anonima: log di sicurezza e di errore, e un record interno che attesta che una cancellazione ha avuto luogo. In entrambi i casi la tua identita' viene rimossa come parte della cancellazione stessa, quindi nessuno dei due puo' essere ricollegato a te in seguito. Li conserviamo brevemente per motivi di troubleshooting e prevenzione frodi, come descritto nella nostra Privacy Policy.",
    backupsTitle: "Backup",
    backupsBody:
      "Conserviamo copie di sicurezza per garantire la continuita' del servizio in caso di incidente tecnico. Non garantiamo una finestra di conservazione fissa per queste copie, e non vengono mai usate per ripristinare un account di cui hai chiesto la cancellazione. Per i dettagli, vedi la sezione sulla conservazione dei dati nella nostra Privacy Policy.",
    backupsLinkLabel: "Leggi la sezione sulla conservazione dei dati nella Privacy Policy",
    externalTitle: "Dati presenti in altri servizi",
    externalBody:
      "FitMesh legge i dati dai servizi che scegli di collegare, come Health Connect, Samsung Health, Garmin, Fitbit, Apple Health, o l'app del tuo anello smart Colmi. Eliminare il tuo account FitMesh cancella solo la copia conservata dentro FitMesh. Non elimina, modifica o scollega nulla in quegli altri servizi. Se vuoi che i tuoi dati vengano rimossi anche li', devi farlo separatamente, direttamente con ciascun fornitore.",
    purchasesTitle: "Abbonamenti e acquisti",
    purchasesBody:
      "Se ti sei abbonato o hai acquistato FitMesh Pro tramite Google Play o l'App Store, eliminare il tuo account FitMesh non annulla quell'abbonamento e non genera un rimborso. Apple e Google gestiscono la fatturazione sui propri sistemi. Per annullare un abbonamento o richiedere un rimborso, usa direttamente le impostazioni del tuo account Google Play o App Store.",
    timelineTitle: "Quanto tempo ci vuole",
    timelineBody:
      "Questi tre percorsi richiedono tempi diversi perche' ciascuno verifica la tua identita' in modo diverso. L'eliminazione dall'app mobile avviene immediatamente, perche' hai gia' effettuato l'accesso su quel dispositivo e non c'e' altro da controllare. L'eliminazione richiesta via email viene eseguita da noi dopo aver verificato la tua identita', perche' altrimenti chiunque potrebbe scriverci fingendo di essere te. Le richieste effettuate dalla dashboard web prevedono un periodo di ripensamento di 24 ore. Se la cancellazione non viene completata, contatta privacy@fitmesh.fit.",
    faqTitle: "Domande frequenti",
    faq: [
      {
        q: "Posso annullare una richiesta di cancellazione?",
        a: "La cancellazione avviata dall'app mobile e' immediata e non puo' essere annullata. Per qualsiasi altro caso, contatta privacy@fitmesh.fit.",
      },
      {
        q: "Questo elimina i miei dati in Health Connect, Garmin, Fitbit o Apple Health?",
        a: "No. FitMesh elimina solo la propria copia dei tuoi dati. I dati conservati da quei servizi restano li'; rimuovili direttamente tramite ciascun fornitore se vuoi eliminarli anche da li'.",
      },
      {
        q: "Eliminare il mio account FitMesh annulla il mio abbonamento Google Play o App Store?",
        a: "No, e non rimborsa nemmeno un acquisto. Abbonamenti e acquisti sono gestiti da Apple o Google, non da FitMesh. Annulla o richiedi un rimborso dal tuo account Google Play o App Store.",
      },
      {
        q: "Non ho piu' l'app installata. Posso comunque far eliminare il mio account?",
        a: "Si'. Scrivi a privacy@fitmesh.fit dall'indirizzo collegato al tuo account; non ti servono l'app o un login per iniziare il processo.",
      },
    ],
    privacyLinkLabel: "Privacy Policy",
    supportLinkLabel: "Supporto",
  },
};
