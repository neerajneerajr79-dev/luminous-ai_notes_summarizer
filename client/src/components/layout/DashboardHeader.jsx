import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Bell, Menu, Moon, Sun } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { initials, greeting, format } from '../../utils/format';
import Badge from '../common/Badge';

export default function DashboardHeader({ onOpenMobileNav, searchPlaceholder, searchValue, onSearch, notifications = 0 }) {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(t);
  }, []);

  const handleGlobalSearch = (e) => {
    e.preventDefault();
    const q = (searchValue ?? '').trim();
    if (q) navigate(`/notes?search=${encodeURIComponent(q)}`);
  };

  const today = format(now, 'EEEE, MMMM d, yyyy');

  return (
    <header className="sticky top-0 z-30 border-b border-line bg-white/80 px-4 py-3.5 backdrop-blur-xl dark:border-white/10 dark:bg-ink-secondary/80 sm:px-6">
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenMobileNav}
          className="rounded-xl p-2 text-ink-soft hover:bg-surface-mute md:hidden"
          aria-label="Open navigation"
        >
          <Menu size={20} />
        </button>

        <div className="hidden min-w-0 flex-1 lg:block">
          <h1 className="truncate text-lg font-bold">{greeting(user?.name)}</h1>
          <p className="text-xs text-ink-soft">{today}</p>
        </div>

        <form onSubmit={handleGlobalSearch} className="relative min-w-0 flex-1 lg:max-w-md">
          <Search size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-soft" />
          <input
            type="search"
            value={searchValue ?? ''}
            onChange={(e) => onSearch?.(e.target.value)}
            placeholder={searchPlaceholder || 'Search your notes...'}
            className="input h-10 rounded-full pl-10 dark:bg-white/5"
            aria-label="Search notes"
          />
        </form>

        <button
          onClick={toggleTheme}
          className="rounded-xl p-2 text-ink-soft transition-colors hover:bg-surface-mute hover:text-ink"
          aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
          title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
        >
          {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
        </button>

        <button
          className="relative rounded-xl p-2 text-ink-soft transition-colors hover:bg-surface-mute hover:text-ink"
          aria-label="Notifications"
          title="No new notifications"
        >
          <Bell size={18} />
          {notifications > 0 && (
            <Badge tone="red" className="absolute -right-0.5 -top-0.5 !px-1.5 !py-0 !text-[9px]">
              {notifications > 9 ? '9+' : notifications}
            </Badge>
          )}
        </button>

        <button
          onClick={() => navigate('/settings')}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-accent to-accent-soft text-xs font-bold text-white transition-transform hover:scale-105"
          title="Open settings"
        >
          {initials(user?.name || 'St').slice(0, 2) || <span>?</span>}
        </button>
      </div>
    </header>
  );
}
