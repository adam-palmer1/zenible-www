import React from 'react';
import { Bar, Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import type { ChartOptions } from 'chart.js';
import { BarChart3, PieChart } from 'lucide-react';
import { useReports } from '../../../contexts/ReportsContext';

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend);

/**
 * Transaction type colors
 */
const TYPE_COLORS: Record<string, { bg: string; border: string }> = {
  invoice: { bg: 'rgba(59, 130, 246, 0.8)', border: '#3b82f6' },
  quote: { bg: 'rgba(139, 92, 246, 0.8)', border: '#8b5cf6' },
  expense: { bg: 'rgba(239, 68, 68, 0.8)', border: '#ef4444' },
  credit_note: { bg: 'rgba(249, 115, 22, 0.8)', border: '#f97316' },
  payment: { bg: 'rgba(34, 197, 94, 0.8)', border: '#22c55e' },
};

/**
 * Format month period label (e.g., "2026-01" -> "Jan 26")
 */
const formatPeriodLabel = (period: string): string => {
  if (!period) return '';
  const [year, month] = period.split('-');
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const monthIndex = parseInt(month, 10) - 1;
  const shortYear = year.slice(-2);
  return `${monthNames[monthIndex]} ${shortYear}`;
};

/**
 * Format transaction type label
 */
const formatTypeLabel = (type: string): string => {
  const labels: Record<string, string> = {
    invoice: 'Invoices',
    quote: 'Quotes',
    expense: 'Expenses',
    credit_note: 'Credit Notes',
    payment: 'Payments',
  };
  return labels[type] || type;
};

interface ChartSubProps {
  data: any[];
  loading: boolean;
  currencySymbol?: string;
}

/**
 * Income vs Expense Bar Chart
 */
const IncomeExpenseChart: React.FC<ChartSubProps> = ({ data, loading, currencySymbol = '$' }) => {
  if (loading) {
    return (
      <div className="bg-white border border-[#e5e5e5] rounded-xl p-6">
        <div className="h-4 bg-gray-200 rounded w-48 mb-4 animate-pulse" />
        <div className="h-64 bg-gray-100 rounded animate-pulse" />
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="bg-white border border-[#e5e5e5] rounded-xl p-6">
        <h3 className="text-lg font-semibold text-[#09090b] mb-4">Income vs Expenses</h3>
        <div className="h-64 flex items-center justify-center border-2 border-dashed border-gray-200 rounded-lg">
          <div className="text-center">
            <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-2" />
            <p className="text-[#71717a]">No data available for the selected period</p>
          </div>
        </div>
      </div>
    );
  }

  const chartData = {
    labels: data.map((item: any) => formatPeriodLabel(item.period)),
    datasets: [
      {
        label: 'Income',
        data: data.map((item: any) => parseFloat(item.income_total || 0)),
        backgroundColor: 'rgba(34, 197, 94, 0.8)',
        borderColor: '#22c55e',
        borderWidth: 1,
        borderRadius: 4,
      },
      {
        label: 'Expenses',
        data: data.map((item: any) => parseFloat(item.expense_total || 0)),
        backgroundColor: 'rgba(239, 68, 68, 0.8)',
        borderColor: '#ef4444',
        borderWidth: 1,
        borderRadius: 4,
      },
    ],
  };

  const chartOptions: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          usePointStyle: true,
          padding: 20,
          font: { size: 12 },
          color: '#6B7280',
        },
      },
      tooltip: {
        backgroundColor: '#1F2937',
        titleColor: '#F9FAFB',
        bodyColor: '#F9FAFB',
        cornerRadius: 8,
        callbacks: {
          label: (context) => {
            const value = context.parsed.y;
            const formatted = value.toLocaleString('en-US', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            });
            return `${context.dataset.label}: ${currencySymbol}${formatted}`;
          },
        },
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: '#6B7280', font: { size: 11 } },
      },
      y: {
        grid: { color: '#F3F4F6' },
        ticks: {
          color: '#6B7280',
          font: { size: 11 },
          callback: (value) => {
            const formatted = Number(value).toLocaleString('en-US', {
              minimumFractionDigits: 0,
              maximumFractionDigits: 0,
            });
            return `${currencySymbol}${formatted}`;
          },
        },
      },
    },
  };

  return (
    <div className="bg-white border border-[#e5e5e5] rounded-xl p-6">
      <h3 className="text-lg font-semibold text-[#09090b] mb-4">Income vs Expenses</h3>
      <div style={{ height: '280px' }}>
        <Bar data={chartData} options={chartOptions} />
      </div>
    </div>
  );
};

/**
 * Transaction Type Breakdown Pie Chart
 */
const TypeBreakdownChart: React.FC<ChartSubProps> = ({ data, loading, currencySymbol = '$' }) => {
  if (loading) {
    return (
      <div className="bg-white border border-[#e5e5e5] rounded-xl p-6">
        <div className="h-4 bg-gray-200 rounded w-48 mb-4 animate-pulse" />
        <div className="h-64 bg-gray-100 rounded animate-pulse" />
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="bg-white border border-[#e5e5e5] rounded-xl p-6">
        <h3 className="text-lg font-semibold text-[#09090b] mb-4">By Transaction Type</h3>
        <div className="h-64 flex items-center justify-center border-2 border-dashed border-gray-200 rounded-lg">
          <div className="text-center">
            <PieChart className="w-12 h-12 text-gray-400 mx-auto mb-2" />
            <p className="text-[#71717a]">No data available</p>
          </div>
        </div>
      </div>
    );
  }

  const chartData = {
    labels: data.map((item: any) => formatTypeLabel(item.transaction_type)),
    datasets: [
      {
        data: data.map((item: any) => parseFloat(item.total_amount) || 0),
        backgroundColor: data.map(
          (item: any) => TYPE_COLORS[item.transaction_type]?.bg || 'rgba(156, 163, 175, 0.8)'
        ),
        borderColor: data.map(
          (item: any) => TYPE_COLORS[item.transaction_type]?.border || '#9ca3af'
        ),
        borderWidth: 2,
      },
    ],
  };

  const chartOptions: ChartOptions<'pie'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right' as const,
        labels: {
          usePointStyle: true,
          padding: 16,
          font: { size: 12 },
          color: '#6B7280',
        },
      },
      tooltip: {
        backgroundColor: '#1F2937',
        titleColor: '#F9FAFB',
        bodyColor: '#F9FAFB',
        cornerRadius: 8,
        callbacks: {
          label: (context) => {
            const value = context.parsed;
            const total = (context.dataset.data as number[]).reduce((a: number, b: number) => a + b, 0);
            const percentage = ((value / total) * 100).toFixed(1);
            const formatted = value.toLocaleString('en-US', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            });
            return `${context.label}: ${currencySymbol}${formatted} (${percentage}%)`;
          },
        },
      },
    },
  };

  return (
    <div className="bg-white border border-[#e5e5e5] rounded-xl p-6">
      <h3 className="text-lg font-semibold text-[#09090b] mb-4">By Transaction Type</h3>
      <div style={{ height: '280px' }}>
        <Pie data={chartData} options={chartOptions} />
      </div>
    </div>
  );
};

/**
 * Transaction Charts Section
 * Displays income/expense bar chart and type breakdown pie chart
 */
const TransactionCharts: React.FC = () => {
  const { summary, summaryLoading } = useReports();

  // Get default currency symbol from summary
  const currencySymbol = summary?.default_currency?.symbol || '$';

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <IncomeExpenseChart
        data={summary?.by_period || []}
        loading={summaryLoading}
        currencySymbol={currencySymbol}
      />
      <TypeBreakdownChart
        data={summary?.by_type || []}
        loading={summaryLoading}
        currencySymbol={currencySymbol}
      />
    </div>
  );
};

export default TransactionCharts;
