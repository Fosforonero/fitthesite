import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { isWebDashboardPrototypeEnabled } from '@/lib/web-dashboard/flag';

export const dynamic = 'force-dynamic';

/**
 * PROTOTIPO INTERNO della dashboard web personale (dati sintetici).
 * Senza WEB_DASHBOARD_PROTOTYPE=1, e in ogni caso in produzione Vercel, la rotta
 * non esiste (404). Mai indicizzabile: nessun canonical, nessun hreflang, nessun
 * OG ereditato dalla home, `noindex, nofollow`. Non e' nel sitemap, in robots.txt,
 * in llms.txt o in un link pubblico: la dashboard web non e' disponibile.
 */
export function generateMetadata(): Metadata {
  return {
    title: 'Anteprima interna',
    description: 'Prototipo interno con dati sintetici.',
    robots: { index: false, follow: false, nocache: true },
    alternates: {},
    openGraph: { title: 'Anteprima interna', description: 'Prototipo interno con dati sintetici.' },
  };
}

export default function DashboardPreviewLayout({ children }: { children: React.ReactNode }) {
  if (!isWebDashboardPrototypeEnabled()) notFound();
  return children;
}
