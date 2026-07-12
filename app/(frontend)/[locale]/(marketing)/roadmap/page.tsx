import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { JsonLd } from "@/components/seo/JsonLd";
import { Breadcrumbs } from "@/components/seo/Breadcrumbs";
import { locales, type Locale, ogLocale, localeAlternates } from "@/lib/i18n";
import { localizedBlogSlug } from "@/lib/blog/slug-i18n";
import { SITE_URL } from "@/lib/product-facts";
import { schemaLanguage } from "@/lib/seo/schema-language";

/**
 * Locales with fully translated body content on this page (COLUMNS/STATUS_BADGE
 * below, accessed via the `tlr()` helper). All 15 site locales now have real
 * translations here, so this list mirrors `locales` and no locale gets the
 * `robots: noindex` fallback below.
 */
import { ROADMAP_COMPLETE_LOCALES as COMPLETE_LOCALES } from "@/lib/content/static-page-locales";

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

  const titles: Record<Locale, string> = {
    it: "Roadmap pubblica — FitMesh Sync",
    en: "Public roadmap — FitMesh Sync",
    es: "Roadmap pública — FitMesh Sync",
    de: "Öffentliche Roadmap — FitMesh Sync",
    pt: "Roadmap pública — FitMesh Sync",
    fr: "Feuille de route publique — FitMesh Sync",
    pl: "Publiczna roadmapa — FitMesh Sync",
    tr: "Herkese açık yol haritası — FitMesh Sync",
    nl: "Publieke roadmap — FitMesh Sync",
    ja: "公開ロードマップ — FitMesh Sync",
    ko: "공개 로드맵 — FitMesh Sync",
    sv: "Publik roadmap: FitMesh Sync",
    da: "Offentlig roadmap: FitMesh Sync",
    no: "Offentlig veikart: FitMesh Sync",
    fi: "Julkinen tiekartta: FitMesh Sync",
  };
  const descriptions: Record<Locale, string> = {
    it: "Cosa è già live in produzione, cosa arriva nei prossimi 30 giorni, Q3 e Q4 2026, e cosa stiamo esplorando. Roadmap aggiornata in chiaro, senza marketing-speak.",
    en: "What's already shipping, what's coming in the next 30 days, Q3 and Q4 2026, and what we're exploring. A clear, no-marketing-speak roadmap updated regularly.",
    es: "Qué está ya disponible, qué llega en los próximos 30 días, Q3 y Q4 2026, y qué estamos explorando. Una roadmap clara y actualizada, sin lenguaje de marketing.",
    de: "Was bereits im Betrieb ist, was in den nächsten 30 Tagen, Q3 und Q4 2026 kommt und was wir erkunden. Eine klare Roadmap, regelmäßig aktualisiert, ohne Marketing-Sprech.",
    pt: "O que já está em produção, o que chega nos próximos 30 dias, no Q3 e Q4 de 2026, e o que estamos explorando. Um roadmap claro e atualizado, sem linguagem de marketing.",
    fr: "Ce qui est déjà en production, ce qui arrive dans les 30 prochains jours, au T3 et T4 2026, et ce que nous explorons. Une feuille de route claire et régulièrement mise à jour, sans jargon marketing.",
    pl: "Co już działa w produkcji, co pojawi się w ciągu najbliższych 30 dni, w Q3 i Q4 2026, oraz co badamy. Przejrzysta roadmapa, regularnie aktualizowana, bez marketingowego żargonu.",
    tr: "Şu anda yayında olanlar, önümüzdeki 30 günde, 2026 Q3 ve Q4'te gelecekler ve keşfettiklerimiz. Düzenli güncellenen, pazarlama dili içermeyen net bir yol haritası.",
    nl: "Wat al live is, wat de komende 30 dagen, Q3 en Q4 2026 verschijnt en wat we verkennen. Een heldere roadmap, regelmatig bijgewerkt, zonder marketingpraat.",
    ja: "すでに本番稼働中の機能、今後30日・2026年Q3とQ4に登場するもの、そして検討中の方向性。マーケティング表現なしで定期的に更新する明快なロードマップ。",
    ko: "이미 프로덕션에 출시된 기능, 앞으로 30일·2026년 Q3와 Q4에 출시될 기능, 그리고 검토 중인 방향. 마케팅 표현 없이 정기적으로 업데이트하는 명확한 로드맵.",
    sv: "Vad som redan är live, vad som kommer de närmaste 30 dagarna, Q3 och Q4 2026, och vad vi utforskar. En tydlig roadmap utan marknadsföringsprat, uppdaterad regelbundet.",
    da: "Hvad der allerede er live, hvad der kommer de næste 30 dage, Q3 og Q4 2026, og hvad vi udforsker. Et tydeligt roadmap uden markedsføringssnak, opdateret jævnligt.",
    no: "Hva som allerede er live, hva som kommer de neste 30 dagene, Q3 og Q4 2026, og hva vi utforsker. Et tydelig veikart uten markedsføringsprat, oppdatert jevnlig.",
    fi: "Mikä on jo julkaistu, mitä tulee seuraavan 30 päivän aikana, Q3 ja Q4 2026, ja mitä tutkimme. Selkeä tiekartta ilman markkinointipuhetta, säännöllisesti päivitetty.",
  };
  const title = titles[lc];
  const description = descriptions[lc];

  const path = `/${lc}/roadmap`;
  return {
    title,
    description,
    ...(COMPLETE_LOCALES.includes(lc) ? {} : { robots: { index: false, follow: false } }),
    alternates: {
      canonical: `${SITE_URL}${path}`,
      languages: localeAlternates((l) => `${SITE_URL}/${l}/roadmap`),
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

type LocalizedText = Record<"it" | "en" | "es" | "de" | "pt" | "fr" | "pl" | "tr", string> & Partial<Record<"nl" | "ja" | "ko" | "sv" | "da" | "no" | "fi", string>>;
/** Safe accessor: returns localized text, falls back to English for untranslated locales */
function tlr(text: LocalizedText, lc: Locale): string {
  return (text as Record<string, string>)[lc] ?? text.en;
}

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
    kicker: { it: "Now · In produzione", en: "Now · Shipping", es: "Ahora · En producción", de: "Now · Im Betrieb", pt: "Now · Em produção", fr: "Now · En production", pl: "Now · W produkcji", tr: "Now · Yayinda", nl: "Nu · In productie", ja: "現在 · 本番稼働中", ko: "현재 · 프로덕션 중", sv: "Nu · Lanseras", da: "Nu · Live", no: "Nå · Live", fi: "Nyt · Julkaistu" },
    title: { it: "Vivo e in mano agli utenti", en: "Live with users today", es: "Disponible para los usuarios hoy", de: "Live und in den Händen der Nutzer", pt: "Disponível para os usuários hoje", fr: "Disponible pour les utilisateurs aujourd'hui", pl: "Dostepne dla uzytkowników juz dzis", tr: "Bugün kullanicilara açik", nl: "Live en in handen van de gebruikers", ja: "ライブでユーザーの手元に", ko: "라이브로 사용자 손에", sv: "Live hos användare redan idag", da: "Live hos brugere i dag", no: "Live hos brukere i dag", fi: "Käytössä oikeilla käyttäjillä jo tänään" },
    caption: {
      it: "Funzionalità già nel Play Store, usate ogni giorno dai founder beta.",
      en: "Features already on the Play Store, used daily by beta founders.",
      es: "Funciones ya disponibles en el Play Store, usadas a diario por los beta founders.",
      de: "Funktionen, die bereits im Play Store verfügbar sind und täglich von den Beta-Foundern genutzt werden.",
      pt: "Funcionalidades já disponíveis no Play Store, usadas diariamente pelos founders beta.",
      fr: "Fonctionnalités déjà disponibles sur le Play Store, utilisées chaque jour par les founders bêta.",
      pl: "Funkcje juz dostepne w Play Store, uzywane codziennie przez zalozycieli beta.",
      tr: "Play Store'da mevcut özellikler, beta kurucular tarafindan her gün kullaniliyor.",
      nl: "Functies al in de Play Store, elke dag gebruikt door de bèta-founders.",
      ja: "機能はすでにPlay Storeで公開されており、ベータファウンダーが毎日利用しています。",
      ko: "기능이 이미 Play Store에 출시되어 베타 파운더들이 매일 사용 중입니다.",
      sv: "Funktioner som redan finns på Google Play och används dagligen av våra beta-founders.",
      da: "Funktioner der allerede er i Play Store og bruges dagligt af vores beta-founders.",
      no: "Funksjoner som allerede finnes på Google Play, brukt daglig av founder-brukerne i beta.",
      fi: "Ominaisuudet ovat jo Google Play -kaupassa ja beta-vaiheen perustajakäyttäjien päivittäisessä käytössä.",
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
          pl: "Health Connect od poczatku do konca",
          tr: "Health Connect uc uca",
          nl: "Health Connect end-to-end",
          ja: "Health Connect エンドツーエンド",
          ko: "Health Connect 엔드투엔드",
          sv: "Fullständig Health Connect-integration",
          da: "Komplet Health Connect-understøttelse",
          no: "Fullstendig Health Connect-støtte",
          fi: "Health Connect kokonaisuudessaan",
        },
        desc: {
          it: "Lettura di passi, BPM, sonno con fasi, calorie, distanza, allenamenti, SpO₂ e VO₂ max da qualunque sorgente che scriva su Health Connect.",
          en: "Reads steps, heart rate, sleep stages, calories, distance, workouts, SpO₂ and VO₂ max from any source that writes to Health Connect.",
          es: "Lee pasos, frecuencia cardíaca, fases del sueño, calorías, distancia, entrenamientos, SpO₂ y VO₂ max desde cualquier fuente que escriba en Health Connect.",
          de: "Liest Schritte, Herzfrequenz, Schlafphasen, Kalorien, Distanz, Trainings, SpO₂ und VO₂ max aus jeder Quelle, die Daten in Health Connect schreibt.",
          pt: "Lê passos, frequência cardíaca, fases do sono, calorias, distância, treinos, SpO₂ e VO₂ max de qualquer fonte que grave dados no Health Connect.",
          fr: "Lit les pas, la fréquence cardiaque, les phases du sommeil, les calories, la distance, les séances d'entraînement, SpO₂ et VO₂ max depuis toute source qui écrit dans Health Connect.",
          pl: "Odczytuje kroki, tetno, fazy snu, kalorie, dystans, treningi, SpO₂ i VO₂ max z dowolnego zródla zapisujacego dane do Health Connect.",
          tr: "Health Connect'e yazan her kaynaktan adim, kalp hizi, uyku evre, kalori, mesafe, antrenman, SpO₂ ve VO₂ max verilerini okur.",
          nl: "Stappen, BPM, slaap met fases, calorieën, afstand, trainingen, SpO₂ en VO₂ max uitlezen vanuit elke bron die naar Health Connect schrijft.",
          ja: "Health Connectに書き込むあらゆるソースから、歩数・BPM・睡眠フェーズ・カロリー・距離・ワークアウト・SpO₂・VO₂ maxを読み取ります。",
          ko: "Health Connect에 데이터를 쓰는 모든 소스에서 걸음 수, BPM, 수면 단계, 칼로리, 거리, 운동, SpO₂ 및 VO₂ max를 읽습니다.",
          sv: "Läser steg, puls, sömnstadier, kalorier, distans, träningspass, SpO2 och VO2 max från alla källor som skriver till Health Connect.",
          da: "Læser skridt, puls, søvnstadier, kalorier, distance, træningspas, SpO2 og VO2 max fra enhver kilde, der skriver til Health Connect.",
          no: "Leser skritt, puls, søvnstadier, kalorier, distanse, treningsøkter, SpO2 og VO2 maks fra alle kilder som skriver til Health Connect.",
          fi: "Lukee askeleet, sykkeen, unen vaiheet, kalorit, matkan, treenit, SpO2:n ja VO2 maxin mistä tahansa lähteestä, joka kirjoittaa dataa Health Connectiin.",
        },
      },
      {
        status: "live",
        title: { it: "Samsung Health + Galaxy Watch", en: "Samsung Health + Galaxy Watch", es: "Samsung Health + Galaxy Watch", de: "Samsung Health + Galaxy Watch", pt: "Samsung Health + Galaxy Watch", fr: "Samsung Health + Galaxy Watch", pl: "Samsung Health + Galaxy Watch", tr: "Samsung Health + Galaxy Watch", nl: "Samsung Health + Galaxy Watch", ja: "Samsung Health + Galaxy Watch", ko: "Samsung Health + Galaxy Watch", sv: "Samsung Health + Galaxy Watch", da: "Samsung Health + Galaxy Watch", no: "Samsung Health + Galaxy Watch", fi: "Samsung Health + Galaxy Watch" },
        desc: {
          it: "Galaxy Watch 4/5/6/7/Ultra via Samsung Health → Health Connect. Setup in 5 minuti, latenza tipica 5–15 minuti.",
          en: "Galaxy Watch 4/5/6/7/Ultra via Samsung Health → Health Connect. 5-minute setup, typical 5–15 minute latency.",
          es: "Galaxy Watch 4/5/6/7/Ultra a través de Samsung Health → Health Connect. Configuración en 5 minutos, latencia habitual de 5 a 15 minutos.",
          de: "Galaxy Watch 4/5/6/7/Ultra über Samsung Health → Health Connect. Einrichtung in 5 Minuten, typische Latenz 5–15 Minuten.",
          pt: "Galaxy Watch 4/5/6/7/Ultra via Samsung Health → Health Connect. Configuração em 5 minutos, latência típica de 5 a 15 minutos.",
          fr: "Galaxy Watch 4/5/6/7/Ultra via Samsung Health → Health Connect. Configuration en 5 minutes, latence typique de 5 à 15 minutes.",
          pl: "Galaxy Watch 4/5/6/7/Ultra przez Samsung Health → Health Connect. Konfiguracja w 5 minut, typowe opóznienie 5-15 minut.",
          tr: "Galaxy Watch 4/5/6/7/Ultra, Samsung Health → Health Connect üzerinden. 5 dakikada kurulum, tipik gecikme 5-15 dakika.",
          nl: "Galaxy Watch 4/5/6/7/Ultra via Samsung Health → Health Connect. Instelling in 5 minuten, typische latentie 5–15 minuten.",
          ja: "Galaxy Watch 4/5/6/7/Ultra を Samsung Health 経由で Health Connect に連携。セットアップ5分、通常の遅延は5〜15分。",
          ko: "Galaxy Watch 4/5/6/7/Ultra를 Samsung Health → Health Connect로 연결. 5분 설정, 일반적인 지연 5–15분.",
          sv: "Galaxy Watch 4/5/6/7/Ultra via Samsung Health → Health Connect. Klart på 5 minuter, vanligtvis 5–15 minuters fördröjning.",
          da: "Galaxy Watch 4/5/6/7/Ultra via Samsung Health → Health Connect. 5 minutters opsætning, typisk 5-15 minutters forsinkelse.",
          no: "Galaxy Watch 4/5/6/7/Ultra via Samsung Health → Health Connect. Oppsett på 5 minutter, typisk 5-15 minutters forsinkelse.",
          fi: "Galaxy Watch 4/5/6/7/Ultra Samsung Healthin kautta Health Connectiin. Käyttöönotto 5 minuutissa, viive tyypillisesti 5–15 minuuttia.",
        },
      },
      {
        status: "live",
        title: { it: "Dashboard web nativa", en: "Native web dashboard", es: "Panel web nativo", de: "Native Web-Dashboard", pt: "Painel web nativo", fr: "Tableau de bord web natif", pl: "Natywny panel webowy", tr: "Yerel web paneli", nl: "Natief webdashboard", ja: "ネイティブWebダッシュボード", ko: "네이티브 웹 대시보드", sv: "Inbyggd webbdashboard", da: "Nativt webdashboard", no: "Nativt webdashbord", fi: "Oma verkkopohjainen koontinäyttö" },
        desc: {
          it: "Vista personale con trend giornalieri e settimanali, breakdown allenamenti, fasi sonno, zone HR. Server-side rendered e privacy-first.",
          en: "Personal view with daily and weekly trends, workout breakdowns, sleep stages, HR zones. Server-side rendered and privacy-first.",
          es: "Vista personal con tendencias diarias y semanales, desglose de entrenamientos, fases del sueño y zonas de frecuencia cardíaca. Renderizado en servidor y con privacidad por diseño.",
          de: "Persönliche Ansicht mit täglichen und wöchentlichen Trends, Trainingsaufschlüsselung, Schlafphasen und Herzfrequenzzonen. Serverseitig gerendert und Datenschutz-zuerst.",
          pt: "Visão pessoal com tendências diárias e semanais, detalhamento de treinos, fases do sono e zonas de frequência cardíaca. Renderizado no servidor com privacidade em primeiro lugar.",
          fr: "Vue personnelle avec les tendances quotidiennes et hebdomadaires, le détail des séances d'entraînement, les phases du sommeil et les zones de fréquence cardiaque. Rendu côté serveur et confidentialité en priorité.",
          pl: "Widok osobisty z codziennymi i tygodniowymi trendami, podzialem treningów, fazami snu i strefami HR. Renderowany po stronie serwera z prywatnosciq na pierwszym miejscu.",
          tr: "Günlük ve haftalik trendler, antrenman detaylari, uyku evreleri ve kalp hizi bölgeleriyle kisisel görünüm. Sunucu tarafinda render edilmis, gizlilik öncelikli.",
          nl: "Persoonlijk overzicht met dagelijkse en wekelijkse trends, trainingsanalyse, slaapfases, HR-zones. Server-side gerenderd en privacy-first.",
          ja: "日次・週次トレンド、トレーニング分析、睡眠フェーズ、HRゾーンを表示する個人ビュー。サーバーサイドレンダリングでプライバシーファースト。",
          ko: "일간 및 주간 트렌드, 운동 분석, 수면 단계, HR 존을 보여주는 개인 뷰. 서버 사이드 렌더링과 프라이버시 우선.",
          sv: "Personlig vy med dagliga och veckovisa trender, uppdelning av träningspass, sömnstadier och pulszoner. Server-renderad och byggd med integritet i fokus.",
          da: "Personlig visning med daglige og ugentlige tendenser, træningsopdeling, søvnstadier og pulszoner. Server-renderet og privatlivsfokuseret.",
          no: "Personlig visning med daglige og ukentlige trender, detaljert oversikt over treningsøkter, søvnstadier og pulssoner. Rendres på serversiden, med personvern i fokus.",
          fi: "Henkilökohtainen näkymä päivä- ja viikkotrendeihin, treenien erittelyyn, univaiheisiin ja sykealueisiin. Renderöity palvelinpuolella ja rakennettu yksityisyys edellä.",
        },
      },
      {
        status: "live",
        title: { it: "Export GDPR — JSON + CSV", en: "GDPR export — JSON + CSV", es: "Exportación GDPR: JSON + CSV", de: "DSGVO-Export — JSON + CSV", pt: "Exportação LGPD/GDPR — JSON + CSV", fr: "Export RGPD — JSON + CSV", pl: "Eksport RODO — JSON + CSV", tr: "KVKK/GDPR disa aktarma — JSON + CSV", nl: "GDPR-export — JSON + CSV", ja: "GDPRエクスポート — JSON + CSV", ko: "GDPR 내보내기 — JSON + CSV", sv: "GDPR-export – JSON + CSV", da: "GDPR-eksport – JSON + CSV", no: "GDPR-eksport -- JSON + CSV", fi: "GDPR-vienti – JSON + CSV" },
        desc: {
          it: "Scarica tutti i tuoi dati con un click, in formato leggibile e portabile. Diritto alla portabilità GDPR Art. 20.",
          en: "Download all your data with one click, in a readable and portable format. GDPR Art. 20 right to data portability.",
          es: "Descarga todos tus datos con un clic, en un formato legible y portátil. Derecho a la portabilidad de datos según el Art. 20 del RGPD.",
          de: "Laden Sie alle Ihre Daten mit einem Klick herunter, in einem lesbaren und portablen Format. Recht auf Datenübertragbarkeit gemäß DSGVO Art. 20.",
          pt: "Baixe todos os seus dados com um clique, em formato legível e portátil. Direito à portabilidade de dados conforme o Art. 20 do GDPR.",
          fr: "Téléchargez toutes vos données en un clic, dans un format lisible et portable. Droit à la portabilité des données selon l'Art. 20 du RGPD.",
          pl: "Pobierz wszystkie swoje dane jednym kliknieciem w czytelnym i przenosnym formacie. Prawo do przenoszenia danych zgodnie z RODO Art. 20.",
          tr: "Tüm verilerini tek tiklama ile okunabilir ve tasínabilir formatta indir. GDPR Madde 20 kapsamindan veri tasínabilirlik hakki.",
          nl: "Download al je gegevens met één klik, in een leesbaar en overdraagbaar formaat. Recht op dataportabiliteit GDPR Art. 20.",
          ja: "すべてのデータをワンクリックでダウンロード。読みやすく移植可能なフォーマット。GDPR第20条に基づくデータポータビリティの権利。",
          ko: "클릭 한 번으로 모든 데이터를 읽기 쉽고 이식 가능한 형식으로 다운로드. GDPR 제20조 데이터 이동 권리.",
          sv: "Ladda ner all din data med ett klick, i ett läsbart och portabelt format. GDPR artikel 20, rätten till dataportabilitet.",
          da: "Download alle dine data med ét klik, i et læsbart og overførbart format. GDPR art. 20 om ret til dataportabilitet.",
          no: "Last ned all dataen din med ett klikk, i et lesbart og portabelt format. GDPR artikkel 20 -- retten til dataportabilitet.",
          fi: "Lataa kaikki tietosi yhdellä klikkauksella luettavassa ja siirrettävässä muodossa. GDPR:n 20 artiklan mukainen oikeus tiedon siirrettävyyteen.",
        },
      },
      {
        status: "live",
        title: { it: "Notifiche push FCM", en: "FCM push notifications", es: "Notificaciones push", de: "FCM-Push-Benachrichtigungen", pt: "Notificações push FCM", fr: "Notifications push FCM", pl: "Powiadomienia push FCM", tr: "FCM anlık bildirimleri", nl: "FCM-pushmeldingen", ja: "FCMプッシュ通知", ko: "FCM 푸시 알림", sv: "FCM-pushnotiser", da: "FCM-pushnotifikationer", no: "FCM-pushvarsler", fi: "FCM-push-ilmoitukset" },
        desc: {
          it: "Notifiche programmate per highlight settimanali, soglie HR e promemoria sync (opt-in, mai marketing).",
          en: "Scheduled notifications for weekly highlights, HR thresholds and sync reminders (opt-in, never marketing).",
          es: "Notificaciones programadas para resúmenes semanales, alertas de frecuencia cardíaca y recordatorios de sincronización (opt-in, nunca publicidad).",
          de: "Geplante Benachrichtigungen für wöchentliche Highlights, Herzfrequenz-Schwellenwerte und Synchronisierungs-Erinnerungen (opt-in, niemals Werbung).",
          pt: "Notificações programadas para destaques semanais, limites de frequência cardíaca e lembretes de sincronização (opt-in, nunca publicidade).",
          fr: "Notifications programmées pour les points forts hebdomadaires, les seuils de fréquence cardiaque et les rappels de synchronisation (opt-in, jamais de marketing).",
          pl: "Zaplanowane powiadomienia o tygodniowych podsumowaniach, progach HR i przypomnieniach o synchronizacji (opt-in, nigdy reklamy).",
          tr: "Haftalik öne çikartilanlar, kalp hizi esikleri ve senkronizasyon hatirlaticlari için planlanmis bildirimler (opt-in, asla pazarlama).",
          nl: "Geplande meldingen voor wekelijkse hoogtepunten, HR-drempelwaarden en synchronisatieherinneringen (opt-in, nooit marketing).",
          ja: "週次ハイライト・HR閾値・同期リマインダーのスケジュール通知（オプトイン、マーケティング目的なし）。",
          ko: "주간 하이라이트, HR 임계값 및 동기화 알림을 위한 예약 알림 (옵트인, 마케팅 없음).",
          sv: "Schemalagda notiser för veckosammanfattningar, pulströskelvärden och synkpåminnelser (valbart, aldrig marknadsföring).",
          da: "Planlagte notifikationer om ugentlige highlights, pulsgrænser og synkroniseringspåmindelser (kun tilvalg, aldrig markedsføring).",
          no: "Planlagte varsler for ukentlige høydepunkter, pulsterskler og synkroniseringspåminnelser (opt-in, aldri markedsføring).",
          fi: "Ajastetut ilmoitukset viikon kohokohdista, sykerajoista ja synkronointimuistutuksista (vain suostumuksella, ei koskaan markkinointia).",
        },
      },
      {
        status: "live",
        title: { it: "Trial gratuito 14 giorni", en: "14-day free trial", es: "Prueba gratuita de 14 días", de: "14-Tage-Gratistest", pt: "Teste grátis de 14 dias", fr: "Essai gratuit de 14 jours", pl: "14-dniowy bezpłatny okres próbny", tr: "14 günlük ücretsiz deneme", nl: "Gratis proefperiode van 14 dagen", ja: "14日間無料トライアル", ko: "14일 무료 체험", sv: "14 dagars gratis provperiod", da: "14 dages gratis prøveperiode", no: "14 dagers gratis prøveperiode", fi: "14 päivän ilmainen kokeilu" },
        desc: {
          it: "Due settimane per provare tutto senza inserire dati di pagamento. Acquisto unico da €3,99 al termine, niente subscription.",
          en: "Two weeks to try everything without entering payment details. One-time from €3.99 after, no subscription.",
          es: "Dos semanas para probarlo todo sin introducir datos de pago. Pago único desde €3,99 al terminar, sin suscripción.",
          de: "Zwei Wochen, um alles auszuprobieren, ohne Zahlungsdaten anzugeben. Danach Einmalkauf ab €3,99, kein Abonnement.",
          pt: "Duas semanas para experimentar tudo sem informar dados de pagamento. Compra única a partir de €3,99 ao final, sem assinatura.",
          fr: "Deux semaines pour tout essayer sans saisir vos coordonnées bancaires. Achat unique à partir de €3,99 ensuite, sans abonnement.",
          pl: "Dwa tygodnie na wypróbowanie wszystkiego bez podawania danych płatności. Jednorazowy zakup od €3,99 po zakończeniu, bez subskrypcji.",
          tr: "Ödeme bilgisi girmeden her şeyi denemek için iki hafta. Sonrasında €3,99'dan başlayan tek seferlik satın alma, abonelik yok.",
          nl: "Twee weken alles uitproberen zonder betalingsgegevens in te voeren. Eenmalige aankoop van €3,99 achteraf, geen abonnement.",
          ja: "支払い情報不要で2週間すべての機能を試せます。終了後は€3,99の買い切り、サブスクリプションなし。",
          ko: "결제 정보 입력 없이 2주 동안 모든 기능 체험. 이후 €3,99 일회성 구매, 구독 없음.",
          sv: "Två veckor att prova allt utan att ange betalningsuppgifter. Därefter engångsbetalning från 3,99 EUR, inget abonnemang.",
          da: "To uger til at prøve alt uden at indtaste betalingsoplysninger. Herefter engangskøb fra EUR 3,99, intet abonnement.",
          no: "To uker til å prøve alt uten å oppgi betalingsinformasjon. Deretter et engangskjøp fra 3,99 EUR, ingen abonnement.",
          fi: "Kaksi viikkoa aikaa kokeilla kaikkea ilman maksutietojen syöttämistä. Sen jälkeen kertamaksu alkaen 3,99 eurosta, ei tilausta.",
        },
      },
    ],
  },
  {
    id: "next-30",
    kicker: { it: "Next · 30 giorni", en: "Next · 30 days", es: "Próximo · 30 días", de: "Next · 30 Tage", pt: "Next · 30 dias", fr: "Next · 30 jours", pl: "Next · 30 dni", tr: "Next · 30 gün", nl: "Volgende · 30 dagen", ja: "次 · 30日以内", ko: "다음 · 30일", sv: "Nästa · 30 dagar", da: "Næste · 30 dage", no: "Neste · 30 dager", fi: "Seuraavaksi · 30 päivää" },
    title: { it: "In rilascio prossimo sprint", en: "Shipping next sprint", es: "Disponible en el próximo sprint", de: "Veröffentlichung im nächsten Sprint", pt: "Lançamento no próximo sprint", fr: "Disponible au prochain sprint", pl: "Wydanie w nastepnym sprincie", tr: "Sonraki sprintte yayinlanacak", nl: "Binnenkort in de volgende sprint", ja: "次のスプリントでリリース予定", ko: "다음 스프린트에 출시 예정", sv: "Lanseras nästa sprint", da: "Klar til lancering næste sprint", no: "Lanseres neste sprint", fi: "Julkaistaan seuraavassa sprintissä" },
    caption: {
      it: "Già in build interna o in beta privata, ETA 30 giorni se i test reggono.",
      en: "Already in internal build or private beta, ETA 30 days if tests hold up.",
      es: "Ya en build interna o beta privada, ETA 30 días si los tests lo confirman.",
      de: "Bereits im internen Build oder in der privaten Beta, ETA 30 Tage, wenn die Tests standhalten.",
      pt: "Já em build interna ou beta privado, ETA 30 dias se os testes confirmarem.",
      fr: "Déjà en build interne ou en bêta privée, ETA 30 jours si les tests tiennent.",
      pl: "Juz w wewnetrznym build lub prywatnej becie, szacowany czas 30 dni jesli testy wytrzymaja.",
      tr: "Zaten dahili build veya özel betada, testler tutarsa tahmini süre 30 gün.",
      nl: "Al in interne build of privébèta, ETA 30 dagen als de tests slagen.",
      ja: "すでに内部ビルドまたはプライベートベータ中。テストが通れば30日以内にリリース予定。",
      ko: "이미 내부 빌드 또는 프라이빗 베타 중, 테스트가 통과하면 30일 내 출시 예정.",
      sv: "Redan i intern build eller privat beta, beräknad lansering om 30 dagar om testerna håller.",
      da: "Allerede i intern build eller privat beta, forventet om 30 dage hvis testene holder.",
      no: "Allerede i intern build eller privat beta, forventet om 30 dager hvis testene holder.",
      fi: "Jo sisäisessä versiossa tai suljetussa betassa, arvioitu valmistuminen 30 päivässä, jos testit onnistuvat.",
    },
    accent: "#21E6C1",
    items: [
      {
        status: "live",
        title: { it: "App iOS (Apple Salute)", en: "iOS app (Apple Health)", es: "App iOS (HealthKit)", de: "iOS-App (Apple Health)", pt: "App iOS (Apple Health)", fr: "App iOS (Apple Santé)", pl: "Aplikacja iOS (Apple Health)", tr: "iOS uygulamasi (Apple Health)", nl: "iOS-app (Apple Gezondheid)", ja: "iOSアプリ（Apple ヘルス）", ko: "iOS 앱 (Apple 건강)", sv: "iOS-app (Apple Health)", da: "iOS-app (Apple Health)", no: "iOS-app (Apple Health)", fi: "iOS-sovellus (Apple Health)" },
        desc: {
          it: "App per iPhone già live sull'App Store: legge Apple Salute e include un ponte che porta in Apple Salute i dati di Galaxy Watch e anello Colmi. Disponibile negli store supportati al di fuori dell'Unione Europea; il rilascio nei 27 paesi UE è in corso.",
          en: "iPhone app live on the App Store: reads Apple Health, plus a bridge that brings Galaxy Watch and Colmi ring data into Apple Health. Live in supported storefronts outside the European Union; the rollout in the 27 EU countries is in progress.",
          es: "App para iPhone ya disponible en el App Store: lee HealthKit y añade un puente que lleva los datos de Galaxy Watch y el anillo Colmi a HealthKit. Disponible en las tiendas compatibles fuera de la Unión Europea; el despliegue en los 27 países de la UE está en curso.",
          de: "iPhone-App live im App Store: liest aus Apple Health und bringt über eine Brücke Galaxy-Watch- und Colmi-Ring-Daten in Apple Health. Verfügbar in unterstützten Stores außerhalb der Europäischen Union; die Einführung in den 27 EU-Ländern läuft.",
          pt: "App para iPhone já disponível na App Store: lê o Apple Health e inclui uma ponte que leva os dados do Galaxy Watch e do anel Colmi para o Apple Health. Disponível nas lojas compatíveis fora da União Europeia; o lançamento nos 27 países da UE está em andamento.",
          fr: "Application iPhone en ligne sur l'App Store : lit Apple Santé et intègre un pont qui apporte les données Galaxy Watch et de la bague Colmi dans Apple Santé. Disponible dans les boutiques prises en charge en dehors de l'Union européenne ; le déploiement dans les 27 pays de l'UE est en cours.",
          pl: "Aplikacja na iPhone juz dostepna w App Store: odczytuje Apple Health oraz zawiera pomost przesylajacy dane Galaxy Watch i pierscienia Colmi do Apple Health. Dostepna w obslugiwanych sklepach poza Unia Europejska; wdrozenie w 27 krajach UE jest w toku.",
          tr: "iPhone uygulamasi App Store'da yayinda: Apple Health'ten okuma yapiyor ve Galaxy Watch ile Colmi yüzük verilerini Apple Health'e aktaran bir köprü içeriyor. Desteklenen magazalarda Avrupa Birligi disinda yayinda; AB'deki 27 ülkede kullanima acilma süreci sürüyor.",
          nl: "iPhone-app live in de App Store: leest Apple Gezondheid uit en bevat een brug die Galaxy Watch- en COLMI-ringdata naar Apple Gezondheid brengt. Beschikbaar in ondersteunde stores buiten de Europese Unie; de uitrol in de 27 EU-landen is bezig.",
          ja: "iPhone用アプリはApp Storeで公開中：Apple ヘルスを読み取り、Galaxy WatchおよびCOLMIリングのデータをApple ヘルスに連携するブリッジ機能も搭載。EU域外の対応ストアで利用可能。EU加盟27カ国への展開は進行中です。",
          ko: "iPhone 앱이 App Store에 정식 출시됨: Apple 건강 데이터를 읽고, Galaxy Watch 및 COLMI 링 데이터를 Apple 건강으로 연결하는 브리지도 포함. EU 역외의 지원되는 스토어에서 이용 가능하며, EU 27개국 출시는 진행 중입니다.",
          sv: "iPhone-appen är live i App Store: läser Apple Health samt har en brygga som för in data från Galaxy Watch och Colmi-ringar i Apple Health. Tillgänglig i stödda butiker utanför EU; utrullningen i de 27 EU-länderna pågår.",
          da: "iPhone-appen er live i App Store: læser Apple Health og har en bro, der bringer data fra Galaxy Watch og Colmi-ring ind i Apple Health. Tilgængelig i understøttede butikker uden for EU; udrulningen i de 27 EU-lande er i gang.",
          no: "iPhone-appen er live i App Store: leser Apple Health og har en bro som henter data fra Galaxy Watch og Colmi-ring inn i Apple Health. Tilgjengelig i støttede butikker utenfor EU; utrullingen i de 27 EU-landene pågår.",
          fi: "iPhone-sovellus on julkaistu App Storessa: lukee Apple Healthia ja sisältää sillan, joka tuo Galaxy Watchin ja Colmi-sormuksen tiedot Apple Healthiin. Saatavilla tuetuissa kaupoissa EU:n ulkopuolella; julkaisu 27 EU-maassa on käynnissä.",
        },
      },
      {
        status: "in-progress",
        title: { it: "Landing Pixel Watch dedicata", en: "Dedicated Pixel Watch landing", es: "Página dedicada a Pixel Watch", de: "Dedizierte Pixel Watch Landing Page", pt: "Landing page dedicada ao Pixel Watch", fr: "Page dédiée au Pixel Watch", pl: "Dedykowana strona dla Pixel Watch", tr: "Pixel Watch'a özel landing sayfasi", nl: "Speciale Pixel Watch-landingspagina", ja: "Pixel Watch専用ランディングページ", ko: "Pixel Watch 전용 랜딩 페이지", sv: "Egen landningssida för Pixel Watch", da: "Dedikeret Pixel Watch-landingsside", no: "Egen landingsside for Pixel Watch", fi: "Oma Pixel Watch -sivu" },
        desc: {
          it: "Pagina /sync/pixel-watch con setup guide specifico e troubleshooting Fitbit → Health Connect dedicato.",
          en: "Dedicated /sync/pixel-watch page with Pixel-specific setup guide and Fitbit → Health Connect troubleshooting.",
          es: "Página /sync/pixel-watch con guía de configuración específica para Pixel Watch y resolución de problemas con Fitbit → Health Connect.",
          de: "Seite /sync/pixel-watch mit Pixel-spezifischem Einrichtungsleitfaden und dedizierter Fehlerbehebung für Fitbit → Health Connect.",
          pt: "Página /sync/pixel-watch com guia de configuração específico para Pixel Watch e resolução de problemas do Fitbit → Health Connect.",
          fr: "Page /sync/pixel-watch avec un guide de configuration spécifique au Pixel Watch et un dépannage dédié Fitbit → Health Connect.",
          pl: "Dedykowana strona /sync/pixel-watch z przewodnikiem konfiguracji specyficznym dla Pixel Watch i rozwiazywaniem problemów Fitbit → Health Connect.",
          tr: "Pixel'e özgü kurulum kilavuzu ve Fitbit → Health Connect sorun giderme içeren özel /sync/pixel-watch sayfasi.",
          nl: "Pagina /sync/pixel-watch met specifieke installatiegids en toegewijde Fitbit → Health Connect-probleemoplossing.",
          ja: "/sync/pixel-watchページに、専用のセットアップガイドとFitbit → Health Connectのトラブルシューティングを追加。",
          ko: "/sync/pixel-watch 페이지에 전용 설정 가이드와 Fitbit → Health Connect 전용 문제 해결 추가.",
          sv: "Egen sida på /sync/pixel-watch med installationsguide specifik för Pixel och felsökning för Fitbit -> Health Connect.",
          da: "Dedikeret side på /sync/pixel-watch med Pixel-specifik opsætningsguide og fejlfinding for Fitbit -> Health Connect.",
          no: "Egen side på /sync/pixel-watch med oppsettsguide spesifikk for Pixel og feilsøking for Fitbit -> Health Connect.",
          fi: "Oma /sync/pixel-watch-sivu, jolla on Pixel-kohtainen käyttöönotto-opas ja Fitbit → Health Connect -vianmääritys.",
        },
      },
      {
        status: "in-progress",
        title: { it: "Fitbit — guida setup completa", en: "Fitbit — full setup guide", es: "Fitbit: guía de configuración completa", de: "Fitbit — vollständiger Einrichtungsleitfaden", pt: "Fitbit — guia de configuração completo", fr: "Fitbit — guide de configuration complet", pl: "Fitbit — pelny przewodnik konfiguracji", tr: "Fitbit — tam kurulum kilavuzu", nl: "Fitbit — volledige installatiegids", ja: "Fitbit — 完全セットアップガイド", ko: "Fitbit — 전체 설정 가이드", sv: "Fitbit – komplett installationsguide", da: "Fitbit – komplet opsætningsguide", no: "Fitbit -- fullstendig oppsettsguide", fi: "Fitbit – täydellinen käyttöönotto-opas" },
        desc: {
          it: "Onboarding passo-passo nell'app per attivare il bridge Fitbit → Health Connect, con verifica automatica dei permessi.",
          en: "Step-by-step in-app onboarding to enable the Fitbit → Health Connect bridge, with automatic permission check.",
          es: "Onboarding paso a paso dentro de la app para activar el puente Fitbit → Health Connect, con verificación automática de permisos.",
          de: "Schritt-für-Schritt-Onboarding in der App zum Aktivieren der Fitbit → Health Connect-Brücke, mit automatischer Berechtigungsprüfung.",
          pt: "Onboarding passo a passo dentro do app para ativar a ponte Fitbit → Health Connect, com verificação automática de permissões.",
          fr: "Onboarding pas à pas dans l'application pour activer le pont Fitbit → Health Connect, avec vérification automatique des autorisations.",
          pl: "Krok po kroku onboarding w aplikacji do wlaczenia mostu Fitbit → Health Connect z automatyczna weryfikacja uprawnien.",
          tr: "Fitbit → Health Connect köprüsünü etkinlestirmek icin otomatik izin kontrolü ile adim adim uygulama içi onboarding.",
          nl: "Stap-voor-stap onboarding in de app om de Fitbit → Health Connect-brug te activeren, met automatische rechtencontrole.",
          ja: "Fitbit → Health Connectブリッジを有効化するためのステップバイステップオンボーディング。権限の自動確認付き。",
          ko: "Fitbit → Health Connect 브리지를 활성화하는 앱 내 단계별 온보딩, 권한 자동 확인 포함.",
          sv: "Steg-för-steg-guide i appen för att aktivera bryggan Fitbit -> Health Connect, med automatisk kontroll av behörigheter.",
          da: "Trin-for-trin onboarding i appen for at aktivere broen Fitbit -> Health Connect, med automatisk tjek af tilladelser.",
          no: "Trinvis onboarding i appen for å aktivere Fitbit -> Health Connect-broen, med automatisk sjekk av tillatelser.",
          fi: "Vaiheittainen sovelluksen sisäinen opastus Fitbit → Health Connect -sillan käyttöönottoon, mukana automaattinen käyttöoikeuksien tarkistus.",
        },
      },
      {
        status: "in-progress",
        title: { it: "Attività mensile e annuale", en: "Monthly and yearly activity", es: "Actividad mensual y anual", de: "Monatliche und jährliche Aktivität", pt: "Atividade mensal e anual", fr: "Activité mensuelle et annuelle", pl: "Aktywnosc miesieczna i roczna", tr: "Aylik ve yillik aktivite", nl: "Maandelijkse en jaarlijkse activiteit", ja: "月次・年次アクティビティ", ko: "월간 및 연간 활동", sv: "Månads- och årsaktivitet", da: "Månedlig og årlig aktivitet", no: "Månedlig og årlig aktivitet", fi: "Kuukausi- ja vuositason aktiivisuus" },
        desc: {
          it: "Aggregazioni temporali oltre la settimana: heat map mensile, totali annuali per allenamento, confronto anno-su-anno.",
          en: "Time aggregations beyond the week: monthly heat map, yearly totals per workout, year-over-year comparison.",
          es: "Agregaciones temporales más allá de la semana: mapa de calor mensual, totales anuales por entrenamiento y comparativa año a año.",
          de: "Zeitaggregationen über die Woche hinaus: monatliche Heatmap, jährliche Gesamtwerte pro Training, Jahresvergleich.",
          pt: "Agregações temporais além da semana: mapa de calor mensal, totais anuais por treino, comparação ano a ano.",
          fr: "Agrégations temporelles au-delà de la semaine: carte de chaleur mensuelle, totaux annuels par séance, comparaison d'une année sur l'autre.",
          pl: "Agregacje czasowe poza tygodniem: miesieczna mapa ciepla, roczne podsumowania na trening, porównanie rok do roku.",
          tr: "Haftanin ötesinde zaman agregasyonlari: aylik isi haritasi, antrenman bazi yillik toplamlar, yillik karsilastirma.",
          nl: "Tijdaggregaties voorbij de week: maandelijkse heatmap, jaarlijkse totalen per training, vergelijking jaar op jaar.",
          ja: "週を超えた時間集計：月次ヒートマップ、トレーニング別年次合計、前年比較。",
          ko: "주 이상의 시간 집계: 월간 히트맵, 운동별 연간 합계, 전년 대비 비교.",
          sv: "Tidsöversikter bortom veckovyn: värmekarta per månad, årssummor per träningstyp och jämförelse år för år.",
          da: "Tidsopsummeringer ud over ugen: månedligt heatmap, årlige totaler pr. træningstype og år-til-år-sammenligning.",
          no: "Tidsaggregeringer utover uken: månedlig varmekart, årlige totaler per treningsøkt, sammenligning år for år.",
          fi: "Aikajaksot viikkoa pidemmälle: kuukausittainen lämpökartta, vuositason yhteismäärät treenityypeittäin ja vertailu vuosien välillä.",
        },
      },
      {
        status: "in-progress",
        title: { it: "IAP server-side verification", en: "Server-side IAP verification", es: "Verificación de compra en el servidor", de: "Serverseitige IAP-Verifizierung", pt: "Verificação de compra server-side", fr: "Vérification des achats côté serveur", pl: "Weryfikacja zakupów po stronie serwera", tr: "Sunucu tarafli satin alma dogrulamasi", nl: "IAP-verificatie aan serverzijde", ja: "サーバーサイドIAP検証", ko: "서버 사이드 IAP 검증", sv: "Serverbaserad IAP-verifiering", da: "Server-side verificering af køb i appen", no: "Serverside-verifisering av kjøp i appen", fi: "Palvelinpuolen IAP-vahvistus" },
        desc: {
          it: "Validazione Play Billing lato backend con Supabase Edge Functions per prevenire refund fraud e licenze multi-device sicure.",
          en: "Backend Play Billing validation via Supabase Edge Functions to prevent refund fraud and enable safe multi-device licensing.",
          es: "Validación de Play Billing en el backend para prevenir fraudes de reembolso y habilitar licencias seguras en varios dispositivos.",
          de: "Backend-Validierung von Play Billing über Supabase Edge Functions, um Rückerstattungsbetrug zu verhindern und sichere Multi-Geräte-Lizenzen zu ermöglichen.",
          pt: "Validação do Play Billing no backend via Supabase Edge Functions para prevenir fraudes de reembolso e habilitar licenças seguras em múltiplos dispositivos.",
          fr: "Validation du Play Billing côté backend via Supabase Edge Functions pour prévenir les fraudes aux remboursements et permettre des licences multi-appareils sécurisées.",
          pl: "Backendowa walidacja Play Billing przez Supabase Edge Functions, aby zapobiec oszustwom zwrotów i wlaczyc bezpieczne licencje na wiele urzadzen.",
          tr: "Iade dolandiriciligini önlemek ve güvenli çok cihazli lisanslama saglamak icin Supabase Edge Functions araciligiyla Play Billing backend dogrulamasi.",
          nl: "Play Billing-validatie aan de backend met Supabase Edge Functions om terugbetalingsfraude te voorkomen en veilige licenties voor meerdere apparaten.",
          ja: "Supabase Edge FunctionsによるPlay Billingバックエンド検証で、返金詐欺防止とマルチデバイスライセンスのセキュリティを確保。",
          ko: "Supabase Edge Functions를 사용한 백엔드 Play Billing 검증으로 환불 사기 방지 및 안전한 멀티 디바이스 라이선스.",
          sv: "Validering av Play Billing på backend via Supabase Edge Functions, för att förhindra återbetalningsbedrägerier och möjliggöra säker licensiering över flera enheter.",
          da: "Backend-validering af Play Billing via Supabase Edge Functions for at forhindre refusionssvindel og muliggøre sikker licensiering på tværs af enheder.",
          no: "Backend-validering av Play Billing via Supabase Edge Functions, for å forhindre refusjonssvindel og muliggjøre trygg lisensiering på tvers av flere enheter.",
          fi: "Play Billingin vahvistus taustajärjestelmässä Supabase Edge Functionsin kautta hyvityspetosten estämiseksi ja turvallisen usean laitteen lisensoinnin mahdollistamiseksi.",
        },
      },
      {
        status: "in-progress",
        title: { it: "Pressione arteriosa + glicemia", en: "Blood pressure + glucose", es: "Presión arterial + glucosa", de: "Blutdruck + Blutzucker", pt: "Pressão arterial + glicemia", fr: "Tension artérielle + glycémie", pl: "Cisnienie krwi + glukoza", tr: "Tansiyon + glikoz", nl: "Bloeddruk + bloedsuiker", ja: "血圧 + 血糖値", ko: "혈압 + 혈당", sv: "Blodtryck + blodsocker", da: "Blodtryk + blodsukker", no: "Blodtrykk + blodsukker", fi: "Verenpaine + verensokeri" },
        desc: {
          it: "Lettura BP (Withings BPM, Omron HC bridge) e glucose (Libre LinkUp dove disponibile via HC), con grafici dedicati.",
          en: "BP read (Withings BPM, Omron HC bridge) and glucose (Libre LinkUp where available via HC), with dedicated charts.",
          es: "Lectura de presión arterial (Withings BPM, puente Omron HC) y glucosa (Libre LinkUp donde esté disponible vía HC), con gráficas dedicadas.",
          de: "Blutdruck-Lesen (Withings BPM, Omron HC-Brücke) und Glukose (Libre LinkUp wo über HC verfügbar), mit dedizierten Diagrammen.",
          pt: "Leitura de pressão arterial (Withings BPM, ponte Omron HC) e glicose (Libre LinkUp onde disponível via HC), com gráficos dedicados.",
          fr: "Lecture de la tension artérielle (Withings BPM, pont Omron HC) et de la glycémie (Libre LinkUp où disponible via HC), avec des graphiques dédiés.",
          pl: "Odczyt cisnienia (Withings BPM, most Omron HC) i glukozy (Libre LinkUp tam gdzie dostepne przez HC) z dedykowanymi wykresami.",
          tr: "Tansiyon okuma (Withings BPM, Omron HC köprüsü) ve glikoz (HC üzerinden mevcut oldugunda Libre LinkUp), özel grafiklerle.",
          nl: "Uitlezen van BP (Withings BPM, Omron HC bridge) en glucose (Libre LinkUp waar beschikbaar via HC), met toegewijde grafieken.",
          ja: "BP（Withings BPM、Omron HCブリッジ）とグルコース（HC経由でLibre LinkUpが利用可能な場合）を読み取り、専用グラフで表示。",
          ko: "BP (Withings BPM, Omron HC 브리지) 및 혈당 (HC를 통해 Libre LinkUp이 가능한 경우) 읽기, 전용 차트 제공.",
          sv: "Blodtrycksavläsning (Withings BPM, Omron HC-brygga) och blodsocker (Libre LinkUp där tillgängligt via HC), med dedikerade diagram.",
          da: "Blodtryksaflæsning (Withings BPM, Omron HC-bro) og blodsukker (Libre LinkUp hvor tilgængeligt via HC), med dedikerede grafer.",
          no: "Blodtrykkavlesning (Withings BPM, Omron HC-bro) og blodsukker (Libre LinkUp der tilgjengelig via HC), med dedikerte grafer.",
          fi: "Verenpaineen luku (Withings BPM, Omron HC -silta) ja verensokeri (Libre LinkUp, jos saatavilla HC:n kautta), omilla kaavioilla.",
        },
      },
    ],
  },
  {
    id: "q3-2026",
    kicker: { it: "Q3 2026", en: "Q3 2026", es: "Q3 2026", de: "Q3 2026", pt: "Q3 2026", fr: "Q3 2026", pl: "Q3 2026", tr: "Q3 2026", nl: "Q3 2026", ja: "Q3 2026", ko: "Q3 2026", sv: "Q3 2026", da: "Q3 2026", no: "Q3 2026", fi: "Q3 2026" },
    title: { it: "Integrazioni OAuth native", en: "Native OAuth integrations", es: "Integraciones OAuth nativas", de: "Native OAuth-Integrationen", pt: "Integrações OAuth nativas", fr: "Intégrations OAuth natives", pl: "Natywne integracje OAuth", tr: "Yerel OAuth entegrasyonlari", nl: "Native OAuth-integraties", ja: "ネイティブOAuth連携", ko: "네이티브 OAuth 연동", sv: "Inbyggda OAuth-integrationer", da: "Native OAuth-integrationer", no: "Native OAuth-integrasjoner", fi: "Natiivit OAuth-integraatiot" },
    caption: {
      it: "Integrazioni che richiedono OAuth ufficiale e approvazione partner. Date soggette ai loro processi.",
      en: "Integrations that require official OAuth and partner approval. Dates subject to their processes.",
      es: "Integraciones que requieren OAuth oficial y aprobación del partner. Fechas sujetas a sus procesos.",
      de: "Integrationen, die offizielle OAuth-Genehmigung und Partner-Zustimmung erfordern. Termine abhängig von deren Prozessen.",
      pt: "Integrações que exigem OAuth oficial e aprovação do parceiro. Datas sujeitas aos processos deles.",
      fr: "Intégrations nécessitant un OAuth officiel et une approbation partenaire. Dates soumises à leurs processus.",
      pl: "Integracje wymagajace oficjalnego OAuth i zatwierdzenia przez partnera. Daty zaleza od ich procesów.",
      tr: "Resmi OAuth ve ortak onayı gerektiren entegrasyonlar. Tarihler onların süreçlerine göre degisebilir.",
      nl: "Integraties die officiële OAuth en partnergoedkeuring vereisen. Datums zijn afhankelijk van hun processen.",
      ja: "公式OAuthとパートナー承認が必要な連携。日程はパートナーのプロセスに依存します。",
      ko: "공식 OAuth 및 파트너 승인이 필요한 연동. 일정은 파트너 프로세스에 따릅니다.",
      sv: "Integrationer som kräver officiell OAuth och godkännande från partnern. Datum beror på deras processer.",
      da: "Integrationer, der kræver officiel OAuth og partnergodkendelse. Datoer afhænger af deres processer.",
      no: "Integrasjoner som krever offisiell OAuth-godkjenning fra partnerne. Datoene avhenger av deres prosesser.",
      fi: "Integraatiot, jotka edellyttävät virallista OAuthia ja kumppanin hyväksyntää. Aikataulut riippuvat heidän omista prosesseistaan.",
    },
    accent: "#38BDF8",
    items: [
      {
        status: "planned",
        title: { it: "Garmin Health API — OAuth", en: "Garmin Health API — OAuth", es: "Garmin Health API: OAuth", de: "Garmin Health API — OAuth", pt: "Garmin Health API — OAuth", fr: "Garmin Health API — OAuth", pl: "Garmin Health API — OAuth", tr: "Garmin Health API — OAuth", nl: "Garmin Health API — OAuth", ja: "Garmin Health API — OAuth", ko: "Garmin Health API — OAuth", sv: "Garmin Health API – OAuth", da: "Garmin Health API – OAuth", no: "Garmin Health API -- OAuth", fi: "Garmin Health API – OAuth" },
        desc: {
          it: "Body Battery, Training Load, Recovery Time, Stress Score, GPS dettagliato. In attesa di approvazione Garmin Developer Program.",
          en: "Body Battery, Training Load, Recovery Time, Stress Score, detailed GPS. Pending Garmin Developer Program approval.",
          es: "Body Battery, Training Load, Recovery Time, Stress Score y GPS detallado. Pendiente de aprobación del Garmin Developer Program.",
          de: "Body Battery, Training Load, Recovery Time, Stress Score, detailliertes GPS. Genehmigung des Garmin Developer Program ausstehend.",
          pt: "Body Battery, Training Load, Recovery Time, Stress Score, GPS detalhado. Aguardando aprovação do Garmin Developer Program.",
          fr: "Body Battery, Training Load, Recovery Time, Stress Score, GPS détaillé. En attente d'approbation du Garmin Developer Program.",
          pl: "Body Battery, Training Load, Recovery Time, Stress Score, szczególowy GPS. Oczekiwanie na zatwierdzenie przez Garmin Developer Program.",
          tr: "Body Battery, Training Load, Recovery Time, Stress Score, ayrintili GPS. Garmin Developer Program onayı bekleniyor.",
          nl: "Body Battery, trainingsbelasting, hersteltijd, stressscore, gedetailleerde GPS. In afwachting van goedkeuring Garmin Developer Program.",
          ja: "ボディバッテリー、トレーニング負荷、回復時間、ストレススコア、詳細GPS。Garmin Developer Program承認待ち。",
          ko: "Body Battery, 트레이닝 부하, 회복 시간, 스트레스 점수, 상세 GPS. Garmin Developer Program 승인 대기 중.",
          sv: "Body Battery, Training Load, Recovery Time, Stress Score, detaljerad GPS. Väntar på godkännande i Garmin Developer Program.",
          da: "Body Battery, Training Load, Recovery Time, Stress Score, detaljeret GPS. Afventer godkendelse fra Garmin Developer Program.",
          no: "Body Battery, Training Load, Recovery Time, Stress Score, detaljert GPS. Venter på godkjenning fra Garmin Developer Program.",
          fi: "Body Battery, Training Load, Recovery Time, Stress Score ja tarkka GPS. Odottaa Garmin Developer Programin hyväksyntää.",
        },
      },
      {
        status: "planned",
        title: { it: "Polar Accesslink — OAuth", en: "Polar Accesslink — OAuth", es: "Polar Accesslink: OAuth", de: "Polar Accesslink — OAuth", pt: "Polar Accesslink — OAuth", fr: "Polar Accesslink — OAuth", pl: "Polar Accesslink — OAuth", tr: "Polar Accesslink — OAuth", nl: "Polar Accesslink — OAuth", ja: "Polar Accesslink — OAuth", ko: "Polar Accesslink — OAuth", sv: "Polar Accesslink – OAuth", da: "Polar Accesslink – OAuth", no: "Polar Accesslink -- OAuth", fi: "Polar Accesslink – OAuth" },
        desc: {
          it: "Recovery Pro, Nightly Recharge, ZoneOptimizer e BPM secondo per secondo dai cardio H10. Beta waves a invito.",
          en: "Recovery Pro, Nightly Recharge, ZoneOptimizer and per-second heart rate from H10 chest straps. Invite-only beta waves.",
          es: "Recovery Pro, Nightly Recharge, ZoneOptimizer y frecuencia cardíaca segundo a segundo desde el H10. Betas por invitación.",
          de: "Recovery Pro, Nightly Recharge, ZoneOptimizer und sekundenweise Herzfrequenz vom H10-Brustgurt. Beta-Wellen nur auf Einladung.",
          pt: "Recovery Pro, Nightly Recharge, ZoneOptimizer e frequência cardíaca segundo a segundo dos sensores H10. Betas por convite.",
          fr: "Recovery Pro, Nightly Recharge, ZoneOptimizer et fréquence cardiaque seconde par seconde depuis le capteur H10. Bêta sur invitation uniquement.",
          pl: "Recovery Pro, Nightly Recharge, ZoneOptimizer i tetno co sekunde z pasków H10. Fale beta tylko na zaproszenie.",
          tr: "Recovery Pro, Nightly Recharge, ZoneOptimizer ve H10 gogüs bantlarindan saniyede bir kalp hizi. Yalnizca davetli beta dalgalari.",
          nl: "Recovery Pro, Nightly Recharge, ZoneOptimizer en seconde-voor-seconde BPM van cardio H10. Bèta op uitnodiging.",
          ja: "Recovery Pro、Nightly Recharge、ZoneOptimizer、H10カーディオの毎秒BPM。招待制ベータ。",
          ko: "Recovery Pro, Nightly Recharge, ZoneOptimizer 및 H10 카디오의 초당 BPM. 초대 기반 베타.",
          sv: "Recovery Pro, Nightly Recharge, ZoneOptimizer och puls per sekund från H10-bröstband. Betaomgångar endast på inbjudan.",
          da: "Recovery Pro, Nightly Recharge, ZoneOptimizer og puls pr. sekund fra H10-brystremme. Beta kun ved invitation.",
          no: "Recovery Pro, Nightly Recharge, ZoneOptimizer og puls per sekund fra H10-brystbelter. Beta kun på invitasjon, i bølger.",
          fi: "Recovery Pro, Nightly Recharge, ZoneOptimizer sekä sekuntikohtainen syke H10-sykevyöltä. Beta-aallot vain kutsulla.",
        },
      },
      {
        status: "planned",
        title: { it: "Oura Ring — OAuth", en: "Oura Ring — OAuth", es: "Oura Ring: OAuth", de: "Oura Ring — OAuth", pt: "Oura Ring — OAuth", fr: "Oura Ring — OAuth", pl: "Oura Ring — OAuth", tr: "Oura Ring — OAuth", nl: "Oura Ring — OAuth", ja: "Oura Ring — OAuth", ko: "Oura Ring — OAuth", sv: "Oura Ring – OAuth", da: "Oura Ring – OAuth", no: "Oura Ring -- OAuth", fi: "Oura Ring – OAuth" },
        desc: {
          it: "Readiness, Activity, HRV notturno, temperatura corporea. Particolarmente utile combinato a Galaxy Watch o Garmin.",
          en: "Readiness, Activity, overnight HRV, body temperature. Especially useful when combined with Galaxy Watch or Garmin.",
          es: "Readiness, Activity, HRV nocturno y temperatura corporal. Especialmente útil combinado con Galaxy Watch o Garmin.",
          de: "Readiness, Activity, nächtliche HRV, Körpertemperatur. Besonders nützlich in Kombination mit Galaxy Watch oder Garmin.",
          pt: "Readiness, Activity, HRV noturno, temperatura corporal. Especialmente útil combinado com Galaxy Watch ou Garmin.",
          fr: "Readiness, Activity, HRV nocturne, température corporelle. Particulièrement utile combiné à Galaxy Watch ou Garmin.",
          pl: "Readiness, Activity, nocny HRV, temperatura ciala. Szczególnie przydatne w polaczeniu z Galaxy Watch lub Garmin.",
          tr: "Readiness, Activity, gece HRV degeri, vücut sicakligi. Galaxy Watch veya Garmin ile birlikte kullanildiginda özellikle yararli.",
          nl: "Gereedheid, activiteit, nachtelijk HRV, lichaamstemperatuur. Bijzonder nuttig gecombineerd met Galaxy Watch of Garmin.",
          ja: "準備スコア、活動量、夜間HRV、体温。Galaxy WatchやGarminと組み合わせると特に有効。",
          ko: "준비도, 활동량, 야간 HRV, 체온. Galaxy Watch 또는 Garmin과 조합 시 특히 유용.",
          sv: "Readiness, Activity, HRV under natten, kroppstemperatur. Särskilt användbart i kombination med Galaxy Watch eller Garmin.",
          da: "Readiness, aktivitet, natlig HRV, kropstemperatur. Særligt nyttig i kombination med Galaxy Watch eller Garmin.",
          no: "Readiness, Activity, HRV om natten, kroppstemperatur. Spesielt nyttig i kombinasjon med Galaxy Watch eller Garmin.",
          fi: "Readiness, Activity, yöllinen HRV ja kehon lämpötila. Erityisen hyödyllinen yhdessä Galaxy Watchin tai Garminin kanssa.",
        },
      },
      {
        status: "planned",
        title: { it: "Withings — OAuth", en: "Withings — OAuth", es: "Withings: OAuth", de: "Withings — OAuth", pt: "Withings — OAuth", fr: "Withings — OAuth", pl: "Withings — OAuth", tr: "Withings — OAuth", nl: "Withings — OAuth", ja: "Withings — OAuth", ko: "Withings — OAuth", sv: "Withings – OAuth", da: "Withings – OAuth", no: "Withings -- OAuth", fi: "Withings – OAuth" },
        desc: {
          it: "ECG dettagliato + rilevamento FA, Sleep Mat con fasi, Pulse Wave Velocity, trend lungo periodo composizione corporea.",
          en: "Detailed ECG + AFib detection, Sleep Mat with stages, Pulse Wave Velocity, long-term body composition trends.",
          es: "ECG detallado + detección de fibrilación auricular, Sleep Mat con fases, Pulse Wave Velocity y tendencias de composición corporal a largo plazo.",
          de: "Detailliertes EKG + Vorhofflimmern-Erkennung, Sleep Mat mit Schlafphasen, Pulswellengeschwindigkeit, langfristige Trends zur Körperzusammensetzung.",
          pt: "ECG detalhado + detecção de fibrilação atrial, Sleep Mat com fases, Pulse Wave Velocity, tendências de composição corporal a longo prazo.",
          fr: "ECG détaillé + détection de fibrillation atriale, Sleep Mat avec phases, Pulse Wave Velocity, tendances de composition corporelle à long terme.",
          pl: "Szczególowe EKG + wykrywanie migotania przedsionków, Sleep Mat z fazami, Pulse Wave Velocity, dlugoterminowe trendy skladu ciala.",
          tr: "Ayrintili EKG + AFib tespiti, fazlari olan Sleep Mat, Nabiz Dalga Hizi, uzun vadeli vücut komposizyonu trendleri.",
          nl: "Gedetailleerd ECG + AF-detectie, slaapmat met fases, Pulse Wave Velocity, langetermijntrend lichaamssamenstelling.",
          ja: "詳細ECG＋AFib検出、睡眠マットのフェーズ、脈波速度、長期体組成トレンド。",
          ko: "상세 ECG + AFib 감지, 수면 매트 단계, 맥파 속도, 장기 체성분 트렌드.",
          sv: "Detaljerat EKG med förmaksflimmerdetektering, sömnmatta med sömnstadier, Pulse Wave Velocity och långsiktiga trender för kroppssammansättning.",
          da: "Detaljeret EKG + AFib-detektion, Sleep Mat med søvnstadier, Pulse Wave Velocity, langsigtede tendenser i kropssammensætning.",
          no: "Detaljert EKG med AFib-deteksjon, Sleep Mat med søvnstadier, Pulse Wave Velocity, langsiktige trender i kroppssammensetning.",
          fi: "Tarkka EKG + eteisvärinän tunnistus, Sleep Mat -unenseurantamatto univaiheineen, Pulse Wave Velocity sekä kehonkoostumuksen pitkän aikavälin trendit.",
        },
      },
    ],
  },
  {
    id: "future",
    kicker: { it: "Future · Esplorazione", en: "Future · Exploration", es: "Futuro · Exploración", de: "Future · Erkundung", pt: "Future · Exploração", fr: "Future · Exploration", pl: "Future · Eksploracja", tr: "Future · Kesfetme", nl: "Toekomst · Verkenning", ja: "未来 · 探索", ko: "미래 · 탐색", sv: "Framtid · Utforskas", da: "Fremtid · Udforskes", no: "Fremtid · Utforskning", fi: "Tulevaisuus · Selvityksessä" },
    title: { it: "Sul tavolo, da validare con voi", en: "On the table, to validate with you", es: "En estudio, para validar contigo", de: "Auf dem Tisch, mit euch zu validieren", pt: "Em análise, para validar com você", fr: "Sur la table, à valider avec vous", pl: "Na stole, do walidacji razem z wami", tr: "Masada, sizinle dogrulamak için", nl: "Op de agenda, te valideren met jullie", ja: "検討中、皆さんと一緒に検証したい", ko: "검토 중, 여러분과 함께 검증할 예정", sv: "På bordet, ska valideras tillsammans med dig", da: "På bordet – skal valideres sammen med dig", no: "På bordet, til vurdering sammen med deg", fi: "Harkinnassa – sinä olet mukana päättämässä" },
    caption: {
      it: "Direzioni che stiamo studiando. Mandaci feedback per pesarne la priorità.",
      en: "Directions we're studying. Send us feedback to weigh their priority.",
      es: "Líneas que estamos estudiando. Envíanos tu opinión para priorizar.",
      de: "Richtungen, die wir erkunden. Schickt uns Feedback, um die Priorität abzuwägen.",
      pt: "Direções que estamos estudando. Envie-nos seu feedback para avaliar a prioridade.",
      fr: "Des pistes que nous explorons. Envoyez-nous vos retours pour en évaluer la priorité.",
      pl: "Kierunki, które badamy. Wyslij nam opinie, aby pomóc ustelic priorytety.",
      tr: "Inceledigimiz yönler. Önceliklendirmemize yardimci olmak için geri bildirim gönderin.",
      nl: "Richtingen die we bestuderen. Stuur ons feedback om de prioriteit te bepalen.",
      ja: "研究中の方向性です。優先度を判断するためにフィードバックをお寄せください。",
      ko: "연구 중인 방향입니다. 우선순위 결정을 위해 피드백을 보내주세요.",
      sv: "Riktningar vi utforskar just nu. Skicka feedback till oss så hjälper det oss att prioritera.",
      da: "Retninger vi undersøger. Send os feedback, så hjælper det med at prioritere dem.",
      no: "Retninger vi undersøker. Send oss tilbakemelding for å påvirke prioriteringen.",
      fi: "Suuntia, joita tutkimme parhaillaan. Lähetä palautetta, niin priorisoimme niitä sen mukaan.",
    },
    accent: "#A78BFA",
    items: [
      {
        status: "exploration",
        title: { it: "Coros e Wahoo", en: "Coros and Wahoo", es: "Coros y Wahoo", de: "Coros und Wahoo", pt: "Coros e Wahoo", fr: "Coros et Wahoo", pl: "Coros i Wahoo", tr: "Coros ve Wahoo", nl: "Coros en Wahoo", ja: "Coros と Wahoo", ko: "Coros 및 Wahoo", sv: "Coros och Wahoo", da: "Coros og Wahoo", no: "Coros og Wahoo", fi: "Coros ja Wahoo" },
        desc: {
          it: "OAuth Coros Open API e Wahoo Cloud API per copertura ciclismo e ultra-endurance. Stiamo dimensionando volumi.",
          en: "Coros Open API and Wahoo Cloud API OAuth for cycling and ultra-endurance coverage. Sizing demand right now.",
          es: "OAuth con Coros Open API y Wahoo Cloud API para ciclismo y ultra-endurance. Estamos midiendo la demanda.",
          de: "OAuth mit Coros Open API und Wahoo Cloud API für Radsport und Ultra-Endurance-Abdeckung. Wir messen gerade den Bedarf.",
          pt: "OAuth com Coros Open API e Wahoo Cloud API para cobertura de ciclismo e ultra-endurance. Estamos dimensionando a demanda.",
          fr: "OAuth avec Coros Open API et Wahoo Cloud API pour la couverture cyclisme et ultra-endurance. Nous évaluons la demande en ce moment.",
          pl: "OAuth Coros Open API i Wahoo Cloud API dla pokrycia kolarstwa i ultra-wytrzymalosci. Obecnie mierzymy zapotrzebowanie.",
          tr: "Bisiklet ve ultra-dayaniklilik kapsamı icin Coros Open API ve Wahoo Cloud API OAuth. Su an talep olcüyoruz.",
          nl: "OAuth Coros Open API en Wahoo Cloud API voor fietsen en ultra-endurance. We bepalen de volumes.",
          ja: "サイクリングとウルトラエンデュランス向けにOAuth Coros Open APIとWahoo Cloud APIを統合予定。規模を確認中。",
          ko: "사이클링 및 울트라 지구력을 위한 OAuth Coros Open API 및 Wahoo Cloud API. 볼륨 규모를 검토 중.",
          sv: "Coros Open API och Wahoo Cloud API OAuth för täckning inom cykling och ultralångdistans. Vi undersöker efterfrågan just nu.",
          da: "Coros Open API og Wahoo Cloud API OAuth til dækning af cykling og ultra-udholdenhedssport. Vi undersøger efterspørgslen lige nu.",
          no: "Coros Open API og Wahoo Cloud API OAuth for dekning innen sykling og ultra-utholdenhet. Vi kartlegger etterspørselen nå.",
          fi: "Coros Open API ja Wahoo Cloud API OAuthin kautta pyöräilyn ja ultrakestävyyslajien tueksi. Kysyntää kartoitetaan parhaillaan.",
        },
      },
      {
        status: "exploration",
        title: { it: "Gruppo famiglia avanzato", en: "Advanced family group", es: "Grupo familiar avanzado", de: "Erweiterte Familiengruppe", pt: "Grupo familiar avançado", fr: "Groupe familial avancé", pl: "Zaawansowana grupa rodzinna", tr: "Gelismis aile grubu", nl: "Geavanceerde familiegroep", ja: "高度なファミリーグループ", ko: "고급 가족 그룹", sv: "Avancerad familjegrupp", da: "Avanceret familiegruppe", no: "Avansert familiegruppe", fi: "Kehittynyt perheryhmä" },
        desc: {
          it: "Condivisione dashboard con la famiglia, con permessi granulari per metrica e revoca istantanea.",
          en: "Dashboard sharing with your family, with granular per-metric permissions and instant revocation.",
          es: "Comparte tu panel con la familia, con permisos detallados por métrica y revocación instantánea.",
          de: "Dashboard-Freigabe für die ganze Familie, mit granularen Berechtigungen pro Messwert und sofortiger Widerrufsmöglichkeit.",
          pt: "Compartilhamento do painel com a família, com permissões detalhadas por métrica e revogação instantânea.",
          fr: "Partage du tableau de bord avec la famille, avec des autorisations détaillées par métrique et une révocation instantanée.",
          pl: "Udostepnianie panelu rodzinie, z granularnymi uprawnieniami dla kazdej metryki i natychmiastowym cofnieciem dostepu.",
          tr: "Ailenle panel paylasimi, metrik bazinda ayrintili izinler ve aninda iptal ile.",
          nl: "Dashboard delen met je familie, met gedetailleerde rechten per meetwaarde en directe intrekking.",
          ja: "家族とダッシュボードを共有。指標ごとの細かい権限設定と即時取り消しに対応。",
          ko: "가족과 대시보드를 공유하고, 지표별 세부 권한 설정과 즉시 취소 기능을 제공합니다.",
          sv: "Dela din dashboard med familjen, med detaljerade behörigheter per mätvärde och möjlighet att återkalla åtkomst direkt.",
          da: "Del dashboardet med din familie, med detaljerede tilladelser pr. måling og øjeblikkelig tilbagekaldelse.",
          no: "Del dashbordet med familien din, med detaljerte tillatelser per måleverdi og umiddelbar tilbaketrekking av tilgang.",
          fi: "Koontinäytön jakaminen perheen kesken tarkoilla, mittarikohtaisilla käyttöoikeuksilla ja mahdollisuudella perua pääsy välittömästi.",
        },
      },
      {
        status: "exploration",
        title: { it: "Export FIT", en: "FIT export", es: "Exportación FIT", de: "FIT-Export", pt: "Exportação FIT", fr: "Export FIT", pl: "Eksport FIT", tr: "FIT disa aktarma", nl: "Export FIT", ja: "FIT エクスポート", ko: "FIT 내보내기", sv: "FIT-export", da: "FIT-eksport", no: "FIT-eksport", fi: "FIT-vienti" },
        desc: {
          it: "L'export TCX e GPX per singola attività è già live come funzione Pro (Impostazioni > Esporta, condivisione più upload su Google Drive). Il formato FIT resta in attesa: stiamo verificando la licenza del formato prima di aggiungerlo.",
          en: "TCX and GPX export per workout already ships as a Pro feature (Settings > Export, share sheet and Google Drive upload). FIT is still pending: we're reviewing the format's license before adding it.",
          es: "La exportación TCX y GPX por actividad ya está disponible como función Pro (Ajustes > Exportar, hoja de compartir y subida a Google Drive). El formato FIT sigue pendiente: estamos revisando la licencia del formato antes de añadirlo.",
          de: "Der TCX- und GPX-Export pro Aktivität ist bereits als Pro-Funktion live (Einstellungen > Export, Teilen-Menü und Google-Drive-Upload). Das FIT-Format ist noch offen: Wir prüfen aktuell die Lizenz des Formats, bevor wir es hinzufügen.",
          pt: "A exportação TCX e GPX por atividade já está disponível como recurso Pro (Configurações > Exportar, menu de compartilhamento e upload para o Google Drive). O formato FIT ainda está pendente: estamos analisando a licença do formato antes de adicioná-lo.",
          fr: "L'export TCX et GPX par activité est déjà disponible en fonctionnalité Pro (Paramètres > Exporter, partage et envoi vers Google Drive). Le format FIT reste en attente : nous examinons la licence du format avant de l'ajouter.",
          pl: "Eksport TCX i GPX dla pojedynczej aktywnosci jest juz dostepny jako funkcja Pro (Ustawienia > Eksportuj, udostepnianie i przesylanie do Google Drive). Format FIT wciaz czeka: sprawdzamy licencje formatu, zanim go dodamy.",
          tr: "TCX ve GPX disa aktarma antrenman basina zaten Pro özellik olarak yayinda (Ayarlar > Disa Aktar, paylasim ve Google Drive'a yükleme). FIT formati hala bekliyor: eklemeden önce format lisansini inceliyoruz.",
          nl: "TCX- en GPX-export per activiteit is al live als Pro-functie (Instellingen > Exporteren, deelvenster en Google Drive-upload). Het FIT-formaat staat nog open: we bekijken de licentie van het formaat voordat we het toevoegen.",
          ja: "TCXとGPXのアクティビティ単位エクスポートは、Proの機能としてすでに公開されています（設定 > エクスポート、共有シートとGoogleドライブへのアップロード）。FIT形式は保留中です。追加する前にフォーマットのライセンスを確認しています。",
          ko: "TCX 및 GPX 활동별 내보내기는 이미 Pro 기능으로 제공됩니다 (설정 > 내보내기, 공유 시트 및 Google 드라이브 업로드). FIT 형식은 아직 보류 중입니다. 추가하기 전에 형식 라이선스를 검토하고 있습니다.",
          sv: "TCX- och GPX-export per aktivitet är redan en Pro-funktion (Inställningar > Exportera, delningsmeny och uppladdning till Google Drive). FIT-formatet väntar fortfarande: vi granskar formatets licens innan vi lägger till det.",
          da: "TCX- og GPX-eksport pr. aktivitet er allerede en Pro-funktion (Indstillinger > Eksporter, delingsmenu og upload til Google Drev). FIT-formatet afventer stadig: vi gennemgår formatets licens, før vi tilføjer det.",
          no: "TCX- og GPX-eksport per aktivitet er allerede en Pro-funksjon (Innstillinger > Eksporter, delingsmeny og opplasting til Google Disk). FIT-formatet venter fortsatt: vi vurderer lisensen for formatet før vi legger det til.",
          fi: "TCX- ja GPX-vienti treeneittäin on jo Pro-ominaisuus (Asetukset > Vie, jakovalikko ja lataus Google Driveen). FIT-muoto on yhä kesken: tarkistamme muodon lisenssin ennen sen lisäämistä.",
        },
      },
      {
        status: "exploration",
        title: { it: "Watch app companion", en: "Watch app companion", es: "App companion para el reloj", de: "Watch Companion-App", pt: "App companion para o relógio", fr: "Application companion pour la montre", pl: "Aplikacja towarzyszaca dla zegarka", tr: "Saat eslik uygulamasi", nl: "Watch companion-app", ja: "Watchコンパニオンアプリ", ko: "Watch 컴패니언 앱", sv: "Kompletterande klockapp", da: "Companion-app til smartwatch", no: "Companion-app for smartklokke", fi: "Kellosovellus" },
        desc: {
          it: "Tile Wear OS e watch face Galaxy con highlight giornaliero (passi vs target, HR, stato sync) direttamente al polso.",
          en: "Wear OS tile and Galaxy watch face with daily highlights (steps vs target, HR, sync status) right on your wrist.",
          es: "Tile para Wear OS y watch face para Galaxy con resumen diario (pasos vs objetivo, frecuencia cardíaca, estado de sincronización) directamente en tu muñeca.",
          de: "Wear OS-Tile und Galaxy Watch Face mit täglichen Highlights (Schritte vs. Ziel, Herzfrequenz, Synchronisierungsstatus) direkt am Handgelenk.",
          pt: "Tile para Wear OS e watch face Galaxy com destaques diários (passos vs meta, frequência cardíaca, status de sincronização) diretamente no pulso.",
          fr: "Tile Wear OS et watch face Galaxy avec les points forts quotidiens (pas vs objectif, fréquence cardiaque, statut de synchronisation) directement au poignet.",
          pl: "Kafelek Wear OS i tarcza zegarka Galaxy z codziennymi podsumowaniami (kroki vs cel, HR, status synchronizacji) bezposrednio na nadgarstku.",
          tr: "Wear OS kutusu ve Galaxy saat yüzü ile günlük öne çikartilanlar (adimlar hedefe karsi, HR, senkronizasyon durumu) bileginizde.",
          nl: "Wear OS-tegel en Galaxy watch face met dagelijks hoogtepunt (stappen vs doel, HR, synchronisatiestatus) rechtstreeks op je pols.",
          ja: "Wear OSタイルとGalaxy watch faceで日次ハイライト（歩数 vs 目標・HR・同期状態）を手首に直接表示。",
          ko: "Wear OS 타일 및 Galaxy watch face에 일간 하이라이트 (걸음 수 vs 목표, HR, 동기화 상태)를 바로 손목에 표시.",
          sv: "Wear OS-ruta och Galaxy-urtavla med dagens höjdpunkter (steg mot mål, puls, synkstatus) direkt på handleden.",
          da: "Wear OS-tile og Galaxy-urskive med daglige highlights (skridt vs. mål, puls, synkroniseringsstatus) lige på din håndled.",
          no: "Wear OS-flis og Galaxy-urskive med daglige høydepunkter (skritt mot mål, puls, synkroniseringsstatus) rett på håndleddet.",
          fi: "Wear OS -pikakuvake ja Galaxy-kellotaulu, jotka näyttävät päivän kohokohdat (askeleet tavoitteeseen verrattuna, syke, synkronoinnin tila) suoraan ranteessa.",
        },
      },
    ],
  },
];

/**
 * Short, citable "what is FitMesh Sync" sentence for the hero. Only rendered for
 * `COMPLETE_LOCALES` (see above) — it reuses the same `LocalizedText`/`tlr()`
 * pattern as COLUMNS, so it's naturally absent for the noindexed locales.
 */
const PRODUCT_DEFINITION: LocalizedText = {
  it: "FitMesh Sync è l'app privacy-first che unifica passi, frequenza cardiaca, sonno e allenamenti da Health Connect, Apple Salute, Galaxy Watch, Fitbit e anello Colmi in un'unica dashboard.",
  en: "FitMesh Sync is the privacy-first app that unifies steps, heart rate, sleep and workouts from Health Connect, Apple Health, Galaxy Watch, Fitbit and Colmi rings into one dashboard.",
  es: "FitMesh Sync es la app privacy-first que unifica pasos, frecuencia cardíaca, sueño y entrenamientos desde Health Connect, Apple Salud, Galaxy Watch, Fitbit y el anillo Colmi en un único panel.",
  de: "FitMesh Sync ist die datenschutzfreundliche App, die Schritte, Herzfrequenz, Schlaf und Trainings aus Health Connect, Apple Health, Galaxy Watch, Fitbit und dem Colmi-Ring in einem Dashboard vereint.",
  pt: "FitMesh Sync é o app privacy-first que unifica passos, frequência cardíaca, sono e treinos do Health Connect, Apple Saúde, Galaxy Watch, Fitbit e do anel Colmi em um único painel.",
  fr: "FitMesh Sync est l'application privacy-first qui réunit les pas, la fréquence cardiaque, le sommeil et les séances d'entraînement de Health Connect, Apple Santé, Galaxy Watch, Fitbit et de la bague Colmi dans un tableau de bord unique.",
  pl: "FitMesh Sync to aplikacja stawiająca na prywatność, która łączy kroki, tętno, sen i treningi z Health Connect, Apple Health, Galaxy Watch, Fitbit i pierścienia Colmi w jednym panelu.",
  tr: "FitMesh Sync; Health Connect, Apple Health, Galaxy Watch, Fitbit ve Colmi yüzüğünden gelen adım, kalp hızı, uyku ve antrenman verilerini tek bir panelde birleştiren gizlilik öncelikli uygulamadır.",
  nl: "FitMesh Sync is de privacy-first app die stappen, hartslag, slaap en trainingen van Health Connect, Apple Gezondheid, Galaxy Watch, Fitbit en de Colmi-ring samenbrengt in één dashboard.",
  ja: "FitMesh Syncは、Health Connect・Apple ヘルス・Galaxy Watch・Fitbit・COLMIリングの歩数・心拍数・睡眠・ワークアウトを一つのダッシュボードに統合する、プライバシー重視のアプリです。",
  ko: "FitMesh Sync는 Health Connect, Apple 건강, Galaxy Watch, Fitbit, Colmi 링의 걸음 수, 심박수, 수면, 운동 데이터를 하나의 대시보드로 통합하는 프라이버시 우선 앱입니다.",
  sv: "FitMesh Sync är den integritetsfokuserade appen som samlar steg, puls, sömn och träningspass från Health Connect, Apple Health, Galaxy Watch, Fitbit och Colmi-ringar i en gemensam dashboard.",
  da: "FitMesh Sync er den privatlivsfokuserede app, der samler skridt, puls, søvn og træning fra Health Connect, Apple Health, Galaxy Watch, Fitbit og Colmi-ringe i ét samlet dashboard.",
  no: "FitMesh Sync er appen med personvern i fokus som samler skritt, puls, søvn og treningsøkter fra Health Connect, Apple Health, Galaxy Watch, Fitbit og Colmi-ringer i ett dashbord.",
  fi: "FitMesh Sync on sovellus, joka asettaa yksityisyyden etusijalle ja kokoaa askeleet, sykkeen, unen ja treenit Health Connectista, Apple Healthista, Galaxy Watchista, Fitbitistä ja Colmi-sormuksista yhteen koontinäyttöön.",
};

/**
 * Hero/disclaimer/CTA copy previously scattered as inline `t(it, en, es?)`
 * calls (only 3 real locales) — extracted so all `COMPLETE_LOCALES` (all 15
 * site locales, sv/da/no/fi included) get real content here too, not just in
 * COLUMNS. Same `LocalizedText`/`tlr()` pattern as the rest of this file.
 */
const HERO_COPY: Record<string, LocalizedText> = {
  jsonLdName: { it: "Roadmap FitMesh Sync", en: "FitMesh Sync Roadmap", es: "Roadmap FitMesh Sync", de: "FitMesh Sync Roadmap", pt: "Roadmap FitMesh Sync", fr: "Feuille de route FitMesh Sync", pl: "Roadmapa FitMesh Sync", tr: "FitMesh Sync Yol Haritasi", nl: "FitMesh Sync Roadmap", ja: "FitMesh Sync ロードマップ", ko: "FitMesh Sync 로드맵", sv: "FitMesh Sync Roadmap", da: "FitMesh Sync Roadmap", no: "FitMesh Sync-veikart", fi: "FitMesh Sync -tiekartta" },
  breadcrumb: { it: "Roadmap", en: "Roadmap", es: "Roadmap", de: "Roadmap", pt: "Roadmap", fr: "Feuille de route", pl: "Roadmapa", tr: "Yol haritasi", nl: "Roadmap", ja: "ロードマップ", ko: "로드맵", sv: "Roadmap", da: "Roadmap", no: "Veikart", fi: "Tiekartta" },
  kicker: { it: "Roadmap pubblica", en: "Public roadmap", es: "Roadmap pública", de: "Öffentliche Roadmap", pt: "Roadmap pública", fr: "Feuille de route publique", pl: "Publiczna roadmapa", tr: "Herkese açik yol haritasi", nl: "Publieke roadmap", ja: "公開ロードマップ", ko: "공개 로드맵", sv: "Offentlig roadmap", da: "Offentlig roadmap", no: "Offentlig veikart", fi: "Julkinen tiekartta" },
  h1Prefix: { it: "Cosa è vivo, cosa arriva, ", en: "What's live, what's next, ", es: "Qué está disponible, qué llega, ", de: "Was live ist, was als Nächstes kommt, ", pt: "O que já está disponível, o que vem a seguir, ", fr: "Ce qui est en ligne, ce qui arrive, ", pl: "Co jest juz dostepne, co nadchodzi, ", tr: "Neyin yayinda oldugu, sirada ne oldugu, ", nl: "Wat er al is, wat eraan komt, ", ja: "今動いているもの、次に来るもの、", ko: "지금 제공되는 기능, 다음 계획, ", sv: "Vad som är live, vad som är på gång, ", da: "Det der er live, det der er på vej, ", no: "Hva som er live, hva som kommer, ", fi: "Mikä toimii jo, mikä on seuraavana, " },
  h1Accent: { it: "cosa stiamo esplorando.", en: "what we're exploring.", es: "qué estamos explorando.", de: "was wir erkunden.", pt: "o que estamos explorando.", fr: "ce que nous explorons.", pl: "co badamy.", tr: "neyi kesfettigimiz.", nl: "wat we aan het onderzoeken zijn.", ja: "検討中のこと。", ko: "그리고 검토 중인 것들.", sv: "vad vi utforskar.", da: "og det vi undersøger.", no: "hva vi utforsker.", fi: "mitä selvitämme parhaillaan." },
  heroParagraph: {
    it: "Roadmap in chiaro, aggiornata ogni sprint. Niente marketing-speak: solo lo stato reale di ogni integrazione e feature, con date ETA dove le abbiamo e onestà dove non le abbiamo.",
    en: "A clear roadmap, updated each sprint. No marketing-speak: just the real status of every integration and feature, with ETA dates where we have them and honesty where we don't.",
    es: "Una roadmap clara, actualizada cada sprint. Sin lenguaje de marketing: solo el estado real de cada integración y función, con fechas ETA cuando las tenemos y honestidad cuando no.",
    de: "Eine klare Roadmap, die bei jedem Sprint aktualisiert wird. Kein Marketing-Sprech: nur der reale Status jeder Integration und Funktion, mit ETA-Terminen, wo wir sie haben, und Ehrlichkeit, wo nicht.",
    pt: "Um roadmap claro, atualizado a cada sprint. Sem discurso de marketing: apenas o status real de cada integração e funcionalidade, com datas ETA quando as temos e honestidade quando não as temos.",
    fr: "Une feuille de route claire, mise à jour à chaque sprint. Pas de jargon marketing : juste le statut réel de chaque intégration et fonctionnalité, avec des dates ETA quand nous les avons et de l'honnêteté quand nous ne les avons pas.",
    pl: "Przejrzysta roadmapa, aktualizowana co sprint. Zero marketingowego zargonu: tylko rzeczywisty status kazdej integracji i funkcji, z datami ETA tam gdzie je znamy, i szczeroscia tam gdzie nie.",
    tr: "Her sprintte güncellenen net bir yol haritasi. Pazarlama dili yok: sadece her entegrasyon ve özelligin gerçek durumu, elimizde oldugunda ETA tarihleriyle, olmadiginda ise dürüstlükle.",
    nl: "Een duidelijke roadmap, elke sprint bijgewerkt. Geen marketingpraat: gewoon de echte status van elke integratie en functie, met streefdata waar we die hebben en eerlijkheid waar we die niet hebben.",
    ja: "分かりやすいロードマップを、スプリントごとに更新しています。誇大な宣伝文句は一切なし。すべての連携機能・機能について、実際の進捗状況をそのままお伝えします。目安の時期が分かっているものは日付を明記し、分からないものは正直に「未定」とお伝えします。",
    ko: "매 스프린트마다 업데이트되는 명확한 로드맵입니다. 마케팅 문구 없이, 모든 연동 기능과 기능의 실제 상태를 있는 그대로 전합니다. 예상 일정이 있으면 알려드리고, 없으면 없다고 솔직하게 말씀드립니다.",
    sv: "En tydlig roadmap, uppdaterad varje sprint. Inget marknadsföringssnack: bara den verkliga statusen för varje integration och funktion, med uppskattade datum där vi har dem och ärlighet där vi inte har det.",
    da: "En klar roadmap, som opdateres for hver sprint. Ingen marketingsnak: kun den reelle status for hver integration og funktion, med forventede datoer, hvor vi har dem, og ærlighed, hvor vi ikke har det.",
    no: "Et tydelig veikart, oppdatert hver sprint. Ingen markedsprat: bare den reelle statusen for hver integrasjon og funksjon, med forventede datoer der vi har dem, og ærlighet der vi ikke har det.",
    fi: "Selkeä tiekartta, joka päivittyy jokaisen sprintin jälkeen. Ei markkinointipuhetta – vain jokaisen integraation ja ominaisuuden todellinen tilanne, arvioidut aikataulut silloin kun niitä on, ja rehellisyys silloin kun niitä ei ole.",
  },
  disclaimerKicker: { it: "Disclaimer", en: "Disclaimer", es: "Aviso", de: "Haftungsausschluss", pt: "Aviso", fr: "Avertissement", pl: "Zastrzezenie", tr: "Uyari", nl: "Disclaimer", ja: "免責事項", ko: "유의사항", sv: "Ansvarsfriskrivning", da: "Forbehold", no: "Ansvarsfraskrivelse", fi: "Huomautus" },
  disclaimerBody: {
    it: "Le date \"Q3 / Q4 2026\" indicano la finestra di rilascio target. Alcune integrazioni dipendono da approvazioni partner (es. Garmin Developer Program, Huawei Health Kit) e possono slittare. Aggiorniamo questa pagina ogni sprint: se vedi qualcosa di obsoleto, scrivici.",
    en: "The \"Q3 / Q4 2026\" dates indicate target release windows. Some integrations depend on partner approvals (e.g. Garmin Developer Program, Huawei Health Kit) and may slip. We update this page each sprint: if anything looks stale, tell us.",
    es: "Las fechas \"Q3 / Q4 2026\" indican ventanas de lanzamiento objetivo. Algunas integraciones dependen de aprobaciones de partners (por ejemplo, Garmin Developer Program, Huawei Health Kit) y pueden retrasarse. Actualizamos esta página cada sprint: si ves algo desactualizado, escríbenos.",
    de: "Die Termine \"Q3 / Q4 2026\" geben die geplanten Veröffentlichungsfenster an. Einige Integrationen hängen von Partnergenehmigungen ab (z. B. Garmin Developer Program, Huawei Health Kit) und können sich verschieben. Wir aktualisieren diese Seite bei jedem Sprint: Wenn etwas veraltet wirkt, sag uns Bescheid.",
    pt: "As datas \"Q3 / Q4 2026\" indicam janelas de lançamento previstas. Algumas integrações dependem de aprovações de parceiros (ex. Garmin Developer Program, Huawei Health Kit) e podem atrasar. Atualizamos esta página a cada sprint: se algo parecer desatualizado, nos avise.",
    fr: "Les dates \"T3 / T4 2026\" indiquent des fenêtres de sortie cibles. Certaines intégrations dépendent d'approbations partenaires (ex. Garmin Developer Program, Huawei Health Kit) et peuvent glisser. Nous mettons à jour cette page à chaque sprint : si quelque chose semble obsolète, dites-le-nous.",
    pl: "Daty \"Q3 / Q4 2026\" oznaczaja docelowe okna wydania. Niektóre integracje zaleza od zatwierdzen partnerów (np. Garmin Developer Program, Huawei Health Kit) i moga sie przesunac. Aktualizujemy te strone co sprint: jesli cos wyglada na nieaktualne, daj nam znac.",
    tr: "\"Q3 / Q4 2026\" tarihleri hedef yayin pencerelerini gösterir. Bazi entegrasyonlar ortak onaylarina baglidir (örn. Garmin Developer Program, Huawei Health Kit) ve kayabilir. Bu sayfayi her sprintte güncelliyoruz: eskimis bir sey görürsen bize yaz.",
    nl: "De data \"Q3 / Q4 2026\" geven de beoogde releaseperiode aan. Sommige integraties zijn afhankelijk van goedkeuring door partners (bijv. Garmin Developer Program, Huawei Health Kit) en kunnen uitlopen. We werken deze pagina elke sprint bij: als iets verouderd lijkt, laat het ons weten.",
    ja: "「2026年第3四半期/第4四半期」という表記は、リリース予定の目安時期を示すものです。一部の連携機能はパートナーの承認(Garmin Developer ProgramやHuawei Health Kitなど)に依存しており、予定が後ろ倒しになる可能性があります。このページはスプリントごとに更新していますが、内容が古いと感じた場合はぜひご連絡ください。",
    ko: "\"2026년 3분기/4분기\"라는 표기는 목표 출시 시기를 의미합니다. 일부 연동 기능은 파트너 승인(예: Garmin Developer Program, Huawei Health Kit)에 따라 달라지며 일정이 늦어질 수 있습니다. 이 페이지는 매 스프린트마다 업데이트합니다. 내용이 오래된 것 같다면 알려주세요.",
    sv: "Datumen \"Q3/Q4 2026\" anger planerade lanseringsfönster. Vissa integrationer beror på godkännanden från partners (t.ex. Garmin Developer Program, Huawei Health Kit) och kan förskjutas. Vi uppdaterar den här sidan varje sprint: säg till om något verkar inaktuellt.",
    da: "Datoerne \"Q3/Q4 2026\" angiver forventede udgivelsesvinduer. Nogle integrationer afhænger af godkendelser fra partnere (f.eks. Garmin Developer Program, Huawei Health Kit) og kan blive forsinket. Vi opdaterer denne side hver sprint: hvis noget virker forældet, så sig til.",
    no: "Datoene «Q3 / Q4 2026» angir forventede lanseringsvinduer. Noen integrasjoner er avhengige av godkjenning fra partnere (f.eks. Garmin Developer Program, Huawei Health Kit) og kan bli forsinket. Vi oppdaterer denne siden hver sprint: hvis noe ser utdatert ut, si ifra.",
    fi: "\"Q3/Q4 2026\" -päivämäärät ovat tavoitteellisia julkaisuaikatauluja. Osa integraatioista riippuu kumppaneiden hyväksynnöistä (esim. Garmin Developer Program, Huawei Health Kit) ja voi siirtyä myöhemmäksi. Päivitämme tätä sivua jokaisen sprintin jälkeen – jos jokin tieto vaikuttaa vanhentuneelta, kerro meille.",
  },
  gdprLinkText: {
    it: "GDPR e dati fitness: dove finiscono i dati del tuo smartwatch",
    en: "GDPR and fitness data: where your smartwatch data ends up",
    es: "RGPD y datos de salud: adónde van los datos de tu smartwatch",
    de: "DSGVO und Fitnessdaten: wo die Daten deiner Smartwatch landen",
    pt: "GDPR e dados fitness: onde os dados do seu smartwatch acabam",
    fr: "RGPD et données fitness : où finissent les données de votre montre connectée",
    pl: "RODO i dane fitness: gdzie trafiaja dane Twojego smartwatcha",
    tr: "GDPR ve fitness verileri: akilli saat verileriniz nereye gidiyor",
    nl: "GDPR en fitnessdata: waar de data van je smartwatch terechtkomt",
    ja: "GDPRとフィットネスデータ:スマートウォッチのデータはどこへ行くのか",
    ko: "GDPR과 피트니스 데이터: 스마트워치 데이터는 어디로 가는가",
    sv: "GDPR och träningsdata: var din smartklocka-data hamnar",
    da: "GDPR og fitnessdata: hvor dine smartwatch-data ender",
    no: "GDPR og treningsdata: hvor dataene fra smartklokken din havner",
    fi: "GDPR ja kuntoilutiedot: minne älykellosi tiedot päätyvät",
  },
  ctaHeading: { it: "Manca qualcosa che ti serve?", en: "Missing something you need?", es: "¿Falta algo que necesitas?", de: "Fehlt dir etwas, das du brauchst?", pt: "Falta algo que você precisa?", fr: "Il manque quelque chose dont vous avez besoin ?", pl: "Brakuje czegos, czego potrzebujesz?", tr: "Ihtiyacin olan bir sey mi eksik?", nl: "Mis je iets wat je nodig hebt?", ja: "欲しい機能が見つかりませんか?", ko: "필요한 기능이 없나요?", sv: "Saknar du något du behöver?", da: "Mangler du noget, du har brug for?", no: "Savner du noe du trenger?", fi: "Puuttuuko jokin tarvitsemasi ominaisuus?" },
  ctaBody: {
    it: "Le richieste utente pesano sulla priorità delle prossime sprint. Scrivici cosa vorresti vedere e perché: leggiamo tutto.",
    en: "User requests drive the next sprint priorities. Tell us what you'd like to see and why: we read everything.",
    es: "Las peticiones de los usuarios influyen en la prioridad de los próximos sprints. Cuéntanos qué te gustaría ver y por qué: leemos todo.",
    de: "Nutzeranfragen beeinflussen die Prioritäten der nächsten Sprints. Sag uns, was du sehen möchtest und warum: wir lesen alles.",
    pt: "As solicitações dos usuários influenciam as prioridades dos próximos sprints. Diga-nos o que você gostaria de ver e por quê: lemos tudo.",
    fr: "Les demandes des utilisateurs influencent les priorités des prochains sprints. Dites-nous ce que vous aimeriez voir et pourquoi : nous lisons tout.",
    pl: "Prosby uzytkowników wplywaja na priorytety kolejnych sprintów. Napisz nam, co chcialbys zobaczyc i dlaczego: czytamy wszystko.",
    tr: "Kullanici talepleri bir sonraki sprint önceliklerini belirler. Ne görmek istediginizi ve nedenini yazin: her seyi okuyoruz.",
    nl: "Verzoeken van gebruikers bepalen de prioriteiten voor de volgende sprint. Laat ons weten wat je zou willen zien en waarom: we lezen alles.",
    ja: "次のスプリントの優先順位は、ユーザーからのリクエストによって決まります。どんな機能が欲しいか、その理由も含めてぜひ教えてください。すべてに目を通しています。",
    ko: "다음 스프린트의 우선순위는 사용자 요청으로 정해집니다. 원하시는 기능과 그 이유를 알려주세요. 모든 의견을 꼼꼼히 읽습니다.",
    sv: "Användarnas önskemål styr prioriteringarna för nästa sprint. Berätta vad du vill se och varför: vi läser allt.",
    da: "Brugernes ønsker styrer prioriteringerne i næste sprint. Fortæl os, hvad du gerne vil se, og hvorfor - vi læser alt.",
    no: "Brukerønsker styrer prioriteringene i neste sprint. Fortell oss hva du ønsker deg og hvorfor: vi leser alt.",
    fi: "Käyttäjien toiveet ohjaavat seuraavan sprintin prioriteetteja. Kerro meille, mitä haluaisit nähdä ja miksi – luemme kaiken.",
  },
  ctaSuggestButton: { it: "Suggerisci una feature", en: "Suggest a feature", es: "Sugiere una función", de: "Feature vorschlagen", pt: "Sugerir uma funcionalidade", fr: "Suggérer une fonctionnalité", pl: "Zasugeruj funkcje", tr: "Bir özellik öner", nl: "Stel een functie voor", ja: "機能をリクエストする", ko: "기능 제안하기", sv: "Föreslå en funktion", da: "Foreslå en funktion", no: "Foreslå en funksjon", fi: "Ehdota ominaisuutta" },
  ctaIntegrationsButton: { it: "Vedi tutte le integrazioni", en: "See all integrations", es: "Ver todas las integraciones", de: "Alle Integrationen ansehen", pt: "Ver todas as integrações", fr: "Voir toutes les intégrations", pl: "Zobacz wszystkie integracje", tr: "Tüm entegrasyonlari gör", nl: "Bekijk alle integraties", ja: "連携機能一覧を見る", ko: "모든 연동 기능 보기", sv: "Se alla integrationer", da: "Se alle integrationer", no: "Se alle integrasjoner", fi: "Katso kaikki integraatiot" },
};

const STATUS_BADGE: Record<RoadmapStatus, { it: string; en: string; es: string; de: string; pt: string; fr: string; pl: string; tr: string; nl: string; ja: string; ko: string; sv: string; da: string; no: string; fi: string; color: string }> = {
  live: { it: "Live", en: "Live", es: "Disponible", de: "Live", pt: "Disponível", fr: "Disponible", pl: "Live", tr: "Yayinda", nl: "Live", ja: "稼働中", ko: "실시간", sv: "Live", da: "Live", no: "Live", fi: "Käytössä", color: "#31E981" },
  "in-progress": { it: "In sviluppo", en: "In progress", es: "En desarrollo", de: "In Entwicklung", pt: "Em desenvolvimento", fr: "En développement", pl: "W trakcie", tr: "Devam ediyor", nl: "In ontwikkeling", ja: "開発中", ko: "개발 중", sv: "Pågår", da: "Under udvikling", no: "Under arbeid", fi: "Työn alla", color: "#21E6C1" },
  planned: { it: "Pianificato", en: "Planned", es: "Planificado", de: "Geplant", pt: "Planejado", fr: "Planifié", pl: "Zaplanowane", tr: "Planlanmis", nl: "Gepland", ja: "計画済み", ko: "예정됨", sv: "Planerad", da: "Planlagt", no: "Planlagt", fi: "Suunnitteilla", color: "#38BDF8" },
  exploration: { it: "Esplorazione", en: "Exploring", es: "Exploración", de: "Erkundung", pt: "Em exploração", fr: "En exploration", pl: "Eksploracja", tr: "Kesfediliyor", nl: "Verkenning", ja: "検討中", ko: "탐색 중", sv: "Utforskas", da: "Udforskes", no: "Under utforskning", fi: "Selvityksessä", color: "#A78BFA" },
};

export default async function RoadmapPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!locales.includes(locale as Locale)) notFound();
  const lc = locale as Locale;
  const path = `/${lc}/roadmap`;

  // ItemList JSON-LD — utile per AI search & rich results
  const itemListLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: tlr(HERO_COPY.jsonLdName, lc),
    url: `${SITE_URL}${path}`,
    inLanguage: schemaLanguage(lc),
    itemListElement: COLUMNS.flatMap((col, ci) =>
      col.items.map((it, ii) => ({
        "@type": "ListItem",
        position: ci * 100 + ii + 1,
        name: tlr(it.title, lc),
        description: tlr(it.desc, lc),
      })),
    ),
  };

  return (
    <>
      <JsonLd data={itemListLd} />
      <Breadcrumbs
        items={[{ name: tlr(HERO_COPY.breadcrumb, lc), path }]}
        locale={lc}
      />

      {/* HERO */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 pt-12 sm:pt-20 pb-12">
        <p className="text-[10px] uppercase tracking-[0.22em] text-brand-aqua font-semibold">
          {tlr(HERO_COPY.kicker, lc)}
        </p>
        <h1 className="mt-3 font-display text-display-xl font-semibold tracking-tightest text-text-primary max-w-3xl">
          {tlr(HERO_COPY.h1Prefix, lc)}
          <span className="text-brand-gradient">
            {tlr(HERO_COPY.h1Accent, lc)}
          </span>
        </h1>
        {COMPLETE_LOCALES.includes(lc) && (
          <p className="mt-5 text-base text-text-primary/90 max-w-2xl leading-relaxed font-medium">
            {tlr(PRODUCT_DEFINITION, lc)}
          </p>
        )}
        <p className="mt-6 text-lg text-text-secondary max-w-2xl leading-relaxed">
          {tlr(HERO_COPY.heroParagraph, lc)}
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
                {(b as Record<string, string>)[lc] ?? b.en}
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
                  {tlr(col.kicker, lc)}
                </p>
                <h2 className="mt-2 font-display text-xl sm:text-2xl font-semibold text-text-primary">
                  {tlr(col.title, lc)}
                </h2>
                <p className="mt-2 text-sm text-text-secondary leading-relaxed">
                  {tlr(col.caption, lc)}
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
                            {tlr(it.title, lc)}
                          </h3>
                          <span
                            className="text-[10px] uppercase tracking-wider font-semibold px-2 py-1 rounded-pill flex-shrink-0"
                            style={{
                              background: `${badge.color}15`,
                              color: badge.color,
                            }}
                          >
                            {(badge as Record<string, string>)[lc] ?? badge.en}
                          </span>
                        </div>
                        <p className="mt-2 text-sm text-text-secondary leading-relaxed">
                          {tlr(it.desc, lc)}
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
            {tlr(HERO_COPY.disclaimerKicker, lc)}
          </p>
          <p className="mt-3 text-sm text-text-secondary leading-relaxed">
            {tlr(HERO_COPY.disclaimerBody, lc)}
          </p>
          <Link
            href={`/${lc}/blog/${localizedBlogSlug("gdpr-dati-fitness-smartwatch", lc)}`}
            className="mt-5 inline-flex items-center gap-1.5 text-sm text-brand-aqua hover:text-brand-green transition group"
          >
            {tlr(HERO_COPY.gdprLinkText, lc)}
            <span className="transition-transform group-hover:translate-x-1">→</span>
          </Link>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-3xl mx-auto px-4 sm:px-6 pt-4 pb-20 text-center">
        <h2 className="font-display text-display font-semibold tracking-tightest text-text-primary">
          {tlr(HERO_COPY.ctaHeading, lc)}
        </h2>
        <p className="mt-4 text-text-secondary max-w-xl mx-auto">
          {tlr(HERO_COPY.ctaBody, lc)}
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <a
            href="mailto:hello@fitmesh.fit?subject=Roadmap%20request"
            className="inline-flex items-center px-6 py-3 rounded-pill btn-cta text-sm font-semibold"
          >
            {tlr(HERO_COPY.ctaSuggestButton, lc)}
          </a>
          <Link
            href={`/${lc}/integrations`}
            className="inline-flex items-center px-6 py-3 rounded-pill border border-divider text-text-primary font-medium hover:bg-white/5 transition"
          >
            {tlr(HERO_COPY.ctaIntegrationsButton, lc)}
          </Link>
        </div>
      </section>
    </>
  );
}
