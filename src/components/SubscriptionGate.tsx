import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import PricingNew from './pricing/PricingNew';

interface SubscriptionGateProps {
  children: React.ReactNode;
}

export default function SubscriptionGate({ children }: SubscriptionGateProps) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/signin');
  };

  // Admins always bypass the gate
  if (user?.role === 'ADMIN' || user?.role === 'SUPERUSER') {
    return <>{children}</>;
  }

  // User has an active plan — allow through
  if (user?.current_plan_id) {
    return <>{children}</>;
  }

  // Company member whose billing owner has no plan
  if (user?.company_id && !user?.is_billing_owner) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-white">
        <div className="max-w-md mx-auto text-center px-6">
          <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-blue-50 flex items-center justify-center">
            <svg className="w-8 h-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-3">
            Subscription Required
          </h2>
          <p className="text-gray-600">
            Your company administrator needs to subscribe to a plan. Please contact your admin to get access.
          </p>
          <button
            onClick={handleLogout}
            className="mt-6 px-4 py-2 text-sm font-medium text-zinc-600 hover:text-zinc-900 bg-white hover:bg-gray-100 border border-gray-200 rounded-lg transition-colors"
          >
            Log out
          </button>
        </div>
      </div>
    );
  }

  // No plan — show full-screen pricing overlay
  const preselectedPlan = localStorage.getItem('zenible_preselected_plan');

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-white">
      <button
        onClick={handleLogout}
        className="fixed top-4 right-4 z-[60] px-4 py-2 text-sm font-medium text-zinc-600 hover:text-zinc-900 bg-white hover:bg-gray-100 border border-gray-200 rounded-lg transition-colors"
      >
        Log out
      </button>
      <PricingNew isGateMode preselectedPlanId={preselectedPlan || undefined} />
    </div>
  );
}
