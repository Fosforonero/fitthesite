import { locales, type Locale } from '@/lib/i18n';
import { ResetPasswordForm, type ResetPasswordTranslations } from './ResetPasswordForm';

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

  const subtitleSuffix: Record<'it' | 'es' | 'en', string> = {
    it: 'Il codice arriva dall\'app FitMesh via email: inseriscilo qui insieme alla nuova password.',
    es: 'El código llega desde la app FitMesh por email: introdúcelo aquí junto con tu nueva contraseña.',
    en: 'The code arrives from the FitMesh app by email: enter it here together with your new password.',
  };

  const t: ResetPasswordTranslations & { title: string; subtitle: string } = lc === 'it'
    ? {
        title: 'Imposta una nuova password',
        subtitle: subtitleSuffix.it,
        emailLabel: 'Email',
        emailPlaceholder: 'La tua email FitMesh',
        otpLabel: 'Codice ricevuto via email',
        otpPlaceholder: '123456',
        otpHint: 'Il codice e\' valido una sola volta: se lo hai gia\' usato, richiedine uno nuovo dall\'app.',
        passwordLabel: 'Nuova password',
        passwordPlaceholder: 'Almeno 8 caratteri',
        confirmLabel: 'Conferma password',
        submit: 'Salva nuova password',
        saving: 'Salvataggio in corso…',
        success: 'Password aggiornata! Torna sull\'app FitMesh e accedi con la nuova password.',
        errorMissingFields: 'Inserisci email e codice.',
        errorTooShort: 'La password deve avere almeno 8 caratteri.',
        errorMismatch: 'Le due password non corrispondono.',
        errorExpiredOrUsed:
          'Questo codice non e\' piu\' valido. Richiedine uno nuovo dall\'app e usa soltanto l\'email piu\' recente.',
        errorRateLimited: 'Troppi tentativi. Aspetta qualche minuto e riprova.',
        errorNetwork: 'Problema di connessione. Controlla la rete e riprova.',
        errorGeneric: 'Errore durante il salvataggio. Riprova o richiedi un nuovo codice dall\'app.',
        backToLogin: 'Torna alla home',
      }
    : lc === 'es'
    ? {
        title: 'Establece una nueva contraseña',
        subtitle: subtitleSuffix.es,
        emailLabel: 'Email',
        emailPlaceholder: 'Tu email de FitMesh',
        otpLabel: 'Código recibido por email',
        otpPlaceholder: '123456',
        otpHint: 'El código solo es válido una vez: si ya lo usaste, solicita uno nuevo desde la app.',
        passwordLabel: 'Nueva contraseña',
        passwordPlaceholder: 'Al menos 8 caracteres',
        confirmLabel: 'Confirma la contraseña',
        submit: 'Guardar nueva contraseña',
        saving: 'Guardando…',
        success: 'Contraseña actualizada. Vuelve a la app FitMesh e inicia sesión con tu nueva contraseña.',
        errorMissingFields: 'Introduce email y código.',
        errorTooShort: 'La contraseña debe tener al menos 8 caracteres.',
        errorMismatch: 'Las dos contraseñas no coinciden.',
        errorExpiredOrUsed:
          'Este código ya no es válido. Solicita uno nuevo desde la app y usa solo el email más reciente.',
        errorRateLimited: 'Demasiados intentos. Espera unos minutos y vuelve a intentarlo.',
        errorNetwork: 'Problema de conexión. Revisa la red y vuelve a intentarlo.',
        errorGeneric: 'Error al guardar. Vuelve a intentarlo o solicita un nuevo código desde la app.',
        backToLogin: 'Volver al inicio',
      }
    : {
        title: 'Set a new password',
        subtitle: subtitleSuffix.en,
        emailLabel: 'Email',
        emailPlaceholder: 'Your FitMesh email',
        otpLabel: 'Code received by email',
        otpPlaceholder: '123456',
        otpHint: 'The code works only once: if you already used it, request a new one from the app.',
        passwordLabel: 'New password',
        passwordPlaceholder: 'At least 8 characters',
        confirmLabel: 'Confirm password',
        submit: 'Save new password',
        saving: 'Saving…',
        success: 'Password updated! Go back to the FitMesh app and sign in with your new password.',
        errorMissingFields: 'Enter your email and code.',
        errorTooShort: 'Password must be at least 8 characters.',
        errorMismatch: 'The two passwords do not match.',
        errorExpiredOrUsed:
          'This code is no longer valid. Request a new one from the app and use only the most recent email.',
        errorRateLimited: 'Too many attempts. Wait a few minutes and try again.',
        errorNetwork: 'Connection problem. Check your network and try again.',
        errorGeneric: 'Error while saving. Try again or request a new code from the app.',
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
