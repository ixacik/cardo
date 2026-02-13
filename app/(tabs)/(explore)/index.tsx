import { router } from 'expo-router';
import { ActivityIndicator, Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { DeckRailSection } from '@/components/explore/deck-rail-section';
import { SearchBarTrigger } from '@/components/explore/search-bar-trigger';
import { ThemedText } from '@/components/themed-text';
import { useExploreFeed } from '@/hooks/useExploreFeed';
import { EXPLORE_CATEGORIES } from '@/types/explore';

export default function ExploreFeedScreen() {
  const insets = useSafeAreaInsets();
  const { sections, loading, error, isEmpty } = useExploreFeed();

  const onOpenSearch = () => {
    router.push('/(tabs)/(explore)/search');
  };

  const onOpenDeck = (deckId: string) => {
    router.push({
      pathname: '/(tabs)/(explore)/[deckId]',
      params: { deckId },
    });
  };

  const onOpenCategory = (categoryLabel: string) => {
    router.push({
      pathname: '/(tabs)/(explore)/search',
      params: { q: categoryLabel },
    });
  };

  return (
    <View
      className="flex-1 bg-app-light dark:bg-app-dark"
      style={{
        paddingBottom: insets.bottom,
      }}
    >
      <ScrollView
        className="flex-1"
        contentInsetAdjustmentBehavior="automatic"
        contentContainerClassName="pb-10"
        showsVerticalScrollIndicator={false}
      >
        <View className="px-5 pt-3">
          <SearchBarTrigger onPress={onOpenSearch} />
        </View>

        <View className="mt-4">
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="gap-2 px-5">
            {EXPLORE_CATEGORIES.map((category) => (
              <Pressable
                key={category.id}
                onPress={() => onOpenCategory(category.label)}
                className="rounded-full px-3.5 py-1.5"
                style={({ pressed }) => ({
                  opacity: pressed ? 0.85 : 1,
                  backgroundColor: `${category.accentColor}20`,
                })}
              >
                <ThemedText className="text-xs font-semibold" style={{ color: category.accentColor }}>
                  {category.label}
                </ThemedText>
              </Pressable>
            ))}
          </ScrollView>
        </View>

        {loading ? (
          <View className="items-center gap-2 px-5 py-10">
            <ActivityIndicator color="#0a84ff" />
            <ThemedText className="opacity-70">Loading decks...</ThemedText>
          </View>
        ) : null}

        {error ? (
          <View className="px-5 pt-3">
            <View className="rounded-2xl border border-danger/30 bg-danger/10 p-4">
              <ThemedText className="text-danger">{error}</ThemedText>
            </View>
          </View>
        ) : null}

        {!loading && !error && isEmpty ? (
          <View className="mx-5 mt-6 rounded-3xl border border-border-light bg-surface-light p-6 dark:border-border-dark dark:bg-surface-dark">
            <ThemedText type="subtitle">No published decks yet</ThemedText>
            <ThemedText className="mt-2 opacity-75">
              Explore will populate once users publish decks. Use search to check specific topics or come back later.
            </ThemedText>
          </View>
        ) : null}

        {!loading && !error
          ? sections.map((section) => (
              <DeckRailSection
                key={section.id}
                title={section.title}
                decks={section.decks}
                onPressDeck={onOpenDeck}
              />
            ))
          : null}
      </ScrollView>
    </View>
  );
}
