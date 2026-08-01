import React from 'react';
import { StyleSheet, View, Pressable, StyleProp, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { colors } from '../theme';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface GlassCardProps {
  children: React.ReactNode;
  padding?: number;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  elevated?: boolean;
  glow?: boolean;
  hero?: boolean;
}

export const GlassCard: React.FC<GlassCardProps> = ({
  children,
  padding = 24,
  onPress,
  style,
  elevated = false,
  glow = false,
  hero = false,
}) => {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    if (!onPress) return;
    scale.value = withTiming(0.98, { duration: 120, easing: Easing.out(Easing.ease) });
  };

  const handlePressOut = () => {
    if (!onPress) return;
    scale.value = withTiming(1.0, { duration: 160, easing: Easing.out(Easing.quad) });
  };

  const cardColors: [string, string, ...string[]] = hero
    ? ['rgba(110, 91, 255, 0.16)', 'rgba(11, 14, 31, 0.88)']
    : elevated
    ? ['rgba(15, 19, 41, 0.85)', 'rgba(11, 14, 31, 0.95)']
    : ['rgba(11, 14, 31, 0.72)', 'rgba(11, 14, 31, 0.85)'];

  const content = (
    <View style={styles.cardContainer}>
      <LinearGradient
        colors={cardColors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[
          styles.card,
          { padding },
          hero && styles.heroCard,
          glow && styles.glowStyle,
        ]}
      >
        {/* Soft top-left inner light ray */}
        <LinearGradient
          colors={['rgba(242, 241, 247, 0.08)', 'rgba(242, 241, 247, 0.01)', 'transparent']}
          start={{ x: 0, y: 0 }}
          end={{ x: 0.6, y: 0.6 }}
          style={[StyleSheet.absoluteFill, { pointerEvents: 'none' }]}
        />
        {children}
      </LinearGradient>
    </View>
  );

  if (onPress) {
    return (
      <AnimatedPressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={[animatedStyle, style]}
      >
        {content}
      </AnimatedPressable>
    );
  }

  return <View style={style}>{content}</View>;
};

const styles = StyleSheet.create({
  cardContainer: {
    borderRadius: 28,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.45,
    shadowRadius: 28,
    elevation: 10,
  },
  card: {
    borderRadius: 28,
    borderWidth: 1,
    borderColor: 'rgba(242, 241, 247, 0.06)',
    overflow: 'hidden',
  },
  heroCard: {
    borderRadius: 28,
    borderColor: 'rgba(110, 91, 255, 0.25)',
    shadowColor: colors.glowViolet,
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.35,
    shadowRadius: 36,
    elevation: 16,
  },
  glowStyle: {
    borderColor: 'rgba(74, 144, 255, 0.25)',
    shadowColor: colors.glowBlue,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.4,
    shadowRadius: 30,
    elevation: 12,
  },
});

