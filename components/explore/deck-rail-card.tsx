import { Pressable, View } from 'react-native';

import { SocialStatRow } from '@/components/explore/social-stat-row';
import { ThemedText } from '@/components/themed-text';
import { Card, Label } from '@/components/ui';
import type { DeckSummary } from '@/types/explore';

type DeckRailCardProps = {
  deck: DeckSummary;
  onPress: (deckId: string) => void;
};

export function DeckRailCard({ deck, onPress }: DeckRailCardProps) {
  const badgeColor = deck.category?.accentColor ?? '#0a84ff';

  return (
    <Pressable
      className="w-[270px]"
      onPress={() => onPress(deck.id)}
      style={({ pressed }) => ({
        transform: [{ scale: pressed ? 0.98 : 1 }],
      })}
    >
      <Card
        className="overflow-hidden rounded-3xl"
        padding="none"
      >
        <View className="px-4 pb-4 pt-4" style={{ backgroundColor: `${badgeColor}22` }}>
          <View className="mb-3 flex-row items-center justify-between">
            <Label variant="badge" accentColor={badgeColor}>
              {deck.category?.label ?? 'General'}
            </Label>
            <ThemedText className="text-xs opacity-75">{deck.cardCount} cards</ThemedText>
          </View>

          <ThemedText type="subtitle" numberOfLines={2} className="leading-6">
            {deck.title}
          </ThemedText>

          <ThemedText numberOfLines={2} className="mt-1.5 text-sm opacity-80">
            {deck.subtitle || deck.description || 'Curated deck from the community.'}
          </ThemedText>
        </View>

        <View className="gap-2 px-4 pb-4 pt-3">
          <ThemedText className="text-xs opacity-75">By {deck.ownerDisplayName}</ThemedText>
          <SocialStatRow
            downloadsCount={deck.downloadsCount}
            likesCount={deck.likesCount}
            savesCount={deck.savesCount}
            averageRating={deck.averageRating}
            ratingCount={deck.ratingCount}
          />
        </View>
      </Card>
    </Pressable>
  );
}
