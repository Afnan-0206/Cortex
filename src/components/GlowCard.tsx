import React, { useRef } from 'react';
import {
  View,
  StyleSheet,
  Pressable,
  StyleProp,
  ViewStyle,
  Animated as RNAnimated,
  Easing,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../theme';

interface GlowCardProps {
  children: React.ReactNode;
  padding?: number;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  disabled?: boolean;
  gradient?: boolean;
  elevated?: boolean;
  compact?: boolean;
}

export const GlowCard: React.FC<GlowCardProps> = ({
  children,
  padding,
  onPress,
  style,
  disabled = false,
  gradient = false,
  elevated = false,
  compact = false,
}) => {
  const resolvedPadding = padding ?? (compact ? 14 : 20);
  const scaleAnim = useRef(new RNAnimated.Value(1)).current;

  const handlePressIn = () => {
    if (!onPress) return;
    RNAnimated.timing(scaleAnim, {
      toValue: 0.98,
      duration: 120,
      easing: Easing.out(Easing.ease),
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    if (!onPress) return;
    RNAnimated.timing(scaleAnim, {
      toValue: 1.0,
      duration: 160,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start();
  };

  const borderColor = elevated
    ? 'rgba(110, 91, 255, 0.35)'
    : 'rgba(242, 241, 247, 0.06)';

  const shadowStyle = elevated
    ? {
        shadowColor: colors.glowViolet,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.35,
        shadowRadius: 20,
        elevation: 10,
      }
    : {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
        elevation: 5,
      };

  const inner = gradient ? (
    <LinearGradient
      colors={['rgba(15, 19, 41, 0.9)', colors.bgDeep]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[
        styles.card,
        { padding: resolvedPadding, borderColor },
      ]}
    >
      {children}
    </LinearGradient>
  ) : (
    <View style={[styles.card, styles.solidCard, { padding: resolvedPadding, borderColor }]}>
      {children}
    </View>
  );

  const animated = (
    <RNAnimated.View
      style={[shadowStyle, { transform: [{ scale: scaleAnim }] }, style]}
    >
      {inner}
    </RNAnimated.View>
  );

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled}
      >
        {animated}
      </Pressable>
    );
  }

  return animated;
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 24,
    borderWidth: 1,
    overflow: 'hidden',
  },
  solidCard: {
    backgroundColor: colors.bgDeep,
  },
});

