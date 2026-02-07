import React from 'react';
import { EventItem } from './types';

interface DeleteEventModalProps {
  darkMode: boolean;
  event: EventItem;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function DeleteEventModal({
  darkMode,
  event,
  onConfirm,
  onCancel,
}: DeleteEventModalProps) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className={`w-full max-w-md mx-4 rounded-xl ${darkMode ? 'bg-zenible-dark-card' : 'bg-white'}`}>
        <div className={`px-6 py-4 border-b ${darkMode ? 'border-zenible-dark-border' : 'border-neutral-200'}`}>
          <h3 className={`text-lg font-semibold ${darkMode ? 'text-zenible-dark-text' : 'text-zinc-950'}`}>
            Confirm Delete
          </h3>
        </div>
        <div className="p-6">
          <p className={`${darkMode ? 'text-zenible-dark-text' : 'text-gray-700'}`}>
            Are you sure you want to delete this event?
          </p>
          <p className={`mt-2 text-sm font-medium ${darkMode ? 'text-zenible-dark-text' : 'text-gray-900'}`}>
            "{event.title}"
          </p>
        </div>
        <div className={`px-6 py-4 border-t flex gap-2 ${darkMode ? 'border-zenible-dark-border' : 'border-neutral-200'}`}>
          <button
            onClick={onConfirm}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            Delete
          </button>
          <button
            onClick={onCancel}
            className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
