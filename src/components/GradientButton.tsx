import React, { useEffect } from 'react';
import {
  StyleSheet,
  Text,
  Pressable,
  ViewStyle,
  StyleProp,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSequence,
  Easing,
  useReducedMotion,
} from 'react-native-reanimated';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { colors } from '../theme';

type MCIcon = React.ComponentProps<typeof MaterialCommunityIcons>['name'];

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface GradientButtonProps {
  label: string;
  onPress: () => void;
  icon?: MCIcon;
  iconPosition?: 'left' | 'right';
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  height?: number;
  borderRadius?: number;
  large?: boolean;
}

export const GradientButton: React.FC<GradientButtonProps> = ({
  label,
  onPress,
  icon,
  iconPosition = 'right',
  disabled = false,
  style,
  height = 58,
  borderRadius = 9999,
}) => {
  const isReducedMotion = useReducedMotion();
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);
  const arrowX = useSharedValue(0);

  useEffect(() => {
    if (!isReducedMotion) {
      arrowX.value = withRepeat(
        withSequence(
          withTiming(4, { duration: 1400, easing: Easing.inOut(Easing.ease) }),
          withTiming(0, { duration: 1400, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        false
      );
    }
  }, [arrowX, isReducedMotion]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const arrowAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: arrowX.value }],
  }));

  const handlePressIn = () => {
    if (disabled) return;
    scale.value = withTiming(0.98, { duration: 120, easing: Easing.out(Easing.ease) });
    opacity.value = withTiming(0.95, { duration: 100 });
  };

  const handlePressOut = () => {
    if (disabled) return;
    scale.value = withTiming(1.0, { duration: 160, easing: Easing.out(Easing.quad) });
    opacity.value = withTiming(1.0, { duration: 120 });
  };

  const handlePress = () => {
    if (disabled) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onPress();
  };

  return (
    <AnimatedPressable
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled}
      style={[styles.container, animatedStyle, style]}
    >
      {/* Outer soft volumetric glow halo */}
      <View style={[styles.glowHalo, { borderRadius, pointerEvents: 'none' }]} />
      <LinearGradient
        colors={
          disabled
            ? ['rgba(242, 241, 247, 0.1)', 'rgba(242, 241, 247, 0.05)']
            : [colors.glowViolet, colors.glowBlue]
        }
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[
          styles.gradient,
          { height, borderRadius },
          disabled && styles.disabled,
        ]}
      >
        {/* Soft specular top-left highlight */}
        <LinearGradient
          colors={['rgba(242, 241, 247, 0.25)', 'transparent']}
          start={{ x: 0, y: 0 }}
          end={{ x: 0.5, y: 0.5 }}
          style={[StyleSheet.absoluteFill, { pointerEvents: 'none' }]}
        />
        <View style={styles.row}>
          {iconPosition === 'left' && icon && (
            <MaterialCommunityIcons
              name={icon}
              size={22}
              color={disabled ? colors.textMuted : '#F2F1F7'}
              style={styles.iconLeft}
            />
          )}
          <Text style={[styles.label, disabled && styles.disabledText]}>
            {label}
          </Text>
          {iconPosition === 'right' && (
            <Animated.View style={arrowAnimatedStyle}>
              <MaterialCommunityIcons
                name={icon ?? 'arrow-right'}
                size={22}
                color={disabled ? colors.textMuted : '#F2F1F7'}
                style={styles.iconRight}
              />
            </Animated.View>
          )}
        </View>
      </LinearGradient>
    </AnimatedPressable>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  glowHalo: {
    position: 'absolute',
    backgroundColor: colors.glowViolet,
    opacity: 0.25,
    top: 4,
    bottom: -4,
    left: 8,
    right: 8,
    shadowColor: colors.glowViolet,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
  },
  gradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
    overflow: 'hidden',
    borderWidth: 0,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconLeft: { marginRight: 10 },
  iconRight: { marginLeft: 10 },
  label: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 16,
    color: '#F2F1F7',
    letterSpacing: 0.2,
  },
  disabled: { opacity: 0.5 },
  disabledText: { color: colors.textMuted },
});

