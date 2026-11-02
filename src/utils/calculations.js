import { sumMoney } from './currencyUtils';
import { lastNMonths, monthOf, prevMonth, shortMonth, shortMonthYear } from './dateUtils';

const round2 = (n) => Math.round(n * 100) / 100;

export const inMonth = (txs, month, type) =>
  txs.filter((t) => monthOf(t.date) === month && (!type || t.type === type));

export const totalFor = (txs, month, type) => sumMoney(inMonth(txs, month, type).map((t) => t.amount));

/** Total Balance = Total Income − Total Expenses (up to and including `uptoMonth` when given). */
export function balance(txs, uptoMonth) {
  const scoped = uptoMonth ? txs.filter((t) => monthOf(t.date) <= uptoMonth) : txs;
  const inc = sumMoney(scoped.filter((t) => t.type === 'income').map((t) => t.amount));
  const exp = sumMoney(scoped.filter((t) => t.type === 'expense').map((t) => t.amount));
  return round2(inc - exp);
}

export function monthSummary(txs, month) {
  const income = totalFor(txs, month, 'income');
  const expense = totalFor(txs, month, 'expense');
  const savings = round2(income - expense);
  const savingsRate = income > 0 ? round2((savings / income) * 100) : 0; // zero-income safe
  return { income, expense, savings, savingsRate };
}

/** % change; null when there is no previous value to compare against. */
export function pctChange(current, previous) {
  if (!previous) return current ? null : 0;
  return round2(((current - previous) / Math.abs(previous)) * 100);
}

export function categoryTotals(txs, month, type = 'expense') {
  const map = new Map();
  inMonth(txs, month, type).forEach((t) =>
    map.set(t.categoryId, Math.round(((map.get(t.categoryId) || 0) + t.amount) * 100) / 100),
  );
  return map;
}

/** Ranked category spend for a month: [{ category, total, pct }] highest first. */
export function rankCategories(txs, categories, month, type = 'expense') {
  const totals = categoryTotals(txs, month, type);
  const grand = sumMoney([...totals.values()]);
  return [...totals.entries()]
    .map(([id, total]) => ({
      category: categories.find((c) => c.id === id) || { id, name: 'Uncategorised', color: '#8B9BB4', icon: 'Tag' },
      total,
      pct: grand > 0 ? round2((total / grand) * 100) : 0,
    }))
    .sort((a, b) => b.total - a.total);
}

export function monthlySeries(txs, endMonth, n = 6) {
  return lastNMonths(endMonth, n).map((m) => {
    const { income, expense, savings } = monthSummary(txs, m);
    return { month: m, label: shortMonth(m), longLabel: shortMonthYear(m), income, expense, savings };
  });
}

export function budgetStatus(spent, amount) {
  const pct = amount > 0 ? round2((spent / amount) * 100) : 0;
  const level = pct >= 100 ? 'exceeded' : pct >= 80 ? 'warn' : 'normal';
  return { pct, level, remaining: round2(amount - spent), over: round2(Math.max(0, spent - amount)) };
}

export function monthComparison(txs, month) {
  const current = totalFor(txs, month, 'expense');
  const previous = totalFor(txs, prevMonth(month), 'expense');
  return { current, previous, diff: round2(current - previous), pct: pctChange(current, previous) };
}

export function dailyExpenseSeries(txs, month) {
  const map = new Map();
  inMonth(txs, month, 'expense').forEach((t) => map.set(t.date, (map.get(t.date) || 0) + t.amount));
  return map;
}
