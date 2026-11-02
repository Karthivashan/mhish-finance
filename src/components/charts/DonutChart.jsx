import { useState } from 'react';
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import { formatINR } from '../../utils/currencyUtils';
import CategoryIcon from '../ui/CategoryIcon';
import ChartTooltip from './ChartTooltip';
import { useChartColors } from './chartTheme';

export default function DonutChart({ ranking, total, height = 220, stacked = false }) {
  const c = useChartColors();
  const [active, setActive] = useState(null);
  if (!ranking.length) return <p className="py-16 text-center text-sm text-muted">No expenses in this month.</p>;
  const data = ranking.map((r) => ({ name: r.category.name, value: r.total, fill: r.category.color }));
  const focus = active !== null ? ranking[active] : null;

  return (
    <div className={`flex flex-col items-center gap-6 ${stacked ? "" : "sm:flex-row"}`}>
      <div className="relative w-full max-w-[240px] shrink-0" style={{ height }} role="img" aria-label="Donut chart of expense distribution by category">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} dataKey="value" nameKey="name" innerRadius="64%" outerRadius="94%" paddingAngle={data.length > 1 ? 2 : 0}
              stroke={c.ring} strokeWidth={3} onMouseEnter={(_, i) => setActive(i)} onMouseLeave={() => setActive(null)} isAnimationActive>
              {data.map((d, i) => <Cell key={d.name} fill={d.fill} fillOpacity={active === null || active === i ? 1 : 0.35} />)}
            </Pie>
            <Tooltip content={<ChartTooltip />} />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className="eyebrow">{focus ? focus.category.name : 'Total spent'}</span>
          <span className="mt-1 text-base font-extrabold tnum">{formatINR(focus ? focus.total : total)}</span>
          {focus && <span className="text-xs text-muted tnum">{focus.pct.toFixed(1)}%</span>}
        </div>
      </div>
      <ul className="w-full min-w-0 flex-1 space-y-1">
        {ranking.map((r, i) => (
          <li key={r.category.id}>
            <button type="button" onMouseEnter={() => setActive(i)} onMouseLeave={() => setActive(null)} onFocus={() => setActive(i)} onBlur={() => setActive(null)}
              className="flex w-full items-center gap-3 rounded-xl px-2 py-2 text-left transition hover:bg-raised">
              <CategoryIcon name={r.category.icon} color={r.category.color} size={32} />
              <span className="min-w-0 flex-1 truncate text-sm font-semibold">{r.category.name}</span>
              <span className="text-sm font-bold tnum">{formatINR(r.total)}</span>
              <span className="w-12 text-right text-xs text-muted tnum">{r.pct.toFixed(1)}%</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
