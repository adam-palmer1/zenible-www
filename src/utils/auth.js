// Auth utility functions for token management and API calls

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';

// Token storage
export const tokenStorage = {
  getAccessToken: () => localStorage.getItem('access_token'),
  getRefreshToken: () => localStorage.getItem('refresh_token'),
  setTokens: (accessToken, refreshToken) => {
    localStorage.setItem('access_token', accessToken);
    localStorage.setItem('refresh_token', refreshToken);
  },
  clearTokens: () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
  }
};

// Refresh access token
export async function refreshAccessToken() {
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
    console.error('Token refresh failed:', error);
    tokenStorage.clearTokens();
    return null;
  }
}

// Make authenticated API request with automatic token refresh
export async function makeAuthenticatedRequest(url, options = {}) {
  let accessToken = tokenStorage.getAccessToken();
  
  if (!accessToken) {
    throw new Error('No access token available');
  }

  const makeRequest = async (token) => {
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
      // Redirect to signin if refresh fails
      window.location.href = '/signin';
      throw new Error('Authentication failed');
    }
  }

  return response;
}

// Auth API calls
export const authAPI = {
  async signup(email, password) {
    const response = await fetch(`${API_BASE_URL}/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Registration failed');
    }
    
    return response.json();
  },

  async login(email, password) {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Login failed');
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
        console.error('Logout error:', error);
      }
    }
    tokenStorage.clearTokens();
  },

  async verifyEmail(code) {
    const response = await makeAuthenticatedRequest(`${API_BASE_URL}/auth/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code })
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Verification failed');
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

  async forgotPassword(email) {
    const response = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Request failed');
    }
    
    return response.json();
  },

  async resetPassword(token, newPassword) {
    const response = await fetch(`${API_BASE_URL}/auth/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, new_password: newPassword })
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Reset failed');
    }
    
    return response.json();
  },

  async getGoogleAuthUrl() {
    const response = await fetch(`${API_BASE_URL}/auth/google/url`);
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to get Google auth URL');
    }
    
    return response.json();
  },

  async googleAuth(code) {
    const response = await fetch(`${API_BASE_URL}/auth/google`, {
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

  async createCheckoutSession(planId, successUrl, cancelUrl) {
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

  async updateSubscription(planId, changeImmediately = false) {
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

  async previewProration(newPlanId) {
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

  async createUser(userData) {
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

  async updateUser(userId, updates) {
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

  async deleteUser(userId) {
    const response = await makeAuthenticatedRequest(`${API_BASE_URL}/admin/users/${userId}`, {
      method: 'DELETE'
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to delete user');
    }
    
    return response.json();
  },

  async resetUserPassword(userId, newPassword) {
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

  async createPlan(planData) {
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

  async assignCollectionToPlan(planId, collectionId) {
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