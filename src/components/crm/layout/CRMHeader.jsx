import React from 'react';
import { Link } from 'react-router-dom';

/**
 * CRMHeader - Page header with tabs
 *
 * @param {string} activeTab - Current active tab ('crm' | 'clients' | 'vendors' | 'services' | 'projects')
 * @param {Function} setActiveTab - Function to change active tab
 * @param {React.ReactNode} children - Filters for CRM tab
 */
const CRMHeader = ({
  activeTab,
  setActiveTab,
  children,
}) => {
  return (
    <div className="bg-white border-b border-gray-200 px-6 py-3">
      <div className="flex items-center justify-between gap-4">
        {/* Left: Tabs */}
        <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
          <Link
            to="/crm"
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'crm'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            CRM
          </Link>
          <Link
            to="/crm/clients"
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'clients'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Clients
          </Link>
          <Link
            to="/crm/vendors"
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'vendors'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Vendors
          </Link>
          <Link
            to="/crm/services"
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'services'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Services
          </Link>
          <Link
            to="/crm/projects"
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'projects'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Projects
          </Link>
        </div>

        {/* Right: Filters */}
        {children}
      </div>
    </div>
  );
};

export default CRMHeader;
