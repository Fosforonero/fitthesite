import fs from "node:fs/promises";
import path from "node:path";

import matter from "gray-matter";
import readingTime from "reading-time";

import type { Locale } from "@/lib/i18n";

export type BlogFrontmatter = {
  title: string;
  description: string;
  date: string; // ISO YYYY-MM-DD
  author?: string;
  tags?: string[];
  cover?: string;
};

export type BlogPostMeta = BlogFrontmatter & {
  slug: string;
  locale: Locale;
  readingMinutes: number;
};

export type BlogPost = BlogPostMeta & {
  content: string;
};

const CONTENT_DIR = path.join(process.cwd(), "content", "blog");

/**
 * Convention: file `<slug>.<locale>.md` o `<slug>.<locale>.mdx`.
 * Es: `come-sincronizzare-smartwatch-dashboard.it.md`
 */
function isBlogFilename(name: string, locale: Locale): { slug: string } | null {
  const m = name.match(/^(.+?)\.(it|en)\.(md|mdx)$/);
  if (!m) return null;
  if (m[2] !== locale) return null;
  return { slug: m[1]! };
}

async function readAllFiles(): Promise<string[]> {
  try {
    return await fs.readdir(CONTENT_DIR);
  } catch {
    return [];
  }
}

export async function listPosts(locale: Locale): Promise<BlogPostMeta[]> {
  const files = await readAllFiles();
  const posts: BlogPostMeta[] = [];
  for (const file of files) {
    const match = isBlogFilename(file, locale);
    if (!match) continue;
    const raw = await fs.readFile(path.join(CONTENT_DIR, file), "utf8");
    const parsed = matter(raw);
    const fm = parsed.data as BlogFrontmatter;
    posts.push({
      ...fm,
      slug: match.slug,
      locale,
      readingMinutes: Math.max(1, Math.round(readingTime(parsed.content).minutes)),
    });
  }
  // Newest first
  return posts.sort((a, b) => (a.date < b.date ? 1 : -1));
}

export async function getPost(slug: string, locale: Locale): Promise<BlogPost | null> {
  // Tentativo .md poi .mdx
  for (const ext of ["md", "mdx"] as const) {
    const file = path.join(CONTENT_DIR, `${slug}.${locale}.${ext}`);
    try {
      const raw = await fs.readFile(file, "utf8");
      const parsed = matter(raw);
      const fm = parsed.data as BlogFrontmatter;
      return {
        ...fm,
        slug,
        locale,
        readingMinutes: Math.max(1, Math.round(readingTime(parsed.content).minutes)),
        content: parsed.content,
      };
    } catch {
      // try next
    }
  }
  return null;
}

/** Lista tutti gli slug presenti (per generateStaticParams) */
export async function listAllSlugs(): Promise<Array<{ slug: string; locale: Locale }>> {
  const files = await readAllFiles();
  const out: Array<{ slug: string; locale: Locale }> = [];
  for (const file of files) {
    const m = file.match(/^(.+?)\.(it|en)\.(md|mdx)$/);
    if (!m) continue;
    out.push({ slug: m[1]!, locale: m[2] as Locale });
  }
  return out;
}
