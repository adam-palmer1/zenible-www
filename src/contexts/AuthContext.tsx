import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authAPI, tokenStorage } from '../utils/auth';
import { useSessionGuard } from '../hooks/useSessionGuard';
import logger from '../utils/logger';

export interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  name?: string;
  username?: string;
  role?: string;
  avatar_url?: string | null;
  current_plan_id?: string | null;
  email_verified?: boolean;
  is_active?: boolean;
  [key: string]: unknown;
}

interface AuthResult {
  success: boolean;
  user?: User;
  error?: string;
  data?: unknown;
}

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  error: string | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  signup: (email: string, password: string, firstName: string, lastName?: string | null) => Promise<AuthResult>;
  login: (email: string, password: string) => Promise<AuthResult>;
  logout: () => Promise<void>;
  verifyEmail: (code: string) => Promise<AuthResult>;
  forgotPassword: (email: string) => Promise<AuthResult>;
  resetPassword: (token: string, newPassword: string) => Promise<AuthResult>;
  setPassword: (token: string, newPassword: string, firstName?: string | null, lastName?: string | null) => Promise<AuthResult>;
  googleLogin: (redirectPath?: string) => Promise<AuthResult>;
  handleGoogleCallback: (code: string) => Promise<AuthResult>;
  checkAuth: () => Promise<void>;
  updateUser: (updatedData: Partial<User>) => void;
  setTokens: (accessToken: string, refreshToken: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Check if user is logged in on mount
  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async (): Promise<void> => {
    setLoading(true);
    const accessToken = tokenStorage.getAccessToken();
    if (!accessToken) {
      setLoading(false);
      setUser(null);
      return;
    }

    try {
      const userData = await authAPI.getCurrentUser() as User;
      setUser(userData);
    } catch (err) {
      logger.error('Auth check failed:', err);
      tokenStorage.clearTokens();
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const signup = async (email: string, password: string, firstName: string, lastName: string | null = null): Promise<AuthResult> => {
    setError(null);
    try {
      const response = await authAPI.signup(email, password, firstName, lastName);
      tokenStorage.setTokens(response.access_token, response.refresh_token);
      setUser(response.user as User);
      return { success: true, user: response.user as User };
    } catch (err) {
      setError((err as Error).message);
      return { success: false, error: (err as Error).message };
    }
  };

  const login = async (email: string, password: string): Promise<AuthResult> => {
    setError(null);
    try {
      const response = await authAPI.login(email, password);
      // Store the access token (refresh_token may not be provided)
      tokenStorage.setTokens(response.access_token, response.refresh_token || null);

      // If user data is not in response, fetch it separately
      let userData = response.user as User | undefined;
      if (!userData && response.access_token) {
        try {
          userData = await authAPI.getCurrentUser() as User;
          setUser(userData);
        } catch (fetchErr) {
          logger.error('Failed to fetch user data:', fetchErr);
          // Even if we can't get user data, login was successful
          setUser({ email } as User); // Set minimal user data
        }
      } else if (userData) {
        setUser(userData);
      } else {
        setUser({ email } as User); // Set minimal user data
      }

      return { success: true, user: userData || ({ email } as User) };
    } catch (err) {
      setError((err as Error).message);
      return { success: false, error: (err as Error).message };
    }
  };

  const logout = useCallback(async (): Promise<void> => {
    try {
      await authAPI.logout();
    } catch (err) {
      logger.error('Logout error:', err);
    } finally {
      tokenStorage.clearTokens();
      setUser(null);
    }
  }, []);

  // Auto-logout on idle + periodic session validation
  useSessionGuard(!!user, logout);

  const verifyEmail = async (code: string): Promise<AuthResult> => {
    setError(null);
    try {
      await authAPI.verifyEmail(code);
      // Refresh user data after verification
      const userData = await authAPI.getCurrentUser() as User;
      setUser(userData);
      return { success: true };
    } catch (err) {
      setError((err as Error).message);
      return { success: false, error: (err as Error).message };
    }
  };

  const forgotPassword = async (email: string): Promise<AuthResult> => {
    setError(null);
    try {
      const response = await authAPI.forgotPassword(email);
      return { success: true, data: response };
    } catch (err) {
      const error = err as Error & { retryAfter?: number };
      setError(error.message);
      return { success: false, error: error.message, data: { retryAfter: error.retryAfter } };
    }
  };

  const resetPassword = async (token: string, newPassword: string): Promise<AuthResult> => {
    setError(null);
    try {
      await authAPI.resetPassword(token, newPassword);
      return { success: true };
    } catch (err) {
      setError((err as Error).message);
      return { success: false, error: (err as Error).message };
    }
  };

  // Set password with auto-login (for password reset and invitation acceptance)
  const setPassword = async (token: string, newPassword: string, firstName: string | null = null, lastName: string | null = null): Promise<AuthResult> => {
    setError(null);
    try {
      const response = await authAPI.setPassword(token, newPassword, firstName, lastName);
      // Auto-login with returned tokens
      if (response.access_token && response.refresh_token) {
        tokenStorage.setTokens(response.access_token, response.refresh_token);
        // Fetch user data
        const userData = await authAPI.getCurrentUser() as User;
        setUser(userData);
      }
      return { success: true, data: response };
    } catch (err) {
      setError((err as Error).message);
      return { success: false, error: (err as Error).message };
    }
  };

  const googleLogin = async (redirectPath?: string): Promise<AuthResult> => {
    setError(null);
    try {
      const { url } = await authAPI.getGoogleAuthUrl(redirectPath);
      window.location.href = url;
      return { success: true };
    } catch (err) {
      setError((err as Error).message);
      return { success: false, error: (err as Error).message };
    }
  };

  const handleGoogleCallback = async (code: string): Promise<AuthResult> => {
    setError(null);
    try {
      const response = await authAPI.googleAuth(code);
      tokenStorage.setTokens(response.access_token, response.refresh_token);
      setUser(response.user as User);
      return { success: true, user: response.user as User };
    } catch (err) {
      setError((err as Error).message);
      return { success: false, error: (err as Error).message };
    }
  };

  const updateUser = (updatedData: Partial<User>): void => {
    setUser(prev => prev ? { ...prev, ...updatedData } : null);
  };

  // Allow external components to set tokens (e.g., after email verification)
  const setTokensAndFetchUser = async (accessToken: string, refreshToken: string): Promise<void> => {
    tokenStorage.setTokens(accessToken, refreshToken);
    // Fetch user data with new tokens
    try {
      const userData = await authAPI.getCurrentUser() as User;
      setUser(userData);
    } catch (err) {
      logger.error('Failed to fetch user after setting tokens:', err);
    }
  };

  const value: AuthContextValue = {
    user,
    loading,
    error,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'ADMIN',
    signup,
    login,
    logout,
    verifyEmail,
    forgotPassword,
    resetPassword,
    setPassword,
    googleLogin,
    handleGoogleCallback,
    checkAuth,
    updateUser,
    setTokens: setTokensAndFetchUser
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
