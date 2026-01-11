import React from 'react';
import { useFormContext } from 'react-hook-form';

/**
 * Reusable checkbox field component integrated with React Hook Form
 *
 * @param {Object} props
 * @param {string} props.name - Field name for registration
 * @param {string} props.label - Field label
 * @param {string} props.className - Additional CSS classes
 * @param {Object} props.registerOptions - Additional react-hook-form register options
 */
const FormCheckbox = ({
  name,
  label,
  className = '',
  registerOptions = {},
  ...checkboxProps
}) => {
  const { register, formState: { errors } } = useFormContext();
  const error = errors[name];

  return (
    <div className={className}>
      <label className="flex items-center">
        <input
          type="checkbox"
          className="h-4 w-4 text-zenible-primary rounded focus:ring-zenible-primary border-gray-300"
          {...register(name, registerOptions)}
          {...checkboxProps}
        />
        <span className="ml-2 text-sm text-gray-700">{label}</span>
      </label>
      {error && (
        <p className="mt-1 text-sm text-red-600">{error.message}</p>
      )}
    </div>
  );
};

export default FormCheckbox;
