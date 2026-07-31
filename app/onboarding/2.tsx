import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import { colors } from '../../src/theme';
import { CortexButton } from '../../src/components/CortexButton';
import { CortexCard } from '../../src/components/CortexCard';

export default function OnboardingScreen2() {
  const router = useRouter();

  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.content}>
          <Text style={styles.stepIndicator}>2 of 3</Text>

          <View style={styles.centerSection}>
            <CortexCard style={styles.heroCard} padding={32}>
              <View style={styles.playerRow}>
                <Text style={styles.playerName}>Afnan (1420)</Text>
                <Text style={styles.vsLabel}>vs</Text>
                <Text style={styles.playerName}>Riya (1452)</Text>
              </View>
              <Text style={styles.cardSub}>
                Real-time 1v1 duels with server-authoritative timers and live progress bars.
              </Text>
            </CortexCard>

            <Text style={styles.title}>Battle real players</Text>
            <Text style={styles.description}>
              Compete head-to-head in 30-second math duels against opponents at your skill level.
            </Text>
          </View>

          <CortexButton
            label="Continue"
            onPress={() => router.push('/onboarding/3')}
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
  playerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  playerName: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 16,
    color: colors.textPrimary,
  },
  vsLabel: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: colors.textSecondary,
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
