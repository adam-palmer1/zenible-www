import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { usePreferences } from '../../contexts/PreferencesContext';
import { userAPI } from '../../utils/auth';
import TwoFactorSection from './TwoFactorSection';

interface ProfileSettingsTabProps {
  profile: any;
  setProfile: React.Dispatch<React.SetStateAction<any>>;
  setError: (error: string | null) => void;
  setSuccessMessage: (message: string | null) => void;
  formatDate: (dateString: string) => string;
  showPasswordResetModal: boolean;
  setShowPasswordResetModal: (show: boolean) => void;
}

export default function ProfileSettingsTab({
  profile,
  setProfile,
  setError,
  setSuccessMessage,
  formatDate,
  showPasswordResetModal: _showPasswordResetModal,
  setShowPasswordResetModal,
}: ProfileSettingsTabProps) {
  const { updateUser } = useAuth();
  const { darkMode } = usePreferences();

  // Username state
  const [username, setUsername] = useState('');
  const [newUsername, setNewUsername] = useState('');
  const [isUsernameAvailable, setIsUsernameAvailable] = useState<boolean | null>(null);
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);
  const [isSavingUsername, setIsSavingUsername] = useState(false);
  const [usernameError, setUsernameError] = useState('');
  const checkUsernameTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Avatar state
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isDeletingAvatar, setIsDeletingAvatar] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  // Profile name state
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  useEffect(() => {
    loadUsername();
  }, []);

  useEffect(() => {
    setFirstName(profile?.first_name || '');
    setLastName(profile?.last_name || '');
  }, [profile]);

  // Cleanup username check timeout on unmount
  useEffect(() => {
    return () => {
      if (checkUsernameTimeoutRef.current) {
        clearTimeout(checkUsernameTimeoutRef.current);
      }
    };
  }, []);

  // Load current username
  const loadUsername = async () => {
    try {
      const data = await userAPI.getCurrentUsername();
      setUsername(data.username || '');
      setNewUsername(data.username || '');
    } catch (error) {
      console.error('Failed to load username:', error);
    }
  };

  // Check username availability with debounce
  const checkUsernameAvailability = useCallback((value: string) => {
    if (checkUsernameTimeoutRef.current) {
      clearTimeout(checkUsernameTimeoutRef.current);
    }

    if (value.length < 3 || value === username) {
      setIsUsernameAvailable(null);
      return;
    }

    setIsCheckingUsername(true);
    checkUsernameTimeoutRef.current = setTimeout(async () => {
      try {
        const data = await userAPI.checkUsernameAvailability(value);
        setIsUsernameAvailable(data.available);
      } catch (_error) {
        setIsUsernameAvailable(null);
      }
      setIsCheckingUsername(false);
    }, 300);
  }, [username]);

  const handleUsernameInputChange = (value: string) => {
    const sanitized = value.toLowerCase().replace(/[^a-z0-9]/g, '');
    setNewUsername(sanitized);
    setUsernameError('');
    checkUsernameAvailability(sanitized);
  };

  const handleSaveUsername = async () => {
    if (!isUsernameAvailable || newUsername === username) return;
    setIsSavingUsername(true);
    try {
      const data = await userAPI.updateUsername(newUsername);
      setUsername(data.username);
      updateUser({ username: data.username });
      setSuccessMessage('Username updated successfully');
    } catch (error: unknown) {
      setUsernameError((error as Error).message || 'Failed to update username');
    }
    setIsSavingUsername(false);
  };

  const handleAvatarSelect = () => {
    avatarInputRef.current?.click();
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setError('Please select a valid image file (JPEG, PNG, GIF, or WebP)');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be less than 5MB');
      return;
    }

    setIsUploadingAvatar(true);
    setError(null);
    try {
      const data = await userAPI.uploadAvatar(file);
      setProfile((prev: any) => ({ ...prev, avatar_url: data.avatar_url }));
      updateUser({ avatar_url: data.avatar_url });
      setSuccessMessage('Profile picture updated successfully');
    } catch (error: unknown) {
      setError((error as Error).message || 'Failed to upload profile picture');
    } finally {
      setIsUploadingAvatar(false);
      // Reset input so same file can be selected again
      if (avatarInputRef.current) {
        avatarInputRef.current.value = '';
      }
    }
  };

  const handleAvatarDelete = async () => {
    if (!window.confirm('Are you sure you want to remove your profile picture?')) {
      return;
    }

    setIsDeletingAvatar(true);
    setError(null);
    try {
      await userAPI.deleteAvatar();
      setProfile((prev: any) => ({ ...prev, avatar_url: null }));
      updateUser({ avatar_url: null });
      setSuccessMessage('Profile picture removed successfully');
    } catch (error: unknown) {
      setError((error as Error).message || 'Failed to remove profile picture');
    } finally {
      setIsDeletingAvatar(false);
    }
  };

  const handleSaveProfile = async () => {
    setIsSavingProfile(true);
    setError(null);
    try {
      const data = await userAPI.updateProfile({
        first_name: firstName,
        last_name: lastName
      });
      setProfile((prev: any) => ({ ...prev, first_name: data.first_name, last_name: data.last_name }));
      updateUser({ first_name: data.first_name, last_name: data.last_name });
      setSuccessMessage('Profile updated successfully');
    } catch (error: unknown) {
      setError((error as Error).message || 'Failed to update profile');
    } finally {
      setIsSavingProfile(false);
    }
  };

  // Check if profile name has changed
  const hasProfileChanges = firstName !== (profile?.first_name || '') || lastName !== (profile?.last_name || '');

  return (
    <div className="space-y-6">
      {/* Profile Information */}
      <div className={`rounded-xl shadow-sm border ${darkMode ? 'bg-zenible-dark-card border-zenible-dark-border' : 'bg-white border-neutral-200'}`}>
        <div className={`px-6 py-4 border-b ${darkMode ? 'border-zenible-dark-border' : 'border-neutral-200'}`}>
          <h2 className={`text-lg font-semibold ${darkMode ? 'text-zenible-dark-text' : 'text-zinc-950'}`}>
            Profile Information
          </h2>
        </div>

        <div className="p-6 space-y-4">
          {/* Row 1: Email + Username */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-zenible-dark-text' : 'text-gray-700'}`}>
                Email Address
              </label>
              <input
                type="email"
                value={profile?.email || ''}
                disabled
                className={`w-full px-3 py-2 rounded-lg border ${
                  darkMode
                    ? 'bg-zenible-dark-bg border-zenible-dark-border text-zenible-dark-text-secondary'
                    : 'bg-gray-50 border-gray-300 text-gray-500'
                } cursor-not-allowed`}
              />
            </div>

            <div>
              <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-zenible-dark-text' : 'text-gray-700'}`}>
                Username
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newUsername}
                  onChange={(e) => handleUsernameInputChange(e.target.value)}
                  maxLength={32}
                  placeholder="Enter username"
                  className={`flex-1 px-3 py-2 rounded-lg border ${
                    darkMode
                      ? 'bg-zenible-dark-bg border-zenible-dark-border text-zenible-dark-text'
                      : 'bg-white border-gray-300 text-gray-900'
                  } focus:ring-2 focus:ring-zenible-primary focus:border-transparent`}
                />
                <button
                  onClick={handleSaveUsername}
                  disabled={!isUsernameAvailable || newUsername === username || isSavingUsername}
                  className="px-3 py-2 bg-zenible-primary text-white rounded-lg hover:bg-opacity-90 font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
                >
                  {isSavingUsername ? '...' : 'Save'}
                </button>
              </div>
              {newUsername.length > 0 && newUsername.length < 3 && (
                <p className="text-sm text-yellow-600 dark:text-yellow-500 mt-1">Min 3 characters</p>
              )}
              {isCheckingUsername && (
                <p className={`text-sm mt-1 ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'}`}>Checking...</p>
              )}
              {!isCheckingUsername && isUsernameAvailable === true && newUsername !== username && (
                <p className="text-sm text-green-600 dark:text-green-500 mt-1">Available</p>
              )}
              {!isCheckingUsername && isUsernameAvailable === false && (
                <p className="text-sm text-red-600 dark:text-red-500 mt-1">Taken</p>
              )}
              {usernameError && (
                <p className="text-sm text-red-600 dark:text-red-500 mt-1">{usernameError}</p>
              )}
            </div>
          </div>

          {/* Row 2: First Name + Last Name */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-zenible-dark-text' : 'text-gray-700'}`}>
                First Name
              </label>
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="Enter first name"
                className={`w-full px-3 py-2 rounded-lg border ${
                  darkMode
                    ? 'bg-zenible-dark-bg border-zenible-dark-border text-zenible-dark-text'
                    : 'bg-white border-gray-300 text-gray-900'
                } focus:ring-2 focus:ring-zenible-primary focus:border-transparent`}
              />
            </div>

            <div>
              <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-zenible-dark-text' : 'text-gray-700'}`}>
                Last Name
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Enter last name"
                  className={`flex-1 px-3 py-2 rounded-lg border ${
                    darkMode
                      ? 'bg-zenible-dark-bg border-zenible-dark-border text-zenible-dark-text'
                      : 'bg-white border-gray-300 text-gray-900'
                  } focus:ring-2 focus:ring-zenible-primary focus:border-transparent`}
                />
                <button
                  onClick={handleSaveProfile}
                  disabled={!hasProfileChanges || isSavingProfile}
                  className="px-3 py-2 bg-zenible-primary text-white rounded-lg hover:bg-opacity-90 font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
                >
                  {isSavingProfile ? '...' : 'Save'}
                </button>
              </div>
            </div>
          </div>

          {/* Row 3: Role + Member Since */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-zenible-dark-text' : 'text-gray-700'}`}>
                Role
              </label>
              <div className={`px-3 py-2 rounded-lg border ${
                darkMode
                  ? 'bg-zenible-dark-bg border-zenible-dark-border'
                  : 'bg-gray-50 border-gray-200'
              }`}>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  profile?.role === 'ADMIN'
                    ? 'bg-red-100 text-red-800'
                    : 'bg-blue-100 text-blue-800'
                }`}>
                  {profile?.role || 'User'}
                </span>
              </div>
            </div>

            <div>
              <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-zenible-dark-text' : 'text-gray-700'}`}>
                Member Since
              </label>
              <div className={`px-3 py-2 rounded-lg border ${
                darkMode
                  ? 'bg-zenible-dark-bg border-zenible-dark-border text-zenible-dark-text-secondary'
                  : 'bg-gray-50 border-gray-200 text-gray-600'
              }`}>
                {profile?.created_at ? formatDate(profile.created_at) : 'Unknown'}
              </div>
            </div>
          </div>

          <div>
            <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-zenible-dark-text' : 'text-gray-700'}`}>
              Profile Picture
            </label>
            <div className="flex items-center space-x-4">
              {profile?.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt="Profile"
                  className="w-16 h-16 rounded-full border-2 border-gray-200 dark:border-zenible-dark-border object-cover"
                />
              ) : (
                <div className={`w-16 h-16 rounded-full border-2 flex items-center justify-center ${
                  darkMode
                    ? 'bg-zenible-dark-bg border-zenible-dark-border text-zenible-dark-text-secondary'
                    : 'bg-gray-100 border-gray-200 text-gray-400'
                }`}>
                  <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                  </svg>
                </div>
              )}
              <div className="flex flex-col gap-2">
                <input
                  type="file"
                  ref={avatarInputRef}
                  onChange={handleAvatarChange}
                  accept="image/jpeg,image/png,image/gif,image/webp"
                  className="hidden"
                />
                <button
                  onClick={handleAvatarSelect}
                  disabled={isUploadingAvatar}
                  className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                    darkMode
                      ? 'bg-zenible-dark-bg border border-zenible-dark-border text-zenible-dark-text hover:bg-zenible-dark-border'
                      : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {isUploadingAvatar ? 'Uploading...' : profile?.avatar_url ? 'Change Picture' : 'Upload Picture'}
                </button>
                {profile?.avatar_url && (
                  <button
                    onClick={handleAvatarDelete}
                    disabled={isDeletingAvatar}
                    className="px-3 py-1.5 text-sm font-medium rounded-lg text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isDeletingAvatar ? 'Removing...' : 'Remove'}
                  </button>
                )}
              </div>
            </div>
            <p className={`mt-2 text-sm ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'}`}>
              JPEG, PNG, GIF, or WebP. Max 5MB.
            </p>
          </div>
        </div>
      </div>

      {/* Security Settings */}
      <div className={`rounded-xl shadow-sm border ${darkMode ? 'bg-zenible-dark-card border-zenible-dark-border' : 'bg-white border-neutral-200'}`}>
        <div className={`px-6 py-4 border-b ${darkMode ? 'border-zenible-dark-border' : 'border-neutral-200'}`}>
          <h2 className={`text-lg font-semibold ${darkMode ? 'text-zenible-dark-text' : 'text-zinc-950'}`}>
            Security
          </h2>
        </div>

        <div className="p-6 space-y-6">
          {/* Two-Factor Authentication */}
          <TwoFactorSection setError={setError} setSuccessMessage={setSuccessMessage} />

          {/* Divider */}
          <div className={`border-t ${darkMode ? 'border-zenible-dark-border' : 'border-gray-200'}`} />

          {/* Password */}
          <div>
            <h3 className={`text-sm font-medium mb-2 ${darkMode ? 'text-zenible-dark-text' : 'text-gray-700'}`}>
              Password
            </h3>
            <p className={`text-sm mb-3 ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-600'}`}>
              To change your password, we'll send you a secure link via email
            </p>
            <button
              onClick={() => setShowPasswordResetModal(true)}
              className={`px-4 py-2 border rounded-lg ${
                darkMode
                  ? 'border-zenible-dark-border text-zenible-dark-text hover:bg-zenible-dark-bg'
                  : 'border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              Reset Password via Email
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
