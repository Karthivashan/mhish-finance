import { AlertTriangle, Camera, Database, Download, FileJson, FileSpreadsheet, RotateCcw, Trash2, Upload } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useLocation } from 'react-router-dom';
import { toast } from 'sonner';
import { ThemeSegmented } from '../components/layout/ThemeToggle';
import Avatar from '../components/ui/Avatar';
import { ConfirmDialog } from '../components/ui/Dialog';
import MonthSelector from '../components/ui/MonthSelector';
import PageHeader from '../components/ui/PageHeader';
import { useApp } from '../context/AppContext';
import { validateBudgets, validateNotifications } from '../services/budgetService';
import { DEFAULT_CATEGORIES, COLOR_PALETTE, validateCategories } from '../services/categoryService';
import { categorySummaryCSV, download, fullBackupJSON, monthlyReportCSV, transactionsCSV } from '../services/exportService';
import { isPersistent } from '../services/storageService';
import { validateTransactions } from '../services/transactionService';
import { DATE_FORMATS, formatDate } from '../utils/dateUtils';

const stamp = () => new Date().toISOString().slice(0, 10);

function Section({ id, title, description, children }) {
  return (
    <section id={id} className="card scroll-mt-24 p-5 sm:p-7" aria-labelledby={`${id}-title`}>
      <h2 id={`${id}-title`} className="text-lg font-bold">{title}</h2>
      {description && <p className="mt-1 text-sm text-muted">{description}</p>}
      <div className="mt-6">{children}</div>
    </section>
  );
}

function Toggle({ label, hint, checked, onChange }) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-4 py-3">
      <span><span className="block text-sm font-bold">{label}</span><span className="block text-xs text-muted">{hint}</span></span>
      <button type="button" role="switch" aria-checked={checked} aria-label={label} onClick={() => onChange(!checked)}
        className={`relative h-7 w-12 shrink-0 rounded-full transition ${checked ? 'bg-accent' : 'bg-raised ring-1 ring-line'}`}>
        <span className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-all ${checked ? 'left-6' : 'left-1'}`} />
      </button>
    </label>
  );
}

function resizeImage(file, size = 160) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const s = Math.min(img.width, img.height);
      const canvas = document.createElement('canvas');
      canvas.width = canvas.height = size;
      canvas.getContext('2d').drawImage(img, (img.width - s) / 2, (img.height - s) / 2, s, s, 0, 0, size, size);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL('image/jpeg', 0.85));
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('bad image')); };
    img.src = url;
  });
}

export default function Profile() {
  const app = useApp();
  const { profile, preferences, transactions, categories, month, monthLabel, setProfile, setPrefs } = app;
  const { hash } = useLocation();
  const fileRef = useRef(null);
  const importRef = useRef(null);
  const [confirm, setConfirm] = useState(null);
  const [pendingImport, setPendingImport] = useState(null);
  const demoCount = transactions.filter((t) => t.isDemo).length;

  useEffect(() => { if (hash) document.getElementById(hash.slice(1))?.scrollIntoView({ behavior: 'smooth' }); }, [hash]);

  const { register, handleSubmit, formState: { errors, isDirty }, reset } = useForm({ values: { name: profile.name, email: profile.email || '' } });
  const saveProfile = (v) => { setProfile({ name: v.name.trim(), email: v.email.trim() }); reset(v); toast.success('Profile saved'); };

  const onPhoto = async (e) => {
    const f = e.target.files?.[0]; e.target.value = '';
    if (!f) return;
    if (!f.type.startsWith('image/')) return toast.error('Please choose an image file.');
    if (f.size > 8 * 1024 * 1024) return toast.error('That image is too large (max 8 MB).');
    try { setProfile({ avatarImage: await resizeImage(f) }); toast.success('Profile picture updated'); }
    catch { toast.error('Could not read that image.'); }
  };

  const onImportFile = async (e) => {
    const f = e.target.files?.[0]; e.target.value = '';
    if (!f) return;
    try {
      const json = JSON.parse(await f.text());
      const d = json?.data;
      const tx = validateTransactions(d?.transactions);
      if (!d || !tx) throw new Error('shape');
      const cats = validateCategories(d.categories) || [];
      const ids = new Set(cats.map((c) => c.id));
      setPendingImport({
        transactions: tx,
        categories: [...DEFAULT_CATEGORIES.filter((c) => !ids.has(c.id)), ...cats],
        budgets: validateBudgets(d.budgets) || [],
        notifications: validateNotifications(d.notifications) || [],
        ...(d.profile && typeof d.profile === 'object' ? { profile: { ...profile, ...d.profile } } : {}),
        ...(d.preferences && typeof d.preferences === 'object' ? { preferences: { ...preferences, ...d.preferences } } : {}),
      });
    } catch { toast.error('That doesn’t look like a Mhish backup file.'); }
  };

  const exportBtn = 'btn-ghost justify-start !h-12 w-full';

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <PageHeader eyebrow="Profile & Settings" 
      title={<>Your  <span className="text-[#0BDA51]">preferences</span></>}
      subtitle="A local profile — it lives in this browser only and is never uploaded anywhere." />

      <Section id="profile" title="Personal profile">
        <div className="flex flex-col gap-8 sm:flex-row">
          <div className="flex flex-col items-center gap-3">
            <Avatar profile={profile} size={96} />
            <input ref={fileRef} type="file" accept="image/*" className="sr-only" onChange={onPhoto} aria-label="Upload profile picture" />
            <button type="button" className="btn-ghost !h-9 text-xs" onClick={() => fileRef.current?.click()}><Camera size={14} />Upload photo</button>
            {profile.avatarImage && <button type="button" className="text-xs font-semibold text-muted hover:text-expense" onClick={() => setProfile({ avatarImage: '' })}>Remove photo</button>}
            <div className="flex flex-wrap justify-center gap-1.5" role="radiogroup" aria-label="Avatar colour">
              {COLOR_PALETTE.slice(0, 6).map((c) => (
                <button key={c} type="button" role="radio" aria-checked={profile.avatarColor === c} aria-label={`Avatar colour ${c}`} onClick={() => setProfile({ avatarColor: c })}
                  className="h-6 w-6 rounded-lg transition hover:scale-110" style={{ background: c, boxShadow: profile.avatarColor === c ? `0 0 0 2px rgb(var(--surface)), 0 0 0 3.5px ${c}` : 'none' }} />
              ))}
            </div>
          </div>
          <form onSubmit={handleSubmit(saveProfile)} noValidate className="flex-1 space-y-5">
            <div>
              <label htmlFor="p-name" className="label">Full name</label>
              <input id="p-name" className="field" autoComplete="name" aria-invalid={!!errors.name} aria-describedby="p-name-err"
                {...register('name', { required: 'Please enter your name.', maxLength: { value: 40, message: 'Keep your name under 40 characters.' }, validate: (v) => v.trim().length > 0 || 'Please enter your name.' })} />
              {errors.name && <p id="p-name-err" role="alert" className="mt-2 text-xs font-semibold text-expense">{errors.name.message}</p>}
            </div>
            <div>
              <label htmlFor="p-email" className="label">Email <span className="font-medium normal-case tracking-normal">(optional)</span></label>
              <input id="p-email" type="email" className="field" autoComplete="email" aria-invalid={!!errors.email} aria-describedby="p-email-err"
                {...register('email', { pattern: { value: /^$|^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Enter a valid email address.' } })} />
              {errors.email && <p id="p-email-err" role="alert" className="mt-2 text-xs font-semibold text-expense">{errors.email.message}</p>}
            </div>
            <button type="submit" className="btn-primary" disabled={!isDirty}>Save profile</button>
          </form>
        </div>
      </Section>

      <Section id="preferences" title="Preferences" description="Stored in your browser and included in backups.">
        <div className="grid gap-6 sm:grid-cols-2">
          <div><p className="label">Appearance</p><ThemeSegmented /></div>
          <div>
            <label htmlFor="date-format" className="label">Date format</label>
            <select id="date-format" className="field" value={preferences.dateFormat} onChange={(e) => setPrefs({ dateFormat: e.target.value })}>
              {DATE_FORMATS.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
            </select>
            <p className="mt-1.5 text-xs text-muted">Preview: {formatDate(new Date().toISOString().slice(0, 10), preferences.dateFormat)}</p>
          </div>
          <div>
            <label htmlFor="currency" className="label">Currency</label>
            <select id="currency" className="field" value="INR" disabled aria-describedby="currency-help"><option value="INR">Indian Rupee (₹ INR)</option></select>
            <p id="currency-help" className="mt-1.5 text-xs text-muted">Amounts show two decimals with Indian grouping — ₹1,25,000.00</p>
          </div>
        </div>
        <div className="mt-4 divide-y divide-line/50 border-t border-line/50">
          <Toggle label="Budget alerts" hint="Notify me at 80% and 100% of a category budget." checked={preferences.budgetAlerts} onChange={(v) => setPrefs({ budgetAlerts: v })} />
          <Toggle label="Spending milestones" hint="Notify me when spending reaches 50%, 75% and 100% of the month’s income." checked={preferences.milestoneAlerts} onChange={(v) => setPrefs({ milestoneAlerts: v })} />
        </div>
      </Section>

      <Section id="data" title="Data & export" description="Your data stays on this device. Download copies whenever you like.">
        <div className={`mb-6 flex gap-3 rounded-xl border p-4 text-sm ${isPersistent() ? 'border-warn/30 bg-warn/10' : 'border-expense/40 bg-expense/10'}`} role="note">
          <AlertTriangle size={18} className={`mt-0.5 shrink-0 ${isPersistent() ? 'text-warn' : 'text-expense'}`} />
          <p><strong>{isPersistent() ? 'Stored only in this browser.' : 'Browser storage is unavailable — data will be lost when you close this tab.'}</strong>{' '}
            <span className="text-muted">Clearing site data, using private browsing or switching browser/device can permanently remove it. Export a JSON backup regularly. There is no cloud sync or account.</span></p>
        </div>

        <p className="label">Full backup</p>
        <div className="grid gap-3 sm:grid-cols-3">
          <button type="button" className={exportBtn} onClick={() => { download(`mhish-backup-${stamp()}.json`, fullBackupJSON(app), 'application/json'); toast.success('Backup downloaded'); }}><FileJson size={18} className="text-accent" />Export JSON</button>
          <button type="button" className={exportBtn} onClick={() => { download(`mhish-transactions-${stamp()}.csv`, transactionsCSV(transactions, categories), 'text/csv'); toast.success('CSV downloaded'); }} disabled={!transactions.length}><FileSpreadsheet size={18} className="text-accent" />All transactions CSV</button>
          <button type="button" className={exportBtn} onClick={() => importRef.current?.click()}><Upload size={18} className="text-accent" />Import backup</button>
          <input ref={importRef} type="file" accept="application/json,.json" className="sr-only" onChange={onImportFile} aria-label="Import JSON backup" />
        </div>

        <p className="label mt-8">Monthly report</p>
        <div className="flex flex-col gap-4 rounded-2xl border border-line/70 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div><p className="text-sm font-bold">{monthLabel}</p><p className="text-xs text-muted">Uses the month selected below.</p></div>
          <MonthSelector />
        </div>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <button type="button" className={exportBtn} onClick={() => { download(`mhish-report-${month}.csv`, monthlyReportCSV(transactions, categories, month), 'text/csv'); toast.success('Monthly report downloaded'); }}><Download size={18} className="text-accent" />Monthly report (summary + transactions)</button>
          <button type="button" className={exportBtn} onClick={() => { download(`mhish-category-summary-${month}.csv`, categorySummaryCSV(transactions, categories, month), 'text/csv'); toast.success('Summary downloaded'); }}><Download size={18} className="text-accent" />Category-wise expense summary</button>
        </div>

        <p className="label mt-8">Sample data</p>
        <div className="rounded-2xl border border-line/70 p-4">
          <div className="flex items-start gap-3"><Database size={18} className="mt-0.5 text-warn" />
            <p className="text-sm"><strong>{demoCount > 0 ? `${demoCount} sample transactions loaded` : 'No sample data loaded'}</strong>
              <span className="mt-0.5 block text-xs text-muted">Sample records are tagged “Sample” and kept separate from anything you add. Editing a sample record makes it yours.</span></p></div>
          <div className="mt-4 flex flex-wrap gap-2">
            <button type="button" className="btn-ghost !h-10 text-xs" onClick={() => setConfirm('reset')}><RotateCcw size={15} />Reset sample data</button>
            <button type="button" className="btn-ghost !h-10 text-xs" onClick={() => setConfirm('clear-demo')} disabled={!demoCount}><Trash2 size={15} />Remove sample data</button>
          </div>
        </div>

        <p className="label mt-8 !text-expense">Danger zone</p>
        <div className="flex flex-col gap-3 rounded-2xl border border-expense/40 bg-expense/5 p-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm"><strong>Erase all data</strong><span className="block text-xs text-muted">Deletes every transaction, budget, custom category and notification. Your profile and preferences are kept.</span></p>
          <button type="button" className="btn-danger !h-10 text-xs" onClick={() => setConfirm('all')}><Trash2 size={15} />Erase everything</button>
        </div>
      </Section>

      <ConfirmDialog open={confirm === 'reset'} onClose={() => setConfirm(null)} tone="primary" confirmLabel="Reset sample data" title="Reset sample data?"
        description="Sample transactions are regenerated for the last six months. Your own transactions and budgets are not touched." onConfirm={app.resetDemo} />
      <ConfirmDialog open={confirm === 'clear-demo'} onClose={() => setConfirm(null)} confirmLabel="Remove sample data" title="Remove all sample data?"
        description="Only records tagged “Sample” are removed. Anything you added or edited stays." onConfirm={app.clearDemo} />
      <ConfirmDialog open={confirm === 'all'} onClose={() => setConfirm(null)} confirmLabel="Erase everything" title="Erase all data permanently?"
        description="This removes every transaction, budget, custom category and notification from this browser. It can’t be undone — export a backup first if unsure." onConfirm={app.clearAll} />
      <ConfirmDialog open={!!pendingImport} onClose={() => setPendingImport(null)} tone="primary" confirmLabel="Replace my data" title="Import this backup?"
        description={pendingImport ? `This replaces your current data with ${pendingImport.transactions.length} transactions, ${pendingImport.categories.length} categories and ${pendingImport.budgets.length} budgets from the file.` : ''}
        onConfirm={() => app.importData(pendingImport)} />
    </div>
  );
}
