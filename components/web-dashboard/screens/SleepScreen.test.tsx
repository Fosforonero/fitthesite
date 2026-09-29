import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { fmtMinutes } from '@/lib/web-dashboard/format';
import { absent, partial, value, type AbsentReason } from '@/lib/web-dashboard/measure';
import type { DashboardData, ScenarioKey, SleepBlock } from '@/lib/web-dashboard/model';

import { SleepLoading, SleepScreen } from './SleepScreen';
import { sleepCopy } from './SleepScreen.copy';
import { fmtHM, hourTicks, layoutHypnogram, nightSlotState, nightsAxisTop } from './sleep/helpers';
import { forbiddenCopyIn, renderScreen, screenProps } from './test-utils';

const SCENARIOS: ScenarioKey[] = ['ok', 'partial', 'zeros', 'stale', 'empty'];
const DAY = '2026-09-23';

/** Schermata con i dati di uno scenario, ritoccati da `mutate` (copia profonda: il generatore non si tocca). */
function renderWith(scenario: ScenarioKey, mutate: (d: DashboardData) => void, opts: { lc?: string } = {}) {
  const props = screenProps(scenario, opts);
  const data: DashboardData = JSON.parse(JSON.stringify(props.data));
  mutate(data);
  return { ...render(<SleepScreen {...props} data={data} />), props: { ...props, data } };
}

function sleepMinutesDays(d: DashboardData) {
  return d.trends.find((t) => t.metric === 'sleepMinutes')!.days;
}

function nightOf(d: DashboardData) {
  const n = d.sleep.night;
  if (n.kind === 'absent') throw new Error('serve una notte');
  return n;
}

const digits = /\d/;

describe('SleepScreen: rende ogni scenario in it e en', () => {
  for (const lc of ['it', 'en']) {
    for (const s of SCENARIOS) {
      it(`${s} / ${lc}: nessun errore, nessuna copy vietata, solo h2 (l'h1 e' della shell)`, () => {
        const { container } = renderScreen(SleepScreen, s, { lc });
        expect(container.firstElementChild).not.toBeNull();
        expect(forbiddenCopyIn(container)).toEqual([]);
        expect(container.querySelector('h1')).toBeNull();
        expect(container.querySelectorAll('h2').length).toBeGreaterThanOrEqual(2);
        // ogni grafico e' un role="img" con un riassunto testuale
        for (const img of container.querySelectorAll('[role="img"]')) {
          expect(img.getAttribute('aria-label') ?? '').not.toBe('');
        }
      });
    }
  }

  it('una lingua senza copy propria (de) usa l\'inglese e il suo prefisso nei link', () => {
    const { container } = renderScreen(SleepScreen, 'empty', { lc: 'de' });
    expect(container.textContent).toContain('No device is connected');
    expect(container.querySelector('a[href="/de/app/devices"]')).not.toBeNull();
  });

  it('lo scheletro si rende e non parla (aria-hidden)', () => {
    const { container } = render(<SleepLoading />);
    expect(container.querySelectorAll('[aria-hidden="true"]').length).toBeGreaterThanOrEqual(6);
    expect(container.textContent).toBe('');
  });
});

describe('caso (a): notte completa con fasi', () => {
  it('mostra totale, orari, sorgente, ipnogramma e quattro fasi misurate', () => {
    const { container, props } = renderScreen(SleepScreen, 'ok');
    const night = nightOf(props.data);
    const total = night.value.totalMinutes;
    expect(total.kind).toBe('value');

    const header = container.querySelector('[data-slot="night"]')!;
    expect(header.getAttribute('data-slot-state')).toBe('measured');
    expect(header.textContent).toContain(fmtMinutes((total as { value: number }).value, 'it'));
    expect(header.textContent).toContain('Galaxy Watch');
    expect(header.textContent).toMatch(/\d\d:\d\d/);

    const hyp = container.querySelector('[data-slot="hypnogram"]')!;
    expect(hyp.getAttribute('data-slot-state')).toBe('measured');
    const blocks = night.value.stages.kind === 'value' ? night.value.stages.value : [];
    expect(hyp.querySelectorAll('svg rect[data-stage]').length).toBe(blocks.length);
    expect(hyp.querySelectorAll('[data-slot-state="absent"]').length).toBe(0);

    const tiles = container.querySelector('[data-slot="stage-totals"]')!;
    expect(tiles.querySelectorAll('[data-measure-state="measured"]').length).toBe(4);
    expect(tiles.querySelectorAll('[data-measure-state="absent"]').length).toBe(0);
    expect(tiles.textContent).toContain('della notte');
  });

  it('gli ultimi 7 giorni: 7 link, quello selezionato e\' current, riferimento a 7 h etichettato come tale', () => {
    const { container } = renderScreen(SleepScreen, 'ok');
    const links = container.querySelectorAll('a[data-night-link]');
    expect(links.length).toBe(7);
    expect(links[6].getAttribute('aria-current')).toBe('date');
    expect(links[6].getAttribute('data-night-link')).toBe(DAY);
    // il giorno selezionato ha l'URL di default (nessun parametro day), gli altri portano day=
    expect(links[6].getAttribute('href')).toBe('/it/dashboard-preview/sleep');
    expect(links[0].getAttribute('href')).toContain('day=2026-09-17');
    expect(container.querySelector('line[data-reference="7h"]')).not.toBeNull();
    expect(container.querySelector('[data-slot="reference-legend"]')!.textContent).toContain('non un obiettivo medico');
  });

  it('la barra della notte selezionata ha la stessa durata dell\'intestazione', () => {
    const { container, props } = renderScreen(SleepScreen, 'ok');
    const total = (nightOf(props.data).value.totalMinutes as { value: number }).value;
    const link = container.querySelector(`a[data-night-link="${DAY}"]`)!;
    expect(link.getAttribute('aria-label')).toContain(fmtMinutes(total, 'it'));
    expect(link.textContent).toContain(fmtHM(total));
  });

  it('la tabella dei dati e\' dentro un <details>', () => {
    const { container } = renderScreen(SleepScreen, 'ok');
    expect(container.querySelectorAll('details table').length).toBe(2);
    expect(container.querySelectorAll('details tr[data-stage]').length).toBeGreaterThan(5);
  });
});

describe('caso (b): totale noto, fasi assenti (source_lacks_type)', () => {
  it('il totale c\'e\', al posto dell\'ipnogramma c\'e\' un riquadro tratteggiato con il motivo', () => {
    const { container, props } = renderScreen(SleepScreen, 'partial');
    const c = props.copy;

    const header = container.querySelector('[data-slot="night"]')!;
    expect(header.querySelector('[data-measure-state="measured"]')).not.toBeNull();

    const hyp = container.querySelector('[data-slot="hypnogram"]')!;
    expect(hyp.getAttribute('data-slot-state')).toBe('absent');
    expect(hyp.getAttribute('data-absent-reason')).toBe('source_lacks_type');
    expect(hyp.textContent).toContain(c.measure.absent.source_lacks_type);
    expect(hyp.textContent).toContain('Ripartizione per fase non disponibile');
    // nessun blocco disegnato: in particolare nessuna fase «sveglio» al posto del dato
    expect(container.querySelectorAll('rect[data-stage]').length).toBe(0);
    expect(hyp.className).toContain('border-dashed');
  });

  it('le quattro fasi sono assenti: nessuna cifra, nessuno "0", nessuna percentuale', () => {
    const { container } = renderScreen(SleepScreen, 'partial');
    const tiles = container.querySelector('[data-slot="stage-totals"]')!;
    expect(tiles.getAttribute('data-slot-state')).toBe('absent');
    expect(tiles.querySelectorAll('[data-measure-state="absent"]').length).toBe(4);
    expect(tiles.querySelectorAll('[data-measure-state="measured"], [data-measure-state="measured-zero"]').length).toBe(0);
    expect(tiles.textContent).not.toMatch(digits);
    expect(tiles.textContent).not.toContain('%');
    expect(tiles.textContent).not.toContain('min');
    // il motivo compare una volta sola, in testa alla sezione
    expect(tiles.textContent).toContain('Non fornito dalla fonte');
    expect([...tiles.querySelectorAll('svg[data-share-state]')].every((s) => s.getAttribute('data-share-state') === 'absent')).toBe(true);
  });

  it('con le fasi assenti e la lingua en il motivo e\' quello condiviso in inglese', () => {
    const { container } = renderScreen(SleepScreen, 'partial', { lc: 'en' });
    expect(container.querySelector('[data-slot="hypnogram"]')!.textContent).toContain('Not provided by the source');
  });

  it('tutti i motivi possibili per le fasi assenti producono il riquadro, mai un grafico', () => {
    const reasons: AbsentReason[] = ['no_source', 'not_synced_yet', 'permission_missing', 'source_lacks_type', 'no_samples', 'not_yet', 'read_error'];
    for (const r of reasons) {
      const { container, unmount } = renderWith('ok', (d) => {
        const n = nightOf(d);
        n.value.stages = absent(r);
        n.value.stageMinutes = absent(r);
      });
      const hyp = container.querySelector('[data-slot="hypnogram"]')!;
      expect(hyp.getAttribute('data-absent-reason')).toBe(r);
      expect(hyp.querySelectorAll('rect[data-stage]').length).toBe(0);
      unmount();
    }
  });

  it('una lista di fasi vuota non e\' "nessuna fase": e\' un dato che manca', () => {
    const { container } = renderWith('ok', (d) => {
      nightOf(d).value.stages = value([]);
    });
    expect(container.querySelector('[data-slot="hypnogram"]')!.getAttribute('data-slot-state')).toBe('absent');
  });
});

describe('caso (c): notte assente', () => {
  const reasons: Array<[ScenarioKey, AbsentReason]> = [
    ['zeros', 'no_samples'],
    ['stale', 'not_synced_yet'],
    ['empty', 'no_source'],
  ];

  for (const [scenario, reason] of reasons) {
    it(`${scenario}: scheda con il motivo (${reason}), trattino, mai "0 h 00 min" ne "0 min"`, () => {
      const { container, props } = renderScreen(SleepScreen, scenario);
      const night = container.querySelector('[data-slot="night"]')!;
      expect(night.getAttribute('data-slot-state')).toBe('absent');
      expect(night.getAttribute('data-absent-reason')).toBe(reason);
      expect(night.textContent).toContain(props.copy.measure.absent[reason]);
      expect(night.querySelector('[data-measure-state="absent"] svg')).not.toBeNull();
      expect(night.querySelector('[data-measure-state="measured-zero"]')).toBeNull();
      expect(container.textContent).not.toMatch(/0 h 00/);
      expect(night.textContent).not.toMatch(/(^|\D)0 ?(h|min)\b/);
      expect(night.className + (night.firstElementChild?.className ?? '')).toContain('border-dashed');
      // ne' ipnogramma ne' fasi: nulla che possa sembrare una notte
      expect(container.querySelector('[data-slot="hypnogram"]')).toBeNull();
      expect(container.querySelector('[data-slot="stage-totals"]')).toBeNull();
    });
  }

  it('la notte selezionata nella barra e\' assente come l\'intestazione (non 6 h inventate)', () => {
    const { container } = renderScreen(SleepScreen, 'zeros');
    const slot = container.querySelector(`svg [data-night="${DAY}"]`)!;
    expect(slot.getAttribute('data-slot-state')).toBe('absent');
    expect(slot.tagName.toLowerCase()).toBe('rect');
    expect(slot.getAttribute('fill')).toContain('absent');
  });

  it('nessuna colonna assente e\' una barra a zero: niente rect senza altezza, niente cifra nell\'etichetta', () => {
    for (const s of ['zeros', 'stale', 'partial'] as const) {
      const { container, unmount } = renderScreen(SleepScreen, s);
      const absentSlots = container.querySelectorAll('svg [data-night][data-slot-state="absent"]');
      // zeros e stale hanno di certo notti assenti; in partial dipende dal seme, il controllo sotto vale comunque
      if (s !== 'partial') expect(absentSlots.length).toBeGreaterThan(0);
      for (const r of container.querySelectorAll('svg rect[data-night]')) {
        expect(Number(r.getAttribute('height'))).toBeGreaterThan(0);
      }
      for (const label of container.querySelectorAll('a[data-night-link] [data-measure-state="absent"]')) {
        expect(label.textContent).not.toMatch(digits);
      }
      unmount();
    }
  });

  it('stale: le ultime notti sono assenti con il motivo "non ancora sincronizzato", le precedenti no', () => {
    const { container } = renderScreen(SleepScreen, 'stale');
    const state = (d: string) => container.querySelector(`svg [data-night="${d}"]`)!.getAttribute('data-slot-state');
    expect(state('2026-09-23')).toBe('absent');
    expect(state('2026-09-22')).toBe('absent');
    expect(state('2026-09-21')).toBe('measured');
    const row = container.querySelector('details tr[data-night="2026-09-22"]')!;
    expect(row.textContent).toContain('Non ancora sincronizzato');
  });

  it('empty: link alla rotta vera per collegare un dispositivo, 7 notti tutte assenti in un solo riquadro', () => {
    const { container } = renderScreen(SleepScreen, 'empty');
    const link = container.querySelector('a[href="/it/app/devices"]');
    expect(link).not.toBeNull();
    expect((link as HTMLElement).textContent).toContain('Collega un dispositivo');
    expect((link as HTMLElement).className).toContain('min-h-[44px]');

    const nights = container.querySelector('[data-slot="nights"]')!;
    expect(nights.getAttribute('data-slot-state')).toBe('absent');
    expect(nights.querySelectorAll('svg rect[data-night]').length).toBe(0);
    expect(nights.querySelector('[data-absent-reason="no_source"]')).not.toBeNull();
    expect(nights.textContent).toContain('Nessuna fonte collegata');
    // la media non e' 0: e' "non disponibile"
    const avg = nights.querySelector('[data-slot="nights-average"] [data-measure-state="absent"]')!;
    expect(avg.textContent).toContain('Media non disponibile');
    expect(avg.textContent).not.toMatch(digits);
  });

  it('il link ai dispositivi compare solo quando manca la fonte', () => {
    for (const s of ['zeros', 'stale'] as const) {
      const { container, unmount } = renderScreen(SleepScreen, s);
      expect(container.querySelector('a[href$="/app/devices"]')).toBeNull();
      unmount();
    }
  });

  it('ogni motivo di assenza ha la sua spiegazione (it e en), senza digit e senza em dash', () => {
    const reasons: AbsentReason[] = ['no_source', 'not_synced_yet', 'permission_missing', 'source_lacks_type', 'no_samples', 'not_yet', 'read_error'];
    for (const lc of ['it', 'en']) {
      const c = sleepCopy(lc === 'it' ? 'it' : 'en');
      for (const r of reasons) {
        expect(c.absentBody[r].length).toBeGreaterThan(10);
        const { container, unmount } = renderWith('zeros', (d) => {
          d.sleep.night = absent(r);
        }, { lc });
        const night = container.querySelector('[data-slot="night"]')!;
        expect(night.textContent).toContain(c.absentBody[r]);
        expect(forbiddenCopyIn(container)).toEqual([]);
        unmount();
      }
    }
  });
});

describe('zero misurato, parziale e assente sono tre cose diverse', () => {
  it('una fase a 0 minuti e\' uno zero misurato: "0 min", "Zero misurato", tacca sulla barra; le altre restano misurate', () => {
    const { container } = renderWith('ok', (d) => {
      const sm = nightOf(d).value.stageMinutes;
      if (sm.kind !== 'value') throw new Error('serve stageMinutes misurato');
      sm.value.awake += sm.value.rem;
      sm.value.rem = 0;
    });
    const rem = container.querySelector('[data-slot="stage-totals"] [data-stage="rem"]')!;
    expect(rem.querySelector('[data-measure-state="measured-zero"]')).not.toBeNull();
    expect(rem.textContent).toContain('0 min');
    expect(rem.textContent).toContain('Zero misurato');
    expect(rem.querySelector('svg[data-share-state]')!.getAttribute('data-share-state')).toBe('measured-zero');
    const deep = container.querySelector('[data-slot="stage-totals"] [data-stage="deep"]')!;
    expect(deep.querySelector('[data-measure-state="measured"]')).not.toBeNull();
    expect(deep.textContent).not.toContain('Zero misurato');
  });

  it('nei 7 giorni: zero misurato = tacca (line), parziale = barra a righe, assente = colonna tratteggiata; tre elementi diversi', () => {
    const { container } = renderWith('ok', (d) => {
      const days = sleepMinutesDays(d);
      days[days.length - 2].m = value(0); // 22 set: zero misurato
      days[days.length - 3].m = partial(200, 0.5, 'device_off'); // 21 set: parziale
      days[days.length - 4].m = absent('no_samples'); // 20 set: assente
    });
    const el = (date: string) => container.querySelector(`svg [data-night="${date}"]`)!;
    const zero = el('2026-09-22');
    const par = el('2026-09-21');
    const abs = el('2026-09-20');

    expect(zero.getAttribute('data-slot-state')).toBe('measured-zero');
    expect(zero.tagName.toLowerCase()).toBe('line');
    expect(par.getAttribute('data-slot-state')).toBe('partial');
    expect(par.getAttribute('fill')).toContain('partial');
    expect(Number(par.getAttribute('height'))).toBeGreaterThan(0);
    expect(abs.getAttribute('data-slot-state')).toBe('absent');
    expect(abs.getAttribute('fill')).toContain('absent');
    expect(abs.getAttribute('stroke-dasharray')).toBeTruthy();

    // etichette: "0 min" solo per lo zero misurato; il trattino (senza cifre) per l'assente
    const label = (date: string) => container.querySelector(`a[data-night-link="${date}"] [data-measure-state]`)!;
    expect(label('2026-09-22').getAttribute('data-measure-state')).toBe('measured-zero');
    expect(label('2026-09-22').textContent).toBe('0 min');
    expect(label('2026-09-21').getAttribute('data-measure-state')).toBe('partial');
    expect(label('2026-09-20').getAttribute('data-measure-state')).toBe('absent');
    expect(label('2026-09-20').textContent).not.toMatch(digits);

    // legenda: mostra solo gli stati presenti, e sono tutti e quattro
    const legend = container.querySelector('ul[aria-label="Legenda"]')!;
    expect(legend.textContent).toContain('Zero misurato');
    expect(legend.textContent).toContain('Parziale');
    expect(legend.textContent).toContain('Nessun dato');

    // tabella: il motivo dell'assenza e la copertura del parziale sono scritti
    expect(container.querySelector('details tr[data-night="2026-09-20"]')!.textContent).toContain('Nessun campione');
    expect(container.querySelector('details tr[data-night="2026-09-21"]')!.textContent).toContain('Parziale 50%');
    expect(container.querySelector('details tr[data-night="2026-09-22"]')!.textContent).toContain('Zero misurato');
  });

  it('la media usa solo le notti complete: le assenti non la diluiscono, le parziali non la abbassano', () => {
    const { container } = renderWith('ok', (d) => {
      const days = sleepMinutesDays(d);
      const nightTotal = nightOf(d).value;
      nightTotal.totalMinutes = value(420); // la notte selezionata: 7 h
      const last7 = days.slice(-7);
      last7[0].m = value(420);
      last7[1].m = value(420);
      last7[2].m = value(420);
      last7[3].m = absent('no_samples');
      last7[4].m = partial(60, 0.2, 'sync_incomplete');
      last7[5].m = value(420);
    });
    const avg = container.querySelector('[data-slot="nights-average"]')!;
    expect(avg.textContent).toContain('7 h 00 min');
    expect(avg.textContent).toContain('5 notti complete su 7');
  });

  it('notte parziale: chip con copertura e motivo nell\'intestazione e barra parziale nella settimana', () => {
    const { container, props } = renderWith('ok', (d) => {
      const n = nightOf(d);
      d.sleep.night = partial(n.value, 0.6, 'device_off');
    });
    const header = container.querySelector('[data-slot="night"]')!;
    expect(header.getAttribute('data-slot-state')).toBe('partial');
    expect(header.textContent).toContain('Parziale 60%');
    expect(header.textContent).toContain(props.copy.measure.partial.device_off);
    expect(container.querySelector(`svg [data-night="${DAY}"]`)!.getAttribute('data-slot-state')).toBe('partial');
  });

  it('totale della notte assente ma notte presente: trattino e motivo, mai "0 h"', () => {
    const { container } = renderWith('ok', (d) => {
      nightOf(d).value.totalMinutes = absent('read_error');
    });
    const header = container.querySelector('[data-slot="night"]')!;
    const totalCell = header.querySelector('dd [data-measure-state="absent"]')!;
    expect(totalCell.textContent).toContain('Lettura non riuscita');
    expect(totalCell.textContent).not.toMatch(digits);
    expect(container.textContent).not.toMatch(/0 h 00/);
    // l'ipnogramma si disegna lo stesso, sulla durata ricavata da orari e blocchi
    expect(container.querySelectorAll('svg rect[data-stage]').length).toBeGreaterThan(0);
  });

  it('un buco fra le fasi non diventa "sveglio": e\' un intervallo assente tratteggiato', () => {
    const { container } = renderWith('ok', (d) => {
      const n = nightOf(d);
      const stages = n.value.stages;
      if (stages.kind !== 'value') throw new Error('serve stages misurato');
      stages.value.splice(4, 2); // due blocchi consecutivi senza dati
    });
    const hyp = container.querySelector('[data-slot="hypnogram"]')!;
    expect(hyp.querySelectorAll('svg rect[data-slot-state="absent"]').length).toBe(1);
    expect(hyp.querySelector('svg rect[data-slot-state="absent"]')!.getAttribute('stroke-dasharray')).toBeTruthy();
    expect(container.querySelector('details tr[data-slot-state="absent"]')!.textContent).toContain('Nessun dato sulle fasi');
  });

  it('fasi parziali: ipnogramma disegnato con la sua copertura, mai come pieno', () => {
    const { container } = renderWith('ok', (d) => {
      const n = nightOf(d);
      const stages = n.value.stages;
      if (stages.kind !== 'value') throw new Error('serve stages misurato');
      n.value.stages = partial(stages.value, 0.7, 'sync_incomplete');
      const sm = n.value.stageMinutes;
      if (sm.kind !== 'value') throw new Error('serve stageMinutes misurato');
      n.value.stageMinutes = partial(sm.value, 0.7, 'sync_incomplete');
    });
    const hyp = container.querySelector('[data-slot="hypnogram"]')!;
    expect(hyp.getAttribute('data-slot-state')).toBe('measured');
    expect(container.textContent).toContain('Parziale 70%');
    const tiles = container.querySelector('[data-slot="stage-totals"]')!;
    expect(tiles.getAttribute('data-slot-state')).toBe('partial');
    expect(tiles.querySelectorAll('[data-measure-state="partial"]').length).toBe(4);
    expect(tiles.textContent).toContain('della parte registrata');
  });
});

describe('funzioni pure', () => {
  const bed = '2026-09-22T22:39:00+02:00';
  const wake = '2026-09-23T04:55:00+02:00';

  it('layoutHypnogram: ordina, contiene, trova i buchi e somma per fase', () => {
    const blocks: SleepBlock[] = [
      { stage: 'deep', fromMin: 30, toMin: 60 },
      { stage: 'light', fromMin: 0, toMin: 20 },
      { stage: 'rem', fromMin: 60, toMin: 90 },
      { stage: 'awake', fromMin: 95, toMin: 95 }, // durata zero: scartato, non disegnato
    ];
    const l = layoutHypnogram(blocks, 120, bed, wake);
    expect(l.blocks.map((b) => b.stage)).toEqual(['light', 'deep', 'rem']);
    expect(l.gaps).toEqual([{ from: 20, to: 30 }, { from: 90, to: 120 }]);
    expect(l.minutesByStage).toEqual({ awake: 0, rem: 30, light: 20, deep: 30 });
    expect(l.span).toBe(120);
  });

  it('layoutHypnogram: senza totale usa orari, e non accorcia mai l\'asse sotto l\'ultimo blocco', () => {
    expect(layoutHypnogram([], null, bed, wake).span).toBe(376);
    expect(layoutHypnogram([{ stage: 'light', fromMin: 0, toMin: 500 }], 376, bed, wake).span).toBe(500);
  });

  it('hourTicks: ore piene nel fuso dell\'anteprima, mezzanotte compresa (00, non 24)', () => {
    const ticks = hourTicks(bed, 376);
    expect(ticks[0]).toMatchObject({ at: 21, hour: 23 });
    expect(ticks[1]).toMatchObject({ at: 81, hour: 0, labelled: true });
    expect(ticks.filter((t) => t.labelled).map((t) => t.hour)).toEqual([0, 2, 4]);
    expect(hourTicks(bed, 240).filter((t) => t.labelled).length).toBeGreaterThan(3); // notte corta: ogni ora
  });

  it('nightSlotState separa i quattro stati; nightsAxisTop tiene sempre dentro le 7 h', () => {
    expect(nightSlotState(value(0))).toBe('measured-zero');
    expect(nightSlotState(value(1))).toBe('measured');
    expect(nightSlotState(partial(0, 0.5, 'device_off'))).toBe('partial');
    expect(nightSlotState(absent('no_samples'))).toBe('absent');
    expect(nightsAxisTop(0)).toBe(540);
    expect(nightsAxisTop(500)).toBe(540);
    expect(nightsAxisTop(600)).toBe(720);
  });

  it('fmtHM e\' compatto e non inventa "0 h"', () => {
    expect(fmtHM(432)).toBe('7 h 12');
    expect(fmtHM(45)).toBe('45 min');
    expect(fmtHM(0)).toBe('0 min');
  });
});

describe('copy della schermata', () => {
  it('nessun em dash e nessun riferimento a AI, in nessuna lingua', () => {
    for (const l of ['it', 'en'] as const) {
      const text = JSON.stringify(sleepCopy(l));
      expect(text).not.toContain('\u2014');
      expect(text).not.toMatch(/\bAI\b|intelligenza artificiale|artificial intelligence/i);
    }
  });
});
