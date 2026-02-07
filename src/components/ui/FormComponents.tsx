import React from 'react';

interface SelectOption {
  value: string;
  label: string;
}

// --- FormInput ---

interface FormInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'className'> {
  label?: string;
  type?: string;
  value?: string | number;
  onChange?: React.ChangeEventHandler<HTMLInputElement>;
  placeholder?: string;
  required?: boolean;
  error?: string;
  disabled?: boolean;
  className?: string;
}

export const FormInput: React.FC<FormInputProps> = ({
  label,
  type = 'text',
  value,
  onChange,
  placeholder,
  required = false,
  error = '',
  disabled = false,
  className = '',
  ...props
}) => {
  return (
    <div className={className}>
      {label && (
        <label className="block text-sm font-medium text-design-text-secondary mb-2">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        className={`w-full px-3 py-2.5 text-sm md:text-base text-design-text-primary bg-design-input-bg rounded border border-solid border-design-border-input outline-none focus:border-brand-purple focus:bg-design-card-bg placeholder-design-text-placeholder disabled:bg-design-border-light disabled:text-design-text-muted disabled:cursor-not-allowed min-h-[44px] ${
          error ? 'border-red-300 focus:border-red-500' : ''
        }`}
        {...props}
      />
      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
    </div>
  );
};

// --- FormSelect ---

interface FormSelectComponentProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'className'> {
  label?: string;
  value?: string | number;
  onChange?: React.ChangeEventHandler<HTMLSelectElement>;
  options?: SelectOption[];
  placeholder?: string;
  required?: boolean;
  error?: string;
  disabled?: boolean;
  className?: string;
}

export const FormSelect: React.FC<FormSelectComponentProps> = ({
  label,
  value,
  onChange,
  options = [],
  placeholder = 'Select an option',
  required = false,
  error = '',
  disabled = false,
  className = '',
  ...props
}) => {
  return (
    <div className={className}>
      {label && (
        <label className="block text-sm font-medium text-design-text-secondary mb-2">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <select
        value={value}
        onChange={onChange}
        disabled={disabled}
        className={`w-full px-3 py-2 text-sm text-design-text-primary bg-design-input-bg rounded border border-solid border-design-border-input outline-none focus:border-brand-purple focus:bg-design-card-bg disabled:bg-design-border-light disabled:text-design-text-muted disabled:cursor-not-allowed ${
          error ? 'border-red-300 focus:border-red-500' : ''
        }`}
        {...props}
      >
        <option value="">{placeholder}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
    </div>
  );
};

// --- FormTextarea ---

interface FormTextareaComponentProps extends Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, 'className'> {
  label?: string;
  value?: string;
  onChange?: React.ChangeEventHandler<HTMLTextAreaElement>;
  placeholder?: string;
  rows?: number;
  required?: boolean;
  error?: string;
  disabled?: boolean;
  className?: string;
}

export const FormTextarea: React.FC<FormTextareaComponentProps> = ({
  label,
  value,
  onChange,
  placeholder,
  rows = 4,
  required = false,
  error = '',
  disabled = false,
  className = '',
  ...props
}) => {
  return (
    <div className={className}>
      {label && (
        <label className="block text-sm font-medium text-design-text-secondary mb-2">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <textarea
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        rows={rows}
        disabled={disabled}
        className={`w-full px-3 py-2.5 text-sm md:text-base text-design-text-primary bg-design-input-bg rounded border border-solid border-design-border-input outline-none focus:border-brand-purple focus:bg-design-card-bg placeholder-design-text-placeholder disabled:bg-design-border-light disabled:text-design-text-muted disabled:cursor-not-allowed min-h-[44px] ${
          error ? 'border-red-300 focus:border-red-500' : ''
        }`}
        {...props}
      />
      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
    </div>
  );
};

// --- FormSection ---

interface FormSectionProps {
  title?: string;
  children: React.ReactNode;
  className?: string;
}

export const FormSection: React.FC<FormSectionProps> = ({ title, children, className = '' }) => {
  return (
    <div className={`space-y-6 ${className}`}>
      {title && (
        <h3 className="text-sm font-medium text-design-text-secondary uppercase">{title}</h3>
      )}
      <div className="space-y-6">
        {children}
      </div>
    </div>
  );
};

// --- FormButtonGroup ---

interface FormButtonGroupProps {
  onCancel?: () => void;
  onSave?: () => void;
  cancelText?: string;
  saveText?: string;
  isSaving?: boolean;
  className?: string;
}

export const FormButtonGroup: React.FC<FormButtonGroupProps> = ({
  onCancel,
  onSave,
  cancelText = 'Cancel',
  saveText = 'Save',
  isSaving = false,
  className = ''
}) => {
  return (
    <div className={`flex items-center justify-end gap-4 ${className}`}>
      <button
        type="button"
        onClick={onCancel}
        disabled={isSaving}
        className="px-4 py-2.5 text-sm md:text-base font-medium text-design-text-secondary bg-design-card-bg border border-design-border-input rounded-md hover:bg-design-border-light focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-purple disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px]"
      >
        {cancelText}
      </button>
      <button
        type="submit"
        onClick={onSave}
        disabled={isSaving}
        className="px-4 py-2.5 text-sm md:text-base font-medium text-white bg-brand-purple border border-transparent rounded-md hover:bg-brand-purple-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-purple disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px]"
      >
        {isSaving ? 'Saving...' : saveText}
      </button>
    </div>
  );
};

// --- FormLayout ---

interface FormLayoutProps {
  title: string;
  onClose?: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
  isModal?: boolean;
  className?: string;
}

export const FormLayout: React.FC<FormLayoutProps> = ({
  title,
  onClose,
  children,
  footer,
  isModal = false,
  className = ''
}) => {
  if (isModal) {
    return (
      <div className="flex flex-col h-full max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-6 border-b border-design-border-light">
          <h2 className="text-xl font-semibold text-design-text-primary">{title}</h2>
          {onClose && (
            <button
              onClick={onClose}
              className="text-design-text-secondary hover:text-design-text-muted focus:outline-none"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {children}
        </div>

        {/* Modal Footer */}
        {footer && (
          <div className="p-6 border-t border-design-border-light">
            {footer}
          </div>
        )}
      </div>
    );
  }

  // Full page layout
  return (
    <div className={`bg-design-card-bg rounded-xl ${className}`}>
      {/* Page Header */}
      <div className="px-6 py-4 border-b border-design-border-light">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-design-text-primary">{title}</h2>
          {footer}
        </div>
      </div>

      {/* Page Body */}
      <div className="p-6">
        {children}
      </div>
    </div>
  );
};
