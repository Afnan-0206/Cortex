import React from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { colors } from '../theme';
import { CortexButton } from './CortexButton';

export interface CortexVictoryDefeatViewProps {
  isWinner: boolean;
  userScore: number;
  opponentScore: number;
  userName?: string;
  opponentName?: string;
  userAccuracy?: number;
  opponentAccuracy?: number;
  userAvgSpeedSeconds?: number;
  opponentAvgSpeedSeconds?: number;
  userStreak?: number;
  opponentStreak?: number;
  earnedXP?: number;
  earnedCoins?: number;
  onPlayNext: () => void;
  onExit: () => void;
}

export const CortexVictoryDefeatView: React.FC<CortexVictoryDefeatViewProps> = ({
  isWinner,
  userScore,
  opponentScore,
  userName = 'Afnan',
  opponentName = 'Riya',
  userAccuracy = 85,
  opponentAccuracy = 75,
  userAvgSpeedSeconds = 1.8,
  opponentAvgSpeedSeconds = 2.4,
  userStreak = 5,
  opponentStreak = 3,
  earnedXP = 120,
  earnedCoins = 25,
  onPlayNext,
  onExit,
}) => {
  const totalCombined = (userScore + opponentScore) || 1;
  const userRatio = Math.min(95, Math.max(5, Math.round((userScore / totalCombined) * 100)));
  const oppRatio = 100 - userRatio;

  return (
    <View style={styles.container}>
      {/* Top Close Button */}
      <View style={styles.topBar}>
        <Pressable style={styles.closeBtn} onPress={onExit}>
          <MaterialCommunityIcons name="close" size={24} color={colors.textSecondary} />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* ── 1. TOP HERO BANNER (GOLD FOR WIN, SILVER FOR LOSS) ── */}
        <LinearGradient
          colors={
            isWinner
              ? ['#fffbeb', '#fef3c7', '#fde68a']
              : ['#f8fafc', '#f1f5f9', '#e2e8f0']
          }
          style={styles.heroBanner}
        >
          <View style={styles.meshContainer}>
            <View style={[styles.meshTriangle, isWinner ? styles.meshTriangleWin : styles.meshTriangleLoss]} />
          </View>

          <View style={styles.bannerRow}>
            <View style={styles.bannerLeft}>
              <Text style={[styles.victoryTitle, isWinner ? styles.titleWin : styles.titleLoss]}>
                {isWinner ? 'VICTORY' : 'DEFEAT'}
              </Text>
              
              <Text style={styles.victorySub}>
                {isWinner ? 'Challenge Completed Successfully!' : 'Better Luck Next Time!'}
              </Text>

              {isWinner ? (
                <View style={styles.coinsRow}>
                  <MaterialCommunityIcons name="database" size={16} color="#d97706" />
                  <Text style={styles.coinsText}>Earned {earnedCoins} Coins • +{earnedXP} XP</Text>
                </View>
              ) : (
                <View style={styles.boostRow}>
                  <Text style={styles.boostText}>Practice in Cognitive Quests ›</Text>
                </View>
              )}

              <Pressable
                style={[styles.bannerCta, isWinner ? styles.bannerCtaWin : styles.bannerCtaLoss]}
                onPress={onPlayNext}
              >
                <Text style={styles.bannerCtaText}>
                  {isWinner ? 'Show Off' : 'Try Again'}
                </Text>
              </Pressable>
            </View>

            <View style={styles.bannerRight}>
              {isWinner ? (
                <View style={styles.trophyWrapper}>
                  <MaterialCommunityIcons name="creation" size={24} color="#f59e0b" style={styles.sparkleTopLeft} />
                  <MaterialCommunityIcons name="creation" size={20} color="#fbbf24" style={styles.sparkleBottomRight} />

                  <View style={styles.goldTrophyBase}>
                    <MaterialCommunityIcons name="trophy" size={90} color="#f59e0b" />
                    <View style={styles.trophyStarBadge}>
                      <MaterialCommunityIcons name="star" size={20} color="#ffffff" />
                    </View>
                  </View>
                </View>
              ) : (
                <View style={styles.trophyWrapperLoss}>
                  <View style={styles.silverTrophyBase}>
                    <MaterialCommunityIcons name="trophy-outline" size={86} color="#94a3b8" />
                  </View>
                </View>
              )}
            </View>
          </View>
        </LinearGradient>

        {/* ── 2. DATA COMPARISON SECTION ── */}
        <View style={styles.dataComparisonSection}>
          <Text style={styles.sectionHeaderTitle}>Data Comparison</Text>

          {/* Avatars & Score Header */}
          <View style={styles.comparisonCard}>
            <View style={styles.playersRow}>
              <View style={styles.playerProfile}>
                <View style={styles.avatarCircleBlue}>
                  <MaterialCommunityIcons name="account" size={32} color="#3b82f6" />
                </View>
                <Text style={styles.playerNameText}>{userName}</Text>
              </View>

              <Text style={styles.totalScoreLabel}>Score / Correct</Text>

              <View style={styles.playerProfile}>
                <View style={styles.avatarCircleRed}>
                  <MaterialCommunityIcons name="account" size={32} color="#ef4444" />
                </View>
                <Text style={styles.playerNameText}>{opponentName}</Text>
              </View>
            </View>

            {/* Big Score Numbers */}
            <View style={styles.scoresRow}>
              <Text style={styles.blueScoreText}>{userScore}</Text>
              <Text style={styles.redScoreText}>{opponentScore}</Text>
            </View>

            {/* Dual Color Comparison Progress Bar */}
            <View style={styles.dualBarTrack}>
              <View style={[styles.blueBarFill, { width: `${userRatio}%` }]} />
              <View style={styles.barDivider} />
              <View style={[styles.redBarFill, { width: `${oppRatio}%` }]} />
            </View>
          </View>

          {/* Detailed Performance Metric Cards */}
          <View style={styles.metricsCard}>
            {/* Speed Metric */}
            <View style={styles.metricRow}>
              <Text style={styles.metricLabel}>AVG TIME PER QUESTION</Text>
              <View style={styles.metricValuesRow}>
                <Text style={styles.blueMetricText}>{userAvgSpeedSeconds}s</Text>
                <Text style={styles.redMetricText}>{opponentAvgSpeedSeconds}s</Text>
              </View>
              <View style={styles.dualBarTrackSub}>
                <View style={[styles.blueBarFillSub, { width: `${Math.max(10, Math.min(90, (5 - userAvgSpeedSeconds) * 20))}%` }]} />
                <View style={styles.barDivider} />
                <View style={[styles.redBarFillSub, { width: `${Math.max(10, Math.min(90, (5 - opponentAvgSpeedSeconds) * 20))}%` }]} />
              </View>
            </View>

            {/* Accuracy Metric */}
            <View style={styles.metricRow}>
              <Text style={styles.metricLabel}>ACCURACY</Text>
              <View style={styles.metricValuesRow}>
                <Text style={styles.blueMetricText}>{userAccuracy}%</Text>
                <Text style={styles.redMetricText}>{opponentAccuracy}%</Text>
              </View>
              <View style={styles.dualBarTrackSub}>
                <View style={[styles.blueBarFillSub, { width: `${Math.max(10, userAccuracy)}%` }]} />
                <View style={styles.barDivider} />
                <View style={[styles.redBarFillSub, { width: `${Math.max(10, opponentAccuracy)}%` }]} />
              </View>
            </View>

            {/* Streak Metric */}
            <View style={styles.metricRowLast}>
              <Text style={styles.metricLabel}>MAX STREAK</Text>
              <View style={styles.metricValuesRow}>
                <Text style={styles.blueMetricText}>{userStreak} 🔥</Text>
                <Text style={styles.redMetricText}>{opponentStreak} 🔥</Text>
              </View>
              <View style={styles.dualBarTrackSub}>
                <View style={[styles.blueBarFillSub, { width: `${Math.max(15, Math.min(85, (userStreak / (userStreak + opponentStreak || 1)) * 100))}%` }]} />
                <View style={styles.barDivider} />
                <View style={[styles.redBarFillSub, { width: `${Math.max(15, Math.min(85, (opponentStreak / (userStreak + opponentStreak || 1)) * 100))}%` }]} />
              </View>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Fixed Footer CTAs */}
      <View style={styles.resultsFooter}>
        <CortexButton
          label={isWinner ? "Play Next Match" : "Try Again"}
          onPress={onPlayNext}
          variant="primary"
          style={styles.actionBtn}
        />

        <CortexButton
          label="Back to Arena"
          onPress={onExit}
          variant="secondary"
          style={styles.actionBtn}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0b0d',
  },
  topBar: {
    paddingHorizontal: 20,
    paddingTop: 12,
    alignItems: 'flex-end',
  },
  closeBtn: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },

  scrollContent: {
    paddingBottom: 16,
  },

  heroBanner: {
    marginHorizontal: 16,
    borderRadius: 28,
    padding: 24,
    overflow: 'hidden',
    position: 'relative',
    marginBottom: 20,
  },
  meshContainer: {
    position: 'absolute',
    top: -40,
    right: -40,
    width: 180,
    height: 180,
    opacity: 0.15,
  },
  meshTriangle: {
    width: '100%',
    height: '100%',
    transform: [{ rotate: '45deg' }],
  },
  meshTriangleWin: {
    backgroundColor: '#d97706',
  },
  meshTriangleLoss: {
    backgroundColor: '#475569',
  },

  bannerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  bannerLeft: {
    flex: 1,
    paddingRight: 12,
  },
  victoryTitle: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 34,
    letterSpacing: 1.5,
    marginBottom: 2,
  },
  titleWin: {
    color: '#ea580c',
  },
  titleLoss: {
    color: '#475569',
  },

  victorySub: {
    fontFamily: 'Inter_500Medium',
    fontSize: 15,
    color: '#334155',
    marginBottom: 6,
  },

  coinsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 16,
  },
  coinsText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 13,
    color: '#b45309',
  },

  boostRow: {
    marginBottom: 16,
  },
  boostText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 13,
    color: '#ea580c',
  },

  bannerCta: {
    alignSelf: 'flex-start',
    paddingHorizontal: 22,
    paddingVertical: 10,
    borderRadius: 20,
  },
  bannerCtaWin: {
    backgroundColor: '#84cc16',
  },
  bannerCtaLoss: {
    backgroundColor: '#f97316',
  },
  bannerCtaText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
    color: '#ffffff',
  },

  bannerRight: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  trophyWrapper: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  goldTrophyBase: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  trophyStarBadge: {
    position: 'absolute',
    top: 26,
    backgroundColor: '#d97706',
    borderRadius: 12,
    padding: 3,
  },
  sparkleTopLeft: {
    position: 'absolute',
    top: -10,
    left: -10,
  },
  sparkleBottomRight: {
    position: 'absolute',
    bottom: -6,
    right: -6,
  },

  trophyWrapperLoss: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ rotate: '-18deg' }],
  },
  silverTrophyBase: {
    opacity: 0.85,
  },

  dataComparisonSection: {
    paddingHorizontal: 16,
  },
  sectionHeaderTitle: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 18,
    color: colors.textPrimary,
    marginBottom: 12,
  },

  comparisonCard: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 12,
  },
  playersRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  playerProfile: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  avatarCircleBlue: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
    borderWidth: 2,
    borderColor: '#3b82f6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarCircleRed: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderWidth: 2,
    borderColor: '#ef4444',
    alignItems: 'center',
    justifyContent: 'center',
  },
  playerNameText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 14,
    color: colors.textPrimary,
  },
  totalScoreLabel: {
    fontFamily: 'Inter_500Medium',
    fontSize: 13,
    color: colors.textSecondary,
  },

  scoresRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    paddingHorizontal: 12,
  },
  blueScoreText: {
    fontFamily: 'Inter_600SemiBold',
    fontVariant: ['tabular-nums'],
    fontSize: 36,
    color: '#3b82f6',
  },
  redScoreText: {
    fontFamily: 'Inter_600SemiBold',
    fontVariant: ['tabular-nums'],
    fontSize: 36,
    color: '#ef4444',
  },

  dualBarTrack: {
    height: 10,
    borderRadius: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    flexDirection: 'row',
    overflow: 'hidden',
  },
  blueBarFill: {
    height: '100%',
    backgroundColor: '#3b82f6',
    borderRadius: 5,
  },
  redBarFill: {
    height: '100%',
    backgroundColor: '#ef4444',
    borderRadius: 5,
  },
  barDivider: {
    width: 4,
  },

  metricsCard: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },
  metricRow: {
    marginBottom: 18,
  },
  metricRowLast: {
    marginBottom: 0,
  },
  metricLabel: {
    fontFamily: 'Inter_500Medium',
    fontSize: 11,
    color: colors.textSecondary,
    letterSpacing: 0.5,
    marginBottom: 4,
    textAlign: 'center',
  },
  metricValuesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
    paddingHorizontal: 4,
  },
  blueMetricText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
    color: '#3b82f6',
  },
  redMetricText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
    color: '#ef4444',
  },
  dualBarTrackSub: {
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    flexDirection: 'row',
    overflow: 'hidden',
  },
  blueBarFillSub: {
    height: '100%',
    backgroundColor: '#3b82f6',
    borderRadius: 3,
  },
  redBarFillSub: {
    height: '100%',
    backgroundColor: '#ef4444',
    borderRadius: 3,
  },

  resultsFooter: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.bg,
    gap: 8,
  },
  actionBtn: {
    width: '100%',
  },
});
