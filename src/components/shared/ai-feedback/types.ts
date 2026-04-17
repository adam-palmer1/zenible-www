export interface CompletionQuestion {
  id: string | number;
  question_text: string;
  order_index: number;
}

export interface AnalysisHistoryItem {
  role: string;
  content: string;
  structured?: unknown;
  messageId?: string;
  usage?: unknown;
  timestamp: string;
  isStreaming?: boolean;
}

export interface MessageAttachment {
  document_id: string;
  file_name: string;
  file_type: string;
  url: string;
  thumbnail_url?: string;
}

export interface LinkedMeeting {
  meeting_id: string;
  title: string;
  start_time: string;
  duration_ms?: number | null;
}

export interface FollowUpMessage {
  role: string;
  content: string;
  messageId?: string;
  timestamp: string;
  characterAvatarUrl?: string | null;
  attachments?: MessageAttachment[];
  linkedMeeting?: LinkedMeeting | null;
}

export interface StructuredAnalysisData {
  score?: number | null;
  strengths?: string[];
  weaknesses?: string[];
  improvements?: string[];
  proposal_text?: string;
  suggested_questions?: string[];
}

export interface FeedbackData {
  raw?: string;
  analysis?: { raw?: string; structured?: unknown };
  structured?: unknown;
  error?: string;
  usage?: unknown;
  isProcessing?: boolean;
  messageId?: string;
}

export interface MetricsData {
  totalTokens?: number;
  tokens_used?: number;
  messages_used?: number;
  messages_limit?: number;
  durationMs?: number;
  costCents?: number;
}

export interface ConversationMessage {
  role: string;
  type: string;
  content?: string;
  structured?: unknown;
  messageId?: string;
  usage?: unknown;
  timestamp: string;
  isStreaming?: boolean;
  characterAvatarUrl?: string | null;
  attachments?: MessageAttachment[];
  linkedMeeting?: LinkedMeeting | null;
}

export interface AIFeedbackSectionProps {
  darkMode: boolean;
  feedback: FeedbackData | null;
  analyzing: boolean;
  isProcessing: boolean;
  isStreaming: boolean;
  streamingContent: string;
  structuredAnalysis: unknown;
  rawAnalysis: string;
  metrics: MetricsData | null;
  usage: MetricsData | null;
  conversationId: string;
  messageId: string;
  onCancel: () => void;
  onSendMessage: (message: string) => Promise<void>;
  onDeleteMessage?: (messageId: string) => Promise<void> | void;
  deletingMessageId?: string | null;
  characterId: string;
  characterName?: string;
  characterAvatarUrl?: string | null;
  characterDescription?: string;
  followUpMessages?: FollowUpMessage[];
  isFollowUpStreaming?: boolean;
  followUpStreamingContent?: string;
  isAdmin?: boolean;
  analysisHistory?: AnalysisHistoryItem[];
}
