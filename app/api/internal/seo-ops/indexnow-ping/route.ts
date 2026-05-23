import { NextResponse } from "next/server";
import { pingIndexNow } from "@/lib/seo/indexnow";

const SEO_OPS_ALERT_SECRET = process.env.SEO_OPS_ALERT_SECRET;

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  // Auth via SEO_OPS_ALERT_SECRET (reuses existing SEO Ops infra secret)
  const auth = req.headers.get("authorization");
  if (!SEO_OPS_ALERT_SECRET || auth !== `Bearer ${SEO_OPS_ALERT_SECRET}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const urls: string[] = Array.isArray(body.urls) ? body.urls : [];

  if (urls.length === 0) {
    return NextResponse.json({ error: "no_urls" }, { status: 400 });
  }
  if (urls.length > 10000) {
    return NextResponse.json({ error: "too_many_urls" }, { status: 400 });
  }

  try {
    const result = await pingIndexNow(urls);
    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json(
      {
        error: "ping_failed",
        details: (e as Error).message,
      },
      { status: 500 },
    );
  }
}
