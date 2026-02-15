import { Pressable, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Card } from '@/components/ui';
import { cn } from '@/lib/cn';
import type { Card as CardRecord } from '@/types/card';

type CardGridItemProps = {
  card: CardRecord;
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
      className="min-w-0 basis-0 flex-1"
      style={({ pressed }) => ({
        transform: [{ scale: pressed ? 0.985 : 1 }],
      })}
      onPress={() => onPress(card.id)}
    >
      <Card className="h-[180px]" padding="sm">
        <View className="h-full justify-between gap-2">
          <ThemedText type="defaultSemiBold">{card.title || 'Untitled card'}</ThemedText>
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
      </Card>
    </Pressable>
  );
}
