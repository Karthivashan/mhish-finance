import { uid } from './storageService';

export const ICON_NAMES = [
  'Wallet','Briefcase','Banknote','TrendingUp','Gift','Landmark','PiggyBank','Laptop','Handshake','CircleDollarSign',
  'Plane','Car','Bus','Fuel','Coffee','Utensils','ShoppingBag','ShoppingCart','Shirt','Home',
  'HeartPulse','GraduationCap','Film','Gamepad2','Music','Smartphone','Zap','Dumbbell','Baby','PawPrint',
  'Wrench','Receipt','BookOpen','Gem','Sparkles','Tag',
];

export const COLOR_PALETTE = [
  '#00A651', '#4C9BE8', '#F2B84B', '#E86F9A', '#F0794A', '#9B7BEA',
  '#2FBFBF', '#C9D45C', '#E5604D', '#8B9BB4', '#D98BE0', '#5BD1A0',
];

export const DEFAULT_CATEGORIES = [
  { id: 'cat-salary', name: 'Salary', type: 'income', icon: 'Briefcase', color: '#00A651', isDefault: true },
  { id: 'cat-business', name: 'Business', type: 'income', icon: 'Handshake', color: '#4C9BE8', isDefault: true },
  { id: 'cat-freelance', name: 'Freelance', type: 'income', icon: 'Laptop', color: '#2FBFBF', isDefault: true },
  { id: 'cat-interest', name: 'Interest', type: 'income', icon: 'Landmark', color: '#9B7BEA', isDefault: true },
  { id: 'cat-investment', name: 'Investment', type: 'income', icon: 'TrendingUp', color: '#5BD1A0', isDefault: true },
  { id: 'cat-bonus', name: 'Bonus', type: 'income', icon: 'Sparkles', color: '#F2B84B', isDefault: true },
  { id: 'cat-gifts', name: 'Gifts', type: 'income', icon: 'Gift', color: '#E86F9A', isDefault: true },
  { id: 'cat-refund', name: 'Refund', type: 'income', icon: 'Receipt', color: '#F0794A', isDefault: true },
  { id: 'cat-rental-income', name: 'Rental income', type: 'income', icon: 'Home', color: '#2FBFBF', isDefault: true },
  { id: 'cat-other-income', name: 'Other income', type: 'income', icon: 'CircleDollarSign', color: '#8B9BB4', isDefault: true },
  { id: 'cat-travel', name: 'Travel', type: 'expense', icon: 'Plane', color: '#4C9BE8', isDefault: true },
  { id: 'cat-daily', name: 'Daily', type: 'expense', icon: 'Coffee', color: '#F2B84B', isDefault: true },
  { id: 'cat-shopping', name: 'Shopping', type: 'expense', icon: 'ShoppingBag', color: '#E86F9A', isDefault: true },
  { id: 'cat-petrol', name: 'Petrol', type: 'expense', icon: 'Fuel', color: '#F0794A', isDefault: true },
];

export function createCategory({ name, type, icon, color }) {
  return {
    id: uid('cat'),
    name: String(name).trim(),
    type,
    icon: ICON_NAMES.includes(icon) ? icon : 'Tag',
    color: /^#[0-9a-f]{6}$/i.test(color) ? color : COLOR_PALETTE[0],
    isDefault: false,
  };
}

export const isNameTaken = (categories, name, type, exceptId) =>
  categories.some(
    (c) => c.type === type && c.id !== exceptId && c.name.trim().toLowerCase() === String(name).trim().toLowerCase(),
  );

export const countTransactions = (transactions, categoryId) =>
  transactions.filter((t) => t.categoryId === categoryId).length;

export function validateCategories(data) {
  if (!Array.isArray(data)) return undefined;
  const ok = data.filter(
    (c) =>
      c && typeof c.id === 'string' && typeof c.name === 'string' && c.name.trim() &&
      (c.type === 'income' || c.type === 'expense') && typeof c.icon === 'string' && typeof c.color === 'string',
  ).map((c) => ({ ...c, isDefault: !!c.isDefault }));
  return ok.length ? ok : undefined;
}
