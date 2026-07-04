import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { JsonLd } from "@/components/seo/JsonLd";
import { Breadcrumbs } from "@/components/seo/Breadcrumbs";
import { locales, type Locale, ogLocale, localeAlternates } from "@/lib/i18n";
import { localizedBlogSlug } from "@/lib/blog/slug-i18n";

const SITE_URL = "https://www.fitmesh.fit";

/**
 * Locales with fully translated body content on this page (COLUMNS/STATUS_BADGE
 * below, accessed via the `tlr()` helper). `sv`/`da`/`no`/`fi` aren't part of the
 * `LocalizedText` type at all — they silently fall back to English body copy via
 * `tlr()`'s `text[lc] ?? text.en` — so they must stay out of the index.
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

type LocalizedText = Record<"it" | "en" | "es" | "de" | "pt" | "fr" | "pl" | "tr", string> & Partial<Record<"nl" | "ja" | "ko", string>>;
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
    kicker: { it: "Now · In produzione", en: "Now · Shipping", es: "Ahora · En producción", de: "Now · Im Betrieb", pt: "Now · Em produção", fr: "Now · En production", pl: "Now · W produkcji", tr: "Now · Yayinda", nl: "Nu · In productie", ja: "現在 · 本番稼働中", ko: "현재 · 프로덕션 중" },
    title: { it: "Vivo e in mano agli utenti", en: "Live with users today", es: "Disponible para los usuarios hoy", de: "Live und in den Händen der Nutzer", pt: "Disponível para os usuários hoje", fr: "Disponible pour les utilisateurs aujourd'hui", pl: "Dostepne dla uzytkowników juz dzis", tr: "Bugün kullanicilara açik", nl: "Live en in handen van de gebruikers", ja: "ライブでユーザーの手元に", ko: "라이브로 사용자 손에" },
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
        },
      },
      {
        status: "live",
        title: { it: "Samsung Health + Galaxy Watch", en: "Samsung Health + Galaxy Watch", es: "Samsung Health + Galaxy Watch", de: "Samsung Health + Galaxy Watch", pt: "Samsung Health + Galaxy Watch", fr: "Samsung Health + Galaxy Watch", pl: "Samsung Health + Galaxy Watch", tr: "Samsung Health + Galaxy Watch", nl: "Samsung Health + Galaxy Watch", ja: "Samsung Health + Galaxy Watch", ko: "Samsung Health + Galaxy Watch" },
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
        },
      },
      {
        status: "live",
        title: { it: "Dashboard web nativa", en: "Native web dashboard", es: "Panel web nativo", de: "Native Web-Dashboard", pt: "Painel web nativo", fr: "Tableau de bord web natif", pl: "Natywny panel webowy", tr: "Yerel web paneli", nl: "Natief webdashboard", ja: "ネイティブWebダッシュボード", ko: "네이티브 웹 대시보드" },
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
        },
      },
      {
        status: "live",
        title: { it: "Export GDPR — JSON + CSV", en: "GDPR export — JSON + CSV", es: "Exportación GDPR: JSON + CSV", de: "DSGVO-Export — JSON + CSV", pt: "Exportação LGPD/GDPR — JSON + CSV", fr: "Export RGPD — JSON + CSV", pl: "Eksport RODO — JSON + CSV", tr: "KVKK/GDPR disa aktarma — JSON + CSV", nl: "GDPR-export — JSON + CSV", ja: "GDPRエクスポート — JSON + CSV", ko: "GDPR 내보내기 — JSON + CSV" },
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
        },
      },
      {
        status: "live",
        title: { it: "Notifiche push FCM", en: "FCM push notifications", es: "Notificaciones push", de: "FCM-Push-Benachrichtigungen", pt: "Notificações push FCM", fr: "Notifications push FCM", pl: "Powiadomienia push FCM", tr: "FCM anlık bildirimleri", nl: "FCM-pushmeldingen", ja: "FCMプッシュ通知", ko: "FCM 푸시 알림" },
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
        },
      },
      {
        status: "live",
        title: { it: "Trial gratuito 7 giorni", en: "7-day free trial", es: "Prueba gratuita de 7 días", de: "7-Tage-Gratistest", pt: "Teste grátis de 7 dias", fr: "Essai gratuit de 7 jours", pl: "7-dniowy bezplatny okres próbny", tr: "7 günlük ücretsiz deneme", nl: "Gratis proefperiode van 7 dagen", ja: "7日間無料トライアル", ko: "7일 무료 체험" },
        desc: {
          it: "Una settimana per provare tutto senza inserire dati di pagamento. Acquisto unico da €3,99 al termine, niente subscription.",
          en: "One week to try everything without entering payment details. One-time from €3.99 after, no subscription.",
          es: "Una semana para probarlo todo sin introducir datos de pago. Pago único desde €3,99 al terminar, sin suscripción.",
          de: "Eine Woche, um alles auszuprobieren, ohne Zahlungsdaten anzugeben. Danach Einmalkauf ab €3,99, kein Abonnement.",
          pt: "Uma semana para experimentar tudo sem informar dados de pagamento. Compra única a partir de €3,99 ao final, sem assinatura.",
          fr: "Une semaine pour tout essayer sans saisir vos coordonnées bancaires. Achat unique à partir de €3,99 ensuite, sans abonnement.",
          pl: "Tydzien na wypróbowanie wszystkiego bez podawania danych platnosci. Jednorazowy zakup od €3,99 po zakonczeniu, bez subskrypcji.",
          tr: "Ödeme bilgisi girmeden her seyi denemek icin bir hafta. Sonrasinda €3,99'dan baslayan tek seferlik satin alma, abonelik yok.",
          nl: "Een week alles uitproberen zonder betalingsgegevens in te voeren. Eenmalige aankoop van €3,99 achteraf, geen abonnement.",
          ja: "支払い情報不要で1週間すべての機能を試せます。終了後は€3,99の買い切り、サブスクリプションなし。",
          ko: "결제 정보 입력 없이 일주일 동안 모든 기능 체험. 이후 €3,99 일회성 구매, 구독 없음.",
        },
      },
    ],
  },
  {
    id: "next-30",
    kicker: { it: "Next · 30 giorni", en: "Next · 30 days", es: "Próximo · 30 días", de: "Next · 30 Tage", pt: "Next · 30 dias", fr: "Next · 30 jours", pl: "Next · 30 dni", tr: "Next · 30 gün", nl: "Volgende · 30 dagen", ja: "次 · 30日以内", ko: "다음 · 30일" },
    title: { it: "In rilascio prossimo sprint", en: "Shipping next sprint", es: "Disponible en el próximo sprint", de: "Veröffentlichung im nächsten Sprint", pt: "Lançamento no próximo sprint", fr: "Disponible au prochain sprint", pl: "Wydanie w nastepnym sprincie", tr: "Sonraki sprintte yayinlanacak", nl: "Binnenkort in de volgende sprint", ja: "次のスプリントでリリース予定", ko: "다음 스프린트에 출시 예정" },
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
    },
    accent: "#21E6C1",
    items: [
      {
        status: "in-progress",
        title: { it: "App iOS (Apple Salute)", en: "iOS app (Apple Health)", es: "App iOS (HealthKit)", de: "iOS-App (Apple Health)", pt: "App iOS (Apple Health)", fr: "App iOS (Apple Santé)", pl: "Aplikacja iOS (Apple Health)", tr: "iOS uygulamasi (Apple Health)", nl: "iOS-app (Apple Gezondheid)", ja: "iOSアプリ（Apple ヘルス）", ko: "iOS 앱 (Apple 건강)" },
        desc: {
          it: "App per iPhone pronta: lettura Apple Salute e un ponte che porta in Apple Salute i dati di Galaxy Watch e anello Colmi. Lancio su App Store imminente.",
          en: "iPhone app ready: Apple Health read, plus a bridge that brings Galaxy Watch and Colmi ring data into Apple Health. App Store launch imminent.",
          es: "App para iPhone lista: lectura de HealthKit y un puente que lleva los datos de Galaxy Watch y el anillo Colmi a HealthKit. Lanzamiento en el App Store inminente.",
          de: "iPhone-App bereit: Lesen aus Apple Health und eine Brücke, die Galaxy Watch- und Colmi-Ring-Daten in Apple Health überträgt. App Store-Start steht unmittelbar bevor.",
          pt: "App para iPhone pronta: leitura do Apple Health e uma ponte que leva os dados do Galaxy Watch e do anel Colmi para o Apple Health. Lançamento no App Store iminente.",
          fr: "Application iPhone prête: lecture d'Apple Santé et un pont qui apporte les données Galaxy Watch et de la bague Colmi dans Apple Santé. Lancement sur l'App Store imminent.",
          pl: "Aplikacja na iPhone gotowa: odczyt Apple Health oraz pomost przesylajacy dane Galaxy Watch i pierscienia Colmi do Apple Health. Premiera w App Store juz niedlugo.",
          tr: "iPhone uygulamasi hazir: Apple Health okuma ve Galaxy Watch ile Colmi yüzük verilerini Apple Health'e aktaran bir köprü. App Store lansmaní yakindir.",
          nl: "iPhone-app klaar: uitlezen van Apple Gezondheid en een brug die Galaxy Watch- en COLMI-ringdata naar Apple Gezondheid brengt. Lancering op App Store nakend.",
          ja: "iPhone用アプリ準備完了：Apple ヘルスの読み取りと、Galaxy WatchおよびCOLMIリングのデータをApple ヘルスに連携するブリッジ機能。App Storeへの近日リリース予定。",
          ko: "iPhone 앱 준비 완료: Apple 건강 읽기와 Galaxy Watch 및 COLMI 링 데이터를 Apple 건강으로 연결하는 브리지. App Store 출시 임박.",
        },
      },
      {
        status: "in-progress",
        title: { it: "Landing Pixel Watch dedicata", en: "Dedicated Pixel Watch landing", es: "Página dedicada a Pixel Watch", de: "Dedizierte Pixel Watch Landing Page", pt: "Landing page dedicada ao Pixel Watch", fr: "Page dédiée au Pixel Watch", pl: "Dedykowana strona dla Pixel Watch", tr: "Pixel Watch'a özel landing sayfasi", nl: "Speciale Pixel Watch-landingspagina", ja: "Pixel Watch専用ランディングページ", ko: "Pixel Watch 전용 랜딩 페이지" },
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
        },
      },
      {
        status: "in-progress",
        title: { it: "Fitbit — guida setup completa", en: "Fitbit — full setup guide", es: "Fitbit: guía de configuración completa", de: "Fitbit — vollständiger Einrichtungsleitfaden", pt: "Fitbit — guia de configuração completo", fr: "Fitbit — guide de configuration complet", pl: "Fitbit — pelny przewodnik konfiguracji", tr: "Fitbit — tam kurulum kilavuzu", nl: "Fitbit — volledige installatiegids", ja: "Fitbit — 完全セットアップガイド", ko: "Fitbit — 전체 설정 가이드" },
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
        },
      },
      {
        status: "in-progress",
        title: { it: "Attività mensile e annuale", en: "Monthly and yearly activity", es: "Actividad mensual y anual", de: "Monatliche und jährliche Aktivität", pt: "Atividade mensal e anual", fr: "Activité mensuelle et annuelle", pl: "Aktywnosc miesieczna i roczna", tr: "Aylik ve yillik aktivite", nl: "Maandelijkse en jaarlijkse activiteit", ja: "月次・年次アクティビティ", ko: "월간 및 연간 활동" },
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
        },
      },
      {
        status: "in-progress",
        title: { it: "IAP server-side verification", en: "Server-side IAP verification", es: "Verificación de compra en el servidor", de: "Serverseitige IAP-Verifizierung", pt: "Verificação de compra server-side", fr: "Vérification des achats côté serveur", pl: "Weryfikacja zakupów po stronie serwera", tr: "Sunucu tarafli satin alma dogrulamasi", nl: "IAP-verificatie aan serverzijde", ja: "サーバーサイドIAP検証", ko: "서버 사이드 IAP 검증" },
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
        },
      },
      {
        status: "in-progress",
        title: { it: "Pressione arteriosa + glicemia", en: "Blood pressure + glucose", es: "Presión arterial + glucosa", de: "Blutdruck + Blutzucker", pt: "Pressão arterial + glicemia", fr: "Tension artérielle + glycémie", pl: "Cisnienie krwi + glukoza", tr: "Tansiyon + glikoz", nl: "Bloeddruk + bloedsuiker", ja: "血圧 + 血糖値", ko: "혈압 + 혈당" },
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
        },
      },
    ],
  },
  {
    id: "q3-2026",
    kicker: { it: "Q3 2026", en: "Q3 2026", es: "Q3 2026", de: "Q3 2026", pt: "Q3 2026", fr: "Q3 2026", pl: "Q3 2026", tr: "Q3 2026", nl: "Q3 2026", ja: "Q3 2026", ko: "Q3 2026" },
    title: { it: "Integrazioni OAuth native", en: "Native OAuth integrations", es: "Integraciones OAuth nativas", de: "Native OAuth-Integrationen", pt: "Integrações OAuth nativas", fr: "Intégrations OAuth natives", pl: "Natywne integracje OAuth", tr: "Yerel OAuth entegrasyonlari", nl: "Native OAuth-integraties", ja: "ネイティブOAuth連携", ko: "네이티브 OAuth 연동" },
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
    },
    accent: "#38BDF8",
    items: [
      {
        status: "planned",
        title: { it: "Garmin Health API — OAuth", en: "Garmin Health API — OAuth", es: "Garmin Health API: OAuth", de: "Garmin Health API — OAuth", pt: "Garmin Health API — OAuth", fr: "Garmin Health API — OAuth", pl: "Garmin Health API — OAuth", tr: "Garmin Health API — OAuth", nl: "Garmin Health API — OAuth", ja: "Garmin Health API — OAuth", ko: "Garmin Health API — OAuth" },
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
        },
      },
      {
        status: "planned",
        title: { it: "Polar Accesslink — OAuth", en: "Polar Accesslink — OAuth", es: "Polar Accesslink: OAuth", de: "Polar Accesslink — OAuth", pt: "Polar Accesslink — OAuth", fr: "Polar Accesslink — OAuth", pl: "Polar Accesslink — OAuth", tr: "Polar Accesslink — OAuth", nl: "Polar Accesslink — OAuth", ja: "Polar Accesslink — OAuth", ko: "Polar Accesslink — OAuth" },
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
        },
      },
      {
        status: "planned",
        title: { it: "Oura Ring — OAuth", en: "Oura Ring — OAuth", es: "Oura Ring: OAuth", de: "Oura Ring — OAuth", pt: "Oura Ring — OAuth", fr: "Oura Ring — OAuth", pl: "Oura Ring — OAuth", tr: "Oura Ring — OAuth", nl: "Oura Ring — OAuth", ja: "Oura Ring — OAuth", ko: "Oura Ring — OAuth" },
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
        },
      },
      {
        status: "planned",
        title: { it: "Withings — OAuth", en: "Withings — OAuth", es: "Withings: OAuth", de: "Withings — OAuth", pt: "Withings — OAuth", fr: "Withings — OAuth", pl: "Withings — OAuth", tr: "Withings — OAuth", nl: "Withings — OAuth", ja: "Withings — OAuth", ko: "Withings — OAuth" },
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
        },
      },
    ],
  },
  {
    id: "future",
    kicker: { it: "Future · Esplorazione", en: "Future · Exploration", es: "Futuro · Exploración", de: "Future · Erkundung", pt: "Future · Exploração", fr: "Future · Exploration", pl: "Future · Eksploracja", tr: "Future · Kesfetme", nl: "Toekomst · Verkenning", ja: "未来 · 探索", ko: "미래 · 탐색" },
    title: { it: "Sul tavolo, da validare con voi", en: "On the table, to validate with you", es: "En estudio, para validar contigo", de: "Auf dem Tisch, mit euch zu validieren", pt: "Em análise, para validar com você", fr: "Sur la table, à valider avec vous", pl: "Na stole, do walidacji razem z wami", tr: "Masada, sizinle dogrulamak için", nl: "Op de agenda, te valideren met jullie", ja: "検討中、皆さんと一緒に検証したい", ko: "검토 중, 여러분과 함께 검증할 예정" },
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
    },
    accent: "#A78BFA",
    items: [
      {
        status: "exploration",
        title: { it: "Coros e Wahoo", en: "Coros and Wahoo", es: "Coros y Wahoo", de: "Coros und Wahoo", pt: "Coros e Wahoo", fr: "Coros et Wahoo", pl: "Coros i Wahoo", tr: "Coros ve Wahoo", nl: "Coros en Wahoo", ja: "Coros と Wahoo", ko: "Coros 및 Wahoo" },
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
        },
      },
      {
        status: "exploration",
        title: { it: "Gruppo famiglia avanzato", en: "Advanced family group", es: "Grupo familiar + modo cuidadores", de: "Familiengruppe + Betreuungsmodus", pt: "Grupo familiar + modo cuidadores", fr: "Groupe familial + mode aidants", pl: "Mesh Rodzina + tryb opiekuna", tr: "Mesh Aile + bakim modu", nl: "Familiegroep + mantelzorgmodus", ja: "ファミリーグループ＋介護者モード", ko: "가족 그룹 + 돌봄 모드" },
        desc: {
          it: "Condivisione dashboard con la famiglia, con permessi granulari per metrica e revoca istantanea.",
          en: "Dashboard sharing with your family, with granular per-metric permissions and instant revocation.",
          es: "Compartir el panel con personas de confianza (familiares, cuidadores) con permisos detallados y revocación instantánea.",
          de: "Eingeschränkte Dashboard-Freigabe für Vertrauenspersonen (Eltern, Betreuungspersonen) mit granularen Berechtigungen und sofortiger Widerrufsmöglichkeit.",
          pt: "Compartilhamento limitado do painel com pessoas de confiança (pais, cuidadores) via permissões granulares e revogação instantânea.",
          fr: "Partage limité du tableau de bord avec des personnes de confiance (parents, aidants) via des autorisations granulaires et une révocation instantanée.",
          pl: "Ograniczone udostepnianie panelu zaufanym osobom (rodzicom, opiekunom) z granularnymi uprawnieniami i natychmiastowym odwolaniem dostepu.",
          tr: "Güvenilir kisilerle (ebeveynler, bakicilar) ayrintili izinler ve aninda iptal ile sinirli panel paylasimu.",
          nl: "Beperkt dashboard delen met vertrouwde personen (ouders, mantelzorgers) met gedetailleerde rechten en directe intrekking.",
          ja: "信頼できる人（親・介護者）との限定的なダッシュボード共有。細かい権限設定と即時取り消し機能付き。",
          ko: "신뢰할 수 있는 사람 (부모, 돌봄 제공자)과의 제한적인 대시보드 공유, 세부 권한 설정 및 즉시 취소 가능.",
        },
      },
      {
        status: "exploration",
        title: { it: "Export FIT / TCX / GPX", en: "FIT / TCX / GPX export", es: "Exportación FIT / TCX / GPX", de: "FIT / TCX / GPX-Export", pt: "Exportação FIT / TCX / GPX", fr: "Export FIT / TCX / GPX", pl: "Eksport FIT / TCX / GPX", tr: "FIT / TCX / GPX disa aktarma", nl: "Export FIT / TCX / GPX", ja: "FIT / TCX / GPX エクスポート", ko: "FIT / TCX / GPX 내보내기" },
        desc: {
          it: "Esportazione singole attività in formati standard fitness, utili per re-importare in Strava, Garmin Connect, TrainingPeaks.",
          en: "Export individual activities in standard fitness formats, useful for re-importing into Strava, Garmin Connect, TrainingPeaks.",
          es: "Exporta actividades individuales en formatos fitness estándar, útiles para reimportarlas en Strava, Garmin Connect o TrainingPeaks.",
          de: "Export einzelner Aktivitäten in Standard-Fitness-Formate, nützlich für den Re-Import in Strava, Garmin Connect oder TrainingPeaks.",
          pt: "Exportação de atividades individuais em formatos fitness padrão, úteis para reimportar no Strava, Garmin Connect ou TrainingPeaks.",
          fr: "Export des activités individuelles dans des formats fitness standard, utiles pour les réimporter dans Strava, Garmin Connect ou TrainingPeaks.",
          pl: "Eksport pojedynczych aktywnosci w standardowych formatach fitness, przydatny do ponownego importu do Strava, Garmin Connect lub TrainingPeaks.",
          tr: "Bireysel antrenmanları standart fitness formatlarinda disa aktar, Strava, Garmin Connect veya TrainingPeaks'e yeniden aktarmak icin kullanisli.",
          nl: "Afzonderlijke activiteiten exporteren in standaard fitnessformaten, handig voor her-import in Strava, Garmin Connect, TrainingPeaks.",
          ja: "個別のアクティビティを標準フィットネスフォーマットでエクスポート。Strava・Garmin Connect・TrainingPeaksへの再インポートに便利。",
          ko: "개별 활동을 표준 피트니스 형식으로 내보내기, Strava, Garmin Connect, TrainingPeaks에 재가져오기에 유용.",
        },
      },
      {
        status: "exploration",
        title: { it: "Watch app companion", en: "Watch app companion", es: "App companion para el reloj", de: "Watch Companion-App", pt: "App companion para o relógio", fr: "Application companion pour la montre", pl: "Aplikacja towarzyszaca dla zegarka", tr: "Saat eslik uygulamasi", nl: "Watch companion-app", ja: "Watchコンパニオンアプリ", ko: "Watch 컴패니언 앱" },
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
};

const STATUS_BADGE: Record<RoadmapStatus, { it: string; en: string; es: string; de: string; pt: string; fr: string; pl: string; tr: string; nl: string; ja: string; ko: string; color: string }> = {
  live: { it: "Live", en: "Live", es: "Disponible", de: "Live", pt: "Disponível", fr: "Disponible", pl: "Live", tr: "Yayinda", nl: "Live", ja: "稼働中", ko: "실시간", color: "#31E981" },
  "in-progress": { it: "In sviluppo", en: "In progress", es: "En desarrollo", de: "In Entwicklung", pt: "Em desenvolvimento", fr: "En développement", pl: "W trakcie", tr: "Devam ediyor", nl: "In ontwikkeling", ja: "開発中", ko: "개발 중", color: "#21E6C1" },
  planned: { it: "Pianificato", en: "Planned", es: "Planificado", de: "Geplant", pt: "Planejado", fr: "Planifié", pl: "Zaplanowane", tr: "Planlanmis", nl: "Gepland", ja: "計画済み", ko: "예정됨", color: "#38BDF8" },
  exploration: { it: "Esplorazione", en: "Exploring", es: "Exploración", de: "Erkundung", pt: "Em exploração", fr: "En exploration", pl: "Eksploracja", tr: "Kesfediliyor", nl: "Verkenning", ja: "検討中", ko: "탐색 중", color: "#A78BFA" },
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
        name: tlr(it.title, lc),
        description: tlr(it.desc, lc),
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
        {COMPLETE_LOCALES.includes(lc) && (
          <p className="mt-5 text-base text-text-primary/90 max-w-2xl leading-relaxed font-medium">
            {tlr(PRODUCT_DEFINITION, lc)}
          </p>
        )}
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
