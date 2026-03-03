/**
 * Pure function to compute rating stats from a MongoDB aggregation result.
 * Kept separate for easy unit testing without DB dependency.
 */
export function computeRatingStats(
  result: Array<{ avg: number; count: number }>
): { ratingAvg: number; ratingCount: number } {
  if (!result.length) return { ratingAvg: 0, ratingCount: 0 };
  const { avg, count } = result[0];
  return {
    ratingAvg: Math.round(avg * 10) / 10,
    ratingCount: count,
  };
}
