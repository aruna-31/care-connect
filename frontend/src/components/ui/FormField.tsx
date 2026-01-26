import React from 'react';
import { useFormContext } from 'react-hook-form';
import { Input } from './Input';


interface FormFieldProps extends React.ComponentProps<typeof Input> {
    name: string;
    label: string;
}

export const FormField: React.FC<FormFieldProps> = ({ name, label, className, ...props }) => {
    const { register, formState: { errors } } = useFormContext();
    const error = errors[name]?.message as string | undefined;

    return (
        <Input
            label={label}
            error={error}
            className={className}
            {...register(name)}
            {...props}
        />
    );
};
