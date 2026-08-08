import React from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import {
  useFonts,
  Inter_400Regular,
  Inter_600SemiBold,
  Inter_800ExtraBold,
} from '@expo-google-fonts/inter';
import { BebasNeue_400Regular } from '@expo-google-fonts/bebas-neue';
import { Outfit_800ExtraBold, Outfit_900Black } from '@expo-google-fonts/outfit';

import { useAuthGate } from '../lib/hooks/useAuthGate';
import { ErrorBoundary } from '../src/components/ErrorBoundary';
import { ensureDailyRemindersScheduled } from '../lib/notifications';

// Lazy-load non-critical fonts
const loadAdditionalFonts = () => {
  import('@expo-google-fonts/inter').then(({ Inter_500Medium, Inter_700Bold, Inter_900Black }) => {
    useFonts({
      Inter_500Medium,
      Inter_700Bold,
      Inter_900Black,
    });
  }).catch(() => {});
  
  import('@expo-google-fonts/outfit').then(({ Outfit_700Bold }) => {
    useFonts({ Outfit_700Bold });
  }).catch(() => {});
  
  import('@expo-google-fonts/space-grotesk').then(({ SpaceGrotesk_700Bold, SpaceGrotesk_600SemiBold }) => {
    useFonts({ SpaceGrotesk_700Bold, SpaceGrotesk_600SemiBold });
  }).catch(() => {});
};

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_600SemiBold,
    Inter_800ExtraBold,
    BebasNeue_400Regular,
    Outfit_800ExtraBold,
    Outfit_900Black,
  });

  useAuthGate();

  React.useEffect(() => {
    ensureDailyRemindersScheduled().catch(() => {});
    // Defer non-critical font loading
    const timer = setTimeout(loadAdditionalFonts, 1000);
    return () => clearTimeout(timer);
  }, []);

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
