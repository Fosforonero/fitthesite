import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { fmtDateTime } from '@/lib/web-dashboard/format';
import type { DashboardData, ScenarioKey, SourceRow, SourceTypeStatus, SyncStatus } from '@/lib/web-dashboard/model';

import { SourcesLoading, SourcesScreen } from './SourcesScreen';
import { fill, sourcesCopy } from './SourcesScreen.copy';
import { forbiddenCopyIn, measureStates, renderScreen, screenProps } from './test-utils';

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
        // stato del sync, sorgenti, cronologia
        expect(container.querySelectorAll('h2').length).toBe(3);
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

describe('stato del sync (intestazione)', () => {
  it('ok: eta grande e data esatta, nessun problema, nessuna azione richiesta', () => {
    const { container, props } = renderScreen(SourcesScreen, 'ok');
    const card = q(container, '[data-slot="sync-status"]');
    expect(card.getAttribute('data-sync-state')).toBe('ok');
    expect(card.getAttribute('data-stale')).toBe('false');
    expect(q(card, '[data-slot="sync-state-label"]').textContent).toBe(props.copy.sync.ok);

    const age = q(card, '[data-slot="sync-age"]');
    expect(age.getAttribute('data-slot-state')).toBe('measured');
    expect(age.textContent).toContain('12 minuti fa');
    expect(age.textContent).toContain(fmtDateTime(props.data.sync.lastSyncAt as string, 'it'));

    expect(q(card, '[data-slot="sync-problem"]').getAttribute('data-problem')).toBe('none');
    expect(q(card, '[data-slot="sync-problem"]').textContent).toBe(IT.status.okBody);
    expect(card.querySelector('[data-slot="sync-actions"]')).toBeNull();
    expect(card.querySelector('[data-slot="stale-note"]')).toBeNull();
    // il web non sincronizza: e' scritto, non nascosto
    expect(q(card, '[data-slot="web-note"]').textContent).toContain(IT.status.webNote);
  });

  it('partial: il codice motivo diventa parole semplici e dice cosa fare nell app', () => {
    const { container } = renderScreen(SourcesScreen, 'partial');
    const card = q(container, '[data-slot="sync-status"]');
    expect(card.getAttribute('data-sync-state')).toBe('partial');
    expect(q(card, '[data-slot="sync-problem"]').getAttribute('data-problem')).toBe('partial_types');
    expect(q(card, '[data-slot="sync-problem"]').textContent).toBe(IT.status.problem.partial_types);
    expect(qa(card, '[data-slot="sync-actions"] li').map((li) => li.getAttribute('data-action'))).toEqual(['check_types', 'open_sync']);
    expect(q(card, '[data-slot="sync-actions"]').textContent).toContain('Sincronizza ora');
    // porta ai tipi di dato piu' sotto, non a un sync
    expect(q(card, 'a[href="#sources-list-title"]')).not.toBeNull();
  });

  it('stale: l eta e il fatto principale e dice che il dopo non e arrivato, non e zero', () => {
    const { container, props } = renderScreen(SourcesScreen, 'stale');
    const card = q(container, '[data-slot="sync-status"]');
    expect(card.getAttribute('data-sync-state')).toBe('error');
    expect(card.getAttribute('data-stale')).toBe('true');

    const age = q(card, '[data-slot="sync-age"]');
    expect(age.getAttribute('data-slot-state')).toBe('stale');
    const big = q(age, 'p');
    expect(big.textContent).toBe('3 giorni fa');
    expect(big.className).toContain('text-warning');
    expect(big.textContent).not.toMatch(/\b0\b/);
    expect(q(age, '[data-slot="stale-note"]').textContent).toBe(IT.status.staleNote);
    expect(age.textContent).toContain(fmtDateTime(props.data.sync.lastSyncAt as string, 'it'));

    expect(q(card, '[data-slot="sync-problem"]').getAttribute('data-problem')).toBe('source_unreachable');
    expect(qa(card, '[data-slot="sync-actions"] li').map((li) => li.getAttribute('data-action'))).toEqual(['check_source', 'open_sync']);
  });

  it('empty: nessun sync e mai avvenuto, quindi nessuna data e nessun 0: trattino e motivo', () => {
    const { container, props } = renderScreen(SourcesScreen, 'empty');
    const card = q(container, '[data-slot="sync-status"]');
    expect(card.getAttribute('data-sync-state')).toBe('never');
    expect(q(card, '[data-slot="sync-state-label"]').textContent).toBe(props.copy.sync.never);

    const age = q(card, '[data-slot="sync-age"]');
    expect(age.getAttribute('data-slot-state')).toBe('absent');
    expect(age.getAttribute('data-absent-reason')).toBe('no_source');
    expect(age.textContent).toContain(props.copy.measure.absent.no_source);
    expect(age.textContent).not.toMatch(digits);
    expect(age.querySelector('svg')).not.toBeNull(); // AbsentMark
    expect(qa(card, '[data-slot="sync-actions"] li').map((li) => li.getAttribute('data-action'))).toEqual(['connect_device']);
    // niente rimando ai tipi di dato: non ce ne sono
    expect(card.querySelector('a[href="#sources-list-title"]')).toBeNull();
  });

  it('mai sincronizzato ma con sorgenti collegate: il motivo cambia (non ancora sincronizzato) e si dice di aprire l app', () => {
    const ok = screenProps('ok').data;
    const { container, props } = renderWith('empty', (d) => {
      d.sources = ok.sources;
    });
    const age = q(container, '[data-slot="sync-age"]');
    expect(age.getAttribute('data-absent-reason')).toBe('not_synced_yet');
    expect(age.textContent).toContain(props.copy.measure.absent.not_synced_yet);
    expect(q(container, '[data-slot="sync-problem"]').textContent).toBe(IT.status.neverWithSources);
    expect(qa(container, '[data-slot="sync-actions"] li').map((li) => li.getAttribute('data-action'))).toEqual(['open_sync']);
  });

  it('ognuno dei quattro codici motivo ha la sua frase e le sue azioni', () => {
    const expected: Record<NonNullable<SyncStatus['problem']>, string[]> = {
      permission_revoked: ['grant_permissions', 'open_sync'],
      source_unreachable: ['check_source', 'open_sync'],
      upload_failed: ['check_connection', 'open_sync'],
      partial_types: ['check_types', 'open_sync'],
    };
    for (const code of Object.keys(expected) as Array<keyof typeof expected>) {
      for (const [lc, c] of [['it', IT], ['en', EN]] as const) {
        const { container, unmount } = renderWith('ok', (d) => {
          d.sync = { ...d.sync, state: 'error', problem: code };
        }, { lc });
        const p = q(container, '[data-slot="sync-problem"]');
        expect(p.getAttribute('data-problem')).toBe(code);
        expect(p.textContent).toBe(c.status.problem[code]);
        expect(qa(container, '[data-slot="sync-actions"] li').map((li) => li.getAttribute('data-action'))).toEqual(expected[code]);
        unmount();
      }
    }
  });

  it('errore senza codice motivo: frase generica, mai una causa inventata', () => {
    const { container } = renderWith('ok', (d) => {
      d.sync = { ...d.sync, state: 'error', problem: null };
    });
    const p = q(container, '[data-slot="sync-problem"]');
    expect(p.getAttribute('data-problem')).toBe('none');
    expect(p.textContent).toBe(IT.status.problemGeneric.error);
  });

  it('senza eta dichiarata la calcola dalla data; senza data ne eta resta un trattino, mai 0 minuti fa', () => {
    const a = renderWith('ok', (d) => {
      d.sync = { ...d.sync, ageMinutes: null };
    });
    expect(q(a.container, '[data-slot="sync-age"]').textContent).toContain('12 minuti fa');
    a.unmount();

    const b = renderWith('ok', (d) => {
      d.sync = { ...d.sync, ageMinutes: null, lastSyncAt: null };
    });
    const age = q(b.container, '[data-slot="sync-age"]');
    expect(age.getAttribute('data-slot-state')).toBe('absent');
    expect(age.textContent).not.toMatch(/minut|\d/);
  });

  it('oltre 48 ore e vecchio, sotto no: la soglia e quella dell app', () => {
    const at = (minutes: number) =>
      renderWith('ok', (d) => {
        d.sync = { ...d.sync, ageMinutes: minutes };
      });
    const fresh = at(47 * 60);
    expect(q(fresh.container, '[data-slot="sync-status"]').getAttribute('data-stale')).toBe('false');
    expect(fresh.container.querySelector('[data-slot="log-gap"]')).toBeNull();
    fresh.unmount();
    const old = at(49 * 60);
    expect(q(old.container, '[data-slot="sync-status"]').getAttribute('data-stale')).toBe('true');
    expect(q(old.container, '[data-slot="log-gap"]')).not.toBeNull();
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
      // tutto letto: nessun riquadro assente
      expect(qa(card, '[data-slot-state="absent"]').length).toBe(0);
    });
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

  it('partial: permesso mancante e non fornito sono assenti (tratteggiati, con il motivo), non letti', () => {
    const { container, props } = renderScreen(SourcesScreen, 'partial');
    const cases: Array<[string, string, string]> = [
      ['workouts', 'permission_missing', props.copy.measure.absent.permission_missing],
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

  it('i cinque stati di un tipo si distinguono e nessuno stampa una cifra', () => {
    const statuses: SourceTypeStatus['status'][] = ['ok', 'no_data', 'permission_missing', 'not_provided', 'error'];
    const { container, props } = renderWith('ok', (d) => {
      d.sources = [
        {
          ref: d.sources[0].ref,
          lastSyncAt: d.sources[0].lastSyncAt,
          types: statuses.map((status, i) => ({ type: (['steps', 'heart_rate', 'sleep', 'workouts', 'calories'] as const)[i], status, winning: status === 'ok' })),
        },
      ];
    });
    const labels: Record<SourceTypeStatus['status'], string> = {
      ok: IT.sources.statusOk,
      no_data: props.copy.measure.noData,
      permission_missing: props.copy.measure.absent.permission_missing,
      not_provided: props.copy.measure.absent.source_lacks_type,
      error: props.copy.measure.absent.read_error,
    };
    const tiles = qa(container, '[data-slot="source-type"]');
    expect(tiles.map((t) => t.getAttribute('data-status'))).toEqual(statuses);
    tiles.forEach((t, i) => {
      expect(t.textContent).toContain(labels[statuses[i]]);
      expect(t.getAttribute('data-slot-state')).toBe(statuses[i] === 'ok' ? 'measured' : 'absent');
      if (statuses[i] !== 'ok') expect(t.textContent).not.toMatch(digits);
    });
    expect(tiles.filter((t) => t.className.includes('border-dashed')).length).toBe(4);
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

  it('una sorgente mai sincronizzata mostra un trattino e il motivo, non una data ne 0 minuti fa', () => {
    const { container, props } = renderWith('ok', (d) => {
      d.sources[1] = { ...d.sources[1], lastSyncAt: null } as SourceRow;
    });
    const dd = q(container, '[data-source="phone"] [data-slot="source-last-sync"]');
    expect(dd.getAttribute('data-slot-state')).toBe('absent');
    expect(dd.textContent).toContain(props.copy.measure.absent.not_synced_yet);
    expect(dd.textContent).not.toMatch(digits);
    // l'altra sorgente resta misurata
    expect(q(container, '[data-source="galaxy-watch"] [data-slot="source-last-sync"]').getAttribute('data-slot-state')).toBe('measured');
  });

  it('stale: l ultimo sync di ogni sorgente e vecchio, con la sua eta', () => {
    const { container } = renderScreen(SourcesScreen, 'stale');
    for (const dd of qa(container, '[data-slot="source-last-sync"]')) {
      expect(dd.getAttribute('data-slot-state')).toBe('stale');
      expect(dd.textContent).toMatch(/3 gg fa/);
    }
  });

  it('empty: spiegazione amichevole e link vero ai dispositivi, nessuna scheda e nessuna cifra', () => {
    const { container } = renderScreen(SourcesScreen, 'empty');
    expect(container.querySelectorAll('[data-slot="source-card"]').length).toBe(0);
    const empty = q(container, '[data-slot="sources-empty"]');
    expect(empty.getAttribute('data-slot-state')).toBe('absent');
    expect(empty.getAttribute('data-absent-reason')).toBe('no_source');
    expect(empty.textContent).toContain(IT.sources.empty.title);
    for (const step of IT.sources.empty.steps) expect(empty.textContent).toContain(step);
    expect(empty.textContent).not.toMatch(digits);
    const link = q(empty, 'a[href="/it/app/devices"]');
    expect(link.textContent).toContain(IT.sources.empty.link);
    expect(link.className).toContain('min-h-[44px]');
    expect(container.querySelector('[data-slot="one-source-note"]')).toBeNull();
  });
});

describe('cronologia dei sync', () => {
  it('ok: una voce per sync, con esito, durata e conteggi', () => {
    const { container, props } = renderScreen(SourcesScreen, 'ok');
    const entries = qa(container, '[data-slot="log-entry"]');
    expect(entries.length).toBe(props.data.syncLog.length);
    expect(container.querySelector('[data-slot="log-gap"]')).toBeNull();

    const first = entries[0];
    expect(first.getAttribute('data-log-state')).toBe('ok');
    expect(first.textContent).toContain(fmtDateTime(props.data.syncLog[0].at, 'it'));
    expect(first.textContent).toContain(props.copy.sync.ok);
    expect(first.textContent).toContain(`${props.data.syncLog[0].durationSeconds} s`);
    expect(first.textContent).toContain('9 tipi letti, 0 non riusciti');
    // «0 non riusciti» e un dato misurato, con la sua semantica
    expect(q(first, '[data-count="failed"]').getAttribute('data-measure-state')).toBe('measured-zero');
    expect(q(first, '[data-count="read"]').getAttribute('data-measure-state')).toBe('measured');
  });

  it('un sync fallito: durata non registrata (assente, senza cifra) e zero tipi letti (misurato, con cifra)', () => {
    const { container, props } = renderScreen(SourcesScreen, 'ok');
    const failed = qa(container, '[data-slot="log-entry"]').find((li) => li.getAttribute('data-log-state') === 'error') as HTMLElement;
    expect(failed).toBeDefined();

    const duration = q(failed, 'dd[data-measure-state="absent"]');
    expect(duration.textContent).toContain(IT.history.durationNone);
    expect(duration.textContent).toContain(props.copy.measure.noData);
    expect(duration.textContent).not.toMatch(digits);
    expect(duration.querySelector('svg')).not.toBeNull(); // AbsentMark

    expect(q(failed, '[data-count="read"]').getAttribute('data-measure-state')).toBe('measured-zero');
    expect(q(failed, '[data-count="read"]').textContent).toBe('0 tipi letti');
    expect(q(failed, '[data-count="failed"]').getAttribute('data-measure-state')).toBe('measured');
    expect(q(failed, '[data-count="failed"]').textContent).toBe('9 non riusciti');
    expect(failed.textContent).toContain(props.copy.sync.error);
  });

  it('zeros: nella stessa cronologia convivono zero misurato e dato assente, e sono diversi', () => {
    const { container } = renderScreen(SourcesScreen, 'zeros');
    const states = measureStates(container);
    expect(states).toContain('measured-zero');
    expect(states).toContain('absent');
    for (const el of qa(container, '[data-slot="sync-history"] [data-measure-state="absent"]')) expect(el.textContent).not.toMatch(digits);
    for (const el of qa(container, '[data-slot="sync-history"] [data-measure-state="measured-zero"]')) expect(el.textContent).toMatch(/^0 /);
  });

  it('una durata di 0 secondi e un dato misurato: non si confonde con la durata non registrata', () => {
    const { container } = renderWith('ok', (d) => {
      d.syncLog[0].durationSeconds = 0;
    });
    const first = qa(container, '[data-slot="log-entry"]')[0];
    const dd = q(first, 'dd[data-measure-state]');
    expect(dd.getAttribute('data-measure-state')).toBe('measured-zero');
    expect(dd.textContent).toBe('0 s');
    expect(dd.querySelector('svg')).toBeNull();
  });

  it('singolare e plurale dei conteggi, in it e en', () => {
    for (const [lc, c, read, failed] of [['it', IT, '1 tipo letto', '1 non riuscito'], ['en', EN, '1 type read', '1 failed']] as const) {
      const { container, unmount } = renderWith('ok', (d) => {
        d.syncLog[0].readTypes = 1;
        d.syncLog[0].failedTypes = 1;
      }, { lc });
      const first = qa(container, '[data-slot="log-entry"]')[0];
      expect(q(first, '[data-count="read"]').textContent).toBe(read);
      expect(q(first, '[data-count="failed"]').textContent).toBe(failed);
      expect(c.history.readTypes(2)).not.toBe(read);
      unmount();
    }
  });

  it('parte sempre dal sync piu recente, qualunque ordine arrivi dal dato', () => {
    const { container, props } = renderWith('ok', (d) => {
      d.syncLog.reverse();
    });
    const times = qa(container, '[data-slot="log-entry"] time').map((t) => t.getAttribute('datetime'));
    const sorted = [...times].sort((a, b) => Date.parse(b as string) - Date.parse(a as string));
    expect(times).toEqual(sorted);
    expect(times[0]).toBe(props.data.syncLog.map((e) => e.at).sort().reverse()[0]);
  });

  it('empty: dice che non c e ancora una cronologia, non «0 sync»', () => {
    const { container } = renderScreen(SourcesScreen, 'empty');
    expect(container.querySelectorAll('[data-slot="log-entry"]').length).toBe(0);
    const empty = q(container, '[data-slot="log-empty"]');
    expect(empty.getAttribute('data-slot-state')).toBe('absent');
    expect(empty.textContent).toContain(IT.history.emptyTitle);
    expect(empty.textContent).toContain(IT.history.emptyBody);
    const history = q(container, '[data-slot="sync-history"]');
    expect(history.getAttribute('data-slot-state')).toBe('absent');
    expect(history.textContent).not.toMatch(digits);
    expect(container.textContent).not.toMatch(/\b0\s*sync/i);
  });

  it('stale: la prima riga e un vuoto tratteggiato con l ora dell ultimo sync noto', () => {
    const { container, props } = renderScreen(SourcesScreen, 'stale');
    const gap = q(container, '[data-slot="log-gap"]');
    expect(gap.getAttribute('data-slot-state')).toBe('absent');
    expect(gap.className).toContain('border-dashed');
    expect(gap.textContent).toBe(fill(IT.history.gap, { when: fmtDateTime(props.data.sync.lastSyncAt as string, 'it') }));
    // il vuoto sta sopra le voci
    const list = q(container, '[data-slot="sync-history"] ul');
    expect(gap.compareDocumentPosition(list) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });
});
