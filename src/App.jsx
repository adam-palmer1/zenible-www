import { createBrowserRouter, RouterProvider, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { PreferencesProvider } from './contexts/PreferencesContext';
import { WebSocketProvider } from './contexts/WebSocketContext';

// Auth pages
import SignIn from './pages/signin/SignIn';
import GoogleCallback from './components/GoogleCallback';
import UserSettings from './components/UserSettings';

// Dashboard pages
import ProtectedDashboard from './components/ProtectedDashboard';
import ProtectedRoute from './components/ProtectedRoute';
import ProposalWizard from './components/proposal-wizard/ProposalWizard';
import ViralPostGenerator from './components/viral-post-generator/ViralPostGenerator';
import Boardroom from './components/boardroom/Boardroom';
import LiveQA from './components/live-qa/LiveQA';
import KnowledgeQuizzes from './components/quizzes/KnowledgeQuizzes';
import QuizAttemptPage from './components/quizzes/QuizAttemptPage';
import QuizResultsPage from './components/quizzes/QuizResultsPage';
import QuizHistoryPage from './components/quizzes/QuizHistoryPage';
import CoursesComponent from './components/courses/CoursesComponent';
import CourseDiscovery from './components/courses/CourseDiscovery';
import LearningDashboard from './components/courses/LearningDashboard';
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
import AIToolsManager from './components/admin/AIToolsManager';
import TipsManagement from './components/admin/TipsManagement';
import EventsManagement from './components/admin/EventsManagement';
import HostsManagement from './components/admin/HostsManagement';
import QuizzesManagement from './components/admin/QuizzesManagement';
import QuizTagsManagement from './components/admin/QuizTagsManagement';
import CourseManagement from './components/admin/CourseManagement';

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
        path: 'content-creator/viral-post-generator',
        element: (
          <ProtectedRoute>
            <ViralPostGenerator />
          </ProtectedRoute>
        )
      },
      {
        path: 'boardroom',
        element: (
          <ProtectedRoute>
            <Boardroom />
          </ProtectedRoute>
        )
      },
      {
        path: 'freelancer-academy/live-qa',
        element: (
          <ProtectedRoute>
            <LiveQA />
          </ProtectedRoute>
        )
      },
      {
        path: 'freelancer-academy/quizzes',
        element: (
          <ProtectedRoute>
            <KnowledgeQuizzes />
          </ProtectedRoute>
        )
      },
      {
        path: 'freelancer-academy/quizzes/:attemptId/take',
        element: (
          <ProtectedRoute>
            <QuizAttemptPage />
          </ProtectedRoute>
        )
      },
      {
        path: 'freelancer-academy/quizzes/:attemptId/results',
        element: (
          <ProtectedRoute>
            <QuizResultsPage />
          </ProtectedRoute>
        )
      },
      {
        path: 'freelancer-academy/quizzes/history',
        element: (
          <ProtectedRoute>
            <QuizHistoryPage />
          </ProtectedRoute>
        )
      },
      {
        path: 'freelancer-academy/courses',
        element: (
          <ProtectedRoute>
            <CourseDiscovery />
          </ProtectedRoute>
        )
      },
      {
        path: 'freelancer-academy/my-learning',
        element: (
          <ProtectedRoute>
            <LearningDashboard />
          </ProtectedRoute>
        )
      },
      {
        path: 'freelancer-academy/courses/:courseId',
        element: (
          <ProtectedRoute>
            <CoursesComponent />
          </ProtectedRoute>
        )
      },
      {
        path: 'freelancer-academy/foundations',
        element: (
          <ProtectedRoute>
            <CoursesComponent courseCategory="Foundations" />
          </ProtectedRoute>
        )
      },
      {
        path: 'freelancer-academy/growth',
        element: (
          <ProtectedRoute>
            <CoursesComponent courseCategory="Growth" />
          </ProtectedRoute>
        )
      },
      {
        path: 'freelancer-academy/advanced',
        element: (
          <ProtectedRoute>
            <CoursesComponent courseCategory="Advanced" />
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
          },
          {
            path: 'ai-tools',
            element: <AIToolsManager />
          },
          {
            path: 'tips',
            element: <TipsManagement />
          },
          {
            path: 'events',
            element: <EventsManagement />
          },
          {
            path: 'hosts',
            element: <HostsManagement />
          },
          {
            path: 'quizzes',
            element: <QuizzesManagement />
          },
          {
            path: 'quiz-tags',
            element: <QuizTagsManagement />
          },
          {
            path: 'courses',
            element: <CourseManagement />
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