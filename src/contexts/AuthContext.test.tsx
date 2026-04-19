import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, act, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from './AuthContext';

/*
 * Module-level mocks must be declared before the SUT imports resolve them.
 * vi.mock is hoisted, so these take effect for `AuthContext.tsx`'s own imports.
 */

// Mock useSessionGuard — it installs idle timers we don't want in tests.
vi.mock('../hooks/useSessionGuard', () => ({
  useSessionGuard: () => {},
}));

// Mock logger — side effects shouldn't leak to the test console.
vi.mock('../utils/logger', () => ({
  default: { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

// Mock authAPI + twoFactorAPI + tokenStorage.
// vi.hoisted ensures these mock objects exist *before* vi.mock factories run.
const { mockAuthAPI, mockTwoFactorAPI, mockTokenStorage } = vi.hoisted(() => ({
  mockAuthAPI: {
    getCurrentUser: vi.fn(),
    login: vi.fn(),
    logout: vi.fn(),
    signup: vi.fn(),
    verifyEmail: vi.fn(),
    forgotPassword: vi.fn(),
    resetPassword: vi.fn(),
    setPassword: vi.fn(),
    googleLogin: vi.fn(),
    handleGoogleCallback: vi.fn(),
  },
  mockTwoFactorAPI: {
    verify: vi.fn(),
  },
  mockTokenStorage: {
    getAccessToken: vi.fn(),
    getRefreshToken: vi.fn(),
    setTokens: vi.fn(),
    clearTokens: vi.fn(),
  },
}));

vi.mock('../utils/auth', () => ({
  authAPI: mockAuthAPI,
  twoFactorAPI: mockTwoFactorAPI,
  tokenStorage: mockTokenStorage,
}));

/** Helper component that exposes the full auth context via a render prop. */
function exposeAuth({ onReady }: { onReady: (ctx: ReturnType<typeof useAuth>) => void }) {
  const ctx = useAuth();
  onReady(ctx);
  return (
    <div>
      <span data-testid="user">{ctx.user?.email ?? 'none'}</span>
      <span data-testid="loading">{ctx.loading ? 'loading' : 'idle'}</span>
      <span data-testid="is-authenticated">{ctx.isAuthenticated ? 'yes' : 'no'}</span>
      <span data-testid="is-admin">{ctx.isAdmin ? 'yes' : 'no'}</span>
    </div>
  );
}

function renderWithAuth(captured: { current: ReturnType<typeof useAuth> | null }) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const spy = vi.spyOn(queryClient, 'clear');
  const utils = render(
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <exposeAuth.OnReady onReady={(ctx) => { captured.current = ctx; }} />
      </AuthProvider>
    </QueryClientProvider>,
  );
  return { ...utils, queryClient, clearSpy: spy };
}

// Give the component a displayName so RTL can find it.
// eslint-disable-next-line @typescript-eslint/no-namespace
namespace exposeAuth {
  export const OnReady = exposeAuth;
}

describe('AuthContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('initial checkAuth', () => {
    it('stays unauthenticated when there is no access token', async () => {
      mockTokenStorage.getAccessToken.mockReturnValue(null);

      const captured: { current: ReturnType<typeof useAuth> | null } = { current: null };
      renderWithAuth(captured);

      await waitFor(() => {
        expect(screen.getByTestId('loading').textContent).toBe('idle');
      });
      expect(screen.getByTestId('user').textContent).toBe('none');
      expect(screen.getByTestId('is-authenticated').textContent).toBe('no');
      expect(mockAuthAPI.getCurrentUser).not.toHaveBeenCalled();
    });

    it('fetches user when access token is present', async () => {
      mockTokenStorage.getAccessToken.mockReturnValue('valid-token');
      mockAuthAPI.getCurrentUser.mockResolvedValue({ id: '1', email: 'a@b.com', role: 'USER' });

      const captured: { current: ReturnType<typeof useAuth> | null } = { current: null };
      renderWithAuth(captured);

      await waitFor(() => {
        expect(screen.getByTestId('user').textContent).toBe('a@b.com');
      });
      expect(screen.getByTestId('is-authenticated').textContent).toBe('yes');
    });

    it('clears tokens AND query cache when getCurrentUser fails', async () => {
      mockTokenStorage.getAccessToken.mockReturnValue('stale-token');
      mockAuthAPI.getCurrentUser.mockRejectedValue(new Error('401 Unauthorized'));

      const captured: { current: ReturnType<typeof useAuth> | null } = { current: null };
      const { clearSpy } = renderWithAuth(captured);

      await waitFor(() => {
        expect(mockTokenStorage.clearTokens).toHaveBeenCalled();
      });
      expect(screen.getByTestId('user').textContent).toBe('none');
      // The critical Pass 2 fix: failed auth must wipe the tanstack-query cache
      // so stale CRM/finance data from a previous session doesn't leak.
      expect(clearSpy).toHaveBeenCalled();
    });
  });

  describe('isAdmin', () => {
    it('is true when user.role === "ADMIN"', async () => {
      mockTokenStorage.getAccessToken.mockReturnValue('t');
      mockAuthAPI.getCurrentUser.mockResolvedValue({ id: '1', email: 'x@y.com', role: 'ADMIN' });

      renderWithAuth({ current: null });
      await waitFor(() => {
        expect(screen.getByTestId('is-admin').textContent).toBe('yes');
      });
    });

    it('is false for non-admin roles', async () => {
      mockTokenStorage.getAccessToken.mockReturnValue('t');
      mockAuthAPI.getCurrentUser.mockResolvedValue({ id: '1', email: 'x@y.com', role: 'USER' });

      renderWithAuth({ current: null });
      await waitFor(() => {
        expect(screen.getByTestId('is-admin').textContent).toBe('no');
      });
    });
  });

  describe('logout', () => {
    it('clears tokens, user state, AND query cache', async () => {
      mockTokenStorage.getAccessToken.mockReturnValue('t');
      mockAuthAPI.getCurrentUser.mockResolvedValue({ id: '1', email: 'a@b.com', role: 'USER' });
      mockAuthAPI.logout.mockResolvedValue(undefined);

      const captured: { current: ReturnType<typeof useAuth> | null } = { current: null };
      const { clearSpy } = renderWithAuth(captured);

      await waitFor(() => {
        expect(screen.getByTestId('user').textContent).toBe('a@b.com');
      });

      clearSpy.mockClear();
      await act(async () => {
        await captured.current!.logout();
      });

      expect(mockAuthAPI.logout).toHaveBeenCalled();
      expect(mockTokenStorage.clearTokens).toHaveBeenCalled();
      expect(screen.getByTestId('user').textContent).toBe('none');
      // This is the Pass 2 H1 regression guard.
      expect(clearSpy).toHaveBeenCalled();
    });

    it('still clears tokens + cache if server logout errors', async () => {
      mockTokenStorage.getAccessToken.mockReturnValue('t');
      mockAuthAPI.getCurrentUser.mockResolvedValue({ id: '1', email: 'a@b.com' });
      mockAuthAPI.logout.mockRejectedValue(new Error('network fail'));

      const captured: { current: ReturnType<typeof useAuth> | null } = { current: null };
      const { clearSpy } = renderWithAuth(captured);

      await waitFor(() => {
        expect(screen.getByTestId('user').textContent).toBe('a@b.com');
      });

      clearSpy.mockClear();
      await act(async () => {
        await captured.current!.logout();
      });

      // finally block must still run.
      expect(mockTokenStorage.clearTokens).toHaveBeenCalled();
      expect(clearSpy).toHaveBeenCalled();
      expect(screen.getByTestId('user').textContent).toBe('none');
    });
  });

  describe('login', () => {
    it('stores tokens and sets user on success', async () => {
      mockTokenStorage.getAccessToken.mockReturnValue(null);
      mockAuthAPI.login.mockResolvedValue({
        access_token: 'new-token',
        refresh_token: 'new-refresh',
        user: { id: '2', email: 'new@user.com' },
      });

      const captured: { current: ReturnType<typeof useAuth> | null } = { current: null };
      renderWithAuth(captured);
      await waitFor(() => expect(screen.getByTestId('loading').textContent).toBe('idle'));

      await act(async () => {
        const res = await captured.current!.login('new@user.com', 'pw');
        expect(res.success).toBe(true);
      });

      expect(mockTokenStorage.setTokens).toHaveBeenCalledWith('new-token', 'new-refresh');
      expect(screen.getByTestId('user').textContent).toBe('new@user.com');
    });

    it('returns requires2FA when login responds with a challenge', async () => {
      mockTokenStorage.getAccessToken.mockReturnValue(null);
      mockAuthAPI.login.mockResolvedValue({
        requires_2fa: true,
        challenge_token: 'challenge-abc',
      });

      const captured: { current: ReturnType<typeof useAuth> | null } = { current: null };
      renderWithAuth(captured);
      await waitFor(() => expect(screen.getByTestId('loading').textContent).toBe('idle'));

      let result!: Awaited<ReturnType<NonNullable<typeof captured.current>['login']>>;
      await act(async () => {
        result = await captured.current!.login('new@user.com', 'pw');
      });
      expect(result!.success).toBe(false);
      expect(result!.requires2FA).toBe(true);
      expect(result!.challengeToken).toBe('challenge-abc');
      expect(mockTokenStorage.setTokens).not.toHaveBeenCalled();
    });

    it('returns error on failure', async () => {
      mockTokenStorage.getAccessToken.mockReturnValue(null);
      mockAuthAPI.login.mockRejectedValue(new Error('Invalid credentials'));

      const captured: { current: ReturnType<typeof useAuth> | null } = { current: null };
      renderWithAuth(captured);
      await waitFor(() => expect(screen.getByTestId('loading').textContent).toBe('idle'));

      let result!: Awaited<ReturnType<NonNullable<typeof captured.current>['login']>>;
      await act(async () => {
        result = await captured.current!.login('bad@user.com', 'wrong');
      });
      expect(result!.success).toBe(false);
      expect(result!.error).toBe('Invalid credentials');
    });
  });

  describe('verify2FA', () => {
    it('stores tokens and fetches user after successful 2FA', async () => {
      mockTokenStorage.getAccessToken.mockReturnValue(null);
      mockTwoFactorAPI.verify.mockResolvedValue({
        access_token: '2fa-token',
        refresh_token: '2fa-refresh',
      });
      mockAuthAPI.getCurrentUser.mockResolvedValue({ id: '3', email: '2fa@user.com' });

      const captured: { current: ReturnType<typeof useAuth> | null } = { current: null };
      renderWithAuth(captured);
      await waitFor(() => expect(screen.getByTestId('loading').textContent).toBe('idle'));

      await act(async () => {
        await captured.current!.verify2FA('challenge-token', '123456', true);
      });

      expect(mockTwoFactorAPI.verify).toHaveBeenCalledWith('challenge-token', '123456', true);
      expect(mockTokenStorage.setTokens).toHaveBeenCalledWith('2fa-token', '2fa-refresh');
      expect(screen.getByTestId('user').textContent).toBe('2fa@user.com');
    });
  });

  describe('cross-tab sync', () => {
    it('drops user state when access_token is removed from another tab', async () => {
      mockTokenStorage.getAccessToken.mockReturnValue('t');
      mockAuthAPI.getCurrentUser.mockResolvedValue({ id: '1', email: 'a@b.com' });

      const captured: { current: ReturnType<typeof useAuth> | null } = { current: null };
      renderWithAuth(captured);
      await waitFor(() => expect(screen.getByTestId('user').textContent).toBe('a@b.com'));

      await act(async () => {
        window.dispatchEvent(new StorageEvent('storage', {
          key: 'access_token',
          oldValue: 't',
          newValue: null,
        }));
      });
      expect(screen.getByTestId('user').textContent).toBe('none');
    });

    it('ignores storage events for other keys', async () => {
      mockTokenStorage.getAccessToken.mockReturnValue('t');
      mockAuthAPI.getCurrentUser.mockResolvedValue({ id: '1', email: 'a@b.com' });

      renderWithAuth({ current: null });
      await waitFor(() => expect(screen.getByTestId('user').textContent).toBe('a@b.com'));

      await act(async () => {
        window.dispatchEvent(new StorageEvent('storage', {
          key: 'some_other_key',
          oldValue: 'x',
          newValue: null,
        }));
      });
      expect(screen.getByTestId('user').textContent).toBe('a@b.com');
    });
  });
});
