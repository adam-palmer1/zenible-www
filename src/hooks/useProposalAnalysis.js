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
  const [streamingContent, setStreamingContent] = useState('');
  const [displayContent, setDisplayContent] = useState(''); // Content to display (excludes [SYSTEM: EOM] and after)
  const [analysis, setAnalysis] = useState(null);
  const [error, setError] = useState(null);
  const [metrics, setMetrics] = useState(null);
  const [usage, setUsage] = useState(null);
  const [messageId, setMessageId] = useState(null); // Track the message ID for rating
  const eomBuffer = useRef(''); // Buffer to detect [SYSTEM: EOM] across chunks

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
    if (!conversationId || !isConnected || !streamingManager) {
      return;
    }

    // Prevent duplicate panel joins
    if (panelJoinedRef.current) {
      return;
    }

    const setupHandlers = async () => {
      try {

        // Join the panel
        await joinPanel(effectivePanelId, conversationId);
        panelJoinedRef.current = true;

        // Setup event handlers
        const handlers = [
          // Analysis started
          streamingManager.onPanelEvent(effectivePanelId, 'proposal_analysis_started', (data) => {
            setIsAnalyzing(true);
            setError(null);
            currentAnalysisRef.current = data.analysisId;
            eomBuffer.current = ''; // Reset EOM buffer

            if (callbacksRef.current.onAnalysisStarted) {
              callbacksRef.current.onAnalysisStarted(data);
            }
          }),

          // Streaming started
          streamingManager.onPanelEvent(effectivePanelId, 'proposal_analysis_streaming_started', (data) => {
            setIsStreaming(true);
            setStreamingContent('');
            setDisplayContent('');
            streamingContentRef.current = '';
            eomBuffer.current = ''; // Reset EOM buffer

            if (callbacksRef.current.onStreamingStarted) {
              callbacksRef.current.onStreamingStarted(data);
            }
          }),

          // Streaming chunk received
          streamingManager.onPanelEvent(effectivePanelId, 'proposal_analysis_chunk', (data) => {
            const chunkText = data.chunk || data.text || data.message || data.content || '';

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

              // Check if we've received the EOM marker
              const eomIndex = newContent.indexOf('[SYSTEM: EOM]');
              if (eomIndex !== -1) {
                // Display only content before EOM
                setDisplayContent(newContent.substring(0, eomIndex).trim());
              } else {
                // No EOM yet, display all content
                setDisplayContent(newContent);
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
            setIsStreaming(false);

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
              }

              // Make sure display content is set to the part before EOM
              setDisplayContent(displayPart);

              // Try to find JSON block in the part after EOM (or in full content if no EOM)
              const jsonMatch = (jsonPart || fullContent).match(/\{[\s\S]*"score"[\s\S]*\}/);
              if (jsonMatch) {
                try {
                  const parsedData = JSON.parse(jsonMatch[0]);

                  // Map the JSON keys to our expected format
                  // Backend sends: strengths, weaknesses, improvements
                  // We map to: strengths, improvements (from weaknesses), suggestions (from improvements)
                  structuredData = {
                    score: parsedData.score || null,
                    strengths: Array.isArray(parsedData.strengths) ? parsedData.strengths : [],
                    improvements: Array.isArray(parsedData.weaknesses) ? parsedData.weaknesses : [],
                    suggestions: Array.isArray(parsedData.improvements) ? parsedData.improvements : [],
                    red_flags: parsedData.red_flags || parsedData.redFlags || [],
                    missing_elements: parsedData.missing_elements || parsedData.missingElements || [],
                    key_requirements: parsedData.key_requirements || parsedData.keyRequirements || [],
                    pricing_strategy: parsedData.pricing_strategy || parsedData.pricingStrategy || null
                  };
                } catch (error) {
                  // JSON parsing failed, silently continue
                }
              }
            }

            // Use structured data from event if available, otherwise use extracted
            const finalStructured = data.analysis?.structured || structuredData || null;

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
            setError(data.error || 'Analysis failed');
            currentAnalysisRef.current = null;

            if (callbacksRef.current.onError) {
              callbacksRef.current.onError(data);
            }
          })
        ];

        unsubscribersRef.current = handlers;
      } catch (error) {
        setError('Failed to initialize analysis');
      }
    };

    setupHandlers();

    // Cleanup
    return () => {
      unsubscribersRef.current.forEach(unsub => {
        if (typeof unsub === 'function') unsub();
      });
      unsubscribersRef.current = [];
      if (panelJoinedRef.current) {
        leavePanel(effectivePanelId);
        panelJoinedRef.current = false;
      }
    };
  }, [conversationId, effectivePanelId, isConnected, streamingManager, joinPanel, leavePanel]);

  const analyzeProposal = useCallback((jobPost, proposal, platform, metadata = {}) => {
    if (!streamingManager) {
      setError('WebSocket not initialized');
      return null;
    }

    if (!isConnected) {
      setError('Not connected to server');
      return null;
    }

    if (isAnalyzing) {
      return null;
    }

    // Reset state
    setError(null);
    setAnalysis(null);
    setMetrics(null);
    setUsage(null);
    setMessageId(null);
    setIsStreaming(false);
    setStreamingContent('');
    setDisplayContent('');
    streamingContentRef.current = '';
    eomBuffer.current = '';

    // Send the analysis request
    try {
      const trackingId = streamingManager.sendMessageToPanel(
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

      if (!trackingId) {
        setError('Failed to start analysis');
        return null;
      }

      return trackingId;
    } catch (error) {
      setError(error.message || 'Failed to send analysis');
      return null;
    }
  }, [streamingManager, isConnected, isAnalyzing, effectivePanelId, characterId]);

  const reset = useCallback(() => {
    setIsAnalyzing(false);
    setIsStreaming(false);
    setStreamingContent('');
    setDisplayContent('');
    streamingContentRef.current = '';
    setAnalysis(null);
    setError(null);
    setMetrics(null);
    setUsage(null);
    setMessageId(null);
    currentAnalysisRef.current = null;
    eomBuffer.current = '';
  }, []);

  const getStructuredAnalysis = useCallback(() => {
    if (!analysis?.structured) return null;

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
    reset
  };
}