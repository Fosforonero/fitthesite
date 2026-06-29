import type { Locale } from "@/lib/i18n";

export type Faq = { q: string; a: string };

const FAQ_IT: Faq[] = [
  {
    q: "L'app non mostra dati. Cosa devo fare?",
    a: "Verifica nell'ordine: (1) Health Connect è installato dal Play Store? (2) Hai concesso il permesso «Lettura dati in background» dentro Health Connect? (3) Premi «Sincronizza Ora» nelle impostazioni. Se persiste, scrivici allegando uno screenshot del pannello «Stato».",
  },
  { q: "Quanto consuma di batteria?", a: "Circa 1-2% al giorno con sync ogni 30 minuti. È sotto la soglia di rilevamento di Android come «app che drena la batteria». Se vedi consumi anomali, probabilmente Health Connect stesso sta indicizzando, non FitMesh Sync." },
  { q: "Funziona offline?", a: "L'app raccoglie e mette in coda i dati anche senza rete. Appena torni online, sincronizza automaticamente tutto l'arretrato. La dashboard web invece richiede connessione internet attiva." },
  { q: "Posso usare un server privato?", a: "Sì, su richiesta. Per esigenze enterprise (RSA, cliniche, studi medici, gruppi famiglia con dati segregati) configuriamo un server dedicato con il tuo dominio, backup gestiti e SLA dedicato. Scrivi a sales@fitmesh.fit indicando volume utenti previsto e requisiti di conservazione dati." },
  { q: "Quanto costa FitMesh Sync?", a: "€3,99 su Android · €4,99 su iPhone: acquisto unico, niente abbonamento, niente rinnovi automatici, niente sorprese in fattura." },
  { q: "Ho cambiato telefono. Perdo i miei dati?", a: "No. I dati sono sul server, non sul telefono. Reinstalla l'app, fai login (o inserisci il tuo device ID precedente nelle impostazioni se hai un account avanzato) e ritrovi tutto." },
  { q: "Supporto iOS?", a: "In sviluppo. iOS arriverà nel 2026 con la stessa architettura: app nativa SwiftUI che legge da Apple HealthKit. Iscriviti via hello@fitmesh.fit per essere avvisato." },
];

const FAQ_EN: Faq[] = [
  {
    q: "The app shows no data. What do I do?",
    a: "Check in order: (1) Is Health Connect installed from the Play Store? (2) Did you grant «Read data in background» permission inside Health Connect? (3) Tap «Sync now» in settings. If the issue persists, email us with a screenshot of the «Status» panel.",
  },
  { q: "How much battery does it use?", a: "About 1-2% per day with 30-minute sync intervals. Below Android's threshold for «battery draining apps». If you see abnormal drain, Health Connect itself is likely indexing, not FitMesh Sync." },
  { q: "Does it work offline?", a: "The app collects and queues data even without network. As soon as you're back online, it syncs all the backlog automatically. The web dashboard, however, requires an active internet connection." },
  { q: "Can I have my own private server?", a: "Yes, on request. For enterprise needs (nursing homes, clinics, medical practices, family groups with segregated data) we deploy a dedicated server with your domain, managed backups and a dedicated SLA. Email sales@fitmesh.fit with expected user volume and data retention requirements." },
  { q: "How much does FitMesh Sync cost?", a: "€3.99 on Android · €4.99 on iPhone: one-time purchase, no subscription, no auto-renewals, no billing surprises." },
  { q: "I switched phones. Do I lose my data?", a: "No. Data is on the server, not the phone. Reinstall the app, log in (or enter your previous device ID in settings if you have an advanced account) and you get everything back." },
  { q: "iOS support?", a: "In development. iOS will arrive in 2026 with the same architecture: native SwiftUI app reading from Apple HealthKit. Subscribe via hello@fitmesh.fit to be notified." },
];

const FAQ_ES: Faq[] = [
  {
    q: "La app no muestra datos. ¿Qué hago?",
    a: "Verifica en este orden: (1) ¿Tienes Health Connect instalado desde Google Play? (2) ¿Concediste el permiso «Leer datos en segundo plano» dentro de Health Connect? (3) Pulsa «Sincronizar ahora» en los ajustes. Si el problema persiste, escríbenos adjuntando una captura de pantalla del panel «Estado».",
  },
  { q: "¿Cuánta batería consume?", a: "Aproximadamente un 1-2% al día con sincronizaciones cada 30 minutos. Está por debajo del umbral que Android considera como apps que drenan la batería. Si ves un consumo anormal, lo más probable es que sea Health Connect indexando datos, no FitMesh Sync." },
  { q: "¿Funciona sin conexión?", a: "La app recopila y pone en cola los datos aunque no tengas red. En cuanto recuperas la conexión, sincroniza todo el historial acumulado de forma automática. El panel web, en cambio, requiere conexión a internet activa." },
  { q: "¿Puedo usar un servidor privado?", a: "Sí, bajo petición. Para necesidades empresariales (residencias, clínicas, consultorios, grupos familiares con datos segregados) configuramos un servidor dedicado con tu dominio, copias de seguridad gestionadas y un SLA dedicado. Escribe a sales@fitmesh.fit indicando el volumen de usuarios previsto y los requisitos de conservación de datos." },
  { q: "¿Cuánto cuesta FitMesh Sync?", a: "3,99 € en Android · 4,99 € en iPhone: pago único, sin suscripción, sin renovaciones automáticas, sin sorpresas en la factura." },
  { q: "Cambié de teléfono. ¿Pierdo mis datos?", a: "No. Los datos están en el servidor, no en el teléfono. Reinstala la app, inicia sesión (o introduce tu ID de dispositivo anterior en los ajustes si tienes una cuenta avanzada) y recuperas todo." },
  { q: "¿Habrá soporte para iOS?", a: "Está en desarrollo. iOS llegará en 2026 con la misma arquitectura: una app nativa SwiftUI que lee desde Apple HealthKit. Suscríbete en hello@fitmesh.fit para recibir un aviso." },
];

const FAQ_DE: Faq[] = [
  {
    q: "Die App zeigt keine Daten an. Was soll ich tun?",
    a: "Prüfe der Reihe nach: (1) Ist Health Connect aus dem Play Store installiert? (2) Hast du in Health Connect die Berechtigung «Daten im Hintergrund lesen» erteilt? (3) Tippe in den Einstellungen auf «Jetzt synchronisieren». Wenn das Problem weiterhin besteht, schreib uns mit einem Screenshot des Bereichs «Status».",
  },
  { q: "Wie viel Akku verbraucht die App?", a: "Ungefähr 1-2% pro Tag bei einer Synchronisierung alle 30 Minuten. Das liegt unter der Schwelle, ab der Android eine App als akkuhungrig einstuft. Wenn du einen ungewöhnlich hohen Verbrauch siehst, indiziert wahrscheinlich Health Connect selbst Daten, nicht FitMesh Sync." },
  { q: "Funktioniert die App offline?", a: "Die App erfasst und speichert Daten auch ohne Netzwerkverbindung in einer Warteschlange. Sobald du wieder online bist, synchronisiert sie den gesamten Rückstand automatisch. Das Web-Dashboard benötigt hingegen eine aktive Internetverbindung." },
  { q: "Kann ich einen eigenen privaten Server nutzen?", a: "Ja, auf Anfrage. Für Unternehmensanforderungen (Pflegeheime, Kliniken, Arztpraxen, Familiengruppen mit getrennten Daten) richten wir einen dedizierten Server mit deiner Domain, verwalteten Backups und einem dedizierten SLA ein. Schreib uns an sales@fitmesh.fit und gib die erwartete Nutzeranzahl sowie deine Anforderungen zur Datenspeicherung an." },
  { q: "Was kostet FitMesh Sync?", a: "3,99 € auf Android · 4,99 € auf iPhone: Einmalkauf, kein Abonnement, keine automatischen Verlängerungen, keine Überraschungen auf der Rechnung." },
  { q: "Ich habe mein Telefon gewechselt. Verliere ich meine Daten?", a: "Nein. Die Daten liegen auf dem Server, nicht auf dem Gerät. Installiere die App neu, melde dich an (oder gib in den Einstellungen deine vorherige Geräte-ID ein, falls du ein erweitertes Konto hast) und du findest alles wieder." },
  { q: "Gibt es iOS-Unterstützung?", a: "In Entwicklung. iOS wird 2026 mit derselben Architektur erscheinen: eine native SwiftUI-App, die Daten aus Apple HealthKit liest. Melde dich über hello@fitmesh.fit an, um benachrichtigt zu werden." },
];

const FAQ_PT: Faq[] = [
  {
    q: "O app não mostra dados. O que faço?",
    a: "Verifique nesta ordem: (1) O Health Connect está instalado pela Google Play? (2) Você concedeu a permissão «Ler dados em segundo plano» dentro do Health Connect? (3) Toque em «Sincronizar agora» nas configurações. Se o problema persistir, entre em contato conosco enviando uma captura de tela do painel «Status».",
  },
  { q: "Quanto de bateria o app consome?", a: "Cerca de 1-2% por dia com sincronizações a cada 30 minutos. Abaixo do limite que o Android considera como apps que drenam a bateria. Se você notar um consumo anormal, provavelmente é o próprio Health Connect indexando dados, não o FitMesh Sync." },
  { q: "Funciona sem conexão?", a: "O app coleta e coloca os dados em fila mesmo sem rede. Assim que você voltar a ficar online, ele sincroniza todo o histórico acumulado automaticamente. O painel web, no entanto, requer uma conexão ativa com a internet." },
  { q: "Posso usar um servidor privado?", a: "Sim, sob solicitação. Para necessidades corporativas (casas de repouso, clínicas, consultórios, grupos familiares com dados separados) configuramos um servidor dedicado com seu domínio, backups gerenciados e um SLA dedicado. Escreva para sales@fitmesh.fit informando o volume de usuários esperado e os requisitos de retenção de dados." },
  { q: "Quanto custa o FitMesh Sync?", a: "€3,99 no Android · €4,99 no iPhone: compra única, sem assinatura, sem renovações automáticas, sem surpresas na fatura." },
  { q: "Troquei de celular. Perco meus dados?", a: "Não. Os dados estão no servidor, não no celular. Reinstale o app, faça login (ou insira seu ID de dispositivo anterior nas configurações se você tiver uma conta avançada) e encontrará tudo de volta." },
  { q: "Haverá suporte para iOS?", a: "Em desenvolvimento. O iOS chegará em 2026 com a mesma arquitetura: um app nativo SwiftUI que lê dados do Apple HealthKit. Inscreva-se em hello@fitmesh.fit para ser avisado." },
];

const FAQ_FR: Faq[] = [
  {
    q: "L'application n'affiche aucune donnée. Que faire ?",
    a: "Vérifiez dans cet ordre : (1) Health Connect est-il installé depuis le Play Store ? (2) Avez-vous accordé l'autorisation «Lire les données en arrière-plan» dans Health Connect ? (3) Appuyez sur «Synchroniser maintenant» dans les paramètres. Si le problème persiste, écrivez-nous en joignant une capture d'écran du panneau «Statut».",
  },
  { q: "Quelle est la consommation de batterie ?", a: "Environ 1 à 2 % par jour avec des synchronisations toutes les 30 minutes. En dessous du seuil qu'Android considère comme des applications énergivores. Si vous constatez une consommation anormale, c'est probablement Health Connect lui-même qui indexe des données, et non FitMesh Sync." },
  { q: "L'application fonctionne-t-elle hors ligne ?", a: "L'application collecte et met en file d'attente les données même sans réseau. Dès que vous êtes de nouveau connecté, elle synchronise automatiquement tout l'arriéré. Le tableau de bord web, en revanche, nécessite une connexion internet active." },
  { q: "Puis-je utiliser un serveur privé ?", a: "Oui, sur demande. Pour les besoins des entreprises (maisons de retraite, cliniques, cabinets médicaux, groupes familiaux avec données séparées), nous déployons un serveur dédié avec votre domaine, des sauvegardes gérées et un SLA dédié. Écrivez à sales@fitmesh.fit en indiquant le volume d'utilisateurs prévu et vos exigences de conservation des données." },
  { q: "Combien coûte FitMesh Sync ?", a: "3,99 € sur Android · 4,99 € sur iPhone : achat unique, sans abonnement, sans renouvellements automatiques, sans mauvaises surprises sur la facture." },
  { q: "J'ai changé de téléphone. Vais-je perdre mes données ?", a: "Non. Les données sont sur le serveur, pas sur le téléphone. Réinstallez l'application, connectez-vous (ou saisissez votre identifiant d'appareil précédent dans les paramètres si vous avez un compte avancé) et vous retrouvez tout." },
  { q: "Y aura-t-il une prise en charge iOS ?", a: "En cours de développement. iOS arrivera en 2026 avec la même architecture : une application native SwiftUI qui lit les données depuis Apple HealthKit. Inscrivez-vous via hello@fitmesh.fit pour être informé." },
];

const FAQ_NL: Faq[] = [
  {
    q: "De app toont geen gegevens. Wat moet ik doen?",
    a: "Controleer in volgorde: (1) Is Health Connect vanuit de Play Store geïnstalleerd? (2) Heeft u de toestemming «Gegevens op de achtergrond lezen» ingeschakeld binnen Health Connect? (3) Tik op «Nu synchroniseren» in de instellingen. Als het probleem aanhoudt, neem dan contact met ons op met een schermafbeelding van het paneel «Status».",
  },
  { q: "Hoeveel batterij verbruikt de app?", a: "Ongeveer 1-2% per dag met synchronisaties elke 30 minuten. Dat ligt onder de grens die Android hanteert voor «apps die de batterij leeglopen». Als je ongewoon verbruik ziet, is het waarschijnlijk Health Connect zelf dat aan het indexeren is, niet FitMesh Sync." },
  { q: "Werkt de app offline?", a: "De app verzamelt en zet gegevens in de wachtrij, ook zonder netwerk. Zodra u weer online bent, synchroniseert de app automatisch alles wat er in de tussentijd is opgebouwd. Het webdashboard vereist echter een actieve internetverbinding." },
  { q: "Kan ik een eigen privéserver gebruiken?", a: "Ja, op aanvraag. Voor zakelijke behoeften (verzorgingshuizen, klinieken, medische praktijken, familiegroepen met gescheiden gegevens) zetten we een dedicated server op met uw domein, beheerde back-ups en een dedicated SLA. Schrijf naar sales@fitmesh.fit met het verwachte gebruikersvolume en uw bewaarvereisten voor gegevens." },
  { q: "Hoeveel kost FitMesh Sync?", a: "€3,99 op Android · €4,99 op iPhone: eenmalige aankoop, geen abonnement, geen automatische verlengingen, geen verrassingen op de factuur." },
  { q: "Ik heb van telefoon gewisseld. Verlies ik mijn gegevens?", a: "Nee. De gegevens staan op de server, niet op de telefoon. Installeer de app opnieuw, log in (of voer uw vorige apparaat-ID in de instellingen in als u een geavanceerd account heeft) en u krijgt alles terug." },
  { q: "iOS-ondersteuning?", a: "In ontwikkeling. iOS volgt in 2026 met dezelfde architectuur: een native SwiftUI-app die gegevens leest uit Apple HealthKit. Schrijf u in via hello@fitmesh.fit om op de hoogte te worden gesteld." },
];

const FAQ_JA: Faq[] = [
  {
    q: "アプリにデータが表示されません。どうすればよいですか？",
    a: "次の順で確認してください：(1) Play StoreからHealth Connectをインストールしていますか？ (2) Health Connect内で「バックグラウンドでのデータ読み取り」の権限を許可していますか？ (3) 設定内の「今すぐ同期」をタップしてください。問題が解決しない場合は、「ステータス」パネルのスクリーンショットを添付してご連絡ください。",
  },
  { q: "バッテリーの消費量はどれくらいですか？", a: "30分ごとの同期間隔で1日あたり約1〜2%です。Androidがバッテリーを消耗するアプリとして検出する閾値を下回っています。異常な消耗にお気づきの場合は、FitMesh SyncではなくHealth Connect自体がバックグラウンドでインデックス処理をしている可能性が高いです。" },
  { q: "オフラインでも動作しますか？", a: "アプリはネットワークなしでもデータを収集してキューに保存します。オンラインに戻った瞬間、溜まっていた分をすべて自動的に同期します。Webダッシュボードはアクティブなインターネット接続が必要です。" },
  { q: "プライベートサーバーを使用できますか？", a: "はい、ご要望に応じて対応します。企業向けのニーズ（介護施設、クリニック、医療機関、データを分離管理したい家族グループなど）には、ご指定のドメインで専用サーバーをセットアップし、管理されたバックアップと専用SLAを提供します。予想ユーザー数とデータ保持要件を添えてsales@fitmesh.fitまでお知らせください。" },
  { q: "FitMesh Syncの価格は？", a: "Android €3.99 · iPhone €4.99：買い切りプラン、サブスクリプションなし、自動更新なし、請求の驚きなし。" },
  { q: "機種変更しました。データは失われますか？", a: "いいえ。データはサーバーに保存されており、端末には保存されていません。アプリを再インストールしてログインするか（高度なアカウントをお持ちの場合は、設定に以前のデバイスIDを入力してください）、すべてのデータが元に戻ります。" },
  { q: "iOSのサポートは？", a: "開発中です。iOSは2026年に同じアーキテクチャで登場する予定です：Apple HealthKitからデータを読み取るネイティブSwiftUIアプリです。hello@fitmesh.fitから登録すると通知をお届けします。" },
];

const FAQ_KO: Faq[] = [
  {
    q: "앱에 데이터가 표시되지 않습니다. 어떻게 해야 하나요?",
    a: "다음 순서로 확인해 주세요: (1) Play 스토어에서 Health Connect를 설치하셨나요? (2) Health Connect 내에서 「백그라운드 데이터 읽기」 권한을 허용하셨나요? (3) 설정에서 「지금 동기화」를 탭해 주세요. 문제가 계속되면 「상태」 패널의 스크린샷을 첨부하여 이메일로 문의해 주세요.",
  },
  { q: "배터리 사용량은 얼마나 되나요?", a: "30분 간격으로 동기화할 때 하루 약 1~2%를 사용합니다. Android가 「배터리 소모 앱」으로 감지하는 임계치 이하입니다. 비정상적인 소모가 보인다면, FitMesh Sync가 아니라 Health Connect 자체가 백그라운드에서 인덱싱하고 있을 가능성이 높습니다." },
  { q: "오프라인에서도 작동하나요?", a: "앱은 네트워크 없이도 데이터를 수집하여 대기열에 저장합니다. 다시 온라인이 되면 쌓인 데이터를 자동으로 모두 동기화합니다. 웹 대시보드는 인터넷 연결이 필요합니다." },
  { q: "프라이빗 서버를 사용할 수 있나요?", a: "네, 요청 시 가능합니다. 기업용 수요(요양원, 클리닉, 의료기관, 데이터를 분리 관리해야 하는 가족 그룹 등)에 대해 고객님의 도메인으로 전용 서버를 설정해 드리며, 관리형 백업과 전용 SLA를 제공합니다. 예상 사용자 수와 데이터 보관 요건을 sales@fitmesh.fit로 이메일 주세요." },
  { q: "FitMesh Sync 가격은 얼마인가요?", a: "Android €3.99 · iPhone €4.99: 일회성 구매, 구독 없음, 자동 갱신 없음, 청구 시 예상치 못한 요금 없음." },
  { q: "휴대폰을 바꿨습니다. 데이터가 사라지나요?", a: "아니요. 데이터는 서버에 저장되어 있으며 휴대폰에는 없습니다. 앱을 재설치하고 로그인하거나(고급 계정의 경우 설정에서 이전 기기 ID를 입력하시면) 모든 데이터를 되찾을 수 있습니다." },
  { q: "iOS 지원은요?", a: "개발 중입니다. iOS는 2026년에 동일한 아키텍처로 출시될 예정입니다: Apple HealthKit에서 데이터를 읽는 네이티브 SwiftUI 앱입니다. hello@fitmesh.fit로 등록하시면 알림을 받으실 수 있습니다." },
];

// pl and tr inherit Italian, like the rest of the support page.
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
};
