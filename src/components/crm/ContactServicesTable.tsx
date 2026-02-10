import React from 'react';
import { EllipsisVerticalIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import { formatCurrency } from '../../utils/currencyUtils';
import { SERVICE_STATUS_LABELS, SERVICE_STATUS_COLORS } from '../../constants/crm';
import type { ServiceStatus } from '../../constants/crm';
import { LoadingSpinner } from '../shared';
import Dropdown from '../ui/dropdown/Dropdown';

interface ContactServicesTableProps {
  services?: any[];
  onServiceClick?: (service: any) => void;
  onClientClick?: (client: any) => void;
  onEdit?: (service: any) => void;
  onDelete?: (service: any) => void;
  loading?: boolean;
}

const ContactServicesTable: React.FC<ContactServicesTableProps> = ({
  services = [],
  onServiceClick,
  onClientClick,
  onEdit,
  onDelete,
  loading = false,
}) => {
  if (loading) {
    return <LoadingSpinner size="h-8 w-8" height="py-12" />;
  }

  if (services.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <p>No client services found</p>
        <p className="text-sm mt-1">Services assigned to clients will appear here</p>
      </div>
    );
  }

  // Format frequency display
  const formatFrequency = (service: any) => {
    if (service.frequency_type === 'recurring') {
      if (service.recurring_number === -1) {
        return `${service.time_period || 'Recurring'} (ongoing)`;
      }
      return `${service.time_period || 'Recurring'} x${service.recurring_number}`;
    }
    return 'One-off';
  };

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
                Client
              </th>
              <th className="text-left px-4 py-3 text-sm font-medium text-gray-600 dark:text-gray-400">
                Price
              </th>
              <th className="text-left px-4 py-3 text-sm font-medium text-gray-600 dark:text-gray-400">
                Frequency
              </th>
              <th className="text-left px-4 py-3 text-sm font-medium text-gray-600 dark:text-gray-400">
                Status
              </th>
              <th className="text-right px-4 py-3 text-sm font-medium text-gray-600 dark:text-gray-400">
                Invoiced
              </th>
              <th className="text-right px-4 py-3 text-sm font-medium text-gray-600 dark:text-gray-400">
                Remaining
              </th>
              <th className="w-12 px-4 py-3">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {services.map((service: any, index: number) => (
              <tr
                key={`${service.contact_id}-${service.id}`}
                className={`border-b border-[#e5e5e5] dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 ${
                  index === services.length - 1 ? 'border-b-0' : ''
                } ${onServiceClick ? 'cursor-pointer' : ''}`}
                onClick={() => onServiceClick && onServiceClick(service)}
              >
                <td className="px-4 py-4 whitespace-nowrap">
                  <div className="font-medium text-gray-900 dark:text-white">{service.name}</div>
                  {service.description && (
                    <div className="text-sm text-gray-500 dark:text-gray-400 truncate max-w-xs">
                      {service.description}
                    </div>
                  )}
                </td>
                <td className="px-4 py-4 whitespace-nowrap">
                  <button
                    onClick={(e: React.MouseEvent) => {
                      e.stopPropagation();
                      onClientClick && onClientClick({ id: service.contact_id });
                    }}
                    className="text-sm text-zenible-primary hover:text-purple-600 dark:hover:text-purple-400 hover:underline"
                  >
                    {service.contact_name}
                  </button>
                  {service.contact_business_name && service.contact_name !== service.contact_business_name && (
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {service.contact_business_name}
                    </div>
                  )}
                </td>
                <td className="px-4 py-4 whitespace-nowrap">
                  {service.price ? (
                    <span className="text-sm text-gray-900 dark:text-white">
                      {formatCurrency(parseFloat(service.price), service.currency?.code)}
                    </span>
                  ) : (
                    <span className="text-gray-400">-</span>
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
                    {formatFrequency(service)}
                  </span>
                </td>
                <td className="px-4 py-4 whitespace-nowrap">
                  {service.status && (
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        SERVICE_STATUS_COLORS[service.status as ServiceStatus] || 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {SERVICE_STATUS_LABELS[service.status as ServiceStatus] || service.status}
                    </span>
                  )}
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-right">
                  <span className="text-sm text-gray-900 dark:text-white">
                    {formatCurrency(parseFloat(service.total_invoiced || 0), service.currency?.code)}
                  </span>
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-right">
                  <span className="text-sm text-gray-900 dark:text-white">
                    {formatCurrency(parseFloat(service.amount_remaining || 0), service.currency?.code)}
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

export default ContactServicesTable;
