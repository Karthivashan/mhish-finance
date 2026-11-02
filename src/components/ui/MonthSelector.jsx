import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { MONTH_NAMES, currentMonthKey, monthKeyFromParts, shiftMonth } from '../../utils/dateUtils';

export default function MonthSelector({ className = '' }) {
  const { month, setMonth, transactions } = useApp();
  const [y, m] = month.split('-').map(Number);
  const thisYear = new Date().getFullYear();
  const minYear = Math.min(thisYear - 3, ...transactions.map((t) => Number(t.date.slice(0, 4))));
  const years = Array.from({ length: thisYear + 2 - minYear }, (_, i) => minYear + i);
  const isCurrent = month === currentMonthKey();

  return (
    <div className={`flex items-center gap-1.5 ${className}`} role="group" aria-label="Select month">
      <button type="button" className="btn-icon" onClick={() => setMonth(shiftMonth(month, -1))} aria-label="Previous month"><ChevronLeft size={18} /></button>
      <label className="sr-only" htmlFor="ms-month">Month</label>
      <select id="ms-month" className="field !h-10 !w-auto !px-3 font-semibold" value={m} onChange={(e) => setMonth(monthKeyFromParts(y, Number(e.target.value)))}>
        {MONTH_NAMES.map((n, i) => <option key={n} value={i + 1}>{n}</option>)}
      </select>
      <label className="sr-only" htmlFor="ms-year">Year</label>
      <select id="ms-year" className="field !h-10 !w-auto !px-3 font-semibold" value={y} onChange={(e) => setMonth(monthKeyFromParts(Number(e.target.value), m))}>
        {years.map((yr) => <option key={yr} value={yr}>{yr}</option>)}
      </select>
      <button type="button" className="btn-icon" onClick={() => setMonth(shiftMonth(month, 1))} aria-label="Next month"><ChevronRight size={18} /></button>
      {!isCurrent && <button type="button" className="btn-ghost !h-10 !px-3 text-xs" onClick={() => setMonth(currentMonthKey())}>Today</button>}
    </div>
  );
}
