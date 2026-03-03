import { describe, it, expect } from 'vitest';
import { computeRatingStats } from '../ratingStats';

describe('computeRatingStats', () => {
  it('returns zeros for empty array', () => {
    expect(computeRatingStats([])).toEqual({ ratingAvg: 0, ratingCount: 0 });
  });

  it('returns exact value for a single review', () => {
    expect(computeRatingStats([{ avg: 4, count: 1 }])).toEqual({ ratingAvg: 4, ratingCount: 1 });
  });

  it('rounds 4.666... to 4.7', () => {
    expect(computeRatingStats([{ avg: 4.6666666, count: 3 }])).toEqual({ ratingAvg: 4.7, ratingCount: 3 });
  });

  it('rounds 4.75 to 4.8', () => {
    expect(computeRatingStats([{ avg: 4.75, count: 4 }])).toEqual({ ratingAvg: 4.8, ratingCount: 4 });
  });

  it('leaves 1.5 unchanged', () => {
    expect(computeRatingStats([{ avg: 1.5, count: 2 }])).toEqual({ ratingAvg: 1.5, ratingCount: 2 });
  });

  it('leaves whole numbers unchanged', () => {
    expect(computeRatingStats([{ avg: 5, count: 10 }])).toEqual({ ratingAvg: 5, ratingCount: 10 });
  });
});
