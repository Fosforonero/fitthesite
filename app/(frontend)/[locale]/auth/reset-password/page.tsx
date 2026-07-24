import type { Locale } from '@/lib/i18n';
import { ResetPasswordForm } from './ResetPasswordForm';
import { RESET_PASSWORD_LOCALES, TRANSLATIONS, type ResetPasswordLocale } from './translations';

export const dynamic = 'force-static';

export default async function ResetPasswordPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const lc: ResetPasswordLocale = (RESET_PASSWORD_LOCALES as readonly string[]).includes(locale)
    ? (locale as ResetPasswordLocale)
    : 'en';

  const t = TRANSLATIONS[lc];

  return (
    <main className="max-w-md mx-auto px-4 sm:px-6 py-16 sm:py-24">
      <div className="text-center mb-8">
        <h1 className="font-display text-display-md font-semibold tracking-tightest text-text-primary">
          {t.title}
        </h1>
        <p className="mt-3 text-text-secondary leading-relaxed">{t.subtitle}</p>
      </div>

      <ResetPasswordForm locale={lc as Locale} translations={t} />
    </main>
  );
}
