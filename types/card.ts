export type Card = {
  id: string;
  noteId: string;
  cardOrdinal: number;
  deckName?: string;
  title: string;
  frontText: string;
  backText: string;
  imageUris?: string[];
  isSuspended: boolean;
  buriedUntilDay?: number;
  reviewState: ReviewState;
  dueAt: number;
  stability?: number;
  difficulty?: number;
  elapsedDays?: number;
  scheduledDays?: number;
  learningSteps: number;
  reps: number;
  lapses: number;
  lastReviewAt?: number;
  createdAt: number;
  updatedAt: number;
};

export type CardInput = {
  deckName?: string;
  title: string;
  frontText: string;
  backText: string;
  imageUris?: string[];
};

export const REVIEW_STATES = ['new', 'learning', 'review', 'relearning'] as const;
export type ReviewState = (typeof REVIEW_STATES)[number];

export const REVIEW_RATINGS = ['again', 'hard', 'good', 'easy'] as const;
export type ReviewRating = (typeof REVIEW_RATINGS)[number];

export const isReviewState = (value: unknown): value is ReviewState =>
  value === 'new' || value === 'learning' || value === 'review' || value === 'relearning';
