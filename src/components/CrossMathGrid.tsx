import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { colors } from '../theme';

interface CrossMathGridProps {
  onSolved?: () => void;
}

export const CrossMathGrid: React.FC<CrossMathGridProps> = ({ onSolved }) => {
  // 3x3 equation layout:
  // Row 1: 8  *  6  = 48
  // Col operators: ×  ÷
  // Row 2: ?  -  3  = 1  (8 × ? ÷ 3 -> 8 × 6 / 3 = 16 or missing 4)
  // Let's create a verified matrix:
  // Row 1: 8 × 6 = 48
  // Row 2: 4 - 3 = 1
  // Col 1: 8 ÷ 4 = 2
  // Col 2: 6 - 3 = 3
  
  const [selectedVal, setSelectedVal] = useState<number | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);

  const targetValue = 4; // Correct missing '?' value

  const handleSelectNumber = (num: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedVal(num);
    setIsCorrect(null);
  };

  const handleCheckAnswer = () => {
    if (selectedVal === targetValue) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setIsCorrect(true);
      if (onSolved) onSolved();
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setIsCorrect(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* 3x3 Grid Matrix */}
      <View style={styles.gridBoard}>
        {/* Row 1 */}
        <View style={styles.row}>
          <View style={styles.numberCell}>
            <Text style={styles.cellText}>8</Text>
          </View>
          <Text style={styles.opText}>×</Text>
          <View style={styles.numberCell}>
            <Text style={styles.cellText}>6</Text>
          </View>
          <Text style={styles.eqText}>=</Text>
          <View style={[styles.numberCell, styles.resultCell]}>
            <Text style={styles.resultText}>48</Text>
          </View>
        </View>

        {/* Vertical Operators */}
        <View style={styles.verticalOpRow}>
          <Text style={styles.opText}>÷</Text>
          <View style={styles.spacer} />
          <Text style={styles.opText}>-</Text>
          <View style={styles.spacer} />
          <View style={styles.spacer} />
        </View>

        {/* Row 2 (Interactive Question) */}
        <View style={styles.row}>
          <View style={[styles.numberCell, styles.activeAmberCell]}>
            <LinearGradient
              colors={['#F59E0B', '#D97706']}
              style={StyleSheet.absoluteFill}
            />
            <Text style={styles.activeCellText}>
              {selectedVal !== null ? selectedVal : '?'}
            </Text>
          </View>
          <Text style={styles.opText}>-</Text>
          <View style={styles.numberCell}>
            <Text style={styles.cellText}>3</Text>
          </View>
          <Text style={styles.eqText}>=</Text>
          <View style={[styles.numberCell, styles.resultCell]}>
            <Text style={styles.resultText}>1</Text>
          </View>
        </View>

        {/* Row 3 (Vertical Equals) */}
        <View style={styles.verticalOpRow}>
          <Text style={styles.eqText}>=</Text>
          <View style={styles.spacer} />
          <Text style={styles.eqText}>=</Text>
          <View style={styles.spacer} />
          <View style={styles.spacer} />
        </View>

        {/* Row 4 (Vertical Results: 8/4=2, 6-3=3) */}
        <View style={styles.row}>
          <View style={[styles.numberCell, styles.resultCell]}>
            <Text style={styles.resultText}>2</Text>
          </View>
          <View style={styles.spacer} />
          <View style={[styles.numberCell, styles.resultCell]}>
            <Text style={styles.resultText}>3</Text>
          </View>
          <View style={styles.spacer} />
          <View style={styles.spacer} />
        </View>
      </View>

      {/* Keypad selector */}
      <View style={styles.keypadSection}>
        <Text style={styles.keypadPrompt}>Select digit for amber cell (?):</Text>
        <View style={styles.keyRow}>
          {[2, 4, 5, 7, 9].map((num) => {
            const isSelected = selectedVal === num;
            return (
              <Pressable
                key={num}
                onPress={() => handleSelectNumber(num)}
                style={[
                  styles.keyBtn,
                  isSelected && styles.keyBtnSelected,
                ]}
              >
                <Text style={[styles.keyText, isSelected && styles.keyTextSelected]}>
                  {num}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* Check Answer CTA */}
        <Pressable
          onPress={handleCheckAnswer}
          disabled={selectedVal === null}
          style={[
            styles.checkBtn,
            selectedVal === null && styles.checkBtnDisabled,
            isCorrect === true && styles.checkBtnSuccess,
            isCorrect === false && styles.checkBtnError,
          ]}
        >
          <Text style={styles.checkBtnText}>
            {isCorrect === true
              ? '✓ Correct Solution (+50 XP)'
              : isCorrect === false
              ? '✕ Incorrect (Try 4)'
              : 'Check Solution'}
          </Text>
        </Pressable>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    alignItems: 'center',
  },
  gridBoard: {
    backgroundColor: '#0F1629',
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    width: '100%',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  verticalOpRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginVertical: 4,
  },
  spacer: {
    width: 48,
    height: 24,
  },

  numberCell: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: '#1E273E',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  resultCell: {
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
    borderColor: 'rgba(59, 130, 246, 0.3)',
  },
  activeAmberCell: {
    width: 48,
    height: 48,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 14,
    elevation: 8,
    borderWidth: 1,
    borderColor: '#FBBF24',
  },
  cellText: {
    fontFamily: 'Inter_600SemiBold',
    fontVariant: ['tabular-nums'],
    fontSize: 20,
    color: colors.textPrimary,
  },
  resultText: {
    fontFamily: 'Inter_600SemiBold',
    fontVariant: ['tabular-nums'],
    fontSize: 20,
    color: '#3B82F6',
  },
  activeCellText: {
    fontFamily: 'Inter_600SemiBold',
    fontVariant: ['tabular-nums'],
    fontSize: 22,
    color: '#0B1020',
  },
  opText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 18,
    color: colors.textMuted,
    width: 20,
    textAlign: 'center',
  },
  eqText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 18,
    color: colors.amber,
    width: 20,
    textAlign: 'center',
  },

  keypadSection: {
    width: '100%',
    marginTop: 20,
    alignItems: 'center',
  },
  keypadPrompt: {
    fontFamily: 'Inter_500Medium',
    fontSize: 13,
    color: colors.textMuted,
    marginBottom: 12,
  },
  keyRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  keyBtn: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: '#151C2F',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  keyBtnSelected: {
    backgroundColor: '#F59E0B',
    borderColor: '#FBBF24',
  },
  keyText: {
    fontFamily: 'Inter_600SemiBold',
    fontVariant: ['tabular-nums'],
    fontSize: 20,
    color: colors.textPrimary,
  },
  keyTextSelected: {
    color: '#0B1020',
  },

  checkBtn: {
    width: '100%',
    height: 52,
    borderRadius: 18,
    backgroundColor: '#F59E0B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkBtnDisabled: {
    opacity: 0.35,
  },
  checkBtnSuccess: {
    backgroundColor: colors.emeraldSuccess,
  },
  checkBtnError: {
    backgroundColor: colors.roseDanger,
  },
  checkBtnText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 16,
    color: '#0B1020',
  },
});
