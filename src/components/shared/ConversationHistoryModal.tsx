import React, { useState, useCallback, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import userAPI from '../../services/userAPI';
import { useMobile } from '../../hooks/useMobile';
import logger from '../../utils/logger';
import { senderTypeToRole } from '../../utils/messageUtils';
import type { FollowUpMessage, MessageAttachment, LinkedMeeting } from './ai-feedback/types';
import MessageAttachments from './ai-feedback/MessageAttachments';
import MeetingMiniCard from './ai-feedback/MeetingMiniCard';

const FEATURE_LABELS: Record<string, string> = {
  boardroom: 'The Boardroom',
  proposal_wizard: 'Proposal Wizard',
  profile_analyzer: 'Profile Analyzer',
  headline_analyzer: 'Headline Analyzer',
  viral_post_generator: 'Viral Post Generator',
};

interface ConversationParticipant {
  character_id: string;
  character_name?: string;
  character_avatar_url?: string;
}

interface ConversationSummary {
  id: string;
  created_at: string;
  title?: string;
  message_count: number;
  is_starred?: boolean;
  participants?: ConversationParticipant[];
  metadata?: Record<string, unknown>;
  [key: string]: unknown;
}

interface ConversationMessage {
  id: string;
  sender_type: string;
  content: string;
  created_at: string;
  [key: string]: unknown;
}

interface ConversationListResponse {
  items?: ConversationSummary[];
  total_pages?: number;
}

interface ConversationMessagesResponse {
  items?: ConversationMessage[];
  total_pages?: number;
}

export interface RawConversationMessage {
  id: string;
  sender_type: string;
  content: string;
  created_at: string;
  metadata?: Record<string, unknown>;
  [key: string]: unknown;
}

interface ConversationHistoryModalProps {
  darkMode: boolean;
  isOpen: boolean;
  onClose: () => void;
  onLoadConversation?: (conversationId: string, messages: FollowUpMessage[], participant?: ConversationParticipant) => void;
  onLoadRawConversation?: (conversationId: string, messages: RawConversationMessage[]) => void;
  toolType: string;
  title?: string;
  showToggle?: boolean;
}

export default function ConversationHistoryModal({
  darkMode,
  isOpen,
  onClose,
  onLoadConversation,
  onLoadRawConversation,
  toolType,
  title = 'Conversation History',
  showToggle = false,
}: ConversationHistoryModalProps) {
  const isMobile = useMobile();

  const [showAll, setShowAll] = useState(false);
  const [showStarred, setShowStarred] = useState(false);
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [loadingConversations, setLoadingConversations] = useState(false);
  const [conversationError, setConversationError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout>>(null);

  const [selectedConversation, setSelectedConversation] = useState<ConversationSummary | null>(null);
  const [conversationMessages, setConversationMessages] = useState<ConversationMessage[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [mobileShowMessages, setMobileShowMessages] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const listRef = useRef<HTMLDivElement>(null);
  const messagesScrollRef = useRef<HTMLDivElement>(null);

  const loadConversations = useCallback(async (page = 1, append = false) => {
    try {
      setLoadingConversations(true);
      if (!append) setConversationError(null);

      const params: Record<string, string> = {
        page: String(page),
        per_page: '20',
        order_by: 'updated_at',
        order_dir: 'desc',
      };
      if (!showAll) {
        params.feature = toolType;
      }
      if (showStarred) {
        params.is_starred = 'true';
      }
      if (searchQuery.trim()) {
        params.search = searchQuery.trim();
      }

      const response = await userAPI.getUserConversations(params) as ConversationListResponse;
      const items = response.items || [];

      if (append) {
        setConversations(prev => [...prev, ...items]);
      } else {
        setConversations(items);
      }

      setHasMore(page < (response.total_pages || 1));
      setCurrentPage(page);
    } catch (err) {
      logger.error(`[${toolType}] Failed to load conversations:`, err);
      if (!append) setConversationError('Failed to load conversations.');
    } finally {
      setLoadingConversations(false);
    }
  }, [toolType, searchQuery, showAll, showStarred]);

  const loadMessages = useCallback(async (convId: string) => {
    try {
      setLoadingMessages(true);
      const response = await userAPI.getConversationMessages(
        convId,
        { page: '1', per_page: '100', order: 'asc' }
      ) as ConversationMessagesResponse;
      setConversationMessages(response.items || []);
    } catch (err) {
      logger.error(`[${toolType}] Failed to load messages:`, err);
    } finally {
      setLoadingMessages(false);
    }
  }, [toolType]);

  // Reset filters when modal opens
  useEffect(() => {
    if (isOpen) {
      setShowAll(false);
      setShowStarred(false);
    }
  }, [isOpen]);

  // After messages load for a selected conversation, jump to the newest message
  useEffect(() => {
    if (loadingMessages || conversationMessages.length === 0) return;
    const el = messagesScrollRef.current;
    if (!el) return;
    requestAnimationFrame(() => { el.scrollTop = el.scrollHeight; });
  }, [loadingMessages, conversationMessages, mobileShowMessages]);

  // Lock body scroll while modal is open so touch scrolls don't leak to the page
  useEffect(() => {
    if (!isOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, [isOpen]);

  // Reset and load when modal opens, search changes, or toggle switches
  useEffect(() => {
    if (isOpen) {
      setSelectedConversation(null);
      setConversationMessages([]);
      setMobileShowMessages(false);
      setConversations([]);
      setCurrentPage(1);
      setHasMore(true);
      loadConversations(1, false);
    }
  }, [isOpen, loadConversations, showAll, showStarred]);

  // Debounced search
  const handleSearchChange = useCallback((value: string) => {
    setSearchQuery(value);
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(() => {
      setConversations([]);
      setCurrentPage(1);
      setHasMore(true);
      // loadConversations will be triggered by the useEffect above via searchQuery dependency
    }, 300);
  }, []);

  // Trigger reload when searchQuery changes (after debounce sets it)
  useEffect(() => {
    if (isOpen) {
      loadConversations(1, false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery]);

  // Infinite scroll handler
  const handleListScroll = useCallback(() => {
    const el = listRef.current;
    if (!el || loadingConversations || !hasMore) return;

    if (el.scrollHeight - el.scrollTop - el.clientHeight < 100) {
      loadConversations(currentPage + 1, true);
    }
  }, [loadingConversations, hasMore, currentPage, loadConversations]);

  const handleSelectConversation = useCallback(async (conv: ConversationSummary) => {
    setSelectedConversation(conv);
    setMobileShowMessages(true);
    await loadMessages(conv.id);
  }, [loadMessages]);

  const handleLoadConversation = useCallback(() => {
    if (!selectedConversation || conversationMessages.length === 0) return;

    if (onLoadRawConversation) {
      onLoadRawConversation(selectedConversation.id, conversationMessages as RawConversationMessage[]);
    } else if (onLoadConversation) {
      // Build a lookup from character_id to avatar so each AI message shows the correct character's icon
      const avatarByCharacterId: Record<string, string> = {};
      for (const p of selectedConversation.participants || []) {
        if (p.character_id && p.character_avatar_url) {
          avatarByCharacterId[p.character_id] = p.character_avatar_url;
        }
      }
      const fallbackAvatar = selectedConversation.participants?.[0]?.character_avatar_url || null;
      const followUpMessages: FollowUpMessage[] = conversationMessages.map(msg => {
        const senderId = msg.sender_id as string | undefined;
        const avatar = (senderId && avatarByCharacterId[senderId]) || fallbackAvatar;
        const configMeta = msg.metadata as Record<string, unknown> | undefined;

        // Reconstruct attachments from stored config_metadata
        const attachments = configMeta?.attachments as FollowUpMessage['attachments'] | undefined;
        const meetingRef = configMeta?.zmi_meeting_ref as { meeting_id?: string; title?: string; start_time?: string; duration_ms?: number | null } | undefined;

        return {
          role: senderTypeToRole(msg.sender_type),
          content: msg.content,
          timestamp: msg.created_at,
          messageId: msg.id,
          ...(msg.sender_type?.toUpperCase() === 'AI' && avatar ? { characterAvatarUrl: avatar } : {}),
          ...(attachments && attachments.length > 0 ? { attachments } : {}),
          ...(meetingRef?.meeting_id ? {
            linkedMeeting: {
              meeting_id: meetingRef.meeting_id,
              title: meetingRef.title || 'Untitled Meeting',
              start_time: meetingRef.start_time || '',
              duration_ms: meetingRef.duration_ms,
            },
          } : {}),
        };
      });
      const lastParticipant = selectedConversation.participants?.length
        ? selectedConversation.participants[selectedConversation.participants.length - 1]
        : undefined;
      onLoadConversation(selectedConversation.id, followUpMessages, lastParticipant);
    }
    onClose();
  }, [selectedConversation, conversationMessages, onLoadConversation, onLoadRawConversation, onClose]);

  const handleToggleStar = useCallback(async (e: React.MouseEvent, convId: string) => {
    e.stopPropagation();
    try {
      await userAPI.toggleStarConversation(convId);
      setConversations(prev => prev.map(c =>
        c.id === convId ? { ...c, is_starred: !c.is_starred } : c
      ));
      if (selectedConversation?.id === convId) {
        setSelectedConversation(prev => prev ? { ...prev, is_starred: !prev.is_starred } : prev);
      }
    } catch (err) {
      logger.error('Failed to toggle star:', err);
    }
  }, [selectedConversation]);

  const handleDeleteConversation = useCallback(async () => {
    if (!deleteConfirmId) return;
    try {
      await userAPI.deleteConversation(deleteConfirmId);
      setConversations(prev => prev.filter(c => c.id !== deleteConfirmId));
      if (selectedConversation?.id === deleteConfirmId) {
        setSelectedConversation(null);
        setConversationMessages([]);
      }
    } catch (err) {
      logger.error('Failed to delete conversation:', err);
    } finally {
      setDeleteConfirmId(null);
    }
  }, [deleteConfirmId, selectedConversation]);

  const getFeatureLabel = (conv: ConversationSummary): string | null => {
    const feature = (conv.metadata as Record<string, unknown>)?.feature as string | undefined;
    if (!feature) return null;
    return FEATURE_LABELS[feature] || feature;
  };

  const formatDate = (dateStr: string): string => {
    const d = new Date(dateStr);
    const now = new Date();
    const isToday = d.toDateString() === now.toDateString();
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const isYesterday = d.toDateString() === yesterday.toDateString();

    if (isToday) return `Today ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    if (isYesterday) return `Yesterday ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    return d.toLocaleDateString([], { day: 'numeric', month: 'short', year: 'numeric' }) +
      ` ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4" role="dialog" aria-modal="true" aria-label="Conversation history">
      <div className={`relative w-full max-w-[95vw] md:max-w-4xl max-h-[90vh] rounded-xl shadow-xl flex flex-col ${
        darkMode ? 'bg-[#1e1e1e]' : 'bg-white'
      }`}>
        {/* Header */}
        <div className={`px-6 py-4 border-b flex justify-between items-center ${
          darkMode ? 'border-[#333333]' : 'border-gray-200'
        }`}>
          <h2 className={`text-xl font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            {title}
          </h2>
          <button
            onClick={onClose}
            className={`p-2 rounded-lg ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
          {/* Conversations List */}
          <div className={`w-full md:w-1/3 flex-1 md:flex-none min-h-0 border-r flex flex-col ${isMobile && mobileShowMessages ? 'hidden' : ''} ${
            darkMode ? 'border-[#333333]' : 'border-gray-200'
          }`}>
            {/* Search */}
            <div className={`p-3 border-b ${darkMode ? 'border-[#333333]' : 'border-gray-200'}`}>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                placeholder="Search conversations..."
                className={`w-full px-3 py-2 text-sm rounded-lg border outline-none ${
                  darkMode
                    ? 'bg-[#2d2d2d] border-[#444] text-white placeholder:text-gray-500 focus:border-zenible-primary'
                    : 'bg-gray-50 border-gray-200 text-gray-900 placeholder:text-gray-400 focus:border-zenible-primary'
                }`}
              />
            </div>

            {/* Filter toggle */}
            {showToggle && (
              <div className={`px-3 py-2 border-b flex gap-1 ${darkMode ? 'border-[#333333]' : 'border-gray-200'}`}>
                <button
                  onClick={() => { setShowAll(false); setShowStarred(false); }}
                  className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                    !showAll && !showStarred
                      ? 'bg-zenible-primary text-white'
                      : darkMode
                        ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-700'
                        : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  Boardroom
                </button>
                <button
                  onClick={() => { setShowAll(true); setShowStarred(false); }}
                  className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                    showAll && !showStarred
                      ? 'bg-zenible-primary text-white'
                      : darkMode
                        ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-700'
                        : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => { setShowAll(true); setShowStarred(true); }}
                  className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                    showStarred
                      ? 'bg-zenible-primary text-white'
                      : darkMode
                        ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-700'
                        : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  Starred
                </button>
              </div>
            )}

            {/* Scrollable list */}
            <div
              ref={listRef}
              onScroll={handleListScroll}
              className="flex-1 overflow-y-auto overscroll-contain"
            >
              {conversationError ? (
                <div className="p-4 text-center">
                  <div className={`text-sm ${darkMode ? 'text-red-400' : 'text-red-600'}`}>
                    {conversationError}
                  </div>
                  <button
                    onClick={() => loadConversations(1, false)}
                    className={`mt-2 text-sm px-3 py-1 rounded ${
                      darkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Retry
                  </button>
                </div>
              ) : conversations.length === 0 && !loadingConversations ? (
                <div className="p-4 text-center text-gray-500">
                  {searchQuery ? 'No matching conversations' : showStarred ? 'No starred conversations' : 'No conversations yet'}
                </div>
              ) : (
                <>
                  {conversations.map(conv => {
                    const featureLabel = getFeatureLabel(conv);
                    return (
                      <div
                        key={conv.id}
                        onClick={() => handleSelectConversation(conv)}
                        className={`p-3 cursor-pointer border-b transition-colors ${
                          selectedConversation?.id === conv.id
                            ? darkMode ? 'bg-gray-700' : 'bg-gray-100'
                            : darkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-50'
                        } ${darkMode ? 'border-[#333333]' : 'border-gray-200'}`}
                      >
                        <div className="flex items-start gap-2">
                          {(() => {
                            const lastParticipant = conv.participants?.length
                              ? conv.participants[conv.participants.length - 1]
                              : undefined;
                            return lastParticipant?.character_avatar_url ? (
                              <img
                                src={lastParticipant.character_avatar_url}
                                alt=""
                                className="w-7 h-7 rounded-full object-cover flex-shrink-0 mt-0.5"
                              />
                            ) : null;
                          })()}
                          <div className="flex-1 min-w-0">
                            <div className={`font-medium text-sm truncate ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                              {conv.title || 'Untitled'}
                            </div>
                            <div className={`text-xs mt-0.5 flex items-center gap-1 flex-wrap ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                              <span>{formatDate(conv.created_at)}</span>
                              {(() => {
                                const lastParticipant = conv.participants?.length
                                  ? conv.participants[conv.participants.length - 1]
                                  : undefined;
                                return lastParticipant?.character_name ? (
                                  <>
                                    <span>·</span>
                                    <span>{lastParticipant.character_name}</span>
                                  </>
                                ) : null;
                              })()}
                              {featureLabel && (
                                <>
                                  <span>·</span>
                                  <span>{featureLabel}</span>
                                </>
                              )}
                            </div>
                          </div>
                          <div className="flex flex-col flex-shrink-0 gap-1">
                            <button
                              onClick={(e) => handleToggleStar(e, conv.id)}
                              className={`p-1 rounded transition-colors ${
                                conv.is_starred
                                  ? 'text-yellow-400 hover:text-yellow-500'
                                  : darkMode
                                    ? 'text-gray-600 hover:text-gray-400'
                                    : 'text-gray-300 hover:text-gray-500'
                              }`}
                            >
                              <svg className="w-4 h-4" viewBox="0 0 24 24" fill={conv.is_starred ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                              </svg>
                            </button>
                            <button
                              onClick={(e) => { e.stopPropagation(); setDeleteConfirmId(conv.id); }}
                              className={`p-1 rounded transition-colors ${
                                darkMode
                                  ? 'text-gray-600 hover:text-red-400'
                                  : 'text-gray-300 hover:text-red-500'
                              }`}
                            >
                              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  {loadingConversations && (
                    <div className={`p-3 text-center text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                      Loading...
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Messages Panel */}
          <div className={`${isMobile && !mobileShowMessages ? 'hidden' : 'flex-1'} min-h-0 flex flex-col`}>
            {selectedConversation ? (
              <>
                {/* Back Button (Mobile) */}
                {isMobile && (
                  <button
                    onClick={() => setMobileShowMessages(false)}
                    className={`flex items-center gap-1 px-4 py-2 text-sm border-b ${
                      darkMode
                        ? 'text-gray-300 hover:text-white border-[#333333]'
                        : 'text-gray-600 hover:text-gray-900 border-gray-200'
                    }`}
                  >
                    &larr; Back to conversations
                  </button>
                )}

                {/* Messages */}
                <div ref={messagesScrollRef} className="flex-1 overflow-y-auto overscroll-contain p-4">
                  {loadingMessages ? (
                    <div className="text-center">Loading messages...</div>
                  ) : conversationMessages.length === 0 ? (
                    <div className="text-center text-gray-500">No messages</div>
                  ) : (
                    <div className="space-y-4">
                      {conversationMessages.map((msg, idx) => (
                        <div key={msg.id || idx} className={`flex ${
                          msg.sender_type?.toUpperCase() === 'USER' ? 'justify-end' : 'justify-start'
                        }`}>
                          {msg.sender_type?.toUpperCase() === 'AI' && (() => {
                            const senderId = msg.sender_id as string | undefined;
                            const participant = senderId
                              ? selectedConversation?.participants?.find(p => p.character_id === senderId)
                              : undefined;
                            const avatarUrl = participant?.character_avatar_url
                              || selectedConversation?.participants?.[0]?.character_avatar_url;
                            return avatarUrl ? (
                              <img
                                src={avatarUrl}
                                alt=""
                                className="w-6 h-6 rounded-full object-cover flex-shrink-0 mt-1 mr-2"
                              />
                            ) : null;
                          })()}
                          <div className={`max-w-[80%] min-w-0 overflow-hidden rounded-lg px-4 py-2 ${
                            msg.sender_type?.toUpperCase() === 'USER'
                              ? 'bg-zenible-primary text-white'
                              : darkMode
                                ? 'bg-gray-700 text-white'
                                : 'bg-gray-100 text-gray-900'
                          }`}>
                            <div className="text-sm">
                              {msg.content.length > 500 ? (
                                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                  {(() => {
                                    const truncated = msg.content.substring(0, 500);
                                    const openFences = (truncated.match(/```/g) || []).length;
                                    return openFences % 2 !== 0 ? truncated + '\n```\n...' : truncated + '...';
                                  })()}
                                </ReactMarkdown>
                              ) : (
                                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                  {msg.content}
                                </ReactMarkdown>
                              )}
                            </div>
                            {/* Attachments & linked meeting from config_metadata */}
                            {(() => {
                              const configMeta = msg.metadata as Record<string, unknown> | undefined;
                              const attachments = configMeta?.attachments as MessageAttachment[] | undefined;
                              const meetingRef = configMeta?.zmi_meeting_ref as { meeting_id?: string; title?: string; start_time?: string; duration_ms?: number | null } | undefined;
                              return (
                                <>
                                  {attachments && attachments.length > 0 && (
                                    <MessageAttachments attachments={attachments} darkMode={darkMode} />
                                  )}
                                  {meetingRef?.meeting_id && (
                                    <MeetingMiniCard
                                      meeting={{
                                        meeting_id: meetingRef.meeting_id,
                                        title: meetingRef.title || 'Untitled Meeting',
                                        start_time: meetingRef.start_time || '',
                                        duration_ms: meetingRef.duration_ms,
                                      }}
                                      darkMode={darkMode}
                                    />
                                  )}
                                </>
                              );
                            })()}
                            <div className={`text-xs mt-1 ${
                              msg.sender_type?.toUpperCase() === 'USER'
                                ? 'text-white/70'
                                : darkMode ? 'text-gray-400' : 'text-gray-600'
                            }`}>
                              {new Date(msg.created_at).toLocaleString()}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Load Button */}
                <div className={`p-4 border-t ${darkMode ? 'border-[#333333]' : 'border-gray-200'}`}>
                  <button
                    onClick={handleLoadConversation}
                    className="w-full px-4 py-2 bg-zenible-primary text-white rounded-lg hover:bg-purple-600 transition-colors"
                  >
                    Continue This Conversation
                  </button>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-gray-500">
                Select a conversation to view messages
              </div>
            )}
          </div>
        </div>

        {/* Delete Confirmation Modal */}
        {deleteConfirmId && (
          <div className="absolute inset-0 z-60 flex items-center justify-center bg-black bg-opacity-40 rounded-xl">
            <div className={`mx-4 p-6 rounded-xl shadow-xl max-w-sm w-full ${
              darkMode ? 'bg-[#2d2d2d]' : 'bg-white'
            }`}>
              <h3 className={`text-lg font-semibold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                Delete Conversation
              </h3>
              <p className={`text-sm mb-4 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Are you sure you want to delete this conversation? This action cannot be undone.
              </p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setDeleteConfirmId(null)}
                  className={`px-4 py-2 text-sm rounded-lg transition-colors ${
                    darkMode
                      ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteConversation}
                  className="px-4 py-2 text-sm rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
