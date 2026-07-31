import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../theme';

interface DifficultyPillProps {
  level: number;
}

export const DifficultyPill: React.FC<DifficultyPillProps> = ({ level }) => {
  return (
    <View style={styles.pill}>
      <Text style={styles.text}>DIFFICULTY {level}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  pill: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    alignSelf: 'center',
  },
  text: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 10,
    letterSpacing: 1.5,
    color: colors.textMuted,
  },
});
