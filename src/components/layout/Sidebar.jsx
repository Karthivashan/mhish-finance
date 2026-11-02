import { ArrowLeftRight, BarChart3, LayoutDashboard, PanelLeftClose, PanelLeftOpen, Tags, Target, UserCog } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import Avatar from '../ui/Avatar';
import Logo from './Logo';
import { ThemeSegmented } from './ThemeToggle';

export const NAV = [
  { to: '/', label: 'Overview', icon: LayoutDashboard, end: true },
  { to: '/spend', label: 'Spend', icon: ArrowLeftRight },
  { to: '/insights', label: 'Insights', icon: BarChart3 },
  { to: '/budgets', label: 'Budgets', icon: Target },
  { to: '/categories', label: 'Categories', icon: Tags },
  { to: '/profile', label: 'Profile & Settings', icon: UserCog },
];

export default function Sidebar({ collapsed = false, onToggle, onNavigate }) {
  const { profile } = useApp();
  return (
    <div className="flex h-full flex-col">
      <div className={`flex h-[72px] items-center ${collapsed ? 'justify-center' : 'justify-between px-5'}`}>
        <Logo showName={!collapsed} />
      </div>
      <nav aria-label="Primary" className="flex-1 space-y-1 overflow-y-auto px-3 py-2">
        {NAV.map(({ to, label, icon: Icon, end }) => (
          <NavLink key={to} to={to} end={end} onClick={onNavigate} title={collapsed ? label : undefined} aria-label={label}
            className={({ isActive }) =>
              `group relative flex h-11 items-center gap-3 rounded-xl text-sm font-semibold transition ${collapsed ? 'justify-center' : 'px-3.5'} ${
                isActive ? 'bg-accent/15 text-ink' : 'text-muted hover:bg-raised hover:text-ink'}`}>
            {({ isActive }) => (
              <>
                {isActive && <span className="absolute -left-3 top-2.5 h-6 w-1 rounded-r-full bg-accent" aria-hidden="true" />}
                <Icon size={19} className={isActive ? 'text-accent' : ''} />
                {!collapsed && <span className="truncate">{label}</span>}
              </>
            )}
          </NavLink>
        ))}
      </nav>
      <div className="space-y-3 border-t border-line/60 p-3">
        <ThemeSegmented compact={collapsed} />
        <NavLink to="/profile" onClick={onNavigate} className={`flex items-center gap-3 rounded-xl p-2 transition hover:bg-raised ${collapsed ? 'justify-center' : ''}`} aria-label="Your profile">
          <Avatar profile={profile} size={38} />
          {!collapsed && (
            <span className="min-w-0">
              <span className="block truncate text-sm font-bold">{profile.name || 'Guest'}</span>
              <span className="block truncate text-xs text-muted">{profile.email || 'Local profile'}</span>
            </span>
          )}
        </NavLink>
        {onToggle && (
          <button type="button" onClick={onToggle} className="btn-ghost w-full !h-10 text-xs" aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'} aria-expanded={!collapsed}>
            {collapsed ? <PanelLeftOpen size={16} /> : <><PanelLeftClose size={16} />Collapse</>}
          </button>
        )}
      </div>
    </div>
  );
}
