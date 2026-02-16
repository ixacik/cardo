import { describe, expect, it } from 'vitest';

import {
  advanceStudySessionState,
  createStudySessionState,
  hasStudySessionWork,
  refreshStudySessionState,
} from './study-session-machine';
import { toLocalDayStamp } from './day';
import type { Card } from '../../types/card';
import type { DailyDeckState, DeckStudyOptions } from '../../types/study';

const NOW_MS = new Date('2026-02-15T12:00:00.000Z').getTime();

const options: DeckStudyOptions = {
  newPerDay: 20,
  reviewPerDay: 20,
  newOrder: 'insertion',
  reviewOrder: 'due',
  burySiblings: true,
  learningSteps: [1, 10],
  relearningSteps: [10],
  maxInterval: 36500,
  desiredRetention: 0.9,
  easyBonus: 1.3,
  intervalModifier: 1,
};

const baseDailyState: DailyDeckState = {
  deckName: undefined,
  dayStamp: toLocalDayStamp(NOW_MS),
  newShown: 0,
  reviewShown: 0,
  customNewDelta: 0,
  customReviewDelta: 0,
  lastResetAt: NOW_MS,
};

const makeCard = (overrides: Partial<Card>): Card => ({
  id: overrides.id ?? 'card',
  noteId: overrides.noteId ?? `note-${overrides.id ?? 'card'}`,
  cardOrdinal: overrides.cardOrdinal ?? 0,
  deckName: overrides.deckName,
  title: overrides.title ?? 'Title',
  frontText: overrides.frontText ?? 'Front',
  backText: overrides.backText ?? 'Back',
  imageUris: [],
  isSuspended: overrides.isSuspended ?? false,
  buriedUntilDay: overrides.buriedUntilDay,
  reviewState: overrides.reviewState ?? 'new',
  dueAt: overrides.dueAt ?? NOW_MS,
  stability: overrides.stability,
  difficulty: overrides.difficulty,
  elapsedDays: overrides.elapsedDays,
  scheduledDays: overrides.scheduledDays,
  learningSteps: overrides.learningSteps ?? 0,
  reps: overrides.reps ?? 0,
  lapses: overrides.lapses ?? 0,
  lastReviewAt: overrides.lastReviewAt,
  createdAt: overrides.createdAt ?? NOW_MS,
  updatedAt: overrides.updatedAt ?? NOW_MS,
});

describe('study session machine', () => {
  it('increments review/new counters according to served lane', () => {
    const reviewCard = makeCard({ id: 'review', reviewState: 'review', dueAt: NOW_MS - 10_000 });
    const newCard = makeCard({ id: 'new', reviewState: 'new', createdAt: NOW_MS - 5_000 });

    const firstState = createStudySessionState({
      cards: [reviewCard, newCard],
      options,
      dailyState: baseDailyState,
      nowMs: NOW_MS,
    });

    expect(firstState.queue.map((entry) => entry.cardId)).toEqual(['review', 'new']);

    const reviewAnswered = {
      ...reviewCard,
      dueAt: NOW_MS + 24 * 60 * 60 * 1000,
    };

    const secondState = advanceStudySessionState({
      state: firstState,
      cards: [reviewAnswered, newCard],
      currentCardId: 'review',
      nowMs: NOW_MS,
    });

    expect(secondState.dailyState.reviewShown).toBe(1);
    expect(secondState.dailyState.newShown).toBe(0);
    expect(secondState.queue.map((entry) => entry.cardId)).toEqual(['new']);

    const newAnsweredToLearning = {
      ...newCard,
      reviewState: 'learning' as const,
      dueAt: NOW_MS + 30_000,
    };

    const thirdState = advanceStudySessionState({
      state: secondState,
      cards: [reviewAnswered, newAnsweredToLearning],
      currentCardId: 'new',
      nowMs: NOW_MS,
    });

    expect(thirdState.dailyState.reviewShown).toBe(1);
    expect(thirdState.dailyState.newShown).toBe(1);
    expect(thirdState.queue.length).toBe(0);
    expect(thirdState.nextPendingLearningDueAt).toBe(NOW_MS + 30_000);
    expect(hasStudySessionWork(thirdState)).toBe(true);
  });

  it('promotes pending learning cards after due time', () => {
    const learningCard = makeCard({
      id: 'learning',
      reviewState: 'learning',
      dueAt: NOW_MS + 10_000,
    });

    const firstState = createStudySessionState({
      cards: [learningCard],
      options,
      dailyState: baseDailyState,
      nowMs: NOW_MS,
    });

    expect(firstState.queue.length).toBe(0);
    expect(firstState.nextPendingLearningDueAt).toBe(NOW_MS + 10_000);

    const refreshed = refreshStudySessionState({
      state: firstState,
      cards: [learningCard],
      nowMs: NOW_MS + 11_000,
    });

    expect(refreshed.queue.map((entry) => entry.cardId)).toEqual(['learning']);
    expect(refreshed.nextPendingLearningDueAt).toBeNull();
  });

  it('resets daily state on local day rollover', () => {
    const reviewCard = makeCard({ id: 'review', reviewState: 'review', dueAt: NOW_MS - 1000 });

    const firstState = createStudySessionState({
      cards: [reviewCard],
      options,
      dailyState: {
        ...baseDailyState,
        reviewShown: 7,
        newShown: 3,
      },
      nowMs: NOW_MS,
    });

    const nextDayMs = NOW_MS + 24 * 60 * 60 * 1000;
    const refreshed = refreshStudySessionState({
      state: firstState,
      cards: [reviewCard],
      nowMs: nextDayMs,
    });

    expect(refreshed.dailyState.dayStamp).toBe(toLocalDayStamp(nextDayMs));
    expect(refreshed.dailyState.reviewShown).toBe(0);
    expect(refreshed.dailyState.newShown).toBe(0);
  });
});
