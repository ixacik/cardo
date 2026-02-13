import {
  Rating,
  State,
  createEmptyCard,
  fsrs,
  type Card as FsrsCard,
  type Grade,
} from 'ts-fsrs';

import type { Card, ReviewRating, ReviewState } from '@/types/card';

export type CardReviewUpdate = Pick<
  Card,
  | 'reviewState'
  | 'dueAt'
  | 'stability'
  | 'difficulty'
  | 'elapsedDays'
  | 'scheduledDays'
  | 'learningSteps'
  | 'reps'
  | 'lapses'
  | 'lastReviewAt'
>;

const scheduler = fsrs({
  enable_fuzz: false,
});

const ratingToGrade: Record<ReviewRating, Grade> = {
  again: Rating.Again,
  hard: Rating.Hard,
  good: Rating.Good,
  easy: Rating.Easy,
};

const toFsrsState = (state: ReviewState): State => {
  switch (state) {
    case 'learning':
      return State.Learning;
    case 'review':
      return State.Review;
    case 'relearning':
      return State.Relearning;
    case 'new':
    default:
      return State.New;
  }
};

const fromFsrsState = (state: State): ReviewState => {
  switch (state) {
    case State.Learning:
      return 'learning';
    case State.Review:
      return 'review';
    case State.Relearning:
      return 'relearning';
    case State.New:
    default:
      return 'new';
  }
};

const buildFsrsCard = (card: Card, now: Date): FsrsCard => {
  const base = createEmptyCard(now);
  return {
    ...base,
    due: new Date(card.dueAt),
    state: toFsrsState(card.reviewState),
    stability: card.stability ?? base.stability,
    difficulty: card.difficulty ?? base.difficulty,
    elapsed_days: card.elapsedDays ?? base.elapsed_days,
    scheduled_days: card.scheduledDays ?? base.scheduled_days,
    learning_steps: card.learningSteps,
    reps: card.reps,
    lapses: card.lapses,
    last_review: card.lastReviewAt ? new Date(card.lastReviewAt) : base.last_review,
  };
};

export const createInitialReviewMeta = (now = Date.now()): CardReviewUpdate => ({
  reviewState: 'new',
  dueAt: now,
  stability: undefined,
  difficulty: undefined,
  elapsedDays: 0,
  scheduledDays: 0,
  learningSteps: 0,
  reps: 0,
  lapses: 0,
  lastReviewAt: undefined,
});

export const scheduleReview = (
  card: Card,
  rating: ReviewRating,
  nowMs = Date.now()
): CardReviewUpdate => {
  const now = new Date(nowMs);
  const fsrsCard = buildFsrsCard(card, now);
  const next = scheduler.next(fsrsCard, now, ratingToGrade[rating]).card;

  return {
    reviewState: fromFsrsState(next.state),
    dueAt: next.due.getTime(),
    stability: next.stability,
    difficulty: next.difficulty,
    elapsedDays: next.elapsed_days,
    scheduledDays: next.scheduled_days,
    learningSteps: next.learning_steps,
    reps: next.reps,
    lapses: next.lapses,
    lastReviewAt: next.last_review ? next.last_review.getTime() : nowMs,
  };
};

const getDueAt = (card: Card): number => (typeof card.dueAt === 'number' ? card.dueAt : card.createdAt);

const isNeverReviewed = (card: Card) => !card.lastReviewAt && card.reps === 0;

export const buildReviewQueue = (cards: Card[], now = Date.now()): Card[] => {
  const due = cards
    .filter((card) => getDueAt(card) <= now)
    .sort((a, b) => getDueAt(a) - getDueAt(b) || a.updatedAt - b.updatedAt);

  if (due.length > 0) {
    return due;
  }

  return cards
    .filter(isNeverReviewed)
    .sort((a, b) => a.createdAt - b.createdAt || a.updatedAt - b.updatedAt);
};
