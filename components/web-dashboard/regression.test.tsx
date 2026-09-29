/**
 * Regressioni sul MARKUP reso della dashboard personale (dati sintetici).
 * La stessa famiglia di controlli sui sorgenti sta in lib/web-dashboard/regression.test.ts.
 *
 *  - T-DASH-ESITO-SYNC: nessun esito di sync e nessun «minuti attivi» in nessuna
 *    schermata, scenario o lingua; la schermata Fonti mostra «ultimo dato ricevuto»;
 *  - pressione e glicemia fuori dalla v1;
 *  - paywall: la prova non abilita la dashboard, elenco di chi accede come in
 *    DECISIONI, «Ripristina acquisti», nessun acquisto ne prezzo, errore con «Riprova».
 */
import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { sharedCopy } from '@/lib/web-dashboard/copy';
import { SCENARIO_KEYS, SCREENS } from '@/lib/web-dashboard/model';
import { FORBIDDEN_PAYWALL, FORBIDDEN_VITALS, SYNC_OUTCOME_AND_ACTIVE_MINUTES } from '@/lib/web-dashboard/regression-patterns';

import { LoginGate, PaywallGate, VerificationGate } from './Gates';
import { DashboardShell } from './Shell';
import { SCREEN_REGISTRY } from './screens/registry';
import { screenProps } from './screens/test-utils';

afterEach(cleanup);

// it e en hanno copy propria; de usa l'inglese (una lingua senza copy propria)
const LOCALES = ['it', 'en', 'de'] as const;
const READY = SCENARIO_KEYS.filter((s) => s !== 'loading' && s !== 'error');

const found = (list: ReadonlyArray<{ name: string; re: RegExp }>, html: string, text: string) =>
  list.filter(({ re }) => re.test(html) || re.test(text)).map(({ name }) => name);

describe('markup reso: nessun esito di sync, nessun «minuti attivi», niente pressione ne glicemia', () => {
  for (const screen of SCREENS) {
    for (const lc of LOCALES) {
      it(`${screen} / ${lc}: ogni scenario, e lo scheletro`, () => {
        for (const sc of READY) {
          const props = screenProps(sc, { lc });
          const { container, unmount } = render(<SCREEN_REGISTRY_SCREEN screen={screen} {...props} />);
          const html = container.innerHTML;
          const text = container.textContent ?? '';
          expect(html.length, `${screen}/${sc}`).toBeGreaterThan(200);
          expect(found(SYNC_OUTCOME_AND_ACTIVE_MINUTES, html, text), `${screen}/${sc}/${lc}`).toEqual([]);
          expect(found(FORBIDDEN_VITALS, html, text), `${screen}/${sc}/${lc}`).toEqual([]);
          unmount();
        }
        const Loading = SCREEN_REGISTRY[screen].Loading;
        const { container } = render(<Loading lc={lc} ui={screenProps('ok', { lc }).ui} />);
        expect(found([...SYNC_OUTCOME_AND_ACTIVE_MINUTES, ...FORBIDDEN_VITALS], container.innerHTML, container.textContent ?? '')).toEqual([]);
      });
    }
  }

  it('la cornice (barra, chip dell ultimo dato, navigazione) non ha esiti di sync', () => {
    for (const lc of LOCALES) {
      for (const sc of READY) {
        const props = screenProps(sc, { lc });
        const { container, unmount } = render(
          <DashboardShell copy={props.copy} lc={lc} ui={props.ui} screen="overview" params={props.params} receipt={props.data.receipt} title="t">
            <p>corpo</p>
          </DashboardShell>,
        );
        expect(found([...SYNC_OUTCOME_AND_ACTIVE_MINUTES, ...FORBIDDEN_VITALS], container.innerHTML, container.textContent ?? ''), `${sc}/${lc}`).toEqual([]);
        const chip = container.querySelector('[data-slot="receipt-chip"]');
        expect(chip, `${sc}/${lc}`).not.toBeNull();
        const label = sc === 'empty' ? props.copy.received.never : props.copy.received.label;
        expect(chip?.textContent, `${sc}/${lc}`).toContain(label);
        unmount();
      }
    }
  });

  it('gli stati dei DATI restano: misurato, zero misurato, parziale e assente si vedono ancora', () => {
    const seen = new Set<string>();
    for (const sc of READY) {
      for (const screen of SCREENS) {
        const props = screenProps(sc);
        const { container, unmount } = render(<SCREEN_REGISTRY_SCREEN screen={screen} {...props} />);
        container.querySelectorAll('[data-measure-state]').forEach((n) => seen.add(n.getAttribute('data-measure-state') ?? ''));
        unmount();
      }
    }
    for (const state of ['measured', 'measured-zero', 'partial', 'absent']) expect(seen.has(state), state).toBe(true);
  });

  it('la schermata Fonti mostra «Ultimo dato ricevuto» per fonte, con l ora, e nessun esito', () => {
    for (const lc of ['it', 'en'] as const) {
      const props = screenProps('ok', { lc });
      const { container } = render(<SCREEN_REGISTRY_SCREEN screen="sources" {...props} />);
      const perSource = container.querySelectorAll('[data-slot="source-card"] [data-slot="source-last-received"]');
      expect(perSource.length).toBe(props.data.sources.length);
      const label = sharedCopy(props.ui).received.label;
      for (const card of container.querySelectorAll('[data-slot="source-card"]')) {
        expect(card.textContent).toContain(label);
        expect(card.querySelector('time')?.getAttribute('datetime')).toMatch(/^2026-09-24T09:28/);
        expect(card.textContent).toMatch(/\d{2}:\d{2}/);
      }
      cleanup();
    }
  });
});

describe('la schermata Fonti non si chiama «sync»: il server non ha una cronologia delle sincronizzazioni', () => {
  const EXPECTED = { it: 'Sorgenti dei dati', en: 'Data sources', de: 'Data sources' } as const;

  for (const lc of LOCALES) {
    it(`${lc}: menu, titolo della schermata e chip portano il nome nuovo, mai «sync»`, () => {
      const props = screenProps('ok', { lc });
      // il tedesco non ha copy propria nel prototipo: ricade sull'inglese («Datenquellen» solo quando ci sara una copy tedesca)
      expect(props.copy.nav.sources).toBe(EXPECTED[lc]);
      for (const [key, label] of Object.entries(props.copy.nav)) expect(label, `nav.${key}`).not.toMatch(/sync/i);

      const { container } = render(
        <DashboardShell copy={props.copy} lc={lc} ui={props.ui} screen="sources" params={props.params} receipt={props.data.receipt} title={props.copy.nav.sources}>
          <p>corpo</p>
        </DashboardShell>,
      );
      // il titolo della schermata (h1) e ogni voce del menu, laterale e mobile
      expect(container.querySelector('h1')?.textContent).toBe(EXPECTED[lc]);
      const navLabels = [...container.querySelectorAll('nav a')].map((a) => a.textContent ?? '');
      expect(navLabels.filter((t) => t === EXPECTED[lc]).length).toBeGreaterThanOrEqual(1);
      for (const t of navLabels) expect(t, t).not.toMatch(/sync/i);
      expect(found(SYNC_OUTCOME_AND_ACTIVE_MINUTES, container.innerHTML, container.textContent ?? '')).toEqual([]);
    });
  }

  it('i link «vai alle sorgenti» delle altre schermate usano lo stesso nome nuovo', () => {
    for (const lc of ['it', 'en'] as const) {
      const props = screenProps('stale', { lc });
      for (const screen of ['overview', 'activity', 'heart'] as const) {
        const { container, unmount } = render(<SCREEN_REGISTRY_SCREEN screen={screen} {...props} />);
        const links = [...container.querySelectorAll('a')].filter((a) => (a.getAttribute('href') ?? '').includes('/sources'));
        expect(links.length, `${screen}/${lc}`).toBeGreaterThan(0);
        for (const a of links) expect((a.textContent ?? '') + (a.getAttribute('aria-label') ?? ''), `${screen}/${lc}`).not.toMatch(/sync/i);
        unmount();
      }
    }
  });
});

/** Rende una schermata dal registro (le schermate sono funzioni pure delle props). */
function SCREEN_REGISTRY_SCREEN({ screen, ...props }: { screen: (typeof SCREENS)[number] } & ReturnType<typeof screenProps>) {
  const S = SCREEN_REGISTRY[screen].Screen;
  return <>{S(props)}</>;
}

describe('paywall: testi e componenti', () => {
  const reasons = ['trial', 'expired', 'none'] as const;

  function paywall(reason: (typeof reasons)[number], lc: string) {
    const props = screenProps('ok', { lc });
    return { props, ...render(<PaywallGate copy={props.copy} lc={lc} screen="overview" params={props.params} reason={reason} />) };
  }

  for (const lc of LOCALES) {
    for (const reason of reasons) {
      it(`${reason} / ${lc}: nessun testo vietato, nessun acquisto, nessun prezzo`, () => {
        const { container } = paywall(reason, lc);
        const html = container.innerHTML;
        const text = container.textContent ?? '';
        expect(found(FORBIDDEN_PAYWALL, html, text)).toEqual([]);
        expect(found(SYNC_OUTCOME_AND_ACTIVE_MINUTES, html, text)).toEqual([]);
        expect(container.querySelectorAll('button, form, input')).toHaveLength(0);
        expect(container.querySelector(`[data-gate="paywall"][data-paywall-reason="${reason}"]`)).not.toBeNull();
        // nel corpo, solo link verso aree che restano sempre raggiungibili, mai un link di acquisto
        for (const a of container.querySelectorAll('main a')) expect(a.getAttribute('href') ?? '').toMatch(new RegExp(`^/${lc}/app/(settings|export)$`));
      });
    }
  }

  it('la prova gratuita non comprende la dashboard, e non dice che «e terminata» come se la comprendesse', () => {
    const it = paywall('trial', 'it').container;
    expect(it.textContent).toMatch(/prova gratuita[^.]*non comprende la dashboard web/i);
    cleanup();
    const en = paywall('trial', 'en').container;
    expect(en.textContent).toMatch(/free trial[^.]*does not include the web dashboard/i);
    cleanup();
    for (const reason of reasons) {
      for (const lc of ['it', 'en']) {
        const c = paywall(reason, lc).container;
        expect(c.textContent, `${reason}/${lc}`).not.toMatch(/prova (è|e') terminata|trial has ended|trial is over/i);
        cleanup();
      }
    }
  });

  it('un rinnovo o un acquisto non riconosciuto rimanda a «Ripristina acquisti» nell app, mai a «apri l app e riprova»', () => {
    for (const [lc, phrase] of [['it', 'Ripristina acquisti'], ['en', 'Restore purchases']] as const) {
      for (const reason of ['expired', 'none'] as const) {
        const { container } = paywall(reason, lc);
        expect(container.textContent, `${reason}/${lc}`).toContain(phrase);
        expect(container.textContent).toMatch(lc === 'it' ? /schermata Pro/ : /Pro screen/);
        cleanup();
      }
    }
  });

  it('chi accede coincide con DECISIONI: abbonamento attivo, lifetime acquistato, Founder, tester con grant valido, altri titoli Pro validi', () => {
    const expected = {
      it: ['Abbonamento attivo', 'Pro a vita (Lifetime) acquistato', 'Founder', 'Tester con accesso Pro valido', 'Ogni altro titolo Pro valido su questo account, esclusa la prova gratuita'],
      en: ['An active subscription', 'A purchased lifetime Pro (Lifetime)', 'Founder', 'A tester with valid Pro access', 'Any other valid Pro entitlement on this account, except the free trial'],
    };
    for (const lc of ['it', 'en'] as const) {
      const { container } = paywall('none', lc);
      const items = [...container.querySelectorAll('[data-gate="paywall"] ul li')].map((li) => li.textContent?.trim());
      expect(items, lc).toEqual(expected[lc]);
      // la prova non rientra: solo l ultima voce la nomina, e per escluderla
      expect(items.slice(0, -1).join(' ')).not.toMatch(/prova|trial/i);
      cleanup();
    }
    // la lingua senza copy propria usa l inglese
    const de = paywall('none', 'de').container;
    expect([...de.querySelectorAll('[data-gate="paywall"] ul li')].map((li) => li.textContent?.trim())).toEqual(expected.en);
  });

  it('l ultima voce di chi accede esclude la prova gratuita, in it, en e de (chi e in prova vede Pro nell app)', () => {
    const exclusion = { it: /esclusa la prova gratuita$/, en: /except the free trial$/, de: /except the free trial$/ };
    for (const lc of LOCALES) {
      const { container } = paywall('none', lc);
      const items = [...container.querySelectorAll('[data-gate="paywall"] ul li')].map((li) => li.textContent?.trim() ?? '');
      expect(items[items.length - 1], lc).toMatch(exclusion[lc]);
      cleanup();
    }
  });

  it('i testi del paywall non dicono che la dashboard «e disponibile»: richiede un titolo Pro valido', () => {
    const available = /è disponibile|e' disponibile|is available|ist verfügbar/i;
    const requires = { it: /La dashboard web richiede un abbonamento attivo, Pro a vita o un altro titolo Pro valido/, en: /The web dashboard requires an active subscription, lifetime Pro or another valid Pro entitlement/, de: /The web dashboard requires an active subscription, lifetime Pro or another valid Pro entitlement/ };
    for (const lc of LOCALES) {
      for (const reason of reasons) {
        const { container } = paywall(reason, lc);
        const text = container.textContent ?? '';
        expect(text, `${reason}/${lc}`).not.toMatch(available);
        if (reason !== 'expired') expect(text, `${reason}/${lc}`).toMatch(requires[lc]);
        cleanup();
      }
      // anche nel copy grezzo, senza passare dal rendering
      const g = sharedCopy(lc as 'it').gates.paywall;
      expect(JSON.stringify(g), lc).not.toMatch(available);
    }
  });

  it('impostazioni, export e cancellazione dell account restano raggiungibili dal paywall', () => {
    const { container } = paywall('none', 'it');
    const hrefs = [...container.querySelectorAll('main a')].map((a) => a.getAttribute('href'));
    expect(hrefs).toEqual(expect.arrayContaining(['/it/app/settings', '/it/app/export']));
  });

  it('il controllo che non risponde mostra errore con «Riprova» e mai il paywall', () => {
    for (const lc of ['it', 'en'] as const) {
      for (const reason of ['read_failed', 'unknown_contract_version'] as const) {
        const props = screenProps('ok', { lc });
        const { container, unmount } = render(
          <VerificationGate copy={props.copy} lc={lc} screen="overview" params={props.params} reason={reason} retryHref="/x" />,
        );
        expect(container.querySelector('[data-gate="paywall"]')).toBeNull();
        expect(container.querySelector('[data-gate="verification"]')?.getAttribute('role')).toBe('alert');
        expect(container.textContent).toContain(lc === 'it' ? 'Riprova' : 'Try again');
        expect(container.querySelector('a[href="/x"]')).not.toBeNull();
        expect(found(FORBIDDEN_PAYWALL, container.innerHTML, container.textContent ?? '')).toEqual([]);
        unmount();
      }
    }
  });

  it('il login non ha prezzi, acquisti ne testi di paywall', () => {
    const props = screenProps('ok');
    const { container } = render(<LoginGate copy={props.copy} lc="it" screen="overview" params={props.params} />);
    expect(found(FORBIDDEN_PAYWALL, container.innerHTML, container.textContent ?? '')).toEqual([]);
  });
});
