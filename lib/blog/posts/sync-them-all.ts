import type { BlogPost } from "../types";

/**
 * Pillar manifesto: un account FitMesh per unire ogni wearable in una dashboard
 * cross-device (Android + iPhone in arrivo). Messaggio brand fondativo.
 * Target: utenti multi-device che cercano un'alternativa agli ecosistemi chiusi.
 */
export const post: BlogPost = {
  slug: "sync-them-all",
  category: "ecosystem",
  publishedAt: "2026-06-13",
  updatedAt: "2026-06-14",
  readMinutes: 6,
  ldType: "Article",

  hero: {
    kicker: {
      it: "Manifesto",
      en: "Manifesto",
      es: "Manifiesto",
      de: "Manifest",
      pt: "Manifesto",
      fr: "Manifeste",
    },
    title: {
      it: "Un'app per sincronizzarli tutti: la dashboard che unisce ogni wearable",
      en: "One app to sync them all: the dashboard that unifies every wearable",
      es: "Una app para sincronizarlos todos: el panel que une cada wearable",
      de: "Eine App für alle: das Dashboard, das jeden Wearable vereint",
      pt: "Um app para sincronizar todos: o painel que une cada wearable",
      fr: "Une app pour tous les synchroniser: le tableau de bord qui regroupe chaque appareil connecté",
    },
    subtitle: {
      it: "Galaxy Watch, anello smart, Garmin, fascia cardio: i tuoi dati salute sono sparsi in app diverse. FitMesh li unisce in un'unica dashboard, senza doppi conteggi, su Android e iPhone.",
      en: "Galaxy Watch, smart ring, Garmin, chest strap: your health data is scattered across apps. FitMesh unifies it in one dashboard, no double counting, on Android and iPhone.",
      es: "Galaxy Watch, anillo inteligente, Garmin, banda cardíaca: tus datos de salud están repartidos entre distintas apps. FitMesh los reúne en un único panel, sin dobles conteos, en Android e iPhone.",
      de: "Galaxy Watch, Smart-Ring, Garmin, Herzfrequenz-Brustgurt: deine Gesundheitsdaten sind auf verschiedene Apps verteilt. FitMesh vereint sie in einem einzigen Dashboard, ohne Doppelzählungen, auf Android und iPhone.",
      pt: "Galaxy Watch, anel inteligente, Garmin, cinta cardíaca: seus dados de saúde estão espalhados por apps diferentes. FitMesh os reúne em um único painel, sem dupla contagem, no Android e no iPhone.",
      fr: "Galaxy Watch, bague connectée, Garmin, ceinture cardio: vos données de santé sont dispersées entre plusieurs apps. FitMesh les regroupe dans un seul tableau de bord, sans double comptage, sur Android et iPhone.",
    },
  },

  metaDescription: {
    it: "I tuoi wearable vivono in silos separati. FitMesh Sync li riunisce in un'unica dashboard cross-device: un account, ogni smartwatch e anello smart, niente doppi conteggi.",
    en: "Your wearables live in separate silos. FitMesh Sync brings them together in one cross-device dashboard: one account, every smartwatch and smart ring, no double counting.",
    es: "Tus wearables viven en silos separados. FitMesh Sync los reúne en un panel multidispositivo: una cuenta, cada smartwatch y anillo inteligente, sin dobles conteos.",
    de: "Deine Wearables leben in getrennten Silos. FitMesh Sync bringt sie in einem geräteübergreifenden Dashboard zusammen: ein Konto, jeder Smartwatch und Smart-Ring, keine Doppelzählungen.",
    pt: "Seus wearables vivem em silos separados. FitMesh Sync os reúne em um painel multidispositivo: uma conta, cada smartwatch e anel inteligente, sem dupla contagem.",
    fr: "Vos appareils connectés vivent dans des silos séparés. FitMesh Sync les réunit dans un tableau de bord multi-appareils: un compte, chaque montre connectée et bague connectée, sans double comptage.",
  },

  primaryKeyword: {
    it: "app sincronizzazione wearable",
    en: "sync all wearables app",
    es: "app sincronización wearables",
    de: "App Wearable synchronisieren",
    pt: "app sincronizar wearables",
    fr: "app synchronisation appareils connectés",
  },

  secondaryKeywords: {
    it: [
      "dashboard wearable unica",
      "unire dati smartwatch",
      "sincronizzare piu smartwatch",
      "app per tutti i wearable",
      "app salute multi-device",
      "fusione dati wearable",
      "un account per tutti i dispositivi salute",
    ],
    en: [
      "unified health dashboard",
      "combine smartwatch data",
      "one app for all wearables",
      "multi-device health app",
      "merge wearable data",
      "health data hub",
      "one account all health devices",
    ],
    pt: [
      "painel wearable único",
      "unir dados de smartwatch",
      "sincronizar vários smartwatches",
      "app para todos os wearables",
      "app de saúde multi-dispositivo",
      "fusão de dados wearable",
      "uma conta para todos os dispositivos de saúde",
    ],
    fr: [
      "tableau de bord wearable unique",
      "unifier les données de smartwatch",
      "synchroniser plusieurs smartwatchs",
      "app pour tous les wearables",
      "app de santé multi-appareils",
      "fusion des données wearable",
      "un compte pour tous les appareils de santé",
    ],
  },

  tldr: {
    it: [
      "I tuoi wearable parlano ecosistemi diversi: FitMesh li unisce in un'unica dashboard senza che tu debba scegliere un solo device.",
      "Un account FitMesh funziona su Android e iPhone (iOS in arrivo), con ponte opzionale verso Apple Salute.",
      "Fusione intelligente: per ogni metrica e ogni finestra di tempo viene scelta la fonte migliore, mai la somma di due.",
      "Piu dispositivi colleghi, piu la dashboard si completa: ogni device accende sezioni che prima erano vuote.",
      "Dati su server europei, mai condivisi con terzi, conformita GDPR completa.",
    ],
    en: [
      "Your wearables speak different ecosystems: FitMesh merges them into one dashboard without forcing you to pick a single device.",
      "One FitMesh account works on Android and iPhone (iOS coming soon), with optional Apple Health bridge.",
      "Smart fusion: for each metric and each time window the best source is chosen, never the sum of two.",
      "The more devices you connect, the more complete your dashboard gets: each device lights up sections that were empty before.",
      "Data on European servers, never shared with third parties, full GDPR compliance.",
    ],
    es: [
      "Tus wearables hablan ecosistemas distintos: FitMesh los unifica en un solo panel sin que tengas que elegir un único dispositivo.",
      "Una cuenta de FitMesh funciona en Android e iPhone (iOS próximamente), con puente opcional hacia Apple Salute.",
      "Fusión inteligente: para cada métrica y cada franja horaria se elige la mejor fuente, nunca la suma de dos.",
      "Cuantos más dispositivos conectes, más completo estará tu panel: cada dispositivo activa secciones que antes estaban vacías.",
      "Datos en servidores europeos, nunca compartidos con terceros, pleno cumplimiento del GDPR.",
    ],
    de: [
      "Deine Wearables sprechen verschiedene Ökosysteme: FitMesh vereint sie in einem einzigen Dashboard, ohne dass du dich für ein einziges Gerät entscheiden musst.",
      "Ein FitMesh-Konto funktioniert auf Android und iPhone (iOS demnächst verfügbar), mit optionaler Brücke zu Apple Health.",
      "Intelligente Datenzusammenführung: Für jede Kennzahl und jedes Zeitfenster wird die beste Quelle gewählt, niemals die Summe zweier Quellen.",
      "Je mehr Geräte du verbindest, desto vollständiger wird dein Dashboard: Jedes Gerät aktiviert Bereiche, die vorher leer waren.",
      "Daten auf europäischen Servern, nie an Dritte weitergegeben, vollständige DSGVO-Konformität.",
    ],
    pt: [
      "Seus wearables falam ecossistemas diferentes: FitMesh os une em um único painel sem que você precise escolher um único dispositivo.",
      "Uma conta FitMesh funciona no Android e no iPhone (iOS em breve), com ponte opcional para o Apple Health.",
      "Fusão inteligente: para cada métrica e cada janela de tempo, a melhor fonte é escolhida, nunca a soma de duas.",
      "Quanto mais dispositivos você conectar, mais completo fica seu painel: cada dispositivo ativa seções que antes estavam vazias.",
      "Dados em servidores europeus, nunca compartilhados com terceiros, conformidade total com o GDPR.",
    ],
    fr: [
      "Vos appareils connectés parlent des écosystèmes différents: FitMesh les réunit dans un seul tableau de bord sans vous obliger à choisir un seul appareil.",
      "Un compte FitMesh fonctionne sur Android et iPhone (iOS bientôt disponible), avec un pont optionnel vers Apple Health.",
      "Fusion intelligente: pour chaque métrique et chaque fenêtre temporelle, la meilleure source est choisie, jamais la somme de deux.",
      "Plus vous connectez d'appareils, plus votre tableau de bord se complète: chaque appareil active des sections qui étaient vides auparavant.",
      "Données sur des serveurs européens, jamais partagées avec des tiers, conformité RGPD complète.",
    ],
  },

  body: [
    {
      type: "paragraph",
      text: {
        it: "I tuoi dati di salute sono prigionieri. Il Galaxy Watch li tiene in Samsung Health, l'anello smart nella sua app, il Garmin in Garmin Connect, la fascia cardio in un'altra ancora. Ogni ecosistema vede solo se stesso, e tu salti tra cinque app per capire come stai davvero. **FitMesh esiste per questo: un'app per sincronizzarli tutti.**",
        en: "Your health data is trapped. The Galaxy Watch keeps it in Samsung Health, the smart ring in its own app, the Garmin in Garmin Connect, the chest strap somewhere else again. Every ecosystem sees only itself, and you hop between five apps to understand how you're actually doing. **That's why FitMesh exists: one app to sync them all.**",
        es: "Tus datos de salud están atrapados. El Galaxy Watch los guarda en Samsung Health, el anillo inteligente en su propia app, el Garmin en Garmin Connect, la banda cardíaca en otro sitio distinto. Cada ecosistema solo se ve a sí mismo, y tú saltas entre cinco apps para entender cómo estás de verdad. **Por eso existe FitMesh: una app para sincronizarlos todos.**",
        de: "Deine Gesundheitsdaten sitzen in der Falle. Die Galaxy Watch speichert sie in Samsung Health, der Smart-Ring in seiner eigenen App, der Garmin in Garmin Connect, der Herzfrequenz-Brustgurt irgendwo anders. Jedes Ökosystem sieht nur sich selbst, und du springst zwischen fünf Apps hin und her, um zu verstehen, wie es dir wirklich geht. **Dafür gibt es FitMesh: eine App, um sie alle zu synchronisieren.**",
        pt: "Seus dados de saúde estão presos. O Galaxy Watch os guarda no Samsung Health, o anel inteligente no próprio app, o Garmin no Garmin Connect, a cinta cardíaca em outro lugar. Cada ecossistema enxerga apenas a si mesmo, e você fica pulando entre cinco apps para entender como realmente está. **É para isso que o FitMesh existe: um app para sincronizar todos eles.**",
        fr: "Vos données de santé sont prisonnières. La Galaxy Watch les garde dans Samsung Health, la bague connectée dans son propre app, le Garmin dans Garmin Connect, la ceinture cardio ailleurs encore. Chaque écosystème ne se voit que lui-même, et vous passez d'une app à l'autre pour comprendre comment vous vous portez vraiment. **C'est pour cela que FitMesh existe: une app pour tous les synchroniser.**",
      },
    },
    {
      type: "paragraph",
      text: {
        it: "Non e uno slogan. E letteralmente l'architettura del prodotto: una dashboard che raccoglie i dati da ogni dispositivo che indossi e li unisce in una sola vista coerente, senza doppioni e senza che tu debba scegliere un solo device a cui essere fedele.",
        en: "It's not a slogan. It's literally the product architecture: a dashboard that pulls data from every device you wear and merges it into one coherent view, no duplicates, without forcing you to stay loyal to a single device.",
        es: "No es un eslogan. Es literalmente la arquitectura del producto: un panel que recoge los datos de cada dispositivo que llevas puesto y los fusiona en una sola vista coherente, sin duplicados y sin que tengas que ser fiel a un único dispositivo.",
        de: "Das ist kein Werbeslogan. Das ist buchstäblich die Produktarchitektur: ein Dashboard, das Daten von jedem Gerät, das du trägst, zusammenführt und in einer einzigen, konsistenten Ansicht vereint, ohne Duplikate und ohne dich an ein einziges Gerät zu binden.",
        pt: "Não é um slogan. É literalmente a arquitetura do produto: um painel que coleta dados de cada dispositivo que você usa e os une em uma única visão coerente, sem duplicatas e sem exigir que você seja fiel a um único aparelho.",
        fr: "Ce n'est pas un slogan. C'est littéralement l'architecture du produit: un tableau de bord qui collecte les données de chaque appareil que vous portez et les réunit en une seule vue cohérente, sans doublons et sans vous obliger à rester fidèle à un seul appareil.",
      },
    },

    {
      type: "heading",
      level: 2,
      text: {
        it: "Il problema: una vita, cinque app",
        en: "The problem: one life, five apps",
        es: "El problema: una vida, cinco apps",
        de: "Das Problem: ein Leben, fünf Apps",
        pt: "O problema: uma vida, cinco apps",
        fr: "Le problème: une vie, cinq apps",
      },
    },
    {
      type: "paragraph",
      text: {
        it: "Chi usa piu di un wearable lo sa: nessun produttore ti mostra il quadro completo. Samsung non legge il Garmin. Garmin non sa nulla del tuo anello. L'anello ignora la fascia cardio. Ognuno e bravissimo nel suo dominio e cieco su tutto il resto.",
        en: "Anyone who owns more than one wearable knows it: no manufacturer shows you the full picture. Samsung doesn't read your Garmin. Garmin knows nothing about your ring. The ring ignores the chest strap. Each is excellent in its own domain and blind to everything else.",
        es: "Quien usa más de un wearable lo sabe: ningún fabricante te muestra el panorama completo. Samsung no lee el Garmin. Garmin no sabe nada de tu anillo. El anillo ignora la banda cardíaca. Cada uno es excelente en su dominio y ciego ante todo lo demás.",
        de: "Wer mehr als einen Wearable besitzt, weiß es: Kein Hersteller zeigt dir das vollständige Bild. Samsung liest deinen Garmin nicht. Garmin weiß nichts von deinem Ring. Der Ring ignoriert den Herzfrequenz-Brustgurt. Jeder ist in seinem Bereich ausgezeichnet und blind für alles andere.",
        pt: "Quem usa mais de um wearable sabe: nenhum fabricante mostra o quadro completo. A Samsung não lê o Garmin. O Garmin não sabe nada sobre o seu anel. O anel ignora a cinta cardíaca. Cada um é excelente no seu domínio e cego para todo o resto.",
        fr: "Quiconque possède plus d'un appareil connecté le sait: aucun fabricant ne vous montre le tableau complet. Samsung ne lit pas votre Garmin. Garmin ne sait rien de votre bague connectée. La bague ignore la ceinture cardio. Chacun est excellent dans son domaine et aveugle sur tout le reste.",
      },
    },
    {
      type: "paragraph",
      text: {
        it: "Il risultato e una giornata spezzata in silos: i passi di qui, il sonno di la, gli allenamenti in un terzo posto. Per vedere un trend reale dovresti tenere a mente numeri da app diverse, e nessuno lo fa davvero.",
        en: "The result is a day split into silos: steps over here, sleep over there, workouts in a third place. To see a real trend you'd have to keep numbers from different apps in your head, and nobody actually does.",
        es: "El resultado es un día fragmentado en silos: los pasos aquí, el sueño allá, los entrenamientos en un tercer lugar. Para ver una tendencia real tendrías que recordar cifras de distintas apps, y nadie lo hace de verdad.",
        de: "Das Ergebnis ist ein Tag, der in Silos aufgeteilt ist: Schritte hier, Schlaf dort, Trainings an einem dritten Ort. Um einen echten Trend zu erkennen, müsste man sich Zahlen aus verschiedenen Apps merken, und das tut niemand wirklich.",
        pt: "O resultado é um dia fragmentado em silos: os passos aqui, o sono lá, os treinos em um terceiro lugar. Para ver uma tendência real, você teria que guardar na cabeça números de apps diferentes, e ninguém faz isso de verdade.",
        fr: "Le résultat est une journée fragmentée en silos: les pas ici, le sommeil là, les séances d'entraînement ailleurs. Pour voir une vraie tendance, il faudrait retenir des chiffres provenant de différentes apps, et personne ne le fait vraiment.",
      },
    },

    {
      type: "heading",
      level: 2,
      text: {
        it: "La soluzione: un hub che parla con tutti",
        en: "The solution: a hub that talks to everything",
        es: "La solución: un hub que habla con todos",
        de: "Die Lösung: ein Hub, der mit allen spricht",
        pt: "A solução: um hub que fala com todos",
        fr: "La solution: un hub qui parle à tout le monde",
      },
    },
    {
      type: "paragraph",
      text: {
        it: "FitMesh si mette al centro. Legge i dati da Health Connect (Galaxy Watch, Pixel Watch, Fitbit e qualsiasi wearable compatibile), dai provider cloud come Garmin e Suunto, e direttamente via Bluetooth dagli anelli smart come i Colmi R02/R03. Tutto confluisce in **una dashboard sola**, accessibile dallo stesso account su [Android e iPhone insieme](/it/lp/due-telefoni) (l'app iOS e in arrivo, lancio imminente).",
        en: "FitMesh sits in the middle. It reads data from Health Connect (Galaxy Watch, Pixel Watch, Fitbit and any compatible wearable), from cloud providers like Garmin and Suunto, and directly over Bluetooth from smart rings such as the Colmi R02/R03. Everything flows into **one single dashboard**, accessible from the same account on [Android and iPhone together](/en/lp/due-telefoni) (the iOS app is coming soon, launch imminent).",
        es: "FitMesh se sitúa en el centro. Lee los datos de Health Connect (Galaxy Watch, Pixel Watch, Fitbit y cualquier wearable compatible), de proveedores en la nube como Garmin y Suunto, y directamente por Bluetooth de anillos inteligentes como los Colmi R02/R03. Todo confluye en **un único panel**, accesible desde la misma cuenta en [Android e iPhone juntos](/es/lp/due-telefoni) (la app para iOS está próximamente disponible, lanzamiento inminente).",
        de: "FitMesh steht im Mittelpunkt. Es liest Daten aus Health Connect (Galaxy Watch, Pixel Watch, Fitbit und alle kompatiblen Wearables), von Cloud-Anbietern wie Garmin und Suunto sowie direkt per Bluetooth von Smart-Ringen wie dem Colmi R02/R03. Alles fließt in **ein einziges Dashboard**, das über dasselbe Konto auf [Android und iPhone gemeinsam](/de/lp/due-telefoni) zugänglich ist (die iOS-App kommt demnächst, Launch steht bevor).",
        pt: "FitMesh se coloca no centro. Ele lê dados do Health Connect (Galaxy Watch, Pixel Watch, Fitbit e qualquer wearable compatível), de provedores na nuvem como Garmin e Suunto, e diretamente via Bluetooth de anéis inteligentes como o Colmi R02/R03. Tudo converge em **um único painel**, acessível pela mesma conta no [Android e iPhone juntos](/pt/lp/due-telefoni) (o app para iOS está chegando em breve).",
        fr: "FitMesh se place au centre. Il lit les données de Health Connect (Galaxy Watch, Pixel Watch, Fitbit et tout appareil compatible), des fournisseurs cloud comme Garmin et Suunto, et directement via Bluetooth des bagues connectées comme les Colmi R02/R03. Tout converge dans **un seul tableau de bord**, accessible depuis le même compte sur [Android et iPhone ensemble](/fr/lp/due-telefoni) (l'app iOS arrive bientôt, lancement imminent).",
      },
    },
    {
      type: "table",
      caption: {
        it: "Ogni tipo di device copre un ruolo specifico: FitMesh unisce tutto",
        en: "Each device type covers a specific role: FitMesh brings them all together",
        es: "Cada tipo de dispositivo cubre un rol específico: FitMesh los une a todos",
        de: "Jeder Gerätetyp übernimmt eine bestimmte Rolle: FitMesh vereint alles",
        pt: "Cada tipo de dispositivo cobre um papel específico: FitMesh reúne tudo",
        fr: "Chaque type d'appareil couvre un rôle spécifique: FitMesh réunit tout",
      },
      headers: {
        it: ["Dispositivo", "Specialista di", "Quando ti copre"],
        en: ["Device", "Specialist in", "When it covers you"],
        es: ["Dispositivo", "Especialista en", "Cuándo te cubre"],
        de: ["Gerät", "Spezialist für", "Wann es dich abdeckt"],
        pt: ["Dispositivo", "Especialista em", "Quando te cobre"],
        fr: ["Appareil", "Spécialiste de", "Quand il vous couvre"],
      },
      rows: [
        {
          it: ["Smartwatch (Galaxy, Pixel, Apple)", "Vita quotidiana, attivita, sport", "Tutto il giorno"],
          en: ["Smartwatch (Galaxy, Pixel, Apple)", "Daily life, activity, sport", "All day"],
          es: ["Smartwatch (Galaxy, Pixel, Apple)", "Vida cotidiana, actividad, deporte", "Todo el día"],
          de: ["Smartwatch (Galaxy, Pixel, Apple)", "Alltag, Aktivität, Sport", "Den ganzen Tag"],
          pt: ["Smartwatch (Galaxy, Pixel, Apple)", "Vida cotidiana, atividade, esporte", "O dia todo"],
          fr: ["Montre connectée (Galaxy, Pixel, Apple)", "Vie quotidienne, activité, sport", "Toute la journée"],
        },
        {
          it: ["Anello smart", "Sonno, recupero, battito a riposo", "La notte e quando il watch e in carica"],
          en: ["Smart ring", "Sleep, recovery, resting heart rate", "At night and when the watch is charging"],
          es: ["Anillo inteligente", "Sueño, recuperación, frecuencia cardíaca en reposo", "Por la noche y cuando el reloj está cargando"],
          de: ["Smart-Ring", "Schlaf, Erholung, Ruheherzfrequenz", "Nachts und wenn die Smartwatch lädt"],
          pt: ["Anel inteligente", "Sono, recuperação, frequência cardíaca em repouso", "À noite e quando o relógio está carregando"],
          fr: ["Bague connectée", "Sommeil, récupération, fréquence cardiaque au repos", "La nuit et quand la montre est en charge"],
        },
        {
          it: ["Sportwatch (Garmin, Suunto)", "Allenamenti, GPS, VO2max", "Durante gare e sessioni"],
          en: ["Sportwatch (Garmin, Suunto)", "Workouts, GPS, VO2max", "During races and sessions"],
          es: ["Sportwatch (Garmin, Suunto)", "Entrenamientos, GPS, VO2max", "Durante carreras y sesiones"],
          de: ["Sportuhr (Garmin, Suunto)", "Trainings, GPS, VO2max", "Bei Wettkämpfen und Einheiten"],
          pt: ["Sportwatch (Garmin, Suunto)", "Treinos, GPS, VO2max", "Durante corridas e sessões"],
          fr: ["Montre sport (Garmin, Suunto)", "Entraînements, GPS, VO2max", "Pendant les courses et les séances"],
        },
        {
          it: ["Fascia cardio", "Battito durante lo sforzo", "Negli allenamenti specifici"],
          en: ["Chest strap", "Heart rate under effort", "In specific workouts"],
          es: ["Banda cardíaca", "Frecuencia cardíaca durante el esfuerzo", "En entrenamientos específicos"],
          de: ["Herzfrequenz-Brustgurt", "Herzfrequenz unter Belastung", "Bei gezielten Trainings"],
          pt: ["Cinta cardíaca", "Frequência cardíaca sob esforço", "Em treinos específicos"],
          fr: ["Ceinture cardio", "Fréquence cardiaque à l'effort", "Lors des entraînements spécifiques"],
        },
      ],
    },

    {
      type: "heading",
      level: 2,
      text: {
        it: "La parte difficile: unire senza fare confusione",
        en: "The hard part: merging without confusion",
        es: "La parte difícil: unir sin crear confusión",
        de: "Die schwierige Seite: zusammenführen ohne Chaos",
        pt: "A parte difícil: unir sem criar confusão",
        fr: "La partie difficile: fusionner sans créer de confusion",
      },
    },
    {
      type: "paragraph",
      text: {
        it: "Mettere insieme cinque fonti e facile a parole. La sfida vera e non sommare due volte gli stessi passi quando hai watch e anello al polso nella stessa ora. FitMesh non somma alla cieca: per ogni metrica e ogni momento sceglie **la fonte migliore**, non tutte insieme.",
        en: "Combining five sources is easy to say. The real challenge is not counting the same steps twice when you wear both watch and ring in the same hour. FitMesh doesn't sum blindly: for each metric and each moment it picks **the best source**, not all of them at once.",
        es: "Combinar cinco fuentes es fácil de decir. El verdadero reto es no contar los mismos pasos dos veces cuando llevas el reloj y el anillo a la vez durante la misma hora. FitMesh no suma a ciegas: para cada métrica y cada momento elige **la mejor fuente**, no todas a la vez.",
        de: "Fünf Quellen zusammenzuführen klingt einfach. Die eigentliche Herausforderung besteht darin, dieselben Schritte nicht zweimal zu zählen, wenn du Smartwatch und Ring gleichzeitig in derselben Stunde trägst. FitMesh summiert nicht blind: Für jede Kennzahl und jeden Moment wählt es **die beste Quelle**, nicht alle auf einmal.",
        pt: "Combinar cinco fontes é fácil de dizer. O verdadeiro desafio é não contar os mesmos passos duas vezes quando você usa relógio e anel ao mesmo tempo na mesma hora. FitMesh não soma às cegas: para cada métrica e cada momento, escolhe **a melhor fonte**, não todas ao mesmo tempo.",
        fr: "Combiner cinq sources est facile à dire. Le vrai défi est de ne pas compter les mêmes pas deux fois quand vous portez montre et bague connectée pendant la même heure. FitMesh ne somme pas aveuglément: pour chaque métrique et chaque moment, il choisit **la meilleure source**, pas toutes en même temps.",
      },
    },
    {
      type: "callout",
      variant: "tip",
      title: {
        it: "Il principio in una frase",
        en: "The principle in one line",
        es: "El principio en una frase",
        de: "Das Prinzip in einem Satz",
        pt: "O princípio em uma frase",
        fr: "Le principe en une phrase",
      },
      body: {
        it: "**Unione prima, conflitto poi.** Se una metrica la fornisce un solo dispositivo, si prende e basta: e cosi che l'anello accende metriche come lo stress o l'HRV notturno che lo smartwatch non misura. Se invece due dispositivi misurano la stessa cosa nello stesso momento, vince lo specialista per quel dominio: il sonno dall'anello, l'allenamento dallo sportwatch, i passi della giornata dal watch.",
        en: "**Union first, conflict second.** If a metric comes from a single device, it's taken as-is: that's how the ring lights up metrics like stress or nighttime HRV that the smartwatch doesn't measure. If two devices measure the same thing at the same time, the specialist for that domain wins: sleep from the ring, the workout from the sportwatch, the day's steps from the watch.",
        es: "**Unión primero, conflicto después.** Si una métrica la proporciona un solo dispositivo, se toma tal cual: así es como el anillo activa métricas como el estrés o el HRV nocturno que el smartwatch no mide. Si dos dispositivos miden lo mismo al mismo tiempo, gana el especialista en ese dominio: el sueño del anillo, el entrenamiento del sportwatch, los pasos del día del reloj.",
        de: "**Zusammenführung zuerst, Konflikt danach.** Wenn eine Kennzahl nur von einem einzigen Gerät geliefert wird, wird sie einfach übernommen: So aktiviert der Ring Kennzahlen wie Stress oder nächtliche HRV, die die Smartwatch nicht misst. Wenn zwei Geräte dasselbe zur selben Zeit messen, gewinnt der Spezialist für diesen Bereich: Schlaf vom Ring, das Training von der Sportuhr, die Tagesschritte von der Smartwatch.",
        pt: "**União primeiro, conflito depois.** Se uma métrica é fornecida por um único dispositivo, ela é simplesmente aceita: é assim que o anel ativa métricas como estresse ou HRV noturno que o smartwatch não mede. Se dois dispositivos medem a mesma coisa ao mesmo tempo, o especialista naquele domínio vence: o sono vem do anel, o treino do sportwatch, os passos do dia do relógio.",
        fr: "**Union d'abord, conflit ensuite.** Si une métrique ne provient que d'un seul appareil, elle est prise telle quelle: c'est ainsi que la bague connectée active des métriques comme le stress ou le HRV nocturne que la montre connectée ne mesure pas. Si deux appareils mesurent la même chose au même moment, le spécialiste de ce domaine l'emporte: le sommeil de la bague, l'entraînement de la montre sport, les pas de la journée de la montre.",
      },
    },
    {
      type: "paragraph",
      text: {
        it: "La conseguenza e la cosa piu bella: **piu dispositivi colleghi, piu la tua dashboard si completa.** Ogni device aggiunto non si limita a migliorare un numero, accende sezioni che prima erano vuote.",
        en: "And here's the best consequence: **the more devices you connect, the more complete your dashboard gets.** Every device you add doesn't just improve a number, it lights up sections that were empty before.",
        es: "Y esta es la mejor consecuencia: **cuantos más dispositivos conectes, más completo estará tu panel.** Cada dispositivo que añades no solo mejora un número, también activa secciones que antes estaban vacías.",
        de: "Und das ist die schönste Konsequenz: **Je mehr Geräte du verbindest, desto vollständiger wird dein Dashboard.** Jedes hinzugefügte Gerät verbessert nicht nur eine Zahl, es aktiviert Bereiche, die vorher leer waren.",
        pt: "E esta é a melhor consequência: **quanto mais dispositivos você conectar, mais completo fica seu painel.** Cada dispositivo adicionado não apenas melhora um número, ele ativa seções que antes estavam vazias.",
        fr: "Et voici la meilleure conséquence: **plus vous connectez d'appareils, plus votre tableau de bord se complète.** Chaque appareil ajouté n'améliore pas seulement un chiffre, il active des sections qui étaient vides auparavant.",
      },
    },

    {
      type: "heading",
      level: 2,
      text: {
        it: "Una giornata, una timeline continua",
        en: "One day, one continuous timeline",
        es: "Un día, una línea de tiempo continua",
        de: "Ein Tag, eine kontinuierliche Zeitlinie",
        pt: "Um dia, uma linha do tempo contínua",
        fr: "Une journée, une ligne du temps continue",
      },
    },
    {
      type: "paragraph",
      text: {
        it: "Ecco come FitMesh ricompone una giornata reale di chi usa piu device:",
        en: "Here's how FitMesh reassembles a real day for someone who uses multiple devices:",
        es: "Así recompone FitMesh un día real de alguien que usa varios dispositivos:",
        de: "So setzt FitMesh einen echten Tag für jemanden zusammen, der mehrere Geräte verwendet:",
        pt: "Veja como FitMesh reconstrói um dia real de quem usa vários dispositivos:",
        fr: "Voici comment FitMesh reconstitue une vraie journée pour quelqu'un qui utilise plusieurs appareils:",
      },
    },
    {
      type: "list",
      items: {
        it: [
          "**Notte** -- dormi con l'anello, il watch e in carica: sonno, HRV e battito a riposo arrivano dall'anello.",
          "**Giorno** -- il watch al polso conta passi, calorie e battito.",
          "**Allenamento** -- il Garmin con la fascia registra la corsa: GPS, ritmo e battito precisi, presi come sessione unica.",
          "**Sera** -- di nuovo il watch per i passi fino a fine giornata.",
        ],
        en: [
          "**Night** -- you sleep with the ring, the watch is charging: sleep, HRV and resting heart rate come from the ring.",
          "**Day** -- the watch on your wrist counts steps, calories and heart rate.",
          "**Workout** -- the Garmin with the chest strap records the run: precise GPS, pace and heart rate, taken as a single session.",
          "**Evening** -- the watch again for steps until the end of the day.",
        ],
        es: [
          "**Noche** -- duermes con el anillo, el reloj está cargando: el sueño, el HRV y la frecuencia cardíaca en reposo vienen del anillo.",
          "**Día** -- el reloj en la muñeca cuenta pasos, calorías y frecuencia cardíaca.",
          "**Entrenamiento** -- el Garmin con la banda cardíaca registra la carrera: GPS, ritmo y frecuencia cardíaca precisos, tomados como una única sesión.",
          "**Tarde** -- de nuevo el reloj para los pasos hasta el final del día.",
        ],
        de: [
          "**Nacht** -- du schläfst mit dem Ring, die Smartwatch lädt: Schlaf, HRV und Ruheherzfrequenz kommen vom Ring.",
          "**Tag** -- die Smartwatch am Handgelenk zählt Schritte, Kalorien und Herzfrequenz.",
          "**Training** -- der Garmin mit dem Herzfrequenz-Brustgurt zeichnet den Lauf auf: präzises GPS, Tempo und Herzfrequenz, als einzelne Einheit erfasst.",
          "**Abend** -- wieder die Smartwatch für die Schritte bis zum Ende des Tages.",
        ],
        pt: [
          "**Noite** -- você dorme com o anel, o relógio está carregando: sono, HRV e frequência cardíaca em repouso vêm do anel.",
          "**Dia** -- o relógio no pulso conta passos, calorias e frequência cardíaca.",
          "**Treino** -- o Garmin com a cinta cardíaca registra a corrida: GPS, ritmo e frequência cardíaca precisos, capturados como uma única sessão.",
          "**Tarde** -- de novo o relógio para os passos até o fim do dia.",
        ],
        fr: [
          "**Nuit** -- vous dormez avec la bague connectée, la montre est en charge: le sommeil, le HRV et la fréquence cardiaque au repos proviennent de la bague.",
          "**Journée** -- la montre connectée au poignet compte les pas, les calories et la fréquence cardiaque.",
          "**Entraînement** -- le Garmin avec la ceinture cardio enregistre la course: GPS, allure et fréquence cardiaque précis, capturés comme une seule séance.",
          "**Soir** -- à nouveau la montre connectée pour les pas jusqu'à la fin de la journée.",
        ],
      },
    },
    {
      type: "paragraph",
      text: {
        it: "Nessun buco, nessun doppione. Una sola linea continua, indipendentemente da cosa avevi addosso in quel momento. E questo che intendiamo con *un'app per sincronizzarli tutti*.",
        en: "No gaps, no duplicates. One continuous line, regardless of what you were wearing at any given moment. That's what we mean by *one app to sync them all*.",
        es: "Sin huecos, sin duplicados. Una sola línea continua, independientemente de lo que llevaras puesto en cada momento. Eso es lo que queremos decir con *una app para sincronizarlos todos*.",
        de: "Keine Lücken, keine Duplikate. Eine einzige, kontinuierliche Linie, unabhängig davon, was du in dem jeweiligen Moment getragen hast. Das meinen wir mit *einer App für alle synchronisieren*.",
        pt: "Sem lacunas, sem duplicatas. Uma única linha contínua, independentemente do que você estava usando em cada momento. É isso que queremos dizer com *um app para sincronizar todos eles*.",
        fr: "Aucun trou, aucun doublon. Une seule ligne continue, peu importe ce que vous portiez à chaque instant. C'est ce que nous entendons par *une app pour tous les synchroniser*.",
      },
    },

    {
      type: "heading",
      level: 2,
      text: {
        it: "Un account, Android e iPhone",
        en: "One account, Android and iPhone",
        es: "Una cuenta, Android e iPhone",
        de: "Ein Konto, Android und iPhone",
        pt: "Uma conta, Android e iPhone",
        fr: "Un compte, Android et iPhone",
      },
    },
    {
      type: "paragraph",
      text: {
        it: "FitMesh Sync e disponibile su Android con Health Connect integrato. L'app iPhone e in fase di rilascio imminente: con lo stesso account potrai vedere la tua dashboard su entrambi i telefoni, con ponte opzionale verso Apple Salute per chi vuole portare i dati anche nell'ecosistema Apple. [Android e iPhone insieme](/it/lp/due-telefoni): un solo account, una sola storia di salute.",
        en: "FitMesh Sync is available on Android with Health Connect integrated. The iPhone app is launching imminently: with the same account you'll be able to view your dashboard on both phones, with an optional bridge to Apple Health for those who want to bring data into the Apple ecosystem too. [Android and iPhone together](/en/lp/due-telefoni): one account, one health history.",
        es: "FitMesh Sync está disponible en Android con Health Connect integrado. La app para iPhone está a punto de lanzarse: con la misma cuenta podrás ver tu panel en ambos teléfonos, con un puente opcional hacia Apple Salute para quienes quieran llevar los datos también al ecosistema Apple. [Android e iPhone juntos](/es/lp/due-telefoni): una sola cuenta, una sola historia de salud.",
        de: "FitMesh Sync ist auf Android mit integriertem Health Connect verfügbar. Die iPhone-App erscheint in Kürze: Mit demselben Konto kannst du dein Dashboard auf beiden Telefonen aufrufen, mit einer optionalen Brücke zu Apple Health für alle, die ihre Daten auch ins Apple-Ökosystem bringen möchten. [Android und iPhone gemeinsam](/de/lp/due-telefoni): ein Konto, eine Gesundheitsgeschichte.",
        pt: "FitMesh Sync está disponível no Android com Health Connect integrado. O app para iPhone está prestes a ser lançado: com a mesma conta você poderá ver seu painel nos dois telefones, com uma ponte opcional para o Apple Health para quem quiser levar os dados também para o ecossistema Apple. [Android e iPhone juntos](/pt/lp/due-telefoni): uma conta, um histórico de saúde.",
        fr: "FitMesh Sync est disponible sur Android avec Health Connect intégré. L'app iPhone est sur le point de sortir: avec le même compte vous pourrez consulter votre tableau de bord sur les deux téléphones, avec un pont optionnel vers Apple Health pour ceux qui souhaitent apporter leurs données dans l'écosystème Apple également. [Android et iPhone ensemble](/fr/lp/due-telefoni): un compte, un historique de santé.",
      },
    },

    {
      type: "heading",
      level: 2,
      text: {
        it: "Privacy: i tuoi dati restano tuoi",
        en: "Privacy: your data stays yours",
        es: "Privacidad: tus datos siguen siendo tuyos",
        de: "Datenschutz: deine Daten bleiben deine",
        pt: "Privacidade: seus dados continuam sendo seus",
        fr: "Confidentialité: vos données restent les vôtres",
      },
    },
    {
      type: "paragraph",
      text: {
        it: "Unire tutto in un posto solo ha senso solo se quel posto e sicuro. I dati salute di FitMesh vivono su server europei, sono accessibili solo a te tramite il tuo account, non vengono mai venduti ne condivisi con terze parti, e non c'e alcun tracker pubblicitario. La cancellazione di account e dati avviene entro 48 ore, come previsto dal GDPR.",
        en: "Bringing everything into one place only makes sense if that place is secure. FitMesh's health data lives on European servers, is accessible only to you through your account, is never sold or shared with third parties, and there are no ad trackers. Account and data deletion happens within 48 hours, as required by GDPR.",
        es: "Reunir todo en un solo lugar solo tiene sentido si ese lugar es seguro. Los datos de salud de FitMesh viven en servidores europeos, son accesibles únicamente a través de tu cuenta, nunca se venden ni se comparten con terceros, y no hay ningún rastreador publicitario. La eliminación de cuenta y datos se realiza en un plazo de 48 horas, según lo exige el GDPR.",
        de: "Alles an einem Ort zusammenzuführen macht nur Sinn, wenn dieser Ort sicher ist. Die Gesundheitsdaten von FitMesh liegen auf europäischen Servern, sind nur über dein Konto für dich zugänglich, werden niemals verkauft oder an Dritte weitergegeben, und es gibt keine Werbe-Tracker. Konto- und Datenlöschung erfolgt innerhalb von 48 Stunden, wie von der DSGVO vorgeschrieben.",
        pt: "Reunir tudo em um só lugar só faz sentido se esse lugar for seguro. Os dados de saúde do FitMesh ficam em servidores europeus, são acessíveis apenas por você através da sua conta, nunca são vendidos nem compartilhados com terceiros, e não há rastreadores publicitários. A exclusão de conta e dados acontece em até 48 horas, conforme exigido pelo GDPR.",
        fr: "Tout regrouper en un seul endroit n'a de sens que si cet endroit est sécurisé. Les données de santé de FitMesh résident sur des serveurs européens, ne sont accessibles qu'à vous via votre compte, ne sont jamais vendues ni partagées avec des tiers, et il n'y a aucun traceur publicitaire. La suppression du compte et des données s'effectue dans les 48 heures, comme l'exige le RGPD.",
      },
    },

    {
      type: "cta",
      title: {
        it: "Sei tra i primi 1000?",
        en: "Among the first 1000?",
        es: "¿Estás entre los primeros 1000?",
        de: "Bist du unter den ersten 1000?",
        pt: "Você está entre os primeiros 1000?",
        fr: "Êtes-vous parmi les 1000 premiers?",
      },
      body: {
        it: "FitMesh Sync e in beta privata. Crea l'account e il primo anno di Pro e in regalo, si attiva da solo. Porta tutti i tuoi dispositivi in un'unica dashboard.",
        en: "FitMesh Sync is in private beta. Create your account and your first year of Pro is on us, it activates automatically. Bring all your devices into one dashboard.",
        es: "FitMesh Sync está en beta privada. Crea tu cuenta y el primer año de Pro es un regalo que se activa solo. Lleva todos tus dispositivos a un único panel.",
        de: "FitMesh Sync befindet sich in der geschlossenen Beta. Erstelle dein Konto und das erste Pro-Jahr ist ein Geschenk von uns, es aktiviert sich automatisch. Bringe alle deine Geräte in ein einziges Dashboard.",
        pt: "FitMesh Sync está em beta privado. Crie sua conta e o primeiro ano de Pro é por nossa conta, ele se ativa automaticamente. Leve todos os seus dispositivos para um único painel.",
        fr: "FitMesh Sync est en bêta privée. Créez votre compte et votre première année de Pro est offerte, elle s'active automatiquement. Regroupez tous vos appareils dans un seul tableau de bord.",
      },
      ctaLabel: {
        it: "Diventa founder",
        en: "Become a founder",
        es: "Conviértete en founder",
        de: "Werde Gründungsmitglied",
        pt: "Torne-se fundador",
        fr: "Devenez fondateur",
      },
      ctaHref: {
        it: "/it/beta",
        en: "/en/beta",
      },
    },
  ],

  faq: [
    {
      q: {
        it: "Quali dispositivi posso collegare a FitMesh?",
        en: "Which devices can I connect to FitMesh?",
        es: "¿Qué dispositivos puedo conectar a FitMesh?",
        de: "Welche Geräte kann ich mit FitMesh verbinden?",
        pt: "Quais dispositivos posso conectar ao FitMesh?",
        fr: "Quels appareils puis-je connecter à FitMesh?",
      },
      a: {
        it: "Qualsiasi wearable compatibile con Health Connect (Galaxy Watch, Pixel Watch, Fitbit e altri), i provider cloud come Garmin e Suunto, e gli anelli smart Colmi R02/R03 via Bluetooth diretto. La lista completa e nella pagina [integrazioni](/integrations).",
        en: "Any Health Connect-compatible wearable (Galaxy Watch, Pixel Watch, Fitbit and others), cloud providers like Garmin and Suunto, and Colmi R02/R03 smart rings over direct Bluetooth. The full list is on the [integrations](/integrations) page.",
        es: "Cualquier wearable compatible con Health Connect (Galaxy Watch, Pixel Watch, Fitbit y otros), proveedores en la nube como Garmin y Suunto, y los anillos inteligentes Colmi R02/R03 por Bluetooth directo. La lista completa está en la página de [integraciones](/integrations).",
        de: "Alle mit Health Connect kompatiblen Wearables (Galaxy Watch, Pixel Watch, Fitbit und andere), Cloud-Anbieter wie Garmin und Suunto sowie die Smart-Ringe Colmi R02/R03 per direktem Bluetooth. Die vollständige Liste findest du auf der Seite [Integrationen](/integrations).",
        pt: "Qualquer wearable compatível com Health Connect (Galaxy Watch, Pixel Watch, Fitbit e outros), provedores na nuvem como Garmin e Suunto, e os anéis inteligentes Colmi R02/R03 via Bluetooth direto. A lista completa está na página de [integrações](/integrations).",
        fr: "Tout appareil connecté compatible avec Health Connect (Galaxy Watch, Pixel Watch, Fitbit et autres), les fournisseurs cloud comme Garmin et Suunto, et les bagues connectées Colmi R02/R03 via Bluetooth direct. La liste complète se trouve sur la page [intégrations](/integrations).",
      },
    },
    {
      q: {
        it: "FitMesh somma i passi di due dispositivi insieme?",
        en: "Does FitMesh add up steps from two devices?",
        es: "¿FitMesh suma los pasos de dos dispositivos?",
        de: "Addiert FitMesh die Schritte von zwei Geräten?",
        pt: "FitMesh soma os passos de dois dispositivos?",
        fr: "FitMesh additionne-t-il les pas de deux appareils?",
      },
      a: {
        it: "No. Per ogni metrica e ogni finestra di tempo sceglie una sola fonte, mai la somma. E la regola che evita i doppi conteggi quando indossi piu device contemporaneamente.",
        en: "No. For each metric and each time window it picks a single source, never the sum. That's the rule that avoids double counting when you wear several devices at once.",
        es: "No. Para cada métrica y cada franja horaria elige una única fuente, nunca la suma. Es la regla que evita los dobles conteos cuando llevas varios dispositivos a la vez.",
        de: "Nein. Für jede Kennzahl und jedes Zeitfenster wird eine einzige Quelle gewählt, niemals die Summe. Das ist die Regel, die Doppelzählungen vermeidet, wenn du mehrere Geräte gleichzeitig trägst.",
        pt: "Não. Para cada métrica e cada janela de tempo, ele escolhe uma única fonte, nunca a soma. Essa é a regra que evita a dupla contagem quando você usa vários dispositivos ao mesmo tempo.",
        fr: "Non. Pour chaque métrique et chaque fenêtre temporelle, il choisit une seule source, jamais la somme. C'est la règle qui évite le double comptage quand vous portez plusieurs appareils simultanément.",
      },
    },
    {
      q: {
        it: "FitMesh funziona anche su iPhone?",
        en: "Does FitMesh work on iPhone too?",
        es: "¿FitMesh funciona también en iPhone?",
        de: "Funktioniert FitMesh auch auf dem iPhone?",
        pt: "FitMesh funciona também no iPhone?",
        fr: "FitMesh fonctionne-t-il aussi sur iPhone?",
      },
      a: {
        it: "L'app iOS e in rilascio imminente. Con lo stesso account FitMesh potrai accedere alla tua dashboard su Android e iPhone, con ponte opzionale verso Apple Salute. Iscriviti alla beta per essere tra i primi ad accedervi.",
        en: "The iOS app is launching imminently. With the same FitMesh account you'll be able to access your dashboard on Android and iPhone, with an optional bridge to Apple Health. Sign up for the beta to be among the first to access it.",
        es: "La app para iOS está a punto de lanzarse. Con la misma cuenta de FitMesh podrás acceder a tu panel en Android e iPhone, con un puente opcional hacia Apple Salute. Suscríbete a la beta para ser de los primeros en acceder.",
        de: "Die iOS-App erscheint in Kürze. Mit demselben FitMesh-Konto kannst du auf dein Dashboard auf Android und iPhone zugreifen, mit einer optionalen Brücke zu Apple Health. Registriere dich für die Beta, um als einer der Ersten Zugang zu erhalten.",
        pt: "O app para iOS está prestes a ser lançado. Com a mesma conta FitMesh você poderá acessar seu painel no Android e no iPhone, com uma ponte opcional para o Apple Health. Inscreva-se na beta para ser um dos primeiros a acessar.",
        fr: "L'app iOS est sur le point de sortir. Avec le même compte FitMesh vous pourrez accéder à votre tableau de bord sur Android et iPhone, avec un pont optionnel vers Apple Health. Inscrivez-vous à la bêta pour être parmi les premiers à y accéder.",
      },
    },
  ],

  related: [
    "novita-fonte-del-dato",
    "colmi-ring-fitmesh",
    "piu-smartwatch-insieme-dati-doppi",
    "anello-vs-smartwatch",
  ],

  brandsMentioned: [
    "Samsung",
    "Garmin",
    "Suunto",
    "Fitbit",
    "Colmi",
    "Google",
    "Apple",
  ],
};
