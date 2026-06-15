// src/theme/index.ts
// Fonte única de verdade para todo o design system do app

export const Colors = {
  // Backgrounds
  bg: {
    primary:   '#0d0d0d',
    secondary: '#141414',
    tertiary:  '#1a1a1a',
    card:      '#141414',
    input:     '#1a1a1a',
  },

  // Bordas
  border: {
    subtle:  '#1e1e1e',
    default: '#2a2a2a',
    strong:  '#333333',
  },

  // Dourado — cor de destaque da marca
  gold: {
    light:   '#e8b96a',
    default: '#c9973a',
    dark:    '#a67820',
    muted:   '#3d2e10',
  },

  // Textos
  text: {
    primary:   '#ffffff',
    secondary: '#aaaaaa',
    muted:     '#666666',
    disabled:  '#444444',
  },

  // Semânticas
  success: '#4caf50',
  error:   '#e24b4a',
  warning: '#ef9f27',
} as const;

export const Spacing = {
  xs:  4,
  sm:  8,
  md:  12,
  lg:  16,
  xl:  20,
  xxl: 28,
  xxxl: 40,
} as const;

export const Radius = {
  sm:   6,
  md:   10,
  lg:   14,
  xl:   20,
  full: 999,
} as const;

export const FontSize = {
  xs:   10,
  sm:   12,
  md:   14,
  base: 16,
  lg:   18,
  xl:   22,
  xxl:  28,
  hero: 34,
} as const;

export const FontWeight = {
  regular: '400' as const,
  medium:  '500' as const,
  bold:    '700' as const,
};

// Sombras (usadas com style spread)
export const Shadow = {
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 4,
  },
} as const;
