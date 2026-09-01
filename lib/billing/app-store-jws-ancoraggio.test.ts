// M17 — L'ANCORAGGIO DELLA CATENA, PROVATO INVECE CHE DICHIARATO
//
// Il finding: nessun test dimostrava che i byte dei root Apple arrivassero
// dentro `SignedDataVerifier` e vi FACESSERO qualcosa. `app-store-jws.test.ts`
// verifica l'ELENCO dei root — nomi, ordine, impronte, scadenze — e il suo
// unico caso negativo usa `x5c: []`, che inciampa nel controllo di lunghezza
// della catena molto prima dell'ancoraggio.
//
// Su un percorso che concede un diritto a vita, e' la differenza fra una firma
// verificata e una creduta.
//
// LA CATENA E' VERA. Radice autofirmata, intermedio firmato dalla radice,
// foglia firmata dall'intermedio: EC P-256, firme reali, generate una volta
// con openssl e congelate qui sotto. Portano anche le due estensioni che la
// libreria pretende — `1.2.840.113635.100.6.11.1` sulla foglia e
// `1.2.840.113635.100.6.2.1` sull'intermedio — perche' senza quelle la catena
// verrebbe respinta per la forma dei certificati e l'ancoraggio non sarebbe
// piu' l'unica variabile. Il primo tentativo non le aveva, e infatti provava
// meno di quanto sembrasse.
//
// COSA MISURA, esattamente. Dentro `verifyCertificateChainWithoutCaching` la
// libreria cerca fra i root di cui dispone uno che abbia firmato l'intermedio;
// se non lo trova, `validity` resta falsa e lancia VERIFICATION_FAILURE. Se lo
// trova, prosegue con firme, issuer/subject, flag CA, le due estensioni, le
// date, e infine OCSP.
//
// Quindi, cambiando SOLO il trust store:
//
//   radici Apple      -> VERIFICATION_FAILURE   l'ancoraggio ha respinto
//   propria radice    -> INVALID_CERTIFICATE    la catena e' passata per
//                                               intero, e il guasto si e'
//                                               spostato all'OCSP (la foglia
//                                               sintetica non ha un URI OCSP)
//
// Il guasto SI SPOSTA. E' questo che prova che i root sono portanti: un test
// che vedesse lo stesso rifiuto in entrambi i casi non distinguerebbe «non
// ancorata» da «catena rotta», e resterebbe verde anche passando un elenco di
// root vuoto.
import { Buffer } from "node:buffer";
import { readFileSync } from "node:fs";
import { X509Certificate } from "node:crypto";
import {
  Environment,
  VerificationException,
  VerificationStatus,
} from "@apple/app-store-server-library";
import { describe, expect, it } from "vitest";
import {
  APPLE_BUNDLE_ID,
  verificatoreConRadici,
  verifyAppleJwsTransaction,
} from "./app-store-jws";
import { APPLE_ROOT_CERTIFICATES } from "./apple-root-ca";

const ROOT_B64 =
  "MIIBzjCCAXOgAwIBAgIUMnT+ZjdlciahSbDr5p2ckb6YPKswCgYIKoZIzj0EAwIwPDEjMCEGA1UE" +
  "AwwaUmFkaWNlIFNpbnRldGljYSBOb24gQXBwbGUxFTATBgNVBAoMDEZpdE1lc2ggVGVzdDAeFw0y" +
  "NjA4MzExODExMDdaFw0zNjA4MjgxODExMDdaMDwxIzAhBgNVBAMMGlJhZGljZSBTaW50ZXRpY2Eg" +
  "Tm9uIEFwcGxlMRUwEwYDVQQKDAxGaXRNZXNoIFRlc3QwWTATBgcqhkjOPQIBBggqhkjOPQMBBwNC" +
  "AAR3SQWNnoN/saZzCSgrutYxRdEZO9I01bvCDwqj1dScjDzJIlYIvve76zXfQnOTRMVbgkCe8JU3" +
  "k3KRq+JoYkAWo1MwUTAdBgNVHQ4EFgQU9yyz9dt3rkRqjU2TDCDc4/AQ4qswHwYDVR0jBBgwFoAU" +
  "9yyz9dt3rkRqjU2TDCDc4/AQ4qswDwYDVR0TAQH/BAUwAwEB/zAKBggqhkjOPQQDAgNJADBGAiEA" +
  "8SYLOeWvyoTPp0Vhtp5EYe1k3IwzauuBqW+Bd/nSPXkCIQDl8TsKMavImFCzKj+9BD7PdBUJwMmE" +
  "EwvMkn5N9zCVSA==";

const INTER_B64 =
  "MIIB7DCCAZKgAwIBAgIUalrJShBsgyvoeW45w/kRHMHG2M8wCgYIKoZIzj0EAwIwPDEjMCEGA1UE" +
  "AwwaUmFkaWNlIFNpbnRldGljYSBOb24gQXBwbGUxFTATBgNVBAoMDEZpdE1lc2ggVGVzdDAeFw0y" +
  "NjA4MzExODExMDdaFw0zNjA4MjgxODExMDdaMDYxHTAbBgNVBAMMFEludGVybWVkaW8gU2ludGV0" +
  "aWNvMRUwEwYDVQQKDAxGaXRNZXNoIFRlc3QwWTATBgcqhkjOPQIBBggqhkjOPQMBBwNCAAQge0mO" +
  "qfmBebR7bKA9RqLP3YhiIWRRtmWNM2hdUm7Q6T5oPhM8kBKXSb8Lei79T+4+OXBgV0zop0Zig1FA" +
  "MEouo3gwdjASBgNVHRMBAf8ECDAGAQH/AgEAMA4GA1UdDwEB/wQEAwIBBjAQBgoqhkiG92NkBgIB" +
  "BAIFADAdBgNVHQ4EFgQUUvQfR5KJ49nR1DNYRpnzRG84wZIwHwYDVR0jBBgwFoAU9yyz9dt3rkRq" +
  "jU2TDCDc4/AQ4qswCgYIKoZIzj0EAwIDSAAwRQIgLzk6JDZiu8wwKQ7NIgbXTTWbiI82K5jqErsq" +
  "VlyEyTcCIQC7mmNBah6aC9zoQtBUWpx6XecgYCwklv9Hqw2dyfNOuA==";

const LEAF_B64 =
  "MIIB3DCCAYKgAwIBAgIUTKq/Rh8/r5Nq6An6XaaYEdt/KvcwCgYIKoZIzj0EAwIwNjEdMBsGA1UE" +
  "AwwUSW50ZXJtZWRpbyBTaW50ZXRpY28xFTATBgNVBAoMDEZpdE1lc2ggVGVzdDAeFw0yNjA4MzEx" +
  "ODExMDdaFw0zNjA4MjgxODExMDdaMDIxGTAXBgNVBAMMEEZvZ2xpYSBTaW50ZXRpY2ExFTATBgNV" +
  "BAoMDEZpdE1lc2ggVGVzdDBZMBMGByqGSM49AgEGCCqGSM49AwEHA0IABJ4Uo817+sNcmbtD7zAx" +
  "HMb3KmnwObg5kquQ0iZbEh/8xQtuk/5tkcnUGeWXhNSQvrzGB3SL/xygRFg8tmGf3AOjcjBwMAwG" +
  "A1UdEwEB/wQCMAAwDgYDVR0PAQH/BAQDAgeAMBAGCiqGSIb3Y2QGCwEEAgUAMB0GA1UdDgQWBBQd" +
  "fiyAw60To6xh/rVoldnXoxwAFTAfBgNVHSMEGDAWgBRS9B9Hkonj2dHUM1hGmfNEbzjBkjAKBggq" +
  "hkjOPQQDAgNIADBFAiEAzbKkKZa6vihqN3uw2bgMZLk2N2dEA2qZwsMiIrzyMoICIDD66KgA1CQa" +
  "NFCGNO8LD5l4YlXB1Dvu89cZYEYLf9Lh";

const der = (b64: string) => Buffer.from(b64, "base64");

/**
 * Un JWS con la catena sintetica in `x5c`, e una firma che NON e' valida.
 *
 * E non e' una scorciatoia: e' l'ordine in cui lavora la libreria. Dentro
 * `verifyAndDecodeTransaction` la catena viene verificata — e l'OCSP
 * interrogato — PRIMA che la firma venga controllata, perche' la chiave
 * pubblica con cui controllarla e' proprio il risultato della verifica della
 * catena. Ogni caso di questo file si ferma prima di arrivare alla firma.
 *
 * Il primo tentativo firmava davvero, con la chiave della foglia incorporata
 * qui. Il gancio pre-commit l'ha bloccato — una chiave privata nel
 * repository — e aveva ragione: non serviva.
 *
 * **Questo file non prova nulla sulla verifica della firma.** Quella e'
 * coperta da `app-store-jws.test.ts` e, sul JWS Apple autentico, dall'unico
 * salto autorizzato della suite (`FITMESH_SANDBOX_JWS`).
 */
function jwsSintetico(): string {
  const b64u = (o: unknown) =>
    Buffer.from(JSON.stringify(o)).toString("base64url");
  const header = b64u({
    alg: "ES256",
    // Ordine reale di una catena Apple: foglia, intermedio, radice.
    x5c: [LEAF_B64, INTER_B64, ROOT_B64],
  });
  const payload = b64u({
    transactionId: "0000000000000001",
    originalTransactionId: "0000000000000001",
    bundleId: APPLE_BUNDLE_ID,
    productId: "fitmesh_pro_lifetime",
    type: "Non-Consumable",
    environment: "Production",
    purchaseDate: 1_756_000_000_000,
    signedDate: 1_756_000_000_000,
  });
  const firmaNonValida = Buffer.alloc(64).toString("base64url");
  return `${header}.${payload}.${firmaNonValida}`;
}

async function statoDelRifiuto(radici: Buffer[]): Promise<VerificationStatus> {
  const errore = await verificatoreConRadici(radici, Environment.PRODUCTION)
    .verifyAndDecodeTransaction(jwsSintetico())
    .then(() => null)
    .catch((e: unknown) => e);
  expect(errore).toBeInstanceOf(VerificationException);
  return (errore as VerificationException).status;
}

describe("M17 — la catena x5c e ancorata ESCLUSIVAMENTE ai root Apple", () => {
  it("la catena sintetica e ben formata: tre certificati e le estensioni Apple",
    async () => {
      const header = JSON.parse(
        Buffer.from(
          (jwsSintetico()).split(".")[0]!,
          "base64url",
        ).toString("utf8"),
      );
      // Il vecchio caso negativo si fermava qui, con `x5c: []`. Questo no: la
      // catena ha la forma giusta e il rifiuto dovra' arrivare dall'ancoraggio.
      expect(header.x5c).toHaveLength(3);
      expect(header.alg).toBe("ES256");

      // E i certificati si verificano davvero l'uno con l'altro, altrimenti il
      // caso B qui sotto passerebbe per la ragione sbagliata.
      const root = new X509Certificate(der(ROOT_B64));
      const inter = new X509Certificate(der(INTER_B64));
      const leaf = new X509Certificate(der(LEAF_B64));
      expect(inter.verify(root.publicKey)).toBe(true);
      expect(leaf.verify(inter.publicKey)).toBe(true);
      expect(inter.issuer).toBe(root.subject);
      expect(leaf.issuer).toBe(inter.subject);
    });

  it("A. ancorata ai root APPLE: respinta dall ancoraggio", async () => {
    expect(await statoDelRifiuto(APPLE_ROOT_CERTIFICATES)).toBe(
      VerificationStatus.VERIFICATION_FAILURE,
    );
  });

  it("B. ancorata alla PROPRIA radice: l ancoraggio la accetta e il guasto si sposta",
    async () => {
      const stato = await statoDelRifiuto([der(ROOT_B64)]);
      // Non e' piu' il rifiuto dell'ancoraggio: la catena e' passata per
      // intero e si e' fermata dopo, sull'OCSP.
      expect(stato).not.toBe(VerificationStatus.VERIFICATION_FAILURE);
      expect(stato).toBe(VerificationStatus.INVALID_CERTIFICATE);
    });

  it("A e B devono DIFFERIRE: e la sola cosa che prova che i root contano",
    async () => {
      const conApple = await statoDelRifiuto(APPLE_ROOT_CERTIFICATES);
      const conPropria = await statoDelRifiuto([der(ROOT_B64)]);
      expect(conApple).not.toBe(conPropria);
    });

  it("un elenco di root VUOTO respinge, e respinge come l ancoraggio",
    async () => {
      // La mutazione piu' facile da fare per sbaglio: passare `[]` invece dei
      // root. Deve comportarsi come «nessun root garantisce questa catena»,
      // non accettare.
      expect(await statoDelRifiuto([])).toBe(
        VerificationStatus.VERIFICATION_FAILURE,
      );
    });

  it("nemmeno la porta d ingresso pubblica accetta una catena non Apple",
    async () => {
      // Lo stesso caso A, ma dalla funzione che usa davvero la route.
      const esito = await verifyAppleJwsTransaction({
        signedTransaction: jwsSintetico(),
        expectedProductId: "fitmesh_pro_lifetime",
      });
      expect(esito.kind).toBe("rejected");
    });

  it("il verificatore di produzione riceve ESATTAMENTE i root Apple", () => {
    // Prova di cablaggio, complementare a quella comportamentale: che i byte
    // dichiarati siano quelli che il verificatore tiene. La libreria li
    // converte in X509Certificate, quindi il confronto e' su `.raw`.
    const v = verificatoreConRadici(
      APPLE_ROOT_CERTIFICATES,
      Environment.PRODUCTION,
    ) as unknown as { rootCertificates: X509Certificate[]; enableOnlineChecks: boolean };

    expect(v.rootCertificates).toHaveLength(APPLE_ROOT_CERTIFICATES.length);
    for (const [i, atteso] of APPLE_ROOT_CERTIFICATES.entries()) {
      expect(Buffer.compare(v.rootCertificates[i]!.raw, atteso)).toBe(0);
    }
    // Spegnere i controlli online e' l'altra mutazione silenziosa: la catena
    // resterebbe valida anche con un certificato revocato.
    expect(v.enableOnlineChecks).toBe(true);
  });

  it("nessun JWS finisce mai sul percorso verifyReceipt", () => {
    // Il difetto del 28/08 in una riga: la 189 mandava il JWS a
    // `verifyReceipt`, che rispondeva 21002.
    //
    // Il controllo guarda il CODICE, non il testo: `verifyReceipt` compare due
    // volte nei commenti di questo modulo, che spiegano proprio perche' non lo
    // si usa. Un test che cercasse la parola sarebbe rosso su un commento e
    // verde su una chiamata dentro una stringa.
    const sorgente = readFileSync(
      new URL("./app-store-jws.ts", import.meta.url),
      "utf8",
    );
    const senzaCommenti = sorgente
      .replace(/\/\*[\s\S]*?\*\//g, "")
      .replace(/^\s*\/\/.*$/gm, "");

    expect(senzaCommenti).not.toContain("verifyReceipt");
    expect(senzaCommenti).not.toContain("buy.itunes.apple.com");
    expect(senzaCommenti).not.toContain("sandbox.itunes.apple.com");
    // Controllo positivo del filtro: se togliesse troppo, questo sparirebbe.
    expect(senzaCommenti).toContain("verifyAppleJwsTransaction");
  });
});
