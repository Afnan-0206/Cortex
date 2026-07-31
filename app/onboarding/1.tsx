import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import { colors } from '../../src/theme';
import { CortexButton } from '../../src/components/CortexButton';
import { CortexCard } from '../../src/components/CortexCard';

export default function OnboardingScreen1() {
  const router = useRouter();

  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.content}>
          <Text style={styles.stepIndicator}>1 of 3</Text>

          <View style={styles.centerSection}>
            <CortexCard style={styles.heroCard} padding={32}>
              <Text style={styles.cardHeader}>Mental Performance</Text>
              <Text style={styles.cardSub}>
                Built to replace passive doomscrolling with sharp, focused cognitive workouts.
              </Text>
            </CortexCard>

            <Text style={styles.title}>Train your brain</Text>
            <Text style={styles.description}>
              Daily 2-minute mental math and logic challenges designed to build consistency.
            </Text>
          </View>

          <CortexButton
            label="Continue"
            onPress={() => router.push('/onboarding/2')}
            variant="primary"
          />
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  safeArea: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingVertical: 20,
    justifyContent: 'space-between',
  },
  stepIndicator: {
    fontFamily: 'Inter_500Medium',
    fontSize: 13,
    color: colors.textSecondary,
  },
  centerSection: {
    alignItems: 'flex-start',
  },
  heroCard: {
    width: '100%',
    marginBottom: 32,
  },
  cardHeader: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 22,
    color: colors.textPrimary,
    marginBottom: 8,
  },
  cardSub: {
    fontFamily: 'Inter_400Regular',
    fontSize: 15,
    color: colors.textSecondary,
    lineHeight: 22,
  },
  title: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 32,
    color: colors.textPrimary,
    letterSpacing: -0.6,
    marginBottom: 8,
  },
  description: {
    fontFamily: 'Inter_400Regular',
    fontSize: 16,
    color: colors.textSecondary,
    lineHeight: 24,
  },
});
