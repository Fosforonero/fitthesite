/**
 * Database types — generati da Supabase project xcdyhkuyxukaifhhtadr.
 *
 * Rigenera con: `supabase gen types typescript --project-id xcdyhkuyxukaifhhtadr`
 * o via MCP `mcp__plugin_supabase_supabase__generate_typescript_types`.
 *
 * Ultima generazione: 2026-05-19 (post migration 010_system_notifications).
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      admin_events: {
        Row: {
          action: string
          admin_id: string
          created_at: string
          detail: Json | null
          id: number
          target_device_id: string | null
          target_user_id: string | null
        }
        Insert: {
          action: string
          admin_id: string
          created_at?: string
          detail?: Json | null
          id?: number
          target_device_id?: string | null
          target_user_id?: string | null
        }
        Update: {
          action?: string
          admin_id?: string
          created_at?: string
          detail?: Json | null
          id?: number
          target_device_id?: string | null
          target_user_id?: string | null
        }
        Relationships: []
      }
      audit_logs: {
        Row: {
          action: string
          created_at: string
          detail: Json | null
          id: number
          ip: unknown
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          detail?: Json | null
          id?: number
          ip?: unknown
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          detail?: Json | null
          id?: number
          ip?: unknown
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      beta_signups: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          created_at: string
          device_brand: string | null
          email: string
          founder_number: number | null
          google_email: string | null
          id: string
          reason: string | null
          referral: string | null
          signup_ip: unknown
          signup_ua: string | null
          status: Database["public"]["Enums"]["beta_signup_status"]
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          device_brand?: string | null
          email: string
          founder_number?: number | null
          google_email?: string | null
          id?: string
          reason?: string | null
          referral?: string | null
          signup_ip?: unknown
          signup_ua?: string | null
          status?: Database["public"]["Enums"]["beta_signup_status"]
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          device_brand?: string | null
          email?: string
          founder_number?: number | null
          google_email?: string | null
          id?: string
          reason?: string | null
          referral?: string | null
          signup_ip?: unknown
          signup_ua?: string | null
          status?: Database["public"]["Enums"]["beta_signup_status"]
        }
        Relationships: []
      }
      beta_waitlist: {
        Row: {
          created_at: string
          email: string
          id: string
          locale: string
          notified_at: string | null
          notify_when_open: boolean
          referral: string | null
          signup_ip: string | null
          signup_ua: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          locale?: string
          notified_at?: string | null
          notify_when_open?: boolean
          referral?: string | null
          signup_ip?: string | null
          signup_ua?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          locale?: string
          notified_at?: string | null
          notify_when_open?: boolean
          referral?: string | null
          signup_ip?: string | null
          signup_ua?: string | null
        }
        Relationships: []
      }
      devices: {
        Row: {
          app_version: string | null
          device_brand: string | null
          device_fingerprint: string
          device_name: string | null
          id: string
          last_seen_at: string | null
          os_version: string | null
          paired_at: string
          revoked_at: string | null
          revoked_by: string | null
          revoked_reason: string | null
          source_type: string
          user_id: string
        }
        Insert: {
          app_version?: string | null
          device_brand?: string | null
          device_fingerprint: string
          device_name?: string | null
          id?: string
          last_seen_at?: string | null
          os_version?: string | null
          paired_at?: string
          revoked_at?: string | null
          revoked_by?: string | null
          revoked_reason?: string | null
          source_type: string
          user_id: string
        }
        Update: {
          app_version?: string | null
          device_brand?: string | null
          device_fingerprint?: string
          device_name?: string | null
          id?: string
          last_seen_at?: string | null
          os_version?: string | null
          paired_at?: string
          revoked_at?: string | null
          revoked_by?: string | null
          revoked_reason?: string | null
          source_type?: string
          user_id?: string
        }
        Relationships: []
      }
      privacy_consents: {
        Row: {
          analytics_anonymous: boolean
          caregiver_share: boolean
          data_deletion_completed_at: string | null
          data_deletion_requested_at: string | null
          data_export_completed_at: string | null
          data_export_requested_at: string | null
          marketing_emails: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          analytics_anonymous?: boolean
          caregiver_share?: boolean
          data_deletion_completed_at?: string | null
          data_deletion_requested_at?: string | null
          data_export_completed_at?: string | null
          data_export_requested_at?: string | null
          marketing_emails?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          analytics_anonymous?: boolean
          caregiver_share?: boolean
          data_deletion_completed_at?: string | null
          data_deletion_requested_at?: string | null
          data_export_completed_at?: string | null
          data_export_requested_at?: string | null
          marketing_emails?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          display_name: string | null
          email: string
          id: string
          locale: string
          not_medical_disclaimer_accepted_at: string | null
          privacy_accepted_at: string | null
          terms_accepted_at: string | null
          time_zone: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          display_name?: string | null
          email: string
          id: string
          locale?: string
          not_medical_disclaimer_accepted_at?: string | null
          privacy_accepted_at?: string | null
          terms_accepted_at?: string | null
          time_zone?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          display_name?: string | null
          email?: string
          id?: string
          locale?: string
          not_medical_disclaimer_accepted_at?: string | null
          privacy_accepted_at?: string | null
          terms_accepted_at?: string | null
          time_zone?: string
          updated_at?: string
        }
        Relationships: []
      }
      system_notifications: {
        Row: {
          detail: Json | null
          key: string
          sent_at: string
        }
        Insert: {
          detail?: Json | null
          key: string
          sent_at?: string
        }
        Update: {
          detail?: Json | null
          key?: string
          sent_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          granted_at: string
          granted_by: string | null
          note: string | null
          role: string
          user_id: string
        }
        Insert: {
          granted_at?: string
          granted_by?: string | null
          note?: string | null
          role: string
          user_id: string
        }
        Update: {
          granted_at?: string
          granted_by?: string | null
          note?: string | null
          role?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: {
      get_beta_spots_taken: { Args: Record<string, never>; Returns: number }
      is_admin: { Args: Record<string, never>; Returns: boolean }
      has_role: { Args: { check_role: string }; Returns: boolean }
      admin_overview: {
        Args: Record<string, never>
        Returns: {
          active_devices: number
          active_users_30d: number
          active_users_7d: number
          failed_syncs_24h: number
          new_users_7d: number
          syncs_24h: number
          total_devices: number
          total_users: number
        }[]
      }
      admin_daily_aggregate: {
        Args: Record<string, never>
        Returns: {
          active_devices: number
          active_users: number
          day: string
          total_syncs: number
        }[]
      }
      admin_device_brand_distribution: {
        Args: Record<string, never>
        Returns: {
          brand: string
          count: number
        }[]
      }
      admin_top_errors: {
        Args: { p_days?: number }
        Returns: {
          error_code: string
          occurrences: number
        }[]
      }
    }
    Enums: {
      beta_signup_status:
        | "pending"
        | "approved"
        | "activated"
        | "rejected"
        | "expired"
    }
  }
}
