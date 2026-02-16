import {
  Rating,
  State,
  createEmptyCard,
  fsrs,
  generatorParameters,
  type Card as FsrsCard,
  type Grade,
} from 'ts-fsrs';

import type { Card, ReviewRating, ReviewState } from '@/types/card';
import { DEFAULT_DECK_STUDY_OPTIONS, type DeckStudyOptions } from '@/types/study';

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

type FsrsScheduler = ReturnType<typeof fsrs>;
type StepDuration = `${number}m` | `${number}h` | `${number}d`;

const schedulerCache = new Map<string, FsrsScheduler>();

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

const toStepDurations = (steps: number[]): StepDuration[] =>
  steps
    .filter((step) => Number.isFinite(step) && step > 0)
    .map((step) => `${Math.floor(step)}m` as StepDuration);

const buildSchedulerKey = (options: DeckStudyOptions): string =>
  JSON.stringify({
    learningSteps: options.learningSteps,
    relearningSteps: options.relearningSteps,
    desiredRetention: options.desiredRetention,
  });

const getScheduler = (options: DeckStudyOptions): FsrsScheduler => {
  const key = buildSchedulerKey(options);
  const existing = schedulerCache.get(key);
  if (existing) {
    return existing;
  }

  const learningSteps = toStepDurations(options.learningSteps);
  const relearningSteps = toStepDurations(options.relearningSteps);

  const scheduler = fsrs(
    generatorParameters({
      enable_fuzz: true,
      enable_short_term: true,
      learning_steps: learningSteps.length > 0 ? learningSteps : ['1m', '10m'],
      relearning_steps: relearningSteps.length > 0 ? relearningSteps : ['10m'],
      request_retention: options.desiredRetention,
    })
  );

  schedulerCache.set(key, scheduler);
  return scheduler;
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
  nowMs = Date.now(),
  options: DeckStudyOptions = DEFAULT_DECK_STUDY_OPTIONS
): CardReviewUpdate => {
  const now = new Date(nowMs);
  const fsrsCard = buildFsrsCard(card, now);
  const scheduler = getScheduler(options);
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
