/**
 * Regressioni della dashboard personale (prototipo, dati sintetici).
 *
 *  - T-DASH-ESITO-SYNC (AGGIORNAMENTO-29SET, DECISIONI 26): nessun esito di sync
 *    e nessuna metrica «minuti attivi» nei sorgenti;
 *  - colonne e parole vietate (DECISIONI 10): pressione e glicemia;
 *  - testi di paywall e accesso (DECISIONI 1-6, 8);
 *  - isolamento delle rotte di anteprima (spec U03, F06).
 *
 * La stessa scansione sul MARKUP reso sta in
 * components/web-dashboard/regression.test.tsx.
 */
import fs from 'node:fs';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

import {
  FORBIDDEN_PAYWALL,
  FORBIDDEN_VITALS,
  FORBIDDEN_WINNING_SOURCE_AND_DEVICE_KIND,
  SCAN_ROOTS,
  SYNC_OUTCOME_AND_ACTIVE_MINUTES,
  isRegressionFile,
} from './regression-patterns';

const ROOT = path.join(__dirname, '../..');

function walk(dir: string, out: string[] = []): string[] {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name === '.next' || entry.name.startsWith('.')) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else if (/\.(ts|tsx)$/.test(entry.name)) out.push(full);
  }
  return out;
}

const rel = (f: string) => path.relative(ROOT, f).split(path.sep).join('/');

/** Tutti i sorgenti e i test della dashboard, tranne i file di regressione stessi. */
const FILES = SCAN_ROOTS.flatMap((r) => walk(path.join(ROOT, r)))
  .map(rel)
  .filter((f) => !isRegressionFile(f));

const read = (f: string) => fs.readFileSync(path.join(ROOT, f), 'utf8');

function hits(list: ReadonlyArray<{ name: string; re: RegExp }>, files: string[]): string[] {
  const found: string[] = [];
  for (const f of files) {
    const lines = read(f).split('\n');
    lines.forEach((line, i) => {
      for (const { name, re } of list) if (re.test(line)) found.push(`${f}:${i + 1} [${name}] ${line.trim().slice(0, 100)}`);
    });
  }
  return found;
}

describe('la scansione vede davvero i sorgenti', () => {
  it('trova i file delle tre cartelle e non i file di regressione', () => {
    expect(FILES.length).toBeGreaterThan(40);
    for (const root of SCAN_ROOTS) expect(FILES.some((f) => f.startsWith(`${root}/`)), root).toBe(true);
    expect(FILES.some(isRegressionFile)).toBe(false);
    expect(FILES).toContain('lib/web-dashboard/model.ts');
    expect(FILES).toContain('components/web-dashboard/Gates.tsx');
  });

  it('i pattern riconoscono cio che devono (controprova: una scansione che non trova nulla non prova nulla)', () => {
    const samples: Array<[string, string]> = [
      ['Sync riuscito', 'sync riuscito'],
      ['Sync parziale', 'sync parziale'],
      ['ok/parziale', 'ok/parziale'],
      ['Partial sync', 'partial sync'],
      ['Minuti attivi', 'minuti attivi'],
      ['Active minutes', 'active minutes'],
      ['activeMinutes: Measure<number>', 'chiave activeMinutes'],
      ['syncLog: []', 'chiave syncLog'],
      ['data-sync-state="ok"', 'attributo data-sync-state'],
      ["partial('x', 0.5, 'sync_incomplete')", 'chiave sync_incomplete'],
      ["absent('permission_missing')", 'chiave permission_missing'],
      ["absent('read_error')", 'chiave read_error'],
      ['Permesso non concesso', 'etichetta Permesso non concesso'],
      ['Permission not granted', 'etichetta Permesso non concesso'],
      ['Lettura non riuscita', 'etichetta Lettura non riuscita'],
      ['Read failed', 'etichetta Lettura non riuscita'],
      ['Sorgenti e sync', 'voce di menu «Sorgenti e sync»'],
      ['Sources and sync', 'voce di menu «Sources and sync»'],
      ["sources: 'Sources & sync',", 'voce di menu «Sources and sync»'],
      ['Sync', 'voce di menu «Sync»'],
      ['Nessuna fonte collegata', 'stato «Nessuna fonte collegata»'],
      ['Nessuna fonte è collegata, quindi non c’è nulla da leggere.', 'stato «Nessuna fonte collegata»'],
      ['Nessuna sorgente collegata', 'stato «Nessuna fonte collegata»'],
      ['No source connected', 'stato «No source connected»'],
      ['No source is connected: there is nothing to track.', 'stato «No source connected»'],
      ['Le sorgenti sono collegate ma non è ancora arrivato nessun dato.', 'frase «sorgenti collegate ma...»'],
      ['Sources are connected but no data has arrived yet.', 'frase «sorgenti collegate ma...»'],
      ['neverWithSources: string;', 'chiave neverWithSources'],
      ['La fonte è collegata ma il sync non ha consegnato questi giorni.', 'frase «La fonte e collegata»'],
      ['The source is connected but the sync has not delivered these days.', 'frase «La fonte e collegata»'],
      ['Ultime ricezioni', 'ultime ricezioni'],
      ['Latest receipts', 'ultime ricezioni'],
      ['La lettura non è riuscita. Non significa che non ci siano dati.', 'frase della lettura fallita'],
    ];
    for (const [text, name] of samples) {
      expect(SYNC_OUTCOME_AND_ACTIVE_MINUTES.some(({ re }) => re.test(text)), `${text} -> ${name}`).toBe(true);
    }
    for (const text of ['blood_pressure_systolic', 'blood_glucose_mgdl', 'Pressione', 'Glicemia', 'glucose']) {
      expect(FORBIDDEN_VITALS.some(({ re }) => re.test(text)), text).toBe(true);
    }
    // e non scatta sugli stati dei DATI, che restano
    for (const text of ['Zero misurato', 'Parziale', 'Nessun dato', 'Dati parziali', 'Dati incompleti', 'Non ancora sincronizzato', 'Ultimo dato ricevuto', 'Nessun dato ricevuto', 'Non fornito dalla fonte', 'incomplete_coverage', 'Sorgenti dei dati', 'Data sources', 'Ultimo dato ricevuto per sorgente', 'Sync now', 'Sincronizza ora', 'Il sync si avvia dall’app', 'La fonte collegata non fornisce gli allenamenti.', 'Per questi giorni non è arrivato nessun dato. Non sono giorni a zero.']) {
      expect(SYNC_OUTCOME_AND_ACTIVE_MINUTES.some(({ re }) => re.test(text)), text).toBe(false);
    }
  });
});

describe('T-DASH-ESITO-SYNC: nessun esito di sync e nessun «minuti attivi» nei sorgenti', () => {
  it('nessuna occorrenza in lib, componenti, rotta di anteprima e test', () => {
    expect(hits(SYNC_OUTCOME_AND_ACTIVE_MINUTES, FILES)).toEqual([]);
  });

  it('il modello non ha piu esito, motivo o durata di un sync, ne minuti attivi', () => {
    const model = read('lib/web-dashboard/model.ts');
    expect(model).not.toMatch(/state:\s*SyncState|problem:|durationSeconds|activeMinutes/);
    expect(model).toMatch(/lastReceivedAt/);
    // per fonte restano solo il nome del vocabolario chiuso e l'ultimo dato ricevuto: nessuno stato per tipo,
    // ne «non fornito» (il server non distingue «non fornito» da «nessun dato»), ne permesso mancante, ne lettura fallita
    expect(model).not.toMatch(/not_provided|SourceTypeStatus|types:\s*SourceTypeStatus/);
    expect(model).toMatch(/export interface SourceRow \{\s*ref: SourceRef;\s*\/\*\*[^*]*\*\/\s*lastReceivedAt: string \| null;\s*\}/);
    const measure = read('lib/web-dashboard/measure.ts');
    expect(measure).toMatch(/PartialNote\s*=\s*'incomplete_coverage'\s*\|\s*'window_open'/);
    const copy = read('lib/web-dashboard/copy.ts');
    expect(copy).toMatch(/received:\s*\{\s*label:/);
  });
});

describe('fonte vincente e genere del dispositivo: fuori dal prototipo, il server non li sa', () => {
  it('nessuna occorrenza di chiavi, attributi o etichette in lib, componenti, rotta di anteprima e test', () => {
    expect(hits(FORBIDDEN_WINNING_SOURCE_AND_DEVICE_KIND, FILES)).toEqual([]);
  });

  it('i pattern riconoscono cio che devono (controprova)', () => {
    const samples: Array<[string, string]> = [
      ['stepsSource: WATCH,', 'chiave stepsSource'],
      ['winning: boolean;', 'chiavi winning'],
      ['const map = winnersByType(rows);', 'chiavi winning'],
      ['<p data-slot="winning-marker">', 'attributi'],
      ['data-kind="watch"', 'attributi'],
      ['import type { SourceKind } from', 'tipi SourceKind'],
      ['status: Record<SourceTypeStatus', 'tipi SourceKind'],
      ["not_provided: 'Non fornito',", 'stato «non fornito»'],
      ["kind: 'watch'", 'genere watch'],
      ["kind: { watch: 'Orologio', phone: 'Telefono', ring: 'Anello' },", 'genere watch'],
      ['Fonte vincente', 'etichette «Fonte vincente»'],
      ['Winning source', 'etichette «Fonte vincente»'],
      ['Sorgente vincitrice per i passi', 'etichette «Fonte vincente»'],
      ["'Vince {label}'", 'etichette «Vince'],
      ['Sorgente dei passi', 'titolo «Sorgente dei passi»'],
      ['Source of the steps', 'titolo «Sorgente dei passi»'],
      ['FitMesh sceglie una sola sorgente per i passi del giorno.', 'regola'],
      ['FitMesh does not add sources together.', 'regola'],
      ["label: 'Galaxy Watch'", 'nome di dispositivo'],
      ['<h3>{w.title}</h3>', 'titolo libero'],
      ["label: 'Telefono'", 'etichette di genere'],
      ['<p data-slot="one-source-note">', 'marcatore one-source'],
    ];
    for (const [text, name] of samples) {
      const names = FORBIDDEN_WINNING_SOURCE_AND_DEVICE_KIND.filter((p) => p.re.test(text)).map((p) => p.name);
      expect(
        names.some((n) => n.toLowerCase().includes(name.toLowerCase().slice(0, 10))),
        `${text} -> ${name} (scattati: ${names.join(' | ') || 'nessuno'})`,
      ).toBe(true);
    }
    // ...e non scatta sulle parole comuni e sul vocabolario chiuso
    for (const text of ['Ultimo dato ricevuto', 'Sorgenti dei dati', 'Anello Bluetooth', 'Health Connect', "l'app sul telefono", "sync sul telefono", "id: 'ring'", 'Un’altra sorgente', 'Another source']) {
      expect(FORBIDDEN_WINNING_SOURCE_AND_DEVICE_KIND.some((p) => p.re.test(text)), text).toBe(false);
    }
  });

  it('il modello non ha piu ne la fonte vincente dei passi, ne la sorgente di una notte, del cuore o di un allenamento', () => {
    const model = read('lib/web-dashboard/model.ts');
    expect(model).not.toMatch(/stepsSource|SourceKind|SourceTypeStatus/);
    expect(model).not.toMatch(/\bsource:\s*SourceRef/);
    expect(model).toMatch(/SOURCE_IDS = \['health_connect', 'healthkit', 'ring', 'strava', 'oura', 'suunto', 'other'\]/);
  });
});

describe('decisione 10: pressione e glicemia fuori dalla v1', () => {
  it('nessuna occorrenza di blood_pressure, blood_glucose, pressione, glicemia, glucose', () => {
    expect(hits(FORBIDDEN_VITALS, FILES)).toEqual([]);
  });
});

describe('paywall e accesso: testi e componenti', () => {
  it('nessun testo vietato nei sorgenti (prova terminata, opzioni, apri l app e riprova, acquisto, prezzi, listino)', () => {
    expect(hits(FORBIDDEN_PAYWALL, FILES.filter((f) => !/\.test\.tsx?$/.test(f)))).toEqual([]);
  });

  it('nessun pulsante di acquisto nei componenti di accesso: il paywall non ha nessun <button>', () => {
    const gates = read('components/web-dashboard/Gates.tsx');
    const paywall = gates.slice(gates.indexOf('export function PaywallGate'), gates.indexOf('export function VerificationGate'));
    expect(paywall.length).toBeGreaterThan(200);
    expect(paywall).not.toMatch(/<button|type="submit"|checkout|stripe|billing/i);
  });

  it('il controllo che non risponde ha «Riprova» e nessun paywall (non rompere)', () => {
    const gates = read('components/web-dashboard/Gates.tsx');
    const verification = gates.slice(gates.indexOf('export function VerificationGate'));
    expect(verification).toMatch(/g\.retry/);
    expect(verification).not.toMatch(/data-gate="paywall"|whoItems|PaywallGate/);
    const page = read('app/(frontend)/[locale]/dashboard-preview/[screen]/page.tsx');
    expect(page).toMatch(/verification_required[\s\S]{0,200}VerificationGate/);
  });

  it('un elenco degli accessi in access.ts e in DECISIONI: la prova non c e, l account di revisione si', () => {
    const access = read('lib/web-dashboard/access.ts');
    const list = /GRANTING_KINDS:[^=]*=\s*\[([^\]]*)\]/.exec(access)?.[1] ?? '';
    const kinds = [...list.matchAll(/'(\w+)'/g)].map((m) => m[1]).sort();
    expect(kinds).toEqual(['appReview', 'founder', 'grandfather', 'lifetime', 'subscription']);
    expect(kinds).not.toContain('trial');
    expect(kinds).not.toContain('none');
  });
});

describe('le rotte reali non importano l anteprima (spec U03, F06)', () => {
  const PREVIEW_ONLY = /(?:@\/|\.{1,2}\/)(?:[\w./-]*\/)?(?:lib|components)\/web-dashboard\b|(?:^|['"])\.{1,2}\/(?:params|access|synthetic|flag)['"]/;
  const ALLOWED = [/^lib\/web-dashboard\//, /^components\/web-dashboard\//, /^app\/\(frontend\)\/\[locale\]\/dashboard-preview\//];

  it('fuori da lib/web-dashboard, components/web-dashboard e dashboard-preview nessun file li importa', () => {
    const all = ['app', 'components', 'lib', 'test', 'tools']
      .filter((d) => fs.existsSync(path.join(ROOT, d)))
      .flatMap((d) => walk(path.join(ROOT, d)))
      .map(rel)
      .filter((f) => !ALLOWED.some((a) => a.test(f)));
    all.push(...['middleware.ts', 'payload.config.ts'].filter((f) => fs.existsSync(path.join(ROOT, f))));
    expect(all.length).toBeGreaterThan(200);
    const offenders = all.filter((f) => {
      const src = read(f);
      return /from\s+['"](?:@\/|(?:\.\.?\/)+)(?:[\w.-]+\/)*(?:lib|components)\/web-dashboard(?:\/|['"])/.test(src) || /import\(['"]@\/(?:lib|components)\/web-dashboard/.test(src);
    });
    expect(offenders).toEqual([]);
    expect(PREVIEW_ONLY.test("from '@/lib/web-dashboard/params'")).toBe(true);
  });

  it('il ramo foundation (lib/dashboard e la pagina reale) non usa params, access e synthetic', () => {
    const foundation = [...walk(path.join(ROOT, 'lib/dashboard')), ...walk(path.join(ROOT, 'app/(frontend)/[locale]/app/dashboard'))].map(rel);
    expect(foundation.length).toBeGreaterThan(3);
    for (const f of foundation) expect(read(f), f).not.toMatch(/web-dashboard|parsePreviewParams|SYNTHETIC_VIEWERS|buildDashboardResult/);
  });

  it('ogni pagina di anteprima chiude il cancello PRIMA di toccare parametri, accesso o dati', () => {
    const dir = path.join(ROOT, 'app/(frontend)/[locale]/dashboard-preview');
    const pages = walk(dir).map(rel).filter((f) => /(page|layout)\.tsx$/.test(f) && !isRegressionFile(f));
    expect(pages.length).toBe(3);
    for (const f of pages) {
      const src = read(f);
      // il cancello che risponde 404 (il layout lo legge anche in generateMetadata, per i metadati neutri)
      const gate = /isWebDashboardPrototypeEnabled\(\)[\s\S]{0,80}?notFound\(\)/.exec(src)?.index ?? -1;
      expect(gate, `${f}: manca il cancello con notFound()`).toBeGreaterThan(-1);
      // dopo il cancello, mai prima: parametri, accesso sintetico e dati
      for (const use of ['parsePreviewParams(', 'resolveDashboardAccess(', 'buildDashboardResult(', 'SYNTHETIC_VIEWERS[']) {
        const at = src.indexOf(use);
        if (at !== -1) expect(at, `${f}: ${use} prima del cancello`).toBeGreaterThan(gate);
      }
      expect(src, f).not.toMatch(/generateStaticParams|revalidate\s*=/);
    }
  });

  it('le rotte di anteprima sono sempre dinamiche (nessuna pagina costruita in fase di build con i dati dentro)', () => {
    for (const f of ['layout.tsx', 'page.tsx', '[screen]/page.tsx']) {
      expect(read(`app/(frontend)/[locale]/dashboard-preview/${f}`), f).toMatch(/export const dynamic = 'force-dynamic'/);
    }
  });
});
