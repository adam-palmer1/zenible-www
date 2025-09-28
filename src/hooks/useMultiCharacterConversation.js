import { useState, useEffect, useCallback, useRef } from 'react';
import { useWebSocketConnection } from './useWebSocketConnection';

/**
 * Hook for multi-character AI conversations
 * Supports different conversation modes: sequential, simultaneous, discussion, moderated
 */
export function useMultiCharacterConversation(conversationId, panelId) {
  const [sessionId, setSessionId] = useState(null);
  const [mode, setMode] = useState(null);
  const [characters, setCharacters] = useState([]);
  const [currentCharacter, setCurrentCharacter] = useState(null);
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [characterResponses, setCharacterResponses] = useState({});
  const [roundNumber, setRoundNumber] = useState(0);
  const [error, setError] = useState(null);

  const { streamingManager, joinPanel, leavePanel, isConnected } = useWebSocketConnection();
  const unsubscribersRef = useRef([]);
  const effectivePanelId = panelId || `multi_char_${conversationId}`;

  useEffect(() => {
    if (!conversationId || !isConnected || !streamingManager) return;

    const setupMultiCharacterHandlers = async () => {
      try {
        // Join the panel
        await joinPanel(effectivePanelId, conversationId);

        // Setup event handlers
        const handlers = [
          // Multi-character session start
          streamingManager.onPanelEvent(effectivePanelId, 'multi_character_start', (data) => {
            setSessionId(data.sessionId);
            setMode(data.mode);
            setCharacters(data.characters || []);
            setIsSessionActive(true);
            setCharacterResponses({});
            setRoundNumber(0);
            setError(null);
          }),

          // Character turn notification
          streamingManager.onPanelEvent(effectivePanelId, 'character_turn', (data) => {
            setCurrentCharacter({
              id: data.characterId,
              name: data.characterName,
              order: data.order
            });
          }),

          // Process each character's response
          streamingManager.onPanelEvent(effectivePanelId, 'processing', (data) => {
            setCharacterResponses(prev => ({
              ...prev,
              [data.characterId]: {
                status: 'processing',
                content: '',
                trackingId: data.trackingId
              }
            }));
          }),

          // Handle streaming chunks per character
          streamingManager.onPanelEvent(effectivePanelId, 'chunk', (data) => {
            setCharacterResponses(prev => ({
              ...prev,
              [data.characterId]: {
                ...prev[data.characterId],
                status: 'streaming',
                content: data.content
              }
            }));
          }),

          // Character response complete
          streamingManager.onPanelEvent(effectivePanelId, 'streaming_complete', (data) => {
            setCharacterResponses(prev => ({
              ...prev,
              [data.characterId]: {
                ...prev[data.characterId],
                status: 'complete',
                content: data.fullResponse,
                metrics: {
                  totalTokens: data.totalTokens,
                  costCents: data.costCents,
                  durationMs: data.durationMs
                }
              }
            }));
          }),

          // Multi-character session complete
          streamingManager.onPanelEvent(effectivePanelId, 'multi_character_complete', (data) => {
            setIsSessionActive(false);
            setRoundNumber(data.roundNumber);
            setCurrentCharacter(null);
          }),

          // Error handling
          streamingManager.onPanelEvent(effectivePanelId, 'ai_error', (data) => {
            setError(data.error || 'An error occurred');

            // Mark the character's response as failed
            if (data.characterId) {
              setCharacterResponses(prev => ({
                ...prev,
                [data.characterId]: {
                  ...prev[data.characterId],
                  status: 'error',
                  error: data.error
                }
              }));
            }
          })
        ];

        unsubscribersRef.current = handlers;
      } catch (error) {
        console.error('Failed to setup multi-character handlers:', error);
        setError('Failed to setup multi-character conversation');
      }
    };

    setupMultiCharacterHandlers();

    // Cleanup
    return () => {
      unsubscribersRef.current.forEach(unsub => {
        if (typeof unsub === 'function') unsub();
      });
      unsubscribersRef.current = [];
      leavePanel(effectivePanelId);
    };
  }, [conversationId, effectivePanelId, isConnected, streamingManager]);

  const startMultiCharacterSession = useCallback((characterIds, sessionMode = 'sequential', metadata = {}) => {
    if (!streamingManager || !isConnected || isSessionActive) {
      console.error('Cannot start multi-character session:', {
        hasManager: !!streamingManager,
        isConnected,
        isSessionActive
      });
      return false;
    }

    const socket = streamingManager.wsService?.getSocket();
    if (!socket?.connected) {
      return false;
    }

    // Server typically initiates multi-character sessions
    // But we can request one to be started
    socket.emit('request_multi_character_session', {
      conversation_id: conversationId,
      character_ids: characterIds,
      mode: sessionMode,
      panel_id: effectivePanelId,
      metadata
    });

    return true;
  }, [streamingManager, isConnected, isSessionActive, conversationId, effectivePanelId]);

  const addCharacterToConversation = useCallback((characterId) => {
    if (!streamingManager || !isConnected) {
      return false;
    }

    const socket = streamingManager.wsService?.getSocket();
    if (!socket?.connected) {
      return false;
    }

    socket.emit('add_character_to_conversation', {
      conversation_id: conversationId,
      character_id: characterId
    });

    return true;
  }, [streamingManager, isConnected, conversationId]);

  const getCharacterResponse = useCallback((characterId) => {
    return characterResponses[characterId] || null;
  }, [characterResponses]);

  const getAllResponses = useCallback(() => {
    return Object.entries(characterResponses).map(([characterId, response]) => {
      const character = characters.find(c => c.id === characterId);
      return {
        characterId,
        characterName: character?.name || 'Unknown',
        ...response
      };
    });
  }, [characterResponses, characters]);

  const isAnyCharacterStreaming = useCallback(() => {
    return Object.values(characterResponses).some(r =>
      r.status === 'processing' || r.status === 'streaming'
    );
  }, [characterResponses]);

  const reset = useCallback(() => {
    setSessionId(null);
    setMode(null);
    setCharacters([]);
    setCurrentCharacter(null);
    setIsSessionActive(false);
    setCharacterResponses({});
    setRoundNumber(0);
    setError(null);
  }, []);

  return {
    // Session state
    sessionId,
    mode,
    characters,
    currentCharacter,
    isSessionActive,
    roundNumber,
    error,

    // Character responses
    characterResponses,
    getCharacterResponse,
    getAllResponses,
    isAnyCharacterStreaming,

    // Actions
    startMultiCharacterSession,
    addCharacterToConversation,
    reset
  };
}