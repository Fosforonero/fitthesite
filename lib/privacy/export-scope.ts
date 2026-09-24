/**
 * Ambito dell'export web «i miei dati» (/[locale]/app/export).
 *
 * PERCHE' OGNI QUERY DEVE ESSERE FILTRATA SUL PROPRIETARIO E SU COLONNE ESPLICITE
 * --------------------------------------------------------------------------------
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
 *
 * NOTA SULLA SEPARAZIONE DELLE RESPONSABILITA' (RLS vs CONTENIMENTO CLIENT)
 * --------------------------------------------------------------------------
 * La visibilita' cross-utente consentita dalla RLS (admin, gruppi, sfide) e' un
 * debito architetturale a livello di database e politiche RLS. Questa libreria
 * e il client di export costituiscono lo strato di contenimento applicativo di
 * difesa in profondita': garantiscono che l'operazione di export art. 20 estragga
 * unicamente le righe e le colonne legittimamente pertinenti all'account richiedente,
 * indipendentemente dai permessi di lettura concessi dalla RLS nel contesto del DB.
 *
 * TRATTAMENTO DELLE RELAZIONI CAREGIVER NELL'EXPORT WEB (GDPR ART. 15 / 20)
 * -------------------------------------------------------------------------
 * Un legame di cura coinvolge due soggetti: `caregiver_id` e `subject_id`.
 *
 * 1. Per la tabella `caregiver_links`:
 *    La relazione in sé appartiene a entrambi i contraenti:
 *    - Se l'utente e' il caregiver (`caregiver_id = userId`), il record rappresenta
 *      le autorizzazioni che gli sono state conferite per assistere un familiare.
 *    - Se l'utente e' il soggetto (`subject_id = userId`), il record rappresenta
 *      la delega concessa da lui al caregiver.
 *    In entrambi i casi la riga e' parte integrante delle impostazioni e consensi
 *    dell'utente richiedente, quindi viene inclusa se `caregiver_id = userId OR subject_id = userId`.
 *
 * 2. Per i dati biometrici e sanitari (`fitness_metrics`, `workouts`, etc.):
 *    I dati sanitari appartengono ESCLUSIVAMENTE al soggetto cui si riferiscono (`user_id = userId`).
 *    Anche se la RLS del database consentisse a un caregiver di visualizzare i dati del
 *    soggetto (quando autorizzato da `caregiver_links` e `privacy_consents.caregiver_share`),
 *    l'export web «I miei dati» non deve MAI esportare i dati sanitari del soggetto
 *    all'interno del dump personale del caregiver.
 *    L'export art. 20 riguarda esclusivamente la portabilita' dei dati dell'utente
 *    richiedente, non una funzione di copia massiva di dati di terzi.
 *    Di conseguenza, tutte le tabelle biometriche/personali rimangono rigidamente
 *    ancorate a `user_id = userId`.
 *
 * PROIEZIONE ESPLICITA DI COLONNE (NESSUN SELECT '*')
 * ---------------------------------------------------
 * Nessuna query usa `select('*')`: ogni tabella dichiara una whitelist rigorosa
 * di colonne contrattualmente definite per l'export GDPR art. 20. Nuove colonne
 * interne, token di servizio o campi tecnici aggiunti allo schema non entrano
 * nell'export senza essere stati esplicitamente verificati e inseriti qui.
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
 * Colonne esplicite da proiettare per ogni tabella (nessun `select('*')`).
 */
export const EXPORT_TABLE_COLUMNS: Record<ExportTable, readonly string[]> = {
  profiles: [
    'id',
    'email',
    'display_name',
    'locale',
    'time_zone',
    'privacy_accepted_at',
    'terms_accepted_at',
    'not_medical_disclaimer_accepted_at',
    'created_at',
    'updated_at',
    'weight_kg',
    'height_cm',
    'gender',
    'date_of_birth',
    'activity_level',
    'notifications_enabled',
    'has_ring',
  ],
  privacy_consents: [
    'user_id',
    'marketing_emails',
    'analytics_anonymous',
    'caregiver_share',
    'data_export_requested_at',
    'data_export_completed_at',
    'data_deletion_requested_at',
    'data_deletion_completed_at',
    'updated_at',
  ],
  user_settings: [
    'user_id',
    'theme_mode',
    'sync_interval_minutes',
    'auto_sync_enabled',
    'notification_sync_failed',
    'hr_zones',
    'units',
    'updated_at',
  ],
  devices: [
    'id',
    'user_id',
    'device_fingerprint',
    'device_name',
    'device_brand',
    'source_type',
    'app_version',
    'os_version',
    'paired_at',
    'last_seen_at',
    'revoked_at',
    'revoked_by',
    'revoked_reason',
    'fcm_token',
    'fcm_token_updated_at',
    'first_sync_state',
    'first_sync_state_updated_at',
    'first_sync_at',
    'first_sync_platform',
    'first_sync_app_version',
  ],
  fitness_metrics: [
    'id',
    'user_id',
    'device_id',
    'schema_version',
    'source',
    'window_start_ms',
    'window_end_ms',
    'collected_at_ms',
    'received_at',
    'steps',
    'heart_rate_bpm',
    'resting_heart_rate_bpm',
    'spo2_percent',
    'calories_kcal',
    'active_calories_kcal',
    'sleep_minutes',
    'sleep_start_ms',
    'sleep_end_ms',
    'distance_meters',
    'hrv_rmssd',
    'vo2_max',
    'floors_climbed',
    'elevation_gained_meters',
    'skin_temperature_c',
    'weight_kg',
    'height_cm',
    'bmi',
    'intraday_steps',
    'intraday_hr',
    'intraday_calories',
    'sleep_stages',
    'exercise_sessions',
    'source_device',
    'source_package',
    'blood_pressure_systolic',
    'blood_pressure_diastolic',
    'blood_glucose_mgdl',
    'water_ml',
    'respiratory_rate_bpm',
    'nutrition_kcal_in',
    'hr_source_name',
    'hr_source_quality',
    'stress_avg',
    'sleep_apnea_detected',
    'hrv_sdnn',
    'local_day_key',
  ],
  workouts: [
    'id',
    'user_id',
    'device_id',
    'start_ms',
    'end_ms',
    'type',
    'title',
    'duration_min',
    'distance_meters',
    'calories_kcal',
    'hr_avg',
    'hr_max',
    'hr_min',
    'pace_sec_per_km',
    'intensity_minutes_moderate',
    'intensity_minutes_vigorous',
    'notes',
    'created_at',
    'is_canonical',
  ],
  caregiver_links: [
    'caregiver_id',
    'subject_id',
    'granted_at',
    'revoked_at',
    'permissions',
    'expires_at',
  ],
  group_members: [
    'group_id',
    'user_id',
    'role',
    'share_settings',
    'display_name',
    'joined_at',
    'left_at',
  ],
  b2c_subscriptions: [
    'user_id',
    'billing_source',
    'external_product_id',
    'external_subscription_id',
    'external_order_id',
    'active_until',
    'auto_renewing',
    'state',
    'last_notification_at',
    'raw_payload',
    'created_at',
    'updated_at',
  ],
  challenge_participants: [
    'challenge_id',
    'user_id',
    'device_id_used',
    'joined_at',
    'consent_to_share',
  ],
  challenge_scores: [
    'challenge_id',
    'user_id',
    'score',
    'rank',
    'updated_at',
  ],
  user_roles: [
    'user_id',
    'role',
    'granted_at',
    'granted_by',
    'note',
    'expires_at',
    'review_email_sent_at',
  ],
};

/**
 * Restituisce le colonne separate da virgola per la clausola `.select(...)` di PostgREST.
 */
export function getExportColumns(table: ExportTable): string {
  return EXPORT_TABLE_COLUMNS[table].join(',');
}

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
