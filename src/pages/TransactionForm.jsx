import { ArrowDownLeft, ArrowLeft, ArrowUpRight, Save } from 'lucide-react';
import { useEffect } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import AmountInput from '../components/forms/AmountInput';
import CategoryPicker from '../components/forms/CategoryPicker';
import { useApp } from '../context/AppContext';
import { parseAmount } from '../utils/currencyUtils';
import { isValidISODate, monthOf, todayISO } from '../utils/dateUtils';

const MAX_AMOUNT = 999999999.99;

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
  const income = type === 'income';
  const { register, control, handleSubmit, watch, setFocus, setValue, formState: { errors, isSubmitting } } = useForm({
    mode: 'onTouched',
    defaultValues: {
      amount: editing ? String(editing.amount) : '',
      description: editing?.description || '',
      date: editing?.date || todayISO(),
      // Income has a single default category (Salary) — preselect it to save a tap.
      categoryId: editing?.categoryId || (income ? categories.find((c) => c.type === 'income')?.id || '' : ''),
    },
  });
  const desc = watch('description') || '';
  useEffect(() => { setFocus('amount'); }, [setFocus]);
  useEffect(() => {
    if (editing && !categories.some((c) => c.id === editing.categoryId)) setValue('categoryId', '');
  }, [categories, editing, setValue]);

  const onSubmit = (v) => {
    const data = { type, amount: parseAmount(v.amount), description: v.description.trim(), date: v.date, categoryId: v.categoryId };
    try {
      if (editing) updateTransaction(editing.id, data); else addTransaction(data);
      setMonth(monthOf(data.date)); // jump to the month the record belongs to
      navigate(`/spend?tab=${type}`);
    } catch {
      toast.error('Could not save the transaction. Please try again.');
    }
  };

  return (
    <div className="mx-auto max-w-3xl">
      <Link to={`/spend?tab=${type}`} className="mb-5 inline-flex items-center gap-2 text-sm font-semibold text-muted hover:text-ink"><ArrowLeft size={16} />Back to Spend</Link>
      <div className="mb-7 flex items-center gap-4">
        <span className={`flex h-12 w-12 items-center justify-center rounded-2xl ${income ? 'bg-income/15 text-income' : 'bg-expense/15 text-expense'}`}>
          {income ? <ArrowDownLeft size={24} /> : <ArrowUpRight size={24} />}
        </span>
        <div>
          <h1 className="text-xl font-extrabold tracking-tight sm:text-[28px]">{editing ? 'Edit' : 'New'} {income ? 'income' : 'expense'}</h1>
          <p className="text-xs text-muted sm:text-sm">{income ? 'Money coming in — it will increase your balance.' : 'Money going out — it will reduce your balance.'}</p>
        </div>
      </div>

      {!editing && (
        <div role="group" aria-label="Transaction type" className="mb-6 grid grid-cols-2 gap-1 rounded-xl border border-line bg-bg/40 p-1">
          {['income', 'expense'].map((t) => (
            <Link key={t} to={`/spend/new/${t}`} replace aria-current={type === t ? 'page' : undefined}
              className={`flex h-10 items-center justify-center rounded-lg text-sm font-bold capitalize transition ${type === t ? 'bg-accent text-accent-ink shadow' : 'text-muted hover:text-ink'}`}>{t}</Link>
          ))}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="card space-y-6 p-4 sm:space-y-8 sm:p-8">
        <div>
          <label htmlFor="amount" className="label">Amount</label>
          <Controller name="amount" control={control}
            rules={{
              required: 'Enter an amount.',
              validate: (v) => {
                const n = parseAmount(v);
                if (!Number.isFinite(n) || n <= 0) return 'Amount must be greater than ₹0.00.';
                if (n > MAX_AMOUNT) return 'That amount is too large.';
                return true;
              },
            }}
            render={({ field }) => <AmountInput {...field} invalid={!!errors.amount} describedBy="amount-error" tone={income ? 'text-income' : 'text-expense'} calculator />} />
          {errors.amount && <p id="amount-error" role="alert" className="mt-2 text-xs font-semibold text-expense">{errors.amount.message}</p>}
        </div>

        <div className="grid gap-4 sm:grid-cols-[1fr_220px] sm:gap-6">
          <div>
            <label htmlFor="description" className="label">Description <span className="font-medium normal-case tracking-normal">(optional)</span></label>
            <textarea id="description" rows={3} className="field !h-auto resize-none py-3 leading-relaxed" placeholder={income ? 'e.g. November salary credited' : 'e.g. Groceries for the week'}
              aria-invalid={!!errors.description} aria-describedby="desc-help"
              {...register('description', { maxLength: { value: 300, message: 'Keep the description under 300 characters.' } })} />
            <p id="desc-help" className={`mt-1.5 text-right text-xs tnum ${desc.length > 300 ? 'font-bold text-expense' : 'text-muted'}`}>{errors.description?.message || `${desc.length}/300`}</p>
          </div>
          <div>
            <label htmlFor="date" className="label">Date</label>
            <input id="date" type="date" className="field" min="2000-01-01" max="2100-12-31" aria-invalid={!!errors.date} aria-describedby="date-error"
              {...register('date', { required: 'Pick a date.', validate: (v) => isValidISODate(v) || 'Enter a valid date.' })} />
            {errors.date && <p id="date-error" role="alert" className="mt-2 text-xs font-semibold text-expense">{errors.date.message}</p>}
          </div>
        </div>

        <div>
          <p className="label">Category</p>
          <Controller name="categoryId" control={control} rules={{ required: 'Choose a category.' }}
            render={({ field }) => <CategoryPicker type={type} value={field.value} onChange={field.onChange} error={errors.categoryId?.message} />} />
        </div>

        <div className="flex flex-col-reverse gap-3 border-t border-line/60 pt-6 sm:flex-row sm:justify-end">
          <button type="button" className="btn-ghost sm:min-w-32" onClick={() => navigate(`/spend?tab=${type}`)}>Cancel</button>
          <button type="submit" className="btn-primary sm:min-w-48" disabled={isSubmitting}><Save size={17} />{editing ? 'Save changes' : 'Save Transaction'}</button>
        </div>
      </form>
    </div>
  );
}
