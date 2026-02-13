import { Ionicons } from '@expo/vector-icons';
import { View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { cn } from '@/lib/cn';
import type { DeckSocialStats } from '@/types/explore';

type SocialStatRowProps = DeckSocialStats & {
  className?: string;
};

const formatCount = (value: number) => {
  if (value >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(1)}M`;
  }

  if (value >= 1_000) {
    return `${(value / 1_000).toFixed(1)}K`;
  }

  return `${Math.max(0, Math.round(value))}`;
};

const formatRating = (averageRating: number, ratingCount: number) => {
  if (ratingCount <= 0) {
    return 'No ratings';
  }

  return `${averageRating.toFixed(1)} (${formatCount(ratingCount)})`;
};

export function SocialStatRow({
  downloadsCount,
  likesCount,
  savesCount,
  averageRating,
  ratingCount,
  className,
}: SocialStatRowProps) {
  const isDark = useColorScheme() === 'dark';
  const iconColor = isDark ? '#9ba1a6' : '#687076';

  return (
    <View className={cn('flex-row flex-wrap items-center gap-x-3 gap-y-1', className)}>
      <View className="flex-row items-center gap-1">
        <Ionicons name="download-outline" size={13} color={iconColor} />
        <ThemedText className="text-xs opacity-75">{formatCount(downloadsCount)}</ThemedText>
      </View>

      <View className="flex-row items-center gap-1">
        <Ionicons name="star-outline" size={13} color={iconColor} />
        <ThemedText className="text-xs opacity-75">{formatRating(averageRating, ratingCount)}</ThemedText>
      </View>

      <View className="flex-row items-center gap-1">
        <Ionicons name="heart-outline" size={13} color={iconColor} />
        <ThemedText className="text-xs opacity-75">{formatCount(likesCount)}</ThemedText>
      </View>

      <View className="flex-row items-center gap-1">
        <Ionicons name="bookmark-outline" size={13} color={iconColor} />
        <ThemedText className="text-xs opacity-75">{formatCount(savesCount)}</ThemedText>
      </View>
    </View>
  );
}
