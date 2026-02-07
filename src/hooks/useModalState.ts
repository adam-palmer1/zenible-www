import { useState, useCallback } from 'react';

interface ModalState<T = unknown> {
  isOpen: boolean;
  data: T | null;
}

interface UseModalStateReturn<T = unknown> {
  isOpen: boolean;
  data: T | null;
  open: (data?: T) => void;
  close: () => void;
  toggle: () => void;
}

export function useModalState<T = unknown>(initialOpen = false): UseModalStateReturn<T> {
  const [state, setState] = useState<ModalState<T>>({
    isOpen: initialOpen,
    data: null,
  });

  const open = useCallback((data?: T) => {
    setState({ isOpen: true, data: data ?? null });
  }, []);

  const close = useCallback(() => {
    setState({ isOpen: false, data: null });
  }, []);

  const toggle = useCallback(() => {
    setState(prev => ({ ...prev, isOpen: !prev.isOpen }));
  }, []);

  return {
    isOpen: state.isOpen,
    data: state.data,
    open,
    close,
    toggle,
  };
}
