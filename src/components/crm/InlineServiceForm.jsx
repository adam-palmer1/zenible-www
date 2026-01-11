import React, { useState, useEffect } from 'react';
import { PlusIcon, TrashIcon } from '@heroicons/react/24/outline';
import ServiceAutocomplete from './ServiceAutocomplete';

/**
 * Inline service creation form for contact details
 * Allows adding services directly to a contact without creating them globally first
 */
const InlineServiceForm = ({
  services = [],
  currencies = [],
  defaultCurrency = 'GBP',
  onUpdate,
  onAdd,
  onRemove
}) => {
  const [serviceItems, setServiceItems] = useState([]);
  const [modifiedServices, setModifiedServices] = useState(new Set());

  // Initialize or reset services
  useEffect(() => {
    if (services.length === 0) {
      setServiceItems([]);
      setModifiedServices(new Set());
    } else {
      // Map backend services to form format
      setServiceItems(services.map((service, index) => ({
        id: service.id || `new-${index}`,
        name: service.name || '',
        description: service.description || '',
        price: service.price?.toString() || '',
        currency: service.currency_code || service.currency?.code || service.currency || defaultCurrency,
        pricingType: service.frequency_type === 'one_off' ? 'Fixed' : 'Recurring',
        recurringType: service.time_period === 'weekly' ? 'Weekly' :
                      service.time_period === 'monthly' ? 'Monthly' :
                      service.time_period === 'yearly' ? 'Yearly' :
                      service.time_period === 'custom' ? 'Custom' : 'Weekly',
        recurringNumber: service.recurring_number !== undefined ? service.recurring_number : -1,
        customEvery: service.custom_every?.toString() || '1',
        customPeriod: service.custom_period ? `${service.custom_period}s` : 'Weeks',
        notes: service.notes || ''
      })));
      setModifiedServices(new Set());
    }
  }, [services, defaultCurrency]);

  // Constants for form options
  const pricingTypes = ['Fixed', 'Recurring'];
  const recurringTypes = ['Weekly', 'Monthly', 'Yearly', 'Custom'];
  const customPeriods = ['Weeks', 'Months', 'Years'];
  const customNumbers = Array.from({ length: 12 }, (_, i) => i + 1);

  const handleServiceChange = (serviceId, field, value) => {
    setServiceItems(prev =>
      prev.map(service =>
        service.id === serviceId ? { ...service, [field]: value } : service
      )
    );

    // Mark service as modified (only for existing services, not new ones)
    if (!serviceId.toString().startsWith('new-')) {
      setModifiedServices(prev => new Set(prev).add(serviceId));
    }
  };

  const handleAddService = () => {
    const newService = {
      id: `new-${Date.now()}`,
      name: '',
      description: '',
      price: '',
      currency: defaultCurrency,
      pricingType: 'Fixed',
      recurringType: 'Weekly',
      recurringNumber: -1,
      customEvery: '1',
      customPeriod: 'Weeks',
      notes: ''
    };
    setServiceItems(prev => [...prev, newService]);
  };

  const handleRemoveService = (serviceId) => {
    setServiceItems(prev => {
      const updated = prev.filter(service => service.id !== serviceId);

      // Only call onRemove for backend services (not new/temporary ones)
      if (onRemove) {
        const serviceToRemove = prev.find(s => s.id === serviceId);
        if (serviceToRemove && !serviceToRemove.id.toString().startsWith('new-')) {
          onRemove(serviceToRemove);
        }
      }

      return updated;
    });
  };

  const handleServiceSelect = async (serviceId, service) => {
    // When user selects a service from autocomplete, auto-fill the fields
    // NOTE: We copy all data from the global service but DON'T store the ID
    // This ensures a new contact-specific service is created, not a reference

    // Auto-fill service details (copy the data, don't reference)
    handleServiceChange(serviceId, 'name', service.name);
    handleServiceChange(serviceId, 'description', service.description || '');
    handleServiceChange(serviceId, 'price', service.price?.toString() || '');
    handleServiceChange(serviceId, 'currency', service.currency_code || service.currency?.code || service.currency || defaultCurrency);

    // Set pricing type and recurring details
    const pricingType = service.frequency_type === 'one_off' ? 'Fixed' : 'Recurring';
    handleServiceChange(serviceId, 'pricingType', pricingType);

    if (pricingType === 'Recurring') {
      const recurringType = service.time_period === 'weekly' ? 'Weekly' :
                           service.time_period === 'monthly' ? 'Monthly' :
                           service.time_period === 'yearly' ? 'Yearly' :
                           service.time_period === 'custom' ? 'Custom' : 'Weekly';
      handleServiceChange(serviceId, 'recurringType', recurringType);
      handleServiceChange(serviceId, 'recurringNumber', service.recurring_number || -1);

      if (recurringType === 'Custom') {
        handleServiceChange(serviceId, 'customEvery', service.custom_every?.toString() || '1');
        handleServiceChange(serviceId, 'customPeriod', service.custom_period ? `${service.custom_period}s` : 'Weeks');
      }
    }
  };

  const transformServicesForBackend = (services) => {
    return services.map(service => {
      const baseService = {
        name: service.name.trim(),
        description: service.description || '',
        notes: service.notes || ''
      };

      if (service.price) {
        baseService.price = parseFloat(service.price);
      }

      // Find currency ID
      const currency = currencies.find(c => c.code === service.currency);
      if (currency) {
        baseService.currency_id = currency.id;
      }

      if (service.pricingType === 'Fixed') {
        baseService.frequency_type = 'one_off';
      } else if (service.pricingType === 'Recurring') {
        baseService.frequency_type = 'recurring';
        baseService.recurring_number = service.recurringNumber !== undefined ? service.recurringNumber : -1;

        if (service.recurringType === 'Weekly') {
          baseService.time_period = 'weekly';
        } else if (service.recurringType === 'Monthly') {
          baseService.time_period = 'monthly';
        } else if (service.recurringType === 'Yearly') {
          baseService.time_period = 'yearly';
        } else if (service.recurringType === 'Custom') {
          baseService.time_period = 'custom';
          baseService.custom_every = parseInt(service.customEvery);
          baseService.custom_period = service.customPeriod.slice(0, -1); // Remove 's' from end
        }
      }

      return baseService;
    });
  };

  if (serviceItems.length === 0) {
    return (
      <div className="flex justify-start">
        <button
          type="button"
          onClick={handleAddService}
          className="flex items-center gap-2 text-zenible-primary hover:text-purple-600 font-medium text-sm transition-colors"
        >
          <PlusIcon className="h-4 w-4" />
          Add Service
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {serviceItems.map((serviceItem, index) => (
        <div key={serviceItem.id} className="space-y-4 p-4 border border-gray-200 rounded-lg bg-gray-50">
          <div className="flex justify-between items-center">
            <h4 className="text-sm font-medium text-gray-900">Service {index + 1}</h4>
            {serviceItems.length > 1 && (
              <button
                type="button"
                onClick={() => handleRemoveService(serviceItem.id)}
                className="text-red-600 hover:text-red-700 transition-colors"
                title="Remove service"
              >
                <TrashIcon className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Service Name with Autocomplete */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-gray-700">Service Name</label>
            <ServiceAutocomplete
              value={serviceItem.name}
              onChange={(value) => handleServiceChange(serviceItem.id, 'name', value)}
              onSelect={(service) => handleServiceSelect(serviceItem.id, service)}
              placeholder="Start typing to select or create service"
            />
          </div>

          {/* Description */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-gray-700">
              Description <span className="text-gray-400 font-normal">(Optional)</span>
            </label>
            <textarea
              value={serviceItem.description}
              onChange={(e) => handleServiceChange(serviceItem.id, 'description', e.target.value)}
              placeholder="Enter service description"
              rows="2"
              className="px-3 py-2 text-sm rounded-md border border-gray-300 bg-white text-gray-900 placeholder:text-gray-400 outline-none focus:border-zenible-primary focus:ring-1 focus:ring-zenible-primary resize-none"
            />
          </div>

          {/* Price Row */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-gray-700">Price</label>
            <div className="flex gap-2">
              {/* Currency Dropdown */}
              <select
                value={serviceItem.currency}
                onChange={(e) => handleServiceChange(serviceItem.id, 'currency', e.target.value)}
                className="flex-shrink-0 w-20 px-3 py-2 text-sm rounded-md border border-gray-300 bg-white text-gray-900 outline-none focus:border-zenible-primary focus:ring-1 focus:ring-zenible-primary cursor-pointer"
              >
                {currencies.map((currency) => (
                  <option key={currency.code} value={currency.code}>
                    {currency.code}
                  </option>
                ))}
              </select>

              {/* Price Input */}
              <input
                type="number"
                value={serviceItem.price}
                onChange={(e) => handleServiceChange(serviceItem.id, 'price', e.target.value)}
                placeholder="0.00"
                step="0.01"
                min="0"
                className="flex-shrink-0 w-28 px-3 py-2 text-sm rounded-md border border-gray-300 bg-white text-gray-900 placeholder:text-gray-400 outline-none focus:border-zenible-primary focus:ring-1 focus:ring-zenible-primary"
              />

              {/* Pricing Type */}
              <select
                value={serviceItem.pricingType}
                onChange={(e) => handleServiceChange(serviceItem.id, 'pricingType', e.target.value)}
                className="flex-1 px-3 py-2 text-sm rounded-md border border-gray-300 bg-white text-gray-900 outline-none focus:border-zenible-primary focus:ring-1 focus:ring-zenible-primary cursor-pointer"
              >
                {pricingTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Recurring Frequency */}
          {serviceItem.pricingType === 'Recurring' && (
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-gray-700">Recurring Frequency</label>
              <select
                value={serviceItem.recurringType}
                onChange={(e) => handleServiceChange(serviceItem.id, 'recurringType', e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-md border border-gray-300 bg-white text-gray-900 outline-none focus:border-zenible-primary focus:ring-1 focus:ring-zenible-primary cursor-pointer"
              >
                {recurringTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Custom Recurring Options */}
          {serviceItem.pricingType === 'Recurring' && serviceItem.recurringType === 'Custom' && (
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-gray-700">Custom Frequency</label>
              <div className="flex gap-2 items-center">
                <span className="text-sm text-gray-700">Every</span>
                <select
                  value={serviceItem.customEvery}
                  onChange={(e) => handleServiceChange(serviceItem.id, 'customEvery', e.target.value)}
                  className="flex-shrink-0 w-16 px-3 py-2 text-sm rounded-md border border-gray-300 bg-white text-gray-900 outline-none focus:border-zenible-primary focus:ring-1 focus:ring-zenible-primary cursor-pointer"
                >
                  {customNumbers.map((num) => (
                    <option key={num} value={num}>
                      {num}
                    </option>
                  ))}
                </select>
                <select
                  value={serviceItem.customPeriod}
                  onChange={(e) => handleServiceChange(serviceItem.id, 'customPeriod', e.target.value)}
                  className="flex-1 px-3 py-2 text-sm rounded-md border border-gray-300 bg-white text-gray-900 outline-none focus:border-zenible-primary focus:ring-1 focus:ring-zenible-primary cursor-pointer"
                >
                  {customPeriods.map((period) => (
                    <option key={period} value={period}>
                      {period}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Contract Duration */}
          {serviceItem.pricingType === 'Recurring' && (
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-gray-700">Contract Duration</label>
              <select
                value={serviceItem.recurringNumber === -1 ? 'infinite' : serviceItem.recurringNumber}
                onChange={(e) => handleServiceChange(serviceItem.id, 'recurringNumber', e.target.value === 'infinite' ? -1 : parseInt(e.target.value))}
                className="w-full px-3 py-2 text-sm rounded-md border border-gray-300 bg-white text-gray-900 outline-none focus:border-zenible-primary focus:ring-1 focus:ring-zenible-primary cursor-pointer"
              >
                <option value="infinite">Infinite</option>
                {Array.from({ length: 12 }, (_, i) => i + 1).map((num) => (
                  <option key={num} value={num}>
                    {num} {serviceItem.recurringType === 'Weekly' ? `week${num > 1 ? 's' : ''}` :
                          serviceItem.recurringType === 'Monthly' ? `month${num > 1 ? 's' : ''}` :
                          serviceItem.recurringType === 'Yearly' ? `year${num > 1 ? 's' : ''}` :
                          serviceItem.recurringType === 'Custom' ?
                            `time${num > 1 ? 's' : ''} (${num * parseInt(serviceItem.customEvery || 1)} ${serviceItem.customPeriod?.toLowerCase() || 'periods'})` :
                          `time${num > 1 ? 's' : ''}`}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Notes */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-gray-700">
              Notes <span className="text-gray-400 font-normal">(Optional)</span>
            </label>
            <textarea
              value={serviceItem.notes || ''}
              onChange={(e) => handleServiceChange(serviceItem.id, 'notes', e.target.value)}
              placeholder="Add notes about this service"
              rows="2"
              className="px-3 py-2 text-sm rounded-md border border-gray-300 bg-white text-gray-900 placeholder:text-gray-400 outline-none focus:border-zenible-primary focus:ring-1 focus:ring-zenible-primary resize-none"
            />
          </div>

          {/* Save Button for new services */}
          {serviceItem.id.toString().startsWith('new-') && serviceItem.name.trim() && (
            <div className="flex justify-end pt-2 border-t border-gray-200">
              <button
                type="button"
                onClick={async () => {
                  if (onAdd) {
                    // Always create a new contact-specific service
                    // Even if selected from autocomplete, we copy the data
                    const serviceData = transformServicesForBackend([serviceItem])[0];
                    await onAdd(serviceData);
                    // Remove this temporary service from the form
                    setServiceItems(prev => prev.filter(s => s.id !== serviceItem.id));
                  }
                }}
                className="px-4 py-2 bg-zenible-primary text-white text-sm font-medium rounded-lg hover:bg-opacity-90 transition-colors"
              >
                Add Service
              </button>
            </div>
          )}

          {/* Save Button for existing modified services */}
          {!serviceItem.id.toString().startsWith('new-') && modifiedServices.has(serviceItem.id) && (
            <div className="flex justify-end pt-2 border-t border-gray-200">
              <button
                type="button"
                onClick={async () => {
                  if (onUpdate && serviceItem.name.trim()) {
                    try {
                      const serviceData = transformServicesForBackend([serviceItem])[0];
                      const updatedService = await onUpdate(serviceItem.id, serviceData);

                      // Update local serviceItems with the response to keep form in sync
                      if (updatedService) {
                        setServiceItems(prev =>
                          prev.map(s => {
                            if (s.id === serviceItem.id) {
                              // Re-map the updated service from backend format to form format
                              return {
                                id: updatedService.id,
                                name: updatedService.name || '',
                                description: updatedService.description || '',
                                price: updatedService.price?.toString() || '',
                                currency: updatedService.currency_code || updatedService.currency?.code || updatedService.currency || defaultCurrency,
                                pricingType: updatedService.frequency_type === 'one_off' ? 'Fixed' : 'Recurring',
                                recurringType: updatedService.time_period === 'weekly' ? 'Weekly' :
                                              updatedService.time_period === 'monthly' ? 'Monthly' :
                                              updatedService.time_period === 'yearly' ? 'Yearly' :
                                              updatedService.time_period === 'custom' ? 'Custom' : 'Weekly',
                                recurringNumber: updatedService.recurring_number !== undefined ? updatedService.recurring_number : -1,
                                customEvery: updatedService.custom_every?.toString() || '1',
                                customPeriod: updatedService.custom_period ? `${updatedService.custom_period}s` : 'Weeks',
                                notes: updatedService.notes || ''
                              };
                            }
                            return s;
                          })
                        );
                      }

                      // Remove from modified set after successful update
                      setModifiedServices(prev => {
                        const next = new Set(prev);
                        next.delete(serviceItem.id);
                        return next;
                      });
                    } catch (error) {
                      console.error('Failed to update service:', error);
                      // Keep in modified set so user can try again
                    }
                  }
                }}
                className="px-4 py-2 bg-zenible-primary text-white text-sm font-medium rounded-lg hover:bg-opacity-90 transition-colors"
              >
                Save Changes
              </button>
            </div>
          )}
        </div>
      ))}

      {/* Add Another Service Button */}
      <button
        type="button"
        onClick={handleAddService}
        className="flex items-center gap-2 text-zenible-primary hover:text-purple-600 font-medium text-sm transition-colors"
      >
        <PlusIcon className="h-4 w-4" />
        Add Another Service
      </button>
    </div>
  );
};

export default InlineServiceForm;
