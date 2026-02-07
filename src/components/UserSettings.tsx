import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { usePreferences } from '../contexts/PreferencesContext';
import { authAPI } from '../utils/auth';
import planAPI from '../services/planAPI';
import companyUsersAPI from '../services/api/crm/companyUsers';
import UpdatePaymentModal from './UpdatePaymentModal';
import SettingsSidebar from './SettingsSidebar';
import ProfileSettingsTab from './user-settings/ProfileSettingsTab';
import SubscriptionSettingsTab from './user-settings/SubscriptionSettingsTab';
import CustomizationSettingsTab from './user-settings/CustomizationSettingsTab';
import CompanySettingsTab from './user-settings/CompanySettingsTab';
import LocalizationSettingsTab from './user-settings/LocalizationSettingsTab';
import EmailTemplatesSettingsTab from './user-settings/EmailTemplatesSettingsTab';
import BookingSettingsTab from './user-settings/BookingSettingsTab';
import IntegrationsSettingsTab from './user-settings/IntegrationsSettingsTab';
import UsersSettingsTab from './user-settings/UsersSettingsTab';
import AdvancedSettingsTab from './user-settings/AdvancedSettingsTab';
import CancelSubscriptionModal from './user-settings/CancelSubscriptionModal';
import PasswordResetModal from './user-settings/PasswordResetModal';

export default function UserSettings() {
  const { user } = useAuth();
  const { darkMode } = usePreferences();
  const [searchParams, setSearchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [currentSubscription, setCurrentSubscription] = useState<any>(null);
  const [showPasswordResetModal, setShowPasswordResetModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [passwordResetSent, setPasswordResetSent] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState(() => {
    return searchParams.get('tab') || 'profile';
  });
  const [showUpdatePaymentModal, setShowUpdatePaymentModal] = useState(false);

  // Company admin state
  const [isCompanyAdmin, setIsCompanyAdmin] = useState(false);

  useEffect(() => {
    fetchUserProfile();
  }, []);

  // Check if user is a company admin
  useEffect(() => {
    const fetchCompanyPermissions = async () => {
      try {
        const permissions = await companyUsersAPI.getMyPermissions() as { is_company_admin?: boolean; [key: string]: unknown };
        setIsCompanyAdmin(permissions?.is_company_admin || false);
      } catch (_error) {
        setIsCompanyAdmin(false);
      }
    };
    if (user) {
      fetchCompanyPermissions();
    }
  }, [user]);

  // Handle OAuth callback indicators (Stripe connect success/error)
  useEffect(() => {
    const stripeConnected = searchParams.get('stripe_connected');
    const stripeError = searchParams.get('stripe_error');

    if (stripeConnected === 'true') {
      setSuccessMessage('Stripe account connected successfully!');
      const newParams = new URLSearchParams(searchParams);
      newParams.delete('stripe_connected');
      setSearchParams(newParams, { replace: true });
    } else if (stripeError) {
      const errorMessages = {
        denied: 'Stripe authorization was denied.',
        invalid: 'Invalid authorization parameters.',
        failed: 'Failed to complete Stripe connection. Please try again.',
      };
      setError(errorMessages[stripeError as keyof typeof errorMessages] || 'An error occurred with Stripe connection.');
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

      setProfile(userData);
      setCurrentSubscription(subscriptionData);
    } catch (err) {
      setError('Failed to load user profile');
      console.error('Error fetching profile:', err);
    } finally {
      setLoading(false);
    }
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
    } catch (_err) {
      setError('Failed to send password reset email');
    }
  };

  const handleCancelSubscription = async () => {
    if (!currentSubscription) return;

    try {
      setSaving(true);
      await planAPI.cancelSubscription(cancelReason, false);
      setSuccessMessage('Subscription will be cancelled at the end of your billing period.');
      setShowCancelModal(false);
      setCancelReason('');
      await fetchUserProfile();
    } catch (err: unknown) {
      setError('Failed to cancel subscription: ' + (err as Error).message);
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
      await fetchUserProfile();
    } catch (err: unknown) {
      setError('Failed to reactivate subscription: ' + (err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const handleUpdatePaymentMethod = async (paymentMethodId: string) => {
    try {
      setSaving(true);
      await planAPI.updatePaymentMethod(paymentMethodId, true);
      setSuccessMessage('Your payment method has been updated successfully.');
      setShowUpdatePaymentModal(false);
      await fetchUserProfile();
    } catch (err: unknown) {
      setError('Failed to update payment method: ' + (err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className={`flex h-screen ${darkMode ? 'bg-zenible-dark-bg' : 'bg-gray-50'}`}>
        <SettingsSidebar activeTab={activeTab} setActiveTab={setActiveTab} />
        <div className="flex-1 flex items-center justify-center ml-[280px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-zenible-primary mx-auto"></div>
            <p className={`mt-4 ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-600'}`}>
              Loading settings...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex h-screen ${darkMode ? 'bg-zenible-dark-bg' : 'bg-gray-50'}`}>
      {/* Settings Sidebar */}
      <SettingsSidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Main Content */}
      <div className="flex-1 flex flex-col ml-[280px]">
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
          <ProfileSettingsTab
            profile={profile}
            setProfile={setProfile}
            setError={setError}
            setSuccessMessage={setSuccessMessage}
            formatDate={formatDate}
            showPasswordResetModal={showPasswordResetModal}
            setShowPasswordResetModal={setShowPasswordResetModal}
          />
        ) : activeTab === 'subscription' ? (
          <SubscriptionSettingsTab
            currentSubscription={currentSubscription}
            saving={saving}
            setSaving={setSaving}
            setError={setError}
            setSuccessMessage={setSuccessMessage}
            setShowUpdatePaymentModal={setShowUpdatePaymentModal}
            setShowCancelModal={setShowCancelModal}
            handleReactivateSubscription={handleReactivateSubscription}
            formatDate={formatDate}
            fetchUserProfile={fetchUserProfile}
          />
        ) : activeTab === 'customization' ? (
          <CustomizationSettingsTab />
        ) : activeTab === 'company' ? (
          <CompanySettingsTab />
        ) : activeTab === 'localization' ? (
          <LocalizationSettingsTab />
        ) : activeTab === 'email-templates' ? (
          <EmailTemplatesSettingsTab />
        ) : activeTab === 'booking' ? (
          <BookingSettingsTab />
        ) : activeTab === 'integrations' ? (
          <IntegrationsSettingsTab />
        ) : activeTab === 'users' ? (
          <UsersSettingsTab isCompanyAdmin={isCompanyAdmin} />
        ) : activeTab === 'advanced' ? (
          <AdvancedSettingsTab />
        ) : null}
          </div>
        </div>

        {/* Cancel Subscription Modal */}
      {showCancelModal && (
        <CancelSubscriptionModal
          saving={saving}
          cancelReason={cancelReason}
          setCancelReason={setCancelReason}
          onClose={() => setShowCancelModal(false)}
          onConfirm={handleCancelSubscription}
        />
      )}

      {/* Password Reset Modal */}
      {showPasswordResetModal && (
        <PasswordResetModal
          email={profile?.email || ''}
          passwordResetSent={passwordResetSent}
          onClose={() => setShowPasswordResetModal(false)}
          onConfirm={handlePasswordReset}
        />
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
