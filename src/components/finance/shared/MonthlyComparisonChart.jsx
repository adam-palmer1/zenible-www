import React from 'react';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { BarChart3 } from 'lucide-react';
import { formatCurrency } from '../../../utils/currency';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

/**
 * Reusable monthly comparison chart for revenue vs expenses
 */
const MonthlyComparisonChart = ({
  data = [],
  currency = 'USD',
  height = 300,
  title = 'Monthly Comparison',
}) => {
  if (!data || data.length === 0) {
    return (
      <div className="design-bg-primary rounded-lg p-6 shadow-sm">
        {title && <h3 className="text-lg font-semibold design-text-primary mb-4">{title}</h3>}
        <div className="h-64 flex items-center justify-center border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-lg">
          <div className="text-center">
            <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-2" />
            <p className="design-text-secondary">No comparison data available</p>
            <p className="text-sm design-text-secondary mt-1">
              Historical data will appear here over time
            </p>
          </div>
        </div>
      </div>
    );
  }

  const chartData = {
    labels: data.map(item => item.month || item.label || ''),
    datasets: [
      {
        label: 'Revenue',
        data: data.map(item => item.revenue || 0),
        backgroundColor: 'rgba(142, 81, 255, 0.8)',
        borderColor: '#8e51ff',
        borderWidth: 1,
        borderRadius: 4,
      },
      {
        label: 'Expenses',
        data: data.map(item => item.expenses || 0),
        backgroundColor: 'rgba(239, 68, 68, 0.8)',
        borderColor: '#ef4444',
        borderWidth: 1,
        borderRadius: 4,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          usePointStyle: true,
          padding: 20,
          font: {
            size: 12,
          },
          color: '#6B7280',
        },
      },
      tooltip: {
        backgroundColor: '#1F2937',
        titleColor: '#F9FAFB',
        bodyColor: '#F9FAFB',
        cornerRadius: 8,
        callbacks: {
          label: function(context) {
            return `${context.dataset.label}: ${formatCurrency(context.parsed.y, currency)}`;
          },
        },
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
        ticks: {
          color: '#6B7280',
          font: {
            size: 11,
          },
        },
      },
      y: {
        grid: {
          color: '#F3F4F6',
        },
        ticks: {
          color: '#6B7280',
          font: {
            size: 11,
          },
          callback: function(value) {
            return formatCurrency(value, currency);
          },
        },
      },
    },
  };

  return (
    <div className="design-bg-primary rounded-lg p-6 shadow-sm">
      {title && <h3 className="text-lg font-semibold design-text-primary mb-4">{title}</h3>}
      <div style={{ height: `${height}px` }}>
        <Bar data={chartData} options={chartOptions} />
      </div>
    </div>
  );
};

export default MonthlyComparisonChart;
