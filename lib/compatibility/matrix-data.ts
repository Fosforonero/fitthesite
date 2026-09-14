import type { SupportedMatrixLocale } from "./glossary-data";

export type PhoneOs = "android" | "ios";
export type DeviceFamily =
  | "garmin"
  | "fitbit"
  | "galaxy-watch"
  | "pixel-watch"
  | "oura-ring"
  | "colmi-ring";

export type CompatibilityStatus = "supported" | "conditional" | "unsupported" | "unverified";
export type DataDirection = "read" | "read-write";

export type EvidenceLevel =
  | "vendor_documented"
  | "release_code_verified"
  | "device_tested"
  | "end_to_end_verified";

export interface OfficialSource {
  title: Record<SupportedMatrixLocale, string>;
  url: string;
  verifiedDate: string; // ISO date YYYY-MM-DD
  supportedClaim: Record<SupportedMatrixLocale, string>;
}

export interface EvidenceFact {
  level: EvidenceLevel;
  label: Record<SupportedMatrixLocale, string>;
  details: Record<SupportedMatrixLocale, string>;
}

export interface CompatibilitySteps {
  /** A: Cosa misura fisicamente il dispositivo hardware (distinguendo comune vs modello vs proprietario) */
  stepA: Record<SupportedMatrixLocale, string>;
  /** B: Cosa conserva o mostra l'applicazione dell'ecosistema del produttore */
  stepB: Record<SupportedMatrixLocale, string>;
  /** C: Cosa l'app esporta realmente verso Health Connect, Apple Health o protocollo BLE */
  stepC: Record<SupportedMatrixLocale, string>;
  /** D: Cosa la release pubblica FitMesh (v3.10.0+191) legge o scrive effettivamente */
  stepD: Record<SupportedMatrixLocale, string>;
}

export interface CompatibilitySubpath {
  id: string;
  title: Record<SupportedMatrixLocale, string>;
  route: Record<SupportedMatrixLocale, string>;
  requirements: Record<SupportedMatrixLocale, string>;
  metricsRead: Record<SupportedMatrixLocale, string>;
  fallback: Record<SupportedMatrixLocale, string>;
  verificationStatus: Record<SupportedMatrixLocale, string>;
  availability: Record<SupportedMatrixLocale, string>;
}

export interface CompatibilityPath {
  id: string;
  providerSlug: string;
  phoneOs: PhoneOs;
  phoneOsLabel: Record<SupportedMatrixLocale, string>;
  deviceFamily: DeviceFamily;
  deviceFamilyLabel: Record<SupportedMatrixLocale, string>;
  status: CompatibilityStatus;
  statusLabel: Record<SupportedMatrixLocale, string>;
  direction: DataDirection;
  directionLabel: Record<SupportedMatrixLocale, string>;
  steps: CompatibilitySteps;
  metricsSummary: Record<SupportedMatrixLocale, string>;
  requirements: Record<SupportedMatrixLocale, string>;
  limitations: Record<SupportedMatrixLocale, string>;
  officialSource: OfficialSource;
  officialSources?: readonly OfficialSource[];
  evidence: EvidenceFact;
  subpaths?: readonly CompatibilitySubpath[];
  guideSlug?: string;
}

export const EVIDENCE_LABELS: Record<EvidenceLevel, Record<SupportedMatrixLocale, string>> = {
  vendor_documented: {
    it: "Documentato dal produttore e compatibile con FitMesh",
    en: "Vendor-documented and compatible with FitMesh",
    de: "Vom Hersteller dokumentiert und mit FitMesh kompatibel",
    fr: "Documenté par le fabricant et compatible avec FitMesh",
  },
  release_code_verified: {
    it: "Verificato nel codice release FitMesh",
    en: "Verified in FitMesh release code",
    de: "Im FitMesh-Release-Code verifiziert",
    fr: "Vérifié dans le code de release FitMesh",
  },
  device_tested: {
    it: "Verificato su dispositivo reale",
    en: "Verified on physical device",
    de: "Auf physischem Gerät verifiziert",
    fr: "Vérifié sur appareil physique",
  },
  end_to_end_verified: {
    it: "Verificato end-to-end su dispositivo reale",
    en: "End-to-end verified on physical device",
    de: "End-to-End auf physischem Gerät verifiziert",
    fr: "Vérifié de bout en bout sur appareil physique",
  },
};

export const COMPATIBILITY_PATHS: readonly CompatibilityPath[] = [
  // ── 1. Garmin su Android ──────────────────────────────────────────────
  {
    id: "garmin-android",
    providerSlug: "garmin",
    phoneOs: "android",
    phoneOsLabel: {
      it: "Android (14+)",
      en: "Android (14+)",
      de: "Android (14+)",
      fr: "Android (14+)",
    },
    deviceFamily: "garmin",
    deviceFamilyLabel: {
      it: "Garmin Smartwatch e Sportwatch",
      en: "Garmin Smartwatch & Sportwatch",
      de: "Garmin Smartwatch & Sportwatch",
      fr: "Montres connectées et sportives Garmin",
    },
    status: "supported",
    statusLabel: {
      it: "Supportato",
      en: "Supported",
      de: "Unterstützt",
      fr: "Pris en charge",
    },
    direction: "read",
    directionLabel: {
      it: "Lettura via Health Connect",
      en: "Read via Health Connect",
      de: "Lesen über Health Connect",
      fr: "Lecture via Health Connect",
    },
    steps: {
      stepA: {
        it: "Hardware Garmin: misurazione comune di passi, frequenza cardiaca e sonno. Metriche dipendenti dal modello: HRV Status, dinamiche di corsa e SpO2. Metriche proprietarie non esportate: Body Battery e Training Load.",
        en: "Garmin hardware: common measurement of steps, heart rate, and sleep. Model-dependent metrics: HRV Status, running dynamics, and SpO2. Proprietary unexported metrics: Body Battery and Training Load.",
        de: "Garmin-Hardware: gemeinsame Erfassung von Schritten, Puls und Schlaf. Modellabhängige Metriken: HRV-Status, Laufdynamik und SpO2. Proprietäre, nicht exportierte Metriken: Body Battery und Training Load.",
        fr: "Matériel Garmin : mesure commune des pas, de la fréquence cardiaque et du sommeil. Métriques selon le modèle : Statut VFC, dynamiques de course et SpO2. Métriques propriétaires non exportées : Body Battery et charge d'entraînement.",
      },
      stepB: {
        it: "Garmin Connect memorizza lo storico completo e le analisi avanzate sui server cloud Garmin.",
        en: "Garmin Connect stores full history and advanced analytics on Garmin cloud servers.",
        de: "Garmin Connect speichert den vollständigen Verlauf und erweiterte Analysen auf Garmin-Cloud-Servern.",
        fr: "Garmin Connect enregistre l'historique complet et les analyses avancées sur les serveurs cloud Garmin.",
      },
      stepC: {
        it: "Garmin Connect esporta verso Health Connect (trasferimento locale unidirezionale su Android 14+): passi, frequenza cardiaca, sonno (durata/stadi se supportati dal modello), calorie attive e totali, distanza, sessioni di allenamento.",
        en: "Garmin Connect exports to Health Connect (local one-way sync on Android 14+): steps, heart rate, sleep (duration/stages if model supports), active & total calories, distance, workout sessions.",
        de: "Garmin Connect exportiert an Health Connect (lokale Einweg-Synchronisation ab Android 14): Schritte, Puls, Schlaf (Dauer/Phasen je nach Modell), Aktiv- und Gesamtkalorien, Distanz, Workouts.",
        fr: "Garmin Connect exporte vers Health Connect (synchronisation locale Android 14+) : pas, fréquence cardiaque, sommeil (durée/phases selon modèle), calories, distance, entraînements.",
      },
      stepD: {
        it: "FitMesh Android (release 3.10.0+191) legge da Health Connect i record supportati (STEPS, HEART_RATE, SLEEP, ACTIVE_ENERGY, WORKOUT) e li visualizza nella dashboard personale.",
        en: "FitMesh Android (release 3.10.0+191) reads supported records from Health Connect (STEPS, HEART_RATE, SLEEP, ACTIVE_ENERGY, WORKOUT) and displays them on your dashboard.",
        de: "FitMesh Android (Release 3.10.0+191) liest unterstützte Datensätze aus Health Connect (STEPS, HEART_RATE, SLEEP, ACTIVE_ENERGY, WORKOUT) aus und visualisiert sie im Dashboard.",
        fr: "FitMesh Android (version 3.10.0+191) lit les données prises en charge depuis Health Connect (STEPS, HEART_RATE, SLEEP, ACTIVE_ENERGY, WORKOUT) et les affiche sur votre tableau de bord.",
      },
    },
    metricsSummary: {
      it: "Passi, frequenza cardiaca, durata sonno, calorie attive, distanza, allenamenti",
      en: "Steps, heart rate, sleep duration, active calories, distance, workouts",
      de: "Schritte, Herzfrequenz, Schlafdauer, Aktivitätskalorien, Distanz, Workouts",
      fr: "Pas, fréquence cardiaque, durée du sommeil, calories actives, distance, entraînements",
    },
    requirements: {
      it: "Smartphone con Android 14 o superiore; app Garmin Connect installata con sincronizzazione Health Connect abilitata.",
      en: "Smartphone running Android 14 or higher; Garmin Connect app installed with Health Connect sync enabled.",
      de: "Smartphone mit Android 14 oder höher; installierte Garmin Connect App mit aktivierter Health Connect-Synchronisierung.",
      fr: "Smartphone sous Android 14 ou supérieur ; application Garmin Connect installée avec synchronisation Health Connect activée.",
    },
    limitations: {
      it: "Le metriche proprietarie Garmin (Body Battery, Training Load, tempo di recupero) e le mappe dei percorsi GPS non vengono trasmesse a Health Connect.",
      en: "Proprietary Garmin metrics (Body Battery, Training Load, Recovery Time) and GPS route maps are not transmitted to Health Connect.",
      de: "Proprietäre Garmin-Metriken (Body Battery, Training Load, Erholungszeit) und GPS-Karten werden nicht an Health Connect übermittelt.",
      fr: "Les métriques propriétaires Garmin (Body Battery, charge d'entraînement, temps de récupération) et les tracés GPS ne sont pas transmis à Health Connect.",
    },
    officialSource: {
      title: {
        it: "Garmin Support: Condivisione dati con Health Connect",
        en: "Garmin Support: Sharing Data With Health Connect",
        de: "Garmin Support: Daten mit Health Connect teilen",
        fr: "Support Garmin : Partage de données avec Health Connect",
      },
      url: "https://support.garmin.com/en-US/?faq=lzpSWu5diM4vgrmUXP4nn5",
      verifiedDate: "2026-09-14",
      supportedClaim: {
        it: "Garmin Connect esporta passi, frequenza cardiaca, sonno, calorie, distanza e sessioni sportive verso Health Connect.",
        en: "Garmin Connect exports steps, heart rate, sleep, calories, distance, and workout sessions to Health Connect.",
        de: "Garmin Connect exportiert Schritte, Herzfrequenz, Schlaf, Kalorien, Distanz und Trainingseinheiten an Health Connect.",
        fr: "Garmin Connect exporte pas, fréquence cardiaque, sommeil, calories, distance et séances vers Health Connect.",
      },
    },
    evidence: {
      level: "vendor_documented",
      label: EVIDENCE_LABELS.vendor_documented,
      details: {
        it: "Percorso documentato ufficialmente da Garmin e verificato nel codice Health Connect della release pubblica FitMesh 3.10.0+191.",
        en: "Route officially documented by Garmin and verified in the Health Connect reader code of public release FitMesh 3.10.0+191.",
        de: "Offiziell von Garmin dokumentierter Pfad, verifiziert im Health Connect-Code des FitMesh-Releases 3.10.0+191.",
        fr: "Parcours officiellement documenté par Garmin et vérifié dans le code Health Connect de la version publique FitMesh 3.10.0+191.",
      },
    },
  },

  // ── 2. Garmin su iPhone (iOS) ─────────────────────────────────────────
  {
    id: "garmin-ios",
    providerSlug: "garmin",
    phoneOs: "ios",
    phoneOsLabel: {
      it: "iPhone (iOS)",
      en: "iPhone (iOS)",
      de: "iPhone (iOS)",
      fr: "iPhone (iOS)",
    },
    deviceFamily: "garmin",
    deviceFamilyLabel: {
      it: "Garmin Smartwatch e Sportwatch",
      en: "Garmin Smartwatch & Sportwatch",
      de: "Garmin Smartwatch & Sportwatch",
      fr: "Montres connectées et sportives Garmin",
    },
    status: "conditional",
    statusLabel: {
      it: "Condizionale",
      en: "Conditional",
      de: "Bedingt unterstützt",
      fr: "Sous conditions",
    },
    direction: "read",
    directionLabel: {
      it: "Lettura via Apple Health",
      en: "Read via Apple Health",
      de: "Lesen über Apple Health",
      fr: "Lecture via Apple Santé",
    },
    steps: {
      stepA: {
        it: "Hardware Garmin: misurazione comune di passi, frequenza cardiaca e sonno. Metriche dipendenti dal modello: HRV Status, dinamiche di corsa e SpO2. Metriche proprietarie non esportate: Body Battery e Training Load.",
        en: "Garmin hardware: common measurement of steps, heart rate, and sleep. Model-dependent metrics: HRV Status, running dynamics, and SpO2. Proprietary unexported metrics: Body Battery and Training Load.",
        de: "Garmin-Hardware: gemeinsame Erfassung von Schritten, Puls und Schlaf. Modellabhängige Metriken: HRV-Status, Laufdynamik und SpO2. Proprietäre, nicht exportierte Metriken: Body Battery und Training Load.",
        fr: "Matériel Garmin : mesure commune des pas, de la fréquence cardiaque et du sommeil. Métriques selon le modèle : Statut VFC, dynamiques de course et SpO2. Métriques propriétaires non exportées : Body Battery et charge d'entraînement.",
      },
      stepB: {
        it: "L'app Garmin Connect per iOS sincronizza le metriche con il profilo cloud Garmin.",
        en: "The Garmin Connect iOS app syncs metrics with the Garmin cloud profile.",
        de: "Die Garmin Connect iOS-App synchronisiert Metriken mit dem Garmin-Cloudprofil.",
        fr: "L'application Garmin Connect iOS synchronise les métriques avec le profil cloud Garmin.",
      },
      stepC: {
        it: "Garmin Connect per iOS esporta verso Apple Health: passi, frequenza cardiaca, frequenza a riposo, sonno, calorie attive, distanza camminata/corsa, peso e sessioni di allenamento.",
        en: "Garmin Connect for iOS exports to Apple Health: steps, heart rate, resting heart rate, sleep analysis, active energy, walking/running distance, weight, and workouts.",
        de: "Garmin Connect für iOS exportiert an Apple Health: Schritte, Puls, Ruhepuls, Schlaf, Aktivitätsenergie, Geh-/Laufdistanz, Gewicht und Workouts.",
        fr: "Garmin Connect pour iOS exporte vers Apple Santé : pas, fréquence cardiaque, fréquence au repos, sommeil, énergie active, distance, poids et entraînements.",
      },
      stepD: {
        it: "FitMesh iOS (release 3.10.0+191) legge da HealthKit i record scritti da Garmin in Apple Health e li trasferisce alla dashboard personale.",
        en: "FitMesh iOS (release 3.10.0+191) reads records written by Garmin into Apple Health via HealthKit and transfers them to your dashboard.",
        de: "FitMesh iOS (Release 3.10.0+191) liest die von Garmin in Apple Health geschriebenen Datensätze über HealthKit aus und stellt sie im Dashboard dar.",
        fr: "FitMesh iOS (version 3.10.0+191) lit via HealthKit les enregistrements écrits par Garmin dans Apple Santé et les transmet au tableau de bord.",
      },
    },
    metricsSummary: {
      it: "Passi, frequenza cardiaca, frequenza a riposo, sonno, calorie attive, distanza, allenamenti",
      en: "Steps, heart rate, resting heart rate, sleep, active energy, distance, workouts",
      de: "Schritte, Herzfrequenz, Ruhepuls, Schlaf, Aktivitätskalorien, Distanz, Workouts",
      fr: "Pas, fréquence cardiaque, fréquence au repos, sommeil, calories actives, distance, entraînements",
    },
    requirements: {
      it: "Garmin Connect per iOS installata; permessi di scrittura concessi ad Apple Health; Garmin Connect deve essere aperta in primo piano per completare il trasferimento.",
      en: "Garmin Connect iOS installed; write permissions granted to Apple Health; Garmin Connect must be opened in foreground to complete data transfer.",
      de: "Garmin Connect für iOS installiert; Schreibrechte für Apple Health erteilt; Garmin Connect muss im Vordergrund geöffnet werden, um die Übertragung abzuschließen.",
      fr: "Application Garmin Connect iOS installée ; autorisations d'écriture accordées à Apple Santé ; Garmin Connect doit être ouverte au premier plan pour transférer les données.",
    },
    limitations: {
      it: "Garmin Connect deve essere aperta in primo piano per sincronizzare con Apple Health. Lo storico iniziale arriva fino a circa 2 settimane. Le tracce GPS dei percorsi non vengono esportate in Apple Health.",
      en: "Garmin Connect must be opened in foreground to sync with Apple Health. Initial historical backfill reaches up to ~2 weeks. GPS route maps are not exported to Apple Health.",
      de: "Garmin Connect muss im Vordergrund geöffnet sein, um mit Apple Health zu synchronisieren. Die historische Nachverfolgung reicht initial bis zu 2 Wochen zurück. GPS-Karten werden nicht exportiert.",
      fr: "Garmin Connect doit être ouverte au premier plan pour synchroniser avec Apple Santé. L'historique initial remonte jusqu'à 2 semaines environ. Les parcours GPS ne sont pas exportés vers Apple Santé.",
    },
    officialSource: {
      title: {
        it: "Garmin Support: Condivisione dati con Apple Health",
        en: "Garmin Support: Apple Health Integration",
        de: "Garmin Support: Apple Health Integration",
        fr: "Support Garmin : Intégration Apple Santé",
      },
      url: "https://support.garmin.com/en-US/?faq=lK5FlFiJvr60uzUSPoh8H6",
      verifiedDate: "2026-09-14",
      supportedClaim: {
        it: "Garmin Connect per iOS scrive passi, distanza, calorie, frequenza cardiaca, frequenza a riposo, sonno e allenamenti in Apple Health quando aperta in primo piano.",
        en: "Garmin Connect for iOS writes steps, distance, calories, heart rate, resting heart rate, sleep, and workouts to Apple Health when opened in foreground.",
        de: "Garmin Connect für iOS schreibt Schritte, Distanz, Kalorien, Puls, Ruhepuls, Schlaf und Workouts in Apple Health, wenn die App im Vordergrund geöffnet wird.",
        fr: "Garmin Connect pour iOS écrit les pas, la distance, les calories, le rythme cardiaque, le repos, le sommeil et les entraînements dans Apple Santé en premier plan.",
      },
    },
    evidence: {
      level: "vendor_documented",
      label: EVIDENCE_LABELS.vendor_documented,
      details: {
        it: "Percorso documentato ufficialmente da Garmin; supportato dal framework HealthKit nella release pubblica FitMesh 3.10.0+191 sotto le condizioni operative di iOS.",
        en: "Route officially documented by Garmin; supported by the HealthKit framework in public release FitMesh 3.10.0+191 under iOS operational conditions.",
        de: "Offiziell von Garmin dokumentierter Pfad; unterstützt durch das HealthKit-Framework im FitMesh-Release 3.10.0+191 unter iOS-Bedingungen.",
        fr: "Parcours officiellement documenté par Garmin ; pris en charge par le framework HealthKit dans la version FitMesh 3.10.0+191 selon les conditions iOS.",
      },
    },
    guideSlug: "garmin-samsung-health-sync-guide",
  },

  // ── 3. Fitbit su Android ──────────────────────────────────────────────
  {
    id: "fitbit-android",
    providerSlug: "fitbit",
    phoneOs: "android",
    phoneOsLabel: {
      it: "Android",
      en: "Android",
      de: "Android",
      fr: "Android",
    },
    deviceFamily: "fitbit",
    deviceFamilyLabel: {
      it: "Fitbit Tracker e Smartwatch",
      en: "Fitbit Tracker & Smartwatch",
      de: "Fitbit Tracker & Smartwatch",
      fr: "Bracelets et montres Fitbit",
    },
    status: "supported",
    statusLabel: {
      it: "Supportato",
      en: "Supported",
      de: "Unterstützt",
      fr: "Pris en charge",
    },
    direction: "read",
    directionLabel: {
      it: "Lettura via Health Connect",
      en: "Read via Health Connect",
      de: "Lesen über Health Connect",
      fr: "Lecture via Health Connect",
    },
    steps: {
      stepA: {
        it: "Hardware Fitbit: rilevamento comune di passi, battito cardiaco e sonno. Funzioni dipendenti dal modello: sensore cEDA (stress), ECG, sensore di temperatura cutanea (Sense/Versa) e GPS integrato.",
        en: "Fitbit hardware: common measurement of steps, heart rate, and sleep. Model-dependent features: cEDA stress sensor, ECG, skin temperature sensor (Sense/Versa), and built-in GPS.",
        de: "Fitbit-Hardware: gemeinsame Messung von Schritten, Puls und Schlaf. Modellabhängige Funktionen: cEDA-Stress-Sensor, EKG, Hauttemperatursensor (Sense/Versa) und integriertes GPS.",
        fr: "Matériel Fitbit : mesure commune des pas, de la fréquence cardiaque et du sommeil. Fonctions selon le modèle : capteur cEDA (stress), ECG, température cutanée (Sense/Versa) et GPS intégré.",
      },
      stepB: {
        it: "L'app Google Health sullo smartphone Android elabora e visualizza le metriche sull'account Google associato al dispositivo Fitbit.",
        en: "The Google Health app on Android processes and displays metrics linked to the Google account associated with the Fitbit device.",
        de: "Die Google Health App auf Android verarbeitet und visualisiert die Werte im verknüpften Google-Konto des Fitbit-Geräts.",
        fr: "L'application Google Health sur Android traite et affiche les métriques sur le compte Google associé à l'appareil Fitbit.",
      },
      stepC: {
        it: "Google Health trasferisce a Health Connect i passi, la frequenza cardiaca, la durata del sonno, le calorie e le sessioni di allenamento.",
        en: "Google Health transfers steps, heart rate, sleep duration, calories, and workout sessions to Health Connect.",
        de: "Google Health überträgt Schritte, Herzfrequenz, Schlafdauer, Kalorien und Trainingseinheiten an Health Connect.",
        fr: "Google Health transfère à Health Connect les pas, le rythme cardiaque, la durée du sommeil, les calories et les entraînements.",
      },
      stepD: {
        it: "FitMesh Android (release 3.10.0+191) legge i dati standard da Health Connect e aggiorna la dashboard personale senza richiedere abbonamenti premium.",
        en: "FitMesh Android (release 3.10.0+191) reads standard data from Health Connect and updates your personal dashboard without requiring premium subscriptions.",
        de: "FitMesh Android (Release 3.10.0+191) liest Standarddaten aus Health Connect aus und aktualisiert das Dashboard ohne Pflicht zu Premium-Abos.",
        fr: "FitMesh Android (version 3.10.0+191) lit les données standard depuis Health Connect et met à jour le tableau de bord sans abonnement premium.",
      },
    },
    metricsSummary: {
      it: "Passi, frequenza cardiaca, durata del sonno, calorie, distanza, allenamenti",
      en: "Steps, heart rate, sleep duration, calories, distance, workouts",
      de: "Schritte, Herzfrequenz, Schlafdauer, Kalorien, Distanz, Workouts",
      fr: "Pas, fréquence cardiaque, durée du sommeil, calories, distance, entraînements",
    },
    requirements: {
      it: "Smartphone Android; app Google Health installata con account Google attivo; sincronizzazione Health Connect abilitata.",
      en: "Android smartphone; Google Health app installed with active Google account; Health Connect synchronization enabled.",
      de: "Android-Smartphone; installierte Google Health App mit aktivem Google-Konto; aktivierte Health Connect-Synchronisierung.",
      fr: "Smartphone Android ; application Google Health installée avec compte Google actif ; synchronisation Health Connect activée.",
    },
    limitations: {
      it: "L'app Google Health e l'account Google restano obbligatori sullo smartphone. L'esportazione delle fasi del sonno dettagliate (REM/profondo) dipende dalla configurazione concessa dall'app.",
      en: "The Google Health app and Google account remain required on the smartphone. Export of detailed sleep stages (REM/deep) depends on permissions granted in the app.",
      de: "Die Google Health App und das Google-Konto bleiben auf dem Smartphone erforderlich. Der Export detaillierter Schlafphasen hängt von den App-Einstellungen ab.",
      fr: "L'application Google Health et le compte Google restent requis sur le smartphone. L'export des phases détaillées de sommeil dépend des autorisations de l'application.",
    },
    officialSource: {
      title: {
        it: "Google Support: Come usare Health Connect con Fitbit",
        en: "Google Support: How do I use Health Connect with Fitbit?",
        de: "Google Support: So verwenden Sie Health Connect mit Fitbit",
        fr: "Support Google : Comment utiliser Health Connect avec Fitbit ?",
      },
      url: "https://support.google.com/fitbit/answer/13045614",
      verifiedDate: "2026-09-14",
      supportedClaim: {
        it: "L'app scrive passi, distanza, sonno, minuti in zona attiva, esercizi e calorie in Health Connect su Android.",
        en: "App writes steps, distance, sleep, active zone minutes, exercise, and calories to Health Connect on Android.",
        de: "App schreibt Schritte, Distanz, Schlaf, Aktivzonenminuten, Training und Kalorien in Health Connect auf Android.",
        fr: "L'application écrit pas, distance, sommeil, minutes en zone active, exercices et calories dans Health Connect sur Android.",
      },
    },
    evidence: {
      level: "vendor_documented",
      label: EVIDENCE_LABELS.vendor_documented,
      details: {
        it: "Percorso documentato ufficialmente da Google e verificato nel codice di lettura Health Connect della release FitMesh 3.10.0+191.",
        en: "Route officially documented by Google and verified in the Health Connect reader code of FitMesh release 3.10.0+191.",
        de: "Offiziell von Google dokumentierter Pfad, verifiziert im Health Connect-Code des FitMesh-Releases 3.10.0+191.",
        fr: "Parcours officiellement documenté par Google et vérifié dans le code Health Connect de FitMesh 3.10.0+191.",
      },
    },
  },

  // ── 4. Fitbit su iPhone (iOS) ─────────────────────────────────────────
  {
    id: "fitbit-ios",
    providerSlug: "fitbit",
    phoneOs: "ios",
    phoneOsLabel: {
      it: "iPhone (iOS)",
      en: "iPhone (iOS)",
      de: "iPhone (iOS)",
      fr: "iPhone (iOS)",
    },
    deviceFamily: "fitbit",
    deviceFamilyLabel: {
      it: "Fitbit Tracker e Smartwatch",
      en: "Fitbit Tracker & Smartwatch",
      de: "Fitbit Tracker & Smartwatch",
      fr: "Bracelets et montres Fitbit",
    },
    status: "conditional",
    statusLabel: {
      it: "Condizionale",
      en: "Conditional",
      de: "Bedingt unterstützt",
      fr: "Sous conditions",
    },
    direction: "read",
    directionLabel: {
      it: "Lettura via Apple Health",
      en: "Read via Apple Health",
      de: "Lesen über Apple Health",
      fr: "Lecture via Apple Santé",
    },
    steps: {
      stepA: {
        it: "Hardware Fitbit: rilevamento di passi, frequenza cardiaca e sonno. Funzioni dipendenti dal modello: sensore cEDA, ECG e temperatura.",
        en: "Fitbit hardware: measurement of steps, heart rate, and sleep. Model-dependent features: cEDA sensor, ECG, and temperature.",
        de: "Fitbit-Hardware: Messung von Schritten, Puls und Schlaf. Modellabhängige Funktionen: cEDA-Sensor, EKG und Temperatur.",
        fr: "Matériel Fitbit : mesure des pas, du pouls et du sommeil. Fonctions selon le modèle : capteur cEDA, ECG et température.",
      },
      stepB: {
        it: "L'app Google Health per iOS memorizza e mostra le metriche sul profilo utente Google associato.",
        en: "The Google Health iOS app stores and displays metrics on the linked Google profile.",
        de: "Die Google Health iOS-App speichert und zeigt Messwerte im verknüpften Google-Konto an.",
        fr: "L'application Google Health pour iOS enregistre et affiche les métriques sur le profil Google associé.",
      },
      stepC: {
        it: "Quando Google Health rende disponibile in Apple Health un tipo di dato proveniente dal dispositivo Fitbit e l'utente concede i relativi permessi, FitMesh può leggere i tipi HealthKit supportati dalla release. L'esportazione dipende dai permessi concessi dall'utente in Google Health e dalla compatibilità del singolo modello Fitbit.",
        en: "When Google Health makes a data type from a Fitbit device available in Apple Health and the user grants the necessary permissions, FitMesh can read the HealthKit types supported by the release. Export depends on permissions granted in Google Health and specific Fitbit model compatibility.",
        de: "Wenn Google Health einen Datentyp vom Fitbit-Gerät in Apple Health bereitstellt und der Nutzer die entsprechenden Berechtigungen erteilt, kann FitMesh die von der Version unterstützten HealthKit-Typen auslesen. Der Export hängt von den in Google Health erteilten Berechtigungen und dem jeweiligen Modell ab.",
        fr: "Lorsque Google Health met à disposition dans Apple Santé un type de données provenant de l'appareil Fitbit et que l'utilisateur accorde les autorisations correspondantes, FitMesh peut lire les types HealthKit pris en charge par la version. L'exportation dépend des autorisations accordées dans Google Health et de la compatibilité du modèle.",
      },
      stepD: {
        it: "FitMesh iOS (release 3.10.0+191) legge i dati fitness da Apple Health (HealthKit) tramite le autorizzazioni di sistema e li sincronizza con la dashboard personale.",
        en: "FitMesh iOS (release 3.10.0+191) reads fitness data from Apple Health (HealthKit) through system permissions and syncs them to your personal dashboard.",
        de: "FitMesh iOS (Release 3.10.0+191) liest Fitnessdaten über Systemberechtigungen aus Apple Health (HealthKit) aus und synchronisiert sie mit dem Dashboard.",
        fr: "FitMesh iOS (version 3.10.0+191) lit les données de santé depuis Apple Santé (HealthKit) via les autorisations système et les synchronise avec le tableau de bord.",
      },
    },
    metricsSummary: {
      it: "Passi, distanza, sessioni di esercizio, sonno, frequenza cardiaca (se abilitati in Google Health)",
      en: "Steps, distance, workout sessions, sleep, heart rate (if enabled in Google Health)",
      de: "Schritte, Distanz, Trainingseinheiten, Schlaf, Herzfrequenz (sofern in Google Health aktiviert)",
      fr: "Pas, distance, séances d'exercice, sommeil, fréquence cardiaque (si activés dans Google Health)",
    },
    requirements: {
      it: "iPhone; app Google Health per iOS installata con account Google; permessi di scrittura concessi ad Apple Salute.",
      en: "iPhone; Google Health iOS app installed with Google account; write permissions granted to Apple Health.",
      de: "iPhone; installierte Google Health iOS-App mit Google-Konto; in Apple Health erteilte Schreibberechtigung.",
      fr: "iPhone ; application Google Health iOS installée avec compte Google ; autorisations d'écriture accordées dans Apple Santé.",
    },
    limitations: {
      it: "Non si tratta di una connessione cloud diretta. L'aggiornamento dipende dalla sincronizzazione dell'app Google Health con Apple Health e dalle categorie supportate dal modello specifico.",
      en: "This is not a direct cloud connection. Updates depend on the Google Health app syncing with Apple Health and categories supported by your specific model.",
      de: "Keine direkte Cloud-Verbindung. Aktualisierungen hängen von der Synchronisierung der Google Health App mit Apple Health und dem jeweiligen Modell ab.",
      fr: "Il ne s'agit pas d'une connexion cloud directe. La mise à jour dépend de la synchronisation entre Google Health et Apple Santé ainsi que du modèle.",
    },
    officialSource: {
      title: {
        it: "Google Support: Condividere i dati con Apple Health",
        en: "Google Support: Share Fitbit data with Apple Health",
        de: "Google Support: Fitbit-Daten mit Apple Health teilen",
        fr: "Support Google : Partager les données Fitbit avec Apple Santé",
      },
      url: "https://support.google.com/fitbit/answer/14144935",
      verifiedDate: "2026-09-14",
      supportedClaim: {
        it: "Google Health per iOS supporta la scrittura in Apple Health di passi, distanza, sonno, sessioni di esercizio e frequenza cardiaca.",
        en: "Google Health for iOS supports writing steps, distance, sleep, exercise sessions, and heart rate to Apple Health.",
        de: "Google Health für iOS unterstützt das Schreiben von Schritten, Distanz, Schlaf, Trainingseinheiten und Herzfrequenz in Apple Health.",
        fr: "Google Health pour iOS permet l'écriture des pas, de la distance, du sommeil, des exercices et du rythme cardiaque dans Apple Santé.",
      },
    },
    evidence: {
      level: "vendor_documented",
      label: EVIDENCE_LABELS.vendor_documented,
      details: {
        it: "Percorso documentato da Google Health e supportato dal codice HealthKit della release pubblica FitMesh 3.10.0+191, condizionato alla concessione dei permessi.",
        en: "Route documented by Google Health and supported by the HealthKit reader code of public release FitMesh 3.10.0+191, conditional on user permissions.",
        de: "Von Google Health dokumentierter Pfad, unterstützt durch den HealthKit-Code des FitMesh-Releases 3.10.0+191, abhängig von den Nutzerberechtigungen.",
        fr: "Parcours documenté par Google Health et pris en charge par le code HealthKit de FitMesh 3.10.0+191, conditionné aux autorisations utilisateur.",
      },
    },
  },

  // ── 5. Galaxy Watch su Android ─────────────────────────────────────────
  {
    id: "galaxy-watch-android",
    providerSlug: "galaxy-watch",
    phoneOs: "android",
    phoneOsLabel: {
      it: "Android",
      en: "Android",
      de: "Android",
      fr: "Android",
    },
    deviceFamily: "galaxy-watch",
    deviceFamilyLabel: {
      it: "Samsung Galaxy Watch (Wear OS)",
      en: "Samsung Galaxy Watch (Wear OS)",
      de: "Samsung Galaxy Watch (Wear OS)",
      fr: "Samsung Galaxy Watch (Wear OS)",
    },
    status: "supported",
    statusLabel: {
      it: "Supportato",
      en: "Supported",
      de: "Unterstützt",
      fr: "Pris en charge",
    },
    direction: "read",
    directionLabel: {
      it: "Health Connect (standard) + SDK (su Galaxy compatibili)",
      en: "Health Connect (standard) + SDK (on compatible Galaxy)",
      de: "Health Connect (Standard) + SDK (auf kompatiblen Galaxy)",
      fr: "Health Connect (standard) + SDK (sur Galaxy compatibles)",
    },
    steps: {
      stepA: {
        it: "Hardware Galaxy Watch (BioActive Sensor): misurazione comune di passi, frequenza cardiaca continua, calorie e sonno. Funzioni dipendenti dal modello e dall'ecosistema (es. Galaxy Watch4 o superiore abbinato a smartphone Samsung): analisi composizione corporea (BIA), pressione arteriosa ed ECG.",
        en: "Galaxy Watch hardware (BioActive Sensor): common measurement of steps, continuous heart rate, calories, and sleep. Model and ecosystem dependent features (e.g. Galaxy Watch4 or newer paired with Samsung smartphone): BIA body composition, blood pressure, and ECG.",
        de: "Galaxy Watch Hardware (BioActive-Sensor): gemeinsame Erfassung von Schritten, kontinuierlichem Puls, Kalorien und Schlaf. Modell- und ökosystemabhängige Funktionen (z.B. Galaxy Watch4+ mit Samsung-Smartphone): BIA-Körperanalyse, Blutdruck und EKG.",
        fr: "Matériel Galaxy Watch (capteur BioActive) : mesure commune des pas, de la fréquence cardiaque continue, des calories et du sommeil. Fonctions selon modèle et écosystème (ex. Galaxy Watch4+ jumelée à un smartphone Samsung) : composition corporelle BIA, pression artérielle et ECG.",
      },
      stepB: {
        it: "L'app Samsung Health sullo smartphone Android aggrega le metriche giornaliere e storiche.",
        en: "The Samsung Health app on the Android smartphone aggregates daily and historical metrics.",
        de: "Die Samsung Health App auf dem Android-Smartphone aggregiert tägliche und historische Messwerte.",
        fr: "L'application Samsung Health sur le smartphone Android regroupe les données quotidiennes et historiques.",
      },
      stepC: {
        it: "Samsung Health rende disponibili i dati attraverso due canali distinti: (1) esportazione standard locale verso Health Connect; (2) interfaccia diretta tramite Samsung Health Data SDK su smartphone Samsung autorizzati.",
        en: "Samsung Health makes data available through two distinct channels: (1) standard local export to Health Connect; (2) direct interface via Samsung Health Data SDK on authorized Samsung smartphones.",
        de: "Samsung Health stellt Daten über zwei getrennte Kanäle bereit: (1) Standard-Export an Health Connect; (2) direkte Schnittstelle über das Samsung Health Data SDK auf autorisierten Samsung-Smartphones.",
        fr: "Samsung Health met à disposition les données via deux canaux distincts : (1) exportation standard vers Health Connect ; (2) interface directe via Samsung Health Data SDK sur smartphones Samsung autorisés.",
      },
      stepD: {
        it: "FitMesh Android (release 3.10.0+191) interroga primariamente Health Connect. Se eseguito su smartphone Samsung compatibile con permessi concessi, legge anche tramite il connettore nativo SamsungHealthSource per colmare eventuali metriche mancanti.",
        en: "FitMesh Android (release 3.10.0+191) primarily queries Health Connect. If running on a compatible Samsung smartphone with granted permissions, it also reads via the native SamsungHealthSource connector to fill any gaps.",
        de: "FitMesh Android (Release 3.10.0+191) liest primär Health Connect aus. Auf kompatiblen Samsung-Smartphones mit erteilten Rechten wird zusätzlich der native SamsungHealthSource-Kanal zur Lückenfüllung genutzt.",
        fr: "FitMesh Android (version 3.10.0+191) interroge d'abord Health Connect. Sur smartphone Samsung compatible avec autorisations accordées, il lit également via SamsungHealthSource pour combler d'éventuels manques.",
      },
    },
    metricsSummary: {
      it: "Passi, frequenza cardiaca continua, sonno con stadi, calorie attive, distanza, allenamenti",
      en: "Steps, continuous heart rate, sleep with stages, active calories, distance, workouts",
      de: "Schritte, kontinuierlicher Puls, Schlaf mit Phasen, Aktivitätskalorien, Distanz, Workouts",
      fr: "Pas, fréquence cardiaque continue, sommeil avec phases, calories actives, distance, entraînements",
    },
    requirements: {
      it: "Smartphone Android con app Samsung Health installata; sincronizzazione Health Connect abilitata in Samsung Health.",
      en: "Android smartphone with Samsung Health app installed; Health Connect sync enabled in Samsung Health.",
      de: "Android-Smartphone mit installierter Samsung Health App; in Samsung Health aktivierte Health Connect-Synchronisierung.",
      fr: "Smartphone Android avec application Samsung Health installée ; synchronisation Health Connect activée dans Samsung Health.",
    },
    limitations: {
      it: "Disponibile solo su Android. Le metriche cliniche proprietarie (composizione corporea BIA, pressione ed ECG) rimangono confinate all'interno di Samsung Health.",
      en: "Available on Android only. Proprietary clinical metrics (BIA body composition, blood pressure, ECG) remain confined within Samsung Health.",
      de: "Nur auf Android verfügbar. Proprietäre klinische Werte (BIA-Körperanalyse, Blutdruck, EKG) verbleiben innerhalb von Samsung Health.",
      fr: "Disponible uniquement sur Android. Les métriques cliniques propriétaires (composition corporelle BIA, pression, ECG) restent dans Samsung Health.",
    },
    subpaths: [
      {
        id: "samsung-health-connect",
        title: {
          it: "Percorso Standard: Health Connect",
          en: "Standard Route: Health Connect",
          de: "Standard-Pfad: Health Connect",
          fr: "Parcours standard : Health Connect",
        },
        route: {
          it: "Galaxy Watch → Samsung Health → Health Connect → FitMesh",
          en: "Galaxy Watch → Samsung Health → Health Connect → FitMesh",
          de: "Galaxy Watch → Samsung Health → Health Connect → FitMesh",
          fr: "Galaxy Watch → Samsung Health → Health Connect → FitMesh",
        },
        requirements: {
          it: "Qualsiasi smartphone Android (Samsung o non-Samsung con Galaxy Wearable); Android 14+ con Health Connect; sincronizzazione attiva in Samsung Health.",
          en: "Any Android smartphone (Samsung or non-Samsung paired via Galaxy Wearable); Android 14+ with Health Connect; sync enabled in Samsung Health.",
          de: "Jedes Android-Smartphone (Samsung oder Nicht-Samsung mit Galaxy Wearable); Android 14+ mit Health Connect; aktivierte Synchronisierung in Samsung Health.",
          fr: "Tout smartphone Android (Samsung ou autre marque avec Galaxy Wearable) ; Android 14+ avec Health Connect ; synchronisation activée dans Samsung Health.",
        },
        metricsRead: {
          it: "Passi, frequenza cardiaca, sonno con stadi, calorie attive, distanza, sessioni di allenamento.",
          en: "Steps, heart rate, sleep with stages, active calories, distance, workout sessions.",
          de: "Schritte, Herzfrequenz, Schlaf mit Phasen, Aktivitätskalorien, Distanz, Trainingseinheiten.",
          fr: "Pas, fréquence cardiaque, sommeil avec phases, calories actives, distance, séances d'entraînement.",
        },
        fallback: {
          it: "Percorso universale di riferimento; nessun fallback richiesto.",
          en: "Universal baseline route; no fallback required.",
          de: "Universeller Referenzpfad; kein Fallback erforderlich.",
          fr: "Parcours universel de référence ; aucun repli nécessaire.",
        },
        verificationStatus: {
          it: "Documentato ufficialmente da Samsung e Google; verificato nel codice Health Connect di FitMesh 3.10.0+191.",
          en: "Officially documented by Samsung and Google; verified in FitMesh 3.10.0+191 Health Connect code.",
          de: "Offiziell von Samsung und Google dokumentiert; im FitMesh 3.10.0+191 Health Connect-Code verifiziert.",
          fr: "Officiellement documenté par Samsung et Google ; vérifié dans le code Health Connect de FitMesh 3.10.0+191.",
        },
        availability: {
          it: "Disponibile su tutti gli smartphone Android compatibili.",
          en: "Available on all compatible Android smartphones.",
          de: "Verfügbar auf allen kompatiblen Android-Smartphones.",
          fr: "Disponible sur tous les smartphones Android compatibles.",
        },
      },
      {
        id: "samsung-health-sdk",
        title: {
          it: "Percorso Aggiuntivo: Samsung Health Data SDK",
          en: "Additional Route: Samsung Health Data SDK",
          de: "Zusätzlicher Pfad: Samsung Health Data SDK",
          fr: "Parcours additionnel : Samsung Health Data SDK",
        },
        route: {
          it: "Samsung Health → Samsung Health Data SDK → FitMesh",
          en: "Samsung Health → Samsung Health Data SDK → FitMesh",
          de: "Samsung Health → Samsung Health Data SDK → FitMesh",
          fr: "Samsung Health → Samsung Health Data SDK → FitMesh",
        },
        requirements: {
          it: "Smartphone Samsung Galaxy (Android 10+ / API 29+); app Samsung Health installata; autorizzazione esplicita dell'utente tramite dialog nativo Samsung.",
          en: "Samsung Galaxy smartphone (Android 10+ / API 29+); Samsung Health installed; explicit user permission granted via native Samsung dialog.",
          de: "Samsung Galaxy Smartphone (Android 10+ / API 29+); installierte Samsung Health App; ausdrückliche Nutzererlaubnis über nativen Samsung-Dialog.",
          fr: "Smartphone Samsung Galaxy (Android 10+ / API 29+) ; application Samsung Health installée ; autorisation explicite accordée via le dialogue natif Samsung.",
        },
        metricsRead: {
          it: "Passi giornalieri, frequenza cardiaca a riposo, calorie attive e gap-fill per metriche intraday secondo disponibilità del canale nativo nella release 3.10.0+191.",
          en: "Daily steps, resting heart rate, active calories, and gap-fill for intraday metrics as available through the native channel in release 3.10.0+191.",
          de: "Tägliche Schritte, Ruhepuls, Aktivitätskalorien und Gap-Fill für Intraday-Werte gemäß Verfügbarkeit des nativen Kanals im Release 3.10.0+191.",
          fr: "Pas quotidiens, fréquence cardiaque au repos, calories actives et comblement des données selon la disponibilité du canal natif dans la version 3.10.0+191.",
        },
        fallback: {
          it: "In caso di smartphone non-Galaxy, permessi non concessi o errore del canale IPC, FitMesh ricade automaticamente e silenziosamente sul percorso standard Health Connect.",
          en: "If running on non-Galaxy devices, if permissions are denied, or on IPC channel errors, FitMesh automatically and silently falls back to standard Health Connect.",
          de: "Bei Nicht-Galaxy-Geräten, verweigerten Rechten oder IPC-Kanalfehlern fällt FitMesh automatisch und geräuschlos auf den Standard-Health-Connect-Pfad zurück.",
          fr: "Sur appareil non-Galaxy, refus d'autorisation ou erreur IPC, FitMesh bascule automatiquement et de manière transparente sur le parcours standard Health Connect.",
        },
        verificationStatus: {
          it: "Implementato tramite SamsungHealthSource (SDK 1.1.0) nel codice della release FitMesh 3.10.0+191 con fail-closed e gestione eccezioni dedicate.",
          en: "Implemented via SamsungHealthSource (SDK 1.1.0) in FitMesh 3.10.0+191 release code with fail-closed and dedicated exception handling.",
          de: "Implementiert über SamsungHealthSource (SDK 1.1.0) im FitMesh 3.10.0+191 Release-Code mit Fail-Closed-Verhalten.",
          fr: "Implémenté via SamsungHealthSource (SDK 1.1.0) dans le code de version FitMesh 3.10.0+191 avec gestion sécurisée des exceptions.",
        },
        availability: {
          it: "Limitato a smartphone Samsung Galaxy con Samsung Health.",
          en: "Limited to Samsung Galaxy smartphones with Samsung Health.",
          de: "Auf Samsung Galaxy-Smartphones mit Samsung Health beschränkt.",
          fr: "Limité aux smartphones Samsung Galaxy équipés de Samsung Health.",
        },
      },
    ],
    officialSource: {
      title: {
        it: "Samsung Support: Come sincronizzare Samsung Health con Health Connect",
        en: "Samsung Support: How to sync Samsung Health with Health Connect",
        de: "Samsung Support: Samsung Health mit Health Connect synchronisieren",
        fr: "Support Samsung : Comment synchroniser Samsung Health avec Health Connect",
      },
      url: "https://www.samsung.com/us/support/answer/ANS00091380/",
      verifiedDate: "2026-09-14",
      supportedClaim: {
        it: "Samsung Health scrive passi, sonno, frequenza cardiaca, allenamenti e calorie in Health Connect su dispositivi Android.",
        en: "Samsung Health writes steps, sleep, heart rate, workouts, and calories to Health Connect on Android devices.",
        de: "Samsung Health schreibt Schritte, Schlaf, Puls, Training und Kalorien in Health Connect auf Android-Geräten.",
        fr: "Samsung Health écrit pas, sommeil, rythme cardiaque, entraînements et calories dans Health Connect sur Android.",
      },
    },
    evidence: {
      level: "vendor_documented",
      label: EVIDENCE_LABELS.vendor_documented,
      details: {
        it: "Percorso standard Health Connect documentato ufficialmente da Samsung; percorso aggiuntivo implementato nel canale SamsungHealthSource della release FitMesh 3.10.0+191.",
        en: "Standard Health Connect path officially documented by Samsung; additional path implemented in SamsungHealthSource channel of FitMesh release 3.10.0+191.",
        de: "Standard-Pfad von Samsung offiziell dokumentiert; zusätzlicher Pfad im SamsungHealthSource-Kanal des FitMesh-Releases 3.10.0+191 implementiert.",
        fr: "Parcours standard documenté par Samsung ; parcours additionnel implémenté dans le module SamsungHealthSource de FitMesh 3.10.0+191.",
      },
    },
  },

  // ── 6. Pixel Watch su Android ─────────────────────────────────────────
  {
    id: "pixel-watch-android",
    providerSlug: "pixel-watch",
    phoneOs: "android",
    phoneOsLabel: {
      it: "Android",
      en: "Android",
      de: "Android",
      fr: "Android",
    },
    deviceFamily: "pixel-watch",
    deviceFamilyLabel: {
      it: "Google Pixel Watch",
      en: "Google Pixel Watch",
      de: "Google Pixel Watch",
      fr: "Google Pixel Watch",
    },
    status: "supported",
    statusLabel: {
      it: "Supportato",
      en: "Supported",
      de: "Unterstützt",
      fr: "Pris en charge",
    },
    direction: "read",
    directionLabel: {
      it: "Lettura via Health Connect",
      en: "Read via Health Connect",
      de: "Lesen über Health Connect",
      fr: "Lecture via Health Connect",
    },
    steps: {
      stepA: {
        it: "Hardware Pixel Watch: misurazione continua di passi, frequenza cardiaca, calorie e sonno con stadi tramite sensori integrati. Metriche dipendenti dalla generazione: sensore temperatura cutanea e cEDA su Pixel Watch 2 e 3.",
        en: "Pixel Watch hardware: continuous measurement of steps, heart rate, calories, and sleep with stages via built-in sensors. Generation-dependent metrics: skin temperature sensor and cEDA on Pixel Watch 2 & 3.",
        de: "Pixel Watch Hardware: kontinuierliche Erfassung von Schritten, Puls, Kalorien und Schlaf mit Phasen. Generationsabhängige Metriken: Hauttemperatursensor und cEDA bei Pixel Watch 2 und 3.",
        fr: "Matériel Pixel Watch : mesure continue des pas, de la fréquence cardiaque, des calories et du sommeil avec phases. Selon la génération : capteur de température cutanée et cEDA sur Pixel Watch 2 et 3.",
      },
      stepB: {
        it: "L'app Google Pixel Watch gestisce la connessione hardware con l'orologio, mentre Google Health raccoglie ed elabora le metriche sanitarie sull'account utente.",
        en: "The Google Pixel Watch app manages hardware connection with the watch, while Google Health collects and analyzes health metrics on the user account.",
        de: "Die Google Pixel Watch App verwaltet die Hardware-Verbindung zur Uhr, während Google Health die Gesundheitsdaten im Nutzerkonto verarbeitet.",
        fr: "L'application Google Pixel Watch gère la connexion matérielle, tandis que Google Health traite les métriques de santé sur le compte utilisateur.",
      },
      stepC: {
        it: "I dati biometrici rilevati da Pixel Watch vengono sincronizzati tramite Google Health verso Health Connect (passi, frequenza cardiaca, calorie, sonno con stadi e sessioni di allenamento).",
        en: "Biometric data measured by Pixel Watch is synced through Google Health into Health Connect (steps, heart rate, calories, sleep with stages, and workouts).",
        de: "Die von der Pixel Watch erfassten biometrischen Daten werden über Google Health an Health Connect übertragen (Schritte, Puls, Kalorien, Schlafphasen und Workouts).",
        fr: "Les données biométriques de la Pixel Watch sont synchronisées via Google Health vers Health Connect (pas, fréquence cardiaque, calories, phases de sommeil et entraînements).",
      },
      stepD: {
        it: "FitMesh Android (release 3.10.0+191) interroga Health Connect e rende disponibili i dati senza vincolo di abbonamento premium.",
        en: "FitMesh Android (release 3.10.0+191) queries Health Connect and presents data without requiring a premium subscription.",
        de: "FitMesh Android (Release 3.10.0+191) ruft Daten aus Health Connect ab und stellt sie ohne Pflicht zu Premium-Abos bereit.",
        fr: "FitMesh Android (version 3.10.0+191) lit Health Connect et affiche les données sans obligation d'abonnement premium.",
      },
    },
    metricsSummary: {
      it: "Passi, frequenza cardiaca continua, sonno con stadi, calorie attive, allenamenti",
      en: "Steps, continuous heart rate, sleep with stages, active calories, workouts",
      de: "Schritte, kontinuierlicher Puls, Schlafphasen, Aktivitätskalorien, Workouts",
      fr: "Pas, fréquence cardiaque continue, sommeil avec phases, calories actives, entraînements",
    },
    requirements: {
      it: "Smartphone Android compatibile con Google Pixel Watch; app Google Pixel Watch e Google Health installate con sincronizzazione Health Connect abilitata.",
      en: "Android smartphone compatible with Google Pixel Watch; Google Pixel Watch and Google Health apps installed with Health Connect sync enabled.",
      de: "Mit der Google Pixel Watch kompatibles Android-Smartphone; Google Pixel Watch und Google Health Apps installiert mit aktivierter Health Connect-Synchronisierung.",
      fr: "Smartphone Android compatible avec Google Pixel Watch ; applications Google Pixel Watch et Google Health installées avec synchronisation Health Connect activée.",
    },
    limitations: {
      it: "Disponibile solo su Android. Questo percorso si applica specificamente a Pixel Watch e non va assimilato genericamente a tutti gli smartwatch Wear OS di altri produttori.",
      en: "Available on Android only. This path applies specifically to Pixel Watch and is not generically aggregated with other Wear OS watches.",
      de: "Nur auf Android verfügbar. Dieser Pfad gilt spezifisch für die Pixel Watch und ist nicht mit allen Wear OS-Uhren anderer Hersteller gleichzusetzen.",
      fr: "Disponible uniquement sur Android. Ce parcours s'applique spécifiquement à la Pixel Watch et ne doit pas être confondu avec les autres montres Wear OS.",
    },
    officialSource: {
      title: {
        it: "Google Support: Configurare e sincronizzare Google Pixel Watch",
        en: "Google Support: Set up and sync Google Pixel Watch",
        de: "Google Support: Google Pixel Watch einrichten und synchronisieren",
        fr: "Support Google : Configurer et synchroniser la Google Pixel Watch",
      },
      url: "https://support.google.com/googlepixelwatch/answer/12759285",
      verifiedDate: "2026-09-14",
      supportedClaim: {
        it: "Pixel Watch sincronizza i dati dei sensori con Google Health, che a sua volta li esporta verso Health Connect.",
        en: "Pixel Watch syncs sensor data to Google Health, which in turn exports it to Health Connect.",
        de: "Die Pixel Watch synchronisiert Sensordaten mit Google Health, das sie wiederum an Health Connect exportiert.",
        fr: "La Pixel Watch synchronise les données avec Google Health, qui les exporte ensuite vers Health Connect.",
      },
    },
    evidence: {
      level: "vendor_documented",
      label: EVIDENCE_LABELS.vendor_documented,
      details: {
        it: "Percorso documentato ufficialmente da Google e verificato nel codice Health Connect della release FitMesh 3.10.0+191.",
        en: "Route officially documented by Google and verified in the Health Connect code of FitMesh release 3.10.0+191.",
        de: "Offiziell von Google dokumentierter Pfad, verifiziert im Health Connect-Code des FitMesh-Releases 3.10.0+191.",
        fr: "Parcours officiellement documenté par Google et vérifié dans le code Health Connect de FitMesh 3.10.0+191.",
      },
    },
  },

  // ── 7. Oura Ring su Android ───────────────────────────────────────────
  {
    id: "oura-android",
    providerSlug: "oura",
    phoneOs: "android",
    phoneOsLabel: {
      it: "Android",
      en: "Android",
      de: "Android",
      fr: "Android",
    },
    deviceFamily: "oura-ring",
    deviceFamilyLabel: {
      it: "Oura Ring (Gen2 / Gen3+)",
      en: "Oura Ring (Gen2 / Gen3+)",
      de: "Oura Ring (Gen2 / Gen3+)",
      fr: "Bague Oura (Gen2 / Gen3+)",
    },
    status: "conditional",
    statusLabel: {
      it: "Condizionale",
      en: "Conditional",
      de: "Bedingt unterstützt",
      fr: "Sous conditions",
    },
    direction: "read",
    directionLabel: {
      it: "Lettura via Health Connect",
      en: "Read via Health Connect",
      de: "Lesen über Health Connect",
      fr: "Lecture via Health Connect",
    },
    steps: {
      stepA: {
        it: "Hardware Oura Ring (Gen2, Gen3 e successivi): misurazione di frequenza cardiaca a riposo, variabilità della frequenza cardiaca (HRV), sonno con stadi, temperatura corporea notturna, passi e calorie. Richiede abbonamento attivo Oura per Gen3+ per l'elaborazione completa nell'app Oura.",
        en: "Oura Ring hardware (Gen2, Gen3, and later): measurement of resting heart rate, heart rate variability (HRV), sleep with stages, nighttime body temperature, steps, and calories. Active Oura membership required for Gen3+ for full processing in the Oura app.",
        de: "Oura Ring Hardware (Gen2, Gen3 und neuer): Erfassung von Ruhepuls, Herzfrequenzvariabilität (HRV), Schlaf mit Phasen, nächtlicher Körpertemperatur, Schritten und Kalorien. Aktives Oura-Abonnement für Gen3+ in der Oura-App erforderlich.",
        fr: "Matériel Oura Ring (Gen2, Gen3 et ultérieurs) : mesure du pouls au repos, de la variabilité cardiaque (VFC), du sommeil avec phases, de la température nocturne, des pas et des calories. Abonnement actif Oura requis pour Gen3+.",
      },
      stepB: {
        it: "L'app Oura su smartphone Android riceve i dati via Bluetooth, calcola gli indicatori proprietari (Readiness, Sleep, Activity Score) e li sincronizza con il cloud Oura.",
        en: "The Oura app on Android receives data via Bluetooth, calculates proprietary scores (Readiness, Sleep, Activity Score), and syncs with the Oura cloud.",
        de: "Die Oura-App auf Android empfängt Daten über Bluetooth, berechnet proprietäre Scores (Readiness, Schlaf, Aktivität) und synchronisiert mit der Oura-Cloud.",
        fr: "L'application Oura sur Android reçoit les données via Bluetooth, calcule les scores propriétaires (Readiness, Sommeil, Activité) et synchronise avec le cloud Oura.",
      },
      stepC: {
        it: "L'app Oura per Android documenta l'esportazione verso Health Connect di: calorie attive, distanza, sessioni di allenamento/esercizio, passi, altezza, peso, sonno, frequenza cardiaca e variabilità della frequenza cardiaca (HRV).",
        en: "The Oura app for Android documents export to Health Connect of: active calories, distance, workout/exercise sessions, steps, height, weight, sleep, heart rate, and heart rate variability (HRV).",
        de: "Die Oura-App für Android dokumentiert den Export an Health Connect von: Aktivitätskalorien, Distanz, Workouts/Training, Schritten, Größe, Gewicht, Schlaf, Herzfrequenz und Herzfrequenzvariabilität (HRV).",
        fr: "L'application Oura pour Android documente l'export vers Health Connect de : calories actives, distance, entraînements/exercice, pas, taille, poids, sommeil, fréquence cardiaque et variabilité cardiaque (VFC).",
      },
      stepD: {
        it: "FitMesh Android (release 3.10.0+191) legge da Health Connect una selezione di metriche supportate: passi (STEPS), frequenza cardiaca (HEART_RATE), HRV RMSSD (HEART_RATE_VARIABILITY_RMSSD), sonno con stadi (SLEEP_*), calorie attive (ACTIVE_ENERGY_BURNED), distanza (DISTANCE_DELTA) e allenamenti (WORKOUT). La frequenza a riposo non è esportata come record Health Connect autonomo. Nessuna API Oura diretta live viene interrogata.",
        en: "FitMesh Android (release 3.10.0+191) reads a selection of supported metrics from Health Connect: steps (STEPS), heart rate (HEART_RATE), HRV RMSSD (HEART_RATE_VARIABILITY_RMSSD), sleep with stages (SLEEP_*), active calories (ACTIVE_ENERGY_BURNED), distance (DISTANCE_DELTA), and workouts (WORKOUT). Resting HR is not exported as a standalone Health Connect record. No direct live Oura API is queried.",
        de: "FitMesh Android (Release 3.10.0+191) liest eine Auswahl unterstützter Metriken aus Health Connect aus: Schritte (STEPS), Herzfrequenz (HEART_RATE), HRV RMSSD (HEART_RATE_VARIABILITY_RMSSD), Schlaf mit Phasen (SLEEP_*), Aktivitätskalorien (ACTIVE_ENERGY_BURNED), Distanz (DISTANCE_DELTA) und Workouts (WORKOUT). Ruhepuls wird nicht als eigenständiger Datensatz exportiert. Keine direkte Oura-Live-API.",
        fr: "FitMesh Android (version 3.10.0+191) lit une sélection de métriques prises en charge depuis Health Connect : pas (STEPS), fréquence cardiaque (HEART_RATE), VFC RMSSD (HEART_RATE_VARIABILITY_RMSSD), sommeil avec phases (SLEEP_*), calories actives (ACTIVE_ENERGY_BURNED), distance (DISTANCE_DELTA) et entraînements (WORKOUT). La fréquence au repos n'est pas exportée comme enregistrement autonome. Aucune API directe Oura.",
      },
    },
    metricsSummary: {
      it: "Tra i dati supportati: passi, sonno (durata e stadi), frequenza cardiaca, variabilità della frequenza cardiaca (HRV RMSSD), calorie attive, distanza, allenamenti (letti da FitMesh tramite Health Connect; nessun record di frequenza a riposo standalone)",
      en: "Among supported data: steps, sleep (duration & stages), heart rate, heart rate variability (HRV RMSSD), active calories, distance, workouts (read by FitMesh via Health Connect; no standalone resting HR record)",
      de: "Unter den unterstützten Daten: Schritte, Schlaf (Dauer & Phasen), Herzfrequenz, Herzfrequenzvariabilität (HRV RMSSD), Aktivitätskalorien, Distanz, Workouts (von FitMesh über Health Connect ausgelesen; kein Standalone-Ruhepuls)",
      fr: "Parmi les données prises en charge : pas, sommeil (durée et phases), fréquence cardiaque, variabilité de la fréquence cardiaque (HRV RMSSD), calories actives, distance, entraînements (lus par FitMesh via Health Connect ; pas d'enregistrement de fréquence au repos autonome)",
    },
    requirements: {
      it: "Smartphone Android; app Oura installata con account attivo; integrazione Health Connect attivata nelle impostazioni dell'app Oura; abbonamento Oura per Gen3+.",
      en: "Android smartphone; Oura app installed with active account; Health Connect integration enabled in Oura app settings; active Oura membership for Gen3+.",
      de: "Android-Smartphone; installierte Oura-App mit aktivem Konto; aktivierte Health Connect-Integration in den Oura-Einstellungen; Oura-Abo für Gen3+.",
      fr: "Smartphone Android ; application Oura installée avec compte actif ; intégration Health Connect activée dans Oura ; abonnement Oura pour Gen3+.",
    },
    limitations: {
      it: "Disponibile solo su Android via Health Connect. Gli indici proprietari Oura (Readiness Score, Sleep Score) non transitano in Health Connect e non sono letti da FitMesh.",
      en: "Available on Android only via Health Connect. Proprietary Oura scores (Readiness Score, Sleep Score) do not transfer to Health Connect and are not read by FitMesh.",
      de: "Nur auf Android über Health Connect verfügbar. Proprietäre Oura-Scores (Readiness Score, Sleep Score) werden nicht an Health Connect übertragen.",
      fr: "Disponible uniquement sur Android via Health Connect. Les scores propriétaires Oura (Readiness, Score de sommeil) ne sont pas transférés dans Health Connect.",
    },
    officialSource: {
      title: {
        it: "Oura Help Center: Integrazione Health Connect su Android",
        en: "Oura Help Center: Health Connect by Android Integration",
        de: "Oura Help Center: Health Connect Integration für Android",
        fr: "Centre d'aide Oura : Intégration Health Connect sur Android",
      },
      url: "https://support.ouraring.com/hc/en-us/articles/10786105824531-Health-Connect-by-Android-Integration",
      verifiedDate: "2026-09-14",
      supportedClaim: {
        it: "La documentazione ufficiale Oura indica l'esportazione verso Health Connect di calorie attive, distanza, esercizio/allenamenti, passi, altezza, peso, sonno, frequenza cardiaca e HRV.",
        en: "Official Oura documentation specifies export to Health Connect of active calories, distance, exercise/workouts, steps, height, weight, sleep, heart rate, and HRV.",
        de: "Die offizielle Oura-Dokumentation belegt den Export an Health Connect für Aktivitätskalorien, Distanz, Training/Workouts, Schritte, Größe, Gewicht, Schlaf, Herzfrequenz und HRV.",
        fr: "La documentation officielle Oura spécifie l'export vers Health Connect des calories actives, distance, exercice/entraînements, pas, taille, poids, sommeil, fréquence cardiaque et VFC.",
      },
    },
    evidence: {
      level: "vendor_documented",
      label: EVIDENCE_LABELS.vendor_documented,
      details: {
        it: "Percorso documentato ufficialmente da Oura Help Center e supportato dal codice Health Connect della release pubblica FitMesh 3.10.0+191.",
        en: "Route officially documented by Oura Help Center and supported by the Health Connect reader code of public release FitMesh 3.10.0+191.",
        de: "Offiziell vom Oura Help Center dokumentierter Pfad, unterstützt durch den Health Connect-Code des FitMesh-Releases 3.10.0+191.",
        fr: "Parcours officiellement documenté par le centre d'aide Oura et pris en charge par le code Health Connect de FitMesh 3.10.0+191.",
      },
    },
  },

  // ── 8. Oura Ring su iPhone (iOS) ──────────────────────────────────────
  {
    id: "oura-ios",
    providerSlug: "oura",
    phoneOs: "ios",
    phoneOsLabel: {
      it: "iPhone (iOS)",
      en: "iPhone (iOS)",
      de: "iPhone (iOS)",
      fr: "iPhone (iOS)",
    },
    deviceFamily: "oura-ring",
    deviceFamilyLabel: {
      it: "Oura Ring (Gen2 / Gen3+)",
      en: "Oura Ring (Gen2 / Gen3+)",
      de: "Oura Ring (Gen2 / Gen3+)",
      fr: "Bague Oura (Gen2 / Gen3+)",
    },
    status: "conditional",
    statusLabel: {
      it: "Condizionale",
      en: "Conditional",
      de: "Bedingt unterstützt",
      fr: "Sous conditions",
    },
    direction: "read",
    directionLabel: {
      it: "Lettura via Apple Health",
      en: "Read via Apple Health",
      de: "Lesen über Apple Health",
      fr: "Lecture via Apple Santé",
    },
    steps: {
      stepA: {
        it: "Hardware Oura Ring (Gen2, Gen3 e successivi): misurazione di frequenza cardiaca a riposo, variabilità della frequenza cardiaca (HRV), sonno con stadi, temperatura corporea notturna, passi e calorie. Richiede abbonamento attivo Oura per Gen3+ per l'elaborazione completa nell'app Oura.",
        en: "Oura Ring hardware (Gen2, Gen3, and later): measurement of resting heart rate, heart rate variability (HRV), sleep with stages, nighttime body temperature, steps, and calories. Active Oura membership required for Gen3+ for full processing in the Oura app.",
        de: "Oura Ring Hardware (Gen2, Gen3 und neuer): Erfassung von Ruhepuls, Herzfrequenzvariabilität (HRV), Schlaf mit Phasen, nächtlicher Körpertemperatur, Schritten und Kalorien. Aktives Oura-Abonnement für Gen3+ in der Oura-App erforderlich.",
        fr: "Matériel Oura Ring (Gen2, Gen3 et ultérieurs) : mesure du pouls au repos, de la variabilité cardiaque (VFC), du sommeil avec phases, de la température nocturne, des pas et des calories. Abonnement actif Oura requis pour Gen3+.",
      },
      stepB: {
        it: "L'app Oura su iPhone riceve i dati via Bluetooth, elabora gli indici proprietari (Readiness, Sleep, Activity Score) e li archivia sul profilo utente Oura.",
        en: "The Oura app on iPhone receives data via Bluetooth, calculates proprietary scores (Readiness, Sleep, Activity Score), and stores them on the user's Oura profile.",
        de: "Die Oura-App auf dem iPhone empfängt Daten über Bluetooth, berechnet proprietäre Scores (Readiness, Schlaf, Aktivität) und speichert sie im Oura-Profil.",
        fr: "L'application Oura sur iPhone reçoit les données via Bluetooth, calcule les scores propriétaires (Readiness, Sommeil, Activité) et les stocke sur le profil Oura.",
      },
      stepC: {
        it: "L'app Oura per iOS documenta l'esportazione verso Apple Health di una selezione di dati tra cui: sonno (analisi del sonno), frequenza cardiaca, frequenza respiratoria, passi, calorie attive e allenamenti, previa concessione dei permessi in Apple Salute. La documentazione Oura non elenca la frequenza a riposo (RESTING_HEART_RATE) tra i dati esportati.",
        en: "The Oura iOS app documents export to Apple Health of selected data including: sleep (sleep analysis), heart rate, respiratory rate, steps, active calories, and workouts, subject to permissions in Apple Health. Oura documentation does not list resting heart rate (RESTING_HEART_RATE) among exported data.",
        de: "Die Oura iOS-App dokumentiert den Export an Apple Health für ausgewählte Daten, darunter: Schlaf (Schlafanalyse), Herzfrequenz, Atemfrequenz, Schritte, Aktivitätskalorien und Workouts nach Freigabe. Die Oura-Dokumentation führt keinen Ruhepuls (RESTING_HEART_RATE) unter den exportierten Daten auf.",
        fr: "L'application Oura pour iOS documente l'export vers Apple Santé d'une sélection de données incluant : sommeil (analyse du sommeil), fréquence cardiaque, fréquence respiratoire, pas, calories actives et entraînements. La documentation Oura n'indique pas la fréquence au repos (RESTING_HEART_RATE) parmi les données exportées.",
      },
      stepD: {
        it: "FitMesh iOS (release 3.10.0+191) legge da HealthKit i dati supportati scritti da Oura in Apple Health, inclusi: STEPS, HEART_RATE, SLEEP, ACTIVE_ENERGY, WORKOUT e RESPIRATORY_RATE. Non viene dedotto né letto un record RESTING_HEART_RATE da Oura. Non viene interrogata alcuna API Oura cloud diretta.",
        en: "FitMesh iOS (release 3.10.0+191) reads from HealthKit supported data written by Oura to Apple Health, including: STEPS, HEART_RATE, SLEEP, ACTIVE_ENERGY, WORKOUT, and RESPIRATORY_RATE. No RESTING_HEART_RATE record is read from Oura. No direct Oura cloud API is queried.",
        de: "FitMesh iOS (Release 3.10.0+191) liest aus HealthKit die von Oura in Apple Health geschriebenen unterstützten Daten aus, darunter: STEPS, HEART_RATE, SLEEP, ACTIVE_ENERGY, WORKOUT und RESPIRATORY_RATE. Es wird kein RESTING_HEART_RATE-Datensatz von Oura ausgelesen. Keine direkte Oura-Cloud-API.",
        fr: "FitMesh iOS (version 3.10.0+191) lit depuis HealthKit les données prises en charge écrites par Oura dans Apple Santé, notamment : STEPS, HEART_RATE, SLEEP, ACTIVE_ENERGY, WORKOUT et RESPIRATORY_RATE. Aucun enregistrement RESTING_HEART_RATE n'est lu depuis Oura. Aucune API directe Oura.",
      },
    },
    metricsSummary: {
      it: "Tra i dati supportati: passi, sonno (durata e stadi), frequenza cardiaca, frequenza respiratoria, calorie attive, allenamenti (scritti da Oura in Apple Health e letti da FitMesh; frequenza a riposo non esportata come record autonomo in HealthKit)",
      en: "Among supported data: steps, sleep (duration & stages), heart rate, respiratory rate, active calories, workouts (written by Oura to Apple Health and read by FitMesh; resting HR is not exported as a standalone HealthKit record)",
      de: "Unter den unterstützten Daten: Schritte, Schlaf (Dauer & Phasen), Herzfrequenz, Atemfrequenz, Aktivitätskalorien, Workouts (von Oura in Apple Health geschrieben und von FitMesh ausgelesen; kein eigenständiger Ruhepuls-Datensatz in HealthKit)",
      fr: "Parmi les données prises en charge : pas, sommeil (durée et phases), fréquence cardiaque, fréquence respiratoire, calories actives, entraînements (écrits par Oura dans Apple Santé et lus par FitMesh ; pas d'enregistrement autonome de fréquence au repos dans HealthKit)",
    },
    requirements: {
      it: "iPhone con iOS; app Oura installata con account attivo; sincronizzazione Apple Health attivata nelle impostazioni dell'app Oura con autorizzazioni concesse; abbonamento Oura per Gen3+.",
      en: "iPhone with iOS; Oura app installed with active account; Apple Health sync enabled in Oura app settings with granted permissions; active Oura membership for Gen3+.",
      de: "iPhone mit iOS; installierte Oura-App mit aktivem Konto; aktivierte Apple Health-Synchronisierung in den Oura-Einstellungen mit erteilten Rechten; Oura-Abo für Gen3+.",
      fr: "iPhone sous iOS ; application Oura installée avec compte actif ; synchronisation Apple Santé activée dans les paramètres Oura avec autorisations accordées ; abonnement Oura pour Gen3+.",
    },
    limitations: {
      it: "Gli indici proprietari Oura (Readiness Score, Sleep Score) e la frequenza cardiaca a riposo calcolata internamente da Oura non transitano come record autonomi in Apple Health e non sono leggibili da FitMesh. L'aggiornamento dipende dall'apertura e sincronizzazione dell'app Oura con l'anello.",
      en: "Proprietary Oura scores (Readiness Score, Sleep Score) and resting heart rate calculated internally by Oura do not transfer as standalone records to Apple Health and are not readable by FitMesh. Updates depend on opening and syncing the Oura app with the ring.",
      de: "Proprietäre Oura-Scores (Readiness Score, Sleep Score) und der intern von Oura berechnete Ruhepuls werden nicht als autonome Datensätze an Apple Health übertragen und sind von FitMesh nicht lesbar. Die Aktualisierung erfordert das Öffnen und Synchronisieren der Oura-App.",
      fr: "Les scores propriétaires Oura (Readiness, Score de sommeil) et la fréquence au repos calculée en interne par Oura ne sont pas transférés comme enregistrements autonomes dans Apple Santé et ne sont pas lisibles par FitMesh. La mise à jour dépend de l'ouverture et synchronisation de l'application Oura.",
    },
    officialSource: {
      title: {
        it: "Oura Help Center: Integrazione Apple Health",
        en: "Oura Help Center: Apple Health Integration",
        de: "Oura Help Center: Apple Health Integration",
        fr: "Centre d'aide Oura : Intégration Apple Santé",
      },
      url: "https://support.ouraring.com/hc/en-us/articles/360025438734-Apple-Health-Integration",
      verifiedDate: "2026-09-14",
      supportedClaim: {
        it: "La documentazione ufficiale Oura per Apple Health elenca l'esportazione di sonno, frequenza cardiaca, frequenza respiratoria, calorie attive, passi e allenamenti; la frequenza a riposo non figura tra i dati esportati.",
        en: "Official Oura Apple Health documentation specifies export of sleep, heart rate, respiratory rate, active calories, steps, and workouts; resting heart rate is not listed among exported data.",
        de: "Die offizielle Oura-Dokumentation für Apple Health führt den Export von Schlaf, Herzfrequenz, Atemfrequenz, Aktivitätskalorien, Schritten und Workouts auf; Ruhepuls ist nicht unter den exportierten Daten aufgeführt.",
        fr: "La documentation officielle Oura pour Apple Santé spécifie l'export du sommeil, fréquence cardiaque, fréquence respiratoire, calories actives, pas et entraînements ; la fréquence au repos ne figure pas parmi les données exportées.",
      },
    },
    evidence: {
      level: "vendor_documented",
      label: EVIDENCE_LABELS.vendor_documented,
      details: {
        it: "Percorso documentato ufficialmente da Oura Help Center e verificato nel codice HealthKit della release pubblica FitMesh 3.10.0+191.",
        en: "Route officially documented by Oura Help Center and verified in the HealthKit reader code of public release FitMesh 3.10.0+191.",
        de: "Offiziell vom Oura Help Center dokumentierter Pfad, verifiziert im HealthKit-Code des FitMesh-Releases 3.10.0+191.",
        fr: "Parcours officiellement documenté par le centre d'aide Oura et vérifié dans le code HealthKit de FitMesh 3.10.0+191.",
      },
    },
  },

  // ── 9. Colmi Smart Ring su Android ────────────────────────────────────
  {
    id: "colmi-android",
    providerSlug: "colmi-ring",
    phoneOs: "android",
    phoneOsLabel: {
      it: "Android",
      en: "Android",
      de: "Android",
      fr: "Android",
    },
    deviceFamily: "colmi-ring",
    deviceFamilyLabel: {
      it: "Colmi Smart Ring (R02 / R06 / R09)",
      en: "Colmi Smart Ring (R02 / R06 / R09)",
      de: "Colmi Smart Ring (R02 / R06 / R09)",
      fr: "Bagues connectées Colmi (R02 / R06 / R09)",
    },
    status: "supported",
    statusLabel: {
      it: "Supportato",
      en: "Supported",
      de: "Unterstützt",
      fr: "Pris en charge",
    },
    direction: "read",
    directionLabel: {
      it: "Lettura BLE diretta (senza app del produttore)",
      en: "Direct BLE Read (no manufacturer app)",
      de: "Direktes BLE-Lesen (ohne Hersteller-App)",
      fr: "Lecture BLE directe (sans application du fabricant)",
    },
    steps: {
      stepA: {
        it: "Hardware Colmi testato (modelli R02, R06, R09): misurazione di passi in bucket da 15 minuti, frequenza cardiaca periodica e monitoraggio del sonno con stadi. Sensore di temperatura cutanea presente specificamente su R02 e R09 (non universale per tutti i modelli del brand).",
        en: "Tested Colmi hardware (R02, R06, R09 models): measurement of steps in 15-minute buckets, periodic heart rate, and sleep monitoring with stages. Skin temperature sensor present specifically on R02 & R09 (not universal across all brand models).",
        de: "Getestete Colmi-Hardware (Modelle R02, R06, R09): Erfassung von Schritten in 15-Minuten-Buckets, periodischem Puls und Schlaf mit Phasen. Hauttemperatursensor spezifisch bei R02 und R09 vorhanden.",
        fr: "Matériel Colmi testé (modèles R02, R06, R09) : mesure des pas par tranches de 15 minutes, pouls périodique et sommeil avec phases. Capteur de température cutanée spécifique aux modèles R02 et R09.",
      },
      stepB: {
        it: "La lettura dall'anello non richiede l'app o il cloud del produttore Colmi. L'anello comunica direttamente con FitMesh via Bluetooth Low Energy.",
        en: "Reading from the ring does not require the manufacturer Colmi's app or cloud. The ring communicates directly with FitMesh via Bluetooth Low Energy.",
        de: "Das Auslesen vom Ring erfordert weder Hersteller-App noch Cloud von Colmi. Der Ring kommuniziert direkt mit FitMesh über Bluetooth Low Energy.",
        fr: "La lecture depuis la bague ne nécessite ni application ni cloud du fabricant Colmi. La bague communique directement avec FitMesh en Bluetooth Low Energy.",
      },
      stepC: {
        it: "Il trasferimento dati avviene tramite protocollo Bluetooth Low Energy (BLE) direttamente tra il controller radio dell'anello e l'applicazione FitMesh.",
        en: "Data transfer occurs via Bluetooth Low Energy (BLE) protocol directly between the ring radio controller and the FitMesh app.",
        de: "Die Datenübertragung erfolgt über das Bluetooth Low Energy (BLE)-Protokoll direkt zwischen Ring-Controller und FitMesh-App.",
        fr: "Le transfert de données s'effectue via le protocole Bluetooth Low Energy (BLE) directement entre la bague et l'application FitMesh.",
      },
      stepD: {
        it: "FitMesh Android (release 3.10.0+191) scarica i bucket temporali nativi dall'anello via BLE, applica la pipeline di decodifica e sincronizza le metriche con il backend cloud FitMesh per la dashboard web personale.",
        en: "FitMesh Android (release 3.10.0+191) downloads native temporal buckets from the ring via BLE, applies the decoding pipeline, and syncs metrics with the FitMesh cloud backend for your personal web dashboard.",
        de: "FitMesh Android (Release 3.10.0+191) lädt native Zeit-Buckets über BLE herunter, führt die Dekodierung aus und synchronisiert die Werte mit dem FitMesh-Cloud-Backend für das Dashboard.",
        fr: "FitMesh Android (version 3.10.0+191) télécharge les tranches temporelles via BLE, applique le décodage et synchronise les données avec le backend cloud FitMesh pour votre tableau de bord.",
      },
    },
    metricsSummary: {
      it: "Passi (bucket 15 min), frequenza cardiaca periodica, sonno con stadi, temperatura cutanea (R02/R09), stato batteria",
      en: "Steps (15-min buckets), periodic heart rate, sleep with stages, skin temperature (R02/R09), battery status",
      de: "Schritte (15-Min.-Buckets), periodischer Puls, Schlaf mit Phasen, Hauttemperatur (R02/R09), Batteriestand",
      fr: "Pas (tranches 15 min), fréquence cardiaque périodique, sommeil avec phases, température cutanée (R02/R09), batterie",
    },
    requirements: {
      it: "Smartphone Android con Bluetooth abilitato; anello Colmi carico e posizionato a portata radio durante il sync.",
      en: "Android smartphone with Bluetooth enabled; Colmi ring charged and within wireless range during sync.",
      de: "Android-Smartphone mit aktiviertem Bluetooth; geladener Colmi-Ring in Funkreichweite während der Synchronisierung.",
      fr: "Smartphone Android avec Bluetooth activé ; bague Colmi chargée et à portée radio pendant la synchronisation.",
    },
    limitations: {
      it: "La lettura dall'anello non richiede l'app o il cloud del produttore Colmi. L'eventuale sincronizzazione con dashboard segue l'architettura FitMesh descritta nella Privacy Policy. La sincronizzazione richiede la vicinanza dell'anello allo smartphone.",
      en: "Reading from the ring does not require the manufacturer Colmi app or cloud. Synchronization with dashboard follows the FitMesh architecture described in the Privacy Policy. Sync requires physical proximity of the ring to the smartphone.",
      de: "Das Auslesen vom Ring erfordert weder Hersteller-App noch Cloud von Colmi. Die Synchronisierung mit dem Dashboard folgt der FitMesh-Architektur laut Datenschutzerklärung. Die Synchronisierung erfordert physische Nähe zum Smartphone.",
      fr: "La lecture depuis la bague ne requiert ni application ni cloud du fabricant Colmi. La synchronisation avec le tableau de bord suit l'architecture FitMesh décrite dans la Politique de confidentialité. La synchronisation requiert la proximité de la bague.",
    },
    officialSource: {
      title: {
        it: "Architettura e Specifiche di Release FitMesh v3.10.0+191 (Driver BLE Colmi)",
        en: "FitMesh Release Architecture & Specifications v3.10.0+191 (Colmi BLE Driver)",
        de: "FitMesh Release-Architektur & Spezifikationen v3.10.0+191 (Colmi BLE-Treiber)",
        fr: "Architecture et spécifications de version FitMesh v3.10.0+191 (Pilote BLE Colmi)",
      },
      url: "https://github.com/Fosforonero/fitthesite",
      verifiedDate: "2026-09-14",
      supportedClaim: {
        it: "Driver BLE proprietario FitMesh integrato nella release per la lettura diretta di bucket a 15 min, frequenza, sonno e temperatura senza app o cloud del produttore Colmi.",
        en: "Proprietary FitMesh BLE driver built into release for direct reading of 15-min buckets, heart rate, sleep, and temperature without manufacturer Colmi app or cloud.",
        de: "Proprietärer FitMesh BLE-Treiber zum direkten Auslesen von 15-Min.-Buckets, Puls, Schlaf und Temperatur ohne Hersteller-App oder Cloud von Colmi.",
        fr: "Pilote BLE propriétaire FitMesh intégré à la release pour la lecture directe des tranches de 15 min, pouls, sommeil et température sans application ni cloud Colmi.",
      },
    },
    evidence: {
      level: "device_tested",
      label: EVIDENCE_LABELS.device_tested,
      details: {
        it: "Testato e verificato su dispositivi reali Colmi R02, R06 e R09 con il codice della release pubblica FitMesh 3.10.0+191.",
        en: "Tested and verified on real Colmi R02, R06, and R09 devices with public release FitMesh 3.10.0+191 code.",
        de: "Getestet und verifiziert auf realen Geräten (Colmi R02, R06 und R09) mit dem Code des FitMesh-Releases 3.10.0+191.",
        fr: "Testé et vérifié sur des appareils réels Colmi R02, R06 et R09 avec le code de version FitMesh 3.10.0+191.",
      },
    },
  },

  // ── 10. Colmi Smart Ring su iPhone (iOS) ───────────────────────────────
  {
    id: "colmi-ios",
    providerSlug: "colmi-ring",
    phoneOs: "ios",
    phoneOsLabel: {
      it: "iPhone (iOS)",
      en: "iPhone (iOS)",
      de: "iPhone (iOS)",
      fr: "iPhone (iOS)",
    },
    deviceFamily: "colmi-ring",
    deviceFamilyLabel: {
      it: "Colmi Smart Ring (R02 / R06 / R09)",
      en: "Colmi Smart Ring (R02 / R06 / R09)",
      de: "Colmi Smart Ring (R02 / R06 / R09)",
      fr: "Bagues connectées Colmi (R02 / R06 / R09)",
    },
    status: "supported",
    statusLabel: {
      it: "Supportato",
      en: "Supported",
      de: "Unterstützt",
      fr: "Pris en charge",
    },
    direction: "read-write",
    directionLabel: {
      it: "Lettura BLE diretta + Scrittura HealthKit opzionale (passi, FC riposo)",
      en: "Direct BLE Read + Optional HealthKit Write (steps, resting HR)",
      de: "Direktes BLE-Lesen + optionales HealthKit-Schreiben (Schritte, Ruhepuls)",
      fr: "Lecture BLE directe + Écriture HealthKit optionnelle (pas, fréquence au repos)",
    },
    steps: {
      stepA: {
        it: "Hardware Colmi testato (modelli R02, R06, R09): misurazione di passi, frequenza cardiaca periodica e sonno con stadi. Sensore di temperatura cutanea presente sui modelli R02 e R09.",
        en: "Tested Colmi hardware (R02, R06, R09 models): measurement of steps, periodic heart rate, and sleep with stages. Skin temperature sensor present on R02 & R09 models.",
        de: "Getestete Colmi-Hardware (Modelle R02, R06, R09): Erfassung von Schritten, periodischem Puls und Schlaf mit Phasen. Hauttemperatursensor bei R02 und R09 vorhanden.",
        fr: "Matériel Colmi testé (modèles R02, R06, R09) : mesure des pas, du pouls périodique et du sommeil avec phases. Capteur de température sur modèles R02 et R09.",
      },
      stepB: {
        it: "La lettura dall'anello non richiede l'app o il cloud del produttore Colmi. L'anello comunica direttamente con FitMesh iOS tramite CoreBluetooth.",
        en: "Reading from the ring does not require the manufacturer Colmi's app or cloud. The ring communicates directly with FitMesh iOS via CoreBluetooth.",
        de: "Das Auslesen vom Ring erfordert weder Hersteller-App noch Cloud von Colmi. Der Ring kommuniziert direkt mit FitMesh iOS über CoreBluetooth.",
        fr: "La lecture depuis la bague ne nécessite ni application ni cloud du fabricant Colmi. La bague communique directement avec FitMesh iOS via CoreBluetooth.",
      },
      stepC: {
        it: "Connessione BLE nativa gestita tramite CoreBluetooth tra il chip dell'anello e l'iPhone.",
        en: "Native BLE connection managed via CoreBluetooth between the ring chip and the iPhone.",
        de: "Native BLE-Verbindung über CoreBluetooth zwischen Ring-Chip und iPhone.",
        fr: "Connexion BLE native gérée via CoreBluetooth entre la bague et l'iPhone.",
      },
      stepD: {
        it: "Colmi BLE → FitMesh → backend/dashboard FitMesh → ponte HealthKit su iPhone. FitMesh riceve i dati via BLE dall'anello e li carica sul backend cloud FitMesh per la dashboard. Quando l'interruttore Apple Salute è attivo nelle impostazioni, il ponte HealthKit su iPhone legge i dati consolidati dal cloud e scrive in Apple Salute: passi (in gap-fill anti-loop), frequenza cardiaca a riposo, saturazione (SpO2), calorie attive e distanza. L'esportazione del sonno è disattivata nella versione pubblica corrente.",
        en: "Colmi BLE → FitMesh → backend/dashboard FitMesh → HealthKit bridge on iPhone. FitMesh receives data via BLE from the ring and uploads it to the FitMesh cloud backend for the dashboard. When the Apple Health toggle is enabled in settings, the HealthKit bridge on iPhone reads consolidated cloud data and writes to Apple Health: steps (anti-loop gap-fill), resting heart rate, SpO2, active calories, and distance. Sleep export is disabled in the current public release.",
        de: "Colmi BLE → FitMesh → Backend/Dashboard FitMesh → HealthKit-Brücke auf dem iPhone. FitMesh empfängt Daten per BLE vom Ring und lädt sie in das FitMesh-Cloud-Backend für das Dashboard hoch. Bei aktiviertem Apple Health-Schalter liest die HealthKit-Brücke die konsolidierten Cloud-Daten und schreibt in Apple Health: Schritte (Anti-Loop Gap-Fill), Ruhepuls, SpO2, Aktivitätskalorien und Distanz. Der Schlaf-Export ist in der aktuellen öffentlichen Version deaktiviert.",
        fr: "Colmi BLE → FitMesh → backend/tableau de bord FitMesh → pont HealthKit sur iPhone. FitMesh reçoit les données via BLE et les téléverse sur le backend FitMesh pour le tableau de bord. Lorsque l'option Apple Santé est activée, le pont HealthKit lit les données cloud et écrit dans Apple Santé : pas (comblement anti-boucle), fréquence au repos, SpO2, calories actives et distance. L'export du sommeil est désactivé dans la version publique actuelle.",
      },
    },
    metricsSummary: {
      it: "Passi (bucket 15 min), frequenza cardiaca periodica, sonno con stadi su dashboard FitMesh; esportazione opzionale in Apple Health di passi (gap-fill) e frequenza a riposo (sonno escluso dal write-back)",
      en: "Steps (15-min buckets), periodic heart rate, sleep with stages on FitMesh dashboard; optional Apple Health export of steps (gap-fill) and resting HR (sleep excluded from write-back)",
      de: "Schritte (15-Min.-Buckets), periodischer Puls, Schlaf mit Phasen im FitMesh-Dashboard; optionaler Apple Health-Export von Schritten (Gap-Fill) und Ruhepuls (Schlaf vom Write-Back ausgeschlossen)",
      fr: "Pas (tranches 15 min), fréquence cardiaque périodique, sommeil avec phases sur le tableau de bord FitMesh ; export optionnel vers Apple Santé des pas (comblement) et repos (sommeil exclu du write-back)",
    },
    requirements: {
      it: "iPhone con Bluetooth attivo; anello Colmi carico; per la scrittura su Apple Salute è richiesta l'attivazione nelle impostazioni dell'app.",
      en: "iPhone with Bluetooth enabled; Colmi ring charged; writing to Apple Health requires toggle enablement in app settings.",
      de: "iPhone mit aktivem Bluetooth; geladener Colmi-Ring; das Schreiben in Apple Health erfordert die Aktivierung in den App-Einstellungen.",
      fr: "iPhone avec Bluetooth activé ; bague Colmi chargée ; l'écriture dans Apple Santé requiert l'activation dans les paramètres.",
    },
    limitations: {
      it: "La lettura dall'anello non richiede l'app o il cloud del produttore Colmi. L'eventuale sincronizzazione con dashboard e Apple Health segue l'architettura FitMesh descritta nella Privacy Policy. Il write-back verso Apple Health è opzionale (disattivato di default) e non include il sonno nella release 3.10.0+191.",
      en: "Reading from the ring does not require the manufacturer Colmi app or cloud. Any synchronization with dashboard and Apple Health follows the FitMesh architecture described in the Privacy Policy. Apple Health write-back is opt-in (disabled by default) and does not include sleep in release 3.10.0+191.",
      de: "Das Auslesen vom Ring erfordert weder Hersteller-App noch Cloud von Colmi. Eine Synchronisierung mit Dashboard und Apple Health folgt der in der Datenschutzerklärung beschriebenen FitMesh-Architektur. Das Schreiben in Apple Health ist optional (standardmäßig deaktiviert) und schließt Schlaf in Release 3.10.0+191 aus.",
      fr: "La lecture depuis la bague ne nécessite ni application ni cloud du fabricant Colmi. Toute synchronisation avec le tableau de bord et Apple Santé suit l'architecture FitMesh décrite dans la Politique de confidentialité. L'écriture dans Apple Santé est optionnelle (désactivée par défaut) et n'inclut pas le sommeil dans la version 3.10.0+191.",
    },
    officialSource: {
      title: {
        it: "Apple Developer: Documentazione Framework HealthKit",
        en: "Apple Developer: HealthKit Framework Documentation",
        de: "Apple Developer: HealthKit-Framework-Dokumentation",
        fr: "Apple Developer : Documentation du framework HealthKit",
      },
      url: "https://developer.apple.com/documentation/healthkit",
      verifiedDate: "2026-09-14",
      supportedClaim: {
        it: "Documenta il modello di autorizzazione e i tipi di dato supportati dal framework HealthKit per la condivisione e scrittura su Apple Salute.",
        en: "Documents the HealthKit authorization model and supported data types for sharing and writing to Apple Health.",
        de: "Dokumentiert das HealthKit-Berechtigungsmodell und unterstützte Datentypen für Freigabe und Schreiben in Apple Health.",
        fr: "Documente le modèle d'autorisation HealthKit et les types de données pris en charge pour le partage et l'écriture dans Apple Santé.",
      },
    },
    evidence: {
      level: "device_tested",
      label: EVIDENCE_LABELS.device_tested,
      details: {
        it: "Testato su iPhone fisico con anelli Colmi R02, R06 e R09. Nel codice della release FitMesh 3.10.0+191 la scrittura HealthKit è opzionale e l'esportazione del sonno è disattivata nella versione pubblica.",
        en: "Tested on physical iPhone with Colmi R02, R06, and R09 rings. In FitMesh release 3.10.0+191 code, HealthKit write-back is optional and sleep export is disabled in the public release.",
        de: "Auf physischem iPhone mit Colmi R02, R06 und R09 getestet. Im Release-Code 3.10.0+191 ist das HealthKit-Schreiben optional und der Schlaf-Export in der öffentlichen Version deaktiviert.",
        fr: "Testé sur iPhone physique avec bagues Colmi R02, R06 et R09. Dans le code FitMesh 3.10.0+191, l'écriture HealthKit est optionnelle et l'export du sommeil est désactivé dans la version publique.",
      },
    },
  },
];

export interface UnverifiedPathInfo {
  phoneOs: PhoneOs;
  deviceFamily: DeviceFamily;
  title: Record<SupportedMatrixLocale, string>;
  description: Record<SupportedMatrixLocale, string>;
  providerSlug: string;
}

export const UNVERIFIED_COMBINATIONS_MAP: Record<string, UnverifiedPathInfo> = {
  "galaxy-watch-ios": {
    phoneOs: "ios",
    deviceFamily: "galaxy-watch",
    title: {
      it: "Galaxy Watch su iPhone: Percorso non censito in questa prima matrice",
      en: "Galaxy Watch on iPhone: Route not mapped in this initial matrix",
      de: "Galaxy Watch auf dem iPhone: In dieser ersten Matrix nicht erfasster Pfad",
      fr: "Galaxy Watch sur iPhone : Parcours non répertorié dans cette première matrice",
    },
    description: {
      it: "Questa prima release della matrice documenta i percorsi ufficiali su smartphone Android. L'abbinamento di Galaxy Watch su iPhone non è compreso in questa ricognizione.",
      en: "This initial matrix release documents official routes on Android smartphones. Pairing Galaxy Watch with iPhone is not included in this survey.",
      de: "Diese erste Version der Matrix dokumentiert offizielle Pfade auf Android-Smartphones. Die Kopplung der Galaxy Watch mit dem iPhone ist in dieser Übersicht nicht enthalten.",
      fr: "Cette première version de la matrice documente les parcours officiels sous Android. Le jumelage de Galaxy Watch avec iPhone n'est pas inclus dans cet état des lieux.",
    },
    providerSlug: "galaxy-watch",
  },
  "pixel-watch-ios": {
    phoneOs: "ios",
    deviceFamily: "pixel-watch",
    title: {
      it: "Pixel Watch su iPhone: Percorso non censito in questa prima matrice",
      en: "Pixel Watch on iPhone: Route not mapped in this initial matrix",
      de: "Pixel Watch auf dem iPhone: In dieser ersten Matrix nicht erfasster Pfad",
      fr: "Pixel Watch sur iPhone : Parcours non répertorié dans cette première matrice",
    },
    description: {
      it: "Questa prima release della matrice documenta i percorsi supportati su Android. L'utilizzo di Google Pixel Watch su iOS non è censito in questa versione.",
      en: "This initial matrix release documents supported routes on Android. Using Google Pixel Watch on iOS is not mapped in this version.",
      de: "Diese erste Version der Matrix dokumentiert unterstützte Pfade unter Android. Die Nutzung der Google Pixel Watch unter iOS wird in dieser Version nicht erfasst.",
      fr: "Cette première version de la matrice documente les parcours pris en charge sous Android. L'utilisation de Google Pixel Watch sous iOS n'est pas répertoriée dans cette version.",
    },
    providerSlug: "pixel-watch",
  },
};
