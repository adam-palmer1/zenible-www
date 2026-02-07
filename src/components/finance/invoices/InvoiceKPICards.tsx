import React from 'react';
import {
  FileText,
  DollarSign,
  Clock,
  AlertCircle,
} from 'lucide-react';
import KPICard from '../shared/KPICard';

interface InvoiceKPICardsProps {
  loading: boolean;
  stats: any;
  formatConvertedValue: (converted: any) => string;
  getSingleCurrencyDisplay: (byCurrencyArray: any[]) => string;
  formatCurrencyBreakdown: (byCurrencyArray: any[], convertedCurrency: any) => string | undefined;
}

const InvoiceKPICards: React.FC<InvoiceKPICardsProps> = ({
  loading,
  stats,
  formatConvertedValue,
  getSingleCurrencyDisplay,
  formatCurrencyBreakdown,
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <KPICard
        title="Invoices"
        value={loading ? '...' : stats.total.toString()}
        subtitle={stats.overdueCount > 0 ? `${stats.overdueCount} overdue` : undefined}
        icon={FileText}
        iconColor="blue"
      />
      <KPICard
        title="Total Invoiced"
        value={loading ? '...' : (stats.convertedTotal
          ? formatConvertedValue(stats.convertedTotal)
          : getSingleCurrencyDisplay(stats.totalByCurrency))}
        subtitle={!loading ? formatCurrencyBreakdown(stats.totalByCurrency, stats.convertedTotal) : undefined}
        icon={DollarSign}
        iconColor="green"
      />
      <KPICard
        title="Outstanding"
        value={loading ? '...' : (stats.convertedOutstanding
          ? formatConvertedValue(stats.convertedOutstanding)
          : getSingleCurrencyDisplay(stats.outstandingByCurrencyArray))}
        subtitle={!loading ? formatCurrencyBreakdown(stats.outstandingByCurrencyArray, stats.convertedOutstanding) : undefined}
        icon={Clock}
        iconColor="yellow"
      />
      <KPICard
        title="Overdue"
        value={loading ? '...' : (stats.convertedOverdue
          ? formatConvertedValue(stats.convertedOverdue)
          : getSingleCurrencyDisplay(stats.overdueByCurrencyArray))}
        subtitle={!loading ? formatCurrencyBreakdown(stats.overdueByCurrencyArray, stats.convertedOverdue) : undefined}
        icon={AlertCircle}
        iconColor="red"
      />
    </div>
  );
};

export default InvoiceKPICards;
