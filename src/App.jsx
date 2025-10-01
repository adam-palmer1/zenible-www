import { createBrowserRouter, RouterProvider, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { PreferencesProvider } from './contexts/PreferencesContext';
import { WebSocketProvider } from './contexts/WebSocketContext';

// Auth pages
import SignIn from './pages/signin/SignIn';
import GoogleCallback from './components/GoogleCallback';
import UserSettings from './components/UserSettings';

// Dashboard pages
import AdminPanel from './components/AdminPanel';
import ProtectedDashboard from './components/ProtectedDashboard';
import ProtectedRoute from './components/ProtectedRoute';
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
import ConversationManagement from './components/admin/ConversationManagement';
import OnboardingQuestions from './components/admin/OnboardingQuestions';

// Root layout component with WebSocket provider
function RootLayout() {
  return (
    <WebSocketProvider>
      <Outlet />
    </WebSocketProvider>
  );
}

const router = createBrowserRouter([
  {
    path: '/',
    element: <RootLayout />,
    children: [
      {
        path: 'signin',
        element: <SignIn />
      },
      {
        path: 'auth/google/callback',
        element: <GoogleCallback />
      },
      {
        path: 'login',
        element: <Navigate to="/signin" replace />
      },
      {
        path: 'dashboard',
        element: <ProtectedDashboard />
      },
      {
        path: 'zenible-dashboard',
        element: <Navigate to="/dashboard" replace />
      },
      {
        path: 'proposal-wizard',
        element: (
          <ProtectedRoute>
            <ProposalWizard />
          </ProtectedRoute>
        )
      },
      {
        path: 'plans',
        element: <Plans />
      },
      {
        path: 'pricing',
        element: <Pricing />
      },
      {
        path: 'settings',
        element: (
          <ProtectedRoute>
            <UserSettings />
          </ProtectedRoute>
        )
      },
      {
        path: 'admin',
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
            path: 'conversations',
            element: <ConversationManagement />
          },
          {
            path: 'features',
            element: <FeatureManagement />
          },
          {
            path: 'onboarding-questions',
            element: <OnboardingQuestions />
          },
          {
            path: 'settings',
            element: <AdminSettings />
          }
        ]
      },
      {
        index: true,
        element: <Navigate to="/dashboard" replace />
      }
    ]
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