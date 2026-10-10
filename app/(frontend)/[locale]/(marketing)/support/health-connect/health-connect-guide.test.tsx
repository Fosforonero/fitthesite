import fs from 'node:fs';
import path from 'node:path';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { SUPPORT_FAQS } from '@/lib/content/faqs';
import { REDDIT_COMMUNITY_LIVE } from '@/lib/product-facts';
import SupportPage from '../page';
import HealthConnectGuidePage, {
  generateMetadata,
  generateStaticParams,
} from './page';

vi.mock('@/lib/blog/payload-source', async () => {
  const { BLOG_POSTS: posts } = await import('@/lib/blog/data');
  return { getBlogPosts: async () => posts, getBlogPostsBySlug: async () => posts };
});

afterEach(() => {
  cleanup();
});

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
    expect(metaIt.openGraph?.title).toBe(metaIt.title);
    expect(metaIt.openGraph?.description).toBe(metaIt.description);
    expect(metaIt.openGraph?.url).toBe('https://www.fitmesh.fit/it/support/health-connect');
    expect((metaIt.openGraph as any)?.type).toBe('article');
    expect(metaIt.openGraph?.locale).toBe('it_IT');
    expect((metaIt.openGraph?.images as Array<{ url: string }>)?.[0]?.url).toBe(
      'https://www.fitmesh.fit/support/health-connect/01-impostazioni-connessione-salute.webp',
    );
    expect((metaIt.twitter as any)?.card).toBe('summary_large_image');
    expect(metaIt.twitter?.title).toBe(metaIt.title);
    expect(metaIt.twitter?.images).toEqual([
      'https://www.fitmesh.fit/support/health-connect/01-impostazioni-connessione-salute.webp',
    ]);

    const metaEn = await generateMetadata({ params: Promise.resolve({ locale: 'en' }) });
    expect(metaEn.title).toContain('Health Connect');
    expect(metaEn.alternates?.canonical).toBe('https://www.fitmesh.fit/en/support/health-connect');
    expect(metaEn.openGraph?.title).toBe(metaEn.title);
    expect(metaEn.openGraph?.description).toBe(metaEn.description);
    expect(metaEn.openGraph?.url).toBe('https://www.fitmesh.fit/en/support/health-connect');
    expect(metaEn.openGraph?.locale).toBe('en_US');
    expect((metaEn.openGraph?.images as Array<{ url: string }>)?.[0]?.url).toBe(
      'https://www.fitmesh.fit/support/health-connect/01-impostazioni-connessione-salute.webp',
    );
    expect((metaEn.twitter as any)?.card).toBe('summary_large_image');
    expect(metaEn.twitter?.title).toBe(metaEn.title);
    expect(metaEn.twitter?.images).toEqual([
      'https://www.fitmesh.fit/support/health-connect/01-impostazioni-connessione-salute.webp',
    ]);

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

  it('rendering effettivo: renderizza 8 passi con identificatori univoci (#passo-1..8) e immagini associate a figcaption per IT ed EN', async () => {
    for (const lc of ['it', 'en'] as const) {
      const pageUi = await HealthConnectGuidePage({ params: Promise.resolve({ locale: lc }) });
      const { container } = render(pageUi);

      const imageSrcs = new Set<string>();

      for (let stepId = 1; stepId <= 8; stepId++) {
        const stepElem = container.querySelector(`#passo-${stepId}`);
        expect(stepElem, `Passo ${stepId} non trovato per lingua ${lc}`).not.toBeNull();

        const figure = stepElem!.querySelector('figure');
        expect(figure, `Figure assente nel passo ${stepId}`).not.toBeNull();

        const img = figure!.querySelector('img');
        expect(img, `Img assente nel passo ${stepId}`).not.toBeNull();
        const src = img!.getAttribute('src');
        expect(src).toMatch(new RegExp(`^/support/health-connect/0${stepId}-.*\\.webp$`));
        imageSrcs.add(src!);

        const figcaption = figure!.querySelector('figcaption');
        expect(figcaption, `Figcaption assente nel passo ${stepId}`).not.toBeNull();
        expect(figcaption!.textContent?.trim().length).toBeGreaterThan(20);

        // La dicitura dell'ambiente non deve essere ripetuta nelle didascalie dei singoli passi
        expect(figcaption!.textContent).not.toContain('Ambiente: emulatore');
        expect(figcaption!.textContent).not.toContain('Environment: Google Pixel 6');
      }

      expect(imageSrcs.size).toBe(8);
      cleanup();
    }
  });

  it('rendering effettivo: include avvertenze sui dati demo, assenza di qa-demo e badge tecnico, ambiente una sola volta', async () => {
    // 1. Verifica Italiano
    const itUi = await HealthConnectGuidePage({ params: Promise.resolve({ locale: 'it' }) });
    const { container: itContainer } = render(itUi);

    // Disclaimer ambiente in header: specifica emulatore Google Pixel 6, Android 14, QA 3.9.9+190, lingua italiana
    expect(itContainer.textContent).toContain('emulatore Google Pixel 6 con Android 14 (API 34) e app FitMesh QA 3.9.9+190');
    expect(itContainer.textContent).toContain('interfaccia di sistema in lingua italiana');
    expect(itContainer.textContent).toContain('non da una prova su telefono fisico');

    // Nessun riferimento a qa-demo@internal.invalid sulla pagina pubblica
    expect(itContainer.textContent).not.toContain('qa-demo@internal.invalid');

    // Nessun badge tecnico «Non verificato a runtime su banco sintetico»
    expect(itContainer.textContent).not.toContain('Non verificato a runtime su banco sintetico');

    // Nuova avvertenza comprensibile al passo 3
    const itStep3 = itContainer.querySelector('#passo-3');
    expect(itStep3?.textContent).toContain('Le schermate mostrano dati dimostrativi; l’importazione da un dispositivo reale non è illustrata in questa guida.');
    expect(itStep3?.textContent).toContain('indica semplicemente che per quella categoria non risultano registrazioni disponibili');

    // Passo 6: avvertenza esplicita sui dati sintetici e gestione errori lettura
    const itStep6 = itContainer.querySelector('#passo-6');
    expect(itStep6?.textContent).toContain('dati sintetici precaricati');
    expect(itStep6?.textContent).toContain('non ha acquisito registrazioni valide');

    // Passo 7: stato interno noto a FitMesh, non dimostrazione che Health Connect sia vuoto
    const itStep7 = itContainer.querySelector('#passo-7');
    expect(itStep7?.textContent).toContain('Non dimostrano che Connessione Salute sia priva di registrazioni');
    expect(itStep7?.textContent).toContain('Non dimostrano che Connessione Salute sia vuota');

    // Diagramma di flusso: "dashboard nell'app"
    expect(itContainer.textContent).toContain("dashboard nell'app");

    // Didascalie senza ripetizione dell'ambiente
    const itCaptions = Array.from(itContainer.querySelectorAll('figcaption')).map((f) => f.textContent || '').join(' ');
    expect(itCaptions).not.toContain('Ambiente: emulatore');
    cleanup();

    // 2. Verifica Inglese
    const enUi = await HealthConnectGuidePage({ params: Promise.resolve({ locale: 'en' }) });
    const { container: enContainer } = render(enUi);

    expect(enContainer.textContent).toContain('Google Pixel 6 emulator running Android 14 (API 34) with FitMesh QA app 3.9.9+190');
    expect(enContainer.textContent).toContain('system interface in Italian locale');
    expect(enContainer.textContent).toContain('not on a physical phone');

    expect(enContainer.textContent).not.toContain('qa-demo@internal.invalid');
    expect(enContainer.textContent).not.toContain('Unverified at runtime on synthetic bench');

    const enStep3 = enContainer.querySelector('#passo-3');
    expect(enStep3?.textContent).toContain('The screenshots show demo data; importing data from a real device is not illustrated in this guide.');
    expect(enStep3?.textContent).toContain('simply indicates that no records are currently available');

    const enStep6 = enContainer.querySelector('#passo-6');
    expect(enStep6?.textContent).toContain('pre-loaded synthetic fixture data');
    expect(enStep6?.textContent).toContain('did not retrieve valid records');

    const enStep7 = enContainer.querySelector('#passo-7');
    expect(enStep7?.textContent).toContain('They do not prove Health Connect itself is empty');

    expect(enContainer.textContent).toContain('dashboard trends in the app');

    const enCaptions = Array.from(enContainer.querySelectorAll('figcaption')).map((f) => f.textContent || '').join(' ');
    expect(enCaptions).not.toContain('Environment: Google Pixel 6');
    cleanup();
  });

  it('rendering effettivo: JSON-LD HowTo include 8 passi con URL validi e nessun totalTime arbitrario', async () => {
    for (const lc of ['it', 'en'] as const) {
      const pageUi = await HealthConnectGuidePage({ params: Promise.resolve({ locale: lc }) });
      const { container } = render(pageUi);

      const scripts = Array.from(container.querySelectorAll('script[type="application/ld+json"]'));
      expect(scripts.length).toBeGreaterThanOrEqual(1);

      const howToScript = scripts.find((s) => {
        try {
          const json = JSON.parse(s.textContent || '{}');
          return json['@type'] === 'HowTo';
        } catch {
          return false;
        }
      });
      expect(howToScript, `Tag JSON-LD HowTo assente per ${lc}`).toBeDefined();

      const schema = JSON.parse(howToScript!.textContent || '{}');
      expect(schema['@type']).toBe('HowTo');
      expect(schema.step).toBeDefined();
      expect(Array.isArray(schema.step)).toBe(true);
      expect(schema.step.length).toBe(8);

      for (let i = 0; i < 8; i++) {
        const step = schema.step[i];
        expect(step['@type']).toBe('HowToStep');
        expect(step.position).toBe(i + 1);
        expect(step.url).toBe(`https://www.fitmesh.fit/${lc}/support/health-connect#passo-${i + 1}`);
        expect(step.image).toMatch(/^https:\/\/www\.fitmesh\.fit\/support\/health-connect\/0[1-8]-.*\.webp$/);
      }

      // Nessun totalTime arbitrario
      expect(schema.totalTime).toBeUndefined();
      expect(howToScript!.textContent).not.toContain('totalTime');
      cleanup();
    }
  });

  it('integrazione supporto e sitemap: la pagina Supporto e sitemap collegano la guida per IT/EN senza perdite nelle altre lingue', async () => {
    // IT: banner presente con link alla guida, Reddit non nell'header ma in zona secondaria (se live)
    const itUi = await SupportPage({ params: Promise.resolve({ locale: 'it' }) });
    const { container: itContainer } = render(itUi);
    const itGuideLink = itContainer.querySelector('a[href="/it/support/health-connect"]');
    expect(itGuideLink).not.toBeNull();

    const itHeader = itContainer.querySelector('header');
    expect(itHeader?.textContent).not.toContain('r/FitMesh');
    if (REDDIT_COMMUNITY_LIVE) {
      expect(itContainer.textContent).toContain('Community');
      expect(itContainer.textContent).toContain('r/FitMesh');
    }
    cleanup();

    // EN: banner presente con link alla guida, Reddit non nell'header ma in zona secondaria (se live)
    const enUi = await SupportPage({ params: Promise.resolve({ locale: 'en' }) });
    const { container: enContainer } = render(enUi);
    const enGuideLink = enContainer.querySelector('a[href="/en/support/health-connect"]');
    expect(enGuideLink).not.toBeNull();

    const enHeader = enContainer.querySelector('header');
    expect(enHeader?.textContent).not.toContain('r/FitMesh');
    if (REDDIT_COMMUNITY_LIVE) {
      expect(enContainer.textContent).toContain('Community');
      expect(enContainer.textContent).toContain('r/FitMesh');
    }
    cleanup();

    // ES: nessun link a health-connect (nessun fallback inglese silenzioso), Reddit nell'header (se live)
    const esUi = await SupportPage({ params: Promise.resolve({ locale: 'es' }) });
    const { container: esContainer } = render(esUi);
    const esGuideLink = esContainer.querySelector('a[href*="health-connect"]');
    expect(esGuideLink).toBeNull();

    const esHeader = esContainer.querySelector('header');
    if (REDDIT_COMMUNITY_LIVE) {
      expect(esHeader?.textContent).toContain('r/FitMesh');
    }
    // Nessun blocco secondario Community in inglese per ES
    expect(esContainer.textContent).not.toContain('Looking to discuss device setups');
    cleanup();

    // Sitemap XML include /support/health-connect esclusivamente per IT ed EN
    const { default: sitemap } = await import('@/app/sitemap');
    const sitemapEntries = await sitemap();
    const hcEntries = sitemapEntries.filter((e) => e.url.includes('/support/health-connect'));
    expect(hcEntries.length).toBe(2);
    expect(hcEntries.map((e) => e.url).sort()).toEqual([
      'https://www.fitmesh.fit/en/support/health-connect',
      'https://www.fitmesh.fit/it/support/health-connect',
    ]);
    for (const entry of hcEntries) {
      expect(entry.alternates?.languages?.it).toBe('https://www.fitmesh.fit/it/support/health-connect');
      expect(entry.alternates?.languages?.en).toBe('https://www.fitmesh.fit/en/support/health-connect');
      expect(entry.alternates?.languages?.['x-default']).toBe('https://www.fitmesh.fit/it/support/health-connect');
      expect(Object.keys(entry.alternates?.languages || {})).toEqual(['it', 'en', 'x-default']);
    }
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
