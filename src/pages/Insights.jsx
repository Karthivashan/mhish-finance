import { ArrowDownRight, ArrowUpRight, Crown, Minus, PieChart as PieIcon } from 'lucide-react';
import { useMemo, useState } from 'react';
import DonutChart from '../components/charts/DonutChart';
import IncomeExpenseChart from '../components/charts/IncomeExpenseChart';
import TrendChart from '../components/charts/TrendChart';
import CategoryIcon from '../components/ui/CategoryIcon';
import EmptyState from '../components/ui/EmptyState';
import MonthSelector from '../components/ui/MonthSelector';
import PageHeader from '../components/ui/PageHeader';
import { useApp } from '../context/AppContext';
import { categoryTotals, monthComparison, monthSummary, monthlySeries, rankCategories } from '../utils/calculations';
import { formatINR } from '../utils/currencyUtils';
import { monthLabel as labelOf, prevMonth } from '../utils/dateUtils';

export default function Insights() {
  const { transactions, categories, month, setMonth, monthLabel, getCategory } = useApp();
  const [range, setRange] = useState(6);

  const d = useMemo(() => {
    const ranking = rankCategories(transactions, categories, month);
    const cmp = monthComparison(transactions, month);
    const prevTotals = categoryTotals(transactions, prevMonth(month));
    const curTotals = categoryTotals(transactions, month);
    const ids = new Set([...prevTotals.keys(), ...curTotals.keys()]);
    const movers = [...ids]
      .map((id) => ({ id, cur: curTotals.get(id) || 0, prev: prevTotals.get(id) || 0 }))
      .map((m) => ({ ...m, diff: Math.round((m.cur - m.prev) * 100) / 100 }))
      .filter((m) => m.diff !== 0)
      .sort((a, b) => Math.abs(b.diff) - Math.abs(a.diff))
      .slice(0, 4);
    return { ranking, cmp, movers, summary: monthSummary(transactions, month), series: monthlySeries(transactions, month, range) };
  }, [transactions, categories, month, range]);

  const top = d.ranking[0];
  const hasData = d.summary.expense > 0 || d.summary.income > 0;
  const cmpDir = d.cmp.diff > 0 ? 'up' : d.cmp.diff < 0 ? 'down' : 'flat';

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Insights" title={<>Financial  <span className="text-[#E5604D]">analytics</span></>}  subtitle={`Everything below is calculated live from your transactions — ${monthLabel}.`}>
        
        <MonthSelector />
      </PageHeader>

      {!hasData && transactions.length === 0 ? (
        <div className="card"><EmptyState icon={PieIcon} title="No data to analyse yet" message="Add a few transactions and your insights will appear here." /></div>
      ) : (
        <>
          <div className="grid gap-6 lg:grid-cols-2">
            {/* E. Highest spending category */}
            <section className="card relative flex flex-col overflow-hidden p-6" aria-labelledby="high-title">
              <div aria-hidden="true" className="pointer-events-none absolute -right-12 -top-12 h-44 w-44 rounded-full blur-3xl" style={{ background: `${top?.category.color || '#00A651'}33` }} />
              <div className="relative flex items-center gap-2 text-warn"><Crown size={16} /><h2 id="high-title" className="eyebrow !text-warn">Highest spending category</h2></div>
              {top ? (
                <div className="relative my-auto flex items-center gap-5 py-6">
                  <CategoryIcon name={top.category.icon} color={top.category.color} size={64} />
                  <div className="min-w-0">
                    <p className="truncate text-2xl font-extrabold">{top.category.name}</p>
                    <p className="mt-1 text-3xl font-extrabold tracking-tight tnum">{formatINR(top.total)}</p>
                    <p className="mt-1 text-sm text-muted"><strong className="text-ink tnum">{top.pct.toFixed(1)}%</strong> of all spending in {monthLabel}</p>
                  </div>
                </div>
              ) : <p className="relative mt-5 text-sm text-muted">No expenses recorded in {monthLabel}.</p>}
            </section>

            {/* F. Month-over-month */}
            <section className="card p-6" aria-labelledby="mom-title">
              <h2 id="mom-title" className="eyebrow">Month-over-month comparison</h2>
              <div className="mt-4 grid grid-cols-2 gap-4">
                <div><p className="text-xs text-muted">{labelOf(prevMonth(month))}</p><p className="mt-1 text-lg font-extrabold tnum">{formatINR(d.cmp.previous)}</p></div>
                <div><p className="text-xs text-muted">{monthLabel}</p><p className="mt-1 text-lg font-extrabold tnum">{formatINR(d.cmp.current)}</p></div>
              </div>
              <div className={`mt-4 flex items-center gap-3 rounded-xl px-4 py-3 ${cmpDir === 'up' ? 'bg-expense/12 text-expense' : cmpDir === 'down' ? 'bg-income/12 text-income' : 'bg-raised text-muted'}`}>
                {cmpDir === 'up' ? <ArrowUpRight size={20} /> : cmpDir === 'down' ? <ArrowDownRight size={20} /> : <Minus size={20} />}
                <p className="text-sm font-bold">
                  {d.cmp.pct === null ? 'No spending last month to compare against'
                    : cmpDir === 'flat' ? 'Spending is unchanged'
                    : `${Math.abs(d.cmp.pct).toFixed(1)}% ${cmpDir === 'up' ? 'more' : 'less'} than last month (${formatINR(Math.abs(d.cmp.diff))})`}
                </p>
              </div>
              {d.movers.length > 0 && (
                <ul className="mt-4 space-y-2">
                  {d.movers.map((m) => {
                    const c = getCategory(m.id);
                    return (
                      <li key={m.id} className="flex items-center gap-3 text-sm">
                        <CategoryIcon name={c.icon} color={c.color} size={28} />
                        <span className="flex-1 truncate font-semibold">{c.name}</span>
                        <span className={`font-bold tnum ${m.diff > 0 ? 'text-expense' : 'text-income'}`}>{m.diff > 0 ? '+' : '−'}{formatINR(Math.abs(m.diff))}</span>
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>
          </div>

          <div className="grid gap-6 xl:grid-cols-5">
            {/* A. Ranking */}
            <section className="card p-5 sm:p-6 xl:col-span-3" aria-labelledby="rank-title">
              <h2 id="rank-title" className="text-base font-bold">Category ranking</h2>
              <p className="mb-5 text-xs text-muted">Expenses in {monthLabel}, highest first</p>
              {d.ranking.length === 0 ? <p className="py-10 text-center text-sm text-muted">No expenses in this month.</p> : (
                <ol className="space-y-5">
                  {d.ranking.map((r, i) => (
                    <li key={r.category.id} className="flex items-center gap-3 sm:gap-4">
                      <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs font-extrabold tnum ${i === 0 ? 'bg-warn/20 text-warn' : 'bg-raised text-muted'}`}>{i + 1}</span>
                      <CategoryIcon name={r.category.icon} color={r.category.color} size={42} />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-baseline justify-between gap-3">
                          <span className="truncate text-sm font-bold">{r.category.name}</span>
                          <span className="shrink-0 text-sm font-extrabold tnum">{formatINR(r.total)}</span>
                        </div>
                        <div className="mt-2 flex items-center gap-3">
                          <div className="h-2 flex-1 overflow-hidden rounded-full bg-raised" role="meter" aria-label={`${r.category.name} share of spending`} aria-valuenow={r.pct} aria-valuemin={0} aria-valuemax={100}>
                            <div className="h-full rounded-full transition-all duration-700" style={{ width: `${(r.total / d.ranking[0].total) * 100}%`, background: r.category.color }} />
                          </div>
                          <span className="w-14 shrink-0 text-right text-xs font-semibold text-muted tnum">{r.pct.toFixed(1)}%</span>
                        </div>
                      </div>
                    </li>
                  ))}
                </ol>
              )}
            </section>

            {/* B. Distribution */}
            <section className="card p-5 sm:p-6 xl:col-span-2" aria-labelledby="dist-title">
              <h2 id="dist-title" className="text-base font-bold">Category distribution</h2>
              <p className="mb-4 text-xs text-muted">Share of {formatINR(d.summary.expense)} spent</p>
              <DonutChart stacked ranking={d.ranking} total={d.summary.expense} />
            </section>
          </div>

          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold">Trends</h2>
            <div className="grid grid-cols-2 gap-1 rounded-xl border border-line bg-surface p-1" role="group" aria-label="Chart range">
              {[6, 12].map((n) => (
                <button key={n} type="button" aria-pressed={range === n} onClick={() => setRange(n)}
                  className={`h-8 rounded-lg px-4 text-xs font-bold transition ${range === n ? 'bg-accent text-accent-ink' : 'text-muted hover:text-ink'}`}>{n} months</button>
              ))}
            </div>
          </div>
          <div className="grid gap-6 xl:grid-cols-2">
            <section className="card p-5 sm:p-6" aria-labelledby="ie-title">
              <h2 id="ie-title" className="text-base font-bold">Income vs. expense</h2>
              <p className="mb-4 text-xs text-muted">Monthly comparison · tap a bar to select a month</p>
              <IncomeExpenseChart data={d.series} selected={month} onSelect={setMonth} />
            </section>
            <section className="card p-5 sm:p-6" aria-labelledby="trend-title">
              <h2 id="trend-title" className="text-base font-bold">Monthly spending trend</h2>
              <p className="mb-4 text-xs text-muted">How your expenses have moved over time</p>
              <TrendChart data={d.series} selected={month} />
            </section>
          </div>
        </>
      )}
    </div>
  );
}
