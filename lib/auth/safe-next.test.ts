import { describe, expect, it } from 'vitest';

import { safeNextPath } from './safe-next';

const BASE = 'https://www.fitmesh.fit/it/auth/callback?code=a';
const ORIGINE = new URL(BASE).origin;

/** Dove finisce davvero il redirect: il percorso restituito viene riletto da `new URL(percorso, base)`. */
function destinazione(next: string | null, locale = 'it'): URL {
  return new URL(safeNextPath(next, locale, BASE), BASE);
}

describe('safeNextPath: il redirect non esce mai dal sito', () => {
  it('un percorso interno legittimo resta invariato, query compresa', () => {
    expect(safeNextPath('/it/app/dashboard?x=1', 'it', BASE)).toBe('/it/app/dashboard?x=1');
    expect(safeNextPath('/en/app', 'en', BASE)).toBe('/en/app');
  });

  it('assente o vuoto: la propria area nel locale', () => {
    expect(safeNextPath(null, 'de', BASE)).toBe('/de/app');
    expect(safeNextPath('', 'de', BASE)).toBe('/de/app');
  });

  it('la normalizzazione dei dot-segment che ricompone un doppio slash iniziale ricade sulla propria area', () => {
    for (const next of ['/.//x.invalid', '/..//x.invalid', '/%2e//x.invalid', '/a/..//x.invalid', '/.///x.invalid']) {
      expect(safeNextPath(next, 'it', BASE), next).toBe('/it/app');
    }
  });

  it('un percorso che esce dalla radice con .. resta dentro il sito', () => {
    expect(destinazione('/it/app/../../../x').origin).toBe(ORIGINE);
  });

  // Prova per enumerazione (non a campione): ogni combinazione di 1-4 pezzi scelti fra i vettori noti,
  // con e senza `/` iniziale. Nessuna deve portare a un altro host, a un altro schema o a un percorso
  // che il parser riletto da `new URL(percorso, base)` interpreti come host.
  it('nessuna combinazione di vettori noti (1-4 pezzi) porta fuori dal sito', () => {
    const pezzi = ['/', '\\', '.', '..', '%2f', '%5c', '%09', '%0a', 'a', '?', '#', '@', ':', 'x.invalid', '//'];
    const casi: string[] = [];
    const costruisci = (prefisso: string, profondita: number) => {
      if (profondita === 0) return;
      for (const p of pezzi) {
        const s = prefisso + p;
        casi.push(s, `/${s}`);
        costruisci(s, profondita - 1);
      }
    };
    costruisci('', 4);
    expect(casi.length).toBeGreaterThan(100_000);
    for (const next of casi) {
      const percorso = safeNextPath(safeDecode(next), 'it', BASE);
      const d = new URL(percorso, BASE);
      if (d.origin !== ORIGINE || percorso.startsWith('//') || percorso.startsWith('/\\')) {
        throw new Error(`esce dal sito: ${JSON.stringify(next)} -> ${percorso} (${d.origin})`);
      }
    }
  });
});

/** `searchParams.get` decodifica una volta: si riproduce, senza far fallire la prova su `%` isolati. */
function safeDecode(s: string): string {
  try {
    return decodeURIComponent(s);
  } catch {
    return s;
  }
}
