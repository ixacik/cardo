import { View } from 'react-native';
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedStyle,
  type SharedValue,
} from 'react-native-reanimated';

import { ThemedText } from '@/components/themed-text';
import { Card } from '@/components/ui';

type ReviewFlipCardProps = {
  title: string;
  frontText: string;
  backText: string;
  flipProgress: SharedValue<number>;
};

export function ReviewFlipCard({
  title,
  frontText,
  backText,
  flipProgress,
}: ReviewFlipCardProps) {
  const frontAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { perspective: 1000 },
      {
        rotateY: `${interpolate(flipProgress.value, [0, 1], [0, 180], Extrapolation.CLAMP)}deg`,
      },
    ],
    opacity: interpolate(flipProgress.value, [0, 0.45, 0.55, 1], [1, 1, 0, 0], Extrapolation.CLAMP),
  }));

  const backAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { perspective: 1000 },
      {
        rotateY: `${interpolate(flipProgress.value, [0, 1], [180, 360], Extrapolation.CLAMP)}deg`,
      },
    ],
    opacity: interpolate(flipProgress.value, [0, 0.45, 0.55, 1], [0, 0, 1, 1], Extrapolation.CLAMP),
  }));

  return (
    <View className="mt-5 min-h-80">
      <Animated.View
        pointerEvents="none"
        className="absolute min-h-80 w-full"
        style={[frontAnimatedStyle, { backfaceVisibility: 'hidden' }]}
      >
        <Card className="min-h-80 overflow-hidden rounded-2xl" padding="none">
          <View className="flex-1 p-5">
            <ThemedText type="defaultSemiBold" numberOfLines={1}>
              {title || 'Untitled card'}
            </ThemedText>
            <ThemedText type="subtitle" className="mb-3 mt-4">
              Front
            </ThemedText>
            <ThemedText className="leading-6">{frontText}</ThemedText>
            <ThemedText className="mt-auto pb-1 opacity-60">Tap to reveal answer</ThemedText>
          </View>
        </Card>
      </Animated.View>

      <Animated.View
        pointerEvents="none"
        className="absolute min-h-80 w-full"
        style={[backAnimatedStyle, { backfaceVisibility: 'hidden' }]}
      >
        <Card className="min-h-80 overflow-hidden rounded-2xl" padding="none">
          <View className="flex-1 p-5">
            <ThemedText type="defaultSemiBold" numberOfLines={1}>
              {title || 'Untitled card'}
            </ThemedText>
            <ThemedText type="subtitle" className="mb-3 mt-4">
              Back
            </ThemedText>
            <ThemedText className="leading-6">{backText}</ThemedText>
            <ThemedText className="mt-auto pb-1 opacity-60">Tap to see front again</ThemedText>
          </View>
        </Card>
      </Animated.View>
    </View>
  );
}
