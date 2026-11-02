export default function StatCard({ label, value, icon: Icon, description, footer, tone = 'accent', featured = false, valueClass = '' }) {
  const tones = {
    accent: 'bg-accent/15 text-accent',
    income: 'bg-income/15 text-income',
    expense: 'bg-expense/15 text-expense',
    warn: 'bg-warn/15 text-warn',
  };
  return (
    <section className={`card relative overflow-hidden p-5 transition hover:-translate-y-0.5 ${featured ? 'bg-gradient-to-br from-accent/25 via-surface to-surface ring-1 ring-accent/30' : ''}`} aria-label={label}>
      {featured && <div aria-hidden="true" className="pointer-events-none absolute -right-10 -top-10 h-36 w-36 rounded-full bg-accent/20 blur-2xl" />}
      <div className="relative flex items-start justify-between">
        <p className="eyebrow">{label}</p>
        <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${tones[tone]}`}><Icon size={19} /></span>
      </div>
      <p className={`relative mt-3 text-[26px] font-extrabold leading-tight tracking-tight tnum break-words ${valueClass}`}>{value}</p>
      {description && <p className="relative mt-1 text-xs text-muted">{description}</p>}
      {footer && <div className="relative mt-4 border-t border-line/50 pt-3">{footer}</div>}
    </section>
  );
}
