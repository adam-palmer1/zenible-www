class StableWebSocketConnection {
  constructor(wsService) {
    this.wsService = wsService;
    this.pingInterval = null;
    this.healthCheckInterval = null;
    this.lastPingTime = 0;
    this.pingTimeoutId = null; // Track the timeout ID
    this.latencyHistory = [];
    this.maxLatencyHistorySize = 10;
    this.connectionHealth = {
      isHealthy: false,
      lastPing: 0,
      latency: 0,
      reconnectCount: 0,
      connectionQuality: 'poor'
    };
    this.setupHealthMonitoring();
  }

  setupHealthMonitoring() {
    const socket = this.wsService.getSocket();
    if (!socket) return;

    // Setup ping-pong for latency monitoring
    socket.on('pong', (data) => {
      // Clear any pending timeout
      if (this.pingTimeoutId) {
        clearTimeout(this.pingTimeoutId);
        this.pingTimeoutId = null;
      }

      const latency = Date.now() - this.lastPingTime;
      this.updateLatencyMetrics(latency);

      // Update ping time to mark this ping as answered
      this.lastPingTime = Date.now();

      this.connectionHealth = {
        ...this.connectionHealth,
        isHealthy: true,
        lastPing: Date.now(),
        latency
      };
    });

    // Monitor connection events
    socket.on('connect', () => {
      this.startHealthChecks();
      this.connectionHealth.isHealthy = true;
    });

    socket.on('disconnect', () => {
      this.stopHealthChecks();
      this.connectionHealth.isHealthy = false;
      this.connectionHealth.reconnectCount++;
    });

    socket.on('reconnect', (attemptNumber) => {
      this.connectionHealth.reconnectCount++;
      this.startHealthChecks();
    });

    socket.on('reconnect_error', (error) => {
      console.error('Reconnection error:', error);
    });

    socket.on('reconnect_failed', () => {
      console.error('Reconnection failed - manual intervention required');
      this.handleReconnectionFailure();
    });

    // Start health checks if already connected
    if (socket.connected) {
      this.startHealthChecks();
    }
  }

  startHealthChecks() {
    // Send ping every 25 seconds
    this.pingInterval = setInterval(() => {
      this.sendPing();
    }, 25000);

    // Check connection health every 30 seconds
    this.healthCheckInterval = setInterval(() => {
      this.evaluateConnectionHealth();
    }, 30000);

    // Initial ping
    this.sendPing();
  }

  stopHealthChecks() {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }

    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
    }
  }

  sendPing() {
    const socket = this.wsService.getSocket();
    if (!socket?.connected) return;

    this.lastPingTime = Date.now();
    const currentPingTime = this.lastPingTime; // Capture the current ping time
    const pingMessage = {
      timestamp: currentPingTime,
      tracking_id: `ping_${currentPingTime}`
    };

    socket.emit('ping', pingMessage);

    // Set timeout for pong response
    this.pingTimeoutId = setTimeout(() => {
      // Only timeout if this specific ping wasn't answered
      if (this.lastPingTime === currentPingTime) {
        this.connectionHealth.isHealthy = false;
        console.warn('Ping timeout - connection may be degraded');
        this.handleDegradedConnection();
      }
    }, 5000);
  }

  updateLatencyMetrics(latency) {
    this.latencyHistory.push(latency);
    if (this.latencyHistory.length > this.maxLatencyHistorySize) {
      this.latencyHistory.shift();
    }

    const avgLatency = this.latencyHistory.reduce((a, b) => a + b, 0) / this.latencyHistory.length;

    // Determine connection quality
    if (avgLatency < 50) {
      this.connectionHealth.connectionQuality = 'excellent';
    } else if (avgLatency < 150) {
      this.connectionHealth.connectionQuality = 'good';
    } else if (avgLatency < 300) {
      this.connectionHealth.connectionQuality = 'fair';
    } else {
      this.connectionHealth.connectionQuality = 'poor';
    }
  }

  evaluateConnectionHealth() {
    const now = Date.now();
    const timeSinceLastPing = now - this.connectionHealth.lastPing;

    // If no pong received in 60 seconds, connection is unhealthy
    if (timeSinceLastPing > 60000) {
      this.connectionHealth.isHealthy = false;
      this.handleUnhealthyConnection();
    }
  }

  handleDegradedConnection() {
    console.warn('Connection degraded - implementing fallback strategy');
    // Notify UI to show connection warning
    // Could emit an event or call a callback here
    if (this.onConnectionDegraded) {
      this.onConnectionDegraded(this.connectionHealth);
    }
  }

  handleUnhealthyConnection() {
    console.error('Connection unhealthy - attempting recovery');
    const socket = this.wsService.getSocket();
    if (socket) {
      socket.disconnect();
      setTimeout(() => {
        socket.connect();
      }, 1000);
    }
  }

  handleReconnectionFailure() {
    console.error('Failed to reconnect - manual refresh may be required');
    // Notify user to refresh the page
    if (this.onReconnectionFailure) {
      this.onReconnectionFailure();
    }
  }

  getConnectionHealth() {
    return { ...this.connectionHealth };
  }

  // Force reconnection
  async forceReconnect() {
    const socket = this.wsService.getSocket();
    if (!socket) return;

    socket.disconnect();
    await new Promise(resolve => setTimeout(resolve, 100));
    socket.connect();
  }

  // Set callbacks for connection events
  setCallbacks(callbacks) {
    if (callbacks.onConnectionDegraded) {
      this.onConnectionDegraded = callbacks.onConnectionDegraded;
    }
    if (callbacks.onReconnectionFailure) {
      this.onReconnectionFailure = callbacks.onReconnectionFailure;
    }
  }

  destroy() {
    this.stopHealthChecks();
  }
}

export default StableWebSocketConnection;