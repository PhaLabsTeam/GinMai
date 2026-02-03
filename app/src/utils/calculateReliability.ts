/**
 * Calculate user reliability score based on their connection history
 */

export interface ReliabilityStats {
  mealsCompleted: number;
  noShows: number;
  totalMeals: number; // mealsCompleted + noShows
  reliabilityScore: number; // 0.00 to 1.00
  reliabilityPercentage: number; // 0 to 100
  reliabilityLabel: 'New' | 'Reliable' | 'Good' | 'Fair' | 'Warning';
  reliabilityBadge: string; // Emoji badge
}

/**
 * Calculate reliability score from user stats
 */
export function calculateReliability(
  mealsHosted: number,
  mealsJoined: number,
  noShows: number
): ReliabilityStats {
  const totalMeals = mealsHosted + mealsJoined;
  const mealsCompleted = totalMeals - noShows;

  // Calculate reliability score
  let reliabilityScore = 1.0; // Default to perfect score for new users

  if (totalMeals > 0) {
    reliabilityScore = mealsCompleted / totalMeals;
  }

  const reliabilityPercentage = Math.round(reliabilityScore * 100);

  // Determine label and badge based on score and total meals
  let reliabilityLabel: ReliabilityStats['reliabilityLabel'];
  let reliabilityBadge: string;

  if (totalMeals < 3) {
    // New users (fewer than 3 meals)
    reliabilityLabel = 'New';
    reliabilityBadge = '🆕';
  } else if (reliabilityScore >= 0.95) {
    // 95%+ reliability
    reliabilityLabel = 'Reliable';
    reliabilityBadge = '⭐';
  } else if (reliabilityScore >= 0.80) {
    // 80-94% reliability
    reliabilityLabel = 'Good';
    reliabilityBadge = '✅';
  } else if (reliabilityScore >= 0.60) {
    // 60-79% reliability
    reliabilityLabel = 'Fair';
    reliabilityBadge = '👍';
  } else {
    // Below 60% reliability
    reliabilityLabel = 'Warning';
    reliabilityBadge = '⚠️';
  }

  return {
    mealsCompleted,
    noShows,
    totalMeals,
    reliabilityScore,
    reliabilityPercentage,
    reliabilityLabel,
    reliabilityBadge,
  };
}

/**
 * Get reliability badge color for UI
 */
export function getReliabilityBadgeColor(label: ReliabilityStats['reliabilityLabel']): string {
  switch (label) {
    case 'Reliable':
      return '#22C55E'; // Green
    case 'Good':
      return '#3B82F6'; // Blue
    case 'Fair':
      return '#F59E0B'; // Amber
    case 'Warning':
      return '#EF4444'; // Red
    case 'New':
    default:
      return '#9CA3AF'; // Gray
  }
}

/**
 * Get reliability description text
 */
export function getReliabilityDescription(label: ReliabilityStats['reliabilityLabel']): string {
  switch (label) {
    case 'Reliable':
      return 'Very reliable - rarely misses meals';
    case 'Good':
      return 'Generally reliable';
    case 'Fair':
      return 'Sometimes doesn't show up';
    case 'Warning':
      return 'Often doesn't show up';
    case 'New':
    default:
      return 'New to GinMai';
  }
}

/**
 * Check if user should be shown reliability warning
 */
export function shouldShowReliabilityWarning(stats: ReliabilityStats): boolean {
  return stats.totalMeals >= 5 && stats.reliabilityScore < 0.60;
}
