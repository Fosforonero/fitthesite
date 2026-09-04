import type { BlogPost } from "../types";

/**
 * Guida esplicativa "come funziona FitMesh" con screenshot reali anonimizzati
 * (in inglese). SEO/GEO: definizione citabile in apertura, TL;DR, tabella,
 * FAQ ricca (FAQPage JSON-LD). Schermate via sezioni `image`. it/en/es/de/pt/fr.
 */
export const post: BlogPost = {
  slug: "come-funziona-fitmesh",
  category: "guides",
  publishedAt: "2026-07-03",
  // P1.5B Fase C (2026-08-05): revisione contenuto reale (nuove sezioni
  // it/en, non solo metadata) — updatedAt aggiornato, a differenza del
  // micro-fix Fase A dove non andava toccato.
  updatedAt: "2026-08-05",
  // Non localizzato: riflette la lunghezza it/en (post-Fase C, più lungo).
  // Leggera imprecisione per es/de/pt/fr (contenuto invariato, più corto) —
  // accettata: campo cosmetico (tempo di lettura stimato), non un claim
  // fattuale verificabile.
  readMinutes: 11,
  hero: {
    kicker: {
      it: "Guida",
      en: "Guide",
      es: "Guía",
      de: "Leitfaden",
      pt: "Guia",
      fr: "Guide",
    },
    title: {
      // P1.5B Fase C: titolo esteso da "come funziona" a "cos'è + come
      // funziona" per riflettere la copertura ampliata (self-host,
      // cancellazione, metriche non disponibili). Solo it/en: le altre 4
      // locale non ricevono i nuovi contenuti in questo sprint, restano
      // sul titolo/scopo originale invariato.
      it: "Cos'è FitMesh e come funziona",
      en: "What Is FitMesh and How Does It Work?",
      es: "Cómo funciona FitMesh: tu anillo y tu reloj en un solo panel",
      de: "So funktioniert FitMesh: Ring und Uhr in einem Dashboard",
      pt: "Como funciona o FitMesh: seu anel e seu relógio em um único painel",
      fr: "Comment fonctionne FitMesh : votre bague et votre montre dans un seul tableau de bord",
    },
    subtitle: {
      it: "FitMesh Sync legge i dati dei tuoi wearable, incluso l'anello Colmi via Bluetooth, li unisce senza doppioni e li mostra in un'unica dashboard web. Ecco come funziona, schermata per schermata.",
      en: "FitMesh Sync reads your wearables' data, including the Colmi ring over Bluetooth, merges it without duplicates and shows it in one web dashboard. Here's how it works, screen by screen.",
      es: "FitMesh Sync lee los datos de tus wearables, incluido el anillo Colmi por Bluetooth, los unifica sin duplicados y los muestra en un único panel web. Así funciona, pantalla a pantalla.",
      de: "FitMesh Sync liest die Daten deiner Wearables, darunter den Colmi-Ring über Bluetooth, führt sie ohne Duplikate zusammen und zeigt sie in einem einzigen Web-Dashboard. So funktioniert es, Bildschirm für Bildschirm.",
      pt: "O FitMesh Sync lê os dados dos seus wearables, incluindo o anel Colmi por Bluetooth, une tudo sem duplicatas e mostra em um único painel na web. Veja como funciona, tela por tela.",
      fr: "FitMesh Sync lit les données de vos wearables, y compris la bague Colmi via Bluetooth, les fusionne sans doublons et les affiche dans un seul tableau de bord web. Voici comment ça marche, écran par écran.",
    },
  },
  metaDescription: {
    // P1.5B Fase C: solo it/en riportate a 140-160 caratteri (erano 181/184)
    // e aggiornate per riflettere lo scope ampliato (privacy/cancellazione/
    // limiti). es/de/pt/fr invariate: nessun nuovo contenuto per quelle locale.
    it: "Cos'è FitMesh e come funziona: legge anello Colmi e smartwatch, unisce i dati senza doppioni in un'unica dashboard. Privacy, cancellazione e limiti spiegati.",
    en: "What FitMesh is and how it works: reads your Colmi ring and smartwatch, merges data with no duplicates in one dashboard. Privacy, deletion and limits explained.",
    es: "Cómo funciona FitMesh Sync: lee el anillo Colmi por Bluetooth y el smartwatch mediante Health Connect, unifica los datos sin duplicados en un único panel web. Guía con capturas reales.",
    de: "So funktioniert FitMesh Sync: Es liest den Colmi-Ring über Bluetooth und deine Smartwatch über Health Connect und führt die Daten ohne Duplikate in einem Web-Dashboard zusammen. Anleitung mit echten Screenshots.",
    pt: "Como funciona o FitMesh Sync: lê o anel Colmi por Bluetooth e o smartwatch via Health Connect, une os dados sem duplicatas em um único painel na web. Guia com capturas de tela reais.",
    fr: "Comment fonctionne FitMesh Sync : il lit la bague Colmi via Bluetooth et votre montre connectée via Health Connect, fusionne les données sans doublons dans un seul tableau de bord web. Guide avec de vraies captures d'écran.",
  },
  primaryKeyword: {
    it: "come funziona fitmesh",
    en: "how fitmesh works",
    es: "cómo funciona fitmesh",
    de: "wie funktioniert fitmesh",
    pt: "como funciona o fitmesh",
    fr: "comment fonctionne fitmesh",
  },
  secondaryKeywords: {
    it: [
      "fitmesh cos'è",
      "fitmesh dashboard",
      "fitmesh anello colmi",
      "fitmesh health connect",
      "unire dati anello e orologio",
      "app unica dati wearable",
      "vedere dati wearable sul web",
    ],
    en: [
      "what is fitmesh",
      "fitmesh dashboard",
      "fitmesh colmi ring",
      "fitmesh health connect",
      "merge ring and watch data",
      "one app for wearable data",
      "see wearable data on the web",
    ],
    es: [
      "qué es fitmesh",
      "fitmesh panel",
      "fitmesh anillo colmi",
      "fitmesh health connect",
      "unir datos de anillo y reloj",
      "una sola app para datos de wearables",
      "ver datos de wearables en la web",
    ],
    de: [
      "was ist fitmesh",
      "fitmesh dashboard",
      "fitmesh colmi ring",
      "fitmesh health connect",
      "ring- und uhrdaten zusammenführen",
      "eine app für wearable-daten",
      "wearable-daten im web ansehen",
    ],
    pt: [
      "o que é fitmesh",
      "fitmesh painel",
      "fitmesh anel colmi",
      "fitmesh health connect",
      "unir dados de anel e relógio",
      "um app para dados de wearables",
      "ver dados de wearables na web",
    ],
    fr: [
      "qu'est-ce que fitmesh",
      "fitmesh tableau de bord",
      "fitmesh bague colmi",
      "fitmesh health connect",
      "fusionner les données de bague et de montre",
      "une seule app pour les données wearables",
      "voir les données wearables sur le web",
    ],
  },
  tldr: {
    it: [
      "FitMesh Sync è un'app che raccoglie i dati dei tuoi wearable e li mostra in un'unica dashboard, sul telefono e sul web.",
      "Legge l'anello Colmi direttamente via Bluetooth e lo smartwatch tramite Health Connect su Android.",
      "Unisce le fonti con la deduplicazione: quando più dispositivi registrano lo stesso dato, sceglie il valore migliore invece di sommarli.",
      "Per ogni metrica vedi da quale app arriva il dato (passi, sonno, frequenza cardiaca, SpO2).",
      "I dati restano sul tuo account. App Android disponibile ora; app iOS già live in tutti gli store supportati, incluse tutte le storefront dell'Unione Europea.",
    ],
    en: [
      "FitMesh Sync is an app that gathers your wearables' data and shows it in one dashboard, on your phone and on the web.",
      "It reads the Colmi ring directly over Bluetooth and your smartwatch through Health Connect on Android.",
      "It merges the sources with deduplication: when multiple devices record the same data, it picks the best value instead of adding them up.",
      "For each metric you can see which app provided the data (steps, sleep, heart rate, SpO2).",
      "Your data stays on your account. Android app available now; the iOS app is already live in all supported storefronts, including the EU.",
    ],
    es: [
      "FitMesh Sync es una app que reúne los datos de tus wearables y los muestra en un único panel, en el móvil y en la web.",
      "Lee el anillo Colmi directamente por Bluetooth y el smartwatch a través de Health Connect en Android.",
      "Unifica las fuentes con la deduplicación: cuando varios dispositivos registran el mismo dato, elige el mejor valor en lugar de sumarlos.",
      "En cada métrica puedes ver de qué app procede el dato (pasos, sueño, frecuencia cardíaca, SpO2).",
      "Tus datos se quedan en tu cuenta. App Android disponible ya; la app iOS ya está disponible en todas las tiendas compatibles, incluidas todas las tiendas de la Unión Europea.",
    ],
    de: [
      "FitMesh Sync ist eine App, die die Daten deiner Wearables sammelt und in einem einzigen Dashboard anzeigt, auf dem Handy und im Web.",
      "Sie liest den Colmi-Ring direkt über Bluetooth und deine Smartwatch über Health Connect unter Android.",
      "Sie führt die Quellen per Deduplizierung zusammen: Wenn mehrere Geräte denselben Wert erfassen, wählt sie den besten Wert, statt sie zu addieren.",
      "Bei jeder Metrik siehst du, welche App die Daten geliefert hat (Schritte, Schlaf, Herzfrequenz, SpO2).",
      "Deine Daten bleiben in deinem Konto. Android-App ab sofort verfügbar; die iOS-App ist bereits in allen unterstützten Stores live, einschließlich aller Storefronts der Europäischen Union.",
    ],
    pt: [
      "O FitMesh Sync é um app que reúne os dados dos seus wearables e mostra tudo em um único painel, no celular e na web.",
      "Ele lê o anel Colmi diretamente por Bluetooth e o smartwatch pelo Health Connect no Android.",
      "Une as fontes com a deduplicação: quando vários dispositivos registram o mesmo dado, escolhe o melhor valor em vez de somá-los.",
      "Em cada métrica você vê de qual app veio o dado (passos, sono, frequência cardíaca, SpO2).",
      "Seus dados ficam na sua conta. App Android disponível agora; app iOS já disponível em todas as lojas compatíveis, incluindo todas as lojas da União Europeia.",
    ],
    fr: [
      "FitMesh Sync est une app qui rassemble les données de vos wearables et les affiche dans un seul tableau de bord, sur votre téléphone et sur le web.",
      "Elle lit la bague Colmi directement via Bluetooth et votre montre connectée via Health Connect sur Android.",
      "Elle fusionne les sources grâce à la déduplication : quand plusieurs appareils enregistrent la même donnée, elle retient la meilleure valeur au lieu de les additionner.",
      "Pour chaque mesure, vous voyez quelle app a fourni la donnée (pas, sommeil, fréquence cardiaque, SpO2).",
      "Vos données restent sur votre compte. App Android disponible maintenant ; app iOS déjà disponible dans toutes les boutiques prises en charge, y compris toutes les boutiques de l'Union européenne.",
    ],
  },
  body: [
    {
      type: "paragraph",
      text: {
        it: "Se ti stai chiedendo come funziona FitMesh prima di provarlo, la risposta in una frase è questa: FitMesh Sync raccoglie i dati di tutti i tuoi wearable, incluso un anello smart economico, li unisce senza doppioni e te li mostra in un'unica dashboard, sul telefono e da qualsiasi browser. In questa guida lo vediamo schermata per schermata, con immagini reali dell'app.",
        en: "If you're wondering how FitMesh works before trying it, the one-sentence answer is this: FitMesh Sync gathers the data from all your wearables, including an affordable smart ring, merges it without duplicates and shows it to you in one dashboard, on your phone and from any browser. In this guide we go through it screen by screen, with real screenshots of the app.",
        es: "Si te preguntas cómo funciona FitMesh antes de probarlo, la respuesta en una frase es esta: FitMesh Sync reúne los datos de todos tus wearables, incluido un anillo inteligente económico, los unifica sin duplicados y te los muestra en un único panel, en el móvil y desde cualquier navegador. En esta guía lo vemos pantalla a pantalla, con imágenes reales de la app.",
        de: "Wenn du dich fragst, wie FitMesh funktioniert, bevor du es ausprobierst, lautet die Antwort in einem Satz: FitMesh Sync sammelt die Daten all deiner Wearables, darunter ein günstiger smarter Ring, führt sie ohne Duplikate zusammen und zeigt sie dir in einem einzigen Dashboard, auf dem Handy und in jedem Browser. In diesem Leitfaden gehen wir das Bildschirm für Bildschirm durch, mit echten Screenshots der App.",
        pt: "Se você está se perguntando como o FitMesh funciona antes de experimentar, a resposta em uma frase é esta: o FitMesh Sync reúne os dados de todos os seus wearables, incluindo um anel inteligente acessível, une tudo sem duplicatas e mostra em um único painel, no celular e em qualquer navegador. Neste guia, vamos ver tudo tela por tela, com imagens reais do app.",
        fr: "Si vous vous demandez comment fonctionne FitMesh avant de l'essayer, la réponse en une phrase est celle-ci : FitMesh Sync rassemble les données de tous vos wearables, y compris une bague connectée abordable, les fusionne sans doublons et vous les présente dans un seul tableau de bord, sur votre téléphone et depuis n'importe quel navigateur. Dans ce guide, nous parcourons tout écran par écran, avec de vraies captures d'écran de l'app.",
      },
    },
    {
      type: "heading",
      level: 2,
      text: {
        it: "Cos'è FitMesh, in breve",
        en: "What FitMesh is, in short",
        es: "Qué es FitMesh, en resumen",
        de: "Was FitMesh ist, kurz erklärt",
        pt: "O que é o FitMesh, em resumo",
        fr: "Ce qu'est FitMesh, en bref",
      },
    },
    {
      type: "paragraph",
      text: {
        it: "FitMesh Sync è un'app per la salute e il fitness che fa da ponte tra i tuoi dispositivi indossabili e una dashboard unificata. Molte persone usano un anello di notte e un orologio di giorno, ma i dati finiscono in app separate, ognuna con la sua vista parziale. FitMesh li mette insieme: una sola schermata con passi, frequenza cardiaca, sonno, SpO2, calorie e allenamenti, indipendentemente dal dispositivo che li ha registrati.",
        en: "FitMesh Sync is a health and fitness app that bridges your wearables and a unified dashboard. Many people wear a ring at night and a watch during the day, but the data ends up in separate apps, each with its own partial view. FitMesh brings it together: one screen with steps, heart rate, sleep, SpO2, calories and workouts, no matter which device recorded them.",
        es: "FitMesh Sync es una app de salud y fitness que hace de puente entre tus dispositivos wearables y un panel unificado. Mucha gente lleva un anillo de noche y un reloj de día, pero los datos acaban en apps separadas, cada una con su vista parcial. FitMesh los reúne: una sola pantalla con pasos, frecuencia cardíaca, sueño, SpO2, calorías y entrenamientos, sin importar qué dispositivo los registró.",
        de: "FitMesh Sync ist eine Gesundheits- und Fitness-App, die deine Wearables mit einem einheitlichen Dashboard verbindet. Viele Menschen tragen nachts einen Ring und tagsüber eine Uhr, doch die Daten landen in getrennten Apps, jede mit ihrer eigenen unvollständigen Sicht. FitMesh bringt alles zusammen: ein einziger Bildschirm mit Schritten, Herzfrequenz, Schlaf, SpO2, Kalorien und Workouts, egal welches Gerät sie aufgezeichnet hat.",
        pt: "O FitMesh Sync é um app de saúde e fitness que faz a ponte entre seus wearables e um painel unificado. Muita gente usa um anel à noite e um relógio de dia, mas os dados acabam em apps separados, cada um com sua visão parcial. O FitMesh reúne tudo: uma única tela com passos, frequência cardíaca, sono, SpO2, calorias e treinos, não importa qual dispositivo os registrou.",
        fr: "FitMesh Sync est une app de santé et de fitness qui fait le lien entre vos wearables et un tableau de bord unifié. Beaucoup de gens portent une bague la nuit et une montre le jour, mais les données finissent dans des apps séparées, chacune avec sa vue partielle. FitMesh rassemble le tout : un seul écran avec les pas, la fréquence cardiaque, le sommeil, la SpO2, les calories et les entraînements, quel que soit l'appareil qui les a enregistrés.",
      },
    },
    {
      type: "heading",
      level: 2,
      text: {
        it: "Tutti i tuoi dati in un'unica dashboard",
        en: "All your data in one dashboard",
        es: "Todos tus datos en un único panel",
        de: "Alle deine Daten in einem Dashboard",
        pt: "Todos os seus dados em um único painel",
        fr: "Toutes vos données dans un seul tableau de bord",
      },
    },
    {
      type: "paragraph",
      text: {
        it: "La schermata principale è la dashboard \"Oggi\": ogni scheda è una metrica, con il valore del giorno e la variazione rispetto al tuo trend. In un colpo d'occhio vedi passi, frequenza cardiaca, calorie, sonno, distanza, indice di recupero e il riepilogo degli allenamenti. Nessun salto tra app diverse.",
        en: "The main screen is the \"Today\" dashboard: each card is a metric, with the day's value and the change against your trend. At a glance you see steps, heart rate, calories, sleep, distance, a recovery index and your workout summary. No jumping between different apps.",
        es: "La pantalla principal es el panel \"Hoy\": cada tarjeta es una métrica, con el valor del día y la variación respecto a tu tendencia. De un vistazo ves pasos, frecuencia cardíaca, calorías, sueño, distancia, un índice de recuperación y el resumen de tus entrenamientos. Sin saltar entre apps distintas.",
        de: "Der Hauptbildschirm ist das Dashboard \"Heute\": Jede Karte ist eine Metrik, mit dem Tageswert und der Veränderung gegenüber deinem Trend. Auf einen Blick siehst du Schritte, Herzfrequenz, Kalorien, Schlaf, Distanz, einen Erholungsindex und die Zusammenfassung deiner Workouts. Kein Wechseln zwischen verschiedenen Apps.",
        pt: "A tela principal é o painel \"Hoje\": cada cartão é uma métrica, com o valor do dia e a variação em relação à sua tendência. De relance você vê passos, frequência cardíaca, calorias, sono, distância, um índice de recuperação e o resumo dos seus treinos. Sem pular entre apps diferentes.",
        fr: "L'écran principal est le tableau de bord \"Aujourd'hui\" : chaque carte est une mesure, avec la valeur du jour et l'évolution par rapport à votre tendance. D'un coup d'œil, vous voyez les pas, la fréquence cardiaque, les calories, le sommeil, la distance, un indice de récupération et le résumé de vos entraînements. Sans passer d'une app à l'autre.",
      },
    },
    {
      type: "image",
      src: "/blog/screenshots/come-funziona/01-dashboard.png",
      alt: {
        it: "Dashboard di FitMesh Sync con passi, frequenza cardiaca, calorie, sonno, distanza e indice di recupero in un'unica vista",
        en: "FitMesh Sync dashboard showing steps, heart rate, calories, sleep, distance and recovery index in one view",
        es: "Panel de FitMesh Sync con pasos, frecuencia cardíaca, calorías, sueño, distancia e índice de recuperación en una sola vista",
        de: "FitMesh Sync-Dashboard mit Schritten, Herzfrequenz, Kalorien, Schlaf, Distanz und Erholungsindex in einer Ansicht",
        pt: "Painel do FitMesh Sync com passos, frequência cardíaca, calorias, sono, distância e índice de recuperação em uma única visão",
        fr: "Tableau de bord FitMesh Sync affichant les pas, la fréquence cardiaque, les calories, le sommeil, la distance et l'indice de récupération en une seule vue",
      },
      caption: {
        it: "La dashboard \"Oggi\": tutte le metriche in un posto solo.",
        en: "The \"Today\" dashboard: every metric in one place.",
        es: "El panel \"Hoy\": todas las métricas en un solo lugar.",
        de: "Das Dashboard \"Heute\": alle Metriken an einem Ort.",
        pt: "O painel \"Hoje\": todas as métricas em um só lugar.",
        fr: "Le tableau de bord \"Aujourd'hui\" : toutes les mesures au même endroit.",
      },
      width: 720,
      height: 1560,
      narrow: true,
    },
    {
      type: "heading",
      level: 2,
      text: {
        it: "Da dove vengono i dati (e perché non ci sono doppioni)",
        en: "Where the data comes from (and why there are no duplicates)",
        es: "De dónde vienen los datos (y por qué no hay duplicados)",
        de: "Woher die Daten kommen (und warum es keine Duplikate gibt)",
        pt: "De onde vêm os dados (e por que não há duplicatas)",
        fr: "D'où viennent les données (et pourquoi il n'y a pas de doublons)",
      },
    },
    {
      type: "paragraph",
      text: {
        it: "Questa è la parte che rende FitMesh diverso. Il Centro sincronizzazione mostra, per ogni metrica, quale app ha fornito il dato all'ultima sincronizzazione: i passi da Samsung Health, il sonno da Google, le calorie attive calcolate da FitMesh, e così via. Quando più fonti registrano la stessa cosa nello stesso momento, la deduplicazione sceglie il dato migliore invece di sommarli: lo stesso passo non viene contato due volte. Puoi approfondire il tema in [più smartwatch insieme senza dati doppi](/it/blog/piu-smartwatch-insieme-dati-doppi).",
        en: "This is the part that makes FitMesh different. The Sync Center shows, for each metric, which app provided the data at the last sync: steps from Samsung Health, sleep from Google, active calories computed by FitMesh, and so on. When multiple sources record the same thing at the same time, deduplication picks the best value instead of adding them up: the same step is never counted twice. You can dig deeper in [multiple smartwatches together without double data](/en/blog/piu-smartwatch-insieme-dati-doppi).",
        es: "Esta es la parte que hace diferente a FitMesh. El Centro de sincronización muestra, en cada métrica, qué app aportó el dato en la última sincronización: los pasos desde Samsung Health, el sueño desde Google, las calorías activas calculadas por FitMesh, y así sucesivamente. Cuando varias fuentes registran lo mismo en el mismo momento, la deduplicación elige el mejor dato en lugar de sumarlos: el mismo paso nunca se cuenta dos veces. Puedes profundizar en [varios smartwatches juntos sin datos duplicados](/es/blog/piu-smartwatch-insieme-dati-doppi).",
        de: "Das ist der Teil, der FitMesh anders macht. Das Sync-Center zeigt für jede Metrik, welche App die Daten bei der letzten Synchronisierung geliefert hat: die Schritte von Samsung Health, den Schlaf von Google, die von FitMesh berechneten aktiven Kalorien und so weiter. Wenn mehrere Quellen dasselbe zur selben Zeit aufzeichnen, wählt die Deduplizierung den besten Wert, statt sie zu addieren: Derselbe Schritt wird nie doppelt gezählt. Mehr dazu in [mehrere Smartwatches zusammen ohne doppelte Daten](/de/blog/piu-smartwatch-insieme-dati-doppi).",
        pt: "Esta é a parte que torna o FitMesh diferente. A Central de sincronização mostra, em cada métrica, qual app forneceu o dado na última sincronização: os passos do Samsung Health, o sono do Google, as calorias ativas calculadas pelo FitMesh, e assim por diante. Quando várias fontes registram a mesma coisa no mesmo momento, a deduplicação escolhe o melhor dado em vez de somá-los: o mesmo passo nunca é contado duas vezes. Você pode se aprofundar em [vários smartwatches juntos sem dados duplicados](/pt/blog/piu-smartwatch-insieme-dati-doppi).",
        fr: "C'est ce qui rend FitMesh différent. Le Centre de synchronisation indique, pour chaque mesure, quelle app a fourni la donnée lors de la dernière synchronisation : les pas depuis Samsung Health, le sommeil depuis Google, les calories actives calculées par FitMesh, et ainsi de suite. Quand plusieurs sources enregistrent la même chose au même moment, la déduplication choisit la meilleure valeur au lieu de les additionner : le même pas n'est jamais compté deux fois. Pour aller plus loin : [plusieurs montres connectées ensemble sans données en double](/fr/blog/piu-smartwatch-insieme-dati-doppi).",
      },
    },
    {
      type: "image",
      src: "/blog/screenshots/come-funziona/02-sync-center.png",
      alt: {
        it: "Centro sincronizzazione di FitMesh: per ogni metrica mostra l'app di provenienza del dato, con deduplicazione tra le fonti",
        en: "FitMesh Sync Center showing the source app for each metric, with deduplication across sources",
        es: "Centro de sincronización de FitMesh: muestra la app de origen de cada métrica, con deduplicación entre fuentes",
        de: "FitMesh Sync-Center: zeigt für jede Metrik die Quell-App, mit Deduplizierung über alle Quellen",
        pt: "Central de sincronização do FitMesh: mostra o app de origem de cada métrica, com deduplicação entre as fontes",
        fr: "Centre de synchronisation FitMesh : affiche l'app source de chaque mesure, avec déduplication entre les sources",
      },
      caption: {
        it: "Per ogni metrica vedi da dove arriva il dato. Niente somme sbagliate.",
        en: "For each metric you see where the data comes from. No wrong sums.",
        es: "En cada métrica ves de dónde viene el dato. Sin sumas erróneas.",
        de: "Bei jeder Metrik siehst du, woher die Daten kommen. Keine falschen Summen.",
        pt: "Em cada métrica você vê de onde vem o dado. Sem somas erradas.",
        fr: "Pour chaque mesure, vous voyez d'où vient la donnée. Aucune somme erronée.",
      },
      width: 720,
      height: 1560,
      narrow: true,
    },
    // P1.5B Fase C: sezione nuova, solo it/en (le altre 4 locale non
    // ricevono i nuovi contenuti in questo sprint). Fa da "diagramma
    // semantico dei percorsi" richiesto dal mandato in forma di tabella
    // (nel codebase non esiste un block-type "diagram" nativo — vedi
    // lib/blog/types.ts: aggiungerne uno sarebbe un cambio strutturale più
    // ampio, non giustificato per un deliverable che resta in PR non
    // mergiata). Copre esplicitamente il canale Samsung Health Data SDK
    // diretto, mai menzionato altrove in questo post.
    {
      type: "heading",
      level: 2,
      locales: ["it", "en"],
      text: {
        it: "Da dove arriva ogni dato: sorgente, percorso, cosa raccoglie",
        en: "Where each data point comes from: source, path, what it collects",
      },
    },
    {
      type: "paragraph",
      locales: ["it", "en"],
      text: {
        it: "FitMesh non usa un solo canale per raccogliere i dati: ogni tipo di dispositivo passa da un percorso tecnico diverso. Ecco la mappa completa, sorgente per sorgente.",
        en: "FitMesh doesn't use a single channel to collect data: each type of device goes through a different technical path. Here's the full map, source by source.",
      },
    },
    // P1.5C: diagramma semantico del percorso dati come sequenza HTML reale
    // (vedi BlogSection "flow-diagram" in lib/blog/types.ts, render in
    // BlogRenderer.tsx) — non un'immagine generata. Stessi 5 percorsi
    // rappresentati anche nella tabella sotto (mandato: diagramma E tabella
    // come elementi distinti).
    {
      type: "flow-diagram",
      locales: ["it", "en"],
      title: {
        it: "Percorso dati per sorgente",
        en: "Data path by source",
      },
      flows: [
        { steps: { it: ["Anello Colmi", "Bluetooth diretto", "FitMesh"], en: ["Colmi ring", "Direct Bluetooth", "FitMesh"] } },
        { steps: { it: ["Smartwatch Android", "Health Connect", "FitMesh"], en: ["Android smartwatch", "Health Connect", "FitMesh"] } },
        { steps: { it: ["Galaxy Watch", "Samsung Health Data SDK", "FitMesh"], en: ["Galaxy Watch", "Samsung Health Data SDK", "FitMesh"] } },
        { steps: { it: ["Apple Watch", "Apple HealthKit", "FitMesh"], en: ["Apple Watch", "Apple HealthKit", "FitMesh"] } },
        { steps: { it: ["Provider esterni", "API del provider", "FitMesh"], en: ["External providers", "Provider's own API", "FitMesh"] } },
      ],
    },
    {
      type: "table",
      locales: ["it", "en"],
      caption: {
        it: "Sorgente, percorso tecnico e dati raccolti",
        en: "Source, technical path and data collected",
      },
      headers: {
        it: ["Sorgente", "Percorso", "Dati raccolti"],
        en: ["Source", "Path", "Data collected"],
      },
      rows: [
        {
          it: ["Anello Colmi", "Bluetooth diretto (nessun intermediario)", "Passi, battito, SpO2, sonno con fasi, stress, batteria"],
          en: ["Colmi ring", "Direct Bluetooth (no intermediary)", "Steps, heart rate, SpO2, sleep with stages, stress, battery"],
        },
        {
          it: ["Smartwatch Android (generico)", "Health Connect", "Qualsiasi dato che il dispositivo scrive su Health Connect"],
          en: ["Android smartwatch (generic)", "Health Connect", "Whatever data the device writes to Health Connect"],
        },
        {
          it: ["Samsung Galaxy Watch", "Samsung Health Data SDK, canale diretto e in sola lettura, indipendente da Health Connect", "Passi, frequenza cardiaca, sonno"],
          en: ["Samsung Galaxy Watch", "Samsung Health Data SDK, a direct read-only channel, independent of Health Connect", "Steps, heart rate, sleep"],
        },
        {
          it: ["Apple Watch (iPhone)", "Apple HealthKit", "Passi, frequenza cardiaca, sonno, allenamenti"],
          en: ["Apple Watch (iPhone)", "Apple HealthKit", "Steps, heart rate, sleep, workouts"],
        },
        {
          it: ["Provider esterni (Strava, Suunto, Oura in arrivo)", "API del provider, collegamento dalla sezione provider esterni", "Allenamenti e metriche specifiche del provider collegato"],
          en: ["External providers (Strava, Suunto, Oura coming soon)", "The provider's own API, connected from the external providers section", "Workouts and metrics specific to the connected provider"],
        },
      ],
    },
    {
      type: "heading",
      level: 2,
      locales: ["it", "en"],
      text: {
        it: "Cosa non arriva mai a FitMesh",
        en: "What never reaches FitMesh",
      },
    },
    {
      type: "paragraph",
      locales: ["it", "en"],
      text: {
        it: "Non tutte le metriche che il tuo dispositivo misura arrivano a FitMesh: dipende da cosa il sistema operativo o l'app del produttore mette a disposizione. Alcuni esempi concreti: Apple Health non espone dati HRV a grana fine agli sviluppatori esterni, solo valori aggregati; Health Connect non include peso corporeo o HRV per alcuni produttori; alcune metriche proprietarie, per esempio punteggi di fitness calcolati internamente da un'app, restano dentro l'app originale e non vengono mai scritte su Health Connect o HealthKit, quindi FitMesh non le vede. FitMesh non inventa né stima i dati mancanti: se una metrica non arriva dal sistema operativo o dal provider, semplicemente non compare.",
        en: "Not every metric your device measures makes it to FitMesh: it depends on what the operating system or the manufacturer's app actually exposes. A few concrete examples: Apple Health doesn't expose fine-grained HRV data to external developers, only aggregated values; Health Connect doesn't include body weight or HRV for some manufacturers; some proprietary metrics, for example fitness scores computed internally by an app, stay inside the original app and are never written to Health Connect or HealthKit, so FitMesh never sees them. FitMesh doesn't invent or estimate missing data: if a metric doesn't arrive from the OS or the provider, it simply doesn't show up.",
      },
    },
    // P1.5C: CTA progressiva #1 verso /integrations (funnel: percorso dati ->
    // integrazioni). Traccia cta_view/cta_click via data-cta-id/data-cta-placement
    // (OutboundTracker.tsx), zero dati personali/sanitari nell'evento.
    {
      type: "cta",
      locales: ["it", "en"],
      title: {
        it: "Vedi quali dispositivi si collegano davvero",
        en: "See which devices actually connect",
      },
      body: {
        it: "Non solo anello e smartwatch: FitMesh si integra anche con provider come Strava e Suunto. La pagina Integrazioni elenca tutto quello che puoi collegare oggi.",
        en: "Not just ring and smartwatch: FitMesh also integrates with providers like Strava and Suunto. The Integrations page lists everything you can connect today.",
      },
      ctaLabel: {
        it: "Vedi le integrazioni →",
        en: "See integrations →",
      },
      ctaHref: {
        it: "/it/integrations",
        en: "/en/integrations",
      },
      ctaId: "blog-come-funziona-fitmesh-integrations-cta",
      ctaPlacement: "blog_body_mid",
    },
    {
      type: "heading",
      level: 2,
      text: {
        it: "Il tuo anello smart, letto via Bluetooth",
        en: "Your smart ring, read over Bluetooth",
        es: "Tu anillo inteligente, leído por Bluetooth",
        de: "Dein smarter Ring, gelesen über Bluetooth",
        pt: "Seu anel inteligente, lido por Bluetooth",
        fr: "Votre bague connectée, lue via Bluetooth",
      },
    },
    {
      type: "paragraph",
      text: {
        it: "FitMesh legge l'anello Colmi direttamente via Bluetooth, senza dover tenere aperta l'app del produttore. Dalla sezione \"Anello smart\" lo colleghi e, con \"Measure now\", fai una misura al volo di frequenza cardiaca e ossigeno nel sangue. I dati dell'anello (passi, battito, SpO2, sonno con fasi, stress, batteria) entrano nella stessa dashboard degli altri dispositivi. Sono misure di benessere di consumo, non strumenti diagnostici. Guida completa: [anello Colmi con FitMesh](/it/blog/colmi-ring-fitmesh).",
        en: "FitMesh reads the Colmi ring directly over Bluetooth, with no need to keep the maker's app open. From the \"Smart ring\" section you connect it and, with \"Measure now\", take an on-the-spot reading of heart rate and blood oxygen. The ring's data (steps, heart rate, SpO2, sleep with stages, stress, battery) flows into the same dashboard as your other devices. These are consumer wellness measurements, not diagnostic tools. Full guide: [the Colmi ring with FitMesh](/en/blog/colmi-ring-fitmesh).",
        es: "FitMesh lee el anillo Colmi directamente por Bluetooth, sin necesidad de mantener abierta la app del fabricante. Desde la sección \"Anillo inteligente\" lo conectas y, con \"Measure now\", haces una medición al momento de frecuencia cardíaca y oxígeno en sangre. Los datos del anillo (pasos, pulsaciones, SpO2, sueño con fases, estrés, batería) entran en el mismo panel que tus otros dispositivos. Son mediciones de bienestar de consumo, no herramientas de diagnóstico. Guía completa: [el anillo Colmi con FitMesh](/es/blog/colmi-ring-fitmesh).",
        de: "FitMesh liest den Colmi-Ring direkt über Bluetooth, ohne dass du die App des Herstellers geöffnet lassen musst. Im Bereich \"Smarter Ring\" verbindest du ihn und machst mit \"Measure now\" eine spontane Messung von Herzfrequenz und Blutsauerstoff. Die Daten des Rings (Schritte, Herzfrequenz, SpO2, Schlaf mit Phasen, Stress, Akku) fließen in dasselbe Dashboard wie deine anderen Geräte. Das sind Wellness-Messungen für den Alltag, keine diagnostischen Werkzeuge. Vollständige Anleitung: [der Colmi-Ring mit FitMesh](/de/blog/colmi-ring-fitmesh).",
        pt: "O FitMesh lê o anel Colmi diretamente por Bluetooth, sem precisar manter o app do fabricante aberto. Na seção \"Anel inteligente\" você o conecta e, com \"Measure now\", faz uma medição na hora da frequência cardíaca e do oxigênio no sangue. Os dados do anel (passos, batimentos, SpO2, sono com fases, estresse, bateria) entram no mesmo painel dos seus outros dispositivos. São medições de bem-estar de consumo, não ferramentas de diagnóstico. Guia completo: [o anel Colmi com o FitMesh](/pt/blog/colmi-ring-fitmesh).",
        fr: "FitMesh lit la bague Colmi directement via Bluetooth, sans avoir à garder l'app du fabricant ouverte. Depuis la section \"Bague connectée\", vous la connectez et, avec \"Measure now\", vous prenez une mesure instantanée de la fréquence cardiaque et de l'oxygène dans le sang. Les données de la bague (pas, fréquence cardiaque, SpO2, sommeil avec phases, stress, batterie) arrivent dans le même tableau de bord que vos autres appareils. Ce sont des mesures de bien-être grand public, pas des outils de diagnostic. Guide complet : [la bague Colmi avec FitMesh](/fr/blog/colmi-ring-fitmesh).",
      },
    },
    {
      type: "image",
      src: "/blog/screenshots/come-funziona/03-smart-ring.png",
      alt: {
        it: "Schermata anello smart di FitMesh: misura al volo di frequenza cardiaca e SpO2 e collegamento dell'anello Colmi via Bluetooth",
        en: "FitMesh smart ring screen: on-the-spot heart rate and SpO2 measurement and Colmi ring pairing over Bluetooth",
        es: "Pantalla del anillo inteligente de FitMesh: medición al momento de frecuencia cardíaca y SpO2 y conexión del anillo Colmi por Bluetooth",
        de: "FitMesh-Bildschirm für den smarten Ring: spontane Messung von Herzfrequenz und SpO2 und Kopplung des Colmi-Rings über Bluetooth",
        pt: "Tela do anel inteligente do FitMesh: medição na hora de frequência cardíaca e SpO2 e conexão do anel Colmi por Bluetooth",
        fr: "Écran de la bague connectée FitMesh : mesure instantanée de la fréquence cardiaque et de la SpO2 et appairage de la bague Colmi via Bluetooth",
      },
      caption: {
        it: "L'anello Colmi collegato via Bluetooth, con misura istantanea di battito e SpO2.",
        en: "The Colmi ring connected over Bluetooth, with instant heart rate and SpO2 reading.",
        es: "El anillo Colmi conectado por Bluetooth, con medición instantánea de pulsaciones y SpO2.",
        de: "Der Colmi-Ring über Bluetooth verbunden, mit sofortiger Messung von Herzfrequenz und SpO2.",
        pt: "O anel Colmi conectado por Bluetooth, com medição instantânea de batimentos e SpO2.",
        fr: "La bague Colmi connectée via Bluetooth, avec mesure instantanée de la fréquence cardiaque et de la SpO2.",
      },
      width: 720,
      height: 1560,
      narrow: true,
    },
    {
      type: "heading",
      level: 2,
      text: {
        it: "Trend e storico",
        en: "Trends and history",
        es: "Tendencias e historial",
        de: "Trends und Verlauf",
        pt: "Tendências e histórico",
        fr: "Tendances et historique",
      },
    },
    {
      type: "paragraph",
      text: {
        it: "Oltre alla giornata, FitMesh tiene lo storico. Nella sezione Trend scegli il periodo (7 giorni, 30, 90 o un anno) e vedi medie, totali e la variazione di ogni metrica nel tempo: passi, sonno, recupero, HRV, frequenza a riposo. È il quadro d'insieme che una singola app del produttore raramente ti dà.",
        en: "Beyond the day itself, FitMesh keeps your history. In the Trends section you pick the range (7 days, 30, 90 or a year) and see averages, totals and how each metric changes over time: steps, sleep, recovery, HRV, resting heart rate. It's the bigger picture a single manufacturer app rarely gives you.",
        es: "Más allá del día en curso, FitMesh guarda tu historial. En la sección Tendencias eliges el periodo (7 días, 30, 90 o un año) y ves medias, totales y cómo cambia cada métrica con el tiempo: pasos, sueño, recuperación, HRV, frecuencia cardíaca en reposo. Es la visión de conjunto que una sola app del fabricante rara vez te da.",
        de: "Über den einzelnen Tag hinaus speichert FitMesh deinen Verlauf. Im Bereich Trends wählst du den Zeitraum (7 Tage, 30, 90 oder ein Jahr) und siehst Durchschnitte, Summen und wie sich jede Metrik im Lauf der Zeit verändert: Schritte, Schlaf, Erholung, HRV, Ruheherzfrequenz. Das ist der Gesamtüberblick, den dir eine einzelne Hersteller-App nur selten bietet.",
        pt: "Além do dia atual, o FitMesh guarda seu histórico. Na seção Tendências você escolhe o período (7 dias, 30, 90 ou um ano) e vê médias, totais e como cada métrica muda ao longo do tempo: passos, sono, recuperação, HRV, frequência cardíaca em repouso. É a visão geral que um único app do fabricante raramente oferece.",
        fr: "Au-delà de la journée en cours, FitMesh conserve votre historique. Dans la section Tendances, vous choisissez la période (7 jours, 30, 90 ou un an) et vous voyez les moyennes, les totaux et l'évolution de chaque mesure dans le temps : pas, sommeil, récupération, HRV, fréquence cardiaque au repos. C'est la vue d'ensemble qu'une seule app de fabricant vous offre rarement.",
      },
    },
    {
      type: "image",
      src: "/blog/screenshots/come-funziona/04-trends.png",
      alt: {
        it: "Sezione Trend di FitMesh con medie e totali su 7 giorni, indice di recupero, sonno, HRV e variazioni percentuali",
        en: "FitMesh Trends section with 7-day averages and totals, recovery index, sleep, HRV and percentage changes",
        es: "Sección Tendencias de FitMesh con medias y totales de 7 días, índice de recuperación, sueño, HRV y variaciones porcentuales",
        de: "FitMesh-Bereich Trends mit 7-Tage-Durchschnitten und -Summen, Erholungsindex, Schlaf, HRV und prozentualen Veränderungen",
        pt: "Seção Tendências do FitMesh com médias e totais de 7 dias, índice de recuperação, sono, HRV e variações percentuais",
        fr: "Section Tendances de FitMesh avec moyennes et totaux sur 7 jours, indice de récupération, sommeil, HRV et variations en pourcentage",
      },
      caption: {
        it: "Trend su 7, 30, 90 giorni o un anno: lo storico, non solo l'oggi.",
        en: "Trends over 7, 30, 90 days or a year: your history, not just today.",
        es: "Tendencias a 7, 30, 90 días o un año: tu historial, no solo el hoy.",
        de: "Trends über 7, 30, 90 Tage oder ein Jahr: dein Verlauf, nicht nur heute.",
        pt: "Tendências de 7, 30, 90 dias ou um ano: seu histórico, não só o hoje.",
        fr: "Tendances sur 7, 30, 90 jours ou un an : votre historique, pas seulement aujourd'hui.",
      },
      width: 720,
      height: 1560,
      narrow: true,
    },
    {
      type: "heading",
      level: 2,
      text: {
        it: "Tutto quello che puoi fare",
        en: "Everything you can do",
        es: "Todo lo que puedes hacer",
        de: "Alles, was du tun kannst",
        pt: "Tudo o que você pode fazer",
        fr: "Tout ce que vous pouvez faire",
      },
    },
    {
      type: "paragraph",
      text: {
        it: "Dal menu raggiungi tutte le funzioni: registrare un allenamento con cronometro, battito e distanza; i trend; collegare l'anello smart o gestire i dispositivi e la sincronizzazione via Health Connect; i provider esterni (Strava, Oura, Suunto e altri); impostazioni di profilo, obiettivi, unità e tema. C'è anche \"Condividi con AI\", che genera un testo con i tuoi dati da usare con un assistente.",
        en: "From the menu you reach every feature: record a workout with a timer, heart rate and distance; trends; connect the smart ring or manage devices and syncing via Health Connect; external providers (Strava, Oura, Suunto and more); settings for profile, goals, units and theme. There's also \"Share with AI\", which generates a text with your data to use with an assistant.",
        es: "Desde el menú llegas a todas las funciones: registrar un entrenamiento con cronómetro, pulsaciones y distancia; las tendencias; conectar el anillo inteligente o gestionar los dispositivos y la sincronización mediante Health Connect; los proveedores externos (Strava, Oura, Suunto y más); ajustes de perfil, objetivos, unidades y tema. También está \"Compartir con IA\", que genera un texto con tus datos para usar con un asistente.",
        de: "Über das Menü erreichst du alle Funktionen: ein Workout mit Timer, Herzfrequenz und Distanz aufzeichnen; die Trends; den smarten Ring verbinden oder Geräte und Synchronisierung über Health Connect verwalten; externe Anbieter (Strava, Oura, Suunto und mehr); Einstellungen für Profil, Ziele, Einheiten und Design. Es gibt auch \"Mit KI teilen\", das einen Text mit deinen Daten für einen Assistenten erzeugt.",
        pt: "No menu você acessa todas as funções: registrar um treino com cronômetro, batimentos e distância; as tendências; conectar o anel inteligente ou gerenciar os dispositivos e a sincronização via Health Connect; os provedores externos (Strava, Oura, Suunto e outros); ajustes de perfil, metas, unidades e tema. Há também \"Compartilhar com IA\", que gera um texto com seus dados para usar com um assistente.",
        fr: "Depuis le menu, vous accédez à toutes les fonctionnalités : enregistrer un entraînement avec chronomètre, fréquence cardiaque et distance ; les tendances ; connecter la bague connectée ou gérer les appareils et la synchronisation via Health Connect ; les fournisseurs externes (Strava, Oura, Suunto et d'autres) ; les réglages de profil, objectifs, unités et thème. Il y a aussi \"Partager avec l'IA\", qui génère un texte avec vos données à utiliser avec un assistant.",
      },
    },
    {
      type: "image",
      src: "/blog/screenshots/come-funziona/05-menu.png",
      alt: {
        it: "Menu di FitMesh con registra allenamento, trend, anello smart, dispositivi e sync, provider esterni e impostazioni",
        en: "FitMesh menu with record workout, trends, smart ring, devices and sync, external providers and settings",
        es: "Menú de FitMesh con registrar entrenamiento, tendencias, anillo inteligente, dispositivos y sincronización, proveedores externos y ajustes",
        de: "FitMesh-Menü mit Workout aufzeichnen, Trends, smarter Ring, Geräte und Synchronisierung, externe Anbieter und Einstellungen",
        pt: "Menu do FitMesh com registrar treino, tendências, anel inteligente, dispositivos e sincronização, provedores externos e ajustes",
        fr: "Menu FitMesh avec enregistrer un entraînement, tendances, bague connectée, appareils et synchronisation, fournisseurs externes et réglages",
      },
      caption: {
        it: "Il menu: allenamenti, anello, sincronizzazione, provider esterni e impostazioni.",
        en: "The menu: workouts, ring, syncing, external providers and settings.",
        es: "El menú: entrenamientos, anillo, sincronización, proveedores externos y ajustes.",
        de: "Das Menü: Workouts, Ring, Synchronisierung, externe Anbieter und Einstellungen.",
        pt: "O menu: treinos, anel, sincronização, provedores externos e ajustes.",
        fr: "Le menu : entraînements, bague, synchronisation, fournisseurs externes et réglages.",
      },
      width: 720,
      height: 1560,
      narrow: true,
    },
    {
      type: "heading",
      level: 2,
      text: {
        it: "Come iniziare, in 3 passi",
        en: "How to get started, in 3 steps",
        es: "Cómo empezar, en 3 pasos",
        de: "So legst du los, in 3 Schritten",
        pt: "Como começar, em 3 passos",
        fr: "Comment commencer, en 3 étapes",
      },
    },
    {
      type: "list",
      ordered: true,
      items: {
        it: [
          "Installa FitMesh Sync dal Play Store e accedi. Su Android autorizzi Health Connect, così l'app legge i dati del tuo smartwatch.",
          "Se hai un anello Colmi, aprilo dalla sezione \"Anello smart\" e collegalo via Bluetooth: passi, battito, SpO2 e sonno entrano nella dashboard.",
          "Apri la dashboard web dallo stesso account, da qualsiasi browser: ritrovi tutto unito e deduplicato, anche dal computer.",
        ],
        en: [
          "Install FitMesh Sync from the Play Store and sign in. On Android you grant Health Connect access, so the app reads your smartwatch data.",
          "If you have a Colmi ring, open the \"Smart ring\" section and connect it over Bluetooth: steps, heart rate, SpO2 and sleep flow into the dashboard.",
          "Open the web dashboard with the same account, from any browser: you find everything merged and deduplicated, from your computer too.",
        ],
        es: [
          "Instala FitMesh Sync desde el Play Store e inicia sesión. En Android das acceso a Health Connect, para que la app lea los datos de tu smartwatch.",
          "Si tienes un anillo Colmi, abre la sección \"Anillo inteligente\" y conéctalo por Bluetooth: pasos, pulsaciones, SpO2 y sueño entran en el panel.",
          "Abre el panel web con la misma cuenta, desde cualquier navegador: encuentras todo unido y deduplicado, también desde el ordenador.",
        ],
        de: [
          "Installiere FitMesh Sync aus dem Play Store und melde dich an. Unter Android erteilst du Health Connect die Berechtigung, damit die App die Daten deiner Smartwatch liest.",
          "Wenn du einen Colmi-Ring hast, öffne den Bereich \"Smarter Ring\" und verbinde ihn über Bluetooth: Schritte, Herzfrequenz, SpO2 und Schlaf fließen ins Dashboard.",
          "Öffne das Web-Dashboard mit demselben Konto, in jedem Browser: Du findest alles zusammengeführt und dedupliziert, auch am Computer.",
        ],
        pt: [
          "Instale o FitMesh Sync na Play Store e faça login. No Android você concede acesso ao Health Connect, para que o app leia os dados do seu smartwatch.",
          "Se você tem um anel Colmi, abra a seção \"Anel inteligente\" e conecte-o por Bluetooth: passos, batimentos, SpO2 e sono entram no painel.",
          "Abra o painel na web com a mesma conta, de qualquer navegador: você encontra tudo unido e deduplicado, também no computador.",
        ],
        fr: [
          "Installez FitMesh Sync depuis le Play Store et connectez-vous. Sous Android, vous accordez l'accès à Health Connect pour que l'app lise les données de votre montre connectée.",
          "Si vous avez une bague Colmi, ouvrez la section \"Bague connectée\" et connectez-la via Bluetooth : les pas, la fréquence cardiaque, la SpO2 et le sommeil arrivent dans le tableau de bord.",
          "Ouvrez le tableau de bord web avec le même compte, depuis n'importe quel navigateur : vous retrouvez tout, fusionné et dédupliqué, y compris depuis votre ordinateur.",
        ],
      },
    },
    // P1.5B Fase C: solo it/en — dettaglio della prima sincronizzazione,
    // testo-only (nessuno screenshot nuovo: il mandato vieta schermate
    // inventate/AI e non è possibile generare qui uno screenshot reale
    // dell'app).
    {
      type: "heading",
      level: 2,
      locales: ["it", "en"],
      text: {
        it: "La prima sincronizzazione, in dettaglio",
        en: "Your first sync, in detail",
      },
    },
    {
      type: "paragraph",
      locales: ["it", "en"],
      text: {
        it: "I 3 passi qui sopra bastano per iniziare, ma ecco cosa succede davvero al primo avvio. Su Android, quando apri FitMesh per la prima volta, il sistema ti chiede di autorizzare l'accesso a Health Connect: scegli quali categorie di dati condividere (passi, frequenza cardiaca, sonno, ecc.) e puoi cambiare idea in qualsiasi momento dalle impostazioni di Health Connect del telefono, non solo dentro FitMesh. Se hai un anello Colmi, il collegamento Bluetooth richiede che l'anello sia vicino e carico: la prima sincronizzazione dei dati storici, se l'anello li ha già registrati, può richiedere qualche minuto. Su iPhone, l'autorizzazione ad Apple Salute segue lo stesso principio: scegli quali categorie condividere, revocabile in qualsiasi momento dalle Impostazioni di iOS. In entrambi i casi, la prima dashboard che vedi potrebbe mostrare solo i dati degli ultimi giorni: lo storico più lontano si popola con le sincronizzazioni successive, non tutto insieme al primo avvio.",
        en: "The 3 steps above are enough to get started, but here's what actually happens on first launch. On Android, when you open FitMesh for the first time, the system asks you to authorize access to Health Connect: you choose which data categories to share (steps, heart rate, sleep, and so on), and you can change your mind at any time from your phone's Health Connect settings, not just inside FitMesh. If you have a Colmi ring, the Bluetooth connection requires the ring to be nearby and charged: the first sync of historical data, if the ring has already recorded any, can take a few minutes. On iPhone, Apple Health authorization follows the same principle: you choose which categories to share, revocable at any time from iOS Settings. In both cases, the first dashboard you see might only show the last few days of data: older history fills in over subsequent syncs, not all at once on first launch.",
      },
    },
    {
      type: "heading",
      level: 2,
      text: {
        it: "Cosa fa, per piattaforma",
        en: "What it does, by platform",
        es: "Qué hace, por plataforma",
        de: "Was es kann, je Plattform",
        pt: "O que ele faz, por plataforma",
        fr: "Ce qu'il fait, par plateforme",
      },
    },
    {
      type: "table",
      caption: {
        it: "Riepilogo delle funzioni principali di FitMesh Sync",
        en: "Summary of FitMesh Sync's main features",
        es: "Resumen de las funciones principales de FitMesh Sync",
        de: "Zusammenfassung der wichtigsten Funktionen von FitMesh Sync",
        pt: "Resumo das principais funções do FitMesh Sync",
        fr: "Résumé des principales fonctionnalités de FitMesh Sync",
      },
      headers: {
        it: ["Funzione", "Android", "iPhone"],
        en: ["Feature", "Android", "iPhone"],
        es: ["Función", "Android", "iPhone"],
        de: ["Funktion", "Android", "iPhone"],
        pt: ["Função", "Android", "iPhone"],
        fr: ["Fonctionnalité", "Android", "iPhone"],
      },
      rows: [
        {
          it: ["Legge lo smartwatch (Health Connect)", "Sì", "Sì (Apple Salute)"],
          en: ["Reads your smartwatch (Health Connect)", "Yes", "Yes (Apple Health)"],
          es: ["Lee tu smartwatch (Health Connect)", "Sí", "Sí (Apple Health)"],
          de: ["Liest deine Smartwatch (Health Connect)", "Ja", "Ja (Apple Health)"],
          pt: ["Lê seu smartwatch (Health Connect)", "Sim", "Sim (Apple Health)"],
          fr: ["Lit votre montre connectée (Health Connect)", "Oui", "Oui (Apple Health)"],
        },
        {
          it: ["Anello Colmi via Bluetooth", "Sì", "Sì"],
          en: ["Colmi ring over Bluetooth", "Yes", "Yes"],
          es: ["Anillo Colmi por Bluetooth", "Sí", "Sí"],
          de: ["Colmi-Ring über Bluetooth", "Ja", "Ja"],
          pt: ["Anel Colmi por Bluetooth", "Sim", "Sim"],
          fr: ["Bague Colmi via Bluetooth", "Oui", "Oui"],
        },
        {
          it: ["Deduplicazione tra fonti", "Sì", "Sì"],
          en: ["Deduplication across sources", "Yes", "Yes"],
          es: ["Deduplicación entre fuentes", "Sí", "Sí"],
          de: ["Deduplizierung über alle Quellen", "Ja", "Ja"],
          pt: ["Deduplicação entre as fontes", "Sim", "Sim"],
          fr: ["Déduplication entre les sources", "Oui", "Oui"],
        },
        {
          it: ["Dashboard web (stesso account)", "Sì", "Sì"],
          en: ["Web dashboard (same account)", "Yes", "Yes"],
          es: ["Panel web (misma cuenta)", "Sí", "Sí"],
          de: ["Web-Dashboard (dasselbe Konto)", "Ja", "Ja"],
          pt: ["Painel na web (mesma conta)", "Sim", "Sim"],
          fr: ["Tableau de bord web (même compte)", "Oui", "Oui"],
        },
        {
          it: ["Dati nel cloud", "Sì", "Sì"],
          en: ["Data in the cloud", "Yes", "Yes"],
          es: ["Datos en la nube", "Sí", "Sí"],
          de: ["Daten in der Cloud", "Ja", "Ja"],
          pt: ["Dados na nuvem", "Sim", "Sim"],
          fr: ["Données dans le cloud", "Oui", "Oui"],
        },
      ],
    },
    // P1.5C: CTA progressiva #2 verso /fitness-data-sync (funnel: compatibilità).
    {
      type: "cta",
      locales: ["it", "en"],
      title: {
        it: "Controlla la compatibilità del tuo dispositivo",
        en: "Check your device's compatibility",
      },
      body: {
        it: "Guarda la tabella completa di provider e dispositivi supportati, cosa si sincronizza e cosa no, aggiornata regolarmente.",
        en: "See the full table of supported providers and devices, what syncs and what doesn't, updated regularly.",
      },
      ctaLabel: {
        it: "Guarda la compatibilità →",
        en: "Check compatibility →",
      },
      ctaHref: {
        it: "/it/fitness-data-sync",
        en: "/en/fitness-data-sync",
      },
      ctaId: "blog-come-funziona-fitmesh-compatibility-cta",
      ctaPlacement: "blog_body_mid",
    },
    {
      type: "heading",
      level: 2,
      text: {
        it: "Privacy: i tuoi dati nel cloud",
        en: "Privacy: your data in the cloud",
        es: "Privacidad: tus datos en la nube",
        de: "Datenschutz: deine Daten in der Cloud",
        pt: "Privacidade: seus dados na nuvem",
        fr: "Confidentialité : vos données dans le cloud",
      },
    },
    {
      type: "paragraph",
      text: {
        it: "I dati salute restano sul tuo account. FitMesh non li vende e non mostra pubblicità: il servizio si sostiene con un piccolo abbonamento o uno sblocco a vita, e i primi 1000 iscritti founder (entro il 31 luglio 2026) hanno ricevuto il Pro a vita gratis. Se vuoi il dettaglio: [FitMesh è gratis? prezzo e posti founder](/it/blog/fitmesh-gratis-prezzo-founder).",
        en: "Your health data stays on your account. FitMesh doesn't sell it and shows no ads: the service is funded by a small subscription or a one-time lifetime unlock, and the first 1,000 founder sign-ups (by July 31, 2026) got lifetime Pro free. For the details: [is FitMesh free? pricing and founder spots](/en/blog/fitmesh-gratis-prezzo-founder).",
        es: "Tus datos de salud se quedan en tu cuenta. FitMesh no los vende y no muestra publicidad: el servicio se sostiene con una pequeña suscripción o un desbloqueo de por vida, y los primeros 1000 inscritos founder (hasta el 31 de julio de 2026) obtuvieron el Pro de por vida gratis. Si quieres el detalle: [¿FitMesh es gratis? precio y plazas founder](/es/blog/fitmesh-gratis-prezzo-founder).",
        de: "Deine Gesundheitsdaten bleiben in deinem Konto. FitMesh verkauft sie nicht und zeigt keine Werbung: Der Dienst finanziert sich über ein kleines Abo oder eine einmalige lebenslange Freischaltung, und die ersten 1.000 founder-Anmeldungen (bis 31. Juli 2026) haben Pro lebenslang gratis erhalten. Alle Details: [Ist FitMesh kostenlos? Preis und founder-Plätze](/de/blog/fitmesh-gratis-prezzo-founder).",
        pt: "Seus dados de saúde ficam na sua conta. O FitMesh não os vende e não mostra anúncios: o serviço se mantém com uma pequena assinatura ou um desbloqueio vitalício, e os primeiros 1000 inscritos founder (até 31 de julho de 2026) ganharam o Pro vitalício de graça. Para os detalhes: [o FitMesh é grátis? preço e vagas founder](/pt/blog/fitmesh-gratis-prezzo-founder).",
        fr: "Vos données de santé restent sur votre compte. FitMesh ne les vend pas et n'affiche aucune publicité : le service se finance par un petit abonnement ou un déblocage à vie, et les 1000 premiers inscrits founder (jusqu'au 31 juillet 2026) ont obtenu Pro à vie gratuitement. Pour les détails : [FitMesh est-il gratuit ? prix et places founder](/fr/blog/fitmesh-gratis-prezzo-founder).",
      },
    },
    // P1.5B Fase C: solo it/en — cancellazione, self-host, scope negativo,
    // fonti. Formulazioni allineate 1:1 a delete-account-copy.ts e
    // self-host-copy.ts (letti direttamente, non parafrasati): non
    // contraddicono i testi di riferimento su quelle pagine.
    {
      type: "heading",
      level: 2,
      locales: ["it", "en"],
      text: {
        it: "Cancellazione dati e account",
        en: "Deleting your data and account",
      },
    },
    {
      type: "paragraph",
      locales: ["it", "en"],
      text: {
        it: "Puoi cancellare l'account direttamente dall'app: essendo già autenticato sul dispositivo, la cancellazione è immediata. Le richieste inviate dalla dashboard web hanno invece un periodo di ripensamento di 24 ore prima di essere eseguite; quelle via email vengono eseguite dopo una verifica di identità. FitMesh non crea backup propri del database, ma il fornitore dell'infrastruttura può conservare copie tecniche di ripristino per un massimo di 7 giorni secondo il proprio ciclo interno; quei dati residui non vengono usati da FitMesh per il trattamento ordinario. Cancellare l'account FitMesh non tocca i dati che restano sui servizi terzi collegati (Health Connect, Apple Salute, Samsung Health, provider esterni): quelli si gestiscono separatamente, da ciascun servizio. Dettagli completi nella [pagina dedicata alla cancellazione account](/it/delete-account).",
        en: "You can delete your account directly from the app: since you're already signed in on that device, deletion is immediate. Requests made from the web dashboard instead have a 24-hour grace period before they're carried out; requests by email are carried out after an identity check. FitMesh doesn't create its own database backups, but the infrastructure provider may retain technical recovery copies for up to 7 days under its own cycle; any residual data in those copies isn't used by FitMesh for normal processing. Deleting your FitMesh account doesn't touch the data that stays on connected third-party services (Health Connect, Apple Health, Samsung Health, external providers): those are managed separately, on each service. Full details on the [dedicated account deletion page](/en/delete-account).",
      },
    },
    {
      type: "heading",
      level: 2,
      locales: ["it", "en"],
      text: {
        it: "Self-host: stato reale oggi",
        en: "Self-hosting: the real status today",
      },
    },
    {
      type: "paragraph",
      locales: ["it", "en"],
      text: {
        it: "La possibilità di configurare un backend personalizzato (self-host) esiste nel software FitMesh, ma oggi non è un percorso pensato per il pubblico: è una capacità tecnica interna, con accesso riservato ad account admin. Il percorso di scrittura dei dati fitness passa comunque dall'infrastruttura gestita da FitMesh. Non è quindi un'alternativa self-service oggi disponibile: se ti interessa lo stato esatto, la [pagina dedicata](/it/self-host) lo spiega in dettaglio.",
        en: "The ability to configure a custom backend (self-hosting) exists in the FitMesh software, but today it isn't a path meant for the public: it's an internal technical capability, gated to admin accounts. The fitness data write path still goes through FitMesh's managed infrastructure. It isn't a self-service alternative available today: if you want the exact current status, the [dedicated page](/en/self-host) explains it in detail.",
      },
    },
    {
      type: "heading",
      level: 2,
      locales: ["it", "en"],
      text: {
        it: "Cosa FitMesh non fa",
        en: "What FitMesh doesn't do",
      },
    },
    {
      type: "paragraph",
      locales: ["it", "en"],
      text: {
        it: "Per essere chiari su cosa FitMesh non è: non è un'intelligenza artificiale (la funzione \"Condividi con AI\" genera solo un testo con i tuoi dati, da incollare in un assistente esterno a tua scelta); non fa diagnosi né sostituisce il parere di un medico; non garantisce che ogni possibile doppione tra dispositivi venga sempre eliminato (la deduplicazione copre i casi più comuni, non è infallibile su ogni combinazione di fonti); non importa automaticamente ogni metrica proprietaria di ogni dispositivo, solo quelle che il sistema operativo o il provider rendono disponibili; e non offre oggi un percorso self-host aperto al pubblico.",
        en: "To be clear about what FitMesh doesn't do: it isn't an AI (the \"Share with AI\" feature only generates a text with your data, to paste into an external assistant of your choice); it doesn't diagnose anything and doesn't replace a doctor's advice; it doesn't guarantee that every possible duplicate between devices is always eliminated (deduplication covers the most common cases, it isn't infallible across every combination of sources); it doesn't automatically import every proprietary metric from every device, only what the OS or provider makes available; and it doesn't offer a self-hosting path open to the public today.",
      },
    },
    {
      type: "callout",
      variant: "info",
      locales: ["it", "en"],
      title: {
        it: "Fonti e verifica",
        en: "Sources and verification",
      },
      body: {
        it: "Le informazioni tecniche su Health Connect, Apple HealthKit e Samsung Health Data SDK sono verificate contro la documentazione ufficiale delle rispettive piattaforme, controllata l'ultima volta il 5 agosto 2026: [Android Developers, Health Connect](https://developer.android.com/health-and-fitness/health-connect), [Apple Developer, HealthKit](https://developer.apple.com/documentation/healthkit), [Samsung Developer, Health Data SDK](https://developer.samsung.com/health/data/overview.html).",
        en: "The technical information about Health Connect, Apple HealthKit, and Samsung Health Data SDK is verified against each platform's official documentation, last checked on August 5, 2026: [Android Developers, Health Connect](https://developer.android.com/health-and-fitness/health-connect), [Apple Developer, HealthKit](https://developer.apple.com/documentation/healthkit), [Samsung Developer, Health Data SDK](https://developer.samsung.com/health/data/overview.html).",
      },
    },
    {
      type: "cta",
      title: {
        it: "Prova FitMesh sui tuoi dati veri",
        en: "Try FitMesh on your real data",
        es: "Prueba FitMesh con tus datos reales",
        de: "Teste FitMesh mit deinen echten Daten",
        pt: "Experimente o FitMesh com seus dados reais",
        fr: "Essayez FitMesh sur vos vraies données",
      },
      body: {
        it: "L'app Android e la dashboard web sono disponibili ora; l'app iOS è live sull'App Store in tutti gli store supportati, incluse tutte le storefront dei 27 Paesi UE. I primi 1000 iscritti founder (entro il 31 luglio 2026) hanno ricevuto il Pro a vita gratis: collega i tuoi wearable e l'anello Colmi e vedi tutto in un posto solo.",
        en: "The Android app and web dashboard are available now; the iOS app is live on the App Store in all supported storefronts, including all 27 EU countries. The first 1,000 founder sign-ups (by July 31, 2026) got lifetime Pro free: connect your wearables and the Colmi ring and see everything in one place.",
        es: "La app Android y el panel web están disponibles ya; la app iOS ya está disponible en todas las tiendas compatibles en la App Store, incluidos los 27 países de la UE. Los primeros 1000 inscritos founder (hasta el 31 de julio de 2026) consiguieron el Pro de por vida gratis: conecta tus wearables y el anillo Colmi y velo todo en un solo lugar.",
        de: "Die Android-App und das Web-Dashboard sind ab sofort verfügbar; die iOS-App ist bereits im App Store in allen unterstützten Stores live, einschließlich aller 27 EU-Länder. Die ersten 1.000 founder-Anmeldungen (bis 31. Juli 2026) haben Pro lebenslang gratis erhalten: Verbinde deine Wearables und den Colmi-Ring und sieh alles an einem Ort.",
        pt: "O app Android e o painel na web já estão disponíveis; o app iOS já está disponível na App Store em todas as lojas compatíveis, incluindo os 27 países da UE. Os primeiros 1000 inscritos founder (até 31 de julho de 2026) ganharam o Pro vitalício de graça: conecte seus wearables e o anel Colmi e veja tudo em um só lugar.",
        fr: "L'app Android et le tableau de bord web sont disponibles maintenant ; l'app iOS est déjà disponible sur l'App Store dans toutes les boutiques prises en charge, y compris les 27 pays de l'UE. Les 1000 premiers inscrits founder (jusqu'au 31 juillet 2026) ont obtenu Pro à vie gratuitement : connectez vos wearables et la bague Colmi et voyez tout au même endroit.",
      },
      ctaLabel: {
        it: "Prova FitMesh gratuitamente →",
        en: "Try FitMesh free →",
        es: "Prueba FitMesh gratis →",
        de: "Teste FitMesh kostenlos →",
        pt: "Experimente o FitMesh gratuitamente →",
        fr: "Essayez FitMesh gratuitement →",
      },
      ctaHref: {
        it: "/it#download",
        en: "/en#download",
        es: "/es#download",
        de: "/de#download",
        pt: "/pt#download",
        fr: "/fr#download",
      },
      // P1.5C: id/placement aggiunti per il tracking cta_view/cta_click
      // (mancavano su questo CTA da prima di questo sprint).
      ctaId: "blog-come-funziona-fitmesh-final-cta",
      ctaPlacement: "blog_body_end",
    },
  ],
  faq: [
    {
      q: {
        it: "Come funziona FitMesh?",
        en: "How does FitMesh work?",
        es: "¿Cómo funciona FitMesh?",
        de: "Wie funktioniert FitMesh?",
        pt: "Como o FitMesh funciona?",
        fr: "Comment fonctionne FitMesh ?",
      },
      a: {
        it: "FitMesh Sync legge i dati dei tuoi wearable, l'anello Colmi via Bluetooth e lo smartwatch tramite Health Connect su Android, li unisce con la deduplicazione (niente doppioni) e li mostra in un'unica dashboard sul telefono e sul web. I dati restano sul tuo account.",
        en: "FitMesh Sync reads your wearables' data, the Colmi ring over Bluetooth and your smartwatch through Health Connect on Android, merges it with deduplication (no duplicates) and shows it in one dashboard on your phone and on the web. Your data stays on your account.",
        es: "FitMesh Sync lee los datos de tus wearables, el anillo Colmi por Bluetooth y el smartwatch a través de Health Connect en Android, los unifica con la deduplicación (sin duplicados) y los muestra en un único panel en el móvil y en la web. Tus datos se quedan en tu cuenta.",
        de: "FitMesh Sync liest die Daten deiner Wearables, den Colmi-Ring über Bluetooth und deine Smartwatch über Health Connect unter Android, führt sie per Deduplizierung zusammen (keine Duplikate) und zeigt sie in einem einzigen Dashboard auf dem Handy und im Web. Deine Daten bleiben in deinem Konto.",
        pt: "O FitMesh Sync lê os dados dos seus wearables, o anel Colmi por Bluetooth e o smartwatch pelo Health Connect no Android, une tudo com a deduplicação (sem duplicatas) e mostra em um único painel no celular e na web. Seus dados ficam na sua conta.",
        fr: "FitMesh Sync lit les données de vos wearables, la bague Colmi via Bluetooth et votre montre connectée via Health Connect sur Android, les fusionne avec la déduplication (aucun doublon) et les affiche dans un seul tableau de bord sur votre téléphone et sur le web. Vos données restent sur votre compte.",
      },
    },
    {
      q: {
        it: "FitMesh legge davvero l'anello smart?",
        en: "Does FitMesh really read the smart ring?",
        es: "¿FitMesh lee de verdad el anillo inteligente?",
        de: "Liest FitMesh wirklich den smarten Ring aus?",
        pt: "O FitMesh lê mesmo o anel inteligente?",
        fr: "FitMesh lit-il vraiment la bague connectée ?",
      },
      a: {
        it: "Sì. Legge l'anello Colmi direttamente via Bluetooth, senza tenere aperta l'app del produttore: passi, frequenza cardiaca, SpO2, sonno con fasi, stress e batteria. Con \"Measure now\" puoi anche fare una misura istantanea di battito e ossigeno.",
        en: "Yes. It reads the Colmi ring directly over Bluetooth, with no need to keep the maker's app open: steps, heart rate, SpO2, sleep with stages, stress and battery. With \"Measure now\" you can also take an instant heart rate and blood oxygen reading.",
        es: "Sí. Lee el anillo Colmi directamente por Bluetooth, sin mantener abierta la app del fabricante: pasos, frecuencia cardíaca, SpO2, sueño con fases, estrés y batería. Con \"Measure now\" también puedes hacer una medición instantánea de pulsaciones y oxígeno en sangre.",
        de: "Ja. Er liest den Colmi-Ring direkt über Bluetooth aus, ohne dass die App des Herstellers geöffnet bleiben muss: Schritte, Herzfrequenz, SpO2, Schlaf mit Phasen, Stress und Akku. Mit \"Measure now\" kannst du auch eine sofortige Messung von Herzfrequenz und Blutsauerstoff machen.",
        pt: "Sim. Ele lê o anel Colmi diretamente por Bluetooth, sem manter o app do fabricante aberto: passos, frequência cardíaca, SpO2, sono com fases, estresse e bateria. Com \"Measure now\" você também pode fazer uma medição instantânea de batimentos e oxigênio no sangue.",
        fr: "Oui. Il lit la bague Colmi directement via Bluetooth, sans avoir à garder l'app du fabricant ouverte : pas, fréquence cardiaque, SpO2, sommeil avec phases, stress et batterie. Avec \"Measure now\", vous pouvez aussi prendre une mesure instantanée de la fréquence cardiaque et de l'oxygène dans le sang.",
      },
    },
    {
      q: {
        it: "Con quali dispositivi funziona?",
        en: "Which devices does it work with?",
        es: "¿Con qué dispositivos funciona?",
        de: "Mit welchen Geräten funktioniert es?",
        pt: "Com quais dispositivos funciona?",
        fr: "Avec quels appareils fonctionne-t-il ?",
      },
      a: {
        it: "Su Android, con qualsiasi dispositivo che scrive su Health Connect (la maggior parte di smartwatch e band recenti), più l'anello Colmi via Bluetooth. Provider come Strava e Suunto si collegano dalla sezione provider esterni (Oura è in arrivo). Su iPhone l'app è già live e legge Apple Salute direttamente, oltre a connettersi all'anello Colmi via Bluetooth.",
        en: "On Android, with any device that writes to Health Connect (most recent smartwatches and bands), plus the Colmi ring over Bluetooth. Providers like Strava and Suunto connect from the external providers section (Oura is coming soon). On iPhone the app is already live and reads Apple Health directly, plus connects to the Colmi ring over Bluetooth.",
        es: "En Android, con cualquier dispositivo que escriba en Health Connect (la mayoría de smartwatches y pulseras recientes), más el anillo Colmi por Bluetooth. Proveedores como Strava y Suunto se conectan desde la sección de proveedores externos (Oura llegará próximamente). En iPhone la app ya está disponible y lee Apple Health directamente, además de conectarse al anillo Colmi por Bluetooth.",
        de: "Unter Android mit jedem Gerät, das in Health Connect schreibt (die meisten aktuellen Smartwatches und Bänder), plus dem Colmi-Ring über Bluetooth. Anbieter wie Strava und Suunto verbindest du im Bereich für externe Anbieter (Oura folgt in Kürze). Auf dem iPhone ist die App bereits live und liest Apple Health direkt aus, außerdem verbindet sie sich über Bluetooth mit dem Colmi-Ring.",
        pt: "No Android, com qualquer dispositivo que escreva no Health Connect (a maioria dos smartwatches e pulseiras recentes), além do anel Colmi por Bluetooth. Provedores como Strava e Suunto se conectam na seção de provedores externos (o Oura chega em breve). No iPhone o app já está disponível e lê o Apple Health diretamente, além de se conectar ao anel Colmi por Bluetooth.",
        fr: "Sur Android, avec n'importe quel appareil qui écrit dans Health Connect (la plupart des montres connectées et bracelets récents), plus la bague Colmi via Bluetooth. Des fournisseurs comme Strava et Suunto se connectent depuis la section des fournisseurs externes (Oura arrive bientôt). Sur iPhone, l'app est déjà disponible et lit directement Apple Health, en plus de se connecter à la bague Colmi via Bluetooth.",
      },
    },
    {
      q: {
        it: "Serve Health Connect?",
        en: "Do I need Health Connect?",
        es: "¿Necesito Health Connect?",
        de: "Brauche ich Health Connect?",
        pt: "Preciso do Health Connect?",
        fr: "Ai-je besoin de Health Connect ?",
      },
      a: {
        it: "Su Android sì, per leggere i dati dello smartwatch: al primo avvio autorizzi FitMesh in Health Connect. L'anello Colmi invece si legge direttamente via Bluetooth, senza Health Connect.",
        en: "On Android yes, to read your smartwatch data: on first launch you grant FitMesh access in Health Connect. The Colmi ring, instead, is read directly over Bluetooth, without Health Connect.",
        es: "En Android sí, para leer los datos del smartwatch: al primer inicio autorizas a FitMesh en Health Connect. El anillo Colmi, en cambio, se lee directamente por Bluetooth, sin Health Connect.",
        de: "Unter Android ja, um die Daten deiner Smartwatch zu lesen: Beim ersten Start erteilst du FitMesh die Berechtigung in Health Connect. Der Colmi-Ring hingegen wird direkt über Bluetooth gelesen, ohne Health Connect.",
        pt: "No Android sim, para ler os dados do smartwatch: na primeira abertura você autoriza o FitMesh no Health Connect. Já o anel Colmi é lido diretamente por Bluetooth, sem o Health Connect.",
        fr: "Sur Android oui, pour lire les données de votre montre connectée : au premier lancement, vous autorisez FitMesh dans Health Connect. La bague Colmi, en revanche, est lue directement via Bluetooth, sans Health Connect.",
      },
    },
    {
      q: {
        it: "Come funziona la deduplicazione tra le fonti?",
        en: "How does deduplication across sources work?",
        es: "¿Cómo funciona la deduplicación entre fuentes?",
        de: "Wie funktioniert die Deduplizierung über mehrere Quellen?",
        pt: "Como funciona a deduplicação entre as fontes?",
        fr: "Comment fonctionne la déduplication entre les sources ?",
      },
      a: {
        it: "Perché FitMesh applica una deduplicazione: se la stessa metrica arriva da più fonti nello stesso intervallo (per esempio anello e orologio), sceglie il dato migliore invece di sommarli. Nel Centro sincronizzazione vedi, per ogni metrica, da quale app proviene.",
        en: "Because FitMesh applies deduplication: if the same metric arrives from multiple sources in the same interval (for example ring and watch), it picks the best value instead of adding them up. In the Sync Center you see, for each metric, which app it comes from.",
        es: "Porque FitMesh aplica una deduplicación: si la misma métrica llega de varias fuentes en el mismo intervalo (por ejemplo anillo y reloj), elige el mejor dato en lugar de sumarlos. En el Centro de sincronización ves, en cada métrica, de qué app procede.",
        de: "Weil FitMesh eine Deduplizierung anwendet: Wenn dieselbe Metrik im selben Zeitraum von mehreren Quellen kommt (zum Beispiel Ring und Uhr), wählt sie den besten Wert, statt sie zu addieren. Im Sync-Center siehst du bei jeder Metrik, von welcher App sie stammt.",
        pt: "Porque o FitMesh aplica uma deduplicação: se a mesma métrica chega de várias fontes no mesmo intervalo (por exemplo, anel e relógio), ele escolhe o melhor dado em vez de somá-los. Na Central de sincronização você vê, em cada métrica, de qual app ela vem.",
        fr: "Parce que FitMesh applique une déduplication : si la même mesure arrive de plusieurs sources sur le même intervalle (par exemple bague et montre), il retient la meilleure valeur au lieu de les additionner. Dans le Centre de synchronisation, vous voyez, pour chaque mesure, de quelle app elle provient.",
      },
    },
    {
      q: {
        it: "Dove sono conservati i miei dati?",
        en: "Where is my data stored?",
        es: "¿Dónde se guardan mis datos?",
        de: "Wo werden meine Daten gespeichert?",
        pt: "Onde meus dados são armazenados?",
        fr: "Où mes données sont-elles stockées ?",
      },
      a: {
        it: "Sul tuo account. FitMesh non vende i tuoi dati e non mostra pubblicità. Puoi aprire la stessa dashboard da qualsiasi browser con il tuo account.",
        en: "On your account. FitMesh doesn't sell your data and shows no ads. You can open the same dashboard from any browser with your account.",
        es: "En tu cuenta. FitMesh no vende tus datos y no muestra publicidad. Puedes abrir el mismo panel desde cualquier navegador con tu cuenta.",
        de: "In deinem Konto. FitMesh verkauft deine Daten nicht und zeigt keine Werbung. Du kannst dasselbe Dashboard mit deinem Konto in jedem Browser öffnen.",
        pt: "Na sua conta. O FitMesh não vende seus dados e não mostra anúncios. Você pode abrir o mesmo painel de qualquer navegador com sua conta.",
        fr: "Sur votre compte. FitMesh ne vend pas vos données et n'affiche aucune publicité. Vous pouvez ouvrir le même tableau de bord depuis n'importe quel navigateur avec votre compte.",
      },
    },
    {
      q: {
        it: "FitMesh è gratis?",
        en: "Is FitMesh free?",
        es: "¿FitMesh es gratis?",
        de: "Ist FitMesh kostenlos?",
        pt: "O FitMesh é grátis?",
        fr: "FitMesh est-il gratuit ?",
      },
      a: {
        it: "Non c'è un piano gratuito permanente, ma costa pochissimo: prova completa di 14 giorni, poi un abbonamento leggero (circa un caffè ogni sei mesi) o lo sblocco a vita (meno di una pizza). I primi 1000 iscritti founder (entro il 31 luglio 2026) hanno ricevuto il Pro a vita gratis.",
        en: "There's no permanent free plan, but it costs very little: a full 14-day trial, then a light subscription (about a coffee every six months) or a one-time lifetime unlock (less than a pizza). The first 1,000 founder sign-ups (by July 31, 2026) got lifetime Pro free.",
        es: "No hay un plan gratuito permanente, pero cuesta muy poco: una prueba completa de 14 días y luego una suscripción ligera (como un café cada seis meses) o un desbloqueo de por vida (menos que una pizza). Los primeros 1000 inscritos founder (hasta el 31 de julio de 2026) obtuvieron el Pro de por vida gratis.",
        de: "Es gibt keinen dauerhaft kostenlosen Plan, aber es kostet sehr wenig: eine vollständige 14-tägige Testphase und danach ein leichtes Abo (weniger als ein Kaffee alle sechs Monate) oder eine einmalige lebenslange Freischaltung (weniger als eine Pizza). Die ersten 1.000 founder-Anmeldungen (bis 31. Juli 2026) haben Pro lebenslang gratis erhalten.",
        pt: "Não há um plano gratuito permanente, mas custa pouquíssimo: uma avaliação completa de 14 dias e depois uma assinatura leve (como um café a cada seis meses) ou um desbloqueio vitalício (menos que uma pizza). Os primeiros 1000 inscritos founder (até 31 de julho de 2026) ganharam o Pro vitalício de graça.",
        fr: "Il n'y a pas de forfait gratuit permanent, mais cela coûte très peu : un essai complet de 14 jours, puis un abonnement léger (moins qu'un café tous les six mois) ou un déblocage à vie (moins qu'une pizza). Les 1000 premiers inscrits founder (jusqu'au 31 juillet 2026) ont obtenu Pro à vie gratuitement.",
      },
    },
    {
      q: {
        it: "Funziona su iPhone?",
        en: "Does it work on iPhone?",
        es: "¿Funciona en iPhone?",
        de: "Funktioniert es auf dem iPhone?",
        pt: "Funciona no iPhone?",
        fr: "Fonctionne-t-il sur iPhone ?",
      },
      a: {
        it: "Sì. L'app Android è disponibile ora e l'app iOS è già live sull'App Store in tutti gli store supportati, incluse tutte le storefront dei 27 Paesi UE; su iPhone legge Apple Salute direttamente. La dashboard web, invece, è già accessibile da qualsiasi dispositivo con il tuo account, iPhone compreso.",
        en: "Yes. The Android app is available now and the iOS app is already live on the App Store in all supported storefronts, including all 27 EU countries; on iPhone it reads Apple Health directly. The web dashboard, however, is already accessible from any device with your account, iPhone included.",
        es: "Sí. La app Android está disponible ya y la app iOS ya está disponible en todas las tiendas compatibles en la App Store, incluidos los 27 países de la UE; en iPhone lee Apple Health directamente. El panel web, en cambio, ya es accesible desde cualquier dispositivo con tu cuenta, iPhone incluido.",
        de: "Ja. Die Android-App ist ab sofort verfügbar und die iOS-App ist bereits im App Store in allen unterstützten Stores live, einschließlich aller 27 EU-Länder; auf dem iPhone liest sie Apple Health direkt aus. Das Web-Dashboard hingegen ist mit deinem Konto bereits von jedem Gerät aus zugänglich, auch vom iPhone.",
        pt: "Sim. O app Android já está disponível e o app iOS já está disponível na App Store em todas as lojas compatíveis, incluindo os 27 países da UE; no iPhone ele lê o Apple Health diretamente. Já o painel na web já é acessível de qualquer dispositivo com a sua conta, incluindo o iPhone.",
        fr: "Oui. L'app Android est disponible maintenant et l'app iOS est déjà disponible sur l'App Store dans toutes les boutiques prises en charge, y compris les 27 pays de l'UE ; sur iPhone, elle lit directement Apple Health. Le tableau de bord web, en revanche, est déjà accessible depuis n'importe quel appareil avec votre compte, iPhone compris.",
      },
    },
    // P1.5B Fase C: 4 nuove FAQ, solo it/en, ciascuna risponde direttamente
    // a uno dei vincoli "non affermare" del mandato invece di ignorarlo.
    {
      q: {
        it: "FitMesh elimina sempre tutti i doppioni tra dispositivi?",
        en: "Does FitMesh always eliminate every duplicate between devices?",
      },
      a: {
        it: "Nella maggior parte dei casi sì: quando più dispositivi registrano lo stesso dato nello stesso intervallo, la deduplicazione sceglie il valore migliore invece di sommarli. Non è però una garanzia assoluta su ogni possibile combinazione di fonti: casi limite, per esempio intervalli temporali molto ravvicinati ma non identici, possono comportarsi diversamente.",
        en: "In most cases, yes: when multiple devices record the same data in the same interval, deduplication picks the best value instead of adding them up. It isn't an absolute guarantee across every possible combination of sources, though: edge cases, for example very close but not identical time intervals, can behave differently.",
      },
      locales: ["it", "en"],
    },
    {
      q: {
        it: "Posso cancellare account e dati?",
        en: "Can I delete my account and data?",
      },
      a: {
        it: "Sì, direttamente dall'app: la cancellazione dal telefono è immediata. Le richieste dalla dashboard web hanno un periodo di ripensamento di 24 ore; quelle via email vengono eseguite dopo una verifica di identità. Dettagli completi nella [pagina di cancellazione account](/it/delete-account).",
        en: "Yes, directly from the app: deletion from your phone is immediate. Requests from the web dashboard have a 24-hour grace period; requests by email are carried out after an identity check. Full details on the [account deletion page](/en/delete-account).",
      },
      locales: ["it", "en"],
    },
    {
      q: {
        it: "Posso gestire io stesso il backend (self-host)?",
        en: "Can I run my own backend (self-hosting)?",
      },
      a: {
        it: "La capacità esiste nel software, ma oggi non è un percorso pensato per il pubblico: è riservata ad account admin, e il flusso di scrittura dei dati fitness passa comunque dall'infrastruttura FitMesh. Vedi lo [stato attuale del self-host](/it/self-host).",
        en: "The capability exists in the software, but today it isn't a path meant for the public: it's restricted to admin accounts, and the fitness data write flow still goes through FitMesh's infrastructure. See the [current self-hosting status](/en/self-host).",
      },
      locales: ["it", "en"],
    },
    {
      q: {
        it: "FitMesh è un'intelligenza artificiale?",
        en: "Is FitMesh an AI?",
      },
      a: {
        it: "No. FitMesh è un'app di sincronizzazione e visualizzazione dati: unisce e mostra le tue metriche, non le interpreta con modelli di AI. La funzione \"Condividi con AI\" genera solo un testo con i tuoi dati da incollare in un assistente esterno a tua scelta, se lo desideri.",
        en: "No. FitMesh is a data sync and visualization app: it merges and displays your metrics, it doesn't interpret them with AI models. The \"Share with AI\" feature only generates a text with your data to paste into an external assistant of your choice, if you want to.",
      },
      locales: ["it", "en"],
    },
  ],
  related: [
    "colmi-ring-fitmesh",
    "piu-smartwatch-insieme-dati-doppi",
    "come-funziona-health-connect",
    "vedere-dati-wearable-browser-pc",
    "fitmesh-gratis-prezzo-founder",
    "fitmesh-samsung-health-usarli-insieme",
  ],
  // P1.5B Fase C: prima volta che questo post cita fonti primarie visibili
  // (documentazione ufficiale delle 3 piattaforme discusse nella nuova
  // tabella sorgente/percorso/dati). Verificate live il 5 agosto 2026.
  sources: [
    "https://developer.android.com/health-and-fitness/health-connect",
    "https://developer.apple.com/documentation/healthkit",
    "https://developer.samsung.com/health/data/overview.html",
  ],
  // P1.8S FASE 8 (2026-08-06): le 3 fonti sono gia' citate inline nel corpo
  // (tabella sorgente/percorso/dati P1.5B Fase C): evita che il componente
  // condiviso BlogSources le mostri una seconda volta (verificato da
  // check-p16-visible-sources.ts per URL-overlap, 3/3).
  sourcesRenderedInline: true,
  brandsMentioned: ["Colmi", "Samsung Health", "Google"],
  ldType: "BlogPosting",
};
