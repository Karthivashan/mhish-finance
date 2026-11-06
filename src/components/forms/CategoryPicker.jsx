import { Check, Plus } from 'lucide-react';
import { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { COLOR_PALETTE, ICON_NAMES, isNameTaken } from '../../services/categoryService';
import CategoryIcon from '../ui/CategoryIcon';

export function IconColorFields({ icon, color, onIcon, onColor, idPrefix = 'cat' }) {
  return (
    <>
      <fieldset>
        <legend className="label">Icon</legend>
        <div className="grid grid-cols-6 gap-1.5 sm:grid-cols-9" role="radiogroup" aria-label="Category icon">
          {ICON_NAMES.map((n) => (
            <button key={n} type="button" role="radio" aria-checked={icon === n} aria-label={n} onClick={() => onIcon(n)}
              className={`flex h-10 items-center justify-center rounded-xl border transition ${icon === n ? 'border-accent bg-accent/15' : 'border-line/60 hover:bg-raised'}`}>
              <CategoryIcon name={n} color={icon === n ? color : '#8B9BB4'} size={30} className="!bg-transparent !shadow-none" />
            </button>
          ))}
        </div>
      </fieldset>
      <fieldset>
        <legend className="label">Colour</legend>
        <div className="flex flex-wrap gap-2.5" role="radiogroup" aria-label="Category colour">
          {COLOR_PALETTE.map((c) => (
            <button key={c} type="button" role="radio" aria-checked={color === c} aria-label={`Colour ${c}`} onClick={() => onColor(c)} id={`${idPrefix}-${c}`}
              className="flex h-9 w-9 items-center justify-center rounded-xl transition hover:scale-110" style={{ background: c, boxShadow: color === c ? `0 0 0 2px rgb(var(--surface)), 0 0 0 4px ${c}` : 'none' }}>
              {color === c && <Check size={16} className="text-white drop-shadow" />}
            </button>
          ))}
        </div>
      </fieldset>
    </>
  );
}

/** Visual icon grid. Includes an inline “Add new category” flow so users never leave the form. */
export default function CategoryPicker({ type, value, onChange, error }) {
  const { categories, addCategory } = useApp();
  const list = categories.filter((c) => c.type === type);
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState('');
  const [icon, setIcon] = useState('Tag');
  const [color, setColor] = useState(COLOR_PALETTE[5]);
  const [nameError, setNameError] = useState('');

  const create = () => {
    const n = name.trim();
    if (!n) return setNameError('Give the category a name.');
    if (n.length > 24) return setNameError('Keep it under 24 characters.');
    if (isNameTaken(categories, n, type)) return setNameError(`A ${type} category called “${n}” already exists.`);
    const cat = addCategory({ name: n, type, icon, color });
    onChange(cat.id);
    setAdding(false); setName(''); setNameError('');
  };

  return (
    <div>
      <div role="radiogroup" aria-label={`${type} category`} className="grid max-h-44 grid-cols-2 gap-2 overflow-y-auto overscroll-contain pr-1 sm:max-h-none sm:grid-cols-3 sm:gap-3 sm:overflow-visible sm:pr-0 lg:grid-cols-4">
        {list.map((c) => {
          const on = value === c.id;
          return (
            <button key={c.id} type="button" role="radio" aria-checked={on} onClick={() => onChange(c.id)}
              className={`group relative flex flex-col items-center gap-1.5 rounded-2xl border p-2 text-center transition hover:-translate-y-0.5 sm:gap-2.5 sm:p-4 ${on ? 'border-transparent bg-raised' : 'border-line/70 hover:bg-raised/60'}`}
              style={on ? { boxShadow: `0 0 0 2px ${c.color}, 0 10px 24px -14px ${c.color}` } : undefined}>
              {on && <span className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full text-white" style={{ background: c.color }}><Check size={12} strokeWidth={3} /></span>}
              <CategoryIcon name={c.icon} color={c.color} size={36} className="sm:!h-[46px] sm:!w-[46px]" />
              <span className="w-full truncate text-sm font-bold">{c.name}</span>
            </button>
          );
        })}
        <button type="button" onClick={() => setAdding((a) => !a)} aria-expanded={adding}
          className="flex flex-col items-center justify-center gap-1.5 rounded-2xl border border-dashed border-line p-2 text-muted transition hover:border-accent hover:text-accent sm:gap-2.5 sm:p-4">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-raised sm:h-[46px] sm:w-[46px]"><Plus size={22} /></span>
          <span className="text-sm font-bold">Add new</span>
        </button>
      </div>
      {error && <p role="alert" className="mt-2 text-xs font-semibold text-expense">{error}</p>}

      {adding && (
        <div className="mt-4 animate-pop-in space-y-5 rounded-2xl border border-line bg-bg/40 p-5">
          <div className="flex items-center gap-3">
            <CategoryIcon name={icon} color={color} size={48} />
            <div className="flex-1">
              <label htmlFor="new-cat-name" className="label">New {type} category</label>
              <input id="new-cat-name" className="field" value={name} maxLength={24} placeholder="e.g. Groceries" aria-invalid={!!nameError}
                onChange={(e) => { setName(e.target.value); setNameError(''); }} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); create(); } }} />
            </div>
          </div>
          {nameError && <p role="alert" className="-mt-3 text-xs font-semibold text-expense">{nameError}</p>}
          <IconColorFields icon={icon} color={color} onIcon={setIcon} onColor={setColor} idPrefix="pick" />
          <div className="flex justify-end gap-2">
            <button type="button" className="btn-ghost" onClick={() => setAdding(false)}>Cancel</button>
            <button type="button" className="btn-primary" onClick={create}>Create &amp; select</button>
          </div>
        </div>
      )}
    </div>
  );
}
