import { generateLlmsTxt } from "@/lib/llms-txt";

/**
 * Serve /llms.txt (rewrite in next.config.mjs, stesso pattern di
 * /.well-known/*: Next.js non gestisce bene un segmento di route con `.` nel
 * mezzo del nome file finale, quindi la route vive qui e viene rimappata).
 *
 * force-static: contenuto generato da lib/product-facts.ts, non da request —
 * va bene pre-renderizzato una volta a build/deploy, come robots.txt/sitemap.xml.
 */
export const dynamic = "force-static";

export async function GET() {
  return new Response(generateLlmsTxt(), {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
