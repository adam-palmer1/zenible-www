import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { usePreferences } from '../contexts/PreferencesContext';
import { authAPI, userAPI } from '../utils/auth';
import planAPI from '../services/planAPI';
import UpdatePaymentModal from './UpdatePaymentModal';
import PaymentHistory from './PaymentHistory';
import CustomizationQuestions from './CustomizationQuestions';
import ProfileTab from './crm/settings/tabs/ProfileTab';
import CurrenciesTab from './crm/settings/tabs/CurrenciesTab';
import CountriesTab from './crm/settings/tabs/CountriesTab';
import IntegrationsTab from './crm/settings/tabs/IntegrationsTab';
import AdvancedTab from './crm/settings/tabs/AdvancedTab';
import BookingTab from './crm/settings/tabs/BookingTab';
import EmailTemplates from './settings/EmailTemplates';
import NewSidebar from './sidebar/NewSidebar';
import {
  UserIcon,
  CreditCardIcon,
  BanknotesIcon,
  PaintBrushIcon,
  BuildingOfficeIcon,
  CurrencyDollarIcon,
  GlobeAltIcon,
  PuzzlePieceIcon,
  Cog6ToothIcon,
  EnvelopeIcon,
  CalendarDaysIcon,
} from '@heroicons/react/24/outline';

export default function UserSettings() {
  const { user, updateUser } = useAuth();
  const { darkMode } = usePreferences();
  const [searchParams, setSearchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState(null);
  const [currentSubscription, setCurrentSubscription] = useState(null);
  const [showPasswordResetModal, setShowPasswordResetModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [passwordResetSent, setPasswordResetSent] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [activeTab, setActiveTab] = useState(() => {
    // Read tab from URL params, default to 'profile'
    return searchParams.get('tab') || 'profile';
  });
  const [showUpdatePaymentModal, setShowUpdatePaymentModal] = useState(false);

  // Username state
  const [username, setUsername] = useState('');
  const [newUsername, setNewUsername] = useState('');
  const [isUsernameAvailable, setIsUsernameAvailable] = useState(null);
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);
  const [isSavingUsername, setIsSavingUsername] = useState(false);
  const [usernameError, setUsernameError] = useState('');
  const checkUsernameTimeoutRef = useRef(null);

  const accountSettings = [
    { id: 'profile', label: 'Profile', icon: UserIcon },
    { id: 'subscription', label: 'Subscription', icon: CreditCardIcon },
    { id: 'payments', label: 'Payments', icon: BanknotesIcon },
    { id: 'customization', label: 'Customization', icon: PaintBrushIcon },
  ];

  const companySettings = [
    { id: 'company', label: 'Company Profile', icon: BuildingOfficeIcon },
    { id: 'currencies', label: 'Currencies', icon: CurrencyDollarIcon },
    { id: 'countries', label: 'Countries', icon: GlobeAltIcon },
    { id: 'email-templates', label: 'Email Templates', icon: EnvelopeIcon },
    { id: 'booking', label: 'Booking', icon: CalendarDaysIcon },
    { id: 'integrations', label: 'Integrations', icon: PuzzlePieceIcon },
    { id: 'advanced', label: 'Advanced', icon: Cog6ToothIcon },
  ];

  const allTabs = [...accountSettings, ...companySettings];

  useEffect(() => {
    fetchUserProfile();
    loadUsername();
  }, []);

  // Cleanup username check timeout on unmount
  useEffect(() => {
    return () => {
      if (checkUsernameTimeoutRef.current) {
        clearTimeout(checkUsernameTimeoutRef.current);
      }
    };
  }, []);

  // Handle OAuth callback indicators (Stripe connect success/error)
  useEffect(() => {
    const stripeConnected = searchParams.get('stripe_connected');
    const stripeError = searchParams.get('stripe_error');

    if (stripeConnected === 'true') {
      setSuccessMessage('Stripe account connected successfully!');
      // Clear the URL params
      const newParams = new URLSearchParams(searchParams);
      newParams.delete('stripe_connected');
      setSearchParams(newParams, { replace: true });
    } else if (stripeError) {
      const errorMessages = {
        denied: 'Stripe authorization was denied.',
        invalid: 'Invalid authorization parameters.',
        failed: 'Failed to complete Stripe connection. Please try again.',
      };
      setError(errorMessages[stripeError] || 'An error occurred with Stripe connection.');
      // Clear the URL params
      const newParams = new URLSearchParams(searchParams);
      newParams.delete('stripe_error');
      setSearchParams(newParams, { replace: true });
    }
  }, []);

  const fetchUserProfile = async () => {
    try {
      setLoading(true);
      const [userData, subscriptionData] = await Promise.all([
        authAPI.getCurrentUser(),
        planAPI.getCurrentSubscription()
      ]);

      console.log('Subscription data received:', subscriptionData);
      setProfile(userData);
      setCurrentSubscription(subscriptionData);
    } catch (err) {
      setError('Failed to load user profile');
      console.error('Error fetching profile:', err);
    } finally {
      setLoading(false);
    }
  };

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
  const checkUsernameAvailability = useCallback((value) => {
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
      } catch (error) {
        setIsUsernameAvailable(null);
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
    if (!isUsernameAvailable || newUsername === username) return;
    setIsSavingUsername(true);
    try {
      const data = await userAPI.updateUsername(newUsername);
      setUsername(data.username);
      updateUser({ username: data.username });
      setSuccessMessage('Username updated successfully');
    } catch (error) {
      setUsernameError(error.message || 'Failed to update username');
    }
    setIsSavingUsername(false);
  };

  const handlePasswordReset = async () => {
    if (!profile?.email) return;

    try {
      await authAPI.forgotPassword(profile.email);
      setPasswordResetSent(true);
      setTimeout(() => {
        setShowPasswordResetModal(false);
        setPasswordResetSent(false);
      }, 3000);
    } catch (err) {
      setError('Failed to send password reset email');
    }
  };

  const handleCancelSubscription = async () => {
    if (!currentSubscription) return;

    try {
      setSaving(true);
      await planAPI.cancelSubscription(cancelReason, false); // Cancel at period end
      setSuccessMessage('Subscription will be cancelled at the end of your billing period.');
      setShowCancelModal(false);
      setCancelReason('');
      // Refresh subscription data
      await fetchUserProfile();
    } catch (err) {
      setError('Failed to cancel subscription: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleReactivateSubscription = async () => {
    if (!currentSubscription) return;

    try {
      setSaving(true);
      await planAPI.reactivateSubscription();
      setSuccessMessage('Your subscription has been reactivated successfully.');
      // Refresh subscription data
      await fetchUserProfile();
    } catch (err) {
      setError('Failed to reactivate subscription: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleUpdatePaymentMethod = async (paymentMethodId) => {
    try {
      setSaving(true);
      await planAPI.updatePaymentMethod(paymentMethodId, true);
      setSuccessMessage('Your payment method has been updated successfully.');
      setShowUpdatePaymentModal(false);
      // Refresh subscription data
      await fetchUserProfile();
    } catch (err) {
      setError('Failed to update payment method: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className={`flex-1 flex items-center justify-center ${darkMode ? 'bg-zenible-dark-bg' : 'bg-gray-50'}`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-zenible-primary mx-auto"></div>
          <p className={`mt-4 ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-600'}`}>
            Loading settings...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex h-screen ${darkMode ? 'bg-zenible-dark-bg' : 'bg-gray-50'}`}>
      {/* Sidebar */}
      <NewSidebar />

      {/* Main Content */}
      <div className="flex-1 flex flex-col transition-all duration-300" style={{ marginLeft: 'var(--sidebar-width, 280px)' }}>
        {/* Settings Header & Tabs */}
        <div className={`border-b ${darkMode ? 'bg-zenible-dark-card border-zenible-dark-border' : 'bg-white border-neutral-200'}`}>
          <div className="px-6 pt-6 pb-0">
            <h1 className={`text-2xl font-semibold mb-6 ${darkMode ? 'text-zenible-dark-text' : 'text-zinc-950'}`}>
              Settings
            </h1>

            {/* Tabs Navigation */}
            <div className="space-y-2 -mb-px">
              {/* Account Settings Row */}
              <div className="flex gap-1">
                {accountSettings.map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;

                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                        isActive
                          ? 'border-zenible-primary text-zenible-primary'
                          : darkMode
                          ? 'border-transparent text-zenible-dark-text-secondary hover:text-zenible-dark-text hover:border-zenible-dark-border'
                          : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      {tab.label}
                    </button>
                  );
                })}
              </div>

              {/* Company Settings Row */}
              <div className="flex gap-1">
                {companySettings.map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;

                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                        isActive
                          ? 'border-zenible-primary text-zenible-primary'
                          : darkMode
                          ? 'border-transparent text-zenible-dark-text-secondary hover:text-zenible-dark-text hover:border-zenible-dark-border'
                          : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      {tab.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-auto bg-gray-50 dark:bg-zenible-dark-bg">
          <div className="max-w-4xl mx-auto p-6">
            {/* Notifications */}
            {error && (
          <div className={`p-4 rounded-lg mb-6 ${darkMode ? 'bg-red-900/20 text-red-400' : 'bg-red-50 text-red-700'}`}>
            {error}
          </div>
        )}
            {successMessage && (
              <div className={`p-4 rounded-lg mb-6 ${darkMode ? 'bg-green-900/20 text-green-400' : 'bg-green-50 text-green-700'}`}>
                {successMessage}
              </div>
            )}

            {/* Tab Content */}
        {activeTab === 'profile' ? (
          <div className="space-y-6">
            {/* Profile Information */}
            <div className={`rounded-xl shadow-sm border ${darkMode ? 'bg-zenible-dark-card border-zenible-dark-border' : 'bg-white border-neutral-200'}`}>
          <div className={`px-6 py-4 border-b ${darkMode ? 'border-zenible-dark-border' : 'border-neutral-200'}`}>
            <h2 className={`text-lg font-semibold ${darkMode ? 'text-zenible-dark-text' : 'text-zinc-950'}`}>
              Profile Information
            </h2>
          </div>

          <div className="p-6 space-y-4">
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
              <p className={`mt-1 text-sm ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'}`}>
                Email address cannot be changed for security reasons
              </p>
            </div>

            <div>
              <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-zenible-dark-text' : 'text-gray-700'}`}>
                Full Name
              </label>
              <input
                type="text"
                value={profile?.full_name || ''}
                disabled
                className={`w-full px-3 py-2 rounded-lg border ${
                  darkMode
                    ? 'bg-zenible-dark-bg border-zenible-dark-border text-zenible-dark-text-secondary'
                    : 'bg-gray-50 border-gray-300 text-gray-500'
                } cursor-not-allowed`}
                placeholder="Full name from Google account"
              />
              <p className={`mt-1 text-sm ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'}`}>
                Name is automatically synced from your Google account
              </p>
            </div>

            <div>
              <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-zenible-dark-text' : 'text-gray-700'}`}>
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
                    className={`w-full px-3 py-2 rounded-lg border ${
                      darkMode
                        ? 'bg-zenible-dark-bg border-zenible-dark-border text-zenible-dark-text'
                        : 'bg-white border-gray-300 text-gray-900'
                    } focus:ring-2 focus:ring-zenible-primary focus:border-transparent`}
                  />
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
                <button
                  onClick={handleSaveUsername}
                  disabled={!isUsernameAvailable || newUsername === username || isSavingUsername}
                  className="px-4 py-2 bg-zenible-primary text-white rounded-lg hover:bg-opacity-90 font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors h-fit"
                >
                  {isSavingUsername ? 'Saving...' : 'Save'}
                </button>
              </div>
              <p className={`mt-1 text-sm ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'}`}>
                Used for your public booking page URL
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-zenible-dark-text' : 'text-gray-700'}`}>
                  Account Status
                </label>
                <div className={`px-3 py-2 rounded-lg border ${
                  darkMode
                    ? 'bg-zenible-dark-bg border-zenible-dark-border'
                    : 'bg-gray-50 border-gray-200'
                }`}>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    profile?.status === 'verified'
                      ? 'bg-green-100 text-green-800'
                      : profile?.status === 'subscriber'
                      ? 'bg-purple-100 text-purple-800'
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {profile?.status || 'Unknown'}
                  </span>
                </div>
              </div>

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

            {profile?.avatar_url && (
              <div>
                <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-zenible-dark-text' : 'text-gray-700'}`}>
                  Profile Picture
                </label>
                <div className="flex items-center space-x-4">
                  <img
                    src={profile.avatar_url}
                    alt="Profile"
                    className="w-16 h-16 rounded-full border-2 border-gray-200 dark:border-zenible-dark-border"
                  />
                  <div>
                    <p className={`text-sm ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'}`}>
                      Profile picture from Google account
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Security Settings */}
        <div className={`rounded-xl shadow-sm border ${darkMode ? 'bg-zenible-dark-card border-zenible-dark-border' : 'bg-white border-neutral-200'}`}>
          <div className={`px-6 py-4 border-b ${darkMode ? 'border-zenible-dark-border' : 'border-neutral-200'}`}>
            <h2 className={`text-lg font-semibold ${darkMode ? 'text-zenible-dark-text' : 'text-zinc-950'}`}>
              Security
            </h2>
          </div>

          <div className="p-6 space-y-4">
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
        ) : activeTab === 'subscription' ? (
          <div className="space-y-6">
            {/* Subscription Management */}
            {currentSubscription && Object.keys(currentSubscription).length > 0 && (
          <div className={`rounded-xl shadow-sm border ${darkMode ? 'bg-zenible-dark-card border-zenible-dark-border' : 'bg-white border-neutral-200'}`}>
            <div className={`px-6 py-4 border-b ${darkMode ? 'border-zenible-dark-border' : 'border-neutral-200'}`}>
              <h2 className={`text-lg font-semibold ${darkMode ? 'text-zenible-dark-text' : 'text-zinc-950'}`}>
                Current Subscription
              </h2>
            </div>

            <div className="p-6 space-y-6">
              {/* Subscription Details */}
              <div className={`p-4 rounded-lg border ${
                darkMode
                  ? 'bg-zenible-dark-bg border-zenible-dark-border'
                  : 'bg-gray-50 border-gray-200'
              }`}>
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className={`text-lg font-semibold ${darkMode ? 'text-zenible-dark-text' : 'text-gray-900'}`}>
                      {currentSubscription.plan?.name || 'Current Plan'}
                    </h3>
                    <p className={`text-sm ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-600'}`}>
                      {currentSubscription.plan?.description || 'Subscription plan'}
                    </p>
                  </div>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    currentSubscription.cancel_at_period_end
                      ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
                      : currentSubscription.status === 'active'
                      ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                      : currentSubscription.status === 'canceled'
                      ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                      : 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
                  }`}>
                    {currentSubscription.cancel_at_period_end
                      ? 'Pending Cancellation'
                      : currentSubscription.status === 'active'
                      ? 'Active'
                      : currentSubscription.status}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className={`font-medium ${darkMode ? 'text-zenible-dark-text' : 'text-gray-700'}`}>
                      Price:
                    </span>
                    <span className={`ml-2 ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-600'}`}>
                      ${currentSubscription.plan?.monthly_price || 'N/A'}/month
                    </span>
                  </div>
                  <div>
                    <span className={`font-medium ${darkMode ? 'text-zenible-dark-text' : 'text-gray-700'}`}>
                      Started:
                    </span>
                    <span className={`ml-2 ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-600'}`}>
                      {currentSubscription.created_at ? formatDate(currentSubscription.created_at) : 'N/A'}
                    </span>
                  </div>
                  <div>
                    <span className={`font-medium ${darkMode ? 'text-zenible-dark-text' : 'text-gray-700'}`}>
                      {currentSubscription.cancel_at_period_end ? 'Subscription ends:' : 'Next billing:'}
                    </span>
                    <span className={`ml-2 ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-600'}`}>
                      {currentSubscription.current_period_end ? formatDate(currentSubscription.current_period_end) : 'N/A'}
                    </span>
                  </div>
                  <div>
                    <span className={`font-medium ${darkMode ? 'text-zenible-dark-text' : 'text-gray-700'}`}>
                      Subscription ID:
                    </span>
                    <span className={`ml-2 text-xs font-mono ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-600'}`}>
                      {currentSubscription.id}
                    </span>
                  </div>
                </div>
              </div>

              {/* Payment Method Management */}
              {(currentSubscription.status === 'active' || currentSubscription.status === 'trialing' || currentSubscription.status === 'past_due') && (
                <div className={`p-4 rounded-lg border ${
                  darkMode
                    ? 'bg-zenible-dark-bg border-zenible-dark-border'
                    : 'bg-purple-50 border-purple-200'
                }`}>
                  <h4 className={`font-medium mb-2 ${darkMode ? 'text-zenible-dark-text' : 'text-purple-800'}`}>
                    Payment Method
                  </h4>
                  <p className={`text-sm mb-4 ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-purple-600'}`}>
                    Click here to update your payment card details.
                  </p>
                  <button
                    onClick={() => setShowUpdatePaymentModal(true)}
                    className={`px-4 py-2 border rounded-lg font-medium ${
                      darkMode
                        ? 'border-zenible-dark-border text-zenible-dark-text hover:bg-zenible-dark-bg'
                        : 'border-purple-300 text-purple-700 hover:bg-purple-100'
                    }`}
                  >
                    Update Payment Method
                  </button>
                </div>
              )}

              {/* Pending Cancellation Notice */}
              {currentSubscription.cancel_at_period_end && (
                <div className={`p-4 rounded-lg border border-yellow-200 ${
                  darkMode ? 'bg-yellow-900/20' : 'bg-yellow-50'
                }`}>
                  <h4 className={`font-medium mb-2 ${darkMode ? 'text-yellow-400' : 'text-yellow-800'}`}>
                    Subscription Scheduled for Cancellation
                  </h4>
                  <p className={`text-sm ${darkMode ? 'text-yellow-300' : 'text-yellow-600'}`}>
                    Your subscription will end on {currentSubscription.current_period_end ? formatDate(currentSubscription.current_period_end) : 'N/A'}.
                    You'll continue to have access to all features until then.
                  </p>
                  {currentSubscription.cancel_at && (
                    <p className={`text-sm mt-2 ${darkMode ? 'text-yellow-300' : 'text-yellow-600'}`}>
                      Cancellation requested on {formatDate(currentSubscription.cancel_at)}
                    </p>
                  )}
                  <button
                    onClick={handleReactivateSubscription}
                    disabled={saving}
                    className={`mt-4 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed ${
                      saving ? 'cursor-wait' : ''
                    }`}
                  >
                    {saving ? 'Processing...' : 'Reactivate Subscription'}
                  </button>
                </div>
              )}

              {/* Actions */}
              {currentSubscription.status === 'active' && !currentSubscription.cancel_at_period_end && (
                <div className={`p-4 rounded-lg border border-red-200 ${
                  darkMode ? 'bg-red-900/20' : 'bg-red-50'
                }`}>
                  <h4 className={`font-medium mb-2 ${darkMode ? 'text-red-400' : 'text-red-800'}`}>
                    Cancel Subscription
                  </h4>
                  <p className={`text-sm mb-4 ${darkMode ? 'text-red-300' : 'text-red-600'}`}>
                    If you cancel your subscription, you'll continue to have access to all features until the end of your current billing period.
                  </p>
                  <button
                    onClick={() => setShowCancelModal(true)}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium"
                  >
                    Cancel Subscription
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* No Subscription Message */}
        {(!currentSubscription || Object.keys(currentSubscription).length === 0) && !loading && (
          <div className={`rounded-xl shadow-sm border ${darkMode ? 'bg-zenible-dark-card border-zenible-dark-border' : 'bg-white border-neutral-200'}`}>
            <div className={`px-6 py-4 border-b ${darkMode ? 'border-zenible-dark-border' : 'border-neutral-200'}`}>
              <h2 className={`text-lg font-semibold ${darkMode ? 'text-zenible-dark-text' : 'text-zinc-950'}`}>
                Subscription
              </h2>
            </div>

            <div className="p-6 text-center">
              <div className={`p-8 rounded-lg ${darkMode ? 'bg-zenible-dark-bg' : 'bg-gray-50'}`}>
                <svg className={`w-12 h-12 mx-auto mb-4 ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 0v1m0 0V9a2 2 0 11-2 0V8.001" />
                </svg>
                <h3 className={`text-lg font-medium mb-2 ${darkMode ? 'text-zenible-dark-text' : 'text-gray-900'}`}>
                  No Active Subscription
                </h3>
                <p className={`text-sm mb-4 ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-600'}`}>
                  You don't currently have an active subscription. Upgrade to unlock premium features.
                </p>
                <a
                  href="/pricing"
                  className="inline-flex items-center px-4 py-2 bg-zenible-primary text-white rounded-lg hover:bg-opacity-90 font-medium"
                >
                  View Plans
                </a>
              </div>
            </div>
          </div>
        )}
          </div>
        ) : activeTab === 'payments' ? (
          <PaymentHistory />
        ) : activeTab === 'customization' ? (
          <div className="space-y-6">
            <div className={`rounded-xl shadow-sm border ${darkMode ? 'bg-zenible-dark-card border-zenible-dark-border' : 'bg-white border-neutral-200'}`}>
              <div className={`px-6 py-4 border-b ${darkMode ? 'border-zenible-dark-border' : 'border-neutral-200'}`}>
                <h2 className={`text-lg font-semibold ${darkMode ? 'text-zenible-dark-text' : 'text-zinc-950'}`}>
                  Customization Preferences
                </h2>
                <p className={`text-sm mt-1 ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'}`}>
                  Help Zenible to personalize all content that it creates for you, ensuring that
                  feedback and guidance are always relevant to your experience and background.
                </p>
                <p className={`text-sm mt-2 ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'}`}>
                  Answer questions with as much detail as possible, leaving them empty if not relevant to
                  your situation.
                </p>
              </div>

              <div className="p-6">
                <CustomizationQuestions
                  mode="settings"
                  showProgress={false}
                  autoSave={false}
                />
              </div>
            </div>
          </div>
        ) : activeTab === 'company' ? (
          <ProfileTab />
        ) : activeTab === 'currencies' ? (
          <CurrenciesTab />
        ) : activeTab === 'countries' ? (
          <CountriesTab />
        ) : activeTab === 'email-templates' ? (
          <EmailTemplates />
        ) : activeTab === 'booking' ? (
          <BookingTab />
        ) : activeTab === 'integrations' ? (
          <IntegrationsTab />
            ) : activeTab === 'advanced' ? (
              <AdvancedTab />
            ) : null}
          </div>
        </div>

        {/* Cancel Subscription Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className={`w-full max-w-md mx-4 rounded-xl ${darkMode ? 'bg-zenible-dark-card' : 'bg-white'}`}>
            <div className={`px-6 py-4 border-b ${darkMode ? 'border-zenible-dark-border' : 'border-neutral-200'}`}>
              <h3 className={`text-lg font-semibold ${darkMode ? 'text-zenible-dark-text' : 'text-zinc-950'}`}>
                Cancel Subscription
              </h3>
            </div>

            <div className="p-6">
              <div className="mb-6">
                <p className={`mb-4 ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-600'}`}>
                  We're sorry to see you go! Your subscription will remain active until the end of your current billing period.
                </p>
                <div>
                  <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-zenible-dark-text' : 'text-gray-700'}`}>
                    Help us improve - why are you cancelling? (Optional)
                  </label>
                  <textarea
                    value={cancelReason}
                    onChange={(e) => setCancelReason(e.target.value)}
                    placeholder="Tell us why you're cancelling..."
                    rows="3"
                    className={`w-full px-3 py-2 border rounded-lg ${
                      darkMode
                        ? 'bg-zenible-dark-bg border-zenible-dark-border text-zenible-dark-text'
                        : 'bg-white border-gray-300 text-gray-900'
                    } placeholder-gray-500`}
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowCancelModal(false)}
                  disabled={saving}
                  className={`flex-1 px-4 py-2 border rounded-lg font-medium ${
                    darkMode
                      ? 'border-zenible-dark-border text-zenible-dark-text hover:bg-zenible-dark-bg'
                      : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                  } disabled:opacity-50`}
                >
                  Keep Subscription
                </button>
                <button
                  onClick={handleCancelSubscription}
                  disabled={saving}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {saving ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Cancelling...
                    </>
                  ) : (
                    'Cancel Subscription'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Password Reset Modal */}
      {showPasswordResetModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className={`w-full max-w-md mx-4 rounded-xl ${darkMode ? 'bg-zenible-dark-card' : 'bg-white'}`}>
            <div className={`px-6 py-4 border-b ${darkMode ? 'border-zenible-dark-border' : 'border-neutral-200'}`}>
              <h3 className={`text-lg font-semibold ${darkMode ? 'text-zenible-dark-text' : 'text-zinc-950'}`}>
                Reset Password
              </h3>
            </div>

            <div className="p-6">
              {!passwordResetSent ? (
                <>
                  <p className={`mb-4 ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-600'}`}>
                    We'll send a password reset link to:
                  </p>
                  <p className={`font-medium mb-6 ${darkMode ? 'text-zenible-dark-text' : 'text-gray-900'}`}>
                    {profile?.email}
                  </p>
                  <div className="flex gap-2 justify-end">
                    <button
                      onClick={() => setShowPasswordResetModal(false)}
                      className={`px-4 py-2 border rounded-lg ${
                        darkMode
                          ? 'border-zenible-dark-border text-zenible-dark-text hover:bg-zenible-dark-bg'
                          : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handlePasswordReset}
                      className="px-4 py-2 bg-zenible-primary text-white rounded-lg hover:bg-opacity-90"
                    >
                      Send Reset Link
                    </button>
                  </div>
                </>
              ) : (
                <div className="text-center">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <p className={`text-lg font-medium mb-2 ${darkMode ? 'text-zenible-dark-text' : 'text-gray-900'}`}>
                    Reset Link Sent!
                  </p>
                  <p className={`text-sm ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-600'}`}>
                    Check your email for the password reset link.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Update Payment Method Modal */}
      <UpdatePaymentModal
        isOpen={showUpdatePaymentModal}
        onClose={() => setShowUpdatePaymentModal(false)}
        onSuccess={handleUpdatePaymentMethod}
        onError={(error) => setError(error.message)}
      />
      </div>
    </div>
  );
}