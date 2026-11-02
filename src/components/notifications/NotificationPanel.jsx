import { AlertTriangle, Bell, BellOff, CheckCheck, CheckCircle2, Info, PencilLine, Target, Trash2, TrendingUp } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { formatDistanceToNowStrict, parseISO } from 'date-fns';
import { useApp } from '../../context/AppContext';

const KIND = {
  'budget-warn': { icon: Target, tone: 'text-warn bg-warn/15' },
  'budget-exceeded': { icon: AlertTriangle, tone: 'text-expense bg-expense/15' },
  milestone: { icon: TrendingUp, tone: 'text-accent bg-accent/15' },
  saved: { icon: CheckCircle2, tone: 'text-income bg-income/15' },
  updated: { icon: PencilLine, tone: 'text-accent bg-accent/15' },
  deleted: { icon: Trash2, tone: 'text-muted bg-raised' },
  info: { icon: Info, tone: 'text-accent bg-accent/15' },
};

export default function NotificationPanel() {
  const { notifications, markRead, markAllRead, clearNotifications } = useApp();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const unread = notifications.filter((n) => !n.read).length;

  useEffect(() => {
    if (!open) return undefined;
    const onDown = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('mousedown', onDown); document.removeEventListener('keydown', onKey); };
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button type="button" className="btn-icon relative" onClick={() => setOpen((o) => !o)} aria-haspopup="dialog" aria-expanded={open}
        aria-label={unread ? `Notifications, ${unread} unread` : 'Notifications'}>
        <Bell size={18} />
        {unread > 0 && (
          <span className="absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-expense px-1 text-[10px] font-extrabold text-white ring-2 ring-bg">{unread > 9 ? '9+' : unread}</span>
        )}
      </button>
      {open && (
        <div role="dialog" aria-label="Notifications" className="fixed inset-x-3 top-16 z-[70] animate-pop-in rounded-2xl border border-line bg-surface shadow-pop sm:absolute sm:inset-x-auto sm:right-0 sm:top-12 sm:w-[390px]">
          <div className="flex items-center justify-between border-b border-line/70 px-4 py-3">
            <h2 className="text-sm font-bold">Notifications {unread > 0 && <span className="ml-1 text-muted">· {unread} new</span>}</h2>
            <div className="flex gap-1">
              <button type="button" className="btn-ghost !h-8 !px-2.5 text-xs" onClick={markAllRead} disabled={!unread}><CheckCheck size={14} />Read all</button>
              <button type="button" className="btn-ghost !h-8 !px-2.5 text-xs" onClick={clearNotifications} disabled={!notifications.length}><Trash2 size={14} />Clear</button>
            </div>
          </div>
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center px-6 py-12 text-center text-muted">
              <BellOff size={28} className="mb-3" /><p className="text-sm font-semibold text-ink">You’re all caught up</p>
              <p className="mt-1 text-xs">Budget and spending alerts will appear here.</p>
            </div>
          ) : (
            <ul className="max-h-[min(70vh,440px)] divide-y divide-line/50 overflow-y-auto">
              {notifications.map((n) => {
                const k = KIND[n.kind] || KIND.info; const Icon = k.icon;
                return (
                  <li key={n.id}>
                    <button type="button" onClick={() => markRead(n.id)} className={`flex w-full gap-3 px-4 py-3 text-left transition hover:bg-raised/70 ${n.read ? 'opacity-70' : ''}`}>
                      <span className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${k.tone}`}><Icon size={17} /></span>
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center gap-2"><span className="truncate text-sm font-bold">{n.title}</span>{!n.read && <span className="h-2 w-2 shrink-0 rounded-full bg-accent" aria-label="Unread" />}</span>
                        <span className="mt-0.5 block text-xs leading-relaxed text-muted">{n.message}</span>
                        <span className="mt-1 block text-[11px] text-muted/80">{formatDistanceToNowStrict(parseISO(n.createdAt), { addSuffix: true })}</span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
