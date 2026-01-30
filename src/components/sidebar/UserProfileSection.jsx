import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import ChevronRightIcon from './icons/ChevronRightIcon';

export default function UserProfileSection() {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleProfileClick = () => {
    setShowDropdown(!showDropdown);
  };

  const handleLogout = async () => {
    await logout();
    navigate('/signin');
  };

  const handleSettings = () => {
    navigate('/settings');
    setShowDropdown(false);
  };

  const handleAdminSettings = () => {
    navigate('/admin');
    setShowDropdown(false);
  };

  // Generate initials for avatar fallback
  const getInitials = (name) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  const displayName = user?.first_name && user?.last_name
    ? `${user.first_name} ${user.last_name}`
    : user?.first_name || user?.email?.split('@')[0] || 'User';
  const username = user?.email ? `@${user.email.split('@')[0]}` : '@user';

  return (
    <div className="px-4 pb-6 relative" ref={dropdownRef}>
      <button
        onClick={handleProfileClick}
        className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-[#F9FAFB] transition-colors duration-150 group"
      >
        <div className="flex items-center gap-3">
          {/* Avatar */}
          <div className="relative">
            {user?.avatar_url ? (
              <img
                src={user.avatar_url}
                alt={displayName}
                className="w-8 h-8 rounded-full object-cover"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-[#8B5CF6] flex items-center justify-center">
                <span className="text-white text-xs font-semibold">
                  {getInitials(displayName)}
                </span>
              </div>
            )}
          </div>

          {/* User Info */}
          <div className="flex flex-col text-left">
            <span className="text-[#111827] text-sm font-semibold leading-5 truncate max-w-[140px]">
              {displayName}
            </span>
            <span className="text-[#6B7280] text-xs leading-4 truncate max-w-[140px]">
              {username}
            </span>
          </div>
        </div>

        <ChevronRightIcon
          className={`w-4 h-4 flex-shrink-0 text-[#6B7280] transition-transform duration-200 ${
            showDropdown ? 'rotate-90' : ''
          }`}
          color="currentColor"
        />
      </button>

      {/* Dropdown Menu */}
      {showDropdown && (
        <div className="absolute bottom-full left-4 right-4 mb-2 bg-white border border-[#E5E7EB] rounded-lg shadow-lg py-2 z-50 min-w-max">
          {isAdmin && (
            <button
              onClick={handleAdminSettings}
              className="w-full text-left px-4 py-2 text-sm text-[#374151] hover:bg-[#F9FAFB] transition-colors"
            >
              Admin Settings
            </button>
          )}
          {isAdmin && <div className="border-t border-[#E5E7EB] my-1"></div>}
          <button
            onClick={handleLogout}
            className="w-full text-left px-4 py-2 text-sm text-[#DC2626] hover:bg-[#FEF2F2] transition-colors"
          >
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}