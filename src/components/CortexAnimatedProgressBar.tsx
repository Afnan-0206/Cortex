import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  Easing,
  interpolate,
} from 'react-native-reanimated';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

interface AnimatedProgressBarProps {
  progress: number; // 0 to 1 (e.g. 0.75 for 75%)
  currentCount: number;
  totalCount: number;
  onPress?: () => void;
}

export const CortexAnimatedProgressBar: React.FC<AnimatedProgressBarProps> = ({
  progress,
  currentCount,
  totalCount,
  onPress,
}) => {
  const animatedProgress = useSharedValue(0);

  useEffect(() => {
    animatedProgress.value = withTiming(progress, {
      duration: 1000,
      easing: Easing.out(Easing.cubic),
    });
  }, [progress]);

  // Animated Width of the inner capsule fill bar
  const progressFillStyle = useAnimatedStyle(() => {
    return {
      width: `${animatedProgress.value * 100}%`,
    };
  });

  // Animated scale & pulse for floating percentage badge
  const floatingBadgeStyle = useAnimatedStyle(() => {
    const scale = interpolate(animatedProgress.value, [0, 0.5, 1], [0.95, 1.05, 1]);
    return {
      transform: [{ scale: withSpring(scale) }],
    };
  });

  const percentText = Math.round(progress * 100);

  return (
    <Pressable onPress={onPress} style={styles.container}>
      {/* ── 1. FLOATING NUMERIC COUNTER & CRESCENT WAVE BASIN ── */}
      <Animated.View style={[styles.floatingCounterWrap, floatingBadgeStyle]}>
        <Text style={styles.counterNumberText}>{percentText}%</Text>
        
        {/* Crescent Liquid Wave Symbol Container */}
        <View style={styles.crescentWaveContainer}>
          <View style={styles.waveBowlShape}>
            <View style={[styles.waveFillLevel, { height: `${percentText}%` }]} />
          </View>
        </View>
      </Animated.View>

      {/* ── 2. CAPSULE DOUBLE-BORDER PROGRESS TRACK ── */}
      <View style={styles.capsuleOuterTrack}>
        <View style={styles.capsuleInnerInset}>
          <Animated.View style={[styles.capsuleFillBar, progressFillStyle]} />
        </View>
      </View>

      {/* ── 3. BOTTOM LABEL & TROPHY REWARD ANCHOR ── */}
      <View style={styles.footerRow}>
        <Text style={styles.progressCounterText}>
          {currentCount} of {totalCount} challenges completed
        </Text>
        <View
          style={[
            styles.trophyBadge,
            progress >= 1 && styles.trophyBadgeCompleted,
          ]}
        >
          <MaterialCommunityIcons
            name="trophy"
            size={18}
            color={progress >= 1 ? '#F59E0B' : '#64748B'}
          />
        </View>
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    alignItems: 'center',
    paddingVertical: 8,
  },

  // ── FLOATING COUNTER & WAVE ──
  floatingCounterWrap: {
    alignItems: 'center',
    marginBottom: 10,
  },
  counterNumberText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 32,
    color: '#F8FAFC',
    letterSpacing: -0.5,
    marginBottom: -4,
  },
  crescentWaveContainer: {
    width: 64,
    height: 24,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  waveBowlShape: {
    width: 56,
    height: 22,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    borderTopLeftRadius: 6,
    borderTopRightRadius: 6,
    backgroundColor: '#1E293B',
    borderColor: '#334155',
    borderWidth: 1.5,
    overflow: 'hidden',
    justifyContent: 'flex-end',
  },
  waveFillLevel: {
    width: '100%',
    backgroundColor: '#3B82F6',
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
  },

  // ── CAPSULE PROGRESS TRACK (MATCHING REFERENCE IMAGE) ──
  capsuleOuterTrack: {
    width: '100%',
    height: 18,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#475569',
    backgroundColor: '#0F131C',
    padding: 2.5,
    justifyContent: 'center',
  },
  capsuleInnerInset: {
    flex: 1,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: 'transparent',
  },
  capsuleFillBar: {
    height: '100%',
    backgroundColor: '#F8FAFC',
    borderRadius: 6,
  },

  // ── FOOTER ROW ──
  footerRow: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
  },
  progressCounterText: {
    fontFamily: 'Inter_500Medium',
    fontVariant: ['tabular-nums'],
    fontSize: 12,
    color: '#94A3B8',
  },
  trophyBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#12151C',
    borderColor: '#222734',
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  trophyBadgeCompleted: {
    backgroundColor: '#1E1306',
    borderColor: '#F59E0B',
  },
});
