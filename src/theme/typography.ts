import { TextStyle } from 'react-native';
import { colors } from './colors';

export const typography: Record<string, TextStyle> = {
  display: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 40,
    lineHeight: 44,
    color: colors.textPrimary,
    letterSpacing: -0.8,
  },
  title: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 28,
    lineHeight: 32,
    color: colors.textPrimary,
    letterSpacing: -0.4,
  },
  heading: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 22,
    lineHeight: 28,
    color: colors.textPrimary,
    letterSpacing: -0.2,
  },
  body: {
    fontFamily: 'Inter_400Regular',
    fontSize: 16,
    lineHeight: 24,
    color: colors.textSecondary,
    letterSpacing: 0,
  },
  caption: {
    fontFamily: 'Inter_500Medium',
    fontSize: 13,
    lineHeight: 18,
    color: colors.textMuted,
    letterSpacing: 0,
  },
  micro: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 11,
    lineHeight: 16,
    color: colors.textMuted,
    letterSpacing: 0.5,
  },
  readoutLarge: {
    fontFamily: 'Inter_600SemiBold',
    fontVariant: ['tabular-nums'],
    fontSize: 40,
    lineHeight: 44,
    color: colors.textPrimary,
    letterSpacing: -0.8,
  },
  readoutMedium: {
    fontFamily: 'Inter_600SemiBold',
    fontVariant: ['tabular-nums'],
    fontSize: 28,
    lineHeight: 32,
    color: colors.textPrimary,
    letterSpacing: -0.4,
  },
  numericReadout: {
    fontFamily: 'Inter_600SemiBold',
    fontVariant: ['tabular-nums'],
    fontSize: 16,
    lineHeight: 22,
    color: colors.textPrimary,
  },
};
