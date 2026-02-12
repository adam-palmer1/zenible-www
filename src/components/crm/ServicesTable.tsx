import React from 'react';
import { EllipsisVerticalIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import { formatCurrency } from '../../utils/currencyUtils';
import { LoadingSpinner } from '../shared';
import Dropdown from '../ui/dropdown/Dropdown';

interface ServicesTableProps {
  services?: any[];
  onEdit?: (service: any) => void;
  onDelete?: (service: any) => void;
  loading?: boolean;
}

/**
 * Component to display services catalog in a table view
 */
const ServicesTable: React.FC<ServicesTableProps> = ({ services = [], onEdit, onDelete, loading = false }) => {
  if (loading) {
    return <LoadingSpinner size="h-8 w-8" height="py-12" />;
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
              <th className="w-12 px-4 py-3">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody>
          {services.map((service: any, index: number) => (
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
                <span className="text-sm text-gray-900 dark:text-white">
                  {service.frequency_type === 'recurring'
                    ? service.time_period || 'Recurring'
                    : 'One-off'}
                </span>
              </td>
              <td className="px-4 py-4 whitespace-nowrap text-right">
                {(onEdit || onDelete) && (
                  <Dropdown
                    trigger={
                      <button
                        onClick={(e: React.MouseEvent) => e.stopPropagation()}
                        className="text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                        aria-label="Service actions"
                      >
                        <EllipsisVerticalIcon className="h-5 w-5" />
                      </button>
                    }
                    align="end"
                    side="bottom"
                  >
                    {onEdit && (
                      <Dropdown.Item
                        onSelect={(e: Event) => {
                          e.stopPropagation();
                          onEdit(service);
                        }}
                      >
                        <PencilIcon className="h-4 w-4" />
                        Edit Service
                      </Dropdown.Item>
                    )}
                    {onDelete && (
                      <Dropdown.Item
                        onSelect={(e: Event) => {
                          e.stopPropagation();
                          onDelete(service);
                        }}
                        destructive
                      >
                        <TrashIcon className="h-4 w-4" />
                        Delete Service
                      </Dropdown.Item>
                    )}
                  </Dropdown>
                )}
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
