import { Stack } from 'expo-router';

export default function CardsTabStackLayout() {
  return (
    <Stack
      screenOptions={{
        headerLargeTitle: true,
      }}
    >
      <Stack.Screen name="index" options={{ title: 'Goon' }} />
    </Stack>
  );
}
