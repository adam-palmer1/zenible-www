import React, { useState, useEffect } from 'react';
import { X, Plus, Check, Loader2 } from 'lucide-react';
import companiesAPI from '../../../services/api/crm/companies';

const companiesAPIAny = companiesAPI as any;

interface TaxItem {
  tax_name: string;
  tax_rate: number;
  id?: string;
}

interface TaxModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (taxes: TaxItem[]) => void;
  initialDocumentTaxes?: TaxItem[];
}

const TaxModal: React.FC<TaxModalProps> = ({ isOpen, onClose, onSave, initialDocumentTaxes = [] }) => {
  // Extract first tax from array for backwards compatibility
  const initialTax = initialDocumentTaxes[0] || ({} as any);
  const [taxRate, setTaxRate] = useState(parseFloat(initialTax.tax_rate) || 0);
  const [taxLabel, setTaxLabel] = useState(initialTax.tax_name || 'Tax');
  const [companyTaxes, setCompanyTaxes] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTaxName, setNewTaxName] = useState('');
  const [newTaxRate, setNewTaxRate] = useState('');
  const [saving, setSaving] = useState(false);

  // Fetch company taxes when modal opens
  useEffect(() => {
    if (isOpen) {
      const tax = initialDocumentTaxes[0] || ({} as any);
      setTaxRate(parseFloat(tax.tax_rate) || 0);
      setTaxLabel(tax.tax_name || 'Tax');
      setShowAddForm(false);
      setNewTaxName('');
      setNewTaxRate('');
      loadCompanyTaxes();
    }
  }, [isOpen, initialDocumentTaxes]);

  const loadCompanyTaxes = async () => {
    try {
      setLoading(true);
      const taxes = await companiesAPIAny.listTaxes();
      setCompanyTaxes(taxes || []);
    } catch (error: any) {
      console.error('Failed to load company taxes:', error);
      setCompanyTaxes([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectTax = (tax: any) => {
    setTaxRate(parseFloat(tax.tax_rate));
    setTaxLabel(tax.tax_name);
    setShowAddForm(false);
  };

  const handleSave = () => {
    if (taxRate < 0 || taxRate > 100) {
      alert('Tax rate must be between 0 and 100');
      return;
    }
    // Return as document_taxes array format
    onSave([{ tax_name: taxLabel, tax_rate: taxRate }]);
    onClose();
  };

  const handleRemove = () => {
    // Return empty array to remove all document taxes
    onSave([]);
    onClose();
  };

  const handleAddNewTax = async () => {
    if (!newTaxName.trim()) {
      alert('Please enter a tax name');
      return;
    }
    const rate = parseFloat(newTaxRate);
    if (isNaN(rate) || rate < 0 || rate > 100) {
      alert('Tax rate must be between 0 and 100');
      return;
    }

    try {
      setSaving(true);
      const newTax = await companiesAPIAny.createTax({
        tax_name: newTaxName.trim(),
        tax_rate: rate,
      });

      // Add to local list and select it
      setCompanyTaxes(prev => [...prev, newTax]);
      setTaxRate(rate);
      setTaxLabel(newTaxName.trim());
      setShowAddForm(false);
      setNewTaxName('');
      setNewTaxRate('');
    } catch (error: any) {
      console.error('Failed to create tax:', error);
      alert(error.message || 'Failed to create tax');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75 dark:bg-gray-900 dark:bg-opacity-75" onClick={onClose}></div>

        <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full relative z-10">
          <div className="bg-white dark:bg-gray-800 px-6 pt-6 pb-4">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                {initialDocumentTaxes.length > 0 ? 'Edit Tax' : 'Add Tax'}
              </h3>
              <button
                onClick={onClose}
                className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Company Saved Taxes */}
              <div>
                <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                  Select Tax
                </label>

                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-purple-600" />
                  </div>
                ) : companyTaxes.length === 0 && !showAddForm ? (
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
                ) : (
                  <div className="space-y-2">
                    {companyTaxes.map((tax: any) => {
                      const isSelected = taxRate === parseFloat(tax.tax_rate) && taxLabel === tax.tax_name;
                      return (
                        <button
                          key={tax.id}
                          type="button"
                          onClick={() => handleSelectTax(tax)}
                          className={`w-full flex items-center justify-between px-4 py-3 rounded-lg border transition-colors ${
                            isSelected
                              ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                              : 'border-gray-200 dark:border-gray-700 hover:border-purple-300 dark:hover:border-purple-600'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                              isSelected
                                ? 'border-purple-500 bg-purple-500'
                                : 'border-gray-300 dark:border-gray-600'
                            }`}>
                              {isSelected && <Check className="h-3 w-3 text-white" />}
                            </div>
                            <span className={`font-medium ${
                              isSelected
                                ? 'text-purple-700 dark:text-purple-400'
                                : 'text-gray-900 dark:text-white'
                            }`}>
                              {tax.tax_name}
                            </span>
                          </div>
                          <span className={`text-sm ${
                            isSelected
                              ? 'text-purple-600 dark:text-purple-400'
                              : 'text-gray-500 dark:text-gray-400'
                          }`}>
                            {tax.tax_rate}%
                          </span>
                        </button>
                      );
                    })}

                    {/* Add New Tax Button */}
                    {!showAddForm && (
                      <button
                        type="button"
                        onClick={() => setShowAddForm(true)}
                        className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg border border-dashed border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:border-purple-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
                      >
                        <Plus className="h-4 w-4" />
                        Add New Tax
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Add New Tax Form */}
              {showAddForm && (
                <div className="border border-purple-200 dark:border-purple-800 rounded-lg p-4 bg-purple-50 dark:bg-purple-900/20">
                  <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
                    Create New Tax
                  </h4>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Tax Name
                      </label>
                      <input
                        type="text"
                        value={newTaxName}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewTaxName(e.target.value)}
                        placeholder="e.g., VAT, GST, Sales Tax"
                        className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500 rounded-md text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Tax Rate (%)
                      </label>
                      <input
                        type="number"
                        value={newTaxRate}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewTaxRate(e.target.value)}
                        placeholder="e.g., 20"
                        min="0"
                        max="100"
                        step="0.01"
                        className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500 rounded-md text-sm"
                      />
                    </div>
                    <div className="flex items-center gap-2 pt-1">
                      <button
                        type="button"
                        onClick={handleAddNewTax}
                        disabled={saving}
                        className="flex-1 px-3 py-2 text-sm font-medium text-white bg-purple-600 rounded-md hover:bg-purple-700 disabled:opacity-50 inline-flex items-center justify-center gap-2"
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
                      <button
                        type="button"
                        onClick={() => {
                          setShowAddForm(false);
                          setNewTaxName('');
                          setNewTaxRate('');
                        }}
                        className="px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Preview */}
              {taxRate > 0 && (
                <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 dark:text-gray-300 text-sm">Selected:</span>
                    <span className="text-gray-900 dark:text-white font-medium">
                      {taxLabel} ({taxRate}%)
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="bg-gray-50 dark:bg-gray-900 px-6 py-4 flex justify-between gap-3">
            {initialDocumentTaxes.length > 0 && (
              <button
                type="button"
                onClick={handleRemove}
                className="px-4 py-2 text-sm font-medium text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
              >
                Remove Tax
              </button>
            )}
            <div className="flex gap-3 ml-auto">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-900 dark:text-white bg-gray-200 dark:bg-gray-700 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={taxRate === 0}
                className="px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Apply Tax
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TaxModal;
