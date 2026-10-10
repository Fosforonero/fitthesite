import type { BlogPost } from "../types";
// Sprint P0.10G: frase Founder INVARIANTE (mai un ramo aperto/chiuso
// risolto al build) — vedi lib/founder/historical-note.ts.
import { founderHistoricalClause, founderEligibilityStatement } from "@/lib/founder/historical-note";

/**
 * BOFU pricing page: risponde a "FitMesh è gratis / quanto costa" prima
 * dell'installazione. Articolo chiave per i ricavi: onestà sul modello
 * (niente free tier permanente), prova 14gg -> abbonamento o lifetime,
 * cosa include il Pro.
 *
 * CORREZIONE BLOCCANTE Sprint P0.10G: la versione precedente aveva it/en
 * riscritti in tempo PASSATO ("il programma Founder si è chiuso il 31
 * luglio 2026") — FALSO al momento di questa correzione (2026-07-29, il
 * cutoff non è ancora passato) — mentre es/de/pt/fr erano rimasti alla
 * versione pre-sunset, interamente al presente/ongoing ("i primi 1000
 * iscritti diventano founder"), che sarebbe diventata falsa in modo
 * silenzioso al passare del cutoff. Tutte e 6 le locale ora usano la
 * stessa frase INVARIANTE (lib/founder/historical-note.ts), vera sia
 * prima sia dopo il cutoff perché descrive la regola di idoneità, non lo
 * stato del programma in questo istante.
 * Locali: it/en/es/de/pt/fr.
 *
 * Sprint P0.10K (2026-07-31) — chiusura commerciale del sito: allineate le
 * locale es/de/pt/fr, che erano rimaste indietro rispetto a it/en. Rimosso
 * ogni framing "posti ancora disponibili" (title/H2/bullet "plazas founder"
 * agotadas, "founder-Plätze mehr?", "vagas founder", "places founder") e
 * ogni condizionale al presente del tipo "se ottieni un posto founder":
 * il programma è raccontato al passato in tutte e sei le locale, con il
 * cutoff e il requisito della prima sincronizzazione espliciti. Nessun
 * beneficio già concesso viene rimesso in discussione.
 */
export const post: BlogPost = {
  slug: "fitmesh-gratis-prezzo-founder",
  category: "guides",
  publishedAt: "2026-07-02",
  updatedAt: "2026-09-02",
  readMinutes: 8,
  tldr: {
    it: [
      "FitMesh non ha un piano gratuito permanente: chi cerca 'gratis per sempre' deve saperlo subito.",
      "Prova FitMesh Pro per 14 giorni. Al termine, per continuare a usare le funzioni Pro serve un acquisto o un abbonamento.",
      "Dopo i 14 giorni puoi continuare con un abbonamento o con lo sblocco a vita, al prezzo mostrato dallo store per il tuo Paese.",
      `${founderEligibilityStatement("it")}`,
    ],
    en: [
      "FitMesh has no permanent free plan: if you're searching for 'free forever', you should know that up front.",
      "Try FitMesh Pro for 14 days. After the trial, continuing to use Pro features requires a purchase or subscription.",
      "After 14 days you can continue with a subscription or a lifetime unlock, at the price shown by the store for your country.",
      `${founderEligibilityStatement("en")}`,
    ],
    es: [
      "FitMesh no tiene un plan gratuito permanente: quien busca 'gratis para siempre' debe saberlo desde el principio.",
      `${founderEligibilityStatement("es")}`,
      "Prueba FitMesh Pro durante 14 días. Al terminar, para seguir usando las funciones Pro es necesaria una compra o una suscripción.",
      "Después de los 14 días puedes continuar con una suscripción o con el desbloqueo de por vida, al precio mostrado por la tienda para tu país.",
    ],
    de: [
      "FitMesh hat keinen dauerhaft kostenlosen Plan: Wer nach 'für immer gratis' sucht, sollte das gleich wissen.",
      `${founderEligibilityStatement("de")}`,
      "Teste FitMesh Pro 14 Tage lang. Danach ist für die weitere Nutzung der Pro-Funktionen ein Kauf oder Abonnement erforderlich.",
      "Nach den 14 Tagen kannst du mit einem Abo oder der Freischaltung auf Lebenszeit fortfahren, zum im Store für dein Land angezeigten Preis.",
    ],
    pt: [
      "O FitMesh não tem um plano gratuito permanente: quem procura 'grátis para sempre' precisa saber disso já de cara.",
      `${founderEligibilityStatement("pt")}`,
      "Experimenta o FitMesh Pro durante 14 dias. Depois, para continuar a usar as funções Pro é necessária uma compra ou uma assinatura.",
      "Depois dos 14 dias você pode continuar com uma assinatura ou com o desbloqueio vitalício, pelo preço mostrado pela loja para o seu país.",
    ],
    fr: [
      "FitMesh n'a pas de forfait gratuit permanent : si vous cherchez 'gratuit pour toujours', autant le savoir tout de suite.",
      `${founderEligibilityStatement("fr")}`,
      "Essayez FitMesh Pro pendant 14 jours. Ensuite, pour continuer à utiliser les fonctions Pro, un achat ou un abonnement est nécessaire.",
      "Après les 14 jours, vous pouvez continuer avec un abonnement ou avec le déblocage à vie, au prix affiché par le store pour votre pays.",
    ],
  },
  primaryKeyword: {
    it: "fitmesh è gratis",
    en: "is fitmesh free",
    es: "fitmesh es gratis",
    de: "ist fitmesh kostenlos",
    pt: "fitmesh é grátis",
    fr: "fitmesh est gratuit",
  },
  secondaryKeywords: {
    it: [
      "fitmesh quanto costa",
      "fitmesh prezzo",
      "fitmesh prova gratuita",
      "fitmesh pro",
      "fitmesh lifetime",
      "fitmesh abbonamento",
      "fitmesh programma founder",
    ],
    en: [
      "fitmesh pricing",
      "fitmesh cost",
      "fitmesh free trial",
      "fitmesh pro",
      "fitmesh lifetime",
      "fitmesh subscription",
      "fitmesh founder program",
    ],
    es: [
      "fitmesh precio",
      "fitmesh cuánto cuesta",
      "fitmesh prueba gratis",
      "fitmesh pro de por vida",
      "fitmesh plazas founder",
      "fitmesh suscripción",
      "fitmesh gratis para siempre",
    ],
    de: [
      "fitmesh preis",
      "fitmesh kosten",
      "fitmesh kostenlos testen",
      "fitmesh pro lebenslang",
      "fitmesh founder plätze",
      "fitmesh abo",
      "fitmesh für immer kostenlos",
    ],
    pt: [
      "fitmesh preço",
      "fitmesh quanto custa",
      "fitmesh teste grátis",
      "fitmesh pro vitalício",
      "fitmesh vagas founder",
      "fitmesh assinatura",
      "fitmesh grátis para sempre",
    ],
    fr: [
      "fitmesh prix",
      "fitmesh combien ça coûte",
      "fitmesh essai gratuit",
      "fitmesh pro à vie",
      "fitmesh places founder",
      "fitmesh abonnement",
      "fitmesh gratuit pour toujours",
    ],
  },
  metaDescription: {
    it: "FitMesh è gratis? Niente piano gratuito permanente: prova di 14 giorni, poi abbonamento leggero o sblocco a vita. Founder: primi 1000 account entro il 31/07/2026.",
    en: "Is FitMesh free? No permanent free plan: a full 14-day trial, then a light subscription or a lifetime unlock. Founder program: first 1,000 accounts by July 31, 2026.",
    es: "¿FitMesh es gratis? Sin plan gratuito permanente: prueba de 14 días, luego suscripción ligera o desbloqueo de por vida. Founder: primeras 1000 cuentas hasta el 31/07/2026.",
    de: "Ist FitMesh kostenlos? Kein dauerhaft kostenloser Plan: 14-Tage-Testphase, danach leichtes Abo oder Freischaltung auf Lebenszeit. Founder: erste 1000 Konten bis 31.07.2026.",
    pt: "O FitMesh é grátis? Nenhum plano gratuito permanente: teste de 14 dias, depois assinatura leve ou desbloqueio vitalício. Founder: primeiras 1000 contas até 31/07/2026.",
    fr: "FitMesh est gratuit ? Pas de forfait gratuit permanent : essai de 14 jours, puis abonnement léger ou déblocage à vie. Founder : 1000 premiers comptes jusqu'au 31/07/2026.",
  },
  hero: {
    kicker: {
      it: "Guida prezzi",
      en: "Pricing guide",
      es: "Guía de precios",
      de: "Preisübersicht",
      pt: "Guia de preços",
      fr: "Guide des prix",
    },
    title: {
      it: "FitMesh è gratis? Prezzo e prova di 14 giorni",
      en: "Is FitMesh free? Pricing and the 14-day trial",
      es: "¿FitMesh es gratis? Precio y prueba de 14 días",
      de: "Ist FitMesh kostenlos? Preis und 14-Tage-Testphase",
      pt: "O FitMesh é grátis? Preço e teste de 14 dias",
      fr: "FitMesh est gratuit ? Prix et essai de 14 jours",
    },
    subtitle: {
      it: `La risposta onesta prima di installare: non esiste un piano gratuito per sempre, ma hai 14 giorni di prova completa. Founder: ${founderHistoricalClause("it")}. Ecco esattamente come funziona il prezzo oggi e cosa include il Pro.`,
      en: `The honest answer before you install: there's no free-forever plan, but you get a full 14-day trial. Founder: ${founderHistoricalClause("en")}. Here's exactly how pricing works today and what Pro includes.`,
      es: `La respuesta honesta antes de instalar: no existe un plan gratuito para siempre, pero hay 14 días de prueba completa. Founder: ${founderHistoricalClause("es")}. Aquí tienes exactamente cómo funciona el precio y qué incluye el Pro.`,
      de: `Die ehrliche Antwort vor der Installation: Es gibt keinen für immer kostenlosen Plan, aber du bekommst eine vollständige 14-tägige Testphase. Founder: ${founderHistoricalClause("de")}. Hier erfährst du genau, wie der Preis funktioniert und was Pro umfasst.`,
      pt: `A resposta honesta antes de instalar: não existe um plano gratuito para sempre, mas você tem 14 dias de teste completo. Founder: ${founderHistoricalClause("pt")}. Veja exatamente como funciona o preço e o que o Pro inclui.`,
      fr: `La réponse honnête avant d'installer : il n'existe pas de forfait gratuit à vie, mais vous profitez d'un essai complet de 14 jours. Founder : ${founderHistoricalClause("fr")}. Voici exactement comment fonctionne le prix et ce que le Pro comprend.`,
    },
  },
  body: [
    {
      type: "paragraph",
      text: {
        it: `Se stai cercando "FitMesh è gratis" prima di installare, ecco la risposta diretta e senza giri di parole: non esiste un piano gratuito permanente, ma puoi usare FitMesh Sync gratis oggi con una prova completa di 14 giorni, aperta a tutti, con ogni funzione sbloccata. Alla fine della prova scegli come tenerlo: un acquisto a vita o un abbonamento per continuare a sincronizzare. FitMesh ha anche un programma Founder: ${founderHistoricalClause("it")}; da agosto 2026 non è più possibile registrarsi come nuovo founder. In questa guida spieghiamo esattamente quanto costa oggi (poco), il lavoro che c'è dietro e cosa include il Pro.`,
        en: `If you're searching for "is FitMesh free" before installing, here's the direct answer with no spin: there is no permanent free plan, but you can use FitMesh Sync for free today with a full 14-day trial, open to everyone, with every feature unlocked. At the end of the trial you choose how to keep it: a lifetime purchase or a subscription to continue syncing. FitMesh also has a Founder program: ${founderHistoricalClause("en")}; from August 2026, signing up as a new founder is no longer possible. This guide explains exactly how little it costs today and what Pro includes.`,
        es: `Si estás buscando "FitMesh es gratis" antes de instalar, esta es la respuesta directa y sin rodeos: no existe un plan gratuito permanente, pero hay dos formas concretas de usar FitMesh Sync sin gastar nada hoy. Founder: ${founderHistoricalClause("es")}. Además, tienes la prueba completa de 14 días, abierta a todos, con todas las funciones desbloqueadas. Al terminar la prueba eliges cómo conservarlo: una compra de por vida o una suscripción para seguir sincronizando. En esta guía explicamos exactamente lo poco que cuesta, el trabajo que hay detrás y qué incluye el Pro.`,
        de: `Wenn du vor der Installation nach "FitMesh ist kostenlos" suchst, hier die direkte Antwort ohne Umschweife: Es gibt keinen dauerhaft kostenlosen Plan, aber es gibt zwei konkrete Wege, FitMesh Sync heute ohne Ausgaben zu nutzen. Founder: ${founderHistoricalClause("de")}. Außerdem gibt es die vollständige 14-tägige Testphase, offen für alle, mit sämtlichen freigeschalteten Funktionen. Am Ende der Testphase entscheidest du, wie du es behältst: ein lebenslanger Kauf oder ein Abo, um weiter zu synchronisieren. In diesem Guide erklären wir genau, wie wenig es kostet, welche Arbeit dahintersteckt und was Pro umfasst.`,
        pt: `Se você está procurando "o FitMesh é grátis" antes de instalar, aqui vai a resposta direta e sem rodeios: não existe um plano gratuito permanente, mas há duas formas concretas de usar o FitMesh Sync sem gastar nada hoje. Founder: ${founderHistoricalClause("pt")}. Além disso, há o teste completo de 14 dias, aberto a todos, com cada recurso liberado. Ao final do teste você escolhe como mantê-lo: uma compra vitalícia ou uma assinatura para continuar sincronizando. Neste guia explicamos exatamente quanto custa (pouco), o trabalho que há por trás e o que o Pro inclui.`,
        fr: `Si vous cherchez "FitMesh est gratuit" avant d'installer, voici la réponse directe et sans détour : il n'existe pas de forfait gratuit permanent, mais il y a deux façons concrètes d'utiliser FitMesh Sync sans rien dépenser aujourd'hui. Founder : ${founderHistoricalClause("fr")}. Il y a aussi l'essai complet de 14 jours, ouvert à tous, avec chaque fonction débloquée. À la fin de l'essai, vous choisissez comment le garder : un achat à vie ou un abonnement pour continuer la synchronisation. Dans ce guide, nous expliquons exactement combien ça coûte (peu), le travail qui se cache derrière et ce que le Pro comprend.`,
      },
    },
    {
      type: "callout",
      variant: "info",
      title: {
        it: "Risposta rapida",
        en: "Quick answer",
        es: "Respuesta rápida",
        de: "Schnelle Antwort",
        pt: "Resposta rápida",
        fr: "Réponse rapide",
      },
      body: {
        it: `FitMesh non ha un piano gratuito per sempre. Hai 14 giorni di prova completa, poi tieni FitMesh con un abbonamento o con lo sblocco a vita con il prezzo indicato dallo store. Il prezzo aggiornato per il tuo Paese è mostrato nell'app. Founder: ${founderHistoricalClause("it")}.`,
        en: `FitMesh has no free-forever plan. You get a full 14-day trial, then keep FitMesh with a subscription or a one-time lifetime unlock at the price shown in the store. The current price for your country is shown in the app. Founder: ${founderHistoricalClause("en")}.`,
        es: `FitMesh no tiene un plan gratuito para siempre. Founder: ${founderHistoricalClause("es")}. Todos los demás tienen 14 días de prueba completa y luego conservan FitMesh con una suscripción o con el desbloqueo de por vida al precio mostrado en la tienda. El precio actualizado para tu país se muestra en la app.`,
        de: `FitMesh hat keinen für immer kostenlosen Plan. Founder: ${founderHistoricalClause("de")}. Alle anderen bekommen eine vollständige 14-tägige Testphase und behalten FitMesh dann mit einem Abo oder mit der Freischaltung auf Lebenszeit zum im Store angegebenen Preis. Der aktuelle Preis für dein Land wird in der App angezeigt.`,
        pt: `O FitMesh não tem um plano gratuito para sempre. Founder: ${founderHistoricalClause("pt")}. Todos os outros têm 14 dias de teste completo e depois mantêm o FitMesh com uma assinatura ou com o desbloqueio vitalício pelo preço exibido na loja. O preço atualizado para o seu país aparece no app.`,
        fr: `FitMesh n'a pas de forfait gratuit à vie. Founder : ${founderHistoricalClause("fr")}. Tous les autres profitent d'un essai complet de 14 jours, puis gardent FitMesh avec un abonnement ou avec le déblocage à vie au prix indiqué sur le store. Le prix actualisé pour votre pays s'affiche dans l'app.`,
      },
    },
    {
      type: "heading",
      level: 2,
      text: {
        it: "FitMesh è gratis? La risposta onesta",
        en: "Is FitMesh free? The honest answer",
        es: "¿FitMesh es gratis? La respuesta honesta",
        de: "Ist FitMesh kostenlos? Die ehrliche Antwort",
        pt: "O FitMesh é grátis? A resposta honesta",
        fr: "FitMesh est gratuit ? La réponse honnête",
      },
    },
    {
      type: "paragraph",
      text: {
        it: "Molte app di questo tipo promettono \"gratis per sempre\" e poi si finanziano vendendo i dati o riempiendo lo schermo di pubblicità. FitMesh fa il contrario: i tuoi dati salute restano sul tuo account, non li vendiamo e non mostriamo pubblicità. Leggere i dati dai tuoi wearable, deduplicarli (nella maggior parte dei casi lo stesso passo non viene contato due volte) e visualizzarli nell'app in modo unificato ha un costo reale di gestione. Per questo il modello è semplice e trasparente: chi è arrivato presto è stato premiato con il Pro a vita gratis (i posti founder), tutti gli altri provano l'app completa per 14 giorni e poi decidono se il Pro vale il prezzo di un abbonamento. Nessuna versione dimezzata che ti tiene in ostaggio, nessun costo nascosto.",
        en: "Plenty of apps in this space promise \"free forever\" and then fund themselves by selling your data or filling the screen with ads. FitMesh does the opposite: your health data stays on your account, we don't sell it and we don't show ads. Reading data from your wearables, deduplicating it (in most cases the same step is not counted twice) and showing it unified in the app has a real running cost. That's why the model is simple and transparent: early adopters were rewarded with lifetime Pro for free (the founder spots), everyone else tries the full app for 14 days and then decides whether Pro is worth the price of a subscription. No crippled tier holding you hostage, no hidden fees.",
        es: "Muchas apps de este tipo prometen \"gratis para siempre\" y luego se financian vendiendo tus datos o llenando la pantalla de publicidad. FitMesh hace lo contrario: tus datos de salud se quedan en tu cuenta, no los vendemos y no mostramos publicidad. Leer los datos de tus wearables, quitar los duplicados (en la mayoría de los casos el mismo paso no se cuenta dos veces) y verlos en la app de forma unificada tiene un coste real de gestión. Por eso el modelo es sencillo y transparente: quien llegó pronto recibió como premio el Pro de por vida gratis (las plazas founder), y todos los demás prueban la app completa durante 14 días y luego deciden si el Pro vale el precio de una suscripción. Sin ninguna versión recortada que te tenga como rehén, sin costes ocultos.",
        de: "Viele Apps dieser Art versprechen \"für immer gratis\" und finanzieren sich dann, indem sie deine Daten verkaufen oder den Bildschirm mit Werbung füllen. FitMesh macht das Gegenteil: Deine Gesundheitsdaten bleiben in deinem Konto, wir verkaufen sie nicht und zeigen keine Werbung. Die Daten deiner Wearables zu lesen, Duplikate zu entfernen (in den meisten Fällen wird derselbe Schritt nicht doppelt gezählt) und sie in der App vereint anzuzeigen, verursacht echte laufende Kosten. Deshalb ist das Modell einfach und transparent: Wer früh dabei war, wurde mit Pro auf Lebenszeit gratis belohnt (die founder-Plätze), alle anderen testen die komplette App 14 Tage lang und entscheiden dann, ob Pro den Preis eines Abos wert ist. Keine halbierte Version, die dich als Geisel hält, keine versteckten Kosten.",
        pt: "Muitos apps desse tipo prometem \"grátis para sempre\" e depois se financiam vendendo os dados ou enchendo a tela de publicidade. O FitMesh faz o contrário: os seus dados de saúde ficam na sua conta, não os vendemos e não mostramos publicidade. Ler os dados dos seus wearables, remover as duplicatas (na maioria dos casos o mesmo passo não é contado duas vezes) e visualizá-los no app de forma unificada tem um custo real de operação. Por isso o modelo é simples e transparente: quem chegou cedo foi recompensado com o Pro vitalício grátis (as vagas founder), todos os outros experimentam o app completo por 14 dias e depois decidem se o Pro vale o preço de uma assinatura. Nenhuma versão pela metade que te mantém refém, nenhum custo escondido.",
        fr: "Beaucoup d'applis de ce type promettent \"gratuit pour toujours\", puis se financent en vendant vos données ou en remplissant l'écran de publicité. FitMesh fait l'inverse : vos données de santé restent sur votre compte, nous ne les vendons pas et n'affichons aucune publicité. Lire les données de vos wearables, les dédupliquer (dans la plupart des cas, le même pas n'est pas compté deux fois) et les consulter dans l'application de façon unifiée représente un vrai coût de fonctionnement. C'est pourquoi le modèle est simple et transparent : ceux qui sont arrivés tôt ont été récompensés par le Pro à vie gratuit (les places founder), tous les autres essaient l'appli complète pendant 14 jours puis décident si le Pro vaut le prix d'un abonnement. Aucune version bridée qui vous prend en otage, aucun coût caché.",
      },
    },
    {
      type: "heading",
      level: 2,
      text: {
        it: "Il programma Founder (primi 1000 account entro il 31 luglio 2026)",
        en: "The Founder program (first 1,000 accounts by July 31, 2026)",
        es: "El programa Founder (primeras 1000 cuentas hasta el 31 de julio de 2026)",
        de: "Das Founder-Programm (erste 1000 Konten bis 31. Juli 2026)",
        pt: "O programa Founder (primeiras 1000 contas até 31 de julho de 2026)",
        fr: "Le programme Founder (1 000 premiers comptes jusqu'au 31 juillet 2026)",
      },
    },
    {
      type: "paragraph",
      text: {
        it: `Al lancio, i primi 1000 iscritti sono diventati founder e hanno ricevuto il Pro a vita, gratis: non una prova lunga, non uno sconto, accesso completo senza scadenza. Era il modo con cui ringraziavamo chi credeva nel progetto quando era ancora all'inizio. Il programma è per i primi 1000 account, registrati entro il 31 luglio 2026 con una prima sincronizzazione reale entro 14 giorni dalla registrazione: dagli account creati dal 1° agosto 2026 in poi non è più possibile registrarsi come founder. Se avevi ottenuto il Pro Founder prima di quella data, il beneficio resta tuo per sempre, incluse le funzioni future: non devi fare nulla.`,
        en: `At launch, the first 1,000 sign-ups became founders and got Pro for life, free: not a long trial, not a discount, full access with no expiry. It was how we thanked the people who backed the project while it was still early. The program is for the first 1,000 accounts, registered by July 31, 2026 with a first verified sync within 14 days of registration: accounts created from August 1, 2026 onward can no longer sign up as founders. If you got Founder Pro before that date, the benefit stays yours forever, including future features: there's nothing you need to do.`,
        es: `En el lanzamiento, las primeras 1000 cuentas se convirtieron en founder y recibieron el Pro de por vida, gratis. La regla era sencilla: ${founderHistoricalClause("es")}. No una prueba larga, no un descuento: acceso completo sin caducidad. Fue la forma en que dimos las gracias a quien creyó en el proyecto cuando aún estaba empezando. Las cuentas creadas a partir del 1 de agosto de 2026 ya no son elegibles para el programa Founder: reciben la prueba Pro de 14 días descrita más abajo. Quien consiguió una plaza founder no paga nunca la suscripción, con las funciones futuras incluidas.`,
        de: `Zum Start wurden die ersten 1000 Konten zu founder und erhielten Pro auf Lebenszeit, gratis. Die Regel war einfach: ${founderHistoricalClause("de")}. Keine lange Testphase, kein Rabatt: voller Zugang ohne Ablaufdatum. So haben wir uns bei denen bedankt, die früh an das Projekt geglaubt haben. Konten, die ab dem 1. August 2026 erstellt werden, sind nicht mehr für das Founder-Programm berechtigt: sie erhalten die unten beschriebene 14-tägige Pro-Testphase. Wer einen founder-Platz bekommen hat, zahlt das Abo nie, inklusive der Funktionen, die noch kommen.`,
        pt: `No lançamento, as primeiras 1000 contas tornaram-se founder e receberam o Pro vitalício, grátis. A regra era simples: ${founderHistoricalClause("pt")}. Não era um teste longo, não era um desconto: acesso completo sem prazo de validade. Foi a nossa forma de agradecer a quem acreditou no projeto desde o início. Contas criadas a partir de 1 de agosto de 2026 não são mais elegíveis para o programa Founder: recebem o teste Pro de 14 dias descrito abaixo. Quem conseguiu uma vaga founder nunca paga a assinatura, incluindo os recursos futuros.`,
        fr: `Au lancement, les 1 000 premiers comptes sont devenus founder et ont reçu le Pro à vie, gratuitement. La règle était simple : ${founderHistoricalClause("fr")}. Pas un long essai, pas une remise : un accès complet sans date d'expiration. C'était notre façon de remercier ceux qui ont cru au projet dès ses débuts. Les comptes créés à partir du 1er août 2026 ne sont plus éligibles au programme Founder : ils reçoivent l'essai Pro de 14 jours décrit plus bas. Ceux qui ont obtenu une place founder ne paient jamais l'abonnement, fonctions à venir comprises.`,
      },
    },
    {
      type: "list",
      items: {
        it: [
          "Pro a vita, senza scadenza e senza rinnovi da pagare.",
          "Tutte le funzioni Pro attuali e future incluse.",
          "Le nuove integrazioni man mano che escono, come l'anello Colmi e l'app iOS.",
          "Un beneficio legato al tuo account, valido per sempre (nessuna azione richiesta).",
        ],
        en: [
          "Pro for life, with no expiry and no renewals to pay.",
          "Every current and future Pro feature included.",
          "New integrations as they ship, like the Colmi ring and the iOS app.",
          "A benefit tied to your account, valid forever (no action needed).",
        ],
        es: [
          "Pro de por vida, sin caducidad y sin renovaciones que pagar.",
          "Todas las funciones Pro actuales y futuras incluidas.",
          "Las nuevas integraciones a medida que salen, como el anillo Colmi y la app iOS.",
          "Una plaza asegurada, ligada a tu cuenta, para quien se registró a tiempo.",
        ],
        de: [
          "Pro auf Lebenszeit, ohne Ablaufdatum und ohne zu zahlende Verlängerungen.",
          "Alle aktuellen und künftigen Pro-Funktionen inklusive.",
          "Neue Integrationen, sobald sie erscheinen, wie der Colmi-Ring und die iOS-App.",
          "Ein gesicherter Platz, an dein Konto gebunden, für alle, die sich rechtzeitig angemeldet haben.",
        ],
        pt: [
          "Pro vitalício, sem prazo de validade e sem renovações a pagar.",
          "Todos os recursos Pro atuais e futuros incluídos.",
          "As novas integrações à medida que chegam, como o anel Colmi e o app iOS.",
          "Uma vaga garantida, ligada à sua conta, para quem se cadastrou a tempo.",
        ],
        fr: [
          "Pro à vie, sans expiration et sans renouvellements à payer.",
          "Toutes les fonctions Pro actuelles et futures comprises.",
          "Les nouvelles intégrations au fur et à mesure de leur sortie, comme la bague Colmi et l'appli iOS.",
          "Une place assurée, liée à votre compte, pour ceux qui se sont inscrits à temps.",
        ],
      },
    },
    {
      type: "callout",
      variant: "tip",
      title: {
        it: "Eri già founder? Il beneficio resta valido",
        en: "Were you already a founder? The benefit is still valid",
        es: "¿Ya eras founder? El beneficio sigue siendo válido",
        de: "Warst du bereits founder? Der Vorteil bleibt gültig",
        pt: "Você já era founder? O benefício continua válido",
        fr: "Étiez-vous déjà founder ? L'avantage reste valable",
      },
      body: {
        it: "Se hai creato l'account ed effettuato la prima sincronizzazione prima del 31 luglio 2026, il tuo Pro a vita founder è già attivo: lo vedi nella schermata Pro dell'app, con l'indicazione \"Founder · Pro · Lifetime\". Non serve rifare nulla, nemmeno reinstallare l'app. Per i nuovi account, oggi l'unico percorso è la prova di 14 giorni descritta sotto.",
        en: "If you created your account and completed your first sync before July 31, 2026, your lifetime founder Pro is already active: you'll see it on the app's Pro screen, marked \"Founder · Pro · Lifetime\". There's nothing to redo, not even reinstalling the app. For new accounts, the only path today is the 14-day trial described below.",
        es: "Si creaste tu cuenta e hiciste tu primera sincronización antes del 31 de julio de 2026, tu Pro de por vida founder ya está activo: lo verás en la pantalla Pro de la app, con la indicación \"Founder · Pro · Lifetime\". No hace falta hacer nada más, ni siquiera reinstalar la app. Para las cuentas nuevas, hoy el único camino es la prueba de 14 días descrita más abajo.",
        de: "Wenn du dein Konto erstellt und deine erste Synchronisierung vor dem 31. Juli 2026 abgeschlossen hast, ist dein lebenslanges founder-Pro bereits aktiv: Du siehst es im Pro-Bildschirm der App, mit der Angabe \"Founder · Pro · Lifetime\". Du musst nichts erneut tun, nicht einmal die App neu installieren. Für neue Konten ist heute die unten beschriebene 14-tägige Testphase der einzige Weg.",
        pt: "Se você criou a sua conta e concluiu a primeira sincronização antes de 31 de julho de 2026, o seu Pro vitalício founder já está ativo: você vê isso na tela Pro do app, com a indicação \"Founder · Pro · Lifetime\". Não é preciso fazer mais nada, nem reinstalar o app. Para contas novas, hoje o único caminho é o teste de 14 dias descrito abaixo.",
        fr: "Si vous avez créé votre compte et effectué votre première synchronisation avant le 31 juillet 2026, votre Pro à vie founder est déjà actif : vous le verrez sur l'écran Pro de l'appli, avec la mention \"Founder · Pro · Lifetime\". Il n'y a rien à refaire, pas même réinstaller l'appli. Pour les nouveaux comptes, le seul chemin aujourd'hui est l'essai de 14 jours décrit plus bas.",
      },
    },
    {
      type: "heading",
      level: 2,
      text: {
        it: "La prova completa di 14 giorni",
        en: "The full 14-day trial",
        es: "La prueba completa de 14 días",
        de: "Die vollständige 14-Tage-Testphase",
        pt: "O teste completo de 14 dias",
        fr: "L'essai complet de 14 jours",
      },
    },
    {
      type: "paragraph",
      text: {
        it: "Prova FitMesh Pro per 14 giorni. Al termine, per continuare a usare le funzioni Pro serve un acquisto o un abbonamento. I 14 giorni servono a farti valutare l'app sui tuoi dati veri, non su una demo preconfezionata. È il modo più giusto per capire se FitMesh fa quello che ti serve prima di decidere.",
        en: "Try FitMesh Pro for 14 days. After the trial, continuing to use Pro features requires a purchase or subscription. The 14 days let you evaluate the app on your real data, not on a canned demo. It's the fairest way to see whether FitMesh does what you need before you decide.",
        es: "Prueba FitMesh Pro durante 14 días. Al terminar, para seguir usando las funciones Pro es necesaria una compra o una suscripción. Los 14 días sirven para que valores la app con tus datos reales, no con una demo prefabricada. Es la forma más justa de saber si FitMesh hace lo que necesitas antes de decidir.",
        de: "Teste FitMesh Pro 14 Tage lang. Danach ist für die weitere Nutzung der Pro-Funktionen ein Kauf oder Abonnement erforderlich. Die 14 Tage sind dazu da, die App mit deinen echten Daten zu bewerten, nicht mit einer vorgefertigten Demo. So findest du am fairsten heraus, ob FitMesh das tut, was du brauchst, bevor du dich entscheidest.",
        pt: "Experimenta o FitMesh Pro durante 14 dias. Depois, para continuar a usar as funções Pro é necessária uma compra ou uma assinatura. Os 14 dias servem para você avaliar o app com os seus dados reais, não com uma demonstração pronta. É a forma mais justa de entender se o FitMesh faz o que você precisa antes de decidir.",
        fr: "Essayez FitMesh Pro pendant 14 jours. Ensuite, pour continuer à utiliser les fonctions Pro, un achat ou un abonnement est nécessaire. Les 14 jours servent à évaluer l'appli sur vos vraies données, pas sur une démo préformatée. C'est la façon la plus juste de voir si FitMesh fait ce dont vous avez besoin avant de décider.",
      },
    },
    {
      type: "heading",
      level: 2,
      text: {
        it: "Cosa succede dopo i 14 giorni",
        en: "What happens after the 14 days",
        es: "Qué pasa después de los 14 días",
        de: "Was nach den 14 Tagen passiert",
        pt: "O que acontece depois dos 14 dias",
        fr: "Ce qui se passe après les 14 jours",
      },
    },
    {
      type: "paragraph",
      text: {
        it: "Alla fine dei 14 giorni scegli come continuare, senza trappole: tieni FitMesh con un piccolo abbonamento o con lo sblocco a vita, oppure, se decidi che non fa per te, chiudi l'account. Non c'è una versione gratuita dimezzata che resta lì a metà: o FitMesh ti è utile e lo tieni a un prezzo piccolo, o lo lasci e i tuoi dati vengono rimossi. (Chi aveva ottenuto il Pro Founder prima del 31 luglio 2026 non ha mai bisogno di pagare: il suo Pro resta a vita.) È una scelta onesta, ed è proprio il motivo per cui la prova è completa: vogliamo che tu decida con l'app vera davanti, dopo aver visto [i tuoi smartwatch uniti senza dati doppi](/it/blog/piu-smartwatch-insieme-dati-doppi) nella dashboard, non su promesse.",
        en: "At the end of the 14 days you choose how to carry on, with no traps: keep FitMesh with a small subscription or a one-time lifetime unlock, or, if you decide it's not for you, close the account. There's no reduced free version sitting there half-working: either FitMesh is useful to you and you keep it for a small price, or you let it go and your data is removed. (Anyone who got Founder Pro before July 31, 2026 never needs to pay: their Pro stays lifetime.) It's an honest choice, and it's exactly why the trial is full: we want you to decide with the real app in front of you, after seeing [your smartwatches merged with no double data](/en/blog/piu-smartwatch-insieme-dati-doppi) in the dashboard, not on promises.",
        es: "Al terminar los 14 días eliges cómo continuar, sin trampas: conservas FitMesh con una pequeña suscripción o con el desbloqueo de por vida (los founder no pagan nada), o bien, si decides que no es para ti, cierras la cuenta. No hay una versión gratuita recortada que se queda ahí a medias: o FitMesh te resulta útil y lo conservas por un precio pequeño, o lo dejas y tus datos se eliminan. Es una elección honesta, y es justo el motivo por el que la prueba es completa: queremos que decidas con la app de verdad delante, después de ver [tus smartwatches unidos sin datos duplicados](/es/blog/piu-smartwatch-insieme-dati-doppi) en el dashboard, no con promesas.",
        de: "Am Ende der 14 Tage entscheidest du, wie es weitergeht, ohne Fallen: Du behältst FitMesh mit einem kleinen Abo oder mit der Freischaltung auf Lebenszeit (founder zahlen nichts), oder, falls du entscheidest, dass es nichts für dich ist, schließt du das Konto. Es gibt keine halbierte Gratisversion, die halb funktionierend herumsteht: Entweder ist FitMesh für dich nützlich und du behältst es zu einem kleinen Preis, oder du lässt es los und deine Daten werden entfernt. Das ist eine ehrliche Entscheidung, und genau darum ist die Testphase vollständig: Wir möchten, dass du mit der echten App vor dir entscheidest, nachdem du [deine Smartwatches ohne doppelte Daten zusammengeführt](/de/blog/piu-smartwatch-insieme-dati-doppi) im Dashboard gesehen hast, nicht aufgrund von Versprechen.",
        pt: "Ao final dos 14 dias você escolhe como continuar, sem pegadinhas: mantém o FitMesh com uma pequena assinatura ou com o desbloqueio vitalício (os founder não pagam nada), ou então, se decidir que não é para você, encerra a conta. Não existe uma versão gratuita pela metade que fica ali funcionando só um pouco: ou o FitMesh é útil para você e você o mantém por um preço pequeno, ou você o abandona e os seus dados são removidos. É uma escolha honesta, e é justamente por isso que o teste é completo: queremos que você decida com o app de verdade na sua frente, depois de ver [os seus smartwatches unidos sem dados duplicados](/pt/blog/piu-smartwatch-insieme-dati-doppi) no painel, não com base em promessas.",
        fr: "À la fin des 14 jours, vous choisissez comment continuer, sans pièges : vous gardez FitMesh avec un petit abonnement ou avec le déblocage à vie (les founder ne paient rien), ou bien, si vous décidez que ce n'est pas pour vous, vous fermez le compte. Il n'y a pas de version gratuite bridée qui reste là à moitié fonctionnelle : soit FitMesh vous est utile et vous le gardez pour un petit prix, soit vous le laissez et vos données sont supprimées. C'est un choix honnête, et c'est précisément pour cela que l'essai est complet : nous voulons que vous décidiez avec la vraie appli sous les yeux, après avoir vu [vos smartwatches réunis sans données en double](/fr/blog/piu-smartwatch-insieme-dati-doppi) dans le tableau de bord, pas sur des promesses.",
      },
    },
    {
      type: "heading",
      level: 2,
      text: {
        it: "Cosa include il Pro",
        en: "What Pro includes",
        es: "Qué incluye el Pro",
        de: "Was Pro umfasst",
        pt: "O que o Pro inclui",
        fr: "Ce que comprend le Pro",
      },
    },
    {
      type: "paragraph",
      text: {
        it: "Il Pro è tutto FitMesh, senza livelli confusi. Su Android l'app legge i dati tramite Health Connect e in più legge l'anello Colmi via Bluetooth; su iPhone (già live sull'App Store) legge Apple Salute nativamente e si collega allo stesso modo via Bluetooth al Colmi Ring. Se vuoi il quadro completo sull'anello, c'è la [guida completa all'anello Colmi](/it/blog/colmi-ring-fitmesh), e per capire come funziona il pannello dal computer trovi la guida a [vedere i dati dei wearable nel browser](/it/blog/vedere-dati-wearable-browser-pc).",
        en: "Pro is all of FitMesh, with no confusing tiers. On Android the app reads data through Health Connect and also reads the Colmi ring over Bluetooth; on iPhone (already live on the App Store) it reads Apple Health natively and connects the same way over Bluetooth to the Colmi Ring. If you want the full picture on the ring, there's the [complete Colmi ring guide](/en/blog/colmi-ring-fitmesh), and to see how the panel works from a computer there's the guide to [viewing your wearable data in the browser](/en/blog/vedere-dati-wearable-browser-pc).",
        es: "El Pro es todo FitMesh, sin niveles confusos. En Android la app lee los datos a través de Health Connect y además lee el anillo Colmi por Bluetooth; en iPhone (ya activa en la App Store) lee Apple Salud de forma nativa y se conecta del mismo modo por Bluetooth al anillo Colmi. Si quieres el panorama completo sobre el anillo, tienes la [guía completa del anillo Colmi](/es/blog/colmi-ring-fitmesh), y para entender cómo funciona el panel desde el ordenador encontrarás la guía para [ver los datos de los wearables en el navegador](/es/blog/vedere-dati-wearable-browser-pc).",
        de: "Pro ist ganz FitMesh, ohne verwirrende Stufen. Unter Android liest die App die Daten über Health Connect und liest zusätzlich den Colmi-Ring über Bluetooth; auf dem iPhone (bereits live im App Store) liest sie Apple Health nativ aus und verbindet sich auf dieselbe Weise per Bluetooth mit dem Colmi-Ring. Wenn du den kompletten Überblick über den Ring willst, gibt es den [vollständigen Guide zum Colmi-Ring](/de/blog/colmi-ring-fitmesh), und um zu verstehen, wie das Panel vom Computer aus funktioniert, findest du den Guide zum [Anzeigen der Wearable-Daten im Browser](/de/blog/vedere-dati-wearable-browser-pc).",
        pt: "O Pro é o FitMesh inteiro, sem níveis confusos. No Android o app lê os dados através do Health Connect e ainda lê o anel Colmi via Bluetooth; no iPhone (já ativo na App Store) lê o Apple Saúde nativamente e se conecta da mesma forma por Bluetooth ao anel Colmi. Se você quer o panorama completo sobre o anel, há o [guia completo do anel Colmi](/pt/blog/colmi-ring-fitmesh), e para entender como o painel funciona no computador você encontra o guia para [ver os dados dos wearables no navegador](/pt/blog/vedere-dati-wearable-browser-pc).",
        fr: "Le Pro, c'est tout FitMesh, sans niveaux compliqués. Sous Android, l'appli lit les données via Health Connect et lit en plus la bague Colmi via Bluetooth ; sur iPhone (déjà active sur l'App Store), elle lit Apple Santé nativement et se connecte de la même façon en Bluetooth à la bague Colmi. Si vous voulez le tableau complet sur la bague, il y a le [guide complet de la bague Colmi](/fr/blog/colmi-ring-fitmesh), et pour comprendre comment fonctionne le panneau depuis l'ordinateur, vous trouverez le guide pour [voir les données des wearables dans le navigateur](/fr/blog/vedere-dati-wearable-browser-pc).",
      },
    },
    {
      type: "table",
      caption: {
        it: "Cosa sblocca il Pro (e il posto founder) in FitMesh Sync",
        en: "What Pro (and the founder spot) unlocks in FitMesh Sync",
        es: "Qué desbloquea el Pro (y la plaza founder) en FitMesh Sync",
        de: "Was Pro (und der founder-Platz) in FitMesh Sync freischaltet",
        pt: "O que o Pro (e a vaga founder) libera no FitMesh Sync",
        fr: "Ce que le Pro (et la place founder) débloque dans FitMesh Sync",
      },
      headers: {
        it: ["Funzione", "Cosa fa"],
        en: ["Feature", "What it does"],
        es: ["Función", "Qué hace"],
        de: ["Funktion", "Was sie macht"],
        pt: ["Recurso", "O que faz"],
        fr: ["Fonction", "Ce qu'elle fait"],
      },
      rows: [
        {
          it: ["Tutti i wearable uniti", "Health Connect e anello Colmi in un unico pannello, deduplicati"],
          en: ["All wearables merged", "Health Connect and the Colmi ring in one panel, deduplicated"],
          es: ["Todos los wearables unidos", "Health Connect y el anillo Colmi en un único panel, sin duplicados"],
          de: ["Alle Wearables zusammengeführt", "Health Connect und Colmi-Ring in einem einzigen Panel, ohne Duplikate"],
          pt: ["Todos os wearables unidos", "Health Connect e anel Colmi em um único painel, sem duplicatas"],
          fr: ["Tous les wearables réunis", "Health Connect et bague Colmi dans un seul panneau, dédupliqués"],
        },
        {
          it: ["Storico completo", "La cronologia dei tuoi dati resta salvata sul tuo account"],
          en: ["Full history", "Your data history stays saved on your account"],
          es: ["Historial completo", "El historial de tus datos permanece guardado en tu cuenta"],
          de: ["Vollständiger Verlauf", "Der Verlauf deiner Daten bleibt in deinem Konto gespeichert"],
          pt: ["Histórico completo", "O histórico dos seus dados fica salvo na sua conta"],
          fr: ["Historique complet", "L'historique de vos données reste enregistré sur votre compte"],
        },
        {
          it: ["Anello Colmi via Bluetooth", "Passi, battito, SpO2, sonno con fasi, stress, batteria"],
          en: ["Colmi ring over Bluetooth", "Steps, heart rate, SpO2, sleep with stages, stress, battery"],
          es: ["Anillo Colmi por Bluetooth", "Pasos, ritmo cardíaco, SpO2, sueño con fases, estrés, batería"],
          de: ["Colmi-Ring über Bluetooth", "Schritte, Herzfrequenz, SpO2, Schlaf mit Phasen, Stress, Akku"],
          pt: ["Anel Colmi via Bluetooth", "Passos, batimentos, SpO2, sono com fases, estresse, bateria"],
          fr: ["Bague Colmi via Bluetooth", "Pas, fréquence cardiaque, SpO2, sommeil avec phases, stress, batterie"],
        },
        {
          it: ["Dati nel cloud", "Sul tuo account, non sui server del produttore del dispositivo"],
          en: ["Data in the cloud", "On your account, not on the device maker's servers"],
          es: ["Datos en la nube", "En tu cuenta, no en los servidores del fabricante del dispositivo"],
          de: ["Daten in der Cloud", "In deinem Konto, nicht auf den Servern des Geräteherstellers"],
          pt: ["Dados na nuvem", "Na sua conta, não nos servidores do fabricante do dispositivo"],
          fr: ["Données dans le cloud", "Sur votre compte, pas sur les serveurs du fabricant de l'appareil"],
        },
      ],
    },
    {
      type: "heading",
      level: 2,
      text: {
        it: "Founder (storico) vs prova: le differenze",
        en: "Founder (historical) vs trial: the differences",
        es: "Founder (histórico) o prueba: las diferencias",
        de: "Founder (historisch) oder Testphase: die Unterschiede",
        pt: "Founder (histórico) ou teste: as diferenças",
        fr: "Founder (historique) ou essai : les différences",
      },
    },
    {
      type: "comparison",
      aTitle: {
        it: "Posto founder (primi 1000, entro il 31/07/2026)",
        en: "Founder spot (by July 31, 2026)",
        es: "Plaza founder (primeras 1000, hasta el 31/07/2026)",
        de: "Founder-Platz (erste 1000, bis 31.07.2026)",
        pt: "Vaga founder (primeiras 1000, até 31/07/2026)",
        fr: "Place founder (1 000 premiers, jusqu'au 31/07/2026)",
      },
      aItems: {
        it: [
          "Pro a vita, gratis, senza scadenza.",
          "Tutte le funzioni attuali e future incluse.",
          "Nessun abbonamento da pagare, mai.",
          "Le nuove adesioni tramite il sito sono chiuse: il beneficio già assegnato resta.",
        ],
        en: [
          "Pro for life, free, with no expiry.",
          "Every current and future feature included.",
          "No subscription to pay, ever.",
          "New sign-ups through the site are closed: the benefit already granted stays.",
        ],
        es: [
          "Pro de por vida, gratis, sin caducidad.",
          "Todas las funciones actuales y futuras incluidas.",
          "Ninguna suscripción que pagar, nunca.",
          "Las nuevas adhesiones a través del sitio están cerradas: el beneficio ya concedido se mantiene.",
        ],
        de: [
          "Pro auf Lebenszeit, gratis, ohne Ablaufdatum.",
          "Alle aktuellen und künftigen Funktionen inklusive.",
          "Kein Abo zu bezahlen, niemals.",
          "Neue Anmeldungen über die Website sind geschlossen: der bereits gewährte Vorteil bleibt.",
        ],
        pt: [
          "Pro vitalício, grátis, sem prazo de validade.",
          "Todas as funções atuais e futuras incluídas.",
          "Nenhuma assinatura a pagar, nunca.",
          "As novas adesões através do site estão encerradas: o benefício já concedido mantém-se.",
        ],
        fr: [
          "Pro à vie, gratuit, sans expiration.",
          "Toutes les fonctions actuelles et futures comprises.",
          "Aucun abonnement à payer, jamais.",
          "Les nouvelles inscriptions via le site sont closes : l'avantage déjà accordé reste acquis.",
        ],
      },
      bTitle: {
        it: "Prova di 14 giorni (tutti gli altri)",
        en: "14-day trial (everyone else)",
        es: "Prueba de 14 días (todos los demás)",
        de: "14-Tage-Testphase (alle anderen)",
        pt: "Teste de 14 dias (todos os outros)",
        fr: "Essai de 14 jours (tous les autres)",
      },
      bItems: {
        it: [
          "Dopo: un acquisto a vita o un abbonamento per continuare a sincronizzare.",
          "Sempre disponibile, per ogni nuovo account.",
        ],
        en: [
          "After: a lifetime purchase or subscription to continue syncing.",
          "Always available, for every new account.",
        ],
        es: [
          "Después: una compra de por vida o suscripción para seguir sincronizando.",
          "Siempre disponible, para cada cuenta nueva.",
        ],
        de: [
          "Danach: ein lebenslanger Kauf oder ein Abo, um weiter zu synchronisieren.",
          "Immer verfügbar, für jedes neue Konto.",
        ],
        pt: [
          "Depois: uma compra vitalícia ou assinatura para continuar sincronizando.",
          "Sempre disponível, para cada nova conta.",
        ],
        fr: [
          "Ensuite : un achat à vie ou un abonnement pour continuer la synchronisation.",
          "Toujours disponible, pour chaque nouveau compte.",
        ],
      },
    },
    {
      type: "heading",
      level: 2,
      text: {
        it: "Il lavoro dietro un prezzo così piccolo",
        en: "The work behind such a small price",
        es: "El trabajo detrás de un precio tan pequeño",
        de: "Die Arbeit hinter einem so kleinen Preis",
        pt: "O trabalho por trás de um preço tão pequeno",
        fr: "Le travail derrière un prix aussi petit",
      },
    },
    {
      type: "paragraph",
      text: {
        it: "Dietro al prezzo di FitMesh c'è parecchio lavoro. FitMesh nasce da un lavoro artigianale di ricerca e integrazione: leggere decine di wearable diversi e l'anello Colmi via Bluetooth, capire i formati di ogni produttore, e far combaciare i dati con un sistema di deduplica che nella maggior parte dei casi evita di contare due volte lo stesso passo. A questo si aggiungono i server (che hanno un costo), lo sviluppo continuo di nuove integrazioni e dell'app iOS, e la scelta di non mostrare pubblicità e di non vendere i tuoi dati: puoi leggere come li trattiamo nella guida su [GDPR e dati fitness](/it/blog/gdpr-dati-fitness-smartwatch). Ecco perché non esiste un \"gratis per sempre\": quel gratis, nelle app che lo offrono, quasi sempre lo paghi altrove, con la pubblicità o con i tuoi dati. Un prezzo chiaro e trasparente è ciò che tiene il progetto vivo e indipendente, con l'importo mostrato direttamente dallo store per il tuo Paese.",
        en: "Behind FitMesh's pricing there's a lot of work. FitMesh is the result of hands-on research and integration: reading dozens of different wearables and the Colmi ring over Bluetooth, making sense of each maker's data formats, and lining the data up with a deduplication system that in most cases keeps the same step from being counted twice. On top of that come the servers (which cost money), the ongoing development of new integrations and the iOS app, and the choice to show no ads and never sell your data: you can read how we handle it in the guide on [GDPR and fitness data](/en/blog/gdpr-dati-fitness-smartwatch). That's why there's no \"free forever\": in the apps that offer it, that free is almost always paid for elsewhere, with ads or with your data. A clear and transparent price is what keeps the project alive and independent, with the exact amount shown directly by the store in your country.",
        es: "Detrás del precio de FitMesh hay bastante trabajo. FitMesh nace de una labor artesanal de investigación e integración: leer decenas de wearables distintos y el anillo Colmi por Bluetooth, entender los formatos de cada fabricante y hacer que los datos encajen con un sistema de eliminación de duplicados que en la mayoría de los casos evita contar dos veces el mismo paso. A esto se suman los servidores (que tienen un coste), el desarrollo continuo de nuevas integraciones y de la app iOS, y la decisión de no mostrar publicidad ni vender tus datos: puedes leer cómo los tratamos en la guía sobre [GDPR y datos fitness](/es/blog/gdpr-dati-fitness-smartwatch). Por eso no existe un \"gratis para siempre\": ese gratis, en las apps que lo ofrecen, casi siempre lo pagas en otro sitio, con la publicidad o con tus datos. Un precio claro y transparente es lo que mantiene el proyecto vivo e independiente, con el importe mostrado directamente por la tienda para tu país.",
        de: "Hinter dem Preis von FitMesh steckt eine Menge Arbeit. FitMesh entsteht aus sorgfältiger Recherche- und Integrationsarbeit: Dutzende verschiedener Wearables und den Colmi-Ring über Bluetooth auslesen, die Datenformate jedes Herstellers verstehen und die Daten mit einem System zur Duplikatentfernung in Einklang bringen, das in den meisten Fällen verhindert, dass derselbe Schritt zweimal gezählt wird. Dazu kommen die Server (die Geld kosten), die laufende Entwicklung neuer Integrationen und der iOS-App sowie die Entscheidung, keine Werbung zu zeigen und deine Daten nicht zu verkaufen: Wie wir damit umgehen, kannst du im Guide zu [DSGVO und Fitnessdaten](/de/blog/gdpr-dati-fitness-smartwatch) nachlesen. Deshalb gibt es kein \"für immer gratis\": Dieses Gratis bezahlst du bei den Apps, die es anbieten, fast immer woanders, mit Werbung oder mit deinen Daten. Ein klarer und transparenter Preis hält das Projekt lebendig und unabhängig, wobei der genaue Betrag direkt im Store für dein Land angezeigt wird.",
        pt: "Por trás do preço do FitMesh há bastante trabalho. O FitMesh nasce de um trabalho artesanal de pesquisa e integração: ler dezenas de wearables diferentes e o anel Colmi via Bluetooth, entender os formatos de cada fabricante e fazer os dados baterem com um sistema de remoção de duplicatas que, na maioria dos casos, evita que o mesmo passo seja contado duas vezes. A isso se somam os servidores (que têm um custo), o desenvolvimento contínuo de novas integrações e do app iOS, e a escolha de não mostrar publicidade e não vender os seus dados: você pode ler como os tratamos no guia sobre [GDPR e dados de fitness](/pt/blog/gdpr-dati-fitness-smartwatch). É por isso que não existe um \"grátis para sempre\": esse grátis, nos apps que o oferecem, quase sempre você paga em outro lugar, com publicidade ou com os seus dados. Um preço claro e transparente é o que mantém o projeto vivo e independente, com o valor exibido diretamente pela loja para o seu país.",
        fr: "Derrière le prix de FitMesh se cache pas mal de travail. FitMesh est né d'un travail artisanal de recherche et d'intégration : lire des dizaines de wearables différents et la bague Colmi via Bluetooth, comprendre les formats de chaque fabricant et faire correspondre les données grâce à un système de déduplication qui, dans la plupart des cas, évite de compter deux fois le même pas. À cela s'ajoutent les serveurs (qui ont un coût), le développement continu de nouvelles intégrations et de l'appli iOS, et le choix de ne pas afficher de publicité et de ne jamais vendre vos données : vous pouvez lire comment nous les traitons dans le guide sur [le RGPD et les données de fitness](/fr/blog/gdpr-dati-fitness-smartwatch). Voilà pourquoi il n'existe pas de \"gratuit pour toujours\" : dans les applis qui le proposent, ce gratuit, vous le payez presque toujours ailleurs, avec la publicité ou avec vos données. Un prix clair et transparent est ce qui garde le projet vivant et indépendant, avec le tarif affiché directement par le store pour votre pays.",
      },
    },
    {
      type: "heading",
      level: 2,
      text: {
        it: "Quanto costa il Pro? Meno di quanto pensi",
        en: "How much is Pro? Less than you'd think",
        es: "¿Cuánto cuesta el Pro? Menos de lo que crees",
        de: "Was kostet Pro? Weniger, als du denkst",
        pt: "Quanto custa o Pro? Menos do que você imagina",
        fr: "Combien coûte le Pro ? Moins que vous ne le pensez",
      },
    },
    {
      type: "paragraph",
      text: {
        it: "Prova FitMesh Pro per 14 giorni. Al termine, per continuare a usare le funzioni Pro serve un acquisto o un abbonamento. Il prezzo aggiornato per il tuo Paese è sempre mostrato nell'app al momento dell'iscrizione.",
        en: "Try FitMesh Pro for 14 days. After the trial, continuing to use Pro features requires a purchase or subscription. The current price for your country is always shown in the app when you sign up.",
        es: "Prueba FitMesh Pro durante 14 días. Al terminar, para seguir usando las funciones Pro es necesaria una compra o una suscripción. El precio actualizado para tu país siempre se muestra en la app en el momento de registrarte. Y quien había obtenido el Pro Founder antes del 31 de julio de 2026 no paga nada, para siempre.",
        de: "Teste FitMesh Pro 14 Tage lang. Danach ist für die weitere Nutzung der Pro-Funktionen ein Kauf oder Abonnement erforderlich. Der aktuelle Preis für dein Land wird in der App immer bei der Anmeldung angezeigt. Und wer das Founder-Pro vor dem 31. Juli 2026 erhalten hatte, zahlt nichts, für immer.",
        pt: "Experimenta o FitMesh Pro durante 14 dias. Depois, para continuar a usar as funções Pro é necessária uma compra ou uma assinatura. O preço atualizado para o seu país aparece sempre no app no momento da inscrição. E quem já tinha o Pro Founder antes de 31 de julho de 2026 não paga nada, para sempre.",
        fr: "Essayez FitMesh Pro pendant 14 jours. Ensuite, pour continuer à utiliser les fonctions Pro, un achat ou un abonnement est nécessaire. Le prix actualisé pour votre pays s'affiche toujours dans l'appli au moment de l'inscription. Et ceux qui avaient obtenu le Pro Founder avant le 31 juillet 2026 ne paient rien, pour toujours.",
      },
    },
    {
      type: "cta",
      title: {
        it: "Inizia la prova gratuita di 14 giorni",
        en: "Start the free 14-day trial",
        es: "Prueba FitMesh Sync gratis 14 días",
        de: "Teste FitMesh Sync 14 Tage kostenlos",
        pt: "Experimente o FitMesh Sync grátis por 14 dias",
        fr: "Essayez FitMesh Sync gratuitement pendant 14 jours",
      },
      body: {
        it: "Prova FitMesh Pro per 14 giorni. Al termine, per continuare a usare le funzioni Pro serve un acquisto o un abbonamento. L'app è disponibile su Play Store e App Store.",
        en: "Try FitMesh Pro for 14 days. After the trial, continuing to use Pro features requires a purchase or subscription. The app is available on the Play Store and the App Store.",
        es: "Prueba FitMesh Pro durante 14 días. Al terminar, para seguir usando las funciones Pro es necesaria una compra o una suscripción. La app ya está disponible en Play Store y en App Store.",
        de: "Teste FitMesh Pro 14 Tage lang. Danach ist für die weitere Nutzung der Pro-Funktionen ein Kauf oder Abonnement erforderlich. Die App ist bereits im Play Store und im App Store verfügbar.",
        pt: "Experimenta o FitMesh Pro durante 14 dias. Depois, para continuar a usar as funções Pro é necessária uma compra ou uma assinatura. O app já está disponível na Play Store e na App Store.",
        fr: "Essayez FitMesh Pro pendant 14 jours. Ensuite, pour continuer à utiliser les fonctions Pro, un achat ou un abonnement est nécessaire. L'appli est déjà disponible sur le Play Store et sur l'App Store.",
      },
      ctaLabel: {
        it: "Scarica FitMesh →",
        en: "Download FitMesh →",
        es: "Descargar FitMesh →",
        de: "FitMesh herunterladen →",
        pt: "Baixar FitMesh →",
        fr: "Télécharger FitMesh →",
      },
      ctaHref: {
        it: "/it#download",
        en: "/en#download",
        es: "/es#download",
        de: "/de#download",
        pt: "/pt#download",
        fr: "/fr#download",
      },
    },
    {
      type: "heading",
      level: 2,
      text: {
        it: "In sintesi",
        en: "In summary",
        es: "En resumen",
        de: "Zusammengefasst",
        pt: "Em resumo",
        fr: "En résumé",
      },
    },
    {
      type: "list",
      items: {
        it: [
          "FitMesh non ha un piano gratuito permanente: è la cosa da sapere prima di installare.",
          "Prova FitMesh Pro per 14 giorni. Al termine, per continuare a usare le funzioni Pro serve un acquisto o un abbonamento.",
          "Dopo i 14 giorni: puoi continuare con un abbonamento o con lo sblocco a vita, secondo il prezzo indicato dallo store.",
          `Founder: ${founderHistoricalClause("it")}; da agosto 2026 non è più possibile registrarsi come nuovo founder, chi lo aveva ottenuto lo mantiene per sempre.`,
          "Il prezzo per il tuo Paese è mostrato direttamente nell'app dallo store.",
        ],
        en: [
          "FitMesh has no permanent free plan: that's the thing to know before installing.",
          "Try FitMesh Pro for 14 days. After the trial, continuing to use Pro features requires a purchase or subscription.",
          "After 14 days: you can continue with a subscription or a lifetime unlock, according to the price shown by the store.",
          `Founder: ${founderHistoricalClause("en")}; from August 2026 signing up as a new founder is no longer possible, those who got it keep it forever.`,
          "The price for your country is shown directly in the app by the store.",
        ],
        es: [
          "FitMesh no tiene un plan gratuito permanente: es lo que hay que saber antes de instalar.",
          `Founder: ${founderHistoricalClause("es")}, funciones futuras incluidas.`,
          "Prueba FitMesh Pro durante 14 días. Al terminar, para seguir usando las funciones Pro es necesaria una compra o una suscripción.",
          "Después de los 14 días: puedes continuar con una suscripción o con el desbloqueo de por vida, según el precio de la tienda.",
          "El precio de tu país se muestra directamente en la app; para los founder es cero, para siempre.",
        ],
        de: [
          "FitMesh hat keinen dauerhaft kostenlosen Plan: Das sollte man vor der Installation wissen.",
          `Founder: ${founderHistoricalClause("de")}, künftige Funktionen inklusive.`,
          "Teste FitMesh Pro 14 Tage lang. Danach ist für die weitere Nutzung der Pro-Funktionen ein Kauf oder Abonnement erforderlich.",
          "Nach den 14 Tagen: Du kannst mit einem Abo oder der Freischaltung auf Lebenszeit fortfahren, zum im Store angezeigten Preis.",
          "Der Preis für dein Land steht direkt in der App; für founder ist es null, für immer.",
        ],
        pt: [
          "O FitMesh não tem um plano gratuito permanente: é o que você precisa saber antes de instalar.",
          `Founder: ${founderHistoricalClause("pt")}, incluindo os recursos futuros.`,
          "Experimenta o FitMesh Pro durante 14 dias. Depois, para continuar a usar as funções Pro é necessária uma compra ou uma assinatura.",
          "Depois dos 14 dias: você pode continuar com uma assinatura ou com o desbloqueio vitalício, segundo o preço mostrado pela loja.",
          "O preço do seu país é exibido diretamente no app; para os founder é zero, para sempre.",
        ],
        fr: [
          "FitMesh n'a pas de forfait gratuit permanent : c'est la chose à savoir avant d'installer.",
          `Founder : ${founderHistoricalClause("fr")}, fonctions futures comprises.`,
          "Tous les autres = un essai complet de 14 jours, chaque fonction Pro débloquée.",
          "Après les 14 jours : vous pouvez continuer avec un abonnement ou avec le déblocage à vie, selon le tarif affiché par le store.",
          "Le tarif pour votre pays est affiché directement dans l'appli ; pour les founder c'est zéro, pour toujours.",
        ],
      },
    },
  ],
  faq: [
    {
      q: {
        it: "FitMesh è gratis?",
        en: "Is FitMesh free?",
        es: "¿FitMesh es gratis?",
        de: "Ist FitMesh kostenlos?",
        pt: "O FitMesh é grátis?",
        fr: "FitMesh est gratuit ?",
      },
      a: {
        it: `Non esiste un piano gratuito permanente. Ogni nuovo account ha 14 giorni di prova completa, poi puoi continuare con un abbonamento o con lo sblocco a vita, al prezzo mostrato dallo store per il tuo Paese. Founder: ${founderHistoricalClause("it")}.`,
        en: `There is no permanent free plan. Every new account gets a full 14-day trial, then you can continue with a subscription or a lifetime unlock, at the price shown by the store for your country. Founder: ${founderHistoricalClause("en")}.`,
        es: `No existe un plan gratuito permanente. Founder: ${founderHistoricalClause("es")}. Todos los demás tienen 14 días de prueba completa y luego pueden continuar con una suscripción o con el desbloqueo de por vida, al precio mostrado por la tienda.`,
        de: `Es gibt keinen dauerhaft kostenlosen Plan. Founder: ${founderHistoricalClause("de")}. Alle anderen bekommen eine vollständige 14-tägige Testphase und können dann mit einem Abo oder der Freischaltung auf Lebenszeit fortfahren, zum im Store angezeigten Preis.`,
        pt: `Não existe um plano gratuito permanente. Founder: ${founderHistoricalClause("pt")}. Todos os outros têm 14 dias de teste completo e depois podem continuar com uma assinatura ou com o desbloqueio vitalício, pelo preço mostrado pela loja.`,
        fr: `Il n'existe pas de forfait gratuit permanent. Founder : ${founderHistoricalClause("fr")}. Tous les autres profitent d'un essai complet de 14 jours, puis peuvent continuer avec un abonnement ou avec le déblocage à vie, au prix affiché par le store.`,
      },
    },
    {
      q: {
        it: "Cosa succede dopo i 14 giorni di prova?",
        en: "What happens after the 14-day trial?",
        es: "¿Qué pasa después de los 14 días de prueba?",
        de: "Was passiert nach den 14 Tagen Testphase?",
        pt: "O que acontece depois dos 14 dias de teste?",
        fr: "Que se passe-t-il après les 14 jours d'essai ?",
      },
      a: {
        it: "Scegli tu come continuare: puoi mantenere FitMesh Pro con un abbonamento o con lo sblocco a vita, secondo i prezzi mostrati dallo store. Esportare i dati in formato JSON e richiedere la cancellazione dell'account non richiede alcun acquisto. (Chi aveva ottenuto il Pro Founder prima del 31 luglio 2026 non paga nulla: il suo Pro resta a vita.)",
        en: "You choose how to continue: you can keep FitMesh Pro with a subscription or a lifetime unlock, according to the prices shown by the store. Exporting your data as JSON and requesting account deletion do not require a purchase. (Anyone who got Founder Pro before July 31, 2026 pays nothing: their Pro stays lifetime.)",
        es: "Eliges cómo continuar: puedes mantener FitMesh Pro con una suscripción o con el desbloqueo de por vida, según los precios de la tienda. Exportar tus datos en JSON y solicitar la eliminación de la cuenta no requiere ninguna compra. (Quienes obtuvieron Pro Founder antes del 31 de julio de 2026 no pagan nada: su Pro sigue de por vida.)",
        de: "Du entscheidest, wie es weitergeht: Du kannst FitMesh Pro mit einem Abo oder der Freischaltung auf Lebenszeit behalten, gemäß den Preisen im Store. Der Export deiner Daten als JSON und das Anfordern einer Kontolöschung erfordern keinen Kauf. (Wer sich vor dem 31. Juli 2026 Founder Pro gesichert hat, zahlt nichts: Das Pro bleibt lebenslang.)",
        pt: "Você escolhe como continuar: pode manter o FitMesh Pro com uma assinatura ou com o desbloqueio vitalício, de acordo com os preços da loja. Exportar seus dados em JSON e solicitar a exclusão da conta não exige nenhuma compra. (Quem obteve o Founder Pro antes de 31 de julho de 2026 não paga nada: o Pro permanece vitalício.)",
        fr: "Vous choisissez comment continuer : vous pouvez garder FitMesh Pro avec un abonnement ou avec le déblocage à vie, selon les tarifs affichés par le store. Exporter vos données en JSON et demander la suppression du compte ne nécessite aucun achat. (Ceux qui ont obtenu le Pro Founder avant le 31 juillet 2026 ne paient rien : leur Pro reste à vie.)",
      },
    },
    {
      q: {
        it: "Chi poteva ottenere lo status founder?",
        en: "Who was eligible for the founder program?",
        es: "¿Quién podía obtener el estado founder?",
        de: "Wer war für das Founder-Programm berechtigt?",
        pt: "Quem podia obter o estado founder?",
        fr: "Qui était éligible au programme founder ?",
      },
      a: {
        it: `${founderEligibilityStatement("it")} Chi era già founder mantiene il Pro a vita senza fare nulla.`,
        en: `${founderEligibilityStatement("en")} Anyone who was already a founder keeps lifetime Pro without doing anything.`,
        es: `${founderEligibilityStatement("es")} Quien ya era founder mantiene el Pro de por vida sin hacer nada.`,
        de: `${founderEligibilityStatement("de")} Wer bereits founder war, behält Pro auf Lebenszeit, ohne etwas tun zu müssen.`,
        pt: `${founderEligibilityStatement("pt")} Quem já era founder mantém o Pro vitalício sem precisar fazer nada.`,
        fr: `${founderEligibilityStatement("fr")} Ceux qui étaient déjà founder gardent le Pro à vie sans rien avoir à faire.`,
      },
    },
    {
      q: {
        it: "Quanto costa il Pro?",
        en: "How much does Pro cost?",
        es: "¿Cuánto cuesta el Pro?",
        de: "Was kostet Pro?",
        pt: "Quanto custa o Pro?",
        fr: "Combien coûte le Pro ?",
      },
      a: {
        it: "Prova FitMesh Pro per 14 giorni. Al termine, per continuare a usare le funzioni Pro serve un acquisto o un abbonamento. Il prezzo aggiornato per il tuo Paese è sempre mostrato nell'app. Chi aveva ottenuto il Pro Founder prima del 31 luglio 2026 non paga nulla, per sempre.",
        en: "Try FitMesh Pro for 14 days. After the trial, continuing to use Pro features requires a purchase or subscription. The current price for your country is always shown in the app. Anyone who got Founder Pro before July 31, 2026 pays nothing, forever.",
        es: "Prueba FitMesh Pro durante 14 días. Al terminar, para seguir usando las funciones Pro es necesaria una compra o una suscripción. El precio actualizado para tu país siempre se muestra en la app. Para los founder es cero, para siempre.",
        de: "Teste FitMesh Pro 14 Tage lang. Danach ist für die weitere Nutzung der Pro-Funktionen ein Kauf oder Abonnement erforderlich. Der aktuelle Preis für dein Land wird immer in der App angezeigt. Für founder ist es null, für immer.",
        pt: "Experimenta o FitMesh Pro durante 14 dias. Depois, para continuar a usar as funções Pro é necessária uma compra ou uma assinatura. O preço atualizado para o seu país aparece sempre no app. Para os founder é zero, para sempre.",
        fr: "Essayez FitMesh Pro pendant 14 jours. Ensuite, pour continuer à utiliser les fonctions Pro, un achat ou un abonnement est nécessaire. Le prix actualisé pour votre pays s'affiche toujours dans l'appli. Pour les founder, c'est zéro, pour toujours.",
      },
    },
    {
      q: {
        it: "Posso disdire l'abbonamento?",
        en: "Can I cancel the subscription?",
        es: "¿Puedo cancelar la suscripción?",
        de: "Kann ich das Abo kündigen?",
        pt: "Posso cancelar a assinatura?",
        fr: "Puis-je résilier l'abonnement ?",
      },
      a: {
        it: "Sì. Se scegli l'abbonamento, lo gestisci e lo disdici dallo store da cui l'hai attivato (Google Play o App Store), come qualsiasi altro abbonamento. Se invece scegli lo sblocco a vita, paghi una volta sola e non c'è nulla da rinnovare o disdire. I founder non hanno alcun abbonamento.",
        en: "Yes. If you pick the subscription, you manage and cancel it from the store where you activated it (Google Play or the App Store), like any other subscription. If you pick the lifetime unlock, you pay once and there's nothing to renew or cancel. Founders have no subscription at all.",
        es: "Sí. Si eliges la suscripción, la gestionas y la cancelas desde la tienda en la que la activaste (Google Play o App Store), como cualquier otra suscripción. Si en cambio eliges el desbloqueo de por vida, pagas una sola vez y no hay nada que renovar ni cancelar. Los founder no tienen ninguna suscripción.",
        de: "Ja. Wenn du das Abo wählst, verwaltest und kündigst du es in dem Store, in dem du es aktiviert hast (Google Play oder App Store), wie jedes andere Abo. Wenn du stattdessen die Freischaltung auf Lebenszeit wählst, zahlst du einmalig und es gibt nichts zu verlängern oder zu kündigen. Founder haben gar kein Abo.",
        pt: "Sim. Se você escolher a assinatura, você a gerencia e cancela na loja onde a ativou (Google Play ou App Store), como qualquer outra assinatura. Se, em vez disso, escolher o desbloqueio vitalício, paga uma única vez e não há nada para renovar ou cancelar. Os founder não têm assinatura nenhuma.",
        fr: "Oui. Si vous choisissez l'abonnement, vous le gérez et le résiliez depuis la boutique où vous l'avez activé (Google Play ou l'App Store), comme n'importe quel autre abonnement. Si, au contraire, vous choisissez le déblocage à vie, vous payez une seule fois et il n'y a rien à renouveler ni à résilier. Les founder n'ont aucun abonnement.",
      },
    },
  ],
  related: [
    "colmi-ring-fitmesh",
    "fitmesh-arriva-su-iphone",
    "piu-smartwatch-insieme-dati-doppi",
    "vedere-dati-wearable-browser-pc",
    "guida-sync-wearable-2026",
  ],
  brandsMentioned: ["Colmi"],
  ldType: "BlogPosting",
};
