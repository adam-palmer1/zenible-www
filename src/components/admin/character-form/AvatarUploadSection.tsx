import React from 'react';

interface AvatarUploadSectionProps {
  avatarPreview: string | null;
  currentAvatar: string | null;
  avatarError: string | null;
  uploadingAvatar: boolean;
  fileInputRef: React.RefObject<HTMLInputElement>;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onDeleteAvatar: () => void;
  darkMode: boolean;
}

export default function AvatarUploadSection({
  avatarPreview,
  currentAvatar,
  avatarError,
  uploadingAvatar,
  fileInputRef,
  onFileChange,
  onDeleteAvatar,
  darkMode
}: AvatarUploadSectionProps) {
  return (
    <div className="md:col-span-2">
      <label className={`block text-sm font-medium mb-2 ${
        darkMode ? 'text-zenible-dark-text' : 'text-gray-700'
      }`}>
        Character Avatar
      </label>
      <div className="flex items-start gap-4">
        {/* Avatar Preview */}
        <div className="flex-shrink-0">
          {(avatarPreview || currentAvatar) ? (
            <div className="relative">
              <img
                src={avatarPreview || currentAvatar!}
                alt="Avatar preview"
                className="w-24 h-24 rounded-lg object-cover border-2 border-gray-200"
              />
              {(avatarPreview || currentAvatar) && (
                <button
                  type="button"
                  onClick={onDeleteAvatar}
                  className="absolute -top-2 -right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600"
                  title="Remove avatar"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          ) : (
            <div className={`w-24 h-24 rounded-lg border-2 border-dashed flex items-center justify-center ${
              darkMode ? 'border-zenible-dark-border bg-zenible-dark-bg' : 'border-gray-300 bg-gray-50'
            }`}>
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
          )}
        </div>

        {/* Upload Controls */}
        <div className="flex-1">
          <input
            type="file"
            ref={fileInputRef}
            onChange={onFileChange}
            accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              darkMode
                ? 'bg-zenible-dark-bg border border-zenible-dark-border text-zenible-dark-text hover:bg-zenible-dark-hover'
                : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
            disabled={uploadingAvatar}
          >
            {uploadingAvatar ? 'Uploading...' : 'Choose Image'}
          </button>
          <p className={`mt-2 text-xs ${
            darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'
          }`}>
            Accepts JPEG, PNG, GIF, WebP. Max 5MB.
          </p>
          {avatarError && (
            <p className="mt-2 text-xs text-red-500">
              {avatarError}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
