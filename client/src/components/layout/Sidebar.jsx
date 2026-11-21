import React from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import { clsx } from 'clsx';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  FileText,
  Sparkles,
  Layers,
  ListChecks,
  MessageSquareText,
  CalendarRange,
  Settings as SettingsIcon,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
  X,
  Home,
} from 'lucide-react';
import Logo from '../common/Logo';
import { initials } from '../../utils/format';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';

export const NAV_ITEMS = [
  { to: '/dashboard', label: 'Overview', icon: LayoutDashboard },
  { to: '/notes', label: 'My Notes', icon: FileText },
  { to: '/summarizer', label: 'AI Summarizer', icon: Sparkles },
  { to: '/flashcards', label: 'Flashcards', icon: Layers },
  { to: '/quizzes', label: 'Quizzes', icon: ListChecks },
  { to: '/ask', label: 'Ask Lumio', icon: MessageSquareText },
  { to: '/planner', label: 'Study Planner', icon: CalendarRange },
  { to: '/settings', label: 'Settings', icon: SettingsIcon },
];

function NavItem({ item, collapsed }) {
  const Icon = item.icon;
  return (
    <NavLink
      to={item.to}
      className={({ isActive }) =>
        clsx(
          'group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors',
          collapsed && 'justify-center px-2',
          isActive
            ? 'bg-accent-lavender text-accent dark:bg-accent/20 dark:text-accent-soft'
            : 'text-ink-soft hover:bg-surface-mute hover:text-ink dark:hover:bg-white/5 dark:hover:text-white'
        )
      }
      title={collapsed ? item.label : undefined}
    >
      {({ isActive }) => (
        <>
          {isActive && (
            <motion.span
              layoutId="nav-active"
              className="absolute left-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r-full bg-accent"
            />
          )}
          <Icon size={18} className="shrink-0" />
          {!collapsed && <span className="truncate">{item.label}</span>}
        </>
      )}
    </NavLink>
  );
}

export default function Sidebar({ collapsed, onToggleCollapse, mobileOpen, onCloseMobile }) {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { toast } = useToast();

  const handleLogout = async () => {
    try {
      await logout();
      toast('Logged out. See you soon!', 'success');
      navigate('/login');
    } catch (err) {
      toast(err.message, 'error');
    }
  };

  const content = (isMobile = false) => (
    <div className="flex h-full flex-col">
      {isMobile && (
        <button
          onClick={onCloseMobile}
          className="absolute right-4 top-4 rounded-lg p-1.5 text-ink-soft hover:bg-surface-mute"
          aria-label="Close menu"
        >
          <X size={18} />
        </button>
      )}

      <div className={clsx('px-5 pt-6 pb-7', collapsed && !isMobile && 'px-3')}>
        <Link to="/dashboard" className="inline-block" onClick={onCloseMobile}>
          <Logo showText={!(collapsed && !isMobile)} size={34} textSize={collapsed && !isMobile ? 'hidden' : 'text-lg'} />
        </Link>
      </div>

      <nav className="flex-1 space-y-1 px-3">
        <p className={clsx('mb-1 px-3 text-2xs font-bold uppercase tracking-widest text-ink-soft/70', collapsed && !isMobile && 'px-0 text-center')}>
          {collapsed && !isMobile ? '•••' : 'Menu'}
        </p>
        {NAV_ITEMS.map((item) => (
          <NavItem key={item.to} item={item} collapsed={collapsed && !isMobile} />
        ))}
      </nav>

      <div className="mt-auto space-y-2 px-3 pb-5">
        {!collapsed && (
          <button
            onClick={() => window.open('/', '_self')}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-ink-soft transition-colors hover:bg-surface-mute hover:text-ink dark:hover:bg-white/5"
          >
            <Home size={18} />
            Back to site
          </button>
        )}
        {!collapsed && (
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-ink-soft transition-colors hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/40"
          >
            <LogOut size={18} />
            Log out
          </button>
        )}
        <div
          className={clsx(
            'flex items-center gap-3 rounded-xl border border-line bg-surface-mute/60 p-2.5 dark:border-white/10 dark:bg-white/5',
            collapsed && !isMobile && 'justify-center border-0 bg-transparent p-2'
          )}
        >
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-accent to-accent-soft text-xs font-bold text-white">
            {initials(user?.name || ' Student').slice(0, 2)}
          </div>
          {!collapsed && (
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">{user?.name}</p>
              <p className="truncate text-2xs text-ink-soft">{user?.email}</p>
            </div>
          )}
          {collapsed && !isMobile ? null : null}
        </div>
        {!isMobile && (
          <button
            onClick={onToggleCollapse}
            className={clsx(
              'flex w-full items-center justify-center gap-2 rounded-xl py-2 text-2xs font-semibold text-ink-soft transition-colors hover:bg-surface-mute',
              collapsed && 'px-2'
            )}
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? <PanelLeftOpen size={16} /> : <PanelLeftClose size={16} />}
            {!collapsed && 'Collapse'}
          </button>
        )}
      </div>
    </div>
  );
  void AnimatePresence;

  return (
    <>
      {/* Desktop sidebar */}
      <aside
        className={clsx(
          'fixed inset-y-0 left-0 z-40 hidden border-r border-line bg-white transition-all duration-200 dark:border-white/10 dark:bg-ink-secondary md:flex md:flex-col',
          collapsed ? 'w-[76px]' : 'w-64'
        )}
      >
        {content(false)}
      </aside>

      {/* Mobile drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-ink/40 backdrop-blur-sm md:hidden"
              onClick={onCloseMobile}
            />
            <motion.aside
              initial={{ x: -300 }}
              animate={{ x: 0 }}
              exit={{ x: -300 }}
              transition={{ type: 'tween', duration: 0.22 }}
              className="fixed inset-y-0 left-0 z-50 w-72 border-r border-line bg-white dark:bg-ink-secondary md:hidden"
            >
              {content(true)}
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
