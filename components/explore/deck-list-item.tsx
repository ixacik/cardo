import { Pressable, View } from 'react-native';

import { SocialStatRow } from '@/components/explore/social-stat-row';
import { ThemedText } from '@/components/themed-text';
import type { DeckSummary } from '@/types/explore';

type DeckListItemProps = {
  deck: DeckSummary;
  onPress: (deckId: string) => void;
};

export function DeckListItem({ deck, onPress }: DeckListItemProps) {
  const badgeColor = deck.category?.accentColor ?? '#0a84ff';

  return (
    <Pressable
      onPress={() => onPress(deck.id)}
      className="overflow-hidden rounded-2xl border border-border-light bg-surface-light dark:border-border-dark dark:bg-surface-dark"
      style={({ pressed }) => ({ opacity: pressed ? 0.92 : 1 })}
    >
      <View className="flex-row">
        <View
          className="m-3 mr-0 h-[86px] w-[86px] items-center justify-center rounded-xl px-2"
          style={{ backgroundColor: `${badgeColor}24` }}
        >
          <ThemedText className="text-center text-xs font-semibold" style={{ color: badgeColor }}>
            {deck.category?.label ?? 'Deck'}
          </ThemedText>
        </View>

        <View className="flex-1 gap-1.5 p-3">
          <ThemedText type="defaultSemiBold" numberOfLines={1}>
            {deck.title}
          </ThemedText>
          <ThemedText className="text-sm opacity-75" numberOfLines={1}>
            {deck.subtitle || deck.description || 'Community deck'}
          </ThemedText>
          <ThemedText className="text-xs opacity-65" numberOfLines={1}>
            By {deck.ownerDisplayName}
          </ThemedText>
          <SocialStatRow
            downloadsCount={deck.downloadsCount}
            likesCount={deck.likesCount}
            savesCount={deck.savesCount}
            averageRating={deck.averageRating}
            ratingCount={deck.ratingCount}
            className="pt-0.5"
          />
        </View>
      </View>
    </Pressable>
  );
}
