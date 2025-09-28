import { io } from 'socket.io-client';
import { v4 as uuidv4 } from 'uuid';

class WebSocketService {
  constructor(config) {
    this.socket = null;
    this.config = config;
    this.messageTracking = new Map();
    this.panelConnections = new Map(); // panelId -> conversationId
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
        if (this.config.debug) {
          console.log('WebSocket connected:', data);
        }
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
        if (this.config.debug) {
          console.log('WebSocket connected (fallback)');
        }
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
      this.rejoinPanels(); // Rejoin panels after reconnection
    });

    this.socket.on('disconnect', (reason) => {
      this.config.onConnectionChange?.(false);
      if (this.config.debug) {
        console.log('WebSocket disconnected:', reason);
      }
    });

    this.socket.on('auth_error', (data) => {
      console.error('Authentication error:', data);
      // Trigger token refresh
      this.handleAuthError();
    });

    // Message tracking events
    this.socket.on('message_received', (data) => {
      const tracking = this.messageTracking.get(data.chat_id);
      if (tracking) {
        tracking.metadata = { ...tracking.metadata, serverReceived: true };
      }
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

  async rejoinPanels() {
    // Rejoin all panels after reconnection
    for (const [panelId, conversationId] of this.panelConnections) {
      await this.joinPanel(panelId, conversationId);
    }
  }

  // Generate tracking ID for message correlation
  generateTrackingId() {
    return `msg_${Date.now()}_${uuidv4()}`;
  }

  // Join a panel for multi-panel support
  async joinPanel(panelId, conversationId) {
    if (!this.socket?.connected) {
      throw new Error('WebSocket not connected');
    }

    return new Promise((resolve, reject) => {
      this.socket.emit('join_panel', {
        panel_id: panelId,
        conversation_id: conversationId
      });

      const timeout = setTimeout(() => {
        reject(new Error('Panel join timeout'));
      }, 5000);

      this.socket.once('panel_joined', (data) => {
        clearTimeout(timeout);
        if (data.panel_id === panelId) {
          this.panelConnections.set(panelId, conversationId);
          resolve();
        }
      });
    });
  }

  // Leave a panel
  async leavePanel(panelId) {
    if (!this.socket?.connected) return;

    this.socket.emit('leave_panel', { panel_id: panelId });
    this.panelConnections.delete(panelId);
  }

  // Send message with tracking
  sendMessage(params) {
    if (!this.socket?.connected) {
      throw new Error('WebSocket not connected');
    }

    const trackingId = this.generateTrackingId();

    const message = {
      trackingId,
      conversationId: params.conversationId,
      panelId: params.panelId,
      content: params.content,
      metadata: params.metadata,
      timestamp: Date.now()
    };

    this.messageTracking.set(trackingId, message);

    this.socket.emit('send_message', {
      message: params.content,
      conversation_id: params.conversationId,
      panel_id: params.panelId,
      tracking_id: trackingId,
      metadata: params.metadata
    });

    return trackingId;
  }

  // Clean up tracking after message completion
  cleanupTracking(trackingId) {
    this.messageTracking.delete(trackingId);
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.messageTracking.clear();
    this.panelConnections.clear();
  }

  getSocket() {
    return this.socket;
  }

  isConnected() {
    return this.socket?.connected || false;
  }
}

export default WebSocketService;