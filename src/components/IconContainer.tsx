import React from 'react';
import { View, StyleSheet } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { colors } from '../theme';

type MCIcon = React.ComponentProps<typeof MaterialCommunityIcons>['name'];

interface IconContainerProps {
  icon: MCIcon;
  size?: number;
  iconSize?: number;
  iconColor?: string;
  borderRadius?: number;
  backgroundColor?: string;
}

export const IconContainer: React.FC<IconContainerProps> = ({
  icon,
  size = 44,
  iconSize = 24,
  iconColor = colors.primary,
  borderRadius = 12,
  backgroundColor = 'rgba(124, 92, 255, 0.1)',
}) => {
  return (
    <View
      style={[
        styles.container,
        {
          width: size,
          height: size,
          borderRadius,
          backgroundColor,
        },
      ]}
    >
      <MaterialCommunityIcons
        name={icon}
        size={iconSize}
        color={iconColor}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 2,
  },
});
