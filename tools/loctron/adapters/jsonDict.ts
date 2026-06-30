import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { Segment, Lang } from "../core/types.ts";
import type { ProjectConfig } from "../config.ts";
import type { SourceAdapter } from "./index.ts";

type Json = Record<string, unknown>;

/** Adapter per dizionari JSON annidati (es. lib/dictionaries/en.json del sito). */
export class JsonDictAdapter implements SourceAdapter {
  private p: ProjectConfig;
  private base: Json;

  constructor(p: ProjectConfig) {
    this.p = p;
    this.base = JSON.parse(readFileSync(join(p.sourceDir, p.templateFile), "utf8")) as Json;
  }

  extract(): { segments: Segment[]; manual: string[] } {
    const segments: Segment[] = [];
    walk(this.base, [], segments);
    return { segments, manual: [] };
  }

  build(_lang: Lang, byId: Map<string, string>): string {
    const out = structuredClone(this.base);
    setAll(out, [], byId);
    return JSON.stringify(out, null, 2) + "\n";
  }

  outPath(lang: Lang): string {
    return join(this.p.outDir, this.p.filePattern.replace("$lang", lang));
  }
}

function walk(node: unknown, p: string[], out: Segment[]): void {
  if (typeof node === "string") {
    out.push({ id: p.join("."), source: node, context: "ui" });
    return;
  }
  if (Array.isArray(node)) {
    node.forEach((v, i) => walk(v, [...p, String(i)], out));
    return;
  }
  if (node && typeof node === "object") {
    for (const [k, v] of Object.entries(node)) walk(v, [...p, k], out);
  }
}

function setAll(node: unknown, p: string[], byId: Map<string, string>): void {
  if (Array.isArray(node)) {
    node.forEach((v, i) => {
      if (typeof v === "string") {
        const t = byId.get([...p, String(i)].join("."));
        if (t != null) node[i] = t;
      } else {
        setAll(v, [...p, String(i)], byId);
      }
    });
    return;
  }
  if (node && typeof node === "object") {
    const obj = node as Json;
    for (const [k, v] of Object.entries(obj)) {
      if (typeof v === "string") {
        const t = byId.get([...p, k].join("."));
        if (t != null) obj[k] = t;
      } else {
        setAll(v, [...p, k], byId);
      }
    }
  }
}
