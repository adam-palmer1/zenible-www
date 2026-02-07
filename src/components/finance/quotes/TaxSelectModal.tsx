import React, { useState, useEffect } from 'react';
import { X, Plus, Check, Loader2 } from 'lucide-react';
import taxesAPI from '../../../services/api/crm/taxes';

interface TaxSelectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (rate: number, label: string) => void;
  initialTaxRate?: number;
  initialTaxLabel?: string;
}

/**
 * Tax Select Modal for Quotes
 * Allows selecting from company taxes or adding a new one
 */
const TaxSelectModal: React.FC<TaxSelectModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialTaxRate = 0,
  initialTaxLabel = 'Tax'
}) => {
  const [taxes, setTaxes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Selected tax state
  const [selectedTaxId, setSelectedTaxId] = useState<string | null>(null);
  const [, setTaxRate] = useState(initialTaxRate);
  const [, setTaxLabel] = useState(initialTaxLabel);

  // Add new tax form
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTaxName, setNewTaxName] = useState('');
  const [newTaxRate, setNewTaxRate] = useState('');
  const [saving, setSaving] = useState(false);

  // Custom rate (when not using company taxes)
  const [useCustom, setUseCustom] = useState(false);
  const [customRate, setCustomRate] = useState('');
  const [customLabel, setCustomLabel] = useState('Tax');

  // Fetch company taxes
  useEffect(() => {
    if (isOpen) {
      fetchTaxes();
      // Reset form state
      setSelectedTaxId(null);
      setShowAddForm(false);
      setUseCustom(false);
      setCustomRate('');
      setCustomLabel('Tax');

      // If there's an initial value, try to match it
      if (initialTaxRate > 0) {
        setTaxRate(initialTaxRate);
        setTaxLabel(initialTaxLabel);
      }
    }
  }, [isOpen, initialTaxRate, initialTaxLabel]);

  // Try to select matching tax when taxes load
  useEffect(() => {
    if (taxes.length > 0 && initialTaxRate > 0) {
      const matchingTax = taxes.find((t: any) =>
        parseFloat(t.tax_rate) === parseFloat(String(initialTaxRate)) &&
        t.tax_name === initialTaxLabel
      );
      if (matchingTax) {
        setSelectedTaxId(matchingTax.id);
      } else {
        // No matching tax, use custom
        setUseCustom(true);
        setCustomRate(String(initialTaxRate));
        setCustomLabel(initialTaxLabel);
      }
    }
  }, [taxes, initialTaxRate, initialTaxLabel]);

  const fetchTaxes = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await (taxesAPI as Record<string, Function>).list();
      setTaxes(data || []);
    } catch (err: any) {
      console.error('Failed to fetch taxes:', err);
      setError('Failed to load taxes');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectTax = (tax: any) => {
    setSelectedTaxId(tax.id);
    setTaxRate(parseFloat(tax.tax_rate));
    setTaxLabel(tax.tax_name);
    setUseCustom(false);
    setCustomRate('');
    setCustomLabel('Tax');
  };

  const handleUseCustom = () => {
    setUseCustom(true);
    setSelectedTaxId(null);
  };

  const handleAddNewTax = async () => {
    if (!newTaxName.trim() || !newTaxRate) {
      return;
    }

    const rate = parseFloat(newTaxRate);
    if (isNaN(rate) || rate < 0 || rate > 100) {
      return;
    }

    try {
      setSaving(true);
      const newTax = await (taxesAPI as Record<string, Function>).create({
        tax_name: newTaxName.trim(),
        tax_rate: rate,
      });

      // Add to list and select it
      setTaxes(prev => [...prev, newTax]);
      handleSelectTax(newTax);

      // Reset form
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
    let finalRate: number, finalLabel: string;

    if (useCustom) {
      finalRate = parseFloat(customRate) || 0;
      finalLabel = customLabel.trim() || 'Tax';
    } else if (selectedTaxId) {
      const selectedTax = taxes.find((t: any) => t.id === selectedTaxId);
      if (selectedTax) {
        finalRate = parseFloat(selectedTax.tax_rate);
        finalLabel = selectedTax.tax_name;
      } else {
        finalRate = 0;
        finalLabel = 'Tax';
      }
    } else {
      finalRate = 0;
      finalLabel = 'Tax';
    }

    if (finalRate < 0 || finalRate > 100) {
      setError('Tax rate must be between 0 and 100');
      return;
    }

    onSave(finalRate, finalLabel);
    onClose();
  };

  const handleRemoveTax = () => {
    onSave(0, 'Tax');
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
                {initialTaxRate > 0 ? 'Edit Tax' : 'Add Tax'}
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
                {taxes.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                      Select Tax
                    </label>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {taxes.map((tax: any) => (
                        <button
                          key={tax.id}
                          type="button"
                          onClick={() => handleSelectTax(tax)}
                          className={`w-full flex items-center justify-between px-4 py-3 rounded-lg border transition-colors ${
                            selectedTaxId === tax.id && !useCustom
                              ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                              : 'border-gray-200 dark:border-gray-600 hover:border-purple-300 dark:hover:border-purple-500'
                          }`}
                        >
                          <div className="text-left">
                            <div className="font-medium text-gray-900 dark:text-white">
                              {tax.tax_name}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              {parseFloat(tax.tax_rate)}%
                            </div>
                          </div>
                          {selectedTaxId === tax.id && !useCustom && (
                            <Check className="h-5 w-5 text-purple-600" />
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

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

                {/* Custom Tax Rate */}
                <div className="border-t border-gray-200 dark:border-gray-600 pt-4">
                  <button
                    type="button"
                    onClick={handleUseCustom}
                    className={`w-full text-left px-4 py-3 rounded-lg border transition-colors ${
                      useCustom
                        ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                        : 'border-gray-200 dark:border-gray-600 hover:border-purple-300 dark:hover:border-purple-500'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-gray-900 dark:text-white">
                        Use Custom Rate
                      </span>
                      {useCustom && <Check className="h-5 w-5 text-purple-600" />}
                    </div>
                  </button>

                  {useCustom && (
                    <div className="mt-3 grid grid-cols-2 gap-3">
                      <input
                        type="text"
                        value={customLabel}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCustomLabel(e.target.value)}
                        placeholder="Tax Label"
                        className="px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900 dark:text-white"
                      />
                      <div className="relative">
                        <input
                          type="number"
                          value={customRate}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCustomRate(e.target.value)}
                          placeholder="Rate"
                          min="0"
                          max="100"
                          step="0.01"
                          className="w-full px-3 py-2 pr-8 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900 dark:text-white"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">%</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Preview */}
                {(selectedTaxId || useCustom) && (
                  <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600 dark:text-gray-300 text-sm">Preview:</span>
                      <span className="text-gray-900 dark:text-white font-medium">
                        {useCustom
                          ? `${customLabel || 'Tax'} (${customRate || 0}%)`
                          : selectedTaxId
                            ? `${taxes.find((t: any) => t.id === selectedTaxId)?.tax_name} (${taxes.find((t: any) => t.id === selectedTaxId)?.tax_rate}%)`
                            : 'No tax selected'
                        }
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="bg-gray-50 dark:bg-gray-900 px-6 py-4 flex justify-between gap-3">
            {initialTaxRate > 0 && (
              <button
                type="button"
                onClick={handleRemoveTax}
                className="px-4 py-2 text-sm font-medium text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
              >
                Remove Tax
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
                disabled={!selectedTaxId && !useCustom}
                className="px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TaxSelectModal;
