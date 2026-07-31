import { io, type Socket } from 'socket.io-client';
import logger from '../utils/logger';
import type { TranscriptEntry, InsightsUpdate } from '../types/meetingIntelligence';

interface ZMIWebSocketConfig {
  baseUrl: string;
  getAccessToken: () => string | null;
  onConnectionChange?: (connected: boolean) => void;
  onTranscript?: (entry: TranscriptEntry) => void;
  onBotStatus?: (data: { session_id: string; status: string }) => void;
  onError?: (error: { session_id?: string; message: string; error?: string }) => void;
  onTranscriptionReady?: (data: { session_id: string }) => void;
  onInsightsUpdate?: (data: InsightsUpdate) => void;
  onInsightsEnabled?: (data: { session_id: string }) => void;
  onInsightsDisabled?: (data: { session_id: string; final_state?: Record<string, unknown> }) => void;
}

class ZMIWebSocketService {
  private socket: Socket | null = null;
  private config: ZMIWebSocketConfig;

  constructor(config: ZMIWebSocketConfig) {
    this.config = config;
  }

  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      const token = this.config.getAccessToken();
      if (!token) {
        reject(new Error('No authentication token available'));
        return;
      }

      this.socket = io(this.config.baseUrl, {
        path: '/zmi/socket.io',
        transports: ['websocket', 'polling'],
        auth: { token },
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 30000,
        reconnectionAttempts: 10,
        timeout: 20000,
        autoConnect: true,
      });

      this.socket.on('connect', () => {
        this.config.onConnectionChange?.(true);
        resolve();
      });

      this.socket.on('disconnect', () => {
        this.config.onConnectionChange?.(false);
      });

      this.socket.on('connect_error', (err: Error) => {
        logger.error('ZMI WebSocket connection error:', err);
        reject(err);
      });

      this.socket.on('transcript', (data: TranscriptEntry) => {
        this.config.onTranscript?.(data);
      });

      this.socket.on('bot_status', (data: { session_id: string; status: string }) => {
        this.config.onBotStatus?.(data);
      });

      this.socket.on('error', (data: { session_id?: string; message: string }) => {
        this.config.onError?.(data);
      });

      this.socket.on('transcription_error', (data: { session_id?: string; message: string; error?: string }) => {
        this.config.onError?.(data);
      });

      this.socket.on('transcription_ready', (data: { session_id: string }) => {
        this.config.onTranscriptionReady?.(data);
      });

      this.socket.on('insights_update', (data: InsightsUpdate) => {
        this.config.onInsightsUpdate?.(data);
      });

      this.socket.on('insights_enabled', (data: { session_id: string }) => {
        this.config.onInsightsEnabled?.(data);
      });

      this.socket.on('insights_disabled', (data: { session_id: string; final_state?: Record<string, unknown> }) => {
        this.config.onInsightsDisabled?.(data);
      });
    });
  }

  subscribeSession(sessionId: string): void {
    this.socket?.emit('subscribe_session', { session_id: sessionId });
  }

  unsubscribeSession(sessionId: string): void {
    this.socket?.emit('unsubscribe_session', { session_id: sessionId });
  }

  enableInsights(sessionId: string, userId: string, companyId: string, objectiveId?: string, objectiveText?: string): void {
    this.socket?.emit('enable_insights', {
      session_id: sessionId, user_id: userId, company_id: companyId,
      objective_id: objectiveId || 'unspecified', objective_text: objectiveText || '',
    });
  }

  disableInsights(sessionId: string): void {
    this.socket?.emit('disable_insights', { session_id: sessionId });
  }

  changeObjective(sessionId: string, objectiveId: string, objectiveText: string = ''): void {
    this.socket?.emit('change_objective', { session_id: sessionId, objective_id: objectiveId, objective_text: objectiveText });
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  isConnected(): boolean {
    return this.socket?.connected || false;
  }
}

export default ZMIWebSocketService;
