import type { Metadata, Viewport } from "next";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import CookieBanner from "@/components/CookieBanner";

const SITE_URL = "https://www.fitmesh.fit";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "FitMesh — Sync your watch data to a personal dashboard",
    template: "%s — FitMesh",
  },
  description:
    "FitMesh sincronizza i dati del tuo Galaxy Watch o Wear OS con una dashboard web personale: passi, battito, sonno e calorie sempre con te.",
  keywords: [
    "Galaxy Watch dashboard",
    "Wear OS sync",
    "Health Connect",
    "Samsung Health",
    "fitness dashboard",
    "sleep tracker",
    "heart rate",
  ],
  openGraph: {
    type: "website",
    url: SITE_URL,
    siteName: "FitMesh",
    title: "FitMesh — Sync your watch data to a personal dashboard",
    description:
      "Passi, battito, sonno e calorie del tuo smartwatch, su una dashboard web tua. Nativa, leggera, niente cloud di terzi.",
    images: [{ url: "/og.png", width: 1200, height: 630, alt: "FitMesh" }],
    locale: "it_IT",
  },
  twitter: {
    card: "summary_large_image",
    title: "FitMesh",
    description:
      "Dashboard personale per i dati di salute del tuo smartwatch.",
    images: ["/og.png"],
  },
  alternates: { canonical: SITE_URL },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: "#080b12",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="it">
      <body className="min-h-screen flex flex-col bg-radial-fade">
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
        <CookieBanner />
      </body>
    </html>
  );
}
