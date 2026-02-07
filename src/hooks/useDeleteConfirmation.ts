import { useState, useCallback } from 'react';

interface DeleteConfirmationState<T = unknown> {
  isOpen: boolean;
  item: T | null;
  loading: boolean;
}

interface UseDeleteConfirmationReturn<T = unknown> {
  isOpen: boolean;
  item: T | null;
  loading: boolean;
  requestDelete: (item: T) => void;
  confirmDelete: (onDelete: (item: T) => Promise<void>) => Promise<void>;
  cancelDelete: () => void;
}

export function useDeleteConfirmation<T = unknown>(): UseDeleteConfirmationReturn<T> {
  const [state, setState] = useState<DeleteConfirmationState<T>>({
    isOpen: false,
    item: null,
    loading: false,
  });

  const requestDelete = useCallback((item: T) => {
    setState({ isOpen: true, item, loading: false });
  }, []);

  const confirmDelete = useCallback(async (onDelete: (item: T) => Promise<void>) => {
    if (!state.item) return;
    setState(prev => ({ ...prev, loading: true }));
    try {
      await onDelete(state.item);
      setState({ isOpen: false, item: null, loading: false });
    } catch (error) {
      setState(prev => ({ ...prev, loading: false }));
      throw error;
    }
  }, [state.item]);

  const cancelDelete = useCallback(() => {
    setState({ isOpen: false, item: null, loading: false });
  }, []);

  return {
    isOpen: state.isOpen,
    item: state.item,
    loading: state.loading,
    requestDelete,
    confirmDelete,
    cancelDelete,
  };
}
