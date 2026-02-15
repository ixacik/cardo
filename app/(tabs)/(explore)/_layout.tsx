import { useTheme } from '@react-navigation/native';
import { Stack } from 'expo-router';

export default function ExploreTabStackLayout() {
  const { colors } = useTheme();

  return (
    <Stack
      screenOptions={{
        headerLargeTitle: true,
        contentStyle: {
          backgroundColor: colors.background,
        },
      }}
    >
      <Stack.Screen name="index" options={{ title: 'Explore' }} />
      <Stack.Screen
        name="search"
        options={{
          title: 'Search',
          headerLargeTitle: false,
          headerTransparent: true,
          headerShadowVisible: false,
        }}
      />
      <Stack.Screen name="[deckId]" options={{ title: 'Deck', headerLargeTitle: false }} />
    </Stack>
  );
}
