import type { Locale } from "@/lib/i18n";
import type { Localized } from "@/lib/blog/types";

/**
 * Copy della homepage estratto dagli ex-ternari inline `lc === "it" ? ... :
 * lc === "es" ? ... : "<english>"` (solo it/es/en) in un unico posto
 * tipizzato, riusando `Localized`/`tl()` già usato per `PRICING_SECTION` sulla
 * stessa pagina. Da questa versione tutti e 15 i locali sono tradotti
 * (`HOME_COMPLETE_LOCALES` in `lib/content/static-page-locales.ts` riflette lo
 * stesso set) — NON lasciare stringhe placeholder o copiate dall'inglese per
 * eventuali nuovi locali futuri, meglio ometterle (`tl()` fa fallback a `en`).
 */

type StepItem = { t: string; d: string };

type LocalizedItems<T> = { it: T; en: T } & Partial<Record<Locale, T>>;

export function tli<T>(l: LocalizedItems<T>, lc: Locale): T {
  return (l as Record<string, T | undefined>)[lc] ?? l.en;
}

export const HOMEPAGE_COPY = {
  leadSentence: {
    it: "FitMesh Sync è un'app per iPhone e Android. Legge i dati che orologi, anelli e app fitness salvano in Apple Salute o in Health Connect, con il tuo permesso. Con un anello Colmi compatibile si collega anche via Bluetooth. Te li mostra insieme, giorno per giorno.",
    en: "FitMesh Sync is an app for iPhone and Android. It reads the data that watches, rings and fitness apps save to Apple Health or Health Connect, with your permission. With a compatible Colmi ring it also connects over Bluetooth. It shows all of it together, day by day.",
    es: "FitMesh Sync es una app para iPhone y Android. Lee los datos que relojes, anillos y apps de fitness guardan en Apple Salud o en Health Connect, con tu permiso. Con un anillo Colmi compatible también se conecta por Bluetooth. Te los muestra juntos, día tras día.",
    de: "FitMesh Sync ist eine App für iPhone und Android. Sie liest die Daten, die Uhren, Ringe und Fitness-Apps in Apple Health oder Health Connect speichern, mit deiner Erlaubnis. Mit einem kompatiblen Colmi-Ring verbindet sie sich auch über Bluetooth. Sie zeigt sie zusammen, Tag für Tag.",
    pt: "O FitMesh Sync é uma app para iPhone e Android. Lê os dados que relógios, anéis e apps de fitness guardam no Apple Saúde ou no Health Connect, com a tua autorização. Com um anel Colmi compatível também se liga por Bluetooth. Mostra-os juntos, dia após dia.",
    fr: "FitMesh Sync est une application pour iPhone et Android. Elle lit les données que les montres, bagues et apps de fitness enregistrent dans Apple Santé ou Health Connect, avec votre autorisation. Avec une bague Colmi compatible, elle se connecte aussi en Bluetooth. Elle vous les présente réunies, jour après jour.",
    pl: "FitMesh Sync to aplikacja na iPhone'a i Androida. Odczytuje dane, które zegarki, pierścienie i aplikacje fitness zapisują w Apple Health lub Health Connect, za Twoją zgodą. Ze zgodnym pierścieniem Colmi łączy się także przez Bluetooth. Pokazuje je razem, dzień po dniu.",
    tr: "FitMesh Sync, iPhone ve Android için bir uygulamadır. Saatlerin, yüzüklerin ve fitness uygulamalarının Apple Health veya Health Connect'e kaydettiği verileri izninizle okur. Uyumlu bir Colmi yüzüğü ile Bluetooth üzerinden de bağlanır. Hepsini gün bazında bir arada gösterir.",
    nl: "FitMesh Sync is een app voor iPhone en Android. Het leest de gegevens die horloges, ringen en fitness-apps opslaan in Apple Gezondheid of Health Connect, met jouw toestemming. Met een compatibele Colmi-ring maakt het ook verbinding via Bluetooth. Het toont ze samen, dag na dag.",
    ja: "FitMesh SyncはiPhoneとAndroid向けのアプリです。時計やリング、フィットネスアプリがAppleヘルスケアやHealth Connectに保存したデータを、あなたの許可のもとで読み取ります。対応するColmiリングとはBluetoothでも接続します。日ごとにデータをまとめて表示します。",
    ko: "FitMesh Sync는 iPhone 및 Android용 앱입니다. 사용자의 허가를 받아 시계, 스마트링, 피트니스 앱이 Apple 건강 또는 Health Connect에 저장한 데이터를 읽어옵니다. 호환되는 Colmi 링과는 Bluetooth로도 연결됩니다. 하루 단위로 데이터를 한곳에 모아 보여줍니다.",
    sv: "FitMesh Sync är en app för iPhone och Android. Den läser data som klockor, ringar och träningsappar sparar i Apple Hälsa eller Health Connect, med din tillåtelse. Med en kompatibel Colmi-ring ansluter den även via Bluetooth. Den visar allt samlat, dag för dag.",
    da: "FitMesh Sync er en app til iPhone og Android. Den læser de data, som ure, ringe og fitness-apps gemmer i Apple Sundhed eller Health Connect, med din tilladelse. Med en kompatibel Colmi-ring opretter den også forbindelse via Bluetooth. Den viser det hele samlet, dag for dag.",
    no: "FitMesh Sync er en app for iPhone og Android. Den leser dataene som klokker, ringer og treningsapper lagrer i Apple Helse eller Health Connect, med din tillatelse. Med en kompatibel Colmi-ring kobler den seg også til via Bluetooth. Den viser alt samlet, dag for dag.",
    fi: "FitMesh Sync on sovellus iPhonelle ja Androidille. Se lukee tiedot, jotka kellot, sormukset ja kuntosovellukset tallentavat Apple Terveyteen tai Health Connectiin, luvallasi. Yhteensopivan Colmi-sormuksen kanssa se muodostaa yhteyden myös Bluetoothilla. Se näyttää ne yhdessä, päivä päivältä.",
  } satisfies Localized,

  /**
   * Sprint P0.10 / P0.10K — copy permanente post-Founder (chiusura
   * commerciale del sito), usata per la card prova nella sezione pricing e
   * per la riga finale della banda CTA. Prima del 31/07/2026 questi due
   * campi erano il ramo `evergreen` di FounderClientGate; ora sono l'unico
   * contenuto renderizzato, senza gate ne' richiesta di rete.
   */
  trialName: {
    it: "14 giorni gratis",
    en: "14-day trial",
    es: "14 días gratis",
    de: "14 Tage gratis",
    pt: "14 dias grátis",
    fr: "14 jours gratuits",
    pl: "14 dni za darmo",
    tr: "14 gün ücretsiz",
    nl: "14 dagen gratis",
    ja: "14日間無料",
    ko: "14일 무료",
    sv: "14 dagar gratis",
    da: "14 dage gratis",
    no: "14 dager gratis",
    fi: "14 päivää ilmaiseksi",
  } satisfies Localized,
  trialTagline: {
    it: "Prova Pro gratis, poi scegli il piano più adatto",
    en: "Try Pro free, then choose the plan that fits you",
    es: "Prueba Pro gratis y luego elige el plan que más te convenga",
    de: "Teste Pro kostenlos und wähle danach den passenden Plan",
    pt: "Experimenta o Pro grátis e depois escolhe o plano ideal",
    fr: "Essaie Pro gratuitement, puis choisis la formule qui te convient",
    pl: "Wypróbuj Pro za darmo, a potem wybierz odpowiedni plan",
    tr: "Pro'yu ücretsiz dene, ardından sana uygun planı seç",
    nl: "Probeer Pro gratis en kies daarna het plan dat bij je past",
    ja: "Proを無料体験後、最適なプランをお選びください",
    ko: "Pro를 무료로 체험한 후 나에게 맞는 요금제를 선택하세요",
    sv: "Testa Pro gratis och välj sedan den plan som passar dig",
    da: "Prøv Pro gratis, og vælg derefter den plan, der passer dig",
    no: "Prøv Pro gratis, og velg deretter planen som passer deg",
    fi: "Kokeile Pro-versiota ilmaiseksi ja valitse sitten sinulle sopiva paketti",
  } satisfies Localized,

  platformsAvailableLabel: {
    it: "Disponibile ora",
    en: "Available now",
    es: "Disponible ahora",
    de: "Jetzt verfügbar",
    pt: "Disponível agora",
    fr: "Disponible maintenant",
    pl: "Dostępne już teraz",
    tr: "Şimdi kullanılabilir",
    nl: "Nu beschikbaar",
    ja: "今すぐ利用可能",
    ko: "지금 이용 가능",
    sv: "Tillgänglig nu",
    da: "Tilgængelig nu",
    no: "Tilgjengelig nå",
    fi: "Saatavilla nyt",
  } satisfies Localized,

  wearablesSupportedLabel: {
    it: "Wearable supportati",
    en: "Wearables supported",
    es: "Wearables compatibles",
    de: "Unterstützte Wearables",
    pt: "Wearables suportados",
    fr: "Appareils compatibles",
    pl: "Obsługiwane urządzenia",
    tr: "Desteklenen giyilebilir cihaz",
    nl: "Ondersteunde wearables",
    ja: "対応ウェアラブル",
    ko: "지원 웨어러블",
    sv: "Wearables som stöds",
    da: "Understøttede wearables",
    no: "Støttede wearables",
    fi: "Tuettua puettavaa laitetta",
  } satisfies Localized,

  worksWithKicker: {
    it: "Compatibile con",
    en: "Works with",
    es: "Compatible con",
    de: "Funktioniert mit",
    pt: "Compatível com",
    fr: "Compatible avec",
    pl: "Współpracuje z",
    tr: "Şunlarla Çalışır",
    nl: "Werkt met",
    ja: "対応",
    ko: "지원 기기",
    sv: "Fungerar med",
    da: "Fungerer med",
    no: "Fungerer med",
    fi: "Toimii näiden kanssa",
  } satisfies Localized,

  howItWorksKicker: {
    it: "Come funziona",
    en: "How it works",
    es: "Cómo funciona",
    de: "So funktioniert's",
    pt: "Como funciona",
    fr: "Comment ça marche",
    pl: "Jak to działa",
    tr: "Nasıl Çalışır",
    nl: "Hoe het werkt",
    ja: "使い方",
    ko: "이용 방법",
    sv: "Så funkar det",
    da: "Sådan fungerer det",
    no: "Slik fungerer det",
    fi: "Näin se toimii",
  } satisfies Localized,

  howItWorksHeading: {
    it: "Tre passi, su iPhone o su Android.",
    en: "Three steps, on iPhone or Android.",
    es: "Tres pasos, en iPhone o en Android.",
    de: "Drei Schritte, auf dem iPhone oder Android.",
    pt: "Três passos, no iPhone ou no Android.",
    fr: "Trois étapes, sur iPhone ou Android.",
    pl: "Trzy kroki, na iPhonie lub Androidzie.",
    tr: "Üç adımda, iPhone veya Android'de.",
    nl: "Drie stappen, op iPhone of Android.",
    ja: "iPhoneでもAndroidでも、3つのステップで完了。",
    ko: "iPhone과 Android 모두 간단한 3단계.",
    sv: "Tre steg, på iPhone eller Android.",
    da: "Tre trin, på iPhone eller Android.",
    no: "Tre trinn, på iPhone eller Android.",
    fi: "Kolme vaihetta, iPhonella tai Androidilla.",
  } satisfies Localized,

  stepLabel: {
    it: "Step",
    en: "Step",
    es: "Paso",
    de: "Schritt",
    pt: "Passo",
    fr: "Étape",
    pl: "Krok",
    tr: "Adım",
    nl: "Stap",
    ja: "ステップ",
    ko: "단계",
    sv: "Steg",
    da: "Trin",
    no: "Steg",
    fi: "Vaihe",
  } satisfies Localized,

  steps: {
    it: [
      { t: "Installa e accedi", d: "Scarica FitMesh Sync da App Store o da Google Play, poi crea un account o accedi. Se cambi telefono o ne usi più di uno, usa lo stesso account." },
      { t: "Autorizza le letture", d: "Su iPhone dai accesso ad Apple Salute, su Android a Health Connect, scegliendo quali dati leggere. Se hai un anello Colmi compatibile, attiva il Bluetooth e tocca «Collega anello» nell'app. FitMesh riceve solo quello che le tue sorgenti salvano e che autorizzi: se una misura non viene condivisa, non arriva." },
      { t: "Consulta i tuoi dati nell'app", d: "FitMesh riunisce per giorno i dati che hai autorizzato. Se usi più telefoni con lo stesso account, ognuno mostra anche i dati già sincronizzati dagli altri. Per aggiornare quando vuoi, tocca «Sincronizza ora»." },
    ],
    en: [
      { t: "Install and sign in", d: "Download FitMesh Sync from the App Store or Google Play, then create an account or sign in. If you switch phones or use more than one, use the same account." },
      { t: "Allow access", d: "On iPhone, give access to Apple Health; on Android, to Health Connect, choosing which data to read. If you have a compatible Colmi ring, turn on Bluetooth and tap “Pair ring” in the app. FitMesh only receives what your sources save and you allow: if a measurement is not shared, it does not arrive." },
      { t: "Check your data in the app", d: "FitMesh brings the data you allowed together by day. If you use more than one phone with the same account, each one also shows the data the others have already synced. To update whenever you want, tap “Sync now”." },
    ],
    es: [
      { t: "Instala e inicia sesión", d: "Descarga FitMesh Sync desde App Store o Google Play, luego crea una cuenta o inicia sesión. Si cambias de teléfono o usas más de uno, usa la misma cuenta." },
      { t: "Autoriza las lecturas", d: "En iPhone da acceso a Apple Salud, en Android a Health Connect, eligiendo qué datos leer. Si tienes un anillo Colmi compatible, activa el Bluetooth y toca «Conectar anillo» en la app. FitMesh solo recibe lo que tus fuentes guardan y tú autorizas: si una medición no se comparte, no llega." },
      { t: "Consulta tus datos en la app", d: "FitMesh reúne por día los datos que has autorizado. Si usas varios teléfonos con la misma cuenta, cada uno muestra también los datos ya sincronizados por los otros. Para actualizar cuando quieras, toca «Sincronizar ahora»." },
    ],
    de: [
      { t: "Installieren und anmelden", d: "Lade FitMesh Sync aus dem App Store oder von Google Play herunter, erstelle dann ein Konto oder melde dich an. Wenn du das Smartphone wechselst oder mehrere nutzt, verwende dasselbe Konto." },
      { t: "Lesezugriff erlauben", d: "Gib auf dem iPhone Zugriff auf Apple Health, auf Android auf Health Connect und wähle, welche Daten gelesen werden sollen. Wenn du einen kompatiblen Colmi-Ring hast, aktiviere Bluetooth und tippe in der App auf «Ring verbinden». FitMesh empfängt nur das, was deine Quellen speichern und du erlaubst: Wenn ein Messwert nicht geteilt wird, kommt er nicht an." },
      { t: "Sieh deine Daten in der App ein", d: "FitMesh führt die von dir erlaubten Daten tageweise zusammen. Wenn du mehrere Telefone mit demselben Konto nutzt, zeigt jedes auch die von den anderen bereits synchronisierten Daten an. Um jederzeit zu aktualisieren, tippe auf «Jetzt synchronisieren»." },
    ],
    pt: [
      { t: "Instala e inicia sessão", d: "Descarrega o FitMesh Sync da App Store ou do Google Play, depois cria uma conta ou inicia sessão. Se mudares de telemóvel ou usares mais do que um, usa a mesma conta." },
      { t: "Autoriza as leituras", d: "No iPhone concede acesso ao Apple Saúde, no Android ao Health Connect, escolhendo quais os dados a ler. Se tiveres um anel Colmi compatível, ativa o Bluetooth e toca em «Ligar anel» na app. O FitMesh só recebe o que as tuas fontes guardam e tu autorizas: se uma medição não for partilhada, não chega." },
      { t: "Consulta os teus dados na app", d: "O FitMesh reúne por dia os dados que autorizaste. Se usares vários telemóveis com a mesma conta, cada um mostra também os dados já sincronizados pelos outros. Para atualizar quando quiseres, toca em «Sincronizar agora»." },
    ],
    fr: [
      { t: "Installez et connectez-vous", d: "Téléchargez FitMesh Sync sur l'App Store ou Google Play, puis créez un compte ou connectez-vous. Si vous changez de téléphone ou en utilisez plusieurs, utilisez le même compte." },
      { t: "Autorisez les lectures", d: "Sur iPhone, donnez accès à Apple Santé, sur Android à Health Connect, en choisissant quelles données lire. Si vous avez une bague Colmi compatible, activez le Bluetooth et touchez « Associer la bague » dans l'application. FitMesh ne reçoit que ce que vos sources enregistrent et que vous autorisez : si une mesure n'est pas partagée, elle n'arrive pas." },
      { t: "Consultez vos données dans l'application", d: "FitMesh regroupe par jour les données que vous avez autorisées. Si vous utilisez plusieurs téléphones avec le même compte, chacun affiche aussi les données déjà synchronisées par les autres. Pour actualiser quand vous le souhaitez, touchez « Synchroniser maintenant »." },
    ],
    pl: [
      { t: "Zainstaluj i zaloguj się", d: "Pobierz FitMesh Sync z App Store lub Google Play, a następnie utwórz konto lub zaloguj się. Jeśli zmienisz telefon lub używasz kilku, użyj tego samego konta." },
      { t: "Zezwól na odczyt danych", d: "Na iPhonie przyznaj dostęp do Apple Health, na Androidzie do Health Connect, wybierając dane do odczytu. Jeśli masz zgodny pierścień Colmi, włącz Bluetooth i dotknij «Połącz pierścień» w aplikacji. FitMesh odbiera tylko to, co zapisują Twoje źródła i na co zezwalasz: jeśli pomiar nie jest udostępniony, nie dotrze." },
      { t: "Sprawdzaj swoje dane w aplikacji", d: "FitMesh gromadzi dzień po dniu dane, na które wyraziłeś zgodę. Jeśli używasz wielu telefonów z tym samym kontem, każdy z nich pokazuje także dane zsynchronizowane przez pozostałe. Aby odświeżyć w dowolnym momencie, dotknij «Synchronizuj teraz»." },
    ],
    tr: [
      { t: "Yükleyin ve giriş yapın", d: "FitMesh Sync uygulamasını App Store veya Google Play'den indirin, ardından bir hesap oluşturun veya giriş yapın. Telefon değiştirirseniz veya birden fazla cihaz kullanırsanız aynı hesabı kullanın." },
      { t: "Okuma erişimi verin", d: "iPhone'da Apple Health'e, Android'de Health Connect'e hangi verilerin okunacağını seçerek erişim verin. Uyumlu bir Colmi yüzüğünüz varsa Bluetooth'u açın ve uygulamada «Yüzüğü bağla» seçeneğine dokunun. FitMesh yalnızca kaynaklarınızın kaydettiği ve izin verdiğiniz verileri alır: bir ölçüm paylaşılmazsa ulaşmaz." },
      { t: "Verilerinizi uygulamada inceleyin", d: "FitMesh izin verdiğiniz verileri gün bazında bir araya getirir. Aynı hesapla birden fazla telefon kullanıyorsanız her biri diğerlerinin önceden eşitlediği verileri de gösterir. İstediğiniz zaman güncellemek için «Şimdi senkronize et» seçeneğine dokunun." },
    ],
    nl: [
      { t: "Installeer en log in", d: "Download FitMesh Sync uit de App Store of Google Play, maak vervolgens een account aan of log in. Als je van telefoon wisselt of er meer gebruikt, gebruik dan hetzelfde account." },
      { t: "Geef leestoegang", d: "Geef op iPhone toegang tot Apple Gezondheid, op Android tot Health Connect, en kies welke gegevens je wilt lezen. Als je een compatibele Colmi-ring hebt, schakel dan Bluetooth in en tik in de app op «Koppel ring». FitMesh ontvangt alleen wat je bronnen opslaan en jij toestaat: als een meting niet wordt gedeeld, komt deze niet aan." },
      { t: "Bekijk je gegevens in de app", d: "FitMesh brengt de door jou goedgekeurde gegevens per dag samen. Als je meerdere telefoons met hetzelfde account gebruikt, toont elke telefoon ook de gegevens die al door de andere zijn gesynchroniseerd. Tik op «Nu synchroniseren» om bij te werken wanneer je wilt." },
    ],
    ja: [
      { t: "インストールとログイン", d: "App StoreまたはGoogle PlayからFitMesh Syncをダウンロードし、アカウントを作成またはログインします。端末を変更したり複数台使用したりする場合も、同じアカウントを使用します。" },
      { t: "読み取り権限の許可", d: "iPhoneではAppleヘルスケア、AndroidではHealth Connectへのアクセスを許可し、読み取るデータを選択します。対応するColmiリングをお持ちの場合は、Bluetoothを有効にしてアプリで「リングを接続」をタップします。FitMeshはソースが保存し許可されたデータのみを受信します。共有されていない測定値は届きません。" },
      { t: "アプリでデータを確認", d: "FitMeshは許可されたデータを日ごとにまとめます。同じアカウントで複数のスマートフォンを使用している場合、それぞれが他の端末からすでに同期されたデータも表示します。いつでも更新するには「今すぐ同期」をタップします。" },
    ],
    ko: [
      { t: "설치 및 로그인", d: "App Store 또는 Google Play에서 FitMesh Sync를 다운로드한 다음 계정을 만들거나 로그인하세요. 휴대전화를 바꾸거나 여러 대를 사용하는 경우 동일한 계정을 사용하세요." },
      { t: "읽기 권한 허용", d: "iPhone에서는 Apple 건강, Android에서는 Health Connect에 접근 권한을 부여하고 읽어올 데이터를 선택하세요. 호환되는 Colmi 링이 있다면 Bluetooth를 켜고 앱에서 «링 연결»을 누르세요. FitMesh는 소스가 저장하고 사용자가 허용한 데이터만 수신합니다. 공유되지 않은 측정값은 반영되지 않습니다." },
      { t: "앱에서 데이터 확인하기", d: "FitMesh는 허용된 데이터를 하루 단위로 모아줍니다. 동일한 계정으로 여러 휴대전화를 사용하는 경우 각 기기는 다른 기기에서 이미 동기화된 데이터도 함께 표시합니다. 원할 때 언제든 업데이트하려면 «지금 동기화»를 누르세요." },
    ],
    sv: [
      { t: "Installera och logga in", d: "Ladda ner FitMesh Sync från App Store eller Google Play, skapa sedan ett konto eller logga in. Om du byter telefon eller använder flera använder du samma konto." },
      { t: "Tillåt läsåtkomst", d: "På iPhone ger du åtkomst till Apple Hälsa, på Android till Health Connect, och väljer vilka data som ska läsas. Om du har en kompatibel Colmi-ring aktiverar du Bluetooth och trycker på «Anslut ring» i appen. FitMesh tar bara emot det dina källor sparar och du tillåter: om ett mått inte delas kommer det inte fram." },
      { t: "Se din data i appen", d: "FitMesh samlar den data du har godkänt dag för dag. Om du använder flera telefoner med samma konto visar var och en även data som redan synkroniserats av de andra. För att uppdatera när du vill trycker du på «Synkronisera nu»." },
    ],
    da: [
      { t: "Installer og log ind", d: "Download FitMesh Sync fra App Store eller Google Play, opret derefter en konto eller log ind. Hvis du skifter telefon eller bruger flere, skal du bruge samme konto." },
      { t: "Giv læseadgang", d: "Giv på iPhone adgang til Apple Sundhed, på Android til Health Connect, og vælg hvilke data der skal læses. Hvis du har en kompatibel Colmi-ring, skal du slå Bluetooth til og trykke på «Tilslut ring» i appen. FitMesh modtager kun det, dine kilder gemmer og du tillader: hvis en måling ikke deles, ankommer den ikke." },
      { t: "Se dine data i appen", d: "FitMesh samler de data, du har godkendt, dag for dag. Hvis du bruger flere telefoner med samme konto, viser hver især også data, der allerede er synkroniseret af de andre. Tryk på «Synkroniser nu» for at opdatere, når du vil." },
    ],
    no: [
      { t: "Installer og logg inn", d: "Last ned FitMesh Sync fra App Store eller Google Play, og opprett deretter en konto eller logg inn. Hvis du bytter telefon eller bruker flere, bruker du samme konto." },
      { t: "Gi tilgang til lesing", d: "På iPhone gir du tilgang til Apple Helse, på Android til Health Connect, og velger hvilke data som skal leses. Hvis du har en kompatibel Colmi-ring, slår du på Bluetooth og trykker på «Koble til ring» i appen. FitMesh mottar bare det kildene dine lagrer og du tillater: hvis en måling ikke deles, kommer den ikke frem." },
      { t: "Se dataene dine i appen", d: "FitMesh samler dataene du har godkjent, dag for dag. Hvis du bruker flere telefoner med samme konto, viser hver enkelt også dataene som allerede er synkronisert av de andre. For å oppdatere når du vil, trykker du på «Synkroniser nå»." },
    ],
    fi: [
      { t: "Asenna ja kirjaudu", d: "Lataa FitMesh Sync App Storesta tai Google Playsta, luo sitten tili tai kirjaudu sisään. Jos vaihdat puhelinta tai käytät useampaa, käytä samaa tiliä." },
      { t: "Myönnä lukuoikeudet", d: "Anna iPhonessa käyttöoikeus Apple Terveyteen, Androidissa Health Connectiin valiten luettavat tiedot. Jos sinulla on yhteensopiva Colmi-sormus, ota Bluetooth käyttöön ja napauta sovelluksessa «Yhdistä sormus». FitMesh vastaanottaa vain sen, mitä lähteesi tallentavat ja sinä sallit: jos mittausta ei jaeta, se ei saavu perille." },
      { t: "Tarkastele tietojasi sovelluksessa", d: "FitMesh kokoaa sallimasi tiedot päiväkohtaisesti. Jos käytät useampaa puhelinta samalla tilillä, kukin näyttää myös muiden jo synkronoimat tiedot. Voit päivittää milloin tahansa napauttamalla «Synkronoi nyt»." },
    ],
  } as LocalizedItems<StepItem[]>,

  integrationsKicker: {
    it: "Integrazioni",
    en: "Integrations",
    es: "Integraciones",
    de: "Integrationen",
    pt: "Integrações",
    fr: "Intégrations",
    pl: "Integracje",
    tr: "Entegrasyonlar",
    nl: "Integraties",
    ja: "連携",
    ko: "연동",
    sv: "Integrationer",
    da: "Integrationer",
    no: "Integrasjoner",
    fi: "Integraatiot",
  } satisfies Localized,

  integrationsHeading: {
    it: "Funziona con quello che hai già.",
    en: "Works with what you already have.",
    es: "Funciona con lo que ya tienes.",
    de: "Funktioniert mit dem, was du schon hast.",
    pt: "Funciona com o que já tens.",
    fr: "Compatible avec ce que vous avez déjà.",
    pl: "Działa z tym, co już masz.",
    tr: "Elindekiyle çalışır.",
    nl: "Werkt met wat je al hebt.",
    ja: "今使っているものと、そのままつながる。",
    ko: "지금 쓰는 기기와 바로 연동됩니다.",
    sv: "Fungerar med det du redan har.",
    da: "Fungerer med det, du allerede har.",
    no: "Fungerer med det du allerede har.",
    fi: "Toimii sen kanssa, mikä sinulla jo on.",
  } satisfies Localized,

  seeAll: {
    it: "Vedi tutte",
    en: "See all",
    es: "Ver todas",
    de: "Alle anzeigen",
    pt: "Ver tudo",
    fr: "Tout voir",
    pl: "Zobacz wszystkie",
    tr: "Tümünü gör",
    nl: "Bekijk alles",
    ja: "すべて見る",
    ko: "전체 보기",
    sv: "Se alla",
    da: "Se alle",
    no: "Se alle",
    fi: "Katso kaikki",
  } satisfies Localized,

  /**
   * Sprint P0.2 Fase 6 (2026-07-12): teaser sotto integrationsHeading, link a
   * /fitness-data-sync. Tradotto solo it/en/de/es (stesso scope della
   * landing, vedi FITNESS_DATA_SYNC_COMPLETE_LOCALES) — le altre locale
   * cadono su en via tl().
   */
  integrationsDashboardTeaser: {
    it: "Vuoi sapere cosa è live e cosa è ancora in sviluppo?",
    en: "Want to know what's live and what's still in development?",
    es: "¿Quieres saber qué está en vivo y qué sigue en desarrollo?",
    de: "Möchtest du wissen, was live ist und was sich noch in Entwicklung befindet?",
  } satisfies Localized,

  orLabel: {
    it: "oppure",
    en: "or",
    es: "o",
    de: "oder",
    pt: "ou",
    fr: "ou",
    pl: "lub",
    tr: "veya",
    nl: "of",
    ja: "または",
    ko: "또는",
    sv: "eller",
    da: "eller",
    no: "eller",
    fi: "tai",
  } satisfies Localized,

  readMoreKicker: {
    it: "Approfondisci",
    en: "Read more",
    es: "Más información",
    de: "Weiterlesen",
    pt: "Ler mais",
    fr: "En savoir plus",
    pl: "Czytaj więcej",
    tr: "Daha Fazla Oku",
    nl: "Meer lezen",
    ja: "もっと読む",
    ko: "더 알아보기",
    sv: "Läs mer",
    da: "Læs mere",
    no: "Les mer",
    fi: "Lue lisää",
  } satisfies Localized,

  readMoreHeading: {
    it: "Guide e confronti per scegliere bene.",
    en: "Guides and comparisons to choose well.",
    es: "Guías y comparativas para elegir bien.",
    de: "Ratgeber und Vergleiche für die richtige Wahl.",
    pt: "Guias e comparações para escolheres bem.",
    fr: "Des guides et comparatifs pour bien choisir.",
    pl: "Poradniki i porównania, dzięki którym dobrze wybierzesz.",
    tr: "Doğru seçim için rehberler ve karşılaştırmalar.",
    nl: "Gidsen en vergelijkingen om de juiste keuze te maken.",
    ja: "賢く選ぶための、ガイドと比較記事。",
    ko: "현명하게 고르도록 돕는 가이드와 비교.",
    sv: "Guider och jämförelser för att välja rätt.",
    da: "Guider og sammenligninger, så du vælger rigtigt.",
    no: "Guider og sammenligninger som hjelper deg å velge riktig.",
    fi: "Oppaat ja vertailut oikean valinnan tueksi.",
  } satisfies Localized,

  allArticles: {
    it: "Tutti gli articoli",
    en: "All articles",
    es: "Todos los artículos",
    de: "Alle Artikel",
    pt: "Todos os artigos",
    fr: "Tous les articles",
    pl: "Wszystkie artykuły",
    tr: "Tüm yazılar",
    nl: "Alle artikelen",
    ja: "すべての記事",
    ko: "전체 글 보기",
    sv: "Alla artiklar",
    da: "Alle artikler",
    no: "Alle artikler",
    fi: "Kaikki artikkelit",
  } satisfies Localized,

  mainGuideLabel: {
    it: "Guida principale",
    en: "Main guide",
    es: "Guía principal",
    de: "Hauptratgeber",
    pt: "Guia principal",
    fr: "Guide principal",
    pl: "Główny poradnik",
    tr: "Ana rehber",
    nl: "Hoofdgids",
    ja: "メインガイド",
    ko: "대표 가이드",
    sv: "Huvudguide",
    da: "Hovedguide",
    no: "Hovedguide",
    fi: "Pääopas",
  } satisfies Localized,

  guideLabel: {
    it: "Guida",
    en: "Guide",
    es: "Guía",
    de: "Ratgeber",
    pt: "Guia",
    fr: "Guide",
    pl: "Poradnik",
    tr: "Rehber",
    nl: "Gids",
    ja: "ガイド",
    ko: "가이드",
    sv: "Guide",
    da: "Guide",
    no: "Guide",
    fi: "Opas",
  } satisfies Localized,

  readLabel: {
    it: "Leggi",
    en: "Read",
    es: "Leer",
    de: "Lesen",
    pt: "Ler",
    fr: "Lire",
    pl: "Czytaj",
    tr: "Oku",
    nl: "Lezen",
    ja: "読む",
    ko: "읽기",
    sv: "Läs",
    da: "Læs",
    no: "Les",
    fi: "Lue",
  } satisfies Localized,

} as const;
