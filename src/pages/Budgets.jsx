import { AlertTriangle, CheckCircle2, Pencil, Plus, Target, Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import AmountInput from '../components/forms/AmountInput';
import CategoryIcon from '../components/ui/CategoryIcon';
import Dialog, { ConfirmDialog } from '../components/ui/Dialog';
import EmptyState from '../components/ui/EmptyState';
import MonthSelector from '../components/ui/MonthSelector';
import PageHeader from '../components/ui/PageHeader';
import { useApp } from '../context/AppContext';
import { budgetStatus, categoryTotals } from '../utils/calculations';
import { formatINR, parseAmount, sumMoney } from '../utils/currencyUtils';

const LEVEL = {
  normal: { label: 'On track', bar: 'bg-accent', chip: 'bg-accent/15 text-accent', icon: CheckCircle2 },
  warn: { label: 'Approaching limit', bar: 'bg-warn', chip: 'bg-warn/15 text-warn', icon: AlertTriangle },
  exceeded: { label: 'Budget exceeded', bar: 'bg-expense', chip: 'bg-expense/15 text-expense', icon: AlertTriangle },
};

function BudgetDialog({ open, onClose, editing, available }) {
  const { setBudget, getCategory, month } = useApp();
  const { control, handleSubmit, register, reset, formState: { errors } } = useForm({
    values: { categoryId: editing?.categoryId || available[0]?.id || '', amount: editing ? String(editing.amount) : '' },
  });
  const submit = (v) => {
    setBudget(v.categoryId, parseAmount(v.amount), month);
    reset(); onClose();
  };
  const cat = editing ? getCategory(editing.categoryId) : null;
  return (
    <Dialog open={open} onClose={onClose} title={editing ? `Edit ${cat.name} budget` : 'Set a monthly budget'}
      description="Limits apply to every calendar month. Alerts fire at 80% and 100%."
      footer={<>
        <button type="button" className="btn-ghost" onClick={onClose}>Cancel</button>
        <button type="submit" form="budget-form" className="btn-primary">Save budget</button>
      </>}>
      <form id="budget-form" onSubmit={handleSubmit(submit)} noValidate className="space-y-5">
        {!editing && (
          <div>
            <label htmlFor="budget-cat" className="label">Category</label>
            <select id="budget-cat" className="field" {...register('categoryId', { required: 'Choose a category.' })}>
              {available.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
        )}
        <div>
          <label htmlFor="amount" className="label">Monthly limit</label>
          <Controller name="amount" control={control}
            rules={{ required: 'Enter a budget amount.', validate: (v) => { const n = parseAmount(v); return (Number.isFinite(n) && n > 0 && n <= 999999999.99) || 'Enter an amount greater than ₹0.'; } }}
            render={({ field }) => <AmountInput {...field} invalid={!!errors.amount} describedBy="budget-amount-error" />} />
          {errors.amount && <p id="budget-amount-error" role="alert" className="mt-2 text-xs font-semibold text-expense">{errors.amount.message}</p>}
        </div>
      </form>
    </Dialog>
  );
}

export default function Budgets() {
  const { categories, budgets, transactions, month, monthLabel, deleteBudget, getCategory } = useApp();
  const [dialog, setDialog] = useState({ open: false, editing: null });
  const [removing, setRemoving] = useState(null);

  const { rows, totals, available, unbudgetedSpend } = useMemo(() => {
    const spend = categoryTotals(transactions, month);
    const rows = budgets
      .filter((b) => categories.some((c) => c.id === b.categoryId))
      .map((b) => ({ budget: b, category: getCategory(b.categoryId), spent: spend.get(b.categoryId) || 0, ...budgetStatus(spend.get(b.categoryId) || 0, b.amount) }))
      .sort((a, b) => b.pct - a.pct);
    const budgeted = new Set(budgets.map((b) => b.categoryId));
    const limit = sumMoney(rows.map((r) => r.budget.amount));
    const spent = sumMoney(rows.map((r) => r.spent));
    return {
      rows, available: categories.filter((c) => c.type === 'expense' && !budgeted.has(c.id)),
      totals: { limit, spent, ...budgetStatus(spent, limit), attention: rows.filter((r) => r.level !== 'normal').length },
      unbudgetedSpend: [...spend.entries()].filter(([id]) => !budgeted.has(id)).map(([id, total]) => ({ category: getCategory(id), total })),
    };
  }, [budgets, categories, transactions, month, getCategory]);

  const overall = LEVEL[totals.level];

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Budgets" title={<>Category  <span className="text-[#0BDA51]">budgets</span></>}
        subtitle={`Spending against your monthly limits — ${monthLabel}.`}>
        <MonthSelector />
        <button type="button" className="btn-primary" disabled={available.length === 0} onClick={() => setDialog({ open: true, editing: null })}
          title={available.length === 0 ? 'Every expense category already has a budget' : undefined}><Plus size={18} />Set budget</button>
      </PageHeader>

      {rows.length === 0 ? (
        <div className="card"><EmptyState icon={Target} title="No budgets yet" message="Set a monthly limit for a category and Mhish will track your progress and warn you before you overspend."
          action={<button type="button" className="btn-primary" onClick={() => setDialog({ open: true, editing: null })}><Plus size={18} />Set your first budget</button>} /></div>
      ) : (
        <>
          <section className="card grid gap-6 p-6 md:grid-cols-[1.2fr_1fr] md:items-center" aria-label="Budget summary">
            <div>
              <p className="eyebrow">Total budgeted · {monthLabel}</p>
              <p className="mt-1 text-3xl font-extrabold tracking-tight tnum">{formatINR(totals.spent)} <span className="text-lg font-bold text-muted">of {formatINR(totals.limit)}</span></p>
              <div className="mt-4 h-3 overflow-hidden rounded-full bg-raised" role="progressbar" aria-label="Overall budget used" aria-valuenow={Math.min(100, Math.round(totals.pct))} aria-valuemin={0} aria-valuemax={100}>
                <div className={`h-full rounded-full transition-all duration-700 ${overall.bar}`} style={{ width: `${Math.min(100, totals.pct)}%` }} />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3 text-center">
              {[['Used', `${totals.pct.toFixed(0)}%`], ['Remaining', formatINR(Math.max(0, totals.remaining))], ['Need attention', totals.attention]].map(([l, v]) => (
                <div key={l} className="rounded-xl bg-raised/60 px-2 py-3"><p className="text-[11px] font-bold uppercase tracking-wider text-muted">{l}</p><p className="mt-1 break-words text-sm font-extrabold tnum sm:text-base">{v}</p></div>
              ))}
            </div>
          </section>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {rows.map((r) => {
              const lv = LEVEL[r.level]; const Icon = lv.icon;
              return (
                <article key={r.budget.id} className={`card p-5 transition hover:-translate-y-0.5 ${r.level === 'exceeded' ? 'ring-1 ring-expense/40' : r.level === 'warn' ? 'ring-1 ring-warn/30' : ''}`} aria-label={`${r.category.name} budget`}>
                  <div className="flex items-start gap-3">
                    <CategoryIcon name={r.category.icon} color={r.category.color} size={46} />
                    <div className="min-w-0 flex-1">
                      <h3 className="truncate text-base font-bold">{r.category.name}</h3>
                      <span className={`mt-1 inline-flex items-center gap-1 rounded-lg px-2 py-0.5 text-[11px] font-bold ${lv.chip}`}><Icon size={12} />{lv.label}</span>
                    </div>
                    <div className="flex gap-1">
                      <button type="button" className="btn-icon !h-9 !w-9" aria-label={`Edit ${r.category.name} budget`} onClick={() => setDialog({ open: true, editing: r.budget })}><Pencil size={15} /></button>
                      <button type="button" className="btn-icon !h-9 !w-9 hover:!border-expense/60 hover:!text-expense" aria-label={`Remove ${r.category.name} budget`} onClick={() => setRemoving(r)}><Trash2 size={15} /></button>
                    </div>
                  </div>
                  <div className="mt-5 flex items-end justify-between">
                    <p className="text-2xl font-extrabold tracking-tight tnum">{formatINR(r.spent)}</p>
                    <p className="text-sm font-bold text-muted tnum">{r.pct.toFixed(0)}%</p>
                  </div>
                  <div className="relative mt-2 h-2.5 overflow-hidden rounded-full bg-raised" role="progressbar" aria-label={`${r.category.name} budget used`} aria-valuenow={Math.min(100, Math.round(r.pct))} aria-valuemin={0} aria-valuemax={100}>
                    <div className={`h-full rounded-full transition-all duration-700 ${lv.bar}`} style={{ width: `${Math.min(100, r.pct)}%` }} />
                    <span className="absolute inset-y-0 left-[80%] w-px bg-ink/30" aria-hidden="true" />
                  </div>
                  <dl className="mt-4 grid grid-cols-2 gap-3 text-xs">
                    <div><dt className="text-muted">Budget</dt><dd className="mt-0.5 font-bold tnum">{formatINR(r.budget.amount)}</dd></div>
                    <div className="text-right"><dt className="text-muted">{r.remaining < 0 ? 'Over by' : 'Remaining'}</dt>
                      <dd className={`mt-0.5 font-bold tnum ${r.remaining < 0 ? 'text-expense' : ''}`}>{formatINR(Math.abs(r.remaining))}</dd></div>
                  </dl>
                </article>
              );
            })}
          </div>
        </>
      )}

      {unbudgetedSpend.length > 0 && (
        <section className="card p-5 sm:p-6" aria-labelledby="unb-title">
          <h2 id="unb-title" className="text-base font-bold">Spending without a budget</h2>
          <p className="mb-3 text-xs text-muted">Categories with spending in {monthLabel} that have no limit yet.</p>
          <ul className="divide-y divide-line/50">
            {unbudgetedSpend.map(({ category, total }) => (
              <li key={category.id} className="flex items-center gap-3 py-3">
                <CategoryIcon name={category.icon} color={category.color} size={38} />
                <span className="flex-1 truncate text-sm font-bold">{category.name}</span>
                <span className="text-sm font-bold tnum">{formatINR(total)}</span>
                <button type="button" className="btn-ghost !h-9 text-xs" onClick={() => setDialog({ open: true, editing: null })}>Set budget</button>
              </li>
            ))}
          </ul>
        </section>
      )}

      <BudgetDialog key={dialog.editing?.id || 'new'} open={dialog.open} editing={dialog.editing} available={available} onClose={() => setDialog({ open: false, editing: null })} />
      <ConfirmDialog open={!!removing} onClose={() => setRemoving(null)} title={`Remove the ${removing?.category.name} budget?`}
        description="Your transactions are untouched — only the monthly limit and its alerts are removed." confirmLabel="Remove budget" onConfirm={() => deleteBudget(removing.budget.id)} />
    </div>
  );
}
