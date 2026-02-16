import { createEmptyDailyDeckState } from '@/services/review/daily-state';
import { toLocalDayStamp } from '@/services/review/day';
import {
  composeStudyQueue,
  getNextPendingLearningDueAt,
  type QueueEngineArgs,
} from '@/services/review/queue-engine';
import type { Card } from '@/types/card';
import type {
  CustomStudyOptions,
  DailyDeckState,
  DeckStudyOptions,
  QueueBuildResult,
  QueueEntry,
  StudyLane,
} from '@/types/study';

export type StudySessionState = {
  deckName?: string;
  options: DeckStudyOptions;
  customStudy: CustomStudyOptions;
  dailyState: DailyDeckState;
  queue: QueueEntry[];
  queueBuild: QueueBuildResult;
  reviewedCount: number;
  nextPendingLearningDueAt: number | null;
};

type BuildSessionArgs = {
  cards: Card[];
  deckName?: string;
  nowMs?: number;
  options: DeckStudyOptions;
  customStudy?: CustomStudyOptions;
  dailyState: DailyDeckState;
  reviewedCount?: number;
};

type AdvanceArgs = {
  state: StudySessionState;
  cards: Card[];
  currentCardId: string;
  nowMs?: number;
};

type RefreshArgs = {
  state: StudySessionState;
  cards: Card[];
  nowMs?: number;
};

const REVIEW_COUNTER_LANES: StudyLane[] = ['review', 'forgotten', 'ahead'];

const isReviewCounterLane = (lane: StudyLane): boolean => REVIEW_COUNTER_LANES.includes(lane);

const normalizeDeckName = (deckName: string | undefined): string | undefined => {
  const trimmed = deckName?.trim();
  return trimmed && trimmed.length > 0 ? trimmed : undefined;
};

const ensureDailyStateForNow = (
  dailyState: DailyDeckState,
  deckName: string | undefined,
  nowMs: number
): DailyDeckState => {
  const dayStamp = toLocalDayStamp(nowMs);
  if (dailyState.dayStamp === dayStamp) {
    return dailyState;
  }

  return createEmptyDailyDeckState(deckName, nowMs, dayStamp);
};

const buildQueueArgs = (
  cards: Card[],
  deckName: string | undefined,
  nowMs: number,
  options: DeckStudyOptions,
  customStudy: CustomStudyOptions,
  dailyState: DailyDeckState
): QueueEngineArgs => ({
  cards,
  deckName,
  nowMs,
  options,
  customStudy,
  dailyState,
});

const withLaneCountProgress = (dailyState: DailyDeckState, lane: StudyLane): DailyDeckState => {
  if (lane === 'new') {
    return {
      ...dailyState,
      newShown: dailyState.newShown + 1,
    };
  }

  if (isReviewCounterLane(lane)) {
    return {
      ...dailyState,
      reviewShown: dailyState.reviewShown + 1,
    };
  }

  return dailyState;
};

export const createStudySessionState = ({
  cards,
  deckName,
  nowMs = Date.now(),
  options,
  customStudy,
  dailyState,
  reviewedCount = 0,
}: BuildSessionArgs): StudySessionState => {
  const normalizedDeckName = normalizeDeckName(deckName);
  const resolvedCustomStudy: CustomStudyOptions = {
    addNewCards: customStudy?.addNewCards ?? 0,
    addReviewCards: customStudy?.addReviewCards ?? 0,
    includeForgotten: customStudy?.includeForgotten ?? false,
    includeReviewAhead: customStudy?.includeReviewAhead ?? false,
  };
  const resolvedDailyState = ensureDailyStateForNow(dailyState, normalizedDeckName, nowMs);

  const queueBuild = composeStudyQueue(
    buildQueueArgs(
      cards,
      normalizedDeckName,
      nowMs,
      options,
      resolvedCustomStudy,
      resolvedDailyState
    )
  );

  return {
    deckName: normalizedDeckName,
    options,
    customStudy: resolvedCustomStudy,
    dailyState: resolvedDailyState,
    queue: queueBuild.entries,
    queueBuild,
    reviewedCount,
    nextPendingLearningDueAt: getNextPendingLearningDueAt(cards, normalizedDeckName, nowMs),
  };
};

export const refreshStudySessionState = ({
  state,
  cards,
  nowMs = Date.now(),
}: RefreshArgs): StudySessionState =>
  createStudySessionState({
    cards,
    deckName: state.deckName,
    nowMs,
    options: state.options,
    customStudy: state.customStudy,
    dailyState: state.dailyState,
    reviewedCount: state.reviewedCount,
  });

export const advanceStudySessionState = ({
  state,
  cards,
  currentCardId,
  nowMs = Date.now(),
}: AdvanceArgs): StudySessionState => {
  const currentEntry =
    state.queue[0]?.cardId === currentCardId
      ? state.queue[0]
      : state.queue.find((entry) => entry.cardId === currentCardId);

  const nextDailyState = currentEntry
    ? withLaneCountProgress(state.dailyState, currentEntry.lane)
    : state.dailyState;

  return createStudySessionState({
    cards,
    deckName: state.deckName,
    nowMs,
    options: state.options,
    customStudy: state.customStudy,
    dailyState: nextDailyState,
    reviewedCount: state.reviewedCount + 1,
  });
};

export const hasStudySessionWork = (state: StudySessionState): boolean =>
  state.queue.length > 0 || state.nextPendingLearningDueAt !== null;

export const getCurrentQueueEntry = (state: StudySessionState): QueueEntry | null =>
  state.queue.length > 0 ? state.queue[0] : null;
