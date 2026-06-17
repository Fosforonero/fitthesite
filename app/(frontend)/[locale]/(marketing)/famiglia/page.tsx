/**
 * /[locale]/famiglia — Marketing landing dedicata a Mesh Famiglia.
 *
 * Obiettivo SEO: cluster keyword "monitorare salute famiglia genitori
 * anziani" (zero competitor diretti in Italia; Apple Family Sharing,
 * Samsung Family Health solo brand-specific e closed). Target: caregiver
 * 35-55, adulti con genitori 65+ che vogliono sicurezza senza essere
 * invadenti.
 *
 * Differenziazione vs sync-feature pages (/sync/[provider]):
 *   - quelle: utente fitness-tech che cerca "come connettere X"
 *   - questa: utente emotivo che cerca "controllare mio padre" /
 *     "sapere se mia mamma cammina abbastanza"
 *
 * JSON-LD: WebPage + SoftwareApplication.featureList (family-specific)
 * + FAQPage. Hreflang IT/EN; EN parla di "Family Mesh".
 */
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { JsonLd } from "@/components/seo/JsonLd";
import { Breadcrumbs } from "@/components/seo/Breadcrumbs";
import StoreButtonsRow from "@/components/StoreButtonsRow";
import TrustBadges from "@/components/TrustBadges";
import { locales, type Locale, ogLocale } from "@/lib/i18n";

const SITE_URL = "https://www.fitmesh.fit";
const PLAY_URL = "https://play.google.com/store/apps/details?id=com.fitmeshsync.app";

/**
 * Mesh Famiglia feature temporaneamente sospesa lato app (FeatureFlags
 * meshFamigliaEnabled=false) finché l'app non è live su entrambi gli store
 * (Android Play Store + iOS App Store). Quando l'app raggiunge entrambi
 * gli store: flip a `false` per riattivare la landing piena.
 *
 * Mantenuto l'URL stabile per SEO (Google ha già indicizzato) ma il body
 * mostra uno stato "in arrivo" con CTA waitlist via /it/beta.
 */
const COMING_SOON = true;

const COPY = {
  it: {
    hero_kicker: "Mesh Famiglia",
    hero_h1: "Vedi se i tuoi cari stanno bene, senza chiederlo ogni giorno",
    hero_sub:
      "Crei un gruppo, inviti chi vuoi (genitori, partner, figli), e vedi in un'unica dashboard chi ha camminato oggi, chi ha dormito poco, chi ha avuto un battito anomalo. Privacy first: ognuno sceglie cosa condividere.",
    cta_primary: "Scarica l'app",
    cta_secondary: "Come funziona",
    why_kicker: "Perchè serve",
    why_h2: "Tre modi di stare vicini a chi conta",
    why_items: [
      {
        title: "Genitori anziani autonomi",
        body:
          "Tua madre vive da sola e indossa il Galaxy Watch che le hai regalato. Non vuoi essere invadente, ma vorresti sapere se ha smesso di camminare o se la frequenza cardiaca a riposo cambia. Mesh Famiglia te lo dice senza che lei debba aprire app o mandarti messaggi.",
      },
      {
        title: "Famiglia con figli adolescenti",
        body:
          "Tuo figlio ha la Mi Band. Tu vuoi che si muova, dorma abbastanza, non strapazzi il cuore allenandosi senza sapere. Vedi i suoi dati salute nella tua app: niente social, niente chat, solo numeri.",
      },
      {
        title: "Partner / coniugi",
        body:
          "Lavorate in posti diversi, vi vedete la sera. Sapere che lei ha fatto i suoi 8000 passi o che lui ha dormito bene la notte e' un piccolo modo di curarsi a distanza.",
      },
    ],
    how_kicker: "Come funziona",
    how_h2: "Tre passaggi, due minuti",
    how_steps: [
      {
        title: "Crei il gruppo famiglia",
        body:
          "Dall'app FitMesh tap su 'Mesh Famiglia' → 'Crea gruppo'. Dai un nome (es. 'Famiglia Rossi'). Sei tu l'admin.",
      },
      {
        title: "Inviti chi vuoi via link",
        body:
          "L'app genera un codice MESH-XXXX e un link condivisibile (WhatsApp, SMS, email). Chi clicca scarica l'app gratis e si unisce. Massimo 3 membri gratis, 8 con FitMesh Pro.",
      },
      {
        title: "Ognuno sceglie cosa condividere",
        body:
          "Default condiviso: passi, sonno, frequenza cardiaca a riposo, livello attivita'. NON condivisi di default: peso, pressione, ciclo, glicemia, posizione. Modificabile in ogni momento dall'app.",
      },
    ],
    privacy_kicker: "Privacy e controllo",
    privacy_h2: "Quello che vedi, e quello che NON vedi",
    privacy_columns: [
      {
        title: "Cosa vede l'admin del gruppo",
        items: [
          "Nome che il membro ha scelto (es. 'Mamma', 'Luca')",
          "Conteggio passi giornaliero",
          "Ore di sonno totali",
          "Frequenza cardiaca media e a riposo",
          "Livello attivita' generico (basso/medio/alto)",
        ],
        color: "brand-aqua",
      },
      {
        title: "Cosa NON vede mai",
        items: [
          "Posizione geografica del membro",
          "Peso e composizione corporea",
          "Ciclo mestruale",
          "Pressione, glicemia, dati medici sensibili",
          "Notifiche, messaggi, contatti del telefono",
        ],
        color: "brand-green",
      },
    ],
    techstack_h2: "Funziona con tutti i wearable che gia' avete",
    techstack_body:
      "Galaxy Watch, Mi Band, Pixel Watch, Garmin, Fitbit, Polar, Withings, Honor, Huawei. Se uno di voi ha un wearable diverso, basta che scriva i dati su Health Connect (lo fanno tutti dal 2024). Niente acquisto vincolato a un marchio.",
    pricing_kicker: "Quanto costa",
    pricing_h2: "Gratis fino a 3 membri",
    pricing_body:
      "Il piano gratuito copre te + 2 familiari (3 totali). Con FitMesh Pro (acquisto unico: €3,99 su Android · €4,99 su iPhone) sblocchi fino a 8 membri, storico esteso, e priorita' sync. Niente subscription, niente trial scaduti, niente carte di credito richieste.",
    faq_kicker: "Domande comuni",
    faq_h2: "Dubbi e risposte",
    faqs: [
      {
        q: "Mia madre/mio padre e' tecnologicamente impreparato. Riesce a usarla?",
        a:
          "Sì. Una volta installata l'app e cliccato il link di invito che gli mandi, non deve fare nient'altro. L'app sincronizza da sola in background. Tu vedi i suoi dati dalla tua app. Lui/lei non deve aprire mai piu' nulla.",
      },
      {
        q: "Posso vedere la posizione dei membri famiglia?",
        a:
          "No, mai. FitMesh Sync non raccoglie ne' condivide dati di posizione. Se cerchi quello, serve un'app dedicata tipo Google Family Link.",
      },
      {
        q: "Cosa succede se un membro vuole uscire dal gruppo?",
        a:
          "Dal suo telefono: Mesh Famiglia → Impostazioni gruppo → Lascia gruppo. I suoi dati storici vengono rimossi dalla vista degli altri immediatamente. Nessuna autorizzazione admin richiesta.",
      },
      {
        q: "I dati salute dei miei familiari sono al sicuro?",
        a:
          "Sì. Tutto cifrato HTTPS/TLS. Storage su Supabase EU (Francoforte). Accesso vincolato al gruppo specifico via Row-Level Security Postgres. Niente broker dati, niente pubblicita' profilata. Conformita' GDPR full.",
      },
      {
        q: "E' un dispositivo medico?",
        a:
          "No. FitMesh Sync e' un'app fitness/wellness. NON sostituisce un medico ne' diagnostica patologie. Per dubbi clinici, consulta sempre il tuo medico di base.",
      },
      {
        q: "Quante persone posso invitare?",
        a:
          "Piano gratuito: 3 totali (incluso te). Piano Pro (€3,99 Android · €4,99 iPhone): fino a 8 membri.",
      },
    ],
    final_cta_h2: "Inizia oggi: 3 minuti per creare il primo gruppo",
    final_cta_body:
      "Scarica FitMesh dal Play Store, crea il gruppo famiglia, condividi il link con chi vuoi. Funziona subito, anche se i tuoi familiari non aprono l'app per giorni.",
  },
  en: {
    hero_kicker: "Family Mesh",
    hero_h1: "See if your loved ones are doing well, without asking every day",
    hero_sub:
      "Create a group, invite anyone (parents, partner, kids), and see in one dashboard who walked today, who slept poorly, whose heart rate spiked. Privacy-first: everyone chooses what to share.",
    cta_primary: "Get the app",
    cta_secondary: "How it works",
    why_kicker: "Why it matters",
    why_h2: "Three ways to stay close to those who count",
    why_items: [
      {
        title: "Independent aging parents",
        body:
          "Your mother lives alone and wears the Galaxy Watch you gave her. You don't want to be intrusive, but you'd like to know if she stopped walking or if her resting heart rate changes. Family Mesh tells you without her having to open apps or text you.",
      },
      {
        title: "Families with teenagers",
        body:
          "Your kid has the Mi Band. You want them to move, sleep enough, not overdo workouts blindly. See their health data in your app: no social, no chats, just numbers.",
      },
      {
        title: "Partners / spouses",
        body:
          "You work in different places, see each other in the evening. Knowing she hit her 8000 steps or he slept well last night is a small way to care from a distance.",
      },
    ],
    how_kicker: "How it works",
    how_h2: "Three steps, two minutes",
    how_steps: [
      {
        title: "Create the family group",
        body:
          "In the FitMesh app tap 'Family Mesh' → 'Create group'. Give it a name (e.g. 'Smith Family'). You're the admin.",
      },
      {
        title: "Invite anyone via link",
        body:
          "The app generates a MESH-XXXX code and a shareable link (WhatsApp, SMS, email). Whoever clicks downloads the app for free and joins. Up to 3 members free, 8 with FitMesh Pro.",
      },
      {
        title: "Each chooses what to share",
        body:
          "Default shared: steps, sleep, resting heart rate, activity level. NOT shared by default: weight, blood pressure, cycle, glucose, location. Editable anytime.",
      },
    ],
    privacy_kicker: "Privacy & control",
    privacy_h2: "What you see, and what you NEVER see",
    privacy_columns: [
      {
        title: "What the group admin sees",
        items: [
          "Name the member chose (e.g. 'Mom', 'Luca')",
          "Daily step count",
          "Total hours of sleep",
          "Average and resting heart rate",
          "Generic activity level (low/medium/high)",
        ],
        color: "brand-aqua",
      },
      {
        title: "What is NEVER visible",
        items: [
          "Geographic location of any member",
          "Weight and body composition",
          "Menstrual cycle",
          "Blood pressure, glucose, sensitive medical data",
          "Notifications, messages, phone contacts",
        ],
        color: "brand-green",
      },
    ],
    techstack_h2: "Works with all wearables you already own",
    techstack_body:
      "Galaxy Watch, Mi Band, Pixel Watch, Garmin, Fitbit, Polar, Withings, Honor, Huawei. If one of you has a different wearable, it just needs to write data to Health Connect (all major brands do since 2024). No brand lock-in.",
    pricing_kicker: "What it costs",
    pricing_h2: "Free up to 3 members",
    pricing_body:
      "Free plan covers you + 2 family members (3 total). With FitMesh Pro (one-time: €3.99 on Android · €4.99 on iPhone) you unlock up to 8 members, extended history, and sync priority. No subscription, no expired trials, no credit card required.",
    faq_kicker: "Common questions",
    faq_h2: "FAQs",
    faqs: [
      {
        q: "My mother/father is not tech-savvy. Can they use it?",
        a:
          "Yes. Once the app is installed and they tap the invite link you send, they don't need to do anything else. The app syncs in background automatically. You see their data in your app. They never need to open it again.",
      },
      {
        q: "Can I see family members' location?",
        a:
          "No, never. FitMesh Sync does not collect or share location data. If you need that, use a dedicated app like Google Family Link.",
      },
      {
        q: "What if a member wants to leave the group?",
        a:
          "From their phone: Family Mesh → Group settings → Leave group. Their historical data is removed from other members' view immediately. No admin approval required.",
      },
      {
        q: "Are my family's health data safe?",
        a:
          "Yes. Everything is encrypted via HTTPS/TLS. Storage on Supabase EU (Frankfurt). Access bound to the specific group via Row-Level Security in Postgres. No data brokers, no profiling ads. Full GDPR compliance.",
      },
      {
        q: "Is this a medical device?",
        a:
          "No. FitMesh Sync is a fitness/wellness app. It does NOT replace a doctor or diagnose conditions. For any clinical concern, consult your family physician.",
      },
      {
        q: "How many people can I invite?",
        a:
          "Free plan: 3 total (including you). Pro (€3.99 Android · €4.99 iPhone): up to 8 members.",
      },
    ],
    final_cta_h2: "Start today: 3 minutes to create your first group",
    final_cta_body:
      "Download FitMesh from Play Store, create the family group, share the link with anyone. It works immediately, even if your family members don't open the app for days.",
  },
  es: {
    hero_kicker: "Mesh Familia",
    hero_h1: "Sabe si tus seres queridos están bien, sin preguntarlo cada día",
    hero_sub:
      "Creas un grupo, invitas a quien quieras (padres, pareja, hijos) y ves en un solo panel quién caminó hoy, quién durmió poco, quién tuvo una frecuencia cardíaca inusual. Privacidad primero: cada persona elige qué compartir.",
    cta_primary: "Descarga la app",
    cta_secondary: "Cómo funciona",
    why_kicker: "Por qué lo necesitas",
    why_h2: "Tres formas de estar cerca de quienes importan",
    why_items: [
      {
        title: "Personas mayores independientes",
        body:
          "Tu madre vive sola y lleva el Galaxy Watch que le regalaste. No quieres ser invasivo, pero te gustaría saber si ha dejado de caminar o si su frecuencia cardíaca en reposo cambia. Mesh Familia te lo dice sin que ella tenga que abrir ninguna app ni enviarte mensajes.",
      },
      {
        title: "Familia con hijos adolescentes",
        body:
          "Tu hijo tiene la Mi Band. Quieres que se mueva, que duerma lo suficiente, que no fuerce el corazón entrenando sin control. Ves sus datos de salud en tu app: sin redes sociales, sin chats, solo números.",
      },
      {
        title: "Parejas",
        body:
          "Trabajáis en lugares distintos y os veis por la noche. Saber que ella ha dado sus 8.000 pasos o que él durmió bien es una pequeña forma de cuidarse a distancia.",
      },
    ],
    how_kicker: "Cómo funciona",
    how_h2: "Tres pasos, dos minutos",
    how_steps: [
      {
        title: "Crea el grupo familiar",
        body:
          "En la app FitMesh, toca 'Mesh Familia' → 'Crear grupo'. Ponle un nombre (por ejemplo, 'Familia García'). Tú eres el administrador.",
      },
      {
        title: "Invita a quien quieras por enlace",
        body:
          "La app genera un código MESH-XXXX y un enlace que puedes compartir (WhatsApp, SMS, correo). Quien lo toca descarga la app gratis y se une. Hasta 3 miembros gratis, 8 con FitMesh Pro.",
      },
      {
        title: "Cada uno elige qué compartir",
        body:
          "Compartido por defecto: pasos, sueño, frecuencia cardíaca en reposo, nivel de actividad. NO compartido por defecto: peso, presión arterial, ciclo menstrual, glucosa, ubicación. Se puede cambiar en cualquier momento desde la app.",
      },
    ],
    privacy_kicker: "Privacidad y control",
    privacy_h2: "Lo que ves y lo que NUNCA verás",
    privacy_columns: [
      {
        title: "Qué ve el administrador del grupo",
        items: [
          "El nombre que eligió el miembro (por ejemplo, 'Mamá', 'Luis')",
          "Recuento diario de pasos",
          "Horas totales de sueño",
          "Frecuencia cardíaca media y en reposo",
          "Nivel de actividad genérico (bajo/medio/alto)",
        ],
        color: "brand-aqua",
      },
      {
        title: "Lo que NUNCA verá",
        items: [
          "Ubicación geográfica del miembro",
          "Peso y composición corporal",
          "Ciclo menstrual",
          "Presión arterial, glucosa y datos médicos sensibles",
          "Notificaciones, mensajes y contactos del teléfono",
        ],
        color: "brand-green",
      },
    ],
    techstack_h2: "Compatible con todos los wearables que ya tienes",
    techstack_body:
      "Galaxy Watch, Mi Band, Pixel Watch, Garmin, Fitbit, Polar, Withings, Honor, Huawei. Si alguno de vosotros tiene un wearable diferente, basta con que escriba los datos en Health Connect (lo hacen todas las marcas principales desde 2024). Sin ataduras a ninguna marca.",
    pricing_kicker: "Cuánto cuesta",
    pricing_h2: "Gratis hasta 3 miembros",
    pricing_body:
      "El plan gratuito incluye tú + 2 familiares (3 en total). Con FitMesh Pro (pago único: 3,99 € en Android · 4,99 € en iPhone) desbloqueas hasta 8 miembros, historial ampliado y sincronización prioritaria. Sin suscripción, sin periodos de prueba caducados, sin tarjeta de crédito.",
    faq_kicker: "Preguntas frecuentes",
    faq_h2: "Dudas y respuestas",
    faqs: [
      {
        q: "Mi madre/mi padre no sabe mucho de tecnología. ¿Puede usarla?",
        a:
          "Sí. Una vez instalada la app y tocado el enlace de invitación que le envías, no tiene que hacer nada más. La app sincroniza sola en segundo plano. Tú ves sus datos desde tu app. Él o ella no necesita volver a abrirla nunca más.",
      },
      {
        q: "¿Puedo ver la ubicación de los miembros de la familia?",
        a:
          "No, nunca. FitMesh Sync no recopila ni comparte datos de ubicación. Si necesitas eso, usa una app dedicada como Google Family Link.",
      },
      {
        q: "¿Qué pasa si un miembro quiere salir del grupo?",
        a:
          "Desde su teléfono: Mesh Familia → Ajustes del grupo → Salir del grupo. Sus datos históricos se eliminan de la vista de los demás de forma inmediata. No se necesita autorización del administrador.",
      },
      {
        q: "¿Los datos de salud de mis familiares están seguros?",
        a:
          "Sí. Todo cifrado mediante HTTPS/TLS. Almacenamiento en Supabase EU (Fráncfort). Acceso restringido al grupo específico mediante Row-Level Security en Postgres. Sin intermediarios de datos, sin publicidad basada en perfiles. Cumplimiento total del RGPD.",
      },
      {
        q: "¿Es un dispositivo médico?",
        a:
          "No. FitMesh Sync es una app de fitness y bienestar. NO sustituye a un médico ni detecta enfermedades. Ante cualquier duda sobre tu salud, consulta siempre a tu médico.",
      },
      {
        q: "¿A cuántas personas puedo invitar?",
        a:
          "Plan gratuito: 3 en total (incluido tú). Plan Pro (3,99 € Android · 4,99 € iPhone): hasta 8 miembros.",
      },
    ],
    final_cta_h2: "Empieza hoy: 3 minutos para crear tu primer grupo",
    final_cta_body:
      "Descarga FitMesh desde Play Store, crea el grupo familiar y comparte el enlace con quien quieras. Funciona de inmediato, aunque tus familiares no abran la app en días.",
  },
  de: {
    hero_kicker: "Mesh Familie",
    hero_h1: "Sieh, wie es deinen Liebsten geht, ohne täglich nachfragen zu müssen",
    hero_sub:
      "Du erstellst eine Gruppe, lädst ein, wen du möchtest (Eltern, Partner, Kinder), und siehst in einem Dashboard, wer heute gelaufen ist, wer schlecht geschlafen hat, wessen Herzfrequenz gestiegen ist. Datenschutz an erster Stelle: Jeder entscheidet selbst, was er teilt.",
    cta_primary: "App herunterladen",
    cta_secondary: "So funktioniert es",
    why_kicker: "Warum es wichtig ist",
    why_h2: "Drei Wege, nah bei denen zu sein, die dir wichtig sind",
    why_items: [
      {
        title: "Selbstständige ältere Eltern",
        body:
          "Deine Mutter lebt allein und trägt die Galaxy Watch, die du ihr geschenkt hast. Du möchtest nicht aufdringlich sein, aber du würdest gerne wissen, ob sie aufgehört hat zu laufen oder ob sich ihre Ruheherzfrequenz verändert. Mesh Familie informiert dich, ohne dass sie eine App öffnen oder dir schreiben muss.",
      },
      {
        title: "Familie mit Teenagern",
        body:
          "Dein Kind hat ein Mi Band. Du möchtest, dass es sich bewegt, ausreichend schläft und sein Herz beim Training nicht überlastet. Sieh seine Gesundheitsdaten in deiner App: kein Social Media, kein Chat, nur Zahlen.",
      },
      {
        title: "Partner und Eheleute",
        body:
          "Ihr arbeitet an verschiedenen Orten und seht euch abends. Zu wissen, dass sie ihre 8.000 Schritte gemacht hat oder dass er gut geschlafen hat, ist eine kleine Art, sich aus der Ferne umeinander zu kümmern.",
      },
    ],
    how_kicker: "So funktioniert es",
    how_h2: "Drei Schritte, zwei Minuten",
    how_steps: [
      {
        title: "Familiengruppe erstellen",
        body:
          "In der FitMesh App auf 'Mesh Familie' tippen → 'Gruppe erstellen'. Gib ihr einen Namen (z. B. 'Familie Müller'). Du bist der Admin.",
      },
      {
        title: "Per Link einladen",
        body:
          "Die App generiert einen MESH-XXXX-Code und einen teilbaren Link (WhatsApp, SMS, E-Mail). Wer darauf tippt, lädt die App kostenlos herunter und tritt bei. Bis zu 3 Mitglieder kostenlos, 8 mit FitMesh Pro.",
      },
      {
        title: "Jeder wählt, was er teilt",
        body:
          "Standardmäßig geteilt: Schritte, Schlaf, Ruheherzfrequenz, Aktivitätslevel. NICHT standardmäßig geteilt: Gewicht, Blutdruck, Zyklus, Blutzucker, Standort. Jederzeit in der App änderbar.",
      },
    ],
    privacy_kicker: "Datenschutz und Kontrolle",
    privacy_h2: "Was du siehst und was du NIEMALS siehst",
    privacy_columns: [
      {
        title: "Was der Gruppen-Admin sieht",
        items: [
          "Name, den das Mitglied gewählt hat (z. B. 'Mama', 'Luca')",
          "Tägliche Schrittanzahl",
          "Gesamte Schlafdauer in Stunden",
          "Durchschnittliche Herzfrequenz und Ruheherzfrequenz",
          "Allgemeines Aktivitätslevel (niedrig/mittel/hoch)",
        ],
        color: "brand-aqua",
      },
      {
        title: "Was NIEMALS sichtbar ist",
        items: [
          "Geografischer Standort der Mitglieder",
          "Gewicht und Körperzusammensetzung",
          "Menstruationszyklus",
          "Blutdruck, Blutzucker und sensible Gesundheitsdaten",
          "Benachrichtigungen, Nachrichten und Telefonkontakte",
        ],
        color: "brand-green",
      },
    ],
    techstack_h2: "Funktioniert mit allen Wearables, die ihr bereits besitzt",
    techstack_body:
      "Galaxy Watch, Mi Band, Pixel Watch, Garmin, Fitbit, Polar, Withings, Honor, Huawei. Falls jemand aus eurer Gruppe ein anderes Wearable hat, muss es nur Daten an Health Connect übermitteln (das tun alle großen Marken seit 2024). Kein Markenzwang.",
    pricing_kicker: "Was es kostet",
    pricing_h2: "Kostenlos für bis zu 3 Mitglieder",
    pricing_body:
      "Der kostenlose Plan umfasst dich plus 2 Familienmitglieder (3 insgesamt). Mit FitMesh Pro (Einmalkauf: 3,99 € auf Android · 4,99 € auf iPhone) schaltest du bis zu 8 Mitglieder, einen erweiterten Verlauf und Sync-Priorität frei. Kein Abonnement, keine abgelaufenen Testphasen, keine Kreditkarte erforderlich.",
    faq_kicker: "Häufige Fragen",
    faq_h2: "Fragen und Antworten",
    faqs: [
      {
        q: "Meine Mutter/mein Vater ist nicht technikaffin. Kann sie/er die App nutzen?",
        a:
          "Ja. Sobald die App installiert ist und sie/er auf den Einladungslink tippt, den du sendest, ist nichts weiter nötig. Die App synchronisiert automatisch im Hintergrund. Du siehst ihre/seine Daten in deiner App. Sie/er muss die App nie wieder öffnen.",
      },
      {
        q: "Kann ich den Standort der Familienmitglieder sehen?",
        a:
          "Nein, niemals. FitMesh Sync erfasst oder teilt keine Standortdaten. Falls du das benötigst, verwende eine spezialisierte App wie Google Family Link.",
      },
      {
        q: "Was passiert, wenn ein Mitglied die Gruppe verlassen möchte?",
        a:
          "Auf seinem Telefon: Mesh Familie → Gruppeneinstellungen → Gruppe verlassen. Seine historischen Daten werden sofort aus der Ansicht der anderen Mitglieder entfernt. Keine Admin-Genehmigung erforderlich.",
      },
      {
        q: "Sind die Gesundheitsdaten meiner Familie sicher?",
        a:
          "Ja. Alles ist via HTTPS/TLS verschlüsselt. Speicherung auf Supabase EU (Frankfurt). Zugriff auf die jeweilige Gruppe beschränkt via Row-Level Security in Postgres. Keine Datenhändler, keine profilbasierte Werbung. Volle DSGVO-Konformität.",
      },
      {
        q: "Ist dies ein Medizinprodukt?",
        a:
          "Nein. FitMesh Sync ist eine Fitness- und Wellness-App. Sie ersetzt KEINEN Arzt und stellt keine Diagnosen. Bei gesundheitlichen Fragen wende dich stets an deinen Hausarzt.",
      },
      {
        q: "Wie viele Personen kann ich einladen?",
        a:
          "Kostenloser Plan: 3 insgesamt (inkl. du). Pro (3,99 € Android · 4,99 € iPhone): bis zu 8 Mitglieder.",
      },
    ],
    final_cta_h2: "Starte heute: 3 Minuten bis zur ersten Gruppe",
    final_cta_body:
      "Lade FitMesh aus dem Play Store herunter, erstelle die Familiengruppe und teile den Link mit wem du möchtest. Es funktioniert sofort, auch wenn deine Familienmitglieder die App tagelang nicht öffnen.",
  },
  pt: {
    hero_kicker: "Mesh Família",
    hero_h1: "Veja como seus entes queridos estão, sem precisar perguntar todo dia",
    hero_sub:
      "Você cria um grupo, convida quem quiser (pais, parceiro, filhos) e vê em um único painel quem caminhou hoje, quem dormiu pouco, quem teve a frequência cardíaca elevada. Privacidade em primeiro lugar: cada pessoa escolhe o que compartilhar.",
    cta_primary: "Baixe o app",
    cta_secondary: "Como funciona",
    why_kicker: "Por que faz diferença",
    why_h2: "Três formas de estar perto de quem importa",
    why_items: [
      {
        title: "Pais idosos independentes",
        body:
          "Sua mãe mora sozinha e usa o Galaxy Watch que você deu de presente. Você não quer ser invasivo, mas gostaria de saber se ela parou de caminhar ou se a frequência cardíaca em repouso mudou. O Mesh Família te avisa sem que ela precise abrir nenhum app ou te mandar mensagem.",
      },
      {
        title: "Família com filhos adolescentes",
        body:
          "Seu filho tem uma Mi Band. Você quer que ele se mexa, durma bem e não sobrecarregue o coração se exercitando sem controle. Veja os dados de saúde dele no seu app: sem redes sociais, sem chats, só números.",
      },
      {
        title: "Casais e parceiros",
        body:
          "Vocês trabalham em lugares diferentes e se veem à noite. Saber que ela completou os 8.000 passos ou que ele dormiu bem é uma pequena forma de cuidar um do outro à distância.",
      },
    ],
    how_kicker: "Como funciona",
    how_h2: "Três passos, dois minutos",
    how_steps: [
      {
        title: "Crie o grupo familiar",
        body:
          "No app FitMesh, toque em 'Mesh Família' → 'Criar grupo'. Dê um nome (por exemplo, 'Família Silva'). Você é o administrador.",
      },
      {
        title: "Convide quem quiser por link",
        body:
          "O app gera um código MESH-XXXX e um link para compartilhar (WhatsApp, SMS, e-mail). Quem clicar baixa o app gratuitamente e entra no grupo. Até 3 membros grátis, 8 com FitMesh Pro.",
      },
      {
        title: "Cada um escolhe o que compartilhar",
        body:
          "Compartilhado por padrão: passos, sono, frequência cardíaca em repouso, nível de atividade. NÃO compartilhado por padrão: peso, pressão arterial, ciclo menstrual, glicemia, localização. Pode ser alterado a qualquer momento no app.",
      },
    ],
    privacy_kicker: "Privacidade e controle",
    privacy_h2: "O que você vê e o que você NUNCA vê",
    privacy_columns: [
      {
        title: "O que o administrador do grupo vê",
        items: [
          "Nome que o membro escolheu (por exemplo, 'Mãe', 'Lucas')",
          "Contagem diária de passos",
          "Total de horas de sono",
          "Frequência cardíaca média e em repouso",
          "Nível de atividade genérico (baixo/médio/alto)",
        ],
        color: "brand-aqua",
      },
      {
        title: "O que NUNCA é visível",
        items: [
          "Localização geográfica dos membros",
          "Peso e composição corporal",
          "Ciclo menstrual",
          "Pressão arterial, glicemia e dados de saúde sensíveis",
          "Notificações, mensagens e contatos do telefone",
        ],
        color: "brand-green",
      },
    ],
    techstack_h2: "Funciona com todos os wearables que você já tem",
    techstack_body:
      "Galaxy Watch, Mi Band, Pixel Watch, Garmin, Fitbit, Polar, Withings, Honor, Huawei. Se alguém do grupo tiver um wearable diferente, basta que ele grave os dados no Health Connect (todas as marcas principais fazem isso desde 2024). Sem vínculo com nenhuma marca.",
    pricing_kicker: "Quanto custa",
    pricing_h2: "Grátis para até 3 membros",
    pricing_body:
      "O plano gratuito inclui você mais 2 familiares (3 no total). Com FitMesh Pro (compra única: R$ ou €3,99 no Android · €4,99 no iPhone) você desbloqueia até 8 membros, histórico estendido e prioridade de sincronização. Sem assinatura, sem períodos de teste expirados, sem cartão de crédito.",
    faq_kicker: "Perguntas frequentes",
    faq_h2: "Dúvidas e respostas",
    faqs: [
      {
        q: "Minha mãe/meu pai não tem muita familiaridade com tecnologia. Consegue usar?",
        a:
          "Sim. Depois de instalar o app e tocar no link de convite que você envia, ela/ele não precisa fazer mais nada. O app sincroniza automaticamente em segundo plano. Você vê os dados dela/dele no seu app. Ela/ele nunca mais precisa abrir nada.",
      },
      {
        q: "Posso ver a localização dos membros da família?",
        a:
          "Não, nunca. FitMesh Sync não coleta nem compartilha dados de localização. Se precisar disso, use um app dedicado como o Google Family Link.",
      },
      {
        q: "O que acontece se um membro quiser sair do grupo?",
        a:
          "No celular dele: Mesh Família → Configurações do grupo → Sair do grupo. Os dados históricos dele são removidos da visualização dos outros imediatamente. Nenhuma aprovação do administrador é necessária.",
      },
      {
        q: "Os dados de saúde da minha família estão seguros?",
        a:
          "Sim. Tudo criptografado via HTTPS/TLS. Armazenamento no Supabase EU (Frankfurt). Acesso restrito ao grupo específico via Row-Level Security no Postgres. Sem corretores de dados, sem publicidade baseada em perfil. Total conformidade com o LGPD e GDPR.",
      },
      {
        q: "Isso é um dispositivo médico?",
        a:
          "Não. FitMesh Sync é um app de fitness e bem-estar. NÃO substitui um médico nem detecta doenças. Em caso de dúvidas sobre sua saúde, consulte sempre seu médico.",
      },
      {
        q: "Quantas pessoas posso convidar?",
        a:
          "Plano gratuito: 3 no total (incluindo você). Pro (€3,99 Android · €4,99 iPhone): até 8 membros.",
      },
    ],
    final_cta_h2: "Comece hoje: 3 minutos para criar seu primeiro grupo",
    final_cta_body:
      "Baixe o FitMesh na Play Store, crie o grupo familiar e compartilhe o link com quem quiser. Funciona imediatamente, mesmo que seus familiares não abram o app por dias.",
  },
  fr: {
    hero_kicker: "Mesh Famille",
    hero_h1: "Voyez si vos proches vont bien, sans leur demander chaque jour",
    hero_sub:
      "Vous créez un groupe, invitez qui vous voulez (parents, partenaire, enfants) et voyez dans un seul tableau de bord qui a marché aujourd'hui, qui a mal dormi, dont la fréquence cardiaque a augmenté. La confidentialité d'abord: chacun choisit ce qu'il partage.",
    cta_primary: "Téléchargez l'app",
    cta_secondary: "Comment ça marche",
    why_kicker: "Pourquoi c'est utile",
    why_h2: "Trois façons de rester proches de ceux qui comptent",
    why_items: [
      {
        title: "Parents âgés autonomes",
        body:
          "Votre mère vit seule et porte la Galaxy Watch que vous lui avez offerte. Vous ne voulez pas être intrusif, mais vous aimeriez savoir si elle a arrêté de marcher ou si sa fréquence cardiaque au repos change. Mesh Famille vous le dit sans qu'elle ait besoin d'ouvrir une application ou de vous envoyer un message.",
      },
      {
        title: "Famille avec des adolescents",
        body:
          "Votre enfant a un Mi Band. Vous voulez qu'il bouge, dorme suffisamment et ne surcharge pas son coeur à l'entraînement. Consultez ses données de santé dans votre app: pas de réseaux sociaux, pas de chats, juste des chiffres.",
      },
      {
        title: "Partenaires et conjoints",
        body:
          "Vous travaillez à des endroits différents et vous vous retrouvez le soir. Savoir qu'elle a atteint ses 8 000 pas ou qu'il a bien dormi est une petite façon de prendre soin l'un de l'autre à distance.",
      },
    ],
    how_kicker: "Comment ça marche",
    how_h2: "Trois étapes, deux minutes",
    how_steps: [
      {
        title: "Créez le groupe familial",
        body:
          "Dans l'app FitMesh, touchez 'Mesh Famille' → 'Créer un groupe'. Donnez-lui un nom (par exemple, 'Famille Martin'). Vous êtes l'administrateur.",
      },
      {
        title: "Invitez qui vous voulez via un lien",
        body:
          "L'app génère un code MESH-XXXX et un lien partageable (WhatsApp, SMS, e-mail). Celui qui clique télécharge l'app gratuitement et rejoint le groupe. Jusqu'à 3 membres gratuits, 8 avec FitMesh Pro.",
      },
      {
        title: "Chacun choisit ce qu'il partage",
        body:
          "Partagé par défaut: pas, sommeil, fréquence cardiaque au repos, niveau d'activité. NON partagé par défaut: poids, tension artérielle, cycle menstruel, glycémie, localisation. Modifiable à tout moment depuis l'app.",
      },
    ],
    privacy_kicker: "Confidentialité et contrôle",
    privacy_h2: "Ce que vous voyez et ce que vous ne verrez JAMAIS",
    privacy_columns: [
      {
        title: "Ce que l'administrateur du groupe voit",
        items: [
          "Le nom que le membre a choisi (par exemple, 'Maman', 'Luca')",
          "Nombre de pas quotidien",
          "Heures totales de sommeil",
          "Fréquence cardiaque moyenne et au repos",
          "Niveau d'activité générique (faible/moyen/élevé)",
        ],
        color: "brand-aqua",
      },
      {
        title: "Ce qui n'est JAMAIS visible",
        items: [
          "Localisation géographique des membres",
          "Poids et composition corporelle",
          "Cycle menstruel",
          "Tension artérielle, glycémie et données de santé sensibles",
          "Notifications, messages et contacts du téléphone",
        ],
        color: "brand-green",
      },
    ],
    techstack_h2: "Compatible avec tous les appareils connectés que vous possédez déjà",
    techstack_body:
      "Galaxy Watch, Mi Band, Pixel Watch, Garmin, Fitbit, Polar, Withings, Honor, Huawei. Si l'un d'entre vous possède un appareil différent, il lui suffit d'écrire les données sur Health Connect (toutes les grandes marques le font depuis 2024). Aucun engagement envers une marque.",
    pricing_kicker: "Combien ça coûte",
    pricing_h2: "Gratuit jusqu'à 3 membres",
    pricing_body:
      "Le plan gratuit couvre vous plus 2 membres de la famille (3 au total). Avec FitMesh Pro (achat unique: 3,99 € sur Android · 4,99 € sur iPhone) vous débloquez jusqu'à 8 membres, un historique étendu et la priorité de synchronisation. Sans abonnement, sans essais expirés, sans carte de crédit requise.",
    faq_kicker: "Questions fréquentes",
    faq_h2: "Questions et réponses",
    faqs: [
      {
        q: "Ma mère/mon père n'est pas à l'aise avec la technologie. Peut-il ou elle l'utiliser?",
        a:
          "Oui. Une fois l'app installée et le lien d'invitation que vous envoyez touché, il n'y a rien d'autre à faire. L'app synchronise automatiquement en arrière-plan. Vous voyez ses données dans votre app. Il ou elle n'a plus jamais besoin de l'ouvrir.",
      },
      {
        q: "Puis-je voir la localisation des membres de la famille?",
        a:
          "Non, jamais. FitMesh Sync ne collecte ni ne partage de données de localisation. Si vous avez besoin de cela, utilisez une application dédiée comme Google Family Link.",
      },
      {
        q: "Que se passe-t-il si un membre veut quitter le groupe?",
        a:
          "Depuis son téléphone: Mesh Famille → Paramètres du groupe → Quitter le groupe. Ses données historiques sont supprimées de la vue des autres membres immédiatement. Aucune approbation de l'administrateur n'est requise.",
      },
      {
        q: "Les données de santé de ma famille sont-elles en sécurité?",
        a:
          "Oui. Tout est chiffré via HTTPS/TLS. Stockage sur Supabase EU (Francfort). Accès limité au groupe spécifique via Row-Level Security dans Postgres. Aucun courtier de données, aucune publicité profilée. Conformité totale au RGPD.",
      },
      {
        q: "Est-ce un dispositif médical?",
        a:
          "Non. FitMesh Sync est une application de fitness et de bien-être. Elle ne remplace PAS un médecin et ne pose pas de diagnostics. Pour toute question de santé, consultez toujours votre médecin.",
      },
      {
        q: "Combien de personnes puis-je inviter?",
        a:
          "Plan gratuit: 3 au total (vous inclus). Pro (3,99 € Android · 4,99 € iPhone): jusqu'à 8 membres.",
      },
    ],
    final_cta_h2: "Commencez aujourd'hui: 3 minutes pour créer votre premier groupe",
    final_cta_body:
      "Téléchargez FitMesh depuis le Play Store, créez le groupe familial et partagez le lien avec qui vous voulez. Ça fonctionne immédiatement, même si vos proches n'ouvrent pas l'app pendant des jours.",
  },
} as const;

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!locales.includes(locale as Locale)) return {};
  const lc = locale as Locale;

  const title = COMING_SOON
    ? (lc === "it"
        ? "Mesh Famiglia — In arrivo | FitMesh Sync"
        : lc === "es"
        ? "Mesh Familia — Próximamente | FitMesh Sync"
        : lc === "de"
        ? "Mesh Familie — Demnächst verfügbar | FitMesh Sync"
        : lc === "pt"
        ? "Mesh Família — Em breve | FitMesh Sync"
        : lc === "fr"
        ? "Mesh Famille — Bientôt disponible | FitMesh Sync"
        : "Family Mesh — Coming soon | FitMesh Sync")
    : (lc === "it"
        ? "Mesh Famiglia — Monitora la salute dei tuoi cari | FitMesh Sync"
        : lc === "es"
        ? "Mesh Familia — Controla la salud de tus seres queridos | FitMesh Sync"
        : lc === "de"
        ? "Mesh Familie — Überwache die Gesundheit deiner Liebsten | FitMesh Sync"
        : lc === "pt"
        ? "Mesh Família — Acompanhe a saúde de quem você ama | FitMesh Sync"
        : lc === "fr"
        ? "Mesh Famille — Suivez la santé de vos proches | FitMesh Sync"
        : "Family Mesh — Monitor your loved ones' health | FitMesh Sync");
  const description = COMING_SOON
    ? (lc === "it"
        ? "Mesh Famiglia: monitora passi, sonno e battito dei tuoi cari in un'unica dashboard privacy-first. Feature in arrivo nei prossimi mesi: iscriviti alla waitlist per essere avvisato al lancio."
        : lc === "es"
        ? "Mesh Familia: controla pasos, sueño y frecuencia cardíaca de tus seres queridos en un panel privado. Próximamente: únete a la lista de espera para recibir aviso en el lanzamiento."
        : lc === "de"
        ? "Mesh Familie: Schritte, Schlaf und Herzfrequenz deiner Liebsten in einem datenschutzfreundlichen Dashboard. Demnächst verfügbar: Trage dich in die Warteliste ein und erhalte eine Benachrichtigung zum Launch."
        : lc === "pt"
        ? "Mesh Família: acompanhe passos, sono e frequência cardíaca de quem você ama em um painel com privacidade em primeiro lugar. Em breve: entre na lista de espera para ser avisado no lançamento."
        : lc === "fr"
        ? "Mesh Famille: suivez les pas, le sommeil et la fréquence cardiaque de vos proches dans un tableau de bord axé sur la confidentialité. Bientôt disponible: rejoignez la liste d'attente pour être informé au lancement."
        : "Family Mesh: monitor steps, sleep and heart rate of your loved ones in one privacy-first dashboard. Coming in the next months: join the waitlist to be notified at launch.")
    : (lc === "it"
        ? "Mesh Famiglia ti permette di vedere passi, sonno e battito di genitori, partner o figli in un'unica dashboard. Privacy-first, gratis fino a 3 membri, niente posizione condivisa."
        : lc === "es"
        ? "Mesh Familia te permite ver pasos, sueño y frecuencia cardíaca de padres, pareja o hijos en un solo panel. Privacidad primero, gratis hasta 3 miembros, sin ubicación compartida."
        : lc === "de"
        ? "Mesh Familie zeigt dir Schritte, Schlaf und Herzfrequenz von Eltern, Partner oder Kindern in einem Dashboard. Datenschutz an erster Stelle, kostenlos für bis zu 3 Mitglieder, kein Standort geteilt."
        : lc === "pt"
        ? "Mesh Família permite ver passos, sono e frequência cardíaca de pais, parceiro ou filhos em um único painel. Privacidade em primeiro lugar, grátis para até 3 membros, sem compartilhamento de localização."
        : lc === "fr"
        ? "Mesh Famille vous permet de voir les pas, le sommeil et la fréquence cardiaque de parents, partenaire ou enfants dans un tableau de bord. Confidentialité d'abord, gratuit pour 3 membres, sans localisation partagée."
        : "Family Mesh lets you see steps, sleep, and heart rate of parents, partners or kids in one dashboard. Privacy-first, free up to 3 members, no location sharing.");

  return {
    title,
    description,
    alternates: {
      canonical: `${SITE_URL}/${lc}/famiglia`,
      languages: {
        it: `${SITE_URL}/it/famiglia`,
        en: `${SITE_URL}/en/famiglia`,
        es: `${SITE_URL}/es/famiglia`,
        "x-default": `${SITE_URL}/it/famiglia`,
      },
    },
    openGraph: {
      type: "website",
      url: `${SITE_URL}/${lc}/famiglia`,
      siteName: "FitMesh Sync",
      title,
      description,
      locale: ogLocale[lc],
    },
  };
}

export default async function FamigliaLanding({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!locales.includes(locale as Locale)) notFound();
  const lc = locale as Locale;
  const path = `/${lc}/famiglia`;
  const crumbName =
    lc === "it" ? "Mesh Famiglia"
    : lc === "es" ? "Mesh Familia"
    : lc === "de" ? "Mesh Familie"
    : lc === "pt" ? "Mesh Família"
    : lc === "fr" ? "Mesh Famille"
    : "Family Mesh";

  // JSON-LD WebPage — usato in entrambi gli stati (full + coming-soon).
  const webPageLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "@id": `${SITE_URL}${path}#webpage`,
    url: `${SITE_URL}${path}`,
    name: lc === "it"
      ? "Mesh Famiglia — Monitora la salute dei tuoi cari"
      : lc === "es"
      ? "Mesh Familia — Controla la salud de tus seres queridos"
      : "Family Mesh — Monitor your loved ones' health",
    description: lc === "it"
      ? "Crea un gruppo famiglia, invita genitori/partner/figli, vedi passi/sonno/battito di ognuno in una dashboard. Privacy-first."
      : lc === "es"
      ? "Crea un grupo familiar, invita a padres/pareja/hijos, ve pasos/sueño/frecuencia cardíaca de cada uno en un panel. Privacidad primero."
      : "Create a family group, invite parents/partner/kids, see steps/sleep/heart rate of each in one dashboard. Privacy-first.",
    inLanguage: lc === "it" ? "it-IT" : lc === "es" ? "es-ES" : "en-US",
    isPartOf: { "@id": `${SITE_URL}#website` },
    about: { "@id": `${SITE_URL}#mobile-app` },
  };

  if (COMING_SOON) {
    return <ComingSoonState lc={lc} crumbName={crumbName} path={path} webPageLd={webPageLd} />;
  }

  const t = COPY[lc];
  const faqLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: t.faqs.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };

  return (
    <article className="relative">
      <JsonLd data={webPageLd} />
      <JsonLd data={faqLd} />
      <Breadcrumbs items={[{ name: crumbName, path }]} locale={lc} />

      {/* HERO */}
      <section className="relative max-w-5xl mx-auto px-4 sm:px-6 pt-12 pb-16 sm:pt-20 sm:pb-24 text-center">
        <p className="text-[10px] uppercase tracking-[0.24em] text-brand-aqua font-semibold">
          {t.hero_kicker}
        </p>
        <h1 className="mt-4 font-display text-display-lg sm:text-display-xl font-semibold tracking-tightest text-text-primary text-balance">
          {t.hero_h1}
        </h1>
        <p className="mt-6 text-lg sm:text-xl text-text-secondary max-w-2xl mx-auto leading-relaxed">
          {t.hero_sub}
        </p>
        <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
          <StoreButtonsRow locale={lc} />
          <a
            href="#how"
            className="inline-flex items-center gap-2 px-5 py-3 rounded-pill btn-ghost text-sm"
          >
            {t.cta_secondary} <span aria-hidden>↓</span>
          </a>
        </div>
      </section>

      {/* WHY (3 personas) */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 pt-8 pb-16">
        <p className="text-center text-[10px] uppercase tracking-[0.22em] text-brand-aqua font-semibold">
          {t.why_kicker}
        </p>
        <h2 className="mt-3 text-center font-display text-3xl sm:text-4xl font-semibold tracking-tight text-text-primary">
          {t.why_h2}
        </h2>
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {t.why_items.map((it) => (
            <div
              key={it.title}
              className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-7"
            >
              <h3 className="font-display text-xl font-semibold text-text-primary">
                {it.title}
              </h3>
              <p className="mt-4 text-text-secondary leading-relaxed">{it.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* HOW (3 steps) */}
      <section id="how" className="max-w-5xl mx-auto px-4 sm:px-6 pt-16 pb-16">
        <p className="text-center text-[10px] uppercase tracking-[0.22em] text-brand-aqua font-semibold">
          {t.how_kicker}
        </p>
        <h2 className="mt-3 text-center font-display text-3xl sm:text-4xl font-semibold tracking-tight text-text-primary">
          {t.how_h2}
        </h2>
        <ol className="mt-12 space-y-6">
          {t.how_steps.map((s, i) => (
            <li
              key={s.title}
              className="flex gap-5 items-start rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6 sm:p-7"
            >
              <span className="shrink-0 w-10 h-10 rounded-full bg-brand-aqua/15 border border-brand-aqua/30 flex items-center justify-center font-display font-bold text-brand-aqua">
                {i + 1}
              </span>
              <div>
                <h3 className="font-display text-xl font-semibold text-text-primary">
                  {s.title}
                </h3>
                <p className="mt-2 text-text-secondary leading-relaxed">{s.body}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      {/* PRIVACY 2-column */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 pt-16 pb-16">
        <p className="text-center text-[10px] uppercase tracking-[0.22em] text-brand-aqua font-semibold">
          {t.privacy_kicker}
        </p>
        <h2 className="mt-3 text-center font-display text-3xl sm:text-4xl font-semibold tracking-tight text-text-primary">
          {t.privacy_h2}
        </h2>
        <div className="mt-12 grid gap-6 md:grid-cols-2">
          {t.privacy_columns.map((col) => (
            <div
              key={col.title}
              className={`rounded-2xl border bg-white/[0.02] p-7 ${
                col.color === "brand-aqua"
                  ? "border-brand-aqua/30"
                  : "border-brand-green/30"
              }`}
            >
              <h3
                className={`font-display text-lg font-bold ${
                  col.color === "brand-aqua" ? "text-brand-aqua" : "text-brand-green"
                }`}
              >
                {col.title}
              </h3>
              <ul className="mt-5 space-y-2.5 text-text-secondary">
                {col.items.map((item) => (
                  <li key={item} className="flex gap-2.5">
                    <span
                      aria-hidden
                      className={`mt-1.5 inline-block h-1.5 w-1.5 rounded-full shrink-0 ${
                        col.color === "brand-aqua"
                          ? "bg-brand-aqua"
                          : "bg-brand-green"
                      }`}
                    />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* TECH STACK */}
      <section className="max-w-3xl mx-auto px-4 sm:px-6 pt-12 pb-16 text-center">
        <h2 className="font-display text-2xl sm:text-3xl font-semibold tracking-tight text-text-primary">
          {t.techstack_h2}
        </h2>
        <p className="mt-5 text-text-secondary leading-relaxed">{t.techstack_body}</p>
        <Link
          href={`/${lc}/integrations`}
          className="mt-6 inline-flex items-center gap-1.5 text-brand-aqua hover:text-brand-green transition text-sm font-medium"
        >
          {lc === "it" ? "Vedi tutti i wearable supportati"
            : lc === "es" ? "Ver todos los wearables compatibles"
            : lc === "de" ? "Alle unterstützten Wearables ansehen"
            : lc === "pt" ? "Ver todos os wearables compatíveis"
            : lc === "fr" ? "Voir tous les appareils connectés compatibles"
            : "See all supported wearables"}
          <span aria-hidden>→</span>
        </Link>
      </section>

      {/* PRICING */}
      <section className="max-w-3xl mx-auto px-4 sm:px-6 pt-12 pb-16 text-center">
        <p className="text-[10px] uppercase tracking-[0.22em] text-brand-aqua font-semibold">
          {t.pricing_kicker}
        </p>
        <h2 className="mt-3 font-display text-3xl sm:text-4xl font-semibold tracking-tight text-text-primary">
          {t.pricing_h2}
        </h2>
        <p className="mt-5 text-text-secondary leading-relaxed">{t.pricing_body}</p>
      </section>

      {/* Trust badges (E-E-A-T per topic YMYL salute familiare). */}
      <section className="max-w-3xl mx-auto px-4 sm:px-6 pb-8">
        <TrustBadges locale={lc === "it" ? "it" : "en"} />
      </section>

      {/* FAQ */}
      <section className="max-w-3xl mx-auto px-4 sm:px-6 pt-12 pb-16">
        <p className="text-center text-[10px] uppercase tracking-[0.22em] text-brand-aqua font-semibold">
          {t.faq_kicker}
        </p>
        <h2 className="mt-3 text-center font-display text-3xl sm:text-4xl font-semibold tracking-tight text-text-primary">
          {t.faq_h2}
        </h2>
        <dl className="mt-10 space-y-4">
          {t.faqs.map((f) => (
            <details
              key={f.q}
              className="group rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5 sm:p-6 transition-colors hover:border-brand-aqua/30"
            >
              <summary className="cursor-pointer list-none font-display font-semibold text-text-primary flex items-start gap-3">
                <span className="flex-1">{f.q}</span>
                <span
                  aria-hidden
                  className="shrink-0 mt-1 text-brand-aqua transition-transform group-open:rotate-45"
                >
                  +
                </span>
              </summary>
              <p className="mt-4 text-text-secondary leading-relaxed">{f.a}</p>
            </details>
          ))}
        </dl>
      </section>

      {/* FINAL CTA */}
      <section className="max-w-3xl mx-auto px-4 sm:px-6 pt-12 pb-24 text-center">
        <h2 className="font-display text-3xl sm:text-4xl font-semibold tracking-tight text-text-primary">
          {t.final_cta_h2}
        </h2>
        <p className="mt-5 text-text-secondary leading-relaxed">{t.final_cta_body}</p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <StoreButtonsRow locale={lc} />
        </div>
        <p className="mt-5 text-xs text-text-muted">
          {lc === "it"
            ? "Niente carta di credito · 3 membri gratis a vita"
            : lc === "es"
            ? "Sin tarjeta de crédito · 3 miembros gratis de por vida"
            : "No credit card · 3 members free forever"}
        </p>
        <p className="mt-3 text-xs text-text-muted">
          <a href={PLAY_URL} target="_blank" rel="noopener" className="underline hover:text-text-secondary">
            {lc === "it" ? "Anteprima su Play Store" : lc === "es" ? "Vista previa en Play Store" : "Preview on Play Store"}
          </a>
        </p>
      </section>
    </article>
  );
}

/**
 * Stato "in arrivo" della landing /famiglia. Mostrato quando COMING_SOON=true.
 * URL stabile per SEO (no redirect, no 404), preserva canonical e WebPage
 * JSON-LD. CTA → /[locale]/beta come waitlist proxy.
 */
function ComingSoonState({
  lc,
  crumbName,
  path,
  webPageLd,
}: {
  lc: Locale;
  crumbName: string;
  path: string;
  webPageLd: Record<string, unknown>;
}) {
  const copy = lc === "it"
    ? {
        kicker: "Mesh Famiglia",
        h1: "In arrivo: monitora la salute dei tuoi cari, privacy-first",
        sub: "Stiamo finendo Mesh Famiglia: una dashboard per vedere passi, sonno e battito di genitori, partner o figli, senza posizione condivisa, senza ads. Aprirà quando FitMesh Sync sarà disponibile su entrambi gli store (Android + iOS). Iscriviti alla waitlist per essere avvisato al lancio.",
        cta: "Iscriviti alla waitlist",
        secondary: "Nel frattempo: scarica FitMesh Sync su Android",
        why_h2: "Perché serve",
        why_items: [
          {
            title: "Genitori anziani autonomi",
            body: "Vorresti sapere se tuo padre o tua madre ha camminato oggi, se ha dormito bene, se la frequenza cardiaca è stabile, senza chiedere ogni giorno e senza app invasive.",
          },
          {
            title: "Privacy by design",
            body: "Niente posizione GPS condivisa, niente broker dati, niente profilazione ads. Dati cifrati, server in Europa (Francoforte), GDPR-compliant.",
          },
          {
            title: "Multi-vendor, niente lock-in",
            body: "Galaxy Watch, Pixel Watch, Garmin, Fitbit, Polar, Oura: qualsiasi wearable supportato da Health Connect (Android) o HealthKit (iOS, in arrivo).",
          },
        ],
        availability_h2: "Quando arriva",
        availability_body: "Mesh Famiglia richiede l'app pubblicata su entrambi gli store per funzionare end-to-end (il familiare che inviti deve poter installare da Play Store o App Store). Android è già live in beta; iOS è in sviluppo. Rilascio Mesh Famiglia previsto quando entrambe le piattaforme sono in produzione.",
      }
    : lc === "es"
    ? {
        kicker: "Mesh Familia",
        h1: "Próximamente: controla la salud de tus seres queridos, con privacidad primero",
        sub: "Estamos terminando Mesh Familia: un panel para ver pasos, sueño y frecuencia cardíaca de padres, pareja o hijos, sin ubicación compartida y sin publicidad. Se lanzará cuando FitMesh Sync esté disponible en ambas tiendas (Android + iOS). Únete a la lista de espera para recibir aviso en el lanzamiento.",
        cta: "Únete a la lista de espera",
        secondary: "Mientras tanto: descarga FitMesh Sync en Android",
        why_h2: "Por qué lo necesitas",
        why_items: [
          {
            title: "Personas mayores independientes",
            body: "Te gustaría saber si tu padre o tu madre caminó hoy, si durmió bien, si su frecuencia cardíaca en reposo es estable, sin preguntarlo cada día y sin apps invasivas.",
          },
          {
            title: "Privacidad por diseño",
            body: "Sin ubicación GPS compartida, sin intermediarios de datos, sin publicidad basada en perfiles. Datos cifrados, servidores en Europa (Fráncfort), cumple el RGPD.",
          },
          {
            title: "Multi-dispositivo, sin ataduras",
            body: "Galaxy Watch, Pixel Watch, Garmin, Fitbit, Polar, Oura: cualquier wearable compatible con Health Connect (Android) o HealthKit (iOS, próximamente).",
          },
        ],
        availability_h2: "Cuándo llega",
        availability_body: "Mesh Familia requiere que la app esté publicada en ambas tiendas para funcionar de extremo a extremo (el familiar que invites debe poder instalarla desde Play Store o App Store). Android ya está disponible en beta; iOS está en desarrollo. El lanzamiento de Mesh Familia está previsto cuando ambas plataformas estén en producción.",
      }
    : {
        kicker: "Family Mesh",
        h1: "Coming soon: monitor your loved ones' health, privacy-first",
        sub: "We're finishing Family Mesh: a dashboard to see steps, sleep, and heart rate of parents, partners, or kids, with no location sharing and no ads. It will launch once FitMesh Sync is available on both stores (Android + iOS). Join the waitlist to be notified at launch.",
        cta: "Join the waitlist",
        secondary: "Meanwhile: download FitMesh Sync on Android",
        why_h2: "Why it matters",
        why_items: [
          {
            title: "Independent elderly parents",
            body: "You'd like to know if your father or mother walked today, slept well, has a stable resting heart rate, without asking every day and without invasive apps.",
          },
          {
            title: "Privacy by design",
            body: "No GPS location sharing, no data brokers, no ad profiling. Data encrypted, servers in Europe (Frankfurt), GDPR-compliant.",
          },
          {
            title: "Multi-vendor, no lock-in",
            body: "Galaxy Watch, Pixel Watch, Garmin, Fitbit, Polar, Oura: any wearable supported by Health Connect (Android) or HealthKit (iOS, coming).",
          },
        ],
        availability_h2: "When it arrives",
        availability_body: "Family Mesh requires the app published on both stores to work end-to-end (the family member you invite must be able to install from Play Store or App Store). Android is already live in beta; iOS is in development. Family Mesh release planned once both platforms are in production.",
      };

  return (
    <article className="relative">
      <JsonLd data={webPageLd} />
      <Breadcrumbs items={[{ name: crumbName, path }]} locale={lc} />

      <section className="relative max-w-3xl mx-auto px-4 sm:px-6 pt-12 pb-16 sm:pt-20 sm:pb-20 text-center">
        <p className="text-[10px] uppercase tracking-[0.24em] text-brand-aqua font-semibold">
          {copy.kicker} · {lc === "it" ? "In arrivo" : lc === "es" ? "Próximamente" : "Coming soon"}
        </p>
        <h1 className="mt-4 font-display text-display-lg sm:text-display-xl font-semibold tracking-tightest text-text-primary text-balance">
          {copy.h1}
        </h1>
        <p className="mt-6 text-base sm:text-lg text-text-secondary leading-relaxed text-balance">
          {copy.sub}
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link
            href={`/${lc}/beta`}
            className="inline-flex items-center justify-center rounded-full bg-brand-aqua text-bg-base px-6 py-3 text-sm font-semibold hover:bg-brand-aqua/90 transition"
          >
            {copy.cta}
          </Link>
          <a
            href={PLAY_URL}
            target="_blank"
            rel="noopener"
            className="inline-flex items-center justify-center rounded-full border border-text-muted/30 text-text-primary px-6 py-3 text-sm hover:bg-text-muted/10 transition"
          >
            {copy.secondary}
          </a>
        </div>
        <div className="mt-8">
          <TrustBadges locale={lc === "it" ? "it" : "en"} variant="compact" />
        </div>
      </section>

      <section className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
        <h2 className="font-display text-2xl sm:text-3xl font-semibold tracking-tight text-text-primary text-center">
          {copy.why_h2}
        </h2>
        <div className="mt-8 grid sm:grid-cols-3 gap-6">
          {copy.why_items.map((item) => (
            <div key={item.title} className="rounded-2xl border border-text-muted/15 bg-bg-elevated/40 p-5">
              <h3 className="font-display text-lg font-semibold text-text-primary">{item.title}</h3>
              <p className="mt-2 text-sm text-text-secondary leading-relaxed">{item.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="max-w-3xl mx-auto px-4 sm:px-6 py-12 text-center">
        <h2 className="font-display text-2xl sm:text-3xl font-semibold tracking-tight text-text-primary">
          {copy.availability_h2}
        </h2>
        <p className="mt-5 text-text-secondary leading-relaxed">{copy.availability_body}</p>
        <div className="mt-8">
          <Link
            href={`/${lc}/beta`}
            className="inline-flex items-center justify-center rounded-full bg-brand-aqua text-bg-base px-6 py-3 text-sm font-semibold hover:bg-brand-aqua/90 transition"
          >
            {copy.cta}
          </Link>
        </div>
      </section>
    </article>
  );
}
