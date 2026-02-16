import { describe, expect, it } from 'vitest';

import { composeStudyQueue } from './queue-engine';
import { startOfLocalDay, toLocalDayStamp } from './day';
import type { Card } from '../../types/card';
import type { DailyDeckState, DeckStudyOptions } from '../../types/study';

const NOW_MS = new Date('2026-02-15T12:00:00.000Z').getTime();
const DAY_START_MS = startOfLocalDay(NOW_MS);

const baseOptions: DeckStudyOptions = {
  newPerDay: 20,
  reviewPerDay: 200,
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

describe('composeStudyQueue', () => {
  it('orders lanes as learning -> review -> new while respecting limits', () => {
    const cards: Card[] = [
      makeCard({ id: 'l-intra', reviewState: 'learning', dueAt: NOW_MS - 5 * 60 * 1000 }),
      makeCard({ id: 'l-inter', reviewState: 'relearning', dueAt: DAY_START_MS - 60 * 1000 }),
      makeCard({ id: 'review-1', reviewState: 'review', dueAt: NOW_MS - 2 * 60 * 1000 }),
      makeCard({ id: 'review-2', reviewState: 'review', dueAt: NOW_MS - 60 * 1000 }),
      makeCard({ id: 'new-1', reviewState: 'new', createdAt: NOW_MS - 1000 }),
      makeCard({ id: 'new-2', reviewState: 'new', createdAt: NOW_MS - 500 }),
    ];

    const result = composeStudyQueue({
      cards,
      options: {
        ...baseOptions,
        newPerDay: 1,
        reviewPerDay: 1,
      },
      dailyState: baseDailyState,
      nowMs: NOW_MS,
    });

    expect(result.entries.map((entry) => `${entry.lane}:${entry.cardId}`)).toEqual([
      'learning_intraday:l-intra',
      'learning_interday:l-inter',
      'review:review-1',
      'new:new-1',
    ]);
    expect(result.limitExhausted.review).toBe(true);
    expect(result.limitExhausted.new).toBe(true);
  });

  it('applies sibling burying for non-learning lanes', () => {
    const cards: Card[] = [
      makeCard({ id: 'r-1', noteId: 'shared-note', reviewState: 'review', dueAt: NOW_MS - 2000 }),
      makeCard({ id: 'r-2', noteId: 'shared-note', reviewState: 'review', dueAt: NOW_MS - 1000 }),
      makeCard({ id: 'r-3', noteId: 'other-note', reviewState: 'review', dueAt: NOW_MS - 500 }),
    ];

    const result = composeStudyQueue({
      cards,
      options: {
        ...baseOptions,
        reviewPerDay: 10,
      },
      dailyState: baseDailyState,
      nowMs: NOW_MS,
    });

    expect(result.entries.map((entry) => entry.cardId)).toEqual(['r-1', 'r-3']);
  });

  it('supports custom forgotten and ahead lanes and unlimited caps', () => {
    const cards: Card[] = [
      makeCard({ id: 'forgotten', reviewState: 'review', dueAt: NOW_MS + 10_000, lapses: 3 }),
      makeCard({ id: 'ahead', reviewState: 'review', dueAt: NOW_MS + 20_000, lapses: 0 }),
      makeCard({ id: 'new', reviewState: 'new', createdAt: NOW_MS - 3000 }),
    ];

    const result = composeStudyQueue({
      cards,
      options: {
        ...baseOptions,
        newPerDay: 0,
        reviewPerDay: 0,
      },
      customStudy: {
        includeForgotten: true,
        includeReviewAhead: true,
      },
      dailyState: baseDailyState,
      nowMs: NOW_MS,
    });

    expect(result.entries.map((entry) => entry.lane)).toEqual(['forgotten', 'ahead', 'new']);
    expect(result.remaining.review).toBe(-1);
    expect(result.remaining.new).toBe(-1);
  });
});
