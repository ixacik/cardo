import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SystemUI from 'expo-system-ui';
import { useEffect } from 'react';
import 'react-native-reanimated';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import '../global.css';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { CardsProvider } from '@/hooks/useCards';

export const unstable_settings = {
  anchor: '(tabs)',
};

const APP_BACKGROUND_LIGHT = '#f2f2f7';
const APP_BACKGROUND_DARK = '#000000';

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const appBackgroundColor = isDark ? APP_BACKGROUND_DARK : APP_BACKGROUND_LIGHT;
  const navigationTheme = isDark
    ? {
        ...DarkTheme,
        colors: {
          ...DarkTheme.colors,
          background: APP_BACKGROUND_DARK,
          card: APP_BACKGROUND_DARK,
          border: APP_BACKGROUND_DARK,
        },
      }
    : {
        ...DefaultTheme,
        colors: {
          ...DefaultTheme.colors,
          background: APP_BACKGROUND_LIGHT,
          card: APP_BACKGROUND_LIGHT,
          border: APP_BACKGROUND_LIGHT,
        },
      };

  useEffect(() => {
    void SystemUI.setBackgroundColorAsync(appBackgroundColor).catch(() => undefined);
  }, [appBackgroundColor]);

  return (
    <ThemeProvider value={navigationTheme}>
      <SafeAreaProvider>
        <CardsProvider>
          <Stack
            screenOptions={{
              contentStyle: {
                backgroundColor: appBackgroundColor,
              },
              headerStyle: {
                backgroundColor: appBackgroundColor,
              },
              headerLargeStyle: {
                backgroundColor: appBackgroundColor,
              },
              headerShadowVisible: false,
            }}
          >
            <Stack.Screen name="sign-in" options={{ headerShown: false }} />
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen
              name="card/create"
              options={{
                presentation: 'modal',
                title: 'New Card',
                headerTransparent: true,
                headerShadowVisible: false,
              }}
            />
            <Stack.Screen name="card/[id]" options={{ presentation: 'card', title: 'Card Details' }} />
            <Stack.Screen name="review/index" options={{ presentation: 'card', headerShown: false }} />
            <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
          </Stack>
        </CardsProvider>
      </SafeAreaProvider>
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
    </ThemeProvider>
  );
}
