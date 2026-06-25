/**
 * Colors.ts
 * Système de couleurs centralisé pour le thème dark premium de l'app.
 */

export const Colors = {
  // Fond principal
  background: '#0A0A0F',
  surface: '#12121A',
  surfaceElevated: '#1A1A28',
  card: '#16162A',

  // Accent principal : violet/indigo
  primary: '#7C5CFC',
  primaryLight: '#9B80FF',
  primaryDark: '#5A3DD4',
  primaryGlow: 'rgba(124, 92, 252, 0.25)',

  // Accent secondaire : rose/magenta
  secondary: '#FF4EAA',
  secondaryGlow: 'rgba(255, 78, 170, 0.2)',

  // Accent tertiaire : orange/ambre
  tertiary: '#FF9F43',
  tertiaryGlow: 'rgba(255, 159, 67, 0.2)',

  // Texte
  textPrimary: '#FFFFFF',
  textSecondary: '#A0A0C0',
  textMuted: '#5A5A7A',

  // Bordures
  border: 'rgba(255,255,255,0.08)',
  borderActive: 'rgba(124, 92, 252, 0.5)',

  // États
  success: '#00D68F',
  error: '#FF4757',
  warning: '#FFA502',

  // Gradients (utilisé avec LinearGradient)
  gradients: {
    primary:  ['#7C5CFC', '#FF4EAA'] as const,
    dark:     ['#12121A', '#0A0A0F'] as const,
    card:     ['#1A1A28', '#12121A'] as const,
    voice:    ['#7C5CFC', '#4834D4'] as const,
    image:    ['#FF9F43', '#EE5A24'] as const,
    text:     ['#00D2D3', '#7C5CFC'] as const,
    generate: ['#FF4EAA', '#C644FC'] as const, // Rose → Violet pour AI Generator
  },
};

// Styles de mème par templateStyle retourné par l'IA
export const MemeTemplateStyles: Record<string, { bg: string[]; textColor: string }> = {
  dark:              { bg: ['#1a1a2e', '#16213e'], textColor: '#FFFFFF' },
  light:             { bg: ['#f8f9fa', '#e9ecef'], textColor: '#000000' },
  'gradient-purple': { bg: ['#7C5CFC', '#FF4EAA'], textColor: '#FFFFFF' },
  'gradient-orange': { bg: ['#FF9F43', '#EE5A24'], textColor: '#FFFFFF' },
};
