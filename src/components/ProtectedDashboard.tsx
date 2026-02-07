import { useEffect, useState, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { usePreferences } from '../contexts/PreferencesContext';
import { useNavigate } from 'react-router-dom';
import NewZenibleDashboard from './zenible-dashboard/NewZenibleDashboard';
import FirstSignInModal from './FirstSignInModal';
import { InvoiceProvider } from '../contexts/InvoiceContext';
import { ExpenseProvider } from '../contexts/ExpenseContext';
import { PaymentsProvider } from '../contexts/PaymentsContext';

export default function ProtectedDashboard() {
  const { user, loading } = useAuth() as any;
  const { preferences, loading: prefsLoading } = usePreferences() as any;
  const navigate = useNavigate();
  const [showFirstSignIn, setShowFirstSignIn] = useState(false);
  const hasCheckedOnboarding = useRef(false);

  useEffect(() => {
    if (!loading && !user) {
      // Redirect to sign in if not authenticated
      navigate('/signin?redirect=/dashboard');
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    // Check if first sign-in modal should be shown - only once when loading completes
    if (!loading && !prefsLoading && user && !hasCheckedOnboarding.current) {
      hasCheckedOnboarding.current = true;

      const onboardingStatus = preferences?.onboarding_status;
      const reminderDate = preferences?.onboarding_reminder_date;

      // Only hide modal for explicit 'complete' or 'ignored' status
      if (onboardingStatus === 'complete' || onboardingStatus === 'ignored') {
        setShowFirstSignIn(false);
      } else if (onboardingStatus === 'deferred' && reminderDate) {
        // Check if it's time to show the reminder
        const now = new Date();
        const reminder = new Date(reminderDate);
        setShowFirstSignIn(now >= reminder);
      } else {
        // For null, undefined, or any other value - show the modal
        setShowFirstSignIn(true);
      }
    }
  }, [user, loading, prefsLoading, preferences]);

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
    <InvoiceProvider>
      <ExpenseProvider>
        <PaymentsProvider>
          <NewZenibleDashboard />
          <FirstSignInModal
            isOpen={showFirstSignIn}
            onClose={() => setShowFirstSignIn(false)}
          />
        </PaymentsProvider>
      </ExpenseProvider>
    </InvoiceProvider>
  );
}
