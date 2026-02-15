import { useTheme } from '@react-navigation/native';
import { router, Stack } from 'expo-router';
import { Pressable } from 'react-native';

import { IconSymbol } from '@/components/ui/icon-symbol';

export default function SettingsTabStackLayout() {
  const { colors } = useTheme();

  const onOpenSettings = () => {
    router.push('/(tabs)/(settings)/settings');
  };

  return (
    <Stack
      screenOptions={{
        headerLargeTitle: true,
        contentStyle: {
          backgroundColor: colors.background,
        },
        headerStyle: {
          backgroundColor: colors.background,
        },
        headerLargeStyle: {
          backgroundColor: colors.background,
        },
        headerShadowVisible: false,
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          title: 'Profile',
          headerRight: () => (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Open settings"
              accessibilityHint="Opens account and app settings"
              onPress={onOpenSettings}
              className="size-9 items-center justify-center"
              style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
            >
              <IconSymbol name="gearshape.fill" size={20} color={colors.text} />
            </Pressable>
          ),
        }}
      />
      <Stack.Screen name="settings" options={{ title: 'Settings' }} />
    </Stack>
  );
}
