import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

/** Compact icon button for the header. */
export function ThemeIconButton() {
  const { theme, toggle } = useTheme();
  const next = theme === 'dark' ? 'light' : 'dark';
  return (
    <button type="button" className="btn-icon" onClick={toggle} aria-label={`Switch to ${next} mode`} title={`Switch to ${next} mode`}>
      {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
    </button>
  );
}

/** Segmented Light | Dark control (sidebar + settings). */
export function ThemeSegmented({ compact = false }) {
  const { theme, setTheme } = useTheme();
  const opts = [{ v: 'light', label: 'Light', Icon: Sun }, { v: 'dark', label: 'Dark', Icon: Moon }];
  return (
    <div role="group" aria-label="Colour theme" className={`grid ${compact ? 'grid-cols-1' : 'grid-cols-2'} gap-1 rounded-xl border border-line bg-bg/40 p-1`}>
      {opts.map(({ v, label, Icon }) => (
        <button key={v} type="button" aria-pressed={theme === v} aria-label={`${label} mode`} title={`${label} mode`} onClick={() => setTheme(v)}
          className={`flex h-9 items-center justify-center gap-2 rounded-lg text-xs font-bold transition ${theme === v ? 'bg-accent text-accent-ink shadow' : 'text-muted hover:text-ink'}`}>
          <Icon size={15} />{!compact && label}
        </button>
      ))}
    </div>
  );
}
