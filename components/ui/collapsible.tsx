import { PropsWithChildren, useState } from 'react';
import { TouchableOpacity } from 'react-native';
import { useCSSVariable } from 'uniwind';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useColorScheme } from '@/hooks/use-color-scheme';

export function Collapsible({ children, title }: PropsWithChildren & { title: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const isDark = useColorScheme() === 'dark';
  const [iconLight, iconDark] = useCSSVariable(['--color-muted-light', '--color-muted-dark']);

  const toColorValue = (value: string | number | undefined, fallback: string) =>
    typeof value === 'string' ? value : fallback;
  const iconColor = toColorValue(isDark ? iconDark : iconLight, isDark ? '#9ba1a6' : '#687076');

  return (
    <ThemedView>
      <TouchableOpacity
        className="flex-row items-center gap-1.5"
        onPress={() => setIsOpen((value) => !value)}
        activeOpacity={0.8}
      >
        <IconSymbol
          name="chevron.right"
          size={18}
          weight="medium"
          color={iconColor}
          style={{ transform: [{ rotate: isOpen ? '90deg' : '0deg' }] }}
        />

        <ThemedText type="defaultSemiBold">{title}</ThemedText>
      </TouchableOpacity>
      {isOpen && <ThemedView className="ml-6 mt-1.5">{children}</ThemedView>}
    </ThemedView>
  );
}
