import React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import * as Haptics from 'expo-haptics';

export interface TutorialConfig {
  gameTitle: string;
  purpose: string;
  howItWorks: string[];
  example: string;
  proTip: string;
  ctaText: string;
}

interface CortexTutorialModalProps {
  visible: boolean;
  config: TutorialConfig;
  onClose: () => void;
  onCtaPress?: () => void;
}

export const CortexTutorialModal: React.FC<CortexTutorialModalProps> = ({
  visible,
  config,
  onClose,
  onCtaPress,
}) => {
  const handleClose = () => {
    Haptics.selectionAsync().catch(() => {});
    onClose();
  };

  const handleCta = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    if (onCtaPress) {
      onCtaPress();
    } else {
      onClose();
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={handleClose}
    >
      <View style={styles.rootContainer}>
        <SafeAreaView style={styles.safeArea}>
          {/* Top Bar */}
          <View style={styles.topBar}>
            <Pressable style={styles.backBtn} onPress={handleClose} hitSlop={12}>
              <MaterialCommunityIcons name="arrow-left" size={24} color="#ffffff" />
            </Pressable>

            <Text style={styles.topTitle}>{config.gameTitle}</Text>

            <View style={styles.headerRightSpacer} />
          </View>

          {/* Scrollable Content Body */}
          <ScrollView contentContainerStyle={styles.scrollBody} showsVerticalScrollIndicator={false}>
            {/* 1. Purpose Card */}
            <View style={styles.card}>
              <View style={styles.cardHeaderRow}>
                <MaterialCommunityIcons name="bullseye-arrow" size={20} color="#38bdf8" />
                <Text style={styles.cardTitle}>Purpose</Text>
              </View>
              <Text style={styles.cardText}>{config.purpose}</Text>
            </View>

            {/* 2. How it Works Card */}
            <View style={styles.card}>
              <View style={styles.cardHeaderRow}>
                <MaterialCommunityIcons name="cogs" size={20} color="#84cc16" />
                <Text style={styles.cardTitle}>How It Works</Text>
              </View>
              {config.howItWorks.map((step, idx) => (
                <View key={idx} style={styles.stepRow}>
                  <View style={styles.stepBullet} />
                  <Text style={styles.cardText}>{step}</Text>
                </View>
              ))}
            </View>

            {/* 3. Example Card */}
            <View style={styles.card}>
              <View style={styles.cardHeaderRow}>
                <MaterialCommunityIcons name="format-list-checks" size={20} color="#facc15" />
                <Text style={styles.cardTitle}>Example</Text>
              </View>
              <View style={styles.exampleBox}>
                <Text style={styles.exampleText}>{config.example}</Text>
              </View>
            </View>

            {/* 4. Pro Tip Card */}
            <View style={styles.card}>
              <View style={styles.cardHeaderRow}>
                <MaterialCommunityIcons name="lightbulb-on-outline" size={20} color="#ec4899" />
                <Text style={styles.cardTitle}>Pro Tip</Text>
              </View>
              <Text style={styles.cardText}>{config.proTip}</Text>
            </View>
          </ScrollView>

          {/* Bottom Fixed CTA Button */}
          <View style={styles.bottomBar}>
            <Pressable style={styles.ctaButton} onPress={handleCta}>
              <Text style={styles.ctaButtonText}>{config.ctaText}</Text>
            </Pressable>
          </View>
        </SafeAreaView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  rootContainer: {
    flex: 1,
    backgroundColor: '#0a0c10',
  },
  safeArea: {
    flex: 1,
  },

  topBar: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  backBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
    textAlign: 'center',
  },
  headerRightSpacer: {
    width: 44,
  },

  scrollBody: {
    padding: 20,
    gap: 16,
  },

  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
  },
  cardText: {
    fontSize: 16,
    color: '#cbd5e1',
    lineHeight: 24,
    flex: 1,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 8,
  },
  stepBullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#38bdf8',
    marginTop: 9,
  },

  exampleBox: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    alignItems: 'center',
  },
  exampleText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#38bdf8',
  },

  bottomBar: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
  },
  ctaButton: {
    height: 56,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaButtonText: {
    fontSize: 17,
    fontWeight: '800',
    color: '#000000',
  },
});
