import { budgetUtilisation, categoryTotals, monthTotals } from '../utils/calculations.js';
import { UNCATEGORISED } from '../utils/calculations.js';
import { formatINR } from '../utils/currencyUtils.js';
import { uid } from '../utils/id.js';
import { MAX_NOTIFICATIONS } from '../utils/validators.js';

export function makeNotification({ key = '', type, title, message }) {
  return { id: uid('ntf'), key, type, title, message, createdAt: new Date().toISOString(), read: false };
}

/** Newest first, capped so the panel never grows without bound. */
export function pushNotifications(list, items) {
  if (!items.length) return list;
  return [...[...items].reverse(), ...list].slice(0, MAX_NOTIFICATIONS);
}

const MILESTONES = [50, 75, 100];

/**
 * Work out which budget / spending alerts should fire for month `ym`.
 *
 * Each alert has a stable key (`kind:categoryId:YYYY-MM`) stored in `preferences.firedAlerts`,
 * so a threshold only ever notifies once per month — even after the user clears the panel —
 * which keeps notifications useful rather than noisy.
 */
export function evaluateAlerts(state, ym) {
  const { transactions, budgets, categories, preferences } = state;
  const fired = new Set(preferences.firedAlerts || []);
  const created = [];
  const keys = [];
  const nameOf = (id) => categories.find((c) => c.id === id)?.name ?? UNCATEGORISED.name;
  const mark = (key) => {
    keys.push(key);
    fired.add(key);
  };

  if (preferences.notifyBudgets) {
    const spentBy = categoryTotals(transactions, ym, 'expense');
    for (const b of budgets) {
      const spent = spentBy.get(b.categoryId)?.total ?? 0;
      const u = budgetUtilisation(spent, b.amount);
      const warnKey = `budget-warning:${b.categoryId}:${ym}`;
      const overKey = `budget-exceeded:${b.categoryId}:${ym}`;
      if (u.level === 'exceeded' && !fired.has(overKey)) {
        mark(overKey);
        mark(warnKey);
        created.push(
          makeNotification({
            key: overKey,
            type: 'budget_exceeded',
            title: `${nameOf(b.categoryId)} budget exceeded`,
            message: `You've spent ${formatINR(spent)} of ${formatINR(b.amount)} this month — ${formatINR(u.over)} over the limit.`,
          }),
        );
      } else if (u.level === 'warning' && !fired.has(warnKey)) {
        mark(warnKey);
        created.push(
          makeNotification({
            key: warnKey,
            type: 'budget_warning',
            title: `${nameOf(b.categoryId)} budget at ${u.displayPct}%`,
            message: `Approaching your ${formatINR(b.amount)} limit — ${formatINR(u.remaining)} left this month.`,
          }),
        );
      }
    }
  }

  if (preferences.notifyMilestones) {
    const { income, expense } = monthTotals(transactions, ym);
    if (income > 0) {
      const ratio = (expense / income) * 100;
      const crossed = MILESTONES.filter((m) => ratio >= m);
      const fresh = crossed.filter((m) => !fired.has(`milestone:${m}:${ym}`));
      if (fresh.length) {
        const top = Math.max(...fresh);
        crossed.forEach((m) => mark(`milestone:${m}:${ym}`));
        created.push(
          makeNotification({
            key: `milestone:${top}:${ym}`,
            type: 'milestone',
            title: top >= 100 ? 'Spending has passed this month’s income' : `${top}% of this month’s income spent`,
            message: `Expenses are ${formatINR(expense)} against ${formatINR(income)} of income so far.`,
          }),
        );
      }
    }
  }

  return { created, keys };
}
