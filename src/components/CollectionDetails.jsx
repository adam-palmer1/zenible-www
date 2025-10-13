import { useState, useEffect } from 'react';
import { apiHelpers } from '../config/api';

export default function CollectionDetails({ collection, onBack, onUpdate, onDelete }) {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [editMode, setEditMode] = useState(false);
  const [editForm, setEditForm] = useState({
    full_name: collection.full_name || '',
    friendly_name: collection.friendly_name || '',
    image_url: collection.image_url || '',
    description: collection.description || '',
    is_public: collection.is_public,
    max_chunk_size: collection.max_chunk_size || 1000,
    chunk_overlap: collection.chunk_overlap || 200,
  });

  useEffect(() => {
    loadDocuments();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, collection.name]);

  const loadDocuments = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiHelpers.getDocuments(collection.name, {
        page,
        limit: 20,
      });
      setDocuments(response.items);
      setTotalPages(response.pages);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    setError(null);

    try {
      await apiHelpers.uploadDocument(collection.name, file);
      loadDocuments();
      e.target.value = '';
    } catch (err) {
      setError(`Upload failed: ${err.message}`);
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteDocument = async (documentId, filename) => {
    if (!confirm(`Delete document "${filename}"?`)) return;

    try {
      await apiHelpers.deleteDocument(collection.name, documentId);
      loadDocuments();
    } catch (err) {
      alert(`Failed to delete document: ${err.message}`);
    }
  };

  const handleUpdateCollection = async () => {
    try {
      await onUpdate(collection.name, editForm);
      setEditMode(false);
    } catch (err) {
      setError(`Update failed: ${err.message}`);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1048576).toFixed(1) + ' MB';
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
            <div className="flex-1 flex items-center gap-4">
              <img
                src={collection.image_url || '/api/placeholder/64/64'}
                alt={collection.full_name || collection.name}
                className="w-16 h-16 rounded-full object-cover bg-gray-200"
                onError={(e) => {
                  e.target.src = '/api/placeholder/64/64';
                }}
              />
              <div>
                <h2 className="text-2xl font-semibold text-gray-800">
                  {collection.friendly_name || collection.name}
                </h2>
                {collection.full_name && (
                  <p className="text-sm text-gray-500">{collection.full_name}</p>
                )}
                <p className="text-gray-600 mt-1">{collection.description || 'No description'}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setEditMode(!editMode)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                {editMode ? 'Cancel Edit' : 'Edit'}
              </button>
              <button
                onClick={() => onDelete(collection.name)}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Delete Collection
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="px-8 py-6">
        {editMode && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h3 className="text-lg font-semibold mb-4">Edit Collection</h3>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={editForm.full_name}
                    onChange={(e) => setEditForm({...editForm, full_name: e.target.value})}
                    maxLength={200}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-purple"
                    placeholder="e.g., Russell Brunson"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Friendly Name
                  </label>
                  <input
                    type="text"
                    value={editForm.friendly_name}
                    onChange={(e) => setEditForm({...editForm, friendly_name: e.target.value})}
                    maxLength={100}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-purple"
                    placeholder="e.g., Russell"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Avatar/Image URL
                </label>
                <input
                  type="url"
                  value={editForm.image_url}
                  onChange={(e) => setEditForm({...editForm, image_url: e.target.value})}
                  maxLength={500}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-purple"
                  placeholder="https://example.com/avatar.jpg"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={editForm.description}
                  onChange={(e) => setEditForm({...editForm, description: e.target.value})}
                  rows="3"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-purple"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Max Chunk Size
                  </label>
                  <input
                    type="number"
                    value={editForm.max_chunk_size}
                    onChange={(e) => setEditForm({...editForm, max_chunk_size: parseInt(e.target.value)})}
                    min="100"
                    max="10000"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-purple"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Chunk Overlap
                  </label>
                  <input
                    type="number"
                    value={editForm.chunk_overlap}
                    onChange={(e) => setEditForm({...editForm, chunk_overlap: parseInt(e.target.value)})}
                    min="0"
                    max="500"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-purple"
                  />
                </div>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="is_public"
                  checked={editForm.is_public}
                  onChange={(e) => setEditForm({...editForm, is_public: e.target.checked})}
                  className="h-4 w-4 text-brand-purple focus:ring-brand-purple border-gray-300 rounded"
                />
                <label htmlFor="is_public" className="ml-2 text-sm text-gray-700">
                  Make this collection publicly accessible
                </label>
              </div>

              <div className="flex justify-end">
                <button
                  onClick={handleUpdateCollection}
                  className="px-4 py-2 bg-brand-purple text-white rounded-lg hover:bg-brand-purple-hover transition-colors"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4">Collection Info</h3>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-gray-600">Vector Dimension:</dt>
                <dd className="font-medium">{collection.vector_dimension}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-600">Distance Metric:</dt>
                <dd className="font-medium">{collection.distance_metric}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-600">Embedding Model:</dt>
                <dd className="font-medium">{collection.embedding_model}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-600">Public Access:</dt>
                <dd className="font-medium">{collection.is_public ? 'Yes' : 'No'}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-600">Created:</dt>
                <dd className="font-medium">{formatDate(collection.created_at)}</dd>
              </div>
            </dl>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4">Statistics</h3>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-gray-600">Documents:</dt>
                <dd className="font-medium">{collection.document_count}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-600">Total Chunks:</dt>
                <dd className="font-medium">{collection.total_chunks.toLocaleString()}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-600">Total Tokens:</dt>
                <dd className="font-medium">{collection.total_tokens.toLocaleString()}</dd>
              </div>
              {collection.vector_status && (
                <>
                  <div className="flex justify-between">
                    <dt className="text-gray-600">Indexed Vectors:</dt>
                    <dd className="font-medium">{collection.vector_status.indexed_vectors_count || 0}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-gray-600">Vector Status:</dt>
                    <dd className="font-medium">
                      <span className={`px-2 py-1 rounded text-xs ${
                        collection.vector_status.status === 'green' ? 'bg-green-100 text-green-700' :
                        collection.vector_status.status === 'yellow' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {collection.vector_status.status}
                      </span>
                    </dd>
                  </div>
                </>
              )}
            </dl>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4">Upload Document</h3>
            <input
              type="file"
              onChange={handleFileUpload}
              disabled={uploading}
              className="block w-full text-sm text-gray-500
                file:mr-4 file:py-2 file:px-4
                file:rounded-full file:border-0
                file:text-sm file:font-semibold
                file:bg-purple-50 file:text-purple-700
                hover:file:bg-purple-100
                disabled:opacity-50"
              accept=".pdf,.txt,.md,.docx,.doc"
            />
            {uploading && (
              <p className="mt-2 text-sm text-gray-600">Uploading and processing...</p>
            )}
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-300 rounded-lg p-4 mb-6">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b">
            <h3 className="text-lg font-semibold">Documents</h3>
          </div>
          
          {loading && (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-purple"></div>
            </div>
          )}

          {!loading && documents.length === 0 && (
            <div className="p-12 text-center text-gray-500">
              No documents in this collection yet
            </div>
          )}

          {!loading && documents.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Filename</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Size</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Chunks</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Uploaded</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {documents.map((doc) => (
                    <tr key={doc.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">{doc.filename}</td>
                      <td className="px-6 py-4 text-sm text-gray-500">{doc.file_type}</td>
                      <td className="px-6 py-4 text-sm text-gray-500">{formatFileSize(doc.file_size)}</td>
                      <td className="px-6 py-4 text-sm text-gray-500">{doc.chunk_count}</td>
                      <td className="px-6 py-4 text-sm">
                        <span className={`px-2 py-1 rounded text-xs ${
                          doc.processing_status === 'completed' ? 'bg-green-100 text-green-700' :
                          doc.processing_status === 'processing' ? 'bg-blue-100 text-blue-700' :
                          doc.processing_status === 'failed' ? 'bg-red-100 text-red-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {doc.processing_status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">{formatDate(doc.created_at)}</td>
                      <td className="px-6 py-4 text-sm">
                        <button
                          onClick={() => handleDeleteDocument(doc.id, doc.filename)}
                          className="text-red-600 hover:text-red-800"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {totalPages > 1 && (
            <div className="flex justify-center gap-2 p-4 border-t">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1 border border-gray-300 rounded disabled:opacity-50"
              >
                Previous
              </button>
              <span className="px-3 py-1">
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-3 py-1 border border-gray-300 rounded disabled:opacity-50"
              >
                Next
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}