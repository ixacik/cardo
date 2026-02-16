import { Stack, router, useLocalSearchParams } from 'expo-router';
import { useMemo } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CardGridItem } from '@/components/cards/card-grid-item';
import { ThemedText } from '@/components/themed-text';
import { Card } from '@/components/ui';
import { useCards } from '@/hooks/useCards';
import { getStudyOverviewCounts } from '@/services/review/stats';
import type { Card as CardRecord } from '@/types/card';

const chunkIntoRows = <T,>(items: T[], rowSize: number): T[][] => {
  const rows: T[][] = [];
  for (let index = 0; index < items.length; index += rowSize) {
    rows.push(items.slice(index, index + rowSize));
  }
  return rows;
};

const parseDeckName = (value: string | string[] | undefined): string => {
  if (typeof value !== 'string') {
    return '';
  }

  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
};

export default function DeckCardsScreen() {
  const insets = useSafeAreaInsets();
  const { cards } = useCards();
  const { deckName } = useLocalSearchParams<{ deckName?: string }>();

  const resolvedDeckName = useMemo(() => parseDeckName(deckName), [deckName]);

  const deckCards = useMemo<CardRecord[]>(() => {
    const targetDeckName = resolvedDeckName.trim();
    if (!targetDeckName) {
      return [];
    }

    return cards.filter((card) => (card.deckName?.trim() ?? '') === targetDeckName);
  }, [cards, resolvedDeckName]);

  const overview = useMemo(() => getStudyOverviewCounts(deckCards, resolvedDeckName), [deckCards, resolvedDeckName]);
  const cardRows = useMemo(() => chunkIntoRows(deckCards, 2), [deckCards]);

  const onOpenCard = (cardId: string) => {
    router.push(`/card/${cardId}`);
  };

  const onOpenStudyNow = () => {
    const deckParam = resolvedDeckName ? `?deckName=${encodeURIComponent(resolvedDeckName)}` : '';
    router.push(`/review${deckParam}` as never);
  };

  const onOpenCustomStudy = () => {
    const deckParam = resolvedDeckName ? `?deckName=${encodeURIComponent(resolvedDeckName)}` : '';
    router.push(`/review/custom${deckParam}` as never);
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: resolvedDeckName || 'Deck',
          headerLargeTitle: false,
        }}
      />

      <ScrollView
        className="flex-1 bg-app-light dark:bg-app-dark"
        contentInsetAdjustmentBehavior="automatic"
        contentContainerClassName="gap-3 px-4 pt-3"
        contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
        showsVerticalScrollIndicator={false}
      >
        <Card>
          <ThemedText type="defaultSemiBold" className="opacity-70">
            {resolvedDeckName || 'Deck'}
          </ThemedText>

          <View className="mt-2 flex-row gap-3">
            <View className="flex-1 rounded-2xl bg-tertiary-light px-3 py-2 dark:bg-tertiary-dark">
              <ThemedText className="text-xs uppercase opacity-65">New</ThemedText>
              <ThemedText type="subtitle" className="mt-1">
                {overview.newCount}
              </ThemedText>
            </View>
            <View className="flex-1 rounded-2xl bg-tertiary-light px-3 py-2 dark:bg-tertiary-dark">
              <ThemedText className="text-xs uppercase opacity-65">Learning</ThemedText>
              <ThemedText type="subtitle" className="mt-1">
                {overview.learningCount}
              </ThemedText>
            </View>
            <View className="flex-1 rounded-2xl bg-tertiary-light px-3 py-2 dark:bg-tertiary-dark">
              <ThemedText className="text-xs uppercase opacity-65">Due</ThemedText>
              <ThemedText type="subtitle" className="mt-1">
                {overview.reviewDueCount}
              </ThemedText>
            </View>
          </View>

          <View className="mt-3 flex-row gap-2">
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Study this deck"
              accessibilityHint="Starts your study session"
              onPress={onOpenStudyNow}
              className="flex-1 items-center rounded-full bg-primary px-4 py-3"
              style={({ pressed }) => ({ opacity: pressed ? 0.9 : 1 })}
            >
              <ThemedText className="text-center font-bold text-white">Study Now</ThemedText>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Open custom study for this deck"
              accessibilityHint="Adjust today's limits for this deck"
              onPress={onOpenCustomStudy}
              className="flex-1 items-center rounded-full bg-tertiary-light px-4 py-3 dark:bg-tertiary-dark"
              style={({ pressed }) => ({ opacity: pressed ? 0.9 : 1 })}
            >
              <ThemedText className="text-center font-semibold">Custom Study</ThemedText>
            </Pressable>
          </View>
        </Card>

        {cardRows.length > 0 ? (
          <View className="gap-2.5">
            {cardRows.map((row, rowIndex) => (
              <View key={`deck-card-row-${rowIndex}`} className="flex-row gap-2.5">
                {row.map((card) => (
                  <CardGridItem key={card.id} card={card} onPress={onOpenCard} />
                ))}
                {row.length === 1 ? <View className="flex-1" /> : null}
              </View>
            ))}
          </View>
        ) : (
          <Card>
            <ThemedText className="text-muted-light dark:text-muted-dark">
              No cards are currently assigned to this deck.
            </ThemedText>
          </Card>
        )}
      </ScrollView>
    </>
  );
}
