import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormField, FormSelect, FormCheckbox, FormTextarea } from '../../ui/form';
import { contactSchema, getContactDefaultValues } from '../schemas/contactSchema';
import ChipSelector from '../../ui/ChipSelector';
import Combobox from '../../ui/combobox/Combobox';
import ConfirmationModal from '../../common/ConfirmationModal';
import contactsAPI from '../../../services/api/crm/contacts';
import contactPersonsAPI from '../../../services/api/crm/contactPersons';
import { useCountries } from '../../../hooks/crm/useCountries';
import { TrashIcon, PencilIcon, PlusIcon } from '@heroicons/react/24/outline';

/**
 * Tabbed Contact form component using React Hook Form
 * Splits fields into logical tabs to prevent modal overflow
 *
 * @param {Object} props
 * @param {Object} props.contact - Existing contact data (for edit mode)
 * @param {string} props.initialStatus - Initial status ID (for new contacts)
 * @param {string} props.initialContactType - Initial contact type ('client' | 'vendor' | null)
 * @param {Array} props.allStatuses - All available statuses
 * @param {Array} props.companyCurrencies - Available company currencies (for Finance tab)
 * @param {Function} props.onSubmit - Form submit handler
 * @param {boolean} props.loading - Whether form is submitting
 * @param {string} props.submitError - General submit error message
 */
const ContactFormTabbed = ({
  contact = null,
  initialStatus = null,
  initialContactType = null,
  allStatuses = [],
  companyCurrencies = [],
  onSubmit,
  loading = false,
  submitError = null,
}) => {
  const [activeTab, setActiveTab] = useState('basic');

  // Get company countries for dropdown
  const { companyCountries, loading: countriesLoading } = useCountries();
  const [taxRates, setTaxRates] = useState(contact?.contact_taxes || []);
  const [newTax, setNewTax] = useState({ tax_name: '', tax_rate: '' });
  const [editingTaxId, setEditingTaxId] = useState(null);
  const [taxLoading, setTaxLoading] = useState(false);
  const [taxError, setTaxError] = useState(null);

  // Contact Persons state
  const [contactPersons, setContactPersons] = useState(contact?.contact_persons || []);
  const [newPerson, setNewPerson] = useState({ first_name: '', last_name: '', email: '' });
  const [editingPersonId, setEditingPersonId] = useState(null);
  const [personLoading, setPersonLoading] = useState(false);
  const [personError, setPersonError] = useState(null);
  const [showDeletePersonModal, setShowDeletePersonModal] = useState(false);
  const [personToDelete, setPersonToDelete] = useState(null);

  // Get default currency (first currency marked as default or first in list)
  const defaultCurrency = companyCurrencies.find(cc => cc.is_default) || companyCurrencies[0];
  const defaultCurrencyId = defaultCurrency?.currency?.id || null;

  const methods = useForm({
    resolver: zodResolver(contactSchema),
    defaultValues: getContactDefaultValues(contact, initialStatus, defaultCurrencyId, initialContactType),
  });

  const { watch, setValue, reset, formState: { errors } } = methods;

  // Reset form when contact changes (important for edit mode)
  React.useEffect(() => {
    reset(getContactDefaultValues(contact, initialStatus, defaultCurrencyId, initialContactType), {
      keepErrors: false,
      keepDirty: false,
      keepIsSubmitted: false,
    });
  }, [contact, initialStatus, defaultCurrencyId, initialContactType, reset]);

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
    const types = [];
    if (isClient) types.push('client');
    if (isVendor) types.push('vendor');
    return types;
  };

  // Handle contact type change
  const handleContactTypeChange = (types) => {
    setValue('is_client', types.includes('client'));
    setValue('is_vendor', types.includes('vendor'));
  };

  // Handle status selection
  const handleStatusChange = (statusId) => {
    if (statusId === null) {
      // Deselect - set both to null
      setValue('current_global_status_id', null);
      setValue('current_custom_status_id', null);
    } else {
      const selectedStatus = allStatuses.find((s) => s.id === statusId);
      if (selectedStatus) {
        const isCustom = selectedStatus.name.startsWith('custom_');
        setValue('current_global_status_id', isCustom ? null : selectedStatus.id);
        setValue('current_custom_status_id', isCustom ? selectedStatus.id : null);
      }
    }
  };

  // Get status options with colors
  const statusOptions = allStatuses.map((status) => ({
    value: status.id,
    label: status.friendly_name,
    color: status.color,
  }));

  // Get selected status ID
  const getSelectedStatusId = () => {
    return currentGlobalStatusId || currentCustomStatusId || null;
  };

  // Tax rate management functions
  const handleAddTax = async () => {
    if (!contact?.id || !newTax.tax_name || !newTax.tax_rate) {
      setTaxError('Tax name and rate are required');
      return;
    }

    try {
      setTaxLoading(true);
      setTaxError(null);

      const taxData = {
        tax_name: newTax.tax_name,
        tax_rate: parseFloat(newTax.tax_rate),
        sort_order: taxRates.length,
      };

      const createdTax = await contactsAPI.addContactTax(contact.id, taxData);
      setTaxRates([...taxRates, createdTax]);
      setNewTax({ tax_name: '', tax_rate: '' });
    } catch (err) {
      console.error('Failed to add tax:', err);
      setTaxError(err.message);
    } finally {
      setTaxLoading(false);
    }
  };

  const handleUpdateTax = async (taxId, updatedData) => {
    if (!contact?.id) return;

    try {
      setTaxLoading(true);
      setTaxError(null);

      await contactsAPI.updateContactTax(contact.id, taxId, updatedData);
      setTaxRates(
        taxRates.map((tax) =>
          tax.id === taxId ? { ...tax, ...updatedData } : tax
        )
      );
      setEditingTaxId(null);
    } catch (err) {
      console.error('Failed to update tax:', err);
      setTaxError(err.message);
    } finally {
      setTaxLoading(false);
    }
  };

  const handleDeleteTax = async (taxId) => {
    if (!contact?.id || !confirm('Are you sure you want to delete this tax rate?')) {
      return;
    }

    try {
      setTaxLoading(true);
      setTaxError(null);

      await contactsAPI.deleteContactTax(contact.id, taxId);
      setTaxRates(taxRates.filter((tax) => tax.id !== taxId));
    } catch (err) {
      console.error('Failed to delete tax:', err);
      setTaxError(err.message);
    } finally {
      setTaxLoading(false);
    }
  };

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
    } catch (err) {
      console.error('Failed to add contact person:', err);
      setPersonError(err.message);
    } finally {
      setPersonLoading(false);
    }
  };

  const handleUpdatePerson = async (personId, updatedData) => {
    if (!contact?.id) return;

    try {
      setPersonLoading(true);
      setPersonError(null);

      await contactPersonsAPI.update(contact.id, personId, updatedData);
      setContactPersons(
        contactPersons.map((person) =>
          person.id === personId ? { ...person, ...updatedData } : person
        )
      );
      setEditingPersonId(null);
    } catch (err) {
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
      setContactPersons(contactPersons.filter((person) => person.id !== personToDelete.id));
      setShowDeletePersonModal(false);
      setPersonToDelete(null);
    } catch (err) {
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
            {Object.entries(errors).map(([field, error]) => (
              <li key={field}>
                <span className="font-medium">{field.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}:</span> {error.message}
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
              <FormField
                name="first_name"
                label="First Name"
                type="text"
                placeholder="John"
              />
              <FormField
                name="last_name"
                label="Last Name"
                type="text"
                placeholder="Doe"
              />
            </div>

            {/* Business Name */}
            <FormField
              name="business_name"
              label="Business Name"
              type="text"
              placeholder="Acme Corporation"
            />

            {/* Email */}
            <FormField
              name="email"
              label="Email"
              type="email"
              placeholder="john@example.com"
            />

            {/* Phone */}
            <div className="grid grid-cols-4 gap-4">
              <FormField
                name="country_code"
                label="Country Code"
                type="text"
                placeholder="+44"
              />
              <FormField
                name="phone"
                label="Phone Number"
                type="tel"
                placeholder="7700 900000"
                className="col-span-3"
              />
            </div>
          </div>
        )}

        {activeTab === 'address' && (
          <div className="space-y-4">
            {/* Address */}
            <FormField
              name="address_line_1"
              label="Address Line 1"
              type="text"
              placeholder="123 Main Street"
            />

            <FormField
              name="address_line_2"
              label="Address Line 2"
              type="text"
              placeholder="Apt 4B"
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                name="city"
                label="City"
                type="text"
                placeholder="London"
              />
              <FormField
                name="state"
                label="State/Province"
                type="text"
                placeholder="California"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                name="postcode"
                label="Postcode"
                type="text"
                placeholder="SW1A 1AA"
              />
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Country
                </label>
                <Combobox
                  options={companyCountries.map((cc) => ({
                    id: cc.country.id,
                    label: cc.country.name,
                  }))}
                  value={watch('country_id') || ''}
                  onChange={(value) => setValue('country_id', value || null)}
                  placeholder="Select country..."
                  searchPlaceholder="Search countries..."
                  loading={countriesLoading}
                  emptyMessage="No countries found"
                  allowClear
                />
                {errors.country_id && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                    {errors.country_id.message}
                  </p>
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
                {/* Error Display */}
                {personError && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-600">{personError}</p>
                  </div>
                )}

                {/* Existing Contact Persons */}
                {contactPersons.length > 0 && (
                  <div className="space-y-2">
                    <h3 className="text-sm font-medium text-gray-900 dark:text-gray-300">
                      Contact People ({contactPersons.length})
                    </h3>
                    {contactPersons.map((person) => (
                      <div
                        key={person.id}
                        className="p-3 border border-gray-200 dark:border-gray-600 rounded-lg"
                      >
                        {editingPersonId === person.id ? (
                          <div className="space-y-3">
                            <div className="grid grid-cols-2 gap-3">
                              <input
                                type="text"
                                defaultValue={person.first_name}
                                placeholder="First Name *"
                                id={`edit-first-${person.id}`}
                                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm"
                              />
                              <input
                                type="text"
                                defaultValue={person.last_name || ''}
                                placeholder="Last Name"
                                id={`edit-last-${person.id}`}
                                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm"
                              />
                            </div>
                            <input
                              type="email"
                              defaultValue={person.email}
                              placeholder="Email *"
                              id={`edit-email-${person.id}`}
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm"
                            />
                            <div className="flex gap-2">
                              <button
                                type="button"
                                onClick={() => {
                                  const firstName = document.getElementById(`edit-first-${person.id}`).value;
                                  const lastName = document.getElementById(`edit-last-${person.id}`).value;
                                  const email = document.getElementById(`edit-email-${person.id}`).value;
                                  handleUpdatePerson(person.id, {
                                    first_name: firstName,
                                    last_name: lastName || null,
                                    email,
                                  });
                                }}
                                className="px-3 py-1.5 bg-zenible-primary text-white rounded-lg text-sm hover:bg-opacity-90"
                                disabled={personLoading}
                              >
                                Save
                              </button>
                              <button
                                type="button"
                                onClick={() => setEditingPersonId(null)}
                                className="px-3 py-1.5 bg-gray-200 text-gray-700 rounded-lg text-sm hover:bg-gray-300"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium text-gray-900 dark:text-white">
                                {person.first_name} {person.last_name}
                              </p>
                              <p className="text-sm text-gray-600 dark:text-gray-400">{person.email}</p>
                            </div>
                            <div className="flex gap-2">
                              <button
                                type="button"
                                onClick={() => setEditingPersonId(person.id)}
                                className="p-1 text-gray-600 hover:text-zenible-primary"
                                disabled={personLoading}
                              >
                                <PencilIcon className="h-4 w-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setPersonToDelete(person);
                                  setShowDeletePersonModal(true);
                                }}
                                className="p-1 text-gray-600 hover:text-red-600"
                                disabled={personLoading}
                              >
                                <TrashIcon className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Add New Contact Person */}
                <div className="border-t border-gray-200 dark:border-gray-600 pt-4 mt-4">
                  <h3 className="text-sm font-medium text-gray-900 dark:text-gray-300 mb-3 flex items-center gap-2">
                    <PlusIcon className="h-4 w-4" />
                    Add New Contact Person
                  </h3>
                  <div className="space-y-3" key={contactPersons.length}>
                    <div className="grid grid-cols-2 gap-3">
                      <input
                        type="text"
                        value={newPerson.first_name}
                        onChange={(e) => setNewPerson({ ...newPerson, first_name: e.target.value })}
                        placeholder="First Name *"
                        className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-zenible-primary"
                      />
                      <input
                        type="text"
                        value={newPerson.last_name}
                        onChange={(e) => setNewPerson({ ...newPerson, last_name: e.target.value })}
                        placeholder="Last Name"
                        className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-zenible-primary"
                      />
                    </div>
                    <input
                      type="email"
                      value={newPerson.email}
                      onChange={(e) => setNewPerson({ ...newPerson, email: e.target.value })}
                      placeholder="Email *"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-zenible-primary"
                    />
                    <button
                      type="button"
                      onClick={handleAddPerson}
                      className="px-4 py-2 bg-zenible-primary text-white rounded-lg text-sm hover:bg-opacity-90 disabled:opacity-50 transition-opacity"
                      disabled={personLoading || !newPerson.first_name.trim() || !newPerson.email.trim()}
                    >
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
            {/* Contact Type */}
            <div>
              <label className="block text-sm font-medium text-gray-900 dark:text-gray-300 mb-2">
                Contact type
              </label>
              <ChipSelector
                options={contactTypeOptions}
                value={getContactTypes()}
                onChange={handleContactTypeChange}
                multiple={true}
              />
            </div>

            {/* Status */}
            <div>
              <label className="block text-sm font-medium text-gray-900 dark:text-gray-300 mb-2">
                Status
              </label>
              <ChipSelector
                options={statusOptions}
                value={getSelectedStatusId()}
                onChange={handleStatusChange}
                multiple={false}
                useColors={true}
              />
            </div>

            {/* Registration Number */}
            <FormField
              name="registration_number"
              label="Company Registration Number"
              type="text"
              placeholder="12345678"
            />

            {/* Notes */}
            <FormTextarea
              name="notes"
              label="Notes"
              rows={3}
              placeholder="Additional notes about this contact..."
            />
          </div>
        )}

        {activeTab === 'finance' && (
          <div className="space-y-4">
            {/* Tax Information */}
            <div className="pb-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-sm font-medium text-gray-900 dark:text-gray-300 mb-3">
                Tax Information
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  name="tax_number"
                  label="Tax/VAT Number"
                  type="text"
                  placeholder="GB123456789"
                />
                <FormField
                  name="tax_id"
                  label="Tax ID"
                  type="text"
                  placeholder="Tax identification number"
                />
              </div>
            </div>

            {/* Vendor-specific fields */}
            {watch('is_vendor') && (
              <div className="pb-4 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-sm font-medium text-gray-900 dark:text-gray-300 mb-3">
                  Vendor Information
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    name="vendor_type"
                    label="Vendor Type"
                    type="text"
                    placeholder="e.g., Supplier, Contractor"
                  />
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Default Payment Terms (Days)
                    </label>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                      Payment terms for this vendor's invoices
                    </p>
                    <FormField
                      name="default_payment_terms"
                      type="number"
                      placeholder="e.g., 30"
                      min="0"
                      max="365"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Currency and Payment Terms Row */}
            {companyCurrencies.length > 0 && (
              <div className="grid grid-cols-2 gap-4">
                {/* Payment Currency */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Payment Currency
                  </label>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                    Primary currency for invoices and payments
                  </p>
                  <FormSelect
                    name="currency_id"
                    options={companyCurrencies.map((cc) => ({
                      value: cc.currency.id,
                      label: `${cc.currency.code} (${cc.currency.symbol})`,
                    }))}
                  />
                </div>

                {/* Payment Terms */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Payment Terms (Days)
                  </label>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                    Overrides company default payment terms
                  </p>
                  <FormField
                    name="invoice_payment_terms"
                    type="number"
                    placeholder="e.g., 30"
                    min="0"
                    max="365"
                  />
                </div>
              </div>
            )}

            {/* Hourly Rate */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Hourly Rate
              </label>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                Override company default hourly rate for this contact
              </p>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400 text-sm">
                  {companyCurrencies.find(cc => cc.currency.id === watch('currency_id'))?.currency?.symbol ||
                   defaultCurrency?.currency?.symbol ||
                   '£'}
                </span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  {...methods.register('hourly_rate')}
                  placeholder="e.g., 50.00"
                  className="w-full pl-8 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-zenible-primary focus:border-zenible-primary bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                />
              </div>
            </div>

            {/* Preferred Currency (for Vendors) */}
            {watch('is_vendor') && companyCurrencies.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Preferred Currency (Vendor)
                </label>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                  Vendor's preferred currency for payments
                </p>
                <FormSelect
                  name="preferred_currency_id"
                  options={companyCurrencies.map((cc) => ({
                    value: cc.currency.id,
                    label: `${cc.currency.code} (${cc.currency.symbol})`,
                  }))}
                />
              </div>
            )}

            {/* Invoice Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Invoice Notes
              </label>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                Default notes to include on invoices for this contact
              </p>
              <FormTextarea
                name="invoice_notes"
                rows={4}
                placeholder="e.g., Please pay within 30 days to:&#10;Bank: ABC Bank&#10;Account: 12345678&#10;Sort Code: 12-34-56"
              />
            </div>

            {/* Tax Rates */}
            <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Tax Rates
              </label>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                Multiple tax rates can be applied to invoices for this contact
              </p>

              {/* Tax Error Display */}
              {taxError && (
                <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg mb-3">
                  <p className="text-sm text-red-600 dark:text-red-400">{taxError}</p>
                </div>
              )}

              {contact?.id ? (
                <>
                  {/* Existing Tax Rates */}
                  {taxRates.length > 0 && (
                    <div className="space-y-2 mb-4">
                      {taxRates.map((tax) => (
                        <div
                          key={tax.id}
                          className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
                        >
                          {editingTaxId === tax.id ? (
                            <>
                              <input
                                type="text"
                                value={tax.tax_name}
                                onChange={(e) =>
                                  setTaxRates(
                                    taxRates.map((t) =>
                                      t.id === tax.id ? { ...t, tax_name: e.target.value } : t
                                    )
                                  )
                                }
                                className="flex-1 px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                                placeholder="Tax name"
                              />
                              <input
                                type="number"
                                value={tax.tax_rate}
                                onChange={(e) =>
                                  setTaxRates(
                                    taxRates.map((t) =>
                                      t.id === tax.id ? { ...t, tax_rate: e.target.value } : t
                                    )
                                  )
                                }
                                className="w-24 px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                                placeholder="Rate"
                                step="0.01"
                              />
                              <button
                                onClick={() =>
                                  handleUpdateTax(tax.id, {
                                    tax_name: tax.tax_name,
                                    tax_rate: parseFloat(tax.tax_rate),
                                  })
                                }
                                disabled={taxLoading}
                                className="px-2 py-1 text-xs text-white bg-zenible-primary rounded hover:bg-opacity-90 disabled:opacity-50"
                              >
                                Save
                              </button>
                              <button
                                onClick={() => setEditingTaxId(null)}
                                className="px-2 py-1 text-xs text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                              >
                                Cancel
                              </button>
                            </>
                          ) : (
                            <>
                              <div className="flex-1">
                                <span className="text-sm font-medium text-gray-900 dark:text-white">
                                  {tax.tax_name}
                                </span>
                                <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">
                                  {tax.tax_rate}%
                                </span>
                              </div>
                              <button
                                onClick={() => setEditingTaxId(tax.id)}
                                className="px-2 py-1 text-xs text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleDeleteTax(tax.id)}
                                disabled={taxLoading}
                                className="px-2 py-1 text-xs text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 disabled:opacity-50"
                              >
                                Delete
                              </button>
                            </>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Add New Tax Rate */}
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={newTax.tax_name}
                      onChange={(e) => setNewTax({ ...newTax, tax_name: e.target.value })}
                      placeholder="Tax name (e.g., VAT)"
                      className="flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-zenible-primary focus:border-zenible-primary bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                    />
                    <input
                      type="number"
                      value={newTax.tax_rate}
                      onChange={(e) => setNewTax({ ...newTax, tax_rate: e.target.value })}
                      placeholder="Rate %"
                      step="0.01"
                      min="0"
                      max="100"
                      className="w-32 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-zenible-primary focus:border-zenible-primary bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                    />
                    <button
                      onClick={handleAddTax}
                      disabled={taxLoading || !newTax.tax_name || !newTax.tax_rate}
                      className="px-4 py-2 text-sm font-medium text-white bg-zenible-primary rounded-lg hover:bg-opacity-90 disabled:opacity-50 transition-colors"
                    >
                      Add
                    </button>
                  </div>
                </>
              ) : (
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Tax rates can be added after the contact is created.
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Footer Buttons */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 text-sm font-medium text-white bg-zenible-primary rounded-lg hover:bg-opacity-90 disabled:opacity-50 transition-colors"
        >
          {loading ? 'Saving...' : contact ? 'Update Contact' : 'Create Contact'}
        </button>
      </div>

      {/* Delete Contact Person Confirmation Modal */}
      <ConfirmationModal
        isOpen={showDeletePersonModal}
        onClose={() => {
          setShowDeletePersonModal(false);
          setPersonToDelete(null);
        }}
        onConfirm={handleDeletePerson}
        title="Delete Contact Person?"
        message={
          <div>
            <p className="mb-2">
              Are you sure you want to delete {personToDelete ? `${personToDelete.first_name} ${personToDelete.last_name}` : 'this contact person'}?
            </p>
            <p className="text-sm text-red-600 dark:text-red-400 font-medium">
              Warning: This action cannot be undone.
            </p>
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
