import { router } from 'expo-router';
import { ActivityIndicator, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { DeckRailSection } from '@/components/explore/deck-rail-section';
import { SearchBarTrigger } from '@/components/explore/search-bar-trigger';
import { ThemedText } from '@/components/themed-text';
import { Card, Label } from '@/components/ui';
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
    <ScrollView
      className="flex-1 bg-app-light dark:bg-app-dark"
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={{
        paddingBottom: insets.bottom + 40,
      }}
      showsVerticalScrollIndicator={false}
    >
      <View className="px-5 pt-3">
        <SearchBarTrigger onPress={onOpenSearch} />
      </View>

      <View className="mt-4">
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="gap-2 px-5">
          {EXPLORE_CATEGORIES.map((category) => (
            <Label
              key={category.id}
              onPress={() => onOpenCategory(category.label)}
              accentColor={category.accentColor}
            >
              {category.label}
            </Label>
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
          <Card className="rounded-2xl bg-danger/10">
            <ThemedText className="text-danger">{error}</ThemedText>
          </Card>
        </View>
      ) : null}

      {!loading && !error && isEmpty ? (
        <Card className="mx-5 mt-6 rounded-3xl" padding="lg">
          <ThemedText type="subtitle">No published decks yet</ThemedText>
          <ThemedText className="mt-2 opacity-75">
            Explore will populate once users publish decks. Use search to check specific topics or come back later.
          </ThemedText>
        </Card>
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
  );
}
