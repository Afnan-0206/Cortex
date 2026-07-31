// Cortex Precision Color System

export const darkColors = {
  bg: '#0A0C10',
  surface: '#12151C',
  surfaceAlt: '#181C26',
  borderSubtle: '#222734',
  borderHighlight: '#32394A',
  accentPrimary: '#3B82F6',
  accentMuted: 'rgba(59, 130, 246, 0.15)',
  textPrimary: '#F1F5F9',
  textSecondary: '#94A3B8',
  textMuted: '#64748B',
  success: '#34D399',
  warning: '#FBBF24',
  error: '#F87171',
  ctaBg: '#F1F5F9',
  ctaText: '#0A0C10',
  cardShadow: 'transparent',
};

export const lightColors = {
  bg: '#F8FAFC',
  surface: '#FFFFFF',
  surfaceAlt: '#F1F5F9',
  borderSubtle: '#E2E8F0',
  borderHighlight: '#CBD5E1',
  accentPrimary: '#0F172A',
  accentMuted: 'rgba(15, 23, 42, 0.08)',
  textPrimary: '#0F172A',
  textSecondary: '#475569',
  textMuted: '#94A3B8',
  success: '#059669',
  warning: '#D97706',
  error: '#DC2626',
  ctaBg: '#0F172A',
  ctaText: '#FFFFFF',
  cardShadow: 'rgba(0, 0, 0, 0.03)',
};

// Default export uses dark mode palette
export const colors = {
  ...darkColors,

  // Semantic aliases for compatibility across screens
  border: darkColors.borderSubtle,
  bgNavy: darkColors.bg,
  bgVoid: darkColors.bg,
  bgDeep: darkColors.surfaceAlt,
  surfaceCard: darkColors.surface,
  surfaceElevated: darkColors.surfaceAlt,

  amber: darkColors.warning,
  amberGlow: 'transparent',
  amberLight: darkColors.warning,
  electricBlue: darkColors.accentPrimary,
  blueGlow: 'transparent',
  purpleGlow: 'transparent',
  emeraldSuccess: darkColors.success,
  successGlow: 'transparent',
  roseDanger: darkColors.error,
  dangerGlow: 'transparent',
  danger: darkColors.error,

  accentGlow1: darkColors.accentPrimary,
  accentGlow2: darkColors.accentPrimary,
  accentGlow3: darkColors.accentPrimary,
  accent: darkColors.accentPrimary,
  secondary: darkColors.textSecondary,
  primaryDim: darkColors.surfaceAlt,

  bgPrimary: darkColors.bg,
  bgSecondary: darkColors.surfaceAlt,
  card: darkColors.surface,

  primary: darkColors.ctaBg,
  primaryPurple: darkColors.accentPrimary,
  primaryBlue: darkColors.accentPrimary,
  glowViolet: darkColors.accentPrimary,
  glowBlue: darkColors.accentPrimary,
  glowAmber: darkColors.warning,

  streak: darkColors.warning,

  borderAmber: darkColors.borderSubtle,
  borderBlue: darkColors.borderSubtle,
  glassHighlight: 'transparent',
};
