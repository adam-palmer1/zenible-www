import React, { useState, useEffect } from 'react';
import { Trash2, Plus } from 'lucide-react';
import { formatCurrency } from '../../../utils/currency';
import LineItemTaxModal from '../shared/LineItemTaxModal';

interface InvoiceLineItemsProps {
  items?: any[];
  onChange: (items: any[]) => void;
  currency?: string;
  taxRate?: number;
  discountType?: string;
  discountValue?: number;
  readOnly?: boolean;
}

const InvoiceLineItems: React.FC<InvoiceLineItemsProps> = ({
  items = [],
  onChange,
  currency = 'USD',
  taxRate: _taxRate = 0,
  discountType: _discountType = 'percentage',
  discountValue: _discountValue = 0,
  readOnly = false,
}) => {
  const [taxModalOpen, setTaxModalOpen] = useState(false);
  const [editingItemIndex, setEditingItemIndex] = useState<number | null>(null);

  const handleItemChange = (index: number, field: string, value: any) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };

    // Auto-calculate amount when quantity or price changes
    if (field === 'quantity' || field === 'price') {
      const quantity = field === 'quantity' ? parseFloat(value) || 0 : parseFloat(newItems[index].quantity) || 0;
      const price = field === 'price' ? parseFloat(value) || 0 : parseFloat(newItems[index].price) || 0;
      newItems[index].amount = quantity * price;

      // Recalculate tax amounts if taxes exist
      if (newItems[index].taxes && newItems[index].taxes.length > 0) {
        const itemAmount = quantity * price;
        newItems[index].taxes = newItems[index].taxes.map((tax: any, i: number) => ({
          ...tax,
          tax_amount: Math.round((itemAmount * tax.tax_rate / 100) * 100) / 100,
          display_order: i
        }));
        newItems[index].tax_amount = newItems[index].taxes.reduce((sum: number, t: any) => sum + t.tax_amount, 0);
      }
    }

    onChange(newItems);
  };

  const addItem = () => {
    onChange([
      ...items,
      {
        description: '',
        name: '',
        subtext: '',
        quantity: 1,
        price: 0,
        amount: 0,
        taxes: [],
        tax_amount: 0,
      },
    ]);
  };

  const removeItem = (index: number) => {
    onChange(items.filter((_: any, i: number) => i !== index));
  };

  // Open tax modal for a specific item
  const handleOpenTaxModal = (index: number) => {
    setEditingItemIndex(index);
    setTaxModalOpen(true);
  };

  // Handle tax modal save
  const handleTaxSave = (taxes: any[]) => {
    if (editingItemIndex === null) return;

    const newItems = [...items];
    const item = newItems[editingItemIndex];

    // Update item with new taxes
    newItems[editingItemIndex] = {
      ...item,
      taxes: taxes,
      tax_amount: taxes.reduce((sum: number, t: any) => sum + t.tax_amount, 0)
    };

    onChange(newItems);
    setTaxModalOpen(false);
    setEditingItemIndex(null);
  };

  // Calculate item total (amount + item taxes)
  const calculateItemTotal = (item: any) => {
    const amount = parseFloat(item.amount || 0);
    const taxAmount = item.taxes?.reduce((sum: number, t: any) => sum + (Number(t.tax_amount) || 0), 0) || 0;
    return amount + taxAmount;
  };

  // Auto-resize textareas when items are loaded or changed
  useEffect(() => {
    const timer = setTimeout(() => {
      const textareas = document.querySelectorAll('.auto-grow-textarea');
      textareas.forEach(textarea => {
        (textarea as HTMLTextAreaElement).style.height = 'auto';
        (textarea as HTMLTextAreaElement).style.height = (textarea as HTMLTextAreaElement).scrollHeight + 'px';
      });
    }, 50);
    return () => clearTimeout(timer);
  }, [items]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium design-text-primary">
          Line Items
        </label>
        {!readOnly && (
          <button
            type="button"
            onClick={addItem}
            className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-zenible-primary hover:bg-zenible-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-zenible-primary"
          >
            <Plus className="h-4 w-4 mr-1" />
            Add Item
          </button>
        )}
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y design-divide">
          <thead className="design-bg-secondary">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium design-text-secondary uppercase tracking-wider">
                Description
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium design-text-secondary uppercase tracking-wider w-32">
                Price
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium design-text-secondary uppercase tracking-wider w-24">
                Qty
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium design-text-secondary uppercase tracking-wider w-32">
                Amount
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium design-text-secondary uppercase tracking-wider w-36">
                Total
              </th>
              {!readOnly && (
                <th className="px-4 py-3 w-12"></th>
              )}
            </tr>
          </thead>
          <tbody className="design-bg-primary divide-y design-divide">
            {items.length === 0 ? (
              <tr>
                <td colSpan={readOnly ? 5 : 6} className="px-4 py-8 text-center design-text-secondary">
                  {readOnly ? 'No items' : 'No items added yet. Click "Add Item" to get started.'}
                </td>
              </tr>
            ) : (
              items.map((item: any, index: number) => (
                <tr key={index} className="hover:design-bg-secondary transition-colors">
                  {/* Description */}
                  <td className="px-4 py-3">
                    {readOnly ? (
                      <div>
                        <span className="text-[#09090b] dark:text-white">{item.description || item.name}</span>
                        {item.subtext && (
                          <p className="text-xs text-[#71717a] dark:text-gray-400 mt-0.5 whitespace-pre-line">{item.subtext}</p>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-1">
                        <textarea
                          value={item.description || item.name || ''}
                          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => {
                            handleItemChange(index, 'description', e.target.value);
                            e.target.style.height = 'auto';
                            e.target.style.height = e.target.scrollHeight + 'px';
                          }}
                          onKeyDown={(e: React.KeyboardEvent<HTMLTextAreaElement>) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                              e.preventDefault();
                            }
                          }}
                          placeholder="Item description"
                          rows={1}
                          className="auto-grow-textarea w-full px-2 py-1 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-purple-500 resize-none bg-transparent"
                          style={{ minHeight: '24px' }}
                        />
                        <textarea
                          value={item.subtext || ''}
                          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => {
                            handleItemChange(index, 'subtext', e.target.value);
                            e.target.style.height = 'auto';
                            e.target.style.height = e.target.scrollHeight + 'px';
                          }}
                          onKeyDown={(e: React.KeyboardEvent<HTMLTextAreaElement>) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                              e.preventDefault();
                            }
                          }}
                          placeholder="Additional details (optional)"
                          maxLength={500}
                          rows={1}
                          className="auto-grow-textarea w-full px-2 py-1 text-xs text-gray-500 dark:text-gray-400 focus:outline-none focus:ring-1 focus:ring-purple-500 resize-none bg-transparent"
                          style={{ minHeight: '20px' }}
                        />
                      </div>
                    )}
                  </td>

                  {/* Price */}
                  <td className="px-4 py-3">
                    {readOnly ? (
                      <span className="design-text-primary">{formatCurrency(parseFloat(item.price || item.unit_price || 0), currency)}</span>
                    ) : (
                      <input
                        type="number"
                        value={item.price ?? item.unit_price ?? ''}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleItemChange(index, 'price', e.target.value)}
                        min="0"
                        step="0.01"
                        className="w-full px-2 py-1 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-purple-500 bg-transparent"
                      />
                    )}
                  </td>

                  {/* Quantity */}
                  <td className="px-4 py-3">
                    {readOnly ? (
                      <span className="design-text-primary">{parseFloat(item.quantity || 0)}</span>
                    ) : (
                      <input
                        type="number"
                        value={item.quantity ?? ''}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleItemChange(index, 'quantity', e.target.value)}
                        min="0"
                        step="1"
                        className="w-full px-2 py-1 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-purple-500 bg-transparent text-center"
                      />
                    )}
                  </td>

                  {/* Amount (subtotal before tax) */}
                  <td className="px-4 py-3">
                    <div className="design-text-primary">
                      {formatCurrency(parseFloat(item.amount || 0), currency)}
                    </div>
                    {/* +Tax button */}
                    {!readOnly && (
                      <button
                        type="button"
                        onClick={() => handleOpenTaxModal(index)}
                        className="text-xs text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300 font-medium"
                      >
                        {item.taxes && item.taxes.length > 0 ? 'Edit Tax' : '+ Tax'}
                      </button>
                    )}
                  </td>

                  {/* Total (with taxes) */}
                  <td className="px-4 py-3">
                    <div>
                      <div className="font-semibold design-text-primary">
                        {formatCurrency(calculateItemTotal(item), currency)}
                      </div>

                      {/* Item taxes display */}
                      {item.taxes && item.taxes.length > 0 && (
                        <div className="mt-0.5">
                          {item.taxes.map((tax: any, taxIndex: number) => (
                            <div key={taxIndex} className="text-xs text-gray-500 dark:text-gray-400">
                              {tax.tax_name}: {formatCurrency(tax.tax_amount, currency)}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </td>

                  {/* Remove button */}
                  {!readOnly && (
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() => removeItem(index)}
                        className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                        title="Remove item"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Line Item Tax Modal */}
      <LineItemTaxModal
        isOpen={taxModalOpen}
        onClose={() => {
          setTaxModalOpen(false);
          setEditingItemIndex(null);
        }}
        onSave={handleTaxSave}
        itemAmount={editingItemIndex !== null ? parseFloat(items[editingItemIndex]?.amount || 0) : 0}
        initialTaxes={editingItemIndex !== null ? (items[editingItemIndex]?.taxes || []) : []}
        currency={currency}
      />
    </div>
  );
};

export default InvoiceLineItems;
