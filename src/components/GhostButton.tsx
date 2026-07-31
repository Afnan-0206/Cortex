import React from 'react';
import { StyleSheet, Text, Pressable, ViewStyle, StyleProp } from 'react-native';
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

interface GhostButtonProps {
  label: string;
  onPress: () => void;
  icon?: MCIcon;
  style?: StyleProp<ViewStyle>;
  textColor?: string;
}

export const GhostButton: React.FC<GhostButtonProps> = ({
  label,
  onPress,
  icon,
  style,
  textColor = colors.textMuted,
}) => {
  const opacity = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  const handlePressIn = () => {
    opacity.value = withTiming(0.65, { duration: 100, easing: Easing.out(Easing.ease) });
  };

  const handlePressOut = () => {
    opacity.value = withTiming(1.0, { duration: 140, easing: Easing.out(Easing.quad) });
  };

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  };

  return (
    <AnimatedPressable
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[styles.container, animatedStyle, style]}
    >
      {icon && (
        <MaterialCommunityIcons
          name={icon}
          size={18}
          color={textColor}
          style={styles.icon}
        />
      )}
      <Text style={[styles.label, { color: textColor }]}>{label}</Text>
    </AnimatedPressable>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 44,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
  },
  label: {
    fontFamily: 'Inter_500Medium',
    fontSize: 14,
  },
  icon: { marginRight: 6 },
});

