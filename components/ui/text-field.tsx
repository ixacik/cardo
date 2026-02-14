import { TextInput, type TextInputProps } from 'react-native';

import { cn } from '@/lib/cn';

export type TextFieldProps = TextInputProps & {
  invalid?: boolean;
  className?: string;
  placeholderTextColorClassName?: string;
};

export function TextField({
  invalid = false,
  className,
  placeholderTextColorClassName,
  ...props
}: TextFieldProps) {
  return (
    <TextInput
      {...props}
      placeholderTextColorClassName={
        placeholderTextColorClassName ?? 'text-subtle-light dark:text-subtle-dark'
      }
      className={cn(
        'rounded-[14px] bg-surface-light px-4 py-4 text-fg-light dark:bg-surface-dark dark:text-fg-dark',
        invalid && 'bg-danger/10',
        className
      )}
    />
  );
}
