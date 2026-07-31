import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { NoiseBackground } from './ui/noise-background';

export default function NoiseBackgroundDemo() {
  return (
    <View style={styles.demoContainer}>
      <NoiseBackground
        containerStyle={styles.noiseContainer}
        gradientColors={[
          'rgba(255, 100, 150, 0.4)',
          'rgba(100, 150, 255, 0.35)',
          'rgba(255, 200, 100, 0.3)',
        ]}
      >
        <Pressable style={styles.buttonInner}>
          <Text style={styles.buttonText}>Start publishing &rarr;</Text>
        </Pressable>
      </NoiseBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  demoContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  noiseContainer: {
    borderRadius: 30,
    padding: 3,
  },
  buttonInner: {
    height: 48,
    paddingHorizontal: 24,
    borderRadius: 25,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    fontFamily: 'Outfit_800ExtraBold',
    color: '#000000',
    fontSize: 14,
  },
});
