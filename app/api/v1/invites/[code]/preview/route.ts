import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET(_req: Request, { params }: { params: Promise<{ code: string }> }) {
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } },
  );
  const { code } = await params;
  if (!/^MESH-[A-Z0-9]{4}$/.test(code)) {
    return NextResponse.json({ error: "invalid_format" }, { status: 400 });
  }
  const { data: invite } = await supabaseAdmin
    .from("group_invites")
    .select("group_id, expires_at, uses_count, max_uses")
    .eq("code", code)
    .maybeSingle();
  if (!invite) return NextResponse.json({ error: "not_found" }, { status: 404 });
  if (new Date(invite.expires_at).getTime() < Date.now()) {
    return NextResponse.json({ error: "expired" }, { status: 410 });
  }
  if (invite.uses_count >= invite.max_uses) {
    return NextResponse.json({ error: "exhausted" }, { status: 410 });
  }
  const { data: group } = await supabaseAdmin
    .from("groups")
    .select("name, type")
    .eq("id", invite.group_id)
    .maybeSingle();
  if (!group) return NextResponse.json({ error: "not_found" }, { status: 404 });
  const { count } = await supabaseAdmin
    .from("group_members")
    .select("*", { count: "exact", head: true })
    .eq("group_id", invite.group_id)
    .is("left_at", null);
  return NextResponse.json({
    group_name: group.name,
    group_type: group.type,
    members_count: count ?? 0,
    expires_at: invite.expires_at,
  }, { headers: { "cache-control": "no-store" } });
}
