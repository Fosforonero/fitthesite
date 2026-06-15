import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createClient } from "@supabase/supabase-js";

import { locales, type Locale } from "@/lib/i18n";

// Force dynamic rendering — invite pages are always fresh and must not be statically generated.
export const dynamic = "force-dynamic";

const SITE_URL = "https://www.fitmesh.fit";
const ANDROID_PACKAGE = "com.fitmeshsync.app";

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } },
  );
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string; code: string }> }): Promise<Metadata> {
  const { code } = await params;
  return {
    title: `Unisciti alla famiglia — FitMesh Sync`,
    description: `Invito famiglia con codice ${code}`,
    robots: { index: false, follow: false },  // Non indicizzare invite URL
  };
}

type InvitePreview = {
  groupName: string;
  ownerDisplayName: string | null;
  membersCount: number;
  expiresAt: string;
};

async function fetchPreview(code: string): Promise<InvitePreview | { error: string }> {
  if (!/^MESH-[A-Z0-9]{4}$/.test(code)) return { error: "invalid_format" };
  const supabaseAdmin = getSupabaseAdmin();
  const { data: invite, error } = await supabaseAdmin
    .from("group_invites")
    .select("group_id, expires_at, uses_count, max_uses, created_by")
    .eq("code", code)
    .maybeSingle();
  if (error || !invite) return { error: "not_found" };
  if (new Date(invite.expires_at).getTime() < Date.now()) return { error: "expired" };
  if (invite.uses_count >= invite.max_uses) return { error: "exhausted" };

  const { data: group } = await supabaseAdmin
    .from("groups")
    .select("name, type")
    .eq("id", invite.group_id)
    .maybeSingle();
  if (!group || group.type !== "family") return { error: "not_found" };

  const { count } = await supabaseAdmin
    .from("group_members")
    .select("*", { count: "exact", head: true })
    .eq("group_id", invite.group_id)
    .is("left_at", null);

  const { data: owner } = await supabaseAdmin
    .from("group_members")
    .select("display_name")
    .eq("group_id", invite.group_id)
    .eq("user_id", invite.created_by)
    .maybeSingle();

  return {
    groupName: group.name as string,
    ownerDisplayName: (owner?.display_name as string) ?? null,
    membersCount: count ?? 0,
    expiresAt: invite.expires_at as string,
  };
}

export default async function JoinFamilyPage({
  params,
}: {
  params: Promise<{ locale: string; code: string }>;
}) {
  const { locale, code } = await params;
  if (!locales.includes(locale as Locale)) notFound();
  const lc = locale as Locale;
  const t = (it: string, en: string, es: string) => (lc === "it" ? it : lc === "es" ? es : en);

  const preview = await fetchPreview(code);
  const isError = "error" in preview;

  const playStoreUrl =
    `https://play.google.com/store/apps/details?id=${ANDROID_PACKAGE}&referrer=${encodeURIComponent(`invite=${code}`)}`;
  const universalUrl = `${SITE_URL}/${lc}/famiglia/join/${code}`;

  return (
    <main className="mx-auto max-w-md px-6 py-12">
      <h1 className="text-3xl font-semibold mb-4">
        {isError ? t("Invito non valido", "Invalid invite", "Invitación no válida") : t("Sei stato invitato", "You're invited", "Te han invitado")}
      </h1>

      {isError ? (
        <div className="rounded-lg border border-red-500/30 bg-red-500/5 p-4">
          <p>{
            (preview as { error: string }).error === "expired" ? t("Questo invito è scaduto.", "This invite has expired.", "Esta invitación ha caducado.") :
            (preview as { error: string }).error === "exhausted" ? t("Invito già utilizzato.", "Invite already used.", "La invitación ya fue utilizada.") :
            (preview as { error: string }).error === "invalid_format" ? t("Formato codice non valido.", "Invalid code format.", "Formato de código no válido.") :
            t("Codice non trovato. Chiedi un nuovo invito.", "Code not found. Ask for a new invite.", "Código no encontrado. Pide una nueva invitación.")
          }</p>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="rounded-lg border border-divider p-4">
            <p className="text-sm text-text-muted">{t("Famiglia", "Family", "Familia")}</p>
            <p className="text-xl font-semibold">{(preview as InvitePreview).groupName}</p>
            {(preview as InvitePreview).ownerDisplayName && (
              <p className="text-sm text-text-muted mt-1">
                {t("Creata da", "Created by", "Creada por")} {(preview as InvitePreview).ownerDisplayName}
              </p>
            )}
            <p className="text-sm text-text-muted mt-1">
              {(preview as InvitePreview).membersCount} {t("membri", "members", "miembros")}
            </p>
          </div>

          <div className="space-y-3">
            <a href={universalUrl}
               className="block w-full rounded-pill bg-brand-aqua px-6 py-3 text-center font-semibold text-bg-dark">
              {t("Apri in FitMesh (se installata)", "Open in FitMesh (if installed)", "Abrir en FitMesh (si está instalada)")}
            </a>
            <a href={playStoreUrl}
               className="block w-full rounded-pill border border-brand-aqua px-6 py-3 text-center font-semibold text-brand-aqua">
              {t("Installa FitMesh per unirti", "Install FitMesh to join", "Instala FitMesh para unirte")}
            </a>
          </div>

          <div className="rounded-lg border border-divider p-4">
            <p className="text-xs text-text-muted mb-2">
              {t("Oppure inserisci manualmente in app:", "Or enter manually in app:", "O introdúcelo manualmente en la app:")}
            </p>
            <p className="font-mono text-lg font-bold tracking-wider">{code}</p>
          </div>

          <p className="text-xs text-text-muted">
            {t("Dopo l'unione, condividerai per default: passi, sonno, frequenza cardiaca, attività. Modifica nelle impostazioni.",
               "After joining you'll share by default: steps, sleep, heart rate, activity. Change in settings.",
               "Al unirte, compartirás por defecto: pasos, sueño, frecuencia cardíaca, actividad. Puedes cambiarlo en ajustes.")}
          </p>
        </div>
      )}
    </main>
  );
}
