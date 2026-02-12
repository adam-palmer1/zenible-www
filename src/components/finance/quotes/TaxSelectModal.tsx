import React, { useState, useEffect } from 'react';
import { X, Plus, Check, Loader2, Trash2 } from 'lucide-react';
import taxesAPI from '../../../services/api/crm/taxes';

interface TaxItem {
  tax_name: string;
  tax_rate: number;
}

interface TaxSelectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (taxes: TaxItem[]) => void;
  initialDocumentTaxes?: TaxItem[];
}

/**
 * Tax Select Modal for Quotes
 * Multi-select from company taxes or add new ones
 */
const TaxSelectModal: React.FC<TaxSelectModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialDocumentTaxes = [],
}) => {
  const [companyTaxes, setCompanyTaxes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Selected taxes
  const [selectedTaxes, setSelectedTaxes] = useState<TaxItem[]>([]);

  // Add new tax form
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTaxName, setNewTaxName] = useState('');
  const [newTaxRate, setNewTaxRate] = useState('');
  const [saving, setSaving] = useState(false);

  // Initialize when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchTaxes();
      setSelectedTaxes(initialDocumentTaxes.map(t => ({
        tax_name: t.tax_name,
        tax_rate: typeof t.tax_rate === 'string' ? parseFloat(t.tax_rate) : t.tax_rate,
      })));
      setShowAddForm(false);
      setNewTaxName('');
      setNewTaxRate('');
      setError(null);
    }
  }, [isOpen, initialDocumentTaxes]);

  const fetchTaxes = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await (taxesAPI as Record<string, Function>).list();
      setCompanyTaxes(data || []);
    } catch (err: any) {
      console.error('Failed to fetch taxes:', err);
      setError('Failed to load taxes');
    } finally {
      setLoading(false);
    }
  };

  const isTaxSelected = (tax: any): boolean => {
    return selectedTaxes.some(
      t => t.tax_name === tax.tax_name && t.tax_rate === parseFloat(tax.tax_rate)
    );
  };

  const toggleTax = (tax: any) => {
    const rate = parseFloat(tax.tax_rate);
    const existingIndex = selectedTaxes.findIndex(
      t => t.tax_name === tax.tax_name && t.tax_rate === rate
    );

    if (existingIndex >= 0) {
      setSelectedTaxes(prev => prev.filter((_, i) => i !== existingIndex));
    } else {
      setSelectedTaxes(prev => [...prev, { tax_name: tax.tax_name, tax_rate: rate }]);
    }
  };

  const removeSelectedTax = (index: number) => {
    setSelectedTaxes(prev => prev.filter((_, i) => i !== index));
  };

  const handleAddNewTax = async () => {
    if (!newTaxName.trim() || !newTaxRate) return;

    const rate = parseFloat(newTaxRate);
    if (isNaN(rate) || rate < 0 || rate > 100) {
      setError('Tax rate must be between 0 and 100');
      return;
    }

    try {
      setSaving(true);
      const newTax = await (taxesAPI as Record<string, Function>).create({
        tax_name: newTaxName.trim(),
        tax_rate: rate,
      });

      // Add to company list and auto-select
      setCompanyTaxes(prev => [...prev, newTax]);
      setSelectedTaxes(prev => [...prev, { tax_name: newTax.tax_name, tax_rate: parseFloat(newTax.tax_rate) }]);
      setNewTaxName('');
      setNewTaxRate('');
      setShowAddForm(false);
    } catch (err: any) {
      console.error('Failed to create tax:', err);
      setError(err.message || 'Failed to create tax');
    } finally {
      setSaving(false);
    }
  };

  const handleSave = () => {
    onSave(selectedTaxes);
    onClose();
  };

  const handleRemoveAll = () => {
    onSave([]);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        {/* Backdrop */}
        <div
          className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75 dark:bg-gray-900 dark:bg-opacity-75"
          onClick={onClose}
        />

        {/* Modal */}
        <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full relative z-10">
          {/* Header */}
          <div className="bg-white dark:bg-gray-800 px-6 pt-6 pb-4">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                {initialDocumentTaxes.length > 0 ? 'Edit Taxes' : 'Add Taxes'}
              </h3>
              <button
                onClick={onClose}
                className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Error message */}
            {error && (
              <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-600 dark:text-red-400">
                {error}
              </div>
            )}

            {/* Loading state */}
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
              </div>
            ) : (
              <div className="space-y-4">
                {/* Company Taxes List */}
                <div>
                  <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                    Available Taxes
                  </label>
                  {companyTaxes.length > 0 ? (
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {companyTaxes.map((tax: any) => {
                        const selected = isTaxSelected(tax);
                        return (
                          <button
                            key={tax.id}
                            type="button"
                            onClick={() => toggleTax(tax)}
                            className={`w-full flex items-center justify-between px-4 py-3 rounded-lg border transition-colors ${
                              selected
                                ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                                : 'border-gray-200 dark:border-gray-600 hover:border-purple-300 dark:hover:border-purple-500'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <div className={`w-4 h-4 rounded border flex items-center justify-center ${
                                selected
                                  ? 'bg-purple-600 border-purple-600'
                                  : 'border-gray-300 dark:border-gray-500'
                              }`}>
                                {selected && <Check className="h-3 w-3 text-white" />}
                              </div>
                              <span className={`font-medium ${
                                selected
                                  ? 'text-purple-700 dark:text-purple-400'
                                  : 'text-gray-900 dark:text-white'
                              }`}>
                                {tax.tax_name}
                              </span>
                            </div>
                            <span className={`text-sm ${
                              selected
                                ? 'text-purple-600 dark:text-purple-400'
                                : 'text-gray-500 dark:text-gray-400'
                            }`}>
                              {parseFloat(tax.tax_rate)}%
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  ) : !showAddForm ? (
                    <div className="text-center py-6 text-gray-500 dark:text-gray-400">
                      <p className="mb-3">No saved taxes found</p>
                      <button
                        onClick={() => setShowAddForm(true)}
                        className="inline-flex items-center gap-1 text-purple-600 hover:text-purple-700 font-medium"
                      >
                        <Plus className="h-4 w-4" />
                        Create your first tax
                      </button>
                    </div>
                  ) : null}
                </div>

                {/* Add New Tax Button/Form */}
                {!showAddForm ? (
                  <button
                    type="button"
                    onClick={() => setShowAddForm(true)}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg text-gray-600 dark:text-gray-400 hover:border-purple-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
                  >
                    <Plus className="h-5 w-5" />
                    Add New Tax
                  </button>
                ) : (
                  <div className="p-4 border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        New Tax
                      </span>
                      <button
                        type="button"
                        onClick={() => setShowAddForm(false)}
                        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-3 mb-3">
                      <input
                        type="text"
                        value={newTaxName}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewTaxName(e.target.value)}
                        placeholder="Tax Name"
                        className="px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      />
                      <div className="relative">
                        <input
                          type="number"
                          value={newTaxRate}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewTaxRate(e.target.value)}
                          placeholder="Rate"
                          min="0"
                          max="100"
                          step="0.01"
                          className="w-full px-3 py-2 pr-8 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">%</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleAddNewTax}
                      disabled={saving || !newTaxName.trim() || !newTaxRate}
                      className="w-full px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {saving ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Plus className="h-4 w-4" />
                          Save Tax
                        </>
                      )}
                    </button>
                  </div>
                )}

                {/* Applied Taxes Summary */}
                {selectedTaxes.length > 0 && (
                  <div className="border-t border-gray-200 dark:border-gray-600 pt-4">
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Applied Taxes ({selectedTaxes.length})
                      </label>
                      <button
                        type="button"
                        onClick={() => setSelectedTaxes([])}
                        className="text-xs text-red-600 hover:text-red-700 dark:text-red-400"
                      >
                        Clear All
                      </button>
                    </div>
                    <div className="space-y-2">
                      {selectedTaxes.map((tax, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between px-3 py-2 bg-gray-50 dark:bg-gray-700 rounded-lg"
                        >
                          <span className="text-sm text-gray-900 dark:text-white">
                            {tax.tax_name} ({tax.tax_rate}%)
                          </span>
                          <button
                            type="button"
                            onClick={() => removeSelectedTax(index)}
                            className="text-red-500 hover:text-red-600"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="bg-gray-50 dark:bg-gray-900 px-6 py-4 flex justify-between gap-3">
            {initialDocumentTaxes.length > 0 && (
              <button
                type="button"
                onClick={handleRemoveAll}
                className="px-4 py-2 text-sm font-medium text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
              >
                Remove All
              </button>
            )}
            <div className="flex gap-3 ml-auto">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-900 dark:text-white bg-gray-100 dark:bg-gray-700 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={selectedTaxes.length === 0}
                className="px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Apply Taxes
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TaxSelectModal;
