export type Platform = "android" | "ios";

/**
 * SSOT per le piattaforme supportate da un provider o modello.
 * - Apple Health: solo iOS
 * - Colmi e Oura: Android + iOS
 * - Default: Android
 */
export function providerPlatforms(provider?: { platforms?: string[]; slug?: string }): Platform[] {
  if (!provider) return ["android"];
  if (provider.slug === "apple-health") return ["ios"];
  if (provider.slug === "oura" || provider.slug === "colmi-ring") return ["android", "ios"];
  if (Array.isArray(provider.platforms) && provider.platforms.length > 0) {
    const list: Platform[] = [];
    if (provider.platforms.includes("android")) list.push("android");
    if (provider.platforms.includes("ios")) list.push("ios");
    if (list.length > 0) return list;
  }
  return ["android"];
}
