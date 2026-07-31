import React from 'react';
import { Pressable, Text, StyleSheet } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import * as Haptics from 'expo-haptics';

interface CortexHowToPlayButtonProps {
  onPress: () => void;
  style?: any;
}

export const CortexHowToPlayButton: React.FC<CortexHowToPlayButtonProps> = ({
  onPress,
  style,
}) => {
  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    onPress();
  };

  return (
    <Pressable style={[styles.glassBtn, style]} onPress={handlePress} hitSlop={8}>
      <MaterialCommunityIcons name="help-circle-outline" size={16} color="#ffffff" />
      <Text style={styles.glassBtnText}>How to Play?</Text>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  glassBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  glassBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#ffffff',
  },
});
