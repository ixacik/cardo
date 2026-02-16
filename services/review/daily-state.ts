import { normalizeDeckName } from '@/services/review/deck-options';
import { toLocalDayStamp } from '@/services/review/day';
import type { CustomStudyOptions, DailyDeckState } from '@/types/study';

export type RawDailyDeckStateRecord = {
  id?: string;
  deckName?: unknown;
  dayStamp?: unknown;
  newShown?: unknown;
  reviewShown?: unknown;
  customNewDelta?: unknown;
  customReviewDelta?: unknown;
  lastResetAt?: unknown;
  updatedAt?: unknown;
};

const toInt = (value: unknown, fallback: number): number => {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return fallback;
  }

  return Math.floor(value);
};

const toNonNegativeInt = (value: unknown, fallback: number): number => {
  const parsed = toInt(value, fallback);
  return parsed < 0 ? fallback : parsed;
};

const toOptionalTrimmedString = (value: unknown): string | undefined => {
  if (typeof value !== 'string') {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
};

export const createEmptyDailyDeckState = (
  deckName: string | undefined,
  nowMs: number,
  dayStamp = toLocalDayStamp(nowMs)
): DailyDeckState => ({
  deckName: normalizeDeckName(deckName),
  dayStamp,
  newShown: 0,
  reviewShown: 0,
  customNewDelta: 0,
  customReviewDelta: 0,
  lastResetAt: nowMs,
});

export const parseDailyDeckState = (
  record: RawDailyDeckStateRecord | null | undefined,
  deckName: string | undefined,
  nowMs: number,
  expectedDayStamp = toLocalDayStamp(nowMs)
): DailyDeckState => {
  if (!record) {
    return createEmptyDailyDeckState(deckName, nowMs, expectedDayStamp);
  }

  const parsedDayStamp =
    typeof record.dayStamp === 'string' && record.dayStamp.trim().length > 0
      ? record.dayStamp
      : expectedDayStamp;

  if (parsedDayStamp !== expectedDayStamp) {
    return createEmptyDailyDeckState(deckName, nowMs, expectedDayStamp);
  }

  return {
    deckName: normalizeDeckName(deckName),
    dayStamp: parsedDayStamp,
    newShown: toNonNegativeInt(record.newShown, 0),
    reviewShown: toNonNegativeInt(record.reviewShown, 0),
    customNewDelta: toInt(record.customNewDelta, 0),
    customReviewDelta: toInt(record.customReviewDelta, 0),
    lastResetAt: toNonNegativeInt(record.lastResetAt, nowMs),
  };
};

export const applyCustomStudyOverrides = (
  state: DailyDeckState,
  customStudy: CustomStudyOptions | undefined
): DailyDeckState => {
  if (!customStudy) {
    return state;
  }

  return {
    ...state,
    customNewDelta: state.customNewDelta + (customStudy.addNewCards ?? 0),
    customReviewDelta: state.customReviewDelta + (customStudy.addReviewCards ?? 0),
  };
};

export const isDailyStateRecordForDeck = (
  record: RawDailyDeckStateRecord,
  deckName: string | undefined
): boolean => {
  const recordDeckName = toOptionalTrimmedString(record.deckName);
  const targetDeckName = normalizeDeckName(deckName);

  if (!targetDeckName) {
    return recordDeckName === undefined || recordDeckName === '__all__';
  }

  return recordDeckName === targetDeckName;
};
