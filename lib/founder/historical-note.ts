/**
 * Sprint P0.10G — frase Founder INVARIANTE per superfici NON gate-abili con
 * FounderClientGate (contenuto editoriale statico: press kit, blog, landing
 * page programmatiche — non hanno una variante client-side, sono prosa fissa
 * generata al build).
 *
 * Perche' serve: components/founder/FounderClientGate risolve il problema
 * SOLO per le 5 superfici commerciali interattive (homepage/header/footer/
 * menu/beta). Il testo giornalistico/editoriale non passa da li'.
 *
 * CORREZIONE BLOCCANTE Sprint P0.10G rispetto alla versione precedente
 * (P0.10E addendum): la versione precedente aveva un ramo "open"/"closed"
 * risolto con `isFounderProgramOpen(new Date())` — cioe' ESATTAMENTE
 * l'orologio al momento del build/render server-side, MAI al momento della
 * visita reale. Un sito statico non cambia da solo: se l'ultimo deploy
 * avviene ore o giorni prima del cutoff (quasi certo), la prosa resterebbe
 * congelata sul ramo sbagliato per tutto il tempo in cui quel build resta
 * live, finche' un deploy successivo e scollegato non la corregge per
 * caso. Verificato che questo NON era ipotetico: al momento di questa
 * correzione (2026-07-29, programma ancora aperto) il ramo "closed" era
 * gia' presente in produzione in piu' punti (vedi fase di audit P0.10G).
 *
 * FIX: zero biforcazione temporale. Un'UNICA frase per locale, vera SIA
 * prima SIA dopo il cutoff, perche' descrive la REGOLA di idoneita' (chi
 * puo' diventare founder e a quali condizioni), non lo STATO del momento
 * in cui il testo e' stato generato. Nessun `new Date()`, nessun import di
 * isFounderProgramOpen/FOUNDER_END_AT in questo file.
 *
 * COPERTURA: tutte e 15 le locale del sito (it, en, es, de, pt, fr, pl, tr,
 * nl, ja, ko, sv, da, no, fi).
 *
 * PROVENIENZA DELLE STRINGHE — nessuna e' stata tradotta a macchina. Le
 * frasi IT/EN sono il testo esatto fornito da Matteo (Sprint P0.10G). Le
 * altre 13 locale sono adattate riusando il vocabolario umano gia' presente
 * in questo stesso file nella versione precedente (varianti "open"/
 * "closed" gia' tradotte a mano, provenienza documentata nella storia git
 * di questo file) — non una nuova traduzione automatica, una ricombinazione
 * di frasi umane gia' esistenti nel repo per esprimere la stessa regola in
 * forma invariante.
 *
 * NOTA: la vecchia frase "attivato automaticamente alla registrazione" (in
 * press/page.tsx e altrove) e' ora FALSA rispetto alla logica reale
 * (Sprint P0.10A, private.grant_founder_launch_core): il grant richiede una
 * prima sincronizzazione reale entro 14 giorni, non e' piu' automatico alla
 * sola registrazione. La nuova clausola incorpora gia' questo requisito,
 * quindi quella frase va rimossa dove viene concatenata (vedi commit che
 * accompagna questa modifica).
 */

/** Frase da innestare in un paragrafo discorsivo (press kit, blog). */
const CLAUSE: Record<string, string> = {
  it: "i primi 1000 founder, tra gli account registrati entro il 31 luglio 2026 con una prima sincronizzazione reale entro 14 giorni dalla registrazione, ricevono il Pro a vita gratis",
  en: "the first 1,000 founders, among accounts registered by 31 July 2026 with a first verified sync within 14 days of registration, get lifetime Pro free",
  es: "los primeros 1.000 fundadores, entre las cuentas registradas antes del 31 de julio de 2026 con una primera sincronización real en los 14 días posteriores al registro, obtienen Pro de por vida gratis",
  de: "die ersten 1.000 Gründer, unter den bis zum 31. Juli 2026 registrierten Konten mit einer echten ersten Synchronisierung innerhalb von 14 Tagen nach der Registrierung, erhalten Pro dauerhaft kostenlos",
  pt: "os primeiros 1.000 fundadores, entre as contas registadas até 31 de julho de 2026 com uma primeira sincronização real em até 14 dias após o registo, recebem o Pro vitalício grátis",
  fr: "les 1 000 premiers fondateurs, parmi les comptes enregistrés avant le 31 juillet 2026 avec une première synchronisation réelle dans les 14 jours suivant l'inscription, bénéficient du Pro à vie gratuitement",
  pl: "pierwsze 1000 kont zalozycielskich, sposrod kont zarejestrowanych do 31 lipca 2026 z pierwsza rzeczywista synchronizacja w ciagu 14 dni od rejestracji, otrzymuje Pro dozywotnio za darmo",
  tr: "ilk 1000 kurucu hesap — 31 Temmuz 2026'ya kadar kayit olan ve kayittan itibaren 14 gun icinde gercek bir ilk senkronizasyon yapan hesaplar arasindan — ömür boyu ücretsiz Pro kazanir",
  nl: "de eerste 1.000 founders, onder de accounts geregistreerd vóór 31 juli 2026 met een echte eerste synchronisatie binnen 14 dagen na registratie, krijgen Pro levenslang gratis",
  ja: "最初の1,000人のファウンダー（2026年7月31日までに登録し、登録から14日以内に実際の初回同期を行ったアカウントのうち）は生涯Proを無料で取得します",
  ko: "처음 1,000명의 파운더(2026년 7월 31일까지 가입하고 가입 후 14일 이내에 실제 첫 동기화를 완료한 계정 중)는 평생 Pro를 무료로 받습니다",
  sv: "de första 1 000 grundarna, bland de konton som registrerats senast den 31 juli 2026 med en verklig första synkronisering inom 14 dagar efter registreringen, får livstids-Pro gratis",
  da: "de første 1.000 grundlæggere, blandt de konti, der er registreret senest den 31. juli 2026 med en reel første synkronisering inden for 14 dage efter tilmelding, får livstids-Pro gratis",
  no: "de første 1000 founder-brukerne, blant kontoene som er registrert innen 31. juli 2026 med en reell første synkronisering innen 14 dager etter registrering, får livstids Pro gratis",
  fi: "ensimmäiset 1 000 perustajakäyttäjää, niiden tilien joukossa, jotka on rekisteröity viimeistään 31. heinäkuuta 2026 ja jotka ovat tehneet aidon ensimmäisen synkronoinnin 14 päivän kuluessa rekisteröitymisestä, saavat elinikäisen Pro-version ilmaiseksi",
};

/** Valore breve per una riga "key facts" / tabella. */
const KEY_FACT: Record<string, string> = {
  it: "Primi 1000 account (registrati entro il 31/07/2026, prima sync reale entro 14gg): Pro a vita gratis",
  en: "First 1,000 accounts (registered by 31 Jul 2026, first real sync within 14 days): lifetime Pro free",
  es: "Primeras 1.000 cuentas (registradas antes del 31/07/2026, primera sync real en 14 días): Pro de por vida gratis",
  de: "Erste 1.000 Konten (registriert bis 31.07.2026, echte erste Synchronisierung innerhalb von 14 Tagen): Pro dauerhaft kostenlos",
  pt: "Primeiras 1.000 contas (registadas até 31/07/2026, primeira sincronização real em 14 dias): Pro vitalício grátis",
  fr: "1 000 premiers comptes (inscrits avant le 31/07/2026, première synchronisation réelle sous 14 jours) : Pro à vie gratuit",
  pl: "Pierwsze 1000 kont (zarejestrowane do 31.07.2026, pierwsza rzeczywista synchronizacja w 14 dni): Pro dozywotnio za darmo",
  tr: "Ilk 1000 hesap (31.07.2026'ya kadar kayit, 14 gun icinde gercek ilk senkronizasyon): ömür boyu ücretsiz Pro",
  nl: "Eerste 1.000 accounts (geregistreerd vóór 31-07-2026, echte eerste synchronisatie binnen 14 dagen): Pro levenslang gratis",
  ja: "最初の1,000アカウント（2026年7月31日までに登録、14日以内に実際の初回同期）：生涯Pro無料",
  ko: "처음 1,000개 계정(2026년 7월 31일까지 가입, 14일 이내 실제 첫 동기화): 평생 Pro 무료",
  sv: "Första 1 000 kontona (registrerade senast 2026-07-31, verklig första synk inom 14 dagar): livstids-Pro gratis",
  da: "Første 1.000 konti (registreret senest 31-07-2026, reel første synk inden for 14 dage): livstids-Pro gratis",
  no: "Første 1000 kontoene (registrert innen 31.07.2026, reell første synk innen 14 dager): livstids Pro gratis",
  fi: "Ensimmäiset 1 000 tiliä (rekisteröity viimeistään 31.7.2026, aito ensimmäinen synkronointi 14 päivän kuluessa): elinikäinen Pro ilmaiseksi",
};

/**
 * Frase completa (2 periodi, standalone) per articoli/landing dove serve
 * spiegare per intero la regola, non solo innestarla in una frase esistente
 * — testo esatto IT/EN fornito da Matteo, altre locale adattate dallo
 * stesso vocabolario umano di CLAUSE/KEY_FACT sopra.
 */
const STATEMENT: Record<string, string> = {
  it: "L'idoneità Founder è limitata ai primi 1.000 account registrati entro il 31 luglio 2026 e richiede una prima sincronizzazione reale entro 14 giorni dalla registrazione. Gli account creati dal 1° agosto 2026 non sono idonei al programma Founder: ricevono 14 giorni di prova Pro, poi serve un acquisto o un abbonamento.",
  en: "Founder eligibility is limited to the first 1,000 accounts registered by 31 July 2026 and requires a first verified sync within 14 days of registration. Accounts created from 1 August 2026 are not eligible for Founder status: they receive a 14-day Pro trial, followed by a purchase or subscription.",
  es: "La elegibilidad para el programa Founder está limitada a las primeras 1.000 cuentas registradas antes del 31 de julio de 2026 y requiere una primera sincronización real en los 14 días posteriores al registro. Las cuentas creadas a partir del 1 de agosto de 2026 no son elegibles para el programa Founder: reciben una prueba Pro de 14 días, tras la cual es necesaria una compra o suscripción.",
  de: "Die Teilnahme am Founder-Programm ist auf die ersten 1.000 bis zum 31. Juli 2026 registrierten Konten beschränkt und erfordert eine echte erste Synchronisierung innerhalb von 14 Tagen nach der Registrierung. Ab dem 1. August 2026 erstellte Konten sind nicht mehr für das Founder-Programm berechtigt: Sie erhalten eine 14-tägige Pro-Testphase, danach ist ein Kauf oder Abonnement erforderlich.",
  pt: "A elegibilidade para o programa Founder está limitada às primeiras 1.000 contas registadas até 31 de julho de 2026 e requer uma primeira sincronização real nos 14 dias seguintes ao registo. As contas criadas a partir de 1 de agosto de 2026 não são elegíveis para o programa Founder: recebem um período de teste Pro de 14 dias, após o qual é necessária uma compra ou subscrição.",
  fr: "L'éligibilité au programme Founder est limitée aux 1 000 premiers comptes enregistrés avant le 31 juillet 2026 et nécessite une première synchronisation réelle dans les 14 jours suivant l'inscription. Les comptes créés à partir du 1er août 2026 ne sont pas éligibles au programme Founder : ils bénéficient d'un essai Pro de 14 jours, suivi d'un achat ou d'un abonnement.",
  pl: "Uczestnictwo w programie Founder jest ograniczone do pierwszych 1000 kont zarejestrowanych do 31 lipca 2026 i wymaga pierwszej rzeczywistej synchronizacji w ciagu 14 dni od rejestracji. Konta utworzone od 1 sierpnia 2026 nie kwalifikuja sie do programu Founder: otrzymuja 14-dniowy okres próbny Pro, po którym wymagany jest zakup lub subskrypcja.",
  tr: "Kurucu (Founder) uygunlugu, 31 Temmuz 2026'ya kadar kayit olan ilk 1000 hesapla sinirlidir ve kayittan itibaren 14 gun icinde gercek bir ilk senkronizasyon gerektirir. 1 Agustos 2026'dan itibaren olusturulan hesaplar Kurucu programina uygun degildir: 14 günlük ücretsiz Pro denemesi alirlar, ardindan satin alma veya abonelik gerekir.",
  nl: "Founder-geschiktheid is beperkt tot de eerste 1.000 accounts die vóór 31 juli 2026 zijn geregistreerd en vereist een echte eerste synchronisatie binnen 14 dagen na registratie. Accounts die vanaf 1 augustus 2026 worden aangemaakt, komen niet in aanmerking voor de Founder-status: zij krijgen een gratis proefperiode van 14 dagen voor Pro, waarna een aankoop of abonnement nodig is.",
  ja: "ファウンダー資格は2026年7月31日までに登録された最初の1,000アカウントに限定され、登録から14日以内の実際の初回同期が必要です。2026年8月1日以降に作成されたアカウントはファウンダープログラムの対象外です：14日間のProトライアルが提供され、その後は購入またはサブスクリプションが必要になります。",
  ko: "파운더 자격은 2026년 7월 31일까지 가입한 처음 1,000개 계정으로 제한되며, 가입 후 14일 이내에 실제 첫 동기화가 필요합니다. 2026년 8월 1일 이후 생성된 계정은 파운더 프로그램 대상이 아닙니다: 14일간의 Pro 체험판이 제공되며, 이후에는 구매 또는 구독이 필요합니다.",
  sv: "Rätten att bli grundare är begränsad till de första 1 000 kontona som registrerats senast den 31 juli 2026 och kräver en verklig första synkronisering inom 14 dagar efter registreringen. Konton som skapas från och med den 1 augusti 2026 är inte berättigade till grundarprogrammet: de får en 14 dagars gratis Pro-provperiod, följt av ett köp eller en prenumeration.",
  da: "Berettigelse til grundlæggerprogrammet er begrænset til de første 1.000 konti, der er registreret senest den 31. juli 2026, og kræver en reel første synkronisering inden for 14 dage efter tilmelding. Konti oprettet fra den 1. august 2026 er ikke berettigede til grundlæggerprogrammet: de får en 14-dages gratis Pro-prøveperiode, hvorefter et køb eller abonnement er nødvendigt.",
  no: "Founder-kvalifisering er begrenset til de første 1000 kontoene som er registrert innen 31. juli 2026, og krever en reell første synkronisering innen 14 dager etter registrering. Kontoer opprettet fra og med 1. august 2026 er ikke kvalifisert for founder-programmet: de får en 14-dagers gratis Pro-prøveperiode, etterfulgt av kjøp eller abonnement.",
  fi: "Perustajakäyttäjän kelpoisuus rajoittuu ensimmäiseen 1 000 tiliin, jotka on rekisteröity viimeistään 31. heinäkuuta 2026, ja edellyttää aitoa ensimmäistä synkronointia 14 päivän kuluessa rekisteröitymisestä. 1. elokuuta 2026 tai sen jälkeen luodut tilit eivät ole oikeutettuja perustajakäyttäjän ohjelmaan: ne saavat 14 päivän ilmaisen Pro-kokeilun, jonka jälkeen tarvitaan osto tai tilaus.",
};

const FALLBACK_LOCALE = "en";

/** Frase da inserire in un paragrafo discorsivo (press kit, blog). Invariante: vera sia prima sia dopo il cutoff. */
export function founderHistoricalClause(locale: string): string {
  return CLAUSE[locale] ?? CLAUSE[FALLBACK_LOCALE];
}

/** Valore breve per una riga "key facts" / tabella. Invariante. */
export function founderHistoricalKeyFact(locale: string): string {
  return KEY_FACT[locale] ?? KEY_FACT[FALLBACK_LOCALE];
}

/** Frase completa standalone (2 periodi) per articoli/landing/FAQ. Invariante. */
export function founderEligibilityStatement(locale: string): string {
  return STATEMENT[locale] ?? STATEMENT[FALLBACK_LOCALE];
}
