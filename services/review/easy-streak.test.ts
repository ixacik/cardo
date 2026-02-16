import { describe, expect, it } from 'vitest';

import { advanceEasyStreak, createInitialEasyStreakState } from './easy-streak';

describe('easy streak', () => {
  it('increments streak on easy and tracks best', () => {
    const initial = createInitialEasyStreakState();

    const first = advanceEasyStreak(initial, 'easy');
    const second = advanceEasyStreak(first, 'easy');

    expect(first).toEqual({
      current: 1,
      best: 1,
      totalEasy: 1,
    });
    expect(second).toEqual({
      current: 2,
      best: 2,
      totalEasy: 2,
    });
  });

  it('resets current streak on non-easy ratings while keeping history', () => {
    const seeded = {
      current: 3,
      best: 5,
      totalEasy: 8,
    };

    const next = advanceEasyStreak(seeded, 'good');

    expect(next).toEqual({
      current: 0,
      best: 5,
      totalEasy: 8,
    });
  });
});
