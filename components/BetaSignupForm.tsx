"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type Status = "idle" | "submitting" | "success" | "error";
type Locale = "it" | "en";

interface Props {
  locale: Locale;
}

const T: Record<Locale, Record<string, string>> = {
  it: {
    emailLabel: "La tua email",
    emailPh: "tu@esempio.it",
    emailInvalid: "Inserisci un'email valida (es. nome@dominio.it)",
    emailRequired: "L'email è obbligatoria",
    googleLabel: "Email del tuo account Google (se diversa)",
    googleHelp: "Quella che usi sul Play Store — ti aggiungeremo manualmente alla lista beta.",
    googlePh: "tu@gmail.com",
    googleInvalid: "Inserisci un'email Google valida",
    reasonLabel: "Perché ti interessa FitMesh? (opzionale)",
    reasonPh: "Es. ho Galaxy Watch 7 e Samsung Health mi limita…",
    reasonCounter: "caratteri",
    referralLabel: "Come ci hai trovato?",
    referralSelect: "Seleziona…",
    referralInstagram: "Instagram",
    referralLinkedin: "LinkedIn",
    referralFriend: "Amico / passaparola",
    referralSearch: "Ricerca Google",
    referralPress: "Articolo / blog",
    referralOther: "Altro",
    deviceLabel: "Il tuo smartwatch principale",
    deviceSelect: "Seleziona…",
    deviceRequired: "FitMesh sincronizza dati da smartwatch — seleziona il tuo modello",
    osLabel: "Sistema operativo del telefono",
    osAndroid: "Android",
    osIos: "iOS",
    osIosNote: "FitMesh per iOS arriverà nel 2026 — la beta attuale è solo Android. Resti comunque in lista d'attesa, ti scriviamo prima quando lanciamo iOS.",
    submit: "Voglio essere founder",
    submitting: "Invio…",
    successTitle: "Sei in lista!",
    successText:
      "Ti contattiamo via email entro 48h. Se approvato sei tra i primi 100 founder e l'app è tua gratis per sempre.",
    errorAlready: "Sei già registrato con questa email.",
    errorGeneric: "Qualcosa è andato storto. Riprova fra poco.",
    errorBot: "Verifica anti-bot fallita. Ricarica la pagina e riprova.",
    errorRate: "Troppe richieste. Riprova fra qualche minuto.",
    consentLabel: "Ho letto e accetto la",
    consentLink: "Privacy Policy",
    consentRequired: "Per inviare la richiesta devi accettare la Privacy Policy",
    legalText:
      "Salviamo email + meta dati per gestire la lista beta. Niente marketing. Cancellazione su richiesta a",
    legalEmail: "privacy@fitmesh.fit",
  },
  en: {
    emailLabel: "Your email",
    emailPh: "you@example.com",
    emailInvalid: "Enter a valid email (e.g. name@domain.com)",
    emailRequired: "Email is required",
    googleLabel: "Your Google account email (if different)",
    googleHelp: "The one you use on Play Store — we'll manually add you to the beta tester list.",
    googlePh: "you@gmail.com",
    googleInvalid: "Enter a valid Google email",
    reasonLabel: "Why are you interested in FitMesh? (optional)",
    reasonPh: "E.g. I have a Galaxy Watch 7 and Samsung Health is too limited…",
    reasonCounter: "characters",
    referralLabel: "How did you find us?",
    referralSelect: "Select…",
    referralInstagram: "Instagram",
    referralLinkedin: "LinkedIn",
    referralFriend: "Friend / word of mouth",
    referralSearch: "Google search",
    referralPress: "Article / blog",
    referralOther: "Other",
    deviceLabel: "Your main smartwatch",
    deviceSelect: "Select…",
    deviceRequired: "FitMesh syncs data from a smartwatch — please pick your model",
    osLabel: "Phone operating system",
    osAndroid: "Android",
    osIos: "iOS",
    osIosNote: "FitMesh for iOS arrives in 2026 — the current beta is Android only. You stay on the waitlist anyway and we'll email you first when iOS launches.",
    submit: "I want to be a founder",
    submitting: "Submitting…",
    successTitle: "You're on the list!",
    successText:
      "We'll email you within 48h. If approved you're one of the first 100 founders and the app is yours free forever.",
    errorAlready: "You're already signed up with this email.",
    errorGeneric: "Something went wrong. Please try again later.",
    errorBot: "Anti-bot check failed. Reload the page and try again.",
    errorRate: "Too many requests. Try again in a few minutes.",
    consentLabel: "I have read and accept the",
    consentLink: "Privacy Policy",
    consentRequired: "You must accept the Privacy Policy to submit",
    legalText:
      "We store email + meta data to manage the beta list. No marketing. Delete on request at",
    legalEmail: "privacy@fitmesh.fit",
  },
};

const ANDROID_DEVICES = [
  "Samsung Galaxy Watch 4",
  "Samsung Galaxy Watch 5",
  "Samsung Galaxy Watch 6",
  "Samsung Galaxy Watch 7",
  "Samsung Galaxy Watch Ultra",
  "Samsung Galaxy Fit3",
  "Google Pixel Watch",
  "Google Pixel Watch 2",
  "Google Pixel Watch 3",
  "Fitbit Sense / Versa / Charge",
  "OnePlus Watch / Watch 2",
  "Mobvoi TicWatch Pro / Atlas",
  "Xiaomi Mi Watch / Smart Band",
  "Amazfit / Zepp",
  "Huawei Watch GT / Band",
  "Garmin (Forerunner, Fenix, Venu, Vivoactive)",
  "Polar (Vantage, Pacer, Ignite)",
  "Suunto (Vertical, Race, 9 Peak)",
  "Coros (Pace, Apex, Vertix)",
  "Withings (ScanWatch, Steel HR)",
  "Oura Ring",
  "Other Wear OS",
  "Other Android-compatible",
];

const IOS_DEVICES = [
  "Apple Watch Series 4",
  "Apple Watch Series 5",
  "Apple Watch SE / SE 2",
  "Apple Watch Series 6",
  "Apple Watch Series 7",
  "Apple Watch Series 8",
  "Apple Watch Series 9",
  "Apple Watch Series 10",
  "Apple Watch Ultra / Ultra 2",
  "Garmin (iOS)",
  "Polar (iOS)",
  "Suunto (iOS)",
  "Oura Ring (iOS)",
  "Other Apple HealthKit-compatible",
];

// RFC 5322 simplified — sufficiente per UX. Validazione strong è server-side.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

type FieldState = "empty" | "valid" | "invalid";

function emailState(value: string, required: boolean): FieldState {
  const v = value.trim();
  if (!v) return required ? "empty" : "valid";
  return EMAIL_RE.test(v) ? "valid" : "invalid";
}

function borderClass(state: FieldState, touched: boolean): string {
  if (!touched) return "border-bg-elevated focus:border-accent";
  switch (state) {
    case "valid":
      return "border-emerald-500/60 focus:border-emerald-400";
    case "invalid":
      return "border-red-500/70 focus:border-red-400";
    default:
      return "border-red-500/40 focus:border-red-400";
  }
}

export default function BetaSignupForm({ locale }: Props) {
  const t = T[locale];
  const [status, setStatus] = useState<Status>("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [spots, setSpots] = useState<{ taken: number; total: number } | null>(null);

  // Field values
  const [email, setEmail] = useState("");
  const [googleEmail, setGoogleEmail] = useState("");
  const [reason, setReason] = useState("");
  const [consent, setConsent] = useState(false);
  const [os, setOs] = useState<"android" | "ios">("android");
  const [deviceBrand, setDeviceBrand] = useState("");

  // Touched flags (mostra validation solo dopo blur o submit)
  const [touched, setTouched] = useState({
    email: false,
    googleEmail: false,
    consent: false,
    deviceBrand: false,
  });

  // Anti-bot: timestamp mount + honeypot (vedi onSubmit)
  const mountedAt = useRef<number>(Date.now());
  const honeypotRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch("/api/v1/beta/spots")
      .then((r) => r.json())
      .then((d) => setSpots(d))
      .catch(() => {});
  }, []);

  const emailSt = useMemo(() => emailState(email, true), [email]);
  const googleSt = useMemo(() => emailState(googleEmail, false), [googleEmail]);
  const consentSt: FieldState = consent ? "valid" : "empty";
  const deviceSt: FieldState = deviceBrand ? "valid" : "empty";
  const availableDevices = os === "ios" ? IOS_DEVICES : ANDROID_DEVICES;

  const formValid =
    emailSt === "valid" && googleSt !== "invalid" && consent && deviceBrand !== "";

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    // Forza touched per evidenziare errori se l'utente preme submit subito
    setTouched({ email: true, googleEmail: true, consent: true, deviceBrand: true });

    if (!formValid) return;

    // Anti-bot honeypot: se il campo nascosto contiene qualcosa, abort silenzioso
    if (honeypotRef.current && honeypotRef.current.value !== "") {
      setStatus("error");
      setErrorMsg(t.errorBot);
      return;
    }

    // Anti-bot timing: form compilato in < 1.5s è quasi sicuramente un bot
    const elapsed = Date.now() - mountedAt.current;
    if (elapsed < 1500) {
      setStatus("error");
      setErrorMsg(t.errorBot);
      return;
    }

    setStatus("submitting");
    setErrorMsg(null);

    const fd = new FormData(e.currentTarget);
    // Pre-pendiamo l'OS al device per facilitare segmentation lato admin
    // (es. "Android · Galaxy Watch 7" vs "iOS · Apple Watch Series 9").
    const osLabel = os === "ios" ? "iOS" : "Android";
    const payload = {
      email: email.trim().toLowerCase(),
      google_email: googleEmail.trim() ? googleEmail.trim().toLowerCase() : null,
      reason: reason.trim() || null,
      referral: String(fd.get("referral") || "") || null,
      device_brand: `${osLabel} · ${deviceBrand}`,
      // Anti-bot metadata: server li verifica
      _form_loaded_at: mountedAt.current,
      _hp: honeypotRef.current?.value ?? "",
    };

    try {
      const res = await fetch("/api/v1/beta/signup", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          // Anti-CSRF lite: identifica esplicitamente la richiesta come AJAX same-origin
          "x-requested-with": "fetch",
        },
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
      if (res.status === 429) {
        setStatus("error");
        setErrorMsg(t.errorRate);
        return;
      }
      if (res.status === 403 || res.status === 400) {
        setStatus("error");
        setErrorMsg(body.error === "bot_detected" ? t.errorBot : t.errorGeneric);
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

  const inputBase =
    "w-full rounded-xl border bg-bg-elevated/30 px-4 py-3 text-text-primary placeholder:text-text-muted focus:outline-none transition-colors";

  return (
    <form onSubmit={onSubmit} className="space-y-5" noValidate>
      {spots && (
        <div className="rounded-xl border border-bg-elevated bg-bg-elevated/40 px-4 py-3 text-center text-sm text-text-secondary">
          <span className="font-mono text-accent">{spots.taken}</span>
          <span className="mx-1 text-text-muted">/</span>
          <span className="font-mono">{spots.total}</span>
          <span className="ml-2">
            {locale === "it" ? "posti founder occupati" : "founder spots taken"}
          </span>
        </div>
      )}

      {/* Honeypot: nascosto a utenti reali (CSS + aria-hidden), bot lo riempiono */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          left: "-9999px",
          width: "1px",
          height: "1px",
          overflow: "hidden",
        }}
      >
        <label htmlFor="website_url">Leave this field empty</label>
        <input
          ref={honeypotRef}
          id="website_url"
          name="website_url"
          type="text"
          tabIndex={-1}
          autoComplete="off"
        />
      </div>

      {/* Email principale */}
      <div>
        <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-text-primary">
          {t.emailLabel} <span className="text-accent">*</span>
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          inputMode="email"
          maxLength={120}
          aria-invalid={touched.email && emailSt !== "valid"}
          aria-describedby="email-help"
          placeholder={t.emailPh}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onBlur={() => setTouched((t) => ({ ...t, email: true }))}
          className={`${inputBase} ${borderClass(emailSt, touched.email)}`}
        />
        {touched.email && emailSt !== "valid" && (
          <p id="email-help" className="mt-1.5 text-xs text-red-400">
            {emailSt === "empty" ? t.emailRequired : t.emailInvalid}
          </p>
        )}
      </div>

      {/* Google email (opzionale) */}
      <div>
        <label
          htmlFor="google_email"
          className="mb-1.5 block text-sm font-medium text-text-primary"
        >
          {t.googleLabel}
        </label>
        <input
          id="google_email"
          name="google_email"
          type="email"
          autoComplete="email"
          inputMode="email"
          maxLength={120}
          aria-invalid={touched.googleEmail && googleSt === "invalid"}
          placeholder={t.googlePh}
          value={googleEmail}
          onChange={(e) => setGoogleEmail(e.target.value)}
          onBlur={() => setTouched((t) => ({ ...t, googleEmail: true }))}
          className={`${inputBase} ${borderClass(googleSt, touched.googleEmail)}`}
        />
        <p className="mt-1.5 text-xs text-text-muted">{t.googleHelp}</p>
        {touched.googleEmail && googleSt === "invalid" && (
          <p className="mt-1 text-xs text-red-400">{t.googleInvalid}</p>
        )}
      </div>

      {/* OS selector — Android-only beta, iOS in waitlist */}
      <div>
        <fieldset>
          <legend className="mb-2 block text-sm font-medium text-text-primary">
            {t.osLabel}
          </legend>
          <div className="grid grid-cols-2 gap-2.5">
            {(["android", "ios"] as const).map((value) => {
              const checked = os === value;
              const label = value === "android" ? t.osAndroid : t.osIos;
              return (
                <label
                  key={value}
                  className={`relative cursor-pointer rounded-xl border px-4 py-3 text-sm font-medium transition ${
                    checked
                      ? "border-accent bg-accent/10 text-text-primary"
                      : "border-bg-elevated bg-transparent text-text-secondary hover:border-divider hover:text-text-primary"
                  }`}
                >
                  <input
                    type="radio"
                    name="os"
                    value={value}
                    checked={checked}
                    onChange={() => {
                      setOs(value);
                      setDeviceBrand("");
                      setTouched((p) => ({ ...p, deviceBrand: false }));
                    }}
                    className="absolute opacity-0 pointer-events-none"
                  />
                  {label}
                </label>
              );
            })}
          </div>
          {os === "ios" && (
            <p
              role="status"
              className="mt-2 rounded-xl border border-warning/40 bg-warning/10 px-3.5 py-2.5 text-xs leading-relaxed text-warning"
            >
              {t.osIosNote}
            </p>
          )}
        </fieldset>
      </div>

      {/* Smartwatch — REQUIRED */}
      <div>
        <label
          htmlFor="device_brand"
          className="mb-1.5 block text-sm font-medium text-text-primary"
        >
          {t.deviceLabel} <span className="text-accent" aria-hidden>*</span>
        </label>
        <select
          id="device_brand"
          name="device_brand"
          required
          value={deviceBrand}
          onChange={(e) => setDeviceBrand(e.target.value)}
          onBlur={() => setTouched((p) => ({ ...p, deviceBrand: true }))}
          aria-invalid={touched.deviceBrand && deviceSt === "empty"}
          aria-describedby={touched.deviceBrand && deviceSt === "empty" ? "device_brand_err" : undefined}
          className={`${inputBase} ${borderClass(deviceSt, touched.deviceBrand)}`}
        >
          <option value="">{t.deviceSelect}</option>
          {availableDevices.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>
        {touched.deviceBrand && deviceSt === "empty" && (
          <p id="device_brand_err" className="mt-1 text-xs text-red-400">
            {t.deviceRequired}
          </p>
        )}
      </div>

      {/* Referral */}
      <div>
        <label htmlFor="referral" className="mb-1.5 block text-sm font-medium text-text-primary">
          {t.referralLabel}
        </label>
        <select
          id="referral"
          name="referral"
          className={`${inputBase} border-bg-elevated focus:border-accent`}
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

      {/* Reason */}
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
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          className={`${inputBase} resize-none border-bg-elevated focus:border-accent`}
        />
        <p className="mt-1 text-right text-xs text-text-muted">
          {reason.length}/500 {t.reasonCounter}
        </p>
      </div>

      {/* Consenso Privacy (GDPR) */}
      <div>
        <label className="flex cursor-pointer items-start gap-3 text-sm text-text-secondary">
          <input
            type="checkbox"
            checked={consent}
            onChange={(e) => {
              setConsent(e.target.checked);
              setTouched((t) => ({ ...t, consent: true }));
            }}
            onBlur={() => setTouched((t) => ({ ...t, consent: true }))}
            className={`mt-0.5 h-5 w-5 cursor-pointer rounded border-2 bg-bg-elevated/40 accent-accent ${
              touched.consent && !consent ? "border-red-500/70" : "border-bg-elevated"
            }`}
            aria-invalid={touched.consent && !consent}
            aria-required="true"
          />
          <span>
            {t.consentLabel}{" "}
            <a
              href={`/${locale}/privacy`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-accent underline-offset-2 hover:underline"
            >
              {t.consentLink}
            </a>{" "}
            <span className="text-accent">*</span>
          </span>
        </label>
        {touched.consent && !consent && (
          <p className="ml-8 mt-1 text-xs text-red-400">{t.consentRequired}</p>
        )}
      </div>

      <button
        type="submit"
        disabled={status === "submitting"}
        className="w-full rounded-xl bg-gradient-to-r from-accent-2 via-accent to-accent-3 px-6 py-4 font-semibold text-bg shadow-lg shadow-accent/20 transition-opacity hover:opacity-90 disabled:opacity-50"
      >
        {status === "submitting" ? t.submitting : t.submit}
      </button>

      {errorMsg && (
        <div
          role="alert"
          className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300"
        >
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
