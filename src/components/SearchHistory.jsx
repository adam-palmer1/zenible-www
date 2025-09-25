import { useState, useEffect } from 'react';
import { apiHelpers } from '../config/api';

export default function SearchHistory({ onRefresh }) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [limit, setLimit] = useState(20);
  const [expandedItems, setExpandedItems] = useState(new Set());
  const [filter, setFilter] = useState('all'); // all, search, question

  useEffect(() => {
    loadHistory();
  }, [limit]);

  const loadHistory = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiHelpers.getSearchHistory(limit);
      setHistory(response);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleItemExpansion = (index) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedItems(newExpanded);
  };

  const getTypeIcon = (type) => {
    switch(type) {
      case 'search': return '🔍';
      case 'question': return '❓';
      case 'multi-question': return '📚';
      case 'compare-experts': return '👥';
      default: return '📝';
    }
  };

  const getTypeColor = (type) => {
    switch(type) {
      case 'search': return 'bg-purple-100 text-purple-700';
      case 'question': return 'bg-green-100 text-green-700';
      case 'multi-question': return 'bg-purple-100 text-purple-700';
      case 'compare-experts': return 'bg-orange-100 text-orange-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  const filteredHistory = history.filter(item => {
    if (filter === 'all') return true;
    if (filter === 'search') return item.type === 'search';
    if (filter === 'question') return ['question', 'multi-question', 'compare-experts'].includes(item.type);
    return true;
  });

  const handleClearHistory = async () => {
    if (!confirm('Clear all search history? This action cannot be undone.')) {
      return;
    }
    
    // Note: The API doesn't have a clear history endpoint in the spec,
    // so this would need to be implemented on the backend
    try {
      // await apiHelpers.clearSearchHistory();
      alert('Clear history functionality would be implemented with a backend endpoint');
    } catch (err) {
      alert('Failed to clear history');
    }
  };

  const handleRepeat = (item) => {
    // This would trigger the appropriate search/question form with the same parameters
    const params = new URLSearchParams();
    params.set('type', item.type);
    params.set('query', item.query || item.question);
    if (item.collection) params.set('collection', item.collection);
    
    // In a real implementation, you'd navigate to the appropriate tab with pre-filled data
    alert(`Would repeat ${item.type}: "${item.query || item.question}"`);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="text-lg font-semibold">Search History</h3>
          <p className="text-sm text-gray-600">Your recent searches and questions</p>
        </div>
        
        <div className="flex gap-2">
          <button
            onClick={loadHistory}
            className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            disabled={loading}
          >
            {loading ? 'Refreshing...' : 'Refresh'}
          </button>
          <button
            onClick={handleClearHistory}
            className="px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Clear History
          </button>
        </div>
      </div>

      <div className="mb-4 flex flex-wrap gap-4 items-center">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Filter by Type
          </label>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-purple"
          >
            <option value="all">All ({history.length})</option>
            <option value="search">Searches ({history.filter(h => h.type === 'search').length})</option>
            <option value="question">Questions ({history.filter(h => ['question', 'multi-question', 'compare-experts'].includes(h.type)).length})</option>
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Show Last
          </label>
          <select
            value={limit}
            onChange={(e) => setLimit(parseInt(e.target.value))}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-purple"
          >
            <option value={10}>10 items</option>
            <option value={20}>20 items</option>
            <option value={50}>50 items</option>
            <option value={100}>100 items</option>
          </select>
        </div>
      </div>

      {loading && (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-purple"></div>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-300 rounded-lg p-4">
          <p className="text-red-800">Error loading search history: {error}</p>
        </div>
      )}

      {!loading && !error && filteredHistory.length === 0 && (
        <div className="bg-gray-50 rounded-lg p-8 text-center">
          <p className="text-gray-500">No search history found</p>
          <p className="text-sm text-gray-400 mt-2">
            Your searches and questions will appear here
          </p>
        </div>
      )}

      {!loading && !error && filteredHistory.length > 0 && (
        <div className="space-y-3">
          {filteredHistory.map((item, index) => (
            <div key={index} className="bg-white border rounded-lg shadow-sm">
              <div className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-3">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getTypeColor(item.type || 'search')}`}>
                      {getTypeIcon(item.type || 'search')} {item.type || 'search'}
                    </span>
                    {item.collection && (
                      <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                        {item.collection}
                      </span>
                    )}
                    {item.confidence && (
                      <span className="text-xs text-gray-500">
                        Confidence: {(item.confidence * 100).toFixed(0)}%
                      </span>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500">
                      {formatDate(item.timestamp || new Date().toISOString())}
                    </span>
                    <button
                      onClick={() => handleRepeat(item)}
                      className="text-xs text-brand-purple hover:text-brand-purple-hover"
                    >
                      Repeat
                    </button>
                    <button
                      onClick={() => toggleItemExpansion(index)}
                      className="text-xs text-gray-600 hover:text-gray-800"
                    >
                      {expandedItems.has(index) ? 'Less' : 'More'}
                    </button>
                  </div>
                </div>

                <div className="mb-2">
                  <p className="font-medium text-gray-900 text-sm">
                    {item.query || item.question || 'No query'}
                  </p>
                </div>

                {expandedItems.has(index) && item.response && (
                  <div className="mt-3 pt-3 border-t bg-gray-50 rounded p-3">
                    <p className="text-xs font-medium text-gray-700 mb-2">Response/Results:</p>
                    <div className="text-xs text-gray-600 line-clamp-4">
                      {typeof item.response === 'string' 
                        ? item.response 
                        : JSON.stringify(item.response, null, 2)
                      }
                    </div>
                  </div>
                )}

                {item.processing_time && (
                  <div className="mt-2 text-xs text-gray-500">
                    Processing time: {item.processing_time}ms
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && filteredHistory.length > 0 && filteredHistory.length === limit && (
        <div className="mt-4 text-center">
          <p className="text-sm text-gray-500">
            Showing {filteredHistory.length} most recent items
          </p>
        </div>
      )}
    </div>
  );
}