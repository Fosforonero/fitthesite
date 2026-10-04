import type { BlogPost } from "../types";
import {
  featureStatusSentence,
  isFeatureAvailable,
  meshStatusSentenceRenderable,
} from "@/lib/feature-status";

type GuideLocale = "it" | "en" | "de" | "ja" | "fr";

/**
 * Stato di dashboard web e Mesh Famiglia: DERIVATO da lib/feature-status.ts
 * (che legge CAPABILITY_STATUS in lib/product-facts.ts). Nessuna frase di
 * stato scritta in questo post: si usano le frasi canoniche, nella lingua
 * della pagina. Una funzione che diventa disponibile esce dal testo da sola;
 * la frase Mesh si omette dove non e' renderizzabile (ja: revisione di
 * agenti, feature-status.ts meshStatusSentenceRenderable).
 */
function statoFunzioniNonDisponibili(lc: GuideLocale): string {
  const frasi: string[] = [];
  if (!isFeatureAvailable("webDashboard")) {
    frasi.push(featureStatusSentence("webDashboard", lc));
  }
  if (!isFeatureAvailable("familyMesh") && meshStatusSentenceRenderable(lc)) {
    frasi.push(featureStatusSentence("familyMesh", lc));
  }
  return frasi.join(" ");
}

/** Dove si consulta quanto descritto: solo l'app mobile. */
const DOVE_SI_CONSULTA: Record<GuideLocale, string> = {
  it: "Quanto descritto in questa guida si consulta nell'app FitMesh per iPhone e Android.",
  en: "What this guide describes is viewed in the FitMesh app for iPhone and Android.",
  de: "Was diese Anleitung beschreibt, sehen Sie in der FitMesh-App für iPhone und Android.",
  ja: "本ガイドで説明している内容は、iPhoneおよびAndroid向けのFitMeshアプリで確認できます。",
  fr: "Ce que décrit ce guide se consulte dans l'application FitMesh pour iPhone et Android.",
};

function statoEDoveSiConsulta(lc: GuideLocale): string {
  return [statoFunzioniNonDisponibili(lc), DOVE_SI_CONSULTA[lc]].filter(Boolean).join(" ");
}

/**
 * Guida operativa multi-dispositivo per atleti e utenti multi-wearable.
 *
 * Mostra l'integrazione di Apple Watch, Garmin e Polar nello stesso account FitMesh,
 * con visualizzazione su iPhone e telefono aziendale Android (Samsung Galaxy).
 * Scenario illustrativo. Fatti di prodotto riletti nel codice app al tag
 * v3.10.0+191 (9e5e80d3) il 02/10/2026; nessuna prova su dispositivo.
 *
 * Provenienza delle lingue (TRANSLATIONS «Declaring the source»):
 * - lingua di partenza: it (fonte);
 * - en, de, ja, fr: derivati dall'it di questo file, stessa revisione git;
 * - controllo applicato: revisione di AGENTE, non madrelingua (TRANSLATIONS 6:
 *   nessuna firma nominata registrata);
 * - frasi di stato di dashboard web e Mesh: non sono di questo post, arrivano
 *   da lib/feature-status.ts con la provenienza registrata li'.
 */
export const post: BlogPost = {
  slug: "fitmesh-ultratleta-apple-watch-garmin-polar",
  category: "guides",
  publishedAt: "2026-10-01",
  updatedAt: "2026-10-01",
  readMinutes: 12,
  primaryKeyword: {
    it: "Apple Watch Garmin Polar insieme",
    en: "use Apple Watch Garmin and Polar together",
    de: "Apple Watch Garmin und Polar zusammen nutzen",
    ja: "Apple Watch Garmin Polar 併用",
    fr: "utiliser Apple Watch Garmin et Polar ensemble",
  },
  secondaryKeywords: {
    it: [
      "sincronizzare più smartwatch",
      "Apple Watch e Garmin stesso account",
      "FitMesh guida multi dispositivo",
      "Polar Flow e Apple Salute",
      "Garmin Connect e Health Connect",
    ],
    en: [
      "sync multiple smartwatches",
      "Apple Watch and Garmin same account",
      "FitMesh multi device guide",
      "Polar Flow Apple Health",
      "Garmin Connect Health Connect",
    ],
    de: [
      "mehrere Smartwatches synchronisieren",
      "Apple Watch und Garmin gleicher Account",
      "FitMesh Multi Device Anleitung",
      "Polar Flow Apple Health",
      "Garmin Connect Health Connect",
    ],
    ja: [
      "複数スマートウォッチ同期",
      "Apple Watch Garmin 同一アカウント",
      "FitMesh マルチデバイス",
      "Polar Flow Appleヘルスケア",
      "Garmin Connect ヘルスコネクト",
    ],
    fr: [
      "synchroniser plusieurs montres connectees",
      "Apple Watch et Garmin meme compte",
      "guide multi appareils FitMesh",
      "Polar Flow et Apple Sante",
      "Garmin Connect et Health Connect",
    ],
  },
  metaDescription: {
    it: "Come usare insieme Apple Watch per la routine quotidiana, Garmin o Polar per l'allenamento e due telefoni diversi con un unico account FitMesh.",
    en: "How to use Apple Watch for daily routines, Garmin or Polar for training, and two different phones with a single FitMesh account.",
    de: "So nutzen Sie Apple Watch für den Alltag, Garmin oder Polar fürs Training und zwei Smartphones mit einem einzigen FitMesh-Konto.",
    ja: "日常用のApple Watch、トレーニング用のGarminやPolar、そして2台のスマートフォンを1つのFitMeshアカウントで併用する方法。",
    fr: "Comment utiliser une Apple Watch au quotidien, une montre Garmin ou Polar à l'entraînement et deux téléphones avec un seul compte FitMesh.",
  },
  coverAlt: {
    it: "Un'atleta prepara il gilet da corsa accanto a due telefoni e due orologi sportivi, con un lago e una bicicletta sullo sfondo.",
    en: "An athlete adjusts a running vest beside two phones and two sports watches, with a lake and a bicycle in the background.",
    de: "Eine Athletin bereitet ihre Laufweste neben zwei Smartphones und zwei Sportuhren vor, im Hintergrund ein See und ein Fahrrad.",
    ja: "2台のスマートフォンと2本のスポーツウォッチの横でランニングベストを整えるアスリート。背景には湖と自転車。",
    fr: "Une athlète ajuste son gilet de course près de deux téléphones et deux montres de sport, avec un lac et un vélo en arrière-plan.",
  },
  hero: {
    kicker: {
      it: "Guida operativa multi-dispositivo",
      en: "Multi-device operational guide",
      de: "Multi-Device Praxisleitfaden",
      ja: "マルチデバイス実践ガイド",
      fr: "Guide pratique multi-appareils",
    },
    title: {
      it: "Apple Watch, Garmin e Polar: una giornata con FitMesh",
      en: "Apple Watch, Garmin and Polar: a Day with FitMesh",
      de: "Apple Watch, Garmin und Polar: Ein Tag mit FitMesh",
      ja: "Apple Watch、Garmin、Polar：FitMeshで過ごす1日",
      fr: "Apple Watch, Garmin et Polar : une journée avec FitMesh",
    },
    subtitle: {
      it: "La risposta rapida: non serve sostituire i dispositivi né accontentarsi di dati isolati. Registrando i diversi momenti della giornata con lo strumento più adatto, FitMesh riunisce le metriche nello stesso account e le rende consultabili sia su iPhone che su Android.",
      en: "The quick answer: you do not need to replace your devices or settle for siloed data. By capturing different parts of the day with the right tool, FitMesh unifies your metrics in one account, accessible across iPhone and Android.",
      de: "Die schnelle Antwort: Sie müssen weder Geräte ersetzen noch isolierte Daten akzeptieren. Erfassen Sie Tagesabschnitte mit dem passenden Werkzeug; FitMesh bündelt die Metriken in einem Konto auf iPhone und Android.",
      ja: "手短な答え：デバイスを買い替える必要も、分断されたデータに甘んじる必要もありません。時間帯や用途に応じた機器を使いながら、FitMeshが同一アカウント上で指標を統合し、iPhoneとAndroidの双方で確認できるようにします。",
      fr: "La réponse rapide : nul besoin de remplacer vos montres ni d'accepter des données cloisonnées. En enregistrant chaque moment avec l'outil adapté, FitMesh rassemble vos métriques sur un seul compte accessible sur iPhone et Android.",
    },
  },
  tldr: {
    it: [
      "Chi pratica sport di resistenza usa spesso strumenti diversi: Apple Watch per la vita quotidiana e il sonno, Garmin o Polar per uscite lunghe o gare, e un telefono Android aziendale durante il lavoro.",
      "Con lo stesso account FitMesh vedi gli stessi dati su più telefoni, una volta che sono stati sincronizzati.",
      "I tre piani dei dati restano distinti: consultazione aggregata nell'app FitMesh, scrittura opzionale nei framework di sistema (Apple Salute e Health Connect) e funzioni proprietarie che rimangono nelle app dei produttori.",
      "Le limitazioni tecniche sono trasparenti: FitMesh non esporta il sonno verso Apple Salute nella versione attuale, e Polar Flow non scrive la frequenza cardiaca continua 24/7 in Apple Salute.",
      statoEDoveSiConsulta("it"),
    ],
    en: [
      "Endurance athletes frequently rely on dedicated gear: Apple Watch for sleep and daily wear, Garmin or Polar for long runs or racing, and a company Android phone at work.",
      "With the same FitMesh account you see the same data on more than one phone, once that data has been synced.",
      "Three distinct data tiers are preserved: unified review in the FitMesh app, optional selective export to platform frameworks (Apple Health and Health Connect), and proprietary features that stay in vendor apps.",
      "Technical boundaries are clearly defined: FitMesh does not export sleep to Apple Health in this release, and Polar Flow does not write continuous 24/7 heart rate to Apple Health.",
      statoEDoveSiConsulta("en"),
    ],
    de: [
      "Ausdauersportler nutzen häufig spezialisierte Ausrüstung: Apple Watch für Schlaf und Alltag, Garmin oder Polar für lange Einheiten oder Wettkämpfe sowie ein geschäftliches Android-Smartphone im Beruf.",
      "Mit demselben FitMesh-Konto sehen Sie dieselben Daten auf mehreren Smartphones, sobald sie synchronisiert wurden.",
      "Drei Datenebenen bleiben getrennt: Einheitliche Übersicht in der FitMesh-App, optionaler selektiver Export in System-Frameworks (Apple Health und Health Connect) sowie herstellereigene Funktionen in Original-Apps.",
      "Technische Grenzen sind klar definiert: FitMesh exportiert in der aktuellen Version keinen Schlaf nach Apple Health, und Polar Flow überträgt keine kontinuierliche 24/7-Herzfrequenz nach Apple Health.",
      statoEDoveSiConsulta("de"),
    ],
    ja: [
      "エンデュランス競技を行うアスリートは、日常や睡眠管理にApple Watch、長距離走やレースにGarminやPolar、業務中に会社支給のAndroidスマートフォンといった複数の機器を使い分けることがよくあります。",
      "同じFitMeshアカウントを使えば、同期済みのデータを複数のスマートフォンで同じように確認できます。",
      "3つのデータ領域を明確に区別しています：FitMeshアプリ内での統合閲覧、OS標準フレームワーク（Appleヘルスケアやヘルスコネクト）への選択的な書き込み、そして各メーカー公式アプリに残る独自機能です。",
      "技術的な仕様も明確です：現行バージョンではFitMeshからAppleヘルスケアへの睡眠データ書き出しは行われず、Polar FlowからAppleヘルスケアへの書き込みも常時心拍数（24/7）には対応していません。",
      statoEDoveSiConsulta("ja"),
    ],
    fr: [
      "Les athlètes d'endurance utilisent souvent plusieurs équipements : une Apple Watch pour le sommeil et le quotidien, une Garmin ou une Polar pour les sorties longues ou la course, et un smartphone Android professionnel au travail.",
      "Avec le même compte FitMesh, vous voyez les mêmes données sur plusieurs téléphones, une fois qu'elles ont été synchronisées.",
      "Trois niveaux de données restent distincts : la consultation unifiée dans l'application FitMesh, l'écriture sélective optionnelle dans Apple Santé et Health Connect, et les fonctions propriétaires conservées dans les applications d'origine.",
      "Les limites techniques sont strictes : FitMesh n'exporte pas le sommeil vers Apple Santé dans cette version, et Polar Flow n'écrit pas la fréquence cardiaque continue 24/7 dans Apple Santé.",
      statoEDoveSiConsulta("fr"),
    ],
  },
  body: [
    {
      type: "callout",
      variant: "info",
      title: {
        it: "Scenario illustrativo e risposta diretta",
        en: "Illustrative scenario and direct answer",
        de: "Praxisszenario und direkte Antwort",
        ja: "実践シナリオと直接の回答",
        fr: "Scénario illustratif et réponse directe",
      },
      body: {
        it: "Questo articolo descrive uno scenario illustrativo per chi combina orologi di marchi diversi durante la giornata. Per unire le metriche e mantenere la continuità dei dati, installa FitMesh con lo stesso account su iPhone e sul secondo telefono Android. Apple Watch sincronizza la routine mattutina con Apple Salute; la sessione sportiva registrata con Garmin Connect o Polar Flow viene inoltrata al framework di sistema del rispettivo telefono; con lo stesso account, FitMesh mostra su entrambi i telefoni i dati già sincronizzati.",
        en: "This article describes an illustrative scenario for athletes combining watches from different brands across the day. To unify your metrics and maintain data continuity, install FitMesh using the same account on your iPhone and your second Android phone. Apple Watch syncs daily routines to Apple Health; workouts recorded in Garmin Connect or Polar Flow are forwarded to the respective phone's health framework; with the same account, FitMesh shows the already synced data on both phones.",
        de: "Dieser Artikel beschreibt ein Praxisszenario für Sportler, die Uhren verschiedener Hersteller im Tagesverlauf kombinieren. Um Metriken zu bündeln und Datenkontinuität zu wahren, installieren Sie FitMesh mit demselben Konto auf dem iPhone und dem zweiten Android-Smartphone. Die Apple Watch synchronisiert den Alltag mit Apple Health; Sporteinheiten aus Garmin Connect oder Polar Flow gelangen in das jeweilige System-Framework; mit demselben Konto zeigt FitMesh die bereits synchronisierten Daten auf beiden Smartphones.",
        ja: "本稿では、1日の中で異なるブランドのスマートウォッチを使い分ける方向けの実践シナリオを解説します。指標を統合してデータの継続性を保つには、iPhoneと2台目のAndroidスマートフォンの双方に同一のFitMeshアカウントでログインします。Apple Watchが日常データをAppleヘルスケアに同期し、Garmin ConnectやPolar Flowで記録したワークアウトが各端末のヘルスケア基盤へ送られ、同じアカウントでログインしていれば、FitMeshは同期済みのデータを両方のスマートフォンに表示します。",
        fr: "Cet article présente un scénario illustratif pour les sportifs combinant plusieurs montres au cours de la journée. Pour regrouper vos métriques et maintenir la continuité de vos données, installez FitMesh avec le même compte sur votre iPhone et votre second smartphone Android. L'Apple Watch synchronise le quotidien dans Apple Santé ; la séance enregistrée avec Garmin Connect ou Polar Flow est transmise au framework du téléphone ; avec le même compte, FitMesh affiche sur vos deux téléphones les données déjà synchronisées.",
      },
    },
    {
      type: "heading",
      level: 2,
      text: {
        it: "Uno scenario pratico: notte, allenamento e routine in ecosistemi diversi",
        en: "A practical scenario: sleep, training, and routine in different ecosystems",
        de: "Ein Praxisszenario: Schlaf, Training und Alltag in getrennten Systemen",
        ja: "実践シナリオ：睡眠、トレーニング、日常が異なるエコシステムに分散する課題",
        fr: "Un scénario pratique : sommeil, entraînement et routine dans des écosystèmes distincts",
      },
    },
    {
      type: "paragraph",
      text: {
        it: "Una configurazione comune tra chi pratica sport di resistenza e fitness include un Apple Watch per il monitoraggio del sonno, le notifiche e la vita da ufficio, affiancato da un dispositivo dedicato Garmin o Polar scelto per l'autonomia della batteria, la precisione del GPS cartografico e i tasti fisici durante gli allenamenti impegnativi. A questo si aggiunge spesso un secondo smartphone Android aziendale (come un Samsung Galaxy) su cui si desidera controllare il proprio stato di forma durante le ore di lavoro.",
        en: "A frequent configuration among endurance athletes and fitness enthusiasts pairs an Apple Watch for sleep tracking, connectivity, and daily routine, alongside a dedicated Garmin or Polar device selected for battery endurance, mapped GPS navigation, and physical buttons during intense sessions. In addition, many carry a corporate Android smartphone (such as a Samsung Galaxy) where checking recovery and daily totals is desirable during working hours.",
        de: "Eine verbreitete Konfiguration unter Ausdauersportlern kombiniert eine Apple Watch für Schlaftracking, Benachrichtigungen und den Büroalltag mit einem Garmin- oder Polar-Gerät für lange Akkulaufzeiten, Offline-Karten und physische Tasten beim Training. Hinzu kommt häufig ein zweites geschäftliches Android-Smartphone (etwa ein Samsung Galaxy), auf dem der Tagesfortschritt während der Arbeitszeit eingesehen werden soll.",
        ja: "エンデュランス競技を行うアスリートの間で見られる構成として、睡眠計測や通知管理、日常の生活には操作性の高いApple Watchを着用し、長時間のトレーニングやレースではバッテリー駆動時間や高精度GPS、物理ボタンを備えたGarminやPolarを装着するという使い分けがあります。さらに、日中の勤務中には会社から支給されたAndroid端末（Samsung Galaxyなど）でも自身の活動状況を確認したいという需要があります。",
        fr: "Une configuration fréquente chez les sportifs d'endurance associe une Apple Watch pour le suivi du sommeil, la connectivité et la vie quotidienne, à une montre Garmin ou Polar privilégiée pour l'autonomie, la cartographie GPS et les boutons physiques lors des sorties longues. À cela s'ajoute souvent un second smartphone professionnel sous Android (comme un Samsung Galaxy) sur lequel on souhaite consulter son état de forme pendant les heures de travail.",
      },
    },
    {
      type: "paragraph",
      text: {
        it: "Senza uno strumento di raccordo, questa configurazione produce archivi separati: i passi del mattino restano in Apple Salute, i chilometri della corsa in montagna finiscono su Garmin Connect o Polar Flow, e sul telefono aziendale non compare nulla. FitMesh è un'applicazione mobile (disponibile per iPhone su App Store e per Android su Google Play) che risolve questo problema collegando i dispositivi allo stesso account personale. Il beneficio concreto non è semplicemente guardare grafici: è ricostruire l'intera giornata senza dover ricomporre a mano i dati sparsi tra le diverse applicazioni. Con lo stesso account vedi gli stessi dati, già sincronizzati, anche sull'altro telefono.",
        en: "Without an integration layer, this setup fragments your data: morning steps remain locked in Apple Health, trail running distance sits in Garmin Connect or Polar Flow, and the work phone displays nothing. FitMesh is a mobile application (available for iPhone on the App Store and Android on Google Play) that solves this problem by linking your devices to a single personal account. The concrete benefit is not simply viewing charts: it reconstructs your full day without manually piecing together fragmented records across multiple apps. With the same account you see the same already synced data on your other phone too.",
        de: "Ohne verbindende Schnittstelle entstehen Datensilos: Die Schritte des Morgens verbleiben in Apple Health, Trainingskilometer liegen bei Garmin Connect oder Polar Flow, und das Diensttelefon zeigt keine Gesamtwerte an. FitMesh ist eine mobile App (verfügbar für iPhone im App Store und für Android auf Google Play), die dieses Problem löst, indem sie Ihre Geräte mit einem persönlichen Konto verbindet. Der konkrete Nutzen liegt nicht nur im Betrachten von Diagrammen: Sie erhalten Ihren gesamten Tagesverlauf zurück, ohne Daten aus verschiedenen Hersteller-Apps manuell zusammenzufügen. Mit demselben Konto sehen Sie dieselben, bereits synchronisierten Daten auch auf dem anderen Smartphone.",
        ja: "統合ツールがない場合、データは分断されてしまいます。朝の歩数はAppleヘルスケアに留まり、長距離走の走行ログはGarmin ConnectやPolar Flowに孤立し、会社のスマートフォンには何も反映されません。FitMeshは、複数のデバイスを同一の個人アカウントに集約することでこの問題を解決するスマートフォン向けアプリです（App StoreおよびGoogle Playで提供）。その実用的な価値は、単にグラフを眺めることではありません。異なる公式アプリに分散した記録を手作業で突き合わせることなく、1日の全体像を再構築できる点にあります。同じアカウントを使えば、同期済みの同じデータをもう1台のスマートフォンでも確認できます。",
        fr: "Sans outil de centralisation, cette routine fragmente vos bilans : les pas du matin restent confinés dans Apple Santé, la sortie d'entraînement demeure dans Garmin Connect ou Polar Flow, et le téléphone professionnel n'affiche rien. FitMesh est une application mobile (disponible pour iPhone sur l'App Store et pour Android sur Google Play) qui résout cette rupture en rattachant vos appareils au même compte personnel. Le bénéfice concret ne se résume pas à afficher des graphiques : il permet de reconstituer votre journée complète sans devoir rapprocher manuellement les bilans dispersés entre plusieurs applications. Avec le même compte, vous retrouvez les mêmes données déjà synchronisées sur l'autre téléphone.",
      },
    },
    {
      type: "table",
      caption: {
        it: "Flusso delle metriche tra dispositivi, app vendor e framework salute supportati.",
        en: "Data flow across devices, vendor apps, and supported health frameworks.",
        de: "Datenfluss zwischen Geräten, Hersteller-Apps und unterstützten Frameworks.",
        ja: "デバイス、メーカー公式アプリ、対応ヘルスケア基盤間のデータフロー",
        fr: "Flux des métriques entre appareils, applications d'origine et frameworks de santé.",
      },
      headers: {
        it: ["Sorgente hardware", "App del produttore", "Framework di sistema", "Lettura in FitMesh", "Scrittura opzionale", "Restano nell'app originale"],
        en: ["Hardware source", "Vendor companion app", "System framework", "Read by FitMesh", "Optional write-back", "Retained in vendor app"],
        de: ["Hardware-Quelle", "Hersteller-App", "System-Framework", "Gelesen von FitMesh", "Optionaler Export", "Verbleibt beim Hersteller"],
        ja: ["ハードウェア", "メーカー公式アプリ", "システム基盤", "FitMeshでの読み取り", "任意の書き出し", "公式アプリに残る項目"],
        fr: ["Appareil source", "Application fabricant", "Framework système", "Lecture dans FitMesh", "Écriture optionnelle", "Conservé dans l'app d'origine"],
      },
      rows: [
        {
          it: [
            "Apple Watch",
            "Watch / Fitness (iOS)",
            "Apple Salute (HealthKit)",
            "Passi, sonno, FC a riposo, HRV (SDNN)",
            "Non applicabile (sorgente nativa)",
            "Anelli Attività, trend proprietari Fitness",
          ],
          en: [
            "Apple Watch",
            "Watch / Fitness (iOS)",
            "Apple Health (HealthKit)",
            "Steps, sleep, resting HR, HRV (SDNN)",
            "Not applicable (native source)",
            "Activity Rings, proprietary Fitness trends",
          ],
          de: [
            "Apple Watch",
            "Watch / Fitness (iOS)",
            "Apple Health (HealthKit)",
            "Schritte, Schlaf, Ruhe-HF, HRV (SDNN)",
            "Nicht zutreffend (native Quelle)",
            "Aktivitätsringe, proprietäre Fitness-Trends",
          ],
          ja: [
            "Apple Watch",
            "Watch / フィットネス (iOS)",
            "Appleヘルスケア (HealthKit)",
            "歩数、睡眠、安静時心拍、HRV (SDNN)",
            "該当なし（ネイティブ入力）",
            "アクティビティリング、独自トレンド分析",
          ],
          fr: [
            "Apple Watch",
            "Watch / Forme (iOS)",
            "Apple Santé (HealthKit)",
            "Pas, sommeil, FC repos, VFC (SDNN)",
            "Non applicable (source native)",
            "Anneaux Activité, tendances Forme",
          ],
        },
        {
          it: [
            "Garmin Forerunner / Fenix",
            "Garmin Connect",
            "Apple Salute o Health Connect",
            "Allenamenti, distanza, passi, FC sessione",
            "Passi/calorie su Health Connect (se abilitato)",
            "Body Battery, Training Readiness, Stamina",
          ],
          en: [
            "Garmin Forerunner / Fenix",
            "Garmin Connect",
            "Apple Health or Health Connect",
            "Workouts, distance, steps, workout HR",
            "Steps/calories to Health Connect (if enabled)",
            "Body Battery, Training Readiness, Stamina",
          ],
          de: [
            "Garmin Forerunner / Fenix",
            "Garmin Connect",
            "Apple Health oder Health Connect",
            "Workouts, Distanz, Schritte, Trainings-HF",
            "Schritte/Kalorien nach Health Connect (optional)",
            "Body Battery, Trainingsbereitschaft, Stamina",
          ],
          ja: [
            "Garmin Forerunner / Fenix",
            "Garmin Connect",
            "Appleヘルスケア または ヘルスコネクト",
            "ワークアウト、距離、歩数、運動時心拍",
            "歩数・消費カロリーの書き出し（設定時）",
            "Body Battery、トレーニングレディネス、Stamina",
          ],
          fr: [
            "Garmin Forerunner / Fenix",
            "Garmin Connect",
            "Apple Santé ou Health Connect",
            "Entraînements, distance, pas, FC séance",
            "Pas/calories vers Health Connect (si activé)",
            "Body Battery, Préparation à l'entraînement",
          ],
        },
        {
          it: [
            "Polar Vantage / Grit X (orologio)",
            "Polar Flow",
            "Apple Salute o Health Connect",
            "Allenamenti, FC sessione, passi, calorie",
            "Metriche consentite verso Health Connect",
            "Nightly Recharge, Running Index, Cardio Load",
          ],
          en: [
            "Polar Vantage / Grit X (watch)",
            "Polar Flow",
            "Apple Health or Health Connect",
            "Workouts, workout HR, steps, calories",
            "Consented metrics to Health Connect",
            "Nightly Recharge, Running Index, Cardio Load",
          ],
          de: [
            "Polar Vantage / Grit X (Uhr)",
            "Polar Flow",
            "Apple Health oder Health Connect",
            "Workouts, Trainings-HF, Schritte, Kalorien",
            "Freigegebene Metriken nach Health Connect",
            "Nightly Recharge, Running Index, Cardio Load",
          ],
          ja: [
            "Polar Vantage / Grit X (時計)",
            "Polar Flow",
            "Appleヘルスケア または ヘルスコネクト",
            "ワークアウト、運動時心拍、歩数、消費カロリー",
            "同意済み指標のヘルスコネクト書き出し",
            "Nightly Recharge、Running Index、Cardio Load",
          ],
          fr: [
            "Polar Vantage / Grit X (montre)",
            "Polar Flow",
            "Apple Santé ou Health Connect",
            "Entraînements, FC séance, pas, calories",
            "Métriques autorisées vers Health Connect",
            "Nightly Recharge, Running Index, Charge cardiaque",
          ],
        },
        {
          it: [
            "Polar H10 (fascia cardio)",
            "Polar Flow / Polar Beat",
            "Apple Salute o Health Connect",
            "FC sessione durante l'allenamento attivo",
            "Frequenza cardiaca di sessione",
            "Registrazione ECG interna del sensore",
          ],
          en: [
            "Polar H10 (chest strap)",
            "Polar Flow / Polar Beat",
            "Apple Health or Health Connect",
            "Workout HR during active session",
            "Session heart rate to Health Connect",
            "Sensor internal ECG recording",
          ],
          de: [
            "Polar H10 (Brustgurt)",
            "Polar Flow / Polar Beat",
            "Apple Health oder Health Connect",
            "Trainings-HF während aktiver Einheiten",
            "Sitzungs-Herzfrequenz nach Health Connect",
            "Interne EKG-Aufzeichnung des Sensors",
          ],
          ja: [
            "Polar H10 (胸部心拍センサー)",
            "Polar Flow / Polar Beat",
            "Appleヘルスケア または ヘルスコネクト",
            "計測中セッションの運動時心拍のみ",
            "セッション心拍の書き出し",
            "センサー内部のECG記録",
          ],
          fr: [
            "Polar H10 (ceinture cardio)",
            "Polar Flow / Polar Beat",
            "Apple Santé ou Health Connect",
            "FC de séance pendant l'effort actif",
            "Fréquence cardiaque de séance",
            "Enregistrement ECG interne du capteur",
          ],
        },
      ],
    },
    {
      type: "heading",
      level: 2,
      text: {
        it: "Mattina: sonno e risveglio con Apple Watch e iPhone",
        en: "Morning: sleep and wake-up with Apple Watch and iPhone",
        de: "Morgen: Schlaf und Aufwachen mit Apple Watch und iPhone",
        ja: "朝：Apple WatchとiPhoneによる睡眠記録とモーニングルーティン",
        fr: "Matin : sommeil et réveil avec l'Apple Watch et l'iPhone",
      },
    },
    {
      type: "paragraph",
      text: {
        it: "La giornata inizia con i dati registrati durante la notte. L'Apple Watch rileva le fasi del sonno, la frequenza cardiaca a riposo e la variabilità cardiaca (espressa in SDNN dal framework Apple). Al risveglio, aprendo l'app Salute su iPhone, queste metriche sono archiviate localmente nel database HealthKit.",
        en: "The day begins with overnight biometric tracking. Apple Watch records sleep stages, resting heart rate, and heart rate variability (reported as SDNN by Apple HealthKit). Upon waking, these values populate the local HealthKit database on your iPhone.",
        de: "Der Tag beginnt mit den während der Nacht erfassten Daten. Die Apple Watch ermittelt Schlafphasen, Ruhepuls und Herzfrequenzvariabilität (im Apple-Framework als SDNN angegeben). Beim Aufwachen werden diese Messwerte in der lokalen HealthKit-Datenbank auf dem iPhone abgelegt.",
        ja: "1日の始まりは、夜間に記録された生体データの確認から始まります。Apple Watchが睡眠ステージ、安静時心拍数、および心拍変動（Apple HealthKitではSDNN形式で保存）を測定します。起床後、iPhoneのヘルスケアデータベースにこれらの数値が反映されます。",
        fr: "La journée débute par l'analyse de la nuit. L'Apple Watch enregistre les phases de sommeil, la fréquence cardiaque au repos et la variabilité de la fréquence cardiaque (exprimée en SDNN par Apple). Au réveil, ces mesures sont enregistrées dans la base locale d'Apple Santé sur l'iPhone.",
      },
    },
    {
      type: "paragraph",
      text: {
        it: "Aprendo FitMesh sull'iPhone, l'app legge da Apple Salute i dati per cui hai concesso il permesso di lettura. I campioni del sonno e i primi passi della mattina servono a comporre il quadro della giornata. In questa versione FitMesh non scrive il sonno in Apple Salute. Fra i motivi: una fase di sonno con un'etichetta non riconosciuta verrebbe scritta come sonno leggero, cioè come sonno che nessuno ha misurato.",
        en: "When you open FitMesh on the iPhone, the app reads from Apple Health the data you allowed it to read. Sleep samples and the first steps of the morning are used to build the day's overview. In this version FitMesh does not write sleep to Apple Health. One of the reasons: a sleep stage with a label it does not recognise would be written as light sleep, which is sleep nobody measured.",
        de: "Wenn Sie FitMesh auf dem iPhone öffnen, liest die App aus Apple Health die Daten, für die Sie eine Leseberechtigung erteilt haben. Schlafdaten und die ersten Schritte des Morgens ergeben den Tagesüberblick. In dieser Version schreibt FitMesh keinen Schlaf in Apple Health. Einer der Gründe: Eine Schlafphase mit einer nicht erkannten Bezeichnung würde als leichter Schlaf geschrieben, also als Schlaf, den niemand gemessen hat.",
        ja: "iPhoneでFitMeshを開くと、読み取りを許可したデータをAppleヘルスケアから読み込みます。睡眠データと朝の歩数をもとに、1日の概要が作られます。現行バージョンでは、FitMeshはAppleヘルスケアに睡眠を書き込みません。理由の一つは、認識できない名称の睡眠ステージが浅い睡眠として書き込まれ、誰も測定していない睡眠になってしまうことです。",
        fr: "Quand vous ouvrez FitMesh sur l'iPhone, l'application lit dans Apple Santé les données que vous l'avez autorisée à lire. Les données de sommeil et les premiers pas du matin servent à composer la vue de la journée. Dans cette version, FitMesh n'écrit pas le sommeil dans Apple Santé. L'une des raisons : une phase de sommeil dont l'étiquette n'est pas reconnue serait écrite comme sommeil léger, c'est-à-dire comme un sommeil que personne n'a mesuré.",
      },
    },
    {
      type: "heading",
      level: 2,
      text: {
        it: "Allenamento: sessione lunga con Garmin o Polar",
        en: "Training: endurance session with Garmin or Polar",
        de: "Training: Ausdauereinheit mit Garmin oder Polar",
        ja: "トレーニング：GarminまたはPolarによる本格セッション",
        fr: "Entraînement : séance d'endurance avec Garmin ou Polar",
      },
    },
    {
      type: "paragraph",
      text: {
        it: "Per una sessione di corsa lunga, trail o ciclismo, l'atleta indossa il proprio orologio sportivo dedicato. Se si utilizza Garmin, l'orologio registra traccia GPS, cadenza, dislivello e frequenza cardiaca. Al rientro, la sessione viene inviata all'applicazione Garmin Connect via Bluetooth o Wi-Fi.",
        en: "For a long run, trail outing, or cycling session, the athlete switches to a dedicated sports watch. With Garmin, the watch tracks GPS coordinates, elevation, cadence, and heart rate. Back home, the activity syncs to the Garmin Connect companion app via Bluetooth or Wi-Fi.",
        de: "Für lange Läufe, Trail-Sessions oder Ausfahrten kommt die spezialisierte Sportuhr zum Einsatz. Bei Garmin erfasst die Uhr GPS-Spur, Höhenmeter, Schrittfrequenz und Puls. Nach Abschluss wird die Aktivität über Bluetooth oder WLAN an die Garmin Connect App übertragen.",
        ja: "長距離走やトレイルランニング、ロードバイクの練習では、専用のスポーツウォッチに付け替えます。Garminを使用する場合、GPS軌跡、高低差、ピッチ、心拍数が記録され、練習終了後にBluetoothまたはWi-Fi経由でGarmin Connectアプリへデータが同期されます。",
        fr: "Pour une sortie longue, un trail ou une séance de vélo, l'athlète chausse sa montre de sport dédiée. Avec Garmin, l'appareil enregistre la trace GPS, l'élévation, la cadence et la fréquence cardiaque. Au retour, l'activité est transférée vers l'application Garmin Connect en Bluetooth ou Wi-Fi.",
      },
    },
    {
      type: "paragraph",
      text: {
        it: "Affinché la sessione raggiunga il resto del sistema, è necessario aver abilitato la condivisione nelle impostazioni di Garmin Connect: su iOS verso Apple Salute (come documentato nella [guida ufficiale Garmin per Apple Salute](https://support.garmin.com/en-AU/?faq=lK5FPB9iPF5PXFkIpFlFPA)), oppure su Android verso Health Connect (come indicato nella [guida ufficiale Garmin per Health Connect](https://support.garmin.com/en-IN/?faq=JToBEy0jfe6pIygark2Ui5)). Per approfondire questo passaggio su smartphone Samsung, puoi consultare la nostra [guida di collegamento tra Garmin e Samsung Health](/blog/garmin-samsung-health-sync-guide).",
        en: "For this workout to reach your broader ecosystem, sharing must be active in Garmin Connect settings: directed to Apple Health on iOS (as documented in the [official Garmin guide for Apple Health](https://support.garmin.com/en-AU/?faq=lK5FPB9iPF5PXFkIpFlFPA)), or to Health Connect on Android (as described in the [official Garmin guide for Health Connect](https://support.garmin.com/en-IN/?faq=JToBEy0jfe6pIygark2Ui5)). For step-by-step instructions on Samsung phones, refer to our [guide on syncing Garmin with Samsung Health](/blog/garmin-samsung-health-sync-guide).",
        de: "Damit das Training in das Gesamtsystem einfließt, muss die Freigabe in den Einstellungen von Garmin Connect aktiviert sein: auf iOS zu Apple Health (dokumentiert in der [offiziellen Garmin-Anleitung für Apple Health](https://support.garmin.com/en-AU/?faq=lK5FPB9iPF5PXFkIpFlFPA)) oder auf Android zu Health Connect (gemäß der [offiziellen Garmin-Anleitung für Health Connect](https://support.garmin.com/en-IN/?faq=JToBEy0jfe6pIygark2Ui5)). Für Details auf Samsung-Smartphones siehe unseren [Leitfaden zur Verbindung von Garmin mit Samsung Health](/blog/garmin-samsung-health-sync-guide).",
        ja: "このセッションデータをシステム全体に反映させるには、各公式アプリで連携設定を有効にしておく必要があります。Garmin Connectの場合、iOSではAppleヘルスケア（[Garmin公式のAppleヘルスケア連携ガイド](https://support.garmin.com/en-AU/?faq=lK5FPB9iPF5PXFkIpFlFPA)を参照）、Androidではヘルスコネクト（[Garmin公式のヘルスコネクト連携ガイド](https://support.garmin.com/en-IN/?faq=JToBEy0jfe6pIygark2Ui5)を参照）へのデータ共有をオンにします。Samsung端末での詳細な設定方法は、当サイトの[GarminとSamsung Healthの同期ガイド](/blog/garmin-samsung-health-sync-guide)をご覧ください。",
        fr: "Pour que la séance s'intègre au reste de vos données, le partage doit être activé dans Garmin Connect : vers Apple Santé sous iOS (documenté dans le [guide officiel Garmin pour Apple Santé](https://support.garmin.com/en-AU/?faq=lK5FPB9iPF5PXFkIpFlFPA)) ou vers Health Connect sous Android (selon le [guide officiel Garmin pour Health Connect](https://support.garmin.com/en-IN/?faq=JToBEy0jfe6pIygark2Ui5)). Pour les utilisateurs de téléphones Samsung, consultez notre [guide de synchronisation Garmin et Samsung Health](/blog/garmin-samsung-health-sync-guide).",
      },
    },
    {
      type: "paragraph",
      text: {
        it: "Se invece si utilizza Polar, occorre distinguere lo strumento impiegato. Con un orologio sportivo (come Vantage o Grit X), l'allenamento e i passi transitano dall'app Polar Flow verso Apple Salute (secondo il [supporto ufficiale Polar per Apple Salute](https://support.polar.com/ca-en/support/connecting_polar_flow_with_apple_health)) o verso Health Connect (illustrato nella nostra [guida alla sincronizzazione Polar con Health Connect](/blog/polar-health-connect-sync) e nel [supporto ufficiale Polar Flow Health Connect](https://support.polar.com/tw-en/flow-app-health-connect)). La documentazione Polar chiarisce che il collegamento verso Apple Salute esporta la frequenza cardiaca delle sessioni registrate, ma non la frequenza cardiaca continua 24/7. Se invece si utilizza una fascia cardio toracica Polar H10, essa non possiede contapassi o monitoraggio del sonno autonomo: rileva i battiti durante la sessione attiva e li trasmette a Polar Flow o all'orologio collegato.",
        en: "If using Polar instead, the hardware type makes a difference. With a GPS watch (such as Vantage or Grit X), workouts and steps pass from Polar Flow to Apple Health (as detailed in [official Polar support for Apple Health](https://support.polar.com/ca-en/support/connecting_polar_flow_with_apple_health)) or Health Connect (explained in our [guide on Polar synchronization with Health Connect](/blog/polar-health-connect-sync) and [official Polar Flow Health Connect documentation](https://support.polar.com/tw-en/flow-app-health-connect)). Polar documentation notes that the Apple Health connection exports heart rate collected during recorded training sessions, but does not provide continuous 24/7 background heart rate. By contrast, a Polar H10 chest strap has no daily step sensor or autonomous sleep tracking: it measures electrical heart rate during an active session and streams it to Polar Flow or a paired watch.",
        de: "Kommt stattdessen Polar zum Einsatz, ist der Gerätetyp entscheidend. Bei einer Sportuhr (wie Vantage oder Grit X) fließen Workouts und Schritte über Polar Flow zu Apple Health (gemäß [offiziellem Polar-Support für Apple Health](https://support.polar.com/ca-en/support/connecting_polar_flow_with_apple_health)) oder Health Connect (erläutert in unserer [Anleitung zur Polar-Synchronisation mit Health Connect](/blog/polar-health-connect-sync) und der [offiziellen Polar Flow Health Connect Dokumentation](https://support.polar.com/tw-en/flow-app-health-connect)). Polar dokumentiert offiziell, dass die Verbindung zu Apple Health die Herzfrequenz während aufgezeichneter Trainingseinheiten exportiert, jedoch keine kontinuierliche 24/7-Herzfrequenz. Ein Polar H10 Brustgurt hingegen besitzt keinen Schrittzähler und kein Schlaftracking: Er erfasst den Puls während der aktiven Trainingseinheit und überträgt ihn an Polar Flow oder eine gekoppelte Sportuhr.",
        ja: "Polarを利用する場合は、使用する機器の特性に応じた違いがあります。VantageやGrit XなどのGPSウォッチでは、ワークアウトと歩数がPolar Flow経由でAppleヘルスケア（[Polar公式のAppleヘルスケア連携仕様](https://support.polar.com/ca-en/support/connecting_polar_flow_with_apple_health)を参照）またはヘルスコネクト（当サイトの[Polarとヘルスコネクトの同期ガイド](/blog/polar-health-connect-sync)および[Polar公式ヘルスコネクト文書](https://support.polar.com/tw-en/flow-app-health-connect)を参照）へ送られます。Polarの公式仕様にある通り、Appleヘルスケア連携ではワークアウト中の心拍数は書き出されますが、24時間の常時心拍数は対象外です。一方、Polar H10胸部心拍センサーは単体での歩数計測や睡眠分析機能を持たず、運動中の心拍データをPolar Flowや接続機器へ正確に送ることに特化しています。",
        fr: "Si vous utilisez Polar, le type d'appareil implique une nuance importante. Avec une montre GPS (comme la Vantage ou la Grit X), les séances et les pas transitent via Polar Flow vers Apple Santé (selon l'assistance [officielle Polar pour Apple Santé](https://support.polar.com/ca-en/support/connecting_polar_flow_with_apple_health)) ou vers Health Connect (détaillé dans notre [guide de synchronisation Polar avec Health Connect](/blog/polar-health-connect-sync) et l'[assistance Polar Flow Health Connect](https://support.polar.com/tw-en/flow-app-health-connect)). La documentation Polar précise que la liaison avec Apple Santé exporte la fréquence cardiaque des entraînements enregistrés, mais pas la fréquence cardiaque continue 24/7. En revanche, une ceinture thoracique Polar H10 ne comporte ni podomètre ni suivi du sommeil autonome : elle mesure la fréquence cardiaque pendant l'effort et la transmet à Polar Flow ou à la montre associée.",
      },
    },
    {
      type: "image",
      src: "/blog/screenshots/demo-site/06_workout_detail.webp",
      width: 1206,
      height: 2622,
      narrow: true,
      alt: {
        it: "Scheda di dettaglio di una sessione di corsa in FitMesh Sync con durata 55 min, distanza 9.00 km, passo 6:07 /km, calorie 520 kcal e frequenza cardiaca media 139 e massima 158 BPM",
        en: "Workout detail sheet for a running session in FitMesh Sync showing 55 min duration, 9.00 km distance, 6:07 /km pace, 520 kcal calories, and average 139 and max 158 BPM heart rate",
        de: "Detailansicht einer Trainingseinheit Laufen in FitMesh Sync mit 55 Min Dauer, 9,00 km Distanz, 6:07 /km Pace, 520 kcal Kalorien sowie durchschnittlichem 139 und maximalem 158 BPM Puls",
        ja: "FitMesh Sync内のランニングセッション詳細画面。55分の運動時間、9.00 kmの距離、6:07 /kmのペース、520 kcalの消費カロリー、平均139および最大158 BPMの心拍数を表示",
        fr: "Fiche détaillée d'une séance de course dans FitMesh Sync affichant 55 min de durée, 9,00 km de distance, allure 6:07 /km, 520 kcal et fréquence cardiaque moyenne 139 et max 158 BPM",
      },
      caption: {
        it: "Scheda di dettaglio di una sessione di corsa nell'app FitMesh Sync. Schermata in lingua inglese, dati dimostrativi sintetici.",
        en: "Workout detail sheet for a running session in the FitMesh Sync app. Interface in English, synthetic demo data.",
        de: "Detailansicht einer Laufeinheit in der FitMesh Sync App. Englische Benutzeroberfläche, synthetische Demodaten.",
        ja: "FitMesh Syncアプリ内のランニングセッション詳細画面。英語表示、合成デモデータ。",
        fr: "Fiche de détail d'une séance de course dans l'application FitMesh Sync. Interface en anglais, données de démonstration synthétiques.",
      },
    },
    {
      type: "heading",
      level: 2,
      text: {
        it: "Lavoro: il Samsung Galaxy aziendale come seconda finestra",
        en: "Work: corporate Samsung Galaxy as a second window",
        de: "Arbeit: Das geschäftliche Samsung Galaxy als zweites Fenster",
        ja: "日中：業務用のSamsung Galaxyを第2の閲覧ウィンドウとして活用",
        fr: "Travail : le Samsung Galaxy professionnel comme second écran",
      },
    },
    {
      type: "paragraph",
      text: {
        it: "Durante la giornata lavorativa, l'iPhone personale può rimanere riposto nello zaino, mentre sulla scrivania si utilizza uno smartphone Android aziendale (come un Samsung Galaxy). Installando FitMesh anche sul dispositivo Android e accedendo con lo stesso account, vedi i dati già sincronizzati dall'iPhone.",
        en: "During working hours, your personal iPhone may remain in a bag while a corporate Android phone (such as a Samsung Galaxy) sits on your desk. If you install FitMesh on the Android device and sign in with the same account, you see the data already synced from the iPhone.",
        de: "Während der Arbeitszeit verbleibt das private iPhone oft in der Tasche, während ein geschäftliches Android-Gerät (wie ein Samsung Galaxy) auf dem Schreibtisch liegt. Installieren Sie FitMesh auch auf dem Android-Gerät und melden Sie sich mit demselben Konto an, sehen Sie die bereits vom iPhone synchronisierten Daten.",
        ja: "勤務時間中、私用のiPhoneは鞄に入れたままで、手元には会社支給のAndroidスマートフォン（Samsung Galaxyなど）があるという状況は珍しくありません。このAndroid端末にもFitMeshをインストールして同じアカウントでログインすると、iPhoneから同期済みのデータを確認できます。",
        fr: "Pendant les heures de travail, l'iPhone personnel reste souvent au fond d'un sac tandis qu'un smartphone Android professionnel (tel qu'un Samsung Galaxy) est utilisé sur le bureau. En installant FitMesh sur cet appareil Android et en vous connectant avec le même compte, vous voyez les données déjà synchronisées depuis l'iPhone.",
      },
    },
    {
      type: "paragraph",
      text: {
        it: "Questo vale anche se il telefono Android non ha registrato dati al mattino e non è collegato via Bluetooth all'Apple Watch o al Garmin. Nell'app compaiono i passi del giorno, il sonno della notte precedente e l'allenamento del mattino, se sono già stati sincronizzati dall'iPhone. Se le policy aziendali lo consentono, puoi anche attivare in FitMesh la scrittura verso Health Connect: è facoltativa, si accende con un interruttore nell'app e richiede i permessi di Health Connect. A quel punto altre app autorizzate sul telefono possono leggere i passi scritti da FitMesh.",
        en: "This holds even if the Android phone recorded no data that morning and is not paired over Bluetooth with the Apple Watch or the Garmin. The app shows the day's steps, the previous night's sleep and the morning workout, once they have been synced from the iPhone. If company policy allows it, you can also turn on writing to Health Connect in FitMesh: it is optional, it is switched on with a toggle in the app, and it needs Health Connect permissions. Other authorised apps on that phone can then read the steps FitMesh wrote.",
        de: "Das gilt auch dann, wenn das Android-Gerät am Morgen keine Daten erfasst hat und nicht per Bluetooth mit der Apple Watch oder der Garmin verbunden ist. In der App erscheinen die Schritte des Tages, der Schlaf der vergangenen Nacht und das Training am Morgen, sobald sie vom iPhone synchronisiert wurden. Wenn die Unternehmensrichtlinien es erlauben, können Sie in FitMesh auch das Schreiben nach Health Connect aktivieren: Es ist optional, wird mit einem Schalter in der App eingeschaltet und braucht die Berechtigungen von Health Connect. Andere berechtigte Apps auf dem Smartphone können dann die von FitMesh geschriebenen Schritte lesen.",
        ja: "Android端末で朝のデータが記録されておらず、Apple WatchやGarminとBluetoothで接続されていなくても同じです。iPhoneから同期済みであれば、アプリには当日の歩数、前夜の睡眠、朝のワークアウトが表示されます。会社のポリシーで許可されていれば、FitMeshでヘルスコネクトへの書き込みをオンにすることもできます。書き込みは任意で、アプリ内のスイッチでオンにし、ヘルスコネクトの権限が必要です。オンにすると、その端末で許可された他のアプリが、FitMeshの書き込んだ歩数を読み取れます。",
        fr: "C'est vrai même si le téléphone Android n'a enregistré aucune donnée le matin et n'est pas relié en Bluetooth à l'Apple Watch ou à la Garmin. L'application affiche les pas du jour, le sommeil de la nuit précédente et l'entraînement du matin, une fois synchronisés depuis l'iPhone. Si la politique de l'entreprise le permet, vous pouvez aussi activer dans FitMesh l'écriture vers Health Connect : elle est facultative, s'active avec un interrupteur dans l'application et demande les autorisations de Health Connect. Les autres applications autorisées sur ce téléphone peuvent alors lire les pas écrits par FitMesh.",
      },
    },
    {
      type: "heading",
      level: 2,
      text: {
        it: "Sera: ricomposizione della giornata e fusione delle metriche",
        en: "Evening: daily reconciliation and metric fusion",
        de: "Abend: Tagesauswertung und Metrik-Fusion",
        ja: "夜：1日のデータの突合と指標フュージョン処理",
        fr: "Soir : réconciliation de la journée et fusion des métriques",
      },
    },
    {
      type: "paragraph",
      text: {
        it: "A fine giornata, nell'app trovi i passi del giorno, l'allenamento registrato con Garmin o Polar e il sonno della notte. Se più dispositivi hanno contato passi nello stesso giorno, il totale non è la loro somma: il riquadro qui sotto spiega come FitMesh sceglie. Per approfondire sovrapposizioni e priorità tra più orologi, puoi leggere la nostra [guida ai dati doppi in Health Connect](/blog/piu-smartwatch-insieme-dati-doppi).",
        en: "By evening, the app shows the day's steps, the workout recorded with Garmin or Polar and the night's sleep. If more than one device counted steps on the same day, the total is not their sum: the box below explains how FitMesh chooses. For more on overlaps and priorities across several watches, see our [guide to duplicate data in Health Connect](/blog/piu-smartwatch-insieme-dati-doppi).",
        de: "Am Abend zeigt die App die Schritte des Tages, das mit Garmin oder Polar aufgezeichnete Training und den Schlaf der Nacht. Wenn mehrere Geräte am selben Tag Schritte gezählt haben, ist die Gesamtzahl nicht ihre Summe: Der Kasten unten erklärt, wie FitMesh auswählt.",
        ja: "夜には、当日の歩数、GarminやPolarで記録したワークアウト、前夜の睡眠がアプリに表示されます。同じ日に複数の機器が歩数を数えていても、合計はそれらの和ではありません。FitMeshがどのように選ぶかは、下の囲みで説明します。",
        fr: "En fin de journée, l'application affiche les pas du jour, l'entraînement enregistré avec Garmin ou Polar et le sommeil de la nuit. Si plusieurs appareils ont compté des pas le même jour, le total n'est pas leur somme : l'encadré ci-dessous explique comment FitMesh choisit.",
      },
    },
    {
      type: "image",
      src: "/blog/screenshots/demo-site/03_intraday_heart_rate.webp",
      width: 1206,
      height: 2622,
      narrow: true,
      alt: {
        it: "Grafico della frequenza cardiaca intraday in FitMesh Sync con valori minimo 50, medio 68 e massimo 144 BPM, e barre orarie per fasce di intensità",
        en: "Intraday heart rate chart in FitMesh Sync showing min 50, avg 68, and max 144 BPM, and hourly bars by intensity level",
        de: "Stündliches Herzfrequenzdiagramm in FitMesh Sync mit Werten min 50, avg 68 und max 144 BPM sowie stündlichen Intensitätsbalken",
        ja: "FitMesh Sync内の時間帯別心拍数グラフ。最小50、平均68、最大144 BPMの数値と運動強度別の時間バーを表示",
        fr: "Graphique de la fréquence cardiaque journalière dans FitMesh Sync affichant min 50, moyenne 68 et max 144 BPM, avec barres horaires par intensité",
      },
      caption: {
        it: "Monitoraggio orario della frequenza cardiaca con fasce di intensità sonno, riposo, attività ed esercizio. Schermata in inglese, dati dimostrativi sintetici.",
        en: "Hourly heart rate tracking showing sleep, rest, active, and exercise intensity bands. Interface in English, synthetic demo data.",
        de: "Stündliche Herzfrequenzerfassung mit Bereichen für Schlaf, Ruhe, Aktivität und Training. Englische Benutzeroberfläche, synthetische Demodaten.",
        ja: "睡眠、安静、活動、運動強度別の時間帯別心拍モニタリング。英語表示、合成デモデータ。",
        fr: "Suivi horaire du rythme cardiaque avec zones de sommeil, repos, activité et exercice. Interface en anglais, données de démonstration synthétiques.",
      },
    },
    {
      type: "callout",
      variant: "info",
      title: {
        it: "Approfondimento: come FitMesh sceglie fra più fonti",
        en: "Deep dive: how FitMesh chooses between sources",
        de: "Hintergrund: Wie FitMesh zwischen Quellen wählt",
        ja: "解説：FitMeshが複数のソースから選ぶ方法",
        fr: "Éclairage : comment FitMesh choisit entre plusieurs sources",
      },
      body: {
        it: "FitMesh non somma i totali dei passi di dispositivi diversi. Su iPhone il totale del giorno viene da Apple Salute: FitMesh usa il totale che Apple Salute calcola unendo le sue fonti, oppure quello della singola fonte con più passi, se è più alto. Quando più fonti hanno passi per lo stesso giorno, per esempio l'iPhone e il telefono Android, FitMesh ne usa una sola, scelta per affidabilità e copertura. Fa eccezione un anello collegato via Bluetooth a FitMesh insieme a una sola app salute del telefono: in quel caso l'anello può coprire le ore in cui il telefono non ha dati. Per la frequenza cardiaca a riposo e la variabilità cardiaca (HRV) FitMesh usa il valore di una sola fonte e non fa medie fra dispositivi. Il valore HRV di un giorno è la mediana dei campioni di quel giorno. RMSSD e SDNN sono due misure diverse e restano separate; da Apple Salute arriva la SDNN. Se un numero non ti torna, confrontalo con l'app del produttore.",
        en: "FitMesh does not add up step totals from different devices. On iPhone the day's total comes from Apple Health: FitMesh uses the total Apple Health calculates across its sources, or the total of the single source with the most steps, if that one is higher. When more than one source has steps for the same day, for example the iPhone and the Android phone, FitMesh uses only one of them, chosen by reliability and coverage. The exception is a ring connected to FitMesh over Bluetooth together with a single health app on the phone: in that case the ring can cover the hours in which the phone has no data. For resting heart rate and heart rate variability (HRV), FitMesh uses the value from one source and does not average across devices. A day's HRV value is the median of that day's samples. RMSSD and SDNN are two different measures and stay separate; Apple Health provides SDNN. If a number does not look right to you, compare it with the manufacturer's app.",
        de: "FitMesh addiert die Schrittsummen verschiedener Geräte nicht. Auf dem iPhone kommt die Tagessumme aus Apple Health: FitMesh verwendet die Summe, die Apple Health über seine Quellen hinweg berechnet, oder die Summe der einzelnen Quelle mit den meisten Schritten, wenn diese höher ist. Haben mehrere Quellen Schritte für denselben Tag, etwa das iPhone und das Android-Smartphone, verwendet FitMesh nur eine davon, gewählt nach Zuverlässigkeit und Abdeckung. Eine Ausnahme ist ein Ring, der per Bluetooth mit FitMesh verbunden ist, zusammen mit einer einzigen Gesundheits-App auf dem Smartphone: Dann kann der Ring die Stunden abdecken, in denen das Smartphone keine Daten hat. Für Ruhepuls und Herzfrequenzvariabilität (HRV) verwendet FitMesh den Wert einer einzigen Quelle und bildet keinen Durchschnitt über mehrere Geräte. Der HRV-Wert eines Tages ist der Median der Messwerte dieses Tages. RMSSD und SDNN sind zwei verschiedene Messgrößen und bleiben getrennt; aus Apple Health kommt SDNN. Wenn Ihnen eine Zahl nicht stimmig erscheint, vergleichen Sie sie mit der App des Herstellers.",
        ja: "FitMeshは、異なる機器の歩数の合計を足し合わせません。iPhoneでは1日の合計はAppleヘルスケアから取得します。FitMeshは、Appleヘルスケアが複数のソースをまとめて計算した合計か、最も歩数の多い単一ソースの合計のうち、大きいほうを使います。iPhoneとAndroidスマートフォンのように、同じ日の歩数を持つソースが複数ある場合は、信頼性とカバー範囲で選んだ1つだけを使います。例外は、FitMeshにBluetoothで接続したリングとスマートフォンのヘルスケアアプリ1つを併用する場合で、このときはスマートフォンにデータがない時間帯をリングが補うことがあります。安静時心拍数と心拍変動（HRV）については、1つのソースの値を使い、機器間で平均はとりません。1日のHRVの値は、その日の測定値の中央値です。RMSSDとSDNNは別の指標で、区別したまま扱います。AppleヘルスケアからはSDNNが届きます。数値に違和感がある場合は、メーカーのアプリと比べてみてください。",
        fr: "FitMesh n'additionne pas les totaux de pas de différents appareils. Sur iPhone, le total de la journée vient d'Apple Santé : FitMesh utilise le total qu'Apple Santé calcule en réunissant ses sources, ou celui de la source unique qui a le plus de pas, s'il est plus élevé. Quand plusieurs sources ont des pas pour la même journée, par exemple l'iPhone et le téléphone Android, FitMesh n'en utilise qu'une, choisie selon la fiabilité et la couverture. Exception : une bague connectée à FitMesh en Bluetooth, associée à une seule application santé du téléphone. Dans ce cas, la bague peut couvrir les heures où le téléphone n'a pas de données. Pour la fréquence cardiaque au repos et la variabilité de la fréquence cardiaque (VFC), FitMesh utilise la valeur d'une seule source et ne fait pas de moyenne entre appareils. La valeur de VFC d'une journée est la médiane des mesures de cette journée. RMSSD et SDNN sont deux mesures différentes et restent séparées ; Apple Santé fournit la SDNN. Si un chiffre ne vous semble pas juste, comparez-le avec l'application du fabricant.",
      },
    },
    {
      type: "heading",
      level: 2,
      text: {
        it: "I confini necessari: cosa resta nelle app dei produttori",
        en: "Necessary boundaries: what remains in vendor applications",
        de: "Notwendige Grenzen: Was in den Hersteller-Apps verbleibt",
        ja: "明確な境界線：メーカー公式アプリ側に残る固有機能",
        fr: "Limites nécessaires : ce qui reste dans les applications d'origine",
      },
    },
    {
      type: "paragraph",
      text: {
        it: "L'obiettivo di FitMesh è ricomporre il quadro biometrico e di attività, non rimpiazzare le funzioni specialistiche degli ecosistemi scelti. Alcuni indici proprietari dipendono da modelli matematici chiusi del costruttore e non vengono esportati nei framework salute standard:",
        en: "FitMesh aims to restore your holistic biometric picture, not to duplicate vendor-specific features. Certain proprietary metrics rely on closed algorithms and are not exported into open health frameworks:",
        de: "FitMesh führt Aktivitäts- und Vitalwerte zusammen, ersetzt aber keine proprietären Auswertungen der Hersteller. Bestimmte Kennzahlen basieren auf geschlossenen Algorithmen und werden von den System-Frameworks nicht bereitgestellt:",
        ja: "FitMeshの目的は生体情報と運動記録を一元的に把握することであり、各メーカーの専門的な解析機能を模倣することではありません。メーカー独自の複合指標は閉じたアルゴリズムに基づいており、標準フレームワークには出力されません：",
        fr: "L'objectif de FitMesh est d'offrir une vue globale de vos activités sans chercher à remplacer les fonctions spécialisées de chaque fabricant. Certains indices propriétaires reposent sur des algorithmes fermés et ne sont pas diffusés dans les frameworks standards :",
      },
    },
    {
      type: "list",
      ordered: false,
      items: {
        it: [
          "Garmin: indici come Body Battery, Training Readiness e suggerimenti giornalieri restano consultabili nell'app Garmin Connect (per approfondire i limiti del trasferimento, vedi la nostra [analisi su Garmin Body Battery e Health Connect](/blog/garmin-body-battery-health-connect)).",
          "Polar: punteggi Nightly Recharge, indici di recupero muscolare e Running Index continuano a vivere all'interno dell'app Polar Flow.",
          "Apple: chiusura degli Anelli Attività e premi motivazionali restano legati all'applicazione Fitness su iOS e watchOS.",
        ],
        en: [
          "Garmin: metrics such as Body Battery, Training Readiness, and daily suggestions stay inside Garmin Connect (for technical export limits, see our [analysis of Garmin Body Battery and Health Connect](/blog/garmin-body-battery-health-connect)).",
          "Polar: Nightly Recharge scores, recovery indicators, and Running Index evaluations stay within the Polar Flow app.",
          "Apple: Activity Ring closures and motivational awards remain tied to the native Fitness app on iOS and watchOS.",
        ],
        de: [
          "Garmin: Werte wie Body Battery, Trainingsbereitschaft und Tagesvorschläge verbleiben in Garmin Connect (zu den Grenzen siehe unsere [Analyse zu Garmin Body Battery und Health Connect](/blog/garmin-body-battery-health-connect)).",
          "Polar: Nightly Recharge Scores, Erholungsindizes und der Running Index verbleiben innerhalb der Polar Flow App.",
          "Apple: Das Schließen der Aktivitätsringe und Auszeichnungen bleiben an die Fitness-App auf iOS und watchOS gebunden.",
        ],
        ja: [
          "Garmin：Body Battery、トレーニングレディネス、おすすめワークアウトはGarmin Connect内で管理されます（データ転送の制限については[Garmin Body BatteryとHealth Connectの検証記事](/blog/garmin-body-battery-health-connect)を参照）。",
          "Polar：Nightly Rechargeスコア、回復状況、Running Index分析はPolar Flowアプリ固有の機能です。",
          "Apple：アクティビティリングの達成やバッジ獲得は、iOSおよびwatchOSのフィットネスアプリ専用の体験です。",
        ],
        fr: [
          "Garmin : les indices tels que Body Battery, la préparation à l'entraînement et les suggestions quotidiennes restent dans Garmin Connect (sur ces limites, consultez notre [analyse de Garmin Body Battery et Health Connect](/blog/garmin-body-battery-health-connect)).",
          "Polar : les scores Nightly Recharge, le suivi de récupération et le Running Index demeurent au sein de Polar Flow.",
          "Apple : la fermeture des Anneaux Activité et les trophées restent propres à l'application Forme sur iOS et watchOS.",
        ],
      },
    },
    {
      type: "heading",
      level: 2,
      text: {
        it: "Checklist di configurazione: i passaggi per iniziare",
        en: "Configuration checklist: steps to get started",
        de: "Einrichtungs-Checkliste: Schritte zum Start",
        ja: "設定チェックリスト：連携を始めるための手順",
        fr: "Liste de contrôle de configuration : les étapes pour démarrer",
      },
    },
    {
      type: "list",
      ordered: true,
      items: {
        it: [
          "Autenticazione unica: registrati o accedi a FitMesh con lo stesso account sia su iPhone sia sullo smartphone Android aziendale.",
          "Permessi su iPhone: consenti a FitMesh di leggere da Apple Salute i passi, gli allenamenti, la frequenza cardiaca e i dati del sonno (in Impostazioni → Salute → Accesso dati e dispositivi → FitMesh).",
          "Condivisione dal produttore: apri Garmin Connect o Polar Flow e attiva l'esportazione verso Apple Salute (su iOS) o verso Health Connect (su Android).",
          "Permessi su Android: sullo smartphone aziendale, consenti a FitMesh l'accesso in lettura (e scrittura opzionale, se desiderata) a Health Connect.",
          "Sincronizzazione di verifica: apri l'app del produttore per completare l'upload del wearable, quindi apri FitMesh per confermare la ricomposizione delle metriche.",
        ],
        en: [
          "Single account: sign in to FitMesh with the same account on both your iPhone and your corporate Android device.",
          "iPhone permissions: grant FitMesh read access to Apple Health for steps, workouts, heart rate, and sleep (in Settings → Health → Data Access & Devices → FitMesh).",
          "Vendor forwarding: open Garmin Connect or Polar Flow and enable syncing to Apple Health (on iOS) or Health Connect (on Android).",
          "Android permissions: on the secondary phone, grant FitMesh read access (and optional write-back if desired) in Health Connect settings.",
          "Verification sync: open your companion app to upload wearable data, then launch FitMesh to verify the aggregated timeline.",
        ],
        de: [
          "Einheitliches Konto: Melden Sie sich bei FitMesh mit demselben Konto sowohl auf dem iPhone als auch auf dem Android-Smartphone an.",
          "iPhone-Berechtigungen: Erteilen Sie FitMesh Leserechte in Apple Health für Schritte, Workouts, Herzfrequenz und Schlaf (Einstellungen → Health → Datenzugriff & Geräte → FitMesh).",
          "Hersteller-Freigabe: Öffnen Sie Garmin Connect oder Polar Flow und aktivieren Sie den Export zu Apple Health (iOS) bzw. Health Connect (Android).",
          "Android-Berechtigungen: Gewähren Sie FitMesh auf dem Zweitgerät die gewünschten Lese- und optionalen Schreibrechte in den Health Connect Einstellungen.",
          "Verifikationsabgleich: Synchronisieren Sie Ihre Uhr mit der Hersteller-App und öffnen Sie FitMesh, um die zusammengeführten Werte zu prüfen.",
        ],
        ja: [
          "アカウントの一致：iPhoneとAndroid端末の双方で、同じアカウントを使ってFitMeshにログインします。",
          "iPhone側の権限設定：「設定」→「ヘルスケア」→「データアクセスとデバイス」→「FitMesh」で、歩数、ワークアウト、心拍数、睡眠の読み取りを許可します。",
          "メーカー公式アプリの設定：Garmin ConnectまたはPolar Flowを開き、iOSではAppleヘルスケア、Androidではヘルスコネクトへの同期を有効にします。",
          "Android側の権限設定：2台目の端末で、ヘルスコネクトの設定画面からFitMeshに必要な読み取り権限（および必要に応じて書き込み権限）を付与します。",
          "同期の確認：まず時計をメーカー公式アプリと同期させ、その後にFitMeshを開いて統合されたダッシュボードを確認します。",
        ],
        fr: [
          "Compte identique : connectez-vous à FitMesh avec le même compte sur votre iPhone et sur le smartphone Android professionnel.",
          "Autorisations iPhone : autorisez FitMesh à lire dans Apple Santé les pas, entraînements, fréquence cardiaque et sommeil (Réglages → Santé → Accès aux données → FitMesh).",
          "Liaison fabricant : ouvrez Garmin Connect ou Polar Flow et activez le transfert vers Apple Santé (sous iOS) ou Health Connect (sous Android).",
          "Autorisations Android : sur le second smartphone, accordez à FitMesh l'accès en lecture (et écriture optionnelle si voulue) dans Health Connect.",
          "Synchronisation de contrôle : synchronisez votre montre avec son application d'origine, puis ouvrez FitMesh pour constater l'actualisation globale.",
        ],
      },
    },
    {
      type: "heading",
      level: 2,
      text: {
        it: "Diagnosi rapida: se un dato non compare sul secondo telefono",
        en: "Quick troubleshooting: if a metric is missing on the second phone",
        de: "Schnelldiagnose: Wenn Werte auf dem Zweitgerät fehlen",
        ja: "クイック診断：2台目の端末にデータが反映されない場合の確認点",
        fr: "Diagnostic rapide : si une métrique n'apparaît pas sur le second appareil",
      },
    },
    {
      type: "paragraph",
      text: {
        it: "Se al termine di un allenamento o a metà giornata noti che una metrica è visibile sull'iPhone ma non ancora sul telefono aziendale Android, il primo passaggio consiste nel verificare la sequenza di trasferimento tra i dispositivi:",
        en: "If after a workout you observe that metrics appear on your iPhone but have not yet synced to your corporate Android phone, the first step is to check the multi-step transfer sequence across devices:",
        de: "Wenn nach einer Einheit Werte auf dem iPhone sichtbar sind, auf dem geschäftlichen Android-Gerät jedoch fehlen, empfiehlt es sich, die einzelnen Schritte der Übertragungskette zu prüfen:",
        ja: "トレーニング後などに、iPhone側では数値が確認できるのにAndroid端末側で表示されない場合、各連携段階での同期状況を順に確認することが有効です：",
        fr: "Si vous constatez qu'une mesure s'affiche sur votre iPhone mais n'est pas encore visible sur le téléphone Android, la première étape consiste à vérifier chaque maillon de la chaîne de transfert :",
      },
    },
    {
      type: "list",
      ordered: false,
      items: {
        it: [
          "Verifica l'upload nell'app del produttore: l'orologio sportivo deve prima aver completato il trasferimento con Garmin Connect o Polar Flow.",
          "Verifica il framework locale: controlla che la sessione sia comparsa in Apple Salute o Health Connect sul telefono principale.",
          "Apri FitMesh sul telefono di origine: i suoi dati compaiono sul secondo telefono solo dopo che sono stati sincronizzati.",
          "Controlla la connettività sul secondo telefono: verifica che il telefono aziendale non abbia restrizioni di rete (come VPN o proxy aziendali bloccanti) e apri FitMesh per scaricare gli aggiornamenti.",
        ],
        en: [
          "Check the vendor upload: ensure the sports watch has fully synced with Garmin Connect or Polar Flow via Bluetooth or Wi-Fi.",
          "Inspect the local framework: confirm that the workout is visible inside Apple Health or Health Connect on the primary phone.",
          "Open FitMesh on the primary phone: its data appears on the second phone only after it has been synced.",
          "Verify network access on the secondary phone: ensure corporate firewalls or VPN restrictions do not block traffic, then open FitMesh to refresh.",
        ],
        de: [
          "Hersteller-Upload prüfen: Stellen Sie sicher, dass die Sportuhr die Daten vollständig an Garmin Connect oder Polar Flow übertragen hat.",
          "Lokales Framework einsehen: Prüfen Sie, ob die Aktivität in Apple Health oder Health Connect auf dem Hauptgerät eingetragen ist.",
          "FitMesh auf dem Hauptgerät öffnen: Seine Daten erscheinen auf dem Zweitgerät erst, nachdem sie synchronisiert wurden.",
          "Netzwerk auf dem Zweitgerät kontrollieren: Vergewissern Sie sich, dass Firmen-VPNs keine Verbindungen blockieren, und öffnen Sie FitMesh zur Aktualisierung.",
        ],
        ja: [
          "公式アプリへのアップロード確認：まずスポーツウォッチ本体とGarmin ConnectやPolar Flowとの同期が完了していることを確認します。",
          "端末側フレームワークの確認：メインの端末（iPhoneなど）のAppleヘルスケアに該当のセッションが取り込まれているか確かめます。",
          "メイン端末でFitMeshを開く：メイン端末のデータは、同期されてから2台目の端末に表示されます。",
          "2台目の通信環境確認：会社支給端末の社内VPNやプロキシ設定が通信を妨げていないか確認し、FitMeshを開いてデータを更新します。",
        ],
        fr: [
          "Vérifier le transfert fabricant : assurez-vous que la montre a bien terminé sa synchronisation avec Garmin Connect ou Polar Flow.",
          "Contrôler le framework d'origine : assurez-vous que la séance est présente dans Apple Santé ou Health Connect sur l'appareil principal.",
          "Ouvrir FitMesh sur le premier téléphone : ses données n'apparaissent sur le second appareil qu'une fois synchronisées.",
          "Vérifier la connexion sur le second appareil : assurez-vous que des restrictions VPN d'entreprise ne bloquent pas les flux, puis ouvrez FitMesh pour actualiser.",
        ],
      },
    },
    {
      type: "fitmesh-editorial-cta",
      contentCluster: "general",
      placement: "article_end",
      title: {
        it: "Unifica i tuoi orologi nello stesso account",
        en: "Unify your watches under the same account",
        de: "Vereinen Sie Ihre Uhren in einem Konto",
        ja: "複数の時計を1つのアカウントに集約",
        fr: "Réunissez vos montres sous le même compte",
      },
      body: {
        it: "Installa FitMesh su iPhone o Android per visualizzare passi, sonno e allenamenti senza ricomporre i dati manualmente.",
        en: "Install FitMesh on iPhone or Android to view steps, sleep, and workouts without manual collation.",
        de: "Installieren Sie FitMesh auf iPhone oder Android, um Schritte, Schlaf und Workouts ohne manuelles Zusammenfügen einzusehen.",
        ja: "iPhoneまたはAndroidにFitMeshをインストールし、手作業での突合なしに歩数、睡眠、ワークアウトを閲覧できます。",
        fr: "Installez FitMesh sur iPhone ou Android pour consulter vos pas, votre sommeil et vos entraînements sans rapprochement manuel.",
      },
      // Nessun beneficio elencato: il percorso di download e' la riga dei
      // pulsanti App Store e Google Play (StoreButtonsRow, resa dal renderer).
      benefits: { it: [], en: [], de: [], ja: [], fr: [] },
    },
  ],
  faq: [
    {
      q: {
        it: "Posso abbinare contemporaneamente lo stesso orologio Bluetooth a due telefoni diversi?",
        en: "Can I simultaneously pair the same Bluetooth watch to two different phones?",
        de: "Kann ich dieselbe Bluetooth-Uhr gleichzeitig mit zwei Telefonen koppeln?",
        ja: "同じBluetoothスマートウォッチを2台のスマートフォンに同時接続できますか？",
        fr: "Puis-je appairer simultanément la même montre Bluetooth à deux smartphones distincts ?",
      },
      a: {
        it: "No. Gli orologi da polso moderni (Apple Watch, Garmin o Polar) supportano l'associazione Bluetooth attiva a un solo smartphone alla volta. Sul secondo telefono vedi i dati accedendo con lo stesso account FitMesh, una volta che sono stati sincronizzati: l'orologio resta collegato a un solo telefono.",
        en: "No. Modern sports watches and smartwatches maintain an active Bluetooth bond with only one smartphone at a time. On the second phone you see the data by signing in with the same FitMesh account, once it has been synced: the watch stays connected to one phone.",
        de: "Nein. Moderne Sportuhren und Smartwatches unterstützen die aktive Bluetooth-Kopplung immer nur mit einem einzigen Smartphone. Auf dem Zweitgerät sehen Sie die Daten, indem Sie sich mit demselben FitMesh-Konto anmelden, sobald sie synchronisiert wurden: Die Uhr bleibt mit einem einzigen Smartphone verbunden.",
        ja: "いいえ。現在のスマートウォッチやスポーツウォッチは、Bluetoothによるアクティブな接続を同時に1台のスマートフォンとのみ維持します。2台目の端末では、同じFitMeshアカウントでログインすれば、同期済みのデータを確認できます。時計は1台のスマートフォンに接続したままです。",
        fr: "Non. Les montres connectées actuelles ne maintiennent une liaison Bluetooth active qu'avec un seul smartphone à la fois. Sur le second appareil, vous voyez les données en vous connectant avec le même compte FitMesh, une fois qu'elles ont été synchronisées : la montre reste reliée à un seul téléphone.",
      },
    },
    {
      q: {
        it: "FitMesh esporta il sonno registrato da Apple Watch verso Health Connect o viceversa?",
        en: "Does FitMesh export Apple Watch sleep to Health Connect or vice versa?",
        de: "Exportiert FitMesh Apple Watch Schlaf nach Health Connect oder umgekehrt?",
        ja: "FitMeshはApple Watchの睡眠データをヘルスコネクトへ、またはその逆に書き出しますか？",
        fr: "FitMesh exporte-t-il le sommeil de l'Apple Watch vers Health Connect ou inversement ?",
      },
      a: {
        it: "FitMesh legge il sonno da Apple Salute e da Health Connect e lo mostra nella propria app. In questa versione non scrive il sonno in Apple Salute: fra i motivi, una fase di sonno con un'etichetta non riconosciuta verrebbe scritta come sonno leggero, cioè come sonno che nessuno ha misurato. Su Android la scrittura verso Health Connect è facoltativa: si attiva con un solo interruttore in FitMesh, valido per il tuo account su quel telefono, e richiede anche i permessi di Health Connect. Con l'interruttore spento FitMesh non scrive dati in Health Connect.",
        en: "FitMesh reads sleep from Apple Health and Health Connect and shows it in its own app. In this version it does not write sleep to Apple Health. One of the reasons: a sleep stage with a label it does not recognise would be written as light sleep, which is sleep nobody measured. On Android, writing to Health Connect is optional: it is turned on with a single toggle in FitMesh, which applies to your account on that phone, and it also needs Health Connect permissions. With the toggle off, FitMesh does not write data to Health Connect.",
        de: "FitMesh liest Schlaf aus Apple Health und Health Connect und zeigt ihn in der eigenen App. In dieser Version schreibt FitMesh keinen Schlaf in Apple Health. Einer der Gründe: Eine Schlafphase mit einer nicht erkannten Bezeichnung würde als leichter Schlaf geschrieben, also als Schlaf, den niemand gemessen hat. Unter Android ist das Schreiben nach Health Connect optional: Es wird mit einem einzigen Schalter in FitMesh eingeschaltet, der für Ihr Konto auf diesem Smartphone gilt, und braucht zusätzlich die Berechtigungen von Health Connect. Bei ausgeschaltetem Schalter schreibt FitMesh keine Daten in Health Connect.",
        ja: "FitMeshはAppleヘルスケアとヘルスコネクトから睡眠を読み込み、アプリ内に表示します。現行バージョンでは、Appleヘルスケアに睡眠を書き込みません。理由の一つは、認識できない名称の睡眠ステージが浅い睡眠として書き込まれ、誰も測定していない睡眠になってしまうことです。Androidでは、ヘルスコネクトへの書き込みは任意です。FitMeshのスイッチ1つでオンにでき、その設定はその端末でのあなたのアカウントに適用されます。ヘルスコネクトの権限も必要です。スイッチがオフの間、FitMeshはヘルスコネクトにデータを書き込みません。",
        fr: "FitMesh lit le sommeil dans Apple Santé et Health Connect et l'affiche dans son application. Dans cette version, FitMesh n'écrit pas le sommeil dans Apple Santé. L'une des raisons : une phase de sommeil dont l'étiquette n'est pas reconnue serait écrite comme sommeil léger, c'est-à-dire comme un sommeil que personne n'a mesuré. Sur Android, l'écriture vers Health Connect est facultative : elle s'active avec un seul interrupteur dans FitMesh, valable pour votre compte sur ce téléphone, et demande aussi les autorisations de Health Connect. Interrupteur désactivé, FitMesh n'écrit aucune donnée dans Health Connect.",
      },
    },
    {
      q: {
        it: "Cosa accade se indosso l'Apple Watch mentre corro con l'orologio Garmin?",
        en: "What happens if I wear my Apple Watch while running with my Garmin watch?",
        de: "Was passiert, wenn ich die Apple Watch trage, während ich mit der Garmin-Uhr laufe?",
        ja: "Garminをつけて走る際、同時にApple Watchも装着していた場合はどうなりますか？",
        fr: "Que se passe-t-il si je porte mon Apple Watch tout en courant avec ma montre Garmin ?",
      },
      a: {
        it: "FitMesh non somma i passi contati dai due orologi. Su iPhone il totale del giorno viene da Apple Salute: FitMesh usa il totale che Apple Salute calcola unendo le sue fonti, oppure quello della singola fonte con più passi, se è più alto. Se anche il telefono Android ha passi per quel giorno, FitMesh usa una sola delle due fonti, scelta per affidabilità e copertura. L'allenamento registrato con Garmin compare in FitMesh se Garmin Connect lo condivide con Apple Salute o con Health Connect. Se un numero non ti torna, confrontalo con l'app del produttore.",
        en: "FitMesh does not add up the steps counted by the two watches. On iPhone the day's total comes from Apple Health: FitMesh uses the total Apple Health calculates across its sources, or the total of the single source with the most steps, if that one is higher. If the Android phone also has steps for that day, FitMesh uses only one of the two sources, chosen by reliability and coverage. The workout recorded with Garmin appears in FitMesh if Garmin Connect shares it with Apple Health or Health Connect. If a number does not look right to you, compare it with the manufacturer's app.",
        de: "FitMesh addiert die von den beiden Uhren gezählten Schritte nicht. Auf dem iPhone kommt die Tagessumme aus Apple Health: FitMesh verwendet die Summe, die Apple Health über seine Quellen hinweg berechnet, oder die Summe der einzelnen Quelle mit den meisten Schritten, wenn diese höher ist. Hat auch das Android-Smartphone Schritte für diesen Tag, verwendet FitMesh nur eine der beiden Quellen, gewählt nach Zuverlässigkeit und Abdeckung. Das mit Garmin aufgezeichnete Training erscheint in FitMesh, wenn Garmin Connect es mit Apple Health oder Health Connect teilt. Wenn Ihnen eine Zahl nicht stimmig erscheint, vergleichen Sie sie mit der App des Herstellers.",
        ja: "FitMeshは、2つの時計が数えた歩数を足し合わせません。iPhoneでは1日の合計はAppleヘルスケアから取得し、Appleヘルスケアが複数のソースをまとめて計算した合計か、最も歩数の多い単一ソースの合計のうち、大きいほうを使います。Androidスマートフォンにもその日の歩数がある場合は、信頼性とカバー範囲で選んだどちらか1つのソースだけを使います。Garminで記録したワークアウトは、Garmin ConnectがAppleヘルスケアまたはヘルスコネクトと共有していれば、FitMeshに表示されます。数値に違和感がある場合は、メーカーのアプリと比べてみてください。",
        fr: "FitMesh n'additionne pas les pas comptés par les deux montres. Sur iPhone, le total de la journée vient d'Apple Santé : FitMesh utilise le total qu'Apple Santé calcule en réunissant ses sources, ou celui de la source unique qui a le plus de pas, s'il est plus élevé. Si le téléphone Android a aussi des pas pour cette journée, FitMesh n'utilise qu'une des deux sources, choisie selon la fiabilité et la couverture. L'entraînement enregistré avec Garmin apparaît dans FitMesh si Garmin Connect le partage avec Apple Santé ou Health Connect. Si un chiffre ne vous semble pas juste, comparez-le avec l'application du fabricant.",
      },
    },
    // FAQ presente solo finche la dashboard web non e disponibile (CAPABILITY_STATUS).
    ...(isFeatureAvailable("webDashboard")
      ? []
      : [
          {
            q: {
              it: "La dashboard web desktop è già utilizzabile per visualizzare questi dati?",
              en: "Is the desktop web dashboard currently available to view these metrics?",
              de: "Ist das Desktop-Web-Dashboard bereits verfügbar, um diese Daten einzusehen?",
              ja: "パソコンのブラウザからWebダッシュボードを使ってこれらのデータを閲覧できますか？",
              fr: "Le tableau de bord web sur ordinateur est-il déjà disponible pour consulter ces données ?",
            },
            a: {
              it: statoEDoveSiConsulta("it"),
              en: statoEDoveSiConsulta("en"),
              de: statoEDoveSiConsulta("de"),
              ja: statoEDoveSiConsulta("ja"),
              fr: statoEDoveSiConsulta("fr"),
            },
          },
        ]),
  ],
  sources: [
    "https://support.garmin.com/en-AU/?faq=lK5FPB9iPF5PXFkIpFlFPA",
    "https://support.garmin.com/en-IN/?faq=JToBEy0jfe6pIygark2Ui5",
    "https://support.polar.com/ca-en/support/connecting_polar_flow_with_apple_health",
    "https://support.polar.com/tw-en/flow-app-health-connect",
  ],
  brandsMentioned: ["Apple", "Garmin", "Polar", "Samsung"],
  related: [
    "garmin-samsung-health-sync-guide",
    "polar-health-connect-sync",
    "garmin-body-battery-health-connect",
  ],
};
