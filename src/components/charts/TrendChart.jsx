import { Area, AreaChart, CartesianGrid, ReferenceDot, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { formatCompact } from '../../utils/currencyUtils';
import { monthLabel } from '../../utils/dateUtils';
import ChartTooltip from './ChartTooltip';
import { useChartColors } from './chartTheme';

export default function TrendChart({ data, selected, height = 260, fill = false }) {
  const c = useChartColors();
  if (data.every((d) => !d.expense)) return <p className="py-16 text-center text-sm text-muted">No spending to chart yet.</p>;
  const sel = data.find((d) => d.month === selected);
  return (
    <div style={fill ? undefined : { height }} className={fill ? 'min-h-[260px] flex-1' : ''} role="img" aria-label="Area chart of monthly spending trend">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 12, right: 12, left: -8, bottom: 0 }}>
          <defs>
            <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={c.expense} stopOpacity={0.35} />
              <stop offset="100%" stopColor={c.expense} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} stroke={c.grid} />
          <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fill: c.axis, fontSize: 12, fontWeight: 600 }} />
          <YAxis tickLine={false} axisLine={false} width={56} tick={{ fill: c.axis, fontSize: 11 }} tickFormatter={formatCompact} />
          <Tooltip cursor={{ stroke: c.axis, strokeDasharray: 4 }} content={<ChartTooltip labelFormatter={(_, p) => monthLabel(p[0].payload.month)} />} />
          <Area type="monotone" dataKey="expense" name="Expenses" stroke={c.expense} strokeWidth={2.5} fill="url(#trendFill)" dot={{ r: 3, fill: c.expense, strokeWidth: 0 }} activeDot={{ r: 5 }} />
          {sel && <ReferenceDot x={sel.label} y={sel.expense} r={7} fill={c.expense} stroke={c.ring} strokeWidth={3} />}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
