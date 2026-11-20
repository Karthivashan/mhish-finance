import { Check, Plus } from 'lucide-react';
import { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { COLOR_PALETTE, ICON_NAMES, isNameTaken } from '../../services/categoryService';
import CategoryIcon, { ICONS } from '../ui/CategoryIcon';

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
      <div role="radiogroup" aria-label={`${type} category`} className="grid grid-cols-4 gap-x-1 gap-y-4 sm:gap-x-4 sm:gap-y-6">
        {list.map((c) => {
          const on = value === c.id;
          const Icon = ICONS[c.icon] || ICONS.Tag;
          return (
            <button key={c.id} type="button" role="radio" aria-checked={on} onClick={() => onChange(c.id)}
              className="group flex min-w-0 flex-col items-center gap-2 rounded-xl p-1 text-center transition active:scale-95">
              <span className={`flex h-[54px] w-[54px] items-center justify-center rounded-full bg-[#222] transition sm:h-[62px] sm:w-[62px] ${on ? 'ring-2 ring-[#FFD60A] ring-offset-2 ring-offset-[#1D1824]' : ''}`}>
                <Icon size={27} strokeWidth={1.8} style={{ color: c.color }} />
              </span>
              <span className="w-full truncate text-[9px] font-semibold uppercase tracking-wide text-white/85">{c.name}</span>
            </button>
          );
        })}
        <button type="button" onClick={() => setAdding((a) => !a)} aria-expanded={adding}
          className="flex min-w-0 flex-col items-center gap-2 rounded-xl p-1 text-muted transition active:scale-95 hover:text-[#FFD60A]">
          <span className="flex h-[54px] w-[54px] items-center justify-center rounded-full bg-[#222] sm:h-[62px] sm:w-[62px]"><Plus size={22} /></span>
          <span className="text-[9px] font-semibold uppercase tracking-wide">Add new</span>
        </button>
      </div>
      {error && <p role="alert" className="mt-2 text-[9px] font-semibold text-expense sm:text-xs">{error}</p>}

      {adding && (
        <div className="mt-4 animate-pop-in space-y-5 rounded-2xl border border-line bg-bg/40 p-5">
          <div className="flex items-center gap-3">
            <CategoryIcon name={icon} color={color} size={48} />
            <div className="flex-1">
              <label htmlFor="new-cat-name" className="label !text-[9px] sm:!text-[11px]">New {type} category</label>
              <input id="new-cat-name" className="field !text-[9px] sm:!text-sm" value={name} maxLength={24} placeholder="e.g. Groceries" aria-invalid={!!nameError}
                onChange={(e) => { setName(e.target.value); setNameError(''); }} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); create(); } }} />
            </div>
          </div>
          {nameError && <p role="alert" className="-mt-3 text-[9px] font-semibold text-expense sm:text-xs">{nameError}</p>}
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
