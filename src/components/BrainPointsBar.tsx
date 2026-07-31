import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ProgressBar } from './ProgressBar';
import { colors } from '../theme';

interface BrainPointsBarProps {
  currentBP: number;
  targetBP: number;
  nextRankName: string;
}

export const BrainPointsBar: React.FC<BrainPointsBarProps> = ({
  currentBP,
  targetBP,
  nextRankName,
}) => {
  const progress = targetBP > 0 ? Math.min(1, currentBP / targetBP) : 1;
  const remaining = Math.max(0, targetBP - currentBP);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.label}>BRAIN POINTS</Text>
        <Text style={styles.values}>
          {currentBP.toLocaleString()} <Text style={styles.target}>/ {targetBP.toLocaleString()} BP</Text>
        </Text>
      </View>
      <ProgressBar progress={progress} height={10} pulse />
      <Text style={styles.subtext}>
        {remaining > 0 ? `${remaining.toLocaleString()} BP to ${nextRankName}` : 'Max rank achieved!'}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { width: '100%' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 8,
  },
  label: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 11,
    letterSpacing: 1.5,
    color: colors.textMuted,
    textTransform: 'uppercase',
  },
  values: {
    fontFamily: 'Inter_700Bold',
    fontSize: 16,
    color: colors.textPrimary,
  },
  target: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    color: colors.textMuted,
  },
  subtext: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 6,
  },
});
