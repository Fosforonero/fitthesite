# FitMesh Sync — Brand & Design System

**Versione:** 1.0
**Ultimo aggiornamento:** 12 maggio 2026
**Status:** production-ready

Questa è l'unica fonte di verità del design system. Sito web, dashboard, app
Android, futuro client iOS devono allinearsi a questi token. Non inventare
colori. Non aggiungere font. Non modificare valori senza aggiornare prima
questo file.

---

## 1. Mood & posizionamento

**FitMesh Sync** è un'app di sincronizzazione dati wearable con dashboard
premium per uso personale, caregiver e professionisti della salute.

### Riferimenti visivi

| Sì                          | No                          |
|-----------------------------|-----------------------------|
| Apple Fitness+              | Bootstrap legacy            |
| Whoop / Oura Ring           | Gaming neon                 |
| Tesla in-car UI             | Crypto / DeFi               |
| Apple Health                | Cyberpunk aggressivo        |
| Linear / Vercel docs        | Gradienti arcobaleno        |

### Aggettivi guida

Premium · Tech · Pulito · Moderno · Apple-like · Fitness oriented · Leggibile · Aria · Respiro · Gerarchia chiara.

---

## 2. Logo

Il marchio è un'icona quadrata con angoli arrotondati che contiene:

1. Monogramma **FM** in gradient brand (green → aqua → blue)
2. Soundwave centrale di 4 barre verticali (rappresenta la sync)
3. Sfondo deep ink (`#0A0F1F`) per massimo contrasto

### Variazioni di file

| Uso              | Path                          | Dimensione    | Generazione                                |
|------------------|-------------------------------|---------------|--------------------------------------------|
| Favicon          | `app/icon.tsx`                | 64×64         | Dinamica (ImageResponse)                   |
| Apple touch      | `app/apple-icon.tsx`          | 180×180       | Dinamica                                   |
| OG social        | `app/opengraph-image.tsx`     | 1200×630      | Dinamica                                   |
| Header componente | `components/Logo.tsx`         | Vector SVG    | Inline, scalable                           |
| Logo full PNG    | `public/logo.png` *(opt)*     | 1024×1024     | Manuale — da fornire per stampa/marketing  |

### Regole d'uso

- Area di rispetto: **almeno il 25% della larghezza del logo** su ogni lato libero
- Mai applicare ombre dure al logo
- Mai mettere il logo su sfondi che riducano il contrasto del gradient (i.e. su verde acceso)
- Sul claim usare sempre "FitMesh Sync" (con spazio); abbreviare in "FitMesh" SOLO dove il contesto è già chiaro

### Compliance store

- **Apple HIG:** rounded square con safe area interna del 10% → ✓
- **Google Play adaptive icon:** safe zone 66dp su 108dp → da generare versioni `foreground` e `background` separate se serve adaptive
- **Leggibilità a 16px:** OK (le barre soundwave si fondono ma il monogram resta leggibile)

---

## 3. Palette — Brand colors

### Primary (gradient brand)

| Nome             | Hex       | Uso                                                  |
|------------------|-----------|------------------------------------------------------|
| Neon Green       | `#7CFF5B` | Start del gradient brand · success energetico        |
| Aqua             | `#21E6C1` | Mid del gradient · primary CTA midpoint · focus ring |
| Bright Blue      | `#1DA1FF` | End del gradient · link · icone primarie             |
| Electric Blue    | `#006BFF` | Stato pressed · depth · accenti rari                 |

**Regola d'oro:** i 4 colori brand non vanno MAI usati come fill di testo lungo. Solo per: accenti, icone, gradient, microelementi.

### Background system

| Nome             | Hex       | Uso                                                  |
|------------------|-----------|------------------------------------------------------|
| Main BG          | `#050816` | Body, sfondo pagina                                   |
| Secondary BG     | `#0B1023` | Sezioni alternate, footer gradient top                |
| Card BG          | `#12182B` | Card di default                                       |
| Elevated Card    | `#1A2238` | Hover state, modale, dropdown                         |
| Divider          | `#24304A` | Hairline border, separatori                           |

### Text scale

| Nome             | Hex       | Uso                                                  |
|------------------|-----------|------------------------------------------------------|
| Primary          | `#FFFFFF` | Headline, label primari, valori metric                |
| Secondary        | `#B7C2D8` | Body, descrizioni                                     |
| Muted            | `#7F8AA3` | Caption, label di sezione, helper text                |
| Disabled         | `#556078` | Input disabilitati, placeholder                       |

### Semantic

| Nome             | Hex       | Uso                                                  |
|------------------|-----------|------------------------------------------------------|
| Success          | `#31E981` | Stati positivi, conferme                              |
| Warning          | `#FFB547` | Soglie, attenzione                                    |
| Error            | `#FF5C7A` | Errori, distruttivo                                   |
| Info             | `#38BDF8` | Informativo, neutro                                   |

### Contrast AA verifica

- Primary text su Main BG: **20.6:1** → AAA
- Secondary text su Main BG: **11.8:1** → AAA
- Muted text su Main BG: **6.4:1** → AA
- Aqua (`#21E6C1`) su Main BG: **9.2:1** → AAA
- Bright Blue (`#1DA1FF`) su Main BG: **6.1:1** → AA

---

## 4. Gradients

Solo tre gradient ufficiali. Niente altro è ammesso.

```css
/* Brand gradient — uso primario su hero e logo */
linear-gradient(135deg, #7CFF5B 0%, #21E6C1 45%, #1DA1FF 100%)

/* CTA gradient — solo per bottoni primari */
linear-gradient(90deg, #21E6C1 0%, #1DA1FF 100%)

/* Page gradient — body background di alcune sezioni */
linear-gradient(180deg, #0B1023 0%, #050816 100%)
```

I tre gradient sono anche disponibili come utility Tailwind:
`bg-brand-gradient`, `bg-cta-gradient`, `bg-page-gradient`.

---

## 5. Typography

### Font stack

| Ruolo    | Font           | Source                  | Variabile CSS         |
|----------|----------------|-------------------------|-----------------------|
| Display  | Space Grotesk  | next/font/google (self) | `--font-grotesk`      |
| Body/UI  | Inter          | next/font/google (self) | `--font-inter`        |
| Mono     | system mono    | -                       | -                     |

Display per: titoli, valori metric, statement. Inter per tutto il resto.

### Type scale

| Token            | Mobile           | Desktop        | Line-height | Letter-spacing |
|------------------|------------------|----------------|-------------|----------------|
| `text-display-2xl`| 40 → 96 px (clamp) | 96 px         | 0.95        | -0.03em        |
| `text-display-xl` | 36 → 76 px (clamp) | 76 px          | 1.02        | -0.025em       |
| `text-display-lg` | 36 → 52 px (clamp) | 52 px          | 1.08        | -0.02em        |
| `text-display`    | 30 → 40 px (clamp) | 40 px          | 1.1         | -0.015em       |
| `text-metric`     | 28 → 36 px (clamp) | 36 px          | 1.05        | -0.02em        |
| `text-2xl`        | 20 px            | 24 px          | 1.25        | -0.01em        |
| `text-xl`         | 18 px            | 20 px          | 1.3         | -             |
| `text-lg`         | 16 px            | 18 px          | 1.4         | -              |
| `text-base`       | 15 px            | 16 px          | 1.5         | -              |
| `text-sm`         | 13 px            | 14 px          | 1.5         | -              |
| `text-xs`         | 11 px            | 12 px          | 1.5         | -              |
| Label uppercase   | 10 → 11 px       | 11 px          | 1.4         | 0.22em         |

### Pesi font ammessi

- **400** regular — body
- **500** medium — label, micro-headline
- **600** semibold — headline, CTA
- **700** bold — display extreme (raro)

Niente font-weight 800/900 sul sito. Lo riserviamo solo al logo.

### Letter-spacing rule

Headline grandi (`display-*` e `metric`) usano sempre letter-spacing negativo
(da `-0.015em` a `-0.03em`) per il look Apple-like. Label uppercase usano
tracking ampio (`0.18em`–`0.22em`).

### Display scale & lingue (regola anti-overflow)

`display-2xl` è la scala "cinematografica" riservata agli **hero**. È volutamente
oversize: per restare safe su tutte le 11 lingue:

- Il `clamp()` ha **min basso** (40px): tedesco e parole composte lunghe non
  devono mai forzare overflow orizzontale. Accoppiare sempre con `text-balance`.
- **CJK (ja/ko):** il letter-spacing negativo NON si applica — è già neutralizzato
  globalmente in `globals.css` (`html[lang="ja"|"ko"]`, line-height 1.75). Non
  reintrodurre tracking negativo inline sui display per queste lingue.
- Mai usare `display-2xl` per testo di paragrafo o blocchi multi-riga lunghi.

---

## 6. Spacing (4-point baseline)

Tutto lo spacing è multiplo di 4px. Token CSS:

```
--fm-space-1:  4px    --fm-space-8:  32px
--fm-space-2:  8px    --fm-space-10: 40px
--fm-space-3:  12px   --fm-space-12: 48px
--fm-space-4:  16px   --fm-space-16: 64px
--fm-space-5:  20px   --fm-space-20: 80px
--fm-space-6:  24px
```

### Pattern frequenti

- Padding card: `16` mobile / `20-24` desktop
- Gap grid: `12-16` mobile / `16-20` desktop
- Padding hero verticale: `64-96` mobile / `96-128` desktop
- Padding sezione: `64` mobile / `96` desktop

---

## 7. Radius

| Token            | Valore | Uso                                       |
|------------------|--------|-------------------------------------------|
| `rounded-sm`     | 8 px   | Badge, chip piccoli                       |
| `rounded` (def)  | 14 px  | Default su quasi tutto                    |
| `rounded-card`   | 20 px  | Card grandi, modal                        |
| `rounded-pill`   | 999px  | Bottoni pill, badge stato                 |

Niente radius custom fuori da questi.

---

## 8. Elevation (shadow)

Le ombre sono **soft e composte**, mai pesanti né colorate (eccetto CTA che ha
un glow brand subtile).

```css
--fm-shadow-card:  0 1px 0 rgba(255,255,255,0.04) inset, 0 8px 24px -12px rgba(0,0,0,0.6);
--fm-shadow-hi:    0 1px 0 rgba(255,255,255,0.06) inset, 0 16px 40px -16px rgba(0,0,0,0.7);
--fm-shadow-cta:   0 6px 24px -8px rgba(33,230,193,0.35), 0 2px 0 rgba(255,255,255,0.06) inset;
```

Vietato:
- Drop shadow pesanti tipo "elevation 24" di Material
- Glow neon sui contenuti (solo su CTA, e sottile)
- Ombre nere puro alpha 0.8+

### Depth & glow (atmosfera, dark-only)

Per il look "agency" premium la profondità arriva da **layer atmosferici**, non da
colori più accesi. Token centralizzati in `design-tokens.css` (non ripetere inline):

```css
--fm-glow-brand:  radial-gradient(closest-side, rgba(33,230,193,0.18), transparent 70%);
--fm-glow-soft:   radial-gradient(closest-side, rgba(29,161,255,0.14), transparent 72%);
--fm-halo-hero:   conic-gradient(from 200deg at 50% 50%, …) + blur(48px);  /* vedi .halo-conic */
```

Regole: alpha sempre basso (≤0.22), `blur` generoso (≥40px), `pointer-events:none`,
sempre dietro al contenuto (`z-index` negativo o `-z-10`). Mai glow saturi/neon sul
testo. Gli orb decorativi rispettano `prefers-reduced-motion` (niente drift).

---

## 9. Components

### Button — primary (CTA)

```html
<a class="btn-cta px-5 py-3 rounded-pill">Scarica</a>
```

- Background: `cta-gradient` (aqua → blue)
- Text color: `#03121f` (deep ink per contrasto sul gradient chiaro)
- Shadow: `shadow-cta` (subtle aqua glow)
- Hover: `filter: brightness(1.05)`
- Active: `translateY(1px)`

### Button — secondary

```html
<a class="px-5 py-2.5 rounded-pill border border-divider text-text-primary
          hover:bg-white/5">Scopri di più</a>
```

### Button — ghost

```html
<button class="px-3 py-1.5 rounded-pill text-text-secondary
               hover:text-text-primary hover:bg-white/5">…</button>
```

### Card

```html
<article class="card p-6">
  <span class="w-2.5 h-2.5 rounded-full" style="background:#21E6C1" />
  <h3 class="font-display text-lg font-semibold text-text-primary mt-4">…</h3>
  <p class="text-sm text-text-secondary leading-relaxed mt-2">…</p>
</article>
```

La classe `.card` (in `globals.css`) include border, background, radius, shadow,
hover state. Non riscrivere.

### KPI card (metric tile)

```html
<div class="rounded-card border border-divider bg-bg-elevated/80 p-5 shadow-card">
  <div class="flex items-center justify-between">
    <span class="text-[10px] uppercase tracking-[0.16em] text-text-muted font-semibold">
      Battito
    </span>
    <span class="w-2.5 h-2.5 rounded-full" style="background:#FF5C7A" />
  </div>
  <div class="mt-3 font-display text-metric font-semibold tracking-tightest">72 bpm</div>
  <div class="text-xs text-text-muted mt-1">media</div>
</div>
```

### Input

```html
<input class="w-full px-4 py-3 rounded bg-bg-card border border-divider
              text-text-primary placeholder:text-text-muted
              focus:border-brand-aqua focus:bg-bg-elevated" />
```

Niente "focus ring" Material-style. Usiamo border-color change.

### Badge / chip

```html
<span class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-pill
             text-[11px] font-medium bg-success/15 text-success">
  <span class="w-1.5 h-1.5 rounded-full bg-success" /> Online
</span>
```

Background sempre `colore/15` (15% opacity) e testo a `colore` pieno.

### Section label

```html
<p class="text-[10px] uppercase tracking-[0.22em] text-brand-aqua font-semibold">
  Funzionalità
</p>
```

Usata come "kicker" sopra ogni titolo di sezione. Sempre `brand-aqua`.

---

## 10. Chart palette

I grafici della dashboard devono usare SOLO questa palette ordinata:

| Indice | Hex       | Token semantico        |
|--------|-----------|------------------------|
| 1      | `#1DA1FF` | Steps / Activity       |
| 2      | `#FF5C7A` | Heart rate             |
| 3      | `#FFB547` | Calories               |
| 4      | `#21E6C1` | Sleep / Recovery       |
| 5      | `#7CFF5B` | Achievement / Goal     |
| 6      | `#A78BFA` | Sleep REM (sub)        |
| 7      | `#38BDF8` | Info / Auxiliary       |
| 8      | `#31E981` | Resting HR / Success   |

Per stati sonno specificamente:
- Profondo: `#1DA1FF` (deep blue)
- REM: `#A78BFA` (lavender)
- Leggero: `#60A5FA` (sky)
- Sveglio: `#FF5C7A` (rose)

---

## 11. Motion

### Durate

```
--fm-duration-fast:   150ms   (hover, tap)
--fm-duration-normal: 220ms   (transizioni state)
--fm-duration-slow:   400ms   (modal, route, page transition)
--fm-duration-reveal: 700ms   (scroll reveal di sezione)
```

### Easing

```
--fm-ease-ios:  cubic-bezier(0.32, 0.72, 0, 1)    /* default UI, iOS feel */
--fm-ease-out:  cubic-bezier(0.16, 1, 0.3, 1)     /* reveal/scroll cinematici (expo-out) */
```

Default UI = `ios`. Per i reveal allo scroll e l'intro hero usare `out` (expo-out,
più "lungo" e premium). Mai usare `linear` su transizioni UI (ok solo per marquee).

### Motion library (scroll-driven & orchestrazione)

- **Libreria:** `motion` (Framer Motion) caricata via `LazyMotion`/`domAnimation`
  (lazy, fuori dal critical path). Usata SOLO per parallax (`useScroll`/`useTransform`),
  intro hero e page transition. I micro-effetti (hover, shimmer, marquee) restano **CSS**.
- **Reveal allo scroll:** gestito via `[data-reveal]` + un singolo IntersectionObserver
  globale (`RevealObserver`), così le sezioni restano server component (no client
  boundary per sezione). Vedi `globals.css`.
- **CWV:** l'elemento LCP (hero) non deve partire da `opacity:0`; usare intro
  transform-only o reveal istantaneo above-the-fold.

### Reduced motion

Tutti i CSS rispettano `prefers-reduced-motion: reduce` — le variabili di durata
vengono azzerate a 0ms (vedi `design-tokens.css`) e i `[data-reveal]` restano
visibili. I componenti `motion` usano `useReducedMotion()` per disattivare gli
spostamenti. Senza JS, tutto il contenuto è comunque visibile (no FOUC).

---

## 12. Accessibility (WCAG 2.2 AA target)

- **Contrast:** tutto il testo verificato AA o superiore (vedi sezione 3)
- **Focus ring:** outline 2px `brand-aqua` con offset 2px su tutti gli elementi
  interattivi (definito globalmente in `globals.css`)
- **Touch target:** minimo 44×44 px su mobile (regola HIG)
- **Reduced motion:** rispettato globalmente
- **Tab order:** logico — usare semantic HTML, niente `tabindex` arbitrari
- **Alt text:** obbligatorio su `<img>` (preferire SVG inline quando possibile)
- **Lang:** `<html lang="it">` impostato

---

## 13. Iconography

- Stile linea, NON filled, NON duotone
- Stroke width: 1.5–2 px
- Corner: rounded
- Size: 16, 20, 24 (sempre multipli pari)
- Fonte: usare set Heroicons o Lucide (entrambi accettabili)
- Mai mischiare set diversi sulla stessa pagina

---

## 14. Dark mode

Il sito è **dark-first e dark-only** per ora. La dashboard web ha light mode,
ma il sito marketing no — il dark mette in risalto il brand premium.

Se in futuro servirà light mode, partire da:
- BG: `#F7F8FA`
- Card: `#FFFFFF`
- Border: `#E2E8F0`
- Text primary: `#0F172A`
- Accent: rimangono gli stessi 4 brand color

---

## 15. Privacy & cookie

GA4 (`G-WLBXXFB21G`) è caricato con **Consent Mode v2**:
- Consenso `analytics_storage` di default `denied`
- Banner offre Accetta tutto / Rifiuta opzionali (no dark pattern, no pre-checked)
- Persistenza: `localStorage` chiave `fitmesh_cookie_consent`
- IP anonymization attiva, advertising signals disattivati

Vedi `app/cookies/page.tsx` e `components/CookieBanner.tsx` per implementazione.

---

## 16. Anti-pattern (cosa non fare mai)

- ❌ Usare colori fuori palette ("ah ma serviva un viola...")
- ❌ Aggiungere font ("Poppins solo per questo titolo")
- ❌ Glow neon eccessivi (tipo cyberpunk)
- ❌ Drop shadow nere pesanti
- ❌ Border radius arbitrari (`rounded-[17px]` no)
- ❌ Font size arbitrari fuori scale
- ❌ Spacing non multiplo di 4
- ❌ Animazioni che ignorano `prefers-reduced-motion`
- ❌ Cookie analytics caricati prima del consenso
- ❌ Testi su gradient senza verifica contrast
- ❌ Pre-checked checkbox di consenso (illegale in UE)

---

## 17. Roadmap allineamento

### Stato attuale

- ✅ Sito web `fitmesh.fit` → allineato a v1.0
- ⏳ Dashboard web (`backend-example/public/index.html`) → ancora su palette legacy (`#0f1419`/`#3d8bfd`). Migrare ai nuovi token in sprint dedicato
- ⏳ App Android (Kotlin) → ancora su palette legacy. Migrare colors.xml + drawable

### Migrazione dashboard

1. Sostituire `:root { --bg: #0f1419; ... }` con i nuovi token
2. Mappare `--accent: #3d8bfd` → `#1DA1FF` (brand-blue)
3. Mappare `--green: #34d399` → `#31E981`
4. Mappare `--purple: #a78bfa` → `#A78BFA` (resta uguale)
5. Aggiornare colori chart serie
6. Test contrast su entrambi i temi

### Migrazione Android

1. `app/src/main/res/values/colors.xml` → sostituire palette KPI
2. `themes.xml` → aggiornare `colorPrimary` a `#1DA1FF`
3. Logo → swap nelle drawable
4. Splash screen → background `#050816`
