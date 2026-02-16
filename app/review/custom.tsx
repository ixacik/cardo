import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { Card } from '@/components/ui';

const parseDeckName = (value: string | string[] | undefined): string | undefined => {
  if (typeof value !== 'string') {
    return undefined;
  }

  try {
    const decoded = decodeURIComponent(value).trim();
    return decoded.length > 0 ? decoded : undefined;
  } catch {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : undefined;
  }
};

const buildReviewRoute = (params: {
  deckName?: string;
  addNewCards: number;
  addReviewCards: number;
  includeForgotten: boolean;
  includeReviewAhead: boolean;
}): string => {
  const query = new URLSearchParams();

  if (params.deckName) {
    query.set('deckName', params.deckName);
  }
  if (params.addNewCards > 0) {
    query.set('customNewDelta', String(params.addNewCards));
  }
  if (params.addReviewCards > 0) {
    query.set('customReviewDelta', String(params.addReviewCards));
  }
  if (params.includeForgotten) {
    query.set('forgotten', '1');
  }
  if (params.includeReviewAhead) {
    query.set('ahead', '1');
  }

  const queryString = query.toString();
  return queryString.length > 0 ? `/review?${queryString}` : '/review';
};

export default function CustomStudyScreen() {
  const insets = useSafeAreaInsets();
  const { deckName } = useLocalSearchParams<{ deckName?: string }>();
  const resolvedDeckName = useMemo(() => parseDeckName(deckName), [deckName]);

  const [addNewCards, setAddNewCards] = useState(0);
  const [addReviewCards, setAddReviewCards] = useState(0);
  const [includeForgotten, setIncludeForgotten] = useState(false);
  const [includeReviewAhead, setIncludeReviewAhead] = useState(false);

  const openStudy = () => {
    const nextRoute = buildReviewRoute({
      deckName: resolvedDeckName,
      addNewCards,
      addReviewCards,
      includeForgotten,
      includeReviewAhead,
    });
    router.replace(nextRoute as never);
  };

  const toggleForgotten = () => setIncludeForgotten((value) => !value);
  const toggleReviewAhead = () => setIncludeReviewAhead((value) => !value);

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Custom Study',
          headerLargeTitle: false,
        }}
      />

      <ScrollView
        className="flex-1 bg-app-light dark:bg-app-dark"
        contentInsetAdjustmentBehavior="automatic"
        contentContainerClassName="gap-3 px-4 pt-3"
        contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
      >
        <Card>
          <ThemedText type="subtitle">Custom Study</ThemedText>
          <ThemedText className="mt-1 opacity-75">
            {resolvedDeckName ? `${resolvedDeckName} deck` : 'All decks'}
          </ThemedText>
          <ThemedText className="mt-2 opacity-70">
            Adjust today only. Limits reset automatically at local midnight.
          </ThemedText>
        </Card>

        <Card>
          <ThemedText type="defaultSemiBold">Increase today new cards</ThemedText>
          <View className="mt-3 flex-row gap-2">
            {[0, 10, 20, 40].map((value) => (
              <Pressable
                key={`new-${value}`}
                accessibilityRole="button"
                onPress={() => setAddNewCards(value)}
                className={`rounded-full px-4 py-2 ${
                  addNewCards === value
                    ? 'bg-primary'
                    : 'bg-tertiary-light dark:bg-tertiary-dark'
                }`}
                style={({ pressed }) => ({ opacity: pressed ? 0.9 : 1 })}
              >
                <ThemedText className={addNewCards === value ? 'font-semibold text-white' : 'font-semibold'}>
                  +{value}
                </ThemedText>
              </Pressable>
            ))}
          </View>
        </Card>

        <Card>
          <ThemedText type="defaultSemiBold">Increase today review cards</ThemedText>
          <View className="mt-3 flex-row gap-2">
            {[0, 50, 100, 200].map((value) => (
              <Pressable
                key={`review-${value}`}
                accessibilityRole="button"
                onPress={() => setAddReviewCards(value)}
                className={`rounded-full px-4 py-2 ${
                  addReviewCards === value
                    ? 'bg-primary'
                    : 'bg-tertiary-light dark:bg-tertiary-dark'
                }`}
                style={({ pressed }) => ({ opacity: pressed ? 0.9 : 1 })}
              >
                <ThemedText className={addReviewCards === value ? 'font-semibold text-white' : 'font-semibold'}>
                  +{value}
                </ThemedText>
              </Pressable>
            ))}
          </View>
        </Card>

        <Card>
          <ThemedText type="defaultSemiBold">Extra queues</ThemedText>

          <Pressable
            accessibilityRole="button"
            onPress={toggleForgotten}
            className="mt-3 flex-row items-center justify-between rounded-2xl bg-tertiary-light px-3 py-3 dark:bg-tertiary-dark"
            style={({ pressed }) => ({ opacity: pressed ? 0.9 : 1 })}
          >
            <View className="flex-row items-center gap-2">
              <MaterialIcons name="history" size={18} color="#0a84ff" />
              <ThemedText className="font-semibold">Study forgotten cards</ThemedText>
            </View>
            <MaterialIcons name={includeForgotten ? 'check-circle' : 'radio-button-unchecked'} size={20} color="#0a84ff" />
          </Pressable>

          <Pressable
            accessibilityRole="button"
            onPress={toggleReviewAhead}
            className="mt-2 flex-row items-center justify-between rounded-2xl bg-tertiary-light px-3 py-3 dark:bg-tertiary-dark"
            style={({ pressed }) => ({ opacity: pressed ? 0.9 : 1 })}
          >
            <View className="flex-row items-center gap-2">
              <MaterialIcons name="schedule" size={18} color="#0a84ff" />
              <ThemedText className="font-semibold">Review ahead</ThemedText>
            </View>
            <MaterialIcons name={includeReviewAhead ? 'check-circle' : 'radio-button-unchecked'} size={20} color="#0a84ff" />
          </Pressable>
        </Card>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Start custom study"
          onPress={openStudy}
          className="items-center rounded-full bg-primary px-4 py-3"
          style={({ pressed }) => ({ opacity: pressed ? 0.9 : 1 })}
        >
          <ThemedText className="font-bold text-white">Start Study</ThemedText>
        </Pressable>
      </ScrollView>
    </>
  );
}
