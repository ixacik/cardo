import { Stack } from 'expo-router';

export default function SettingsTabStackLayout() {
  return (
    <Stack
      screenOptions={{
        headerLargeTitle: true,
      }}
    >
      <Stack.Screen name="settings" options={{ title: 'Settings' }} />
    </Stack>
  );
}
