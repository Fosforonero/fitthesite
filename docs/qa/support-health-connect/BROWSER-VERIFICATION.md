# Report Verifica Browser - Guida Android Health Connect (IT / EN)

**Data esecuzione**: 2026-10-10  
**Ambiente di test**: Next.js Production Build (`next start` porta 3009), Chromium headless via Playwright  
**URL verificati**:  
- `http://localhost:3009/en/support/health-connect` (English Guide)  
- `http://localhost:3009/it/support/health-connect` (Guida Italiana)  

---

## Matrice di Verifica Viewport

| Lingua | Viewport | Risoluzione | HTTP | Immagini Caricate | Overflow Orizzontale | HowTo JSON-LD | Artefatto Fullpage |
|---|---|---|---|---|---|---|---|
| EN | Desktop | 1280 x 800 | 200 OK | 8 / 8 (1080x2400) | Assente (false) | Conforme (8 step) | `en-desktop-1280.png` |
| EN | Mobile Standard | 375 x 667 | 200 OK | 8 / 8 (1080x2400) | Assente (false) | Conforme (8 step) | `en-mobile-375.png` |
| EN | Mobile Minimo | 320 x 568 | 200 OK | 8 / 8 (1080x2400) | Assente (false) | Conforme (8 step) | `en-mobile-320.png` |
| IT | Desktop | 1280 x 800 | 200 OK | 8 / 8 (1080x2400) | Assente (false) | Conforme (8 step) | `it-desktop-1280.png` |
| IT | Mobile Standard | 375 x 667 | 200 OK | 8 / 8 (1080x2400) | Assente (false) | Conforme (8 step) | `it-mobile-375.png` |
| IT | Mobile Minimo | 320 x 568 | 200 OK | 8 / 8 (1080x2400) | Assente (false) | Conforme (8 step) | `it-mobile-320.png` |

---

## Verifiche di Dettaglio

1. **Caricamento Immagini**:
   - EN: tutti gli 8 asset `en-01-` .. `en-08-` sono caricati con status 200, larghezza naturale 1080 px e altezza naturale 2400 px.
   - IT: tutti gli 8 asset `01-` .. `08-` sono caricati con status 200, larghezza naturale 1080 px e altezza naturale 2400 px.
2. **Corrispondenza Didascalie e Testi**:
   - Ciascuno degli 8 passi (#passo-1..8) presenta didascalia `figcaption` corrispondente all'immagine e alle etichette visibili.
   - Nessuna duplicazione dell'ambiente di test nei singoli passi.
3. **Assenza di Overflow Orizzontale**:
   - `document.documentElement.scrollWidth <= window.innerWidth` per tutti i viewport, inclusi 320 px (nessuna barra orizzontale o troncamento anomalo).
4. **Metadati e Social**:
   - `og:image` punta all'asset localizzato:
     - EN: `https://www.fitmesh.fit/support/health-connect/en-01-settings-health-connect.webp`
     - IT: `https://www.fitmesh.fit/support/health-connect/01-impostazioni-connessione-salute.webp`
   - Canonical e alternate hreflang configurati correttamente.
5. **Dati Strutturati JSON-LD**:
   - Schema `@type: "HowTo"` presente con 8 oggetti `HowToStep` e URL coerenti con `#passo-1` .. `#passo-8`.
   - Nessun campo `totalTime` arbitrario presente.
