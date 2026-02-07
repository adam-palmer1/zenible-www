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

export interface FollowUpMessage {
  role: string;
  content: string;
  messageId?: string;
  timestamp: string;
}

export interface StructuredAnalysisData {
  score?: number | null;
  strengths?: string[];
  weaknesses?: string[];
  improvements?: string[];
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
  characterId: string;
  characterName?: string;
  characterAvatarUrl?: string | null;
  characterDescription?: string;
  followUpMessages?: FollowUpMessage[];
  isFollowUpStreaming?: boolean;
  followUpStreamingContent?: string;
  completionQuestions?: CompletionQuestion[];
  isAdmin?: boolean;
  analysisHistory?: AnalysisHistoryItem[];
}
