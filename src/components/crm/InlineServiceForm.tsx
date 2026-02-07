import React, { useState, useEffect, useRef, useCallback } from 'react';
import { PlusIcon, TrashIcon, ChevronDownIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import ServiceAutocomplete from './ServiceAutocomplete';
import GenericDropdown from './GenericDropdown';
import ServiceStatusDropdown from './ServiceStatusDropdown';
import { useServiceEnums } from '../../hooks/crm';

interface InlineServiceFormProps {
  services?: any[];
  currencies?: any[];
  defaultCurrency?: string | null;
  onUpdate?: (serviceId: string, data: any) => Promise<unknown>;
  onAdd?: (data: any) => Promise<void>;
  onRemove?: (service: any) => void;
}

const InlineServiceForm: React.FC<InlineServiceFormProps> = ({
  services = [],
  currencies = [],
  defaultCurrency = null,
  onUpdate,
  onAdd,
  onRemove
}) => {
  const [serviceItems, setServiceItems] = useState<any[]>([]);
  const [modifiedServices, setModifiedServices] = useState<Set<string>>(new Set());
  // Track which services are expanded (by ID) - collapsed by default
  const [expandedServices, setExpandedServices] = useState<Set<string>>(new Set());
  // Track which status dropdown is open (by service ID)
  const [openStatusDropdown, setOpenStatusDropdown] = useState<string | null>(null);
  const statusButtonRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  // Use refs to track initialization without causing re-renders
  const initializedIdsRef = useRef<Set<string>>(new Set());
  const hasInitializedRef = useRef(false);

  // Fetch dynamic service statuses
  const { serviceStatuses, getStatusLabel } = useServiceEnums();

  // Helper to map a backend service to form format
  const mapServiceToForm = useCallback((service: any, index: number) => ({
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
    notes: service.notes || '',
    status: service.status || 'active',
    // Track if service is linked to an invoice (locks pricing fields)
    // Check: is_locked flag, linked_invoice_id, or has been invoiced
    isLinkedToInvoice: service.is_locked || service.linked_invoice_id || parseFloat(service.total_invoiced || 0) > 0
  }), [defaultCurrency]);

  // Tooltip for locked fields
  const lockedTooltip = "Locked for editing while this service is linked to an invoice";

  // Initialize or update services - merge backend changes while preserving unsaved local services
  // This effect handles initialization and syncing with backend, but preserves local unsaved work.
  useEffect(() => {
    // Skip if services is undefined (shouldn't happen but be safe)
    if (!services) return;

    const currentIds = new Set(services.map((s: any) => s.id).filter(Boolean));

    if (!hasInitializedRef.current) {
      // First initialization - just map all services from backend
      setServiceItems(services.map((service: any, index: number) => mapServiceToForm(service, index)));
      initializedIdsRef.current = currentIds as Set<string>;
      hasInitializedRef.current = true;
    } else {
      // Already initialized - merge changes while preserving unsaved local services
      setServiceItems(prev => {
        // Keep all unsaved local services (those with 'new-' prefix)
        const unsavedServices = prev.filter((s: any) => s.id.toString().startsWith('new-'));

        // Map backend services, keeping local form state for existing ones
        const backendServices = services.map((service: any, index: number) => {
          // Check if we have local state for this service
          const existingLocal = prev.find((s: any) => s.id === service.id);
          if (existingLocal) {
            // Keep local state (user might have unsaved edits)
            return existingLocal;
          }
          // New service from backend - map it
          return mapServiceToForm(service, index);
        });

        // Combine: backend services + unsaved local services
        return [...backendServices, ...unsavedServices];
      });

      // Update the tracked IDs (only backend IDs, not local 'new-' ones)
      initializedIdsRef.current = currentIds as Set<string>;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [services]);

  // Constants for form options
  const pricingTypes = ['Fixed', 'Recurring'];
  const recurringTypes = ['Weekly', 'Monthly', 'Yearly', 'Custom'];
  const customPeriods = ['Weeks', 'Months', 'Years'];
  const customNumbers = Array.from({ length: 12 }, (_, i) => i + 1);

  const handleServiceChange = (serviceId: string, field: string, value: any) => {
    setServiceItems(prev =>
      prev.map((service: any) =>
        service.id === serviceId ? { ...service, [field]: value } : service
      )
    );

    // Mark service as modified (only for existing services, not new ones)
    if (!serviceId.toString().startsWith('new-')) {
      setModifiedServices(prev => new Set(prev).add(serviceId));
    }
  };

  const handleAddService = () => {
    const newId = `new-${Date.now()}`;
    const newService = {
      id: newId,
      name: '',
      description: '',
      price: '',
      currency: defaultCurrency,
      pricingType: 'Fixed',
      recurringType: 'Weekly',
      recurringNumber: -1,
      customEvery: '1',
      customPeriod: 'Weeks',
      notes: '',
      status: 'active'
    };
    setServiceItems(prev => [...prev, newService]);
    // Auto-expand new services
    setExpandedServices(prev => new Set(prev).add(newId));
  };

  const toggleServiceExpanded = (serviceId: string) => {
    setExpandedServices(prev => {
      const next = new Set(prev);
      if (next.has(serviceId)) {
        next.delete(serviceId);
      } else {
        next.add(serviceId);
      }
      return next;
    });
  };

  const handleRemoveService = (serviceId: string) => {
    setServiceItems(prev => {
      const updated = prev.filter((service: any) => service.id !== serviceId);

      // Only call onRemove for backend services (not new/temporary ones)
      if (onRemove) {
        const serviceToRemove = prev.find((s: any) => s.id === serviceId);
        if (serviceToRemove && !serviceToRemove.id.toString().startsWith('new-')) {
          onRemove(serviceToRemove);
        }
      }

      return updated;
    });
  };

  const handleServiceSelect = async (serviceId: string, service: any) => {
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

    // Set status (default to active for new contact services)
    handleServiceChange(serviceId, 'status', service.status || 'active');
  };

  const transformServicesForBackend = (svcs: any[]) => {
    return svcs.map((service: any) => {
      const baseService: any = {
        name: service.name.trim(),
        description: service.description || '',
        notes: service.notes || '',
        status: service.status || 'active'
      };

      if (service.price) {
        baseService.price = parseFloat(service.price);
      }

      // Find currency ID
      const currency = currencies.find((c: any) => c.code === service.currency) as { code: string; id: string } | undefined;
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

  // Helper to format price display for collapsed view
  const formatServicePrice = (item: any) => {
    if (!item.price) return null;
    const price = parseFloat(item.price);
    if (isNaN(price)) return null;
    const currencySymbol = item.currency || '';
    const priceStr = `${currencySymbol} ${price.toFixed(2)}`;
    if (item.pricingType === 'Recurring') {
      const freq = item.recurringType === 'Custom'
        ? `Every ${item.customEvery} ${item.customPeriod}`
        : item.recurringType;
      return `${priceStr} / ${freq}`;
    }
    return priceStr;
  };

  return (
    <div className="space-y-2">
      {serviceItems.map((serviceItem: any, index: number) => {
        const isExpanded = expandedServices.has(serviceItem.id);
        const priceDisplay = formatServicePrice(serviceItem);

        return (
          <div key={serviceItem.id} className="border border-gray-200 rounded-lg bg-gray-50 overflow-hidden">
            {/* Collapsible Header */}
            <div
              className="flex items-center justify-between p-3 cursor-pointer hover:bg-gray-100 transition-colors"
              onClick={() => toggleServiceExpanded(serviceItem.id)}
            >
              <div className="flex items-center gap-2 flex-1 min-w-0">
                {isExpanded ? (
                  <ChevronDownIcon className="h-4 w-4 text-gray-500 flex-shrink-0" />
                ) : (
                  <ChevronRightIcon className="h-4 w-4 text-gray-500 flex-shrink-0" />
                )}
                <span className="text-sm font-medium text-gray-900 truncate">
                  {serviceItem.name || `New Service ${index + 1}`}
                </span>
                {!isExpanded && priceDisplay && (
                  <span className="text-sm text-gray-500 flex-shrink-0">
                    — {priceDisplay}
                  </span>
                )}
                {!isExpanded && serviceItem.isLinkedToInvoice && (
                  <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full flex-shrink-0">
                    Invoiced
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={(e: React.MouseEvent) => {
                  e.stopPropagation();
                  handleRemoveService(serviceItem.id);
                }}
                className="text-gray-400 hover:text-red-600 transition-colors p-1"
                title="Remove service"
              >
                <TrashIcon className="h-4 w-4" />
              </button>
            </div>

            {/* Expanded Content */}
            {isExpanded && (
              <div className="p-4 pt-2 space-y-4 border-t border-gray-200">
                {/* Service Name with Autocomplete */}
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium text-gray-700">Service Name</label>
                  <ServiceAutocomplete
                    value={serviceItem.name}
                    onChange={(value: any) => handleServiceChange(serviceItem.id, 'name', value)}
                    onSelect={(service: any) => handleServiceSelect(serviceItem.id, service)}
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
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => handleServiceChange(serviceItem.id, 'description', e.target.value)}
                    placeholder="Enter service description"
                    rows={2}
                    className="px-3 py-2 text-sm rounded-md border border-gray-300 bg-white text-gray-900 placeholder:text-gray-400 outline-none focus:border-zenible-primary focus:ring-1 focus:ring-zenible-primary resize-none"
                  />
                </div>

                {/* Price Row */}
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium text-gray-700">
                    Price
                    {serviceItem.isLinkedToInvoice && (
                      <span className="ml-2 text-xs text-gray-400 font-normal">(Locked)</span>
                    )}
                  </label>
                  <div
                    className="flex gap-2"
                    title={serviceItem.isLinkedToInvoice ? lockedTooltip : undefined}
                  >
                    {/* Currency Dropdown */}
                    <GenericDropdown
                      value={serviceItem.currency}
                      onChange={(value: any) => handleServiceChange(serviceItem.id, 'currency', value)}
                      options={currencies.map((c: any) => ({ value: c.code, label: c.code }))}
                      placeholder="Currency"
                      className="flex-shrink-0 w-24"
                      disabled={serviceItem.isLinkedToInvoice}
                    />

                    {/* Price Input */}
                    <input
                      type="number"
                      value={serviceItem.price}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleServiceChange(serviceItem.id, 'price', e.target.value)}
                      placeholder="0.00"
                      step="0.01"
                      min="0"
                      disabled={serviceItem.isLinkedToInvoice}
                      className={`flex-shrink-0 w-28 px-3 py-2 text-sm rounded-md border border-gray-300 bg-white text-gray-900 placeholder:text-gray-400 outline-none focus:border-zenible-primary focus:ring-1 focus:ring-zenible-primary ${serviceItem.isLinkedToInvoice ? 'opacity-50 cursor-not-allowed bg-gray-100' : ''}`}
                    />

                    {/* Pricing Type */}
                    <GenericDropdown
                      value={serviceItem.pricingType}
                      onChange={(value: any) => handleServiceChange(serviceItem.id, 'pricingType', value)}
                      options={pricingTypes}
                      placeholder="Type"
                      className="flex-1"
                      disabled={serviceItem.isLinkedToInvoice}
                    />
                  </div>
                </div>

                {/* Recurring Frequency */}
                {serviceItem.pricingType === 'Recurring' && (
                  <div
                    className="flex flex-col gap-2"
                    title={serviceItem.isLinkedToInvoice ? lockedTooltip : undefined}
                  >
                    <label className="text-sm font-medium text-gray-700">Recurring Frequency</label>
                    <GenericDropdown
                      value={serviceItem.recurringType}
                      onChange={(value: any) => handleServiceChange(serviceItem.id, 'recurringType', value)}
                      options={recurringTypes}
                      placeholder="Select frequency"
                      disabled={serviceItem.isLinkedToInvoice}
                    />
                  </div>
                )}

                {/* Custom Recurring Options */}
                {serviceItem.pricingType === 'Recurring' && serviceItem.recurringType === 'Custom' && (
                  <div
                    className="flex flex-col gap-2"
                    title={serviceItem.isLinkedToInvoice ? lockedTooltip : undefined}
                  >
                    <label className="text-sm font-medium text-gray-700">Custom Frequency</label>
                    <div className="flex gap-2 items-center">
                      <span className="text-sm text-gray-700">Every</span>
                      <GenericDropdown
                        value={serviceItem.customEvery}
                        onChange={(value: any) => handleServiceChange(serviceItem.id, 'customEvery', value)}
                        options={customNumbers.map(num => ({ value: String(num), label: String(num) }))}
                        placeholder="1"
                        className="flex-shrink-0 w-20"
                        disabled={serviceItem.isLinkedToInvoice}
                      />
                      <GenericDropdown
                        value={serviceItem.customPeriod}
                        onChange={(value: any) => handleServiceChange(serviceItem.id, 'customPeriod', value)}
                        options={customPeriods}
                        placeholder="Period"
                        className="flex-1"
                        disabled={serviceItem.isLinkedToInvoice}
                      />
                    </div>
                  </div>
                )}

                {/* Contract Duration */}
                {serviceItem.pricingType === 'Recurring' && (
                  <div
                    className="flex flex-col gap-2"
                    title={serviceItem.isLinkedToInvoice ? lockedTooltip : undefined}
                  >
                    <label className="text-sm font-medium text-gray-700">
                      Contract Duration
                      {serviceItem.isLinkedToInvoice && (
                        <span className="ml-2 text-xs text-gray-400 font-normal">(Locked)</span>
                      )}
                    </label>
                    <GenericDropdown
                      value={serviceItem.recurringNumber === -1 ? 'infinite' : String(serviceItem.recurringNumber)}
                      onChange={(value: any) => handleServiceChange(serviceItem.id, 'recurringNumber', value === 'infinite' ? -1 : parseInt(value))}
                      options={[
                        { value: 'infinite', label: 'Infinite' },
                        ...Array.from({ length: 12 }, (_, i) => {
                          const num = i + 1;
                          const label = serviceItem.recurringType === 'Weekly' ? `${num} week${num > 1 ? 's' : ''}` :
                                        serviceItem.recurringType === 'Monthly' ? `${num} month${num > 1 ? 's' : ''}` :
                                        serviceItem.recurringType === 'Yearly' ? `${num} year${num > 1 ? 's' : ''}` :
                                        serviceItem.recurringType === 'Custom' ?
                                          `${num} time${num > 1 ? 's' : ''} (${num * parseInt(serviceItem.customEvery || 1)} ${serviceItem.customPeriod?.toLowerCase() || 'periods'})` :
                                        `${num} time${num > 1 ? 's' : ''}`;
                          return { value: String(num), label };
                        })
                      ]}
                      placeholder="Select duration"
                      disabled={serviceItem.isLinkedToInvoice}
                    />
                  </div>
                )}

                {/* Notes */}
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium text-gray-700">
                    Notes <span className="text-gray-400 font-normal">(Optional)</span>
                  </label>
                  <textarea
                    value={serviceItem.notes || ''}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => handleServiceChange(serviceItem.id, 'notes', e.target.value)}
                    placeholder="Add notes about this service"
                    rows={2}
                    className="px-3 py-2 text-sm rounded-md border border-gray-300 bg-white text-gray-900 placeholder:text-gray-400 outline-none focus:border-zenible-primary focus:ring-1 focus:ring-zenible-primary resize-none"
                  />
                </div>

                {/* Status */}
                <div className="flex flex-col gap-2 relative">
                  <label className="text-sm font-medium text-gray-700">Status</label>
                  <button
                    ref={(el) => { statusButtonRefs.current[serviceItem.id] = el; }}
                    type="button"
                    onClick={() => setOpenStatusDropdown(openStatusDropdown === serviceItem.id ? null : serviceItem.id)}
                    className="w-full px-3 py-2 text-sm rounded-md border border-gray-300 bg-white text-left flex items-center justify-between outline-none focus:border-zenible-primary focus:ring-1 focus:ring-zenible-primary cursor-pointer hover:border-gray-400"
                  >
                    <span className="text-gray-900">
                      {getStatusLabel(serviceItem.status || 'active')}
                    </span>
                    <svg className={`h-4 w-4 text-gray-400 transition-transform ${openStatusDropdown === serviceItem.id ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  <ServiceStatusDropdown
                    isOpen={openStatusDropdown === serviceItem.id}
                    onClose={() => setOpenStatusDropdown(null)}
                    onSelect={(value: any) => handleServiceChange(serviceItem.id, 'status', value)}
                    selectedStatus={serviceItem.status || 'active'}
                    statuses={serviceStatuses}
                    anchorRef={{ current: statusButtonRefs.current[serviceItem.id] } as React.RefObject<HTMLElement>}
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
                          setServiceItems(prev => prev.filter((s: any) => s.id !== serviceItem.id));
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
                  <div className="flex flex-col gap-2 pt-2 border-t border-gray-200">
                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={async () => {
                          if (onUpdate && serviceItem.name.trim()) {
                            try {
                              const serviceData = transformServicesForBackend([serviceItem])[0];
                              await onUpdate(serviceItem.id, serviceData);

                              // Don't re-map from backend response - keep current form state
                              // The form already has the correct data from user input
                              // Just remove from modified set after successful update
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
                    {serviceItem.isLinkedToInvoice && (
                      <p className="text-xs text-gray-500 text-right">
                        This service is linked to an invoice. Changing these details will not change the invoice.
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}

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
