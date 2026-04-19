import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('@/utils/logger', () => ({
  default: { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

// Stub env vars the module reads at import time.
vi.mock('@/config/api', () => ({
  API_BASE_URL: 'https://api.test',
  ZBI_API_BASE_URL: 'https://zbi.test',
}));

import { cleanParams, buildQueryString, createRequest, ApiError, NetworkError } from './httpClient';

describe('cleanParams', () => {
  it('drops null, undefined, empty-string, and literal "null"', () => {
    expect(cleanParams({ a: 1, b: null, c: undefined, d: '', e: 'null', f: 'ok' })).toEqual({
      a: '1',
      f: 'ok',
    });
  });

  it('keeps 0 and false (stringified)', () => {
    expect(cleanParams({ zero: 0, falsy: false })).toEqual({ zero: '0', falsy: 'false' });
  });

  it('maps array values to string[]', () => {
    expect(cleanParams({ ids: [1, 2, 3] })).toEqual({ ids: ['1', '2', '3'] });
  });
});

describe('buildQueryString', () => {
  it('URI-encodes keys and values', () => {
    expect(buildQueryString({ 'q&raw': 'hello world' })).toBe('q%26raw=hello%20world');
  });

  it('repeats the key for array values (PHP-style, no brackets)', () => {
    expect(buildQueryString({ ids: ['a', 'b'] })).toBe('ids=a&ids=b');
  });

  it('drops cleanParams-rejected entries', () => {
    expect(buildQueryString({ a: 1, b: null, c: '' })).toBe('a=1');
  });

  it('returns empty string for an empty object', () => {
    expect(buildQueryString({})).toBe('');
  });
});

describe('request function — response parsing', () => {
  const originalFetch = global.fetch;
  let mockFetch: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockFetch = vi.fn();
    global.fetch = mockFetch as unknown as typeof fetch;
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('returns parsed JSON on success', async () => {
    mockFetch.mockResolvedValue(new Response(JSON.stringify({ ok: 1 }), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    }));

    const request = createRequest('Test');
    const result = await request<{ ok: number }>('/items');
    expect(result).toEqual({ ok: 1 });
  });

  it('returns null for 204 No Content', async () => {
    mockFetch.mockResolvedValue(new Response(null, { status: 204 }));

    const request = createRequest('Test');
    const result = await request('/items/1', { method: 'DELETE' });
    expect(result).toBeNull();
  });

  it('throws ApiError with server message on 4xx', async () => {
    mockFetch.mockResolvedValue(new Response(JSON.stringify({ detail: 'Not authorized' }), {
      status: 401,
      statusText: 'Unauthorized',
      headers: { 'content-type': 'application/json' },
    }));

    const request = createRequest('Test');
    await expect(request('/items')).rejects.toMatchObject({
      name: 'ApiError',
      status: 401,
      message: 'Not authorized',
    });
  });

  it('throws ApiError with joined Pydantic validation message on 422', async () => {
    mockFetch.mockResolvedValue(new Response(JSON.stringify({
      detail: [
        { loc: ['body', 'email'], msg: 'value is not a valid email address' },
        { loc: ['body', 'name'], msg: 'field required' },
      ],
    }), {
      status: 422,
      statusText: 'Unprocessable Entity',
      headers: { 'content-type': 'application/json' },
    }));

    const request = createRequest('Test');
    await expect(request('/items', { method: 'POST' })).rejects.toMatchObject({
      status: 422,
      message: expect.stringContaining('email: value is not a valid email address'),
    });
  });

  it('surfaces parse error message instead of silently discarding when the error body is not JSON', async () => {
    // Non-JSON body on an error response — pre-fix behaviour was to swallow silently.
    mockFetch.mockResolvedValue(new Response('<html><body>500 Internal</body></html>', {
      status: 500,
      statusText: 'Internal Server Error',
    }));

    const request = createRequest('Test');
    await expect(request('/items')).rejects.toMatchObject({
      status: 500,
      message: expect.stringMatching(/unparseable response body|status 500/i),
    });
  });

  it('throws ApiError when a success response has malformed JSON', async () => {
    mockFetch.mockResolvedValue(new Response('not valid json', {
      status: 200,
      headers: { 'content-type': 'application/json' },
    }));

    const request = createRequest('Test');
    await expect(request('/items')).rejects.toMatchObject({
      name: 'ApiError',
      message: 'Malformed response body (expected JSON)',
    });
  });

  it('sends Authorization header when access_token exists', async () => {
    localStorage.setItem('access_token', 'bearer-abc');
    mockFetch.mockResolvedValue(new Response('{}', {
      status: 200,
      headers: { 'content-type': 'application/json' },
    }));

    const request = createRequest('Test');
    await request('/items');
    const [, init] = mockFetch.mock.calls[0];
    expect((init as RequestInit).headers).toMatchObject({
      Authorization: 'Bearer bearer-abc',
    });
    localStorage.removeItem('access_token');
  });

  it('wraps offline fetch failures as NetworkError', async () => {
    // Force navigator.onLine false, throw TypeError (what fetch does when offline).
    const originalOnLine = Object.getOwnPropertyDescriptor(Navigator.prototype, 'onLine');
    Object.defineProperty(navigator, 'onLine', { configurable: true, get: () => false });
    mockFetch.mockRejectedValue(new TypeError('Failed to fetch'));

    const request = createRequest('Test');
    await expect(request('/items')).rejects.toBeInstanceOf(NetworkError);

    // Restore.
    if (originalOnLine) Object.defineProperty(Navigator.prototype, 'onLine', originalOnLine);
  });

  it('falls through non-TypeError errors untouched', async () => {
    const custom = new Error('custom failure');
    mockFetch.mockRejectedValue(custom);

    const request = createRequest('Test');
    await expect(request('/items')).rejects.toBe(custom);
  });
});

describe('ApiError convenience getters', () => {
  it('categorises HTTP statuses', () => {
    expect(new ApiError('x', 404, 'Not Found').isNotFound).toBe(true);
    expect(new ApiError('x', 401, '').isUnauthorized).toBe(true);
    expect(new ApiError('x', 403, '').isForbidden).toBe(true);
    expect(new ApiError('x', 422, '').isValidationError).toBe(true);
    expect(new ApiError('x', 500, '').isServerError).toBe(true);
  });

  it('isInsufficientPermissions requires matching data payload', () => {
    const err = new ApiError('nope', 403, 'Forbidden', { type: 'insufficient_permissions' });
    expect(err.isInsufficientPermissions).toBe(true);
    const err2 = new ApiError('nope', 403, 'Forbidden', { type: 'something_else' });
    expect(err2.isInsufficientPermissions).toBe(false);
  });
});
