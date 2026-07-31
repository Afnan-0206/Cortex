import React from 'react';
import { View, StyleSheet, Pressable, ViewStyle, StyleProp } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { colors } from '../theme';

interface CortexCardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  padding?: number;
  onPress?: () => void;
  variant?: 'default' | 'alt' | 'tinted';
}

export const CortexCard: React.FC<CortexCardProps> = ({
  children,
  style,
  padding = 24,
  onPress,
  variant = 'default',
}) => {
  const scale = useSharedValue(1);

  const handlePressIn = () => {
    if (onPress) {
      scale.value = withTiming(0.98, { duration: 120, easing: Easing.out(Easing.ease) });
    }
  };

  const handlePressOut = () => {
    if (onPress) {
      scale.value = withTiming(1.0, { duration: 160, easing: Easing.out(Easing.quad) });
    }
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const cardContent = (
    <Animated.View
      style={[
        styles.card,
        variant === 'alt' && styles.cardAlt,
        variant === 'tinted' && styles.cardTinted,
        { padding },
        style,
        animatedStyle,
      ]}
    >
      {children}
    </Animated.View>
  );

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={styles.pressable}
      >
        {cardContent}
      </Pressable>
    );
  }

  return cardContent;
};

const styles = StyleSheet.create({
  pressable: {
    width: '100%',
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  cardAlt: {
    backgroundColor: colors.surfaceAlt,
  },
  cardTinted: {
    backgroundColor: colors.surfaceAlt,
    borderColor: colors.textSecondary + '40',
  },
});
