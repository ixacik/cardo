import { toLocalDayNumber } from '@/services/review/day';
import type { Card } from '@/types/card';

export type StudyOverviewCounts = {
  newCount: number;
  learningCount: number;
  reviewDueCount: number;
};

const normalizeDeckName = (deckName: string | undefined): string | undefined => {
  const trimmed = deckName?.trim();
  return trimmed && trimmed.length > 0 ? trimmed : undefined;
};

const isInDeck = (card: Card, deckName: string | undefined): boolean => {
  if (!deckName) {
    return true;
  }

  return (card.deckName?.trim() ?? '') === deckName;
};

const isBuried = (card: Card, localDayNumber: number): boolean =>
  typeof card.buriedUntilDay === 'number' && card.buriedUntilDay >= localDayNumber;

export const getStudyOverviewCounts = (
  cards: Card[],
  deckName: string | undefined,
  nowMs = Date.now()
): StudyOverviewCounts => {
  const localDayNumber = toLocalDayNumber(nowMs);
  const normalizedDeckName = normalizeDeckName(deckName);

  return cards.reduce<StudyOverviewCounts>(
    (counts, card) => {
      if (!isInDeck(card, normalizedDeckName) || card.isSuspended || isBuried(card, localDayNumber)) {
        return counts;
      }

      if (card.reviewState === 'new') {
        counts.newCount += 1;
        return counts;
      }

      if (card.reviewState === 'learning' || card.reviewState === 'relearning') {
        if (card.dueAt <= nowMs) {
          counts.learningCount += 1;
        }
        return counts;
      }

      if (card.reviewState === 'review' && card.dueAt <= nowMs) {
        counts.reviewDueCount += 1;
      }

      return counts;
    },
    {
      newCount: 0,
      learningCount: 0,
      reviewDueCount: 0,
    }
  );
};
