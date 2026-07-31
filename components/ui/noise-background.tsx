import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
} from 'react-native-reanimated';

interface NoiseBackgroundProps {
  children?: React.ReactNode;
  className?: string;
  containerStyle?: StyleProp<ViewStyle>;
  style?: StyleProp<ViewStyle>;
  gradientColors?: readonly [string, string, ...string[]];
  noiseIntensity?: number;
  speed?: number;
  animating?: boolean;
}

export const NoiseBackground: React.FC<NoiseBackgroundProps> = ({
  children,
  containerStyle,
  style,
  gradientColors = ['rgba(132, 204, 22, 0.35)', 'rgba(34, 197, 94, 0.25)', 'rgba(56, 189, 248, 0.2)'],
  noiseIntensity = 0.15,
  animating = true,
}) => {
  const gradientTranslateX = useSharedValue(-20);
  const gradientTranslateY = useSharedValue(-10);
  const gradientScale = useSharedValue(1);

  useEffect(() => {
    if (animating) {
      gradientTranslateX.value = withRepeat(
        withSequence(
          withTiming(20, { duration: 3500, easing: Easing.inOut(Easing.ease) }),
          withTiming(-20, { duration: 3500, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      );
      gradientTranslateY.value = withRepeat(
        withSequence(
          withTiming(15, { duration: 4000, easing: Easing.inOut(Easing.ease) }),
          withTiming(-15, { duration: 4000, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      );
      gradientScale.value = withRepeat(
        withSequence(
          withTiming(1.1, { duration: 3000, easing: Easing.inOut(Easing.ease) }),
          withTiming(1.0, { duration: 3000, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      );
    }
  }, [animating]);

  const animatedGradientStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: gradientTranslateX.value },
      { translateY: gradientTranslateY.value },
      { scale: gradientScale.value },
    ],
  }));

  return (
    <View style={[styles.container, containerStyle]}>
      {/* Animated Gradient Ambient Layer */}
      <Animated.View style={[StyleSheet.absoluteFill, animatedGradientStyle]}>
        <LinearGradient
          colors={gradientColors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>

      {/* Top Glossy Highlight Bar */}
      <LinearGradient
        colors={['rgba(255, 255, 255, 0.35)', 'rgba(255, 255, 255, 0)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={styles.topHighlight}
      />

      {/* Noise Texture Overlay */}
      <View
        style={[
          styles.noiseOverlay,
          { opacity: noiseIntensity },
        ]}
      />

      {/* Foreground Content */}
      <View style={[styles.content, style]}>{children}</View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    overflow: 'hidden',
    borderRadius: 20,
    backgroundColor: '#171920',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  topHighlight: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 2,
    zIndex: 2,
  },
  noiseOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
  },
  content: {
    zIndex: 10,
  },
});
