import React from 'react';
import { useFormContext, RegisterOptions, FieldValues } from 'react-hook-form';

interface SelectOption {
  value: string;
  label: string;
}

interface FormSelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'name'> {
  name: string;
  label: string;
  options?: SelectOption[];
  placeholder?: string;
  required?: boolean;
  className?: string;
  registerOptions?: RegisterOptions<FieldValues>;
}

const FormSelect: React.FC<FormSelectProps> = ({
  name,
  label,
  options = [],
  placeholder = 'Select...',
  required = false,
  className = '',
  registerOptions = {},
  ...selectProps
}) => {
  const { register, formState: { errors } } = useFormContext();
  const error = errors[name];

  return (
    <div className={className}>
      <label htmlFor={name} className="block text-sm font-medium text-gray-700 mb-1">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <select
        id={name}
        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-zenible-primary focus:border-zenible-primary ${
          error ? 'border-red-500' : 'border-gray-300'
        }`}
        {...register(name, registerOptions as any)}
        {...selectProps}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error && (
        <p className="mt-1 text-sm text-red-600">{error.message as string}</p>
      )}
    </div>
  );
};

export default FormSelect;
