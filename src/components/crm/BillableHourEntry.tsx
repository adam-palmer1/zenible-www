import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  EllipsisVerticalIcon,
  PencilIcon,
  DocumentDuplicateIcon,
  LinkIcon,
  TrashIcon,
  LockClosedIcon,
} from '@heroicons/react/24/outline';
import { formatCurrency } from '../../utils/currencyUtils';
import { useModalPortal } from '../../contexts/ModalPortalContext';

interface BillableHourEntryProps {
  entry: any;
  currency?: string;
  onEdit?: (entry: any) => void;
  onDuplicate?: (entry: any) => void;
  onDelete?: (entry: any) => void;
  onLinkInvoice?: (entry: any) => void;
  onUnlinkInvoice?: (entry: any) => void;
}

/**
 * Individual billable hour entry card
 */
const BillableHourEntry: React.FC<BillableHourEntryProps> = ({
  entry,
  currency = 'USD',
  onEdit,
  onDuplicate,
  onDelete,
  onLinkInvoice,
  onUnlinkInvoice,
}) => {
  const [showMenu, setShowMenu] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Get modal portal for proper z-index stacking
  const modalPortal = useModalPortal();
  const portalTarget = modalPortal || document.body;

  const isInvoiced = !!entry.invoice_id;
  const isBillable = entry.is_billable;

  // Calculate menu position when opening
  useEffect(() => {
    if (showMenu && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setMenuPosition({
        top: rect.bottom + window.scrollY,
        left: rect.right - 192 + window.scrollX, // 192px = w-48 menu width
      });
    }
  }, [showMenu]);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node) &&
          buttonRef.current && !buttonRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    };

    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showMenu]);

  // Format date
  const formatDate = (dateString: string) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  // Format time
  const formatTime = (dateString: string) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  // Get display date
  const displayDate = formatDate(entry.start_time || entry.created_at);

  // Get time range if available
  const timeRange = entry.start_time && entry.end_time
    ? `${formatTime(entry.start_time)} - ${formatTime(entry.end_time)}`
    : null;

  // Get status badge
  const getStatusBadge = () => {
    if (!isBillable) {
      return (
        <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400">
          Non-billable
        </span>
      );
    }
    if (isInvoiced) {
      return (
        <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
          Invoiced: {entry.invoice?.invoice_number || 'Invoice'}
        </span>
      );
    }
    return (
      <span className="text-xs px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400">
        Uninvoiced
      </span>
    );
  };

  // Created by name
  const createdByName = entry.created_by
    ? `${entry.created_by.first_name || ''} ${entry.created_by.last_name || ''}`.trim()
    : null;

  return (
    <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
      <div className="flex items-start justify-between gap-4">
        {/* Main Content */}
        <div className="flex-1 min-w-0">
          {/* Top Row: Date, Hours, Amount */}
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-sm text-gray-500 dark:text-gray-400">{displayDate}</span>
            <span className="text-sm font-semibold text-gray-900 dark:text-white">
              {entry.hours}h
            </span>
            {entry.amount && isBillable && (
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                {formatCurrency(entry.amount, entry.currency?.code || currency)}
              </span>
            )}
          </div>

          {/* Description */}
          {entry.description && (
            <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">
              {entry.description}
            </p>
          )}

          {/* Bottom Row: Time range, Created by, Status */}
          <div className="flex items-center gap-3 mt-2 flex-wrap">
            {timeRange && (
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {timeRange}
              </span>
            )}
            {createdByName && (
              <span className="text-xs text-gray-500 dark:text-gray-400">
                by {createdByName}
              </span>
            )}
            {getStatusBadge()}
          </div>
        </div>

        {/* Actions Menu */}
        <div className="relative">
          <button
            ref={buttonRef}
            onClick={() => setShowMenu(!showMenu)}
            className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded transition-colors"
            title="Actions"
          >
            {isInvoiced ? (
              <LockClosedIcon className="h-5 w-5 text-gray-400" />
            ) : (
              <EllipsisVerticalIcon className="h-5 w-5" />
            )}
          </button>

          {showMenu && createPortal(
            <div
              style={{ pointerEvents: 'auto', zIndex: 9999 }}
              onMouseDown={(e: React.MouseEvent) => e.stopPropagation()}
              onClick={(e: React.MouseEvent) => e.stopPropagation()}
            >
              {/* Backdrop */}
              <div
                className="fixed inset-0"
                onClick={() => setShowMenu(false)}
              />

              {/* Menu */}
              <div
                ref={menuRef}
                className="fixed w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg py-1"
                style={{
                  top: menuPosition.top,
                  left: menuPosition.left,
                  zIndex: 9999,
                }}
              >
                {/* Edit */}
                <button
                  onClick={() => {
                    setShowMenu(false);
                    onEdit?.(entry);
                  }}
                  disabled={isInvoiced}
                  className={`w-full flex items-center gap-2 px-3 py-2 text-sm text-left ${
                    isInvoiced
                      ? 'text-gray-400 cursor-not-allowed'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                  title={isInvoiced ? 'Unlink from invoice to edit' : 'Edit entry'}
                >
                  <PencilIcon className="h-4 w-4" />
                  Edit
                  {isInvoiced && <LockClosedIcon className="h-3 w-3 ml-auto" />}
                </button>

                {/* Duplicate */}
                <button
                  onClick={() => {
                    setShowMenu(false);
                    onDuplicate?.(entry);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-left text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <DocumentDuplicateIcon className="h-4 w-4" />
                  Duplicate
                </button>

                <div className="border-t border-gray-200 dark:border-gray-700 my-1" />

                {/* Link/Unlink Invoice */}
                {isInvoiced ? (
                  <button
                    onClick={() => {
                      setShowMenu(false);
                      onUnlinkInvoice?.(entry);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-left text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    <LinkIcon className="h-4 w-4" />
                    Unlink from Invoice
                  </button>
                ) : isBillable ? (
                  <button
                    onClick={() => {
                      setShowMenu(false);
                      onLinkInvoice?.(entry);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-left text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    <LinkIcon className="h-4 w-4" />
                    Link to Invoice
                  </button>
                ) : null}

                <div className="border-t border-gray-200 dark:border-gray-700 my-1" />

                {/* Delete */}
                <button
                  onClick={() => {
                    setShowMenu(false);
                    onDelete?.(entry);
                  }}
                  disabled={isInvoiced}
                  className={`w-full flex items-center gap-2 px-3 py-2 text-sm text-left ${
                    isInvoiced
                      ? 'text-gray-400 cursor-not-allowed'
                      : 'text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20'
                  }`}
                  title={isInvoiced ? 'Unlink from invoice to delete' : 'Delete entry'}
                >
                  <TrashIcon className="h-4 w-4" />
                  Delete
                  {isInvoiced && <LockClosedIcon className="h-3 w-3 ml-auto" />}
                </button>
              </div>
            </div>,
            portalTarget
          )}
        </div>
      </div>
    </div>
  );
};

export default BillableHourEntry;
