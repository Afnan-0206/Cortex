import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../theme';

export interface PodiumUser {
  rank: number;
  name: string;
  xp: number;
  delta?: string;
}

interface PodiumCardProps {
  topUsers?: PodiumUser[];
}

export const PodiumCard: React.FC<PodiumCardProps> = ({ topUsers = [] }) => {
  // Ensure top 3 slots are represented
  const slots: PodiumUser[] = [1, 2, 3].map((r) => {
    const found = topUsers.find((u) => u.rank === r) || topUsers[r - 1];
    if (found) {
      return {
        rank: r,
        name: found.name,
        xp: found.xp,
        delta: found.delta || `+${Math.max(10, Math.floor(found.xp / 100))}`,
      };
    }
    return {
      rank: r,
      name: '--',
      xp: 0,
      delta: '+0',
    };
  });

  return (
    <View style={styles.container}>
      <Text style={styles.sectionHeader}>TOP 3 ATHLETES</Text>
      {slots.map((user) => (
        <View key={user.rank} style={styles.rankRow}>
          <Text style={[styles.rankNum, user.rank === 1 && styles.goldRank]}>#{user.rank}</Text>
          <Text style={[styles.userName, user.name === '--' && styles.emptyName]}>
            {user.name}
          </Text>
          <View style={styles.rightGroup}>
            <Text style={styles.userXp}>{user.xp.toLocaleString()} XP</Text>
            {user.xp > 0 && <Text style={styles.deltaText}>{user.delta}</Text>}
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
    paddingVertical: 14,
  },
  sectionHeader: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 11,
    color: colors.textSecondary,
    letterSpacing: 1,
    marginBottom: 8,
  },
  rankRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  rankNum: {
    fontFamily: 'Inter_600SemiBold',
    fontVariant: ['tabular-nums'],
    fontSize: 15,
    color: colors.textPrimary,
    width: 32,
  },
  goldRank: {
    color: '#facc15',
  },
  userName: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 15,
    color: colors.textPrimary,
    flex: 1,
  },
  emptyName: {
    color: colors.textSecondary,
    fontStyle: 'italic',
  },
  rightGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  userXp: {
    fontFamily: 'Inter_600SemiBold',
    fontVariant: ['tabular-nums'],
    fontSize: 14,
    color: colors.textPrimary,
  },
  deltaText: {
    fontFamily: 'Inter_500Medium',
    fontVariant: ['tabular-nums'],
    fontSize: 12,
    color: colors.success,
    width: 32,
    textAlign: 'right',
  },
});
