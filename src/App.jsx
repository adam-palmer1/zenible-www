import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { PreferencesProvider } from './contexts/PreferencesContext';

// Auth pages
import SignIn from './pages/signin/SignIn';

// Dashboard pages
import AdminPanel from './components/AdminPanel';
import ZenibleDashboard from './components/zenible-dashboard/ZenibleDashboard';
import ProposalWizard from './components/proposal-wizard/ProposalWizard';
import Plans from './components/Plans';
import Pricing from './components/pricing/PricingNew';

// Admin pages
import AdminLayout from './components/admin/AdminLayout';
import AdminDashboard from './components/admin/AdminDashboard';
import UserManagement from './components/admin/UserManagement';
import PlanManagement from './components/admin/PlanManagement';
import SubscriptionManagement from './components/admin/SubscriptionManagement';
import PaymentTracking from './components/admin/PaymentTracking';
import AuditLogs from './components/admin/AuditLogs';
import AICharacterManagement from './components/admin/AICharacterManagement';
import ThreadManagement from './components/admin/ThreadManagement';
import FeatureManagement from './components/admin/FeatureManagement';
import AdminSettings from './components/admin/AdminSettings';
import AIModelsManagement from './components/admin/AIModelsManagement';

const router = createBrowserRouter([
  {
    path: '/signin',
    element: <SignIn />
  },
  {
    path: '/login',
    element: <Navigate to="/signin" replace />
  },
  {
    path: '/zenible-dashboard',
    element: <ZenibleDashboard />
  },
  {
    path: '/proposal-wizard',
    element: <ProposalWizard />
  },
  {
    path: '/plans',
    element: <Plans />
  },
  {
    path: '/pricing',
    element: <Pricing />
  },
  {
    path: '/admin',
    element: <AdminLayout />,
    children: [
      {
        index: true,
        element: <AdminDashboard />
      },
      {
        path: 'users',
        element: <UserManagement />
      },
      {
        path: 'plans',
        element: <PlanManagement />
      },
      {
        path: 'subscriptions',
        element: <SubscriptionManagement />
      },
      {
        path: 'payments',
        element: <PaymentTracking />
      },
      {
        path: 'audit-logs',
        element: <AuditLogs />
      },
      {
        path: 'ai-characters',
        element: <AICharacterManagement />
      },
      {
        path: 'ai-models',
        element: <AIModelsManagement />
      },
      {
        path: 'threads',
        element: <ThreadManagement />
      },
      {
        path: 'features',
        element: <FeatureManagement />
      },
      {
        path: 'settings',
        element: <AdminSettings />
      }
    ]
  },
  {
    path: '/',
    element: <Navigate to="/zenible-dashboard" replace />
  }
]);

function App() {
  return (
    <AuthProvider>
      <PreferencesProvider>
        <RouterProvider router={router} />
      </PreferencesProvider>
    </AuthProvider>
  );
}

export default App;