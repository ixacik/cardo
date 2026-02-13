import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useEffect, useMemo } from "react";
import { FlatList, Platform, Pressable, ScrollView, View } from "react-native";
import { useCSSVariable } from "uniwind";
import { CardGridItem } from "@/components/cards/card-grid-item";
import { DeckGridItem } from "@/components/cards/deck-grid-item";
import { ThemedText } from "@/components/themed-text";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useCards } from "@/hooks/useCards";
import type { Card } from "@/types/card";

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
  const iosVersion =
    typeof Platform.Version === 'string'
      ? Number.parseInt(Platform.Version, 10)
      : Platform.Version;
  const shouldUseNativeTabsFriendlyScroll = Platform.OS === 'ios' && iosVersion >= 26;
  const isDark = useColorScheme() === 'dark';
  const [mutedLight, mutedDark] = useCSSVariable(['--color-muted-light', '--color-muted-dark']);

  const toColorValue = (value: string | number | undefined, fallback: string) =>
    typeof value === 'string' ? value : fallback;

  const mutedIconColor = toColorValue(isDark ? mutedDark : mutedLight, isDark ? '#9ba1a6' : '#687076');

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

    if (__DEV__ && !byDeck.has('Debug Deck')) {
      byDeck.set('Debug Deck', {
        name: 'Debug Deck',
        totalCards: 24,
        dueCards: 6,
      });
    }

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

  const listHeader = (
    <View className="mb-2.5 gap-2.5">
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

  return (
    <>
      <FlatList
        data={cards}
        keyExtractor={(item) => item.id}
        numColumns={2}
        className="flex-1 bg-app-light dark:bg-app-dark"
        columnWrapperClassName="mb-2.5 gap-2.5"
        contentInsetAdjustmentBehavior="automatic"
        contentContainerClassName="px-4 pt-3"
        contentContainerStyle={{ paddingBottom: insets.bottom + 120 }}
        ListHeaderComponent={
          <View className="mb-3.5 rounded-[14px] bg-surface-light p-4 dark:bg-surface-dark">
            <ThemedText type="defaultSemiBold" className="opacity-70">
              Review Queue
            </ThemedText>
            <ThemedText type="title" className="mb-0.5 mt-1.5">
              {dueCount}
            </ThemedText>
            <ThemedText className="mb-3 opacity-75">
              {dueCount === 1 ? '1 card is due now' : `${dueCount} cards are due now`}
            </ThemedText>

        {loading ? <ThemedText className="mt-2.5 opacity-70">Loading cards...</ThemedText> : null}
        {error ? <ThemedText className="mt-2.5 text-danger">{error}</ThemedText> : null}
      </View>

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

  const listEmptyState = !loading ? (
    cards.length > 0 ? (
      <View className="rounded-[14px] bg-surface-light p-4 dark:bg-surface-dark">
        <ThemedText className="text-muted-light dark:text-muted-dark">No unassigned cards.</ThemedText>
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
  ) : null;

  if (shouldUseNativeTabsFriendlyScroll) {
    return (
      <ScrollView
        className="flex-1 bg-app-light dark:bg-app-dark"
        contentInsetAdjustmentBehavior="automatic"
        contentContainerClassName="gap-2.5 px-4 pb-6 pt-3"
        showsVerticalScrollIndicator={false}
      >
        {listHeader}
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
        ) : (
          listEmptyState
        )}
      </ScrollView>
    );
  }

  return (
    <FlatList
      data={otherCards}
      keyExtractor={(item) => item.id}
      numColumns={2}
      className="flex-1 bg-app-light dark:bg-app-dark"
      columnWrapperClassName="mb-2.5 gap-2.5"
      contentInsetAdjustmentBehavior="automatic"
      contentContainerClassName="px-4 pb-6 pt-3"
      ListHeaderComponent={listHeader}
      ListEmptyComponent={listEmptyState}
      renderItem={({ item }) => <CardGridItem card={item} onPress={onOpenCard} />}
    />
  );
}
