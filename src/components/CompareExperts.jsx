import { useState } from 'react';
import { apiHelpers } from '../config/api';

export default function CompareExperts({ collections }) {
  const [question, setQuestion] = useState('');
  const [selectedExperts, setSelectedExperts] = useState({});
  const [topK, setTopK] = useState(3);
  const [comparing, setComparing] = useState(false);
  const [response, setResponse] = useState(null);
  const [error, setError] = useState(null);
  const [expandedAnswers, setExpandedAnswers] = useState(new Set());

  const handleExpertChange = (expertName, collectionName) => {
    if (collectionName === '') {
      // Remove expert
      const newExperts = { ...selectedExperts };
      delete newExperts[expertName];
      setSelectedExperts(newExperts);
    } else {
      // Add or update expert
      setSelectedExperts(prev => ({
        ...prev,
        [expertName]: collectionName
      }));
    }
  };

  const addNewExpert = () => {
    const expertNumber = Object.keys(selectedExperts).length + 1;
    const expertName = `Expert ${expertNumber}`;
    setSelectedExperts(prev => ({
      ...prev,
      [expertName]: ''
    }));
  };

  const removeExpert = (expertName) => {
    const newExperts = { ...selectedExperts };
    delete newExperts[expertName];
    setSelectedExperts(newExperts);
  };

  const handleCompareExperts = async (e) => {
    e.preventDefault();

    const validExperts = Object.fromEntries(
      Object.entries(selectedExperts).filter(([, collection]) => collection !== '')
    );

    if (!question.trim() || Object.keys(validExperts).length < 2) {
      setError('Please enter a question and select at least 2 experts (collections)');
      return;
    }

    setComparing(true);
    setError(null);
    setResponse(null);

    try {
      const result = await apiHelpers.compareExperts(question, validExperts, {
        top_k: topK,
      });
      setResponse(result);
      setExpandedAnswers(new Set());
    } catch (err) {
      setError(err.message);
    } finally {
      setComparing(false);
    }
  };

  const toggleAnswerExpansion = (expertName) => {
    const newExpanded = new Set(expandedAnswers);
    if (newExpanded.has(expertName)) {
      newExpanded.delete(expertName);
    } else {
      newExpanded.add(expertName);
    }
    setExpandedAnswers(newExpanded);
  };

  const getExpertColor = (index) => {
    const colors = [
      'border-blue-200 bg-blue-50',
      'border-green-200 bg-green-50',
      'border-purple-200 bg-purple-50',
      'border-orange-200 bg-orange-50',
      'border-pink-200 bg-pink-50',
      'border-indigo-200 bg-indigo-50',
    ];
    return colors[index % colors.length];
  };

  const validExperts = Object.fromEntries(
    Object.entries(selectedExperts).filter(([, collection]) => collection !== '')
  );

  return (
    <div>
      <form onSubmit={handleCompareExperts} className="space-y-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Question for Expert Comparison
          </label>
          <textarea
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Ask a question to compare different expert perspectives..."
            rows="3"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-purple"
            required
          />
        </div>

        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="block text-sm font-medium text-gray-700">
              Select Experts (Collections)
            </label>
            <button
              type="button"
              onClick={addNewExpert}
              className="text-sm text-brand-purple hover:text-brand-purple-hover"
            >
              + Add Expert
            </button>
          </div>
          
          <div className="space-y-3">
            {Object.keys(selectedExperts).length === 0 && (
              <div className="text-center py-6 bg-gray-50 rounded-lg border-2 border-dashed">
                <p className="text-gray-500 mb-2">No experts selected</p>
                <button
                  type="button"
                  onClick={addNewExpert}
                  className="px-4 py-2 bg-brand-purple text-white rounded-lg hover:bg-brand-purple-hover transition-colors"
                >
                  Add First Expert
                </button>
              </div>
            )}
            
            {Object.entries(selectedExperts).map(([expertName, collectionName], index) => {
              const selectedCollection = collections.find(col => col.name === collectionName);
              return (
                <div key={expertName} className={`border-2 rounded-lg p-4 ${getExpertColor(index)}`}>
                  <div className="flex items-start gap-4">
                    {selectedCollection?.image_data?.thumbnail ? (
                      <img
                        src={selectedCollection.image_data.thumbnail}
                        alt={selectedCollection.full_name || selectedCollection.name}
                        className="w-12 h-12 rounded-full object-cover bg-gray-200 flex-shrink-0"
                      />
                    ) : selectedCollection ? (
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-brand-purple to-purple-600 flex items-center justify-center text-white font-semibold flex-shrink-0">
                        {(selectedCollection.friendly_name || selectedCollection.name).charAt(0).toUpperCase()}
                      </div>
                    ) : null}
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Expert Name
                        </label>
                        <input
                          type="text"
                          value={expertName}
                          onChange={(e) => {
                            if (e.target.value !== expertName) {
                              const newExperts = { ...selectedExperts };
                              delete newExperts[expertName];
                              newExperts[e.target.value] = collectionName;
                              setSelectedExperts(newExperts);
                            }
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-purple"
                          placeholder="Expert name..."
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Collection (Knowledge Base)
                        </label>
                        <select
                          value={collectionName}
                          onChange={(e) => handleExpertChange(expertName, e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-purple"
                        >
                          <option value="">Select collection...</option>
                          {collections.map(col => (
                            <option key={col.id} value={col.name}>
                              {col.friendly_name || col.name} {col.full_name && `(${col.full_name})`} - {col.document_count} docs
                            </option>
                          ))}
                        </select>
                        {selectedCollection?.full_name && (
                          <p className="text-xs text-gray-500 mt-1">{selectedCollection.full_name}</p>
                        )}
                      </div>
                      
                      <div className="flex items-end">
                        <button
                          type="button"
                          onClick={() => removeExpert(expertName)}
                          className="w-full px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                        >
                          Remove Expert
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Context Chunks per Expert
          </label>
          <input
            type="number"
            value={topK}
            onChange={(e) => setTopK(parseInt(e.target.value))}
            min="1"
            max="10"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-purple"
          />
          <p className="text-xs text-gray-500 mt-1">Number of relevant chunks to use for each expert</p>
        </div>

        <button
          type="submit"
          disabled={comparing || Object.keys(validExperts).length < 2}
          className="w-full px-4 py-3 bg-brand-purple text-white rounded-lg hover:bg-brand-purple-hover transition-colors disabled:opacity-50 font-medium"
        >
          {comparing ? 'Comparing Experts...' : `Compare ${Object.keys(validExperts).length} Experts`}
        </button>
      </form>

      {error && (
        <div className="bg-red-50 border border-red-300 rounded-lg p-4 mb-6">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {response && (
        <div className="space-y-6">
          {/* Individual Expert Answers */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Individual Expert Perspectives</h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {Object.entries(response.expert_answers || {}).map(([expertName, answer], index) => {
                const collectionName = selectedExperts[expertName];
                const collection = collections.find(col => col.name === collectionName);
                return (
                  <div key={expertName} className={`border-2 rounded-lg p-4 ${getExpertColor(index)}`}>
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center gap-3">
                        {collection?.image_data?.thumbnail ? (
                          <img
                            src={collection.image_data.thumbnail}
                            alt={collection.full_name || collection.name}
                            className="w-8 h-8 rounded-full object-cover bg-gray-200"
                          />
                        ) : collection ? (
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-purple to-purple-600 flex items-center justify-center text-white text-sm font-semibold">
                            {(collection.friendly_name || collection.name).charAt(0).toUpperCase()}
                          </div>
                        ) : null}
                        <div>
                          <h4 className="font-semibold text-gray-800">{expertName}</h4>
                          {collection?.full_name && (
                            <p className="text-xs text-gray-500">{collection.full_name}</p>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => toggleAnswerExpansion(expertName)}
                        className="text-sm text-brand-purple hover:text-brand-purple-hover"
                      >
                        {expandedAnswers.has(expertName) ? 'Collapse' : 'Expand'}
                      </button>
                    </div>
                    
                    <div className={`text-gray-700 text-sm ${
                      expandedAnswers.has(expertName) ? '' : 'line-clamp-4'
                    }`}>
                      {answer}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Comparative Analysis */}
          <div className="bg-white border rounded-lg shadow-sm p-6">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-lg font-semibold">Comparative Analysis</h3>
              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-500">
                  Experts: {response.experts_consulted?.join(', ')}
                </span>
                <span className="text-sm text-gray-500">
                  {response.processing_time_ms?.toFixed(0)}ms
                </span>
              </div>
            </div>

            <div className="prose max-w-none">
              <p className="text-gray-700 whitespace-pre-wrap">{response.comparative_analysis}</p>
            </div>
          </div>

          {/* Summary */}
          <div className="bg-gray-50 rounded-lg p-6">
            <h4 className="font-semibold text-gray-800 mb-3">Comparison Summary</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Question:</span>
                <p className="font-medium mt-1">{response.question}</p>
              </div>
              <div>
                <span className="text-gray-600">Experts Consulted:</span>
                <p className="font-medium mt-1">{response.experts_consulted?.length}</p>
              </div>
              <div>
                <span className="text-gray-600">Processing Time:</span>
                <p className="font-medium mt-1">{(response.processing_time_ms / 1000).toFixed(2)}s</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}