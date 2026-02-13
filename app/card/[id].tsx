import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CardEditorFields, type CardEditorValue } from '@/components/cards/card-editor-fields';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { cn } from '@/lib/cn';
import { useCards } from '@/hooks/useCards';
import { db } from '@/services/instant';

const toFormValue = (
  title: string,
  frontText: string,
  backText: string,
  imageUris?: string[]
): CardEditorValue => ({
  title,
  frontText,
  backText,
  imageUris: imageUris ?? [],
});

const formatDueLabel = (dueAt: number) => {
  const due = new Date(dueAt);
  if (Number.isNaN(due.getTime())) {
    return 'Unknown';
  }

  return due.toLocaleString();
};

export default function CardDetailsScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { user, isLoading } = db.useAuth();
  const { getCardById, updateCard, deleteCard } = useCards();
  const insets = useSafeAreaInsets();

  const cardId = typeof id === 'string' ? id : '';
  const card = cardId ? getCardById(cardId) : undefined;

  const [isEditing, setIsEditing] = useState(false);
  const [formValue, setFormValue] = useState<CardEditorValue>(() =>
    toFormValue(card?.title ?? '', card?.frontText ?? '', card?.backText ?? '', card?.imageUris)
  );
  const [titleError, setTitleError] = useState<string | null>(null);
  const [frontError, setFrontError] = useState<string | null>(null);
  const [backError, setBackError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!card || isEditing) {
      return;
    }

    setFormValue(toFormValue(card.title, card.frontText, card.backText, card.imageUris));
  }, [card, isEditing]);

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

  if (!card) {
    return (
      <ThemedView
        className="flex-1 bg-panel-light px-5 dark:bg-panel-dark"
        style={{
          paddingTop: insets.top + 20,
        }}
      >
        <ThemedText type="title">Card not found</ThemedText>
        <ThemedText className="mb-5 mt-3">
          This card may have been deleted or is no longer available.
        </ThemedText>
        <Pressable
          className="items-center rounded-control bg-primary px-4 py-3"
          onPress={() => router.replace('/')}
          style={({ pressed }) => ({ opacity: pressed ? 0.92 : 1 })}
        >
          <ThemedText className="font-semibold text-white">Back to cards</ThemedText>
        </Pressable>
      </ThemedView>
    );
  }

  const onStartEdit = () => {
    setFormValue(toFormValue(card.title, card.frontText, card.backText, card.imageUris));
    setTitleError(null);
    setFrontError(null);
    setBackError(null);
    setError(null);
    setIsEditing(true);
  };

  const onCancelEdit = () => {
    setFormValue(toFormValue(card.title, card.frontText, card.backText, card.imageUris));
    setTitleError(null);
    setFrontError(null);
    setBackError(null);
    setError(null);
    setIsEditing(false);
  };

  const onSave = async () => {
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

    setSaving(true);
    setError(null);
    try {
      await updateCard({
        ...card,
        title: titleTrimmed,
        frontText: frontTrimmed,
        backText: backTrimmed,
        imageUris: formValue.imageUris,
      });
      setIsEditing(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save card.');
    } finally {
      setSaving(false);
    }
  };

  const onDelete = () => {
    Alert.alert('Delete card', 'This card will be permanently deleted.', [
      {
        text: 'Cancel',
        style: 'cancel',
      },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          setDeleting(true);
          setError(null);
          try {
            await deleteCard(card.id);
            router.replace('/');
          } catch (err) {
            setError(err instanceof Error ? err.message : 'Could not delete card.');
          } finally {
            setDeleting(false);
          }
        },
      },
    ]);
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
          contentContainerClassName="gap-2.5 p-5"
          contentContainerStyle={{ paddingBottom: insets.bottom + 140 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View className="mb-2 flex-row items-start justify-between gap-3">
            <ThemedText type="title" numberOfLines={2} className="flex-1">
              {card.title || 'Untitled card'}
            </ThemedText>
            {!isEditing ? (
              <Pressable
                className="rounded-full border border-input-border-light px-3 py-2 dark:border-input-border-dark"
                onPress={onStartEdit}
                style={({ pressed }) => ({ opacity: pressed ? 0.92 : 1 })}
              >
                <ThemedText className="font-semibold text-link">Edit</ThemedText>
              </Pressable>
            ) : null}
          </View>

          {isEditing ? (
            <CardEditorFields
              value={formValue}
              onChange={setFormValue}
              disabled={saving || deleting}
              errors={{
                title: titleError,
                frontText: frontError,
                backText: backError,
              }}
            />
          ) : (
            <View className="mt-2 gap-2 rounded-xl border border-border-light p-3.5 dark:border-border-dark">
              <ThemedText type="subtitle" className="mt-1.5">
                Front
              </ThemedText>
              <ThemedText>{card.frontText}</ThemedText>

              <ThemedText type="subtitle" className="mt-1.5">
                Back
              </ThemedText>
              <ThemedText>{card.backText}</ThemedText>

              {card.imageUris && card.imageUris.length > 0 ? (
                <>
                  <ThemedText type="subtitle" className="mt-1.5">
                    Images
                  </ThemedText>
                  {card.imageUris.map((uri, index) => (
                    <ThemedText key={`${uri}-${index}`} numberOfLines={1} className="opacity-75">
                      {uri}
                    </ThemedText>
                  ))}
                </>
              ) : null}

              <ThemedText type="defaultSemiBold" className="mt-3">
                Due: {formatDueLabel(card.dueAt)}
              </ThemedText>
            </View>
          )}

          {error ? <ThemedText className="mt-2 text-danger">{error}</ThemedText> : null}

          {isEditing ? (
            <>
              <Pressable
                className={cn('mt-4 items-center rounded-control bg-primary px-4 py-3', (saving || deleting) && 'opacity-60')}
                onPress={onSave}
                disabled={saving || deleting}
                style={({ pressed }) => ({
                  opacity: saving || deleting ? 0.6 : pressed ? 0.92 : 1,
                })}
              >
                <ThemedText className="font-semibold text-white">{saving ? 'Saving...' : 'Save changes'}</ThemedText>
              </Pressable>
              <Pressable
                className={cn(
                  'mt-2 items-center rounded-control border border-input-border-light px-4 py-3 dark:border-input-border-dark',
                  (saving || deleting) && 'opacity-60'
                )}
                onPress={onCancelEdit}
                disabled={saving || deleting}
                style={({ pressed }) => ({
                  opacity: saving || deleting ? 0.6 : pressed ? 0.92 : 1,
                })}
              >
                <ThemedText className="font-semibold text-link">Cancel</ThemedText>
              </Pressable>
            </>
          ) : null}

          <Pressable
            className={cn('mt-[18px] items-center rounded-control bg-danger-strong px-4 py-3', (saving || deleting) && 'opacity-60')}
            onPress={onDelete}
            disabled={saving || deleting}
            style={({ pressed }) => ({ opacity: saving || deleting ? 0.6 : pressed ? 0.92 : 1 })}
          >
            <ThemedText className="font-bold text-white">{deleting ? 'Deleting...' : 'Delete card'}</ThemedText>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </ThemedView>
  );
}
