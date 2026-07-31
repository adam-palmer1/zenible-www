import React, { useState, useEffect, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { getMarkdownComponents } from '../components/shared/ai-feedback/markdownComponents';
import { messageAPI } from '../services/messageAPI';
import ReportContentButton from '../components/shared/ReportContentButton';

interface PublicLinkedMeeting {
  title: string;
  start_time?: string | null;
  duration_ms?: number | null;
}

interface PublicMessage {
  sender_type: string;
  sender_name: string;
  avatar_url: string | null;
  content: string | null;
  created_at: string;
  linked_meeting?: PublicLinkedMeeting | null;
}

interface PublicConversation {
  title: string;
  created_at: string;
  participants: Array<{ name: string; avatar_url: string | null }>;
  messages: PublicMessage[];
}

const PublicConversationPage: React.FC = () => {
  const { shareCode } = useParams<{ shareCode: string }>();
  const [conversation, setConversation] = useState<PublicConversation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const markdownComponents = useMemo(() => getMarkdownComponents(false, 'message'), []);

  useEffect(() => {
    if (!shareCode) return;
    const fetchConversation = async () => {
      try {
        setLoading(true);
        const data = await messageAPI.getPublicConversation(shareCode);
        setConversation(data);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Conversation not found or link has been revoked');
      } finally {
        setLoading(false);
      }
    };
    fetchConversation();
  }, [shareCode]);

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString(undefined, {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    });

  const formatTime = (dateStr: string) =>
    new Date(dateStr).toLocaleTimeString(undefined, {
      hour: 'numeric', minute: '2-digit',
    });

  const formatMeetingDuration = (ms: number) => {
    const minutes = Math.round(ms / 60000);
    if (minutes < 60) return `${minutes}m`;
    return `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-purple-600" />
      </div>
    );
  }

  if (error || !conversation) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-3xl mx-auto px-4 py-4 text-center">
            <a href="https://www.zenible.com" target="_blank" rel="noopener noreferrer" className="inline-block">
              <img src="https://www.zenible.com/images/navbar/zenible-logo.svg" alt="Zenible" className="h-7" />
            </a>
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="max-w-md text-center">
            <h1 className="text-xl font-semibold text-gray-900 mb-2">Conversation Not Found</h1>
            <p className="text-gray-500">
              {error || 'This conversation link may have been revoked.'}
            </p>
          </div>
        </div>
        <div className="py-6 text-center text-sm text-gray-400">
          Powered by <a href="https://www.zenible.com" target="_blank" rel="noopener noreferrer" className="font-medium text-purple-600 hover:underline">Zenible</a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold text-gray-900">{conversation.title}</h1>
            <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
              {conversation.created_at && <span>{formatDate(conversation.created_at)}</span>}
              {conversation.participants.length > 0 && (
                <span>with {conversation.participants.map(p => p.name).join(', ')}</span>
              )}
            </div>
          </div>
          <div className="text-sm text-gray-400">
            Shared via <a href="https://www.zenible.com" target="_blank" rel="noopener noreferrer" className="font-medium text-purple-600 hover:underline">Zenible</a>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="max-w-3xl mx-auto px-4 py-6 space-y-3">
        {conversation.messages.map((msg, i) => {
          const isUser = msg.sender_type === 'USER';
          const isAI = msg.sender_type === 'AI';

          return (
            <div key={i} className={`flex gap-3 ${isUser ? 'justify-end' : 'items-start'}`}>
              {/* AI avatar */}
              {isAI && (
                <div className="w-6 h-6 rounded-full bg-violet-100 flex items-center justify-center flex-shrink-0 overflow-hidden mt-5">
                  {msg.avatar_url ? (
                    <img src={msg.avatar_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-xs font-medium text-purple-600">
                      {msg.sender_name.charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
              )}

              <div className={isUser ? 'max-w-[80%]' : ''}>
                {/* Sender name + time */}
                <div className={`flex items-baseline gap-2 mb-0.5 ${isUser ? 'justify-end' : ''}`}>
                  <span className="text-xs font-medium text-gray-500">{msg.sender_name}</span>
                  <span className="text-xs text-gray-400">{formatTime(msg.created_at)}</span>
                </div>

                {/* Message bubble */}
                <div className={`flex items-start gap-1 ${isAI ? 'max-w-[80%]' : ''}`}>
                  <div className={`rounded-lg px-3 py-2 text-sm flex-1 min-w-0 ${
                    isUser
                      ? 'bg-zenible-primary text-white'
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {isAI ? (
                      <div className="prose prose-sm max-w-none prose-pre:bg-gray-100 prose-pre:text-gray-800">
                        <ReactMarkdown
                          remarkPlugins={[remarkGfm]}
                          components={markdownComponents}
                        >
                          {msg.content || ''}
                        </ReactMarkdown>
                      </div>
                    ) : (
                      <span className="whitespace-pre-wrap">{msg.content || ''}</span>
                    )}
                  </div>
                </div>

                {/* Linked meeting mini card */}
                {msg.linked_meeting && (
                  <div className="mt-1.5 flex items-center gap-2 px-2.5 py-1.5 rounded-lg border text-xs bg-violet-50 border-violet-200 text-violet-700">
                    <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    <span className="truncate font-medium">{msg.linked_meeting.title}</span>
                    {msg.linked_meeting.start_time && (
                      <span className="opacity-70 flex-shrink-0">
                        {new Date(msg.linked_meeting.start_time).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                    )}
                    {msg.linked_meeting.duration_ms && (
                      <span className="opacity-70 flex-shrink-0">
                        {formatMeetingDuration(msg.linked_meeting.duration_ms)}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}

        <div className="pt-2 flex justify-end">
          <ReportContentButton />
        </div>
      </div>
    </div>
  );
};

export default PublicConversationPage;
