import type { ReactNode } from 'react';
import type { ViewProps } from 'react-native';
import { View } from 'react-native';

import { cn } from '@/lib/cn';

type CardPadding = 'none' | 'sm' | 'md' | 'lg';

const PADDING_CLASSNAME: Record<CardPadding, string> = {
  none: '',
  sm: 'p-3',
  md: 'p-4',
  lg: 'p-6',
};

export type CardProps = ViewProps & {
  children: ReactNode;
  padding?: CardPadding;
  className?: string;
};

export function Card({ children, padding = 'md', className, ...props }: CardProps) {
  return (
    <View
      {...props}
      className={cn(
        'rounded-[14px] bg-surface-light dark:bg-surface-dark',
        PADDING_CLASSNAME[padding],
        className
      )}
    >
      {children}
    </View>
  );
}
