import React from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import {
  useFonts,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  Inter_800ExtraBold,
  Inter_900Black,
} from '@expo-google-fonts/inter';
import { BebasNeue_400Regular } from '@expo-google-fonts/bebas-neue';
import {
  Outfit_700Bold,
  Outfit_800ExtraBold,
  Outfit_900Black,
} from '@expo-google-fonts/outfit';
import {
  SpaceGrotesk_700Bold,
  SpaceGrotesk_600SemiBold,
} from '@expo-google-fonts/space-grotesk';

import { useAuthGate } from '../lib/hooks/useAuthGate';
import { ErrorBoundary } from '../src/components/ErrorBoundary';

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    Inter_800ExtraBold,
    Inter_900Black,
    BebasNeue_400Regular,
    Outfit_700Bold,
    Outfit_800ExtraBold,
    Outfit_900Black,
    SpaceGrotesk_700Bold,
    SpaceGrotesk_600SemiBold,
  });

  useAuthGate();

  if (!fontsLoaded) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#84cc16" />
      </View>
    );
  }

  return (
    <ErrorBoundary>
      <SafeAreaProvider>
        <StatusBar style="light" />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: '#0d0e12' },
            animation: 'fade',
          }}
        />
      </SafeAreaProvider>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: '#0d0e12',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
