/**
 * Landing pages high-intent (`/lp/[slug]`).
 *
 * Differenza vs blog: focus conversion. Struttura più snella, più CTA, content
 * più tagliente. Riusa il tipo `BlogSection` per coerenza render — i landing
 * sono blog post con `pillar: false`, FAQ leggera, related vuoto e brand
 * disclaimer obbligatorio se citano produttori.
 */

import type { BlogSection, BlogQA, Localized } from "@/lib/blog/types";

export interface LandingPage {
  /** Slug URL — kebab-case, stabile, SEO-critical. */
  slug: string;
  /** Target provider slug (`/sync/[provider]`), per cross-link CTA. */
  relatedProvider?: string;
  publishedAt: string;
  updatedAt: string;
  hero: {
    kicker: Localized;
    title: Localized;
    subtitle: Localized;
    /** CTA primaria in hero (label + path o ancora). */
    primaryCta: { label: Localized; href: Localized };
    /** CTA secondaria opzionale (default: /integrations). */
    secondaryCta?: { label: Localized; href: Localized };
  };
  metaDescription: Localized;
  primaryKeyword: Localized;
  secondaryKeywords: { it: string[]; en: string[] };
  body: BlogSection[];
  faq?: BlogQA[];
  brandsMentioned?: string[];
}

const LANDING_PAGES_RAW: LandingPage[] = [
  // ── 1. Backup Galaxy Watch ────────────────────────────────────────────
  {
    slug: "backup-galaxy-watch",
    relatedProvider: "galaxy-watch",
    publishedAt: "2026-05-21",
    updatedAt: "2026-05-21",
    primaryKeyword: {
      it: "backup galaxy watch",
      en: "galaxy watch backup",
      de: "Galaxy Watch Backup",
      pt: "backup galaxy watch",
      fr: "sauvegarde galaxy watch",
      pl: "kopia zapasowa galaxy watch",
      tr: "galaxy watch yedekleme",
    },
    secondaryKeywords: {
      it: [
        "scaricare dati samsung health",
        "samsung health backup pc",
        "backup galaxy watch senza samsung cloud",
      ],
      en: [
        "download samsung health data",
        "samsung health backup pc",
        "galaxy watch backup without samsung cloud",
      ],
    },
    metaDescription: {
      it: "Backup automatico dei dati Galaxy Watch su una dashboard tua, senza Samsung Cloud. Setup in 30 secondi via Health Connect. Privacy-first.",
      en: "Automatic backup of Galaxy Watch data on a dashboard you own, without Samsung Cloud. 30-second setup via Health Connect. Privacy-first.",
      de: "Automatisches Backup deiner Galaxy Watch-Daten auf deinem eigenen Dashboard, ohne Samsung Cloud. Einrichtung in 30 Sekunden via Health Connect. Privacy-first.",
      pt: "Backup automático dos dados do Galaxy Watch em um painel seu, sem Samsung Cloud. Configuração em 30 segundos via Health Connect. Privacidade em primeiro lugar.",
      fr: "Sauvegarde automatique des données Galaxy Watch sur votre propre tableau de bord, sans Samsung Cloud. Configuration en 30 secondes via Health Connect. La confidentialité avant tout.",
      pl: "Automatyczna kopia zapasowa danych Galaxy Watch na Twoim własnym panelu, bez Samsung Cloud. Konfiguracja w 30 sekund przez Health Connect. Prywatność na pierwszym miejscu.",
      tr: "Galaxy Watch verilerinin otomatik yedeği, Samsung Cloud olmadan kendi panelinizde. Health Connect ile 30 saniyede kurulum. Gizlilik önce.",
    },
    hero: {
      kicker: { it: "Backup Galaxy Watch", en: "Galaxy Watch backup", de: "Galaxy Watch Backup", pt: "Backup do Galaxy Watch", fr: "Sauvegarde Galaxy Watch", pl: "Kopia zapasowa Galaxy Watch", tr: "Galaxy Watch yedekleme" },
      title: {
        it: "Backup automatico Galaxy Watch, fuori da Samsung Cloud",
        en: "Automatic Galaxy Watch backup, outside Samsung Cloud",
        de: "Automatisches Galaxy Watch Backup, außerhalb von Samsung Cloud",
        pt: "Backup automático do Galaxy Watch, fora do Samsung Cloud",
        fr: "Sauvegarde automatique Galaxy Watch, hors Samsung Cloud",
        pl: "Automatyczna kopia zapasowa Galaxy Watch, poza Samsung Cloud",
        tr: "Otomatik Galaxy Watch yedekleme, Samsung Cloud dışında",
      },
      subtitle: {
        it: "Passi, BPM, sonno, allenamenti del tuo Galaxy Watch su una dashboard web tua. Setup di 30 secondi via Health Connect, niente account aggiuntivi.",
        en: "Steps, HR, sleep, workouts from your Galaxy Watch on a web dashboard you own. 30-second setup via Health Connect, no extra accounts.",
        de: "Schritte, BPM, Schlaf, Trainings deines Galaxy Watch auf deinem eigenen Web-Dashboard. Einrichtung in 30 Sekunden via Health Connect, keine zusätzlichen Konten.",
        pt: "Passos, BPM, sono, treinos do seu Galaxy Watch em um painel web seu. Configuração em 30 segundos via Health Connect, sem contas extras.",
        fr: "Pas, BPM, sommeil, séances d'entraînement de votre Galaxy Watch sur votre propre tableau de bord web. Configuration en 30 secondes via Health Connect, aucun compte supplémentaire.",
        pl: "Kroki, tętno, sen, treningi z Galaxy Watch na Twoim własnym panelu webowym. Konfiguracja 30 sekund przez Health Connect, bez dodatkowych kont.",
        tr: "Galaxy Watch'unuzdaki adımlar, nabız, uyku ve antrenmanlar, size ait bir web panelinde. Health Connect ile 30 saniyelik kurulum, fazladan hesap gerekmez.",
      },
      primaryCta: {
        label: { it: "Entra in beta gratis", en: "Join the free beta", de: "Kostenlos zur Beta", pt: "Entrar na beta grátis", fr: "Rejoindre la bêta gratuite", pl: "Dołącz do darmowej bety", tr: "Ücretsiz betaya katıl" },
        href: { it: "/it/beta", en: "/en/beta", de: "/de/beta", pt: "/pt/beta", fr: "/fr/beta", pl: "/pl/beta", tr: "/tr/beta" },
      },
      secondaryCta: {
        label: { it: "Vedi tutte le integrazioni", en: "See all integrations", de: "Alle Integrationen ansehen", pt: "Ver todas as integrazioni", fr: "Voir toutes les intégrations", pl: "Zobacz wszystkie integracje", tr: "Tüm entegrasyonları gör" },
        href: { it: "/it/sync/galaxy-watch", en: "/en/sync/galaxy-watch", de: "/de/sync/galaxy-watch", pt: "/pt/sync/galaxy-watch", fr: "/fr/sync/galaxy-watch", pl: "/pl/sync/galaxy-watch", tr: "/tr/sync/galaxy-watch" },
      },
    },
    body: [
      {
        type: "paragraph",
        text: {
          it: "Il Galaxy Watch è ottimo, Samsung Health è completo, ma se vuoi i tuoi dati fuori dal cloud Samsung (per archivio, per analisi su PC, per fare confronti tra anni), la strada nativa è clunky. Devi aprire l'app, andare in impostazioni, scaricare l'export, aspettare l'email, decomprimere, importare in Excel. Ogni volta da capo.",
          en: "Galaxy Watch is great, Samsung Health is comprehensive, but if you want your data out of Samsung cloud (for archive, for PC analysis, for cross-year comparisons), the native path is clunky. You open the app, go to settings, download the export, wait for the email, unzip, import to Excel. Every single time.",
          de: "Galaxy Watch ist hervorragend, Samsung Health ist umfassend, aber wenn du deine Daten aus der Samsung Cloud herausbekommen möchtest (für Archivierung, PC-Analyse oder Jahresvergleiche), ist der native Weg umständlich. Du öffnest die App, gehst in die Einstellungen, lädst den Export herunter, wartest auf die E-Mail, entpackst die Datei und importierst sie in Excel. Jedes Mal von vorne.",
          pt: "O Galaxy Watch é ótimo, o Samsung Health é completo, mas se você quer seus dados fora da nuvem Samsung (para arquivo, análise no PC ou comparações entre anos), o caminho nativo é trabalhoso. Você abre o app, vai nas configurações, baixa o export, espera o e-mail, descompacta e importa no Excel. Tudo de novo a cada vez.",
          fr: "Le Galaxy Watch est excellent, Samsung Health est complet, mais si vous voulez récupérer vos données hors du cloud Samsung (pour archivage, analyse sur PC ou comparaisons annuelles), le chemin natif est fastidieux. Vous ouvrez l'application, allez dans les paramètres, téléchargez l'export, attendez l'e-mail, décompressez et importez dans Excel. À recommencer à chaque fois.",
          pl: "Galaxy Watch jest świetny, Samsung Health jest kompleksowy, ale jeśli chcesz swoje dane poza chmurą Samsung (do archiwum, analizy na PC, porównań między latami), natywna ścieżka jest uciążliwa. Otwierasz aplikację, przechodzisz do ustawień, pobierasz eksport, czekasz na e-mail, rozpakowujesz, importujesz do Excela. Za każdym razem od nowa.",
          tr: "Galaxy Watch harika, Samsung Health kapsamlı ama verilerinizi Samsung bulutundan çıkarmak istiyorsanız (arşiv, PC analizi, yıllar arası karşılaştırma için), yerel yol zahmetli. Uygulamayı açıyorsunuz, ayarlara gidiyorsunuz, dışa aktarımı indiriyorsunuz, e-postayı bekliyorsunuz, sıkıştırılmış dosyayı açıyorsunuz, Excel'e aktarıyorsunuz. Her seferinde baştan.",
        },
      },
      {
        type: "paragraph",
        text: {
          it: "FitMesh Sync è la via automatica. Installi l'app Android, dai il permesso Health Connect, e da quel momento i dati del Galaxy Watch sono mirrorati su una dashboard web che apri da qualsiasi browser. Sync automatico ogni 15 minuti, nessuna manualità.",
          en: "FitMesh Sync is the automatic path. Install the Android app, grant the Health Connect permission, and from then on your Galaxy Watch data is mirrored to a web dashboard you open from any browser. Automatic sync every 15 minutes, zero manual work.",
          de: "FitMesh Sync ist der automatische Weg. Installiere die Android-App, erteile die Health Connect-Berechtigung, und von da an werden deine Galaxy Watch-Daten auf ein Web-Dashboard gespiegelt, das du von jedem Browser aus öffnest. Automatische Synchronisierung alle 15 Minuten, kein manueller Aufwand.",
          pt: "FitMesh Sync é o caminho automático. Instale o app Android, conceda a permissão do Health Connect e, a partir daí, os dados do Galaxy Watch são espelhados em um painel web que você acessa de qualquer navegador. Sincronização automática a cada 15 minutos, sem nenhum trabalho manual.",
          fr: "FitMesh Sync est la solution automatique. Installez l'application Android, accordez l'autorisation Health Connect, et dès lors vos données Galaxy Watch sont reflétées sur un tableau de bord web accessible depuis n'importe quel navigateur. Synchronisation automatique toutes les 15 minutes, sans aucune manipulation.",
        },
      },
      {
        type: "heading",
        level: 2,
        text: { it: "Cosa viene salvato", en: "What gets saved", de: "Was gespeichert wird", pt: "O que é salvo", fr: "Ce qui est sauvegardé" },
      },
      {
        type: "list",
        items: {
          it: [
            "Passi giornalieri e per intervallo orario",
            "Frequenza cardiaca: media, riposo, e sample continui",
            "Sonno con fasi (Profondo, REM, Leggero, Sveglio)",
            "Allenamenti con tipo, durata, kcal, BPM medio",
            "Calorie attive e basali",
            "Distanza percorsa",
            "SpO₂ (se il tuo Watch lo misura)",
            "VO₂ max (se misurato)",
          ],
          en: [
            "Daily and hourly-interval steps",
            "Heart rate: average, resting, and continuous samples",
            "Sleep with stages (Deep, REM, Light, Awake)",
            "Workouts with type, duration, kcal, average HR",
            "Active and basal calories",
            "Distance",
            "SpO₂ (if your Watch measures it)",
            "VO₂ max (when measured)",
          ],
          de: [
            "Tägliche Schritte und stündliche Intervalle",
            "Herzfrequenz: Durchschnitt, Ruhewert und kontinuierliche Messungen",
            "Schlaf mit Phasen (Tiefschlaf, REM, Leichtschlaf, Wach)",
            "Trainings mit Typ, Dauer, kcal, Durchschnittspuls",
            "Aktive Kalorien und Grundumsatz-Kalorien",
            "Zurückgelegte Distanz",
            "SpO₂ (wenn deine Watch es misst)",
            "VO₂ max (wenn gemessen)",
          ],
          pt: [
            "Passos diários e por intervalo horário",
            "Frequência cardíaca: média, repouso e amostras contínuas",
            "Sono com fases (Profundo, REM, Leve, Acordado)",
            "Treinos com tipo, duração, kcal, BPM médio",
            "Calorias ativas e basais",
            "Distância percorrida",
            "SpO₂ (se o seu Watch mede)",
            "VO₂ max (quando medido)",
          ],
          fr: [
            "Pas journaliers et par intervalle horaire",
            "Fréquence cardiaque : moyenne, repos et mesures continues",
            "Sommeil avec phases (Profond, REM, Léger, Éveillé)",
            "Séances d'entraînement avec type, durée, kcal, FC moyenne",
            "Calories actives et de base",
            "Distance parcourue",
            "SpO₂ (si votre Watch le mesure)",
            "VO₂ max (si mesuré)",
          ],
        },
      },
      {
        type: "heading",
        level: 2,
        text: { it: "Setup in 3 step", en: "Setup in 3 steps", de: "Einrichtung in 3 Schritten", pt: "Configuração em 3 passos", fr: "Configuration en 3 étapes" },
      },
      {
        type: "list",
        ordered: true,
        items: {
          it: [
            "Installa FitMesh Sync dal Play Store e accedi con Google.",
            "Apri Samsung Health → Impostazioni → Health Connect → autorizza FitMesh per i dati che vuoi salvare.",
            "Apri la dashboard web (link nell'app o accedi con la stessa Google). I tuoi dati sono lì.",
          ],
          en: [
            "Install FitMesh Sync from Play Store and sign in with Google.",
            "Open Samsung Health → Settings → Health Connect → authorize FitMesh for the data types you want to save.",
            "Open the web dashboard (link in the app or sign in with the same Google). Your data is there.",
          ],
          de: [
            "Installiere FitMesh Sync aus dem Play Store und melde dich mit Google an.",
            "Öffne Samsung Health → Einstellungen → Health Connect → autorisiere FitMesh für die Daten, die du speichern möchtest.",
            "Öffne das Web-Dashboard (Link in der App oder melde dich mit demselben Google-Konto an). Deine Daten sind dort.",
          ],
          pt: [
            "Instale FitMesh Sync na Play Store e entre com o Google.",
            "Abra o Samsung Health → Configurações → Health Connect → autorize o FitMesh para os tipos de dados que deseja salvar.",
            "Abra o painel web (link no app ou entre com o mesmo Google). Seus dados estão lá.",
          ],
          fr: [
            "Installez FitMesh Sync depuis le Play Store et connectez-vous avec Google.",
            "Ouvrez Samsung Health → Paramètres → Health Connect → autorisez FitMesh pour les types de données à sauvegarder.",
            "Ouvrez le tableau de bord web (lien dans l'application ou connectez-vous avec le même compte Google). Vos données sont là.",
          ],
        },
      },
      {
        type: "callout",
        variant: "tip",
        title: { it: "Senza dipendenze da Samsung Cloud", en: "No Samsung Cloud dependency", de: "Keine Abhängigkeit von Samsung Cloud", pt: "Sem dependência do Samsung Cloud", fr: "Aucune dépendance à Samsung Cloud" },
        body: {
          it: "FitMesh Sync legge da Health Connect, che è strettamente on-device. Non passa dal cloud Samsung. Puoi disabilitare la sincronizzazione Samsung Account in Samsung Health e FitMesh continua a funzionare.",
          en: "FitMesh Sync reads from Health Connect, which is strictly on-device. It doesn't pass through Samsung cloud. You can disable Samsung Account sync in Samsung Health and FitMesh keeps working.",
          de: "FitMesh Sync liest aus Health Connect, das strikt geräteseitig ist. Es läuft nicht über die Samsung Cloud. Du kannst die Samsung Account-Synchronisierung in Samsung Health deaktivieren, und FitMesh funktioniert weiterhin.",
          pt: "FitMesh Sync lê do Health Connect, que funciona estritamente no dispositivo. Não passa pela nuvem Samsung. Você pode desativar a sincronização com a Samsung Account no Samsung Health e o FitMesh continuará funcionando.",
          fr: "FitMesh Sync lit les données depuis Health Connect, qui fonctionne strictement sur l'appareil. Il ne transite pas par le cloud Samsung. Vous pouvez désactiver la synchronisation du compte Samsung dans Samsung Health, et FitMesh continue de fonctionner.",
        },
      },
      {
        type: "cta",
        title: {
          it: "Pronto al backup automatico?",
          en: "Ready for automatic backup?",
          de: "Bereit für automatisches Backup?",
          pt: "Pronto para o backup automático?",
          fr: "Prêt pour la sauvegarde automatique ?",
        },
        body: {
          it: "100 posti founder gratis durante la beta. App Android sul Play Store + dashboard web inclusa.",
          en: "100 free founder seats during beta. Android app on Play Store + web dashboard included.",
          de: "100 kostenlose Founder-Plätze während der Beta. Android-App im Play Store und Web-Dashboard inklusive.",
          pt: "100 vagas founder grátis durante a beta. App Android na Play Store e painel web incluídos.",
          fr: "100 places founder gratuites pendant la bêta. Application Android sur le Play Store et tableau de bord web inclus.",
        },
        ctaLabel: { it: "Entra in beta →", en: "Join beta →", de: "Zur Beta →", pt: "Entrar na beta →", fr: "Rejoindre la bêta →" },
        ctaHref: { it: "/it/beta", en: "/en/beta", de: "/de/beta", pt: "/pt/beta", fr: "/fr/beta" },
      },
    ],
    faq: [
      {
        q: {
          it: "FitMesh Sync sostituisce Samsung Health?",
          en: "Does FitMesh Sync replace Samsung Health?",
          de: "Ersetzt FitMesh Sync Samsung Health?",
          pt: "FitMesh Sync substitui o Samsung Health?",
          fr: "FitMesh Sync remplace-t-il Samsung Health ?",
        },
        a: {
          it: "No, lavora insieme. Samsung Health continua a ricevere dati dal Watch. FitMesh ne legge una copia e la mostra sulla dashboard web. Sono complementari.",
          en: "No, they work together. Samsung Health keeps receiving data from the Watch. FitMesh reads a copy and shows it on the web dashboard. They're complementary.",
          de: "Nein, sie arbeiten zusammen. Samsung Health empfängt weiterhin Daten von der Watch. FitMesh liest eine Kopie davon und zeigt sie auf dem Web-Dashboard an. Sie ergänzen sich.",
          pt: "Não, eles funcionam juntos. O Samsung Health continua recebendo dados do Watch. FitMesh lê uma cópia e a exibe no painel web. São complementares.",
          fr: "Non, ils fonctionnent ensemble. Samsung Health continue de recevoir les données de la Watch. FitMesh en lit une copie et l'affiche sur le tableau de bord web. Ils sont complémentaires.",
        },
      },
      {
        q: {
          it: "E se Samsung Health non condivide tutto con Health Connect?",
          en: "What if Samsung Health doesn't share everything with Health Connect?",
          de: "Was ist, wenn Samsung Health nicht alles mit Health Connect teilt?",
          pt: "E se o Samsung Health não compartilhar tudo com o Health Connect?",
          fr: "Et si Samsung Health ne partage pas tout avec Health Connect ?",
        },
        a: {
          it: "Su telefoni Samsung FitMesh legge i dati direttamente da Samsung Health, oltre che da Health Connect. Così recupera anche le metriche che Samsung Health spesso non passa a Health Connect (in particolare frequenza cardiaca e sonno), più allenamenti, peso, pressione, glicemia e altro quando disponibili. Basta concedere i permessi di lettura una volta dalle impostazioni dell'app.",
          en: "On Samsung phones FitMesh reads data directly from Samsung Health, in addition to Health Connect. This recovers metrics that Samsung Health often doesn't pass to Health Connect (especially heart rate and sleep), plus workouts, weight, blood pressure, glucose and more when available. Just grant read permission once from the app settings.",
          de: "Auf Samsung-Telefonen liest FitMesh Daten direkt aus Samsung Health, zusätzlich zu Health Connect. So werden auch Messwerte erfasst, die Samsung Health häufig nicht an Health Connect weitergibt (insbesondere Herzfrequenz und Schlaf), sowie Trainings, Gewicht, Blutdruck, Blutzucker und mehr, wenn verfügbar. Erteile die Leseberechtigung einmalig in den App-Einstellungen.",
          pt: "Em telefones Samsung, o FitMesh lê dados diretamente do Samsung Health, além do Health Connect. Assim, recupera também as métricas que o Samsung Health frequentemente não repassa ao Health Connect (especialmente frequência cardíaca e sono), além de treinos, peso, pressão arterial, glicemia e mais, quando disponíveis. Basta conceder a permissão de leitura uma vez nas configurações do app.",
          fr: "Sur les téléphones Samsung, FitMesh lit les données directement depuis Samsung Health, en plus de Health Connect. Cela permet de récupérer aussi les métriques que Samsung Health ne transmet souvent pas à Health Connect (notamment la fréquence cardiaque et le sommeil), ainsi que les séances d'entraînement, le poids, la tension artérielle, la glycémie et d'autres données disponibles. Il suffit d'accorder l'autorisation de lecture une fois dans les paramètres de l'application.",
        },
      },
      {
        q: {
          it: "Funziona su Galaxy Watch 4? E sui modelli più vecchi?",
          en: "Does it work on Galaxy Watch 4? And older models?",
        },
        a: {
          it: "Sì per Galaxy Watch 4, 5, 6, 7, Ultra (tutti scrivono su Samsung Health → Health Connect). Modelli più vecchi (Gear S3, Galaxy Watch Active) potrebbero funzionare se aggiornati e collegati a Samsung Health aggiornato, ma il supporto formale parte dal Watch 4.",
          en: "Yes for Galaxy Watch 4, 5, 6, 7, Ultra (all write to Samsung Health → Health Connect). Older models (Gear S3, Galaxy Watch Active) may work if updated and paired with current Samsung Health, but formal support starts with Watch 4.",
        },
      },
      {
        q: {
          it: "I dati sono cancellabili in un click?",
          en: "Can I delete data with one click?",
        },
        a: {
          it: "Sì. Nelle impostazioni FitMesh c'è 'Elimina account e dati', che cancella tutto in modo definitivo dai nostri server (con 30 giorni di backup operativo come da privacy policy). I dati sul telefono e nel Galaxy Watch restano intatti.",
          en: "Yes. In FitMesh settings there's 'Delete account and data', which definitively deletes everything from our servers (with 30 days of operational backup as per privacy policy). Data on phone and Galaxy Watch remains intact.",
        },
      },
    ],
    brandsMentioned: ["Samsung", "Google"],
  },

  // ── 2. Fitbit Export Google ───────────────────────────────────────────
  {
    slug: "fitbit-export-google",
    relatedProvider: "fitbit",
    publishedAt: "2026-05-21",
    updatedAt: "2026-05-21",
    primaryKeyword: {
      it: "esportare dati fitbit google",
      en: "export fitbit data google",
      de: "Fitbit-Daten exportieren Google",
      pt: "exportar dados fitbit google",
      fr: "exporter données fitbit google",
    },
    secondaryKeywords: {
      it: ["alternativa dashboard fitbit", "vedere dati fitbit senza app", "fitbit web 2026"],
      en: ["fitbit dashboard alternative", "view fitbit data without app", "fitbit web 2026"],
    },
    metaDescription: {
      it: "Vuoi esportare e visualizzare i dati Fitbit dopo l'acquisizione Google? Dashboard web alternativa via Health Connect, niente Fitbit Premium, privacy-first.",
      en: "Want to export and view Fitbit data after Google acquisition? Alternative web dashboard via Health Connect, no Fitbit Premium, privacy-first.",
      de: "Möchtest du deine Fitbit-Daten nach der Google-Übernahme exportieren und anzeigen? Alternative Web-Dashboard via Health Connect, ohne Fitbit Premium, Privacy-first.",
      pt: "Quer exportar e visualizar os dados do Fitbit após a aquisição pelo Google? Painel web alternativo via Health Connect, sem Fitbit Premium, privacidade em primeiro lugar.",
      fr: "Vous souhaitez exporter vos données Fitbit après l'acquisition par Google ? Tableau de bord web alternatif via Health Connect, sans Fitbit Premium, confidentialité en priorité.",
    },
    hero: {
      kicker: { it: "Fitbit dopo Google", en: "Fitbit after Google", de: "Fitbit nach Google", pt: "Fitbit após o Google", fr: "Fitbit après Google" },
      title: {
        it: "Dashboard alternativa Fitbit, senza dipendenza da Google",
        en: "Alternative Fitbit dashboard, free from Google dependency",
        de: "Alternatives Fitbit-Dashboard, frei von Google-Abhängigkeit",
        pt: "Painel alternativo do Fitbit, sem dependência do Google",
        fr: "Tableau de bord Fitbit alternatif, sans dépendance à Google",
      },
      subtitle: {
        it: "Fitbit.com è stato smantellato, Fitbit Premium ti spinge a pagare per le funzioni di sempre. Esporta i tuoi dati Fitbit su una dashboard web tua, via Health Connect.",
        en: "Fitbit.com was decommissioned, Fitbit Premium pushes you to pay for the features you always had. Export your Fitbit data to a dashboard you own, via Health Connect.",
        de: "Fitbit.com wurde abgeschaltet, Fitbit Premium drängt dich dazu, für gewohnte Funktionen zu bezahlen. Exportiere deine Fitbit-Daten auf dein eigenes Web-Dashboard, via Health Connect.",
        pt: "O Fitbit.com foi desativado, o Fitbit Premium empurra você a pagar por funções que sempre existiram. Exporte seus dados do Fitbit para um painel web seu, via Health Connect.",
        fr: "Fitbit.com a été supprimé, Fitbit Premium vous pousse à payer pour des fonctionnalités que vous aviez toujours. Exportez vos données Fitbit sur votre propre tableau de bord web, via Health Connect.",
      },
      primaryCta: {
        label: { it: "Entra in beta gratis", en: "Join the free beta", de: "Kostenlos zur Beta", pt: "Entrar na beta grátis", fr: "Rejoindre la bêta gratuite" },
        href: { it: "/it/beta", en: "/en/beta", de: "/de/beta", pt: "/pt/beta", fr: "/fr/beta" },
      },
      secondaryCta: {
        label: { it: "Vedi integrazione Fitbit", en: "See Fitbit integration", de: "Fitbit-Integration ansehen", pt: "Ver integração Fitbit", fr: "Voir l'intégration Fitbit" },
        href: { it: "/it/sync/fitbit", en: "/en/sync/fitbit", de: "/de/sync/fitbit", pt: "/pt/sync/fitbit", fr: "/fr/sync/fitbit" },
      },
    },
    body: [
      {
        type: "paragraph",
        text: {
          it: "Dopo l'acquisizione Fitbit da parte di Google nel 2021 e la migrazione obbligatoria a Google Account nel 2023, l'esperienza Fitbit è cambiata: web dashboard rimosse, alcune feature spinte dietro Premium, accesso ai dati storici sempre più mediato dall'ecosystem Google. Se vuoi continuare a usare il tuo Fitbit ma con maggiore controllo dati, c'è una strada pulita: Health Connect + dashboard alternativa.",
          en: "After Google's 2021 Fitbit acquisition and the 2023 mandatory Google Account migration, the Fitbit experience changed: web dashboards removed, some features pushed behind Premium, access to historical data increasingly mediated by Google ecosystem. If you want to keep using your Fitbit with more data control, there's a clean path: Health Connect + alternative dashboard.",
          de: "Nach der Übernahme von Fitbit durch Google im Jahr 2021 und der obligatorischen Migration auf Google-Konten im Jahr 2023 hat sich die Fitbit-Erfahrung verändert: Web-Dashboards wurden entfernt, einige Funktionen hinter Premium verschoben, der Zugriff auf historische Daten zunehmend durch das Google-Ökosystem vermittelt. Wenn du Fitbit weiterhin mit mehr Datenkontrolle nutzen möchtest, gibt es einen sauberen Weg: Health Connect und ein alternatives Dashboard.",
          pt: "Após a aquisição do Fitbit pelo Google em 2021 e a migração obrigatória para a conta Google em 2023, a experiência Fitbit mudou: painéis web removidos, algumas funcionalidades colocadas atrás do Premium, acesso aos dados históricos cada vez mais mediado pelo ecossistema Google. Se você quer continuar usando o Fitbit com mais controle sobre seus dados, há um caminho limpo: Health Connect e painel alternativo.",
          fr: "Après l'acquisition de Fitbit par Google en 2021 et la migration obligatoire vers un compte Google en 2023, l'expérience Fitbit a changé : les tableaux de bord web ont été supprimés, certaines fonctionnalités placées derrière Premium, l'accès aux données historiques de plus en plus médiatisé par l'écosystème Google. Si vous souhaitez continuer à utiliser Fitbit avec plus de contrôle sur vos données, il existe une solution propre : Health Connect et un tableau de bord alternatif.",
        },
      },
      {
        type: "heading",
        level: 2,
        text: { it: "Cosa otteni con FitMesh Sync", en: "What you get with FitMesh Sync", de: "Was du mit FitMesh Sync bekommst", pt: "O que você obtém com FitMesh Sync", fr: "Ce que vous obtenez avec FitMesh Sync" },
      },
      {
        type: "list",
        items: {
          it: [
            "Dashboard web pulita accessibile da PC, tablet, telefono",
            "Sync automatico via Health Connect (Fitbit app → HC → FitMesh)",
            "Storico locale archiviato sul nostro backend EU (Frankfurt)",
            "Export dati in CSV/JSON quando vuoi",
            "Niente Fitbit Premium, niente subscription FitMesh subscription-based",
            "Roadmap: integrazione OAuth Fitbit Web API per sleep stages dettagliate e backfill 12 mesi",
          ],
          en: [
            "Clean web dashboard accessible from PC, tablet, phone",
            "Automatic sync via Health Connect (Fitbit app → HC → FitMesh)",
            "Local history stored on our EU backend (Frankfurt)",
            "CSV/JSON data export whenever",
            "No Fitbit Premium, no FitMesh subscription",
            "Roadmap: Fitbit Web API OAuth integration for detailed sleep stages and 12-month backfill",
          ],
          de: [
            "Übersichtliches Web-Dashboard, zugänglich von PC, Tablet und Smartphone",
            "Automatische Synchronisierung via Health Connect (Fitbit App → HC → FitMesh)",
            "Lokaler Verlauf auf unserem EU-Backend (Frankfurt) gespeichert",
            "Datenexport als CSV/JSON, wann immer du möchtest",
            "Kein Fitbit Premium, kein FitMesh-Abonnement",
            "Roadmap: OAuth Fitbit Web API-Integration für detaillierte Schlafphasen und 12-Monate-Backfill",
          ],
          pt: [
            "Painel web limpo acessível de PC, tablet e celular",
            "Sincronização automática via Health Connect (app Fitbit → HC → FitMesh)",
            "Histórico local armazenado no nosso backend EU (Frankfurt)",
            "Export de dados em CSV/JSON quando quiser",
            "Sem Fitbit Premium, sem assinatura FitMesh",
            "Roadmap: integração OAuth Fitbit Web API para fases do sono detalhadas e backfill de 12 meses",
          ],
          fr: [
            "Tableau de bord web clair accessible depuis PC, tablette et téléphone",
            "Synchronisation automatique via Health Connect (app Fitbit → HC → FitMesh)",
            "Historique local stocké sur notre backend EU (Frankfurt)",
            "Export des données en CSV/JSON quand vous le souhaitez",
            "Sans Fitbit Premium, sans abonnement FitMesh",
            "Feuille de route : intégration OAuth Fitbit Web API pour les phases de sommeil détaillées et le backfill 12 mois",
          ],
        },
      },
      {
        type: "heading",
        level: 2,
        text: { it: "Funziona con qualsiasi Fitbit moderno", en: "Works with any modern Fitbit", de: "Funktioniert mit jedem modernen Fitbit", pt: "Funciona com qualquer Fitbit moderno", fr: "Fonctionne avec n'importe quel Fitbit récent" },
      },
      {
        type: "paragraph",
        text: {
          it: "Charge 5/6, Inspire 3, Sense 2, Versa 4, Luxe, Ace, e Pixel Watch (1, 2, 3): tutti funzionano oggi via il bridge automatico Fitbit app → Health Connect. Setup di 5 minuti, una volta sola.",
          en: "Charge 5/6, Inspire 3, Sense 2, Versa 4, Luxe, Ace, and Pixel Watch (1, 2, 3): all work today via the automatic Fitbit app → Health Connect bridge. 5-minute setup, once.",
          de: "Charge 5/6, Inspire 3, Sense 2, Versa 4, Luxe, Ace und Pixel Watch (1, 2, 3): alle funktionieren heute über die automatische Bridge Fitbit App → Health Connect. Einmalige Einrichtung in 5 Minuten.",
          pt: "Charge 5/6, Inspire 3, Sense 2, Versa 4, Luxe, Ace e Pixel Watch (1, 2, 3): todos funcionam hoje via o bridge automático Fitbit app → Health Connect. Configuração de 5 minutos, uma única vez.",
          fr: "Charge 5/6, Inspire 3, Sense 2, Versa 4, Luxe, Ace et Pixel Watch (1, 2, 3) : tous fonctionnent aujourd'hui via le pont automatique app Fitbit → Health Connect. Configuration de 5 minutes, une seule fois.",
        },
      },
      {
        type: "callout",
        variant: "info",
        title: { it: "Per chi stessa per lasciare Fitbit", en: "If you're about to leave Fitbit", de: "Wenn du Fitbit gerade verlassen möchtest", pt: "Se você está prestes a deixar o Fitbit", fr: "Si vous êtes sur le point de quitter Fitbit" },
        body: {
          it: "Anche se hai deciso di passare a Garmin, Apple Watch o Galaxy Watch, conviene salvare lo storico Fitbit ora. FitMesh tiene una copia sul tuo account, accessibile anche dopo che hai chiuso quello Fitbit/Google.",
          en: "Even if you've decided to switch to Garmin, Apple Watch or Galaxy Watch, save your Fitbit history now. FitMesh keeps a copy on your account, accessible even after you close your Fitbit/Google one.",
          de: "Auch wenn du dich entschieden hast, zu Garmin, Apple Watch oder Galaxy Watch zu wechseln, lohnt es sich, deinen Fitbit-Verlauf jetzt zu sichern. FitMesh bewahrt eine Kopie in deinem Konto, die auch nach dem Schließen deines Fitbit/Google-Kontos zugänglich bleibt.",
          pt: "Mesmo que você tenha decidido migrar para Garmin, Apple Watch ou Galaxy Watch, vale a pena salvar seu histórico do Fitbit agora. FitMesh guarda uma cópia na sua conta, acessível mesmo depois de fechar a conta Fitbit/Google.",
          fr: "Même si vous avez décidé de passer à Garmin, Apple Watch ou Galaxy Watch, il vaut la peine de sauvegarder votre historique Fitbit maintenant. FitMesh en conserve une copie sur votre compte, accessible même après la fermeture de votre compte Fitbit/Google.",
        },
      },
      {
        type: "cta",
        title: {
          it: "Riprendi controllo del tuo Fitbit",
          en: "Take back control of your Fitbit",
          de: "Nimm die Kontrolle über dein Fitbit zurück",
          pt: "Retome o controle do seu Fitbit",
          fr: "Reprenez le contrôle de votre Fitbit",
        },
        body: {
          it: "Gratis durante la beta per i primi 100 founder. App Android + dashboard web.",
          en: "Free during beta for the first 100 founders. Android app + web dashboard.",
          de: "Kostenlos während der Beta für die ersten 100 Founder. Android-App und Web-Dashboard.",
          pt: "Grátis durante a beta para os primeiros 100 founders. App Android e painel web.",
          fr: "Gratuit pendant la bêta pour les 100 premiers founders. Application Android et tableau de bord web.",
        },
        ctaLabel: { it: "Entra in beta →", en: "Join beta →", de: "Zur Beta →", pt: "Entrar na beta →", fr: "Rejoindre la bêta →" },
        ctaHref: { it: "/it/beta", en: "/en/beta", de: "/de/beta", pt: "/pt/beta", fr: "/fr/beta" },
      },
    ],
    faq: [
      {
        q: {
          it: "Vedo le fasi di sonno REM/Deep/Light?",
          en: "Do I see REM/Deep/Light sleep stages?",
          de: "Sehe ich die Schlafphasen REM/Tief/Leicht?",
          pt: "Verei as fases do sono REM/Profundo/Leve?",
          fr: "Vais-je voir les phases de sommeil REM/Profond/Léger ?",
        },
        a: {
          it: "Oggi via Health Connect Fitbit espone solo la durata totale del sonno. Le fasi dettagliate arriveranno con l'integrazione OAuth Fitbit Web API, prevista per Q3 2026. La data total è comunque visibile da subito.",
          en: "Today via Health Connect Fitbit only exposes total sleep duration. Detailed stages will arrive with the Fitbit Web API OAuth integration, planned for Q3 2026. Total duration is visible from day one.",
          de: "Aktuell gibt Fitbit via Health Connect nur die Gesamtschlafdauer weiter. Detaillierte Schlafphasen werden mit der Fitbit Web API OAuth-Integration verfügbar, die für Q3 2026 geplant ist. Die Gesamtdauer ist ab dem ersten Tag sichtbar.",
          pt: "Hoje, via Health Connect, o Fitbit expõe apenas a duração total do sono. As fases detalhadas chegarão com a integração OAuth da Fitbit Web API, prevista para o Q3 2026. A duração total já é visível desde o primeiro dia.",
          fr: "Aujourd'hui via Health Connect, Fitbit n'expose que la durée totale du sommeil. Les phases détaillées seront disponibles avec l'intégration OAuth Fitbit Web API, prévue pour le T3 2026. La durée totale est visible dès le premier jour.",
        },
      },
      {
        q: {
          it: "FitMesh può cancellare i miei dati se cambio idea?",
          en: "Can FitMesh delete my data if I change my mind?",
          de: "Kann FitMesh meine Daten löschen, wenn ich meine Meinung ändere?",
          pt: "O FitMesh pode excluir meus dados se eu mudar de ideia?",
          fr: "FitMesh peut-il supprimer mes données si je change d'avis ?",
        },
        a: {
          it: "Sì. Dalle impostazioni 'Elimina account e dati' cancella tutto dai nostri server. I dati nel cloud Fitbit/Google e sul tuo dispositivo restano intatti (puoi gestirli separatamente).",
          en: "Yes. Settings → 'Delete account and data' wipes everything from our servers. Data in Fitbit/Google cloud and on your device remains untouched (manage separately).",
          de: "Ja. Einstellungen → 'Konto und Daten löschen' entfernt alles von unseren Servern. Daten im Fitbit/Google-Cloud und auf deinem Gerät bleiben unberührt (diese kannst du separat verwalten).",
          pt: "Sim. Configurações → 'Excluir conta e dados' apaga tudo dos nossos servidores. Os dados no cloud Fitbit/Google e no seu dispositivo permanecem intactos (gerencie-os separadamente).",
          fr: "Oui. Paramètres → 'Supprimer le compte et les données' efface tout de nos serveurs. Les données dans le cloud Fitbit/Google et sur votre appareil restent intactes (à gérer séparément).",
        },
      },
      {
        q: {
          it: "Devo cancellare il Fitbit Account?",
          en: "Do I have to delete my Fitbit Account?",
          de: "Muss ich meinen Fitbit Account löschen?",
          pt: "Preciso excluir minha conta Fitbit?",
          fr: "Dois-je supprimer mon compte Fitbit ?",
        },
        a: {
          it: "No. FitMesh affianca, non sostituisce. Continuano a funzionare Fitbit app + le sue feature di sempre. FitMesh aggiunge solo la dashboard web alternativa e l'export.",
          en: "No. FitMesh adds to, doesn't replace. Fitbit app + all its existing features keep working. FitMesh just adds the alternative web dashboard and export.",
          de: "Nein. FitMesh ergänzt, ersetzt nicht. Die Fitbit-App und all ihre bestehenden Funktionen funktionieren weiterhin. FitMesh fügt nur das alternative Web-Dashboard und den Export hinzu.",
          pt: "Não. FitMesh complementa, não substitui. O app Fitbit e todos os seus recursos existentes continuam funcionando. FitMesh apenas adiciona o painel web alternativo e o export.",
          fr: "Non. FitMesh complète, ne remplace pas. L'application Fitbit et toutes ses fonctionnalités continuent de fonctionner. FitMesh ajoute simplement le tableau de bord web alternatif et l'export.",
        },
      },
    ],
    brandsMentioned: ["Fitbit", "Google"],
  },

  // ── 3. Garmin Connect PC ──────────────────────────────────────────────
  {
    slug: "garmin-connect-pc",
    relatedProvider: "garmin",
    publishedAt: "2026-05-21",
    updatedAt: "2026-05-21",
    primaryKeyword: {
      it: "garmin connect pc",
      en: "garmin connect pc",
      de: "Garmin Connect PC",
      pt: "garmin connect pc",
      fr: "garmin connect pc",
    },
    secondaryKeywords: {
      it: ["dashboard garmin browser", "garmin connect alternativa", "vedere dati garmin"],
      en: ["garmin dashboard browser", "garmin connect alternative", "view garmin data"],
    },
    metaDescription: {
      it: "Dashboard Garmin alternativa accessibile da PC, in aggiunta a Garmin Connect web. Cross-sync con Galaxy Watch, Oura, Fitbit. Setup via Health Connect.",
      en: "Alternative Garmin dashboard accessible from PC, in addition to Garmin Connect web. Cross-sync with Galaxy Watch, Oura, Fitbit. Setup via Health Connect.",
      de: "Alternatives Garmin-Dashboard, zugänglich vom PC, zusätzlich zu Garmin Connect Web. Cross-Sync mit Galaxy Watch, Oura, Fitbit. Einrichtung via Health Connect.",
      pt: "Painel alternativo do Garmin acessível pelo PC, além do Garmin Connect web. Cross-sync com Galaxy Watch, Oura, Fitbit. Configuração via Health Connect.",
      fr: "Tableau de bord Garmin alternatif accessible depuis PC, en complément de Garmin Connect web. Synchronisation croisée avec Galaxy Watch, Oura, Fitbit. Configuration via Health Connect.",
    },
    hero: {
      kicker: { it: "Garmin su PC", en: "Garmin on PC", de: "Garmin auf dem PC", pt: "Garmin no PC", fr: "Garmin sur PC" },
      title: {
        it: "Garmin su una dashboard tua, accanto agli altri wearable",
        en: "Garmin on a dashboard you own, alongside other wearables",
        de: "Garmin auf deinem eigenen Dashboard, neben anderen Wearables",
        pt: "Garmin em um painel seu, ao lado dos outros wearables",
        fr: "Garmin sur votre propre tableau de bord, aux côtés des autres appareils connectés",
      },
      subtitle: {
        it: "Garmin Connect web funziona, ma è isolato. Se hai anche un Galaxy Watch per la quotidianità o un Oura per il sonno, vuoi vederli insieme. FitMesh Sync li unifica.",
        en: "Garmin Connect web works, but it's isolated. If you also have a Galaxy Watch for daily wear or an Oura for sleep, you want them together. FitMesh Sync unifies them.",
        de: "Garmin Connect Web funktioniert, aber es ist isoliert. Wenn du auch eine Galaxy Watch für den Alltag oder einen Oura für den Schlaf hast, möchtest du sie zusammen sehen. FitMesh Sync vereint sie.",
        pt: "O Garmin Connect web funciona, mas é isolado. Se você também tem um Galaxy Watch para o dia a dia ou um Oura para o sono, quer vê-los juntos. FitMesh Sync os unifica.",
        fr: "Garmin Connect web fonctionne, mais il est isolé. Si vous avez aussi une Galaxy Watch pour le quotidien ou un Oura pour le sommeil, vous voulez les voir ensemble. FitMesh Sync les unifie.",
      },
      primaryCta: {
        label: { it: "Entra in beta gratis", en: "Join the free beta", de: "Kostenlos zur Beta", pt: "Entrar na beta grátis", fr: "Rejoindre la bêta gratuite" },
        href: { it: "/it/beta", en: "/en/beta", de: "/de/beta", pt: "/pt/beta", fr: "/fr/beta" },
      },
      secondaryCta: {
        label: { it: "Vedi integrazione Garmin", en: "See Garmin integration", de: "Garmin-Integration ansehen", pt: "Ver integração Garmin", fr: "Voir l'intégration Garmin" },
        href: { it: "/it/sync/garmin", en: "/en/sync/garmin", de: "/de/sync/garmin", pt: "/pt/sync/garmin", fr: "/fr/sync/garmin" },
      },
    },
    body: [
      {
        type: "paragraph",
        text: {
          it: "Garmin Connect è una delle migliori web dashboard wearable ancora in piedi nel 2026. Per chi usa solo Garmin va benissimo. Il problema arriva quando hai anche un Galaxy Watch (perché alla sera vuoi un orologio normale), un Oura Ring (perché segui meglio il sonno), o vuoi che i tuoi dati Garmin compaiano in un'app salute unificata. Garmin Connect è chiuso al suo silos.",
          en: "Garmin Connect is one of the best wearable web dashboards still standing in 2026. For Garmin-only users it's perfect. The problem comes when you also have a Galaxy Watch (because in the evening you want a regular watch), an Oura Ring (because you track sleep more carefully), or want your Garmin data to appear in a unified health app. Garmin Connect is closed to its silo.",
          de: "Garmin Connect ist eines der besten Wearable-Web-Dashboards, das 2026 noch existiert. Für reine Garmin-Nutzer ist es perfekt. Das Problem entsteht, wenn du auch eine Galaxy Watch hast (weil du abends eine normale Uhr willst), einen Oura Ring (weil du den Schlaf genauer verfolgst) oder deine Garmin-Daten in einer einheitlichen Health-App sehen möchtest. Garmin Connect bleibt in seinem eigenen Silo.",
          pt: "O Garmin Connect é um dos melhores painéis web para wearables ainda em pé em 2026. Para quem usa só Garmin, é perfeito. O problema aparece quando você também tem um Galaxy Watch (porque à noite quer um relógio normal), um Oura Ring (porque acompanha melhor o sono) ou quer que seus dados Garmin apareçam em um app de saúde unificado. O Garmin Connect é fechado no seu próprio silo.",
          fr: "Garmin Connect est l'un des meilleurs tableaux de bord web pour appareils connectés encore en activité en 2026. Pour les utilisateurs exclusifs de Garmin, c'est parfait. Le problème survient quand vous avez aussi une Galaxy Watch (parce que le soir vous voulez une montre classique), un Oura Ring (parce que vous suivez mieux votre sommeil) ou que vous voulez voir vos données Garmin dans une application de santé unifiée. Garmin Connect reste fermé dans son propre silo.",
        },
      },
      {
        type: "heading",
        level: 2,
        text: { it: "Cosa fa FitMesh con Garmin", en: "What FitMesh does with Garmin", de: "Was FitMesh mit Garmin macht", pt: "O que FitMesh faz com o Garmin", fr: "Ce que FitMesh fait avec Garmin" },
      },
      {
        type: "list",
        items: {
          it: [
            "Legge i dati Garmin via Health Connect (passi, BPM, sonno totale, calorie, distanza, allenamenti base): funziona oggi.",
            "Roadmap Q3 2026: integrazione OAuth Garmin Health API per Body Battery, Training Load, Recovery Time, Stress Score e GPS dettagliato.",
            "Dashboard web cross-source: Garmin a fianco di Galaxy Watch / Pixel Watch / Fitbit / Mi Band / Oura quando attivi.",
            "Esportazione CSV/JSON dei dati raccolti.",
          ],
          en: [
            "Reads Garmin data via Health Connect (steps, HR, total sleep, calories, distance, basic workouts): works today.",
            "Q3 2026 roadmap: Garmin Health API OAuth integration for Body Battery, Training Load, Recovery Time, Stress Score, and detailed GPS.",
            "Cross-source web dashboard: Garmin alongside Galaxy Watch / Pixel Watch / Fitbit / Mi Band / Oura when active.",
            "CSV/JSON export of collected data.",
          ],
          de: [
            "Liest Garmin-Daten via Health Connect (Schritte, BPM, Gesamtschlaf, Kalorien, Distanz, Basis-Trainings): funktioniert heute.",
            "Roadmap Q3 2026: OAuth-Integration der Garmin Health API für Body Battery, Training Load, Recovery Time, Stress Score und detailliertes GPS.",
            "Cross-Source-Web-Dashboard: Garmin neben Galaxy Watch / Pixel Watch / Fitbit / Mi Band / Oura, wenn aktiv.",
            "CSV/JSON-Export der gesammelten Daten.",
          ],
          pt: [
            "Lê dados do Garmin via Health Connect (passos, BPM, sono total, calorias, distância, treinos básicos): funciona hoje.",
            "Roadmap Q3 2026: integração OAuth da Garmin Health API para Body Battery, Training Load, Recovery Time, Stress Score e GPS detalhado.",
            "Painel web multi-fonte: Garmin ao lado de Galaxy Watch / Pixel Watch / Fitbit / Mi Band / Oura quando ativos.",
            "Export de dados em CSV/JSON.",
          ],
          fr: [
            "Lit les données Garmin via Health Connect (pas, BPM, sommeil total, calories, distance, séances de base) : fonctionne aujourd'hui.",
            "Feuille de route T3 2026 : intégration OAuth Garmin Health API pour Body Battery, Training Load, Recovery Time, Stress Score et GPS détaillé.",
            "Tableau de bord web multi-sources : Garmin aux côtés de Galaxy Watch / Pixel Watch / Fitbit / Mi Band / Oura lorsqu'ils sont actifs.",
            "Export des données collectées en CSV/JSON.",
          ],
        },
      },
      {
        type: "callout",
        variant: "tip",
        title: { it: "Per chi gestisce più wearable", en: "For multi-wearable users", de: "Für Nutzer mit mehreren Wearables", pt: "Para usuários com múltiplos wearables", fr: "Pour les utilisateurs multi-appareils" },
        body: {
          it: "Atleta con Garmin per gli allenamenti + Galaxy Watch per la quotidianità? Coppia Oura Ring di notte + Garmin di giorno? FitMesh ti dà una vista unica senza che tu debba scegliere.",
          en: "Athlete with Garmin for workouts + Galaxy Watch daily? Oura Ring at night + Garmin by day? FitMesh gives you a single view without forcing you to choose.",
          de: "Athleten mit Garmin für Trainings und Galaxy Watch im Alltag? Oura Ring nachts und Garmin tagsüber? FitMesh gibt dir eine einheitliche Ansicht, ohne dass du dich entscheiden musst.",
          pt: "Atleta com Garmin para os treinos e Galaxy Watch no dia a dia? Oura Ring à noite e Garmin durante o dia? FitMesh te dá uma visão única sem que você precise escolher.",
          fr: "Sportif avec Garmin pour les entraînements et Galaxy Watch au quotidien ? Oura Ring la nuit et Garmin le jour ? FitMesh vous offre une vue unifiée sans que vous ayez à choisir.",
        },
      },
      {
        type: "cta",
        title: {
          it: "Garmin + altri wearable, una dashboard sola",
          en: "Garmin + other wearables, one single dashboard",
          de: "Garmin + andere Wearables, ein einziges Dashboard",
          pt: "Garmin + outros wearables, um único painel",
          fr: "Garmin + autres appareils connectés, un seul tableau de bord",
        },
        body: {
          it: "Gratis durante la beta per i primi 100 founder. Funziona oggi via Health Connect.",
          en: "Free during beta for the first 100 founders. Works today via Health Connect.",
          de: "Kostenlos während der Beta für die ersten 100 Founder. Funktioniert heute via Health Connect.",
          pt: "Grátis durante a beta para os primeiros 100 founders. Funciona hoje via Health Connect.",
          fr: "Gratuit pendant la bêta pour les 100 premiers founders. Fonctionne aujourd'hui via Health Connect.",
        },
        ctaLabel: { it: "Entra in beta →", en: "Join beta →", de: "Zur Beta →", pt: "Entrar na beta →", fr: "Rejoindre la bêta →" },
        ctaHref: { it: "/it/beta", en: "/en/beta", de: "/de/beta", pt: "/pt/beta", fr: "/fr/beta" },
      },
    ],
    faq: [
      {
        q: {
          it: "Vedrò Body Battery e Training Load?",
          en: "Will I see Body Battery and Training Load?",
          de: "Werde ich Body Battery und Training Load sehen?",
          pt: "Verei Body Battery e Training Load?",
          fr: "Vais-je voir Body Battery et Training Load ?",
        },
        a: {
          it: "Non oggi: sono metriche proprietarie Garmin non esposte via Health Connect. Saranno disponibili con l'integrazione OAuth Garmin Health API, in roadmap per Q3 2026 (dipende dall'approvazione Garmin Developer Program).",
          en: "Not today: they're proprietary Garmin metrics not exposed via Health Connect. They'll be available with the Garmin Health API OAuth integration, on the Q3 2026 roadmap (depends on Garmin Developer Program approval).",
          de: "Nicht heute: Das sind proprietäre Garmin-Metriken, die nicht über Health Connect verfügbar sind. Sie werden mit der OAuth-Integration der Garmin Health API verfügbar, die für Q3 2026 geplant ist (abhängig von der Genehmigung des Garmin Developer Program).",
          pt: "Não hoje: são métricas proprietárias do Garmin não expostas via Health Connect. Estarão disponíveis com a integração OAuth da Garmin Health API, prevista para o Q3 2026 (sujeito à aprovação do Garmin Developer Program).",
          fr: "Pas aujourd'hui : ce sont des métriques propriétaires Garmin non exposées via Health Connect. Elles seront disponibles avec l'intégration OAuth Garmin Health API, prévue pour le T3 2026 (sous réserve de l'approbation du Garmin Developer Program).",
        },
      },
      {
        q: {
          it: "Quali Garmin sono supportati?",
          en: "Which Garmin watches are supported?",
          de: "Welche Garmin-Geräte werden unterstützt?",
          pt: "Quais dispositivos Garmin são compatíveis?",
          fr: "Quels appareils Garmin sont pris en charge ?",
        },
        a: {
          it: "Tutti i Garmin compatibili con Garmin Connect Android (dal 2018 in poi): Forerunner, Fenix, Epix, Venu, Vivoactive, Instinct, Vivosmart, Vivofit. Verifica che 'Sincronizza con Health Connect' sia attivo nelle impostazioni Garmin Connect.",
          en: "Every Garmin compatible with Garmin Connect Android (from 2018 onwards): Forerunner, Fenix, Epix, Venu, Vivoactive, Instinct, Vivosmart, Vivofit. Check that 'Sync with Health Connect' is enabled in Garmin Connect settings.",
          de: "Alle Garmin-Geräte, die mit Garmin Connect Android kompatibel sind (ab 2018): Forerunner, Fenix, Epix, Venu, Vivoactive, Instinct, Vivosmart, Vivofit. Prüfe, ob 'Mit Health Connect synchronisieren' in den Garmin Connect-Einstellungen aktiviert ist.",
          pt: "Todos os dispositivos Garmin compatíveis com o Garmin Connect Android (a partir de 2018): Forerunner, Fenix, Epix, Venu, Vivoactive, Instinct, Vivosmart, Vivofit. Verifique se 'Sincronizar com Health Connect' está ativado nas configurações do Garmin Connect.",
          fr: "Tous les appareils Garmin compatibles avec Garmin Connect Android (à partir de 2018) : Forerunner, Fenix, Epix, Venu, Vivoactive, Instinct, Vivosmart, Vivofit. Vérifiez que 'Synchroniser avec Health Connect' est activé dans les paramètres Garmin Connect.",
        },
      },
      {
        q: {
          it: "Sostituisce Garmin Connect?",
          en: "Does it replace Garmin Connect?",
          de: "Ersetzt es Garmin Connect?",
          pt: "Substitui o Garmin Connect?",
          fr: "Cela remplace-t-il Garmin Connect ?",
        },
        a: {
          it: "No, è complementare. Garmin Connect è il punto di riferimento per analisi Garmin-specifiche (Training Effect, Recovery Time, mappe GPS). FitMesh affianca una vista cross-source per chi ha più wearable.",
          en: "No, it's complementary. Garmin Connect remains the reference for Garmin-specific analysis (Training Effect, Recovery Time, GPS maps). FitMesh adds a cross-source view for multi-wearable users.",
          de: "Nein, es ergänzt ihn. Garmin Connect bleibt die Referenz für Garmin-spezifische Analysen (Training Effect, Recovery Time, GPS-Karten). FitMesh ergänzt eine Cross-Source-Ansicht für Nutzer mit mehreren Wearables.",
          pt: "Não, é complementar. O Garmin Connect continua sendo a referência para análises específicas do Garmin (Training Effect, Recovery Time, mapas GPS). FitMesh adiciona uma visão multi-fonte para usuários com vários wearables.",
          fr: "Non, c'est complémentaire. Garmin Connect reste la référence pour les analyses spécifiques à Garmin (Training Effect, Recovery Time, cartes GPS). FitMesh ajoute une vue multi-sources pour les utilisateurs de plusieurs appareils connectés.",
        },
      },
    ],
    brandsMentioned: ["Garmin", "Samsung", "Google", "Fitbit", "Oura", "Xiaomi"],
  },

  // ── 4. Oura Ring Sync ─────────────────────────────────────────────────
  {
    slug: "oura-ring-sync",
    relatedProvider: "oura",
    publishedAt: "2026-05-30",
    updatedAt: "2026-05-30",
    primaryKeyword: {
      it: "sync dati oura ring",
      en: "sync oura ring data",
      de: "Oura Ring synchronisieren",
      pt: "sincronizar dados oura ring",
      fr: "synchroniser données oura ring",
    },
    secondaryKeywords: {
      it: [
        "oura ring dashboard web",
        "esportare dati oura",
        "oura ring senza abbonamento",
        "oura ring health connect",
      ],
      en: [
        "oura ring web dashboard",
        "export oura data",
        "oura ring without subscription",
        "oura ring health connect android",
      ],
    },
    metaDescription: {
      it: "Dashboard web per Oura Ring: sincronizza sonno, HRV e recupero su una piattaforma tua, senza dipendere dall'app Oura. Setup via Health Connect su Android.",
      en: "Web dashboard for Oura Ring: sync sleep, HRV and recovery to a platform you own, without depending on the Oura app. Health Connect setup on Android.",
      de: "Web-Dashboard für Oura Ring: synchronisiere Schlaf, HRV und Erholung auf einer Plattform, die dir gehört, ohne von der Oura-App abhängig zu sein. Einrichtung via Health Connect auf Android.",
      pt: "Painel web para Oura Ring: sincronize sono, HRV e recuperação em uma plataforma sua, sem depender do app Oura. Configuração via Health Connect no Android.",
      fr: "Tableau de bord web pour Oura Ring : synchronisez sommeil, HRV et récupération sur une plateforme qui vous appartient, sans dépendre de l'application Oura. Configuration via Health Connect sur Android.",
    },
    hero: {
      kicker: { it: "Oura Ring + FitMesh", en: "Oura Ring + FitMesh", de: "Oura Ring + FitMesh", pt: "Oura Ring + FitMesh", fr: "Oura Ring + FitMesh" },
      title: {
        it: "Dashboard web per Oura Ring: sonno e recupero fuori dal silo Oura",
        en: "Web dashboard for Oura Ring: sleep and recovery outside the Oura silo",
        de: "Web-Dashboard für Oura Ring: Schlaf und Erholung außerhalb des Oura-Silos",
        pt: "Painel web para Oura Ring: sono e recuperação fora do silo Oura",
        fr: "Tableau de bord web pour Oura Ring : sommeil et récupération hors du silo Oura",
      },
      subtitle: {
        it: "Oura è tra i migliori anelli smart per sonno e recupero, ma i tuoi dati stanno chiusi nell'app Oura. Con FitMesh puoi vederli su web insieme agli altri wearable.",
        en: "Oura is among the best smart rings for sleep and recovery, but your data is locked in the Oura app. With FitMesh you can view it on the web alongside your other wearables.",
        de: "Oura gehört zu den besten Smart-Ringen für Schlaf und Erholung, aber deine Daten bleiben in der Oura-App gesperrt. Mit FitMesh kannst du sie im Web zusammen mit deinen anderen Wearables ansehen.",
        pt: "Oura está entre os melhores anéis inteligentes para sono e recuperação, mas seus dados ficam presos no app Oura. Com FitMesh você pode vê-los na web junto com os outros wearables.",
        fr: "Oura est parmi les meilleures bagues connectées pour le sommeil et la récupération, mais vos données restent enfermées dans l'application Oura. Avec FitMesh, vous pouvez les voir sur le web aux côtés de vos autres appareils.",
      },
      primaryCta: {
        label: { it: "Entra in beta gratis", en: "Join the free beta", de: "Kostenlos zur Beta", pt: "Entrar na beta grátis", fr: "Rejoindre la bêta gratuite" },
        href: { it: "/it/beta", en: "/en/beta", de: "/de/beta", pt: "/pt/beta", fr: "/fr/beta" },
      },
      secondaryCta: {
        label: { it: "Vedi integrazione Oura", en: "See Oura integration", de: "Oura-Integration ansehen", pt: "Ver integração Oura", fr: "Voir l'intégration Oura" },
        href: { it: "/it/sync/oura", en: "/en/sync/oura", de: "/de/sync/oura", pt: "/pt/sync/oura", fr: "/fr/sync/oura" },
      },
    },
    body: [
      {
        type: "paragraph",
        text: {
          it: "Oura Ring è apprezzato da atleti, biohacker e chi vuole monitorare sonno e recupero in modo discreto: niente schermo, niente notifiche, solo sensori. Il problema classico: i dati di Oura rimangono nell'app Oura e nel cloud Oura. Se vuoi vederli su PC, confrontarli con i dati del tuo Galaxy Watch, o avere un backup indipendente, non hai opzioni native facili.",
          en: "Oura Ring is loved by athletes, biohackers, and anyone who wants to monitor sleep and recovery discreetly: no screen, no notifications, just sensors. The classic problem: Oura data stays in the Oura app and Oura cloud. If you want to view it on a PC, compare it with your Galaxy Watch data, or have an independent backup, there are no easy native options.",
          de: "Der Oura Ring wird von Athleten, Biohackern und allen geschätzt, die Schlaf und Erholung diskret überwachen möchten: kein Bildschirm, keine Benachrichtigungen, nur Sensoren. Das klassische Problem: Oura-Daten bleiben in der Oura-App und in der Oura-Cloud. Wenn du sie auf dem PC ansehen, mit deinen Galaxy Watch-Daten vergleichen oder ein unabhängiges Backup haben möchtest, gibt es keine einfachen nativen Optionen.",
          pt: "O Oura Ring é muito apreciado por atletas, biohackers e quem quer monitorar sono e recuperação de forma discreta: sem tela, sem notificações, apenas sensores. O problema clássico: os dados do Oura ficam no app Oura e na nuvem Oura. Se você quer vê-los no PC, comparar com os dados do seu Galaxy Watch ou ter um backup independente, não há opções nativas fáceis.",
          fr: "L'Oura Ring est apprécié des athlètes, biohackers et de quiconque souhaite surveiller sommeil et récupération discrètement : pas d'écran, pas de notifications, juste des capteurs. Le problème classique : les données Oura restent dans l'application Oura et le cloud Oura. Si vous voulez les consulter sur PC, les comparer avec vos données Galaxy Watch ou disposer d'une sauvegarde indépendante, il n'existe pas d'option native simple.",
        },
      },
      {
        type: "heading",
        level: 2,
        text: {
          it: "Come funziona oggi: Oura → Health Connect → FitMesh",
          en: "How it works today: Oura → Health Connect → FitMesh",
          de: "So funktioniert es heute: Oura → Health Connect → FitMesh",
          pt: "Como funciona hoje: Oura → Health Connect → FitMesh",
          fr: "Comment ça fonctionne aujourd'hui : Oura → Health Connect → FitMesh",
        },
      },
      {
        type: "paragraph",
        text: {
          it: "L'app Oura su Android scrive alcuni dati su Health Connect: passi, calorie, sonno (durata totale e fasi base). FitMesh legge da Health Connect, quindi riceve questi dati automaticamente una volta che il collegamento è configurato.",
          en: "The Oura app on Android writes some data to Health Connect: steps, calories, sleep (total duration and basic stages). FitMesh reads from Health Connect, so it receives this data automatically once the connection is configured.",
          de: "Die Oura-App auf Android schreibt einige Daten in Health Connect: Schritte, Kalorien, Schlaf (Gesamtdauer und Basisphasen). FitMesh liest aus Health Connect, sodass es diese Daten automatisch empfängt, sobald die Verbindung konfiguriert ist.",
          pt: "O app Oura no Android escreve alguns dados no Health Connect: passos, calorias, sono (duração total e fases básicas). FitMesh lê do Health Connect, então recebe esses dados automaticamente assim que a conexão é configurada.",
          fr: "L'application Oura sur Android écrit certaines données dans Health Connect : pas, calories, sommeil (durée totale et phases de base). FitMesh lit depuis Health Connect, il reçoit donc ces données automatiquement une fois la connexion configurée.",
        },
      },
      {
        type: "list",
        items: {
          it: [
            "**Disponibile oggi via Health Connect**: passi, calorie, sonno totale con fasi (Profondo, REM, Leggero, Sveglio)",
            "**In roadmap**: integrazione diretta Oura API per Readiness Score, HRV dettagliato, temperature corporea notturna, SpO2 trend",
          ],
          en: [
            "**Available today via Health Connect**: steps, calories, total sleep with stages (Deep, REM, Light, Awake)",
            "**In roadmap**: direct Oura API integration for Readiness Score, detailed HRV, nightly body temperature, SpO2 trend",
          ],
          de: [
            "**Heute verfügbar via Health Connect**: Schritte, Kalorien, Gesamtschlaf mit Phasen (Tiefschlaf, REM, Leichtschlaf, Wach)",
            "**In der Roadmap**: direkte Oura API-Integration für Readiness Score, detailliertes HRV, nächtliche Körpertemperatur, SpO₂-Trend",
          ],
          pt: [
            "**Disponível hoje via Health Connect**: passos, calorias, sono total com fases (Profundo, REM, Leve, Acordado)",
            "**Em roadmap**: integração direta com a API Oura para Readiness Score, HRV detalhado, temperatura corporal noturna, tendência de SpO₂",
          ],
          fr: [
            "**Disponible aujourd'hui via Health Connect** : pas, calories, sommeil total avec phases (Profond, REM, Léger, Éveillé)",
            "**En feuille de route** : intégration directe de l'API Oura pour le Readiness Score, HRV détaillé, température corporelle nocturne, tendance SpO₂",
          ],
        },
      },
      {
        type: "heading",
        level: 2,
        text: {
          it: "Setup in 4 passi",
          en: "Setup in 4 steps",
          de: "Einrichtung in 4 Schritten",
          pt: "Configuração em 4 passos",
          fr: "Configuration en 4 étapes",
        },
      },
      {
        type: "list",
        ordered: true,
        items: {
          it: [
            "Installa **FitMesh Sync** dal Play Store e accedi con Google.",
            "Apri l'**app Oura** su Android → Impostazioni → Health Connect → abilita la sincronizzazione per Sonno, Passi, Calorie.",
            "In **Health Connect** → Accesso app e dati → FitMesh Sync → concedi accesso in lettura per Sonno, Passi, Calorie, Frequenza cardiaca.",
            "Apri la **dashboard FitMesh** su web: i tuoi dati Oura sono lì accanto agli altri wearable.",
          ],
          en: [
            "Install **FitMesh Sync** from the Play Store and sign in with Google.",
            "Open the **Oura app** on Android → Settings → Health Connect → enable sync for Sleep, Steps, Calories.",
            "In **Health Connect** → App permissions → FitMesh Sync → grant read access for Sleep, Steps, Calories, Heart Rate.",
            "Open the **FitMesh dashboard** on the web: your Oura data is there alongside other wearables.",
          ],
          de: [
            "Installiere **FitMesh Sync** aus dem Play Store und melde dich mit Google an.",
            "Öffne die **Oura-App** auf Android → Einstellungen → Health Connect → aktiviere die Synchronisierung für Schlaf, Schritte, Kalorien.",
            "In **Health Connect** → App-Zugriff und Daten → FitMesh Sync → erteile Lesezugriff für Schlaf, Schritte, Kalorien, Herzfrequenz.",
            "Öffne das **FitMesh-Dashboard** im Web: Deine Oura-Daten sind dort, neben anderen Wearables.",
          ],
          pt: [
            "Instale o **FitMesh Sync** na Play Store e entre com o Google.",
            "Abra o **app Oura** no Android → Configurações → Health Connect → ative a sincronização para Sono, Passos, Calorias.",
            "Em **Health Connect** → Permissões de apps → FitMesh Sync → conceda acesso de leitura para Sono, Passos, Calorias, Frequência cardíaca.",
            "Abra o **painel FitMesh** na web: seus dados do Oura estão lá, ao lado dos outros wearables.",
          ],
          fr: [
            "Installez **FitMesh Sync** depuis le Play Store et connectez-vous avec Google.",
            "Ouvrez l'**application Oura** sur Android → Paramètres → Health Connect → activez la synchronisation pour Sommeil, Pas, Calories.",
            "Dans **Health Connect** → Accès des applications → FitMesh Sync → accordez l'accès en lecture pour Sommeil, Pas, Calories, Fréquence cardiaque.",
            "Ouvrez le **tableau de bord FitMesh** sur le web : vos données Oura sont là, aux côtés de vos autres appareils.",
          ],
        },
      },
      {
        type: "callout",
        variant: "tip",
        title: {
          it: "Multi-wearable: Oura + Galaxy Watch insieme",
          en: "Multi-wearable: Oura + Galaxy Watch together",
          de: "Multi-Wearable: Oura + Galaxy Watch zusammen",
          pt: "Multi-wearable: Oura + Galaxy Watch juntos",
          fr: "Multi-appareils : Oura + Galaxy Watch ensemble",
        },
        body: {
          it: "Molti usano Oura di notte (per sonno e recupero) e un Galaxy Watch o Garmin di giorno (per sport e notifiche). FitMesh unifica tutti e due in una dashboard: il tuo Readiness Score Oura (quando disponibile via API) insieme ai passi e agli allenamenti del Watch.",
          en: "Many people use Oura at night (for sleep and recovery) and a Galaxy Watch or Garmin during the day (for sport and notifications). FitMesh unifies both in one dashboard: your Oura Readiness Score (when available via API) alongside Watch steps and workouts.",
          de: "Viele nutzen Oura nachts (für Schlaf und Erholung) und eine Galaxy Watch oder Garmin tagsüber (für Sport und Benachrichtigungen). FitMesh vereint beide in einem Dashboard: deinen Oura Readiness Score (wenn über API verfügbar) zusammen mit den Schritten und Trainings der Watch.",
          pt: "Muitas pessoas usam Oura à noite (para sono e recuperação) e um Galaxy Watch ou Garmin durante o dia (para esporte e notificações). FitMesh unifica os dois em um painel: seu Oura Readiness Score (quando disponível via API) junto com os passos e treinos do Watch.",
          fr: "Beaucoup utilisent Oura la nuit (pour le sommeil et la récupération) et une Galaxy Watch ou Garmin pendant la journée (pour le sport et les notifications). FitMesh les unifie dans un tableau de bord : votre Oura Readiness Score (lorsque disponible via API) avec les pas et séances d'entraînement de la montre.",
        },
      },
      {
        type: "cta",
        title: {
          it: "Tieni i tuoi dati Oura su una piattaforma tua",
          en: "Keep your Oura data on a platform you own",
          de: "Behalte deine Oura-Daten auf einer Plattform, die dir gehört",
          pt: "Mantenha seus dados Oura em uma plataforma sua",
          fr: "Gardez vos données Oura sur une plateforme qui vous appartient",
        },
        body: {
          it: "100 posti founder gratis durante la beta. App Android + dashboard web. Sync automatico da Oura via Health Connect, roadmap API Oura per metriche avanzate.",
          en: "100 free founder seats during beta. Android app + web dashboard. Automatic sync from Oura via Health Connect, Oura API roadmap for advanced metrics.",
          de: "100 kostenlose Founder-Plätze während der Beta. Android-App und Web-Dashboard. Automatische Synchronisierung von Oura via Health Connect, Oura API-Roadmap für erweiterte Metriken.",
          pt: "100 vagas founder grátis durante a beta. App Android e painel web. Sincronização automática do Oura via Health Connect, roadmap da API Oura para métricas avançadas.",
          fr: "100 places founder gratuites pendant la bêta. Application Android et tableau de bord web. Synchronisation automatique depuis Oura via Health Connect, feuille de route API Oura pour les métriques avancées.",
        },
        ctaLabel: { it: "Entra in beta →", en: "Join beta →", de: "Zur Beta →", pt: "Entrar na beta →", fr: "Rejoindre la bêta →" },
        ctaHref: { it: "/it/beta", en: "/en/beta", de: "/de/beta", pt: "/pt/beta", fr: "/fr/beta" },
      },
    ],
    faq: [
      {
        q: {
          it: "Vedrò il Readiness Score di Oura?",
          en: "Will I see Oura's Readiness Score?",
          de: "Werde ich den Oura Readiness Score sehen?",
          pt: "Verei o Readiness Score do Oura?",
          fr: "Vais-je voir le Readiness Score d'Oura ?",
        },
        a: {
          it: "Non oggi: il Readiness Score è una metrica proprietaria Oura non esposta via Health Connect. È in roadmap con l'integrazione OAuth dell'API Oura. Oggi via HC vedi sonno con fasi, passi e calorie.",
          en: "Not today: Readiness Score is a proprietary Oura metric not exposed via Health Connect. It's on the roadmap with OAuth Oura API integration. Today via HC you see sleep with stages, steps, and calories.",
          de: "Nicht heute: Der Readiness Score ist eine proprietäre Oura-Metrik, die nicht über Health Connect verfügbar ist. Er ist in der Roadmap mit der OAuth Oura API-Integration. Heute siehst du via Health Connect Schlaf mit Phasen, Schritte und Kalorien.",
          pt: "Não hoje: o Readiness Score é uma métrica proprietária do Oura não exposta via Health Connect. Está na roadmap com a integração OAuth da API Oura. Hoje via Health Connect você vê sono com fases, passos e calorias.",
          fr: "Pas aujourd'hui : le Readiness Score est une métrique propriétaire Oura non exposée via Health Connect. Il est prévu dans la feuille de route avec l'intégration OAuth de l'API Oura. Aujourd'hui via Health Connect, vous voyez le sommeil avec ses phases, les pas et les calories.",
        },
      },
      {
        q: {
          it: "Funziona con Oura Ring 3 e 4?",
          en: "Does it work with Oura Ring 3 and 4?",
          de: "Funktioniert es mit Oura Ring 3 und 4?",
          pt: "Funciona com o Oura Ring 3 e 4?",
          fr: "Fonctionne-t-il avec Oura Ring 3 et 4 ?",
        },
        a: {
          it: "Sì, entrambe le generazioni supportano Health Connect via app Oura su Android. L'Oura Ring 4 ha sensori migliorati per temperatura corporea e SpO2: queste metriche avanzate saranno disponibili con l'integrazione API Oura in roadmap.",
          en: "Yes, both generations support Health Connect via the Oura Android app. Oura Ring 4 has improved sensors for body temperature and SpO2: these advanced metrics will be available with the roadmap Oura API integration.",
          de: "Ja, beide Generationen unterstützen Health Connect über die Oura Android-App. Der Oura Ring 4 verfügt über verbesserte Sensoren für Körpertemperatur und SpO₂: Diese erweiterten Metriken werden mit der Oura API-Integration in der Roadmap verfügbar.",
          pt: "Sim, ambas as gerações suportam Health Connect via app Oura no Android. O Oura Ring 4 tem sensores melhorados para temperatura corporal e SpO₂: essas métricas avançadas estarão disponíveis com a integração da API Oura prevista na roadmap.",
          fr: "Oui, les deux générations prennent en charge Health Connect via l'application Oura sur Android. L'Oura Ring 4 dispose de capteurs améliorés pour la température corporelle et SpO₂ : ces métriques avancées seront disponibles avec l'intégration API Oura prévue dans la feuille de route.",
        },
      },
      {
        q: {
          it: "Ho bisogno di abbonamento Oura per usare FitMesh?",
          en: "Do I need an Oura subscription to use FitMesh?",
          de: "Brauche ich ein Oura-Abonnement, um FitMesh zu verwenden?",
          pt: "Preciso de assinatura Oura para usar o FitMesh?",
          fr: "Ai-je besoin d'un abonnement Oura pour utiliser FitMesh ?",
        },
        a: {
          it: "Per i dati via Health Connect (che sono quelli disponibili oggi), no: Health Connect funziona indipendentemente dall'abbonamento Oura. Per le metriche avanzate tramite API Oura (Readiness Score, HRV dettagliato), potrebbe essere richiesto un account Oura attivo.",
          en: "For Health Connect data (available today), no: Health Connect works independently of Oura subscription. For advanced metrics via Oura API (Readiness Score, detailed HRV), an active Oura account may be required.",
          de: "Für die Daten via Health Connect (die heute verfügbar sind), nein: Health Connect funktioniert unabhängig vom Oura-Abonnement. Für erweiterte Metriken über die Oura API (Readiness Score, detailliertes HRV) könnte ein aktives Oura-Konto erforderlich sein.",
          pt: "Para os dados via Health Connect (disponíveis hoje), não: o Health Connect funciona independentemente da assinatura Oura. Para métricas avançadas via API Oura (Readiness Score, HRV detalhado), pode ser necessário uma conta Oura ativa.",
          fr: "Pour les données via Health Connect (disponibles aujourd'hui), non : Health Connect fonctionne indépendamment de l'abonnement Oura. Pour les métriques avancées via l'API Oura (Readiness Score, HRV détaillé), un compte Oura actif pourrait être requis.",
        },
      },
    ],
    brandsMentioned: ["Oura", "Samsung", "Google", "Garmin"],
  },

  // ── 5. Polar Flow Sync ────────────────────────────────────────────────
  {
    slug: "polar-flow-sync",
    relatedProvider: "polar",
    publishedAt: "2026-05-30",
    updatedAt: "2026-05-30",
    primaryKeyword: {
      it: "sync dati polar flow",
      en: "export polar flow data",
      de: "Polar Flow Daten exportieren",
      pt: "exportar dados polar flow",
      fr: "exporter données polar flow",
    },
    secondaryKeywords: {
      it: [
        "polar flow dashboard alternativa",
        "esportare dati polar",
        "polar heart rate health connect",
        "polar ignite vantage dashboard web",
      ],
      en: [
        "polar flow alternative dashboard",
        "export polar data to web",
        "polar health connect android",
        "polar ignite vantage web dashboard",
      ],
    },
    metaDescription: {
      it: "Dashboard web per Polar Flow: sincronizza allenamenti, frequenza cardiaca e recupero Polar su una piattaforma tua. Setup via Health Connect su Android.",
      en: "Web dashboard for Polar Flow: sync Polar workouts, heart rate and recovery to a platform you own. Health Connect setup on Android.",
      de: "Web-Dashboard für Polar Flow: synchronisiere Polar-Trainings, Herzfrequenz und Erholung auf einer Plattform, die dir gehört. Einrichtung via Health Connect auf Android.",
      pt: "Painel web para Polar Flow: sincronize treinos, frequência cardíaca e recuperação do Polar em uma plataforma sua. Configuração via Health Connect no Android.",
      fr: "Tableau de bord web pour Polar Flow : synchronisez vos séances d'entraînement Polar, fréquence cardiaque et récupération sur une plateforme qui vous appartient. Configuration via Health Connect sur Android.",
    },
    hero: {
      kicker: { it: "Polar + FitMesh", en: "Polar + FitMesh", de: "Polar + FitMesh", pt: "Polar + FitMesh", fr: "Polar + FitMesh" },
      title: {
        it: "Dashboard web per Polar Flow: i tuoi dati Polar fuori dal silo",
        en: "Web dashboard for Polar Flow: your Polar data outside the silo",
        de: "Web-Dashboard für Polar Flow: Deine Polar-Daten außerhalb des Silos",
        pt: "Painel web para Polar Flow: seus dados Polar fora do silo",
        fr: "Tableau de bord web pour Polar Flow : vos données Polar hors du silo",
      },
      subtitle: {
        it: "Polar Flow è una piattaforma solida per atleti di endurance, ma i tuoi dati restano chiusi nel cloud Polar. FitMesh li porta su web insieme agli altri wearable.",
        en: "Polar Flow is a solid platform for endurance athletes, but your data stays locked in the Polar cloud. FitMesh brings it to the web alongside your other wearables.",
        de: "Polar Flow ist eine solide Plattform für Ausdauersportler, aber deine Daten bleiben im Polar-Cloud gesperrt. FitMesh bringt sie ins Web, zusammen mit deinen anderen Wearables.",
        pt: "O Polar Flow é uma plataforma sólida para atletas de endurance, mas seus dados ficam presos na nuvem Polar. FitMesh os traz para a web junto com os outros wearables.",
        fr: "Polar Flow est une plateforme solide pour les athlètes d'endurance, mais vos données restent enfermées dans le cloud Polar. FitMesh les amène sur le web aux côtés de vos autres appareils.",
      },
      primaryCta: {
        label: { it: "Entra in beta gratis", en: "Join the free beta", de: "Kostenlos zur Beta", pt: "Entrar na beta grátis", fr: "Rejoindre la bêta gratuite" },
        href: { it: "/it/beta", en: "/en/beta", de: "/de/beta", pt: "/pt/beta", fr: "/fr/beta" },
      },
      secondaryCta: {
        label: { it: "Vedi integrazione Polar", en: "See Polar integration", de: "Polar-Integration ansehen", pt: "Ver integração Polar", fr: "Voir l'intégration Polar" },
        href: { it: "/it/sync/polar", en: "/en/sync/polar", de: "/de/sync/polar", pt: "/pt/sync/polar", fr: "/fr/sync/polar" },
      },
    },
    body: [
      {
        type: "paragraph",
        text: {
          it: "Polar è storica nell'endurance sport: cardiofrequenzimetri, GPS per ciclismo e running, analisi del carico allenamento. Il problema comune è lo stesso di molti brand sportivi: i dati vivono in Polar Flow e in Polar Flow soltanto. Se hai anche un Galaxy Watch per la quotidianità, o vuoi vedere tutti i tuoi dati in un unico posto su PC, Polar non ti aiuta in modo nativo.",
          en: "Polar has a long history in endurance sport: heart rate monitors, GPS for cycling and running, training load analysis. The common problem is the same as many sports brands: data lives in Polar Flow and Polar Flow only. If you also have a Galaxy Watch for daily wear, or want all your data in one place on a PC, Polar doesn't help you natively.",
          de: "Polar hat eine lange Geschichte im Ausdauersport: Herzfrequenzmessgeräte, GPS für Radfahren und Laufen, Trainingsbelastungsanalyse. Das häufige Problem ist dasselbe wie bei vielen Sportmarken: Die Daten leben in Polar Flow und nur in Polar Flow. Wenn du auch eine Galaxy Watch für den Alltag hast oder alle deine Daten an einem Ort auf dem PC sehen möchtest, hilft Polar nicht von Haus aus.",
          pt: "Polar tem uma longa história no esporte de endurance: monitores de frequência cardíaca, GPS para ciclismo e corrida, análise de carga de treino. O problema comum é o mesmo de muitas marcas esportivas: os dados vivem no Polar Flow e apenas no Polar Flow. Se você também tem um Galaxy Watch para o dia a dia ou quer ver todos os seus dados em um único lugar no PC, o Polar não ajuda de forma nativa.",
          fr: "Polar a une longue histoire dans le sport d'endurance : moniteurs de fréquence cardiaque, GPS pour le cyclisme et la course, analyse de la charge d'entraînement. Le problème courant est le même que pour de nombreuses marques sportives : les données vivent dans Polar Flow et uniquement dans Polar Flow. Si vous avez aussi une Galaxy Watch pour le quotidien ou souhaitez voir toutes vos données en un seul endroit sur PC, Polar ne vous aide pas nativement.",
        },
      },
      {
        type: "heading",
        level: 2,
        text: {
          it: "Come funziona oggi: Polar → Health Connect → FitMesh",
          en: "How it works today: Polar → Health Connect → FitMesh",
          de: "So funktioniert es heute: Polar → Health Connect → FitMesh",
          pt: "Como funciona hoje: Polar → Health Connect → FitMesh",
          fr: "Comment ça fonctionne aujourd'hui : Polar → Health Connect → FitMesh",
        },
      },
      {
        type: "paragraph",
        text: {
          it: "L'app Polar Flow su Android sincronizza passi, frequenza cardiaca e allenamenti su Health Connect. FitMesh legge da Health Connect, quindi riceve questi dati in automatico.",
          en: "The Polar Flow app on Android syncs steps, heart rate, and workouts to Health Connect. FitMesh reads from Health Connect, so it receives this data automatically.",
          de: "Die Polar Flow-App auf Android synchronisiert Schritte, Herzfrequenz und Trainings mit Health Connect. FitMesh liest aus Health Connect und empfängt diese Daten dadurch automatisch.",
          pt: "O app Polar Flow no Android sincroniza passos, frequência cardíaca e treinos no Health Connect. FitMesh lê do Health Connect e recebe esses dados automaticamente.",
          fr: "L'application Polar Flow sur Android synchronise les pas, la fréquence cardiaque et les séances d'entraînement avec Health Connect. FitMesh lit depuis Health Connect et reçoit donc ces données automatiquement.",
        },
      },
      {
        type: "list",
        items: {
          it: [
            "**Disponibile oggi via Health Connect**: passi, frequenza cardiaca (media e campioni), calorie, allenamenti (tipo, durata, BPM medio, kcal), sonno base",
            "**In roadmap**: integrazione OAuth Polar Accesslink API per Training Load, Nightly Recharge, Recovery Pro, ortostasi",
          ],
          en: [
            "**Available today via Health Connect**: steps, heart rate (average and samples), calories, workouts (type, duration, average HR, kcal), basic sleep",
            "**In roadmap**: OAuth Polar Accesslink API integration for Training Load, Nightly Recharge, Recovery Pro, orthostatic test",
          ],
          de: [
            "**Heute verfügbar via Health Connect**: Schritte, Herzfrequenz (Durchschnitt und Messungen), Kalorien, Trainings (Typ, Dauer, Durchschnittspuls, kcal), Basisschlaf",
            "**In der Roadmap**: OAuth Polar Accesslink API-Integration für Training Load, Nightly Recharge, Recovery Pro, Orthostase-Test",
          ],
          pt: [
            "**Disponível hoje via Health Connect**: passos, frequência cardíaca (média e amostras), calorias, treinos (tipo, duração, BPM médio, kcal), sono básico",
            "**Em roadmap**: integração OAuth da API Polar Accesslink para Training Load, Nightly Recharge, Recovery Pro, teste ortostático",
          ],
          fr: [
            "**Disponible aujourd'hui via Health Connect** : pas, fréquence cardiaque (moyenne et mesures), calories, séances d'entraînement (type, durée, FC moyenne, kcal), sommeil de base",
            "**En feuille de route** : intégration OAuth API Polar Accesslink pour Training Load, Nightly Recharge, Recovery Pro, test orthostatique",
          ],
        },
      },
      {
        type: "heading",
        level: 2,
        text: {
          it: "Chi trae più vantaggio da questa integrazione",
          en: "Who benefits most from this integration",
          de: "Wer am meisten von dieser Integration profitiert",
          pt: "Quem se beneficia mais desta integração",
          fr: "Qui bénéficie le plus de cette intégration",
        },
      },
      {
        type: "list",
        items: {
          it: [
            "**Triatleti e runner con più device**: Polar per gli allenamenti specifici, Galaxy Watch o altro per la quotidianità: FitMesh li unifica.",
            "**Chi vuole backup indipendente da Polar**: storico allenamenti in un cloud europeo (Frankfurt) che non dipende da decision aziendali di Polar.",
            "**Chi analizza i dati su PC**: dashboard web accessibile da browser, senza aprire l'app Polar su telefono.",
            "**Chi usa Polar senza abbonamento premium**: FitMesh non richiede Polar premium per i dati via Health Connect.",
          ],
          en: [
            "**Triathletes and runners with multiple devices**: Polar for specific training, Galaxy Watch or other for daily wear: FitMesh unifies them.",
            "**Those wanting independent Polar backup**: workout history in a European cloud (Frankfurt) not dependent on Polar's corporate decisions.",
            "**Those who analyze data on PC**: browser-accessible web dashboard, without opening the Polar app on phone.",
            "**Those using Polar without premium subscription**: FitMesh doesn't require Polar premium for data via Health Connect.",
          ],
          de: [
            "**Triathleten und Läufer mit mehreren Geräten**: Polar für spezifische Trainings, Galaxy Watch oder anderes für den Alltag: FitMesh vereint sie.",
            "**Wer ein unabhängiges Polar-Backup möchte**: Trainingshistorie in einer europäischen Cloud (Frankfurt), die nicht von Polars Unternehmensentscheidungen abhängt.",
            "**Wer Daten auf dem PC analysiert**: über den Browser zugängliches Web-Dashboard, ohne die Polar-App auf dem Telefon zu öffnen.",
            "**Wer Polar ohne Premium-Abonnement nutzt**: FitMesh benötigt kein Polar-Premium für Daten via Health Connect.",
          ],
          pt: [
            "**Triatletas e corredores com vários dispositivos**: Polar para treinos específicos, Galaxy Watch ou outro para o dia a dia: FitMesh os unifica.",
            "**Quem quer backup independente do Polar**: histórico de treinos em uma nuvem europeia (Frankfurt) que não depende das decisões da empresa Polar.",
            "**Quem analisa dados no PC**: painel web acessível pelo navegador, sem abrir o app Polar no telefone.",
            "**Quem usa Polar sem assinatura premium**: FitMesh não requer Polar premium para dados via Health Connect.",
          ],
          fr: [
            "**Triathlètes et coureurs avec plusieurs appareils** : Polar pour les entraînements spécifiques, Galaxy Watch ou autre pour le quotidien : FitMesh les unifie.",
            "**Ceux qui souhaitent une sauvegarde indépendante de Polar** : historique des entraînements dans un cloud européen (Frankfurt) sans dépendre des décisions d'entreprise de Polar.",
            "**Ceux qui analysent les données sur PC** : tableau de bord web accessible depuis un navigateur, sans ouvrir l'application Polar sur le téléphone.",
            "**Ceux qui utilisent Polar sans abonnement premium** : FitMesh ne nécessite pas Polar premium pour les données via Health Connect.",
          ],
        },
      },
      {
        type: "callout",
        variant: "info",
        title: {
          it: "Polar Accesslink API è in roadmap",
          en: "Polar Accesslink API is in the roadmap",
          de: "Polar Accesslink API ist in der Roadmap",
          pt: "A API Polar Accesslink está na roadmap",
          fr: "L'API Polar Accesslink est dans la feuille de route",
        },
        body: {
          it: "Le metriche avanzate Polar (Training Load, Nightly Recharge, Recovery Pro) non passano via Health Connect: sono proprietarie. L'integrazione via Polar Accesslink API è in roadmap per Q4 2026, dipende dall'approvazione del Polar Developer Program.",
          en: "Advanced Polar metrics (Training Load, Nightly Recharge, Recovery Pro) don't pass via Health Connect: they're proprietary. Integration via Polar Accesslink API is in the Q4 2026 roadmap, subject to Polar Developer Program approval.",
          de: "Erweiterte Polar-Metriken (Training Load, Nightly Recharge, Recovery Pro) sind nicht über Health Connect verfügbar: Sie sind proprietär. Die Integration über die Polar Accesslink API ist für Q4 2026 in der Roadmap geplant, vorbehaltlich der Genehmigung des Polar Developer Program.",
          pt: "As métricas avançadas do Polar (Training Load, Nightly Recharge, Recovery Pro) não passam via Health Connect: são proprietárias. A integração via API Polar Accesslink está na roadmap para o Q4 2026, sujeita à aprovação do Polar Developer Program.",
          fr: "Les métriques avancées Polar (Training Load, Nightly Recharge, Recovery Pro) ne transitent pas via Health Connect : elles sont propriétaires. L'intégration via l'API Polar Accesslink est prévue dans la feuille de route pour le T4 2026, sous réserve de l'approbation du Polar Developer Program.",
        },
      },
      {
        type: "cta",
        title: {
          it: "I tuoi dati Polar su una dashboard tua",
          en: "Your Polar data on a dashboard you own",
          de: "Deine Polar-Daten auf einem Dashboard, das dir gehört",
          pt: "Seus dados Polar em um painel seu",
          fr: "Vos données Polar sur un tableau de bord qui vous appartient",
        },
        body: {
          it: "100 posti founder gratis durante la beta. App Android + dashboard web. Sync automatico da Polar Flow via Health Connect.",
          en: "100 free founder seats during beta. Android app + web dashboard. Automatic sync from Polar Flow via Health Connect.",
          de: "100 kostenlose Founder-Plätze während der Beta. Android-App und Web-Dashboard. Automatische Synchronisierung von Polar Flow via Health Connect.",
          pt: "100 vagas founder grátis durante a beta. App Android e painel web. Sincronização automática do Polar Flow via Health Connect.",
          fr: "100 places founder gratuites pendant la bêta. Application Android et tableau de bord web. Synchronisation automatique depuis Polar Flow via Health Connect.",
        },
        ctaLabel: { it: "Entra in beta →", en: "Join beta →", de: "Zur Beta →", pt: "Entrar na beta →", fr: "Rejoindre la bêta →" },
        ctaHref: { it: "/it/beta", en: "/en/beta", de: "/de/beta", pt: "/pt/beta", fr: "/fr/beta" },
      },
    ],
    faq: [
      {
        q: {
          it: "Quale Polar è compatibile?",
          en: "Which Polar devices are compatible?",
          de: "Welche Polar-Geräte sind kompatibel?",
          pt: "Quais dispositivos Polar são compatíveis?",
          fr: "Quels appareils Polar sont compatibles ?",
        },
        a: {
          it: "Tutti i dispositivi Polar compatibili con l'app Polar Flow su Android: Vantage M2, V3, Ignite 3, Pacer, Pacer Pro, Grit X2, Unite, e modelli precedenti. L'unico requisito è che la sincronizzazione avvenga tramite app Polar Flow su Android con Health Connect abilitato.",
          en: "All Polar devices compatible with the Polar Flow app on Android: Vantage M2, V3, Ignite 3, Pacer, Pacer Pro, Grit X2, Unite, and older models. The only requirement is sync happening via the Polar Flow Android app with Health Connect enabled.",
          de: "Alle Polar-Geräte, die mit der Polar Flow-App auf Android kompatibel sind: Vantage M2, V3, Ignite 3, Pacer, Pacer Pro, Grit X2, Unite und ältere Modelle. Die einzige Voraussetzung ist die Synchronisierung über die Polar Flow Android-App mit aktiviertem Health Connect.",
          pt: "Todos os dispositivos Polar compatíveis com o app Polar Flow no Android: Vantage M2, V3, Ignite 3, Pacer, Pacer Pro, Grit X2, Unite e modelos anteriores. O único requisito é que a sincronização aconteça pelo app Polar Flow no Android com Health Connect ativado.",
          fr: "Tous les appareils Polar compatibles avec l'application Polar Flow sur Android : Vantage M2, V3, Ignite 3, Pacer, Pacer Pro, Grit X2, Unite et modèles plus anciens. La seule condition est que la synchronisation se fasse via l'application Polar Flow sur Android avec Health Connect activé.",
        },
      },
      {
        q: {
          it: "Vedrò Training Load e Nightly Recharge?",
          en: "Will I see Training Load and Nightly Recharge?",
          de: "Werde ich Training Load und Nightly Recharge sehen?",
          pt: "Verei Training Load e Nightly Recharge?",
          fr: "Vais-je voir Training Load et Nightly Recharge ?",
        },
        a: {
          it: "Non oggi: sono metriche proprietarie Polar non esposte via Health Connect. Saranno disponibili con l'integrazione Polar Accesslink API in roadmap. Oggi via Health Connect vedi frequenza cardiaca, allenamenti, passi e sonno base.",
          en: "Not today: they're proprietary Polar metrics not exposed via Health Connect. They'll be available with the roadmap Polar Accesslink API integration. Today via Health Connect you see heart rate, workouts, steps, and basic sleep.",
          de: "Nicht heute: Das sind proprietäre Polar-Metriken, die nicht über Health Connect verfügbar sind. Sie werden mit der Polar Accesslink API-Integration in der Roadmap verfügbar. Heute siehst du via Health Connect Herzfrequenz, Trainings, Schritte und Basisschlaf.",
          pt: "Não hoje: são métricas proprietárias do Polar não expostas via Health Connect. Estarão disponíveis com a integração da API Polar Accesslink na roadmap. Hoje via Health Connect você vê frequência cardíaca, treinos, passos e sono básico.",
          fr: "Pas aujourd'hui : ce sont des métriques propriétaires Polar non exposées via Health Connect. Elles seront disponibles avec l'intégration de l'API Polar Accesslink dans la feuille de route. Aujourd'hui via Health Connect, vous voyez la fréquence cardiaque, les séances d'entraînement, les pas et le sommeil de base.",
        },
      },
      {
        q: {
          it: "Polar si sovrappone a Garmin? Quale scelgo?",
          en: "Does Polar overlap with Garmin? Which should I choose?",
          de: "Überschneidet sich Polar mit Garmin? Welches soll ich wählen?",
          pt: "Polar se sobrepõe ao Garmin? Qual escolho?",
          fr: "Polar chevauche-t-il Garmin ? Lequel choisir ?",
        },
        a: {
          it: "Dipende dal tuo uso principale. Polar è tradizionalmente forte in running e ciclismo con analisi cardio avanzata (zone HR, soglia lattato). Garmin è più completo per sport di outdoor e ha ecosystem più ampio. Entrambi si integrano con FitMesh via Health Connect, quindi puoi usarli in parallelo se hai device di entrambi i brand.",
          en: "Depends on your primary use. Polar is traditionally strong in running and cycling with advanced cardio analysis (HR zones, lactate threshold). Garmin is more complete for outdoor sports with a broader ecosystem. Both integrate with FitMesh via Health Connect, so you can use them in parallel if you have devices from both brands.",
          de: "Das hängt von deinem Haupteinsatz ab. Polar ist traditionell stark im Laufen und Radfahren mit fortgeschrittener Herzfrequenzanalyse (HF-Zonen, Laktatschwelle). Garmin ist umfassender für Outdoor-Sportarten mit einem breiteren Ökosystem. Beide integrieren sich mit FitMesh via Health Connect, sodass du sie parallel nutzen kannst, wenn du Geräte beider Marken hast.",
          pt: "Depende do seu uso principal. Polar é tradicionalmente forte em corrida e ciclismo com análise cardíaca avançada (zonas de FC, limiar de lactato). Garmin é mais completo para esportes ao ar livre com um ecossistema mais amplo. Ambos se integram com FitMesh via Health Connect, então você pode usá-los em paralelo se tiver dispositivos de ambas as marcas.",
          fr: "Cela dépend de votre usage principal. Polar est traditionnellement fort en course à pied et cyclisme avec une analyse cardiaque avancée (zones FC, seuil lactique). Garmin est plus complet pour les sports outdoor avec un écosystème plus large. Les deux s'intègrent avec FitMesh via Health Connect, vous pouvez donc les utiliser en parallèle si vous avez des appareils des deux marques.",
        },
      },
    ],
    brandsMentioned: ["Polar", "Samsung", "Google", "Garmin"],
  },

  // ── 7. Due telefoni, una salute (cross-device) ────────────────────────
  {
    slug: "due-telefoni",
    publishedAt: "2026-06-12",
    updatedAt: "2026-06-12",
    primaryKeyword: {
      it: "fitmesh su due telefoni",
      en: "fitmesh two phones one account",
      de: "FitMesh zwei Telefone ein Konto",
      pt: "fitmesh dois celulares uma conta",
      fr: "fitmesh deux téléphones un compte",
    },
    secondaryKeywords: {
      it: [
        "android e iphone stessa app salute",
        "sincronizzare dati salute android iphone",
        "colmi ring android iphone",
        "apple health android dati smartwatch",
        "bridge apple salute fitmesh",
        "dashboard salute multi-dispositivo",
      ],
      en: [
        "android iphone same health app",
        "sync health data android iphone",
        "colmi ring android iphone",
        "apple health android smartwatch data",
        "apple health bridge fitmesh",
        "multi device health dashboard",
      ],
    },
    metaDescription: {
      it: "Stesso account FitMesh su Android e iPhone: una dashboard salute unificata, cloud EU, GDPR. Ponte Apple Salute incluso: sonno e passi dall'anello smart su iOS, senza duplicati.",
      en: "Same FitMesh account on Android and iPhone: one unified health dashboard, EU cloud, GDPR. Apple Health bridge included: sleep and steps from your smart ring on iOS, no duplicates.",
      de: "Dasselbe FitMesh-Konto auf Android und iPhone: ein vereintes Gesundheits-Dashboard, EU-Cloud, GDPR. Apple Health-Brücke inklusive: Schlaf und Schritte vom Smart-Ring auf iOS, ohne Duplikate.",
      pt: "A mesma conta FitMesh no Android e no iPhone: um painel de saúde unificado, nuvem na UE, GDPR. Ponte para Apple Health incluída: sono e passos do anel inteligente no iOS, sem duplicatas.",
      fr: "Le même compte FitMesh sur Android et iPhone: un tableau de bord de santé unifié, cloud UE, GDPR. Pont Apple Health inclus: sommeil et pas depuis la bague connectée sur iOS, sans doublons.",
    },
    hero: {
      kicker: {
        it: "Due telefoni, una salute",
        en: "Two phones, one health",
        de: "Zwei Telefone, eine Gesundheit",
        pt: "Dois celulares, uma saúde",
        fr: "Deux téléphones, une santé",
      },
      title: {
        it: "Android e iPhone insieme: stessa dashboard, stessi dati",
        en: "Android and iPhone together: same dashboard, same data",
        de: "Android und iPhone zusammen: dasselbe Dashboard, dieselben Daten",
        pt: "Android e iPhone juntos: mesmo painel, mesmos dados",
        fr: "Android et iPhone ensemble: même tableau de bord, mêmes données",
      },
      subtitle: {
        it: "Un account FitMesh funziona su entrambi i telefoni. I dati del tuo anello smart Colmi arrivano su iPhone via Bluetooth e vengono scritti dentro Apple Salute, così li vedi anche nell'ecosistema Apple. Cloud EU, GDPR, nessun duplicato.",
        en: "One FitMesh account works on both phones. Your Colmi smart ring data reaches iPhone over Bluetooth and gets written into Apple Health, so you see it across the Apple ecosystem too. EU cloud, GDPR, no duplicates.",
        de: "Ein FitMesh-Konto funktioniert auf beiden Telefonen. Die Daten deines Colmi-Smart-Rings kommen via Bluetooth auf das iPhone und werden in Apple Health geschrieben, sodass du sie auch im Apple-Ökosystem siehst. EU-Cloud, GDPR, keine Duplikate.",
        pt: "Uma conta FitMesh funciona nos dois celulares. Os dados do seu anel inteligente Colmi chegam ao iPhone via Bluetooth e são gravados no Apple Health, para você vê-los também no ecossistema Apple. Nuvem na UE, GDPR, sem duplicatas.",
        fr: "Un compte FitMesh fonctionne sur les deux téléphones. Les données de votre bague connectée Colmi arrivent sur l'iPhone via Bluetooth et sont écrites dans Apple Health, pour les retrouver dans l'écosystème Apple. Cloud UE, GDPR, sans doublons.",
      },
      primaryCta: {
        label: { it: "Entra in beta gratis", en: "Join the free beta", de: "Kostenlos zur Beta", pt: "Entrar na beta grátis", fr: "Rejoindre la bêta gratuite" },
        href: { it: "/it/beta", en: "/en/beta", de: "/de/beta", pt: "/pt/beta", fr: "/fr/beta" },
      },
      secondaryCta: {
        label: {
          it: "Vedi tutte le integrazioni",
          en: "See all integrations",
          de: "Alle Integrationen ansehen",
          pt: "Ver todas as integrações",
          fr: "Voir toutes les intégrations",
        },
        href: { it: "/it/integrations", en: "/en/integrations", de: "/de/integrations", pt: "/pt/integrations", fr: "/fr/integrations" },
      },
    },
    body: [
      {
        type: "paragraph",
        text: {
          it: "Molte persone usano due telefoni: uno Android di lavoro e un iPhone personale, o viceversa. Oppure hai cambiato sistema operativo e vuoi portare lo storico dei tuoi dati salute. O ancora, vuoi che i dati del tuo anello smart Colmi (connesso via Bluetooth all'Android) compaiano anche su iPhone, dentro Apple Salute, senza passare per export manuali.",
          en: "Many people use two phones: one Android for work and an iPhone personally, or the other way around. Or you've switched operating systems and want to carry your health data history. Or you want your Colmi smart ring data (connected via Bluetooth to Android) to show up on iPhone too, inside Apple Health, without manual exports.",
          de: "Viele Menschen nutzen zwei Telefone: ein Android für die Arbeit und ein iPhone privat, oder umgekehrt. Oder du hast das Betriebssystem gewechselt und möchtest deine Gesundheitsdatenhistorie mitnehmen. Oder du möchtest, dass die Daten deines Colmi-Smart-Rings (via Bluetooth mit Android verbunden) auch auf dem iPhone erscheinen, in Apple Health, ohne manuelle Exporte.",
          pt: "Muita gente usa dois celulares: um Android para o trabalho e um iPhone pessoal, ou o contrário. Ou você trocou de sistema operacional e quer levar o histórico dos seus dados de saúde. Ou ainda, quer que os dados do seu anel inteligente Colmi (conectado via Bluetooth ao Android) apareçam também no iPhone, dentro do Apple Health, sem precisar de exportações manuais.",
          fr: "Beaucoup de personnes utilisent deux téléphones: un Android pour le travail et un iPhone personnel, ou l'inverse. Ou vous avez changé de système d'exploitation et souhaitez conserver l'historique de vos données de santé. Ou encore, vous voulez que les données de votre bague connectée Colmi (connectée via Bluetooth à l'Android) apparaissent aussi sur l'iPhone, dans Apple Health, sans exportations manuelles.",
        },
      },
      {
        type: "paragraph",
        text: {
          it: "FitMesh Sync risolve tutto questo con un'unica struttura: un account cloud, due app (Android già disponibile, iOS in beta), un ponte verso Apple Salute. I dati sono tuoi, archiviati in EU, accessibili da qualsiasi browser.",
          en: "FitMesh Sync solves all of this with one structure: one cloud account, two apps (Android already available, iOS in beta), one bridge to Apple Health. The data is yours, stored in the EU, accessible from any browser.",
          de: "FitMesh Sync löst all das mit einer einzigen Struktur: ein Cloud-Konto, zwei Apps (Android bereits verfügbar, iOS in Beta), eine Brücke zu Apple Health. Die Daten gehören dir, werden in der EU gespeichert und sind von jedem Browser aus zugänglich.",
          pt: "FitMesh Sync resolve tudo isso com uma única estrutura: uma conta na nuvem, dois apps (Android já disponível, iOS em beta), uma ponte para o Apple Health. Os dados são seus, armazenados na UE, acessíveis de qualquer navegador.",
          fr: "FitMesh Sync résout tout cela avec une seule structure: un compte cloud, deux applications (Android déjà disponible, iOS en bêta), un pont vers Apple Health. Les données vous appartiennent, stockées dans l'UE, accessibles depuis n'importe quel navigateur.",
        },
      },
      {
        type: "heading",
        level: 2,
        text: {
          it: "Come funziona il multi-device",
          en: "How multi-device works",
          de: "Wie Multi-Device funktioniert",
          pt: "Como funciona o multi-dispositivo",
          fr: "Comment fonctionne le multi-appareil",
        },
      },
      {
        type: "list",
        items: {
          it: [
            "**Un account, due app**: lo stesso account FitMesh funziona su Android e iPhone. Non serve creare profili separati né sincronizzare manualmente: la dashboard web mostra sempre i dati più aggiornati, da qualsiasi dispositivo.",
            "**Android: lettura nativa da Health Connect**: su Android, FitMesh legge dati da Health Connect: Galaxy Watch, Garmin, Pixel Watch, Fitbit, e qualsiasi app che scriva su Health Connect. I dati si aggiornano in automatico in background.",
            "**iOS: lettura nativa da Apple Salute (HealthKit)**: su iPhone, FitMesh accede ad Apple Salute con i permessi che tu scegli. Legge ciò che Apple Salute già raccoglie: passi da iPhone, dati da Apple Watch, e da qualsiasi app autorizzata.",
            "**Anello Colmi su entrambe le piattaforme**: l'anello smart Colmi si connette via Bluetooth all'app FitMesh, sia su Android che su iPhone. I dati (sonno con fasi, passi, frequenza cardiaca) vengono sincronizzati all'account cloud e, su iOS, scritti dentro Apple Salute.",
            "**Cloud EU, GDPR**: tutti i dati sono archiviati su server in EU (Frankfurt). Crittografia in transito e a riposo, Row Level Security, cancellazione completa account on-demand.",
          ],
          en: [
            "**One account, two apps**: the same FitMesh account works on Android and iPhone. No separate profiles or manual syncing: the web dashboard always shows the most recent data, from any device.",
            "**Android: native read from Health Connect**: on Android, FitMesh reads data from Health Connect: Galaxy Watch, Garmin, Pixel Watch, Fitbit, and any app writing to Health Connect. Data updates automatically in the background.",
            "**iOS: native read from Apple Health (HealthKit)**: on iPhone, FitMesh accesses Apple Health with permissions you choose. Reads what Apple Health already collects: iPhone steps, Apple Watch data, and any authorized app.",
            "**Colmi ring on both platforms**: the Colmi smart ring connects via Bluetooth to the FitMesh app, on both Android and iPhone. Data (sleep with phases, steps, heart rate) is synced to your cloud account and, on iOS, written into Apple Health.",
            "**EU cloud, GDPR**: all data is stored on EU servers (Frankfurt). Encryption in transit and at rest, Row Level Security, full on-demand account deletion.",
          ],
          de: [
            "**Ein Konto, zwei Apps**: dasselbe FitMesh-Konto funktioniert auf Android und iPhone. Keine separaten Profile oder manuelle Synchronisierung: Das Web-Dashboard zeigt immer die aktuellsten Daten, von jedem Gerät.",
            "**Android: native Lesezugriff auf Health Connect**: Auf Android liest FitMesh Daten aus Health Connect: Galaxy Watch, Garmin, Pixel Watch, Fitbit und jede App, die in Health Connect schreibt. Daten werden automatisch im Hintergrund aktualisiert.",
            "**iOS: native Lesezugriff auf Apple Health (HealthKit)**: Auf dem iPhone greift FitMesh mit den von dir gewählten Berechtigungen auf Apple Health zu. Liest, was Apple Health bereits sammelt: iPhone-Schritte, Apple Watch-Daten und jede autorisierte App.",
            "**Colmi-Ring auf beiden Plattformen**: Der Colmi-Smart-Ring verbindet sich via Bluetooth mit der FitMesh-App, auf Android und iPhone. Daten (Schlaf mit Phasen, Schritte, Herzfrequenz) werden mit deinem Cloud-Konto synchronisiert und auf iOS in Apple Health geschrieben.",
            "**EU-Cloud, GDPR**: Alle Daten werden auf EU-Servern (Frankfurt) gespeichert. Verschlüsselung bei Übertragung und Speicherung, Row Level Security, vollständige On-Demand-Kontolöschung.",
          ],
          pt: [
            "**Uma conta, dois apps**: a mesma conta FitMesh funciona no Android e no iPhone. Sem perfis separados ou sincronização manual: o painel web sempre mostra os dados mais recentes, de qualquer dispositivo.",
            "**Android: leitura nativa do Health Connect**: no Android, o FitMesh lê dados do Health Connect: Galaxy Watch, Garmin, Pixel Watch, Fitbit e qualquer app que escreva no Health Connect. Os dados se atualizam automaticamente em segundo plano.",
            "**iOS: leitura nativa do Apple Health (HealthKit)**: no iPhone, o FitMesh acessa o Apple Health com as permissões que você escolhe. Lê o que o Apple Health já coleta: passos do iPhone, dados do Apple Watch e qualquer app autorizado.",
            "**Anel Colmi em ambas as plataformas**: o anel inteligente Colmi conecta-se via Bluetooth ao app FitMesh, tanto no Android quanto no iPhone. Os dados (sono com fases, passos, frequência cardíaca) são sincronizados com sua conta na nuvem e, no iOS, gravados no Apple Health.",
            "**Nuvem na UE, GDPR**: todos os dados são armazenados em servidores na UE (Frankfurt). Criptografia em trânsito e em repouso, Row Level Security, exclusão completa de conta sob demanda.",
          ],
          fr: [
            "**Un compte, deux applications**: le même compte FitMesh fonctionne sur Android et iPhone. Pas de profils séparés ni de synchronisation manuelle: le tableau de bord web affiche toujours les données les plus récentes, depuis n'importe quel appareil.",
            "**Android: lecture native depuis Health Connect**: sur Android, FitMesh lit les données depuis Health Connect: Galaxy Watch, Garmin, Pixel Watch, Fitbit et toute application écrivant dans Health Connect. Les données se mettent à jour automatiquement en arrière-plan.",
            "**iOS: lecture native depuis Apple Health (HealthKit)**: sur iPhone, FitMesh accède à Apple Health avec les autorisations que vous choisissez. Lit ce qu'Apple Health collecte déjà: pas depuis l'iPhone, données Apple Watch et toute application autorisée.",
            "**Bague Colmi sur les deux plateformes**: la bague connectée Colmi se connecte via Bluetooth à l'application FitMesh, sur Android et iPhone. Les données (sommeil avec phases, pas, fréquence cardiaque) sont synchronisées avec votre compte cloud et, sur iOS, écrites dans Apple Health.",
            "**Cloud UE, GDPR**: toutes les données sont stockées sur des serveurs UE (Francfort). Chiffrement en transit et au repos, Row Level Security, suppression complète du compte à la demande.",
          ],
        },
      },
      {
        type: "heading",
        level: 2,
        text: {
          it: "Il ponte Apple Salute (opt-in iOS)",
          en: "The Apple Health bridge (iOS opt-in)",
          de: "Die Apple Health-Brücke (iOS opt-in)",
          pt: "A ponte Apple Health (opt-in iOS)",
          fr: "Le pont Apple Health (opt-in iOS)",
        },
      },
      {
        type: "paragraph",
        text: {
          it: "Il punto più richiesto: \"i dati del mio anello Android compaiono su Apple Salute?\". Sì, tramite il ponte FitMesh. Quando usi FitMesh su iPhone e hai un anello Colmi, l'app scrive i dati su Apple Salute: sonno con fasi (leggero, profondo, REM), passi, frequenza cardiaca. Così li vedi nell'app Salute di Apple, in Fitness, e in qualsiasi altra app autorizzata ad Apple Salute.",
          en: "The most requested point: \"does my Android ring data show up in Apple Health?\". Yes, via the FitMesh bridge. When you use FitMesh on iPhone with a Colmi ring, the app writes data into Apple Health: sleep with phases (light, deep, REM), steps, heart rate. So you see them in Apple's Health app, in Fitness, and in any other app authorized to Apple Health.",
          de: "Die am häufigsten gestellte Frage: \"Erscheinen die Daten meines Android-Rings in Apple Health?\". Ja, über die FitMesh-Brücke. Wenn du FitMesh auf dem iPhone mit einem Colmi-Ring verwendest, schreibt die App die Daten in Apple Health: Schlaf mit Phasen (Leichtschlaf, Tiefschlaf, REM), Schritte, Herzfrequenz. So siehst du sie in Apples Health-App, in Fitness und in jeder anderen für Apple Health autorisierten App.",
          pt: "O ponto mais solicitado: \"os dados do meu anel Android aparecem no Apple Health?\". Sim, pela ponte FitMesh. Quando você usa o FitMesh no iPhone com um anel Colmi, o app grava os dados no Apple Health: sono com fases (leve, profundo, REM), passos, frequência cardíaca. Assim você os vê no app Saúde da Apple, no Fitness e em qualquer outro app autorizado ao Apple Health.",
          fr: "La question la plus fréquente: \"les données de ma bague Android apparaissent-elles dans Apple Health?\". Oui, via le pont FitMesh. Quand vous utilisez FitMesh sur iPhone avec une bague Colmi, l'application écrit les données dans Apple Health: sommeil avec phases (léger, profond, REM), pas, fréquence cardiaque. Vous les retrouvez dans l'application Santé d'Apple, dans Fitness et dans toute autre application autorisée à Apple Health.",
        },
      },
      {
        type: "callout",
        variant: "info",
        title: {
          it: "Niente doppioni",
          en: "No duplicates",
          de: "Keine Duplikate",
          pt: "Sem duplicatas",
          fr: "Pas de doublons",
        },
        body: {
          it: "Se Apple Salute ha già quei dati (ad esempio da Apple Watch), FitMesh non li riscrive. Niente doppioni.",
          en: "If Apple Health already has that data (for example from Apple Watch), FitMesh won't rewrite it. No duplicates.",
          de: "Wenn Apple Health diese Daten bereits hat (zum Beispiel von der Apple Watch), schreibt FitMesh sie nicht erneut. Keine Duplikate.",
          pt: "Se o Apple Health já tiver esses dados (por exemplo, do Apple Watch), o FitMesh não os reescreve. Sem duplicatas.",
          fr: "Si Apple Health possède déjà ces données (par exemple depuis l'Apple Watch), FitMesh ne les réécrit pas. Pas de doublons.",
        },
      },
      {
        type: "heading",
        level: 2,
        text: {
          it: "Cosa FitMesh non fa (onestà prima di tutto)",
          en: "What FitMesh doesn't do (honesty first)",
          de: "Was FitMesh nicht tut (Ehrlichkeit zuerst)",
          pt: "O que o FitMesh não faz (honestidade antes de tudo)",
          fr: "Ce que FitMesh ne fait pas (honnêteté avant tout)",
        },
      },
      {
        type: "list",
        items: {
          it: [
            "**Non scrive su Health Connect**: la scrittura su Health Connect (Android) è in roadmap, ma non è ancora disponibile. FitMesh oggi legge da Health Connect, non ci scrive.",
            "**Il sync iOS non è in tempo reale**: su iPhone, il sync in background è periodico (ogni 15-30 minuti circa), come imposto dal sistema operativo iOS. Non aspettarti aggiornamenti al secondo.",
            "**L'app iOS non è ancora su App Store**: FitMesh iOS è in beta attiva su TestFlight. Puoi iscriverti alla lista beta su /beta; riceverai l'accesso non appena disponibile.",
          ],
          en: [
            "**Does not write to Health Connect**: writing to Health Connect (Android) is on the roadmap, but not yet available. FitMesh today reads from Health Connect, it doesn't write to it.",
            "**iOS sync is not real-time**: on iPhone, background sync is periodic (roughly every 15-30 minutes), as enforced by the iOS operating system. Don't expect second-by-second updates.",
            "**iOS app is not yet on the App Store**: FitMesh iOS is in active beta on TestFlight. You can join the beta waitlist at /beta; you'll get access as soon as it's available.",
          ],
          de: [
            "**Schreibt nicht in Health Connect**: Das Schreiben in Health Connect (Android) ist geplant, aber noch nicht verfügbar. FitMesh liest heute aus Health Connect, schreibt aber nicht hinein.",
            "**iOS-Sync ist nicht in Echtzeit**: Auf dem iPhone ist der Hintergrund-Sync periodisch (ungefähr alle 15-30 Minuten), wie vom iOS-Betriebssystem vorgegeben. Erwarte keine sekündlichen Updates.",
            "**iOS-App ist noch nicht im App Store**: FitMesh iOS befindet sich in aktiver Beta auf TestFlight. Du kannst dich auf der Beta-Warteliste unter /beta eintragen; du erhältst Zugang, sobald er verfügbar ist.",
          ],
          pt: [
            "**Não escreve no Health Connect**: a escrita no Health Connect (Android) está no roadmap, mas ainda não está disponível. Hoje o FitMesh lê do Health Connect, mas não escreve nele.",
            "**O sync iOS não é em tempo real**: no iPhone, o sync em segundo plano é periódico (aproximadamente a cada 15-30 minutos), conforme imposto pelo sistema operacional iOS. Não espere atualizações segundo a segundo.",
            "**O app iOS ainda não está na App Store**: o FitMesh iOS está em beta ativa no TestFlight. Você pode entrar na lista de espera da beta em /beta; receberá acesso assim que disponível.",
          ],
          fr: [
            "**N'écrit pas dans Health Connect**: l'écriture dans Health Connect (Android) est prévue, mais pas encore disponible. FitMesh lit aujourd'hui depuis Health Connect, il n'y écrit pas.",
            "**La synchronisation iOS n'est pas en temps réel**: sur iPhone, la synchronisation en arrière-plan est périodique (environ toutes les 15-30 minutes), comme imposé par le système d'exploitation iOS. N'attendez pas de mises à jour à la seconde.",
            "**L'application iOS n'est pas encore sur l'App Store**: FitMesh iOS est en bêta active sur TestFlight. Vous pouvez rejoindre la liste d'attente bêta sur /beta; vous obtiendrez l'accès dès qu'il sera disponible.",
          ],
        },
      },
      {
        type: "heading",
        level: 2,
        text: {
          it: "Compatibilità attuale",
          en: "Current compatibility",
          de: "Aktuelle Kompatibilität",
          pt: "Compatibilidade atual",
          fr: "Compatibilité actuelle",
        },
      },
      {
        type: "table",
        caption: {
          it: "Funzionalità disponibili oggi (giugno 2026)",
          en: "Features available today (June 2026)",
          de: "Heute verfügbare Funktionen (Juni 2026)",
          pt: "Funcionalidades disponíveis hoje (junho 2026)",
          fr: "Fonctionnalités disponibles aujourd'hui (juin 2026)",
        },
        headers: {
          it: ["Funzione", "Android", "iPhone (beta)"],
          en: ["Feature", "Android", "iPhone (beta)"],
          de: ["Funktion", "Android", "iPhone (Beta)"],
          pt: ["Função", "Android", "iPhone (beta)"],
          fr: ["Fonction", "Android", "iPhone (bêta)"],
        },
        rows: [
          {
            it: ["Account cloud condiviso", "✓", "✓"],
            en: ["Shared cloud account", "✓", "✓"],
            de: ["Gemeinsames Cloud-Konto", "✓", "✓"],
            pt: ["Conta cloud compartilhada", "✓", "✓"],
            fr: ["Compte cloud partagé", "✓", "✓"],
          },
          {
            it: ["Dashboard web", "✓", "✓"],
            en: ["Web dashboard", "✓", "✓"],
            de: ["Web-Dashboard", "✓", "✓"],
            pt: ["Painel web", "✓", "✓"],
            fr: ["Tableau de bord web", "✓", "✓"],
          },
          {
            it: ["Lettura Health Connect", "✓", "—"],
            en: ["Read from Health Connect", "✓", "—"],
            de: ["Lesezugriff Health Connect", "✓", "—"],
            pt: ["Leitura do Health Connect", "✓", "—"],
            fr: ["Lecture Health Connect", "✓", "—"],
          },
          {
            it: ["Lettura Apple Salute", "—", "✓"],
            en: ["Read from Apple Health", "—", "✓"],
            de: ["Lesezugriff Apple Health", "—", "✓"],
            pt: ["Leitura do Apple Health", "—", "✓"],
            fr: ["Lecture Apple Health", "—", "✓"],
          },
          {
            it: ["Anello Colmi via Bluetooth", "✓", "✓ (beta)"],
            en: ["Colmi ring via Bluetooth", "✓", "✓ (beta)"],
            de: ["Colmi-Ring via Bluetooth", "✓", "✓ (Beta)"],
            pt: ["Anel Colmi via Bluetooth", "✓", "✓ (beta)"],
            fr: ["Bague Colmi via Bluetooth", "✓", "✓ (bêta)"],
          },
          {
            it: ["Scrittura su Apple Salute", "—", "✓ (beta)"],
            en: ["Write to Apple Health", "—", "✓ (beta)"],
            de: ["Schreiben in Apple Health", "—", "✓ (Beta)"],
            pt: ["Escrita no Apple Health", "—", "✓ (beta)"],
            fr: ["Écriture dans Apple Health", "—", "✓ (bêta)"],
          },
          {
            it: ["Scrittura su Health Connect", "roadmap", "—"],
            en: ["Write to Health Connect", "roadmap", "—"],
            de: ["Schreiben in Health Connect", "geplant", "—"],
            pt: ["Escrita no Health Connect", "planejado", "—"],
            fr: ["Écriture dans Health Connect", "prévu", "—"],
          },
        ],
      },
      {
        type: "cta",
        title: {
          it: "Inizia con Android, aggiungi iPhone quando è pronto",
          en: "Start with Android, add iPhone when it's ready",
          de: "Starte mit Android, füge iPhone hinzu, wenn es bereit ist",
          pt: "Comece com Android, adicione o iPhone quando estiver pronto",
          fr: "Commencez avec Android, ajoutez l'iPhone quand il sera prêt",
        },
        body: {
          it: "FitMesh Android è disponibile ora su Google Play: scarica, connetti il tuo anello o wearable, e la dashboard è subito attiva. Iscriviti alla beta iOS per ricevere l'accesso appena i posti si aprono.",
          en: "FitMesh Android is available now on Google Play: download, connect your ring or wearable, and the dashboard is immediately active. Join the iOS beta to get access as soon as spots open.",
          de: "FitMesh Android ist jetzt auf Google Play verfügbar: Herunterladen, Ring oder Wearable verbinden, und das Dashboard ist sofort aktiv. Tritt der iOS-Beta bei, um Zugang zu erhalten, sobald Plätze frei sind.",
          pt: "FitMesh Android está disponível agora no Google Play: baixe, conecte seu anel ou wearable e o painel fica imediatamente ativo. Inscreva-se na beta iOS para receber acesso assim que as vagas abrirem.",
          fr: "FitMesh Android est disponible maintenant sur Google Play: téléchargez, connectez votre bague ou wearable, et le tableau de bord est immédiatement actif. Rejoignez la bêta iOS pour obtenir l'accès dès que des places s'ouvrent.",
        },
        ctaLabel: { it: "Entra in beta →", en: "Join beta →", de: "Zur Beta →", pt: "Entrar na beta →", fr: "Rejoindre la bêta →" },
        ctaHref: { it: "/it/beta", en: "/en/beta", de: "/de/beta", pt: "/pt/beta", fr: "/fr/beta" },
      },
    ],
    faq: [
      {
        q: {
          it: "Posso usare FitMesh su due telefoni contemporaneamente?",
          en: "Can I use FitMesh on two phones at the same time?",
          de: "Kann ich FitMesh gleichzeitig auf zwei Telefonen verwenden?",
          pt: "Posso usar o FitMesh em dois celulares ao mesmo tempo?",
          fr: "Puis-je utiliser FitMesh sur deux téléphones en même temps?",
        },
        a: {
          it: "Sì. Lo stesso account FitMesh funziona su Android e iPhone in parallelo. I dati di entrambi i dispositivi confluiscono nella stessa dashboard cloud: non devi fare nulla di speciale, basta accedere con lo stesso account su entrambi.",
          en: "Yes. The same FitMesh account works on Android and iPhone in parallel. Data from both devices flows into the same cloud dashboard: you don't need to do anything special, just log in with the same account on both.",
          de: "Ja. Dasselbe FitMesh-Konto funktioniert auf Android und iPhone parallel. Daten von beiden Geräten fließen in dasselbe Cloud-Dashboard: Du musst nichts Besonderes tun, melde dich einfach mit demselben Konto auf beiden an.",
          pt: "Sim. A mesma conta FitMesh funciona no Android e no iPhone em paralelo. Os dados de ambos os dispositivos fluem para o mesmo painel na nuvem: você não precisa fazer nada especial, basta entrar com a mesma conta nos dois.",
          fr: "Oui. Le même compte FitMesh fonctionne sur Android et iPhone en parallèle. Les données des deux appareils affluent vers le même tableau de bord cloud: vous n'avez rien de spécial à faire, connectez-vous simplement avec le même compte sur les deux.",
        },
      },
      {
        q: {
          it: "I dati del mio smartwatch Android compaiono su Apple Salute?",
          en: "Does my Android smartwatch data show up in Apple Health?",
          de: "Erscheinen meine Android-Smartwatch-Daten in Apple Health?",
          pt: "Os dados do meu smartwatch Android aparecem no Apple Health?",
          fr: "Les données de ma montre connectée Android apparaissent-elles dans Apple Health?",
        },
        a: {
          it: "Per l'anello smart Colmi: sì. FitMesh iOS (beta) scrive i dati dell'anello Colmi dentro Apple Salute (sonno con fasi, passi, frequenza cardiaca). Per gli smartwatch Android che passano per Health Connect (Galaxy Watch, Garmin, ecc.): il passaggio diretto Health Connect → Apple Salute non è disponibile oggi, ma è in roadmap.",
          en: "For the Colmi smart ring: yes. FitMesh iOS (beta) writes Colmi ring data into Apple Health (sleep with phases, steps, heart rate). For Android smartwatches that go through Health Connect (Galaxy Watch, Garmin, etc.): the direct Health Connect → Apple Health bridge is not available today, but is on the roadmap.",
          de: "Für den Colmi-Smart-Ring: ja. FitMesh iOS (Beta) schreibt Colmi-Ring-Daten in Apple Health (Schlaf mit Phasen, Schritte, Herzfrequenz). Für Android-Smartwatches, die über Health Connect laufen (Galaxy Watch, Garmin usw.): Die direkte Brücke Health Connect → Apple Health ist heute nicht verfügbar, ist aber geplant.",
          pt: "Para o anel inteligente Colmi: sim. O FitMesh iOS (beta) grava os dados do anel Colmi no Apple Health (sono com fases, passos, frequência cardíaca). Para smartwatches Android que passam pelo Health Connect (Galaxy Watch, Garmin, etc.): a ponte direta Health Connect → Apple Health não está disponível hoje, mas está no roadmap.",
          fr: "Pour la bague connectée Colmi: oui. FitMesh iOS (bêta) écrit les données de la bague Colmi dans Apple Health (sommeil avec phases, pas, fréquence cardiaque). Pour les montres connectées Android qui passent par Health Connect (Galaxy Watch, Garmin, etc.): le pont direct Health Connect → Apple Health n'est pas disponible aujourd'hui, mais est prévu.",
        },
      },
      {
        q: {
          it: "Se ho già dati su iPhone, vengono duplicati con quelli Android?",
          en: "If I already have data on iPhone, will it be duplicated with Android data?",
          de: "Wenn ich bereits Daten auf dem iPhone habe, werden sie mit den Android-Daten dupliziert?",
          pt: "Se eu já tiver dados no iPhone, eles serão duplicados com os dados do Android?",
          fr: "Si j'ai déjà des données sur iPhone, seront-elles dupliquées avec les données Android?",
        },
        a: {
          it: "No. FitMesh controlla prima se Apple Salute ha già quei dati. Se ci sono già (da Apple Watch o da qualsiasi altra app), FitMesh non li riscrive. I dati originati su iPhone restano separati da quelli scritti da FitMesh.",
          en: "No. FitMesh checks first whether Apple Health already has that data. If it's already there (from Apple Watch or any other app), FitMesh won't rewrite it. Data from iPhone stays separate from data written by FitMesh.",
          de: "Nein. FitMesh prüft zuerst, ob Apple Health diese Daten bereits hat. Wenn sie schon vorhanden sind (von der Apple Watch oder einer anderen App), schreibt FitMesh sie nicht erneut. Daten vom iPhone bleiben getrennt von den von FitMesh geschriebenen Daten.",
          pt: "Não. O FitMesh verifica primeiro se o Apple Health já tem esses dados. Se já estiverem lá (do Apple Watch ou de qualquer outro app), o FitMesh não os reescreve. Os dados originados no iPhone ficam separados dos dados gravados pelo FitMesh.",
          fr: "Non. FitMesh vérifie d'abord si Apple Health possède déjà ces données. Si elles sont déjà présentes (depuis l'Apple Watch ou toute autre application), FitMesh ne les réécrit pas. Les données provenant de l'iPhone restent séparées des données écrites par FitMesh.",
        },
      },
      {
        q: {
          it: "FitMesh iOS è disponibile su App Store?",
          en: "Is FitMesh iOS available on the App Store?",
          de: "Ist FitMesh iOS im App Store verfügbar?",
          pt: "O FitMesh iOS está disponível na App Store?",
          fr: "FitMesh iOS est-il disponible sur l'App Store?",
        },
        a: {
          it: "Non ancora. FitMesh iOS è in beta attiva su TestFlight. Iscriviti alla lista beta su fitmesh.fit/it/beta: riceverai un'email con il link TestFlight non appena i posti sono disponibili. L'uscita su App Store è pianificata dopo il completamento della beta.",
          en: "Not yet. FitMesh iOS is in active beta on TestFlight. Join the beta waitlist at fitmesh.fit/en/beta: you'll receive an email with the TestFlight link as soon as spots are available. App Store release is planned after the beta is complete.",
          de: "Noch nicht. FitMesh iOS befindet sich in aktiver Beta auf TestFlight. Tritt der Beta-Warteliste unter fitmesh.fit/de/beta bei: Du erhältst eine E-Mail mit dem TestFlight-Link, sobald Plätze verfügbar sind. Die Veröffentlichung im App Store ist nach Abschluss der Beta geplant.",
          pt: "Ainda não. O FitMesh iOS está em beta ativa no TestFlight. Entre na lista de espera da beta em fitmesh.fit/pt/beta: você receberá um e-mail com o link do TestFlight assim que as vagas estiverem disponíveis. O lançamento na App Store está planejado após a conclusão da beta.",
          fr: "Pas encore. FitMesh iOS est en bêta active sur TestFlight. Rejoignez la liste d'attente bêta sur fitmesh.fit/fr/beta: vous recevrez un e-mail avec le lien TestFlight dès que des places seront disponibles. La sortie sur l'App Store est prévue après la fin de la bêta.",
        },
      },
      {
        q: {
          it: "I miei dati salute sono al sicuro se uso due telefoni?",
          en: "Is my health data safe when using two phones?",
          de: "Sind meine Gesundheitsdaten sicher, wenn ich zwei Telefone verwende?",
          pt: "Meus dados de saúde estão seguros ao usar dois celulares?",
          fr: "Mes données de santé sont-elles en sécurité si j'utilise deux téléphones?",
        },
        a: {
          it: "Sì. Tutti i dati sono archiviati su un unico server EU (Frankfurt), crittografati in transito (HTTPS) e a riposo. Ogni account è isolato con Row Level Security: nessun altro utente può vedere i tuoi dati. Puoi cancellare tutto in qualsiasi momento dalla sezione 'Elimina account e dati' nell'app.",
          en: "Yes. All data is stored on a single EU server (Frankfurt), encrypted in transit (HTTPS) and at rest. Each account is isolated with Row Level Security: no other user can see your data. You can delete everything at any time from the 'Delete account and data' section in the app.",
          de: "Ja. Alle Daten werden auf einem einzigen EU-Server (Frankfurt) gespeichert, verschlüsselt bei Übertragung (HTTPS) und Speicherung. Jedes Konto ist mit Row Level Security isoliert: Kein anderer Nutzer kann deine Daten sehen. Du kannst alles jederzeit über den Bereich 'Konto und Daten löschen' in der App löschen.",
          pt: "Sim. Todos os dados são armazenados em um único servidor na UE (Frankfurt), criptografados em trânsito (HTTPS) e em repouso. Cada conta é isolada com Row Level Security: nenhum outro usuário pode ver seus dados. Você pode excluir tudo a qualquer momento na seção 'Excluir conta e dados' no app.",
          fr: "Oui. Toutes les données sont stockées sur un seul serveur UE (Francfort), chiffrées en transit (HTTPS) et au repos. Chaque compte est isolé avec Row Level Security: aucun autre utilisateur ne peut voir vos données. Vous pouvez tout supprimer à tout moment depuis la section 'Supprimer le compte et les données' dans l'application.",
        },
      },
      {
        q: {
          it: "L'anello Colmi funziona sia su Android che su iPhone?",
          en: "Does the Colmi ring work on both Android and iPhone?",
          de: "Funktioniert der Colmi-Ring sowohl auf Android als auch auf iPhone?",
          pt: "O anel Colmi funciona tanto no Android quanto no iPhone?",
          fr: "La bague Colmi fonctionne-t-elle sur Android et sur iPhone?",
        },
        a: {
          it: "Sì. L'anello Colmi si connette via Bluetooth all'app FitMesh su entrambe le piattaforme. Su Android è già disponibile in produzione. Su iPhone è nella beta attiva: iscriviti per accedere. I dati raccolti dall'anello (sonno con fasi, passi, BPM) vengono sincronizzati all'account cloud e, su iOS, scritti dentro Apple Salute.",
          en: "Yes. The Colmi ring connects via Bluetooth to the FitMesh app on both platforms. On Android it's already available in production. On iPhone it's in the active beta: join to get access. Data collected by the ring (sleep with phases, steps, BPM) is synced to your cloud account and, on iOS, written into Apple Health.",
          de: "Ja. Der Colmi-Ring verbindet sich via Bluetooth mit der FitMesh-App auf beiden Plattformen. Auf Android ist er bereits in der Produktion verfügbar. Auf dem iPhone befindet er sich in der aktiven Beta: Tritt bei, um Zugang zu erhalten. Die vom Ring gesammelten Daten (Schlaf mit Phasen, Schritte, BPM) werden mit dem Cloud-Konto synchronisiert und auf iOS in Apple Health geschrieben.",
          pt: "Sim. O anel Colmi conecta-se via Bluetooth ao app FitMesh em ambas as plataformas. No Android já está disponível em produção. No iPhone está na beta ativa: inscreva-se para ter acesso. Os dados coletados pelo anel (sono com fases, passos, BPM) são sincronizados com a conta na nuvem e, no iOS, gravados no Apple Health.",
          fr: "Oui. La bague Colmi se connecte via Bluetooth à l'application FitMesh sur les deux plateformes. Sur Android, elle est déjà disponible en production. Sur iPhone, elle est en bêta active: rejoignez-la pour obtenir l'accès. Les données collectées par la bague (sommeil avec phases, pas, BPM) sont synchronisées avec votre compte cloud et, sur iOS, écrites dans Apple Health.",
        },
      },
    ],
    brandsMentioned: ["Apple", "Google", "Colmi"],
  },

  // ── 8. Anello smart Colmi + FitMesh (conversion landing) ─────────────
  {
    slug: "anello-smart-sonno",
    relatedProvider: "colmi-ring",
    publishedAt: "2026-06-13",
    updatedAt: "2026-06-13",
    primaryKeyword: {
      it: "anello smart sonno colmi fitmesh",
      en: "colmi smart ring sleep fitmesh",
      de: "Colmi Smart-Ring Schlaf FitMesh",
      pt: "anel inteligente sono colmi fitmesh",
      fr: "bague connectée sommeil colmi fitmesh",
    },
    secondaryKeywords: {
      it: [
        "anello colmi senza app produttore",
        "anello smart passi battito spo2 android",
        "colmi ring dashboard web",
        "anello smart ios android stessa app",
        "colmi ring apple salute",
      ],
      en: [
        "colmi ring without manufacturer app",
        "smart ring steps heart rate spo2 android",
        "colmi ring web dashboard",
        "smart ring ios android same app",
        "colmi ring apple health",
      ],
    },
    metaDescription: {
      it: "FitMesh Sync legge l'anello Colmi via Bluetooth: passi, battito, SpO2, sonno con fasi, stress, batteria. Dashboard web su Android e, presto, su iPhone. Senza app del produttore.",
      en: "FitMesh Sync reads your Colmi ring via Bluetooth: steps, heart rate, SpO2, sleep with stages, stress, battery. Web dashboard on Android and, soon, iPhone. No manufacturer app needed.",
      de: "FitMesh Sync liest deinen Colmi-Ring via Bluetooth: Schritte, Herzfrequenz, SpO2, Schlaf mit Phasen, Stress, Akku. Web-Dashboard auf Android und bald auf iPhone. Ohne Hersteller-App.",
      pt: "FitMesh Sync lê seu anel Colmi via Bluetooth: passos, frequência cardíaca, SpO2, sono com fases, stress, bateria. Painel web no Android e, em breve, no iPhone. Sem app do fabricante.",
      fr: "FitMesh Sync lit votre bague Colmi via Bluetooth: pas, fréquence cardiaque, SpO2, sommeil avec phases, stress, batterie. Tableau de bord web sur Android et bientôt sur iPhone. Sans application du fabricant.",
    },
    hero: {
      kicker: { it: "Anello Colmi + FitMesh Sync", en: "Colmi Ring + FitMesh Sync", de: "Colmi-Ring + FitMesh Sync", pt: "Anel Colmi + FitMesh Sync", fr: "Bague Colmi + FitMesh Sync" },
      title: {
        it: "Il tuo anello Colmi su una dashboard web, senza l'app del produttore",
        en: "Your Colmi ring on a web dashboard, no manufacturer app required",
        de: "Dein Colmi-Ring auf einem Web-Dashboard, ohne Hersteller-App",
        pt: "Seu anel Colmi em um painel web, sem o app do fabricante",
        fr: "Votre bague Colmi sur un tableau de bord web, sans l'application du fabricant",
      },
      subtitle: {
        it: "FitMesh Sync si collega direttamente al tuo anello Colmi via Bluetooth e raccoglie passi, battito cardiaco, SpO2, sonno con fasi, stress e livello batteria. I dati appaiono su una dashboard web accessibile da qualsiasi browser, uniti a quelli del tuo smartwatch, senza doppioni.",
        en: "FitMesh Sync connects directly to your Colmi ring via Bluetooth and collects steps, heart rate, SpO2, sleep with stages, stress, and battery level. Data appears on a web dashboard accessible from any browser, merged with your smartwatch data, with no duplicates.",
        de: "FitMesh Sync verbindet sich direkt via Bluetooth mit deinem Colmi-Ring und sammelt Schritte, Herzfrequenz, SpO2, Schlaf mit Phasen, Stress und Akkustand. Die Daten erscheinen auf einem Web-Dashboard, das von jedem Browser zugänglich ist, zusammengeführt mit deinen Smartwatch-Daten, ohne Duplikate.",
        pt: "FitMesh Sync conecta-se diretamente ao seu anel Colmi via Bluetooth e coleta passos, frequência cardíaca, SpO2, sono com fases, stress e nível de bateria. Os dados aparecem em um painel web acessível de qualquer navegador, unidos aos dados do seu smartwatch, sem duplicatas.",
        fr: "FitMesh Sync se connecte directement à votre bague Colmi via Bluetooth et collecte les pas, la fréquence cardiaque, le SpO2, le sommeil avec phases, le stress et le niveau de batterie. Les données apparaissent sur un tableau de bord web accessible depuis n'importe quel navigateur, fusionnées avec les données de votre montre connectée, sans doublons.",
      },
      primaryCta: {
        label: { it: "Entra in beta gratis", en: "Join the free beta", de: "Kostenlos zur Beta", pt: "Entrar na beta grátis", fr: "Rejoindre la bêta gratuite" },
        href: { it: "/it/beta", en: "/en/beta", de: "/de/beta", pt: "/pt/beta", fr: "/fr/beta" },
      },
      secondaryCta: {
        label: { it: "Leggi la guida completa", en: "Read the full guide", de: "Vollständigen Leitfaden lesen", pt: "Ler o guia completo", fr: "Lire le guide complet" },
        href: {
          it: "/it/blog/colmi-ring-fitmesh",
          en: "/en/blog/colmi-ring-fitmesh",
          de: "/de/blog/colmi-ring-fitmesh",
          pt: "/pt/blog/colmi-ring-fitmesh",
          fr: "/fr/blog/colmi-ring-fitmesh",
        },
      },
    },
    body: [
      {
        type: "paragraph",
        text: {
          it: "Gli anelli Colmi offrono un monitoraggio continuo discreto: li indossi giorno e notte, tracciano il sonno con le fasi (leggero, profondo, REM), il battito cardiaco, la saturazione dell'ossigeno nel sangue e il livello di stress, senza che tu debba ricordarti di attivare niente. Il problema con molti anelli economici è l'app del produttore: spesso è scarna, i dati restano chiusi, non c'è integrazione con lo smartwatch che usi di giorno e non esiste una dashboard web decente.",
          en: "Colmi rings offer discreet continuous monitoring: you wear them day and night, tracking sleep with stages (light, deep, REM), heart rate, blood oxygen saturation, and stress level, with nothing to manually activate. The problem with many budget rings is the manufacturer app: often sparse, data stays locked in, there's no integration with the smartwatch you use during the day, and there's no decent web dashboard.",
          de: "Colmi-Ringe bieten diskretes kontinuierliches Monitoring: Du trägst sie Tag und Nacht, sie erfassen Schlaf mit Phasen (Leichtschlaf, Tiefschlaf, REM), Herzfrequenz, Blutsauerstoffsättigung und Stresslevel, ohne dass du etwas manuell aktivieren musst. Das Problem mit vielen günstigen Ringen ist die Hersteller-App: oft dürftig ausgestattet, Daten bleiben gesperrt, es gibt keine Integration mit der Smartwatch, die du tagsüber trägst, und kein anständiges Web-Dashboard.",
          pt: "Os anéis Colmi oferecem monitoramento contínuo discreto: você os usa dia e noite, rastreando o sono com fases (leve, profundo, REM), a frequência cardíaca, a saturação de oxigênio no sangue e o nível de stress, sem precisar ativar nada manualmente. O problema com muitos anéis baratos é o app do fabricante: geralmente escasso, os dados ficam presos, não há integração com o smartwatch que você usa durante o dia e não existe um painel web decente.",
          fr: "Les bagues Colmi offrent une surveillance continue discrète: vous les portez jour et nuit, elles suivent le sommeil avec phases (léger, profond, REM), la fréquence cardiaque, la saturation en oxygène du sang et le niveau de stress, sans rien à activer manuellement. Le problème avec de nombreuses bagues abordables est l'application du fabricant: souvent rudimentaire, les données restent enfermées, il n'y a pas d'intégration avec la montre connectée que vous portez dans la journée et pas de tableau de bord web digne de ce nom.",
        },
      },
      {
        type: "paragraph",
        text: {
          it: "FitMesh Sync risolve esattamente questo. Invece di usare l'app Colmi, usi FitMesh: si collega direttamente all'anello via Bluetooth, scarica i dati, li manda al cloud EU e li mostra su una dashboard web unificata con gli altri tuoi wearable.",
          en: "FitMesh Sync solves exactly this. Instead of using the Colmi app, you use FitMesh: it connects directly to the ring via Bluetooth, pulls the data, sends it to the EU cloud, and shows it on a unified web dashboard alongside your other wearables.",
          de: "FitMesh Sync löst genau das. Anstatt die Colmi-App zu verwenden, nutzt du FitMesh: Es verbindet sich direkt via Bluetooth mit dem Ring, lädt die Daten herunter, sendet sie in die EU-Cloud und zeigt sie auf einem vereinten Web-Dashboard zusammen mit deinen anderen Wearables.",
          pt: "FitMesh Sync resolve exatamente isso. Em vez de usar o app Colmi, você usa o FitMesh: ele conecta-se diretamente ao anel via Bluetooth, baixa os dados, envia para a nuvem na UE e os exibe em um painel web unificado junto com seus outros wearables.",
          fr: "FitMesh Sync résout exactement cela. Au lieu d'utiliser l'application Colmi, vous utilisez FitMesh: il se connecte directement à la bague via Bluetooth, récupère les données, les envoie vers le cloud UE et les affiche sur un tableau de bord web unifié avec vos autres appareils connectés.",
        },
      },
      {
        type: "heading",
        level: 2,
        text: {
          it: "Cosa legge FitMesh dall'anello Colmi",
          en: "What FitMesh reads from the Colmi ring",
          de: "Was FitMesh vom Colmi-Ring liest",
          pt: "O que o FitMesh lê do anel Colmi",
          fr: "Ce que FitMesh lit depuis la bague Colmi",
        },
      },
      {
        type: "list",
        items: {
          it: [
            "**Passi**: conteggio giornaliero e per intervallo orario",
            "**Frequenza cardiaca**: campioni continui e media giornaliera",
            "**SpO2**: saturazione dell'ossigeno nel sangue",
            "**Sonno con fasi**: durata totale, Leggero, Profondo, REM, Sveglio",
            "**Stress**: punteggio basato sulla variabilità cardiaca",
            "**Batteria**: livello di carica residua dell'anello",
          ],
          en: [
            "**Steps**: daily count and hourly interval breakdown",
            "**Heart rate**: continuous samples and daily average",
            "**SpO2**: blood oxygen saturation",
            "**Sleep with stages**: total duration, Light, Deep, REM, Awake",
            "**Stress**: score based on heart rate variability",
            "**Battery**: remaining charge level of the ring",
          ],
          de: [
            "**Schritte**: Tagesanzahl und stündliche Aufschlüsselung",
            "**Herzfrequenz**: kontinuierliche Messungen und Tagesdurchschnitt",
            "**SpO2**: Blutsauerstoffsättigung",
            "**Schlaf mit Phasen**: Gesamtdauer, Leichtschlaf, Tiefschlaf, REM, Wach",
            "**Stress**: Wert basierend auf der Herzfrequenzvariabilität",
            "**Akku**: verbleibender Ladestand des Rings",
          ],
          pt: [
            "**Passos**: contagem diária e por intervalo horário",
            "**Frequência cardíaca**: amostras contínuas e média diária",
            "**SpO2**: saturação de oxigênio no sangue",
            "**Sono com fases**: duração total, Leve, Profundo, REM, Acordado",
            "**Stress**: pontuação baseada na variabilidade da frequência cardíaca",
            "**Bateria**: nível de carga restante do anel",
          ],
          fr: [
            "**Pas**: comptage journalier et par intervalle horaire",
            "**Fréquence cardiaque**: mesures continues et moyenne journalière",
            "**SpO2**: saturation en oxygène du sang",
            "**Sommeil avec phases**: durée totale, Léger, Profond, REM, Éveillé",
            "**Stress**: score basé sur la variabilité de la fréquence cardiaque",
            "**Batterie**: niveau de charge restant de la bague",
          ],
        },
      },
      {
        type: "heading",
        level: 2,
        text: {
          it: "Dashboard unificata: anello + smartwatch, zero doppioni",
          en: "Unified dashboard: ring + smartwatch, zero duplicates",
          de: "Vereintes Dashboard: Ring und Smartwatch, null Duplikate",
          pt: "Painel unificado: anel e smartwatch, zero duplicatas",
          fr: "Tableau de bord unifié: bague et montre connectée, zéro doublon",
        },
      },
      {
        type: "paragraph",
        text: {
          it: "Molti usano l'anello di notte (per il sonno) e lo smartwatch di giorno (per sport e notifiche). FitMesh li mette insieme in un'unica vista: il sonno viene dall'anello Colmi, i passi e gli allenamenti dal watch. Quando le stesse misure arrivano da due fonti, FitMesh applica un meccanismo anti-duplicato: non somma due volte lo stesso passo.",
          en: "Many people use the ring at night (for sleep) and the smartwatch during the day (for sport and notifications). FitMesh puts them together in a single view: sleep comes from the Colmi ring, steps and workouts from the watch. When the same measurement arrives from two sources, FitMesh applies a deduplication mechanism: the same step is never counted twice.",
          de: "Viele tragen den Ring nachts (für den Schlaf) und die Smartwatch tagsüber (für Sport und Benachrichtigungen). FitMesh vereint sie in einer einzigen Ansicht: Schlaf kommt vom Colmi-Ring, Schritte und Trainings von der Uhr. Wenn dieselbe Messung von zwei Quellen eintrifft, wendet FitMesh einen Deduplizierungsmechanismus an: Derselbe Schritt wird nie zweimal gezählt.",
          pt: "Muita gente usa o anel à noite (para o sono) e o smartwatch durante o dia (para esportes e notificações). FitMesh os reúne em uma única visualização: o sono vem do anel Colmi, os passos e os treinos do relógio. Quando a mesma medição chega de duas fontes, o FitMesh aplica um mecanismo anti-duplicata: o mesmo passo nunca é contado duas vezes.",
          fr: "Beaucoup de personnes portent la bague la nuit (pour le sommeil) et la montre connectée dans la journée (pour le sport et les notifications). FitMesh les réunit dans une seule vue: le sommeil vient de la bague Colmi, les pas et les séances d'entraînement de la montre. Quand la même mesure arrive de deux sources, FitMesh applique un mécanisme de déduplication: le même pas n'est jamais compté deux fois.",
        },
      },
      {
        type: "heading",
        level: 2,
        text: {
          it: "Come funziona: setup in 3 passi",
          en: "How it works: 3-step setup",
          de: "Wie es funktioniert: Einrichtung in 3 Schritten",
          pt: "Como funciona: configuração em 3 passos",
          fr: "Comment ça fonctionne: configuration en 3 étapes",
        },
      },
      {
        type: "list",
        ordered: true,
        items: {
          it: [
            "Installa **FitMesh Sync** dal Play Store e accedi con Google.",
            "Apri la sezione **Anello** nell'app e tieni l'anello Colmi vicino al telefono: FitMesh lo trova via Bluetooth e si accoppia in automatico.",
            "Apri la **dashboard web** (link nell'app oppure accedi da browser): passi, sonno e battito sono già visibili.",
          ],
          en: [
            "Install **FitMesh Sync** from the Play Store and sign in with Google.",
            "Open the **Ring** section in the app and keep the Colmi ring near your phone: FitMesh finds it via Bluetooth and pairs automatically.",
            "Open the **web dashboard** (link in the app or sign in from a browser): steps, sleep, and heart rate are already visible.",
          ],
          de: [
            "Installiere **FitMesh Sync** aus dem Play Store und melde dich mit Google an.",
            "Öffne den Bereich **Ring** in der App und halte den Colmi-Ring nah ans Telefon: FitMesh findet ihn via Bluetooth und koppelt automatisch.",
            "Öffne das **Web-Dashboard** (Link in der App oder über einen Browser anmelden): Schritte, Schlaf und Herzfrequenz sind sofort sichtbar.",
          ],
          pt: [
            "Instale o **FitMesh Sync** na Play Store e entre com o Google.",
            "Abra a seção **Anel** no app e mantenha o anel Colmi perto do celular: o FitMesh o encontra via Bluetooth e faz o pareamento automaticamente.",
            "Abra o **painel web** (link no app ou entre pelo navegador): passos, sono e frequência cardíaca já estão visíveis.",
          ],
          fr: [
            "Installez **FitMesh Sync** depuis le Play Store et connectez-vous avec Google.",
            "Ouvrez la section **Bague** dans l'application et gardez la bague Colmi près du téléphone: FitMesh la trouve via Bluetooth et s'associe automatiquement.",
            "Ouvrez le **tableau de bord web** (lien dans l'application ou connectez-vous depuis un navigateur): les pas, le sommeil et la fréquence cardiaque sont déjà visibles.",
          ],
        },
      },
      {
        type: "heading",
        level: 2,
        text: {
          it: "Compatibilità: cosa funziona oggi",
          en: "Compatibility: what works today",
          de: "Kompatibilität: Was heute funktioniert",
          pt: "Compatibilidade: o que funciona hoje",
          fr: "Compatibilité: ce qui fonctionne aujourd'hui",
        },
      },
      {
        type: "table",
        caption: {
          it: "Stato di compatibilità (giugno 2026)",
          en: "Compatibility status (June 2026)",
          de: "Kompatibilitätsstatus (Juni 2026)",
          pt: "Status de compatibilidade (junho 2026)",
          fr: "État de compatibilité (juin 2026)",
        },
        headers: {
          it: ["Funzione", "Android", "iPhone"],
          en: ["Feature", "Android", "iPhone"],
          de: ["Funktion", "Android", "iPhone"],
          pt: ["Função", "Android", "iPhone"],
          fr: ["Fonction", "Android", "iPhone"],
        },
        rows: [
          {
            it: ["Connessione Bluetooth all'anello Colmi", "Disponibile", "In arrivo (beta)"],
            en: ["Bluetooth connection to Colmi ring", "Available", "Coming soon (beta)"],
            de: ["Bluetooth-Verbindung zum Colmi-Ring", "Verfügbar", "Demnächst verfügbar (Beta)"],
            pt: ["Conexão Bluetooth com o anel Colmi", "Disponível", "Em breve (beta)"],
            fr: ["Connexion Bluetooth à la bague Colmi", "Disponible", "Bientôt disponible (bêta)"],
          },
          {
            it: ["Passi, battito, SpO2, stress, batteria", "Disponibile", "In arrivo (beta)"],
            en: ["Steps, heart rate, SpO2, stress, battery", "Available", "Coming soon (beta)"],
            de: ["Schritte, Herzfrequenz, SpO2, Stress, Akku", "Verfügbar", "Demnächst verfügbar (Beta)"],
            pt: ["Passos, frequência cardíaca, SpO2, stress, bateria", "Disponível", "Em breve (beta)"],
            fr: ["Pas, fréquence cardiaque, SpO2, stress, batterie", "Disponible", "Bientôt disponible (bêta)"],
          },
          {
            it: ["Sonno con fasi (Leggero, Profondo, REM)", "Disponibile", "In arrivo (beta)"],
            en: ["Sleep with stages (Light, Deep, REM)", "Available", "Coming soon (beta)"],
            de: ["Schlaf mit Phasen (Leichtschlaf, Tiefschlaf, REM)", "Verfügbar", "Demnächst verfügbar (Beta)"],
            pt: ["Sono com fases (Leve, Profundo, REM)", "Disponível", "Em breve (beta)"],
            fr: ["Sommeil avec phases (Léger, Profond, REM)", "Disponible", "Bientôt disponible (bêta)"],
          },
          {
            it: ["Dashboard web (stesso account)", "Disponibile", "Disponibile"],
            en: ["Web dashboard (same account)", "Available", "Available"],
            de: ["Web-Dashboard (gleisches Konto)", "Verfügbar", "Verfügbar"],
            pt: ["Painel web (mesma conta)", "Disponível", "Disponível"],
            fr: ["Tableau de bord web (même compte)", "Disponible", "Disponible"],
          },
          {
            it: ["Scrittura su Apple Salute", "n/a", "In arrivo (beta)"],
            en: ["Write to Apple Health", "n/a", "Coming soon (beta)"],
            de: ["Schreiben in Apple Health", "n/a", "Demnächst verfügbar (Beta)"],
            pt: ["Escrita no Apple Health", "n/a", "Em breve (beta)"],
            fr: ["Écriture dans Apple Health", "n/a", "Bientôt disponible (bêta)"],
          },
          {
            it: ["Unione con dati smartwatch (no doppioni)", "Disponibile", "In arrivo (beta)"],
            en: ["Merge with smartwatch data (no duplicates)", "Available", "Coming soon (beta)"],
            de: ["Zusammenführung mit Smartwatch-Daten (keine Duplikate)", "Verfügbar", "Demnächst verfügbar (Beta)"],
            pt: ["Fusão com dados do smartwatch (sem duplicatas)", "Disponível", "Em breve (beta)"],
            fr: ["Fusion avec données de montre connectée (sans doublons)", "Disponible", "Bientôt disponible (bêta)"],
          },
        ],
      },
      {
        type: "callout",
        variant: "info",
        title: {
          it: "Anello Colmi su iPhone: in arrivo",
          en: "Colmi ring on iPhone: coming soon",
          de: "Colmi-Ring auf iPhone: demnächst verfügbar",
          pt: "Anel Colmi no iPhone: em breve",
          fr: "Bague Colmi sur iPhone: bientôt disponible",
        },
        body: {
          it: "L'app FitMesh iOS supporta l'anello Colmi via Bluetooth ed è in fase di revisione per l'App Store. Con un unico account FitMesh, i dati dell'anello si vedono su entrambi i telefoni e vengono scritti dentro Apple Salute (ponte opzionale). Iscriviti alla beta su /it/beta per ricevere l'accesso non appena disponibile.",
          en: "The FitMesh iOS app supports the Colmi ring via Bluetooth and is under App Store review. With one FitMesh account, ring data is visible on both phones and written into Apple Health (optional bridge). Join the beta at /en/beta to get access as soon as it's available.",
          de: "Die FitMesh iOS-App unterstützt den Colmi-Ring via Bluetooth und befindet sich in der App Store-Überprüfung. Mit einem einzigen FitMesh-Konto sind die Ringdaten auf beiden Telefonen sichtbar und werden in Apple Health geschrieben (optionale Brücke). Tritt der Beta unter /de/beta bei, um Zugang zu erhalten, sobald er verfügbar ist.",
          pt: "O app FitMesh iOS suporta o anel Colmi via Bluetooth e está em revisão para a App Store. Com uma única conta FitMesh, os dados do anel ficam visíveis nos dois celulares e são gravados no Apple Health (ponte opcional). Inscreva-se na beta em /pt/beta para receber o acesso assim que disponível.",
          fr: "L'application FitMesh iOS prend en charge la bague Colmi via Bluetooth et est en cours de révision pour l'App Store. Avec un seul compte FitMesh, les données de la bague sont visibles sur les deux téléphones et écrites dans Apple Health (pont optionnel). Rejoignez la bêta sur /fr/beta pour obtenir l'accès dès qu'il sera disponible.",
        },
      },
      {
        type: "cta",
        title: {
          it: "Pronto a usare il tuo anello Colmi senza l'app del produttore?",
          en: "Ready to use your Colmi ring without the manufacturer app?",
          de: "Bereit, deinen Colmi-Ring ohne die Hersteller-App zu nutzen?",
          pt: "Pronto para usar seu anel Colmi sem o app do fabricante?",
          fr: "Prêt à utiliser votre bague Colmi sans l'application du fabricant?",
        },
        body: {
          it: "100 posti founder gratis durante la beta. App Android disponibile ora su Play Store, dashboard web inclusa.",
          en: "100 free founder spots during beta. Android app available now on Play Store, web dashboard included.",
          de: "100 kostenlose Founder-Plätze während der Beta. Android-App jetzt auf dem Play Store verfügbar, Web-Dashboard inklusive.",
          pt: "100 vagas founder grátis durante a beta. App Android disponível agora no Play Store, painel web incluído.",
          fr: "100 places founder gratuites pendant la bêta. Application Android disponible maintenant sur le Play Store, tableau de bord web inclus.",
        },
        ctaLabel: { it: "Entra in beta →", en: "Join beta →", de: "Zur Beta →", pt: "Entrar na beta →", fr: "Rejoindre la bêta →" },
        ctaHref: { it: "/it/beta", en: "/en/beta", de: "/de/beta", pt: "/pt/beta", fr: "/fr/beta" },
      },
    ],
    faq: [
      {
        q: {
          it: "Devo tenere l'app Colmi sul telefono?",
          en: "Do I need to keep the Colmi app on my phone?",
          de: "Muss ich die Colmi-App auf dem Telefon behalten?",
          pt: "Preciso manter o app Colmi no celular?",
          fr: "Dois-je garder l'application Colmi sur mon téléphone?",
        },
        a: {
          it: "No. FitMesh Sync si connette direttamente all'anello via Bluetooth, quindi l'app del produttore non è necessaria. Puoi disinstallarla se vuoi. FitMesh raccoglie i dati in autonomia e li invia alla dashboard web.",
          en: "No. FitMesh Sync connects directly to the ring via Bluetooth, so the manufacturer app is not needed. You can uninstall it if you want. FitMesh collects data independently and sends it to the web dashboard.",
          de: "Nein. FitMesh Sync verbindet sich direkt via Bluetooth mit dem Ring, daher ist die Hersteller-App nicht erforderlich. Du kannst sie deinstallieren, wenn du möchtest. FitMesh sammelt Daten eigenständig und sendet sie an das Web-Dashboard.",
          pt: "Não. FitMesh Sync conecta-se diretamente ao anel via Bluetooth, portanto o app do fabricante não é necessário. Você pode desinstalá-lo se quiser. O FitMesh coleta os dados de forma independente e os envia ao painel web.",
          fr: "Non. FitMesh Sync se connecte directement à la bague via Bluetooth, donc l'application du fabricant n'est pas nécessaire. Vous pouvez la désinstaller si vous le souhaitez. FitMesh collecte les données de manière autonome et les envoie au tableau de bord web.",
        },
      },
      {
        q: {
          it: "Quali modelli Colmi sono supportati?",
          en: "Which Colmi models are supported?",
          de: "Welche Colmi-Modelle werden unterstützt?",
          pt: "Quais modelos Colmi são suportados?",
          fr: "Quels modèles Colmi sont pris en charge?",
        },
        a: {
          it: "FitMesh supporta i modelli Colmi più diffusi che usano il protocollo Bluetooth standard, inclusi i modelli della serie R (R02, R06, R08, R09, R10) e altri con funzionalità simili. La compatibilità viene ampliata progressivamente. Se il tuo modello non compare, iscriviti alla beta e segnalacelo: aggiungiamo i modelli richiesti in priorità.",
          en: "FitMesh supports the most common Colmi models using the standard Bluetooth protocol, including R-series models (R02, R06, R08, R09, R10) and others with similar features. Compatibility is expanded progressively. If your model isn't listed, join the beta and let us know: requested models are prioritized.",
          de: "FitMesh unterstützt die gängigsten Colmi-Modelle, die das Standard-Bluetooth-Protokoll verwenden, einschließlich R-Serie-Modelle (R02, R06, R08, R09, R10) und andere mit ähnlichen Funktionen. Die Kompatibilität wird schrittweise erweitert. Wenn dein Modell nicht aufgelistet ist, tritt der Beta bei und teile es uns mit: Angefragte Modelle werden priorisiert.",
          pt: "FitMesh suporta os modelos Colmi mais comuns que usam o protocolo Bluetooth padrão, incluindo os modelos da série R (R02, R06, R08, R09, R10) e outros com funcionalidades semelhantes. A compatibilidade é ampliada progressivamente. Se o seu modelo não estiver listado, inscreva-se na beta e nos avise: os modelos solicitados são priorizados.",
          fr: "FitMesh prend en charge les modèles Colmi les plus courants utilisant le protocole Bluetooth standard, notamment les modèles de la série R (R02, R06, R08, R09, R10) et d'autres aux fonctionnalités similaires. La compatibilité est élargie progressivement. Si votre modèle n'est pas répertorié, rejoignez la bêta et signalez-le nous: les modèles demandés sont traités en priorité.",
        },
      },
      {
        q: {
          it: "Se ho anche uno smartwatch, i passi vengono contati due volte?",
          en: "If I also have a smartwatch, will steps be counted twice?",
          de: "Wenn ich auch eine Smartwatch habe, werden die Schritte doppelt gezählt?",
          pt: "Se eu também tiver um smartwatch, os passos serão contados duas vezes?",
          fr: "Si j'ai aussi une montre connectée, les pas seront-ils comptés deux fois?",
        },
        a: {
          it: "No. FitMesh applica una logica anti-duplicato: se lo stesso intervallo temporale ha dati sia dall'anello sia dallo smartwatch, viene usata la fonte con il dato migliore (o più recente), non la somma. L'obiettivo è avere un conteggio corretto, non gonfiato.",
          en: "No. FitMesh applies a deduplication logic: if the same time interval has data from both the ring and the smartwatch, the source with the better (or more recent) data is used, not the sum. The goal is an accurate count, not an inflated one.",
          de: "Nein. FitMesh wendet eine Deduplizierungslogik an: Wenn derselbe Zeitraum Daten sowohl vom Ring als auch von der Smartwatch hat, wird die Quelle mit dem besseren (oder neueren) Wert verwendet, nicht die Summe. Das Ziel ist eine korrekte Anzahl, keine aufgeblähte.",
          pt: "Não. FitMesh aplica uma lógica anti-duplicata: se o mesmo intervalo de tempo tiver dados do anel e do smartwatch, é usada a fonte com o dado melhor (ou mais recente), não a soma. O objetivo é ter uma contagem correta, não inflada.",
          fr: "Non. FitMesh applique une logique de déduplication: si le même intervalle de temps dispose de données à la fois de la bague et de la montre connectée, la source avec la meilleure donnée (ou la plus récente) est utilisée, pas la somme. L'objectif est un comptage précis, pas gonflé.",
        },
      },
      {
        q: {
          it: "I dati del sonno compaiono su Apple Salute?",
          en: "Does sleep data appear in Apple Health?",
          de: "Erscheinen die Schlafdaten in Apple Health?",
          pt: "Os dados do sono aparecem no Apple Health?",
          fr: "Les données de sommeil apparaissent-elles dans Apple Health?",
        },
        a: {
          it: "Su Android, i dati vengono archiviati nel cloud FitMesh e mostrati sulla dashboard web. Su iPhone, l'app FitMesh iOS (in arrivo) scrive il sonno con fasi, i passi e il battito cardiaco dentro Apple Salute, rendendoli visibili nell'app Salute di Apple e in qualsiasi altra app che legge da Apple Salute. Non sono disponibili su App Store in questo momento: iscriviti alla beta per l'accesso anticipato.",
          en: "On Android, data is stored in the FitMesh cloud and shown on the web dashboard. On iPhone, the FitMesh iOS app (coming soon) writes sleep with stages, steps, and heart rate into Apple Health, making them visible in Apple's Health app and in any app reading from Apple Health. Not available on the App Store at this time: join the beta for early access.",
          de: "Auf Android werden die Daten in der FitMesh-Cloud gespeichert und im Web-Dashboard angezeigt. Auf dem iPhone schreibt die FitMesh iOS-App (demnächst verfügbar) Schlaf mit Phasen, Schritte und Herzfrequenz in Apple Health und macht sie in Apples Health-App und in jeder App sichtbar, die Apple Health liest. Derzeit nicht im App Store verfügbar: Tritt der Beta für frühzeitigen Zugang bei.",
          pt: "No Android, os dados são armazenados na nuvem FitMesh e exibidos no painel web. No iPhone, o app FitMesh iOS (em breve) grava o sono com fases, os passos e a frequência cardíaca no Apple Health, tornando-os visíveis no app Saúde da Apple e em qualquer app que leia do Apple Health. Não disponível na App Store neste momento: inscreva-se na beta para acesso antecipado.",
          fr: "Sur Android, les données sont stockées dans le cloud FitMesh et affichées sur le tableau de bord web. Sur iPhone, l'application FitMesh iOS (bientôt disponible) écrit le sommeil avec phases, les pas et la fréquence cardiaque dans Apple Health, les rendant visibles dans l'application Santé d'Apple et dans toute application lisant depuis Apple Health. Non disponible sur l'App Store pour le moment: rejoignez la bêta pour un accès anticipé.",
        },
      },
      {
        q: {
          it: "FitMesh può fare affermazioni mediche sui dati SpO2 o stress?",
          en: "Can FitMesh make medical claims about SpO2 or stress data?",
          de: "Kann FitMesh medizinische Aussagen über SpO2- oder Stressdaten machen?",
          pt: "O FitMesh pode fazer afirmações médicas sobre dados de SpO2 ou stress?",
          fr: "FitMesh peut-il faire des allégations médicales sur les données SpO2 ou stress?",
        },
        a: {
          it: "No. I dati di SpO2 e stress forniti dall'anello Colmi sono misurazioni consumer per il monitoraggio personale del benessere, non strumenti diagnostici. FitMesh li mostra così come arrivano dall'anello. Per qualsiasi valutazione clinica, rivolgiti a un professionista sanitario.",
          en: "No. SpO2 and stress data from the Colmi ring are consumer-grade measurements for personal wellness monitoring, not diagnostic tools. FitMesh displays them as received from the ring. For any clinical assessment, consult a healthcare professional.",
          de: "Nein. SpO2- und Stressdaten vom Colmi-Ring sind Messungen für den Consumer-Bereich zur persönlichen Wellness-Überwachung, keine Diagnosewerkzeuge. FitMesh zeigt sie so an, wie sie vom Ring empfangen werden. Wende dich für jede klinische Bewertung an einen Gesundheitsexperten.",
          pt: "Não. Os dados de SpO2 e stress do anel Colmi são medições voltadas ao consumidor para monitoramento pessoal do bem-estar, não ferramentas de diagnóstico. O FitMesh os exibe conforme recebidos do anel. Para qualquer avaliação clínica, consulte um profissional de saúde.",
          fr: "Non. Les données SpO2 et stress de la bague Colmi sont des mesures grand public pour la surveillance personnelle du bien-être, pas des outils de diagnostic. FitMesh les affiche telles que reçues de la bague. Pour toute évaluation, consultez un professionnel de santé.",
        },
      },
    ],
    brandsMentioned: ["Colmi", "Apple", "Google"],
  },

  // ── 6. Apple Health Export ────────────────────────────────────────────
  {
    slug: "apple-health-export",
    publishedAt: "2026-05-30",
    updatedAt: "2026-05-30",
    primaryKeyword: {
      it: "esportare dati apple health",
      en: "apple health data export web",
      de: "Apple Health Daten exportieren Web",
      pt: "exportar dados apple health web",
      fr: "exporter données apple health web",
    },
    secondaryKeywords: {
      it: [
        "apple health dashboard web",
        "vedere dati apple health su pc",
        "apple health backup cloud",
        "fitmesh ios iphone",
      ],
      en: [
        "apple health web dashboard",
        "view apple health data on pc",
        "apple health cloud backup",
        "fitmesh ios iphone app",
      ],
    },
    metaDescription: {
      it: "Dashboard web per Apple Health in arrivo su iOS: visualizza passi, sonno, frequenza cardiaca da iPhone su browser. FitMesh iOS beta: iscriviti ora.",
      en: "Web dashboard for Apple Health coming to iOS: view steps, sleep, heart rate from iPhone in a browser. FitMesh iOS beta: sign up now.",
      de: "Web-Dashboard für Apple Health kommt auf iOS: Schritte, Schlaf, Herzfrequenz vom iPhone im Browser ansehen. FitMesh iOS Beta: Jetzt anmelden.",
      pt: "Painel web para Apple Health chegando ao iOS: veja passos, sono, frequência cardíaca do iPhone no navegador. FitMesh iOS beta: inscreva-se agora.",
      fr: "Tableau de bord web pour Apple Health sur iOS: consultez pas, sommeil, fréquence cardiaque depuis l'iPhone dans un navigateur. Bêta FitMesh iOS: inscrivez-vous maintenant.",
    },
    hero: {
      kicker: { it: "FitMesh iOS", en: "FitMesh iOS", de: "FitMesh iOS", pt: "FitMesh iOS", fr: "FitMesh iOS" },
      title: {
        it: "Dashboard web per Apple Health: FitMesh iOS in arrivo",
        en: "Web dashboard for Apple Health: FitMesh iOS coming soon",
        de: "Web-Dashboard für Apple Health: FitMesh iOS demnächst verfügbar",
        pt: "Painel web para Apple Health: FitMesh iOS em breve",
        fr: "Tableau de bord web pour Apple Health: FitMesh iOS bientôt disponible",
      },
      subtitle: {
        it: "I tuoi dati da Apple Watch, Garmin, Oura e tutti i wearable che scrivono su Apple Health, su una dashboard web accessibile da qualsiasi browser, senza export manuali.",
        en: "Your data from Apple Watch, Garmin, Oura, and all wearables writing to Apple Health, on a web dashboard accessible from any browser, no manual exports needed.",
        de: "Deine Daten von Apple Watch, Garmin, Oura und allen Wearables, die in Apple Health schreiben, auf einem Web-Dashboard, das von jedem Browser zugänglich ist, ohne manuelle Exporte.",
        pt: "Seus dados do Apple Watch, Garmin, Oura e todos os wearables que escrevem no Apple Health, em um painel web acessível de qualquer navegador, sem exportações manuais.",
        fr: "Vos données d'Apple Watch, Garmin, Oura et tous les appareils connectés qui écrivent dans Apple Health, sur un tableau de bord web accessible depuis n'importe quel navigateur, sans exportations manuelles.",
      },
      primaryCta: {
        label: { it: "Unisciti alla beta iOS", en: "Join iOS beta", de: "iOS-Beta beitreten", pt: "Entrar na beta iOS", fr: "Rejoindre la bêta iOS" },
        href: { it: "/it/beta", en: "/en/beta", de: "/de/beta", pt: "/pt/beta", fr: "/fr/beta" },
      },
    },
    body: [
      {
        type: "paragraph",
        text: {
          it: "Apple Health è il sistema più completo per raccogliere dati salute su iPhone. Il problema storico: i dati restano nell'app, senza una web dashboard nativa. Puoi fare l'export XML manuale, ma è un file tecnico che richiede strumenti per essere letto, e devi rifarlo ogni volta. FitMesh iOS cambierà questa situazione.",
          en: "Apple Health is the most comprehensive system for collecting health data on iPhone. The long-standing problem: data stays in the app, with no native web dashboard. You can do a manual XML export, but it's a technical file requiring tools to read, and you have to redo it every time. FitMesh iOS will change this.",
          de: "Apple Health ist das umfassendste System zur Erfassung von Gesundheitsdaten auf dem iPhone. Das altbekannte Problem: Die Daten bleiben in der App, ohne natives Web-Dashboard. Du kannst einen manuellen XML-Export durchführen, aber das ist eine technische Datei, die Werkzeuge zum Lesen erfordert, und du musst es jedes Mal wiederholen. FitMesh iOS wird das ändern.",
          pt: "Apple Health é o sistema mais completo para coletar dados de saúde no iPhone. O problema histórico: os dados ficam no app, sem um painel web nativo. Você pode fazer o export XML manual, mas é um arquivo técnico que requer ferramentas para ser lido, e você precisa refazê-lo toda vez. FitMesh iOS vai mudar essa situação.",
          fr: "Apple Health est le système le plus complet pour collecter des données de santé sur iPhone. Le problème de longue date: les données restent dans l'application, sans tableau de bord web natif. Vous pouvez faire un export XML manuel, mais c'est un fichier technique nécessitant des outils pour être lu, et vous devez recommencer à chaque fois. FitMesh iOS va changer cela.",
        },
      },
      {
        type: "heading",
        level: 2,
        text: {
          it: "Come funzionerà FitMesh iOS",
          en: "How FitMesh iOS will work",
          de: "Wie FitMesh iOS funktionieren wird",
          pt: "Como o FitMesh iOS funcionará",
          fr: "Comment FitMesh iOS fonctionnera",
        },
      },
      {
        type: "list",
        items: {
          it: [
            "**Installi FitMesh Sync su iPhone**: concedi i permessi HealthKit per i tipi di dati che vuoi sincronizzare.",
            "**Sync automatico in background**: FitMesh legge i dati da Apple Health e li invia alla dashboard cloud senza che tu debba fare niente.",
            "**Accedi alla dashboard da qualsiasi browser**: stesso account, stessi dati, da PC, tablet o telefono.",
            "**Multi-wearable unificato**: Apple Watch, Garmin, Oura, Fitbit, se scrivono su Apple Health, FitMesh li aggrega insieme.",
          ],
          en: [
            "**Install FitMesh Sync on iPhone**: grant HealthKit permissions for the data types you want to sync.",
            "**Automatic background sync**: FitMesh reads data from Apple Health and sends it to the cloud dashboard without you doing anything.",
            "**Access dashboard from any browser**: same account, same data, from PC, tablet, or phone.",
            "**Unified multi-wearable**: Apple Watch, Garmin, Oura, Fitbit, if they write to Apple Health, FitMesh aggregates them together.",
          ],
          de: [
            "**FitMesh Sync auf iPhone installieren**: Erteile HealthKit-Berechtigungen für die Datentypen, die du synchronisieren möchtest.",
            "**Automatischer Hintergrund-Sync**: FitMesh liest Daten aus Apple Health und sendet sie an das Cloud-Dashboard, ohne dass du etwas tun musst.",
            "**Dashboard von jedem Browser aus aufrufen**: Gleisches Konto, gleiche Daten, von PC, Tablet oder Telefon.",
            "**Vereintes Multi-Wearable**: Apple Watch, Garmin, Oura, Fitbit: Wenn sie in Apple Health schreiben, aggregiert FitMesh sie zusammen.",
          ],
          pt: [
            "**Instale o FitMesh Sync no iPhone**: conceda permissões HealthKit para os tipos de dados que você quer sincronizar.",
            "**Sincronização automática em segundo plano**: FitMesh lê dados do Apple Health e os envia ao painel na nuvem sem você precisar fazer nada.",
            "**Acesse o painel de qualquer navegador**: mesma conta, mesmos dados, do PC, tablet ou celular.",
            "**Multi-wearable unificado**: Apple Watch, Garmin, Oura, Fitbit: se eles escrevem no Apple Health, o FitMesh os agrega juntos.",
          ],
          fr: [
            "**Installez FitMesh Sync sur iPhone**: accordez les autorisations HealthKit pour les types de données que vous souhaitez synchroniser.",
            "**Synchronisation automatique en arrière-plan**: FitMesh lit les données depuis Apple Health et les envoie au tableau de bord cloud sans que vous n'ayez rien à faire.",
            "**Accédez au tableau de bord depuis n'importe quel navigateur**: même compte, mêmes données, depuis un PC, une tablette ou un téléphone.",
            "**Multi-wearable unifié**: Apple Watch, Garmin, Oura, Fitbit: s'ils écrivent dans Apple Health, FitMesh les agrège ensemble.",
          ],
        },
      },
      {
        type: "heading",
        level: 2,
        text: {
          it: "Chi ne trarrà più beneficio",
          en: "Who benefits most",
          de: "Wer am meisten davon profitiert",
          pt: "Quem se beneficia mais",
          fr: "Qui en bénéficiera le plus",
        },
      },
      {
        type: "list",
        items: {
          it: [
            "**Utenti iPhone + Apple Watch**: storico dati su web, accessibile da PC senza dover usare l'app Health.",
            "**Multi-wearable su iPhone**: Garmin per running + Apple Watch per quotidiano, FitMesh li unifica.",
            "**Caregiver di familiari con iPhone**: dashboard condivisa per vedere i dati salute di chi si vuole bene.",
            "**Chi vuole backup indipendente**: copia dei propri dati Apple Health su server EU (Frankfurt), non nel cloud Apple.",
          ],
          en: [
            "**iPhone + Apple Watch users**: web history accessible from a PC without using the Health app.",
            "**Multi-wearable on iPhone**: Garmin for running + Apple Watch for daily, FitMesh unifies them.",
            "**Caregivers of iPhone family members**: shared dashboard to view health data of loved ones.",
            "**Those wanting independent backup**: copy of Apple Health data on EU server (Frankfurt), not in Apple cloud.",
          ],
          de: [
            "**iPhone-und-Apple-Watch-Nutzer**: Webhistorie von einem PC zugänglich, ohne die Health-App zu nutzen.",
            "**Multi-Wearable auf iPhone**: Garmin fürs Laufen und Apple Watch für den Alltag, FitMesh vereint sie.",
            "**Betreuungspersonen von iPhone-Familienmitgliedern**: Gemeinsames Dashboard, um die Gesundheitsdaten von Angehörigen einzusehen.",
            "**Wer ein unabhängiges Backup möchte**: Kopie der Apple Health-Daten auf EU-Server (Frankfurt), nicht in der Apple-Cloud.",
          ],
          pt: [
            "**Usuários de iPhone com Apple Watch**: histórico web acessível do PC sem usar o app Saúde.",
            "**Multi-wearable no iPhone**: Garmin para corrida e Apple Watch para o dia a dia, o FitMesh os unifica.",
            "**Cuidadores de familiares com iPhone**: painel compartilhado para ver os dados de saúde de quem você ama.",
            "**Quem quer backup independente**: cópia dos dados do Apple Health em servidor na UE (Frankfurt), não na nuvem Apple.",
          ],
          fr: [
            "**Utilisateurs iPhone et Apple Watch**: historique web accessible depuis un PC sans utiliser l'application Santé.",
            "**Multi-wearable sur iPhone**: Garmin pour la course et Apple Watch pour le quotidien, FitMesh les unifie.",
            "**Aidants de membres de la famille avec iPhone**: tableau de bord partagé pour consulter les données de santé de vos proches.",
            "**Ceux qui veulent une sauvegarde indépendante**: copie des données Apple Health sur serveur UE (Francfort), pas dans le cloud Apple.",
          ],
        },
      },
      {
        type: "callout",
        variant: "info",
        title: {
          it: "Già disponibile su Android",
          en: "Already available on Android",
          de: "Bereits auf Android verfügbar",
          pt: "Já disponível no Android",
          fr: "Déjà disponible sur Android",
        },
        body: {
          it: "FitMesh Sync è già disponibile su Android via Health Connect. Se hai un telefono Android con Galaxy Watch, Garmin, Fitbit o Pixel Watch, puoi iniziare subito. La versione iOS è in sviluppo attivo: iscriviti alla beta per essere tra i primi. Hai sia un Android che un iPhone? Leggi come funziona il multi-device su /it/lp/due-telefoni.",
          en: "FitMesh Sync is already available on Android via Health Connect. If you have an Android phone with Galaxy Watch, Garmin, Fitbit, or Pixel Watch, you can start right now. The iOS version is in active development: join the beta to be among the first. Have both Android and iPhone? Read how multi-device works at /en/lp/due-telefoni.",
          de: "FitMesh Sync ist bereits auf Android via Health Connect verfügbar. Wenn du ein Android-Telefon mit Galaxy Watch, Garmin, Fitbit oder Pixel Watch hast, kannst du sofort loslegen. Die iOS-Version ist in aktiver Entwicklung: Tritt der Beta bei, um zu den Ersten zu gehören. Hast du sowohl Android als auch iPhone? Lies, wie Multi-Device unter /de/lp/due-telefoni funktioniert.",
          pt: "FitMesh Sync já está disponível no Android via Health Connect. Se você tem um celular Android com Galaxy Watch, Garmin, Fitbit ou Pixel Watch, pode começar agora mesmo. A versão iOS está em desenvolvimento ativo: inscreva-se na beta para estar entre os primeiros. Tem tanto Android quanto iPhone? Leia como funciona o multi-dispositivo em /pt/lp/due-telefoni.",
          fr: "FitMesh Sync est déjà disponible sur Android via Health Connect. Si vous avez un téléphone Android avec Galaxy Watch, Garmin, Fitbit ou Pixel Watch, vous pouvez commencer tout de suite. La version iOS est en développement actif: rejoignez la bêta pour être parmi les premiers. Vous avez à la fois un Android et un iPhone? Lisez comment fonctionne le multi-appareil sur /fr/lp/due-telefoni.",
        },
      },
      {
        type: "cta",
        title: {
          it: "Iscriviti alla beta iOS (posti limitati)",
          en: "Join the iOS beta (limited spots)",
          de: "iOS-Beta beitreten (begrenzte Plätze)",
          pt: "Inscreva-se na beta iOS (vagas limitadas)",
          fr: "Rejoindre la bêta iOS (places limitées)",
        },
        body: {
          it: "Stiamo costruendo FitMesh iOS per portare Apple Health su web. Iscriviti ora e sarai tra i primi a ricevere l'accesso quando sarà pronto.",
          en: "We're building FitMesh iOS to bring Apple Health to the web. Sign up now and you'll be among the first to get access when it's ready.",
          de: "Wir bauen FitMesh iOS, um Apple Health ins Web zu bringen. Melde dich jetzt an und du gehörst zu den Ersten, die Zugang erhalten, wenn es bereit ist.",
          pt: "Estamos construindo o FitMesh iOS para levar o Apple Health para a web. Inscreva-se agora e você estará entre os primeiros a receber acesso quando estiver pronto.",
          fr: "Nous construisons FitMesh iOS pour amener Apple Health sur le web. Inscrivez-vous maintenant et vous serez parmi les premiers à obtenir l'accès quand il sera prêt.",
        },
        ctaLabel: { it: "Iscriviti alla beta →", en: "Join beta →", de: "Zur Beta →", pt: "Entrar na beta →", fr: "Rejoindre la bêta →" },
        ctaHref: { it: "/it/beta", en: "/en/beta", de: "/de/beta", pt: "/pt/beta", fr: "/fr/beta" },
      },
    ],
    faq: [
      {
        q: {
          it: "Quando arriva FitMesh su iOS?",
          en: "When is FitMesh coming to iOS?",
          de: "Wann kommt FitMesh auf iOS?",
          pt: "Quando o FitMesh chega ao iOS?",
          fr: "Quand FitMesh arrive-t-il sur iOS?",
        },
        a: {
          it: "È in sviluppo attivo. La versione beta iOS sarà disponibile dopo il completamento del processo Apple Developer Program e TestFlight. Iscriviti alla lista beta: riceverai un'email non appena i posti saranno disponibili.",
          en: "It's in active development. The iOS beta will be available after completing the Apple Developer Program and TestFlight process. Join the beta list: you'll receive an email as soon as spots are available.",
          de: "Es ist in aktiver Entwicklung. Die iOS-Beta wird nach Abschluss des Apple Developer Program und TestFlight-Prozesses verfügbar sein. Tritt der Beta-Liste bei: Du erhältst eine E-Mail, sobald Plätze verfügbar sind.",
          pt: "Está em desenvolvimento ativo. A beta iOS estará disponível após a conclusão do processo do Apple Developer Program e TestFlight. Inscreva-se na lista beta: você receberá um e-mail assim que as vagas estiverem disponíveis.",
          fr: "Il est en développement actif. La bêta iOS sera disponible après avoir complété le processus Apple Developer Program et TestFlight. Rejoignez la liste bêta: vous recevrez un e-mail dès que des places seront disponibles.",
        },
      },
      {
        q: {
          it: "FitMesh iOS richiede un abbonamento?",
          en: "Does FitMesh iOS require a subscription?",
          de: "Erfordert FitMesh iOS ein Abonnement?",
          pt: "O FitMesh iOS requer uma assinatura?",
          fr: "FitMesh iOS nécessite-t-il un abonnement?",
        },
        a: {
          it: "Durante la beta è gratuito, 100 posti founder. Il modello post-beta è in definizione. L'obiettivo è rimanere accessibile: una dashboard salute non dovrebbe costare quanto un servizio di streaming.",
          en: "During beta it's free, 100 founder spots. The post-beta model is being defined. The goal is to remain accessible: a health dashboard shouldn't cost as much as a streaming service.",
          de: "Während der Beta ist es kostenlos, 100 Founder-Plätze. Das Post-Beta-Modell ist in der Ausarbeitung. Das Ziel ist es, zugänglich zu bleiben: Ein Gesundheits-Dashboard sollte nicht so viel kosten wie ein Streaming-Dienst.",
          pt: "Durante a beta é gratuito, 100 vagas founder. O modelo pós-beta está sendo definido. O objetivo é permanecer acessível: um painel de saúde não deveria custar tanto quanto um serviço de streaming.",
          fr: "Pendant la bêta, c'est gratuit, 100 places founder. Le modèle post-bêta est en cours de définition. L'objectif est de rester accessible: un tableau de bord de santé ne devrait pas coûter autant qu'un service de streaming.",
        },
      },
      {
        q: {
          it: "I miei dati Apple Health sono al sicuro con FitMesh?",
          en: "Is my Apple Health data safe with FitMesh?",
          de: "Sind meine Apple Health-Daten bei FitMesh sicher?",
          pt: "Meus dados do Apple Health estão seguros com o FitMesh?",
          fr: "Mes données Apple Health sont-elles en sécurité avec FitMesh?",
        },
        a: {
          it: "I dati vengono trasmessi su HTTPS e archiviati in un database Postgres protetto da RLS (Row Level Security): ogni utente vede solo i propri dati. Il server è in EU (Frankfurt). Puoi cancellare tutto dai nostri server in qualsiasi momento con 'Elimina account e dati' nell'app. La privacy policy è consultabile su fitmesh.fit.",
          en: "Data is transmitted over HTTPS and stored in a Postgres database protected by RLS (Row Level Security): each user sees only their own data. Server is in the EU (Frankfurt). You can delete everything from our servers at any time with 'Delete account and data' in the app. Privacy policy is available at fitmesh.fit.",
          de: "Daten werden über HTTPS übertragen und in einer Postgres-Datenbank gespeichert, die durch RLS (Row Level Security) geschützt ist: Jeder Nutzer sieht nur seine eigenen Daten. Der Server befindet sich in der EU (Frankfurt). Du kannst alles von unseren Servern jederzeit mit 'Konto und Daten löschen' in der App löschen. Die Datenschutzerklärung ist unter fitmesh.fit abrufbar.",
          pt: "Os dados são transmitidos via HTTPS e armazenados em um banco de dados Postgres protegido por RLS (Row Level Security): cada usuário vê apenas seus próprios dados. O servidor está na UE (Frankfurt). Você pode excluir tudo dos nossos servidores a qualquer momento com 'Excluir conta e dados' no app. A política de privacidade está disponível em fitmesh.fit.",
          fr: "Les données sont transmises via HTTPS et stockées dans une base de données Postgres protégée par RLS (Row Level Security): chaque utilisateur ne voit que ses propres données. Le serveur est dans l'UE (Francfort). Vous pouvez tout supprimer de nos serveurs à tout moment avec 'Supprimer le compte et les données' dans l'application. La politique de confidentialité est disponible sur fitmesh.fit.",
        },
      },
    ],
    brandsMentioned: ["Apple", "Samsung", "Garmin", "Oura", "Fitbit", "Google"],
  },
];

export const LANDING_PAGES: LandingPage[] = LANDING_PAGES_RAW;

export const LANDING_PAGES_BY_SLUG: Record<string, LandingPage> = Object.fromEntries(
  LANDING_PAGES.map((p) => [p.slug, p]),
);

export const LANDING_SLUGS: string[] = LANDING_PAGES.map((p) => p.slug);
