import { useEffect, useRef } from 'react';
import { Animated, Pressable, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';

type ReviewFlipCardProps = {
  title: string;
  frontText: string;
  backText: string;
  isFlipped: boolean;
  onFlip: () => void;
};

export function ReviewFlipCard({
  title,
  frontText,
  backText,
  isFlipped,
  onFlip,
}: ReviewFlipCardProps) {
  const rotation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(rotation, {
      toValue: isFlipped ? 1 : 0,
      duration: 280,
      useNativeDriver: true,
    }).start();
  }, [isFlipped, rotation]);

  const frontRotation = rotation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });

  const backRotation = rotation.interpolate({
    inputRange: [0, 1],
    outputRange: ['180deg', '360deg'],
  });

  return (
    <Pressable accessibilityRole="button" onPress={onFlip} className="mt-5 min-h-80">
      <Animated.View
        pointerEvents={isFlipped ? 'none' : 'auto'}
        className="absolute min-h-80 w-full overflow-hidden rounded-2xl border border-border-light bg-surface-light dark:border-border-dark dark:bg-surface-dark"
        style={{
          backfaceVisibility: 'hidden',
          transform: [{ perspective: 1000 }, { rotateY: frontRotation }],
        }}
      >
        <View className="flex-1 p-5">
          <ThemedText type="defaultSemiBold" numberOfLines={1}>
            {title || 'Untitled card'}
          </ThemedText>
          <ThemedText type="subtitle" className="mb-3 mt-4">
            Front
          </ThemedText>
          <ThemedText className="leading-6">{frontText}</ThemedText>
          <ThemedText className="mt-auto opacity-60">Tap to reveal answer</ThemedText>
        </View>
      </Animated.View>

      <Animated.View
        pointerEvents={isFlipped ? 'auto' : 'none'}
        className="absolute min-h-80 w-full overflow-hidden rounded-2xl border border-border-light bg-surface-light dark:border-border-dark dark:bg-surface-dark"
        style={{
          backfaceVisibility: 'hidden',
          transform: [{ perspective: 1000 }, { rotateY: backRotation }],
        }}
      >
        <View className="flex-1 p-5">
          <ThemedText type="defaultSemiBold" numberOfLines={1}>
            {title || 'Untitled card'}
          </ThemedText>
          <ThemedText type="subtitle" className="mb-3 mt-4">
            Back
          </ThemedText>
          <ThemedText className="leading-6">{backText}</ThemedText>
          <ThemedText className="mt-auto opacity-60">Tap to see front again</ThemedText>
        </View>
      </Animated.View>
    </Pressable>
  );
}
