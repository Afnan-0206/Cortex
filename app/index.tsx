import React, { useEffect, useState, Component, ErrorInfo, ReactNode } from 'react';
import { View, Text, StyleSheet, Pressable, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withDelay,
  withRepeat,
  withSequence,
  Easing,
  runOnJS,
} from 'react-native-reanimated';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { supabase } from '../lib/supabase';
import { useUserStore } from '../src/store/userStore';

const { width } = Dimensions.get('window');

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class CrashBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('App Startup Crash Caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>Startup Error</Text>
          <Text style={styles.errorMessage}>
            {this.state.error?.message || 'An unexpected error occurred on app launch.'}
          </Text>
        </View>
      );
    }
    return this.props.children;
  }
}

function EntryLogoScreenContent() {
  const router = useRouter();
  const [startupError, setStartupError] = useState<string | null>(null);

  // Animation values - hooks called unconditionally at top level
  const logoScale = useSharedValue(0.4);
  const logoOpacity = useSharedValue(0);
  const logoGlowScale = useSharedValue(0.8);
  const logoGlowOpacity = useSharedValue(0.3);
  const titleOpacity = useSharedValue(0);
  const titleTranslateY = useSharedValue(24);
  const taglineOpacity = useSharedValue(0);
  const progressWidth = useSharedValue(0);

  const navigateNext = async () => {
    try {
      await useUserStore.getState().loadProfile();
      const { data: { session } } = await supabase.auth.getSession();
      const storeProfile = useUserStore.getState().profile;

      if (session && storeProfile?.isLoggedIn) {
        router.replace('/(tabs)');
      } else {
        router.replace('/(auth)/login');
      }
    } catch (err: any) {
      console.error('Startup check failed:', err);
      try {
        router.replace('/(auth)/login');
      } catch (navError: any) {
        setStartupError(navError?.message || err?.message || 'Failed to complete startup navigation.');
      }
    }
  };

  useEffect(() => {
    // 1. Logo entry (Spring scale & fade)
    logoScale.value = withSpring(1, { damping: 14, stiffness: 140 });
    logoOpacity.value = withTiming(1, { duration: 400 });

    // 2. Pulse glow behind logo
    logoGlowScale.value = withRepeat(
      withSequence(
        withTiming(1.3, { duration: 1200, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.9, { duration: 1200, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
    logoGlowOpacity.value = withRepeat(
      withSequence(
        withTiming(0.6, { duration: 1200, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.2, { duration: 1200, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );

    // 3. Title reveal
    titleOpacity.value = withDelay(250, withTiming(1, { duration: 450, easing: Easing.out(Easing.ease) }));
    titleTranslateY.value = withDelay(250, withTiming(0, { duration: 450, easing: Easing.out(Easing.ease) }));

    // 4. Tagline reveal
    taglineOpacity.value = withDelay(500, withTiming(1, { duration: 450 }));

    // 5. Progress line fill
    progressWidth.value = withDelay(
      200,
      withTiming(1, { duration: 1800, easing: Easing.inOut(Easing.quad) }, (finished) => {
        if (finished) {
          runOnJS(navigateNext)();
        }
      })
    );
  }, []);

  const logoAnimatedStyle = useAnimatedStyle(() => ({
    opacity: logoOpacity.value,
    transform: [{ scale: logoScale.value }],
  }));

  const glowAnimatedStyle = useAnimatedStyle(() => ({
    opacity: logoGlowOpacity.value,
    transform: [{ scale: logoGlowScale.value }],
  }));

  const titleAnimatedStyle = useAnimatedStyle(() => ({
    opacity: titleOpacity.value,
    transform: [{ translateY: titleTranslateY.value }],
  }));

  const taglineAnimatedStyle = useAnimatedStyle(() => ({
    opacity: taglineOpacity.value,
  }));

  const progressAnimatedStyle = useAnimatedStyle(() => ({
    width: `${progressWidth.value * 100}%`,
  }));

  if (startupError) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorTitle}>Startup Error</Text>
        <Text style={styles.errorMessage}>{startupError}</Text>
      </View>
    );
  }

  return (
    <Pressable style={styles.container} onPress={navigateNext}>
      {/* Background ambient lighting */}
      <View style={styles.glowTop} />
      <View style={styles.glowCenter} />

      {/* Main logo block */}
      <View style={styles.centerContent}>
        <View style={styles.logoWrapper}>
          {/* Animated halo glow ring */}
          <Animated.View style={[styles.glowRing, glowAnimatedStyle]} />

          {/* Core brain icon badge */}
          <Animated.View style={[styles.iconBadge, logoAnimatedStyle]}>
            <MaterialCommunityIcons name="brain" size={54} color="#84cc16" />
          </Animated.View>
        </View>

        {/* Text branding */}
        <Animated.View style={[styles.textWrapper, titleAnimatedStyle]}>
          <Text style={styles.brandTitle}>CORTEX</Text>
        </Animated.View>

        <Animated.View style={[styles.taglineWrapper, taglineAnimatedStyle]}>
          <Text style={styles.taglineText}>Replace scrolling with thinking.</Text>
        </Animated.View>
      </View>

      {/* Bottom progress loading line */}
      <View style={styles.bottomBar}>
        <View style={styles.progressTrack}>
          <Animated.View style={[styles.progressFill, progressAnimatedStyle]} />
        </View>
        <Text style={styles.skipHint}>Tap anywhere to skip</Text>
      </View>
    </Pressable>
  );
}

export default function EntryLogoScreen() {
  return (
    <CrashBoundary>
      <EntryLogoScreenContent />
    </CrashBoundary>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#06070A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorContainer: {
    flex: 1,
    backgroundColor: '#06070A',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#ef4444',
    marginBottom: 12,
    textAlign: 'center',
  },
  errorMessage: {
    fontSize: 14,
    color: '#94a3b8',
    textAlign: 'center',
    lineHeight: 20,
  },
  glowTop: {
    position: 'absolute',
    top: -100,
    width: 340,
    height: 340,
    borderRadius: 170,
    backgroundColor: 'rgba(132, 204, 22, 0.08)',
  },
  glowCenter: {
    position: 'absolute',
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: 'rgba(99, 102, 241, 0.06)',
  },
  centerContent: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  logoWrapper: {
    width: 120,
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    position: 'relative',
  },
  glowRing: {
    position: 'absolute',
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: 'rgba(132, 204, 22, 0.25)',
    borderWidth: 2,
    borderColor: 'rgba(132, 204, 22, 0.4)',
  },
  iconBadge: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#12161f',
    borderWidth: 1.5,
    borderColor: 'rgba(132, 204, 22, 0.35)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#84cc16',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  textWrapper: {
    alignItems: 'center',
  },
  brandTitle: {
    fontSize: 42,
    fontWeight: '900',
    color: '#ffffff',
    letterSpacing: 8,
    textAlign: 'center',
  },
  taglineWrapper: {
    marginTop: 10,
  },
  taglineText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#94a3b8',
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 50,
    alignItems: 'center',
    width: width * 0.6,
    gap: 12,
  },
  progressTrack: {
    width: '100%',
    height: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#84cc16',
    borderRadius: 2,
  },
  skipHint: {
    fontSize: 12,
    color: '#475569',
    fontWeight: '500',
  },
});


