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
 *    (`raw_payload`) e ruoli (`note`, `granted_by`) di TUTTI gli utenti (policy `is_admin()`);
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
 * debito architetturale preesistente a livello di database e politiche RLS.
 * Questa PR NON e' una correzione delle policy RLS del database.
 * Questa libreria e il client di export costituiscono lo strato di contenimento
 * applicativo di difesa in profondita': garantiscono che l'operazione di export
 * art. 20 estragga unicamente le righe e le colonne legittimamente pertinenti
 * all'account richiedente, indipendentemente dalle letture che la RLS lascerebbe
 * aperte a livello di database.
 *
 * RICONCILIAZIONE DELLE COLONNE CON IL MANDATO DI PRIVACY (GDPR ART. 15 / 20)
 * ----------------------------------------------------------------------------
 * Ogni colonna esportata e' sottoposta a vaglio di pertinenza e minimizzazione:
 *
 * 1. `devices.fcm_token` e `devices.fcm_token_updated_at`:
 *    ESCLUSI. Il token Firebase Cloud Messaging e' un segreto tecnico effimero
 *    di sessione push. Non e' un dato personale portabile dell'utente; la sua
 *    esportazione esporrebbe un vettore di inoltro notifiche push a terzi.
 *
 * 2. `devices.device_fingerprint`:
 *    ESCLUSO. Hash hardware calcolato per la deduplica tecnica dell'accoppiamento
 *    dispositivi; non costituisce dato dell'utente ai fini della portabilita' art. 20
 *    e la sua esportazione favorirebbe il tracciamento incrociato dell'hardware.
 *
 * 3. `b2c_subscriptions.raw_payload`:
 *    ESCLUSO. Payload JSON grezzo degli store (Apple StoreKit JWS / Google Play),
 *    contenente purchaseToken e token crittografici di ricevuta. I dati portabili
 *    (prodotto, data di scadenza, stato, rinnovo) sono gia' inclusi nelle colonne
 *    dedicate; il raw payload espone token di transazione sensibili.
 *
 * 4. `user_roles.granted_by`:
 *    ESCLUSO. UUID dell'amministratore che ha assegnato il ruolo. E' un dato
 *    personale di un dipendente/terzo (art. 20 comma 4 GDPR: non deve ledere
 *    i diritti altrui), non appartiene all'utente destinatario del ruolo.
 *
 * 5. `user_roles.note`:
 *    ESCLUSO. Campo di annotazione interna amministrativa o di supporto aziendale,
 *    non fa parte dei dati forniti o generati dall'utente per la portabilita'.
 *
 * 6. Identificativi controparte in `caregiver_links` (`caregiver_id`, `subject_id`):
 *    Un legame di cura coinvolge due soggetti distinti. L'utente ha diritto
 *    a conoscere le deleghe attive, le date e i permessi conferiti (`permissions`,
 *    `granted_at`, `expires_at`, `revoked_at`). L'inclusione o l'esclusione
 *    dell'UUID in chiaro della controparte richiede approvazione esplicita per
 *    bilanciare la verificabilita' della relazione con la tutela dei dati di terzi
 *    (art. 20 c. 4 GDPR).
 *
 * 7. Segregazione dati biometrici (`fitness_metrics`, `workouts`):
 *    I dati biometrici appartengono ESCLUSIVAMENTE al soggetto (`user_id = userId`).
 *    Anche se un caregiver puo' visualizzare metriche nell'app, il suo export
 *    personale NON deve mai includere dati sanitari di terzi.
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
 * Riconciliate escludendo segreti infrastrutturali (FCM), hash hardware (fingerprint),
 * ricevute grezze degli store (raw_payload) e dati di audit interni (granted_by, note).
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
    'expires_at',
    'review_email_sent_at',
  ],
};

/**
 * Colonna di ordinamento deterministico per ciascuna tabella durante la paginazione.
 * Garantisce che i blocchi di paginazione non subiscano salti o duplicazioni.
 */
export const EXPORT_TABLE_ORDER: Record<ExportTable, string> = {
  profiles: 'id',
  privacy_consents: 'user_id',
  user_settings: 'user_id',
  devices: 'id',
  fitness_metrics: 'id',
  workouts: 'id',
  caregiver_links: 'granted_at',
  group_members: 'joined_at',
  b2c_subscriptions: 'created_at',
  challenge_participants: 'joined_at',
  challenge_scores: 'updated_at',
  user_roles: 'granted_at',
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
