import { Text, type TextProps } from 'react-native';

import { cn } from '@/lib/cn';

export type ThemedTextProps = TextProps & {
  type?: 'default' | 'title' | 'defaultSemiBold' | 'subtitle' | 'link';
};

const TYPE_CLASSNAME: Record<NonNullable<ThemedTextProps['type']>, string> = {
  default: 'text-base leading-6',
  defaultSemiBold: 'text-base leading-6 font-semibold',
  title: 'text-3xl leading-9 font-bold',
  subtitle: 'text-xl font-bold',
  link: 'text-base leading-8 font-semibold text-link',
};

export function ThemedText({ className, type = 'default', ...rest }: ThemedTextProps) {
  return (
    <Text
      className={cn('text-fg-light dark:text-fg-dark', TYPE_CLASSNAME[type], className)}
      {...rest}
    />
  );
}
