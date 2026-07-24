import { Inter, Space_Grotesk } from "next/font/google";

/**
 * P0.9: estratti dal vecchio root layout unico condiviso, ora che ogni
 * "isola" (app/(frontend)/[locale]/layout.tsx, delete-account, mockups,
 * oauth, la root "/") ha il proprio root layout — next/font richiede che
 * la chiamata al loader avvenga a module scope in un file compilato da
 * Next, non necessariamente nel file layout stesso, quindi un modulo
 * condiviso evita di richiamare 5 volte lo stesso font loader.
 */
export const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const grotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-grotesk",
  display: "swap",
});
