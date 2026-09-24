/**
 * Ambito dell'export web «i miei dati» (/[locale]/app/export).
 *
 * PERCHE' OGNI QUERY DEVE ESSERE FILTRATA SUL PROPRIETARIO
 * --------------------------------------------------------
 * Il client interroga Supabase con la sessione dell'utente, quindi vale la RLS.
 * Ma la RLS non e' «solo le righe dell'utente»: e' «le righe che l'utente puo'
 * leggere». Le due cose coincidono per un utente senza relazioni e divergono
 * per chi ne ha:
 *  - un admin legge profili, dispositivi (con token FCM), abbonamenti
 *    (`raw_payload`) e ruoli (`note`) di TUTTI gli utenti (policy `is_admin()`);
 *  - un membro di un gruppo legge le righe `fitness_metrics` dei co-membri (la
 *    condivisione e' per riga: colonne di glicemia e pressione comprese) e le
 *    loro `group_members` (`share_settings`, `display_name`);
 *  - le policy delle sfide consentono a un co-partecipante di leggere
 *    partecipazioni e punteggi altrui (dal testo delle migration; NON misurato
 *    a runtime: nel database ricostruito rispondono con «infinite recursion»).
 * Un `select('*')` senza filtro consegna tutto questo dentro un file che si
 * presenta come «i tuoi dati» (GDPR art. 15/20) e che l'utente puo' inoltrare.
 *
 * Verificato con dati sintetici su un PG17 ricostruito dalle migration (admin e
 * membri di gruppo; caregiver e sfide non riproducibili li'):
 * supabase/tests/reset-pg17/16-test-export-web-ambito-righe.sql.
 *
 * L'export nell'app Flutter filtra gia' per `user_id`
 * (`data_export_service.dart`); qui si allinea il web.
 */

export const EXPORT_TABLES = [
  'profiles',
  'privacy_consents',
  'user_settings',
  'devices',
  'fitness_metrics',
  'workouts',
  'caregiver_links',
  'group_members',
  'b2c_subscriptions',
  'challenge_participants',
  'challenge_scores',
  'user_roles',
] as const;

export type ExportTable = (typeof EXPORT_TABLES)[number];

/**
 * Chi e' il proprietario di una riga, tabella per tabella.
 *  - `column`: una sola colonna che contiene l'id dell'utente;
 *  - `anyOf`: la riga e' dell'utente se lo e' una qualunque delle due colonne
 *    (`caregiver_links`: la relazione appartiene a entrambe le parti, e ognuna
 *    la vede gia' per policy; l'id della controparte e' l'unico dato altrui).
 *
 * Una tabella nuova in EXPORT_TABLES senza una voce qui non compila.
 */
export const EXPORT_OWNER_SCOPE: Record<
  ExportTable,
  { readonly column: string } | { readonly anyOf: readonly [string, string] }
> = {
  profiles: { column: 'id' },
  privacy_consents: { column: 'user_id' },
  user_settings: { column: 'user_id' },
  devices: { column: 'user_id' },
  fitness_metrics: { column: 'user_id' },
  workouts: { column: 'user_id' },
  caregiver_links: { anyOf: ['caregiver_id', 'subject_id'] },
  group_members: { column: 'user_id' },
  b2c_subscriptions: { column: 'user_id' },
  challenge_participants: { column: 'user_id' },
  challenge_scores: { column: 'user_id' },
  user_roles: { column: 'user_id' },
};

/** Il minimo del query builder di PostgREST che serve qui. */
export interface OwnerFilterable<Q> {
  eq(column: string, value: string): Q;
  or(filters: string): Q;
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Restringe una query alle sole righe dell'utente. `.or()` riceve una stringa
 * di filtro, quindi l'id deve essere un UUID: qualunque altra cosa (che non
 * dovrebbe mai arrivare da `auth.getUser()`) fa fallire l'export invece di
 * comporre un filtro diverso da quello voluto.
 */
export function scopeToOwner<Q extends OwnerFilterable<Q>>(
  query: Q,
  table: ExportTable,
  userId: string,
): Q {
  if (!UUID.test(userId)) {
    throw new Error('Export: id utente non valido');
  }
  const scope = EXPORT_OWNER_SCOPE[table];
  if ('column' in scope) {
    return query.eq(scope.column, userId);
  }
  const [a, b] = scope.anyOf;
  return query.or(`${a}.eq.${userId},${b}.eq.${userId}`);
}
