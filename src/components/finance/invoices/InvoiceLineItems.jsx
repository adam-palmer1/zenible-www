import React from 'react';
import { Trash2, Plus } from 'lucide-react';
import { formatCurrency } from '../../../utils/currency';
import { calculateLineItemTax } from '../../../utils/invoiceCalculations';

const InvoiceLineItems = ({
  items = [],
  onChange,
  currency = 'USD',
  taxRate = 0,
  discountType = 'percentage',
  discountValue = 0,
  readOnly = false,
}) => {
  const handleItemChange = (index, field, value) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };

    // Auto-calculate amount when quantity or price changes
    if (field === 'quantity' || field === 'price') {
      const quantity = field === 'quantity' ? parseFloat(value) || 0 : newItems[index].quantity;
      const price = field === 'price' ? parseFloat(value) || 0 : newItems[index].price;
      newItems[index].amount = quantity * price;
    }

    onChange(newItems);
  };

  const addItem = () => {
    onChange([
      ...items,
      {
        description: '',
        quantity: 1,
        price: 0,
        amount: 0,
      },
    ]);
  };

  const removeItem = (index) => {
    const newItems = [...items];
    if (newItems[index].id) {
      // Existing item - mark for deletion (backend will handle removal)
      newItems[index]._delete = true;
    } else {
      // New unsaved item - remove from array
      newItems.splice(index, 1);
    }
    onChange(newItems);
  };

  const calculateItemTax = (item) => {
    if (!taxRate) return 0;
    const amount = parseFloat(item.amount || 0);
    return calculateLineItemTax(amount, taxRate, discountType, discountValue);
  };

  const calculateItemTotal = (item) => {
    const tax = calculateItemTax(item);
    const amount = parseFloat(item.amount || 0);
    return amount + tax;
  };

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
              <th className="px-4 py-3 text-left text-xs font-medium design-text-secondary uppercase tracking-wider w-24">
                Quantity
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium design-text-secondary uppercase tracking-wider w-32">
                Price
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium design-text-secondary uppercase tracking-wider w-32">
                Amount
              </th>
              {taxRate > 0 && (
                <th className="px-4 py-3 text-left text-xs font-medium design-text-secondary uppercase tracking-wider w-24">
                  Tax
                </th>
              )}
              <th className="px-4 py-3 text-left text-xs font-medium design-text-secondary uppercase tracking-wider w-32">
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
              items.filter(item => !item._delete).map((item, index) => (
                <tr key={index} className="hover:design-bg-secondary transition-colors">
                  <td className="px-4 py-3">
                    {readOnly ? (
                      <span className="design-text-primary">{item.description || item.name}</span>
                    ) : (
                      <input
                        type="text"
                        value={item.description || ''}
                        onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                        placeholder="Item description"
                        className="w-full px-2 py-1 design-input rounded-md"
                      />
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {readOnly ? (
                      <span className="design-text-primary">{parseFloat(item.quantity || 0)}</span>
                    ) : (
                      <input
                        type="number"
                        value={item.quantity}
                        onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                        min="0"
                        step="0.01"
                        className="w-full px-2 py-1 design-input rounded-md"
                      />
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {readOnly ? (
                      <span className="design-text-primary">{formatCurrency(parseFloat(item.price || 0), currency)}</span>
                    ) : (
                      <input
                        type="number"
                        value={item.price}
                        onChange={(e) => handleItemChange(index, 'price', e.target.value)}
                        min="0"
                        step="0.01"
                        className="w-full px-2 py-1 design-input rounded-md"
                      />
                    )}
                  </td>
                  <td className="px-4 py-3 design-text-primary font-medium">
                    {formatCurrency(parseFloat(item.amount || 0), currency)}
                  </td>
                  {taxRate > 0 && (
                    <td className="px-4 py-3 design-text-secondary text-sm">
                      {formatCurrency(calculateItemTax(item), currency)}
                    </td>
                  )}
                  <td className="px-4 py-3 design-text-primary font-semibold">
                    {formatCurrency(calculateItemTotal(item), currency)}
                  </td>
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
    </div>
  );
};

export default InvoiceLineItems;
