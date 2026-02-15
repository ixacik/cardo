import { Redirect, Stack, router, useLocalSearchParams, type Href } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView } from 'react-native';

import { CardEditorFields, type CardEditorValue } from '@/components/cards/card-editor-fields';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useCards } from '@/hooks/useCards';
import { db } from '@/services/instant';

const EMPTY_FORM: CardEditorValue = {
  title: '',
  frontText: '',
  backText: '',
  imageUris: [],
};

export default function CreateIndexCardScreen() {
  const { addCard } = useCards();
  const { user, isLoading } = db.useAuth();
  const { returnTo } = useLocalSearchParams<{ returnTo?: string }>();

  const [formValue, setFormValue] = useState<CardEditorValue>(EMPTY_FORM);
  const [titleError, setTitleError] = useState<string | null>(null);
  const [frontError, setFrontError] = useState<string | null>(null);
  const [backError, setBackError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const getReturnPath = (): Href | null => {
    if (typeof returnTo === 'string' && returnTo.length > 0) {
      return returnTo as Href;
    }

    return null;
  };

  if (isLoading) {
    return (
      <ThemedView className="flex-1 items-center justify-center bg-panel-light dark:bg-panel-dark">
        <ActivityIndicator colorClassName="text-primary" />
      </ThemedView>
    );
  }

  if (!user) {
    return <Redirect href="/sign-in" />;
  }

  const onSubmit = async () => {
    if (submitting) {
      return;
    }

    const titleTrimmed = formValue.title.trim();
    const frontTrimmed = formValue.frontText.trim();
    const backTrimmed = formValue.backText.trim();
    const hasTitle = titleTrimmed.length > 0;
    const hasFront = frontTrimmed.length > 0;
    const hasBack = backTrimmed.length > 0;

    setTitleError(hasTitle ? null : 'Title is required.');
    setFrontError(hasFront ? null : 'Front text is required.');
    setBackError(hasBack ? null : 'Back text is required.');
    if (!hasTitle || !hasFront || !hasBack) {
      return;
    }

    setSubmitting(true);
    try {
      await addCard({
        title: titleTrimmed,
        frontText: frontTrimmed,
        backText: backTrimmed,
        imageUris: formValue.imageUris.length > 0 ? formValue.imageUris : undefined,
      });
      const nextPath = getReturnPath();
      if (nextPath) {
        router.replace(nextPath);
      } else {
        router.back();
      }
    } finally {
      setSubmitting(false);
    }
  };

  const onClose = () => {
    if (submitting) {
      return;
    }

    const nextPath = getReturnPath();
    if (nextPath) {
      router.replace(nextPath);
      return;
    }
    router.back();
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: 'New Card',
          headerTransparent: true,
          headerShadowVisible: false,
          headerBackVisible: false,
          headerLeft: () => (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Cancel"
              accessibilityHint="Dismisses the new card modal"
              disabled={submitting}
              onPress={onClose}
              className="px-1.5 py-1"
              style={({ pressed }) => ({ opacity: submitting ? 0.45 : pressed ? 0.6 : 1 })}
            >
              <ThemedText className="text-base text-link">Cancel</ThemedText>
            </Pressable>
          ),
          headerRight: () => (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Save card"
              accessibilityHint="Saves this card and closes the modal"
              disabled={submitting}
              onPress={onSubmit}
              className="px-1.5 py-1"
              style={({ pressed }) => ({ opacity: submitting ? 0.45 : pressed ? 0.6 : 1 })}
            >
              <ThemedText className="text-base font-semibold text-primary">{submitting ? 'Saving...' : 'Save'}</ThemedText>
            </Pressable>
          ),
        }}
      />
      <ScrollView
        className="flex-1 bg-panel-light dark:bg-panel-dark"
        contentInsetAdjustmentBehavior="automatic"
        contentContainerClassName="gap-2.5 p-5 pb-24"
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <CardEditorFields
          value={formValue}
          onChange={setFormValue}
          disabled={submitting}
          errors={{
            title: titleError,
            frontText: frontError,
            backText: backError,
          }}
        />
      </ScrollView>
    </>
  );
}
