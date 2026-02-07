import React, { useState } from 'react';
import Modal from '../../ui/modal/Modal';
import { Upload, FileText, CheckCircle, AlertCircle, Download, Loader2, ChevronRight, ChevronLeft } from 'lucide-react';
import { useExpenses } from '../../../contexts/ExpenseContext';
import { useContacts } from '../../../hooks/crm/useContacts';
import { useNotification } from '../../../contexts/NotificationContext';
import {
  parseCSV,
  validateExpenseRow,
  convertToExpenseFormat,
  generateCSVTemplate,
  downloadCSV,
  generateErrorCSV
} from '../../../utils/csvParser';
import expensesAPI from '../../../services/api/finance/expenses';
import { useCompanyCurrencies } from '../../../hooks/crm/useCompanyCurrencies';

const STEPS = {
  UPLOAD: 'upload',
  PREVIEW: 'preview',
  OPTIONS: 'options',
  IMPORTING: 'importing',
  SUMMARY: 'summary',
} as const;

interface CSVImportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const CSVImportModal: React.FC<CSVImportModalProps> = ({ open, onOpenChange }) => {
  const { categories, refresh } = useExpenses() as any;
  const { contacts: vendors } = useContacts({ is_vendor: true }, 0, { skipInitialFetch: !open }) as any;
  const { showSuccess, showError } = useNotification() as any;

  const [currentStep, setCurrentStep] = useState<string>(STEPS.UPLOAD);
  const [file, setFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<any[]>([]);
  const [validationErrors, setValidationErrors] = useState<any[]>([]);
  const [importing, setImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [importResults, setImportResults] = useState<{ success: number; failed: number; errors: any[] }>({ success: 0, failed: 0, errors: [] });
  const [selectedCurrency, setSelectedCurrency] = useState('');
  const [createMissing, setCreateMissing] = useState(true);

  // Use currencies hook
  const { companyCurrencies: currencies, defaultCurrency: defaultCurrencyAssoc } = useCompanyCurrencies() as any;

  // Set default currency when modal opens and currencies are loaded
  React.useEffect(() => {
    if (open && currencies.length > 0 && !selectedCurrency) {
      if (defaultCurrencyAssoc?.currency?.id) {
        setSelectedCurrency(defaultCurrencyAssoc.currency.id);
      }
    }
  }, [open, currencies, defaultCurrencyAssoc, selectedCurrency]);

  const handleClose = () => {
    setCurrentStep(STEPS.UPLOAD);
    setFile(null);
    setParsedData([]);
    setValidationErrors([]);
    setImporting(false);
    setImportProgress(0);
    setImportResults({ success: 0, failed: 0, errors: [] });
    setSelectedCurrency('');
    setCreateMissing(true);
    onOpenChange(false);
  };

  const handleFileSelect = async (selectedFile: File) => {
    setFile(selectedFile);

    try {
      const data = await (parseCSV as any)(selectedFile);
      setParsedData(data);

      const errors: any[] = [];
      data.forEach((row: any, index: number) => {
        const validation = (validateExpenseRow as any)(row, { categories, vendors });
        if (!validation.valid) {
          errors.push({
            rowIndex: index + 2,
            row,
            errors: validation.errors,
          });
        }
      });

      setValidationErrors(errors);
      setCurrentStep(STEPS.PREVIEW);
    } catch (error: any) {
      showError(error.message || 'Failed to parse CSV file');
      setFile(null);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelect(e.target.files[0]);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const handleDownloadTemplate = () => {
    const template = (generateCSVTemplate as any)();
    (downloadCSV as any)(template, 'expense_import_template.csv');
  };

  const handleDownloadErrors = () => {
    if (validationErrors.length === 0) return;

    const headers = Object.keys(parsedData[0] || {});
    const errorCSV = (generateErrorCSV as any)(validationErrors, headers);
    (downloadCSV as any)(errorCSV, 'expense_import_errors.csv');
  };

  const handleImport = async () => {
    setCurrentStep(STEPS.IMPORTING);
    setImporting(true);
    setImportProgress(0);

    const results = {
      success: 0,
      failed: 0,
      errors: [] as any[],
    };

    const validRows = parsedData.filter((_: any, index: number) => {
      return !validationErrors.some((e: any) => e.rowIndex === index + 2);
    });

    for (let i = 0; i < validRows.length; i++) {
      try {
        const row = validRows[i];
        const expenseData = (convertToExpenseFormat as any)(row, {
          categories,
          vendors,
          currencies,
          createMissing,
        });

        if (!expenseData.currency_id && selectedCurrency) {
          expenseData.currency_id = selectedCurrency;
        }

        await (expensesAPI as any).create(expenseData);
        results.success++;
      } catch (error: any) {
        results.failed++;
        results.errors.push({
          row: i + 2,
          error: error.message || 'Failed to import',
        });
      }

      setImportProgress(((i + 1) / validRows.length) * 100);
    }

    setImportResults(results);
    setImporting(false);
    setCurrentStep(STEPS.SUMMARY);

    refresh();
  };

  const renderUploadStep = () => (
    <div className="space-y-6">
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        className="border-2 border-dashed design-border rounded-lg p-8 text-center hover:border-purple-400 transition-colors cursor-pointer"
      >
        <input
          type="file"
          accept=".csv"
          onChange={handleFileInputChange}
          className="hidden"
          id="csv-upload"
        />
        <label htmlFor="csv-upload" className="cursor-pointer">
          <Upload className="h-12 w-12 design-text-secondary mx-auto mb-4" />
          <p className="text-lg design-text-primary mb-2">Drop CSV file here or click to browse</p>
          <p className="text-sm design-text-secondary">Accepted format: .csv</p>
        </label>
      </div>

      <div className="design-bg-secondary rounded-lg p-4">
        <div className="flex items-start gap-3">
          <FileText className="h-5 w-5 text-purple-600 mt-0.5" />
          <div>
            <p className="text-sm font-medium design-text-primary mb-1">Need a template?</p>
            <p className="text-xs design-text-secondary mb-2">
              Download our CSV template with example data and required columns
            </p>
            <button
              onClick={handleDownloadTemplate}
              className="text-xs text-purple-600 hover:underline dark:text-purple-400"
            >
              Download Template
            </button>
          </div>
        </div>
      </div>

      <div className="design-bg-secondary rounded-lg p-4">
        <p className="text-xs design-text-secondary">
          <strong>Required columns:</strong> expense_date, amount
          <br />
          <strong>Optional columns:</strong> currency, description, category, vendor, payment_method, reference_number, notes
        </p>
      </div>
    </div>
  );

  const renderPreviewStep = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium design-text-primary">
            Found {parsedData.length} rows
          </p>
          {validationErrors.length > 0 && (
            <p className="text-sm text-red-600 dark:text-red-400">
              {validationErrors.length} rows have errors
            </p>
          )}
        </div>
        {validationErrors.length > 0 && (
          <button
            onClick={handleDownloadErrors}
            className="text-xs text-purple-600 hover:underline dark:text-purple-400 flex items-center gap-1"
          >
            <Download className="h-3 w-3" />
            Download Error Log
          </button>
        )}
      </div>

      <div className="max-h-96 overflow-auto design-bg-secondary rounded-lg">
        <table className="min-w-full divide-y design-divide text-sm">
          <thead className="design-bg-tertiary sticky top-0">
            <tr>
              <th className="px-3 py-2 text-left text-xs font-medium design-text-secondary uppercase">#</th>
              <th className="px-3 py-2 text-left text-xs font-medium design-text-secondary uppercase">Date</th>
              <th className="px-3 py-2 text-left text-xs font-medium design-text-secondary uppercase">Amount</th>
              <th className="px-3 py-2 text-left text-xs font-medium design-text-secondary uppercase">Description</th>
              <th className="px-3 py-2 text-left text-xs font-medium design-text-secondary uppercase">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y design-divide">
            {parsedData.slice(0, 50).map((row: any, index: number) => {
              const error = validationErrors.find((e: any) => e.rowIndex === index + 2);
              return (
                <tr key={index} className={error ? 'bg-red-50 dark:bg-red-900/10' : ''}>
                  <td className="px-3 py-2 design-text-secondary">{index + 2}</td>
                  <td className="px-3 py-2 design-text-primary">{row.expense_date || '-'}</td>
                  <td className="px-3 py-2 design-text-primary">{row.amount || '-'}</td>
                  <td className="px-3 py-2 design-text-primary">{row.description || '-'}</td>
                  <td className="px-3 py-2">
                    {error ? (
                      <div className="flex items-center gap-1 text-red-600 dark:text-red-400">
                        <AlertCircle className="h-4 w-4" />
                        <span className="text-xs">{error.errors[0]}</span>
                      </div>
                    ) : (
                      <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {parsedData.length > 50 && (
          <div className="p-3 text-center text-xs design-text-secondary">
            Showing first 50 of {parsedData.length} rows
          </div>
        )}
      </div>

      <div className="flex justify-between">
        <button
          onClick={() => setCurrentStep(STEPS.UPLOAD)}
          className="px-4 py-2 text-sm font-medium design-text-primary design-bg-secondary rounded-md hover:design-bg-tertiary flex items-center gap-2"
        >
          <ChevronLeft className="h-4 w-4" />
          Back
        </button>
        <button
          onClick={() => setCurrentStep(STEPS.OPTIONS)}
          disabled={parsedData.length === validationErrors.length}
          className="px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-md hover:bg-purple-700 disabled:opacity-50 flex items-center gap-2"
        >
          Continue
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );

  const renderOptionsStep = () => (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium design-text-primary mb-2">
          Default Currency
        </label>
        <select
          value={selectedCurrency}
          onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setSelectedCurrency(e.target.value)}
          className="w-full px-3 py-2 design-input rounded-md"
        >
          <option value="">Select currency</option>
          {currencies.map((cc: any) => (
            <option key={cc.currency.id} value={cc.currency.id}>
              {cc.currency.code} - {cc.currency.name}
            </option>
          ))}
        </select>
        <p className="text-xs design-text-secondary mt-1">
          Used for expenses without a currency column
        </p>
      </div>

      <div className="design-bg-secondary rounded-lg p-4">
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={createMissing}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCreateMissing(e.target.checked)}
            className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
          />
          <div>
            <p className="text-sm font-medium design-text-primary">Create missing categories and vendors</p>
            <p className="text-xs design-text-secondary">
              Automatically create new categories/vendors if they don't exist
            </p>
          </div>
        </label>
      </div>

      <div className="design-bg-secondary rounded-lg p-4">
        <p className="text-sm design-text-primary mb-2">Import Summary:</p>
        <ul className="text-sm design-text-secondary space-y-1">
          <li>&bull; Total rows: {parsedData.length}</li>
          <li>&bull; Valid rows: {parsedData.length - validationErrors.length}</li>
          <li>&bull; Rows with errors: {validationErrors.length}</li>
        </ul>
        {validationErrors.length > 0 && (
          <p className="text-xs text-red-600 dark:text-red-400 mt-2">
            Rows with errors will be skipped
          </p>
        )}
      </div>

      <div className="flex justify-between">
        <button
          onClick={() => setCurrentStep(STEPS.PREVIEW)}
          className="px-4 py-2 text-sm font-medium design-text-primary design-bg-secondary rounded-md hover:design-bg-tertiary flex items-center gap-2"
        >
          <ChevronLeft className="h-4 w-4" />
          Back
        </button>
        <button
          onClick={handleImport}
          disabled={parsedData.length === validationErrors.length}
          className="px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-md hover:bg-purple-700 disabled:opacity-50 flex items-center gap-2"
        >
          <Upload className="h-4 w-4" />
          Import {parsedData.length - validationErrors.length} Expenses
        </button>
      </div>
    </div>
  );

  const renderImportingStep = () => (
    <div className="space-y-6 py-8">
      <div className="text-center">
        <Loader2 className="h-12 w-12 animate-spin text-purple-600 mx-auto mb-4" />
        <p className="text-lg font-medium design-text-primary mb-2">Importing expenses...</p>
        <p className="text-sm design-text-secondary">Please wait while we process your file</p>
      </div>

      <div className="design-bg-secondary rounded-lg p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm design-text-primary">Progress</span>
          <span className="text-sm design-text-primary">{Math.round(importProgress)}%</span>
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
          <div
            className="bg-purple-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${importProgress}%` }}
          />
        </div>
      </div>
    </div>
  );

  const renderSummaryStep = () => (
    <div className="space-y-6">
      <div className="text-center py-4">
        {importResults.failed === 0 ? (
          <CheckCircle className="h-16 w-16 text-green-600 dark:text-green-400 mx-auto mb-4" />
        ) : (
          <AlertCircle className="h-16 w-16 text-yellow-600 dark:text-yellow-400 mx-auto mb-4" />
        )}
        <h3 className="text-xl font-bold design-text-primary mb-2">
          Import Complete
        </h3>
        <p className="text-sm design-text-secondary">
          {importResults.failed === 0
            ? 'All expenses imported successfully'
            : 'Import completed with some errors'}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="design-bg-secondary rounded-lg p-4 text-center">
          <p className="text-3xl font-bold text-green-600 dark:text-green-400 mb-1">
            {importResults.success}
          </p>
          <p className="text-sm design-text-secondary">Successful</p>
        </div>
        <div className="design-bg-secondary rounded-lg p-4 text-center">
          <p className="text-3xl font-bold text-red-600 dark:text-red-400 mb-1">
            {importResults.failed}
          </p>
          <p className="text-sm design-text-secondary">Failed</p>
        </div>
      </div>

      {importResults.errors.length > 0 && (
        <div className="design-bg-secondary rounded-lg p-4 max-h-48 overflow-auto">
          <p className="text-sm font-medium design-text-primary mb-2">Errors:</p>
          <ul className="text-xs design-text-secondary space-y-1">
            {importResults.errors.map((err: any, index: number) => (
              <li key={index}>
                Row {err.row}: {err.error}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="flex justify-end">
        <button
          onClick={handleClose}
          className="px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-md hover:bg-purple-700"
        >
          Close
        </button>
      </div>
    </div>
  );

  const renderStep = () => {
    switch (currentStep) {
      case STEPS.UPLOAD:
        return renderUploadStep();
      case STEPS.PREVIEW:
        return renderPreviewStep();
      case STEPS.OPTIONS:
        return renderOptionsStep();
      case STEPS.IMPORTING:
        return renderImportingStep();
      case STEPS.SUMMARY:
        return renderSummaryStep();
      default:
        return null;
    }
  };

  const getTitle = () => {
    switch (currentStep) {
      case STEPS.UPLOAD:
        return 'Import Expenses from CSV';
      case STEPS.PREVIEW:
        return 'Preview & Validate';
      case STEPS.OPTIONS:
        return 'Import Options';
      case STEPS.IMPORTING:
        return 'Importing';
      case STEPS.SUMMARY:
        return 'Import Summary';
      default:
        return 'Import Expenses';
    }
  };

  return (
    <Modal
      open={open}
      onOpenChange={importing ? undefined : handleClose}
      title={getTitle()}
      size="3xl"
      showCloseButton={!importing}
    >
      {renderStep()}
    </Modal>
  );
};

export default CSVImportModal;
