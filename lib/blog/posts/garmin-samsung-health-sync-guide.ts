import type { BlogPost } from "../types";

export const post: BlogPost = {
  slug: "garmin-samsung-health-sync-guide",
  category: "guides",
  publishedAt: "2026-06-20",
  updatedAt: "2026-08-25",
  readMinutes: 7,
  // SPRINT PRE-FERIE addendum Bing (2026-08-06): title NL renderizzato
  // sopra 70 caratteri (Bing FailingUrls CSV, verificato live). H1/slug
  // invariati, solo <title>/og:title/twitter:title/BlogPosting.headline.
  // EN/DE deliberatamente ESCLUSI da quel fix su istruzione esplicita:
  // "non correggere separatamente i due title Garmin/Samsung prima della
  // FASE 6" (cannibalizzazione).
  //
  // FASE 6 (2026-08-06): verifica live ri-confermata DOPO il deploy di
  // Release A+B — /en/blog/garmin-samsung-health-sync-guide e
  // /de/blog/garmin-samsung-health-sync-guide fanno ANCORA 308 verso lo
  // slug localizzato corretto (sync-garmin-samsung-health-guide /
  // garmin-samsung-health-synchronisieren-anleitung): l'infrastruttura di
  // redirect di resolveBlogPost() gestisce gia' da sola il pattern
  // "slug canonico usato sotto una locale non canonica", quindi non esiste
  // una cannibalizzazione ATTIVA da risolvere con un redirect — il dato
  // GSC a doppia URL con click era stale/pre-fix. Nessuna consolidazione
  // necessaria: le URL canoniche EN/DE sono le uniche raggiungibili come
  // pagina 200, quindi il fix titolo qui e' sicuro (nessun rischio di
  // correggere una pagina che sta per essere redirectata via).
  //
  // P0 CTR Test (2026-09-14): override seoTitle.it compatto per test CTR SERP.
  // H1, slug e body invariati.
  seoTitle: {
    it: "Sincronizzare Garmin con Samsung Health (2026)",
    nl: "Garmin met Samsung Health synchroniseren",
    en: "Sync Garmin with Samsung Health and Health Connect",
    de: "Garmin mit Samsung Health synchronisieren",
  },
  hero: {
    kicker: {
        it: "Guida passo-passo",
        en: "Step-by-step guide",
        es: "Guía paso a paso",
        de: "Schritt-für-Schritt-Leitfaden",
        pt: "Guia passo a passo",
        fr: "Guide étape par étape",
        pl: "Przewodnik krok po kroku",
        tr: "Adım adım rehber",
        nl: "Stap voor stap handleiding",
        ja: "ステップバイステップガイド",
        ko: "단계별 가이드",
      },
    title: {
        it: "Come sincronizzare Garmin con Samsung Health e Health Connect nel 2026",
        en: "How to sync Garmin with Samsung Health and Health Connect in 2026",
        es: "Cómo sincronizar Garmin con Samsung Health y Health Connect en 2026",
        de: "Wie Sie Garmin mit Samsung Health und Health Connect in 2026 synchronisieren",
        pt: "Como sincronizar o Garmin com o Samsung Health e Health Connect em 2026",
        fr: "Comment synchroniser Garmin avec Samsung Health et Health Connect en 2026",
        pl: "Jak synchronizować Garmin z Samsung Health i Health Connect w 2026 roku",
        tr: "2026'da Garmin'i Samsung Health ve Health Connect ile nasıl senkronize edersiniz",
        nl: "Hoe om te synchroniseren tussen Garmin en Samsung Health en Health Connect in 2026",
        ja: "2026年にGarminとSamsung HealthをHealth Connectを使用して同期する方法",
        ko: "2026년 가민을 삼성 건강 및 Health Connect와 동기화하는 방법",
      },
    subtitle: {
        // P1.8A (2026-08-25): "automaticamente"/"automatically" rimosso in
        // tutte le locale — stesso claim gia' qualificato altrove in questo
        // file (TL;DR + body: la sincronizzazione e' innescata da un evento
        // e richiede l'app in foreground, non un flusso automatico continuo
        // "verso entrambe le piattaforme"). Questo campo era sfuggito a
        // quel giro perche' non e' un TL;DR/body ma il subtitle dell'hero.
        it: "Garmin e Samsung Health non si parlano direttamente. Ecco la configurazione completa per far fluire i tuoi dati su entrambe le piattaforme.",
        en: "Garmin and Samsung Health do not talk directly. Here is the complete setup to get your data flowing to both platforms.",
        es: "Garmin y Samsung Health no se comunican directamente. Aquí tienes la configuración completa para que tu data fluya hacia ambas plataformas.",
        de: "Garmin und Samsung Health sprechen nicht direkt miteinander. Hier ist der vollständige Setup-Prozess, um Ihre Daten zu beiden Plattformen zu leiten.",
        pt: "O Garmin e o Samsung Health não se comunicam diretamente. Aqui está a configuração completa para que seus dados fluam para ambas as plataformas.",
        fr: "Garmin et Samsung Health ne communiquent pas directement. Voici la configuration complète pour que vos données circulent vers les deux plateformes.",
        pl: "Garmin i Samsung Health nie rozmawiają ze sobą bezpośrednio. Oto pełna konfiguracja, dzięki której Twoje dane mogą przepływać do obu platform.",
        tr: "Garmin ve Samsung Health doğrudan iletişim kurmazlar. Burada verilerin her iki platforma da akmasına yönelik tam ayarlamayı bulacaksınız.",
        nl: "Garmin en Samsung Health praten niet direct met elkaar. Hier is de volledige configuratie om je gegevens naar beide platforms te laten stromen.",
        ja: "GarminとSamsung Healthは直接話しません。ここでは、両方のプラットフォームにデータが流れるようにする完全な設定手順をお伝えします。",
        ko: "가민과 삼성 건강은 직접 통신하지 않습니다. 여기에서 두 플랫폼으로 데이터가 흐르도록 하는 전체 설정 방법을 소개합니다.",
      },
  },
  metaDescription: {
      it: "Garmin Connect e Samsung Health non si sincronizzano direttamente. Questo guida ti mostra come connetterli tramite Health Connect su Android, passo per passo.",
      en: "Garmin Connect and Samsung Health do not sync directly. This guide shows you how to connect them via Health Connect on Android, step by step.",
      es: "Garmin Connect y Samsung Health no se sincronizan directamente. Este guía te muestra cómo conectarlos a través de Health Connect en Android, paso a paso.",
      de: "Garmin Connect und Samsung Health synchronisieren sich nicht direkt. So verbinden Sie beide über Health Connect auf Android, Schritt für Schritt.",
      pt: "Garmin Connect e Samsung Health não se sincronizam diretamente. Este guia mostra como conectar essas plataformas através do Health Connect no Android, passo a passo.",
      fr: "Garmin Connect et Samsung Health ne s'intègrent pas directement. Ce guide montre comment les connecter via Health Connect sur Android, étape par étape.",
      pl: "Garmin Connect i Samsung Health nie synchronizują się bezpośrednio. Ten przewodnik pokazuje, jak je połączyć za pomocą Health Connect na Androidzie, krok po kroku.",
      tr: "Garmin Connect ve Samsung Health'in doğrudan bir entegrasyonu yoktur. Bu rehberde Android'de Health Connect kullanarak bunları nasıl bağlayacağınızı adım adım göstereceğiz.",
      nl: "Garmin Connect en Samsung Health synchroniseren niet direct. Dit handleiding laat je zien hoe je ze via Health Connect op Android kunt verbinden, stap voor stap.",
      ja: "Garmin Connect と Samsung Health は直接同期しません。このガイドでは、Android 上の Health Connect を使用して両方を同期する手順をステップバイステップで説明します。",
      ko: "가민 커넥트와 삼성 건강은 직접 동기화되지 않습니다. 이 가이드는 안드로이드에서 Health Connect를 통해 둘을 연결하는 방법을 단계별로 설명합니다.",
    },
  primaryKeyword: {
      it: "sincronizzazione Garmin con Samsung Health su Android",
      en: "sync garmin samsung health android",
      es: "sincronizar Garmin con Samsung Health en Android",
      de: "synchronisieren Garmin Samsung Health Android",
      pt: "sincronizar Garmin com Samsung Health em Android",
      fr: "synchroniser Garmin avec Samsung Health sur Android",
      pl: "synchronizacja Garmin Samsung Health Android",
      tr: "garmin connect samsung health android",
      nl: "synchroniseer Garmin met Samsung Health op Android",
      ja: "garmin connect samsun health android 同期",
      ko: "가민과 삼성 건강 안드로이드 동기화",
    },
  secondaryKeywords: {
      it: [
        "sincronizzazione Garmin con Health Connect 2026",
        "ponte tra Garmin e Samsung Health",
        "dati Garmin sull'app di salute su Android",
      ],
      en: [
        "garmin health connect sync 2026",
        "garmin connect samsung health bridge",
        "garmin data android health app",
      ],
      es: [
        "sincronizar Garmin con Health Connect 2026",
        "puente Garmin y Samsung Health",
        "datos de Garmin en la aplicación de salud para Android",
      ],
      de: [
        "synchronisieren Garmin Health Connect 2026",
        "Garmin Connect Samsung Health-Brücke",
        "Garmin-Daten Android Gesundheitsapp",
      ],
      pt: [
        "sincronizar saúde do Garmin em 2026",
        "ponte Garmin Connect Samsung Health",
        "dados de saúde do Garmin no Android",
      ],
      fr: [
        "synchronisation Garmin Health Connect 2026",
        "pont Garmin Connect Samsung Health",
        "données Garmin application santé Android",
      ],
      pl: [
        "synchronizacja Garmin Health Connect 2026",
        "most Garmin Connect Samsung Health",
        "dane zdrowotne Garmin aplikacja Android",
      ],
      tr: [
        "garmin health connect sync 2026",
        "garmin connect samsung health köprüsü",
        "garmin veri android sağlık uygulaması",
      ],
      nl: [
        "synchroniseer Garmin met Health Connect in 2026",
        "brug tussen Garmin en Samsung Health",
        "Garmin gegevens op Android gezondheidsapp",
      ],
      ja: [
        "garmin health connect 同期 2026",
        "garmin connect samsun health ブリッジ",
        "garmin データ android 健康アプリ",
      ],
      ko: [
        "가민 Health Connect 동기화 2026",
        "가민 커넥트와 삼성 건강 연결",
        "가민 데이터 안드로이드 건강 앱",
      ],
    },
  tldr: {
      it: [
        "Garmin e Samsung Health non hanno integrazione diretta. Il ponte è Health Connect.",
        "Devi abilitare i permessi di scrittura per Health Connect in Garmin Connect e i permessi di lettura in Samsung Health. La condivisione con Health Connect di Garmin Connect richiede Android 14 o successivo.",
        "Una volta configurato, i tipi di dato elencati da Garmin (passi, fasi del sonno, frequenza cardiaca e dati di attività come distanza e velocità) si sincronizzano automaticamente ogni volta che il tuo dispositivo Garmin si sincronizza con il telefono e apri Samsung Health: non è un processo continuo in background.",
        "FitMesh può mostrare i dati sia di un dispositivo Garmin che di un Galaxy Watch insieme: entrambi passano attraverso Health Connect.",
      ],
      en: [
        "Garmin and Samsung Health have no direct integration. The bridge is Health Connect.",
        "You need to enable Health Connect write permissions in Garmin Connect, and read permissions in Samsung Health. Garmin Connect's Health Connect sharing requires Android 14 or above.",
        "Once set up, the data types Garmin lists (steps, sleep stages, heart rate, and activity data such as distance and speed) sync automatically each time your Garmin device syncs with your phone and you open Samsung Health. It is not a continuous background process.",
        "FitMesh can show data from both a Garmin device and a Galaxy Watch at once — both flow through Health Connect.",
      ],
      es: [
        "Garmin y Samsung Health no tienen integración directa. El puente es Health Connect.",
        "Necesitas habilitar los permisos de escritura de Health Connect en Garmin Connect y los de lectura en Samsung Health. La opción de compartir de Garmin Connect con Health Connect requiere Android 14 o superior.",
        "Una vez configurado, los tipos de datos que Garmin enumera (pasos, fases del sueño, frecuencia cardíaca y datos de actividad como distancia y velocidad) se sincronizan automáticamente cada vez que tu dispositivo Garmin se sincroniza con el teléfono y abres Samsung Health. No es un proceso continuo en segundo plano.",
        "FitMesh puede mostrar datos de un dispositivo Garmin y de un Galaxy Watch al mismo tiempo: ambos pasan por Health Connect.",
      ],
      de: [
        "Garmin und Samsung Health haben keine direkte Integration. Die Brücke ist Health Connect.",
        "Sie müssen in Garmin Connect die Schreibberechtigung für Health Connect und in Samsung Health die Leseberechtigung aktivieren. Die Health-Connect-Freigabe von Garmin Connect setzt Android 14 oder höher voraus.",
        "Nach der Einrichtung werden die von Garmin aufgeführten Datentypen (Schritte, Schlafphasen, Herzfrequenz sowie Aktivitätsdaten wie Strecke und Geschwindigkeit) automatisch synchronisiert, sobald sich Ihr Garmin-Gerät mit dem Smartphone synchronisiert und Sie Samsung Health öffnen. Es ist kein dauerhafter Hintergrundprozess.",
        "FitMesh kann Daten von einem Garmin-Gerät und einer Galaxy Watch gleichzeitig anzeigen — beide laufen über Health Connect.",
      ],
      pt: [
        "O Garmin e o Samsung Health não têm integração direta. A ponte é o Health Connect.",
        "Você precisa habilitar as permissões de escrita do Health Connect no Garmin Connect e as de leitura no Samsung Health. O compartilhamento do Garmin Connect com o Health Connect exige Android 14 ou superior.",
        "Depois de configurado, os tipos de dados que a Garmin lista (passos, estágios do sono, frequência cardíaca e dados de atividade como distância e velocidade) sincronizam automaticamente sempre que seu dispositivo Garmin sincroniza com o telefone e você abre o Samsung Health. Não é um processo contínuo em segundo plano.",
        "O FitMesh pode mostrar dados de um dispositivo Garmin e de um Galaxy Watch ao mesmo tempo — ambos passam pelo Health Connect.",
      ],
      fr: [
        "Garmin et Samsung Health n'ont pas d'intégration directe. Le pont est Health Connect.",
        "Vous devez activer les permissions d'écriture de Health Connect dans Garmin Connect et les permissions de lecture dans Samsung Health. Le partage de Garmin Connect avec Health Connect nécessite Android 14 ou version ultérieure.",
        "Une fois configurés, les types de données listés par Garmin (pas, phases de sommeil, fréquence cardiaque et données d'activité comme la distance et la vitesse) se synchronisent automatiquement chaque fois que votre appareil Garmin se synchronise avec le téléphone et que vous ouvrez Samsung Health. Ce n'est pas un processus continu en arrière-plan.",
        "FitMesh peut afficher les données d'un appareil Garmin et d'une Galaxy Watch en même temps — les deux passent par Health Connect.",
      ],
      pl: [
        "Garmin i Samsung Health nie mają bezpośredniej integracji. Mostem jest Health Connect.",
        "Musisz włączyć uprawnienia do zapisu w Health Connect w Garmin Connect, a uprawnienia do odczytu w Samsung Health. Udostępnianie danych z Garmin Connect do Health Connect wymaga Androida 14 lub nowszego.",
        "Po skonfigurowaniu typy danych wymienione przez Garmin (kroki, fazy snu, tętno oraz dane o aktywności, takie jak dystans i prędkość) synchronizują się automatycznie za każdym razem, gdy urządzenie Garmin synchronizuje się z telefonem, a Ty otwierasz Samsung Health. To nie jest ciągły proces w tle.",
        "FitMesh może pokazywać dane zarówno z urządzenia Garmin, jak i z Galaxy Watch jednocześnie — oba przechodzą przez Health Connect.",
      ],
      tr: [
        "Garmin ve Samsung Health'in doğrudan entegrasyonu yoktur. Köprü Health Connect'tir.",
        "Garmin Connect'te Health Connect yazma izinlerini, Samsung Health'te ise okuma izinlerini etkinleştirmeniz gerekir. Garmin Connect'in Health Connect paylaşımı Android 14 veya üzerini gerektirir.",
        "Kurulumdan sonra Garmin'in listelediği veri türleri (adımlar, uyku evreleri, kalp atış hızı ile mesafe ve hız gibi etkinlik verileri), Garmin cihazınız telefonla senkronize olduğunda ve Samsung Health'i açtığınızda otomatik olarak senkronize edilir. Bu, sürekli çalışan bir arka plan işlemi değildir.",
        "FitMesh, hem bir Garmin cihazından hem de bir Galaxy Watch'tan gelen verileri aynı anda gösterebilir — ikisi de Health Connect üzerinden akar.",
      ],
      nl: [
        "Garmin en Samsung Health hebben geen direct integratie. De brug is Health Connect.",
        "Je moet in Garmin Connect de schrijfrechten voor Health Connect inschakelen en in Samsung Health de leesrechten. Het delen van Garmin Connect met Health Connect vereist Android 14 of hoger.",
        "Eenmaal ingesteld, worden de gegevenstypen die Garmin vermeldt (stappen, slaapfasen, hartslag en activiteitsgegevens zoals afstand en snelheid) automatisch gesynchroniseerd telkens wanneer je Garmin-apparaat met je telefoon synchroniseert en je Samsung Health opent. Het is geen continu achtergrondproces.",
        "FitMesh kan gegevens van zowel een Garmin-apparaat als een Galaxy Watch tegelijk tonen — beide lopen via Health Connect.",
      ],
      ja: [
        "GarminとSamsung Healthには直接統合機能はありません。ブリッジはHealth Connectです。",
        "Garmin Connect で Health Connect の書き込み権限を、Samsung Health で読み取り権限を有効にする必要があります。Garmin Connect の Health Connect 共有には Android 14 以降が必要です。",
        "設定が完了すると、Garmin が一覧に挙げているデータタイプ(歩数、睡眠ステージ、心拍数、距離や速度などのアクティビティデータ)は、Garmin デバイスがスマートフォンと同期し、Samsung Health を開くたびに自動的に同期されます。常時バックグラウンドで動作する処理ではありません。",
        "FitMeshはGarminデバイスとGalaxy Watchの両方のデータを同時に表示できます。どちらもHealth Connectを経由します。",
      ],
      ko: [
        "가민과 삼성 건강은 직접 통합되어 있지 않습니다. 브릿지는 Health Connect입니다.",
        "Garmin Connect에서 Health Connect 쓰기 권한을, Samsung Health에서 읽기 권한을 활성화해야 합니다. Garmin Connect의 Health Connect 공유에는 Android 14 이상이 필요합니다.",
        "설정이 끝나면 Garmin이 목록에 올린 데이터 유형(걸음 수, 수면 단계, 심박수, 거리와 속도 같은 활동 데이터)이 Garmin 기기가 휴대폰과 동기화되고 Samsung Health를 열 때마다 자동으로 동기화됩니다. 지속적인 백그라운드 프로세스는 아닙니다.",
        "FitMesh는 가민 장치와 갤럭시 워치의 데이터를 동시에 보여줄 수 있습니다 — 둘 다 Health Connect를 거칩니다.",
      ],
    },
  body: [
    {
      type: "paragraph",
      text: {
          it: "Garmin Connect e Samsung Health sono due tra i sistemi di fitness più diffusi su Android, ma non si parlano direttamente l'uno con l'altro. Per anni, l'unica soluzione alternativa era un'app di terze parti o una esportazione manuale dei dati. Con l'avvento del Health Connect come standard per la sincronizzazione, la situazione è cambiata. Garmin Connect scrive i tuoi dati su Health Connect; Samsung Health può sia leggere che scrivere su Health Connect. Insieme, agiscono come ponte. Questa guida ti mostra come configurarlo correttamente.",
          en: "Garmin Connect and Samsung Health are two widely used fitness ecosystems on Android, but they have never talked to each other directly. For years, the only workaround was a third-party app or manual data export. Since Android's Health Connect became the standard sync layer, the picture changed. Garmin Connect writes your data to Health Connect; Samsung Health can both read from and write to Health Connect. Together, they act as the bridge. This guide shows you how to set it up correctly.",
          es: "Garmin Connect y Samsung Health son dos de los ecosistemas de fitness más usados en Android, pero nunca se han comunicado directamente. Por años, la única solución fue una aplicación de terceros o la exportación manual de datos. Con el lanzamiento del estándar de sincronización Health Connect para Android, la situación cambió. Garmin Connect escribe tus datos en Health Connect; Samsung Health puede tanto leer como escribir en Health Connect. Juntas, actúan como puente. Este guía te muestra cómo configurarlo correctamente.",
          de: "Garmin Connect und Samsung Health gehören zu den meistgenutzten Fitness-Ökosystemen auf Android, aber sie haben sich nie direkt mit einander verständigt. Für Jahre war die einzige Workaround-Möglichkeit ein dritter Teilnehmer oder manuelle Datenexporte. Da Health Connect auf Android als Standard-Synchronisierungsschicht geworden ist, hat sich das Bild geändert. Garmin Connect schreibt Ihre Daten in Health Connect; Samsung Health kann sowohl von Health Connect lesen als auch dorthin schreiben. Zusammen fungieren sie als Brücke. Dieser Leitfaden zeigt Ihnen, wie Sie es richtig einrichten.",
          pt: "Garmin Connect e Samsung Health são dois dos ecossistemas de fitness mais usados no Android, mas nunca se comunicaram diretamente. Por anos, a única solução era uma aplicação de terceiros ou exportação manual de dados. Com o Health Connect do Android como camada padrão de sincronização, a situação mudou. O Garmin Connect grava seus dados no Health Connect; o Samsung Health pode tanto ler quanto gravar no Health Connect. Juntos, atuam como a ponte. Este guia mostra como configurar corretamente.",
          fr: "Garmin Connect et Samsung Health sont deux écosystèmes de fitness très utilisés sur Android, mais ils n'ont jamais communiqué directement. Pendant des années, l'unique solution était une application tierce ou une exportation manuelle des données. Depuis que Health Connect est devenu le standard pour la synchronisation, la situation a changé. Garmin Connect écrit vos données dans Health Connect; Samsung Health peut à la fois lire et écrire dans Health Connect. Ensemble, ils agissent comme un pont. Ce guide montre comment configurer correctement.",
          pl: "Garmin Connect i Samsung Health to dwa z najczęściej używanych systemów fitness na Androidzie, ale nigdy nie rozmawiały ze sobą bezpośrednio. Przez lata jedynym rozwiązaniem była aplikacja innej firmy lub ręczne eksportowanie danych. Dzięki standardowej warstwie synchronizacji Health Connect na Androidzie sytuacja się zmieniła. Garmin Connect zapisuje Twoje dane w Health Connect; Samsung Health może zarówno odczytywać, jak i zapisywać dane w Health Connect. Razem działają jako most. Ten przewodnik pokazuje, jak to prawidłowo skonfigurować.",
          tr: "Garmin Connect ve Samsung Health, Android'de en çok kullanılan iki fitness ekosistemi olmasına rağmen, birbirleriyle hiçbir zaman doğrudan iletişim kurmamıştır. Yıllar boyunca tek çözüm, üçüncü taraf bir uygulama ya da elle veri aktarımıydı. Health Connect, Android'in standart senkronizasyon katmanı haline geldiğinde durum değişti. Garmin Connect verilerinizi Health Connect'e yazar; Samsung Health hem Health Connect'ten okuyabilir hem de oraya yazabilir. Birlikte köprü görevi görürler. Bu rehberde doğru şekilde nasıl kuracağınızı göstereceğiz.",
          nl: "Garmin Connect en Samsung Health zijn twee veelgebruikte fitness-ecosystemen op Android, maar ze hebben elkaar nooit direct gesproken. Jarenlang was het de enige workaround een derdepartij-app of handmatig gegevensexporteren. Sinds Health Connect op Android de standaard-synchronisatielagen werd, veranderde het beeld. Garmin Connect schrijft je gegevens naar Health Connect; Samsung Health kan zowel uit Health Connect lezen als ernaar schrijven. Samen fungeren ze als brug. Deze handleiding laat je zien hoe je dit correct kunt instellen.",
          ja: "Garmin ConnectとSamsung Healthは、Androidで広く使われているフィットネスエコシステムの2つですが、直接やり取りすることはありません。数年間、唯一の解決策は第三者アプリケーションや手動データエクスポートでした。Health ConnectがAndroidの標準同期レイヤーとなったことで、状況が変わりました。Garmin ConnectはデータをHealth Connectに書き込みます。Samsung HealthはHealth Connectから読み取ることも、書き込むこともできます。両者が合わさってブリッジとして機能します。このガイドでは、それを正しく設定する方法を説明します。",
          ko: "가민 커넥트와 삼성 건강은 안드로이드에서 널리 사용되는 피트니스 생태계이지만, 서로 직접 통신하지 않습니다. 몇 년 동안 유일한 해결책은 제삼자 앱이나 수동 데이터 내보내기였습니다. 안드로이드의 Health Connect가 표준 동기화 레이어가 되면서 상황이 바뀌었습니다. 가민 커넥트는 데이터를 Health Connect에 씁니다. 삼성 건강은 Health Connect에서 읽을 수도, 쓸 수도 있습니다. 이 둘이 함께 브릿지 역할을 합니다. 이 가이드는 이를 올바르게 설정하는 방법을 보여줍니다.",
        },
    },
    {
      type: "heading",
      level: 2,
      text: {
          it: "Come funziona la sincronizzazione (e ciò che non copre)",
          en: "How the sync works (and what it does not cover)",
          es: "Cómo funciona la sincronización (y lo que no cubre)",
          de: "Wie die Synchronisierung funktioniert (und was sie nicht abdeckt)",
          pt: "Como funciona a sincronização (e o que não está incluído)",
          fr: "Comment la synchronisation fonctionne (et ce qu'elle ne couvre pas)",
          pl: "Jak działa synchronizacja (i co nie obejmuje)",
          tr: "Entegrasyon nasıl çalıştığı (ve ne kapsamda değil)",
          nl: "Hoe het synchroniseren werkt (en wat er niet wordt bedekt)",
          ja: "同期の仕組み（カバーしていない内容）",
          ko: "동기화 작동 방식 (그리고 다루지 않는 것)",
        },
    },
    {
      type: "paragraph",
      text: {
          // governance:allow-em-dash (titolo ufficiale della fonte, EDITORIAL-CORE 9.2)
          it: "Health Connect non è un'app che elabora i tuoi dati. È una base di dati locale sul tuo dispositivo Android in cui le app possono leggere e scrivere, con il tuo consenso. Garmin Connect scrive su Health Connect i tipi di dato di attività e benessere elencati da Garmin (in un solo senso: Garmin Connect non legge mai da Health Connect). Samsung Health può leggere quei dati da Health Connect, e a sua volta scriverci. La limitazione è che solo i tipi di dati supportati da Health Connect vengono sincronizzati. Le metriche Garmin specifiche come Body Battery, Stress e Intensity Minutes non fanno parte dei tipi di dati standard Health Connect, quindi rimangono all'interno di Garmin Connect. Fonte: [Garmin Support — Sharing Your Garmin Connect Data With Health Connect](https://support.garmin.com/en-US/?faq=JToBEy0jfe6pIygark2Ui5) e [Samsung Developers — Accessing Samsung Health Data through Health Connect](https://developer.samsung.com/health/blog/en/accessing-samsung-health-data-through-health-connect), consultate il 25/08/2026.",
          // governance:allow-em-dash (titolo ufficiale della fonte, EDITORIAL-CORE 9.2)
          en: "Health Connect is not an app that processes your data. It is a local database on your Android device that apps can read from and write to, with your permission. Garmin Connect writes the activity and wellness data types Garmin lists to it (one-way only: Garmin Connect never reads from Health Connect). Samsung Health can read that data from it, and write to it too. The limitation is that only data types Health Connect supports are synced. Garmin-specific metrics like Body Battery, Stress, and Intensity Minutes are not part of the standard Health Connect data types, so they stay inside Garmin Connect only. Source: [Garmin Support — Sharing Your Garmin Connect Data With Health Connect](https://support.garmin.com/en-US/?faq=JToBEy0jfe6pIygark2Ui5) and [Samsung Developers — Accessing Samsung Health Data through Health Connect](https://developer.samsung.com/health/blog/en/accessing-samsung-health-data-through-health-connect), consulted 2026-08-25.",
          // governance:allow-em-dash (titolo ufficiale della fonte, EDITORIAL-CORE 9.2)
          es: "Health Connect no es una aplicación que procese tus datos. Es una base de datos local en tu dispositivo Android a la que las aplicaciones pueden leer y escribir con tu permiso. Garmin Connect escribe en ella los tipos de datos de actividad y bienestar que Garmin enumera (en un solo sentido: Garmin Connect nunca lee desde Health Connect). Samsung Health puede leer esos datos de ella, y también escribir en ella. La limitación es que solo se sincronizan los tipos de datos que Health Connect soporta. Las métricas Garmin específicas como Body Battery, Stress y Intensity Minutes no son parte de los tipos de datos estándar de Health Connect, por lo que permanecen dentro de Garmin Connect. Fuente: [Garmin Support — Sharing Your Garmin Connect Data With Health Connect](https://support.garmin.com/en-US/?faq=JToBEy0jfe6pIygark2Ui5) · [Samsung Developers — Accessing Samsung Health Data through Health Connect](https://developer.samsung.com/health/blog/en/accessing-samsung-health-data-through-health-connect).",
          // governance:allow-em-dash (titolo ufficiale della fonte, EDITORIAL-CORE 9.2)
          de: "Health Connect ist keine App, die Ihre Daten verarbeitet. Es handelt sich um eine lokale Datenbank auf Ihrem Android-Gerät, in die Apps mit Ihrer Genehmigung lesen und schreiben können. Garmin Connect schreibt die von Garmin aufgeführten Aktivitäts- und Wellnessdatentypen dorthin (nur in eine Richtung: Garmin Connect liest niemals aus Health Connect). Samsung Health kann diese Daten von dort lesen und auch dorthin schreiben. Die Einschränkung ist, dass nur die Datentypen synchronisiert werden, die Health Connect unterstützt. Garminspezifische Metriken wie Body Battery, Stress und Intensity Minutes sind nicht Teil der standardmäßigen Health Connect-Datentypen und bleiben daher ausschließlich in Garmin Connect. Quelle: [Garmin Support — Sharing Your Garmin Connect Data With Health Connect](https://support.garmin.com/en-US/?faq=JToBEy0jfe6pIygark2Ui5) · [Samsung Developers — Accessing Samsung Health Data through Health Connect](https://developer.samsung.com/health/blog/en/accessing-samsung-health-data-through-health-connect).",
          // governance:allow-em-dash (titolo ufficiale della fonte, EDITORIAL-CORE 9.2)
          pt: "O Health Connect não é um aplicativo que processa seus dados. É uma base de dados local no seu dispositivo Android que apps podem ler e escrever, com sua permissão. O Garmin Connect escreve no Health Connect os tipos de dados de atividade e bem-estar que a Garmin lista (em uma única direção: o Garmin Connect nunca lê do Health Connect). O Samsung Health pode ler esses dados do Health Connect, e também gravar nele. A limitação é que apenas os tipos de dados suportados pelo Health Connect são sincronizados. Métricas Garmin específicas como Body Battery, Stress e Intensity Minutes não fazem parte dos tipos de dados padrão do Health Connect, então permanecem dentro do Garmin Connect. Fonte: [Garmin Support — Sharing Your Garmin Connect Data With Health Connect](https://support.garmin.com/en-US/?faq=JToBEy0jfe6pIygark2Ui5) · [Samsung Developers — Accessing Samsung Health Data through Health Connect](https://developer.samsung.com/health/blog/en/accessing-samsung-health-data-through-health-connect).",
          // governance:allow-em-dash (titolo ufficiale della fonte, EDITORIAL-CORE 9.2)
          fr: "Health Connect n'est pas une application qui traite vos données. C'est une base de données locale sur votre appareil Android que les applications peuvent lire et écrire, avec votre permission. Garmin Connect écrit dans Health Connect les types de données d'activité et de bien-être que Garmin liste (dans un seul sens: Garmin Connect ne lit jamais depuis Health Connect). Samsung Health peut lire ces données depuis Health Connect, et également y écrire. La limitation est que seuls les types de données pris en charge par Health Connect sont synchronisés. Les métriques Garmin spécifiques comme Body Battery, Stress et Intensity Minutes ne font pas partie des types de données standard Health Connect, donc elles restent uniquement dans Garmin Connect. Source : [Garmin Support — Sharing Your Garmin Connect Data With Health Connect](https://support.garmin.com/en-US/?faq=JToBEy0jfe6pIygark2Ui5) · [Samsung Developers — Accessing Samsung Health Data through Health Connect](https://developer.samsung.com/health/blog/en/accessing-samsung-health-data-through-health-connect).",
          // governance:allow-em-dash (titolo ufficiale della fonte, EDITORIAL-CORE 9.2)
          pl: "Health Connect nie jest aplikacją przetwarzającą Twoje dane. Jest to lokalna baza danych na Twoim urządzeniu z Androidem, do której aplikacje mogą odczytywać i zapisywać dane, za Twoją zgodą. Garmin Connect zapisuje w niej typy danych o aktywności i samopoczuciu wymienione przez Garmin (tylko w jedną stronę: Garmin Connect nigdy nie odczytuje danych z Health Connect). Samsung Health może odczytywać te dane, a także je zapisywać. Ograniczeniem jest to, że synchronizowane są tylko typy danych obsługiwane przez Health Connect. Specyficzne dla Garmin metryki, takie jak Body Battery, Stress i Intensity Minutes, nie są częścią standardowych typów danych Health Connect, więc pozostają w Garmin Connect. Źródło: [Garmin Support — Sharing Your Garmin Connect Data With Health Connect](https://support.garmin.com/en-US/?faq=JToBEy0jfe6pIygark2Ui5) · [Samsung Developers — Accessing Samsung Health Data through Health Connect](https://developer.samsung.com/health/blog/en/accessing-samsung-health-data-through-health-connect).",
          // governance:allow-em-dash (titolo ufficiale della fonte, EDITORIAL-CORE 9.2)
          tr: "Health Connect bir veri işleme uygulaması değildir. Android cihazınız üzerindeki yerel bir veritabanıdır ve izin verdiğinizde, uygulamalar bu verilerden okuyabilir ve buraya yazabilir. Garmin Connect, Garmin'in listelediği etkinlik ve sağlıklı yaşam veri türlerini Health Connect'e yazar (yalnızca tek yönlü: Garmin Connect asla Health Connect'ten okuma yapmaz). Samsung Health bu veriyi okuyabilir ve aynı zamanda yazabilir. Sınırlama, yalnızca Health Connect'in desteklediği veri türlerinin senkronize edilmesidir. Garmin'e özgü ölçümler, Body Battery, Stress ve Intensity Minutes standart Health Connect veri türleri değildir, bu yüzden sadece Garmin Connect içinde kalır. Kaynak: [Garmin Support — Sharing Your Garmin Connect Data With Health Connect](https://support.garmin.com/en-US/?faq=JToBEy0jfe6pIygark2Ui5) · [Samsung Developers — Accessing Samsung Health Data through Health Connect](https://developer.samsung.com/health/blog/en/accessing-samsung-health-data-through-health-connect).",
          // governance:allow-em-dash (titolo ufficiale della fonte, EDITORIAL-CORE 9.2)
          nl: "Health Connect is geen app die met je gegevens omgaat. Het is een lokale database op je Android-apparaat waar apps mee kunnen lezen en schrijven, met jouw toestemming. Garmin Connect schrijft de activiteits- en welzijnsgegevenstypen die Garmin vermeldt naar deze database (in één richting: Garmin Connect leest nooit uit Health Connect). Samsung Health kan die gegevens uit deze database lezen, en er ook naar schrijven. De beperking is dat alleen de gegevenstypen die Health Connect ondersteunt worden gesynchroniseerd. Garmin-specifieke metrieken zoals Body Battery, Stress en Intensity Minutes vallen buiten het standaard Health Connect-gegevenstype, dus ze blijven binnen Garmin Connect. Bron: [Garmin Support — Sharing Your Garmin Connect Data With Health Connect](https://support.garmin.com/en-US/?faq=JToBEy0jfe6pIygark2Ui5) · [Samsung Developers — Accessing Samsung Health Data through Health Connect](https://developer.samsung.com/health/blog/en/accessing-samsung-health-data-through-health-connect).",
          // governance:allow-em-dash (titolo ufficiale della fonte, EDITORIAL-CORE 9.2)
          ja: "Health Connectはあなたのデータを処理するアプリではありません。ユーザーの許可があれば、アプリが読み書きできるAndroidデバイス上のローカルデータベースです。Garmin Connect は、Garmin が一覧に挙げているアクティビティおよびウェルネスのデータタイプをそこに書き込みます(一方向のみ:Garmin ConnectがHealth Connectから読み取ることはありません)。Samsung Healthはそのデータを読み取ることも、書き込むこともできます。制限は、Health Connectがサポートするデータタイプのみが同期されることです。Garmin固有のメトリクス、例えばBody Battery、Stress、Intensity Minutesは標準のHealth Connectデータタイプには含まれず、Garmin Connect内に留まります。出典: [Garmin Support — Sharing Your Garmin Connect Data With Health Connect](https://support.garmin.com/en-US/?faq=JToBEy0jfe6pIygark2Ui5) · [Samsung Developers — Accessing Samsung Health Data through Health Connect](https://developer.samsung.com/health/blog/en/accessing-samsung-health-data-through-health-connect)。",
          // governance:allow-em-dash (titolo ufficiale della fonte, EDITORIAL-CORE 9.2)
          ko: "Health Connect는 데이터를 처리하는 앱이 아닙니다. 사용자의 허용에 따라 앱이 읽고 쓸 수 있는 안드로이드 기기 내 로컬 데이터베이스입니다. 가민 커넥트는 Garmin이 목록에 올린 활동 및 웰니스 데이터 유형을 그곳에 씁니다(단방향으로만: 가민 커넥트는 Health Connect에서 데이터를 읽지 않습니다). 삼성 건강은 그 데이터를 읽을 수 있고, 쓸 수도 있습니다. 한계는 Health Connect가 지원하는 데이터 유형만 동기화된다는 것입니다. 가민 고유의 메트릭들, 즉 Body Battery, 스트레스 점수, Intensity Minutes는 표준 Health Connect 데이터 유형에 포함되지 않으므로 가민 커넥트 내에서만 남아 있습니다. 출처: [Garmin Support — Sharing Your Garmin Connect Data With Health Connect](https://support.garmin.com/en-US/?faq=JToBEy0jfe6pIygark2Ui5) · [Samsung Developers — Accessing Samsung Health Data through Health Connect](https://developer.samsung.com/health/blog/en/accessing-samsung-health-data-through-health-connect).",
        },
    },
    {
      type: "callout",
      variant: "info",
      title: {
          it: "Cosa si sincronizza e cosa no",
          en: "What syncs and what does not",
          es: "Lo que se sincroniza y lo que no",
          de: "Was synchronisiert und was nicht",
          pt: "O que sincroniza e o que não",
          fr: "Ce qui se synchronise et ce qui ne se synchronise pas",
          pl: "Co synchronizuje się i co nie",
          tr: "Ne entegre edilir ve ne entegre edilmez",
          nl: "Wat synchroniseert en wat niet",
          ja: "同期されるものとされないもの",
          ko: "동기화되는 것과 동기화되지 않는 것",
        },
      body: {
          it: "L'elenco di Garmin per Health Connect comprende: passi, calorie (attive e totali), frequenza cardiaca, distanza, velocità, dislivello positivo, piani saliti, fasi del sonno, peso e grasso corporeo, più cadenza di pedalata e bracciate per le attività. Non nomina le sedute di allenamento, Body Battery, punteggio Stress, Intensity Minutes, Carico di addestramento ed Effetto di addestramento.",
          en: "Garmin's list for Health Connect includes: steps, calories (active and total), heart rate, distance, speed, elevation gained, floors climbed, sleep stages, weight and body fat, plus pedal cadence and swimming strokes for activities. It does not name workout sessions, Body Battery, Stress score, Intensity Minutes, Training Load or Training Effect.",
          es: "La lista de Garmin para Health Connect incluye: pasos, calorías (activas y totales), frecuencia cardíaca, distancia, velocidad, desnivel positivo, pisos subidos, fases del sueño, peso y grasa corporal, además de cadencia de pedaleo y brazadas en las actividades. No nombra las sesiones de entrenamiento, Body Battery, puntuación de estrés, Intensity Minutes, Carga de entrenamiento ni Efecto del entrenamiento.",
          de: "Die Garmin-Liste für Health Connect umfasst: Schritte, Kalorien (aktiv und gesamt), Herzfrequenz, Strecke, Geschwindigkeit, Höhenmeter, gestiegene Stockwerke, Schlafphasen, Gewicht und Körperfett sowie Trittfrequenz und Schwimmzüge bei Aktivitäten. Trainingseinheiten, Body Battery, Stress-Score, Intensity Minutes, Trainingsbelastung und Trainingseffekt werden darin nicht genannt.",
          pt: "A lista da Garmin para o Health Connect inclui: passos, calorias (ativas e totais), frequência cardíaca, distância, velocidade, ganho de elevação, andares subidos, estágios do sono, peso e gordura corporal, além de cadência de pedalada e braçadas nas atividades. Ela não cita sessões de treino, Body Battery, pontuação de Stress, Intensity Minutes, Carga de Treino nem Efeito de Treino.",
          fr: "La liste de Garmin pour Health Connect comprend : pas, calories (actives et totales), fréquence cardiaque, distance, vitesse, dénivelé positif, étages montés, phases de sommeil, poids et masse grasse, ainsi que cadence de pédalage et mouvements de nage pour les activités. Elle ne mentionne pas les séances d'entraînement, Body Battery, score de Stress, Intensity Minutes, Charge d'entraînement ni Effet d'entraînement.",
          pl: "Lista Garmin dla Health Connect obejmuje: kroki, kalorie (aktywne i całkowite), tętno, dystans, prędkość, przewyższenie, przebyte piętra, fazy snu, masę ciała i tkankę tłuszczową, a także kadencję i liczbę ruchów pływackich w aktywnościach. Nie wymienia sesji treningowych, Body Battery, wyniku Stress, Intensity Minutes, Obciążenia treningowego ani Efektu treningowego.",
          tr: "Garmin'in Health Connect listesi şunları içerir: adımlar, kaloriler (aktif ve toplam), kalp atış hızı, mesafe, hız, kazanılan yükseklik, çıkılan katlar, uyku evreleri, kilo ve vücut yağı ile etkinliklerde pedal kadansı ve yüzme kulaçları. Antrenman oturumlarını, Body Battery, Stress puanı, Intensity Minutes, Training Load ve Training Effect verilerini anmaz.",
          nl: "De lijst van Garmin voor Health Connect bevat: stappen, calorieën (actief en totaal), hartslag, afstand, snelheid, hoogtewinst, beklommen verdiepingen, slaapfasen, gewicht en lichaamsvet, plus trapfrequentie en zwemslagen bij activiteiten. Trainingssessies, Body Battery, Stress-score, Intensity Minutes, Training Load en Training Effect worden niet genoemd.",
          ja: "Garmin の Health Connect 向け一覧には次が含まれます:歩数、カロリー(アクティブと合計)、心拍数、距離、速度、獲得標高、上った階数、睡眠ステージ、体重と体脂肪、さらにアクティビティのペダリングケイデンスと水泳のストローク数。ワークアウトのセッション、Body Battery、Stress スコア、Intensity Minutes、Training Load、Training Effect は挙げられていません。",
          ko: "Garmin의 Health Connect 목록에는 걸음 수, 칼로리(활동 및 전체), 심박수, 거리, 속도, 누적 상승 고도, 오른 층수, 수면 단계, 체중과 체지방, 그리고 활동의 페달링 케이던스와 수영 스트로크가 포함됩니다. 운동 세션, Body Battery, 스트레스 점수, Intensity Minutes, 트레이닝 부하, 트레이닝 효과는 목록에 없습니다.",
        },
    },
    {
      type: "heading",
      level: 2,
      text: {
          it: "Passo 1: conferma che Health Connect è installato",
          en: "Step 1: confirm Health Connect is installed",
          es: "Paso 1: confirmar que Health Connect está instalado",
          de: "Schritt 1: bestätigen Sie die Installation von Health Connect",
          pt: "Passo 1: confirme que o Health Connect está instalado",
          fr: "Étape 1 : confirmer que Health Connect est installé",
          pl: "Krok 1: upewnij się, że Health Connect jest zainstalowany",
          tr: "Adım 1: Health Connect'in kurulduğunu onaylayın",
          nl: "Stap 1: check of Health Connect geïnstalleerd is",
          ja: "ステップ1: Health Connectがインストールされていることを確認",
          ko: "단계 1: Health Connect 설치 확인",
        },
    },
    {
      type: "paragraph",
      text: {
          // governance:allow-em-dash (titolo ufficiale della fonte, EDITORIAL-CORE 9.2)
          it: "Su Android 14 e successive, Health Connect è un'applicazione di sistema già installata. Su Android 13 e precedenti, cerca 'Health Connect' nel Play Store e installa l'app ufficiale di Google. Aprila una volta per inizializzare l'archivio dati. Nota: l'opzione di condivisione con Health Connect integrata in Garmin Connect richiede specificamente Android 14 o successivo, quindi i passaggi di Garmin Connect qui sotto non valgono su Android 13 e precedenti (fonte: [Garmin Support — Sharing Your Garmin Connect Data With Health Connect](https://support.garmin.com/en-US/?faq=JToBEy0jfe6pIygark2Ui5): 'This feature is only available on Android 14 and above').",
          // governance:allow-em-dash (titolo ufficiale della fonte, EDITORIAL-CORE 9.2)
          en: "On Android 14 and above, Health Connect is a system app and is already installed. On Android 13 and below, search for 'Health Connect' in the Play Store and install the official Google app. Open it once to initialize the data store. Note: Garmin Connect's own Health Connect sharing option specifically requires Android 14 or above, so the Garmin Connect steps below do not apply on Android 13 and below (source: [Garmin Support — Sharing Your Garmin Connect Data With Health Connect](https://support.garmin.com/en-US/?faq=JToBEy0jfe6pIygark2Ui5): 'This feature is only available on Android 14 and above').",
          // governance:allow-em-dash (titolo ufficiale della fonte, EDITORIAL-CORE 9.2)
          es: "En Android 14 y versiones superiores, Health Connect es una aplicación del sistema y ya está instalada. En Android 13 o versiones anteriores, busca 'Health Connect' en la Play Store e instala la aplicación oficial de Google. Ábrela una vez para inicializar el almacén de datos. Nota: la opción de compartir datos con Health Connect integrada en el propio Garmin Connect requiere específicamente Android 14 o superior (fuente: [Garmin Support — Sharing Your Garmin Connect Data With Health Connect](https://support.garmin.com/en-US/?faq=JToBEy0jfe6pIygark2Ui5): 'This feature is only available on Android 14 and above').",
          // governance:allow-em-dash (titolo ufficiale della fonte, EDITORIAL-CORE 9.2)
          de: "Auf Android 14 und höher ist Health Connect eine System-App und bereits installiert. Auf Android 13 und niedriger suchst du im Play Store nach 'Health Connect' und installierst die offizielle Google-App. Öffne sie einmal, um die Datenspeicherung zu initialisieren. Hinweis: Die eigene Health-Connect-Freigabeoption von Garmin Connect erfordert speziell Android 14 oder höher (Quelle: [Garmin Support — Sharing Your Garmin Connect Data With Health Connect](https://support.garmin.com/en-US/?faq=JToBEy0jfe6pIygark2Ui5): 'This feature is only available on Android 14 and above').",
          pt: "No Android 14 ou superior, o Health Connect é um aplicativo do sistema e já está instalado. No Android 13 ou inferior, procure 'Health Connect' na Play Store e instale a aplicação oficial do Google. Abra-o uma vez para inicializar o armazenamento de dados. Observação: a própria opção de compartilhamento com o Health Connect dentro do Garmin Connect exige especificamente o Android 14 ou superior (fonte: [Garmin Support — Sharing Your Garmin Connect Data With Health Connect](https://support.garmin.com/en-US/?faq=JToBEy0jfe6pIygark2Ui5): 'This feature is only available on Android 14 and above').",
          fr: "Sur Android 14 et supérieur, Health Connect est une application système et est déjà installée. Sur Android 13 et inférieur, recherchez 'Health Connect' dans le Play Store et installez l’application officielle Google. Ouvrez-la une fois pour initialiser l’espace de stockage des données. Remarque : l'option de partage vers Health Connect intégrée à Garmin Connect lui-même nécessite spécifiquement Android 14 ou supérieur (source : [Garmin Support — Sharing Your Garmin Connect Data With Health Connect](https://support.garmin.com/en-US/?faq=JToBEy0jfe6pIygark2Ui5) : « This feature is only available on Android 14 and above »).",
          pl: "Na Androidzie 14 i nowszych Health Connect jest aplikacją systemową i jest już zainstalowany. Na Androidzie 13 i starszych wyszukaj 'Health Connect' w Play Store i zainstaluj oficjalną aplikację Google. Otwórz ją raz, aby zainicjować magazyn danych. Uwaga: własna opcja udostępniania danych do Health Connect w aplikacji Garmin Connect wymaga konkretnie systemu Android 14 lub nowszego (źródło: [Garmin Support — Sharing Your Garmin Connect Data With Health Connect](https://support.garmin.com/en-US/?faq=JToBEy0jfe6pIygark2Ui5): 'This feature is only available on Android 14 and above').",
          tr: "Android 14 ve üstünde Health Connect bir sistem uygulamasıdır ve zaten kuruludur. Android 13 ve altındaki cihazlarda Play Store'da 'Health Connect' arayın ve resmi Google uygulamasını kurun. Veri deposunu başlatmak için bir kez açın. Not: Garmin Connect'in kendi Health Connect paylaşım seçeneği özellikle Android 14 veya üstünü gerektirir (kaynak: [Garmin Support — Sharing Your Garmin Connect Data With Health Connect](https://support.garmin.com/en-US/?faq=JToBEy0jfe6pIygark2Ui5): 'This feature is only available on Android 14 and above').",
          // governance:allow-em-dash (titolo ufficiale della fonte, EDITORIAL-CORE 9.2)
          nl: "Op Android 14 en hoger is Health Connect een systeemapp en is deze al geïnstalleerd. Op Android 13 en lager, zoek in de Play Store naar 'Health Connect' en installeer de officiële Google-app. Open de app één keer om de gegevensopslag te initialiseren. Let op: de eigen Health Connect-deeloptie van Garmin Connect vereist specifiek Android 14 of hoger (bron: [Garmin Support — Sharing Your Garmin Connect Data With Health Connect](https://support.garmin.com/en-US/?faq=JToBEy0jfe6pIygark2Ui5): 'This feature is only available on Android 14 and above').",
          // governance:allow-em-dash (titolo ufficiale della fonte, EDITORIAL-CORE 9.2)
          ja: "Android 14以降では、Health Connectはシステムアプリとしてインストールされています。Android 13以前では、Play Storeで「Health Connect」を検索し、公式Googleアプリをインストールしてください。一度開いてデータストアを初期化してください。注：Garmin Connect自体のHealth Connect共有オプションを利用するには、Android 14以降が必要です(出典: [Garmin Support — Sharing Your Garmin Connect Data With Health Connect](https://support.garmin.com/en-US/?faq=JToBEy0jfe6pIygark2Ui5): 'This feature is only available on Android 14 and above')。",
          ko: "안드로이드 14 이상에서는 Health Connect가 시스템 앱으로 이미 설치되어 있습니다. 안드로이드 13 이하에서는 플레이 스토어에서 'Health Connect'를 검색하여 공식 Google 앱을 설치하세요. 한 번 열어 데이터 저장소를 초기화하세요. 참고: Garmin Connect 자체의 Health Connect 공유 옵션은 특별히 안드로이드 14 이상을 필요로 합니다 (출처: [Garmin Support — Sharing Your Garmin Connect Data With Health Connect](https://support.garmin.com/en-US/?faq=JToBEy0jfe6pIygark2Ui5): 'This feature is only available on Android 14 and above').",
        },
    },
    {
      type: "heading",
      level: 2,
      text: {
          it: "Passo 2: concedere permessi di scrittura a Garmin Connect",
          en: "Step 2: grant Garmin Connect write permissions",
          es: "Paso 2: otorgar permisos de escritura a Garmin Connect",
          de: "Schritt 2: Berechtigungen für Garmin Connect zur Schreiboperation gewähren",
          pt: "Passo 2: conceda permissões de gravação ao Garmin Connect",
          fr: "Étape 2 : accorder les permissions d’écriture à Garmin Connect",
          pl: "Krok 2: udziel Garmin Connect uprawnień do zapisu",
          tr: "Adım 2: Garmin Connect'e yazma izni verin",
          nl: "Stap 2: verlenen van schrijfrechten aan Garmin Connect",
          ja: "ステップ2: Garmin Connectに書き込み権限を授与",
          ko: "2단계: Garmin Connect 쓰기 권한 부여",
        },
    },
    {
      type: "list",
      ordered: true,
      items: {
          it: [
            "Aprire Garmin Connect sul telefono.",
            "Andare al menu principale (tre puntini o icona hamburger, in alto a sinistra).",
            "Toccare 'Health Connect' o cercarlo nelle impostazioni.",
            "Toccare 'Connetti' e concedere tutti i permessi richiesti: passi, sonno, frequenza cardiaca, dati di attività, misurazioni corporee.",
            "Garmin Connect inizierà a scrivere dati su Health Connect a partire da questo momento. Garmin non documenta se Garmin Connect invii anche i dati precedenti, né quanti e quando: non contarci.",
          ],
          en: [
            "Open Garmin Connect on your phone.",
            "Go to the main menu (three dots or hamburger icon, top left).",
            "Tap 'Health Connect' or search for it under Settings.",
            "Tap 'Connect' and grant all the requested permissions: steps, sleep, heart rate, activity data, body measurements.",
            "Garmin Connect will begin writing data to Health Connect from this point forward. Whether Garmin Connect also sends earlier data, and how much and when, is not documented by Garmin: don't count on it.",
          ],
          es: [
            "Abre Garmin Connect en tu teléfono.",
            "Ve al menú principal (tres puntos o icono hamburguesa, en la esquina superior izquierda).",
            "Toque 'Health Connect' o busquelo en Configuración.",
            "Toca 'Conectar' y concede todos los permisos solicitados: pasos, sueño, frecuencia cardíaca, datos de actividad, mediciones corporales.",
            "Garmin Connect empezará a escribir datos en Health Connect a partir de este momento. Garmin no documenta si Garmin Connect envía también datos anteriores, ni cuántos ni cuándo: no cuentes con ello.",
          ],
          de: [
            "Öffne Garmin Connect auf deinem Smartphone.",
            "Gehe zum Hauptmenü (drei Punkte oder Hamburger-Icon, links oben).",
            "Klicke auf 'Health Connect' oder suchst es in den Einstellungen.",
            "Tippen Sie auf 'Verbinden' und erteilen Sie alle angeforderten Berechtigungen: Schritte, Schlaf, Herzfrequenz, Aktivitätsdaten, Körpermessungen.",
            "Garmin Connect beginnt ab diesem Zeitpunkt, Daten in Health Connect zu schreiben. Ob Garmin Connect auch frühere Daten sendet, wie viele und wann, dokumentiert Garmin nicht: Verlassen Sie sich nicht darauf.",
          ],
          pt: [
            "Abra o Garmin Connect no seu telefone.",
            "Acesse o menu principal (três pontos ou ícone hambúrguer, canto superior esquerdo).",
            "Toque em 'Health Connect' ou procure por ele nas configurações.",
            "Toque em 'Conectar' e conceda todas as permissões solicitadas: passos, sono, frequência cardíaca, dados de atividade, medições corporais.",
            "O Garmin Connect começará a gravar dados no Health Connect a partir deste ponto. A Garmin não documenta se o Garmin Connect também envia dados anteriores, nem quantos nem quando: não conte com isso.",
          ],
          fr: [
            "Ouvrez Garmin Connect sur votre téléphone.",
            "Accédez au menu principal (trois points ou icône de hamburger, en haut à gauche).",
            "Cliquez sur 'Health Connect' ou recherchez-le dans les paramètres.",
            "Appuyez sur « Connecter » et accordez toutes les permissions demandées : pas, sommeil, fréquence cardiaque, données d'activité, mesures corporelles.",
            "Garmin Connect commencera à écrire des données dans Health Connect à partir de ce moment. Garmin ne documente pas si Garmin Connect envoie aussi des données antérieures, ni combien ni quand : n'y comptez pas.",
          ],
          pl: [
            "Otwórz Garmin Connect na swoim telefonie.",
            "Przejdź do głównego menu (trzy kropki lub ikona hamburgera, w lewym górnym rogu).",
            "Naciśnij 'Health Connect' lub wyszukaj go w ustawieniach.",
            "Naciśnij 'Połącz' i udziel wszystkich wymaganych uprawnień: kroki, sen, tętno, dane o aktywności, pomiary ciała.",
            "Garmin Connect zacznie zapisywać dane do Health Connect od tego momentu. Garmin nie dokumentuje, czy Garmin Connect wysyła również wcześniejsze dane, ani ile ich jest i kiedy: nie licz na to.",
          ],
          tr: [
            "Cihazınızda Garmin Connect'i açın.",
            "Ana menüye gidin (sol üstte üç nokta veya hamburger simgesi).",
            "'Health Connect'e dokunun veya ayarlar altında arayın.",
            "'Bağlan'a dokunun ve istenen tüm izinleri verin: adımlar, uyku, kalp atış hızı, etkinlik verileri, vücut ölçümleri.",
            "Garmin Connect bu andan itibaren Health Connect'e veri yazmaya başlar. Garmin Connect'in daha eski verileri de gönderip göndermediğini, ne kadarını ve ne zaman gönderdiğini Garmin belgelememiştir: buna güvenmeyin.",
          ],
          nl: [
            "Open Garmin Connect op je telefoon.",
            "Ga naar het hoofdmenu (drie punten of hamburgericoon, linksboven).",
            "Raak 'Health Connect' aan of zoeken hiernaar in de instellingen.",
            "Tik op 'Verbinden' en geef alle gevraagde toestemmingen: stappen, slaap, hartslag, activiteitsgegevens, lichaamsmetingen.",
            "Garmin Connect begint vanaf dit moment gegevens naar Health Connect te schrijven. Of Garmin Connect ook eerdere gegevens verstuurt, en hoeveel en wanneer, is door Garmin niet gedocumenteerd: reken er niet op.",
          ],
          ja: [
            "スマートフォンでGarmin Connectを開きます。",
            "メインメニューへ移動します（左上、3つの点またはハンバーガーアイコン）。",
            "「Health Connect」を開き、設定内に探してみてください。",
            "「Connect」をタップし、要求されたすべての権限(歩数、睡眠、心拍数、アクティビティデータ、体の測定値)を許可します。",
            "Garmin Connect はこの時点から Health Connect へのデータ書き込みを開始します。Garmin Connect が過去のデータも送るかどうか、その量やタイミングは Garmin が公表していません。期待しないでください。",
          ],
          ko: [
            "폰에서 Garmin Connect를 엽니다.",
            "메인 메뉴로 이동합니다 (좌측 상단의 세 개 점이나 햄버거 아이콘).",
            "'Health Connect'를 탭하거나 설정에서 검색합니다.",
            "'Connect'를 탭하고 요청된 모든 권한을 허용합니다: 걸음 수, 수면, 심박수, 활동 데이터, 신체 측정.",
            "Garmin Connect는 이 시점부터 Health Connect에 데이터를 쓰기 시작합니다. Garmin Connect가 이전 데이터도 보내는지, 얼마나 보내는지, 언제 보내는지는 Garmin이 공식적으로 밝히지 않았습니다. 기대하지 마세요.",
          ],
        },
    },
    {
      type: "heading",
      level: 2,
      text: {
          it: "Passo 3: concedere permessi di lettura a Samsung Health",
          en: "Step 3: grant Samsung Health read permissions",
          es: "Paso 3: otorgar permisos de lectura a Samsung Health",
          de: "Schritt 3: Berechtigungen für Samsung Health zur Leseposition gewähren",
          pt: "Passo 3: conceda permissões de leitura ao Samsung Health",
          fr: "Étape 3 : accorder les permissions d’lecture à Samsung Health",
          pl: "Krok 3: udziel Samsung Health uprawnień do odczytu",
          tr: "Adım 3: Samsung Health'e okuma izni verin",
          nl: "Stap 3: leesrechten verlenen aan Samsung Health",
          ja: "ステップ3: Samsung Healthに読み込み権限を授与",
          ko: "3단계: Samsung Health 읽기 권한 부여",
        },
    },
    {
      type: "list",
      ordered: true,
      items: {
          it: [
            "Aprire Samsung Health.",
            "Toccare il proprio icona profilo (in alto a destra) e andare nelle impostazioni.",
            "Toccare 'Servizi connessi' o 'Health Connect'.",
            "Abilitare Health Connect e concedere a Samsung Health il permesso di leggere i passi, il sonno, il tasso di battito cardiaco e i dati sull'attività.",
            "Aprire l'applicazione di sistema Health Connect e verificare che Samsung Health appaia nelle 'Permessi delle applicazioni' con accesso in lettura.",
          ],
          en: [
            "Open Samsung Health.",
            "Tap your profile icon (top right) and go to Settings.",
            "Tap 'Connected services' or 'Health Connect'.",
            "Enable Health Connect and grant Samsung Health permission to read steps, sleep, heart rate, and activity data.",
            "Open the Health Connect system app and verify Samsung Health appears under 'App permissions' with read access.",
          ],
          es: [
            "Abre Samsung Health.",
            "Toque el icono de tu perfil (en la esquina superior derecha) y ve a Configuración.",
            "Toque 'Servicios conectados' o 'Health Connect'.",
            "Habilita Health Connect y otorga a Samsung Health permiso para leer pasos, sueño, frecuencia cardíaca e información de actividad.",
            "Abre la aplicación del sistema Health Connect y verifica que Samsung Health aparezca en 'Permisos de aplicaciones' con acceso de lectura.",
          ],
          de: [
            "Öffne Samsung Health.",
            "Klicke auf dein Profilicon (rechts oben) und gehe zu den Einstellungen.",
            "Klicke auf 'Verbunddienste' oder 'Health Connect'.",
            "Aktiviere Health Connect und gewähre Samsung Health die Berechtigung zur Leseposition für Schritte, Schlaf, Herzfrequenz und Aktivitätsdaten.",
            "Öffne das Systemapp-Health Connect und überprüfe, dass Samsung Health unter 'App-Berechtigungen' mit Leseberechtigungen aufgeführt ist.",
          ],
          pt: [
            "Abra o Samsung Health.",
            "Toque no ícone do seu perfil (canto superior direito) e acesse as configurações.",
            "Toque em 'Serviços conectados' ou 'Health Connect'.",
            "Habilite o Health Connect e conceda ao Samsung Health permissão para ler passos, sono, frequência cardíaca e dados de atividade.",
            "Abra o aplicativo do sistema Health Connect e verifique se o Samsung Health aparece nas 'Permissões de aplicativos' com acesso de leitura.",
          ],
          fr: [
            "Ouvrez Samsung Health.",
            "Cliquez sur votre icône de profil (en haut à droite) et accédez aux paramètres.",
            "Cliquez sur 'Services connectés' ou 'Health Connect'.",
            "Activez Health Connect et accordez à Samsung Health la permission d’lecture des pas, du sommeil, du taux cardiaque et des données d’activité.",
            "Ouvrez l’application système Health Connect et vérifiez que Samsung Health apparaît dans 'Permissions des applications' avec accès en lecture.",
          ],
          pl: [
            "Otwórz Samsung Health.",
            "Naciśnij ikonę profilu (w prawym górnym rogu) i przejdź do ustawień.",
            "Naciśnij 'Usługi połączone' lub 'Health Connect'.",
            "Włącz Health Connect i udziel Samsung Health uprawnień do odczytu kroków, snu, częstotliwości serca oraz danych aktywności.",
            "Otwórz aplikację systemową Health Connect i sprawdź, czy Samsung Health pojawia się w sekcji 'Uprawnienia aplikacji' z uprawnieniami do odczytu.",
          ],
          tr: [
            "Samsung Health'i açın.",
            "Profil simgesine (sağ üst köşede) dokunun ve Ayarlar'a gidin.",
            "'Bağlı hizmetler' veya 'Health Connect'e dokunun.",
            "Health Connect'i etkinleştirin ve Samsung Health'e adımlar, uyku, kalp hızı ve etkinlik verilerini okuma izni verin.",
            "Health Connect sistem uygulamasını açın ve Samsung Health'in 'Uygulama izinleri' altında okuma iznine sahip olduğunu kontrol edin.",
          ],
          nl: [
            "Open Samsung Health.",
            "Raak je profielericoan (rechtsboven) aan en ga naar de instellingen.",
            "Raakt 'Verbonden diensten' of 'Health Connect' aan.",
            "Schakel Health Connect in en verlenen Samsung Health toestemming om stappen, slaap, hartslag en activiteitengegevens te lezen.",
            "Open de systeemapp Health Connect en controleer of Samsung Health onder 'App toegang' met leesrechten verschijnt.",
          ],
          ja: [
            "Samsung Healthを開きます。",
            "プロファイルアイコン（右上）をタップし、設定へ移動します。",
            "「連携サービス」または「Health Connect」をタップします。",
            "Health Connectを有効にし、ステップ数、睡眠時間、心拍数、活動データの読み込み権限を与えてください。",
            "Health Connectシステムアプリを開き、Samsung Healthが「アプリ権限」リストに表示され、読み込みアクセスがあることを確認します。",
          ],
          ko: [
            "Samsung Health를 오픈합니다.",
            "프로필 아이콘(우측 상단)을 탭하고 설정으로 이동합니다.",
            "'연결된 서비스' 또는 'Health Connect'를 탭합니다.",
            "Health Connect를 활성화하고 Samsung Health에 걸음 수, 수면, 심박수, 활동 데이터를 읽을 수 있는 권한을 부여합니다.",
            "Health Connect 시스템 앱을 열고 Samsung Health가 '앱 권한' 목록에 읽기 권한이 있는지 확인합니다.",
          ],
        },
    },
    {
      type: "heading",
      level: 2,
      text: {
          it: "Passo 4: verificare la sincronizzazione",
          en: "Step 4: verify the sync is working",
          es: "Paso 4: verificar que la sincronización esté funcionando",
          de: "Schritt 4: Überprüfung der Synchronisierung",
          pt: "Passo 4: verifique se a sincronização está funcionando",
          fr: "Étape 4 : vérifier le bon fonctionnement de la synchronisation",
          pl: "Krok 4: zweryfikuj poprawność synchronizacji",
          tr: "Adım 4: senkronizasyonun çalıştığını doğrulayın",
          nl: "Stap 4: controleren van de synchronisatie",
          ja: "ステップ4: 同期が正しく動作しているか確認",
          ko: "4단계: 동기화 작동 여부 확인",
        },
    },
    {
      type: "list",
      items: {
          it: [
            "Assicurati che il tuo dispositivo Garmin si sia sincronizzato almeno una volta con l'app Garmin Connect, poi apri Samsung Health: la sincronizzazione non è garantita semplicemente aspettando.",
            "Aprire Samsung Health e navigare inattività. Dovresti vedere i conteggi passo dal tuo dispositivo Garmin.",
            "Controllare lo schermo principale di Samsung Health per i dati del sonno. Se hai dormito con il tuo dispositivo Garmin, le fasi della notte precedente dovrebbero apparire.",
            "Se i dati sono mancanti, aprire Health Connect, andare a 'Dati e accesso' e verificare che Garmin Connect sia elencato come fonte di dati con permessi di scrittura per ogni tipo di dato aspettato.",
          ],
          en: [
            "Make sure your Garmin device has synced with the Garmin Connect app at least once, then open Samsung Health: sync isn't guaranteed by simply waiting.",
            "Open Samsung Health and navigate to Activity. You should see step counts from your Garmin device.",
            "Check the Samsung Health home screen for sleep data. If you slept with your Garmin device, last night's stages should appear.",
            "If data is missing, open Health Connect, go to 'Data and access', and check that Garmin Connect is listed as a data source with write permissions for each data type you expect.",
          ],
          es: [
            "Asegúrate de que tu dispositivo Garmin se haya sincronizado al menos una vez con la app Garmin Connect, y luego abre Samsung Health: la sincronización no está garantizada por el simple hecho de esperar.",
            "Abre Samsung Health y navega a Actividad. Deberías ver los conteos de pasos desde tu dispositivo Garmin.",
            "Revisa la pantalla principal de Samsung Health para datos de sueño. Si dormiste con tu dispositivo Garmin, las fases de la noche pasada deberían aparecer.",
            "Si falta algún dato, abre Health Connect, ve a 'Datos y acceso' e inspecciona que Garmin Connect esté listado como fuente de datos con permisos de escritura para cada tipo de dato esperado.",
          ],
          de: [
            "Stellen Sie sicher, dass sich Ihr Garmin-Gerät mindestens einmal mit der Garmin-Connect-App synchronisiert hat, und öffnen Sie dann Samsung Health — die Synchronisierung ist nicht allein durch Warten garantiert.",
            "Öffne Samsung Health und navigiere zur Aktivität. Du solltest Schrittzähldaten von deinem Garmin-Gerät sehen.",
            "Überprüfe das Samsung-Health-Homescreen auf Schlafdaten. Wenn du letzte Nacht mit deinem Garmin-Gerät geschlafen hast, sollten die Stadien des letzten Nachts erscheinen.",
            "Wenn Daten fehlen, öffne Health Connect, gehe zu 'Daten und Zugriff' und überprüfe, dass Garmin Connect als Datenquelle mit Schreibberechtigungen für jede erwartete Datentypen aufgeführt ist.",
          ],
          pt: [
            "Certifique-se de que seu dispositivo Garmin já tenha sincronizado com o app Garmin Connect pelo menos uma vez e, em seguida, abra o Samsung Health — a sincronização não é garantida apenas esperando.",
            "Abra o Samsung Health e navegue para Atividade. Você deve ver os contadores de passos do seu dispositivo Garmin.",
            "Verifique a tela inicial do Samsung Health pela data do sono. Se você dormiu com seu dispositivo Garmin, as fases da noite passada devem aparecer.",
            "Se os dados estiverem ausentes, abra o Health Connect, vá para 'Dados e acesso', e verifique se o Garmin Connect está listado como uma fonte de dados com permissões de gravação para cada tipo de dado que você espera.",
          ],
          fr: [
            "Assurez-vous que votre appareil Garmin s'est synchronisé au moins une fois avec l'application Garmin Connect, puis ouvrez Samsung Health — la synchronisation n'est pas garantie en attendant simplement.",
            "Ouvrez Samsung Health et accédez à l’activité. Vous devriez voir le nombre de pas provenant de votre appareil Garmin.",
            "Vérifiez l’écran d’accueil de Samsung Health pour les données du sommeil. Si vous avez dormi avec votre appareil Garmin, les étapes de la nuit dernière devraient apparaître.",
            "Si des données manquent, ouvrez Health Connect, accédez à 'Données et accès', et vérifiez que Garmin Connect est listé en tant qu’origine de données avec les permissions d’écriture pour chaque type de donnée que vous attendez.",
          ],
          pl: [
            "Upewnij się, że Twoje urządzenie Garmin zsynchronizowało się przynajmniej raz z aplikacją Garmin Connect, a następnie otwórz Samsung Health — samo czekanie nie gwarantuje synchronizacji.",
            "Otwórz Samsung Health i przejdź do Aktywności. Powinieneś zobaczyć liczbę kroków z twojego urządzenia Garmin.",
            "Sprawdź ekran główny Samsung Health pod kątem danych snu. Jeśli spałeś z urządzeniem Garmin, powinny pojawić się fazy z ostatniej nocy.",
            "Jeśli brakuje danych, otwórz Health Connect, przejdź do 'Dane i dostęp' i sprawdź, czy Garmin Connect jest wymieniony jako źródło danych z uprawnieniami do zapisu dla każdego oczekiwanego typu danych.",
          ],
          tr: [
            "Garmin cihazınızın Garmin Connect uygulamasıyla en az bir kez senkronize olduğundan emin olun, ardından Samsung Health'i açın — senkronizasyon yalnızca beklemekle garanti edilmez.",
            "Samsung Health'i açın ve Faaliyet bölümüne gidin. Garmin cihazınızdan gelen adım sayılarını görmelisiniz.",
            "Samsung Health ana ekranında uyku verilerini kontrol edin. Garmin cihazınızla uyuduysanız, önceki gecenin uyku evreleri görünmelidir.",
            "Veri eksikse Health Connect'i açın, 'Veri ve erişim'e gidin ve Garmin Connect'in beklediğiniz her veri türü için yazma izniyle birlikte veri kaynağı olarak listelendiğini kontrol edin.",
          ],
          nl: [
            "Zorg ervoor dat je Garmin-apparaat minstens één keer heeft gesynchroniseerd met de Garmin Connect-app, en open dan Samsung Health — synchronisatie is niet gegarandeerd door simpelweg te wachten.",
            "Open Samsung Health en ga naar Activiteit. Je zou stapsommen van je Garmin-apparaat moeten zien.",
            "Controleer de Samsung Health-hoofdscherm op slaapgegevens. Als je vannacht geslapen hebt met je Garmin-apparaat, zouden de fasen van gisteravond verschijnen.",
            "Als gegevens ontbreken, open Health Connect, ga naar 'Gegevens en toegang' en controleer of Garmin Connect als gegevensbron is vermeld met schrijfrechten voor elke gegevenssoort die je verwacht.",
          ],
          ja: [
            "Garminデバイスが少なくとも一度Garmin Connectアプリと同期していることを確認してから、Samsung Healthを開いてください。ただ待つだけでは同期は保証されません。",
            "Samsung Healthを開き、活動へ移動します。Garminデバイスの歩数が表示されていることを確認してください。",
            "Samsung Healthのホーム画面で睡眠データをチェックします。昨夜のステージは Garmin デバイスで寝た場合に表示されます。",
            "データが欠けている場合は、Health Connectを開き、「データとアクセス」へ移動し、各予想されるデータタイプに対する書き込み権限を持つGarmin Connectがリストにあることを確認します。",
          ],
          ko: [
            "Garmin 기기가 Garmin Connect 앱과 최소 한 번 동기화되었는지 확인한 후 삼성 건강을 여세요 — 단순히 기다린다고 동기화가 보장되지는 않습니다.",
            "Samsung Health를 오픈하고 활동으로 이동하세요. Garmin 장치의 걸음 수가 표시되어야 합니다.",
            "Samsung Health 홈 화면에서 수면 데이터를 확인하세요. 어젯밤 Garmin 장치를 착용하고 잤다면 수면 단계가 나타나야 합니다.",
            "데이터가 누락된다면, Health Connect를 열고 '데이터 및 접근'으로 이동하여 Garmin Connect가 기대하는 모든 데이터 유형에 대해 쓰기 권한이 있는지 확인하세요.",
          ],
        },
    },
    {
      type: "callout",
      variant: "warning",
      title: {
          it: "Dati duplicati se utilizzi sia un dispositivo Garmin che un Galaxy Watch",
          en: "Duplicate data if you use both a Garmin device and a Galaxy Watch",
          es: "Datos duplicados si utilizas tanto un dispositivo Garmin como un Galaxy Watch",
          de: "Duplizierte Daten bei der Nutzung eines Garmin-Geräts und einer Galaxy-Watch",
          pt: "Dados duplicados se você usar tanto um dispositivo Garmin quanto um Galaxy Watch",
          fr: "Données dupliquées si vous utilisez à la fois un appareil Garmin et une Galaxy Watch",
          pl: "Zduplikowane dane w przypadku użycia zarówno urządzenia Garmin, jak i Galaxy Watch",
          tr: "Hem bir Garmin cihazı hem de bir Galaxy Watch kullanıyorsanız veriler çiftlenir",
          nl: "Dubbele gegevens als u zowel een Garmin-apparaat gebruikt als een Galaxy Watch",
          ja: "Garmin 機器と Galaxy Watch を併用する場合のデータ重複",
          ko: "Garmin 기기와 갤럭시 워치를 함께 사용하는 경우 데이터가 중복될 수 있음",
        },
      body: {
          it: "Se entrambi i dispositivi sono attivi, Health Connect riceverà dati da entrambi. Alcune app eliminano i duplicati per fonte e priorità, ma in alcuni punti potresti vedere conteggi doppi. In FitMesh puoi indicare la fonte preferita per i passi.",
          en: "If both devices are active, Health Connect will receive data from both. Some apps deduplicate by source and priority, but you may see double counts in some places. In FitMesh, you can set the preferred source for steps.",
          es: "Si ambos dispositivos están activos, Health Connect recibirá datos de ambos. Algunas aplicaciones eliminan los duplicados por fuente y prioridad, pero en algunos lugares podrías ver recuentos dobles. En FitMesh puedes indicar la fuente preferida para los pasos.",
          de: "Wenn beide Geräte aktiv sind, erhält Health Connect Daten von beiden. Manche Apps entfernen Duplikate nach Quelle und Priorität, aber an einigen Stellen können doppelte Zahlen auftauchen. In FitMesh können Sie die bevorzugte Quelle für Schritte festlegen.",
          pt: "Se ambos os dispositivos estiverem ativos, o Health Connect receberá dados de ambos. Algumas apps eliminam duplicados por fonte e prioridade, mas você pode ver contagens duplas em alguns lugares. No FitMesh, você pode indicar a fonte preferida para os passos.",
          fr: "Si les deux appareils sont actifs, Health Connect recevra des données de chacun. Certaines applications éliminent les doublons par source et priorité, mais vous pourriez voir des doubles à certains endroits. Dans FitMesh, vous pouvez indiquer la source préférée pour les pas.",
          pl: "Jeśli oba urządzenia są aktywne, Health Connect otrzyma dane z obu. Niektóre aplikacje usuwają duplikaty według źródła i priorytetu, ale w niektórych miejscach możesz zobaczyć podwójne wartości. W FitMesh możesz wskazać preferowane źródło kroków.",
          tr: "Her iki cihaz da aktifse, Health Connect her ikisinden de veri alır. Bazı uygulamalar yinelenenleri kaynağa ve önceliğe göre eler ancak bazı yerlerde çift sayımlar görebilirsiniz. FitMesh'te adımlar için tercih ettiğiniz kaynağı belirleyebilirsiniz.",
          nl: "Als beide apparaten actief zijn, ontvangt Health Connect gegevens van beide. Sommige apps verwijderen dubbele gegevens op basis van bron en prioriteit, maar u kunt op sommige plaatsen dubbele tellingen zien. In FitMesh kunt u de voorkeursbron voor stappen aanwijzen.",
          ja: "両方のデバイスが有効な場合、Health Connect は両方からデータを受信します。一部のアプリはソースと優先順位によって重複を削除しますが、場所によっては二重にカウントされることがあります。FitMesh では、歩数について優先するソースを指定できます。",
          ko: "두 기기가 모두 활성 상태이면 Health Connect는 양쪽 모두에서 데이터를 받습니다. 일부 앱은 소스와 우선순위에 따라 중복을 제거하지만, 일부 화면에서는 수치가 두 배로 보일 수 있습니다. FitMesh에서는 걸음 수에 우선할 소스를 지정할 수 있습니다.",
        },
    },
    {
      type: "heading",
      level: 2,
      text: {
          it: "Risolvere problemi comuni di sincronizzazione",
          en: "Troubleshooting: common sync problems",
          es: "Solución de problemas: problemas comunes de sincronización",
          de: "Problembehandlung: häufige Synchronisationsprobleme",
          pt: "Resolvendo problemas: problemas comuns de sincronização",
          fr: "Résolution de problèmes : les problèmes de synchronisation courants",
          pl: "Rozwiązywanie problemów: najczęściej występujące problemy z synchronizacją",
          tr: "Sorun giderme: yaygın senkronizasyon sorunları",
          nl: "Probleemoplossing: algemene synchroonproblemen",
          ja: "トラブルシューティング：一般的な同期問題",
          ko: "문제 해결: 흔한 동기화 문제",
        },
    },
    {
      type: "list",
      items: {
          it: [
            "**Dati non apparsi in Samsung Health:** controlla che entrambe le app siano escluse dall'ottimizzazione della batteria. Android può limitare le app in background, e questo può ritardare o fermare la sincronizzazione. Nome e posizione dell'impostazione dipendono dalla marca del telefono e dalla versione di Android.",
            "**Garmin Connect visualizza 'Health Connect non disponibile':** aggiorna entrambi Garmin Connect e Health Connect alla versione più recente.",
            "**Passi doppi in Samsung Health:** potresti avere sia il contatore di passi incorporato in Samsung Health che Garmin che scrivono i passi nello stesso momento. Disabilita la tracciatura dei propri passi in Samsung Health nelle impostazioni per utilizzare Garmin come unica fonte.",
            "**Allenamenti non apparsi:** l'elenco di Garmin cita dati di attività come distanza, velocità e frequenza cardiaca, ma non una seduta di allenamento a parte. In Health Connect controlla che Garmin Connect possa scrivere ogni tipo di dato che ti aspetti. Non abbiamo una fonte Garmin che dica che la seduta stessa debba comparire.",
          ],
          en: [
            "**Data not appearing in Samsung Health:** check that both apps are excluded from battery optimization. Android can restrict background apps, which can delay or stop sync. The name and location of the setting depend on the phone brand and the Android version.",
            "**Garmin Connect shows 'Health Connect unavailable':** update both Garmin Connect and Health Connect to the latest version.",
            "**Steps doubled in Samsung Health:** you may have both Samsung Health's built-in step counter and Garmin writing steps at the same time. Disable Samsung Health's own step tracking under Settings to use Garmin as the single source.",
            "**Workouts not appearing:** Garmin's list names activity data such as distance, speed and heart rate, but not a separate workout session. In Health Connect, check that Garmin Connect may write each data type you expect. We have no Garmin source saying that a workout session itself should appear.",
          ],
          es: [
            "**Datos que no aparecen en Samsung Health:** comprueba que ambas apps estén excluidas de la optimización de batería. Android puede restringir las apps en segundo plano, y eso puede retrasar o detener la sincronización. El nombre y la ubicación del ajuste dependen de la marca del teléfono y de la versión de Android.",
            "**Garmin Connect muestra 'Health Connect no disponible':** actualiza tanto Garmin Connect como Health Connect a la última versión.",
            "**Pasos duplicados en Samsung Health:** podrías tener tanto el contador de pasos incorporado de Samsung Health y Garmin escribiendo pasos al mismo tiempo. Desactiva el seguimiento de pasos propio de Samsung Health en Ajustes para usar Garmin como fuente única.",
            "**Entrenamientos que no aparecen:** la lista de Garmin cita datos de actividad como distancia, velocidad y frecuencia cardíaca, pero no una sesión de entrenamiento aparte. En Health Connect, comprueba que Garmin Connect pueda escribir cada tipo de dato que esperas. No tenemos ninguna fuente de Garmin que diga que la sesión en sí deba aparecer.",
          ],
          de: [
            "**Daten erscheinen nicht in Samsung Health:** Prüfen Sie, ob beide Apps von der Akkuoptimierung ausgenommen sind. Android kann Apps im Hintergrund einschränken, was die Synchronisierung verzögern oder stoppen kann. Name und Ort der Einstellung hängen von der Marke des Telefons und der Android-Version ab.",
            "**Garmin Connect zeigt 'Health Connect nicht verfügbar':** aktualisieren Sie sowohl Garmin Connect als auch Health Connect auf die neueste Version.",
            "**Schritte verdoppelt in Samsung Health:** Sie haben möglicherweise sowohl den integrierten Schrittzähler von Samsung Health als auch einen Schrittzähler von Garmin aktiv. Deaktivieren Sie unter Einstellungen den eigenen Schrittzählen von Samsung Health, um Garmin zu verwenden, als einzige Quelle.",
            "**Trainings erscheinen nicht:** Die Garmin-Liste nennt Aktivitätsdaten wie Strecke, Geschwindigkeit und Herzfrequenz, aber keine eigene Trainingseinheit. Prüfen Sie in Health Connect, ob Garmin Connect jeden erwarteten Datentyp schreiben darf. Wir haben keine Garmin-Quelle, die besagt, dass die Trainingseinheit selbst erscheinen muss.",
          ],
          pt: [
            "**Dados que não aparecem no Samsung Health:** verifique se os dois apps estão excluídos da otimização de bateria. O Android pode restringir apps em segundo plano, e isso pode atrasar ou interromper a sincronização. O nome e o local da configuração dependem da marca do telefone e da versão do Android.",
            "**Garmin Connect mostra 'Health Connect indisponível':** atualize tanto o Garmin Connect quanto a Health Connect para as últimas versões.",
            "**Passos duplicados no Samsung Health:** você pode ter tanto o contador de passos integrado do Samsung Health quanto o Garmin escrevendo passos ao mesmo tempo. Desabilite o rastreamento de passos próprio do Samsung Health nas Configurações para usar apenas o Garmin como fonte única.",
            "**Treinos que não aparecem:** a lista da Garmin cita dados de atividade como distância, velocidade e frequência cardíaca, mas não uma sessão de treino à parte. No Health Connect, verifique se o Garmin Connect pode gravar cada tipo de dado que você espera. Não temos nenhuma fonte da Garmin que diga que a sessão em si deva aparecer.",
          ],
          fr: [
            "**Données qui n'apparaissent pas dans Samsung Health :** vérifiez que les deux applications sont exclues de l'optimisation de la batterie. Android peut restreindre les applications en arrière-plan, ce qui peut retarder ou arrêter la synchronisation. Le nom et l'emplacement du réglage dépendent de la marque du téléphone et de la version d'Android.",
            "**Garmin Connect affiche 'Health Connect indisponible' :** mettez à jour à la dernière version tant Garmin Connect que Health Connect.",
            "**Pas de doubles dans Samsung Health :** vous pourriez avoir à la fois le compteur de pas intégré de Samsung Health et Garmin qui enregistre les pas en même temps. Désactivez le suivi des pas de Samsung Health dans Paramètres afin d'utiliser Garmin comme source unique.",
            "**Entraînements qui n'apparaissent pas :** la liste de Garmin cite des données d'activité comme la distance, la vitesse et la fréquence cardiaque, mais pas une séance d'entraînement à part. Dans Health Connect, vérifiez que Garmin Connect peut écrire chaque type de donnée que vous attendez. Nous n'avons aucune source Garmin indiquant que la séance elle-même doive apparaître.",
          ],
          pl: [
            "**Dane nie pojawiają się w Samsung Health:** sprawdź, czy obie aplikacje są wyłączone z optymalizacji baterii. Android może ograniczać aplikacje działające w tle, co może opóźnić lub zatrzymać synchronizację. Nazwa i położenie ustawienia zależą od marki telefonu i wersji Androida.",
            "**Garmin Connect pokazuje 'Health Connect niedostępny':** zaktualizuj zarówno Garmin Connect, jak i Health Connect do najnowszej wersji.",
            "**Kroki podwójne w Samsung Health:** możesz mieć jednocześnie włączony wbudowany licznik kroków w Samsung Health oraz zapis kroków przez Garmin. Wyłącz własne śledzenie kroków w ustawieniach Samsung Health, aby używać Garmin jako jedynego źródła.",
            "**Treningi nie pojawiają się:** lista Garmin wymienia dane o aktywności, takie jak dystans, prędkość i tętno, ale nie osobną sesję treningową. W Health Connect sprawdź, czy Garmin Connect może zapisywać każdy oczekiwany typ danych. Nie mamy źródła Garmin, które mówiłoby, że sama sesja treningowa powinna się pojawić.",
          ],
          tr: [
            "**Veriler Samsung Health'te görünmüyor:** her iki uygulamanın da pil optimizasyonundan hariç tutulduğunu kontrol edin. Android arka plandaki uygulamaları kısıtlayabilir; bu da senkronizasyonu geciktirebilir veya durdurabilir. Ayarın adı ve konumu telefon markasına ve Android sürümüne göre değişir.",
            "**Garmin Connect'te 'Health Connect mevcut değil' mesajı görünüyor:** Garmin Connect ve Health Connect'i en son sürümüne güncelleyin.",
            "**Samsung Health'te adımlar iki kat gösteriliyor:** Samsung Health'in kendi adım sayacıyla aynı anda Garmin'in de adım yazıyor olması bundan kaynaklanabilir. Garmin'i tek kaynak olarak kullanmak için Ayarlar'dan Samsung Health'in kendi adım takibini devre dışı bırakın.",
            "**Antrenmanlar görünmüyor:** Garmin'in listesi mesafe, hız ve kalp atış hızı gibi etkinlik verilerini anar, ancak ayrı bir antrenman oturumunu anmaz. Health Connect'te Garmin Connect'in beklediğiniz her veri türünü yazabildiğini kontrol edin. Antrenman oturumunun kendisinin görünmesi gerektiğini söyleyen bir Garmin kaynağımız yok.",
          ],
          nl: [
            "**Gegevens verschijnen niet in Samsung Health:** controleer of beide apps zijn uitgesloten van batterijoptimalisatie. Android kan apps op de achtergrond beperken, waardoor de synchronisatie kan vertragen of stoppen. De naam en locatie van de instelling hangen af van het merk telefoon en de Android-versie.",
            "**Garmin Connect toont 'Health Connect on beschikbaar':** update zowel Garmin Connect als Health Connect naar de nieuwste versie.",
            "**Stappen dubbel in Samsung Health:** u heeft mogelijk zowel de ingebouwde stappjescounter van Samsung Health en Garmin die tegelijkertijd stappen schrijft. Uitgeschakelde eigen stappentracking onder Instellingen in Samsung Health om te gebruiken als enige bron.",
            "**Trainingen verschijnen niet:** de lijst van Garmin noemt activiteitsgegevens zoals afstand, snelheid en hartslag, maar geen afzonderlijke trainingssessie. Controleer in Health Connect of Garmin Connect elk verwacht gegevenstype mag schrijven. We hebben geen Garmin-bron die zegt dat de sessie zelf zou moeten verschijnen.",
          ],
          ja: [
            "**Samsung Health にデータが表示されない場合:**両方のアプリがバッテリー最適化の対象外になっているか確認してください。Android はバックグラウンドのアプリを制限することがあり、同期が遅れたり止まったりする場合があります。設定の名前と場所は、端末のメーカーと Android のバージョンによって異なります。",
            "**Garmin Connectに“ヘルスコネクトが利用できません”と表示される場合:**両方のGarmin Connectとヘルスコネクトを最新バージョンに更新してください。",
            "**サムスンヘルスで歩数が重複する場合:**あなたはSamsung Healthの内蔵歩数計と同時にGarminが歩数を記録している可能性があります。設定からSamsung Healthの自宅歩数トラッキングを無効にして、Garminを使用して単一ソースにします。",
            "**ワークアウトが表示されない場合:**Garmin の一覧には距離、速度、心拍数などのアクティビティデータが挙げられていますが、独立したワークアウトセッションは挙げられていません。Health Connect で、Garmin Connect が期待するすべてのデータタイプを書き込めることを確認してください。セッション自体が表示されるはずだと述べる Garmin の情報源はありません。",
          ],
          ko: [
            "**Samsung Health에 데이터가 표시되지 않는 경우:** 두 앱 모두 배터리 최적화에서 제외되어 있는지 확인하세요. Android는 백그라운드 앱을 제한할 수 있으며, 그러면 동기화가 늦어지거나 멈출 수 있습니다. 설정의 이름과 위치는 휴대폰 제조사와 Android 버전에 따라 다릅니다.",
            "**Garmin Connect에 'Health Connect를 사용할 수 없음'이라고 표시되는 경우:** Garmin Connect와 Health Connect를 모두 최신 버전으로 업데이트하세요.",
            "**Samsung Health에서 걸음 수가 두 배로 표시되는 경우:** Samsung Health의 내장 걸음 수 측정 기능과 Garmin이 동시에 걸음 수를 기록하고 있을 수 있습니다. 설정에서 Samsung Health 자체의 걸음 수 추적을 비활성화하여 Garmin을 유일한 소스로 사용하세요.",
            "**운동 기록이 표시되지 않는 경우:** Garmin의 목록에는 거리, 속도, 심박수 같은 활동 데이터가 있지만 별도의 운동 세션은 없습니다. Health Connect에서 Garmin Connect가 기대하는 모든 데이터 유형을 쓸 수 있는지 확인하세요. 운동 세션 자체가 나타나야 한다고 밝힌 Garmin 자료는 없습니다.",
          ],
        },
    },
    {
      // P1.9 FASE 3/4 (2026-09-01): sostituisce il blocco "cta" (P1.8A) —
      // stessa posizione, stesso claim di base (lettura generica da Health
      // Connect + attribuzione fonte), ora con CTA store-aware e link
      // secondario alla landing Garmin. Contratto "troubleshooting": FitMesh
      // organizza, non ripara la sincronizzazione Garmin/Samsung a monte.
      type: "fitmesh-editorial-cta",
      contentCluster: "garmin_samsung_health",
      placement: "article_end",
      title: {
        it: "Vedi i tuoi dati Garmin e Samsung in un solo posto",
        en: "See your Garmin and Samsung data in one place",
        es: "Ve tus datos de Garmin y Samsung en un solo lugar",
        de: "Ihre Garmin- und Samsung-Daten an einem Ort",
        pt: "Veja os seus dados Garmin e Samsung num só lugar",
        fr: "Voyez vos données Garmin et Samsung au même endroit",
        pl: "Zobacz swoje dane Garmin i Samsung w jednym miejscu",
        tr: "Garmin ve Samsung verilerinizi tek bir yerde görün",
        nl: "Zie je Garmin- en Samsung-gegevens op één plek",
        ja: "GarminとSamsungのデータをひとつの場所で",
        ko: "Garmin과 Samsung 데이터를 한 곳에서",
        // ADDENDUM P1.9 (2026-09-01): stesso motivo di health-connect-not-syncing.ts —
        // sv/da mancavano qui pur essendo l'articolo già indicizzabile in
        // entrambe le locale (overlay nordico), producendo fallback EN
        // silenzioso nel modulo dentro una pagina altrimenti completa.
        sv: "Se dina Garmin- och Samsung-data på ett ställe",
        da: "Se dine Garmin- og Samsung-data ét sted",
      },
      body: {
        it: "FitMesh non risolve i doppioni o i ritardi tra Garmin Connect e Samsung Health a monte: quello resta un problema di configurazione dei due. Ma legge ciò che entrambe le app scrivono in Health Connect e mostra i dati di entrambi i dispositivi in un'unica vista.",
        en: "FitMesh doesn't fix duplicate or delayed data between Garmin Connect and Samsung Health upstream: that stays a configuration issue between the two. But it reads what both apps write to Health Connect and shows both devices' data in one view.",
        es: "FitMesh no soluciona los datos duplicados o retrasados entre Garmin Connect y Samsung Health en origen: eso sigue siendo un problema de configuración entre ambos. Pero lee lo que las dos apps escriben en Health Connect y muestra los datos de ambos dispositivos en una sola vista.",
        de: "FitMesh behebt keine doppelten oder verzögerten Daten zwischen Garmin Connect und Samsung Health an der Quelle: Das bleibt ein Konfigurationsproblem zwischen den beiden. Es liest aber, was beide Apps in Health Connect schreiben, und zeigt die Daten beider Geräte in einer Ansicht.",
        pt: "O FitMesh não resolve dados duplicados ou atrasados entre o Garmin Connect e o Samsung Health na origem: isso continua sendo um problema de configuração entre os dois. Mas ele lê o que os dois apps gravam no Health Connect e mostra os dados dos dois dispositivos em uma só visualização.",
        fr: "FitMesh ne corrige pas les données dupliquées ou retardées entre Garmin Connect et Samsung Health en amont : cela reste un problème de configuration entre les deux. Mais il lit ce que les deux applications écrivent dans Health Connect et affiche les données des deux appareils dans une seule vue.",
        pl: "FitMesh nie naprawia zduplikowanych ani opóźnionych danych między Garmin Connect a Samsung Health u źródła: to pozostaje kwestią konfiguracji między nimi. Odczytuje jednak to, co obie aplikacje zapisują w Health Connect, i pokazuje dane obu urządzeń w jednym widoku.",
        tr: "FitMesh, Garmin Connect ile Samsung Health arasındaki yinelenen veya gecikmeli verileri kaynağında düzeltmez: bu, ikisi arasındaki bir yapılandırma sorunu olarak kalır. Ancak iki uygulamanın Health Connect'e yazdıklarını okur ve her iki cihazın verilerini tek bir görünümde gösterir.",
        nl: "FitMesh lost dubbele of vertraagde gegevens tussen Garmin Connect en Samsung Health niet bij de bron op: dat blijft een configuratiekwestie tussen de twee. Maar het leest wat beide apps naar Health Connect schrijven en toont de gegevens van beide apparaten in één overzicht.",
        ja: "FitMesh は、Garmin Connect と Samsung Health の間で発生する重複や遅延を大元で解決するものではありません。それは両者の設定上の問題のままです。ただし、両方のアプリが Health Connect に書き込んだデータを読み取り、両方のデバイスのデータをひとつのビューにまとめて表示します。",
        ko: "FitMesh는 Garmin Connect와 Samsung Health 사이의 중복이나 지연된 데이터를 근본적으로 해결하지 않습니다. 그건 둘 사이의 설정 문제로 남습니다. 다만 두 앱이 Health Connect에 쓴 데이터를 읽어 두 기기의 데이터를 하나의 화면에 보여줍니다.",
        sv: "FitMesh löser inte dubbletter eller fördröjda data mellan Garmin Connect och Samsung Health i grunden — det förblir en konfigurationsfråga mellan de två. Men det läser generiskt från Health Connect och visar båda enheternas data i en enda vy, med källan angiven när fler än en skriver samma typ av data.",
        da: "FitMesh løser ikke dubletter eller forsinkede data mellem Garmin Connect og Samsung Health i grunden — det er fortsat et konfigurationsspørgsmål mellem de to. Men det læser generisk fra Health Connect og viser begge enheders data i én visning, med kilden angivet, når mere end én skriver den samme type data.",
      },
      benefits: {
        it: [
          "Legge ciò che Garmin Connect e Samsung Health scrivono in Health Connect",
        ],
        en: [
          "Reads what Garmin Connect and Samsung Health write to Health Connect",
        ],
        es: [
          "Lee lo que Garmin Connect y Samsung Health escriben en Health Connect",
        ],
        de: [
          "Liest, was Garmin Connect und Samsung Health in Health Connect schreiben",
        ],
        pt: [
          "Lê o que o Garmin Connect e o Samsung Health gravam no Health Connect",
        ],
        fr: [
          "Lit ce que Garmin Connect et Samsung Health écrivent dans Health Connect",
        ],
        pl: [
          "Odczytuje to, co Garmin Connect i Samsung Health zapisują w Health Connect",
        ],
        tr: [
          "Garmin Connect ve Samsung Health'in Health Connect'e yazdıklarını okur",
        ],
        nl: [
          "Leest wat Garmin Connect en Samsung Health naar Health Connect schrijven",
        ],
        ja: [
          "Garmin Connect と Samsung Health が Health Connect に書き込んだデータを読み取る",
        ],
        ko: [
          "Garmin Connect와 Samsung Health가 Health Connect에 쓴 데이터를 읽음",
        ],
        sv: [
          "Källattribution: du vet alltid vilken enhet varje siffra kommer från",
          "Läser generiskt från Health Connect, inte med Garmin- eller Samsung-specifik kod",
          "Tydlig källa även när båda skriver samma typ av data (t.ex. steg)",
        ],
        da: [
          "Kildetilskrivning: du ved altid, hvilken enhed hvert tal kommer fra",
          "Læser generisk fra Health Connect, ikke med Garmin- eller Samsung-specifik kode",
          "Tydelig kilde, selv når begge skriver den samme type data (f.eks. skridt)",
        ],
      },
      secondaryLabel: {
        it: "Vedi la pagina Garmin",
        en: "See the Garmin page",
        es: "Ver la página de Garmin",
        de: "Garmin-Seite ansehen",
        pt: "Ver a página Garmin",
        fr: "Voir la page Garmin",
        pl: "Zobacz stronę Garmin",
        tr: "Garmin sayfasını görün",
        nl: "Bekijk de Garmin-pagina",
        ja: "Garminのページを見る",
        ko: "Garmin 페이지 보기",
        sv: "Se Garmin-sidan",
        da: "Se Garmin-siden",
      },
      secondaryHref: {
        it: "/it/sync/garmin",
        en: "/en/sync/garmin",
      },
    },
  ],
  faq: [
    {
      q: {
          it: "Garmin sincronizza direttamente in Samsung Health senza Health Connect?",
          en: "Does Garmin sync directly with Samsung Health without Health Connect?",
          es: "¿Sincroniza Garmin directamente con Samsung Health sin Health Connect?",
          de: "Synchronisiert Garmin direkt mit Samsung Health ohne Health Connect?",
          pt: "O Garmin sincroniza diretamente com o Samsung Health sem a Health Connect?",
          fr: "Garmin se synchronise-t-il directement avec Samsung Health sans passer par Health Connect ?",
          pl: "Czy Garmin synchronizuje się bezpośrednio z Samsung Health bez użycia Health Connect?",
          tr: "Garmin Connect, Health Connect olmadan Samsung Health ile doğrudan senkronize olur mu?",
          nl: "Syncen Garmin direct met Samsung Health zonder Health Connect?",
          ja: "GarminはHealth Connectを使わずにサムスンヘルスと直接同期しますか？",
          ko: "Garmin은 Health Connect 없이 삼성 건강과 직접 동기화되나요?",
        },
      a: {
          it: "No. Al 2026, non esiste una integrazione diretta tra Garmin Connect e Samsung Health. Health Connect è l'unica ponte supportata su Android.",
          en: "No. As of 2026, there is no direct integration between Garmin Connect and Samsung Health. Health Connect is the only supported bridge on Android.",
          es: "No. Hasta 2026, no hay integración directa entre Garmin Connect y Samsung Health. Health Connect es el único puente soportado en Android.",
          de: "Nein. Bis 2026 gibt es keine direkte Integration zwischen Garmin Connect und Samsung Health. Health Connect ist die einzige unterstützte Brücke auf Android.",
          pt: "Não. Até 2026, não há integração direta entre o Garmin Connect e o Samsung Health. A Health Connect é a única ponte suportada no Android.",
          fr: "Non. En 2026, il n'y a pas d'intégration directe entre Garmin Connect et Samsung Health. Health Connect est la seule passerelle supportée sur Android.",
          pl: "Nie. Do 2026 roku nie ma żadnej bezpośredniej integracji między Garmin Connect a Samsung Health. Health Connect jest jedynym obsługiwanym mostem w systemie Android.",
          tr: "Hayır. 2026 yılına kadar Garmin Connect ve Samsung Health arasında doğrudan entegrasyon yoktur. Health Connect Android'de desteklenen tek köprüdür.",
          nl: "Nee. Tot 2026 is er geen directe integratie tussen Garmin Connect en Samsung Health. Health Connect is de enige ondersteunde brug op Android.",
          ja: "いいえ。2026年現在、Garmin ConnectとSamsung Healthの間には直接的な統合がありません。Health ConnectはAndroid上でのみサポートされる橋渡し手段です。",
          ko: "아니요. 2026년 기준으로 Garmin Connect와 삼성 건강 사이에는 직접적인 통합 기능이 없습니다. Health Connect가 안드로이드에서 지원되는 유일한 브릿지입니다.",
        },
    },
    {
      q: {
          it: "I miei dati storici Garmin appaiono in Samsung Health dopo aver configurato questo?",
          en: "Will historical Garmin data appear in Samsung Health after I set this up?",
          es: "¿Aparecerán los datos históricos de Garmin en Samsung Health después de configurarlo?",
          de: "Wird historisches Garmin-Datenmaterial nach der Einrichtung in Samsung Health erscheinen?",
          pt: "Os dados históricos do Garmin aparecerão no Samsung Health após eu configurar isso?",
          fr: "Les données historiques de Garmin apparaîtront-elles dans Samsung Health après que j'ai configuré cela ?",
          pl: "Po skonfigurowaniu tego, czy historyczne dane Garmin pojawią się w Samsung Health?",
          tr: "Bunu ayarladıktan sonra geçmiş Garmin verileri Samsung Health'te görünecek mi?",
          nl: "Zal historische Garmin gegevens na het instellen in Samsung Health verschijnen?",
          ja: "設定を変更した後、過去のGarminデータがサムスンヘルスに表示されますか？",
          ko: "이 설정을 완료하면 Garmin의 과거 데이터도 삼성 건강에 표시되나요?",
        },
      a: {
          it: "Non è garantito. Garmin non documenta se Garmin Connect invii dati precedenti quando abiliti l'integrazione per la prima volta, né quanti e quando. Controlla Samsung Health dopo la prima sincronizzazione per vedere cosa è arrivato.",
          en: "Not guaranteed. Garmin does not document whether Garmin Connect sends earlier data when you first enable the integration, or how much and when. Check Samsung Health after the first sync to see what arrived.",
          es: "No está garantizado. Garmin no documenta si Garmin Connect envía datos anteriores cuando activas la integración por primera vez, ni cuántos ni cuándo. Revisa Samsung Health tras la primera sincronización para ver qué ha llegado.",
          de: "Nicht garantiert. Garmin dokumentiert nicht, ob Garmin Connect beim ersten Aktivieren der Integration frühere Daten sendet, wie viele und wann. Prüfen Sie nach der ersten Synchronisierung in Samsung Health, was angekommen ist.",
          pt: "Não é garantido. A Garmin não documenta se o Garmin Connect envia dados anteriores quando você ativa a integração pela primeira vez, nem quantos nem quando. Confira o Samsung Health após a primeira sincronização para ver o que chegou.",
          fr: "Pas garanti. Garmin ne documente pas si Garmin Connect envoie des données antérieures lorsque vous activez l'intégration pour la première fois, ni combien ni quand. Vérifiez Samsung Health après la première synchronisation pour voir ce qui est arrivé.",
          pl: "Nie ma gwarancji. Garmin nie dokumentuje, czy Garmin Connect wysyła wcześniejsze dane przy pierwszym włączeniu integracji, ani ile ich jest i kiedy. Sprawdź Samsung Health po pierwszej synchronizacji, aby zobaczyć, co dotarło.",
          tr: "Garanti değil. Garmin, entegrasyonu ilk kez etkinleştirdiğinizde Garmin Connect'in daha eski verileri gönderip göndermediğini, ne kadarını ve ne zaman gönderdiğini belgelememiştir. Neyin ulaştığını görmek için ilk senkronizasyondan sonra Samsung Health'i kontrol edin.",
          nl: "Niet gegarandeerd. Garmin documenteert niet of Garmin Connect eerdere gegevens verstuurt wanneer je de integratie voor het eerst inschakelt, noch hoeveel en wanneer. Controleer Samsung Health na de eerste synchronisatie om te zien wat er is aangekomen.",
          ja: "保証はされていません。初めて連携を有効にしたときに Garmin Connect が過去のデータを送るかどうか、その量やタイミングは Garmin が公表していません。最初の同期のあとで Samsung Health を確認し、何が届いたかを見てください。",
          ko: "보장되지 않습니다. 통합을 처음 활성화할 때 Garmin Connect가 이전 데이터를 보내는지, 얼마나 보내는지, 언제 보내는지는 Garmin이 밝히지 않았습니다. 첫 동기화 후 Samsung Health에서 무엇이 도착했는지 확인하세요.",
        },
    },
    {
      q: {
          it: "Funziona anche su iOS?",
          en: "Does this work on iOS?",
          es: "¿Funciona esto en iOS?",
          de: "Funktioniert das auf iOS?",
          pt: "Isso funciona no iOS?",
          fr: "Cela fonctionne-t-il sur iOS ?",
          pl: "Czy działa to na iOS?",
          tr: "Bu iOS üzerinde de çalışır mı?",
          nl: "Werkt dit op iOS?",
          ja: "これはiOSでも機能しますか？",
          ko: "이 방법은 iOS에서도 작동하나요?",
        },
      a: {
          it: "Health Connect è Android-only. Su iOS, l'equivalente è Apple Health. Garmin Connect supporta la sincronizzazione con Apple Health su iOS, ma Samsung Health ha funzionalità limitate su iOS. Questo guida si applica solo a Android.",
          en: "Health Connect is Android-only. On iOS, the equivalent is Apple Health. Garmin Connect does support Apple Health sync on iOS, but Samsung Health on iOS has limited functionality. This guide applies to Android only.",
          es: "Health Connect es Android-only. En iOS, el equivalente es Apple Health. Garmin Connect soporta la sincronización con Apple Health en iOS, pero Samsung Health en iOS tiene funcionalidad limitada. Este guía se aplica solo a Android.",
          de: "Health Connect ist nur für Android verfügbar. Auf iOS entspricht das Äquivalent Apple Health. Garmin Connect unterstützt die Synchronisierung mit Apple Health auf iOS, aber Samsung Health auf iOS hat begrenzte Funktionalität. Dieses Handbuch gilt nur für Android.",
          pt: "A Health Connect é Android-only. No iOS, o equivalente é o Apple Health. O Garmin Connect suporta a sincronização com o Apple Health no iOS, mas o Samsung Health no iOS tem funcionalidade limitada. Este guia se aplica apenas ao Android.",
          fr: "Health Connect est Android-only. Sur iOS, l'équivalent est Apple Health. Garmin Connect supporte la synchronisation avec Apple Health sur iOS, mais Samsung Health sur iOS a une fonctionnalité limitée. Ce guide s'applique uniquement à Android.",
          pl: "Health Connect działa tylko na Androidzie. Na iOS odpowiednikiem jest Apple Health. Garmin Connect obsługuje synchronizację z Apple Health na iOS, ale Samsung Health ma ograniczone funkcjonalności na iOS. Ten przewodnik dotyczy tylko systemu Android.",
          tr: "Health Connect sadece Android'de desteklenmektedir. iOS'ta eşdeğeri Apple Health'tir. Garmin Connect, iOS'ta Apple Health ile senkronizasyonu destekler, ancak Samsung Health iOS'ta sınırlı işlevsellik sunar. Bu rehber yalnızca Android için geçerlidir.",
          nl: "Health Connect is Android-alleen. Op iOS is het equivalent Apple Health. Garmin Connect ondersteunt Apple Health sync op iOS, maar Samsung Health op iOS heeft beperkte functionaliteit. Dit gids past alleen voor Android.",
          ja: "ヘルスコネクトはAndroid専用です。iOSでは同様のものはApple Healthとなります。Garmin ConnectはiOSでApple Healthとの同期をサポートしていますが、Samsung HealthはiOSでの機能が制限されています。このガイドはAndroidのみに適用されます。",
          ko: "Health Connect는 안드로이드 전용입니다. iOS에서는 이에 해당하는 것이 Apple Health입니다. Garmin Connect는 iOS에서 Apple Health 동기화를 지원하지만, iOS용 삼성 건강은 기능이 제한적입니다. 이 가이드는 안드로이드에만 적용됩니다.",
        },
    },
    {
      q: {
          it: "Posso vedere Body Battery di Garmin in Samsung Health?",
          en: "Can I see Body Battery from Garmin in Samsung Health?",
          es: "¿Puedo ver Body Battery de Garmin en Samsung Health?",
          de: "Kann ich den Body Battery von Garmin in Samsung Health sehen?",
          pt: "Posso ver Body Battery do Garmin no Samsung Health?",
          fr: "Peut-on voir Body Battery de Garmin dans Samsung Health ?",
          pl: "Czy mogę zobaczyć Body Battery z Garmin w Samsung Health?",
          tr: "Samsung Health'te Garmin'in Body Battery'sini görebilir miyim?",
          nl: "Kan ik Body Battery van Garmin zien in Samsung Health?",
          ja: "Garminから体電池をサムスンヘルスで見ることができますか？",
          ko: "삼성 건강에서 Garmin의 Body Battery를 볼 수 있나요?",
        },
      a: {
          it: "No. Body Battery è una metrica proprietaria di Garmin e non fa parte dello standard dei dati Health Connect. Si manifesta solo all'interno di Garmin Connect.",
          en: "No. Body Battery is a proprietary Garmin metric and is not part of the Health Connect data standard. It only appears inside Garmin Connect.",
          es: "No. Body Battery es una métrica proprietary de Garmin y no forma parte del estándar de datos Health Connect. Solo aparece dentro de Garmin Connect.",
          de: "Nein. Body Battery ist eine vertrauteste Garmin-Metrik und gehört nicht zur Health Connect-Datenstandardisierung. Sie erscheint nur innerhalb von Garmin Connect.",
          pt: "Não. A Body Battery é uma métrica proprietária da Garmin e não faz parte do padrão de dados Health Connect. Ela aparece apenas dentro do Garmin Connect.",
          fr: "Non. Body Battery est une métrique proprietary de Garmin et ne fait pas partie du standard de données Health Connect. Il n'apparaît que dans Garmin Connect.",
          pl: "Nie. Body Battery to zastrzeżony wskaźnik firmy Garmin i nie jest częścią standardu danych Health Connect. Wyświetla się on tylko w Garmin Connect.",
          tr: "Hayır. Body Battery, Garmin'e özel bir ölçümdür ve Health Connect veri standardının parçası değildir. Yalnızca Garmin Connect içinde görünür.",
          nl: "Nee. Body Battery is een propriëtair Garmin-metrisch getal en maakt geen deel uit van de Health Connect gegevensnorm. Het verschijnt alleen binnen Garmin Connect.",
          ja: "いいえ。Body BatteryはGarminの特許取得済みの指標であり、Health Connectのデータ標準には含まれていません。これはGarmin Connect内にのみ表示されます。",
          ko: "아니요. Body Battery는 독점적인 Garmin 메트릭으로, Health Connect 데이터 표준에는 포함되어 있지 않습니다. 이는 Garmin Connect 내부에서만 나타납니다.",
        },
    },
    {
      q: {
          it: "Il mio conteggio passi in Samsung Health è inferiore a quello in Garmin Connect. Perché?",
          en: "My step count in Samsung Health is lower than in Garmin Connect. Why?",
          es: "¿Por qué mi cuenta de pasos en Samsung Health es menor que en Garmin Connect?",
          de: "Meine Schrittzählerangabe in Samsung Health ist niedriger als in Garmin Connect. Warum?",
          pt: "O número de passos no Samsung Health é menor que no Garmin Connect. Por quê?",
          fr: "Pourquoi mon comptage des pas dans Samsung Health est-il inférieur à celui dans Garmin Connect ?",
          pl: "Mój licznik kroków w Samsung Health jest niższy niż w Garmin Connect. Dlaczego?",
          tr: "Samsung Health'teki adımlarım Garmin Connect'ten daha düşük. Neden?",
          nl: "Mijn stap telling in Samsung Health is lager dan in Garmin Connect. Waarom?",
          ja: "Samsung Healthでの歩数がGarmin Connectよりも少ないのはなぜですか？",
          ko: "Samsung Health의 걸음 수가 Garmin Connect보다 낮습니다. 왜 그런가요?",
        },
      a: {
          it: "Le due app possono mostrare totali diversi. Non abbiamo una fonte pubblicata su come il conteggio passi di Garmin corrisponda a quello di Health Connect, quindi questa guida non può dire quale numero sia più vicino al reale. Scegli un'app come riferimento e confronta giorno per giorno in quella.",
          en: "The two apps can show different totals. We have no published source on how Garmin's step count maps to the Health Connect step count, so this guide can't say which number is closer. Pick one app as your reference and compare day to day in that app.",
          es: "Las dos apps pueden mostrar totales distintos. No tenemos ninguna fuente publicada sobre cómo el recuento de pasos de Garmin se corresponde con el de Health Connect, así que esta guía no puede decir qué cifra se acerca más a la real. Elige una app como referencia y compara día a día en ella.",
          de: "Die beiden Apps können unterschiedliche Summen anzeigen. Wir haben keine veröffentlichte Quelle dazu, wie die Schrittzählung von Garmin der Schrittzählung in Health Connect zugeordnet wird; diese Anleitung kann daher nicht sagen, welche Zahl näher an der Realität liegt. Wählen Sie eine App als Referenz und vergleichen Sie Tag für Tag in dieser App.",
          pt: "Os dois apps podem mostrar totais diferentes. Não temos nenhuma fonte publicada sobre como a contagem de passos da Garmin corresponde à do Health Connect, então este guia não pode dizer qual número é o mais próximo do real. Escolha um app como referência e compare dia a dia nele.",
          fr: "Les deux applications peuvent afficher des totaux différents. Nous n'avons aucune source publiée sur la correspondance entre le comptage de pas de Garmin et celui de Health Connect ; ce guide ne peut donc pas dire quel chiffre est le plus proche de la réalité. Choisissez une application comme référence et comparez jour après jour dans celle-ci.",
          pl: "Obie aplikacje mogą pokazywać różne sumy. Nie mamy opublikowanego źródła, jak liczba kroków Garmin odpowiada liczbie kroków w Health Connect, więc ten przewodnik nie może powiedzieć, która liczba jest bliższa rzeczywistości. Wybierz jedną aplikację jako punkt odniesienia i porównuj dzień po dniu w niej.",
          tr: "İki uygulama farklı toplamlar gösterebilir. Garmin'in adım sayısının Health Connect'teki adım sayısıyla nasıl eşleştiğine dair yayımlanmış bir kaynağımız yok; bu nedenle bu rehber hangi sayının gerçeğe daha yakın olduğunu söyleyemez. Bir uygulamayı referans seçin ve gün be gün onun içinde karşılaştırın.",
          nl: "De twee apps kunnen verschillende totalen tonen. We hebben geen gepubliceerde bron over hoe de stappentelling van Garmin zich verhoudt tot die van Health Connect, dus deze gids kan niet zeggen welk getal het dichtst bij de werkelijkheid ligt. Kies één app als referentie en vergelijk dag voor dag in die app.",
          ja: "2つのアプリでは合計が異なる場合があります。Garmin の歩数が Health Connect の歩数とどう対応するかについて、公開された情報源はないため、このガイドではどちらの数値が実際に近いかは言えません。基準にするアプリを1つ選び、そのアプリの中で日ごとに比べてください。",
          ko: "두 앱은 서로 다른 합계를 보여줄 수 있습니다. Garmin의 걸음 수가 Health Connect의 걸음 수와 어떻게 대응하는지에 대해 공개된 자료가 없으므로, 이 가이드는 어느 수치가 실제에 더 가까운지 말할 수 없습니다. 기준이 될 앱을 하나 정해 그 앱 안에서 날마다 비교하세요.",
        },
    },
  ],
  brandsMentioned: ["Garmin", "Samsung", "Health Connect", "Android", "Google"],
  related: ["esportare-dati-garmin", "health-connect-not-syncing", "sync-samsung-health-google-fit", "galaxy-watch-ultra2-watch9-health-connect"],
  // P1.8A (2026-08-25): sources aggiunto — non esisteva prima di questo
  // sprint. Le due fonti sono citate inline nel corpo (paragrafo che spiega
  // Garmin scrive-solo / Samsung Health legge-e-scrive), stesso pattern di
  // health-connect-not-syncing.ts.
  sources: [
    "https://support.garmin.com/en-US/?faq=JToBEy0jfe6pIygark2Ui5",
    "https://developer.samsung.com/health/blog/en/accessing-samsung-health-data-through-health-connect",
  ],
};
