/**
 * Database types — placeholder iniziale.
 *
 * Quando il DB Supabase è pronto, rigenera con:
 *   npm run supabase:gen-types
 * (richiede `supabase link --project-ref <ref>` la prima volta)
 *
 * I types qui sotto coprono SOLO le RPC functions che usiamo da Server Components
 * subito (admin overview, is_admin). Tutte le altre tabelle restano `unknown`
 * fino al gen-types reale.
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

type AdminOverviewRow = {
  total_users: number;
  active_users_7d: number;
  active_users_30d: number;
  new_users_7d: number;
  total_devices: number;
  active_devices: number;
  syncs_24h: number;
  failed_syncs_24h: number;
};

type DailyAggregateRow = {
  day: string;
  active_users: number;
  active_devices: number;
  total_syncs: number;
};

type BrandDistributionRow = {
  brand: string;
  count: number;
};

type TopErrorsRow = {
  error_code: string;
  occurrences: number;
};

type DeviceRow = {
  id: string;
  user_id: string;
  device_fingerprint: string;
  device_name: string | null;
  device_brand: string | null;
  source_type: string;
  app_version: string | null;
  os_version: string | null;
  paired_at: string;
  last_seen_at: string | null;
  revoked_at: string | null;
  revoked_by: string | null;
  revoked_reason: string | null;
};

type ProfileRow = {
  id: string;
  email: string;
  display_name: string | null;
  locale: string;
  time_zone: string;
  privacy_accepted_at: string | null;
  terms_accepted_at: string | null;
  not_medical_disclaimer_accepted_at: string | null;
  created_at: string;
  updated_at: string;
};

type PrivacyConsentsRow = {
  user_id: string;
  marketing_emails: boolean;
  analytics_anonymous: boolean;
  caregiver_share: boolean;
  data_export_requested_at: string | null;
  data_export_completed_at: string | null;
  data_deletion_requested_at: string | null;
  data_deletion_completed_at: string | null;
  updated_at: string;
};

type AuditLogsInsert = {
  user_id?: string | null;
  action: string;
  detail?: Json;
  ip?: string | null;
  user_agent?: string | null;
};

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: ProfileRow;
        Insert: Partial<ProfileRow> & { id: string; email: string };
        Update: Partial<ProfileRow>;
      };
      devices: {
        Row: DeviceRow;
        Insert: Omit<DeviceRow, 'id' | 'paired_at'> & {
          id?: string;
          paired_at?: string;
        };
        Update: Partial<DeviceRow>;
      };
      privacy_consents: {
        Row: PrivacyConsentsRow;
        Insert: Partial<PrivacyConsentsRow> & { user_id: string };
        Update: Partial<PrivacyConsentsRow>;
      };
      audit_logs: {
        Row: AuditLogsInsert & {
          id: number;
          created_at: string;
        };
        Insert: AuditLogsInsert;
        Update: Partial<AuditLogsInsert>;
      };
    };
    Views: Record<string, never>;
    Functions: {
      is_admin: {
        Args: Record<string, never>;
        Returns: boolean;
      };
      has_role: {
        Args: { check_role: string };
        Returns: boolean;
      };
      admin_overview: {
        Args: Record<string, never>;
        Returns: AdminOverviewRow[];
      };
      admin_daily_aggregate: {
        Args: Record<string, never>;
        Returns: DailyAggregateRow[];
      };
      admin_device_brand_distribution: {
        Args: Record<string, never>;
        Returns: BrandDistributionRow[];
      };
      admin_top_errors: {
        Args: { p_days?: number };
        Returns: TopErrorsRow[];
      };
    };
    Enums: Record<string, never>;
  };
};
