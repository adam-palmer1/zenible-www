import React, { useState, useEffect } from 'react';
import adminAPI from '../../services/adminAPI';
import { useAuth } from '../../contexts/AuthContext';
import { usePreferences } from '../../contexts/PreferencesContext';

interface UserProfile {
  email: string;
  first_name: string;
  last_name: string;
  profile_image_url?: string;
  status?: string;
  role?: string;
  created_at?: string;
  subscriptions?: Array<{
    plan_name?: string;
    status: string;
    current_period_end?: string;
  }>;
}

export default function AdminSettings() {
  const { updateUser } = useAuth();
  const { darkMode } = usePreferences();
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    profile_image_url: ''
  });
  const [showPasswordResetModal, setShowPasswordResetModal] = useState<boolean>(false);
  const [passwordResetSent, setPasswordResetSent] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    try {
      setLoading(true);
      const data = await adminAPI.getUserProfile() as UserProfile;
      setProfile(data);
      setFormData({
        first_name: data.first_name || '',
        last_name: data.last_name || '',
        profile_image_url: data.profile_image_url || ''
      });
    } catch (_err) {
      setError('Failed to load user profile');
      console.error('Error fetching profile:', _err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccessMessage(null);

    try {
      await adminAPI.updateUserProfile(formData);
      setSuccessMessage('Profile updated successfully');
      // Update the user context immediately
      updateUser({ first_name: formData.first_name, last_name: formData.last_name });
      // Refresh profile to get updated data
      await fetchUserProfile();
    } catch (err) {
      setError((err as Error).message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordReset = async () => {
    if (!profile?.email) return;

    try {
      await adminAPI.forgotPassword(profile.email);
      setPasswordResetSent(true);
      setTimeout(() => {
        setShowPasswordResetModal(false);
        setPasswordResetSent(false);
      }, 3000);
    } catch (_err) {
      setError('Failed to send password reset email');
    }
  };

  const handleResendVerification = async () => {
    try {
      await adminAPI.resendVerificationEmail();
      setSuccessMessage('Verification email sent successfully');
    } catch (_err) {
      setError('Failed to send verification email');
    }
  };

  const formatDate = (dateString: string): string => {
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
    <div className={`flex-1 overflow-auto ${darkMode ? 'bg-zenible-dark-bg' : 'bg-gray-50'}`}>
      <div className={`border-b px-6 py-4 ${darkMode ? 'border-zenible-dark-border' : 'border-neutral-200'}`}>
        <h1 className={`text-2xl font-semibold ${darkMode ? 'text-zenible-dark-text' : 'text-zinc-950'}`}>
          Account Settings
        </h1>
        <p className={`text-sm mt-1 ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-zinc-500'}`}>
          Manage your account settings and preferences
        </p>
      </div>

      <div className="max-w-4xl mx-auto p-6 space-y-6">
        {/* Notifications */}
        {error && (
          <div className={`p-4 rounded-lg ${darkMode ? 'bg-red-900/20 text-red-400' : 'bg-red-50 text-red-700'}`}>
            {error}
          </div>
        )}
        {successMessage && (
          <div className={`p-4 rounded-lg ${darkMode ? 'bg-green-900/20 text-green-400' : 'bg-green-50 text-green-700'}`}>
            {successMessage}
          </div>
        )}

        {/* Profile Information */}
        <div className={`rounded-xl shadow-sm border ${darkMode ? 'bg-zenible-dark-card border-zenible-dark-border' : 'bg-white border-neutral-200'}`}>
          <div className={`px-6 py-4 border-b ${darkMode ? 'border-zenible-dark-border' : 'border-neutral-200'}`}>
            <h2 className={`text-lg font-semibold ${darkMode ? 'text-zenible-dark-text' : 'text-zinc-950'}`}>
              Profile Information
            </h2>
          </div>

          <form onSubmit={handleUpdateProfile} className="p-6 space-y-4">
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

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-zenible-dark-text' : 'text-gray-700'}`}>
                  First Name
                </label>
                <input
                  type="text"
                  value={formData.first_name}
                  onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                  className={`w-full px-3 py-2 rounded-lg border ${
                    darkMode
                      ? 'bg-zenible-dark-bg border-zenible-dark-border text-zenible-dark-text'
                      : 'bg-white border-gray-300 text-gray-900'
                  }`}
                  placeholder="Enter first name"
                />
              </div>
              <div>
                <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-zenible-dark-text' : 'text-gray-700'}`}>
                  Last Name
                </label>
                <input
                  type="text"
                  value={formData.last_name}
                  onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                  className={`w-full px-3 py-2 rounded-lg border ${
                    darkMode
                      ? 'bg-zenible-dark-bg border-zenible-dark-border text-zenible-dark-text'
                      : 'bg-white border-gray-300 text-gray-900'
                  }`}
                  placeholder="Enter last name"
                />
              </div>
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
                  {profile?.status === 'unverified' && (
                    <button
                      type="button"
                      onClick={handleResendVerification}
                      className="ml-2 text-sm text-zenible-primary hover:text-opacity-80"
                    >
                      Resend verification
                    </button>
                  )}
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

            <div className="pt-4">
              <button
                type="submit"
                disabled={saving}
                className={`px-4 py-2 bg-zenible-primary text-white rounded-lg hover:bg-opacity-90 disabled:opacity-50 ${
                  saving ? 'cursor-not-allowed' : ''
                }`}
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
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

        {/* Subscription Information */}
        {profile?.subscriptions && profile.subscriptions.length > 0 && (
          <div className={`rounded-xl shadow-sm border ${darkMode ? 'bg-zenible-dark-card border-zenible-dark-border' : 'bg-white border-neutral-200'}`}>
            <div className={`px-6 py-4 border-b ${darkMode ? 'border-zenible-dark-border' : 'border-neutral-200'}`}>
              <h2 className={`text-lg font-semibold ${darkMode ? 'text-zenible-dark-text' : 'text-zinc-950'}`}>
                Current Subscription
              </h2>
            </div>

            <div className="p-6">
              {profile.subscriptions.map((sub, index) => (
                <div key={index} className="space-y-2">
                  <p className={`font-medium ${darkMode ? 'text-zenible-dark-text' : 'text-gray-900'}`}>
                    {sub.plan_name || 'Unknown Plan'}
                  </p>
                  <p className={`text-sm ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-600'}`}>
                    Status: <span className="font-medium">{sub.status}</span>
                  </p>
                  {sub.current_period_end && (
                    <p className={`text-sm ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-600'}`}>
                      Next billing date: {formatDate(sub.current_period_end)}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

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
    </div>
  );
}