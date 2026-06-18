import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { JsonLd } from "@/components/seo/JsonLd";
import { Breadcrumbs } from "@/components/seo/Breadcrumbs";
import { locales, type Locale, ogLocale } from "@/lib/i18n";
import { localizedBlogSlug } from "@/lib/blog/slug-i18n";

const SITE_URL = "https://www.fitmesh.fit";

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

  const title =
    lc === "it"
      ? "Roadmap pubblica — FitMesh Sync"
      : lc === "es"
        ? "Roadmap pública — FitMesh Sync"
        : "Public roadmap — FitMesh Sync";
  const description =
    lc === "it"
      ? "Cosa è già live in produzione, cosa arriva nei prossimi 30 giorni, Q3 e Q4 2026, e cosa stiamo esplorando. Roadmap aggiornata in chiaro, senza marketing-speak."
      : lc === "es"
        ? "Qué está ya disponible, qué llega en los próximos 30 días, Q3 y Q4 2026, y qué estamos explorando. Una roadmap clara y actualizada, sin lenguaje de marketing."
        : "What's already shipping, what's coming in the next 30 days, Q3 and Q4 2026, and what we're exploring. A clear, no-marketing-speak roadmap updated regularly.";

  const path = `/${lc}/roadmap`;
  return {
    title,
    description,
    alternates: {
      canonical: `${SITE_URL}${path}`,
      languages: {
        it: `${SITE_URL}/it/roadmap`,
        en: `${SITE_URL}/en/roadmap`,
        es: `${SITE_URL}/es/roadmap`,
        "x-default": `${SITE_URL}/it/roadmap`,
      },
    },
    openGraph: {
      type: "website",
      url: `${SITE_URL}${path}`,
      title,
      description,
      siteName: "FitMesh Sync",
      locale: ogLocale[lc],
      alternateLocale: locales.filter((l) => l !== lc).map((l) => ogLocale[l]),
    },
    twitter: { card: "summary_large_image", title, description },
  };
}

// ── Data model ────────────────────────────────────────────────────────────
type RoadmapStatus = "live" | "in-progress" | "planned" | "exploration";

type LocalizedText = Record<Locale, string>;

interface RoadmapItem {
  status: RoadmapStatus;
  title: LocalizedText;
  desc: LocalizedText;
}

interface RoadmapColumn {
  /** Pillar id (used as React key + anchor). */
  id: string;
  /** Short label shown as kicker (e.g. "NOW", "NEXT 30 DAYS"). */
  kicker: LocalizedText;
  /** Column headline. */
  title: LocalizedText;
  /** Short caption under the headline. */
  caption: LocalizedText;
  /** Accent hex color (matches statusLabel palette for visual consistency). */
  accent: string;
  /** Items in this column. */
  items: RoadmapItem[];
}

const COLUMNS: RoadmapColumn[] = [
  {
    id: "now",
    kicker: { it: "Now · In produzione", en: "Now · Shipping", es: "Ahora · En producción", de: "Now · Im Betrieb", pt: "Now · Em produção", fr: "Now · En production" },
    title: { it: "Vivo e in mano agli utenti", en: "Live with users today", es: "Disponible para los usuarios hoy", de: "Live und in den Händen der Nutzer", pt: "Disponível para os usuários hoje", fr: "Disponible pour les utilisateurs aujourd'hui" },
    caption: {
      it: "Funzionalità già nel Play Store, usate ogni giorno dai founder beta.",
      en: "Features already on the Play Store, used daily by beta founders.",
      es: "Funciones ya disponibles en el Play Store, usadas a diario por los beta founders.",
      de: "Funktionen, die bereits im Play Store verfügbar sind und täglich von den Beta-Foundern genutzt werden.",
      pt: "Funcionalidades já disponíveis no Play Store, usadas diariamente pelos founders beta.",
      fr: "Fonctionnalités déjà disponibles sur le Play Store, utilisées chaque jour par les founders bêta.",
    },
    accent: "#31E981",
    items: [
      {
        status: "live",
        title: {
          it: "Health Connect end-to-end",
          en: "Health Connect end-to-end",
          es: "Health Connect de extremo a extremo",
          de: "Health Connect end-to-end",
          pt: "Health Connect de ponta a ponta",
          fr: "Health Connect de bout en bout",
        },
        desc: {
          it: "Lettura di passi, BPM, sonno con fasi, calorie, distanza, allenamenti, SpO₂ e VO₂ max da qualunque sorgente che scriva su Health Connect.",
          en: "Reads steps, heart rate, sleep stages, calories, distance, workouts, SpO₂ and VO₂ max from any source that writes to Health Connect.",
          es: "Lee pasos, frecuencia cardíaca, fases del sueño, calorías, distancia, entrenamientos, SpO₂ y VO₂ max desde cualquier fuente que escriba en Health Connect.",
          de: "Liest Schritte, Herzfrequenz, Schlafphasen, Kalorien, Distanz, Trainings, SpO₂ und VO₂ max aus jeder Quelle, die Daten in Health Connect schreibt.",
          pt: "Lê passos, frequência cardíaca, fases do sono, calorias, distância, treinos, SpO₂ e VO₂ max de qualquer fonte que grave dados no Health Connect.",
          fr: "Lit les pas, la fréquence cardiaque, les phases du sommeil, les calories, la distance, les séances d'entraînement, SpO₂ et VO₂ max depuis toute source qui écrit dans Health Connect.",
        },
      },
      {
        status: "live",
        title: { it: "Samsung Health + Galaxy Watch", en: "Samsung Health + Galaxy Watch", es: "Samsung Health + Galaxy Watch", de: "Samsung Health + Galaxy Watch", pt: "Samsung Health + Galaxy Watch", fr: "Samsung Health + Galaxy Watch" },
        desc: {
          it: "Galaxy Watch 4/5/6/7/Ultra via Samsung Health → Health Connect. Setup in 5 minuti, latenza tipica 5–15 minuti.",
          en: "Galaxy Watch 4/5/6/7/Ultra via Samsung Health → Health Connect. 5-minute setup, typical 5–15 minute latency.",
          es: "Galaxy Watch 4/5/6/7/Ultra a través de Samsung Health → Health Connect. Configuración en 5 minutos, latencia habitual de 5 a 15 minutos.",
          de: "Galaxy Watch 4/5/6/7/Ultra über Samsung Health → Health Connect. Einrichtung in 5 Minuten, typische Latenz 5–15 Minuten.",
          pt: "Galaxy Watch 4/5/6/7/Ultra via Samsung Health → Health Connect. Configuração em 5 minutos, latência típica de 5 a 15 minutos.",
          fr: "Galaxy Watch 4/5/6/7/Ultra via Samsung Health → Health Connect. Configuration en 5 minutes, latence typique de 5 à 15 minutes.",
        },
      },
      {
        status: "live",
        title: { it: "Dashboard web nativa", en: "Native web dashboard", es: "Panel web nativo", de: "Native Web-Dashboard", pt: "Painel web nativo", fr: "Tableau de bord web natif" },
        desc: {
          it: "Vista personale con trend giornalieri e settimanali, breakdown allenamenti, fasi sonno, zone HR. Server-side rendered e privacy-first.",
          en: "Personal view with daily and weekly trends, workout breakdowns, sleep stages, HR zones. Server-side rendered and privacy-first.",
          es: "Vista personal con tendencias diarias y semanales, desglose de entrenamientos, fases del sueño y zonas de frecuencia cardíaca. Renderizado en servidor y con privacidad por diseño.",
          de: "Persönliche Ansicht mit täglichen und wöchentlichen Trends, Trainingsaufschlüsselung, Schlafphasen und Herzfrequenzzonen. Serverseitig gerendert und Datenschutz-zuerst.",
          pt: "Visão pessoal com tendências diárias e semanais, detalhamento de treinos, fases do sono e zonas de frequência cardíaca. Renderizado no servidor com privacidade em primeiro lugar.",
          fr: "Vue personnelle avec les tendances quotidiennes et hebdomadaires, le détail des séances d'entraînement, les phases du sommeil et les zones de fréquence cardiaque. Rendu côté serveur et confidentialité en priorité.",
        },
      },
      {
        status: "live",
        title: { it: "Export GDPR — JSON + CSV", en: "GDPR export — JSON + CSV", es: "Exportación GDPR: JSON + CSV", de: "DSGVO-Export — JSON + CSV", pt: "Exportação LGPD/GDPR — JSON + CSV", fr: "Export RGPD — JSON + CSV" },
        desc: {
          it: "Scarica tutti i tuoi dati con un click, in formato leggibile e portabile. Diritto alla portabilità GDPR Art. 20.",
          en: "Download all your data with one click, in a readable and portable format. GDPR Art. 20 right to data portability.",
          es: "Descarga todos tus datos con un clic, en un formato legible y portátil. Derecho a la portabilidad de datos según el Art. 20 del RGPD.",
          de: "Laden Sie alle Ihre Daten mit einem Klick herunter, in einem lesbaren und portablen Format. Recht auf Datenübertragbarkeit gemäß DSGVO Art. 20.",
          pt: "Baixe todos os seus dados com um clique, em formato legível e portátil. Direito à portabilidade de dados conforme o Art. 20 do GDPR.",
          fr: "Téléchargez toutes vos données en un clic, dans un format lisible et portable. Droit à la portabilité des données selon l'Art. 20 du RGPD.",
        },
      },
      {
        status: "live",
        title: { it: "Notifiche push FCM", en: "FCM push notifications", es: "Notificaciones push", de: "FCM-Push-Benachrichtigungen", pt: "Notificações push FCM", fr: "Notifications push FCM" },
        desc: {
          it: "Notifiche programmate per highlight settimanali, soglie HR e promemoria sync (opt-in, mai marketing).",
          en: "Scheduled notifications for weekly highlights, HR thresholds and sync reminders (opt-in, never marketing).",
          es: "Notificaciones programadas para resúmenes semanales, alertas de frecuencia cardíaca y recordatorios de sincronización (opt-in, nunca publicidad).",
          de: "Geplante Benachrichtigungen für wöchentliche Highlights, Herzfrequenz-Schwellenwerte und Synchronisierungs-Erinnerungen (opt-in, niemals Werbung).",
          pt: "Notificações programadas para destaques semanais, limites de frequência cardíaca e lembretes de sincronização (opt-in, nunca publicidade).",
          fr: "Notifications programmées pour les points forts hebdomadaires, les seuils de fréquence cardiaque et les rappels de synchronisation (opt-in, jamais de marketing).",
        },
      },
      {
        status: "live",
        title: { it: "Trial gratuito 7 giorni", en: "7-day free trial", es: "Prueba gratuita de 7 días", de: "7-Tage-Gratistest", pt: "Teste grátis de 7 dias", fr: "Essai gratuit de 7 jours" },
        desc: {
          it: "Una settimana per provare tutto senza inserire dati di pagamento. Acquisto unico da €3,99 al termine, niente subscription.",
          en: "One week to try everything without entering payment details. One-time from €3.99 after, no subscription.",
          es: "Una semana para probarlo todo sin introducir datos de pago. Pago único desde €3,99 al terminar, sin suscripción.",
          de: "Eine Woche, um alles auszuprobieren, ohne Zahlungsdaten anzugeben. Danach Einmalkauf ab €3,99, kein Abonnement.",
          pt: "Uma semana para experimentar tudo sem informar dados de pagamento. Compra única a partir de €3,99 ao final, sem assinatura.",
          fr: "Une semaine pour tout essayer sans saisir vos coordonnées bancaires. Achat unique à partir de €3,99 ensuite, sans abonnement.",
        },
      },
    ],
  },
  {
    id: "next-30",
    kicker: { it: "Next · 30 giorni", en: "Next · 30 days", es: "Próximo · 30 días", de: "Next · 30 Tage", pt: "Next · 30 dias", fr: "Next · 30 jours" },
    title: { it: "In rilascio prossimo sprint", en: "Shipping next sprint", es: "Disponible en el próximo sprint", de: "Veröffentlichung im nächsten Sprint", pt: "Lançamento no próximo sprint", fr: "Disponible au prochain sprint" },
    caption: {
      it: "Già in build interna o in beta privata, ETA 30 giorni se i test reggono.",
      en: "Already in internal build or private beta, ETA 30 days if tests hold up.",
      es: "Ya en build interna o beta privada, ETA 30 días si los tests lo confirman.",
      de: "Bereits im internen Build oder in der privaten Beta, ETA 30 Tage, wenn die Tests standhalten.",
      pt: "Já em build interna ou beta privado, ETA 30 dias se os testes confirmarem.",
      fr: "Déjà en build interne ou en bêta privée, ETA 30 jours si les tests tiennent.",
    },
    accent: "#21E6C1",
    items: [
      {
        status: "in-progress",
        title: { it: "App iOS (Apple Salute)", en: "iOS app (Apple Health)", es: "App iOS (HealthKit)", de: "iOS-App (Apple Health)", pt: "App iOS (Apple Health)", fr: "App iOS (Apple Santé)" },
        desc: {
          it: "App per iPhone pronta: lettura Apple Salute e un ponte che porta in Apple Salute i dati di Galaxy Watch e anello Colmi. Lancio su App Store imminente.",
          en: "iPhone app ready: Apple Health read, plus a bridge that brings Galaxy Watch and Colmi ring data into Apple Health. App Store launch imminent.",
          es: "App para iPhone lista: lectura de HealthKit y un puente que lleva los datos de Galaxy Watch y el anillo Colmi a HealthKit. Lanzamiento en el App Store inminente.",
          de: "iPhone-App bereit: Lesen aus Apple Health und eine Brücke, die Galaxy Watch- und Colmi-Ring-Daten in Apple Health überträgt. App Store-Start steht unmittelbar bevor.",
          pt: "App para iPhone pronta: leitura do Apple Health e uma ponte que leva os dados do Galaxy Watch e do anel Colmi para o Apple Health. Lançamento no App Store iminente.",
          fr: "Application iPhone prête: lecture d'Apple Santé et un pont qui apporte les données Galaxy Watch et de la bague Colmi dans Apple Santé. Lancement sur l'App Store imminent.",
        },
      },
      {
        status: "in-progress",
        title: { it: "Landing Pixel Watch dedicata", en: "Dedicated Pixel Watch landing", es: "Página dedicada a Pixel Watch", de: "Dedizierte Pixel Watch Landing Page", pt: "Landing page dedicada ao Pixel Watch", fr: "Page dédiée au Pixel Watch" },
        desc: {
          it: "Pagina /sync/pixel-watch con setup guide specifico e troubleshooting Fitbit → Health Connect dedicato.",
          en: "Dedicated /sync/pixel-watch page with Pixel-specific setup guide and Fitbit → Health Connect troubleshooting.",
          es: "Página /sync/pixel-watch con guía de configuración específica para Pixel Watch y resolución de problemas con Fitbit → Health Connect.",
          de: "Seite /sync/pixel-watch mit Pixel-spezifischem Einrichtungsleitfaden und dedizierter Fehlerbehebung für Fitbit → Health Connect.",
          pt: "Página /sync/pixel-watch com guia de configuração específico para Pixel Watch e resolução de problemas do Fitbit → Health Connect.",
          fr: "Page /sync/pixel-watch avec un guide de configuration spécifique au Pixel Watch et un dépannage dédié Fitbit → Health Connect.",
        },
      },
      {
        status: "in-progress",
        title: { it: "Fitbit — guida setup completa", en: "Fitbit — full setup guide", es: "Fitbit: guía de configuración completa", de: "Fitbit — vollständiger Einrichtungsleitfaden", pt: "Fitbit — guia de configuração completo", fr: "Fitbit — guide de configuration complet" },
        desc: {
          it: "Onboarding passo-passo nell'app per attivare il bridge Fitbit → Health Connect, con verifica automatica dei permessi.",
          en: "Step-by-step in-app onboarding to enable the Fitbit → Health Connect bridge, with automatic permission check.",
          es: "Onboarding paso a paso dentro de la app para activar el puente Fitbit → Health Connect, con verificación automática de permisos.",
          de: "Schritt-für-Schritt-Onboarding in der App zum Aktivieren der Fitbit → Health Connect-Brücke, mit automatischer Berechtigungsprüfung.",
          pt: "Onboarding passo a passo dentro do app para ativar a ponte Fitbit → Health Connect, com verificação automática de permissões.",
          fr: "Onboarding pas à pas dans l'application pour activer le pont Fitbit → Health Connect, avec vérification automatique des autorisations.",
        },
      },
      {
        status: "in-progress",
        title: { it: "Attività mensile e annuale", en: "Monthly and yearly activity", es: "Actividad mensual y anual", de: "Monatliche und jährliche Aktivität", pt: "Atividade mensal e anual", fr: "Activité mensuelle et annuelle" },
        desc: {
          it: "Aggregazioni temporali oltre la settimana: heat map mensile, totali annuali per allenamento, confronto anno-su-anno.",
          en: "Time aggregations beyond the week: monthly heat map, yearly totals per workout, year-over-year comparison.",
          es: "Agregaciones temporales más allá de la semana: mapa de calor mensual, totales anuales por entrenamiento y comparativa año a año.",
          de: "Zeitaggregationen über die Woche hinaus: monatliche Heatmap, jährliche Gesamtwerte pro Training, Jahresvergleich.",
          pt: "Agregações temporais além da semana: mapa de calor mensal, totais anuais por treino, comparação ano a ano.",
          fr: "Agrégations temporelles au-delà de la semaine: carte de chaleur mensuelle, totaux annuels par séance, comparaison d'une année sur l'autre.",
        },
      },
      {
        status: "in-progress",
        title: { it: "IAP server-side verification", en: "Server-side IAP verification", es: "Verificación de compra en el servidor", de: "Serverseitige IAP-Verifizierung", pt: "Verificação de compra server-side", fr: "Vérification des achats côté serveur" },
        desc: {
          it: "Validazione Play Billing lato backend con Supabase Edge Functions per prevenire refund fraud e licenze multi-device sicure.",
          en: "Backend Play Billing validation via Supabase Edge Functions to prevent refund fraud and enable safe multi-device licensing.",
          es: "Validación de Play Billing en el backend para prevenir fraudes de reembolso y habilitar licencias seguras en varios dispositivos.",
          de: "Backend-Validierung von Play Billing über Supabase Edge Functions, um Rückerstattungsbetrug zu verhindern und sichere Multi-Geräte-Lizenzen zu ermöglichen.",
          pt: "Validação do Play Billing no backend via Supabase Edge Functions para prevenir fraudes de reembolso e habilitar licenças seguras em múltiplos dispositivos.",
          fr: "Validation du Play Billing côté backend via Supabase Edge Functions pour prévenir les fraudes aux remboursements et permettre des licences multi-appareils sécurisées.",
        },
      },
      {
        status: "in-progress",
        title: { it: "Pressione arteriosa + glicemia", en: "Blood pressure + glucose", es: "Presión arterial + glucosa", de: "Blutdruck + Blutzucker", pt: "Pressão arterial + glicemia", fr: "Tension artérielle + glycémie" },
        desc: {
          it: "Lettura BP (Withings BPM, Omron HC bridge) e glucose (Libre LinkUp dove disponibile via HC), con grafici dedicati.",
          en: "BP read (Withings BPM, Omron HC bridge) and glucose (Libre LinkUp where available via HC), with dedicated charts.",
          es: "Lectura de presión arterial (Withings BPM, puente Omron HC) y glucosa (Libre LinkUp donde esté disponible vía HC), con gráficas dedicadas.",
          de: "Blutdruck-Lesen (Withings BPM, Omron HC-Brücke) und Glukose (Libre LinkUp wo über HC verfügbar), mit dedizierten Diagrammen.",
          pt: "Leitura de pressão arterial (Withings BPM, ponte Omron HC) e glicose (Libre LinkUp onde disponível via HC), com gráficos dedicados.",
          fr: "Lecture de la tension artérielle (Withings BPM, pont Omron HC) et de la glycémie (Libre LinkUp où disponible via HC), avec des graphiques dédiés.",
        },
      },
    ],
  },
  {
    id: "q3-2026",
    kicker: { it: "Q3 2026", en: "Q3 2026", es: "Q3 2026", de: "Q3 2026", pt: "Q3 2026", fr: "Q3 2026" },
    title: { it: "Integrazioni OAuth native", en: "Native OAuth integrations", es: "Integraciones OAuth nativas", de: "Native OAuth-Integrationen", pt: "Integrações OAuth nativas", fr: "Intégrations OAuth natives" },
    caption: {
      it: "Integrazioni che richiedono OAuth ufficiale e approvazione partner. Date soggette ai loro processi.",
      en: "Integrations that require official OAuth and partner approval. Dates subject to their processes.",
      es: "Integraciones que requieren OAuth oficial y aprobación del partner. Fechas sujetas a sus procesos.",
      de: "Integrationen, die offizielle OAuth-Genehmigung und Partner-Zustimmung erfordern. Termine abhängig von deren Prozessen.",
      pt: "Integrações que exigem OAuth oficial e aprovação do parceiro. Datas sujeitas aos processos deles.",
      fr: "Intégrations nécessitant un OAuth officiel et une approbation partenaire. Dates soumises à leurs processus.",
    },
    accent: "#38BDF8",
    items: [
      {
        status: "planned",
        title: { it: "Garmin Health API — OAuth", en: "Garmin Health API — OAuth", es: "Garmin Health API: OAuth", de: "Garmin Health API — OAuth", pt: "Garmin Health API — OAuth", fr: "Garmin Health API — OAuth" },
        desc: {
          it: "Body Battery, Training Load, Recovery Time, Stress Score, GPS dettagliato. In attesa di approvazione Garmin Developer Program.",
          en: "Body Battery, Training Load, Recovery Time, Stress Score, detailed GPS. Pending Garmin Developer Program approval.",
          es: "Body Battery, Training Load, Recovery Time, Stress Score y GPS detallado. Pendiente de aprobación del Garmin Developer Program.",
          de: "Body Battery, Training Load, Recovery Time, Stress Score, detailliertes GPS. Genehmigung des Garmin Developer Program ausstehend.",
          pt: "Body Battery, Training Load, Recovery Time, Stress Score, GPS detalhado. Aguardando aprovação do Garmin Developer Program.",
          fr: "Body Battery, Training Load, Recovery Time, Stress Score, GPS détaillé. En attente d'approbation du Garmin Developer Program.",
        },
      },
      {
        status: "planned",
        title: { it: "Polar Accesslink — OAuth", en: "Polar Accesslink — OAuth", es: "Polar Accesslink: OAuth", de: "Polar Accesslink — OAuth", pt: "Polar Accesslink — OAuth", fr: "Polar Accesslink — OAuth" },
        desc: {
          it: "Recovery Pro, Nightly Recharge, ZoneOptimizer e BPM secondo per secondo dai cardio H10. Beta waves a invito.",
          en: "Recovery Pro, Nightly Recharge, ZoneOptimizer and per-second heart rate from H10 chest straps. Invite-only beta waves.",
          es: "Recovery Pro, Nightly Recharge, ZoneOptimizer y frecuencia cardíaca segundo a segundo desde el H10. Betas por invitación.",
          de: "Recovery Pro, Nightly Recharge, ZoneOptimizer und sekundenweise Herzfrequenz vom H10-Brustgurt. Beta-Wellen nur auf Einladung.",
          pt: "Recovery Pro, Nightly Recharge, ZoneOptimizer e frequência cardíaca segundo a segundo dos sensores H10. Betas por convite.",
          fr: "Recovery Pro, Nightly Recharge, ZoneOptimizer et fréquence cardiaque seconde par seconde depuis le capteur H10. Bêta sur invitation uniquement.",
        },
      },
      {
        status: "planned",
        title: { it: "Oura Ring — OAuth", en: "Oura Ring — OAuth", es: "Oura Ring: OAuth", de: "Oura Ring — OAuth", pt: "Oura Ring — OAuth", fr: "Oura Ring — OAuth" },
        desc: {
          it: "Readiness, Activity, HRV notturno, temperatura corporea. Particolarmente utile combinato a Galaxy Watch o Garmin.",
          en: "Readiness, Activity, overnight HRV, body temperature. Especially useful when combined with Galaxy Watch or Garmin.",
          es: "Readiness, Activity, HRV nocturno y temperatura corporal. Especialmente útil combinado con Galaxy Watch o Garmin.",
          de: "Readiness, Activity, nächtliche HRV, Körpertemperatur. Besonders nützlich in Kombination mit Galaxy Watch oder Garmin.",
          pt: "Readiness, Activity, HRV noturno, temperatura corporal. Especialmente útil combinado com Galaxy Watch ou Garmin.",
          fr: "Readiness, Activity, HRV nocturne, température corporelle. Particulièrement utile combiné à Galaxy Watch ou Garmin.",
        },
      },
      {
        status: "planned",
        title: { it: "Withings — OAuth", en: "Withings — OAuth", es: "Withings: OAuth", de: "Withings — OAuth", pt: "Withings — OAuth", fr: "Withings — OAuth" },
        desc: {
          it: "ECG dettagliato + rilevamento FA, Sleep Mat con fasi, Pulse Wave Velocity, trend lungo periodo composizione corporea.",
          en: "Detailed ECG + AFib detection, Sleep Mat with stages, Pulse Wave Velocity, long-term body composition trends.",
          es: "ECG detallado + detección de fibrilación auricular, Sleep Mat con fases, Pulse Wave Velocity y tendencias de composición corporal a largo plazo.",
          de: "Detailliertes EKG + Vorhofflimmern-Erkennung, Sleep Mat mit Schlafphasen, Pulswellengeschwindigkeit, langfristige Trends zur Körperzusammensetzung.",
          pt: "ECG detalhado + detecção de fibrilação atrial, Sleep Mat com fases, Pulse Wave Velocity, tendências de composição corporal a longo prazo.",
          fr: "ECG détaillé + détection de fibrillation atriale, Sleep Mat avec phases, Pulse Wave Velocity, tendances de composition corporelle à long terme.",
        },
      },
    ],
  },
  {
    id: "future",
    kicker: { it: "Future · Esplorazione", en: "Future · Exploration", es: "Futuro · Exploración", de: "Future · Erkundung", pt: "Future · Exploração", fr: "Future · Exploration" },
    title: { it: "Sul tavolo, da validare con voi", en: "On the table, to validate with you", es: "En estudio, para validar contigo", de: "Auf dem Tisch, mit euch zu validieren", pt: "Em análise, para validar com você", fr: "Sur la table, à valider avec vous" },
    caption: {
      it: "Direzioni che stiamo studiando. Mandaci feedback per pesarne la priorità.",
      en: "Directions we're studying. Send us feedback to weigh their priority.",
      es: "Líneas que estamos estudiando. Envíanos tu opinión para priorizar.",
      de: "Richtungen, die wir erkunden. Schickt uns Feedback, um die Priorität abzuwägen.",
      pt: "Direções que estamos estudando. Envie-nos seu feedback para avaliar a prioridade.",
      fr: "Des pistes que nous explorons. Envoyez-nous vos retours pour en évaluer la priorité.",
    },
    accent: "#A78BFA",
    items: [
      {
        status: "exploration",
        title: { it: "Coros e Wahoo", en: "Coros and Wahoo", es: "Coros y Wahoo", de: "Coros und Wahoo", pt: "Coros e Wahoo", fr: "Coros et Wahoo" },
        desc: {
          it: "OAuth Coros Open API e Wahoo Cloud API per copertura ciclismo e ultra-endurance. Stiamo dimensionando volumi.",
          en: "Coros Open API and Wahoo Cloud API OAuth for cycling and ultra-endurance coverage. Sizing demand right now.",
          es: "OAuth con Coros Open API y Wahoo Cloud API para ciclismo y ultra-endurance. Estamos midiendo la demanda.",
          de: "OAuth mit Coros Open API und Wahoo Cloud API für Radsport und Ultra-Endurance-Abdeckung. Wir messen gerade den Bedarf.",
          pt: "OAuth com Coros Open API e Wahoo Cloud API para cobertura de ciclismo e ultra-endurance. Estamos dimensionando a demanda.",
          fr: "OAuth avec Coros Open API et Wahoo Cloud API pour la couverture cyclisme et ultra-endurance. Nous évaluons la demande en ce moment.",
        },
      },
      {
        status: "exploration",
        title: { it: "Family group + caregiver mode", en: "Family group + caregiver mode", es: "Grupo familiar + modo cuidadores", de: "Familiengruppe + Betreuungsmodus", pt: "Grupo familiar + modo cuidadores", fr: "Groupe familial + mode aidants" },
        desc: {
          it: "Condivisione dashboard limitata a persone di fiducia (genitori, caregiver) con permessi granulari e revoca istantanea.",
          en: "Limited dashboard sharing with trusted people (parents, caregivers) via granular permissions and instant revocation.",
          es: "Compartir el panel con personas de confianza (familiares, cuidadores) con permisos detallados y revocación instantánea.",
          de: "Eingeschränkte Dashboard-Freigabe für Vertrauenspersonen (Eltern, Betreuungspersonen) mit granularen Berechtigungen und sofortiger Widerrufsmöglichkeit.",
          pt: "Compartilhamento limitado do painel com pessoas de confiança (pais, cuidadores) via permissões granulares e revogação instantânea.",
          fr: "Partage limité du tableau de bord avec des personnes de confiance (parents, aidants) via des autorisations granulaires et une révocation instantanée.",
        },
      },
      {
        status: "exploration",
        title: { it: "Export FIT / TCX / GPX", en: "FIT / TCX / GPX export", es: "Exportación FIT / TCX / GPX", de: "FIT / TCX / GPX-Export", pt: "Exportação FIT / TCX / GPX", fr: "Export FIT / TCX / GPX" },
        desc: {
          it: "Esportazione singole attività in formati standard fitness, utili per re-importare in Strava, Garmin Connect, TrainingPeaks.",
          en: "Export individual activities in standard fitness formats, useful for re-importing into Strava, Garmin Connect, TrainingPeaks.",
          es: "Exporta actividades individuales en formatos fitness estándar, útiles para reimportarlas en Strava, Garmin Connect o TrainingPeaks.",
          de: "Export einzelner Aktivitäten in Standard-Fitness-Formate, nützlich für den Re-Import in Strava, Garmin Connect oder TrainingPeaks.",
          pt: "Exportação de atividades individuais em formatos fitness padrão, úteis para reimportar no Strava, Garmin Connect ou TrainingPeaks.",
          fr: "Export des activités individuelles dans des formats fitness standard, utiles pour les réimporter dans Strava, Garmin Connect ou TrainingPeaks.",
        },
      },
      {
        status: "exploration",
        title: { it: "Watch app companion", en: "Watch app companion", es: "App companion para el reloj", de: "Watch Companion-App", pt: "App companion para o relógio", fr: "Application companion pour la montre" },
        desc: {
          it: "Tile Wear OS e watch face Galaxy con highlight giornaliero (passi vs target, HR, stato sync) direttamente al polso.",
          en: "Wear OS tile and Galaxy watch face with daily highlights (steps vs target, HR, sync status) right on your wrist.",
          es: "Tile para Wear OS y watch face para Galaxy con resumen diario (pasos vs objetivo, frecuencia cardíaca, estado de sincronización) directamente en tu muñeca.",
          de: "Wear OS-Tile und Galaxy Watch Face mit täglichen Highlights (Schritte vs. Ziel, Herzfrequenz, Synchronisierungsstatus) direkt am Handgelenk.",
          pt: "Tile para Wear OS e watch face Galaxy com destaques diários (passos vs meta, frequência cardíaca, status de sincronização) diretamente no pulso.",
          fr: "Tile Wear OS et watch face Galaxy avec les points forts quotidiens (pas vs objectif, fréquence cardiaque, statut de synchronisation) directement au poignet.",
        },
      },
    ],
  },
];

const STATUS_BADGE: Record<RoadmapStatus, { it: string; en: string; es: string; de: string; pt: string; fr: string; color: string }> = {
  live: { it: "Live", en: "Live", es: "Disponible", de: "Live", pt: "Disponível", fr: "Disponible", color: "#31E981" },
  "in-progress": { it: "In sviluppo", en: "In progress", es: "En desarrollo", de: "In Entwicklung", pt: "Em desenvolvimento", fr: "En développement", color: "#21E6C1" },
  planned: { it: "Pianificato", en: "Planned", es: "Planificado", de: "Geplant", pt: "Planejado", fr: "Planifié", color: "#38BDF8" },
  exploration: { it: "Esplorazione", en: "Exploring", es: "Exploración", de: "Erkundung", pt: "Em exploração", fr: "En exploration", color: "#A78BFA" },
};

export default async function RoadmapPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!locales.includes(locale as Locale)) notFound();
  const lc = locale as Locale;
  const t = (it: string, en: string, es?: string) =>
    lc === "it" ? it : lc === "es" ? (es ?? en) : en;
  const path = `/${lc}/roadmap`;

  // ItemList JSON-LD — utile per AI search & rich results
  const itemListLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: t("Roadmap FitMesh Sync", "FitMesh Sync Roadmap", "Roadmap FitMesh Sync"),
    url: `${SITE_URL}${path}`,
    inLanguage: lc === "it" ? "it-IT" : lc === "es" ? "es-ES" : "en-US",
    itemListElement: COLUMNS.flatMap((col, ci) =>
      col.items.map((it, ii) => ({
        "@type": "ListItem",
        position: ci * 100 + ii + 1,
        name: it.title[lc],
        description: it.desc[lc],
      })),
    ),
  };

  return (
    <>
      <JsonLd data={itemListLd} />
      <Breadcrumbs
        items={[{ name: t("Roadmap", "Roadmap", "Roadmap"), path }]}
        locale={lc}
      />

      {/* HERO */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 pt-12 sm:pt-20 pb-12">
        <p className="text-[10px] uppercase tracking-[0.22em] text-brand-aqua font-semibold">
          {t("Roadmap pubblica", "Public roadmap", "Roadmap pública")}
        </p>
        <h1 className="mt-3 font-display text-display-xl font-semibold tracking-tightest text-text-primary max-w-3xl">
          {t("Cosa è vivo, cosa arriva, ", "What's live, what's next, ", "Qué está disponible, qué llega, ")}
          <span className="text-brand-gradient">
            {t("cosa stiamo esplorando.", "what we're exploring.", "qué estamos explorando.")}
          </span>
        </h1>
        <p className="mt-6 text-lg text-text-secondary max-w-2xl leading-relaxed">
          {t(
            "Roadmap in chiaro, aggiornata ogni sprint. Niente marketing-speak: solo lo stato reale di ogni integrazione e feature, con date ETA dove le abbiamo e onestà dove non le abbiamo.",
            "A clear roadmap, updated each sprint. No marketing-speak: just the real status of every integration and feature, with ETA dates where we have them and honesty where we don't.",
            "Una roadmap clara, actualizada cada sprint. Sin lenguaje de marketing: solo el estado real de cada integración y función, con fechas ETA cuando las tenemos y honestidad cuando no.",
          )}
        </p>

        {/* Legend */}
        <div className="mt-8 flex flex-wrap items-center gap-2">
          {(Object.keys(STATUS_BADGE) as RoadmapStatus[]).map((k) => {
            const b = STATUS_BADGE[k];
            return (
              <span
                key={k}
                className="inline-flex items-center gap-2 px-3 py-1 rounded-pill border text-xs font-medium"
                style={{
                  borderColor: `${b.color}55`,
                  background: `${b.color}11`,
                  color: b.color,
                }}
              >
                <span
                  className="w-1.5 h-1.5 rounded-full"
                  style={{ background: b.color, boxShadow: `0 0 8px ${b.color}` }}
                />
                {b[lc]}
              </span>
            );
          })}
        </div>
      </section>

      {/* TIMELINE — vertical cards, each column as a "lane" */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 pt-4 pb-12">
        <div className="grid gap-6 lg:grid-cols-2">
          {COLUMNS.map((col) => (
            <article
              key={col.id}
              id={col.id}
              className="rounded-card border border-divider bg-gradient-to-br from-bg-card to-bg-secondary p-6 sm:p-8 relative overflow-hidden"
            >
              <div
                aria-hidden
                className="absolute -top-20 -right-20 w-56 h-56 rounded-full opacity-15 blur-3xl"
                style={{ background: col.accent }}
              />
              <div className="relative">
                <p
                  className="text-[10px] uppercase tracking-[0.22em] font-semibold"
                  style={{ color: col.accent }}
                >
                  {col.kicker[lc]}
                </p>
                <h2 className="mt-2 font-display text-xl sm:text-2xl font-semibold text-text-primary">
                  {col.title[lc]}
                </h2>
                <p className="mt-2 text-sm text-text-secondary leading-relaxed">
                  {col.caption[lc]}
                </p>

                {/* Item list — vertical timeline */}
                <ul className="mt-6 space-y-4">
                  {col.items.map((it, i) => {
                    const badge = STATUS_BADGE[it.status];
                    return (
                      <li
                        key={i}
                        className="rounded-card border border-divider/60 bg-bg-card/40 p-4"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <h3 className="font-display text-base font-semibold text-text-primary">
                            {it.title[lc]}
                          </h3>
                          <span
                            className="text-[10px] uppercase tracking-wider font-semibold px-2 py-1 rounded-pill flex-shrink-0"
                            style={{
                              background: `${badge.color}15`,
                              color: badge.color,
                            }}
                          >
                            {badge[lc]}
                          </span>
                        </div>
                        <p className="mt-2 text-sm text-text-secondary leading-relaxed">
                          {it.desc[lc]}
                        </p>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* DISCLAIMER */}
      <section className="max-w-3xl mx-auto px-4 sm:px-6 pt-4 pb-12">
        <div className="rounded-card border border-divider bg-bg-card/60 p-6 sm:p-8">
          <p className="text-[10px] uppercase tracking-[0.22em] text-brand-aqua font-semibold">
            {t("Disclaimer", "Disclaimer", "Aviso")}
          </p>
          <p className="mt-3 text-sm text-text-secondary leading-relaxed">
            {t(
              "Le date \"Q3 / Q4 2026\" indicano la finestra di rilascio target. Alcune integrazioni dipendono da approvazioni partner (es. Garmin Developer Program, Huawei Health Kit) e possono slittare. Aggiorniamo questa pagina ogni sprint: se vedi qualcosa di obsoleto, scrivici.",
              "The \"Q3 / Q4 2026\" dates indicate target release windows. Some integrations depend on partner approvals (e.g. Garmin Developer Program, Huawei Health Kit) and may slip. We update this page each sprint: if anything looks stale, tell us.",
              "Las fechas \"Q3 / Q4 2026\" indican ventanas de lanzamiento objetivo. Algunas integraciones dependen de aprobaciones de partners (por ejemplo, Garmin Developer Program, Huawei Health Kit) y pueden retrasarse. Actualizamos esta página cada sprint: si ves algo desactualizado, escríbenos.",
            )}
          </p>
          <Link
            href={`/${lc}/blog/${localizedBlogSlug("gdpr-dati-fitness-smartwatch", lc)}`}
            className="mt-5 inline-flex items-center gap-1.5 text-sm text-brand-aqua hover:text-brand-green transition group"
          >
            {t(
              "GDPR e dati fitness: dove finiscono i dati del tuo smartwatch",
              "GDPR and fitness data: where your smartwatch data ends up",
              "RGPD y datos de salud: adónde van los datos de tu smartwatch",
            )}
            <span className="transition-transform group-hover:translate-x-1">→</span>
          </Link>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-3xl mx-auto px-4 sm:px-6 pt-4 pb-20 text-center">
        <h2 className="font-display text-display font-semibold tracking-tightest text-text-primary">
          {t("Manca qualcosa che ti serve?", "Missing something you need?", "¿Falta algo que necesitas?")}
        </h2>
        <p className="mt-4 text-text-secondary max-w-xl mx-auto">
          {t(
            "Le richieste utente pesano sulla priorità delle prossime sprint. Scrivici cosa vorresti vedere e perché: leggiamo tutto.",
            "User requests drive the next sprint priorities. Tell us what you'd like to see and why: we read everything.",
            "Las peticiones de los usuarios influyen en la prioridad de los próximos sprints. Cuéntanos qué te gustaría ver y por qué: leemos todo.",
          )}
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <a
            href="mailto:hello@fitmesh.fit?subject=Roadmap%20request"
            className="inline-flex items-center px-6 py-3 rounded-pill btn-cta text-sm font-semibold"
          >
            {t("Suggerisci una feature", "Suggest a feature", "Sugiere una función")}
          </a>
          <Link
            href={`/${lc}/integrations`}
            className="inline-flex items-center px-6 py-3 rounded-pill border border-divider text-text-primary font-medium hover:bg-white/5 transition"
          >
            {t("Vedi tutte le integrazioni", "See all integrations", "Ver todas las integraciones")}
          </Link>
        </div>
      </section>
    </>
  );
}
