import { addMonths as addM, format, parseISO } from 'date-fns';

/* Dates are stored as plain 'yyyy-MM-dd' strings and months as 'yyyy-MM'.
   We never round-trip through UTC, so there is no timezone date shifting. */

export const DATE_FORMATS = [
  { value: 'dd MMM yyyy', label: '15 Nov 2026' },
  { value: 'dd/MM/yyyy', label: '15/11/2026' },
  { value: 'MM/dd/yyyy', label: '11/15/2026' },
  { value: 'yyyy-MM-dd', label: '2026-11-15' },
];

export const todayISO = () => format(new Date(), 'yyyy-MM-dd');
export const currentMonthKey = () => format(new Date(), 'yyyy-MM');
export const monthOf = (dateStr) => String(dateStr).slice(0, 7);
export const isValidISODate = (s) => /^\d{4}-\d{2}-\d{2}$/.test(s) && !Number.isNaN(parseISO(s).getTime());

export const shiftMonth = (key, n) => format(addM(parseISO(`${key}-01`), n), 'yyyy-MM');
export const prevMonth = (key) => shiftMonth(key, -1);
export const monthLabel = (key) => format(parseISO(`${key}-01`), 'MMMM yyyy');
export const shortMonth = (key) => format(parseISO(`${key}-01`), 'MMM');
export const shortMonthYear = (key) => format(parseISO(`${key}-01`), "MMM ''yy");

export function formatDate(dateStr, fmt = 'dd MMM yyyy') {
  if (!isValidISODate(dateStr)) return '—';
  return format(parseISO(dateStr), fmt);
}

export const lastNMonths = (endKey, n) =>
  Array.from({ length: n }, (_, i) => shiftMonth(endKey, i - (n - 1)));

export const monthKeyFromParts = (year, month) => `${year}-${String(month).padStart(2, '0')}`;
export const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December'];
