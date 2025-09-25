import { useState, useRef } from 'react';

export default function DocumentUploadModal({ collections, onClose, onUpload }) {
  const [selectedCollection, setSelectedCollection] = useState('');
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({});
  const [errors, setErrors] = useState({});
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    addFiles(files);
  };

  const addFiles = (files) => {
    const validFiles = files.filter(file => {
      const validTypes = ['.pdf', '.txt', '.md', '.docx', '.doc', '.json', '.csv'];
      const fileExt = '.' + file.name.split('.').pop().toLowerCase();
      return validTypes.includes(fileExt);
    });

    if (validFiles.length !== files.length) {
      alert('Some files were skipped. Only PDF, TXT, MD, DOCX, DOC, JSON, and CSV files are supported.');
    }

    setSelectedFiles(prev => [...prev, ...validFiles]);
  };

  const removeFile = (index) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = Array.from(e.dataTransfer.files);
    addFiles(files);
  };

  const handleUpload = async () => {
    if (!selectedCollection || selectedFiles.length === 0) {
      alert('Please select a collection and at least one file');
      return;
    }

    setUploading(true);
    setErrors({});
    const progress = {};
    const uploadErrors = {};

    for (let i = 0; i < selectedFiles.length; i++) {
      const file = selectedFiles[i];
      progress[i] = { status: 'uploading', percent: 0 };
      setUploadProgress({...progress});

      try {
        // Simulate progress updates
        const progressInterval = setInterval(() => {
          progress[i].percent = Math.min(progress[i].percent + 20, 90);
          setUploadProgress({...progress});
        }, 200);

        await onUpload(selectedCollection, [file]);
        
        clearInterval(progressInterval);
        progress[i] = { status: 'completed', percent: 100 };
        setUploadProgress({...progress});
      } catch (err) {
        progress[i] = { status: 'failed', percent: 0 };
        uploadErrors[i] = err.message;
        setUploadProgress({...progress});
        setErrors(uploadErrors);
      }
    }

    setUploading(false);
    
    // Check if all uploads succeeded
    const allSucceeded = Object.values(progress).every(p => p.status === 'completed');
    if (allSucceeded) {
      setTimeout(() => {
        onClose();
      }, 1000);
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1048576).toFixed(1) + ' MB';
  };

  const getProgressColor = (status) => {
    switch(status) {
      case 'completed': return 'bg-green-500';
      case 'failed': return 'bg-red-500';
      default: return 'bg-brand-purple';
    }
  };

  const totalSize = selectedFiles.reduce((sum, file) => sum + file.size, 0);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b">
          <h2 className="text-2xl font-semibold">Upload Documents</h2>
        </div>

        <div className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Collection *
            </label>
            <select
              value={selectedCollection}
              onChange={(e) => setSelectedCollection(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-purple"
              disabled={uploading}
            >
              <option value="">Choose a collection...</option>
              {collections.map(col => (
                <option key={col.id} value={col.name}>{col.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Files
            </label>
            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center ${
                dragActive ? 'border-brand-purple bg-purple-50' : 'border-gray-300'
              }`}
              onDragEnter={handleDragEnter}
              onDragLeave={handleDragLeave}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
            >
              <input
                ref={fileInputRef}
                type="file"
                multiple
                onChange={handleFileSelect}
                className="hidden"
                accept=".pdf,.txt,.md,.docx,.doc,.json,.csv"
                disabled={uploading}
              />
              
              <div className="space-y-3">
                <div className="text-4xl">📁</div>
                <p className="text-gray-600">
                  Drag and drop files here, or{' '}
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="text-brand-purple hover:text-brand-purple-hover font-medium"
                    disabled={uploading}
                  >
                    browse
                  </button>
                </p>
                <p className="text-sm text-gray-500">
                  Supported formats: PDF, TXT, MD, DOCX, DOC, JSON, CSV
                </p>
              </div>
            </div>
          </div>

          {selectedFiles.length > 0 && (
            <div>
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-sm font-medium text-gray-700">
                  Selected Files ({selectedFiles.length})
                </h3>
                <p className="text-sm text-gray-500">
                  Total size: {formatFileSize(totalSize)}
                </p>
              </div>
              
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {selectedFiles.map((file, index) => (
                  <div key={index} className="bg-gray-50 rounded p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {file.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {formatFileSize(file.size)} • {file.type || 'Unknown type'}
                        </p>
                      </div>
                      
                      {!uploading && (
                        <button
                          onClick={() => removeFile(index)}
                          className="ml-3 text-red-600 hover:text-red-800"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                    
                    {uploadProgress[index] && (
                      <div className="mt-2">
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full transition-all ${getProgressColor(uploadProgress[index].status)}`}
                            style={{ width: `${uploadProgress[index].percent}%` }}
                          ></div>
                        </div>
                        {uploadProgress[index].status === 'completed' && (
                          <p className="text-xs text-green-600 mt-1">✓ Uploaded successfully</p>
                        )}
                        {uploadProgress[index].status === 'failed' && (
                          <p className="text-xs text-red-600 mt-1">✗ {errors[index] || 'Upload failed'}</p>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4 border-t">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              disabled={uploading}
            >
              Cancel
            </button>
            <button
              onClick={handleUpload}
              className="px-4 py-2 bg-brand-purple text-white rounded-lg hover:bg-brand-purple-hover transition-colors disabled:opacity-50"
              disabled={uploading || !selectedCollection || selectedFiles.length === 0}
            >
              {uploading ? 'Uploading...' : `Upload ${selectedFiles.length} File${selectedFiles.length !== 1 ? 's' : ''}`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}