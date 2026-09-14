export type SupportedMatrixLocale = "it" | "en" | "de" | "fr";

export interface GlossaryTerm {
  id: string;
  term: Record<SupportedMatrixLocale, string>;
  definition: Record<SupportedMatrixLocale, string>;
}

export const ESSENTIAL_GLOSSARY: readonly GlossaryTerm[] = [
  {
    id: "synchronization",
    term: {
      it: "Sincronizzazione",
      en: "Synchronization",
      de: "Synchronisation",
      fr: "Synchronisation",
    },
    definition: {
      it: "Il processo di allineamento e trasferimento periodico dei dati tra il dispositivo indossabile, l'app dello smartphone e il server cloud di FitMesh per l'aggiornamento della dashboard.",
      en: "The process of periodically aligning and transferring data between your wearable, smartphone app, and the FitMesh cloud server to update your dashboard.",
      de: "Der Prozess des regelmäßigen Abgleichs und der Übertragung von Daten zwischen Wearable, Smartphone-App und dem FitMesh-Cloud-Server zur Aktualisierung des Dashboards.",
      fr: "Le processus d'alignement et de transfert périodique des données entre votre appareil connecté, l'application mobile et le serveur cloud FitMesh pour mettre à jour votre tableau de bord.",
    },
  },
  {
    id: "export",
    term: {
      it: "Esportazione",
      en: "Export",
      de: "Export",
      fr: "Exportation",
    },
    definition: {
      it: "L'invio attivo o il salvataggio dei propri dati di salute da un'applicazione verso un'altra piattaforma o in formati aperti (come file CSV o JSON) per l'archiviazione personale.",
      en: "Actively sending or saving your health data from one application to another platform or in open formats (such as CSV or JSON files) for personal archival.",
      de: "Das aktive Senden oder Speichern von Gesundheitsdaten aus einer Anwendung an eine andere Plattform oder in offenen Formaten (wie CSV- oder JSON-Dateien) zur persönlichen Archivierung.",
      fr: "L'envoi actif ou l'enregistrement de vos données de santé depuis une application vers une autre plateforme ou dans des formats ouverts (tels que des fichiers CSV ou JSON) pour archivage personnel.",
    },
  },
  {
    id: "data-source",
    term: {
      it: "Sorgente del dato",
      en: "Data source",
      de: "Datenquelle",
      fr: "Source des données",
    },
    definition: {
      it: "Il dispositivo hardware o l'applicazione originale (ad esempio Garmin Connect, Samsung Health o i sensori di un anello) che ha registrato per prima la misurazione sul campo.",
      en: "The hardware device or original application (such as Garmin Connect, Samsung Health, or smart ring sensors) that first recorded the measurement.",
      de: "Das physische Gerät oder die ursprüngliche Anwendung (etwa Garmin Connect, Samsung Health oder die Sensoren eines Smart Rings), die den Messwert zuerst erfasst hat.",
      fr: "L'appareil matériel ou l'application d'origine (comme Garmin Connect, Samsung Health ou les capteurs d'une bague connectée) qui a initialement enregistré la mesure.",
    },
  },
  {
    id: "measured-vs-derived",
    term: {
      it: "Dato misurato e dato derivato",
      en: "Measured vs. derived data",
      de: "Gemessene vs. abgeleitete Daten",
      fr: "Donnée mesurée et donnée dérivée",
    },
    definition: {
      it: "Un dato misurato è rilevato direttamente da un sensore fisico (come battito cardiaco o temperatura). Un dato derivato è calcolato tramite algoritmi software (come calorie attive stimate, fasi del sonno o Body Battery).",
      en: "Measured data is recorded directly by physical sensors (such as heart rate or temperature). Derived data is calculated through software algorithms (such as estimated active calories, sleep stages, or Body Battery).",
      de: "Gemessene Daten werden direkt von physischen Sensoren erfasst (wie Puls oder Temperatur). Abgeleitete Daten werden durch Software-Algorithmen berechnet (wie geschätzte Aktivitätskalorien, Schlafphasen oder Body Battery).",
      fr: "Une donnée mesurée est captée directement par un capteur physique (comme la fréquence cardiaque ou la température). Une donnée dérivée est calculée par des algorithmes logiciels (comme l'estimation des calories actives, les phases de sommeil ou Body Battery).",
    },
  },
  {
    id: "health-connect",
    term: {
      it: "Health Connect",
      en: "Health Connect",
      de: "Health Connect",
      fr: "Health Connect",
    },
    definition: {
      it: "La piattaforma di sistema creata da Google per Android che consente alle app di fitness di condividere dati direttamente sul dispositivo con il consenso dell'utente, senza dipendere da API cloud esterne.",
      en: "Google's on-device platform for Android that allows fitness apps to share data locally with explicit user permission, without relying on external cloud APIs.",
      de: "Googles systemeigene Android-Plattform, über die Fitness- und Gesundheits-Apps Daten direkt auf dem Gerät mit Einwilligung des Nutzers sicher austauschen können.",
      fr: "La plateforme système développée par Google pour Android permettant aux applications de santé et de fitness de partager des données localement avec l'accord de l'utilisateur, sans dépendre d'API cloud externes.",
    },
  },
  {
    id: "apple-health-healthkit",
    term: {
      it: "Apple Health e HealthKit",
      en: "Apple Health & HealthKit",
      de: "Apple Health & HealthKit",
      fr: "Apple Health & HealthKit",
    },
    definition: {
      it: "L'architettura di Apple su iPhone: HealthKit è il framework di sistema che gestisce l'archiviazione protetta dei dati sul dispositivo; Apple Salute è l'app predefinita che ne permette la visualizzazione.",
      en: "Apple's health architecture on iPhone: HealthKit is the central system framework that manages secure on-device storage; Apple Health is the default app that displays the data.",
      de: "Apples Gesundheits-Architektur auf dem iPhone: HealthKit ist das zentrale System-Framework zur sicheren Speicherung auf dem Gerät; Apple Health ist die Standard-App zur Anzeige.",
      fr: "L'architecture de santé d'Apple sur iPhone : HealthKit est le framework système qui gère le stockage sécurisé sur l'appareil ; Apple Santé est l'application par défaut qui permet de consulter les données.",
    },
  },
  {
    id: "read-vs-write",
    term: {
      it: "Lettura e scrittura",
      en: "Reading and writing",
      de: "Lesen und Schreiben",
      fr: "Lecture et écriture",
    },
    definition: {
      it: "La lettura indica l'accesso e la visualizzazione da parte di FitMesh dei dati registrati da altre fonti. La scrittura (write-back) indica il salvataggio attivo di nuove metriche da FitMesh verso Health Connect o Apple Health.",
      en: "Reading indicates FitMesh accessing and displaying data recorded by other sources. Writing (write-back) indicates FitMesh actively saving new health metrics into Health Connect or Apple Health.",
      de: "Lesen beschreibt den Zugriff und die Anzeige von Daten in FitMesh, die von anderen Quellen erfasst wurden. Schreiben (Write-Back) beschreibt die aktive Speicherung neuer Metriken von FitMesh in Health Connect oder Apple Health.",
      fr: "La lecture indique la consultation et l'affichage par FitMesh des données enregistrées par d'autres sources. L'écriture (write-back) indique l'enregistrement actif de nouvelles métriques par FitMesh vers Health Connect ou Apple Health.",
    },
  },
];
