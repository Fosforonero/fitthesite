import Link from 'next/link';

import { locales, type Locale } from '@/lib/i18n';

import { ExportDataClient } from './ExportDataClient';

export const dynamic = 'force-dynamic';

const L = {
  it: {
    back: '← Impostazioni',
    heading: 'Esporta i miei dati',
    body: 'Scarica una copia completa dei tuoi dati (profilo, dispositivi, metriche, allenamenti, consensi) in formato JSON. Diritto alla portabilità (GDPR art. 20).',
    cta: 'Scarica i miei dati (JSON)',
    working: 'Preparazione in corso…',
    doneTitle: 'Download avviato',
    doneBody: 'Il file con i tuoi dati è stato scaricato.',
    errorTitle: 'Errore',
  },
  en: {
    back: '← Settings',
    heading: 'Export my data',
    body: 'Download a full copy of your data (profile, devices, metrics, workouts, consents) as JSON. Right to data portability (GDPR art. 20).',
    cta: 'Download my data (JSON)',
    working: 'Preparing…',
    doneTitle: 'Download started',
    doneBody: 'The file with your data has been downloaded.',
    errorTitle: 'Error',
  },
  es: {
    back: '← Ajustes',
    heading: 'Exportar mis datos',
    body: 'Descarga una copia completa de tus datos (perfil, dispositivos, métricas, entrenamientos, consentimientos) en formato JSON. Derecho a la portabilidad (RGPD art. 20).',
    cta: 'Descargar mis datos (JSON)',
    working: 'Preparando…',
    doneTitle: 'Descarga iniciada',
    doneBody: 'El archivo con tus datos se ha descargado.',
    errorTitle: 'Error',
  },
  de: {
    back: '← Einstellungen',
    heading: 'Meine Daten exportieren',
    body: 'Lade eine vollständige Kopie deiner Daten (Profil, Geräte, Metriken, Workouts, Einwilligungen) als JSON herunter. Recht auf Datenübertragbarkeit (DSGVO Art. 20).',
    cta: 'Meine Daten herunterladen (JSON)',
    working: 'Wird vorbereitet…',
    doneTitle: 'Download gestartet',
    doneBody: 'Die Datei mit deinen Daten wurde heruntergeladen.',
    errorTitle: 'Fehler',
  },
  pt: {
    back: '← Configurações',
    heading: 'Exportar meus dados',
    body: 'Baixe uma cópia completa dos seus dados (perfil, dispositivos, métricas, treinos, consentimentos) em formato JSON. Direito à portabilidade (GDPR art. 20).',
    cta: 'Baixar meus dados (JSON)',
    working: 'Preparando…',
    doneTitle: 'Download iniciado',
    doneBody: 'O arquivo com seus dados foi baixado.',
    errorTitle: 'Erro',
  },
  fr: {
    back: '← Réglages',
    heading: 'Exporter mes données',
    body: 'Téléchargez une copie complète de vos données (profil, appareils, mesures, entraînements, consentements) au format JSON. Droit à la portabilité (RGPD art. 20).',
    cta: 'Télécharger mes données (JSON)',
    working: 'Préparation…',
    doneTitle: 'Téléchargement lancé',
    doneBody: 'Le fichier avec vos données a été téléchargé.',
    errorTitle: 'Erreur',
  },
} as const;

export default async function ExportPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const lc: Locale = (locales as readonly string[]).includes(locale) ? (locale as Locale) : 'it';
  const t = L[lc];

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <Link href={`/${lc}/app/settings`} className="text-sm text-text-muted hover:text-text-primary">
        {t.back}
      </Link>
      <div className="mt-4">
        <ExportDataClient locale={lc} t={t} />
      </div>
    </div>
  );
}
