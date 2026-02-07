import React, { useState, useCallback, useRef } from 'react';
import { CloudArrowUpIcon, DocumentIcon, PhotoIcon, XMarkIcon, ArrowPathIcon } from '@heroicons/react/24/outline';

/**
 * Allowed file types for receipt uploads
 */
const ALLOWED_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
];

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

/**
 * Format file size for display
 */
const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

/**
 * Convert file to base64
 */
const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
  });
};

interface ReceiptUploadProps {
  expenseId?: string;
  receipt?: any;
  onUpload: (data: { file_name: string; file_size: number; file_type: string; file_data: string }) => Promise<void>;
  onDelete?: () => Promise<void>;
  disabled?: boolean;
  compact?: boolean;
}

const ReceiptUpload: React.FC<ReceiptUploadProps> = ({
  expenseId,
  receipt,
  onUpload,
  onDelete,
  disabled = false,
  compact = false,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  /**
   * Validate file before upload
   */
  const validateFile = useCallback((file: File): string | null => {
    if (!ALLOWED_TYPES.includes(file.type)) {
      return 'File type not allowed. Please upload an image, PDF, or Word document.';
    }
    if (file.size > MAX_FILE_SIZE) {
      return `File too large. Maximum size is ${formatFileSize(MAX_FILE_SIZE)}.`;
    }
    return null;
  }, []);

  /**
   * Handle file selection
   */
  const handleFileSelect = useCallback(async (file: File) => {
    if (!file || disabled) return;

    setError(null);

    // Validate file
    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      return;
    }

    setUploading(true);

    try {
      // Convert to base64
      const base64Data = await fileToBase64(file);

      // Call onUpload with the file data
      await onUpload({
        file_name: file.name,
        file_size: file.size,
        file_type: file.type,
        file_data: base64Data,
      });
    } catch (err: any) {
      console.error('Receipt upload error:', err);
      setError(err.message || 'Failed to upload receipt');
    } finally {
      setUploading(false);
    }
  }, [disabled, validateFile, onUpload]);

  /**
   * Handle drag events
   */
  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (!disabled) setIsDragging(true);
  }, [disabled]);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);

    if (disabled) return;

    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileSelect(file);
    }
  }, [disabled, handleFileSelect]);

  /**
   * Handle file input change
   */
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
    // Reset input so same file can be selected again
    e.target.value = '';
  }, [handleFileSelect]);

  /**
   * Handle delete
   */
  const handleDelete = useCallback(async () => {
    if (!onDelete || disabled || deleting) return;

    setDeleting(true);
    setError(null);

    try {
      await onDelete();
    } catch (err: any) {
      console.error('Receipt delete error:', err);
      setError(err.message || 'Failed to delete receipt');
    } finally {
      setDeleting(false);
    }
  }, [onDelete, disabled, deleting]);

  /**
   * Open file in new tab
   */
  const handleView = useCallback(() => {
    if (receipt?.receipt_url) {
      window.open(receipt.receipt_url, '_blank');
    }
  }, [receipt]);

  /**
   * Get icon for file type
   */
  const getFileIcon = () => {
    if (!receipt?.attachment_type) return DocumentIcon;
    if (receipt.attachment_type.startsWith('image/')) return PhotoIcon;
    return DocumentIcon;
  };

  const FileIcon = getFileIcon();
  const isImage = receipt?.attachment_type?.startsWith('image/');

  // Render existing receipt preview
  if (receipt?.receipt_url) {
    return (
      <div className={`${compact ? '' : 'mt-4'}`}>
        <label className="block text-sm font-medium design-text-primary mb-2">
          Receipt
        </label>
        <div className="flex items-center gap-4 p-3 design-bg-secondary rounded-lg border border-gray-200 dark:border-gray-700">
          {/* Preview */}
          <div className="flex-shrink-0">
            {isImage ? (
              <img
                src={receipt.receipt_url}
                alt="Receipt"
                className="h-16 w-16 object-cover rounded-md cursor-pointer hover:opacity-80 transition-opacity"
                onClick={handleView}
              />
            ) : (
              <div
                className="h-16 w-16 flex items-center justify-center design-bg-tertiary rounded-md cursor-pointer hover:opacity-80 transition-opacity"
                onClick={handleView}
              >
                <FileIcon className="h-8 w-8 design-text-secondary" />
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium design-text-primary truncate">
              {receipt.attachment_filename}
            </p>
            <p className="text-xs design-text-secondary">
              {formatFileSize(receipt.attachment_size)}
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleView}
              className="px-3 py-1.5 text-xs font-medium design-text-primary design-bg-tertiary rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              View
            </button>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={disabled || uploading}
              className="px-3 py-1.5 text-xs font-medium design-text-primary design-bg-tertiary rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors disabled:opacity-50"
            >
              {uploading ? (
                <ArrowPathIcon className="h-4 w-4 animate-spin" />
              ) : (
                'Replace'
              )}
            </button>
            <button
              type="button"
              onClick={handleDelete}
              disabled={disabled || deleting}
              className="px-3 py-1.5 text-xs font-medium text-red-600 dark:text-red-400 design-bg-tertiary rounded-md hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-50"
            >
              {deleting ? (
                <ArrowPathIcon className="h-4 w-4 animate-spin" />
              ) : (
                'Delete'
              )}
            </button>
          </div>

          {/* Hidden file input for replace */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,.pdf,.doc,.docx"
            onChange={handleInputChange}
            className="hidden"
          />
        </div>

        {error && (
          <p className="mt-2 text-sm text-red-600 dark:text-red-400">{error}</p>
        )}
      </div>
    );
  }

  // Render upload dropzone
  return (
    <div className={`${compact ? '' : 'mt-4'}`}>
      <label className="block text-sm font-medium design-text-primary mb-2">
        Receipt (optional)
      </label>
      <div
        className={`
          relative border-2 border-dashed rounded-lg p-6 text-center cursor-pointer
          transition-colors
          bg-white dark:bg-gray-800
          ${isDragging
            ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
            : 'border-gray-300 dark:border-gray-600 hover:border-purple-400 dark:hover:border-purple-500'
          }
          ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        `}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !disabled && fileInputRef.current?.click()}
      >
        {uploading ? (
          <div className="flex flex-col items-center">
            <ArrowPathIcon className="h-10 w-10 design-text-secondary animate-spin mb-2" />
            <p className="text-sm design-text-secondary">Uploading...</p>
          </div>
        ) : (
          <>
            <CloudArrowUpIcon className="mx-auto h-10 w-10 design-text-secondary mb-2" />
            <p className="text-sm design-text-primary">
              Drag and drop your receipt here, or{' '}
              <span className="text-purple-600 dark:text-purple-400 font-medium">
                click to browse
              </span>
            </p>
            <p className="text-xs design-text-secondary mt-1">
              Images, PDF, or Word documents up to 10MB
            </p>
          </>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,.pdf,.doc,.docx"
          onChange={handleInputChange}
          className="hidden"
          disabled={disabled}
        />
      </div>

      {error && (
        <p className="mt-2 text-sm text-red-600 dark:text-red-400">{error}</p>
      )}
    </div>
  );
};

export default ReceiptUpload;
