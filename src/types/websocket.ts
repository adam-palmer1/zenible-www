/**
 * WebSocket, SSE, and real-time communication types.
 * These are supplementary types not in the OpenAPI spec.
 */

// ──────────────────────────────────────────────
// WebSocket Connection
// ──────────────────────────────────────────────

export type ConnectionQuality = 'excellent' | 'good' | 'fair' | 'poor' | 'disconnected';

export interface ConnectionHealth {
  isHealthy: boolean;
  lastPing: number;
  latency: number;
  reconnectCount: number;
  connectionQuality: ConnectionQuality;
}

export interface WebSocketConfig {
  baseUrl: string;
  getAccessToken: () => string | null;
  onConnectionChange?: (isConnected: boolean) => void;
  debug?: boolean;
}

// ──────────────────────────────────────────────
// WebSocket Context Value
// ──────────────────────────────────────────────

export interface WebSocketContextValue {
  isConnected: boolean;
  connectionHealth: ConnectionHealth;
  connectionError: string | null;
  createConversation: (characterId: string, feature?: string, metadata?: Record<string, unknown>) => Promise<string>;
  sendMessage: (conversationId: string, characterId: string, message: string) => void;
  invokeTool: (conversationId: string, characterId: string, toolName: string, toolArguments: Record<string, unknown>) => void;
  cancelRequest: (conversationId: string) => void;
  getConversationState: (conversationId: string) => ConversationStreamState | null;
  onConversationEvent: (conversationId: string, event: string, handler: (...args: unknown[]) => void) => () => void;
  reconnect: () => Promise<void>;
}

export interface ConversationStreamState {
  conversationId: string;
  isStreaming: boolean;
  error: string | null;
}

// ──────────────────────────────────────────────
// Server-Sent Events (SSE)
// ──────────────────────────────────────────────

export type SSEEventType = 'start' | 'sources' | 'done' | 'error';

export interface SSEStreamOptions {
  top_k?: number;
  score_threshold?: number;
  include_sources?: boolean;
  temperature?: number;
  system_prompt?: string;
  onConnect?: () => void;
  onContent?: (fullResponse: string, chunk: string) => void;
  onStart?: (data: unknown) => void;
  onSources?: (sources: unknown[]) => void;
  onComplete?: (result: SSEStreamResult) => void;
  onError?: (error: { message: string }) => void;
  onDisconnect?: () => void;
}

export interface SSEStreamResult {
  response: string;
  sources: unknown[];
  metrics: Record<string, unknown>;
}

export interface SSEStreamState {
  response: string;
  sources: unknown[];
  metrics: Record<string, unknown>;
  isStreaming: boolean;
  error: string | null;
}

// ──────────────────────────────────────────────
// Notifications
// ──────────────────────────────────────────────

export type NotificationType = 'success' | 'error' | 'info' | 'warning';

export interface Notification {
  id: number;
  type: NotificationType;
  message: string;
  title?: string;
  duration?: number;
  action?: string;
  onAction?: () => void;
}

export interface NotificationOptions {
  title?: string;
  duration?: number;
  action?: string;
  onAction?: () => void;
}

export interface NotificationContextValue {
  showSuccess: (message: string, options?: NotificationOptions) => number;
  showError: (message: string, options?: NotificationOptions) => number;
  showInfo: (message: string, options?: NotificationOptions) => number;
  showWarning: (message: string, options?: NotificationOptions) => number;
  showConfirm: (title: string, message: string) => Promise<boolean>;
  removeNotification: (id: number) => void;
}
