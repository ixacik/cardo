import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { DeckListItem } from '@/components/explore/deck-list-item';
import { ThemedText } from '@/components/themed-text';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useExploreSearch } from '@/hooks/useExploreSearch';

export default function ExploreSearchScreen() {
  const insets = useSafeAreaInsets();
  const isDark = useColorScheme() === 'dark';
  const params = useLocalSearchParams<{ q?: string }>();
  const initialQuery = typeof params.q === 'string' ? params.q : '';

  const [searchText, setSearchText] = useState(initialQuery);
  const { query, minCharsMet, loading, error, deckResults, categoryResults } = useExploreSearch(searchText);

  useEffect(() => {
    if (typeof params.q === 'string') {
      setSearchText(params.q);
    }
  }, [params.q]);

  const onOpenDeck = (deckId: string) => {
    router.push({
      pathname: '/(tabs)/(explore)/[deckId]',
      params: { deckId },
    });
  };

  const showNoResults = minCharsMet && !loading && !error && !deckResults.length && !categoryResults.length;

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
        keyboardShouldPersistTaps="handled"
      >
        <View className="flex-row items-center gap-2 rounded-[14px] border border-input-border-light bg-input-light px-3 py-2.5 dark:border-input-border-dark dark:bg-input-dark">
          <Ionicons name="search" size={18} color={isDark ? '#9ba1a6' : '#687076'} />
          <TextInput
            value={searchText}
            onChangeText={setSearchText}
            placeholder="Search decks or categories"
            placeholderTextColor={isDark ? '#9aa5ad' : '#8a9098'}
            className="flex-1 text-base text-fg-light dark:text-fg-dark"
            autoFocus
            returnKeyType="search"
            autoCorrect={false}
            autoCapitalize="none"
          />
          {searchText.length ? (
            <Pressable onPress={() => setSearchText('')}>
              <Ionicons name="close-circle" size={19} color={isDark ? '#9ba1a6' : '#687076'} />
            </Pressable>
          ) : null}
        </View>

        {!minCharsMet ? (
          <View className="rounded-2xl border border-border-light bg-surface-light p-4 dark:border-border-dark dark:bg-surface-dark">
            <ThemedText className="opacity-75">Type at least 2 characters to search decks.</ThemedText>
          </View>
        ) : null}

        {minCharsMet && categoryResults.length ? (
          <View className="gap-2">
            <ThemedText type="defaultSemiBold">Categories</ThemedText>
            <View className="flex-row flex-wrap gap-2">
              {categoryResults.map((category) => (
                <Pressable
                  key={category.id}
                  onPress={() => setSearchText(category.label)}
                  className="rounded-full px-3.5 py-1.5"
                  style={({ pressed }) => ({
                    opacity: pressed ? 0.86 : 1,
                    backgroundColor: `${category.accentColor}20`,
                  })}
                >
                  <ThemedText className="text-xs font-semibold" style={{ color: category.accentColor }}>
                    {category.label}
                  </ThemedText>
                </Pressable>
              ))}
            </View>
          </View>
        ) : null}

        {loading ? (
          <View className="items-center gap-2 rounded-2xl border border-border-light bg-surface-light p-5 dark:border-border-dark dark:bg-surface-dark">
            <ActivityIndicator color="#0a84ff" />
            <ThemedText className="opacity-75">Searching for {query}...</ThemedText>
          </View>
        ) : null}

        {error ? (
          <View className="rounded-2xl border border-danger/30 bg-danger/10 p-4">
            <ThemedText className="text-danger">{error}</ThemedText>
          </View>
        ) : null}

        {minCharsMet && deckResults.length ? (
          <View className="gap-2.5">
            <ThemedText type="defaultSemiBold">Deck results</ThemedText>
            {deckResults.map((deck) => (
              <DeckListItem key={deck.id} deck={deck} onPress={onOpenDeck} />
            ))}
          </View>
        ) : null}

        {showNoResults ? (
          <View className="rounded-2xl border border-border-light bg-surface-light p-4 dark:border-border-dark dark:bg-surface-dark">
            <ThemedText type="defaultSemiBold">No results</ThemedText>
            <ThemedText className="mt-1 opacity-75">
              No decks or categories matched {query}.
            </ThemedText>
          </View>
        ) : null}
      </ScrollView>
    </View>
  );
}
