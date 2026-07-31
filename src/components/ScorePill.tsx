import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../theme';

interface ScorePillProps {
  score: number;
  label?: string;
}

export const ScorePill: React.FC<ScorePillProps> = ({ score, label = 'Score' }) => {
  return (
    <View style={styles.pill}>
      <Text style={styles.label}>{label}: </Text>
      <Text style={styles.value}>{score}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(124, 92, 255, 0.12)',
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(124, 92, 255, 0.3)',
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  label: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: colors.textSecondary,
  },
  value: {
    fontFamily: 'Inter_700Bold',
    fontSize: 13,
    color: colors.accent,
  },
});
