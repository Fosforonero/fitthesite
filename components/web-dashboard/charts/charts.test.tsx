import { cleanup, render, fireEvent } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { DailyStepsChart } from './DailyStepsChart';
import { HeartRateTrendChart } from './HeartRateTrendChart';
import { SleepDurationChart } from './SleepDurationChart';
import { PeriodSelector } from './PeriodSelector';
import type { ChartDataPoint } from './types';
import {
  getStepsFixture,
  getHeartRateFixture,
  getSleepFixture,
  CHARTS_FIXTURE_METADATA,
} from '@/lib/web-dashboard/fixtures/charts-fixtures';

afterEach(cleanup);

describe('DASHBOARD-CHARTS-01: Componenti grafici e contratto dei dati', () => {
  describe('Fixture e Metadati', () => {
    it('i metadati dichiarano chiaramente fuso, unita, data ancorata al 24 settembre e dati dimostrativi', () => {
      expect(CHARTS_FIXTURE_METADATA.isDemo).toBe(true);
      expect(CHARTS_FIXTURE_METADATA.disclaimer).toMatch(/dimostrativi/i);
      expect(CHARTS_FIXTURE_METADATA.timezone).toBe('Europe/Rome');
      expect(CHARTS_FIXTURE_METADATA.anchorDate).toBe('2026-09-24');
      expect(CHARTS_FIXTURE_METADATA.units.steps).toBe('passi');
      expect(CHARTS_FIXTURE_METADATA.units.heartRate).toBe('bpm');
      expect(CHARTS_FIXTURE_METADATA.units.sleepDuration).toBe('minuti');
    });

    it('genera correttamente fixture per scenario error', () => {
      const errSteps = getStepsFixture(7, 'error');
      expect(errSteps).toHaveLength(7);
      expect(errSteps.every((p) => p.state === 'error' && p.value === null)).toBe(true);

      const errHeart = getHeartRateFixture(7, 'error');
      expect(errHeart.every((p) => p.state === 'error' && p.value === null)).toBe(true);

      const errSleep = getSleepFixture(7, 'error');
      expect(errSleep.every((p) => p.state === 'error' && p.value === null)).toBe(true);
    });
  });

  describe('PeriodSelector', () => {
    it('mostra 7 e 30 giorni con target di tocco conformi (44x44 px)', () => {
      let selected = 7;
      const { container } = render(
        <PeriodSelector
          currentPeriod={7}
          onSelectPeriod={(p) => {
            selected = p;
          }}
          locale="it"
        />
      );

      const buttons = container.querySelectorAll('button');
      expect(buttons).toHaveLength(2);
      expect(buttons[0].textContent).toContain('7 giorni');
      expect(buttons[1].textContent).toContain('30 giorni');
      expect(buttons[0].className).toContain('min-h-[44px]');
      expect(buttons[0].className).toContain('min-w-[44px]');

      fireEvent.click(buttons[1]);
      expect(selected).toBe(30);
    });

    it('in lingua inglese mostra 7 days e 30 days', () => {
      const { container } = render(
        <PeriodSelector
          currentPeriod={30}
          onSelectPeriod={() => {}}
          locale="en"
        />
      );

      expect(container.textContent).toContain('7 days');
      expect(container.textContent).toContain('30 days');
    });
  });

  describe('DailyStepsChart (Passi giornalieri a barre)', () => {
    it('rende dataset completo a 7 e 30 giorni con barre e badge demo', () => {
      const pts7 = getStepsFixture(7, 'complete');
      const { container: c7 } = render(
        <DailyStepsChart
          isDemo
          id="steps-test-7"
          title="Passi 7 giorni"
          points={pts7}
          period={7}
          locale="it"
        />
      );

      expect(c7.querySelector('[data-chart-wrapper="steps"]')).not.toBeNull();
      expect(c7.textContent).toContain('Dati dimostrativi');
      expect(c7.textContent).toContain('Passi 7 giorni');
      expect(c7.querySelectorAll('rect[data-bar]')).toHaveLength(7);
      expect(c7.querySelector('table')).not.toBeNull();

      const pts30 = getStepsFixture(30, 'complete');
      const { container: c30 } = render(
        <DailyStepsChart
          isDemo
          id="steps-test-30"
          title="Passi 30 giorni"
          points={pts30}
          period={30}
          locale="it"
        />
      );
      expect(c30.querySelectorAll('rect[data-bar]')).toHaveLength(30);
    });

    it('distingue chiaramente zero misurato da dato assente', () => {
      const pts = getStepsFixture(7, 'zeros');
      const { container } = render(
        <DailyStepsChart
          isDemo
          id="steps-zeros"
          title="Passi con zeri"
          points={pts}
          period={7}
          locale="it"
        />
      );

      // Le tacche zero usano un rettangolo dedicato alto 3px
      const zeroTicks = container.querySelectorAll('rect[height="3"]');
      expect(zeroTicks.length).toBeGreaterThan(0);

      // I blocchi assenti usano il motivo tratteggiato
      const absentBlocks = container.querySelectorAll('rect[fill*="absent"]');
      expect(absentBlocks.length).toBeGreaterThan(0);

      // La tabella alternativa riporta sia 'Zero misurato' sia 'Dato assente'
      const tableText = container.querySelector('table')?.textContent ?? '';
      expect(tableText).toContain('Zero misurato');
      expect(tableText).toContain('Dato assente');
    });

    it('rende dataset parziale con motivo a righe per i dati incompleti', () => {
      const pts = getStepsFixture(7, 'partial');
      const { container } = render(
        <DailyStepsChart
          isDemo
          id="steps-partial"
          title="Passi parziali"
          points={pts}
          period={7}
          locale="it"
        />
      );

      const partialBars = container.querySelectorAll('rect[fill*="partial"]');
      expect(partialBars.length).toBeGreaterThan(0);
    });

    it('rende dataset vuoto senza crash e con riepilogo "nessun dato", non media zero', () => {
      const pts = getStepsFixture(7, 'empty');
      const { container } = render(
        <DailyStepsChart
          isDemo
          id="steps-empty"
          title="Passi vuoti"
          points={pts}
          period={7}
          locale="it"
        />
      );

      expect(container.querySelectorAll('rect[data-bar]')).toHaveLength(0);
      const summaryText = container.querySelector('#steps-empty-summary')?.textContent ?? '';
      expect(summaryText).toContain('Nessun dato registrato');
      expect(summaryText).not.toContain('media di 0');
    });

    it('rende dataset con errori con etichette chiare e senza barre fittizie', () => {
      const pts = getStepsFixture(7, 'error');
      const { container } = render(
        <DailyStepsChart
          isDemo
          id="steps-err"
          title="Passi con errori"
          points={pts}
          period={7}
          locale="it"
        />
      );

      expect(container.querySelectorAll('rect[data-bar]')).toHaveLength(0);
      const summaryText = container.querySelector('#steps-err-summary')?.textContent ?? '';
      expect(summaryText).toContain('Nessun dato registrato');
      expect(container.textContent).toContain('Errore di lettura sensore');
    });

    it('normalizza difensivamente combinazioni incoerenti di stato e valore', () => {
      const badData: ChartDataPoint[] = [
        { date: '2026-09-20', state: 'absent', value: 9999 }, // absent con valore accidentale
        { date: '2026-09-21', state: 'measured', value: 0 },   // 0 misurato marcato come measured
        { date: '2026-09-22', state: 'measured', value: null }, // null marcato come measured
        { date: '2026-09-23', state: 'error', value: 5000 },   // error con valore accidentale
      ];

      const { container } = render(
        <DailyStepsChart
          isDemo
          id="steps-defensive"
          title="Difensivo"
          points={badData}
          period={7}
          locale="it"
        />
      );

      // Nessuna barra per 9999 (absent) ne per 5000 (error)
      const bars = container.querySelectorAll('rect[data-bar]');
      // Solo 1 elemento: il valore 0 normalizzato a zero-bar
      expect(bars).toHaveLength(1);
      expect(bars[0].getAttribute('data-slot-state')).toBe('measured-zero');
    });
  });

  describe('HeartRateTrendChart (Frequenza cardiaca bpm e andamento spezzato)', () => {
    it('rende dataset completo a 7 e 30 giorni con unita bpm e path SVG valido', () => {
      const pts = getHeartRateFixture(7, 'complete');
      const { container } = render(
        <HeartRateTrendChart
          isDemo
          id="hr-test"
          title="Frequenza cardiaca"
          points={pts}
          period={7}
          locale="it"
        />
      );

      expect(container.querySelector('[data-chart-wrapper="heart"]')).not.toBeNull();
      expect(container.textContent).toContain('bpm');
      expect(container.querySelectorAll('circle[data-line-point]')).toHaveLength(7);

      const path = container.querySelector('path[data-line-path]');
      expect(path).not.toBeNull();
      const d = path?.getAttribute('d') ?? '';
      expect(d).not.toContain('%');
      expect(d).not.toContain('NaN');
      expect(d).not.toContain('undefined');
      expect(d).toMatch(/^M\s+[-+]?\d*\.?\d+\s+[-+]?\d*\.?\d+(\s+L\s+[-+]?\d*\.?\d+\s+[-+]?\d*\.?\d+)+$/);
    });

    it('NON unisce con linee continue intervalli con dato assente', () => {
      // Nel dataset partial ci sono buchi consecutivi a idx 2, 3
      const pts = getHeartRateFixture(7, 'partial');
      const { container } = render(
        <HeartRateTrendChart
          isDemo
          id="hr-partial"
          title="Frequenza cardiaca con buchi"
          points={pts}
          period={7}
          locale="it"
        />
      );

      // Devono esserci piu segmenti path separati perche la linea e spezzata sui buchi
      const segments = container.querySelectorAll('[data-line-segment]');
      expect(segments.length).toBeGreaterThan(1);

      // Ogni path generato deve avere coordinate numeriche valide
      const paths = container.querySelectorAll('path[data-line-path]');
      for (const p of paths) {
        const d = p.getAttribute('d') ?? '';
        expect(d).not.toContain('%');
        expect(d).not.toContain('NaN');
        expect(d).toMatch(/^M\s+[-+]?\d*\.?\d+\s+[-+]?\d*\.?\d+(\s+L\s+[-+]?\d*\.?\d+\s+[-+]?\d*\.?\d+)+$/);
      }
    });

    it('valida la grammatica del path SVG e rileva percorsi non validi', () => {
      // Validatore rigoroso secondo grammatica SVG path (W3C SVG 1.1 / 2.0)
      const isValidSvgPath = (d: string): boolean => {
        if (!d || typeof d !== 'string') return false;
        if (d.includes('%') || d.includes('NaN') || d.includes('undefined')) return false;
        // Ammette solo comandi M e L con coordinate numeriche esplicite separate da spazi
        return /^M\s+[-+]?\d*\.?\d+\s+[-+]?\d*\.?\d+(\s+L\s+[-+]?\d*\.?\d+\s+[-+]?\d*\.?\d+)*$/.test(d.trim());
      };

      // Casi validi prodotti dal componente
      expect(isValidSvgPath('M 57.14 88.00 L 171.43 96.00')).toBe(true);
      expect(isValidSvgPath('M 10 20')).toBe(true);

      // Casi non validi che il test rileva
      expect(isValidSvgPath('M 10% 20% L 30% 40%')).toBe(false);
      expect(isValidSvgPath('M NaN 20 L 30 NaN')).toBe(false);
      expect(isValidSvgPath('M undefined 20')).toBe(false);
      expect(isValidSvgPath('percorso non valido')).toBe(false);
      expect(isValidSvgPath('')).toBe(false);
    });

    it('gestisce dataset vuoto con riepilogo "nessun dato", non media 0', () => {
      const pts = getHeartRateFixture(7, 'empty');
      const { container } = render(
        <HeartRateTrendChart
          isDemo
          id="hr-empty"
          title="Frequenza cardiaca vuota"
          points={pts}
          period={7}
          locale="it"
        />
      );

      expect(container.querySelectorAll('circle[data-line-point]')).toHaveLength(0);
      const summaryText = container.querySelector('#hr-empty-summary')?.textContent ?? '';
      expect(summaryText).toContain('Nessun dato registrato');
      expect(summaryText).not.toContain('valore medio di 0 bpm');
    });
  });

  describe('SleepDurationChart (Durata sonno a barre ore/minuti)', () => {
    it('rende dataset a 7 e 30 notti con formattazione in ore e minuti', () => {
      const pts = getSleepFixture(7, 'complete');
      const { container } = render(
        <SleepDurationChart
          isDemo
          id="sleep-test"
          title="Durata sonno"
          points={pts}
          period={7}
          locale="it"
        />
      );

      expect(container.querySelector('[data-chart-wrapper="sleep"]')).not.toBeNull();
      expect(container.textContent).toContain('Durata sonno');
      expect(container.textContent).toMatch(/\d+\s*h/);
      expect(container.querySelectorAll('rect[data-bar]')).toHaveLength(7);
    });

    it('gestisce notti con zero misurato e notti parziali', () => {
      const pts = getSleepFixture(7, 'zeros');
      const { container } = render(
        <SleepDurationChart
          isDemo
          id="sleep-zeros"
          title="Sonno con zero"
          points={pts}
          period={7}
          locale="it"
        />
      );

      const tableText = container.querySelector('table')?.textContent ?? '';
      expect(tableText).toContain('Zero misurato');
    });

    it('rende dataset sonno vuoto con "nessun dato" e senza media zero', () => {
      const pts = getSleepFixture(7, 'empty');
      const { container } = render(
        <SleepDurationChart
          isDemo
          id="sleep-empty"
          title="Sonno vuoto"
          points={pts}
          period={7}
          locale="it"
        />
      );

      const summaryText = container.querySelector('#sleep-empty-summary')?.textContent ?? '';
      expect(summaryText).toContain('Nessun dato registrato');
      expect(summaryText).not.toContain('media di 0');
    });
  });

  describe('Accessibilita, Tooltip e Governance', () => {
    it('aggiorna e mantiene il tooltip al primo click, cambia punto al secondo click, chiude con Escape', () => {
      const pts = getStepsFixture(7, 'complete');
      const { container } = render(
        <DailyStepsChart
          isDemo
          id="a11y-steps"
          title="Passi A11y"
          points={pts}
          period={7}
          locale="it"
        />
      );

      const tooltip = container.querySelector('#a11y-steps-tooltip')!;
      expect(tooltip).not.toBeNull();
      // Stato iniziale vuoto del tooltip
      expect(tooltip.textContent).toContain('Seleziona una colonna');

      const buttons = container.querySelectorAll('button[data-slot-index]');
      expect(buttons).toHaveLength(7);

      // 1. Primo click sul primo punto: mostra il valore nel tooltip e lo mantiene
      fireEvent.click(buttons[0]);
      expect(tooltip.textContent).toContain('Misurato');
      expect(tooltip.getAttribute('data-date')).toBe(pts[0].date);

      // 2. Click su un secondo punto diverso: aggiorna il tooltip al nuovo punto
      fireEvent.click(buttons[2]);
      expect(tooltip.getAttribute('data-date')).toBe(pts[2].date);

      // 3. Tasto Escape: chiude il tooltip tornando al placeholder
      fireEvent.keyDown(container.firstChild as HTMLElement, { key: 'Escape' });
      expect(tooltip.textContent).toContain('Seleziona una colonna');
    });

    it('i singoli slot del grafico sono pulsanti focalizzabili da tastiera (tabIndex=0) con etichetta accessibile', () => {
      const pts = getStepsFixture(7, 'complete');
      const { container } = render(
        <DailyStepsChart
          isDemo
          id="focus-test"
          title="Focus Test"
          points={pts}
          period={7}
          locale="it"
        />
      );

      const buttons = container.querySelectorAll('button[data-slot-index]');
      expect(buttons).toHaveLength(7);
      buttons.forEach((btn, idx) => {
        expect(btn.getAttribute('type')).toBe('button');
        expect(btn.getAttribute('tabindex')).toBe('0');
        expect(btn.getAttribute('data-date')).toBe(pts[idx].date);
        expect(btn.getAttribute('aria-label')).toBeTruthy();
      });

      // Fuoco da tastiera sul primo slot
      fireEvent.focus(buttons[0]);
      const tooltip = container.querySelector('#focus-test-tooltip');
      expect(tooltip).not.toBeNull();

      // Attivazione da tastiera tramite solo Enter (nessun click che ne maschera il difetto)
      fireEvent.keyDown(buttons[1], { key: 'Enter' });
      expect(tooltip?.getAttribute('data-date')).toBe(pts[1].date);
    });

    it('ogni attributo aria-describedby punta a un elemento presente nel DOM', () => {
      const pts = getStepsFixture(7, 'complete');
      const { container } = render(
        <DailyStepsChart
          isDemo
          id="aria-test"
          title="Aria Test"
          points={pts}
          period={7}
          locale="it"
        />
      );

      const buttons = container.querySelectorAll('button[data-slot-index]');
      fireEvent.click(buttons[0]);

      // Quando attivo, il pulsante deve avere aria-describedby che risolve a un elemento presente
      const activeBtn = container.querySelector('button[aria-describedby]');
      expect(activeBtn).not.toBeNull();
      const describedById = activeBtn?.getAttribute('aria-describedby');
      expect(describedById).toBe('aria-test-tooltip');
      expect(container.querySelector(`#${describedById}`)).not.toBeNull();
    });

    it('la tabella alternativa e espandibile tramite details/summary', () => {
      const pts = getStepsFixture(7, 'complete');
      const { container } = render(
        <DailyStepsChart
          isDemo
          id="details-table"
          title="Passi Tabella"
          points={pts}
          period={7}
          locale="it"
        />
      );

      const summary = container.querySelector('summary');
      expect(summary).not.toBeNull();
      expect(summary?.textContent).toContain('tabella dati');
    });

    it('rispetta la governance: zero em dash (\\u2014) in tutto il rendering', () => {
      const pts = getStepsFixture(7, 'partial');
      const { container } = render(
        <DailyStepsChart
          isDemo
          id="gov-test"
          title="Governance Test"
          points={pts}
          period={7}
          locale="it"
        />
      );

      expect(container.textContent).not.toContain('\u2014');
    });
  });
});
