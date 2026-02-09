// Auth utility functions for token management and API calls
import { API_BASE_URL } from '@/config/api';
import logger from '@/utils/logger';

export function isValidInternalRedirect(path: string | null): boolean {
  if (!path) return false;
  // Must start with / but not // (protocol-relative URL)
  if (!path.startsWith('/') || path.startsWith('//')) return false;
  // Must not contain protocol
  try {
    const url = new URL(path, window.location.origin);
    return url.origin === window.location.origin;
  } catch {
    return false;
  }
}

// Token storage
export const tokenStorage = {
  getAccessToken: (): string | null => localStorage.getItem('access_token'),
  getRefreshToken: (): string | null => localStorage.getItem('refresh_token'),
  setTokens: (accessToken: string, refreshToken: string): void => {
    localStorage.setItem('access_token', accessToken);
    localStorage.setItem('refresh_token', refreshToken);
  },
  clearTokens: (): void => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
  }
};

// Refresh access token
export async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = tokenStorage.getRefreshToken();
  if (!refreshToken) return null;

  try {
    const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: refreshToken })
    });

    if (!response.ok) {
      tokenStorage.clearTokens();
      return null;
    }

    const data = await response.json();
    tokenStorage.setTokens(data.access_token, refreshToken);
    return data.access_token;
  } catch (error) {
    logger.error('Token refresh failed:', error);
    tokenStorage.clearTokens();
    return null;
  }
}

// Make authenticated API request with automatic token refresh
export async function makeAuthenticatedRequest(url: string, options: RequestInit = {}): Promise<Response> {
  let accessToken = tokenStorage.getAccessToken();

  if (!accessToken) {
    throw new Error('No access token available');
  }

  const makeRequest = async (token: string): Promise<Response> => {
    return await fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        'Authorization': `Bearer ${token}`
      }
    });
  };

  let response = await makeRequest(accessToken);

  // If unauthorized, try refreshing token
  if (response.status === 401) {
    const newToken = await refreshAccessToken();
    if (newToken) {
      response = await makeRequest(newToken);
    } else {
      // Redirect to signin if refresh fails, preserve current path as redirect
      const currentPath = window.location.pathname + window.location.search;
      const redirectParam = currentPath !== '/signin' && isValidInternalRedirect(currentPath) ? `?redirect=${encodeURIComponent(currentPath)}` : '';
      window.location.href = `/signin${redirectParam}`;
      throw new Error('Authentication failed');
    }
  }

  return response;
}

// Helper to extract error message from API response
function extractErrorMessage(error: { detail?: string | Array<{ msg?: string }>; message?: string }, fallback: string): string {
  if (Array.isArray(error.detail)) {
    const messages = error.detail.map(e => {
      let msg = e.msg || '';
      msg = msg.replace(/^Value error,\s*/i, '');
      return msg;
    }).filter(Boolean);
    return messages.join('. ') || fallback;
  }
  return (typeof error.detail === 'string' ? error.detail : error.message) || fallback;
}

// Auth API calls
export const authAPI = {
  async signup(email: string, password: string, firstName: string, lastName: string | null = null) {
    const body: Record<string, string> = { email, password, first_name: firstName };
    if (lastName) body.last_name = lastName;

    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(extractErrorMessage(error, 'Registration failed'));
    }

    return response.json();
  },

  async login(email: string, password: string) {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(extractErrorMessage(error, 'Login failed'));
    }

    return response.json();
  },

  async logout() {
    const accessToken = tokenStorage.getAccessToken();
    if (accessToken) {
      try {
        await fetch(`${API_BASE_URL}/auth/logout`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${accessToken}` }
        });
      } catch (error) {
        logger.error('Logout error:', error);
      }
    }
    tokenStorage.clearTokens();
  },

  async verifyEmail(code: string) {
    const response = await makeAuthenticatedRequest(`${API_BASE_URL}/auth/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(extractErrorMessage(error, 'Verification failed'));
    }

    return response.json();
  },

  async getCurrentUser() {
    const response = await makeAuthenticatedRequest(`${API_BASE_URL}/auth/me`);

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to get user');
    }

    return response.json();
  },

  async forgotPassword(email: string) {
    const response = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });

    if (!response.ok) {
      const error = await response.json();
      if (response.status === 429) {
        const detail = error.detail;
        const retryAfter = typeof detail === 'object' ? detail.retry_after : 60;
        const err = new Error(typeof detail === 'object' ? detail.message : 'Please wait before requesting another password reset');
        (err as Error & { retryAfter?: number }).retryAfter = retryAfter;
        throw err;
      }
      throw new Error(extractErrorMessage(error, 'Request failed'));
    }

    return response.json();
  },

  async setPassword(token: string, newPassword: string, firstName: string | null = null, lastName: string | null = null) {
    const body: Record<string, string> = { token, new_password: newPassword };
    if (firstName) body.first_name = firstName;
    if (lastName) body.last_name = lastName;

    const response = await fetch(`${API_BASE_URL}/auth/set-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(extractErrorMessage(error, 'Failed to set password'));
    }

    return response.json();
  },

  // Legacy endpoint - returns user data without auto-login
  async resetPassword(token: string, newPassword: string) {
    const response = await fetch(`${API_BASE_URL}/auth/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, new_password: newPassword })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(extractErrorMessage(error, 'Reset failed'));
    }

    return response.json();
  },

  async getGoogleAuthUrl(redirectPath?: string) {
    const url = new URL(`${API_BASE_URL}/auth/google/url`);
    if (redirectPath) {
      url.searchParams.set('redirect_path', redirectPath);
    }

    const response = await fetch(url);

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to get Google auth URL');
    }

    return response.json();
  },

  async googleAuth(code: string) {
    const response = await fetch(`${API_BASE_URL}/auth/google/callback`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Google auth failed');
    }

    return response.json();
  }
};

// Subscription API calls
export const subscriptionAPI = {
  async getAvailablePlans() {
    const response = await fetch(`${API_BASE_URL}/subscription/available-plans`);

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to get plans');
    }

    return response.json();
  },

  async getCurrentSubscription() {
    const response = await makeAuthenticatedRequest(`${API_BASE_URL}/subscription/current`);

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to get subscription');
    }

    return response.json();
  },

  async createCheckoutSession(planId: string, successUrl: string, cancelUrl: string) {
    const response = await makeAuthenticatedRequest(`${API_BASE_URL}/subscription/checkout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        plan_id: planId,
        success_url: successUrl,
        cancel_url: cancelUrl
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to create checkout session');
    }

    return response.json();
  },

  async updateSubscription(planId: string, changeImmediately = false) {
    const response = await makeAuthenticatedRequest(`${API_BASE_URL}/subscription/update`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        plan_id: planId,
        change_immediately: changeImmediately
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to update subscription');
    }

    return response.json();
  },

  async previewProration(newPlanId: string) {
    const response = await makeAuthenticatedRequest(`${API_BASE_URL}/subscription/preview-proration`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ new_plan_id: newPlanId })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to preview proration');
    }

    return response.json();
  },

  async cancelSubscription(reason = '', cancelImmediately = false) {
    const response = await makeAuthenticatedRequest(`${API_BASE_URL}/subscription/cancel`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        reason,
        cancel_immediately: cancelImmediately
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to cancel subscription');
    }

    return response.json();
  },

  async getUsageStats() {
    const response = await makeAuthenticatedRequest(`${API_BASE_URL}/subscription/usage`);

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to get usage stats');
    }

    return response.json();
  }
};

// User API calls
export const userAPI = {
  async checkUsernameAvailability(username: string) {
    const response = await fetch(`${API_BASE_URL}/users/username/check/${username}`);

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to check username');
    }

    return response.json();
  },

  async getCurrentUsername() {
    const response = await makeAuthenticatedRequest(`${API_BASE_URL}/users/username`);

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to get username');
    }

    return response.json();
  },

  async updateUsername(username: string) {
    const response = await makeAuthenticatedRequest(`${API_BASE_URL}/users/username`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to update username');
    }

    return response.json();
  },

  async uploadAvatar(file: File) {
    const formData = new FormData();
    formData.append('avatar', file);

    const accessToken = tokenStorage.getAccessToken();
    if (!accessToken) {
      throw new Error('No access token available');
    }

    const response = await fetch(`${API_BASE_URL}/users/avatar`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`
      },
      body: formData
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to upload avatar');
    }

    return response.json();
  },

  async deleteAvatar() {
    const response = await makeAuthenticatedRequest(`${API_BASE_URL}/users/avatar`, {
      method: 'DELETE'
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to delete avatar');
    }

    return response.json();
  },

  async updateProfile(data: Record<string, unknown>) {
    const response = await makeAuthenticatedRequest(`${API_BASE_URL}/users/profile`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to update profile');
    }

    return response.json();
  }
};

// Admin API calls
export const adminAPI = {
  async getUsers(skip = 0, limit = 20) {
    const response = await makeAuthenticatedRequest(
      `${API_BASE_URL}/admin/users?skip=${skip}&limit=${limit}`
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to get users');
    }

    return response.json();
  },

  async createUser(userData: Record<string, unknown>) {
    const response = await makeAuthenticatedRequest(`${API_BASE_URL}/admin/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to create user');
    }

    return response.json();
  },

  async updateUser(userId: string, updates: Record<string, unknown>) {
    const response = await makeAuthenticatedRequest(`${API_BASE_URL}/admin/users/${userId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to update user');
    }

    return response.json();
  },

  async deleteUser(userId: string) {
    const response = await makeAuthenticatedRequest(`${API_BASE_URL}/admin/users/${userId}`, {
      method: 'DELETE'
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to delete user');
    }

    return response.json();
  },

  async resetUserPassword(userId: string, newPassword: string) {
    const response = await makeAuthenticatedRequest(`${API_BASE_URL}/admin/users/${userId}/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ new_password: newPassword })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to reset password');
    }

    return response.json();
  },

  async createPlan(planData: Record<string, unknown>) {
    const response = await makeAuthenticatedRequest(`${API_BASE_URL}/admin/plans`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(planData)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to create plan');
    }

    return response.json();
  },

  async assignCollectionToPlan(planId: string, collectionId: string) {
    const response = await makeAuthenticatedRequest(`${API_BASE_URL}/admin/plans/${planId}/collections`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ collection_id: collectionId })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to assign collection');
    }

    return response.json();
  }
};
