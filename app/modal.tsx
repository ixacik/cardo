import { Link } from 'expo-router';

import { Button } from '@/components/ui';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

export default function ModalScreen() {
  return (
    <ThemedView className="flex-1 items-center justify-center bg-app-light p-5 dark:bg-app-dark">
      <ThemedText type="title">This is a modal</ThemedText>
      <Link href="/" dismissTo asChild>
        <Button variant="link" className="mt-4">
          Go to home screen
        </Button>
      </Link>
    </ThemedView>
  );
}
