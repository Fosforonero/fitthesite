/**
 * La verifica delle consegne push, esercitata con firme VERE.
 *
 * Non si mocka `jwtVerify`: si genera una coppia di chiavi, si firmano token
 * autentici e si sostituisce soltanto il punto in cui `jose` andrebbe a
 * prendere le chiavi di Google. Cosi' una firma manomessa fallisce davvero,
 * invece di fallire perche' glielo abbiamo detto noi.
 */
import {
  SignJWT,
  createLocalJWKSet,
  exportJWK,
  generateKeyPair,
  type JSONWebKeySet,
} from "jose";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";

const ISSUER = "https://accounts.google.com";
const AUDIENCE = "https://www.fitmesh.fit/api/v1/billing/notifications/google";
const SERVICE_ACCOUNT = "rtdn@fitmesh.iam.gserviceaccount.com";

// `generateKeyPair` restituisce `KeyLike`, non `CryptoKey`: il tipo cambia con
// il runtime, e fissarlo a mano lo faceva divergere dalla libreria.
let privateKey: Awaited<ReturnType<typeof generateKeyPair>>["privateKey"];
let jwks: JSONWebKeySet;

vi.mock("jose", async (originale) => {
  const vero = await originale<typeof import("jose")>();
  return {
    ...vero,
    // L'unica cosa sostituita: da dove arrivano le chiavi pubbliche.
    createRemoteJWKSet: () => createLocalJWKSet(jwks),
  };
});

async function token(
  claims: Record<string, unknown> = {},
  chiave: typeof privateKey = privateKey,
) {
  return new SignJWT({
    email: SERVICE_ACCOUNT,
    email_verified: true,
    ...claims,
  })
    .setProtectedHeader({ alg: "RS256", kid: "prova" })
    .setIssuer(ISSUER)
    .setAudience(AUDIENCE)
    .setIssuedAt()
    .setExpirationTime("5m")
    .sign(chiave);
}

function richiesta(bearer?: string): Request {
  return new Request(AUDIENCE, {
    method: "POST",
    headers: bearer ? { authorization: `Bearer ${bearer}` } : {},
  });
}

beforeAll(async () => {
  const coppia = await generateKeyPair("RS256", { extractable: true });
  privateKey = coppia.privateKey;
  const pubblica = await exportJWK(coppia.publicKey);
  jwks = { keys: [{ ...pubblica, kid: "prova", alg: "RS256", use: "sig" }] };
});

afterEach(() => {
  delete process.env.PUBSUB_PUSH_AUDIENCE;
  delete process.env.PUBSUB_PUSH_SERVICE_ACCOUNT;
});

function configura() {
  process.env.PUBSUB_PUSH_AUDIENCE = AUDIENCE;
  process.env.PUBSUB_PUSH_SERVICE_ACCOUNT = SERVICE_ACCOUNT;
}

describe("verifica della consegna push", () => {
  it("CONTROLLO POSITIVO: una consegna autentica passa", async () => {
    configura();
    const { verificaPushPubSub } = await import("./pubsub-push");
    const esito = await verificaPushPubSub(richiesta(await token()));
    expect(esito.kind).toBe("ok");
  });

  it("firma manomessa: rifiutata", async () => {
    configura();
    const { verificaPushPubSub } = await import("./pubsub-push");
    const buono = await token();
    // Si cambia un carattere della sola firma: header e payload restano
    // leggibili e plausibili, ed e' proprio il caso che una verifica pigra
    // lascerebbe passare.
    const parti = buono.split(".");
    parti[2] = parti[2]!.slice(0, -2) + (parti[2]!.endsWith("A") ? "BB" : "AA");
    const esito = await verificaPushPubSub(richiesta(parti.join(".")));
    expect(esito.kind).toBe("rejected");
  });

  it("audience diversa: rifiutata anche se la firma e' buona", async () => {
    configura();
    const { verificaPushPubSub } = await import("./pubsub-push");
    const altro = await new SignJWT({ email: SERVICE_ACCOUNT, email_verified: true })
      .setProtectedHeader({ alg: "RS256", kid: "prova" })
      .setIssuer(ISSUER)
      .setAudience("https://qualcun-altro.example/endpoint")
      .setIssuedAt()
      .setExpirationTime("5m")
      .sign(privateKey);
    const esito = await verificaPushPubSub(richiesta(altro));
    expect(esito.kind).toBe("rejected");
  });

  it("service account diverso: rifiutata", async () => {
    configura();
    const { verificaPushPubSub } = await import("./pubsub-push");
    const esito = await verificaPushPubSub(
      richiesta(await token({ email: "chiunque@example.com" })),
    );
    expect(esito).toMatchObject({
      kind: "rejected",
      reason: "service_account_non_autorizzato",
    });
  });

  it("email non verificata: rifiutata", async () => {
    configura();
    const { verificaPushPubSub } = await import("./pubsub-push");
    const esito = await verificaPushPubSub(
      richiesta(await token({ email_verified: false })),
    );
    expect(esito).toMatchObject({ kind: "rejected", reason: "email_non_verificata" });
  });

  it("token assente: rifiutata", async () => {
    configura();
    const { verificaPushPubSub } = await import("./pubsub-push");
    expect((await verificaPushPubSub(richiesta())).kind).toBe("rejected");
  });

  it("ambiente non configurato: NON accetta, e non e' un rifiuto del mittente", async () => {
    // Fallisce chiuso. Se questo diventasse "ok", chiunque potrebbe revocare
    // il diritto a chiunque semplicemente perche' non abbiamo finito di
    // configurare.
    const { verificaPushPubSub } = await import("./pubsub-push");
    const esito = await verificaPushPubSub(richiesta(await token()));
    expect(esito).toMatchObject({ kind: "retryable", reason: "pubsub_push_non_configurato" });
  });
});

describe("lettura del messaggio", () => {
  it("decodifica base64 e JSON", async () => {
    const { leggiMessaggioPubSub } = await import("./pubsub-push");
    const dati = { version: "1.0", eventTimeMillis: "1756000000000" };
    const m = leggiMessaggioPubSub({
      message: {
        messageId: "12345",
        data: Buffer.from(JSON.stringify(dati)).toString("base64"),
      },
    });
    expect(m?.messageId).toBe("12345");
    expect(m?.dati.version).toBe("1.0");
  });

  it("senza messageId non si legge: senza idempotenza una riconsegna e' un secondo effetto", async () => {
    const { leggiMessaggioPubSub } = await import("./pubsub-push");
    expect(
      leggiMessaggioPubSub({
        message: { data: Buffer.from("{}").toString("base64") },
      }),
    ).toBeNull();
  });

  it("base64 che non contiene JSON: null, non un'eccezione", async () => {
    const { leggiMessaggioPubSub } = await import("./pubsub-push");
    expect(
      leggiMessaggioPubSub({
        message: { messageId: "1", data: Buffer.from("non json").toString("base64") },
      }),
    ).toBeNull();
  });
});
