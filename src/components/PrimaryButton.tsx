import React from 'react';
import { StyleSheet, Text, Pressable, ViewStyle, StyleProp, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { colors } from '../theme';

type MCIcon = React.ComponentProps<typeof MaterialCommunityIcons>['name'];
const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface PrimaryButtonProps {
  label: string;
  onPress: () => void;
  icon?: MCIcon;
  iconPosition?: 'left' | 'right';
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  fullWidth?: boolean;
  large?: boolean;
}

export const PrimaryButton: React.FC<PrimaryButtonProps> = ({
  label,
  onPress,
  icon,
  iconPosition = 'left',
  disabled = false,
  style,
  fullWidth = true,
  large = false,
}) => {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    if (disabled) return;
    scale.value = withTiming(0.98, { duration: 120, easing: Easing.out(Easing.ease) });
  };

  const handlePressOut = () => {
    if (disabled) return;
    scale.value = withTiming(1.0, { duration: 160, easing: Easing.out(Easing.quad) });
  };

  const handlePress = () => {
    if (disabled) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onPress();
  };

  const renderIcon = () =>
    icon ? (
      <MaterialCommunityIcons
        name={icon}
        size={large ? 24 : 20}
        color="#F2F1F7"
        style={iconPosition === 'left' ? styles.iconLeft : styles.iconRight}
      />
    ) : null;

  return (
    <AnimatedPressable
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled}
      style={[animatedStyle, fullWidth && styles.fullWidth, style]}
    >
      <View style={styles.haloWrap}>
        <View style={styles.haloGlow} />
        <LinearGradient
          colors={disabled ? [colors.bgDeep, colors.bgDeep] : [colors.glowViolet, colors.glowBlue]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.container, large && styles.largeContainer, disabled && styles.disabled]}
        >
          <View style={styles.content}>
            {iconPosition === 'left' && renderIcon()}
            <Text style={[styles.label, large && styles.largeLabel, disabled && styles.disabledText]}>
              {label}
            </Text>
            {iconPosition === 'right' && renderIcon()}
          </View>
        </LinearGradient>
      </View>
    </AnimatedPressable>
  );
};

const styles = StyleSheet.create({
  fullWidth: { width: '100%' },
  haloWrap: {
    position: 'relative',
  },
  haloGlow: {
    position: 'absolute',
    top: 4,
    left: 12,
    right: 12,
    bottom: -4,
    backgroundColor: colors.glowViolet,
    borderRadius: 20,
    opacity: 0.3,
    shadowColor: colors.glowViolet,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 18,
    elevation: 8,
  },
  container: {
    height: 56,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  largeContainer: {
    height: 64,
    borderRadius: 22,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 16,
    color: '#F2F1F7',
    letterSpacing: 0.2,
  },
  largeLabel: {
    fontSize: 17,
  },
  iconLeft: { marginRight: 10 },
  iconRight: { marginLeft: 10 },
  disabled: { opacity: 0.5 },
  disabledText: { color: colors.textMuted },
});

