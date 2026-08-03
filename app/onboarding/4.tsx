import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

import { colors } from '../../src/theme';
import { CortexButton } from '../../src/components/CortexButton';
import { analytics } from '../../lib/analytics';

export default function OnboardingScreen4() {
  const router = useRouter();

  const handleStartWorkout = () => {
    analytics.track('onboarding_completed');
    router.replace('/(tabs)');
  };

  const benefits = [
    {
      icon: 'target',
      color: '#84cc16',
      title: 'Sharper focus',
      sub: 'Build deep concentration through timed micro-bursts.',
    },
    {
      icon: 'lightning-bolt-outline',
      color: '#facc15',
      title: 'Faster mental math',
      sub: 'Calculate operations effortlessly under pressure.',
    },
    {
      icon: 'brain',
      color: '#38bdf8',
      title: 'Consistent brain training',
      sub: 'Form daily habits with streaks and milestone rewards.',
    },
  ];

  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.content}>
          <Text style={styles.stepIndicator}>4 of 4</Text>

          <View style={styles.centerSection}>
            <Text style={styles.title}>Replace scrolling{'\n'}with thinking.</Text>
            <Text style={styles.subtitle}>Your daily cognitive upgrade starts now.</Text>

            <View style={styles.benefitsList}>
              {benefits.map((b, i) => (
                <View key={i} style={styles.benefitRow}>
                  <View style={[styles.iconWrap, { backgroundColor: 'rgba(255, 255, 255, 0.05)' }]}>
                    <MaterialCommunityIcons name={b.icon as any} size={22} color={b.color} />
                  </View>
                  <View style={styles.benefitTextWrap}>
                    <Text style={styles.benefitTitle}>{b.title}</Text>
                    <Text style={styles.benefitSub}>{b.sub}</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>

          <CortexButton
            label="Start My First Workout"
            onPress={handleStartWorkout}
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
    width: '100%',
  },
  title: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 32,
    color: colors.textPrimary,
    letterSpacing: -0.6,
    marginBottom: 8,
    lineHeight: 38,
  },
  subtitle: {
    fontFamily: 'Inter_400Regular',
    fontSize: 15,
    color: colors.textSecondary,
    marginBottom: 28,
  },
  benefitsList: {
    width: '100%',
    gap: 16,
  },
  benefitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: '#121620',
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  benefitTextWrap: {
    flex: 1,
  },
  benefitTitle: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 15,
    color: colors.textPrimary,
    marginBottom: 2,
  },
  benefitSub: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 16,
  },
});
