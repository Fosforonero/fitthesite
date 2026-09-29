import { notFound, redirect } from 'next/navigation';

import { isWebDashboardPrototypeEnabled } from '@/lib/web-dashboard/flag';

export const dynamic = 'force-dynamic';

export default async function DashboardPreviewIndex({ params }: { params: Promise<{ locale: string }> }) {
  if (!isWebDashboardPrototypeEnabled()) notFound();
  const { locale } = await params;
  redirect(`/${locale}/dashboard-preview/overview`);
}
