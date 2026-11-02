import Link from "next/link";
import { headers } from "next/headers";
import Logo from "@/components/Logo";
import { locales, type Locale } from "@/lib/i18n";

const NOT_FOUND_COPY: Record<Locale, { title: string; desc: string; backToHome: string }> = {
  it: {
    title: "Pagina non trovata",
    desc: "La pagina che cerchi non esiste o è stata spostata.",
    backToHome: "Torna alla Home",
  },
  en: {
    title: "Page not found",
    desc: "The page you are looking for does not exist or has been moved.",
    backToHome: "Back to Home",
  },
  es: {
    title: "Página no encontrada",
    desc: "La página que buscas no existe o ha sido movida.",
    backToHome: "Volver al inicio",
  },
  de: {
    title: "Seite nicht gefunden",
    desc: "Die gesuchte Seite existiert nicht oder wurde verschoben.",
    backToHome: "Zurück zur Startseite",
  },
  pt: {
    title: "Página não encontrada",
    desc: "A página que você procura não existe ou foi movida.",
    backToHome: "Voltar ao início",
  },
  fr: {
    title: "Page non trouvée",
    desc: "La page que vous recherchez n'existe pas ou a été déplacée.",
    backToHome: "Retour à l'accueil",
  },
  pl: {
    title: "Strona nie znaleziona",
    desc: "Strona, której szukasz, nie istnieje lub została przeniesiona.",
    backToHome: "Wróć do strony głównej",
  },
  tr: {
    title: "Sayfa bulunamadı",
    desc: "Aradığınız sayfa mevcut değil veya taşınmış olabilir.",
    backToHome: "Ana sayfaya dön",
  },
  nl: {
    title: "Pagina niet gevonden",
    desc: "De pagina die je zoekt bestaat niet of is verplaatst.",
    backToHome: "Terug naar startpagina",
  },
  ja: {
    title: "ページが見つかりません",
    desc: "お探しのページは存在しないか、移動した可能性があります。",
    backToHome: "ホームに戻る",
  },
  ko: {
    title: "페이지를 찾을 수 없습니다",
    desc: "찾으시는 페이지가 존재하지 않거나 이동되었을 수 있습니다.",
    backToHome: "홈으로 돌아가기",
  },
  sv: {
    title: "Sidan kunde inte hittas",
    desc: "Sidan du söker finns inte eller har flyttats.",
    backToHome: "Tillbaka till startsidan",
  },
  da: {
    title: "Siden blev ikke fundet",
    desc: "Siden, du leder efter, findes ikke eller er blevet flyttet.",
    backToHome: "Tilbage til forsiden",
  },
  no: {
    title: "Siden ble ikke funnet",
    desc: "Siden du leter etter finnes ikke eller har blitt flyttet.",
    backToHome: "Tilbake til forsiden",
  },
  fi: {
    title: "Sivua ei löytynyt",
    desc: "Etsimääsi sivua ei ole olemassa tai se on siirretty.",
    backToHome: "Takaisin etusivulle",
  },
};

export default async function GlobalNotFound() {
  const headerList = await headers();
  const rawPath =
    headerList.get("x-matched-path") ||
    headerList.get("x-invoke-path") ||
    headerList.get("next-url") ||
    "";

  // Riconosci la lingua dal percorso se presente, altrimenti fallback stabile su "en"
  let detectedLocale: Locale = "en";
  for (const l of locales) {
    if (rawPath === `/${l}` || rawPath.startsWith(`/${l}/`) || rawPath.includes(`/${l}/`)) {
      detectedLocale = l;
      break;
    }
  }

  const copy = NOT_FOUND_COPY[detectedLocale] || NOT_FOUND_COPY.en;

  return (
    <html lang={detectedLocale}>
      <head>
        <title>{`404 - ${copy.title} · FitMesh`}</title>
      </head>
      <body className="min-h-screen flex flex-col justify-between bg-[#050816] text-[#F3F4F6] font-sans antialiased">
        <header className="border-b border-[#24304A]/60 py-4 px-6">
          <div className="max-w-6xl mx-auto flex items-center justify-between">
            <Link href={`/${detectedLocale}`} aria-label="FitMesh Sync Home">
              <Logo variant="horizontal" size={32} priority />
            </Link>
          </div>
        </header>

        <main role="main" className="flex-1 flex flex-col items-center justify-center px-4 py-20 text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-[#21E6C1]">
            404
          </p>
          <h1 className="mt-3 text-3xl font-bold tracking-tight text-[#FFFFFF] sm:text-4xl">
            {copy.title}
          </h1>
          <p className="mt-4 text-base text-[#9CA3AF] leading-relaxed max-w-md mx-auto">
            {copy.desc}
          </p>
          <div className="mt-8">
            <Link
              href={`/${detectedLocale}`}
              className="inline-flex items-center gap-2 rounded-full bg-[#21E6C1] text-[#03121F] px-6 py-2.5 text-sm font-semibold hover:bg-[#1DA1FF] transition"
            >
              {copy.backToHome} →
            </Link>
          </div>
        </main>

        <footer className="border-t border-[#24304A]/40 py-6 px-4 text-center text-xs text-[#6B7280]">
          <p>© {new Date().getFullYear()} FitMesh Sync. All rights reserved.</p>
        </footer>
      </body>
    </html>
  );
}
