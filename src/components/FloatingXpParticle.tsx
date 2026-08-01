import React, { useEffect } from 'react';
import { StyleSheet, Text } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { colors } from '../theme';

interface FloatingXpParticleProps {
  visible: boolean;
  xpAmount?: number;
}

export const FloatingXpParticle: React.FC<FloatingXpParticleProps> = ({
  visible,
  xpAmount = 12,
}) => {
  const translateY = useSharedValue(0);
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.7);

  useEffect(() => {
    if (visible) {
      translateY.value = 0;
      opacity.value = 1;
      scale.value = 1.2;

      translateY.value = withTiming(-45, { duration: 750, easing: Easing.out(Easing.quad) });
      opacity.value = withTiming(0, { duration: 750, easing: Easing.out(Easing.ease) });
      scale.value = withTiming(1.0, { duration: 750 });
    }
  }, [visible, translateY, opacity, scale]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }, { scale: scale.value }],
  }));

  if (!visible) return null;

  return (
    <Animated.View style={[styles.particleContainer, animatedStyle, { pointerEvents: 'none' }]}>
      <Text style={styles.xpText}>+{xpAmount} XP</Text>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  particleContainer: {
    position: 'absolute',
    alignSelf: 'center',
    top: -24,
    backgroundColor: 'rgba(245, 158, 11, 0.95)',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 999,
    shadowColor: colors.amber,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 12,
    elevation: 8,
  },
  xpText: {
    fontFamily: 'Inter_600SemiBold',
    fontVariant: ['tabular-nums'],
    fontSize: 15,
    color: '#0B1020',
  },
});
