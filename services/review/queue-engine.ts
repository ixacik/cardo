import { startOfLocalDay, toLocalDayNumber, toLocalDayStamp } from '@/services/review/day';
import type { Card } from '@/types/card';
import type {
  CustomStudyOptions,
  DailyDeckState,
  DeckStudyOptions,
  QueueBuildResult,
  QueueEntry,
  StudyLane,
} from '@/types/study';

export type QueueEngineArgs = {
  cards: Card[];
  deckName?: string;
  nowMs?: number;
  options: DeckStudyOptions;
  dailyState: DailyDeckState;
  customStudy?: CustomStudyOptions;
};

const NO_LIMIT = Number.POSITIVE_INFINITY;

const compareByDueThenUpdated = (left: Card, right: Card): number =>
  left.dueAt - right.dueAt || left.updatedAt - right.updatedAt || left.createdAt - right.createdAt;

const compareByCreatedThenUpdated = (left: Card, right: Card): number =>
  left.createdAt - right.createdAt || left.updatedAt - right.updatedAt;

const hashString = (value: string): number => {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(index);
    hash |= 0;
  }
  return hash;
};

const compareDeterministicRandom = (left: Card, right: Card, salt: string): number => {
  const leftHash = hashString(`${salt}:${left.id}`);
  const rightHash = hashString(`${salt}:${right.id}`);
  return leftHash - rightHash || compareByCreatedThenUpdated(left, right);
};

const isLearningState = (card: Card): boolean =>
  card.reviewState === 'learning' || card.reviewState === 'relearning';

const normalizedDeckName = (value: string | undefined): string | undefined => {
  const trimmed = value?.trim();
  return trimmed && trimmed.length > 0 ? trimmed : undefined;
};

const isInDeck = (card: Card, deckName: string | undefined): boolean => {
  if (!deckName) {
    return true;
  }

  return (card.deckName?.trim() ?? '') === deckName;
};

const isBuriedToday = (card: Card, localDayNumber: number): boolean =>
  typeof card.buriedUntilDay === 'number' && card.buriedUntilDay >= localDayNumber;

const defaultLaneCounts = (): Record<StudyLane, number> => ({
  learning_intraday: 0,
  learning_interday: 0,
  review: 0,
  new: 0,
  forgotten: 0,
  ahead: 0,
});

const isReviewBudgetLane = (lane: StudyLane): boolean =>
  lane === 'review' || lane === 'forgotten' || lane === 'ahead';

const isNewBudgetLane = (lane: StudyLane): boolean => lane === 'new';

const compareForgotten = (left: Card, right: Card): number =>
  right.lapses - left.lapses || compareByDueThenUpdated(left, right);

const sortReviewCandidates = (cards: Card[], options: DeckStudyOptions, salt: string): Card[] => {
  if (options.reviewOrder === 'random') {
    return [...cards].sort((left, right) => compareDeterministicRandom(left, right, salt));
  }

  return [...cards].sort(compareByDueThenUpdated);
};

const sortNewCandidates = (cards: Card[], options: DeckStudyOptions, salt: string): Card[] => {
  if (options.newOrder === 'random') {
    return [...cards].sort((left, right) => compareDeterministicRandom(left, right, salt));
  }

  return [...cards].sort(compareByCreatedThenUpdated);
};

const withUniqueIds = (entries: QueueEntry[]): QueueEntry[] => {
  const seen = new Set<string>();
  const deduped: QueueEntry[] = [];

  entries.forEach((entry) => {
    if (seen.has(entry.cardId)) {
      return;
    }
    seen.add(entry.cardId);
    deduped.push(entry);
  });

  return deduped;
};

export const composeStudyQueue = ({
  cards,
  deckName,
  nowMs = Date.now(),
  options,
  dailyState,
  customStudy,
}: QueueEngineArgs): QueueBuildResult => {
  const dayStartMs = startOfLocalDay(nowMs);
  const dayStamp = toLocalDayStamp(nowMs);
  const localDayNumber = toLocalDayNumber(nowMs);
  const selectedDeckName = normalizedDeckName(deckName);

  const eligible = cards.filter(
    (card) => isInDeck(card, selectedDeckName) && !card.isSuspended && !isBuriedToday(card, localDayNumber)
  );

  const dueLearningIntraday = eligible
    .filter((card) => isLearningState(card) && card.dueAt <= nowMs && card.dueAt >= dayStartMs)
    .sort(compareByDueThenUpdated);

  const dueLearningInterday = eligible
    .filter((card) => isLearningState(card) && card.dueAt <= nowMs && card.dueAt < dayStartMs)
    .sort(compareByDueThenUpdated);

  const reviewDue = sortReviewCandidates(
    eligible.filter((card) => card.reviewState === 'review' && card.dueAt <= nowMs),
    options,
    `${dayStamp}:review`
  );

  const newCards = sortNewCandidates(
    eligible.filter((card) => card.reviewState === 'new'),
    options,
    `${dayStamp}:new`
  );

  const forgotten = customStudy?.includeForgotten
    ? eligible
        .filter(
          (card) => card.reviewState !== 'new' && card.lapses > 0 && !isLearningState(card)
        )
        .sort(compareForgotten)
    : [];

  const reviewAhead = customStudy?.includeReviewAhead
    ? sortReviewCandidates(
        eligible.filter((card) => card.reviewState === 'review' && card.dueAt > nowMs),
        options,
        `${dayStamp}:ahead`
      )
    : [];

  const availableByLane = defaultLaneCounts();
  availableByLane.learning_intraday = dueLearningIntraday.length;
  availableByLane.learning_interday = dueLearningInterday.length;
  availableByLane.review = reviewDue.length;
  availableByLane.new = newCards.length;
  availableByLane.forgotten = forgotten.length;
  availableByLane.ahead = reviewAhead.length;

  let remainingNew =
    options.newPerDay <= 0
      ? NO_LIMIT
      : Math.max(options.newPerDay + dailyState.customNewDelta - dailyState.newShown, 0);
  let remainingReview =
    options.reviewPerDay <= 0
      ? NO_LIMIT
      : Math.max(options.reviewPerDay + dailyState.customReviewDelta - dailyState.reviewShown, 0);

  const selectedByLane = defaultLaneCounts();
  const selectedEntries: QueueEntry[] = [];
  const selectedCardIds = new Set<string>();
  const buriedNoteIds = new Set<string>();
  let newLimitExhausted = false;
  let reviewLimitExhausted = false;

  const admit = (lane: StudyLane, candidates: Card[]) => {
    candidates.forEach((card) => {
      if (selectedCardIds.has(card.id)) {
        return;
      }

      const applySiblingBury = options.burySiblings && !isLearningState(card);
      if (applySiblingBury && buriedNoteIds.has(card.noteId)) {
        return;
      }

      if (isNewBudgetLane(lane)) {
        if (remainingNew <= 0) {
          if (candidates.length > 0) {
            newLimitExhausted = true;
          }
          return;
        }
        if (remainingNew !== NO_LIMIT) {
          remainingNew -= 1;
        }
      }

      if (isReviewBudgetLane(lane)) {
        if (remainingReview <= 0) {
          if (candidates.length > 0) {
            reviewLimitExhausted = true;
          }
          return;
        }
        if (remainingReview !== NO_LIMIT) {
          remainingReview -= 1;
        }
      }

      selectedCardIds.add(card.id);
      selectedByLane[lane] += 1;
      selectedEntries.push({ cardId: card.id, lane });

      if (applySiblingBury) {
        buriedNoteIds.add(card.noteId);
      }
    });
  };

  admit('learning_intraday', dueLearningIntraday);
  admit('learning_interday', dueLearningInterday);
  admit('forgotten', forgotten);
  admit('review', reviewDue);
  admit('ahead', reviewAhead);
  admit('new', newCards);

  return {
    entries: withUniqueIds(selectedEntries),
    availableByLane,
    selectedByLane,
    limitExhausted: {
      new: newLimitExhausted,
      review: reviewLimitExhausted,
    },
    remaining: {
      new: Number.isFinite(remainingNew) ? remainingNew : -1,
      review: Number.isFinite(remainingReview) ? remainingReview : -1,
    },
  };
};

export const getNextPendingLearningDueAt = (
  cards: Card[],
  deckName: string | undefined,
  nowMs = Date.now()
): number | null => {
  const selectedDeckName = normalizedDeckName(deckName);
  const localDayNumber = toLocalDayNumber(nowMs);

  let earliest: number | null = null;
  cards.forEach((card) => {
    if (!isInDeck(card, selectedDeckName) || card.isSuspended || isBuriedToday(card, localDayNumber)) {
      return;
    }
    if (!isLearningState(card) || card.dueAt <= nowMs) {
      return;
    }

    if (earliest === null || card.dueAt < earliest) {
      earliest = card.dueAt;
    }
  });

  return earliest;
};
