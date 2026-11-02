// Indian number formatting (lakh / crore grouping) — ₹1,25,000.00
const inr = new Intl.NumberFormat('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const inrInt = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 });

export const CURRENCY_SYMBOL = '₹';

export function formatINR(value, { sign = false } = {}) {
  const n = Number(value);
  if (!Number.isFinite(n)) return `${CURRENCY_SYMBOL}0.00`;
  const abs = inr.format(Math.abs(n));
  if (n < 0) return `-${CURRENCY_SYMBOL}${abs}`;
  return `${sign && n > 0 ? '+' : ''}${CURRENCY_SYMBOL}${abs}`;
}

/** Compact form for chart axes: ₹1.2L, ₹45K, ₹2.5Cr */
export function formatCompact(value) {
  const n = Math.abs(Number(value) || 0);
  const s = Number(value) < 0 ? '-' : '';
  if (n >= 1e7) return `${s}${CURRENCY_SYMBOL}${trim(n / 1e7)}Cr`;
  if (n >= 1e5) return `${s}${CURRENCY_SYMBOL}${trim(n / 1e5)}L`;
  if (n >= 1e3) return `${s}${CURRENCY_SYMBOL}${trim(n / 1e3)}K`;
  return `${s}${CURRENCY_SYMBOL}${inrInt.format(n)}`;
}
const trim = (x) => String(Math.round(x * 10) / 10);

/** Live-format a raw amount string while typing: keeps ≤2 decimals and groups the integer part. */
export function sanitizeAmountInput(raw) {
  let s = String(raw ?? '').replace(/[^\d.]/g, '');
  const firstDot = s.indexOf('.');
  if (firstDot !== -1) s = s.slice(0, firstDot + 1) + s.slice(firstDot + 1).replace(/\./g, '');
  const [int = '', dec] = s.split('.');
  const cleanInt = int.replace(/^0+(?=\d)/, '').slice(0, 12);
  return dec === undefined ? cleanInt : `${cleanInt || '0'}.${dec.slice(0, 2)}`;
}

export function displayAmountInput(raw) {
  if (raw === '' || raw == null) return '';
  const [int, dec] = String(raw).split('.');
  const grouped = int ? inrInt.format(Number(int)) : '0';
  return dec === undefined ? grouped : `${grouped}.${dec}`;
}

export const parseAmount = (raw) => {
  const n = parseFloat(String(raw ?? '').replace(/,/g, ''));
  return Number.isFinite(n) ? Math.round(n * 100) / 100 : NaN;
};

/** Exact money maths: sum in paise to avoid floating-point drift. */
export const sumMoney = (values) =>
  values.reduce((acc, v) => acc + Math.round((Number(v) || 0) * 100), 0) / 100;
