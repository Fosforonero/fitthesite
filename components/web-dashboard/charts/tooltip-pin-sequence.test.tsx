import { act, cleanup, render, fireEvent } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { DailyStepsChart } from './DailyStepsChart';
import { getStepsFixture } from '@/lib/web-dashboard/fixtures/charts-fixtures';

afterEach(cleanup);

// F-1 (REVISIONE-GRAFICI-UI.md): sequenza REALE di un click di mouse su <button>
// in Chromium. Il puntatore entra (hover), poi pointerdown/mousedown, poi il
// bottone prende il fuoco (il precedente lo perde), poi pointerup/mouseup e
// infine click. `el.focus()` sposta davvero document.activeElement e fa partire
// blur/focusout sul precedente e focus/focusin sul nuovo, come nel browser.
// @testing-library/user-event non e' fra le dipendenze: eventi in ordine a mano.
function realMouseClick(el: HTMLElement) {
  const prev = document.activeElement as HTMLElement | null;
  if (prev && prev !== el && prev !== document.body) fireEvent.mouseLeave(prev);
  fireEvent.mouseEnter(el);
  fireEvent.pointerDown(el);
  fireEvent.mouseDown(el);
  act(() => {
    el.focus();
  });
  fireEvent.pointerUp(el);
  fireEvent.mouseUp(el);
  fireEvent.click(el);
}

function setup(id: string) {
  const pts = getStepsFixture(7, 'complete');
  const { container } = render(
    <div>
      <input data-outside />
      <DailyStepsChart id={id} title="Passi F-1" points={pts} period={7} locale="it" />
    </div>,
  );
  const tooltip = container.querySelector(`#${id}-tooltip`)!;
  const buttons = Array.from(container.querySelectorAll<HTMLButtonElement>('button[data-slot-index]'));
  const outside = container.querySelector<HTMLInputElement>('[data-outside]')!;
  return { pts, tooltip, buttons, outside };
}

// Fissato = resta anche quando il puntatore esce e il fuoco va altrove.
function expectPinnedOn(tooltip: Element, btn: HTMLElement, outside: HTMLElement, date: string) {
  expect(tooltip.getAttribute('data-date')).toBe(date);
  fireEvent.mouseLeave(btn);
  act(() => {
    outside.focus();
  });
  expect(tooltip.getAttribute('data-date')).toBe(date);
}

describe('F-1: tooltip fissato con la sequenza reale focus/click', () => {
  it('click su un ALTRO giorno con tooltip fissato: il tooltip si sposta e resta fissato', () => {
    const { pts, tooltip, buttons, outside } = setup('f1-move');
    realMouseClick(buttons[0]);
    expect(tooltip.getAttribute('data-date')).toBe(pts[0].date);
    realMouseClick(buttons[2]);
    expectPinnedOn(tooltip, buttons[2], outside, pts[2].date);
  });

  it('click di nuovo sullo STESSO giorno dopo lo spostamento: chiusura volontaria', () => {
    const { pts, tooltip, buttons } = setup('f1-same');
    realMouseClick(buttons[0]);
    realMouseClick(buttons[2]);
    expect(tooltip.getAttribute('data-date')).toBe(pts[2].date);
    realMouseClick(buttons[2]);
    expect(tooltip.getAttribute('data-date')).toBeNull();
    expect(tooltip.textContent).toContain('Seleziona una colonna');
  });

  it('Escape chiude il tooltip fissato dopo lo spostamento', () => {
    const { pts, tooltip, buttons } = setup('f1-esc');
    realMouseClick(buttons[0]);
    realMouseClick(buttons[2]);
    expect(tooltip.getAttribute('data-date')).toBe(pts[2].date);
    fireEvent.keyDown(buttons[2], { key: 'Escape' });
    expect(tooltip.getAttribute('data-date')).toBeNull();
  });

  it('click su A dopo B: il tooltip torna su A e resta fissato', () => {
    const { pts, tooltip, buttons, outside } = setup('f1-back');
    realMouseClick(buttons[0]);
    realMouseClick(buttons[2]);
    expect(tooltip.getAttribute('data-date')).toBe(pts[2].date);
    realMouseClick(buttons[0]);
    expectPinnedOn(tooltip, buttons[0], outside, pts[0].date);
  });

  it('hover e focus senza click non cambiano il giorno fissato', () => {
    const { pts, tooltip, buttons } = setup('f1-hover');
    realMouseClick(buttons[1]);
    expect(tooltip.getAttribute('data-date')).toBe(pts[1].date);
    fireEvent.mouseLeave(buttons[1]);
    fireEvent.mouseEnter(buttons[4]);
    expect(tooltip.getAttribute('data-date')).toBe(pts[1].date);
    act(() => {
      buttons[5].focus();
    });
    expect(tooltip.getAttribute('data-date')).toBe(pts[1].date);
  });
});
