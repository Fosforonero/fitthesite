/**
 * CORPUS S6: le frasi del controllo indipendente CONTROLLO-S6 (14/10/2026), VERBATIM, piu' voci proprie per i
 * finding S6-01..S6-10. Dati, non test: li consumano claim-registry.test.ts (verdetto di sistema: guardia di cella +
 * politica del registro) e seo-metadata-batch1.test.ts (guardia di frequenza).
 *
 * Ruoli: CLAIMS = devono essere ROSSE; LEGIT = devono essere VERDI; FREQ: P = frequenza di occorrenza (rosso),
 * K = «common»/«comune» o causa (rosso), N = frase legittima (verde), D = presa di distanza (verde).
 * LIMITI-NOTI: frasi che il sistema classifica nel verso sbagliato; NON sono nel pass/fail, ciascuna con motivo.
 */
export type S6Post = "GA" | "FB" | "GH";
export type S6Row = [id: string, post: S6Post, lang: string, text: string];

// [id, post, lingua, frase] (post GA = Garmin, FB = Fitbit, GH = Google Health)
export const S6_CLAIMS: S6Row[] = [
  ["C01", "GA", "it", "FitMesh si integra ufficialmente con Garmin Connect."],
  ["C02", "GA", "en", "FitMesh offers a direct integration with Garmin Connect."],
  ["C03", "GA", "de", "FitMesh ist offiziell mit Garmin Connect integriert."],
  ["C04", "GA", "es", "FitMesh se conecta directamente a Garmin Connect."],
  ["C05", "GA", "fr", "FitMesh lit directement vos données Garmin."],
  ["C06", "FB", "it", "FitMesh si integra direttamente con Fitbit."],
  ["C07", "FB", "en", "FitMesh connects directly to your Fitbit account."],
  ["C08", "FB", "en", "FitMesh is an official Fitbit partner."],
  ["C09", "GA", "en", "We partnered with Garmin to bring your data into FitMesh."],
  ["C10", "GA", "it", "FitMesh è partner di Garmin."],
  ["C11", "GA", "pt", "A FitMesh tem uma parceria com a Garmin."],
  ["C12", "GA", "en", "Garmin recommends FitMesh for backing up your data."],
  ["C13", "GA", "it", "FitMesh è approvata da Garmin."],
  ["C14", "FB", "en", "Google has certified FitMesh for Fitbit data."],
  ["C15", "GA", "it", "Presto FitMesh importerà le attività Garmin."],
  ["C16", "GA", "en", "Garmin support is coming to FitMesh later this year."],
  ["C17", "FB", "en", "FitMesh will add Fitbit sync in the next release."],
  ["C18", "GA", "de", "Die Garmin-Anbindung kommt bald in FitMesh."],
  ["C19", "FB", "it", "Nella maggior parte dei casi la colpa è dei permessi di Health Connect."],
  ["C20", "FB", "en", "Battery optimization is usually the culprit."],
  ["C21", "FB", "es", "Normalmente el problema son los permisos de Health Connect."],
  ["C22", "FB", "de", "Meistens liegt der Fehler an der Akkuoptimierung."],
  ["C23", "FB", "fr", "Le problème vient souvent des autorisations de Health Connect."],
  ["C24", "FB", "pt", "Na maioria das vezes, a causa é a otimização de bateria."],
  ["C25", "FB", "pl", "Zazwyczaj przyczyną są uprawnienia Health Connect."],
  ["C26", "FB", "tr", "Sorun genellikle pil optimizasyonundan kaynaklanır."],
  ["C27", "FB", "nl", "Meestal ligt het aan de batterijoptimalisatie."],
  ["C28", "FB", "ja", "ほとんどの場合、原因は権限の設定です。"],
  ["C29", "FB", "ko", "대부분 배터리 최적화가 원인입니다."],
  ["C30", "GA", "it", "Spesso il problema è che l'export non è stato completato."],
  ["C31", "GA", "en", "This is a common problem with Garmin exports."],
  ["C32", "GA", "it", "FitMesh legge i tuoi dati Garmin in tempo reale."],
  ["C33", "GA", "en", "FitMesh reads your Garmin activities directly from Garmin Connect."],
  ["C34", "FB", "en", "FitMesh pulls your Fitbit data straight from Fitbit's servers."],
  ["C36", "GA", "it", "Non è raro che la causa sia il cavo USB."],
  ["C37", "FB", "en", "Nine times in ten it's the permissions."],
  ["C39", "FB", "sv", "FitMesh har ett officiellt samarbete med Fitbit."],
  ["C40", "GA", "da", "FitMesh integrerer direkte med Garmin."],
  ["C41", "FB", "en", "Permissions are a common cause of sync failures."],
];

export const S6_LEGIT: S6Row[] = [
  ["L01", "GA", "it", "FitMesh non ha un'integrazione ufficiale con Garmin."],
  ["L02", "GA", "en", "FitMesh does not use the official Garmin Connect API."],
  ["L03", "GA", "en", "There is no partnership between FitMesh and Garmin."],
  ["L04", "GA", "de", "FitMesh ist kein offizieller Partner von Garmin."],
  ["L05", "FB", "it", "FitMesh non si collega direttamente a Fitbit: legge da Health Connect."],
  ["L06", "FB", "en", "FitMesh is not endorsed by Google or Fitbit."],
  ["L07", "GA", "en", "Garmin Connect lets you export a single activity as a FIT file."],
  ["L08", "GA", "it", "Garmin Connect sincronizza l'orologio con il telefono via Bluetooth."],
  ["L09", "FB", "en", "The Fitbit app syncs your tracker over Bluetooth."],
  ["L10", "GA", "en", "Strava offers an official integration with Garmin Connect."],
  ["L11", "GA", "it", "FitMesh ha un'integrazione ufficiale con Garmin?"],
  ["L12", "FB", "en", "Does FitMesh connect directly to Fitbit?"],
  ["L13", "FB", "it", "Con che frequenza si sincronizza Fitbit?"],
  ["L14", "GA", "en", "Official Garmin export formats"],
  ["L15", "FB", "it", "Domande frequenti"],
  ["L16", "FB", "de", "Häufig gestellte Fragen"],
  ["L17", "FB", "en", "Health Connect usually updates in the background every few hours."],
  ["L18", "FB", "it", "Fitbit si sincronizza spesso durante il giorno."],
  ["L19", "FB", "fr", "L'application Fitbit se synchronise souvent pendant la journée."],
  ["L20", "FB", "pl", "Aplikacja Fitbit synchronizuje się często w ciągu dnia."],
  ["L21", "FB", "tr", "Fitbit uygulaması gün içinde sık sık senkronize olur."],
  ["L22", "FB", "it", "L'opzione si trova di solito in Impostazioni > App > Fitbit."],
  ["L23", "FB", "en", "The permission is usually under Settings > Apps > Health Connect."],
  ["L24", "FB", "de", "Die Option findest du normalerweise unter Einstellungen > Apps."],
  ["L25", "GA", "it", "Apri connect.garmin.com e scegli Esporta originale."],
  ["L26", "GA", "en", "Disable battery optimization for Garmin Connect."],
  ["L27", "FB", "es", "Abre Health Connect y concede todos los permisos a Fitbit."],
  ["L28", "GA", "en", "Direct Garmin sync is not available in FitMesh."],
  ["L29", "GA", "it", "Un'integrazione diretta con Garmin non è disponibile."],
  ["L30", "FB", "de", "Wir können nicht sagen, dass es ein häufiges Problem ist."],
  ["L31", "FB", "en", "We have no data on how often this problem occurs."],
  ["L32", "FB", "nl", "De Fitbit-app synchroniseert vaak op de achtergrond."],
  ["L33", "FB", "it", "Molti utenti usano sia Fitbit sia Google Fit."],
  ["L34", "GA", "en", "Most Garmin watches record activities in FIT format."],
  ["L35", "FB", "ko", "Fitbit 앱은 하루 동안 여러 번 동기화됩니다."],
  ["L36", "FB", "ja", "設定 > アプリ > Health Connect を開いてください。"],
  ["L37", "FB", "en", "Check the permissions first, then the battery settings."],
  ["L38", "GA", "en", "Export your data before you delete your Garmin account."],
  ["L39", "FB", "en", "If the problem persists, reinstall the Fitbit app."],
  ["L40", "GA", "it", "FitMesh legge i dati Garmin solo tramite Health Connect, non dall'API ufficiale."],
];

// Frequenza (CONTROLLO-S6 punto e). [classe, lingua, frase]; sempre sul post Fitbit.
export const S6_FREQ: Array<[cls: "P" | "N" | "D" | "K", lang: string, text: string]> = [
  ["P", "it", "Succede di frequente dopo un aggiornamento di Android."],
  ["P", "en", "It happens frequently after an Android update."],
  ["P", "es", "Es habitual tras actualizar Android."],
  ["P", "de", "Das passiert häufig nach einem Android-Update."],
  ["P", "fr", "Cela arrive fréquemment après une mise à jour d'Android."],
  ["P", "pt", "É comum depois de uma atualização do Android."],
  ["P", "pl", "Zdarza się to często po aktualizacji Androida."],
  ["P", "tr", "Android güncellemesinden sonra yaygın olarak görülür."],
  ["P", "nl", "Dit gebeurt vaak na een Android-update."],
  ["P", "ja", "Android の更新後に頻繁に起きます。"],
  ["P", "ko", "안드로이드 업데이트 후에 흔히 생깁니다."],
  ["P", "sv", "Det är vanligt efter en Android-uppdatering."],
  ["P", "da", "Det er almindeligt efter en Android-opdatering."],
  ["P", "it", "La sincronizzazione si interrompe frequentemente."],
  ["P", "en", "Sync stops frequently when the phone is idle."],
  ["P", "de", "Häufig hilft es, die App neu zu installieren."],
  ["N", "it", "Fitbit invia i dati al telefono a intervalli frequenti."],
  ["N", "en", "The watch sends data to the phone at frequent intervals."],
  ["N", "es", "La app sincroniza con frecuencia durante el día."],
  ["N", "de", "Die Uhr sendet häufig Daten an das Telefon."],
  ["N", "fr", "La montre envoie fréquemment des données au téléphone."],
  ["N", "pt", "O relógio envia dados com frequência ao telefone."],
  ["N", "pl", "Zegarek często wysyła dane do telefonu."],
  ["N", "tr", "Saat, telefona sık sık veri gönderir."],
  ["N", "nl", "Het horloge stuurt vaak gegevens naar de telefoon."],
  ["N", "ja", "時計はスマートフォンに頻繁にデータを送信します。"],
  ["N", "ko", "시계는 휴대폰으로 자주 데이터를 보냅니다."],
  ["N", "sv", "Klockan skickar ofta data till telefonen."],
  ["N", "da", "Uret sender ofte data til telefonen."],
  ["N", "en", "Health Connect usually stores the permission list under Settings."],
  ["N", "it", "Le autorizzazioni di Health Connect si controllano spesso dal menu Impostazioni del telefono."],
  ["N", "de", "Die Berechtigungen prüfst du am besten regelmäßig."],
  ["D", "it", "Non possiamo dire che sia un problema frequente."],
  ["D", "en", "We cannot say this is a frequent problem."],
  ["D", "es", "No podemos decir que sea un problema frecuente."],
  ["D", "fr", "Nous ne pouvons pas dire que c'est un problème fréquent."],
  ["D", "de", "Wir können nicht sagen, dass es ein häufiges Problem ist."],
  ["D", "pt", "Não podemos dizer que seja um problema comum."],
  ["D", "pl", "Nie możemy powiedzieć, że to częsty problem."],
  ["D", "tr", "Bunun yaygın bir sorun olduğunu söyleyemeyiz."],
  ["D", "nl", "We kunnen niet zeggen dat het een veelvoorkomend probleem is."],
  ["D", "ja", "これがよくある問題だとは言えません。"],
  ["D", "ko", "이것이 흔한 문제라고 말할 수 없습니다."],
  ["D", "sv", "Vi kan inte säga att det är ett vanligt problem."],
  ["D", "da", "Vi kan ikke sige, at det er et almindeligt problem."],
  ["K", "en", "This is a common problem."],
  ["K", "en", "Permissions are a common cause of sync failures."],
  ["K", "it", "È un problema comune."],
  ["K", "es", "Es un problema común."],
  ["K", "fr", "C'est un problème courant."],
  ["K", "de", "Ein verbreitetes Problem ist die Akkuoptimierung."],
  ["K", "nl", "Meestal ligt het aan de batterijoptimalisatie."],
  ["K", "ja", "ほとんどの場合、原因は権限の設定です。"],
  ["K", "ko", "대부분 배터리 최적화가 원인입니다."],
];

// Voci proprie (SD2): stessi finding, altre lingue e altri post. Verso scelto da chi scrive, non dal revisore.
export const S6_OWN_CLAIMS: S6Row[] = [
  // S6-02: integrazione ufficiale/diretta/partnership/certificazione di FitMesh sui post Fitbit e Google Health
  ["O01", "FB", "it", "FitMesh è un partner ufficiale di Fitbit."],
  ["O02", "FB", "es", "FitMesh se conecta directamente con Fitbit."],
  ["O03", "FB", "pt", "A FitMesh é parceira oficial do Fitbit."],
  ["O04", "FB", "fr", "FitMesh est certifié par Fitbit."],
  ["O05", "FB", "de", "FitMesh ist offiziell mit Fitbit integriert."],
  ["O06", "FB", "pl", "FitMesh integruje się bezpośrednio z Fitbit."],
  ["O07", "FB", "tr", "FitMesh, Fitbit ile doğrudan entegre çalışır."],
  ["O08", "FB", "nl", "FitMesh heeft een officiële samenwerking met Fitbit."],
  ["O09", "GH", "en", "FitMesh is officially integrated with Google Health."],
  ["O10", "GH", "de", "FitMesh ist ein offizieller Partner von Google."],
  ["O11", "GH", "it", "FitMesh si collega direttamente a Google Health."],
  ["O12", "GH", "fr", "FitMesh a un partenariat officiel avec Google Health."],
  ["O13", "GH", "en", "Google has approved FitMesh for Google Health data."],
  // S6-02: promessa futura di FitMesh
  ["O14", "GH", "it", "Prossimamente FitMesh supporterà Google Health."],
  ["O15", "FB", "de", "Bald wird FitMesh Fitbit direkt unterstützen."],
  // S6-03: «common cause/problem» e certificazione in altre lingue
  ["O16", "FB", "de", "Berechtigungen sind eine häufige Ursache für Synchronisierungsfehler."],
  ["O17", "FB", "de", "Ein gängiges Problem sind die Berechtigungen von Health Connect."],
  ["O18", "FB", "pt", "Um problema comum são as permissões do Health Connect."],
  ["O19", "GH", "en", "A common cause is a missing permission in Health Connect."],
  ["O20", "FB", "ja", "FitMesh は Fitbit の認定を受けています。"],
  // S6-01: soggetto implicito in altri post e altre forme
  ["O21", "GH", "en", "It happens often after the app is updated."],
  ["O22", "GH", "it", "Capita spesso dopo un aggiornamento di Google Health."],
  ["O23", "FB", "en", "This is frequently seen after a phone restart."],
  // S6-04: connettivo causale subito dopo il marcatore
  ["O24", "FB", "en", "If the steps differ, it's often because each app counts them its own way."],
  ["O25", "FB", "it", "Spesso perché ciascuna app conta i passi a modo suo."],
  ["O26", "GH", "nl", "Dit komt meestal doordat elke app anders telt."],
  // S6-06: frequenza di causa in altre lingue
  ["O27", "FB", "de", "Meistens liegt es an der Akkuoptimierung."],
  ["O28", "FB", "pl", "Najczęściej przyczyną jest optymalizacja baterii."],
  ["O29", "FB", "es", "Casi siempre el problema son los permisos."],
];

export const S6_OWN_LEGIT: S6Row[] = [
  // S6-02: stato onesto, negazione, domanda, terza parte; «diretta» senza servizio di terza parte
  ["N01", "FB", "it", "FitMesh non è un partner ufficiale di Fitbit."],
  ["N02", "FB", "en", "FitMesh reads your data directly from Health Connect."],
  ["N03", "GH", "en", "Is FitMesh officially integrated with Google Health?"],
  ["N04", "GH", "en", "Google Health offers an official integration with Health Connect."],
  ["N05", "FB", "de", "FitMesh ist nicht von Google zertifiziert."],
  ["N06", "FB", "fr", "FitMesh n'est pas certifié par Fitbit."],
  ["N07", "FB", "en", "The Fitbit app connects directly to your tracker over Bluetooth."],
  // S6-01: eventi con soggetto esplicito e scheduling (nessun evento-problema)
  ["N08", "FB", "en", "Sync usually happens in the background because Android allows it."],
  ["N09", "FB", "de", "Ab Android 14 ist Health Connect meist vorinstalliert, weil es Teil des Systems ist."],
  ["N10", "FB", "it", "Fitbit sincronizza più volte al giorno."],
  ["N11", "FB", "en", "How often does it happen? Check the sync log."],
  // S6-03: «common» senza problema/causa, nomi che iniziano uguale
  ["N12", "GA", "en", "FIT and TCX are the most common export formats."],
  ["N13", "FB", "it", "Per la comunicazione con il telefono serve il Bluetooth."],
  ["N14", "GH", "fr", "Google a annoncé une migration prévue courant 2026."],
  ["N15", "GA", "nl", "Voor jaren aan frequente gegevens kan het archief meerdere GB wegen."],
  // S6-05: presa di distanza in altre lingue e posizioni
  ["N16", "FB", "es", "No podemos afirmar que sea una causa frecuente."],
  ["N17", "FB", "pt", "Não podemos dizer que seja uma causa comum."],
  ["N18", "FB", "tr", "Bunun yaygın bir neden olduğunu söyleyemeyiz."],
  // S6-07: istruzioni d'uso con frequenza di un'azione dell'utente
  ["N19", "FB", "en", "You should check the permissions in Health Connect regularly."],
  ["N20", "FB", "fr", "Il vaut mieux vérifier souvent les autorisations de Health Connect."],
  ["N21", "FB", "es", "Conviene revisar a menudo los permisos de Health Connect en Ajustes."],
  // S6-08: etichetta senza punteggiatura seguita da una frase legittima, su righe diverse
  ["N22", "FB", "de", "Häufig gestellte Fragen\nDie Option findest du normalerweise unter Einstellungen > Apps."],
];

// LIMITI-NOTI (S6-10): claim che nessun rilevatore classifica nel verso giusto senza falsi positivi. NON sono nel
// pass/fail del corpus; ogni voce e' verificata dal test «verde osservato» (se il sistema li vede, vanno promossi).
export const S6_LIMITI_NOTI: Array<{ id: string; post: S6Post; lang: string; text: string; why: string }> = [
  {
    id: "C35", post: "FB", lang: "it", text: "FitMesh importa automaticamente i dati da Fitbit.",
    why: "lettura/importazione al presente di FitMesh senza marcatore di ufficialita': e' il comportamento stesso del prodotto (893 frasi di capacita' nel contenuto); distinguerlo da un claim richiede la verita' del fatto, non un rilevatore.",
  },
  {
    id: "C38", post: "GA", lang: "en", text: "FitMesh and Garmin work hand in hand.",
    why: "idioma di collaborazione senza lessico di integrazione ne' di partnership: nessuna radice elencata lo vede.",
  },
  {
    id: "C42", post: "FB", lang: "it", text: "È un problema che capita a tanti utenti Fitbit.",
    why: "frequenza espressa come quantita' di PERSONE («tanti utenti»): non distinguibile da «molti utenti usano Fitbit» (L33), che e' legittima.",
  },
];
