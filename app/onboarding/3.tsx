import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import { colors } from '../../src/theme';
import { CortexButton } from '../../src/components/CortexButton';
import { useAuthStore } from '../../src/store/authStore';

export default function OnboardingScreen3() {
  const router = useRouter();
  const [username, setUsername] = useState('Afnan');
  const auth = useAuthStore();

  const handleFinish = () => {
    if (auth.profile) {
      auth.profile.name = username.trim() || 'Afnan';
    }
    router.replace('/(tabs)');
  };

  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.content}>
          <Text style={styles.stepIndicator}>3 of 3</Text>

          <View style={styles.centerSection}>
            <Text style={styles.title}>Climb the leaderboard</Text>
            <Text style={styles.description}>
              Earn XP, improve your Elo rating, and track accuracy trends over time.
            </Text>

            <View style={styles.inputWrap}>
              <Text style={styles.inputLabel}>Choose your username</Text>
              <TextInput
                value={username}
                onChangeText={setUsername}
                placeholder="Enter username"
                placeholderTextColor={colors.textMuted}
                style={styles.textInput}
                autoCapitalize="none"
              />
            </View>
          </View>

          <CortexButton
            label="Get Started"
            onPress={handleFinish}
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
  },
  description: {
    fontFamily: 'Inter_400Regular',
    fontSize: 16,
    color: colors.textSecondary,
    lineHeight: 24,
    marginBottom: 36,
  },
  inputWrap: {
    width: '100%',
  },
  inputLabel: {
    fontFamily: 'Inter_500Medium',
    fontSize: 14,
    color: colors.textPrimary,
    marginBottom: 8,
  },
  textInput: {
    width: '100%',
    height: 52,
    borderRadius: 16,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 16,
    fontFamily: 'Inter_500Medium',
    fontSize: 16,
    color: colors.textPrimary,
  },
});
