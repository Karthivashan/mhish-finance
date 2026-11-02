import { format, getDate } from 'date-fns';
import { currentMonthKey, shiftMonth } from '../utils/dateUtils';
import { createBudget } from './budgetService';
import { createTransaction } from './transactionService';

// Deterministic PRNG so the demo looks the same on every launch.
function mulberry32(a) {
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const DAILY = ['Groceries – BigBasket', 'Vegetables & fruits', 'Milk & dairy', 'Electricity bill', 'Mobile recharge', 'Lunch with colleagues', 'Pharmacy', 'Weekend brunch', 'Internet bill', 'Laundry'];
const TRAVEL = ['Metro card recharge', 'Cab to airport', 'Train tickets – IRCTC', 'Weekend trip', 'Auto & cab rides'];
const SHOP = ['Clothing – Myntra', 'Amazon order', 'Headphones', 'Home decor', 'Gift for a friend', 'Running shoes'];
const PETROL = ['Petrol fill-up', 'Petrol – HP pump', 'Fuel top-up'];

/** Realistic sample data spanning the last 6 months. All records are flagged `isDemo`. */
export function buildDemoTransactions(today = new Date()) {
  const cur = currentMonthKey();
  const todayDay = getDate(today);
  const out = [];
  const add = (type, amount, description, month, day, categoryId) => {
    const d = month === cur ? Math.min(day, todayDay) : day; // never future-date the current month
    out.push(createTransaction({ type, amount, description, date: `${month}-${String(d).padStart(2, '0')}`, categoryId, isDemo: true }));
  };

  for (let i = 5; i >= 0; i--) {
    const month = shiftMonth(cur, -i);
    const rnd = mulberry32(Number(month.replace('-', '')));
    const pick = (arr) => arr[Math.floor(rnd() * arr.length)];
    const between = (lo, hi, step = 10) => Math.round((lo + rnd() * (hi - lo)) / step) * step;
    const isCurrent = month === cur;

    add('income', 85000, 'Monthly salary', month, 1, 'cat-salary');
    if (!isCurrent && i % 2 === 0) add('income', between(6000, 14000, 100), 'Performance bonus', month, 18, 'cat-salary');

    if (isCurrent) {
      // Tuned to demonstrate the 80% and 100% budget states.
      add('expense', 4300, 'Petrol – full tank', month, 1, 'cat-petrol');
      add('expense', 11200, 'Festival shopping – Amazon', month, 1, 'cat-shopping');
      add('expense', 1850.5, 'Groceries – BigBasket', month, 1, 'cat-daily');
      add('expense', 640, 'Metro card recharge', month, 1, 'cat-travel');
      continue;
    }

    const dailyN = 7 + Math.floor(rnd() * 3);
    for (let k = 0; k < dailyN; k++) add('expense', between(180, 3200, 10) + (rnd() > 0.7 ? 0.5 : 0), pick(DAILY), month, 2 + Math.floor(rnd() * 26), 'cat-daily');
    const travelN = 2 + Math.floor(rnd() * 2);
    for (let k = 0; k < travelN; k++) add('expense', between(300, 3800, 10), pick(TRAVEL), month, 3 + Math.floor(rnd() * 24), 'cat-travel');
    const shopN = 2 + Math.floor(rnd() * 2);
    for (let k = 0; k < shopN; k++) add('expense', between(900, 5200, 50), pick(SHOP), month, 4 + Math.floor(rnd() * 23), 'cat-shopping');
    const petrolN = 3 + Math.floor(rnd() * 2);
    for (let k = 0; k < petrolN; k++) add('expense', between(900, 1700, 50), pick(PETROL), month, 2 + Math.floor(rnd() * 26), 'cat-petrol');
  }
  return out;
}

export const buildDemoBudgets = () => [
  createBudget('cat-travel', 8000),
  createBudget('cat-daily', 14000),
  createBudget('cat-shopping', 10000),
  createBudget('cat-petrol', 5000),
];

export const demoStamp = () => format(new Date(), 'yyyy-MM-dd');
