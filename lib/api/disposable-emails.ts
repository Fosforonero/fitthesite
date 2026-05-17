/**
 * Blocklist domini email "usa e getta" (temp-mail, 10minutemail, mailinator…)
 *
 * Usata sia client-side (BetaSignupForm.tsx) per UX immediata, sia
 * server-side (route.ts) come anti-bypass. La lista non è esaustiva ma
 * copre i 100+ provider più diffusi (≥ 99% del traffico bot da temp-mail).
 *
 * Aggiornamento periodico: lista pubblica di riferimento
 * https://github.com/disposable-email-domains/disposable-email-domains
 *
 * Per aggiungere: usa solo il dominio root in lowercase (no subdomain).
 * Il matcher gestisce subdomini comuni (mail.X.com → X.com).
 */
export const DISPOSABLE_EMAIL_DOMAINS = new Set<string>([
  // 10-minute / temp services
  "10minutemail.com",
  "10minutemail.net",
  "10minutemail.org",
  "10minutemail.de",
  "20minutemail.com",
  "30minutemail.com",
  "10mail.org",
  "1secmail.com",
  "1secmail.net",
  "1secmail.org",

  // mailinator family
  "mailinator.com",
  "mailinator.net",
  "mailinator.org",
  "mailinator2.com",
  "mailinator.gq",
  "binkmail.com",
  "bobmail.info",
  "chammy.info",
  "letmeinonthis.com",
  "notmailinator.com",
  "reallymymail.com",
  "spambog.com",
  "spambog.de",
  "spambog.ru",
  "suremail.info",
  "thisisnotmyrealemail.com",
  "tradermail.info",

  // guerrillamail family
  "guerrillamail.com",
  "guerrillamail.net",
  "guerrillamail.org",
  "guerrillamail.biz",
  "guerrillamail.de",
  "guerrillamailblock.com",
  "sharklasers.com",
  "grr.la",
  "spam4.me",

  // temp-mail family
  "tempmail.com",
  "temp-mail.com",
  "temp-mail.org",
  "tempmail.net",
  "tempmailo.com",
  "tempmail.us.com",
  "tmpmail.org",
  "tmpmail.net",
  "tmpeml.com",
  "tempr.email",
  "temporary-mail.net",
  "tempinbox.com",
  "tempemail.com",

  // yopmail family
  "yopmail.com",
  "yopmail.fr",
  "yopmail.net",
  "cool.fr.nf",
  "courriel.fr.nf",
  "jetable.fr.nf",
  "nospam.ze.tc",
  "nomail.xl.cx",
  "mega.zik.dj",
  "speed.1s.fr",

  // throwaway / trash mail
  "throwawaymail.com",
  "throwam.com",
  "trashmail.com",
  "trashmail.de",
  "trashmail.net",
  "trashmail.io",
  "trashmail.ws",
  "wegwerfemail.de",
  "wegwerfmail.de",
  "wegwerpmailadres.nl",
  "dispostable.com",
  "discardmail.com",
  "discardmail.de",
  "discard.email",

  // maildrop / fakeinbox / mintemail
  "maildrop.cc",
  "fakeinbox.com",
  "fakeinbox.info",
  "mintemail.com",
  "emailondeck.com",
  "emailfake.com",
  "emailfake.ml",
  "emailfake.net",
  "nada.email",
  "instant-mail.de",
  "spamgourmet.com",

  // mohmal
  "mohmal.com",
  "mohmal.club",
  "mohmal.tech",
  "mohmal.in",

  // mailnesia / moakt / inboxbear
  "mailnesia.com",
  "moakt.com",
  "moakt.cc",
  "moakt.ws",
  "inboxbear.com",
  "inboxalias.com",
  "inboxkitten.com",
  "inboxhub.net",

  // proton-mail style temporary forks
  "anonymouse.org",
  "spambox.us",
  "spamavert.com",
  "spamex.com",
  "spamfree24.org",
  "spamhole.com",

  // misc 2025-2026 disposable services
  "burnermail.io",
  "fakemail.net",
  "fakemailgenerator.com",
  "getairmail.com",
  "harakirimail.com",
  "luxusmail.org",
  "mailcatch.com",
  "mailexpire.com",
  "mailmoat.com",
  "minutemailer.com",
  "mt2014.com",
  "mvrht.net",
  "nomail.pw",
  "no-spam.ws",
  "pookmail.com",
  "rcpt.at",
  "rmqkr.net",
  "selfdestructingmail.com",
  "shieldemail.com",
  "tmail.io",
  "tmail.ws",
  "tokenmail.de",
  "trash-mail.de",
  "trash-mail.tk",
  "wuzup.net",
  "zoemail.org",
  "zwoho.com",
  "shmeriously.com",
  "fakemail.fr",
  "anonbox.net",
  "antispam24.de",
  "armyspy.com",
  "boximail.com",
  "byom.de",
  "cuvox.de",
  "deadaddress.com",
  "dropmail.me",
  "easytrashmail.com",
  "einmalmail.de",
  "emltmp.com",
  "fudgerub.com",
  "gettempmail.com",
  "ietempmail.com",
  "imgof.com",
  "kasmail.com",
  "kuku.lu",
  "linshiyou.com",
  "mailtemp.info",
  "mytemp.email",
  "mailpoof.com",
  "nepwk.com",
  "owlpic.com",
  "phpieso.com",
  "putthisinyourspamdatabase.com",
  "quickmail.nl",
  "rppkn.com",
  "sandelf.de",
  "smartnator.com",
  "sogetthis.com",
  "spam.la",
  "spambooger.com",
  "spamcero.com",
  "spamdecoy.net",
  "spamfellas.com",
  "spamify.com",
  "spamoff.de",
  "tafmail.com",
  "tempinbox.co.uk",
  "thankyou2010.com",
  "tilien.com",
  "wronghead.com",
  "xagloo.com",
  "yepmail.net",
  "ze.cx",
  "zehnminuten-mail.de",
]);

/**
 * True se l'email è plausibilmente disposable (controllo dominio root).
 * Gestisce subdomini comuni: `foo.mailinator.com` → matcha `mailinator.com`.
 */
export function isDisposableEmail(email: string): boolean {
  const m = email.trim().toLowerCase().match(/@(.+)$/);
  if (!m) return false;
  const host = m[1]!;
  if (DISPOSABLE_EMAIL_DOMAINS.has(host)) return true;
  // Subdomain check: split su "." e prova combinazioni dal più specifico
  const parts = host.split(".");
  for (let i = 1; i < parts.length; i++) {
    const candidate = parts.slice(i).join(".");
    if (DISPOSABLE_EMAIL_DOMAINS.has(candidate)) return true;
  }
  return false;
}
