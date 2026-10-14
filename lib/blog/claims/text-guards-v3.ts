/**
 * Guardie v3 di testo (Fitbit: frequenza attribuita a una causa/un problema; Garmin: promessa di integrazione),
 * estratte SENZA modifiche di comportamento da lib/blog/seo-metadata-batch1.test.ts per essere usate anche dal
 * registro dei claim (lib/blog/claims). Sono euristiche di testo: i LIMITI NOTI sono nel test (LIMITI-NOTI).
 */
export const PCT_CLAIM = /\d+\s*(?:%|percent|per\s*cento|por\s*(?:ciento|cento)|pour\s*cent|Prozent|procent|퍼센트|パーセント)|%\s*\d+|yüzde\s*\d+/i;
export const norm = (s: string): string => s.normalize("NFKC");
export const CONTENT_LANGS = new Set(["it", "en", "es", "de", "pt", "fr", "pl", "tr", "nl", "ja", "ko", "sv", "da", "no", "fi"]);

export const nz = (s: string): string => norm(s).replace(/[‘’]/g, "'");
const LB = "(?<![\\p{L}\\p{N}])";
const RB = "(?![\\p{L}\\p{N}])";
const stemRe = (list: string[]): RegExp =>
  new RegExp(`${LB}(?:${list.map((w) => w.replace(/ /g, "\\s+")).join("|")})\\p{L}*`, "iu");

// Segmenta in frasi: . ! ? ; newline e, per ja/ko, 。！？. La punteggiatura finale resta nella frase (domande).
function segmentSentences(t: string): string[] {
  const out: string[] = [];
  for (const line of t.split(/\n+/)) {
    // «.», «!», «?», «;» seguiti da spazio (un punto dentro «Intervals.icu» o «1.5» non separa); «。！？» sempre
    for (const s of line.split(/(?<=[.!?;])\s+|(?<=[。！？])/u)) if (s.trim().length > 0) out.push(s.trim());
  }
  return out;
}
const isQuestion = (s: string): boolean => /[?？]\s*$/.test(s);

// ---- G2: frequenza di occorrenza (Fitbit) ----
// Marcatori: avverbi e locuzioni di frequenza/proporzione. Da soli NON bastano: serve un contesto di problema.
const FREQ_LATIN_WORDS = [
  // it
  "spesso", "spessissimo", "sovente", "di frequente", "frequentemente", "di solito", "solitamente", "generalmente",
  "in genere", "di norma", "normalmente", "per lo più", "perlopiù", "nella maggior parte dei casi",
  "la maggior parte delle volte", "molte volte", "tante volte", "di consueto", "abitualmente", "comunemente",
  "tipicamente", "di regola", "in molti casi", "in tanti casi", "il più delle volte", "la più parte delle volte",
  "quasi sempre", "nove volte su dieci", "molto spesso",
  // F11 (giro 3): superlativi e proporzioni di cause, regolarita'
  "regolarmente", "stragrande maggioranza", "di gran lunga", "più comune", "più comunemente", "più frequente",
  "più frequentemente", "più diffusa", "più diffuso", "più comuni", "più frequenti", "capita di frequente",
  "è comune", "è frequente",
  // en
  "often", "oftentimes", "frequently", "commonly", "usually", "typically", "generally", "normally", "most of the time",
  "in most cases", "more often than not", "tends? to", "as a rule", "habitually", "in many cases", "in a lot of cases",
  "nine times out of ten", "almost always", "many times", "much of the time", "in the majority of cases",
  "regularly", "most common", "most commonly", "most frequent", "most frequently", "the vast majority", "vast majority",
  "overwhelming majority", "is common", "are common",
  // es
  "a menudo", "con frecuencia", "frecuentemente", "por lo general", "habitualmente", "muchas veces",
  "la mayoría de las veces", "en la mayoría de los casos", "suele", "suelen", "típicamente", "comúnmente", "usualmente",
  "en muchos casos", "casi siempre", "nueve de cada diez veces",
  "regularmente", "lo más habitual", "lo más común", "lo más frecuente", "más común", "más habitual", "más frecuente",
  "es común", "es habitual", "es frecuente", "la gran mayoría",
  // fr
  "souvent", "fréquemment", "en général", "habituellement", "d'habitude", "la plupart du temps",
  "dans la plupart des cas", "couramment", "typiquement", "d'ordinaire", "le plus souvent", "bien souvent",
  "dans de nombreux cas", "dans bien des cas", "presque toujours", "neuf fois sur dix",
  "régulièrement", "le plus courant", "la plus courante", "le plus fréquent", "la plus fréquente", "la grande majorité",
  "dans la majorité des cas",
  // de
  "oft", "öfter", "oftmals", "meist", "meistens", "in den meisten Fällen", "normalerweise", "in der Regel",
  "üblicherweise", "gewöhnlich", "typischerweise", "generell", "im Regelfall", "häufig", "haeufig",
  "in vielen Fällen", "fast immer", "neun von zehn Mal", "größtenteils", "meistenteils",
  "regelmäßig", "regelmässig", "am häufigsten", "häufigste", "häufigsten", "überwiegend", "mehrheitlich",
  // pt
  "muitas vezes", "geralmente", "com frequência", "na maioria das vezes", "na maioria dos casos", "costuma",
  "costumam", "usualmente", "comumente", "em muitos casos", "quase sempre", "frequentemente", "habitualmente",
  "regularmente", "mais comum", "mais frequente", "é comum", "é frequente", "grande maioria", "maioria dos casos",
  // pl
  "zwykle", "zazwyczaj", "na ogół", "przeważnie", "zwyczajowo", "bywa", "w większości przypadków", "nierzadko",
  "typowo", "często", "w wielu przypadkach", "prawie zawsze", "najczęściej",
  "regularnie", "najczęstsza", "najczęstszy", "najczęstszą", "najczęstsze", "w zdecydowanej większości",
  // tr
  "sık sık", "sıklıkla", "sıkça", "sık", "genellikle", "genelde", "çoğunlukla", "çoğu zaman", "çoğu durumda",
  "normalde", "tipik olarak", "çoğu kez", "birçok durumda", "neredeyse her zaman", "en sık",
  "düzenli olarak", "en yaygın", "büyük çoğunlukla",
  // nl
  "meestal", "doorgaans", "gewoonlijk", "veelal", "dikwijls", "in de meeste gevallen", "normaal gesproken",
  "meestentijds", "vaker", "in de regel", "vaak", "in veel gevallen", "bijna altijd", "negen van de tien keer",
  "regelmatig", "meest voorkomende", "meestvoorkomende", "vaakst", "overgrote meerderheid",
  // sv / da / no / fi
  "ofta", "oftast", "vanligtvis", "generellt", "normalt", "brukar", "för det mesta", "i de flesta fall", "typiskt",
  "som regel", "ofte", "oftest", "plejer", "for det meste", "i de fleste tilfælde", "typisk", "sædvanligvis",
  "pleier", "vanligvis", "i de fleste tilfeller", "usein", "yleensä", "tavallisesti", "useimmiten", "monesti",
  "i många fall", "nästan alltid", "næsten altid", "i mange tilfælde", "nesten alltid", "melkein aina",
  "regelbundet", "regelmæssigt", "vanligaste", "mest vanliga", "mest almindelige", "hyppigste",
  // S6-01: predicati «e' comune/e' vanligt/e' almindeligt/yaygın» con soggetto implicito
  "vanligt", "almindeligt", "yaygın", "yaygındır",
  // S6 (CONTROLLO-S6 C36/C37, LIM-F2/LIM-F4): litote e rapporti «nove volte su dieci»
  "non è raro", "non e' raro", "non è insolito", "non di rado", "not uncommon", "not rare", "not unusual", "not infrequent",
  "nicht selten", "nicht ungewöhnlich", "no es raro", "no es infrecuente", "pas rare", "não é raro", "nie jest rzadk\\p{L}*",
  "niet zeldzaam", "inte ovanligt", "ikke ualmindeligt",
  "(?:nine|eight|seven|ten)\\s+times\\s+(?:in|out\\s+of)\\s+ten", "su\\s+dieci\\s+(?:casi|volte)", "(?:nove|otto|sette)\\s+casi\\s+su\\s+dieci",
];
const FREQ_CJK_WORDS = [
  "よく", "頻繁", "しばしば", "たいてい", "大抵", "多くの場合", "ほとんどの場合", "通常は", "一般的に", "普通は",
  "ことが多", "がちです", "ほぼ常に", "十中八九", "자주", "종종", "흔히", "보통", "대개", "주로", "대부분의 경우",
  "일반적으로", "빈번", "경우가 많", "때가 많", "거의 항상",
  // S6-06: «대부분 배터리 최적화가 원인입니다» (senza «의 경우»); «대부분의 사용자» (di + persone) resta escluso
  "대부분(?=\\s)", "대체로",
  // F11: proporzioni e superlativi in ja/ko
  "大半", "大多数", "ほとんどが", "ほとんどは", "最も多い", "一番多い", "最も一般的", "定期的", "しょっちゅう",
  "가장 흔한", "가장 많은", "가장 일반적인", "대부분은", "대부분이", "정기적으로", "규칙적으로",
];
// Proporzione di problemi/casi («la maggior parte dei problemi», «most sync failures»): non «la maggior parte
// delle persone/guide», che non dice quanto spesso accade l'evento.
const FREQ_PROPORTION =
  `${LB}(?:la\\s+maggior\\s+parte|la\\s+mayor[ií]a|la\\s+plupart|die\\s+meisten|a\\s+maioria|większość|çoğu|de\\s+meeste|de\\s+flesta|de\\s+fleste|most|the\\s+majority)\\s+(?:(?:dei|delle|degli|di|of|de|des|der|von|las|los|les|the|d')\\s*){0,2}(?:problem|issue|failure|error|cases?\\b|casi\\b|caso\\b|errori|errores|erreurs|fehler|fälle|casos|przypadk|sorun|durum|fout|gevallen|tilfælde|fall\\b|sync\\s+(?:problem|issue|failure))`;
// Rapporti «nove su dieci» («Nine out of ten sync problems», «Dans neuf cas sur dix»): frequenza di CASI.
const FREQ_RATIO =
  `${LB}(?:\\d+|one|two|three|four|five|six|seven|eight|nine|uno|due|tre|quattro|cinque|sei|sette|otto|nove|un|dos|tres|cuatro|cinco|seis|siete|ocho|nueve|trois|quatre|cinq|sept|huit|neuf|drei|vier|fünf|sechs|sieben|acht|neun|três|quatro|oito|nove|trzy|cztery|pięć|osiem|dziewięć|negen|acht|zeven|nio|ni|ni)\\s+(?:(?:cas|casi|casos|Fällen|Fälle|fois|volte|vezes|veces|keer|razy|kez|gånger|gange|times|cases)\\s+)?(?:out\\s+of|sur|su|de\\s+cada|von|van\\s+de|em\\s+cada|z|av|ud\\s+af)\\s+(?:ten|10|dix|dieci|diez|zehn|tien|dez|dziesięciu|tio|ti)${RB}`;
// Marcatore lessicale (invariato nella forma, esteso): NON e' di per se' una violazione.
export const FREQUENCY_OCCURRENCE = new RegExp(
  `${LB}(?:${FREQ_LATIN_WORDS.map((w) => w.replace(/ /g, "\\s+")).join("|")})${RB}|${FREQ_PROPORTION}|${FREQ_RATIO}|${FREQ_CJK_WORDS.join("|")}`,
  "iu",
);
// Contesto (giro 3, F2): il bersaglio e' l'ATTRIBUZIONE DI FREQUENZA A UNA CAUSA O A UN PROBLEMA, non una frase
// sulla sincronizzazione, la batteria o il sistema. Radici per lingua di: nomi di problema/causa/colpa/motivo, stati
// di problema (disattivato, negato, mancante), cause note (permessi, ottimizzazione/risparmio energetico) e verbi di
// problema/causa (fallisce, blocca, dipende da, viene da). «sync», «batteria», «perche'/because/weil» NON bastano.
const FREQ_CONTEXT_STEMS = [
  // it
  "problem", "caus", "errore", "errori", "error", "colp", "motivo", "motivi", "ragion", "responsabil", "inconvenient", "difett",
  "guasto", "anomali", "permess", "autorizz", "non si sincron", "non funzion", "fallisc", "blocc", "ritard", "dipend", "dovut",
  "disattiv", "mancan", "negat", "revoc", "ottimizz", "risparmio energetic",
  // en
  "issue", "fail", "permission", "delay", "stuck", "missing", "reason", "responsible", "culprit", "fault", "blame",
  "trouble", "glitch", "breaks?", "stops?", "kills?", "killed", "denied", "disabled", "revoked", "due to", "caused",
  "stems?\\s+from", "comes?\\s+from", "come\\s+from", "optimi[sz]", "battery\\s+saver", "power[- ]saving", "restrict",
  // es
  "problema", "causa", "culp", "motivo", "razón", "razones", "responsable", "fall[ao]", "permiso", "retras", "bloque",
  "falten", "faltan", "falta\\b", "denegad", "desactivad", "revoc", "optimizaci", "ahorro\\s+de\\s+energ", "debido", "provoc",
  // fr
  "problème", "erreur", "échec", "échou", "faute", "coupable", "responsable", "raison", "autorisation", "retard", "bloqu",
  "manqu", "désactiv", "refus", "révoqu", "optimisation", "économie\\s+d'énergie", "vient", "provient", "dû\\b",
  // de
  "Problem", "Ursache", "Fehler", "fehl", "schuld", "Grund", "Gründe", "verantwortlich", "Berechtigung", "Verzögerung",
  "blockier", "deaktiviert", "verweigert", "Energiespar", "Optimierung", "liegt", "daran", "wegen(?!\\s*[.,;]|\\s*$)",
  // pt
  "erro", "falh", "culp", "motivo", "razão", "responsável", "permiss", "atraso", "falta\\b", "negad", "desativ", "revog",
  "otimiza", "economia\\s+de\\s+energia", "devido",
  // pl
  "przyczyn", "błąd", "błęd", "winn", "wina\\b", "powód", "powodu", "uprawnie", "opóźni", "blokuj", "optymaliz",
  "oszczędzani",
  // tr
  "sorun", "neden", "hata", "suç", "izin", "gecik", "kaynaklan", "pil\\s+tasarruf", "optimizasyon",
  // nl
  "probleem", "oorzaak", "fout", "schuld", "reden", "machtiging", "toestemming", "vertraging", "batterijbespar", "optimalisatie",
  // S6-06: «Meestal ligt het aan...», «komt vaak doordat...»
  "ligt\\s+(?:het|dat|dit)", "komt\\s+(?:het|dat|dit|door)", "doordat", "omdat",
  // sv / da / no / fi
  "orsak", "fel\\b", "skuld", "behörighet", "fördröj", "batterioptimer", "energisparande", "beror", "på grund", "årsag",
  "fejl", "tilladelse", "forsink", "skyldes", "tillatelse", "feil", "ongelma", "syy", "virhe", "oikeu", "optimoin", "optimer",
  "optimal",
  // verbi di chiusura/interruzione forzata (F11: «Capita di frequente che Android chiuda Fitbit»)
  "chiud", "interromp", "termin", "clos(?:e|es|ed|ing)\\b", "interrupt", "shut", "cierr", "cerr", "ferm", "beend", "schließ",
  "fecha", "zamyka", "kapat", "sluit", "stäng", "lukker",
];
const FREQ_CONTEXT_CJK = [
  "問題", "原因", "エラー", "失敗", "権限", "許可", "遅延", "起こ", "発生", "最適化", "省電力",
  "문제", "원인", "오류", "실패", "권한", "지연", "발생", "최적화", "절전",
];
const FREQ_CONTEXT = new RegExp(
  `${LB}(?:${FREQ_CONTEXT_STEMS.map((w) => w.replace(/ /g, "\\s+")).join("|")})|${FREQ_CONTEXT_CJK.join("|")}`,
  "iu",
);
// F3: presa di distanza/negazione davanti al marcatore: «non possiamo dire che ... spesso», «cannot say ... usually»,
// «non e' dimostrato», «not proven», «kein Beleg»: l'affermazione e' ritirata. Vale solo per la stessa clausola.
const FREQ_DISTANCE = new RegExp(
  `${LB}(?:non\\s+possiamo\\s+(?:dire|affermare|sapere|garantire|dimostrare|stabilire)|non\\s+(?:è|e'|e)\\s+(?:dimostrat\\p{L}*|provat\\p{L}*|documentat\\p{L}*|noto|certo|stabilit\\p{L}*)|nessun(?:a)?\\s+(?:prova|evidenza|dato|dimostrazione)|` +
    `(?:we|i)\\s+(?:cannot|can't|can\\s?not|do\\s+not|don't)\\s+(?:say|claim|tell|know|prove|confirm|state|assert)|cannot\\s+(?:say|claim|tell|prove|confirm)|(?:is|are|was|has\\s+not\\s+been)\\s+not\\s+(?:proven|documented|established|known|confirmed)|no\\s+evidence|not\\s+proven|unproven|` +
    `no\\s+podemos\\s+(?:decir|afirmar|asegurar|saber)|no\\s+(?:está|esta)\\s+(?:demostrad\\p{L}*|probad\\p{L}*|documentad\\p{L}*)|sin\\s+evidencia|` +
    `nous\\s+ne\\s+pouvons\\s+pas\\s+(?:dire|affirmer|savoir)|n'est\\s+pas\\s+(?:démontré\\p{L}*|prouvé\\p{L}*|documenté\\p{L}*)|aucune\\s+preuve|` +
    `kein(?:e)?\\s+(?:Beleg\\p{L}*|Beweis\\p{L}*|Nachweis\\p{L}*|Daten)|nicht\\s+(?:belegt|bewiesen|nachgewiesen|dokumentiert)|wir\\s+können\\s+nicht\\s+sagen|` +
    `não\\s+podemos\\s+(?:dizer|afirmar|garantir)|não\\s+(?:está|e|é)\\s+(?:comprovad\\p{L}*|demonstrad\\p{L}*|provad\\p{L}*)|` +
    `nie\\s+możemy\\s+(?:powiedzieć|twierdzić|stwierdzić)|nie\\s+ma\\s+dowod\\p{L}*|söyleyemeyiz|kanıtlanmam\\p{L}*|kunnen\\s+niet\\s+(?:zeggen|stellen)|niet\\s+bewezen|` +
    `kan\\s+inte\\s+säga|inte\\s+bevisat|kan\\s+ikke\\s+sige|ikke\\s+bevist)${RB}|言えません|断言できません|証明されていません|言い切れません|말할 수 없|입증되지|확인되지`,
  "iu",
);
const FREQ_CLAUSE_BREAK = /[,;:]|\s(?:ma|but|però|however|aber|mais|pero|mas|ale|ancak|maar|men|sondern|tuttavia|però)\s|が、|けど|지만/iu;
// Etichette di sezione attributive (F6): «よくある同期エラーと対処法», «자주 발생하는 동기화 문제», «Sık karşılaşılan ...».
// Valgono SOLO se la frase non termina con un verbo/copula (non c'e' predicato): «よくある問題は権限です。» resta rossa.
const FREQ_VERB_FINAL =
  /(?:です|ます|ました|でした|ません|である|する|した|いる|ある|なる|れる|ない|だ|다|요|니다|까|ır|ir|ur|ür|dır|dir|dur|dür|tır|tir|yor|iyor|ıyor|uyor|üyor|ecek|acak|dı|di|du|dü|mış|miş|muş|müş)\s*[.!。]?\s*$/iu;
const FREQ_ATTRIBUTIVE_IDIOMS: RegExp[] = [
  /よくある(?=[一-鿿ァ-ヿ])/gu,
  /자주\s+[가-힣]*[는은]\s+(?=[가-힣])/gu,
  /(?<![\p{L}\p{N}])sık\s+\p{L}*(?:ılan|ilen|ulan|ülen|an|en)\s+(?=\p{L})/giu,
];
// Usi NON frequenziali (mandato G2): il marcatore dentro questi idiomi e' rimosso prima del controllo.
const FREQ_NEUTRAL_IDIOMS: RegExp[] = [
  // interrogativi: «How often...», «Wie oft...», «Quanto spesso...» (frase indiretta compresa)
  /(?:how\s+often|how\s+frequently|wie\s+oft|wie\s+häufig|quanto\s+spesso|con\s+quale\s+frequenza|con\s+che\s+frequenza|con\s+qu[eé]\s+frecuencia|cada\s+cu[aá]nto|à\s+quelle\s+fréquence|combien\s+de\s+fois|com\s+que\s+frequência|jak\s+często|ne\s+sıklıkla|ne\s+sıklıkta|hoe\s+vaak|hur\s+ofta|hvor\s+ofte|kuinka\s+usein|どのくらいの頻度|どれくらいの頻度|どのくらい頻繁|얼마나\s+자주)/giu,
  // «domande frequenti» e simili (FAQ standard)
  /(?:sık\s+sorulan(?:\s+sorular)?|sıkça\s+sorulan(?:\s+sorular)?|よくある(?:ご)?質問|자주\s+묻는\s+질문|häufig\s+gestellte\s+fragen|oft\s+gestellte\s+fragen|foire\s+aux\s+questions|preguntas\s+frecuentes|domande\s+frequenti|frequently\s+asked\s+questions|perguntas\s+frequentes|często\s+zadawane\s+pytania|veelgestelde\s+vragen|vanliga\s+frågor|ofte\s+stillede\s+spørgsmål|ofte\s+stilte\s+spørsmål|usein\s+kysytyt\s+kysymykset)/giu,
  // modo/stato «normale» (non frequenza)
  /(?:normalt\s+läge|normalt\s+tilstand|normal(?:e|t)?\s+(?:mode|modus|modo|tilstand|läge)|normalmodus|normaal\s+modus|tryb\s+normalny|normal\s+mod|보통\s+(?:모드|상태|설정)|通常(?:は)?モード|通常の(?:モード|状態))/giu,
  // «controlla bene», «leggi con attenzione»
  /よく(?=確認|読|見|チェック|調べ|考え|理解|注意|聞)/gu,
  // scheduling: «più volte al giorno», «several times a day»
  /(?:\p{L}+\s+)?(?:volte|times|veces|fois|vezes|mal|razy|kez|keer|gånger|gange)\s+(?:al|a|ao|per|par|pro|por|am|na|w|om|i|på|per)\s+(?:giorno|day|día|dia|jour|tag|dzień|dag|dygn|gün)/giu,
  /(?:毎日|1日に?\s*\d+回|하루\s*\d+번|매일)/gu,
];
// Posizione di un menu/impostazione: «di solito si trova nelle Impostazioni», «findest du normalerweise in den
// Einstellungen». La frase dice DOVE, non quanto spesso accade un problema.
const FREQ_LOCATION = new RegExp(
  `${LB}(?:si\\s+trova|si\\s+trovano|trovi|trovate|puoi\\s+trovare|is\\s+(?:found|located|listed)|are\\s+(?:found|located|listed)|you\\s+(?:can\\s+)?find|findest|befindet\\s+sich|befinden\\s+sich|se\\s+encuentra|se\\s+encuentran|encuentras|se\\s+trouve|se\\s+trouvent|tu\\s+trouves|encontra|encontras|znajdziesz|znajduje|bulunur|bulabilirsin|vind\\s+je|te\\s+vinden|finns|hittar\\s+du|finder\\s+du|findes|ligger)${RB}|${LB}(?:in|under|nelle|nei|nella|in\\s+den|in\\s+der|dans\\s+les|dans\\s+le|en|em|w|içinde|onder|i|på|under)\\s+(?:the\\s+|le\\s+|las\\s+|los\\s+|den\\s+)?(?:Settings|Impostazioni|Einstellungen|Paramètres|Ajustes|Configuraciones|Configurações|Ustawieniach|Ayarlar|Instellingen|Inställningar|Indstillinger|Innstillinger)|(?<![一-鿿])設定(?:画面)?(?:に|には|で(?!す))|설정(?:에서|에)`,
  "iu",
);


// ---- S6-01 / S6-04: soggetto implicito e connettivo causale subito dopo il marcatore ----
// Parole che possono stare PRIMA del verbo senza essere un soggetto nominale: pronomi dimostrativi/impersonali,
// copule, congiunzioni. «Succede», «It happens», «Das passiert», «Cela arrive», «c'est souvent parce que»: si'.
// «Sync usually happens in the background», «Health Connect meist vorinstalliert, weil»: no (c'e' un nome).
const IMPLICIT_WORDS = new Set([
  "it", "this", "that", "they", "these", "those", "there", "such", "and", "but", "also", "then", "so", "now", "is", "are", "s", "t",
  "ci", "ciò", "questo", "quello", "esso", "lo", "e", "ma", "anche", "poi", "è", "il", "si", "ne", "che", "non", "più", "molto",
  "esto", "eso", "ello", "y", "pero", "también", "es", "está", "son", "lo",
  "isso", "isto", "aquilo", "mas", "também", "é", "são", "o", "a",
  "ça", "cela", "ceci", "ce", "c", "est", "il", "on", "mais", "et", "aussi", "y",
  "das", "dies", "dieses", "es", "ist", "sind", "und", "aber", "auch", "dann", "so", "liegt", "kommt", "tritt", "man", "sich",
  "to", "ono", "ten", "ta", "i", "ale", "też", "jest", "są", "się", "wynika", "bywa",
  "bu", "şu", "o", "ve", "ama", "da", "de", "olur", "olarak",
  "dit", "dat", "het", "ligt", "komt", "en", "maar", "ook", "is", "zijn",
  "det", "den", "och", "men", "också", "är", "ofta", "er", "og", "også", "ikke", "ei", "ja",
]);
const GLOBAL_FREQ = new RegExp(FREQUENCY_OCCURRENCE.source, "giu");
function implicitSubjectBefore(s: string, idx: number): boolean {
  let pre = s.slice(0, idx);
  const cut = Math.max(pre.lastIndexOf(","), pre.lastIndexOf(";"), pre.lastIndexOf(":"));
  if (cut >= 0) pre = pre.slice(cut + 1);
  pre = pre.replace(GLOBAL_FREQ, " ");
  if (/[぀-ヿ㐀-鿿가-힯]/u.test(pre)) return true; // ja/ko: il soggetto non e' separato da spazi, non giudicabile qui
  const toks = pre.toLowerCase().split(/[^\p{L}\p{N}]+/u).filter((t) => t.length > 0);
  return toks.length <= 3 && toks.every((t) => IMPLICIT_WORDS.has(t));
}
const CAUSE_LINK_WORDS =
  "because|perché|perche'|poiché|siccome|dovut[oaie]|porque|ya\\s+que|parce\\s+que|car|weil|daran|dadurch|ponieważ|dlatego|wynika|bo|çünkü|nedeniyle|yüzünden|doordat|omdat|eftersom|för\\s+att|fordi|på\\s+grund";
const CAUSE_LINK_AFTER = new RegExp(
  `^[\\s,;:–-]*(?:(?:es|é|is|est|ist|è|er|är|jest|to|het|dat|dit)[\\s,]+)?(?:${CAUSE_LINK_WORDS})(?![\\p{L}\\p{N}])`,
  "iu",
);
// ja/ko: il connettivo causale sta in fondo alla frase («...算出しているためで», «...계산하기 때문입니다»)
const CAUSE_LINK_CJK = /ためで|ためです|からで(?:す|あ)|ことが原因|때문(?:입니다|이|에)|탓/u;
function causeLinkedFrequency(s: string, mIdx: number, mLen: number): boolean {
  const rest = s.slice(mIdx + mLen);
  if (!/^[\s,;:–-]*[\p{L}]/u.test(rest) && !CAUSE_LINK_CJK.test(rest)) return false;
  if (CAUSE_LINK_CJK.test(rest) && /[぀-ヿ㐀-鿿가-힯]/u.test(s)) return true;
  return CAUSE_LINK_AFTER.test(rest) && implicitSubjectBefore(s, mIdx);
}

// ---- S6-05: presa di distanza ----
// La clausola subordinata dopo il verbo di dire («Wir können nicht sagen, dass es ein häufiges Problem ist»,
// «Nie możemy powiedzieć, że...», «Vi kan ikke sige, at...») non e' un'interruzione: la virgola davanti a
// «dass/że/at/that/que/che/dat/att/ki» e' tolta prima del controllo di clausola.
const FREQ_COMPLEMENTIZER = /,\s*(?:dass|daß|że|żeby|at|att|ki|that|que|che|dat|om|ob|ett|jo)(?![\p{L}\p{N}])/giu;
// Forme con il verbo di dire DOPO il marcatore (tr, ja, ko: verbo in fondo): «Bunun yaygın bir sorun olduğunu
// söyleyemeyiz», «これがよくある問題だとは言えません», «이것이 흔한 문제라고 말할 수 없습니다».
const FREQ_DISTANCE_POST = /söyleyemeyiz|söyleyemem|kanıtlanmam\p{L}*|言えません|断言できません|言い切れません|証明されていません|말할 수 없|입증되지|확인되지/iu;
function distanceRetracts(s: string, markerIdx: number, markerLen: number): boolean {
  const d = FREQ_DISTANCE.exec(s);
  if (d && d.index < markerIdx) {
    const between = s.slice(d.index, markerIdx).replace(FREQ_COMPLEMENTIZER, " ");
    if (!FREQ_CLAUSE_BREAK.test(between)) return true;
  }
  const after = s.slice(markerIdx + markerLen);
  const p = FREQ_DISTANCE_POST.exec(after);
  if (p) {
    const between = after.slice(0, p.index);
    if (!/[,;:.。]/.test(between.replace(/、/g, ""))) return true;
  }
  return false;
}

// ---- S6-07: la frequenza di un'AZIONE dell'utente (istruzione), non di un evento/una causa ----
// «Le autorizzazioni di Health Connect si controllano spesso dal menu Impostazioni», «Die Berechtigungen prüfst
// du am besten regelmäßig»: un verbo di verifica rivolto a chi legge e NESSUN nome/verbo di problema o di
// fallimento (i soli nomi di permessi/autorizzazioni non bastano a fare un claim).
const FREQ_CHECK_VERB = new RegExp(
  `${LB}(?:controll|verific|verify|verifies|check|review|inspect|prüf|überprüf|kontrollier|comprueb|revis|vérifi|contrôl|sprawdz|kontrol\\s+et|controleer|kontrollera|kontroller|tjek|tarkist|確認|チェック|点検|확인|점검)\\p{L}*|確認|チェック|확인|점검`,
  "iu",
);
const FREQ_PROBLEM_STATE = new RegExp(
  `${LB}(?:problem|issue|error|errore|errori|errores|erreur|fehler|fail|fallisc|fallo|échec|échou|błąd|hata|fout|fel\\b|fejl|stuck|bloc|blocca|stops?|interromp|disattiv|disabled|desactiv|deaktiv|revoc|revok|ritard|delay|non\\s+si\\s+sincron|non\\s+funzion|caus|colp|culp|schuld|ursache|przyczyn|neden|oorzaak|orsak|årsag)|問題|原因|エラー|失敗|문제|원인|오류|실패`,
  "iu",
);
const isUserInstruction = (s: string): boolean => FREQ_CHECK_VERB.test(s) && !FREQ_PROBLEM_STATE.test(s);

// ---- S6-01: frequenza di OCCORRENZA con soggetto implicito ----
// «Succede di frequente dopo un aggiornamento di Android», «It happens frequently after an Android update»,
// «Das passiert häufig nach einem Android-Update», «Dit gebeurt vaak...», «頻繁に起きます»: l'evento e' il
// problema anche se non e' nominato. Verbo di occorrenza + avverbio/locuzione di frequenza, oppure copula +
// aggettivo di frequenza + ancora temporale («Es habitual tras actualizar Android», «Det er almindeligt efter...»).
// (comprende l'efficacia di un rimedio con soggetto implicito: «Häufig hilft es, die App neu zu installieren»)
const OCCURRENCE_VERB = new RegExp(
  `${LB}(?:succed|capit(?:a|ano)\\b|accad|avvien|si\\s+verific|si\\s+present|si\\s+ripresent|si\\s+manifest|ricorr|happen|occur|arise|arises|crops?\\s+up|comes?\\s+up|shows?\\s+up|take(?:s)?\\s+place|is\\s+seen|ocurr|sucede|suceden|pasa\\b|pasan\\b|se\\s+produc|aparec|acontec|ocorr|arriv|se\\s+produi|survien|apparaî|passiert|passieren|geschieht|geschehen|vorkomm|auftret|tritt\\s+\\p{L}*\\s*auf|kommt\\s+\\p{L}*\\s*vor|zdarza|występuj|pojawia|dzieje\\s+się|trafia\\s+się|oluyor|olur\\b|olabilir|görül|yaşan|meydana|ortaya\\s+çık|rastlan|gebeurt|gebeuren|komt\\s+voor|treedt|doet\\s+zich|voorkomt|händer|inträffar|förekommer|uppstår|sker\\b|forekommer|opstår|indtræffer|skjer|tapahtuu|esiintyy|hilft|helfen|helps?|aiuta|basta|ayuda|ajuda|aide|pomaga|işe\\s+yarar|helpt|hjälper|hjælper)` +
    `|起き|起こ|発生|生じ|見られ|見かけ|解決します|直ります|도움이|생깁|생기|생겨|발생|일어납|일어나|나타납|나타나|벌어`,
  "iu",
);
const FREQ_COPULA_ADJ = new RegExp(
  `${LB}(?:è|e'|es|está|é|est|c'est|is|are|ist|sind|jest|są|to\\s+jest|je|är|er|ir|on|ei|olur|olarak)${RB}\\s+(?:\\p{L}+\\s+){0,2}?(?:comun|common|frequen|fréquen|habitual|häufig|comum|frecuen|courant|verbreitet|gängig|üblich|częst|powszechn|yaygın|vaak|veelvoorkomend|vanlig|almindelig|usual|normal)`,
  "iu",
);
const FREQ_TEMPORAL_ANCHOR = new RegExp(
  `${LB}(?:dopo|after|tras|después|nach|depois|após|après|po|sonra|na|efter|etter|kun)${RB}|後|後に|후|뒤|이후|変更の?あと`,
  "iu",
);
const FREQ_ADJ_TR = /yaygın\s+olarak\s+görül|sık\s+(?:olarak\s+)?(?:görül|yaşan|karşılaş)/iu;
function implicitOccurrenceMatch(s: string): boolean {
  const v = OCCURRENCE_VERB.exec(s);
  if (v && implicitSubjectBefore(s, v.index)) return true;
  const c = FREQ_COPULA_ADJ.exec(s);
  if (c && FREQ_TEMPORAL_ANCHOR.test(s) && implicitSubjectBefore(s, c.index)) return true;
  return FREQ_ADJ_TR.test(s);
}

// Problemi per cella (vuoto = nessuna espressione di frequenza del problema).
export function fitbitFrequencyProblems(text: string): string[] {
  const out: string[] = [];
  for (const raw of segmentSentences(nz(text))) {
    if (isQuestion(raw)) continue; // domanda: non afferma
    let s = raw;
    if (!FREQ_VERB_FINAL.test(raw)) for (const idiom of FREQ_ATTRIBUTIVE_IDIOMS) s = s.replace(idiom, " ");
    for (const idiom of FREQ_NEUTRAL_IDIOMS) s = s.replace(idiom, " ");
    // percentuale = frequenza dichiarata («roughly 80 percent of cases»): stesso trattamento del marcatore
    const m = FREQUENCY_OCCURRENCE.exec(s) ?? PCT_CLAIM.exec(s);
    if (!m) continue;
    if (FREQ_LOCATION.test(s)) continue;
    // S6-01: soggetto implicito. Un verbo di occorrenza o «e' comune dopo X» basta, senza nome di problema.
    const implicit = implicitOccurrenceMatch(s) || causeLinkedFrequency(s, m.index, m[0].length);
    if (!FREQ_CONTEXT.test(s) && !implicit) continue;
    if (isUserInstruction(s) && !implicit) continue; // S6-07
    // F3 + S6-05: presa di distanza (prima o, in tr/ja/ko, dopo il marcatore), nella stessa clausola
    if (distanceRetracts(s, m.index, m[0].length)) continue;
    out.push(`frequenza del problema: ${raw.slice(0, 80)}`);
  }
  return out;
}

// Etichette di sezione (titolo H2 «insidie comuni»), non stime di frequenza. Ammesse SOLO con il testo esatto,
// per cella: sono le 3 gia' presenti e documentate (nessuna nuova).
export const SECTION_LABELS_EXTENDED: Record<string, string> = {
  "ts:body.6.text.ja": "よくある落とし穴",
  "ts:body.6.text.tr": "Sık yapılan hatalar",
  "ts:body.6.text.ko": "사람들이 자주 걸리는 함정",
};

// ---- G1: promessa Garmin (frase positiva, predicato di integrazione/ufficialita'/supporto DIRETTO su Garmin) ----
// Predicati. Radici con confine di parola a sinistra (nessun «imprevisto» -> «previst»), suffisso libero.
const GA_PRED_INTEGRATION = stemRe([
  // it/en/es/pt/fr/de/pl/tr/nl/sv/da/no/fi: integrazione e collegamento (verbi e nomi)
  "integr(?!al|it)", "intégr(?!al|it)", "integrier", "zintegr", "entegr", "geïntegr", "ïntegr", "integroi", "geintegr",
  "collega", "collegat", "collegament", "connett", "conness", "connects", "connected", "connecting", "connection",
  "connecter", "connecte", "connectée", "connecté", "connectent", "conecta", "conectad", "conexi", "conexão", "vincula", "enlaza", "ligad", "relie", "relié", "lié", "liaison",
  "verbind", "verknüpf", "anbindung", "angebunden", "anknüpf", "łączy", "połącz", "bağlan", "bağlı", "bağlantı",
  "verbonden", "koppel", "gekoppeld", "koppling", "kopplad", "kopplar", "ansluter", "ansluten", "anslutning",
  "forbinder", "forbundet", "tilslut", "kobler", "koblet", "yhdistä", "yhdistet",
]);
// Lessico aggiunto nel giro 3 (F10): «link»/«connector» come nomi di collegamento (con confini di parola: «LinkedIn» no).
const GA_PRED_LINK =
  /(?<![\p{L}\p{N}])(?:link(?:s|ed|ing)?|connector\p{L}*|connettor\p{L}*|conector\p{L}*|connecteur\p{L}*|konnektor\p{L}*|konektör\p{L}*)(?![\p{L}\p{N}])/iu;
// Avallo, raccomandazione e collaborazione (F9). SOLO con Garmin come autore dell'avallo o forma di collaborazione
// con FitMesh: «FitMesh consiglia di esportare da Garmin» NON e' un avallo di Garmin.
const GA_ENDORSE_VERB =
  "recommend|endors|approv|certif|sanction|raccomand|consigli|approv|certific|empfiehl|empfohl|empfehl|zertifiz|recommand|approuv|recomend|recomiend|aprob|polec|zatwierdz|önerir|tavsiye|aanbevel|aanbev|rekommender|anbefal|推奨|推薦|おすすめ|추천";
const GA_PRED_ENDORSE = new RegExp(
  `(?<![\\p{L}\\p{N}])Garmin(?:['’]s)?\\s+(?:\\p{L}+\\s+){0,2}(?:${GA_ENDORSE_VERB})\\p{L}*` +
    `|(?<![\\p{L}\\p{N}])(?:${GA_ENDORSE_VERB})\\p{L}*\\s+(?:by|da|von|par|por|door|przez|av|af|tarafından)\\s+(?:la\\s+)?Garmin` +
    `|Garmin(?:['’]s|\\s+tarafından)\\s+(?:\\p{L}+\\s+){0,2}(?:${GA_ENDORSE_VERB})\\p{L}*` +
    `|(?<![\\p{L}\\p{N}])(?:teamed\\s+up|team(?:s|ed)?\\s+up|joined\\s+forces|partnered|partners\\s+with|collaborat\\p{L}*\\s+with|` +
    `in\\s+collaborazione\\s+con|in\\s+collaboration\\s+with|en\\s+colaboraci[óo]n\\s+con|en\\s+collaboration\\s+avec|in\\s+Zusammenarbeit\\s+mit|` +
    `em\\s+parceria\\s+com|w\\s+współpracy\\s+z|iş\\s+birliği)`,
  "iu",
);
const GA_PRED_INTEGRATION_CONNECT_TO = /(?<![\p{L}\p{N}])connect\s+(?:to|with)\b/iu;
const GA_PRED_INTEGRATION_CJK = /統合|連携|接続|つなが|繋が|統合|통합|연동|연결/u;
// Supporto: SOLO forme verbali/aggettivali (il sostantivo «supporto Garmin» e' anche l'assistenza di Garmin)
const GA_PRED_SUPPORT = stemRe([
  "supporta", "supports", "supported", "supporting", "soporta", "unterstützt", "unterstützen", "prend en charge",
  "prennent en charge", "supporte", "suporta", "obsługuje", "wspiera", "destekler", "destekliyor", "ondersteunt",
  "stöder", "støtter", "understøtter", "compatib", "kompatib", "kompatyb", "uyumlu", "tukee", "kompatibel",
]);
const GA_PRED_SUPPORT_CJK = /対応|サポート|지원/u;
const GA_PRED_PARTNER = stemRe([
  "partner", "partenar", "socio", "socia", "socios", "socias", "ortak", "partnerschaft", "partnerskap", "kumppan",
  "accordo", "agreement", "acuerdo", "accord", "vereinbarung", "abkommen", "overeenkomst", "avtal", "aftale", "anlaşma", "umowa",
  "collaborazion", "collaboration", "colaboraci", "zusammenarbeit", "kooperation", "cooperation",
]);
const GA_PRED_PARTNER_CJK = /パートナー|파트너|提携|제휴/u;
// Stato: certificato/approvato DA Garmin / «Garmin-approved»
const GA_PRED_STATUS = new RegExp(
  `${LB}(?:certific\\p{L}*|zertifiz\\p{L}*|certifi\\p{L}*|(?:approved|authori[sz]ed|autorizzat\\p{L}*|approvat\\p{L}*|aprovad\\p{L}*|aprobad\\p{L}*|godkänd|godkendt|genehmigt|zatwierdzon\\p{L}*|goedgekeurd)\\s+(?:by|da|von|por|par|av|af|door|przez))`,
  "iu",
);
// Stato con FitMesh come oggetto: «Garmin ha approvato FitMesh», «FitMesh e' approvata»
const GA_PRED_STATUS_LOOSE = stemRe(["approv", "aprob", "aprov", "genehmig", "godkän", "godkend", "zatwierdz", "goedgekeurd", "authori[sz]", "autorizz"]);
// «funziona/works with» + diretto/ufficiale; sostantivo «supporto» con FitMesh soggetto
const GA_PRED_WORKS = new RegExp(
  `${LB}(?:funziona|funzionano|works?|funktioniert|funktionieren|fonctionne|fonctionnent|funciona|funcionan|działa|werkt|fungerar|fungerer|toimii)(?:\\s+\\p{L}+)?\\s+(?:con|with|mit|avec|z|met|med|com|ile)${RB}|ile\\s+çalışır`,
  "iu",
);
const GA_PRED_SUPPORT_NOUN = stemRe(["support", "supporto", "soporte", "unterstützung", "stöd", "støtte", "destek", "ondersteuning", "wsparcie", "suporte"]);
const GA_PRED_WILL_SUPPORT = /(?<![\p{L}\p{N}])(?:will|to|can|could|would|may)(?:\s+(?:soon|also|now|natively|officially))?\s+support(?![\p{L}])/iu;
const GA_PRED_STATUS_CJK = /公認|認定|인증/u;
// Uso dell'API: «usa/uses ... API» e «tramite/through ... API» (anche posposto in ja/ko/tr). Il tratto fra verbo
// e API non attraversa virgole/due punti e non contiene un'altra preposizione di mezzo: «via HC e non via l'API»
// ha DUE predicati, il secondo e' negato.
const GA_VIA =
  "tramite|attraverso|mediante|via|through|über|à\\s+travers|a\\s+través\\s+de|przez|aracılığıyla|genom|gennem|ved\\s+hjælp\\s+af|pela|pelo";
const GA_USE =
  "usa|usano|usiamo|utilizza|utilizziamo|uses?|using|utilis[ea]\\p{L}*|nutzt|nutzen|verwendet|verwenden|utiliza|usan|używa|kullanır|kullanıyor|gebruikt|använder|bruger|accede|accesses|greift|bedient|chiama|calls";
const GA_GAP = `(?:(?!${LB}(?:${GA_VIA}|${GA_USE})${RB})[^.。;,:，、]){0,60}?`;
const GA_PRED_API = new RegExp(
  `${LB}(?:${GA_USE}|${GA_VIA})${RB}${GA_GAP}\\bAPI\\b` +
    `|\\bAPI\\b[^.。;]{0,24}(?:を使用|を利用|を通じ|を介|를\\s*통|을\\s*통|를\\s*사용|을\\s*사용|üzerinden|kullan)`,
  "iu",
);
const GA_SYNC = stemRe(["sincronizz", "sincroniz", "sync", "synchron", "synkron", "senkron", "synchroniz", "synchronis"]);
const GA_SYNC_CJK = /同期|동기화/u;
const GA_OFFICIAL = /(?<![\p{L}\p{N}])(?:ufficial|official|oficial|offiziell|officiel|officiell|officiël|officieel|resmi|resmen|oficjaln)\p{L}*|公式|公認|공식/iu;
const GA_DIRECT =
  /(?<![\p{L}\p{N}])(?:dirett|direct|direkt|nativ|native|rechtstreeks|bezpośred|doğrudan|dogrudan|unmittelbar|straight)\p{L}*|(?<![\p{L}\p{N}])diret(?:a|as|o|os|amente)(?![\p{L}\p{N}])|直接|直結|ネイティブ|직접|네이티브/iu;
// Sincronizzazione ufficiale/diretta: sync e ufficiale/diretto ADIACENTI (max 2 parole in mezzo, entrambi gli ordini)
const GA_SYNC_OFFICIAL = new RegExp(
  `(?:${GA_SYNC.source})(?:\\s+\\p{L}+){0,2}?\\s+(?:${GA_OFFICIAL.source}|${GA_DIRECT.source})` +
    `|(?:${GA_OFFICIAL.source}|${GA_DIRECT.source})(?:\\s+\\p{L}+){0,2}?\\s+(?:${GA_SYNC.source})` +
    `|(?:公式|公認|공식|直接|직접)[^。、,]{0,6}(?:同期|동기화)|(?:同期|동기화)[^。、,]{0,6}(?:公式|공식|直接|직접)`,
  "iu",
);
const GA_FUTURE = new RegExp(
  `${LB}(?:previst\\p{L}*|prévu\\p{L}*|vorgesehen|in\\s+futuro|nel\\s+futuro|a\\s+futuro|in\\s+the\\s+future|in\\s+future|dans\\s+le\\s+futur|à\\s+l'avenir|ileride|in\\s+Zukunft|zukünftig|künftig|en\\s+el\\s+futuro|en\\s+futuro|no\\s+futuro|futuramente|w\\s+przyszłości|przyszł\\p{L}*|gelecekte|gelecek|in\\s+de\\s+toekomst|toekomst|today\\s+not|stiamo\\s+lavorando|we\\s+are\\s+working|we're\\s+working|work\\s+in\\s+progress|will\\s+(?:\\p{L}+\\s+)?(?:be|soon|support|integrate|connect|work|read|import|sync\\p{L}*|offer|get|have|add|bring|include|allow|launch|release|provide)|(?:are|is|we're|we\\s+are)\\s+(?:currently\\s+)?(?:working|building|developing)|lavoriamo|lavorando|in\\s+sviluppo|in\\s+development|preparando|preparing|préparons|bereiten\\s+vor|przygotowujemy|hazırlıyoruz|voorbereiden|förbereder|forbereder|en\\s+desarrollo|en\\s+développement|in\\s+Entwicklung|em\\s+desenvolvimento|trabajando|trabalhando|travaillons|arbeiten\\s+daran|pracujemy|çalışıyoruz|werken\\s+eraan|arbetar\\s+på|arbejder\\s+på|sarà|sara'|saranno|arriverà|verrà|coming\\s+soon|coming|upcoming|soon|roadmap|planned|planerad\\p{L}*|planlagt|geplant|planlanıyor|kommer\\s+att|kommer\\s+snart|kommer\\s+i\\s+(?:framtiden|fremtiden)|kommt\\s+bald|en\\s+préparation|bientôt|prochainement|in\\s+arrivo|prossimamente|llegará|será|próximamente|em\\s+breve|wkrótce|yakında|binnenkort|pian)${RB}|将来|今後|予定|開発中|準備中|향후|앞으로|예정|작업 중|준비 중|개발 중`,
  "iu",
);
const GA_NEGATION_WORDS = new RegExp(
  `${LB}(?:non|né|nessun\\p{L}*|mai|niente|not|no|never|neither|nor|cannot|nunca|ni|tampoco|ne|pas|jamais|aucun\\p{L}*|nicht|kein\\p{L}*|nie|weder|não|nem|nenhum\\p{L}*|żaden|nigdy|niet|geen|nooit|inte|ingen|inget|aldrig|ej|ikke|intet|ei|eivät|emme|ole)${RB}|${LB}n'(?=\\p{L})|\\p{L}+n't`,
  "iu",
);
const GA_NEGATION_CJK = /ない|ません|ではなく|ではありません|いません|아니|않|없|못|안\s/u;
const GA_NEGATION_TR = /(?<![\p{L}\p{N}])(?:değil\p{L}*|yok)(?![\p{L}\p{N}])/iu;
// Morfologia negativa turca (F5): «kullanmaz», «desteklemez», «kullanmıyor», «sunmuyor», «yapmadı», «olmayacak».
// Almeno due lettere di radice: «mayor» (es) non e' una forma turca.
const GA_NEGATION_TR_MORPH =
  /(?<![\p{L}\p{N}])\p{L}{2,}(?:m[ae]z(?:ler|lar)?|m[ıiuü]yor(?:uz|lar|sunuz)?|m[ae]d[ıi](?:k|m|n|nız|niz|lar|ler)?|m[ae]yacak(?:tır|lar)?|m[ae]yecek(?:tir|ler)?|m[ae]mekted[ıi]r|m[ae]maktad[ıi]r|m[ae]yan|m[ae]yen)(?![\p{L}\p{N}])/iu;
// Negazione/indisponibilita' DOPO il predicato, nella stessa clausola (F1): «non e' disponibile», «is not available»,
// «n'est pas disponible», «no esta disponible», «nicht verfuegbar», «not supported», «impossibile».
const GA_AVAIL_WORD =
  "disponibil\\p{L}*|disponible|available|previst\\p{L}*|supportat\\p{L}*|supported|possibil\\p{L}*|possible|offert\\p{L}*|offered|ofrecid\\p{L}*|prévu\\p{L}*|proposé\\p{L}*|" +
  "disponível|disponíve\\p{L}*|suportad\\p{L}*|verfügbar|vorgesehen|möglich|unterstützt|angeboten|dostępn\\p{L}*|przewidzian\\p{L}*|mevcut|beschikbaar|" +
  "voorzien|tillgäng\\p{L}*|tilgængelig|tilgjengelig|offerto|incluso|incluid\\p{L}*|inclus\\p{L}*|incluíd\\p{L}*|included|attiv\\p{L}*|activ\\p{L}*|active|" +
  "abilitat\\p{L}*|enabled|live|presente|presentes|present|exist\\p{L}*|esist\\p{L}*|existe\\p{L}*|implementat\\p{L}*|implemented|implementad\\p{L}*|" +
  "implémenté\\p{L}*|integrat\\p{L}*|integrad\\p{L}*|intégr\\p{L}*|integriert|zintegrowan\\p{L}*|entegre|geïntegreerd|geintegreerd|" +
  "ready|pronto|pronta|listo|lista|prêt|prête|bereit|gotow\\p{L}*|hazır|klaar|redo|klar|sviluppat\\p{L}*|developed|ofrece|offre|bietet|oferece|oferuje|sunuyor|biedt";
const GA_AFTER_NEGATION = new RegExp(
  `(?<![\\p{L}\\p{N}])(?:non|not|no|n't|pas|nicht|kein\\p{L}*|nie|não|nao|niet|geen|inte|ikke|ej|ei|ni|nunca|mai|never|jamais|nigdy|nooit|aldrig|nie)(?![\\p{L}\\p{N}])(?:\\s+\\p{L}+['’]?\\p{L}*){0,3}?\\s+(?:${GA_AVAIL_WORD})(?![\\p{L}\\p{N}])` +
    `|(?<![\\p{L}\\p{N}])(?:impossibil\\p{L}*|impossible|impossível|imposible|unmöglich|onmogelijk|niemożliw\\p{L}*|imkansız|omöjlig\\p{L}*|umulig|unavailable|unsupported|indisponibil\\p{L}*|indisponible|indisponível|nicht\\s*verfügbar|non\\s*disponibil\\p{L}*|non\\s*supportat\\p{L}*|` +
    `not\\s+yet|non\\s+ancora|noch\\s+nicht|pas\\s+encore|todavía\\s+no|aún\\s+no|ainda\\s+não|jeszcze\\s+nie|henüz|nog\\s+niet|ännu\\s+inte|endnu\\s+ikke|ennå\\s+ikke|no\\s+longer|non\\s+più|plus\\s+(?:de|d')|nicht\\s+mehr|ya\\s+no|não\\s+mais|już\\s+nie|artık|niet\\s+meer|inte\\s+längre|ikke\\s+længere)(?![\\p{L}\\p{N}])` +
    `|未対応|未サポート|非対応|ありません|できません|提供されていません|利用できません|미지원|지원되지|불가|제공되지|사용할 수 없|할 수 없`,
  "iu",
);
// Predicati negativi lessicali PRIMA del predicato («Impossibile collegare Garmin», «unable to connect»).
const GA_LEXICAL_NEGATIVE =
  /(?<![\p{L}\p{N}])(?:impossibil\p{L}*|impossible|impossível|imposible|unmöglich|onmogelijk|niemożliw\p{L}*|imkansız|omöjlig\p{L}*|umulig|unable|incapable|incapaz|incapace|nicht\s+möglich)(?![\p{L}\p{N}])/iu;
const GA_CJK_CHARS = /[぀-ヿ㐀-鿿가-힯]/u;
const GA_CLAUSE_BOUND = /[,，、:：]|\s(?:ma|but|however|though|mais|aber|doch|pero|mas|ale|ancak|maar|men|sondern|però|invece|whereas|while|tuttavia)\s|が、|けど|けれど|지만/giu;
const GA_THIRD_PARTY =
  /(?<![\p{L}\p{N}])(?:Strava|Training\s?Peaks|Final\s?Surge|Tapiriik|GarminDB|Intervals|Runalyze|Apple|Google|Samsung|Fitbit|Polar|Suunto|Coros|Wahoo|Zwift|MyFitnessPal|Komoot|Runkeeper|Oura|Whoop|Withings|Health\s?Connect|HealthKit|Salute)/iu;
const GA_FIRST_PERSON =
  /(?<![\p{L}\p{N}])FitMesh|(?<![\p{L}\p{N}])(?:noi|siamo|abbiamo|nostr\p{L}*|we're|our|wir|unser\p{L}*|nous|notre|nosotros|somos|nuestr\p{L}*|nós|nosso\p{L}*|nasz\p{L}*|jesteśmy|biz|bizim|wij|onze|vår\p{L}*|vores)(?![\p{L}\p{N}])|(?<![\p{L}\p{N}])we\s+(?:are|were|have|work|support|integrate|connect|offer|do|did|will|can|use|read|sync|plan|partner)(?![\p{L}])|私たち|当社|弊社|우리|저희/iu;
// FitMesh legge attraverso Health Connect: «FitMesh collega Garmin tramite Health Connect» non e' integrazione diretta
const GA_MEDIATED =
  /(?:tramite|attraverso|mediante|via|through|über|à\s+travers|a\s+través\s+de|przez|aracılığıyla|genom|gennem|pela|pelo|経由|を通じて|を介して|통해)\s+(?:il\s+|la\s+|the\s+|le\s+|el\s+|den\s+|das\s+|dem\s+|l')?(?:pass-through\s+|relais\s+)?(?:Health[ -]Connect|HC)/iu;
// Benefici di integrazione/automazione (G3), per lingua. Radici; confine di parola a sinistra.
const GA_BENEFIT = new RegExp(
  `${LB}(?:automat\\p{L}*|in\\s+automatico|tutt[oaie]\\b|un\\s+(?:solo|unico)\\s+posto|in\\s+un\\s+posto|centralizz\\p{L}*|export\\s+manuale|senza\\s+(?:dover\\s+)?esport\\p{L}*` +
    `|everything|all\\s+(?:of\\s+)?(?:your|the)|in\\s+one\\s+place|one\\s+place|single\\s+place|manual\\s+export|hands-free|seamless\\p{L}*|one-click` +
    `|todos?\\b|todas?\\b|en\\s+un\\s+solo\\s+lugar|sin\\s+exportar|tout\\b|tous\\b|toutes\\b|en\\s+un\\s+seul\\s+endroit|sans\\s+export\\p{L}*` +
    `|alles\\b|alle\\b|an\\s+einem\\s+Ort|ohne\\s+(?:manuellen\\s+)?Export|tudo\\b|em\\s+um\\s+só\\s+lugar|num\\s+só\\s+lugar|sem\\s+exportar` +
    `|wszystk\\p{L}*|w\\s+jednym\\s+miejscu|otomatik\\p{L}*|tüm\\b|hepsi|her\\s+şey|tek\\s+yerde|op\\s+één\\s+plek|zonder\\s+handmatige` +
    `|allt\\b|alla\\b|på\\s+ett\\s+ställe|utan\\s+manuell|alt\\b|ét\\s+sted|et\\s+sted|uden\\s+manuel)${RB}|自動|すべて|全て|全部|一か所|一箇所|자동|모든|전부|한 곳`,
  "iu",
);

type GaMatch = { idx: number; kind: "A" | "B" | "P" | "S" | "E" | "Y" | "W" };
function gaPredicateMatches(s: string): GaMatch[] {
  const m: GaMatch[] = [];
  // «FitMesh Sync» e' un nome di prodotto, non un verbo di sincronizzazione
  const t = s.replace(/FitMesh\s+Sync/giu, "FitMesh_____");
  const addOn = (re: RegExp, kind: GaMatch["kind"]) => {
    const g = new RegExp(re.source, re.flags.includes("g") ? re.flags : re.flags + "g");
    for (const x of t.matchAll(g)) m.push({ idx: x.index ?? 0, kind });
  };
  addOn(GA_PRED_INTEGRATION, "A");
  addOn(GA_PRED_INTEGRATION_CONNECT_TO, "A");
  addOn(GA_PRED_LINK, "A");
  addOn(GA_PRED_INTEGRATION_CJK, "A");
  addOn(GA_PRED_SUPPORT, "B");
  addOn(GA_PRED_SUPPORT_CJK, "B");
  addOn(GA_PRED_PARTNER, "P");
  addOn(GA_PRED_PARTNER_CJK, "P");
  addOn(GA_PRED_STATUS, "S");
  addOn(GA_PRED_STATUS_CJK, "S");
  addOn(GA_PRED_API, "E");
  addOn(GA_PRED_WILL_SUPPORT, "B");
  addOn(GA_PRED_WORKS, "W");
  if (/FitMesh/i.test(s)) {
    // la negazione puo' stare DENTRO la locuzione («Garmin does not endorse FitMesh», «Garmin never recommended»)
    for (const x of t.matchAll(new RegExp(GA_PRED_ENDORSE.source, "giu"))) {
      if (!GA_NEGATION_WORDS.test(x[0])) m.push({ idx: x.index ?? 0, kind: "P" });
    }
    addOn(GA_PRED_STATUS_LOOSE, "S");
    addOn(GA_PRED_SUPPORT_NOUN, "B");
  }
  addOn(GA_SYNC_OFFICIAL, "Y");
  return m.sort((x, y) => x.idx - y.idx);
}
// Negazione del predicato in posizione idx: stessa clausola, finestra di 7 parole PRIMA (lingue SVO);
// tutta la clausola per ja/ko e per tr (negazione dopo il predicato).
function gaNegated(s: string, idx: number): boolean {
  let start = 0;
  let end = s.length;
  for (const b of s.matchAll(GA_CLAUSE_BOUND)) {
    const bi = b[0].length > 0 ? (b.index ?? 0) : 0;
    if (bi + b[0].length <= idx) start = Math.max(start, bi + b[0].length);
    else if (bi > idx) end = Math.min(end, bi);
  }
  const clause = s.slice(start, end);
  if (GA_CJK_CHARS.test(clause) && GA_NEGATION_CJK.test(clause)) return true;
  if (GA_NEGATION_TR.test(clause) || GA_NEGATION_TR_MORPH.test(clause)) return true;
  // F1: negazione/indisponibilita' DOPO il predicato, nella stessa clausola
  if (GA_AFTER_NEGATION.test(s.slice(idx, end))) return true;
  const before = s.slice(start, idx).split(/\s+/).filter(Boolean).slice(-7).join(" ");
  if (GA_NEGATION_WORDS.test(before) || GA_LEXICAL_NEGATIVE.test(before)) return true;
  // lingue V2 (de/sv/da/nl): «unterstützt Garmin nicht», «stöder inte», «understøtter ikke»: negazione DOPO il verbo
  const after = s.slice(idx, end).split(/\s+/).filter(Boolean).slice(1, 5).join(" ");
  return /(?<![\p{L}\p{N}])(?:nicht|inte|ikke|ej|niet)(?![\p{L}\p{N}])/iu.test(after);
}

// F4: «senza/without ... accordo/approvazione» con incapacita' = negazione onesta («Senza un accordo con Garmin,
// FitMesh non puo' usare l'API ufficiale»). Resta promessa «integrato ufficialmente senza export manuale».
const GA_WITHOUT_AGREEMENT = new RegExp(
  `${LB}(?:without|senza|sin|sans|ohne|sem|bez|zonder|utan|uden|ilman)\\s+(?:\\p{L}+['’]?\\p{L}*\\s+){0,4}?(?:agreement|approval|partnership|authori[sz]ation|permission|accord\\p{L}*|acuerdo|vereinbarung|abkommen|genehmigung|zustimmung|aprova\\p{L}*|autoriz\\p{L}*|autoris\\p{L}*|approv\\p{L}*|partner\\p{L}*|umow\\p{L}*|zgod\\p{L}*|overeenkomst|avtal|aftale|godkänn\\p{L}*|godkend\\p{L}*|onay)`,
  "iu",
);
const GA_INCAPACITY = new RegExp(
  `${LB}(?:cannot|can't|can\\s?not|unable|non\\s+(?:può|puo'|possono|possiamo|riesce|riesce|è\\s+possibile|e'\\s+possibile)|no\\s+(?:puede|pueden|podemos|es\\s+posible)|ne\\s+(?:peut|peuvent|pouvons)|kann\\s+(?:\\p{L}+\\s+){0,6}?nicht|können\\s+(?:\\p{L}+\\s+){0,6}?nicht|nie\\s+(?:może|mogą|możemy)|não\\s+(?:pode|podem|podemos)|niet\\s+(?:kan|kunnen)|kan\\s+(?:inte|ikke)|yapamaz|kullanamaz|couldn't|won't)${RB}|できません|할 수 없|수 없`,
  "iu",
);
// «FitMesh avrebbe bisogno dell'approvazione di Garmin ... e non ce l'ha»: bisogno + negazione in coda = negazione.
const GA_NEED_APPROVAL = new RegExp(
  `${LB}(?:would\\s+need|needs?|needed|requires?|required|richiede|richiederebbe|necessita|servirebbe|serve|occorre|ha\\s+bisogno|avrebbe\\s+bisogno|braucht|benötigt|necesita|nécessite|a\\s+besoin|precisa|wymaga|gerektirir|heeft\\s+nodig|behöver|kræver)${RB}(?:\\s+\\p{L}+['’]?\\p{L}*){0,5}?\\s+(?:approval|agreement|authori[sz]ation|partnership|approvazione|accordo|autorizzazione|aprobación|acuerdo|autorización|autorisation|accord|Genehmigung|Zustimmung|Vereinbarung|aprovação|zgod\\p{L}*|onay|goedkeuring|godkännande|godkendelse)`,
  "iu",
);
// F8: lettura/import/sync/collegamento DIRETTO da Garmin al presente, con FitMesh (o «noi») come soggetto.
const GA_READ_VERB = new RegExp(
  `${LB}(?:legg\\p{L}*|import\\p{L}*|scaric\\p{L}*|recuper\\p{L}*|prelev\\p{L}*|sincroniz\\p{L}*|si\\s+sincroniz\\p{L}*|acced\\p{L}*|raccogli\\p{L}*|acquisisc\\p{L}*|` +
    `reads?|pulls?|fetch\\p{L}*|download\\p{L}*|gets?|retriev\\p{L}*|collects?|accesses|syncs?|synchroni[sz]\\p{L}*|imports?|connects?|` +
    `liest|lesen|importiert|holt|lädt|synchronisiert|verbindet|greift|` +
    `lit|lisent|importe|importent|récupère|synchronise|se\\s+synchronise|se\\s+connecte|télécharge|` +
    `lee|leen|descarga|se\\s+sincroniza|sincroniza|obtiene|se\\s+conecta|` +
    `lê|leem|baixa|sincronizam|czyta|importuje|pobiera|synchronizuje|okur|içe\\s+aktar\\p{L}*|alır|senkronize\\s+(?:olur|eder)|` +
    `leest|importeert|haalt|synchroniseert|läser|importerar|hämtar|synkroniserar|læser|importerer|henter|synkroniserer)${RB}` +
    `|読み込|取得|同期|取り込|インポート|가져|불러|동기화|읽`,
  "iu",
);
const GA_HC_RE = /Health[ -]Connect|\bHC\b/i;
const GA_REALTIME =
  /in\s+tempo\s+reale|real[- ]?time|en\s+tiempo\s+real|en\s+temps\s+réel|in\s+Echtzeit|em\s+tempo\s+real|w\s+czasie\s+rzeczywistym|gerçek\s+zamanlı|realtid|realtime|リアルタイム|실시간/iu;
// «senza/without ... Health Connect»: la lettura SALTA la mediazione, quindi e' diretta
const GA_HC_BYPASS = new RegExp(
  `(?:without|senza|sin|sans|ohne|sem|bez|zonder|utan|uden)\\s+(?:(?:going|passing|passare|pasar|passer|gehen)\\s+(?:through|per|da|por|par|über)\\s+|(?:using|usare|usar|utiliser|nutzen|bisogno\\s+di|need\\s+for|the\\s+need\\s+for)\\s+|(?:il\\s+|the\\s+|den\\s+|el\\s+|le\\s+)?(?:passaggio\\s+(?:da|per)\\s+|Umweg\\s+über\\s+)?)?Health[ -]Connect|Health[ -]Connect\\s*(?:olmadan|なし|없이)|Health[ -]Connect\\s*を(?:介さ|経由せ)`,
  "iu",
);
const GA_SUBJECT_DET = new Set([
  "il", "lo", "la", "le", "i", "gli", "l", "un", "una", "uno", "questa", "questo", "quest", "quella", "quel", "the", "this", "that",
  "our", "an", "a", "it", "its", "der", "die", "das", "dieser", "diese", "dieses", "ein", "eine", "unsere", "unser", "el", "los",
  "las", "este", "esta", "nuestra", "nuestro", "les", "ce", "cette", "notre", "nos", "o", "os", "as", "nossa", "nosso", "ta",
  "ten", "te", "nasza", "nasz", "bu", "bizim", "de", "het", "deze", "dit", "onze", "den", "det", "vår", "vårt", "vores",
  "noi", "we", "wir", "nous", "nosotros", "nós", "biz", "wij", "vi", "si", "se", "s", "ci", "sich", "es", "also", "now", "already",
]);
function gaClauseBounds(s: string, idx: number): { start: number; end: number } {
  let start = 0;
  let end = s.length;
  for (const b of s.matchAll(GA_CLAUSE_BOUND)) {
    const bi = b[0].length > 0 ? (b.index ?? 0) : 0;
    if (bi + b[0].length <= idx) start = Math.max(start, bi + b[0].length);
    else if (bi > idx) end = Math.min(end, bi);
  }
  return { start, end };
}
// F7: il soggetto davanti al predicato e' un nome proprio sconosciuto («Runna integra...», «Stryd si integra...»): terza
// parte. Prima parola maiuscola, non determinante/pronome di prodotto, non FitMesh/Garmin; le altre minuscole/non latine.
function gaUnknownSubject(s: string, idx: number): boolean {
  const { start } = gaClauseBounds(s, idx);
  const toks = s.slice(start, idx).split(/\s+/).filter(Boolean);
  if (toks.length === 0 || toks.length > 4) return false;
  const first = toks[0].replace(/^[«"“(]+/, "");
  if (!/^\p{Lu}/u.test(first)) return false;
  if (GA_SUBJECT_DET.has(first.toLowerCase().replace(/['’].*$/, ""))) return false;
  if (/^(?:FitMesh|Garmin)/i.test(first)) return false;
  return toks.slice(1).every((w) => /^\p{Ll}/u.test(w) || !/\p{Script=Latin}/u.test(w));
}
function gaDirectRead(s: string): boolean {
  if (!/FitMesh/i.test(s) && !GA_FIRST_PERSON.test(s)) return false;
  const g = new RegExp(GA_READ_VERB.source, "giu");
  for (const m of s.matchAll(g)) {
    const idx = m.index ?? 0;
    const { start, end } = gaClauseBounds(s, idx);
    const clause = s.slice(start, end);
    if (!/Garmin/i.test(clause)) continue;
    const bypass = GA_HC_BYPASS.test(clause);
    if (GA_HC_RE.test(clause) && !bypass) continue; // «da/via Health Connect»: mediata
    if (!(GA_DIRECT.test(clause) || GA_REALTIME.test(clause) || bypass)) continue;
    if (gaNegated(s, idx)) continue;
    return true;
  }
  return false;
}

// Motivi (vuoto = nessuna promessa) per UNA cella: segmenta in frasi e valuta ciascuna nel suo contesto.
export function garminPromiseProblems(text: string): string[] {
  const out: string[] = [];
  const cell = nz(text);
  const sents = segmentSentences(cell);
  for (let si = 0; si < sents.length; si++) {
    const raw = sents[si];
    if (isQuestion(raw)) continue; // domanda: non afferma
    const s = raw;
    // F4: condizione negativa («senza accordo») + incapacita', o bisogno di approvazione + negazione in coda
    if (GA_WITHOUT_AGREEMENT.test(s) && GA_INCAPACITY.test(s)) continue;
    const needM = GA_NEED_APPROVAL.exec(s);
    if (needM && GA_NEGATION_WORDS.test(s.slice(needM.index + needM[0].length))) continue;
    // F8: FitMesh legge/importa/sincronizza DIRETTAMENTE da Garmin (al presente, frase positiva)
    if (gaDirectRead(s)) {
      out.push(`integrazione/ufficialita'/supporto diretto: ${raw.slice(0, 80)}`);
      continue;
    }
    const hasOfficialOrDirect = GA_OFFICIAL.test(s) || GA_DIRECT.test(s);
    const preds = gaPredicateMatches(s).filter(
      (p) => !gaNegated(s, p.idx) && !(p.kind === "W" && !hasOfficialOrDirect), // «funziona con Garmin» e' vago
    );
    // previsione su FitMesh + Garmin anche senza un verbo di integrazione («In futuro FitMesh leggera' Garmin
    // direttamente»), purche' la frase non sia negata e non parli di un terzo
    // Per CLAUSOLA: «FitMesh non offre Garmin diretto, ma lo stiamo preparando» e' negata solo nella prima clausola.
    const futureClause = (): boolean => {
      if (!/FitMesh/i.test(s) || !/Garmin/i.test(s)) return false;
      const cl = s.split(GA_CLAUSE_BOUND).filter((c) => c && c.trim().length > 0);
      return cl.some((c) => GA_FUTURE.test(c) && !GA_NEGATION_WORDS.test(c) && !GA_NEGATION_CJK.test(c) && !GA_NEGATION_TR.test(c));
    };
    if (preds.length === 0 && futureClause()) {
      out.push(`integrazione prevista/futura: ${raw.slice(0, 80)}`);
      continue;
    }
    if (preds.length === 0) continue;
    const official = GA_OFFICIAL.test(s);
    const direct = GA_DIRECT.test(s);
    const kinds = new Set(preds.map((p) => p.kind));
    // «FitMesh collega Garmin tramite Health Connect»: integrazione mediata, non diretta ne' ufficiale
    const onlyPlain = [...kinds].every((k) => k === "A" || k === "B");
    if (onlyPlain && GA_MEDIATED.test(s) && !official && !direct) continue;
    const strong = kinds.has("W") || kinds.has("P") || kinds.has("S") || kinds.has("Y") || ((kinds.has("A") || kinds.has("B")) && (official || direct));
    const garminIdx = s.search(/Garmin/i);
    const hasGarmin = garminIdx >= 0;
    // Senza «Garmin» nella frase («Si integra ufficialmente.») conta solo se e' ufficiale/partner e la frase
    // PRECEDENTE parla di Garmin o FitMesh senza nominare un terzo (altrimenti «integrazione diretta» e' di Strava).
    const prev = si > 0 ? sents[si - 1] : "";
    const carriesOver = (official || kinds.has("P") || kinds.has("S")) && /Garmin|FitMesh/i.test(prev) && !GA_THIRD_PARTY.test(prev);
    if (!hasGarmin && !(strong && carriesOver)) continue;
    const mine = GA_FIRST_PERSON.test(s);
    const third = GA_THIRD_PARTY.test(s) || (!mine && gaUnknownSubject(s, preds[0].idx));
    if (!mine) {
      if (third) continue; // «Strava ha un'integrazione ufficiale con Garmin»: predicato di un terzo
      if (hasGarmin && garminIdx < preds[0].idx) continue; // Garmin e' il soggetto: «Garmin Connect si integra con...»
    }
    const future = GA_FUTURE.test(s);
    // senza FitMesh/noi nella frase serve un predicato forte (ufficiale/diretto/partner/stato) o una previsione:
    // «Al conectar un Garmin nuevo a la cuenta...» e' un'istruzione all'utente, non una promessa
    if (!mine && !strong && !future) continue;
    out.push(`${future ? "integrazione prevista/futura" : "integrazione/ufficialita'/supporto diretto"}: ${raw.slice(0, 80)}`);
  }
  return out;
}
// G3: beneficio affermato in una frase POSITIVA della voce (la clausola di negazione ammessa e' tolta prima).
function garminBenefitProblems(text: string, neg: RegExp): string[] {
  const out: string[] = [];
  const rest = nz(text).replace(neg, " ");
  for (const raw of segmentSentences(rest)) {
    if (isQuestion(raw)) continue;
    if (GA_BENEFIT.test(raw)) out.push(`beneficio di integrazione/automazione affermato: ${raw.slice(0, 80)}`);
  }
  return out;
}

export const cellLang = (path: string): string => path.split(".").reverse().find((k) => CONTENT_LANGS.has(k)) ?? "";

// Esenzioni Garmin DOCUMENTATE, ciascuna verificata nel test (nessuna e' una esenzione fantasma):
// (i) body.15.items[2]: la clausola di negazione «FitMesh legge via Health Connect e NON tramite l'API ufficiale».
// Non e' una esenzione dalla guardia: la voce e' valutata dalla guardia di frase e in piu' dalla regola G3 (beneficio).
export const GA_NEGATION: Record<string, RegExp> = {
  it: /non tramite l'API ufficiale Garmin Connect elencata sopra/,
  en: /not through the official Garmin Connect API listed above/,
  es: /no mediante la API oficial de Garmin Connect mencionada arriba/,
  de: /nicht über die oben genannte offizielle Garmin Connect API/,
  pt: /não pela API oficial do Garmin Connect listada acima/,
  fr: /et non via l'API officielle Garmin Connect mentionnée ci-dessus/,
  pl: /a nie przez oficjalne API Garmin Connect wymienione powyżej/,
  tr: /yukarıda listelenen resmi Garmin Connect API'si üzerinden değil/,
  nl: /niet via de hierboven genoemde officiële Garmin Connect API/,
  ja: /上記の公式Garmin Connect APIを使用しているわけではありません/,
  ko: /위에 나열된 공식 Garmin Connect API를 통한 것이 아닙니다/,
  sv: /och inte via det officiella Garmin Connect API som nämns ovan/,
  da: /og ikke via det officielle Garmin Connect-API, der er nævnt ovenfor/,
};
// Voce body.15.items[2]: forma attesa (prefisso, una frase [ja/ko due], chiusura sulla negazione, Health Connect),
// NESSUNA lista chiusa di parole ammesse in testa (G3): la testa e' valutata dal lessico di beneficio e dalla
// guardia di frase, cosi' una resa diversa (revisione madrelingua SV/DA) non diventa rossa per costruzione.
export function isFitmeshSyncNegationCell(lang: string, raw: string): boolean {
  const t = nz(raw).trim();
  const neg = GA_NEGATION[lang];
  if (!neg || !neg.test(t)) return false;
  if (!new RegExp(neg.source + "[.。]$").test(t)) return false; // finisce con la negazione
  const ss = segmentSentences(t);
  const wanted = lang === "ja" || lang === "ko" ? 2 : 1;
  if (ss.length !== wanted) return false;
  if (wanted === 2 && !neg.test(ss[1])) return false;
  if (!/Health[ -]Connect/.test(t)) return false;
  if (!/^\*\*FitMesh Sync\*\*[:：] ?/.test(t)) return false;
  if (!/Garmin/.test(t.replace(/^\*\*FitMesh Sync\*\*[:：] ?/, ""))) return false;
  if (garminBenefitProblems(t, neg).length > 0) return false; // G3: beneficio in testa (o in coda)
  return garminPromiseProblems(t).length === 0; // G1: nessuna promessa affermata nella voce
}
// (ii) CTA in riga rossa (body.25.ctaLabel): testo esatto, uguale a main c011056b (verificato nel referto).
export const GA_CTA_LABELS: Record<string, string> = {
  it: "Vedi integrazione Garmin su FitMesh →",
  en: "See Garmin integration on FitMesh →",
  es: "Ver integración de Garmin en FitMesh →",
  de: "Garmin-Integration auf FitMesh ansehen →",
  pt: "Ver integração Garmin no FitMesh →",
  fr: "Voir l'intégration Garmin sur FitMesh →",
  pl: "Zobacz integrację Garmin na FitMesh →",
  tr: "FitMesh'te Garmin entegrasyonunu gör →",
  nl: "Zie Garmin-integratie op FitMesh →",
  ja: "FitMesh で Garmin 統合を見る →",
  ko: "FitMesh에서 Garmin 통합 보기 →",
  sv: "Se Garmin integration på FitMesh →",
  da: "Se Garmin integration på FitMesh →",
};
export const GA_NEG_PATH = /^(?:ts|overlay):body\.15\.items\.[a-z]{2}\.2$/;
export const GA_CTA_PATH = /^(?:ts|overlay):body\.25\.ctaLabel\.[a-z]{2}$/;
// Verdetto UNICO per cella, usato sia dal test sul contenuto sia dal corpus (vero percorso di guardia).
export function garminCellVerdict(path: string, text: string): string[] {
  const lang = cellLang(path);
  if (GA_NEG_PATH.test(path)) {
    return isFitmeshSyncNegationCell(lang, text) ? [] : ["voce body.15.items[2]: forma/negazione/beneficio non conforme"];
  }
  if (GA_CTA_PATH.test(path) && text === nz(GA_CTA_LABELS[lang])) return []; // (ii)
  return garminPromiseProblems(text);
}
export function fitbitCellVerdict(path: string, text: string): string[] {
  if (SECTION_LABELS_EXTENDED[path] === text) return []; // etichette gia' ammesse a testo esatto
  return fitbitFrequencyProblems(text);
}

// ---- SD: aggettivo di frequenza attribuito a un problema o a una causa («un problema frequente», «a frequent
// problem», «ein häufiges Problem», «흔한 문제») ----
// Le guardie v3 sopra leggono avverbi, proporzioni e superlativi di causa; per scelta (F6) trattano come etichetta
// l'aggettivo attributivo. Il divieto a parole intere di FREQUENCY_BULLET catturava invece anche «e' un problema
// frequente»: qui quella cattura e' conservata, ma solo quando l'aggettivo sta in una frase dichiarativa insieme a un
// nome/stato di problema o causa (stesso lessico di contesto delle guardie v3), non in una domanda, non come posizione
// di un menu, non dopo una presa di distanza. Non e' un divieto della parola: «frequente» in una frase di scheduling
// o di descrizione della sincronizzazione («si aggiorna a intervalli frequenti») non e' un problema ne' una causa.
const FREQ_ADJECTIVE = new RegExp(
  "frequente|frequent|frecuent|habitual|häufig|comum|fréquent|częst|yaygın|veelvoorkomend|vaak|多くの場合|よくある|頻繁|많습니다|흔|vanlig|almindelig",
  "iu",
);
// S6-03: «common»/«comune»/«común»/«courant»/«verbreitet»... con confini di parola («comunicazione» non e' «comune»).
const FREQ_ADJECTIVE_COMMON = new RegExp(
  `${LB}(?:common|comuni?|comunes?|comuns|común|courant\\p{L}*(?!\\s*\\d)|verbreitet\\p{L}*|gängig\\p{L}*|üblich\\p{L}*|powszechn\\p{L}*|pospolit\\p{L}*|utbredd\\p{L}*|udbredt\\p{L}*|algemeen|algemene|vanligt|ordinary)${RB}|一般的な|ありふれた|일반적인`,
  "iu",
);
export function frequentProblemAttributionProblems(text: string): string[] {
  const out: string[] = [];
  for (const raw of segmentSentences(nz(text))) {
    if (isQuestion(raw)) continue;
    const m = FREQ_ADJECTIVE.exec(raw) ?? FREQ_ADJECTIVE_COMMON.exec(raw);
    if (!m) continue;
    if (FREQ_LOCATION.test(raw)) continue;
    if (!FREQ_CONTEXT.test(raw)) continue;
    if (isUserInstruction(raw)) continue; // S6-07
    if (distanceRetracts(raw, m.index, m[0].length)) continue; // S6-05
    out.push(`frequenza attribuita a un problema o a una causa: ${raw.slice(0, 80)}`);
  }
  return out;
}
// Verdetto di frequenza completo: guardie v3 piu' attribuzione attributiva. Le etichette a testo esatto restano
// ammesse come prima (SECTION_LABELS_EXTENDED).
// Etichette di sezione a testo esatto, per cella: le 6 che il vecchio divieto a parole intere ammetteva (H2 generico
// «insidie comuni», gia' su main c011056b) piu' le 3 delle guardie v3. Nessuna nuova.
export const SECTION_LABELS_FREQ_ALL: Record<string, string> = {
  ...SECTION_LABELS_EXTENDED,
  "ts:body.6.text.de": "Häufige Stolperfallen bei der Synchronisierung",
  "ts:body.6.text.fr": "Erreurs fréquentes qui bloquent la synchronisation",
  "ts:body.6.text.pl": "Częste pułapki, na które warto uważać",
  "ts:body.6.text.nl": "Veelvoorkomende valkuilen die mensen struikelen",
  "ts:body.6.text.ja": "よくある落とし穴",
  "overlay:body.6.text.sv": "Vanliga fallgropar som många snubblar på",
  // S6-03: «comune/común/comum» ora e' un aggettivo di frequenza rilevato. Stessa H2 «insidie comuni» delle sei sopra,
  // nelle tre lingue in cui l'aggettivo e' «comune/comun/comum»: etichetta di sezione a testo esatto, non una stima.
  "ts:body.6.text.it": "Insidie comuni che bloccano la sincronizzazione",
  "ts:body.6.text.es": "Errores comunes que bloquean la sincronización",
  "ts:body.6.text.pt": "Armadilhas comuns que bloqueiam a sincronização",
};
export function fitbitFrequencyVerdict(path: string, text: string): string[] {
  if (SECTION_LABELS_FREQ_ALL[path] === text) return [];
  return [...fitbitFrequencyProblems(text), ...frequentProblemAttributionProblems(text)];
}
