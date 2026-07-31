import React, { useEffect } from 'react';
import { View, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSequence,
  Easing,
} from 'react-native-reanimated';
import { colors } from '../theme';

interface ProgressBarProps {
  progress: number; // 0 – 1
  height?: number;
  style?: StyleProp<ViewStyle>;
  pulse?: boolean;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  progress,
  height = 8,
  style,
  pulse = false,
}) => {
  const animProgress = useSharedValue(0);
  const fillGlow = useSharedValue(1);

  useEffect(() => {
    const clamped = Math.min(1, Math.max(0, progress));
    animProgress.value = withTiming(clamped, {
      duration: 600,
      easing: Easing.out(Easing.cubic),
    });
  }, [progress, animProgress]);

  useEffect(() => {
    if (!pulse) return;
    fillGlow.value = withRepeat(
      withSequence(
        withTiming(1.02, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
        withTiming(1.0, { duration: 2000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      false
    );
  }, [pulse, fillGlow]);

  const fillStyle = useAnimatedStyle(() => ({
    width: `${animProgress.value * 100}%`,
    transform: pulse ? [{ scaleY: fillGlow.value }] : [],
  }));

  return (
    <View
      style={[
        styles.track,
        { height, borderRadius: height / 2 },
        style,
      ]}
    >
      <Animated.View style={[styles.fillWrap, fillStyle]}>
        <LinearGradient
          colors={[colors.primary, colors.secondary]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[styles.fill, { height, borderRadius: height / 2 }]}
        />
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  track: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    width: '100%',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(124, 92, 255, 0.06)',
  },
  fillWrap: {
    height: '100%',
    overflow: 'hidden',
  },
  fill: {
    width: '100%',
    height: '100%',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 8,
    elevation: 4,
  },
});
