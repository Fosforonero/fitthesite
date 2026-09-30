/**
 * Ritorno con la cache del browser, parte client: il tasto indietro dopo il logout.
 *
 * La bfcache (back/forward cache) non rifa' la richiesta: rimette in vita la pagina com'era, DOM
 * compreso. `Cache-Control: no-store` la esclude in alcuni browser ma non in tutti (Safari la usa lo
 * stesso, Chrome la sta estendendo alle pagine no-store), quindi dopo il logout il tasto indietro puo'
 * rimostrare i dati sanitari della sessione chiusa senza passare dal server. L'unico segnale che la
 * pagina riceve e' `pageshow` con `persisted === true`.
 *
 * BackForwardGuard, su quel segnale: toglie SUBITO il contenuto (segnaposto neutro, senza testo) e
 * ricarica, cosi' il server rifa' sessione e verdetto. Su un `pageshow` normale non fa niente.
 *
 * Cosa NON si prova qui (serve un browser vero): che il browser metta davvero la pagina in bfcache,
 * che `pageshow` arrivi prima del primo disegno (altrimenti il contenuto vecchio puo' apparire per un
 * fotogramma), e che il reload dopo il logout porti al login.
 */
import { readFileSync } from 'node:fs';
import path from 'node:path';

import { act, cleanup, render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { BackForwardGuard } from './BackForwardGuard';

const SENTINELLA = 'passi-48213-sentinella-alfa-7q2';
const RADICE = path.resolve(__dirname, '..');

let ricarica: ReturnType<typeof vi.fn>;
/** Cosa c'era nel DOM nel momento esatto in cui e' partito il reload. */
let domAlReload: string[];
const locationOriginale = window.location;

beforeEach(() => {
  domAlReload = [];
  ricarica = vi.fn(() => {
    domAlReload.push(document.body.innerHTML);
  });
  Object.defineProperty(window, 'location', {
    configurable: true,
    value: { ...locationOriginale, reload: ricarica },
  });
});
afterEach(() => {
  cleanup();
  Object.defineProperty(window, 'location', { configurable: true, value: locationOriginale });
  vi.restoreAllMocks();
});

function pageshow(persisted: boolean) {
  const e = new PageTransitionEvent('pageshow', { persisted });
  act(() => {
    window.dispatchEvent(e);
  });
}

const Dati = () => (
  <section data-dati="sanitari" title={`hrv ${SENTINELLA}`}>
    Passi: {SENTINELLA}
  </section>
);

describe('bfcache, la lacuna: senza guardia il contenuto sopravvive al ritorno', () => {
  it('controprova: una pagina senza guardia, rimessa in vita dalla bfcache, mostra ancora i dati e non ricarica', () => {
    render(<Dati />);
    pageshow(true);
    expect(document.body.innerHTML).toContain(SENTINELLA);
    expect(ricarica).not.toHaveBeenCalled();
  });

  it('jsdom costruisce davvero l evento con persisted', () => {
    expect(new PageTransitionEvent('pageshow', { persisted: true }).persisted).toBe(true);
  });
});

describe('bfcache: BackForwardGuard', () => {
  it('pageshow persistito: il contenuto sparisce PRIMA del reload, e il reload parte una volta', () => {
    render(
      <BackForwardGuard>
        <Dati />
      </BackForwardGuard>,
    );
    expect(document.body.innerHTML).toContain(SENTINELLA);

    pageshow(true);

    expect(ricarica).toHaveBeenCalledTimes(1);
    expect(domAlReload).toHaveLength(1);
    expect(domAlReload[0]).not.toContain(SENTINELLA);
    expect(domAlReload[0]).toContain('data-bfcache="nascosto"');
    // e resta sparito anche dopo
    expect(document.body.innerHTML).not.toContain(SENTINELLA);
    expect(document.querySelector('[data-dati]')).toBeNull();
  });

  it('il segnaposto e neutro: nessun testo, occupato per le tecnologie assistive', () => {
    render(
      <BackForwardGuard>
        <Dati />
      </BackForwardGuard>,
    );
    pageshow(true);
    const segnaposto = document.querySelector('[data-bfcache="nascosto"]');
    expect(segnaposto).not.toBeNull();
    expect(segnaposto?.textContent).toBe('');
    expect(segnaposto?.getAttribute('aria-busy')).toBe('true');
  });

  it('pageshow NON persistito (primo caricamento, reload normale): nessun effetto', () => {
    render(
      <BackForwardGuard>
        <Dati />
      </BackForwardGuard>,
    );
    pageshow(false);
    pageshow(false);
    expect(ricarica).not.toHaveBeenCalled();
    expect(document.body.innerHTML).toContain(SENTINELLA);
  });

  it('due ritorni di fila: un solo reload', () => {
    render(
      <BackForwardGuard>
        <Dati />
      </BackForwardGuard>,
    );
    pageshow(true);
    pageshow(true);
    expect(ricarica).toHaveBeenCalledTimes(1);
  });

  it('smontata, toglie il listener: un pageshow dopo non fa niente', () => {
    const aggiunti = vi.spyOn(window, 'addEventListener');
    const tolti = vi.spyOn(window, 'removeEventListener');
    const { unmount } = render(
      <BackForwardGuard>
        <Dati />
      </BackForwardGuard>,
    );
    const suPageshow = aggiunti.mock.calls.filter(([tipo]) => tipo === 'pageshow');
    expect(suPageshow).toHaveLength(1);
    unmount();
    expect(tolti.mock.calls.filter(([tipo]) => tipo === 'pageshow').map(([, f]) => f)).toContain(suPageshow[0][1]);
    pageshow(true);
    expect(ricarica).not.toHaveBeenCalled();
  });
});

// ── Cablaggio: la guardia avvolge davvero le pagine con dati ─────────────────────────────────────

/** Il codice senza commenti: un commento che nomina la guardia non la monta. */
const codice = (rel: string) =>
  readFileSync(path.join(RADICE, rel), 'utf8')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\{\s*\/\*[\s\S]*?\*\/\s*\}/g, '')
    .replace(/(^|[^:])\/\/.*$/gm, '$1');

describe('bfcache: la guardia e montata dove si rendono i dati', () => {
  it.each([
    // la dashboard reale e le altre pagine personali passano tutte da questo layout
    ['app/(frontend)/[locale]/app/layout.tsx', /<BackForwardGuard>\s*\{isFounder[\s\S]*?\{children\}\s*<\/BackForwardGuard>/],
    // il prototipo: login, paywall, verifica e schermate passano tutti da questo layout
    ['app/(frontend)/[locale]/dashboard-preview/layout.tsx', /<BackForwardGuard>\s*\{children\}\s*<\/BackForwardGuard>/],
  ])('%s avvolge i figli nella guardia', (rel, forma) => {
    const c = codice(rel);
    expect(c).toMatch(/import\s*\{\s*BackForwardGuard\s*\}\s*from\s*'@\/components\/BackForwardGuard'/);
    expect(c).toMatch(forma);
  });

  it('la guardia e un componente client', () => {
    expect(readFileSync(path.join(__dirname, 'BackForwardGuard.tsx'), 'utf8').trimStart()).toMatch(/^'use client';/);
  });
});
