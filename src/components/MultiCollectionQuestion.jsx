import { useState } from 'react';
import { apiHelpers } from '../config/api';

export default function MultiCollectionQuestion({ collections }) {
  const [question, setQuestion] = useState('');
  const [selectedCollections, setSelectedCollections] = useState([]);
  const [topKPerCollection, setTopKPerCollection] = useState(3);
  const [scoreThreshold, setScoreThreshold] = useState(0.7);
  const [asking, setAsking] = useState(false);
  const [response, setResponse] = useState(null);
  const [error, setError] = useState(null);
  const [expandedSources, setExpandedSources] = useState(new Set());

  const handleToggleCollection = (collectionName) => {
    if (selectedCollections.includes(collectionName)) {
      setSelectedCollections(prev => prev.filter(c => c !== collectionName));
    } else {
      setSelectedCollections(prev => [...prev, collectionName]);
    }
  };

  const handleSelectAll = () => {
    if (selectedCollections.length === collections.length) {
      setSelectedCollections([]);
    } else {
      setSelectedCollections(collections.map(c => c.name));
    }
  };

  const handleAskQuestion = async (e) => {
    e.preventDefault();
    
    if (!question.trim() || selectedCollections.length === 0) {
      setError('Please enter a question and select at least one collection');
      return;
    }

    setAsking(true);
    setError(null);
    setResponse(null);

    try {
      const result = await apiHelpers.askMultipleCollections(
        question,
        selectedCollections,
        {
          top_k_per_collection: topKPerCollection,
          score_threshold: scoreThreshold,
        }
      );
      setResponse(result);
      setExpandedSources(new Set());
    } catch (err) {
      setError(err.message);
    } finally {
      setAsking(false);
    }
  };

  const toggleSourceExpansion = (collection) => {
    const newExpanded = new Set(expandedSources);
    if (newExpanded.has(collection)) {
      newExpanded.delete(collection);
    } else {
      newExpanded.add(collection);
    }
    setExpandedSources(newExpanded);
  };

  const getConfidenceColor = (confidence) => {
    if (confidence >= 0.9) return 'text-green-600 bg-green-50';
    if (confidence >= 0.7) return 'text-blue-600 bg-blue-50';
    if (confidence >= 0.5) return 'text-yellow-600 bg-yellow-50';
    return 'text-orange-600 bg-orange-50';
  };

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
            placeholder="Ask a question that will be answered using multiple collections..."
            rows="3"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="block text-sm font-medium text-gray-700">
              Select Collections ({selectedCollections.length} selected)
            </label>
            <button
              type="button"
              onClick={handleSelectAll}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              {selectedCollections.length === collections.length ? 'Deselect All' : 'Select All'}
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 max-h-48 overflow-y-auto border rounded-lg p-3">
            {collections.map(col => (
              <label
                key={col.id}
                className="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 p-2 rounded"
              >
                <input
                  type="checkbox"
                  checked={selectedCollections.includes(col.name)}
                  onChange={() => handleToggleCollection(col.name)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <span className="text-sm">
                  {col.name} <span className="text-gray-500">({col.document_count})</span>
                </span>
              </label>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Results per Collection
            </label>
            <input
              type="number"
              value={topKPerCollection}
              onChange={(e) => setTopKPerCollection(parseInt(e.target.value))}
              min="1"
              max="10"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-gray-500 mt-1">Number of chunks from each collection</p>
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
            />
            <p className="text-xs text-gray-500 mt-1">Minimum similarity score</p>
          </div>
        </div>

        <button
          type="submit"
          disabled={asking || selectedCollections.length === 0}
          className="w-full px-4 py-3 bg-brand-purple hover:bg-brand-purple-hover text-white rounded-lg transition-colors disabled:opacity-50 font-medium"
        >
          {asking ? 'Generating Answer...' : 'Ask Across Collections'}
        </button>
      </form>

      {error && (
        <div className="bg-red-50 border border-red-300 rounded-lg p-4 mb-6">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {response && (
        <div className="space-y-4">
          <div className="bg-white border rounded-lg shadow-sm p-6">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-lg font-semibold">Synthesized Answer</h3>
              <div className="flex items-center gap-3">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getConfidenceColor(response.confidence)}`}>
                  Confidence: {(response.confidence * 100).toFixed(0)}%
                </span>
                <span className="text-sm text-gray-500">
                  {response.processing_time_ms?.toFixed(0)}ms
                </span>
              </div>
            </div>

            <div className="prose max-w-none">
              <p className="text-gray-700 whitespace-pre-wrap">{response.answer}</p>
            </div>

            <div className="mt-6 pt-6 border-t">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-semibold text-gray-700">Collections Searched</h4>
                <span className="text-sm text-gray-500">
                  {response.result_count} total results from {response.collections_searched?.length} collections
                </span>
              </div>
              
              <div className="flex flex-wrap gap-2 mb-4">
                {response.collections_searched?.map(col => (
                  <span key={col} className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-sm">
                    {col}
                  </span>
                ))}
              </div>
            </div>

            {response.sources_by_collection && Object.keys(response.sources_by_collection).length > 0 && (
              <div className="mt-6 pt-6 border-t">
                <h4 className="text-sm font-semibold text-gray-700 mb-3">Sources by Collection</h4>
                <div className="space-y-3">
                  {Object.entries(response.sources_by_collection).map(([collection, sources]) => (
                    <div key={collection} className="border rounded-lg">
                      <button
                        onClick={() => toggleSourceExpansion(collection)}
                        className="w-full px-4 py-2 bg-gray-50 hover:bg-gray-100 transition-colors flex justify-between items-center"
                      >
                        <span className="font-medium text-sm">{collection}</span>
                        <span className="text-sm text-gray-500">
                          {sources.length} source{sources.length !== 1 ? 's' : ''}
                          {expandedSources.has(collection) ? ' ▼' : ' ▶'}
                        </span>
                      </button>
                      
                      {expandedSources.has(collection) && (
                        <div className="p-3 space-y-2">
                          {sources.map((source, index) => (
                            <div key={index} className="flex items-start gap-2 text-sm">
                              <span className="text-blue-600 font-medium">[{index + 1}]</span>
                              <div>
                                <span className="text-gray-700">{source.source}</span>
                                <span className="text-gray-500 ml-2">
                                  (Chunk #{source.chunk_id}, Score: {(source.score * 100).toFixed(0)}%)
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}