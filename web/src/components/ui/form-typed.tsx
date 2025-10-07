'use client';

import * as React from 'react';
import { forwardRef } from 'react';
import { FieldPath, FieldValues, useFormContext } from 'react-hook-form';
import {
  FormField,
  FormControl,
  FormDescription,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import type { InputHTMLAttributes } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';

// Define TextareaProps type since it's not exported from the textarea component
type TextareaProps = React.ComponentProps<typeof Textarea>;

// Create a wrapper to properly type the forwarded ref for Input
const TypedInput = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>((props, ref) => (
  <Input ref={ref} {...props} />
));
TypedInput.displayName = 'TypedInput';

// Create a wrapper to properly type the forwarded ref for Textarea
const TypedTextarea = forwardRef<HTMLTextAreaElement, TextareaProps>((props, ref) => (
  <Textarea ref={ref} {...props} />
));
TypedTextarea.displayName = 'TypedTextarea';

type BaseFormFieldProps<TFieldValues extends FieldValues> = {
  name: FieldPath<TFieldValues>;
  label: string;
  description?: string;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
};

type InputFormFieldProps<TFieldValues extends FieldValues> = BaseFormFieldProps<TFieldValues> & {
  type?: 'input';
  inputType?: React.HTMLInputTypeAttribute;
  min?: string | number;
  max?: string | number;
  step?: string | number;
  inputClassName?: string;
  startIcon?: React.ReactNode;
};

type TextareaFormFieldProps<TFieldValues extends FieldValues> = BaseFormFieldProps<TFieldValues> & {
  type: 'textarea';
  rows?: number;
};

type SwitchFormFieldProps<TFieldValues extends FieldValues> = BaseFormFieldProps<TFieldValues> & {
  type: 'switch';
  description?: string;
};

type FormFieldComponentProps<TFieldValues extends FieldValues> =
  | InputFormFieldProps<TFieldValues>
  | TextareaFormFieldProps<TFieldValues>
  | SwitchFormFieldProps<TFieldValues>;

export function TypedFormField<TFieldValues extends FieldValues>({
  name,
  label,
  description,
  placeholder,
  className,
  disabled = false,
  type = 'input',
  ...props
}: FormFieldComponentProps<TFieldValues>) {
  const form = useFormContext<TFieldValues>();
  
  const renderField = ({ field }: { field: { value: string | number | boolean; onChange: (value: string | number | boolean) => void } }) => {
    const commonProps = {
      disabled,
      placeholder,
      className: (props as InputFormFieldProps<TFieldValues>).inputClassName || '',
    };

    const inputProps = props as InputFormFieldProps<TFieldValues>;
    const textareaProps = props as TextareaFormFieldProps<TFieldValues>;

    switch (type) {
      case 'textarea':
        return (
          <TypedTextarea
            value={field.value as string}
            onChange={(e) => field.onChange(e.target.value)}
            rows={textareaProps.rows}
            className={`${commonProps.className} ${className || ''}`}
          />
        );
      case 'switch':
        return (
          <div className="flex items-center space-x-2">
            <Switch
              checked={field.value as boolean}
              onCheckedChange={(value: boolean) => field.onChange(value)}
              disabled={disabled}
            />
          </div>
        );
      default:
        return (
          <div className="relative">
            {inputProps.startIcon && (
              <div className="absolute left-3 top-1/2 -translate-y-1/2">
                {inputProps.startIcon}
              </div>
            )}
            <TypedInput
              value={field.value as string | number}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => field.onChange(e.target.value)}
              type={inputProps.inputType || 'text'}
              min={inputProps.min}
              max={inputProps.max}
              step={inputProps.step}
              className={`${commonProps.className} ${inputProps.startIcon ? 'pl-10' : ''} ${className || ''}`}
            />
          </div>
        );
    }
  };

  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem className={className}>
          <div className="flex items-center justify-between">
            <FormLabel>{label}</FormLabel>
            {type === 'switch' && (props as SwitchFormFieldProps<TFieldValues>).description && (
              <span className="text-sm text-muted-foreground">
                {(props as SwitchFormFieldProps<TFieldValues>).description}
              </span>
            )}
          </div>
          <FormControl>
            {renderField({ field })}
          </FormControl>
          {description && <FormDescription>{description}</FormDescription>}
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
