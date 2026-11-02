import { MAX_AMOUNT, roundMoney } from './currencyUtils.js';
import { DATE_FORMAT_OPTIONS, DEFAULT_DATE_FORMAT, isValidISODate } from './dateUtils.js';

/**
 * Defensive parsing of everything read back from LocalStorage. Corrupt, tampered or
 * outdated entries are dropped or repaired instead of crashing the app.
 */

const isObj = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);
const str = (v, max, fallback = '') => (typeof v === 'string' ? v.slice(0, max) : fallback);
const HEX = /^#[0-9a-fA-F]{6}$/;
const nowISO = () => new Date().toISOString();

export const MAX_NOTIFICATIONS = 50;

export function sanitizeTransactions(raw) {
  if (!Array.isArray(raw)) return [];
  const seen = new Set();
  const out = [];
  for (const t of raw) {
    if (!isObj(t) || typeof t.id !== 'string' || seen.has(t.id)) continue;
    if (t.type !== 'income' && t.type !== 'expense') continue;
    const amount = Number(t.amount);
    if (!Number.isFinite(amount) || amount <= 0 || amount > MAX_AMOUNT) continue;
    if (!isValidISODate(t.date) || typeof t.categoryId !== 'string') continue;
    seen.add(t.id);
    const createdAt = str(t.createdAt, 40, nowISO());
    out.push({
      id: t.id,
      type: t.type,
      amount: roundMoney(amount),
      description: str(t.description, 500),
      date: t.date,
      categoryId: t.categoryId,
      createdAt,
      updatedAt: str(t.updatedAt, 40, createdAt),
      isDemo: t.isDemo === true,
    });
  }
  return out;
}

export function sanitizeCategories(raw, defaults) {
  const out = [];
  const ids = new Set();
  if (Array.isArray(raw)) {
    for (const c of raw) {
      if (!isObj(c) || typeof c.id !== 'string' || ids.has(c.id)) continue;
      if (c.type !== 'income' && c.type !== 'expense') continue;
      const name = str(c.name, 30).trim();
      if (!name) continue;
      ids.add(c.id);
      out.push({
        id: c.id,
        type: c.type,
        name,
        icon: str(c.icon, 40, 'Tag') || 'Tag',
        color: HEX.test(c.color) ? c.color : '#00A651',
        isDefault: c.isDefault === true,
        isDemo: c.isDemo === true,
      });
    }
  }
  // Default categories are always available.
  for (const d of defaults) if (!ids.has(d.id)) out.push({ ...d });
  return out;
}

export function sanitizeBudgets(raw, categories) {
  if (!Array.isArray(raw)) return [];
  const expenseIds = new Set(categories.filter((c) => c.type === 'expense').map((c) => c.id));
  const seenCategory = new Set();
  const out = [];
  for (const b of raw) {
    if (!isObj(b) || typeof b.id !== 'string') continue;
    const amount = Number(b.amount);
    if (!Number.isFinite(amount) || amount <= 0 || amount > MAX_AMOUNT) continue;
    if (!expenseIds.has(b.categoryId) || seenCategory.has(b.categoryId)) continue;
    seenCategory.add(b.categoryId);
    out.push({ id: b.id, categoryId: b.categoryId, amount: roundMoney(amount), isDemo: b.isDemo === true });
  }
  return out;
}

export const DEFAULT_PROFILE = {
  name: '',
  email: '',
  avatarType: 'initials',
  avatarColor: '#00A651',
  avatarImage: '',
};

export function sanitizeProfile(raw) {
  const p = isObj(raw) ? raw : {};
  const image = typeof p.avatarImage === 'string' && p.avatarImage.startsWith('data:image/') ? p.avatarImage : '';
  return {
    name: str(p.name, 60).trim(),
    email: str(p.email, 120).trim(),
    avatarType: p.avatarType === 'image' && image ? 'image' : 'initials',
    avatarColor: HEX.test(p.avatarColor) ? p.avatarColor : DEFAULT_PROFILE.avatarColor,
    avatarImage: image.length <= 400000 ? image : '',
  };
}

export const DEFAULT_PREFERENCES = {
  theme: 'dark',
  currency: 'INR',
  dateFormat: DEFAULT_DATE_FORMAT,
  sidebarCollapsed: false,
  notifyBudgets: true,
  notifyMilestones: true,
  notifyActivity: true,
  demoSeeded: false,
  firedAlerts: [],
};

export function sanitizePreferences(raw) {
  const p = isObj(raw) ? raw : {};
  const bool = (v, d) => (typeof v === 'boolean' ? v : d);
  return {
    theme: p.theme === 'light' ? 'light' : 'dark',
    currency: 'INR',
    dateFormat: DATE_FORMAT_OPTIONS.some((o) => o.value === p.dateFormat) ? p.dateFormat : DEFAULT_PREFERENCES.dateFormat,
    sidebarCollapsed: bool(p.sidebarCollapsed, false),
    notifyBudgets: bool(p.notifyBudgets, true),
    notifyMilestones: bool(p.notifyMilestones, true),
    notifyActivity: bool(p.notifyActivity, true),
    demoSeeded: bool(p.demoSeeded, false),
    firedAlerts: Array.isArray(p.firedAlerts) ? p.firedAlerts.filter((k) => typeof k === 'string').slice(-200) : [],
  };
}

const NOTIFICATION_TYPES = ['budget_warning', 'budget_exceeded', 'milestone', 'activity', 'info'];

export function sanitizeNotifications(raw) {
  if (!Array.isArray(raw)) return [];
  const seen = new Set();
  const out = [];
  for (const n of raw) {
    if (!isObj(n) || typeof n.id !== 'string' || seen.has(n.id)) continue;
    if (!NOTIFICATION_TYPES.includes(n.type)) continue;
    seen.add(n.id);
    out.push({
      id: n.id,
      key: str(n.key, 120),
      type: n.type,
      title: str(n.title, 120),
      message: str(n.message, 300),
      createdAt: str(n.createdAt, 40, nowISO()),
      read: n.read === true,
    });
  }
  return out.slice(0, MAX_NOTIFICATIONS);
}
