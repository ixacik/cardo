import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect, useMemo } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useCSSVariable } from 'uniwind';

import { CardGridItem } from '@/components/cards/card-grid-item';
import { DeckGridItem } from '@/components/cards/deck-grid-item';
import { ThemedText } from '@/components/themed-text';
import { useCards } from '@/hooks/useCards';
import { useColorScheme } from '@/hooks/use-color-scheme';
import type { Card } from '@/types/card';

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
  const [mutedLight, mutedDark, onPrimary] = useCSSVariable([
    '--color-muted-light',
    '--color-muted-dark',
    '--color-surface-light',
  ]);

  const toColorValue = (value: string | number | undefined, fallback: string) =>
    typeof value === 'string' ? value : fallback;

  const mutedIconColor = toColorValue(isDark ? mutedDark : mutedLight, isDark ? '#9ba1a6' : '#687076');
  const onPrimaryColor = toColorValue(onPrimary, '#ffffff');

  useEffect(() => {
    refreshCards();
  }, [refreshCards]);

  const dueCount = useMemo(() => {
    const now = Date.now();
    return cards.filter((card) => card.dueAt <= now).length;
  }, [cards]);

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
  const otherCards = useMemo<Card[]>(
    () => cards.filter((card) => !(card.deckName?.trim().length)),
    [cards]
  );
  const otherCardRows = useMemo(() => chunkIntoRows(otherCards, 2), [otherCards]);

  const onOpenCard = (cardId: string) => {
    router.push(`/card/${cardId}`);
  };

  const onOpenReview = () => {
    router.push('/review');
  };

  const onCreateCard = () => {
    router.push('/card/create' as never);
  };

  return (
    <>
      <ScrollView
        className="flex-1 bg-app-light dark:bg-app-dark"
        contentInsetAdjustmentBehavior="automatic"
        contentContainerClassName="gap-3 px-4 pt-3"
        contentContainerStyle={{ paddingBottom: insets.bottom + 120 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="rounded-[14px] bg-surface-light p-4 dark:bg-surface-dark">
          <ThemedText type="defaultSemiBold" className="opacity-70">
            Review Queue
          </ThemedText>
          <ThemedText type="title" className="mb-0.5 mt-1.5">
            {dueCount}
          </ThemedText>
          <ThemedText className="mb-3 opacity-75">
            {dueCount === 1 ? '1 card is due now' : `${dueCount} cards are due now`}
          </ThemedText>

          <Pressable
            className="items-center rounded-control bg-primary px-4 py-3"
            onPress={onOpenReview}
            style={({ pressed }) => ({ opacity: pressed ? 0.92 : 1 })}
          >
            <ThemedText className="font-bold text-white">Start Review</ThemedText>
          </Pressable>

          {loading ? <ThemedText className="mt-2.5 opacity-70">Loading cards...</ThemedText> : null}
          {error ? <ThemedText className="mt-2.5 text-danger">{error}</ThemedText> : null}
        </View>

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
                    />
                  ))}
                  {row.length === 1 ? <View className="flex-1" /> : null}
                </View>
              ))}
            </View>
          ) : (
            <View className="rounded-[14px] bg-surface-light p-4 dark:bg-surface-dark">
              <ThemedText className="text-muted-light dark:text-muted-dark">
                No decks assigned yet.
              </ThemedText>
            </View>
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
              <View className="rounded-[14px] bg-surface-light p-4 dark:bg-surface-dark">
                <ThemedText className="text-muted-light dark:text-muted-dark">
                  No unassigned cards.
                </ThemedText>
              </View>
            ) : (
              <View className="items-center gap-2 rounded-[14px] bg-surface-light p-6 dark:bg-surface-dark">
                <Ionicons name="albums-outline" size={24} color={mutedIconColor} />
                <ThemedText type="defaultSemiBold" className="mt-1.5">
                  No cards yet
                </ThemedText>
                <ThemedText className="opacity-70">Tap + to create your first card.</ThemedText>
              </View>
            )
          ) : null}
        </View>
      </ScrollView>

      <Pressable
        accessibilityLabel="Create new card"
        accessibilityHint="Opens the new card modal"
        accessibilityRole="button"
        onPress={onCreateCard}
        className="absolute right-[18px] size-[58px] items-center justify-center rounded-full bg-primary shadow-xl shadow-black/25"
        style={({ pressed }) => ({
          bottom: insets.bottom + 72,
          transform: [{ scale: pressed ? 0.96 : 1 }],
        })}
      >
        <Ionicons name="add" size={30} color={onPrimaryColor} />
      </Pressable>
    </>
  );
}
