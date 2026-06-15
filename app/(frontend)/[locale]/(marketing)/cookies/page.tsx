import type { Metadata } from "next";
import { locales, type Locale, getDictionary } from "@/lib/i18n";
import { LegalPage, Section } from "@/components/legal/LegalLayout";
import { Breadcrumbs } from "@/components/seo/Breadcrumbs";

const SITE_URL = "https://www.fitmesh.fit";
const LAST_UPDATED_IT = "12 maggio 2026";
const LAST_UPDATED_EN = "May 12, 2026";
const LAST_UPDATED_ES = "12 de mayo de 2026";

export async function generateMetadata(
  { params }: { params: Promise<{ locale: string }> },
): Promise<Metadata> {
  const { locale } = await params;
  const titles: Record<Locale, string> = {
    it: "Cookie Policy",
    en: "Cookie Policy",
    es: "Política de cookies",
  };
  const desc: Record<Locale, string> = {
    it: "Quali cookie usa fitmesh.fit e perché. Cookie tecnici essenziali + Google Analytics 4 con consenso esplicito.",
    en: "Which cookies fitmesh.fit uses and why. Strictly necessary cookies + Google Analytics 4 with explicit consent.",
    es: "Qué cookies usa fitmesh.fit y por qué. Cookies técnicas esenciales más Google Analytics 4 con consentimiento explícito.",
  };
  const lc = (locales as readonly string[]).includes(locale) ? (locale as Locale) : "it";
  return {
    title: titles[lc],
    description: desc[lc],
    alternates: {
      canonical: `${SITE_URL}/${lc}/cookies`,
      languages: {
        it: `${SITE_URL}/it/cookies`,
        en: `${SITE_URL}/en/cookies`,
        es: `${SITE_URL}/es/cookies`,
        "x-default": `${SITE_URL}/it/cookies`,
      },
    },
  };
}

export default async function CookiesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const lc: Locale = (locales as readonly string[]).includes(locale) ? (locale as Locale) : "it";
  const t = await getDictionary(lc);
  const lastUpdated = `${t.legal.last_updated}: ${lc === "it" ? LAST_UPDATED_IT : lc === "es" ? LAST_UPDATED_ES : LAST_UPDATED_EN}`;
  return (
    <>
      <Breadcrumbs items={[{ name: "Cookie Policy", path: `/${lc}/cookies` }]} locale={lc} />
      <LegalPage kicker={t.legal.section} title={t.legal.cookies_title} lastUpdated={lastUpdated}>
        {lc === "it" ? <CookiesIT /> : lc === "es" ? <CookiesES /> : <CookiesEN />}
      </LegalPage>
    </>
  );
}

function Row({ name, type, category, duration, scope }: { name: string; type: string; category: string; duration: string; scope: React.ReactNode }) {
  return (
    <tr className="border-b border-divider align-top">
      <td className="px-3 py-3">
        <code className="text-brand-aqua font-mono text-[0.85em]">{name}</code>
        <div className="text-[10px] uppercase tracking-wider text-text-muted mt-1">{type}</div>
      </td>
      <td className="px-3 py-3 text-text-secondary">{category}</td>
      <td className="px-3 py-3 text-text-secondary">{duration}</td>
      <td className="px-3 py-3 text-text-secondary">{scope}</td>
    </tr>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return <th className="text-left px-3 py-3 text-[10px] uppercase tracking-[0.16em] text-text-muted font-semibold">{children}</th>;
}

function CookiesIT() {
  return (
    <>
      <Section title="In breve">
        <p>
          fitmesh.fit usa <strong className="text-text-primary">cookie tecnici essenziali</strong> per
          funzionare e, <strong className="text-text-primary">solo dopo il tuo consenso esplicito
          tramite il banner</strong>, Google Analytics 4 per capire come gli utenti usano il sito
          in forma aggregata e migliorare il prodotto.
        </p>
        <p>
          <strong className="text-text-primary">Non usiamo cookie pubblicitari</strong>, non
          profiliamo, non vendiamo dati, non mostriamo pubblicità.
        </p>
      </Section>

      <Section title="Cookie che usiamo">
        <div className="overflow-x-auto -mx-4 sm:mx-0">
          <table className="min-w-full text-sm border-collapse">
            <thead>
              <tr className="border-b border-divider">
                <Th>Nome</Th><Th>Categoria</Th><Th>Durata</Th><Th>Scopo</Th>
              </tr>
            </thead>
            <tbody>
              <Row name="fitmesh_cookie_consent" type="localStorage" category="Tecnico" duration="Persistente" scope="Memorizza la tua scelta sul banner cookie. Non contiene dati personali." />
              <Row name="_ga" type="cookie" category="Analytics (opzionale)" duration="2 anni" scope="Google Analytics 4: identifica visitatori in modo anonimo. Caricato SOLO dopo «Accetta tutto»." />
              <Row name="_ga_WLBXXFB21G" type="cookie" category="Analytics (opzionale)" duration="2 anni" scope="Google Analytics 4: persistenza di sessione. Caricato SOLO dopo «Accetta tutto»." />
              <Row name="Cookie tecnici Vercel" type="cookie" category="Tecnico" duration="Sessione" scope="Load balancing e prevenzione abusi della piattaforma di hosting." />
            </tbody>
          </table>
        </div>
      </Section>

      <Section title="Google Analytics 4 — dettagli">
        <p>
          Usiamo Google Analytics 4 (proprietà{" "}
          <code className="text-brand-aqua font-mono text-[0.85em]">G-WLBXXFB21G</code>) con
          configurazione GDPR-compliant: <strong className="text-text-primary">Consent Mode v2</strong>,
          IP anonymization (<code className="text-brand-aqua font-mono text-[0.85em]">anonymize_ip: true</code>),
          advertising signals disattivati. Dettagli completi sull'utilizzo di Google:{" "}
          <a href="https://policies.google.com/privacy" target="_blank" rel="noopener" className="text-brand-aqua hover:text-brand-blue underline underline-offset-4">policies.google.com/privacy</a>.
        </p>
      </Section>

      <Section title="Cosa NON usiamo">
        <ul className="space-y-2 mt-3">
          {[
            "Meta Pixel, TikTok Pixel, LinkedIn Insight, Google Ads",
            "Cookie di profilazione comportamentale",
            "Cookie pubblicitari di terze parti",
            "Fingerprinting del browser",
            "Beacon o pixel di tracking nelle email",
            "Sessione registrata (Hotjar, FullStory, ecc.)",
          ].map((item) => (
            <li key={item} className="flex gap-2"><span className="text-error mt-0.5">✗</span><span>{item}</span></li>
          ))}
        </ul>
      </Section>

      <Section title="Come gestire il consenso">
        <p>
          Hai pieno controllo. Per modificare la scelta: DevTools del browser (F12) → "Application"
          → localStorage di fitmesh.fit → cancella{" "}
          <code className="text-brand-aqua font-mono text-[0.85em]">fitmesh_cookie_consent</code>.
          Alla prossima visita rivedrai il banner.
        </p>
        <p>
          Per disattivare GA su tutti i siti puoi installare il{" "}
          <a href="https://tools.google.com/dlpage/gaoptout" target="_blank" rel="noopener" className="text-brand-aqua hover:text-brand-blue underline underline-offset-4">
            Google Analytics Opt-out Browser Add-on
          </a>.
        </p>
      </Section>

      <Section title="Contatti">
        <p>
          Per domande su questa Cookie Policy:{" "}
          <a href="mailto:privacy@fitmesh.fit" className="text-brand-aqua hover:text-brand-blue underline underline-offset-4">privacy@fitmesh.fit</a>.
        </p>
      </Section>
    </>
  );
}

function CookiesEN() {
  return (
    <>
      <Section title="In short">
        <p>
          fitmesh.fit uses <strong className="text-text-primary">strictly necessary technical cookies</strong> to
          function and, <strong className="text-text-primary">only after your explicit consent via
          the banner</strong>, Google Analytics 4 to understand site usage in aggregate form and
          improve the product.
        </p>
        <p>
          <strong className="text-text-primary">No advertising cookies</strong>, no profiling, no
          data resale, no ads.
        </p>
      </Section>

      <Section title="Cookies we use">
        <div className="overflow-x-auto -mx-4 sm:mx-0">
          <table className="min-w-full text-sm border-collapse">
            <thead>
              <tr className="border-b border-divider">
                <Th>Name</Th><Th>Category</Th><Th>Duration</Th><Th>Purpose</Th>
              </tr>
            </thead>
            <tbody>
              <Row name="fitmesh_cookie_consent" type="localStorage" category="Technical" duration="Persistent" scope="Stores your choice on the cookie banner. Contains no personal data." />
              <Row name="_ga" type="cookie" category="Analytics (optional)" duration="2 years" scope="Google Analytics 4: anonymous visitor identification. Loaded ONLY after «Accept all»." />
              <Row name="_ga_WLBXXFB21G" type="cookie" category="Analytics (optional)" duration="2 years" scope="Google Analytics 4: session persistence. Loaded ONLY after «Accept all»." />
              <Row name="Vercel technical cookies" type="cookie" category="Technical" duration="Session" scope="Hosting platform load balancing and abuse prevention." />
            </tbody>
          </table>
        </div>
      </Section>

      <Section title="Google Analytics 4 — details">
        <p>
          We use Google Analytics 4 (property{" "}
          <code className="text-brand-aqua font-mono text-[0.85em]">G-WLBXXFB21G</code>) with
          GDPR-compliant configuration: <strong className="text-text-primary">Consent Mode v2</strong>,
          IP anonymization (<code className="text-brand-aqua font-mono text-[0.85em]">anonymize_ip: true</code>),
          advertising signals disabled. Full Google privacy details:{" "}
          <a href="https://policies.google.com/privacy" target="_blank" rel="noopener" className="text-brand-aqua hover:text-brand-blue underline underline-offset-4">policies.google.com/privacy</a>.
        </p>
      </Section>

      <Section title="What we do NOT use">
        <ul className="space-y-2 mt-3">
          {[
            "Meta Pixel, TikTok Pixel, LinkedIn Insight, Google Ads",
            "Behavioral profiling cookies",
            "Third-party advertising cookies",
            "Browser fingerprinting",
            "Beacons or tracking pixels in emails",
            "Session recording (Hotjar, FullStory, etc.)",
          ].map((item) => (
            <li key={item} className="flex gap-2"><span className="text-error mt-0.5">✗</span><span>{item}</span></li>
          ))}
        </ul>
      </Section>

      <Section title="How to manage your consent">
        <p>
          You have full control. To change your choice: browser DevTools (F12) → "Application" →
          localStorage of fitmesh.fit → delete{" "}
          <code className="text-brand-aqua font-mono text-[0.85em]">fitmesh_cookie_consent</code>.
          On next visit, the banner reappears.
        </p>
        <p>
          To disable GA across all sites you can install the{" "}
          <a href="https://tools.google.com/dlpage/gaoptout" target="_blank" rel="noopener" className="text-brand-aqua hover:text-brand-blue underline underline-offset-4">
            Google Analytics Opt-out Browser Add-on
          </a>.
        </p>
      </Section>

      <Section title="Contact">
        <p>
          For Cookie Policy questions:{" "}
          <a href="mailto:privacy@fitmesh.fit" className="text-brand-aqua hover:text-brand-blue underline underline-offset-4">privacy@fitmesh.fit</a>.
        </p>
      </Section>
    </>
  );
}

function CookiesES() {
  return (
    <>
      <Section title="En resumen">
        <p>
          fitmesh.fit usa <strong className="text-text-primary">cookies técnicas esenciales</strong> para
          funcionar correctamente y, <strong className="text-text-primary">solo después de tu consentimiento
          explícito a través del banner</strong>, Google Analytics 4 para entender cómo los usuarios
          utilizan el sitio de forma agregada y mejorar el producto.
        </p>
        <p>
          <strong className="text-text-primary">No usamos cookies publicitarias</strong>, no creamos
          perfiles de usuario, no vendemos datos y no mostramos publicidad.
        </p>
      </Section>

      <Section title="Cookies que usamos">
        <div className="overflow-x-auto -mx-4 sm:mx-0">
          <table className="min-w-full text-sm border-collapse">
            <thead>
              <tr className="border-b border-divider">
                <Th>Nombre</Th><Th>Categoría</Th><Th>Duración</Th><Th>Finalidad</Th>
              </tr>
            </thead>
            <tbody>
              <Row name="fitmesh_cookie_consent" type="localStorage" category="Técnica" duration="Persistente" scope="Guarda tu elección en el banner de cookies. No contiene datos personales." />
              <Row name="_ga" type="cookie" category="Analítica (opcional)" duration="2 años" scope="Google Analytics 4: identifica visitantes de forma anónima. Se carga SOLO tras «Aceptar todo»." />
              <Row name="_ga_WLBXXFB21G" type="cookie" category="Analítica (opcional)" duration="2 años" scope="Google Analytics 4: persistencia de sesión. Se carga SOLO tras «Aceptar todo»." />
              <Row name="Cookies técnicas de Vercel" type="cookie" category="Técnica" duration="Sesión" scope="Equilibrio de carga y prevención de abusos de la plataforma de alojamiento." />
            </tbody>
          </table>
        </div>
      </Section>

      <Section title="Google Analytics 4 — detalles">
        <p>
          Usamos Google Analytics 4 (propiedad{" "}
          <code className="text-brand-aqua font-mono text-[0.85em]">G-WLBXXFB21G</code>) con
          configuración compatible con el RGPD: <strong className="text-text-primary">Consent Mode v2</strong>,
          anonimización de IP (<code className="text-brand-aqua font-mono text-[0.85em]">anonymize_ip: true</code>),
          señales publicitarias desactivadas. Información completa sobre el uso de datos por parte de Google:{" "}
          <a href="https://policies.google.com/privacy" target="_blank" rel="noopener" className="text-brand-aqua hover:text-brand-blue underline underline-offset-4">policies.google.com/privacy</a>.
        </p>
      </Section>

      <Section title="Qué NO usamos">
        <ul className="space-y-2 mt-3">
          {[
            "Meta Pixel, TikTok Pixel, LinkedIn Insight, Google Ads",
            "Cookies de elaboración de perfiles de comportamiento",
            "Cookies publicitarias de terceros",
            "Huella digital del navegador (fingerprinting)",
            "Balizas o píxeles de seguimiento en correos electrónicos",
            "Grabación de sesiones (Hotjar, FullStory, etc.)",
          ].map((item) => (
            <li key={item} className="flex gap-2"><span className="text-error mt-0.5">✗</span><span>{item}</span></li>
          ))}
        </ul>
      </Section>

      <Section title="Cómo gestionar tu consentimiento">
        <p>
          Tienes el control total. Para cambiar tu elección: herramientas de desarrollo del navegador
          (F12) → "Application" → localStorage de fitmesh.fit → elimina{" "}
          <code className="text-brand-aqua font-mono text-[0.85em]">fitmesh_cookie_consent</code>.
          En tu próxima visita, el banner volverá a aparecer.
        </p>
        <p>
          Para desactivar GA en todos los sitios, puedes instalar el{" "}
          <a href="https://tools.google.com/dlpage/gaoptout" target="_blank" rel="noopener" className="text-brand-aqua hover:text-brand-blue underline underline-offset-4">
            complemento de inhabilitación para la Web de Google Analytics
          </a>.
        </p>
      </Section>

      <Section title="Contacto">
        <p>
          Para cualquier pregunta sobre esta Política de cookies:{" "}
          <a href="mailto:privacy@fitmesh.fit" className="text-brand-aqua hover:text-brand-blue underline underline-offset-4">privacy@fitmesh.fit</a>.
        </p>
      </Section>
    </>
  );
}
