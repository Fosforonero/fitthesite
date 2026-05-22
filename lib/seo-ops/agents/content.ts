/**
 * SEOContentAgent — weekly article draft + PR creator.
 *
 * Run via: POST /api/internal/seo-ops/weekly-content (Vercel Cron Mon 06:00 UTC)
 *
 * Flow:
 *   1. Read goldmine-keywords.json, pick 3 highest-volume uncovered keywords
 *   2. For each keyword: call Claude to generate 1500-word article (IT or EN)
 *   3. Save each draft as content/blog/[locale]/[slug].md
 *   4. Mark keywords as covered in goldmine-keywords.json
 *   5. Open GitHub PR with all files, tag "seo-content-review"
 *   6. If GITHUB_TOKEN missing: save to drafts/ folder instead
 *
 * Graceful degradation: Never crashes. Missing credentials → save drafts locally.
 */
import { mkdir, writeFile } from "fs/promises";
import path from "path";

import { callClaude } from "../clients/anthropic";
import { createBranchAndPR } from "../clients/github";
import {
  getUncoveredByVolume,
  loadKeywordPool,
  markKeywordsCovered,
  queryToSlug,
} from "../helpers/keyword-pool";
import type { ContentDraft, ContentResult, GoldmineKeyword } from "../types";

const DRAFTS_FALLBACK_DIR = path.join(process.cwd(), "drafts", "seo-content");

function isoDate(d = new Date()): string {
  return d.toISOString().split("T")[0];
}

function buildContentPrompt(keyword: GoldmineKeyword): string {
  const lang = keyword.locale === "it" ? "Italian" : "English";
  const langNote =
    keyword.locale === "it"
      ? "Write entirely in Italian. Use formal but approachable Italian."
      : "Write entirely in English. Use clear, helpful English.";

  return `You are a health-tech content writer for FitMesh Sync (fitmesh.fit), an Android app that syncs health data between Google Health Connect, Garmin, Fitbit, Samsung Health, and Apple Health.

Write a 1500-word SEO article targeting the search query: "${keyword.query}"

${langNote}

STRUCTURE (use exactly this):
1. H1 title (concise, includes the query naturally)
2. TL;DR (2-3 sentences — the "answer" to the query)
3. 4-6 H2 sections covering the topic thoroughly
4. FAQ section (5 questions & answers, suitable for FAQ JSON-LD schema)
5. At the very end: a JSON-LD block inside a code fence labelled \`json-ld\`

TONE: Helpful, authoritative, educational. Not salesy.

FITMESH SYNC MENTION: Mention FitMesh Sync 1-2 times naturally as "an option for users who want to sync their health data automatically" or similar. No hard CTA, no pricing mention.

IMPORTANT: Output ONLY the article markdown. No preamble, no "here is your article", no trailing commentary. Start directly with the H1.`;
}

function extractTitle(markdown: string): string {
  const match = markdown.match(/^#\s+(.+)$/m);
  return match ? match[1].trim() : "Untitled Article";
}

function countWords(text: string): number {
  return text.split(/\s+/).filter(Boolean).length;
}

async function generateDraft(keyword: GoldmineKeyword): Promise<ContentDraft> {
  const slug = queryToSlug(keyword.query);
  const prompt = buildContentPrompt(keyword);

  const markdown = await callClaude(
    "You are a professional health-tech content writer. Follow the user's instructions exactly.",
    prompt,
    4096
  );

  const title = extractTitle(markdown);
  const wordCount = countWords(markdown);
  const filePath = `content/blog/${keyword.locale}/${slug}.md`;

  return {
    keyword,
    slug,
    locale: keyword.locale,
    title,
    word_count: wordCount,
    markdown,
    file_path: filePath,
  };
}

export async function runSEOContentAgent(): Promise<ContentResult> {
  const today = isoDate();
  const skipped: string[] = [];

  // ── 1. Load keyword pool ───────────────────────────────────────────────────
  const pool = loadKeywordPool();
  const uncovered = getUncoveredByVolume(pool);

  if (uncovered.length === 0) {
    return {
      ok: true,
      date: today,
      drafts: [],
      prs_created: [],
      skipped: ["no_uncovered_keywords"],
      error: "All keywords in the pool are already covered. Add more to goldmine-keywords.json.",
    };
  }

  const targetKeywords = uncovered.slice(0, 3);

  // ── 2. Generate drafts ─────────────────────────────────────────────────────
  const drafts: ContentDraft[] = [];
  for (const kw of targetKeywords) {
    try {
      console.info(`[content] Generating draft for: "${kw.query}" (${kw.locale})`);
      const draft = await generateDraft(kw);
      drafts.push(draft);
    } catch (err) {
      console.error(`[content] Failed to generate draft for "${kw.query}":`, err);
      skipped.push(kw.query);
    }
  }

  if (drafts.length === 0) {
    return {
      ok: false,
      date: today,
      drafts: [],
      prs_created: [],
      skipped,
      error: "All draft generations failed",
    };
  }

  // ── 3. Build file list for commit ──────────────────────────────────────────
  const updatedPoolJson = markKeywordsCovered(
    pool,
    drafts.map((d) => d.keyword.query),
    drafts.map((d) => d.slug),
    today
  );

  const files = [
    // Each article draft
    ...drafts.map((d) => ({
      path: d.file_path,
      content: `---
title: "${d.title.replace(/"/g, "'")}"
slug: "${d.slug}"
locale: "${d.locale}"
query: "${d.keyword.query}"
generated: "${new Date().toISOString()}"
review_status: "pending"
---

${d.markdown}
`,
    })),
    // Updated keyword pool
    {
      path: "data/seo/goldmine-keywords.json",
      content: updatedPoolJson,
    },
  ];

  // ── 4. PR body ─────────────────────────────────────────────────────────────
  const prBody = `## SEO Content Review — ${today}

This PR was auto-generated by SEOContentAgent. **Please review before merging.**

### Articles Generated (${drafts.length})

${drafts
  .map(
    (d) =>
      `- **\`${d.file_path}\`**
  - Query: \`${d.keyword.query}\`
  - Locale: ${d.locale}
  - ~${d.word_count} words
  - Volume estimate: ${d.keyword.volume_estimate.toLocaleString()} searches/mo`
  )
  .join("\n\n")}

### Review Checklist

- [ ] Factual accuracy verified
- [ ] FitMesh Sync mentions are natural (not salesy)
- [ ] FAQ answers are accurate
- [ ] JSON-LD schema is valid
- [ ] Slug/title look good for SEO
- [ ] Ready to publish

### What happens after merge

1. Articles go live at \`/[locale]/blog/[slug]\`
2. Keywords marked \`covered: true\` in \`data/seo/goldmine-keywords.json\`
3. IndexNow ping should be triggered (wire manually if not yet automated)

---
*Generated by SEOContentAgent — do not modify the JSON-LD or frontmatter without re-validating*`;

  // ── 5. Open PR or save locally ─────────────────────────────────────────────
  const branchName = `seo-content/${today}`;
  const prResult = await createBranchAndPR(branchName, files, {
    title: `[seo-content-review] ${drafts.length} nuovi articoli goldmine — ${today}`,
    body: prBody,
    head: branchName,
    base: "main",
    labels: ["seo-content-review", "automated"],
  });

  if (!prResult) {
    // Fallback: save drafts locally
    console.warn("[content] GitHub PR creation skipped — saving drafts locally");
    const fallbackDir = path.join(DRAFTS_FALLBACK_DIR, today);
    await mkdir(fallbackDir, { recursive: true });
    for (const f of files) {
      const outPath = path.join(fallbackDir, f.path.replace(/\//g, "_"));
      await writeFile(outPath, f.content, "utf-8");
    }
    skipped.push("github_pr");
  }

  return {
    ok: true,
    date: today,
    drafts,
    pr_url: prResult?.url,
    prs_created: prResult ? [prResult.url] : [],
    skipped: skipped.length > 0 ? skipped : undefined,
  };
}
