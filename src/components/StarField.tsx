import React, { useMemo } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
} from 'react-native-reanimated';

const { width: W, height: H } = Dimensions.get('window');

interface StarDot {
  x: number;
  y: number;
  size: number;
  delay: number;
}

const StarDot: React.FC<StarDot> = ({ x, y, size, delay }) => {
  const opacity = useSharedValue(0.2);

  React.useEffect(() => {
    const t = setTimeout(() => {
      opacity.value = withRepeat(
        withSequence(
          withTiming(Math.random() * 0.6 + 0.4, {
            duration: 1800 + Math.random() * 1200,
            easing: Easing.inOut(Easing.ease),
          }),
          withTiming(0.15, {
            duration: 1800 + Math.random() * 1200,
            easing: Easing.inOut(Easing.ease),
          })
        ),
        -1,
        true
      );
    }, delay);
    return () => clearTimeout(t);
  }, [opacity, delay]);

  const style = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <Animated.View
      style={[
        styles.star,
        { left: x, top: y, width: size, height: size, borderRadius: size / 2 },
        style,
      ]}
    />
  );
};

interface StarFieldProps {
  count?: number;
  maxHeight?: number;
}

export const StarField: React.FC<StarFieldProps> = ({
  count = 50,
  maxHeight = H * 0.85,
}) => {
  const stars = useMemo(() => {
    const arr: StarDot[] = [];
    for (let i = 0; i < count; i++) {
      arr.push({
        x: Math.random() * (W - 8) + 4,
        y: Math.random() * maxHeight,
        size: Math.random() * 2.5 + 1,
        delay: Math.random() * 2500,
      });
    }
    return arr;
  }, [count, maxHeight]);

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {stars.map((s, i) => (
        <StarDot key={i} {...s} />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  star: {
    position: 'absolute',
    backgroundColor: 'rgba(255,255,255,0.9)',
  },
});
