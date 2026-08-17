import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Cessione in favore dell'utente su iOS.
 *
 * PERCHE' ESISTE. `validate-purchase/route.ts` ha il ramo iOS e scrive
 * `billing_source: 'apple_iap'`, ma in produzione `b2c_subscriptions` ha 24
 * righe e zero sono `apple_iap`: il percorso esiste e non e' mai riuscito. Un
 * cliente ha pagato su App Store il 05/08/2026 e non ha ricevuto Pro, e non
 * ce l'ha nemmeno localmente, perche' il client concede solo dopo che il
 * server ha validato. Su Android il percorso Play funziona (sei righe
 * `google_play`, l'ultima del 14/08): la situazione non e' simmetrica e non va
 * trattata come simmetrica.
 *
 * Decisione di Matteo, 17/08/2026: meglio concedere Pro a qualche utente iOS
 * con la prova scaduta che toglierlo a chi ha pagato Apple.
 *
 * PERCHE' QUI E NON NEL CLIENT. Far dichiarare la piattaforma al client
 * significherebbe fidarsi di un'affermazione falsificabile: un utente Android
 * che dichiara iOS otterrebbe Pro gratis. La funzione Postgres verifica la
 * piattaforma dai dati (`fitness_metrics.source = 'healthkit'`), quindi il
 * client non ha niente da aggiungere e la cessione non dipende dal rilascio
 * di una nuova build.
 *
 * COSA SCRIVE. Una riga in `user_roles` con `role='pro'`, `expires_at` a sei
 * mesi e `note='cessione-ios-in-attesa-apple-iap'`. La scadenza e' la
 * condizione di uscita scritta nel dato invece che in un promemoria; la nota
 * serve anche perche' `grant_founder_launch_core` corto-circuita su un
 * `role='pro'` nudo e renderebbe l'utente non piu' eleggibile a un futuro
 * grant founder. `granted_at` da' l'istante: la riga E' il registro, ed e'
 * l'unico modo di incrociare con App Store Connect per gli utenti che usano
 * Nascondi la mia email, dove l'incrocio per indirizzo non puo' funzionare.
 *
 * QUANDO SI TOGLIE. Quando esiste un percorso che scrive `apple_iap`. Da quel
 * momento le righe con questa nota vanno migrate in
 * `private.billing_pagamenti_segnalati` e revocate.
 */
export async function concediPonteIos(userId: string): Promise<boolean> {
  try {
    const admin = createAdminClient() as unknown as {
      rpc: (
        fn: string,
        args: Record<string, unknown>,
      ) => Promise<{ data: unknown; error: { code?: string } | null }>;
    };
    const { data, error } = await admin.rpc("concedi_ponte_ios", {
      p_user_id: userId,
    });
    if (error) {
      // Mai il messaggio grezzo nei log: puo' contenere frammenti di riga.
      console.error("[sync] cessione_ios_failed", { code: error.code });
      return false;
    }
    // La funzione ritorna true SOLO quando ha davvero creato la riga: chi
    // aveva gia' diritto, chi non e' iOS e chi ha gia' un ponte ricevono
    // false e restano bloccati come prima.
    if (data === true) {
      console.info("[sync] cessione_ios_concessa");
    }
    return data === true;
  } catch {
    // Un guasto qui non deve trasformarsi in un 500 sul sync: si ricade sul
    // comportamento precedente, cioe' negare l'ingresso.
    console.error("[sync] cessione_ios_threw");
    return false;
  }
}
