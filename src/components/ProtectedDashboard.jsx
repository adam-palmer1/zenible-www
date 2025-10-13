import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { usePreferences } from '../contexts/PreferencesContext';
import { useNavigate } from 'react-router-dom';
import NewZenibleDashboard from './zenible-dashboard/NewZenibleDashboard';
import OnboardingModal from './OnboardingModal';

export default function ProtectedDashboard() {
  const { user, loading } = useAuth();
  const { getPreference, loading: prefsLoading } = usePreferences();
  const navigate = useNavigate();
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      // Redirect to sign in if not authenticated
      navigate('/signin?redirect=/dashboard');
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    // Check if onboarding should be shown
    if (!loading && !prefsLoading && user) {
      const onboardingStatus = getPreference('onboarding_status');
      const reminderDate = getPreference('onboarding_reminder_date');

      console.log('Onboarding check:', {
        status: onboardingStatus,
        reminderDate: reminderDate,
        currentTime: new Date().toISOString()
      });

      if (!onboardingStatus || onboardingStatus === null) {
        // Never seen onboarding before
        console.log('Showing onboarding: No status found');
        setShowOnboarding(true);
      } else if (onboardingStatus === 'deferred' && reminderDate) {
        // Check if it's time to show the reminder
        const now = new Date();
        const reminder = new Date(reminderDate);
        if (now >= reminder) {
          console.log('Showing onboarding: Reminder time reached');
          setShowOnboarding(true);
        } else {
          console.log('Not showing: Still within deferral period');
          setShowOnboarding(false);
        }
      } else {
        // If status is 'complete' or 'ignored', don't show modal
        console.log('Not showing: Status is', onboardingStatus);
        setShowOnboarding(false);
      }
    }
  }, [user, loading, prefsLoading, getPreference]);

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-50 dark:bg-[#0c111d] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#8e51ff] dark:border-[#a684ff] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-lg font-inter font-medium text-zinc-950 dark:text-[#ededf0]">
            Loading dashboard...
          </p>
        </div>
      </div>
    );
  }

  // Show nothing while redirecting unauthenticated users
  if (!user) {
    return null;
  }

  // User is authenticated, show the dashboard
  return (
    <>
      <NewZenibleDashboard />
      <OnboardingModal
        isOpen={showOnboarding}
        onClose={() => setShowOnboarding(false)}
      />
    </>
  );
}