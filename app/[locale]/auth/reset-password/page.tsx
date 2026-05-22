import { locales, type Locale } from '@/lib/i18n';
import { ResetPasswordForm } from './ResetPasswordForm';

export const dynamic = 'force-static';

export default async function ResetPasswordPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const lc = (locales as readonly string[]).includes(locale)
    ? (locale as Locale)
    : 'it';

  const t = lc === 'it'
    ? {
        title: 'Imposta una nuova password',
        subtitle:
          'Inserisci la nuova password che vuoi usare per il tuo account FitMesh. Dopo averla salvata torna sull\'app e fai login.',
        passwordLabel: 'Nuova password',
        passwordPlaceholder: 'Almeno 8 caratteri',
        confirmLabel: 'Conferma password',
        submit: 'Salva nuova password',
        saving: 'Salvataggio in corso…',
        success: 'Password aggiornata! Torna sull\'app FitMesh e accedi con la nuova password.',
        errorTooShort: 'La password deve avere almeno 8 caratteri.',
        errorMismatch: 'Le due password non corrispondono.',
        errorMissingToken:
          'Link di reset non valido o scaduto. Richiedi un nuovo link dall\'app (Password dimenticata?).',
        errorGeneric: 'Errore durante il salvataggio. Riprova o richiedi un nuovo link.',
        backToLogin: 'Torna alla home',
      }
    : {
        title: 'Set a new password',
        subtitle:
          'Choose a new password for your FitMesh account. After saving, go back to the app and sign in.',
        passwordLabel: 'New password',
        passwordPlaceholder: 'At least 8 characters',
        confirmLabel: 'Confirm password',
        submit: 'Save new password',
        saving: 'Saving…',
        success: 'Password updated! Go back to the FitMesh app and sign in with your new password.',
        errorTooShort: 'Password must be at least 8 characters.',
        errorMismatch: 'The two passwords do not match.',
        errorMissingToken:
          'Reset link is invalid or expired. Request a new one from the app (Forgot password?).',
        errorGeneric: 'Error while saving. Try again or request a new link.',
        backToLogin: 'Back to home',
      };

  return (
    <main className="max-w-md mx-auto px-4 sm:px-6 py-16 sm:py-24">
      <div className="text-center mb-8">
        <h1 className="font-display text-display-md font-semibold tracking-tightest text-text-primary">
          {t.title}
        </h1>
        <p className="mt-3 text-text-secondary leading-relaxed">{t.subtitle}</p>
      </div>

      <ResetPasswordForm locale={lc} translations={t} />
    </main>
  );
}
