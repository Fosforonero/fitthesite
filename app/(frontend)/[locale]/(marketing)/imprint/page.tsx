import type { Metadata } from "next";
import Link from "next/link";
import { locales, type Locale, getDictionary, localeAlternates } from "@/lib/i18n";
import { LegalPage, Section } from "@/components/legal/LegalLayout";
import { Breadcrumbs } from "@/components/seo/Breadcrumbs";
import { LegalJsonLd } from "@/components/seo/LegalJsonLd";
import { TraderIdentity, IMPRINT_NAV_LABEL } from "@/components/legal/TraderIdentity";

const SITE_URL = "https://www.fitmesh.fit";

/** Sottotitolo sotto l'H1. */
const SUBTITLE: Record<Locale, string> = {
  it: "Informazioni sull'operatore del servizio fitmesh.fit",
  en: "Service operator information for fitmesh.fit",
  es: "Información sobre el operador del servicio fitmesh.fit",
  de: "Anbieterinformationen für fitmesh.fit",
  pt: "Informações sobre o operador do serviço fitmesh.fit",
  fr: "Informations sur l'exploitant du service fitmesh.fit",
  pl: "Informacje o operatorze serwisu fitmesh.fit",
  tr: "fitmesh.fit hizmet işletmecisi bilgileri",
  nl: "Informatie over de exploitant van fitmesh.fit",
  ja: "fitmesh.fit のサービス運営者情報",
  ko: "fitmesh.fit 서비스 운영자 정보",
  sv: "Information om operatören av tjänsten fitmesh.fit",
  da: "Oplysninger om operatøren af tjenesten fitmesh.fit",
  no: "Informasjon om operatøren av tjenesten fitmesh.fit",
  fi: "Tietoja fitmesh.fit-palvelun ylläpitäjästä",
};

/** Intro con riferimento al DSA. */
const INTRO: Record<Locale, string> = {
  it: "Informazioni sul fornitore del servizio ai sensi del Regolamento (UE) 2022/2065 (Digital Services Act) e della normativa applicabile.",
  en: "Service provider information pursuant to Regulation (EU) 2022/2065 (Digital Services Act) and applicable law.",
  es: "Información sobre el prestador del servicio conforme al Reglamento (UE) 2022/2065 (Ley de Servicios Digitales) y la normativa aplicable.",
  de: "Anbieterkennzeichnung gemäß Verordnung (EU) 2022/2065 (Gesetz über digitale Dienste) und geltendem Recht.",
  pt: "Informações sobre o prestador do serviço nos termos do Regulamento (UE) 2022/2065 (Lei dos Serviços Digitais) e da legislação aplicável.",
  fr: "Informations sur le fournisseur du service conformément au Règlement (UE) 2022/2065 (législation sur les services numériques) et à la loi applicable.",
  pl: "Informacje o dostawcy usługi zgodnie z Rozporządzeniem (UE) 2022/2065 (akt o usługach cyfrowych) oraz obowiązującym prawem.",
  tr: "(AB) 2022/2065 sayılı Tüzük (Dijital Hizmetler Yasası) ve geçerli mevzuat uyarınca hizmet sağlayıcı bilgileri.",
  nl: "Informatie over de dienstverlener overeenkomstig Verordening (EU) 2022/2065 (digitaledienstenverordening) en toepasselijk recht.",
  ja: "規則 (EU) 2022/2065（デジタルサービス法）および適用法に基づくサービス提供者情報。",
  ko: "규정 (EU) 2022/2065(디지털 서비스법) 및 관련 법률에 따른 서비스 제공자 정보.",
  sv: "Information om tjänsteleverantören enligt förordning (EU) 2022/2065 (rättsakten om digitala tjänster) och tillämplig lag.",
  da: "Oplysninger om tjenesteudbyderen i henhold til forordning (EU) 2022/2065 (forordningen om digitale tjenester) og gældende ret.",
  no: "Informasjon om tjenestetilbyderen i henhold til forordning (EU) 2022/2065 (forordningen om digitale tjenester) og gjeldende rett.",
  fi: "Tietoja palveluntarjoajasta asetuksen (EU) 2022/2065 (digipalvelusäädös) ja sovellettavan lain mukaisesti.",
};

/** Titolo della sezione identità. */
const SECTION_OPERATOR: Record<Locale, string> = {
  it: "Operatore del servizio",
  en: "Service operator",
  es: "Operador del servicio",
  de: "Diensteanbieter",
  pt: "Operador do serviço",
  fr: "Exploitant du service",
  pl: "Operator serwisu",
  tr: "Hizmet işletmecisi",
  nl: "Dienstverlener",
  ja: "サービス運営者",
  ko: "서비스 운영자",
  sv: "Tjänsteoperatör",
  da: "Tjenesteoperatør",
  no: "Tjenesteoperatør",
  fi: "Palvelun ylläpitäjä",
};

/** Titolo della sezione documenti correlati. */
const SECTION_DOCS: Record<Locale, string> = {
  it: "Privacy, termini e cookie",
  en: "Privacy, terms and cookies",
  es: "Privacidad, términos y cookies",
  de: "Datenschutz, AGB und Cookies",
  pt: "Privacidade, termos e cookies",
  fr: "Confidentialité, conditions et cookies",
  pl: "Prywatność, regulamin i cookies",
  tr: "Gizlilik, koşullar ve çerezler",
  nl: "Privacy, voorwaarden en cookies",
  ja: "プライバシー・規約・Cookie",
  ko: "개인정보, 약관 및 쿠키",
  sv: "Integritet, villkor och cookies",
  da: "Privatliv, vilkår og cookies",
  no: "Personvern, vilkår og informasjonskapsler",
  fi: "Yksityisyys, ehdot ja evästeet",
};

const NOTE_LEAD: Record<Locale, string> = {
  it: "Per il trattamento dei dati personali e le condizioni d'uso, consulta:",
  en: "For personal data processing and terms of use, see:",
  es: "Para el tratamiento de datos personales y las condiciones de uso, consulta:",
  de: "Für die Verarbeitung personenbezogener Daten und die Nutzungsbedingungen siehe:",
  pt: "Para o tratamento de dados pessoais e as condições de uso, consulte:",
  fr: "Pour le traitement des données personnelles et les conditions d'utilisation, voir:",
  pl: "Informacje o przetwarzaniu danych osobowych i warunkach korzystania:",
  tr: "Kişisel verilerin işlenmesi ve kullanım koşulları için:",
  nl: "Voor de verwerking van persoonsgegevens en de gebruiksvoorwaarden, zie:",
  ja: "個人データの取り扱いおよび利用規約については、以下をご覧ください:",
  ko: "개인정보 처리 및 이용약관은 다음을 참조하세요:",
  sv: "För behandling av personuppgifter och användarvillkor, se:",
  da: "For behandling af personoplysninger og brugsvilkår, se:",
  no: "For behandling av personopplysninger og bruksvilkår, se:",
  fi: "Henkilötietojen käsittelystä ja käyttöehdoista, katso:",
};

const DESC: Record<Locale, string> = {
  it: "Note legali e identità dell'operatore di fitmesh.fit (DSA): ragione sociale, sede legale e contatti.",
  en: "Legal notice and service operator identity for fitmesh.fit (DSA): legal entity, registered address and contact.",
  es: "Aviso legal e identidad del operador de fitmesh.fit (DSA): razón social, domicilio y contacto.",
  de: "Impressum und Anbieterkennzeichnung für fitmesh.fit (DSA): Firma, Anschrift und Kontakt.",
  pt: "Informação legal e identidade do operador de fitmesh.fit (DSA): firma, sede e contacto.",
  fr: "Mentions légales et identité de l'exploitant de fitmesh.fit (DSA) : entité légale, siège et contact.",
  pl: "Nota prawna i tożsamość operatora fitmesh.fit (DSA): podmiot, siedziba i kontakt.",
  tr: "fitmesh.fit için künye ve işletmeci kimliği (DSA): firma, adres ve iletişim.",
  nl: "Colofon en identiteit van de exploitant van fitmesh.fit (DSA): entiteit, adres en contact.",
  ja: "fitmesh.fit の運営者情報（DSA）：事業者名、所在地、連絡先。",
  ko: "fitmesh.fit 운영자 정보(DSA): 사업자명, 주소 및 연락처.",
  sv: "Juridisk information och operatörsidentitet för fitmesh.fit (DSA): juridisk enhet, registrerad adress och kontakt.",
  da: "Juridisk meddelelse og operatøridentitet for fitmesh.fit (DSA): juridisk enhed, registreret adresse og kontakt.",
  no: "Juridisk informasjon og operatøridentitet for fitmesh.fit (DSA): juridisk enhet, registrert adresse og kontakt.",
  fi: "Oikeudelliset tiedot ja palvelun ylläpitäjän tiedot fitmesh.fit-sivustolle (DSA): oikeushenkilö, rekisteröity osoite ja yhteystiedot.",
};

export async function generateMetadata(
  { params }: { params: Promise<{ locale: string }> },
): Promise<Metadata> {
  const { locale } = await params;
  const lc: Locale = (locales as readonly string[]).includes(locale) ? (locale as Locale) : "it";
  return {
    title: IMPRINT_NAV_LABEL[lc],
    description: DESC[lc],
    alternates: {
      canonical: `${SITE_URL}/${lc}/imprint`,
      languages: localeAlternates((l) => `${SITE_URL}/${l}/imprint`),
    },
  };
}

export default async function ImprintPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const lc: Locale = (locales as readonly string[]).includes(locale) ? (locale as Locale) : "it";
  const t = await getDictionary(lc);
  const linkClass = "text-brand-aqua hover:text-brand-blue underline underline-offset-4";

  return (
    <>
      <Breadcrumbs items={[{ name: IMPRINT_NAV_LABEL[lc], path: `/${lc}/imprint` }]} locale={lc} />
      <LegalJsonLd locale={lc} path="/imprint" name={IMPRINT_NAV_LABEL[lc]} description={DESC[lc]} />
      <LegalPage kicker={t.legal.section} title={IMPRINT_NAV_LABEL[lc]} lastUpdated={SUBTITLE[lc]}>
        <Section title={SECTION_OPERATOR[lc]}>
          <p>{INTRO[lc]}</p>
          <TraderIdentity locale={lc} className="mt-4" />
        </Section>

        <Section title={SECTION_DOCS[lc]}>
          <p>{NOTE_LEAD[lc]}</p>
          <p className="flex flex-wrap gap-x-4 gap-y-1">
            <Link href={`/${lc}/privacy`} className={linkClass}>{t.footer.links.privacy}</Link>
            <Link href={`/${lc}/terms`} className={linkClass}>{t.footer.links.terms}</Link>
            <Link href={`/${lc}/cookies`} className={linkClass}>{t.footer.links.cookies}</Link>
          </p>
        </Section>
      </LegalPage>
    </>
  );
}
