import React from 'react';
import { formatCurrency } from '../../../../utils/currency';

export interface InvoiceLineItemsTableProps {
  items: any[];
  hasTax: boolean;
  currencyCode: string;
}

const InvoiceLineItemsTable: React.FC<InvoiceLineItemsTableProps> = ({ items, hasTax, currencyCode }) => {
  return (
    <div className="flex flex-col gap-3">
      <p className="text-[16px] font-bold leading-[24px] text-[#09090b]">
        Invoice Details
      </p>

      {/* Table */}
      <div className="w-full overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-y border-[#e5e5e5]">
              <th className="px-3 py-4 text-left text-[14px] font-medium leading-[22px] text-[#71717a]">
                Description
              </th>
              <th className="px-3 py-4 text-left text-[14px] font-medium leading-[22px] text-[#71717a] w-[98px]">
                Quantity
              </th>
              <th className="px-3 py-4 text-left text-[14px] font-medium leading-[22px] text-[#71717a] w-[98px]">
                Price
              </th>
              <th className="px-3 py-4 text-left text-[14px] font-medium leading-[22px] text-[#71717a] w-[95px]">
                Amount
              </th>
              {hasTax && (
                <th className="px-3 py-4 text-left text-[14px] font-medium leading-[22px] text-[#71717a] w-[98px]">
                  Tax
                </th>
              )}
              <th className="px-3 py-4 text-left text-[14px] font-medium leading-[22px] text-[#71717a] w-[95px]">
                Total
              </th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td colSpan={hasTax ? 6 : 5} className="px-3 py-8 text-center text-[14px] text-[#71717a]">
                  No items
                </td>
              </tr>
            ) : (
              items.map((item: any, index: number) => {
                const itemAmount = parseFloat(item.amount || 0);
                const itemTaxAmount = item.taxes?.reduce((sum: number, t: any) => sum + (t.tax_amount || 0), 0) || 0;
                const itemTotal = itemAmount + itemTaxAmount;

                return (
                  <tr key={index} className="border-b border-[#e5e5e5] bg-white">
                    <td className="px-3 py-4">
                      <div>
                        <span className="text-[14px] font-normal leading-[22px] text-[#09090b] whitespace-pre-line">
                          {item.description || item.name}
                        </span>
                        {item.subtext && (
                          <p className="text-[12px] text-[#71717a] mt-0.5 whitespace-pre-line">{item.subtext}</p>
                        )}
                      </div>
                    </td>
                    <td className="px-3 py-4 text-[14px] font-normal leading-[22px] text-[#09090b]">
                      {parseFloat(item.quantity || 0)}
                    </td>
                    <td className="px-3 py-4 text-[14px] font-normal leading-[22px] text-[#09090b]">
                      {formatCurrency(parseFloat(item.price || item.unit_price || 0), currencyCode)}
                    </td>
                    <td className="px-3 py-4 text-[14px] font-normal leading-[22px] text-[#09090b]">
                      {formatCurrency(itemAmount, currencyCode)}
                    </td>
                    {hasTax && (
                      <td className="px-3 py-4 text-[14px] font-normal leading-[22px] text-[#09090b]">
                        {formatCurrency(itemTaxAmount, currencyCode)}
                      </td>
                    )}
                    <td className="px-3 py-4 text-[14px] font-normal leading-[22px] text-[#09090b]">
                      {formatCurrency(itemTotal, currencyCode)}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default InvoiceLineItemsTable;
