import { useState, useEffect, useCallback, useRef } from 'react';
import { useWebSocketConnection } from './useWebSocketConnection';

/**
 * Hook for proposal analysis via WebSocket
 * Handles the proposal analysis flow with structured feedback
 */
export function useProposalAnalysis({
  conversationId,
  characterId,
  panelId,
  onAnalysisStarted,
  onAnalysisComplete,
  onStreamingStarted,
  onStreamingChunk,
  onError
}) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);

  // Refs to track current streaming/analyzing state for cleanup
  const isStreamingRef = useRef(false);
  const isAnalyzingRef = useRef(false);
  const [streamingContent, setStreamingContent] = useState('');
  const [displayContent, setDisplayContent] = useState(''); // Content to display (excludes [SYSTEM: EOM] and after)
  const [analysis, setAnalysis] = useState(null);
  const [error, setError] = useState(null);
  const [metrics, setMetrics] = useState(null);
  const [usage, setUsage] = useState(null);
  const [messageId, setMessageId] = useState(null); // Track the message ID for rating
  const [trackingId, setTrackingId] = useState(null); // Track the session ID for cancellation
  const [isPanelReady, setIsPanelReady] = useState(false); // Track if panel is ready for use
  const eomBuffer = useRef(''); // Buffer to detect [SYSTEM: EOM] across chunks
  const eomFoundRef = useRef(false); // Track if EOM has been found

  const { streamingManager, joinPanel, leavePanel, isConnected } = useWebSocketConnection();
  const unsubscribersRef = useRef([]);
  const effectivePanelId = panelId || `proposal_${conversationId}`;
  const currentAnalysisRef = useRef(null);
  const panelJoinedRef = useRef(false);
  const streamingContentRef = useRef('');

  // Store callbacks in refs to avoid effect re-runs
  const callbacksRef = useRef({
    onAnalysisStarted,
    onAnalysisComplete,
    onStreamingStarted,
    onStreamingChunk,
    onError
  });

  // Update callbacks without triggering effect
  useEffect(() => {
    callbacksRef.current = {
      onAnalysisStarted,
      onAnalysisComplete,
      onStreamingStarted,
      onStreamingChunk,
      onError
    };
  }, [onAnalysisStarted, onAnalysisComplete, onStreamingStarted, onStreamingChunk, onError]);

  useEffect(() => {
    console.log('[useProposalAnalysis] Main effect running:', {
      conversationId,
      isConnected,
      hasStreamingManager: !!streamingManager,
      panelJoined: panelJoinedRef.current
    });

    if (!conversationId || !isConnected || !streamingManager) {
      console.log('[useProposalAnalysis] Skipping setup - not ready');
      setIsPanelReady(false);
      return;
    }

    // Prevent duplicate panel joins
    if (panelJoinedRef.current) {
      console.log('[useProposalAnalysis] Panel already joined, skipping setup');
      return;
    }

    const setupHandlers = async () => {
      try {
        // Join the panel
        await joinPanel(effectivePanelId, conversationId);
        panelJoinedRef.current = true;
        setIsPanelReady(true);

        // Setup event handlers
        const handlers = [
          // Analysis started
          streamingManager.onPanelEvent(effectivePanelId, 'proposal_analysis_started', (data) => {
            setIsAnalyzing(true);
            isAnalyzingRef.current = true;
            setError(null);
            currentAnalysisRef.current = data.analysisId;

            // Store tracking ID for cancellation - prioritize backend-provided IDs
            const backendTrackingId = data.tracking_id || data.trackingId || data.messageId || data.message_id;
            if (backendTrackingId) {
              setTrackingId(backendTrackingId);
            }

            eomBuffer.current = ''; // Reset EOM buffer
            eomFoundRef.current = false; // Reset EOM found flag

            if (callbacksRef.current.onAnalysisStarted) {
              callbacksRef.current.onAnalysisStarted(data);
            }
          }),

          // Streaming started
          streamingManager.onPanelEvent(effectivePanelId, 'proposal_analysis_streaming_started', (data) => {
            setIsStreaming(true);
            isStreamingRef.current = true;
            setStreamingContent('');
            setDisplayContent('');
            streamingContentRef.current = '';

            // Update tracking ID if provided (backend might send updated ID)
            const backendTrackingId = data.tracking_id || data.trackingId || data.messageId || data.message_id;
            if (backendTrackingId) {
              setTrackingId(backendTrackingId);
            }

            eomBuffer.current = ''; // Reset EOM buffer
            eomFoundRef.current = false; // Reset EOM found flag

            if (callbacksRef.current.onStreamingStarted) {
              callbacksRef.current.onStreamingStarted(data);
            }
          }),

          // Streaming chunk received
          streamingManager.onPanelEvent(effectivePanelId, 'proposal_analysis_chunk', (data) => {
            const chunkText = data.chunk || data.text || data.message || data.content || '';

            // Ensure streaming is marked as active when chunks arrive
            setIsStreaming(true);
            isStreamingRef.current = true;

            // Update full streaming content
            setStreamingContent(prev => {
              const newContent = prev + chunkText;
              streamingContentRef.current = newContent;

              // Check for [SYSTEM: EOM] marker
              // Build up a buffer to check across chunk boundaries
              eomBuffer.current += chunkText;
              if (eomBuffer.current.length > 100) {
                // Keep only last 100 chars to check for EOM
                eomBuffer.current = eomBuffer.current.slice(-100);
              }

              // Only update display content if EOM hasn't been found yet
              if (!eomFoundRef.current) {
                // Check if we've received the EOM marker
                const eomIndex = newContent.indexOf('[SYSTEM: EOM]');
                if (eomIndex !== -1) {
                  // Found EOM - display only content before it and stop updating display
                  const displayPart = newContent.substring(0, eomIndex).trim();
                  setDisplayContent(displayPart);
                  eomFoundRef.current = true; // Mark that we've found EOM
                } else {
                  // No EOM yet, display all content
                  setDisplayContent(newContent);
                }
              }

              return newContent;
            });

            if (callbacksRef.current.onStreamingChunk) {
              callbacksRef.current.onStreamingChunk(data);
            }
          }),

          // Analysis complete with structured data
          streamingManager.onPanelEvent(effectivePanelId, 'proposal_analysis_complete', (data) => {
            setIsAnalyzing(false);
            isAnalyzingRef.current = false;
            setIsStreaming(false);
            isStreamingRef.current = false;

            // Get the accumulated streaming content from ref
            const fullContent = streamingContentRef.current;
            let displayPart = fullContent;

            // Try to extract JSON from the accumulated content
            let structuredData = null;

            // Look for JSON block in the content (after EOM marker)
            if (fullContent) {
              // Split by [SYSTEM: EOM] to get display and JSON parts
              const eomIndex = fullContent.indexOf('[SYSTEM: EOM]');
              let jsonPart = '';

              if (eomIndex !== -1) {
                displayPart = fullContent.substring(0, eomIndex).trim();
                jsonPart = fullContent.substring(eomIndex + '[SYSTEM: EOM]'.length).trim();
              } else {
                // If no EOM marker, don't try to parse JSON from markdown content
                setDisplayContent(fullContent);
                return;
              }

              // Make sure display content is set to the part before EOM
              setDisplayContent(displayPart);

              // Only try to parse JSON if we have content after EOM marker
              if (!jsonPart.trim()) {
                return;
              }

              // Try to find actual JSON block (must be valid JSON structure)
              const jsonMatch = jsonPart.match(/\{[\s\S]*\}/);

              if (jsonMatch) {
                try {
                  const parsedData = JSON.parse(jsonMatch[0]);

                  // Validate that we have actual structured data
                  const hasValidContent = (
                    (Array.isArray(parsedData.strengths) && parsedData.strengths.length > 0) ||
                    (Array.isArray(parsedData.weaknesses) && parsedData.weaknesses.length > 0) ||
                    (Array.isArray(parsedData.improvements) && parsedData.improvements.length > 0) ||
                    (parsedData.score !== null && parsedData.score !== undefined)
                  );

                  if (hasValidContent) {
                    // Parse score as number if it's a string
                    let scoreValue = null;
                    if (parsedData.score !== null && parsedData.score !== undefined) {
                      scoreValue = typeof parsedData.score === 'string' ? parseFloat(parsedData.score) : parsedData.score;
                    }

                    // Helper function to filter out markdown/JSON-like content from arrays
                    const cleanArray = (arr) => {
                      if (!Array.isArray(arr)) return [];
                      return arr.filter(item => {
                        if (typeof item !== 'string') return false;

                        // Filter out markdown headers
                        if (item.trim().startsWith('###')) return false;
                        if (item.trim().startsWith('##')) return false;
                        if (item.trim().startsWith('#')) return false;

                        // Filter out markdown dividers
                        if (item.trim() === '--' || item.trim() === '---') return false;
                        if (item.trim().match(/^-+$/)) return false;

                        // Filter out JSON syntax
                        if (item.includes('"strengths":') || item.includes('"weaknesses":') || item.includes('"improvements":')) return false;
                        if (item.trim().startsWith('{') || item.trim().startsWith('[')) return false;
                        if (item.trim().endsWith('}') || item.trim().endsWith(']')) return false;

                        // Filter out empty or whitespace-only items
                        if (!item.trim()) return false;

                        return true;
                      });
                    };

                    // Map the JSON keys to our expected format
                    // Backend sends: strengths, weaknesses, improvements
                    // We map to: strengths, improvements (from weaknesses), suggestions (from improvements)
                    structuredData = {
                      score: scoreValue,
                      strengths: cleanArray(parsedData.strengths),
                      improvements: cleanArray(parsedData.weaknesses),
                      suggestions: cleanArray(parsedData.improvements),
                      red_flags: cleanArray(parsedData.red_flags),
                      missing_elements: cleanArray(parsedData.missing_elements),
                      key_requirements: cleanArray(parsedData.key_requirements),
                      pricing_strategy: parsedData.pricing_strategy || null
                    };
                  }
                } catch (error) {
                  // Silent fail - structured data won't be available
                }
              }
            }

            // ONLY use locally parsed JSON from EOM marker - never use backend structured data
            // If JSON isn't present, structured sections won't display
            const finalStructured = structuredData;

            const analysis = {
              raw: displayPart || data.analysis?.raw || '',  // Use display part (before EOM)
              structured: finalStructured
            };

            // Set the structured analysis
            setAnalysis(analysis);

            // Set message ID for rating
            if (data.messageId || data.message_id) {
              setMessageId(data.messageId || data.message_id);
            }

            // Set usage metrics if available
            if (data.usage) {
              setUsage(data.usage);
            }

            // Set token metrics
            if (data.tokens_used) {
              setMetrics({
                totalTokens: data.tokens_used,
                modelUsed: data.model_used,
                character: data.character
              });
            }

            currentAnalysisRef.current = null;

            if (callbacksRef.current.onAnalysisComplete) {
              callbacksRef.current.onAnalysisComplete({
                ...data,
                analysis
              });
            }
          }),

          // Analysis error
          streamingManager.onPanelEvent(effectivePanelId, 'proposal_analysis_error', (data) => {
            setIsAnalyzing(false);
            isAnalyzingRef.current = false;
            setError(data.error || 'Analysis failed');
            currentAnalysisRef.current = null;
            setTrackingId(null);

            if (callbacksRef.current.onError) {
              callbacksRef.current.onError(data);
            }
          }),

          // Handle cancellation confirmation
          streamingManager.onPanelEvent(effectivePanelId, 'proposal_analysis_cancelled', (data) => {
            setIsAnalyzing(false);
            isAnalyzingRef.current = false;
            setIsStreaming(false);
            isStreamingRef.current = false;
            currentAnalysisRef.current = null;
            setTrackingId(null);

            // Keep partial response if available
            if (data.partial_response) {
              const partialContent = data.partial_response;
              setDisplayContent(partialContent);
              setStreamingContent(partialContent);
              streamingContentRef.current = partialContent;
            }

            // Optionally call error handler with cancellation info
            if (callbacksRef.current.onError) {
              callbacksRef.current.onError({
                ...data,
                error: 'Analysis cancelled by user',
                cancelled: true
              });
            }
          })
        ];

        unsubscribersRef.current = handlers;
      } catch (error) {
        setError('Failed to initialize analysis');
      }
    };

    // Call the async function
    setupHandlers().catch(error => {
      setError('Failed to connect to analysis service');
    });

    // Cleanup
    return () => {
      console.log('[useProposalAnalysis] Cleanup running:', {
        isStreaming: isStreamingRef.current,
        isAnalyzing: isAnalyzingRef.current,
        panelJoined: panelJoinedRef.current,
        effectivePanelId,
        willCleanupPanel: !isStreamingRef.current && !isAnalyzingRef.current && panelJoinedRef.current,
        stackTrace: new Error().stack
      });

      // Don't cleanup if we're actively streaming or analyzing (check refs for current values)
      if (isStreamingRef.current || isAnalyzingRef.current) {
        console.log('[useProposalAnalysis] Skipping cleanup - active streaming/analyzing');
        return;
      }
      unsubscribersRef.current.forEach(unsub => {
        if (typeof unsub === 'function') unsub();
      });
      unsubscribersRef.current = [];
      if (panelJoinedRef.current) {
        console.log('[useProposalAnalysis] Leaving panel:', effectivePanelId);
        leavePanel(effectivePanelId);
        panelJoinedRef.current = false;
        setIsPanelReady(false);
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId, effectivePanelId, isConnected]);

  const analyzeProposal = useCallback((jobPost, proposal, platform, metadata = {}) => {
    if (!streamingManager) {
      setError('WebSocket not initialized');
      return null;
    }

    if (!isConnected) {
      setError('Not connected to server');
      return null;
    }

    if (!panelJoinedRef.current || !isPanelReady) {
      setError('Initializing connection... Please try again in a moment.');
      return null;
    }

    if (isAnalyzing) {
      return null;
    }

    // Verify panel exists in streaming manager before sending
    const panelExists = streamingManager.panels?.has(effectivePanelId);

    if (!panelExists) {
      setError('Connection error. Please refresh the page and try again.');
      return null;
    }

    // Reset state
    setError(null);
    setAnalysis(null);
    setMetrics(null);
    setUsage(null);
    setMessageId(null);
    setTrackingId(null);
    setIsStreaming(false);
    isStreamingRef.current = false;
    setStreamingContent('');
    setDisplayContent('');
    streamingContentRef.current = '';
    eomBuffer.current = '';
    eomFoundRef.current = false;

    // Send the analysis request
    try {
      const newTrackingId = streamingManager.sendMessageToPanel(
        effectivePanelId,
        jobPost, // Job post is the main content
        {
          analysisType: 'proposal_wizard',
          characterId,
          jobPost,
          proposal,
          platform,
          extra: metadata
        }
      );

      if (!newTrackingId) {
        setError('Failed to start analysis');
        return null;
      }

      // Store the tracking ID for potential cancellation
      setTrackingId(newTrackingId);
      return newTrackingId;
    } catch (error) {
      setError(error.message || 'Failed to send analysis');
      return null;
    }
  }, [streamingManager, isConnected, isAnalyzing, effectivePanelId, characterId]);

  const reset = useCallback(() => {
    setIsAnalyzing(false);
    isAnalyzingRef.current = false;
    setIsStreaming(false);
    isStreamingRef.current = false;
    setStreamingContent('');
    setDisplayContent('');
    streamingContentRef.current = '';
    setAnalysis(null);
    setError(null);
    setMetrics(null);
    setUsage(null);
    setMessageId(null);
    setTrackingId(null);
    currentAnalysisRef.current = null;
    eomBuffer.current = '';
    eomFoundRef.current = false;
  }, []);

  const cancelAnalysis = useCallback(() => {
    if (!trackingId || !streamingManager || trackingId === 'pending_backend_tracking_id') {
      return false;
    }

    try {
      // Send cancellation request via streaming manager
      const success = streamingManager.cancelResponse(trackingId);

      if (success) {
        // Optimistically update UI state
        setIsStreaming(false);
        isStreamingRef.current = false;
        setIsAnalyzing(false);
        isAnalyzingRef.current = false;
      }

      return success;
    } catch (error) {
      return false;
    }
  }, [trackingId, streamingManager]);

  const getStructuredAnalysis = useCallback(() => {
    if (!analysis?.structured) {
      return null;
    }

    return {
      strengths: analysis.structured.strengths || [],
      improvements: analysis.structured.improvements || [],
      suggestions: analysis.structured.suggestions || [],
      redFlags: analysis.structured.red_flags || [],
      missingElements: analysis.structured.missing_elements || [],
      keyRequirements: analysis.structured.key_requirements || [],
      pricingStrategy: analysis.structured.pricing_strategy || null,
      score: analysis.structured.score || null
    };
  }, [analysis]);

  return {
    // State
    isConnected,
    isPanelReady,
    isAnalyzing,
    isStreaming,
    streamingContent: displayContent, // Return display content (before EOM)
    analysis,
    structuredAnalysis: getStructuredAnalysis(),
    rawAnalysis: analysis?.raw || null,
    error,
    metrics,
    usage,
    messageId,
    conversationId,

    // Actions
    analyzeProposal,
    reset,
    cancelAnalysis
  };
}