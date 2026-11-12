import { Lock, Pencil, Plus, Tags, Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import { IconColorFields } from '../components/forms/CategoryPicker';
import CategoryIcon from '../components/ui/CategoryIcon';
import Dialog, { ConfirmDialog } from '../components/ui/Dialog';
import PageHeader from '../components/ui/PageHeader';
import { useApp } from '../context/AppContext';
import { COLOR_PALETTE, countTransactions, isNameTaken } from '../services/categoryService';
import { categoryTotals } from '../utils/calculations';
import { formatINR } from '../utils/currencyUtils';

function CategoryDialog({ state, onClose }) {
  const { categories, addCategory, updateCategory } = useApp();
  const { open, editing, type: initialType } = state;
  const [name, setName] = useState(editing?.name || '');
  const [icon, setIcon] = useState(editing?.icon || 'Tag');
  const [color, setColor] = useState(editing?.color || COLOR_PALETTE[5]);
  const [type, setType] = useState(editing?.type || initialType || 'expense');
  const [error, setError] = useState('');

  const save = (e) => {
    e.preventDefault();
    const n = name.trim();
    if (!n) return setError('Give the category a name.');
    if (n.length > 24) return setError('Keep it under 24 characters.');
    if (isNameTaken(categories, n, type, editing?.id)) return setError(`A ${type} category called “${n}” already exists.`);
    if (editing) updateCategory(editing.id, { name: n, icon, color }); else addCategory({ name: n, type, icon, color });
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} title={editing ? 'Edit category' : 'New category'} description={editing?.isDefault ? 'Default categories can be renamed and restyled, but not deleted.' : undefined}
      footer={<><button type="button" className="btn-ghost" onClick={onClose}>Cancel</button><button type="submit" form="category-form" className="btn-primary">{editing ? 'Save changes' : 'Create category'}</button></>}>
      <form id="category-form" onSubmit={save} noValidate className="max-h-[60vh] space-y-5 overflow-y-auto pr-1">
        <div className="flex items-center gap-3">
          <CategoryIcon name={icon} color={color} size={52} />
          <div className="flex-1">
            <label htmlFor="cat-name" className="label">Name</label>
            <input id="cat-name" data-autofocus className="field" value={name} maxLength={24} placeholder="e.g. Groceries" aria-invalid={!!error} aria-describedby="cat-error"
              onChange={(e) => { setName(e.target.value); setError(''); }} />
          </div>
        </div>
        {error && <p id="cat-error" role="alert" className="-mt-2 text-xs font-semibold text-expense">{error}</p>}
        {!editing && (
          <div role="group" aria-label="Category type" className="grid grid-cols-2 gap-1 rounded-xl border border-line bg-bg/40 p-1">
            {['expense', 'income'].map((t) => (
              <button key={t} type="button" aria-pressed={type === t} onClick={() => { setType(t); setError(''); }}
                className={`h-9 rounded-lg text-xs font-bold capitalize transition ${type === t ? 'bg-accent text-accent-ink' : 'text-muted hover:text-ink'}`}>{t}</button>
            ))}
          </div>
        )}
        <IconColorFields icon={icon} color={color} onIcon={setIcon} onColor={setColor} idPrefix="mgr" />
      </form>
    </Dialog>
  );
}

function DeleteDialog({ category, onClose }) {
  const { categories, transactions, deleteCategory } = useApp();
  const count = category ? countTransactions(transactions, category.id) : 0;
  const others = category ? categories.filter((c) => c.type === category.type && c.id !== category.id) : [];
  const [mode, setMode] = useState(others.length ? 'reassign' : 'delete');
  const [target, setTarget] = useState(others[0]?.id || '');

  if (!category) return null;
  if (count === 0)
    return <ConfirmDialog open onClose={onClose} title={`Delete “${category.name}”?`} description="No transactions use this category. Any budget set for it will be removed too." onConfirm={() => deleteCategory(category.id, 'delete')} />;

  return (
    <Dialog open onClose={onClose} title={`“${category.name}” has ${count} transaction${count === 1 ? '' : 's'}`}
      description="Choose what should happen to them before this category is deleted."
      footer={<>
        <button type="button" className="btn-ghost" onClick={onClose} data-autofocus>Cancel</button>
        <button type="button" className="btn-danger" onClick={() => { deleteCategory(category.id, mode, target); onClose(); }}>
          {mode === 'reassign' ? 'Reassign & delete' : `Delete category & ${count} transaction${count === 1 ? '' : 's'}`}
        </button>
      </>}>
      <fieldset className="space-y-3">
        <legend className="sr-only">Transaction handling</legend>
        {others.length > 0 && (
          <label className={`block cursor-pointer rounded-xl border p-4 transition ${mode === 'reassign' ? 'border-accent bg-accent/10' : 'border-line'}`}>
            <span className="flex items-center gap-3"><input type="radio" name="mode" className="accent-[rgb(var(--accent))]" checked={mode === 'reassign'} onChange={() => setMode('reassign')} /><span className="text-sm font-bold">Move them to another category</span></span>
            {mode === 'reassign' && (
              <span className="mt-3 block">
                <span className="sr-only">Target category</span>
                <select className="field" aria-label="Target category" value={target} onChange={(e) => setTarget(e.target.value)}>
                  {others.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </span>
            )}
          </label>
        )}
        <label className={`block cursor-pointer rounded-xl border p-4 transition ${mode === 'delete' ? 'border-expense bg-expense/10' : 'border-line'}`}>
          <span className="flex items-center gap-3"><input type="radio" name="mode" className="accent-[rgb(var(--expense))]" checked={mode === 'delete'} onChange={() => setMode('delete')} /><span className="text-sm font-bold">Delete them as well</span></span>
          {mode === 'delete' && <span className="mt-2 block text-xs text-muted">This permanently removes the {count} transaction{count === 1 ? '' : 's'} and recalculates your totals.</span>}
        </label>
      </fieldset>
    </Dialog>
  );
}

function Section({ title, type, onNew, onEdit, onDelete }) {
  const { categories, transactions, month } = useApp();
  const spend = useMemo(() => categoryTotals(transactions, month, type), [transactions, month, type]);
  const list = categories.filter((c) => c.type === type);
  return (
    <section aria-label={`${title} categories`}>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-base font-bold">{title} <span className="ml-1 text-sm font-semibold text-muted">· {list.length}</span></h2>
        <button type="button" className="btn-ghost !h-9 text-xs" onClick={onNew}><Plus size={15} />New {type} category</button>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {list.map((c) => (
          <article key={c.id} className="card group flex flex-col gap-4 p-5 transition hover:-translate-y-0.5">
            <div className="flex items-start justify-between">
              <CategoryIcon name={c.icon} color={c.color} size={50} />
              <div className="flex gap-1">
                <button type="button" className="btn-icon !h-9 !w-9" onClick={() => onEdit(c)} aria-label={`Edit ${c.name}`}><Pencil size={15} /></button>
                {c.isDefault
                  ? <span className="btn-icon !h-9 !w-9 cursor-not-allowed opacity-50" role="img" aria-label={`${c.name} is a default category and can’t be deleted`} title="Default categories can’t be deleted"><Lock size={14} /></span>
                  : <button type="button" className="btn-icon !h-9 !w-9 hover:!border-expense/60 hover:!text-expense" onClick={() => onDelete(c)} aria-label={`Delete ${c.name}`}><Trash2 size={15} /></button>}
              </div>
            </div>
            <div className="min-w-0">
              <h3 className="truncate text-base font-bold">{c.name}</h3>
              <p className="mt-0.5 text-xs text-muted">{countTransactions(transactions, c.id)} transactions{c.isDefault ? ' · Default' : ''}</p>
            </div>
            <div className="mt-auto flex items-center justify-between border-t border-line/50 pt-3 text-xs">
              <span className="text-muted">This month</span>
              <span className="font-bold tnum">{formatINR(spend.get(c.id) || 0)}</span>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

export default function Categories() {
  const [dialog, setDialog] = useState({ open: false });
  const [deleting, setDeleting] = useState(null);
  const close = () => setDialog({ open: false });
  return (
    <div className="space-y-10">
      <PageHeader eyebrow="Categories"
      title={<>Manage  <span className="text-[#E5604D]">categories</span></>}
      
       subtitle="Icons and colours you pick here are used everywhere — forms, history, charts and insights.">
        <button type="button" className="btn-primary" onClick={() => setDialog({ open: true, type: 'expense' })}><Plus size={18} />New category</button>
      </PageHeader>
      <Section title="Expense" type="expense" onNew={() => setDialog({ open: true, type: 'expense' })} onEdit={(c) => setDialog({ open: true, editing: c })} onDelete={setDeleting} />
      <Section title="Income" type="income" onNew={() => setDialog({ open: true, type: 'income' })} onEdit={(c) => setDialog({ open: true, editing: c })} onDelete={setDeleting} />
      {dialog.open && <CategoryDialog key={dialog.editing?.id || dialog.type} state={dialog} onClose={close} />}
      {deleting && <DeleteDialog key={deleting.id} category={deleting} onClose={() => setDeleting(null)} />}
    </div>
  );
}
