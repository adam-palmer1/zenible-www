import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, Check, Loader2, GripVertical } from 'lucide-react';
import taxesAPI from '../../../services/api/crm/taxes';

/**
 * Line Item Tax Modal
 * Allows adding multiple taxes to a single line item
 */
const LineItemTaxModal = ({
  isOpen,
  onClose,
  onSave,
  itemAmount = 0,
  initialTaxes = [],
  currency = 'USD'
}) => {
  // Company taxes from API
  const [companyTaxes, setCompanyTaxes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Selected taxes for this item
  const [selectedTaxes, setSelectedTaxes] = useState([]);

  // Add new tax form
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTaxName, setNewTaxName] = useState('');
  const [newTaxRate, setNewTaxRate] = useState('');
  const [saving, setSaving] = useState(false);

  // Fetch company taxes
  useEffect(() => {
    if (isOpen) {
      fetchTaxes();
      // Initialize selected taxes from props
      setSelectedTaxes(initialTaxes.map((tax, index) => ({
        ...tax,
        display_order: tax.display_order ?? index
      })));
    }
  }, [isOpen]);

  // Update selected taxes when initial taxes change
  useEffect(() => {
    if (isOpen && initialTaxes.length > 0) {
      setSelectedTaxes(initialTaxes.map((tax, index) => ({
        ...tax,
        display_order: tax.display_order ?? index
      })));
    }
  }, [initialTaxes, isOpen]);

  const fetchTaxes = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await taxesAPI.list();
      setCompanyTaxes(data || []);
    } catch (err) {
      console.error('Failed to fetch taxes:', err);
      setError('Failed to load taxes');
    } finally {
      setLoading(false);
    }
  };

  // Calculate tax amount for a given rate
  const calculateTaxAmount = (rate) => {
    return Math.round((itemAmount * rate / 100) * 100) / 100;
  };

  // Toggle a company tax
  const toggleTax = (companyTax) => {
    const existingIndex = selectedTaxes.findIndex(
      t => t.tax_name === companyTax.tax_name && t.tax_rate === parseFloat(companyTax.tax_rate)
    );

    if (existingIndex >= 0) {
      // Remove tax
      setSelectedTaxes(prev => prev.filter((_, i) => i !== existingIndex));
    } else {
      // Add tax
      const rate = parseFloat(companyTax.tax_rate);
      setSelectedTaxes(prev => [
        ...prev,
        {
          tax_name: companyTax.tax_name,
          tax_rate: rate,
          tax_amount: calculateTaxAmount(rate),
          display_order: prev.length
        }
      ]);
    }
  };

  // Check if a tax is selected
  const isTaxSelected = (companyTax) => {
    return selectedTaxes.some(
      t => t.tax_name === companyTax.tax_name && t.tax_rate === parseFloat(companyTax.tax_rate)
    );
  };

  // Add custom tax
  const handleAddCustomTax = () => {
    if (!newTaxName.trim() || !newTaxRate) return;

    const rate = parseFloat(newTaxRate);
    if (isNaN(rate) || rate < 0 || rate > 100) return;

    setSelectedTaxes(prev => [
      ...prev,
      {
        tax_name: newTaxName.trim(),
        tax_rate: rate,
        tax_amount: calculateTaxAmount(rate),
        display_order: prev.length
      }
    ]);

    setNewTaxName('');
    setNewTaxRate('');
    setShowAddForm(false);
  };

  // Add new company tax and select it
  const handleAddNewCompanyTax = async () => {
    if (!newTaxName.trim() || !newTaxRate) return;

    const rate = parseFloat(newTaxRate);
    if (isNaN(rate) || rate < 0 || rate > 100) return;

    try {
      setSaving(true);
      const newTax = await taxesAPI.create({
        tax_name: newTaxName.trim(),
        tax_rate: rate,
      });

      // Add to company taxes list
      setCompanyTaxes(prev => [...prev, newTax]);

      // Select the new tax
      setSelectedTaxes(prev => [
        ...prev,
        {
          tax_name: newTax.tax_name,
          tax_rate: parseFloat(newTax.tax_rate),
          tax_amount: calculateTaxAmount(parseFloat(newTax.tax_rate)),
          display_order: prev.length
        }
      ]);

      setNewTaxName('');
      setNewTaxRate('');
      setShowAddForm(false);
    } catch (err) {
      console.error('Failed to create tax:', err);
      setError(err.message || 'Failed to create tax');
    } finally {
      setSaving(false);
    }
  };

  // Remove selected tax
  const removeSelectedTax = (index) => {
    setSelectedTaxes(prev => {
      const updated = prev.filter((_, i) => i !== index);
      // Re-order remaining taxes
      return updated.map((tax, i) => ({ ...tax, display_order: i }));
    });
  };

  // Calculate total tax
  const totalTax = selectedTaxes.reduce((sum, tax) => sum + tax.tax_amount, 0);

  // Handle save
  const handleSave = () => {
    // Recalculate amounts before saving
    const taxesWithAmounts = selectedTaxes.map((tax, index) => ({
      tax_name: tax.tax_name,
      tax_rate: tax.tax_rate,
      tax_amount: calculateTaxAmount(tax.tax_rate),
      display_order: index
    }));
    onSave(taxesWithAmounts);
    onClose();
  };

  // Handle clear all
  const handleClearAll = () => {
    setSelectedTaxes([]);
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
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Add Taxes to Item
              </h3>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Item amount display */}
            <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Item Amount:</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(itemAmount)}
                </span>
              </div>
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
                <Loader2 className="h-6 w-6 animate-spin text-purple-600" />
              </div>
            ) : (
              <div className="space-y-4">
                {/* Company Taxes */}
                {companyTaxes.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Available Taxes
                    </label>
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {companyTaxes.map((tax) => (
                        <button
                          key={tax.id}
                          type="button"
                          onClick={() => toggleTax(tax)}
                          className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg border transition-colors ${
                            isTaxSelected(tax)
                              ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                              : 'border-gray-200 dark:border-gray-600 hover:border-purple-300 dark:hover:border-purple-500'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-4 h-4 rounded border flex items-center justify-center ${
                              isTaxSelected(tax)
                                ? 'bg-purple-600 border-purple-600'
                                : 'border-gray-300 dark:border-gray-500'
                            }`}>
                              {isTaxSelected(tax) && <Check className="h-3 w-3 text-white" />}
                            </div>
                            <span className="text-sm font-medium text-gray-900 dark:text-white">
                              {tax.tax_name}
                            </span>
                          </div>
                          <span className="text-sm text-gray-500 dark:text-gray-400">
                            {parseFloat(tax.tax_rate)}%
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Add New Tax */}
                {!showAddForm ? (
                  <button
                    type="button"
                    onClick={() => setShowAddForm(true)}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg text-gray-600 dark:text-gray-400 hover:border-purple-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors text-sm"
                  >
                    <Plus className="h-4 w-4" />
                    Add New Tax
                  </button>
                ) : (
                  <div className="p-3 border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        New Tax
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setShowAddForm(false);
                          setNewTaxName('');
                          setNewTaxRate('');
                        }}
                        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-2 mb-2">
                      <input
                        type="text"
                        value={newTaxName}
                        onChange={(e) => setNewTaxName(e.target.value)}
                        placeholder="Tax Name"
                        className="px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900 dark:text-white"
                      />
                      <div className="relative">
                        <input
                          type="number"
                          value={newTaxRate}
                          onChange={(e) => setNewTaxRate(e.target.value)}
                          placeholder="Rate"
                          min="0"
                          max="100"
                          step="0.01"
                          className="w-full px-3 py-2 pr-8 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900 dark:text-white"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">%</span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={handleAddCustomTax}
                        disabled={!newTaxName.trim() || !newTaxRate}
                        className="flex-1 px-3 py-1.5 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200 text-sm font-medium rounded-md hover:bg-gray-300 dark:hover:bg-gray-500 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Use Once
                      </button>
                      <button
                        type="button"
                        onClick={handleAddNewCompanyTax}
                        disabled={saving || !newTaxName.trim() || !newTaxRate}
                        className="flex-1 px-3 py-1.5 bg-purple-600 text-white text-sm font-medium rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1"
                      >
                        {saving ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <>
                            <Plus className="h-4 w-4" />
                            Save & Use
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}

                {/* Selected Taxes Summary */}
                {selectedTaxes.length > 0 && (
                  <div className="border-t border-gray-200 dark:border-gray-600 pt-4">
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Applied Taxes
                      </label>
                      <button
                        type="button"
                        onClick={handleClearAll}
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
                          <div className="flex items-center gap-2">
                            <GripVertical className="h-4 w-4 text-gray-400 cursor-grab" />
                            <span className="text-sm text-gray-900 dark:text-white">
                              {tax.tax_name} ({tax.tax_rate}%)
                            </span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-sm font-medium text-gray-900 dark:text-white">
                              {new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(tax.tax_amount)}
                            </span>
                            <button
                              type="button"
                              onClick={() => removeSelectedTax(index)}
                              className="text-red-500 hover:text-red-600"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Total */}
                    <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600 flex justify-between">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Total Tax:
                      </span>
                      <span className="text-sm font-bold text-gray-900 dark:text-white">
                        {new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(totalTax)}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="bg-gray-50 dark:bg-gray-900 px-6 py-4 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-md hover:bg-purple-700"
            >
              Apply Taxes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LineItemTaxModal;
