import type { Locale } from "@/lib/i18n";

export type Faq = { q: string; a: string };

const FAQ_IT: Faq[] = [
  {
    q: "L'app non mostra dati. Cosa devo fare?",
    a: "Verifica nell'ordine: (1) Su Android 14 o successivo Connessione Salute si trova nelle impostazioni di sistema (Sicurezza e privacy); su Android 9-13 serve l'app dal Play Store. (2) Assicurati che l'app del tuo dispositivo scriva i dati e che FitMesh Sync abbia le autorizzazioni di lettura in Connessione Salute. (3) Premi «Sincronizza ora» nella schermata principale. (4) Tocca «Diagnostica» per verificare il Centro Sincronizzazione. Se persiste, scrivici a support@fitmesh.fit.",
  },
  { q: "Quanto consuma di batteria?", a: "Consumo ridotto. Su Android, se disattivi l'ottimizzazione batteria, la sincronizzazione in background avviene indicativamente ogni 15-30 minuti (best-effort: il produttore del telefono può comunque ritardarla o saltarla). Su iOS non c'è sync in background oggi: solo quando apri l'app. Se vedi consumi anomali, probabilmente Health Connect stesso sta indicizzando, non FitMesh Sync." },
  { q: "Funziona offline?", a: "L'app raccoglie e mette in coda i dati anche senza rete. Appena torni online, sincronizza automaticamente tutto l'arretrato." },
  { q: "Posso usare un server privato?", a: "Non ancora come servizio supportato. Il self-hosting esiste a livello tecnico nell'app, ma oggi resta un uso interno/tecnico: non è un percorso self-service per gli utenti. Stato aggiornato su fitmesh.fit/self-host." },
  { q: "Quanto costa FitMesh Sync?", a: "I nuovi account possono provare FitMesh Pro gratis per 14 giorni. Dopo la prova, per continuare a sincronizzare serve un acquisto a vita o un abbonamento ogni 6 mesi. Esportare i dati in formato JSON e richiedere la cancellazione dell'account non richiede un acquisto." },
  { q: "Ho cambiato telefono. Perdo i miei dati?", a: "Se accedi con lo stesso account, ritrovi i dati che il telefono precedente aveva già sincronizzato, negli ultimi periodi che l'app mostra; servono una connessione e un accesso attivo (prova o Pro). Tra ciò che non passa al nuovo telefono: gli allenamenti registrati con l'app, l'abbinamento dell'anello, i collegamenti ai servizi esterni e i giorni che non erano stati sincronizzati." },
  { q: "Supporto iOS?", a: "Sì: l'app iOS è disponibile su App Store in tutti i 27 Paesi dell'Unione Europea, oltre che negli altri store supportati, con un'app Flutter nativa che integra Apple HealthKit per leggere i tuoi dati." },
];

const FAQ_EN: Faq[] = [
  {
    q: "The app shows no data. What do I do?",
    a: "Check in order: (1) On Android 14 or newer, Health Connect is built into system settings (Security & privacy); on Android 9-13, install the app from Google Play. (2) Ensure your wearable app writes data and FitMesh Sync has read permissions in Health Connect. (3) Tap «Sync now» on the home screen. (4) Tap «Diagnostica» to inspect the Sync Center. If it persists, email us at support@fitmesh.fit.",
  },
  { q: "How much battery does it use?", a: "Battery use is minimal. On Android, if you disable battery optimization, background sync happens roughly every 15-30 minutes (best-effort: your phone manufacturer can still delay or skip it). On iOS there's no background sync today: only when you open the app. If you see abnormal drain, Health Connect itself is likely indexing, not FitMesh Sync." },
  { q: "Does it work offline?", a: "The app collects and queues data even without network. As soon as you're back online, it syncs all the backlog automatically." },
  { q: "Can I have my own private server?", a: "Not yet as a supported service. Self-hosting exists at a technical level in the app, but today it's limited to internal/technical use — it isn't a self-service path for users. Current status at fitmesh.fit/self-host." },
  { q: "How much does FitMesh Sync cost?", a: "New accounts can try FitMesh Pro free for 14 days. After the trial, continuing to sync requires a lifetime purchase or a 6-month subscription. Exporting your data as JSON and requesting account deletion do not require a purchase." },
  { q: "I switched phones. Do I lose my data?", a: "If you sign in with the same account, you will see the data your previous phone had already synced, for the recent periods the app shows; this needs a connection and active access (trial or Pro). Among the things that do not move to the new phone: app-recorded workouts, ring pairing, external service connections and days that were not synced." },
  { q: "iOS support?", a: "Yes: the iOS app is available on the App Store in all 27 European Union countries, as well as other supported storefronts, built as a native Flutter app with HealthKit integration to read your data." },
];

const FAQ_ES: Faq[] = [
  {
    q: "La app no muestra datos. ¿Qué hago?",
    a: "Verifica en este orden: (1) ¿Tienes Health Connect instalado desde Google Play? (2) ¿Concediste el permiso «Leer datos en segundo plano» dentro de Health Connect? (3) Pulsa «Sincronizar ahora» en los ajustes. Si el problema persiste, escríbenos adjuntando una captura de pantalla del panel «Estado».",
  },
  { q: "¿Cuánta batería consume?", a: "Consumo reducido. En Android, si desactivas la optimización de batería, la sincronización en segundo plano ocurre aproximadamente cada 15-30 minutos (best-effort: el fabricante de tu teléfono puede retrasarla o saltársela). En iOS no hay sincronización en segundo plano hoy: solo al abrir la app. Si ves un consumo anormal, lo más probable es que sea Health Connect indexando datos, no FitMesh Sync." },
  { q: "¿Funciona sin conexión?", a: "La app recopila y pone en cola los datos aunque no tengas red. En cuanto recuperas la conexión, sincroniza todo el historial acumulado de forma automática." },
  { q: "¿Puedo usar un servidor privado?", a: "Todavía no como servicio compatible. El self-hosting existe a nivel técnico en la app, pero hoy está limitado a uso interno/técnico: no es un camino de autoservicio para los usuarios. Estado actualizado en fitmesh.fit/self-host." },
  { q: "¿Cuánto cuesta FitMesh Sync?", a: "La app se descarga gratis e incluye 14 días de prueba de FitMesh Pro. Al terminar la prueba, para seguir usando las funciones Pro se necesita una compra o una suscripción. Consulta los precios y las opciones disponibles en la app según tu tienda." },
  { q: "Cambié de teléfono. ¿Pierdo mis datos?", a: "Si inicias sesión con la misma cuenta, verás los datos que tu teléfono anterior ya había sincronizado, para los períodos recientes que muestra la app; esto requiere conexión y un acceso activo (prueba o Pro). Entre las cosas que no pasan al nuevo teléfono: entrenamientos registrados con la app, vinculación del anillo, conexiones con servicios externos y días que no se sincronizaron." },
  { q: "¿Habrá soporte para iOS?", a: "Sí: la app iOS está disponible en el App Store en los 27 países de la Unión Europea, además de en el resto de tiendas compatibles, con una app Flutter nativa que se integra con Apple HealthKit para leer tus datos." },
];

const FAQ_DE: Faq[] = [
  {
    q: "Die App zeigt keine Daten an. Was soll ich tun?",
    a: "Prüfe der Reihe nach: (1) Ist Health Connect aus dem Play Store installiert? (2) Hast du in Health Connect die Berechtigung «Daten im Hintergrund lesen» erteilt? (3) Tippe in den Einstellungen auf «Jetzt synchronisieren». Wenn das Problem weiterhin besteht, schreib uns mit einem Screenshot des Bereichs «Status».",
  },
  { q: "Wie viel Akku verbraucht die App?", a: "Geringer Verbrauch. Auf Android erfolgt die Hintergrundsynchronisierung, wenn du die Akkuoptimierung deaktivierst, etwa alle 15-30 Minuten (best-effort: der Hersteller deines Telefons kann sie trotzdem verzögern oder auslassen). Auf iOS gibt es heute keine Hintergrundsynchronisierung: nur beim Öffnen der App. Wenn du einen ungewöhnlich hohen Verbrauch siehst, indiziert wahrscheinlich Health Connect selbst Daten, nicht FitMesh Sync." },
  { q: "Funktioniert die App offline?", a: "Die App erfasst und speichert Daten auch ohne Netzwerkverbindung in einer Warteschlange. Sobald du wieder online bist, synchronisiert sie den gesamten Rückstand automatisch." },
  { q: "Kann ich einen eigenen privaten Server nutzen?", a: "Noch nicht als unterstützter Dienst. Self-Hosting existiert technisch in der App, ist heute aber auf internen/technischen Gebrauch beschränkt — kein Self-Service-Weg für Nutzer. Aktueller Status unter fitmesh.fit/self-host." },
  { q: "Was kostet FitMesh Sync?", a: "Die App kann kostenlos heruntergeladen werden und enthält eine 14-tägige Testphase für FitMesh Pro. Nach Ablauf der Testphase ist für die weitere Nutzung der Pro-Funktionen ein Kauf oder ein Abonnement erforderlich. Sieh dir die Preise und Optionen in der App gemäß deinem Store an." },
  { q: "Ich habe mein Telefon gewechselt. Verliere ich meine Daten?", a: "Wenn du dich mit demselben Konto anmeldest, siehst du die Daten, die dein vorheriges Smartphone bereits synchronisiert hatte, für die aktuellen Zeiträume, die die App anzeigt; dies erfordert eine Verbindung und einen aktiven Zugang (Testphase oder Pro). Zu den Dingen, die nicht auf das neue Smartphone übertragen werden, gehören: mit der App aufgezeichnete Trainings, Ring-Kopplung, Verbindungen zu externen Diensten und Tage, die nicht synchronisiert wurden." },
  { q: "Gibt es iOS-Unterstützung?", a: "Ja: Die iOS-App ist im App Store in allen 27 Ländern der Europäischen Union sowie in den weiteren unterstützten Stores verfügbar, als native Flutter-App mit HealthKit-Integration zum Lesen deiner Daten." },
];

const FAQ_PT: Faq[] = [
  {
    q: "O app não mostra dados. O que faço?",
    a: "Verifique nesta ordem: (1) O Health Connect está instalado pela Google Play? (2) Você concedeu a permissão «Ler dados em segundo plano» dentro do Health Connect? (3) Toque em «Sincronizar agora» nas configurações. Se o problema persistir, entre em contato conosco enviando uma captura de tela do painel «Status».",
  },
  { q: "Quanto de bateria o app consome?", a: "Consumo reduzido. No Android, se você desativar a otimização de bateria, a sincronização em segundo plano acontece a cada 15-30 minutos aproximadamente (best-effort: o fabricante do seu telefone ainda pode atrasá-la ou pulá-la). No iOS não há sincronização em segundo plano hoje: só quando você abre o app. Se você notar um consumo anormal, provavelmente é o próprio Health Connect indexando dados, não o FitMesh Sync." },
  { q: "Funciona sem conexão?", a: "O app coleta e coloca os dados em fila mesmo sem rede. Assim que você voltar a ficar online, ele sincroniza todo o histórico acumulado automaticamente." },
  { q: "Posso usar um servidor privado?", a: "Ainda não como serviço suportado. O self-hosting existe a nível técnico no app, mas hoje está limitado a uso interno/técnico: não é um caminho self-service para os usuários. Status atualizado em fitmesh.fit/self-host." },
  { q: "Quanto custa o FitMesh Sync?", a: "A app pode ser descarregada gratuitamente e inclui 14 dias de teste do FitMesh Pro. No fim do teste, para continuar a usar as funcionalidades Pro é necessária uma compra ou assinatura. Consulta os preços e opções disponíveis na app segundo a tua loja." },
  { q: "Troquei de celular. Perco meus dados?", a: "Se iniciares sessão com a mesma conta, verás os dados que o teu telemóvel anterior já tinha sincronizado, para os períodos recentes exibidos pela app; isto requer ligação e acesso ativo (teste ou Pro). Entre as coisas que não transitam para o novo telemóvel: treinos gravados com a app, emparelhamento do anel, ligações a serviços externos e dias que não foram sincronizados." },
  { q: "Haverá suporte para iOS?", a: "Sim: o app iOS está disponível na App Store nos 27 países da União Europeia, além das demais lojas compatíveis, como um app Flutter nativo com integração ao Apple HealthKit para ler seus dados." },
];

const FAQ_FR: Faq[] = [
  {
    q: "L'application n'affiche aucune donnée. Que faire ?",
    a: "Vérifiez dans cet ordre : (1) Health Connect est-il installé depuis le Play Store ? (2) Avez-vous accordé l'autorisation «Lire les données en arrière-plan» dans Health Connect ? (3) Appuyez sur «Synchroniser maintenant» dans les paramètres. Si le problème persiste, écrivez-nous en joignant une capture d'écran du panneau «Statut».",
  },
  { q: "Quelle est la consommation de batterie ?", a: "Consommation réduite. Sur Android, si vous désactivez l'optimisation de la batterie, la synchronisation en arrière-plan a lieu environ toutes les 15 à 30 minutes (best-effort : le fabricant de votre téléphone peut tout de même la retarder ou la sauter). Sur iOS, il n'y a pas de synchronisation en arrière-plan aujourd'hui : seulement à l'ouverture de l'application. Si vous constatez une consommation anormale, c'est probablement Health Connect lui-même qui indexe des données, et non FitMesh Sync." },
  { q: "L'application fonctionne-t-elle hors ligne ?", a: "L'application collecte et met en file d'attente les données même sans réseau. Dès que vous êtes de nouveau connecté, elle synchronise automatiquement tout l'arriéré." },
  { q: "Puis-je utiliser un serveur privé ?", a: "Pas encore en tant que service pris en charge. L'auto-hébergement existe techniquement dans l'app, mais reste aujourd'hui un usage interne/technique : ce n'est pas un parcours en libre-service pour les utilisateurs. État actualisé sur fitmesh.fit/self-host." },
  { q: "Combien coûte FitMesh Sync ?", a: "L'application se télécharge gratuitement et inclut 14 jours d'essai de FitMesh Pro. À la fin de l'essai, continuer à utiliser les fonctionnalités Pro nécessite un achat ou un abonnement. Consultez les prix et les options disponibles dans l'application selon votre store." },
  { q: "J'ai changé de téléphone. Vais-je perdre mes données ?", a: "Si vous vous connectez avec le même compte, vous verrez les données que votre précédent téléphone avait déjà synchronisées, pour les périodes récentes affichées par l'application ; cela nécessite une connexion et un accès actif (essai ou Pro). Parmi les éléments qui ne sont pas transférés sur le nouveau téléphone : les entraînements enregistrés avec l'application, l'association de la bague, les connexions aux services tiers et les jours non synchronisés." },
  { q: "Y aura-t-il une prise en charge iOS ?", a: "Oui : l'application iOS est disponible sur l'App Store dans les 27 pays de l'Union européenne, ainsi que dans les autres boutiques prises en charge, sous la forme d'une application Flutter native intégrant Apple HealthKit pour lire vos données." },
];

const FAQ_NL: Faq[] = [
  {
    q: "De app toont geen gegevens. Wat moet ik doen?",
    a: "Controleer in volgorde: (1) Is Health Connect vanuit de Play Store geïnstalleerd? (2) Heeft u de toestemming «Gegevens op de achtergrond lezen» ingeschakeld binnen Health Connect? (3) Tik op «Nu synchroniseren» in de instellingen. Als het probleem aanhoudt, neem dan contact met ons op met een schermafbeelding van het paneel «Status».",
  },
  { q: "Hoeveel batterij verbruikt de app?", a: "Beperkt verbruik. Op Android vindt achtergrondsynchronisatie, als u batterijoptimalisatie uitschakelt, ongeveer elke 15-30 minuten plaats (best-effort: de fabrikant van uw telefoon kan dit alsnog vertragen of overslaan). Op iOS is er vandaag geen achtergrondsynchronisatie: alleen wanneer u de app opent. Als je ongewoon verbruik ziet, is het waarschijnlijk Health Connect zelf dat aan het indexeren is, niet FitMesh Sync." },
  { q: "Werkt de app offline?", a: "De app verzamelt en zet gegevens in de wachtrij, ook zonder netwerk. Zodra u weer online bent, synchroniseert de app automatisch alles wat er in de tussentijd is opgebouwd." },
  { q: "Kan ik een eigen privéserver gebruiken?", a: "Nog niet als ondersteunde dienst. Self-hosting bestaat technisch gezien in de app, maar is vandaag beperkt tot intern/technisch gebruik — geen self-service-pad voor gebruikers. Actuele status op fitmesh.fit/self-host." },
  { q: "Hoeveel kost FitMesh Sync?", a: "De app kan gratis worden gedownload en bevat een proefperiode van 14 dagen voor FitMesh Pro. Na de proefperiode is een aankoop of abonnement vereist om Pro-functies te blijven gebruiken. Bekijk de prijzen en beschikbare opties in de app volgens jouw store." },
  { q: "Ik heb van telefoon gewisseld. Verlies ik mijn gegevens?", a: "Als je inlogt met hetzelfde account, zie je de gegevens die je vorige telefoon al had gesynchroniseerd voor recente perioden; dit vereist verbinding en actieve toegang (proefperiode of Pro). Dingen die niet overgaan naar de nieuwe telefoon zijn onder meer: workouts opgenomen met de app, ringkoppeling, externe serviceverbindingen en niet-gesynchroniseerde dagen." },
  { q: "iOS-ondersteuning?", a: "Ja: de iOS-app is beschikbaar in de App Store in alle 27 landen van de Europese Unie, en ook in de overige ondersteunde stores, als een native Flutter-app met HealthKit-integratie om uw gegevens te lezen." },
];

const FAQ_JA: Faq[] = [
  {
    q: "アプリにデータが表示されません。どうすればよいですか？",
    a: "次の順で確認してください：(1) Play StoreからHealth Connectをインストールしていますか？ (2) Health Connect内で「バックグラウンドでのデータ読み取り」の権限を許可していますか？ (3) 設定内の「今すぐ同期」をタップしてください。問題が解決しない場合は、「ステータス」パネルのスクリーンショットを添付してご連絡ください。",
  },
  { q: "バッテリーの消費量はどれくらいですか？", a: "消費は少なめです。Androidでは、バッテリー最適化の対象外に設定すると、目安として15〜30分ごとにバックグラウンドで同期されます（メーカーの省電力機能により遅延・スキップされることがあります）。iOSでは現時点でバックグラウンド同期はなく、アプリを開いたときのみ同期します。異常な消耗にお気づきの場合は、FitMesh SyncではなくHealth Connect自体がバックグラウンドでインデックス処理をしている可能性が高いです。" },
  { q: "オフラインでも動作しますか？", a: "アプリはネットワークなしでもデータを収集してキューに保存します。オンラインに戻った瞬間、溜まっていた分をすべて自動的に同期します。" },
  { q: "プライベートサーバーを使用できますか？", a: "現在はサポート対象のサービスとしては提供していません。セルフホスティング機能はアプリ内に技術的に存在しますが、現時点では社内・技術検証用途に限定されており、ユーザー向けのセルフサービス機能ではありません。最新状況はfitmesh.fit/self-hostをご覧ください。" },
  { q: "FitMesh Syncの価格は？", a: "アプリは無料でダウンロードでき、14日間のFitMesh Proトライアルが含まれています。トライアル終了後、Pro機能を引き続き使用するには購入または定期購入が必要です。お使いのストアに応じたアプリ内の価格と利用可能なオプションをご確認ください。" },
  { q: "機種変更しました。データは失われますか？", a: "同じアカウントでログインすると、以前のスマートフォンがすでに同期していた直近のデータが表示されます。これには接続と有効なアクセス権（トライアルまたはPro）が必要です。新しいスマートフォンに引き継がれないものには、アプリで記録したワークアウト、リングのペアリング、外部サービス連携、未同期の日が含まれます。" },
  { q: "iOSのサポートは？", a: "はい。iOSアプリは欧州連合（EU）加盟27カ国すべてを含む対応App Storeで提供されており、Apple HealthKitと連携するネイティブFlutterアプリです。" },
];

const FAQ_KO: Faq[] = [
  {
    q: "앱에 데이터가 표시되지 않습니다. 어떻게 해야 하나요?",
    a: "다음 순서로 확인해 주세요: (1) Play 스토어에서 Health Connect를 설치하셨나요? (2) Health Connect 내에서 「백그라운드 데이터 읽기」 권한을 허용하셨나요? (3) 설정에서 「지금 동기화」를 탭해 주세요. 문제가 계속되면 「상태」 패널의 스크린샷을 첨부하여 이메일로 문의해 주세요.",
  },
  { q: "배터리 사용량은 얼마나 되나요?", a: "배터리 사용량은 적은 편입니다. Android에서는 배터리 최적화 제외로 설정하면 대략 15~30분 간격으로 백그라운드 동기화가 이루어집니다(제조사의 절전 기능에 따라 지연되거나 건너뛸 수 있습니다). iOS에서는 현재 백그라운드 동기화가 없으며 앱을 열었을 때만 동기화됩니다. 비정상적인 소모가 보인다면, FitMesh Sync가 아니라 Health Connect 자체가 백그라운드에서 인덱싱하고 있을 가능성이 높습니다." },
  { q: "오프라인에서도 작동하나요?", a: "앱은 네트워크 없이도 데이터를 수집하여 대기열에 저장합니다. 다시 온라인이 되면 쌓인 데이터를 자동으로 모두 동기화합니다." },
  { q: "프라이빗 서버를 사용할 수 있나요?", a: "아직 지원되는 서비스로 제공되지 않습니다. 셀프 호스팅 기능은 앱 내에 기술적으로 존재하지만, 현재는 내부/기술 검증 용도로 제한되어 있으며 사용자를 위한 셀프 서비스 경로가 아닙니다. 최신 상태는 fitmesh.fit/self-host에서 확인하세요." },
  { q: "FitMesh Sync 가격은 얼마인가요?", a: "앱은 무료로 다운로드할 수 있으며 14일간의 FitMesh Pro 체험이 포함되어 있습니다. 체험이 끝나면 Pro 기능을 계속 사용하기 위해 구매 또는 구독이 필요합니다. 해당 스토어에 따라 앱에서 가격과 이용 가능한 옵션을 확인하세요." },
  { q: "휴대폰을 바꿨습니다. 데이터가 사라지나요?", a: "동일한 계정으로 로그인하면 이전 휴대전화에서 이미 동기화했던 최근 기간의 데이터를 볼 수 있습니다. 여기에는 인터넷 연결과 활성 이용 권한(체험 또는 Pro)이 필요합니다. 새 휴대전화로 이전되지 않는 항목은 다음과 같습니다: 앱으로 기록한 운동, 링 페어링, 외부 서비스 연동, 동기화되지 않았던 날짜." },
  { q: "iOS 지원은요?", a: "네, iOS 앱은 유럽연합(EU) 회원국 27개국을 포함한 지원되는 App Store에서 이용 가능하며, Apple HealthKit과 연동되는 네이티브 Flutter 앱입니다." },
];

// S02 (02/10/2026): le FAQ di costo e cambio telefono (indici 4 e 5) hanno
// un testo nuovo solo in it/en (U-FAQ-01/02). Le lingue che ereditavano it
// (pl, tr) o en (sv, da, no, fi) NON ereditano piu' quelle due: nessun ripiego
// su un'altra lingua, la FAQ non si rende finche' manca il testo approvato
// (consegna linguistica TRANSLATE_NEEDED). Le altre FAQ restano come prima.
const CHANGED_FAQ_INDEXES = [4, 5];
const withoutChanged = (faqs: Faq[]): Faq[] =>
  faqs.filter((_, i) => !CHANGED_FAQ_INDEXES.includes(i));
const withChanged = (base: Faq[], q4: string, a4: string, q5: string, a5: string): Faq[] => [
  base[0],
  base[1],
  base[2],
  base[3],
  { q: q4, a: a4 },
  { q: q5, a: a5 },
  base[6],
];

export const SUPPORT_FAQS: Record<Locale, Faq[]> = {
  it: FAQ_IT,
  en: FAQ_EN,
  es: FAQ_ES,
  de: FAQ_DE,
  pt: FAQ_PT,
  fr: FAQ_FR,
  pl: withChanged(FAQ_IT, "Ile kosztuje FitMesh Sync?", "Aplikację można pobrać bezpłatnie i zawiera ona 14-dniowy okres próbny FitMesh Pro. Po zakończeniu okresu próbnego dalsze korzystanie z funkcji Pro wymaga zakupu lub subskrypcji. Sprawdź ceny i dostępne opcje w aplikacji zgodnie ze swoim sklepem.", "Zmieniłem telefon. Czy stracę swoje dane?", "Jeśli zalogujesz się na to samo konto, zobaczysz dane zsynchronizowane wcześniej przez poprzedni telefon w ostatnich okresach; wymaga to połączenia i aktywnego dostępu (okres próbny lub Pro). Elementy, które nie przechodzą na nowy telefon: treningi zarejestrowane w aplikacji, sparowanie pierścienia, połączenia z usługami zewnętrznymi i niezsynchronizowane dni."),
  tr: withChanged(FAQ_IT, "FitMesh Sync'in ücreti ne kadar?", "Uygulama ücretsiz indirilir ve 14 günlük FitMesh Pro deneme sürümünü içerir. Deneme süresi bittiğinde Pro özelliklerini kullanmaya devam etmek için satın alma veya abonelik gerekir. Mağazanıza göre uygulamadaki fiyatları ve seçenekleri inceleyin.", "Telefonumu değiştirdim. Verilerimi kaybeder miyim?", "Aynı hesapla giriş yaparsanız önceki telefonunuzun son dönemler için eşitlemiş olduğu verileri görürsünüz; bu bağlantı ve etkin erişim (deneme veya Pro) gerektirir. Yeni telefona aktarılmayanlar arasında: uygulama ile kaydedilen antrenmanlar, yüzük eşleştirmesi, harici servis bağlantıları ve eşitlenmemiş günler yer alır."),
  nl: FAQ_NL,
  ja: FAQ_JA,
  ko: FAQ_KO,
  sv: withChanged(FAQ_EN, "Vad kostar FitMesh Sync?", "Appen laddas ner gratis och inkluderar en 14-dagars provperiod av FitMesh Pro. Efter provperioden krävs ett köp eller en prenumeration för att fortsätta använda Pro-funktioner. Se priser och tillgängliga alternativ i appen enligt din butik.", "Jag har bytt telefon. Förlorar jag min data?", "Om du loggar in med samma konto ser du data som din tidigare telefon redan hade synkroniserat för de senaste perioderna; detta kräver anslutning och aktiv åtkomst (provperiod eller Pro). Saker som inte förs över till den nya telefonen inkluderar: träningspass registrerade med appen, ringkoppling, externa tjänsteanslutningar och icke-synkroniserade dagar."),
  da: withChanged(FAQ_EN, "Hvad koster FitMesh Sync?", "Appen kan downloades gratis og inkluderer en 14-dages prøveperiode på FitMesh Pro. Efter prøveperioden kræver fortsat brug af Pro-funktioner et køb eller et abonnement. Se priser og tilgængelige muligheder i appen i henhold til din butik.", "Jeg har skiftet telefon. Mister jeg mine data?", "Hvis du logger ind med samme konto, vil du se data, som din tidligere telefon allerede havde synkroniseret for de seneste perioder; dette kræver forbindelse og aktiv adgang (prøveperiode eller Pro). Ting, der ikke overføres til den nye telefon: træningspas optaget med appen, ringparring, eksterne serviceforbindelser og ikke-synkroniserede dage."),
  no: withChanged(FAQ_EN, "Hva koster FitMesh Sync?", "Appen kan lastes ned gratis og inkluderer en 14-dagers prøveperiode på FitMesh Pro. Etter prøveperioden kreves et kjøp eller et abonnement for å fortsette å bruke Pro-funksjoner. Se priser og tilgjengelige alternativer i appen i henhold til butikken din.", "Jeg har byttet telefon. Mister jeg dataene mine?", "Hvis du logger inn med samme konto, vil du se dataene som den forrige telefonen din allerede hadde synkronisert for de siste periodene; dette krever tilkobling og aktiv tilgang (prøveperiode eller Pro). Ting som ikke overføres til den nye telefonen inkluderer: treningsøkter registrert med appen, ringkobling, eksterne tjenestetilkoblinger og ikke-synkroniserte dager."),
  fi: withChanged(FAQ_EN, "Mitä FitMesh Sync maksaa?", "Sovellus ladataan ilmaiseksi ja se sisältää 14 päivän FitMesh Pro -kokeilujakson. Kokeilujakson päätyttyä Pro-ominaisuuksien käytön jatkaminen edellyttää ostoa tai tilausta. Tarkista hinnat ja saatavilla olevat vaihtoehdot sovelluksesta kauppasi mukaan.", "Vaihdoin puhelinta. Menetänkö tietoni?", "Jos kirjaudut sisään samalla tilillä, näet tiedot, jotka edellinen puhelimesi oli jo synkronoinut viimeaikaisilta jaksoilta; tämä vaatii yhteyden ja aktiivisen käyttöoikeuden (kokeilujakso tai Pro). Uuteen puhelimeen eivät siirry muun muassa: sovelluksella tallennetut harjoitukset, sormusparin muodostus, ulkoiset palveluyhteydet ja päivät, joita ei ollut synkronoitu."),
};
