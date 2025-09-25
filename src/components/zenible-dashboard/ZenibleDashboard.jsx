import React from 'react';
import ZenibleSidebar from './ZenibleSidebar';
import ZenibleTopBar from './ZenibleTopBar';
import PageHeader from './PageHeader';
import MetricCards from './MetricCards';
import SalesChart from './SalesChart';
import RecentSales from './RecentSales';
import { usePreferences } from '../../contexts/PreferencesContext';

export default function ZenibleDashboard() {
  const { darkMode, toggleDarkMode } = usePreferences();

  return (
    <div className={`flex h-screen font-inter ${darkMode ? 'bg-zenible-dark-bg' : 'bg-gray-50'}`}>
      {/* Sidebar */}
      <ZenibleSidebar darkMode={darkMode} toggleDarkMode={toggleDarkMode} />
      
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col">
        {/* Top Bar */}
        <ZenibleTopBar darkMode={darkMode} />
        
        {/* Page Header with Title and Date Tabs */}
        <PageHeader darkMode={darkMode} />
        
        {/* Dashboard Content */}
        <div className={`flex-1 overflow-auto ${darkMode ? 'bg-zenible-dark-bg' : 'bg-gray-50'}`}>
          {/* Metric Cards */}
          <MetricCards darkMode={darkMode} />
          
          {/* Charts Section */}
          <div className="flex gap-3.5 px-4 pb-4">
            <div className="flex-1 max-w-[720px]">
              <SalesChart darkMode={darkMode} />
            </div>
            <div className="w-[400px]">
              <RecentSales darkMode={darkMode} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}