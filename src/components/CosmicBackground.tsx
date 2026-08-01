import React, { useMemo, useEffect } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
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

const { width: W, height: H } = Dimensions.get('window');

interface CosmicBackgroundProps {
  nebulaOpacity?: number;
}

export const CosmicBackground: React.FC<CosmicBackgroundProps> = ({
  nebulaOpacity = 0.45,
}) => {
  const isReducedMotion = useReducedMotion();
  const glowScale = useSharedValue(1.0);

  useEffect(() => {
    if (!isReducedMotion) {
      glowScale.value = withRepeat(
        withSequence(
          withTiming(1.03, { duration: 3500, easing: Easing.inOut(Easing.ease) }),
          withTiming(0.97, { duration: 3500, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      );
    }
  }, [glowScale, isReducedMotion]);

  const animatedGlowStyle = useAnimatedStyle(() => ({
    transform: [{ scale: glowScale.value }],
  }));

  // Generate subtle static particle stars
  const stars = useMemo(() => {
    return Array.from({ length: 30 }).map((_, i) => ({
      id: i,
      x: Math.random() * W,
      y: Math.random() * H,
      size: Math.random() * 2 + 1,
      opacity: Math.random() * 0.45 + 0.15,
    }));
  }, []);

  return (
    <View style={[StyleSheet.absoluteFill, { pointerEvents: 'none' }]}>
      {/* Seamless Base Background: #05060F (bgVoid) -> #0B0E1F (bgDeep) */}
      <LinearGradient
        colors={[colors.bgVoid, colors.bgDeep, colors.bgVoid]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      {/* Single Light Source (Radial/Linear Soft Violet -> Blue Nebula) */}
      <Animated.View
        style={[
          styles.nebulaBloom,
          { opacity: nebulaOpacity },
          animatedGlowStyle,
        ]}
      >
        <LinearGradient
          colors={['rgba(110, 91, 255, 0.3)', 'rgba(74, 144, 255, 0.12)', 'transparent']}
          start={{ x: 0.2, y: 0.1 }}
          end={{ x: 0.8, y: 0.9 }}
          style={styles.bloomGradient}
        />
      </Animated.View>

      {/* Ambient Drifting Star Particles */}
      {stars.map((s) => (
        <View
          key={s.id}
          style={{
            position: 'absolute',
            left: s.x,
            top: s.y,
            width: s.size,
            height: s.size,
            borderRadius: s.size / 2,
            backgroundColor: '#F2F1F7',
            opacity: s.opacity,
          }}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  nebulaBloom: {
    position: 'absolute',
    top: -H * 0.15,
    left: -W * 0.25,
    width: W * 1.5,
    height: H * 0.6,
    borderRadius: W * 0.75,
  },
  bloomGradient: {
    width: '100%',
    height: '100%',
    borderRadius: W * 0.75,
  },
});

