import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import AdminSidebar from './AdminSidebar';
import AdminRoute from './AdminRoute';
import { usePreferences } from '../../contexts/PreferencesContext';
import { useMobile } from '../../hooks/useMobile';
import { useBodyScrollLock } from '../../hooks/useBodyScrollLock';
import { favicon } from '../../assets/logos';

export default function AdminLayout() {
  const { darkMode } = usePreferences();
  const isMobile = useMobile();
  const [mobileOpen, setMobileOpen] = useState(false);

  useBodyScrollLock(isMobile && mobileOpen);

  return (
    <AdminRoute>
      <div className={`min-h-screen-safe font-inter ${darkMode ? 'bg-zenible-dark-bg' : 'bg-gray-50'}`}>
        {/* Skip link — hidden until focused so keyboard users can bypass the sidebar. */}
        <a
          href="#admin-main"
          className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[1000] focus:px-4 focus:py-2 focus:rounded-lg focus:bg-zenible-primary focus:text-white focus:shadow-lg"
        >
          Skip to main content
        </a>

        {/* Desktop sidebar */}
        {!isMobile && (
          <nav className="fixed left-0 top-0 h-full z-30" aria-label="Admin navigation">
            <AdminSidebar />
          </nav>
        )}

        {/* Mobile drawer */}
        {isMobile && mobileOpen && (
          <>
            <div
              className="fixed inset-0 bg-black/50 z-40"
              onClick={() => setMobileOpen(false)}
              aria-hidden="true"
            />
            <nav className="fixed left-0 top-0 h-full z-50 animate-slide-in-left" aria-label="Admin navigation">
              <AdminSidebar />
            </nav>
          </>
        )}

        {/* Main content */}
        <div
          className="flex-1 flex flex-col overflow-hidden min-h-screen-safe"
          style={!isMobile ? { marginLeft: '280px' } : undefined}
        >
          {/* Mobile header */}
          {isMobile && (
            <header className="sticky top-0 z-30 flex items-center gap-3 bg-white border-b border-[#E5E7EB] px-4 py-3">
              <button
                onClick={() => setMobileOpen(true)}
                className="flex items-center justify-center w-11 h-11 rounded-md hover:bg-gray-100 transition-colors"
                aria-label="Open menu"
              >
                <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              <img src={favicon} alt="Zenible" className="w-7 h-7 rounded-lg" />
              <span className="text-sm font-semibold text-[#111827]">Admin</span>
            </header>
          )}

          <main id="admin-main">
            <Outlet context={{ darkMode }} />
          </main>
        </div>
      </div>
    </AdminRoute>
  );
}
