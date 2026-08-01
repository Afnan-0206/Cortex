/**
 * SocialAuthRow
 *
 * Renders only Google and Apple sign-in buttons as full-width bordered pills.
 * Facebook / Twitter removed — fewer OAuth providers = smaller attack surface.
 */
import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import Svg, { Path, G, Circle } from 'react-native-svg';

interface SocialAuthRowProps {
  onGooglePress: () => void;
  onApplePress: () => void;
  dividerText: string;
  /** If true the buttons show a subtle loading opacity */
  disabled?: boolean;
}

function GoogleIcon() {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24">
      <Path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
      <Path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
      <Path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05" />
      <Path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335" />
    </Svg>
  );
}

function AppleIcon() {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24">
      <Path
        d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.36c.65-.8 1.1-1.92.97-3.04-.95.04-2.1.64-2.78 1.44-.61.71-1.14 1.86-.99 2.96 1.06.08 2.14-.54 2.8-1.36"
        fill="#111827"
      />
    </Svg>
  );
}

export function SocialAuthRow({ onGooglePress, onApplePress, dividerText, disabled }: SocialAuthRowProps) {
  return (
    <View style={styles.container}>
      {/* ── Divider ── */}
      <View style={styles.dividerRow}>
        <View style={styles.line} />
        <Text style={styles.dividerText}>{dividerText}</Text>
        <View style={styles.line} />
      </View>

      {/* ── Google Pill ── */}
      <Pressable
        style={({ pressed }) => [styles.socialBtn, pressed && styles.pressed]}
        onPress={onGooglePress}
        disabled={disabled}
      >
        <GoogleIcon />
        <Text style={styles.socialBtnText}>Continue with Google</Text>
      </Pressable>

      {/* ── Apple Pill ── */}
      <Pressable
        style={({ pressed }) => [styles.socialBtn, styles.appleBtn, pressed && styles.pressed]}
        onPress={onApplePress}
        disabled={disabled}
      >
        <AppleIcon />
        <Text style={[styles.socialBtnText, styles.appleBtnText]}>Continue with Apple</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 12,
    width: '100%',
    gap: 10,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  line: {
    flex: 1,
    height: 1,
    backgroundColor: '#E8EDF5',
  },
  dividerText: {
    marginHorizontal: 14,
    fontSize: 12,
    fontWeight: '500',
    fontFamily: 'Inter_500Medium',
    color: '#94A3B8',
    letterSpacing: 0.3,
  },

  // Full-width bordered pill
  socialBtn: {
    height: 50,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#DDE3EE',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: '#FFFFFF',
  },
  appleBtn: {
    backgroundColor: '#111827',
    borderColor: '#111827',
  },
  pressed: {
    opacity: 0.75,
  },
  socialBtnText: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Inter_600SemiBold',
    color: '#1E293B',
    letterSpacing: 0.1,
  },
  appleBtnText: {
    color: '#FFFFFF',
  },
});
