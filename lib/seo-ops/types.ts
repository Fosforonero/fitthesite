/**
 * Shared TypeScript types for the SEO Ops pipeline.
 *
 * Three agents:
 *   - SEOWatchAgent  — daily health check (cron 06:00 UTC)
 *   - SEOContentAgent — weekly draft + PR (cron Mon 06:00 UTC)
 *   - SEOAlertAgent   — on-demand emergency investigation
 */

// ─── Watch Agent ─────────────────────────────────────────────────────────────

export interface BrokenLink {
  url: string;
  status: number;
}

export interface LowCTRQuery {
  query: string;
  impressions: number;
  clicks: number;
  ctr: number;
  position: number;
}

export interface RankingDrop {
  query: string;
  positionNow: number;
  positionWeekAgo: number;
  delta: number;
}

export interface CWVIssue {
  url: string;
  lcp?: number;
  fid?: number;
  cls?: number;
  score?: number;
  category?: string;
}

export interface WatchAlert {
  severity: "critical" | "warning" | "info";
  type: "broken_links" | "low_ctr" | "ranking_drop" | "cwv" | "sitemap" | "other";
  message: string;
  details?: unknown;
}

export interface WatchResult {
  ok: boolean;
  date: string;
  report_path: string;
  alerts: WatchAlert[];
  stats: {
    urls_checked: number;
    broken_links: number;
    low_ctr_queries: number;
    ranking_drops: number;
    cwv_issues: number;
  };
  skipped?: string[];
  error?: string;
}

// ─── Snapshot (used by Watch Agent for ranking delta) ────────────────────────

export interface RankingSnapshot {
  date: string;
  queries: Array<{
    query: string;
    position: number;
    impressions: number;
    clicks: number;
    ctr: number;
  }>;
}

// ─── Content Agent ───────────────────────────────────────────────────────────

export interface GoldmineKeyword {
  query: string;
  volume_estimate: number;
  difficulty: "low" | "medium" | "high";
  locale: "it" | "en";
  covered: boolean;
  covered_slug?: string;
  covered_date?: string;
}

export interface GoldmineCategory {
  name: string;
  keywords: GoldmineKeyword[];
}

export interface GoldmineKeywordPool {
  categories: GoldmineCategory[];
}

export interface ContentDraft {
  keyword: GoldmineKeyword;
  slug: string;
  locale: string;
  title: string;
  word_count: number;
  markdown: string;
  file_path: string;
}

export interface ContentResult {
  ok: boolean;
  date: string;
  drafts: ContentDraft[];
  pr_url?: string;
  prs_created: string[];
  error?: string;
  skipped?: string[];
}

// ─── Alert Agent ─────────────────────────────────────────────────────────────

export type AlertSeverity = "P0" | "P1" | "P2";

export interface AlertResult {
  ok: boolean;
  report: string;
  report_path: string;
  severity: AlertSeverity;
  likely_cause: string;
  immediate_actions: string[];
  follow_up_actions: string[];
  error?: string;
}
