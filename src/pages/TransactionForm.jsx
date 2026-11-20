import { CalendarDays, Check, PencilLine } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import CategoryPicker from '../components/forms/CategoryPicker';
import AmountInput, { AmountDisplay } from '../components/forms/TransactionAmountInput';
import { useApp } from '../context/AppContext';
import { parseAmount } from '../utils/currencyUtils';
import { formatDate, isValidISODate, monthOf, todayISO } from '../utils/dateUtils';

const MAX_AMOUNT = 999999999.99;
const TABS = [
  { type: 'expense', label: 'Expenses' },
  { type: 'income', label: 'Income' },
];

export default function TransactionForm() {
  const { type: typeParam, id } = useParams();
  const { transactions } = useApp();
  const editing = id ? transactions.find((t) => t.id === id) : null;
  const type = editing ? editing.type : typeParam;

  if ((id && !editing) || !['income', 'expense'].includes(type)) return <Navigate to="/spend" replace />;
  return <Form key={`${type}-${id || 'new'}`} type={type} editing={editing} />;
}

function Form({ type, editing }) {
  const navigate = useNavigate();
  const { categories, addTransaction, updateTransaction, setMonth } = useApp();
  const [amount, setAmount] = useState(editing ? String(editing.amount) : '');
  const [description, setDescription] = useState(editing?.description || '');
  const [date, setDate] = useState(editing?.date || todayISO());
  const [categoryId, setCategoryId] = useState(editing?.categoryId || (
    type === 'income' ? categories.find((category) => category.type === 'income')?.id || '' : ''
  ));
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (categoryId && !categories.some((category) => category.id === categoryId && category.type === type)) {
      setCategoryId('');
    }
  }, [categories, categoryId, type]);

  const submit = (event) => {
    event.preventDefault();
    const parsedAmount = parseAmount(amount);
    const nextErrors = {};
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) nextErrors.amount = 'Enter an amount greater than ₹0.00.';
    else if (parsedAmount > MAX_AMOUNT) nextErrors.amount = 'That amount is too large.';
    if (!categoryId || !categories.some((category) => category.id === categoryId && category.type === type)) {
      nextErrors.categoryId = 'Choose a category.';
    }
    if (!isValidISODate(date) || date < '2000-01-01' || date > '2100-12-31') nextErrors.date = 'Pick a valid date.';
    if (description.length > 300) nextErrors.description = 'Keep the note under 300 characters.';
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    const data = { type, amount: parsedAmount, description: description.trim(), date, categoryId };
    setIsSubmitting(true);
    try {
      if (editing) updateTransaction(editing.id, data); else addTransaction(data);
      setMonth(monthOf(data.date));
      navigate(`/spend?tab=${type}`);
    } catch {
      toast.error('Could not save the transaction. Please try again.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[70] flex h-[100dvh] flex-col overflow-hidden bg-[#1D1824] text-white"
      style={{ paddingTop: 'env(safe-area-inset-top)' }}>
      <nav aria-label="Transaction type" className="mx-auto flex h-12 w-full max-w-[500px] shrink-0 items-stretch justify-around px-3">
        {TABS.map((tab) => (
          editing
            ? <button key={tab.type} type="button" disabled
              aria-current={type === tab.type ? 'page' : undefined}
              className={`relative min-w-[100px] px-4 text-[9px] font-semibold ${type === tab.type ? 'text-white' : 'text-white/40'}`}>
              {tab.label}
              {type === tab.type && <span className="absolute inset-x-4 bottom-0 h-[3px] rounded-full bg-[#FFD60A]" />}
            </button>
            : <Link key={tab.type} to={`/spend/new/${tab.type}`} replace aria-current={type === tab.type ? 'page' : undefined}
              className={`relative flex min-w-[100px] items-center justify-center px-4 text-[9px] font-semibold transition ${type === tab.type ? 'text-white' : 'text-white/45 hover:text-white/80'}`}>
              {tab.label}
              {type === tab.type && <span className="absolute inset-x-4 bottom-0 h-[3px] rounded-full bg-[#FFD60A]" />}
            </Link>
        ))}
      </nav>

      <form onSubmit={submit} noValidate className="flex min-h-0 flex-1 flex-col">
        <section aria-label={`${type} categories`} className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 pb-5 pt-4 sm:px-6">
          <CategoryPicker type={type} value={categoryId} onChange={(value) => { setCategoryId(value); setErrors((current) => ({ ...current, categoryId: '' })); }} error={errors.categoryId} />
        </section>

        <section aria-label="Transaction details" className="z-10 max-h-[72dvh] shrink-0 overflow-y-auto rounded-t-[22px] bg-[#302638] px-4 pb-[max(12px,env(safe-area-inset-bottom))] pt-3 shadow-[0_-8px_28px_rgba(0,0,0,0.5)] sm:px-6">
          <div className="mx-auto w-full max-w-[470px]">
            <div className="mb-2 flex min-w-0 items-center gap-2">
              <label className="flex h-10 min-w-0 flex-1 items-center gap-2.5 rounded-xl bg-[#1D1824] px-3">
                <PencilLine size={16} className="shrink-0 text-white/65" aria-hidden="true" />
                <span className="sr-only">Add a note</span>
                <input value={description} onChange={(event) => { setDescription(event.target.value); setErrors((current) => ({ ...current, description: '' })); }}
                  maxLength={300} placeholder="Add a note" aria-invalid={!!errors.description}
                  className="min-w-0 flex-1 bg-transparent text-[9px] text-white outline-none placeholder:text-white/40" />
              </label>
              <AmountDisplay value={amount} invalid={!!errors.amount} describedBy={errors.amount ? 'transaction-amount-error' : undefined} />
            </div>
            {errors.description && <p role="alert" className="mb-1 text-[9px] text-[#FF756B]">{errors.description}</p>}

            <AmountInput value={amount} onChange={(value) => { setAmount(value); setErrors((current) => ({ ...current, amount: '' })); }} />
            {errors.amount && <p id="transaction-amount-error" role="alert" className="mt-1 text-center text-[9px] text-[#FF756B]">{errors.amount}</p>}

            <div className="mt-2 flex items-center gap-2">
              <label className="relative flex h-[42px] flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#1D1824] text-[9px] font-semibold text-white/85 transition active:scale-[.98]">
                <CalendarDays size={16} className="text-white/65" />
                <span>{date === todayISO() ? 'Today' : formatDate(date, 'dd MMM yyyy')}</span>
                <input type="date" value={date} min="2000-01-01" max="2100-12-31" aria-label="Choose transaction date"
                  onChange={(event) => { setDate(event.target.value); setErrors((current) => ({ ...current, date: '' })); }}
                  className="absolute inset-0 h-full w-full cursor-pointer opacity-0" />
              </label>
              <button type="submit" disabled={isSubmitting} aria-label={editing ? 'Save transaction changes' : 'Save transaction'}
                className="flex h-[42px] w-[56px] shrink-0 items-center justify-center rounded-xl bg-[#F38DFD] text-black transition hover:brightness-105 active:scale-95 disabled:opacity-50">
                <Check size={23} strokeWidth={2.8} />
              </button>
            </div>
            {errors.date && <p role="alert" className="mt-1 text-center text-[9px] text-[#FF756B]">{errors.date}</p>}
          </div>
        </section>
      </form>
    </div>
  );
}
