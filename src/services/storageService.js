export const KEYS = {
  transactions: 'expense_tracker_transactions',
  categories: 'expense_tracker_categories',
  budgets: 'expense_tracker_budgets',
  profile: 'expense_tracker_profile',
  preferences: 'expense_tracker_preferences',
  notifications: 'expense_tracker_notifications',
};

// In-memory fallback so the app still works when localStorage is blocked (private mode, etc.)
const memory = new Map();
let storage = null;
try {
  const probe = '__et_probe__';
  window.localStorage.setItem(probe, '1');
  window.localStorage.removeItem(probe);
  storage = window.localStorage;
} catch {
  storage = null;
}

export const isPersistent = () => storage !== null;

/** Safe JSON read: returns `fallback` on missing/corrupt data or when `validate` rejects it. */
export function read(key, fallback, validate) {
  try {
    const raw = storage ? storage.getItem(key) : memory.get(key);
    if (raw == null) return fallback;
    const parsed = JSON.parse(raw);
    const result = validate ? validate(parsed) : parsed;
    return result === undefined ? fallback : result;
  } catch {
    return fallback;
  }
}

export function write(key, value) {
  try {
    const raw = JSON.stringify(value);
    if (storage) storage.setItem(key, raw);
    else memory.set(key, raw);
    return true;
  } catch {
    return false; // quota exceeded or serialisation failure
  }
}

export function remove(key) {
  try {
    if (storage) storage.removeItem(key);
    else memory.delete(key);
  } catch { /* ignore */ }
}

export const hasKey = (key) => {
  try {
    return (storage ? storage.getItem(key) : memory.get(key)) != null;
  } catch {
    return false;
  }
};

export const uid = (prefix = 'id') => {
  const rand =
    typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
  return `${prefix}_${rand}`;
};
