import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { colors } from '../theme';

type MCIcon = React.ComponentProps<typeof MaterialCommunityIcons>['name'];

interface StatCardProps {
  icon: MCIcon;
  value: string | number;
  label: string;
  sublabel?: string;
  accentColor?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  icon,
  value,
  label,
  sublabel,
  accentColor = colors.primary,
}) => {
  return (
    <View style={styles.card}>
      <View style={[styles.iconWrap, { backgroundColor: `${accentColor}18` }]}>
        <MaterialCommunityIcons name={icon} size={22} color={accentColor} />
      </View>
      <Text style={styles.value}>{value}</Text>
      <Text style={styles.label}>{label}</Text>
      {sublabel && <Text style={styles.sublabel}>{sublabel}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: 'rgba(124, 92, 255, 0.2)',
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrap: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  value: {
    fontFamily: 'Inter_700Bold',
    fontSize: 22,
    color: colors.textPrimary,
  },
  label: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 10,
    letterSpacing: 1.2,
    color: colors.textMuted,
    marginTop: 4,
    textTransform: 'uppercase',
    textAlign: 'center',
  },
  sublabel: {
    fontFamily: 'Inter_400Regular',
    fontSize: 11,
    color: colors.success,
    marginTop: 2,
  },
});
