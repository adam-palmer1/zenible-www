import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form } from '../../ui/form';
import { contactSchema, getContactDefaultValues } from '../schemas/contactSchema';
import ProgressBar from '../../ui/ProgressBar';
import ChipSelector from '../../ui/ChipSelector';

/**
 * Single-page Contact form component matching Figma design
 *
 * @param {Object} props
 * @param {Object} props.contact - Existing contact data (for edit mode)
 * @param {string} props.initialStatus - Initial status ID (for new contacts)
 * @param {Array} props.allStatuses - All available statuses
 * @param {Function} props.onSubmit - Form submit handler
 * @param {Function} props.onCancel - Cancel handler
 * @param {boolean} props.loading - Whether form is submitting
 * @param {string} props.submitError - General submit error message
 */
const ContactFormSinglePage = ({
  contact = null,
  initialStatus = null,
  allStatuses = [],
  onSubmit,
  onCancel,
  loading = false,
  submitError = null,
}) => {
  const methods = useForm({
    resolver: zodResolver(contactSchema),
    defaultValues: getContactDefaultValues(contact, initialStatus),
  });

  const { watch, setValue, register, reset, formState: { errors } } = methods;

  // Reset form when contact changes (important for edit mode)
  React.useEffect(() => {
    reset(getContactDefaultValues(contact, initialStatus));
  }, [contact, initialStatus, reset]);
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

  // Handle status change
  const handleStatusChange = (statusId) => {
    const selectedStatus = allStatuses.find((s) => s.id === statusId);
    if (selectedStatus) {
      const isCustom = selectedStatus.name.startsWith('custom_');
      setValue('current_global_status_id', isCustom ? null : selectedStatus.id);
      setValue('current_custom_status_id', isCustom ? selectedStatus.id : null);
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

  return (
    <Form methods={methods} onSubmit={onSubmit} className="space-y-6">
      {/* Progress Bar - Only show for new contacts */}
      {!contact && (
        <ProgressBar steps={['Basic Info', 'Additional Details']} currentStep={0} />
      )}

      {/* General Error */}
      {submitError && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-600">{submitError}</p>
        </div>
      )}

      {/* Form Fields */}
      <div className="space-y-5">
        {/* Name Fields */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              First Name
            </label>
            <input
              type="text"
              placeholder="John"
              {...register('first_name')}
              className="w-full px-3 py-2.5 border-[1.5px] border-[#e5e5e5] rounded-[10px] text-sm focus:ring-2 focus:ring-zenible-primary focus:border-zenible-primary bg-white text-gray-900"
            />
            {errors.first_name && (
              <p className="mt-1 text-sm text-red-600">{errors.first_name.message}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Last Name
            </label>
            <input
              type="text"
              placeholder="Doe"
              {...register('last_name')}
              className="w-full px-3 py-2.5 border-[1.5px] border-[#e5e5e5] rounded-[10px] text-sm focus:ring-2 focus:ring-zenible-primary focus:border-zenible-primary bg-white text-gray-900"
            />
            {errors.last_name && (
              <p className="mt-1 text-sm text-red-600">{errors.last_name.message}</p>
            )}
          </div>
        </div>

        {/* Business Name */}
        <div>
          <label className="block text-sm font-medium text-gray-900 mb-2">
            Business Name
          </label>
          <input
            type="text"
            placeholder="Acme Corporation"
            {...register('business_name')}
            className="w-full px-3 py-2.5 border-[1.5px] border-[#e5e5e5] rounded-[10px] text-sm focus:ring-2 focus:ring-zenible-primary focus:border-zenible-primary bg-white text-gray-900"
          />
          {errors.business_name && (
            <p className="mt-1 text-sm text-red-600">{errors.business_name.message}</p>
          )}
        </div>

        {/* Email */}
        <div>
          <label className="block text-sm font-medium text-gray-900 mb-2">
            Email
          </label>
          <input
            type="email"
            placeholder="john@example.com"
            {...register('email')}
            className="w-full px-3 py-2.5 border-[1.5px] border-[#e5e5e5] rounded-[10px] text-sm focus:ring-2 focus:ring-zenible-primary focus:border-zenible-primary bg-white text-gray-900"
          />
          {errors.email && (
            <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
          )}
        </div>

        {/* Phone Number */}
        <div>
          <label className="block text-sm font-medium text-gray-900 mb-2">
            Phone Number
          </label>
          <div className="flex gap-3">
            <input
              type="text"
              placeholder="+44"
              {...register('country_code')}
              className="w-24 px-3 py-2.5 border-[1.5px] border-[#e5e5e5] rounded-[10px] text-sm focus:ring-2 focus:ring-zenible-primary focus:border-zenible-primary bg-white text-gray-900"
            />
            <input
              type="tel"
              placeholder="7700 900000"
              {...register('phone')}
              className="flex-1 px-3 py-2.5 border-[1.5px] border-[#e5e5e5] rounded-[10px] text-sm focus:ring-2 focus:ring-zenible-primary focus:border-zenible-primary bg-white text-gray-900"
            />
          </div>
          {(errors.country_code || errors.phone) && (
            <p className="mt-1 text-sm text-red-600">
              {errors.country_code?.message || errors.phone?.message}
            </p>
          )}
        </div>

        {/* Address Fields */}
        <div>
          <label className="block text-sm font-medium text-gray-900 mb-2">
            Address Line 1
          </label>
          <input
            type="text"
            placeholder="123 Main Street"
            {...register('address_line_1')}
            className="w-full px-3 py-2.5 border-[1.5px] border-[#e5e5e5] rounded-[10px] text-sm focus:ring-2 focus:ring-zenible-primary focus:border-zenible-primary bg-white text-gray-900"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-900 mb-2">
            Address Line 2
          </label>
          <input
            type="text"
            placeholder="Apt 4B"
            {...register('address_line_2')}
            className="w-full px-3 py-2.5 border-[1.5px] border-[#e5e5e5] rounded-[10px] text-sm focus:ring-2 focus:ring-zenible-primary focus:border-zenible-primary bg-white text-gray-900"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              City
            </label>
            <input
              type="text"
              placeholder="London"
              {...register('city')}
              className="w-full px-3 py-2.5 border-[1.5px] border-[#e5e5e5] rounded-[10px] text-sm focus:ring-2 focus:ring-zenible-primary focus:border-zenible-primary bg-white text-gray-900"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              State/Province
            </label>
            <input
              type="text"
              placeholder="California"
              {...register('state')}
              className="w-full px-3 py-2.5 border-[1.5px] border-[#e5e5e5] rounded-[10px] text-sm focus:ring-2 focus:ring-zenible-primary focus:border-zenible-primary bg-white text-gray-900"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Postcode
            </label>
            <input
              type="text"
              placeholder="SW1A 1AA"
              {...register('postcode')}
              className="w-full px-3 py-2.5 border-[1.5px] border-[#e5e5e5] rounded-[10px] text-sm focus:ring-2 focus:ring-zenible-primary focus:border-zenible-primary bg-white text-gray-900"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Country
            </label>
            <input
              type="text"
              placeholder="United Kingdom"
              {...register('country')}
              className="w-full px-3 py-2.5 border-[1.5px] border-[#e5e5e5] rounded-[10px] text-sm focus:ring-2 focus:ring-zenible-primary focus:border-zenible-primary bg-white text-gray-900"
            />
          </div>
        </div>

        {/* Contact Type */}
        <div>
          <label className="block text-sm font-medium text-gray-900 mb-2">
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
          <label className="block text-sm font-medium text-gray-900 mb-2">
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

        {/* Company Registration Number */}
        <div>
          <label className="block text-sm font-medium text-gray-900 mb-2">
            Company Registration Number
          </label>
          <input
            type="text"
            placeholder="12345678"
            {...register('registration_number')}
            className="w-full px-3 py-2.5 border-[1.5px] border-[#e5e5e5] rounded-[10px] text-sm focus:ring-2 focus:ring-zenible-primary focus:border-zenible-primary bg-white text-gray-900"
          />
        </div>

        {/* Tax Information */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Tax/VAT Number
            </label>
            <input
              type="text"
              placeholder="GB123456789"
              {...register('tax_number')}
              className="w-full px-3 py-2.5 border-[1.5px] border-[#e5e5e5] rounded-[10px] text-sm focus:ring-2 focus:ring-zenible-primary focus:border-zenible-primary bg-white text-gray-900"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Tax ID
            </label>
            <input
              type="text"
              placeholder="Tax identification number"
              {...register('tax_id')}
              className="w-full px-3 py-2.5 border-[1.5px] border-[#e5e5e5] rounded-[10px] text-sm focus:ring-2 focus:ring-zenible-primary focus:border-zenible-primary bg-white text-gray-900"
            />
          </div>
        </div>

        {/* Vendor Information - Only show if is_vendor is true */}
        {isVendor && (
          <>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Vendor Type
                </label>
                <input
                  type="text"
                  placeholder="e.g., Supplier, Contractor"
                  {...register('vendor_type')}
                  className="w-full px-3 py-2.5 border-[1.5px] border-[#e5e5e5] rounded-[10px] text-sm focus:ring-2 focus:ring-zenible-primary focus:border-zenible-primary bg-white text-gray-900"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Default Payment Terms (Days)
                </label>
                <input
                  type="number"
                  placeholder="e.g., 30"
                  min="0"
                  max="365"
                  {...register('default_payment_terms')}
                  className="w-full px-3 py-2.5 border-[1.5px] border-[#e5e5e5] rounded-[10px] text-sm focus:ring-2 focus:ring-zenible-primary focus:border-zenible-primary bg-white text-gray-900"
                />
              </div>
            </div>
          </>
        )}

        {/* Notes */}
        <div>
          <label className="block text-sm font-medium text-gray-900 mb-2">
            Notes
          </label>
          <textarea
            placeholder="Additional notes about this contact..."
            rows={4}
            {...register('notes')}
            className="w-full px-3 py-2.5 border-[1.5px] border-[#e5e5e5] rounded-[10px] text-sm focus:ring-2 focus:ring-zenible-primary focus:border-zenible-primary bg-white text-gray-900 resize-none"
          />
        </div>
      </div>

      {/* Footer Buttons */}
      <div className="flex items-center justify-between pt-4">
        <button
          type="button"
          onClick={onCancel}
          disabled={loading}
          className="px-6 py-2.5 text-sm font-medium text-gray-700 bg-white border-[1.5px] border-[#e5e5e5] rounded-[10px] hover:bg-gray-50 disabled:opacity-50 transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-2.5 text-sm font-medium text-white bg-zenible-primary rounded-[10px] hover:bg-opacity-90 disabled:opacity-50 transition-colors"
        >
          {loading ? 'Saving...' : contact ? 'Update Contact' : 'Next'}
        </button>
      </div>
    </Form>
  );
};

export default ContactFormSinglePage;
