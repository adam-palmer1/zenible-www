import { useContext } from 'react';
import { WebSocketContext, WebSocketContextValue } from '../contexts/WebSocketContext';

export const useWebSocketConnection = (): WebSocketContextValue => {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error('useWebSocketConnection must be used within WebSocketProvider');
  }
  return context;
};
