import { Stack } from 'expo-router';

export default function ExploreTabStackLayout() {
  return (
    <Stack
      screenOptions={{
        headerLargeTitle: true,
      }}
    >
      <Stack.Screen name="index" options={{ title: 'Explore' }} />
      <Stack.Screen name="search" options={{ title: 'Search', headerLargeTitle: false }} />
      <Stack.Screen name="[deckId]" options={{ title: 'Deck', headerLargeTitle: false }} />
    </Stack>
  );
}
