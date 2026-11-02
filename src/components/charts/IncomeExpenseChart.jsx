import { Bar, BarChart, CartesianGrid, Cell, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { formatCompact } from '../../utils/currencyUtils';
import { monthLabel } from '../../utils/dateUtils';
import ChartTooltip from './ChartTooltip';
import { useChartColors } from './chartTheme';

export default function IncomeExpenseChart({ data, selected, onSelect, height = 280, fill = false }) {
  const c = useChartColors();
  const empty = data.every((d) => !d.income && !d.expense);
  if (empty) return <p className="py-16 text-center text-sm text-muted">No income or expenses recorded in this period.</p>;
  return (
    <div style={fill ? undefined : { height }} className={fill ? 'min-h-[280px] flex-1' : ''} role="img" aria-label="Bar chart comparing monthly income and expenses">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} barGap={4} barCategoryGap="24%" margin={{ top: 8, right: 4, left: -8, bottom: 0 }}>
          <CartesianGrid vertical={false} stroke={c.grid} />
          <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fill: c.axis, fontSize: 12, fontWeight: 600 }} />
          <YAxis tickLine={false} axisLine={false} width={56} tick={{ fill: c.axis, fontSize: 11 }} tickFormatter={formatCompact} />
          <Tooltip cursor={{ fill: c.cursor }} content={<ChartTooltip labelFormatter={(_, p) => monthLabel(p[0].payload.month)} />} />
          <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12, paddingTop: 8 }} formatter={(v) => <span style={{ color: c.axis, fontWeight: 600 }}>{v}</span>} />
          <Bar dataKey="income" name="Income" fill={c.income} radius={[6, 6, 0, 0]} maxBarSize={28} onClick={(d) => onSelect?.(d.month)} cursor={onSelect ? 'pointer' : 'default'}>
            {data.map((d) => <Cell key={d.month} fill={c.income} fillOpacity={!selected || d.month === selected ? 1 : 0.4} />)}
          </Bar>
          <Bar dataKey="expense" name="Expenses" fill={c.expense} radius={[6, 6, 0, 0]} maxBarSize={28} onClick={(d) => onSelect?.(d.month)} cursor={onSelect ? 'pointer' : 'default'}>
            {data.map((d) => <Cell key={d.month} fill={c.expense} fillOpacity={!selected || d.month === selected ? 1 : 0.4} />)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
