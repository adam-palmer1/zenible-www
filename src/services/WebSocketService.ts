import { io, type Socket } from 'socket.io-client';
import logger from '../utils/logger';

interface WebSocketConfig {
  baseUrl: string;
  getAccessToken: () => string | null;
  onConnectionChange?: (connected: boolean) => void;
  debug?: boolean;
}

class WebSocketService {
  private socket: Socket | null;
  private config: WebSocketConfig;
  private reconnectAttempts: number;
  private maxReconnectAttempts: number;
  private reconnectDelay: number;

  constructor(config: WebSocketConfig) {
    this.socket = null;
    this.config = config;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 10;
    this.reconnectDelay = 1000;
  }

  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      const token = this.config.getAccessToken();

      if (!token) {
        reject(new Error('No authentication token available'));
        return;
      }

      this.socket = io(this.config.baseUrl, {
        path: '/socket.io',
        transports: ['websocket', 'polling'],
        auth: {
          token: token
        },
        reconnection: true,
        reconnectionDelay: this.reconnectDelay,
        reconnectionDelayMax: 30000,
        reconnectionAttempts: this.maxReconnectAttempts,
        timeout: 20000,
        autoConnect: true
      });

      this.setupEventHandlers();

      this.socket.once('connected', () => {
        this.reconnectAttempts = 0;
        this.reconnectDelay = 1000;
        resolve();
      });

      this.socket.once('connect_error', (error: Error) => {
        if (this.config.debug) {
          logger.error('WebSocket connection error:', error);
        }
        reject(error);
      });

      // Also resolve on regular connect event if 'connected' event doesn't fire
      this.socket.once('connect', () => {
        this.reconnectAttempts = 0;
        this.reconnectDelay = 1000;
        resolve();
      });
    });
  }

  private setupEventHandlers(): void {
    if (!this.socket) return;

    // Connection events
    this.socket.on('connect', () => {
      this.config.onConnectionChange?.(true);
    });

    this.socket.on('disconnect', () => {
      this.config.onConnectionChange?.(false);
    });

    this.socket.on('auth_error', (data: unknown) => {
      logger.error('Authentication error:', data);
      // Trigger token refresh
      this.handleAuthError();
    });

  }

  private async handleAuthError(): Promise<void> {
    // Implement token refresh logic
    const newToken = this.config.getAccessToken();
    if (newToken && this.socket) {
      this.socket.auth = { token: newToken };
      this.socket.connect();
    }
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  getSocket(): Socket | null {
    return this.socket;
  }

  isConnected(): boolean {
    return this.socket?.connected || false;
  }
}

export default WebSocketService;
