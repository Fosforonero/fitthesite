/**
 * Entità JSON-LD condivise fra layout globale e pagine blog: un'unica
 * identità Person (Matteo Pizzi) con un `@id` stabile, definita per intero
 * UNA volta (in Organization.founder, presente su ogni pagina via il layout
 * marketing) e referenziata per `@id` altrove (Article.author) invece di
 * essere ri-dichiarata — vedi requisito "collegare founder e publisher
 * tramite @id stabili".
 */

import type { Locale } from "@/lib/i18n";
import { SITE_URL } from "@/lib/product-facts";

/** @id stabile della persona — stesso identificatore ovunque compaia nel graph. */
export const AUTHOR_ID = `${SITE_URL}/it/about#matteo-pizzi`;

export const AUTHOR = {
  name: "Matteo Pizzi",
  jobTitle: "Founder & Solo Dev, FitMesh Sync · Fosforonero",
  url: `${SITE_URL}/it/about`,
  // sameAs: profili pubblici per verifica autorevolezza. Vuoto = aggiungi
  // LinkedIn/Twitter quando disponibili (Matteo ha LinkedIn personale?).
  sameAs: ["https://www.fosforonero.com"],
  bio: {
    it: "Sviluppatore software italiano. Ho costruito FitMesh Sync per riempire il vuoto tra il mio smartwatch e una vera dashboard personale. Privacy-first, indie, server EU.",
    en: "Italian software developer. I built FitMesh Sync to fill the gap between my smartwatch and a real personal dashboard. Privacy-first, indie, EU servers.",
    es: "Desarrollador de software italiano. Construí FitMesh Sync para cubrir el espacio entre mi smartwatch y un panel personal real. Privacidad ante todo, indie, servidores en la UE.",
    de: "Italienischer Softwareentwickler. Ich habe FitMesh Sync entwickelt, um die Lücke zwischen meinem Smartwatch und einem echten persönlichen Dashboard zu schließen. Datenschutz zuerst, indie, EU-Server.",
    pt: "Desenvolvedor de software italiano. Criei o FitMesh Sync para preencher a lacuna entre o meu smartwatch e um painel pessoal de verdade. Privacidade em primeiro lugar, indie, servidores na UE.",
    fr: "Développeur de logiciels italien. J'ai créé FitMesh Sync pour combler le fossé entre ma montre connectée et un vrai tableau de bord personnel. Confidentialité avant tout, indie, serveurs UE.",
    pl: "Włoski programista. Stworzyłem FitMesh Sync, aby wypełnić lukę między moim smartwatchem a prawdziwym osobistym dashboardem. Prywatność na pierwszym miejscu, indie, serwery w UE.",
    tr: "İtalyan yazılım geliştirici. FitMesh Sync'i akıllı saatim ile gerçek bir kişisel kontrol paneli arasındaki boşluğu doldurmak için kurdum. Gizlilik odaklı, bağımsız, AB sunucuları.",
    nl: "Italiaanse softwareontwikkelaar. Ik bouwde FitMesh Sync om de kloof tussen mijn smartwatch en een echt persoonlijk dashboard te overbruggen. Privacy-first, indie, EU-servers.",
    ja: "イタリア人ソフトウェア開発者。スマートウォッチと本物のパーソナルダッシュボードのギャップを埋めるためにFitMesh Syncを構築しました。プライバシーファースト、インディー、EUサーバー。",
    ko: "이탈리아 소프트웨어 개발자. 스마트워치와 진정한 개인 대시보드 사이의 격차를 메우기 위해 FitMesh Sync를 구축했습니다. 개인정보 보호 우선, 독립적, EU 서버.",
  } as Partial<Record<Locale, string>>,
};

/** Bio per la locale corrente, fallback EN. */
export function authorBio(lc: Locale): string {
  return AUTHOR.bio[lc] ?? AUTHOR.bio.en ?? "";
}

/** Nodo Person completo — usato UNA volta (Organization.founder nel layout globale). */
export function authorPersonNode(lc: Locale) {
  return {
    "@type": "Person" as const,
    "@id": AUTHOR_ID,
    name: AUTHOR.name,
    jobTitle: AUTHOR.jobTitle,
    description: authorBio(lc),
    url: AUTHOR.url,
    sameAs: AUTHOR.sameAs,
  };
}

/** Riferimento leggero — usato ovunque l'entità sia già definita altrove nella stessa pagina (Article.author). */
export const authorRef = { "@id": AUTHOR_ID };
