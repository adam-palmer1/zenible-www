import React, { useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { useAuth } from '../contexts/AuthContext';
import zenibleLogo from '../assets/zenible-logo.png';

function Sidebar({ onClose, onToggleCollapse, isCollapsed: externalIsCollapsed }) {
  const [isCollapsed, setIsCollapsed] = useState(externalIsCollapsed || false);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAdmin, logout } = useAuth();

  const toggleCollapse = () => {
    const newCollapsedState = !isCollapsed;
    setIsCollapsed(newCollapsedState);
    if (onToggleCollapse) {
      onToggleCollapse(newCollapsedState);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className={`flex flex-col h-full md:h-auto md:min-h-[calc(100vh-2.5rem)] pt-9 w-full bg-white dark:bg-gray-900 transition-all duration-300 ${isCollapsed ? 'px-2' : 'px-4 md:px-6'}`}>
      <div className="flex justify-between items-center mb-8">
        {!isCollapsed && (
          <img src={zenibleLogo} alt="Zenible" className="h-8 w-auto" />
        )}
        <div className="flex items-center gap-2">
          {/* Collapse/Expand Button - Hidden on mobile */}
          <button 
            onClick={toggleCollapse}
            className="hidden md:block p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
            title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            <svg 
              width="20" 
              height="20" 
              viewBox="0 0 20 20" 
              fill="none" 
              className={`transform transition-transform duration-200 ${isCollapsed ? 'rotate-180' : ''}`}
            >
              <path 
                d="M12.5 15L7.5 10L12.5 5" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round"
                className="text-theme-secondary"
              />
            </svg>
          </button>
          {/* Mobile close button */}
          <button onClick={onClose} className="md:hidden p-2">
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
      </div>

      <div className="overflow-y-auto flex-1">
        <div className="w-full text-sm font-medium leading-none text-theme-primary">
          <Link 
            to="/collections"
            className={`flex gap-3 items-center py-1.5 w-full tracking-tight whitespace-nowrap rounded-lg cursor-pointer ${isCollapsed ? 'px-2 justify-center' : 'px-4'} ${location.pathname === '/collections' ? 'bg-brand-purple' : 'hover:bg-gray-200 dark:hover:bg-gray-700'}`}
          >
            <svg className={`w-5 h-5 flex-shrink-0 ${location.pathname === '/collections' ? 'text-white' : 'text-gray-600 dark:text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            {!isCollapsed && <div className={`self-stretch my-auto ${location.pathname === '/collections' ? 'text-white' : ''}`}>Collections</div>}
          </Link>
          <Link 
            to="/documents"
            className={`flex gap-3 items-center py-1.5 mt-2 w-full tracking-tight whitespace-nowrap rounded-lg cursor-pointer ${isCollapsed ? 'px-2 justify-center' : 'px-4'} ${location.pathname === '/documents' ? 'bg-brand-purple' : 'hover:bg-gray-200 dark:hover:bg-gray-700'}`}
          >
            <svg className={`w-5 h-5 flex-shrink-0 ${location.pathname === '/documents' ? 'text-white' : 'text-gray-600 dark:text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            {!isCollapsed && <div className={`self-stretch my-auto ${location.pathname === '/documents' ? 'text-white' : ''}`}>Documents</div>}
          </Link>
          <Link 
            to="/search"
            className={`flex gap-3 items-center py-1.5 mt-2 w-full tracking-tight whitespace-nowrap rounded-lg cursor-pointer ${isCollapsed ? 'px-2 justify-center' : 'px-4'} ${location.pathname === '/search' ? 'bg-brand-purple' : 'hover:bg-gray-200 dark:hover:bg-gray-700'}`}
          >
            <svg className={`w-5 h-5 flex-shrink-0 ${location.pathname === '/search' ? 'text-white' : 'text-gray-600 dark:text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            {!isCollapsed && <div className={`self-stretch my-auto ${location.pathname === '/search' ? 'text-white' : ''}`}>Search & Q&A</div>}
          </Link>
        </div>

        <div className="flex flex-col mt-6 w-full text-sm font-medium leading-none text-theme-primary">
          {!isCollapsed && (
            <div className="gap-2.5 self-start pl-4 tracking-tight text-theme-secondary whitespace-nowrap">
              Account
            </div>
          )}
          <Link 
            to="/subscription"
            className={`flex gap-2.5 items-center py-2 mt-2 w-full whitespace-nowrap rounded-lg cursor-pointer ${isCollapsed ? 'px-2 justify-center' : 'px-4'} ${location.pathname === '/subscription' ? 'bg-brand-purple' : 'hover:bg-gray-200 dark:hover:bg-gray-700'}`}
          >
            <svg className={`w-5 h-5 flex-shrink-0 ${location.pathname === '/subscription' ? 'text-white' : 'text-gray-600 dark:text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
            </svg>
            {!isCollapsed && <div className={`self-stretch my-auto ${location.pathname === '/subscription' ? 'text-white' : ''}`}>Subscription</div>}
          </Link>
        </div>

        {isAdmin && (
          <div className="flex flex-col mt-6 w-full text-sm font-medium leading-none text-theme-primary">
            {!isCollapsed && (
              <div className="gap-2.5 self-start pl-4 tracking-tight text-theme-secondary whitespace-nowrap">
                Administration
              </div>
            )}
            <Link 
              to="/admin"
              className={`flex gap-2.5 items-center py-2 mt-2 w-full whitespace-nowrap rounded-lg cursor-pointer ${isCollapsed ? 'px-2 justify-center' : 'px-4'} ${location.pathname === '/admin' ? 'bg-brand-purple' : 'hover:bg-gray-200 dark:hover:bg-gray-700'}`}
            >
              <svg className={`w-5 h-5 flex-shrink-0 ${location.pathname === '/admin' ? 'text-white' : 'text-gray-600 dark:text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
              </svg>
              {!isCollapsed && <div className={`self-stretch my-auto ${location.pathname === '/admin' ? 'text-white' : ''}`}>Admin Panel</div>}
            </Link>
          </div>
        )}
      </div>

      {/* User section at bottom */}
      <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mt-4">
        {user ? (
          <div className={`${isCollapsed ? 'flex flex-col items-center' : ''}`}>
            <div className={`flex items-center gap-3 mb-3 ${isCollapsed ? 'flex-col' : ''}`}>
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-purple to-brand-purple-hover flex items-center justify-center text-white font-semibold shadow-lg">
                {user.email?.charAt(0).toUpperCase() || 'U'}
              </div>
              {!isCollapsed && (
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                    {user.email}
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    {user.role === 'admin' ? 'Administrator' : 'User'}
                  </p>
                </div>
              )}
            </div>
            <button
              onClick={handleLogout}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all duration-200 ${isCollapsed ? 'justify-center' : ''}`}
              title={isCollapsed ? 'Logout' : ''}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              {!isCollapsed && <span className="font-medium">Logout</span>}
            </button>
          </div>
        ) : (
          <div className="text-center text-gray-600 dark:text-gray-400 text-sm">
            Not logged in
          </div>
        )}
      </div>
    </div>
  );
}

export default Sidebar;