import { View } from 'react-native';

import { ThemedText } from '@/components/themed-text';

type DeckGridItemProps = {
  dueCards: number;
  name: string;
  totalCards: number;
};

export function DeckGridItem({ dueCards, name, totalCards }: DeckGridItemProps) {
  return (
    <View className="flex-1 pt-5">
      <View className="pointer-events-none absolute inset-x-0 top-0 items-center">
        <View className="h-5 w-[76%] rounded-[10px] border border-border-light bg-panel-light dark:border-border-dark dark:bg-panel-dark" />
        <View className="-mt-3 h-5 w-[76%] rounded-[10px] border border-border-light bg-input-light dark:border-border-dark dark:bg-input-dark" />
        <View className="-mt-3 h-5 w-[76%] rounded-[10px] border border-border-light bg-surface-light dark:border-border-dark dark:bg-surface-dark" />
      </View>

      <View className="min-h-[110px] rounded-[14px] border border-border-light bg-surface-light p-3.5 dark:border-border-dark dark:bg-surface-dark">
        <ThemedText type="defaultSemiBold" numberOfLines={1}>
          {name}
        </ThemedText>
        <ThemedText className="mt-1.5 text-muted-light dark:text-muted-dark">
          {totalCards} {totalCards === 1 ? 'card' : 'cards'}
        </ThemedText>
        <ThemedText className="mt-1 text-muted-light dark:text-muted-dark">
          {dueCards} due now
        </ThemedText>
      </View>
    </View>
  );
}
