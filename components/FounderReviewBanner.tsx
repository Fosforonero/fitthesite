"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "fitmesh_founder_review_dismissed_v1";
const PLAY_STORE_URL =
  "https://play.google.com/store/apps/details?id=com.fitmeshsync.app";

const copy: Record<string, { title: string; body: string; cta: string; close: string }> = {
  it: {
    title: "Sei uno dei 1.000 founder di FitMesh 🎉",
    body: "Se hai già scaricato l'app, lasciare una recensione su Google Play ci aiuta tantissimo a crescere.",
    cta: "⭐ Lascia una recensione",
    close: "Chiudi",
  },
  en: {
    title: "You're one of FitMesh's 1,000 founders 🎉",
    body: "If you've downloaded the app, leaving a Google Play review helps us grow more than you know.",
    cta: "⭐ Leave a review",
    close: "Close",
  },
  es: {
    title: "Eres uno de los 1.000 fundadores de FitMesh 🎉",
    body: "Si ya descargaste la app, dejar una reseña en Google Play nos ayuda muchísimo a crecer.",
    cta: "⭐ Dejar una reseña",
    close: "Cerrar",
  },
  de: {
    title: "Du gehörst zu den 1.000 Gründern von FitMesh 🎉",
    body: "Wenn du die App heruntergeladen hast, hilft uns eine Google Play-Bewertung enorm beim Wachstum.",
    cta: "⭐ Bewertung schreiben",
    close: "Schließen",
  },
  pt: {
    title: "Você é um dos 1.000 fundadores do FitMesh 🎉",
    body: "Se já baixou o app, deixar uma avaliação no Google Play nos ajuda muito a crescer.",
    cta: "⭐ Avaliar no Google Play",
    close: "Fechar",
  },
  fr: {
    title: "Vous faites partie des 1 000 fondateurs de FitMesh 🎉",
    body: "Si vous avez téléchargé l'app, laissez un avis sur Google Play — ça nous aide vraiment à grandir.",
    cta: "⭐ Laisser un avis",
    close: "Fermer",
  },
  pl: {
    title: "Jesteś jednym z 1000 założycieli FitMesh 🎉",
    body: "Jeśli pobrałeś aplikację, recenzja w Google Play bardzo nam pomaga się rozwijać.",
    cta: "⭐ Napisz recenzję",
    close: "Zamknij",
  },
  tr: {
    title: "FitMesh'in 1.000 kurucusundan birisin 🎉",
    body: "Uygulamayı indirdiysen, Google Play'de yorum bırakmak büyümemize çok yardımcı olur.",
    cta: "⭐ Yorum yaz",
    close: "Kapat",
  },
  nl: {
    title: "Jij bent een van de 1.000 founders van FitMesh 🎉",
    body: "Als je de app al hebt gedownload, helpt een Google Play-recensie ons enorm te groeien.",
    cta: "⭐ Schrijf een recensie",
    close: "Sluiten",
  },
  ja: {
    title: "あなたはFitMeshの1,000人のファウンダーの一人です 🎉",
    body: "アプリをダウンロード済みなら、Google Playにレビューを書いてください。成長に大きく役立ちます。",
    cta: "⭐ レビューを書く",
    close: "閉じる",
  },
  ko: {
    title: "당신은 FitMesh의 1,000명 창립자 중 한 명입니다 🎉",
    body: "앱을 다운로드했다면 Google Play에 리뷰를 남겨 주세요. 성장에 큰 도움이 됩니다.",
    cta: "⭐ 리뷰 남기기",
    close: "닫기",
  },
};

export default function FounderReviewBanner({ locale }: { locale: string }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      if (!window.localStorage.getItem(STORAGE_KEY)) {
        setVisible(true);
      }
    } catch {
      setVisible(true);
    }
  }, []);

  const dismiss = () => {
    try {
      window.localStorage.setItem(STORAGE_KEY, "1");
    } catch {
      /* silent */
    }
    setVisible(false);
  };

  if (!visible) return null;

  const t = copy[locale] ?? copy.en;

  return (
    <div className="mx-4 mt-4 sm:mx-6 rounded-card border border-brand-aqua/30 bg-gradient-to-r from-brand-green/10 to-brand-aqua/10 p-4 flex items-start gap-3">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-text-primary">{t.title}</p>
        <p className="mt-0.5 text-xs text-text-secondary leading-relaxed">{t.body}</p>
        <a
          href={PLAY_STORE_URL}
          target="_blank"
          rel="noopener noreferrer"
          onClick={dismiss}
          className="mt-3 inline-flex px-4 py-2 rounded-pill bg-brand-gradient text-bg-dark text-xs font-semibold hover:opacity-90 transition"
        >
          {t.cta}
        </a>
      </div>
      <button
        type="button"
        onClick={dismiss}
        aria-label={t.close}
        className="shrink-0 p-1 text-text-muted hover:text-text-primary transition"
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
      </button>
    </div>
  );
}
