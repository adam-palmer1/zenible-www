import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../../../../contexts/AuthContext';
import { userAPI } from '../../../../utils/auth';
import { useNotification } from '../../../../contexts/NotificationContext';

/**
 * User Profile Tab - User account settings
 */
const UserProfileTab = () => {
  // Username state
  const [username, setUsername] = useState('');
  const [newUsername, setNewUsername] = useState('');
  const [isAvailable, setIsAvailable] = useState(null);
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);
  const [isSavingUsername, setIsSavingUsername] = useState(false);
  const [usernameError, setUsernameError] = useState('');
  const checkTimeoutRef = useRef(null);

  const { user, updateUser } = useAuth();
  const { showSuccess } = useNotification();

  // Load current username
  useEffect(() => {
    const loadUsername = async () => {
      try {
        const data = await userAPI.getCurrentUsername();
        setUsername(data.username || '');
        setNewUsername(data.username || '');
      } catch (error) {
        console.error('Failed to load username:', error);
      }
    };
    loadUsername();
  }, []);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (checkTimeoutRef.current) {
        clearTimeout(checkTimeoutRef.current);
      }
    };
  }, []);

  // Check username availability with debounce
  const checkUsernameAvailability = useCallback((value) => {
    if (checkTimeoutRef.current) {
      clearTimeout(checkTimeoutRef.current);
    }

    if (value.length < 3 || value === username) {
      setIsAvailable(null);
      return;
    }

    setIsCheckingUsername(true);
    checkTimeoutRef.current = setTimeout(async () => {
      try {
        const data = await userAPI.checkUsernameAvailability(value);
        setIsAvailable(data.available);
      } catch (error) {
        setIsAvailable(null);
      }
      setIsCheckingUsername(false);
    }, 300);
  }, [username]);

  const handleUsernameInputChange = (value) => {
    const sanitized = value.toLowerCase().replace(/[^a-z0-9]/g, '');
    setNewUsername(sanitized);
    setUsernameError('');
    checkUsernameAvailability(sanitized);
  };

  const handleSaveUsername = async () => {
    if (!isAvailable || newUsername === username) return;
    setIsSavingUsername(true);
    try {
      const data = await userAPI.updateUsername(newUsername);
      setUsername(data.username);
      updateUser({ username: data.username });
      showSuccess('Username updated successfully');
    } catch (error) {
      setUsernameError(error.message || 'Failed to update username');
    }
    setIsSavingUsername(false);
  };

  // Format member since date
  const formatMemberSince = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
  };

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Row 1: Email and Full Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Email Address
          </label>
          <input
            type="email"
            value={user?.email || ''}
            disabled
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400 cursor-not-allowed"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Full Name
          </label>
          <input
            type="text"
            value={user?.full_name || user?.name || ''}
            disabled
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400 cursor-not-allowed"
          />
        </div>

        {/* Row 2: Username and Member Since */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Username
          </label>
          <div className="flex gap-2">
            <div className="flex-1">
              <input
                type="text"
                value={newUsername}
                onChange={(e) => handleUsernameInputChange(e.target.value)}
                maxLength={32}
                placeholder="Enter username"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              />
              {newUsername.length > 0 && newUsername.length < 3 && (
                <p className="text-sm text-yellow-600 dark:text-yellow-500 mt-1">Min 3 characters</p>
              )}
              {isCheckingUsername && (
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Checking...</p>
              )}
              {!isCheckingUsername && isAvailable === true && newUsername !== username && (
                <p className="text-sm text-green-600 dark:text-green-500 mt-1">Available</p>
              )}
              {!isCheckingUsername && isAvailable === false && (
                <p className="text-sm text-red-600 dark:text-red-500 mt-1">Taken</p>
              )}
              {usernameError && (
                <p className="text-sm text-red-600 dark:text-red-500 mt-1">{usernameError}</p>
              )}
            </div>
            <button
              onClick={handleSaveUsername}
              disabled={!isAvailable || newUsername === username || isSavingUsername}
              className="px-4 py-2 bg-zenible-primary text-white rounded-lg hover:bg-opacity-90 font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors h-fit"
            >
              {isSavingUsername ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Member Since
          </label>
          <input
            type="text"
            value={formatMemberSince(user?.created_at)}
            disabled
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400 cursor-not-allowed"
          />
        </div>
      </div>
    </div>
  );
};

export default UserProfileTab;
