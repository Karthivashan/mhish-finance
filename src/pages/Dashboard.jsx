import { ArrowRight, Database, PiggyBank, Receipt, TrendingDown, TrendingUp, Wallet } from 'lucide-react';
import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import StatCard from '../components/cards/StatCard';
import DonutChart from '../components/charts/DonutChart';
import IncomeExpenseChart from '../components/charts/IncomeExpenseChart';
import TrendChart from '../components/charts/TrendChart';
import { TransactionRow } from '../components/transactions/TransactionList';
import CategoryIcon from '../components/ui/CategoryIcon';
import ChangeBadge from '../components/ui/ChangeBadge';
import EmptyState from '../components/ui/EmptyState';
import MonthSelector from '../components/ui/MonthSelector';
import PageHeader from '../components/ui/PageHeader';
import { useApp } from '../context/AppContext';
import { sortTransactions } from '../services/transactionService';
import { balance, inMonth, monthSummary, monthlySeries, pctChange, rankCategories } from '../utils/calculations';
import { formatINR } from '../utils/currencyUtils';
import { prevMonth } from '../utils/dateUtils';

const greeting = () => { const h = new Date().getHours(); return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening'; };

export default function Dashboard() {
  const { transactions, categories, month, setMonth, monthLabel, profile, preferences } = useApp();

  const d = useMemo(() => {
    const prev = prevMonth(month);
    const cur = monthSummary(transactions, month);
    const pre = monthSummary(transactions, prev);
    const bal = balance(transactions, month);
    const ranking = rankCategories(transactions, categories, month);
    return {
      cur, bal,
      balChange: pctChange(bal, balance(transactions, prev)),
      incChange: pctChange(cur.income, pre.income),
      expChange: pctChange(cur.expense, pre.expense),
      savChange: pctChange(cur.savings, pre.savings),
      ranking, series: monthlySeries(transactions, month, 6),
      recent: sortTransactions(inMonth(transactions, month)).slice(0, 6),
    };
  }, [transactions, categories, month]);

  const firstName = (profile.name || 'there').split(' ')[0];
  const hasSample = preferences.hasDemo && transactions.some((t) => t.isDemo);

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Overview" title={<>{greeting()}, <span className="text-[#E5604D]">{firstName}</span></>} subtitle={`Here’s how ${monthLabel} is shaping up.`}>
        <MonthSelector />
      </PageHeader>

      {hasSample && (
        <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-warn/30 bg-warn/10 px-4 py-3 text-sm">
          <Database size={18} className="shrink-0 text-warn" />
          <p className="min-w-[220px] flex-1"><strong>You’re viewing sample data.</strong> <span className="text-muted">Add your own transactions, or clear the sample records any time.</span></p>
          <Link to="/profile#data" className="font-bold text-accent hover:underline">Manage sample data</Link>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard featured label="Total Balance" icon={Wallet} value={formatINR(d.bal)} description={`Net of all income & expenses to end of ${monthLabel}`}
          footer={<ChangeBadge pct={d.balChange} goodWhen="up" />} />
        <StatCard label="Monthly Income" tone="income" icon={TrendingUp} value={formatINR(d.cur.income)} description="Money received this month"
          footer={<ChangeBadge pct={d.incChange} goodWhen="up" />} />
        <StatCard label="Monthly Expenses" tone="expense" icon={TrendingDown} value={formatINR(d.cur.expense)} description="Money spent this month"
          footer={<ChangeBadge pct={d.expChange} goodWhen="down" />} />
        <StatCard label="Monthly Savings" tone="warn" icon={PiggyBank} value={formatINR(d.cur.savings)} valueClass={d.cur.savings < 0 ? 'text-expense' : ''}
          description={d.cur.income > 0 ? `Savings rate ${d.cur.savingsRate.toFixed(1)}% of income` : 'No income recorded yet'}
          footer={<ChangeBadge pct={d.savChange} goodWhen="up" />} />
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <section className="card flex flex-col p-5 sm:p-6 xl:col-span-2" aria-labelledby="ie-title">
          <h2 id="ie-title" className="text-base font-bold">Income vs. Expenses</h2>
          <p className="mb-4 text-xs text-muted">Last 6 months · tap a bar to jump to that month</p>
          <IncomeExpenseChart fill data={d.series} selected={month} onSelect={setMonth} />
        </section>
        <section className="card p-5 sm:p-6" aria-labelledby="dist-title">
          <h2 id="dist-title" className="text-base font-bold">Expense Distribution</h2>
          <p className="mb-4 text-xs text-muted">{monthLabel}</p>
          <DonutChart stacked ranking={d.ranking} total={d.cur.expense} />
        </section>
        <section className="card flex flex-col p-5 sm:p-6 xl:col-span-2" aria-labelledby="trend-title">
          <h2 id="trend-title" className="text-base font-bold">Spending Trend</h2>
          <p className="mb-4 text-xs text-muted">Monthly expenses, ending {monthLabel}</p>
          <TrendChart fill data={d.series} selected={month} />
        </section>
        <section className="card p-5 sm:p-6" aria-labelledby="top-title">
          <div className="mb-4 flex items-center justify-between">
            <h2 id="top-title" className="text-base font-bold">Top Spending Categories</h2>
            <Link to="/insights" className="text-xs font-bold text-accent hover:underline">Insights</Link>
          </div>
          {d.ranking.length === 0 ? <p className="py-10 text-center text-sm text-muted">No expenses in {monthLabel}.</p> : (
            <ol className="space-y-4">
              {d.ranking.slice(0, 5).map((r, i) => (
                <li key={r.category.id} className="flex items-center gap-3">
                  <span className="w-4 text-xs font-bold text-muted tnum">{i + 1}</span>
                  <CategoryIcon name={r.category.icon} color={r.category.color} size={38} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="truncate text-sm font-bold">{r.category.name}</span>
                      <span className="text-sm font-bold tnum">{formatINR(r.total)}</span>
                    </div>
                    <div className="mt-1.5 flex items-center gap-2">
                      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-raised" aria-hidden="true">
                        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${r.pct}%`, background: r.category.color }} />
                      </div>
                      <span className="w-12 text-right text-xs text-muted tnum">{r.pct.toFixed(1)}%</span>
                    </div>
                  </div>
                </li>
              ))}
            </ol>
          )}
        </section>
      </div>

      <section className="card p-5 sm:p-6" aria-labelledby="recent-title">
        <div className="mb-2 flex items-center justify-between">
          <div><h2 id="recent-title" className="text-base font-bold">Recent Transactions</h2><p className="text-xs text-muted">Latest activity in {monthLabel}</p></div>
          <Link to="/spend" className="btn-ghost !h-9 text-xs">View all <ArrowRight size={14} /></Link>
        </div>
        {d.recent.length === 0 ? (
          <EmptyState icon={Receipt} title="No transactions this month" message="Record your first income or expense to start building insights."
            action={<Link to="/spend/new/expense" className="btn-primary">Add transaction</Link>} />
        ) : <ul className="divide-y divide-line/50">{d.recent.map((tx) => <TransactionRow key={tx.id} tx={tx} actions={false} compact />)}</ul>}
      </section>
    </div>
  );
}
