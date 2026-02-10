import React from 'react';
import { TrashIcon, PencilIcon, LinkIcon } from '@heroicons/react/24/outline';
import EstimatedValue from './EstimatedValue';
import ConfirmationModal from '../common/ConfirmationModal';
import { formatCurrency } from '../../utils/currencyUtils';
import { SERVICE_STATUS_LABELS, SERVICE_STATUS_COLORS } from '../../constants/crm';
import type { ServiceStatus } from '../../constants/crm';
import { useDeleteConfirmation } from '../../hooks/useDeleteConfirmation';

/**
 * Calculate progress percentage for a service based on attributed and invoiced amounts
 */
const getServiceProgress = (service: any) => {
  const price = parseFloat(service.price) || 0;
  if (price === 0) return null;

  const totalAttributed = parseFloat(service.total_attributed) || 0;
  const totalInvoiced = parseFloat(service.total_invoiced) || 0;
  const amountRemaining = parseFloat(service.amount_remaining) ?? price;

  const attributedPercent = (totalAttributed / price) * 100;
  const invoicedPercent = (totalInvoiced / price) * 100;
  const totalPercent = attributedPercent + invoicedPercent;

  return {
    totalAttributed,
    totalInvoiced,
    amountRemaining,
    attributedPercent,
    invoicedPercent,
    totalPercent,
    hasProgress: totalAttributed > 0 || totalInvoiced > 0,
  };
};

interface ServicesListProps {
  services?: any[];
  onEdit?: (service: any) => void;
  onDelete?: (service: any) => void;
  onServiceClick?: (service: any) => void;
}

/**
 * Component to display list of services assigned to a contact
 */
const ServicesList: React.FC<ServicesListProps> = ({ services = [], onEdit, onDelete, onServiceClick }) => {
  const deleteConfirmation = useDeleteConfirmation<any>();

  const handleDeleteClick = (service: any) => {
    deleteConfirmation.requestDelete(service);
  };

  const handleConfirmDelete = async () => {
    await deleteConfirmation.confirmDelete(async (service) => {
      if (onDelete) {
        onDelete(service);
      }
    });
  };

  if (services.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>No services assigned</p>
        <p className="text-sm mt-1">Add services to track value</p>
      </div>
    );
  }

  return (
    <>
    <div className="space-y-2">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-medium text-gray-900">Services</h3>
        <EstimatedValue services={services} />
      </div>

      {services.map((service: any) => {
        const progress = getServiceProgress(service);

        return (
          <div
            key={service.id}
            className={`p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors ${onServiceClick ? 'cursor-pointer' : ''}`}
            onClick={() => onServiceClick?.(service)}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-medium text-gray-900 dark:text-white truncate">{service.name}</p>
                  {/* Status Badge */}
                  {service.status && (
                    <span className={`text-xs px-2 py-0.5 rounded-full ${SERVICE_STATUS_COLORS[service.status as ServiceStatus] || 'bg-gray-100 text-gray-800'}`}>
                      {SERVICE_STATUS_LABELS[service.status as ServiceStatus] || service.status}
                    </span>
                  )}
                  {/* Locked Badge */}
                  {service.is_locked && (
                    <span className="text-xs bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <LinkIcon className="h-3 w-3" />
                      Linked
                    </span>
                  )}
                </div>
                {service.description && (
                  <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{service.description}</p>
                )}
                <div className="flex items-center gap-2 mt-1">
                  {service.price && (
                    <span className="text-sm text-gray-600 dark:text-gray-300">
                      {formatCurrency(parseFloat(service.price), service.currency?.code)}
                    </span>
                  )}
                  {service.frequency_type === 'recurring' && (
                    <span className="text-xs bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 px-2 py-0.5 rounded">
                      {service.time_period}
                    </span>
                  )}
                  {/* Remaining Amount Text */}
                  {progress?.hasProgress && (
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      Remaining: {formatCurrency(progress.amountRemaining, service.currency?.code)}
                    </span>
                  )}
                </div>

                {/* Progress Bar */}
                {progress?.hasProgress && (
                  <div className="mt-2 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div className="h-full flex">
                      {/* Invoiced portion (green) */}
                      {progress.invoicedPercent > 0 && (
                        <div
                          className="bg-green-500 h-full"
                          style={{ width: `${Math.min(progress.invoicedPercent, 100)}%` }}
                          title={`Invoiced: ${formatCurrency(progress.totalInvoiced, service.currency?.code)}`}
                        />
                      )}
                      {/* Attributed portion (blue) */}
                      {progress.attributedPercent > 0 && (
                        <div
                          className="bg-blue-500 h-full"
                          style={{ width: `${Math.min(progress.attributedPercent, 100 - progress.invoicedPercent)}%` }}
                          title={`Attributed: ${formatCurrency(progress.totalAttributed, service.currency?.code)}`}
                        />
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2 ml-2" onClick={(e: React.MouseEvent) => e.stopPropagation()}>
                {onEdit && (
                  <button
                    onClick={() => !service.is_locked && onEdit(service)}
                    disabled={service.is_locked}
                    className={`p-1 transition-colors ${
                      service.is_locked
                        ? 'text-gray-300 dark:text-gray-600 cursor-not-allowed'
                        : 'text-gray-400 hover:text-zenible-primary'
                    }`}
                    title={service.is_locked ? 'Service is linked to a template' : 'Edit service'}
                  >
                    <PencilIcon className="h-4 w-4" />
                  </button>
                )}
                {onDelete && !service.is_locked && (
                  <button
                    onClick={() => handleDeleteClick(service)}
                    className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                    title="Remove service"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>

    <ConfirmationModal
      isOpen={deleteConfirmation.isOpen}
      onClose={deleteConfirmation.cancelDelete}
      onConfirm={handleConfirmDelete}
      title="Remove Service?"
      message={
        <p>
          Are you sure you want to remove "{deleteConfirmation.item?.name}" from this contact?
        </p>
      }
      confirmText="Remove"
      cancelText="Cancel"
      confirmColor="red"
      icon={TrashIcon}
      iconColor="text-red-600"
    />
    </>
  );
};

export default ServicesList;
