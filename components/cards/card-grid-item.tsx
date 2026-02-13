import { Pressable, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { cn } from '@/lib/cn';
import type { Card } from '@/types/card';

type CardGridItemProps = {
  card: Card;
  onPress: (cardId: string) => void;
};

const getDueLabel = (dueAt: number) => {
  const diffMs = dueAt - Date.now();
  if (diffMs <= 0) {
    return 'Due now';
  }

  const diffHours = Math.round(diffMs / (1000 * 60 * 60));
  if (diffHours < 24) {
    return `Due in ${Math.max(diffHours, 1)}h`;
  }

  const diffDays = Math.round(diffHours / 24);
  return `Due in ${Math.max(diffDays, 1)}d`;
};

export function CardGridItem({ card, onPress }: CardGridItemProps) {
  const dueNow = card.dueAt <= Date.now();

  return (
    <Pressable
      className="min-w-0 flex-1"
      style={({ pressed }) => ({
        transform: [{ scale: pressed ? 0.985 : 1 }],
      })}
      onPress={() => onPress(card.id)}
    >
      <View className="min-h-[210px] rounded-[14px] bg-surface-light p-3 dark:bg-surface-dark">
        <View className="mb-2 gap-1.5">
          <ThemedText type="defaultSemiBold" numberOfLines={1} className="mb-0.5">
            {card.title || 'Untitled card'}
          </ThemedText>
          <View
            className={cn(
              'self-start rounded-full px-2 py-[3px]',
              dueNow ? 'bg-danger/10' : 'bg-primary/10'
            )}
          >
            <ThemedText className={cn('text-xs font-semibold', dueNow ? 'text-danger' : 'text-primary')}>
              {getDueLabel(card.dueAt)}
            </ThemedText>
          </View>
        </View>

        <ThemedText numberOfLines={4} className="leading-[22px] opacity-90">
          {card.frontText}
        </ThemedText>

        <ThemedText numberOfLines={3} className="mt-2.5 leading-5 opacity-75">
          {card.backText}
        </ThemedText>

        {card.imageUris && card.imageUris.length > 0 ? (
          <ThemedText type="defaultSemiBold" className="mt-auto text-[13px] opacity-60">
            {card.imageUris.length} image{card.imageUris.length > 1 ? 's' : ''}
          </ThemedText>
        ) : null}
      </View>
    </Pressable>
  );
}
