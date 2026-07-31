import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { colors } from '../theme';
import { Rank } from '../types';

interface RankBadgeProps {
  rank: Rank;
  size?: number;
  showLabel?: boolean;
  large?: boolean;
}

export const RankBadge: React.FC<RankBadgeProps> = ({
  rank,
  size,
  showLabel = true,
  large = false,
}) => {
  const resolvedSize = size ?? (large ? 64 : 56);
  const iconSize = Math.round(resolvedSize * 0.5);

  return (
    <View style={styles.wrapper}>
      {/* Outer glow ring */}
      <View
        style={[
          styles.glowRing,
          {
            width: resolvedSize + 14,
            height: resolvedSize + 14,
            borderRadius: (resolvedSize + 14) / 2,
          },
        ]}
      />
      <LinearGradient
        colors={[colors.primary, colors.primaryDim]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[
          styles.badge,
          {
            width: resolvedSize,
            height: resolvedSize,
            borderRadius: resolvedSize / 2,
          },
        ]}
      >
        <MaterialIcons
          name={rank.icon}
          size={iconSize}
          color={colors.textPrimary}
        />
      </LinearGradient>

      {showLabel && (
        <Text style={styles.label} numberOfLines={1}>
          {rank.name.toUpperCase()}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
  },
  glowRing: {
    position: 'absolute',
    top: -7,
    left: -7,
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: 'rgba(124, 92, 255, 0.55)',
    shadowColor: '#7C5CFF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 12,
    elevation: 6,
  },
  badge: {
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#7C5CFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.6,
    shadowRadius: 12,
    elevation: 8,
  },
  label: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 6,
    letterSpacing: 1.5,
  },
});
