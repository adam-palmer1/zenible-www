import React, { Suspense } from 'react';
import { createBrowserRouter, RouterProvider, Navigate, Outlet } from 'react-router-dom';
import { QueryClientProvider } from './lib/react-query';
import { queryClient } from './lib/react-query';
import ErrorBoundary from './components/shared/ErrorBoundary';
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

// Auth pages (eager - critical path, first pages users see)
import SignIn from './pages/signin/SignIn';
import SignUp from './pages/signup/SignUp';
import VerifyEmail from './pages/signup/VerifyEmail';
import VerifyEmailToken from './pages/signup/VerifyEmailToken';
import EmailConfirmed from './pages/signup/EmailConfirmed';
import ForgotPassword from './pages/forgot-password/ForgotPassword';
import ResetPassword from './pages/forgot-password/ResetPassword';
import GoogleCallback from './components/GoogleCallback';

// Core layout/auth components (eager - always needed)
import ProtectedDashboard from './components/ProtectedDashboard';
import ProtectedRoute from './components/ProtectedRoute';

// Finance context providers (eager - lightweight, needed by finance routes)
import { PaymentsProvider } from './contexts/PaymentsContext';
import { ReportsProvider } from './contexts/ReportsContext';
import { UsageDashboardProvider } from './contexts/UsageDashboardContext';

// ---------------------------------------------------------------------------
// Lazy-loaded route components (code-split per route)
// ---------------------------------------------------------------------------

// Feature routes
const UserSettings = React.lazy(() => import('./components/UserSettings'));
const StripeOAuthCallback = React.lazy(() => import('./components/settings/StripeOAuthCallback'));
const CRMDashboard = React.lazy(() => import('./components/crm/CRMDashboard'));
const Calendar = React.lazy(() => import('./components/calendar/Calendar'));
const GoogleCalendarCallback = React.lazy(() => import('./components/calendar/GoogleCalendarCallback'));
const ProposalWizard = React.lazy(() => import('./components/proposal-wizard/ProposalWizard'));
const ProfileAnalyzer = React.lazy(() => import('./components/profile-analyzer/ProfileAnalyzer'));
const HeadlineAnalyzer = React.lazy(() => import('./components/headline-analyzer/HeadlineAnalyzer'));
const ViralPostGenerator = React.lazy(() => import('./components/viral-post-generator/ViralPostGenerator'));
const Boardroom = React.lazy(() => import('./components/boardroom/Boardroom'));
const LiveQA = React.lazy(() => import('./components/live-qa/LiveQA'));
const KnowledgeQuizzes = React.lazy(() => import('./components/quizzes/KnowledgeQuizzes'));
const QuizAttemptPage = React.lazy(() => import('./components/quizzes/QuizAttemptPage'));
const QuizResultsPage = React.lazy(() => import('./components/quizzes/QuizResultsPage'));
const QuizHistoryPage = React.lazy(() => import('./components/quizzes/QuizHistoryPage'));
const Plans = React.lazy(() => import('./components/Plans'));
const Pricing = React.lazy(() => import('./components/pricing/PricingNew'));

// Finance routes (heavy, many sub-components)
const InvoiceDashboard = React.lazy(() => import('./components/finance/invoices/InvoiceDashboard'));
const InvoiceForm = React.lazy(() => import('./components/finance/invoices/InvoiceForm'));
const InvoiceDetail = React.lazy(() => import('./components/finance/invoices/InvoiceDetail'));
const RecurringInvoices = React.lazy(() => import('./components/finance/invoices/RecurringInvoices'));
const PublicInvoiceView = React.lazy(() => import('./components/finance/invoices/PublicInvoiceView'));
const QuoteDashboard = React.lazy(() => import('./components/finance/quotes/QuoteDashboard'));
const QuoteForm = React.lazy(() => import('./components/finance/quotes/QuoteForm'));
const QuoteDetail = React.lazy(() => import('./components/finance/quotes/QuoteDetail'));
const PublicQuoteView = React.lazy(() => import('./components/finance/quotes/PublicQuoteView'));
const CreditNotesDashboard = React.lazy(() => import('./components/finance/credit-notes/CreditNotesDashboard'));
const CreditNoteForm = React.lazy(() => import('./components/finance/credit-notes/CreditNoteForm'));
const ExpenseDashboard = React.lazy(() => import('./components/finance/expenses/ExpenseDashboard'));
const ExpenseForm = React.lazy(() => import('./components/finance/expenses/ExpenseForm'));
const CategoryManagement = React.lazy(() => import('./components/finance/expenses/CategoryManagement'));
const RecurringExpenses = React.lazy(() => import('./components/finance/expenses/RecurringExpenses'));
const PaymentDashboard = React.lazy(() => import('./components/finance/payments/PaymentDashboard'));
const PaymentCallback = React.lazy(() => import('./components/finance/payments/PaymentCallback'));
const ReportsDashboard = React.lazy(() => import('./components/finance/reports/ReportsDashboard'));
const FinanceClientsDashboard = React.lazy(() => import('./components/finance/clients/FinanceClientsDashboard'));

// Booking routes (public entry points)
const PublicUserPage = React.lazy(() => import('./pages/booking/PublicUserPage'));
const PublicBookingPage = React.lazy(() => import('./pages/booking/PublicBookingPage'));
const BookingConfirmation = React.lazy(() => import('./pages/booking/BookingConfirmation'));
const BookingCancellation = React.lazy(() => import('./pages/booking/BookingCancellation'));
const ZoomCallback = React.lazy(() => import('./pages/booking/ZoomCallback'));

// Admin routes (admin-only, rarely accessed by most users)
const AdminLayout = React.lazy(() => import('./components/admin/AdminLayout'));
const AdminDashboard = React.lazy(() => import('./components/admin/AdminDashboard'));
const UserManagement = React.lazy(() => import('./components/admin/UserManagement'));
const PlanManagement = React.lazy(() => import('./components/admin/PlanManagement'));
const SubscriptionManagement = React.lazy(() => import('./components/admin/SubscriptionManagement'));
const PaymentTracking = React.lazy(() => import('./components/admin/PaymentTracking'));
const AuditLogs = React.lazy(() => import('./components/admin/AuditLogs'));
const AICharacterManagement = React.lazy(() => import('./components/admin/AICharacterManagement'));
const ThreadManagement = React.lazy(() => import('./components/admin/ThreadManagement'));
const FeatureManagement = React.lazy(() => import('./components/admin/FeatureManagement'));
const AdminSettings = React.lazy(() => import('./components/admin/AdminSettings'));
const AIModelsManagement = React.lazy(() => import('./components/admin/AIModelsManagement'));
const ConversationManagement = React.lazy(() => import('./components/admin/ConversationManagement'));
const OnboardingQuestions = React.lazy(() => import('./components/admin/OnboardingQuestions'));
const AIToolsManager = React.lazy(() => import('./components/admin/AIToolsManager'));
const TipsManagement = React.lazy(() => import('./components/admin/TipsManagement'));
const EventsManagement = React.lazy(() => import('./components/admin/EventsManagement'));
const HostsManagement = React.lazy(() => import('./components/admin/HostsManagement'));
const QuizzesManagement = React.lazy(() => import('./components/admin/QuizzesManagement'));
const QuizTagsManagement = React.lazy(() => import('./components/admin/QuizTagsManagement'));

// ---------------------------------------------------------------------------
// Loading fallback for lazy-loaded route components
// ---------------------------------------------------------------------------
function PageLoadingFallback() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
    </div>
  );
}

// Root layout component with WebSocket and UsageDashboard providers
function RootLayout(): React.ReactElement {
  return (
    <UsageDashboardProvider>
      <WebSocketProvider>
        <ErrorBoundary level="page">
          <Outlet />
        </ErrorBoundary>
      </WebSocketProvider>
    </UsageDashboardProvider>
  );
}

const router = createBrowserRouter([
  {
    path: '/',
    element: <RootLayout />,
    children: [
      {
        path: 'signin',
        element: <ErrorBoundary level="section"><SignIn /></ErrorBoundary>
      },
      {
        path: 'auth/google/callback',
        element: <ErrorBoundary level="section"><GoogleCallback /></ErrorBoundary>
      },
      {
        path: 'login',
        element: <Navigate to="/signin" replace />
      },
      {
        path: 'register',
        element: <ErrorBoundary level="section"><SignUp /></ErrorBoundary>
      },
      {
        path: 'signup',
        element: <Navigate to="/register" replace />
      },
      {
        path: 'verify-email',
        element: <ErrorBoundary level="section"><VerifyEmail /></ErrorBoundary>
      },
      {
        path: 'auth/verify-email',
        element: <ErrorBoundary level="section"><VerifyEmailToken /></ErrorBoundary>
      },
      {
        path: 'email-confirmed',
        element: <ErrorBoundary level="section"><EmailConfirmed /></ErrorBoundary>
      },
      {
        path: 'forgot-password',
        element: <ErrorBoundary level="section"><ForgotPassword /></ErrorBoundary>
      },
      {
        path: 'auth/reset-password',
        element: <ErrorBoundary level="section"><ResetPassword /></ErrorBoundary>
      },
      {
        path: 'dashboard',
        element: <ErrorBoundary level="section"><ProtectedDashboard /></ErrorBoundary>
      },
      {
        path: 'zenible-dashboard',
        element: <Navigate to="/dashboard" replace />
      },
      {
        path: 'proposal-wizard',
        element: (
          <ProtectedRoute>
            <ErrorBoundary level="section"><Suspense fallback={<PageLoadingFallback />}><ProposalWizard /></Suspense></ErrorBoundary>
          </ProtectedRoute>
        )
      },
      {
        path: 'profile-positioning/profile-analyzer',
        element: (
          <ProtectedRoute>
            <ErrorBoundary level="section"><Suspense fallback={<PageLoadingFallback />}><ProfileAnalyzer /></Suspense></ErrorBoundary>
          </ProtectedRoute>
        )
      },
      {
        path: 'profile-positioning/headline-analyzer',
        element: (
          <ProtectedRoute>
            <ErrorBoundary level="section"><Suspense fallback={<PageLoadingFallback />}><HeadlineAnalyzer /></Suspense></ErrorBoundary>
          </ProtectedRoute>
        )
      },
      {
        path: 'content-creator/viral-post-generator',
        element: (
          <ProtectedRoute>
            <ErrorBoundary level="section"><Suspense fallback={<PageLoadingFallback />}><ViralPostGenerator /></Suspense></ErrorBoundary>
          </ProtectedRoute>
        )
      },
      {
        path: 'boardroom',
        element: (
          <ProtectedRoute>
            <ErrorBoundary level="section"><Suspense fallback={<PageLoadingFallback />}><Boardroom /></Suspense></ErrorBoundary>
          </ProtectedRoute>
        )
      },
      {
        path: 'freelancer-academy/live-qa',
        element: (
          <ProtectedRoute>
            <ErrorBoundary level="section"><Suspense fallback={<PageLoadingFallback />}><LiveQA /></Suspense></ErrorBoundary>
          </ProtectedRoute>
        )
      },
      {
        path: 'freelancer-academy/quizzes',
        element: (
          <ProtectedRoute>
            <ErrorBoundary level="section"><Suspense fallback={<PageLoadingFallback />}><KnowledgeQuizzes /></Suspense></ErrorBoundary>
          </ProtectedRoute>
        )
      },
      {
        path: 'freelancer-academy/quizzes/:attemptId/take',
        element: (
          <ProtectedRoute>
            <ErrorBoundary level="section"><Suspense fallback={<PageLoadingFallback />}><QuizAttemptPage /></Suspense></ErrorBoundary>
          </ProtectedRoute>
        )
      },
      {
        path: 'freelancer-academy/quizzes/:attemptId/results',
        element: (
          <ProtectedRoute>
            <ErrorBoundary level="section"><Suspense fallback={<PageLoadingFallback />}><QuizResultsPage /></Suspense></ErrorBoundary>
          </ProtectedRoute>
        )
      },
      {
        path: 'freelancer-academy/quizzes/history',
        element: (
          <ProtectedRoute>
            <ErrorBoundary level="section"><Suspense fallback={<PageLoadingFallback />}><QuizHistoryPage /></Suspense></ErrorBoundary>
          </ProtectedRoute>
        )
      },
      {
        path: 'plans',
        element: <ErrorBoundary level="section"><Suspense fallback={<PageLoadingFallback />}><Plans /></Suspense></ErrorBoundary>
      },
      {
        path: 'pricing',
        element: <ErrorBoundary level="section"><Suspense fallback={<PageLoadingFallback />}><Pricing /></Suspense></ErrorBoundary>
      },
      {
        path: 'settings',
        element: (
          <ProtectedRoute>
            <ErrorBoundary level="section"><Suspense fallback={<PageLoadingFallback />}><UserSettings /></Suspense></ErrorBoundary>
          </ProtectedRoute>
        )
      },
      {
        path: 'settings/payments/callback',
        element: (
          <ProtectedRoute>
            <ErrorBoundary level="section"><Suspense fallback={<PageLoadingFallback />}><StripeOAuthCallback /></Suspense></ErrorBoundary>
          </ProtectedRoute>
        )
      },
      {
        path: 'crm/:tab?',
        element: (
          <ProtectedRoute>
            <ErrorBoundary level="section">
              <CRMProvider>
                <Suspense fallback={<PageLoadingFallback />}><CRMDashboard /></Suspense>
              </CRMProvider>
            </ErrorBoundary>
          </ProtectedRoute>
        )
      },
      {
        path: 'calendar',
        element: (
          <ProtectedRoute>
            <ErrorBoundary level="section"><Suspense fallback={<PageLoadingFallback />}><Calendar /></Suspense></ErrorBoundary>
          </ProtectedRoute>
        )
      },
      {
        path: 'auth/calendar/callback',
        element: (
          <ProtectedRoute>
            <ErrorBoundary level="section"><Suspense fallback={<PageLoadingFallback />}><GoogleCalendarCallback /></Suspense></ErrorBoundary>
          </ProtectedRoute>
        )
      },
      {
        path: 'finance/invoices',
        element: (
          <ProtectedRoute>
            <InvoiceProvider>
              <Outlet />
            </InvoiceProvider>
          </ProtectedRoute>
        ),
        children: [
          { index: true, element: <ErrorBoundary level="section"><Suspense fallback={<PageLoadingFallback />}><InvoiceDashboard /></Suspense></ErrorBoundary> },
          { path: 'new', element: <ErrorBoundary level="section"><Suspense fallback={<PageLoadingFallback />}><InvoiceForm /></Suspense></ErrorBoundary> },
          { path: 'recurring', element: <ErrorBoundary level="section"><Suspense fallback={<PageLoadingFallback />}><RecurringInvoices /></Suspense></ErrorBoundary> },
          { path: ':id', element: <ErrorBoundary level="section"><Suspense fallback={<PageLoadingFallback />}><InvoiceDetail /></Suspense></ErrorBoundary> },
          { path: ':id/edit', element: <ErrorBoundary level="section"><Suspense fallback={<PageLoadingFallback />}><InvoiceForm /></Suspense></ErrorBoundary> },
        ]
      },
      {
        path: 'invoices/public/:token',
        element: <ErrorBoundary level="section"><Suspense fallback={<PageLoadingFallback />}><PublicInvoiceView /></Suspense></ErrorBoundary>
      },
      {
        path: 'pay/:shareCode',
        element: <ErrorBoundary level="section"><Suspense fallback={<PageLoadingFallback />}><PublicInvoiceView /></Suspense></ErrorBoundary>
      },
      {
        path: 'finance/quotes',
        element: (
          <ProtectedRoute>
            <QuoteProvider>
              <Outlet />
            </QuoteProvider>
          </ProtectedRoute>
        ),
        children: [
          { index: true, element: <ErrorBoundary level="section"><Suspense fallback={<PageLoadingFallback />}><QuoteDashboard /></Suspense></ErrorBoundary> },
          { path: 'new', element: <ErrorBoundary level="section"><Suspense fallback={<PageLoadingFallback />}><QuoteForm /></Suspense></ErrorBoundary> },
          { path: ':id', element: <ErrorBoundary level="section"><Suspense fallback={<PageLoadingFallback />}><QuoteDetail /></Suspense></ErrorBoundary> },
          { path: ':id/edit', element: <ErrorBoundary level="section"><Suspense fallback={<PageLoadingFallback />}><QuoteForm /></Suspense></ErrorBoundary> },
        ]
      },
      {
        path: 'quotes/public/:token',
        element: <ErrorBoundary level="section"><Suspense fallback={<PageLoadingFallback />}><PublicQuoteView /></Suspense></ErrorBoundary>
      },
      // Public booking routes (no auth required)
      {
        path: 'book/cancel/:token',
        element: <ErrorBoundary level="section"><Suspense fallback={<PageLoadingFallback />}><BookingCancellation /></Suspense></ErrorBoundary>
      },
      {
        path: 'book/:username',
        element: <ErrorBoundary level="section"><Suspense fallback={<PageLoadingFallback />}><PublicUserPage /></Suspense></ErrorBoundary>
      },
      {
        path: 'book/:username/:shortcode',
        element: <ErrorBoundary level="section"><Suspense fallback={<PageLoadingFallback />}><PublicBookingPage /></Suspense></ErrorBoundary>
      },
      {
        path: 'booking/confirm/:token',
        element: <ErrorBoundary level="section"><Suspense fallback={<PageLoadingFallback />}><BookingConfirmation /></Suspense></ErrorBoundary>
      },
      {
        path: 'booking/cancel/:token',
        element: <ErrorBoundary level="section"><Suspense fallback={<PageLoadingFallback />}><BookingCancellation /></Suspense></ErrorBoundary>
      },
      // Zoom OAuth callback (authenticated)
      {
        path: 'settings/integrations/zoom/callback',
        element: (
          <ProtectedRoute>
            <ErrorBoundary level="section"><Suspense fallback={<PageLoadingFallback />}><ZoomCallback /></Suspense></ErrorBoundary>
          </ProtectedRoute>
        )
      },
      {
        path: 'finance/credit-notes',
        element: (
          <ProtectedRoute>
            <ErrorBoundary level="section"><Suspense fallback={<PageLoadingFallback />}><CreditNotesDashboard /></Suspense></ErrorBoundary>
          </ProtectedRoute>
        )
      },
      {
        path: 'finance/credit-notes/new',
        element: (
          <ProtectedRoute>
            <ErrorBoundary level="section"><Suspense fallback={<PageLoadingFallback />}><CreditNoteForm /></Suspense></ErrorBoundary>
          </ProtectedRoute>
        )
      },
      {
        path: 'finance/credit-notes/:id/edit',
        element: (
          <ProtectedRoute>
            <ErrorBoundary level="section"><Suspense fallback={<PageLoadingFallback />}><CreditNoteForm /></Suspense></ErrorBoundary>
          </ProtectedRoute>
        )
      },
      {
        path: 'finance/expenses',
        element: (
          <ProtectedRoute>
            <ExpenseProvider>
              <Outlet />
            </ExpenseProvider>
          </ProtectedRoute>
        ),
        children: [
          { index: true, element: <ErrorBoundary level="section"><Suspense fallback={<PageLoadingFallback />}><ExpenseDashboard /></Suspense></ErrorBoundary> },
          { path: 'new', element: <ErrorBoundary level="section"><Suspense fallback={<PageLoadingFallback />}><ExpenseForm /></Suspense></ErrorBoundary> },
          { path: ':id/edit', element: <ErrorBoundary level="section"><Suspense fallback={<PageLoadingFallback />}><ExpenseForm /></Suspense></ErrorBoundary> },
          { path: 'categories', element: <ErrorBoundary level="section"><Suspense fallback={<PageLoadingFallback />}><CategoryManagement /></Suspense></ErrorBoundary> },
          { path: 'recurring', element: <ErrorBoundary level="section"><Suspense fallback={<PageLoadingFallback />}><RecurringExpenses /></Suspense></ErrorBoundary> },
        ]
      },
      {
        path: 'finance/payments',
        element: (
          <ProtectedRoute>
            <ErrorBoundary level="section">
              <PaymentsProvider>
                <Suspense fallback={<PageLoadingFallback />}><PaymentDashboard /></Suspense>
              </PaymentsProvider>
            </ErrorBoundary>
          </ProtectedRoute>
        )
      },
      {
        path: 'finance/reports',
        element: (
          <ProtectedRoute>
            <ErrorBoundary level="section">
              <ReportsProvider>
                <Suspense fallback={<PageLoadingFallback />}><ReportsDashboard /></Suspense>
              </ReportsProvider>
            </ErrorBoundary>
          </ProtectedRoute>
        )
      },
      {
        path: 'finance/clients',
        element: (
          <ProtectedRoute>
            <ErrorBoundary level="section">
              <CRMProvider>
                <Suspense fallback={<PageLoadingFallback />}><FinanceClientsDashboard /></Suspense>
              </CRMProvider>
            </ErrorBoundary>
          </ProtectedRoute>
        )
      },
      {
        path: 'payment-callback',
        element: (
          <ProtectedRoute>
            <ErrorBoundary level="section">
              <PaymentIntegrationsProvider>
                <Suspense fallback={<PageLoadingFallback />}><PaymentCallback /></Suspense>
              </PaymentIntegrationsProvider>
            </ErrorBoundary>
          </ProtectedRoute>
        )
      },
      {
        path: 'admin',
        element: <ErrorBoundary level="section"><Suspense fallback={<PageLoadingFallback />}><AdminLayout /></Suspense></ErrorBoundary>,
        children: [
          {
            index: true,
            element: <ErrorBoundary level="section"><Suspense fallback={<PageLoadingFallback />}><AdminDashboard /></Suspense></ErrorBoundary>
          },
          {
            path: 'users',
            element: <ErrorBoundary level="section"><Suspense fallback={<PageLoadingFallback />}><UserManagement /></Suspense></ErrorBoundary>
          },
          {
            path: 'plans',
            element: <ErrorBoundary level="section"><Suspense fallback={<PageLoadingFallback />}><PlanManagement /></Suspense></ErrorBoundary>
          },
          {
            path: 'subscriptions',
            element: <ErrorBoundary level="section"><Suspense fallback={<PageLoadingFallback />}><SubscriptionManagement /></Suspense></ErrorBoundary>
          },
          {
            path: 'payments',
            element: <ErrorBoundary level="section"><Suspense fallback={<PageLoadingFallback />}><PaymentTracking /></Suspense></ErrorBoundary>
          },
          {
            path: 'audit-logs',
            element: <ErrorBoundary level="section"><Suspense fallback={<PageLoadingFallback />}><AuditLogs /></Suspense></ErrorBoundary>
          },
          {
            path: 'ai-characters',
            element: <ErrorBoundary level="section"><Suspense fallback={<PageLoadingFallback />}><AICharacterManagement /></Suspense></ErrorBoundary>
          },
          {
            path: 'ai-models',
            element: <ErrorBoundary level="section"><Suspense fallback={<PageLoadingFallback />}><AIModelsManagement /></Suspense></ErrorBoundary>
          },
          {
            path: 'threads',
            element: <ErrorBoundary level="section"><Suspense fallback={<PageLoadingFallback />}><ThreadManagement /></Suspense></ErrorBoundary>
          },
          {
            path: 'conversations',
            element: <ErrorBoundary level="section"><Suspense fallback={<PageLoadingFallback />}><ConversationManagement /></Suspense></ErrorBoundary>
          },
          {
            path: 'features',
            element: <ErrorBoundary level="section"><Suspense fallback={<PageLoadingFallback />}><FeatureManagement /></Suspense></ErrorBoundary>
          },
          {
            path: 'onboarding-questions',
            element: <ErrorBoundary level="section"><Suspense fallback={<PageLoadingFallback />}><OnboardingQuestions /></Suspense></ErrorBoundary>
          },
          {
            path: 'settings',
            element: <ErrorBoundary level="section"><Suspense fallback={<PageLoadingFallback />}><AdminSettings /></Suspense></ErrorBoundary>
          },
          {
            path: 'ai-tools',
            element: <ErrorBoundary level="section"><Suspense fallback={<PageLoadingFallback />}><AIToolsManager /></Suspense></ErrorBoundary>
          },
          {
            path: 'tips',
            element: <ErrorBoundary level="section"><Suspense fallback={<PageLoadingFallback />}><TipsManagement /></Suspense></ErrorBoundary>
          },
          {
            path: 'events',
            element: <ErrorBoundary level="section"><Suspense fallback={<PageLoadingFallback />}><EventsManagement /></Suspense></ErrorBoundary>
          },
          {
            path: 'hosts',
            element: <ErrorBoundary level="section"><Suspense fallback={<PageLoadingFallback />}><HostsManagement /></Suspense></ErrorBoundary>
          },
          {
            path: 'quizzes',
            element: <ErrorBoundary level="section"><Suspense fallback={<PageLoadingFallback />}><QuizzesManagement /></Suspense></ErrorBoundary>
          },
          {
            path: 'quiz-tags',
            element: <ErrorBoundary level="section"><Suspense fallback={<PageLoadingFallback />}><QuizTagsManagement /></Suspense></ErrorBoundary>
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

function App(): React.ReactElement {
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
    </QueryClientProvider>
  );
}

export default App;
