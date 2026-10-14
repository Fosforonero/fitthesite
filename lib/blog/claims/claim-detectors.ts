/**
 * Rilevatori di CLAIM orientati al RICHIAMO (non alla precisione), per il registro dei claim.
 *
 * Non decidono se una frase e' vera ne' se e' ammessa: dicono soltanto «questa frase potrebbe essere un
 * claim» e la classificano (tipo, soggetto, polarita', marcatori). La completezza del registro e' misurata
 * contro questi rilevatori: ogni frase che essi segnalano deve avere una voce nel registro.
 *
 * LIMITI (dichiarati, vedi SD-REGISTRO-CLAIM.md): lessici scritti da un agente non madrelingua; una frase
 * che riformula un claim senza nessuna delle radici elencate NON e' vista; la classificazione e' per regola,
 * non per comprensione.
 */
import { createHash } from "node:crypto";

export const CLAIM_TIPI = ["integrazione", "disponibilita", "frequenza", "roadmap", "negazione", "capacita"] as const;
export type ClaimTipo = (typeof CLAIM_TIPI)[number];
export type ClaimSoggetto = "fitmesh" | "terza-parte" | "generico";
export type ClaimPolarita = "afferma" | "nega" | "domanda" | "etichetta" | "neutra";

export const normalizeClaimText = (s: string): string =>
  s
    .normalize("NFKC")
    .replace(/[‘’]/g, "'")
    .replace(/\*\*|__/g, "")
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/\s+/g, " ")
    .trim();

export const fingerprint = (normalized: string): string => createHash("sha256").update(normalized).digest("hex");

// Stessa segmentazione delle guardie v3 (. ! ? ; newline; 。！？).
export function segmentClaimSentences(t: string): string[] {
  const out: string[] = [];
  for (const line of t.split(/\n+/)) {
    for (const s of line.split(/(?<=[.!?;])\s+|(?<=[。！？])/u)) if (s.trim().length > 0) out.push(s.trim());
  }
  return out;
}

const LB = "(?<![\\p{L}\\p{N}])";
const stems = (list: string[]): RegExp => new RegExp(`${LB}(?:${list.map((w) => w.replace(/ /g, "\\s+")).join("|")})`, "iu");
const raw = (list: string[]): RegExp => new RegExp(list.join("|"), "iu");

export const ENTITY = stems([
  "Garmin", "Fitbit", "Google\\s+(?:Health|Fit)", "Health[ -]Connect", "HealthKit", "Apple\\s+(?:Health|Salute|Gesundheit|Santé|Salud|Saúde)",
  "Samsung", "FitMesh", "Strava", "Polar", "Xiaomi", "Amazfit", "Oura", "Withings", "Pixel\\s+Watch", "Wear\\s+OS", "Connect\\s+IQ",
]);
const FITMESH = /FitMesh/i;

const INTEGRATION = new RegExp(
  [
    stems(["integr", "entegr", "unific", "interoper"]).source,
    raw(["統合", "통합", "連携", "연동", "接続", "연결"]).source,
    stems([
      "API(?![a-z])", "OAuth", "SDK", "webhook", "partner", "socio", "parceri", "partenaire", "partnerschap", "samarbe", "samarbej",
      "współprac", "ortak", "colleg", "connett", "collega", "verbind", "verknüpf", "vincul", "ligad", "relié", "reli", "łącz", "bağla",
      "connect(?:s|ed|ing)?\\s+(?:to|with|directly)", "sync(?:s|ed|ing)?\\s+(?:with|to|directly)",
    ]).source,
    raw(["パートナー", "파트너", "提携", "제휴"]).source,
    stems([
      "ufficial", "official", "oficial", "offiziell", "officiel", "officiell", "officiël", "officieel", "resmi", "oficjaln",
      "dirett", "direct", "direkt", "direto", "rechtstreeks", "bezpośredn", "doğrudan", "native", "nativ", "nativ",
      "avall", "endors", "genehmig", "approv", "aprob", "aprov", "zatwierdz", "onayl", "goedgekeur", "godkän", "godkend", "certific", "authori[sz]",
    ]).source,
    raw(["公式", "公認", "공식", "直接", "직접"]).source,
  ].join("|"),
  "iu",
);

const AVAILABILITY = new RegExp(
  [
    stems([
      "disponibil", "availab", "verfügbar", "disponível", "disponivel", "dostęp", "mevcut", "beschikbaar", "tillgäng", "tilgængelig",
      "supporta", "support", "compatib", "compatíb", "kompatibel", "soporte", "suporte", "stöd", "støtte", "ondersteun", "wsparci", "destek",
      "lancio", "lanciat", "launch", "lanzamiento", "lançamento", "Google Play", "App Store", "scaricabil", "download", "gratuit", "gratis", "free",
    ]).source,
    raw(["利用可能", "使用可能", "사용 가능", "이용 가능", "対応", "지원", "提供"]).source,
  ].join("|"),
  "iu",
);

const FREQUENCY = new RegExp(
  [
    stems([
      "frequen", "fréquen", "frequent", "spess", "sovente", "di solito", "solitamente", "generalmente", "in genere", "di norma", "normalmente",
      "per lo più", "perlopiù", "abitual", "comunemente", "usually", "often", "typically", "commonly", "generally", "normally", "mostly",
      "regularly", "frequently", "most\\s+(?:of|cases|problems|issues|sync)", "the\\s+(?:most|majority)", "la\\s+maggior", "la\\s+mayor",
      "a\\s+menudo", "muchas\\s+veces", "por\\s+lo\\s+general", "habitual", "souvent", "la\\s+plupart", "généralement", "d'habitude", "häufig",
      "meist", "oft", "gewöhnlich", "normalerweise", "die\\s+meisten", "a\\s+maioria", "muitas\\s+vezes", "geralmente", "comum", "częst",
      "zazwyczaj", "zwykle", "większość", "najczęściej", "genellikle", "sıklıkla", "sık", "çoğu", "çoğunlukla", "yaygın", "vaak", "meestal",
      "doorgaans", "veelvoorkomend", "de\\s+meeste", "vanlig", "oftast", "ofta", "som\\s+regel", "almindelig", "ofte", "for\\s+det\\s+meste",
      "yleensä", "usein", "useimmiten", "tend(?:s|ed)?\\s+to", "tende", "tienden", "neigt", "tendance", "tiende",
    ]).source,
    raw([
      "多く", "よく", "頻繁", "しばしば", "たいてい", "大抵", "ほとんど", "一般的", "通常", "普通", "がちです", "자주", "종종", "흔", "많", "보통", "대개",
      "주로", "일반적", "빈번", "대부분", "ことが多",
    ]).source,
    "\\d+\\s*(?:%|percent|per\\s*cento|por\\s*(?:ciento|cento)|pour\\s*cent|Prozent|procent|퍼센트|パーセント)|%\\s*\\d+|yüzde\\s*\\d+",
    "decine di volte|dozens of times|decenas de veces|dutzende?\\s*male|dezenas de vezes|des dizaines de fois|dziesiątki razy|onlarca kez|tientallen keren|何十回|수십 번|dussintals gånger|utallige gange",
    "(?:\\d+|nove|nine|neuf|neun|nueve|nove)\\s+(?:su|out of|sur|von|de|em|na|z|van|av|af)\\s+(?:dieci|ten|dix|zehn|diez|dez|10)",
  ].join("|"),
  "iu",
);

const ROADMAP = new RegExp(
  [
    stems([
      "roadmap", "in arrivo", "prossimamente", "coming soon", "upcoming", "planned", "plans?\\s+to", "próximamente", "en camino", "demnächst",
      "bald", "geplant", "em breve", "em desenvolvimento", "bientôt", "prochainement", "à venir", "wkrótce", "w planach", "yakında",
      "binnenkort", "gepland", "kommer snart", "planerad", "på vej", "planlagt", "in futuro", "in the future", "future", "futur", "zukünftig",
      "künftig", "en el futuro", "no futuro", "w przyszłości", "gelecekte", "toekomst", "framtid", "fremtid", "prevista", "previsto",
      "previst", "prévu", "will\\s+(?:be|support|integrate|add|offer)", "sarà", "verrà", "verranno", "soon", "presto", "pronto", "Q[1-4]\\b",
      "T[1-4]\\b", "(?:primo|secondo|terzo|quarto|first|second|third|fourth)\\s+(?:trimestre|quarter)", "trimestre", "quartal", "kwartal",
      "çeyrek", "kvartal",
    ]).source,
    raw(["近日", "まもなく", "予定", "将来", "곧 출시", "예정", "향후", "3분기", "第[1-4]四半期"]).source,
  ].join("|"),
  "iu",
);

const CAPACITY = new RegExp(
  [
    stems([
      "sincronizz", "sincroniz", "sync", "synchron", "synkron", "senkron", "synchroniz", "synchronis", "leg(?:ge|gere|gono|ge)\\b", "legg",
      "read(?:s|ing)?\\b", "lee\\b", "leen", "lire", "lit\\b", "lisent", "lê\\b", "czyta", "okur", "lees", "leest", "läs", "læs", "lukee",
      "import", "export", "esport", "exporti", "transfer", "trasfer", "transfèr", "übertr", "transfier", "przesy", "aktar", "overdr",
      "scrive", "scriv", "write", "writes", "schreib", "écrit", "escrib", "escreve", "zapisuj", "yaz", "schrijf", "raccogli", "collect",
      "recopil", "sammel", "backup", "salva", "save", "speicher", "mostra", "show", "display", "zeigt", "visualiz", "recuper", "recover",
      "restor", "ripristin", "wiederherstell", "restaur", "przywróc", "geri\\s+yükle", "herstel", "återställ", "genopret", "permette",
      "allows?", "lets?\\b", "consente", "ermöglicht", "permite", "permet\\b",
    ]).source,
    raw(["同期", "동기화", "読み", "読ん", "읽", "取得", "エクスポート", "インポート", "내보", "가져오", "書き込", "쓰"]).source,
  ].join("|"),
  "iu",
);

const NEGATION = new RegExp(
  [
    `${LB}(?:non|not|no|never|mai|nicht|kein\\p{L}*|weder|nie|nunca|jamais|niet|geen|pas|değil\\p{L}*|yok|inte|ikke|ei|without|senza|sin|sans|ohne|bez|zonder|utan|uden|ilman|cannot|impossibil\\p{L}*|nem|não|nenhum\\p{L}*|ninguna?|aucun\\p{L}*|żadn\\p{L}*|hiçbir)(?![\\p{L}\\p{N}])`,
    "\\p{L}n't", // doesn't, isn't, can't
    "(?<![\\p{L}\\p{N}])ne\\s+\\S+\\s+pas", // fr: ne s'integre pas
    "\\p{L}*(?:maz|mez|madı|medi|mıyor|miyor|mamaktadır|memektedir)(?![\\p{L}])", // tr: negazione verbale
    "ない|ません|ではなく|않|없|못|아니|안\\s",
  ].join("|"),
  "iu",
);

export type ClaimDetection = {
  tipo: ClaimTipo;
  soggetto: ClaimSoggetto;
  polarita: ClaimPolarita;
  marcatori: string[];
};

const isQuestion = (s: string): boolean => /[?？]\s*$/.test(s);

const MARK_OFFICIAL = stems(["ufficial", "official", "oficial", "offiziell", "officiel", "officiell", "officiël", "officieel", "resmi", "oficjaln", "avall", "endors"]);
const MARK_DIRECT = stems(["dirett", "direct", "direkt", "direto", "rechtstreeks", "bezpośredn", "doğrudan", "native", "nativ"]);
const MARK_PARTNER = stems(["partner", "socio", "parceri", "partenaire", "partnerschap", "samarbe", "samarbej", "współprac", "ortak"]);
const MARK_API = /(?<![\p{L}\p{N}])(?:API|OAuth|SDK)(?![\p{L}])/iu;
const CJK_MARKS: Array<[string, RegExp]> = [
  ["ufficiale", /公式|公認|공식/u],
  ["diretta", /直接|직접/u],
  ["partnership", /パートナー|파트너|提携|제휴/u],
  ["integrazione", /統合|통합/u],
];

export function detectClaim(sentence: string): ClaimDetection | null {
  const s = normalizeClaimText(sentence);
  if (s.length < 8) return null;
  const hasEntity = ENTITY.test(s);
  const found = {
    integrazione: hasEntity && INTEGRATION.test(s),
    disponibilita: hasEntity && AVAILABILITY.test(s),
    frequenza: FREQUENCY.test(s),
    roadmap: ROADMAP.test(s),
    capacita: hasEntity && CAPACITY.test(s),
  };
  if (!Object.values(found).some(Boolean)) return null;
  const neg = NEGATION.test(s);
  const question = isQuestion(s);
  const soggetto: ClaimSoggetto = FITMESH.test(s) ? "fitmesh" : hasEntity ? "terza-parte" : "generico";
  const marcatori: string[] = [];
  if (MARK_OFFICIAL.test(s)) marcatori.push("ufficiale");
  if (MARK_DIRECT.test(s)) marcatori.push("diretta");
  if (MARK_PARTNER.test(s)) marcatori.push("partnership");
  if (MARK_API.test(s)) marcatori.push("api");
  for (const [m, re] of CJK_MARKS) if (re.test(s) && !marcatori.includes(m)) marcatori.push(m);
  if (/integr|entegr|unific/i.test(s) && !marcatori.includes("integrazione")) marcatori.push("integrazione");
  if (found.roadmap) marcatori.push("roadmap");
  let tipo: ClaimTipo;
  let polarita: ClaimPolarita = "afferma";
  const core = found.integrazione || found.disponibilita || found.roadmap;
  if (neg && core) {
    tipo = "negazione";
    polarita = "nega";
  } else if (found.roadmap) tipo = "roadmap";
  else if (found.frequenza) tipo = "frequenza";
  else if (found.integrazione) tipo = "integrazione";
  else if (found.disponibilita) tipo = "disponibilita";
  else tipo = "capacita";
  if (question) polarita = "domanda";
  else if (neg && tipo !== "negazione") polarita = "afferma";
  return { tipo, soggetto, polarita, marcatori: [...new Set(marcatori)] };
}
