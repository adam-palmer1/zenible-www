import { io } from 'socket.io-client';

class WebSocketService {
  constructor(config) {
    this.socket = null;
    this.config = config;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 10;
    this.reconnectDelay = 1000;
  }

  connect() {
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

      this.socket.once('connected', (data) => {
        this.reconnectAttempts = 0;
        this.reconnectDelay = 1000;
        resolve();
      });

      this.socket.once('connect_error', (error) => {
        if (this.config.debug) {
          console.error('WebSocket connection error:', error);
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

  setupEventHandlers() {
    if (!this.socket) return;

    // Connection events
    this.socket.on('connect', () => {
      this.config.onConnectionChange?.(true);
    });

    this.socket.on('disconnect', (reason) => {
      this.config.onConnectionChange?.(false);
    });

    this.socket.on('auth_error', (data) => {
      console.error('Authentication error:', data);
      // Trigger token refresh
      this.handleAuthError();
    });

  }

  async handleAuthError() {
    // Implement token refresh logic
    const newToken = this.config.getAccessToken();
    if (newToken && this.socket) {
      this.socket.auth = { token: newToken };
      this.socket.connect();
    }
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  getSocket() {
    return this.socket;
  }

  isConnected() {
    return this.socket?.connected || false;
  }
}

export default WebSocketService;