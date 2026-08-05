import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import Svg, {
  Defs,
  LinearGradient,
  Stop,
  Rect,
  Path,
  Circle,
  G,
  Text as SvgText,
} from 'react-native-svg';
import * as Haptics from 'expo-haptics';

import { colors } from '../../src/theme';
import { executeOptimisticAction } from '../../lib/optimisticManager';

interface OperationPreset {
  id: string;
  name: string;
  desc: string;
  icon: React.ComponentProps<typeof MaterialCommunityIcons>['name'];
  iconBg: string;
  descColor: string;
  cardBg: string;
  borderColor: string;
  customIconText?: string;
}

const OPERATIONS: OperationPreset[] = [
  {
    id: 'addition',
    name: 'Addition',
    desc: 'Add numbers together',
    icon: 'plus',
    iconBg: '#3b82f6',
    descColor: '#60a5fa',
    cardBg: '#0f172a',
    borderColor: '#1e293b',
  },
  {
    id: 'subtraction',
    name: 'Subtraction',
    desc: 'Subtract numbers accurately',
    icon: 'minus',
    iconBg: '#ec4899',
    descColor: '#f472b6',
    cardBg: '#1a0b1c',
    borderColor: '#2e1035',
  },
  {
    id: 'multiplication',
    name: 'Multiplication',
    desc: 'Multiply with speed & precision',
    icon: 'close',
    iconBg: '#22c55e',
    descColor: '#4ade80',
    cardBg: '#0d2216',
    borderColor: '#22c55e',
  },
  {
    id: 'division',
    name: 'Division',
    desc: 'Divide numbers with accuracy',
    icon: 'division',
    iconBg: '#a855f7',
    descColor: '#c084fc',
    cardBg: '#140d24',
    borderColor: '#281746',
  },
  {
    id: 'square_root',
    name: 'Square Root',
    desc: 'Find perfect square roots',
    icon: 'square-root',
    iconBg: '#f59e0b',
    descColor: '#fbbf24',
    cardBg: '#1c150c',
    borderColor: '#382813',
    customIconText: '√x',
  },
  {
    id: 'cube_root',
    name: 'Cube Root',
    desc: 'Find perfect cube roots',
    icon: 'cube-outline',
    iconBg: '#f97316',
    descColor: '#fb923c',
    cardBg: '#1d120a',
    borderColor: '#3b2010',
  },
];

const DIGIT_OPTIONS = ['2d', '3d', '4d', '6d', '8d', '12d', '16d'];

interface FeedPost {
  id: string;
  author: string;
  verifiedColor: string;
  badgeBg: string;
  title: string;
  timeAgo: string;
  likes: number;
  comments: number;
  isLiked: boolean;
  isSaved: boolean;
  cardBg: string;
  borderColor: string;
}

export default function NetsScreen() {
  const [selectedOp, setSelectedOp] = useState<string>('multiplication');
  const [selectedDigit, setSelectedDigit] = useState<string>('3d');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Practice Modal State
  const [isPracticing, setIsPracticing] = useState<boolean>(false);
  const [problem, setProblem] = useState<{ p: string; a: number }>({ p: '48 × 7', a: 336 });
  const [showAnswer, setShowAnswer] = useState<boolean>(false);

  // Feed Posts State
  const [feedPosts, setFeedPosts] = useState<FeedPost[]>([
    {
      id: 'post_1',
      author: '@afnan_mst',
      verifiedColor: '#3b82f6',
      badgeBg: '#1e3a8a',
      title: 'Cleared 20 Sprint Math problems in 48s! ⚡',
      timeAgo: '12m ago',
      likes: 42,
      comments: 8,
      isLiked: false,
      isSaved: false,
      cardBg: '#0f172a',
      borderColor: '#1e3a8a',
    },
    {
      id: 'post_2',
      author: '@edrah_logic',
      verifiedColor: '#a855f7',
      badgeBg: '#581c87',
      title: 'Pattern Forge Level 14 solved with 100% accuracy! 🎯',
      timeAgo: '1h ago',
      likes: 89,
      comments: 16,
      isLiked: true,
      isSaved: false,
      cardBg: '#180b24',
      borderColor: '#581c87',
    },
  ]);

  const currentOpConfig = OPERATIONS.find((op) => op.id === selectedOp) || OPERATIONS[2];

  const generateProblem = (opId: string, digitStr: string) => {
    const digits = parseInt(digitStr.replace('d', ''), 10) || 3;
    const max = Math.pow(10, Math.min(digits, 4)) - 1;
    const min = Math.pow(10, Math.max(1, Math.min(digits - 1, 3)));
    const n1 = Math.floor(Math.random() * (max - min) + min);
    const n2 = Math.floor(Math.random() * 9 + 2);

    if (opId === 'addition') return { p: `${n1} + ${n2 * 12}`, a: n1 + n2 * 12 };
    if (opId === 'subtraction') return { p: `${n1} - ${n2 * 4}`, a: n1 - n2 * 4 };
    if (opId === 'division') return { p: `${n1 * n2} ÷ ${n2}`, a: n1 };
    if (opId === 'square_root') return { p: `√${n2 * n2}`, a: n2 };
    if (opId === 'cube_root') return { p: `³√${n2 * n2 * n2}`, a: n2 };
    return { p: `${n1} × ${n2}`, a: n1 * n2 };
  };

  const handleStartPractice = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setProblem(generateProblem(selectedOp, selectedDigit));
    setShowAnswer(false);
    setIsPracticing(true);
  };

  const handleOptimisticLike = async (postId: string) => {
    Haptics.selectionAsync();
    const post = feedPosts.find((p) => p.id === postId);
    if (!post) return;

    const previousPosts = [...feedPosts];
    const optimisticPosts = feedPosts.map((p) =>
      p.id === postId
        ? { ...p, isLiked: !p.isLiked, likes: p.isLiked ? p.likes - 1 : p.likes + 1 }
        : p
    );

    await executeOptimisticAction({
      actionName: 'Like Post',
      previousState: previousPosts,
      optimisticState: optimisticPosts,
      applyState: setFeedPosts,
      serverTask: async () => {
        await new Promise((resolve) => setTimeout(resolve, 300));
      },
      onRollbackError: (msg) => {
        setToastMessage(msg);
        setTimeout(() => setToastMessage(null), 3000);
      },
    });
  };

  const handleOptimisticSave = async (postId: string) => {
    Haptics.selectionAsync();
    const post = feedPosts.find((p) => p.id === postId);
    if (!post) return;

    const previousPosts = [...feedPosts];
    const optimisticPosts = feedPosts.map((p) =>
      p.id === postId ? { ...p, isSaved: !p.isSaved } : p
    );

    await executeOptimisticAction({
      actionName: 'Save Post',
      previousState: previousPosts,
      optimisticState: optimisticPosts,
      applyState: setFeedPosts,
      serverTask: async () => {
        await new Promise((resolve) => setTimeout(resolve, 300));
      },
      onRollbackError: (msg) => {
        setToastMessage(msg);
        setTimeout(() => setToastMessage(null), 3000);
      },
    });
  };

  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        {/* Toast error banner if optimistic rollback occurs */}
        {toastMessage && (
          <View style={styles.toastBanner}>
            <MaterialCommunityIcons name="alert-circle-outline" size={16} color="#ef4444" />
            <Text style={styles.toastText}>{toastMessage}</Text>
          </View>
        )}

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* ── TOP HEADER SECTION ── */}
          <View style={styles.headerRow}>
            <View style={styles.headerLeft}>
              <View style={styles.subTagRow}>
                <MaterialCommunityIcons name="sprout-outline" size={16} color="#84cc16" />
                <Text style={styles.subTagText}>Practice Nets & Feed</Text>
              </View>

              <Text style={styles.mainTitle}>
                Custom <Text style={styles.gradientTitleText}>Presets</Text>
              </Text>

              <Text style={styles.headerSubtitle}>
                Offline-ready training mode. Configure 2 to 16 digit calculations.
              </Text>
            </View>

            {/* 3D Glowing Math Cube Graphic */}
            <View style={styles.headerGraphicContainer}>
              <Svg width={110} height={110} viewBox="0 0 110 110" fill="none">
                <Defs>
                  <LinearGradient id="cubeGlow" x1="0" y1="0" x2="110" y2="110">
                    <Stop offset="0%" stopColor="#818cf8" stopOpacity="0.8" />
                    <Stop offset="50%" stopColor="#c084fc" stopOpacity="0.6" />
                    <Stop offset="100%" stopColor="#38bdf8" stopOpacity="0.9" />
                  </LinearGradient>
                  <LinearGradient id="cubeFaceTop" x1="20" y1="20" x2="80" y2="50">
                    <Stop offset="0%" stopColor="#6366f1" />
                    <Stop offset="100%" stopColor="#a855f7" />
                  </LinearGradient>
                  <LinearGradient id="cubeFaceLeft" x1="20" y1="50" x2="50" y2="90">
                    <Stop offset="0%" stopColor="#4f46e5" />
                    <Stop offset="100%" stopColor="#3b82f6" />
                  </LinearGradient>
                  <LinearGradient id="cubeFaceRight" x1="50" y1="50" x2="80" y2="90">
                    <Stop offset="0%" stopColor="#7c3aed" />
                    <Stop offset="100%" stopColor="#0284c7" />
                  </LinearGradient>
                </Defs>

                {/* Aura rings */}
                <Circle cx="55" cy="55" r="45" stroke="#a855f7" strokeWidth="1" strokeDasharray="3 4" opacity="0.4" />
                <Circle cx="55" cy="55" r="38" stroke="#38bdf8" strokeWidth="1.5" opacity="0.6" />

                {/* Floating Orbit Symbols */}
                <SvgText x="14" y="28" fill="#c084fc" fontSize="12" fontWeight="bold">√</SvgText>
                <SvgText x="92" y="24" fill="#60a5fa" fontSize="11" fontWeight="bold">∫</SvgText>
                <SvgText x="10" y="82" fill="#38bdf8" fontSize="12" fontWeight="bold">Σ</SvgText>
                <SvgText x="92" y="88" fill="#a855f7" fontSize="12" fontWeight="bold">π</SvgText>

                {/* 3D Cube Path */}
                {/* Top face */}
                <Path d="M55 24 L84 39 L55 54 L26 39 Z" fill="url(#cubeFaceTop)" stroke="#a5b4fc" strokeWidth="1" />
                {/* Left face */}
                <Path d="M26 39 L55 54 L55 86 L26 71 Z" fill="url(#cubeFaceLeft)" stroke="#818cf8" strokeWidth="1" />
                {/* Right face */}
                <Path d="M55 54 L84 39 L84 71 L55 86 Z" fill="url(#cubeFaceRight)" stroke="#c084fc" strokeWidth="1" />

                {/* Cube Face Symbols */}
                <SvgText x="51" y="42" fill="#ffffff" fontSize="15" fontWeight="bold">+</SvgText>
                <SvgText x="68" y="42" fill="#ffffff" fontSize="13" fontWeight="bold">×</SvgText>
                <SvgText x="36" y="66" fill="#ffffff" fontSize="14" fontWeight="bold">+</SvgText>
                <SvgText x="43" y="77" fill="#ffffff" fontSize="14" fontWeight="bold">×</SvgText>
                <SvgText x="66" y="65" fill="#ffffff" fontSize="15" fontWeight="bold">=</SvgText>
                <SvgText x="66" y="78" fill="#ffffff" fontSize="13" fontWeight="bold">π</SvgText>
              </Svg>
            </View>
          </View>

          {/* ── 1. SELECT OPERATION SECTION ── */}
          <View style={styles.sectionHeaderRow}>
            <View style={[styles.sectionBar, { backgroundColor: '#22c55e' }]} />
            <Text style={styles.sectionTitleText}>Select Operation</Text>
          </View>

          <View style={styles.operationsGrid}>
            {OPERATIONS.map((op) => {
              const isSelected = selectedOp === op.id;

              return (
                <Pressable
                  key={op.id}
                  onPress={() => {
                    Haptics.selectionAsync();
                    setSelectedOp(op.id);
                  }}
                  style={[
                    styles.opCard,
                    { backgroundColor: op.cardBg, borderColor: isSelected ? '#22c55e' : op.borderColor },
                    isSelected && styles.opCardSelected,
                  ]}
                >
                  {/* Top Right Checkmark Badge for Selected Card */}
                  {isSelected && (
                    <View style={styles.selectedBadgeCircle}>
                      <MaterialCommunityIcons name="check" size={12} color="#ffffff" />
                    </View>
                  )}

                  {/* Icon Square Container */}
                  <View style={[styles.opIconSquare, { backgroundColor: op.iconBg }]}>
                    {op.customIconText ? (
                      <Text style={styles.customIconTextStr}>{op.customIconText}</Text>
                    ) : (
                      <MaterialCommunityIcons name={op.icon} size={20} color="#ffffff" />
                    )}
                  </View>

                  <Text style={styles.opTitle}>{op.name}</Text>
                  <Text style={[styles.opDesc, { color: isSelected ? '#4ade80' : op.descColor }]}>
                    {op.desc}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {/* ── 2. DIGIT LENGTH CONFIGURATION ── */}
          <View style={styles.digitHeaderRow}>
            <Text style={styles.digitHeaderTitle}>
              Digit Length ({selectedDigit.replace('d', '')} Digits)
            </Text>
            <MaterialCommunityIcons name="information-outline" size={16} color="#64748b" />
          </View>

          <View style={styles.digitTrackContainer}>
            {DIGIT_OPTIONS.map((digit) => {
              const isSelected = selectedDigit === digit;
              return (
                <Pressable
                  key={digit}
                  onPress={() => {
                    Haptics.selectionAsync();
                    setSelectedDigit(digit);
                  }}
                  style={[styles.digitPillItem, isSelected && styles.digitPillSelected]}
                >
                  <Text style={[styles.digitPillText, isSelected && styles.digitPillTextSelected]}>
                    {digit}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {/* ── 3. START PRACTICE ACTION CTA ── */}
          <Pressable onPress={handleStartPractice} style={styles.startCtaBtn}>
            <View style={styles.startCtaContent}>
              <MaterialCommunityIcons name="flash" size={20} color="#052e16" />
              <Text style={styles.startCtaLabel}>
                START {currentOpConfig.name.toUpperCase()} PRACTICE
              </Text>
            </View>
            <View style={styles.startCtaArrowCircle}>
              <MaterialCommunityIcons name="arrow-right" size={16} color="#ffffff" />
            </View>
          </Pressable>

          {/* ── 4. COMMUNITY BROADCASTS SECTION ── */}
          <View style={[styles.sectionHeaderRow, { marginTop: 32 }]}>
            <View style={[styles.sectionBar, { backgroundColor: '#a855f7' }]} />
            <Text style={styles.sectionTitleText}>Community Broadcasts</Text>
            <View style={styles.viewAllWrap}>
              <Text style={styles.viewAllText}>View All</Text>
              <MaterialCommunityIcons name="chevron-right" size={16} color="#94a3b8" />
            </View>
          </View>

          <View style={styles.feedListContainer}>
            {feedPosts.map((post) => (
              <View
                key={post.id}
                style={[
                  styles.broadcastCard,
                  { backgroundColor: post.cardBg, borderColor: post.borderColor },
                ]}
              >
                <View style={styles.broadcastHeader}>
                  {/* Hexagon Avatar Badge */}
                  <View style={[styles.hexAvatar, { backgroundColor: post.badgeBg }]}>
                    <MaterialCommunityIcons name="cube-outline" size={18} color="#ffffff" />
                  </View>

                  <View style={styles.broadcastAuthorMeta}>
                    <View style={styles.authorRow}>
                      <Text style={[styles.authorHandle, { color: post.verifiedColor }]}>
                        {post.author}
                      </Text>
                      <MaterialCommunityIcons
                        name="check-decagram"
                        size={14}
                        color={post.verifiedColor}
                      />
                    </View>
                    <Text style={styles.broadcastTime}>{post.timeAgo}</Text>
                  </View>
                </View>

                {/* Broadcast Content Body */}
                <Text style={styles.broadcastTitle}>{post.title}</Text>

                {/* Broadcast Action Row */}
                <View style={styles.broadcastActionRow}>
                  {/* Like Button */}
                  <Pressable
                    onPress={() => handleOptimisticLike(post.id)}
                    style={styles.broadcastActionBtn}
                  >
                    <MaterialCommunityIcons
                      name={post.isLiked ? 'heart' : 'heart-outline'}
                      size={18}
                      color={post.isLiked ? '#ec4899' : '#94a3b8'}
                    />
                    <Text
                      style={[
                        styles.broadcastActionText,
                        post.isLiked && { color: '#ec4899' },
                      ]}
                    >
                      {post.likes}
                    </Text>
                  </Pressable>

                  {/* Comment Count */}
                  <View style={styles.broadcastActionBtn}>
                    <MaterialCommunityIcons name="message-outline" size={17} color="#94a3b8" />
                    <Text style={styles.broadcastActionText}>{post.comments}</Text>
                  </View>

                  {/* Save Bookmark */}
                  <Pressable
                    onPress={() => handleOptimisticSave(post.id)}
                    style={styles.broadcastActionBtn}
                  >
                    <MaterialCommunityIcons
                      name={post.isSaved ? 'bookmark' : 'bookmark-outline'}
                      size={17}
                      color={post.isSaved ? '#84cc16' : '#94a3b8'}
                    />
                    <Text
                      style={[
                        styles.broadcastActionText,
                        post.isSaved && { color: '#84cc16' },
                      ]}
                    >
                      {post.isSaved ? 'Saved' : 'Save'}
                    </Text>
                  </Pressable>
                </View>
              </View>
            ))}
          </View>
        </ScrollView>

        {/* ── PRACTICE MODE MODAL ── */}
        <Modal visible={isPracticing} animationType="slide" transparent>
          <View style={styles.modalOverlay}>
            <View style={styles.practiceCardBox}>
              <View style={styles.practiceHeaderRow}>
                <Text style={styles.practiceCategoryTitle}>
                  {currentOpConfig.name} Practice ({selectedDigit})
                </Text>
                <Pressable onPress={() => setIsPracticing(false)}>
                  <MaterialCommunityIcons name="close" size={22} color="#94a3b8" />
                </Pressable>
              </View>

              <Text style={styles.targetLabel}>Target Problem</Text>
              <Text style={styles.problemDisplay}>{problem.p}</Text>

              <Pressable
                onPress={() => {
                  Haptics.selectionAsync();
                  setShowAnswer((prev) => !prev);
                }}
                style={styles.revealAnswerBtn}
              >
                <MaterialCommunityIcons
                  name={showAnswer ? 'eye-off-outline' : 'eye-outline'}
                  size={18}
                  color="#22c55e"
                />
                <Text style={styles.revealAnswerText}>
                  {showAnswer ? `Answer: ${problem.a}` : 'Tap to Reveal Answer'}
                </Text>
              </Pressable>

              <View style={styles.practiceModalActions}>
                <Pressable
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setProblem(generateProblem(selectedOp, selectedDigit));
                    setShowAnswer(false);
                  }}
                  style={styles.nextProblemBtn}
                >
                  <Text style={styles.nextProblemText}>Next Problem</Text>
                  <MaterialCommunityIcons name="arrow-right" size={18} color="#000000" />
                </Pressable>

                <Pressable
                  onPress={() => setIsPracticing(false)}
                  style={styles.exitPracticeBtn}
                >
                  <Text style={styles.exitPracticeText}>Exit Practice</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#0b0c10',
  },
  safeArea: {
    flex: 1,
  },
  toastBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#2d1416',
    borderColor: '#ef4444',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginHorizontal: 20,
    marginTop: 10,
  },
  toastText: {
    fontFamily: 'Inter_500Medium',
    color: '#ef4444',
    fontSize: 12,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 120,
  },

  /* Header Section */
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  headerLeft: {
    flex: 1,
    paddingRight: 10,
  },
  subTagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  subTagText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 13,
    color: '#84cc16',
  },
  mainTitle: {
    fontFamily: 'Outfit_700Bold',
    fontSize: 32,
    color: '#ffffff',
    letterSpacing: -0.5,
    lineHeight: 38,
  },
  gradientTitleText: {
    color: '#c084fc',
  },
  headerSubtitle: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13.5,
    color: '#94a3b8',
    marginTop: 6,
    lineHeight: 19,
  },
  headerGraphicContainer: {
    width: 105,
    height: 105,
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* Section Header */
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 14,
  },
  sectionBar: {
    width: 3,
    height: 18,
    borderRadius: 2,
  },
  sectionTitleText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 16,
    color: '#f8fafc',
    flex: 1,
  },
  viewAllWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  viewAllText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 13,
    color: '#94a3b8',
  },

  /* Operations Grid */
  operationsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 10,
    marginBottom: 24,
  },
  opCard: {
    width: '31.5%',
    borderRadius: 16,
    borderWidth: 1,
    padding: 12,
    position: 'relative',
    minHeight: 124,
    justifyContent: 'space-between',
  },
  opCardSelected: {
    borderWidth: 1.5,
    shadowColor: '#22c55e',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
  },
  selectedBadgeCircle: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#22c55e',
    alignItems: 'center',
    justifyContent: 'center',
  },
  opIconSquare: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  customIconTextStr: {
    fontFamily: 'Outfit_700Bold',
    fontSize: 16,
    color: '#ffffff',
  },
  opTitle: {
    fontFamily: 'Inter_700Bold',
    fontSize: 13.5,
    color: '#ffffff',
    marginBottom: 2,
  },
  opDesc: {
    fontFamily: 'Inter_400Regular',
    fontSize: 11,
    lineHeight: 14,
  },

  /* Digit Length */
  digitHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
  },
  digitHeaderTitle: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14.5,
    color: '#ffffff',
  },
  digitTrackContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#10131f',
    borderColor: '#1e2436',
    borderWidth: 1,
    borderRadius: 24,
    padding: 4,
    marginBottom: 24,
  },
  digitPillItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 20,
  },
  digitPillSelected: {
    backgroundColor: '#2563eb',
    shadowColor: '#2563eb',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  digitPillText: {
    fontFamily: 'SpaceGrotesk_700Bold',
    fontSize: 13,
    color: '#64748b',
  },
  digitPillTextSelected: {
    color: '#ffffff',
  },

  /* Start Practice CTA */
  startCtaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#22c55e',
    borderRadius: 28,
    height: 56,
    paddingHorizontal: 20,
    shadowColor: '#22c55e',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 8,
    marginBottom: 8,
  },
  startCtaContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  startCtaLabel: {
    fontFamily: 'SpaceGrotesk_700Bold',
    fontSize: 14.5,
    color: '#052e16',
    letterSpacing: 0.5,
  },
  startCtaArrowCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#052e16',
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* Community Broadcasts Feed */
  feedListContainer: {
    gap: 14,
  },
  broadcastCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
  },
  broadcastHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  hexAvatar: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  broadcastAuthorMeta: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  authorHandle: {
    fontFamily: 'Outfit_700Bold',
    fontSize: 14,
  },
  broadcastTime: {
    fontFamily: 'Inter_500Medium',
    fontSize: 11,
    color: '#64748b',
  },
  broadcastTitle: {
    fontFamily: 'Inter_500Medium',
    fontSize: 14.5,
    color: '#f8fafc',
    marginBottom: 14,
    lineHeight: 20,
  },
  broadcastActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
  },
  broadcastActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  broadcastActionText: {
    fontFamily: 'SpaceGrotesk_700Bold',
    fontSize: 12.5,
    color: '#94a3b8',
  },

  /* Modal Overlay */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  practiceCardBox: {
    width: '100%',
    backgroundColor: '#0f172a',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#1e293b',
    padding: 24,
    alignItems: 'center',
  },
  practiceHeaderRow: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  practiceCategoryTitle: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 16,
    color: '#ffffff',
  },
  targetLabel: {
    fontFamily: 'Inter_500Medium',
    fontSize: 13,
    color: '#94a3b8',
    marginBottom: 4,
  },
  problemDisplay: {
    fontFamily: 'Outfit_900Black',
    fontSize: 44,
    color: '#ffffff',
    marginVertical: 12,
  },
  revealAnswerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#0d2216',
    borderWidth: 1,
    borderColor: '#22c55e',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginBottom: 24,
  },
  revealAnswerText: {
    fontFamily: 'SpaceGrotesk_700Bold',
    fontSize: 14,
    color: '#22c55e',
  },
  practiceModalActions: {
    width: '100%',
    gap: 10,
  },
  nextProblemBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#22c55e',
    borderRadius: 16,
    paddingVertical: 14,
  },
  nextProblemText: {
    fontFamily: 'SpaceGrotesk_700Bold',
    fontSize: 15,
    color: '#000000',
  },
  exitPracticeBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
  },
  exitPracticeText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 14,
    color: '#94a3b8',
  },
});
