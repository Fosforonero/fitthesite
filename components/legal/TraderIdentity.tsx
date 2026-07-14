/**
 * Blocco identità del trader, riusato in Terms, Privacy e nella pagina /imprint.
 * Dati da lib/legal/trader.ts (single source of truth); qui solo le etichette
 * localizzate per gli 11 locali del sito.
 *
 * Guardia: la riga P.IVA viene mostrata solo quando il valore reale è impostato
 * (vedi TRADER.vat), così non viene mai pubblicato un numero placeholder.
 */
import type { Locale } from "@/lib/i18n";
import { TRADER, TRADER_ADDRESS_LINE } from "@/lib/legal/trader";

type Labels = {
  trader: string;
  representative: string;
  address: string;
  vat: string;
  contact: string;
};

const LABELS: Record<Locale, Labels> = {
  it: { trader: "Titolare e operatore", representative: "Rappresentante legale", address: "Sede legale", vat: "Partita IVA", contact: "Contatti" },
  en: { trader: "Legal entity & operator", representative: "Legal representative", address: "Registered address", vat: "VAT number", contact: "Contact" },
  es: { trader: "Titular y operador", representative: "Representante legal", address: "Domicilio social", vat: "NIF / IVA", contact: "Contacto" },
  de: { trader: "Anbieter & Betreiber", representative: "Gesetzlicher Vertreter", address: "Anschrift", vat: "USt-IdNr.", contact: "Kontakt" },
  pt: { trader: "Titular e operador", representative: "Representante legal", address: "Sede", vat: "NIF / IVA", contact: "Contacto" },
  fr: { trader: "Entité légale et exploitant", representative: "Représentant légal", address: "Adresse du siège", vat: "N° de TVA", contact: "Contact" },
  pl: { trader: "Podmiot prawny i operator", representative: "Przedstawiciel prawny", address: "Adres siedziby", vat: "Numer VAT", contact: "Kontakt" },
  tr: { trader: "Yasal kuruluş ve işletmeci", representative: "Yasal temsilci", address: "Kayıtlı adres", vat: "KDV numarası", contact: "İletişim" },
  nl: { trader: "Juridische entiteit & exploitant", representative: "Wettelijke vertegenwoordiger", address: "Vestigingsadres", vat: "Btw-nummer", contact: "Contact" },
  ja: { trader: "事業者", representative: "代表者", address: "所在地", vat: "VAT番号", contact: "連絡先" },
  ko: { trader: "사업자", representative: "대표자", address: "주소", vat: "VAT 번호", contact: "연락처" },
  sv: { trader: "Juridisk enhet och operatör", representative: "Rättslig företrädare", address: "Registrerad adress", vat: "Momsnummer", contact: "Kontakt" },
  da: { trader: "Juridisk enhed og operatør", representative: "Juridisk repræsentant", address: "Registreret adresse", vat: "Momsnummer", contact: "Kontakt" },
  no: { trader: "Juridisk enhet og operatør", representative: "Juridisk representant", address: "Registrert adresse", vat: "MVA-nummer", contact: "Kontakt" },
  fi: { trader: "Oikeushenkilö ja ylläpitäjä", representative: "Laillinen edustaja", address: "Rekisteröity osoite", vat: "ALV-numero", contact: "Yhteystiedot" },
};

/** Etichetta del link "Impressum / Note legali" per Footer e pagina. */
export const IMPRINT_NAV_LABEL: Record<Locale, string> = {
  it: "Note legali",
  en: "Legal notice",
  es: "Aviso legal",
  de: "Impressum",
  pt: "Informação legal",
  fr: "Mentions légales",
  pl: "Nota prawna",
  tr: "Künye",
  nl: "Colofon",
  ja: "運営者情報",
  ko: "법적 고지",
  sv: "Juridisk information",
  da: "Juridisk information",
  no: "Juridisk informasjon",
  fi: "Oikeudelliset tiedot",
};

export function TraderIdentity({
  locale,
  className = "",
  showContact = true,
}: {
  locale: Locale;
  className?: string;
  /** Mostra la riga email di contatto. Disattivala dove le email sono già elencate altrove. */
  showContact?: boolean;
}) {
  const l = LABELS[locale] ?? LABELS.en;
  return (
    <div className={`space-y-1.5 text-text-secondary ${className}`}>
      <p>
        <strong className="text-text-primary">{l.trader}:</strong> {TRADER.legalName}
      </p>
      <p>
        <strong className="text-text-primary">{l.representative}:</strong> {TRADER.representative}
      </p>
      <p>
        <strong className="text-text-primary">{l.address}:</strong> {TRADER_ADDRESS_LINE}
      </p>
      <p>
        <strong className="text-text-primary">{l.vat}:</strong> {TRADER.vat}
      </p>
      {showContact && (
        <p>
          <strong className="text-text-primary">{l.contact}:</strong>{" "}
          <a
            href={`mailto:${TRADER.contactEmail}`}
            className="hover:text-text-primary transition underline decoration-text-muted/40 underline-offset-2"
          >
            {TRADER.contactEmail}
          </a>
        </p>
      )}
    </div>
  );
}
