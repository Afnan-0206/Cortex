import React from 'react';
import { ViewStyle, StyleProp } from 'react-native';
import { CortexButton } from './CortexButton';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

interface AmberButtonProps {
  label: string;
  onPress: () => void;
  icon?: React.ComponentProps<typeof MaterialCommunityIcons>['name'];
  sublabel?: string;
  style?: StyleProp<ViewStyle>;
  disabled?: boolean;
}

export const AmberButton: React.FC<AmberButtonProps> = ({
  label,
  onPress,
  icon,
  style,
  disabled = false,
}) => {
  return (
    <CortexButton
      label={label}
      onPress={onPress}
      icon={icon}
      style={style}
      disabled={disabled}
      variant="primary"
    />
  );
};
