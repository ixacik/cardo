export type ReviewSettings = {
  dailyReviewGoal: number;
  reviewSessionLimit: number;
  learnSessionLimit: number;
  learnNewCardsPerSession: number;
};

type RawReviewSettings = Partial<Record<keyof ReviewSettings, unknown>>;

const toSanitizedLimit = (value: unknown, fallback: number): number => {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return fallback;
  }

  const rounded = Math.floor(value);
  return rounded < 0 ? 0 : rounded;
};

export const DEFAULT_REVIEW_SETTINGS: ReviewSettings = {
  dailyReviewGoal: 200,
  reviewSessionLimit: 100,
  learnSessionLimit: 40,
  learnNewCardsPerSession: 20,
};

export const parseReviewSettings = (record: RawReviewSettings | null | undefined): ReviewSettings => ({
  dailyReviewGoal: toSanitizedLimit(
    record?.dailyReviewGoal,
    DEFAULT_REVIEW_SETTINGS.dailyReviewGoal
  ),
  reviewSessionLimit: toSanitizedLimit(
    record?.reviewSessionLimit,
    DEFAULT_REVIEW_SETTINGS.reviewSessionLimit
  ),
  learnSessionLimit: toSanitizedLimit(
    record?.learnSessionLimit,
    DEFAULT_REVIEW_SETTINGS.learnSessionLimit
  ),
  learnNewCardsPerSession: toSanitizedLimit(
    record?.learnNewCardsPerSession,
    DEFAULT_REVIEW_SETTINGS.learnNewCardsPerSession
  ),
});

export const parseLimitInput = (value: string, fallback: number): number => {
  const trimmed = value.trim();
  if (!trimmed) {
    return fallback;
  }

  const parsed = Number.parseInt(trimmed, 10);
  if (!Number.isFinite(parsed) || parsed < 0) {
    return fallback;
  }

  return parsed;
};
