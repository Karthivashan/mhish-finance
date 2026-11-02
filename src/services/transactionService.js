import { isValidISODate } from '../utils/dateUtils';
import { uid } from './storageService';

export function createTransaction({ type, amount, description, date, categoryId, isDemo = false }) {
  const now = new Date().toISOString();
  return {
    id: uid('tx'),
    type,
    amount: Math.round(Number(amount) * 100) / 100,
    description: String(description || '').trim(),
    date,
    categoryId,
    createdAt: now,
    updatedAt: now,
    ...(isDemo ? { isDemo: true } : {}),
  };
}

export function validateTransactions(data) {
  if (!Array.isArray(data)) return undefined;
  return data.filter(
    (t) =>
      t && typeof t.id === 'string' && (t.type === 'income' || t.type === 'expense') &&
      Number.isFinite(t.amount) && t.amount > 0 && isValidISODate(t.date) && typeof t.categoryId === 'string',
  ).map((t) => ({ ...t, description: String(t.description || '') }));
}

/** Newest first; ties broken by creation time. */
export const sortTransactions = (txs) =>
  [...txs].sort((a, b) => (a.date === b.date ? String(b.createdAt).localeCompare(String(a.createdAt)) : b.date.localeCompare(a.date)));
