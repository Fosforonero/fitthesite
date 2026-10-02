/**
 * Stringhe vietate nel testo pubblico del pacchetto home S02 (tutte le lingue).
 * Fonte unica: la leggono il gate tools/check-s02-home-lingue.ts e i test
 * vitest della home (lib/content/s02-home-invarianti.test.ts).
 */
export const FORBIDDEN: { label: string; re: RegExp }[] = [
  {
    label: "importo",
    re: /(?:[€$£]\s?\d)|(?:\d[\d.,]*\s?(?:[€$£]|EUR\b|USD\b|euro\b|euros\b|dollari\b|dollars\b|dólares\b|Dollar\b|dollar\b|dolarów\b|zł\b|kr\b|円|ユーロ|유로|원))/iu,
  },
  {
    label: "niente abbonamento",
    re: new RegExp(
      [
        "niente abbonamento|senza abbonamento|nessun abbonamento|no subscription|without a subscription|without subscription",
        "sin suscripci[oó]n|ninguna suscripci[oó]n|kein Abo\\b|ohne Abo\\b|kein Abonnement|ohne Abonnement",
        "sans abonnement|pas d'abonnement|sem assinatura|sem subscri[cç][aã]o|bez subskrypcji|bez abonamentu",
        "abonelik yok|aboneliksiz|abonelik gerekmez|geen abonnement|zonder abonnement",
        "サブスク(?:リプション)?(?:なし|不要|無し)|구독 없이|구독 없음|구독이 필요 없",
        "ingen prenumeration|utan prenumeration|intet abonnement|uden abonnement|uten abonnement|ingen abonnement",
        "ei tilausta|ilman tilausta|ei tilausmaksua",
      ].join("|"),
      "iu",
    ),
  },
  {
    label: "gratis per sempre",
    re: new RegExp(
      [
        "gratis per sempre|gratuit[oa] per sempre|per sempre gratis|free forever|forever free|free for life",
        "gratis para siempre|para siempre gratis|f[uü]r immer kostenlos|dauerhaft kostenlos|lebenslang kostenlos",
        "gratuit pour toujours|gratuit [àa] vie|gr[aá]tis para sempre|para sempre gr[aá]tis",
        "za darmo na zawsze|darmow[aey] na zawsze|na zawsze za darmo|sonsuza kadar [üu]cretsiz|[öo]m[üu]r boyu [üu]cretsiz",
        "voor altijd gratis|gratis voor altijd|永久無料|ずっと無料|永遠に無料|영원히 무료|평생 무료",
        "gratis f[öo]r alltid|gratis for altid|gratis for alltid|ikuisesti ilmainen|ilmainen ikuisesti",
      ].join("|"),
      "iu",
    ),
  },
  {
    label: "privacy-first",
    re: new RegExp(
      [
        "privacy[- ]?first|zero tracker|zero-tracker",
        "privacidad (?:como )?prioridad|centrad[oa] en (?:tu )?privacidad|privacidad primero|privacidad ante todo",
        "datenschutz[- ]?first|datenschutzorientiert|datenschutzfreundlich|datenschutz an erster stelle|datenschutz zuerst",
        "confidentialit[eé] avant tout|ax[eé]e? sur la confidentialit[eé]|centr[eé]e? sur la confidentialit[eé]|confidentialit[eé] d'abord",
        "privacidade em primeiro lugar|focad[oa] na privacidade|privacidade primeiro|privacidade acima de tudo",
        "prywatno[sś][cć] na pierwszym miejscu|z dba[lł]o[sś]ci[aą] o prywatno[sś][cć]|prywatno[sś][cć] przede wszystkim",
        "gizlilik [öo]ncelikli|gizlili[gğ]i [öo]nceleyen|gizlili[gğ]i [öo]ncelikli",
        "privacyvriendelijk|privacy eerst",
        "プライバシーファースト|プライバシーを最優先|プライバシー重視|プライバシーを守りながら",
        "개인정보 보호를 최우선|프라이버시 우선|프라이버시를 최우선|프라이버시 퍼스트",
        "integritetsfokuserad|integritet f[öo]rst|integritetsv[aä]nlig",
        "privatlivsfokuseret|privatlivsvenlig|privatliv f[øo]rst",
        "personvernfokusert|personvernvennlig|personvern f[øo]rst",
        "yksityisyys edell[aä]|yksityisyyden etusijalle|yksityisyysl[aä]ht[öo]inen",
      ].join("|"),
      "iu",
    ),
  },
  {
    label: "Trenta secondi",
    re: /trenta secondi|thirty seconds|\b30\s?(?:secondi|seconds|segundos|Sekunden|secondes|sekund(?:y|er|u)?\b|saniye|seconden|sekuntia|sekunnissa|sekunnin)|30秒|30초/iu,
  },
  {
    label: "legge tutto",
    re: new RegExp(
      [
        "legge tutto|leggere tutto|reads everything|reads it all|read everything",
        "lo lee todo|lee todo|liest alles|lie[ts] tout|r[eé]cup[eè]re tout|l[eê] tudo",
        "odczytuje wszystko|hepsini okur|leest alles|すべてを読み取る|전부 읽어|전부 읽",
        "l[aä]ser allt|l[aæ]ser det hele|l[aæ]ser alt|leser alt|lukee kaiken",
      ].join("|"),
      "iu",
    ),
  },
  {
    label: "deduplica",
    re: /dedup|dedupl|d[eé]doublonn|senza doppioni|duplicates removed|sin duplicados|ohne Duplikate|sans doublons|sem duplicados|重複を(?:排除|除去)|중복 제거/iu,
  },
  {
    label: "dashboard web",
    re: new RegExp(
      [
        "dashboard web|web dashboard|web-dashboard|webdashboard|tableau de bord web|panel web|painel web",
        "panel internetowy|web paneli|ウェブダッシュボード|웹 대시보드|webbpanel|webbdashboard|webdashbord|verkkohallintapaneeli|web-koontin[aä]ytt[öo]",
      ].join("|"),
      "iu",
    ),
  },
];
