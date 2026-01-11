import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  useCreateContactMutation,
  useUpdateContactMutation,
  useDeleteContactMutation,
  useChangeContactStatusMutation,
} from './useContactMutations';
import { contactsAPI } from '../../services/api/crm';
import { queryKeys } from '../../lib/query-keys';

// Mock the API
vi.mock('../../services/api/crm', () => ({
  contactsAPI: {
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
}));

// Helper to create a wrapper with QueryClient
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
      mutations: {
        retry: false,
      },
    },
  });

  // Pre-populate cache with mock data
  queryClient.setQueryData(queryKeys.contacts.list({}), {
    items: [
      { id: '1', first_name: 'John', last_name: 'Doe' },
      { id: '2', first_name: 'Jane', last_name: 'Smith' },
    ],
    page: 1,
    per_page: 20,
    total: 2,
    total_pages: 1,
  });

  return { queryClient, Wrapper: ({ children }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )};
};

describe('useCreateContactMutation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('creates contact successfully', async () => {
    const newContact = {
      id: '3',
      first_name: 'Bob',
      last_name: 'Johnson',
      email: 'bob@example.com',
    };

    contactsAPI.create.mockResolvedValue(newContact);

    const { queryClient, Wrapper } = createWrapper();
    const { result } = renderHook(() => useCreateContactMutation(), {
      wrapper: Wrapper,
    });

    // Execute mutation
    await act(async () => {
      await result.current.mutateAsync({
        first_name: 'Bob',
        last_name: 'Johnson',
        email: 'bob@example.com',
      });
    });

    expect(contactsAPI.create).toHaveBeenCalledWith({
      first_name: 'Bob',
      last_name: 'Johnson',
      email: 'bob@example.com',
    });

    expect(result.current.isSuccess).toBe(true);
    expect(result.current.data).toEqual(newContact);

    // Verify cache was invalidated
    await waitFor(() => {
      const queries = queryClient.getQueryCache().findAll(queryKeys.contacts.lists());
      // Cache should be invalidated (stale)
      expect(queries.some(q => q.state.isInvalidated)).toBe(true);
    });
  });

  it('handles errors correctly', async () => {
    const error = new Error('Validation failed');
    contactsAPI.create.mockRejectedValue(error);

    const { Wrapper } = createWrapper();
    const { result } = renderHook(() => useCreateContactMutation(), {
      wrapper: Wrapper,
    });

    await act(async () => {
      try {
        await result.current.mutateAsync({ first_name: 'Bob' });
      } catch (err) {
        // Expected to throw
      }
    });

    expect(result.current.isError).toBe(true);
    expect(result.current.error).toEqual(error);
  });
});

describe('useUpdateContactMutation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('updates contact successfully with optimistic update', async () => {
    const updatedContact = {
      id: '1',
      first_name: 'John',
      last_name: 'Updated',
      email: 'john@example.com',
    };

    contactsAPI.update.mockResolvedValue(updatedContact);

    const { queryClient, Wrapper } = createWrapper();
    const { result } = renderHook(() => useUpdateContactMutation(), {
      wrapper: Wrapper,
    });

    // Execute mutation
    await act(async () => {
      await result.current.mutateAsync({
        contactId: '1',
        data: { last_name: 'Updated' },
      });
    });

    expect(contactsAPI.update).toHaveBeenCalledWith('1', { last_name: 'Updated' });
    expect(result.current.isSuccess).toBe(true);

    // Verify cache was updated
    await waitFor(() => {
      const queries = queryClient.getQueryCache().findAll(queryKeys.contacts.lists());
      expect(queries.some(q => q.state.isInvalidated)).toBe(true);
    });
  });

  it('rolls back optimistic update on error', async () => {
    const error = new Error('Update failed');
    contactsAPI.update.mockRejectedValue(error);

    const { queryClient, Wrapper } = createWrapper();
    const { result } = renderHook(() => useUpdateContactMutation(), {
      wrapper: Wrapper,
    });

    // Get original data
    const originalData = queryClient.getQueryData(queryKeys.contacts.list({}));

    await act(async () => {
      try {
        await result.current.mutateAsync({
          contactId: '1',
          data: { last_name: 'Updated' },
        });
      } catch (err) {
        // Expected to throw
      }
    });

    expect(result.current.isError).toBe(true);

    // Cache should be restored to original data (rollback)
    await waitFor(() => {
      const currentData = queryClient.getQueryData(queryKeys.contacts.list({}));
      expect(currentData).toEqual(originalData);
    });
  });
});

describe('useDeleteContactMutation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('deletes contact successfully with optimistic update', async () => {
    contactsAPI.delete.mockResolvedValue(null);

    const { queryClient, Wrapper } = createWrapper();
    const { result } = renderHook(() => useDeleteContactMutation(), {
      wrapper: Wrapper,
    });

    await act(async () => {
      await result.current.mutateAsync('1');
    });

    expect(contactsAPI.delete).toHaveBeenCalledWith('1');
    expect(result.current.isSuccess).toBe(true);

    // Verify cache was invalidated
    await waitFor(() => {
      const queries = queryClient.getQueryCache().findAll(queryKeys.contacts.lists());
      expect(queries.some(q => q.state.isInvalidated)).toBe(true);
    });
  });

  it('rolls back optimistic delete on error', async () => {
    const error = new Error('Delete failed');
    contactsAPI.delete.mockRejectedValue(error);

    const { queryClient, Wrapper } = createWrapper();
    const { result } = renderHook(() => useDeleteContactMutation(), {
      wrapper: Wrapper,
    });

    const originalData = queryClient.getQueryData(queryKeys.contacts.list({}));

    await act(async () => {
      try {
        await result.current.mutateAsync('1');
      } catch (err) {
        // Expected to throw
      }
    });

    expect(result.current.isError).toBe(true);

    // Cache should be restored (rollback)
    await waitFor(() => {
      const currentData = queryClient.getQueryData(queryKeys.contacts.list({}));
      expect(currentData).toEqual(originalData);
    });
  });
});

describe('useChangeContactStatusMutation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('changes status successfully', async () => {
    const updatedContact = {
      id: '1',
      first_name: 'John',
      last_name: 'Doe',
      current_global_status_id: 'new-status',
      current_custom_status_id: null,
    };

    contactsAPI.update.mockResolvedValue(updatedContact);

    const { Wrapper } = createWrapper();
    const { result } = renderHook(() => useChangeContactStatusMutation(), {
      wrapper: Wrapper,
    });

    await act(async () => {
      await result.current.mutateAsync({
        contactId: '1',
        statusData: {
          current_global_status_id: 'new-status',
          current_custom_status_id: null,
        },
      });
    });

    expect(contactsAPI.update).toHaveBeenCalledWith('1', {
      current_global_status_id: 'new-status',
      current_custom_status_id: null,
    });

    expect(result.current.isSuccess).toBe(true);
    expect(result.current.data).toEqual(updatedContact);
  });
});
