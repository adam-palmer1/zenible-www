import React, { useState } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  Bars3Icon,
  PencilIcon,
  XMarkIcon,
  PlusIcon,
  CheckIcon,
} from '@heroicons/react/24/outline';
import companiesAPI from '../../../../services/api/crm/companies';
import { useNotification } from '../../../../contexts/NotificationContext';
import ConfirmationModal from '../../../common/ConfirmationModal';

/**
 * Sortable Tax Item Component
 */
const SortableTaxItem = ({
  tax,
  isEditing,
  editForm,
  setEditForm,
  onStartEdit,
  onSaveEdit,
  onCancelEdit,
  onDelete,
  loading,
  formatRate,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: tax.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 ${
        isDragging ? 'shadow-lg ring-2 ring-blue-500' : ''
      }`}
    >
      {/* Drag Handle */}
      <div
        {...attributes}
        {...listeners}
        className="cursor-grab text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
      >
        <Bars3Icon className="h-5 w-5" />
      </div>

      {/* Content */}
      {isEditing ? (
        // Edit Mode
        <div className="flex-1 flex items-center gap-3">
          <input
            type="text"
            value={editForm.tax_name}
            onChange={(e) =>
              setEditForm((prev) => ({
                ...prev,
                tax_name: e.target.value,
              }))
            }
            className="flex-1 px-2 py-1 text-sm border border-gray-300 dark:border-gray-500 rounded focus:ring-2 focus:ring-blue-500 dark:bg-gray-600 dark:text-white"
            placeholder="Tax name"
            maxLength={100}
          />
          <div className="flex items-center gap-1">
            <input
              type="number"
              value={editForm.tax_rate}
              onChange={(e) =>
                setEditForm((prev) => ({
                  ...prev,
                  tax_rate: e.target.value,
                }))
              }
              className="w-20 px-2 py-1 text-sm border border-gray-300 dark:border-gray-500 rounded focus:ring-2 focus:ring-blue-500 dark:bg-gray-600 dark:text-white"
              placeholder="Rate"
              min="0"
              max="100"
              step="0.01"
            />
            <span className="text-gray-500 dark:text-gray-400">%</span>
          </div>
          <button
            onClick={() => onSaveEdit(tax.id)}
            disabled={loading}
            className="p-1 text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-300"
            title="Save"
          >
            <CheckIcon className="h-5 w-5" />
          </button>
          <button
            onClick={onCancelEdit}
            className="p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
            title="Cancel"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>
      ) : (
        // View Mode
        <>
          <div className="flex-1">
            <span className="font-medium text-gray-900 dark:text-white">
              {tax.tax_name}
            </span>
          </div>
          <span className="text-gray-600 dark:text-gray-300 font-mono">
            {formatRate(tax.tax_rate)}%
          </span>
          <button
            onClick={() => onStartEdit(tax)}
            className="p-1 text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400"
            title="Edit"
          >
            <PencilIcon className="h-4 w-4" />
          </button>
          <button
            onClick={() => onDelete(tax.id)}
            disabled={loading}
            className="p-1 text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400"
            title="Delete"
          >
            <XMarkIcon className="h-4 w-4" />
          </button>
        </>
      )}
    </div>
  );
};

/**
 * TaxesSection - Manages multiple company taxes with drag-to-reorder
 */
const TaxesSection = ({ initialTaxes = [], onTaxesChange }) => {
  const [taxes, setTaxes] = useState(
    [...initialTaxes].sort((a, b) => a.sort_order - b.sort_order)
  );
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ tax_name: '', tax_rate: '' });
  const [newTax, setNewTax] = useState({ tax_name: '', tax_rate: '' });
  const [loading, setLoading] = useState(false);
  const [addingTax, setAddingTax] = useState(false);
  const [deleteConfirmModal, setDeleteConfirmModal] = useState({ isOpen: false, taxId: null });

  const { showSuccess, showError } = useNotification();

  // Configure sensors for drag detection
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleAddTax = async () => {
    if (!newTax.tax_name.trim() || newTax.tax_rate === '') {
      showError('Please enter both tax name and rate');
      return;
    }

    const rate = parseFloat(newTax.tax_rate);
    if (isNaN(rate) || rate < 0 || rate > 100) {
      showError('Tax rate must be between 0 and 100');
      return;
    }

    setAddingTax(true);
    try {
      const created = await companiesAPI.createTax({
        tax_name: newTax.tax_name.trim(),
        tax_rate: rate,
        sort_order: taxes.length,
      });
      const updatedTaxes = [...taxes, created];
      setTaxes(updatedTaxes);
      setNewTax({ tax_name: '', tax_rate: '' });
      onTaxesChange?.(updatedTaxes);
      showSuccess('Tax added successfully');
    } catch (error) {
      showError(error.message || 'Failed to add tax');
    } finally {
      setAddingTax(false);
    }
  };

  const handleStartEdit = (tax) => {
    setEditingId(tax.id);
    setEditForm({
      tax_name: tax.tax_name,
      tax_rate: tax.tax_rate,
    });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditForm({ tax_name: '', tax_rate: '' });
  };

  const handleSaveEdit = async (taxId) => {
    if (!editForm.tax_name.trim() || editForm.tax_rate === '') {
      showError('Please enter both tax name and rate');
      return;
    }

    const rate = parseFloat(editForm.tax_rate);
    if (isNaN(rate) || rate < 0 || rate > 100) {
      showError('Tax rate must be between 0 and 100');
      return;
    }

    setLoading(true);
    try {
      const updated = await companiesAPI.updateTax(taxId, {
        tax_name: editForm.tax_name.trim(),
        tax_rate: rate,
      });
      const updatedTaxes = taxes.map((t) => (t.id === taxId ? updated : t));
      setTaxes(updatedTaxes);
      setEditingId(null);
      onTaxesChange?.(updatedTaxes);
      showSuccess('Tax updated successfully');
    } catch (error) {
      showError(error.message || 'Failed to update tax');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (taxId) => {
    setDeleteConfirmModal({ isOpen: true, taxId });
  };

  const confirmDeleteTax = async () => {
    const taxId = deleteConfirmModal.taxId;
    if (!taxId) return;

    setLoading(true);
    try {
      await companiesAPI.deleteTax(taxId);
      const updatedTaxes = taxes.filter((t) => t.id !== taxId);
      setTaxes(updatedTaxes);
      onTaxesChange?.(updatedTaxes);
      showSuccess('Tax deleted successfully');
    } catch (error) {
      showError(error.message || 'Failed to delete tax');
    } finally {
      setLoading(false);
      setDeleteConfirmModal({ isOpen: false, taxId: null });
    }
  };

  const handleDragEnd = async (event) => {
    const { active, over } = event;

    if (!over || active.id === over.id) return;

    const oldIndex = taxes.findIndex((t) => t.id === active.id);
    const newIndex = taxes.findIndex((t) => t.id === over.id);

    const reordered = arrayMove(taxes, oldIndex, newIndex);

    // Update sort_order for all items
    const withNewOrder = reordered.map((tax, index) => ({
      ...tax,
      sort_order: index,
    }));

    setTaxes(withNewOrder);

    try {
      await companiesAPI.reorderTaxes(
        withNewOrder.map((t) => ({ id: t.id, sort_order: t.sort_order }))
      );
      onTaxesChange?.(withNewOrder);
    } catch (error) {
      // Revert on failure
      setTaxes(taxes);
      showError(error.message || 'Failed to reorder taxes');
    }
  };

  const formatRate = (rate) => {
    const num = parseFloat(rate);
    return isNaN(num) ? '0.00' : num.toFixed(2);
  };

  // Tax IDs for sortable context
  const taxIds = taxes.map((t) => t.id);

  return (
    <div className="space-y-4">
      {/* Tax List */}
      {taxes.length > 0 ? (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={taxIds} strategy={verticalListSortingStrategy}>
            <div className="space-y-2">
              {taxes.map((tax) => (
                <SortableTaxItem
                  key={tax.id}
                  tax={tax}
                  isEditing={editingId === tax.id}
                  editForm={editForm}
                  setEditForm={setEditForm}
                  onStartEdit={handleStartEdit}
                  onSaveEdit={handleSaveEdit}
                  onCancelEdit={handleCancelEdit}
                  onDelete={handleDelete}
                  loading={loading}
                  formatRate={formatRate}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      ) : (
        <div className="text-center py-4 text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-700 rounded-lg">
          No taxes configured yet
        </div>
      )}

      {/* Add New Tax Form */}
      <div className="flex items-center gap-3 p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg">
        <input
          type="text"
          value={newTax.tax_name}
          onChange={(e) =>
            setNewTax((prev) => ({ ...prev, tax_name: e.target.value }))
          }
          className="flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
          placeholder="Tax name (e.g., VAT, GST)"
          maxLength={100}
        />
        <div className="flex items-center gap-1">
          <input
            type="number"
            value={newTax.tax_rate}
            onChange={(e) =>
              setNewTax((prev) => ({ ...prev, tax_rate: e.target.value }))
            }
            className="w-24 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            placeholder="Rate"
            min="0"
            max="100"
            step="0.01"
          />
          <span className="text-gray-500 dark:text-gray-400">%</span>
        </div>
        <button
          onClick={handleAddTax}
          disabled={addingTax || !newTax.tax_name.trim() || newTax.tax_rate === ''}
          className="flex items-center gap-1 px-4 py-2 bg-zenible-primary text-white rounded-lg hover:bg-opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <PlusIcon className="h-4 w-4" />
          {addingTax ? 'Adding...' : 'Add Tax'}
        </button>
      </div>

      <ConfirmationModal
        isOpen={deleteConfirmModal.isOpen}
        onClose={() => setDeleteConfirmModal({ isOpen: false, taxId: null })}
        onConfirm={confirmDeleteTax}
        title="Delete Tax"
        message="Are you sure you want to delete this tax?"
        confirmText="Delete"
        cancelText="Cancel"
        confirmColor="red"
      />
    </div>
  );
};

export default TaxesSection;
