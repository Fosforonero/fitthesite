/**
 * PROVA APPLICATIVA dell'export web: a differenza dei test del repository usa un BACKEND VERO.
 *
 * Cosa e' VERO qui:
 *   - Postgres 17 ricostruito dalle 126 migration (policy RLS vere della catena, dati sintetici);
 *   - PostgREST vero (immagine supabase/postgrest) che verifica la firma del JWT e applica la RLS;
 *   - le STESSE QUERY che @supabase/supabase-js genera per il componente (filtri eq/or, order, offset/limit,
 *     Prefer count=exact, insert, upsert on_conflict), eseguite dal client vero verso PostgREST;
 *   - il componente VERO ExportDataClient (e, come CONTROLLO, quello di main b85870a).
 * Cosa e' FINTO o NON esercitato, e va dichiarato:
 *   - l'identita': un JWT sintetico (`role: authenticated`, `sub` dell'attore) firmato col segreto del PostgREST di
 *     prova; non c'e' GoTrue e `auth.getUser()` e' uno STUB: i controlli di cambio sessione del componente NON sono
 *     esercitati qui (li coprono i test con mock);
 *   - il `createClient` reale dell'app (@supabase/ssr, cookie, refresh del token) NON gira: e' sostituito da un
 *     oggetto {from, auth.getUser}; le richieste non sono quelle del browser (niente /rest/v1 di Kong, apikey e
 *     Authorization diversi): sono le stesse QUERY, non gli stessi byte;
 *   - il browser: Blob, URL.createObjectURL e il click di download sono simulati in jsdom: si prova cio' che il
 *     componente scaricherebbe, non il comportamento di un browser;
 *   - `rowBelongsToOwner` (la seconda difesa sulle righe) NON e' provata da qui: un backend vero rispetta il filtro
 *     sul proprietario, quindi togliere quel controllo lascia la prova verde; lo coprono i test con mock;
 *   - versioni: Postgres 17.10 (la config locale di Supabase dice major_version 15) e PostgREST v14.15 (la stessa
 *     dello stack locale; quella di produzione e' ignota); `max_rows` 1000 impostato a mano.
 * NON e' una prova sulla produzione: la RLS e' quella delle migration, non quella viva.
 * NON e' un test SQL (supabase/tests/reset-pg17) e non e' un test con mock (ExportDataClient.test.tsx).
 */
import { createHmac } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';

import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { createClient as createSupabase } from '@supabase/supabase-js';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { EXPORT_COPY } from '@/app/(frontend)/[locale]/app/export/copy';
import { EXPORT_TABLES, type ExportTable } from '@/lib/privacy/export-scope';

import { ExportDataClient as ComponenteMain } from './.generato/ExportDataClientMain';
import { verificaExport } from './verifica-export-json';
import { ExportDataClient } from '@/app/(frontend)/[locale]/app/export/ExportDataClient';

const ctx = vi.hoisted(() => ({ client: null as unknown }));
vi.mock('@/lib/supabase/client', () => ({ createClient: () => ctx.client }));

const URL_POSTGREST = process.env.POSTGREST_URL ?? '';
const SEGRETO = process.env.JWT_SECRET ?? '';
const PG = process.env.PG_CONTAINER ?? '';

const ATTORI = {
  alice: 'ee000000-0000-4000-8000-000000000001',
  bob: 'ee000000-0000-4000-8000-000000000002',
  carla: 'ee000000-0000-4000-8000-000000000003',
  dan: 'ee000000-0000-4000-8000-000000000004',
  erin: 'ee000000-0000-4000-8000-000000000005',
  admin: 'ee000000-0000-4000-8000-000000000006',
  frank: 'ee000000-0000-4000-8000-000000000007',
  gina: 'ee000000-0000-4000-8000-000000000008',
  zed: 'ee000000-0000-4000-8000-000000000009',
} as const;
type Attore = keyof typeof ATTORI;

const b64 = (o: unknown) => Buffer.from(JSON.stringify(o)).toString('base64url');
function jwtDi(sub: string): string {
  const h = b64({ alg: 'HS256', typ: 'JWT' });
  const p = b64({ role: 'authenticated', sub, aud: 'authenticated', exp: Math.floor(Date.now() / 1000) + 3600 });
  return `${h}.${p}.${createHmac('sha256', SEGRETO).update(`${h}.${p}`).digest('base64url')}`;
}

/** Client supabase-js VERO verso il PostgREST di prova; supabase-js antepone /rest/v1 (Kong), qui lo togliamo. */
function clientDi(attore: Attore) {
  const sub = ATTORI[attore];
  const reale = createSupabase('http://postgrest.locale', 'chiave-sintetica', {
    auth: { persistSession: false, autoRefreshToken: false },
    global: {
      headers: { Authorization: `Bearer ${jwtDi(sub)}` },
      fetch: (input, init) => fetch(String(input).replace('http://postgrest.locale/rest/v1', URL_POSTGREST), init),
    },
  });
  return {
    from: (tabella: string) => reale.from(tabella),
    auth: { getUser: async () => ({ data: { user: { id: sub, email: `synth-${attore}@example.invalid` } }, error: null }) },
  };
}

function psql(sql: string): string {
  return execFileSync('docker', ['exec', PG, 'psql', '-U', 'postgres', '-d', 'ricostruzione', '-Atc', sql], {
    encoding: 'utf8',
  }).trim();
}

type Riga = Record<string, unknown>;

/** Salva il file scaricato in .generato/ (ignorato da git) e lo fa controllare dal verificatore OFFLINE. */
function salvaEVerifica(nome: string): ReturnType<typeof verificaExport> {
  const dir = path.join(__dirname, '.generato');
  mkdirSync(dir, { recursive: true });
  const testo = blobParts.join('');
  writeFileSync(path.join(dir, `export-${nome}.json`), testo);
  return verificaExport(testo);
}
const rossi = (esiti: ReturnType<typeof verificaExport>) => esiti.filter((e) => !e.ok).map((e) => e.nome);
type Bundle = {
  account: { id: string };
  data: Record<string, Riga[] | { error: string }>;
  incomplete?: boolean;
  unavailable_tables?: string[];
};

let blobParts: string[] = [];
let scaricati: string[] = [];

beforeEach(() => {
  blobParts = [];
  scaricati = [];
  vi.stubGlobal(
    'Blob',
    class {
      constructor(parts: string[]) {
        blobParts.push(...parts);
      }
    },
  );
  URL.createObjectURL = vi.fn(() => 'blob:prova');
  URL.revokeObjectURL = vi.fn();
  vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (this: HTMLAnchorElement) {
    scaricati.push(this.download);
  });
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

async function esporta(attore: Attore, Componente: typeof ExportDataClient = ExportDataClient) {
  ctx.client = clientDi(attore);
  const t = EXPORT_COPY.it;
  render(<Componente locale="it" t={t} />);
  fireEvent.click(screen.getByRole('button', { name: t.cta }));
  await waitFor(
    () => {
      const finito =
        screen.queryByRole('alert') !== null ||
        screen.queryByRole('status') !== null ||
        screen.queryByText(new RegExp(t.doneTitle)) !== null;
      expect(finito).toBe(true);
    },
    { timeout: 60000 },
  );
  const bundle = blobParts.length > 0 ? (JSON.parse(blobParts.join('')) as Bundle) : null;
  return { bundle, t };
}

/** Righe di `bundle` il cui proprietario NON e' l'attore (le tabelle non disponibili e caregiver_links sono saltate). */
function righeAltrui(bundle: Bundle, attore: Attore): string[] {
  const mio = ATTORI[attore];
  const colonna: Partial<Record<ExportTable, string>> = {
    profiles: 'id', privacy_consents: 'user_id', user_settings: 'user_id', devices: 'user_id', fitness_metrics: 'user_id',
    workouts: 'user_id', group_members: 'user_id', b2c_subscriptions: 'user_id', challenge_participants: 'user_id',
    challenge_scores: 'user_id', user_roles: 'user_id',
  };
  const trovate: string[] = [];
  for (const tabella of EXPORT_TABLES) {
    const righe = bundle.data[tabella];
    const col = colonna[tabella];
    if (!Array.isArray(righe) || !col) continue;
    for (const r of righe) if (r[col] !== mio) trovate.push(`${tabella}:${String(r[col])}`);
  }
  return trovate;
}

describe('PROVA APPLICATIVA (PostgREST + RLS veri): identita\' authenticated sintetica', () => {
  it('l\'ambiente e\' quello dichiarato: PostgREST raggiungibile, RLS attiva, errori veri della catena', async () => {
    expect(URL_POSTGREST).toMatch(/^http:\/\/127\.0\.0\.1:\d+$/);
    // RLS attiva sulle tabelle dell'export
    for (const t of EXPORT_TABLES) {
      expect(psql(`select relrowsecurity from pg_class where oid = 'public.${t}'::regclass`), t).toBe('t');
    }
    // gli errori veri che il client incontra: ricorsione 42P17 sulle sfide e INSERT su audit_logs respinto
    const c = clientDi('alice');
    const sfide = await c.from('challenge_participants').select('user_id').eq('user_id', ATTORI.alice);
    expect(sfide.error?.code).toBe('42P17');
    const audit = await c.from('audit_logs').insert({ user_id: ATTORI.alice, action: 'data_exported', detail: {} } as never);
    expect(audit.error?.code).toBe('42501');
  });

  it('alice (nessuna relazione): scarica i dati accessibili, il file e\' marcato incompleto per le sfide, nessuna riga altrui, scritture reali', async () => {
    const { bundle, t } = await esporta('alice');
    expect(scaricati).toHaveLength(1);
    expect(bundle).not.toBeNull();
    const b = bundle!;
    // dati accessibili: le 10 tabelle leggibili sono array; alice ha righe in 8 e nessuna in caregiver_links e group_members
    const SENZA_RIGHE: ExportTable[] = ['caregiver_links', 'group_members'];
    for (const tabella of EXPORT_TABLES) {
      if (tabella === 'challenge_participants' || tabella === 'challenge_scores') continue;
      const righe = b.data[tabella];
      expect(Array.isArray(righe), `${tabella} deve essere leggibile`).toBe(true);
      if (SENZA_RIGHE.includes(tabella)) expect(righe as Riga[], tabella).toEqual([]);
      else expect((righe as Riga[]).length, tabella).toBeGreaterThan(0);
    }
    // tabelle illeggibili (42P17 vero): marcate, senza il testo dell'errore
    expect(b.data.challenge_participants).toEqual({ error: 'unavailable' });
    expect(b.data.challenge_scores).toEqual({ error: 'unavailable' });
    expect(b.incomplete).toBe(true);
    expect(b.unavailable_tables).toEqual(['challenge_participants', 'challenge_scores']);
    expect(blobParts.join('')).not.toMatch(/infinite recursion|42P17|policy/i);
    // nessuna riga altrui, nessun dato sensibile escluso dalla proiezione
    expect(righeAltrui(b, 'alice')).toEqual([]);
    const testo = blobParts.join('');
    for (const altro of Object.keys(ATTORI).filter((n) => n !== 'alice')) {
      expect(testo, `id di ${altro} nel file`).not.toContain(ATTORI[altro as Attore]);
    }
    expect(testo).not.toContain('SYNTH-FCM-TOKEN');
    expect(testo).not.toContain('SYNTH-NOTE');
    // la pagina lo dichiara, con la categoria nella lingua dell'utente e senza errori tecnici
    const avviso = screen.getByRole('status');
    expect(avviso).toHaveTextContent(t.incompleteTitle);
    expect(avviso).toHaveTextContent(t.categories.challenges);
    expect(avviso.textContent ?? '').not.toMatch(/challenge_|42P17|recursion|unavailable|policy|error/i);
    // il messaggio di successo («✓ Download avviato») NON c'e': il titolo dell'avviso inizia con le stesse parole ma e' un altro testo
    expect(screen.queryByText(`✓ ${t.doneTitle}`)).not.toBeInTheDocument();
    expect(document.body.textContent ?? '').not.toMatch(/copia completa/i);
    // scritture reali tramite PostgREST: l'audit e' respinto dalla RLS (il file e' consegnato lo stesso), il timbro e' scritto
    expect(psql(`select count(*) from public.audit_logs where user_id = '${ATTORI.alice}' and action = 'data_exported'`)).toBe('0');
    // il file e' INCOMPLETO: si registra la richiesta, NON il «completato»
    expect(psql(`select data_export_requested_at is not null from public.privacy_consents where user_id = '${ATTORI.alice}'`)).toBe('t');
    expect(psql(`select data_export_completed_at is null from public.privacy_consents where user_id = '${ATTORI.alice}'`)).toBe('t');
    // il verificatore OFFLINE dice che il file e' conforme...
    expect(rossi(salvaEVerifica('alice-candidato'))).toEqual([]);
    // ...e ROSSO su cinque varianti guaste dello stesso file (controllo negativo del verificatore stesso)
    const sano = JSON.parse(blobParts.join('')) as Bundle & Record<string, unknown>;
    const clone = () => JSON.parse(JSON.stringify(sano)) as typeof sano;
    const varianti: Array<[string, (b: typeof sano) => void]> = [
      ['riga altrui', (b) => (b.data.devices as Riga[]).push({ ...(b.data.devices as Riga[])[0], user_id: ATTORI.bob })],
      ['colonna sensibile', (b) => ((b.data.devices as Riga[])[0] as Riga).fcm_token = 'SYNTH-FCM-TOKEN-x'],
      ['incompletezza non dichiarata', (b) => { delete b.incomplete; }],
      ['testo tecnico del database', (b) => { (b.data.challenge_scores as unknown as Riga).error = 'infinite recursion detected in policy'; }],
      ['controparte nei legami', (b) => { (b.data.caregiver_links as Riga[]).push({ caregiver_id: ATTORI.carla, subject_id: ATTORI.alice }); }],
    ];
    for (const [nome, guasta] of varianti) {
      const b = clone();
      guasta(b);
      expect(rossi(verificaExport(JSON.stringify(b))).length, `il verificatore non ha visto: ${nome}`).toBeGreaterThan(0);
    }
  });

  it('admin: la RLS gli lascia leggere righe di altri, il file contiene SOLO le sue (CONTROLLO: il componente di main le esporta)', async () => {
    const nuovo = await esporta('admin');
    expect(nuovo.bundle).not.toBeNull();
    expect(righeAltrui(nuovo.bundle!, 'admin')).toEqual([]);
    expect(rossi(salvaEVerifica('admin-candidato'))).toEqual([]);
    cleanup();
    blobParts = [];
    scaricati = [];
    const vecchio = await esporta('admin', ComponenteMain as unknown as typeof ExportDataClient);
    expect(vecchio.bundle).not.toBeNull();
    // il file di main NON e' conforme secondo il verificatore (righe altrui, colonne sensibili)
    expect(rossi(salvaEVerifica('admin-main')).length).toBeGreaterThan(0);
    const perse = righeAltrui(vecchio.bundle!, 'admin');
    // il CONTROLLO deve mostrare la perdita che la #96 evita: se qui fosse vuoto la prova non proverebbe niente
    expect(perse.length, 'il componente di main avrebbe dovuto esportare righe altrui').toBeGreaterThan(0);
    expect(new Set(perse.map((x) => x.split(':')[0]))).toEqual(
      new Set(['profiles', 'devices', 'b2c_subscriptions', 'user_roles']),
    );
  });

  it('bob (membro di gruppo): vede metriche e righe di gruppo di altri per RLS, il file contiene SOLO le sue (CONTROLLO su main)', async () => {
    const nuovo = await esporta('bob');
    expect(righeAltrui(nuovo.bundle!, 'bob')).toEqual([]);
    expect((nuovo.bundle!.data.fitness_metrics as Riga[]).length).toBe(1);
    expect((nuovo.bundle!.data.group_members as Riga[]).length).toBe(1);
    // caregiver_links: bob e' il SOGGETTO; la riga c'e' ma senza gli identificativi della controparte
    const legami = nuovo.bundle!.data.caregiver_links as Riga[];
    expect(legami).toHaveLength(1);
    expect(JSON.stringify(legami)).not.toContain(ATTORI.carla);
    cleanup();
    blobParts = [];
    scaricati = [];
    const vecchio = await esporta('bob', ComponenteMain as unknown as typeof ExportDataClient);
    const perse = righeAltrui(vecchio.bundle!, 'bob');
    expect(perse.length, 'il componente di main avrebbe dovuto esportare righe altrui').toBeGreaterThan(0);
    expect(new Set(perse.map((x) => x.split(':')[0]))).toEqual(new Set(['fitness_metrics', 'group_members']));
  });

  it('zed (1250 righe in fitness_metrics): paginazione contro PostgREST vero, conteggio esatto, nessun duplicato, nessuna perdita', async () => {
    const { bundle } = await esporta('zed');
    expect(bundle).not.toBeNull();
    const righe = bundle!.data.fitness_metrics as Riga[];
    const attese = Number(psql(`select count(*) from public.fitness_metrics where user_id = '${ATTORI.zed}'`));
    expect(attese).toBe(1251);
    expect(righe).toHaveLength(attese);
    const chiavi = new Set(righe.map((r) => `${String(r.device_id)}|${String(r.window_start_ms)}`));
    expect(chiavi.size).toBe(attese);
    expect(righeAltrui(bundle!, 'zed')).toEqual([]);
    // il confronto con la verita' del database: stesso insieme di chiavi
    expect(rossi(salvaEVerifica('zed-candidato'))).toEqual([]);
    const dalDb = psql(`select count(distinct (device_id::text || '|' || window_start_ms::text)) from public.fitness_metrics where user_id = '${ATTORI.zed}'`);
    expect(String(chiavi.size)).toBe(dalDb);
  });

  it('frank (partecipante a una sfida): con la RLS delle migration le sfide danno 42P17 anche a lui, il file e\' marcato incompleto, nessuna riga altrui', async () => {
    const { bundle } = await esporta('frank');
    expect(bundle!.incomplete).toBe(true);
    expect(bundle!.unavailable_tables).toEqual(['challenge_participants', 'challenge_scores']);
    expect(righeAltrui(bundle!, 'frank')).toEqual([]);
  });
});
