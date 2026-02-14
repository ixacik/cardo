import { useTheme } from '@react-navigation/native';
import { router, Stack } from 'expo-router';
import { Pressable, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useProfileStats } from '@/hooks/useProfileStats';

export default function CardsTabStackLayout() {
  const { colors } = useTheme();
  const { streakDays } = useProfileStats();

  const onCreateCard = () => {
    router.push('/card/create' as never);
  };

  const onOpenProfile = () => {
    router.push('/(tabs)/(settings)');
  };

  return (
    <Stack
      screenOptions={{
        headerLargeTitle: true,
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          title: 'Goon',
          headerLeft: () => (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Open profile streak details"
                accessibilityHint="Opens your profile tab"
                onPress={onOpenProfile}
                className="rounded-full bg-surface-light px-2.5 py-1 dark:bg-surface-dark"
                style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
              >
                <ThemedText className="text-xs font-semibold text-warning">{streakDays}d</ThemedText>
            </Pressable>
          ),
          headerRight: () => (
            <View className="flex-row items-center">
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Create new card"
                accessibilityHint="Opens the new card modal"
                onPress={onCreateCard}
                className="size-9 items-center justify-center"
                style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
              >
                <IconSymbol name="plus" size={20} color={colors.text} />
              </Pressable>
            </View>
          ),
        }}
      />
    </Stack>
  );
}
