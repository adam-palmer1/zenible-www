import React from 'react';
import { FormProvider, UseFormReturn, FieldValues, SubmitHandler } from 'react-hook-form';

interface FormProps<T extends FieldValues = FieldValues> {
  methods: UseFormReturn<T>;
  onSubmit: SubmitHandler<T>;
  children: React.ReactNode;
  className?: string;
}

const Form = <T extends FieldValues = FieldValues>({
  methods,
  onSubmit,
  children,
  className = '',
}: FormProps<T>): React.ReactElement => {
  return (
    <FormProvider {...methods}>
      <form onSubmit={methods.handleSubmit(onSubmit)} className={className}>
        {children}
      </form>
    </FormProvider>
  );
};

export default Form;
