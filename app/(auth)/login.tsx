/**
 * app/(auth)/login.tsx
 *
 * Three-screen auth flow:
 *   welcome → signup / signin → (forgot password)
 *
 * Security:
 *   • All Supabase calls are awaited and errors are presented as user-friendly
 *     messages — never logging tokens, sessions, or passwords.
 *   • Inputs are trimmed before network calls.
 *   • Password minimum 8 characters enforced client-side (Supabase enforces server-side too).
 *   • Google OAuth uses PKCE (configured in lib/supabase.ts).
 *   • On any auth success the listener in useEffect fires and navigates — we never
 *     manually setSession from the form path.
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  SafeAreaView,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  Dimensions,
  Animated,
} from 'react-native';
import { useRouter } from 'expo-router';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { LinearGradient } from 'expo-linear-gradient';
import { AuthBackground } from '@/src/components/AuthBackground';
import { FloatingLabelInput } from '@/src/components/FloatingLabelInput';
import { SocialAuthRow } from '@/src/components/SocialAuthRow';
import { supabase } from '@/lib/supabase';
import { signInWithGoogle } from '@/lib/auth';
import { useUserStore } from '@/src/store/userStore';

const { height: H } = Dimensions.get('window');

// ─────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function sanitize(str: string): string {
  // Trim and strip leading/trailing unsafe whitespace
  return str.trim().replace(/[\u200B-\u200D\uFEFF]/g, '');
}

function friendlyAuthError(msg: string): string {
  if (msg.includes('Invalid login'))    return 'Incorrect email or password.';
  if (msg.includes('Email not confirmed')) return 'Please confirm your email first.';
  if (msg.includes('already registered')) return 'An account with this email already exists.';
  if (msg.includes('rate limit'))       return 'Too many attempts. Please wait a moment.';
  if (msg.includes('network'))          return 'No internet connection. Check your network.';
  return 'Something went wrong. Please try again.';
}

// ─────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────
type AuthMode = 'welcome' | 'signin' | 'signup' | 'forgot';

// ─────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────
export default function LoginScreen() {
  const router = useRouter();

  const [mode, setMode]         = useState<AuthMode>('welcome');
  const [loading, setLoading]   = useState(false);

  // Form
  const [fullName, setFullName]   = useState('');
  const [email, setEmail]         = useState('');
  const [password, setPassword]   = useState('');
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  // Validation
  const [nameErr, setNameErr]     = useState('');
  const [emailErr, setEmailErr]   = useState('');
  const [passErr, setPassErr]     = useState('');
  const [globalErr, setGlobalErr] = useState('');

  const { setLoggedInState, updateName } = useUserStore();

  // Slide animation for mode transitions
  const slideAnim = useRef(new Animated.Value(0)).current;

  const switchMode = (next: AuthMode) => {
    Animated.sequence([
      Animated.timing(slideAnim, { toValue: 30, duration: 100, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0,  duration: 180, useNativeDriver: true }),
    ]).start();
    setMode(next);
    setGlobalErr('');
    setNameErr(''); setEmailErr(''); setPassErr('');
  };

  // ── Auth state listener ─────────────────────────────
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (!session?.user) return;
        const u = session.user;
        const name  = u.user_metadata?.full_name
                   ?? u.user_metadata?.name
                   ?? (u.email?.split('@')[0] ?? 'User');
        const userEmail = u.email ?? '';
        await updateName(name);
        await setLoggedInState(true, userEmail, name);
        router.replace('/(tabs)');
      }
    );
    return () => subscription.unsubscribe();
  }, []);

  // ── Sign-in ─────────────────────────────────────────
  const handleSignIn = async () => {
    setGlobalErr('');
    let ok = true;
    const cleanEmail = sanitize(email);
    const cleanPass  = sanitize(password);

    if (!cleanEmail || !EMAIL_RE.test(cleanEmail)) {
      setEmailErr('Enter a valid email address.'); ok = false;
    } else setEmailErr('');

    if (!cleanPass) {
      setPassErr('Password is required.'); ok = false;
    } else setPassErr('');

    if (!ok) return;
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password: cleanPass,
      });

      if (error) {
        setGlobalErr(friendlyAuthError(error.message));
        return;
      }

      // onAuthStateChange listener handles navigation
      if (!data.session) {
        setGlobalErr('Sign-in failed. Please try again.');
      }
    } catch (e: any) {
      setGlobalErr(friendlyAuthError(e?.message ?? ''));
    } finally {
      setLoading(false);
    }
  };

  // ── Sign-up ─────────────────────────────────────────
  const handleSignUp = async () => {
    setGlobalErr('');
    let ok = true;
    const cleanName  = sanitize(fullName);
    const cleanEmail = sanitize(email);
    const cleanPass  = sanitize(password);

    if (!cleanName) {
      setNameErr('Full name is required.'); ok = false;
    } else if (cleanName.length < 2) {
      setNameErr('Name must be at least 2 characters.'); ok = false;
    } else setNameErr('');

    if (!cleanEmail || !EMAIL_RE.test(cleanEmail)) {
      setEmailErr('Enter a valid email address.'); ok = false;
    } else setEmailErr('');

    if (!cleanPass) {
      setPassErr('Password is required.'); ok = false;
    } else if (cleanPass.length < 8) {
      setPassErr('Password must be at least 8 characters.'); ok = false;
    } else setPassErr('');

    if (!agreeTerms) {
      Alert.alert('Terms Required', 'Please agree to the processing of personal data to continue.');
      return;
    }
    if (!ok) return;
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signUp({
        email: cleanEmail,
        password: cleanPass,
        options: {
          data: { full_name: cleanName },
          // Don't log the email — it's in the encrypted token
        },
      });

      if (error) {
        setGlobalErr(friendlyAuthError(error.message));
        return;
      }

      if (data.user && !data.session) {
        // Email confirmation required — tell the user
        Alert.alert(
          '✉️ Confirm Your Email',
          `We've sent a confirmation link to ${cleanEmail}. Click it to activate your account.`,
          [{ text: 'OK', onPress: () => switchMode('signin') }]
        );
        return;
      }

      // If confirmations are disabled in Supabase, session arrives immediately
      // → listener handles navigation
    } catch (e: any) {
      setGlobalErr(friendlyAuthError(e?.message ?? ''));
    } finally {
      setLoading(false);
    }
  };

  // ── Google OAuth ─────────────────────────────────────
  const handleGoogle = async () => {
    setLoading(true);
    setGlobalErr('');
    try {
      await signInWithGoogle();
      // onAuthStateChange listener handles navigation after OAuth completes
    } catch (e: any) {
      if (e?.message?.includes('cancel') || e?.message?.includes('dismiss')) {
        // User dismissed the browser — not an error
      } else {
        setGlobalErr(friendlyAuthError(e?.message ?? ''));
      }
    } finally {
      setLoading(false);
    }
  };

  // ── Forgot password ──────────────────────────────────
  const handleForgotPassword = async (resetEmail: string) => {
    const clean = sanitize(resetEmail);
    if (!clean || !EMAIL_RE.test(clean)) {
      setEmailErr('Enter a valid email address.');
      return;
    }
    setLoading(true);
    setGlobalErr('');
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(clean, {
        redirectTo: 'cortex://reset-password',
      });
      if (error) { setGlobalErr(friendlyAuthError(error.message)); return; }
      Alert.alert(
        '📩 Reset Link Sent',
        `Check ${clean} for a password reset link.`,
        [{ text: 'OK', onPress: () => switchMode('signin') }]
      );
    } catch (e: any) {
      setGlobalErr(friendlyAuthError(e?.message ?? ''));
    } finally {
      setLoading(false);
    }
  };

  // ──────────────────────────────────────────────────────────
  // RENDER
  // ──────────────────────────────────────────────────────────
  return (
    <View style={styles.root}>
      <AuthBackground />

      {/* ══════════════════════════════════════════════════ */}
      {/* SCREEN 1 — WELCOME                                 */}
      {/* ══════════════════════════════════════════════════ */}
      {mode === 'welcome' && (
        <View style={StyleSheet.absoluteFill}>
          {/* Hero text block at ~30% from top */}
          <View style={styles.heroBlock}>
            <Text style={styles.heroTitle}>Welcome Back!</Text>
            <Text style={styles.heroSub}>
              Enter personal details to your{'\n'}Cortex account
            </Text>
          </View>

          {/* Bottom action bar */}
          <View style={styles.dockBar}>
            <Pressable
              style={styles.signInTap}
              onPress={() => switchMode('signin')}
            >
              <Text style={styles.signInLabel}>Sign in</Text>
            </Pressable>

            <Pressable
              style={styles.signUpPill}
              onPress={() => switchMode('signup')}
            >
              <Text style={styles.signUpLabel}>Sign up</Text>
            </Pressable>
          </View>
        </View>
      )}

      {/* ══════════════════════════════════════════════════ */}
      {/* SCREEN 2 — SIGN UP                                 */}
      {/* ══════════════════════════════════════════════════ */}
      {mode === 'signup' && (
        <SafeAreaView style={styles.flex}>
          <KeyboardAvoidingView
            style={styles.flex}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={0}
          >
            <BackButton onPress={() => switchMode('welcome')} />

            <View style={styles.sheet}>
              <ScrollView
                contentContainerStyle={styles.sheetContent}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
              >
                <Text style={styles.sheetTitle}>Get Started</Text>
                <Text style={styles.sheetSub}>Create your free Cortex account</Text>

                {/* Google first — reduces friction */}
                <SocialAuthRow
                  dividerText="Quick sign up"
                  onGooglePress={handleGoogle}
                  onApplePress={() => {}}
                  disabled={loading}
                />

                <OrDivider />

                {/* Email form */}
                <FloatingLabelInput
                  label="Full Name"
                  placeholder="Your name"
                  value={fullName}
                  onChangeText={setFullName}
                  error={nameErr}
                  autoCapitalize="words"
                  textContentType="name"
                />
                <FloatingLabelInput
                  label="Email"
                  placeholder="you@example.com"
                  value={email}
                  onChangeText={setEmail}
                  error={emailErr}
                  keyboardType="email-address"
                  textContentType="emailAddress"
                />
                <FloatingLabelInput
                  label="Password"
                  placeholder="Min. 8 characters"
                  value={password}
                  onChangeText={setPassword}
                  error={passErr}
                  secureTextEntry
                  textContentType="newPassword"
                />

                {/* Password strength hint */}
                {password.length > 0 && (
                  <PasswordStrength password={password} />
                )}

                {/* Agree to terms */}
                <Pressable style={styles.checkRow} onPress={() => setAgreeTerms(!agreeTerms)}>
                  <View style={[styles.checkbox, agreeTerms && styles.checkboxOn]}>
                    {agreeTerms && (
                      <MaterialCommunityIcons name="check" size={12} color="#FFFFFF" />
                    )}
                  </View>
                  <Text style={styles.checkLabel}>
                    I agree to the{' '}
                    <Text style={styles.link}>processing of Personal data</Text>
                  </Text>
                </Pressable>

                {globalErr ? <ErrorBanner msg={globalErr} /> : null}

                <PrimaryButton
                  label="Create Account"
                  onPress={handleSignUp}
                  loading={loading}
                />

                <View style={styles.footerRow}>
                  <Text style={styles.footerGray}>Already have an account? </Text>
                  <Pressable onPress={() => switchMode('signin')}>
                    <Text style={styles.link}>Sign in</Text>
                  </Pressable>
                </View>
              </ScrollView>
            </View>
          </KeyboardAvoidingView>
        </SafeAreaView>
      )}

      {/* ══════════════════════════════════════════════════ */}
      {/* SCREEN 3 — SIGN IN                                 */}
      {/* ══════════════════════════════════════════════════ */}
      {mode === 'signin' && (
        <SafeAreaView style={styles.flex}>
          <KeyboardAvoidingView
            style={styles.flex}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          >
            <BackButton onPress={() => switchMode('welcome')} />

            <View style={styles.sheet}>
              <ScrollView
                contentContainerStyle={styles.sheetContent}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
              >
                <Text style={styles.sheetTitle}>Welcome back</Text>
                <Text style={styles.sheetSub}>Sign in to continue to Cortex</Text>

                <SocialAuthRow
                  dividerText="Quick sign in"
                  onGooglePress={handleGoogle}
                  onApplePress={() => {}}
                  disabled={loading}
                />

                <OrDivider />

                <FloatingLabelInput
                  label="Email"
                  placeholder="you@example.com"
                  value={email}
                  onChangeText={setEmail}
                  error={emailErr}
                  keyboardType="email-address"
                  textContentType="emailAddress"
                />
                <FloatingLabelInput
                  label="Password"
                  placeholder="Your password"
                  value={password}
                  onChangeText={setPassword}
                  error={passErr}
                  secureTextEntry
                  textContentType="password"
                />

                {/* Options row */}
                <View style={styles.optionsRow}>
                  <Pressable style={styles.checkRow} onPress={() => setRememberMe(!rememberMe)}>
                    <View style={[styles.checkbox, rememberMe && styles.checkboxOn]}>
                      {rememberMe && (
                        <MaterialCommunityIcons name="check" size={12} color="#FFFFFF" />
                      )}
                    </View>
                    <Text style={styles.checkLabel}>Remember me</Text>
                  </Pressable>
                  <Pressable onPress={() => switchMode('forgot')}>
                    <Text style={styles.link}>Forgot password?</Text>
                  </Pressable>
                </View>

                {globalErr ? <ErrorBanner msg={globalErr} /> : null}

                <PrimaryButton
                  label="Sign in"
                  onPress={handleSignIn}
                  loading={loading}
                />

                <View style={styles.footerRow}>
                  <Text style={styles.footerGray}>Don't have an account? </Text>
                  <Pressable onPress={() => switchMode('signup')}>
                    <Text style={styles.link}>Sign up</Text>
                  </Pressable>
                </View>
              </ScrollView>
            </View>
          </KeyboardAvoidingView>
        </SafeAreaView>
      )}

      {/* ══════════════════════════════════════════════════ */}
      {/* SCREEN 4 — FORGOT PASSWORD                         */}
      {/* ══════════════════════════════════════════════════ */}
      {mode === 'forgot' && (
        <SafeAreaView style={styles.flex}>
          <KeyboardAvoidingView
            style={styles.flex}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          >
            <BackButton onPress={() => switchMode('signin')} />

            <View style={styles.sheet}>
              <ScrollView
                contentContainerStyle={styles.sheetContent}
                keyboardShouldPersistTaps="handled"
              >
                <Text style={styles.sheetTitle}>Reset Password</Text>
                <Text style={styles.sheetSub}>
                  Enter your email and we'll send you a secure reset link.
                </Text>

                <FloatingLabelInput
                  label="Email"
                  placeholder="you@example.com"
                  value={email}
                  onChangeText={setEmail}
                  error={emailErr}
                  keyboardType="email-address"
                  textContentType="emailAddress"
                />

                {globalErr ? <ErrorBanner msg={globalErr} /> : null}

                <PrimaryButton
                  label="Send Reset Link"
                  onPress={() => handleForgotPassword(email)}
                  loading={loading}
                />

                <View style={styles.footerRow}>
                  <Text style={styles.footerGray}>Remembered it? </Text>
                  <Pressable onPress={() => switchMode('signin')}>
                    <Text style={styles.link}>Sign in</Text>
                  </Pressable>
                </View>
              </ScrollView>
            </View>
          </KeyboardAvoidingView>
        </SafeAreaView>
      )}
    </View>
  );
}

// ─────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────

function BackButton({ onPress }: { onPress: () => void }) {
  return (
    <View style={styles.topBar}>
      <Pressable style={({ pressed }) => [styles.backBadge, pressed && { opacity: 0.7 }]} onPress={onPress}>
        <MaterialCommunityIcons name="chevron-left" size={20} color="#FFFFFF" />
        <Text style={styles.backText}>Back</Text>
      </Pressable>
    </View>
  );
}

function PrimaryButton({ label, onPress, loading }: { label: string; onPress: () => void; loading?: boolean }) {
  return (
    <Pressable
      style={({ pressed }) => [styles.primaryBtn, pressed && { opacity: 0.85 }]}
      onPress={onPress}
      disabled={loading}
    >
      <LinearGradient
        colors={['#4F7AFA', '#2B52E0']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.primaryBtnGrad}
      >
        {loading
          ? <ActivityIndicator color="#FFFFFF" />
          : <Text style={styles.primaryBtnText}>{label}</Text>
        }
      </LinearGradient>
    </Pressable>
  );
}

function OrDivider() {
  return (
    <View style={styles.orRow}>
      <View style={styles.orLine} />
      <Text style={styles.orText}>or</Text>
      <View style={styles.orLine} />
    </View>
  );
}

function ErrorBanner({ msg }: { msg: string }) {
  return (
    <View style={styles.errorBanner}>
      <MaterialCommunityIcons name="alert-circle-outline" size={16} color="#EF4444" />
      <Text style={styles.errorBannerText}>{msg}</Text>
    </View>
  );
}

// Simple password strength bar
function PasswordStrength({ password }: { password: string }) {
  const len  = password.length;
  const has  = (re: RegExp) => re.test(password);
  const score = [
    len >= 8,
    has(/[A-Z]/),
    has(/[0-9]/),
    has(/[^A-Za-z0-9]/),
  ].filter(Boolean).length;

  const label  = ['Weak', 'Fair', 'Good', 'Strong'][score - 1] ?? 'Too short';
  const colors = ['#EF4444', '#F59E0B', '#3B82F6', '#22C55E'];
  const color  = colors[score - 1] ?? '#CBD5E1';

  return (
    <View style={styles.strengthRow}>
      {[0, 1, 2, 3].map(i => (
        <View
          key={i}
          style={[
            styles.strengthSegment,
            { backgroundColor: i < score ? color : '#E2E8F0' },
          ]}
        />
      ))}
      <Text style={[styles.strengthLabel, { color }]}>{label}</Text>
    </View>
  );
}

// ─────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0B112C', width: '100%', height: '100%', overflow: 'hidden' },
  flex: { flex: 1, width: '100%' },

  // ── Welcome ─────────────────────────────────────────
  heroBlock: {
    position: 'absolute',
    top: '28%',
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingHorizontal: 28,
  },
  heroTitle: {
    fontSize: 40,
    fontWeight: '800',
    fontFamily: 'Inter_800ExtraBold',
    color: '#FFFFFF',
    textAlign: 'center',
    letterSpacing: -0.8,
    marginBottom: 12,
    ...Platform.select({
      web:    { textShadow: '0px 2px 6px rgba(0,0,0,0.3)' },
      default: {
        textShadowColor: 'rgba(0,0,0,0.3)',
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 6,
      },
    }),
  },
  heroSub: {
    fontSize: 16,
    fontFamily: 'Inter_400Regular',
    color: 'rgba(255,255,255,0.85)',
    textAlign: 'center',
    lineHeight: 24,
  },

  dockBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    width: '100%',
    height: 84,
    backgroundColor: '#0B112C',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingLeft: 36,
  },
  signInTap: { paddingVertical: 16, paddingRight: 20 },
  signInLabel: {
    fontSize: 17,
    fontWeight: '700',
    fontFamily: 'Inter_700Bold',
    color: '#FFFFFF',
  },
  signUpPill: {
    width: '54%',
    height: 84,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 38,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      web:    { boxShadow: '-6px -4px 14px rgba(0,0,0,0.20)' },
      default: {
        shadowColor: '#000',
        shadowOffset: { width: -6, height: -4 },
        shadowOpacity: 0.2,
        shadowRadius: 14,
        elevation: 12,
      },
    }),
  },
  signUpLabel: {
    fontSize: 17,
    fontWeight: '800',
    fontFamily: 'Inter_800ExtraBold',
    color: '#2B52E0',
    letterSpacing: 0.1,
  },

  // ── Sheet (Screens 2–4) ──────────────────────────────
  topBar: {
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 16,
  },
  backBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 22,
    backgroundColor: 'rgba(8, 14, 52, 0.68)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
    gap: 2,
  },
  backText: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Inter_600SemiBold',
    color: '#FFFFFF',
  },

  sheet: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 36,
    borderTopRightRadius: 36,
    overflow: 'hidden',
  },
  sheetContent: {
    paddingHorizontal: 26,
    paddingTop: 36,
    paddingBottom: 52,
  },
  sheetTitle: {
    fontSize: 28,
    fontWeight: '800',
    fontFamily: 'Inter_800ExtraBold',
    color: '#2B52E0',
    textAlign: 'center',
    letterSpacing: -0.5,
    marginBottom: 6,
  },
  sheetSub: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: '#94A3B8',
    textAlign: 'center',
    marginBottom: 20,
  },

  // ── Primary button ───────────────────────────────────
  primaryBtn: {
    marginTop: 18,
    marginBottom: 6,
    borderRadius: 14,
    overflow: 'hidden',
    ...Platform.select({
      web:    { boxShadow: '0px 6px 12px rgba(43,82,224,0.32)' },
      default: {
        shadowColor: '#2B52E0',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.32,
        shadowRadius: 12,
        elevation: 8,
      },
    }),
  },
  primaryBtnGrad: {
    height: 54,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBtnText: {
    fontSize: 16,
    fontWeight: '700',
    fontFamily: 'Inter_700Bold',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },

  // ── Options / checkboxes ─────────────────────────────
  optionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginVertical: 8,
  },
  checkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    marginVertical: 12,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxOn: {
    backgroundColor: '#2B52E0',
    borderColor: '#2B52E0',
  },
  checkLabel: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    color: '#64748B',
    flex: 1,
  },
  link: {
    fontSize: 13,
    fontWeight: '700',
    fontFamily: 'Inter_700Bold',
    color: '#2B52E0',
  },

  // ── Or divider ───────────────────────────────────────
  orRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 14,
    gap: 10,
  },
  orLine: { flex: 1, height: 1, backgroundColor: '#E8EDF5' },
  orText: {
    fontSize: 12,
    fontFamily: 'Inter_500Medium',
    color: '#94A3B8',
    letterSpacing: 0.5,
  },

  // ── Error banner ─────────────────────────────────────
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 10,
    padding: 12,
    marginTop: 8,
  },
  errorBannerText: {
    fontSize: 13,
    fontFamily: 'Inter_500Medium',
    color: '#DC2626',
    flex: 1,
  },

  // ── Password strength ────────────────────────────────
  strengthRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: -4,
    marginBottom: 8,
  },
  strengthSegment: {
    flex: 1,
    height: 4,
    borderRadius: 2,
  },
  strengthLabel: {
    fontSize: 11,
    fontFamily: 'Inter_600SemiBold',
    marginLeft: 2,
    minWidth: 44,
  },

  // ── Footer ───────────────────────────────────────────
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 18,
  },
  footerGray: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    color: '#94A3B8',
  },
});
