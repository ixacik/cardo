import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect, useMemo } from 'react';
import { FlatList, Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useCSSVariable } from 'uniwind';

import { CardGridItem } from '@/components/cards/card-grid-item';
import { ThemedText } from '@/components/themed-text';
import { useCards } from '@/hooks/useCards';
import { useColorScheme } from '@/hooks/use-color-scheme';

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
    <View className="flex-1 bg-app-light dark:bg-app-dark">
      <FlatList
        data={cards}
        keyExtractor={(item) => item.id}
        numColumns={2}
        className="flex-1"
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
        }
        ListEmptyComponent={
          !loading ? (
            <View className="items-center gap-2 rounded-[14px] bg-surface-light p-6 dark:bg-surface-dark">
              <Ionicons name="albums-outline" size={24} color={mutedIconColor} />
              <ThemedText type="defaultSemiBold" className="mt-1.5">
                No cards yet
              </ThemedText>
              <ThemedText className="opacity-70">Tap + to create your first card.</ThemedText>
            </View>
          ) : null
        }
        renderItem={({ item }) => <CardGridItem card={item} onPress={onOpenCard} />}
      />

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
    </View>
  );
}
