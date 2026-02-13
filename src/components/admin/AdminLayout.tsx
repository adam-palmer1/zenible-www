import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import AdminSidebar from './AdminSidebar';
import AdminRoute from './AdminRoute';
import { usePreferences } from '../../contexts/PreferencesContext';
import { useMobile } from '../../hooks/useMobile';
import { useBodyScrollLock } from '../../hooks/useBodyScrollLock';
import brandIcon from '../../assets/icons/brand-icon.svg';

export default function AdminLayout() {
  const { darkMode } = usePreferences();
  const isMobile = useMobile();
  const [mobileOpen, setMobileOpen] = useState(false);

  useBodyScrollLock(isMobile && mobileOpen);

  return (
    <AdminRoute>
      <div className={`min-h-screen-safe font-inter ${darkMode ? 'bg-zenible-dark-bg' : 'bg-gray-50'}`}>
        {/* Desktop sidebar */}
        {!isMobile && (
          <div className="fixed left-0 top-0 h-full z-30">
            <AdminSidebar />
          </div>
        )}

        {/* Mobile drawer */}
        {isMobile && mobileOpen && (
          <>
            <div
              className="fixed inset-0 bg-black/50 z-40"
              onClick={() => setMobileOpen(false)}
              aria-hidden="true"
            />
            <div className="fixed left-0 top-0 h-full z-50 animate-slide-in-left">
              <AdminSidebar />
            </div>
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
                <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              <div className="w-7 h-7 rounded-lg bg-[#8B5CF6] flex items-center justify-center p-1">
                <img src={brandIcon} alt="Zenible" className="w-4 h-4" />
              </div>
              <span className="text-sm font-semibold text-[#111827]">Admin</span>
            </header>
          )}

          <Outlet context={{ darkMode }} />
        </div>
      </div>
    </AdminRoute>
  );
}
