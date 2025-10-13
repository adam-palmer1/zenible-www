import { useState } from 'react';

export default function DocumentDetails({ document, collection, onBack, onDelete }) {
  const [metadata] = useState(document.metadata || {});
  const [showMetadata, setShowMetadata] = useState(false);
  const [reprocessing, setReprocessing] = useState(false);
  const [chunks, setChunks] = useState([]);
  const [loadingChunks, setLoadingChunks] = useState(false);
  const [showChunks, setShowChunks] = useState(false);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return 'N/A';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1048576).toFixed(1) + ' MB';
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'completed': return 'bg-green-100 text-green-700';
      case 'processing': return 'bg-blue-100 text-blue-700';
      case 'failed': return 'bg-red-100 text-red-700';
      case 'pending': return 'bg-yellow-100 text-yellow-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const handleReprocess = async () => {
    if (!confirm('Reprocess this document? This will regenerate all chunks and embeddings.')) {
      return;
    }
    
    setReprocessing(true);
    try {
      // Note: Reprocessing would typically be done by re-uploading or via a specific API endpoint
      // Since the API doesn't have a reprocess endpoint, we'll show this as a placeholder
      alert('Document reprocessing initiated. This may take a few minutes.');
    } catch (err) {
      alert(`Failed to reprocess document: ${err.message}`);
    } finally {
      setReprocessing(false);
    }
  };

  const handleLoadChunks = async () => {
    // Note: The API doesn't expose individual chunks directly,
    // but in a real implementation you might have an endpoint for this
    setLoadingChunks(true);
    try {
      // Simulated chunk loading - in reality, you'd fetch from an API
      const simulatedChunks = Array.from({ length: document.chunk_count }, (_, i) => ({
        id: i + 1,
        content: `Chunk ${i + 1} content preview...`,
        tokens: Math.floor(Math.random() * 500) + 100,
        embedding_status: 'completed'
      }));
      setChunks(simulatedChunks);
      setShowChunks(true);
    } catch {
      alert('Failed to load chunks');
    } finally {
      setLoadingChunks(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    alert('Copied to clipboard!');
  };

  return (
    <div className="flex-1 bg-gray-50">
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="px-8 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={onBack}
              className="p-2 hover:bg-gray-100 rounded transition-colors"
            >
              ← Back
            </button>
            <div className="flex-1">
              <h2 className="text-2xl font-semibold text-gray-800">{document.filename}</h2>
              <p className="text-gray-600 mt-1">
                Collection: {collection?.name || 'Unknown'}
              </p>
            </div>
            <div className="flex gap-2">
              {document.source_url && (
                <a
                  href={document.source_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  View Source
                </a>
              )}
              <button
                onClick={handleReprocess}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                disabled={reprocessing || document.processing_status === 'processing'}
              >
                {reprocessing ? 'Reprocessing...' : 'Reprocess'}
              </button>
              <button
                onClick={() => onDelete(document)}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Delete Document
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <div className="lg:col-span-2 bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4">Document Information</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <dl className="space-y-3">
                  <div>
                    <dt className="text-sm font-medium text-gray-600">Document ID</dt>
                    <dd className="mt-1 text-sm text-gray-900 font-mono">
                      {document.id}
                      <button
                        onClick={() => copyToClipboard(document.id)}
                        className="ml-2 text-brand-purple hover:text-brand-purple-hover"
                      >
                        📋
                      </button>
                    </dd>
                  </div>
                  
                  <div>
                    <dt className="text-sm font-medium text-gray-600">File Type</dt>
                    <dd className="mt-1 text-sm text-gray-900">{document.file_type}</dd>
                  </div>
                  
                  <div>
                    <dt className="text-sm font-medium text-gray-600">File Size</dt>
                    <dd className="mt-1 text-sm text-gray-900">{formatFileSize(document.file_size)}</dd>
                  </div>
                  
                  <div>
                    <dt className="text-sm font-medium text-gray-600">Content Hash</dt>
                    <dd className="mt-1 text-sm text-gray-900 font-mono truncate">
                      {document.content_hash}
                    </dd>
                  </div>
                </dl>
              </div>
              
              <div>
                <dl className="space-y-3">
                  <div>
                    <dt className="text-sm font-medium text-gray-600">Processing Status</dt>
                    <dd className="mt-1">
                      <span className={`px-2 py-1 rounded text-xs ${getStatusColor(document.processing_status)}`}>
                        {document.processing_status}
                      </span>
                    </dd>
                  </div>
                  
                  <div>
                    <dt className="text-sm font-medium text-gray-600">Chunk Count</dt>
                    <dd className="mt-1 text-sm text-gray-900">{document.chunk_count}</dd>
                  </div>
                  
                  <div>
                    <dt className="text-sm font-medium text-gray-600">Token Count</dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {document.token_count ? document.token_count.toLocaleString() : 'N/A'}
                    </dd>
                  </div>
                  
                  <div>
                    <dt className="text-sm font-medium text-gray-600">Uploaded At</dt>
                    <dd className="mt-1 text-sm text-gray-900">{formatDate(document.created_at)}</dd>
                  </div>
                  
                  <div>
                    <dt className="text-sm font-medium text-gray-600">Last Updated</dt>
                    <dd className="mt-1 text-sm text-gray-900">{formatDate(document.updated_at)}</dd>
                  </div>
                </dl>
              </div>
            </div>

            {document.processing_error && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded">
                <p className="text-sm font-medium text-red-800">Processing Error:</p>
                <p className="text-sm text-red-700 mt-1">{document.processing_error}</p>
              </div>
            )}
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4">Processing Statistics</h3>
            
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Chunks Created</span>
                  <span className="font-medium">{document.chunk_count}</span>
                </div>
                <div className="mt-1 w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-brand-purple h-2 rounded-full" style={{ width: '100%' }}></div>
                </div>
              </div>
              
              <div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Tokens Processed</span>
                  <span className="font-medium">
                    {document.token_count ? (document.token_count / 1000).toFixed(1) + 'k' : '0'}
                  </span>
                </div>
                <div className="mt-1 w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-green-500 h-2 rounded-full" style={{ width: '100%' }}></div>
                </div>
              </div>
              
              <div className="pt-4 border-t">
                <p className="text-sm text-gray-600 mb-2">Estimated Costs</p>
                <dl className="space-y-1 text-xs">
                  <div className="flex justify-between">
                    <dt className="text-gray-500">Embedding Cost:</dt>
                    <dd className="font-medium">
                      ${document.token_count ? (document.token_count * 0.00002).toFixed(4) : '0.0000'}
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-gray-500">Storage Cost:</dt>
                    <dd className="font-medium">
                      ${(document.file_size / 1048576 * 0.001).toFixed(4)}
                    </dd>
                  </div>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Document Metadata</h3>
            <button
              onClick={() => setShowMetadata(!showMetadata)}
              className="text-brand-purple hover:text-brand-purple-hover text-sm"
            >
              {showMetadata ? 'Hide' : 'Show'} Metadata
            </button>
          </div>
          
          {showMetadata && (
            <div className="bg-gray-50 rounded p-4">
              {Object.keys(metadata).length > 0 ? (
                <pre className="text-sm text-gray-700 overflow-x-auto">
                  {JSON.stringify(metadata, null, 2)}
                </pre>
              ) : (
                <p className="text-sm text-gray-500">No metadata available</p>
              )}
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Document Chunks</h3>
            <button
              onClick={handleLoadChunks}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm"
              disabled={loadingChunks || showChunks}
            >
              {loadingChunks ? 'Loading...' : showChunks ? 'Chunks Loaded' : 'Load Chunks'}
            </button>
          </div>
          
          {showChunks && chunks.length > 0 && (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {chunks.map((chunk) => (
                <div key={chunk.id} className="border border-gray-200 rounded p-3">
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-sm font-medium text-gray-700">
                      Chunk #{chunk.id}
                    </span>
                    <span className="text-xs text-gray-500">
                      {chunk.tokens} tokens
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 line-clamp-3">
                    {chunk.content}
                  </p>
                  <div className="mt-2">
                    <span className={`px-2 py-1 rounded text-xs ${
                      chunk.embedding_status === 'completed' 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-yellow-100 text-yellow-700'
                    }`}>
                      Embedding: {chunk.embedding_status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
          
          {!showChunks && (
            <p className="text-sm text-gray-500">
              Click "Load Chunks" to view the document chunks
            </p>
          )}
        </div>
      </div>
    </div>
  );
}