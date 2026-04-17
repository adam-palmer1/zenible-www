import { useState, useCallback, useRef, useContext, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { WebSocketContext, WebSocketContextValue } from '../contexts/WebSocketContext';
import { queryKeys } from '../lib/query-keys';
import { messageAPI } from '../services/messageAPI';
import type { FollowUpMessage, MessageAttachment, LinkedMeeting } from '../components/shared/ai-feedback/types';

interface MeetingContext {
  summary?: string;
  key_points?: string[];
  action_items?: string[];
  transcript?: string;
}

interface UseBoardroomChatReturn {
  conversationId: string | null;
  messages: FollowUpMessage[];
  isStreaming: boolean;
  streamingContent: string;
  isSending: boolean;
  error: string | null;
  pendingAttachments: MessageAttachment[];
  pendingMeeting: LinkedMeeting | null;
  uploadingFiles: boolean;
  deletingMessageId: string | null;
  sendMessage: (text: string) => Promise<void>;
  cancelStreaming: () => void;
  deleteMessage: (messageId: string) => Promise<void>;
  loadConversation: (convId: string, existingMessages: FollowUpMessage[]) => void;
  clearChat: () => void;
  setConversationId: (id: string | null) => void;
  addAttachment: (attachment: MessageAttachment) => void;
  removeAttachment: (documentId: string) => void;
  clearAttachments: () => void;
  setLinkedMeeting: (meeting: LinkedMeeting | null, context?: MeetingContext | null) => void;
  handleFileUpload: (files: FileList) => void;
}

export function useBoardroomChat(characterId: string | null, characterAvatarUrl?: string | null): UseBoardroomChatReturn {
  const wsContext = useContext(WebSocketContext) as WebSocketContextValue;
  const queryClient = useQueryClient();

  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<FollowUpMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendingAttachments, setPendingAttachments] = useState<MessageAttachment[]>([]);
  const [pendingMeeting, setPendingMeeting] = useState<LinkedMeeting | null>(null);
  const [uploadingFiles, setUploadingFiles] = useState(false);
  const [deletingMessageId, setDeletingMessageId] = useState<string | null>(null);
  const streamingContentRef = useRef<string>('');

  // Store meeting context separately (not displayed, only sent to AI)
  const meetingContextRef = useRef<MeetingContext | null>(null);

  // Track unsubscribers for event handlers
  const unsubscribersRef = useRef<Array<() => void>>([]);
  // Track conversationId in a ref for use in async callbacks
  const conversationIdRef = useRef<string | null>(null);
  const characterIdRef = useRef<string | null>(characterId);
  const characterAvatarUrlRef = useRef<string | null | undefined>(characterAvatarUrl);

  // Keep refs in sync
  useEffect(() => {
    conversationIdRef.current = conversationId;
  }, [conversationId]);

  useEffect(() => {
    characterIdRef.current = characterId;
  }, [characterId]);

  useEffect(() => {
    characterAvatarUrlRef.current = characterAvatarUrl;
  }, [characterAvatarUrl]);

  // Cleanup event handlers
  const cleanupHandlers = useCallback(() => {
    unsubscribersRef.current.forEach(unsub => unsub());
    unsubscribersRef.current = [];
  }, []);

  // Register event handlers for a conversation
  const registerHandlers = useCallback((convId: string) => {
    if (!wsContext?.onConversationEvent) return;

    cleanupHandlers();

    // Handle streaming chunks (non-tool responses only)
    unsubscribersRef.current.push(
      wsContext.onConversationEvent(convId, 'chunk', (...args: unknown[]) => {
        const data = args[0] as { toolName?: string; fullContent?: string };
        if (!data.toolName) {
          setIsStreaming(true);
          setIsSending(false);
          setStreamingContent(data.fullContent || '');
          streamingContentRef.current = data.fullContent || '';
        }
      })
    );

    // Handle streaming start — tag the local user message with its DB id
    unsubscribersRef.current.push(
      wsContext.onConversationEvent(convId, 'streaming_start', (...args: unknown[]) => {
        const data = args[0] as { userMessageId?: string };
        if (!data?.userMessageId) return;
        setMessages(prev => {
          // Find the most recent user message without an id and tag it
          for (let i = prev.length - 1; i >= 0; i--) {
            if (prev[i].role === 'user' && !prev[i].messageId) {
              const next = prev.slice();
              next[i] = { ...next[i], messageId: data.userMessageId };
              return next;
            }
          }
          return prev;
        });
      })
    );

    // Handle completion
    unsubscribersRef.current.push(
      wsContext.onConversationEvent(convId, 'complete', (...args: unknown[]) => {
        const data = args[0] as { toolName?: string; fullResponse?: string; messageId?: string };
        // Always reset all processing state on any completion event
        setIsSending(false);
        setIsStreaming(false);
        setStreamingContent('');
        streamingContentRef.current = '';

        // Invalidate usage caches so Settings → Subscription reflects new usage
        queryClient.invalidateQueries({ queryKey: queryKeys.usageDashboard.all });
        queryClient.invalidateQueries({ queryKey: queryKeys.usageHistory.all });

        // Only add message to history for non-tool responses
        if (!data.toolName && data.fullResponse) {
          setMessages(prev => [...prev, {
            role: 'assistant',
            content: data.fullResponse || '',
            timestamp: new Date().toISOString(),
            messageId: data.messageId,
            ...(characterAvatarUrlRef.current ? { characterAvatarUrl: characterAvatarUrlRef.current } : {}),
          }]);
        }
      })
    );

    // Handle errors
    unsubscribersRef.current.push(
      wsContext.onConversationEvent(convId, 'error', (...args: unknown[]) => {
        const data = args[0] as { error?: string };
        console.error('[Boardroom] Chat error:', data);
        setIsStreaming(false);
        setStreamingContent('');
        setIsSending(false);
        setError(data?.error || 'An error occurred');
      })
    );

    // Handle file upload success
    unsubscribersRef.current.push(
      wsContext.onConversationEvent(convId, 'file_uploaded', (...args: unknown[]) => {
        const data = args[0] as {
          document_id?: string;
          file_name?: string;
          file_type?: string;
          url?: string;
          thumbnail_url?: string;
        };
        if (data.document_id && data.file_name && data.url) {
          setPendingAttachments(prev => [...prev, {
            document_id: data.document_id!,
            file_name: data.file_name!,
            file_type: data.file_type || 'application/octet-stream',
            url: data.url!,
            thumbnail_url: data.thumbnail_url,
          }]);
        }
        setUploadingFiles(false);
      })
    );

    // Handle file upload errors
    unsubscribersRef.current.push(
      wsContext.onConversationEvent(convId, 'file_upload_error', (...args: unknown[]) => {
        const data = args[0] as { error?: string };
        console.error('[Boardroom] File upload error:', data);
        setUploadingFiles(false);
        setError(data?.error || 'File upload failed');
      })
    );
  }, [wsContext, cleanupHandlers, queryClient]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanupHandlers();
    };
  }, [cleanupHandlers]);

  // File upload handler
  const handleFileUpload = useCallback((files: FileList) => {
    if (!wsContext || files.length === 0) return;

    const socket = (wsContext as unknown as { conversationManager: { wsService?: { getSocket?: () => unknown } } })
      ?.conversationManager;

    // Use the WebSocket to upload files
    setUploadingFiles(true);

    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = (reader.result as string).split(',')[1];
        const wsSocket = (wsContext.conversationManager as { wsService?: { getSocket?: () => { emit: (event: string, data: unknown) => void } } })
          ?.wsService?.getSocket?.();

        if (wsSocket) {
          wsSocket.emit('upload_file', {
            conversation_id: conversationIdRef.current,
            file_name: file.name,
            file_type: file.type,
            file_data: base64,
          });
        } else {
          setUploadingFiles(false);
          setError('Cannot upload: not connected');
        }
      };
      reader.onerror = () => {
        setUploadingFiles(false);
        setError('Failed to read file');
      };
      reader.readAsDataURL(file);
    });
  }, [wsContext]);

  const addAttachment = useCallback((attachment: MessageAttachment) => {
    setPendingAttachments(prev => [...prev, attachment]);
  }, []);

  const removeAttachment = useCallback((documentId: string) => {
    setPendingAttachments(prev => prev.filter(a => a.document_id !== documentId));
  }, []);

  const clearAttachments = useCallback(() => {
    setPendingAttachments([]);
  }, []);

  const setLinkedMeeting = useCallback((meeting: LinkedMeeting | null, context?: MeetingContext | null) => {
    setPendingMeeting(meeting);
    meetingContextRef.current = context || null;
  }, []);

  const cancelStreaming = useCallback(() => {
    const convId = conversationIdRef.current;
    if (convId) {
      wsContext?.cancelRequest(convId);
    }

    const partial = streamingContentRef.current;

    // Preserve partial streamed text as a completed assistant message
    if (partial && partial.trim()) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: partial,
        timestamp: new Date().toISOString(),
        ...(characterAvatarUrlRef.current ? { characterAvatarUrl: characterAvatarUrlRef.current } : {}),
      }]);
    }

    setIsStreaming(false);
    setIsSending(false);
    setStreamingContent('');
    streamingContentRef.current = '';
  }, [wsContext]);

  const deleteMessage = useCallback(async (messageId: string) => {
    const convId = conversationIdRef.current;
    if (!convId || !messageId) return;

    setDeletingMessageId(messageId);
    try {
      await messageAPI.deleteMessage(convId, messageId);
      setMessages(prev => prev.filter(m => m.messageId !== messageId));
    } catch (err) {
      console.error('[Boardroom] Failed to delete message:', err);
      setError('Failed to delete message');
    } finally {
      setDeletingMessageId(null);
    }
  }, []);

  const sendMessage = useCallback(async (text: string) => {
    if (!characterIdRef.current) {
      setError('No character selected');
      return;
    }

    if (!wsContext) {
      setError('Not connected to server');
      return;
    }

    setError(null);
    setIsSending(true);

    // Capture pending state before clearing
    const attachments = [...pendingAttachments];
    const meeting = pendingMeeting;
    const meetingCtx = meetingContextRef.current;

    // Add user message immediately (with attachment/meeting info for display)
    setMessages(prev => [...prev, {
      role: 'user',
      content: text,
      timestamp: new Date().toISOString(),
      ...(attachments.length > 0 ? { attachments } : {}),
      ...(meeting ? { linkedMeeting: meeting } : {}),
    }]);

    // Clear pending state
    setPendingAttachments([]);
    setPendingMeeting(null);
    meetingContextRef.current = null;

    try {
      let convId = conversationIdRef.current;

      // Create conversation if needed
      if (!convId) {
        convId = await wsContext.createConversation(
          characterIdRef.current,
          'boardroom',
          {}
        );
        conversationIdRef.current = convId;
        setConversationId(convId);
        registerHandlers(convId);
      }

      // Build options
      const options: {
        attachments?: MessageAttachment[];
        metadata?: Record<string, unknown>;
      } = {};

      if (attachments.length > 0) {
        options.attachments = attachments;
      }

      // Build metadata with meeting ref (for storage) and meeting context (for AI)
      const metadata: Record<string, unknown> = {};
      metadata.feature = 'boardroom';
      if (meeting) {
        metadata.zmi_meeting_ref = {
          meeting_id: meeting.meeting_id,
          title: meeting.title,
          start_time: meeting.start_time,
          duration_ms: meeting.duration_ms,
        };
      }
      if (meetingCtx) {
        metadata.zmi_meeting_context = meetingCtx;
      }
      if (Object.keys(metadata).length > 0) {
        options.metadata = metadata;
      }

      // Send message with options
      wsContext.sendMessage(convId, characterIdRef.current, text, Object.keys(options).length > 0 ? options : undefined);
    } catch (err) {
      console.error('[Boardroom] Failed to send message:', err);
      setIsSending(false);
      setError('Failed to send message. Please try again.');
    }
  }, [wsContext, registerHandlers, pendingAttachments, pendingMeeting]);

  const loadConversation = useCallback((convId: string, existingMessages: FollowUpMessage[]) => {
    cleanupHandlers();
    conversationIdRef.current = convId;
    setConversationId(convId);

    // Map metadata fields into FollowUpMessage props (API returns "metadata", not "config_metadata")
    const mappedMessages = existingMessages.map(msg => {
      // Already has attachments/linkedMeeting mapped by ConversationHistoryModal
      if (msg.attachments || msg.linkedMeeting) return msg;

      const raw = msg as unknown as Record<string, unknown>;
      const configMeta = (raw.metadata ?? raw.config_metadata) as Record<string, unknown> | undefined;

      if (!configMeta) return msg;

      const mapped = { ...msg };

      // Map attachments
      if (Array.isArray(configMeta.attachments) && configMeta.attachments.length > 0) {
        mapped.attachments = configMeta.attachments as MessageAttachment[];
      }

      // Map ZMI meeting reference
      const meetingRef = configMeta.zmi_meeting_ref as Record<string, unknown> | undefined;
      if (meetingRef?.meeting_id) {
        mapped.linkedMeeting = {
          meeting_id: meetingRef.meeting_id as string,
          title: (meetingRef.title as string) || 'Untitled Meeting',
          start_time: (meetingRef.start_time as string) || '',
          duration_ms: meetingRef.duration_ms as number | null | undefined,
        };
      }

      return mapped;
    });

    setMessages(mappedMessages);
    setIsStreaming(false);
    setStreamingContent('');
    streamingContentRef.current = '';
    setIsSending(false);
    setError(null);
    setPendingAttachments([]);
    setPendingMeeting(null);
    meetingContextRef.current = null;
    registerHandlers(convId);
  }, [cleanupHandlers, registerHandlers]);

  const clearChat = useCallback(() => {
    cleanupHandlers();
    conversationIdRef.current = null;
    setConversationId(null);
    setMessages([]);
    setIsStreaming(false);
    setStreamingContent('');
    streamingContentRef.current = '';
    setIsSending(false);
    setError(null);
    setPendingAttachments([]);
    setPendingMeeting(null);
    meetingContextRef.current = null;
  }, [cleanupHandlers]);

  return {
    conversationId,
    messages,
    isStreaming,
    streamingContent,
    isSending,
    error,
    pendingAttachments,
    pendingMeeting,
    uploadingFiles,
    deletingMessageId,
    sendMessage,
    cancelStreaming,
    deleteMessage,
    loadConversation,
    clearChat,
    setConversationId,
    addAttachment,
    removeAttachment,
    clearAttachments,
    setLinkedMeeting,
    handleFileUpload,
  };
}
