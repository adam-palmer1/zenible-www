import { createBrowserRouter, RouterProvider, Navigate, Outlet } from 'react-router-dom';
import { QueryClientProvider, ReactQueryDevtools } from './lib/react-query';
import { queryClient } from './lib/react-query';
import { AuthProvider } from './contexts/AuthContext';
import { PreferencesProvider } from './contexts/PreferencesContext';
import { WebSocketProvider } from './contexts/WebSocketContext';
import { CRMProvider } from './contexts/CRMContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { InvoiceProvider } from './contexts/InvoiceContext';
import { QuoteProvider } from './contexts/QuoteContext';
import { ExpenseProvider } from './contexts/ExpenseContext';
import { PaymentIntegrationsProvider } from './contexts/PaymentIntegrationsContext';
import { CRMReferenceDataProvider } from './contexts/CRMReferenceDataContext';

// Auth pages
import SignIn from './pages/signin/SignIn';
import GoogleCallback from './components/GoogleCallback';
import UserSettings from './components/UserSettings';
import StripeOAuthCallback from './components/settings/StripeOAuthCallback';

// Dashboard pages
import ProtectedDashboard from './components/ProtectedDashboard';
import ProtectedRoute from './components/ProtectedRoute';
import CRMDashboard from './components/crm/CRMDashboard';
import Calendar from './components/calendar/Calendar';
import GoogleCalendarCallback from './components/calendar/GoogleCalendarCallback';
import ProposalWizard from './components/proposal-wizard/ProposalWizard';
import ProfileAnalyzer from './components/profile-analyzer/ProfileAnalyzer';
import HeadlineAnalyzer from './components/headline-analyzer/HeadlineAnalyzer';
import ViralPostGenerator from './components/viral-post-generator/ViralPostGenerator';
import Boardroom from './components/boardroom/Boardroom';
import LiveQA from './components/live-qa/LiveQA';
import KnowledgeQuizzes from './components/quizzes/KnowledgeQuizzes';
import QuizAttemptPage from './components/quizzes/QuizAttemptPage';
import QuizResultsPage from './components/quizzes/QuizResultsPage';
import QuizHistoryPage from './components/quizzes/QuizHistoryPage';
import Plans from './components/Plans';
import Pricing from './components/pricing/PricingNew';

// Finance pages
import { InvoiceDashboard, InvoiceForm, InvoiceDetail, PublicInvoiceView, RecurringInvoices } from './components/finance/invoices';
import { QuoteDashboard, QuoteForm, QuoteDetail, PublicQuoteView } from './components/finance/quotes';
import { CreditNotesDashboard } from './components/finance/credit-notes';
import { ExpenseDashboard, ExpenseForm, CategoryManagement, RecurringExpenses } from './components/finance/expenses';
import { PaymentDashboard, PaymentCallback } from './components/finance/payments';
import { ReportsDashboard } from './components/finance/reports';
import { FinanceClientsDashboard } from './components/finance/clients';
import { PaymentsProvider } from './contexts/PaymentsContext';
import { ReportsProvider } from './contexts/ReportsContext';

// Booking pages
import { PublicUserPage, PublicBookingPage, BookingConfirmation, BookingCancellation, ZoomCallback } from './pages/booking';

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
        path: 'profile-positioning/profile-analyzer',
        element: (
          <ProtectedRoute>
            <ProfileAnalyzer />
          </ProtectedRoute>
        )
      },
      {
        path: 'profile-positioning/headline-analyzer',
        element: (
          <ProtectedRoute>
            <HeadlineAnalyzer />
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
        path: 'settings/payments/callback',
        element: (
          <ProtectedRoute>
            <StripeOAuthCallback />
          </ProtectedRoute>
        )
      },
      {
        path: 'crm/:tab?',
        element: (
          <ProtectedRoute>
            <CRMProvider>
              <CRMDashboard />
            </CRMProvider>
          </ProtectedRoute>
        )
      },
      {
        path: 'calendar',
        element: (
          <ProtectedRoute>
            <Calendar />
          </ProtectedRoute>
        )
      },
      {
        path: 'auth/calendar/callback',
        element: (
          <ProtectedRoute>
            <GoogleCalendarCallback />
          </ProtectedRoute>
        )
      },
      {
        path: 'finance/invoices',
        element: (
          <ProtectedRoute>
            <InvoiceProvider>
              <InvoiceDashboard />
            </InvoiceProvider>
          </ProtectedRoute>
        )
      },
      {
        path: 'finance/invoices/new',
        element: (
          <ProtectedRoute>
            <InvoiceProvider>
              <InvoiceForm />
            </InvoiceProvider>
          </ProtectedRoute>
        )
      },
      {
        path: 'finance/invoices/recurring',
        element: (
          <ProtectedRoute>
            <InvoiceProvider>
              <RecurringInvoices />
            </InvoiceProvider>
          </ProtectedRoute>
        )
      },
      {
        path: 'finance/invoices/:id',
        element: (
          <ProtectedRoute>
            <InvoiceProvider>
              <InvoiceDetail />
            </InvoiceProvider>
          </ProtectedRoute>
        )
      },
      {
        path: 'finance/invoices/:id/edit',
        element: (
          <ProtectedRoute>
            <InvoiceProvider>
              <InvoiceForm />
            </InvoiceProvider>
          </ProtectedRoute>
        )
      },
      {
        path: 'invoices/public/:token',
        element: <PublicInvoiceView />
      },
      {
        path: 'pay/:shareCode',
        element: <PublicInvoiceView />
      },
      {
        path: 'finance/quotes',
        element: (
          <ProtectedRoute>
            <QuoteProvider>
              <QuoteDashboard />
            </QuoteProvider>
          </ProtectedRoute>
        )
      },
      {
        path: 'finance/quotes/new',
        element: (
          <ProtectedRoute>
            <QuoteProvider>
              <QuoteForm />
            </QuoteProvider>
          </ProtectedRoute>
        )
      },
      {
        path: 'finance/quotes/:id',
        element: (
          <ProtectedRoute>
            <QuoteProvider>
              <QuoteDetail />
            </QuoteProvider>
          </ProtectedRoute>
        )
      },
      {
        path: 'finance/quotes/:id/edit',
        element: (
          <ProtectedRoute>
            <QuoteProvider>
              <QuoteForm />
            </QuoteProvider>
          </ProtectedRoute>
        )
      },
      {
        path: 'quotes/public/:token',
        element: <PublicQuoteView />
      },
      // Public booking routes (no auth required)
      {
        path: 'book/:username',
        element: <PublicUserPage />
      },
      {
        path: 'book/:username/:shortcode',
        element: <PublicBookingPage />
      },
      {
        path: 'booking/confirm/:token',
        element: <BookingConfirmation />
      },
      {
        path: 'booking/cancel/:token',
        element: <BookingCancellation />
      },
      // Zoom OAuth callback (authenticated)
      {
        path: 'settings/integrations/zoom/callback',
        element: (
          <ProtectedRoute>
            <ZoomCallback />
          </ProtectedRoute>
        )
      },
      {
        path: 'finance/credit-notes',
        element: (
          <ProtectedRoute>
            <CreditNotesDashboard />
          </ProtectedRoute>
        )
      },
      {
        path: 'finance/expenses',
        element: (
          <ProtectedRoute>
            <ExpenseProvider>
              <ExpenseDashboard />
            </ExpenseProvider>
          </ProtectedRoute>
        )
      },
      {
        path: 'finance/expenses/new',
        element: (
          <ProtectedRoute>
            <ExpenseProvider>
              <ExpenseForm />
            </ExpenseProvider>
          </ProtectedRoute>
        )
      },
      {
        path: 'finance/expenses/:id/edit',
        element: (
          <ProtectedRoute>
            <ExpenseProvider>
              <ExpenseForm />
            </ExpenseProvider>
          </ProtectedRoute>
        )
      },
      {
        path: 'finance/expenses/categories',
        element: (
          <ProtectedRoute>
            <ExpenseProvider>
              <CategoryManagement />
            </ExpenseProvider>
          </ProtectedRoute>
        )
      },
      {
        path: 'finance/expenses/recurring',
        element: (
          <ProtectedRoute>
            <ExpenseProvider>
              <RecurringExpenses />
            </ExpenseProvider>
          </ProtectedRoute>
        )
      },
      {
        path: 'finance/payments',
        element: (
          <ProtectedRoute>
            <PaymentsProvider>
              <PaymentDashboard />
            </PaymentsProvider>
          </ProtectedRoute>
        )
      },
      {
        path: 'finance/reports',
        element: (
          <ProtectedRoute>
            <ReportsProvider>
              <ReportsDashboard />
            </ReportsProvider>
          </ProtectedRoute>
        )
      },
      {
        path: 'finance/clients',
        element: (
          <ProtectedRoute>
            <CRMProvider>
              <FinanceClientsDashboard />
            </CRMProvider>
          </ProtectedRoute>
        )
      },
      {
        path: 'payment-callback',
        element: (
          <ProtectedRoute>
            <PaymentIntegrationsProvider>
              <PaymentCallback />
            </PaymentIntegrationsProvider>
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
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <CRMReferenceDataProvider>
          <PreferencesProvider>
            <NotificationProvider>
              <RouterProvider router={router} />
            </NotificationProvider>
          </PreferencesProvider>
        </CRMReferenceDataProvider>
      </AuthProvider>
      {/* React Query DevTools - only shows in development */}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}

export default App;