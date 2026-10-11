const formatters = new Map<string, Intl.NumberFormat>();

function currencyFormatter(currency: string, compact: boolean) {
  const key = `${currency}-${compact}`;
  let f = formatters.get(key);
  if (!f) {
    try {
      f = new Intl.NumberFormat(undefined, {
        style: 'currency',
        currency,
        notation: compact ? 'compact' : 'standard',
        maximumFractionDigits: compact ? 1 : 2,
        minimumFractionDigits: compact ? 0 : 2,
      });
    } catch {
      f = new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD' });
    }
    formatters.set(key, f);
  }
  return f;
}

export function formatMoney(amount: number, currency = 'USD', opts: { compact?: boolean; sign?: boolean } = {}) {
  const text = currencyFormatter(currency, !!opts.compact).format(Math.abs(amount));
  if (amount < 0) return `-${text}`;
  return opts.sign && amount > 0 ? `+${text}` : text;
}

export function currencySymbol(currency = 'USD') {
  const part = currencyFormatter(currency, false).formatToParts(0).find((p) => p.type === 'currency');
  return part?.value ?? currency;
}

export const toMonthKey = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;

export function shiftMonthKey(key: string, delta: number) {
  const [y, m] = key.split('-').map(Number);
  return toMonthKey(new Date(y, m - 1 + delta, 1));
}

export function monthLabel(key: string, style: 'long' | 'short' = 'long') {
  const [y, m] = key.split('-').map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString(undefined, { month: style, year: 'numeric' });
}

export function monthBounds(key: string) {
  const [y, m] = key.split('-').map(Number);
  return { from: new Date(y, m - 1, 1), to: new Date(y, m, 0, 23, 59, 59, 999) };
}

export const isSameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

export function dayLabel(input: string | Date) {
  const d = new Date(input);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  if (isSameDay(d, today)) return 'Today';
  if (isSameDay(d, yesterday)) return 'Yesterday';
  return d.toLocaleDateString(undefined, {
    weekday: 'short', month: 'short', day: 'numeric',
    year: d.getFullYear() === today.getFullYear() ? undefined : 'numeric',
  });
}

export const shortDate = (input: string | Date) =>
  new Date(input).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });

export const timeLabel = (input: string | Date) =>
  new Date(input).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });

export function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

export const CURRENCIES = [
  { code: 'USD', name: 'US Dollar' }, { code: 'EUR', name: 'Euro' }, { code: 'GBP', name: 'British Pound' },
  { code: 'INR', name: 'Indian Rupee' }, { code: 'JPY', name: 'Japanese Yen' }, { code: 'CAD', name: 'Canadian Dollar' },
  { code: 'AUD', name: 'Australian Dollar' }, { code: 'CHF', name: 'Swiss Franc' }, { code: 'CNY', name: 'Chinese Yuan' },
  { code: 'AED', name: 'UAE Dirham' }, { code: 'SGD', name: 'Singapore Dollar' }, { code: 'BRL', name: 'Brazilian Real' },
  { code: 'MXN', name: 'Mexican Peso' }, { code: 'ZAR', name: 'South African Rand' }, { code: 'NGN', name: 'Nigerian Naira' },
  { code: 'PKR', name: 'Pakistani Rupee' }, { code: 'BDT', name: 'Bangladeshi Taka' }, { code: 'KRW', name: 'South Korean Won' },
];
