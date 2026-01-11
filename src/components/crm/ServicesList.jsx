import React from 'react';
import { TrashIcon, PencilIcon } from '@heroicons/react/24/outline';
import EstimatedValue from './EstimatedValue';
import { formatCurrency } from '../../utils/currencyUtils';

/**
 * Component to display list of services assigned to a contact
 */
const ServicesList = ({ services = [], onEdit, onDelete }) => {
  if (services.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>No services assigned</p>
        <p className="text-sm mt-1">Add services to track value</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-medium text-gray-900">Services</h3>
        <EstimatedValue services={services} />
      </div>

      {services.map((service) => (
        <div
          key={service.id}
          className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <div className="flex-1 min-w-0">
            <p className="font-medium text-gray-900 truncate">{service.name}</p>
            {service.description && (
              <p className="text-sm text-gray-500 truncate">{service.description}</p>
            )}
            <div className="flex items-center gap-2 mt-1">
              {service.price && (
                <span className="text-sm text-gray-600">
                  {formatCurrency(parseFloat(service.price), service.currency?.code)}
                </span>
              )}
              {service.frequency_type === 'recurring' && (
                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
                  {service.time_period}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 ml-2">
            {onEdit && (
              <button
                onClick={() => onEdit(service)}
                className="p-1 text-gray-400 hover:text-zenible-primary transition-colors"
                title="Edit service"
              >
                <PencilIcon className="h-4 w-4" />
              </button>
            )}
            {onDelete && (
              <button
                onClick={() => onDelete(service)}
                className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                title="Remove service"
              >
                <TrashIcon className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default ServicesList;
