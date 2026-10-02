/**
 * lib/pricing-section.ts — copy localizzata della sezione Pricing in homepage.
 *
 * Nessun importo in questa sezione (S02, 02/10/2026): gli importi vivono in
 * lib/pricing.ts ma la home non li rende. Qui solo etichette. en come fallback
 * per le lingue non compilate (vedi tl()), TRANNE le chiavi nuove storeNote e
 * priceFromStore, che si leggono con tlOwn() senza ripiego.
 *
 * Sprint P0.10K (2026-07-31): chiusura commerciale del sito. `heading`
 * menzionava "Da founder, Pro a vita"/"As a founder, lifetime Pro" SENZA
 * alcun gating (era vero durante il lancio, falso da oggi che il sito non
 * propone piu' l'adesione Founder) — riscritta in una frase permanente,
 * vera indipendentemente dallo stato del programma. Il tier Founder stesso
 * (founderName/founderTagline/founderFeatures/founderCta/
 * subheadFounderSuffix) e' stato rimosso: la terza card pricing in homepage
 * mostra ora solo la prova 14gg (vedi HOMEPAGE_COPY.trialName/trialTagline).
 *
 * ─── Sprint P0.10K — copertura 15 locale + igiene chiavi ──────────────────
 *
 * 1. COPERTURA. Prima di questo passaggio ogni chiave si fermava a 6 locale
 *    (it/en/es/de/pt/fr) e `freeName` addirittura a 2 (it/en): le altre 9
 *    lingue del sito (pl, tr, nl, ja, ko, sv, da, no, fi) cadevano sul
 *    fallback `en` di tl(), mostrando il blocco prezzi in inglese dentro una
 *    pagina per il resto tradotta. Ora tutte le chiavi coprono le 15 locale
 *    di lib/i18n.ts.
 *
 * 2. PROVENIENZA DELLE TRADUZIONI — nessuna stringa e' stata tradotta a
 *    macchina ne' inventata. Ogni voce nuova ricombina vocabolario umano gia'
 *    presente nel repo, in particolare:
 *      - lib/content/about-copy.ts   → pricingHeading (kicker), trialDesc
 *        ("tutte le funzioni Pro", "storico completo", "abbonamento o sblocco
 *        a vita"), lifetimeUnlockDesc, familyHeading, oneTimePurchase — tutte
 *        gia' su 15 locale;
 *      - lib/content/homepage-copy.ts → trialName ("14 giorni gratis") e
 *        trialTagline ("poi scegli il piano piu' adatto"), 15 locale;
 *      - lib/founder/historical-note.ts → STATEMENT, 15 locale: e' la fonte
 *        della frase post-Founder "14 giorni di prova Pro, poi serve un
 *        acquisto o un abbonamento" in ogni lingua;
 *      - lib/dictionaries/<loc>.json → app.settings.export ("Esporta i miei
 *        dati") e features.items (nome localizzato del Mesh Famiglia);
 *      - lib/blog/posts/scegliere-smartwatch-dati-2026.ts + nordic-overlay
 *        → parola "caregiving" per locale (opieka/bakım/zorg/ケア/케어/
 *        omsorg/pleje/hoiva).
 *
 * 3. VERITA' COMMERCIALE. `subhead` e `freeTagline` non promettono piu' ne'
 *    "prezzo di lancio" (implica un rialzo futuro non deciso: urgenza
 *    implicita) ne' "senza carta"/"Nessuna carta" (claim sulla configurazione
 *    di pagamento Apple/Google che il repo non dimostra). Al loro posto la
 *    formulazione sicura approvata, gia' presente verbatim in
 *    lib/product-facts.ts e in historical-note.ts per tutte e 15 le locale:
 *    dopo i 14 giorni, per continuare a usare le funzioni Pro serve un
 *    acquisto o un abbonamento.
 *
 * 4. IGIENE. `founderBadge` e' stata rinominata `recommendedBadge`: il valore
 *    era gia' neutro ("Consigliato"/"Recommended") ma il nome continuava a
 *    parlare di Founder su una card che oggi e' la prova 14 giorni. Unico
 *    punto d'uso aggiornato: app/(frontend)/[locale]/(marketing)/page.tsx.
 *
 * 5. MERGE (stesso giorno, review visiva post-deploy di Matteo). Le note 1-4
 *    sopra descrivono lo stato con TRE card pricing (Free/Pro/Prova 14gg):
 *    le prime due erano la stessa offerta (14gg di prova Pro) con stili e
 *    feature-list diversi, ridondanti fianco a fianco. Rimossa la card
 *    "Free": `freeName`/`freeTagline`/`freeFeatures`/`freeLabel` eliminati
 *    (zero altri consumer). Resta una sola card evidenziata, con un nuovo
 *    `trialPeriodLabel` ("Periodo di prova", non piu' "Gratis": la vecchia
 *    label confondeva la card con un piano gratuito permanente) e un nuovo
 *    `trialFeatures` (= `proFeatures` senza la riga Mesh Famiglia, non
 *    inclusa nella prova). Il pricing homepage e' oggi a 2 card, non 3.
 */
import type { Localized, LocalizedList } from "@/lib/blog/types";

export const PRICING_SECTION = {
  /** Kicker sezione. Provenienza 9 locale nuove: ABOUT_COPY.pricingHeading. */
  kicker: {
    it: "Prezzi",
    en: "Pricing",
    es: "Precios",
    de: "Preise",
    pt: "Preços",
    fr: "Tarifs",
    pl: "Cennik",
    tr: "Fiyatlandırma",
    nl: "Prijzen",
    ja: "料金",
    ko: "가격",
    sv: "Priser",
    da: "Priser",
    no: "Priser",
    fi: "Hinnoittelu",
  } as Localized,
  /**
   * Provenienza 9 locale nuove: HOMEPAGE_COPY.trialName ("14 giorni gratis")
   * + HOMEPAGE_COPY.trialTagline ("poi scegli il piano piu' adatto").
   */
  heading: {
    it: "L'app si scarica gratis.",
    en: "The app is free to download.",
    es: "Prueba de 14 días. Luego Pro, a tu manera.",
    de: "14 Tage testen. Dann Pro, wie du willst.",
    pt: "14 dias de teste. Depois Pro, à tua maneira.",
    fr: "Essai de 14 jours. Puis Pro, à votre façon.",
    pl: "14 dni za darmo. Potem wybierz odpowiedni plan Pro.",
    tr: "14 gün ücretsiz. Ardından sana uygun Pro planını seç.",
    nl: "14 dagen gratis. Daarna kies je het Pro-plan dat bij je past.",
    ja: "14日間無料。その後は最適なProプランをお選びください。",
    ko: "14일 무료. 이후 나에게 맞는 Pro 요금제를 선택하세요.",
    sv: "14 dagar gratis. Välj sedan den Pro-plan som passar dig.",
    da: "14 dage gratis. Vælg derefter den Pro-plan, der passer dig.",
    no: "14 dager gratis. Velg deretter Pro-planen som passer deg.",
    fi: "14 päivää ilmaiseksi. Valitse sitten sinulle sopiva Pro-paketti.",
  } as Localized,
  /**
   * Formulazione sicura post-Founder. it/en sono il testo approvato verbatim
   * (identico, in en, a lib/product-facts.ts); le altre 13 locale ricombinano
   * la seconda frase di STATEMENT in lib/founder/historical-note.ts ("...
   * ricevono 14 giorni di prova Pro, poi serve un acquisto o un abbonamento")
   * con "tutte le funzioni Pro" di ABOUT_COPY.trialDesc.
   */
  subhead: {
    it: "Prova FitMesh Pro per 14 giorni. Al termine, per continuare a usare le funzioni Pro serve un acquisto o un abbonamento.",
    en: "Try FitMesh Pro for 14 days. After the trial, continuing to use Pro features requires a purchase or subscription.",
    es: "Prueba FitMesh Pro durante 14 días. Al terminar, para seguir usando las funciones Pro es necesaria una compra o una suscripción.",
    de: "Teste FitMesh Pro 14 Tage lang. Danach ist für die weitere Nutzung der Pro-Funktionen ein Kauf oder Abonnement erforderlich.",
    pt: "Experimenta o FitMesh Pro durante 14 dias. Depois, para continuar a usar as funções Pro é necessária uma compra ou uma assinatura.",
    fr: "Essayez FitMesh Pro pendant 14 jours. Ensuite, pour continuer à utiliser les fonctions Pro, un achat ou un abonnement est nécessaire.",
    pl: "Wypróbuj FitMesh Pro przez 14 dni. Potem, aby dalej korzystać z funkcji Pro, wymagany jest zakup lub subskrypcja.",
    tr: "FitMesh Pro'yu 14 gün deneyin. Ardından Pro özelliklerini kullanmaya devam etmek için satın alma veya abonelik gerekir.",
    nl: "Probeer FitMesh Pro 14 dagen. Daarna is een aankoop of abonnement nodig om de Pro-functies te blijven gebruiken.",
    ja: "14日間のトライアルでProの全機能を使えます。その後もPro機能を使い続けるには、購入またはサブスクリプションが必要です。",
    ko: "14일 체험 기간 동안 모든 Pro 기능을 이용할 수 있습니다. 이후에도 Pro 기능을 계속 사용하려면 구매 또는 구독이 필요합니다.",
    sv: "Testa FitMesh Pro i 14 dagar. Därefter krävs ett köp eller en prenumeration för att fortsätta använda Pro-funktionerna.",
    da: "Prøv FitMesh Pro i 14 dage. Derefter er et køb eller abonnement nødvendigt for at fortsætte med at bruge Pro-funktionerne.",
    no: "Prøv FitMesh Pro i 14 dager. Deretter kreves et kjøp eller abonnement for å fortsette å bruke Pro-funksjonene.",
    fi: "Kokeile FitMesh Pro -versiota 14 päivää. Sen jälkeen tarvitaan osto tai tilaus, jotta voit jatkaa Pro-ominaisuuksien käyttöä.",
  } as Localized,

  /**
   * U-PRICE-04 (chiave NUOVA, S02): nota sotto la subhead. Rinvia a cio' che lo
   * store mostra nell'app, senza importi e senza opzioni per piattaforma. Per
   * le lingue diverse da it/en il valore arriva con la consegna linguistica
   * (TRANSLATE_NEEDED): finche' manca, il render NON mostra la nota (si legge
   * con tlOwn(), nessun ripiego sull'inglese).
   */
  storeNote: {
    it: "Le opzioni di acquisto e il prezzo sono quelli che lo store mostra nell'app, nel tuo paese.",
    en: "The purchase options and the price are the ones your store shows in the app, in your country.",
  } as Localized,
  /**
   * U-PRICE-13 (chiave NUOVA, S02): al posto dell'importo nella card Pro.
   * Stesse regole di `storeNote`: opzionale oltre it/en, il render ritira la
   * riga dove manca (tlOwn()).
   */
  priceFromStore: {
    it: "Prezzo indicato dallo store",
    en: "Price set by your store",
  } as Localized,

  // ── Tier: Pro ──────────────────────────────────────────────────────
  /**
   * "Pro" e' il nome commerciale del piano, identico in tutte le lingue del
   * sito (cfr. ABOUT_COPY.trialDesc ja "Proの全機能", ko "모든 Pro 기능"):
   * le voci qui sotto sono lo stesso token di marca, non una traduzione.
   */
  proName: {
    it: "Pro",
    en: "Pro",
    es: "Pro",
    de: "Pro",
    pt: "Pro",
    fr: "Pro",
    pl: "Pro",
    tr: "Pro",
    nl: "Pro",
    ja: "Pro",
    ko: "Pro",
    sv: "Pro",
    da: "Pro",
    no: "Pro",
    fi: "Pro",
  } as Localized,
  /**
   * Provenienza 9 locale nuove: ABOUT_COPY.trialDesc ("abbonamento o sblocco a
   * vita") + ABOUT_COPY.lifetimeUnlockDesc (termine locale per "sblocco a
   * vita": odblokowanie na zawsze / ömür boyu kilit açma / lifetime-toegang /
   * 永久アンロック / 평생 이용권 / livstidsupplåsning / lifetime-oplåsning /
   * livstidslisens / elinikäinen käyttöoikeus).
   */
  proTagline: {
    it: "Sblocco a vita o abbonamento, secondo lo store",
    en: "Lifetime unlock or subscription, depending on the store",
    es: "Suscripción o desbloqueo de por vida",
    de: "Abo oder lebenslange Freischaltung",
    pt: "Assinatura ou desbloqueio vitalício",
    fr: "Abonnement ou achat à vie",
    pl: "Subskrypcja lub odblokowanie na zawsze",
    tr: "Abonelik veya ömür boyu kilit açma",
    nl: "Abonnement of lifetime-toegang",
    ja: "サブスクリプションまたは永久アンロック",
    ko: "구독 또는 평생 이용권",
    sv: "Prenumeration eller livstidsupplåsning",
    da: "Abonnement eller lifetime-oplåsning",
    no: "Abonnement eller livstidslisens",
    fi: "Tilaus tai elinikäinen käyttöoikeus",
  } as Localized,
  /**
   * 02/10/2026 (S02, U-PRICE-09/14): le liste `proFeatures` e `trialFeatures`
   * ("Storico illimitato", "Export completo dei dati") sono state TOLTE: non
   * verificate come contenuto della prova o del piano (FATTI-COMMERCIALI C2;
   * l'app dice che l'export JSON completo e' sempre disponibile). Nessuna lista
   * sostitutiva finche' le funzioni Pro verificate non hanno un testo
   * approvato per il sito.
   */

  // ── Badge terza card pricing (prova 14gg) ───────────────────────────
  /**
   * Ex `founderBadge` (nome stale: la card e' la prova 14 giorni, non un tier
   * Founder). Provenienza 9 locale nuove: smartwatch-per-anziani-guida.ts
   * ("Dispositivo consigliato" → pl "Polecane", tr "Önerilen", nl
   * "Aanbevolen", ja "おすすめ", ko "추천") e nordic-overlay.json
   * (sv "Rekommenderad", da "Anbefalet", no "anbefal-", fi "suositel-").
   */
  recommendedBadge: {
    it: "Consigliato",
    en: "Recommended",
    es: "Recomendado",
    de: "Empfohlen",
    pt: "Recomendado",
    fr: "Recommandé",
    pl: "Polecany",
    tr: "Önerilen",
    nl: "Aanbevolen",
    ja: "おすすめ",
    ko: "추천",
    sv: "Rekommenderad",
    da: "Anbefalet",
    no: "Anbefalt",
    fi: "Suositeltu",
  } as Localized,
  /**
   * Prezzo mostrato sull'unica card pricing evidenziata ("Consigliato",
   * HOMEPAGE_COPY.trialName/trialTagline). Su richiesta di Matteo (31/07,
   * review visiva post-deploy): non "Gratis" (era il testo originale, ma
   * suggeriva un piano gratuito permanente — questa e' una prova a tempo).
   * Qui il testo indica lo STATO (periodo di prova), non un prezzo.
   * Provenienza: de/pl/nl/sv/da/no riusano il sostantivo "prova/trial" gia'
   * usato per ogni locale in ABOUT_COPY.trialDesc e historical-note STATEMENT
   * ("Testphase"/"Okres próbny"/"Proefperiode"/"Provperiod"/"Prøveperiode")
   * — in quelle lingue significa GIA' "periodo di prova", non serve altro.
   * Le altre locale compongono lo stesso sostantivo (Prova/Trial/Prueba/
   * Teste/Essai/Deneme/トライアル/체험/Kokeilu) con la parola "periodo/period/
   * período/süresi/期間/기간/aika" gia' usata altrove nel repo per lo stesso
   * concetto.
   */
  trialPeriodLabel: {
    it: "Periodo di prova",
    en: "Trial period",
    es: "Período de prueba",
    de: "Testphase",
    pt: "Período de teste",
    fr: "Période d'essai",
    pl: "Okres próbny",
    tr: "Deneme süresi",
    nl: "Proefperiode",
    ja: "トライアル期間",
    ko: "체험 기간",
    sv: "Provperiod",
    da: "Prøveperiode",
    no: "Prøveperiode",
    fi: "Kokeiluaika",
  } as Localized,
};
