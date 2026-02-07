import React from 'react';
import { Loader2 } from 'lucide-react';
import { formatCurrency } from '../../../../utils/currency';
import type { InvoiceDetailData } from './InvoiceDetailTypes';

interface ChargeCardModalProps {
  invoice: InvoiceDetailData;
  chargeAmount: 'full' | 'deposit';
  chargingCard: boolean;
  onChargeAmountChange: (value: 'full' | 'deposit') => void;
  onConfirm: () => void;
  onClose: () => void;
}

const ChargeCardModal: React.FC<ChargeCardModalProps> = ({
  invoice,
  chargeAmount,
  chargingCard,
  onChargeAmountChange,
  onConfirm,
  onClose,
}) => {
  const currencyCode = invoice.currency?.code;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75 dark:bg-gray-900 dark:bg-opacity-75" onClick={() => !chargingCard && onClose()}></div>

        <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-md sm:w-full relative z-10">
          <div className="bg-white dark:bg-gray-800 px-6 pt-6 pb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Charge Saved Card
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
              This invoice has a deposit requested. How much would you like to charge?
            </p>

            <div className="space-y-3">
              {/* Deposit Only Option */}
              <label className={`flex items-center gap-3 p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                chargeAmount === 'deposit'
                  ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                  : 'border-gray-200 dark:border-gray-700 hover:border-purple-300'
              }`}>
                <input
                  type="radio"
                  name="chargeAmount"
                  value="deposit"
                  checked={chargeAmount === 'deposit'}
                  onChange={() => onChargeAmountChange('deposit')}
                  className="h-4 w-4 text-purple-600 focus:ring-purple-500"
                />
                <div className="flex-1">
                  <span className="text-sm font-medium text-gray-900 dark:text-white block">
                    Deposit Only
                  </span>
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {formatCurrency(parseFloat(String(invoice.deposit_amount || 0)), currencyCode)}
                    {invoice.deposit_percentage && parseFloat(invoice.deposit_percentage) > 0 &&
                      ` (${parseFloat(invoice.deposit_percentage)}%)`
                    }
                  </span>
                </div>
              </label>

              {/* Full Amount Option */}
              <label className={`flex items-center gap-3 p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                chargeAmount === 'full'
                  ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                  : 'border-gray-200 dark:border-gray-700 hover:border-purple-300'
              }`}>
                <input
                  type="radio"
                  name="chargeAmount"
                  value="full"
                  checked={chargeAmount === 'full'}
                  onChange={() => onChargeAmountChange('full')}
                  className="h-4 w-4 text-purple-600 focus:ring-purple-500"
                />
                <div className="flex-1">
                  <span className="text-sm font-medium text-gray-900 dark:text-white block">
                    Full Outstanding Balance
                  </span>
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {formatCurrency(parseFloat(String(invoice.outstanding_balance || 0)), currencyCode)}
                  </span>
                </div>
              </label>
            </div>
          </div>

          <div className="bg-gray-50 dark:bg-gray-900 px-6 py-4 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={chargingCard}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={onConfirm}
              disabled={chargingCard}
              className="px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700 disabled:opacity-50 flex items-center gap-2"
            >
              {chargingCard ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                `Charge ${formatCurrency(
                  chargeAmount === 'deposit'
                    ? parseFloat(String(invoice.deposit_amount || 0))
                    : parseFloat(String(invoice.outstanding_balance || 0)),
                  currencyCode
                )}`
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChargeCardModal;
