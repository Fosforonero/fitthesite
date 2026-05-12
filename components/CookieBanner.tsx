"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const STORAGE_KEY = "fitmesh_cookie_consent";

export default function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (!stored) setVisible(true);
    } catch {
      // localStorage unavailable (incognito, etc.) — show once per session
      setVisible(true);
    }
  }, []);

  const dismiss = () => {
    try {
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ accepted: true, ts: Date.now() }),
      );
    } catch {
      // ignore
    }
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-label="Avviso cookie"
      className="fixed inset-x-0 bottom-0 z-[60] px-4 pb-4 sm:px-6 sm:pb-6 pointer-events-none"
    >
      <div className="max-w-4xl mx-auto pointer-events-auto">
        <div className="rounded-[14px] border hairline bg-ink-800/95 backdrop-blur-md shadow-2xl shadow-black/40 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex-1 text-sm text-ink-200 leading-relaxed">
            <p>
              Usiamo solo cookie tecnici essenziali per il funzionamento del sito
              (Vercel hosting). <strong className="text-ink-50">Nessun tracker pubblicitario</strong>,
              nessun analytics di profilazione, nessun cookie di terze parti.
              {" "}
              <Link
                href="/cookies"
                className="text-brand-500 hover:text-brand-400 underline underline-offset-4"
              >
                Maggiori info
              </Link>
              .
            </p>
          </div>
          <div className="flex gap-2 shrink-0">
            <Link
              href="/cookies"
              className="px-4 py-2 rounded-full border hairline text-sm text-ink-200 hover:text-ink-50 hover:bg-white/5 transition"
            >
              Dettagli
            </Link>
            <button
              type="button"
              onClick={dismiss}
              className="px-5 py-2 rounded-full bg-brand-500 text-ink-50 text-sm font-medium hover:bg-brand-600 transition"
            >
              Ho capito
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
