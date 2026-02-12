import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormField, FormSelect, FormCheckbox, FormTextarea } from '../../ui/form';
import { contactSchema, getContactDefaultValues } from '../schemas/contactSchema';

interface ContactFormProps {
  contact?: any;
  initialStatus?: string | null;
  allStatuses?: any[];
  onSubmit: (data: any) => void;
  loading?: boolean;
  submitError?: string | null;
}

/**
 * Contact form component using React Hook Form
 */
const ContactForm: React.FC<ContactFormProps> = ({
  contact = null,
  initialStatus = null,
  allStatuses = [],
  onSubmit,
  loading = false,
  submitError = null,
}) => {
  const methods = useForm({
    resolver: zodResolver(contactSchema),
    defaultValues: getContactDefaultValues(contact, initialStatus),
  });

  const { watch, setValue, reset } = methods;

  // Reset form when contact changes (important for edit mode)
  React.useEffect(() => {
    reset(getContactDefaultValues(contact, initialStatus));
  }, [contact, initialStatus, reset]);
  const currentGlobalStatusId = watch('current_global_status_id');
  const currentCustomStatusId = watch('current_custom_status_id');

  // Handle status selection
  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedStatus = allStatuses.find((s: any) => s.id === e.target.value);
    if (selectedStatus) {
      const isCustom = selectedStatus.name.startsWith('custom_');
      setValue('current_global_status_id', isCustom ? null : selectedStatus.id);
      setValue('current_custom_status_id', isCustom ? selectedStatus.id : null);
    }
  };

  return (
    <Form methods={methods} onSubmit={onSubmit} className="space-y-6">
      {/* General Error */}
      {submitError && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-600">{submitError}</p>
        </div>
      )}

      {/* Name Fields */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField
          name="postcode"
          label="Postcode"
          type="text"
          placeholder="SW1A 1AA"
        />
        <FormField
          name="country"
          label="Country"
          type="text"
          placeholder="United Kingdom"
        />
      </div>

      {/* Type Flags */}
      <div className="flex gap-6 pt-4 border-t border-gray-200">
        <FormCheckbox
          name="is_client"
          label="Client"
        />
        <FormCheckbox
          name="is_vendor"
          label="Vendor"
        />
      </div>

      {/* Company Information */}
      <div className="pt-4 border-t border-gray-200">
        <h3 className="text-sm font-medium text-gray-900 mb-3">Company & Tax Information</h3>
        <div className="space-y-4">
          <FormField
            name="registration_number"
            label="Company Registration Number"
            type="text"
            placeholder="12345678"
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
      </div>

      {/* Vendor Information */}
      {watch('is_vendor') && (
        <div className="pt-4 border-t border-gray-200">
          <h3 className="text-sm font-medium text-gray-900 mb-3">Vendor Information</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField
              name="vendor_type"
              label="Vendor Type"
              type="text"
              placeholder="e.g., Supplier, Contractor"
            />
            <FormField
              name="default_payment_terms"
              label="Default Payment Terms (Days)"
              type="number"
              placeholder="e.g., 30"
              min="0"
              max="365"
            />
          </div>
        </div>
      )}

      {/* Notes */}
      <FormTextarea
        name="notes"
        label="Notes"
        rows={4}
        placeholder="Additional notes about this contact..."
      />

      {/* Status Selection */}
      <div className="pt-6 border-t border-gray-200">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Status
        </label>
        <select
          value={currentGlobalStatusId || currentCustomStatusId || ''}
          onChange={handleStatusChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-zenible-primary focus:border-zenible-primary"
        >
          <option value="">Select status...</option>
          {allStatuses.map((status: any) => (
            <option key={status.id} value={status.id}>
              {status.friendly_name}
            </option>
          ))}
        </select>
      </div>

      {/* Footer Buttons */}
      <div className="flex items-center justify-end gap-3 pt-6 border-t border-gray-200">
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 text-sm font-medium text-white bg-zenible-primary rounded-lg hover:bg-opacity-90 disabled:opacity-50 transition-colors"
        >
          {loading ? 'Saving...' : contact ? 'Update Contact' : 'Create Contact'}
        </button>
      </div>
    </Form>
  );
};

export default ContactForm;
