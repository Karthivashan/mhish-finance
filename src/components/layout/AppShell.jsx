import { Cloud, LoaderCircle, LogOut, Menu, Plus, RefreshCw, X } from 'lucide-react';
import { Suspense, useEffect, useState } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { useGoogleDrive } from '../../context/GoogleDriveContext';
import NotificationPanel from '../notifications/NotificationPanel';
import Logo from './Logo';
import Sidebar from './Sidebar';
import { ThemeIconButton } from './ThemeToggle';

const Loading = () => (
  <div className="space-y-4" aria-busy="true" aria-label="Loading">
    <div className="skeleton h-9 w-64" />
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{[0, 1, 2, 3].map((i) => <div key={i} className="skeleton h-36" />)}</div>
    <div className="skeleton h-72" />
  </div>
);

export default function AppShell() {
  const app = useApp();
  const { preferences, setPrefs } = app;
  const { user, status, syncError, lastSyncedAt, reconnect, signOut, saveSnapshot } = useGoogleDrive();
  const { pathname } = useLocation();
  const [drawer, setDrawer] = useState(false);
  const collapsed = preferences.sidebarCollapsed;
  const snapshot = {
    transactions: app.transactions,
    categories: app.categories,
    budgets: app.budgets,
    profile: app.profile,
    preferences: app.preferences,
    notifications: app.notifications,
  };

  const handleSignOut = async () => {
    if (await saveSnapshot(snapshot)) signOut();
  };
  const handleReconnect = async () => {
    if (await reconnect()) await saveSnapshot(snapshot);
  };

  useEffect(() => { setDrawer(false); window.scrollTo({ top: 0 }); }, [pathname]);
  useEffect(() => {
    if (!drawer) return undefined;
    const onKey = (e) => e.key === 'Escape' && setDrawer(false);
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = ''; };
  }, [drawer]);

  return (
    <div className="app-glow relative min-h-screen">
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-xl focus:bg-accent focus:px-4 focus:py-2 focus:text-accent-ink">Skip to content</a>

      <aside className={`sidebar-panel fixed inset-y-0 left-0 z-40 hidden border-r border-line/60 bg-surface/80 backdrop-blur-xl transition-[width] duration-300 lg:block ${collapsed ? 'w-[84px]' : 'w-[264px]'}`}>
        <Sidebar collapsed={collapsed} onToggle={() => setPrefs({ sidebarCollapsed: !collapsed })} />
      </aside>

      {drawer && (
        <div className="fixed inset-0 z-[60] lg:hidden" role="dialog" aria-modal="true" aria-label="Navigation menu">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setDrawer(false)} aria-hidden="true" />
          <aside className="sidebar-panel absolute inset-y-0 left-0 w-[290px] max-w-[85vw] animate-slide-in border-r border-line bg-surface shadow-pop">
            <button type="button" className="btn-icon absolute right-3 top-4 z-10" onClick={() => setDrawer(false)} aria-label="Close menu"><X size={18} /></button>
            <Sidebar onNavigate={() => setDrawer(false)} />
          </aside>
        </div>
      )}

      <div className={`relative z-10 transition-[padding] duration-300 ${collapsed ? 'lg:pl-[84px]' : 'lg:pl-[264px]'}`}>
        <header className="sticky top-0 z-30 flex h-[68px] items-center gap-3 border-b border-line/50 bg-bg/75 px-4 backdrop-blur-xl sm:px-6 lg:px-10">
          <button type="button" className="btn-icon lg:hidden" onClick={() => setDrawer(true)} aria-label="Open menu" aria-expanded={drawer}><Menu size={19} /></button>
          <Link to="/" className="lg:hidden" aria-label="Mhish home"><Logo size={30} /></Link>
          <p className="hidden text-sm font-semibold text-muted md:block">Money Handler for Income, Savings and Holdings</p>
          <div className="ml-auto flex items-center gap-2">
            <button type="button" className="btn-ghost !h-10 !px-2.5 text-xs sm:!px-3" onClick={status === 'error' ? handleReconnect : () => saveSnapshot(snapshot)}
              disabled={status === 'syncing'} title={syncError || (lastSyncedAt ? `Last synced ${lastSyncedAt.toLocaleTimeString()}` : 'Google Drive sync')}>
              {status === 'syncing' ? <LoaderCircle size={16} className="animate-spin" /> : status === 'error' ? <RefreshCw size={16} /> : <Cloud size={16} className="text-income" />}
              <span className="hidden sm:inline">{status === 'syncing' ? 'Saving…' : status === 'error' ? 'Retry sync' : 'Drive synced'}</span>
            </button>
            <button type="button" className="btn-ghost !h-10 !px-2.5 text-xs sm:!px-3" onClick={handleSignOut} title={`Signed in as ${user?.email || 'Google user'}`}>
              <LogOut size={16} /><span className="hidden sm:inline">Sign out</span>
            </button>
            <ThemeIconButton />
            <NotificationPanel />
            <Link to="/spend/new/expense" className="btn-primary !px-3.5 sm:!px-4" aria-label="Add transaction"><Plus size={18} /><span className="hidden sm:inline">Add transaction</span></Link>
          </div>
        </header>
        <main id="main" className="mx-auto w-full max-w-[1280px] px-4 py-7 sm:px-6 lg:px-10 lg:py-9">
          <div key={pathname} className="animate-fade-up"><Suspense fallback={<Loading />}><Outlet /></Suspense></div>
        </main>
      </div>
    </div>
  );
}
