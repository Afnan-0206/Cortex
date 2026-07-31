import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../theme';

interface PodiumUser {
  rank: number;
  name: string;
  xp: number;
  delta: string;
}

const TOP_USERS: PodiumUser[] = [
  { rank: 1, name: 'Alex', xp: 2580, delta: '+24' },
  { rank: 2, name: 'Maya', xp: 2410, delta: '+18' },
  { rank: 3, name: 'Ivy', xp: 2320, delta: '+12' },
];

export const PodiumCard: React.FC = () => {
  return (
    <View style={styles.container}>
      {TOP_USERS.map((user) => (
        <View key={user.rank} style={styles.rankRow}>
          <Text style={styles.rankNum}>{user.rank}</Text>
          <Text style={styles.userName}>{user.name}</Text>
          <View style={styles.rightGroup}>
            <Text style={styles.userXp}>{user.xp.toLocaleString()}</Text>
            <Text style={styles.deltaText}>{user.delta}</Text>
          </View>
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    backgroundColor: colors.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 16,
    paddingHorizontal: 20,
    paddingVertical: 4,
  },
  rankRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  rankNum: {
    fontFamily: 'Inter_600SemiBold',
    fontVariant: ['tabular-nums'],
    fontSize: 15,
    color: colors.textPrimary,
    width: 28,
  },
  userName: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 15,
    color: colors.textPrimary,
    flex: 1,
  },
  rightGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  userXp: {
    fontFamily: 'Inter_600SemiBold',
    fontVariant: ['tabular-nums'],
    fontSize: 15,
    color: colors.textPrimary,
  },
  deltaText: {
    fontFamily: 'Inter_500Medium',
    fontVariant: ['tabular-nums'],
    fontSize: 13,
    color: colors.success,
    width: 32,
    textAlign: 'right',
  },
});
