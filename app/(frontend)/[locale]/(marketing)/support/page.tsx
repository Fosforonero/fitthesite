import type { Metadata } from "next";
import { locales, type Locale, getDictionary, localeAlternates } from "@/lib/i18n";
import { Breadcrumbs } from "@/components/seo/Breadcrumbs";
import { JsonLd } from "@/components/seo/JsonLd";

const SITE_URL = "https://www.fitmesh.fit";

const FAQ_IT = [
  {
    q: "L'app non mostra dati. Cosa devo fare?",
    a: "Verifica nell'ordine: (1) Health Connect è installato dal Play Store? (2) Hai concesso il permesso «Lettura dati in background» dentro Health Connect? (3) Premi «Sincronizza Ora» nelle impostazioni. Se persiste, scrivici allegando uno screenshot del pannello «Stato».",
  },
  { q: "Quanto consuma di batteria?", a: "Circa 1-2% al giorno con sync ogni 30 minuti. È sotto la soglia di rilevamento di Android come «app che drena la batteria». Se vedi consumi anomali, probabilmente Health Connect stesso sta indicizzando, non FitMesh Sync." },
  { q: "Funziona offline?", a: "L'app raccoglie e mette in coda i dati anche senza rete. Appena torni online, sincronizza automaticamente tutto l'arretrato. La dashboard web invece richiede connessione internet attiva." },
  { q: "Posso usare un server privato?", a: "Sì, su richiesta. Per esigenze enterprise (RSA, cliniche, studi medici, gruppi famiglia con dati segregati) configuriamo un server dedicato con il tuo dominio, backup gestiti e SLA dedicato. Scrivi a sales@fitmesh.fit indicando volume utenti previsto e requisiti di conservazione dati." },
  { q: "Quanto costa FitMesh Sync?", a: "€3,99 su Android · €4,99 su iPhone: acquisto unico, niente abbonamento, niente rinnovi automatici, niente sorprese in fattura." },
  { q: "Ho cambiato telefono. Perdo i miei dati?", a: "No. I dati sono sul server, non sul telefono. Reinstalla l'app, fai login (o inserisci il tuo device ID precedente nelle impostazioni se hai un account avanzato) e ritrovi tutto." },
  { q: "Supporto iOS?", a: "In sviluppo. iOS arriverà nel 2026 con la stessa architettura: app nativa SwiftUI che legge da Apple HealthKit. Iscriviti via hello@fitmesh.fit per essere avvisato." },
];

const FAQ_EN = [
  {
    q: "The app shows no data. What do I do?",
    a: "Check in order: (1) Is Health Connect installed from the Play Store? (2) Did you grant «Read data in background» permission inside Health Connect? (3) Tap «Sync now» in settings. If the issue persists, email us with a screenshot of the «Status» panel.",
  },
  { q: "How much battery does it use?", a: "About 1-2% per day with 30-minute sync intervals. Below Android's threshold for «battery draining apps». If you see abnormal drain, Health Connect itself is likely indexing, not FitMesh Sync." },
  { q: "Does it work offline?", a: "The app collects and queues data even without network. As soon as you're back online, it syncs all the backlog automatically. The web dashboard, however, requires an active internet connection." },
  { q: "Can I have my own private server?", a: "Yes, on request. For enterprise needs (nursing homes, clinics, medical practices, family groups with segregated data) we deploy a dedicated server with your domain, managed backups and a dedicated SLA. Email sales@fitmesh.fit with expected user volume and data retention requirements." },
  { q: "How much does FitMesh Sync cost?", a: "€3.99 on Android · €4.99 on iPhone: one-time purchase, no subscription, no auto-renewals, no billing surprises." },
  { q: "I switched phones. Do I lose my data?", a: "No. Data is on the server, not the phone. Reinstall the app, log in (or enter your previous device ID in settings if you have an advanced account) and you get everything back." },
  { q: "iOS support?", a: "In development. iOS will arrive in 2026 with the same architecture: native SwiftUI app reading from Apple HealthKit. Subscribe via hello@fitmesh.fit to be notified." },
];

const FAQ_ES = [
  {
    q: "La app no muestra datos. ¿Qué hago?",
    a: "Verifica en este orden: (1) ¿Tienes Health Connect instalado desde Google Play? (2) ¿Concediste el permiso «Leer datos en segundo plano» dentro de Health Connect? (3) Pulsa «Sincronizar ahora» en los ajustes. Si el problema persiste, escríbenos adjuntando una captura de pantalla del panel «Estado».",
  },
  { q: "¿Cuánta batería consume?", a: "Aproximadamente un 1-2% al día con sincronizaciones cada 30 minutos. Está por debajo del umbral que Android considera como apps que drenan la batería. Si ves un consumo anormal, lo más probable es que sea Health Connect indexando datos, no FitMesh Sync." },
  { q: "¿Funciona sin conexión?", a: "La app recopila y pone en cola los datos aunque no tengas red. En cuanto recuperas la conexión, sincroniza todo el historial acumulado de forma automática. El panel web, en cambio, requiere conexión a internet activa." },
  { q: "¿Puedo usar un servidor privado?", a: "Sí, bajo petición. Para necesidades empresariales (residencias, clínicas, consultorios, grupos familiares con datos segregados) configuramos un servidor dedicado con tu dominio, copias de seguridad gestionadas y un SLA dedicado. Escribe a sales@fitmesh.fit indicando el volumen de usuarios previsto y los requisitos de conservación de datos." },
  { q: "¿Cuánto cuesta FitMesh Sync?", a: "3,99 € en Android · 4,99 € en iPhone: pago único, sin suscripción, sin renovaciones automáticas, sin sorpresas en la factura." },
  { q: "Cambié de teléfono. ¿Pierdo mis datos?", a: "No. Los datos están en el servidor, no en el teléfono. Reinstala la app, inicia sesión (o introduce tu ID de dispositivo anterior en los ajustes si tienes una cuenta avanzada) y recuperas todo." },
  { q: "¿Habrá soporte para iOS?", a: "Está en desarrollo. iOS llegará en 2026 con la misma arquitectura: una app nativa SwiftUI que lee desde Apple HealthKit. Suscríbete en hello@fitmesh.fit para recibir un aviso." },
];

const FAQ_DE = [
  {
    q: "Die App zeigt keine Daten an. Was soll ich tun?",
    a: "Prüfe der Reihe nach: (1) Ist Health Connect aus dem Play Store installiert? (2) Hast du in Health Connect die Berechtigung «Daten im Hintergrund lesen» erteilt? (3) Tippe in den Einstellungen auf «Jetzt synchronisieren». Wenn das Problem weiterhin besteht, schreib uns mit einem Screenshot des Bereichs «Status».",
  },
  { q: "Wie viel Akku verbraucht die App?", a: "Ungefähr 1-2% pro Tag bei einer Synchronisierung alle 30 Minuten. Das liegt unter der Schwelle, ab der Android eine App als akkuhungrig einstuft. Wenn du einen ungewöhnlich hohen Verbrauch siehst, indiziert wahrscheinlich Health Connect selbst Daten, nicht FitMesh Sync." },
  { q: "Funktioniert die App offline?", a: "Die App erfasst und speichert Daten auch ohne Netzwerkverbindung in einer Warteschlange. Sobald du wieder online bist, synchronisiert sie den gesamten Rückstand automatisch. Das Web-Dashboard benötigt hingegen eine aktive Internetverbindung." },
  { q: "Kann ich einen eigenen privaten Server nutzen?", a: "Ja, auf Anfrage. Für Unternehmensanforderungen (Pflegeheime, Kliniken, Arztpraxen, Familiengruppen mit getrennten Daten) richten wir einen dedizierten Server mit deiner Domain, verwalteten Backups und einem dedizierten SLA ein. Schreib uns an sales@fitmesh.fit und gib die erwartete Nutzeranzahl sowie deine Anforderungen zur Datenspeicherung an." },
  { q: "Was kostet FitMesh Sync?", a: "3,99 € auf Android · 4,99 € auf iPhone: Einmalkauf, kein Abonnement, keine automatischen Verlängerungen, keine Überraschungen auf der Rechnung." },
  { q: "Ich habe mein Telefon gewechselt. Verliere ich meine Daten?", a: "Nein. Die Daten liegen auf dem Server, nicht auf dem Gerät. Installiere die App neu, melde dich an (oder gib in den Einstellungen deine vorherige Geräte-ID ein, falls du ein erweitertes Konto hast) und du findest alles wieder." },
  { q: "Gibt es iOS-Unterstützung?", a: "In Entwicklung. iOS wird 2026 mit derselben Architektur erscheinen: eine native SwiftUI-App, die Daten aus Apple HealthKit liest. Melde dich über hello@fitmesh.fit an, um benachrichtigt zu werden." },
];

const FAQ_PT = [
  {
    q: "O app não mostra dados. O que faço?",
    a: "Verifique nesta ordem: (1) O Health Connect está instalado pela Google Play? (2) Você concedeu a permissão «Ler dados em segundo plano» dentro do Health Connect? (3) Toque em «Sincronizar agora» nas configurações. Se o problema persistir, entre em contato conosco enviando uma captura de tela do painel «Status».",
  },
  { q: "Quanto de bateria o app consome?", a: "Cerca de 1-2% por dia com sincronizações a cada 30 minutos. Abaixo do limite que o Android considera como apps que drenam a bateria. Se você notar um consumo anormal, provavelmente é o próprio Health Connect indexando dados, não o FitMesh Sync." },
  { q: "Funciona sem conexão?", a: "O app coleta e coloca os dados em fila mesmo sem rede. Assim que você voltar a ficar online, ele sincroniza todo o histórico acumulado automaticamente. O painel web, no entanto, requer uma conexão ativa com a internet." },
  { q: "Posso usar um servidor privado?", a: "Sim, sob solicitação. Para necessidades corporativas (casas de repouso, clínicas, consultórios, grupos familiares com dados separados) configuramos um servidor dedicado com seu domínio, backups gerenciados e um SLA dedicado. Escreva para sales@fitmesh.fit informando o volume de usuários esperado e os requisitos de retenção de dados." },
  { q: "Quanto custa o FitMesh Sync?", a: "€3,99 no Android · €4,99 no iPhone: compra única, sem assinatura, sem renovações automáticas, sem surpresas na fatura." },
  { q: "Troquei de celular. Perco meus dados?", a: "Não. Os dados estão no servidor, não no celular. Reinstale o app, faça login (ou insira seu ID de dispositivo anterior nas configurações se você tiver uma conta avançada) e encontrará tudo de volta." },
  { q: "Haverá suporte para iOS?", a: "Em desenvolvimento. O iOS chegará em 2026 com a mesma arquitetura: um app nativo SwiftUI que lê dados do Apple HealthKit. Inscreva-se em hello@fitmesh.fit para ser avisado." },
];

const FAQ_FR = [
  {
    q: "L'application n'affiche aucune donnée. Que faire ?",
    a: "Vérifiez dans cet ordre : (1) Health Connect est-il installé depuis le Play Store ? (2) Avez-vous accordé l'autorisation «Lire les données en arrière-plan» dans Health Connect ? (3) Appuyez sur «Synchroniser maintenant» dans les paramètres. Si le problème persiste, écrivez-nous en joignant une capture d'écran du panneau «Statut».",
  },
  { q: "Quelle est la consommation de batterie ?", a: "Environ 1 à 2 % par jour avec des synchronisations toutes les 30 minutes. En dessous du seuil qu'Android considère comme des applications énergivores. Si vous constatez une consommation anormale, c'est probablement Health Connect lui-même qui indexe des données, et non FitMesh Sync." },
  { q: "L'application fonctionne-t-elle hors ligne ?", a: "L'application collecte et met en file d'attente les données même sans réseau. Dès que vous êtes de nouveau connecté, elle synchronise automatiquement tout l'arriéré. Le tableau de bord web, en revanche, nécessite une connexion internet active." },
  { q: "Puis-je utiliser un serveur privé ?", a: "Oui, sur demande. Pour les besoins des entreprises (maisons de retraite, cliniques, cabinets médicaux, groupes familiaux avec données séparées), nous déployons un serveur dédié avec votre domaine, des sauvegardes gérées et un SLA dédié. Écrivez à sales@fitmesh.fit en indiquant le volume d'utilisateurs prévu et vos exigences de conservation des données." },
  { q: "Combien coûte FitMesh Sync ?", a: "3,99 € sur Android · 4,99 € sur iPhone : achat unique, sans abonnement, sans renouvellements automatiques, sans mauvaises surprises sur la facture." },
  { q: "J'ai changé de téléphone. Vais-je perdre mes données ?", a: "Non. Les données sont sur le serveur, pas sur le téléphone. Réinstallez l'application, connectez-vous (ou saisissez votre identifiant d'appareil précédent dans les paramètres si vous avez un compte avancé) et vous retrouvez tout." },
  { q: "Y aura-t-il une prise en charge iOS ?", a: "En cours de développement. iOS arrivera en 2026 avec la même architecture : une application native SwiftUI qui lit les données depuis Apple HealthKit. Inscrivez-vous via hello@fitmesh.fit pour être informé." },
];

export async function generateMetadata(
  { params }: { params: Promise<{ locale: string }> },
): Promise<Metadata> {
  const { locale } = await params;
  const titles: Record<Locale, string> = { it: "Supporto", en: "Support", es: "Soporte", de: "Support", pt: "Suporte", fr: "Assistance", pl: "Wsparcie", tr: "Destek", nl: "Ondersteuning", ja: "サポート", ko: "고객 지원" };
  const desc: Record<Locale, string> = {
    it: "FAQ, troubleshooting e contatti per FitMesh Sync. Risposte rapide ai problemi più comuni.",
    en: "FAQ, troubleshooting and contacts for FitMesh Sync. Quick answers to the most common questions.",
    es: "Preguntas frecuentes, solución de problemas y contacto para FitMesh Sync. Respuestas rápidas a las dudas más habituales.",
    de: "Häufige Fragen, Fehlerbehebung und Kontakt für FitMesh Sync. Schnelle Antworten auf die häufigsten Probleme.",
    pt: "Perguntas frequentes, solução de problemas e contato do FitMesh Sync. Respostas rápidas para as dúvidas mais comuns.",
    fr: "FAQ, dépannage et contact pour FitMesh Sync. Réponses rapides aux questions les plus fréquentes.",
    pl: "FAQ, rozwiazywanie problemow i kontakt z FitMesh Sync. Szybkie odpowiedzi na najczestsze pytania.",
    tr: "FitMesh Sync icin SSS, sorun giderme ve iletisim bilgileri. En sik sorulan sorulara hizli cevaplar.",
    nl: "FAQ, probleemoplossing en contact voor FitMesh Sync. Snelle antwoorden op de meest gestelde vragen.",
    ja: "FitMesh SyncのFAQ、トラブルシューティング、お問い合わせ。よくある質問への迅速な回答。",
    ko: "FitMesh Sync FAQ, 문제 해결 및 연락처. 가장 자주 묻는 질문에 대한 빠른 답변.",
  };
  const lc = (locales as readonly string[]).includes(locale) ? (locale as Locale) : "it";
  return {
    title: titles[lc],
    description: desc[lc],
    alternates: {
      canonical: `${SITE_URL}/${lc}/support`,
      languages: localeAlternates((l) => `${SITE_URL}/${l}/support`),
    },
  };
}

export default async function SupportPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const lc: Locale = (locales as readonly string[]).includes(locale) ? (locale as Locale) : "it";
  const t = await getDictionary(lc);
  const faqs = lc === "en" ? FAQ_EN : lc === "es" ? FAQ_ES : lc === "de" ? FAQ_DE : lc === "pt" ? FAQ_PT : lc === "fr" ? FAQ_FR : FAQ_IT;

  // Structured data — FAQPage for Google rich result
  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    inLanguage: lc === "it" ? "it-IT" : lc === "es" ? "es-ES" : lc === "de" ? "de-DE" : lc === "pt" ? "pt-BR" : lc === "fr" ? "fr-FR" : "en-US",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };

  const subtitle = lc === "en"
    ? "The answers to the most common issues. If you can't find what you're looking for,"
    : lc === "es"
    ? "Respuestas a las dudas más habituales. Si no encuentras lo que buscas,"
    : lc === "de"
    ? "Antworten auf die häufigsten Fragen. Wenn du nicht findest, was du suchst,"
    : lc === "pt"
    ? "Respostas para as dúvidas mais comuns. Se você não encontrar o que procura,"
    : lc === "fr"
    ? "Les réponses aux questions les plus fréquentes. Si vous ne trouvez pas ce que vous cherchez,"
    : "Le risposte ai problemi più comuni. Se non trovi quello che cerchi,";

  const writeUsLabel = lc === "en"
    ? "write to support@fitmesh.fit"
    : lc === "es"
    ? "escríbenos a support@fitmesh.fit"
    : lc === "de"
    ? "schreib uns an support@fitmesh.fit"
    : lc === "pt"
    ? "escreva para support@fitmesh.fit"
    : lc === "fr"
    ? "écrivez-nous à support@fitmesh.fit"
    : "scrivici a support@fitmesh.fit";

  const moreQuestionsHeading = lc === "en"
    ? "Have another question?"
    : lc === "es"
    ? "¿Tienes alguna otra duda?"
    : lc === "de"
    ? "Noch eine Frage?"
    : lc === "pt"
    ? "Tem outra dúvida?"
    : lc === "fr"
    ? "Vous avez une autre question ?"
    : "Hai un'altra domanda?";
  const moreQuestionsDesc = lc === "en"
    ? "Drop us a line. We respond personally within 48 hours (usually much sooner)."
    : lc === "es"
    ? "Escríbenos. Respondemos personalmente en menos de 48 horas (normalmente mucho antes)."
    : lc === "de"
    ? "Schreib uns. Wir antworten persönlich innerhalb von 48 Stunden (meistens viel früher)."
    : lc === "pt"
    ? "Fale com a gente. Respondemos pessoalmente em até 48 horas (geralmente muito antes)."
    : lc === "fr"
    ? "Contactez-nous. Nous répondons personnellement en moins de 48 heures (souvent bien avant)."
    : "Scrivici. Rispondiamo personalmente entro 48 ore (di solito molto prima).";

  const ctaPrimary = lc === "en"
    ? "Email support@fitmesh.fit"
    : lc === "es"
    ? "Escribe a support@fitmesh.fit"
    : lc === "de"
    ? "Schreib an support@fitmesh.fit"
    : lc === "pt"
    ? "Escreva para support@fitmesh.fit"
    : lc === "fr"
    ? "Écrire à support@fitmesh.fit"
    : "Scrivi a support@fitmesh.fit";

  const crumbName = lc === "en" ? "Support" : lc === "es" ? "Soporte" : lc === "de" ? "Support" : lc === "pt" ? "Suporte" : lc === "fr" ? "Assistance" : "Supporto";
  return (
    <article className="max-w-3xl mx-auto px-4 sm:px-6 py-16">
      <Breadcrumbs items={[{ name: crumbName, path: `/${lc}/support` }]} locale={lc} />
      <JsonLd data={faqJsonLd} />
      <header className="mb-10">
        <p className="text-[10px] uppercase tracking-[0.22em] text-brand-aqua font-semibold">
          {t.nav.support}
        </p>
        <h1 className="mt-2 font-display text-3xl sm:text-4xl font-semibold tracking-tight text-text-primary">
          {t.legal.support_title}
        </h1>
        <p className="mt-3 text-text-secondary">
          {subtitle}{" "}
          <a
            href="mailto:support@fitmesh.fit"
            className="text-brand-aqua hover:text-brand-blue underline underline-offset-4"
          >
            {writeUsLabel}
          </a>
          .
        </p>
      </header>

      <section className="space-y-3">
        {faqs.map((faq) => (
          <details
            key={faq.q}
            className="group rounded-[14px] border border-divider bg-bg-card/50 p-5 open:bg-bg-elevated/80 transition"
          >
            <summary className="cursor-pointer list-none flex items-start justify-between gap-3 text-text-primary font-medium">
              <span>{faq.q}</span>
              <span aria-hidden className="mt-1 text-text-muted group-open:rotate-45 transition-transform">+</span>
            </summary>
            <p className="mt-3 text-text-secondary text-sm leading-relaxed">{faq.a}</p>
          </details>
        ))}
      </section>

      <section className="mt-16">
        <div className="rounded-[14px] border border-divider bg-gradient-to-br from-bg-card to-bg-secondary p-8">
          <h2 className="font-display text-2xl font-semibold text-text-primary">
            {moreQuestionsHeading}
          </h2>
          <p className="mt-3 text-text-secondary">{moreQuestionsDesc}</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <a
              href="mailto:support@fitmesh.fit?subject=FitMesh%20Sync"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-pill btn-cta text-sm"
            >
              {ctaPrimary}
            </a>
            <a
              href="mailto:hello@fitmesh.fit"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-pill border border-divider text-text-primary hover:bg-white/5 transition"
            >
              hello@fitmesh.fit
            </a>
          </div>
        </div>
      </section>
    </article>
  );
}
