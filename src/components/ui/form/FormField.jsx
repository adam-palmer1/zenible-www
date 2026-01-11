import React from 'react';
import { useFormContext } from 'react-hook-form';

/**
 * Reusable form field component integrated with React Hook Form
 *
 * @param {Object} props
 * @param {string} props.name - Field name for registration
 * @param {string} props.label - Field label
 * @param {string} props.type - Input type (text, email, tel, number, etc.)
 * @param {string} props.placeholder - Placeholder text
 * @param {boolean} props.required - Whether field is required
 * @param {string} props.className - Additional CSS classes
 * @param {Object} props.registerOptions - Additional react-hook-form register options
 */
const FormField = ({
  name,
  label,
  type = 'text',
  placeholder = '',
  required = false,
  className = '',
  registerOptions = {},
  ...inputProps
}) => {
  const { register, formState: { errors } } = useFormContext();
  const error = errors[name];

  return (
    <div className={className}>
      <label htmlFor={name} className="block text-sm font-medium text-gray-700 mb-1">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <input
        id={name}
        type={type}
        placeholder={placeholder}
        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-zenible-primary focus:border-zenible-primary ${
          error ? 'border-red-500' : 'border-gray-300'
        }`}
        {...register(name, registerOptions)}
        {...inputProps}
      />
      {error && (
        <p className="mt-1 text-sm text-red-600">{error.message}</p>
      )}
    </div>
  );
};

export default FormField;
