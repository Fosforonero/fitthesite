import { redirect } from "next/navigation";
import { defaultLocale } from "@/lib/i18n";

/**
 * Root path: redirect to the default locale.
 * Long term we could auto-detect Accept-Language via middleware, but for now
 * we send everyone to /it (brand default).
 */
export default function Root() {
  redirect(`/${defaultLocale}`);
}
