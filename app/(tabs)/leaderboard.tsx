import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

import { colors } from '../../src/theme';
import { CortexCard } from '../../src/components/CortexCard';
import { CortexButton } from '../../src/components/CortexButton';
import { PodiumCard } from '../../src/components/PodiumCard';

interface LeaderboardItem {
  rank: number;
  name: string;
  xp: number;
  avatarInitial: string;
  isUser?: boolean;
}

const LEADERBOARD_LIST: LeaderboardItem[] = [
  { rank: 4, name: 'Lucas', xp: 2280, avatarInitial: 'L' },
  { rank: 5, name: 'Sophia', xp: 2210, avatarInitial: 'S' },
  { rank: 6, name: 'Ethan', xp: 2190, avatarInitial: 'E' },
  { rank: 7, name: 'Chloe', xp: 2150, avatarInitial: 'C' },
  { rank: 8, name: 'Liam', xp: 2120, avatarInitial: 'L' },
  { rank: 9, name: 'Emma', xp: 2090, avatarInitial: 'E' },
  { rank: 10, name: 'Noah', xp: 2070, avatarInitial: 'N' },
  { rank: 14, name: 'You (Afnan)', xp: 2040, avatarInitial: 'A', isUser: true },
  { rank: 15, name: 'Rohan', xp: 2010, avatarInitial: 'R' },
];

export default function LeaderboardScreen() {
  const [tab, setTab] = useState<'weekly' | 'global'>('weekly');
  const [showLegendModal, setShowLegendModal] = useState<boolean>(false);

  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* ── HEADER ── */}
          <View style={styles.headerRow}>
            <View>
              <Text style={styles.caption}>Global League</Text>
              <Text style={styles.title}>Leaderboard</Text>
            </View>

            {/* Segmented Toggle */}
            <View style={styles.toggleTrack}>
              <Pressable
                onPress={() => setTab('weekly')}
                style={[styles.toggleBtn, tab === 'weekly' && styles.toggleBtnActive]}
              >
                <Text style={[styles.toggleText, tab === 'weekly' && styles.toggleTextActive]}>
                  Weekly
                </Text>
              </Pressable>
              <Pressable
                onPress={() => setTab('global')}
                style={[styles.toggleBtn, tab === 'global' && styles.toggleBtnActive]}
              >
                <Text style={[styles.toggleText, tab === 'global' && styles.toggleTextActive]}>
                  Global
                </Text>
              </Pressable>
            </View>
          </View>

          {/* ── SCORING FORMULA LEGEND CARD WITH MODAL TRIGGER ── */}
          <CortexCard
            style={styles.legendCard}
            padding={16}
            onPress={() => setShowLegendModal(true)}
          >
            <View style={styles.legendHeaderRow}>
              <Text style={styles.legendTitle}>Scoring Formula</Text>
              <MaterialCommunityIcons name="help-circle-outline" size={18} color={colors.textSecondary} />
            </View>
            <Text style={styles.legendFormula}>
              Score = Wins × 10 + (Accuracy % × 5) + Streak Bonus
            </Text>
          </CortexCard>

          {/* ── CLEAN TOP RANKINGS LIST ── */}
          <PodiumCard />

          {/* ── RANK LIST ── */}
          <View style={styles.listContainer}>
            {LEADERBOARD_LIST.map((item) => {
              if (item.isUser) return null;

              return (
                <View key={item.rank} style={styles.listItem}>
                  <Text style={styles.rankNumText}>{item.rank}</Text>
                  <View style={styles.listAvatar}>
                    <Text style={styles.listAvatarText}>{item.avatarInitial}</Text>
                  </View>
                  <Text style={styles.listName}>{item.name}</Text>
                  <Text style={styles.listXp}>{item.xp.toLocaleString()} XP</Text>
                </View>
              );
            })}
          </View>
        </ScrollView>

        {/* ── STICKY "YOUR RANK" PANE AT BOTTOM ── */}
        <View style={styles.stickyRankPane}>
          <View style={styles.stickyRow}>
            <Text style={styles.stickyRankNum}>#14</Text>
            <View style={styles.stickyAvatar}>
              <Text style={styles.stickyAvatarText}>A</Text>
            </View>
            <View style={styles.stickyMeta}>
              <Text style={styles.stickyName}>You (Afnan)</Text>
              <Text style={styles.stickySub}>Gold Division • 17d Streak</Text>
            </View>
            <Text style={styles.stickyXp}>2,040 XP</Text>
          </View>
        </View>

        {/* ── HOW RANKING WORKS SCORING MODAL ── */}
        <Modal visible={showLegendModal} transparent animationType="fade">
          <View style={styles.modalOverlay}>
            <CortexCard style={styles.modalContent} padding={24}>
              <Text style={styles.modalTitle}>How Ranking Works</Text>

              <View style={styles.formulaBox}>
                <Text style={styles.formulaText}>
                  Score = Wins × 10 + (Accuracy % × 5) + Streak Bonus
                </Text>
              </View>

              <View style={styles.exampleWrap}>
                <Text style={styles.exampleCaption}>Example Calculation:</Text>
                <Text style={styles.exampleBody}>
                  248 Wins × 10 = 2,480 XP{'\n'}
                  92% Accuracy × 5 = 460 XP{'\n'}
                  50-Day Streak = 100 XP{'\n'}
                  {'\n'}
                  <Text style={styles.exampleTotal}>Total = 3,040 XP</Text>
                </Text>
              </View>

              <CortexButton
                label="Got It"
                onPress={() => setShowLegendModal(false)}
                variant="primary"
                style={styles.modalBtn}
              />
            </CortexCard>
          </View>
        </Modal>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 170,
  },

  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  caption: {
    fontFamily: 'Inter_500Medium',
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  title: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 28,
    color: colors.textPrimary,
    letterSpacing: -0.4,
  },

  toggleTrack: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceAlt,
    borderRadius: 14,
    padding: 3,
    borderWidth: 1,
    borderColor: colors.border,
  },
  toggleBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  toggleBtnActive: {
    backgroundColor: colors.surface,
  },
  toggleText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 13,
    color: colors.textSecondary,
  },
  toggleTextActive: {
    color: colors.textPrimary,
  },

  legendCard: {
    marginBottom: 16,
  },
  legendHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  legendTitle: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 12,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  legendFormula: {
    fontFamily: 'Inter_500Medium',
    fontVariant: ['tabular-nums'],
    fontSize: 13,
    color: colors.textPrimary,
  },

  listContainer: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  rankNumText: {
    fontFamily: 'Inter_600SemiBold',
    fontVariant: ['tabular-nums'],
    fontSize: 14,
    color: colors.textSecondary,
    width: 28,
  },
  listAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  listAvatarText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
    color: colors.textPrimary,
  },
  listName: {
    fontFamily: 'Inter_500Medium',
    fontSize: 15,
    color: colors.textPrimary,
    flex: 1,
  },
  listXp: {
    fontFamily: 'Inter_600SemiBold',
    fontVariant: ['tabular-nums'],
    fontSize: 14,
    color: colors.textPrimary,
  },

  stickyRankPane: {
    position: 'absolute',
    bottom: 84,
    left: 16,
    right: 16,
    backgroundColor: colors.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.textPrimary,
    paddingHorizontal: 16,
    paddingVertical: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  stickyRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stickyRankNum: {
    fontFamily: 'Inter_600SemiBold',
    fontVariant: ['tabular-nums'],
    fontSize: 16,
    color: colors.textPrimary,
    width: 32,
  },
  stickyAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.textPrimary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  stickyAvatarText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 16,
    color: colors.textPrimary,
  },
  stickyMeta: {
    flex: 1,
  },
  stickyName: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
    color: colors.textPrimary,
  },
  stickySub: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: colors.textSecondary,
  },
  stickyXp: {
    fontFamily: 'Inter_600SemiBold',
    fontVariant: ['tabular-nums'],
    fontSize: 15,
    color: colors.textPrimary,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  modalContent: {
    width: '100%',
  },
  modalTitle: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 22,
    color: colors.textPrimary,
    marginBottom: 16,
  },
  formulaBox: {
    backgroundColor: colors.surfaceAlt,
    padding: 16,
    borderRadius: 14,
    marginBottom: 20,
  },
  formulaText: {
    fontFamily: 'Inter_500Medium',
    fontVariant: ['tabular-nums'],
    fontSize: 14,
    color: colors.textPrimary,
    lineHeight: 20,
  },
  exampleWrap: {
    marginBottom: 24,
  },
  exampleCaption: {
    fontFamily: 'Inter_500Medium',
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 6,
  },
  exampleBody: {
    fontFamily: 'Inter_400Regular',
    fontVariant: ['tabular-nums'],
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 22,
  },
  exampleTotal: {
    fontFamily: 'Inter_600SemiBold',
    color: colors.textPrimary,
  },
  modalBtn: {
    width: '100%',
  },
});
