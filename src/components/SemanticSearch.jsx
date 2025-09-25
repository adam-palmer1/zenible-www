import { useState } from 'react';
import { apiHelpers } from '../config/api';

export default function SemanticSearch({ collections }) {
  const [query, setQuery] = useState('');
  const [selectedCollection, setSelectedCollection] = useState('');
  const [topK, setTopK] = useState(10);
  const [scoreThreshold, setScoreThreshold] = useState(0.0);
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);
  const [expandedResults, setExpandedResults] = useState(new Set());

  const handleSearch = async (e) => {
    e.preventDefault();
    
    if (!query.trim() || !selectedCollection) {
      setError('Please enter a search query and select a collection');
      return;
    }

    setSearching(true);
    setError(null);
    setResults(null);

    try {
      const response = await apiHelpers.search(query, selectedCollection, {
        top_k: topK,
        score_threshold: scoreThreshold,
      });
      setResults(response);
      setExpandedResults(new Set());
    } catch (err) {
      setError(err.message);
    } finally {
      setSearching(false);
    }
  };

  const toggleResultExpansion = (index) => {
    const newExpanded = new Set(expandedResults);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedResults(newExpanded);
  };

  const getScoreColor = (score) => {
    if (score >= 0.9) return 'text-green-600 bg-green-50';
    if (score >= 0.7) return 'text-blue-600 bg-blue-50';
    if (score >= 0.5) return 'text-yellow-600 bg-yellow-50';
    return 'text-gray-600 bg-gray-50';
  };

  return (
    <div>
      <form onSubmit={handleSearch} className="space-y-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Search Query
          </label>
          <textarea
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Enter your search query..."
            rows="3"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-purple"
            required
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Collection
            </label>
            <select
              value={selectedCollection}
              onChange={(e) => setSelectedCollection(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-purple"
              required
            >
              <option value="">Select collection...</option>
              {collections.map(col => (
                <option key={col.id} value={col.name}>
                  {col.name} ({col.document_count} docs)
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Results to Return
            </label>
            <input
              type="number"
              value={topK}
              onChange={(e) => setTopK(parseInt(e.target.value))}
              min="1"
              max="100"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-purple"
            />
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
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-purple"
            />
          </div>

          <div className="flex items-end">
            <button
              type="submit"
              disabled={searching}
              className="w-full px-4 py-2 bg-brand-purple hover:bg-brand-purple-hover text-white rounded-lg transition-colors disabled:opacity-50"
            >
              {searching ? 'Searching...' : 'Search'}
            </button>
          </div>
        </div>
      </form>

      {error && (
        <div className="bg-red-50 border border-red-300 rounded-lg p-4 mb-6">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {results && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">
              Search Results ({results.total_results} matches)
            </h3>
            <p className="text-sm text-gray-500">
              Processing time: {results.processing_time_ms?.toFixed(0)}ms
            </p>
          </div>

          {results.results.length === 0 ? (
            <div className="bg-gray-50 rounded-lg p-8 text-center">
              <p className="text-gray-500">No matching results found</p>
              <p className="text-sm text-gray-400 mt-2">
                Try adjusting your query or lowering the score threshold
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {results.results.map((result, index) => (
                <div key={index} className="bg-white border rounded-lg shadow-sm">
                  <div className="p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${getScoreColor(result.score)}`}>
                            Score: {(result.score * 100).toFixed(1)}%
                          </span>
                          <span className="text-sm text-gray-600">
                            Source: {result.source}
                          </span>
                          <span className="text-sm text-gray-500">
                            Chunk #{result.chunk_id}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => toggleResultExpansion(index)}
                        className="text-blue-600 hover:text-blue-800 text-sm"
                      >
                        {expandedResults.has(index) ? 'Collapse' : 'Expand'}
                      </button>
                    </div>

                    <div className={`text-gray-700 ${expandedResults.has(index) ? '' : 'line-clamp-3'}`}>
                      {result.text}
                    </div>

                    {result.metadata && Object.keys(result.metadata).length > 0 && (
                      <div className="mt-3 pt-3 border-t">
                        <p className="text-xs font-medium text-gray-500 mb-1">Metadata:</p>
                        <div className="flex flex-wrap gap-2">
                          {Object.entries(result.metadata).map(([key, value]) => (
                            <span key={key} className="text-xs bg-gray-100 px-2 py-1 rounded">
                              {key}: {JSON.stringify(value)}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}