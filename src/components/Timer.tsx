import React, { useEffect } from 'react';
import { Text, StyleSheet } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
  useReducedMotion,
} from 'react-native-reanimated';
import { colors } from '../theme';

interface TimerProps {
  seconds: number;
  warningAt?: number;
  dangerAt?: number;
}

export const Timer: React.FC<TimerProps> = ({
  seconds,
  warningAt = 20,
  dangerAt = 10,
}) => {
  const isReducedMotion = useReducedMotion();
  const pillScale = useSharedValue(1);

  const isDanger = seconds <= dangerAt;
  const isWarning = seconds <= warningAt;

  const timerColor = isDanger
    ? colors.danger
    : isWarning
    ? colors.glowBlue
    : colors.glowViolet;

  const borderColor = isDanger
    ? 'rgba(255, 92, 92, 0.4)'
    : isWarning
    ? 'rgba(74, 144, 255, 0.35)'
    : 'rgba(110, 91, 255, 0.25)';

  useEffect(() => {
    if (isDanger && !isReducedMotion) {
      pillScale.value = withRepeat(
        withSequence(
          withTiming(1.05, { duration: 450, easing: Easing.out(Easing.ease) }),
          withTiming(1.0, { duration: 450, easing: Easing.in(Easing.ease) })
        ),
        -1,
        false
      );
    } else {
      pillScale.value = withTiming(1, { duration: 200 });
    }
  }, [isDanger, pillScale, isReducedMotion]);

  const pillStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pillScale.value }],
  }));

  return (
    <Animated.View
      style={[styles.pill, { borderColor }, pillStyle]}
    >
      <MaterialCommunityIcons
        name="timer-outline"
        size={14}
        color={timerColor}
        style={styles.icon}
      />
      <Text style={[styles.text, { color: timerColor }]}>{seconds}s</Text>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    backgroundColor: 'rgba(11, 14, 31, 0.85)',
  },
  icon: {
    marginRight: 6,
  },
  text: {
    fontFamily: 'Inter_600SemiBold',
    fontVariant: ['tabular-nums'],
    fontSize: 14,
    lineHeight: 18,
    letterSpacing: 0.5,
  },
});

