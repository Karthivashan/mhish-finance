import { budgetStatus, categoryTotals, monthSummary } from '../utils/calculations';
import { formatINR } from '../utils/currencyUtils';
import { monthLabel } from '../utils/dateUtils';
import { uid } from './storageService';

export function validateBudgets(data) {
  if (!Array.isArray(data)) return undefined;
  return data.filter((b) => b && typeof b.id === 'string' && typeof b.categoryId === 'string' && Number.isFinite(b.amount) && b.amount > 0);
}

export const createBudget = (categoryId, amount) => ({ id: uid('bud'), categoryId, amount: Math.round(Number(amount) * 100) / 100 });

export function validateNotifications(data) {
  if (!Array.isArray(data)) return undefined;
  return data.filter((n) => n && typeof n.id === 'string' && typeof n.title === 'string').slice(0, 60);
}

export const makeNotification = (kind, title, message, key) => ({
  id: uid('ntf'), kind, title, message, key, read: false, createdAt: new Date().toISOString(),
});

/**
 * Thresholds: 0–79% normal · 80–99% approaching · 100%+ exceeded.
 * Each (category, month, level) alerts at most once — keyed so it never spams.
 */
export function budgetAlerts({ month, transactions, budgets, categories, existingKeys }) {
  const totals = categoryTotals(transactions, month, 'expense');
  const out = [];
  budgets.forEach((b) => {
    const cat = categories.find((c) => c.id === b.categoryId);
    if (!cat) return;
    const spent = totals.get(b.categoryId) || 0;
    const { level, pct } = budgetStatus(spent, b.amount);
    if (level === 'normal') return;
    const key = `budget-${level}:${b.categoryId}:${month}`;
    if (existingKeys.has(key)) return;
    existingKeys.add(key);
    if (level === 'warn') {
      out.push(makeNotification('budget-warn', `${cat.name} budget at ${Math.floor(pct)}%`,
        `You've used ${formatINR(spent)} of ${formatINR(b.amount)} for ${monthLabel(month)}. ${formatINR(b.amount - spent)} left.`, key));
    } else {
      out.push(makeNotification('budget-exceeded', `${cat.name} budget exceeded`,
        `${formatINR(spent)} spent against a ${formatINR(b.amount)} limit in ${monthLabel(month)} — ${formatINR(spent - b.amount)} over.`, key));
    }
  });
  return out;
}

export const MILESTONES = [50, 75, 100];

/** Spending milestones relative to the month's income. */
export function milestoneAlerts({ month, transactions, existingKeys }) {
  const { income, expense } = monthSummary(transactions, month);
  if (income <= 0) return [];
  const pct = (expense / income) * 100;
  const out = [];
  MILESTONES.filter((m) => pct >= m).forEach((m) => {
    const key = `milestone:${month}:${m}`;
    if (existingKeys.has(key)) return;
    existingKeys.add(key);
    // Only surface the highest newly-crossed milestone to avoid a burst.
    out.push(makeNotification('milestone', m >= 100 ? 'Spending has passed income' : `${m}% of income spent`,
      `Expenses in ${monthLabel(month)} have reached ${formatINR(expense)} — ${Math.floor(pct)}% of your ${formatINR(income)} income.`, key));
  });
  return out.slice(-1);
}
