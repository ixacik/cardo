import { Ionicons } from '@expo/vector-icons';
import { Pressable, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Card } from '@/components/ui';
import { useColorScheme } from '@/hooks/use-color-scheme';

type SearchBarTriggerProps = {
  onPress: () => void;
  placeholder?: string;
};

export function SearchBarTrigger({ onPress, placeholder = 'Search decks or categories' }: SearchBarTriggerProps) {
  const isDark = useColorScheme() === 'dark';

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({ opacity: pressed ? 0.9 : 1 })}
      accessibilityRole="button"
      accessibilityHint="Opens deck search"
      accessibilityLabel="Search decks"
    >
      <Card className="px-4 py-3">
        <View className="flex-row items-center gap-2.5">
          <Ionicons name="search" size={17} color={isDark ? '#9ba1a6' : '#687076'} />
          <ThemedText className="opacity-65">{placeholder}</ThemedText>
        </View>
      </Card>
    </Pressable>
  );
}
