import React from 'react';
import { FormProvider } from 'react-hook-form';

/**
 * Form wrapper component that provides React Hook Form context
 *
 * @param {Object} props
 * @param {Object} props.methods - useForm() result object
 * @param {Function} props.onSubmit - Form submit handler
 * @param {React.ReactNode} props.children - Form fields
 * @param {string} props.className - Additional CSS classes
 */
const Form = ({ methods, onSubmit, children, className = '' }) => {
  return (
    <FormProvider {...methods}>
      <form onSubmit={methods.handleSubmit(onSubmit)} className={className}>
        {children}
      </form>
    </FormProvider>
  );
};

export default Form;
