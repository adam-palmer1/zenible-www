import React, { useState, useCallback, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import userAPI from '../../services/userAPI';
import { useMobile } from '../../hooks/useMobile';
import { senderTypeToRole } from '../../utils/messageUtils';
import type { FollowUpMessage } from '../shared/ai-feedback/types';

interface ConversationSummary {
  id: string;
  created_at: string;
  title?: string;
  message_count: number;
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

interface BoardroomHistoryModalProps {
  darkMode: boolean;
  isOpen: boolean;
  onClose: () => void;
  onLoadConversation: (conversationId: string, messages: FollowUpMessage[]) => void;
}

export default function BoardroomHistoryModal({
  darkMode,
  isOpen,
  onClose,
  onLoadConversation,
}: BoardroomHistoryModalProps) {
  const isMobile = useMobile();

  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [loadingConversations, setLoadingConversations] = useState(false);
  const [conversationError, setConversationError] = useState<string | null>(null);
  const [conversationPage, setConversationPage] = useState(1);
  const [totalConversationPages, setTotalConversationPages] = useState(1);

  const [selectedConversation, setSelectedConversation] = useState<ConversationSummary | null>(null);
  const [conversationMessages, setConversationMessages] = useState<ConversationMessage[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [messagePage, setMessagePage] = useState(1);
  const [totalMessagePages, setTotalMessagePages] = useState(1);
  const [messageOrder, setMessageOrder] = useState('asc');
  const [mobileShowMessages, setMobileShowMessages] = useState(false);

  const loadConversations = useCallback(async (page = 1) => {
    try {
      setLoadingConversations(true);
      setConversationError(null);
      const response = await userAPI.getUserConversations({
        tool_type: 'boardroom',
        page: String(page),
        per_page: '10',
      }) as ConversationListResponse;
      setConversations(response.items || []);
      setTotalConversationPages(response.total_pages || 1);
      setConversationPage(page);
    } catch (err) {
      console.error('[Boardroom] Failed to load conversations:', err);
      setConversationError('Failed to load conversations. Please try again.');
    } finally {
      setLoadingConversations(false);
    }
  }, []);

  const loadMessages = useCallback(async (convId: string, page = 1) => {
    try {
      setLoadingMessages(true);
      const response = await userAPI.getConversationMessages(
        convId,
        { page: String(page), per_page: '50', order: messageOrder }
      ) as ConversationMessagesResponse;
      setConversationMessages(response.items || []);
      setTotalMessagePages(response.total_pages || 1);
      setMessagePage(page);
    } catch (err) {
      console.error('[Boardroom] Failed to load messages:', err);
    } finally {
      setLoadingMessages(false);
    }
  }, [messageOrder]);

  // Load conversations when modal opens
  useEffect(() => {
    if (isOpen) {
      setSelectedConversation(null);
      setConversationMessages([]);
      setMobileShowMessages(false);
      loadConversations(1);
    }
  }, [isOpen, loadConversations]);

  const handleSelectConversation = useCallback(async (conv: ConversationSummary) => {
    setSelectedConversation(conv);
    setMessagePage(1);
    setMobileShowMessages(true);
    await loadMessages(conv.id, 1);
  }, [loadMessages]);

  const handleLoadConversation = useCallback(() => {
    if (!selectedConversation || conversationMessages.length === 0) return;

    // Convert all messages to FollowUpMessage format
    const followUpMessages: FollowUpMessage[] = conversationMessages.map(msg => ({
      role: senderTypeToRole(msg.sender_type),
      content: msg.content,
      timestamp: msg.created_at,
      messageId: msg.id,
    }));

    onLoadConversation(selectedConversation.id, followUpMessages);
    onClose();
  }, [selectedConversation, conversationMessages, onLoadConversation, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className={`w-full max-w-[95vw] md:max-w-4xl max-h-[90vh] rounded-xl shadow-xl flex flex-col ${
        darkMode ? 'bg-[#1e1e1e]' : 'bg-white'
      }`}>
        {/* Header */}
        <div className={`px-6 py-4 border-b flex justify-between items-center ${
          darkMode ? 'border-[#333333]' : 'border-gray-200'
        }`}>
          <h2 className={`text-xl font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            Conversation History
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
          <div className={`w-full md:w-1/3 border-r overflow-y-auto ${isMobile && mobileShowMessages ? 'hidden' : ''} ${
            darkMode ? 'border-[#333333]' : 'border-gray-200'
          }`}>
            {loadingConversations ? (
              <div className="p-4 text-center">Loading...</div>
            ) : conversationError ? (
              <div className="p-4 text-center">
                <div className={`text-sm ${darkMode ? 'text-red-400' : 'text-red-600'}`}>
                  {conversationError}
                </div>
                <button
                  onClick={() => loadConversations(1)}
                  className={`mt-2 text-sm px-3 py-1 rounded ${
                    darkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Retry
                </button>
              </div>
            ) : conversations.length === 0 ? (
              <div className="p-4 text-center text-gray-500">No conversations yet</div>
            ) : (
              conversations.map(conv => (
                <div
                  key={conv.id}
                  onClick={() => handleSelectConversation(conv)}
                  className={`p-4 cursor-pointer border-b transition-colors ${
                    selectedConversation?.id === conv.id
                      ? darkMode ? 'bg-gray-700' : 'bg-gray-100'
                      : darkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-50'
                  } ${darkMode ? 'border-[#333333]' : 'border-gray-200'}`}
                >
                  <div className={`font-medium text-sm ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    {conv.title || new Date(conv.created_at).toLocaleDateString()}
                  </div>
                  <div className={`text-xs mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    {conv.message_count} messages
                    {!conv.title && (
                      <span className="ml-2">{new Date(conv.created_at).toLocaleTimeString()}</span>
                    )}
                  </div>
                </div>
              ))
            )}

            {/* Pagination */}
            {totalConversationPages > 1 && (
              <div className="p-4 flex justify-center gap-2">
                <button
                  onClick={() => loadConversations(conversationPage - 1)}
                  disabled={conversationPage === 1}
                  className={`px-3 py-1 text-sm rounded ${
                    conversationPage === 1 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-100'
                  }`}
                >
                  Previous
                </button>
                <span className="px-3 py-1 text-sm">
                  {conversationPage} / {totalConversationPages}
                </span>
                <button
                  onClick={() => loadConversations(conversationPage + 1)}
                  disabled={conversationPage === totalConversationPages}
                  className={`px-3 py-1 text-sm rounded ${
                    conversationPage === totalConversationPages ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-100'
                  }`}
                >
                  Next
                </button>
              </div>
            )}
          </div>

          {/* Messages Panel */}
          <div className={`${isMobile && !mobileShowMessages ? 'hidden' : 'flex-1'} flex flex-col`}>
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

                {/* Order toggle */}
                <div className={`p-4 border-b flex gap-2 ${
                  darkMode ? 'border-[#333333]' : 'border-gray-200'
                }`}>
                  <select
                    value={messageOrder}
                    onChange={(e) => {
                      setMessageOrder(e.target.value);
                      loadMessages(selectedConversation.id, 1);
                    }}
                    className={`px-3 py-1 text-sm rounded ${
                      darkMode ? 'bg-gray-700 text-white' : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    <option value="asc">Oldest First</option>
                    <option value="desc">Newest First</option>
                  </select>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4">
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
                          <div className={`max-w-[80%] rounded-lg px-4 py-2 ${
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

                  {/* Message Pagination */}
                  {totalMessagePages > 1 && (
                    <div className="mt-4 flex justify-center gap-2">
                      <button
                        onClick={() => loadMessages(selectedConversation.id, messagePage - 1)}
                        disabled={messagePage === 1}
                        className={`px-3 py-1 text-sm rounded ${
                          messagePage === 1 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-100'
                        }`}
                      >
                        Previous
                      </button>
                      <span className="px-3 py-1 text-sm">
                        {messagePage} / {totalMessagePages}
                      </span>
                      <button
                        onClick={() => loadMessages(selectedConversation.id, messagePage + 1)}
                        disabled={messagePage === totalMessagePages}
                        className={`px-3 py-1 text-sm rounded ${
                          messagePage === totalMessagePages ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-100'
                        }`}
                      >
                        Next
                      </button>
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
      </div>
    </div>
  );
}
