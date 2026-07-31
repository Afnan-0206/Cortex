import React from 'react';
import { StyleSheet, Text, Pressable, ViewStyle, StyleProp, View } from 'react-native';
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

interface SecondaryButtonProps {
  label: string;
  onPress: () => void;
  icon?: MCIcon;
  style?: StyleProp<ViewStyle>;
  fullWidth?: boolean;
}

export const SecondaryButton: React.FC<SecondaryButtonProps> = ({
  label,
  onPress,
  icon,
  style,
  fullWidth = true,
}) => {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withTiming(0.98, { duration: 120, easing: Easing.out(Easing.ease) });
  };

  const handlePressOut = () => {
    scale.value = withTiming(1.0, { duration: 160, easing: Easing.out(Easing.quad) });
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
      style={[animatedStyle, fullWidth && styles.fullWidth, style]}
    >
      <View style={styles.container}>
        {icon && (
          <MaterialCommunityIcons
            name={icon}
            size={20}
            color={colors.glowViolet}
            style={styles.icon}
          />
        )}
        <Text style={styles.label}>{label}</Text>
      </View>
    </AnimatedPressable>
  );
};

const styles = StyleSheet.create({
  fullWidth: { width: '100%' },
  container: {
    height: 52,
    borderRadius: 20,
    backgroundColor: colors.bgDeep,
    borderWidth: 1,
    borderColor: 'rgba(242, 241, 247, 0.08)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  label: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 15,
    color: colors.textPrimary,
  },
  icon: { marginRight: 8 },
});

