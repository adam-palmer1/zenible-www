class MessageQueueManager {
  constructor(wsService, streamingManager) {
    this.queue = new Map();
    this.processingInterval = null;
    this.wsService = wsService;
    this.streamingManager = streamingManager;
    this.isProcessing = false;
    this.startProcessing();
    this.loadQueueFromStorage();
  }

  // Queue a message for sending/retrying
  enqueue(message) {
    const id = `queue_${Date.now()}_${Math.random()}`;
    const queuedMessage = {
      ...message,
      id,
      attempts: 0,
      maxAttempts: message.maxAttempts || 3,
      createdAt: Date.now()
    };

    this.queue.set(id, queuedMessage);
    this.saveQueueToStorage();
    return id;
  }

  startProcessing() {
    this.processingInterval = setInterval(() => {
      if (!this.isProcessing && this.wsService.isConnected()) {
        this.processQueue();
      }
    }, 5000); // Process queue every 5 seconds
  }

  async processQueue() {
    if (this.queue.size === 0) return;

    this.isProcessing = true;
    const now = Date.now();

    for (const [id, message] of this.queue) {
      // Skip if recently attempted
      if (message.lastAttemptAt && (now - message.lastAttemptAt) < 5000) {
        continue;
      }

      // Skip if max attempts reached
      if (message.attempts >= message.maxAttempts) {
        this.handleFailedMessage(message);
        this.queue.delete(id);
        continue;
      }

      try {
        // Attempt to send message
        const trackingId = this.streamingManager.sendMessageToPanel(
          message.panelId,
          message.content,
          message.metadata
        );

        if (trackingId) {
          // Success - remove from queue
          this.queue.delete(id);
          console.log(`Message ${id} sent successfully`);
        } else {
          // Failed - increment attempts
          message.attempts++;
          message.lastAttemptAt = now;
        }
      } catch (error) {
        console.error(`Failed to send message ${id}:`, error);
        message.attempts++;
        message.lastAttemptAt = now;
      }
    }

    this.saveQueueToStorage();
    this.isProcessing = false;
  }

  handleFailedMessage(message) {
    console.error(`Message ${message.id} failed after ${message.attempts} attempts`);
    // Notify user of failed message
    if (this.onMessageFailed) {
      this.onMessageFailed(message);
    }
  }

  saveQueueToStorage() {
    try {
      const queueArray = Array.from(this.queue.values());
      localStorage.setItem('websocket_message_queue', JSON.stringify(queueArray));
    } catch (error) {
      console.error('Failed to save queue to storage:', error);
    }
  }

  loadQueueFromStorage() {
    try {
      const stored = localStorage.getItem('websocket_message_queue');
      if (stored) {
        const queueArray = JSON.parse(stored);
        queueArray.forEach(msg => this.queue.set(msg.id, msg));
      }
    } catch (error) {
      console.error('Failed to load queue from storage:', error);
    }
  }

  getQueueSize() {
    return this.queue.size;
  }

  clearQueue() {
    this.queue.clear();
    localStorage.removeItem('websocket_message_queue');
  }

  setCallbacks(callbacks) {
    if (callbacks.onMessageFailed) {
      this.onMessageFailed = callbacks.onMessageFailed;
    }
  }

  destroy() {
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
    }
    this.saveQueueToStorage();
  }
}

// Error Recovery Manager
class ErrorRecoveryManager {
  constructor(wsService, stableConnection) {
    this.wsService = wsService;
    this.stableConnection = stableConnection;
    this.errorCounts = new Map();
    this.errorThreshold = 3;
    this.recoveryStrategies = new Map();
    this.registerDefaultStrategies();
  }

  registerDefaultStrategies() {
    // Auth error recovery
    this.recoveryStrategies.set('auth_error', async () => {
      console.log('Attempting auth recovery...');
      // Refresh token and reconnect
      await this.refreshAuthToken();
    });

    // Connection error recovery
    this.recoveryStrategies.set('connection_error', async () => {
      console.log('Attempting connection recovery...');
      await this.stableConnection.forceReconnect();
    });

    // Rate limit recovery
    this.recoveryStrategies.set('rate_limit', async () => {
      console.log('Rate limit hit - backing off...');
      await new Promise(resolve => setTimeout(resolve, 30000));
    });

    // Message failure recovery
    this.recoveryStrategies.set('message_failure', async () => {
      console.log('Message failure - retrying with backoff...');
      await new Promise(resolve => setTimeout(resolve, 2000));
    });
  }

  async handleError(errorType, error) {
    // Track error frequency
    const count = (this.errorCounts.get(errorType) || 0) + 1;
    this.errorCounts.set(errorType, count);

    // Check if error threshold reached
    if (count >= this.errorThreshold) {
      console.error(`Error threshold reached for ${errorType}`);
      // Implement circuit breaker pattern
      await this.implementCircuitBreaker(errorType);
      return;
    }

    // Execute recovery strategy
    const strategy = this.recoveryStrategies.get(errorType);
    if (strategy) {
      try {
        await strategy();
        // Reset error count on successful recovery
        this.errorCounts.set(errorType, 0);
      } catch (recoveryError) {
        console.error(`Recovery failed for ${errorType}:`, recoveryError);
      }
    }
  }

  async implementCircuitBreaker(errorType) {
    console.log(`Circuit breaker activated for ${errorType}`);
    // Wait before retrying
    await new Promise(resolve => setTimeout(resolve, 60000));
    // Reset error count
    this.errorCounts.set(errorType, 0);
  }

  async refreshAuthToken() {
    try {
      const refreshToken = localStorage.getItem('refresh_token');
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }

      const response = await fetch('/api/v1/auth/refresh', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          refresh_token: refreshToken
        })
      });

      if (response.ok) {
        const data = await response.json();
        localStorage.setItem('access_token', data.access_token);
        if (data.refresh_token) {
          localStorage.setItem('refresh_token', data.refresh_token);
        }
        // Reconnect with new token
        this.wsService.disconnect();
        await this.wsService.connect();
      } else {
        throw new Error('Token refresh failed');
      }
    } catch (error) {
      console.error('Auth token refresh failed:', error);
      // Redirect to login if refresh fails
      if (this.onAuthFailure) {
        this.onAuthFailure();
      }
    }
  }

  resetErrorCount(errorType) {
    if (errorType) {
      this.errorCounts.delete(errorType);
    } else {
      this.errorCounts.clear();
    }
  }

  setCallbacks(callbacks) {
    if (callbacks.onAuthFailure) {
      this.onAuthFailure = callbacks.onAuthFailure;
    }
  }

  registerStrategy(errorType, strategy) {
    this.recoveryStrategies.set(errorType, strategy);
  }
}

export { MessageQueueManager, ErrorRecoveryManager };