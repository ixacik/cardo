import type { ReactNode } from 'react';
import { Pressable, type PressableProps } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { cn } from '@/lib/cn';

export type ButtonVariant = 'primary' | 'secondary' | 'destructive' | 'link';

type VariantStyles = {
  container: string;
  text: string;
};

const VARIANT_STYLES: Record<ButtonVariant, VariantStyles> = {
  primary: {
    container: 'items-center rounded-control bg-primary px-4 py-3',
    text: 'font-semibold text-white',
  },
  secondary: {
    container: 'items-center rounded-control bg-surface-light px-4 py-3 dark:bg-surface-dark',
    text: 'font-semibold',
  },
  destructive: {
    container: 'items-center rounded-control bg-danger-strong px-4 py-3',
    text: 'font-semibold text-white',
  },
  link: {
    container: 'py-1',
    text: 'font-semibold text-link',
  },
};

export type ButtonProps = Omit<PressableProps, 'style'> & {
  variant?: ButtonVariant;
  loading?: boolean;
  disabled?: boolean;
  className?: string;
  textClassName?: string;
  children: ReactNode;
};

const isTextContent = (children: ReactNode) => typeof children === 'string' || typeof children === 'number';

export function Button({
  variant = 'primary',
  loading = false,
  disabled = false,
  className,
  textClassName,
  children,
  accessibilityRole,
  ...props
}: ButtonProps) {
  const isDisabled = disabled || loading;
  const styles = VARIANT_STYLES[variant];

  return (
    <Pressable
      {...props}
      accessibilityRole={accessibilityRole ?? 'button'}
      disabled={isDisabled}
      className={cn(styles.container, className)}
      style={({ pressed }) => ({ opacity: isDisabled ? 0.6 : pressed ? 0.92 : 1 })}
    >
      {isTextContent(children) ? (
        <ThemedText className={cn(styles.text, textClassName)}>{children}</ThemedText>
      ) : (
        children
      )}
    </Pressable>
  );
}
