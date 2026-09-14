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
  guideHref?: string;
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
    guideHref: "/blog/garmin-samsung-health-sync-guide",
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
    guideHref: "/sync/garmin",
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
        it: "L'app Fitbit su Android elabora le metriche collegandole all'account Google associato.",
        en: "The Fitbit app on Android processes metrics linked to your associated Google account.",
        de: "Die Fitbit-App auf Android verarbeitet die Werte im verknüpften Google-Konto.",
        fr: "L'application Fitbit sur Android traite les métriques associées au compte Google.",
      },
      stepC: {
        it: "L'app Fitbit trasferisce a Health Connect i passi, la frequenza cardiaca, la durata del sonno, le calorie e le sessioni di allenamento.",
        en: "The Fitbit app transfers steps, heart rate, sleep duration, calories, and workout sessions to Health Connect.",
        de: "Die Fitbit-App überträgt Schritte, Herzfrequenz, Schlafdauer, Kalorien und Trainingseinheiten an Health Connect.",
        fr: "L'application Fitbit transfère à Health Connect les pas, le rythme cardiaque, la durée du sommeil, les calories et les entraînements.",
      },
      stepD: {
        it: "FitMesh Android (release 3.10.0+191) legge i dati standard da Health Connect e aggiorna la dashboard personale senza richiedere abbonamento Fitbit Premium.",
        en: "FitMesh Android (release 3.10.0+191) reads standard data from Health Connect and updates your personal dashboard without requiring a Fitbit Premium subscription.",
        de: "FitMesh Android (Release 3.10.0+191) liest Standarddaten aus Health Connect aus und aktualisiert das Dashboard ohne Pflicht zu Fitbit Premium.",
        fr: "FitMesh Android (version 3.10.0+191) lit les données standard depuis Health Connect et met à jour le tableau de bord sans abonnement Fitbit Premium.",
      },
    },
    metricsSummary: {
      it: "Passi, frequenza cardiaca, durata del sonno, calorie, distanza, allenamenti",
      en: "Steps, heart rate, sleep duration, calories, distance, workouts",
      de: "Schritte, Herzfrequenz, Schlafdauer, Kalorien, Distanz, Workouts",
      fr: "Pas, fréquence cardiaque, durée du sommeil, calories, distance, entraînements",
    },
    requirements: {
      it: "Smartphone Android; app Fitbit con account Google attivo; sincronizzazione Health Connect abilitata nelle impostazioni Fitbit.",
      en: "Android smartphone; Fitbit app with active Google account; Health Connect sync enabled in Fitbit settings.",
      de: "Android-Smartphone; Fitbit-App mit aktivem Google-Konto; in der Fitbit-App aktivierte Health Connect-Synchronisierung.",
      fr: "Smartphone Android ; application Fitbit avec compte Google actif ; synchronisation Health Connect activée dans Fitbit.",
    },
    limitations: {
      it: "L'app Fitbit e l'account Google restano obbligatori sullo smartphone. L'esportazione delle fasi del sonno dettagliate (REM/profondo) dipende dalla configurazione concessa dall'app Fitbit.",
      en: "The Fitbit app and Google account remain required on the smartphone. Export of detailed sleep stages (REM/deep) depends on what the Fitbit app shares.",
      de: "Die Fitbit-App und das Google-Konto bleiben auf dem Smartphone erforderlich. Der Export detaillierter Schlafphasen (REM/Tiefschlaf) hängt von der Fitbit-App ab.",
      fr: "L'application Fitbit et le compte Google restent requis sur le smartphone. L'export des phases détaillées de sommeil dépend du partage de l'application Fitbit.",
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
        it: "L'app Fitbit su Android scrive passi, distanza, sonno, minuti in zona attiva, esercizi e calorie in Health Connect.",
        en: "Fitbit Android app writes steps, distance, sleep, active zone minutes, exercise, and calories to Health Connect.",
        de: "Die Fitbit-Android-App schreibt Schritte, Distanz, Schlaf, Aktivzonenminuten, Training und Kalorien in Health Connect.",
        fr: "L'application Fitbit Android écrit pas, distance, sommeil, minutes en zone active, exercices et calories dans Health Connect.",
      },
    },
    evidence: {
      level: "vendor_documented",
      label: EVIDENCE_LABELS.vendor_documented,
      details: {
        it: "Percorso documentato ufficialmente da Google/Fitbit e verificato nel codice di lettura Health Connect della release FitMesh 3.10.0+191.",
        en: "Route officially documented by Google/Fitbit and verified in the Health Connect reader code of FitMesh release 3.10.0+191.",
        de: "Offiziell von Google/Fitbit dokumentierter Pfad, verifiziert im Health Connect-Code des FitMesh-Releases 3.10.0+191.",
        fr: "Parcours officiellement documenté par Google/Fitbit et vérifié dans le code Health Connect de FitMesh 3.10.0+191.",
      },
    },
    guideHref: "/lp/fitbit-daten-exportieren-google",
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
        it: "L'app Google Health (Fitbit) per iOS memorizza e mostra le metriche sul profilo utente Google associato.",
        en: "The Google Health (Fitbit) iOS app stores and displays metrics on the linked Google profile.",
        de: "Die Google Health (Fitbit) iOS-App speichert und zeigt Messwerte im verknüpften Google-Konto an.",
        fr: "L'application Google Health (Fitbit) pour iOS enregistre et affiche les métriques sur le profil Google associé.",
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
        it: "Google Support: Condividere i dati Fitbit con Apple Health",
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
    guideHref: "/sync/fitbit",
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
    officialSources: [
      {
        title: {
          it: "Samsung Support: Sincronizzazione Samsung Health e Health Connect",
          en: "Samsung Support: Syncing Samsung Health with Health Connect",
          de: "Samsung Support: Synchronisierung von Samsung Health mit Health Connect",
          fr: "Support Samsung : Synchronisation Samsung Health et Health Connect",
        },
        url: "https://www.samsung.com/us/support/answer/ANS00091380/",
        verifiedDate: "2026-09-14",
        supportedClaim: {
          it: "Samsung Health supporta la scrittura in Health Connect di passi, sonno, battito cardiaco, calorie e attività.",
          en: "Samsung Health supports writing steps, sleep, heart rate, calories, and activities to Health Connect.",
          de: "Samsung Health unterstützt das Schreiben von Schritten, Schlaf, Puls, Kalorien und Aktivitäten in Health Connect.",
          fr: "Samsung Health prend en charge l'écriture des pas, du sommeil, du pouls, des calories et des activités dans Health Connect.",
        },
      },
      {
        title: {
          it: "Samsung Developers: Panoramica Samsung Health Data SDK",
          en: "Samsung Developers: Samsung Health Data SDK Overview",
          de: "Samsung Developers: Samsung Health Data SDK Übersicht",
          fr: "Samsung Developers : Présentation du Samsung Health Data SDK",
        },
        url: "https://developer.samsung.com/health/data/overview.html",
        verifiedDate: "2026-09-14",
        supportedClaim: {
          it: "Accesso diretto alle metriche sanitarie tramite SDK nativo su smartphone Samsung Galaxy per applicazioni autorizzate.",
          en: "Direct access to health metrics via native SDK on Samsung Galaxy smartphones for authorized partner applications.",
          de: "Direkter Zugriff auf Gesundheitsdaten über natives SDK auf Samsung Galaxy-Smartphones für autorisierte Anwendungen.",
          fr: "Accès direct aux données de santé via SDK natif sur smartphones Samsung Galaxy pour applications autorisées.",
        },
      },
    ],
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
    guideHref: "/sync/galaxy-watch",
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
        it: "L'app Google Pixel Watch gestisce l'hardware, mentre l'app Fitbit su Android raccoglie ed elabora le metriche sanitarie.",
        en: "The Google Pixel Watch app manages device hardware, while the Fitbit app on Android collects and analyzes health metrics.",
        de: "Die Google Pixel Watch App verwaltet die Hardware, während die Fitbit-App auf Android die Gesundheitsdaten sammelt.",
        fr: "L'application Google Pixel Watch gère la montre, tandis que l'application Fitbit sur Android traite les données de santé.",
      },
      stepC: {
        it: "L'app Fitbit su Pixel Watch è nativamente integrata con Health Connect ed esporta passi, frequenza cardiaca, calorie, sonno con stadi e sessioni di allenamento.",
        en: "The Fitbit app on Pixel Watch is natively integrated with Health Connect and exports steps, heart rate, calories, sleep with stages, and workouts.",
        de: "Die Fitbit-App auf der Pixel Watch ist nativ mit Health Connect integriert und exportiert Schritte, Puls, Kalorien, Schlaf mit Phasen und Workouts.",
        fr: "L'application Fitbit sur Pixel Watch est nativement intégrée à Health Connect et exporte pas, fréquence cardiaque, calories, sommeil et entraînements.",
      },
      stepD: {
        it: "FitMesh Android (release 3.10.0+191) interroga Health Connect e rende disponibili i dati senza vincolo di abbonamento a Fitbit Premium.",
        en: "FitMesh Android (release 3.10.0+191) queries Health Connect and presents data without requiring a Fitbit Premium subscription.",
        de: "FitMesh Android (Release 3.10.0+191) ruft Daten aus Health Connect ab und stellt sie ohne Pflicht zu Fitbit Premium bereit.",
        fr: "FitMesh Android (version 3.10.0+191) lit Health Connect et affiche les données sans obligation d'abonnement Fitbit Premium.",
      },
    },
    metricsSummary: {
      it: "Passi, frequenza cardiaca continua, sonno con stadi, calorie attive, allenamenti",
      en: "Steps, continuous heart rate, sleep with stages, active calories, workouts",
      de: "Schritte, kontinuierlicher Puls, Schlafphasen, Aktivitätskalorien, Workouts",
      fr: "Pas, fréquence cardiaque continue, sommeil avec phases, calories actives, entraînements",
    },
    requirements: {
      it: "Smartphone Android compatibile con Google Pixel Watch; sincronizzazione con Health Connect abilitata nell'app Fitbit.",
      en: "Android smartphone compatible with Google Pixel Watch; Health Connect sync enabled in the Fitbit app.",
      de: "Mit der Google Pixel Watch kompatibles Android-Smartphone; aktivierte Health Connect-Synchronisierung in der Fitbit-App.",
      fr: "Smartphone Android compatible avec Google Pixel Watch ; synchronisation Health Connect activée dans Fitbit.",
    },
    limitations: {
      it: "Disponibile solo su Android. Questo percorso si applica specificamente a Pixel Watch e non va assimilato genericamente a tutti gli smartwatch Wear OS di altri produttori.",
      en: "Available on Android only. This path applies specifically to Pixel Watch and is not generically aggregated with other Wear OS watches.",
      de: "Nur auf Android verfügbar. Dieser Pfad gilt spezifisch für die Pixel Watch und ist nicht mit allen Wear OS-Uhren anderer Hersteller gleichzusetzen.",
      fr: "Disponible uniquement sur Android. Ce parcours s'applique spécifiquement à la Pixel Watch et ne doit pas être confondu avec les autres montres Wear OS.",
    },
    officialSource: {
      title: {
        it: "Google Support: Configurare e sincronizzare Google Pixel Watch con Fitbit",
        en: "Google Support: Set up and sync Google Pixel Watch with Fitbit",
        de: "Google Support: Google Pixel Watch mit Fitbit einrichten und synchronisieren",
        fr: "Support Google : Configurer et synchroniser la Google Pixel Watch avec Fitbit",
      },
      url: "https://support.google.com/googlepixelwatch/answer/12759285",
      verifiedDate: "2026-09-14",
      supportedClaim: {
        it: "Pixel Watch sincronizza i dati dei sensori con l'app Fitbit, che a sua volta li esporta verso Health Connect.",
        en: "Pixel Watch syncs sensor data to the Fitbit app, which in turn exports it to Health Connect.",
        de: "Die Pixel Watch synchronisiert Sensordaten mit der Fitbit-App, die sie wiederum an Health Connect exportiert.",
        fr: "La Pixel Watch synchronise les données avec l'application Fitbit, qui les exporte ensuite vers Health Connect.",
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
    guideHref: "/sync/pixel-watch",
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
        it: "L'app Oura supporta l'esportazione verso Health Connect: passi, sonno (durata e stadi), frequenza cardiaca a riposo, frequenza cardiaca, HRV e calorie attive.",
        en: "The Oura app supports export to Health Connect: steps, sleep (duration and stages), resting heart rate, heart rate, HRV, and active calories.",
        de: "Die Oura-App unterstützt den Export an Health Connect: Schritte, Schlaf (Dauer und Phasen), Ruhepuls, Herzfrequenz, HRV und Aktivitätskalorien.",
        fr: "L'application Oura prend en charge l'export vers Health Connect : pas, sommeil (durée et phases), pouls au repos, fréquence cardiaque, VFC et calories actives.",
      },
      stepD: {
        it: "FitMesh Android (release 3.10.0+191) legge da Health Connect le metriche esportate da Oura. Nessuna API Oura diretta live viene interrogata.",
        en: "FitMesh Android (release 3.10.0+191) reads the metrics exported by Oura from Health Connect. No direct live Oura API is queried.",
        de: "FitMesh Android (Release 3.10.0+191) liest die von Oura exportierten Metriken aus Health Connect aus. Es wird keine direkte Oura-Live-API abgefragt.",
        fr: "FitMesh Android (version 3.10.0+191) lit depuis Health Connect les métriques exportées par Oura. Aucune API directe Oura n'est interrogée en direct.",
      },
    },
    metricsSummary: {
      it: "Passi, durata e stadi del sonno, frequenza a riposo, frequenza cardiaca, calorie attive",
      en: "Steps, sleep duration & stages, resting heart rate, heart rate, active calories",
      de: "Schritte, Schlafdauer & Phasen, Ruhepuls, Herzfrequenz, Aktivitätskalorien",
      fr: "Pas, durée et phases de sommeil, fréquence au repos, rythme cardiaque, calories actives",
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
        it: "L'app Oura esporta passi, stadi del sonno, frequenza cardiaca a riposo, frequenza cardiaca e calorie verso Health Connect su Android.",
        en: "Oura App exports steps, sleep stages, resting heart rate, heart rate, and calories to Health Connect on Android.",
        de: "Die Oura-App exportiert Schritte, Schlafphasen, Ruhepuls, Puls und Kalorien an Health Connect auf Android.",
        fr: "L'application Oura exporte pas, phases de sommeil, pouls au repos, rythme cardiaque et calories vers Health Connect sur Android.",
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
    guideHref: "/sync/oura",
  },

  // ── 8. Colmi Smart Ring su Android ────────────────────────────────────
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
      it: "Lettura BLE diretta (senza app terza)",
      en: "Direct BLE Read (no third-party app)",
      de: "Direktes BLE-Lesen (ohne Drittanbieter-App)",
      fr: "Lecture BLE directe (sans application tierce)",
    },
    steps: {
      stepA: {
        it: "Hardware Colmi testato (modelli R02, R06, R09): misurazione di passi in bucket da 15 minuti, frequenza cardiaca periodica e monitoraggio del sonno con stadi. Sensore di temperatura cutanea presente specificamente su R02 e R09 (non universale per tutti i modelli del brand).",
        en: "Tested Colmi hardware (R02, R06, R09 models): measurement of steps in 15-minute buckets, periodic heart rate, and sleep monitoring with stages. Skin temperature sensor present specifically on R02 & R09 (not universal across all brand models).",
        de: "Getestete Colmi-Hardware (Modelle R02, R06, R09): Erfassung von Schritten in 15-Minuten-Buckets, periodischem Puls und Schlaf mit Phasen. Hauttemperatursensor spezifisch bei R02 und R09 vorhanden.",
        fr: "Matériel Colmi testé (modèles R02, R06, R09) : mesure des pas par tranches de 15 minutes, pouls périodique et sommeil avec phases. Capteur de température cutanée spécifique aux modèles R02 et R09.",
      },
      stepB: {
        it: "Nessuna app terza del produttore (es. QRing) è necessaria né utilizzata. L'anello si connette direttamente all'applicazione FitMesh.",
        en: "No third-party manufacturer app (such as QRing) is required or used. The ring connects directly to the FitMesh app.",
        de: "Keine Drittanbieter-App des Herstellers (wie QRing) erforderlich oder genutzt. Der Ring verbindet sich direkt mit der FitMesh-App.",
        fr: "Aucune application tierce du fabricant (comme QRing) n'est nécessaire. La bague se connecte directement à FitMesh.",
      },
      stepC: {
        it: "Il trasferimento dati avviene tramite protocollo Bluetooth Low Energy (BLE) direttamente tra il controller radio dell'anello e l'applicazione FitMesh.",
        en: "Data transfer occurs via Bluetooth Low Energy (BLE) protocol directly between the ring radio controller and the FitMesh app.",
        de: "Die Datenübertragung erfolgt über das Bluetooth Low Energy (BLE)-Protokoll direkt zwischen Ring-Controller und FitMesh-App.",
        fr: "Le transfert de données s'effectue via le protocole Bluetooth Low Energy (BLE) directement entre la bague et l'application FitMesh.",
      },
      stepD: {
        it: "FitMesh Android (release 3.10.0+191) scarica i bucket temporali nativi dall'anello via BLE, applica la pipeline di decodifica e salva le metriche nel cloud per la dashboard web.",
        en: "FitMesh Android (release 3.10.0+191) downloads native temporal buckets from the ring via BLE, applies the decoding pipeline, and saves metrics to cloud dashboard.",
        de: "FitMesh Android (Release 3.10.0+191) lädt native Zeit-Buckets über BLE herunter, führt die Dekodierung aus und speichert die Werte für das Cloud-Dashboard.",
        fr: "FitMesh Android (version 3.10.0+191) télécharge les tranches temporelles via BLE, applique le décodage et enregistre les données pour le tableau de bord.",
      },
    },
    metricsSummary: {
      it: "Passi (bucket 15 min), frequenza cardiaca, sonno con stadi, temperatura cutanea (R02/R09), stato batteria",
      en: "Steps (15-min buckets), heart rate, sleep with stages, skin temperature (R02/R09), battery status",
      de: "Schritte (15-Min.-Buckets), Puls, Schlaf mit Phasen, Hauttemperatur (R02/R09), Batteriestand",
      fr: "Pas (tranches 15 min), fréquence cardiaque, sommeil avec phases, température cutanée (R02/R09), batterie",
    },
    requirements: {
      it: "Smartphone Android con Bluetooth abilitato; anello Colmi carico e posizionato a portata radio durante il sync.",
      en: "Android smartphone with Bluetooth enabled; Colmi ring charged and within wireless range during sync.",
      de: "Android-Smartphone mit aktiviertem Bluetooth; geladener Colmi-Ring in Funkreichweite während der Synchronisierung.",
      fr: "Smartphone Android avec Bluetooth activé ; bague Colmi chargée et à portée radio pendant la synchronisation.",
    },
    limitations: {
      it: "La sincronizzazione richiede la vicinanza fisica dell'anello durante il ciclo di lettura manuale o in background. Modelli non testati (es. cloni generici) potrebbero non implementare lo stesso profilo GATT.",
      en: "Synchronization requires physical proximity of the ring during manual or background sync cycles. Untested models (e.g. generic clones) may not implement the same GATT profile.",
      de: "Die Synchronisierung erfordert die physische Nähe des Rings während des Abgleichs. Nicht getestete Klone implementieren möglicherweise ein abweichendes GATT-Profil.",
      fr: "La synchronisation requiert la proximité physique de la bague pendant le cycle de lecture. Les modèles non testés peuvent ne pas disposer du même profil GATT.",
    },
    officialSource: {
      title: {
        it: "Specifiche protocollo GATT BLE e driver nativo Colmi FitMesh",
        en: "FitMesh Colmi Native BLE GATT Protocol & Driver Specification",
        de: "Spezifikation des nativen FitMesh Colmi BLE-GATT-Protokolls & Treibers",
        fr: "Spécifications du protocole BLE GATT et pilote natif Colmi FitMesh",
      },
      url: "https://www.fitmesh.fit/it/sync/colmi-ring",
      verifiedDate: "2026-09-14",
      supportedClaim: {
        it: "Driver BLE nativo integrato in FitMesh con lettura diretta di bucket a 15 minuti, battito, sonno e temperatura senza cloud terzi.",
        en: "Native BLE driver built into FitMesh reading direct 15-minute buckets, heart rate, sleep, and temperature without third-party clouds.",
        de: "Nativer, in FitMesh integrierter BLE-Treiber zum direkten Auslesen von 15-Minuten-Buckets, Puls, Schlaf und Temperatur ohne Drittanbieter-Cloud.",
        fr: "Pilote BLE natif intégré à FitMesh lisant directement les tranches de 15 minutes, le pouls, le sommeil et la température sans cloud tiers.",
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
    guideHref: "/sync/colmi-ring",
  },

  // ── 9. Colmi Smart Ring su iPhone (iOS) ────────────────────────────────
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
      it: "Lettura BLE diretta + Scrittura Apple Health opzionale",
      en: "Direct BLE Read + Optional Apple Health Write",
      de: "Direktes BLE-Lesen + optionales Apple Health Schreiben",
      fr: "Lecture BLE directe + Écriture Apple Santé optionnelle",
    },
    steps: {
      stepA: {
        it: "Hardware Colmi testato (modelli R02, R06, R09): misurazione di passi, frequenza cardiaca periodica e sonno con stadi. Sensore di temperatura cutanea presente sui modelli R02 e R09.",
        en: "Tested Colmi hardware (R02, R06, R09 models): measurement of steps, periodic heart rate, and sleep with stages. Skin temperature sensor present on R02 & R09 models.",
        de: "Getestete Colmi-Hardware (Modelle R02, R06, R09): Erfassung von Schritten, periodischem Puls und Schlaf mit Phasen. Hauttemperatursensor bei R02 und R09 vorhanden.",
        fr: "Matériel Colmi testé (modèles R02, R06, R09) : mesure des pas, du pouls périodique et du sommeil avec phases. Capteur de température sur modèles R02 et R09.",
      },
      stepB: {
        it: "Nessuna applicazione terza necessaria; FitMesh iOS comunica direttamente con l'anello tramite CoreBluetooth.",
        en: "No third-party application required; FitMesh iOS communicates directly with the ring via CoreBluetooth.",
        de: "Keine Drittanbieter-App erforderlich; FitMesh iOS kommuniziert direkt mit dem Ring über CoreBluetooth.",
        fr: "Aucune application tierce requise ; FitMesh iOS communique directement avec la bague via CoreBluetooth.",
      },
      stepC: {
        it: "Connessione BLE gestita da CoreBluetooth tra l'anello e l'iPhone.",
        en: "BLE connection managed via CoreBluetooth between the ring and iPhone.",
        de: "BLE-Verbindung über CoreBluetooth zwischen Ring und iPhone.",
        fr: "Connexion BLE gérée par CoreBluetooth entre la bague et l'iPhone.",
      },
      stepD: {
        it: "FitMesh iOS (release 3.10.0+191) scarica i dati per la dashboard e, se abilitato dall'utente nelle Impostazioni, scrive in Apple Health (HealthKit) sonno con stadi, passi e frequenza a riposo.",
        en: "FitMesh iOS (release 3.10.0+191) downloads data for dashboard and, if enabled by user in Settings, writes sleep with stages, steps, and resting HR into Apple Health (HealthKit).",
        de: "FitMesh iOS (Release 3.10.0+191) lädt Daten für das Dashboard und schreibt bei Nutzeraktivierung Schlaf mit Phasen, Schritte und Ruhepuls in Apple Health.",
        fr: "FitMesh iOS (version 3.10.0+191) télécharge les données et, si activé dans les Paramètres, écrit le sommeil avec phases, les pas et le repos dans Apple Santé.",
      },
    },
    metricsSummary: {
      it: "Passi, frequenza cardiaca, sonno con stadi, temperatura cutanea (R02/R09); write-back opzionale su Apple Health",
      en: "Steps, heart rate, sleep with stages, skin temperature (R02/R09); optional Apple Health write-back",
      de: "Schritte, Puls, Schlaf mit Phasen, Hauttemperatur (R02/R09); optionales Apple Health Write-Back",
      fr: "Pas, pouls, sommeil avec phases, température cutanée (R02/R09) ; écriture optionnelle dans Apple Santé",
    },
    requirements: {
      it: "iPhone con Bluetooth attivo; anello Colmi carico; per la scrittura su Apple Salute è richiesta l'attivazione nelle impostazioni dell'app.",
      en: "iPhone with Bluetooth enabled; Colmi ring charged; writing to Apple Health requires toggle enablement in app settings.",
      de: "iPhone mit aktivem Bluetooth; geladener Colmi-Ring; das Schreiben in Apple Health erfordert die Aktivierung in den App-Einstellungen.",
      fr: "iPhone avec Bluetooth activé ; bague Colmi chargée ; l'écriture dans Apple Santé requiert l'activation dans les paramètres.",
    },
    limitations: {
      it: "Il write-back verso Apple Health è opzionale (disattivato di default). La sincronizzazione richiede la vicinanza dell'anello all'iPhone.",
      en: "Write-back to Apple Health is opt-in (disabled by default). Synchronization requires proximity of the ring to the iPhone.",
      de: "Das Schreiben in Apple Health ist optional (standardmäßig deaktiviert). Die Synchronisierung erfordert Nähe zum iPhone.",
      fr: "L'écriture dans Apple Santé est optionnelle (désactivée par défaut). La synchronisation requiert la proximité de la bague.",
    },
    officialSource: {
      title: {
        it: "Documentazione FitMesh iOS: Supporto anelli smart e ponte HealthKit",
        en: "FitMesh iOS Documentation: Smart Ring Support & HealthKit Bridge",
        de: "FitMesh iOS Dokumentation: Smart Ring Unterstützung & HealthKit Brücke",
        fr: "Documentation FitMesh iOS : Support des bagues et pont HealthKit",
      },
      url: "https://www.fitmesh.fit/it/sync/colmi-ring",
      verifiedDate: "2026-09-14",
      supportedClaim: {
        it: "Lettura BLE diretta da anelli Colmi R02/R06/R09 e scrittura opzionale certificata verso Apple HealthKit.",
        en: "Direct BLE read from Colmi R02/R06/R09 rings and certified optional write-back to Apple HealthKit.",
        de: "Direktes BLE-Lesen von Colmi R02/R06/R09-Ringen und zertifiziertes optionales Schreiben an Apple HealthKit.",
        fr: "Lecture BLE directe des bagues Colmi R02/R06/R09 et écriture optionnelle certifiée vers Apple HealthKit.",
      },
    },
    evidence: {
      level: "device_tested",
      label: EVIDENCE_LABELS.device_tested,
      details: {
        it: "Testato e verificato su iPhone reale con anelli Colmi R02, R06 e R09 nel codice della release FitMesh 3.10.0+191.",
        en: "Tested and verified on physical iPhone with Colmi R02, R06, and R09 rings in FitMesh 3.10.0+191 release code.",
        de: "Getestet und verifiziert auf physischem iPhone mit Colmi R02, R06 und R09 Ringen im Code des FitMesh-Releases 3.10.0+191.",
        fr: "Testé et vérifié sur iPhone physique avec bagues Colmi R02, R06 et R09 dans le code de FitMesh 3.10.0+191.",
      },
    },
    guideHref: "/sync/colmi-ring",
  },
];

export interface UnverifiedPathInfo {
  phoneOs: PhoneOs;
  deviceFamily: DeviceFamily;
  title: Record<SupportedMatrixLocale, string>;
  description: Record<SupportedMatrixLocale, string>;
  helpHref: string;
}

export const UNVERIFIED_COMBINATIONS_MAP: Record<string, UnverifiedPathInfo> = {
  "galaxy-watch-ios": {
    phoneOs: "ios",
    deviceFamily: "galaxy-watch",
    title: {
      it: "Galaxy Watch su iPhone: Percorso non verificato in questa prima matrice",
      en: "Galaxy Watch on iPhone: Route not verified in this initial matrix",
      de: "Galaxy Watch auf dem iPhone: In dieser ersten Matrix nicht verifizierter Pfad",
      fr: "Galaxy Watch sur iPhone : Parcours non vérifié dans cette première matrice",
    },
    description: {
      it: "I modelli recenti Galaxy Watch basati su Wear OS non supportano ufficialmente l'abbinamento con iPhone. Non presentiamo questa combinazione come supportata.",
      en: "Recent Wear OS-based Galaxy Watch models do not officially support pairing with iPhone. We do not present this combination as supported.",
      de: "Neuere Wear OS-basierte Galaxy Watch Modelle unterstützen offiziell keine Kopplung mit dem iPhone. Wir führen diese Kombination nicht als unterstützt.",
      fr: "Les modèles récents de Galaxy Watch sous Wear OS ne prennent pas officiellement en charge le jumelage avec iPhone.",
    },
    helpHref: "/sync/galaxy-watch",
  },
  "pixel-watch-ios": {
    phoneOs: "ios",
    deviceFamily: "pixel-watch",
    title: {
      it: "Pixel Watch su iPhone: Percorso non verificato in questa prima matrice",
      en: "Pixel Watch on iPhone: Route not verified in this initial matrix",
      de: "Pixel Watch auf dem iPhone: In dieser ersten Matrix nicht verifizierter Pfad",
      fr: "Pixel Watch sur iPhone : Parcours non vérifié dans cette première matrice",
    },
    description: {
      it: "Google Pixel Watch richiede uno smartphone Android e non supporta l'abbinamento a iOS. Non è pertanto disponibile una sincronizzazione con FitMesh iOS.",
      en: "Google Pixel Watch requires an Android smartphone and does not support pairing with iOS. Sychronization with FitMesh iOS is therefore unavailable.",
      de: "Die Google Pixel Watch erfordert ein Android-Smartphone und unterstützt keine Kopplung mit iOS.",
      fr: "La Google Pixel Watch nécessite un smartphone Android et n'est pas compatible avec iOS.",
    },
    helpHref: "/sync/pixel-watch",
  },
  "oura-ring-ios": {
    phoneOs: "ios",
    deviceFamily: "oura-ring",
    title: {
      it: "Oura Ring su iPhone: Percorso non verificato in questa prima matrice",
      en: "Oura Ring on iPhone: Route not verified in this initial matrix",
      de: "Oura Ring auf dem iPhone: In dieser ersten Matrix nicht verifizierter Pfad",
      fr: "Bague Oura sur iPhone : Parcours non vérifié dans cette première matrice",
    },
    description: {
      it: "Questa prima release della matrice documenta il percorso Health Connect su Android. Il percorso Oura su iOS via Apple Health sarà verificato e censito in una fase successiva.",
      en: "This initial matrix release documents the Health Connect path on Android. The Oura iOS route via Apple Health will be verified and mapped in a subsequent release.",
      de: "Diese erste Version der Matrix dokumentiert den Health Connect-Pfad unter Android. Der Oura-Pfad unter iOS über Apple Health wird später verifiziert.",
      fr: "Cette première version de la matrice documente le parcours Health Connect sous Android. Le parcours Oura sous iOS via Apple Santé sera vérifié ultérieurement.",
    },
    helpHref: "/sync/oura",
  },
};
