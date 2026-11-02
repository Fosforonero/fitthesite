"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
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
    desc: "La página que buscas no existe o se ha movido.",
    backToHome: "Volver al inicio",
  },
  de: {
    title: "Seite nicht gefunden",
    desc: "Die gesuchte Seite existiert nicht oder wurde verschoben.",
    backToHome: "Zurück zur Startseite",
  },
  pt: {
    title: "Página não encontrada",
    desc: "A página que procura não existe ou foi movida.",
    backToHome: "Voltar ao início",
  },
  fr: {
    title: "Page introuvable",
    desc: "La page que vous recherchez n'existe pas ou a été déplacée.",
    backToHome: "Retour à l'accueil",
  },
  pl: {
    title: "Nie znaleziono strony",
    desc: "Strona, której szukasz, nie istnieje lub została przeniesiona.",
    backToHome: "Wróć do strony głównej",
  },
  tr: {
    title: "Sayfa bulunamadı",
    desc: "Aradığınız sayfa bulunamadı veya taşınmış olabilir.",
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

export default function MarketingNotFound() {
  const pathname = usePathname() || "/";
  const segments = pathname.split("/");
  const candidateLocale = segments[1] as Locale;
  const lc: Locale = locales.includes(candidateLocale) ? candidateLocale : "en";
  const copy = NOT_FOUND_COPY[lc] || NOT_FOUND_COPY.en;

  return (
    <div className="max-w-2xl mx-auto px-4 py-28 text-center">
      <title>{`404 - ${copy.title} · FitMesh`}</title>
      <p className="text-xs font-semibold uppercase tracking-widest text-brand-aqua">
        404
      </p>
      <h1 className="mt-3 text-3xl font-bold tracking-tight text-text-primary sm:text-4xl">
        {copy.title}
      </h1>
      <p className="mt-4 text-base text-text-secondary leading-relaxed max-w-md mx-auto">
        {copy.desc}
      </p>
      <div className="mt-8">
        <Link
          href={`/${lc}`}
          className="inline-flex items-center gap-2 rounded-pill btn-cta px-6 py-2.5 text-sm font-semibold"
        >
          {copy.backToHome} →
        </Link>
      </div>
    </div>
  );
}
