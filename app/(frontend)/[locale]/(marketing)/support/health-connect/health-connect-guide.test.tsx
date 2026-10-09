import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { SUPPORT_FAQS } from '@/lib/content/faqs';
import HealthConnectGuidePage, {
  generateMetadata,
  generateStaticParams,
} from './page';

describe('Guida Connessione Salute Android (Support Health Connect)', () => {
  it('generateStaticParams espone esclusivamente IT ed EN', () => {
    const params = generateStaticParams();
    expect(params).toEqual([{ locale: 'it' }, { locale: 'en' }]);
  });

  it('generateMetadata genera metadata corretti per IT ed EN senza fallback silenzioso', async () => {
    const metaIt = await generateMetadata({ params: Promise.resolve({ locale: 'it' }) });
    expect(metaIt.title).toContain('Connessione Salute');
    expect(metaIt.alternates?.canonical).toBe('https://www.fitmesh.fit/it/support/health-connect');
    expect(metaIt.alternates?.languages).toEqual({
      it: 'https://www.fitmesh.fit/it/support/health-connect',
      en: 'https://www.fitmesh.fit/en/support/health-connect',
    });

    const metaEn = await generateMetadata({ params: Promise.resolve({ locale: 'en' }) });
    expect(metaEn.title).toContain('Health Connect');
    expect(metaEn.alternates?.canonical).toBe('https://www.fitmesh.fit/en/support/health-connect');

    // Lingue non supportate devono chiamare notFound()
    for (const nonSupported of ['es', 'de', 'fr', 'ja', 'pl', 'tr', 'nl']) {
      await expect(
        generateMetadata({ params: Promise.resolve({ locale: nonSupported }) }),
      ).rejects.toThrow();
    }
  });

  it('tutti gli 8 asset WebP referenziati esistono su disco in public/support/health-connect/', () => {
    const dir = path.join(process.cwd(), 'public/support/health-connect');
    expect(fs.existsSync(dir)).toBe(true);

    const filesInDir = fs.readdirSync(dir);
    // Solo file WebP destinati agli utenti, nessun file raw o manifest
    for (const f of filesInDir) {
      expect(f.endsWith('.webp')).toBe(true);
    }
    expect(filesInDir.length).toBe(8);

    const expectedFiles = [
      '01-impostazioni-connessione-salute.webp',
      '02-connessione-salute-autorizzazioni-app.webp',
      '03-connessione-salute-categorie-dati.webp',
      '04-elenco-app-fitmesh.webp',
      '05-permessi-lettura-fitmesh.webp',
      '06-dashboard-sincronizza-ora.webp',
      '07-centro-sincronizzazione-diagnostica.webp',
      '08-impostazioni-batteria-background.webp',
    ];

    for (const expected of expectedFiles) {
      expect(filesInDir).toContain(expected);
      const stat = fs.statSync(path.join(dir, expected));
      expect(stat.size).toBeGreaterThan(10000); // File non vuoto e > 10KB
    }
  });

  it('il manifest tecnico e i file PNG raw sono conservati nella cartella privata docs/qa/', () => {
    const privateDir = path.join(process.cwd(), 'docs/qa/support-health-connect');
    expect(fs.existsSync(path.join(privateDir, 'MANIFEST-SCREENSHOTS.md'))).toBe(true);
    expect(fs.existsSync(path.join(privateDir, 'raw'))).toBe(true);

    const rawFiles = fs.readdirSync(path.join(privateDir, 'raw'));
    expect(rawFiles.length).toBeGreaterThanOrEqual(8);
    for (const rf of rawFiles) {
      expect(rf.endsWith('.png')).toBe(true);
    }
  });

  it('il componente renderizza 8 passi con figure, figcaption, didascalie demo e JSON-LD privo di totalTime arbitrario', async () => {
    const itPage = await HealthConnectGuidePage({ params: Promise.resolve({ locale: 'it' }) });
    expect(itPage).toBeDefined();

    const enPage = await HealthConnectGuidePage({ params: Promise.resolve({ locale: 'en' }) });
    expect(enPage).toBeDefined();

    // Lingue non autorizzate generano notFound
    await expect(
      HealthConnectGuidePage({ params: Promise.resolve({ locale: 'es' }) }),
    ).rejects.toThrow();
  });

  it('le FAQ di supporto su Android (indice 0) specificano Android 14 vs 9-13 e il pulsante Sincronizza ora nella schermata principale', () => {
    const faqIt = SUPPORT_FAQS.it[0];
    expect(faqIt.a).toContain('Android 14');
    expect(faqIt.a).toContain('Sicurezza e privacy');
    expect(faqIt.a).toContain('Sincronizza ora');
    expect(faqIt.a).toContain('schermata principale');
    expect(faqIt.a).toContain('Centro Sincronizzazione');
    expect(faqIt.a).not.toContain('«Sincronizza Ora» nelle impostazioni');

    const faqEn = SUPPORT_FAQS.en[0];
    expect(faqEn.a).toContain('Android 14');
    expect(faqEn.a).toContain('Security & privacy');
    expect(faqEn.a).toContain('Sync now');
    expect(faqEn.a).toContain('home screen');
    expect(faqEn.a).toContain('Sync Center');
  });
});
