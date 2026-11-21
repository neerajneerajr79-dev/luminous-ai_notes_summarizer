import React, { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import DashboardHeader from './DashboardHeader';

const COLLAPSE_KEY = 'lumio_sidebar_collapsed';

const SEARCH_PLACEHOLDERS = {
  '/dashboard': 'Search your notes...',
  '/notes': 'Search your notes...',
  '/flashcards': 'Search notes...',
};

export default function DashboardLayout() {
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem(COLLAPSE_KEY) === 'true');
  const [mobileOpen, setMobileOpen] = useState(false);
  const [search, setSearch] = useState('');
  const location = useLocation();

  const toggleCollapse = () => {
    setCollapsed((c) => {
      localStorage.setItem(COLLAPSE_KEY, String(!c));
      return !c;
    });
  };

  // Reset the search field when moving between sections.
  useEffect(() => {
    setSearch('');
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-surface-mute dark:bg-ink">
      <Sidebar
        collapsed={collapsed}
        onToggleCollapse={toggleCollapse}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
      />
      <div className={`flex min-h-screen flex-col transition-all duration-200 ${collapsed ? 'md:pl-[76px]' : 'md:pl-64'}`}>
        <DashboardHeader
          onOpenMobileNav={() => setMobileOpen(true)}
          searchPlaceholder={SEARCH_PLACEHOLDERS[location.pathname]}
          searchValue={search}
          onSearch={setSearch}
        />
        <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 lg:px-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
