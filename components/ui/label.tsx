import type { ReactNode } from 'react';
import { Pressable, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { cn } from '@/lib/cn';

export type LabelVariant = 'chip' | 'badge';

const VARIANT_CLASSNAME: Record<LabelVariant, string> = {
  chip: 'rounded-full px-3.5 py-1.5',
  badge: 'rounded-full px-2.5 py-1',
};

const VARIANT_ALPHA: Record<LabelVariant, string> = {
  chip: '20',
  badge: '30',
};

export type LabelProps = {
  children: ReactNode;
  variant?: LabelVariant;
  accentColor?: string;
  onPress?: () => void;
  disabled?: boolean;
  className?: string;
  textClassName?: string;
};

const isTextContent = (children: ReactNode) => typeof children === 'string' || typeof children === 'number';

export function Label({
  children,
  variant = 'chip',
  accentColor = '#0a84ff',
  onPress,
  disabled = false,
  className,
  textClassName,
}: LabelProps) {
  const backgroundColor = `${accentColor}${VARIANT_ALPHA[variant]}`;
  const content = isTextContent(children) ? (
    <ThemedText className={cn('text-xs font-semibold', textClassName)} style={{ color: accentColor }}>
      {children}
    </ThemedText>
  ) : (
    children
  );

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        disabled={disabled}
        accessibilityRole="button"
        className={cn(VARIANT_CLASSNAME[variant], className)}
        style={({ pressed }) => ({
          opacity: disabled ? 0.6 : pressed ? 0.86 : 1,
          backgroundColor,
        })}
      >
        {content}
      </Pressable>
    );
  }

  return (
    <View className={cn(VARIANT_CLASSNAME[variant], className)} style={{ backgroundColor }}>
      {content}
    </View>
  );
}
