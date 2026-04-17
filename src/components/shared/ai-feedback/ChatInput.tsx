import React, { useRef, useEffect, useState, useCallback } from 'react';
import sendIcon from '../../../assets/icons/send.svg';
import type { MessageAttachment, LinkedMeeting } from './types';

interface ChatInputProps {
  darkMode: boolean;
  question: string;
  analyzing: boolean;
  isProcessing: boolean;
  isSendingMessage: boolean;
  onQuestionChange: (value: string) => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
  onSend: () => void;
  onFileSelect?: (files: FileList) => void;
  pendingAttachments?: MessageAttachment[];
  onRemoveAttachment?: (documentId: string) => void;
  pendingMeeting?: LinkedMeeting | null;
  onRemoveMeeting?: () => void;
  onLinkMeeting?: () => void;
  uploadingFiles?: boolean;
  isStreaming?: boolean;
  onStop?: () => void;
}

export default function ChatInput({
  darkMode,
  question,
  analyzing,
  isProcessing,
  isSendingMessage,
  onQuestionChange,
  onKeyDown,
  onSend,
  onFileSelect,
  pendingAttachments = [],
  onRemoveAttachment,
  pendingMeeting,
  onRemoveMeeting,
  onLinkMeeting,
  uploadingFiles = false,
  isStreaming = false,
  onStop,
}: ChatInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [showAttachMenu, setShowAttachMenu] = useState(false);

  // Auto-resize textarea to fit content
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 120) + 'px';
  }, [question]);

  // Close menu on outside click
  useEffect(() => {
    if (!showAttachMenu) return;
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowAttachMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [showAttachMenu]);

  const hasAttachOptions = !!onFileSelect || !!onLinkMeeting;
  const hasPendingContent = pendingAttachments.length > 0 || !!pendingMeeting;
  const canSend = !analyzing && !isProcessing && !isSendingMessage && (!!question.trim() || hasPendingContent);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onFileSelect) setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    if (onFileSelect && e.dataTransfer.files.length > 0) {
      onFileSelect(e.dataTransfer.files);
    }
  };

  const handleAttachFile = useCallback(() => {
    setShowAttachMenu(false);
    fileInputRef.current?.click();
  }, []);

  const handleAttachMeeting = useCallback(() => {
    setShowAttachMenu(false);
    onLinkMeeting?.();
  }, [onLinkMeeting]);

  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith('image/')) return '🖼';
    if (fileType === 'application/pdf') return '📄';
    return '📎';
  };

  const formatDuration = (ms: number) => {
    const minutes = Math.round(ms / 60000);
    if (minutes < 60) return `${minutes}m`;
    return `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
  };

  return (
    <div
      className="p-1.5 sm:p-2 flex-shrink-0"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Drop zone overlay */}
      {isDragOver && (
        <div className={`mb-2 border-2 border-dashed rounded-xl p-4 text-center text-sm ${
          darkMode
            ? 'border-violet-400 bg-violet-900/20 text-violet-300'
            : 'border-violet-400 bg-violet-50 text-violet-600'
        }`}>
          Drop files here to attach
        </div>
      )}

      {/* Pending attachments & meeting strip */}
      {(pendingAttachments.length > 0 || pendingMeeting || uploadingFiles) && (
        <div className={`mb-1.5 px-2 py-1.5 rounded-lg flex flex-wrap items-center gap-1.5 ${
          darkMode ? 'bg-[#2a2a2a]' : 'bg-neutral-100'
        }`}>
          {/* Uploading indicator */}
          {uploadingFiles && (
            <span className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-md ${
              darkMode ? 'bg-[#3a3a3a] text-gray-300' : 'bg-white text-gray-600'
            }`}>
              <svg className="animate-spin w-3 h-3" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
              </svg>
              Uploading...
            </span>
          )}

          {/* Attachment chips */}
          {pendingAttachments.map(att => (
            <span
              key={att.document_id}
              className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-md max-w-[180px] ${
                darkMode ? 'bg-[#3a3a3a] text-gray-200' : 'bg-white text-gray-700 border border-gray-200'
              }`}
            >
              <span>{getFileIcon(att.file_type)}</span>
              <span className="truncate">{att.file_name}</span>
              {onRemoveAttachment && (
                <button
                  onClick={() => onRemoveAttachment(att.document_id)}
                  className={`ml-0.5 flex-shrink-0 rounded-full w-4 h-4 flex items-center justify-center text-xs leading-none hover:bg-red-100 hover:text-red-600 ${
                    darkMode ? 'text-gray-400 hover:bg-red-900/30 hover:text-red-400' : 'text-gray-400'
                  }`}
                >
                  ×
                </button>
              )}
            </span>
          ))}

          {/* Meeting chip */}
          {pendingMeeting && (
            <span className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-md max-w-[220px] ${
              darkMode ? 'bg-violet-900/30 text-violet-300 border border-violet-700' : 'bg-violet-50 text-violet-700 border border-violet-200'
            }`}>
              <svg className="w-3 h-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              <span className="truncate">{pendingMeeting.title}</span>
              {pendingMeeting.duration_ms && (
                <span className="opacity-70 flex-shrink-0">{formatDuration(pendingMeeting.duration_ms)}</span>
              )}
              {onRemoveMeeting && (
                <button
                  onClick={onRemoveMeeting}
                  className={`ml-0.5 flex-shrink-0 rounded-full w-4 h-4 flex items-center justify-center text-xs leading-none hover:bg-red-100 hover:text-red-600 ${
                    darkMode ? 'hover:bg-red-900/30 hover:text-red-400' : ''
                  }`}
                >
                  ×
                </button>
              )}
            </span>
          )}
        </div>
      )}

      <div className={`border rounded-xl flex items-end pl-3 sm:pl-4 pr-1 sm:pr-1.5 py-1 sm:py-1.5 ${
        darkMode
          ? 'bg-[#2d2d2d] border-[#4a4a4a]'
          : 'bg-neutral-50 border-neutral-200'
      }`}>
        <textarea
          ref={textareaRef}
          value={question}
          onChange={(e) => onQuestionChange(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder="Ask me a question..."
          disabled={analyzing || isProcessing || isSendingMessage}
          rows={1}
          className={`flex-1 bg-transparent font-inter font-normal text-xs sm:text-sm outline-none min-w-0 resize-none py-1.5 pr-3 ${
            darkMode
              ? 'text-white placeholder:text-[#888888] disabled:opacity-50'
              : 'text-zinc-950 placeholder:text-zinc-500 disabled:opacity-50'
          }`}
        />

        {/* Hidden file input */}
        {onFileSelect && (
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.csv,.txt"
            className="hidden"
            onChange={(e) => {
              if (e.target.files && e.target.files.length > 0) {
                onFileSelect(e.target.files);
                e.target.value = '';
              }
            }}
          />
        )}

        {/* Paperclip button — opens attach menu */}
        {hasAttachOptions && (
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setShowAttachMenu(prev => !prev)}
              disabled={analyzing || isProcessing || isSendingMessage}
              className={`w-8 h-8 sm:w-9 sm:h-9 rounded-[10px] flex items-center justify-center transition-colors flex-shrink-0 mb-0.5 mr-1 ${
                showAttachMenu
                  ? darkMode
                    ? 'text-violet-400 bg-[#3a3a3a]'
                    : 'text-violet-600 bg-gray-100'
                  : darkMode
                    ? 'text-gray-400 hover:text-gray-200 hover:bg-[#3a3a3a]'
                    : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
              title="Attach"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
              </svg>
            </button>

            {/* Attach menu popover */}
            {showAttachMenu && (
              <div className={`absolute bottom-full right-0 mb-2 w-48 rounded-xl border shadow-lg overflow-hidden z-20 ${
                darkMode
                  ? 'bg-[#2d2d2d] border-[#4a4a4a]'
                  : 'bg-white border-gray-200'
              }`}>
                {onFileSelect && (
                  <button
                    onClick={handleAttachFile}
                    className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-sm transition-colors ${
                      darkMode
                        ? 'text-gray-200 hover:bg-[#3a3a3a]'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <svg className="w-4 h-4 flex-shrink-0 opacity-60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    Attach File
                  </button>
                )}
                {onLinkMeeting && (
                  <button
                    onClick={handleAttachMeeting}
                    className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-sm transition-colors ${
                      darkMode
                        ? 'text-gray-200 hover:bg-[#3a3a3a]'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <svg className="w-4 h-4 flex-shrink-0 opacity-60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    Attach Meeting
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {isStreaming && onStop ? (
          <button
            onClick={onStop}
            aria-label="Stop"
            title="Stop"
            className="w-8 h-8 sm:w-9 sm:h-9 bg-zenible-primary rounded-[10px] flex items-center justify-center hover:bg-purple-600 transition-colors flex-shrink-0 mb-0.5"
          >
            <svg
              className="w-3 h-3 sm:w-3.5 sm:h-3.5"
              viewBox="0 0 16 16"
              fill="white"
              aria-hidden="true"
            >
              <rect x="3" y="3" width="10" height="10" rx="1.5" />
            </svg>
          </button>
        ) : (
          <button
            onClick={onSend}
            disabled={!canSend}
            className="w-8 h-8 sm:w-9 sm:h-9 bg-zenible-primary rounded-[10px] flex items-center justify-center hover:bg-purple-600 transition-colors flex-shrink-0 disabled:opacity-50 disabled:cursor-not-allowed mb-0.5"
          >
            <img src={sendIcon} alt="" className="w-3 h-3 sm:w-4 sm:h-4" />
          </button>
        )}
      </div>
    </div>
  );
}
