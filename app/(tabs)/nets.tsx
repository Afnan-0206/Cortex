import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

import { colors } from '../../src/theme';
import { CortexCard } from '../../src/components/CortexCard';
import { CortexButton } from '../../src/components/CortexButton';
import { executeOptimisticAction } from '../../lib/optimisticManager';

interface Preset {
  id: string;
  name: string;
  op: string;
  digits: number;
}

interface FeedPost {
  id: string;
  author: string;
  title: string;
  timeAgo: string;
  likes: number;
  isLiked: boolean;
  isSaved: boolean;
}

export default function NetsScreen() {
  const [selectedOp, setSelectedOp] = useState<string>('multiplication');
  const [digitCount, setDigitCount] = useState<number>(3);
  const [isPracticing, setIsPracticing] = useState<boolean>(false);
  const [showAnswer, setShowAnswer] = useState<boolean>(false);
  const [problem, setProblem] = useState<{ p: string; a: number }>({ p: '48 × 7', a: 336 });

  // Rollback Toast Banner State
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Community Feed Posts State
  const [feedPosts, setFeedPosts] = useState<FeedPost[]>([
    {
      id: 'post_1',
      author: '@afnan_math',
      title: 'Cleared 20 Sprint Math problems in 48s! ⚡',
      timeAgo: '12m ago',
      likes: 42,
      isLiked: false,
      isSaved: false,
    },
    {
      id: 'post_2',
      author: '@sarah_logic',
      title: 'Pattern Forge Level 14 solved with 100% accuracy! 🎯',
      timeAgo: '1h ago',
      likes: 89,
      isLiked: true,
      isSaved: false,
    },
  ]);

  const presets = [
    { id: 'addition', name: 'Addition', icon: 'plus-box-outline' },
    { id: 'subtraction', name: 'Subtraction', icon: 'minus-box-outline' },
    { id: 'multiplication', name: 'Multiplication', icon: 'close-box-outline' },
    { id: 'division', name: 'Division', icon: 'division-box' },
    { id: 'square_root', name: 'Square Root', icon: 'square-root' },
    { id: 'cube_root', name: 'Cube Root', icon: 'cube-outline' },
  ];

  const generateProblem = (op: string, digits: number) => {
    const max = Math.pow(10, digits) - 1;
    const min = Math.pow(10, digits - 1);
    const n1 = Math.floor(Math.random() * (max - min) + min);
    const n2 = Math.floor(Math.random() * 9 + 2);

    if (op === 'addition') return { p: `${n1} + ${n2 * 10}`, a: n1 + n2 * 10 };
    if (op === 'subtraction') return { p: `${n1} - ${n2 * 5}`, a: n1 - n2 * 5 };
    if (op === 'division') return { p: `${n1 * n2} ÷ ${n2}`, a: n1 };
    if (op === 'square_root') return { p: `√${n2 * n2}`, a: n2 };
    if (op === 'cube_root') return { p: `³√${n2 * n2 * n2}`, a: n2 };
    return { p: `${n1} × ${n2}`, a: n1 * n2 };
  };

  const handleStartPractice = () => {
    setProblem(generateProblem(selectedOp, digitCount));
    setShowAnswer(false);
    setIsPracticing(true);
  };

  // Optimistic Like Action Handler with Rollback
  const handleOptimisticLike = async (postId: string) => {
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
        // Simulate background server sync
        await new Promise((resolve) => setTimeout(resolve, 400));
      },
      onRollbackError: (msg) => {
        setToastMessage(msg);
        setTimeout(() => setToastMessage(null), 3000);
      },
    });
  };

  // Optimistic Bookmark Action Handler with Rollback
  const handleOptimisticSave = async (postId: string) => {
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
        // Simulate background server sync
        await new Promise((resolve) => setTimeout(resolve, 400));
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
        {/* Rollback Toast Notification Banner */}
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
          {/* ── HEADER ── */}
          <View style={styles.header}>
            <Text style={styles.caption}>Practice Nets & Feed</Text>
            <Text style={styles.title}>Custom Presets</Text>
            <Text style={styles.subtitle}>
              Offline-ready training mode. Configure 2 to 16 digit calculations.
            </Text>
          </View>

          {isPracticing ? (
            <CortexCard style={styles.practiceCard} padding={24}>
              <Text style={styles.practiceHeader}>Target Problem</Text>
              <Text style={styles.problemText}>{problem.p}</Text>

              <Pressable
                onPress={() => setShowAnswer((prev) => !prev)}
                style={styles.revealBtn}
              >
                <MaterialCommunityIcons
                  name={showAnswer ? 'eye-off-outline' : 'eye-outline'}
                  size={16}
                  color={colors.accent}
                />
                <Text style={styles.answerHint}>
                  {showAnswer ? `Answer: ${problem.a}` : 'Tap to Reveal Answer'}
                </Text>
              </Pressable>

              <View style={styles.practiceActions}>
                <CortexButton
                  label="Next Problem"
                  onPress={() => {
                    setProblem(generateProblem(selectedOp, digitCount));
                    setShowAnswer(false);
                  }}
                  variant="primary"
                />
                <CortexButton
                  label="Exit Practice"
                  onPress={() => setIsPracticing(false)}
                  variant="ghost"
                  style={styles.exitBtn}
                />
              </View>
            </CortexCard>
          ) : (
            <>
              {/* ── OPERATION PRESETS ── */}
              <Text style={styles.sectionTitle}>Select Operation</Text>
              <View style={styles.presetsGrid}>
                {presets.map((item) => {
                  const isSelected = selectedOp === item.id;
                  return (
                    <Pressable
                      key={item.id}
                      onPress={() => setSelectedOp(item.id)}
                      style={[styles.presetCard, isSelected && styles.presetCardSelected]}
                    >
                      <MaterialCommunityIcons
                        name={item.icon as any}
                        size={24}
                        color={isSelected ? colors.textPrimary : colors.textSecondary}
                      />
                      <Text style={[styles.presetName, isSelected && styles.presetNameSelected]}>
                        {item.name}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              {/* ── DIGIT CONFIGURATION ── */}
              <Text style={styles.sectionTitle}>Digit Length ({digitCount} Digits)</Text>
              <CortexCard style={styles.digitCard} padding={16}>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.digitRow}
                >
                  {[2, 3, 4, 6, 8, 12, 16].map((num) => (
                    <Pressable
                      key={num}
                      onPress={() => setDigitCount(num)}
                      style={[styles.digitPill, digitCount === num && styles.digitPillSelected]}
                    >
                      <Text style={[styles.digitText, digitCount === num && styles.digitTextSelected]}>
                        {num}d
                      </Text>
                    </Pressable>
                  ))}
                </ScrollView>
              </CortexCard>

              {/* ── START PRACTICE CTA ── */}
              <CortexButton
                label={`Start ${presets.find((p) => p.id === selectedOp)?.name} Practice`}
                onPress={handleStartPractice}
                variant="primary"
                style={styles.startCta}
              />

              {/* ── COMMUNITY BROADCASTS (OPTIMISTIC LIKES & SAVES) ── */}
              <Text style={[styles.sectionTitle, { marginTop: 28 }]}>Community Broadcasts</Text>
              <View style={styles.feedList}>
                {feedPosts.map((post) => (
                  <View key={post.id} style={styles.postCard}>
                    <View style={styles.postHeaderRow}>
                      <Text style={styles.postAuthor}>{post.author}</Text>
                      <Text style={styles.postTime}>{post.timeAgo}</Text>
                    </View>
                    <Text style={styles.postTitle}>{post.title}</Text>

                    <View style={styles.postActionsRow}>
                      {/* Optimistic Heart Button */}
                      <Pressable
                        style={styles.actionBtn}
                        onPress={() => handleOptimisticLike(post.id)}
                      >
                        <MaterialCommunityIcons
                          name={post.isLiked ? 'heart' : 'heart-outline'}
                          size={18}
                          color={post.isLiked ? '#ef4444' : '#9ca3af'}
                        />
                        <Text style={[styles.actionText, post.isLiked && { color: '#ef4444' }]}>
                          {post.likes}
                        </Text>
                      </Pressable>

                      {/* Optimistic Bookmark Button */}
                      <Pressable
                        style={styles.actionBtn}
                        onPress={() => handleOptimisticSave(post.id)}
                      >
                        <MaterialCommunityIcons
                          name={post.isSaved ? 'bookmark' : 'bookmark-outline'}
                          size={18}
                          color={post.isSaved ? '#84cc16' : '#9ca3af'}
                        />
                        <Text style={[styles.actionText, post.isSaved && { color: '#84cc16' }]}>
                          {post.isSaved ? 'Saved' : 'Save'}
                        </Text>
                      </Pressable>
                    </View>
                  </View>
                ))}
              </View>
            </>
          )}
        </ScrollView>
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
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 110,
  },

  header: {
    marginBottom: 24,
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
  subtitle: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 4,
  },

  practiceCard: {
    alignItems: 'center',
    marginVertical: 10,
  },
  practiceHeader: {
    fontFamily: 'Inter_500Medium',
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: 8,
  },
  problemText: {
    fontFamily: 'Outfit_900Black',
    fontSize: 42,
    color: '#ffffff',
    marginVertical: 12,
  },
  revealBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#12251a',
    borderWidth: 1,
    borderColor: colors.accent,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginBottom: 20,
  },
  answerHint: {
    fontFamily: 'SpaceGrotesk_700Bold',
    fontSize: 14,
    color: colors.accent,
  },
  practiceActions: {
    width: '100%',
    gap: 10,
  },
  exitBtn: {
    marginTop: 4,
  },

  sectionTitle: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 15,
    color: colors.textPrimary,
    marginBottom: 12,
  },
  presetsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  presetCard: {
    width: '48%',
    backgroundColor: colors.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    alignItems: 'center',
    gap: 8,
  },
  presetCardSelected: {
    borderColor: colors.accent,
    backgroundColor: '#12251a',
  },
  presetName: {
    fontFamily: 'Inter_500Medium',
    fontSize: 13,
    color: colors.textSecondary,
  },
  presetNameSelected: {
    color: colors.accent,
  },

  digitCard: {
    marginBottom: 24,
  },
  digitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  digitPill: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  digitPillSelected: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  digitText: {
    fontFamily: 'SpaceGrotesk_700Bold',
    fontSize: 12,
    color: colors.textSecondary,
  },
  digitTextSelected: {
    color: '#000000',
  },
  startCta: {
    marginTop: 8,
  },

  feedList: {
    gap: 14,
  },
  postCard: {
    backgroundColor: '#171920',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#262934',
  },
  postHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  postAuthor: {
    fontFamily: 'Outfit_800ExtraBold',
    color: '#38bdf8',
    fontSize: 12,
  },
  postTime: {
    fontFamily: 'Inter_500Medium',
    color: '#6b7280',
    fontSize: 10,
  },
  postTitle: {
    fontFamily: 'Inter_600SemiBold',
    color: '#ffffff',
    fontSize: 14,
    marginBottom: 12,
  },
  postActionsRow: {
    flexDirection: 'row',
    gap: 20,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  actionText: {
    fontFamily: 'SpaceGrotesk_700Bold',
    color: '#9ca3af',
    fontSize: 12,
  },
});
