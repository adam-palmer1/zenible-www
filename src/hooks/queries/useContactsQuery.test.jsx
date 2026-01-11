import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useContactsQuery, useContactQuery, useContactsList } from './useContactsQuery';
import { contactsAPI } from '../../services/api/crm';

// Mock the API
vi.mock('../../services/api/crm', () => ({
  contactsAPI: {
    list: vi.fn(),
    get: vi.fn(),
  },
}));

// Helper to create a wrapper with QueryClient
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false, // Disable retries for tests
      },
    },
  });

  return ({ children }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe('useContactsQuery', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches contacts successfully', async () => {
    const mockResponse = {
      items: [
        { id: '1', first_name: 'John', last_name: 'Doe' },
        { id: '2', first_name: 'Jane', last_name: 'Smith' },
      ],
      page: 1,
      per_page: 20,
      total: 2,
      total_pages: 1,
    };

    contactsAPI.list.mockResolvedValue(mockResponse);

    const { result } = renderHook(() => useContactsQuery(), {
      wrapper: createWrapper(),
    });

    // Initial state: loading
    expect(result.current.isLoading).toBe(true);
    expect(result.current.data).toBeUndefined();

    // Wait for query to complete
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    // Verify data
    expect(result.current.data).toEqual(mockResponse);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(contactsAPI.list).toHaveBeenCalledWith({});
    expect(contactsAPI.list).toHaveBeenCalledTimes(1);
  });

  it('applies filters correctly', async () => {
    const filters = {
      search: 'John',
      is_client: true,
    };

    const mockResponse = {
      items: [{ id: '1', first_name: 'John', last_name: 'Doe' }],
      page: 1,
      per_page: 20,
      total: 1,
      total_pages: 1,
    };

    contactsAPI.list.mockResolvedValue(mockResponse);

    renderHook(() => useContactsQuery(filters), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(contactsAPI.list).toHaveBeenCalled());

    expect(contactsAPI.list).toHaveBeenCalledWith(filters);
  });

  it('handles errors correctly', async () => {
    const error = new Error('Failed to fetch contacts');
    contactsAPI.list.mockRejectedValue(error);

    const { result } = renderHook(() => useContactsQuery(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error).toEqual(error);
    expect(result.current.data).toBeUndefined();
  });

  it('caches data correctly (request deduplication)', async () => {
    const mockResponse = {
      items: [{ id: '1', first_name: 'John', last_name: 'Doe' }],
      page: 1,
      per_page: 20,
      total: 1,
      total_pages: 1,
    };

    contactsAPI.list.mockResolvedValue(mockResponse);

    // Render two hooks with the same query key
    const { result: result1 } = renderHook(() => useContactsQuery(), {
      wrapper: createWrapper(),
    });

    const { result: result2 } = renderHook(() => useContactsQuery(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result1.current.isSuccess).toBe(true);
      expect(result2.current.isSuccess).toBe(true);
    });

    // API should only be called once due to request deduplication
    expect(contactsAPI.list).toHaveBeenCalledTimes(1);
    expect(result1.current.data).toEqual(result2.current.data);
  });
});

describe('useContactQuery', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches single contact successfully', async () => {
    const mockContact = {
      id: '1',
      first_name: 'John',
      last_name: 'Doe',
      email: 'john@example.com',
    };

    contactsAPI.get.mockResolvedValue(mockContact);

    const { result } = renderHook(() => useContactQuery('1'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual(mockContact);
    expect(contactsAPI.get).toHaveBeenCalledWith('1');
  });

  it('does not fetch when contactId is null', () => {
    const { result } = renderHook(() => useContactQuery(null), {
      wrapper: createWrapper(),
    });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.data).toBeUndefined();
    expect(contactsAPI.get).not.toHaveBeenCalled();
  });

  it('handles errors correctly', async () => {
    const error = new Error('Contact not found');
    contactsAPI.get.mockRejectedValue(error);

    const { result } = renderHook(() => useContactQuery('1'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error).toEqual(error);
  });
});

describe('useContactsList', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('provides contacts array directly', async () => {
    const mockResponse = {
      items: [
        { id: '1', first_name: 'John', last_name: 'Doe' },
        { id: '2', first_name: 'Jane', last_name: 'Smith' },
      ],
      page: 1,
      per_page: 20,
      total: 2,
      total_pages: 1,
    };

    contactsAPI.list.mockResolvedValue(mockResponse);

    const { result } = renderHook(() => useContactsList(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    // Should provide contacts array directly
    expect(result.current.contacts).toEqual(mockResponse.items);
    expect(result.current.pagination).toEqual({
      page: 1,
      per_page: 20,
      total: 2,
      total_pages: 1,
    });
  });

  it('returns empty array when no data', () => {
    contactsAPI.list.mockResolvedValue({ items: [] });

    const { result } = renderHook(() => useContactsList(), {
      wrapper: createWrapper(),
    });

    // Before data loads
    expect(result.current.contacts).toEqual([]);
    expect(result.current.pagination.total).toBe(0);
  });
});
