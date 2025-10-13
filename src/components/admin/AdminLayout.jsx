import React from 'react';
import { Outlet } from 'react-router-dom';
import AdminSidebar from './AdminSidebar';
import AdminRoute from './AdminRoute';
import { usePreferences } from '../../contexts/PreferencesContext';

export default function AdminLayout() {
  const { darkMode } = usePreferences();

  return (
    <AdminRoute>
      <div className={`flex h-screen font-inter ${darkMode ? 'bg-zenible-dark-bg' : 'bg-gray-50'}`}>
        <AdminSidebar />

        <div className="flex-1 flex flex-col overflow-hidden">
          <Outlet context={{ darkMode }} />
        </div>
      </div>
    </AdminRoute>
  );
}