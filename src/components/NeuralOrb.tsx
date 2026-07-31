import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  Easing,
  useReducedMotion,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../theme';

interface Particle {
  id: number;
  angle: number;
  radius: number;
  size: number;
  opacity: number;
  speed: number;
}

interface NeuralOrbProps {
  size?: number;
  interactive?: boolean;
}

export const NeuralOrb: React.FC<NeuralOrbProps> = ({ size = 180 }) => {
  const isReducedMotion = useReducedMotion();
  const translateY = useSharedValue(0);
  const rotation = useSharedValue(0);
  const innerPulse = useSharedValue(1);

  useEffect(() => {
    if (!isReducedMotion) {
      // 7s slow floating motion
      translateY.value = withRepeat(
        withSequence(
          withTiming(-8, { duration: 3500, easing: Easing.inOut(Easing.ease) }),
          withTiming(0, { duration: 3500, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      );

      // Ambient 3D rotation
      rotation.value = withRepeat(
        withTiming(360, { duration: 32000, easing: Easing.linear }),
        -1,
        false
      );

      // 7s breathing pulse (98% -> 103%)
      innerPulse.value = withRepeat(
        withSequence(
          withTiming(1.04, { duration: 3500, easing: Easing.inOut(Easing.ease) }),
          withTiming(0.98, { duration: 3500, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      );
    }
  }, [translateY, rotation, innerPulse, isReducedMotion]);

  const floatingStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const rotationStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: innerPulse.value }],
  }));

  // Generating neural node positions inside circle
  const particles: Particle[] = Array.from({ length: 14 }).map((_, i) => {
    const angle = (i / 14) * Math.PI * 2;
    const radius = (size / 2) * (0.35 + (i % 3) * 0.2);
    return {
      id: i,
      angle,
      radius,
      size: 3 + (i % 3) * 1.5,
      opacity: 0.4 + (i % 4) * 0.12,
      speed: 1 + i * 0.1,
    };
  });

  return (
    <Animated.View style={[styles.container, { width: size, height: size }, floatingStyle]}>
      {/* Outer Volumetric Atmosphere Glow */}
      <Animated.View
        style={[
          styles.glowAura,
          {
            width: size * 1.4,
            height: size * 1.4,
            borderRadius: (size * 1.4) / 2,
            left: -size * 0.2,
            top: -size * 0.2,
          },
          pulseStyle,
        ]}
      />

      {/* Primary Neural Violet -> Blue Sphere */}
      <View style={[styles.orbBody, { width: size, height: size, borderRadius: size / 2 }]}>
        <LinearGradient
          colors={['#6E5BFF', '#4A90FF', 'rgba(11, 14, 31, 0.95)']}
          start={{ x: 0.1, y: 0.1 }}
          end={{ x: 0.9, y: 0.9 }}
          style={StyleSheet.absoluteFill}
        />

        {/* Specular Light Reflection */}
        <LinearGradient
          colors={['rgba(242, 241, 247, 0.35)', 'rgba(242, 241, 247, 0.04)', 'transparent']}
          start={{ x: 0.25, y: 0.15 }}
          end={{ x: 0.75, y: 0.65 }}
          style={StyleSheet.absoluteFill}
        />

        {/* Rotating Connected Neural Nodes */}
        <Animated.View style={[StyleSheet.absoluteFill, rotationStyle]}>
          {particles.map((p) => {
            const posX = size / 2 + Math.cos(p.angle) * p.radius - p.size / 2;
            const posY = size / 2 + Math.sin(p.angle) * p.radius - p.size / 2;
            return (
              <View
                key={p.id}
                style={[
                  styles.node,
                  {
                    left: posX,
                    top: posY,
                    width: p.size,
                    height: p.size,
                    borderRadius: p.size / 2,
                    opacity: p.opacity,
                  },
                ]}
              />
            );
          })}
        </Animated.View>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  glowAura: {
    position: 'absolute',
    backgroundColor: 'rgba(110, 91, 255, 0.2)',
    shadowColor: colors.glowViolet,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.7,
    shadowRadius: 36,
    elevation: 16,
  },
  orbBody: {
    overflow: 'hidden',
    shadowColor: colors.glowBlue,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 28,
    elevation: 14,
  },
  node: {
    position: 'absolute',
    backgroundColor: '#F2F1F7',
    shadowColor: colors.glowBlue,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 6,
    elevation: 4,
  },
});

