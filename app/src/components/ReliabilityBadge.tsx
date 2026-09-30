import { View, Text } from 'react-native';
import { calculateReliability, getReliabilityBadgeColor, getReliabilityDescription } from '../utils/calculateReliability';

interface ReliabilityBadgeProps {
  mealsHosted: number;
  mealsJoined: number;
  noShows: number;
  size?: 'small' | 'medium' | 'large';
  showDescription?: boolean;
  showStats?: boolean;
}

export function ReliabilityBadge({
  mealsHosted,
  mealsJoined,
  noShows,
  size = 'medium',
  showDescription = false,
  showStats = false,
}: ReliabilityBadgeProps) {
  const stats = calculateReliability(mealsHosted, mealsJoined, noShows);
  const badgeColor = getReliabilityBadgeColor(stats.reliabilityLabel);

  // Size configurations
  const sizeConfig = {
    small: {
      containerPadding: 'px-2 py-1',
      badgeText: 'text-xs',
      labelText: 'text-xs',
      statsText: 'text-xs',
    },
    medium: {
      containerPadding: 'px-3 py-1.5',
      badgeText: 'text-sm',
      labelText: 'text-sm',
      statsText: 'text-sm',
    },
    large: {
      containerPadding: 'px-4 py-2',
      badgeText: 'text-base',
      labelText: 'text-base',
      statsText: 'text-sm',
    },
  };

  const config = sizeConfig[size];

  return (
    <View>
      {/* Badge */}
      <View
        className={`flex-row items-center ${config.containerPadding} rounded-full`}
        style={{ backgroundColor: `${badgeColor}15` }}
      >
        <View className="w-2 h-2 rounded-full" style={{ backgroundColor: badgeColor }} />
        <Text
          className={`${config.labelText} font-medium ml-1.5`}
          style={{ color: badgeColor }}
        >
          {stats.reliabilityLabel}
        </Text>
        {showStats && stats.totalMeals > 0 && (
          <Text className={`${config.statsText} text-ink-secondary ml-1.5`}>
            ({stats.mealsCompleted}/{stats.totalMeals})
          </Text>
        )}
      </View>

      {/* Description */}
      {showDescription && (
        <Text className="text-xs text-ink-secondary mt-1">
          {getReliabilityDescription(stats.reliabilityLabel)}
        </Text>
      )}
    </View>
  );
}

/**
 * Reliability score display component (for detailed view)
 */
interface ReliabilityScoreProps {
  mealsHosted: number;
  mealsJoined: number;
  noShows: number;
}

export function ReliabilityScore({
  mealsHosted,
  mealsJoined,
  noShows,
}: ReliabilityScoreProps) {
  const stats = calculateReliability(mealsHosted, mealsJoined, noShows);
  const badgeColor = getReliabilityBadgeColor(stats.reliabilityLabel);

  // With no meals there's nothing to score: "100%" would be made up
  if (stats.totalMeals === 0) {
    return (
      <View className="bg-surface rounded-2xl p-4 shadow-sm">
        <View className="flex-row items-center justify-between">
          <Text className="text-[17px] font-semibold text-ink">Reliability</Text>
          <Text className="text-[17px] font-semibold text-ink-secondary">New</Text>
        </View>
        <Text className="text-[13px] text-ink-muted mt-2">
          Your record starts with your first meal.
        </Text>
      </View>
    );
  }

  return (
    <View className="bg-surface rounded-2xl p-4 shadow-sm">
      {/* Header */}
      <View className="flex-row items-center justify-between mb-3">
        <Text className="text-[17px] font-semibold text-ink">
          Reliability
        </Text>
        <View className="flex-row items-center">
          <Text
            className="text-[17px] font-semibold"
            style={{ color: badgeColor }}
          >
            {stats.reliabilityPercentage}%
          </Text>
        </View>
      </View>

      {/* Stats breakdown */}
      <View className="space-y-2">
        <View className="flex-row justify-between">
          <Text className="text-[15px] text-ink-secondary">
            Meals completed
          </Text>
          <Text className="text-[15px] font-medium text-ink">
            {stats.mealsCompleted}
          </Text>
        </View>

        {stats.noShows > 0 && (
          <View className="flex-row justify-between">
            <Text className="text-[15px] text-ink-secondary">
              No-shows
            </Text>
            <Text className="text-[15px] font-medium text-error">
              {stats.noShows}
            </Text>
          </View>
        )}

        <View className="flex-row justify-between">
          <Text className="text-[15px] text-ink-secondary">
            Total meals
          </Text>
          <Text className="text-[15px] font-medium text-ink">
            {stats.totalMeals}
          </Text>
        </View>
      </View>

      {/* Description */}
      <Text className="text-[13px] text-ink-muted mt-3 italic">
        {getReliabilityDescription(stats.reliabilityLabel)}
      </Text>
    </View>
  );
}
