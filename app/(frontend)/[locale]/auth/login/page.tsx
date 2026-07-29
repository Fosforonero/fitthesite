import Link from 'next/link';
import { redirect } from 'next/navigation';

import { createClient } from '@/lib/supabase/server';
import { getDictionary, locales, type Locale } from '@/lib/i18n';

import { LoginForm } from './LoginForm';
import {
  FORGOT_PASSWORD_LOCALES,
  TRANSLATIONS as FORGOT_PASSWORD_TRANSLATIONS,
  type ForgotPasswordLocale,
} from '../forgot-password/translations';

export const dynamic = 'force-dynamic';

export default async function LoginPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const { locale } = await params;
  const { next, error } = await searchParams;
  const lc = (locales as readonly string[]).includes(locale)
    ? (locale as Locale)
    : 'it';
  const t = await getDictionary(lc);

  // Se già loggato, redirect a private area
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) {
    redirect(`/${lc}/app`);
  }

  return (
    <main className="max-w-md mx-auto px-4 sm:px-6 py-16 sm:py-24">
      <div className="text-center mb-8">
        <h1 className="font-display text-display-md font-semibold tracking-tightest text-text-primary">
          {t.auth?.login?.heading ?? 'Accedi a FitMesh'}
        </h1>
        <p className="mt-3 text-text-secondary">
          {t.auth?.login?.subheading ??
            'Ti mandiamo un link via email. Niente password da ricordare.'}
        </p>
      </div>

      <LoginForm
        locale={lc}
        nextPath={next}
        translations={{
          emailLabel: t.auth?.login?.email_label ?? 'Email',
          emailPlaceholder: t.auth?.login?.email_placeholder ?? 'tua@email.it',
          submitLabel: t.auth?.login?.submit ?? 'Inviami il link di accesso',
          sendingLabel: t.auth?.login?.sending ?? 'Invio in corso…',
          successTitle: t.auth?.login?.success_title ?? 'Controlla la tua email',
          successBody:
            t.auth?.login?.success_body ??
            'Abbiamo inviato un link di accesso. Apri l\'email e clicca per entrare.',
          tryAgain: t.auth?.login?.try_again ?? 'Manda di nuovo',
        }}
        initialError={error ?? null}
      />

      {/*
        Hotfix P0.10R: chi ha impostato una password dall'app FitMesh e non
        la ricorda finiva qui senza alcuna via d'uscita (questo form manda
        un magic link, non risolve una password dimenticata). La copy arriva
        dalle traduzioni di forgot-password, non dal dizionario del sito,
        cosi' resta allineata alla pagina di destinazione.
      */}
      <p className="mt-6 text-center">
        <Link
          href={`/${lc}/auth/forgot-password`}
          className="text-sm text-text-secondary hover:text-text-primary transition"
        >
          {FORGOT_PASSWORD_TRANSLATIONS[
            (FORGOT_PASSWORD_LOCALES as readonly string[]).includes(lc)
              ? (lc as ForgotPasswordLocale)
              : 'en'
          ].fromLoginLink}
        </Link>
      </p>

      <p className="mt-8 text-center text-xs text-text-muted">
        {t.auth?.login?.disclaimer ??
          'Accedendo accetti i nostri Termini e la Privacy Policy. I tuoi dati di salute non vengono condivisi né trattati a scopi medici.'}
      </p>
    </main>
  );
}
