/**
 * I casi qui sotto riproducono le FORME trovate in produzione il 16/08/2026,
 * con nomi di persona inventati.
 *
 * E' una scelta deliberata e non una scorciatoia: questo file esiste per
 * togliere nomi di persona dal database, e committare i nomi veri in un test
 * li sposterebbe da una colonna del database alla cronologia di un repository,
 * cioe' in un posto da cui non si tolgono piu'. Le forme sono fedeli; i nomi
 * no, e non devono esserlo.
 */
import { describe, expect, it } from "vitest";

import { sanitizeSourceDevice } from "./source-device";

describe("il nome del dispositivo perde il proprietario", () => {
  it("toglie il possessivo inglese e tiene il dispositivo", () => {
    expect(sanitizeSourceDevice("Marta's AW Ultra 2")).toBe("AW Ultra 2");
    expect(sanitizeSourceDevice("Giulio's Apple Watch")).toBe("Apple Watch");
  });

  it("riconosce anche l'apostrofo tipografico", () => {
    // In produzione arrivano quasi tutti con U+2019, non con l'apostrofo
    // dritto: una regex che guardasse solo ' non toglierebbe quasi nulla.
    expect(sanitizeSourceDevice("Marta’s Apple Watch")).toBe("Apple Watch");
    expect(sanitizeSourceDevice("tuttominuscolo’s iPhone")).toBe("iPhone");
  });

  it("toglie il possessivo posposto (von / de / di / van)", () => {
    expect(sanitizeSourceDevice("Apple Watch von Stefan")).toBe("Apple Watch");
    expect(sanitizeSourceDevice("Apple Watch Ultra de Nicola")).toBe(
      "Apple Watch Ultra",
    );
    expect(sanitizeSourceDevice("Orologio di Chiara")).toBe("Orologio");
  });

  it("toglie il nome seguito dal trattino", () => {
    expect(sanitizeSourceDevice("Jakob - iPhone 15 Pro")).toBe("iPhone 15 Pro");
    expect(sanitizeSourceDevice("Jakob – iPhone 15 Pro")).toBe("iPhone 15 Pro");
  });

  it("lascia intatte le etichette neutre", () => {
    // 103 nomi distinti su 47.884 righe sono gia' neutri: sono la
    // maggioranza schiacciante e non vanno toccati.
    for (const neutro of [
      "Samsung Health",
      "Fitbit / Pixel Watch",
      "Mi Watch / Xiaomi",
      "Google Fit",
      "Withings",
      "Polar Flow",
      "Amazfit / Zepp",
      "Smart Ring",
      "R09_9D07",
      "com.app.cq.ring",
    ]) {
      expect(sanitizeSourceDevice(neutro)).toBe(neutro);
    }
  });

  it("non spezza un nome che contiene 'de' seguito da minuscola", () => {
    // Il vincolo della maiuscola dopo la preposizione esiste per questo: senza,
    // qui si perderebbe l'ultima parola del dispositivo.
    expect(sanitizeSourceDevice("Reloj de pulsera")).toBe("Reloj de pulsera");
  });

  it("restituisce null quando resta solo il proprietario", () => {
    // Meglio "dispositivo non dichiarato" che il nome di una persona.
    expect(sanitizeSourceDevice("Marta's")).toBeNull();
    expect(sanitizeSourceDevice("   ")).toBeNull();
    expect(sanitizeSourceDevice("")).toBeNull();
  });

  it("non lancia mai: un nome storto non deve far fallire un sync", () => {
    expect(sanitizeSourceDevice(null)).toBeNull();
    expect(sanitizeSourceDevice(undefined)).toBeNull();
    expect(sanitizeSourceDevice(12345 as unknown as string)).toBeNull();
  });

  it("dichiara cio' che NON copre", () => {
    // Un nome proprio senza possessivo ne' separatore resta: riconoscerlo
    // richiederebbe una lista di nomi, e un falso positivo distruggerebbe il
    // nome del dispositivo, che e' il dato utile. Questo test esiste per
    // impedire che qualcuno "migliori" la regex fino a rompere i nomi veri.
    expect(sanitizeSourceDevice("DIGS Apple Watch Ultra 3")).toBe(
      "DIGS Apple Watch Ultra 3",
    );
  });
});
