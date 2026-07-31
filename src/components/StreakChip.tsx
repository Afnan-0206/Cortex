import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { colors } from '../theme';

interface StreakChipProps {
  streak: number;
}

export const StreakChip: React.FC<StreakChipProps> = ({ streak }) => {
  return (
    <View style={styles.chip}>
      <MaterialCommunityIcons name="fire" size={16} color={colors.streak} style={styles.icon} />
      <Text style={styles.text}>{streak} day streak</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255, 159, 69, 0.12)',
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255, 159, 69, 0.35)',
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  icon: { marginRight: 4 },
  text: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 13,
    color: colors.streak,
    letterSpacing: 0.3,
  },
});
