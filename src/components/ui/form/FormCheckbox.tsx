import React from 'react';
import { useFormContext, RegisterOptions, FieldValues } from 'react-hook-form';

interface FormCheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'name' | 'type'> {
  name: string;
  label: string;
  className?: string;
  registerOptions?: RegisterOptions<FieldValues>;
}

const FormCheckbox: React.FC<FormCheckboxProps> = ({
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
          {...register(name, registerOptions as any)}
          {...checkboxProps}
        />
        <span className="ml-2 text-sm text-gray-700">{label}</span>
      </label>
      {error && (
        <p className="mt-1 text-sm text-red-600">{error.message as string}</p>
      )}
    </div>
  );
};

export default FormCheckbox;
