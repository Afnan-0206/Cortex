import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Modal,
  Dimensions,
} from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import * as Haptics from 'expo-haptics';
import Animated, {
  FadeIn,
  FadeOut,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { GuideStep } from '../store/guideStore';

const { width, height } = Dimensions.get('window');

interface FirstGameGuideOverlayProps {
  visible: boolean;
  step: GuideStep;
  onNext: () => void;
  onSkip: () => void;
  onActionTargetPress?: () => void;
}

export const FirstGameGuideOverlay: React.FC<FirstGameGuideOverlayProps> = ({
  visible,
  step,
  onNext,
  onSkip,
  onActionTargetPress,
}) => {
  const pulseScale = useSharedValue(1);

  useEffect(() => {
    pulseScale.value = withRepeat(
      withSequence(
        withTiming(1.03, { duration: 900 }),
        withTiming(1.0, { duration: 900 })
      ),
      -1,
      true
    );
  }, []);

  const pulseAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
  }));

  if (!visible || step === 'IDLE' || step === 'BATTLE_COMPLETE_REWARD') return null;

  const handleNextPress = () => {
    Haptics.selectionAsync().catch(() => {});
    onNext();
  };

  const handleTargetPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    if (onActionTargetPress) {
      onActionTargetPress();
    }
    onNext();
  };

  // Determine tooltip copy & position per step
  let title = '';
  let subtitle = '';
  let highlightType: 'WELCOME' | 'MODE_CARD' | 'PLAY_BTN' | 'TIMER' | 'QUESTION' = 'WELCOME';
  let ctaText = 'Next';

  switch (step) {
    case 'ARENA_WELCOME':
      title = 'Welcome to Cortex';
      subtitle = 'Cortex is a real-time arena for mental athletics. Let’s play your first 1v1 duel!';
      highlightType = 'WELCOME';
      ctaText = 'Start Guide';
      break;

    case 'ARENA_SELECT_MODE':
      title = 'Step 1: Choose Your Discipline';
      subtitle = 'Tap the MATH mode card to select rapid-fire arithmetic duels.';
      highlightType = 'MODE_CARD';
      ctaText = 'Tap Math';
      break;

    case 'ARENA_PRESS_PLAY':
      title = 'Step 2: Enter the Arena';
      subtitle = 'Tap Play to start matching with a rival athlete.';
      highlightType = 'PLAY_BTN';
      ctaText = 'Tap Play';
      break;

    case 'BATTLE_HINT_TIMER':
      title = '60-Second Duel Timer';
      subtitle = 'Race against the clock. Solve as many questions as you can before time expires.';
      highlightType = 'TIMER';
      ctaText = 'Got It';
      break;

    case 'BATTLE_HINT_QUESTION':
      title = 'Speed & Accuracy';
      subtitle = 'Focus on solving fast and correctly. First one to submit the correct answer gets the point!';
      highlightType = 'QUESTION';
      ctaText = 'Let’s Play';
      break;

    default:
      return null;
  }

  return (
    <Modal visible={visible} transparent animationType="fade">
      <Animated.View entering={FadeIn.duration(200)} exiting={FadeOut.duration(200)} style={styles.backdrop}>
        {/* Dimmed Overlay */}
        <View style={styles.dimLayer} />

        {/* Top Failsafe Skip Button */}
        <Pressable style={styles.skipBtn} onPress={onSkip} hitSlop={12}>
          <Text style={styles.skipText}>Skip tutorial</Text>
        </Pressable>

        {/* Step 1: Welcome Overlay Box */}
        {highlightType === 'WELCOME' && (
          <View style={styles.welcomeBox}>
            <View style={styles.iconRing}>
              <MaterialCommunityIcons name="brain" size={32} color="#84cc16" />
            </View>
            <Text style={styles.tooltipTitle}>{title}</Text>
            <Text style={styles.tooltipSub}>{subtitle}</Text>
            <Pressable style={styles.primaryCta} onPress={handleNextPress}>
              <Text style={styles.primaryCtaText}>{ctaText}</Text>
            </Pressable>
          </View>
        )}

        {/* Step 2: Highlight Mode Card */}
        {highlightType === 'MODE_CARD' && (
          <View style={styles.centerContainer}>
            <Animated.View style={[styles.targetHighlightRing, pulseAnimatedStyle]}>
              <Pressable style={styles.targetHitArea} onPress={handleTargetPress}>
                <MaterialCommunityIcons name="gesture-tap" size={24} color="#84cc16" />
                <Text style={styles.targetLabel}>Tap MATH Card</Text>
              </Pressable>
            </Animated.View>
            <View style={styles.tooltipBox}>
              <Text style={styles.tooltipTitle}>{title}</Text>
              <Text style={styles.tooltipSub}>{subtitle}</Text>
              <Pressable style={styles.smallCta} onPress={handleNextPress}>
                <Text style={styles.smallCtaText}>{ctaText}</Text>
              </Pressable>
            </View>
          </View>
        )}

        {/* Step 3: Highlight Play Button */}
        {highlightType === 'PLAY_BTN' && (
          <View style={styles.bottomHighlightContainer}>
            <Animated.View style={[styles.targetHighlightRingLarge, pulseAnimatedStyle]}>
              <Pressable style={styles.targetHitArea} onPress={handleTargetPress}>
                <MaterialCommunityIcons name="sword-cross" size={28} color="#84cc16" />
                <Text style={styles.targetLabelLarge}>START BATTLE</Text>
              </Pressable>
            </Animated.View>
            <View style={styles.tooltipBox}>
              <Text style={styles.tooltipTitle}>{title}</Text>
              <Text style={styles.tooltipSub}>{subtitle}</Text>
            </View>
          </View>
        )}

        {/* In-Battle Hints */}
        {(highlightType === 'TIMER' || highlightType === 'QUESTION') && (
          <View style={styles.battleHintContainer}>
            <View style={styles.tooltipBoxBattle}>
              <View style={styles.hintHeaderRow}>
                <MaterialCommunityIcons
                  name={highlightType === 'TIMER' ? 'timer-outline' : 'lightning-bolt'}
                  size={22}
                  color="#84cc16"
                />
                <Text style={styles.tooltipTitle}>{title}</Text>
              </View>
              <Text style={styles.tooltipSub}>{subtitle}</Text>
              <Pressable style={styles.primaryCta} onPress={handleNextPress}>
                <Text style={styles.primaryCtaText}>{ctaText}</Text>
              </Pressable>
            </View>
          </View>
        )}
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dimLayer: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(6, 8, 16, 0.85)',
  },

  skipBtn: {
    position: 'absolute',
    top: 54,
    right: 24,
    zIndex: 10,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  skipText: {
    color: '#94a3b8',
    fontSize: 13,
    fontWeight: '600',
  },

  welcomeBox: {
    width: width * 0.86,
    backgroundColor: '#121622',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(132, 204, 22, 0.3)',
    shadowColor: '#84cc16',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
  },
  iconRing: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(132, 204, 22, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },

  tooltipTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 8,
  },
  tooltipSub: {
    fontSize: 14,
    color: '#94a3b8',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },

  primaryCta: {
    width: '100%',
    height: 48,
    backgroundColor: '#84cc16',
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryCtaText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0d0e12',
  },

  centerContainer: {
    width: width * 0.88,
    alignItems: 'center',
    gap: 20,
  },
  targetHighlightRing: {
    width: '100%',
    height: 80,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: '#84cc16',
    backgroundColor: 'rgba(132, 204, 22, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  targetHitArea: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  targetLabel: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.5,
  },

  tooltipBox: {
    width: '100%',
    backgroundColor: '#121622',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  smallCta: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: '#84cc16',
    borderRadius: 12,
  },
  smallCtaText: {
    color: '#0d0e12',
    fontWeight: '800',
    fontSize: 14,
  },

  bottomHighlightContainer: {
    position: 'absolute',
    bottom: 40,
    width: width * 0.88,
    alignItems: 'center',
    gap: 16,
  },
  targetHighlightRingLarge: {
    width: '100%',
    height: 64,
    borderRadius: 16,
    backgroundColor: '#84cc16',
    alignItems: 'center',
    justifyContent: 'center',
  },
  targetLabelLarge: {
    color: '#0d0e12',
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 1,
  },

  battleHintContainer: {
    width: width * 0.88,
  },
  tooltipBoxBattle: {
    backgroundColor: '#121622',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1.5,
    borderColor: 'rgba(132, 204, 22, 0.3)',
  },
  hintHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    justifyContent: 'center',
    marginBottom: 4,
  },
});
