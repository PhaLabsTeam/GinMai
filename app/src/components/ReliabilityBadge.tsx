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
        <Text className={config.badgeText}>{stats.reliabilityBadge}</Text>
        <Text
          className={`${config.labelText} font-medium ml-1.5`}
          style={{ color: badgeColor }}
        >
          {stats.reliabilityLabel}
        </Text>
        {showStats && stats.totalMeals > 0 && (
          <Text className={`${config.statsText} text-[#6B7280] ml-1.5`}>
            ({stats.mealsCompleted}/{stats.totalMeals})
          </Text>
        )}
      </View>

      {/* Description */}
      {showDescription && (
        <Text className="text-xs text-[#6B7280] mt-1">
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

  return (
    <View className="bg-white rounded-2xl p-4 shadow-sm">
      {/* Header */}
      <View className="flex-row items-center justify-between mb-3">
        <Text className="text-[17px] font-semibold text-[#1C1917]">
          Reliability
        </Text>
        <View className="flex-row items-center">
          <Text className="text-2xl mr-2">{stats.reliabilityBadge}</Text>
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
          <Text className="text-[15px] text-[#6B7280]">
            Meals completed
          </Text>
          <Text className="text-[15px] font-medium text-[#1C1917]">
            {stats.mealsCompleted}
          </Text>
        </View>

        {stats.noShows > 0 && (
          <View className="flex-row justify-between">
            <Text className="text-[15px] text-[#6B7280]">
              No-shows
            </Text>
            <Text className="text-[15px] font-medium text-[#EF4444]">
              {stats.noShows}
            </Text>
          </View>
        )}

        <View className="flex-row justify-between">
          <Text className="text-[15px] text-[#6B7280]">
            Total meals
          </Text>
          <Text className="text-[15px] font-medium text-[#1C1917]">
            {stats.totalMeals}
          </Text>
        </View>
      </View>

      {/* Description */}
      <Text className="text-[13px] text-[#9CA3AF] mt-3 italic">
        {getReliabilityDescription(stats.reliabilityLabel)}
      </Text>
    </View>
  );
}
