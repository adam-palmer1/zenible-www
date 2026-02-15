import React from 'react';
import { formatCurrency } from '@/utils/currency';
import type { EntityQueryResultResponse, ColumnDataType } from '@/types/customReport';
import AggregationBar from './AggregationBar';

interface ResultsEntityTabProps {
  result: EntityQueryResultResponse;
  onPageChange: (page: number) => void;
}

function formatCellValue(value: unknown, dataType: ColumnDataType): React.ReactNode {
  if (value === null || value === undefined) {
    return <span className="text-gray-400">--</span>;
  }

  switch (dataType) {
    case 'currency':
      return formatCurrency(value as number);

    case 'date':
      return new Date(value as string).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });

    case 'datetime':
      return new Date(value as string).toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      });

    case 'boolean':
      return (
        <span
          className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
            value ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
          }`}
        >
          {value ? 'Yes' : 'No'}
        </span>
      );

    case 'number':
      return typeof value === 'number' ? value.toLocaleString() : String(value);

    case 'enum':
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700">
          {String(value).replace(/_/g, ' ')}
        </span>
      );

    default:
      return String(value);
  }
}

const ResultsEntityTab: React.FC<ResultsEntityTabProps> = ({ result, onPageChange }) => {
  const totalPages = Math.ceil(result.total / result.per_page);

  return (
    <div>
      {/* Aggregations */}
      {result.aggregations && <AggregationBar aggregations={result.aggregations} />}

      {/* Results count */}
      <div className="px-4 py-2 border-b border-gray-200 bg-gray-50 rounded-t-lg">
        <span className="text-sm text-[#71717a]">{result.total} records found</span>
      </div>

      {/* Table */}
      <div className="overflow-x-auto border border-gray-200 rounded-b-lg">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {result.columns.map((col) => (
                <th
                  key={col.key}
                  className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap"
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {result.rows.length === 0 ? (
              <tr>
                <td
                  colSpan={result.columns.length}
                  className="px-4 py-12 text-center text-sm text-gray-500"
                >
                  No data found
                </td>
              </tr>
            ) : (
              result.rows.map((row, rowIdx) => (
                <tr key={rowIdx} className="hover:bg-gray-50 transition-colors">
                  {result.columns.map((col) => (
                    <td
                      key={col.key}
                      className="px-4 py-3 text-sm text-[#09090b] whitespace-nowrap"
                    >
                      {formatCellValue(row[col.key], col.data_type)}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-3 mt-2">
          <div className="text-sm text-[#71717a]">
            Page {result.page} of {totalPages}
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => onPageChange(result.page - 1)}
              disabled={result.page <= 1}
              className="px-3 py-1 text-sm border border-gray-200 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              Previous
            </button>
            <button
              onClick={() => onPageChange(result.page + 1)}
              disabled={result.page >= totalPages}
              className="px-3 py-1 text-sm border border-gray-200 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ResultsEntityTab;
