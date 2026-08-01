import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Alert,
  TextInput,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  Easing,
} from 'react-native-reanimated';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

import { useUserStore } from '@/src/store/userStore';

export default function EmailScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const setLoggedInState = useUserStore((state) => state.setLoggedInState);
  const updateName = useUserStore((state) => state.updateName);

  const handleContinue = async () => {
    const userEmail = email.trim() || 'email.user@cortex.app';
    const userName = username.trim() || (userEmail.split('@')[0]) || 'Afnan';
    await updateName(userName);
    await setLoggedInState(true, userEmail, userName);
    router.replace('/(tabs)');
  };

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(auth)/login');
    }
  };

  return (
    <View style={styles.root}>
      {/* Background glow */}
      <View style={styles.glowTop} />

      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={styles.container}>

            {/* Back button */}
            <Pressable
              style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.6 }]}
              onPress={handleBack}
              accessibilityLabel="Go back"
              accessibilityRole="button"
            >
              <MaterialCommunityIcons name="arrow-left" size={22} color="#94a3b8" />
            </Pressable>

            {/* Header */}
            <View style={styles.headerSection}>
              <Text style={styles.title}>Sign in</Text>
              <Text style={styles.subtitle}>Enter your email and password to continue.</Text>
            </View>

            {/* Fields */}
            <View style={styles.fieldsSection}>
              {/* Email */}
              <View style={styles.fieldWrapper}>
                <Text style={styles.fieldLabel}>Email</Text>
                <TextInput
                  style={styles.fieldInput}
                  value={email}
                  onChangeText={setEmail}
                  placeholder="you@example.com"
                  placeholderTextColor="#334155"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  returnKeyType="next"
                  accessibilityLabel="Email address"
                />
              </View>

              {/* Password */}
              <View style={styles.fieldWrapper}>
                <Text style={styles.fieldLabel}>Password</Text>
                <View style={styles.passwordRow}>
                  <TextInput
                    style={[styles.fieldInput, styles.passwordInput]}
                    value={password}
                    onChangeText={setPassword}
                    placeholder="••••••••"
                    placeholderTextColor="#334155"
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                    autoCorrect={false}
                    returnKeyType="done"
                    onSubmitEditing={handleContinue}
                    accessibilityLabel="Password"
                  />
                  <Pressable
                    style={styles.eyeBtn}
                    onPress={() => setShowPassword((v) => !v)}
                    accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
                  >
                    <MaterialCommunityIcons
                      name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                      size={20}
                      color="#475569"
                    />
                  </Pressable>
                </View>
              </View>
            </View>

            {/* Continue button */}
            <Pressable
              style={({ pressed }) => [styles.continueBtn, pressed && styles.btnPressed]}
              onPress={handleContinue}
              accessibilityLabel="Continue"
              accessibilityRole="button"
            >
              <Text style={styles.continueBtnText}>Continue</Text>
              <MaterialCommunityIcons name="arrow-right" size={18} color="#111827" />
            </Pressable>

            {/* Sign up hint */}
            <View style={styles.signupRow}>
              <Text style={styles.signupText}>No account? </Text>
              <Pressable onPress={() => Alert.alert('Coming soon', 'Registration coming soon.')}>
                <Text style={styles.signupLink}>Create one</Text>
              </Pressable>
            </View>

          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#06070A',
  },
  flex: {
    flex: 1,
  },
  glowTop: {
    position: 'absolute',
    top: -100,
    left: '50%',
    marginLeft: -180,
    width: 360,
    height: 360,
    borderRadius: 180,
    backgroundColor: 'rgba(56, 130, 246, 0.08)',
  },
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
    maxWidth: 420,
    width: '100%',
    alignSelf: 'center',
    paddingHorizontal: 28,
    paddingTop: 16,
    paddingBottom: 32,
    justifyContent: 'center',
    gap: 32,
  },

  // Back button
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-start',
  },

  // Header
  headerSection: {
    gap: 8,
  },
  title: {
    fontSize: 30,
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 15,
    color: '#64748b',
    lineHeight: 22,
  },

  // Fields
  fieldsSection: {
    gap: 20,
  },
  fieldWrapper: {
    gap: 8,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#94a3b8',
    letterSpacing: 0.3,
  },
  fieldInput: {
    height: 52,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 16,
    fontSize: 16,
    color: '#ffffff',
    minHeight: 48,
  },
  passwordRow: {
    position: 'relative',
  },
  passwordInput: {
    paddingRight: 52,
  },
  eyeBtn: {
    position: 'absolute',
    right: 14,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    width: 36,
    alignItems: 'center',
  },

  // Continue button
  continueBtn: {
    height: 54,
    backgroundColor: '#ffffff',
    borderRadius: 100,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    minHeight: 48,
  },
  continueBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  btnPressed: {
    opacity: 0.75,
    transform: [{ scale: 0.98 }],
  },

  // Sign up
  signupRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  signupText: {
    fontSize: 14,
    color: '#475569',
  },
  signupLink: {
    fontSize: 14,
    color: '#94a3b8',
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
});
