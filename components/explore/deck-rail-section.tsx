import { ScrollView, View } from 'react-native';

import { DeckRailCard } from '@/components/explore/deck-rail-card';
import { ThemedText } from '@/components/themed-text';
import type { DeckSummary } from '@/types/explore';

type DeckRailSectionProps = {
  title: string;
  decks: DeckSummary[];
  onPressDeck: (deckId: string) => void;
};

export function DeckRailSection({ title, decks, onPressDeck }: DeckRailSectionProps) {
  if (!decks.length) {
    return null;
  }

  return (
    <View className="mt-5 gap-2.5">
      <View className="px-5">
        <ThemedText type="subtitle">{title}</ThemedText>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerClassName="gap-3 px-5"
      >
        {decks.map((deck) => (
          <DeckRailCard key={deck.id} deck={deck} onPress={onPressDeck} />
        ))}
      </ScrollView>
    </View>
  );
}
