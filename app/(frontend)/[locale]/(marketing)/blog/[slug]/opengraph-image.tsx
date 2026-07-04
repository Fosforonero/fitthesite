import { ImageResponse } from "next/og";
import { BLOG_POSTS, BLOG_POSTS_BY_SLUG, categoryLabel } from "@/lib/blog/data";
import { tl } from "@/lib/blog/types";
import { locales, type Locale } from "@/lib/i18n";

export const alt = "FitMesh Blog";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** Pre-render OG image for every (locale, slug) combination at build time. */
export function generateStaticParams() {
  return BLOG_POSTS.flatMap((p) =>
    locales.map((locale) => ({ locale, slug: p.slug })),
  );
}

export default async function OGBlogPost({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  const lc: Locale = locales.includes(locale as Locale)
    ? (locale as Locale)
    : "it";
  const post = BLOG_POSTS_BY_SLUG[slug];

  if (!post) {
    return new ImageResponse(<div style={{ background: "#050816" }} />, { ...size });
  }

  const title = tl(post.hero.title, lc);
  const category = categoryLabel(post.category, lc);
  const readLabel = lc === "it" ? `${post.readMinutes} min di lettura` : `${post.readMinutes} min read`;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          background: "linear-gradient(180deg, #0B1023 0%, #050816 100%)",
          padding: "72px 80px",
          color: "#FFFFFF",
          fontFamily: "Inter, system-ui, sans-serif",
          position: "relative",
        }}
      >
        {/* Aqua glow top-right */}
        <div
          style={{
            position: "absolute",
            top: -200,
            right: -120,
            width: 600,
            height: 600,
            borderRadius: "9999px",
            background: "radial-gradient(circle, rgba(33,230,193,0.25), rgba(33,230,193,0) 70%)",
          }}
        />
        {/* Blue glow bottom-left */}
        <div
          style={{
            position: "absolute",
            bottom: -250,
            left: -120,
            width: 700,
            height: 700,
            borderRadius: "9999px",
            background: "radial-gradient(circle, rgba(29,161,255,0.20), rgba(29,161,255,0) 70%)",
          }}
        />

        {/* Wordmark top */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 18,
            position: "relative",
          }}
        >
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 16,
              background: "linear-gradient(135deg, #7CFF5B 0%, #21E6C1 45%, #1DA1FF 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#03121f",
              fontSize: 26,
              fontWeight: 800,
              letterSpacing: -1,
            }}
          >
            FM
          </div>
          <span style={{ fontSize: 24, fontWeight: 700, letterSpacing: -0.4 }}>
            FitMesh Sync
          </span>
          <span
            style={{
              marginLeft: 16,
              padding: "4px 14px",
              borderRadius: 999,
              border: "1px solid rgba(33,230,193,0.4)",
              background: "rgba(33,230,193,0.1)",
              color: "#21E6C1",
              fontSize: 13,
              fontWeight: 600,
              letterSpacing: 1,
            }}
          >
            BLOG
          </span>
        </div>

        {/* Category + read time */}
        <div
          style={{
            marginTop: 52,
            display: "flex",
            alignItems: "center",
            gap: 16,
            position: "relative",
          }}
        >
          <span
            style={{
              padding: "4px 14px",
              borderRadius: 999,
              background: "rgba(124,255,91,0.12)",
              color: "#7CFF5B",
              fontSize: 13,
              fontWeight: 600,
              letterSpacing: 0.5,
              textTransform: "uppercase",
            }}
          >
            {category}
          </span>
          <span style={{ fontSize: 13, color: "#7F8AA3" }}>·</span>
          <span style={{ fontSize: 13, color: "#7F8AA3" }}>{readLabel}</span>
          {post.pillar && (
            <>
              <span style={{ fontSize: 13, color: "#7F8AA3" }}>·</span>
              <span style={{ fontSize: 13, color: "#21E6C1", fontWeight: 600 }}>
                {lc === "it" ? "Guida principale" : "Main guide"}
              </span>
            </>
          )}
        </div>

        {/* Article title — main content */}
        <div
          style={{
            marginTop: 28,
            flex: 1,
            display: "flex",
            alignItems: "center",
            position: "relative",
          }}
        >
          <h1
            style={{
              fontSize: title.length > 60 ? 44 : title.length > 40 ? 52 : 60,
              fontWeight: 700,
              letterSpacing: -1.5,
              lineHeight: 1.1,
              color: "#FFFFFF",
              maxWidth: 900,
              margin: 0,
            }}
          >
            {title}
          </h1>
        </div>

        {/* Footer */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            position: "relative",
          }}
        >
          <span style={{ fontSize: 18, color: "#B7C2D8" }}>fitmesh.fit/blog</span>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "8px 20px",
              borderRadius: 999,
              background: "linear-gradient(135deg, rgba(124,255,91,0.15), rgba(33,230,193,0.15))",
              border: "1px solid rgba(33,230,193,0.25)",
            }}
          >
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: "9999px",
                background: "#21E6C1",
              }}
            />
            <span style={{ fontSize: 15, color: "#21E6C1", fontWeight: 600 }}>
              {lc === "it" ? "Health Connect · Privacy-first" : "Health Connect · Privacy-first"}
            </span>
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
