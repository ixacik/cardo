import { Pressable, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';

type DeckGridItemProps = {
  dueCards: number;
  name: string;
  onPress: (deckName: string) => void;
  totalCards: number;
};

export function DeckGridItem({ dueCards, name, onPress, totalCards }: DeckGridItemProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Open deck ${name}`}
      className="min-h-[186px] flex-1 overflow-hidden"
      onPress={() => onPress(name)}
      style={({ pressed }) => ({
        transform: [{ scale: pressed ? 0.985 : 1 }],
      })}
    >
      <View className="relative h-[186px]">
        <View className="absolute inset-x-0 top-0 h-[150px] rounded-[26px] bg-surface-light dark:bg-surface-dark" />
        <View className="absolute inset-x-0 top-[6px] h-[150px] rounded-[26px] bg-surface-light dark:bg-surface-dark" />
        <View className="absolute inset-x-0 top-[12px] h-[150px] rounded-[26px] bg-surface-light dark:bg-surface-dark" />

        <View className="absolute inset-x-0 top-[18px] h-[168px] rounded-[26px] bg-surface-light p-4 dark:bg-surface-dark">
          <View className="absolute inset-x-0 top-0 h-[60px] rounded-t-[26px] bg-input-light dark:bg-input-dark" />
          <View className="flex-1 justify-end">
            <ThemedText type="defaultSemiBold" numberOfLines={1}>
              {name}
            </ThemedText>
            <ThemedText className="mt-1 text-muted-light dark:text-muted-dark">
              {totalCards} {totalCards === 1 ? 'card' : 'cards'}
            </ThemedText>
            <ThemedText className="mt-0.5 text-muted-light dark:text-muted-dark">
              {dueCards} due now
            </ThemedText>
          </View>
        </View>
      </View>
    </Pressable>
  );
}
