import { router, useLocalSearchParams } from 'expo-router';
import { ActivityIndicator, Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { SocialStatRow } from '@/components/explore/social-stat-row';
import { ThemedText } from '@/components/themed-text';
import {
  toDeckCardPreview,
  toDeckSummary,
  type RawCardPreviewRecord,
  type RawDeckRecord,
} from '@/services/explore/mappers';
import { db } from '@/services/instant';

type DeckWithCardsRecord = RawDeckRecord & {
  cards?: RawCardPreviewRecord[];
};

type DeckDetailsQueryState = {
  data?: {
    decks?: DeckWithCardsRecord[];
  };
  isLoading: boolean;
};

const formatPublishedDate = (publishedAt: number | undefined) => {
  if (!publishedAt || !Number.isFinite(publishedAt)) {
    return 'Not published';
  }

  return new Date(publishedAt).toLocaleDateString();
};

export default function DeckDetailsScreen() {
  const insets = useSafeAreaInsets();
  const { deckId } = useLocalSearchParams<{ deckId?: string }>();
  const parsedDeckId = typeof deckId === 'string' ? deckId : '';

  const deckQuery = db.useQuery(
    parsedDeckId
      ? ({
          decks: {
            $: {
              where: {
                id: parsedDeckId,
              },
              limit: 1,
            },
            cards: {
              $: {
                order: {
                  createdAt: 'asc',
                },
                limit: 120,
              },
            },
          },
        } as any)
      : null
  ) as DeckDetailsQueryState;

  const deckRow = deckQuery.data?.decks?.[0];
  const deck = deckRow ? toDeckSummary(deckRow) : undefined;
  const cards = (deckRow?.cards ?? []).map(toDeckCardPreview);

  if (deckQuery.isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-app-light dark:bg-app-dark">
        <ActivityIndicator color="#0a84ff" />
      </View>
    );
  }

  if (!deck) {
    return (
      <View
        className="flex-1 bg-app-light px-5 dark:bg-app-dark"
        style={{
          paddingTop: insets.top + 20,
          paddingBottom: insets.bottom + 20,
          paddingLeft: insets.left + 20,
          paddingRight: insets.right + 20,
        }}
      >
        <ThemedText type="title">Deck not available</ThemedText>
        <ThemedText className="mt-3 opacity-75">
          This deck may be private, removed, or unavailable in your current permissions.
        </ThemedText>

        <Pressable
          className="mt-6 items-center rounded-control bg-primary px-4 py-3"
          onPress={() => router.back()}
          style={({ pressed }) => ({ opacity: pressed ? 0.9 : 1 })}
        >
          <ThemedText className="font-semibold text-white">Back to Explore</ThemedText>
        </Pressable>
      </View>
    );
  }

  const badgeColor = deck.category?.accentColor ?? '#0a84ff';

  return (
    <View
      className="flex-1 bg-app-light dark:bg-app-dark"
      style={{
        paddingLeft: insets.left,
        paddingRight: insets.right,
        paddingBottom: insets.bottom,
      }}
    >
      <ScrollView
        className="flex-1"
        contentInsetAdjustmentBehavior="automatic"
        contentContainerClassName="gap-4 px-5 pb-10 pt-4"
        showsVerticalScrollIndicator={false}
      >
        <View className="overflow-hidden rounded-3xl border border-border-light bg-surface-light dark:border-border-dark dark:bg-surface-dark">
          <View className="px-5 pb-5 pt-4" style={{ backgroundColor: `${badgeColor}20` }}>
            <View className="mb-3 flex-row items-center justify-between">
              <View className="rounded-full px-2.5 py-1" style={{ backgroundColor: `${badgeColor}30` }}>
                <ThemedText className="text-xs font-semibold" style={{ color: badgeColor }}>
                  {deck.category?.label ?? 'General'}
                </ThemedText>
              </View>
              <ThemedText className="text-xs opacity-75">{deck.cardCount} cards</ThemedText>
            </View>

            <ThemedText type="title" className="text-[30px] leading-9">
              {deck.title}
            </ThemedText>

            <ThemedText className="mt-2 opacity-80">
              {deck.description || deck.subtitle || 'Community deck'}
            </ThemedText>

            <ThemedText className="mt-3 text-sm opacity-75">By {deck.ownerDisplayName}</ThemedText>
            <ThemedText className="mt-0.5 text-xs opacity-70">
              Published {formatPublishedDate(deck.publishedAt)}
            </ThemedText>
          </View>

          <View className="gap-2 px-5 pb-5 pt-4">
            <SocialStatRow
              downloadsCount={deck.downloadsCount}
              likesCount={deck.likesCount}
              savesCount={deck.savesCount}
              averageRating={deck.averageRating}
              ratingCount={deck.ratingCount}
            />

            <View className="mt-2 flex-row gap-2">
              <Pressable
                disabled
                className="flex-1 items-center rounded-control bg-primary/50 px-4 py-3"
              >
                <ThemedText className="font-semibold text-white">Download (coming soon)</ThemedText>
              </Pressable>

              <Pressable
                disabled
                className="flex-1 items-center rounded-control border border-border-light bg-surface-light px-4 py-3 dark:border-border-dark dark:bg-surface-dark"
              >
                <ThemedText className="font-semibold opacity-75">Rate (coming soon)</ThemedText>
              </Pressable>
            </View>
          </View>
        </View>

        <View className="gap-2">
          <ThemedText type="subtitle">Card previews</ThemedText>

          {cards.length ? (
            cards.map((card, index) => (
              <View
                key={card.id}
                className="rounded-2xl border border-border-light bg-surface-light p-4 dark:border-border-dark dark:bg-surface-dark"
              >
                <ThemedText type="defaultSemiBold" numberOfLines={1}>
                  {index + 1}. {card.title}
                </ThemedText>
                <ThemedText className="mt-2 text-sm opacity-80" numberOfLines={4}>
                  Front: {card.frontText || 'No front text'}
                </ThemedText>
                <ThemedText className="mt-2 text-sm opacity-75" numberOfLines={4}>
                  Back: {card.backText || 'No back text'}
                </ThemedText>
              </View>
            ))
          ) : (
            <View className="rounded-2xl border border-border-light bg-surface-light p-4 dark:border-border-dark dark:bg-surface-dark">
              <ThemedText className="opacity-75">No card previews available for this deck yet.</ThemedText>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}
