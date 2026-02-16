import type { ReviewRating } from '@/types/card';

export type EasyStreakState = {
  current: number;
  best: number;
  totalEasy: number;
};

export const createInitialEasyStreakState = (): EasyStreakState => ({
  current: 0,
  best: 0,
  totalEasy: 0,
});

export const advanceEasyStreak = (
  state: EasyStreakState,
  rating: ReviewRating
): EasyStreakState => {
  if (rating === 'easy') {
    const nextCurrent = state.current + 1;
    return {
      current: nextCurrent,
      best: Math.max(state.best, nextCurrent),
      totalEasy: state.totalEasy + 1,
    };
  }

  return {
    ...state,
    current: 0,
  };
};
