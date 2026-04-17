import React from 'react';
import type { MessageAttachment } from './types';

interface MessageAttachmentsProps {
  attachments: MessageAttachment[];
  darkMode: boolean;
}

export default function MessageAttachments({ attachments, darkMode }: MessageAttachmentsProps) {
  if (!attachments.length) return null;

  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith('image/')) return '🖼';
    if (fileType === 'application/pdf') return '📄';
    if (fileType.includes('spreadsheet') || fileType.includes('excel') || fileType === 'text/csv') return '📊';
    if (fileType.includes('word') || fileType.includes('document')) return '📝';
    return '📎';
  };

  return (
    <div className="mt-1.5 flex flex-wrap gap-1.5">
      {attachments.map(att => (
        <a
          key={att.document_id}
          href={att.url}
          target="_blank"
          rel="noopener noreferrer"
          className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs max-w-[200px] transition-colors ${
            darkMode
              ? 'bg-[#3a3a3a] text-gray-200 hover:bg-[#444]'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200'
          }`}
        >
          {att.thumbnail_url && att.file_type.startsWith('image/') ? (
            <img src={att.thumbnail_url} alt="" className="w-5 h-5 rounded object-cover flex-shrink-0" />
          ) : (
            <span className="flex-shrink-0">{getFileIcon(att.file_type)}</span>
          )}
          <span className="truncate">{att.file_name}</span>
          <svg className="w-3 h-3 flex-shrink-0 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
        </a>
      ))}
    </div>
  );
}
