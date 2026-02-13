import { Redirect, router, useLocalSearchParams, type Href } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CardEditorFields, type CardEditorValue } from '@/components/cards/card-editor-fields';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { cn } from '@/lib/cn';
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
  const insets = useSafeAreaInsets();
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
    const nextPath = getReturnPath();
    if (nextPath) {
      router.replace(nextPath);
      return;
    }
    router.back();
  };

  return (
    <ThemedView
      className="flex-1 bg-panel-light px-3 py-3 dark:bg-panel-dark"
      style={{
        paddingTop: insets.top + 12,
        paddingBottom: insets.bottom + 12,
        paddingLeft: insets.left + 12,
        paddingRight: insets.right + 12,
      }}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={12}
        className="flex-1"
      >
        <ScrollView
          className="flex-1"
          contentInsetAdjustmentBehavior="automatic"
          contentContainerClassName="gap-2.5 p-5"
          contentContainerStyle={{ paddingBottom: 140 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <ThemedText type="title" className="mb-3">
            New card
          </ThemedText>

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

          <Pressable
            className={cn('mt-4 items-center rounded-control bg-primary px-4 py-3', submitting && 'opacity-60')}
            onPress={onSubmit}
            disabled={submitting}
            style={({ pressed }) => ({ opacity: submitting ? 0.6 : pressed ? 0.92 : 1 })}
          >
            <ThemedText className="font-semibold text-white">{submitting ? 'Saving...' : 'Save card'}</ThemedText>
          </Pressable>

          <Pressable
            className={cn(
              'mt-2 items-center rounded-control border border-border-light bg-surface-light px-4 py-3 dark:border-border-dark dark:bg-surface-dark',
              submitting && 'opacity-60'
            )}
            onPress={onClose}
            disabled={submitting}
            style={({ pressed }) => ({ opacity: submitting ? 0.6 : pressed ? 0.92 : 1 })}
          >
            <ThemedText className="font-semibold text-link">Cancel</ThemedText>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </ThemedView>
  );
}
