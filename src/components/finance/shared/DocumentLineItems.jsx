import React, { useEffect, useRef } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { getCurrencySymbol } from '../../../utils/currencyUtils';
import { applyNumberFormat } from '../../../utils/numberFormatUtils';

/**
 * DocumentLineItems - Shared line items table for invoices and quotes
 *
 * Consolidates ~200 lines of duplicated code between InvoiceForm and QuoteForm
 */
const DocumentLineItems = ({
  items,
  currencyCode = 'USD',
  numberFormat = null,
  onAddItem,
  onUpdateItem,
  onRemoveItem,
  onOpenTaxModal,
  calculateItemTotal,
}) => {
  const formatNumber = (num) => applyNumberFormat(num, numberFormat);
  const symbol = getCurrencySymbol(currencyCode);
  const tableRef = useRef(null);

  // Auto-resize textareas when items change (for programmatically set values)
  useEffect(() => {
    if (tableRef.current) {
      const textareas = tableRef.current.querySelectorAll('.auto-grow-textarea');
      textareas.forEach((textarea) => {
        textarea.style.height = 'auto';
        textarea.style.height = textarea.scrollHeight + 'px';
      });
    }
  }, [items]);

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-900">Line Items</h3>
        <button
          onClick={onAddItem}
          className="inline-flex items-center gap-1 text-sm font-medium text-purple-600 hover:text-purple-700"
        >
          <Plus className="h-4 w-4" />
          Add Items
        </button>
      </div>

      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <table ref={tableRef} className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase w-28">Price</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase w-20">Qty</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase w-28">Amount</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase w-32">Total</th>
              <th className="px-4 py-3 w-12"></th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {items.length === 0 ? (
              <tr>
                <td colSpan="6" className="px-4 py-8 text-center text-sm text-gray-500">
                  No items added yet. Click "+ Add Items" to get started.
                </td>
              </tr>
            ) : (
              items.map((item, index) => (
                <tr key={item.id || index}>
                  <td className="px-4 py-3 align-top">
                    <div className="space-y-1">
                      <textarea
                        value={item.description}
                        onChange={(e) => {
                          onUpdateItem(index, 'description', e.target.value);
                          e.target.style.height = 'auto';
                          e.target.style.height = e.target.scrollHeight + 'px';
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                          }
                        }}
                        placeholder="Item description"
                        rows={1}
                        autoComplete="off"
                        className="auto-grow-textarea w-full px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-purple-500 resize-none bg-transparent"
                        style={{ minHeight: '24px' }}
                      />
                      <textarea
                        value={item.subtext || ''}
                        onChange={(e) => {
                          onUpdateItem(index, 'subtext', e.target.value);
                          e.target.style.height = 'auto';
                          e.target.style.height = e.target.scrollHeight + 'px';
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                          }
                        }}
                        placeholder="Additional details (optional)"
                        maxLength={500}
                        rows={1}
                        autoComplete="off"
                        className="auto-grow-textarea w-full px-2 py-1 text-xs text-gray-500 focus:outline-none focus:ring-1 focus:ring-purple-500 resize-none bg-transparent"
                        style={{ minHeight: '20px' }}
                      />
                    </div>
                  </td>
                  <td className="px-4 py-3 align-top">
                    <input
                      type="number"
                      value={item.price === 0 || item.price === '0' ? '' : item.price}
                      onChange={(e) => onUpdateItem(index, 'price', e.target.value)}
                      min="0"
                      step="0.01"
                      placeholder="0"
                      autoComplete="off"
                      className="w-full px-2 py-1 text-sm text-right focus:outline-none focus:ring-1 focus:ring-purple-500 bg-transparent"
                    />
                  </td>
                  <td className="px-4 py-3 align-top">
                    <input
                      type="number"
                      value={item.quantity}
                      onChange={(e) => onUpdateItem(index, 'quantity', e.target.value)}
                      min="0"
                      step="1"
                      autoComplete="off"
                      className="w-full px-2 py-1 text-sm text-center focus:outline-none focus:ring-1 focus:ring-purple-500 bg-transparent"
                    />
                  </td>
                  <td className="px-4 py-3 align-top">
                    <div className="pt-1">
                      <div className="text-sm font-medium text-gray-900">
                        {symbol}{formatNumber(item.amount)}
                      </div>
                      <button
                        type="button"
                        onClick={() => onOpenTaxModal(index)}
                        className="text-xs text-purple-600 hover:text-purple-700 font-medium"
                      >
                        {item.taxes && item.taxes.length > 0 ? 'Edit Tax' : '+ Tax'}
                      </button>
                    </div>
                  </td>
                  <td className="px-4 py-3 align-top">
                    <div className="pt-1">
                      <div className="text-sm font-semibold text-gray-900">
                        {symbol}{formatNumber(calculateItemTotal(item))}
                      </div>
                      {item.taxes && item.taxes.length > 0 && (
                        <div className="mt-0.5">
                          {item.taxes.map((tax, taxIndex) => (
                            <div key={taxIndex} className="text-xs text-gray-500">
                              {tax.tax_name}: {symbol}{formatNumber(tax.tax_amount)}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 align-top">
                    <div className="pt-1">
                      <button
                        onClick={() => onRemoveItem(index)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default DocumentLineItems;
