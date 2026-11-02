import { formatINR } from '../../utils/currencyUtils';

export default function ChartTooltip({ active, payload, label, labelFormatter }) {
  if (!active || !payload?.length) return null;
  const title = labelFormatter ? labelFormatter(label, payload) : label;
  return (
    <div className="min-w-[150px] rounded-xl border border-line bg-surface px-3.5 py-3 text-sm shadow-pop">
      {title && <p className="eyebrow mb-2">{title}</p>}
      <ul className="space-y-1.5">
        {payload.filter((p) => p.value !== undefined).map((p) => (
          <li key={p.dataKey || p.name} className="flex items-center justify-between gap-4">
            <span className="flex items-center gap-2 text-muted">
              <span className="h-2.5 w-2.5 rounded-sm" style={{ background: p.color || p.payload?.fill }} />{p.name}
            </span>
            <span className="font-bold tnum">{formatINR(p.value)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
