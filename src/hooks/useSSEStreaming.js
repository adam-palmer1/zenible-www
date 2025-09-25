import { useState, useCallback, useRef, useEffect } from 'react';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

export function useSSEStreaming(baseUrl = API_BASE_URL) {
  const [result, setResult] = useState({
    response: '',
    sources: [],
    metrics: {},
    isStreaming: false,
    error: null
  });
  
  const eventSourceRef = useRef(null);
  const accumulatedResponseRef = useRef('');
  
  const streamQuestion = useCallback(async (
    question,
    collection,
    options = {}
  ) => {
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
        console.log('SSE connection established');
        if (options.onConnect) options.onConnect();
      };
      
      // Handle default message events (content chunks)
      eventSource.onmessage = (event) => {
        accumulatedResponseRef.current += event.data;
        setResult(prev => ({
          ...prev,
          response: accumulatedResponseRef.current
        }));
        
        if (options.onContent) {
          options.onContent(accumulatedResponseRef.current, event.data);
        }
      };
      
      // Handle start event
      eventSource.addEventListener('start', (event) => {
        const data = JSON.parse(event.data);
        console.log('Streaming started:', data);
        if (options.onStart) options.onStart(data);
      });
      
      // Handle sources event
      eventSource.addEventListener('sources', (event) => {
        const data = JSON.parse(event.data);
        setResult(prev => ({
          ...prev,
          sources: data.sources || []
        }));
        
        if (options.onSources) options.onSources(data.sources || []);
      });
      
      // Handle completion event
      eventSource.addEventListener('done', (event) => {
        const data = JSON.parse(event.data);
        setResult(prev => ({
          ...prev,
          metrics: data,
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
      eventSource.addEventListener('error', (event) => {
        let errorMessage = 'Streaming error occurred';
        
        if (event.data) {
          try {
            const error = JSON.parse(event.data);
            errorMessage = error.message || error.detail || errorMessage;
          } catch {
            errorMessage = event.data;
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
      eventSource.onerror = (error) => {
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
  
  const stopStreaming = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
      setResult(prev => ({
        ...prev,
        isStreaming: false
      }));
    }
  }, []);
  
  const reset = useCallback(() => {
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