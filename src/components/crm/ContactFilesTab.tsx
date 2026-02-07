import React, { useState, useEffect, useRef, useCallback } from 'react';
import { TrashIcon, PencilIcon, ArrowDownTrayIcon, DocumentIcon, XMarkIcon, CheckIcon } from '@heroicons/react/24/outline';
import contactFilesAPI from '../../services/api/crm/contactFiles';
import { useNotification } from '../../contexts/NotificationContext';
import { LoadingSpinner } from '../shared';
import type { ContactFileResponse, ContactFileUpdateRequest } from '../../types/crm';

interface ContactProject {
  id: string;
  name: string;
}

interface ContactFileListParams {
  include_download_urls?: boolean;
  project_id?: string;
}

/**
 * Format file size to human readable string
 */
const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

/**
 * Format date to readable string
 */
const formatDate = (dateString: string): string => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

/**
 * Get file icon based on content type
 */
const getFileIcon = (contentType: string) => {
  if (contentType?.startsWith('image/')) {
    return (
      <svg className="w-8 h-8 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    );
  }
  if (contentType === 'application/pdf') {
    return (
      <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
      </svg>
    );
  }
  return <DocumentIcon className="w-8 h-8 text-gray-400" />;
};

interface FileItemProps {
  file: ContactFileResponse;
  projects: ContactProject[];
  onEdit: (fileId: string, data: ContactFileUpdateRequest) => Promise<void>;
  onDelete: (file: ContactFileResponse) => void;
  onDownload: (file: ContactFileResponse) => void;
}

/**
 * Single file item component
 */
const FileItem: React.FC<FileItemProps> = ({ file, projects, onEdit, onDelete, onDownload }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editDescription, setEditDescription] = useState(file.description || '');
  const [editProjectId, setEditProjectId] = useState(file.project_id || '');
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onEdit(file.id, {
        description: editDescription || null,
        project_id: editProjectId || null,
      });
      setIsEditing(false);
    } catch (_error) {
      // Error handled by parent
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setEditDescription(file.description || '');
    setEditProjectId(file.project_id || '');
    setIsEditing(false);
  };

  const projectName = file.project_id
    ? projects.find((p: ContactProject) => p.id === file.project_id)?.name || 'Unknown Project'
    : null;

  return (
    <div className="flex items-start gap-3 p-3 bg-white border border-gray-200 rounded-lg hover:border-gray-300 transition-colors">
      {/* File Icon */}
      <div className="flex-shrink-0">
        {getFileIcon(file.content_type)}
      </div>

      {/* File Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">{file.filename}</p>
            <p className="text-xs text-gray-500 mt-0.5">
              {formatFileSize(file.file_size)} &bull; {formatDate(file.created_at)}
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1 flex-shrink-0">
            {isEditing ? (
              <>
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="p-1.5 text-green-600 hover:bg-green-50 rounded transition-colors disabled:opacity-50"
                  title="Save"
                >
                  <CheckIcon className="w-4 h-4" />
                </button>
                <button
                  onClick={handleCancel}
                  className="p-1.5 text-gray-600 hover:bg-gray-100 rounded transition-colors"
                  title="Cancel"
                >
                  <XMarkIcon className="w-4 h-4" />
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => onDownload(file)}
                  className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                  title="Download"
                >
                  <ArrowDownTrayIcon className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setIsEditing(true)}
                  className="p-1.5 text-gray-600 hover:bg-gray-100 rounded transition-colors"
                  title="Edit"
                >
                  <PencilIcon className="w-4 h-4" />
                </button>
                <button
                  onClick={() => onDelete(file)}
                  className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
                  title="Delete"
                >
                  <TrashIcon className="w-4 h-4" />
                </button>
              </>
            )}
          </div>
        </div>

        {/* Edit Form */}
        {isEditing ? (
          <div className="mt-2 space-y-2">
            <input
              type="text"
              value={editDescription}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditDescription(e.target.value)}
              placeholder="Add description..."
              className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-zenible-primary focus:border-zenible-primary"
            />
            <select
              value={editProjectId}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setEditProjectId(e.target.value)}
              className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-zenible-primary focus:border-zenible-primary"
            >
              <option value="">No project</option>
              {projects.map((project: ContactProject) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
          </div>
        ) : (
          <>
            {file.description && (
              <p className="text-xs text-gray-600 mt-1">{file.description}</p>
            )}
            {projectName && (
              <span className="inline-flex items-center px-2 py-0.5 mt-1 text-xs font-medium bg-purple-100 text-purple-800 rounded-full">
                {projectName}
              </span>
            )}
          </>
        )}
      </div>
    </div>
  );
};

interface DeleteConfirmModalProps {
  file: ContactFileResponse | null;
  isOpen: boolean;
  onConfirm: (file: ContactFileResponse) => void;
  onCancel: () => void;
  isDeleting: boolean;
}

/**
 * Delete confirmation modal
 */
const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({ file, isOpen, onConfirm, onCancel, isDeleting }) => {
  if (!isOpen || !file) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-lg shadow-xl max-w-sm w-full p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Delete File</h3>
        <p className="text-sm text-gray-600 mb-4">
          Are you sure you want to delete "{file.filename}"? This action cannot be undone.
        </p>
        <div className="flex justify-end gap-3">
          <button
            onClick={onCancel}
            disabled={isDeleting}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={() => onConfirm(file)}
            disabled={isDeleting}
            className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors disabled:opacity-50"
          >
            {isDeleting ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  );
};

interface ContactFilesTabProps {
  contactId: string;
  projects?: ContactProject[];
}

/**
 * Contact Files Tab Component
 * Displays and manages files for a contact
 */
const ContactFilesTab: React.FC<ContactFilesTabProps> = ({ contactId, projects = [] }) => {
  const { showSuccess, showError } = useNotification();

  const [files, setFiles] = useState<ContactFileResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  const [filterProjectId, setFilterProjectId] = useState('');

  const [deleteFile, setDeleteFile] = useState<ContactFileResponse | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch files
  const fetchFiles = useCallback(async () => {
    if (!contactId) return;

    try {
      setLoading(true);
      setError(null);
      const params: ContactFileListParams = { include_download_urls: true };
      if (filterProjectId) {
        params.project_id = filterProjectId;
      }
      const response = await contactFilesAPI.list(contactId, params as Record<string, unknown>) as { items: ContactFileResponse[] };
      setFiles(response.items || []);
    } catch (err: unknown) {
      setError((err as Error).message || 'Failed to load files');
    } finally {
      setLoading(false);
    }
  }, [contactId, filterProjectId]);

  useEffect(() => {
    fetchFiles();
  }, [fetchFiles]);

  // Handle file upload
  const handleUpload = async (file: File) => {
    if (!file) return;

    // Validate file size (10MB max)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      showError(`File size exceeds maximum of ${formatFileSize(maxSize)}`);
      return;
    }

    setIsUploading(true);
    setUploadProgress(10);

    try {
      // Convert file to upload data
      const uploadData = await contactFilesAPI.fileToUploadData(file);
      setUploadProgress(50);

      // Upload file
      await contactFilesAPI.upload(contactId, uploadData);
      setUploadProgress(100);

      showSuccess('File uploaded successfully');

      // Refresh file list
      await fetchFiles();
    } catch (err: unknown) {
      showError((err as Error).message || 'Failed to upload file');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Handle file edit
  const handleEdit = async (fileId: string, updateData: ContactFileUpdateRequest) => {
    try {
      await contactFilesAPI.update(contactId, fileId, updateData);
      showSuccess('File updated successfully');
      await fetchFiles();
    } catch (err: unknown) {
      showError((err as Error).message || 'Failed to update file');
      throw err;
    }
  };

  // Handle file delete
  const handleDelete = async (file: ContactFileResponse) => {
    setIsDeleting(true);
    try {
      await contactFilesAPI.delete(contactId, file.id);
      showSuccess('File deleted successfully');
      setDeleteFile(null);
      await fetchFiles();
    } catch (err: unknown) {
      showError((err as Error).message || 'Failed to delete file');
    } finally {
      setIsDeleting(false);
    }
  };

  // Handle file download
  const handleDownload = async (file: ContactFileResponse) => {
    try {
      // Get fresh download URL
      const fileData = await contactFilesAPI.get(contactId, file.id) as ContactFileResponse;
      if (fileData.download_url) {
        window.open(fileData.download_url, '_blank');
      } else {
        showError('Download URL not available');
      }
    } catch (err: unknown) {
      showError((err as Error).message || 'Failed to download file');
    }
  };

  // Drag and drop handlers
  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const droppedFiles = e.dataTransfer.files;
    if (droppedFiles.length > 0) {
      handleUpload(droppedFiles[0]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      handleUpload(selectedFile);
    }
  };

  if (loading && files.length === 0) {
    return <LoadingSpinner size="h-8 w-8" height="py-8" />;
  }

  if (error && files.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-red-500 text-sm mb-2">Failed to load files</p>
        <button
          onClick={fetchFiles}
          className="text-zenible-primary hover:text-purple-600 text-sm font-medium"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with filter */}
      <div className="flex items-center justify-between gap-4">
        <h3 className="text-base font-semibold text-gray-900">Files</h3>
        {projects.length > 0 && (
          <select
            value={filterProjectId}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setFilterProjectId(e.target.value)}
            className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-zenible-primary focus:border-zenible-primary"
          >
            <option value="">All projects</option>
            {projects.map((project: ContactProject) => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Upload Area */}
      <div
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`relative border-2 border-dashed rounded-lg transition-colors ${
          isDragging
            ? 'border-zenible-primary bg-purple-50'
            : 'border-gray-300 hover:border-gray-400'
        } ${isUploading ? 'pointer-events-none opacity-50' : ''}`}
      >
        <input
          ref={fileInputRef}
          type="file"
          onChange={handleFileInputChange}
          className="hidden"
        />

        {isUploading ? (
          <div className="p-6 text-center">
            <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
              <div
                className="bg-zenible-primary h-2 rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
            <p className="text-sm text-gray-600">Uploading... {uploadProgress}%</p>
          </div>
        ) : (
          <div className="p-6 text-center">
            <DocumentIcon className="mx-auto h-10 w-10 text-gray-400 mb-2" />
            <p className="text-sm text-gray-600 mb-1">
              Drag and drop a file here, or{' '}
              <button
                onClick={() => fileInputRef.current?.click()}
                className="text-zenible-primary hover:text-purple-600 font-medium"
              >
                browse
              </button>
            </p>
            <p className="text-xs text-gray-500">Max file size: 10MB</p>
          </div>
        )}
      </div>

      {/* Files List */}
      {files.length === 0 ? (
        <div className="text-center py-6">
          <p className="text-gray-500 text-sm">No files uploaded yet</p>
          <p className="text-gray-400 text-xs mt-1">
            Upload files to share with this contact
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {files.map((file: ContactFileResponse) => (
            <FileItem
              key={file.id}
              file={file}
              projects={projects}
              onEdit={handleEdit}
              onDelete={setDeleteFile}
              onDownload={handleDownload}
            />
          ))}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        file={deleteFile}
        isOpen={!!deleteFile}
        onConfirm={handleDelete}
        onCancel={() => setDeleteFile(null)}
        isDeleting={isDeleting}
      />
    </div>
  );
};

export default ContactFilesTab;
