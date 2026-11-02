import { roundMoney } from '../utils/currencyUtils.js';
import { daysInMonthKey, pad2, shiftMonth } from '../utils/dateUtils.js';
import { sumAmounts } from '../utils/calculations.js';

/** Categories that exist on first launch and can be renamed but never deleted. */
export const DEFAULT_CATEGORIES = [
  { id: 'cat-salary', type: 'income', name: 'Salary', icon: 'Wallet', color: '#00A651', isDefault: true },
  { id: 'cat-travel', type: 'expense', name: 'Travel', icon: 'Plane', color: '#3B82F6', isDefault: true },
  { id: 'cat-daily', type: 'expense', name: 'Daily', icon: 'Coffee', color: '#F59E0B', isDefault: true },
  { id: 'cat-shopping', type: 'expense', name: 'Shopping', icon: 'ShoppingBag', color: '#EC4899', isDefault: true },
  { id: 'cat-petrol', type: 'expense', name: 'Petrol', icon: 'Fuel', color: '#F97316', isDefault: true },
];

/** Extra categories used only by the sample data. They are flagged so they can be removed with it. */
const DEMO_CATEGORIES = [
  { id: 'demo-cat-freelance', type: 'income', name: 'Freelance', icon: 'Laptop', color: '#06B6D4' },
  { id: 'demo-cat-interest', type: 'income', name: 'Interest', icon: 'Landmark', color: '#8B5CF6' },
  { id: 'demo-cat-rent', type: 'expense', name: 'Rent', icon: 'Home', color: '#14B8A6' },
  { id: 'demo-cat-food', type: 'expense', name: 'Food & Dining', icon: 'Utensils', color: '#EF4444' },
  { id: 'demo-cat-bills', type: 'expense', name: 'Bills', icon: 'Zap', color: '#A855F7' },
  { id: 'demo-cat-fun', type: 'expense', name: 'Entertainment', icon: 'Film', color: '#84CC16' },
  { id: 'demo-cat-health', type: 'expense', name: 'Health', icon: 'HeartPulse', color: '#E11D48' },
].map((c) => ({ ...c, isDefault: false, isDemo: true }));

/** Deterministic PRNG so the sample data is identical for a given calendar month. */
function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const pick = (rng, list) => list[Math.floor(rng() * list.length)];
const between = (rng, lo, hi) => lo + rng() * (hi - lo);
const roundTo = (n, step) => Math.round(n / step) * step;

const POOLS = {
  daily: ['Groceries', 'Milk & vegetables', 'Fruits', 'Pharmacy essentials', 'Household supplies', 'Tea & snacks', 'Laundry'],
  food: ['Dinner out', 'Lunch with team', 'Weekend brunch', 'Food delivery', 'Coffee catch-up', 'Biryani takeaway'],
  travel: ['Bus tickets', 'Cab to airport', 'Train ticket – weekend trip', 'Auto & cab rides', 'Weekend getaway'],
  shopping: ['Clothing', 'Headphones', 'Home décor', 'Books & stationery', 'Footwear', 'Gift for a friend'],
  fun: ['Movie night', 'OTT subscription', 'Concert tickets', 'Gaming top-up'],
  health: ['Doctor consultation', 'Pharmacy', 'Health check-up', 'Dental visit'],
};

const BUDGET_FACTORS = {
  'cat-daily': 1.0,
  'demo-cat-food': 1.05,
  'cat-petrol': 1.0,
  'cat-shopping': 0.85,
  'cat-travel': 1.2,
  'demo-cat-bills': 1.1,
  'demo-cat-fun': 1.0,
};

const MONTHS_OF_DEMO_DATA = 8;

/**
 * Build realistic sample data for the last eight months, ending today.
 * Every record is flagged `isDemo: true` so it is always distinguishable from real entries.
 *
 * @param {string} todayIso "YYYY-MM-DD" (local calendar day)
 * @param {{ budgets?: Array }} [existing] used to avoid overriding budgets the user already set
 */
export function generateDemoData(todayIso, existing = {}) {
  const currentYm = todayIso.slice(0, 7);
  const todayDay = Number(todayIso.slice(8, 10));
  const transactions = [];

  for (let i = MONTHS_OF_DEMO_DATA - 1; i >= 0; i -= 1) {
    const ym = shiftMonth(currentYm, -i);
    const maxDay = i === 0 ? todayDay : daysInMonthKey(ym);
    const rng = mulberry32(Number(ym.slice(0, 4)) * 12 + Number(ym.slice(5, 7)) + 7919);
    let n = 0;

    const add = (day, type, categoryId, amount, description) => {
      if (day < 1 || day > maxDay) return;
      const date = `${ym}-${pad2(day)}`;
      n += 1;
      transactions.push({
        id: `demo-tx-${ym}-${n}`,
        type,
        amount: roundMoney(amount),
        description,
        date,
        categoryId,
        createdAt: `${date}T09:00:00.000Z`,
        updatedAt: `${date}T09:00:00.000Z`,
        isDemo: true,
      });
    };
    const randomDay = () => 1 + Math.floor(rng() * maxDay);

    // Income
    add(1, 'income', 'cat-salary', i < 3 ? 88000 : 82000, 'Monthly salary');
    if (rng() < 0.55) add(12 + Math.floor(rng() * 10), 'income', 'demo-cat-freelance', roundTo(between(rng, 8000, 22000), 500), 'Freelance project payout');
    if (i % 3 === 1) add(15, 'income', 'demo-cat-interest', roundTo(between(rng, 1240, 1900), 0.5), 'Savings account interest');

    // Fixed costs
    add(5, 'expense', 'demo-cat-rent', 18500, 'House rent');
    add(8 + Math.floor(rng() * 5), 'expense', 'demo-cat-bills', roundTo(between(rng, 1650, 3100), 1), 'Electricity bill');
    add(10, 'expense', 'demo-cat-bills', 999, 'Broadband');
    add(14, 'expense', 'demo-cat-bills', 599, 'Mobile recharge');

    // Variable spending
    const dailyCount = 9 + Math.floor(rng() * 5);
    for (let k = 0; k < dailyCount; k += 1) add(randomDay(), 'expense', 'cat-daily', roundTo(between(rng, 90, 1600), 1), pick(rng, POOLS.daily));
    const foodCount = 4 + Math.floor(rng() * 3);
    for (let k = 0; k < foodCount; k += 1) add(randomDay(), 'expense', 'demo-cat-food', roundTo(between(rng, 220, 1900), 1), pick(rng, POOLS.food));
    const petrolCount = 3 + Math.floor(rng() * 2);
    for (let k = 0; k < petrolCount; k += 1) add(randomDay(), 'expense', 'cat-petrol', roundTo(between(rng, 700, 2300), 1), 'Petrol fill-up');
    if (rng() < 0.65) {
      const trips = 1 + Math.floor(rng() * 2);
      for (let k = 0; k < trips; k += 1) add(randomDay(), 'expense', 'cat-travel', roundTo(between(rng, 1100, 7800), 1), pick(rng, POOLS.travel));
    }
    if (i === 3) add(17, 'expense', 'cat-travel', 14800, 'Flight tickets – family trip');
    const shoppingCount = 1 + Math.floor(rng() * 3);
    for (let k = 0; k < shoppingCount; k += 1) add(randomDay(), 'expense', 'cat-shopping', roundTo(between(rng, 899, 6900), 1), pick(rng, POOLS.shopping));
    const funCount = 1 + Math.floor(rng() * 3);
    for (let k = 0; k < funCount; k += 1) add(randomDay(), 'expense', 'demo-cat-fun', roundTo(between(rng, 199, 1299), 1), pick(rng, POOLS.fun));
    if (rng() < 0.5) add(randomDay(), 'expense', 'demo-cat-health', roundTo(between(rng, 450, 3200), 1), pick(rng, POOLS.health));
  }

  // Budgets are derived from the previous full months so the demo shows a healthy mix of states.
  const previousMonths = new Set(Array.from({ length: MONTHS_OF_DEMO_DATA - 1 }, (_, k) => shiftMonth(currentYm, -(k + 1))));
  const alreadyBudgeted = new Set((existing.budgets || []).map((b) => b.categoryId));
  const budgets = [];
  for (const [categoryId, factor] of Object.entries(BUDGET_FACTORS)) {
    if (alreadyBudgeted.has(categoryId)) continue;
    const history = transactions.filter((t) => t.categoryId === categoryId && previousMonths.has(t.date.slice(0, 7)));
    const average = sumAmounts(history) / previousMonths.size;
    budgets.push({
      id: `demo-budget-${categoryId}`,
      categoryId,
      amount: Math.max(1000, Math.ceil((average * factor) / 500) * 500),
      isDemo: true,
    });
  }

  return { transactions, categories: DEMO_CATEGORIES.map((c) => ({ ...c })), budgets };
}
