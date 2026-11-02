import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useState } from 'react';
import { toast } from 'sonner';
import { budgetAlerts, createBudget, makeNotification, milestoneAlerts, validateBudgets, validateNotifications } from '../services/budgetService';
import { DEFAULT_CATEGORIES, createCategory, validateCategories } from '../services/categoryService';
import { buildDemoBudgets, buildDemoTransactions } from '../services/demoData';
import { KEYS, hasKey, read, remove, write } from '../services/storageService';
import { createTransaction, validateTransactions } from '../services/transactionService';
import { formatINR } from '../utils/currencyUtils';
import { currentMonthKey, formatDate, monthLabel, monthOf } from '../utils/dateUtils';

const AppContext = createContext(null);

const DEFAULT_PREFS = () => ({
  theme: 'dark', dateFormat: 'dd MMM yyyy', currency: 'INR', sidebarCollapsed: false,
  budgetAlerts: true, milestoneAlerts: true, hasDemo: false, seeded: false,
});
const DEFAULT_PROFILE = { name: 'Guest', email: '', avatarColor: '#00A651', avatarImage: '' };

const withDefaults = (cats) => {
  const ids = new Set(cats.map((c) => c.id));
  return [...DEFAULT_CATEGORIES.filter((d) => !ids.has(d.id)), ...cats];
};

function alertsFor(state, months) {
  const keys = new Set(state.notifications.map((n) => n.key).filter(Boolean));
  const out = [];
  [...new Set(months)].forEach((month) => {
    if (state.preferences.budgetAlerts)
      out.push(...budgetAlerts({ month, transactions: state.transactions, budgets: state.budgets, categories: state.categories, existingKeys: keys }));
    if (state.preferences.milestoneAlerts)
      out.push(...milestoneAlerts({ month, transactions: state.transactions, existingKeys: keys }));
  });
  return out;
}
const pushNotifs = (state, list) => ({ ...state, notifications: [...list.reverse(), ...state.notifications].slice(0, 60) });

function loadState() {
  const fresh = !hasKey(KEYS.preferences) && !hasKey(KEYS.transactions);
  const preferences = { ...DEFAULT_PREFS(), ...read(KEYS.preferences, {}, (v) => (v && typeof v === 'object' ? v : undefined)) };
  const profile = { ...DEFAULT_PROFILE, ...read(KEYS.profile, {}, (v) => (v && typeof v === 'object' ? v : undefined)) };
  let categories = withDefaults(read(KEYS.categories, [], validateCategories) || []);
  if (fresh) {
    return { transactions: [], categories, budgets: [], profile, preferences, notifications: [] };
  }
  const savedTransactions = read(KEYS.transactions, [], validateTransactions) || [];
  const savedBudgets = read(KEYS.budgets, [], validateBudgets) || [];
  const migratingSeededData = preferences.seeded;
  preferences.seeded = false;
  if (migratingSeededData) {
    preferences.hasDemo = false;
    categories = categories.filter((category) => !category.isDemo);
  }
  return {
    transactions: migratingSeededData ? savedTransactions.filter((tx) => !tx.isDemo) : savedTransactions,
    categories,
    budgets: migratingSeededData ? savedBudgets.filter((budget) => !budget.isDemo) : savedBudgets,
    profile, preferences,
    notifications: read(KEYS.notifications, [], validateNotifications) || [],
  };
}

function reducer(state, a) {
  switch (a.type) {
    case 'HYDRATE': return loadState();
    case 'ADD_TX': {
      const next = { ...state, transactions: [a.tx, ...state.transactions] };
      return pushNotifs(next, [
        ...alertsFor(next, [monthOf(a.tx.date)]),
        makeNotification('saved', `${a.tx.type === 'income' ? 'Income' : 'Expense'} saved`, `${formatINR(a.tx.amount)} · ${a.catName}`),
      ]);
    }
    case 'UPDATE_TX': {
      const old = state.transactions.find((t) => t.id === a.tx.id);
      if (!old) return state;
      const tx = { ...old, ...a.tx, updatedAt: new Date().toISOString() };
      delete tx.isDemo; // editing a sample record makes it the user's own
      const next = { ...state, transactions: state.transactions.map((t) => (t.id === tx.id ? tx : t)) };
      return pushNotifs(next, [
        ...alertsFor(next, [monthOf(tx.date), monthOf(old.date)]),
        makeNotification('updated', 'Transaction updated', `${formatINR(tx.amount)} · ${a.catName}`),
      ]);
    }
    case 'DELETE_TX': {
      const tx = state.transactions.find((t) => t.id === a.id);
      if (!tx) return state;
      return pushNotifs({ ...state, transactions: state.transactions.filter((t) => t.id !== a.id) },
        [makeNotification('deleted', 'Transaction deleted', `${formatINR(tx.amount)} · ${a.catName}`)]);
    }
    case 'ADD_CAT': return { ...state, categories: [...state.categories, a.category] };
    case 'UPDATE_CAT':
      return { ...state, categories: state.categories.map((c) => (c.id === a.id ? { ...c, ...a.patch } : c)) };
    case 'DELETE_CAT': {
      const cat = state.categories.find((c) => c.id === a.id);
      if (!cat || cat.isDefault) return state;
      let transactions = state.transactions;
      if (a.mode === 'reassign' && a.targetId) transactions = transactions.map((t) => (t.categoryId === a.id ? { ...t, categoryId: a.targetId } : t));
      else transactions = transactions.filter((t) => t.categoryId !== a.id);
      return {
        ...state, transactions,
        categories: state.categories.filter((c) => c.id !== a.id),
        budgets: state.budgets.filter((b) => b.categoryId !== a.id),
      };
    }
    case 'SET_BUDGET': {
      const existing = state.budgets.find((b) => b.categoryId === a.categoryId);
      const budgets = existing
        ? state.budgets.map((b) => { if (b !== existing) return b; const { isDemo, ...rest } = b; return { ...rest, amount: a.amount }; })
        : [...state.budgets, createBudget(a.categoryId, a.amount)];
      const next = { ...state, budgets };
      return pushNotifs(next, alertsFor(next, [a.month]));
    }
    case 'DELETE_BUDGET': return { ...state, budgets: state.budgets.filter((b) => b.id !== a.id) };
    case 'SET_PROFILE': return { ...state, profile: { ...state.profile, ...a.patch } };
    case 'SET_PREFS': return { ...state, preferences: { ...state.preferences, ...a.patch } };
    case 'NOTIF_READ': return { ...state, notifications: state.notifications.map((n) => (n.id === a.id ? { ...n, read: true } : n)) };
    case 'NOTIF_READ_ALL': return { ...state, notifications: state.notifications.map((n) => ({ ...n, read: true })) };
    case 'NOTIF_CLEAR': return { ...state, notifications: [] };
    case 'RESET_DEMO': {
      const userBudgetCats = new Set(state.budgets.filter((b) => !b.isDemo).map((b) => b.categoryId));
      const demoBudgets = buildDemoBudgets().filter((b) => !userBudgetCats.has(b.categoryId)).map((b) => ({ ...b, isDemo: true }));
      const next = {
        ...state,
        transactions: [...buildDemoTransactions(), ...state.transactions.filter((t) => !t.isDemo)],
        budgets: [...state.budgets.filter((b) => !b.isDemo), ...demoBudgets],
        preferences: { ...state.preferences, hasDemo: true },
      };
      return pushNotifs(next, alertsFor(next, [currentMonthKey()]));
    }
    case 'CLEAR_DEMO':
      return {
        ...state,
        transactions: state.transactions.filter((t) => !t.isDemo),
        budgets: state.budgets.filter((b) => !b.isDemo),
        preferences: { ...state.preferences, hasDemo: false },
      };
    case 'CLEAR_ALL':
      return { ...state, transactions: [], budgets: [], categories: DEFAULT_CATEGORIES, notifications: [], preferences: { ...state.preferences, hasDemo: false } };
    case 'IMPORT': return { ...state, ...a.data };
    default: return state;
  }
}

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, null, loadState);
  const [month, setMonth] = useState(currentMonthKey);

  // Persist each slice when it changes.
  useEffect(() => { write(KEYS.transactions, state.transactions); }, [state.transactions]);
  useEffect(() => { write(KEYS.categories, state.categories); }, [state.categories]);
  useEffect(() => { write(KEYS.budgets, state.budgets); }, [state.budgets]);
  useEffect(() => { write(KEYS.profile, state.profile); }, [state.profile]);
  useEffect(() => { write(KEYS.preferences, state.preferences); }, [state.preferences]);
  useEffect(() => { write(KEYS.notifications, state.notifications); }, [state.notifications]);

  // Keep multiple tabs in sync.
  useEffect(() => {
    const onStorage = (e) => { if (e.key && Object.values(KEYS).includes(e.key)) dispatch({ type: 'HYDRATE' }); };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const catById = useMemo(() => new Map(state.categories.map((c) => [c.id, c])), [state.categories]);
  const getCategory = useCallback(
    (id) => catById.get(id) || { id, name: 'Uncategorised', icon: 'Tag', color: '#8B9BB4', type: 'expense' },
    [catById],
  );

  const actions = useMemo(() => {
    const catName = (id) => catById.get(id)?.name || 'Uncategorised';
    return {
      addTransaction(data) {
        const tx = createTransaction(data);
        dispatch({ type: 'ADD_TX', tx, catName: catName(tx.categoryId) });
        toast.success(data.type === 'income' ? 'Income saved' : 'Expense saved', { description: `${formatINR(tx.amount)} · ${catName(tx.categoryId)}` });
        return tx;
      },
      updateTransaction(id, data) {
        const tx = { id, ...data, amount: Math.round(Number(data.amount) * 100) / 100 };
        dispatch({ type: 'UPDATE_TX', tx, catName: catName(tx.categoryId) });
        toast.success('Transaction updated');
      },
      deleteTransaction(id) {
        const tx = state.transactions.find((t) => t.id === id);
        dispatch({ type: 'DELETE_TX', id, catName: catName(tx?.categoryId) });
        toast.success('Transaction deleted');
      },
      addCategory(data) {
        const category = createCategory(data);
        dispatch({ type: 'ADD_CAT', category });
        toast.success(`Category “${category.name}” created`);
        return category;
      },
      updateCategory(id, patch) {
        dispatch({ type: 'UPDATE_CAT', id, patch: { ...patch, ...(patch.name ? { name: patch.name.trim() } : {}) } });
        toast.success('Category updated');
      },
      deleteCategory(id, mode, targetId) {
        dispatch({ type: 'DELETE_CAT', id, mode, targetId });
        toast.success('Category deleted');
      },
      setBudget(categoryId, amount, forMonth = month) {
        dispatch({ type: 'SET_BUDGET', categoryId, amount: Math.round(Number(amount) * 100) / 100, month: forMonth });
        toast.success('Budget saved');
      },
      deleteBudget(id) { dispatch({ type: 'DELETE_BUDGET', id }); toast.success('Budget removed'); },
      setProfile: (patch) => dispatch({ type: 'SET_PROFILE', patch }),
      setPrefs: (patch) => dispatch({ type: 'SET_PREFS', patch }),
      markRead: (id) => dispatch({ type: 'NOTIF_READ', id }),
      markAllRead: () => dispatch({ type: 'NOTIF_READ_ALL' }),
      clearNotifications: () => dispatch({ type: 'NOTIF_CLEAR' }),
      resetDemo() { dispatch({ type: 'RESET_DEMO' }); toast.success('Sample data restored'); },
      clearDemo() { dispatch({ type: 'CLEAR_DEMO' }); toast.success('Sample data removed'); },
      clearAll() { dispatch({ type: 'CLEAR_ALL' }); toast.success('All data erased'); },
      importData(data) { dispatch({ type: 'IMPORT', data }); toast.success('Backup imported'); },
      wipeStorage() { Object.values(KEYS).forEach(remove); dispatch({ type: 'HYDRATE' }); },
    };
  }, [catById, month, state.transactions]);

  const fmtDate = useCallback((d) => formatDate(d, state.preferences.dateFormat), [state.preferences.dateFormat]);

  const value = useMemo(
    () => ({ ...state, month, setMonth, monthLabel: monthLabel(month), getCategory, fmtDate, ...actions }),
    [state, month, getCategory, fmtDate, actions],
  );
  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export const useApp = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used inside <AppProvider>');
  return ctx;
};
