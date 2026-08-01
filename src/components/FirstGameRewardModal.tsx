import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Modal,
  Dimensions,
} from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import * as Haptics from 'expo-haptics';
import Animated, {
  FadeInUp,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withTiming,
  withRepeat,
} from 'react-native-reanimated';

const { width } = Dimensions.get('window');

interface FirstGameRewardModalProps {
  visible: boolean;
  coinsEarned: number;
  totalCoins: number;
  onContinue: () => void;
}

export const FirstGameRewardModal: React.FC<FirstGameRewardModalProps> = ({
  visible,
  coinsEarned,
  totalCoins,
  onContinue,
}) => {
  const coinScale = useSharedValue(0.5);
  const coinRotate = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      coinScale.value = withSpring(1.0, { damping: 10, stiffness: 140 });
      coinRotate.value = withRepeat(
        withSequence(
          withTiming(-6, { duration: 800 }),
          withTiming(6, { duration: 800 })
        ),
        -1,
        true
      );
    }
  }, [visible]);

  const animatedCoinStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: coinScale.value },
      { rotate: `${coinRotate.value}deg` },
    ],
  }));

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.backdrop}>
        <Animated.View entering={FadeInUp.duration(300)} style={styles.card}>
          {/* Top Coin Badge */}
          <Animated.View style={[styles.coinBadge, animatedCoinStyle]}>
            <MaterialCommunityIcons name="circle-multiple" size={48} color="#facc15" />
          </Animated.View>

          {/* Title & Subtext */}
          <Text style={styles.title}>First Game Complete!</Text>
          <Text style={styles.subtitle}>
            Welcome to Cortex! You’ve earned{' '}
            <Text style={styles.highlight}>+{coinsEarned} Cortex Coins</Text> for completing your very first duel.
          </Text>

          {/* Total Coin Balance Capsule */}
          <View style={styles.balanceCapsule}>
            <MaterialCommunityIcons name="wallet-outline" size={16} color="#94a3b8" />
            <Text style={styles.balanceText}>Balance: {totalCoins} Coins</Text>
          </View>

          {/* Action Button */}
          <Pressable style={styles.continueBtn} onPress={onContinue}>
            <Text style={styles.continueBtnText}>Explore Arena Modes</Text>
          </Pressable>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(6, 8, 16, 0.88)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },

  card: {
    width: width * 0.86,
    backgroundColor: '#121622',
    borderRadius: 28,
    padding: 28,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(250, 204, 21, 0.35)',
    shadowColor: '#facc15',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },

  coinBadge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(250, 204, 21, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    borderWidth: 2,
    borderColor: 'rgba(250, 204, 21, 0.4)',
  },

  title: {
    fontSize: 24,
    fontWeight: '900',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 10,
    letterSpacing: -0.4,
  },

  subtitle: {
    fontSize: 15,
    color: '#94a3b8',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 20,
  },

  highlight: {
    color: '#facc15',
    fontWeight: '800',
  },

  balanceCapsule: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },

  balanceText: {
    color: '#cbd5e1',
    fontSize: 14,
    fontWeight: '700',
  },

  continueBtn: {
    width: '100%',
    height: 52,
    backgroundColor: '#84cc16',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },

  continueBtnText: {
    fontSize: 16,
    fontWeight: '900',
    color: '#0d0e12',
    letterSpacing: 0.5,
  },
});
