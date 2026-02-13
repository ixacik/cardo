import { Link } from 'expo-router';
import { Pressable } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

export default function ModalScreen() {
  return (
    <ThemedView className="flex-1 items-center justify-center bg-app-light p-5 dark:bg-app-dark">
      <ThemedText type="title">This is a modal</ThemedText>
      <Link href="/" dismissTo asChild>
        <Pressable className="mt-4 py-3" style={({ pressed }) => ({ opacity: pressed ? 0.92 : 1 })}>
          <ThemedText type="link">Go to home screen</ThemedText>
        </Pressable>
      </Link>
    </ThemedView>
  );
}
