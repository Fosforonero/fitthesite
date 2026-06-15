# Pricing Single Source of Truth — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Centralise all FitMesh price strings in `lib/pricing.ts` so a future price change requires editing exactly one file; add a `check-prices` guard script that exits 1 if any hardcoded prices slip through review.

**Architecture:** Create a typed `lib/pricing.ts` with raw numeric constants + locale-aware display strings. Replace every hardcoded occurrence in `.ts`/`.tsx` files with interpolation from those constants. JSON dictionary files cannot import TS at runtime, so the two keys that contain prices (`lib/dictionaries/en.json:13` and `lib/dictionaries/it.json:13`) are documented as manual sync points at the top of `pricing.ts`. A standalone Node ESM script (`scripts/check-prices.mjs`) regex-scans the repo and fails CI if undocumented hardcoded prices appear.

**Tech Stack:** TypeScript (strict), Next.js 15 App Router, Node ESM (`.mjs` for the guard script)

---

## File Map

| Status | Path | Purpose |
|--------|------|---------|
| CREATE | `lib/pricing.ts` | Single source of truth — all price constants and display strings |
| CREATE | `scripts/check-prices.mjs` | Guard script — exits 1 on undocumented hardcoded prices |
| MODIFY | `package.json` | Add `"check-prices"` script entry |
| MODIFY | `app/[locale]/(marketing)/beta/page.tsx` | Replace 4 hardcoded price strings |
| MODIFY | `app/[locale]/(marketing)/press/page.tsx` | Replace 2 hardcoded price strings |
| MODIFY | `app/[locale]/(marketing)/layout.tsx` | Replace JSON-LD `price: "3.99"` |
| MODIFY | `app/[locale]/(marketing)/support/page.tsx` | Replace 2 hardcoded price strings |
| MODIFY | `app/[locale]/(marketing)/page.tsx` | Replace 2 hardcoded price strings |
| MODIFY | `app/[locale]/(marketing)/roadmap/page.tsx` | Replace 2 hardcoded price strings |
| MODIFY | `app/[locale]/(marketing)/terms/page.tsx` | Replace 2 hardcoded price strings |
| MODIFY | `app/[locale]/(marketing)/famiglia/page.tsx` | Replace 4 hardcoded price strings |
| MODIFY | `app/[locale]/(marketing)/about/page.tsx` | Replace 3 hardcoded price strings (incl. JSON-LD) |
| MODIFY | `app/[locale]/(marketing)/sync/[provider]/page.tsx` | Replace 1 JSON-LD price |
| MODIFY | `app/mockups/[screen]/screens.tsx` | Replace 1 hardcoded price string |
| MANUAL SYNC | `lib/dictionaries/en.json:13` | Cannot import TS — documented in pricing.ts header |
| MANUAL SYNC | `lib/dictionaries/it.json:13` | Cannot import TS — documented in pricing.ts header |

---

### Task 1: Create `lib/pricing.ts`

**Files:**
- Create: `lib/pricing.ts`

- [ ] **Step 1: Write the file**

```typescript
/**
 * lib/pricing.ts — UNICA FONTE DI VERITÀ per i prezzi di FitMesh Pro
 *
 * Per cambiare un prezzo: modifica SOLO questo file, poi aggiorna manualmente
 * i due punti di sync JSON elencati qui sotto (non possono importare TypeScript).
 *
 * ─── PUNTI DI SYNC MANUALE ────────────────────────────────────────────────
 *  1. lib/dictionaries/en.json   riga 13  →  hero.pricing
 *     valore attuale: "One-time purchase €3.99 · secure payment via Google Play"
 *     costante usata: PRICING.lifetimeAndroid (parte EN)
 *
 *  2. lib/dictionaries/it.json   riga 13  →  hero.pricing
 *     valore attuale: "Acquisto unico €3,99 · pagamento sicuro Google Play"
 *     costante usata: PRICING.lifetimeAndroidIt (parte IT)
 * ──────────────────────────────────────────────────────────────────────────
 */

// ── Valori numerici raw (usati nei JSON-LD schema.org) ────────────────────
/** Prezzo Android lifetime in euro (valore numerico grezzo per JSON-LD) */
export const PRICE_LIFETIME_ANDROID_RAW = "3.99" as const;
/** Prezzo iPhone lifetime in euro (valore numerico grezzo per JSON-LD) */
export const PRICE_LIFETIME_IOS_RAW = "4.99" as const;
/** Prezzo abbonamento 6 mesi in euro (valore numerico grezzo) */
export const PRICE_SUB_6M_RAW = "1.19" as const;

// ── Stringhe display localizzate ─────────────────────────────────────────

/** Oggetto centralizzato con tutte le stringhe display per i prezzi */
export const PRICING = {
  /** Abbonamento semestrale — stesso prezzo su Android e iPhone */
  subSixMonths: {
    it: "€1,19",
    en: "€1.19",
  },
  /** Acquisto unico su Android (Play Store) */
  lifetimeAndroid: {
    it: "€3,99",
    en: "€3.99",
  },
  /** Acquisto unico su iPhone (App Store) */
  lifetimeIos: {
    it: "€4,99",
    en: "€4.99",
  },

  // ── Frasi composte riusabili ─────────────────────────────────────────

  /** "€3,99 su Android · €4,99 su iPhone" */
  lifetimeBoth: {
    it: "€3,99 su Android · €4,99 su iPhone",
    en: "€3.99 on Android · €4.99 on iPhone",
  },
  /** "€3,99 Android · €4,99 iPhone" (versione compatta senza preposizione) */
  lifetimeBothShort: {
    it: "€3,99 Android · €4,99 iPhone",
    en: "€3.99 Android · €4.99 iPhone",
  },
  /** "da €3,99" / "from €3.99" — per contesti che citano solo il prezzo minimo */
  fromLifetime: {
    it: "da €3,99",
    en: "from €3.99",
  },
  /** "€1,19/6 mesi" / "€1.19/6mo" */
  subSixMonthsLabel: {
    it: "€1,19/6 mesi",
    en: "€1.19/6mo",
  },
  /** "€1,19 ogni 6 mesi" / "€1.19 every 6 months" */
  subSixMonthsFull: {
    it: "€1,19 ogni 6 mesi",
    en: "€1.19 every 6 months",
  },
} as const;

/** Helper: ritorna la stringa display per la locale corrente */
export function p(key: keyof typeof PRICING, locale: "it" | "en"): string {
  return PRICING[key][locale];
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd "/Volumes/LOS ANGELES/Matteo/Dev Roba Mia/App Orologio/fitthesite" && npx tsc --noEmit 2>&1 | head -20
```

Expected: no errors (file is standalone with no imports so it compiles immediately).

- [ ] **Step 3: Commit**

```bash
cd "/Volumes/LOS ANGELES/Matteo/Dev Roba Mia/App Orologio/fitthesite" && git add lib/pricing.ts && git commit -m "feat(pricing): crea fonte unica per tutti i prezzi FitMesh Pro"
```

---

### Task 2: Replace prices in `beta/page.tsx`

**Files:**
- Modify: `app/[locale]/(marketing)/beta/page.tsx`

The file has 4 hardcoded price strings (lines 281, 300, 364, 383 approx). We need to import from `pricing.ts` and interpolate.

- [ ] **Step 1: Add import at top of file**

Open `app/[locale]/(marketing)/beta/page.tsx`. After the last existing import line add:

```typescript
import { PRICING } from "@/lib/pricing";
```

- [ ] **Step 2: Replace Italian FAQ entry at ~line 281**

Old:
```typescript
      desc: "Niente carta, niente rinnovo automatico. Alla scadenza scegli tu: resti sul piano gratuito o passi a Pro (€1,19/6 mesi).",
```
New:
```typescript
      desc: `Niente carta, niente rinnovo automatico. Alla scadenza scegli tu: resti sul piano gratuito o passi a Pro (${PRICING.subSixMonthsLabel.it}).`,
```

- [ ] **Step 3: Replace Italian FAQ answer at ~line 300**

Old:
```typescript
      a: "Nessun addebito: non chiediamo la carta. L'account passa semplicemente al piano gratuito (ultimi 14 giorni di storico). Se vuoi continuare con Pro: €1,19 ogni 6 mesi o acquisto unico (€3,99 su Android · €4,99 su iPhone).",
```
New:
```typescript
      a: `Nessun addebito: non chiediamo la carta. L'account passa semplicemente al piano gratuito (ultimi 14 giorni di storico). Se vuoi continuare con Pro: ${PRICING.subSixMonthsFull.it} o acquisto unico (${PRICING.lifetimeBoth.it}).`,
```

- [ ] **Step 4: Replace English FAQ entry at ~line 364**

Old:
```typescript
      desc: "No card, no auto-renewal. When it expires you choose: stay on the free plan or go Pro (€1.19/6 months).",
```
New:
```typescript
      desc: `No card, no auto-renewal. When it expires you choose: stay on the free plan or go Pro (${PRICING.subSixMonthsLabel.en}).`,
```

- [ ] **Step 5: Replace English FAQ answer at ~line 383**

Old:
```typescript
      a: "No charge: we never ask for a card. Your account simply moves to the free plan (last 14 days of history). To keep Pro: €1.19 every 6 months or one-time (€3.99 on Android · €4.99 on iPhone).",
```
New:
```typescript
      a: `No charge: we never ask for a card. Your account simply moves to the free plan (last 14 days of history). To keep Pro: ${PRICING.subSixMonthsFull.en} or one-time (${PRICING.lifetimeBoth.en}).`,
```

- [ ] **Step 6: Verify TypeScript**

```bash
cd "/Volumes/LOS ANGELES/Matteo/Dev Roba Mia/App Orologio/fitthesite" && npx tsc --noEmit 2>&1 | head -20
```

Expected: no errors.

- [ ] **Step 7: Commit**

```bash
cd "/Volumes/LOS ANGELES/Matteo/Dev Roba Mia/App Orologio/fitthesite" && git add "app/[locale]/(marketing)/beta/page.tsx" && git commit -m "refactor(pricing): centralizza prezzi in beta/page.tsx"
```

---

### Task 3: Replace prices in `press/page.tsx`

**Files:**
- Modify: `app/[locale]/(marketing)/press/page.tsx`

- [ ] **Step 1: Add import**

After last existing import in `app/[locale]/(marketing)/press/page.tsx`:

```typescript
import { PRICING } from "@/lib/pricing";
```

- [ ] **Step 2: Replace Italian key facts pricing value (~line 67)**

Old:
```typescript
      { label: "Pricing", value: "Free tier + Pro da €3.99 una tantum (Android €3.99 · iPhone €4.99) o €1.19/6 mesi" },
```
New:
```typescript
      { label: "Pricing", value: `Free tier + Pro ${PRICING.fromLifetime.it} una tantum (Android ${PRICING.lifetimeAndroid.it} · iPhone ${PRICING.lifetimeIos.it}) o ${PRICING.subSixMonthsLabel.it}` },
```

- [ ] **Step 3: Replace English key facts pricing value (~line 153)**

Old:
```typescript
      { label: "Pricing", value: "Free tier + Pro from €3.99 one-time (Android €3.99 · iPhone €4.99) or €1.19/6mo" },
```
New:
```typescript
      { label: "Pricing", value: `Free tier + Pro ${PRICING.fromLifetime.en} one-time (Android ${PRICING.lifetimeAndroid.en} · iPhone ${PRICING.lifetimeIos.en}) or ${PRICING.subSixMonthsLabel.en}` },
```

- [ ] **Step 4: Verify TypeScript and commit**

```bash
cd "/Volumes/LOS ANGELES/Matteo/Dev Roba Mia/App Orologio/fitthesite" && npx tsc --noEmit 2>&1 | head -10 && git add "app/[locale]/(marketing)/press/page.tsx" && git commit -m "refactor(pricing): centralizza prezzi in press/page.tsx"
```

---

### Task 4: Replace JSON-LD prices in `layout.tsx`, `about/page.tsx`, `sync/[provider]/page.tsx`

**Files:**
- Modify: `app/[locale]/(marketing)/layout.tsx`
- Modify: `app/[locale]/(marketing)/about/page.tsx`
- Modify: `app/[locale]/(marketing)/sync/[provider]/page.tsx`

These three files have `price: "3.99"` in schema.org JSON-LD nodes. We replace the string literal with `PRICE_LIFETIME_ANDROID_RAW`.

- [ ] **Step 1: Add import to `layout.tsx`**

After last existing import in `app/[locale]/(marketing)/layout.tsx`:

```typescript
import { PRICE_LIFETIME_ANDROID_RAW } from "@/lib/pricing";
```

- [ ] **Step 2: Replace JSON-LD price in `layout.tsx` (~line 170)**

Old:
```typescript
          { "@type": "Offer", price: "3.99", priceCurrency: "EUR", category: "Onetime purchase" },
```
New:
```typescript
          { "@type": "Offer", price: PRICE_LIFETIME_ANDROID_RAW, priceCurrency: "EUR", category: "Onetime purchase" },
```

- [ ] **Step 3: Add import to `about/page.tsx`**

After last existing import in `app/[locale]/(marketing)/about/page.tsx`:

```typescript
import { PRICE_LIFETIME_ANDROID_RAW, PRICING } from "@/lib/pricing";
```

- [ ] **Step 4: Replace JSON-LD price in `about/page.tsx` (~line 82)**

Old:
```typescript
      offers: { "@type": "Offer", price: "3.99", priceCurrency: "EUR" },
```
New:
```typescript
      offers: { "@type": "Offer", price: PRICE_LIFETIME_ANDROID_RAW, priceCurrency: "EUR" },
```

- [ ] **Step 5: Replace display price in `about/page.tsx` (~line 275)**

Old:
```typescript
            {lc === "it" ? "€3,99 Android · €4,99 iPhone" : "€3.99 Android · €4.99 iPhone"}
```
New:
```typescript
            {PRICING.lifetimeBothShort[lc]}
```

- [ ] **Step 6: Replace description price in `about/page.tsx` (~lines 31-32)**

Old:
```typescript
      ? "FitMesh Sync sincronizza i dati del tuo smartwatch su una dashboard premium tutta tua. Privacy-first, acquisto unico da €3,99, niente cloud opachi."
      : "FitMesh Sync mirrors your smartwatch data to a premium dashboard that's all yours. Privacy-first, one-time from €3.99, no opaque clouds.";
```
New:
```typescript
      ? `FitMesh Sync sincronizza i dati del tuo smartwatch su una dashboard premium tutta tua. Privacy-first, acquisto unico ${PRICING.fromLifetime.it}, niente cloud opachi.`
      : `FitMesh Sync mirrors your smartwatch data to a premium dashboard that's all yours. Privacy-first, one-time ${PRICING.fromLifetime.en}, no opaque clouds.`;
```

- [ ] **Step 7: Add import to `sync/[provider]/page.tsx`**

After last existing import in `app/[locale]/(marketing)/sync/[provider]/page.tsx`:

```typescript
import { PRICE_LIFETIME_ANDROID_RAW } from "@/lib/pricing";
```

- [ ] **Step 8: Replace JSON-LD price in `sync/[provider]/page.tsx` (~line 128)**

Old:
```typescript
    offers: { "@type": "Offer", price: "3.99", priceCurrency: "EUR" },
```
New:
```typescript
    offers: { "@type": "Offer", price: PRICE_LIFETIME_ANDROID_RAW, priceCurrency: "EUR" },
```

- [ ] **Step 9: Verify TypeScript and commit**

```bash
cd "/Volumes/LOS ANGELES/Matteo/Dev Roba Mia/App Orologio/fitthesite" && npx tsc --noEmit 2>&1 | head -10 && git add "app/[locale]/(marketing)/layout.tsx" "app/[locale]/(marketing)/about/page.tsx" "app/[locale]/(marketing)/sync/[provider]/page.tsx" && git commit -m "refactor(pricing): centralizza JSON-LD price in layout, about e sync"
```

---

### Task 5: Replace prices in `support/page.tsx`

**Files:**
- Modify: `app/[locale]/(marketing)/support/page.tsx`

- [ ] **Step 1: Add import**

After last existing import in `app/[locale]/(marketing)/support/page.tsx`:

```typescript
import { PRICING } from "@/lib/pricing";
```

- [ ] **Step 2: Replace Italian FAQ entry (~line 16)**

Old:
```typescript
  { q: "Quanto costa FitMesh Sync?", a: "€3,99 su Android · €4,99 su iPhone — acquisto unico, niente abbonamento, niente rinnovi automatici, niente sorprese in fattura." },
```
New:
```typescript
  { q: "Quanto costa FitMesh Sync?", a: `${PRICING.lifetimeBoth.it} — acquisto unico, niente abbonamento, niente rinnovi automatici, niente sorprese in fattura.` },
```

- [ ] **Step 3: Replace English FAQ entry (~line 29)**

Old:
```typescript
  { q: "How much does FitMesh Sync cost?", a: "€3.99 on Android · €4.99 on iPhone — one-time purchase, no subscription, no auto-renewals, no billing surprises." },
```
New:
```typescript
  { q: "How much does FitMesh Sync cost?", a: `${PRICING.lifetimeBoth.en} — one-time purchase, no subscription, no auto-renewals, no billing surprises.` },
```

- [ ] **Step 4: Verify TypeScript and commit**

```bash
cd "/Volumes/LOS ANGELES/Matteo/Dev Roba Mia/App Orologio/fitthesite" && npx tsc --noEmit 2>&1 | head -10 && git add "app/[locale]/(marketing)/support/page.tsx" && git commit -m "refactor(pricing): centralizza prezzi in support/page.tsx"
```

---

### Task 6: Replace prices in `page.tsx` (homepage)

**Files:**
- Modify: `app/[locale]/(marketing)/page.tsx`

- [ ] **Step 1: Add import**

After last existing import in `app/[locale]/(marketing)/page.tsx`:

```typescript
import { PRICING } from "@/lib/pricing";
```

- [ ] **Step 2: Replace founder pitch text (~lines 611-612)**

Old:
```typescript
                ? "Free for life per i primi 100. Acquisto unico da €3,99 dopo il lancio pubblico."
                : "Free for life for the first 100. One-time from €3.99 after public launch."}
```
New:
```typescript
                ? `Free for life per i primi 100. Acquisto unico ${PRICING.fromLifetime.it} dopo il lancio pubblico.`
                : `Free for life for the first 100. One-time ${PRICING.fromLifetime.en} after public launch.`}
```

- [ ] **Step 3: Verify TypeScript and commit**

```bash
cd "/Volumes/LOS ANGELES/Matteo/Dev Roba Mia/App Orologio/fitthesite" && npx tsc --noEmit 2>&1 | head -10 && git add "app/[locale]/(marketing)/page.tsx" && git commit -m "refactor(pricing): centralizza prezzi in homepage"
```

---

### Task 7: Replace prices in `roadmap/page.tsx`

**Files:**
- Modify: `app/[locale]/(marketing)/roadmap/page.tsx`

- [ ] **Step 1: Add import**

After last existing import in `app/[locale]/(marketing)/roadmap/page.tsx`:

```typescript
import { PRICING } from "@/lib/pricing";
```

- [ ] **Step 2: Replace bilingual roadmap text (~lines 140-141)**

Old:
```typescript
          it: "Una settimana per provare tutto senza inserire dati di pagamento. Acquisto unico da €3,99 al termine, niente subscription.",
          en: "One week to try everything without entering payment details. One-time from €3.99 after, no subscription.",
```
New:
```typescript
          it: `Una settimana per provare tutto senza inserire dati di pagamento. Acquisto unico ${PRICING.fromLifetime.it} al termine, niente subscription.`,
          en: `One week to try everything without entering payment details. One-time ${PRICING.fromLifetime.en} after, no subscription.`,
```

- [ ] **Step 3: Verify TypeScript and commit**

```bash
cd "/Volumes/LOS ANGELES/Matteo/Dev Roba Mia/App Orologio/fitthesite" && npx tsc --noEmit 2>&1 | head -10 && git add "app/[locale]/(marketing)/roadmap/page.tsx" && git commit -m "refactor(pricing): centralizza prezzi in roadmap/page.tsx"
```

---

### Task 8: Replace prices in `terms/page.tsx`

**Files:**
- Modify: `app/[locale]/(marketing)/terms/page.tsx`

- [ ] **Step 1: Add import**

After last existing import in `app/[locale]/(marketing)/terms/page.tsx`:

```typescript
import { PRICING } from "@/lib/pricing";
```

- [ ] **Step 2: Replace Italian terms price (~line 146)**

Old:
```typescript
            <span><strong className="text-text-primary">Acquisto unico — €3,99 su Android (€4,99 su iPhone):</strong> sblocca permanentemente tutte le funzionalità Pro sull'account associato. Nessun abbonamento, nessun rinnovo automatico.</span>
```
New:
```typescript
            <span><strong className="text-text-primary">Acquisto unico — {PRICING.lifetimeAndroid.it} su Android ({PRICING.lifetimeIos.it} su iPhone):</strong> sblocca permanentemente tutte le funzionalità Pro sull'account associato. Nessun abbonamento, nessun rinnovo automatico.</span>
```

- [ ] **Step 3: Replace English terms price (~line 333)**

Old:
```typescript
            <span><strong className="text-text-primary">One-time purchase — €3.99 on Android (€4.99 on iPhone):</strong> unlocks Pro features permanently on the associated account. No subscription, no auto-renewal.</span>
```
New:
```typescript
            <span><strong className="text-text-primary">One-time purchase — {PRICING.lifetimeAndroid.en} on Android ({PRICING.lifetimeIos.en} on iPhone):</strong> unlocks Pro features permanently on the associated account. No subscription, no auto-renewal.</span>
```

- [ ] **Step 4: Verify TypeScript and commit**

```bash
cd "/Volumes/LOS ANGELES/Matteo/Dev Roba Mia/App Orologio/fitthesite" && npx tsc --noEmit 2>&1 | head -10 && git add "app/[locale]/(marketing)/terms/page.tsx" && git commit -m "refactor(pricing): centralizza prezzi in terms/page.tsx"
```

---

### Task 9: Replace prices in `famiglia/page.tsx`

**Files:**
- Modify: `app/[locale]/(marketing)/famiglia/page.tsx`

- [ ] **Step 1: Add import**

After last existing import in `app/[locale]/(marketing)/famiglia/page.tsx`:

```typescript
import { PRICING } from "@/lib/pricing";
```

- [ ] **Step 2: Replace Italian long FAQ (~line 119)**

Old:
```typescript
      "Il piano gratuito copre te + 2 familiari (3 totali). Con FitMesh Pro (acquisto unico: €3,99 su Android · €4,99 su iPhone) sblocchi fino a 8 membri, storico esteso, e priorita' sync. Niente subscription, niente trial scaduti, niente carte di credito richieste.",
```
New:
```typescript
      `Il piano gratuito copre te + 2 familiari (3 totali). Con FitMesh Pro (acquisto unico: ${PRICING.lifetimeBoth.it}) sblocchi fino a 8 membri, storico esteso, e priorita' sync. Niente subscription, niente trial scaduti, niente carte di credito richieste.`,
```

- [ ] **Step 3: Replace Italian short FAQ (~line 151)**

Old:
```typescript
          "Piano gratuito: 3 totali (incluso te). Piano Pro (€3,99 Android · €4,99 iPhone): fino a 8 membri.",
```
New:
```typescript
          `Piano gratuito: 3 totali (incluso te). Piano Pro (${PRICING.lifetimeBothShort.it}): fino a 8 membri.`,
```

- [ ] **Step 4: Replace English long FAQ (~line 235)**

Old:
```typescript
      "Free plan covers you + 2 family members (3 total). With FitMesh Pro (one-time: €3.99 on Android · €4.99 on iPhone) you unlock up to 8 members, extended history, and sync priority. No subscription, no expired trials, no credit card required.",
```
New:
```typescript
      `Free plan covers you + 2 family members (3 total). With FitMesh Pro (one-time: ${PRICING.lifetimeBoth.en}) you unlock up to 8 members, extended history, and sync priority. No subscription, no expired trials, no credit card required.`,
```

- [ ] **Step 5: Replace English short FAQ (~line 267)**

Old:
```typescript
          "Free plan: 3 total (including you). Pro (€3.99 Android · €4.99 iPhone): up to 8 members.",
```
New:
```typescript
          `Free plan: 3 total (including you). Pro (${PRICING.lifetimeBothShort.en}): up to 8 members.`,
```

- [ ] **Step 6: Verify TypeScript and commit**

```bash
cd "/Volumes/LOS ANGELES/Matteo/Dev Roba Mia/App Orologio/fitthesite" && npx tsc --noEmit 2>&1 | head -10 && git add "app/[locale]/(marketing)/famiglia/page.tsx" && git commit -m "refactor(pricing): centralizza prezzi in famiglia/page.tsx"
```

---

### Task 10: Replace price in `mockups/[screen]/screens.tsx`

**Files:**
- Modify: `app/mockups/[screen]/screens.tsx`

- [ ] **Step 1: Add import**

After last existing import in `app/mockups/[screen]/screens.tsx`:

```typescript
import { PRICING } from "@/lib/pricing";
```

- [ ] **Step 2: Replace hardcoded mockup price (~line 654)**

Old:
```typescript
          da €3,99 acquisto unico · No abbonamento
```
New (as JSX expression — the `<p>` tag wraps a text node, replace the text content):
```typescript
          {`${PRICING.fromLifetime.it} acquisto unico · No abbonamento`}
```

Note: the original is a bare text node inside `<p>`. Wrap it in a JSX expression (`{``}`) so the template literal is valid. The opening and closing `<p>` tags stay unchanged; only the inner text changes.

- [ ] **Step 3: Verify TypeScript and commit**

```bash
cd "/Volumes/LOS ANGELES/Matteo/Dev Roba Mia/App Orologio/fitthesite" && npx tsc --noEmit 2>&1 | head -10 && git add "app/mockups/[screen]/screens.tsx" && git commit -m "refactor(pricing): centralizza prezzo in screens.tsx mockup"
```

---

### Task 11: Create `scripts/check-prices.mjs` guard script

**Files:**
- Create: `scripts/check-prices.mjs`
- Modify: `package.json`

- [ ] **Step 1: Create the guard script**

```javascript
#!/usr/bin/env node
/**
 * scripts/check-prices.mjs
 *
 * Cerca prezzi hardcoded nei file .ts/.tsx/.js fuori dalla fonte ufficiale
 * (lib/pricing.ts) e dai punti di sync manuale documentati.
 *
 * Esce con codice 1 se trova occorrenze non autorizzate.
 * Esegui con:  node scripts/check-prices.mjs
 */

import { readFileSync, readdirSync, statSync } from "fs";
import { join, relative } from "path";

// ── Configurazione ──────────────────────────────────────────────────────

const ROOT = new URL("..", import.meta.url).pathname;

/**
 * File esplicitamente esclusi dalla scansione perché documentati come
 * punti di sync manuale in lib/pricing.ts (non possono importare TS).
 */
const MANUAL_SYNC_FILES = new Set([
  "lib/dictionaries/en.json",
  "lib/dictionaries/it.json",
]);

/**
 * File sorgente della verità — non segnalare occorrenze qui.
 */
const SOURCE_OF_TRUTH = "lib/pricing.ts";

/**
 * Regex che individua i prezzi FitMesh nei formati usati nel sito.
 * Calibrata per non colpire numeri generici (es. "3.5 secondi", "1.0.0").
 *
 * Cattura:
 *   €3,99  €4,99  €1,19  (formato IT con virgola)
 *   €3.99  €4.99  €1.19  (formato EN con punto)
 *   "3.99" "4.99" "1.19" (stringhe JSON-LD senza simbolo euro)
 *
 * Non cattura:
 *   versioni semver (1.19.0), percentuali, durate, coordinate GPS, ecc.
 */
const PRICE_PATTERN =
  /(?:€\s*[134][,.](?:19|99)(?!\d))|(?:["'](?:3\.99|4\.99|1\.19)["'])/g;

// Parole contesto che confermano che si tratta di un prezzo FitMesh.
// Se il pattern matcha su una riga senza nessuna di queste, è quasi
// certamente un falso positivo (es. codice Apple SVG path).
const CONTEXT_WORDS =
  /pro|lifetime|vita|abbonament|subscription|subscription|pricing|purchase|acquisto|unico|android|iphone|apple|google|play|one.time/i;

// ── Scansione ricorsiva ─────────────────────────────────────────────────

/**
 * @param {string} dir
 * @returns {string[]} percorsi assoluti di tutti i file .ts/.tsx/.json/.js
 */
function walk(dir) {
  const results = [];
  for (const entry of readdirSync(dir)) {
    if (
      entry === "node_modules" ||
      entry === ".next" ||
      entry === ".git" ||
      entry === "dist"
    )
      continue;
    const full = join(dir, entry);
    const stat = statSync(full);
    if (stat.isDirectory()) {
      results.push(...walk(full));
    } else if (/\.(ts|tsx|js|mjs|json)$/.test(entry)) {
      results.push(full);
    }
  }
  return results;
}

// ── Main ────────────────────────────────────────────────────────────────

const files = walk(ROOT);
const violations = [];

for (const absPath of files) {
  const rel = relative(ROOT, absPath);

  // Salta la fonte di verità e i punti di sync manuale
  if (rel === SOURCE_OF_TRUTH) continue;
  if (MANUAL_SYNC_FILES.has(rel)) continue;
  // Salta questo script stesso e il piano
  if (rel.startsWith("scripts/") && rel.endsWith("check-prices.mjs")) continue;
  if (rel.startsWith("docs/")) continue;

  const content = readFileSync(absPath, "utf8");
  const lines = content.split("\n");

  lines.forEach((line, idx) => {
    // Ignora commenti di una riga
    if (/^\s*\/\//.test(line)) return;

    const matches = [...line.matchAll(PRICE_PATTERN)];
    for (const match of matches) {
      // Applica filtro contesto per ridurre falsi positivi
      if (!CONTEXT_WORDS.test(line)) continue;
      violations.push({
        file: rel,
        line: idx + 1,
        content: line.trim().slice(0, 120),
        match: match[0],
      });
    }
  });
}

if (violations.length === 0) {
  console.log("✓ check-prices: nessun prezzo hardcoded trovato fuori da lib/pricing.ts");
  process.exit(0);
} else {
  console.error(
    `\n✗ check-prices: trovate ${violations.length} occorrenza/e di prezzi hardcoded!\n`
  );
  console.error(
    "  Se si tratta di punti di sync manuale previsti, documentali in lib/pricing.ts\n"
  );
  for (const v of violations) {
    console.error(`  ${v.file}:${v.line}  [${v.match}]`);
    console.error(`    ${v.content}\n`);
  }
  process.exit(1);
}
```

- [ ] **Step 2: Add `check-prices` to `package.json` scripts**

Open `package.json`. Change the `scripts` block from:

```json
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint"
  },
```

To:

```json
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "check-prices": "node scripts/check-prices.mjs"
  },
```

Note: **do not** add `check-prices` to the `build` script. The Next.js build runs in Vercel's environment where `npx tsc` is not pre-run, and a failing guard would block deploys for everyone. The script is meant to be run locally before push and in CI as a separate step.

- [ ] **Step 3: Run the guard script to confirm it passes**

```bash
cd "/Volumes/LOS ANGELES/Matteo/Dev Roba Mia/App Orologio/fitthesite" && node scripts/check-prices.mjs
```

Expected output: `✓ check-prices: nessun prezzo hardcoded trovato fuori da lib/pricing.ts`
Expected exit code: 0

If the guard reports remaining violations, go back and fix them (they may be in a file missed in earlier tasks, e.g., a blog post or landing page variant).

- [ ] **Step 4: Commit**

```bash
cd "/Volumes/LOS ANGELES/Matteo/Dev Roba Mia/App Orologio/fitthesite" && git add scripts/check-prices.mjs package.json && git commit -m "feat(pricing): aggiungi guardia anti-regressione check-prices"
```

---

### Task 12: Final verification and push

- [ ] **Step 1: Run full TypeScript check**

```bash
cd "/Volumes/LOS ANGELES/Matteo/Dev Roba Mia/App Orologio/fitthesite" && npx tsc --noEmit 2>&1
```

Expected: no errors.

- [ ] **Step 2: Run price guard**

```bash
cd "/Volumes/LOS ANGELES/Matteo/Dev Roba Mia/App Orologio/fitthesite" && node scripts/check-prices.mjs
```

Expected: exit code 0, `✓ check-prices: nessun prezzo hardcoded trovato`.

- [ ] **Step 3: Spot-check rendered strings have not changed**

Run a quick grep to confirm that the display text produced at runtime is identical to what was there before:

```bash
cd "/Volumes/LOS ANGELES/Matteo/Dev Roba Mia/App Orologio/fitthesite" && node -e "
import('@/lib/pricing').catch(() => {
  // fallback: evaluate directly
  const {PRICING} = require('./lib/pricing.js');
  console.log(PRICING.lifetimeBoth.it);
  console.log(PRICING.lifetimeBoth.en);
  console.log(PRICING.subSixMonthsLabel.it);
  console.log(PRICING.subSixMonthsLabel.en);
})
"
```

Since `lib/pricing.ts` is TypeScript and not directly runnable with node, verify visually by reading the constant file and confirming strings match the originals in git. Run:

```bash
cd "/Volumes/LOS ANGELES/Matteo/Dev Roba Mia/App Orologio/fitthesite" && git diff HEAD~10 -- lib/pricing.ts 2>/dev/null || cat lib/pricing.ts
```

Visually confirm:
- `lifetimeBoth.it` = `"€3,99 su Android · €4,99 su iPhone"` ✓
- `lifetimeBoth.en` = `"€3.99 on Android · €4.99 on iPhone"` ✓
- `subSixMonths.it` = `"€1,19"` ✓

- [ ] **Step 4: Push to origin main**

```bash
cd "/Volumes/LOS ANGELES/Matteo/Dev Roba Mia/App Orologio/fitthesite" && git push origin main
```

Expected: Vercel auto-deploy triggers. Check Vercel dashboard for green deploy.

---

## Self-Review

**Spec coverage check:**

| Requirement | Task |
|-------------|------|
| Crea `lib/pricing.ts` con costanti tipizzate e stringhe display bilingue | Task 1 |
| Costanti raw numeriche per JSON-LD | Task 1 |
| Frasi composte riusabili it/en | Task 1 |
| Sostituisci prezzi in beta, press, layout, support, homepage, roadmap, terms, famiglia, about, sync, mockups | Tasks 2-10 |
| Punti di sync manuale documentati in pricing.ts | Task 1 header |
| Script `scripts/check-prices.mjs` con regex calibrata | Task 11 |
| `"check-prices"` in package.json | Task 11 |
| JSON-LD `price: "3.99"` → costante | Task 4 |
| `npx tsc --noEmit` verde | Task 12 |
| `node scripts/check-prices.mjs` verde | Task 12 |
| `git push origin main` | Task 12 |

**Placeholder scan:** None found — all steps have complete code.

**Type consistency:** `PRICING`, `PRICE_LIFETIME_ANDROID_RAW`, `PRICE_LIFETIME_IOS_RAW`, `PRICE_SUB_6M_RAW` defined in Task 1 and used consistently in Tasks 2-10. `p()` helper defined but not used in page files (page files access `PRICING[key][locale]` directly, which is more readable in JSX). No inconsistency.

**AppleStoreButton false positive:** `components/AppleStoreButton.tsx` contains `3.99` in an SVG `<path d="...">` string. The guard script's `CONTEXT_WORDS` filter will skip this line because it has no pricing-related words.
