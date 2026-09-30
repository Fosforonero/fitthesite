import { cleanup, render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { fmtDateTime } from '@/lib/web-dashboard/format';
import { FORBIDDEN_SOURCE_LABELS, FORBIDDEN_SYNC_NAMES } from '@/lib/web-dashboard/regression-patterns';
import { sourcesFromRows } from '@/lib/web-dashboard/from-rows';
import type { DashboardData, ScenarioKey, SourceRow } from '@/lib/web-dashboard/model';

import { SourcesLoading, SourcesScreen } from './SourcesScreen';
import { sourcesCopy } from './SourcesScreen.copy';
import { forbiddenCopyIn, renderScreen, screenProps } from './test-utils';

const SCENARIOS: ScenarioKey[] = ['ok', 'partial', 'zeros', 'stale', 'empty'];
const IT = sourcesCopy('it');
const EN = sourcesCopy('en');

/** Schermata con i dati di uno scenario, ritoccati da `mutate` (copia profonda: il generatore non si tocca). */
function renderWith(scenario: ScenarioKey, mutate: (d: DashboardData) => void, opts: { lc?: string } = {}) {
  const props = screenProps(scenario, opts);
  const data: DashboardData = JSON.parse(JSON.stringify(props.data));
  mutate(data);
  return { ...render(<SourcesScreen {...props} data={data} />), props: { ...props, data } };
}

const digits = /\d/;
const q = (root: ParentNode, sel: string) => root.querySelector(sel) as HTMLElement;
const qa = (root: ParentNode, sel: string) => [...root.querySelectorAll(sel)] as HTMLElement[];

describe('SourcesScreen: rende ogni scenario in it e en', () => {
  for (const lc of ['it', 'en']) {
    for (const s of SCENARIOS) {
      it(`${s} / ${lc}: nessun errore, nessuna copy vietata, h2 e mai h1, nessun controllo di sync`, () => {
        const { container } = renderScreen(SourcesScreen, s, { lc });
        expect(container.firstElementChild).not.toBeNull();
        expect(forbiddenCopyIn(container)).toEqual([]);
        expect(container.querySelector('h1')).toBeNull();
        // ultimo dato ricevuto e sorgenti: nessuna cronologia delle ricezioni
        expect(container.querySelectorAll('h2').length).toBe(2);
        // il web non puo' avviare un sync: nessun pulsante, modulo o campo che lo finga
        expect(container.querySelectorAll('button, form, input, select, textarea').length).toBe(0);
        for (const a of qa(container, 'a')) expect(a.textContent).not.toMatch(/sincronizza ora|sync now/i);
        // ogni orario e' un <time> con la sua data leggibile dalle macchine
        for (const t of qa(container, 'time')) expect(t.getAttribute('datetime') ?? '').not.toBe('');
      });
    }
  }

  it("una lingua senza copy propria (de) usa l'inglese e il suo prefisso nei link", () => {
    const { container } = renderScreen(SourcesScreen, 'empty', { lc: 'de' });
    expect(container.textContent).toContain(EN.sources.empty.title);
    expect(container.querySelector('a[href="/de/app/devices"]')).not.toBeNull();
  });

  it('lo scheletro si rende e non parla (aria-hidden, nessun testo)', () => {
    const { container } = render(<SourcesLoading />);
    expect(container.querySelectorAll('[aria-hidden="true"]').length).toBeGreaterThanOrEqual(5);
    expect(container.textContent).toBe('');
  });

  it('la gerarchia dei titoli: h2 per le sezioni, h3 per ogni sorgente', () => {
    const { container, props } = renderScreen(SourcesScreen, 'ok');
    expect(qa(container, 'h3').map((h) => h.textContent)).toEqual(props.data.sources.map((s) => props.copy.sourceNames[s.ref.id]));
  });
});

describe('ultimo dato ricevuto (intestazione)', () => {
  it('ok: eta grande e data esatta, nessun esito di sync, nessuna azione richiesta', () => {
    const { container, props } = renderScreen(SourcesScreen, 'ok');
    const card = q(container, '[data-slot="received-status"]');
    expect(card.getAttribute('data-stale')).toBe('false');
    expect(q(container, '[data-slot="received-status"] h2').textContent).toBe(IT.status.title);

    const age = q(card, '[data-slot="received-age"]');
    expect(age.getAttribute('data-slot-state')).toBe('measured');
    expect(age.textContent).toContain('12 minuti fa');
    expect(age.textContent).toContain(fmtDateTime(props.data.receipt.lastReceivedAt as string, 'it'));

    // dice cosa sa il server: quando e' arrivato un dato, non come e' andato ogni sync
    expect(q(card, '[data-slot="received-about"]').textContent).toBe(IT.status.scope);
    expect(card.querySelector('[data-slot="received-actions"]')).toBeNull();
    expect(card.querySelector('[data-slot="stale-note"]')).toBeNull();
    // il web non sincronizza: e' scritto, non nascosto
    expect(q(card, '[data-slot="web-note"]').textContent).toContain(IT.status.webNote);
  });

  it('partial: l intestazione non dichiara nessun esito e non elenca tipi di dato per sorgente', () => {
    const { container } = renderScreen(SourcesScreen, 'partial');
    const card = q(container, '[data-slot="received-status"]');
    expect(card.getAttribute('data-stale')).toBe('false');
    expect(q(card, '[data-slot="received-about"]').textContent).toBe(IT.status.scope);
    expect(card.querySelector('[data-slot="received-actions"]')).toBeNull();
    expect(container.querySelector('[data-slot="source-type"]')).toBeNull();
  });

  it('stale: l eta e il fatto principale e dice che il dopo non e arrivato, non e zero', () => {
    const { container, props } = renderScreen(SourcesScreen, 'stale');
    const card = q(container, '[data-slot="received-status"]');
    expect(card.getAttribute('data-stale')).toBe('true');

    const age = q(card, '[data-slot="received-age"]');
    expect(age.getAttribute('data-slot-state')).toBe('stale');
    const big = q(age, 'p');
    expect(big.textContent).toBe('3 giorni fa');
    expect(big.className).toContain('text-warning');
    expect(big.textContent).not.toMatch(/\b0\b/);
    expect(q(age, '[data-slot="stale-note"]').textContent).toBe(IT.status.staleNote);
    expect(age.textContent).toContain(fmtDateTime(props.data.receipt.lastReceivedAt as string, 'it'));

    expect(qa(card, '[data-slot="received-actions"] li').map((li) => li.getAttribute('data-action'))).toEqual(['open_sync']);
  });

  it('empty: nessun dato e mai arrivato, quindi nessuna data e nessun 0: trattino e motivo', () => {
    const { container, props } = renderScreen(SourcesScreen, 'empty');
    const card = q(container, '[data-slot="received-status"]');

    const age = q(card, '[data-slot="received-age"]');
    expect(age.getAttribute('data-slot-state')).toBe('absent');
    expect(age.getAttribute('data-absent-reason')).toBe('no_data_received');
    expect(age.textContent).toContain(props.copy.measure.absent.no_data_received);
    expect(age.textContent).not.toMatch(digits);
    expect(age.querySelector('svg')).not.toBeNull(); // AbsentMark
    expect(q(card, '[data-slot="received-about"]').textContent).toBe(IT.status.never);
    expect(qa(card, '[data-slot="received-actions"] li').map((li) => li.getAttribute('data-action'))).toEqual(['connect_device']);
  });

  it('mai ricevuto: il server conosce le sorgenti solo dalle righe, quindi non esiste un ramo «sorgenti collegate ma nessun dato»', () => {
    const ok = screenProps('ok').data;
    const { container, props } = renderWith('empty', (d) => {
      d.sources = ok.sources;
    });
    const age = q(container, '[data-slot="received-age"]');
    // anche con un elenco di sorgenti in mano, senza una sola ricezione il motivo e uno solo
    expect(age.getAttribute('data-absent-reason')).toBe('no_data_received');
    expect(age.textContent).toContain(props.copy.measure.absent.no_data_received);
    expect(q(container, '[data-slot="received-about"]').textContent).toBe(IT.status.never);
    expect(q(container, '[data-slot="received-about"]').textContent).not.toMatch(/collegat/);
    expect(Object.keys(IT.status).filter((k) => /never/i.test(k))).toEqual(['never']);
    expect(Object.keys(EN.status).filter((k) => /never/i.test(k))).toEqual(['never']);
    expect(qa(container, '[data-slot="received-actions"] li').map((li) => li.getAttribute('data-action'))).toEqual(['open_sync']);
  });

  it('in inglese le stesse frasi, senza esito di sync', () => {
    const { container } = renderScreen(SourcesScreen, 'stale', { lc: 'en' });
    expect(q(container, '[data-slot="received-status"] h2').textContent).toBe(EN.status.title);
    expect(q(container, '[data-slot="stale-note"]').textContent).toBe(EN.status.staleNote);
    expect(q(container, '[data-slot="received-age"] p').textContent).toBe('3 days ago');
  });

  it('senza eta dichiarata la calcola dalla data; senza data ne eta resta un trattino, mai 0 minuti fa', () => {
    const a = renderWith('ok', (d) => {
      d.receipt = { ...d.receipt, ageMinutes: null };
    });
    expect(q(a.container, '[data-slot="received-age"]').textContent).toContain('12 minuti fa');
    a.unmount();

    const b = renderWith('ok', (d) => {
      d.receipt = { ...d.receipt, ageMinutes: null, lastReceivedAt: null };
    });
    const age = q(b.container, '[data-slot="received-age"]');
    expect(age.getAttribute('data-slot-state')).toBe('absent');
    expect(age.textContent).not.toMatch(/minut|\d/);
  });

  it('oltre 48 ore e vecchio, sotto no: la soglia e quella dell app', () => {
    const at = (minutes: number) =>
      renderWith('ok', (d) => {
        d.receipt = { ...d.receipt, ageMinutes: minutes };
      });
    const fresh = at(47 * 60);
    expect(q(fresh.container, '[data-slot="received-status"]').getAttribute('data-stale')).toBe('false');
    expect(fresh.container.querySelector('[data-slot="stale-note"]')).toBeNull();
    fresh.unmount();
    const old = at(49 * 60);
    expect(q(old.container, '[data-slot="received-status"]').getAttribute('data-stale')).toBe('true');
    expect(q(old.container, '[data-slot="stale-note"]')).not.toBeNull();
  });
});

describe('sorgenti: solo il nome del vocabolario chiuso e l ultimo dato ricevuto', () => {
  it('ok: una scheda per sorgente, col nome dal vocabolario e nient altro che l ultimo dato ricevuto', () => {
    const { container, props } = renderScreen(SourcesScreen, 'ok');
    const cards = qa(container, '[data-slot="source-card"]');
    expect(cards.length).toBe(props.data.sources.length);
    expect(cards.map((c) => q(c, 'h3').textContent)).toEqual(['Health Connect', 'Anello Bluetooth']);
    props.data.sources.forEach((row, i) => {
      expect(cards[i].getAttribute('data-source')).toBe(row.ref.id);
      expect(qa(cards[i], '[data-slot="source-last-received"]')).toHaveLength(1);
      // il genere del dispositivo non e un attributo del DOM
      expect(Object.keys(Object.fromEntries([...cards[i].attributes].map((a) => [a.name, 1]))).filter((n) => /kind|via|win/.test(n))).toEqual([]);
    });
  });

  it('nessun elenco di tipi di dato per sorgente, nessuna sorgente scelta per tipo, nessun genere di dispositivo, in nessuno scenario e lingua', () => {
    for (const sc of SCENARIOS) {
      for (const lc of ['it', 'en'] as const) {
        const { container } = renderScreen(SourcesScreen, sc, { lc });
        expect(container.querySelector('[data-slot="source-type"], [data-slot="types-none"]'), `${sc}/${lc}`).toBeNull();
        const hits = FORBIDDEN_SOURCE_LABELS.filter(({ re }) => re.test(container.innerHTML) || re.test(container.textContent ?? '')).map(({ name }) => name);
        expect(hits, `${sc}/${lc}`).toEqual([]);
        expect(container.textContent ?? '', `${sc}/${lc}`).not.toMatch(/Tipi di dato|Data types/i);
        cleanup();
      }
    }
  });

  it('spiega in una frase cosa si vede, senza promettere una fonte scelta', () => {
    const it = renderScreen(SourcesScreen, 'ok');
    expect(q(it.container, '[data-slot="sources-intro"]').textContent).toBe(IT.sources.intro);
    expect(FORBIDDEN_SOURCE_LABELS.filter(({ re }) => re.test(IT.sources.intro)).map(({ name }) => name)).toEqual([]);
    it.unmount();
    const en = renderScreen(SourcesScreen, 'ok', { lc: 'en' });
    expect(q(en.container, '[data-slot="sources-intro"]').textContent).toBe(EN.sources.intro);
    expect(FORBIDDEN_SOURCE_LABELS.filter(({ re }) => re.test(EN.sources.intro)).map(({ name }) => name)).toEqual([]);
  });

  it('un nome proprio nel campo di fonte NON diventa il nome di una sorgente: righe vere, derivazione vera, schermata vera', () => {
    const rows = [
      { source: 'Mario Rossi', received_at: '2026-09-24T07:28:00.000Z' },
      { source: 'iPhone di Anna', received_at: '2026-09-24T07:00:00.000Z' },
      { source: 'health_connect', received_at: '2026-09-24T06:00:00.000Z' },
    ];
    for (const lc of ['it', 'en'] as const) {
      const { container } = renderWith('ok', (d) => {
        d.sources = sourcesFromRows(rows);
      }, { lc });
      const names = qa(container, 'h3').map((h) => h.textContent);
      expect(names).toEqual(lc === 'it' ? ['Health Connect', 'Un’altra sorgente'] : ['Health Connect', 'Another source']);
      expect(container.textContent).not.toMatch(/Mario|Rossi|Anna/);
      cleanup();
    }
  });

  it('una sorgente per ogni valore del vocabolario ha un nome scritto nella copy: nessun id viene stampato al posto del nome', () => {
    const rows = ['health_connect', 'healthkit', 'apple_health', 'colmi_ble', 'strava_oauth', 'oura_oauth', 'suunto_oauth', 'sconosciuta'].map((source) => ({
      source,
      received_at: '2026-09-24T07:00:00.000Z',
    }));
    const { container } = renderWith('ok', (d) => {
      d.sources = sourcesFromRows(rows);
    });
    const names = qa(container, 'h3').map((h) => h.textContent);
    expect(names).toEqual(['Health Connect', 'Apple Salute', 'Anello Bluetooth', 'Strava', 'Oura', 'Suunto', 'Un’altra sorgente']);
    expect(container.textContent).not.toMatch(/colmi|_oauth|apple_health|healthkit/);
  });

  it('una sorgente da cui non e mai arrivato nulla mostra un trattino e il motivo, non una data ne 0 minuti fa', () => {
    const { container, props } = renderWith('ok', (d) => {
      d.sources[1] = { ...d.sources[1], lastReceivedAt: null } as SourceRow;
    });
    const dd = q(container, '[data-source="ring"] [data-slot="source-last-received"]');
    expect(dd.getAttribute('data-slot-state')).toBe('absent');
    expect(dd.textContent).toContain(props.copy.measure.absent.not_synced_yet);
    expect(dd.textContent).not.toMatch(digits);
    // l'altra sorgente resta misurata
    expect(q(container, '[data-source="health_connect"] [data-slot="source-last-received"]').getAttribute('data-slot-state')).toBe('measured');
  });

  it('stale: l ultimo dato ricevuto da ogni sorgente e vecchio, con la sua eta', () => {
    const { container } = renderScreen(SourcesScreen, 'stale');
    for (const dd of qa(container, '[data-slot="source-last-received"]')) {
      expect(dd.getAttribute('data-slot-state')).toBe('stale');
      expect(dd.textContent).toMatch(/3 gg fa/);
    }
  });

  it('empty: spiegazione amichevole e link vero ai dispositivi, nessuna scheda e nessuna cifra', () => {
    const { container } = renderScreen(SourcesScreen, 'empty');
    expect(container.querySelectorAll('[data-slot="source-card"]').length).toBe(0);
    const empty = q(container, '[data-slot="sources-empty"]');
    expect(empty.getAttribute('data-slot-state')).toBe('absent');
    expect(empty.getAttribute('data-absent-reason')).toBe('no_data_received');
    expect(empty.textContent).toContain(IT.sources.empty.title);
    for (const step of IT.sources.empty.steps) expect(empty.textContent).toContain(step);
    expect(empty.textContent).not.toMatch(digits);
    const link = q(empty, 'a[href="/it/app/devices"]');
    expect(link.textContent).toContain(IT.sources.empty.link);
    expect(link.className).toContain('min-h-[44px]');
    expect(container.querySelector('[data-slot="sources-intro"]')).toBeNull();
  });
});

describe('nessuna cronologia delle ricezioni: solo l ultimo dato ricevuto, per sorgente', () => {
  // Il server sovrascrive received_at a ogni invio (upsert per utente, dispositivo, sorgente e giorno)
  // e sync_events e vuota e non e letta dalla dashboard: un elenco di ricezioni passate sarebbe inventato.
  it('il modello non ha un elenco di ricezioni e la schermata non ha ne titolo ne voci', () => {
    for (const s of SCENARIOS) {
      for (const lc of ['it', 'en'] as const) {
        const { container, props } = renderScreen(SourcesScreen, s, { lc });
        expect(Object.keys(props.data)).not.toContain('receipts');
        expect(container.querySelector('[data-slot="receipt-history"], [data-slot="receipt-entry"], [data-slot="receipts-gap"], [data-slot="receipts-empty"]')).toBeNull();
        const text = container.textContent ?? '';
        expect(FORBIDDEN_SYNC_NAMES.filter(({ re }) => re.test(text)).map(({ name }) => name)).toEqual([]);
        cleanup();
      }
    }
  });

  it('ok: gli unici orari sono l ultimo dato ricevuto in testa e uno per sorgente, mai una lista', () => {
    const { container, props } = renderScreen(SourcesScreen, 'ok');
    const times = qa(container, 'time');
    // uno nell'intestazione, uno per ogni sorgente
    expect(times.length).toBe(1 + props.data.sources.length);
    for (const row of props.data.sources) {
      const card = q(container, `[data-source="${row.ref.id}"]`);
      const own = qa(card, 'time');
      expect(own).toHaveLength(1);
      expect(own[0].getAttribute('datetime')).toBe(row.lastReceivedAt);
      expect(own[0].textContent).toBe(fmtDateTime(row.lastReceivedAt as string, 'it'));
    }
  });

  it('stale: l ultimo dato ricevuto resta uno solo e dice che dopo non e arrivato altro', () => {
    const { container, props } = renderScreen(SourcesScreen, 'stale');
    expect(qa(container, 'time').length).toBe(1 + props.data.sources.length);
    expect(q(container, '[data-slot="stale-note"]').textContent).toBe(IT.status.staleNote);
  });

  it('la sorgente mai vista non ha un orario: trattino e motivo, non una data inventata', () => {
    const { container } = renderWith('ok', (d) => {
      d.sources[1].lastReceivedAt = null;
    });
    const card = q(container, `[data-source="${screenProps('ok').data.sources[1].ref.id}"]`);
    expect(qa(card, 'time')).toHaveLength(0);
    expect(q(card, '[data-slot="source-last-received"]').getAttribute('data-slot-state')).toBe('absent');
  });
});
