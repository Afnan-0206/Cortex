import React from 'react';
import { StyleSheet, Text, Pressable, ViewStyle, StyleProp, View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { LinearGradient } from 'expo-linear-gradient';

export type CortexButtonVariant = 'primary' | 'secondary' | 'contest' | 'battle' | 'ghost' | 'danger';

interface CortexButtonProps {
  label: string;
  onPress: () => void;
  variant?: CortexButtonVariant;
  icon?: React.ComponentProps<typeof MaterialCommunityIcons>['name'];
  style?: StyleProp<ViewStyle>;
  disabled?: boolean;
}

export const CortexButton: React.FC<CortexButtonProps> = ({
  label,
  onPress,
  variant = 'primary',
  icon,
  style,
  disabled = false,
}) => {
  const scale = useSharedValue(1);

  const handlePressIn = () => {
    if (!disabled) {
      scale.value = withSpring(0.96, { damping: 14, stiffness: 220 });
    }
  };

  const handlePressOut = () => {
    if (!disabled) {
      scale.value = withSpring(1.0, { damping: 12, stiffness: 180 });
    }
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  // Functional Gradient Palettes
  const getGradientColors = (): readonly [string, string, ...string[]] => {
    switch (variant) {
      case 'primary':
        return ['#84cc16', '#22c55e', '#4ade80'];
      case 'contest':
        return ['#facc15', '#eab308', '#fbbf24'];
      case 'battle':
        return ['#38bdf8', '#0284c7', '#818cf8'];
      case 'danger':
        return ['#ef4444', '#dc2626', '#f87171'];
      case 'secondary':
        return ['#20242e', '#171920', '#1a1d26'];
      case 'ghost':
      default:
        return ['#14161d', '#0d0e12', '#171920'];
    }
  };

  const isDarkText = variant === 'primary' || variant === 'contest';

  return (
    <Pressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled}
      style={[styles.container, disabled && styles.disabled, style]}
    >
      <Animated.View style={[styles.buttonWrapper, animatedStyle]}>
        {/* Ambient Gradient Background */}
        <LinearGradient
          colors={getGradientColors()}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />

        {/* Top Glossy Highlight Rim */}
        <LinearGradient
          colors={['rgba(255, 255, 255, 0.45)', 'rgba(255, 255, 255, 0)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={styles.topRim}
        />

        {/* Inner Content Row */}
        <View style={styles.contentRow}>
          {icon && (
            <MaterialCommunityIcons
              name={icon}
              size={18}
              color={isDarkText ? '#000000' : '#ffffff'}
              style={styles.icon}
            />
          )}
          <Text
            style={[
              styles.label,
              { color: isDarkText ? '#000000' : '#ffffff' },
            ]}
          >
            {label}
          </Text>
        </View>
      </Animated.View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: 52,
  },
  disabled: {
    opacity: 0.4,
  },
  buttonWrapper: {
    width: '100%',
    height: '100%',
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  topRim: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 2,
    zIndex: 2,
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    zIndex: 10,
  },
  icon: {
    marginRight: 8,
  },
  label: {
    fontFamily: 'Outfit_800ExtraBold',
    fontSize: 14,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
});
