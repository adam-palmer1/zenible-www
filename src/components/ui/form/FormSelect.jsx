import React from 'react';
import { useFormContext } from 'react-hook-form';

/**
 * Reusable select field component integrated with React Hook Form
 *
 * @param {Object} props
 * @param {string} props.name - Field name for registration
 * @param {string} props.label - Field label
 * @param {Array} props.options - Array of options [{value, label}, ...]
 * @param {string} props.placeholder - Placeholder option text
 * @param {boolean} props.required - Whether field is required
 * @param {string} props.className - Additional CSS classes
 * @param {Object} props.registerOptions - Additional react-hook-form register options
 */
const FormSelect = ({
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
        {...register(name, registerOptions)}
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
        <p className="mt-1 text-sm text-red-600">{error.message}</p>
      )}
    </div>
  );
};

export default FormSelect;
