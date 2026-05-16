"use client";

import { useEffect, useState } from "react";

type Status = "idle" | "submitting" | "success" | "error";
type Locale = "it" | "en";

interface Props {
  locale: Locale;
}

const T: Record<Locale, Record<string, string>> = {
  it: {
    emailLabel: "La tua email",
    emailPh: "tu@esempio.it",
    googleLabel: "Email del tuo account Google (se diversa)",
    googleHelp: "Quella che usi sul Play Store — ti aggiungerò manualmente alla lista beta.",
    googlePh: "tu@gmail.com",
    reasonLabel: "Perché ti interessa FitMesh? (opzionale)",
    reasonPh: "Es. ho Galaxy Watch 7 e Samsung Health mi limita…",
    referralLabel: "Come ci hai trovato?",
    referralSelect: "Seleziona…",
    referralInstagram: "Instagram",
    referralLinkedin: "LinkedIn",
    referralFriend: "Amico / passaparola",
    referralSearch: "Ricerca Google",
    referralPress: "Articolo / blog",
    referralOther: "Altro",
    deviceLabel: "Smartwatch principale (opzionale)",
    deviceSelect: "Seleziona…",
    submit: "Voglio essere founder",
    submitting: "Invio…",
    successTitle: "Sei in lista!",
    successText:
      "Ti contatto via email entro 48h. Se vieni approvato sei tra i primi 100 founder e l'app è tua gratis per sempre.",
    errorAlready: "Sei già registrato con questa email.",
    errorGeneric: "Qualcosa è andato storto. Riprova fra poco.",
    legalText:
      "Salvo email + meta dati per gestire la lista beta. Niente marketing né condivisione con terzi. Cancello su richiesta a",
    legalEmail: "mat.pizzi@gmail.com",
  },
  en: {
    emailLabel: "Your email",
    emailPh: "you@example.com",
    googleLabel: "Your Google account email (if different)",
    googleHelp: "The one you use on Play Store — I'll manually add you to the beta tester list.",
    googlePh: "you@gmail.com",
    reasonLabel: "Why are you interested in FitMesh? (optional)",
    reasonPh: "E.g. I have a Galaxy Watch 7 and Samsung Health is too limited…",
    referralLabel: "How did you find us?",
    referralSelect: "Select…",
    referralInstagram: "Instagram",
    referralLinkedin: "LinkedIn",
    referralFriend: "Friend / word of mouth",
    referralSearch: "Google search",
    referralPress: "Article / blog",
    referralOther: "Other",
    deviceLabel: "Main smartwatch (optional)",
    deviceSelect: "Select…",
    submit: "I want to be a founder",
    submitting: "Submitting…",
    successTitle: "You're on the list!",
    successText:
      "I'll email you within 48h. If approved you're one of the first 100 founders and the app is yours free forever.",
    errorAlready: "You're already signed up with this email.",
    errorGeneric: "Something went wrong. Please try again later.",
    legalText:
      "I store email + meta data to manage the beta list. No marketing nor third-party sharing. Delete on request at",
    legalEmail: "mat.pizzi@gmail.com",
  },
};

const DEVICES = [
  "Samsung Galaxy Watch 4",
  "Samsung Galaxy Watch 5",
  "Samsung Galaxy Watch 6",
  "Samsung Galaxy Watch 7",
  "Samsung Galaxy Watch Ultra",
  "Google Pixel Watch",
  "Google Pixel Watch 2",
  "Google Pixel Watch 3",
  "Fitbit Sense / Versa",
  "OnePlus Watch",
  "Xiaomi Mi Watch",
  "Other Wear OS",
  "Other Android",
];

export default function BetaSignupForm({ locale }: Props) {
  const t = T[locale];
  const [status, setStatus] = useState<Status>("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [spots, setSpots] = useState<{ taken: number; total: number } | null>(null);

  useEffect(() => {
    fetch("/api/v1/beta/spots")
      .then((r) => r.json())
      .then((d) => setSpots(d))
      .catch(() => {});
  }, []);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("submitting");
    setErrorMsg(null);

    const fd = new FormData(e.currentTarget);
    const payload = {
      email: String(fd.get("email") || ""),
      google_email: String(fd.get("google_email") || "") || null,
      reason: String(fd.get("reason") || "") || null,
      referral: String(fd.get("referral") || "") || null,
      device_brand: String(fd.get("device_brand") || "") || null,
    };

    try {
      const res = await fetch("/api/v1/beta/signup", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.status === 201) {
        setStatus("success");
        return;
      }
      const body = await res.json().catch(() => ({}));
      if (res.status === 409) {
        setStatus("error");
        setErrorMsg(t.errorAlready);
        return;
      }
      setStatus("error");
      setErrorMsg(body.error ? `${t.errorGeneric} (${body.error})` : t.errorGeneric);
    } catch {
      setStatus("error");
      setErrorMsg(t.errorGeneric);
    }
  }

  if (status === "success") {
    return (
      <div className="rounded-2xl border border-accent/40 bg-accent/10 p-8 text-center">
        <div className="mb-3 text-5xl">🎉</div>
        <h3 className="mb-2 text-2xl font-bold text-text-primary">{t.successTitle}</h3>
        <p className="text-text-secondary">{t.successText}</p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      {spots && (
        <div className="rounded-xl border border-bg-elevated bg-bg-elevated/40 px-4 py-3 text-center text-sm text-text-secondary">
          <span className="font-mono text-accent">{spots.taken}</span>
          <span className="mx-1 text-text-muted">/</span>
          <span className="font-mono">{spots.total}</span>
          <span className="ml-2">{locale === "it" ? "posti founder occupati" : "founder spots taken"}</span>
        </div>
      )}

      <div>
        <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-text-primary">
          {t.emailLabel} <span className="text-accent">*</span>
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          placeholder={t.emailPh}
          className="w-full rounded-xl border border-bg-elevated bg-bg-elevated/30 px-4 py-3 text-text-primary placeholder:text-text-muted focus:border-accent focus:outline-none"
        />
      </div>

      <div>
        <label htmlFor="google_email" className="mb-1.5 block text-sm font-medium text-text-primary">
          {t.googleLabel}
        </label>
        <input
          id="google_email"
          name="google_email"
          type="email"
          placeholder={t.googlePh}
          className="w-full rounded-xl border border-bg-elevated bg-bg-elevated/30 px-4 py-3 text-text-primary placeholder:text-text-muted focus:border-accent focus:outline-none"
        />
        <p className="mt-1.5 text-xs text-text-muted">{t.googleHelp}</p>
      </div>

      <div>
        <label htmlFor="device_brand" className="mb-1.5 block text-sm font-medium text-text-primary">
          {t.deviceLabel}
        </label>
        <select
          id="device_brand"
          name="device_brand"
          className="w-full rounded-xl border border-bg-elevated bg-bg-elevated/30 px-4 py-3 text-text-primary focus:border-accent focus:outline-none"
        >
          <option value="">{t.deviceSelect}</option>
          {DEVICES.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="referral" className="mb-1.5 block text-sm font-medium text-text-primary">
          {t.referralLabel}
        </label>
        <select
          id="referral"
          name="referral"
          className="w-full rounded-xl border border-bg-elevated bg-bg-elevated/30 px-4 py-3 text-text-primary focus:border-accent focus:outline-none"
        >
          <option value="">{t.referralSelect}</option>
          <option value="instagram">{t.referralInstagram}</option>
          <option value="linkedin">{t.referralLinkedin}</option>
          <option value="friend">{t.referralFriend}</option>
          <option value="search">{t.referralSearch}</option>
          <option value="press">{t.referralPress}</option>
          <option value="other">{t.referralOther}</option>
        </select>
      </div>

      <div>
        <label htmlFor="reason" className="mb-1.5 block text-sm font-medium text-text-primary">
          {t.reasonLabel}
        </label>
        <textarea
          id="reason"
          name="reason"
          rows={3}
          maxLength={500}
          placeholder={t.reasonPh}
          className="w-full resize-none rounded-xl border border-bg-elevated bg-bg-elevated/30 px-4 py-3 text-text-primary placeholder:text-text-muted focus:border-accent focus:outline-none"
        />
      </div>

      <button
        type="submit"
        disabled={status === "submitting"}
        className="w-full rounded-xl bg-gradient-to-r from-accent-2 via-accent to-accent-3 px-6 py-4 font-semibold text-bg shadow-lg shadow-accent/20 transition-opacity hover:opacity-90 disabled:opacity-50"
      >
        {status === "submitting" ? t.submitting : t.submit}
      </button>

      {errorMsg && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {errorMsg}
        </div>
      )}

      <p className="text-center text-xs text-text-muted">
        {t.legalText}{" "}
        <a href={`mailto:${t.legalEmail}`} className="text-accent hover:underline">
          {t.legalEmail}
        </a>
      </p>
    </form>
  );
}
