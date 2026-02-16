import React, { useState, useEffect } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { X, Loader2 } from 'lucide-react';

interface SaveReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: { name: string; description: string }) => Promise<void>;
  initialName?: string;
  initialDescription?: string;
  isUpdate?: boolean;
}

const SaveReportModal: React.FC<SaveReportModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialName = '',
  initialDescription = '',
  isUpdate = false,
}) => {
  const [name, setName] = useState(initialName);
  const [description, setDescription] = useState(initialDescription);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setName(initialName);
      setDescription(initialDescription);
      setError(null);
    }
  }, [isOpen, initialName, initialDescription]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Report name is required');
      return;
    }

    try {
      setSaving(true);
      setError(null);
      await onSave({ name: name.trim(), description: description.trim() });
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save report');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50" style={{ zIndex: 10000 }} />
        <Dialog.Content
          className="fixed left-[50%] top-[50%] translate-x-[-50%] translate-y-[-50%] bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6 focus:outline-none"
          style={{ zIndex: 10001 }}
        >
          <Dialog.Title className="text-lg font-semibold text-[#09090b] mb-4">
            {isUpdate ? 'Update Report' : 'Save Report'}
          </Dialog.Title>
          <Dialog.Description className="sr-only">
            {isUpdate ? 'Update report details' : 'Save report with a name and description'}
          </Dialog.Description>

          <Dialog.Close className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
            <X className="h-5 w-5" />
          </Dialog.Close>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="report-name" className="block text-sm font-medium text-gray-700 mb-1">
                Name
              </label>
              <input
                id="report-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Monthly Revenue Report"
                maxLength={255}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                autoFocus
              />
            </div>

            <div>
              <label htmlFor="report-description" className="block text-sm font-medium text-gray-700 mb-1">
                Description (optional)
              </label>
              <textarea
                id="report-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief description of this report..."
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
              />
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving || !name.trim()}
                className="px-4 py-2 text-sm font-medium text-white bg-[#8e51ff] rounded-lg hover:bg-[#7c3aed] disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                {isUpdate ? 'Update' : 'Save'}
              </button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};

export default SaveReportModal;
