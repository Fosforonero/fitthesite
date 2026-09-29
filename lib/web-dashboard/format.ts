/**
 * Formattazione per la dashboard web. Fuso fisso (Europe/Rome) perche' i dati
 * sono sintetici e gli screenshot devono essere riproducibili.
 */
export type UiLocale = 'it' | 'en';

export const TZ = 'Europe/Rome';

/** it e en hanno copy propria; ogni altra lingua usa l'inglese (prototipo). */
export function uiLocale(locale: string): UiLocale {
  return locale === 'it' ? 'it' : 'en';
}

export function fmtInt(n: number, locale: string): string {
  return new Intl.NumberFormat(locale).format(Math.round(n));
}

export function fmtDec(n: number, locale: string, digits = 1): string {
  return new Intl.NumberFormat(locale, { minimumFractionDigits: digits, maximumFractionDigits: digits }).format(n);
}

export function fmtPercent(fraction: number, locale: string): string {
  return new Intl.NumberFormat(locale, { style: 'percent', maximumFractionDigits: 0 }).format(fraction);
}

/** 432 -> «7 h 12 min». Sotto l'ora: «45 min». */
export function fmtMinutes(min: number, locale: string): string {
  const total = Math.round(min);
  const h = Math.floor(total / 60);
  const m = total % 60;
  if (h === 0) return `${m} min`;
  return `${fmtInt(h, locale)} h ${String(m).padStart(2, '0')} min`;
}

export function fmtTime(iso: string, locale: string): string {
  return new Intl.DateTimeFormat(locale, { hour: '2-digit', minute: '2-digit', timeZone: TZ, hour12: false }).format(new Date(iso));
}

export function fmtDayLong(date: string, locale: string): string {
  return new Intl.DateTimeFormat(locale, { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' }).format(new Date(`${date}T12:00:00Z`));
}

export function fmtDayShort(date: string, locale: string): string {
  return new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'short', timeZone: 'UTC' }).format(new Date(`${date}T12:00:00Z`));
}

export function fmtWeekdayShort(date: string, locale: string): string {
  return new Intl.DateTimeFormat(locale, { weekday: 'short', timeZone: 'UTC' }).format(new Date(`${date}T12:00:00Z`));
}

export function fmtDateTime(iso: string, locale: string): string {
  return new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', timeZone: TZ, hour12: false }).format(new Date(iso));
}

/** «12 min fa», «3 h fa», «3 giorni fa». */
export function fmtAge(minutes: number, l: UiLocale): string {
  const rtf = new Intl.RelativeTimeFormat(l, { numeric: 'always', style: 'short' });
  if (minutes < 60) return rtf.format(-Math.max(1, Math.round(minutes)), 'minute');
  if (minutes < 60 * 48) return rtf.format(-Math.round(minutes / 60), 'hour');
  return rtf.format(-Math.round(minutes / 1440), 'day');
}
