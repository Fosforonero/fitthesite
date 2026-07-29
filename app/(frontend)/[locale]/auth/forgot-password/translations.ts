import { locales, UNTRANSLATED_CONTENT_LOCALES, type Locale } from '@/lib/i18n';

/**
 * Hotfix P0.10R — copy della richiesta di un nuovo codice di recupero.
 *
 * Stessa architettura di `../reset-password/translations.ts`, deliberatamente
 * NON un elenco indipendente: le locale tradotte sono le 11 canoniche
 * (tutte meno `UNTRANSLATED_CONTENT_LOCALES` = sv/da/no/fi, che sul sito
 * servono contenuto in inglese per convenzione gia' consolidata). Le 4
 * nordiche restano raggiungibili e funzionanti, con testo inglese: il
 * fallback e' esplicito in `resolveLocale`, non un 404.
 *
 * Il modulo e' separato da page.tsx perche' Next.js valida gli export di un
 * file page.tsx contro un allowlist fissa e rifiuta il build production per
 * qualunque named export extra (stesso motivo documentato in reset-password).
 */
export type ForgotPasswordLocale = Exclude<Locale, 'sv' | 'da' | 'no' | 'fi'>;

export const FORGOT_PASSWORD_LOCALES = locales.filter(
  (l) => !UNTRANSLATED_CONTENT_LOCALES.has(l),
) as readonly ForgotPasswordLocale[];

export type ForgotPasswordTranslations = {
  title: string;
  subtitle: string;
  metaTitle: string;
  metaDescription: string;
  emailLabel: string;
  emailPlaceholder: string;
  submit: string;
  sending: string;
  /**
   * Risposta neutra: identica per email esistente e inesistente. Non deve
   * mai confermare ne' smentire l'esistenza di un account (enumeration).
   */
  neutralTitle: string;
  neutralBody: string;
  codeExplainer: string;
  goToReset: string;
  errorInvalidEmail: string;
  errorNetwork: string;
  backToLogin: string;
  /** Etichetta del link mostrato sulla pagina di login. */
  fromLoginLink: string;
};

export const TRANSLATIONS: Record<ForgotPasswordLocale, ForgotPasswordTranslations> = {
  it: {
    title: 'Recupera la password',
    subtitle: 'Inserisci l\'email del tuo account FitMesh: ti mandiamo un codice per impostarne una nuova.',
    metaTitle: 'Recupera la password | FitMesh',
    metaDescription: 'Richiedi un codice via email per impostare una nuova password del tuo account FitMesh.',
    emailLabel: 'Email',
    emailPlaceholder: 'La tua email FitMesh',
    submit: 'Inviami il codice',
    sending: 'Invio in corso…',
    neutralTitle: 'Se quell\'indirizzo ha un account, il codice sta arrivando',
    neutralBody: 'Controlla la posta (anche lo spam). Se non arriva nulla, probabilmente l\'indirizzo e\' scritto in modo diverso da quello del tuo account: riprova con un\'altra grafia.',
    codeExplainer: 'Riceverai un codice da copiare qui sul sito. Non e\' un link da cliccare: serve il codice.',
    goToReset: 'Ho il codice, prosegui',
    errorInvalidEmail: 'Inserisci un indirizzo email valido.',
    errorNetwork: 'Problema di connessione. Controlla la rete e riprova.',
    backToLogin: 'Torna alla home',
    fromLoginLink: 'Password dimenticata?',
  },
  en: {
    title: 'Recover your password',
    subtitle: 'Enter your FitMesh account email: we will send you a code to set a new password.',
    metaTitle: 'Recover your password | FitMesh',
    metaDescription: 'Request a code by email to set a new password for your FitMesh account.',
    emailLabel: 'Email',
    emailPlaceholder: 'Your FitMesh email',
    submit: 'Send me the code',
    sending: 'Sending…',
    neutralTitle: 'If that address has an account, the code is on its way',
    neutralBody: 'Check your inbox (and spam). If nothing arrives, the address is probably spelled differently from the one on your account: try again with another spelling.',
    codeExplainer: 'You will receive a code to copy here on the site. It is not a link to click: you need the code.',
    goToReset: 'I have the code, continue',
    errorInvalidEmail: 'Enter a valid email address.',
    errorNetwork: 'Connection problem. Check your network and try again.',
    backToLogin: 'Back to home',
    fromLoginLink: 'Forgot your password?',
  },
  es: {
    title: 'Recupera tu contraseña',
    subtitle: 'Introduce el email de tu cuenta de FitMesh: te enviaremos un código para establecer una nueva contraseña.',
    metaTitle: 'Recuperar contraseña | FitMesh',
    metaDescription: 'Solicita un código por email para establecer una nueva contraseña de tu cuenta de FitMesh.',
    emailLabel: 'Email',
    emailPlaceholder: 'Tu email de FitMesh',
    submit: 'Enviarme el código',
    sending: 'Enviando…',
    neutralTitle: 'Si esa dirección tiene una cuenta, el código está en camino',
    neutralBody: 'Revisa tu correo (y el spam). Si no llega nada, probablemente la dirección esté escrita de forma distinta a la de tu cuenta: inténtalo con otra grafía.',
    codeExplainer: 'Recibirás un código para copiar aquí en el sitio. No es un enlace para hacer clic: necesitas el código.',
    goToReset: 'Ya tengo el código, continuar',
    errorInvalidEmail: 'Introduce una dirección de email válida.',
    errorNetwork: 'Problema de conexión. Revisa la red y vuelve a intentarlo.',
    backToLogin: 'Volver al inicio',
    fromLoginLink: '¿Has olvidado la contraseña?',
  },
  de: {
    title: 'Passwort wiederherstellen',
    subtitle: 'Gib die E-Mail-Adresse deines FitMesh-Kontos ein: Wir senden dir einen Code für ein neues Passwort.',
    metaTitle: 'Passwort wiederherstellen | FitMesh',
    metaDescription: 'Fordere einen Code per E-Mail an, um ein neues Passwort für dein FitMesh-Konto festzulegen.',
    emailLabel: 'E-Mail',
    emailPlaceholder: 'Deine FitMesh-E-Mail',
    submit: 'Code senden',
    sending: 'Wird gesendet…',
    neutralTitle: 'Wenn es zu dieser Adresse ein Konto gibt, ist der Code unterwegs',
    neutralBody: 'Sieh in deinem Postfach nach (auch im Spam). Kommt nichts an, ist die Adresse vermutlich anders geschrieben als die deines Kontos: Versuche es mit einer anderen Schreibweise.',
    codeExplainer: 'Du erhältst einen Code, den du hier auf der Website einfügst. Es ist kein Link zum Anklicken: Du brauchst den Code.',
    goToReset: 'Ich habe den Code, weiter',
    errorInvalidEmail: 'Gib eine gültige E-Mail-Adresse ein.',
    errorNetwork: 'Verbindungsproblem. Prüfe dein Netzwerk und versuche es erneut.',
    backToLogin: 'Zurück zur Startseite',
    fromLoginLink: 'Passwort vergessen?',
  },
  pt: {
    title: 'Recuperar a palavra-passe',
    subtitle: 'Introduz o email da tua conta FitMesh: enviamos-te um código para definires uma nova palavra-passe.',
    metaTitle: 'Recuperar a palavra-passe | FitMesh',
    metaDescription: 'Pede um código por email para definires uma nova palavra-passe da tua conta FitMesh.',
    emailLabel: 'Email',
    emailPlaceholder: 'O teu email FitMesh',
    submit: 'Enviar-me o código',
    sending: 'A enviar…',
    neutralTitle: 'Se esse endereço tiver uma conta, o código está a caminho',
    neutralBody: 'Verifica o correio (e o spam). Se não chegar nada, o endereço estará provavelmente escrito de forma diferente do da tua conta: tenta com outra grafia.',
    codeExplainer: 'Vais receber um código para copiar aqui no site. Não é um link para clicar: precisas do código.',
    goToReset: 'Já tenho o código, continuar',
    errorInvalidEmail: 'Introduz um endereço de email válido.',
    errorNetwork: 'Problema de ligação. Verifica a rede e tenta novamente.',
    backToLogin: 'Voltar ao início',
    fromLoginLink: 'Esqueceste-te da palavra-passe?',
  },
  fr: {
    title: 'Récupérer votre mot de passe',
    subtitle: 'Saisissez l\'email de votre compte FitMesh : nous vous envoyons un code pour définir un nouveau mot de passe.',
    metaTitle: 'Récupérer votre mot de passe | FitMesh',
    metaDescription: 'Demandez un code par email pour définir un nouveau mot de passe pour votre compte FitMesh.',
    emailLabel: 'Email',
    emailPlaceholder: 'Votre email FitMesh',
    submit: 'Envoyez-moi le code',
    sending: 'Envoi en cours…',
    neutralTitle: 'Si cette adresse a un compte, le code est en route',
    neutralBody: 'Vérifiez votre boîte mail (et les spams). Si rien n\'arrive, l\'adresse est probablement écrite différemment de celle de votre compte : réessayez avec une autre orthographe.',
    codeExplainer: 'Vous recevrez un code à copier ici sur le site. Ce n\'est pas un lien à cliquer : il vous faut le code.',
    goToReset: 'J\'ai le code, continuer',
    errorInvalidEmail: 'Saisissez une adresse email valide.',
    errorNetwork: 'Problème de connexion. Vérifiez votre réseau et réessayez.',
    backToLogin: 'Retour à l\'accueil',
    fromLoginLink: 'Mot de passe oublié ?',
  },
  pl: {
    title: 'Odzyskaj hasło',
    subtitle: 'Podaj adres email swojego konta FitMesh: wyślemy Ci kod do ustawienia nowego hasła.',
    metaTitle: 'Odzyskaj hasło | FitMesh',
    metaDescription: 'Poproś o kod email, aby ustawić nowe hasło do swojego konta FitMesh.',
    emailLabel: 'Email',
    emailPlaceholder: 'Twój email FitMesh',
    submit: 'Wyślij mi kod',
    sending: 'Wysyłanie…',
    neutralTitle: 'Jeśli ten adres ma konto, kod jest w drodze',
    neutralBody: 'Sprawdź skrzynkę (także spam). Jeśli nic nie przyjdzie, adres jest prawdopodobnie zapisany inaczej niż ten na koncie: spróbuj z inną pisownią.',
    codeExplainer: 'Otrzymasz kod do skopiowania tutaj na stronie. To nie jest link do kliknięcia: potrzebujesz kodu.',
    goToReset: 'Mam kod, kontynuuj',
    errorInvalidEmail: 'Podaj prawidłowy adres email.',
    errorNetwork: 'Problem z połączeniem. Sprawdź sieć i spróbuj ponownie.',
    backToLogin: 'Powrót na stronę główną',
    fromLoginLink: 'Nie pamiętasz hasła?',
  },
  tr: {
    title: 'Şifreni kurtar',
    subtitle: 'FitMesh hesabının e-postasını gir: yeni bir şifre belirlemen için sana bir kod göndereceğiz.',
    metaTitle: 'Şifreni kurtar | FitMesh',
    metaDescription: 'FitMesh hesabın için yeni bir şifre belirlemek üzere e-posta ile kod iste.',
    emailLabel: 'E-posta',
    emailPlaceholder: 'FitMesh e-postan',
    submit: 'Kodu gönder',
    sending: 'Gönderiliyor…',
    neutralTitle: 'O adrese ait bir hesap varsa, kod yolda',
    neutralBody: 'Posta kutunu (ve spam klasörünü) kontrol et. Hiçbir şey gelmezse, adres muhtemelen hesabındakinden farklı yazılmıştır: başka bir yazımla tekrar dene.',
    codeExplainer: 'Sitede buraya kopyalayacağın bir kod alacaksın. Tıklanacak bir bağlantı değil: kod gerekiyor.',
    goToReset: 'Kodum var, devam et',
    errorInvalidEmail: 'Geçerli bir e-posta adresi gir.',
    errorNetwork: 'Bağlantı sorunu. Ağını kontrol edip tekrar dene.',
    backToLogin: 'Ana sayfaya dön',
    fromLoginLink: 'Şifreni mi unuttun?',
  },
  nl: {
    title: 'Wachtwoord herstellen',
    subtitle: 'Vul het e-mailadres van je FitMesh-account in: we sturen je een code om een nieuw wachtwoord in te stellen.',
    metaTitle: 'Wachtwoord herstellen | FitMesh',
    metaDescription: 'Vraag een code per e-mail aan om een nieuw wachtwoord voor je FitMesh-account in te stellen.',
    emailLabel: 'E-mail',
    emailPlaceholder: 'Je FitMesh-e-mailadres',
    submit: 'Stuur me de code',
    sending: 'Versturen…',
    neutralTitle: 'Als dat adres een account heeft, is de code onderweg',
    neutralBody: 'Controleer je mailbox (ook spam). Komt er niets aan, dan is het adres waarschijnlijk anders gespeld dan dat van je account: probeer het met een andere spelling.',
    codeExplainer: 'Je ontvangt een code om hier op de site te plakken. Het is geen link om op te klikken: je hebt de code nodig.',
    goToReset: 'Ik heb de code, doorgaan',
    errorInvalidEmail: 'Vul een geldig e-mailadres in.',
    errorNetwork: 'Verbindingsprobleem. Controleer je netwerk en probeer het opnieuw.',
    backToLogin: 'Terug naar de homepage',
    fromLoginLink: 'Wachtwoord vergeten?',
  },
  ja: {
    title: 'パスワードの再設定',
    subtitle: 'FitMeshアカウントのメールアドレスを入力してください。新しいパスワードを設定するためのコードをお送りします。',
    metaTitle: 'パスワードの再設定 | FitMesh',
    metaDescription: 'FitMeshアカウントの新しいパスワードを設定するためのコードをメールでリクエストします。',
    emailLabel: 'メールアドレス',
    emailPlaceholder: 'FitMeshのメールアドレス',
    submit: 'コードを送信',
    sending: '送信中…',
    neutralTitle: 'そのアドレスにアカウントがあれば、コードを送信しました',
    neutralBody: 'メール（迷惑メールフォルダも）をご確認ください。届かない場合、アカウントのアドレスと綴りが異なっている可能性があります。別の綴りでお試しください。',
    codeExplainer: 'サイト上でコピーして使うコードが届きます。クリックするリンクではなく、コードが必要です。',
    goToReset: 'コードを持っています。次へ',
    errorInvalidEmail: '有効なメールアドレスを入力してください。',
    errorNetwork: '接続に問題があります。ネットワークを確認してもう一度お試しください。',
    backToLogin: 'ホームに戻る',
    fromLoginLink: 'パスワードをお忘れですか？',
  },
  ko: {
    title: '비밀번호 재설정',
    subtitle: 'FitMesh 계정 이메일을 입력하세요. 새 비밀번호를 설정할 수 있는 코드를 보내드립니다.',
    metaTitle: '비밀번호 재설정 | FitMesh',
    metaDescription: 'FitMesh 계정의 새 비밀번호를 설정하기 위한 코드를 이메일로 요청하세요.',
    emailLabel: '이메일',
    emailPlaceholder: 'FitMesh 이메일',
    submit: '코드 보내기',
    sending: '보내는 중…',
    neutralTitle: '해당 주소에 계정이 있다면 코드가 발송됩니다',
    neutralBody: '메일함(스팸함 포함)을 확인하세요. 아무것도 오지 않으면 계정 주소와 철자가 다를 수 있습니다. 다른 철자로 다시 시도해 보세요.',
    codeExplainer: '사이트에 붙여넣을 코드를 받게 됩니다. 클릭하는 링크가 아니라 코드가 필요합니다.',
    goToReset: '코드가 있습니다. 계속하기',
    errorInvalidEmail: '올바른 이메일 주소를 입력하세요.',
    errorNetwork: '연결 문제가 발생했습니다. 네트워크를 확인하고 다시 시도하세요.',
    backToLogin: '홈으로 돌아가기',
    fromLoginLink: '비밀번호를 잊으셨나요?',
  },
};
