import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
  useReducedMotion,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { colors } from '../theme';

interface FloatingBrainOrbProps {
  size?: number;
  showIcon?: boolean;
}

export const FloatingBrainOrb: React.FC<FloatingBrainOrbProps> = ({
  size = 120,
  showIcon = true,
}) => {
  const isReducedMotion = useReducedMotion();
  const translateY = useSharedValue(0);
  const scale = useSharedValue(1);
  const coreGlow = useSharedValue(0.7);

  useEffect(() => {
    if (!isReducedMotion) {
      // Slow floating (7s loop)
      translateY.value = withRepeat(
        withSequence(
          withTiming(-8, { duration: 3500, easing: Easing.inOut(Easing.ease) }),
          withTiming(0, { duration: 3500, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      );

      // Glow pulse (7s loop)
      scale.value = withRepeat(
        withSequence(
          withTiming(1.04, { duration: 3500, easing: Easing.inOut(Easing.ease) }),
          withTiming(0.98, { duration: 3500, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      );

      coreGlow.value = withRepeat(
        withSequence(
          withTiming(0.95, { duration: 3500, easing: Easing.inOut(Easing.ease) }),
          withTiming(0.55, { duration: 3500, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      );
    }
  }, [translateY, scale, coreGlow, isReducedMotion]);

  const orbAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }, { scale: scale.value }],
  }));

  const coreAnimatedStyle = useAnimatedStyle(() => ({
    opacity: coreGlow.value,
  }));

  return (
    <Animated.View style={[styles.container, { width: size, height: size }, orbAnimatedStyle]}>
      {/* Outer Volumetric Halo */}
      <View
        style={[
          styles.outerHalo,
          {
            width: size * 1.4,
            height: size * 1.4,
            borderRadius: (size * 1.4) / 2,
            top: -size * 0.2,
            left: -size * 0.2,
          },
        ]}
      />

      {/* Main 3D Sphere Violet -> Blue */}
      <LinearGradient
        colors={['#6E5BFF', '#4A90FF', '#0B0E1F']}
        start={{ x: 0.15, y: 0.15 }}
        end={{ x: 0.85, y: 0.85 }}
        style={[styles.sphere, { borderRadius: size / 2 }]}
      />

      {/* Inner Glowing Core */}
      <Animated.View style={[styles.innerCore, coreAnimatedStyle]}>
        <LinearGradient
          colors={['#F2F1F7', 'rgba(110, 91, 255, 0.4)', 'transparent']}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={[styles.coreGradient, { borderRadius: (size * 0.6) / 2, width: size * 0.6, height: size * 0.6 }]}
        />
      </Animated.View>

      {showIcon && (
        <View style={styles.iconCenter}>
          <MaterialCommunityIcons name="brain" size={size * 0.45} color="#F2F1F7" />
        </View>
      )}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  outerHalo: {
    position: 'absolute',
    backgroundColor: 'rgba(110, 91, 255, 0.25)',
    shadowColor: colors.glowViolet,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 28,
    elevation: 12,
  },
  sphere: {
    width: '100%',
    height: '100%',
    shadowColor: colors.glowBlue,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 24,
    elevation: 12,
  },
  innerCore: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  coreGradient: {
    opacity: 0.8,
  },
  iconCenter: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

