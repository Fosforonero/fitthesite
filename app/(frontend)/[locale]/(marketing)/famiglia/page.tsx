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
import { isLocaleInCopy } from "@/lib/content/page-copy-gate";
import { SITE_URL } from "@/lib/product-facts";
import { schemaLanguage } from "@/lib/seo/schema-language";
import { getFamigliaComingSoon } from "@/lib/content/famiglia-coming-soon";

const PLAY_URL = "https://play.google.com/store/apps/details?id=com.fitmeshsync.app";

/**
 * Mesh Famiglia feature temporaneamente sospesa lato app (FeatureFlags
 * meshFamigliaEnabled=false). L'app è ormai live sia su Android (Play
 * Store, worldwide) sia su iOS (App Store, disponibile in tutti gli store
 * supportati, incluse tutte le storefront dell'Unione Europea) — la
 * sospensione non dipende più dalla disponibilità sugli store. Quando la feature lato app sarà pronta:
 * flip `COMING_SOON` a `false` per riattivare la landing piena.
 *
 * Mantenuto l'URL stabile per SEO (Google ha già indicizzato) ma il body
 * mostra uno stato "in arrivo" con CTA che rimanda al download dell'app
 * (/it#download): /beta non è più una pagina di iscrizione (è l'archivio
 * storico del programma Founder, chiuso), quindi non va più usata come CTA.
 */
const COMING_SOON = true;

const COPY = {
  it: {
    hero_kicker: "Mesh Famiglia",
    hero_h1: "La salute di tutta la famiglia, in un'unica dashboard",
    hero_sub:
      "Crei un gruppo, inviti chi vuoi (genitori, partner, figli), e ognuno condivide con gli altri passi, sonno e frequenza cardiaca in un'unica dashboard. La funzione è progettata per offrire una vista condivisa di alcune metriche del gruppo.",
    cta_primary: "Scarica l'app",
    cta_secondary: "Come funziona",
    why_kicker: "Perchè serve",
    why_h2: "Tre situazioni, la stessa dashboard",
    why_items: [
      {
        title: "Genitori e figli adulti",
        body:
          "Vivete in case diverse ma vi tenete aggiornati a vicenda: chi ha camminato oggi, chi ha dormito bene. Ognuno condivide i propri dati con gli altri, senza dover chiedere o scrivere messaggi ogni giorno.",
      },
      {
        title: "Famiglia con figli adolescenti",
        body:
          "Tuo figlio ha la Mi Band, tu il Galaxy Watch. Vedete a vicenda passi, sonno e frequenza cardiaca nella stessa app: niente social, niente chat, solo numeri condivisi tra voi.",
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
          "L'app genera un codice MESH-XXXX e un link condivisibile (WhatsApp, SMS, email). Chi clicca scarica l'app e si unisce. La Mesh Famiglia arriva fino a 8 membri con FitMesh Pro: ognuno prova tutto gratis per 14 giorni, poi attiva il Pro.",
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
        title: "Cosa vedono gli altri membri",
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
    techstack_h2: "Funziona con i wearable compatibili che già avete",
    techstack_body:
      "Galaxy Watch, Mi Band, Pixel Watch, Garmin, Fitbit, Polar, Withings. Se uno di voi ha un dispositivo diverso, basta che sincronizzi i dati con Health Connect o Apple Salute. Niente acquisto vincolato a un marchio.",
    pricing_kicker: "Quanto costa",
    pricing_h2: "Mesh Famiglia fino a 8 membri con Pro",
    pricing_body:
      "La Mesh Famiglia e' una funzione di FitMesh Pro: arriva fino a 8 membri, con storico esteso e priorita' sync. Ogni persona prova tutte le funzioni gratis per 14 giorni (anche chi si unisce alla Mesh); poi attiva FitMesh Pro a vita (acquisto unico: €3,99 su Android · €4,99 su iPhone, prezzo di lancio) oppure l'abbonamento a €1,19 ogni 6 mesi.",
    faq_kicker: "Domande comuni",
    faq_h2: "Dubbi e risposte",
    faqs: [
      {
        q: "Un familiare non e' molto pratico di tecnologia. Riesce a usarla?",
        a:
          "Sì. Una volta installata l'app e cliccato il link di invito che gli mandi, la configurazione iniziale è completata e il resto della famiglia vede i dati condivisi nella propria app. La sincronizzazione dipende dai permessi e dalle regole in background del telefono. In alcuni casi può essere necessario riaprire FitMesh.",
      },
      {
        q: "Mesh Famiglia mostra la posizione degli altri membri?",
        a:
          "Mesh Famiglia non è attualmente disponibile. Nel progetto attuale, la vista del gruppo non include la posizione geografica degli altri membri.",
      },
      {
        q: "Cosa succede se un membro vuole uscire dal gruppo?",
        a:
          "Dal suo telefono: Mesh Famiglia → Impostazioni gruppo → Lascia gruppo. I suoi dati storici vengono rimossi dalla vista degli altri immediatamente. Nessuna autorizzazione admin richiesta.",
      },
      {
        q: "I dati salute dei miei familiari sono al sicuro?",
        a:
          "La connessione al servizio usa HTTPS/TLS. Per informazioni sul trattamento dei dati consulta la Privacy Policy.",
      },
      {
        q: "E' un dispositivo medico?",
        a:
          "No. FitMesh Sync e' un'app fitness/wellness. NON sostituisce un medico ne' diagnostica patologie. Per dubbi clinici, consulta sempre il tuo medico di base.",
      },
      {
        q: "Quante persone posso invitare?",
        a:
          "La Mesh Famiglia arriva fino a 8 membri (incluso te) con FitMesh Pro. Ognuno prova tutto gratis per 14 giorni, poi attiva il Pro: a vita (€3,99 Android · €4,99 iPhone) oppure €1,19 ogni 6 mesi.",
      },
    ],
    final_cta_h2: "Inizia oggi: 3 minuti per creare il primo gruppo",
    final_cta_body:
      "Scarica FitMesh dal Play Store, crea il gruppo famiglia, condividi il link con chi vuoi. Funziona subito, anche se i tuoi familiari non aprono l'app per giorni.",
  },
  en: {
    hero_kicker: "Family Mesh",
    hero_h1: "Your whole family's health, in one dashboard",
    hero_sub:
      "Create a group, invite anyone (parents, partner, kids), and everyone shares steps, sleep and heart rate with each other in one dashboard. The feature is designed to provide a shared view of some group metrics.",
    cta_primary: "Get the app",
    cta_secondary: "How it works",
    why_kicker: "Why it matters",
    why_h2: "Three situations, the same dashboard",
    why_items: [
      {
        title: "Parents and adult kids",
        body:
          "You live in different homes but keep each other in the loop: who walked today, who slept well. Everyone shares their own data with the others, without having to ask or text every day.",
      },
      {
        title: "Families with teenagers",
        body:
          "Your kid has a Mi Band, you have a Galaxy Watch. You see each other's steps, sleep and heart rate in the same app: no social, no chats, just numbers shared between you.",
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
          "The app generates a MESH-XXXX code and a shareable link (WhatsApp, SMS, email). Whoever clicks downloads the app and joins. Family Mesh holds up to 8 members with FitMesh Pro: everyone gets a 14-day free trial of all features, then activates Pro.",
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
        title: "What other members see",
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
    techstack_h2: "Works with compatible wearables you already own",
    techstack_body:
      "Galaxy Watch, Mi Band, Pixel Watch, Garmin, Fitbit, Polar, Withings. If someone uses a different device, it just needs to sync data with Health Connect or Apple Health. No brand lock-in.",
    pricing_kicker: "What it costs",
    pricing_h2: "Family Mesh up to 8 members with Pro",
    pricing_body:
      "Family Mesh is a FitMesh Pro feature: it holds up to 8 members, with extended history and sync priority. Everyone gets all features free for 14 days (including anyone who joins the Mesh); then they activate FitMesh Pro for life (one-time: €3.99 on Android · €4.99 on iPhone, launch price) or the subscription at €1.19 every 6 months.",
    faq_kicker: "Common questions",
    faq_h2: "FAQs",
    faqs: [
      {
        q: "A family member isn't very tech-savvy. Can they use it?",
        a:
          "Yes. Once the app is installed and they tap the invite link you send, initial setup is complete and the rest of the family sees shared data in their own app. Sync depends on phone permissions and background execution rules. In some cases, reopening FitMesh may be required.",
      },
      {
        q: "Does Family Mesh show the location of other members?",
        a:
          "Family Mesh is not currently available. In the current design, the group view does not include other members' geographic location.",
      },
      {
        q: "What if a member wants to leave the group?",
        a:
          "From their phone: Family Mesh → Group settings → Leave group. Their historical data is removed from other members' view immediately. No admin approval required.",
      },
      {
        q: "Are my family's health data safe?",
        a:
          "Connections to the service use HTTPS/TLS. For details on data handling, consult our Privacy Policy.",
      },
      {
        q: "Is this a medical device?",
        a:
          "No. FitMesh Sync is a fitness/wellness app. It does NOT replace a doctor or diagnose conditions. For any clinical concern, consult your family physician.",
      },
      {
        q: "How many people can I invite?",
        a:
          "Family Mesh holds up to 8 members (including you) with FitMesh Pro. Everyone gets all features free for 14 days, then activates Pro: for life (€3.99 Android · €4.99 iPhone) or €1.19 every 6 months.",
      },
    ],
    final_cta_h2: "Start today: 3 minutes to create your first group",
    final_cta_body:
      "Download FitMesh from Play Store, create the family group, share the link with anyone. It works immediately, even if your family members don't open the app for days.",
  },
  es: {
    hero_kicker: "Mesh Familia",
    hero_h1: "La salud de toda la familia, en un solo panel",
    hero_sub:
      "Creas un grupo, invitas a quien quieras (padres, pareja, hijos), y cada uno comparte con los demás pasos, sueño y frecuencia cardíaca en un solo panel. La función está pensada para ofrecer una vista compartida de algunas métricas del grupo.",
    cta_primary: "Descarga la app",
    cta_secondary: "Cómo funciona",
    why_kicker: "Por qué lo necesitas",
    why_h2: "Tres situaciones, el mismo panel",
    why_items: [
      {
        title: "Padres e hijos adultos",
        body:
          "Vivís en casas distintas pero os mantenéis al día: quién caminó hoy, quién durmió bien. Cada uno comparte sus propios datos con los demás, sin tener que preguntar ni escribir mensajes todos los días.",
      },
      {
        title: "Familia con hijos adolescentes",
        body:
          "Tu hijo tiene la Mi Band, tú el Galaxy Watch. Veis los pasos, el sueño y la frecuencia cardíaca del otro en la misma app: sin redes sociales, sin chats, solo números compartidos entre vosotros.",
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
          "La app genera un código MESH-XXXX y un enlace que puedes compartir (WhatsApp, SMS, correo). Quien lo toca descarga la app y se une. La Mesh Familia llega hasta 8 miembros con FitMesh Pro: cada persona prueba todas las funciones gratis durante 14 días y luego activa Pro.",
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
        title: "Qué ven los demás miembros",
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
    techstack_h2: "Compatible con los wearables que ya tienes",
    techstack_body:
      "Galaxy Watch, Mi Band, Pixel Watch, Garmin, Fitbit, Polar, Withings. Si alguien de la familia usa otro dispositivo, solo necesita sincronizar datos con Health Connect o Apple Health. Sin ataduras a ninguna marca.",
    pricing_kicker: "Cuánto cuesta",
    pricing_h2: "Mesh Familia hasta 8 miembros con Pro",
    pricing_body:
      "La Mesh Familia es una función de FitMesh Pro: llega hasta 8 miembros, con historial ampliado y sincronización prioritaria. Cada persona prueba todas las funciones gratis durante 14 días (también quien se une a la Mesh); luego activa FitMesh Pro de por vida (pago único: 3,99 € en Android · 4,99 € en iPhone, precio de lanzamiento) o la suscripción de 1,19 € cada 6 meses.",
    faq_kicker: "Preguntas frecuentes",
    faq_h2: "Dudas y respuestas",
    faqs: [
      {
        q: "Un familiar no es muy hábil con la tecnología. ¿Puede usarla?",
        a:
          "Sí. Una vez instalada la app y tocado el enlace de invitación que le envías, la configuración inicial queda lista y el resto de la familia ve los datos compartidos desde su propia app. La sincronización depende de los permisos y de las reglas de ejecución en segundo plano del teléfono. En algunos casos puede ser necesario volver a abrir FitMesh.",
      },
      {
        q: "¿Mesh Familia muestra la ubicación de los demás miembros?",
        a:
          "Mesh Familia no está disponible actualmente. En el diseño actual, la vista del grupo no incluye la ubicación geográfica de los demás miembros.",
      },
      {
        q: "¿Qué pasa si un miembro quiere salir del grupo?",
        a:
          "Desde su teléfono: Mesh Familia → Ajustes del grupo → Salir del grupo. Sus datos históricos se eliminan de la vista de los demás de forma inmediata. No se necesita autorización del administrador.",
      },
      {
        q: "¿Los datos de salud de mis familiares están seguros?",
        a:
          "La conexión con el servicio utiliza HTTPS/TLS. Para más información sobre el tratamiento de datos, consulta la Política de Privacidad.",
      },
      {
        q: "¿Es un dispositivo médico?",
        a:
          "No. FitMesh Sync es una app de fitness y bienestar. NO sustituye a un médico ni detecta enfermedades. Ante cualquier duda sobre tu salud, consulta siempre a tu médico.",
      },
      {
        q: "¿A cuántas personas puedo invitar?",
        a:
          "La Mesh Familia llega hasta 8 miembros (incluido tú) con FitMesh Pro. Cada persona prueba todo gratis durante 14 días y luego activa Pro: de por vida (3,99 € Android · 4,99 € iPhone) o 1,19 € cada 6 meses.",
      },
    ],
    final_cta_h2: "Empieza hoy: 3 minutos para crear tu primer grupo",
    final_cta_body:
      "Descarga FitMesh desde Play Store, crea el grupo familiar y comparte el enlace con quien quieras. Funciona de inmediato, aunque tus familiares no abran la app en días.",
  },
  de: {
    hero_kicker: "Mesh Familie",
    hero_h1: "Die Gesundheit der ganzen Familie, in einem Dashboard",
    hero_sub:
      "Du erstellst eine Gruppe, lädst ein, wen du möchtest (Eltern, Partner, Kinder), und jeder teilt Schritte, Schlaf und Herzfrequenz mit den anderen in einem Dashboard. Die Funktion ist darauf ausgelegt, eine gemeinsame Ansicht einiger Gruppenmetriken zu bieten.",
    cta_primary: "App herunterladen",
    cta_secondary: "So funktioniert es",
    why_kicker: "Warum es wichtig ist",
    why_h2: "Drei Situationen, dasselbe Dashboard",
    why_items: [
      {
        title: "Eltern und erwachsene Kinder",
        body:
          "Ihr lebt in unterschiedlichen Haushalten, haltet euch aber gegenseitig auf dem Laufenden: wer heute gelaufen ist, wer gut geschlafen hat. Jeder teilt seine eigenen Daten mit den anderen, ohne täglich nachfragen oder schreiben zu müssen.",
      },
      {
        title: "Familie mit Teenagern",
        body:
          "Dein Kind hat ein Mi Band, du eine Galaxy Watch. Ihr seht gegenseitig Schritte, Schlaf und Herzfrequenz in derselben App: kein Social Media, kein Chat, nur Zahlen, die ihr miteinander teilt.",
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
          "Die App generiert einen MESH-XXXX-Code und einen teilbaren Link (WhatsApp, SMS, E-Mail). Wer darauf tippt, lädt die App herunter und tritt bei. Die Mesh Familie umfasst bis zu 8 Mitglieder mit FitMesh Pro: Jede Person testet alle Funktionen 14 Tage lang kostenlos und aktiviert danach Pro.",
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
        title: "Was die anderen Mitglieder sehen",
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
    techstack_h2: "Funktioniert mit kompatiblen Wearables, die ihr bereits besitzt",
    techstack_body:
      "Galaxy Watch, Mi Band, Pixel Watch, Garmin, Fitbit, Polar, Withings. Falls jemand in der Familie ein anderes Gerät nutzt, muss es lediglich Daten an Health Connect oder Apple Health übertragen. Kein Markenzwang.",
    pricing_kicker: "Was es kostet",
    pricing_h2: "Mesh Familie bis zu 8 Mitglieder mit Pro",
    pricing_body:
      "Die Mesh Familie ist eine FitMesh-Pro-Funktion: Sie umfasst bis zu 8 Mitglieder, mit erweitertem Verlauf und Sync-Priorität. Jede Person testet alle Funktionen 14 Tage lang kostenlos (auch wer der Mesh beitritt); danach aktiviert sie FitMesh Pro auf Lebenszeit (Einmalkauf: 3,99 € auf Android · 4,99 € auf iPhone, Einführungspreis) oder das Abonnement für 1,19 € alle 6 Monate.",
    faq_kicker: "Häufige Fragen",
    faq_h2: "Fragen und Antworten",
    faqs: [
      {
        q: "Ein Familienmitglied ist nicht sehr technikaffin. Kann es die App trotzdem nutzen?",
        a:
          "Ja. Sobald die App installiert ist und die Person auf den Einladungslink tippt, den du sendest, ist die Ersteinrichtung abgeschlossen und der Rest der Familie sieht die geteilten Daten in der eigenen App. Die Synchronisierung hängt von den Berechtigungen und den Hintergrundregeln des Telefons ab. In manchen Fällen kann es erforderlich sein, FitMesh erneut zu öffnen.",
      },
      {
        q: "Zeigt Mesh Familie den Standort anderer Mitglieder?",
        a:
          "Mesh Familie ist derzeit nicht verfügbar. Im aktuellen Entwurf enthält die Gruppenansicht nicht den geografischen Standort anderer Mitglieder.",
      },
      {
        q: "Was passiert, wenn ein Mitglied die Gruppe verlassen möchte?",
        a:
          "Auf seinem Telefon: Mesh Familie → Gruppeneinstellungen → Gruppe verlassen. Seine historischen Daten werden sofort aus der Ansicht der anderen Mitglieder entfernt. Keine Admin-Genehmigung erforderlich.",
      },
      {
        q: "Sind die Gesundheitsdaten meiner Familie sicher?",
        a:
          "Die Verbindung zum Dienst verwendet HTTPS/TLS. Informationen zur Datenverarbeitung findest du in der Datenschutzerklärung.",
      },
      {
        q: "Ist dies ein Medizinprodukt?",
        a:
          "Nein. FitMesh Sync ist eine Fitness- und Wellness-App. Sie ersetzt KEINEN Arzt und stellt keine Diagnosen. Bei gesundheitlichen Fragen wende dich stets an deinen Hausarzt.",
      },
      {
        q: "Wie viele Personen kann ich einladen?",
        a:
          "Die Mesh Familie umfasst bis zu 8 Mitglieder (inkl. du) mit FitMesh Pro. Jede Person testet alles 14 Tage lang kostenlos und aktiviert danach Pro: auf Lebenszeit (3,99 € Android · 4,99 € iPhone) oder 1,19 € alle 6 Monate.",
      },
    ],
    final_cta_h2: "Starte heute: 3 Minuten bis zur ersten Gruppe",
    final_cta_body:
      "Lade FitMesh aus dem Play Store herunter, erstelle die Familiengruppe und teile den Link mit wem du möchtest. Es funktioniert sofort, auch wenn deine Familienmitglieder die App tagelang nicht öffnen.",
  },
  pt: {
    hero_kicker: "Mesh Família",
    hero_h1: "A saúde de toda a família, em um único painel",
    hero_sub:
      "Você cria um grupo, convida quem quiser (pais, parceiro, filhos) e compartilham passos, sono e frequência cardíaca em um único painel. O recurso foi projetado para oferecer uma visualização compartilhada de algumas métricas do grupo.",
    cta_primary: "Baixe o app",
    cta_secondary: "Como funciona",
    why_kicker: "Por que faz diferença",
    why_h2: "Três situações, o mesmo painel",
    why_items: [
      {
        title: "Pais e filhos adultos",
        body:
          "Vocês moram em casas diferentes, mas se mantêm atualizados um sobre o outro: quem caminhou hoje, quem dormiu bem. Cada um compartilha seus próprios dados com os demais, sem precisar perguntar ou mandar mensagem todo dia.",
      },
      {
        title: "Família com filhos adolescentes",
        body:
          "Seu filho tem uma Mi Band, você tem um Galaxy Watch. Vocês veem os passos, o sono e a frequência cardíaca um do outro no mesmo app: sem redes sociais, sem chats, só números compartilhados entre vocês.",
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
          "O app gera um código MESH-XXXX e um link para compartilhar (WhatsApp, SMS, e-mail). Quem clicar baixa o app e entra no grupo. A Mesh Família chega a até 8 membros com FitMesh Pro: cada pessoa testa todos os recursos grátis por 14 dias e depois ativa o Pro.",
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
        title: "O que os outros membros veem",
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
    techstack_h2: "Funciona com os wearables compatíveis que você já tem",
    techstack_body:
      "Galaxy Watch, Mi Band, Pixel Watch, Garmin, Fitbit, Polar, Withings. Se alguém do grupo usar outro dispositivo, basta sincronizar os dados com o Health Connect ou Apple Health. Sem vínculo a marcas.",
    pricing_kicker: "Quanto custa",
    pricing_h2: "Mesh Família com até 8 membros no Pro",
    pricing_body:
      "A Mesh Família é um recurso do FitMesh Pro: chega a até 8 membros, com histórico estendido e prioridade de sincronização. Cada pessoa testa todos os recursos grátis por 14 dias (inclusive quem entra na Mesh); depois ativa o FitMesh Pro vitalício (compra única: €3,99 no Android · €4,99 no iPhone, preço de lançamento) ou a assinatura de €1,19 a cada 6 meses.",
    faq_kicker: "Perguntas frequentes",
    faq_h2: "Dúvidas e respostas",
    faqs: [
      {
        q: "Um familiar não tem muita intimidade com tecnologia. Consegue usar?",
        a:
          "Sim. Depois de instalar o app e tocar no link de convite que você envia, a configuração inicial está concluída e o restante da família vê os dados compartilhados no próprio app. A sincronização depende das permissões e das regras de segundo plano do telefone. Em alguns casos, pode ser necessário reabrir o FitMesh.",
      },
      {
        q: "O Mesh Família mostra a localização dos outros membros?",
        a:
          "O Mesh Família não está disponível no momento. No projeto atual, a visualização do grupo não inclui a localização geográfica de outros membros.",
      },
      {
        q: "O que acontece se um membro quiser sair do grupo?",
        a:
          "No celular dele: Mesh Família → Configurações do grupo → Sair do grupo. Os dados históricos dele são removidos da visualização dos outros imediatamente. Nenhuma aprovação do administrador é necessária.",
      },
      {
        q: "Os dados de saúde da minha família estão seguros?",
        a:
          "A conexão com o serviço usa HTTPS/TLS. Para obter informações sobre o tratamento de dados, consulte nossa Política de Privacidade.",
      },
      {
        q: "Isso é um dispositivo médico?",
        a:
          "Não. FitMesh Sync é um app de fitness e bem-estar. NÃO substitui um médico nem detecta doenças. Em caso de dúvidas sobre sua saúde, consulte sempre seu médico.",
      },
      {
        q: "Quantas pessoas posso convidar?",
        a:
          "A Mesh Família chega a até 8 membros (incluindo você) com FitMesh Pro. Cada pessoa testa tudo grátis por 14 dias e depois ativa o Pro: vitalício (€3,99 Android · €4,99 iPhone) ou €1,19 a cada 6 meses.",
      },
    ],
    final_cta_h2: "Comece hoje: 3 minutos para criar seu primeiro grupo",
    final_cta_body:
      "Baixe o FitMesh na Play Store, crie o grupo familiar e compartilhe o link com quem quiser. Funciona imediatamente, mesmo que seus familiares não abram o app por dias.",
  },
  fr: {
    hero_kicker: "Mesh Famille",
    hero_h1: "La santé de toute la famille, dans un seul tableau de bord",
    hero_sub:
      "Vous créez un groupe, invitez qui vous voulez (parents, partenaire, enfants), et partagez vos pas, votre sommeil et votre fréquence cardiaque dans un seul tableau de bord. La fonctionnalité est conçue pour offrir une vue partagée de certaines métriques du groupe.",
    cta_primary: "Téléchargez l'app",
    cta_secondary: "Comment ça marche",
    why_kicker: "Pourquoi c'est utile",
    why_h2: "Trois situations, le même tableau de bord",
    why_items: [
      {
        title: "Parents et enfants adultes",
        body:
          "Vous vivez dans des foyers différents mais vous vous tenez informés l'un l'autre: qui a marché aujourd'hui, qui a bien dormi. Chacun partage ses propres données avec les autres, sans avoir à demander ou à envoyer un message chaque jour.",
      },
      {
        title: "Famille avec des adolescents",
        body:
          "Votre enfant a un Mi Band, vous avez une Galaxy Watch. Vous voyez mutuellement vos pas, votre sommeil et votre fréquence cardiaque dans la même app: pas de réseaux sociaux, pas de chats, juste des chiffres partagés entre vous.",
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
          "L'app génère un code MESH-XXXX et un lien partageable (WhatsApp, SMS, e-mail). Celui qui clique télécharge l'app et rejoint le groupe. La Mesh Famille va jusqu'à 8 membres avec FitMesh Pro: chacun essaie toutes les fonctions gratuitement pendant 14 jours, puis active Pro.",
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
        title: "Ce que voient les autres membres",
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
    techstack_h2: "Compatible avec les appareils connectés que vous possédez déjà",
    techstack_body:
      "Galaxy Watch, Mi Band, Pixel Watch, Garmin, Fitbit, Polar, Withings. Si un membre de la famille utilise un autre appareil, il suffit qu'il synchronise ses données avec Health Connect ou Apple Santé. Aucun engagement de marque.",
    pricing_kicker: "Combien ça coûte",
    pricing_h2: "Mesh Famille jusqu'à 8 membres avec Pro",
    pricing_body:
      "La Mesh Famille est une fonction de FitMesh Pro: elle va jusqu'à 8 membres, avec un historique étendu et la priorité de synchronisation. Chaque personne essaie toutes les fonctions gratuitement pendant 14 jours (y compris ceux qui rejoignent la Mesh); ensuite elle active FitMesh Pro à vie (achat unique: 3,99 € sur Android · 4,99 € sur iPhone, prix de lancement) ou l'abonnement à 1,19 € tous les 6 mois.",
    faq_kicker: "Questions fréquentes",
    faq_h2: "Questions et réponses",
    faqs: [
      {
        q: "Un membre de la famille n'est pas très à l'aise avec la technologie. Peut-il l'utiliser?",
        a:
          "Oui. Une fois l'app installée et le lien d'invitation que vous envoyez touché, la configuration initiale est terminée et le reste de la famille voit les données partagées dans sa propre app. La synchronisation dépend des autorisations et des règles d'exécution en arrière-plan du téléphone. Dans certains cas, il peut être nécessaire de rouvrir FitMesh.",
      },
      {
        q: "Mesh Famille montre-t-il la localisation des autres membres?",
        a:
          "Mesh Famille n'est actuellement pas disponible. Dans la conception actuelle, la vue de groupe n'inclut pas la localisation géographique des autres membres.",
      },
      {
        q: "Que se passe-t-il si un membre veut quitter le groupe?",
        a:
          "Depuis son téléphone: Mesh Famille → Paramètres du groupe → Quitter le groupe. Ses données historiques sont supprimées de la vue des autres membres immédiatement. Aucune approbation de l'administrateur n'est requise.",
      },
      {
        q: "Les données de santé de ma famille sont-elles en sécurité?",
        a:
          "La connexion au service utilise HTTPS/TLS. Pour plus d'informations sur le traitement des données, consultez notre Politique de Confidentialité.",
      },
      {
        q: "Est-ce un dispositif médical?",
        a:
          "Non. FitMesh Sync est une application de fitness et de bien-être. Elle ne remplace PAS un médecin et ne pose pas de diagnostics. Pour toute question de santé, consultez toujours votre médecin.",
      },
      {
        q: "Combien de personnes puis-je inviter?",
        a:
          "La Mesh Famille va jusqu'à 8 membres (vous inclus) avec FitMesh Pro. Chacun essaie tout gratuitement pendant 14 jours, puis active Pro: à vie (3,99 € Android · 4,99 € iPhone) ou 1,19 € tous les 6 mois.",
      },
    ],
    final_cta_h2: "Commencez aujourd'hui: 3 minutes pour créer votre premier groupe",
    final_cta_body:
      "Téléchargez FitMesh depuis le Play Store, créez le groupe familial et partagez le lien avec qui vous voulez. Ça fonctionne immédiatement, même si vos proches n'ouvrent pas l'app pendant des jours.",
  },
  pl: {
    hero_kicker: "Mesh Rodzina",
    hero_h1: "Zdrowie całej rodziny w jednym panelu",
    hero_sub:
      "Tworzysz grupę, zapraszasz kogo chcesz (rodziców, partnera, dzieci), a każdy udostępnia innym swoje kroki, sen i tętno w jednym panelu. Funkcja została zaprojektowana, aby oferować wspólny widok niektórych wskaźników grupy.",
    cta_primary: "Pobierz aplikację",
    cta_secondary: "Jak to działa",
    why_kicker: "Dlaczego warto",
    why_h2: "Trzy sytuacje, ten sam panel",
    why_items: [
      {
        title: "Rodzice i dorosłe dzieci",
        body:
          "Mieszkacie osobno, ale jesteście na bieżąco: kto dzisiaj spacerował, kto dobrze spał. Każdy udostępnia swoje dane bliskim bez konieczności codziennego dopytywania.",
      },
      {
        title: "Rodzina z nastolatkami",
        body:
          "Twoje dziecko ma Mi Band, Ty masz Galaxy Watch. Widzicie nawzajem swoje kroki, sen i tętno w tej samej aplikacji: bez mediów społecznościowych, bez czatów, tylko czytelne podsumowania.",
      },
      {
        title: "Partnerzy i małżonkowie",
        body:
          "Pracujecie w różnych miejscach i spotykacie się wieczorem. Świadomość, że partner zrobił swoje 8000 kroków lub dobrze wypoczął, to prosty sposób na troskę na odległość.",
      },
    ],
    how_kicker: "Jak to działa",
    how_h2: "Trzy kroki, dwie minuty",
    how_steps: [
      {
        title: "Tworzysz grupę rodzinną",
        body:
          "W aplikacji FitMesh wybierz 'Mesh Rodzina' → 'Utwórz grupę'. Nadaj jej nazwę (np. 'Rodzina Kowalskich'). Ty jesteś administratorem.",
      },
      {
        title: "Zapraszasz bliskich przez link",
        body:
          "Aplikacja generuje kod MESH-XXXX i link do udostępnienia (WhatsApp, SMS, e-mail). Kto kliknie, pobiera aplikację i dołącza. Mesh Rodzina obejmuje do 8 członków z FitMesh Pro: każdy testuje wszystkie funkcje bezpłatnie przez 14 dni, a potem aktywuje Pro.",
      },
      {
        title: "Każdy wybiera, co udostępnia",
        body:
          "Domyślnie udostępniane: kroki, sen, tętno spoczynkowe, ogólna aktywność. NIGDY nieudostępniane domyślnie: waga, ciśnienie, cykl, glikemia, lokalizacja. Ustawienia można zmienić w każdej chwili.",
      },
    ],
    privacy_kicker: "Prywatność i kontrola",
    privacy_h2: "Co widzisz, a czego NIGDY nie zobaczysz",
    privacy_columns: [
      {
        title: "Co widzą inni członkowie",
        items: [
          "Nazwę wybraną przez członka (np. 'Mama', 'Łukasz')",
          "Dzienną liczbę kroków",
          "Łączny czas snu",
          "Średnie i spoczynkowe tętno",
          "Ogólny poziom aktywności (niski/średni/wysoki)",
        ],
        color: "brand-aqua",
      },
      {
        title: "Czego NIGDY nie widać",
        items: [
          "Lokalizacji geograficznej członków",
          "Wagi i składu ciała",
          "Cyklu menstruacyjnego",
          "Ciśnienia, glikemii i wrażliwych danych medycznych",
          "Powiadomień, wiadomości ani kontaktów z telefonu",
        ],
        color: "brand-green",
      },
    ],
    techstack_h2: "Działa ze zgodnymi urządzeniami, które już macie",
    techstack_body:
      "Galaxy Watch, Mi Band, Pixel Watch, Garmin, Fitbit, Polar, Withings. Jeśli ktoś z Was ma inne urządzenie, wystarczy, że zapisuje dane w Health Connect lub Apple Zdrowie. Bez uzależnienia od jednej marki.",
    pricing_kicker: "Ile kosztuje",
    pricing_h2: "Mesh Rodzina do 8 członków z Pro",
    pricing_body:
      "Mesh Rodzina to funkcja FitMesh Pro: obejmuje do 8 członków, z rozszerzoną historią oraz priorytetową synchronizacją. Każda osoba testuje wszystkie funkcje za darmo przez 14 dni (również osoby dołączające do Mesh); potem aktywuje FitMesh Pro dożywotnio (jednorazowy zakup: 3,99 EUR na Androidzie · 4,99 EUR na iPhonie, cena startowa) albo subskrypcję za 1,19 EUR co 6 miesięcy.",
    faq_kicker: "Częste pytania",
    faq_h2: "Wątpliwości i odpowiedzi",
    faqs: [
      {
        q: "Członek rodziny nie radzi sobie dobrze z technologią. Czy może korzystać z aplikacji?",
        a:
          "Tak. Po zainstalowaniu aplikacji i kliknięciu w link zaproszenia, który wyślesz, wstępna konfiguracja jest zakończona, a reszta rodziny widzi udostępnione dane we własnej aplikacji. Synchronizacja zależy od uprawnień oraz reguł działania w tle w telefonie. W niektórych przypadkach może być konieczne ponowne otwarcie FitMesh.",
      },
      {
        q: "Czy Mesh Rodzina pokazuje lokalizację innych członków?",
        a:
          "Mesh Rodzina nie jest obecnie dostępna. W obecnym projekcie widok grupy nie zawiera lokalizacji geograficznej innych członków.",
      },
      {
        q: "Co się dzieje, gdy członek chce opuścić grupę?",
        a:
          "Na telefonie członka grupy: Mesh Rodzina → Ustawienia grupy → Opuść grupę. Dane historyczne tej osoby są natychmiast usuwane z widoku innych członków. Zgoda administratora nie jest wymagana.",
      },
      {
        q: "Czy dane zdrowotne mojej rodziny są bezpieczne?",
        a:
          "Połączenie z usługą wykorzystuje HTTPS/TLS. Szczegółowe informacje o przetwarzaniu danych znajdziesz w Polityce Prywatności.",
      },
      {
        q: "Czy to jest urządzenie medyczne?",
        a:
          "Nie. FitMesh Sync to aplikacja fitness i wellness. NIE zastępuje lekarza ani nie diagnozuje chorób. W przypadku jakichkolwiek wątpliwości klinicznych zawsze skonsultuj się ze swoim lekarzem.",
      },
      {
        q: "Ile osób mogę zaprosić?",
        a:
          "Mesh Rodzina obejmuje do 8 członków (włączając Ciebie) z FitMesh Pro. Każda osoba testuje wszystko za darmo przez 14 dni, a potem aktywuje Pro: dożywotnio (3,99 EUR Android · 4,99 EUR iPhone) albo 1,19 EUR co 6 miesięcy.",
      },
    ],
    final_cta_h2: "Zacznij dziś: 3 minuty na stworzenie pierwszej grupy",
    final_cta_body:
      "Pobierz FitMesh ze sklepu Play Store lub App Store, utwórz grupę rodzinną i udostępnij link komu chcesz. Działa od razu, nawet jeśli Twoi bliscy nie otwierają aplikacji przez kilka dni.",
  },
  tr: {
    hero_kicker: "Mesh Aile",
    hero_h1: "Tüm ailenizin sağlığı, tek bir panelde",
    hero_sub:
      "Bir grup oluşturun, istediklerinizi davet edin (ebeveynler, partner, çocuklar) ve adımları, uykuyu ve kalp atış hızını tek bir panelde paylaşın. Bu özellik, bazı grup metriklerinin paylaşılan bir görünümünü sunmak üzere tasarlanmıştır.",
    cta_primary: "Uygulamayı indir",
    cta_secondary: "Nasıl çalışır",
    why_kicker: "Neden gerekli",
    why_h2: "Üç durum, aynı panel",
    why_items: [
      {
        title: "Ebeveynler ve yetişkin çocuklar",
        body:
          "Farklı evlerde yaşarsınız ama birbirinizden haberdar olursunuz: bugün kim yürüdü, kim iyi uyudu. Herkes kendi verilerini diğerleriyle paylaşır, her gün sormaya ya da mesaj atmaya gerek kalmadan.",
      },
      {
        title: "Ergenlik çağında çocuğu olan aileler",
        body:
          "Çocuğunuzun Mi Band'i var, sizin Galaxy Watch'unuz. Aynı uygulamada birbirinizin adımlarını, uykusunu ve kalp hızını görürsünüz: sosyal medya yok, sohbet yok, sadece aranızda paylaşılan sayılar.",
      },
      {
        title: "Eşler ve partnerler",
        body:
          "Farklı yerlerde çalışıyorsunuz ve akşamları görüşüyorsunuz. Onun 8000 adımını tamamladığını ya da onun iyi uyuduğunu bilmek, uzaktan birbirinize göz kulak olmanın küçük bir yoludur.",
      },
    ],
    how_kicker: "Nasıl çalışır",
    how_h2: "Üç adım, iki dakika",
    how_steps: [
      {
        title: "Aile grubunu oluşturun",
        body:
          "FitMesh uygulamasında 'Mesh Aile' → 'Grup oluştur' seçeneğine dokunun. Bir isim verin (örneğin 'Yılmaz Ailesi'). Yönetici sizsiniz.",
      },
      {
        title: "İstediğiniz kişiyi link ile davet edin",
        body:
          "Uygulama bir MESH-XXXX kodu ve paylaşılabilir bir bağlantı oluşturur (WhatsApp, SMS, e-posta). Tıklayan kişi uygulamayı indirir ve katılır. Mesh Aile, FitMesh Pro ile 8 üyeye kadar çıkar: herkes tüm özellikleri 14 gün boyunca ücretsiz dener, sonra Pro'yu etkinleştirir.",
      },
      {
        title: "Herkes neyi paylaşmak istediğini seçer",
        body:
          "Varsayılan olarak paylaşılan: adımlar, uyku, dinlenme kalp hızı, aktivite seviyesi. Varsayılan olarak PAYLAŞILMAYAN: kilo, tansiyon, adet döngüsü, kan şekeri, konum. Uygulamadan istediğiniz zaman değiştirilebilir.",
      },
    ],
    privacy_kicker: "Gizlilik ve kontrol",
    privacy_h2: "Ne görürsünüz ve ASLA ne görmezsiniz",
    privacy_columns: [
      {
        title: "Diğer üyelerin gördükleri",
        items: [
          "Üyenin seçtiği isim (örneğin 'Anne', 'Luca')",
          "Günlük adım sayısı",
          "Toplam uyku saatleri",
          "Ortalama ve dinlenme kalp hızı",
          "Genel aktivite seviyesi (düşük/orta/yüksek)",
        ],
        color: "brand-aqua",
      },
      {
        title: "ASLA görülmeyenler",
        items: [
          "Üyenin coğrafi konumu",
          "Kilo ve vücut kompozisyonu",
          "Adet döngüsü",
          "Tansiyon, kan şekeri, hassas sağlık verileri",
          "Telefonun bildirimleri, mesajları ve kişileri",
        ],
        color: "brand-green",
      },
    ],
    techstack_h2: "Zaten sahip olduğunuz uyumlu cihazlarla çalışır",
    techstack_body:
      "Galaxy Watch, Mi Band, Pixel Watch, Garmin, Fitbit, Polar, Withings. Ailenizden birinin farklı bir cihazı varsa, verileri Health Connect veya Apple Health ile senkronize etmesi yeterlidir. Herhangi bir markaya bağlı kalma zorunluluğu yok.",
    pricing_kicker: "Ne kadar tutar",
    pricing_h2: "Mesh Aile, Pro ile 8 üyeye kadar",
    pricing_body:
      "Mesh Aile bir FitMesh Pro özelliğidir: 8 üyeye kadar çıkar, genişletilmiş geçmiş ve senkronizasyon önceliği sunar. Her kişi tüm özellikleri 14 gün boyunca ücretsiz dener (Mesh'e katılanlar dahil); ardından FitMesh Pro'yu ömür boyu etkinleştirir (tek seferlik satın alma: Android'de 3,99 EUR · iPhone'da 4,99 EUR, lansman fiyatı) ya da 6 ayda bir 1,19 EUR aboneliği seçer.",
    faq_kicker: "Sık sorulan sorular",
    faq_h2: "Sorular ve yanıtlar",
    faqs: [
      {
        q: "Bir aile üyesinin teknolojiyle arası pek iyi değil. Uygulamayı kullanabilir mi?",
        a:
          "Evet. Uygulama yüklendikten ve gönderdiğiniz davet bağlantısına tıklandıktan sonra ilk kurulum tamamlanır ve ailenin geri kalanı paylaşılan verileri kendi uygulamasında görür. Senkronizasyon, telefonun izinlerine ve arka plan kurallarına bağlıdır. Bazı durumlarda FitMesh'i yeniden açmak gerekebilir.",
      },
      {
        q: "Mesh Aile diğer üyelerin konumunu gösterir mi?",
        a:
          "Mesh Aile şu anda mevcut değildir. Mevcut tasarımda grup görünümü diğer üyelerin coğrafi konumunu içermez.",
      },
      {
        q: "Bir üye gruptan ayrılmak isterse ne olur?",
        a:
          "Kendi telefonundan: Mesh Aile → Grup ayarları → Gruptan ayrıl. Geçmiş verileri diğer üyelerin görünümünden anında kaldırılır. Yönetici onayı gerekmez.",
      },
      {
        q: "Ailemin sağlık verileri güvende mi?",
        a:
          "Hizmete bağlantı HTTPS/TLS kullanır. Veri işleme hakkında bilgi için Gizlilik Politikamıza bakın.",
      },
      {
        q: "Bu bir tıbbi cihaz mı?",
        a:
          "Hayır. FitMesh Sync bir fitness ve yaşam tarzı uygulamasıdır. Doktor YERİNİ TUTMAZ ve hastalıkları teşhis etmez. Herhangi bir sağlık endişesi için her zaman doktorunuza başvurun.",
      },
      {
        q: "Kaç kişi davet edebilirim?",
        a:
          "Mesh Aile, FitMesh Pro ile 8 üyeye kadar çıkar (siz dahil). Her kişi her şeyi 14 gün boyunca ücretsiz dener, sonra Pro'yu etkinleştirir: ömür boyu (3,99 EUR Android · 4,99 EUR iPhone) ya da 6 ayda bir 1,19 EUR.",
      },
    ],
    final_cta_h2: "Bugün başlayın: ilk grubu oluşturmak 3 dakika",
    final_cta_body:
      "FitMesh'i Play Store veya App Store'dan indirin, aile grubunu oluşturun ve bağlantıyı istediğiniz kişiyle paylaşın. Aile üyeleriniz günlerce uygulamayı açmasa bile hemen çalışır.",
  },
} as const;

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

/**
 * Sprint P0.13: hreflang filtrato su isLocaleInCopy(COPY, lc) — la STESSA
 * fonte di verità usata da `robots` sotto. COPY non è esportabile da un
 * modulo page.tsx (vincolo Next.js), quindi questo helper resta locale come
 * `blogLanguages()`/`landingLanguages()` in blog/[slug] e lp/[slug].
 */
function famigliaLanguages(): Record<string, string> {
  const langs: Record<string, string> = {};
  for (const l of locales) {
    if (!isLocaleInCopy(COPY, l)) continue;
    langs[l] = `${SITE_URL}/${l}/famiglia`;
  }
  langs["x-default"] = `${SITE_URL}/it/famiglia`;
  return langs;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!locales.includes(locale as Locale)) return {};
  const lc = locale as Locale;

  const comingSoon = getFamigliaComingSoon(lc);
  const title = COMING_SOON
    ? comingSoon.metaTitle
    : (lc === "it"
        ? "Mesh Famiglia — Condividi la salute con la tua famiglia | FitMesh Sync"
        : lc === "es"
        ? "Mesh Familia — Comparte tu salud con tu familia | FitMesh Sync"
        : lc === "de"
        ? "Mesh Familie — Teile Gesundheitsdaten mit deiner Familie | FitMesh Sync"
        : lc === "pt"
        ? "Mesh Família — Compartilhe a saúde com sua família | FitMesh Sync"
        : lc === "fr"
        ? "Mesh Famille — Partagez votre santé avec votre famille | FitMesh Sync"
        : lc === "pl"
        ? "Mesh Rodzina — Dziel się zdrowiem z rodziną | FitMesh Sync"
        : lc === "tr"
        ? "Mesh Aile — Sagliginizi ailenizle paylasin | FitMesh Sync"
        : "Family Mesh — Share health with your family | FitMesh Sync");
  const description = COMING_SOON
    ? comingSoon.metaDescription
    : (lc === "it"
        ? "Mesh Famiglia ti permette di vedere passi, sonno e battito di genitori, partner o figli in un'unica dashboard. Niente posizione geografica condivisa."
        : lc === "es"
        ? "Mesh Familia te permite ver pasos, sueño y frecuencia cardíaca de padres, pareja o hijos en un solo panel. Sin ubicación geográfica compartida."
        : lc === "de"
        ? "Mesh Familie zeigt dir Schritte, Schlaf und Herzfrequenz von Eltern, Partner oder Kindern in einem Dashboard. Kein geografischer Standort geteilt."
        : lc === "pt"
        ? "Mesh Família permite ver passos, sono e frequência cardíaca de pais, parceiro ou filhos em um único painel. Sem compartilhamento de localização geográfica."
        : lc === "fr"
        ? "Mesh Famille vous permet de voir les pas, le sommeil et la fréquence cardiaque de parents, partenaire ou enfants dans un tableau de bord. Sans localisation géographique partagée."
        : lc === "pl"
        ? "Mesh Rodzina pozwala zobaczyc kroki, sen i tetno rodziców, partnera lub dzieci w jednym panelu. Bez udostepniania lokalizacji geograficznej."
        : lc === "tr"
        ? "Mesh Aile ebeveynlerinizin, partnerinizin veya cocuklarinizin adim, uyku ve kalp hizini tek panelde görmenizi saglar. Cografi konum paylasimi yoktur."
        : "Family Mesh lets you see steps, sleep, and heart rate of parents, partners or kids in one dashboard. No geographic location sharing.");

  return {
    title,
    description,
    // Gate indicizzazione sui locali che hanno davvero il body copy in COPY.
    // Vale sia in modalità COMING_SOON sia in modalità piena: nessuna delle
    // due branch title/description sopra cambia il set di locali coperti da
    // COPY, quindi il gate resta corretto in entrambi i casi.
    robots: isLocaleInCopy(COPY, lc) ? undefined : { index: false, follow: false },
    alternates: {
      canonical: `${SITE_URL}/${lc}/famiglia`,
      // Sprint P0.13: hreflang filtrato sulla STESSA fonte di verità del
      // robots sopra (isLocaleInCopy(COPY, lc)) — non FAMIGLIA_COMPLETE_LOCALES
      // (il twin manuale usato solo da sitemap.ts, perché COPY non è
      // esportabile da un modulo page.tsx). Prima: localeAlternates()
      // generico emetteva hreflang anche verso le 7 locale noindex
      // (nl/ja/ko/sv/da/no/fi) non coperte da COPY.
      languages: famigliaLanguages(),
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
    : lc === "pl" ? "Mesh Rodzina"
    : lc === "tr" ? "Mesh Aile"
    : "Family Mesh";

  const comingSoon = getFamigliaComingSoon(lc);

  // JSON-LD WebPage — usato in entrambi gli stati (full + coming-soon).
  const webPageLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "@id": `${SITE_URL}${path}#webpage`,
    url: `${SITE_URL}${path}`,
    name: COMING_SOON
      ? comingSoon.metaTitle
      : lc === "it"
      ? "Mesh Famiglia — Condividi la salute con la tua famiglia"
      : lc === "es"
      ? "Mesh Familia — Comparte tu salud con tu familia"
      : "Family Mesh — Share health with your family",
    description: COMING_SOON
      ? comingSoon.metaDescription
      : lc === "it"
      ? "Crea un gruppo famiglia, invita genitori/partner/figli: ognuno condivide passi/sonno/frequenza cardiaca con gli altri in un'unica dashboard."
      : lc === "es"
      ? "Crea un grupo familiar, invita a padres/pareja/hijos: cada uno comparte pasos/sueño/frecuencia cardíaca con los demás en un solo panel."
      : "Create a family group, invite parents/partner/kids: everyone shares steps/sleep/heart rate with each other in one dashboard.",
    inLanguage: schemaLanguage(lc),
  };

  if (COMING_SOON) {
    return <ComingSoonState lc={lc} crumbName={crumbName} path={path} webPageLd={webPageLd} />;
  }

  const copyKey = (lc in COPY ? lc : "en") as keyof typeof COPY;
  const t = COPY[copyKey];
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
            ? "Niente carta di credito · prova 14 giorni, poi Pro"
            : lc === "es"
            ? "Sin tarjeta de crédito · prueba de 14 días, luego Pro"
            : "No credit card · 14-day trial, then Pro"}
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
 * JSON-LD. CTA → /[locale]#download (sezione download della homepage): non
 * esiste una waitlist da riempire, l'invito è a scaricare l'app e provare
 * fin da subito le funzioni già disponibili.
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
  const copy = getFamigliaComingSoon(lc);

  const faqLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: copy.faqs.map((f) => ({
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

      <section className="relative max-w-3xl mx-auto px-4 sm:px-6 pt-12 pb-16 sm:pt-20 sm:pb-20 text-center">
        <p className="text-[10px] uppercase tracking-[0.24em] text-brand-aqua font-semibold">
          {copy.kicker} · {copy.badge}
        </p>
        <h1 className="mt-4 font-display text-display-lg sm:text-display-xl font-semibold tracking-tightest text-text-primary text-balance">
          {copy.h1}
        </h1>
        <p className="mt-6 text-base sm:text-lg text-text-secondary leading-relaxed text-balance">
          {copy.sub}
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link
            href={copy.ctaCatalogHref}
            className="inline-flex items-center justify-center rounded-full bg-brand-aqua text-bg-base px-6 py-3 text-sm font-semibold hover:bg-brand-aqua/90 transition"
          >
            {copy.ctaCatalog}
          </Link>
          <Link
            href={`/${lc}#download`}
            className="inline-flex items-center justify-center rounded-full border border-text-muted/30 text-text-primary px-6 py-3 text-sm hover:bg-text-muted/10 transition"
          >
            {lc === "it"
              ? "Scarica l'app per le funzioni attive"
              : lc === "es"
              ? "Descarga la app para las funciones activas"
              : "Download the app for active features"}
          </Link>
        </div>
        <div className="mt-8">
          <TrustBadges locale={lc === "it" ? "it" : "en"} variant="compact" />
        </div>
      </section>

      <section className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
        <h2 className="font-display text-2xl sm:text-3xl font-semibold tracking-tight text-text-primary text-center">
          {copy.why_h2}
        </h2>
        <div className="mt-8 grid sm:grid-cols-2 gap-6 max-w-2xl mx-auto">
          {copy.why_items.map((item) => (
            <div key={item.title} className="rounded-2xl border border-text-muted/15 bg-bg-elevated/40 p-5">
              <h3 className="font-display text-lg font-semibold text-text-primary">{item.title}</h3>
              <p className="mt-2 text-sm text-text-secondary leading-relaxed">{item.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
        <p className="text-center text-[10px] uppercase tracking-[0.22em] text-brand-aqua font-semibold">
          {copy.faq_kicker}
        </p>
        <h2 className="mt-3 text-center font-display text-2xl sm:text-3xl font-semibold tracking-tight text-text-primary">
          {copy.faq_h2}
        </h2>
        <dl className="mt-8 space-y-4">
          {copy.faqs.map((f) => (
            <details
              key={f.q}
              className="group rounded-2xl border border-text-muted/15 bg-bg-elevated/40 p-5 sm:p-6"
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
              <p className="mt-4 text-sm text-text-secondary leading-relaxed">{f.a}</p>
            </details>
          ))}
        </dl>
      </section>

      <section className="max-w-3xl mx-auto px-4 sm:px-6 py-12 text-center">
        <h2 className="font-display text-2xl sm:text-3xl font-semibold tracking-tight text-text-primary">
          {copy.availability_h2}
        </h2>
        <p className="mt-5 text-text-secondary leading-relaxed">{copy.availability_body}</p>
        <div className="mt-8">
          <Link
            href={copy.ctaCatalogHref}
            className="inline-flex items-center justify-center rounded-full bg-brand-aqua text-bg-base px-6 py-3 text-sm font-semibold hover:bg-brand-aqua/90 transition"
          >
            {copy.ctaCatalog}
          </Link>
        </div>
      </section>
    </article>
  );
}
