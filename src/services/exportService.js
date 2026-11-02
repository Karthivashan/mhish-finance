import { categoryTotals, monthSummary, rankCategories } from '../utils/calculations';
import { monthLabel, monthOf } from '../utils/dateUtils';
import { sortTransactions } from './transactionService';

// Guard against CSV/formula injection when files are opened in spreadsheet apps.
const cell = (v) => {
  let s = v == null ? '' : String(v);
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};
const row = (arr) => arr.map(cell).join(',');
const catName = (categories, id) => categories.find((c) => c.id === id)?.name || 'Uncategorised';

export function download(filename, content, mime) {
  const blob = new Blob([content], { type: `${mime};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename; document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

const txRows = (txs, categories) =>
  sortTransactions(txs).map((t) => [t.date, t.type, catName(categories, t.categoryId), t.description, t.amount.toFixed(2), t.isDemo ? 'demo' : 'user']);
const TX_HEAD = ['Date', 'Type', 'Category', 'Description', 'Amount (INR)', 'Source'];

export function transactionsCSV(txs, categories) {
  return '﻿' + [row(TX_HEAD), ...txRows(txs, categories).map(row)].join('\n');
}

export function monthlyReportCSV(txs, categories, month) {
  const monthTx = txs.filter((t) => monthOf(t.date) === month);
  const s = monthSummary(txs, month);
  const lines = [
    row([`Monthly report`, monthLabel(month)]),
    row(['Income (INR)', s.income.toFixed(2)]),
    row(['Expenses (INR)', s.expense.toFixed(2)]),
    row(['Savings (INR)', s.savings.toFixed(2)]),
    row(['Savings rate (%)', s.savingsRate.toFixed(1)]),
    '',
    row(['Category-wise expense summary']),
    row(['Rank', 'Category', 'Total (INR)', 'Share of expenses (%)']),
    ...rankCategories(txs, categories, month).map((r, i) => row([i + 1, r.category.name, r.total.toFixed(2), r.pct.toFixed(1)])),
    '',
    row(['Transactions']),
    row(TX_HEAD),
    ...txRows(monthTx, categories).map(row),
  ];
  return '﻿' + lines.join('\n');
}

export function categorySummaryCSV(txs, categories, month) {
  const total = [...categoryTotals(txs, month).values()].reduce((a, b) => a + b, 0);
  return '﻿' + [
    row(['Category', 'Total (INR)', 'Share (%)']),
    ...rankCategories(txs, categories, month).map((r) => row([r.category.name, r.total.toFixed(2), r.pct.toFixed(1)])),
    row(['Total', total.toFixed(2), total ? '100.0' : '0.0']),
  ].join('\n');
}

export function fullBackupJSON(state) {
  return JSON.stringify(
    {
      app: 'mhish-expense-tracker',
      version: 1,
      exportedAt: new Date().toISOString(),
      data: {
        transactions: state.transactions, categories: state.categories, budgets: state.budgets,
        profile: state.profile, preferences: state.preferences, notifications: state.notifications,
      },
    },
    null, 2,
  );
}
