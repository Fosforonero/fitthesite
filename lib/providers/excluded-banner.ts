import type { Locale } from "@/lib/i18n";
import type { Provider } from "@/lib/providers/data";

/**
 * Provider esclusi con compatibilita indiretta documentata verso Apple Salute / Health Connect.
 */
const HUB_BRIDGE_DOCUMENTED_SLUGS = new Set([
  "fitbit",
  "polar",
  "oura",
  "withings",
]);

export function hasDocumentedHubBridge(providerSlug: string): boolean {
  return HUB_BRIDGE_DOCUMENTED_SLUGS.has(providerSlug);
}

const DIRECT_UNAVAILABLE_MAP: Record<Locale, (brand: string) => string> = {
  it: (b) => `Il collegamento diretto a ${b} non è attualmente disponibile in FitMesh.`,
  en: (b) => `Direct connection to ${b} is not currently available in FitMesh.`,
  es: (b) => `La conexión directa con ${b} no está disponible actualmente en FitMesh.`,
  de: (b) => `Eine direkte Verbindung zu ${b} ist derzeit in FitMesh nicht verfügbar.`,
  pt: (b) => `A ligação direta a ${b} não está atualmente disponível no FitMesh.`,
  fr: (b) => `La connexion directe à ${b} n'est pas disponible actuellement dans FitMesh.`,
  pl: (b) => `Bezpośrednie połączenie z ${b} nie jest obecnie dostępne w FitMesh.`,
  tr: (b) => `${b} ile doğrudan bağlantı şu anda FitMesh içinde kullanılamıyor.`,
  nl: (b) => `Directe koppeling met ${b} is momenteel niet beschikbaar in FitMesh.`,
  ja: (b) => `${b}への直接接続は現在FitMeshでご利用いただけません。`,
  ko: (b) => `${b} 직접 연결은 현재 FitMesh에서 지원되지 않습니다.`,
  sv: (b) => `Direktanslutning till ${b} är för närvarande inte tillgänglig i FitMesh.`,
  da: (b) => `Direkte forbindelse til ${b} er i øjeblikket ikke tilgængelig i FitMesh.`,
  no: (b) => `Direkte tilkobling til ${b} er for øyeblikket ikke tilgjengelig i FitMesh.`,
  fi: (b) => `Suoraa yhteyttä palveluun ${b} ei tällä hetkellä ole saatavilla FitMeshissä.`,
};

const INDIRECT_HUB_CLAUSE_MAP: Record<Locale, string> = {
  it: "Eventuali dati condivisi dall'app del produttore con Apple Salute o Health Connect possono essere letti da FitMesh, limitatamente alle metriche effettivamente disponibili e ai permessi concessi.",
  en: "Any data shared by the manufacturer app with Apple Health or Health Connect can be read by FitMesh, limited to the metrics actually available and the permissions granted.",
  es: "Cualquier dato compartido por la app del fabricante con Apple Health o Health Connect puede ser leído por FitMesh, limitado a las métricas realmente disponibles y a los permisos concedidos.",
  de: "Daten, die von der Hersteller-App mit Apple Health oder Health Connect geteilt werden, können von FitMesh gelesen werden, beschränkt auf die tatsächlich verfügbaren Metriken und erteilten Berechtigungen.",
  pt: "Quaisquer dados partilhados pela aplicação do fabricante com a Apple Health ou o Health Connect podem ser lidos pelo FitMesh, limitando-se às métricas efetivamente disponíveis e às permissões concedidas.",
  fr: "Les données partagées par l'application du fabricant avec Apple Santé ou Health Connect peuvent être lues par FitMesh, dans la limite des métriques réellement disponibles et des autorisations accordées.",
  pl: "Dane udostępnione przez aplikację producenta w Apple Health lub Health Connect mogą być odczytywane przez FitMesh, z ograniczeniem do rzeczywiście dostępnych wskaźników i udzielonych uprawnień.",
  tr: "Üretici uygulamasının Apple Health veya Health Connect ile paylaştığı veriler, yalnızca fiilen mevcut olan metrikler ve verilen izinler dahilinde FitMesh tarafından okunabilir.",
  nl: "Gegevens die door de app van de fabrikant worden gedeeld met Apple Health of Health Connect kunnen door FitMesh worden gelezen, beperkt tot de daadwerkelijk beschikbare meetwaarden en verleende toestemmingen.",
  ja: "メーカーのアプリがApple HealthまたはHealth Connectと共有したデータは、実際に利用可能な指標および付与された権限の範囲内でFitMeshにより読み取ることができます。",
  ko: "제조사 앱이 Apple Health 또는 Health Connect와 공유한 데이터는 실제로 사용 가능한 지표 및 부여된 권한 범위 내에서 FitMesh가 읽을 수 있습니다.",
  sv: "Data som tillverkarens app delar med Apple Hälsa eller Health Connect kan läsas av FitMesh, begränsat till de mätvärden som faktiskt är tillgängliga och de behörigheter som beviljats.",
  da: "Data, som producentens app deler med Apple Sundhed eller Health Connect, kan læses af FitMesh, begrænset til de målinger, der rent faktisk er tilgængelige, og de givne tilladelser.",
  no: "Data som produsentens app deler med Apple Helse eller Health Connect kan leses av FitMesh, begrenset til beregningene som faktisk er tilgjengelige og tillatelsene som er gitt.",
  fi: "Valmistajan sovelluksen Apple Terveys- tai Health Connect -palveluun jakamat tiedot voidaan lukea FitMeshissä rajoittuen todellisuudessa saatavilla oleviin mittareihin ja myönnettyihin lupiin.",
};

export function getExcludedBannerNotice(provider: Provider, lc: Locale): {
  directUnavailable: string;
  hubBridgeClause?: string;
} {
  const brand = provider.name;
  const directUnavailable = DIRECT_UNAVAILABLE_MAP[lc]?.(brand) ?? DIRECT_UNAVAILABLE_MAP.en(brand);
  const hubBridgeClause = hasDocumentedHubBridge(provider.slug)
    ? (INDIRECT_HUB_CLAUSE_MAP[lc] ?? INDIRECT_HUB_CLAUSE_MAP.en)
    : undefined;

  return { directUnavailable, hubBridgeClause };
}
