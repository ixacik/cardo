import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { DeckListItem } from '@/components/explore/deck-list-item';
import { ThemedText } from '@/components/themed-text';
import { Card, Label, TextField } from '@/components/ui';
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
        <Card className="flex-row items-center gap-2 px-3 py-2.5" padding="none">
          <Ionicons name="search" size={18} color={isDark ? '#9ba1a6' : '#687076'} />
          <TextField
            value={searchText}
            onChangeText={setSearchText}
            placeholder="Search decks or categories"
            className="flex-1 bg-transparent px-0 py-0 text-base"
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
        </Card>

        {!minCharsMet ? (
          <Card className="rounded-2xl">
            <ThemedText className="opacity-75">Type at least 2 characters to search decks.</ThemedText>
          </Card>
        ) : null}

        {minCharsMet && categoryResults.length ? (
          <View className="gap-2">
            <ThemedText type="defaultSemiBold">Categories</ThemedText>
            <View className="flex-row flex-wrap gap-2">
              {categoryResults.map((category) => (
                <Label
                  key={category.id}
                  onPress={() => setSearchText(category.label)}
                  accentColor={category.accentColor}
                >
                  {category.label}
                </Label>
              ))}
            </View>
          </View>
        ) : null}

        {loading ? (
          <Card className="items-center gap-2 rounded-2xl p-5">
            <ActivityIndicator color="#0a84ff" />
            <ThemedText className="opacity-75">Searching for {query}...</ThemedText>
          </Card>
        ) : null}

        {error ? (
          <Card className="rounded-2xl bg-danger/10">
            <ThemedText className="text-danger">{error}</ThemedText>
          </Card>
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
          <Card className="rounded-2xl">
            <ThemedText type="defaultSemiBold">No results</ThemedText>
            <ThemedText className="mt-1 opacity-75">
              No decks or categories matched {query}.
            </ThemedText>
          </Card>
        ) : null}
      </ScrollView>
    </View>
  );
}
