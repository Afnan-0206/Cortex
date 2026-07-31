import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { colors } from '../theme';

type MCIcon = React.ComponentProps<typeof MaterialCommunityIcons>['name'];

interface StatChipProps {
  icon: MCIcon;
  value: string | number;
  label: string;
}

export const StatChip: React.FC<StatChipProps> = ({ icon, value, label }) => {
  return (
    <View style={styles.container}>
      <View style={styles.iconWrap}>
        <MaterialCommunityIcons name={icon} size={22} color={colors.primary} />
      </View>
      <Text style={styles.value}>{value}</Text>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: 'rgba(124, 92, 255, 0.18)',
    paddingVertical: 16,
    paddingHorizontal: 10,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#7C5CFF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
  iconWrap: {
    marginBottom: 6,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 2,
  },
  value: {
    fontFamily: 'Inter_700Bold',
    fontSize: 22,
    color: colors.textPrimary,
    lineHeight: 28,
  },
  label: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 10,
    letterSpacing: 1.5,
    color: colors.textMuted,
    marginTop: 3,
    textAlign: 'center',
    textTransform: 'uppercase',
  },
});
