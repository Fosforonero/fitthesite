import { cleanup, render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { fmtDateTime } from '@/lib/web-dashboard/format';
import { FORBIDDEN_SYNC_NAMES } from '@/lib/web-dashboard/regression-patterns';
import type { DashboardData, ScenarioKey, SourceRow, SourceTypeStatus } from '@/lib/web-dashboard/model';

import { SourcesLoading, SourcesScreen } from './SourcesScreen';
import { fill, sourcesCopy } from './SourcesScreen.copy';
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
const tile = (root: ParentNode, sourceId: string, type: string) =>
  q(root, `[data-source="${sourceId}"] [data-slot="source-type"][data-type="${type}"]`);

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
    expect(qa(container, 'h3').map((h) => h.textContent)).toEqual(props.data.sources.map((s) => s.ref.label));
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

  it('partial: i tipi non letti stanno nelle sorgenti, l intestazione non dichiara nessun esito', () => {
    const { container } = renderScreen(SourcesScreen, 'partial');
    const card = q(container, '[data-slot="received-status"]');
    expect(card.getAttribute('data-stale')).toBe('false');
    expect(q(card, '[data-slot="received-about"]').textContent).toBe(IT.status.scope);
    expect(card.querySelector('[data-slot="received-actions"]')).toBeNull();
    // la copertura parziale e nei riquadri dei tipi, non in un esito del sync
    expect(qa(container, '[data-slot="source-type"][data-slot-state="absent"]').length).toBeGreaterThan(0);
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

describe('sorgenti', () => {
  it('ok: una scheda per sorgente, un riquadro per tipo, un marcatore per ogni tipo vinto', () => {
    const { container, props } = renderScreen(SourcesScreen, 'ok');
    const cards = qa(container, '[data-slot="source-card"]');
    expect(cards.length).toBe(props.data.sources.length);

    props.data.sources.forEach((row, i) => {
      const card = cards[i];
      expect(card.getAttribute('data-source')).toBe(row.ref.id);
      expect(card.textContent).toContain(row.ref.label);
      expect(card.textContent).toContain(IT.sources.kind[row.ref.kind]);
      expect(card.textContent).toContain(IT.sources.via[row.ref.via]);
      expect(qa(card, '[data-slot="source-type"]').length).toBe(row.types.length);
      expect(qa(card, '[data-slot="winning-marker"]').length).toBe(row.types.filter((t) => t.winning).length);
      // un riquadro e' assente se e solo se la sorgente non lo ha letto (stato diverso da «ok»):
      // il telefono non fornisce frequenza cardiaca e sonno, e questo e' un dato vero, non un difetto
      expect(qa(card, '[data-slot-state="absent"]').length).toBe(row.types.filter((t) => t.status !== 'ok').length);
      expect(qa(card, '[data-slot-state="measured"][data-slot="source-type"]').length).toBe(row.types.filter((t) => t.status === 'ok').length);
    });
    // l'orologio legge tutto: nessun riquadro assente; il telefono ne ha esattamente due, con il motivo giusto
    expect(qa(cards[0], '[data-slot-state="absent"]').length).toBe(0);
    const phoneAbsent = qa(cards[1], '[data-slot-state="absent"]');
    expect(phoneAbsent.map((n) => n.getAttribute('data-type')).sort()).toEqual(['heart_rate', 'sleep']);
    phoneAbsent.forEach((n) => expect(n.getAttribute('data-absent-reason')).toBe('source_lacks_type'));
    expect(q(cards[0], '[data-slot="win-summary"]').textContent).toBe(fill(IT.sources.wins, { n: 9, total: 9 }));
    expect(q(cards[1], '[data-slot="win-summary"]').textContent).toBe(IT.sources.winsNone);
  });

  it('spiega in una frase che si usa una sola sorgente per tipo e che non si sommano', () => {
    const it = renderScreen(SourcesScreen, 'ok');
    expect(q(it.container, '[data-slot="one-source-note"]').textContent).toBe(IT.sources.intro);
    expect(IT.sources.intro).toMatch(/una sola sorgente/);
    it.unmount();
    const en = renderScreen(SourcesScreen, 'ok', { lc: 'en' });
    expect(q(en.container, '[data-slot="one-source-note"]').textContent).toBe(EN.sources.intro);
    expect(EN.sources.intro).toMatch(/one source/);
  });

  it('chi non vince dice chi vince al suo posto; chi vince non lo dice', () => {
    const { container } = renderScreen(SourcesScreen, 'ok');
    const phoneSteps = tile(container, 'phone', 'steps');
    expect(phoneSteps.getAttribute('data-winning')).toBe('false');
    expect(q(phoneSteps, '[data-slot="won-by"]').textContent).toBe(fill(IT.sources.wonBy, { label: 'Galaxy Watch' }));
    expect(phoneSteps.querySelector('[data-slot="winning-marker"]')).toBeNull();

    const watchSteps = tile(container, 'galaxy-watch', 'steps');
    expect(watchSteps.getAttribute('data-winning')).toBe('true');
    expect(watchSteps.querySelector('[data-slot="won-by"]')).toBeNull();
    expect(q(watchSteps, '[data-slot="winning-marker"]').textContent).toBe(IT.sources.winning);
  });

  it('partial: i tipi senza dato sono assenti (tratteggiati, con il motivo), non letti; gli allenamenti sono «nessun dato», non «non forniti»', () => {
    const { container, props } = renderScreen(SourcesScreen, 'partial');
    const cases: Array<[string, string, string]> = [
      ['workouts', 'no_data', props.copy.measure.noData],
      ['sleep_stages', 'not_provided', props.copy.measure.absent.source_lacks_type],
      ['hrv', 'not_provided', props.copy.measure.absent.source_lacks_type],
    ];
    for (const [type, status, label] of cases) {
      const t = tile(container, 'galaxy-watch', type);
      expect(t.getAttribute('data-status')).toBe(status);
      expect(t.getAttribute('data-slot-state')).toBe('absent');
      expect(t.className).toContain('border-dashed');
      expect(t.textContent).toContain(label);
      expect(t.textContent).not.toContain(IT.sources.statusOk);
      expect(t.textContent).not.toMatch(digits);
      expect(t.querySelector('[data-slot="winning-marker"]')).toBeNull();
    }
    // e quelli letti restano pieni e vincenti
    const steps = tile(container, 'galaxy-watch', 'steps');
    expect(steps.getAttribute('data-slot-state')).toBe('measured');
    expect(steps.className).not.toContain('border-dashed');
    expect(q(container, '[data-source="galaxy-watch"] [data-slot="win-summary"]').textContent).toBe(fill(IT.sources.wins, { n: 6, total: 9 }));
  });

  it('i tre stati di un tipo che il server conosce si distinguono e nessuno stampa una cifra', () => {
    const statuses: SourceTypeStatus['status'][] = ['ok', 'no_data', 'not_provided'];
    const { container, props } = renderWith('ok', (d) => {
      d.sources = [
        {
          ref: d.sources[0].ref,
          lastReceivedAt: d.sources[0].lastReceivedAt,
          types: statuses.map((status, i) => ({ type: (['steps', 'heart_rate', 'sleep'] as const)[i], status, winning: status === 'ok' })),
        },
      ];
    });
    const labels: Record<SourceTypeStatus['status'], string> = {
      ok: IT.sources.statusOk,
      no_data: props.copy.measure.noData,
      not_provided: props.copy.measure.absent.source_lacks_type,
    };
    const tiles = qa(container, '[data-slot="source-type"]');
    expect(tiles.map((t) => t.getAttribute('data-status'))).toEqual(statuses);
    tiles.forEach((t, i) => {
      expect(t.textContent).toContain(labels[statuses[i]]);
      expect(t.getAttribute('data-slot-state')).toBe(statuses[i] === 'ok' ? 'measured' : 'absent');
      if (statuses[i] !== 'ok') expect(t.textContent).not.toMatch(digits);
    });
    expect(tiles.filter((t) => t.className.includes('border-dashed')).length).toBe(2);
  });

  it('una sorgente senza tipi elencati e un riquadro assente, non «zero tipi»', () => {
    const { container, props } = renderWith('ok', (d) => {
      d.sources = [{ ...d.sources[0], types: [] }];
    });
    const none = q(container, '[data-slot="types-none"]');
    expect(none.getAttribute('data-slot-state')).toBe('absent');
    expect(none.textContent).toContain(IT.sources.typesNone);
    expect(none.textContent).toContain(props.copy.measure.noData);
    expect(none.textContent).not.toMatch(digits);
    expect(container.querySelector('[data-slot="source-type"]')).toBeNull();
    expect(container.querySelector('[data-slot="win-summary"]')).toBeNull();
  });

  it('una sorgente da cui non e mai arrivato nulla mostra un trattino e il motivo, non una data ne 0 minuti fa', () => {
    const { container, props } = renderWith('ok', (d) => {
      d.sources[1] = { ...d.sources[1], lastReceivedAt: null } as SourceRow;
    });
    const dd = q(container, '[data-source="phone"] [data-slot="source-last-received"]');
    expect(dd.getAttribute('data-slot-state')).toBe('absent');
    expect(dd.textContent).toContain(props.copy.measure.absent.not_synced_yet);
    expect(dd.textContent).not.toMatch(digits);
    // l'altra sorgente resta misurata
    expect(q(container, '[data-source="galaxy-watch"] [data-slot="source-last-received"]').getAttribute('data-slot-state')).toBe('measured');
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
    expect(container.querySelector('[data-slot="one-source-note"]')).toBeNull();
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
