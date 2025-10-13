import { useState } from 'react';
import { apiHelpers } from '../config/api';
import { useSSEStreaming } from '../hooks/useSSEStreaming';

export default function AskQuestion({ collections }) {
  const [question, setQuestion] = useState('');
  const [selectedCollection, setSelectedCollection] = useState('');
  const [topK, setTopK] = useState(5);
  const [scoreThreshold, setScoreThreshold] = useState(0.7);
  const [temperature, setTemperature] = useState(0.2);
  const [includeSources, setIncludeSources] = useState(true);
  const [systemPrompt, setSystemPrompt] = useState('');
  const [asking, setAsking] = useState(false);
  const [response, setResponse] = useState(null);
  const [error, setError] = useState(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [useStreaming, setUseStreaming] = useState(true);
  
  // Streaming hook
  const {
    response: streamingResponse,
    sources: streamingSources,
    metrics: streamingMetrics,
    isStreaming,
    error: streamingError,
    streamQuestion,
    stopStreaming,
    reset: resetStreaming
  } = useSSEStreaming();

  const handleAskQuestion = async (e) => {
    e.preventDefault();
    
    if (!question.trim() || !selectedCollection) {
      setError('Please enter a question and select a collection');
      return;
    }

    const params = {
      top_k: topK,
      score_threshold: scoreThreshold,
      temperature,
      include_sources: includeSources,
    };
    
    if (systemPrompt.trim()) {
      params.system_prompt = systemPrompt;
    }

    if (useStreaming) {
      // Use streaming mode
      setError(null);
      setResponse(null);
      resetStreaming();
      
      await streamQuestion(question, selectedCollection, {
        ...params,
        onComplete: (result) => {
          // Format the streaming result to match non-streaming response structure
          setResponse({
            answer: result.response,
            sources: result.sources || streamingSources,
            confidence: result.metrics?.confidence || 0.85,
            processing_time_ms: result.metrics?.processing_time 
              ? result.metrics.processing_time * 1000 
              : null,
            tokens_used: result.metrics?.tokens_used,
            context_used: result.metrics?.context_used,
          });
        },
        onError: (_error) => {
          setError(error.message);
        }
      });
    } else {
      // Use traditional non-streaming mode
      setAsking(true);
      setError(null);
      setResponse(null);
      resetStreaming();

      try {
        const result = await apiHelpers.askQuestion(question, selectedCollection, params);
        setResponse(result);
      } catch (err) {
        setError(err.message);
      } finally {
        setAsking(false);
      }
    }
  };

  const handleStopStreaming = () => {
    stopStreaming();
    setError('Streaming stopped by user');
  };

  const getConfidenceColor = (confidence) => {
    if (confidence >= 0.9) return 'text-green-600 bg-green-50';
    if (confidence >= 0.7) return 'text-blue-600 bg-blue-50';
    if (confidence >= 0.5) return 'text-yellow-600 bg-yellow-50';
    return 'text-orange-600 bg-orange-50';
  };

  // Determine if we're currently processing
  const isProcessing = isStreaming || asking;
  
  // Get the current response to display (streaming or completed)
  const displayResponse = response || (streamingResponse ? {
    answer: streamingResponse,
    sources: streamingSources,
    confidence: streamingMetrics?.confidence,
    processing_time_ms: streamingMetrics?.processing_time 
      ? streamingMetrics.processing_time * 1000 
      : null,
    tokens_used: streamingMetrics?.tokens_used,
    context_used: streamingMetrics?.context_used,
  } : null);
  
  // Show any errors
  const displayError = error || streamingError;

  return (
    <div>
      <form onSubmit={handleAskQuestion} className="space-y-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Your Question
          </label>
          <textarea
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Ask a question about the content in your collection..."
            rows="3"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
            disabled={isProcessing}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Collection
            </label>
            <select
              value={selectedCollection}
              onChange={(e) => setSelectedCollection(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
              disabled={isProcessing}
            >
              <option value="">Select collection...</option>
              {collections.map(col => (
                <option key={col.id} value={col.name}>
                  {col.name} ({col.document_count} docs)
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-end">
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              disabled={isProcessing}
            >
              {showAdvanced ? 'Hide' : 'Show'} Advanced Options
            </button>
          </div>
        </div>

        {showAdvanced && (
          <div className="bg-gray-50 rounded-lg p-4 space-y-4">
            <div className="flex items-center mb-4">
              <input
                type="checkbox"
                id="useStreaming"
                checked={useStreaming}
                onChange={(e) => setUseStreaming(e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                disabled={isProcessing}
              />
              <label htmlFor="useStreaming" className="ml-2 text-sm font-medium text-gray-700">
                Enable streaming responses (see answer as it's generated)
              </label>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Context Chunks (top_k)
                </label>
                <input
                  type="number"
                  value={topK}
                  onChange={(e) => setTopK(parseInt(e.target.value))}
                  min="1"
                  max="20"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={isProcessing}
                />
                <p className="text-xs text-gray-500 mt-1">Number of context chunks to use</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Score Threshold
                </label>
                <input
                  type="number"
                  value={scoreThreshold}
                  onChange={(e) => setScoreThreshold(parseFloat(e.target.value))}
                  min="0"
                  max="1"
                  step="0.1"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={isProcessing}
                />
                <p className="text-xs text-gray-500 mt-1">Minimum similarity score</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Temperature
                </label>
                <input
                  type="number"
                  value={temperature}
                  onChange={(e) => setTemperature(parseFloat(e.target.value))}
                  min="0"
                  max="1"
                  step="0.1"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={isProcessing}
                />
                <p className="text-xs text-gray-500 mt-1">Response creativity (0=factual, 1=creative)</p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Custom System Prompt (Optional)
              </label>
              <textarea
                value={systemPrompt}
                onChange={(e) => setSystemPrompt(e.target.value)}
                placeholder="Provide custom instructions for answer generation..."
                rows="2"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={isProcessing}
              />
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="includeSources"
                checked={includeSources}
                onChange={(e) => setIncludeSources(e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                disabled={isProcessing}
              />
              <label htmlFor="includeSources" className="ml-2 text-sm text-gray-700">
                Include source citations in response
              </label>
            </div>
          </div>
        )}

        <div className="flex gap-2">
          <button
            type="submit"
            disabled={isProcessing}
            className="flex-1 px-4 py-3 bg-brand-purple hover:bg-brand-purple-hover text-white rounded-lg transition-colors disabled:opacity-50 font-medium"
          >
            {isStreaming ? 'Streaming Answer...' : asking ? 'Generating Answer...' : 'Ask Question'}
          </button>
          
          {isStreaming && (
            <button
              type="button"
              onClick={handleStopStreaming}
              className="px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
            >
              Stop Streaming
            </button>
          )}
        </div>
      </form>

      {displayError && (
        <div className="bg-red-50 border border-red-300 rounded-lg p-4 mb-6">
          <p className="text-red-800">{displayError}</p>
        </div>
      )}

      {displayResponse && displayResponse.answer && (
        <div className="space-y-4">
          <div className="bg-white border rounded-lg shadow-sm p-6">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-lg font-semibold">Answer</h3>
              <div className="flex items-center gap-3">
                {displayResponse.confidence && (
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getConfidenceColor(displayResponse.confidence)}`}>
                    Confidence: {(displayResponse.confidence * 100).toFixed(0)}%
                  </span>
                )}
                {displayResponse.processing_time_ms && (
                  <span className="text-sm text-gray-500">
                    {displayResponse.processing_time_ms.toFixed(0)}ms
                  </span>
                )}
                {isStreaming && (
                  <span className="flex items-center text-sm text-blue-600">
                    <span className="animate-pulse mr-2">●</span>
                    Streaming
                  </span>
                )}
              </div>
            </div>

            <div className="prose max-w-none">
              <p className="text-gray-700 whitespace-pre-wrap">
                {displayResponse.answer}
                {isStreaming && <span className="animate-pulse">▊</span>}
              </p>
            </div>

            {displayResponse.sources && displayResponse.sources.length > 0 && !isStreaming && (
              <div className="mt-6 pt-6 border-t">
                <h4 className="text-sm font-semibold text-gray-700 mb-3">Sources</h4>
                <div className="space-y-2">
                  {displayResponse.sources.map((source, index) => (
                    <div key={index} className="flex items-start gap-2 text-sm">
                      <span className="text-blue-600 font-medium">[{index + 1}]</span>
                      <div>
                        <span className="text-gray-700">{source.source || source.document_name || `Document ${source.document_id}`}</span>
                        <span className="text-gray-500 ml-2">
                          (Score: {((source.score || source.similarity_score) * 100).toFixed(0)}%)
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {displayResponse.context_used && displayResponse.context_used.length > 0 && !isStreaming && (
              <details className="mt-6 pt-6 border-t">
                <summary className="text-sm font-semibold text-gray-700 cursor-pointer hover:text-gray-900">
                  View Context Used ({displayResponse.context_used.length} chunks)
                </summary>
                <div className="mt-3 space-y-3">
                  {displayResponse.context_used.map((context, index) => (
                    <div key={index} className="bg-gray-50 rounded p-3">
                      <p className="text-xs text-gray-500 mb-1">Chunk {index + 1}</p>
                      <p className="text-sm text-gray-700 line-clamp-3">{context}</p>
                    </div>
                  ))}
                </div>
              </details>
            )}

            {displayResponse.tokens_used && !isStreaming && (
              <div className="mt-6 pt-6 border-t">
                <h4 className="text-sm font-semibold text-gray-700 mb-2">Token Usage</h4>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Context:</span>
                    <span className="ml-2 font-medium">{displayResponse.tokens_used.context || 0}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Question:</span>
                    <span className="ml-2 font-medium">{displayResponse.tokens_used.question || 0}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Total:</span>
                    <span className="ml-2 font-medium">{displayResponse.tokens_used.total || 0}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}