import { Redirect, router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { ReviewFlipCard } from '@/components/review/review-flip-card';
import { ReviewGradeBar } from '@/components/review/review-grade-bar';
import { cn } from '@/lib/cn';
import { useCards } from '@/hooks/useCards';
import { db } from '@/services/instant';
import { buildReviewQueue } from '@/services/review/fsrs';
import type { ReviewRating } from '@/types/card';

export default function ReviewScreen() {
  const { user, isLoading: authLoading } = db.useAuth();
  const { cards, loading: cardsLoading, gradeCardReview } = useCards();
  const insets = useSafeAreaInsets();

  const [sessionCardIds, setSessionCardIds] = useState<string[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [reviewedCount, setReviewedCount] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cardById = useMemo(() => new Map(cards.map((card) => [card.id, card])), [cards]);
  const currentCard = sessionCardIds[currentIndex] ? cardById.get(sessionCardIds[currentIndex]) : undefined;

  useEffect(() => {
    if (cardsLoading || authLoading || sessionCardIds.length > 0) {
      return;
    }

    const initialQueue = buildReviewQueue(cards);
    if (initialQueue.length === 0) {
      return;
    }

    setSessionCardIds(initialQueue.map((card) => card.id));
  }, [authLoading, cards, cardsLoading, sessionCardIds.length]);

  useEffect(() => {
    if (!currentCard && currentIndex < sessionCardIds.length) {
      setCurrentIndex((prev) => prev + 1);
      setIsFlipped(false);
    }
  }, [currentCard, currentIndex, sessionCardIds.length]);

  if (authLoading || cardsLoading) {
    return (
      <ThemedView className="flex-1 items-center justify-center bg-panel-light dark:bg-panel-dark">
        <ActivityIndicator colorClassName="text-primary" />
      </ThemedView>
    );
  }

  if (!user) {
    return <Redirect href="/sign-in" />;
  }

  const totalCards = sessionCardIds.length;
  const isComplete = totalCards === 0 || currentIndex >= totalCards;

  const startNewSession = () => {
    const nextQueue = buildReviewQueue(cards);
    setSessionCardIds(nextQueue.map((card) => card.id));
    setCurrentIndex(0);
    setReviewedCount(0);
    setIsFlipped(false);
    setError(null);
  };

  const onGradeCard = async (rating: ReviewRating) => {
    if (!currentCard || submitting) {
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      await gradeCardReview(currentCard.id, rating);
      setReviewedCount((prev) => prev + 1);
      setCurrentIndex((prev) => prev + 1);
      setIsFlipped(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not submit review grade.');
    } finally {
      setSubmitting(false);
    }
  };

  if (isComplete) {
    return (
      <ThemedView
        className="flex-1 items-stretch justify-center bg-panel-light px-5 py-5 dark:bg-panel-dark"
        style={{
          paddingTop: insets.top + 20,
          paddingBottom: insets.bottom + 20,
          paddingLeft: insets.left + 20,
          paddingRight: insets.right + 20,
        }}
      >
        <ThemedText type="title">Review complete</ThemedText>
        <ThemedText className="mb-6 mt-3">
          {totalCards > 0
            ? `You reviewed ${reviewedCount} card${reviewedCount === 1 ? '' : 's'} in this session.`
            : 'No cards are due right now.'}
        </ThemedText>

        <Pressable
          className="items-center rounded-control bg-primary px-4 py-3"
          onPress={() => router.replace('/')}
          style={({ pressed }) => ({ opacity: pressed ? 0.92 : 1 })}
        >
          <ThemedText className="font-bold text-white">Back to cards</ThemedText>
        </Pressable>

        <Pressable
          className="mt-3 items-center rounded-control border border-border-light bg-surface-light px-4 py-3 dark:border-border-dark dark:bg-surface-dark"
          onPress={startNewSession}
          style={({ pressed }) => ({ opacity: pressed ? 0.92 : 1 })}
        >
          <ThemedText className="font-semibold text-link">Start another session</ThemedText>
        </Pressable>
      </ThemedView>
    );
  }

  if (!currentCard) {
    return (
      <ThemedView className="flex-1 items-center justify-center bg-panel-light dark:bg-panel-dark">
        <ActivityIndicator colorClassName="text-primary" />
      </ThemedView>
    );
  }

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
      <ScrollView contentContainerClassName="gap-2.5" contentContainerStyle={{ paddingBottom: insets.bottom + 48 }}>
        <View className="flex-row items-center justify-between">
          <ThemedText type="defaultSemiBold">Review</ThemedText>
          <ThemedText>
            {currentIndex + 1} / {totalCards}
          </ThemedText>
        </View>

        <ReviewFlipCard
          title={currentCard.title}
          frontText={currentCard.frontText}
          backText={currentCard.backText}
          isFlipped={isFlipped}
          onFlip={() => setIsFlipped((prev) => !prev)}
        />

        {isFlipped ? <ReviewGradeBar onGrade={onGradeCard} disabled={submitting} /> : null}

        {error ? <ThemedText className="mt-2.5 text-danger">{error}</ThemedText> : null}

        <Pressable
          className={cn(
            'mt-3 items-center rounded-control border border-border-light bg-surface-light px-4 py-3 dark:border-border-dark dark:bg-surface-dark',
            submitting && 'opacity-60'
          )}
          onPress={() => router.replace('/')}
          disabled={submitting}
          style={({ pressed }) => ({ opacity: submitting ? 0.6 : pressed ? 0.92 : 1 })}
        >
          <ThemedText className="font-semibold text-link">Exit review</ThemedText>
        </Pressable>
      </ScrollView>
    </ThemedView>
  );
}
