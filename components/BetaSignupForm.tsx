"use client";

import { useMemo, useRef, useState } from "react";

import type { Locale } from "@/lib/i18n";

type Status = "idle" | "submitting" | "success" | "error";

interface Props {
  locale: Locale;
}

const T = {
  it: {
    emailLabel: "La tua email",
    emailPh: "tu@esempio.it",
    emailInvalid: "Inserisci un'email valida (es. nome@dominio.it)",
    emailRequired: "L'email è obbligatoria",
    googleLabel: "Email del tuo account Google (se diversa)",
    googleHelp: "Quella che usi sul Play Store: ti aggiungeremo manualmente alla lista beta.",
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
    deviceLabel: "Smartwatch principale (opzionale)",
    deviceSelect: "Seleziona…",
    submit: "Iscrivimi agli aggiornamenti",
    submitting: "Invio…",
    successTitle: "Sei in lista!",
    successText:
      "Grazie! Ti scriveremo per le prossime novità. FitMesh è già scaricabile oggi su Google Play e App Store.",
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
    googleHelp: "The one you use on Play Store: we'll manually add you to the beta tester list.",
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
    deviceLabel: "Main smartwatch (optional)",
    deviceSelect: "Select…",
    submit: "Keep me updated",
    submitting: "Submitting…",
    successTitle: "You're on the list!",
    successText:
      "Thanks! We'll email you about upcoming news. FitMesh is already downloadable today on Google Play and the App Store.",
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
  es: {
    emailLabel: "Tu email",
    emailPh: "tu@ejemplo.com",
    emailInvalid: "Introduce un email válido (ej. nombre@dominio.com)",
    emailRequired: "El email es obligatorio",
    googleLabel: "Email de tu cuenta de Google (si es diferente)",
    googleHelp: "La que usas en Play Store: te añadiremos manualmente a la lista beta.",
    googlePh: "tu@gmail.com",
    googleInvalid: "Introduce un email de Google válido",
    reasonLabel: "¿Por qué te interesa FitMesh? (opcional)",
    reasonPh: "Ej. tengo un Galaxy Watch 7 y Samsung Health es muy limitado...",
    reasonCounter: "caracteres",
    referralLabel: "¿Cómo nos encontraste?",
    referralSelect: "Selecciona...",
    referralInstagram: "Instagram",
    referralLinkedin: "LinkedIn",
    referralFriend: "Amigo / boca a boca",
    referralSearch: "Búsqueda en Google",
    referralPress: "Artículo / blog",
    referralOther: "Otro",
    deviceLabel: "Smartwatch principal (opcional)",
    deviceSelect: "Selecciona...",
    submit: "Mantenme informado",
    submitting: "Enviando...",
    successTitle: "¡Estás en la lista!",
    successText:
      "¡Gracias! Te escribiremos con las próximas novedades. FitMesh ya está disponible hoy en Google Play y App Store.",
    errorAlready: "Ya estás registrado con este email.",
    errorGeneric: "Algo salió mal. Inténtalo de nuevo en un momento.",
    errorBot: "Verificación anti-bot fallida. Recarga la página e inténtalo de nuevo.",
    errorRate: "Demasiadas solicitudes. Inténtalo de nuevo en unos minutos.",
    consentLabel: "He leído y acepto la",
    consentLink: "Política de Privacidad",
    consentRequired: "Debes aceptar la Política de Privacidad para enviar la solicitud",
    legalText:
      "Guardamos email y metadatos para gestionar la lista beta. Sin marketing. Cancelación por solicitud a",
    legalEmail: "privacy@fitmesh.fit",
  },
  de: {
    emailLabel: "Deine E-Mail-Adresse",
    emailPh: "du@beispiel.de",
    emailInvalid: "Gib eine gültige E-Mail-Adresse ein (z. B. name@domain.de)",
    emailRequired: "E-Mail-Adresse ist erforderlich",
    googleLabel: "E-Mail deines Google-Kontos (falls abweichend)",
    googleHelp: "Die E-Mail-Adresse, die du im Play Store verwendest: Wir fügen dich manuell zur Beta-Liste hinzu.",
    googlePh: "du@gmail.com",
    googleInvalid: "Gib eine gültige Google-E-Mail-Adresse ein",
    reasonLabel: "Warum interessiert dich FitMesh? (optional)",
    reasonPh: "Z. B. ich habe eine Galaxy Watch 7 und Samsung Health ist zu eingeschränkt...",
    reasonCounter: "Zeichen",
    referralLabel: "Wie hast du uns gefunden?",
    referralSelect: "Auswählen...",
    referralInstagram: "Instagram",
    referralLinkedin: "LinkedIn",
    referralFriend: "Freund / Empfehlung",
    referralSearch: "Google-Suche",
    referralPress: "Artikel / Blog",
    referralOther: "Sonstiges",
    deviceLabel: "Haupt-Smartwatch (optional)",
    deviceSelect: "Auswählen...",
    submit: "Auf dem Laufenden halten",
    submitting: "Wird gesendet...",
    successTitle: "Du bist auf der Liste!",
    successText:
      "Danke! Wir schreiben dir zu kommenden Neuigkeiten. FitMesh ist bereits heute bei Google Play und im App Store erhältlich.",
    errorAlready: "Diese E-Mail-Adresse ist bereits registriert.",
    errorGeneric: "Etwas ist schiefgelaufen. Versuche es bitte später noch einmal.",
    errorBot: "Anti-Bot-Prüfung fehlgeschlagen. Lade die Seite neu und versuche es erneut.",
    errorRate: "Zu viele Anfragen. Versuche es in einigen Minuten erneut.",
    consentLabel: "Ich habe die",
    consentLink: "Datenschutzerklärung",
    consentRequired: "Du musst die Datenschutzerklärung akzeptieren, um fortzufahren",
    legalText:
      "Wir speichern E-Mail-Adresse und Metadaten zur Verwaltung der Beta-Liste. Kein Marketing. Löschung auf Anfrage an",
    legalEmail: "privacy@fitmesh.fit",
  },
  pt: {
    emailLabel: "Seu e-mail",
    emailPh: "voce@exemplo.com.br",
    emailInvalid: "Insira um e-mail válido (ex. nome@dominio.com)",
    emailRequired: "O e-mail é obrigatório",
    googleLabel: "E-mail da sua conta Google (se for diferente)",
    googleHelp: "O que você usa no Play Store: vamos te adicionar manualmente à lista beta.",
    googlePh: "voce@gmail.com",
    googleInvalid: "Insira um e-mail do Google válido",
    reasonLabel: "Por que você tem interesse no FitMesh? (opcional)",
    reasonPh: "Ex. tenho um Galaxy Watch 7 e o Samsung Health é muito limitado...",
    reasonCounter: "caracteres",
    referralLabel: "Como você nos encontrou?",
    referralSelect: "Selecione...",
    referralInstagram: "Instagram",
    referralLinkedin: "LinkedIn",
    referralFriend: "Amigo / indicação",
    referralSearch: "Pesquisa no Google",
    referralPress: "Artigo / blog",
    referralOther: "Outro",
    deviceLabel: "Smartwatch principal (opcional)",
    deviceSelect: "Selecione...",
    submit: "Mantenha-me informado",
    submitting: "Enviando...",
    successTitle: "Você está na lista!",
    successText:
      "Obrigado! Vamos te escrever com as próximas novidades. O FitMesh já está disponível hoje na Google Play e na App Store.",
    errorAlready: "Este e-mail já está cadastrado.",
    errorGeneric: "Algo deu errado. Tente novamente em breve.",
    errorBot: "Verificação anti-bot falhou. Recarregue a página e tente novamente.",
    errorRate: "Muitas solicitações. Tente novamente em alguns minutos.",
    consentLabel: "Li e aceito a",
    consentLink: "Política de Privacidade",
    consentRequired: "Você precisa aceitar a Política de Privacidade para enviar",
    legalText:
      "Salvamos e-mail e metadados para gerenciar a lista beta. Sem marketing. Exclusão mediante solicitação a",
    legalEmail: "privacy@fitmesh.fit",
  },
  fr: {
    emailLabel: "Votre e-mail",
    emailPh: "vous@exemple.fr",
    emailInvalid: "Saisissez un e-mail valide (ex. prenom@domaine.fr)",
    emailRequired: "L'e-mail est obligatoire",
    googleLabel: "E-mail de votre compte Google (si différent)",
    googleHelp: "Celui que vous utilisez sur le Play Store: nous vous ajouterons manuellement à la liste bêta.",
    googlePh: "vous@gmail.com",
    googleInvalid: "Saisissez un e-mail Google valide",
    reasonLabel: "Pourquoi FitMesh vous intéresse-t-il? (optionnel)",
    reasonPh: "Ex. j'ai une Galaxy Watch 7 et Samsung Health est trop limité...",
    reasonCounter: "caractères",
    referralLabel: "Comment nous avez-vous trouvés?",
    referralSelect: "Sélectionnez...",
    referralInstagram: "Instagram",
    referralLinkedin: "LinkedIn",
    referralFriend: "Ami / bouche-à-oreille",
    referralSearch: "Recherche Google",
    referralPress: "Article / blog",
    referralOther: "Autre",
    deviceLabel: "Montre connectée principale (optionnel)",
    deviceSelect: "Sélectionnez...",
    submit: "Me tenir informé",
    submitting: "Envoi en cours...",
    successTitle: "Vous êtes sur la liste!",
    successText:
      "Merci ! Nous vous écrirons pour les prochaines nouveautés. FitMesh est déjà disponible dès aujourd'hui sur Google Play et l'App Store.",
    errorAlready: "Vous êtes déjà inscrit avec cet e-mail.",
    errorGeneric: "Une erreur s'est produite. Réessayez dans un moment.",
    errorBot: "Vérification anti-bot échouée. Rechargez la page et réessayez.",
    errorRate: "Trop de requêtes. Réessayez dans quelques minutes.",
    consentLabel: "J'ai lu et j'accepte la",
    consentLink: "Politique de confidentialité",
    consentRequired: "Vous devez accepter la Politique de confidentialité pour soumettre",
    legalText:
      "Nous enregistrons l'e-mail et les métadonnées pour gérer la liste bêta. Pas de marketing. Suppression sur demande à",
    legalEmail: "privacy@fitmesh.fit",
  },
  pl: {
    emailLabel: "Twój adres e-mail",
    emailPh: "ty@przyklad.pl",
    emailInvalid: "Podaj prawidlowy adres e-mail (np. imie@domena.pl)",
    emailRequired: "Adres e-mail jest wymagany",
    googleLabel: "E-mail konta Google (jesli inny)",
    googleHelp: "Ten, ktorego uzywasz w Play Store: recznie dodamy Cie do listy beta testerow.",
    googlePh: "ty@gmail.com",
    googleInvalid: "Podaj prawidlowy adres e-mail Google",
    reasonLabel: "Dlaczego interesuje Cie FitMesh? (opcjonalnie)",
    reasonPh: "Np. mam Galaxy Watch 7, a Samsung Health jest zbyt ograniczony...",
    reasonCounter: "znakow",
    referralLabel: "Skad nas znasz?",
    referralSelect: "Wybierz...",
    referralInstagram: "Instagram",
    referralLinkedin: "LinkedIn",
    referralFriend: "Znajomy / polecenie",
    referralSearch: "Wyszukiwarka Google",
    referralPress: "Artykul / blog",
    referralOther: "Inne",
    deviceLabel: "Glowny smartwatch (opcjonalnie)",
    deviceSelect: "Wybierz...",
    submit: "Informuj mnie na bieżąco",
    submitting: "Wysylanie...",
    successTitle: "Jestes na liscie!",
    successText:
      "Dziekujemy! Napiszemy do Ciebie o najblizszych nowosciach. FitMesh jest juz dostepny dzisiaj w Google Play i App Store.",
    errorAlready: "Ten adres e-mail jest juz zarejestrowany.",
    errorGeneric: "Cos poszlo nie tak. Sprobuj ponownie za chwile.",
    errorBot: "Weryfikacja anty-bot nie powiodla sie. Odswiez strone i sprobuj ponownie.",
    errorRate: "Zbyt wiele zapytan. Sprobuj ponownie za kilka minut.",
    consentLabel: "Zapoznalem/am sie i akceptuje",
    consentLink: "Polityke prywatnosci",
    consentRequired: "Musisz zaakceptowac Polityke prywatnosci, aby wyslac formularz",
    legalText:
      "Przechowujemy adres e-mail i metadane w celu zarzadzania lista beta. Bez marketingu. Usuniecie danych na zadanie:",
    legalEmail: "privacy@fitmesh.fit",
  },
  tr: {
    emailLabel: "E-posta adresiniz",
    emailPh: "siz@ornek.com",
    emailInvalid: "Gecerli bir e-posta adresi girin (ornek: ad@alan.com)",
    emailRequired: "E-posta adresi zorunludur",
    googleLabel: "Google hesap e-postaniz (farkli ise)",
    googleHelp: "Play Store'da kullandiginiz e-posta: sizi beta test listesine manuel olarak ekleyecegiz.",
    googlePh: "siz@gmail.com",
    googleInvalid: "Gecerli bir Google e-postasi girin",
    reasonLabel: "FitMesh'e neden ilgi duyuyorsunuz? (opsiyonel)",
    reasonPh: "Ornegin Galaxy Watch 7'm var ve Samsung Health cok kisitli...",
    reasonCounter: "karakter",
    referralLabel: "Bizi nasil buldunuz?",
    referralSelect: "Secin...",
    referralInstagram: "Instagram",
    referralLinkedin: "LinkedIn",
    referralFriend: "Arkadastan / tavsiye",
    referralSearch: "Google arama",
    referralPress: "Makale / blog",
    referralOther: "Diger",
    deviceLabel: "Ana akilli saatiniz (opsiyonel)",
    deviceSelect: "Secin...",
    submit: "Beni güncel tut",
    submitting: "Gonderiliyor...",
    successTitle: "Listedesiniz!",
    successText:
      "Tesekkurler! Yaklasan haberler icin size yazacagiz. FitMesh bugun zaten Google Play ve App Store'da indirilebilir.",
    errorAlready: "Bu e-posta adresi zaten kayitli.",
    errorGeneric: "Bir seyler yanlis gitti. Lutfen biraz sonra tekrar deneyin.",
    errorBot: "Anti-bot dogrulamasi basarisiz oldu. Sayfayi yenileyin ve tekrar deneyin.",
    errorRate: "Cok fazla istek. Birkaç dakika sonra tekrar deneyin.",
    consentLabel: "Okudum ve kabul ediyorum:",
    consentLink: "Gizlilik Politikasi",
    consentRequired: "Formu gondermek icin Gizlilik Politikasini kabul etmelisiniz",
    legalText:
      "Beta listesini yonetmek icin e-posta ve meta verileri sakliyoruz. Pazarlama yapilmaz. Silme talebi icin:",
    legalEmail: "privacy@fitmesh.fit",
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
  const t = T[(locale in T ? locale : "en") as keyof typeof T];
  const [status, setStatus] = useState<Status>("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Field values
  const [email, setEmail] = useState("");
  const [googleEmail, setGoogleEmail] = useState("");
  const [reason, setReason] = useState("");
  const [consent, setConsent] = useState(false);

  // Touched flags (mostra validation solo dopo blur o submit)
  const [touched, setTouched] = useState({
    email: false,
    googleEmail: false,
    consent: false,
  });

  // Anti-bot: timestamp mount + honeypot (vedi onSubmit)
  const mountedAt = useRef<number>(Date.now());
  const honeypotRef = useRef<HTMLInputElement>(null);

  const emailSt = useMemo(() => emailState(email, true), [email]);
  const googleSt = useMemo(() => emailState(googleEmail, false), [googleEmail]);
  const consentSt: FieldState = consent ? "valid" : "empty";

  const formValid =
    emailSt === "valid" && googleSt !== "invalid" && consent;

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    // Forza touched per evidenziare errori se l'utente preme submit subito
    setTouched({ email: true, googleEmail: true, consent: true });

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
    const payload = {
      email: email.trim().toLowerCase(),
      google_email: googleEmail.trim() ? googleEmail.trim().toLowerCase() : null,
      reason: reason.trim() || null,
      referral: String(fd.get("referral") || "") || null,
      device_brand: String(fd.get("device_brand") || "") || null,
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

  // `appearance-none` necessario per i <select>: iOS Safari altrimenti ignora
  // bg-color e border-radius e usa il nativo grigio chiaro (rompe dark theme).
  const inputBase =
    "w-full appearance-none rounded-xl border bg-bg-elevated/30 px-4 py-3 text-text-primary placeholder:text-text-muted focus:outline-none transition-colors";

  return (
    <form onSubmit={onSubmit} className="space-y-5" noValidate>
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

      {/* Smartwatch */}
      <div>
        <label
          htmlFor="device_brand"
          className="mb-1.5 block text-sm font-medium text-text-primary"
        >
          {t.deviceLabel}
        </label>
        <select
          id="device_brand"
          name="device_brand"
          className={`${inputBase} border-bg-elevated focus:border-accent`}
        >
          <option value="">{t.deviceSelect}</option>
          {DEVICES.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>
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
