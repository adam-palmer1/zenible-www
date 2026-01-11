import { useState, useCallback, useRef } from 'react';
import { useNotification } from '../contexts/NotificationContext';

/**
 * Command pattern implementation for undoable actions
 */
class Command {
  constructor(execute, undo, description) {
    this.execute = execute;
    this.undo = undo;
    this.description = description;
    this.timestamp = Date.now();
  }
}

/**
 * Hook for implementing undo/redo functionality with Command pattern
 */
export const useUndoableAction = (options = {}) => {
  const {
    maxHistorySize = 50,
    undoTimeoutMs = 10000, // 10 seconds to undo
    showUndoToast = true
  } = options;

  const [history, setHistory] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const timeoutsRef = useRef(new Map());
  const { showSuccess, showInfo } = useNotification();

  /**
   * Execute a command and add to history
   */
  const execute = useCallback(async (executeAction, undoAction, description = 'Action') => {
    try {
      // Execute the action
      const result = await executeAction();

      // Create command
      const command = new Command(executeAction, undoAction, description);

      // Add to history
      setHistory(prev => {
        // Remove any commands after current index (when undoing then executing new action)
        const newHistory = prev.slice(0, currentIndex + 1);
        newHistory.push(command);

        // Limit history size
        if (newHistory.length > maxHistorySize) {
          newHistory.shift();
        }

        return newHistory;
      });

      setCurrentIndex(prev => Math.min(prev + 1, maxHistorySize - 1));

      // Show undo toast if enabled
      if (showUndoToast && undoAction) {
        const toastId = showInfo(`${description}`, {
          action: 'Undo',
          duration: undoTimeoutMs,
          onAction: () => {
            undo();
          }
        });

        // Clear toast timeout when undo timeout expires
        const timeout = setTimeout(() => {
          timeoutsRef.current.delete(command.timestamp);
        }, undoTimeoutMs);

        timeoutsRef.current.set(command.timestamp, timeout);
      }

      return { success: true, result };
    } catch (error) {
      console.error('Failed to execute action:', error);
      return { success: false, error };
    }
  }, [currentIndex, maxHistorySize, undoTimeoutMs, showUndoToast, showInfo]);

  /**
   * Undo the last action
   */
  const undo = useCallback(async () => {
    if (currentIndex < 0) {
      console.warn('Nothing to undo');
      return { success: false, error: 'Nothing to undo' };
    }

    const command = history[currentIndex];
    if (!command || !command.undo) {
      console.warn('Command cannot be undone');
      return { success: false, error: 'Command cannot be undone' };
    }

    try {
      await command.undo();
      setCurrentIndex(prev => prev - 1);

      if (showUndoToast) {
        showSuccess(`Undone: ${command.description}`, {
          action: 'Redo',
          duration: 5000,
          onAction: () => redo()
        });
      }

      // Clear timeout for this command
      const timeout = timeoutsRef.current.get(command.timestamp);
      if (timeout) {
        clearTimeout(timeout);
        timeoutsRef.current.delete(command.timestamp);
      }

      return { success: true };
    } catch (error) {
      console.error('Failed to undo action:', error);
      return { success: false, error };
    }
  }, [currentIndex, history, showUndoToast, showSuccess]);

  /**
   * Redo the last undone action
   */
  const redo = useCallback(async () => {
    if (currentIndex >= history.length - 1) {
      console.warn('Nothing to redo');
      return { success: false, error: 'Nothing to redo' };
    }

    const command = history[currentIndex + 1];
    if (!command) {
      console.warn('No command to redo');
      return { success: false, error: 'No command to redo' };
    }

    try {
      await command.execute();
      setCurrentIndex(prev => prev + 1);

      if (showUndoToast) {
        showSuccess(`Redone: ${command.description}`);
      }

      return { success: true };
    } catch (error) {
      console.error('Failed to redo action:', error);
      return { success: false, error };
    }
  }, [currentIndex, history, showUndoToast, showSuccess]);

  /**
   * Clear all history
   */
  const clearHistory = useCallback(() => {
    // Clear all timeouts
    timeoutsRef.current.forEach(timeout => clearTimeout(timeout));
    timeoutsRef.current.clear();

    setHistory([]);
    setCurrentIndex(-1);
  }, []);

  /**
   * Check if undo is available
   */
  const canUndo = currentIndex >= 0;

  /**
   * Check if redo is available
   */
  const canRedo = currentIndex < history.length - 1;

  return {
    execute,
    undo,
    redo,
    clearHistory,
    canUndo,
    canRedo,
    history,
    currentIndex
  };
};
