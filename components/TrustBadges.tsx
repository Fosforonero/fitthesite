import type { Locale } from "@/lib/i18n";

type Variant = "default" | "compact";

const COPY = {
  it: {
    madeIn: "Made in Italy",
    serverEu: "Server in UE",
    gdpr: "Privacy GDPR",
    indie: "Indie dev",
    title: "Costruito con attenzione",
  },
  en: {
    madeIn: "Made in Italy",
    serverEu: "EU servers",
    gdpr: "GDPR privacy",
    indie: "Indie dev",
    title: "Built with care",
  },
  es: {
    madeIn: "Made in Italy",
    serverEu: "Servidores en la UE",
    gdpr: "Privacidad GDPR",
    indie: "Indie dev",
    title: "Hecho con cuidado",
  },
  de: {
    madeIn: "Made in Italy",
    serverEu: "Server in der EU",
    gdpr: "Datenschutz DSGVO",
    indie: "Indie dev",
    title: "Mit Sorgfalt entwickelt",
  },
  pt: {
    madeIn: "Made in Italy",
    serverEu: "Servidores na UE",
    gdpr: "Privacidade LGPD/GDPR",
    indie: "Indie dev",
    title: "Feito com cuidado",
  },
  fr: {
    madeIn: "Made in Italy",
    serverEu: "Serveurs dans l'UE",
    gdpr: "Confidentialité RGPD",
    indie: "Indie dev",
    title: "Conçu avec soin",
  },
  pl: {
    madeIn: "Made in Italy",
    serverEu: "Serwery w UE",
    gdpr: "Prywatność RODO",
    indie: "Indie dev",
    title: "Zbudowany z troską",
  },
  tr: {
    madeIn: "Made in Italy",
    serverEu: "AB Sunucuları",
    gdpr: "Gizlilik KVKK/GDPR",
    indie: "Indie dev",
    title: "Özenle geliştirildi",
  },
  nl: {
    madeIn: "Made in Italy",
    serverEu: "EU-servers",
    gdpr: "Privacy AVG/GDPR",
    indie: "Indie dev",
    title: "Gebouwd met zorg",
  },
  ja: {
    madeIn: "Made in Italy",
    serverEu: "EUサーバー",
    gdpr: "GDPRプライバシー",
    indie: "インディー開発",
    title: "丁寧に作られました",
  },
  ko: {
    madeIn: "Made in Italy",
    serverEu: "EU 서버",
    gdpr: "GDPR 개인정보",
    indie: "인디 개발",
    title: "정성껏 만들었습니다",
  },
} as const;

export default function TrustBadges({
  locale,
  variant = "default",
}: {
  locale: Locale;
  variant?: Variant;
}) {
  const t = COPY[locale];
  const isCompact = variant === "compact";

  const badges = [
    {
      label: t.madeIn,
      // tricolore bandiera italiana stilizzato
      icon: (
        <svg viewBox="0 0 24 16" className="w-4 h-4 shrink-0" aria-hidden>
          <rect x="0" y="0" width="8" height="16" fill="#009246" />
          <rect x="8" y="0" width="8" height="16" fill="#FFFFFF" />
          <rect x="16" y="0" width="8" height="16" fill="#CE2B37" />
        </svg>
      ),
    },
    {
      label: t.serverEu,
      // cerchio stelle UE simplified
      icon: (
        <svg viewBox="0 0 24 24" className="w-4 h-4 shrink-0" aria-hidden>
          <circle cx="12" cy="12" r="11" fill="#003399" />
          <g fill="#FFCC00">
            <circle cx="12" cy="4" r="1" />
            <circle cx="18" cy="7" r="1" />
            <circle cx="20" cy="13" r="1" />
            <circle cx="17" cy="18" r="1" />
            <circle cx="12" cy="20" r="1" />
            <circle cx="7" cy="18" r="1" />
            <circle cx="4" cy="13" r="1" />
            <circle cx="6" cy="7" r="1" />
          </g>
        </svg>
      ),
    },
    {
      label: t.gdpr,
      // shield check
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 shrink-0 text-brand-aqua" aria-hidden>
          <path d="M12 2l8 4v6c0 5-3.5 9-8 10-4.5-1-8-5-8-10V6l8-4z" />
          <path d="M9 12l2 2 4-4" />
        </svg>
      ),
    },
    {
      label: t.indie,
      // heart
      icon: (
        <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 shrink-0 text-brand-green" aria-hidden>
          <path d="M12 21s-7-4.5-9.5-9C.5 7 4 3 7.5 3 9.5 3 11 4 12 5.5 13 4 14.5 3 16.5 3 20 3 23.5 7 21.5 12c-2.5 4.5-9.5 9-9.5 9z" />
        </svg>
      ),
    },
  ];

  if (isCompact) {
    return (
      <ul className="flex flex-wrap gap-2 text-xs text-text-muted">
        {badges.map((b) => (
          <li
            key={b.label}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-pill border border-white/[0.06] bg-white/[0.02]"
          >
            {b.icon}
            <span>{b.label}</span>
          </li>
        ))}
      </ul>
    );
  }

  return (
    <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] px-5 py-4 sm:px-6 sm:py-5">
      <p className="text-[10px] uppercase tracking-[0.22em] text-text-muted font-semibold mb-3">
        {t.title}
      </p>
      <ul className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        {badges.map((b) => (
          <li
            key={b.label}
            className="flex items-center gap-2 text-sm text-text-secondary"
          >
            {b.icon}
            <span className="font-medium">{b.label}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
