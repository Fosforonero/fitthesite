import { redirect } from "next/navigation";
import { cookies, headers } from "next/headers";
import { resolveNegotiatedLocale, LOCALE_COOKIE_NAME } from "@/lib/locale-negotiation";

/**
 * Root path safety net.
 *
 * middleware.ts già intercetta '/' PRIMA che questa route venga renderizzata
 * (stesso `resolveNegotiatedLocale`: cookie fm_locale -> Accept-Language ->
 * geo IP -> 'en'), quindi in condizioni normali questo componente non viene
 * mai eseguito. Resta come fallback difensivo per il caso in cui il matcher
 * del middleware non copra questa request per qualche motivo — usa la
 * stessa negoziazione, MAI un redirect permanente forzato su /it.
 */
export default async function Root() {
  const [cookieStore, headerStore] = await Promise.all([cookies(), headers()]);
  const locale = resolveNegotiatedLocale({
    cookieLocale: cookieStore.get(LOCALE_COOKIE_NAME)?.value,
    acceptLanguage: headerStore.get("accept-language"),
    country: headerStore.get("x-vercel-ip-country"),
  });
  redirect(`/${locale}`);
}
