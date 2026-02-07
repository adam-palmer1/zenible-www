import React, { useState, useEffect } from 'react';

interface ModelPricingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (modelId: string, inputPrice: number, outputPrice: number) => Promise<void>;
  model: any;
  darkMode: boolean;
}

export default function ModelPricingModal({ isOpen, onClose, onSave, model, darkMode }: ModelPricingModalProps) {
  const [formData, setFormData] = useState<{ pricing_input: string; pricing_output: string }>({
    pricing_input: '',
    pricing_output: ''
  });
  const [saving, setSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (model && isOpen) {
      setFormData({
        pricing_input: model.pricing_input || '',
        pricing_output: model.pricing_output || ''
      });
      setError(null);
    }
  }, [model, isOpen]);

  // Handle escape key
  useEffect(() => {
    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen && !saving) {
        handleClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscapeKey);
      return () => document.removeEventListener('keydown', handleEscapeKey);
    }
  }, [isOpen, saving]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      // Validate inputs
      const inputPrice = parseFloat(formData.pricing_input);
      const outputPrice = parseFloat(formData.pricing_output);

      if (isNaN(inputPrice) || inputPrice < 0) {
        throw new Error('Input pricing must be a valid positive number');
      }
      if (isNaN(outputPrice) || outputPrice < 0) {
        throw new Error('Output pricing must be a valid positive number');
      }

      await onSave(model.model_id, inputPrice, outputPrice);
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    if (!saving) {
      onClose();
      setError(null);
      setFormData({
        pricing_input: '',
        pricing_output: ''
      });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className={`w-full max-w-md rounded-xl overflow-hidden ${
        darkMode ? 'bg-zenible-dark-card' : 'bg-white'
      }`}>
        {/* Modal Header */}
        <div className={`px-6 py-4 border-b ${darkMode ? 'border-zenible-dark-border' : 'border-neutral-200'}`}>
          <div className="flex justify-between items-center">
            <div>
              <h2 className={`text-xl font-semibold ${darkMode ? 'text-zenible-dark-text' : 'text-zinc-950'}`}>
                Edit Model Pricing
              </h2>
              <p className={`mt-1 text-sm ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-zinc-600'}`}>
                {model?.model_id || 'Model'}
              </p>
            </div>
            <button
              onClick={handleClose}
              disabled={saving}
              className={`p-2 rounded-lg transition-colors ${
                darkMode ? 'hover:bg-zenible-dark-bg text-zenible-dark-text' : 'hover:bg-gray-100 text-gray-600'
              } ${saving ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-6">
          {error && (
            <div className={`mb-4 p-3 rounded-lg ${
              darkMode ? 'bg-red-900/20 text-red-400' : 'bg-red-50 text-red-700'
            }`}>
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className={`block text-sm font-medium mb-2 ${
                darkMode ? 'text-zenible-dark-text' : 'text-gray-700'
              }`}>
                Input Price (per 1K tokens)
              </label>
              <div className="relative">
                <span className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${
                  darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'
                }`}>
                  $
                </span>
                <input
                  type="number"
                  step="0.000001"
                  min="0"
                  value={formData.pricing_input}
                  onChange={(e) => setFormData({ ...formData, pricing_input: e.target.value })}
                  className={`w-full pl-8 pr-3 py-2 rounded-lg border ${
                    darkMode
                      ? 'bg-zenible-dark-bg border-zenible-dark-border text-zenible-dark-text placeholder-zenible-dark-text-secondary'
                      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                  } focus:ring-2 focus:ring-zenible-primary focus:border-transparent`}
                  placeholder="0.000000"
                  required
                  disabled={saving}
                />
              </div>
              <p className={`mt-1 text-xs ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'}`}>
                Cost for processing 1,000 input tokens
              </p>
            </div>

            <div>
              <label className={`block text-sm font-medium mb-2 ${
                darkMode ? 'text-zenible-dark-text' : 'text-gray-700'
              }`}>
                Output Price (per 1K tokens)
              </label>
              <div className="relative">
                <span className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${
                  darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'
                }`}>
                  $
                </span>
                <input
                  type="number"
                  step="0.000001"
                  min="0"
                  value={formData.pricing_output}
                  onChange={(e) => setFormData({ ...formData, pricing_output: e.target.value })}
                  className={`w-full pl-8 pr-3 py-2 rounded-lg border ${
                    darkMode
                      ? 'bg-zenible-dark-bg border-zenible-dark-border text-zenible-dark-text placeholder-zenible-dark-text-secondary'
                      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                  } focus:ring-2 focus:ring-zenible-primary focus:border-transparent`}
                  placeholder="0.000000"
                  required
                  disabled={saving}
                />
              </div>
              <p className={`mt-1 text-xs ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'}`}>
                Cost for generating 1,000 output tokens
              </p>
            </div>
          </div>

          {/* Modal Footer */}
          <div className="flex justify-end gap-3 mt-6">
            <button
              type="button"
              onClick={handleClose}
              disabled={saving}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                darkMode
                  ? 'bg-zenible-dark-bg text-zenible-dark-text hover:bg-zenible-dark-tab-bg'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              } ${saving ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
                saving
                  ? darkMode
                    ? 'bg-zenible-dark-tab-bg text-zenible-dark-text-secondary cursor-not-allowed'
                    : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-zenible-primary text-white hover:bg-zenible-primary-dark'
              }`}
            >
              {saving && (
                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
              )}
              <span>{saving ? 'Updating...' : 'Update Pricing'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
