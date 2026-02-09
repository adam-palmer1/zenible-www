import React from 'react';
import { useFormContext, RegisterOptions, FieldValues } from 'react-hook-form';

interface FormFieldProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'name'> {
  name: string;
  label?: string;
  type?: string;
  placeholder?: string;
  required?: boolean;
  className?: string;
  registerOptions?: RegisterOptions<FieldValues>;
}

const FormField: React.FC<FormFieldProps> = ({
  name,
  label = '',
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
      {label && (
        <label htmlFor={name} className="block text-sm font-medium text-gray-700 mb-1">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <input
        id={name}
        type={type}
        placeholder={placeholder}
        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-zenible-primary focus:border-zenible-primary ${
          error ? 'border-red-500' : 'border-gray-300'
        }`}
        {...register(name, registerOptions)}
        {...inputProps}
        {...(type === 'tel' ? { onInput: (e: React.FormEvent<HTMLInputElement>) => { e.currentTarget.value = e.currentTarget.value.replace(/[^0-9\s\-()+.]/g, ''); } } : {})}
      />
      {error && (
        <p className="mt-1 text-sm text-red-600">{error.message as string}</p>
      )}
    </div>
  );
};

export default FormField;
