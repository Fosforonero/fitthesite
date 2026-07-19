import { describe, expect, it } from "vitest";

import { derivePlatform, resolveFounderGrantStatus } from "./founder-grant";

describe("derivePlatform — P0.4, platform e' telemetria opzionale", () => {
  it("riconosce 'iOS 17.5' (formato client Flutter)", () => {
    expect(derivePlatform("iOS 17.5")).toBe("ios");
  });

  it("riconosce 'Android 14' (formato client Flutter)", () => {
    expect(derivePlatform("Android 14")).toBe("android");
  });

  it("e' case-insensitive", () => {
    expect(derivePlatform("ANDROID 14")).toBe("android");
  });

  it("payload senza osVersion -> null, mai un errore", () => {
    expect(derivePlatform(undefined)).toBeNull();
    expect(derivePlatform(null)).toBeNull();
  });

  it("osVersion non riconosciuto -> null, mai un errore", () => {
    expect(derivePlatform("HarmonyOS 4.0")).toBeNull();
    expect(derivePlatform("")).toBeNull();
  });
});

describe("resolveFounderGrantStatus — contratto v4 (transitionAccepted esplicito)", () => {
  it("transitionAccepted=true + grantCreated=true -> granted", () => {
    expect(
      resolveFounderGrantStatus(
        { transitionAccepted: true, grantCreated: true },
        false,
      ),
    ).toBe("granted");
  });

  it("transitionAccepted=true + alreadyHadEligibleGrant=true -> already_granted", () => {
    expect(
      resolveFounderGrantStatus(
        { transitionAccepted: true, alreadyHadEligibleGrant: true },
        false,
      ),
    ).toBe("already_granted");
  });

  it("transitionAccepted=true + capReached=true -> cap_reached", () => {
    expect(
      resolveFounderGrantStatus(
        { transitionAccepted: true, capReached: true },
        false,
      ),
    ).toBe("cap_reached");
  });

  it("transitionAccepted=true + notEligibleReason=excluded_account -> ineligible (non retry-worthy)", () => {
    expect(
      resolveFounderGrantStatus(
        { transitionAccepted: true, notEligibleReason: "excluded_account" },
        false,
      ),
    ).toBe("ineligible");
  });

  it(
    "transitionAccepted=false + notEligibleReason=no_metrics_evidence -> retry_needed " +
      "(P0.3: puo' risolversi da solo)",
    () => {
      expect(
        resolveFounderGrantStatus(
          {
            transitionAccepted: false,
            notEligibleReason: "no_metrics_evidence",
          },
          false,
        ),
      ).toBe("retry_needed");
    },
  );

  it(
    "transitionAccepted=false, device inesistente/cross-user/revocato " +
      "(nessun notEligibleReason) -> retry_needed, mai ineligible",
    () => {
      expect(
        resolveFounderGrantStatus(
          { transitionAccepted: false, effectiveState: null },
          false,
        ),
      ).toBe("retry_needed");
    },
  );

  it(
    "l'assenza di notEligibleReason da sola non implica accettazione: " +
      "senza transitionAccepted=true esplicito resta retry_needed",
    () => {
      expect(resolveFounderGrantStatus({}, false)).toBe("retry_needed");
    },
  );

  it("errore RPC -> retry_needed, mai un blocco del sync", () => {
    expect(resolveFounderGrantStatus(null, true)).toBe("retry_needed");
  });

  it("nessun risultato e nessun errore dichiarato -> retry_needed (fail safe)", () => {
    expect(resolveFounderGrantStatus(undefined, false)).toBe("retry_needed");
  });

  it(
    "transitionAccepted=true ma effectiveState non e' 'success' (es. block_permission) -> ineligible",
    () => {
      expect(
        resolveFounderGrantStatus(
          { transitionAccepted: true, effectiveState: "block_permission" },
          false,
        ),
      ).toBe("ineligible");
    },
  );
});
