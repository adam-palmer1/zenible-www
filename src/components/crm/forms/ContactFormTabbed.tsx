import React, { useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormField, FormSelect, FormCheckbox, FormTextarea } from '../../ui/form';
import { contactSchema, getContactDefaultValues } from '../schemas/contactSchema';
import ChipSelector from '../../ui/ChipSelector';
import Combobox from '../../ui/combobox/Combobox';
import ConfirmationModal from '../../common/ConfirmationModal';
import CurrencySelectorModal from '../CurrencySelectorModal';
import contactsAPI from '../../../services/api/crm/contacts';
import contactPersonsAPI from '../../../services/api/crm/contactPersons';
import { useCountries } from '../../../hooks/crm/useCountries';
import { TrashIcon, PencilIcon, PlusIcon, ChevronDownIcon } from '@heroicons/react/24/outline';

interface ContactFormTabbedProps {
  contact?: any;
  initialStatus?: string | null;
  initialContactType?: string | null;
  allStatuses?: any[];
  companyCurrencies?: any[];
  companyTaxes?: any[];
  onSubmit: (data: any) => void;
  loading?: boolean;
  submitError?: string | null;
}

/**
 * Tabbed Contact form component using React Hook Form
 * Splits fields into logical tabs to prevent modal overflow
 */
const ContactFormTabbed: React.FC<ContactFormTabbedProps> = ({
  contact = null,
  initialStatus = null,
  initialContactType = null,
  allStatuses = [],
  companyCurrencies = [],
  companyTaxes = [],
  onSubmit,
  loading = false,
  submitError = null,
}) => {
  const [activeTab, setActiveTab] = useState('basic');

  // Get company countries for dropdown
  const { countries, companyCountries, defaultCountry, loading: countriesLoading } = useCountries();
  const defaultCountryId = defaultCountry?.country?.id || null;
  const [taxRates, setTaxRates] = useState(contact?.contact_taxes || []);
  const [showTaxDropdown, setShowTaxDropdown] = useState(false);
  const [taxLoading, setTaxLoading] = useState(false);
  const [taxError, setTaxError] = useState<string | null>(null);
  const taxDropdownRef = React.useRef<HTMLDivElement>(null);

  // Contact Persons state
  const [contactPersons, setContactPersons] = useState(contact?.contact_persons || []);
  const [newPerson, setNewPerson] = useState({ first_name: '', last_name: '', email: '' });
  const [editingPersonId, setEditingPersonId] = useState<string | null>(null);
  const [personLoading, setPersonLoading] = useState(false);
  const [personError, setPersonError] = useState<string | null>(null);
  const [showDeletePersonModal, setShowDeletePersonModal] = useState(false);
  const [personToDelete, setPersonToDelete] = useState<any>(null);

  // Currency selector state
  const [showCurrencyDropdown, setShowCurrencyDropdown] = useState(false);
  const currencyButtonRef = useRef<HTMLButtonElement>(null);
  const [showPreferredCurrencyDropdown, setShowPreferredCurrencyDropdown] = useState(false);
  const preferredCurrencyButtonRef = useRef<HTMLButtonElement>(null);

  // Get default currency (first currency marked as default or first in list)
  const defaultCurrency = companyCurrencies.find((cc: any) => cc.is_default) || companyCurrencies[0];
  const defaultCurrencyId = defaultCurrency?.currency?.id || null;

  const methods = useForm({
    resolver: zodResolver(contactSchema),
    defaultValues: getContactDefaultValues(contact, initialStatus, defaultCurrencyId, initialContactType, defaultCountryId),
  });

  const { watch, setValue, reset, formState: { errors } } = methods;

  // Reset form when contact changes (important for edit mode)
  React.useEffect(() => {
    reset(getContactDefaultValues(contact, initialStatus, defaultCurrencyId, initialContactType, defaultCountryId), {
      keepErrors: false,
      keepDirty: false,
      keepIsSubmitted: false,
    });
  }, [contact, initialStatus, defaultCurrencyId, initialContactType, defaultCountryId, reset]);

  // Auto-switch to tab with errors when validation fails
  React.useEffect(() => {
    if (Object.keys(errors).length > 0) {
      // Determine which tab has errors
      const errorFields = Object.keys(errors);
      const basicFields = ['first_name', 'last_name', 'business_name', 'email', 'country_code', 'phone'];
      const addressFields = ['address_line_1', 'address_line_2', 'city', 'state', 'postcode', 'country'];
      const additionalFields = ['is_client', 'is_vendor', 'current_global_status_id', 'current_custom_status_id', 'notes'];
      const financeFields = ['currency_id', 'preferred_currency_id', 'invoice_payment_terms', 'invoice_notes', 'hourly_rate', 'registration_number', 'tax_number', 'tax_id', 'vendor_type', 'default_payment_terms'];

      if (errorFields.some(field => basicFields.includes(field))) {
        setActiveTab('basic');
      } else if (errorFields.some(field => addressFields.includes(field))) {
        setActiveTab('address');
      } else if (errorFields.some(field => additionalFields.includes(field))) {
        setActiveTab('additional');
      } else if (errorFields.some(field => financeFields.includes(field))) {
        setActiveTab('finance');
      }
    }
  }, [errors]);
  const isClient = watch('is_client');
  const isVendor = watch('is_vendor');
  const currentGlobalStatusId = watch('current_global_status_id');
  const currentCustomStatusId = watch('current_custom_status_id');

  // Contact Type options
  const contactTypeOptions = [
    { value: 'client', label: 'Client' },
    { value: 'vendor', label: 'Vendor' },
  ];

  // Get selected contact types
  const getContactTypes = () => {
    const types: string[] = [];
    if (isClient) types.push('client');
    if (isVendor) types.push('vendor');
    return types;
  };

  // Handle contact type change
  const handleContactTypeChange = (types: string[]) => {
    setValue('is_client', types.includes('client'));
    setValue('is_vendor', types.includes('vendor'));
  };

  // Handle status selection
  const handleStatusChange = (statusId: string | null) => {
    if (statusId === null) {
      // Deselect - set both to null
      setValue('current_global_status_id', null);
      setValue('current_custom_status_id', null);
    } else {
      const selectedStatus = allStatuses.find((s: any) => s.id === statusId);
      if (selectedStatus) {
        const isCustom = selectedStatus.name.startsWith('custom_');
        setValue('current_global_status_id', isCustom ? null : selectedStatus.id);
        setValue('current_custom_status_id', isCustom ? selectedStatus.id : null);
      }
    }
  };

  // Get status options with colors
  const statusOptions = allStatuses.map((status: any) => ({
    value: status.id,
    label: status.friendly_name,
    color: status.color,
  }));

  // Get selected status ID
  const getSelectedStatusId = () => {
    return currentGlobalStatusId || currentCustomStatusId || null;
  };

  // Tax rate management functions - dropdown-based
  const handleAddTaxFromCompany = async (companyTax: any) => {
    if (!contact?.id) return;

    try {
      setTaxLoading(true);
      setTaxError(null);

      const taxData = {
        tax_name: companyTax.tax_name,
        tax_rate: companyTax.tax_rate,
        sort_order: taxRates.length,
      };

      const createdTax = await contactsAPI.addContactTax(contact.id, taxData);
      setTaxRates([...taxRates, createdTax]);
      setShowTaxDropdown(false);
    } catch (err: any) {
      console.error('Failed to add tax:', err);
      setTaxError(err.message);
    } finally {
      setTaxLoading(false);
    }
  };

  const handleDeleteTax = async (taxId: string) => {
    if (!contact?.id) return;

    try {
      setTaxLoading(true);
      setTaxError(null);

      await contactsAPI.deleteContactTax(contact.id, taxId);
      setTaxRates(taxRates.filter((tax: any) => tax.id !== taxId));
    } catch (err: any) {
      console.error('Failed to delete tax:', err);
      setTaxError(err.message);
    } finally {
      setTaxLoading(false);
    }
  };

  // Get available taxes (company taxes not already assigned to contact)
  const getAvailableTaxes = () => {
    const assignedTaxNames = taxRates.map((t: any) => t.tax_name.toLowerCase());
    return companyTaxes.filter((ct: any) => !assignedTaxNames.includes(ct.tax_name.toLowerCase()));
  };

  // Close dropdown when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (taxDropdownRef.current && !taxDropdownRef.current.contains(event.target as Node)) {
        setShowTaxDropdown(false);
      }
    };

    if (showTaxDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showTaxDropdown]);

  // Contact Person handlers
  const handleAddPerson = async () => {
    if (!contact?.id) return;

    if (!newPerson.first_name.trim() || !newPerson.email.trim()) {
      setPersonError('First name and email are required');
      return;
    }

    try {
      setPersonLoading(true);
      setPersonError(null);

      const personData = {
        first_name: newPerson.first_name,
        last_name: newPerson.last_name || null,
        email: newPerson.email,
        sort_order: contactPersons.length,
      };

      const createdPerson = await contactPersonsAPI.create(contact.id, personData);
      setContactPersons([...contactPersons, createdPerson]);
      setNewPerson({ first_name: '', last_name: '', email: '' });
    } catch (err: any) {
      console.error('Failed to add contact person:', err);
      setPersonError(err.message);
    } finally {
      setPersonLoading(false);
    }
  };

  const handleUpdatePerson = async (personId: string, updatedData: any) => {
    if (!contact?.id) return;

    try {
      setPersonLoading(true);
      setPersonError(null);

      await contactPersonsAPI.update(contact.id, personId, updatedData);
      setContactPersons(
        contactPersons.map((person: any) =>
          person.id === personId ? { ...person, ...updatedData } : person
        )
      );
      setEditingPersonId(null);
    } catch (err: any) {
      console.error('Failed to update contact person:', err);
      setPersonError(err.message);
    } finally {
      setPersonLoading(false);
    }
  };

  const handleDeletePerson = async () => {
    if (!contact?.id || !personToDelete) return;

    try {
      setPersonLoading(true);
      setPersonError(null);

      await contactPersonsAPI.delete(contact.id, personToDelete.id);
      setContactPersons(contactPersons.filter((person: any) => person.id !== personToDelete.id));
      setShowDeletePersonModal(false);
      setPersonToDelete(null);
    } catch (err: any) {
      console.error('Failed to delete contact person:', err);
      setPersonError(err.message);
    } finally {
      setPersonLoading(false);
    }
  };

  return (
    <Form methods={methods} onSubmit={onSubmit} className="space-y-4">
      {/* General Error */}
      {submitError && (
        <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-sm text-red-600 dark:text-red-400">{submitError}</p>
        </div>
      )}

      {/* Validation Errors Summary */}
      {Object.keys(errors).length > 0 && (
        <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
          <p className="text-sm font-medium text-yellow-800 dark:text-yellow-400 mb-1">
            Please fix the following errors:
          </p>
          <ul className="text-sm text-yellow-700 dark:text-yellow-300 list-disc list-inside space-y-1">
            {Object.entries(errors).map(([field, error]: [string, any]) => (
              <li key={field}>
                <span className="font-medium">{field.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}:</span> {error.message}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-gray-200 dark:border-gray-700 -mx-6 px-6">
        <button
          type="button"
          onClick={() => setActiveTab('basic')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'basic'
              ? 'border-zenible-primary text-zenible-primary'
              : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
          }`}
        >
          Basic Info
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('address')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'address'
              ? 'border-zenible-primary text-zenible-primary'
              : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
          }`}
        >
          Address
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('contacts')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'contacts'
              ? 'border-zenible-primary text-zenible-primary'
              : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
          }`}
        >
          Additional Contacts
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('additional')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'additional'
              ? 'border-zenible-primary text-zenible-primary'
              : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
          }`}
        >
          Type
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('finance')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'finance'
              ? 'border-zenible-primary text-zenible-primary'
              : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
          }`}
        >
          Finance
        </button>
      </div>

      {/* Tab Content */}
      <div className="min-h-[400px]">
        {activeTab === 'basic' && (
          <div className="space-y-4">
            {/* Name Fields */}
            <div className="grid grid-cols-2 gap-4">
              <FormField name="first_name" label="First Name" type="text" placeholder="John" />
              <FormField name="last_name" label="Last Name" type="text" placeholder="Doe" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <FormField name="business_name" label="Business Name" type="text" placeholder="Acme Corporation" />
              <FormField name="registration_number" label="Company Registration Number" type="text" placeholder="12345678" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <FormField name="email" label="Email" type="email" placeholder="john@example.com" />
              <div className="grid grid-cols-3 gap-2">
                <FormField name="country_code" label="Country Code" type="tel" placeholder="+44" />
                <FormField name="phone" label="Phone Number" type="tel" placeholder="7700 900000" className="col-span-2" />
              </div>
            </div>
            <FormTextarea name="notes" label="Notes" rows={3} placeholder="Additional notes about this contact..." />
          </div>
        )}

        {activeTab === 'address' && (
          <div className="space-y-4">
            <FormField name="address_line_1" label="Address Line 1" type="text" placeholder="123 Main Street" />
            <FormField name="address_line_2" label="Address Line 2" type="text" placeholder="Apt 4B" />
            <div className="grid grid-cols-2 gap-4">
              <FormField name="city" label="City" type="text" placeholder="London" />
              <FormField name="state" label="State/Province" type="text" placeholder="California" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <FormField name="postcode" label="Postcode" type="text" placeholder="SW1A 1AA" />
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Country</label>
                <Combobox
                  options={countries.map((c: any) => ({ id: c.id, label: c.name }))}
                  value={watch('country_id') || ''}
                  onChange={(value: any) => setValue('country_id', value || null)}
                  placeholder="Select country..."
                  searchPlaceholder="Search countries..."
                  loading={countriesLoading}
                  emptyMessage="No countries found"
                  allowClear
                />
                {errors.country_id && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{String(errors.country_id.message ?? '')}</p>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'contacts' && (
          <div className="space-y-4">
            {!contact?.id ? (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <p>Additional contacts can be added after saving the main contact.</p>
              </div>
            ) : (
              <>
                {personError && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-600">{personError}</p>
                  </div>
                )}
                {contactPersons.length > 0 && (
                  <div className="space-y-2">
                    <h3 className="text-sm font-medium text-gray-900 dark:text-gray-300">
                      Contact People ({contactPersons.length})
                    </h3>
                    {contactPersons.map((person: any) => (
                      <div key={person.id} className="p-3 border border-gray-200 dark:border-gray-600 rounded-lg">
                        {editingPersonId === person.id ? (
                          <div className="space-y-3">
                            <div className="grid grid-cols-2 gap-3">
                              <input type="text" defaultValue={person.first_name} placeholder="First Name *" id={`edit-first-${person.id}`} className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm" />
                              <input type="text" defaultValue={person.last_name || ''} placeholder="Last Name" id={`edit-last-${person.id}`} className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm" />
                            </div>
                            <input type="email" defaultValue={person.email} placeholder="Email *" id={`edit-email-${person.id}`} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm" />
                            <div className="flex gap-2">
                              <button
                                type="button"
                                onClick={() => {
                                  const firstName = (document.getElementById(`edit-first-${person.id}`) as HTMLInputElement).value;
                                  const lastName = (document.getElementById(`edit-last-${person.id}`) as HTMLInputElement).value;
                                  const email = (document.getElementById(`edit-email-${person.id}`) as HTMLInputElement).value;
                                  handleUpdatePerson(person.id, { first_name: firstName, last_name: lastName || null, email });
                                }}
                                className="px-3 py-1.5 bg-zenible-primary text-white rounded-lg text-sm hover:bg-opacity-90"
                                disabled={personLoading}
                              >
                                Save
                              </button>
                              <button type="button" onClick={() => setEditingPersonId(null)} className="px-3 py-1.5 bg-gray-200 text-gray-700 rounded-lg text-sm hover:bg-gray-300">Cancel</button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium text-gray-900 dark:text-white">{person.first_name} {person.last_name}</p>
                              <p className="text-sm text-gray-600 dark:text-gray-400">{person.email}</p>
                            </div>
                            <div className="flex gap-2">
                              <button type="button" onClick={() => setEditingPersonId(person.id)} className="p-1 text-gray-600 hover:text-zenible-primary" disabled={personLoading}><PencilIcon className="h-4 w-4" /></button>
                              <button type="button" onClick={() => { setPersonToDelete(person); setShowDeletePersonModal(true); }} className="p-1 text-gray-600 hover:text-red-600" disabled={personLoading}><TrashIcon className="h-4 w-4" /></button>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
                <div className="border-t border-gray-200 dark:border-gray-600 pt-4 mt-4">
                  <h3 className="text-sm font-medium text-gray-900 dark:text-gray-300 mb-3 flex items-center gap-2">
                    <PlusIcon className="h-4 w-4" />Add New Contact Person
                  </h3>
                  <div className="space-y-3" key={contactPersons.length}>
                    <div className="grid grid-cols-2 gap-3">
                      <input type="text" value={newPerson.first_name} onChange={(e) => setNewPerson({ ...newPerson, first_name: e.target.value })} placeholder="First Name *" className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-zenible-primary" />
                      <input type="text" value={newPerson.last_name} onChange={(e) => setNewPerson({ ...newPerson, last_name: e.target.value })} placeholder="Last Name" className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-zenible-primary" />
                    </div>
                    <input type="email" value={newPerson.email} onChange={(e) => setNewPerson({ ...newPerson, email: e.target.value })} placeholder="Email *" className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-zenible-primary" />
                    <button type="button" onClick={handleAddPerson} className="px-4 py-2 bg-zenible-primary text-white rounded-lg text-sm hover:bg-opacity-90 disabled:opacity-50 transition-opacity" disabled={personLoading || !newPerson.first_name.trim() || !newPerson.email.trim()}>
                      {personLoading ? 'Adding...' : 'Add Contact Person'}
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {activeTab === 'additional' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-900 dark:text-gray-300 mb-2">Contact type</label>
              <ChipSelector options={contactTypeOptions} value={getContactTypes()} onChange={(value: string | string[] | null) => handleContactTypeChange(Array.isArray(value) ? value : value ? [value] : [])} multiple={true} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-900 dark:text-gray-300 mb-2">Status</label>
              <ChipSelector options={statusOptions} value={getSelectedStatusId()} onChange={(value: string | string[] | null) => handleStatusChange(typeof value === 'string' ? value : Array.isArray(value) ? value[0] ?? null : null)} multiple={false} useColors={true} />
            </div>
          </div>
        )}

        {activeTab === 'finance' && (
          <div className="space-y-4">
            {companyCurrencies.length > 0 && (
              <div className="grid grid-cols-2 gap-4">
                <div className="relative">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Payment Currency</label>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Primary currency for invoices and payments</p>
                  <button
                    ref={currencyButtonRef}
                    type="button"
                    onClick={() => setShowCurrencyDropdown(!showCurrencyDropdown)}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-left flex items-center justify-between outline-none focus:border-zenible-primary focus:ring-1 focus:ring-zenible-primary cursor-pointer hover:border-gray-400 dark:hover:border-gray-500"
                  >
                    {(() => {
                      const selectedCurrency = companyCurrencies.find((cc: any) => cc.currency.id === watch('currency_id'));
                      if (selectedCurrency) {
                        return (
                          <div className="flex items-center gap-2">
                            <span className="text-gray-700 dark:text-gray-300 font-medium">{selectedCurrency.currency.symbol}</span>
                            <span className="text-gray-900 dark:text-white">{selectedCurrency.currency.code}</span>
                            {selectedCurrency.is_default && <span className="text-xs text-purple-600 dark:text-purple-400">(Default)</span>}
                          </div>
                        );
                      }
                      return <span className="text-gray-500 dark:text-gray-400">Select currency...</span>;
                    })()}
                    <ChevronDownIcon className={`h-4 w-4 text-gray-400 transition-transform ${showCurrencyDropdown ? 'rotate-180' : ''}`} />
                  </button>
                  <CurrencySelectorModal
                    isOpen={showCurrencyDropdown}
                    onClose={() => setShowCurrencyDropdown(false)}
                    onSelect={(currencyId: string) => setValue('currency_id', currencyId)}
                    selectedCurrencyId={watch('currency_id')}
                    currencies={companyCurrencies}
                    anchorRef={currencyButtonRef as React.RefObject<HTMLElement>}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Payment Terms (Days)</label>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Overrides company default payment terms</p>
                  <FormField name="invoice_payment_terms" type="number" placeholder="e.g., 30" min="0" max="365" />
                </div>
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Hourly Rate</label>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Override company default hourly rate for this contact</p>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400 text-sm">
                    {companyCurrencies.find((cc: any) => cc.currency.id === watch('currency_id'))?.currency?.symbol || defaultCurrency?.currency?.symbol || '\u00A3'}
                  </span>
                  <input type="number" step="0.01" min="0" {...methods.register('hourly_rate')} placeholder="e.g., 50.00" className="w-full pl-8 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-zenible-primary focus:border-zenible-primary bg-white dark:bg-gray-900 text-gray-900 dark:text-white" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tax ID</label>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Set the Tax ID for this contact</p>
                <FormField name="tax_id" type="text" placeholder="Tax identification number" />
              </div>
            </div>
            {watch('is_vendor') && (
              <div className="pb-4 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-sm font-medium text-gray-900 dark:text-gray-300 mb-3">Vendor Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <FormField name="vendor_type" label="Vendor Type" type="text" placeholder="e.g., Supplier, Contractor" />
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Default Payment Terms (Days)</label>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Payment terms for this vendor's invoices</p>
                    <FormField name="default_payment_terms" type="number" placeholder="e.g., 30" min="0" max="365" />
                  </div>
                </div>
              </div>
            )}
            {watch('is_vendor') && companyCurrencies.length > 0 && (
              <div className="relative">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Preferred Currency (Vendor)</label>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Vendor's preferred currency for payments</p>
                <button
                  ref={preferredCurrencyButtonRef}
                  type="button"
                  onClick={() => setShowPreferredCurrencyDropdown(!showPreferredCurrencyDropdown)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-left flex items-center justify-between outline-none focus:border-zenible-primary focus:ring-1 focus:ring-zenible-primary cursor-pointer hover:border-gray-400 dark:hover:border-gray-500"
                >
                  {(() => {
                    const selectedCurrency = companyCurrencies.find((cc: any) => cc.currency.id === watch('preferred_currency_id'));
                    if (selectedCurrency) {
                      return (
                        <div className="flex items-center gap-2">
                          <span className="text-gray-700 dark:text-gray-300 font-medium">{selectedCurrency.currency.symbol}</span>
                          <span className="text-gray-900 dark:text-white">{selectedCurrency.currency.code}</span>
                          {selectedCurrency.is_default && <span className="text-xs text-purple-600 dark:text-purple-400">(Default)</span>}
                        </div>
                      );
                    }
                    return <span className="text-gray-500 dark:text-gray-400">Select currency...</span>;
                  })()}
                  <ChevronDownIcon className={`h-4 w-4 text-gray-400 transition-transform ${showPreferredCurrencyDropdown ? 'rotate-180' : ''}`} />
                </button>
                <CurrencySelectorModal
                  isOpen={showPreferredCurrencyDropdown}
                  onClose={() => setShowPreferredCurrencyDropdown(false)}
                  onSelect={(currencyId: string) => setValue('preferred_currency_id', currencyId)}
                  selectedCurrencyId={watch('preferred_currency_id')}
                  currencies={companyCurrencies}
                  anchorRef={preferredCurrencyButtonRef as React.RefObject<HTMLElement>}
                />
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Invoice Notes</label>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Default notes to include on invoices for this contact</p>
              <FormTextarea name="invoice_notes" rows={4} placeholder="e.g., Please pay within 30 days to:&#10;Bank: ABC Bank&#10;Account: 12345678&#10;Sort Code: 12-34-56" />
            </div>
            <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Tax Rates</label>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">Select tax rates from your company defaults to apply to this contact's invoices</p>
              {taxError && (
                <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg mb-3">
                  <p className="text-sm text-red-600 dark:text-red-400">{taxError}</p>
                </div>
              )}
              {contact?.id ? (
                <>
                  {taxRates.length > 0 && (
                    <div className="space-y-2 mb-4">
                      {taxRates.map((tax: any) => (
                        <div key={tax.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                          <div className="flex-1">
                            <span className="text-sm font-medium text-gray-900 dark:text-white">{tax.tax_name}</span>
                            <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">{tax.tax_rate}%</span>
                          </div>
                          <button type="button" onClick={() => handleDeleteTax(tax.id)} disabled={taxLoading} className="p-1 text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors disabled:opacity-50" title="Remove tax">
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="relative" ref={taxDropdownRef}>
                    <button type="button" onClick={() => setShowTaxDropdown(!showTaxDropdown)} disabled={taxLoading || getAvailableTaxes().length === 0} className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-left flex items-center justify-between outline-none focus:border-zenible-primary focus:ring-1 focus:ring-zenible-primary cursor-pointer hover:border-gray-400 dark:hover:border-gray-500 disabled:opacity-50 disabled:cursor-not-allowed">
                      <span className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                        <PlusIcon className="h-4 w-4" />
                        {getAvailableTaxes().length === 0
                          ? (companyTaxes.length === 0 ? 'No company taxes configured' : 'All taxes assigned')
                          : 'Add tax rate...'}
                      </span>
                      <ChevronDownIcon className={`h-4 w-4 text-gray-400 transition-transform ${showTaxDropdown ? 'rotate-180' : ''}`} />
                    </button>
                    {showTaxDropdown && getAvailableTaxes().length > 0 && (
                      <div className="absolute z-50 mt-1 w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                        {getAvailableTaxes().map((tax: any) => (
                          <button key={tax.id} type="button" onClick={() => handleAddTaxFromCompany(tax)} className="w-full px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center justify-between border-b border-gray-100 dark:border-gray-700 last:border-b-0">
                            <span className="text-sm font-medium text-gray-900 dark:text-white">{tax.tax_name}</span>
                            <span className="text-sm text-gray-600 dark:text-gray-400">{tax.tax_rate}%</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  {companyTaxes.length === 0 && (
                    <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">Configure tax rates in Settings → Taxes to enable tax selection here.</p>
                  )}
                </>
              ) : (
                <p className="text-sm text-gray-500 dark:text-gray-400">Tax rates can be added after the contact is created.</p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Footer Buttons */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
        <button type="submit" disabled={loading} className="px-4 py-2 text-sm font-medium text-white bg-zenible-primary rounded-lg hover:bg-opacity-90 disabled:opacity-50 transition-colors">
          {loading ? 'Saving...' : contact ? 'Update Contact' : 'Create Contact'}
        </button>
      </div>

      {/* Delete Contact Person Confirmation Modal */}
      <ConfirmationModal
        isOpen={showDeletePersonModal}
        onClose={() => { setShowDeletePersonModal(false); setPersonToDelete(null); }}
        onConfirm={handleDeletePerson}
        title="Delete Contact Person?"
        message={
          <div>
            <p className="mb-2">Are you sure you want to delete {personToDelete ? `${personToDelete.first_name} ${personToDelete.last_name}` : 'this contact person'}?</p>
            <p className="text-sm text-red-600 dark:text-red-400 font-medium">Warning: This action cannot be undone.</p>
          </div>
        }
        confirmText="Delete"
        cancelText="Cancel"
        confirmColor="red"
        icon={TrashIcon}
        iconColor="text-red-600"
      />
    </Form>
  );
};

export default ContactFormTabbed;
