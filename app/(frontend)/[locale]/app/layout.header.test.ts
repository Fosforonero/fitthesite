import { readFileSync } from 'node:fs';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

/**
 * Header di /app a 320-390 px (D2-header). Test STRUTTURALE e quindi debole: prova la classe, non il risultato.
 * Il risultato (nessun elemento essenziale fuori viewport, touch, Tab, focus) lo prova il browser; questo test
 * impedisce solo di togliere in silenzio il wrap che lo rende possibile. globals.css taglia con overflow-x: clip
 * senza barra di scorrimento: un header che sfora NON si vede nell'overflow del documento.
 */
const layout = readFileSync(path.join(__dirname, 'layout.tsx'), 'utf8');

describe('layout dell\'area riservata: l\'header non sfora a 320 px', () => {
  it('il contenitore dell\'header e la nav vanno a capo (flex-wrap)', () => {
    const contenitore = /<div className="([^"]*max-w-6xl[^"]*)">/.exec(layout);
    const nav = /<nav className="([^"]*)">/.exec(layout);
    expect(contenitore?.[1]).toMatch(/\bflex-wrap\b/);
    expect(nav?.[1]).toMatch(/\bflex-wrap\b/);
  });

  it('i cinque elementi essenziali restano nell\'ordine del DOM: logo, Dashboard, Dispositivi, Impostazioni, Esci', () => {
    const ordine = ['/app`}', '/app/devices`}', '/app/settings`}', '/auth/logout`}'].map((s) => layout.indexOf(s));
    expect(ordine.every((i) => i > 0)).toBe(true);
    expect([...ordine].sort((a, b) => a - b)).toEqual(ordine);
  });
});
