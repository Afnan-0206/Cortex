import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { colors } from '../theme';

interface ProgressRingProps {
  progress: number; // 0 to 1
  size?: number;
  strokeWidth?: number;
  label?: string;
  sublabel?: string;
}

export const ProgressRing: React.FC<ProgressRingProps> = ({
  progress,
  size = 140,
  strokeWidth = 12,
  label,
  sublabel,
}) => {
  const percentage = Math.round(progress * 100);

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      {/* Outer ring placeholder */}
      <View
        style={[
          styles.outerRing,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            borderWidth: strokeWidth,
          },
        ]}
      />
      {/* Active ring glow */}
      <View
        style={[
          styles.innerGlow,
          {
            width: size - strokeWidth * 2,
            height: size - strokeWidth * 2,
            borderRadius: (size - strokeWidth * 2) / 2,
          },
        ]}
      />
      <View style={styles.centerContent}>
        <Text style={styles.percentage}>{label ?? `${percentage}%`}</Text>
        {sublabel && <Text style={styles.sublabel}>{sublabel}</Text>}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  outerRing: {
    position: 'absolute',
    borderColor: 'rgba(124, 92, 255, 0.2)',
  },
  innerGlow: {
    position: 'absolute',
    backgroundColor: 'rgba(124, 92, 255, 0.1)',
    borderWidth: 2,
    borderColor: colors.primary,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 16,
    elevation: 6,
  },
  centerContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  percentage: {
    fontFamily: 'Inter_700Bold',
    fontSize: 28,
    color: colors.textPrimary,
  },
  sublabel: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 10,
    letterSpacing: 1.2,
    color: colors.textMuted,
    marginTop: 2,
    textTransform: 'uppercase',
  },
});
