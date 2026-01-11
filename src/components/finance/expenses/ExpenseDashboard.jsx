import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, DollarSign, TrendingUp, Tag, Upload } from 'lucide-react';
import { useExpenses } from '../../../contexts/ExpenseContext';
import { formatCurrency } from '../../../utils/currency';
import ExpenseList from './ExpenseList';
import NewSidebar from '../../sidebar/NewSidebar';
import CSVImportModal from './CSVImportModal';

const ExpenseDashboard = () => {
  const navigate = useNavigate();
  const { expenses, categories, loading } = useExpenses();
  const [showImportModal, setShowImportModal] = useState(false);

  const totalExpenses = expenses.length;
  const totalAmount = expenses.reduce((sum, exp) => sum + (exp.amount || 0), 0);
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  const monthlyExpenses = expenses.filter(exp => {
    const date = new Date(exp.expense_date);
    return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
  });
  const monthlyAmount = monthlyExpenses.reduce((sum, exp) => sum + (exp.amount || 0), 0);

  const stats = [
    { name: 'Total Expenses', value: totalExpenses, icon: DollarSign, color: 'bg-blue-500' },
    { name: 'Total Amount', value: formatCurrency(totalAmount, 'USD'), icon: DollarSign, color: 'bg-green-500' },
    { name: 'This Month', value: formatCurrency(monthlyAmount, 'USD'), icon: TrendingUp, color: 'bg-purple-500' },
    { name: 'Categories', value: categories.length, icon: Tag, color: 'bg-orange-500' },
  ];

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      {/* Sidebar */}
      <NewSidebar />

      {/* Main Content */}
      <div className="flex-1 flex flex-col transition-all duration-300" style={{ marginLeft: 'var(--sidebar-width, 280px)' }}>
        <div className="flex-1 overflow-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold design-text-primary">Expenses</h1>
          <p className="text-sm design-text-secondary mt-1">Track and manage your expenses</p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => navigate('/finance/expenses/categories')} className="inline-flex items-center px-4 py-2 text-sm font-medium design-text-primary design-bg-secondary rounded-md hover:design-bg-tertiary">
            <Tag className="h-4 w-4 mr-2" />
            Manage Categories
          </button>
          <button onClick={() => setShowImportModal(true)} className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-md hover:bg-purple-700">
            <Upload className="h-4 w-4 mr-2" />
            Import CSV
          </button>
          <button onClick={() => navigate('/finance/expenses/new')} className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-zenible-primary rounded-md hover:bg-zenible-primary/90">
            <Plus className="h-4 w-4 mr-2" />
            New Expense
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <div key={stat.name} className="design-bg-primary rounded-lg shadow-sm p-6 border-l-4" style={{ borderLeftColor: stat.color.replace('bg-', '#') }}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm design-text-secondary mb-1">{stat.name}</p>
                <p className="text-2xl font-bold design-text-primary">{loading ? '...' : stat.value}</p>
              </div>
              <div className={`p-3 rounded-lg ${stat.color} bg-opacity-10`}>
                <stat.icon className={`h-6 w-6 ${stat.color.replace('bg-', 'text-')}`} />
              </div>
            </div>
          </div>
        ))}
      </div>

      <ExpenseList />
        </div>
      </div>

      <CSVImportModal
        open={showImportModal}
        onOpenChange={setShowImportModal}
      />
    </div>
  );
};

export default ExpenseDashboard;
