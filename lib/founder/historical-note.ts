/**
 * Sprint P0.10E addendum — frase Founder per superfici NON gate-abili con
 * FounderClientGate (contenuto editoriale statico: press kit, blog, landing
 * page programmatiche — non hanno una variante client-side, sono prosa fissa
 * generata al build).
 *
 * Perche' serve: components/founder/FounderClientGate risolve il problema
 * SOLO per le 5 superfici commerciali interattive (homepage/header/footer/
 * menu/beta). Il testo giornalistico/editoriale non passa da li' — se la
 * frase sullo stato del programma resta hardcoded, e' vera solo in una delle
 * due meta' del tempo (prima o dopo il cutoff), mai in entrambe.
 *
 * Questo helper NON sostituisce il deploy: la correttezza dipende comunque
 * da QUANDO il sito viene ricompilato/pubblicato (isFounderProgramOpen()
 * legge new Date() al momento del build/render server-side, non al momento
 * della visita) — stesso principio gia' vero per tutto il resto del sunset
 * Founder: un sito statico non cambia da solo, serve un deploy umano vicino
 * al cutoff perche' anche questa prosa rifletta lo stato reale.
 *
 * COPERTURA: tutte e 15 le locale del sito (it, en, es, de, pt, fr, pl, tr,
 * nl, ja, ko, sv, da, no, fi) hanno ora entrambe le varianti — non c'e' piu'
 * nessuna locale che ricade sul fallback EN.
 *
 * PROVENIENZA DELLE STRINGHE — nessuna e' stata tradotta a macchina. Ogni
 * variante e' copia umana gia' esistente nel repo, estratta verbatim:
 *  - variante "closed": dal copy di sunset gia' revisionato in
 *    app/(frontend)/[locale]/(marketing)/press/page.tsx (commit 9600e6e),
 *    parametrizzando la sola data con ${endDate};
 *  - variante "open": dal copy pre-sunset dello stesso file, recuperato da
 *    git a `9600e6e^` (le traduzioni professionali originali).
 * Niente Ollama, niente traduzione automatica, niente frasi inventate: dove
 * la copy umana originale NON conteneva la data limite (il concetto di
 * cutoff e' posteriore), la variante "open" resta senza data invece di
 * forzare un'interpolazione mai scritta da un traduttore. Per la stessa
 * ragione it/en mantengono la formulazione rivista a mano in questo file,
 * non quella recuperata da git.
 *
 * Alcune locale (tr, ja, ko) hanno la frase Founder fusa con la proposizione
 * seguente ("attivato automaticamente alla registrazione") perche' nella
 * copy umana il cambio di tempo verbale investe l'intero periodo: in quei
 * casi la clausola restituita e' l'intera frase, cosi' entrambe le varianti
 * restano identiche all'originale umano.
 */
import { isFounderProgramOpen, formatFounderEndDate } from "@/lib/founder/program-window";

type FounderVariant = {
  open: (endDate: string) => string;
  closed: (endDate: string) => string;
};

/** Frase da innestare in un paragrafo discorsivo (press kit, blog). */
const CLAUSE_EN: FounderVariant = {
  open: (endDate) => `the first 1,000 founders (limited seats, program closing by ${endDate}) get lifetime Pro free`,
  closed: (endDate) => `the first 1,000 founders (program closed as of ${endDate}) got lifetime Pro free`,
};

const CLAUSE: Record<string, FounderVariant> = {
  it: {
    open: (endDate) =>
      `i primi 1000 founder (posti limitati, il programma si chiude entro il ${endDate}) ricevono il Pro a vita gratis`,
    closed: (endDate) =>
      `i primi 1000 founder (programma chiuso dal ${endDate}) hanno ricevuto il Pro a vita gratis`,
  },
  en: CLAUSE_EN,
  es: {
    open: () => `los primeros 1.000 fundadores obtienen Pro de por vida gratis`,
    closed: (endDate) =>
      `los primeros 1.000 fundadores (programa cerrado desde el ${endDate}) obtuvieron Pro de por vida gratis`,
  },
  de: {
    open: () => `Die ersten 1.000 Gründer erhalten Pro dauerhaft kostenlos`,
    closed: (endDate) =>
      `Die ersten 1.000 Gründer (Programm seit dem ${endDate} geschlossen) haben Pro dauerhaft kostenlos erhalten`,
  },
  pt: {
    open: () => `os primeiros 1.000 fundadores recebem o Pro vitalício grátis`,
    closed: (endDate) =>
      `os primeiros 1.000 fundadores (programa encerrado desde ${endDate}) receberam o Pro vitalício grátis`,
  },
  fr: {
    open: () => `les 1 000 premiers fondateurs bénéficient du Pro à vie gratuitement`,
    closed: (endDate) =>
      `les 1 000 premiers fondateurs (programme clos depuis le ${endDate}) ont bénéficié du Pro à vie gratuitement`,
  },
  pl: {
    open: () => `pierwsze 1000 kont zalozycielskich otrzymuje Pro dozywotnio za darmo`,
    closed: (endDate) =>
      `pierwsze 1000 kont zalozycielskich (program zamkniety od ${endDate}) otrzymalo Pro dozywotnio za darmo`,
  },
  // tr/ja/ko: clausola = frase intera (vedi nota in testa al file).
  tr: {
    open: () => `ilk 1000 kurucu hesap, kayit sirasinda otomatik olarak ömür boyu ücretsiz Pro kazanir`,
    closed: (endDate) =>
      `ilk 1000 kurucu hesap (program ${endDate} itibariyla kapandi), kayit sirasinda otomatik olarak ömür boyu ücretsiz Pro kazandi`,
  },
  nl: {
    open: () => `de eerste 1.000 founders krijgen Pro levenslang gratis`,
    closed: (endDate) =>
      `de eerste 1.000 founders (programma gesloten sinds ${endDate}) hebben Pro levenslang gratis gekregen`,
  },
  ja: {
    open: () => `最初の1,000人のファウンダーは登録時に自動で生涯Proが無料になります`,
    closed: (endDate) =>
      `最初の1,000人のファウンダー（${endDate}に終了したプログラム）は、登録時に自動で生涯Proを無料で取得しました`,
  },
  ko: {
    open: () => `처음 1,000명의 파운더는 가입 시 자동으로 평생 Pro를 무료로 받습니다`,
    closed: (endDate) =>
      `처음 1,000명의 파운더(${endDate}에 종료된 프로그램)는 가입 시 자동으로 평생 Pro를 무료로 받았습니다`,
  },
  sv: {
    open: () => `de första 1 000 grundarna får livstids-Pro gratis`,
    closed: (endDate) =>
      `de första 1 000 grundarna (programmet stängt sedan den ${endDate}) fick livstids-Pro gratis`,
  },
  da: {
    open: () => `de første 1.000 grundlæggere får livstids-Pro gratis`,
    closed: (endDate) =>
      `de første 1.000 grundlæggere (programmet lukket siden den ${endDate}) fik livstids-Pro gratis`,
  },
  no: {
    open: () => `de første 1000 founder-brukerne får livstids Pro gratis`,
    closed: (endDate) =>
      `de første 1000 founder-brukerne (programmet stengt siden ${endDate}) fikk livstids Pro gratis`,
  },
  fi: {
    open: () => `ensimmäiset 1 000 perustajakäyttäjää saavat elinikäisen Pro-version ilmaiseksi`,
    closed: (endDate) =>
      `ensimmäiset 1 000 perustajakäyttäjää (ohjelma suljettu ${endDate} alkaen) saivat elinikäisen Pro-version ilmaiseksi`,
  },
};

/** Valore breve per una riga "key facts" / tabella. */
const KEY_FACT_EN: FounderVariant = {
  open: (endDate) => `First 1,000 accounts (limited seats, through ${endDate}): lifetime Pro free`,
  closed: (endDate) =>
    `First 1,000 accounts (program closed as of ${endDate}): lifetime Pro free for those who signed up in time`,
};

const KEY_FACT: Record<string, FounderVariant> = {
  it: {
    open: (endDate) => `Primi 1000 account (posti limitati, fino al ${endDate}): Pro a vita gratis`,
    closed: (endDate) =>
      `Primi 1000 account (programma chiuso dal ${endDate}): Pro a vita gratis per chi si è registrato in tempo`,
  },
  en: KEY_FACT_EN,
  es: {
    open: () => `Primeros 1.000 cuentas: Pro de por vida gratis (activado automáticamente al registrarse)`,
    closed: (endDate) =>
      `Primeros 1.000 cuentas (hasta el ${endDate}): Pro de por vida gratis para quienes se registraron a tiempo`,
  },
  de: {
    open: () => `Erste 1.000 Konten: Pro dauerhaft kostenlos (automatisch bei Registrierung)`,
    closed: (endDate) =>
      `Erste 1.000 Konten (bis zum ${endDate}): Pro dauerhaft kostenlos für alle, die sich rechtzeitig registriert haben`,
  },
  pt: {
    open: () => `Primeiras 1.000 contas: Pro vitalício grátis (ativado automaticamente no cadastro)`,
    closed: (endDate) =>
      `Primeiras 1.000 contas (até ${endDate}): Pro vitalício grátis para quem se cadastrou a tempo`,
  },
  fr: {
    open: () => `1 000 premiers comptes : Pro à vie gratuit (activé automatiquement à l'inscription)`,
    closed: (endDate) =>
      `1 000 premiers comptes (jusqu'au ${endDate}) : Pro à vie gratuit pour ceux qui se sont inscrits à temps`,
  },
  pl: {
    open: () => `Pierwsze 1000 kont: Pro dozywotnio za darmo (automatycznie przy rejestracji)`,
    closed: (endDate) =>
      `Pierwsze 1000 kont (do ${endDate}): Pro dozywotnio za darmo dla tych, ktorzy zarejestrowali sie na czas`,
  },
  tr: {
    open: () => `Ilk 1000 hesap: ömür boyu ücretsiz Pro (kayitta otomatik)`,
    closed: (endDate) => `Ilk 1000 hesap (${endDate}'ya kadar): zamaninda kayit olanlar icin ömür boyu ücretsiz Pro`,
  },
  nl: {
    open: () => `Eerste 1.000 accounts: Pro levenslang gratis (automatisch bij registratie)`,
    closed: (endDate) =>
      `Eerste 1.000 accounts (tot ${endDate}): Pro levenslang gratis voor wie zich op tijd heeft aangemeld`,
  },
  ja: {
    open: () => `最初の1,000アカウント：生涯Pro無料（登録時に自動付与）`,
    closed: (endDate) => `最初の1,000アカウント（${endDate}まで）：期限内に登録した方には生涯Pro無料（登録時に自動付与）`,
  },
  ko: {
    open: () => `처음 1,000개 계정: 평생 Pro 무료 (가입 시 자동 부여)`,
    closed: (endDate) => `처음 1,000개 계정(${endDate}까지): 제때 가입한 분에게는 평생 Pro 무료 (가입 시 자동 부여)`,
  },
  sv: {
    open: () => `Första 1 000 kontona: livstids-Pro gratis (tilldelas automatiskt vid registrering)`,
    closed: (endDate) =>
      `Första 1 000 kontona (till den ${endDate}): livstids-Pro gratis för dem som registrerade sig i tid`,
  },
  da: {
    open: () => `De første 1.000 konti: livstids-Pro gratis (tildeles automatisk ved tilmelding)`,
    closed: (endDate) =>
      `De første 1.000 konti (indtil den ${endDate}): livstids-Pro gratis for dem, der tilmeldte sig i tide`,
  },
  no: {
    open: () => `De første 1000 kontoene: livstids Pro gratis (tildelt automatisk ved registrering)`,
    closed: (endDate) =>
      `De første 1000 kontoene (innen ${endDate}): livstids Pro gratis for dem som registrerte seg i tide`,
  },
  fi: {
    open: () => `Ensimmäiset 1 000 tiliä: elinikäinen Pro ilmaiseksi (myönnetään automaattisesti rekisteröitymisessä)`,
    closed: (endDate) => `Ensimmäiset 1 000 tiliä (${endDate} asti): elinikäinen Pro ilmaiseksi ajoissa rekisteröityneille`,
  },
};

function render(
  table: Record<string, FounderVariant>,
  fallback: FounderVariant,
  locale: string,
  now: Date,
): string {
  // Fallback EN difensivo: se una locale nuova arrivasse senza copy umana,
  // meglio l'inglese corretto di una frase falsa o vuota (dopo questo
  // sprint tutte e 15 le locale del sito sono presenti nelle mappe).
  const variant = table[locale] ?? fallback;
  const endDate = formatFounderEndDate(table[locale] ? locale : "en");
  return isFounderProgramOpen(now) ? variant.open(endDate) : variant.closed(endDate);
}

/** Frase da inserire in un paragrafo discorsivo (press kit, blog). */
export function founderHistoricalClause(locale: string, now: Date = new Date()): string {
  return render(CLAUSE, CLAUSE_EN, locale, now);
}

/** Valore breve per una riga "key facts" / tabella. */
export function founderHistoricalKeyFact(locale: string, now: Date = new Date()): string {
  return render(KEY_FACT, KEY_FACT_EN, locale, now);
}
