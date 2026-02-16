import React, { useState, useEffect, useRef } from 'react';
import { Search, Check, ChevronDown } from 'lucide-react';
import { useCRMReferenceData } from '../../../../contexts/CRMReferenceDataContext';
import companiesAPI from '../../../../services/api/crm/companies';
import countriesAPI from '../../../../services/api/crm/countries';
import { useNotification } from '../../../../contexts/NotificationContext';
import TaxesSection from './TaxesSection';
import type { CompanyResponse, CountryResponse } from '../../../../types/common';

/**
 * Profile Tab - Company profile and business information
 */
interface ProfileTabProps {
  onUnsavedChanges?: (hasChanges: boolean) => void;
}

const ProfileTab: React.FC<ProfileTabProps> = ({ onUnsavedChanges }) => {
  const [company, setCompany] = useState<CompanyResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<any>({});
  const [hasChanges, setHasChanges] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [countries, setCountries] = useState<CountryResponse[]>([]);
  const [showCountryDropdown, setShowCountryDropdown] = useState(false);
  const [countrySearch, setCountrySearch] = useState('');
  const countryTriggerRef = useRef<HTMLButtonElement>(null);
  const countryDropdownRef = useRef<HTMLDivElement>(null);

  const { loading: refDataLoading } = useCRMReferenceData();
  const { showSuccess, showError } = useNotification();

  // Load company data
  useEffect(() => {
    const loadCompany = async () => {
      try {
        const data = await companiesAPI.getCurrent<CompanyResponse>();
        setCompany(data);
        setLogoUrl(data.logo_url || null);
        setFormData({
          name: data.name || '',
          email: data.email || '',
          phone: data.phone || '',
          website: data.website || '',
          address: data.address || '',
          city: data.city || '',
          state: data.state || '',
          country: data.country || '',
          postal_code: data.postal_code || '',
          tax_id: data.tax_id || '',
          registration_number: data.registration_number || '',
          // Invoice defaults
          default_invoice_payment_terms: data.default_invoice_payment_terms || 7,
          default_hourly_rate: data.default_hourly_rate || null,
          default_payment_instructions: data.default_payment_instructions || '',
          invoice_reminder_frequency_days: data.invoice_reminder_frequency_days || 7,
          invoice_reminders_enabled: data.invoice_reminders_enabled ?? true,
          max_invoice_reminders: data.max_invoice_reminders || 3,
          // Quote reminders
          quote_reminder_frequency_days: data.quote_reminder_frequency_days || 7,
          quote_reminders_enabled: data.quote_reminders_enabled ?? true,
          max_quote_reminders: data.max_quote_reminders || 3,
          // Company taxes (managed separately by TaxesSection)
          company_taxes: data.company_taxes || [],
          // Branding
          primary_color: data.primary_color || '',
          secondary_color: data.secondary_color || '',
        });
      } catch (error) {
        showError('Failed to load company settings');
        console.error('Failed to load company:', error);
      } finally {
        setLoading(false);
      }
    };
    loadCompany();
  }, [showError]);

  // Load countries list
  useEffect(() => {
    const loadCountries = async () => {
      try {
        const data = await countriesAPI.list() as CountryResponse[];
        setCountries(data);
      } catch (error) {
        console.error('Failed to load countries:', error);
      }
    };
    loadCountries();
  }, []);

  // Close country dropdown on click outside
  useEffect(() => {
    if (!showCountryDropdown) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (
        countryDropdownRef.current &&
        !countryDropdownRef.current.contains(event.target as Node) &&
        countryTriggerRef.current &&
        !countryTriggerRef.current.contains(event.target as Node)
      ) {
        setShowCountryDropdown(false);
        setCountrySearch('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showCountryDropdown]);

  // Close country dropdown on escape key
  useEffect(() => {
    if (!showCountryDropdown) return;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setShowCountryDropdown(false);
        setCountrySearch('');
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [showCountryDropdown]);

  // Track changes
  useEffect(() => {
    onUnsavedChanges?.(hasChanges);
  }, [hasChanges, onUnsavedChanges]);

  const handleChange = (field: string, value: any) => {
    setFormData((prev: any) => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };

  // Filter countries based on search
  const filteredCountries = countries.filter(
    (c) =>
      c.name.toLowerCase().includes(countrySearch.toLowerCase()) ||
      c.code.toLowerCase().includes(countrySearch.toLowerCase())
  );

  // Get current country display name
  const getCountryDisplay = () => {
    if (!formData.country) return 'Select country';
    const country = countries.find(
      (c) => c.name === formData.country || c.code === formData.country
    );
    return country ? country.name : formData.country;
  };

  // Logo upload handler
  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      showError('Please select a valid image file (JPEG, PNG, GIF, or WebP)');
      return;
    }

    // Validate file size (5MB max)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      showError('Image must be less than 5MB');
      return;
    }

    setUploadingLogo(true);
    try {
      const result = await companiesAPI.uploadLogo<{ logo_url: string }>(file);
      setLogoUrl(result.logo_url);
      showSuccess('Logo uploaded successfully');
    } catch (error) {
      showError('Failed to upload logo');
      console.error('Logo upload failed:', error);
    } finally {
      setUploadingLogo(false);
      // Reset file input
      e.target.value = '';
    }
  };

  // Logo delete handler
  const handleLogoDelete = async () => {
    if (!logoUrl) return;

    try {
      await companiesAPI.deleteLogo();
      setLogoUrl(null);
      showSuccess('Logo removed successfully');
    } catch (error) {
      showError('Failed to remove logo');
      console.error('Logo delete failed:', error);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = {
        ...formData,
        primary_color: formData.primary_color || null,
        secondary_color: formData.secondary_color || null,
      };
      await companiesAPI.updateCurrent(payload);
      setHasChanges(false);
      showSuccess('Company settings saved successfully');
    } catch (error: any) {
      const detail = error?.response?.data?.detail;
      if (Array.isArray(detail)) {
        const messages = detail.map((d: any) => d.msg || d.message || String(d)).join(', ');
        showError(messages || 'Failed to save company settings');
      } else if (typeof detail === 'string') {
        showError(detail);
      } else {
        showError('Failed to save company settings');
      }
      console.error('Failed to save:', error);
    } finally {
      setSaving(false);
    }
  };

  if (loading || refDataLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-500">Loading company settings...</div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Company Details Section */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Company Details
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Company Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Email
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => handleChange('email', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Phone
            </label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => handleChange('phone', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Website
            </label>
            <input
              type="url"
              value={formData.website}
              onChange={(e) => handleChange('website', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              placeholder="https://example.com"
            />
          </div>
        </div>
      </div>

      {/* Address Section */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Address
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Street Address
            </label>
            <input
              type="text"
              value={formData.address}
              onChange={(e) => handleChange('address', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              City
            </label>
            <input
              type="text"
              value={formData.city}
              onChange={(e) => handleChange('city', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              State/Province
            </label>
            <input
              type="text"
              value={formData.state}
              onChange={(e) => handleChange('state', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Postal Code
            </label>
            <input
              type="text"
              value={formData.postal_code}
              onChange={(e) => handleChange('postal_code', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            />
          </div>

          <div className="relative">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Country
            </label>
            <button
              ref={countryTriggerRef}
              type="button"
              onClick={() => setShowCountryDropdown(!showCountryDropdown)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white text-left flex items-center justify-between hover:border-gray-400 dark:hover:border-gray-500 transition-colors"
            >
              <span className={formData.country ? 'text-gray-900 dark:text-white' : 'text-gray-400 dark:text-gray-500'}>
                {getCountryDisplay()}
              </span>
              <ChevronDown className="h-4 w-4 text-gray-400" />
            </button>

            {/* Country Dropdown */}
            {showCountryDropdown && (
              <div
                ref={countryDropdownRef}
                className="absolute z-50 mt-1 w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden"
              >
                {/* Search */}
                <div className="p-3 border-b border-gray-200 dark:border-gray-700">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500" />
                    <input
                      type="text"
                      placeholder="Search countries..."
                      value={countrySearch}
                      onChange={(e) => setCountrySearch(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      autoFocus
                    />
                  </div>
                </div>

                {/* Country List */}
                <div className="max-h-64 overflow-y-auto">
                  {filteredCountries.length === 0 ? (
                    <div className="px-4 py-8 text-center text-sm text-gray-500 dark:text-gray-400">
                      {countrySearch ? 'No countries found' : 'No countries available'}
                    </div>
                  ) : (
                    <div className="py-1">
                      {filteredCountries.map((country) => (
                        <button
                          key={country.id}
                          onClick={() => {
                            handleChange('country', country.name);
                            setShowCountryDropdown(false);
                            setCountrySearch('');
                          }}
                          className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center justify-between transition-colors ${
                            formData.country === country.name ? 'bg-purple-50 dark:bg-purple-900/20' : ''
                          }`}
                        >
                          <span className="text-gray-900 dark:text-white">
                            {country.name}
                            <span className="ml-2 text-gray-400 text-xs">({country.code})</span>
                          </span>
                          {formData.country === country.name && (
                            <Check className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Branding Section */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Branding
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
          Customize your company branding for invoices and customer-facing documents.
        </p>

        {/* Company Logo */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Company Logo
          </label>
          <div className="flex items-start gap-4">
            {/* Logo Preview */}
            <div className="w-32 h-20 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg flex items-center justify-center bg-gray-50 dark:bg-gray-800 overflow-hidden">
              {logoUrl ? (
                <img
                  src={logoUrl}
                  alt="Company logo"
                  className="max-w-full max-h-full object-contain"
                />
              ) : (
                <span className="text-gray-400 dark:text-gray-500 text-xs text-center px-2">
                  No logo
                </span>
              )}
            </div>

            {/* Upload Controls */}
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <label className="relative cursor-pointer">
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/gif,image/webp"
                    onChange={handleLogoUpload}
                    disabled={uploadingLogo}
                    className="sr-only"
                  />
                  <span className="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors cursor-pointer">
                    {uploadingLogo ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        Uploading...
                      </>
                    ) : (
                      'Choose File'
                    )}
                  </span>
                </label>
                {logoUrl && (
                  <button
                    type="button"
                    onClick={handleLogoDelete}
                    className="px-3 py-2 text-sm font-medium text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 transition-colors"
                  >
                    Remove
                  </button>
                )}
              </div>
              <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                PNG, JPG, GIF or WebP (max 5MB). Recommended: 200x80px
              </p>
            </div>
          </div>
        </div>

        {/* Theme Colors */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Primary Color */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Primary Color
            </label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={formData.primary_color || '#8e51ff'}
                onChange={(e) => handleChange('primary_color', e.target.value)}
                className="w-10 h-10 rounded cursor-pointer border border-gray-300 dark:border-gray-600 bg-transparent p-0.5"
              />
              <input
                type="text"
                value={formData.primary_color || ''}
                onChange={(e) => {
                  const value = e.target.value;
                  // Allow typing and auto-add # if missing
                  if (value && !value.startsWith('#')) {
                    handleChange('primary_color', '#' + value);
                  } else {
                    handleChange('primary_color', value);
                  }
                }}
                placeholder="#8e51ff"
                maxLength={7}
                className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white font-mono text-sm"
              />
            </div>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Main brand color for buttons and accents
            </p>
          </div>

          {/* Secondary Color */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Secondary Color
            </label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={formData.secondary_color || '#00007f'}
                onChange={(e) => handleChange('secondary_color', e.target.value)}
                className="w-10 h-10 rounded cursor-pointer border border-gray-300 dark:border-gray-600 bg-transparent p-0.5"
              />
              <input
                type="text"
                value={formData.secondary_color || ''}
                onChange={(e) => {
                  const value = e.target.value;
                  // Allow typing and auto-add # if missing
                  if (value && !value.startsWith('#')) {
                    handleChange('secondary_color', '#' + value);
                  } else {
                    handleChange('secondary_color', value);
                  }
                }}
                placeholder="#00007f"
                maxLength={7}
                className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white font-mono text-sm"
              />
            </div>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Secondary brand color for headers and links
            </p>
          </div>
        </div>
      </div>

      {/* Business Information */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Business Information
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Tax ID
            </label>
            <input
              type="text"
              value={formData.tax_id}
              onChange={(e) => handleChange('tax_id', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Registration Number
            </label>
            <input
              type="text"
              value={formData.registration_number}
              onChange={(e) => handleChange('registration_number', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            />
          </div>
        </div>
      </div>

      {/* Invoice Defaults */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Invoice Defaults
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Payment Terms (days)
            </label>
            <input
              type="number"
              value={formData.default_invoice_payment_terms}
              onChange={(e) => handleChange('default_invoice_payment_terms', parseInt(e.target.value))}
              min="0"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Default Hourly Rate
            </label>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
              Default hourly rate for all contacts (can be overridden per contact)
            </p>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400 text-sm">
                £
              </span>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.default_hourly_rate || ''}
                onChange={(e) => handleChange('default_hourly_rate', e.target.value ? parseFloat(e.target.value) : null)}
                placeholder="Not set"
                className="w-full pl-8 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              />
            </div>
          </div>
        </div>

        {/* Default Payment Instructions */}
        <div className="mt-6">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Default Payment Instructions
          </label>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
            These instructions will appear on invoices by default. You can override them per invoice.
          </p>
          <textarea
            value={formData.default_payment_instructions || ''}
            onChange={(e) => handleChange('default_payment_instructions', e.target.value)}
            rows={4}
            placeholder="e.g., Please make payment via bank transfer to Account: 12345678, Sort Code: 00-00-00"
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white resize-y"
          />
        </div>
      </div>

      {/* Automatic Reminders */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Automatic Reminders
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
          Configure automatic reminder settings for invoices and quotes. Reminders are sent to clients who haven't responded.
        </p>

        {/* Invoice Reminders */}
        <div className="mb-8">
          <h4 className="text-md font-medium text-gray-800 dark:text-gray-200 mb-4">Invoice Reminders</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.invoice_reminders_enabled}
                  onChange={(e) => handleChange('invoice_reminders_enabled', e.target.checked)}
                  className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Enable Invoice Reminders
                </span>
              </label>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Frequency (days)
              </label>
              <input
                type="number"
                value={formData.invoice_reminder_frequency_days}
                onChange={(e) => handleChange('invoice_reminder_frequency_days', parseInt(e.target.value) || 7)}
                min="1"
                max="30"
                disabled={!formData.invoice_reminders_enabled}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Maximum Reminders
              </label>
              <input
                type="number"
                value={formData.max_invoice_reminders}
                onChange={(e) => handleChange('max_invoice_reminders', parseInt(e.target.value) || 3)}
                min="1"
                max="10"
                disabled={!formData.invoice_reminders_enabled}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>
          </div>
        </div>

        {/* Quote Reminders */}
        <div>
          <h4 className="text-md font-medium text-gray-800 dark:text-gray-200 mb-4">Quote Reminders</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.quote_reminders_enabled}
                  onChange={(e) => handleChange('quote_reminders_enabled', e.target.checked)}
                  className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Enable Quote Reminders
                </span>
              </label>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Frequency (days)
              </label>
              <input
                type="number"
                value={formData.quote_reminder_frequency_days}
                onChange={(e) => handleChange('quote_reminder_frequency_days', parseInt(e.target.value) || 7)}
                min="1"
                max="30"
                disabled={!formData.quote_reminders_enabled}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Maximum Reminders
              </label>
              <input
                type="number"
                value={formData.max_quote_reminders}
                onChange={(e) => handleChange('max_quote_reminders', parseInt(e.target.value) || 3)}
                min="1"
                max="10"
                disabled={!formData.quote_reminders_enabled}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Applicable Taxes */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Applicable Taxes
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
          Configure tax rates that can be applied to invoices. Drag to reorder.
        </p>
        <TaxesSection
          initialTaxes={formData.company_taxes}
          onTaxesChange={(taxes: any) => handleChange('company_taxes', taxes)}
        />
      </div>

      {/* Save Button */}
      <div className="flex justify-end gap-3 pt-6 border-t border-gray-200 dark:border-gray-700">
        <button
          onClick={() => {
            if (!company) return;
            setFormData({
              name: company.name || '',
              email: company.email || '',
              phone: company.phone || '',
              website: company.website || '',
              address: company.address || '',
              city: company.city || '',
              state: company.state || '',
              country: company.country || '',
              postal_code: company.postal_code || '',
              tax_id: company.tax_id || '',
              registration_number: company.registration_number || '',
              default_invoice_payment_terms: company.default_invoice_payment_terms || 7,
              default_hourly_rate: company.default_hourly_rate || null,
              default_payment_instructions: company.default_payment_instructions || '',
              invoice_reminder_frequency_days: company.invoice_reminder_frequency_days || 7,
              invoice_reminders_enabled: company.invoice_reminders_enabled ?? true,
              max_invoice_reminders: company.max_invoice_reminders || 3,
              quote_reminder_frequency_days: company.quote_reminder_frequency_days || 7,
              quote_reminders_enabled: company.quote_reminders_enabled ?? true,
              max_quote_reminders: company.max_quote_reminders || 3,
              company_taxes: company.company_taxes || [],
              primary_color: company.primary_color || '',
              secondary_color: company.secondary_color || '',
            });
            setHasChanges(false);
          }}
          disabled={!hasChanges}
          className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          disabled={!hasChanges || saving}
          className="px-4 py-2 bg-zenible-primary text-white rounded-lg hover:bg-opacity-90 font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

    </div>
  );
};

export default ProfileTab;
