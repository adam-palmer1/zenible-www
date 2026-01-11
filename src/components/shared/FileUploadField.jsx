import React, { useState, useRef } from 'react';
import uploadAPI from '../../services/uploadAPI';

/**
 * FileUploadField Component
 *
 * Handles file uploads with:
 * - Drag and drop support
 * - Progress tracking
 * - File validation
 * - Error handling
 * - Cancel upload functionality
 * - Display existing uploaded files
 *
 * @param {Object} props
 * @param {number} props.courseId - Course ID
 * @param {number} props.moduleId - Module ID
 * @param {number} props.resourceId - Resource ID
 * @param {string} props.resourceType - Resource type (video, pdf, etc)
 * @param {string} props.currentFileUrl - Current file URL (if exists)
 * @param {Function} props.onUploadComplete - Callback when upload completes
 * @param {Function} props.onUploadError - Callback when upload fails
 * @param {Array<string>} props.acceptedTypes - Accepted MIME types
 * @param {number} props.maxSize - Max file size in bytes (default: 5GB)
 * @param {boolean} props.darkMode - Dark mode flag
 */
const FileUploadField = ({
  courseId,
  moduleId,
  resourceId,
  resourceType,
  currentFileUrl = null,
  onUploadComplete,
  onUploadError,
  acceptedTypes = [],
  maxSize = 5 * 1024 * 1024 * 1024, // 5GB default
  darkMode = false
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedFile, setSelectedFile] = useState(null);
  const [error, setError] = useState(null);
  const [uploadResult, setUploadResult] = useState(null);
  const [isReplacing, setIsReplacing] = useState(false);

  const fileInputRef = useRef(null);
  const abortFunctionRef = useRef(null);

  // Validate file
  const validateFile = (file) => {
    // Check file size
    if (file.size > maxSize) {
      throw new Error(`File size exceeds maximum allowed size of ${uploadAPI.formatFileSize(maxSize)}`);
    }

    // Check file type if acceptedTypes is specified
    if (acceptedTypes.length > 0 && !acceptedTypes.includes(file.type)) {
      throw new Error(`File type ${file.type} is not accepted. Accepted types: ${acceptedTypes.join(', ')}`);
    }

    return true;
  };

  // Handle file selection
  const handleFileSelect = async (file) => {
    if (!file) return;

    try {
      setError(null);
      setIsReplacing(false); // Exit replace mode once file is selected
      validateFile(file);
      setSelectedFile(file);

      // Auto-start upload
      await startUpload(file);
    } catch (err) {
      setError(err.message);
      if (onUploadError) onUploadError(err);
    }
  };

  // Start upload
  const startUpload = async (file) => {
    setIsUploading(true);
    setUploadProgress(0);
    setError(null);

    try {
      const result = await uploadAPI.uploadFile(
        courseId,
        moduleId,
        resourceId,
        file,
        resourceType,
        (progress) => setUploadProgress(progress),
        (error) => {
          setError(error.message);
          if (onUploadError) onUploadError(error);
        }
      );

      // Store abort function if available
      if (result.abort) {
        abortFunctionRef.current = result.abort;
      }

      setUploadResult(result);
      setIsUploading(false);

      if (onUploadComplete) {
        onUploadComplete(result);
      }
    } catch (err) {
      setIsUploading(false);
      setError(err.message);
      if (onUploadError) onUploadError(err);
    }
  };

  // Cancel upload
  const cancelUpload = () => {
    if (abortFunctionRef.current) {
      abortFunctionRef.current();
    }
    setIsUploading(false);
    setUploadProgress(0);
    setSelectedFile(null);
    setIsReplacing(false); // Exit replace mode on cancel
    setError('Upload cancelled');
  };

  // Handle drag events
  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  // Handle file input change
  const handleFileInputChange = (e) => {
    const files = e.target.files;
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  // Open file picker
  const openFilePicker = () => {
    fileInputRef.current?.click();
  };

  // Reset upload (called by Replace button)
  const resetUpload = () => {
    setSelectedFile(null);
    setUploadResult(null);
    setUploadProgress(0);
    setError(null);
    setIsUploading(false);
    setIsReplacing(true); // Enter replace mode
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-3">
      {/* Current File Display */}
      {currentFileUrl && !selectedFile && !uploadResult && !isReplacing && (
        <div className={`p-3 rounded-lg border ${darkMode ? 'bg-zenible-dark-bg border-zenible-dark-border' : 'bg-gray-50 border-gray-200'}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <svg className={`w-5 h-5 ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'}`} fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8 4a3 3 0 00-3 3v4a5 5 0 0010 0V7a1 1 0 112 0v4a7 7 0 11-14 0V7a5 5 0 0110 0v4a3 3 0 11-6 0V7a1 1 0 012 0v4a1 1 0 102 0V7a3 3 0 00-3-3z" clipRule="evenodd" />
              </svg>
              <span className={`text-sm ${darkMode ? 'text-zenible-dark-text' : 'text-gray-700'}`}>
                Current file uploaded
              </span>
            </div>
            <button
              onClick={resetUpload}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              Replace
            </button>
          </div>
        </div>
      )}

      {/* Upload Area */}
      {(!currentFileUrl || selectedFile || uploadResult || isReplacing) ? (
        <div
          onDragEnter={handleDragEnter}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`relative border-2 border-dashed rounded-lg transition-colors ${
            isDragging
              ? 'border-zenible-primary bg-zenible-primary bg-opacity-5'
              : darkMode
                ? 'border-zenible-dark-border hover:border-zenible-primary'
                : 'border-gray-300 hover:border-zenible-primary'
          } ${isUploading ? 'pointer-events-none' : ''}`}
        >
          <input
            ref={fileInputRef}
            type="file"
            onChange={handleFileInputChange}
            accept={acceptedTypes.join(',')}
            className="hidden"
          />

          {/* Upload UI */}
          {!isUploading && !uploadResult && (
            <div className="p-8 text-center">
              <svg
                className={`mx-auto h-12 w-12 ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-400'}`}
                stroke="currentColor"
                fill="none"
                viewBox="0 0 48 48"
              >
                <path
                  d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <div className="mt-4">
                <button
                  type="button"
                  onClick={openFilePicker}
                  className="px-4 py-2 bg-zenible-primary text-white rounded-lg hover:bg-opacity-90 transition-colors"
                >
                  Choose File
                </button>
                <p className={`mt-2 text-sm ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'}`}>
                  or drag and drop
                </p>
              </div>
              {acceptedTypes.length > 0 && (
                <p className={`mt-2 text-xs ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'}`}>
                  Accepted: {acceptedTypes.join(', ')}
                </p>
              )}
              <p className={`text-xs ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'}`}>
                Max size: {uploadAPI.formatFileSize(maxSize)}
              </p>
              {/* Cancel Replace button - only show if we have a current file and are replacing */}
              {currentFileUrl && isReplacing && (
                <button
                  type="button"
                  onClick={() => setIsReplacing(false)}
                  className={`mt-4 text-sm ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-600'} hover:underline`}
                >
                  Cancel Replace
                </button>
              )}
            </div>
          )}

          {/* Uploading UI */}
          {isUploading && selectedFile && (
            <div className="p-8">
              <div className="flex items-center gap-3 mb-4">
                <svg className={`w-8 h-8 ${darkMode ? 'text-zenible-dark-text' : 'text-gray-700'}`} fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                </svg>
                <div className="flex-1">
                  <p className={`text-sm font-medium ${darkMode ? 'text-zenible-dark-text' : 'text-gray-900'}`}>
                    {selectedFile.name}
                  </p>
                  <p className={`text-xs ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'}`}>
                    {uploadAPI.formatFileSize(selectedFile.size)}
                  </p>
                </div>
                <button
                  onClick={cancelUpload}
                  className="text-sm text-red-600 hover:text-red-800"
                >
                  Cancel
                </button>
              </div>

              {/* Progress Bar */}
              <div className={`w-full rounded-full h-2 ${darkMode ? 'bg-zenible-dark-border' : 'bg-gray-200'}`}>
                <div
                  className="bg-zenible-primary h-2 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
              <p className={`text-center text-sm mt-2 ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-600'}`}>
                {uploadProgress}% uploaded
              </p>
            </div>
          )}

          {/* Success UI */}
          {uploadResult && !isUploading && (
            <div className="p-8">
              <div className="flex items-center gap-3">
                <svg className="w-8 h-8 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <div className="flex-1">
                  <p className={`text-sm font-medium ${darkMode ? 'text-zenible-dark-text' : 'text-gray-900'}`}>
                    Upload complete
                  </p>
                  {uploadResult.filename && (
                    <p className={`text-xs ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'}`}>
                      {uploadResult.filename}
                    </p>
                  )}
                </div>
                <button
                  onClick={resetUpload}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  Replace
                </button>
              </div>
            </div>
          )}
        </div>
      ) : null}

      {/* Error Display */}
      {error && (
        <div className="p-3 rounded-lg bg-red-50 border border-red-200">
          <div className="flex items-start gap-2">
            <svg className="w-5 h-5 text-red-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <div className="flex-1">
              <p className="text-sm font-medium text-red-800">Upload Error</p>
              <p className="text-xs text-red-700 mt-1">{error}</p>
            </div>
            <button
              onClick={() => setError(null)}
              className="text-red-600 hover:text-red-800"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default FileUploadField;
