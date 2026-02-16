import {
  DEFAULT_DECK_STUDY_OPTIONS,
  type DeckStudyOptions,
  type NewCardOrder,
  type ReviewCardOrder,
} from '@/types/study';

export const GLOBAL_DECK_SCOPE = '__all__';

export type RawDeckStudyOptionsRecord = {
  id?: string;
  deckName?: unknown;
  newPerDay?: unknown;
  reviewPerDay?: unknown;
  newOrder?: unknown;
  reviewOrder?: unknown;
  burySiblings?: unknown;
  learningSteps?: unknown;
  relearningSteps?: unknown;
  maxInterval?: unknown;
  desiredRetention?: unknown;
  easyBonus?: unknown;
  intervalModifier?: unknown;
  updatedAt?: unknown;
};

const toOptionalTrimmedString = (value: unknown): string | undefined => {
  if (typeof value !== 'string') {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
};

const toNonNegativeInt = (value: unknown, fallback: number): number => {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return fallback;
  }

  const rounded = Math.floor(value);
  return rounded < 0 ? fallback : rounded;
};

const toFiniteNumber = (value: unknown, fallback: number): number =>
  typeof value === 'number' && Number.isFinite(value) ? value : fallback;

const toBoolean = (value: unknown, fallback: boolean): boolean =>
  typeof value === 'boolean' ? value : fallback;

const toOrder = <T extends string>(
  value: unknown,
  allowed: readonly T[],
  fallback: T
): T => (typeof value === 'string' && allowed.includes(value as T) ? (value as T) : fallback);

const toSteps = (value: unknown, fallback: number[]): number[] => {
  if (!Array.isArray(value)) {
    return fallback;
  }

  const parsed = value
    .map((item) => (typeof item === 'number' && Number.isFinite(item) ? Math.floor(item) : NaN))
    .filter((item) => Number.isFinite(item) && item >= 0);

  return parsed.length > 0 ? parsed : fallback;
};

export const normalizeDeckName = (deckName: string | undefined): string | undefined => {
  const normalized = toOptionalTrimmedString(deckName);
  return normalized;
};

export const toDeckScope = (deckName: string | undefined): string =>
  normalizeDeckName(deckName) ?? GLOBAL_DECK_SCOPE;

export const buildDeckStudyOptionsId = (ownerId: string, deckName: string | undefined): string =>
  `${ownerId}:${toDeckScope(deckName)}`;

export const parseDeckStudyOptions = (
  record: RawDeckStudyOptionsRecord | null | undefined
): DeckStudyOptions => {
  const defaults = DEFAULT_DECK_STUDY_OPTIONS;

  if (!record) {
    return defaults;
  }

  return {
    newPerDay: toNonNegativeInt(record.newPerDay, defaults.newPerDay),
    reviewPerDay: toNonNegativeInt(record.reviewPerDay, defaults.reviewPerDay),
    newOrder: toOrder<NewCardOrder>(record.newOrder, ['insertion', 'random'], defaults.newOrder),
    reviewOrder: toOrder<ReviewCardOrder>(record.reviewOrder, ['due', 'random'], defaults.reviewOrder),
    burySiblings: toBoolean(record.burySiblings, defaults.burySiblings),
    learningSteps: toSteps(record.learningSteps, defaults.learningSteps),
    relearningSteps: toSteps(record.relearningSteps, defaults.relearningSteps),
    maxInterval: toNonNegativeInt(record.maxInterval, defaults.maxInterval),
    desiredRetention: toFiniteNumber(record.desiredRetention, defaults.desiredRetention),
    easyBonus: toFiniteNumber(record.easyBonus, defaults.easyBonus),
    intervalModifier: toFiniteNumber(record.intervalModifier, defaults.intervalModifier),
  };
};

export const resolveDeckStudyOptions = (
  records: RawDeckStudyOptionsRecord[],
  deckName: string | undefined
): DeckStudyOptions => {
  const normalizedDeckName = normalizeDeckName(deckName);

  const deckRecord = records.find(
    (record) => toOptionalTrimmedString(record.deckName) === normalizedDeckName
  );
  if (deckRecord) {
    return parseDeckStudyOptions(deckRecord);
  }

  const globalRecord = records.find(
    (record) => toOptionalTrimmedString(record.deckName) === GLOBAL_DECK_SCOPE
  );

  return parseDeckStudyOptions(globalRecord);
};

export const hasDeckStudyOptions = (
  records: RawDeckStudyOptionsRecord[],
  deckName: string | undefined
): boolean => {
  const normalizedDeckName = normalizeDeckName(deckName);
  return records.some((record) => {
    const recordDeckName = toOptionalTrimmedString(record.deckName);
    return recordDeckName === normalizedDeckName || recordDeckName === GLOBAL_DECK_SCOPE;
  });
};
