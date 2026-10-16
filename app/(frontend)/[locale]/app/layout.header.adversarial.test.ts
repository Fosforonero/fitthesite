import { readFileSync } from 'node:fs';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

/**
 * Test avversario di guardia per i punti ciechi strutturali dell'header di /app.
 *
 * Colma le lacune rilevate in K-DASH F3 e K-CHIUSURA KC-04 (mutanti KC-M1 e KC-M2):
 * 1. Verifica che tutti e cinque gli elementi siano fisicamente racchiusi dentro il tag <header>.
 * 2. Verifica che il tag <nav> non contenga classi che ne nascondano la visualizzazione su schermi stretti (es. hidden sm:flex).
 * 3. Verifica che il form di logout contenga effettivamente un pulsante submit con testo accessibile.
 */
const layout = readFileSync(path.join(__dirname, 'layout.tsx'), 'utf8');

describe('layout.header.adversarial: guardia strutturale sui punti ciechi dell\'header', () => {
  it('tutti i link di navigazione e il form di logout sono racchiusi dentro il tag <header>', () => {
    const headerMatch = /<header\b[^>]*>([\s\S]*?)<\/header>/.exec(layout);
    expect(headerMatch).not.toBeNull();
    const headerContent = headerMatch![1];

    // Verifica che il logo e i 3 link della nav siano dentro l'header
    expect(headerContent).toContain('/app`');
    expect(headerContent).toContain('/app/devices`');
    expect(headerContent).toContain('/app/settings`');

    // Verifica che il form di logout sia dentro l'header
    expect(headerContent).toContain('/auth/logout`');
  });

  it('il tag <nav> non e nascosto su mobile (rifiuta mutante KC-M1 con hidden)', () => {
    const navMatch = /<nav\s+className="([^"]*)">/.exec(layout);
    expect(navMatch).not.toBeNull();
    const navClasses = navMatch![1];

    // Non deve contenere la classe hidden (che nasconderebbe la navigazione su schermi stretti)
    expect(navClasses.split(/\s+/)).not.toContain('hidden');
    expect(navClasses).toMatch(/\bflex\b/);
    expect(navClasses).toMatch(/\bflex-wrap\b/);
  });

  it('il form di logout contiene un bottone submit con etichetta (rifiuta mutante KC-M2 senza bottone)', () => {
    const formMatch = /<form\s+action=\{`\/\$\{lc\}\/auth\/logout`\}\s+method="post">([\s\S]*?)<\/form>/.exec(layout);
    expect(formMatch).not.toBeNull();
    const formContent = formMatch![1];

    // Il form deve contenere un button type="submit"
    const buttonMatch = /<button\b([^>]*)>([\s\S]*?)<\/button>/.exec(formContent);
    expect(buttonMatch).not.toBeNull();
    const buttonAttrs = buttonMatch![1];
    const buttonInner = buttonMatch![2].trim();

    expect(buttonAttrs).toMatch(/\btype="submit"/);
    // Il bottone non deve essere vuoto: deve mostrare il testo del dizionario con fallback
    expect(buttonInner).toMatch(/t\.app\?\.nav\?\.logout|\bEsci\b/);
  });
});
