/**
 * Verifica OFFLINE di un file di export scaricato (nessuna rete, nessun accesso a database).
 *
 * Uso (dalla radice del sito):  npx tsx tools/prove-locali/export-applicativo/verifica-export-json.ts <file.json>
 * Esito: 0 se tutti i controlli passano, 1 altrimenti. Stampa PASS/FAIL per ogni controllo.
 *
 * Serve a due cose: (1) provare, nella prova applicativa locale, che il file prodotto e' conforme (e che un file
 * di main con righe altrui NON lo e': controllo negativo); (2) controllare, dopo uno smoke in produzione con un
 * account di prova, il file scaricato senza che nessuno debba leggerlo a occhio.
 */
import { readFileSync } from 'node:fs';

import {
  EXPORT_OWNER_SCOPE,
  EXPORT_TABLES,
  type ExportTable,
  getExportColumns,
} from '@/lib/privacy/export-scope';

type Riga = Record<string, unknown>;
/** Le 12 tabelle attese, scritte qui di proposito: NON derivano da export-scope, cosi' una tabella tolta dal componente si vede. */
const DODICI_TABELLE = [
  'profiles', 'privacy_consents', 'user_settings', 'devices', 'fitness_metrics', 'workouts',
  'caregiver_links', 'group_members', 'b2c_subscriptions', 'challenge_participants', 'challenge_scores', 'user_roles',
] as const;
const COLONNE_ESCLUSE = ['fcm_token', 'fcm_token_updated_at', 'device_fingerprint', 'revoked_by', 'raw_payload', 'granted_by', 'note'];

export type EsitoControllo = { nome: string; ok: boolean; dettaglio?: string };

export function verificaExport(testo: string): EsitoControllo[] {
  const esiti: EsitoControllo[] = [];
  const controllo = (nome: string, ok: boolean, dettaglio?: string) => esiti.push({ nome, ok, dettaglio });

  let b: Record<string, unknown>;
  try {
    b = JSON.parse(testo) as Record<string, unknown>;
  } catch (e) {
    return [{ nome: 'il file e\' JSON valido', ok: false, dettaglio: String(e) }];
  }
  controllo('il file e\' JSON valido', true);

  const account = (b.account ?? {}) as { id?: string };
  const mioId = typeof account.id === 'string' ? account.id.toLowerCase() : '';
  controllo('account.id presente', mioId.length > 0);

  const data = (b.data ?? {}) as Record<string, unknown>;
  controllo('data ha esattamente le 12 tabelle attese (elenco scritto nel verificatore), nell\'ordine', JSON.stringify(Object.keys(data)) === JSON.stringify([...DODICI_TABELLE]), JSON.stringify(Object.keys(data)));
  controllo('l\'elenco del verificatore coincide con EXPORT_TABLES del componente', JSON.stringify([...EXPORT_TABLES]) === JSON.stringify([...DODICI_TABELLE]));

  const nonDisponibili: string[] = [];
  for (const tabella of EXPORT_TABLES) {
    const v = data[tabella];
    if (Array.isArray(v)) continue;
    if (JSON.stringify(v) === JSON.stringify({ error: 'unavailable' })) nonDisponibili.push(tabella);
    else controllo(`${tabella}: e' un elenco oppure il marcatore {error:'unavailable'}`, false, JSON.stringify(v).slice(0, 120));
  }

  // dichiarazione di incompletezza coerente col contenuto
  if (nonDisponibili.length > 0) {
    controllo('file incompleto: incomplete === true', b.incomplete === true);
    controllo('file incompleto: unavailable_tables elenca esattamente le tabelle marcate', JSON.stringify(b.unavailable_tables) === JSON.stringify(nonDisponibili), JSON.stringify(b.unavailable_tables));
  } else {
    controllo('file completo: nessun incomplete / unavailable_tables', !('incomplete' in b) && !('unavailable_tables' in b));
  }

  // nessuna riga altrui: colonna proprietario == account.id (caregiver_links e' senza identificativi, Opzione B)
  const altrui: string[] = [];
  for (const tabella of EXPORT_TABLES as readonly ExportTable[]) {
    const righe = data[tabella];
    if (!Array.isArray(righe)) continue;
    const scope = EXPORT_OWNER_SCOPE[tabella];
    for (const r of righe as Riga[]) {
      if (!('column' in scope)) continue; // caregiver_links: sanificato, controllato sotto
      if (String(r[scope.column] ?? '').toLowerCase() !== mioId) altrui.push(`${tabella}.${scope.column}=${String(r[scope.column])}`);
    }
  }
  controllo('nessuna riga altrui nelle tabelle con colonna proprietario', altrui.length === 0, altrui.slice(0, 5).join(', '));

  const legami = Array.isArray(data.caregiver_links) ? (data.caregiver_links as Riga[]) : [];
  controllo('caregiver_links: nessun identificativo della controparte (solo ruolo e permessi)', legami.every((r) => !('caregiver_id' in r) && !('subject_id' in r)));

  // colonne vietate e colonne attese
  const presenti = new Set<string>();
  for (const tabella of EXPORT_TABLES) {
    const righe = data[tabella];
    if (Array.isArray(righe)) for (const r of righe as Riga[]) Object.keys(r).forEach((k) => presenti.add(k));
  }
  const vietate = COLONNE_ESCLUSE.filter((c) => presenti.has(c));
  controllo('nessuna colonna sensibile esclusa dalla proiezione', vietate.length === 0, vietate.join(', '));
  const fuoriProiezione: string[] = [];
  for (const tabella of EXPORT_TABLES) {
    const righe = data[tabella];
    if (!Array.isArray(righe) || tabella === 'caregiver_links') continue;
    const ammesse = new Set(getExportColumns(tabella).split(',').map((c) => c.trim()));
    for (const r of righe as Riga[]) for (const k of Object.keys(r)) if (!ammesse.has(k)) fuoriProiezione.push(`${tabella}.${k}`);
  }
  controllo('ogni colonna esportata e\' nella proiezione dichiarata', fuoriProiezione.length === 0, [...new Set(fuoriProiezione)].slice(0, 5).join(', '));

  // nessun testo di errore del database nel file
  controllo('nessun testo tecnico del database (ricorsione, policy, codici SQLSTATE, PGRST)', !/infinite recursion|row-level security|\b42P17\b|\b42501\b|PGRST\d+|statement timeout/i.test(testo));

  return esiti;
}

if (process.argv[1] && /verifica-export-json\.ts$/.test(process.argv[1])) {
  const file = process.argv[2];
  if (!file) {
    console.error('uso: npx tsx tools/prove-locali/export-applicativo/verifica-export-json.ts <file.json>');
    process.exit(2);
  }
  const esiti = verificaExport(readFileSync(file, 'utf8'));
  for (const e of esiti) console.log(`${e.ok ? 'PASS' : 'FAIL'}  ${e.nome}${e.dettaglio && !e.ok ? `  [${e.dettaglio}]` : ''}`);
  const rossi = esiti.filter((e) => !e.ok).length;
  console.log(rossi === 0 ? 'ESITO: file conforme' : `ESITO: ${rossi} controllo/i rosso/i`);
  process.exit(rossi === 0 ? 0 : 1);
}
