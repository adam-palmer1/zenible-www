import { Navigate, useSearchParams } from 'react-router-dom';

// Redirect to the unified verification page
export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const email = searchParams.get('email') || '';

  // Redirect to /auth/verify-email with the email param
  return <Navigate to={`/auth/verify-email${email ? `?email=${encodeURIComponent(email)}` : ''}`} replace />;
}
