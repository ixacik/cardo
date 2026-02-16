export type NewCardOrder = 'insertion' | 'random';
export type ReviewCardOrder = 'due' | 'random';

export type StudyLane =
  | 'learning_intraday'
  | 'learning_interday'
  | 'review'
  | 'new'
  | 'forgotten'
  | 'ahead';

export type DeckStudyOptions = {
  newPerDay: number;
  reviewPerDay: number;
  newOrder: NewCardOrder;
  reviewOrder: ReviewCardOrder;
  burySiblings: boolean;
  learningSteps: number[];
  relearningSteps: number[];
  maxInterval: number;
  desiredRetention: number;
  easyBonus: number;
  intervalModifier: number;
};

export type DailyDeckState = {
  deckName?: string;
  dayStamp: string;
  newShown: number;
  reviewShown: number;
  customNewDelta: number;
  customReviewDelta: number;
  lastResetAt: number;
};

export type CustomStudyOptions = {
  addNewCards?: number;
  addReviewCards?: number;
  includeForgotten?: boolean;
  includeReviewAhead?: boolean;
};

export type QueueEntry = {
  cardId: string;
  lane: StudyLane;
};

export type QueueBuildResult = {
  entries: QueueEntry[];
  availableByLane: Record<StudyLane, number>;
  selectedByLane: Record<StudyLane, number>;
  limitExhausted: {
    new: boolean;
    review: boolean;
  };
  remaining: {
    new: number;
    review: number;
  };
};

export const DEFAULT_DECK_STUDY_OPTIONS: DeckStudyOptions = {
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
