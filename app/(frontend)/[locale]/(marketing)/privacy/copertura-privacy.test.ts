// La privacy policy deve nominare cio' che l'app raccoglie davvero.
//
// PERCHE' QUESTO FILE
// -------------------
// Il 01/09/2026 l'inventario di `FASE-6-PRIVACY-IOS.md` ha mostrato che l'app
// raccoglie dieci categorie di dati, otto delle quali collegate all'identita'.
// La policy pubblicata ne nominava una parte: mancavano gli identificatori, la
// cronologia acquisti, i contenuti scritti dall'utente, Firebase Installations
// e OpenStreetMap.
//
// Una policy incompleta non e' un problema di forma: e' la dichiarazione che
// l'utente legge, e deve corrispondere al comportamento. Questo test tiene le
// due cose agganciate, e in TUTTE e sei le lingue — perche' una policy vera in
// italiano e incompleta in tedesco e' incompleta per chi legge in tedesco.
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const SORGENTE = readFileSync(
  join(process.cwd(), "app/(frontend)/[locale]/(marketing)/privacy/page.tsx"),
  "utf8",
);

/** Le sei funzioni per lingua, ognuna col proprio corpo isolato. */
function corpiPerLingua(): Record<string, string> {
  const lingue = ["IT", "EN", "ES", "DE", "PT", "FR"];
  const out: Record<string, string> = {};
  for (let i = 0; i < lingue.length; i++) {
    const inizio = SORGENTE.indexOf(`function Privacy${lingue[i]}()`);
    expect(inizio, `manca function Privacy${lingue[i]}`).toBeGreaterThan(-1);
    const succ = lingue[i + 1]
      ? SORGENTE.indexOf(`function Privacy${lingue[i + 1]}()`)
      : SORGENTE.length;
    out[lingue[i]] = SORGENTE.slice(inizio, succ);
  }
  return out;
}

const CORPI = corpiPerLingua();

/**
 * Cio' che deve comparire in OGNI lingua. Sono ancore stabili — nomi propri e
 * termini tecnici che non si traducono — non frasi, che cambiando traduzione
 * renderebbero il test fragile senza renderlo piu' vero.
 */
const ANCORE_OBBLIGATORIE: ReadonlyArray<readonly [string, string]> = [
  ["Firebase Crashlytics", "diagnostica crash"],
  ["Firebase Cloud Messaging", "notifiche push"],
  ["Firebase Installations", "identificativo tecnico dell'installazione"],
  ["Google Sign-In", "autenticazione opzionale"],
  ["OpenStreetMap Foundation", "destinatario dei riquadri della mappa"],
  ["Supabase", "backend e autenticazione"],
];

describe("la privacy policy nomina cio' che l'app raccoglie", () => {
  for (const [lingua, corpo] of Object.entries(CORPI)) {
    describe(lingua, () => {
      it.each(ANCORE_OBBLIGATORIE)(
        "nomina %s (%s)",
        (ancora) => {
          expect(corpo).toContain(ancora);
        },
      );

      it("dichiara che salute e attivita' sono collegate all'account", () => {
        // L'affermazione centrale: `fitness_metrics.user_id` e' una uuid verso
        // l'account, quindi ogni misura e' collegata a una persona. Il
        // manifesto iOS lo dichiara con Linked=true; la policy deve dirlo a
        // parole. L'ancora e' l'identificativo utente, che non si traduce via.
        expect(corpo).toMatch(
          /identificativo utente|user identifier|identificador de usuario|Nutzerkennung|identificador de utilizador|identifiant utilisateur/,
        );
      });

      it("nomina il percorso registrato e dice che non viene caricato sui server FitMesh ne' inviato a OpenStreetMap", () => {
        // La distinzione che conta: le tile escono, il percorso no verso
        // NESSUNO dei due destinatari (backend FitMesh, OpenStreetMap).
        expect(corpo).toMatch(/non carica questa traccia GPS sui propri server|does not upload this GPS track to its own servers|no carga esta traza GPS en sus propios servidores|lädt diese GPS-Aufzeichnung nicht auf eigene Server hoch|não carrega este percurso GPS nos seus próprios servidores|ne charge pas ce tracé GPS sur ses propres serveurs/);
      });

      it("dichiara l'eccezione reale: il DB locale iOS puo' finire nei backup di sistema Apple", () => {
        // P1.9-10 (02/09/2026): "resta sul dispositivo" era troppo assoluto -
        // fitmesh_cache.sqlite non ha isExcludedFromBackup su iOS, quindi puo'
        // uscire dal dispositivo tramite backup iCloud/Finder gestito da Apple
        // (non un upload al backend FitMesh: e' un canale diverso, e va detto).
        expect(corpo).toMatch(/backup iCloud|iCloud backups|copias de seguridad de iCloud|iCloud-Backups|cópias de segurança do iCloud|sauvegardes iCloud/);
      });

      it("nomina gli identificatori, gli acquisti e i contenuti scritti", () => {
        expect(corpo).toMatch(
          /token di notifica push|push notification token|token de notificaciones push|Push-Benachrichtigungstoken|token de notificações push|jeton de notification push/,
        );
        expect(corpo).toMatch(
          /cronologia degli acquisti|purchase history|historial de compras|In-App-Käufe|histórico de compras|historique des achats/,
        );
        expect(corpo).toMatch(
          /note degli allenamenti|workout title and notes|notas de los entrenamientos|Notizen zu Trainings|notas dos treinos|notes des séances/,
        );
      });
    });
  }

  it("nessuna lingua e' rimasta indietro: sei corpi, tutti non vuoti", () => {
    expect(Object.keys(CORPI)).toHaveLength(6);
    for (const [lingua, corpo] of Object.entries(CORPI)) {
      expect(corpo.length, `${lingua} troppo corto`).toBeGreaterThan(4000);
    }
  });
});
