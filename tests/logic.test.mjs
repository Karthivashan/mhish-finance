import test from 'node:test';
import assert from 'node:assert/strict';
import {
  formatINR, formatCompactINR, formatAmountInput, parseAmountInput, amountToInput, roundMoney,
} from '../src/utils/currencyUtils.js';
import {
  pctChange, monthTotals, totalBalance, balanceThrough, budgetUtilisation, rankCategories, monthlySeries,
  categoryChanges, savingsRate, categoryTotals, UNCATEGORISED,
} from '../src/utils/calculations.js';
import { formatDate, isValidISODate, shiftMonth, monthRange, monthLabel, todayISO } from '../src/utils/dateUtils.js';
import { generateDemoData, DEFAULT_CATEGORIES } from '../src/services/defaultData.js';
import { sanitizeTransactions, sanitizeCategories, sanitizeBudgets, sanitizePreferences } from '../src/utils/validators.js';
import { validateTransactionInput, buildTransaction, sortTransactions, filterTransactions, groupByDate } from '../src/services/transactionService.js';
import { validateCategoryName } from '../src/services/categoryService.js';
import { buildBudgetRows, summarizeBudgets } from '../src/services/budgetService.js';
import { evaluateAlerts } from '../src/services/alertService.js';
import { buildTransactionsCSV, buildMonthlyReportCSV, buildJSONExport } from '../src/services/exportService.js';
import { parseDriveBackup } from '../src/services/googleDriveService.js';

const tx = (id, type, amount, date, categoryId = 'c1') => ({ id, type, amount, date, categoryId, description: '', createdAt: `${date}T00:00:00Z`, updatedAt: `${date}T00:00:00Z`, isDemo: false });

test('INR formatting uses Indian grouping and two decimals', () => {
  assert.equal(formatINR(125000), '₹1,25,000.00');
  assert.equal(formatINR(1234567.5), '₹12,34,567.50');
  assert.equal(formatINR(-1234.5), '-₹1,234.50');
  assert.equal(formatINR(0), '₹0.00');
  assert.equal(formatINR(-0.001), '₹0.00');
  assert.equal(formatINR(10, { signed: true }), '+₹10.00');
  assert.equal(formatCompactINR(1250), '₹1.3K');
  assert.equal(formatCompactINR(350000), '₹3.5L');
  assert.equal(formatCompactINR(25000000), '₹2.5Cr');
});

test('amount input formatting and parsing', () => {
  assert.equal(formatAmountInput('1234567.891'), '12,34,567.89');
  assert.equal(formatAmountInput('1000'), '1,000');
  assert.equal(formatAmountInput('100000'), '1,00,000');
  assert.equal(formatAmountInput('.5'), '0.5');
  assert.equal(formatAmountInput('0012'), '12');
  assert.equal(formatAmountInput('12.'), '12.');
  assert.equal(formatAmountInput('abc'), '');
  assert.equal(formatAmountInput('1.2.3'), '1.23');
  assert.equal(parseAmountInput('1,25,000.50'), 125000.5);
  assert.ok(Number.isNaN(parseAmountInput('')));
  assert.equal(amountToInput(125000.5), '1,25,000.5');
  assert.equal(amountToInput(1250), '1,250');
  assert.equal(roundMoney(0.1 + 0.2), 0.3);
});

test('percentage change handles zero baselines', () => {
  assert.equal(pctChange(150, 100), 50);
  assert.equal(pctChange(50, 100), -50);
  assert.equal(pctChange(0, 0), 0);
  assert.equal(pctChange(10, 0), null);
  assert.equal(pctChange(-50, -100), 50); // loss shrank by half
});

test('month totals use the transaction date and never float-drift', () => {
  const txs = [
    tx('1', 'income', 1000.1, '2026-10-01'),
    tx('2', 'income', 2000.2, '2026-10-31'),
    tx('3', 'expense', 0.1, '2026-10-15'),
    tx('4', 'expense', 0.2, '2026-10-15'),
    tx('5', 'expense', 500, '2026-09-30'),
    tx('6', 'expense', 700, '2026-11-01'),
  ];
  const oct = monthTotals(txs, '2026-10');
  assert.equal(oct.income, 3000.3);
  assert.equal(oct.expense, 0.3);
  assert.equal(oct.savings, 3000);
  assert.equal(oct.count, 4);
  assert.equal(Math.round(oct.savingsRate * 100) / 100, 99.99);
  assert.equal(totalBalance(txs), roundMoney(3000.3 - 0.3 - 500 - 700));
  assert.equal(balanceThrough(txs, '2026-09'), -500);
  assert.equal(savingsRate(100, 0), null);
  assert.equal(monthTotals([], '2026-10').savingsRate, null);
});

test('budget thresholds: <80 normal, 80–99 warning, >=100 exceeded', () => {
  const lvl = (s, l) => budgetUtilisation(s, l).level;
  assert.equal(lvl(0, 100), 'normal');
  assert.equal(lvl(79.99, 100), 'normal');
  assert.equal(lvl(80, 100), 'warning');
  assert.equal(lvl(5600, 7000), 'warning'); // exactly 80% — float-sensitive
  assert.equal(lvl(99.99, 100), 'warning');
  assert.equal(lvl(100, 100), 'exceeded');
  assert.equal(lvl(250, 100), 'exceeded');
  const u = budgetUtilisation(120, 100);
  assert.equal(u.over, 20);
  assert.equal(u.remaining, -20);
  assert.equal(budgetUtilisation(99.99, 100).displayPct, 99);
});

test('ranking, series and category changes', () => {
  const resolve = (id) => ({ id, name: id.toUpperCase() });
  const txs = [
    tx('1', 'expense', 300, '2026-10-02', 'a'),
    tx('2', 'expense', 100, '2026-10-03', 'b'),
    tx('3', 'expense', 100, '2026-10-04', 'a'),
    tx('4', 'expense', 200, '2026-09-04', 'a'),
    tx('5', 'income', 999, '2026-10-04', 'inc'),
  ];
  const ranked = rankCategories(txs, resolve, '2026-10');
  assert.deepEqual(ranked.map((r) => [r.rank, r.categoryId, r.total, Math.round(r.pct)]), [[1, 'a', 400, 80], [2, 'b', 100, 20]]);
  assert.equal(ranked.reduce((s, r) => s + r.pct, 0), 100);
  const series = monthlySeries(txs, '2026-10', 3);
  assert.deepEqual(series.map((s) => s.ym), ['2026-08', '2026-09', '2026-10']);
  assert.equal(series[2].expense, 500);
  assert.equal(series[2].expenseChange, 150);
  assert.equal(monthlySeries(txs, '2026-10', 2, { categoryId: 'b' })[1].expense, 100);
  const ch = categoryChanges(txs, resolve, '2026-10');
  assert.equal(ch[0].categoryId, 'a');
  assert.equal(ch[0].diff, 200);
  assert.equal(ch[1].diff, 100);
  assert.equal(categoryTotals(txs, '2026-10').get('a').count, 2);
});

test('dates: no timezone shifting, year rollover, validation', () => {
  assert.equal(formatDate('2026-10-31'), '31 Oct 2026');
  assert.equal(formatDate('2026-01-01', 'dd/MM/yyyy'), '01/01/2026');
  assert.equal(formatDate('2026-12-31', 'yyyy-MM-dd'), '2026-12-31');
  assert.equal(shiftMonth('2026-01', -1), '2025-12');
  assert.equal(shiftMonth('2026-12', 1), '2027-01');
  assert.deepEqual(monthRange('2026-02', 3), ['2025-12', '2026-01', '2026-02']);
  assert.equal(monthLabel('2026-10'), 'October 2026');
  assert.ok(isValidISODate('2024-02-29'));
  assert.ok(!isValidISODate('2026-02-29'));
  assert.ok(!isValidISODate('2026-13-01'));
  assert.ok(!isValidISODate('26-1-1'));
  assert.match(todayISO(), /^\d{4}-\d{2}-\d{2}$/);
});

test('sample data is valid, flagged, dated in the past and varied', () => {
  const today = todayISO();
  const demo = generateDemoData(today);
  assert.ok(demo.transactions.length > 150);
  assert.ok(demo.transactions.every((t) => t.isDemo && t.date <= today));
  assert.equal(sanitizeTransactions(demo.transactions).length, demo.transactions.length);
  assert.equal(new Set(demo.transactions.map((t) => t.id)).size, demo.transactions.length);
  const cats = sanitizeCategories([...demo.categories], DEFAULT_CATEGORIES);
  const catIds = new Set(cats.map((c) => c.id));
  assert.ok(demo.transactions.every((t) => catIds.has(t.categoryId)), 'every sample tx has a category');
  assert.ok(demo.categories.every((c) => c.isDemo));
  assert.equal(sanitizeBudgets(demo.budgets, cats).length, demo.budgets.length);
  assert.ok(demo.budgets.every((b) => b.isDemo && b.amount >= 1000));
  assert.deepEqual(demo.transactions, generateDemoData(today).transactions, 'deterministic');
  const months = new Set(demo.transactions.map((t) => t.date.slice(0, 7)));
  assert.equal(months.size, 8);
  // expense types never use income categories and vice-versa
  const byId = Object.fromEntries(cats.map((c) => [c.id, c]));
  assert.ok(demo.transactions.every((t) => byId[t.categoryId].type === t.type));
});

test('storage sanitisers repair or drop bad data', () => {
  assert.deepEqual(sanitizeTransactions('nope'), []);
  const good = tx('g', 'expense', 10, '2026-01-01');
  const bad = [good, { ...good, id: 'g' }, { ...good, id: 'b1', amount: -5 }, { ...good, id: 'b2', date: '2026-02-30' }, { ...good, id: 'b3', type: 'x' }, null, 5, { ...good, id: 'b4', amount: '12.345' }];
  const clean = sanitizeTransactions(bad);
  assert.deepEqual(clean.map((t) => t.id), ['g', 'b4']);
  assert.equal(clean[1].amount, 12.35);
  assert.equal(sanitizeCategories(null, DEFAULT_CATEGORIES).length, 5);
  assert.equal(sanitizePreferences({ theme: 'weird', dateFormat: 'zzz' }).theme, 'dark');
  assert.equal(sanitizePreferences({ dateFormat: 'zzz' }).dateFormat, 'dd MMM yyyy');
});

test('transaction + category validation', () => {
  const cats = DEFAULT_CATEGORIES;
  const ok = { type: 'expense', amount: '1,250.50', date: '2026-10-31', categoryId: 'cat-daily', description: 'x' };
  assert.deepEqual(validateTransactionInput(ok, cats), {});
  assert.ok(validateTransactionInput({ ...ok, amount: '' }, cats).amount);
  assert.ok(validateTransactionInput({ ...ok, amount: '0' }, cats).amount);
  assert.ok(validateTransactionInput({ ...ok, date: '' }, cats).date);
  assert.ok(validateTransactionInput({ ...ok, categoryId: '' }, cats).categoryId);
  assert.ok(validateTransactionInput({ ...ok, categoryId: 'cat-salary' }, cats).categoryId, 'income category on expense');
  assert.ok(validateTransactionInput({ ...ok, description: 'x'.repeat(201) }, cats).description);
  const built = buildTransaction(ok);
  assert.equal(built.amount, 1250.5);
  assert.equal(built.date, '2026-10-31');
  const edited = buildTransaction({ ...ok, amount: '9' }, { ...built, isDemo: true });
  assert.equal(edited.id, built.id);
  assert.equal(edited.isDemo, false);
  assert.ok(validateCategoryName('', 'expense', cats));
  assert.ok(validateCategoryName(' travel ', 'expense', cats), 'duplicate (case-insensitive)');
  assert.equal(validateCategoryName('Travel', 'income', cats), '', 'same name allowed across types');
  assert.equal(validateCategoryName('Travel', 'expense', cats, 'cat-travel'), '', 'renaming to itself ok');
});

test('sorting, filtering, grouping', () => {
  const resolve = (id) => (id === 'cat-daily' ? { name: 'Daily' } : UNCATEGORISED);
  const a = { ...tx('a', 'expense', 10, '2026-10-02', 'cat-daily'), description: 'Milk' };
  const b = { ...tx('b', 'income', 20, '2026-10-03'), description: 'Pay' };
  const c = { ...tx('c', 'expense', 30, '2026-10-03', 'cat-daily'), createdAt: '2026-10-03T12:00:00Z' };
  const sorted = sortTransactions([a, b, c]);
  assert.deepEqual(sorted.map((t) => t.id), ['c', 'b', 'a']);
  assert.deepEqual(groupByDate(sorted).map((g) => [g.date, g.items.length]), [['2026-10-03', 2], ['2026-10-02', 1]]);
  assert.equal(filterTransactions(sorted, { type: 'expense' }, resolve).length, 2);
  assert.equal(filterTransactions(sorted, { query: 'milk' }, resolve).length, 1);
  assert.equal(filterTransactions(sorted, { query: 'daily' }, resolve).length, 2);
  assert.equal(filterTransactions(sorted, { month: '2026-09' }, resolve).length, 0);
});

test('budget rows, summary and alerts fire once per threshold', () => {
  const cats = DEFAULT_CATEGORIES;
  const resolve = (id) => cats.find((c) => c.id === id) || UNCATEGORISED;
  const ym = '2026-10';
  const budgets = [
    { id: 'b1', categoryId: 'cat-daily', amount: 1000 },
    { id: 'b2', categoryId: 'cat-travel', amount: 1000 },
    { id: 'b3', categoryId: 'cat-petrol', amount: 1000 },
  ];
  const txs = [tx('1', 'expense', 850, '2026-10-05', 'cat-daily'), tx('2', 'expense', 1000, '2026-10-06', 'cat-travel'), tx('3', 'expense', 100, '2026-10-06', 'cat-petrol'), tx('4', 'income', 3000, '2026-10-01', 'cat-salary')];
  const rows = buildBudgetRows(budgets, resolve, txs, ym);
  assert.deepEqual(rows.map((r) => r.level), ['exceeded', 'warning', 'normal']);
  const sum = summarizeBudgets(rows);
  assert.equal(sum.limit, 3000);
  assert.equal(sum.spent, 1950);
  assert.equal(sum.remaining, 1050);
  assert.deepEqual([sum.exceeded, sum.warning, sum.normal], [1, 1, 1]);

  const prefs = { notifyBudgets: true, notifyMilestones: true, firedAlerts: [] };
  const state = { transactions: txs, budgets, categories: cats, preferences: prefs };
  const first = evaluateAlerts(state, ym);
  const types = first.created.map((n) => n.type).sort();
  assert.deepEqual(types, ['budget_exceeded', 'budget_warning', 'milestone']);
  const second = evaluateAlerts({ ...state, preferences: { ...prefs, firedAlerts: first.keys } }, ym);
  assert.equal(second.created.length, 0, 'no duplicates');
  const off = evaluateAlerts({ ...state, preferences: { ...prefs, notifyBudgets: false, notifyMilestones: false } }, ym);
  assert.equal(off.created.length, 0);
});

test('exports: CSV escaping, injection guard, JSON content', () => {
  const resolve = (id) => (id === 'x' ? { name: 'Food, "Dining"' } : { name: 'Plain' });
  const txs = [
    { ...tx('1', 'expense', 12.5, '2026-10-02', 'x'), description: '=HYPERLINK("evil")' },
    { ...tx('2', 'income', 100, '2026-10-03', 'y'), description: 'line1\nline2' },
  ];
  const csv = buildTransactionsCSV(txs, resolve);
  assert.ok(csv.startsWith('﻿Date,Type,Category'));
  assert.ok(csv.includes('"Food, ""Dining"""'));
  assert.ok(csv.includes(`"'=HYPERLINK(""evil"")"`));
  assert.ok(csv.includes('"line1\nline2"'));
  assert.ok(csv.includes('12.50'));
  const report = buildMonthlyReportCSV(txs, [], resolve, '2026-10');
  assert.ok(report.includes('Monthly report – October 2026'));
  assert.ok(report.includes('Total income,100.00'));
  assert.ok(report.includes('Total expenses,12.50'));
  const json = JSON.parse(buildJSONExport({ transactions: txs, categories: [], budgets: [], profile: {}, preferences: { theme: 'light' } }));
  assert.equal(json.data.preferences.theme, 'light');
  assert.equal(json.data.transactions.length, 2);
});

test('Drive backups require a supported version and complete data before restore', () => {
  const data = {
    transactions: [], categories: [], budgets: [], notifications: [],
    profile: {}, preferences: {},
  };
  assert.deepEqual(parseDriveBackup({ version: 1, data }), data);
  assert.throws(
    () => parseDriveBackup({ version: 2, data }),
    /invalid or unsupported/,
  );
  assert.throws(
    () => parseDriveBackup({ version: 1, data: { ...data, categories: null } }),
    /invalid or unsupported/,
  );
});
