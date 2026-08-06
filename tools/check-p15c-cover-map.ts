/**
 * Guardrail cover-map — P1.5C Fase 2.
 *
 * Fallisce (exit 1) se:
 *  1. un post pubblicato non ha una entry esplicita in `POST_COVER`: senza,
 *     ricadrebbe silenziosamente sul default per-categoria di `coverType()`
 *     (spesso "sync"/devices.webp, generico e non pertinente — trovato su 7
 *     post durante l'audit P1.5C, 4 dei quali con un cover davvero sbagliato
 *     perché la categoria "guides" non ha un case dedicato nel fallback).
 *  2. un file dichiarato in `COVER_FILE` non esiste su disco in
 *     `public/blog/covers/`.
 *  3. un file in `public/blog/covers/` non è 1200x675 (parser WebP VP8X
 *     locale, nessuna dipendenza esterna).
 *  4. due file diversi in `public/blog/covers/` sono byte-identici (stesso
 *     SHA-256) SENZA essere nell'allowlist esplicita sotto (oggi vuota: ogni
 *     cover deve essere un'immagine distinta, vedi il caso "pillar
 *     fitmesh.webp" respinto perché duplicato byte-per-byte di zona2.webp,
 *     documentato in docs/seo/p15c-cover-image-ledger.md).
 *  5. l'hash SHA-256 respinto di P1.5C (`pillar fitmesh.webp` / duplicato di
 *     zona2.webp) compare sotto un nome diverso da quello legittimo
 *     (zone-2-different-devices.webp): significherebbe che il file scartato
 *     è stato copiato/rinominato/reintrodotto.
 *  6. un nome di file cover (uno dei valori di `COVER_FILE`) è hardcoded
 *     fuori da `lib/blog/covers.ts`: la mappa deve restare l'unica fonte di
 *     verità (`coverSrc()`), sia per l'`<img>` che per `BlogPosting.image`
 *     nel JSON-LD — un hardcode altrove romperebbe quella coerenza silenziosamente.
 *  7. (solo se BASE_URL è impostata) uno degli URL cover pubblici non
 *     risponde 200 con content-type image/webp.
 *
 * Uso (Docker, nessun runtime locale):
 *   docker run --rm -v "$PWD":/app -w /app node:22 npx tsx tools/check-p15c-cover-map.ts
 *   BASE_URL=https://www.fitmesh.fit per includere anche i controlli live (7).
 */
import { createHash } from "node:crypto";
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join } from "node:path";
import { execSync } from "node:child_process";
import { BLOG_POSTS } from "@/lib/blog/data";
import { COVER_FILE, POST_COVER, COVER_W, COVER_H } from "@/lib/blog/covers";

const COVERS_DIR = join(process.cwd(), "public", "blog", "covers");
const REPO_ROOT = process.cwd();
// Hash del file respinto (P1.5C): "pillar fitmesh.webp" consegnato da
// Matteo, risultato byte-identico a zona2.webp. Vedi ledger.
const REJECTED_DUP_HASH = "d24814d790bcd66511e93d65f2055a192f7cea942d60b0bc3cf607f35a3916b8";
const REJECTED_DUP_LEGIT_FILE = "zone-2-different-devices.webp";
// Duplicati byte-per-byte esplicitamente accettati (oggi nessuno): se in
// futuro due cover DEVONO condividere lo stesso file per scelta consapevole,
// documentarlo qui invece di far fallire il guardrail in silenzio.
const ALLOWED_DUP_HASHES = new Set<string>();

const problems: string[] = [];

async function main(): Promise<void> {

/**
 * Legge le dimensioni di un WebP. Supporta sia il formato esteso (VP8X,
 * usato dalle cover P1.5C con ICC/metadata) sia il formato semplice lossy
 * (VP8, prodotto normalmente da cwebp/ImageMagick quando il file NON ha
 * bisogno di alpha/animazione/ICC — bug reale trovato in P1.8S-IMG: le 3
 * cover normalizzate (crop 1200x686->1200x675 + strip metadata) erano
 * WebP validi e corretti al 100%, ma finivano nel formato semplice, che
 * questo parser rifiutava a priori come "impossibile leggere le
 * dimensioni" — un file valido veniva scambiato per un file rotto).
 */
function webpDimensions(buf: Buffer): { width: number; height: number } | null {
  if (buf.length < 30) return null;
  if (buf.toString("ascii", 0, 4) !== "RIFF" || buf.toString("ascii", 8, 12) !== "WEBP") return null;
  const chunkFourCC = buf.toString("ascii", 12, 16);
  if (chunkFourCC === "VP8X") {
    // Chunk data inizia a offset 20 (dopo FourCC + size a 4 byte). Layout: 1
    // byte flags, 3 riservati, 3 width-1 (LE), 3 height-1 (LE).
    const width = buf.readUIntLE(24, 3) + 1;
    const height = buf.readUIntLE(27, 3) + 1;
    return { width, height };
  }
  if (chunkFourCC === "VP8 ") {
    // Formato semplice lossy (RFC 6386 §9.1): dopo FourCC+size (8 byte),
    // 3 byte frame tag, poi 3 byte start code (0x9d 0x01 0x2a), poi
    // width/height a 2 byte LE ciascuno (14 bit valore + 2 bit scale,
    // maschera 0x3FFF per isolare il valore).
    if (buf.length < 30) return null;
    const startCodeOk = buf[23] === 0x9d && buf[24] === 0x01 && buf[25] === 0x2a;
    if (!startCodeOk) return null;
    const width = buf.readUInt16LE(26) & 0x3fff;
    const height = buf.readUInt16LE(28) & 0x3fff;
    return { width, height };
  }
  if (chunkFourCC === "VP8L") {
    // Formato semplice lossless (spec WebP lossless bitstream §2): dopo
    // FourCC+size, 1 byte signature (0x2f), poi 4 byte little-endian che
    // impacchettano 14 bit width-1 + 14 bit height-1 + 4 bit flag.
    if (buf.length < 25 || buf[20] !== 0x2f) return null;
    const bits = buf.readUInt32LE(21);
    const width = (bits & 0x3fff) + 1;
    const height = ((bits >> 14) & 0x3fff) + 1;
    return { width, height };
  }
  return null; // container riconosciuto ma chunk immagine non gestito
}

// 1. Ogni post pubblicato ha una entry esplicita in POST_COVER.
for (const post of BLOG_POSTS) {
  if (!POST_COVER[post.slug]) {
    problems.push(
      `[fallback-silenzioso] "${post.slug}" non ha una entry esplicita in POST_COVER: ricade sul default per-categoria di coverType(), non è una scelta intenzionale.`,
    );
  }
}

// 2+3. File dichiarati esistono e sono 1200x675.
const declaredFiles = new Set(Object.values(COVER_FILE));
for (const [type, file] of Object.entries(COVER_FILE)) {
  const path = join(COVERS_DIR, file);
  if (!existsSync(path)) {
    problems.push(`[file-mancante] CoverType "${type}" dichiara "${file}" ma il file non esiste in public/blog/covers/.`);
    continue;
  }
  const buf = readFileSync(path);
  const dim = webpDimensions(buf);
  if (!dim) {
    problems.push(`[dimensioni-illeggibili] "${file}": impossibile leggere le dimensioni (non un WebP VP8X valido).`);
  } else if (dim.width !== COVER_W || dim.height !== COVER_H) {
    problems.push(`[dimensioni-sbagliate] "${file}": ${dim.width}x${dim.height}, atteso ${COVER_W}x${COVER_H}.`);
  }
}

// 4+5. Scan duplicati byte-per-byte su TUTTO il contenuto reale della cartella
// (non solo i file dichiarati: intercetta anche file orfani lasciati per errore).
if (existsSync(COVERS_DIR)) {
  const onDisk = readdirSync(COVERS_DIR).filter((f) => f.endsWith(".webp"));
  const byHash = new Map<string, string[]>();
  for (const f of onDisk) {
    const buf = readFileSync(join(COVERS_DIR, f));
    const hash = createHash("sha256").update(buf).digest("hex");
    if (hash === REJECTED_DUP_HASH && f !== REJECTED_DUP_LEGIT_FILE) {
      problems.push(
        `[hash-respinto] "${f}" ha l'hash SHA-256 del file scartato in P1.5C (duplicato di zona2.webp, "pillar fitmesh.webp"): non deve mai essere reintrodotto sotto nessun nome.`,
      );
    }
    const list = byHash.get(hash) ?? [];
    list.push(f);
    byHash.set(hash, list);
  }
  for (const [hash, files] of byHash) {
    if (files.length > 1 && !ALLOWED_DUP_HASHES.has(hash)) {
      problems.push(`[duplicato-non-documentato] ${files.join(", ")} sono byte-identici (SHA-256 ${hash.slice(0, 12)}...) e non sono nell'allowlist.`);
    }
  }
  // File presenti su disco ma non referenziati da nessun CoverType: non un
  // errore bloccante di per sé, ma segnalato per igiene (asset orfano).
  const orphans = onDisk.filter((f) => !declaredFiles.has(f));
  if (orphans.length > 0) {
    problems.push(`[file-orfani] presenti in public/blog/covers/ ma non referenziati da nessun CoverType: ${orphans.join(", ")}.`);
  }
} else {
  problems.push(`[cartella-mancante] public/blog/covers/ non esiste.`);
}

// 6. Nessun nome di file cover hardcoded fuori da lib/blog/covers.ts, nel
// layer che alimenta cover/JSON-LD (app/, components/). Deliberatamente
// ESCLUSO lib/blog/posts/: un post può legittimamente riusare lo stesso file
// come immagine INLINE nel corpo (type: "image", contenuto editoriale, non
// il cover/header del post) — non è un bypass della mappa centrale, è un
// riuso intenzionale del file per un altro scopo. Vedi
// galaxy-watch-ultra2-watch9-health-connect.ts (P1.3N-C, preesistente).
try {
  const filesToCheck = [...declaredFiles].map((f) => f.replace(/\./g, "\\.")).join("|");
  const grepCmd = `grep -rlE "(${filesToCheck})" --include="*.ts" --include="*.tsx" app components 2>/dev/null || true`;
  const out = execSync(grepCmd, { cwd: REPO_ROOT, encoding: "utf8" }).trim();
  if (out) {
    problems.push(`[hardcode-fuori-mappa] nomi di file cover trovati fuori da lib/blog/covers.ts nel layer app/components: ${out.split("\n").join(", ")}.`);
  }
} catch {
  // grep senza match esce con codice non-zero in alcune shell: già gestito dal "|| true" sopra.
}

// 7. Controlli live (opzionali): solo se BASE_URL è impostata.
async function liveChecks(): Promise<void> {
  const base = process.env.BASE_URL;
  if (!base) {
    console.log("ℹ️  BASE_URL non impostata: controlli live (URL 200 + content-type) SALTATI, non dichiarati verdi.");
    return;
  }
  for (const file of declaredFiles) {
    const url = `${base.replace(/\/$/, "")}/blog/covers/${file}`;
    try {
      const res = await fetch(url);
      const ct = res.headers.get("content-type") ?? "";
      if (res.status !== 200) {
        problems.push(`[url-non-200] ${url} -> ${res.status}.`);
      } else if (!ct.includes("image/webp")) {
        problems.push(`[content-type-sbagliato] ${url} -> "${ct}", atteso image/webp.`);
      }
    } catch (e) {
      problems.push(`[url-non-raggiungibile] ${url}: ${(e as Error).message}.`);
    }
  }
}

await liveChecks();

if (problems.length > 0) {
  console.error(`❌ P1.5C cover-map guardrail: ${problems.length} problemi.\n`);
  for (const p of problems) console.error("  " + p);
  process.exit(1);
}
console.log(
  `✅ P1.5C cover-map guardrail: ${BLOG_POSTS.length} post tutti con cover esplicita, ${declaredFiles.size} file cover tutti presenti a ${COVER_W}x${COVER_H}, nessun duplicato non documentato, hash del file respinto assente sotto nomi non legittimi, nessun hardcode fuori dalla mappa centrale.`,
);
}

main().catch((err) => {
  console.error("❌ P1.5C cover-map guardrail: errore inatteso", err);
  process.exit(1);
});
