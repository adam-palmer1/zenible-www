import { createContext, useContext, useState, useEffect } from 'react';
import { authAPI, tokenStorage } from '../utils/auth';

const AuthContext = createContext(null);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Check if user is logged in on mount
  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    setLoading(true);
    const accessToken = tokenStorage.getAccessToken();
    if (!accessToken) {
      setLoading(false);
      setUser(null);
      return;
    }

    try {
      const userData = await authAPI.getCurrentUser();
      setUser(userData);
    } catch (error) {
      console.error('Auth check failed:', error);
      tokenStorage.clearTokens();
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const signup = async (email, password, name) => {
    setError(null);
    try {
      const response = await authAPI.signup(email, password, name);
      tokenStorage.setTokens(response.access_token, response.refresh_token);
      setUser(response.user);
      return { success: true, user: response.user };
    } catch (error) {
      setError(error.message);
      return { success: false, error: error.message };
    }
  };

  const login = async (email, password) => {
    setError(null);
    try {
      const response = await authAPI.login(email, password);
      // Store the access token (refresh_token may not be provided)
      tokenStorage.setTokens(response.access_token, response.refresh_token || null);

      // If user data is not in response, fetch it separately
      let userData = response.user;
      if (!userData && response.access_token) {
        try {
          userData = await authAPI.getCurrentUser();
          setUser(userData);
        } catch (error) {
          console.error('Failed to fetch user data:', error);
          // Even if we can't get user data, login was successful
          setUser({ email }); // Set minimal user data
        }
      } else if (userData) {
        setUser(userData);
      } else {
        setUser({ email }); // Set minimal user data
      }

      return { success: true, user: userData || { email } };
    } catch (error) {
      setError(error.message);
      return { success: false, error: error.message };
    }
  };

  const logout = async () => {
    try {
      await authAPI.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      tokenStorage.clearTokens();
      setUser(null);
    }
  };

  const verifyEmail = async (code) => {
    setError(null);
    try {
      await authAPI.verifyEmail(code);
      // Refresh user data after verification
      const userData = await authAPI.getCurrentUser();
      setUser(userData);
      return { success: true };
    } catch (error) {
      setError(error.message);
      return { success: false, error: error.message };
    }
  };

  const forgotPassword = async (email) => {
    setError(null);
    try {
      await authAPI.forgotPassword(email);
      return { success: true };
    } catch (error) {
      setError(error.message);
      return { success: false, error: error.message };
    }
  };

  const resetPassword = async (token, newPassword) => {
    setError(null);
    try {
      await authAPI.resetPassword(token, newPassword);
      return { success: true };
    } catch (error) {
      setError(error.message);
      return { success: false, error: error.message };
    }
  };

  const googleLogin = async (redirectPath) => {
    setError(null);
    try {
      const { url } = await authAPI.getGoogleAuthUrl(redirectPath);
      window.location.href = url;
      return { success: true };
    } catch (error) {
      setError(error.message);
      return { success: false, error: error.message };
    }
  };

  const handleGoogleCallback = async (code) => {
    setError(null);
    try {
      const response = await authAPI.googleAuth(code);
      tokenStorage.setTokens(response.access_token, response.refresh_token);
      setUser(response.user);
      return { success: true, user: response.user };
    } catch (error) {
      setError(error.message);
      return { success: false, error: error.message };
    }
  };

  const updateUser = (updatedData) => {
    setUser(prev => ({ ...prev, ...updatedData }));
  };

  // Allow external components to set tokens (e.g., after email verification)
  const setTokensAndFetchUser = async (accessToken, refreshToken) => {
    tokenStorage.setTokens(accessToken, refreshToken);
    // Fetch user data with new tokens
    try {
      const userData = await authAPI.getCurrentUser();
      setUser(userData);
    } catch (error) {
      console.error('Failed to fetch user after setting tokens:', error);
    }
  };

  const value = {
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
    googleLogin,
    handleGoogleCallback,
    checkAuth,
    updateUser,
    setTokens: setTokensAndFetchUser
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}