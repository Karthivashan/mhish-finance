import { ArrowDownLeft, ArrowUpRight, Pencil, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { formatINR } from '../../utils/currencyUtils';
import CategoryIcon from '../ui/CategoryIcon';
import { ConfirmDialog } from '../ui/Dialog';

export function TransactionRow({ tx, actions = true, onDelete, compact = false }) {
  const { getCategory, fmtDate } = useApp();
  const navigate = useNavigate();
  const cat = getCategory(tx.categoryId);
  const income = tx.type === 'income';
  return (
    <li className="group flex items-center gap-3 rounded-xl px-2 py-3 transition hover:bg-raised/70 sm:gap-4 sm:px-3">
      <CategoryIcon name={cat.icon} color={cat.color} size={compact ? 38 : 44} />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate text-sm font-bold">{cat.name}</p>
          {tx.isDemo && <span className="rounded-md bg-raised px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-muted ring-1 ring-line">Sample</span>}
        </div>
        <p className="truncate text-xs text-muted">{tx.description || 'No description'}</p>
        <p className="mt-0.5 text-xs text-muted sm:hidden">{fmtDate(tx.date)}</p>
      </div>
      <p className="hidden w-28 shrink-0 text-right text-xs text-muted sm:block">{fmtDate(tx.date)}</p>
      <div className="flex shrink-0 flex-col items-end">
        <span className={`inline-flex items-center gap-1 text-sm font-extrabold tnum ${income ? 'text-income' : 'text-expense'}`}>
          {income ? <ArrowDownLeft size={14} aria-hidden /> : <ArrowUpRight size={14} aria-hidden />}
          <span className="sr-only">{income ? 'Income' : 'Expense'}</span>
          {income ? '+' : '−'}{formatINR(tx.amount)}
        </span>
        <span className={`text-[10px] font-bold uppercase tracking-wider ${income ? 'text-income/80' : 'text-expense/80'}`}>{income ? 'Income' : 'Expense'}</span>
      </div>
      {actions && (
        <div className="flex shrink-0 gap-1">
          <button type="button" className="btn-icon !h-9 !w-9" aria-label={`Edit ${cat.name} transaction`} onClick={() => navigate(`/spend/edit/${tx.id}`)}><Pencil size={15} /></button>
          <button type="button" className="btn-icon !h-9 !w-9 hover:!border-expense/60 hover:!text-expense" aria-label={`Delete ${cat.name} transaction`} onClick={() => onDelete(tx)}><Trash2 size={15} /></button>
        </div>
      )}
    </li>
  );
}

export default function TransactionList({ transactions }) {
  const { deleteTransaction, getCategory } = useApp();
  const [target, setTarget] = useState(null);
  return (
    <>
      <ul className="divide-y divide-line/50">
        {transactions.map((tx) => <TransactionRow key={tx.id} tx={tx} onDelete={setTarget} />)}
      </ul>
      <ConfirmDialog open={!!target} onClose={() => setTarget(null)}
        title="Delete this transaction?"
        description={target ? `${getCategory(target.categoryId).name} · ${formatINR(target.amount)} — balances, budgets and charts will be recalculated. This can’t be undone.` : ''}
        onConfirm={() => deleteTransaction(target.id)} />
    </>
  );
}
