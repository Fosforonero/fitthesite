import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

/**
 * Percorsi risolti dalla posizione del tool (non dalla cwd), così loctron
 * funziona qualunque sia la working dir di Docker. Montare la cartella PARENT
 * ("App Orologio") per avere sia il sito sia l'app visibili.
 */
export const LOCTRON_ROOT = dirname(fileURLToPath(import.meta.url)); // .../fitthesite/tools/loctron
export const SITE_ROOT = resolve(LOCTRON_ROOT, "..", ".."); // .../fitthesite
export const PARENT_ROOT = resolve(SITE_ROOT, ".."); // .../App Orologio
