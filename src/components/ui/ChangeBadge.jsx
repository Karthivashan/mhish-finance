import { ArrowDownRight, ArrowUpRight, Minus } from 'lucide-react';

/** `goodWhen` says which direction is positive for the user (expenses going down is good). */
export default function ChangeBadge({ pct, goodWhen = 'up', suffix = 'vs last month' }) {
  if (pct === null || pct === undefined) return <span className="text-xs text-muted">No prior data</span>;
  const dir = pct > 0 ? 'up' : pct < 0 ? 'down' : 'flat';
  const good = dir === 'flat' ? null : dir === goodWhen;
  const tone = good === null ? 'text-muted bg-raised' : good ? 'text-income bg-income/12' : 'text-expense bg-expense/12';
  const Icon = dir === 'up' ? ArrowUpRight : dir === 'down' ? ArrowDownRight : Minus;
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-muted">
      <span className={`inline-flex items-center gap-0.5 rounded-lg px-1.5 py-0.5 font-bold tnum ${tone}`}>
        <Icon size={13} strokeWidth={2.5} />{Math.abs(pct).toFixed(1)}%
      </span>
      {suffix}
    </span>
  );
}
