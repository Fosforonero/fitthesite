# fitmesh.fit

Sito ufficiale di FitMesh — sincronizzazione dati smartwatch ↔ dashboard personale.

## Stack

- Next.js 15 (App Router)
- TypeScript
- TailwindCSS 3
- Deploy: Vercel (autoconnesso a `main`)

## Sviluppo locale

```bash
npm install
npm run dev    # http://localhost:3000
```

## Pagine

- `/` — landing
- `/privacy` — Privacy Policy (linkata dal Play Store)
- `/support` — FAQ e contatti

## Email forwarding (Namecheap)

- `support@fitmesh.fit` → mat.pizzi@gmail.com
- `privacy@fitmesh.fit` → mat.pizzi@gmail.com
- `hello@fitmesh.fit` → mat.pizzi@gmail.com

## Deploy

Ogni push su `main` triggera deploy automatico Vercel.
