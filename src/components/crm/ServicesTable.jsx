import React from 'react';
import { PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import { formatCurrency } from '../../utils/currencyUtils';

/**
 * Component to display services catalog in a table view
 */
const ServicesTable = ({ services = [], onEdit, onDelete, loading = false }) => {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (services.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <p>No services found</p>
        <p className="text-sm mt-1">Create your first service to get started</p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-900 rounded-lg border border-[#e5e5e5] dark:border-gray-700">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[#e5e5e5] dark:border-gray-700">
              <th className="text-left px-4 py-3 text-sm font-medium text-gray-600 dark:text-gray-400">
                Service Name
              </th>
              <th className="text-left px-4 py-3 text-sm font-medium text-gray-600 dark:text-gray-400">
                Description
              </th>
              <th className="text-left px-4 py-3 text-sm font-medium text-gray-600 dark:text-gray-400">
                Price
              </th>
              <th className="text-left px-4 py-3 text-sm font-medium text-gray-600 dark:text-gray-400">
                Frequency
              </th>
              <th className="text-right px-4 py-3 text-sm font-medium text-gray-600 dark:text-gray-400">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
          {services.map((service, index) => (
            <tr key={service.id} className={`border-b border-[#e5e5e5] dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 ${index === services.length - 1 ? 'border-b-0' : ''}`}>
              <td className="px-4 py-4 whitespace-nowrap">
                <div className="font-medium text-gray-900 dark:text-white">{service.name}</div>
              </td>
              <td className="px-4 py-4">
                <div className="text-sm text-gray-600 dark:text-gray-400 max-w-md truncate">
                  {service.description || '-'}
                </div>
              </td>
              <td className="px-4 py-4 whitespace-nowrap">
                {service.price ? (
                  <span className="text-sm text-gray-900 dark:text-white">
                    {formatCurrency(parseFloat(service.price), service.currency?.code)}
                  </span>
                ) : (
                  <span className="text-gray-600 dark:text-gray-400">-</span>
                )}
              </td>
              <td className="px-4 py-4 whitespace-nowrap">
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    service.frequency_type === 'recurring'
                      ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
                      : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'
                  }`}
                >
                  {service.frequency_type === 'recurring'
                    ? service.time_period || 'Recurring'
                    : 'One-off'}
                </span>
              </td>
              <td className="px-4 py-4 whitespace-nowrap text-right text-sm font-medium">
                <div className="flex items-center justify-end gap-2">
                  {onEdit && (
                    <button
                      onClick={() => onEdit(service)}
                      className="text-zenible-primary hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
                      title="Edit service"
                    >
                      <PencilIcon className="h-5 w-5" />
                    </button>
                  )}
                  {onDelete && (
                    <button
                      onClick={() => onDelete(service)}
                      className="text-red-600 hover:text-red-900 dark:hover:text-red-400 transition-colors"
                      title="Delete service"
                    >
                      <TrashIcon className="h-5 w-5" />
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      </div>
    </div>
  );
};

export default ServicesTable;
