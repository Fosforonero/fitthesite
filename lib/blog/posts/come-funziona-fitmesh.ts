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
  // P1910 (2026-09-02): rimosso l'assoluto "lo stesso passo non viene mai
  // contato due volte" dal paragrafo "Da dove vengono i dati" (6 locale:
  // it/en/es/de/pt/fr) — ora ammette casi limite, allineato alla FAQ già
  // corretta dello stesso post; nessuna promessa di "vince il più alto" né
  // arbitraggio per-ora introdotta.
  // P1.28 (2026-09-26): rimozione completa claim dashboard web disponibile,
  // allineamento perimetro Suunto (non disponibile) e Oura (bridge condizionale),
  // attenuazione deduplicazione su comportamento reale, rimozione claim founder (6 locale).
  updatedAt: "2026-09-26",
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
      it: "FitMesh Sync legge i dati dei tuoi wearable, incluso l'anello Colmi via Bluetooth, li unisce dando priorità alla fonte più coerente e li mostra in un'unica dashboard nell'app. Ecco come funziona, schermata per schermata.",
      en: "FitMesh Sync reads your wearables' data, including the Colmi ring over Bluetooth, merges it by prioritizing the most consistent source and shows it in one dashboard in the app. Here's how it works, screen by screen.",
      es: "FitMesh Sync lee los datos de tus wearables, incluido el anillo Colmi por Bluetooth, los unifica priorizando la fuente más coherente y los muestra en un único panel de la app. Así funciona, pantalla a pantalla.",
      de: "FitMesh Sync liest die Daten deiner Wearables, darunter den Colmi-Ring über Bluetooth, führt sie über Quellenpriorisierung zusammen und zeigt sie in einem Dashboard in der App. So funktioniert es, Bildschirm für Bildschirm.",
      pt: "O FitMesh Sync lê os dados dos seus wearables, incluindo o anel Colmi por Bluetooth, une tudo priorizando a fonte mais coerente e mostra em um único painel no app. Veja como funciona, tela por tela.",
      fr: "FitMesh Sync lit les données de vos wearables, y compris la bague Colmi via Bluetooth, les fusionne en retenant la source la plus cohérente et les affiche dans un tableau de bord dans l'app. Voici comment ça marche, écran par écran.",
    },
  },
  metaDescription: {
    it: "Cos'è FitMesh e come funziona: legge anello Colmi e smartwatch nell'app, unisce le fonti evitando doppie somme. Privacy, cancellazione e limiti spiegati.",
    en: "What FitMesh is and how it works: reads Colmi ring and smartwatch in the app, merges sources without double counting. Privacy, deletion and limits explained.",
    es: "Cómo funciona FitMesh: lee el anillo Colmi por Bluetooth y el smartwatch mediante Health Connect, unificando los datos en la app. Guía con capturas reales.",
    de: "So funktioniert FitMesh Sync: Liest Colmi-Ring über Bluetooth und Smartwatch über Health Connect, führt Daten in der App zusammen. Anleitung mit Screenshots.",
    pt: "Como funciona o FitMesh Sync: lê o anel Colmi via Bluetooth e o smartwatch pelo Health Connect, unindo os dados no app. Guia com capturas de tela reais.",
    fr: "Comment fonctionne FitMesh Sync : lit la bague Colmi en Bluetooth et la montre via Health Connect, réunit les données dans l'app. Guide avec vraies captures.",
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
      "vedere dati wearable nell'app",
    ],
    en: [
      "what is fitmesh",
      "fitmesh dashboard",
      "fitmesh colmi ring",
      "fitmesh health connect",
      "merge ring and watch data",
      "one app for wearable data",
      "see wearable data in the app",
    ],
    es: [
      "qué es fitmesh",
      "fitmesh panel",
      "fitmesh anillo colmi",
      "fitmesh health connect",
      "unir datos de anillo y reloj",
      "una sola app para datos de wearables",
      "ver datos de wearables en la app",
    ],
    de: [
      "was ist fitmesh",
      "fitmesh dashboard",
      "fitmesh colmi ring",
      "fitmesh health connect",
      "ring- und uhrdaten zusammenführen",
      "eine app für wearable-daten",
      "wearable-daten in der app ansehen",
    ],
    pt: [
      "o que é fitmesh",
      "fitmesh painel",
      "fitmesh anel colmi",
      "fitmesh health connect",
      "unir dados de anel e relógio",
      "um app para dados de wearables",
      "ver dados de wearables no app",
    ],
    fr: [
      "qu'est-ce que fitmesh",
      "fitmesh tableau de bord",
      "fitmesh bague colmi",
      "fitmesh health connect",
      "fusionner les données de bague et de montre",
      "une seule app pour les données wearables",
      "voir les données wearables dans l'app",
    ],
  },
  tldr: {
    it: [
      "FitMesh Sync è un'app che raccoglie i dati dei tuoi wearable e li mostra in un'unica dashboard sul telefono (Android e iOS).",
      "Legge l'anello Colmi direttamente via Bluetooth e lo smartwatch tramite Health Connect su Android o Apple Salute su iOS.",
      "Applica una prioritizzazione tra le fonti: quando più dispositivi registrano la stessa metrica nello stesso intervallo, sceglie la fonte più coerente invece di sommarli.",
      "Per ogni metrica vedi da quale app arriva il dato (passi, sonno, frequenza cardiaca, SpO2).",
      "I dati restano sul tuo account. App Android disponibile ora; app iOS già live in tutti gli store supportati, incluse tutte le storefront dell'Unione Europea.",
    ],
    en: [
      "FitMesh Sync is an app that gathers your wearables' data and shows it in one dashboard on your phone (Android and iOS).",
      "It reads the Colmi ring directly over Bluetooth and your smartwatch through Health Connect on Android or Apple Health on iOS.",
      "It applies source prioritization: when multiple devices record the same metric in the same interval, it picks the most consistent value instead of adding them up.",
      "For each metric you can see which app provided the data (steps, sleep, heart rate, SpO2).",
      "Your data stays on your account. Android app available now; the iOS app is already live in all supported storefronts, including the EU.",
    ],
    es: [
      "FitMesh Sync es una app que reúne los datos de tus wearables y los muestra en un único panel en el móvil (Android e iOS).",
      "Lee el anillo Colmi directamente por Bluetooth y el smartwatch a través de Health Connect en Android o Apple Health en iOS.",
      "Aplica una priorización de fuentes: cuando varios dispositivos registran la misma métrica, elige el dato más coherente en lugar de sumarlos.",
      "En cada métrica puedes ver de qué app procede el dato (pasos, sueño, frecuencia cardíaca, SpO2).",
      "Tus datos se quedan en tu cuenta. App Android disponible ya; la app iOS ya está disponible en todas las tiendas compatibles, incluidas todas las tiendas de la Unión Europea.",
    ],
    de: [
      "FitMesh Sync ist eine App, die die Daten deiner Wearables sammelt und in einem Dashboard auf dem Smartphone anzeigt (Android und iOS).",
      "Sie liest den Colmi-Ring direkt über Bluetooth und deine Smartwatch über Health Connect unter Android oder Apple Health unter iOS.",
      "Sie wendet eine Quellenpriorisierung an: Wenn mehrere Geräte dieselbe Metrik erfassen, wählt sie den stimmigsten Wert, statt sie zu addieren.",
      "Bei jeder Metrik siehst du, welche App die Daten geliefert hat (Schritte, Schlaf, Herzfrequenz, SpO2).",
      "Deine Daten bleiben in deinem Konto. Android-App ab sofort verfügbar; die iOS-App ist bereits in allen unterstützten Stores live, einschließlich aller Storefronts der Europäischen Union.",
    ],
    pt: [
      "O FitMesh Sync é um app que reúne os dados dos seus wearables e mostra tudo em um único painel no celular (Android e iOS).",
      "Ele lê o anel Colmi diretamente por Bluetooth e o smartwatch pelo Health Connect no Android ou Apple Health no iOS.",
      "Aplica uma priorização entre as fontes: quando vários dispositivos registram a mesma métrica, escolhe o dado mais coerente em vez de somá-los.",
      "Em cada métrica você vê de qual app veio o dado (passos, sono, frequência cardíaca, SpO2).",
      "Seus dados ficam na sua conta. App Android disponível agora; app iOS já disponível em todas as lojas compatíveis, incluindo todas as lojas da União Europeia.",
    ],
    fr: [
      "FitMesh Sync est une app qui rassemble les données de vos wearables et les affiche dans un seul tableau de bord sur votre téléphone (Android et iOS).",
      "Elle lit la bague Colmi directement via Bluetooth et votre montre connectée via Health Connect sur Android ou Apple Health sur iOS.",
      "Elle applique une priorité entre les sources : quand plusieurs appareils enregistrent la même mesure, elle retient la plus cohérente au lieu de les additionner.",
      "Pour chaque mesure, vous voyez quelle app a fourni la donnée (pas, sommeil, fréquence cardiaque, SpO2).",
      "Vos données restent sur votre compte. App Android disponible maintenant ; app iOS déjà disponible dans toutes les boutiques prises en charge, y compris toutes les boutiques de l'Union européenne.",
    ],
  },
  body: [
    {
      type: "paragraph",
      text: {
        it: "Se ti stai chiedendo come funziona FitMesh prima di provarlo, la risposta in una frase è questa: FitMesh Sync raccoglie i dati dei tuoi wearable, incluso un anello smart economico, li unisce dando priorità alla fonte più coerente e te li mostra in un'unica dashboard sul telefono. In questa guida lo vediamo schermata per schermata, con immagini reali dell'app.",
        en: "If you're wondering how FitMesh works before trying it, the one-sentence answer is this: FitMesh Sync gathers the data from all your wearables, including an affordable smart ring, merges it by prioritizing the most consistent source, and shows it to you in one dashboard on your phone. In this guide we go through it screen by screen, with real screenshots of the app.",
        es: "Si te preguntas cómo funciona FitMesh antes de probarlo, la respuesta en una frase es esta: FitMesh Sync reúne los datos de todos tus wearables, incluido un anillo inteligente económico, los unifica priorizando la fuente más coherente y te los muestra en un único panel en el móvil. En esta guía lo vemos pantalla a pantalla, con imágenes reales de la app.",
        de: "Wenn du dich fragst, wie FitMesh funktioniert, bevor du es ausprobierst, lautet die Antwort in einem Satz: FitMesh Sync sammelt die Daten all deiner Wearables, darunter ein günstiger smarter Ring, führt sie über Quellenpriorisierung zusammen und zeigt sie dir in einem Dashboard auf dem Smartphone. In diesem Leitfaden gehen wir das Bildschirm für Bildschirm durch, mit echten Screenshots der App.",
        pt: "Se você está se perguntando como o FitMesh funciona antes de experimentar, a resposta em uma frase é esta: o FitMesh Sync reúne os dados de todos os seus wearables, incluindo um anel inteligente acessível, une tudo priorizando a fonte mais coerente e mostra em um único painel no celular. Neste guia, vamos ver tudo tela por tela, com imagens reais do app.",
        fr: "Si vous vous demandez comment fonctionne FitMesh avant de l'essayer, la réponse en une phrase est celle-ci : FitMesh Sync rassemble les données de tous vos wearables, y compris une bague connectée abordable, les réunit en priorisant la source la plus cohérente et vous les présente dans un tableau de bord sur votre téléphone. Dans ce guide, nous parcourons tout écran par écran, avec de vraies captures d'écran de l'app.",
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
        it: "Da dove vengono i dati (e come funziona la deduplicazione)",
        en: "Where the data comes from (and how deduplication works)",
        es: "De dónde vienen los datos (y cómo funciona la deduplicación)",
        de: "Woher die Daten kommen (und wie die Deduplizierung funktioniert)",
        pt: "De onde vêm os dados (e como funciona a deduplicação)",
        fr: "D'où viennent les données (et comment fonctionne la déduplication)",
      },
    },
    {
      type: "paragraph",
      text: {
        it: "Questa è la parte che rende FitMesh diverso. Il Centro sincronizzazione mostra, per ogni metrica, quale app ha fornito il dato all'ultima sincronizzazione: i passi da Samsung Health, il sonno da Google, le calorie attive calcolate da FitMesh, e così via. Quando più fonti registrano la stessa cosa nello stesso giorno, come i passi, FitMesh non somma i valori e non prende semplicemente il numero più alto: sceglie la fonte più coerente e con la copertura oraria migliore per quel giorno. Nella maggior parte dei casi questo evita che lo stesso passo venga contato due volte, ma restano casi limite in cui due fonti molto simili tra loro possono comportarsi in modo diverso. Puoi approfondire il tema in [più smartwatch insieme senza dati doppi](/it/blog/piu-smartwatch-insieme-dati-doppi).",
        en: "This is the part that makes FitMesh different. The Sync Center shows, for each metric, which app provided the data at the last sync: steps from Samsung Health, sleep from Google, active calories computed by FitMesh, and so on. When multiple sources record the same thing on the same day, like steps, FitMesh doesn't add the values up and doesn't simply pick the highest number: it picks the source that is most consistent and has the best hour-by-hour coverage for that day. In most cases this keeps the same step from being counted twice, but edge cases remain where two very similar sources can behave differently. You can dig deeper in [multiple smartwatches together without double data](/en/blog/piu-smartwatch-insieme-dati-doppi).",
        es: "Esta es la parte que hace diferente a FitMesh. El Centro de sincronización muestra, en cada métrica, qué app aportó el dato en la última sincronización: los pasos desde Samsung Health, el sueño desde Google, las calorías activas calculadas por FitMesh, y así sucesivamente. Cuando varias fuentes registran lo mismo en el mismo día, como los pasos, FitMesh no suma los valores ni elige simplemente el número más alto: elige la fuente más coherente y con mejor cobertura horaria para ese día. En la mayoría de los casos esto evita que el mismo paso se cuente dos veces, pero quedan casos límite en los que dos fuentes muy parecidas pueden comportarse de forma distinta. Puedes profundizar en [varios smartwatches juntos sin datos duplicados](/es/blog/piu-smartwatch-insieme-dati-doppi).",
        de: "Das ist der Teil, der FitMesh anders macht. Das Sync-Center zeigt für jede Metrik, welche App die Daten bei der letzten Synchronisierung geliefert hat: die Schritte von Samsung Health, den Schlaf von Google, die von FitMesh berechneten aktiven Kalorien und so weiter. Wenn mehrere Quellen am selben Tag dasselbe erfassen, etwa die Schritte, addiert FitMesh die Werte nicht und nimmt auch nicht einfach die höchste Zahl: Es wählt die Quelle, die für diesen Tag am stimmigsten ist und die beste stündliche Abdeckung hat. In den meisten Fällen wird dadurch verhindert, dass derselbe Schritt doppelt gezählt wird, aber es bleiben Grenzfälle, in denen sich zwei sehr ähnliche Quellen unterschiedlich verhalten können. Mehr dazu in [mehrere Smartwatches zusammen ohne doppelte Daten](/de/blog/piu-smartwatch-insieme-dati-doppi).",
        pt: "Esta é a parte que torna o FitMesh diferente. A Central de sincronização mostra, em cada métrica, qual app forneceu o dado na última sincronização: os passos do Samsung Health, o sono do Google, as calorias ativas calculadas pelo FitMesh, e assim por diante. Quando várias fontes registram a mesma coisa no mesmo dia, como os passos, o FitMesh não soma os valores nem escolhe simplesmente o número mais alto: ele escolhe a fonte mais coerente e com a melhor cobertura horária para aquele dia. Na maioria dos casos isso evita que o mesmo passo seja contado duas vezes, mas restam casos limite em que duas fontes muito parecidas podem se comportar de forma diferente. Você pode se aprofundar em [vários smartwatches juntos sem dados duplicados](/pt/blog/piu-smartwatch-insieme-dati-doppi).",
        fr: "C'est ce qui rend FitMesh différent. Le Centre de synchronisation indique, pour chaque mesure, quelle app a fourni la donnée lors de la dernière synchronisation : les pas depuis Samsung Health, le sommeil depuis Google, les calories actives calculées par FitMesh, et ainsi de suite. Quand plusieurs sources enregistrent la même chose le même jour, comme les pas, FitMesh n'additionne pas les valeurs et ne retient pas simplement le chiffre le plus élevé : il choisit la source la plus cohérente et avec la meilleure couverture horaire pour ce jour-là. Dans la plupart des cas, cela évite que le même pas soit compté deux fois, mais il reste des cas limites où deux sources très proches peuvent se comporter différemment. Pour aller plus loin : [plusieurs montres connectées ensemble sans données en double](/fr/blog/piu-smartwatch-insieme-dati-doppi).",
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
        { steps: { it: ["Provider esterni (Strava)", "API del provider", "FitMesh"], en: ["External providers (Strava)", "Provider's own API", "FitMesh"] } },
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
          it: ["Provider esterni (Strava; Oura condizionale)", "API OAuth per Strava; bridge Health Connect / Apple Salute per Oura (se abilitato dall'utente nell'app Oura; API diretta non live). Integrazione Suunto non verificata / non disponibile nella release pubblica", "Allenamenti per Strava; metriche di sonno per Oura se esportate nel bridge di sistema"],
          en: ["External providers (Strava; conditional Oura)", "OAuth API for Strava; Health Connect / Apple Health bridge for Oura (if enabled by user in Oura app; direct API not live). Suunto integration unverified / unavailable in public release", "Workouts for Strava; sleep metrics for Oura if exported to system bridge"],
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
        it: "Non solo anello e smartwatch: FitMesh si integra con provider come Strava e connette smart ring Colmi via Bluetooth. Connettori cloud diretti per Suunto non sono invece disponibili nella release pubblica. La pagina Integrazioni elenca tutto quello che puoi collegare oggi.",
        en: "Not just ring and smartwatch: FitMesh integrates with providers like Strava and connects Colmi smart rings over Bluetooth. Direct cloud connectors for Suunto are not available in the public release. The Integrations page lists everything you can connect today.",
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
        it: "Dal menu raggiungi tutte le funzioni: registrare un allenamento con cronometro, battito e distanza; i trend; collegare l'anello smart o gestire i dispositivi e la sincronizzazione via Health Connect / Apple Salute; provider esterni (come Strava; connettori diretti per Suunto non disponibili nella release pubblica); impostazioni di profilo, obiettivi, unità e tema. C'è anche \"Condividi con AI\", che genera un testo con i tuoi dati da usare con un assistente.",
        en: "From the menu you reach every feature: record a workout with a timer, heart rate and distance; trends; connect the smart ring or manage devices and syncing via Health Connect / Apple Health; external providers (such as Strava; direct Suunto connectors unavailable in the public release); settings for profile, goals, units and theme. There's also \"Share with AI\", which generates a text with your data to use with an assistant.",
        es: "Desde el menú llegas a todas las funciones: registrar un entrenamiento con cronómetro, pulsaciones y distancia; las tendencias; conectar el anillo inteligente o gestionar los dispositivos y la sincronización mediante Health Connect / Apple Health; proveedores externos (como Strava; conectores directos para Suunto no disponibles en la release pública); ajustes de perfil, objetivos, unidades y tema. También está \"Compartir con IA\", que genera un texto con tus datos para usar con un asistente.",
        de: "Über das Menü erreichst du alle Funktionen: ein Workout mit Timer, Herzfrequenz und Distanz aufzeichnen; die Trends; den smarten Ring verbinden oder Geräte und Synchronisierung über Health Connect / Apple Health verwalten; externe Anbieter (wie Strava; direkte Suunto-Konnektoren in der öffentlichen Version nicht verfügbar); Einstellungen für Profil, Ziele, Einheiten und Design. Es gibt auch \"Mit KI teilen\", das einen Text mit deinen Daten für einen Assistenten erzeugt.",
        pt: "No menu você acessa todas as funções: registrar um treino com cronômetro, batimentos e distância; as tendências; conectar o anel inteligente ou gerenciar os dispositivos e a sincronização via Health Connect / Apple Health; provedores externos (como Strava; conectores diretos para Suunto indisponíveis na versão pública); ajustes de perfil, metas, unidades e tema. Há também \"Compartilhar com IA\", que gera um texto com seus dados para usar com um assistente.",
        fr: "Depuis le menu, vous accédez à toutes les fonctionnalités : enregistrer un entraînement avec chronomètre, fréquence cardiaque et distance ; les tendances ; connecter la bague connectée ou gérer les appareils et la synchronisation via Health Connect / Apple Health ; les fournisseurs externes (comme Strava ; connecteurs directs Suunto non disponibles dans la version publique) ; les réglages de profil, objectifs, unités et thème. Il y a aussi \"Partager avec l'IA\", qui génère un texte avec vos données à utiliser avec un assistant.",
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
          "Installa FitMesh Sync dall'App Store o da Google Play e accedi. Su Android autorizzi Health Connect, su iPhone autorizzi Apple Salute, così l'app legge i dati del tuo smartwatch.",
          "Se hai un anello Colmi, aprilo dalla sezione \"Anello smart\" e collegalo via Bluetooth: passi, battito, SpO2 e sonno entrano nella dashboard.",
          "Consulta la schermata \"Oggi\" e la sezione Trend nell'app: trovi tutte le metriche unificate ed elaborate sul tuo dispositivo, senza dover aprire app separate.",
        ],
        en: [
          "Install FitMesh Sync from the App Store or Google Play and sign in. On Android grant Health Connect access, on iPhone grant Apple Health access, so the app reads your smartwatch data.",
          "If you have a Colmi ring, open the \"Smart ring\" section and connect it over Bluetooth: steps, heart rate, SpO2 and sleep flow into the dashboard.",
          "Check the \"Today\" screen and Trends section in the app: all your metrics are unified and processed on your device, without opening separate apps.",
        ],
        es: [
          "Instala FitMesh Sync desde la App Store o Google Play e inicia sesión. En Android autorizas Health Connect, en iPhone autorizas Apple Health, para que la app lea los datos de tu smartwatch.",
          "Si tienes un anillo Colmi, abre la sección \"Anillo inteligente\" y conéctalo por Bluetooth: pasos, pulsaciones, SpO2 y sueño entran en el panel.",
          "Consulta la pantalla \"Hoy\" y la sección Tendencias en la app: encuentras todas tus métricas unificadas en tu móvil, sin abrir apps separadas.",
        ],
        de: [
          "Installiere FitMesh Sync aus dem App Store oder Google Play und melde dich an. Unter Android erteilst du Health Connect die Berechtigung, auf dem iPhone Apple Health, damit die App die Daten deiner Smartwatch liest.",
          "Wenn du einen Colmi-Ring hast, öffne den Bereich \"Smarter Ring\" und verbinde ihn über Bluetooth: Schritte, Herzfrequenz, SpO2 und Schlaf fließen ins Dashboard.",
          "Öffne die Ansicht \"Heute\" und den Bereich Trends in der App: Alle deine Metriken sind auf deinem Smartphone gebündelt, ohne zwischen Apps zu wechseln.",
        ],
        pt: [
          "Instale o FitMesh Sync na App Store ou Google Play e faça login. No Android você concede acesso ao Health Connect, no iPhone ao Apple Health, para que o app leia os dados do seu smartwatch.",
          "Se você tem um anel Colmi, abra a seção \"Anel inteligente\" e conecte-o por Bluetooth: passos, batimentos, SpO2 e sono entram no painel.",
          "Abra a tela \"Hoje\" e a seção Tendências no app: você encontra todas as métricas unificadas no celular, sem precisar alternar entre apps.",
        ],
        fr: [
          "Installez FitMesh Sync depuis l'App Store ou Google Play et connectez-vous. Sous Android, accordez l'accès à Health Connect, sur iPhone à Apple Health, pour que l'app lise les données de votre montre.",
          "Si vous avez une bague Colmi, ouvrez la section \"Bague connectée\" et connectez-la via Bluetooth : les pas, la fréquence cardiaque, la SpO2 et le sommeil arrivent dans le tableau de bord.",
          "Consultez l'écran \"Aujourd'hui\" et les Tendances dans l'app : vous retrouvez toutes vos mesures unifiées sur votre téléphone, sans jongler entre plusieurs applications.",
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
          it: ["Dashboard web personale", "Non ancora disponibile (in sviluppo)", "Non ancora disponibile (in sviluppo)"],
          en: ["Personal web dashboard", "Not yet available (in development)", "Not yet available (in development)"],
          es: ["Panel web personal", "No disponible aún (en desarrollo)", "No disponible aún (en desarrollo)"],
          de: ["Persönliches Web-Dashboard", "Noch nicht verfügbar (in Entwicklung)", "Noch nicht verfügbar (in Entwicklung)"],
          pt: ["Painel web pessoal", "Ainda não disponível (em desenvolvimento)", "Ainda não disponível (em desenvolvimento)"],
          fr: ["Tableau de bord web personnel", "Pas encore disponible (en développement)", "Pas encore disponible (en développement)"],
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
        it: "I dati salute sincronizzati sono associati al tuo account FitMesh. FitMesh non vende i tuoi dati e non mostra pubblicità: il servizio si sostiene con un acquisto una tantum o un abbonamento in-app, preceduti da una prova completa di 14 giorni. Se vuoi approfondire le modalità di trattamento e sicurezza, consulta la [Privacy Policy](/it/privacy).",
        en: "Synchronized health data is linked to your FitMesh account. FitMesh does not sell your data and displays no ads: the service is funded through a one-time purchase or in-app subscription, preceded by a full 14-day trial. To learn more about data processing and security, consult the [Privacy Policy](/en/privacy).",
        es: "Tus datos de salud sincronizados se asocian a tu cuenta de FitMesh. FitMesh no vende tus datos y no muestra publicidad: el servicio se financia mediante una suscripción o compra única in-app, precedida de 14 días de prueba completa. Para más información, consulta la [Política de Privacidad](/es/privacy).",
        de: "Deine synchronisierten Gesundheitsdaten sind mit deinem FitMesh-Konto verknüpft. FitMesh verkauft deine Daten nicht und zeigt keine Werbung: Der Dienst finanziert sich über ein In-App-Abonnement oder einen Einmalkauf, vorab mit 14 Tagen vollständiger Testphase. Weitere Details findest du in der [Datenschutzerklärung](/de/privacy).",
        pt: "Seus dados de saúde sincronizados ficam vinculados à sua conta FitMesh. O FitMesh não vende seus dados e não exibe anúncios: o serviço é mantido por assinatura ou compra única no app, com 14 dias de teste completo prévio. Para mais informações, veja a [Política de Privacidade](/pt/privacy).",
        fr: "Vos données de santé synchronisées sont associées à votre compte FitMesh. FitMesh ne vend pas vos données et n'affiche aucune publicité : le service est financé par un abonnement ou un achat unique in-app, précédé d'un essai complet de 14 jours. Pour en savoir plus, consultez la [Politique de confidentialité](/fr/privacy).",
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
        it: "Puoi cancellare l'account direttamente dall'app mobile: essendo già autenticato sul dispositivo, la cancellazione è immediata. Le richieste inviate via email o dall'area account web vengono elaborate con verifica di identità o periodo di ripensamento di 24 ore prima dell'esecuzione. FitMesh non crea backup propri del database, ma il fornitore dell'infrastruttura può conservare copie tecniche di ripristino per un massimo di 7 giorni secondo il proprio ciclo interno; quei dati residui non vengono usati da FitMesh per il trattamento ordinario. Cancellare l'account FitMesh non tocca i dati che restano sui servizi terzi collegati (Health Connect, Apple Salute, Samsung Health, provider esterni): quelli si gestiscono separatamente, da ciascun servizio. Dettagli completi nella [pagina dedicata alla cancellazione account](/it/delete-account).",
        en: "You can delete your account directly from the mobile app: since you're already signed in on that device, deletion is immediate. Requests sent by email or from the web account area are processed with an identity check or a 24-hour grace period before execution. FitMesh doesn't create its own database backups, but the infrastructure provider may retain technical recovery copies for up to 7 days under its own cycle; any residual data in those copies isn't used by FitMesh for normal processing. Deleting your FitMesh account doesn't touch the data that stays on connected third-party services (Health Connect, Apple Health, Samsung Health, external providers): those are managed separately, on each service. Full details on the [dedicated account deletion page](/en/delete-account).",
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
        it: "Per essere chiari su cosa FitMesh non è: non è un'intelligenza artificiale (la funzione \"Condividi con AI\" genera solo un testo con i tuoi dati, da incollare in un assistente esterno a tua scelta); non fa diagnosi né sostituisce il parere di un medico; non garantisce che ogni possibile doppione tra dispositivi venga sempre eliminato (la prioritizzazione copre i casi più comuni, ma non è una garanzia assoluta su ogni combinazione di fonti o timestamp sfalsati); non include una dashboard web personale live nella versione pubblica; non supporta integrazioni cloud dirette per Suunto; non importa automaticamente ogni metrica proprietaria di ogni dispositivo, solo quelle che il sistema operativo o il provider rendono disponibili; e non offre oggi un percorso self-host aperto al pubblico.",
        en: "To be clear about what FitMesh doesn't do: it isn't an AI (the \"Share with AI\" feature only generates a text with your data, to paste into an external assistant of your choice); it doesn't diagnose anything and doesn't replace a doctor's advice; it doesn't guarantee that every possible duplicate between devices is always eliminated (prioritization covers common scenarios, but is not an absolute guarantee across all source combinations or offset timestamps); it does not include an active personal web dashboard in the public release; it does not support direct cloud integrations for Suunto; it doesn't automatically import every proprietary metric from every device, only what the OS or provider makes available; and it doesn't offer a self-hosting path open to the public today.",
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
        it: "L'app FitMesh Sync è disponibile per Android su Google Play e per iOS sull'App Store in tutti gli store supportati, incluse tutte le storefront dei 27 Paesi UE. Prova il servizio con 14 giorni di prova completa: collega i tuoi wearable e l'anello Colmi e vedi le tue metriche unificate in un posto solo.",
        en: "The FitMesh Sync app is available for Android on Google Play and for iOS on the App Store across all supported storefronts, including all 27 EU countries. Test the service with a full 14-day trial: connect your wearables and the Colmi ring to see your unified metrics in one place.",
        es: "La app FitMesh Sync está disponible para Android en Google Play y para iOS en la App Store en todas las tiendas compatibles, incluidos los 27 países de la UE. Prueba el servicio con 14 días de prueba completa: conecta tus wearables y el anillo Colmi para ver tus métricas en un solo lugar.",
        de: "Die FitMesh Sync App ist für Android auf Google Play und für iOS im App Store in allen unterstützten Stores verfügbar, einschließlich aller 27 EU-Länder. Teste den Dienst 14 Tage lang unverbindlich: Verbinde deine Wearables und den Colmi-Ring, um deine Daten gebündelt zu sehen.",
        pt: "O app FitMesh Sync está disponível para Android no Google Play e para iOS na App Store em todas as lojas compatíveis, incluindo os 27 países da UE. Experimente com 14 dias de avaliação completa: conecte seus wearables e o anel Colmi e veja suas métricas unificadas em um só lugar.",
        fr: "L'app FitMesh Sync est disponible pour Android sur Google Play et pour iOS sur l'App Store dans toutes les boutiques prises en charge, y compris les 27 pays de l'UE. Essayez le service avec un essai complet de 14 jours : connectez vos wearables et la bague Colmi pour retrouver vos mesures réunies.",
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
        it: "FitMesh Sync legge i dati dei tuoi wearable, l'anello Colmi via Bluetooth e lo smartwatch tramite Health Connect su Android o Apple Salute su iOS, applica la prioritizzazione per evitare somme doppie e li mostra in un'unica dashboard sul telefono. I dati restano sul tuo account.",
        en: "FitMesh Sync reads your wearables' data, the Colmi ring over Bluetooth and your smartwatch through Health Connect on Android or Apple Health on iOS, merges it with prioritization (avoiding double counting) and shows it in one dashboard on your phone. Your data stays on your account.",
        es: "FitMesh Sync lee los datos de tus wearables, el anillo Colmi por Bluetooth y el smartwatch a través de Health Connect en Android o Apple Health en iOS, los unifica priorizando la fuente más coherente y los muestra en un único panel en el móvil. Tus datos se quedan en tu cuenta.",
        de: "FitMesh Sync liest die Daten deiner Wearables, den Colmi-Ring über Bluetooth und deine Smartwatch über Health Connect unter Android oder Apple Health unter iOS, führt sie per Quellenpriorisierung zusammen und zeigt sie in einem Dashboard auf dem Smartphone. Deine Daten bleiben in deinem Konto.",
        pt: "O FitMesh Sync lê os dados dos seus wearables, o anel Colmi por Bluetooth e o smartwatch pelo Health Connect no Android ou Apple Health no iOS, une tudo priorizando a fonte mais coerente e mostra em um único painel no celular. Seus dados ficam na sua conta.",
        fr: "FitMesh Sync lit les données de vos wearables, la bague Colmi via Bluetooth et votre montre via Health Connect sur Android ou Apple Health sur iOS, les réunit en priorisant la meilleure source et les affiche dans un tableau de bord sur votre téléphone. Vos données restent sur votre compte.",
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
        it: "Su Android, con qualsiasi dispositivo che scrive su Health Connect (la maggior parte di smartwatch e band recenti), più l'anello Colmi via Bluetooth. Su iPhone legge Apple Salute direttamente, oltre a connettersi all'anello Colmi via Bluetooth. Tra i provider esterni, Strava si collega via API; Oura è accessibile tramite il bridge di sistema (Health Connect / Apple Salute) se abilitato nell'app Oura, mentre l'API diretta non è live; l'integrazione con Suunto non è verificata né disponibile nella release pubblica.",
        en: "On Android, with any device that writes to Health Connect (most recent smartwatches and bands), plus the Colmi ring over Bluetooth. On iPhone it reads Apple Health directly, plus connects to the Colmi ring over Bluetooth. Among external providers, Strava connects via API; Oura is accessible via the system bridge (Health Connect / Apple Health) if enabled in the Oura app, while the direct API is not live; Suunto integration is unverified and unavailable in the public release.",
        es: "En Android, con cualquier dispositivo que escriba en Health Connect (la mayoría de smartwatches y pulseras recientes), más el anillo Colmi por Bluetooth. En iPhone lee Apple Health directamente, además de conectarse al anillo Colmi por Bluetooth. Entre los proveedores externos, Strava se conecta por API; Oura es accesible mediante el bridge del sistema (Health Connect / Apple Health) si está habilitado en la app Oura, mientras que la API directa no está activa; la integración con Suunto no está verificada ni disponible en la release pública.",
        de: "Unter Android mit jedem Gerät, das in Health Connect schreibt (die meisten aktuellen Smartwatches und Bänder), plus dem Colmi-Ring über Bluetooth. Auf dem iPhone liest es Apple Health direkt aus und verbindet sich über Bluetooth mit dem Colmi-Ring. Bei externen Anbietern verbindet sich Strava über API; Oura ist über die System-Bridge (Health Connect / Apple Health) nutzbar, sofern in der Oura-App aktiviert, während die direkte API nicht live ist; eine Suunto-Integration ist in der öffentlichen Version nicht verifiziert oder verfügbar.",
        pt: "No Android, com qualquer dispositivo que escreva no Health Connect (a maioria dos smartwatches e pulseiras recentes), além do anel Colmi por Bluetooth. No iPhone ele lê o Apple Health diretamente, além de se conectar ao anel Colmi por Bluetooth. Entre provedores externos, o Strava se conecta via API; o Oura é acessível pela bridge do sistema (Health Connect / Apple Health) se ativado no app Oura, enquanto a API direta não está ativa; a integração com Suunto não é verificada nem disponível na versão pública.",
        fr: "Sur Android, avec tout appareil écrivant dans Health Connect (la plupart des montres et bracelets récents), plus la bague Colmi via Bluetooth. Sur iPhone, il lit directement Apple Health et se connecte à la bague Colmi via Bluetooth. Côté fournisseurs externes, Strava se connecte via API ; Oura est accessible via la passerelle système (Health Connect / Apple Health) si activé dans l'app Oura, tandis que l'API directe n'est pas active ; l'intégration Suunto n'est pas vérifiée ni disponible dans la version publique.",
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
        it: "Sul tuo account. FitMesh non vende i tuoi dati e non mostra pubblicità. I tuoi dati sono accessibili direttamente dall'app mobile sul tuo telefono.",
        en: "On your account. FitMesh doesn't sell your data and shows no ads. Your data is accessible directly from the mobile app on your phone.",
        es: "En tu cuenta. FitMesh no vende tus datos y no muestra publicidad. Puedes consultar tus datos directamente desde la app en tu móvil.",
        de: "In deinem Konto. FitMesh verkauft deine Daten nicht und zeigt keine Werbung. Du kannst deine Daten direkt über die mobile App auf deinem Smartphone abrufen.",
        pt: "Na sua conta. O FitMesh não vende seus dados e não mostra anúncios. Seus dados podem ser acessados diretamente no app em seu celular.",
        fr: "Sur votre compte. FitMesh ne vend pas vos données et n'affiche aucune publicité. Vos données sont accessibles directement depuis l'application mobile sur votre téléphone.",
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
        it: "Non c'è un piano gratuito permanente, ma puoi provarlo con una prova completa di 14 giorni. Al termine puoi scegliere tra un abbonamento leggero (circa un caffè ogni sei mesi) o lo sblocco a vita (meno di una pizza).",
        en: "There's no permanent free plan, but you get a full 14-day trial. Afterwards you can choose between an affordable subscription (about a coffee every six months) or a one-time lifetime unlock (less than a pizza).",
        es: "No hay un plan gratuito permanente, pero cuentas con una prueba completa de 14 días. Después puedes elegir entre una suscripción económica (como un café cada seis meses) o un desbloqueo de por vida (menos que una pizza).",
        de: "Es gibt keinen dauerhaft kostenlosen Plan, aber eine vollständige 14-tägige Testphase. Danach kannst du zwischen einem günstigen Abo (weniger als ein Kaffee alle sechs Monate) oder einer lebenslangen Freischaltung (weniger als eine Pizza) wählen.",
        pt: "Não há um plano gratuito permanente, mas você conta com uma avaliação completa de 14 dias. Depois, pode escolher entre uma assinatura acessível (como um café a cada seis meses) ou um desbloqueio vitalício (menos que uma pizza).",
        fr: "Il n'y a pas de forfait gratuit permanent, mais vous disposez d'un essai complet de 14 jours. Ensuite, vous pouvez choisir entre un abonnement léger (moins qu'un café tous les six mois) ou un déblocage à vie (moins qu'une pizza).",
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
        it: "Sì. L'app Android è disponibile su Google Play e l'app iOS è live sull'App Store in tutti gli store supportati, incluse tutte le storefront dei 27 Paesi UE; su iPhone legge Apple Salute direttamente e supporta l'anello Colmi via Bluetooth.",
        en: "Yes. The Android app is available on Google Play and the iOS app is live on the App Store in all supported storefronts, including all 27 EU countries; on iPhone it reads Apple Health directly and connects to the Colmi ring over Bluetooth.",
        es: "Sí. La app Android está disponible en Google Play y la app iOS está disponible en la App Store en todos los países compatibles, incluidos los 27 países de la UE; en iPhone lee Apple Health directamente y conecta el anillo Colmi por Bluetooth.",
        de: "Ja. Die Android-App ist auf Google Play verfügbar und die iOS-App ist im App Store in allen unterstützten Ländern live, einschließlich aller 27 EU-Länder; auf dem iPhone liest sie Apple Health direkt aus und verbindet den Colmi-Ring über Bluetooth.",
        pt: "Sim. O app Android está disponível no Google Play e o app iOS está disponível na App Store em todas as lojas compatíveis, incluindo os 27 países da UE; no iPhone ele lê o Apple Health diretamente e se conecta ao anel Colmi por Bluetooth.",
        fr: "Oui. L'application Android est disponible sur Google Play et l'application iOS est disponible sur l'App Store dans toutes les boutiques prises en charge, y compris les 27 pays de l'UE ; sur iPhone, elle lit directement Apple Health et se connecte à la bague Colmi via Bluetooth.",
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
        it: "Sì, direttamente dall'app: la cancellazione dal telefono è immediata. Le richieste dall'area web dell'account hanno un periodo di ripensamento di 24 ore; quelle via email vengono eseguite dopo una verifica di identità. Dettagli completi nella [pagina di cancellazione account](/it/delete-account).",
        en: "Yes, directly from the app: deletion from your phone is immediate. Requests from the web account area have a 24-hour grace period; requests by email are carried out after an identity check. Full details on the [account deletion page](/en/delete-account).",
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
    "best-health-data-sync-app-android",
    "fitmesh-samsung-health-usarli-insieme",
    "steps-total-vs-hourly-chart",
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
