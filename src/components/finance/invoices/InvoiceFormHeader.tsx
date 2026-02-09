import React from 'react';
import { Calendar, ChevronDown } from 'lucide-react';
import DatePickerCalendar from '../../shared/DatePickerCalendar';
import ClientSelectModal from './ClientSelectModal';
import CurrencySelectModal from './CurrencySelectModal';

interface InvoiceFormHeaderProps {
  // Client
  contactId: string;
  contactsLoading: boolean;
  allContacts: any[];
  showClientModal: boolean;
  onSetShowClientModal: (value: boolean) => void;
  onClientSelect: (clientId: string) => void;
  clientButtonRef: React.RefObject<HTMLButtonElement | null>;

  // Invoice Number
  invoiceNumber: string;
  onInvoiceNumberChange: (value: string) => void;

  // Dates
  invoiceDate: string;
  onInvoiceDateChange: (value: string) => void;
  dueDate: string;
  onDueDateChange: (value: string) => void;

  // Currency
  currency: string;
  currencies: any[];
  currenciesLoading: boolean;
  showCurrencyModal: boolean;
  onSetShowCurrencyModal: (value: boolean) => void;
  onCurrencySelect: (currencyId: string) => void;
  currencyButtonRef: React.RefObject<HTMLButtonElement | null>;
}

const InvoiceFormHeader: React.FC<InvoiceFormHeaderProps> = ({
  contactId,
  contactsLoading,
  allContacts,
  showClientModal,
  onSetShowClientModal,
  onClientSelect,
  clientButtonRef,
  invoiceNumber,
  onInvoiceNumberChange,
  invoiceDate,
  onInvoiceDateChange,
  dueDate,
  onDueDateChange,
  currency,
  currencies,
  currenciesLoading,
  showCurrencyModal,
  onSetShowCurrencyModal,
  onCurrencySelect,
  currencyButtonRef,
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Client */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Client<span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <button
            ref={clientButtonRef as React.Ref<HTMLButtonElement>}
            type="button"
            onClick={() => onSetShowClientModal(true)}
            disabled={contactsLoading}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm text-left focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent hover:bg-gray-50 disabled:opacity-50 flex items-center justify-between"
          >
            <span className={contactId ? 'text-gray-900' : 'text-gray-500'}>
              {contactsLoading ? 'Loading clients...' : contactId ?
                (() => {
                  const client = allContacts.find((c: any) => c.id === contactId);
                  if (!client) return 'Select a Client';
                  const firstName = client.first_name?.trim() || '';
                  const lastName = client.last_name?.trim() || '';
                  const fullName = `${firstName} ${lastName}`.trim();
                  if (fullName && client.business_name) {
                    return `${fullName} (${client.business_name})`;
                  }
                  return fullName || client.business_name || 'Unnamed Client';
                })()
                : 'Select a Client'
              }
            </span>
            <ChevronDown className="h-4 w-4 text-gray-400" />
          </button>
          <ClientSelectModal
            isOpen={showClientModal}
            onClose={() => onSetShowClientModal(false)}
            clients={allContacts}
            selectedClientId={contactId}
            onSelect={onClientSelect}
            loading={contactsLoading}
            triggerRef={clientButtonRef}
          />
        </div>
      </div>

      {/* Invoice Number */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Invoice Number
        </label>
        <input
          type="text"
          value={invoiceNumber}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => onInvoiceNumberChange(e.target.value)}
          placeholder="INV-0001"
          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
        />
      </div>

      {/* Invoice Date */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Invoice Date<span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <DatePickerCalendar
            value={invoiceDate}
            onChange={(date) => onInvoiceDateChange(date)}
          />
          <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
        </div>
      </div>

      {/* Due Date */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Due Date<span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <DatePickerCalendar
            value={dueDate}
            onChange={(date) => onDueDateChange(date)}
          />
          <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
        </div>
      </div>

      {/* Currency */}
      <div className="md:col-span-2">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Currency<span className="text-red-500">*</span>
        </label>
        <div className="relative md:max-w-xs">
          <button
            ref={currencyButtonRef as React.Ref<HTMLButtonElement>}
            type="button"
            onClick={() => onSetShowCurrencyModal(true)}
            disabled={currenciesLoading}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm text-left focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent hover:bg-gray-50 disabled:opacity-50 flex items-center justify-between"
          >
            <span className={currency ? 'text-gray-900' : 'text-gray-500'}>
              {currenciesLoading ? 'Loading currencies...' : currency ?
                (() => {
                  const cc = currencies.find((c: any) => c.currency.id === currency);
                  if (!cc) return 'Select Currency';
                  return `${cc.currency.code} - ${cc.currency.name}`;
                })()
                : 'Select Currency'
              }
            </span>
            <ChevronDown className="h-4 w-4 text-gray-400" />
          </button>
          <CurrencySelectModal
            isOpen={showCurrencyModal}
            onClose={() => onSetShowCurrencyModal(false)}
            currencies={currencies}
            selectedCurrencyId={currency}
            onSelect={onCurrencySelect}
            loading={currenciesLoading}
            triggerRef={currencyButtonRef}
          />
        </div>
      </div>
    </div>
  );
};

export default InvoiceFormHeader;
