import { ArrowDownLeft, ArrowUpRight, Plus, Receipt, Search } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import TransactionList from '../components/transactions/TransactionList';
import EmptyState from '../components/ui/EmptyState';
import MonthSelector from '../components/ui/MonthSelector';
import PageHeader from '../components/ui/PageHeader';
import { useApp } from '../context/AppContext';
import { sortTransactions } from '../services/transactionService';
import { formatINR, sumMoney } from '../utils/currencyUtils';
import { monthOf } from '../utils/dateUtils';

const TABS = [
  { key: 'income', label: 'Income', icon: ArrowDownLeft },
  { key: 'expense', label: 'Expenses', icon: ArrowUpRight },
];

export default function Spend() {
  const [params, setParams] = useSearchParams();
  const tab = params.get('tab') === 'income' ? 'income' : 'expense';
  const { transactions, month, monthLabel, getCategory } = useApp();
  const [scope, setScope] = useState('month');
  const [query, setQuery] = useState('');

  const income = tab === 'income';
  const { rows, total, allCount } = useMemo(() => {
    const ofType = transactions.filter((t) => t.type === tab);
    const scoped = scope === 'month' ? ofType.filter((t) => monthOf(t.date) === month) : ofType;
    const q = query.trim().toLowerCase();
    const filtered = q ? scoped.filter((t) => `${t.description} ${getCategory(t.categoryId).name}`.toLowerCase().includes(q)) : scoped;
    return { rows: sortTransactions(filtered), total: sumMoney(filtered.map((t) => t.amount)), allCount: ofType.length };
  }, [transactions, tab, scope, month, query, getCategory]);

  const onKey = (e) => {
    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
      const next = tab === 'income' ? 'expense' : 'income';
      setParams({ tab: next }, { replace: true });
      document.getElementById(`tab-${next}`)?.focus();
    }
  };

  return (
    <div className="space-y-3 sm:space-y-6">
      <PageHeader className="mb-4 flex flex-col gap-3 sm:mb-7 sm:flex-row sm:items-end sm:justify-between sm:gap-4"
        eyebrow="Spend" title={<>Income & <span className="text-[#0BDA51]">Expenses</span></>} subtitle="Record money in and out, and review every transaction.">
        <Link to={`/spend/new/${tab}`} className="btn-primary"><Plus size={18} />Add {income ? 'income' : 'expense'}</Link>
      </PageHeader>

      <div role="tablist" aria-label="Transaction type" onKeyDown={onKey} className="inline-grid grid-cols-2 gap-1 rounded-xl border border-line bg-surface p-1">
        {TABS.map(({ key, label, icon: Icon }) => (
          <button key={key} id={`tab-${key}`} role="tab" aria-selected={tab === key} aria-controls="tab-panel" tabIndex={tab === key ? 0 : -1}
            onClick={() => setParams({ tab: key }, { replace: true })}
            className={`flex h-10 min-w-0 items-center justify-center gap-2 rounded-lg px-3 text-xs font-bold transition sm:min-w-32 sm:px-5 sm:text-sm ${tab === key ? 'bg-accent text-accent-ink shadow' : 'text-muted hover:text-ink'}`}>
            <Icon size={16} />{label}
          </button>
        ))}
      </div>

      <section id="tab-panel" role="tabpanel" aria-labelledby={`tab-${tab}`} className="card">
        <div className="flex flex-col gap-3 border-b border-line/60 p-4 sm:gap-4 sm:p-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="eyebrow">{scope === 'month' ? monthLabel : 'All time'} · {income ? 'Total income' : 'Total expenses'}</p>
            <p className={`mt-1 text-3xl font-extrabold tracking-tight tnum ${income ? 'text-income' : 'text-expense'}`}>{formatINR(total)}</p>
            <p className="text-xs text-muted">{rows.length} {rows.length === 1 ? 'transaction' : 'transactions'}</p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
            <div className="grid grid-cols-2 gap-1 rounded-xl border border-line bg-bg/40 p-1" role="group" aria-label="Date range">
              {[['month', 'This month'], ['all', 'All time']].map(([k, l]) => (
                <button key={k} type="button" aria-pressed={scope === k} onClick={() => setScope(k)}
                  className={`h-9 rounded-lg px-4 text-xs font-bold transition ${scope === k ? 'bg-raised text-ink shadow' : 'text-muted hover:text-ink'}`}>{k === 'month' ? 'Month' : l}</button>
              ))}
            </div>
            <div className="relative">
              <Search size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
              <label htmlFor="tx-search" className="sr-only">Search transactions</label>
              <input id="tx-search" type="search" className="field !pl-10 sm:w-60" placeholder="Search description or category" value={query} onChange={(e) => setQuery(e.target.value)} />
            </div>
          </div>
        </div>
        {scope === 'month' && <div className="border-b border-line/60 px-4 py-2 sm:px-6 sm:py-3"><MonthSelector /></div>}

        <div className="p-1.5 sm:p-4">
          {rows.length === 0 ? (
            <EmptyState icon={Receipt}
              title={query ? 'No matches found' : allCount === 0 ? `No ${income ? 'income' : 'expenses'} yet` : `Nothing in ${scope === 'month' ? monthLabel : 'this view'}`}
              message={query ? 'Try a different search term.' : allCount === 0 ? `Add your first ${income ? 'income' : 'expense'} to see it here and in your insights.` : 'Pick another month or switch to All time.'}
              action={!query && <Link to={`/spend/new/${tab}`} className="btn-primary"><Plus size={18} />Add {income ? 'income' : 'expense'}</Link>} />
          ) : <TransactionList transactions={rows} />}
        </div>
      </section>
    </div>
  );
}
