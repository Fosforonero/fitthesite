import type { Metadata } from "next";
import { locales, type Locale, type Dictionary, getDictionary, localeAlternates } from "@/lib/i18n";
import { LegalPage, Section } from "@/components/legal/LegalLayout";
import { Breadcrumbs } from "@/components/seo/Breadcrumbs";
import { LegalJsonLd } from "@/components/seo/LegalJsonLd";
import ConsentPreferencesButton from "@/components/ConsentPreferencesButton";

const SITE_URL = "https://www.fitmesh.fit";
const LAST_UPDATED_IT = "22 settembre 2026";
const LAST_UPDATED_EN = "September 22, 2026";
const LAST_UPDATED_ES = "22 de septiembre de 2026";
const LAST_UPDATED_DE = "22. September 2026";
const LAST_UPDATED_PT = "22 de setembro de 2026";
const LAST_UPDATED_FR = "22 septembre 2026";

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
    pl: "Polityka cookies",
    tr: "Cerez Politikasi",
    nl: "Cookiebeleid",
    ja: "Cookieポリシー",
    ko: "쿠키 정책",
    sv: "Cookiepolicy",
    da: "Cookiepolitik",
    no: "Cookie-policy",
    fi: "Evästekäytäntö",
  };
  const desc: Record<Locale, string> = {
    it: "Quali cookie usa fitmesh.fit e perché. Cookie tecnici essenziali + Google Analytics 4 con consenso esplicito.",
    en: "Which cookies fitmesh.fit uses and why. Strictly necessary cookies + Google Analytics 4 with explicit consent.",
    es: "Qué cookies usa fitmesh.fit y por qué. Cookies técnicas esenciales más Google Analytics 4 con consentimiento explícito.",
    de: "Welche Cookies fitmesh.fit verwendet und warum. Technisch notwendige Cookies sowie Google Analytics 4 nur mit ausdrücklicher Zustimmung.",
    pt: "Quais cookies o fitmesh.fit usa e por quê. Cookies técnicos essenciais mais Google Analytics 4 apenas com consentimento explícito.",
    fr: "Quels cookies fitmesh.fit utilise et pourquoi. Cookies techniques essentiels et Google Analytics 4 uniquement avec votre consentement explicite.",
    pl: "Jakich plikow cookies uzywa fitmesh.fit i dlaczego. Niezbedne pliki techniczne oraz Google Analytics 4 wylacznie za wyrazna zgoda uzytkownika.",
    tr: "fitmesh.fit'in hangi cerezleri kullandigini ve neden kullandigini aciklar. Zorunlu teknik cerezler ve yalnizca acik onay ile Google Analytics 4.",
    nl: "Welke cookies fitmesh.fit gebruikt en waarom. Strikt noodzakelijke cookies plus Google Analytics 4 alleen met expliciete toestemming.",
    ja: "fitmesh.fitが使用するCookieとその理由。必須の技術的Cookieとユーザーの同意に基づくGoogle Analytics 4。",
    ko: "fitmesh.fit이 사용하는 쿠키와 그 이유. 필수 기술 쿠키 + 명시적 동의를 통한 Google Analytics 4.",
    sv: "Vilka cookies fitmesh.fit använder och varför. Absolut nödvändiga cookies plus Google Analytics 4 med uttryckligt samtycke.",
    da: "Hvilke cookies fitmesh.fit bruger og hvorfor. Strengt nødvendige cookies plus Google Analytics 4 med udtrykkeligt samtykke.",
    no: "Hvilke informasjonskapsler fitmesh.fit bruker og hvorfor. Strengt nødvendige informasjonskapsler pluss Google Analytics 4 med uttrykkelig samtykke.",
    fi: "Mitä evästeitä fitmesh.fit käyttää ja miksi. Ehdottoman välttämättömät evästeet sekä Google Analytics 4 nimenomaisella suostumuksella.",
  };
  const lc = (locales as readonly string[]).includes(locale) ? (locale as Locale) : "it";
  return {
    // P0.17: stesso suffisso " · FitMesh" del blog, solo sul <title>
    // metadata — l'H1 (t.legal.cookies_title, sotto) e' una fonte diversa.
    title: `${titles[lc]} · FitMesh`,
    description: desc[lc],
    alternates: {
      canonical: `${SITE_URL}/${lc}/cookies`,
      languages: localeAlternates((l) => `${SITE_URL}/${l}/cookies`),
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
      <LegalJsonLd locale={lc} path="/cookies" name={t.legal.cookies_title} dateModified="2026-09-22" />
      <LegalPage kicker={t.legal.section} title={t.legal.cookies_title} lastUpdated={lastUpdated}>
        {lc === "it" ? <CookiesIT /> : lc === "es" ? <CookiesES /> : lc === "de" ? <CookiesDE /> : lc === "pt" ? <CookiesPT /> : lc === "fr" ? <CookiesFR /> : <CookiesEN labels={t.cookie_banner} />}
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
              <Row name="_ga" type="cookie" category="Analytics (opzionale)" duration="2 anni" scope="Google Analytics 4: identificativo che distingue un visitatore da un altro. Impostato SOLO dopo «Accetta tutto»." />
              <Row name="_ga_WLBXXFB21G" type="cookie" category="Analytics (opzionale)" duration="2 anni" scope="Google Analytics 4: persistenza di sessione. Impostato SOLO dopo «Accetta tutto»." />
              <Row name="Cookie tecnici Vercel" type="cookie" category="Tecnico" duration="Sessione" scope="Load balancing e prevenzione abusi della piattaforma di hosting." />
            </tbody>
          </table>
        </div>
      </Section>

      <Section title="Google Analytics 4 — dettagli">
        <p>
          Usiamo Google Analytics 4 (proprietà{" "}
          <code className="text-brand-aqua font-mono text-[0.85em]">G-WLBXXFB21G</code>). Il tag di Google viene caricato solo dopo che hai
          scelto «Accetta tutto» nel banner: prima di quella scelta, e dopo un rifiuto, il sito
          non invia richieste a Google Analytics. Nelle pagine di accesso, della dashboard web e degli
          inviti, e in quelle a cui torni dopo aver autorizzato un servizio collegato, il tag non
          viene caricato; se ci arrivi con il tag già caricato, la pagina si ricarica senza. Segnali
          pubblicitari e personalizzazione degli annunci sono disattivati. Dettagli completi
          sull'utilizzo di Google:{" "}
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
          Puoi cambiare la scelta in qualsiasi momento con il pulsante «Preferenze cookie» in fondo
          alle pagine del sito, oppure da qui:{" "}
          <ConsentPreferencesButton label="Preferenze cookie" className="text-brand-aqua hover:text-brand-blue underline underline-offset-4" />.
          Il banner si riapre: se scegli «Rifiuta opzionali» dopo aver accettato, il sito smette di
          inviare eventi a Google Analytics, cancella i cookie <code className="text-brand-aqua font-mono text-[0.85em]">_ga</code> e{" "}
          <code className="text-brand-aqua font-mono text-[0.85em]">_ga_WLBXXFB21G</code> a cui può accedere e ricarica la pagina
          senza il tag di Google.
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

/** Il corpo inglese e' servito anche a pl, tr, nl, ja, ko, sv, da, no, fi: i nomi dei pulsanti vengono dal dizionario della lingua della pagina. */
function CookiesEN({ labels }: { labels: Dictionary["cookie_banner"] }) {
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
              <Row name="_ga" type="cookie" category="Analytics (optional)" duration="2 years" scope={`Google Analytics 4: identifier that tells one visitor from another. Set ONLY after “${labels.accept}”.`} />
              <Row name="_ga_WLBXXFB21G" type="cookie" category="Analytics (optional)" duration="2 years" scope={`Google Analytics 4: session persistence. Set ONLY after “${labels.accept}”.`} />
              <Row name="Vercel technical cookies" type="cookie" category="Technical" duration="Session" scope="Hosting platform load balancing and abuse prevention." />
            </tbody>
          </table>
        </div>
      </Section>

      <Section title="Google Analytics 4 — details">
        <p>
          We use Google Analytics 4 (property{" "}
          <code className="text-brand-aqua font-mono text-[0.85em]">G-WLBXXFB21G</code>). The Google tag is loaded only after you choose
          “{labels.accept}” in the banner: before that choice, and after a rejection, the site sends
          no requests to Google Analytics. On sign-in, web dashboard and invitation pages, and
          on pages you return to after authorizing a connected service, the tag is not loaded; if
          you reach one with the tag already loaded, the page reloads without it. Advertising signals and
          ad personalization are disabled. Full Google privacy details:{" "}
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
          You can change your choice at any time with the “{labels.preferences}” button at the bottom
          of the site's pages, or from here:{" "}
          <ConsentPreferencesButton label={labels.preferences} className="text-brand-aqua hover:text-brand-blue underline underline-offset-4" />.
          The banner reopens: if you choose “{labels.reject}” after accepting, the site stops sending
          events to Google Analytics, deletes the <code className="text-brand-aqua font-mono text-[0.85em]">_ga</code> and{" "}
          <code className="text-brand-aqua font-mono text-[0.85em]">_ga_WLBXXFB21G</code> cookies it can reach, and reloads the page
          without the Google tag.
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
              <Row name="_ga" type="cookie" category="Analítica (opcional)" duration="2 años" scope="Google Analytics 4: identificador que distingue a un visitante de otro. Se establece SOLO tras «Aceptar todo»." />
              <Row name="_ga_WLBXXFB21G" type="cookie" category="Analítica (opcional)" duration="2 años" scope="Google Analytics 4: persistencia de sesión. Se establece SOLO tras «Aceptar todo»." />
              <Row name="Cookies técnicas de Vercel" type="cookie" category="Técnica" duration="Sesión" scope="Equilibrio de carga y prevención de abusos de la plataforma de alojamiento." />
            </tbody>
          </table>
        </div>
      </Section>

      <Section title="Google Analytics 4 — detalles">
        <p>
          Usamos Google Analytics 4 (propiedad{" "}
          <code className="text-brand-aqua font-mono text-[0.85em]">G-WLBXXFB21G</code>). La etiqueta de Google solo se carga después de que
          elijas «Aceptar todo» en el banner: antes de esa elección, y tras un rechazo, el sitio no
          envía solicitudes a Google Analytics. En las páginas de inicio de sesión, del panel web
          y de invitaciones, y en las páginas a las que vuelves después de autorizar un servicio
          conectado, la etiqueta no se carga; si llegas a una con la etiqueta ya cargada, la página
          se recarga sin ella. Las señales publicitarias y la personalización de anuncios están desactivadas.
          Información completa sobre el uso de datos por parte de Google:{" "}
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
          Puedes cambiar tu elección en cualquier momento con el botón «Preferencias de cookies» al
          pie de las páginas del sitio, o desde aquí:{" "}
          <ConsentPreferencesButton label="Preferencias de cookies" className="text-brand-aqua hover:text-brand-blue underline underline-offset-4" />.
          El banner vuelve a abrirse: si eliges «Rechazar opcionales» después de haber aceptado, el
          sitio deja de enviar eventos a Google Analytics, elimina las cookies <code className="text-brand-aqua font-mono text-[0.85em]">_ga</code> y{" "}
          <code className="text-brand-aqua font-mono text-[0.85em]">_ga_WLBXXFB21G</code> a las que puede acceder y vuelve a cargar
          la página sin la etiqueta de Google.
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
              <Row name="_ga" type="cookie" category="Analytics (optional)" duration="2 Jahre" scope="Google Analytics 4: Kennung, die Besucher voneinander unterscheidet. Wird NUR nach „Alle akzeptieren“ gesetzt." />
              <Row name="_ga_WLBXXFB21G" type="cookie" category="Analytics (optional)" duration="2 Jahre" scope="Google Analytics 4: Sitzungspersistenz. Wird NUR nach „Alle akzeptieren“ gesetzt." />
              <Row name="Technische Vercel-Cookies" type="cookie" category="Technisch" duration="Sitzung" scope="Load-Balancing und Missbrauchsschutz der Hosting-Plattform." />
            </tbody>
          </table>
        </div>
      </Section>

      <Section title="Google Analytics 4 — Details">
        <p>
          Wir verwenden Google Analytics 4 (Property{" "}
          <code className="text-brand-aqua font-mono text-[0.85em]">G-WLBXXFB21G</code>). Das Google-Tag wird erst geladen, nachdem du im
          Banner „Alle akzeptieren“ gewählt hast: Vor dieser Wahl und nach einer Ablehnung sendet die
          Website keine Anfragen an Google Analytics. Auf Anmelde- und Einladungsseiten, im Web-Dashboard
          und auf Seiten, auf die du nach der Autorisierung eines verbundenen Dienstes zurückkehrst,
          wird das Tag nicht geladen; kommst du mit bereits geladenem Tag dorthin, wird die Seite
          ohne das Tag neu geladen. Werbesignale und personalisierte Werbung sind
          deaktiviert. Vollständige Datenschutzinformationen von Google:{" "}
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
          Du kannst deine Auswahl jederzeit über die Schaltfläche „Cookie-Einstellungen“ am Ende
          der Seiten dieser Website ändern oder direkt hier:{" "}
          <ConsentPreferencesButton label="Cookie-Einstellungen" className="text-brand-aqua hover:text-brand-blue underline underline-offset-4" />.
          Das Banner öffnet sich erneut: Wählst du nach einer Zustimmung „Optionale ablehnen“, sendet
          die Website keine Ereignisse mehr an Google Analytics, löscht die Cookies <code className="text-brand-aqua font-mono text-[0.85em]">_ga</code> und{" "}
          <code className="text-brand-aqua font-mono text-[0.85em]">_ga_WLBXXFB21G</code>, soweit sie darauf zugreifen kann, und lädt
          die Seite ohne das Google-Tag neu.
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
              <Row name="_ga" type="cookie" category="Analytics (opcional)" duration="2 anos" scope="Google Analytics 4: identificador que distingue um visitante de outro. Definido APENAS após “Aceitar tudo”." />
              <Row name="_ga_WLBXXFB21G" type="cookie" category="Analytics (opcional)" duration="2 anos" scope="Google Analytics 4: persistência de sessão. Definido APENAS após “Aceitar tudo”." />
              <Row name="Cookies técnicos do Vercel" type="cookie" category="Técnico" duration="Sessão" scope="Balanceamento de carga e prevenção de abusos da plataforma de hospedagem." />
            </tbody>
          </table>
        </div>
      </Section>

      <Section title="Google Analytics 4 — detalhes">
        <p>
          Usamos o Google Analytics 4 (propriedade{" "}
          <code className="text-brand-aqua font-mono text-[0.85em]">G-WLBXXFB21G</code>). A tag do Google só é carregada depois que você
          escolhe “Aceitar tudo” no banner: antes dessa escolha, e depois de uma recusa, o site não
          envia solicitações ao Google Analytics. Nas páginas de login, do painel web e de convites, e
          nas páginas às quais você volta depois de autorizar um serviço conectado, a tag não é
          carregada; se você chegar a uma delas com a tag já carregada, a página é recarregada sem ela. Os sinais de
          publicidade e a personalização de anúncios estão desativados. Detalhes completos sobre a
          privacidade do Google:{" "}
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
          Você pode alterar sua escolha a qualquer momento pelo botão “Preferências de cookies” no
          rodapé das páginas do site, ou por aqui:{" "}
          <ConsentPreferencesButton label="Preferências de cookies" className="text-brand-aqua hover:text-brand-blue underline underline-offset-4" />.
          O banner é reaberto: se você escolher “Recusar opcionais” depois de ter aceitado, o site
          deixa de enviar eventos ao Google Analytics, exclui os cookies <code className="text-brand-aqua font-mono text-[0.85em]">_ga</code> e{" "}
          <code className="text-brand-aqua font-mono text-[0.85em]">_ga_WLBXXFB21G</code> que consegue acessar e recarrega a página
          sem a tag do Google.
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
              <Row name="_ga" type="cookie" category="Analytics (optionnel)" duration="2 ans" scope="Google Analytics 4 : identifiant qui distingue un visiteur d'un autre. Défini UNIQUEMENT après « Tout accepter »." />
              <Row name="_ga_WLBXXFB21G" type="cookie" category="Analytics (optionnel)" duration="2 ans" scope="Google Analytics 4 : persistance de session. Défini UNIQUEMENT après « Tout accepter »." />
              <Row name="Cookies techniques Vercel" type="cookie" category="Technique" duration="Session" scope="Équilibrage de charge et prévention des abus de la plateforme d'hébergement." />
            </tbody>
          </table>
        </div>
      </Section>

      <Section title="Google Analytics 4 — détails">
        <p>
          Nous utilisons Google Analytics 4 (propriété{" "}
          <code className="text-brand-aqua font-mono text-[0.85em]">G-WLBXXFB21G</code>). La balise Google n'est chargée qu'après votre choix
          « Tout accepter » dans le bandeau : avant ce choix, et après un refus, le site n'envoie
          aucune requête à Google Analytics. Sur les pages de connexion, du tableau de bord web et
          d'invitation, ainsi que sur les pages où vous revenez après avoir autorisé un service
          connecté, la balise n'est pas chargée ; si vous y arrivez alors que la balise est déjà
          chargée, la page se recharge sans elle. Les signaux publicitaires et la personnalisation des annonces sont
          désactivés. Informations complètes sur la confidentialité Google :{" "}
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
          Vous pouvez modifier votre choix à tout moment avec le bouton « Paramètres des cookies » en
          bas des pages du site, ou d'ici :{" "}
          <ConsentPreferencesButton label="Paramètres des cookies" className="text-brand-aqua hover:text-brand-blue underline underline-offset-4" />.
          Le bandeau s'ouvre à nouveau : si vous choisissez « Refuser les optionnels » après avoir
          accepté, le site cesse d'envoyer des événements à Google Analytics, supprime les cookies <code className="text-brand-aqua font-mono text-[0.85em]">_ga</code> et{" "}
          <code className="text-brand-aqua font-mono text-[0.85em]">_ga_WLBXXFB21G</code> auxquels il a accès et recharge la page
          sans la balise Google.
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
