import React from 'react';
import { ViewStyle, StyleProp } from 'react-native';
import { CortexCard } from './CortexCard';

interface NeuroCardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  padding?: number;
  onPress?: () => void;
  amberGlow?: boolean;
  blueGlow?: boolean;
}

export const NeuroCard: React.FC<NeuroCardProps> = ({
  children,
  style,
  padding = 20,
  onPress,
}) => {
  return (
    <CortexCard style={style} padding={padding} onPress={onPress}>
      {children}
    </CortexCard>
  );
};
