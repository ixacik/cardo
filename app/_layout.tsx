import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import '../global.css';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { CardsProvider } from '@/hooks/useCards';

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <SafeAreaProvider>
        <CardsProvider>
          <Stack>
            <Stack.Screen name="sign-in" options={{ headerShown: false }} />
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="card/create" options={{ presentation: 'modal', title: 'New Card' }} />
            <Stack.Screen name="card/[id]" options={{ presentation: 'card', title: 'Card Details' }} />
            <Stack.Screen name="review/index" options={{ presentation: 'card', title: 'Review' }} />
            <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
          </Stack>
        </CardsProvider>
      </SafeAreaProvider>
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
    </ThemeProvider>
  );
}
