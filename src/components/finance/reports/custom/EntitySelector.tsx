import React from 'react';
import {
  FileText,
  FileCheck,
  FileMinus,
  Receipt,
  CreditCard,
  Clock,
  Users,
} from 'lucide-react';
import { useCustomReports } from '@/contexts/CustomReportsContext';
import {
  ENTITY_TYPE_LABELS,
  ENTITY_TYPE_COLORS,
  type ReportEntityType,
} from '@/types/customReport';
import type { LucideIcon } from 'lucide-react';

const ENTITY_ICONS: Record<ReportEntityType, LucideIcon> = {
  invoice: FileText,
  quote: FileCheck,
  credit_note: FileMinus,
  expense: Receipt,
  payment: CreditCard,
  billable_hour: Clock,
  contact_service: Users,
};

const ALL_ENTITY_TYPES: ReportEntityType[] = [
  'invoice',
  'quote',
  'credit_note',
  'expense',
  'payment',
  'billable_hour',
  'contact_service',
];

const EntitySelector: React.FC = () => {
  const { configuration, availableColumns, addEntity, removeEntity } = useCustomReports();

  const selectedTypes = new Set(configuration.entity_selections.map((s) => s.entity_type));

  const handleToggle = (entityType: ReportEntityType) => {
    if (selectedTypes.has(entityType)) {
      removeEntity(entityType);
    } else {
      const entityMeta = availableColumns?.entities.find((e) => e.entity_type === entityType);
      const defaultColumns = entityMeta
        ? entityMeta.columns.filter((c) => c.is_default).map((c) => c.key)
        : [];

      addEntity({
        entity_type: entityType,
        columns: defaultColumns,
      });
    }
  };

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">Select Entities</label>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
        {ALL_ENTITY_TYPES.map((entityType) => {
          const isSelected = selectedTypes.has(entityType);
          const colors = ENTITY_TYPE_COLORS[entityType];
          const Icon = ENTITY_ICONS[entityType];

          return (
            <button
              key={entityType}
              type="button"
              onClick={() => handleToggle(entityType)}
              className={`flex items-center gap-2 px-3 py-2.5 rounded-lg border text-sm font-medium transition-all ${
                isSelected
                  ? `${colors.bg} ${colors.text} border-current`
                  : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50'
              }`}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              {ENTITY_TYPE_LABELS[entityType]}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default EntitySelector;
