import React from 'react';

interface ContactBasicFieldsProps {
  formData: any;
  onChange: (data: any) => void;
  errors?: Record<string, string>;
}

/**
 * Reusable basic contact form fields component
 */
const ContactBasicFields: React.FC<ContactBasicFieldsProps> = ({ formData, onChange, errors = {} }) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    onChange({
      ...formData,
      [name]: type === 'checkbox' ? checked : value,
    });
  };

  return (
    <div className="space-y-4">
      {/* Name Fields */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            First Name
          </label>
          <input
            type="text"
            name="first_name"
            value={formData.first_name || ''}
            onChange={handleChange}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-zenible-primary focus:border-zenible-primary ${
              errors.first_name ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="John"
          />
          {errors.first_name && (
            <p className="mt-1 text-sm text-red-600">{errors.first_name}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Last Name
          </label>
          <input
            type="text"
            name="last_name"
            value={formData.last_name || ''}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-zenible-primary focus:border-zenible-primary"
            placeholder="Doe"
          />
        </div>
      </div>

      {/* Business Name */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Business Name
        </label>
        <input
          type="text"
          name="business_name"
          value={formData.business_name || ''}
          onChange={handleChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-zenible-primary focus:border-zenible-primary"
          placeholder="Acme Corporation"
        />
      </div>

      {/* Email */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Email
        </label>
        <input
          type="email"
          name="email"
          value={formData.email || ''}
          onChange={handleChange}
          className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-zenible-primary focus:border-zenible-primary ${
            errors.email ? 'border-red-500' : 'border-gray-300'
          }`}
          placeholder="john@example.com"
        />
        {errors.email && (
          <p className="mt-1 text-sm text-red-600">{errors.email}</p>
        )}
      </div>

      {/* Phone */}
      <div className="grid grid-cols-4 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Country Code
          </label>
          <input
            type="tel"
            name="country_code"
            value={formData.country_code || '+44'}
            onChange={handleChange}
            onInput={(e) => { e.currentTarget.value = e.currentTarget.value.replace(/[^0-9+\s]/g, ''); }}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-zenible-primary focus:border-zenible-primary"
            placeholder="+44"
          />
        </div>

        <div className="col-span-3">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Phone Number
          </label>
          <input
            type="tel"
            name="phone"
            value={formData.phone || ''}
            onChange={handleChange}
            onInput={(e) => { e.currentTarget.value = e.currentTarget.value.replace(/[^0-9\s\-()+.]/g, ''); }}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-zenible-primary focus:border-zenible-primary"
            placeholder="7700 900000"
          />
        </div>
      </div>

      {/* Address */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Address Line 1
        </label>
        <input
          type="text"
          name="address_line_1"
          value={formData.address_line_1 || ''}
          onChange={handleChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-zenible-primary focus:border-zenible-primary"
          placeholder="123 Main Street"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Address Line 2
        </label>
        <input
          type="text"
          name="address_line_2"
          value={formData.address_line_2 || ''}
          onChange={handleChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-zenible-primary focus:border-zenible-primary"
          placeholder="Apt 4B"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            City
          </label>
          <input
            type="text"
            name="city"
            value={formData.city || ''}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-zenible-primary focus:border-zenible-primary"
            placeholder="London"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Postcode
          </label>
          <input
            type="text"
            name="postcode"
            value={formData.postcode || ''}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-zenible-primary focus:border-zenible-primary"
            placeholder="SW1A 1AA"
          />
        </div>
      </div>

      {/* Type Flags */}
      <div className="flex gap-6 pt-4 border-t border-gray-200">
        <label className="flex items-center">
          <input
            type="checkbox"
            name="is_client"
            checked={formData.is_client || false}
            onChange={handleChange}
            className="h-4 w-4 text-zenible-primary rounded focus:ring-zenible-primary border-gray-300"
          />
          <span className="ml-2 text-sm text-gray-700">Client</span>
        </label>

        <label className="flex items-center">
          <input
            type="checkbox"
            name="is_vendor"
            checked={formData.is_vendor || false}
            onChange={handleChange}
            className="h-4 w-4 text-zenible-primary rounded focus:ring-zenible-primary border-gray-300"
          />
          <span className="ml-2 text-sm text-gray-700">Vendor</span>
        </label>
      </div>

    </div>
  );
};

export default ContactBasicFields;
