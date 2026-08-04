import type { Locale } from "@/lib/i18n";

export type Faq = { q: string; a: string };

const FAQ_IT: Faq[] = [
  {
    q: "L'app non mostra dati. Cosa devo fare?",
    a: "Verifica nell'ordine: (1) Health Connect è installato dal Play Store? (2) Hai concesso il permesso «Lettura dati in background» dentro Health Connect? (3) Premi «Sincronizza Ora» nelle impostazioni. Se persiste, scrivici allegando uno screenshot del pannello «Stato».",
  },
  { q: "Quanto consuma di batteria?", a: "Consumo ridotto. Su Android, se disattivi l'ottimizzazione batteria, la sincronizzazione in background avviene indicativamente ogni 15-30 minuti (best-effort: il produttore del telefono può comunque ritardarla o saltarla). Su iOS non c'è sync in background oggi: solo quando apri l'app. Se vedi consumi anomali, probabilmente Health Connect stesso sta indicizzando, non FitMesh Sync." },
  { q: "Funziona offline?", a: "L'app raccoglie e mette in coda i dati anche senza rete. Appena torni online, sincronizza automaticamente tutto l'arretrato. La dashboard web invece richiede connessione internet attiva." },
  { q: "Posso usare un server privato?", a: "Non ancora come servizio supportato. Il self-hosting esiste a livello tecnico nell'app, ma oggi resta un uso interno/tecnico: non è un percorso self-service per gli utenti. Stato aggiornato su fitmesh.fit/self-host." },
  { q: "Quanto costa FitMesh Sync?", a: "€3,99 su Android · €4,99 su iPhone (prezzo di riferimento in euro; fuori dall'area euro vale il prezzo mostrato dal tuo store): acquisto unico, niente abbonamento, niente rinnovi automatici, niente sorprese in fattura." },
  { q: "Ho cambiato telefono. Perdo i miei dati?", a: "No. I dati sono sul server, non sul telefono. Reinstalla l'app, fai login (o inserisci il tuo device ID precedente nelle impostazioni se hai un account avanzato) e ritrovi tutto." },
  { q: "Supporto iOS?", a: "Sì: l'app iOS è disponibile su App Store in tutti i 27 Paesi dell'Unione Europea, oltre che negli altri store supportati, con un'app Flutter nativa che integra Apple HealthKit per leggere i tuoi dati." },
];

const FAQ_EN: Faq[] = [
  {
    q: "The app shows no data. What do I do?",
    a: "Check in order: (1) Is Health Connect installed from the Play Store? (2) Did you grant «Read data in background» permission inside Health Connect? (3) Tap «Sync now» in settings. If the issue persists, email us with a screenshot of the «Status» panel.",
  },
  { q: "How much battery does it use?", a: "Battery use is minimal. On Android, if you disable battery optimization, background sync happens roughly every 15-30 minutes (best-effort: your phone manufacturer can still delay or skip it). On iOS there's no background sync today: only when you open the app. If you see abnormal drain, Health Connect itself is likely indexing, not FitMesh Sync." },
  { q: "Does it work offline?", a: "The app collects and queues data even without network. As soon as you're back online, it syncs all the backlog automatically. The web dashboard, however, requires an active internet connection." },
  { q: "Can I have my own private server?", a: "Not yet as a supported service. Self-hosting exists at a technical level in the app, but today it's limited to internal/technical use — it isn't a self-service path for users. Current status at fitmesh.fit/self-host." },
  { q: "How much does FitMesh Sync cost?", a: "€3.99 on Android · €4.99 on iPhone (reference price in euros; outside the eurozone your store shows its own localized price): one-time purchase, no subscription, no auto-renewals, no billing surprises." },
  { q: "I switched phones. Do I lose my data?", a: "No. Data is on the server, not the phone. Reinstall the app, log in (or enter your previous device ID in settings if you have an advanced account) and you get everything back." },
  { q: "iOS support?", a: "Yes: the iOS app is available on the App Store in all 27 European Union countries, as well as other supported storefronts, built as a native Flutter app with HealthKit integration to read your data." },
];

const FAQ_ES: Faq[] = [
  {
    q: "La app no muestra datos. ¿Qué hago?",
    a: "Verifica en este orden: (1) ¿Tienes Health Connect instalado desde Google Play? (2) ¿Concediste el permiso «Leer datos en segundo plano» dentro de Health Connect? (3) Pulsa «Sincronizar ahora» en los ajustes. Si el problema persiste, escríbenos adjuntando una captura de pantalla del panel «Estado».",
  },
  { q: "¿Cuánta batería consume?", a: "Consumo reducido. En Android, si desactivas la optimización de batería, la sincronización en segundo plano ocurre aproximadamente cada 15-30 minutos (best-effort: el fabricante de tu teléfono puede retrasarla o saltársela). En iOS no hay sincronización en segundo plano hoy: solo al abrir la app. Si ves un consumo anormal, lo más probable es que sea Health Connect indexando datos, no FitMesh Sync." },
  { q: "¿Funciona sin conexión?", a: "La app recopila y pone en cola los datos aunque no tengas red. En cuanto recuperas la conexión, sincroniza todo el historial acumulado de forma automática. El panel web, en cambio, requiere conexión a internet activa." },
  { q: "¿Puedo usar un servidor privado?", a: "Todavía no como servicio compatible. El self-hosting existe a nivel técnico en la app, pero hoy está limitado a uso interno/técnico: no es un camino de autoservicio para los usuarios. Estado actualizado en fitmesh.fit/self-host." },
  { q: "¿Cuánto cuesta FitMesh Sync?", a: "3,99 € en Android · 4,99 € en iPhone (precio de referencia en euros; fuera de la eurozona tu tienda muestra su propio precio localizado): pago único, sin suscripción, sin renovaciones automáticas, sin sorpresas en la factura." },
  { q: "Cambié de teléfono. ¿Pierdo mis datos?", a: "No. Los datos están en el servidor, no en el teléfono. Reinstala la app, inicia sesión (o introduce tu ID de dispositivo anterior en los ajustes si tienes una cuenta avanzada) y recuperas todo." },
  { q: "¿Habrá soporte para iOS?", a: "Sí: la app iOS está disponible en el App Store en los 27 países de la Unión Europea, además de en el resto de tiendas compatibles, con una app Flutter nativa que se integra con Apple HealthKit para leer tus datos." },
];

const FAQ_DE: Faq[] = [
  {
    q: "Die App zeigt keine Daten an. Was soll ich tun?",
    a: "Prüfe der Reihe nach: (1) Ist Health Connect aus dem Play Store installiert? (2) Hast du in Health Connect die Berechtigung «Daten im Hintergrund lesen» erteilt? (3) Tippe in den Einstellungen auf «Jetzt synchronisieren». Wenn das Problem weiterhin besteht, schreib uns mit einem Screenshot des Bereichs «Status».",
  },
  { q: "Wie viel Akku verbraucht die App?", a: "Geringer Verbrauch. Auf Android erfolgt die Hintergrundsynchronisierung, wenn du die Akkuoptimierung deaktivierst, etwa alle 15-30 Minuten (best-effort: der Hersteller deines Telefons kann sie trotzdem verzögern oder auslassen). Auf iOS gibt es heute keine Hintergrundsynchronisierung: nur beim Öffnen der App. Wenn du einen ungewöhnlich hohen Verbrauch siehst, indiziert wahrscheinlich Health Connect selbst Daten, nicht FitMesh Sync." },
  { q: "Funktioniert die App offline?", a: "Die App erfasst und speichert Daten auch ohne Netzwerkverbindung in einer Warteschlange. Sobald du wieder online bist, synchronisiert sie den gesamten Rückstand automatisch. Das Web-Dashboard benötigt hingegen eine aktive Internetverbindung." },
  { q: "Kann ich einen eigenen privaten Server nutzen?", a: "Noch nicht als unterstützter Dienst. Self-Hosting existiert technisch in der App, ist heute aber auf internen/technischen Gebrauch beschränkt — kein Self-Service-Weg für Nutzer. Aktueller Status unter fitmesh.fit/self-host." },
  { q: "Was kostet FitMesh Sync?", a: "3,99 € auf Android · 4,99 € auf iPhone (Referenzpreis in Euro; außerhalb der Eurozone zeigt dein Store seinen eigenen lokalisierten Preis): Einmalkauf, kein Abonnement, keine automatischen Verlängerungen, keine Überraschungen auf der Rechnung." },
  { q: "Ich habe mein Telefon gewechselt. Verliere ich meine Daten?", a: "Nein. Die Daten liegen auf dem Server, nicht auf dem Gerät. Installiere die App neu, melde dich an (oder gib in den Einstellungen deine vorherige Geräte-ID ein, falls du ein erweitertes Konto hast) und du findest alles wieder." },
  { q: "Gibt es iOS-Unterstützung?", a: "Ja: Die iOS-App ist im App Store in allen 27 Ländern der Europäischen Union sowie in den weiteren unterstützten Stores verfügbar, als native Flutter-App mit HealthKit-Integration zum Lesen deiner Daten." },
];

const FAQ_PT: Faq[] = [
  {
    q: "O app não mostra dados. O que faço?",
    a: "Verifique nesta ordem: (1) O Health Connect está instalado pela Google Play? (2) Você concedeu a permissão «Ler dados em segundo plano» dentro do Health Connect? (3) Toque em «Sincronizar agora» nas configurações. Se o problema persistir, entre em contato conosco enviando uma captura de tela do painel «Status».",
  },
  { q: "Quanto de bateria o app consome?", a: "Consumo reduzido. No Android, se você desativar a otimização de bateria, a sincronização em segundo plano acontece a cada 15-30 minutos aproximadamente (best-effort: o fabricante do seu telefone ainda pode atrasá-la ou pulá-la). No iOS não há sincronização em segundo plano hoje: só quando você abre o app. Se você notar um consumo anormal, provavelmente é o próprio Health Connect indexando dados, não o FitMesh Sync." },
  { q: "Funciona sem conexão?", a: "O app coleta e coloca os dados em fila mesmo sem rede. Assim que você voltar a ficar online, ele sincroniza todo o histórico acumulado automaticamente. O painel web, no entanto, requer uma conexão ativa com a internet." },
  { q: "Posso usar um servidor privado?", a: "Ainda não como serviço suportado. O self-hosting existe a nível técnico no app, mas hoje está limitado a uso interno/técnico: não é um caminho self-service para os usuários. Status atualizado em fitmesh.fit/self-host." },
  { q: "Quanto custa o FitMesh Sync?", a: "€3,99 no Android · €4,99 no iPhone (preço de referência em euros; fora da zona do euro sua loja mostra o preço localizado dela): compra única, sem assinatura, sem renovações automáticas, sem surpresas na fatura." },
  { q: "Troquei de celular. Perco meus dados?", a: "Não. Os dados estão no servidor, não no celular. Reinstale o app, faça login (ou insira seu ID de dispositivo anterior nas configurações se você tiver uma conta avançada) e encontrará tudo de volta." },
  { q: "Haverá suporte para iOS?", a: "Sim: o app iOS está disponível na App Store nos 27 países da União Europeia, além das demais lojas compatíveis, como um app Flutter nativo com integração ao Apple HealthKit para ler seus dados." },
];

const FAQ_FR: Faq[] = [
  {
    q: "L'application n'affiche aucune donnée. Que faire ?",
    a: "Vérifiez dans cet ordre : (1) Health Connect est-il installé depuis le Play Store ? (2) Avez-vous accordé l'autorisation «Lire les données en arrière-plan» dans Health Connect ? (3) Appuyez sur «Synchroniser maintenant» dans les paramètres. Si le problème persiste, écrivez-nous en joignant une capture d'écran du panneau «Statut».",
  },
  { q: "Quelle est la consommation de batterie ?", a: "Consommation réduite. Sur Android, si vous désactivez l'optimisation de la batterie, la synchronisation en arrière-plan a lieu environ toutes les 15 à 30 minutes (best-effort : le fabricant de votre téléphone peut tout de même la retarder ou la sauter). Sur iOS, il n'y a pas de synchronisation en arrière-plan aujourd'hui : seulement à l'ouverture de l'application. Si vous constatez une consommation anormale, c'est probablement Health Connect lui-même qui indexe des données, et non FitMesh Sync." },
  { q: "L'application fonctionne-t-elle hors ligne ?", a: "L'application collecte et met en file d'attente les données même sans réseau. Dès que vous êtes de nouveau connecté, elle synchronise automatiquement tout l'arriéré. Le tableau de bord web, en revanche, nécessite une connexion internet active." },
  { q: "Puis-je utiliser un serveur privé ?", a: "Pas encore en tant que service pris en charge. L'auto-hébergement existe techniquement dans l'app, mais reste aujourd'hui un usage interne/technique : ce n'est pas un parcours en libre-service pour les utilisateurs. État actualisé sur fitmesh.fit/self-host." },
  { q: "Combien coûte FitMesh Sync ?", a: "3,99 € sur Android · 4,99 € sur iPhone (prix de référence en euros ; hors zone euro, votre boutique affiche son propre prix localisé) : achat unique, sans abonnement, sans renouvellements automatiques, sans mauvaises surprises sur la facture." },
  { q: "J'ai changé de téléphone. Vais-je perdre mes données ?", a: "Non. Les données sont sur le serveur, pas sur le téléphone. Réinstallez l'application, connectez-vous (ou saisissez votre identifiant d'appareil précédent dans les paramètres si vous avez un compte avancé) et vous retrouvez tout." },
  { q: "Y aura-t-il une prise en charge iOS ?", a: "Oui : l'application iOS est disponible sur l'App Store dans les 27 pays de l'Union européenne, ainsi que dans les autres boutiques prises en charge, sous la forme d'une application Flutter native intégrant Apple HealthKit pour lire vos données." },
];

const FAQ_NL: Faq[] = [
  {
    q: "De app toont geen gegevens. Wat moet ik doen?",
    a: "Controleer in volgorde: (1) Is Health Connect vanuit de Play Store geïnstalleerd? (2) Heeft u de toestemming «Gegevens op de achtergrond lezen» ingeschakeld binnen Health Connect? (3) Tik op «Nu synchroniseren» in de instellingen. Als het probleem aanhoudt, neem dan contact met ons op met een schermafbeelding van het paneel «Status».",
  },
  { q: "Hoeveel batterij verbruikt de app?", a: "Beperkt verbruik. Op Android vindt achtergrondsynchronisatie, als u batterijoptimalisatie uitschakelt, ongeveer elke 15-30 minuten plaats (best-effort: de fabrikant van uw telefoon kan dit alsnog vertragen of overslaan). Op iOS is er vandaag geen achtergrondsynchronisatie: alleen wanneer u de app opent. Als je ongewoon verbruik ziet, is het waarschijnlijk Health Connect zelf dat aan het indexeren is, niet FitMesh Sync." },
  { q: "Werkt de app offline?", a: "De app verzamelt en zet gegevens in de wachtrij, ook zonder netwerk. Zodra u weer online bent, synchroniseert de app automatisch alles wat er in de tussentijd is opgebouwd. Het webdashboard vereist echter een actieve internetverbinding." },
  { q: "Kan ik een eigen privéserver gebruiken?", a: "Nog niet als ondersteunde dienst. Self-hosting bestaat technisch gezien in de app, maar is vandaag beperkt tot intern/technisch gebruik — geen self-service-pad voor gebruikers. Actuele status op fitmesh.fit/self-host." },
  { q: "Hoeveel kost FitMesh Sync?", a: "€3,99 op Android · €4,99 op iPhone (referentieprijs in euro's; buiten de eurozone toont uw store de eigen gelokaliseerde prijs): eenmalige aankoop, geen abonnement, geen automatische verlengingen, geen verrassingen op de factuur." },
  { q: "Ik heb van telefoon gewisseld. Verlies ik mijn gegevens?", a: "Nee. De gegevens staan op de server, niet op de telefoon. Installeer de app opnieuw, log in (of voer uw vorige apparaat-ID in de instellingen in als u een geavanceerd account heeft) en u krijgt alles terug." },
  { q: "iOS-ondersteuning?", a: "Ja: de iOS-app is beschikbaar in de App Store in alle 27 landen van de Europese Unie, en ook in de overige ondersteunde stores, als een native Flutter-app met HealthKit-integratie om uw gegevens te lezen." },
];

const FAQ_JA: Faq[] = [
  {
    q: "アプリにデータが表示されません。どうすればよいですか？",
    a: "次の順で確認してください：(1) Play StoreからHealth Connectをインストールしていますか？ (2) Health Connect内で「バックグラウンドでのデータ読み取り」の権限を許可していますか？ (3) 設定内の「今すぐ同期」をタップしてください。問題が解決しない場合は、「ステータス」パネルのスクリーンショットを添付してご連絡ください。",
  },
  { q: "バッテリーの消費量はどれくらいですか？", a: "消費は少なめです。Androidでは、バッテリー最適化の対象外に設定すると、目安として15〜30分ごとにバックグラウンドで同期されます（メーカーの省電力機能により遅延・スキップされることがあります）。iOSでは現時点でバックグラウンド同期はなく、アプリを開いたときのみ同期します。異常な消耗にお気づきの場合は、FitMesh SyncではなくHealth Connect自体がバックグラウンドでインデックス処理をしている可能性が高いです。" },
  { q: "オフラインでも動作しますか？", a: "アプリはネットワークなしでもデータを収集してキューに保存します。オンラインに戻った瞬間、溜まっていた分をすべて自動的に同期します。Webダッシュボードはアクティブなインターネット接続が必要です。" },
  { q: "プライベートサーバーを使用できますか？", a: "現在はサポート対象のサービスとしては提供していません。セルフホスティング機能はアプリ内に技術的に存在しますが、現時点では社内・技術検証用途に限定されており、ユーザー向けのセルフサービス機能ではありません。最新状況はfitmesh.fit/self-hostをご覧ください。" },
  { q: "FitMesh Syncの価格は？", a: "Android €3.99 · iPhone €4.99（ユーロ建ての参考価格。ユーロ圏外ではご利用のストアに表示される現地価格が適用されます）：買い切りプラン、サブスクリプションなし、自動更新なし、請求の驚きなし。" },
  { q: "機種変更しました。データは失われますか？", a: "いいえ。データはサーバーに保存されており、端末には保存されていません。アプリを再インストールしてログインするか（高度なアカウントをお持ちの場合は、設定に以前のデバイスIDを入力してください）、すべてのデータが元に戻ります。" },
  { q: "iOSのサポートは？", a: "はい。iOSアプリは欧州連合（EU）加盟27カ国すべてを含む対応App Storeで提供されており、Apple HealthKitと連携するネイティブFlutterアプリです。" },
];

const FAQ_KO: Faq[] = [
  {
    q: "앱에 데이터가 표시되지 않습니다. 어떻게 해야 하나요?",
    a: "다음 순서로 확인해 주세요: (1) Play 스토어에서 Health Connect를 설치하셨나요? (2) Health Connect 내에서 「백그라운드 데이터 읽기」 권한을 허용하셨나요? (3) 설정에서 「지금 동기화」를 탭해 주세요. 문제가 계속되면 「상태」 패널의 스크린샷을 첨부하여 이메일로 문의해 주세요.",
  },
  { q: "배터리 사용량은 얼마나 되나요?", a: "배터리 사용량은 적은 편입니다. Android에서는 배터리 최적화 제외로 설정하면 대략 15~30분 간격으로 백그라운드 동기화가 이루어집니다(제조사의 절전 기능에 따라 지연되거나 건너뛸 수 있습니다). iOS에서는 현재 백그라운드 동기화가 없으며 앱을 열었을 때만 동기화됩니다. 비정상적인 소모가 보인다면, FitMesh Sync가 아니라 Health Connect 자체가 백그라운드에서 인덱싱하고 있을 가능성이 높습니다." },
  { q: "오프라인에서도 작동하나요?", a: "앱은 네트워크 없이도 데이터를 수집하여 대기열에 저장합니다. 다시 온라인이 되면 쌓인 데이터를 자동으로 모두 동기화합니다. 웹 대시보드는 인터넷 연결이 필요합니다." },
  { q: "프라이빗 서버를 사용할 수 있나요?", a: "아직 지원되는 서비스로 제공되지 않습니다. 셀프 호스팅 기능은 앱 내에 기술적으로 존재하지만, 현재는 내부/기술 검증 용도로 제한되어 있으며 사용자를 위한 셀프 서비스 경로가 아닙니다. 최신 상태는 fitmesh.fit/self-host에서 확인하세요." },
  { q: "FitMesh Sync 가격은 얼마인가요?", a: "Android €3.99 · iPhone €4.99(유로 기준 참고 가격이며, 유로존 외 지역에서는 스토어에 표시되는 현지 가격이 적용됩니다): 일회성 구매, 구독 없음, 자동 갱신 없음, 청구 시 예상치 못한 요금 없음." },
  { q: "휴대폰을 바꿨습니다. 데이터가 사라지나요?", a: "아니요. 데이터는 서버에 저장되어 있으며 휴대폰에는 없습니다. 앱을 재설치하고 로그인하거나(고급 계정의 경우 설정에서 이전 기기 ID를 입력하시면) 모든 데이터를 되찾을 수 있습니다." },
  { q: "iOS 지원은요?", a: "네, iOS 앱은 유럽연합(EU) 회원국 27개국을 포함한 지원되는 App Store에서 이용 가능하며, Apple HealthKit과 연동되는 네이티브 Flutter 앱입니다." },
];

// pl and tr inherit Italian; sv/da/no/fi inherit English for now (Nordic FAQ
// translation is a fast-follow), like the rest of the support page.
export const SUPPORT_FAQS: Record<Locale, Faq[]> = {
  it: FAQ_IT,
  en: FAQ_EN,
  es: FAQ_ES,
  de: FAQ_DE,
  pt: FAQ_PT,
  fr: FAQ_FR,
  pl: FAQ_IT,
  tr: FAQ_IT,
  nl: FAQ_NL,
  ja: FAQ_JA,
  ko: FAQ_KO,
  sv: FAQ_EN,
  da: FAQ_EN,
  no: FAQ_EN,
  fi: FAQ_EN,
};
