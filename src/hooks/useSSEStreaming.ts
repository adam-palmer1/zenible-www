import { useState, useCallback, useRef, useEffect } from 'react';
import { API_BASE_URL } from '@/config/api';

interface SSEStreamingResult {
  response: string;
  sources: unknown[];
  metrics: Record<string, unknown>;
  isStreaming: boolean;
  error: string | null;
}

interface SSEStreamingOptions {
  top_k?: number;
  score_threshold?: number;
  include_sources?: boolean;
  temperature?: number;
  system_prompt?: string;
  onConnect?: () => void;
  onContent?: (fullContent: string, chunk: string) => void;
  onStart?: (data: unknown) => void;
  onSources?: (sources: unknown[]) => void;
  onComplete?: (result: { response: string; sources: unknown[]; metrics: unknown }) => void;
  onError?: (error: { message: string }) => void;
  onDisconnect?: () => void;
}

interface UseSSEStreamingReturn extends SSEStreamingResult {
  streamQuestion: (question: string, collection: string, options?: SSEStreamingOptions) => Promise<void>;
  stopStreaming: () => void;
  reset: () => void;
}

export function useSSEStreaming(baseUrl: string = API_BASE_URL): UseSSEStreamingReturn {
  const [result, setResult] = useState<SSEStreamingResult>({
    response: '',
    sources: [],
    metrics: {},
    isStreaming: false,
    error: null
  });

  const eventSourceRef = useRef<EventSource | null>(null);
  const accumulatedResponseRef = useRef<string>('');

  const streamQuestion = useCallback(async (
    question: string,
    collection: string,
    options: SSEStreamingOptions = {}
  ): Promise<void> => {
    // Clean up any existing connection
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }

    // Reset state
    accumulatedResponseRef.current = '';
    setResult({
      response: '',
      sources: [],
      metrics: {},
      isStreaming: true,
      error: null
    });

    // Build query parameters
    const params = new URLSearchParams({
      question,
      collection,
      top_k: String(options.top_k || 5),
      score_threshold: String(options.score_threshold || 0.7),
      include_sources: options.include_sources !== false ? 'true' : 'false',
      ...(options.temperature && { temperature: String(options.temperature) }),
      ...(options.system_prompt && { system_prompt: options.system_prompt })
    });

    // Get auth token if available
    const accessToken = localStorage.getItem('access_token');
    const apiKey = localStorage.getItem('apiKey');

    // Add auth to URL params if available
    if (accessToken) {
      params.append('access_token', accessToken);
    } else if (apiKey) {
      params.append('api_key', apiKey);
    }

    const url = `${baseUrl}/sse/qa?${params}`;

    try {
      const eventSource = new EventSource(url);
      eventSourceRef.current = eventSource;

      // Handle connection open
      eventSource.onopen = () => {
        if (options.onConnect) options.onConnect();
      };

      // Handle default message events (content chunks)
      eventSource.onmessage = (event: MessageEvent) => {
        accumulatedResponseRef.current += event.data as string;
        setResult(prev => ({
          ...prev,
          response: accumulatedResponseRef.current
        }));

        if (options.onContent) {
          options.onContent(accumulatedResponseRef.current, event.data as string);
        }
      };

      // Handle start event
      eventSource.addEventListener('start', (event: MessageEvent) => {
        const data = JSON.parse(event.data as string);
        if (options.onStart) options.onStart(data);
      });

      // Handle sources event
      eventSource.addEventListener('sources', (event: MessageEvent) => {
        const data = JSON.parse(event.data as string) as { sources?: unknown[] };
        setResult(prev => ({
          ...prev,
          sources: data.sources || []
        }));

        if (options.onSources) options.onSources(data.sources || []);
      });

      // Handle completion event
      eventSource.addEventListener('done', (event: MessageEvent) => {
        const data = JSON.parse(event.data as string);
        setResult(prev => ({
          ...prev,
          metrics: data as Record<string, unknown>,
          isStreaming: false
        }));

        if (options.onComplete) {
          options.onComplete({
            response: accumulatedResponseRef.current,
            sources: result.sources,
            metrics: data
          });
        }

        eventSource.close();
        eventSourceRef.current = null;
      });

      // Handle error event from server
      eventSource.addEventListener('error', (event: MessageEvent) => {
        let errorMessage = 'Streaming error occurred';

        if (event.data) {
          try {
            const error = JSON.parse(event.data as string) as { message?: string; detail?: string };
            errorMessage = error.message || error.detail || errorMessage;
          } catch {
            errorMessage = event.data as string;
          }
        }

        setResult(prev => ({
          ...prev,
          error: errorMessage,
          isStreaming: false
        }));

        if (options.onError) options.onError({ message: errorMessage });

        eventSource.close();
        eventSourceRef.current = null;
      });

      // Handle connection errors
      eventSource.onerror = (error: Event) => {
        console.error('EventSource error:', error);

        if (eventSource.readyState === EventSource.CLOSED) {
          setResult(prev => ({
            ...prev,
            isStreaming: false
          }));

          if (options.onDisconnect) options.onDisconnect();
        } else {
          const errorMessage = 'Connection to streaming service failed';
          setResult(prev => ({
            ...prev,
            error: errorMessage,
            isStreaming: false
          }));

          if (options.onError) options.onError({ message: errorMessage });
        }

        eventSource.close();
        eventSourceRef.current = null;
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to connect';
      setResult(prev => ({
        ...prev,
        error: errorMessage,
        isStreaming: false
      }));

      if (options.onError) options.onError({ message: errorMessage });
    }
  }, [baseUrl]);

  const stopStreaming = useCallback((): void => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
      setResult(prev => ({
        ...prev,
        isStreaming: false
      }));
    }
  }, []);

  const reset = useCallback((): void => {
    stopStreaming();
    accumulatedResponseRef.current = '';
    setResult({
      response: '',
      sources: [],
      metrics: {},
      isStreaming: false,
      error: null
    });
  }, [stopStreaming]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
    };
  }, []);

  return {
    ...result,
    streamQuestion,
    stopStreaming,
    reset
  };
}
