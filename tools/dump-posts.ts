import { BLOG_POSTS } from "@/lib/blog/data";
for (const p of BLOG_POSTS) {
  const cat = (p as { category?: string }).category ?? "";
  const pil = (p as { pillar?: boolean }).pillar ? "PILLAR" : "";
  const kw = (p.primaryKeyword?.en ?? "").slice(0, 44);
  console.log(`${p.slug} | ${cat} | ${pil} | ${kw}`);
}
console.log(`TOT ${BLOG_POSTS.length}`);
