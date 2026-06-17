/**
 * One-off: rimuove un post dal CMS Payload per slug, cosi' il merge del blog
 * (payload-source) ricade sul modulo TS versionato, che e' la versione completa
 * e tradotta. Cascade gestito dalla local API di Payload.
 *
 * Uso: set -a; . ./.env.local; set +a; npx tsx scripts/delete-cms-post.mts <slug>
 */
import config from "@payload-config";
import { getPayload } from "payload";

const slug = process.argv[2];
if (!slug) {
  console.error("Manca lo slug. Uso: npx tsx scripts/delete-cms-post.mts <slug>");
  process.exit(1);
}

const payload = await getPayload({ config });

const found = await payload.find({
  collection: "posts",
  where: { slug: { equals: slug } },
  limit: 5,
  locale: "all",
});

console.log(`Trovati ${found.docs.length} post con slug="${slug}" nel CMS.`);
if (found.docs.length === 0) {
  console.log("Niente da cancellare (gia' assente). Il blog usa gia' il .ts.");
  process.exit(0);
}

for (const doc of found.docs as Array<{ id: string | number }>) {
  const res = await payload.delete({ collection: "posts", id: doc.id });
  console.log(`Cancellato post id=${(res as { id: string | number }).id}`);
}

const after = await payload.find({
  collection: "posts",
  where: { slug: { equals: slug } },
  limit: 1,
});
console.log(`Rimasti dopo delete: ${after.docs.length} (atteso 0).`);
process.exit(0);
