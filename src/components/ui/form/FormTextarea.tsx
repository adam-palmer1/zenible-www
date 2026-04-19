import React from 'react';
import { useFormContext, RegisterOptions, FieldValues } from 'react-hook-form';

interface FormTextareaProps extends Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, 'name'> {
  name: string;
  label?: string;
  placeholder?: string;
  rows?: number;
  required?: boolean;
  className?: string;
  registerOptions?: RegisterOptions<FieldValues>;
}

const FormTextarea: React.FC<FormTextareaProps> = ({
  name,
  label = '',
  placeholder = '',
  rows = 3,
  required = false,
  className = '',
  registerOptions = {},
  ...textareaProps
}) => {
  const { register, formState: { errors } } = useFormContext();
  const error = errors[name];
  const errorId = `${name}-error`;

  return (
    <div className={className}>
      {label && (
        <label htmlFor={name} className="block text-sm font-medium text-gray-700 mb-1">
          {label}
          {required && <span className="text-red-500 ml-1" aria-hidden="true">*</span>}
        </label>
      )}
      <textarea
        id={name}
        rows={rows}
        placeholder={placeholder}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
        aria-required={required || undefined}
        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-zenible-primary focus:border-zenible-primary ${
          error ? 'border-red-500' : 'border-gray-300'
        }`}
        {...register(name, registerOptions)}
        {...textareaProps}
      />
      {error && (
        <p id={errorId} className="mt-1 text-sm text-red-600" role="alert">
          {error.message as string}
        </p>
      )}
    </div>
  );
};

export default FormTextarea;
