import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect, useMemo } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useCSSVariable } from 'uniwind';

import { CardGridItem } from '@/components/cards/card-grid-item';
import { DeckGridItem } from '@/components/cards/deck-grid-item';
import { ThemedText } from '@/components/themed-text';
import { Card } from '@/components/ui';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useCards } from '@/hooks/useCards';
import { getStudyOverviewCounts } from '@/services/review/stats';
import type { Card as CardRecord } from '@/types/card';

type DeckSummary = {
  dueCards: number;
  name: string;
  totalCards: number;
};

const chunkIntoRows = <T,>(items: T[], rowSize: number): T[][] => {
  const rows: T[][] = [];
  for (let index = 0; index < items.length; index += rowSize) {
    rows.push(items.slice(index, index + rowSize));
  }
  return rows;
};

export default function HomeScreen() {
  const { cards, loading, error, refreshCards } = useCards();
  const insets = useSafeAreaInsets();
  const isDark = useColorScheme() === 'dark';
  const [mutedLight, mutedDark] = useCSSVariable(['--color-muted-light', '--color-muted-dark']);

  const toColorValue = (value: string | number | undefined, fallback: string) =>
    typeof value === 'string' ? value : fallback;

  const mutedIconColor = toColorValue(isDark ? mutedDark : mutedLight, isDark ? '#9ba1a6' : '#687076');

  useEffect(() => {
    refreshCards();
  }, [refreshCards]);

  const overview = useMemo(() => getStudyOverviewCounts(cards, undefined), [cards]);

  const deckSummaries = useMemo<DeckSummary[]>(() => {
    const now = Date.now();
    const byDeck = new Map<string, DeckSummary>();

    cards.forEach((card) => {
      const deckName = card.deckName?.trim();
      if (!deckName) {
        return;
      }

      const current = byDeck.get(deckName);
      if (current) {
        current.totalCards += 1;
        if (card.dueAt <= now) {
          current.dueCards += 1;
        }
        return;
      }

      byDeck.set(deckName, {
        name: deckName,
        totalCards: 1,
        dueCards: card.dueAt <= now ? 1 : 0,
      });
    });

    return Array.from(byDeck.values()).sort((left, right) => left.name.localeCompare(right.name));
  }, [cards]);

  const deckRows = useMemo(() => chunkIntoRows(deckSummaries, 2), [deckSummaries]);
  const otherCards = useMemo<CardRecord[]>(() => cards.filter((card) => !card.deckName?.trim().length), [cards]);
  const otherCardRows = useMemo(() => chunkIntoRows(otherCards, 2), [otherCards]);

  const onOpenCard = (cardId: string) => {
    router.push(`/card/${cardId}`);
  };

  const onOpenDeck = (deckName: string) => {
    router.push(`/(tabs)/(cards)/deck/${encodeURIComponent(deckName)}` as never);
  };

  const onOpenStudyNow = () => {
    router.push('/review' as never);
  };

  const onOpenCustomStudy = () => {
    router.push('/review/custom' as never);
  };

  return (
    <ScrollView
      className="flex-1 bg-app-light dark:bg-app-dark"
      contentInsetAdjustmentBehavior="automatic"
      contentContainerClassName="gap-3 px-4 pt-3"
      contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
      showsVerticalScrollIndicator={false}
    >
      <Card>
        <ThemedText type="defaultSemiBold" className="opacity-70">
          Study
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

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Start studying now"
          accessibilityHint="Starts your study session"
          onPress={onOpenStudyNow}
          className="mt-3 items-center rounded-full bg-primary px-4 py-3"
          style={({ pressed }) => ({ opacity: pressed ? 0.9 : 1 })}
        >
          <ThemedText className="text-center font-bold text-white">Study Now</ThemedText>
        </Pressable>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Open custom study"
          accessibilityHint="Adjust today's study mix"
          onPress={onOpenCustomStudy}
          className="mt-2 items-center rounded-full bg-tertiary-light px-4 py-3 dark:bg-tertiary-dark"
          style={({ pressed }) => ({ opacity: pressed ? 0.9 : 1 })}
        >
          <ThemedText className="text-center font-semibold">Custom Study</ThemedText>
        </Pressable>

        {loading ? <ThemedText className="mt-2.5 opacity-70">Loading cards...</ThemedText> : null}
        {error ? <ThemedText className="mt-2.5 text-danger">{error}</ThemedText> : null}
      </Card>

      <View className="gap-2.5">
        <ThemedText type="defaultSemiBold" className="text-muted-light dark:text-muted-dark">
          Decks
        </ThemedText>

        {deckRows.length > 0 ? (
          <View className="gap-2.5">
            {deckRows.map((row, rowIndex) => (
              <View key={`deck-row-${rowIndex}`} className="flex-row gap-2.5">
                {row.map((deck) => (
                  <DeckGridItem
                    key={deck.name}
                    name={deck.name}
                    totalCards={deck.totalCards}
                    dueCards={deck.dueCards}
                    onPress={onOpenDeck}
                  />
                ))}
                {row.length === 1 ? <View className="flex-1" /> : null}
              </View>
            ))}
          </View>
        ) : (
          <Card>
            <ThemedText className="text-muted-light dark:text-muted-dark">No decks assigned yet.</ThemedText>
          </Card>
        )}
      </View>

      <View className="gap-2.5">
        <ThemedText type="defaultSemiBold" className="text-muted-light dark:text-muted-dark">
          Cards
        </ThemedText>

        {otherCardRows.length > 0 ? (
          <View className="gap-2.5">
            {otherCardRows.map((row, rowIndex) => (
              <View key={`card-row-${rowIndex}`} className="flex-row gap-2.5">
                {row.map((card) => (
                  <CardGridItem key={card.id} card={card} onPress={onOpenCard} />
                ))}
                {row.length === 1 ? <View className="flex-1" /> : null}
              </View>
            ))}
          </View>
        ) : !loading ? (
          cards.length > 0 ? (
            <Card>
              <ThemedText className="text-muted-light dark:text-muted-dark">No unassigned cards.</ThemedText>
            </Card>
          ) : (
            <Card className="items-center gap-2" padding="lg">
              <Ionicons name="albums-outline" size={24} color={mutedIconColor} />
              <ThemedText type="defaultSemiBold" className="mt-1.5">
                No cards yet
              </ThemedText>
              <ThemedText className="opacity-70">Tap + in the top-right to create your first card.</ThemedText>
            </Card>
          )
        ) : null}
      </View>
    </ScrollView>
  );
}
