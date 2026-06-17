import type { Metadata } from "next";
import { locales, type Locale, getDictionary } from "@/lib/i18n";
import { LegalPage, Section } from "@/components/legal/LegalLayout";
import { Breadcrumbs } from "@/components/seo/Breadcrumbs";

const SITE_URL = "https://www.fitmesh.fit";
const LAST_UPDATED_IT = "16 giugno 2026";
const LAST_UPDATED_EN = "June 16, 2026";
const LAST_UPDATED_ES = "16 de junio de 2026";
const LAST_UPDATED_DE = "16. Juni 2026";
const LAST_UPDATED_PT = "16 de junho de 2026";
const LAST_UPDATED_FR = "16 juin 2026";

export async function generateMetadata(
  { params }: { params: Promise<{ locale: string }> },
): Promise<Metadata> {
  const { locale } = await params;
  const titles: Record<Locale, string> = {
    it: "Cookie Policy",
    en: "Cookie Policy",
    es: "Política de cookies",
    de: "Cookie-Richtlinie",
    pt: "Política de cookies",
    fr: "Politique de cookies",
  };
  const desc: Record<Locale, string> = {
    it: "Quali cookie usa fitmesh.fit e perché. Cookie tecnici essenziali + Google Analytics 4 con consenso esplicito.",
    en: "Which cookies fitmesh.fit uses and why. Strictly necessary cookies + Google Analytics 4 with explicit consent.",
    es: "Qué cookies usa fitmesh.fit y por qué. Cookies técnicas esenciales más Google Analytics 4 con consentimiento explícito.",
    de: "Welche Cookies fitmesh.fit verwendet und warum. Technisch notwendige Cookies sowie Google Analytics 4 nur mit ausdrücklicher Zustimmung.",
    pt: "Quais cookies o fitmesh.fit usa e por quê. Cookies técnicos essenciais mais Google Analytics 4 apenas com consentimento explícito.",
    fr: "Quels cookies fitmesh.fit utilise et pourquoi. Cookies techniques essentiels et Google Analytics 4 uniquement avec votre consentement explicite.",
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
        de: `${SITE_URL}/de/cookies`,
        pt: `${SITE_URL}/pt/cookies`,
        fr: `${SITE_URL}/fr/cookies`,
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
  const lastUpdated = `${t.legal.last_updated}: ${
    lc === "it" ? LAST_UPDATED_IT :
    lc === "es" ? LAST_UPDATED_ES :
    lc === "de" ? LAST_UPDATED_DE :
    lc === "pt" ? LAST_UPDATED_PT :
    lc === "fr" ? LAST_UPDATED_FR :
    LAST_UPDATED_EN
  }`;
  return (
    <>
      <Breadcrumbs items={[{ name: "Cookie Policy", path: `/${lc}/cookies` }]} locale={lc} />
      <LegalPage kicker={t.legal.section} title={t.legal.cookies_title} lastUpdated={lastUpdated}>
        {lc === "it" ? <CookiesIT /> : lc === "es" ? <CookiesES /> : lc === "de" ? <CookiesDE /> : lc === "pt" ? <CookiesPT /> : lc === "fr" ? <CookiesFR /> : <CookiesEN />}
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

function CookiesDE() {
  return (
    <>
      <Section title="Kurz zusammengefasst">
        <p>
          fitmesh.fit verwendet <strong className="text-text-primary">technisch notwendige Cookies</strong>,
          um zu funktionieren, und{" "}
          <strong className="text-text-primary">nur nach deiner ausdrücklichen Zustimmung über das Banner</strong>{" "}
          Google Analytics 4, um die Nutzung der Website in aggregierter Form zu verstehen und das Produkt
          zu verbessern.
        </p>
        <p>
          <strong className="text-text-primary">Wir verwenden keine Werbe-Cookies</strong>, erstellen keine
          Nutzerprofile, verkaufen keine Daten und schalten keine Werbung.
        </p>
      </Section>

      <Section title="Verwendete Cookies">
        <div className="overflow-x-auto -mx-4 sm:mx-0">
          <table className="min-w-full text-sm border-collapse">
            <thead>
              <tr className="border-b border-divider">
                <Th>Name</Th><Th>Kategorie</Th><Th>Laufzeit</Th><Th>Zweck</Th>
              </tr>
            </thead>
            <tbody>
              <Row name="fitmesh_cookie_consent" type="localStorage" category="Technisch" duration="Dauerhaft" scope="Speichert deine Auswahl im Cookie-Banner. Enthält keine personenbezogenen Daten." />
              <Row name="_ga" type="cookie" category="Analytics (optional)" duration="2 Jahre" scope="Google Analytics 4: anonyme Identifizierung von Besuchern. Wird NUR nach «Alle akzeptieren» geladen." />
              <Row name="_ga_WLBXXFB21G" type="cookie" category="Analytics (optional)" duration="2 Jahre" scope="Google Analytics 4: Sitzungspersistenz. Wird NUR nach «Alle akzeptieren» geladen." />
              <Row name="Technische Vercel-Cookies" type="cookie" category="Technisch" duration="Sitzung" scope="Load-Balancing und Missbrauchsschutz der Hosting-Plattform." />
            </tbody>
          </table>
        </div>
      </Section>

      <Section title="Google Analytics 4 — Details">
        <p>
          Wir verwenden Google Analytics 4 (Property{" "}
          <code className="text-brand-aqua font-mono text-[0.85em]">G-WLBXXFB21G</code>) mit
          DSGVO-konformer Konfiguration: <strong className="text-text-primary">Consent Mode v2</strong>,
          IP-Anonymisierung (<code className="text-brand-aqua font-mono text-[0.85em]">anonymize_ip: true</code>),
          Werbesignale deaktiviert. Vollständige Datenschutzinformationen von Google:{" "}
          <a href="https://policies.google.com/privacy" target="_blank" rel="noopener" className="text-brand-aqua hover:text-brand-blue underline underline-offset-4">policies.google.com/privacy</a>.
        </p>
      </Section>

      <Section title="Was wir NICHT verwenden">
        <ul className="space-y-2 mt-3">
          {[
            "Meta Pixel, TikTok Pixel, LinkedIn Insight, Google Ads",
            "Verhaltensbasierte Profiling-Cookies",
            "Werbe-Cookies von Drittanbietern",
            "Browser-Fingerprinting",
            "Beacons oder Tracking-Pixel in E-Mails",
            "Sitzungsaufzeichnung (Hotjar, FullStory usw.)",
          ].map((item) => (
            <li key={item} className="flex gap-2"><span className="text-error mt-0.5">✗</span><span>{item}</span></li>
          ))}
        </ul>
      </Section>

      <Section title="Einwilligung verwalten">
        <p>
          Du hast die volle Kontrolle. Um deine Auswahl zu ändern: Browser-DevTools (F12) → „Application"
          → localStorage von fitmesh.fit → Eintrag{" "}
          <code className="text-brand-aqua font-mono text-[0.85em]">fitmesh_cookie_consent</code>{" "}
          löschen. Beim nächsten Besuch erscheint das Banner erneut.
        </p>
        <p>
          Um GA auf allen Websites zu deaktivieren, kannst du das{" "}
          <a href="https://tools.google.com/dlpage/gaoptout" target="_blank" rel="noopener" className="text-brand-aqua hover:text-brand-blue underline underline-offset-4">
            Google Analytics Opt-out Browser-Add-on
          </a>{" "}
          installieren.
        </p>
      </Section>

      <Section title="Kontakt">
        <p>
          Bei Fragen zu dieser Cookie-Richtlinie:{" "}
          <a href="mailto:privacy@fitmesh.fit" className="text-brand-aqua hover:text-brand-blue underline underline-offset-4">privacy@fitmesh.fit</a>.
        </p>
      </Section>
    </>
  );
}

function CookiesPT() {
  return (
    <>
      <Section title="Em resumo">
        <p>
          O fitmesh.fit usa <strong className="text-text-primary">cookies técnicos essenciais</strong> para
          funcionar e, <strong className="text-text-primary">apenas após o seu consentimento explícito
          pelo banner</strong>, Google Analytics 4 para entender como os usuários utilizam o site de
          forma agregada e melhorar o produto.
        </p>
        <p>
          <strong className="text-text-primary">Não usamos cookies publicitários</strong>, não criamos
          perfis de usuário, não vendemos dados e não exibimos publicidade.
        </p>
      </Section>

      <Section title="Cookies que usamos">
        <div className="overflow-x-auto -mx-4 sm:mx-0">
          <table className="min-w-full text-sm border-collapse">
            <thead>
              <tr className="border-b border-divider">
                <Th>Nome</Th><Th>Categoria</Th><Th>Duração</Th><Th>Finalidade</Th>
              </tr>
            </thead>
            <tbody>
              <Row name="fitmesh_cookie_consent" type="localStorage" category="Técnico" duration="Persistente" scope="Armazena sua escolha no banner de cookies. Não contém dados pessoais." />
              <Row name="_ga" type="cookie" category="Analytics (opcional)" duration="2 anos" scope="Google Analytics 4: identificação anônima de visitantes. Carregado APENAS após «Aceitar tudo»." />
              <Row name="_ga_WLBXXFB21G" type="cookie" category="Analytics (opcional)" duration="2 anos" scope="Google Analytics 4: persistência de sessão. Carregado APENAS após «Aceitar tudo»." />
              <Row name="Cookies técnicos do Vercel" type="cookie" category="Técnico" duration="Sessão" scope="Balanceamento de carga e prevenção de abusos da plataforma de hospedagem." />
            </tbody>
          </table>
        </div>
      </Section>

      <Section title="Google Analytics 4 — detalhes">
        <p>
          Usamos o Google Analytics 4 (propriedade{" "}
          <code className="text-brand-aqua font-mono text-[0.85em]">G-WLBXXFB21G</code>) com
          configuração em conformidade com o LGPD: <strong className="text-text-primary">Consent Mode v2</strong>,
          anonimização de IP (<code className="text-brand-aqua font-mono text-[0.85em]">anonymize_ip: true</code>),
          sinais de publicidade desativados. Detalhes completos sobre a privacidade do Google:{" "}
          <a href="https://policies.google.com/privacy" target="_blank" rel="noopener" className="text-brand-aqua hover:text-brand-blue underline underline-offset-4">policies.google.com/privacy</a>.
        </p>
      </Section>

      <Section title="O que NÃO usamos">
        <ul className="space-y-2 mt-3">
          {[
            "Meta Pixel, TikTok Pixel, LinkedIn Insight, Google Ads",
            "Cookies de elaboração de perfis comportamentais",
            "Cookies publicitários de terceiros",
            "Fingerprinting do navegador",
            "Beacons ou pixels de rastreamento em e-mails",
            "Gravação de sessão (Hotjar, FullStory, etc.)",
          ].map((item) => (
            <li key={item} className="flex gap-2"><span className="text-error mt-0.5">✗</span><span>{item}</span></li>
          ))}
        </ul>
      </Section>

      <Section title="Como gerenciar seu consentimento">
        <p>
          Você tem controle total. Para alterar sua escolha: DevTools do navegador (F12) → "Application"
          → localStorage do fitmesh.fit → exclua{" "}
          <code className="text-brand-aqua font-mono text-[0.85em]">fitmesh_cookie_consent</code>.
          Na próxima visita, o banner reaparecerá.
        </p>
        <p>
          Para desativar o GA em todos os sites, você pode instalar o{" "}
          <a href="https://tools.google.com/dlpage/gaoptout" target="_blank" rel="noopener" className="text-brand-aqua hover:text-brand-blue underline underline-offset-4">
            complemento de desativação do Google Analytics para navegadores
          </a>.
        </p>
      </Section>

      <Section title="Contato">
        <p>
          Para dúvidas sobre esta Política de cookies:{" "}
          <a href="mailto:privacy@fitmesh.fit" className="text-brand-aqua hover:text-brand-blue underline underline-offset-4">privacy@fitmesh.fit</a>.
        </p>
      </Section>
    </>
  );
}

function CookiesFR() {
  return (
    <>
      <Section title="En bref">
        <p>
          fitmesh.fit utilise des <strong className="text-text-primary">cookies techniques essentiels</strong> pour
          fonctionner et, <strong className="text-text-primary">uniquement après votre consentement explicite
          via le bandeau</strong>, Google Analytics 4 pour comprendre comment les utilisateurs naviguent sur
          le site de façon agrégée et améliorer le produit.
        </p>
        <p>
          <strong className="text-text-primary">Nous n'utilisons pas de cookies publicitaires</strong>, nous
          ne créons pas de profils utilisateur, nous ne vendons pas de données et nous n'affichons pas
          de publicités.
        </p>
      </Section>

      <Section title="Cookies utilisés">
        <div className="overflow-x-auto -mx-4 sm:mx-0">
          <table className="min-w-full text-sm border-collapse">
            <thead>
              <tr className="border-b border-divider">
                <Th>Nom</Th><Th>Catégorie</Th><Th>Durée</Th><Th>Finalité</Th>
              </tr>
            </thead>
            <tbody>
              <Row name="fitmesh_cookie_consent" type="localStorage" category="Technique" duration="Persistant" scope="Enregistre votre choix sur le bandeau cookies. Ne contient aucune donnée personnelle." />
              <Row name="_ga" type="cookie" category="Analytics (optionnel)" duration="2 ans" scope="Google Analytics 4: identification anonyme des visiteurs. Chargé UNIQUEMENT après «Tout accepter»." />
              <Row name="_ga_WLBXXFB21G" type="cookie" category="Analytics (optionnel)" duration="2 ans" scope="Google Analytics 4: persistance de session. Chargé UNIQUEMENT après «Tout accepter»." />
              <Row name="Cookies techniques Vercel" type="cookie" category="Technique" duration="Session" scope="Équilibrage de charge et prévention des abus de la plateforme d'hébergement." />
            </tbody>
          </table>
        </div>
      </Section>

      <Section title="Google Analytics 4 — détails">
        <p>
          Nous utilisons Google Analytics 4 (propriété{" "}
          <code className="text-brand-aqua font-mono text-[0.85em]">G-WLBXXFB21G</code>) avec
          une configuration conforme au RGPD: <strong className="text-text-primary">Consent Mode v2</strong>,
          anonymisation de l'IP (<code className="text-brand-aqua font-mono text-[0.85em]">anonymize_ip: true</code>),
          signaux publicitaires désactivés. Informations complètes sur la confidentialité Google:{" "}
          <a href="https://policies.google.com/privacy" target="_blank" rel="noopener" className="text-brand-aqua hover:text-brand-blue underline underline-offset-4">policies.google.com/privacy</a>.
        </p>
      </Section>

      <Section title="Ce que nous N'utilisons PAS">
        <ul className="space-y-2 mt-3">
          {[
            "Meta Pixel, TikTok Pixel, LinkedIn Insight, Google Ads",
            "Cookies de profilage comportemental",
            "Cookies publicitaires de tiers",
            "Empreinte numérique du navigateur (fingerprinting)",
            "Balises ou pixels de suivi dans les e-mails",
            "Enregistrement de session (Hotjar, FullStory, etc.)",
          ].map((item) => (
            <li key={item} className="flex gap-2"><span className="text-error mt-0.5">✗</span><span>{item}</span></li>
          ))}
        </ul>
      </Section>

      <Section title="Gérer votre consentement">
        <p>
          Vous avez le contrôle total. Pour modifier votre choix: outils de développement du navigateur
          (F12) → «Application» → localStorage de fitmesh.fit → supprimez{" "}
          <code className="text-brand-aqua font-mono text-[0.85em]">fitmesh_cookie_consent</code>.
          À la prochaine visite, le bandeau réapparaîtra.
        </p>
        <p>
          Pour désactiver GA sur tous les sites, vous pouvez installer le{" "}
          <a href="https://tools.google.com/dlpage/gaoptout" target="_blank" rel="noopener" className="text-brand-aqua hover:text-brand-blue underline underline-offset-4">
            module complémentaire de désinscription Google Analytics
          </a>.
        </p>
      </Section>

      <Section title="Contact">
        <p>
          Pour toute question sur cette Politique de cookies:{" "}
          <a href="mailto:privacy@fitmesh.fit" className="text-brand-aqua hover:text-brand-blue underline underline-offset-4">privacy@fitmesh.fit</a>.
        </p>
      </Section>
    </>
  );
}
